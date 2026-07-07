# Trust Ledger — the receipts surface

> _Created: 2026-06-24 · Last updated: 2026-07-07_

> **Status:** ✅ Built 2026-06-24 (lane 2, register item `TRUST-LEDGER`, v11 pillar 3) · Deep functional + design pass 2026-07-07 (dim 17: object detail/trace/time/status, plain-language summary, Obsidian-native tokens) · **Route:** `/trust-ledger` · **Nav:** sidebar footer Trust row → **Trust Ledger**

## What it does

Renders, for every **decision** and every **decided autonomous action**, a one-card "receipt" with the five things a buyer pays trust for:

1. **What changed** — the decision title, or the tool action (`summarizeAction` humanizes `tool_name` + `args`).
2. **Why** — the rationale (`decisions.rationale` / `agent_approvals.rationale` or `decision_reason`).
3. **Evidence** — a count of `artifact_lineage` provenance edges touching the record or its source.
4. **Who approved + when** — the agent slug, whether a human pressed approve (`agent_approvals.decided_by`), and the relative time.
5. **Standing or superseded** — the bitemporal supersession state, with the superseding record id.

Filters: kind (All / Decisions / Actions), outcome (All / Standing / Superseded, with live counts), and free-text search over what/why/who.

## SW-5: the per-mission chain walk (2026-07-07, mission 3.11)

Above the receipt list, a **Mission chain** panel walks any mission's full pipeline end to end from real rows: **signal → decision → contract → design gate → build → test → merge → deploy → outcome**. This is the moat made *visible* — a stranger sees the loop connect, and sees exactly where a link is absent. It is orthogonal to both the flat receipt list and the tamper hash-chain (`trust-verify.ts`, SHA-256): the receipt list proves *what changed and whether it stands*; the tamper seal proves *the receipts were not altered*; the mission chain proves *the pipeline connected*.

- **Honest four-state model** (`src/lib/trust-chain.functions.ts`, pure `assembleChain`, unit-tested): each link is **present** (a real backing row), **skipped** (design — the station is founder-gated / off, mission 3.4), **missing** (a GAP: absent while a *later* link is present — a broken receipt, shown in madder, never hidden), or **pending** (not yet reached — not a defect). A mission is "unbroken" when no link before the furthest-reached one is missing.
- **Evidence resolution** (`getMissionChain`, pinned to the active workspace via `current_user_default_workspace` — RLS alone spans every workspace the caller belongs to): decision (`decisions.mission_id`), contract (`prds` via `decisions.prd_id`/`studio_changesets.prd_id`), build (`studio_changesets`), test (only a changeset that reached `pr_open`/`merged` — CI runs on the PR, so `committed`/`abandoned` carry no test evidence), merge (`merged` status), deploy (only a `status='success'` `deployments` row — a failed deploy is never a shipped link), outcome (`learnings.mission_id`, falling back to `prd_id`), and signal (best-effort `prd.opportunity_id → opportunity.theme_id → signals.theme_id`). Any null hop leaves the link honestly unresolved; any failed read throws (a swallowed error would render a fabricated broken chain), and the panel renders query errors instead of vanishing.
- **Render** (`src/components/trust/MissionChain.tsx` + the `MissionChainPanel` picker in the route): a vertical timeline, moss for present links, madder for gaps, faint ink for skipped/pending, each present link carrying its timestamp + trace ref + click-through backing id.
- **Follow-up:** `learnings.mission_id` is populated only for new outcomes; the chain falls back to the `prd_id` hop for older rows. A dedicated `test_attempts` substrate and the design-station rows (mission 3.4) would turn the currently-`skipped`/`inferred` design and test links into first-class present rows.

## Why it exists

v11 names the decision-and-outcome layer as the moat and "trust is the thing people pay for." The decision/lineage/approval data already exists; this is the first surface that renders it AS receipts — the demo closer a PM forwards to justify a call. It composes existing data only (no schema change), so it renders today and gets richer as real outcomes/supersession edges accrue (DEMO-SEED-RICH, LOOP-PROVE).

## How it works

