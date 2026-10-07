import type { Breath } from "./types";

export type HarpPosition = {
  hole: number;
  breath: Breath;
  note: string;
  degree: number;
  register: -1 | 0 | 1 | 2;
  midi: number;
};

// TOMBO 3121 C tuning, arranged in the same left-to-right order as the
// manufacturer's 21-hole tuning chart supplied with this project.
export const HARMONICA_LAYOUT: HarpPosition[] = [
  { hole: 1, breath: "draw", note: "レ", degree: 2, register: -1, midi: 50 },
  { hole: 2, breath: "blow", note: "ド", degree: 1, register: -1, midi: 48 },
  { hole: 3, breath: "draw", note: "ファ", degree: 4, register: -1, midi: 53 },
  { hole: 4, breath: "blow", note: "ミ", degree: 3, register: -1, midi: 52 },
  { hole: 5, breath: "draw", note: "ラ", degree: 6, register: -1, midi: 57 },
  { hole: 6, breath: "blow", note: "ソ", degree: 5, register: -1, midi: 55 },
  { hole: 7, breath: "draw", note: "シ", degree: 7, register: -1, midi: 59 },
  { hole: 8, breath: "blow", note: "ド", degree: 1, register: 0, midi: 60 },
  { hole: 9, breath: "draw", note: "レ", degree: 2, register: 0, midi: 62 },
  { hole: 10, breath: "blow", note: "ミ", degree: 3, register: 0, midi: 64 },
  { hole: 11, breath: "draw", note: "ファ", degree: 4, register: 0, midi: 65 },
  { hole: 12, breath: "blow", note: "ソ", degree: 5, register: 0, midi: 67 },
  { hole: 13, breath: "draw", note: "ラ", degree: 6, register: 0, midi: 69 },
  { hole: 14, breath: "blow", note: "ド", degree: 1, register: 1, midi: 72 },
  { hole: 15, breath: "draw", note: "シ", degree: 7, register: 1, midi: 71 },
  { hole: 16, breath: "blow", note: "ミ", degree: 3, register: 1, midi: 76 },
  { hole: 17, breath: "draw", note: "レ", degree: 2, register: 1, midi: 74 },
  { hole: 18, breath: "blow", note: "ソ", degree: 5, register: 1, midi: 79 },
  { hole: 19, breath: "draw", note: "ファ", degree: 4, register: 1, midi: 77 },
  { hole: 20, breath: "blow", note: "ド", degree: 1, register: 2, midi: 84 },
  { hole: 21, breath: "draw", note: "ラ", degree: 6, register: 2, midi: 81 },
];

export function positionForMidi(midi: number) {
  const movedIntoRange = moveIntoRange(midi);
  return HARMONICA_LAYOUT.reduce((closest, position) => (
    Math.abs(position.midi - movedIntoRange) < Math.abs(closest.midi - movedIntoRange) ? position : closest
  ));
}

export function positionForHole(hole: number) {
  return HARMONICA_LAYOUT[hole - 1];
}

function moveIntoRange(midi: number) {
  let adjusted = midi;
  while (adjusted < 48) adjusted += 12;
  while (adjusted > 84) adjusted -= 12;
  return adjusted;
}

export function pitchFor(hole: number, breath: Breath) {
  return HARMONICA_LAYOUT.find((position) => position.hole === hole && position.breath === breath)?.midi;
}
