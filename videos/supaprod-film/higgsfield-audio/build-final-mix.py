#!/usr/bin/env python3
"""Final film mix: Vesper VO (1.05x pitch-preserved) + music-final + SFX, deep ducking.
Frozen v10 table: F1 8.8 F2 12.1 F3 13.7 F4 11.3 F5 6.9 F6 11.0 F7 6.4 F8 22.8
F9 10.8 F10 10.8 F11 11.8 F12 6.4 F13 9.3 = 142.1s. Run from higgsfield-audio/."""
import subprocess

DUR = [8.8, 12.1, 13.7, 11.3, 6.9, 11.0, 6.4, 22.8, 10.8, 10.8, 11.8, 6.4, 9.3]
starts, t = [], 0.0
for d in DUR:
    starts.append(t); t += d
F = starts  # F[0]..F[12]
# The rhythm map (founder ruling: the film must breathe; no seam under ~0.5s of air).
# Measured line ends vs next line starts; these offsets open the three breathless seams
# (L5>L6 was 0.02s, L7>L8 0.15s, L8>L9 0.13s) without touching the picture.
OFFSET = [0.4] * 13
OFFSET[3] = 1.4   # the reflection: "Nobody remembers." hangs 1.1s before the brand enters
OFFSET[4] = 0.9   # L5 slides with it
OFFSET[5] = 1.38  # L6 too; its tail still clears L7 by half a second
OFFSET[7] = 0.75  # air after the forecast line, before the tour begins
OFFSET[8] = 1.0   # the tour finishes, one breath, then the loop closes
OFFSET[9] = 0.6   # keeps L9>L10 at half a second after the L9 shift
OFFSET[12] = 2.4  # the pre-CTA breath: 2.4s of pure score between the impact line and the close
vo_delays = [int((s + o) * 1000) for s, o in zip(F, OFFSET)]

# (sfx_name, absolute_time_s, volume, trim_s or None) — frame-local cues on the frozen table
sfx = [
    ('keys',   F[0]+0.6,  0.50, 2.4),   # F1 agent typing
    ('whoosh', F[0]+2.7,  0.40, None),  # F1 pan to deploy
    ('chime',  F[0]+6.1,  0.45, None),  # F1 deploy live
    ('whoosh', F[2]+2.3,  0.32, None),  # F3 window pans
    ('whoosh', F[2]+4.3,  0.32, None),
    ('whoosh', F[2]+6.3,  0.32, None),
    ('alert',  F[2]+7.1,  0.30, None),  # F3 exec message ping
    ('keys',   F[2]+10.0, 0.42, 3.0),   # F3 question typing
    ('whoosh', F[3]+2.3,  0.36, None),  # F4 rack focus begins
    ('chime',  F[3]+7.2,  0.28, None),  # F4 gate chip pulse
    ('tick',   F[4]+2.9,  0.50, None),  # F5 rank chips
    ('tick',   F[4]+3.4,  0.50, None),
    ('tick',   F[4]+3.9,  0.50, None),
    ('click',  F[4]+5.2,  0.50, None),  # F5 evidence popover
    ('tick',   F[5]+2.6,  0.55, None),  # F6 score badges
    ('tick',   F[5]+3.3,  0.55, None),
    ('punch',  F[5]+7.9,  0.30, None),  # F6 the kill, on "loses"
    ('keys',   F[6]+0.7,  0.38, 2.2),   # F7 forecast typing
    ('click',  F[6]+3.3,  0.55, None),  # F7 commit
    ('seal',   F[6]+4.2,  0.60, None),  # F7 seal
    ('keys',   F[7]+0.7,  0.32, 3.0),   # F8 spec typing
    ('whoosh', F[7]+5.9,  0.38, None),  # F8 pan to Design
    ('whoosh', F[7]+8.8,  0.38, None),  # F8 pan to Build
    ('whoosh', F[7]+14.4, 0.38, None),  # F8 pan to Ship
    ('tick',   F[7]+15.6, 0.45, None),  # F8 GTM checklist
    ('tick',   F[7]+16.2, 0.45, None),
    ('tick',   F[7]+16.8, 0.45, None),
    ('whoosh', F[7]+19.6, 0.34, None),  # F8 dive to the route
    ('chime',  F[8]+1.2,  0.28, None),  # F9 verdict lands
    ('tick',   F[8]+6.5,  0.50, None),  # F9 re-rank
    ('alert',  F[9]+3.3,  0.45, None),  # F10 precedent panel (warn.m4a retired: it read as a second voice under L10)
    ('click',  F[9]+8.6,  0.40, None),  # F10 view-the-record hover
    ('keys',   F[10]+0.6, 0.40, 1.7),   # F11 palette typing
    ('click',  F[10]+2.3, 0.45, None),  # F11 answer lands
    ('punch',  F[10]+6.4, 0.25, None),  # F11 rack-focus deep hit
    ('swell',  F[11]+0.1, 0.50, None),  # F12 orange promise
    ('click',  F[5]+7.1,  0.35, None),  # F6 drag begins
    ('tick',   F[1]+1.0,  0.30, None),  # F2 release rows
    ('tick',   F[1]+1.6,  0.30, None),
    ('tick',   F[1]+2.2,  0.30, None),
    ('bloom',  F[12]+3.9, 0.45, None),  # F13 tagline reveal, timed to the spoken closing statement
]

