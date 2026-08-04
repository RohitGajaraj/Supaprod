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

Current scale: **402 test files**, and the suite runs clean. Canonical rule: [`../../AGENTS.md`](../../../AGENTS.md) §4.

## Two things this repo learned the hard way

**A test can encode the bug as the contract.** On 2026-08-02, nine shipped features were found doing nothing in production. All nine passed the suite, and **two had unit tests asserting the defect was correct behaviour**. A passing suite is evidence that the code does what the test says, and nothing more. When a test and production disagree, check production first.

**`tsc` does not typecheck a Supabase column name.** A wrong column inside a `.select()` string passes typecheck and fails at runtime. Tests that mock the client will not catch it either. Verify against `types.ts`.

Both are why the correctness gates are necessary but not sufficient, and why the adversarial runtime-fatal read in `AGENTS.md` §4 sits alongside them.

## Enforcement tests worth knowing about

Some tests in this repo exist to bind a convention rather than to check a feature. They were each **proven to fail by planting the defect**, not merely proven to pass.

| Test | Binds |
| --- | --- |
| `src/__tests__/surface-discipline.test.ts` | The layout and scroll mechanics in [`../conventions/surface-discipline.md`](../../conventions/surface-discipline.md) |
| `src/components/knowledge/graph-universe-buffers.test.ts` | That the 3D graph binds its per-frame buffers by reference, after a one-word constructor difference made every edge invisible |
| `src/lib/query-keys.test.ts` | That one read has one cache key, after three key families caused the same query to be fetched three times per page load |
| `src/lib/ai/tools/tenancy-stamp.test.ts` | That every write to a workspace-scoped table stamps `workspace_id` |

If you add a convention that code can violate silently, add a test like these. A convention with no test is a suggestion.

## A known open gap

**Nothing tests `discover/ranking` and `discover/format` together.** `ranking.test.ts` has 71 cases and `format.test.ts` has 141, and none of the 212 exercises the pair. Ranking depends on format for verdict scoring, time humanisation and signal-preview extraction, so **a change to a format helper can reorder the Discover queue with both suites still green.**

A draft integration test for exactly this exists at [`archive/discover-ranking-integration.test.ts.reference`](./archive/discover-ranking-integration.test.ts.reference). It was rescued from a lane worktree before that worktree was deleted, and it does not compile: it imports `@/lib/types` and `verdictToScore`, neither of which exists any more. The header explains how to revive it. The idea is sound; the code is stale.

## Archive

[`archive/`](./archive/) holds dated coverage audits and completed consolidations: two late-July coverage audits, an early-July gap analysis, the duplicate-suite consolidation, and the DOM-based component-testing write-up, plus the rescued reference test above. Read them for what was checked and when. Do not read their numbers as current.
