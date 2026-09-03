# Station design audits, 2026-08-01

> ## The contract is [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md), and the system is Meridian.
>
> Read it before building anything. **Every prior design system is retired** — v1 Ember, v3
> Obsidian, v4 Loom, v5 Tempo and Cadence/ink — and since 2026-08-15 that retirement is enforced
> by `src/__tests__/meridian-ratchet.test.ts` rather than by prose: a new file carrying a retired
> token or a raw colour fails `bun test`. Nothing in this folder overrides it, and the files below
> predate it.

> **PROVENANCE WARNING, read before using any file in this folder.**
> These eight documents were written by autonomous audit subagents during the 2026-08-01 spine
> depth session. **They are raw, UNVERIFIED agent output.** They were not reviewed line by line
> before being committed, and they are kept because the raw material is useful, not because it
> is trusted.

## Why the warning is not boilerplate

In the same session, agent-written material landed in the app and contained two defects of
exactly the kind this repo exists to remove:

- a raw cosine similarity rendered to the user as `72% match` (a 0.72 cosine is not 72% of
  anything a reader recognises, and no product in this category ships a similarity score at all);
- workspace-wide source coverage printed under the heading "Backed by 3 sources" on one specific
  bet, which would have read identically on a bet with no evidence whatsoever.

Both were caught and corrected. Assume the same error rate in these documents.

## How to use them

1. **Treat every claim as a lead, not a finding.** Verify against the code before acting.
   Several claims in the first audit round were wrong: Plan was reported as having "zero
   mutations" when `RoadmapColumns` carries five, and Build was reported as having no door when
   its rows are clickable into their run.
2. **File:line citations are the useful part.** They point at real code; the interpretation
   around them may not hold.
3. **Do not cite these as canon** in a commit message, a doc, or an investor surface.

## NOT in the warning: the reference-pattern library

[`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) in this same folder is the OPPOSITE kind of
document. It is verified research against official product documentation with source URLs, it is
trustworthy, and it is where every future research pass gets appended so the same research is
never paid for twice. Read it before researching any surface's reference class.

[`MERIDIAN-INVENTORY.md`](./MERIDIAN-INVENTORY.md) answers the question neither the contract nor the
parity map does: **what is built, and is anything rendering it.** Read it before building a Meridian
component, because one may already exist. Measured 2026-08-22: **47 components and 111 tokens** against
the contract's stale "23 and 88", and **14 components render only in the gallery**. Take the inventory
from the directory and the rules from the contract; the file carries the command to regenerate itself.

[`premium-pass-2026-08.md`](./premium-pass-2026-08.md) is the 2026-08-22 premium pass, run under the
founder's ruling that overrides "design pass is LAST". It answers one question — **when an agent is
working, what does a person see** — and every number in it was taken from `meridian.css` or from a
live browser. It carries the measured reduced-motion defect (the working mark parked at **1.19:1**,
the same number law 5 records as the catastrophe), the motion drift table (nine arrival speeds inside
the design system's own folder), the finding that `/pricing`, `/security` and `/product` render **zero**
Meridian, and the four proposals this pass argued rather than built. Read it before the next design
pass, because its main recommendation is that deep agent visibility is blocked on a transport and not
on a design.

[`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) is also trustworthy, and it is the
one to read before touching a Meridian component. It maps all 19 components against the
beautifului.dev source, records which gaps were real and what was done about each, and carries the
measured contrast table for the five semantic roles. **The founder's standard is recorded there:
nothing less than beautifului.dev.** It also lists the traps that cost time — a colgroup silently
overruled, an instrument aimed at a preview panel, `body { letter-spacing: 0 }` resetting a whole
document tree.

## What is in here

