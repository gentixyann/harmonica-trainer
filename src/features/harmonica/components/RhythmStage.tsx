import type { Breath, HarmonicaNote, Song } from "../domain/types";
import { HARMONICA_LAYOUT, positionForHole, type HarpPosition } from "../domain/tuning";

const PIXELS_PER_SECOND = 92;
const PLAYFIELD_HEIGHT = 700;
const HARMONICA_HEIGHT = 162;
const CONTACT_Y = PLAYFIELD_HEIGHT - HARMONICA_HEIGHT;
const HOLE_COUNT = 21;
const DEFAULT_NOTE_LENGTH = 0.58;

type RhythmStageProps = {
  song: Song;
  elapsed: number;
};

export function RhythmStage({ song, elapsed }: RhythmStageProps) {
  const activeBreaths = activeBreathsAt(song.notes, elapsed);

  return <section className="rhythm-stage" aria-label={`${song.title}の落下譜面`}>
    <div className="stage-top">
      <div className="legend"><span><i className="blow-dot" /> BLOW（吹く）</span><span><i className="draw-dot" /> DRAW（吸う）</span></div>
      <div className="song-title"><small>{song.artist.toUpperCase()}</small><strong>{song.title}</strong><span>{song.subtitle}</span></div>
    </div>
    <div className="performance-field">
      <div className="lanes" aria-hidden="true">{HARMONICA_LAYOUT.map((position) => <div className={`lane ${position.note === "ド" ? "do-lane" : ""}`} key={position.hole} />)}</div>
      {song.notes.map((note, index) => {
        const position = positionForHole(note.hole);
        if (!position) return null;
        const duration = note.length ?? DEFAULT_NOTE_LENGTH;
        const height = Math.max(30, duration * PIXELS_PER_SECOND);
        const top = CONTACT_Y - (note.at - elapsed) * PIXELS_PER_SECOND - height;
        const isVisible = top + height >= -40 && top <= PLAYFIELD_HEIGHT;
        const isActive = elapsed >= note.at && elapsed < note.at + duration;
        if (!isVisible) return null;
        return <div
          key={`${note.at}-${note.hole}-${index}`}
          className={`falling-note ${note.breath}${isActive ? " is-active" : ""}`}
          style={{ left: `calc(${(note.hole - 1) / HOLE_COUNT * 100}% + 5px)`, width: "calc(100% / 21 - 10px)", height, transform: `translateY(${top}px)` }}
          aria-label={`${position.degree}番 ${note.breath === "blow" ? "吹く" : "吸う"}`}
        ><b><ScaleDegree position={position} /></b></div>;
      })}
      <HarmonicaDiagram activeBreaths={activeBreaths} />
    </div>
  </section>;
}

function HarmonicaDiagram({ activeBreaths }: { activeBreaths: Map<number, Set<Breath>> }) {
  return <div className="harmonica-bar" aria-label="TOMBO 3121 C調の配列表">
    <div className="harp-shell">
      <div className="harp-holes">{HARMONICA_LAYOUT.map((position) => {
        const activeAtHole = activeBreaths.get(position.hole);
        const isActive = activeAtHole?.has(position.breath) ?? false;
        const activeClass = isActive ? ` active-hole active-${position.breath}` : "";
        return <div className={`harp-hole ${position.note === "ド" ? "do-hole" : ""}${activeClass}`} key={position.hole} aria-current={isActive ? "true" : undefined}>
        <div className="reed-cell blow">{position.breath === "blow" && position.note}</div>
        <div className="reed-cell draw">{position.breath === "draw" && position.note}</div>
        <ScaleDegree position={position} />
      </div>})}</div>
      <div className="range-labels"><span>低</span><span>高</span></div>
    </div>
  </div>;
}

function activeBreathsAt(notes: HarmonicaNote[], elapsed: number) {
  const active = new Map<number, Set<Breath>>();
  for (const note of notes) {
    const duration = note.length ?? DEFAULT_NOTE_LENGTH;
    if (elapsed < note.at || elapsed >= note.at + duration) continue;
    const breaths = active.get(note.hole) ?? new Set<Breath>();
    breaths.add(note.breath);
    active.set(note.hole, breaths);
  }
  return active;
}

function ScaleDegree({ position }: { position: HarpPosition }) {
  return <span className="scale-degree"><sup>{position.register > 0 ? "・".repeat(position.register) : ""}</sup>{position.degree}<sub>{position.register < 0 ? "・" : ""}</sub></span>;
}
