# Sample Workspace Seed · the comprehensive product-showcase dataset

> _Created: 2026-07-05 · Last updated: 2026-07-05_

> **Feature ID:** `SAMPLE-SEED` · **Category:** Onboarding / Demo · **Owner:** founder-directed (built by Kiro, 2026-07-05)
>
> **What it is (one line):** A deep, idempotent, demo-scoped seed that fills a workspace with two fully-worked product stories · **Prism** (a consumer money app, the deep hero) and **Trellis** (a warehouse-native product-analytics platform, a second comprehensive product in a different domain) · so that every single Supaprod surface renders with rich, believable business/product/stakeholder data. It doubles as the source for the per-signup "Explore workspace" (Layer A) and pairs with the guided tour / empty-state teaching (Layer B).

This document is two things at once:

1. **A founder's feature-learning guide** · read top to bottom to understand what every Supaprod surface does, what data drives it, and the story behind that data.
2. **The authoring spec** for `seed_sample_workspace()` · every table, its columns, and the target row counts per product, so the seed is comprehensive and schema-correct.

---

## Why two products, and why both are deep

The founder's goal: a person exploring the demo should understand _every_ feature comprehensively, and see the platform's power visually. So:

- **Prism (hero, deepest):** a **consumer money app** (budget, spend, save, send, a premium tier). Chosen because fintech is the most relatable domain _and_ it exercises the widest surface set · activation funnels, pricing/premium decisions, fraud/security (evals + drift + governance), compliance (Trust Ledger + receipts), support triage, churn, growth, and heavy engineering (payments, KYC, real-time ledger → technical PRDs, build missions, releases, incidents).
- **Trellis (second, comprehensive, different domain):** a **warehouse-native product-analytics platform** (self-serve + enterprise; the Amplitude / Mixpanel / PostHog space). A B2B, developer/data-oriented persona · a deliberately different world from consumer fintech · that is rich in real product decisions (pricing, self-serve vs enterprise, SDK, activation, competitor parity). Per founder steering (2026-07-05), Trellis is **not thin**: it also covers every surface with multiple meaningful rows. "Lighter" here means a slightly smaller narrative footprint than Prism, not sparse data.

Both products live as two `projects` inside **one** "Explore workspace", demonstrating multi-product breadth within a workspace.

### Tenancy decision (important): identical data per account, not one shared workspace

The two demo accounts (`demo@redcadence.app`, `demo2@redcadence.app`) each get their **own** fully-seeded Explore workspace (identical content, each owned by that account). We deliberately do **not** use a single co-membership workspace, because the agent tables (`agent_memory`, `agent_runs`, `agent_approvals`, `agents`) carry a **dual-key RLS policy** (`auth.uid() = user_id AND is_workspace_member(workspace_id)`). A co-member would therefore see an _incomplete_ picture (the Brain and agent surfaces would be blank for the non-owner). Seeding identical data per account makes every surface render fully on both logins. This also matches the reusable template exactly: `seed_sample_workspace(_user_id)` seeds one owner's own workspace · precisely what a new signup needs.

---

## Surface-by-surface coverage matrix

Legend for counts: **H** = Prism (hero), **P** = Trellis (second). Counts are the _minimum_ the seed guarantees per product; the seed may add more.

