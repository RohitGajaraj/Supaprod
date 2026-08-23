# Verification sweep 2: units 011, 012, 014 and L0-006, L0-009..L0-012 accepted, duplicates dismissed

**Audited:** 2026-08-23 20:0x, MAIN LANE, on the merged tree at `7935cb8ce`.
**Verdict: all eight accepted.** No corrections. Two open questions closed.

## The one check that covers all eight

A ratchet unit's headline total is the claim least worth checking, because a total can
fall while one file gains debt and the re-freeze then locks the gain in. So rather than
verify eight numbers, every marker's DIRECTION was compared against the last baseline
MAIN LANE had verified independently (`23b0fb2b9`, 2695):

```
verified-good 23b0fb2b9: 2695  ->  now: 2537    delta -158
ROSE:                    []        (must be empty)
NEW files admitted:      []        (must be empty)
files fully cleared:     11
```

**Nothing rose across eight units, nothing was admitted, and 11 files left the ledger
entirely.** Gates on the same tree, each its own command: `bunx tsc --noEmit` exit 0,
`bun test` **10650 pass / 0 fail / 631 files**.

That is a stronger statement than accepting eight separate totals would have been, and it
is one command.

## The duplicate commit pairs: dismissed, and here is the proof

Flagged earlier as possible double-applied work, which would have been serious:

```
c66c644f5 / 142da86f1     c10a41fbc / 0a7622fb7     ee01c0c30 / 7bd165b8b
```

Compared tree to tree. **Every pair differs only in the lane's own unit markdown** --
`L0-005-recovery-push-and-found-state.md`, `L0-006-shape-sweep-and-control-tiers.md`,
`L0-009-receipt-migration.md`. Not one line of product code is duplicated. The lane
rewrote its unit record after a rebase, which is exactly what it should do.

**My flag was wrong and cost nothing to check.** Recording the dismissal so the pairs are
not re-opened by the next reader who notices two commits with near-identical subjects.

## What the eight actually did

Receipts off the retired layer (23 files), seven gate surfaces off the borrowed one, ten
prose surfaces onto Meridian's `Prose` directly, the last twenty-two retired `Button`s
through the tier test, public hexes onto the ink theme's names, dead colour fallbacks off
two public routes, and the consent gate, admin holdout and gallery off hand-painted faces.

`L0-011` is worth singling out: it migrated the prose surfaces **and routed the `Block`
and `Pre` gaps rather than guessing at them**. That request is answered in
[`RL0-005`](./RL0-005-both-already-exist-in-meridian.md) -- both components already
existed -- but routing beat inventing, and it would have been the right call even if the
answer had gone the other way.

## Nothing is owed back to either lane

No corrections from this sweep. `STATUS.md` -> PENDING CORRECTIONS stays empty.
