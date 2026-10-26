"use client";

import { useEffect, useRef, useState } from "react";
import { createMillionILoveYouSong } from "../domain/millionILoveYou";
import { SONG_CATALOG } from "../domain/songCatalog";
import type { Song } from "../domain/types";
import { LocalMidiStore } from "../services/LocalMidiStore";
import { MidiFileParser } from "../services/MidiFileParser";
import { PracticeAudioPlayer } from "../services/PracticeAudioPlayer";
import { PlaybackClock } from "../services/PlaybackClock";
import { PlaybackControls, PlaybackTransport } from "./PlaybackControls";
import { RhythmStage } from "./RhythmStage";
import { SongPreparation, SongSelector } from "./SongSelector";

export function HarmonicaTrainer() {
  const [selectedSongId, setSelectedSongId] = useState(SONG_CATALOG[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [localSong, setLocalSong] = useState<Song | null>(null);
  const [midiLoading, setMidiLoading] = useState(false);
  const [midiError, setMidiError] = useState("");
  const selectedEntry = SONG_CATALOG.find((entry) => entry.id === selectedSongId) ?? SONG_CATALOG[0];
  const song = selectedSongId === "million-i-love-you" ? localSong ?? undefined : selectedEntry.song;
  const songCards = SONG_CATALOG.map((entry) => entry.id === "million-i-love-you" && localSong
    ? { ...entry, status: "ready" as const, song: localSong, description: "C調21穴・MIDIから変換 約1分11秒" }
    : entry);
  const clock = useRef(new PlaybackClock(SONG_CATALOG[0].song?.duration ?? 0));
  const audioPlayer = useRef(new PracticeAudioPlayer());
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const player = audioPlayer.current;
    return () => player.stop();
  }, []);

  useEffect(() => {
    let mounted = true;
    new LocalMidiStore().load().then((buffer) => {
      if (!buffer || !mounted) return;
      const restored = createMillionILoveYouSong(new MidiFileParser().parse(buffer));
      setLocalSong(restored);
      // The current song starts as Wedding March; selectSong sets the duration later.
    }).catch(() => { /* Private browsing may disable local storage. */ });
    return () => { mounted = false; };
  }, []);

  const importMidi = async (file: File) => {
    setMidiError("");
    setMidiLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const imported = createMillionILoveYouSong(new MidiFileParser().parse(buffer));
      audioPlayer.current.stop();
      clock.current.reset();
      clock.current.setDuration(imported.duration);
      setElapsed(0);
      setIsPlaying(false);
      setLocalSong(imported);
      await new LocalMidiStore().save(buffer).catch(() => { /* Playback still works without persistence. */ });
    } catch (error) {
      setMidiError(error instanceof Error ? error.message : "MIDIを読み込めませんでした");
    } finally {
      setMidiLoading(false);
    }
  };

  useEffect(() => {
    const animate = (now: number) => {
      const next = clock.current.positionAt(now);
      setElapsed(next);
      if (clock.current.hasEnded(now)) {
        clock.current.reset();
        audioPlayer.current.stop();
        setElapsed(0);
        setIsPlaying(false);
        return;
      }
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrame.current = requestAnimationFrame(animate);
    }
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [isPlaying]);

  const togglePlayback = async () => {
    if (!song) return;
    if (isPlaying) {
      clock.current.pause(performance.now());
      audioPlayer.current.stop();
      setIsPlaying(false);
      return;
    }
    try {
      setAudioError("");
      const startDelay = await audioPlayer.current.play(song, {
        from: elapsed,
        duration: song.duration - elapsed,
      });
      clock.current.play(performance.now(), startDelay);
      setIsPlaying(true);
    } catch (error) {
      audioPlayer.current.stop();
      setAudioError(error instanceof Error ? error.message : "音源を再生できませんでした");
    }
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    clock.current.reset();
    audioPlayer.current.stop();
    setAudioError("");
    setElapsed(0);
  };

  const seekPlayback = async (position: number) => {
    if (!song) return;
    const nextPosition = Math.max(0, Math.min(position, song.duration));
    clock.current.seek(nextPosition, performance.now());
    setElapsed(nextPosition);
    if (!isPlaying) return;

    audioPlayer.current.stop();
    try {
      setAudioError("");
      const startDelay = await audioPlayer.current.play(song, { from: nextPosition, duration: song.duration - nextPosition });
      clock.current.play(performance.now(), startDelay);
    } catch (error) {
      clock.current.pause(performance.now());
      setIsPlaying(false);
      setAudioError(error instanceof Error ? error.message : "音源を再生できませんでした");
    }
  };

  const selectSong = (id: string) => {
    const nextEntry = SONG_CATALOG.find((entry) => entry.id === id);
    if (!nextEntry) return;
    audioPlayer.current.stop();
    clock.current.reset();
    clock.current.setDuration((id === "million-i-love-you" ? localSong : nextEntry.song)?.duration ?? 0);
    setIsPlaying(false);
    setAudioError("");
    setElapsed(0);
    setSelectedSongId(id);
  };

  return <main className="rhythm-app">
    <PlaybackControls disabled={!song} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} />
    <SongSelector songs={songCards} selectedId={selectedSongId} onSelect={selectSong} />
    {song ? <>
      <div className="stage-viewport"><RhythmStage song={song} elapsed={elapsed} /></div>
      <PlaybackTransport elapsed={elapsed} duration={song.duration} credit={song.credit} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} onSeek={seekPlayback} />
      {audioError && <p className="audio-status" role="alert">{audioError}</p>}
    </> : <SongPreparation song={selectedEntry} onMidiFile={selectedSongId === "million-i-love-you" ? importMidi : undefined} isLoading={midiLoading} error={midiError} />}
  </main>;
}
