type PlaybackControlsProps = {
  isPlaying: boolean;
  onToggle: () => void;
  onReset: () => void;
};

type PlaybackTransportProps = PlaybackControlsProps & {
  elapsed: number;
  duration: number;
  onSeek: (position: number) => void;
};

export function PlaybackControls({ isPlaying, onToggle, onReset }: PlaybackControlsProps) {
  const playLabel = isPlaying ? "Ⅱ 一時停止" : "▶ 演奏スタート";
  return <header className="rhythm-header">
    <div><span className="mini-logo">♬</span><strong>Harmonica Flow</strong><span className="header-divider" /> <span>21-hole Tremolo · Key C</span></div>
    <div className="header-actions"><button onClick={onReset}>↺ 最初から</button><button className="play-button" onClick={onToggle}>{playLabel}</button></div>
  </header>;
}

export function PlaybackTransport({ elapsed, duration, isPlaying, onToggle, onReset, onSeek }: PlaybackTransportProps) {
  return <footer className="rhythm-footer">
      <div className="transport">
        <button aria-label="最初から" onClick={onReset}>|◀</button>
        <button aria-label={isPlaying ? "一時停止" : "再生"} className="round-play" onClick={onToggle}>{isPlaying ? "Ⅱ" : "▶"}</button>
        <label className="seek-control">
          <input aria-label="再生位置" type="range" min="0" max={duration} step="0.1" value={Math.min(elapsed, duration)} style={{ background: `linear-gradient(to right, #f1d14b ${elapsed / duration * 100}%, #3e444a ${elapsed / duration * 100}%)` }} onChange={(event) => onSeek(Number(event.target.value))} />
          <span>{formatTime(elapsed)} / {formatTime(duration)}</span>
        </label>
      </div>
      <p className="score-credit">出典：添付の TOMBO 3121 初心者用ショート譜をもとにした単音練習版</p>
    </footer>;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}
