# SW-6 — Production ship (failure floor, tenant safety, cold start, felt journey)

> _Ship-week seam 6. Mission `docs/planning/mission-demo-week.md` sections 3.12 + 3.13. Shipped 2026-07-07 (lane 1)._

The seam that separates "great demo" from "shipped product": a stranger can sign up on the production URL, reach first value unassisted, is safe to let loose, and the founder can see it if any part breaks. This is functionality, not styling.

## What shipped

### 1. Failure-detection floor (3.12c) — the founder can see errors
The AFD initiative stays founder-gated, but shipping blind is not acceptable. Inside the existing `src/lib/observability/` façade only:

- **`error_events` table** (`20260707200000_sw6_error_events.sql`): in-house, vendor-free, always-on error store. Service-role writes, admin-gated reads (`has_role('admin')`). No foreign keys, so capture survives the workspace deletion it might be reporting on.
- **`recordErrorEvent`** (`observability/errors.ts`): always-on write (no key, no gate) with a per-isolate storm guard (40 writes/min) so an error loop can't amplify. `captureError` writes the floor first, then the gated Sentry envelope on top. Message/stack/path are length-capped at write time.
- **`src/server.ts`**: both catch paths (h3-swallowed SSR 500s + the outer worker catch) persist through `ctx.waitUntil` so the write survives the response return.
- **Health endpoint** (`api/public/health.ts` + `app-health.ts`): adds a **cron-pulse staleness check** (the minutely `cron.resume-runs` older than 10 min → 503, the delegate-poll-tick incident class made externally visible) and a **`release` build stamp** (`CF_VERSION_METADATA_ID`), so "the published URL serves the current build" is a one-request check.
- **`uptime-tick`** (`api/public/hooks/uptime-tick.ts`, every 5 min): self-probes the public health URL through the full DNS/CDN/worker/DB path, records the result in `job_runs`, writes `error_events` on degradation, and sweeps `error_events` older than 30 days.
- **Cron watchdog** (`observability/jobs.ts` `EXPECTED_JOBS` + `observability.functions.ts` `cronHealth`): the expected-jobs manifest diffed against `job_runs` recency, stale first. The missing half of the delegate-poll-tick fix — the system now knows what *should* run, not just what did.
- **`listErrorEvents`**: admin-gated founder read path over `error_events`.

