import type { Song } from "./types";
import { weddingMarch } from "./weddingMarch";

export type SongCatalogEntry = {
  id: string;
  title: string;
  artist: string;
  status: "ready" | "needs-score" | "local-midi";
  description: string;
  song?: Song;
};

export const SONG_CATALOG: SongCatalogEntry[] = [
  {
    id: "wedding-march",
    title: "結婚行進曲",
    artist: "Felix Mendelssohn",
    status: "ready",
    description: "C調21穴・初心者向け 約1分",
    song: weddingMarch,
  },
  {
    id: "million-i-love-you",
    title: "100万回の「I love you」",
    artist: "Rake",
    status: "local-midi",
    description: "手元のメロディMIDIを選択して練習",
  },
];
