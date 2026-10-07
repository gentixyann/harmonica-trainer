"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Note = { hole: number; direction: "吹く" | "吸う" };

// PDF: Main Theme A (T9=吹く / T8=吸う)
const song: Note[] = [
  { hole: 1, direction: "吹く" }, { hole: 7, direction: "吸う" }, { hole: 4, direction: "吸う" }, { hole: 6, direction: "吸う" },
  { hole: 5, direction: "吹く" }, { hole: 4, direction: "吸う" }, { hole: 2, direction: "吸う" }, { hole: 1, direction: "吹く" },
  { hole: 7, direction: "吸う" }, { hole: 1, direction: "吹く" }, { hole: 2, direction: "吸う" }, { hole: 5, direction: "吹く" },
  { hole: 2, direction: "吸う" }, { hole: 3, direction: "吹く" }, { hole: 1, direction: "吹く" }, { hole: 3, direction: "吹く" },
  { hole: 5, direction: "吹く" }, { hole: 1, direction: "吹く" }, { hole: 3, direction: "吹く" }, { hole: 5, direction: "吹く" },
];

const noteNames = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ", "ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ"];

export default function Home() {
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState("スタートを押して、最初の穴を鳴らそう");
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(72);
  const [micOn, setMicOn] = useState(false);
  const [breathMode, setBreathMode] = useState<"吹く" | "吸う">("吹く");
  const audio = useRef<AudioContext | null>(null);
  const complete = position >= song.length;
  const current = song[position];

  const sound = useCallback((hole: number) => {
    const ctx = audio.current ?? new AudioContext(); audio.current = ctx;
    const frequencies = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = frequencies[hole - 1] ?? 440; osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .32);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .35);
  }, []);

  const answer = useCallback((hole: number, direction = "吹く") => {
    if (complete || !playing) return;
    sound(hole);
    if (hole === current.hole && direction === current.direction) {
      const next = position + 1; setPosition(next); setScore((v) => v + 100 + streak * 10); setStreak((v) => v + 1);
      setMessage(next === song.length ? "ステージクリア！ 結婚行進曲のテーマを演奏できました" : "いいね！ 次の音へ");
    } else { setStreak(0); setMessage(`おしい！ ${current.hole}番を${current.direction}よ`); }
  }, [complete, current, playing, position, sound, streak]);

  const reset = () => { setPosition(0); setScore(0); setStreak(0); setPlaying(false); setMessage("最初から挑戦しよう"); };
  useEffect(() => { const key = (e: KeyboardEvent) => { const n = Number(e.key); if (n > 0 && n < 9) answer(n); if (e.key === " ") { e.preventDefault(); setPlaying((v) => !v); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [answer]);
  const enableMic = async () => { try { await navigator.mediaDevices.getUserMedia({ audio: true }); setMicOn(true); setMessage("マイクを有効にしました。画面のガイドに沿って吹いてみよう！"); } catch { setMessage("マイクを許可できませんでした。穴ボタンで練習できます。"); } };

  return <main>
    <header className="topbar"><a className="brand" href="#top"><span>♬</span> Harmonica Quest</a><div className="song-chip"><i /> C調 21穴複音</div><button className="ghost" onClick={reset}>↻ 最初から</button></header>
    <section className="hero" id="top"><div className="eyebrow">SONG 01 · BEGINNER SHORT</div><h1>結婚行進曲を<br /><em>冒険しよう。</em></h1><p>次に吹く・吸う穴を見て、リズムに乗ろう。<br />小さな成功を重ねて、テーマを演奏できるように。</p><div className="stats"><div><span>進行度</span><strong>{Math.round(position / song.length * 100)}<small>%</small></strong></div><div><span>スコア</span><strong>{score.toString().padStart(4, "0")}</strong></div><div><span>コンボ</span><strong>{streak}<small>×</small></strong></div></div></section>
    <section className="game-card" aria-live="polite"><div className="game-head"><div><span className="label">NOW PLAYING</span><h2>結婚行進曲 <small>／ Main Theme A</small></h2></div><button className={playing ? "pause" : "start"} onClick={() => setPlaying((v) => !v)}>{playing ? "Ⅱ 一時停止" : "▶ スタート"}</button></div><div className="progress"><i style={{ width: `${position / song.length * 100}%` }} /></div><div className="notes">{song.map((note, index) => <span key={index} className={index === position ? "current" : index < position ? "done" : ""}>{note.hole}{note.direction === "吸う" ? "←" : "→"}</span>)}</div>{complete ? <div className="clear"><span>✦</span><h3>STAGE CLEAR!</h3><p>結婚行進曲のテーマを最後まで演奏できました</p><button onClick={reset}>もう一度挑戦</button></div> : <><div className="instruction"><span className="next">NEXT</span><div className="target"><b>{current.hole}</b><span>番の穴</span></div><div className={current.direction === "吸う" ? "breath draw" : "breath"}>{current.direction === "吹く" ? "→" : "←"}<strong>{current.direction}</strong></div></div><p className="feedback">{message}</p></>}</section>
    <section className="harp-section"><div className="section-title"><div><span className="label">YOUR HARMONICA</span><h2>穴をタップして練習</h2></div><span className="key-help">キーボード <kbd>1</kbd>–<kbd>8</kbd> でもOK</span></div><div className="breath-switch" aria-label="吹吸モード"><span>いまの息</span><button onClick={() => setBreathMode("吹く")} className={breathMode === "吹く" ? "selected" : ""}>→ 吹く</button><button onClick={() => setBreathMode("吸う")} className={breathMode === "吸う" ? "selected draw" : ""}>← 吸う</button></div><div className="harmonica">{Array.from({ length: 21 }, (_, i) => { const hole = i + 1; return <button key={hole} onClick={() => answer(hole, breathMode)} className={!complete && hole === current.hole ? "hole active" : "hole"}><span>{hole}</span><i><b /></i><small>{noteNames[i]}</small></button>; })}</div><div className="legend"><span><i />光っている穴が次の音</span><span>息の向きを選んでから穴をタップ</span></div></section>
    <section className="controls"><div><span className="label">PRACTICE SETTINGS</span><h2>自分のペースで進めよう</h2></div><div className="control-row"><label>テンポ <input type="range" min="48" max="120" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} /><b>{tempo} BPM</b></label><button className={micOn ? "mic enabled" : "mic"} onClick={enableMic}>{micOn ? "● マイク ON" : "◉ マイクを使う"}</button></div><p>PDFの「Main Theme A」20音を収録。マイク判定は今後の拡張用に準備済みで、現在は画面の穴をタップして進められます。</p></section>
  </main>;
}