- **Server fn** `listTrustReceipts` (`src/lib/trust-ledger.functions.ts`) — workspace-scoped (`context.supabase`, RLS-gated) reads of `decisions` + `agent_approvals` (non-pending), merged with the bitemporal `artifact_lineage` graph for supersession + evidence, then source-label hydration (missions/prds/meetings).
- **Pure, unit-tested composition** (`assembleReceipts`, `supersededChildIds`, `evidenceCounts`, `summarizeAction`, `isSupersessionRelation`): a node is **superseded** when it is the CHILD of an ACTIVE (`valid_to` null) `supersedes`/`contradicts` edge (mirrors `knowledge-graph-view`). Counts reflect the full kind+search scope before the outcome filter so the tab badges show true totals.
- **Bitemporal fallback:** the lineage query selects `valid_to` and degrades to the base columns if that column isn't live (PostgREST 42703), so the surface never errors to empty pre-migration.
- **View** (`src/routes/_authenticated.trust-ledger.tsx`), Obsidian-native tokens (the `[data-obsidian]` app scope), one receipt card per record, superseded cards de-emphasized with a History pill. **dim 17 (2026-07-07):** every receipt is a first-class object, so a single click opens the shared **`ReceiptDetailSheet`** (`src/components/trust/ReceiptDetailSheet.tsx`, assembled from `DetailKit` in the same order as the Decide + Today detail sheets); each card carries a registered quiet trace ref (`DEC·` decisions / `ACT·` actions, via the shared `traceRef` + `src/components/trust/format.ts`), `relTimeCaps` timestamps (`--text-subtle`), and a mono-caps **status pill** whose tone reads the semantic role (approved moss, rejected/failed **madder**, the fix for the old `--rose` which resolves to a soft data pink under the dark theme, not an alert). A **plain-language summary** line (`ledgerSummary`, real counts only) names, in a person's words, how many records stand vs were superseded. The pure presentation logic (trace prefixes, status tone, summary) is unit-tested in `src/components/trust/format.test.ts`.

## Security

- All reads go through the authed `context.supabase` (publishable key + user JWT) — RLS applies. Every query is `.eq("workspace_id", workspaceId)`; a caller-supplied `workspaceId` cannot leak another tenant's rows because the live SELECT policies are `is_workspace_member(...)` (verified live 2026-06-24: `decisions`, `agent_approvals`, `artifact_lineage` are all workspace-membership-scoped).
- `args` from `agent_approvals` is attacker-influencable but is rendered as escaped JSX text (no `dangerouslySetInnerHTML`) and length-capped; no XSS or DOM-injection vector.

## Sharing (TRUST-SHARE)

A decision receipt can be published as a clean public **provenance artifact** — what a PM forwards to their VP to justify a call.

- **Share affordance** on each decision card (`ShareControl`): a user-initiated click calls `setDecisionShared(id, true)` (authed, RLS-owned — only the owner can publish their own decision; verified live: the `decisions` UPDATE policy is `is_workspace_member AND user_id = auth.uid()`), then surfaces the copyable public `/d/<share_slug>` link. Nothing auto-publishes (v11: sharing is outward-facing).
- **The public page** (`/d/$slug`, anon, reuses the existing viral route) now renders the honest provenance outcome — **Still stands** or **Superseded** — alongside the title/why/who/date, turning it from a decision blurb into a receipt.
- **Privacy:** the outcome is computed server-side (service-role admin; anon never reads `artifact_lineage`) and **only reveals "Superseded" when the superseding decision is ITSELF public** (`supersedingParentIds` → an `is_public` parent check). A private override never leaks onto a public artifact. Only the safe enum is returned — no ids, titles, or workspace data. Fully tolerant (any lookup miss → "Still stands").

## Known limits / follow-ons

- **"Proven right"** is not yet a distinct outcome — v1 models `standing | superseded`. Linking recorded outcomes to a decision to show "proven" is a follow-on (ties to LOOP-PROVE).
- Renders whatever data exists; a full, believable external story needs DEMO-SEED-RICH (Tier 4).
- Cross-member visibility relies on the workspace-scoped `artifact_lineage` RLS (verified live); single-workspace demo accounts are unaffected.

## Where to see it

`Sidebar → Trust row → Trust Ledger` (`/trust-ledger`).
