# Unit 055 · the `/start` landing (backlog item 2)

LANE 1 · 2026-08-25 · commit `b2add46e4` (pushed as `801b9c427`).

## What changed

| File | What |
| --- | --- |
| `src/routes/_authenticated.start.tsx` | The gate (`beforeLoad` redirect to /onboarding) deleted; the route now renders the one-sentence landing. `_authenticated.today.tsx` untouched (R-15). |
| `src/components/shell/RunComposer.tsx` | NEW, local under R-17 (`mrd-composer.md` filed same commit). Hero field: forms-family face at prose step, grows 1→3 lines, Enter submits, Shift+Enter newlines. |
| `src/components/shell/JobCards.tsx` | NEW, local under R-17 (`mrd-jobcard.md` filed same commit). Four job cards, copy verbatim from SPEC-ONRAMP §1.3, each mapping to its WorkShape; ring-not-fill selection like `Cell`; lines wrap where `Cell` truncates by its own ruling. |
| `src/routes/_authenticated.track.$trackId.tsx` | Disclosure line added between heading and TrackRun: workspace, product clause when `productsVisible`, and the decide-waived sentence derived from `waiverFor(track.route,"decide")` — never a guess, no control on the line (SPEC-ONRAMP §2.6). |

**What was tried first:** `Cell` (truncates both lines unconditionally,
`:1720-1724`, its own header says there is no prop), `Input` (`h-8 text-[13px]`,
a control sized to sit beside Picker), `Textarea` (`min-h-20 resize-y`, a form
field). None serves a hero composer or a wrapping pick-card. Requests
`017`, `018`, `019`, `mrd-jobcard`, `mrd-composer` all pushed with the claim.

**Behaviour ruled in and shipped:**

- Sentence doubles as `origin` on the three shapes entering below Discover —
  what `validateRoute` refuses without (`route.ts:469`) and what Learn grades against.
- Default shape `new-capability` when no card picked: the only shape that keeps
  `decide`, so the default keeps the forecast reachable (SPEC-ONRAMP §2.4).
- Open runs render live above the cards from `listTracks()`; empty means empty —
  nothing seeded, nothing narrating emptiness.
- No workspace → composer refuses to submit with an honest line and a door to
  `/onboarding`. **Known gap, not hidden:** `startTrack` cannot carry
  `workspaceId` yet (REQ-1), so tracks started here are null-workspace exactly
  like every existing door until MAIN lands it.

## Click and decision count (SPEC-ONRAMP §3; sources cited)

**Before** (from `/today`, counted at SPEC-ONRAMP §3.1): 6 clicks and 3
decisions about the model — and the last step impossible: no surface links to
or prints a track id, so **the run view was unreachable**.

**After:**

| path | clicks | model decisions |
| --- | --- | --- |
| card + sentence + Enter, once REQ-3 lands | 1 | 0 |
| card + sentence + Enter, **as shipped today** | **2** — card, then TrackRun's "Run it now" (`TrackRun.tsx:93`) | 0 |
| sentence + Enter, no card, **as shipped** | **1** — "Run it now" | 0 |

The gap between shipped and target is exactly REQ-3 (`autoStart` on `TrackRun`,
filed to LANE 0). Recorded honestly rather than claimed.

## Gates (this tree, full runs)

- `bunx tsc --noEmit` → exit 0
- `bun test` → **10,662 pass / 0 fail**, 10,720 across 629 files, exit 0
  (the 12 pre-existing failures named in the brief are green on current main;
  unit 054 recorded main going green again — none of this unit's doing)
- `bun run lint` repo-wide → still carries ~3,085 pre-existing problems outside
  my files (the deferred backlog); `eslint --fix` on my four files applied, my
  files re-checked clean (one non-blocking fast-refresh warning on exporting
  `JOBS` beside the component)
- Dev server: **not started** — nothing here needed a browser to build; browser
  proof is the verify request below (R-21).

## Not verified / could not check

- **Nothing rendered in a browser by me.** A mount is not a render; the verify
  request names exactly what to look for and what would prove it false.
- `listTracks()` row volume in production unknown to me (no DB). If it returns
  many open tracks the section caps at 5 rows.
- Whether `--mrd-*` has a type step between base and PageHeading — flagged
  UNVERIFIED in `mrd-composer.md`; composer uses `text-mrd-prose` meanwhile.
- `route-inventory.test.ts:160`'s AUTH_EXEMPT reason for `/start`
  ("parked Phase-5 alternative…") is now stale — the file lives in `src/lib/**`,
  not my path. MAIN may want to update the wording; the entry itself must stay
  while promotion is pending.
