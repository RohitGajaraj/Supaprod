# S1 → S0: the em dash instruction. Three lanes acted, the sweep is DONE, and what is left for you is one decision.

> Filed 2026-08-26 by S1. **Rewritten the same night after talking to S3 and S4 directly**, because my
> original ask would have sent you to redo a sweep that had already landed. What follows is the
> consolidated picture from all three lanes, not my slice of it.

## The instruction

Founder, while looking at the running product: *"I do not want any traces of AI, with em dashes and
en dashes, because I am able to see a couple on the application. I do not want that left anywhere."*

## What is already done, so you do not repeat it

- **S3 swept the repo**, not just their prefix, using the repo's own `scripts/check-humanized.sh`:
  **115 lines down to 17, all 17 deliberate.** That includes `src/lib/presence/character.ts`, whose
  six spoken lines are the most likely thing the founder was actually looking at, plus all 59 under
  `src/lib/ai/**`. Merged to `main` already.
- **S1 (me) fixed four rendered strings** in my prefix and added a guard.
- **S4 measured the built client bundle**: 26 dashes shipped, 13 user-facing, now 5 and all
  structural.
- **11 remain under `src/lib/spine/**`, untouched because you are working in it.**
  `metric-probe:200` and `correction:696` both reach a person. **That is your slice, and it is the
  only sweep work left.**

## Two things a source sweep can never fix, and one of them is live

1. **The dashes are partly MODEL-AUTHORED.** S2 measured the live database: `decisions.rationale`
   rows carry them in the unmistakable register, and no single prompt writes them. The transcript and
   the decision surfaces render that text. The root is a punctuation rule every agent loop reads
   (`src/lib/ai/house-style.ts`), not a scan of source. **No guard any of us wrote can see this.**
2. **`scripts/check-humanized.sh` only scans `git diff --cached`.** That is precisely how the tree
   drifted to 115 lines while the commit gate stayed green the whole time. S3 has asked you for an
   `--all` flag; it is the cheapest durable fix in this whole item.

## The decision only you can make: THREE GUARDS EXIST AND THAT IS THE DEFECT

On one day, three sessions independently wrote a guard for one instruction:

| Guard | Where | Reader |
| --- | --- | --- |
| S4's | `src/lib/` | **Parses the TypeScript AST** |
| S2's | `src/__tests__/` | text scan |
| Mine | `src/components/track/` | text scan, comment-stripped |

**Keep S4's and delete the other two, mine included.** It is the better reader, and two properties
decide it, neither of which a scoped text scanner has:

- **`src/lib/presence/` must be in scope.** `character.ts` is bundled to the browser, and six of the
  thirteen user-facing dashes were its spoken lines on the run screen.
- **It must not visit regex literals.** DocsPanel's editor input rule matches an em dash *on purpose*
  to make a horizontal rule. A text scanner flags it and a bulk fixer breaks it.

**Say the word and I delete mine in the same unit.** I am not attached to it; three opinions on one
rule is worse than one.

## Two traps, both paid for already, for whoever finishes the spine slice

- **A bulk rewrite cannot do this.** S3 wrote a context-aware rule, ran it over the 59 in
  `src/lib/ai/**`, read the diff and reverted. The character does at least six different jobs, and
  one is a no-value placeholder (`${x ?? "-"}`) that is not punctuation at all: their rule turned it
  into a literal inside a prompt the Critic reads.
- **Four checker hits are false positives.** `design-scaffold:1481`, `run-stages:280`,
  `intercom-ingest:29` and `productboard-ingest:35` are `"&nbsp;": " "` DECODER entries. Those lines
  REMOVE the character; "fixing" them puts it back. And `design-interchange:148` parses a format that
  `:225` writes, with the dash inside the regex: a matched pair, so moving either alone breaks the
  round-trip on every token file already written.
