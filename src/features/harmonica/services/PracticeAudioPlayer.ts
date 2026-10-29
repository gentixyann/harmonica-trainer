import type { MidiAudioSource, Song } from "../domain/types";
import { pitchFor } from "../domain/tuning";
import { HarmonicaSamplePlayer } from "./HarmonicaSamplePlayer";
import type { MidiNoteEvent } from "./MidiFileParser";

type PlaybackOptions = {
  from: number;
  duration: number;
  rate: number;
};

const LOOK_AHEAD_SECONDS = 1.2;
const SCHEDULER_INTERVAL_MS = 200;
const SCHEDULING_LEAD_SECONDS = 0.12;

/** Plays generated practice notes or a MIDI-backed arrangement in sync with the falling bars. */
export class PracticeAudioPlayer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private scheduler: number | null = null;
  private generation = 0;
  private readonly harmonicaSamples = new HarmonicaSamplePlayer();
  private noiseBuffer: AudioBuffer | null = null;

  async play(song: Song, options: PlaybackOptions) {
    this.stop();
    const generation = this.generation;
    const context = this.context ?? new AudioContext();
    this.context = context;
    await context.resume();

    if (song.midiAudio) {
      await this.harmonicaSamples.load(context);
      if (generation !== this.generation) return 0;
      const startsAt = this.playMidi(context, song.midiAudio.notes, song, song.midiAudio, options, SCHEDULING_LEAD_SECONDS);
      return Math.max(0, startsAt - context.currentTime) + audioOutputLatency(context);
    }

    await this.harmonicaSamples.load(context);
    if (generation !== this.generation) return 0;
    const startsAt = this.playPracticeNotes(context, song, options, SCHEDULING_LEAD_SECONDS);
    return Math.max(0, startsAt - context.currentTime) + audioOutputLatency(context);
  }

  stop() {
    this.generation += 1;
    if (this.scheduler !== null) window.clearInterval(this.scheduler);
    this.scheduler = null;
    for (const source of this.sources) {
      try { source.stop(); } catch { /* source has already ended */ }
    }
    this.sources = [];
    this.master?.disconnect();
    this.master = null;
  }

  private playMidi(
    context: AudioContext,
    midiNotes: MidiNoteEvent[],
    song: Song,
    source: MidiAudioSource,
    { from, duration, rate }: PlaybackOptions,
    schedulingLead: number,
  ) {
    const master = context.createGain();
    master.gain.value = 0.72;
    master.connect(context.destination);
    this.master = master;

    const relativeUntil = Math.min(song.duration, from + duration);
    const sourceFrom = source.sourceOffset + from;
    const sourceUntil = source.sourceOffset + relativeUntil;
    const playableNotes = midiNotes.filter((note) => note.at < sourceUntil && note.at + note.length > sourceFrom);
    const contextStart = context.currentTime + schedulingLead;
    let cursor = 0;

    const scheduleWindow = () => {
      const relativeNow = from + Math.max(0, context.currentTime - contextStart) * rate;
      const sourceWindowEnd = source.sourceOffset + Math.min(relativeUntil, relativeNow + LOOK_AHEAD_SECONDS * rate);

      while (cursor < playableNotes.length && playableNotes[cursor].at < sourceWindowEnd) {
        const note = playableNotes[cursor++];
        const clippedStart = Math.max(note.at, sourceFrom);
        const clippedEnd = Math.min(note.at + note.length, sourceUntil);
        if (clippedEnd <= clippedStart) continue;

        const startsAt = contextStart + (clippedStart - sourceFrom) / rate;
        if (note.channel === 9) {
          this.schedulePercussion(context, note.midi, note.velocity, startsAt, master);
          continue;
        }

        const transpose = note.channel === source.melodyChannel
          ? source.melodyTranspose
          : source.accompanimentTranspose;
        const midi = note.midi + transpose;
        if (note.channel === source.melodyChannel) {
          this.scheduleHarmonicaNote(context, midi, note.velocity, startsAt, (clippedEnd - clippedStart) / rate, master);
        } else {
          this.schedulePitchedNote(context, midi, note.velocity, note.program, startsAt, (clippedEnd - clippedStart) / rate, master);
        }
      }

      if (cursor >= playableNotes.length && this.scheduler !== null) {
        window.clearInterval(this.scheduler);
        this.scheduler = null;
      }
    };

    scheduleWindow();
    if (cursor < playableNotes.length) {
      this.scheduler = window.setInterval(scheduleWindow, SCHEDULER_INTERVAL_MS);
    }
    return contextStart;
  }

  private playPracticeNotes(
    context: AudioContext,
    song: Song,
    { from, duration, rate }: PlaybackOptions,
    schedulingLead: number,
  ) {
    const master = context.createGain();
    master.gain.value = 1;
    master.connect(context.destination);
    this.master = master;

    const until = from + duration;
    const startsAt = context.currentTime + schedulingLead;
    for (const note of song.notes) {
      const end = note.at + (note.length ?? 0.4);
      if (note.at >= until || end <= from) continue;
      const midi = pitchFor(note.hole, note.breath);
      if (midi === undefined) continue;
      const noteStart = Math.max(note.at, from);
      const noteEnd = Math.min(end, until);
      this.scheduleHarmonicaNote(context, midi, 104, startsAt + (noteStart - from) / rate, (noteEnd - noteStart) / rate, master);
    }
    return startsAt;
  }

  private scheduleHarmonicaNote(
    context: AudioContext,
    midi: number,
    velocity: number,
    startsAt: number,
    duration: number,
    destination: AudioNode,
  ) {
    const sources = this.harmonicaSamples.schedule(context, midi, velocity, startsAt, duration, destination);
    sources.forEach((source) => this.trackSource(source));
  }

  private schedulePitchedNote(
    context: AudioContext,
    midi: number,
    velocity: number,
    program: number,
    startsAt: number,
    duration: number,
    destination: AudioNode,
  ) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const profile = instrumentProfile(program);
    const safeDuration = Math.max(0.035, duration);
    const peak = Math.max(0.002, velocity / 127 * profile.level);

    oscillator.type = profile.wave;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    filter.type = "lowpass";
    filter.frequency.value = profile.filter;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(peak, startsAt + Math.min(profile.attack, safeDuration / 3));
    gain.gain.setValueAtTime(peak * profile.sustain, startsAt + Math.max(profile.attack, safeDuration * 0.58));
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + safeDuration);

    oscillator.connect(filter).connect(gain).connect(destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + safeDuration + 0.01);
    this.trackSource(oscillator);
  }

  private schedulePercussion(
    context: AudioContext,
    midi: number,
    velocity: number,
    startsAt: number,
    destination: AudioNode,
  ) {
    if (midi === 35 || midi === 36) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(130, startsAt);
      oscillator.frequency.exponentialRampToValueAtTime(48, startsAt + 0.16);
      gain.gain.setValueAtTime(Math.max(0.015, velocity / 127 * 0.085), startsAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.2);
      oscillator.connect(gain).connect(destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.21);
      this.trackSource(oscillator);
      return;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const isCymbal = midi >= 42;
    const length = isCymbal ? 0.09 : 0.16;
    source.buffer = this.getNoiseBuffer(context);
    filter.type = isCymbal ? "highpass" : "bandpass";
    filter.frequency.value = isCymbal ? 5200 : 1700;
    gain.gain.setValueAtTime(Math.max(0.008, velocity / 127 * (isCymbal ? 0.026 : 0.045)), startsAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + length);
    source.connect(filter).connect(gain).connect(destination);
    source.start(startsAt, 0, length);
    this.trackSource(source);
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === context.sampleRate) return this.noiseBuffer;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.25), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }

  private trackSource(source: AudioScheduledSourceNode) {
    this.sources.push(source);
    source.addEventListener("ended", () => {
      this.sources = this.sources.filter((activeSource) => activeSource !== source);
    });
  }
}

function instrumentProfile(program: number) {
  if (program >= 32 && program <= 39) return { wave: "triangle" as OscillatorType, attack: 0.012, sustain: 0.66, level: 0.04, filter: 1100 };
  if (program >= 16 && program <= 23) return { wave: "sine" as OscillatorType, attack: 0.04, sustain: 0.86, level: 0.028, filter: 2600 };
  if (program >= 24 && program <= 31) return { wave: "triangle" as OscillatorType, attack: 0.006, sustain: 0.35, level: 0.034, filter: 2400 };
  if (program >= 48 && program <= 55) return { wave: "sine" as OscillatorType, attack: 0.05, sustain: 0.78, level: 0.026, filter: 3000 };
  return { wave: "triangle" as OscillatorType, attack: 0.008, sustain: 0.38, level: 0.03, filter: 2800 };
}

function audioOutputLatency(context: AudioContext) {
  const baseLatency = Number.isFinite(context.baseLatency) ? context.baseLatency : 0;
  const outputLatency = Number.isFinite(context.outputLatency) ? context.outputLatency : 0;
  return baseLatency + outputLatency;
}
