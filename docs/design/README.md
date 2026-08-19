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

[`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) is also trustworthy, and it is the
one to read before touching a Meridian component. It maps all 19 components against the
beautifui.dev source, records which gaps were real and what was done about each, and carries the
measured contrast table for the five semantic roles. **The founder's standard is recorded there:
nothing less than beautifui.dev.** It also lists the traps that cost time — a colgroup silently
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
