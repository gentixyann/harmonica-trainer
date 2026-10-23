import melodyNotes from "../data/millionILoveYouNotes.json";
import type { HarmonicaNote, Song } from "./types";

const PRACTICE_DURATION = 71;

/**
 * The purchased Yamaha melody MIDI is the timing source for both the backing
 * track and the falling notes. The melody is moved from A-flat to C and then
 * down one octave so every note lands on an exact TOMBO 3121 C reed.
 */
export const millionILoveYou: Song = {
  title: "100万回の「I love you」",
  artist: "Rake",
  subtitle: "C調21穴・原曲MIDI準拠 約1分11秒",
  credit: "出典：ヤマハ『ぷりんと楽譜』メロディMIDIを個人練習用にC調・短尺化",
  duration: PRACTICE_DURATION,
  notes: melodyNotes as HarmonicaNote[],
  midiAudio: {
    url: "/songs/million-i-love-you.mid",
    sourceOffset: 0,
    melodyChannel: 0,
    melodyTranspose: -8,
    accompanimentTranspose: 4,
  },
};
