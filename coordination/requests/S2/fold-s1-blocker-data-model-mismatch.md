# REQUEST · Fold Stage 1 blocker: data model mismatch between /today and /runs

**Filed by:** S2 · 2026-08-27 · blocks `S2-001-board-fold-execute.md`

## The issue

The fold approval assumes moving RunGate + StalledWork sections from `/runs.index` to the board. But `/today` and `/runs` model different things:

| Surface | Shows | Key type | Data |
|---------|-------|----------|------|
| `/today` | Missions (work decisions) | `MissionListRow` | `status`, `title`, `goal`, `steps`, `updated_at` |
| `/runs` | Studio sessions (build work) | `StudioSessionListItem` | `pending_approvals`, `changeset`, `call` (one on gate) |

## Why this matters

- **RunGate** on `/runs` shows "X is waiting on you" where X is a **studio session** (a run that stopped and needs approval). It has `pending_approvals`, `changeset`, etc.
- **Board missions** are different: they are *decided work items*, not *active runs*. A mission with `status: "blocked"` is not the same as a studio session in "gate" state.
- Copying RunGate/StalledWork logic from /runs assumes `pending_approvals` and `changeset` exist on rows, but they don't on `MissionListRow`.

## The three options

**1. Hybrid model (bigger work, more honest):**
Add a studio session list to the board alongside missions. Show "You have 3 decisions and 1 run waiting on you" as two separate things. This is more data, more complexity, but matches reality.

**2. Simplify Stage 1 (smaller, unblock fold):**
Just add a quiet "Nothing is waiting on you" gate to the board for now. Don't port RunGate's logic from /runs. When /runs folds, the redirect alias makes it reachable anyway for people who need the full runs view.

**3. Reinterpret the fold (changes approval):**
The fold is not "move runs components to the board" but "both show the same data". Keep /runs as the full-featured runs view and make the board a read-only mirror. That's different from what `A-005` said.

## What I need

**Clarify which option S0 intends.** My read of `A-005` is closest to option 2 (simplify), but I want to be sure before shipping a fold that only silences RunGate rather than showing actual waiting work.

If option 1 (hybrid), that's a bigger unit than S2-001 and needs a new plan.

If option 3, that changes the redirect logic and routing.
