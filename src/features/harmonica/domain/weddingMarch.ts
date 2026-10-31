import type { HarmonicaNote, Song } from "./types";

type ScoreNote = Pick<HarmonicaNote, "hole" | "breath">;
type TimedScoreNote = ScoreNote & { at: number; length: number };

// Tempo read from the supplied source MIDI: ♩ = 130.
const ORIGINAL_BPM = 130;
const BEAT = 60 / ORIGINAL_BPM;
// Preserve most of a beat for breathing; only trim the conspicuously long rests.
const MAX_PHRASE_REST = BEAT * 3 / 4;

const c: ScoreNote = { hole: 8, breath: "blow" };
const e: ScoreNote = { hole: 10, breath: "blow" };
const g: ScoreNote = { hole: 12, breath: "blow" };

const mainTheme: ScoreNote[] = [
  { hole: 14, breath: "blow" }, { hole: 15, breath: "draw" },
  { hole: 13, breath: "draw" }, { hole: 12, breath: "blow" },
  { hole: 11, breath: "draw" },
  { hole: 9, breath: "draw" }, { hole: 8, breath: "blow" },
];

const bridge: ScoreNote[] = [
  { hole: 7, breath: "draw" }, { hole: 8, breath: "blow" },
  { hole: 9, breath: "draw" }, { hole: 12, breath: "blow" },
  { hole: 9, breath: "draw" }, { hole: 10, breath: "blow" },
];

const rise: ScoreNote[] = [
  { hole: 8, breath: "blow" }, { hole: 10, breath: "blow" }, { hole: 12, breath: "blow" },
];

const endingBridge: ScoreNote[] = [
  { hole: 7, breath: "draw" }, { hole: 8, breath: "blow" }, { hole: 10, breath: "blow" },
  { hole: 9, breath: "draw" }, { hole: 10, breath: "blow" }, { hole: 9, breath: "draw" },
  { hole: 8, breath: "blow" },
];

/**
 * A monophonic, beginner arrangement transcribed from the supplied TOMBO 3121
 * practice PDF. It deliberately omits the MIDI accompaniment and its chromatic F♯.
 */
export const weddingMarch: Song = buildBeginnerScore();

function buildBeginnerScore(): Song {
  const notes: HarmonicaNote[] = [];
  const startAt = 1.4;
  const append = ({ at, length, ...note }: TimedScoreNote) => {
    notes.push({ ...note, at: startAt + at * BEAT, length: length * BEAT });
  };
  const appendGroup = (note: ScoreNote, at: number, heldLength = 2) => {
    append({ ...note, at, length: 1 / 3 });
    append({ ...note, at: at + 1 / 3, length: 1 / 3 });
    append({ ...note, at: at + 2 / 3, length: 1 / 3 });
    append({ ...note, at: at + 1, length: heldLength });
  };
  const appendMainTheme = (at: number) => {
    // The chromatic F♯ and the large F→A leap are omitted for beginners.
    // All passing notes are at least one beat long.
    const rhythm = [2, 2, 1, 1, 1, 1, 2];
    let next = at;
    mainTheme.forEach((note, index) => {
      append({ ...note, at: next, length: rhythm[index] });
      next += rhythm[index];
    });
  };

  const appendFirstTheme = (offset: number) => {
    // The opening fanfare keeps the lead-note onsets from the supplied MIDI.
    // Later phrases remove fast ornaments and large leaps for beginners.
    appendGroup(c, offset);
    appendGroup(c, offset + 4);
    append({ ...c, at: offset + 8, length: 1 / 3 });
    append({ ...c, at: offset + 8 + 1 / 3, length: 1 / 3 });
    append({ ...c, at: offset + 8 + 2 / 3, length: 1 / 3 });
    append({ ...e, at: offset + 9, length: 1 });
    appendGroup(e, offset + 10, 1);
    append({ ...e, at: offset + 12, length: 1 / 3 });
    append({ ...e, at: offset + 12 + 1 / 3, length: 1 / 3 });
    append({ ...e, at: offset + 12 + 2 / 3, length: 1 / 3 });
    append({ ...g, at: offset + 13, length: 1 });
    appendGroup(g, offset + 14, 1);

    appendMainTheme(offset + 17);
    bridge.forEach((note, index) => append({ ...note, at: offset + 28 + index, length: 1 }));
    rise.forEach((note, index) => append({ ...note, at: offset + 35 + index, length: 1 }));
    appendMainTheme(offset + 39);
    endingBridge.forEach((note, index) => append({ ...note, at: offset + 50 + index, length: index === endingBridge.length - 1 ? 3 : 1 }));
  };

  appendFirstTheme(0);
  appendFirstTheme(61);
  append({ ...c, at: 122, length: 3 });

  // The simplified phrases were placed on whole-beat boundaries, leaving
  // repeated half-second holes in both the audio and falling bars. Keep the
  // note durations and 130 BPM fanfare while retaining a natural phrase break.
  const flowingNotes = shortenPhraseRests(notes);
  const finalNote = flowingNotes[flowingNotes.length - 1];

  return {
    title: "結婚行進曲",
    artist: "Felix Mendelssohn",
    subtitle: "C調21穴・初心者向け 約1分の単音主題練習版",
    credit: "出典：添付の TOMBO 3121 初心者用ショート譜をもとにした単音練習版",
    duration: finalNote.at + (finalNote.length ?? 0) + 0.4,
    notes: flowingNotes,
  };
}

function shortenPhraseRests(notes: HarmonicaNote[]): HarmonicaNote[] {
  let removedTime = 0;
  let previousEnd = 0;

  return notes.map((note, index) => {
    if (index > 0) {
      const rest = note.at - previousEnd;
      removedTime += Math.max(0, rest - MAX_PHRASE_REST);
    }
    previousEnd = note.at + (note.length ?? 0);
    return { ...note, at: note.at - removedTime };
  });
}
