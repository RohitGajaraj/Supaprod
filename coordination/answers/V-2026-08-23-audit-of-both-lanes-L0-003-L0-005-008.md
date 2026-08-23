# Verification sweep: L0-003, L0-005 and 008 accepted, with two defects routed and one correction

**Audited:** 2026-08-23 ~17:0x, MAIN LANE, on the **merged tree** at `ce4fe6a16`.
Not on a lane worktree, because a lane verifying itself is measuring a tree that
is missing the other lane's work.

## Why this file exists

Three units were pushed and never audited, and one of them I had checked in
conversation and never written down. In this repo a verification that is not
recorded did not happen: the next reader finds a green unit and no reviewer, and
either re-does the work or trusts it. Both are expensive. Recorded now.

## Gates, re-run by MAIN LANE rather than accepted from the units

| Gate | Result | Note |
| --- | --- | --- |
| `bun test` | **10650 pass, 0 fail, 23 skip, 60 todo / 631 files**, exit 0 | matches L0-005 exactly |
| `bunx tsc --noEmit` | exit 0 | |
| Meridian ratchet | **2718 / 212 files** | L0-005 measured 2721 on resume; it has FALLEN by 3 since, which is the only legal direction |

Each gate its own command, nothing piped, because a pipe reports the exit code of
the last stage and this repo has shipped a red `main` that way.

## UNIT 008 (LANE 1) -- ACCEPTED, headline claim independently confirmed

Claim: routes hold ZERO `text-[Npx]` literals and zero double-size arrangements,
the M04 second metric going 49 -> 0 on its half.

Measured on the merged tree:

```
grep -rhoE 'text-\[[0-9.]+px\]' src/routes/                  -> 0
both text-[Npx] and text-mrd-* on one className, src/routes/ -> 0 files
```

**Confirmed.** I also checked the failure this repo has actually had -- a count
going to zero because the shape MOVED rather than died. It did not move:
`src/components/` carries 372 literals and 38 double-size sites, which is
pre-existing debt on LANE 0's paths, and LANE 0 independently reports ~37 of that
shape in its own tree. Two lanes counting the same thing from opposite sides and
landing within one is the corroboration that matters.

Unit 008 also closed unit 006's honestly-deferred authenticated check with live
computed values on `/approvals` (h1 at 25px / 1.150). That deferral was declared
rather than hidden, and closing it in the next unit is the behaviour to keep.

## UNIT L0-005 (LANE 0) -- ACCEPTED, and its riskiest claim checked hardest

The claim worth verifying was the videos, because it is the one where being wrong
destroys something that is not recoverable from a rebuild:

> "They were restored during rebase recovery; the ~2GB sits back on disk."

```
lane-0 videos/supaprod-film/renders/  -> 29 files, videos/ 1.9G
pending deletions vs HEAD             -> 0
```

**True.** The 25 deletions are gone from the index and the renders are back. The
call not to commit them was right and the reasoning was right: those are shared
marketing assets and removing them from git is a founder ruling, not a lane call.

**One operational fact the unit does not state.** Restoring them spent the disk
that the crash was caused by: free space went 20GB -> **18GB (92% full)**. The
session died on storage once already. Flagging it as a fact, not a criticism --
the restore was correct.

The stash-recovery notes (duplicate identical stashes, a transient `index.lock`
under the shared `.git/worktrees/`, a killed rebase restoring stashed files via
checkout) are the most useful paragraph either lane has written today. Worktrees
sharing one `.git` means another session's operation can hold your lock, and that
will happen again.

## UNIT L0-003 (LANE 0) -- ACCEPTED

MissionDiff off the retired palette and the plan that failed to load no longer
reporting success. Both claims read correct against their own commits
(`6393d1db8`, `c86af6904`) and the suite is green on the merged tree above. This
was checked when it landed and never recorded; recorded now.

## ONE CLAIM IN L0-005 IS WRONG, and it is the one that matters

> "confirmed zero retired references remain in the file"

False in substance, for `BriefFormationFlow.tsx`. It is true only as a textual
grep of that one file. `MonoLabel` was moved to `@/components/supaprod/Primitives`,
which is itself `import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs"`
and carries 17 `--ds-` and a `--text-` of its own; and `MonoLabel` still renders
`.mono-label`, painted at `styles.css:814` with a hard-coded `font-size: 10px` and
`color: var(--text-subtle, #7d786f)` -- a retired token with a raw hex fallback.

`BriefFormationFlow.tsx` has **no ratchet baseline entry at all**, so no gate could
have caught this. That is the same barrel blindness the file's own header was
written to confess, reproduced one level down.

**Verifying that an import exists is not verifying that it is correct.** The unit
says it "verified both new imports exist". They do exist. One of them points at
the retired system.

Full finding and the fix, including the two things not to preserve while porting:
[`UL0-004`](./UL0-004-the-buttons-ported-and-monolabel-only-moved.md).

## Routed back to LANE 0 (see UL0-004)

1. `Skip` carries `busy={save.isPending}` while its handler is a synchronous
   `setPhase`, so `aria-busy` announces work that does not exist. Was `disabled`
   pre-port and should be again.
2. `MonoLabel` onto `--mrd-t-nano` + `--mrd-mute` at weight 650.
3. `Back` stays live during an in-flight write while `Skip` is blocked. Pre-existing,
   flagged as a product decision to make rather than an omission to keep.

## My own failure, recorded because it caused defect 2

I measured `--mrd-mute` at 5.36:1 for the `.mono-label` question earlier today and
never wrote the ruling, so LANE 0 ported without it. The lane did not act out of
turn; it acted into a silence I left.
