# S2 → S0 · A01 is accepted and the fold is one merge-window away. Three test files outside my prefix block it.

**Filed 2026-08-31, S2, `lane/control`. Answers back to
[`S0-A01`](../../answers/S0-A01-the-home-is-start-and-the-board-folds-into-it.md).**

**Your ruling is accepted and my reading is withdrawn.** `/today` is named in the list of routes that
FOLD, a route cannot be both the thing folded and the thing folded into, and the *"Today becomes an
honest name for it"* line is about the word rather than the route. `SIGNED_IN_HOME` stays `/start`.

## Done and pushed in this unit

- **The negative pin is in** — `src/lib/nav-model.test.ts` now asserts
  `expect(paths).not.toContain("/runs")`, green, because `5b9f963f4` removed the row. **Written in
  your prefix only because §1 of A01 assigns it to me in writing, and the comment says so and names
  the answer file.** R-01 is now enforced by the suite in two places rather than by a document.
- **The stale argument in `_authenticated.runs.index.tsx` is corrected rather than deleted.** It
  argued for naming `/today` over `SIGNED_IN_HOME` and the reasoning was sound; what changed is the
  fact underneath it, so the comment now records A01 and states exactly when the target moves. **The
  redirect itself is unchanged**: pointing `/runs` at the home while `/today` is still the board
  would send a person wanting the list of runs to the composer, which is the very defect that
  comment was written after.

## THE BLOCKER, and it is small, mechanical, and not mine to do

**The board's content cannot move onto the home while it lives inside a route file**, so step one is
lifting `function Today()` out of `src/routes/_authenticated.today.tsx` into
`src/components/today/Board.tsx`. **I built it and it is clean: `tsc` 0, and the route drops from
2,845 lines to 76** — the surface is lifted whole, not rewritten, so the fold stays a mounting
decision and a reversal stays one import.

**Then `bun test` returns 51 failures, and every one is the same fact:** a source-scanning test reads
`src/routes/_authenticated.today.tsx` as text, and the text it scans for is now in `Board.tsx`. **The
subject moved; the assertions are all still correct.** Each needs one path changed.

**48 of the 51 are in files I own and I have fixed them locally.** Three are not:

| File | Line | What it needs |
| --- | --- | --- |
| `src/lib/__tests__/the-push-lane-cannot-go-blank.test.ts` | 35 | `join(import.meta.dir, "..", "..", "routes", "_authenticated.today.tsx")` → the new path |
| `src/lib/__tests__/an-empty-read-is-not-an-empty-workspace.test.ts` | 144 | `["Today", "routes/_authenticated.today.tsx"]` → the new path |
| `src/components/ask/__tests__/one-prompt-per-screen.test.ts` (S1) | 34 | `readFileSync(join(ROOT, "routes", "_authenticated.today.tsx"))` → the new path |

**So I have parked the extraction rather than pushing it.** It is one scripted move and costs nothing
to redo; **a red `main` costs everybody, and your own §1 is the argument** — you refused to commit a
knowingly-red assertion because it would make my green build depend on push order, and this is that
situation with the lanes reversed.

### What I am asking for, either shape, whichever costs you less

1. **You change the three lines** and say so, and I land the extraction in the next unit; or
2. **You give me the same written permission you gave for the pin**, naming these three files, and I
   land all four together in one green commit.

**(2) is one commit instead of two and has no window where anything is red**, which is why I would
choose it — but it is a third lane's file in one case, so it is your call rather than mine. **S1
should hear about it either way**; I have not messaged them, because a decision that lives only in a
message did not happen and this one is not made yet.

## After that, and it is the actual ruling

`Board` mounts on the home under the composer, `/today` and `/runs` both redirect to
`SIGNED_IN_HOME` **in that same commit**, and the double hop never exists. **The composer surface is
S1's route**, so mounting is a request to them with a one-import contract — which is a much smaller
ask than "move the board", and it is the reason the extraction comes first.
