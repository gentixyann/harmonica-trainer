"use client";

import { useEffect, useRef, useState } from "react";
import { weddingMarch } from "../domain/weddingMarch";
import { PracticeAudioPlayer } from "../services/PracticeAudioPlayer";
import { PlaybackClock } from "../services/PlaybackClock";
import { PlaybackControls, PlaybackTransport } from "./PlaybackControls";
import { RhythmStage } from "./RhythmStage";

export function HarmonicaTrainer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const clock = useRef(new PlaybackClock(weddingMarch.duration));
  const audioPlayer = useRef(new PracticeAudioPlayer());
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const player = audioPlayer.current;
    return () => player.stop();
  }, []);

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
    if (isPlaying) {
      clock.current.pause(performance.now());
      audioPlayer.current.stop();
      setIsPlaying(false);
      return;
    }
    await audioPlayer.current.play(weddingMarch, {
      from: elapsed,
      duration: weddingMarch.duration - elapsed,
    });
    clock.current.play(performance.now());
    setIsPlaying(true);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    clock.current.reset();
    audioPlayer.current.stop();
    setElapsed(0);
  };

  const seekPlayback = async (position: number) => {
    const nextPosition = Math.max(0, Math.min(position, weddingMarch.duration));
    clock.current.seek(nextPosition, performance.now());
    setElapsed(nextPosition);
    if (!isPlaying) return;

    audioPlayer.current.stop();
    await audioPlayer.current.play(weddingMarch, { from: nextPosition, duration: weddingMarch.duration - nextPosition });
    clock.current.play(performance.now());
  };

  return <main className="rhythm-app">
    <PlaybackControls isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} />
    <RhythmStage song={weddingMarch} elapsed={elapsed} />
    <PlaybackTransport elapsed={elapsed} duration={weddingMarch.duration} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} onSeek={seekPlayback} />
  </main>;
}
