# S4 handoff, 2026-08-27 ~04:00 UTC

**FIRST DECISION OF THE MORNING: nothing fixed last night is live.** Production deploys from `main`
and all four lanes sit 9 to 16 commits ahead. Every fix is inert until a merge, and that merge is the
founder's call. S0 declined to take it unilaterally.

## Measured 2026-08-27 08:37 UTC, both forms

| | |
| --- | --- |
| plain form (`CLAUDE.md`) | **1** |
| honest form **plus presses** (`S4-071`) | **0** |
| `a30238f5` | station `ship`, hold `given-up` |

**Nothing has changed since the fixes landed on lane branches, because none of them is deployed.**

**AND THE GAP IS COMPOUNDING.** Commits ahead of `main`, measured twice a few hours apart:

| lane | earlier | later |
| --- | --- | --- |
| `lane/run` | +36 | **+44** |
| `lane/platform` | +63 | **+70** |
| `lane/control` | +58 | **+68** |

**182 commits across three lanes, none of them exercised against production.**

**AND THE MERGE ITSELF IS ONE CONFLICTING FILE**, computed with `git merge-tree`, which touches
nothing:

| branch | against `main` |
| --- | --- |
| `lane/run` | **clean** |
| `lane/platform` | **CONFLICT** — `src/lib/governance.functions.ts` |
| `lane/control` | **clean** |
| `lane/proof` | **clean** |

Both sides are known: S0's `F-128` on `main` and S3's `U-092`/`U-093` on `lane/platform`. Both lanes
have been told. **Three of four branches apply to `main` cleanly today.**

**Read the two numbers together:** 182 unexercised commits is the reason to be careful; one
conflicting file is the reason it is doable. Re-run
`git merge-tree --write-tree --name-only origin/main origin/lane/<name>` immediately before the
deploy, because every lane is still committing.
 Every hour of lane
work makes the eventual merge larger and less testable, and the risk is not linear: three lanes
editing overlapping surfaces for a day produces conflicts nobody has seen yet. **The cost of waiting
is not zero and it is not flat.**

## The acceptance, and why it is 0

The loop worked. `a30238f5` walked `sense` to `ship` agent-driven after S0's Discover fix: 13
members, a real pull request, five stations in under three hours, on a track that filed nothing
across twelve drives that morning. **Do not press it** — it is S0's proving ground.

It is parked at `ship` on `given-up`, a terminal hold, and both of Ship's refusals are correct.

**Three things stand between here and R-18, all definitional rather than broken:**

1. **The published query will report a FALSE PASS.** It excludes decided approvals and cannot see a
   press. `a30238f5` has 0 decided approvals and **7 presses**. One extra `NOT IN` against
   `track_drives.driven_via='press'` fixes it (`S4-071`). 19 of 106 tracks carry a press.
2. **No agent can clear a design gate and there is no `prd.approve`** (`S4-076`, corroborated by S0).
   The acceptance also forbids `waived`, so three things must hold that cannot. S0 built `spec-gate.ts`
   for this (F-116).
3. **117 of 119 specs carried no success metric**, so Learn had nothing to grade (S0, F-117).

## The structural findings, which describe the product rather than a screen

Each has a one-command check in `e2e/helpers/`, no server, no credentials.

| | |
| --- | --- |
| Server functions nothing imports | **141 of 656** |
| Components nothing imports | **80 of 492** (noisier: a helper used only in its own file counts) |
| **The Meridian ratchet is bypassed by an alias** | **46 files**, and a NEW file can be written entirely in the retired system today and pass green. **S0's call** |
| Tables with a live writer and a dead one | **19** |
| The Linear push was moved off a route and never arrived | capability lost in a fold, and `SURFACE-MAP` had said by name not to drop it |
| A person cannot rename a run | confirmed; **S2 ruled: delete, do not wire** |
| Spend accrues against no ceiling | **10 of 14** budget rows |
| `/proof` prints a raw config error naming an env var to the public | one line |

**An orphan is not waste.** Three rows were resolved three different ways within an hour by three
people: one was a real gap (S3 shipped the banner), one was documented as a gap before either of us
looked, and one was superseded and should be deleted. **The list is where to look, not a delete
order.**

## The safety model is proof, not permission, and the public copy says permission

**One tool of seventy-four always requires a person** (`delegate.openhands`). 52 tools are seeded
`auto`, 21 `confirm`, and a `trusted` arc turns every `confirm` into `auto` — all 93 agent rows are
trusted. Of the four high-risk tools floored to `review`, **two are released back out
unconditionally**: `studio.revert` and `release.publish`.

**This is deliberate and it is defensible.** Every release carries a written argument about
reversibility: a branch and draft PR are reversible, a rollback to a known-good commit is reversible
by definition, and a publish is gated not on a click but on **merged + CI green at that sha + a live
preview + a recorded forecast**. *"A change nobody can grade cannot ship itself."* That is a stronger
guarantee than a click.

**The problem is that the public copy describes permission.** Three surfaces said an absolute the
wiring does not keep — the landing trust badge twice, and `llms.txt`, which is what every crawler and
agent reads. S3 fixed all three. **The honest sentence already existed on `index.tsx`** and is
stronger than the false one.

**This is the one I would look at first outward**, because it is the last thing a visitor reads
before deciding whether an agent touching their repository is safe.

## The meta-finding, which outranks all of it

**Four guards reported success while the thing they guarded was happening.** My `curl` warming that
warmed nothing. S1's `Gate` printing "Waiting on you" for a status nobody had set. S0's `FILE_IT`
rewrite that reached no seat. The ratchet matching literals past an alias.

**A guard that passes while the defect exists is worse than no guard, because it gets quoted as
evidence.** Four lanes hit that shape independently, in four different layers, in one night.

## What I built, all in `e2e/`

`bash e2e/check-motion.sh [--signed-in] [--phone] [--expired-session] [paths…]`, also
`bun run check:motion`. Boots against a dead database, fabricates the session the guard reads (no
credentials), warms routes **in a browser** and reports: motion that survives a dead backend,
counted progress that ADVANCES (this one fails the build), failure sentences per surface, clipped
unreachable content, controls a screen reader cannot name, prose past Meridian's 68ch measure.

`e2e/helpers/surface-census.mjs` answers what all 95 URLs do: **51 render, 43 redirect, 0 dead.**
14 of those redirects land on `/engine-room`.

## Open, by owner

- **S2** · the lit rail row on `/today` needs a three-way call with S1 and S0 (they fixed the label).
- **S3** · prose at **122ch on `/`** and **165ch on `/pricing`** against a 68ch token (`S4-085`).
- **S1/S3** · `/brain` and `/learn` each announce one dead read **7 times**; both have fixes unmerged.
- **Founder** · outward copy on the hero was checked against canon §5N and is CLEAN, not a defect.

## What I got wrong, so it is not inherited

`/runs` is a dead end (my curl warming), four surfaces show cache keys (my 401 shim), the settings
control is ungated (diagnosis inverted, gating would be the danger), the em dash leak is closed (a
column total proves nothing), `/meridian` is the worst surface (it is the component gallery), 15
forecasts are overdue (13 are demo fixtures). **Five of six were my instrument or my population.**
