# The Outcome Contract (CNV-01/CNV-04/CNV-02, v12 sec 7.4)

> _Created: 2026-07-02 · Last updated: 2026-07-03 (CNV-02)_

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

## Scope notes (what CNV-01 does NOT do)

- `evidence_links` is wired in the type but not populated by `draftContractFromPrd` (it only reads the PRD's own body, not RAG citations).
- `oracle_kind` / `oracle_ref` per clause are the seam CNV-02 (the requirement-to-oracle compiler) fills in.

## CNV-04: agent-authored contracts (the friction killer, v12 sec 7.3)

**Why this exists:** v12 sec 7.3 names the command grammar directly — "the human authors a sentence, not a spec... the agent authors the contract in seconds... the human judges deltas, not blank pages." This inverts the market's shape: ChatPRD-style tools draft documents for humans to own; here the contract is the agent's plan-of-record the human governs.

### What ships

- **`draftContractFromIntent`** (`src/lib/discovery.functions.ts`) — takes a one-line intent (3-400 chars), pulls standing context + precedent from the same RAG index `generatePrd` already uses (`retrieve()`; prior PRDs are indexed as `source_kind: "prd"`, so precedent is real prior specs, not just docs/notes/meetings), and drafts a full contract in one AI call: intent, up to 6 success metrics, up to 5 non-goals, budget/blast radius, ambiguity policy, and **up to 5 clarifying questions asked in one batch** (empty if the intent is already unambiguous — the model is instructed not to invent friction).
- **Creates the spec immediately** — unlike `draftContractFromPrd` (CNV-01, which only returns a preview the human must apply), this inserts the `prds` row right away: v12's "the agent authors the contract in seconds" means the human's first touch is a real row to edit deltas on, not a draft to confirm into existence. `runCritic` red-teams it inline, same as `generatePrd`.
- Clarifying questions are prepended into the narrative body as a "## Open questions for you" section (durable — survives past the initial toast, visible in Edit/Preview too, not just a one-time notification) and also returned to the caller for an immediate toast.
- **UI**: `SpecsPanel.tsx`'s spec-list composer (`/plan` → Specs tab) replaced the old multi-line "brief" box with a single-line intent input — "What do you want to build?" On submit, navigates straight to the new PRD's **Contract** tab (`/prds/$id?tab=contract`, via a new `validateSearch` on the route) so the human lands on judging deltas, not the narrative editor.

### How to use / verify

1. `/plan` → Specs tab → type one line into "What do you want to build?" → **Draft the contract**.
2. Lands on `/prds/$id?tab=contract` with a populated contract (intent, metrics, non-goals, budget) and, if the model had a genuine open question, a toast plus a "## Open questions for you" section at the top of the Preview/Edit body.
3. Edit any clause via its supersede pencil (same mechanic as CNV-01) instead of retyping the whole spec.
4. Critic badge appears in the metadata row within seconds, same as any other generated spec.

### Scope notes (what this does NOT do)

- The retrieved RAG context is concatenated into the prompt the same way `generatePrd`'s existing brief flow already does (not through `retrieve()`'s `formatContextBlock` injection-quarantine wrapper). This is pre-existing exposure shared with `generatePrd`, not a regression introduced here (security-reviewed); batch-hardening both call sites is a follow-up, not blocking.
- The old multi-line "brief → PRD" flow (`generatePrd`) is untouched and still used by the opportunity-promotion path (`OpportunitiesPanel.tsx`); only the Specs tab's standalone composer was replaced.

## CNV-02: the requirement-to-oracle compiler (v12 sec 7.2)

**Why this exists:** v12's standing rule, stated directly — "a requirement without an oracle is an assumption, and assumptions get watched, not asserted." Every success-metric clause CNV-01/CNV-04 draft is, until compiled, an unverified claim. This closes that: "agents built it, and here is proof it does what we agreed" becomes a sentence the product can actually say.

### What ships

