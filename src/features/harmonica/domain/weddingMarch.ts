import type { Song } from "./types";

// Adapted from the Main Theme A notation for a TOMBO 3121 in C.
export const weddingMarch: Song = {
  title: "結婚行進曲",
  subtitle: "C調21穴向け・Main Theme A",
  duration: 19,
  notes: [
    { hole: 1, breath: "blow", at: 0 }, { hole: 7, breath: "draw", at: 0.8 },
    { hole: 4, breath: "draw", at: 1.6 }, { hole: 6, breath: "draw", at: 2.4 },
    { hole: 5, breath: "blow", at: 3.2 }, { hole: 4, breath: "draw", at: 4 },
    { hole: 2, breath: "draw", at: 4.8 }, { hole: 1, breath: "blow", at: 5.6 },
    { hole: 7, breath: "draw", at: 6.8 }, { hole: 1, breath: "blow", at: 7.6 },
    { hole: 2, breath: "draw", at: 8.4 }, { hole: 5, breath: "blow", at: 9.2 },
    { hole: 2, breath: "draw", at: 10 }, { hole: 3, breath: "blow", at: 10.8 },
    { hole: 1, breath: "blow", at: 11.6 }, { hole: 3, breath: "blow", at: 12.4 },
    { hole: 5, breath: "blow", at: 13.2, length: 1.3 }, { hole: 1, breath: "blow", at: 14.8 },
    { hole: 3, breath: "blow", at: 15.6 }, { hole: 5, breath: "blow", at: 16.4, length: 1.3 },
  ],
};
