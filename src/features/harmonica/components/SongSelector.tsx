import type { SongCatalogEntry } from "../domain/songCatalog";

type SongSelectorProps = {
  songs: SongCatalogEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function SongSelector({ songs, selectedId, onSelect }: SongSelectorProps) {
  return <section className="song-library" aria-labelledby="song-library-title">
    <div className="song-library-heading">
      <div><small>SONG LIBRARY</small><h1 id="song-library-title">練習する曲を選ぶ</h1></div>
      <span>すべて TOMBO 3121 C調向け</span>
    </div>
    <div className="song-cards">
      {songs.map((entry) => {
        const selected = entry.id === selectedId;
        return <button
          key={entry.id}
          type="button"
          className={`song-card ${selected ? "selected" : ""}`}
          aria-pressed={selected}
          onClick={() => onSelect(entry.id)}
        >
          <span className={`song-status ${entry.status}`}>{entry.status === "ready" ? "演奏できます" : "楽譜準備中"}</span>
          <strong>{entry.title}</strong>
          <small>{entry.artist}</small>
          <span className="song-description">{entry.description}</span>
        </button>;
      })}
    </div>
  </section>;
}

export function SongPreparation({ song }: { song: SongCatalogEntry }) {
  return <section className="song-preparation" aria-live="polite">
    <span className="preparation-icon">♫</span>
    <p className="preparation-label">SELECTED SONG</p>
    <h2>{song.title}</h2>
    <p>{song.artist}</p>
    <div className="preparation-message">
      <strong>複音ハーモニカ用の譜面を準備しています</strong>
      <span>正規のメロディMIDIまたはメロディ譜を取り込むと、単音・穴番号・吹吸へ変換できます。</span>
    </div>
  </section>;
}