- **`compileContractOracles`** (`src/lib/discovery.functions.ts`) — classifies every uncompiled `success_metrics` clause on a spec's contract into one of four real oracles, reusing existing engines rather than inventing new ones:
  - **`eval`** — a qualitative/behavioral claim an LLM judge can grade. Creates (or reuses) one `eval_suites` row per PRD (new `prd_id` column) and one `eval_cases` row per clause (`rubric` = the clause text itself), so it shows up in the existing Eval Harness (`/evals`) like any other suite.
  - **`ci`** — inherently covered by the standard CI gate (type-check, lint, automated tests). No new artifact: Cadence cannot mint a GitHub check per clause, so this is an inline label on the clause (`oracle_ref` = a fixed sentence). Classified narrowly — only claims that are actually about code/build health, not product behavior.
  - **`uat`** — needs a human to manually verify. Inline too: the clause gets a real checkbox (`uat_checked`/`uat_checked_at`), rendered in the Contract tab next to the clause text.
  - **`unverifiable`** — not falsifiable as written. Auto-files as a **watched assumption** (FS-02): the existing `assumptions` table gained a nullable `prd_id` (alongside the existing `decision_id`, both optional but at least one required via a CHECK constraint), so the existing `assumption-watch` cron picks up spec-sourced assumptions with zero changes to the watcher itself — it only ever reads `id`/`statement`/`workspace_id`/`status`, never `decision_id` directly.
  - Idempotent per clause: only unclassified (`oracle_kind === null`) standing clauses are ever touched, so re-running after adding new metrics only compiles what's new. Classification-response parsing is pure and unit-tested (`deriveOracleClassifications`, 6 tests, same pattern as FS-02's `deriveWatchVerdict`).
- **`toggleUatChecklistItem`** — ticks/unticks a `uat` clause's checkbox.
- Since a spec-sourced assumption's confirmed challenge has no `decision_id` to reopen, `resolveAssumptionChallenge` (`decisions.functions.ts`) now branches on whichever source is present: reopens the decision (`status: "pending"`) or the spec (`status: "review"`), and the `artifact_lineage` contradiction edge points at whichever one actually exists. `today.functions.ts`'s "Needs you" assumption-challenge card was also fixed to label the source correctly ("Spec: <title>" vs "A past decision") instead of defaulting every non-decision assumption to a wrong label.
- **UI**: `OutcomeContractPanel.tsx` gained a **Compile N oracles** button (only shown once a contract has standing success metrics), and every compiled clause now renders a small oracle badge (`eval` / `ci` / `uat` with a live checkbox / `watched`).

### How to use / verify

1. Open a spec's Contract tab with at least one standing success metric → **Compile N oracles**.
2. Each clause gets a badge. Click a `uat` clause's checkbox to tick it off (persists, survives reload).
3. Check `/evals` → a new suite named "Spec acceptance: <title>" with one case per `eval`-classified clause.
4. Check `/today` — if any clause classified `unverifiable`, it's now a real row in `assumptions` (workspace-scoped, `prd_id` set); once the `assumption-watch` cron runs and finds a contradicting signal, a "Needs you" card appears labeled "Spec: <title>", and confirming it flips the spec's status back to `review`.

### Scope notes (what this does NOT do)

- Re-classifying an already-compiled clause requires superseding it first (CNV-01's mechanic clears `oracle_kind` implicitly since a superseded clause's replacement is a fresh clause with `oracle_kind: null`) — there's no separate "re-compile this one clause" action.
- One accepted, precedented asymmetry (security-reviewed, not a new tradeoff): `prds` RLS is strictly owner-only while `decisions`/`assumptions` are workspace-shared, so a confirmed challenge on a spec-sourced assumption silently no-ops the `prds.status` reopen if the confirming user isn't the spec's owner — the same shape the decision-reopening branch already had.

## Related

- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) sec 7 — the pressure test, the three-lifetime design, the command grammar, and the full CNV/AGT build list.
- [`critic-agent.md`](./critic-agent.md) — the DEF-03 spec red-team lens, run inline by both `draftContractFromPrd` (on apply) and `draftContractFromIntent` (on create).
- CNV-01/CNV-04/CNV-02 together close the full Outcome Contract loop: draft it, author it in seconds, prove it.
