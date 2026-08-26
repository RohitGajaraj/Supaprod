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
