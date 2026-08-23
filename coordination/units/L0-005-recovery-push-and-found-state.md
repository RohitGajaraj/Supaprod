# UNIT L0-005: The fallen session's last work verified, gated and pushed

**Lane:** LANE 0
**Completed:** 2026-08-23T16:50+05:30

## What was waiting uncommitted when this session resumed

Three things, left by the session that stopped mid-run on storage:

1. **REQ-L0-004 written but never pushed.** The loom-press finding (it resolves
   under the html-level data-obsidian hoist and carries a live 44px touch
   target) sat invisible to MAIN LANE exactly the way the protocol warns.
   Committed and pushed first thing as cd4c4607f, later rebased to 7d6c7f55a.
   UL0-002 had already ruled the same conclusion independently; the request's
   cascade evidence corroborates rather than contradicts it. loom-press stays
   until data-obsidian comes off html AND the floor exists elsewhere.
2. **BriefFormationFlow.tsx fully ported but ungated and unpersisted.**
   Eleven Obsidian-barrel Buttons onto Meridian Action tiers, per-control
   reasoning already written in its header. I verified both new imports exist
   (MonoLabel in supaprod/Primitives, Action.busy implying disabled in
   surface-parts), confirmed zero retired references remain in the file, ran
   both gates, and committed d95b8ad3e, later dc3c54b14. Attribution: the
   fallen session authored it; verification and push are mine.
3. **25 video renders deleted in the working tree**, storage cleanup from the
   crash. NOT committed: those are shared marketing assets and removing them
   from the repo permanently is not a lane call. They were restored during
   rebase recovery; the ~2GB sits back on disk. If the founder wants them out
   of git, that is an explicit ruling, then one deletion commit.

## Recovery mechanics worth recording

Two interrupted runs left duplicate stashes of the same deletions and a
transient index.lock under Supaprod/.git/worktrees/Supaprod-lane-0/ (the
worktrees share one .git, so another session's git operation can hold our
lock). Verified the stashes were identical 25-file copies, dropped both once
the tree held the same content, removed nothing unique, and rebased clean.
A rebase killed mid-flight restores stashed files via checkout; expect that.

## Measured on resume

| Metric | Value | Query |
| --- | --- | --- |
| Ratchet | 2721 / 212 | bun run design:ratchet |
| tsc | exit 0 | bunx tsc --noEmit |
| bun test | 10650 pass, 0 fail / 631 files | bun test |
| Native buttons left in MissionOrchestratorDetail | 8 | grep '<button' |

## Next

MissionOrchestratorDetail deep pass: judge each remaining native button
through the answers/M10 test, sweep the file for the U005/U006 defect shapes
(text-[Npx] beside a size-bearing role; bare leading-*), hierarchy audit,
then empty/loading/error states. 37 instances of the double-size shape exist
across my tree; the file-level fix lands with the file's port.
