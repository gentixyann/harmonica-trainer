"use client";

import { useEffect, useRef, useState } from "react";
import { weddingMarch } from "../domain/weddingMarch";
import { MidiPlayer } from "../services/MidiPlayer";
import { PlaybackClock } from "../services/PlaybackClock";
import { PlaybackControls } from "./PlaybackControls";
import { RhythmStage } from "./RhythmStage";

export function HarmonicaTrainer() {
  const [song, setSong] = useState(weddingMarch);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
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

  const audioStatus = midiError ? "MIDIを読み込めませんでした" : midiReady ? undefined : "伴奏を読み込み中…";

  return <main className="rhythm-app">
    <PlaybackControls elapsed={elapsed} duration={song.duration} isPlaying={isPlaying} onToggle={togglePlayback} onReset={resetPlayback} />
    <RhythmStage song={song} elapsed={elapsed} />
    {audioStatus && <p className="audio-status">{audioStatus}</p>}
  </main>;
}
