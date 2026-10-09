import type { Song } from "../domain/types";
import { pitchFor } from "../domain/tuning";

type PlaybackOptions = {
  from: number;
  duration: number;
};

/** Plays the practice score as one note at a time, matching the falling bars. */
export class PracticeAudioPlayer {
  private context: AudioContext | null = null;
  private sources: OscillatorNode[] = [];

  async play(song: Song, { from, duration }: PlaybackOptions) {
    this.stop();
    const context = this.context ?? new AudioContext();
    this.context = context;
    await context.resume();

    const until = from + duration;
    const startsAt = context.currentTime + 0.04;
    for (const note of song.notes) {
      const end = note.at + (note.length ?? 0.4);
      if (note.at >= until || end <= from) continue;
      const midi = pitchFor(note.hole, note.breath);
      if (midi === undefined) continue;
      const noteStart = Math.max(note.at, from);
      const noteEnd = Math.min(end, until);
      this.scheduleNote(context, midi, startsAt + noteStart - from, noteEnd - noteStart);
    }
  }

  stop() {
    for (const source of this.sources) {
      try { source.stop(); } catch { /* source has already ended */ }
    }
    this.sources = [];
  }

  private scheduleNote(context: AudioContext, midi: number, startsAt: number, duration: number) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startsAt + Math.min(0.02, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + Math.max(duration - 0.03, duration / 2));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration);
    oscillator.addEventListener("ended", () => { this.sources = this.sources.filter((source) => source !== oscillator); });
    this.sources.push(oscillator);
  }
}
