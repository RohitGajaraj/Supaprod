#!/bin/bash
# Build the film's full audio master: 13 VO lines at frame offsets + music bed with sidechain ducking.
# Output: audio-master.m4a (127.4s), ready to mux onto the rendered video.
set -euo pipefail
cd "$(dirname "$0")"
FF=/opt/homebrew/bin/ffmpeg

# Frame start times (s): F1 0.0 F2 8.2 F3 16.7 F4 31.2 F5 42.0 F6 49.3 F7 57.6
# F8 65.6 F9 83.8 F10 94.6 F11 106.9 F12 114.1 F13 118.1 — VO enters ~0.4s after each frame.
$FF -y \
  -i 01.mp3 -i 02.mp3 -i 03.mp3 -i 04.mp3 -i 05.mp3 -i 06.mp3 -i 07.mp3 \
  -i 08.mp3 -i 09.mp3 -i 10.mp3 -i 11.mp3 -i 12.mp3 -i 13.mp3 -i music.m4a \
  -filter_complex "\
[0:a]adelay=500|500[v0];\
[1:a]adelay=8600|8600[v1];\
[2:a]adelay=17100|17100[v2];\
[3:a]adelay=31600|31600[v3];\
[4:a]adelay=42400|42400[v4];\
[5:a]adelay=49700|49700[v5];\
[6:a]adelay=58000|58000[v6];\
[7:a]adelay=66000|66000[v7];\
[8:a]adelay=84200|84200[v8];\
[9:a]adelay=95000|95000[v9];\
[10:a]adelay=107300|107300[v10];\
[11:a]adelay=114500|114500[v11];\
[12:a]adelay=118500|118500[v12];\
[v0][v1][v2][v3][v4][v5][v6][v7][v8][v9][v10][v11][v12]amix=inputs=13:normalize=0,dynaudnorm=g=7:m=4.0,volume=1.0[vo];\
[13:a]atempo=0.9262,volume=0.34,afade=t=in:d=2.0,afade=t=out:st=123.4:d=4.0[mus];\
[vo]asplit=2[voA][voKey];\
[mus][voKey]sidechaincompress=threshold=0.04:ratio=6:attack=60:release=700:makeup=1[musd];\
[voA][musd]amix=inputs=2:normalize=0,alimiter=limit=0.93,aformat=sample_rates=48000:channel_layouts=stereo[out]" \
  -map "[out]" -t 127.4 -c:a aac -b:a 256k audio-master.m4a
echo "AUDIO_MASTER_DONE"; /opt/homebrew/bin/ffprobe -v quiet -show_entries format=duration -of csv=p=0 audio-master.m4a
