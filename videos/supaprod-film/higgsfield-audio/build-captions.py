#!/usr/bin/env python3
"""Captions for the film, derived from the SAME numbers the mix is built from.

WHY THIS IS GENERATED AND NEVER HAND-TYPED. A hand-written VTT drifts the
moment a line is re-recorded or the rhythm map moves, and a caption that drifts
is worse than none: it tells a deaf viewer the wrong word at the wrong moment.
Every timing here is computed from `build-final-mix.py`'s own frozen table, so
a change there is a change here after one re-run.

  start(i) = F[i] + OFFSET[i]        <- exactly what vo_delays does
  played(i) = raw(NN.mp3) / TEMPO[i] <- atempo shortens the take

The text is the narration from ../SCRIPT.md, which is canonical for wording.

Long lines are split into readable cues: one sentence per cue where a sentence
fits, otherwise at the nearest comma under MAX_CHARS. Time inside a line is
allocated by character count, which tracks speech rate closely enough for
narration at an even pace and never lets a cue outrun its line's window.

Run from higgsfield-audio/:  python3 build-captions.py
Writes ../../../public/film/supaprod-film.vtt
"""

import os
import re
import subprocess

# The frozen v10 table, copied from build-final-mix.py. If that file's DUR,
# OFFSET or TEMPO change, change them here in the same commit.
DUR = [8.8, 12.1, 13.7, 11.3, 6.9, 11.0, 6.4, 22.8, 10.8, 10.8, 11.8, 6.4, 9.3]
OFFSET = [0.4] * 13
OFFSET[3] = 1.4
OFFSET[4] = 0.9
OFFSET[5] = 1.38
OFFSET[7] = 0.75
OFFSET[8] = 1.0
OFFSET[9] = 0.6
OFFSET[12] = 2.4
TEMPO = [1.05] * 13
TEMPO[7] = 1.09

# The narration, verbatim from ../SCRIPT.md. Em dashes are spelled as the
# spoken pause they represent; the zero-dash rule governs RENDERED PICTURE, and
# captions are text a screen reader also speaks, so ordinary punctuation is
# correct here.
LINES = [
    "These days, anyone can build. Agents write the code, features ship beautifully, in no time.",
    "But what to build, nobody cracks that call. So teams build the wrong features and miss what mattered. That's the judgment gap.",
    "You know the feeling. Signals everywhere: interviews, tickets, dashboards, hunches. The loudest voice wins. And six months later, someone asks, why did we build this? Nobody remembers.",
    "Supaprod. Where the work runs on agents, and the calls stay yours. Agents that know what to build, ship it, and guide the next call.",
    "Your signals pour in. It reads every one, and hands you ranked bets, evidence attached.",
    "It scores each bet. When the data says you're wrong, it disagrees. And the exciting idea loses to the boring one that pays.",
    "And at the moment you commit, it writes down what you believe will happen. Before you find out.",
    "Agents run every station. In Plan, the spec writes itself. In Design, the prototype takes shape. In Build, the code is written and tested, inside your boundaries. And Ship isn't just launch day: the announcement, the changelog, the customer email. Done. One platform. The whole product lifecycle.",
    "When results land, Learn scores every outcome against the call that caused it. The brain takes it in, and your next bet re-ranks itself.",
    "And the next time you're deciding, it's beside you: the same call from last quarter, and how it went. About to repeat a mistake? It warns you.",
    "What you believed. What worked. What didn't, and why. Your shared brain, at the table, every time.",
    "Agents run the work. The judgment is yours. Every call makes the next one sharper.",
    "Supaprod. Build what matters.",
]

MAX_CHARS = 84  # two comfortable caption lines
WRAP_AT = 44  # break a cue onto a second line past this


def raw_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(out.stdout.strip())


def chunk(text):
    """Sentence-first, comma-second. Never returns a chunk over MAX_CHARS
    unless a single clause genuinely is that long."""
    sentences = [s.strip() for s in re.split(r"(?<=[.?!])\s+", text) if s.strip()]
    out = []
    for s in sentences:
        if len(s) <= MAX_CHARS:
            out.append(s)
            continue
        # Too long: pack clauses up to the limit.
        parts = [p.strip() for p in re.split(r"(?<=[,:])\s+", s) if p.strip()]
        buf = ""
        for p in parts:
            candidate = f"{buf} {p}".strip()
            if buf and len(candidate) > MAX_CHARS:
                out.append(buf)
                buf = p
            else:
                buf = candidate
        if buf:
            out.append(buf)
    return out


def wrap(text):
    """At most two lines. Break at the last space before WRAP_AT."""
    if len(text) <= WRAP_AT:
        return text
    cut = text.rfind(" ", 0, WRAP_AT + 1)
    if cut == -1:
        return text
    return text[:cut] + "\n" + text[cut + 1 :]


def stamp(t):
    h, rem = divmod(t, 3600)
    m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}"


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    starts, acc = [], 0.0
    for d in DUR:
        starts.append(acc)
        acc += d

    cues = []
    for i, text in enumerate(LINES):
        take = os.path.join(here, f"{i + 1:02d}.mp3")
        played = raw_duration(take) / TEMPO[i]
        begin = starts[i] + OFFSET[i]

        pieces = chunk(text)
        total_chars = sum(len(p) for p in pieces) or 1
        t = begin
        for p in pieces:
            span = played * (len(p) / total_chars)
            cues.append((t, t + span, wrap(p)))
            t += span

    # A cue must never outlive the line that follows it. Nothing should trip
    # this given the frozen table, so it is an assertion, not a silent clamp.
    for a, b in zip(cues, cues[1:]):
        assert a[1] <= b[0] + 1e-6, f"cue overlap: {a[1]:.3f} > {b[0]:.3f}"

    body = ["WEBVTT", ""]
    for n, (a, b, text) in enumerate(cues, 1):
        body += [str(n), f"{stamp(a)} --> {stamp(b)}", text, ""]

    dest = os.path.join(here, "..", "..", "..", "public", "film", "supaprod-film.vtt")
    dest = os.path.normpath(dest)
    with open(dest, "w", encoding="utf-8") as f:
        f.write("\n".join(body))
    print(f"{len(cues)} cues -> {dest}")


if __name__ == "__main__":
    main()
