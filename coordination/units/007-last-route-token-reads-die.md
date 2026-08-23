# UNIT 007: the last retired-token reads on my routes die

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 1/3 closeout for routes
**Files:** `src/routes/{proof,ard,t.$slug,subprocessors}.tsx`,
`src/__tests__/meridian-ratchet.baseline.json`

## What was wrong

Eleven markers left on my side of the path split: `var(--hairline, rgba(...))` with
literal fallbacks on four public pages (proof, ard, t.$slug, subprocessors) and one
`var(--text-subtle, #7d786f)`. These are exactly the shape the ratchet's own ruling
calls debt-with-a-hex-behind-it: a retired first argument whose fallback becomes the
only paint the day the token layer dies.

## What changed

Both forms map to Meridian by role: hairline → `--mrd-edge`, text-subtle → `--mrd-mute`.
The literal fallbacks were dropped with the retired names rather than carried across as
Meridian fallbacks: these pages render after the stylesheet loads like every other route,
so a degradation path for pre-token paint buys nothing and re-introduces the raw hex.

## Verification

tsc exit 0; suite 10,726 / 0 fail. `/ard` renders 200 with the port live. `/proof`
returns 500 in local dev under BOTH the old and new file (verified by stash-and-retry
negative control), caused by missing server secrets in this lane's environment —
pre-existing and unrelated to style strings. Ratchet 2,756 → 2,736.

## Where my paths stand after seven units

| | run start | now |
| --- | --- | --- |
| ratchet total | 3,170 | **2,736** (-434, -13.7%) |
| files carrying debt | 222 | 214 |
| routes with any retired-token read | ~40 files | **0** |
| bare Tailwind leadings on routes | 18 | **0** |

What remains on MY paths is two definition-heavy files I cannot finish alone:
`styles.css` at 694 markers (falls when LANE 0's 114 `--ds-*` uses port, per REQ-002)
and the shell pair (`shell/primitives.tsx` 92, `AppFrame.tsx` 57), which is markup
surgery on the chrome of every authenticated page and deserves a fresh session's full
budget rather than the tail of mine.
