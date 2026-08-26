# S2-001 · Execute /runs → board fold (queue item 1)

**Filed by:** S2 (Claude Code) · 2026-08-27 · S0 approved 2026-08-27, sequencing: content first, redirect flips after.

## What this unit does

Moves live board capability from `/runs.index` into `/today` (the board), executed in substeps so nothing 404s and nothing duplicates.

**Sequencing:** This unit ⇒ S0 semantic retargets ⇒ final redirect + tests (S2's next unit, same commit as S0's)

## Section D breakdown (content that moves)

### D1 · RunGate + StalledWork triage

**Where:** Currently in `/runs.index` JSX (lines ~1220-1280), triggered by `waiting` and `stalledRuns` arrays.

**What it shows:**
- RunGate with standing states: `you` (someone waiting), `clear` (nothing waiting), `failed` (read failed)
- StalledWork showing runs stuck longer than 24h

**Move to:** Board feed, rendered AFTER feed sections (after FEED_OPEN) but BEFORE final doors.

**Integration:** Reuse same queries (`waiting`, `stalledRuns`); mount on board with same read contract.

### D2 · RunBoard (list and kanban views)

**Where:** Currently at `/runs.index`, toggled by `board`/`list` mode button.

**What it shows:** Grid/kanban view of all missions with progress, status, spend.

**Move to:** Board's second view (toggle beside Running section title or new View menu).

**Integration:** Reuse RunBoard component; add mode toggle to board.

### D3 · Spend total

**Where:** In `/runs.index` as part of RunBoard header or grid footer.

**Move to:** Board's stats line (beside Running section or in header).

### D4 · useSpineStrip(null) publish

**Where:** Currently on `/runs` via `run-strip.tsx` wired in AppFrame.

**Status:** Already wired (checked per brief), just moves with content focus.

## Files to touch

**Board route (`_authenticated.today.tsx`)**
- Import RunGate, StalledWork, RunBoard from `/runs` components
- Add queries for `waiting`, `stalledRuns` (reuse from runs)
- Add board/list view toggle
- Render D1 triage sections after feed
- Render D2 board view alternative to feed
- Add D3 spend total to board header

**Runs route (`_authenticated.runs.index.tsx`)**
- Remove RunGate, StalledWork, RunBoard rendering (keep component definitions until S0 rules on delete)
- Simplify to render only composer + focused call view

**Components (`src/components/runs/`)** 
- No changes needed; components stay, just imported from board now

## Acceptance

Both views (live feed, RunBoard) render without duplication or 404; switching view works; spend displays; triage states show correctly.

## Blocks until

Nothing; this is first step of approved sequence.

## After

S0 flips B1/B4/B5 (nav labels, key binding, Ask scope) ⇒ S2 does final redirect + tests in one commit.
