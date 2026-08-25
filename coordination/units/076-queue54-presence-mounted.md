# Unit 076 · Queue 54 — the character is mounted: rail miniature everywhere, introduction at /start

**Lane:** LANE 1 · **2026-08-25** · claim pushed before coding (`910d869ab`).
**Dev server:** started once for the render proof (port 8080), stopped inside the unit
(`lsof :8080` → 0 listeners) per R-21.

## What shipped

| File | Change |
| --- | --- |
| `src/components/shell/rail-presence.ts` | NEW. `deriveRailPresence(input)` — the rail's half of the presence contract. The run page derives from ONE track's rows via `deriveCharacter`; the shell stands on no track, so it derives from the reads it already polls. Precedence mirrors `deriveCharacter`: dead/unread feed → `out-of-touch`, a person needed → `asking`, work provably moving → `working`, else `awake`. No state exists that its input cannot prove. |
| `src/components/shell/__tests__/rail-presence.test.ts` | NEW. 7 tests: loading refuses to claim even with facts nominally present; feed-dead admitted first; asking beats working; each state's source named; awake only when nothing is provable. All pass. |
| `src/components/shell/AppFrame.tsx` | The who-slot draws `CharacterMark size={24}` in the derived state instead of the seat-silhouette stack / bare dot. MarkStack removed from the chrome — the roster was the org chart PRODUCT-TRUTH rules out of the experience; the lead sentence still says WHO is working, in words. While either read has not answered, NO mark renders (the quiet dot holds the box) — a face drawn before its facts would be smiling on a dead feed. `liveTarget`'s final fallback (no running, no moving tracks, nothing recent) now opens `/start` instead of an empty runs board, per SPEC-PRESENCE §Anatomy #2 "when nothing runs it is the door to /start". File-header ruling record amended with the date. Removed: `waiting` memo, `liveMarks`, `liveState`, `gateSurfaceOnScreen` (all served the old stack). |
| `src/routes/_authenticated.start.tsx` | The introduction moment (SPEC-PRESENCE §Anatomy #3): `CharacterMark` + one first-person line between heading and composer, present at first paint. Two states, both facts this page holds: idle = `awake` ("I'm Supa. Say what needs doing…"), and the pickup IS `go.isPending` rendered as `thinking` ("Picking that up now…"). Line is `aria-live="polite"` (R-19). Name comes from `CHARACTER_NAME`, so the founder's rename stays one line. |

## Meridian check (R-12 §4)

Checked `meridian/marks.tsx` first — `MarkStack`/`AgentMark` draw seat identity, which is exactly
what the presence ruling retires for the chrome, and they carry no state derivation.
`LoadingState` claims an agent works with no worker behind it. `CharacterMark` (already promoted,
MAIN/L0-authored) is the correct primitive and is used as-is; nothing new was painted.

## Proven live (harbor@ session, local dev server)

- `/start`: `img "Supa: awake"` + the line render at first paint — screenshot
  `docs/screenshots/start-intro-awake.png`.
- Submitting a sentence navigated to `/track/:id?start=true`; autoStart fired; the run page
  shows L0's character thinking while Discovery Scout works (23.6s clock) AND the header shows
  `img "Supa: asking"` beside "31 decisions are ready for you" — the queue count is real, so
  asking is the true state. Screenshot `docs/screenshots/track-header-asking-run-thinking.png`.
- `/settings`: same header mark renders there — presence is on every authed surface through the
  one shell. Screenshot `docs/screenshots/settings-header-character-dark.png`.
- Dark theme: mark computed style returns theme-aware oklch chip colours at exactly 24×24 —
  the line takes the theme's ink per SPEC-PRESENCE §Embodiment.
- One click to the run: unchanged `liveTarget` branch (running.length === 1 → `/track/:id`),
  already verified live in unit 069; not re-verified here because harbor currently holds gates,
  which outrank it by design.

## Honest gaps

- **The idle fallback → `/start` was not observed live**: harbor never idles (31 gates + moving
  Round-7 tracks), so the branch is proven by code path and types only. It fires exactly when
  running = 0 ∧ movingRuns = 0 ∧ gateCount = 0 ∧ lastDone = null.
- **The pickup (`thinking`) screenshot raced navigation** — the state flip is driven by
  `go.isPending`, asserted by the run page's own thinking state after handoff, but no pixel of
  the /start pickup frame itself was captured.
- **Side effect disclosed:** the verification submitted a real sentence ("Round 7 surface check:
  presence introduction") into harbor's Helio Labs, creating track `996e5258` which autoStart is
  walking. Ungrounded, so Discover will hold it honestly like its four Round-7 siblings — bounded
  spend, but it is a junk row MAIN may want to abandon with the other sweeps' leftovers.
- The header button's accessible name now composes "Supa: asking" + lead + facts. Longer than the
  old unnamed stack, strictly more informative; flagging in case MAIN wants the mark's label
  shortened for screen readers.

## Gates

`bunx tsc --noEmit` clean · full `bun test` **11,034 pass / 0 fail** (includes the 7 new) ·
eslint on all four touched files: 0 errors, 2 pre-existing react-refresh warnings (verified
pre-existing via stash-diff). Server stopped inside the unit.
