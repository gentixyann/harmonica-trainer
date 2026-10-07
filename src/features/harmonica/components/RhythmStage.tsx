import type { Song } from "../domain/types";
import { HARMONICA_LAYOUT, positionForHole, type HarpPosition } from "../domain/tuning";

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
      <div className="lanes">{HARMONICA_LAYOUT.map((position) => <div className={`lane ${position.note === "ド" ? "do-lane" : ""}`} key={position.hole}><ScaleDegree position={position} /></div>)}</div>
      <div className="hit-zone"><span className="hit-caption">ここで吹く！</span></div>
      {song.notes.map((note, index) => {
        const position = positionForHole(note.hole);
        if (!position) return null;
        const height = (note.length ?? 0.58) * PIXELS_PER_SECOND;
        const top = HIT_LINE - (note.at - elapsed) * PIXELS_PER_SECOND - height;
        return <div key={index} className={`falling-note ${note.breath}`} style={{ left: `calc(${(note.hole - 1) / HOLE_COUNT * 100}% + 3px)`, width: "calc(100% / 21 - 6px)", height, transform: `translateY(${top}px)` }}><b><ScaleDegree position={position} /></b><small>{note.breath === "blow" ? "吹" : "吸"}</small></div>;
      })}
    </div>
    <HarmonicaDiagram />
  </section>;
}

function HarmonicaDiagram() {
  return <div className="harmonica-bar" aria-label="TOMBO 3121 C調の配列表">
    <div className="harp-shell">
      <div className="harp-holes">{HARMONICA_LAYOUT.map((position) => <div className={`harp-hole ${position.note === "ド" ? "do-hole" : ""}`} key={position.hole}>
        <div className="reed-cell blow">{position.breath === "blow" && position.note}</div>
        <div className="reed-cell draw">{position.breath === "draw" && position.note}</div>
        <ScaleDegree position={position} />
      </div>)}</div>
      <div className="range-labels"><span>低</span><span>高</span></div>
    </div>
  </div>;
}

function ScaleDegree({ position }: { position: HarpPosition }) {
  return <span className="scale-degree"><sup>{position.register > 0 ? "・".repeat(position.register) : ""}</sup>{position.degree}<sub>{position.register < 0 ? "・" : ""}</sub></span>;
}
