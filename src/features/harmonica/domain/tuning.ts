import type { Breath } from "./types";

type HarpPosition = { hole: number; breath: Breath; midi: number };

const playablePositions: HarpPosition[] = [
  { hole: 1, breath: "blow", midi: 60 }, { hole: 1, breath: "draw", midi: 62 },
  { hole: 2, breath: "blow", midi: 64 }, { hole: 2, breath: "draw", midi: 65 },
  { hole: 3, breath: "blow", midi: 67 }, { hole: 3, breath: "draw", midi: 69 },
  { hole: 4, breath: "draw", midi: 71 }, { hole: 4, breath: "blow", midi: 72 },
  { hole: 5, breath: "draw", midi: 74 }, { hole: 5, breath: "blow", midi: 76 },
  { hole: 6, breath: "draw", midi: 77 }, { hole: 6, breath: "blow", midi: 79 },
  { hole: 7, breath: "draw", midi: 81 }, { hole: 7, breath: "blow", midi: 84 },
  { hole: 8, breath: "draw", midi: 83 }, { hole: 8, breath: "blow", midi: 88 },
];

export function positionForMidi(midi: number) {
  const movedIntoRange = moveIntoRange(midi);
  return playablePositions.reduce((closest, position) => (
    Math.abs(position.midi - movedIntoRange) < Math.abs(closest.midi - movedIntoRange) ? position : closest
  ));
}

function moveIntoRange(midi: number) {
  let adjusted = midi;
  while (adjusted < 60) adjusted += 12;
  while (adjusted > 88) adjusted -= 12;
  return adjusted;
}

export function pitchFor(hole: number, breath: Breath) {
  return playablePositions.find((position) => position.hole === hole && position.breath === breath)?.midi;
}
