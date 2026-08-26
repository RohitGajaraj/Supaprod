# REQUEST · S3 → S0 (cc S1) · the dash sweep: what I fixed, what is left, and three lines nobody may "fix"

_Filed 2026-08-26 by S3 on Claude Code. Founder instruction, given live: em and en dashes are visible
in the running app and are not to be left anywhere user-facing._

## The measurement, using your checker rather than a new one

`scripts/check-humanized.sh` already encodes the 2026-08-03 ruling correctly, so I ran it instead of
writing a regex. **Run across all of `src`, it reports 115 lines.**

**Why the tree drifted while the gate stayed green:** the script scans `git diff --cached`. It is a
ratchet on new additions and has never swept what was already there. It is doing its job; its job is
just narrower than "the app is clean".

**And the runtime sanitizer was never the leak.** `humanizeText` covers model PROSE at the AI
chokepoint. Every remaining hit is a **hand-written string**, which nothing sanitizes.

## What I fixed (pushed, all four gates green)

| Where | What |
| --- | --- |
| `lib/presence/character.ts` | **six live lines on the run surface** — *"I'm on it … you can leave this page"*, *"I've stopped … the reason is on the hold line"*, *"I'm ready … press run"*, plus three more. **This is the most likely thing the founder was actually looking at.** |
| `routes/_authenticated.start.tsx` · `track/SteerComposer.tsx` · `track/TrackRun.tsx` · `meridian/InsightCards.tsx` · `routes/_authenticated.meridian.tsx` | the five UI strings a user reads directly |
| `deployments.functions.ts` (4) · `changelog.functions.ts` · `outcome.functions.ts` · `health.functions.ts` | seven user-visible strings that never reach the sanitizer |

`src/components/**`, `src/routes/**` and `presence/character.ts` now scan **clean**.

**I crossed into your prefixes to do it**, on the founder's direct instruction. Every edit is
copy-only and single-line, so a conflict resolves trivially. If you would rather own any of them,
revert mine and redo it, and I will not re-apply.

## ⚠ THREE LINES THAT MUST NOT BE CHANGED

A blanket find-and-replace over the remaining 104 **will break the product**. These are not dashes in
prose:

1. **`design-interchange.functions.ts:148` parses with the dash.**
   `line.match(/^-\s+\`(.+?)\`:\s+(.+?)(?:\s*—\s*(.+))?$/)` reads `- \`name\`: value — description`,
   and **:225 writes that same format**. They are a matched pair. Changing either alone breaks the
   round-trip on every token file already written. If this format should change, both move in one
   commit and something has to migrate the existing files.
2. **`design-scaffold.functions.ts:1481`** and **`run-stages.functions.ts:280`** are `"&nbsp;": " "`
   **decoder** entries. They REMOVE the character. The checker flags them `html-entity-dash`, which
   is a false positive: those lines are the fix, not the defect. Same shape at
   `intercom-ingest.server.ts:29` and `productboard-ingest.server.ts:35`.

## What is left, and who I think should take it

- **~59 in `src/lib/ai/**`** — prompt text. In scope per the ruling, and worth doing for a reason
  beyond tidiness: **a prompt full of em dashes teaches the model to answer in them.** The sanitizer
  catches the output, so this is upstream hygiene rather than a live leak. `registry.server.ts` alone
  is 29.
- **11 in `src/lib/spine/**`** — `driver.ts` station instructions, `metric-probe.server.ts:200`
  (*"there is no number … not a zero"*), `correction.ts:696`. **I did not touch these because your
  NOW line says you are working in `spine/**` right now.** `metric-probe` and `correction` do reach a
  person.
- **The rest** are logs (`[connectors] KI-34:`, `[health] backend drift`), which the ruling
  explicitly exempts. Leave them.

## One suggestion, your call

The checker takes explicit paths, which is how I swept. **A `--all` flag would make the full sweep a
one-liner** instead of a `find | xargs` somebody has to reconstruct. Small, and it turns a ratchet
into something that can also answer *"is the app clean right now?"* — which is the question the
founder actually asked and which nothing could answer this morning.

---

## POSTSCRIPT: I tried the bulk sweep on the 59 and reverted it. Do not repeat it.

Added after the fact, because a failed attempt is worth more here than the advice was.

I wrote a context-aware rule (ALL-CAPS label before the dash takes a colon, otherwise a comma), ran
it over all 59, and **read the diff before trusting it**. It was wrong in at least four places, and
one of them was a real bug rather than clumsy prose:

- **`critic.server.ts:194-195`** — `${row.target_user ?? "—"}` became `${row.target_user ?? ", "}`.
  That dash is a **no-value placeholder**, not punctuation. The rule turned "unknown" into a literal
  comma-space in a prompt the Critic reads. It should be `"-"`.
- **`reflection.server.ts:273`** — *"Skip vague platitudes, if there is nothing specific, set
  importance=1"* is a comma splice that reads worse than what it replaced. It wants a full stop.
- **`cluster.server.ts:155`** — *"and sentiment:, use them to group"* — the rule appended a comma to
  a string that already ended in a colon.
- **`loop.server.ts:1816`** — *"Paused, waiting on operator"* is acceptable but weaker than
  *"Paused. Waiting on operator"*, and several like it want the stronger break.

**The lesson is the same one this repo keeps writing down: the dash is doing different jobs in
different lines, and only a reader can tell which.** A label separator wants a colon, two clauses
want a full stop, a parenthetical wants commas or brackets, and a placeholder wants a hyphen and
must not be touched as punctuation at all.

So the remaining 59 need **eyes on each line**, not a rule. I reverted rather than ship a
half-verified sweep into `registry.server.ts`, which is the most central AI file in the repo and one
a bad diff there is expensive to unpick.

**None of this is a live user-visible leak.** `humanizeText` sanitizes the model's prose on the way
out. The value in fixing these is upstream: a prompt written in em dashes teaches the model to answer
in them, which is why the ruling puts prompt text in scope at all. It is worth doing carefully and it
is not worth doing fast.
