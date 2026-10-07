type PlaybackControlsProps = {
  elapsed: number;
  duration: number;
  isPlaying: boolean;
  onToggle: () => void;
  onReset: () => void;
};

export function PlaybackControls({ elapsed, duration, isPlaying, onToggle, onReset }: PlaybackControlsProps) {
  const playLabel = isPlaying ? "Ⅱ 一時停止" : elapsed ? "▶ 再開" : "▶ 演奏スタート";
  return <>
    <header className="rhythm-header">
      <div><span className="mini-logo">♬</span><strong>Harmonica Flow</strong><span className="header-divider" /> <span>21-hole Tremolo · Key C</span></div>
      <div className="header-actions"><button onClick={onReset}>↺ 最初から</button><button className="play-button" onClick={onToggle}>{playLabel}</button></div>
    </header>
    <footer className="rhythm-footer">
      <div className="transport"><button onClick={onReset}>|◀</button><button className="round-play" onClick={onToggle}>{isPlaying ? "Ⅱ" : "▶"}</button><div className="time"><i style={{ width: `${elapsed / duration * 100}%` }} />{formatTime(elapsed)} / {formatTime(duration)}</div></div>
      <p className="score-credit">出典：Mutopia Project の結婚行進曲（CC BY-SA 4.0）を、TOMBO 3121 C調向けに主旋律化</p>
    </footer>
  </>;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
