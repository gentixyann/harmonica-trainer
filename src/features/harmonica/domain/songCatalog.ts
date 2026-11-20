import type { Song } from "./types";
import { weddingMarch } from "./weddingMarch";

export type SongCatalogEntry = {
  id: string;
  title: string;
  artist: string;
  status: "ready" | "loading" | "error";
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
    status: "loading",
    description: "共有MIDIを読み込み、C調21穴に変換",
  },
];
