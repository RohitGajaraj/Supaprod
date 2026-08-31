# QUEUE — S3 · THE PLATFORM (`lane/platform`)

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-3-THE-PLATFORM.md`](../../the-first-run/SESSION-3-THE-PLATFORM.md)._
>
> **The public surface is FROZEN and you own it so nobody touches it, not so you improve it**
> (§0.7). **Grep before you build** (F-162).

---

## S3-Q1 · What counts as DONE — `REVIEW.md`, gap #18

**Goal.** The customer declares the review passes, the severity definitions and the exclusions.
Ours are hardcoded by us.

**What problem of mine does this kill?** I cannot tell the machine what "good enough" means here, so
every judgement is someone else's default.
**What do I stop doing?** Re-explaining our standards in every approval.

**Why it is the right half to build now.** *"What it's allowed to do"* answers what agents may
**DO**. **Nothing anywhere answers what counts as DONE**, and that is the question a company
actually argues about. It is **one more section on a page you are already building** — not a
destination (§0.5).

**Files.** `src/components/governance/**`, `src/components/settings/**` (yours).

**Acceptance.** A customer with no repository can write one on the page · a customer WITH a repo has
theirs **read**, never written (§4.2 refusal 2 — writing a team's conventions file silently is the
fastest way to lose the repository connection) · the page states plainly which of the two it is
doing · **no word on it that a person would not say out loud** (§12).

**Checked first, and name it in your unit file.** The boundary page you have already folded four
routes into — this is a section of it.

## S3-Q2 · The layer-02 vocabulary sweep — 10 named locations, NEVER a find-and-replace

**Goal.** Ten outward-facing files stop saying *"it runs the whole lifecycle."*

**Files, and they are named because this must not be a grep-and-replace.**
`docs/pitch/investor-deck/supaprod-pre-seed-investor-deck.html:456-457` ·
`docs/pitch/shareables/Supaprod-Hub71-Deck.src.html:459-460` (**generated** by
`scripts/build-hub71-deck.py:37` — one fix and a re-run, not two edits) ·
`docs/growth/press-kit.md:55,:59,:95,:138` · `docs/pitch/applications/answer-bank.md:291` ·
`positioning-doctrine.md:107` · `docs/pitch/one-pager.md:13,:72` · `founder-story.md:166` ·
`README.md:303-309`.

**THE TRAP, AND IT HAS ALREADY BEEN SPRUNG TWICE HERE.** **34 files carry the phrase family and 8 of
them quote it in order to BAN it** — `CLAUDE.md:13`, `AGENTS.md:52`, `positioning-locked-2026-08.md:320`,
`three-layers-and-why-not-a-builder.md:88`, `ThreeLayers.tsx:100-102`,
`brief-parent-is-readable.test.ts:39/49`, and the rewiring doc. **A corpus-wide replace deletes the
rule along with the violations.** Edit the ten named lines and nothing else.

**Acceptance.** The deck and `public/brief.html` are **byte-identical again** (its own README
requires it; they have drifted 77 lines, md5 `881cefe…` vs `c54c225…`) · the eight banning files are
untouched, verified by diff · the replacement is the customer sentence now in every root file:
*decides what is worth building, builds it, ships it, and checks what actually happened*.

**One collision to know:** §12 bans *AI-native* in product copy, so **"AI-native SDLC" is the
internal framework name and can never be the customer sentence.**

**OUTWARD-FACING: nothing here ships without the founder's approval.** Prepare it, show it, wait.
