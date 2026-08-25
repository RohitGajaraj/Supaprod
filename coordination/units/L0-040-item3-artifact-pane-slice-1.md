# UNIT L0-040 — item 3, first slice: the artifact pane, Plan rendered as itself

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #3 · **Date:** 2026-08-25

## What changed

**`src/components/track/ArtifactPane.tsx` (new)** — the right-pane surface of
the design ruling, built per SPEC-ARTIFACTS.md:

- One tab per stop on the track's route (`Tabs`/`TabPanel`, Meridian; Lindy's
  tabbed right pane is the reference). Default tab = where the work stands.
- All four states derived from chain rows only (SPEC-ARTIFACTS §2): waived →
  the person's reason verbatim; not-run → purpose sentence; ran-and-filed-
  nothing → noun from `STATION_ARTIFACT`→`KIND_WORD` ("filed no code change",
  never "no changeset") plus the hold sentence when present; produced → the
  thing itself where a read exists.
- **Plan renders as itself**: full prd row via `getPrd` (the spec's §5 named
  path — "renders today with no new server function"), status chip on the
  five-word scale, saved-time, `Prose markdown` over `body_md`.
- **R-03 action on Plan**: edit title + whole `body_md` via `savePrd`. There is
  no section model on the row (spec §5(4)), so nothing more specific is
  claimed. Refusals render verbatim. Save invalidates the prd read AND the
  chain, because titles feed the chain.
- Polls the SHARED cache entry `["spine-track-chain"]` at 10s — one poll drives
  both this pane and TrackChain, so a walk that files something appears here
  within ten seconds without a refresh.

**`src/components/track/TrackRun.tsx`** — mounts the pane between the hold
banner and the run control.

## What was checked first (R-20)

- `TrackChain` — checked first; it answers *what was filed*, not *what the work
  is*, and SPEC-ARTIFACTS §0.2 rules it insufficient. It stays mounted as the
  record list; the two answer different questions.
- Meridian `Tabs`/`TabPanel` adopted (SPEC-ARTIFACTS §10: explicitly NOT a gap).
  No new component authored; no `mrd-` request needed.

## Honest limits, stated

- **decide/sense/design/build/ship/learn render their state + filed titles
  only.** Their bodies need MAIN's `getTrackArtifacts` (SPEC-ARTIFACTS §1),
  which does not exist yet — filed `requests/L0-021-track-artifacts.md` with
  the exact contract I am consuming. Per the no-stubs rule, nothing pretends.
- The queue's "build decide first" could not start against `decisions`: no
  id-keyed read of a decision row exists anywhere in `src/lib`
  (`getDecisionJudgment` returns judgment context, not the row). This is in the
  request.

## Gates (full suite, this tree)

- `bunx tsc --noEmit` — 0 errors
- `bun test` — 10,754 pass / **0 fail**
- eslint on both files — clean (repo-wide prettier backlog untouched)
- Dev server: never started (R-21); verification request follows once MAIN's
  read lands and the pane has more than states to show. For THIS slice:
  open any `/track/:trackId`, expect tabs for the route, honest sentences on
  empty stations, and a rendered spec with an Edit control on tracks whose
  Plan filed a prd.
