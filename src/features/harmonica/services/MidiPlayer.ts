import { Midi } from "@tonejs/midi";
import { positionForMidi } from "../domain/tuning";
import type { HarmonicaNote, Song } from "../domain/types";

type MidiEvent = {
  frequency: number;
  time: number;
  duration: number;
  velocity: number;
};

type PlaybackOptions = {
  from: number;
  duration: number;
  speed: number;
};

type PlaybackSession = {
  context: AudioContext;
  from: number;
  until: number;
  speed: number;
  contextStart: number;
  nextEventIndex: number;
  timer: number;
};

/** Loads the complete MIDI once, then keeps audio scheduling in small windows. */
export class MidiPlayer {
  private context: AudioContext | null = null;
  private events: MidiEvent[] = [];
  private sources: OscillatorNode[] = [];
  private session: PlaybackSession | null = null;

  async load(url: string): Promise<Song> {
    const midi = await Midi.fromUrl(url);
    this.events = midi.tracks.flatMap((track) => track.notes.map((note) => ({
      frequency: 440 * 2 ** ((note.midi - 69) / 12),
      time: note.time,
      duration: note.duration,
      velocity: note.velocity,
    }))).sort((a, b) => a.time - b.time);

    return {
      title: "結婚行進曲",
      subtitle: "C調21穴向け・フル曲練習版",
      duration: midi.duration,
      notes: extractMelody(midi),
    };
  }

  async play({ from, duration, speed }: PlaybackOptions) {
    this.stop();
    const context = this.context ?? new AudioContext();
    this.context = context;
    await context.resume();

    const session: PlaybackSession = {
      context,
      from,
      until: from + duration,
      speed,
      contextStart: context.currentTime + 0.04,
      nextEventIndex: this.events.findIndex((event) => event.time + event.duration > from),
      timer: 0,
    };
    if (session.nextEventIndex < 0) return;

    this.session = session;
    this.scheduleUpcoming(session);
    session.timer = window.setInterval(() => this.scheduleUpcoming(session), 250);
  }

  stop() {
    if (this.session) window.clearInterval(this.session.timer);
    this.session = null;
    for (const source of this.sources) {
      try { source.stop(); } catch { /* source has already ended */ }
    }
    this.sources = [];
  }

  private scheduleUpcoming(session: PlaybackSession) {
    if (this.session !== session) return;
    const sourceNow = session.from + Math.max(0, session.context.currentTime - session.contextStart) * session.speed;
    const sourceAhead = Math.min(session.until, sourceNow + 3 * session.speed);

    while (session.nextEventIndex < this.events.length) {
      const event = this.events[session.nextEventIndex];
      if (event.time > sourceAhead || event.time >= session.until) break;
      session.nextEventIndex += 1;

      const noteStart = Math.max(event.time, session.from, sourceNow);
      const noteEnd = Math.min(event.time + event.duration, session.until);
      if (noteEnd <= noteStart) continue;

      const startAt = Math.max(session.context.currentTime + 0.005, session.contextStart + (noteStart - session.from) / session.speed);
      this.scheduleNote(session.context, event, startAt, (noteEnd - noteStart) / session.speed);
    }

    if (session.nextEventIndex >= this.events.length || sourceNow >= session.until) window.clearInterval(session.timer);
  }

  private scheduleNote(context: AudioContext, event: MidiEvent, startAt: number, duration: number) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const volume = Math.max(event.velocity * 0.06, 0.008);

    oscillator.type = "triangle";
    oscillator.frequency.value = event.frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + Math.min(0.015, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + Math.max(duration - 0.02, duration / 2));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration);
    oscillator.addEventListener("ended", () => { this.sources = this.sources.filter((source) => source !== oscillator); });
    this.sources.push(oscillator);
  }
}

function extractMelody(midi: Midi): HarmonicaNote[] {
  const melodyTrack = midi.tracks[0];
  const highestNotes = new Map<number, typeof melodyTrack.notes[number]>();

  for (const note of melodyTrack.notes) {
    const existing = highestNotes.get(note.time);
    if (!existing || note.midi > existing.midi) highestNotes.set(note.time, note);
  }

  return [...highestNotes.values()]
    .sort((a, b) => a.time - b.time)
    .map((note) => {
      const position = positionForMidi(note.midi);
      return { hole: position.hole, breath: position.breath, at: note.time, length: Math.max(note.duration, 0.08) };
    });
}
