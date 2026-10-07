"use client";

import { useEffect, useRef, useState } from "react";
import { weddingMarch } from "../domain/weddingMarch";
import type { HarmonicaNote } from "../domain/types";
import { HarmonicaSynth } from "../services/HarmonicaSynth";
import { PlaybackClock } from "../services/PlaybackClock";
import { PlaybackControls } from "./PlaybackControls";
import { RhythmStage } from "./RhythmStage";

export function HarmonicaTrainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const clock = useRef(new PlaybackClock(weddingMarch.duration));
  const synth = useRef(new HarmonicaSynth());
  const animationFrame = useRef<number | null>(null);
  const lastPlayedIndex = useRef(-1);

  useEffect(() => {
    const animate = (now: number) => {
      const next = clock.current.positionAt(now);
      setElapsed(next);
      if (clock.current.hasEnded(now)) {
        clock.current.reset();
        lastPlayedIndex.current = -1;
        setIsPlaying(false);
        return;
      }
      animationFrame.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      clock.current.play(performance.now());
      animationFrame.current = requestAnimationFrame(animate);
    }
    return () => { if (animationFrame.current) cancelAnimationFrame(animationFrame.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const nextIndex = weddingMarch.notes.findIndex((note) => note.at > elapsed);
    const indexToPlay = nextIndex === -1 ? weddingMarch.notes.length - 1 : Math.max(0, nextIndex - 1);
    if (indexToPlay > lastPlayedIndex.current) {
      for (let index = lastPlayedIndex.current + 1; index <= indexToPlay; index += 1) synth.current.play(weddingMarch.notes[index]);
      lastPlayedIndex.current = indexToPlay;
    }
  }, [elapsed, isPlaying]);

  const togglePlayback = () => {
    if (isPlaying) clock.current.pause(performance.now());
    setIsPlaying((value) => !value);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    clock.current.reset();
    lastPlayedIndex.current = -1;
    setElapsed(0);
  };

  const updateSpeed = (nextSpeed: number) => {
    clock.current.setSpeed(nextSpeed, performance.now());
    setSpeed(nextSpeed);
  };

  const currentNote = findCurrentNote(weddingMarch.notes, elapsed);

  return <main className="rhythm-app">
    <PlaybackControls elapsed={elapsed} duration={weddingMarch.duration} isPlaying={isPlaying} speed={speed} current={currentNote} onToggle={togglePlayback} onReset={resetPlayback} onSpeedChange={updateSpeed} />
    <RhythmStage song={weddingMarch} elapsed={elapsed} currentNote={currentNote} />
  </main>;
}

function findCurrentNote(notes: HarmonicaNote[], elapsed: number) {
  return notes.find((note) => note.at <= elapsed && note.at + (note.length ?? 0.58) >= elapsed);
}
