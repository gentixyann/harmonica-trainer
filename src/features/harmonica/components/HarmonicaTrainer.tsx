"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SONG_CATALOG, type SongCatalogEntry } from "../domain/songCatalog";
import type { Song } from "../domain/types";
import { PracticeAudioPlayer } from "../services/PracticeAudioPlayer";
import { PlaybackClock } from "../services/PlaybackClock";
import { SharedMidiSongLoader } from "../services/SharedMidiSongLoader";
import { PlaybackControls, PlaybackTransport } from "./PlaybackControls";
import { OrientationPrompt } from "./OrientationPrompt";
import { RhythmStage } from "./RhythmStage";
import { SongPreparation, SongSelector } from "./SongSelector";

export function HarmonicaTrainer() {
  const [selectedSongId, setSelectedSongId] = useState(SONG_CATALOG[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioError, setAudioError] = useState("");
  const [sharedSong, setSharedSong] = useState<Song | null>(null);
  const [midiLoading, setMidiLoading] = useState(true);
  const [midiError, setMidiError] = useState("");
  const selectedEntry = SONG_CATALOG.find((entry) => entry.id === selectedSongId) ?? SONG_CATALOG[0];
  const song = selectedSongId === "million-i-love-you" ? sharedSong ?? undefined : selectedEntry.song;
  const songCards: SongCatalogEntry[] = SONG_CATALOG.map((entry) => entry.id === "million-i-love-you"
    ? { ...entry, status: sharedSong ? "ready" : midiError ? "error" : "loading", song: sharedSong ?? undefined,
      description: sharedSong ? "C調21穴・共有MIDIから変換 約1分44秒" : entry.description }
    : entry);
  const clock = useRef(new PlaybackClock(SONG_CATALOG[0].song?.duration ?? 0));
  const audioPlayer = useRef(new PracticeAudioPlayer());
  const sharedMidiLoader = useRef(new SharedMidiSongLoader());
  const selectedSongIdRef = useRef(selectedSongId);
  const animationFrame = useRef<number | null>(null);
  const playbackRequest = useRef(0);

  const acceptSharedSong = useCallback((loaded: Song) => {
    setSharedSong(loaded);
    if (selectedSongIdRef.current !== "million-i-love-you") return;
    playbackRequest.current += 1;
    audioPlayer.current.stop();
    clock.current.reset();
    clock.current.setDuration(loaded.duration);
    setElapsed(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    const player = audioPlayer.current;
    return () => player.stop();
  }, []);

  useEffect(() => {
    let mounted = true;
    sharedMidiLoader.current.load()
      .then((loaded) => { if (mounted) acceptSharedSong(loaded); })
      .catch((error) => { if (mounted) setMidiError(error instanceof Error ? error.message : "共有MIDIを読み込めませんでした"); })
      .finally(() => { if (mounted) setMidiLoading(false); });
    return () => { mounted = false; };
  }, [acceptSharedSong]);

  const retryMidi = async () => {
    setMidiError("");
    setMidiLoading(true);
    try {
      acceptSharedSong(await sharedMidiLoader.current.load());
    } catch (error) {
      setMidiError(error instanceof Error ? error.message : "共有MIDIを読み込めませんでした");
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

  const startPlayback = async (activeSong: Song, position: number, rate: number, request: number) => {
    try {
      setAudioError("");
      const startDelay = await audioPlayer.current.play(activeSong, {
        from: position,
        duration: activeSong.duration - position,
        rate,
      });
      if (request !== playbackRequest.current) return;
      clock.current.play(performance.now(), startDelay);
      setIsPlaying(true);
    } catch (error) {
      if (request !== playbackRequest.current) return;
      audioPlayer.current.stop();
      setIsPlaying(false);
      setAudioError(error instanceof Error ? error.message : "音源を再生できませんでした");
    }
  };

  const togglePlayback = async () => {
    if (!song) return;
    if (isPlaying) {
      playbackRequest.current += 1;
      clock.current.pause(performance.now());
      audioPlayer.current.stop();
      setIsPlaying(false);
      return;
    }
    const request = ++playbackRequest.current;
    await startPlayback(song, clock.current.positionAt(performance.now()), playbackRate, request);
  };

  const resetPlayback = () => {
    playbackRequest.current += 1;
    setIsPlaying(false);
    clock.current.reset();
    audioPlayer.current.stop();
    setAudioError("");
    setElapsed(0);
  };

  const seekPlayback = async (position: number) => {
    if (!song) return;
    const request = ++playbackRequest.current;
    const nextPosition = Math.max(0, Math.min(position, song.duration));
    clock.current.pause(performance.now());
    clock.current.seek(nextPosition, performance.now());
    setElapsed(nextPosition);
    audioPlayer.current.stop();
    if (!isPlaying) return;

    await startPlayback(song, nextPosition, playbackRate, request);
  };

  const changePlaybackRate = async (rate: number) => {
    if (!song || rate === playbackRate) return;
    const request = ++playbackRequest.current;
    const now = performance.now();
    const position = clock.current.positionAt(now);
    clock.current.pause(now);
    clock.current.setRate(rate);
    setPlaybackRate(rate);
    setElapsed(position);
    audioPlayer.current.stop();
    if (!isPlaying) return;

    await startPlayback(song, position, rate, request);
  };

  const selectSong = (id: string) => {
    const nextEntry = SONG_CATALOG.find((entry) => entry.id === id);
    if (!nextEntry) return;
    selectedSongIdRef.current = id;
    playbackRequest.current += 1;
    audioPlayer.current.stop();
    clock.current.reset();
    clock.current.setDuration((id === "million-i-love-you" ? sharedSong : nextEntry.song)?.duration ?? 0);
    setIsPlaying(false);
    setAudioError("");
    setElapsed(0);
    setSelectedSongId(id);
  };

  return <main className="rhythm-app">
    <OrientationPrompt />
    <PlaybackControls disabled={!song} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} />
    <SongSelector songs={songCards} selectedId={selectedSongId} onSelect={selectSong} />
    {song ? <>
      <div className="stage-viewport"><RhythmStage song={song} elapsed={elapsed} /></div>
      <PlaybackTransport elapsed={elapsed} duration={song.duration} credit={song.credit} rate={playbackRate} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} onSeek={seekPlayback} onRateChange={changePlaybackRate} />
      {audioError && <p className="audio-status" role="alert">{audioError}</p>}
    </> : <SongPreparation song={selectedEntry} onRetry={retryMidi} isLoading={midiLoading} error={midiError} />}
  </main>;
}
