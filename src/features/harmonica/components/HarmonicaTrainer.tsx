"use client";

import { useEffect, useRef, useState } from "react";
import { weddingMarch } from "../domain/weddingMarch";
import type { HarmonicaNote } from "../domain/types";
import { MidiPlayer } from "../services/MidiPlayer";
import { PlaybackClock } from "../services/PlaybackClock";
import { PlaybackControls } from "./PlaybackControls";
import { RhythmStage } from "./RhythmStage";

export function HarmonicaTrainer() {
  const [song, setSong] = useState(weddingMarch);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [midiReady, setMidiReady] = useState(false);
  const [midiError, setMidiError] = useState(false);
  const clock = useRef(new PlaybackClock(weddingMarch.duration));
  const midiPlayer = useRef(new MidiPlayer());
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const player = midiPlayer.current;
    player.load("/songs/wedding-march.mid")
      .then((fullSong) => {
        clock.current.setDuration(fullSong.duration);
        setSong(fullSong);
        setMidiReady(true);
      })
      .catch(() => setMidiError(true));
    return () => player.stop();
  }, []);

  useEffect(() => {
    const animate = (now: number) => {
      const next = clock.current.positionAt(now);
      setElapsed(next);
      if (clock.current.hasEnded(now)) {
        clock.current.reset();
        midiPlayer.current.stop();
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
    if (isPlaying) {
      clock.current.pause(performance.now());
      midiPlayer.current.stop();
      setIsPlaying(false);
      return;
    }
    if (!midiReady) return;
    await midiPlayer.current.play({
      from: elapsed,
      duration: song.duration - elapsed,
      speed,
    });
    clock.current.play(performance.now());
    setIsPlaying(true);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    clock.current.reset();
    midiPlayer.current.stop();
    setElapsed(0);
  };

  const updateSpeed = async (nextSpeed: number) => {
    const now = performance.now();
    const position = clock.current.positionAt(now);
    clock.current.setSpeed(nextSpeed, now);
    setElapsed(position);
    setSpeed(nextSpeed);
    if (isPlaying) await midiPlayer.current.play({ from: position, duration: song.duration - position, speed: nextSpeed });
  };

  const currentNote = findCurrentNote(song.notes, elapsed);

  const audioStatus = midiError ? "MIDIを読み込めませんでした" : midiReady ? undefined : "伴奏を読み込み中…";

  return <main className="rhythm-app">
    <PlaybackControls elapsed={elapsed} duration={song.duration} isPlaying={isPlaying} speed={speed} current={currentNote} onToggle={togglePlayback} onReset={resetPlayback} onSpeedChange={updateSpeed} />
    <RhythmStage song={song} elapsed={elapsed} currentNote={currentNote} />
    {audioStatus && <p className="audio-status">{audioStatus}</p>}
  </main>;
}

function findCurrentNote(notes: HarmonicaNote[], elapsed: number) {
  return notes.find((note) => note.at <= elapsed && note.at + (note.length ?? 0.58) >= elapsed);
}
