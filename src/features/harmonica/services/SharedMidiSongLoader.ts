import { createMillionILoveYouSong } from "../domain/millionILoveYou";
import type { Song } from "../domain/types";
import { MidiFileParser } from "./MidiFileParser";

const SHARED_MIDI_URL = "/songs/million-i-love-you.mid";

/** Loads the licensed MIDI that is served as a public static asset. */
export class SharedMidiSongLoader {
  private loading: Promise<Song> | null = null;

  load(): Promise<Song> {
    if (this.loading) return this.loading;

    this.loading = fetch(SHARED_MIDI_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`共有MIDIを読み込めませんでした (${response.status})`);
        return response.arrayBuffer();
      })
      .then((buffer) => createMillionILoveYouSong(new MidiFileParser().parse(buffer)))
      .catch((error) => {
        this.loading = null;
        throw error;
      });

    return this.loading;
  }
}
