# Unit 080 · the `--sp-*` census: nine dead tokens leave ink.css; two lying comments corrected

**Lane:** LANE 1 (standing work; `src/styles/**` except meridian.css is this
lane's path) · **2026-08-25** · no dev server.

## The census, re-runnable

Every `--sp-*` definition in the lane's style files (comments stripped before
counting), matched against every reader in `src/**`: literal `var(--tok)` reads
plus dynamic constructions (agent-glyphs.tsx and graph-visual.ts build token
names at runtime — a plain grep for `var(--sp-stage-learn)` finds nothing and
would have miskilled it).

| | before | after |
| --- | --- | --- |
| `--sp-*` definitions (non-meridian styles) | 62 real | **53** |
| with zero readers anywhere | 9 | **0** |

## What left, and why it was safe

Nine dead tokens from ink.css, all pure aliases into Meridian with **zero
readers in any css, ts, tsx or test**: `--sp-text-body`, `--sp-text-meta`,
`--sp-text-label`, `--sp-text-data`, `--sp-text-data-sm` (the rival type
scale's last ghosts — the exact family M04 called the founder's number one
pain), `--sp-leading-tight`, and the three `--sp-weight-*`.

**What was tried first:** the same collapse units 002/003 ran; these nine are
what survived them, unread since. `--sp-stage-learn` looks dead to a literal
grep but is constructed at runtime and is also the subject of MAIN's pending
stage-hue ruling — kept. `--sp-warn` is a real literal with live readers and no
Meridian counterpart — kept.

## Two comments that lied, corrected in place

1. `primitives.css` claimed three status classes "resolve straight through"
   custom properties `--sp-pass/fail/gate` "declared here". **Those
   declarations did not exist** — the census found zero definitions and zero
   readers; the class bodies already read `var(--mrd-*)` directly. The census's
   first pass counted them from the comment text itself, which is exactly the
   failure mode M-STATUS recorded ("a token match cannot tell a class attribute
   from a sentence about a class"). Comments stripped before counting now.
2. `shell.css` claimed "ink.css declares `--sp-gate: var(--mrd-you)`" behind
   the gate-dot rule. It did not — the rule reads `var(--mrd-you)` directly,
   which is also what satisfies the §5b guard. Both comments now state the
   real mechanism with the date.

## Ratchet

Re-frozen via `bun run design:ratchet` (the designed flow: debt REMOVED, so
the baseline was stale in the good direction): `src/styles/ink.css --sp-:
68 → 59`, 129 files carrying debt, 1536 total occurrences.

## Gates

`tsc` clean · full `bun test` **11,185 pass / 0 fail** (ratchet and
surface-discipline suites green after re-freeze) · eslint n/a for css. No dev
server. No rendered change: every deleted token had zero readers, so no
computed style on any surface differs.

## Also this stretch, recorded here for the ledger

- **Negative result:** the production watch (transcript-motion observation,
  L0-041's unobserved row) was abandoned — the scripted login to production is
  rejected (`E2E_DEMO_PASSWORD` fails against the live site; see INBOX). The
  MCP browser session also became unreachable mid-session. Neither observation
  was faked; both are recorded as not-taken.