files = [f'{i:02d}.mp3' for i in range(1, 14)] + ['music-final.m4a'] + \
        [f'sfx/{n}.m4a' for n in sorted({s[0] for s in sfx})]
idx = {n: 14 + i for i, n in enumerate(sorted({s[0] for s in sfx}))}

fc = []
TEMPO = [1.05] * 13
TEMPO[7] = 1.09  # L8 runs 24.48s raw; 1.09 fits it between its delayed start and L9's breath
for i, d in enumerate(vo_delays):
    fc.append(f'[{i}:a]atempo={TEMPO[i]},adelay={d}|{d}[v{i}]')
fc.append(''.join(f'[v{i}]' for i in range(13)) +
          'amix=inputs=13:normalize=0,dynaudnorm=g=7:m=4.0,volume=1.12[vo]')
fc.append('[13:a]volume=0.38,afade=t=out:st=141.3:d=0.8[mus]')  # the track's own quiet resolution carries the close; only a hair of protection at the end
uses = {}
for n, *_ in sfx: uses[n] = uses.get(n, 0) + 1
for n, cnt in uses.items():
    outs = ''.join(f'[{n}{k}]' for k in range(cnt))
    fc.append(f'[{idx[n]}:a]asplit={cnt}{outs}' if cnt > 1 else f'[{idx[n]}:a]acopy[{n}0]')
counters = {n: 0 for n in uses}; snames = []
for j, (n, at, vol, trim) in enumerate(sfx):
    k = counters[n]; counters[n] += 1
    ms = int(at * 1000)
    filt = (f'atrim=0:{trim},afade=t=out:st={round(trim-0.4,2)}:d=0.4,' if trim else '') + \
           f'volume={vol},adelay={ms}|{ms}'
    fc.append(f'[{n}{k}]{filt}[s{j}]'); snames.append(f'[s{j}]')
fc.append(''.join(snames) + f'amix=inputs={len(snames)}:normalize=0[sfx]')
fc.append('[vo]asplit=2[voA][voKey]')
fc.append('[mus][voKey]sidechaincompress=threshold=0.030:ratio=8:attack=40:release=550:makeup=1[musd]')
fc.append('[voA][musd][sfx]amix=inputs=3:normalize=0,alimiter=limit=0.93,'
          'aformat=sample_rates=48000:channel_layouts=stereo[out]')

cmd = ['/opt/homebrew/bin/ffmpeg', '-y', '-v', 'error']
for f in files: cmd += ['-i', f]
cmd += ['-filter_complex', ';'.join(fc), '-map', '[out]', '-t', '142.1',
        '-c:a', 'aac', '-b:a', '256k', 'audio-master-v16-final.m4a']
r = subprocess.run(cmd, capture_output=True, text=True)
print(r.stderr[-500:] if r.returncode else 'FINAL FILM MIX DONE: audio-master-v16-final.m4a')
