import type { Breath } from "../domain/types";

type PlaybackControlsProps = {
  elapsed: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  current?: { hole: number; breath: Breath };
  onToggle: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
};

export function PlaybackControls({ elapsed, duration, isPlaying, speed, current, onToggle, onReset, onSpeedChange }: PlaybackControlsProps) {
  const playLabel = isPlaying ? "Ⅱ 一時停止" : elapsed ? "▶ 再開" : "▶ 演奏スタート";
  return <>
    <header className="rhythm-header">
      <div><span className="mini-logo">♬</span><strong>Harmonica Flow</strong><span className="header-divider" /> <span>21-hole Tremolo · Key C</span></div>
      <div className="header-actions"><button onClick={onReset}>↺ 最初から</button><button className="play-button" onClick={onToggle}>{playLabel}</button></div>
    </header>
    <footer className="rhythm-footer">
      <div className="now-playing"><span>NOW</span>{current ? <><b>{current.hole}番</b><em className={current.breath}>{current.breath === "blow" ? "吹く" : "吸う"}</em></> : <b>{elapsed >= duration ? "CLEAR!" : "スタート待ち"}</b>}</div>
      <div className="transport"><button onClick={onReset}>|◀</button><button className="round-play" onClick={onToggle}>{isPlaying ? "Ⅱ" : "▶"}</button><div className="time"><i style={{ width: `${elapsed / duration * 100}%` }} />{elapsed.toFixed(1)} / {duration}.0</div></div>
      <div className="speed" aria-label="再生速度">速度 {[0.75, 1, 1.25].map((value) => <button key={value} onClick={() => onSpeedChange(value)} className={speed === value ? "chosen" : ""}>{value}×</button>)}</div>
      <p className="score-credit">出典：Mutopia Project の結婚行進曲（CC BY-SA 4.0）を、TOMBO 3121 C調向けに主旋律化</p>
    </footer>
  </>;
}