| #   | Surface (what the user sees)       | What it does                                                                      | Tables that drive it                                          | Prism data                                                  | Trellis data                  |
| --- | ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------- |
| 1   | **Today** (home brief)             | The chief-of-staff daily brief: stakes, what changed, what needs you              | `daily_briefs`, plus reads across decisions/approvals/signals | 6 daily briefs (stakes + changed + blocked)                 | shares the workspace briefs   |
| 2   | **Discover · Signals**             | The cited signal stream (support, sales, churn, analytics, reviews, market)       | `signals` (source, sentiment, tags, theme_id)                 | 14 signals across 7 sources                                 | 10 signals across 6 sources   |
| 3   | **Discover · Themes**              | Clustered patterns with frequency/severity/confidence                             | `themes`                                                      | 5 themes                                                    | 4 themes                      |
| 4   | **Discover · Opportunities**       | ICE-ranked, red-teamed opportunity queue                                          | `opportunities` (impact/confidence/ease, status)              | 6 opportunities (committed/discovery/backlog/closed/killed) | 5 opportunities               |
| 5   | **Plan · Roadmap / Specs (PRDs)**  | Cited specs with body, status, model                                              | `prds` (body_md, status, model, opportunity_id)               | 3 PRDs (approved/draft/shipped)                             | 2 PRDs                        |
| 6   | **Plan/Build · Tasks**             | Work items split across agents + humans                                           | `tasks` (status, priority, assignee_kind, agent_id)           | 12 tasks                                                    | 8 tasks                       |
| 7   | **Build · Missions**               | Autonomous multi-step missions with agent hand-offs                               | `missions`, `agent_messages`                                  | 2 missions + 4 hand-off messages                            | 1 mission + 3 hand-offs       |
| 8   | **Build · Agent runs**             | Completed agent executions with tokens/cost/duration                              | `agent_runs`                                                  | 4 runs                                                      | 3 runs                        |
| 9   | **Brain · Decisions**              | The decision record (rationale, status, who decided)                              | `decisions` (source_kind, decided_by_agent_slug, is_public)   | 6 decisions                                                 | 5 decisions                   |
| 10  | **Brain · Learnings**              | Outcome verdicts (missed/mixed/validated) with metrics + ICE deltas               | `learnings`                                                   | 10 learnings                                                | 6 learnings                   |
| 11  | **Brain · Memory / precedents**    | The precedent pattern library the Critic recalls                                  | `agent_memory` (precedent/note, importance)                   | 8 memory entries                                            | 5 memory entries              |
| 12  | **Brain · Belief graph / lineage** | The reasoning graph: contradicts/promotes/supersedes/validates/derived-from/cites | `artifact_lineage` (relation, inference, rationale)           | 12 lineage edges incl. ≥1 live `supersedes`                 | 8 edges incl. 1 `supersedes`  |
| 13  | **Trust Ledger**                   | The receipts: decisions + approvals + bitemporal supersession, shareable          | `decisions`, `agent_approvals`, `artifact_lineage`            | approvals in all 3 states (approved/executed/pending)       | approvals in 3 states         |
| 14  | **Engine Room · Spend**            | AI cost/latency/tokens across traces + budget caps                                | `ai_events`, `ai_budgets`                                     | 20 ai_events across 3 traces + budget                       | 15 ai_events + budget         |
| 15  | **Engine Room · Quality (Evals)**  | Eval suites/cases/runs with pass/fail on the 0-100 scale                          | `eval_suites`, `eval_cases`, `eval_runs`, `eval_case_results` | 2 suites, 8 cases, 2 runs                                   | 1 suite, 4 cases, 1 run       |
| 16  | **Engine Room · Drift**            | Passive drift watcher: baselines + daily snapshots                                | `drift_baselines`, `drift_snapshots`                          | baseline + 7 snapshots                                      | shares baseline + 7 snapshots |
| 17  | **Ask (⌘J) / Chat**                | Grounded conversation with the workspace's own history                            | `conversations`, `messages`                                   | 2 conversations, 6+ messages                                | 1 conversation, 4 messages    |
| 18  | **Meetings**                       | Transcripts → summary → action items → decisions                                  | `meetings` (action_items, decisions_made jsonb)               | 2 meetings                                                  | 1 meeting                     |
| 19  | **Docs / Knowledge**               | Internal product docs (brief, principles, roadmap, competitive scan)              | `docs` (icon, content_text)                                   | 4 docs                                                      | 3 docs                        |
| 20  | **Notes**                          | Founder scratch notes with tags                                                   | `notes`                                                       | 4 notes                                                     | 3 notes                       |

### Extended surfaces (seeded where the table exists; confirmed per-migration before insert)

