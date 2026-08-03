# JNY-02 — The living strategy brief

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) `/today` (StrategicBriefCard), no dedicated route · Owner: Journey (`src/lib/briefs.functions.ts`)

## What it does

The Strategic Brief graduates from free text to a structured, versioned decision cluster: standing
**Vision**, **Target user (ICP)**, and **Positioning** items (one live version each, edits
supersede the prior version) plus a **Top bets** portfolio (several can stand at once). Each item
gets its own AI-extracted watched assumptions (FS-02 reuse), so the workspace's highest-level
calls get the same "standing until challenged" machinery every other decision already has. The
legacy free-text brief (`workspace_briefs`, still editable in Settings) is untouched and keeps
working: this is a dual projection, same pattern CNV-01 used for PRD contracts.

## Why it exists

Per the v12 audit's stage-by-stage journey grade, "Vision and strategy" was the one THIN stage at
the top of the loop: free text, no formation flow, no watched assumptions, no receipts, no
supersession. Every other decision in the product (a PRD, a contract clause, a spec's acceptance
criterion) already gets typed, versioned, assumption-backed treatment. This closes that gap for the
founder's own highest-level calls. See [`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)
§8.4 (JNY-02).

## Where to find it

- **Read + edit:** `/today`, right column, "Strategic brief" card (`StrategicBriefCard.tsx`).
  Legacy free-text fields stay in Settings → Workspace, unchanged.
- **Injected context:** every agent mission's system prompt, right after the legacy brief block
  (`src/lib/ai/loop.server.ts`, both the fresh-run and resume code paths).

## Demo script

1. Open `/today`. In the Strategic brief card, click "Set" next to Vision, write a paragraph, Save.
2. Reload: the card shows the saved vision, version 1, with an "Edit" affordance now (not "Set").
3. Edit it again and save: version increments to 2; the prior row is marked `superseded` in
   `brief_items`, never mutated in place.
4. Add two Top bets; each renders as its own line with a "Retire" action.
5. Kick off any agent mission for the workspace: its system prompt now carries a
   `--- Strategic decisions (versioned, operator-approved) ---` block reflecting the standing
   items, right after the legacy brief block.
6. Given a body of at least 20 characters, a brief item write also fires a fail-safe AI call
   (`extractBriefAssumptions`) that files up to 3 typed rows in `assumptions` with
   `brief_item_id` set — the existing FS-02 `watchAssumptions` cron picks these up with zero
   changes of its own, and a confirmed challenge writes an `artifact_lineage` receipt
   (`resolveAssumptionChallenge` in `decisions.functions.ts`).

## How it works

- **Schema** — `brief_items` (migration `20260703020000_jny02_strategic_brief_items.sql`): `kind`
  (`vision`/`icp`/`positioning`/`top_bet`), `title`, `body`, `status` (`standing`/`superseded`,
  explicit column rather than an `artifact_lineage`-derived read, because lineage RLS is
  owner-scoped, not workspace-scoped, per house-rules.functions.ts's documented KNOWN LIMIT — a
  workspace-shared brief cannot depend on which member wrote the edge), `version`,
  `supersedes_id`. Same migration relaxes `assumptions` with a nullable `brief_item_id` FK and
  widens `assumptions_source_chk` to accept it as a third valid source, alongside `decision_id`
  (FS-02) and `prd_id` (CNV-02).
- **Server functions** (`src/lib/briefs.functions.ts`) — `listBriefItems` (standing rows only),
  `upsertBriefItem` (singleton kinds auto-supersede the current standing row of that kind; `top_bet`
  is additive unless the caller names `supersedesId` explicitly), `retireBriefItem` (supersede with
  no replacement, for shrinking the bet portfolio). `extractBriefAssumptions` is a fail-safe local
  sibling of `ai/assumptions.server.ts`'s `extractAssumptions` (FS-02) — kept as a small duplicate
  rather than a generalized shared function, since the two other call sites (`createDecision`,
  `compileContractOracles`) live in files this ticket does not otherwise touch, and the insert
  shape (which FK gets populated) is the only real difference.
- **Prompt injection** — `renderBriefItemsBlock` (pure, unit-tested) composes standing items into a
  labeled text block, appended to the legacy `briefBlock` string at both call sites in the pinned
  `loop.server.ts` (fresh run + resume), mirroring RF-04's house-rules injection exactly: a second,
  independent try/catch, non-fatal on any read failure.
- **Receipts on challenge** — `resolveAssumptionChallenge` (`decisions.functions.ts`, FS-02) now
  also recognizes a `brief_item_id`-sourced assumption. Unlike a decision (reopened to `pending`)
  or a PRD (reopened to `review`), a brief item has no natural "needs review" state of its own, so
  a confirmed challenge only writes the `artifact_lineage` contradicts edge (the receipt); the item
  itself stays `standing` and the operator sees the Call the same way regardless of source, via
  Today's existing `assumptionCalls` surfacing.

## Governance & guardrails

- Workspace-scoped RLS on `brief_items` (`is_workspace_member`), matching every other
  workspace-shared table — not owner-scoped, deliberately, since the Strategic Brief is shared
  operating context, not one person's artifact.
- `extractBriefAssumptions` never throws into `upsertBriefItem`'s handler: the human's write always
  succeeds even if the AI extraction call or the assumptions insert fails.
- No new tool-call surface for agents: writing a brief item is a human action in the UI, not an
  agent-callable tool. Agents only ever read the rendered block.

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2124 pass / 0 fail), including 8 new
      `briefs.functions.test.ts` cases pinning `renderBriefBlock`/`renderBriefItemsBlock`.
- [x] `bunx eslint` clean on every touched/new file (0 errors; 2 pre-existing unrelated warnings in
      `_authenticated.today.tsx`).
- [x] `bun scripts/lint-migrations.ts` — 0 apply-fatal errors on the new migration.
- [ ] Live-browser walk of the demo script above (deferred to the primary checkout before publish,
      same exception every prior Obsidian-era item on this board documents; this worktree's
      `bun run dev`/`build` hit the pre-existing node20-vs-ESM `lovable-tagger` failure).

## Known limits / out of scope

- **Brain surfacing deferred, not dropped.** The spec's "surfaced on Brain/Today" reuse note is
  only half-built: `_authenticated.knowledge.tsx` (the Brain route) is DSN-01's actively-claimed
  file for this same overnight session, so touching it risked a direct lane collision. The
  structured brief lives on Today only for now; a Brain-surface pass is real follow-up work, not a
  silent scope cut.
- **No lineage receipt on the item's own supersession**, only on a confirmed assumption challenge.
  Unlike RF-04's house rules (which derive retired-ness from a lineage edge), `brief_items` uses an
  explicit `status` column as the source of truth for the reason above; a parallel lineage edge on
  every version bump was judged not worth the same owner-scoped-RLS risk for a workspace-shared
  table, so it was left out rather than half-implemented.
- **Not yet live.** The migration is code-complete and gate-verified but not yet applied to the
  live database; it lands on the founder's next publish, same as the other migrations shipped this
  session.

## Related

- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.4
- Siblings this reuses: FS-02 (`assumptions`, `watchAssumptions`), CNV-02 (the `assumptions_source_chk`
  widening precedent), RF-04 (the chokepoint injection pattern)
