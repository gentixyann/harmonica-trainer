import { pitchFor } from "../domain/tuning";
import type { HarmonicaNote } from "../domain/types";

export class HarmonicaSynth {
  private context: AudioContext | null = null;

  play(note: HarmonicaNote) {
    const context = this.context ?? new AudioContext();
    this.context = context;
    const pitch = pitchFor(note.hole, note.breath);
    if (!pitch) return;

    const lead = context.createOscillator();
    const shimmer = context.createOscillator();
    const gain = context.createGain();
    const length = (note.length ?? 0.58) * 0.72;

    lead.type = "triangle";
    lead.frequency.value = pitch;
    shimmer.type = "sine";
    shimmer.frequency.value = pitch * 2;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + length);

    lead.connect(gain).connect(context.destination);
    shimmer.connect(gain);
    lead.start();
    shimmer.start();
    lead.stop(context.currentTime + length + 0.03);
    shimmer.stop(context.currentTime + length + 0.03);
  }
}
