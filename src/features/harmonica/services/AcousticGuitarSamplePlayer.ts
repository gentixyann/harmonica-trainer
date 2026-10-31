const SAMPLE_BASE_URL = "/audio/guitar/meta-steel-guitar";

type GuitarSample = {
  midi: number;
  file: string;
};

type LoadedSample = GuitarSample & { buffer: AudioBuffer };

// Medium-velocity recordings for every pitch used by the transposed guitar
// channel in the first chorus of the user's MIDI.
const SAMPLES: GuitarSample[] = [
  { midi: 47, file: "INSGuitarSteel_StringA_Vel02_B2_01.mp3" },
  { midi: 48, file: "INSGuitarSteel_StringA_Vel02_C3_01.mp3" },
  { midi: 52, file: "INSGuitarSteel_StringD_Vel02_E3_01.mp3" },
  { midi: 53, file: "INSGuitarSteel_StringD_Vel02_F3_01.mp3" },
  { midi: 55, file: "INSGuitarSteel_StringG_Vel02_G3_01.mp3" },
  { midi: 57, file: "INSGuitarSteel_StringG_Vel02_A3_01.mp3" },
  { midi: 59, file: "INSGuitarSteel_StringG_Vel02_B3_01.mp3" },
  { midi: 60, file: "INSGuitarSteel_StringB_Vel02_C4_01.mp3" },
  { midi: 62, file: "INSGuitarSteel_StringB_Vel02_D4_01.mp3" },
  { midi: 64, file: "INSGuitarSteel_StringHighE_Vel02_E4_01.mp3" },
  { midi: 65, file: "INSGuitarSteel_StringHighE_Vel02_F4_01.mp3" },
  { midi: 66, file: "INSGuitarSteel_StringHighE_Vel02_Fs4_01.mp3" },
  { midi: 67, file: "INSGuitarSteel_StringHighE_Vel02_G4_01.mp3" },
  { midi: 69, file: "INSGuitarSteel_StringHighE_Vel02_A4_01.mp3" },
  { midi: 71, file: "INSGuitarSteel_StringHighE_Vel02_B4_01.mp3" },
  { midi: 72, file: "INSGuitarSteel_StringHighE_Vel02_C5_01.mp3" },
];

const ATTACK_SECONDS = 0.004;
const RELEASE_SECONDS = 0.075;

/** Plays recorded steel-string guitar plucks at the MIDI note times. */
export class AcousticGuitarSamplePlayer {
  private buffers = new Map<number, LoadedSample>();
  private loading: Promise<void> | null = null;
  private context: AudioContext | null = null;

  async load(context: AudioContext) {
    if (this.context === context && this.buffers.size === SAMPLES.length) return;
    if (this.context === context && this.loading) return this.loading;

    this.context = context;
    this.buffers.clear();
    this.loading = Promise.all(SAMPLES.map(async (sample) => {
      const response = await fetch(`${SAMPLE_BASE_URL}/${sample.file}`);
      if (!response.ok) throw new Error(`ギター音源を読み込めませんでした (${response.status})`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      this.buffers.set(sample.midi, { ...sample, buffer });
    })).then(() => undefined).catch((error) => {
      this.loading = null;
      throw error;
    });

    return this.loading;
  }

  schedule(
    context: AudioContext,
    midi: number,
    velocity: number,
    startsAt: number,
    duration: number,
    destination: AudioNode,
  ) {
    const sample = this.buffers.get(midi) ?? this.nearestSample(midi);
    if (!sample) throw new Error("ギター音源の準備が完了していません");

    const source = context.createBufferSource();
    const gain = context.createGain();
    const playbackRate = 2 ** ((midi - sample.midi) / 12);
    const availableSeconds = sample.buffer.duration / playbackRate;
    const heldSeconds = Math.min(Math.max(0.035, duration), availableSeconds - RELEASE_SECONDS);
    const releaseAt = startsAt + heldSeconds;
    const peak = Math.max(0.03, velocity / 127 * 0.8);

    source.buffer = sample.buffer;
    source.playbackRate.value = playbackRate;
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.linearRampToValueAtTime(peak, startsAt + ATTACK_SECONDS);
    gain.gain.setValueAtTime(peak, releaseAt);
    gain.gain.linearRampToValueAtTime(0, releaseAt + RELEASE_SECONDS);

    source.connect(gain).connect(destination);
    source.start(startsAt);
    source.stop(releaseAt + RELEASE_SECONDS + 0.01);
    return source;
  }

  private nearestSample(midi: number) {
    return [...this.buffers.values()].reduce<LoadedSample | null>((nearest, sample) => {
      if (!nearest) return sample;
      return Math.abs(sample.midi - midi) < Math.abs(nearest.midi - midi) ? sample : nearest;
    }, null);
  }
}
