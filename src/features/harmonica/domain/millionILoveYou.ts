import type { MidiNoteEvent } from "../services/MidiFileParser";
import { HARMONICA_LAYOUT } from "./tuning";
import type { HarmonicaNote, Song } from "./types";

// The first chorus melody ends at 101.324s; leave its closing accompaniment
// through 104.09s, before the next verse begins at 104.24s.
const PRACTICE_DURATION = 104.1;
const MELODY_CHANNEL = 0;
const MELODY_TRANSPOSE = -8;

/** Builds a C-tuned practice score from the shared MIDI. */
export function createMillionILoveYouSong(midiNotes: MidiNoteEvent[]): Song {
  const notes: HarmonicaNote[] = midiNotes
    .filter((note) => note.channel === MELODY_CHANNEL && note.at < PRACTICE_DURATION)
    .map((note) => {
      const position = HARMONICA_LAYOUT.find((candidate) => candidate.midi === note.midi + MELODY_TRANSPOSE);
      if (!position) throw new Error("このMIDIの音程は、この練習曲に対応していません");
      return {
        hole: position.hole,
        breath: position.breath,
        at: Number(note.at.toFixed(3)),
        length: Number(Math.min(note.length, PRACTICE_DURATION - note.at).toFixed(3)),
      };
    });

  if (!notes.length) throw new Error("このMIDIからメロディを読み取れませんでした");

  return {
    title: "100万回の「I love you」",
    artist: "Rake",
    subtitle: "C調21穴・共有MIDIから変換 約1分44秒",
    credit: "共有MIDIの主旋律をC調21穴向けに変換",
    duration: PRACTICE_DURATION,
    notes,
    midiAudio: {
      notes: midiNotes,
      sourceOffset: 0,
      melodyChannel: MELODY_CHANNEL,
      melodyTranspose: MELODY_TRANSPOSE,
      accompanimentTranspose: 4,
      guitarChannel: 6,
    },
  };
}
