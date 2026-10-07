import type { Song } from "./types";

export const MIDI_DURATION = 345.346;

// The complete practice score is created from the supplied MIDI in MidiPlayer.
// This placeholder keeps the UI stable while the browser is loading that file.
export const weddingMarch: Song = {
  title: "結婚行進曲",
  subtitle: "C調21穴向け・フル曲を読み込み中",
  duration: MIDI_DURATION,
  notes: [],
};
