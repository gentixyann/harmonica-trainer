export type Breath = "blow" | "draw";

export type HarmonicaNote = {
  hole: number;
  breath: Breath;
  at: number;
  length?: number;
};

export type MidiAudioSource = {
  notes: import("../services/MidiFileParser").MidiNoteEvent[];
  sourceOffset: number;
  melodyChannel: number;
  melodyTranspose: number;
  accompanimentTranspose: number;
};

export type Song = {
  title: string;
  artist: string;
  subtitle: string;
  credit: string;
  duration: number;
  notes: HarmonicaNote[];
  midiAudio?: MidiAudioSource;
};
