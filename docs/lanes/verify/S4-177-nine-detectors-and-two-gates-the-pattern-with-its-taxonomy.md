# S4-177 — nine detectors, two gates, and a documented enforcement that does not exist

> _Created: 2026-09-01 · Last updated: 2026-09-01_

> _S4 · 2026-09-01 ~00:1x IST · source, hooks and CI read; the orphan-doc test run against the real
> pre-commit hook. No dev server, no row written, nothing pressed._

**S0 asked me to take this pattern and said it is bigger than any single item: four detectors had
reported a real finding into a green build. It is now nine detectors, and the pattern has a taxonomy
with four distinct failure modes whose remedies are different.**

## What actually enforces anything

| runner | what it runs |
| --- | --- |
| **CI** (`.github/workflows/ci.yml`) | `bunx tsc --noEmit`, `bun test`. **That is the entire list.** |
| **pre-commit** | `check-humanized.sh` — and in non-strict mode with `|| true`, so it cannot fail |
| **pre-push** | **nothing** |
| **pre-merge-commit** | **nothing** |
| **post-merge** | `check-migrations.sh` |

## What exists and nothing runs

```
check:tests · typecheck:tests · check:motion · check:unreachable
check:dead-writers · check:retired-aliases · check:golden-set · check:branch-idiom
docs:check
```

**Nine, and not one is reachable from a hook or a CI step.** Two of those nine are mine, shipped
today, and they are in exactly the same position as the seven that came before — which is the point
rather than a defence.

Between them they currently hold: **140 server functions and 44 components with no importer**, **19
tables with a live writer and a dead one**, the design-system alias bypass, the theatre harness, an
empty golden set, and **414 type errors in the test suite**.

## The documented enforcement that does not exist, tested rather than read

**`CLAUDE.md` states, as a reason to trust the process:**

> *"`docs-doctor` runs from the pre-commit hook and fails on a misplaced or unlinked file, **so a
> mistake here is caught rather than shipped**."*

**Measured.** A file linked from nowhere, staged, and the real hook run against it:

```
$ bash .git/hooks/pre-commit
check-humanized: clean. No banned dashes or invisible characters in scanned additions.
PRE-COMMIT EXIT: 0          <- the commit proceeds

$ bun run docs:check
  WARN no date header: docs/planning/__s4-orphan-probe.md
docs:check exit: 1          <- the check that was supposed to run says no
```

**The hook passes. The check that CLAUDE.md says the hook runs fails.** Anyone relying on the
documented behaviour ships the orphan. **My own verdict files were caught four times today only
because I ran `docs:check` by hand** — had I trusted the sentence, four orphaned files would be on the
branch.

## The taxonomy, because the remedies are different

**S4-162 named two kinds of green board and said the remedies are opposite. With today's evidence
there are four.**

**1 · Nothing runs it.** The nine above. **Remedy: wire it.** Cheap, and the only reason not to is
that a check failing everywhere on day one gets reverted — which is what the ratchets already solve.

**2 · It runs, prints the finding, and exits 0.** `check:unreachable` named `getDelegateDesk` — one
of only three functions in the codebase that name their own consumer and have none — and exited 0.
**This one is defensible and should not be "fixed" carelessly**: it is a ratchet, and failing on
today's debt is how a check gets reverted. **Remedy: not a louder exit code, but a place the printed
finding lands** — the ratchet is right and the report has no reader.

**3 · It runs, is green, and cannot see its own defect.** F-149's guard passed with the escape
re-introduced (**12,984 tests, 0 fail**). F-151's guard passed with the inline literal restored
(**143 of 143**). **Remedy: assert on the caller, not the helper** — both were fixed this way in
A1/A2, and both had to be mutation-tested to prove it.

**4 · It runs and fires on the wrong thing.** **Mine.** `check:branch-idiom`, shipped this afternoon,
fired on `docs/lanes/log/S2.md` and an S0 answer — **both documenting the very defect it guards**.
**Remedy: narrow the scope and re-prove detection**, which is what makes this different from simply
loosening a check until it goes quiet.

**Modes 3 and 4 are inverses and that is why they need separating: one passes when it should fail, the
other fails when it should pass, and "the check needs work" is the wrong summary of both.**

## What I am not claiming

**Not that CI should run all nine.** `ci.yml`'s own header argues for a narrow gate — *"`tsc --noEmit`
+ `bun test` are the gates"* — because a noisy CI drowns real regressions, and that argument is sound.
**The gap is that nine detectors were built, are correct, and have no runner at all**, which is a
different problem from choosing what CI blocks on.

**And `docs:check` is the one I would wire first**, because it is the only one of the nine that
`CLAUDE.md` already promises is wired. **A documented guarantee that is false is worse than an absent
one**, since it is quoted as a reason not to check by hand.

## Owner

**S0** — `.github/workflows/ci.yml`, `scripts/install-git-hooks.sh`, and the `CLAUDE.md` sentence.
The sentence is the urgent half: it costs nothing to correct and it is currently telling every session
that a check runs which does not.

No product code written. No dev server, no row written, nothing pressed. The orphan probe was staged
against the hook, never committed, and removed.
