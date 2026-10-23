import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/extract-harmonica-melody.mjs INPUT.mid OUTPUT.json");
}

const MELODY_CHANNEL = 0;
const CLIP_START_SECONDS = 0;
const CLIP_END_SECONDS = 71;
const MELODY_TRANSPOSE = -8;

const harmonicaByMidi = new Map([
  [48, [2, "blow"]], [50, [1, "draw"]], [52, [4, "blow"]],
  [53, [3, "draw"]], [55, [6, "blow"]], [57, [5, "draw"]],
  [59, [7, "draw"]], [60, [8, "blow"]], [62, [9, "draw"]],
  [64, [10, "blow"]], [65, [11, "draw"]], [67, [12, "blow"]],
  [69, [13, "draw"]], [71, [15, "draw"]], [72, [14, "blow"]],
  [74, [17, "draw"]], [76, [16, "blow"]], [77, [19, "draw"]],
  [79, [18, "blow"]], [81, [21, "draw"]], [84, [20, "blow"]],
]);

const midi = parseMidi(readFileSync(inputPath));
const melody = midi.notes
  .filter((note) => note.channel === MELODY_CHANNEL && note.at < CLIP_END_SECONDS && note.at + note.length > CLIP_START_SECONDS)
  .map((note) => {
    const position = harmonicaByMidi.get(note.midi + MELODY_TRANSPOSE);
    if (!position) throw new Error(`MIDI note ${note.midi} cannot be mapped to TOMBO 3121 C`);
    const [hole, breath] = position;
    return {
      hole,
      breath,
      at: round(Math.max(note.at, CLIP_START_SECONDS) - CLIP_START_SECONDS),
      length: round(Math.min(note.at + note.length, CLIP_END_SECONDS) - Math.max(note.at, CLIP_START_SECONDS)),
    };
  });

writeFileSync(outputPath, `${JSON.stringify(melody, null, 2)}\n`);
console.log(`Extracted ${melody.length} melody notes to ${outputPath}`);

function parseMidi(buffer) {
  let offset = 0;
  const ascii = (length) => {
    const value = buffer.toString("ascii", offset, offset + length);
    offset += length;
    return value;
  };
  const uint16 = () => {
    const value = buffer.readUInt16BE(offset);
    offset += 2;
    return value;
  };
  const uint32 = () => {
    const value = buffer.readUInt32BE(offset);
    offset += 4;
    return value;
  };
  const variableLength = () => {
    let value = 0;
    let byte;
    do {
      byte = buffer[offset++];
      value = value * 128 + (byte & 0x7f);
    } while (byte & 0x80);
    return value;
  };

  if (ascii(4) !== "MThd") throw new Error("Invalid MIDI header");
  const headerLength = uint32();
  uint16();
  const trackCount = uint16();
  const ticksPerBeat = uint16();
  offset = 8 + headerLength;

  const noteMessages = [];
  const tempos = [];

  for (let track = 0; track < trackCount; track += 1) {
    if (ascii(4) !== "MTrk") throw new Error("Invalid MIDI track");
    const trackLength = uint32();
    const trackEnd = offset + trackLength;
    let tick = 0;
    let runningStatus = 0;

    while (offset < trackEnd) {
      tick += variableLength();
      let status = buffer[offset++];
      if (status < 0x80) {
        offset -= 1;
        status = runningStatus;
      } else {
        runningStatus = status;
      }

      if (status === 0xff) {
        const type = buffer[offset++];
        const length = variableLength();
        if (type === 0x51) {
          tempos.push({ tick, microseconds: buffer.readUIntBE(offset, 3) });
        }
        offset += length;
        if (type === 0x2f) break;
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        const length = variableLength();
        offset += length;
        continue;
      }

      const command = status & 0xf0;
      const channel = status & 0x0f;
      const note = buffer[offset++];
      const velocity = command === 0xc0 || command === 0xd0 ? 0 : buffer[offset++];
      if (command === 0x90 || command === 0x80) {
        noteMessages.push({ tick, channel, midi: note, on: command === 0x90 && velocity > 0 });
      }
    }
    offset = trackEnd;
  }

  tempos.sort((left, right) => left.tick - right.tick);
  if (!tempos.length || tempos[0].tick !== 0) tempos.unshift({ tick: 0, microseconds: 500000 });

  const secondsAt = (targetTick) => {
    let seconds = 0;
    let previousTick = 0;
    let microseconds = 500000;
    for (const tempo of tempos) {
      if (tempo.tick > targetTick) break;
      seconds += (tempo.tick - previousTick) * microseconds / ticksPerBeat / 1_000_000;
      previousTick = tempo.tick;
      microseconds = tempo.microseconds;
    }
    return seconds + (targetTick - previousTick) * microseconds / ticksPerBeat / 1_000_000;
  };

  const active = new Map();
  const notes = [];
  for (const message of noteMessages) {
    const key = `${message.channel}:${message.midi}`;
    if (message.on) {
      const queue = active.get(key) ?? [];
      queue.push(message);
      active.set(key, queue);
      continue;
    }
    const queue = active.get(key);
    const started = queue?.shift();
    if (!started) continue;
    const at = secondsAt(started.tick);
    notes.push({ channel: message.channel, midi: message.midi, at, length: secondsAt(message.tick) - at });
  }

  return { notes };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