- **Impact Ledger / Stakeholder packs** · derived from `decisions` + `learnings` + `artifact_lineage`; no separate seed rows needed (they compute from #9-#12). Rich decisions/learnings make them light up automatically.
- **Launch plans** (`launch_plans`, jny04), **Outcome contracts** (`outcome_contracts`, cnv01), **Playbook runs** (`playbook_runs`), **Release notes** (`release_notes`, k1), **Cost incidents** (`cost_incidents`) · the seed adds a small number for the hero (Prism) where the DDL is confirmed, so these surfaces are non-empty. These are additive and guarded so a missing column never aborts the seed.

---

## The Prism story (hero) · the narrative spine

**Prism** is a consumer money app: budgeting, spending insights, savings goals, peer-to-peer send, and a premium tier ("Prism Plus"). North star: _"Get 40% of active users to a funded savings goal within 30 days of signup."_ The seed tells one coherent quarter of product work:

- **The tension:** activation is strong at signup but drops at the "connect your bank" step (Plaid link friction); premium conversion is soft; a fraud-false-positive spike is hurting trust; app-store reviews split between "love the insights" and "the bank connection failed."
- **The decisions:** ship a streamlined bank-link with a fallback; launch Prism Plus at the right price; harden the fraud model's precision (an eval + drift story); kill a "crypto wallet" parity bet the Critic red-teams.
- **The supersession (moat proof):** an early "aggressive fraud blocking" decision is **superseded** by "precision-tuned fraud scoring" after a validated learning shows false positives crushed trust · a live `supersedes` edge with a bitemporal retirement, which lights up the Decision Brain and Trust Ledger.
- **Stakeholders:** the founder/Head of Product, a growth PM, an eng lead, a trust & safety lead, a design partner (an SMB customer), and the support team feeding signals back.

## The Trellis story (second, comprehensive) · a different world

**Trellis** is a warehouse-native product-analytics platform for product/data teams. North star: _"Every customer answers their first product question within 24 hours of connecting a warehouse."_ Its quarter:

- **The tension:** self-serve trial-to-paid conversion is soft (buyers don't see value fast enough); enterprise wants SSO + audit before they'll buy; the SDK install is a drop-off; a competitor shipped a "reverse-ETL" feature.
- **The decisions:** ship a guided "first question in 10 minutes" onboarding; build enterprise SSO/audit; decide self-serve-vs-enterprise packaging; kill or defer the reverse-ETL parity bet after the Critic cites Prism-workspace-style parity precedent.
- **The supersession:** "manual SQL explorer" superseded by "natural-language question box" after a validated activation learning.
- **Stakeholders:** a data-team buyer, a self-serve PM, an enterprise AE, a platform engineer.

---

## Idempotency, cleanup, and safety

- **Sentinel:** every seed writes `agent_memory.metadata->>'seed' = 'sample-workspace-v1'`. The function early-exits if that sentinel already exists for the user, so re-running is safe.
- **Cleanup (destructive, demo-scoped only):** a `DO` block wipes the two demo accounts' prior sample/demo content (the old Lumen "Demo workspace" + `demo-seed-rich` rows) in FK-safe order before reseeding, so the demo accounts show one clean, coherent world. It touches **only** `@redcadence.app` accounts and leaves an empty personal "My workspace".
- **Scores are 0-100** (not the legacy 0-1) so Evals/Drift read correctly without the KI-14 normalization step.
- **Humanized output:** no em/en dashes, no AI-cliché phrasing in any seeded string (house middot `·` where a separator is needed), matching the repo's humanized-output law.

## How to apply (Kiro cannot write the live DB; Lovable-managed)

1. Open Lovable → the project → Cloud → SQL editor (or a supported MCP client running the Lovable MCP `query_database`).
2. Paste the migration `supabase/migrations/<ts>_sample_workspace_seed.sql` and run it. It is idempotent.
3. Verify on the live app: log in as `demo@redcadence.app`, open Today / Discover / Plan / Build / Brain / Trust Ledger / Engine Room and confirm both Prism and Trellis render richly.

## Layer A + Layer B (the onboarding follow-on)

- **Layer A (per-signup sample workspace) · SHIPPED, dormant by design.** On first login the app can call `triggerSampleWorkspace` (`src/lib/onboarding/onboarding.functions.ts`), which invokes `seedSampleWorkspace(userId)` (`src/lib/onboarding/seed-workspace.server.ts`) → the idempotent DB function `seed_sample_workspace(_user_id)`. This gives every new account its own clearly-labelled, fully-populated "Explore workspace" (Prism + Trellis) alongside its empty personal workspace. It is **gated by `SAMPLE_WORKSPACE_ENABLED=1`** (no-op until the founder flips it in Lovable), idempotent (the sentinel guard), never throws (a seed failure never blocks signup), and is not billed (seeded data, not user AI usage). `isSampleWorkspaceEnabled` lets the onboarding UI decide whether to offer an "Explore a sample workspace" affordance. **To activate:** set `SAMPLE_WORKSPACE_ENABLED=1` in Lovable project settings and call `triggerSampleWorkspace` from the first-run flow. Wiring it into the trigger is deliberately avoided (the `handle_new_user` auth trigger is regenerated by Lovable syncs, KI-13, so it is fragile); the app-side call is the robust path.

- **Layer B (learn by doing) · NEXT INCREMENT, founder-attended on the live app.** The pieces:
  1. **Onboarding Concierge** · already shipped (`seedWorkspaceFromContext`, WM-S3): generates a personalized seed from the user's real product context.
  2. **Teaching empty states** · on the user's _own_ workspace, each surface's empty state teaches the next action ("Connect a source to start sensing", "Ask a question to see the loop run"). Cold-buildable per surface; sequence with the design pass since it is taste-bearing and UI-verified.
  3. **Guided tour** · a short, dismissible first-run tour that walks Today → Discover → the Critic → the Trust Ledger, reusing the sample workspace as the stage. Best built with the dev server running and verified visually, so it is scoped as the next increment rather than shipped blind.

  Layer B is intentionally not built blind here: it is UI-heavy and must be visually verified. The rich seed (this migration) is its foundation, so there is no rework: the sample workspace is the stage the tour and empty states point at.

## Related

- [`docs/operations/demo-credentials.md`](../operations/demo-credentials.md) · the demo accounts + re-seed instructions
- [`supabase/migrations/20260625150000_demo_seed_rich.sql`](../../supabase/migrations/20260625150000_demo_seed_rich.sql) · the prior rich seed this supersedes
- [`supabase/migrations/20260626210000_demo_workspace_reset.sql`](../../supabase/migrations/20260626210000_demo_workspace_reset.sql) · the admin reset function
