# WO-E — Demo ops: the seeded environment + the recordable path

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> **PRE-FLIGHT FINDINGS (verified read-only via Lovable MCP, 2026-07-24)** — the executing agent starts from these facts:
> - Both migrations APPLIED: `20260718120000` (Helio seed) and `20260722211500` (demo accounts). ✓
> - Helio Labs ws `10000000-0000-4000-8000-000000000000` exists; projects Atlas, Beacon, Comet, Relay all present; `explore@supaprod.ai` is an **admin** member. ✓
> - `agent_memory` has 4 rows for Helio. ✓
> - KI-14 is clean: 0 legacy-scale (`avg_score <= 1`) eval_runs anywhere. ✓ (Still run the guarded normalization block after any re-seed — idempotent.)
> - **BLOCKER: pending approvals = 0.** Helio has only ONE `agent_approvals` row and it is `failed` (2026-07-17). The 3 seeded approvals are gone — the approval-choreography beat has nothing to approve. Fix: re-run the idempotent Helio seed (`scripts/seed-demo.sh` with `DATABASE_URL`, or replay the seed's approval INSERT block via SQL), then re-verify `status='pending'` count = 3.
> - **FLAG: `account_credits` has NO row for explore@ (checked by user id and by its workspace ids).** Before recording, verify what the cost guard does with a missing credit row, and apply the standing 1,000-credit grant precedent so Ask/dispatch cannot trip a guard toast on camera.
> - Schema notes for the executing agent: the products table is `projects`; approvals table is `agent_approvals`; memory is `agent_memory`; eval score column is `eval_runs.avg_score`; credits live in `account_credits (account_id, balance_credits, monthly_grant_credits, topup_credits)`.

**WHY.** The YC demo video (≤3:00) records on `explore@supaprod.ai` in the Helio Labs workspace. Every pixel on camera must be real. This packet verifies/refreshes the seed, pre-runs the real Build missions (founder-approved), and produces the beat-by-beat walk-note the founder rewrites the script from (`docs/pitch/yc/video-scripts.md` is stale — truth-pass notes at its top).

**No app-code changes.** Ops + SQL + browser verification only. Read `docs/operations/demo-credentials.md` fully first (it holds the account list, KI-14, and the cost-guard history).

## Steps

1. **Migrations present?** Verify `20260718120000_helio_labs_demo_seed.sql` and `20260722211500_demo_accounts_supaprod_domain.sql` are applied in prod (Supabase MCP `list_migrations` / `execute_sql`). If not: `scripts/seed-demo.sh` with `DATABASE_URL` (idempotent), then the accounts migration.
2. **SQL spot-checks** (Supabase MCP `execute_sql`, read-only): Helio ws `10000000-0000-4000-8000-000000000000` exists; `explore@supaprod.ai` is an admin member; approvals queue = 3 (Relay plan-change, `studio.pr.merge` deploy gate, memory candidate); 4 memory reflections; Relay has its signals/opportunity; Atlas shows shipped history.
3. **KI-14 normalization** — run the guarded `<= 1` UPDATE block from the credentials doc (eval_runs, eval_case_results, drift_snapshots). Idempotent; run it regardless.
4. **Credits:** check explore@'s balance against the cost guard; if near the floor, apply the standing 1,000-credit grant precedent (flag to the founder either way).
5. **Workspace pinning:** log in as explore@, switch to Helio Labs / Relay once (last-active resolution then lands `/m` there). Note in the report: explore@ also owns an auto-seeded sample workspace — the switcher will show both; pre-select before recording.
6. **FOUNDER STEP (blocks the live-build beat):** connect the demo GitHub repo to Helio Labs (founder OAuth) and bind to Relay — a purpose-built repo with fast CI (lint + unit, < 2 min). Then pre-run 2-3 real missions to completion the day before: one merged, one PR-open with green CI, one parked at needs-approval. Real receipts populate the board, Memory, and ship history.
7. **The live beat timing:** `resume-runs` (pg_cron) ticks every minute — a queued mission can take ~60s to wake. Script: dispatch FIRST, narrate the board and a finished mission's diff/CI while it wakes, return to it streaming.
8. **The smoke checklist** (click end-to-end TWICE before recording):
   - explore@ login → `/` → `/m` → Helio/Relay REST room; "N calls wait on you" leads; pill = the real count; WorkingStrip alive; no old rail anywhere; avatar menu present.
   - Ask (⌘J) → a seeded decision question answers with citations.
   - Spine 1–7 walks every face with real data in ONE skin (no bounce).
   - Approve the Relay plan change from the tray → choreography plays → count decrements everywhere.
   - Build: board shows the pre-run missions (branch/files/PR chips); open the live one; "Open the full workbench" → room-chromed; back via Mission Control.
   - Ship face: REL history + "Rollback stays one click"; Learn face: recorded outcome; Brain: reflections + ask-the-record.
   - Sign out. Sign back in.
   - Zero console-error overlays; zero cost-guard toasts; zero dead controls on the path.
9. **Deliverable:** the walk-note — per script beat, exactly what the screen shows now (so the founder rewrites `video-scripts.md` fast; the rewrite itself is his).
