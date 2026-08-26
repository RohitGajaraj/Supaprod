# S1 → S0: no em dashes or en dashes on any surface. Mine are gone and guarded; 131 remain outside my prefix.

> Filed 2026-08-26 by S1. **Founder instruction, given while looking at the running product**, so this
> is a live defect and not a style preference.

## The instruction

> *"Whatever work you are doing, make sure you're not leaving any trace of AI ... like m dashes and
> n dashes, into the live application, which is user-facing. I am able to see a couple of em dashes
> and en dashes on the application. I do not want that left anywhere."*

It is cross-surface, which by §12's own rule means a lane that cleans its own prefix and stops has
made the problem worse: the reader sees one product, not five prefixes.

## Done in my prefix, and it cannot come back

Four rendered strings carried an em dash. All four are rewritten so the sentence reads naturally
rather than swapping one mark for another:

| Where | Was | Now |
| --- | --- | --- |
| `SteerComposer.tsx` placeholder | `Say what to change — try @X` | `Say what to change. Try @X` |
| `TrackRun.tsx` drive heading | `Run it — done` | `Run it: done` |
| `TakeOver.tsx` hint | `...Nothing here checks it — you are telling us...` | two sentences (**and a factual fix, below**) |
| `_authenticated.start.tsx` | `Edit it freely — it starts however you leave it.` | `Edit it freely. It starts however you leave it.` |

`src/components/track/what-a-person-reads-has-no-em-dashes.test.ts` now fails the build if either
mark returns to anything S1 renders. It strips comments first, because the house comment style is
thick with em dashes and none of it reaches a person; rewriting that commentary would be a large
diff a customer cannot see.

**Two details worth stealing when you sweep, because both cost me a wrong answer first:**

1. The reader must track string state, or `"https://github.com/owner/repo"` looks like the start of a
   line comment and everything after it on that line goes unchecked.
2. It must NOT treat every apostrophe as an opening quote. This repo ships `You're watching it work`,
   `Don't run it` and `The change's files` as JSX text; a naive reader desyncs on each.

## What is left, and it is not all user-facing

131 lines across 40 files outside my prefix. **Most of `src/lib/ai/**` is prompt text sent to the
model, not copy shown to a person** — `registry.server.ts` (29) and `critic.server.ts` (10) are tool
descriptions and grading instructions, and changing those changes model behaviour, so they should be
judged separately rather than swept.

**These are the ones I am confident a person reads:**

- `src/lib/presence/character.ts:172` — the character's own line:
  *"I've lost sight of the run — the reads are failing."* This is the voice of the product; it is on
  the run screen whenever the feed drops.
- `src/lib/spine/driver.ts` — hold and job sentences that surface on the run screen.
- `src/lib/ai/loop.server.ts:1816` — `Paused — waiting on operator ${mode} for ${call.name}.`
- `src/lib/ai/critic.server.ts:194-196` — an em dash used as the EMPTY VALUE placeholder
  (`Target user: —`). If any of that reaches a surface, it renders a bare dash as a value.

To reproduce the full list, the reader in my test file is the tool: strip comments, then match
`[—–]`. **Widen its `ROOTS` to your prefix once you have swept**, and the rule holds for everyone
without a second implementation.

## One thing only you can answer

Model-authored text can contain em dashes too, and no sweep of ours touches it: the transcript
renders `payload` and hold prose written by the loop. If the founder is seeing dashes inside agent
output rather than in our copy, the fix is in the prompts, not the components. Worth measuring
before we call this done.
