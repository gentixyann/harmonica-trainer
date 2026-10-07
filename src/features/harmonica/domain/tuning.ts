import type { Breath } from "./types";

const pitches: Record<string, number> = {
  "1-blow": 261.63, "1-draw": 293.66,
  "2-blow": 329.63, "2-draw": 349.23,
  "3-blow": 392, "3-draw": 440,
  "4-blow": 523.25, "4-draw": 493.88,
  "5-blow": 659.25, "5-draw": 587.33,
  "6-blow": 783.99, "6-draw": 698.46,
  "7-blow": 1046.5, "7-draw": 880,
};

export function pitchFor(hole: number, breath: Breath) {
  return pitches[`${hole}-${breath}`];
}
