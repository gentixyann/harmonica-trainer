# Meta Steel Guitar samples

The MP3 files here are converted from the medium-velocity (`Vel02`) OGG
recordings in Meta Open Sound's **Meta Steel Guitar** collection:

- Source: https://github.com/facebookincubator/Meta-open-sound/tree/251c0be57d5d1b3242b91f53e0cde62ab1cb42d9/systems/instruments/meta-steel-guitar
- Source revision: `251c0be57d5d1b3242b91f53e0cde62ab1cb42d9`
- License: CC0 1.0 Universal; see `LICENSE.txt`
- Conversion: `ffmpeg -i source.ogg -codec:a libmp3lame -q:a 2 target.mp3`

Only the 16 pitches used by the transposed acoustic-guitar channel in the
first chorus of the locally imported MIDI are bundled. The purchased MIDI and
its derived note data are not included in this directory.
