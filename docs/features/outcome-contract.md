# The Outcome Contract (CNV-01, v12 sec 7.4)

> _Created: 2026-07-02_

The Outcome Contract is a typed projection of a spec (`prds`), sitting alongside the existing markdown narrative (`body_md`). It is the first piece of the v12 Program CONVENTIONS build: the artifact formerly known as the PRD, split into a human view (unchanged) and a machine view an agent can consume directly instead of re-parsing prose.

**Why this exists:** the self-audit in [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) sec 7.1 names the gap directly — Cadence's decision layer is typed and bi-temporal, yet `prds.body_md` is a TEXT blob. The moat doctrine stopped at the requirements boundary. This closes that: `contract` is queryable, diffable, and individually supersedable, the same standing/superseded idiom FS-02's `assumptions.status` already uses.

## What ships

- **Schema** (`supabase/migrations/20260702234000_cnv01_outcome_contract.sql`): `prds.contract jsonb NOT NULL DEFAULT '{}'` + `prds.contract_migrated_at timestamptz`. Backward compatible — every existing PRD defaults to an empty contract, and every existing reader of `prds` (task graph, Critic, RAG citations, GitHub export) is untouched.
- **The typed shape** (`OutcomeContractSchema` / `OutcomeContract` in `src/lib/discovery.functions.ts`): `intent` (one paragraph), `evidence_links`, `success_metrics` and `non_goals` (each a list of `ContractClause`), `budget` (estimate + blast radius), `ambiguity_policy`, `drafted_by` (`agent` | `human`), `drafted_at`.
- **`ContractClause`**: `{ id, text, status: "standing" | "superseded", superseded_by, oracle_kind, oracle_ref, created_at }`. `oracle_kind`/`oracle_ref` start `null` on every clause — CNV-02's requirement-to-oracle compiler is the thing that fills them in.
- **Dual projection, one write path.** `getPrd` already returns the whole row (contract included, no new query). `savePrd` now also accepts an optional `contract`; applying a drafted or edited contract goes through the exact same endpoint as any other spec save, so status-transition and Decisions-capture logic never has to special-case it.
- **`draftContractFromPrd`** — AI structures an existing PRD's narrative body into a contract. Returns a **draft only**; nothing is persisted until the human reviews it and calls `savePrd({ id, contract })`. This is the lazy-migration entry point: existing PRDs never get force-migrated, they get structured the moment someone opens the Contract tab and asks for it.
- **`supersedeContractClause`** — the individually-supersedable mechanic. Never overwrites a clause in place: the prior clause is marked `superseded` with `superseded_by` pointing at the replacement, and a new `standing` clause is appended. Pure logic lives in the exported `supersedeClause()` helper (`src/lib/discovery-contract.test.ts`, 5 tests), same pattern as FS-02's `deriveWatchVerdict`.
- **UI**: `src/components/product/OutcomeContractPanel.tsx`, wired into the PRD detail page (`/prds/$id`) as a third mode next to Edit/Preview — **Contract**. Empty contract renders a "Draft contract from this spec" affordance; a populated one renders intent, success metrics, non-goals (each clause hover-revealing a supersede pencil → inline edit → save), budget/blast radius, and the ambiguity policy, with a `drafted by / drafted at` footer.

## How to use / verify

1. Open any existing spec at `/prds/$id` → click **Contract**. If it has content but was never structured, you see "This spec has not been structured into an Outcome Contract yet" and a **Draft contract from this spec** button.
2. Click it → the AI reads `body_md` and returns a draft (intent, up to 8 success metrics, up to 6 non-goals, budget/blast radius and ambiguity policy only where the text actually supports them). Review the draft inline.
3. **Apply contract** → persists via `savePrd`; the panel switches to the read view and `contract_migrated_at` is stamped.
4. Hover any success metric or non-goal → the pencil icon → edit the text → **Save**. The prior clause moves into a collapsed "N superseded" `<details>` (struck through); the edited text appears as a new standing clause.
5. Re-open the PRD elsewhere (task graph, Critic, GitHub export) — all unaffected; `body_md` is untouched by any of the above.

## Scope notes (what this does NOT do yet)

- `evidence_links` is wired in the type but not yet populated by `draftContractFromPrd` (it only reads the PRD's own body, not RAG citations) — filling it from `citations` is a natural follow-up, not blocking.
- `oracle_kind` / `oracle_ref` per clause are the seam CNV-02 (the requirement-to-oracle compiler) fills in.
- One-line-intent agent authorship (starting a spec from nothing but a sentence, not structuring an existing one) is CNV-04.

## Related

- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) sec 7 — the pressure test, the three-lifetime design, and the full CNV/AGT build list.
- [`critic-agent.md`](./critic-agent.md) — the DEF-03 spec red-team lens, unaffected by this change (still reads `body_md`).
- CNV-04 (agent-authored contracts) and CNV-02 (requirement-to-oracle compiler) build directly on this schema.
