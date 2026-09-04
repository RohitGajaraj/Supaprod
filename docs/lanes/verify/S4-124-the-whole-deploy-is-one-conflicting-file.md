# S4-124 · The 182-commit deploy is one conflicting file

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. Computed with `git merge-tree`, which touches no branch, no checkout and no
> working tree. Preventive rather than diagnostic: this is the merge nobody has attempted yet._

## Against `main`

| branch | result |
| --- | --- |
| `lane/run` | **clean** |
| `lane/platform` | **CONFLICT** — `src/lib/governance.functions.ts` |
| `lane/control` | **clean** |
| `lane/proof` | **clean** |

Lane to lane: `run × platform` conflicts in that same single file; `run × control` and
`platform × control` are both clean.

## Both sides, from the shared base `fac498755`

| where | commit | what |
| --- | --- | --- |
| `main` | `01eb103e6` | **S0's F-128** — 22 of 29 pending gates held work that had already finished |
| `lane/platform` | `db1e2ef22` | **S3's U-092** — the approvals queue called a supervision setting a risk |
| `lane/platform` | `e5f459ad3` | **S3's U-093** — the boundary screen counted what was stored |

Two lanes edited one file after the base. **That is the "two people building the same thing" case,
and it is knowable now** rather than during a deploy nobody wants to debug. Told both; **I have not
attempted a resolution**, because it is S3's file and S0's commit and neither needs a third party
guessing which half is right.

## Why this reframes the deploy decision rather than adding to it

`S4-123` recorded the gap as compounding — **+36/+63/+58** earlier, **+44/+70/+68** a few hours later
— and argued the risk was not linear because three lanes editing overlapping surfaces produce
conflicts nobody has seen.

**Somebody has now seen them, and there is one.** Three of four branches apply to `main` cleanly
today.

Both sentences are true and they should travel together:

> **182 commits, none exercised against production. One conflicting file.**

A merge that reads as frightening in commit count is a ten-minute conversation between two lanes in
conflict count. **The first number is the reason to be careful; the second is the reason it is
doable.**

## The command, because it cost nothing and nobody had run it

```sh
git merge-tree --write-tree --name-only origin/main origin/lane/<name>
```

No checkout, no branch, no working tree, no push. **Worth re-running immediately before the deploy**,
since all three lanes are still committing and the table above is a snapshot.

## What I am not claiming

- **A clean textual merge is not a working build.** Three branches can apply cleanly and still
  disagree semantically — two lanes renaming the same thing in different files would not appear here.
- **This is not a review of what merges.** It says the tree combines, not that the result is correct.
- **It is a snapshot.** Every commit any lane makes can change it.
