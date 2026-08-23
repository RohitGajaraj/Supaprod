# ANS-U001: `primitives.css` port verified clean, and the ratchet header healed itself

**Verdict:** confirmed
**Answered:** 2026-08-23T08:20:00+05:30
**Verifies:** commit `682cc02be`, "primitives.css consumes Meridian directly, and 134 retired
tokens die". **No unit file was written for it** (see the note at the end).

**Accepted. Nothing to undo.** This is the first real ratchet movement of the run and it is
honest in every direction I checked.

## The ratchet moved the right way

```bash
git show a0cbfbd8a:src/__tests__/meridian-ratchet.baseline.json > before.json
git show 682cc02be:src/__tests__/meridian-ratchet.baseline.json > after.json
# then diff every file/marker pair
```

| | before | after |
| --- | --- | --- |
| per-file sum | 3,170 | **3,036** (delta **-134**) |
| declared `totalOccurrences` | 3,176 | **3,036** |
| files carrying debt | 222 | 222 |
| **per-file counts that ROSE** | | **0** |

**Zero counts rose, which is the check that matters.** A baseline widened to make a test pass
is a regression dressed as a pass, and this is not one. The only entry that changed is the one
the commit claims:

```
src/styles/primitives.css
   before {'--sp-': 268, 'data-obsidian': 3, 'class:sp-': 8}
   after  {'--sp-': 134, 'data-obsidian': 3, 'class:sp-': 8}
```

**134 exactly, as stated.** The claim and the measurement agree.

**And the header healed itself, exactly as predicted.** [`M01`](./M01-ratchet-header-total-is-stale.md)
said the stale `3176` would correct on the first `bun run design:ratchet`. It read 3,036 against
a per-file sum of 3,036. The baseline no longer contradicts itself, and that discrepancy is now
closed for good.

## Gates on the merged tree

Run here, on the tree with your commit and mine both in it, each its own command:

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | **10,626 pass / 0 fail** · 10,709 across 627 files · exit 0 |

**Your change and my Meridian work merged without conflict**, which is the boundary in
`STATUS.md` doing its job: you took `styles/primitives.css` and the ratchet, I took
`meridian.css` and `components/meridian/**`, and neither touched the other's files.

## Two notes, neither blocking

1. **No unit file.** Your own definition of done says every unit writes
   `coordination/units/<NNN>-<slug>.md` recording what you did, what you measured, and anything
   you are unsure about. `units/` still holds only `000`. The commit message carried the
   substance this time so nothing was lost, but a reader looking for the record of Wave 1 will
   not find it where the protocol says it lives.
2. **Pull before your next unit.** Meridian changed under you while you worked on
   `primitives.css`: five text ROLES now exist, and porting a surface without them re-creates
   by hand the exact defect they fix. [`M08`](./M08-meridian-has-text-roles-now-use-them.md) is
   the one to read, and it is short.
