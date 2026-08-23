# UNIT L0-005: Recovery of the fallen session's work

## Context

This session stopped mid-run twice (storage/RAM pressure, then an interrupted
rebase). This unit records what was found, verified, and pushed on resume.

## Found uncommitted on resume

| Item | State | Action taken |
| --- | --- | --- |
| `coordination/requests/L0-004-loom-press-is-live-app-wide.md` | Written, never committed | Committed and pushed first |
| `src/components/brief/BriefFormationFlow.tsx` | Fully ported, ungated | Verified, gated, committed |
| `videos/supaprod-film/renders/*.mp4` (25 deletions) | Local disk cleanup | NOT committed; restored to disk |

## Why each decision

1. **REQ-L0-004**: unpushed coordination does not exist. It reached main even
   though late. Note: `UL0-002` had already ruled loom-press live before this
   request was written; the request stands as corroborating cascade evidence,
   not a new question. No action changes: loom-press stays until
   `data-obsidian` leaves `<html>` AND its 44px floor has a replacement.
2. **BriefFormationFlow**: the port itself looked complete and reasoned
   (eleven Obsidian-barrel Buttons onto Meridian tiers, per-control rationale
   in the header comment). Verification performed rather than assumed:
   - `MonoLabel` exists in `supaprod/Primitives`
   - `Action.busy` exists in `surface-parts.tsx:580` and implies disabled
   - Zero remaining `@/components/obsidian` imports, zero `<Button` in file
   - Gates: tsc exit 0, bun test 10,650 pass / 0 fail / 631 files
   - loom-press deliberately retained on the Close button per the UL0-002
     ruling (44px mobile target still live through the html hoist)
3. **Video deletions**: these are tracked repo assets (~2 GB of marketing
   renders). Deleting them from git permanently is a destructive action on
   shared state outside this lane's product mandate. They were restored via
   stash dance during rebase recovery. Flagged for the founder to decide
   separately whether the repo should shed them.

## Recovery mechanics worth keeping

Two interrupted runs created duplicate stashes of identical content and one
stale-looking `index.lock` under the shared `.git/worktrees/Supaprod-lane-0/`.
Verified both stashes held byte-identical 25-file deletions, dropped both once
the working tree held the same state, removed the stale lock, rebased clean.
Lesson: after any killed rebase, expect stashed deletions to reappear in the
tree (checkout restores them) and dedupe stashes before re-stashing.

## Measured state at close of this unit

| Metric | Value | Query |
| --- | --- | --- |
| Ratchet total | 2,721 / 212 files | `bun run design:ratchet` |
| tsc | exit 0 | `bunx tsc --noEmit` |
| bun test | 10,650 pass, 23 skip, 0 fail | `bun test` |
| Native buttons left in MissionOrchestratorDetail | 8 | `grep -c "<button"` |
| Bare Tailwind leadings in that file | 0 | grep |
| Double-size shapes in that file | 0 | grep |

## Judgement calls recorded

All eight native buttons in MissionOrchestratorDetail were tested against the
answers/M10 question individually. Seven are reveal/dismiss/navigate controls
(disclosure chevrons with aria-expanded, view-switcher pills, the documented
reveal-only comparison toggle at line 1407); plain `<button>` is correct for
these and converting them would put a control tier on something that does not
act. The eighth is a copy-to-clipboard control at line 759; house convention
(TraceFacts CopyButton) keeps copy as a plain guarded button, so it stays.

## Open items handed forward

1. The double-size shape (`text-[Npx]` beside a size-bearing `text-mrd-*`)
   measured at 37 occurrences across my tree; next units fix file-by-file
   worst-first with the answers/U006 mechanical re-sweep after each.
2. Bare `leading-snug/tight/relaxed` conversions ride along with every file
   touched, per answers/M13.
3. Untiered-control concentrations remaining on my side of the split after
   BriefFormationFlow landed: ObsidianOnboarding (8), DecisionQueue (7),
   InvitationsPanel (7), DesignScaffoldPanel (7), ProductAnalyticsPanel (7).