| File | Covers |
| --- | --- |
| [`STEP-0-RESEARCH-BRIEF.md`](./STEP-0-RESEARCH-BRIEF.md) | the premium UI/UX research brief opening the 2026-08-10 design pass (UI/UX lane) |
| [`STEP-1-AUDIT.md`](./STEP-1-AUDIT.md) | the comprehensive UI/UX audit from that pass. **Moved here from the repo root on 2026-08-10** — root holds four files only, and it was failing `docs:check` for everyone. Content untouched. |
| [`STEP-1-AUDIT-FINDINGS.md`](./STEP-1-AUDIT-FINDINGS.md) | the surface audit and findings from that same pass |
| `SEVEN-STATIONS-BLUEPRINT.md` | the end-to-end loop, station by station. Its own header notes only Discover and Decide were complete when it was written. |
| [`agent-first-surface-brief.md`](./agent-first-surface-brief.md) | **The brief and review log for the agent-first surfaces.** Carries the standing ruling that the `supaprod-reimagined` artifact is a vanilla wireframe and not canon, the defect list from the 2026-08-19 review, the five open design questions, and where the work happens. Read before building any new surface. |
| [`non-station-surfaces-2026-08.md`](./non-station-surfaces-2026-08.md) | **The redesign for everything that is not one of the seven stations** — navigation, workspace and products, Brain, Guardrails, Settings, notifications, integrations, and the cross-surface flows. Written 2026-08-22 against the live database and the source, so unlike the eight audits above every claim carries a `file:line` or a query. Says what each surface costs in numbers, what it should become, what must not be lost, and what an agent should be able to read there. Read it with [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md), which covers the seven stations this one deliberately does not. |
| [`reference-2026-08-26/the-board-many-pieces-of-work-at-once.md`](./reference-2026-08-26/the-board-many-pieces-of-work-at-once.md) | **Reference mechanics for the board, pulled from Mobbin by S0 2026-08-31.** Lanes hold no Mobbin credential, so S0 pulls and commits — and **R-20 §7 wants MECHANICS, never screenshots**, so this is the mechanics in words with every source linked. Five to take (status is the only coloured thing in the row · no progress bars, because a bar implies a rate we cannot prove · grouping is a control and never a second surface · **the empty row is an input**, which is the one we do not have · **blocked is a status, not an alarm**) and three to refuse, each with its reason. **It also records what the pull did NOT find:** none of the six sources shows a row being worked by something that is not a person, so the live-agent case is genuinely unreferenced on Mobbin — the closest prior art is `../research/agentic-product-patterns-2026-08.md` §1. **Ask S0 for a surface and it gets pulled.** |
| [`reference-2026-08-26/lovable-settings-2026-09.md`](./reference-2026-08-26/lovable-settings-2026-09.md) | Lovable's settings read signed in on 2026-09-02: the shape (one searchable page, one sentence per row, one control) and the rows we take (live preview, project monitoring, knowledge as the brief, Slack as the verdict channel). Feeds A-QUEUE P-17, P-22, P-23. |
| [`station-strip-before-the-fold.md`](./station-strip-before-the-fold.md) | **The preservation record for the horizontal seven-station strip, written the day it came off the workspace screens (2026-09-02).** Founder asked for a reference point before it went. Carries the measurements that decided it (94.5px, 10.6% of a 900px viewport, 3 of 7 chips carrying a fact on workspace screens and 0 of 7 inside a run), the full markup and CSS including the two founder-reported fixes that are easy to lose on a rebuild (`overflow-x: auto` and `min-width: 108px` are a pair), the four reasons it came off, and the commit-by-commit history. **The screenshots are NOT in git** -- `docs/screenshots/` is gitignored -- so everything needed to reconstruct it is written down instead. Read it before proposing the band come back. |
| [`run-screen-2026-09.md`](./run-screen-2026-09.md) | **The design pass for the run screen (P-37, 2026-09-03), mockups to be walked before code.** The founder's verdict on the tablet track's run was that everything is true and nothing is designed, and the second half is the diagnosis: a surface that reports rather than composes. Carries the three vocabularies (a card, a message, an action), the gate card's slot order and why the risk line is prose rather than a badge, the transcript row folded and open, the disclosure motion against Meridian's own `--mrd-d-move` and `--mrd-ease` with the reason for each value, and the hold card with the person's reason leading and the machinery's sent to the transcript. One rule if all else is cut: a screen in one state asks for one thing. |
| [`arrival-2026-09.md`](./arrival-2026-09.md) | **What an empty workspace says before any run exists (P-33, 2026-09-03).** Walked live on `supaprod.ai` against a workspace made for the walk, and it opens with the reason nobody had walked it before: a second workspace could not be created at all, and never had been. `workspaces` had no INSERT policy, and the fix for that was only half the wall -- a `RETURNING` is a read, and the SELECT policy refused the row the insert had just made. Records what the empty workspace was told about itself and what was fixed (the reproach strip, the invented seed rows, the three cards posing as ranked work, the missing owner membership), the scoping defect the fix immediately exposed (Start showed every workspace's runs and bets under one workspace's name), the four ways the sample-workspace door is not honest, and six findings left standing with `file:line` evidence for the next packet. Unlike the eight audits above, every claim carries a query, a `file:line` or a live walk. |
| [`the-approvals-graveyard-2026-09.md`](./the-approvals-graveyard-2026-09.md) | **A proposal, awaiting the founder (P-55, 2026-09-03): the served workspace greets a visitor with "66 decisions are ready for you" and "65 pieces of work are stopped".** Names all ten gate families with the exact predicate the queue reads each by, summing to 66 so the population is confirmed rather than approximated. Three findings the rule has to survive: the two headlines are ONE population counted twice, 65 being 66 minus the card already open; `design_gate` is 35 of the 66 and only became visible on 2026-08-24, so the "ignored for 49 days" reading is wrong for more than half of it; and only 11 of 66 rows are over 30 days, so an age-based retirement clears 11 and leaves the page saying 55. Carries three options, each one reversible statement, with a recommendation and what the approvals page and Start read after each. No migration and no data write until the founder answers. |
| `discover-station-audit.md` | Discover, the station that then received a full depth pass |
| `discover-prototype-specs.md` | proposed Discover prototypes, largely not built |
| `decide-station-audit.md` | Decide |
| `plan-station-audit.md` | Plan |
| `design-station-audit.md` | Design |
| `build-station-audit.md` | Build |
| `ship-and-learn-stations-audit.md` | Ship and Learn |

## What was actually shipped from this session

The verified, gated work is in the commit history from `771c2606` onward, and the durable
account is [`../operations/session-handoff.md`](../operations/session-handoff.md). Read that
first; read these only for the underlying detail.
