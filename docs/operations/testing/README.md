# Testing

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**One live document.** [`test-patterns-and-conventions.md`](./test-patterns-and-conventions.md) is how tests are written here, and it is the only file in this folder that describes how things should be.

Everything else that was here was a dated coverage snapshot, and a coverage number goes stale the moment the next test lands. Those are in [`archive/`](./archive/).

---

## The gates, which live in AGENTS.md and not here

Every cycle, no exceptions:

```bash
bunx tsc --noEmit     # 0 errors
bun test              # 0 failures
bun run build         # succeeds
```

Current scale: **402 test files**, and the suite runs clean. Canonical rule: [`../../AGENTS.md`](../../archive/agent-operating-manual.md) §4.

## Three things this repo learned the hard way

**A test can encode the bug as the contract.** On 2026-08-02, nine shipped features were found doing nothing in production. All nine passed the suite, and **two had unit tests asserting the defect was correct behaviour**. A passing suite is evidence that the code does what the test says, and nothing more. When a test and production disagree, check production first.

**`tsc` does not typecheck a Supabase column name.** A wrong column inside a `.select()` string passes typecheck and fails at runtime. Tests that mock the client will not catch it either. Verify against `types.ts`.

**A fixed timeout is an assertion about the machine the test runs on.** On 2026-08-10 three `AskPane` switcher tests went from an intermittent 1-in-3 flake to failing every run, and the first reading — reported before it was checked — blamed the commit that had just merged. `git diff` across that merge showed the component files were **byte-identical**. The tests did `click()` then `await setTimeout(…, 10)`, which is not a wait but a **bet** that an async read resolves and React commits inside ten milliseconds. Real settle time was 13 to 26ms.

The proof that it was a deadline and not a break is a graded sweep: `15ms → 3 fail · 30ms → 2 · 60ms → 1 · 120ms → 0`. **A broken component does not care how long you wait.**

Three properties make this uniquely expensive, and they are why it earned a guard rather than a note:

- It is **invisible until the tree gains weight**, so it ships green.
- It then fails **proportionally to load**, which reads as flakiness — and "known flaky" is where investigations go to die. **Two separate lanes filed these same three tests that way on the same day.**
- When it tips, it points at **whoever landed last** rather than at the bet. It cost one lane an accusation it did not deserve.

**Wait on a condition, never on a clock.** `waitFor` and `findBy*` retry until the thing you actually care about is true.

All three are why the correctness gates are necessary but not sufficient, and why the adversarial runtime-fatal read in `AGENTS.md` §4 sits alongside them.

### A fourth, which no test can catch

**A comment that explains WHY something is safe is load-bearing, and nothing typechecks it.** Four instances surfaced in one day: a comment claiming fan-out children inherit the workspace spend ceiling while the code passed an explicit `null`; a comment justifying the **absence** of a confirmation dialog on the premise that the action "spends nothing", after that action had begun filing an append-only correction; dead config nothing read; and a caption asserting a claim retired hours earlier.

The dangerous shape is not a stale fact. It is **a comment whose argument justifies the absence of a safety rail, resting on a premise that has since become false.** Prose is the only part of the codebase with no compiler, and it is where the reasoning lives. When a comment and the code disagree, the comment is the thing people believe.

## Enforcement tests worth knowing about

Some tests in this repo exist to bind a convention rather than to check a feature. They were each **proven to fail by planting the defect**, not merely proven to pass.

| Test | Binds |
| --- | --- |
| `src/__tests__/surface-discipline.test.ts` | The layout and scroll mechanics in [`../conventions/surface-discipline.md`](../../conventions/surface-discipline.md) |
| `src/components/knowledge/graph-universe-buffers.test.ts` | That the 3D graph binds its per-frame buffers by reference, after a one-word constructor difference made every edge invisible |
| `src/lib/query-keys.test.ts` | That one read has one cache key, after three key families caused the same query to be fetched three times per page load |
| `src/lib/ai/tools/tenancy-stamp.test.ts` | That every write to a workspace-scoped table stamps `workspace_id` |
| `src/__tests__/a-timeout-is-not-a-wait.test.ts` | That no test sleeps instead of waiting on a condition. It distinguishes a sleep **inside a mocked handler** (a stub of a slow operation, and the thing under test) from a sleep in the test **body** (the bet). The first draft flagged eight legitimate mocks; a guard that cries wolf is deleted by the third person who hits it |
| `src/lib/__tests__/the-ledger-chain-has-a-writer-for-every-hop.test.ts` | That every hop the Trust Ledger walks has code that writes it, after three hops turned out to exist only in demo seed |
| `src/lib/__tests__/a-failed-run-must-say-why.test.ts` | That every write marking a run failed also classifies it |

If you add a convention that code can violate silently, add a test like these. A convention with no test is a suggestion.

## A known open gap

**Nothing tests `discover/ranking` and `discover/format` together.** `ranking.test.ts` has 71 cases and `format.test.ts` has 141, and none of the 212 exercises the pair. Ranking depends on format for verdict scoring, time humanisation and signal-preview extraction, so **a change to a format helper can reorder the Discover queue with both suites still green.**

A draft integration test for exactly this exists at [`archive/discover-ranking-integration.test.ts.reference`](./archive/discover-ranking-integration.test.ts.reference). It was rescued from a lane worktree before that worktree was deleted, and it does not compile: it imports `@/lib/types` and `verdictToScore`, neither of which exists any more. The header explains how to revive it. The idea is sound; the code is stale.

## Archive

[`archive/`](./archive/) holds dated coverage audits and completed consolidations: two late-July coverage audits, an early-July gap analysis, the duplicate-suite consolidation, and the DOM-based component-testing write-up, plus the rescued reference test above. Read them for what was checked and when. Do not read their numbers as current.
