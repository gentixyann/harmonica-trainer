export type MidiNoteEvent = {
  at: number;
  length: number;
  midi: number;
  velocity: number;
  channel: number;
  program: number;
};

type TickNote = Omit<MidiNoteEvent, "at" | "length"> & {
  startTick: number;
  endTick: number;
};

type TempoEvent = {
  tick: number;
  microsecondsPerBeat: number;
};

/** Parses Standard MIDI files without requiring a browser plug-in. */
export class MidiFileParser {
  parse(arrayBuffer: ArrayBuffer): MidiNoteEvent[] {
    const reader = new MidiReader(arrayBuffer);
    if (reader.readText(4) !== "MThd") throw new Error("MIDIヘッダーを読み取れませんでした");

    const headerLength = reader.readUint32();
    const headerEnd = reader.offset + headerLength;
    reader.readUint16();
    const trackCount = reader.readUint16();
    const division = reader.readUint16();
    if (division & 0x8000) throw new Error("SMPTE形式のMIDIには未対応です");
    reader.offset = headerEnd;

    const tickNotes: TickNote[] = [];
    const tempos: TempoEvent[] = [];

    for (let track = 0; track < trackCount; track += 1) {
      this.readTrack(reader, tickNotes, tempos);
    }

    tempos.sort((left, right) => left.tick - right.tick);
    if (!tempos.length || tempos[0].tick !== 0) {
      tempos.unshift({ tick: 0, microsecondsPerBeat: 500_000 });
    }

    const secondsAt = createTickToSeconds(division, tempos);
    return tickNotes.map((note) => ({
      at: secondsAt(note.startTick),
      length: Math.max(0.01, secondsAt(note.endTick) - secondsAt(note.startTick)),
      midi: note.midi,
      velocity: note.velocity,
      channel: note.channel,
      program: note.program,
    })).sort((left, right) => left.at - right.at);
  }

  private readTrack(reader: MidiReader, notes: TickNote[], tempos: TempoEvent[]) {
    if (reader.readText(4) !== "MTrk") throw new Error("MIDIトラックを読み取れませんでした");

    const trackLength = reader.readUint32();
    const trackEnd = reader.offset + trackLength;
    const programs = Array<number>(16).fill(0);
    const activeNotes = new Map<string, Array<Omit<TickNote, "endTick">>>();
    let tick = 0;
    let runningStatus = 0;

    while (reader.offset < trackEnd) {
      tick += reader.readVariableLength();
      let status = reader.readUint8();
      if (status < 0x80) {
        reader.offset -= 1;
        status = runningStatus;
      } else if (status < 0xf0) {
        runningStatus = status;
      }

      if (status === 0xff) {
        const type = reader.readUint8();
        const length = reader.readVariableLength();
        if (type === 0x51 && length === 3) {
          tempos.push({ tick, microsecondsPerBeat: reader.readUint24() });
        } else {
          reader.skip(length);
        }
        if (type === 0x2f) break;
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        reader.skip(reader.readVariableLength());
        continue;
      }

      const command = status & 0xf0;
      const channel = status & 0x0f;
      const first = reader.readUint8();
      const second = command === 0xc0 || command === 0xd0 ? 0 : reader.readUint8();

      if (command === 0xc0) {
        programs[channel] = first;
        continue;
      }
      if (command !== 0x80 && command !== 0x90) continue;

      const key = `${channel}:${first}`;
      const isNoteOn = command === 0x90 && second > 0;
      if (isNoteOn) {
        const queue = activeNotes.get(key) ?? [];
        queue.push({ startTick: tick, midi: first, velocity: second, channel, program: programs[channel] });
        activeNotes.set(key, queue);
        continue;
      }

      const queue = activeNotes.get(key);
      const started = queue?.shift();
      if (started) notes.push({ ...started, endTick: tick });
    }

    reader.offset = trackEnd;
  }
}

class MidiReader {
  private readonly bytes: Uint8Array;
  private readonly view: DataView;
  offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.bytes = new Uint8Array(buffer);
    this.view = new DataView(buffer);
  }

  readText(length: number) {
    const value = String.fromCharCode(...this.bytes.slice(this.offset, this.offset + length));
    this.offset += length;
    return value;
  }

  readUint8() {
    return this.bytes[this.offset++];
  }

  readUint16() {
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }

  readUint24() {
    return this.readUint8() * 65_536 + this.readUint8() * 256 + this.readUint8();
  }

  readUint32() {
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  readVariableLength() {
    let value = 0;
    let byte = 0;
    do {
      byte = this.readUint8();
      value = value * 128 + (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  }

  skip(length: number) {
    this.offset += length;
  }
}

function createTickToSeconds(division: number, tempos: TempoEvent[]) {
  return (targetTick: number) => {
    let seconds = 0;
    let previousTick = 0;
    let microsecondsPerBeat = 500_000;

    for (const tempo of tempos) {
      if (tempo.tick > targetTick) break;
      seconds += (tempo.tick - previousTick) * microsecondsPerBeat / division / 1_000_000;
      previousTick = tempo.tick;
      microsecondsPerBeat = tempo.microsecondsPerBeat;
    }

    return seconds + (targetTick - previousTick) * microsecondsPerBeat / division / 1_000_000;
  };
}