### 2. Production config truth (3.12d) — every cron registered by migration
`20260707202000_sw6_cron_truth.sql` closes the config-drift findings:
- Restores `event-reactor-tick` + `approvals-tick` + `memory-tick-daily` (scheduled by `20260620150512`, then unscheduled by both `20260625` migrations and never restored — without event-reactor nothing drains `event_queue`, so a fresh user's first signals never woke an agent).
- Registers `cluster-tick` (never scheduled by any migration, only a commented placeholder, while its `auto_cluster_enabled` flag defaults ON — the "first clustered signal set" had no driver).
- Re-registers `outcome-tick` off the dead `apikey` auth style onto `x-cron-key` (it had 401'd on every invocation since `20260611161500`).
- Schedules `admin-expiry` / `retention` / `credit` ticks (hooks existed, no scheduler).
- `.env.example`: the complete server env manifest (51 vars were undocumented).

### 3. Tenant safety under strangers (3.12b) — guards bind for a fresh workspace
`20260707195000_sw6_fresh_workspace_guards.sql`, all binding through existing reads with **zero changes to the pinned AI runtime**:
- **Default AI budget caps** for every new user (trigger on `profiles`: $5/day, $50/month) + backfill for all-NULL-cap users. A **clamp trigger** stops non-admins raising caps past the platform ceiling ($25/$250) or NULLing them out. Previously a stranger got unbounded platform-key spend: `checkBudget` silently allows with no row, and the own-row RLS policy let users edit their own caps and spend ledger. The spend gate is now closed on three fronts, all verified by adversarial review:
  - **Caps** are clamped by the trigger (can't exceed the ceiling or go NULL).
  - **Row deletion** is revoked: `20260708140000_sw6_ai_budget_ledger_guard.sql` removes the `authenticated` `DELETE` grant (deleting the row made `checkBudget` see no cap).
  - **Ledger tampering** is closed: `20260708153000_sw6_ai_budget_ledger_columns.sql` revokes `authenticated` `UPDATE` on the spend-ledger columns (`daily_usd_used`, `monthly_usd_used`, the token-used pair, `day_window`, `month_window`) while keeping the cap columns writable, and the runtime now meters usage through the service-role admin client (`incrementBudget` / `incrementSurfaceBudget` in the AI-runtime chokepoint). Because the genuine charge runs as `service_role` and a tampering `PATCH` runs as `authenticated`, the two are finally distinguishable at the grant layer: a `PATCH` that names a ledger column is rejected with `permission denied for column`, while metering (service-role, `GRANT ALL`) is unaffected. This is the founder-authorized chokepoint change that the pre-merge review had deferred; an earlier `auth.uid()`-trigger attempt was reverted because it would have frozen the runtime's own charges.
  - _Residual (accepted, not a platform-spend bypass):_ a user can still delete + re-create their own optional **per-surface** budget (`ai_surface_budgets` keeps its `DELETE` grant, which `deleteSurfaceBudget` needs) to zero a self-imposed sub-throttle. The platform-enforced **global** cap above is the real backstop and cannot be reset, so this cannot exceed real platform-key spend.
- **Per-user AI burst limiter** (`ai-ratelimit.server.ts` + `user_ai_rate_limits`): 60 requests / 10-min rolling window on `/api/chat`, 429 + Retry-After. Budgets stay the hard spend gate, so the limiter fails open on DB error.
- Verified live: RLS holds against an unauthenticated stranger across 22 tables (empty result or 401, never a leak).

### 4. Cold-start path (3.12a) — connect → first value, unassisted
- **`kickFirstIngest`** (`onboarding/first-ingest.server.ts`), called at connect time (gateway save + GitHub callback): arms `auto_sense_enabled` (+ Tier-1 `auto_trigger_enabled`), jumps the sense queue (`last_auto_sense_at = null` → nullsFirst), and inline-ingests the just-connected provider bounded at 8 s. The connect→ingest link was dead: all pull ingestion ran only inside sense-tick, which filtered on a flag that defaulted false with no setter anywhere in the product.
- `auto_sense_enabled` (and `auto_trigger_enabled`) **default ON** for new workspaces (`20260707203000`). sense-tick is rule-based (zero AI spend); ordering guarantees the spend guards apply first. Because the default is now ON for everyone, the pre-merge review flagged that sense-tick's `DEMO_FEED` top-up would inject synthetic competitor/customer signals into real signups; `topUpDemoFeed` now gates on the owner being an internal demo account (`@redcadence.app`, fail-closed), so a real workspace only ever sees signals from its own bound connectors.
- **Sample-data opt-in on the empty Discover state, in a clearly-labelled workspace.** With the demo feed correctly gated off for real users, a not-yet-connected workspace would land on an empty Discover ("Nothing sensed yet"). Rather than reopen silent fake data, Discover's empty state offers a subordinate **"Explore a sample workspace"** action beside the ember "Connect a source" CTA (`DiscoverSurface.tsx`). It opens a **separate** Explore workspace (the rich Prism + Trellis showcase via `triggerSampleWorkspace`) and switches the user into it, so example data never mixes into a real workspace. That workspace is **unmistakably labelled as sample data**, honestly and durably:
  - A durable **`is_sample` flag** on `workspaces` (`20260708160000_sample_workspace_label.sql`), set by the seed's own service-role caller keyed on the exact seeded workspace id (drift-proof, never name-inferred, so a real workspace is never mis-flagged). A `BEFORE UPDATE` trigger makes the flag **user-immutable** (only the service role can change it), so a rename or a hand `PATCH` can't strip the label.
  - A persistent **"Sample data" banner** across the app while a sample workspace is active, plus a **"Sample" badge** in the workspace switcher (`AppShell.tsx`), using the blossom information voice (never ember).
  - **Dormant unless `SAMPLE_WORKSPACE_ENABLED=1`.** The principle: real data, or clearly-labelled sample data by explicit choice, never fabricated data presented as real. Today's empty states were intentionally left alone: they are "caught up" states that also fire for established users, so a sample-data prompt there would be a false positive.
- **GitHub install returns to onboarding**: an allowlisted `returnTo` rides inside the signed connect-state, so the full-page install redirect resumes onboarding (`?connected=github`) at the critic step instead of stranding the user on a close-tab page.
- **Resumable onboarding**: the `onboarded` flag moved from step 1 to the finish step, so an interruption resumes instead of silently skipping the guided path. The seed guard was fixed (a `head:true` count-query bug meant it never fired) and re-keyed on opportunities (auto-sense's demo top-up can insert signals before track pick, which would falsely trip a signal-count guard). A **skip escape** was added so the connect step can never hard dead-end.
- Empty states on Decide + AutoClustered now offer the concrete next action as a button.

### 5. Felt journey (3.13) — three beats reachable in a first session
- **Surprise**: the onboarding critic now honors what the user actually typed — an edited belief runs the verbatim `runWedgeTeardown` (which was orphaned) instead of critiquing a seeded row. Tier-1 trigger proposals default ON (zero AI spend, HITL-only) so an unprompted self-originated proposal can appear.
- **See it**: `StageTimeline` (shared by opportunity/spec/decision/mission details) gains the one-click "See the full chain in the Trust Ledger" door.
- **Excite** already worked via the intent bar spawning a watchable mission.

## What to pick up (founder actions) + what each spends

Everything below is code-complete and merged. These are the switches and the one manual verify that only the founder can do.

**1. Apply the migrations to prod** (filename order). SW-6 now has six, all additive and RLS-aware:
`20260707195000` → `200000` → `202000` → `203000` (the original four) → `20260708140000_sw6_ai_budget_ledger_guard` (DELETE revoke) → `20260708153000_sw6_ai_budget_ledger_columns` (ledger UPDATE revoke + cap-column grants). No data migration, no downtime; each is a grant/trigger/table change.

**2. Env flags (dormant until set) — this is the "what we're spending" control:**
- `SAMPLE_WORKSPACE_ENABLED=1` — turns on the **"Explore a sample workspace"** opt-in on the empty Discover state. Opens a separate, `is_sample`-flagged Explore workspace (banner + badge) so example data is clearly labelled and never touches a real workspace. Spend impact: **zero AI spend** (rule-shaped seed rows only). Leave unset to keep new users on the pure connect-first path.
- `ONBOARDING_SEED_ENABLED=1` — the older onboarding "Use demo data" action (seeds the current workspace in place). Still available for onboarding; the Discover opt-in above deliberately uses the labelled separate-workspace path instead. Also zero AI spend.
- Platform AI spend itself is bounded per user by the now-tamper-proof budget caps ($5/day, $50/month default; $25/$250 ceiling). Raising a user's ceiling is an admin action; BYO-key users spend their own key, not the platform's.

**3. Founder-gated remainder (still not autonomous):**
- Email confirmation + CAPTCHA on signup (a live Supabase auth-config flip + a friction decision).
- Sentry / PostHog / Better Stack keys (the failure floor works without them; vendors layer on when keyed and the gate flips).
- The founder-facing error-reader UI (a surface on `/admin`, owned by another lane) and ship-verdict on Today (owned by another lane).

## Live-verify checklist (needs prod DB access)
1. Apply the six migrations in filename order (195000 → 200000 → 202000 → 203000 → 140000 → 153000).
2. Supabase advisors: zero criticals.
3. `SELECT jobname, command FROM cron.job` matches the registrations (esp. cluster-tick present, outcome-tick carries `x-cron-key`).
4. `error_events` receives a test write and the founder account holds the `admin` role the read gate needs.
5. A fresh account created on the production URL reaches signup → first value → first governed action unassisted.
6. Budget tamper-proofing holds: as a normal signed-in user, a `PATCH` to your own `ai_budgets` row that sets `daily_usd_used = 0` (or rolls `day_window`) is rejected with `permission denied for column`, while normal AI usage still increments the ledger (metering runs as `service_role`). Editing your caps via `/budgets` still works.

## Cross-lane note
`src/lib/connectors/providers/github.server.ts` and `connect/github/**` are also in lane-3's SW-5 claim. The original SW-6 github edits are additive (a new optional `returnTo` param + backward-compatible state parsing) and rebased clean onto current main. The founder-authorized budget follow-up **does** touch the pinned AI-runtime chokepoint (`src/lib/ai/runtime.server.ts`): a two-line client swap in `incrementBudget` / `incrementSurfaceBudget` to meter via `supabaseAdmin`. It was reviewed by three independent adversarial passes (bypass / regression / correctness, all high-confidence clean) before merge.
