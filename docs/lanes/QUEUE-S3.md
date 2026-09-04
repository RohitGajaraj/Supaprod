# QUEUE — S3 · THE PLATFORM (`lane/platform`)

> _Created: 2026-08-26 · Last updated: 2026-09-01_

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-3-THE-PLATFORM.md`](../../the-first-run/SESSION-3-THE-PLATFORM.md)._
>
> **The public surface is FROZEN and you own it so nobody touches it, not so you improve it**
> (§0.7). **Grep before you build** (F-162).

---

## S3-Q1 · The connect control, asked in place — gap #13

> **S3-Q1 WAS gap #18, "what counts as DONE", AND YOU SHIPPED IT** — `BoundaryControls.tsx` carries
> it, and you reported gaps 18 and 19 both done. Replaced. **A stale queue item is an instruction to
> redo work**, addressed to whoever reads it next.

**Goal.** A connector permission is requested **at the moment it is needed, inside the run**, with
the connect control right there. `SPEC-CONNECTORS.md` §5 rule 4.

**What problem of mine does this kill?** The work stops and I have to go and find a settings page to
restart it.
**What do I stop doing?** Browsing a shelf of integrations before anything has happened.

**Why now.** **90 queued approvals since July, zero ever answered** — because they were detached
from the work. R-04 and §1's second agentic property both say the ask happens in place and the
answer **widens the authority for the whole class, never the single instance.**

**Files.** `src/components/connections/**`, `src/components/settings/**` (yours), and the ask lands
in S1's run surface — **coordinate, do not reach in.**

**GREP BEFORE YOU BUILD, and this one is measured: 17 of 20 providers are already wired** and four
hold a live connection (github 2, salesforce 1, linear 1, slack 1). `SPEC-CONNECTORS.md` §1. A unit
that adds a provider must name which of the twenty it checked first.

**Acceptance.** Never a shelf you browse first · the control appears where the work stopped · one
answer covers the class · a refused connection **names which door is locked and the next action**
(R-26) · no word on it a person would not say out loud.

**Checked first.** The existing Connections section, and why it did not serve in place.

## S3-Q2 · The layer-02 vocabulary sweep — 10 named locations, NEVER a find-and-replace

> **RANKING CORRECTED 2026-08-31, AND THE CORRECTION IS MINE.** I told S3 in a message that the
> freeze puts this out of bounds. **That is wrong and I checked it after saying it: §0.7 freezes
> TWENTY NAMED ROUTES and SIX COMPONENT DIRECTORIES. `docs/pitch/**` and `docs/growth/**` are in
> neither**, and `RANKED-BACKLOG.md` ranks this sweep as S3 work in terms.
>
> **S3's decision not to do it was still right, for the other reason they gave: it is ranked BELOW
> #2, and #2 is their job 1 and unfinished.** RANKED-BACKLOG's own per-lane line reads *"#2 now, and
> it is job 1 because S1's promise depends on it. Then the layer-02 vocabulary sweep."* **Right call,
> wrong rule** — which is the thing this fleet has corrected in itself five times today, so it is
> recorded rather than quietly fixed.
>
> **And S3's measurement stands and matters:** `public/brief.html`, the live asset, is CLEAN, so no
> live surface states the false claim. **What is stale is the deck, which its own README requires to
> stay byte-identical to that asset and which has drifted 77 lines** (md5 `881cefe…` vs `c54c225…`).
> That drift is worth naming in the unit: the guard was a byte-identity rule and nothing enforced it.

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
