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
          <span className={`song-status ${entry.status}`}>{entry.status === "ready" ? "演奏できます" : entry.status === "local-midi" ? "MIDIを選択" : "楽譜準備中"}</span>
          <strong>{entry.title}</strong>
          <small>{entry.artist}</small>
          <span className="song-description">{entry.description}</span>
        </button>;
      })}
    </div>
  </section>;
}

type SongPreparationProps = {
  song: SongCatalogEntry;
  onMidiFile?: (file: File) => void;
  isLoading?: boolean;
  error?: string;
};

export function SongPreparation({ song, onMidiFile, isLoading, error }: SongPreparationProps) {
  return <section className="song-preparation" aria-live="polite">
    <span className="preparation-icon">♫</span>
    <p className="preparation-label">SELECTED SONG</p>
    <h2>{song.title}</h2>
    <p>{song.artist}</p>
    {onMidiFile ? <div className="preparation-message">
      <strong>購入したメロディMIDIをこの端末で開く</strong>
      <span>ファイルはサーバーに送信されず、この端末のブラウザ内で楽譜と音に変換されます。</span>
      <label className="midi-file-button">
        {isLoading ? "読み込み中…" : "MIDIファイルを選ぶ"}
        <input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" disabled={isLoading} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onMidiFile(file);
          event.target.value = "";
        }} />
      </label>
      <span>スマホでは「ファイル」アプリに保存したMIDIを選べます。読み込んだファイルはこのブラウザに保存されます。</span>
      {error && <span className="midi-file-error" role="alert">{error}</span>}
    </div> : <div className="preparation-message">
      <strong>複音ハーモニカ用の譜面を準備しています</strong>
      <span>正規のメロディMIDIまたはメロディ譜を取り込むと、単音・穴番号・吹吸へ変換できます。</span>
    </div>}
  </section>;
}
