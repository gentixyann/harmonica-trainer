import type { Song } from "../domain/types";

const PIXELS_PER_SECOND = 92;
const HIT_LINE = 520;
const HOLE_COUNT = 21;

type RhythmStageProps = {
  song: Song;
  elapsed: number;
};

export function RhythmStage({ song, elapsed }: RhythmStageProps) {
  return <section className="rhythm-stage" aria-label={`${song.title}の落下譜面`}>
    <div className="stage-top">
      <div className="legend"><span><i className="blow-dot" /> BLOW（吹く）</span><span><i className="draw-dot" /> DRAW（吸う）</span></div>
      <div className="song-title"><small>MENDELSSOHN</small><strong>{song.title}</strong><span>{song.subtitle}</span></div>
    </div>
    <div className="scroll-track">
      <div className="lanes">{Array.from({ length: HOLE_COUNT }, (_, index) => <div className={`lane ${index < 8 ? "used" : ""}`} key={index}><span>{index + 1}</span></div>)}</div>
      <div className="hit-zone"><span className="hit-caption">ここで吹く！</span></div>
      {song.notes.map((note, index) => {
        const height = (note.length ?? 0.58) * PIXELS_PER_SECOND;
        const top = HIT_LINE - (note.at - elapsed) * PIXELS_PER_SECOND - height;
        return <div key={index} className={`falling-note ${note.breath}`} style={{ left: `calc(${(note.hole - 1) / HOLE_COUNT * 100}% + 3px)`, width: "calc(100% / 21 - 6px)", height, transform: `translateY(${top}px)` }}><b>{note.hole}</b><small>{note.breath === "blow" ? "吹" : "吸"}</small></div>;
      })}
    </div>
    <HarmonicaDiagram />
  </section>;
}

function HarmonicaDiagram() {
  return <div className="harmonica-bar"><div className="harp-label">TOMBO<br /><b>3121</b></div><div className="harp-holes">{Array.from({ length: HOLE_COUNT }, (_, index) => <div className="harp-hole" key={index}><span>{index + 1}</span><i /></div>)}</div></div>;
}
