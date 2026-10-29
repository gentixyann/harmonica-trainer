const SAMPLE_BASE_URL = "/audio/harmonica/vcsl-special20-c";

type HarmonicaSample = {
  midi: number;
  file: string;
  startOffsetSeconds: number;
};

type LoadedSample = HarmonicaSample & {
  buffer: AudioBuffer;
};

const SAMPLES: HarmonicaSample[] = [
  // These offsets skip the silence at the start of each bundled recording.
  // Without them, short repeated MIDI notes can end before the reed is heard.
  { midi: 48, file: "C3.wav", startOffsetSeconds: 0.025 },
  { midi: 52, file: "E3.wav", startOffsetSeconds: 0 },
  { midi: 60, file: "C4.wav", startOffsetSeconds: 0.065 },
  { midi: 64, file: "E4.wav", startOffsetSeconds: 0.045 },
  { midi: 67, file: "G4.wav", startOffsetSeconds: 0 },
  { midi: 72, file: "C5.wav", startOffsetSeconds: 0.07 },
  { midi: 76, file: "E5.wav", startOffsetSeconds: 0.08 },
  { midi: 79, file: "G5.wav", startOffsetSeconds: 0.025 },
  { midi: 84, file: "C6.wav", startOffsetSeconds: 0 },
];

const ATTACK_SECONDS = 0.008;
const RELEASE_SECONDS = 0.075;

/** Plays CC0 harmonica recordings as a two-reed tremolo instrument. */
export class HarmonicaSamplePlayer {
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
      if (!response.ok) throw new Error(`ハーモニカ音源を読み込めませんでした (${response.status})`);
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
    const sample = this.nearestSample(midi);
    if (!sample) throw new Error("ハーモニカ音源の準備が完了していません");

    const safeDuration = Math.max(0.06, duration);
    const releaseStart = startsAt + Math.max(ATTACK_SECONDS, safeDuration - RELEASE_SECONDS);
    const endsAt = startsAt + safeDuration + RELEASE_SECONDS;
    const sampleDetune = (midi - sample.midi) * 100;
    const reedDetunes = tremoloReedDetunes(midi);
    const sources: AudioBufferSourceNode[] = [];

    reedDetunes.forEach((reedDetune, index) => {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const peak = Math.max(0.04, velocity / 127 * 0.48);
      const reedStart = startsAt + index * 0.004;

      source.buffer = sample.buffer;
      source.detune.setValueAtTime(sampleDetune + reedDetune, startsAt);
      filter.type = "lowpass";
      filter.frequency.value = 6800;
      filter.Q.value = 0.45;
      gain.gain.setValueAtTime(0.0001, reedStart);
      gain.gain.exponentialRampToValueAtTime(peak, reedStart + Math.min(ATTACK_SECONDS, safeDuration / 3));
      gain.gain.setValueAtTime(peak * 0.92, releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);

      source.connect(filter).connect(gain).connect(destination);
      source.start(reedStart, sample.startOffsetSeconds);
      source.stop(endsAt + 0.01);
      sources.push(source);
    });

    return sources;
  }

  private nearestSample(midi: number) {
    return [...this.buffers.values()].reduce<LoadedSample | null>((nearest, sample) => {
      if (!nearest) return sample;
      return Math.abs(sample.midi - midi) < Math.abs(nearest.midi - midi) ? sample : nearest;
    }, null);
  }
}

function tremoloReedDetunes(midi: number) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const rangePosition = Math.max(0, Math.min(1, (midi - 48) / 36));
  const beatFrequency = 2.4 + rangePosition * 3;
  const halfBeat = beatFrequency / 2;
  const lower = 1200 * Math.log2((frequency - halfBeat) / frequency);
  const upper = 1200 * Math.log2((frequency + halfBeat) / frequency);
  return [lower, upper];
}
