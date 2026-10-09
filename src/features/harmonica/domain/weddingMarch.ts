import type { HarmonicaNote, Song } from "./types";

type ScoreNote = Pick<HarmonicaNote, "hole" | "breath">;
type TimedScoreNote = ScoreNote & { at: number; length: number };

// Tempo read from the supplied source MIDI: ♩ = 130.
const ORIGINAL_BPM = 130;
const BEAT = 60 / ORIGINAL_BPM;

const c: ScoreNote = { hole: 8, breath: "blow" };
const e: ScoreNote = { hole: 10, breath: "blow" };
const g: ScoreNote = { hole: 12, breath: "blow" };

const mainTheme: ScoreNote[] = [
  { hole: 14, breath: "blow" }, { hole: 15, breath: "draw" },
  { hole: 11, breath: "draw" }, { hole: 13, breath: "draw" },
  { hole: 12, breath: "blow" }, { hole: 11, breath: "draw" },
  { hole: 9, breath: "draw" }, { hole: 8, breath: "blow" },
];

const bridge: ScoreNote[] = [
  { hole: 15, breath: "draw" }, { hole: 14, breath: "blow" },
  { hole: 17, breath: "draw" }, { hole: 18, breath: "blow" },
  { hole: 17, breath: "draw" }, { hole: 16, breath: "blow" },
];

const rise: ScoreNote[] = [
  { hole: 8, breath: "blow" }, { hole: 10, breath: "blow" }, { hole: 12, breath: "blow" },
];

const endingBridge: ScoreNote[] = [
  { hole: 15, breath: "draw" }, { hole: 14, breath: "blow" }, { hole: 16, breath: "blow" },
  { hole: 17, breath: "draw" }, { hole: 16, breath: "blow" }, { hole: 17, breath: "draw" },
  { hole: 14, breath: "blow" },
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
  const appendGroup = (note: ScoreNote, at: number) => {
    append({ ...note, at, length: 1 / 3 });
    append({ ...note, at: at + 1 / 3, length: 1 / 3 });
    append({ ...note, at: at + 2 / 3, length: 1 / 3 });
    append({ ...note, at: at + 1, length: 2 });
  };
  const appendMainTheme = (at: number) => {
    const rhythm = [2, 1.5, 0.5, 1, 1, 0.5, 0.5, 2];
    let next = at;
    mainTheme.forEach((note, index) => {
      append({ ...note, at: next, length: rhythm[index] });
      next += rhythm[index];
    });
  };

  const appendFirstTheme = (offset: number) => {
    // These timings are the lead-note onsets from the supplied MIDI at ♩=130.
    // Every event remains monophonic; accompaniment is intentionally omitted.
    appendGroup(c, offset);
    appendGroup(c, offset + 4);
    append({ ...c, at: offset + 8, length: 1 / 3 });
    append({ ...c, at: offset + 8 + 1 / 3, length: 1 / 3 });
    append({ ...c, at: offset + 8 + 2 / 3, length: 1 / 3 });
    append({ ...e, at: offset + 9, length: 1 });
    appendGroup(e, offset + 10);
    append({ ...e, at: offset + 12, length: 1 / 3 });
    append({ ...e, at: offset + 12 + 1 / 3, length: 1 / 3 });
    append({ ...e, at: offset + 12 + 2 / 3, length: 1 / 3 });
    append({ ...g, at: offset + 13, length: 1 });
    appendGroup(g, offset + 14);

    appendMainTheme(offset + 17);
    bridge.forEach((note, index) => append({ ...note, at: offset + 26.875 + [0, 0.125, 0.25, 1.25, 2.25, 2.5][index], length: [0.125, 0.125, 1, 1, 0.25, 1][index] }));
    rise.forEach((note, index) => append({ ...note, at: offset + 31.5 + [0, 0.5, 1][index], length: 0.25 }));
    appendMainTheme(offset + 33);
    endingBridge.forEach((note, index) => append({ ...note, at: offset + 42 + [0, 0.25, 0.5, 1.5, 2.25, 2.5, 4.5][index], length: [0.25, 0.25, 1, 0.75, 0.25, 2, 1][index] }));
    ([{ hole: 18, breath: "blow" }, { hole: 16, breath: "blow" }, { hole: 17, breath: "draw" }] as ScoreNote[]).forEach((note, index) => append({ ...note, at: offset + 47 + index, length: 1 }));
    append({ hole: 14, breath: "blow", at: offset + 50, length: 3 });
  };

  appendFirstTheme(0);
  appendFirstTheme(56);
  // A final C-major cadence closes the repeated first theme at about one minute.
  ([{ hole: 18, breath: "blow" }, { hole: 16, breath: "blow" }, { hole: 17, breath: "draw" }, { hole: 14, breath: "blow" }] as ScoreNote[]).forEach((note, index) => append({ ...note, at: 112 + index * 2, length: index === 3 ? 5 : 1 }));

  return {
    title: "結婚行進曲",
    subtitle: "C調21穴・単音で吹く 約1分の主題練習版",
    duration: startAt + 124 * BEAT,
    notes,
  };
}
