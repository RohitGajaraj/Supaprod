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
- **Default AI budget caps** for every new user (trigger on `profiles`: $5/day, $50/month) + backfill for all-NULL-cap users. A **clamp trigger** stops non-admins raising caps past the platform ceiling ($25/$250) or NULLing them out. Previously a stranger got unbounded platform-key spend: `checkBudget` silently allows with no row, and the own-row RLS policy let users edit their own caps. The pre-merge adversarial review found the clamp guarded caps but not the row itself, so `20260708140000_sw6_ai_budget_ledger_guard.sql` revokes the `authenticated` `DELETE` grant — deleting the budget row was the most direct escape (no row means `checkBudget` sees no cap), and nothing legitimate deletes an `ai_budgets` row from the authenticated role.
- **Per-user AI burst limiter** (`ai-ratelimit.server.ts` + `user_ai_rate_limits`): 60 requests / 10-min rolling window on `/api/chat`, 429 + Retry-After. Budgets stay the hard spend gate, so the limiter fails open on DB error.
- Verified live: RLS holds against an unauthenticated stranger across 22 tables (empty result or 401, never a leak).

### 4. Cold-start path (3.12a) — connect → first value, unassisted
- **`kickFirstIngest`** (`onboarding/first-ingest.server.ts`), called at connect time (gateway save + GitHub callback): arms `auto_sense_enabled` (+ Tier-1 `auto_trigger_enabled`), jumps the sense queue (`last_auto_sense_at = null` → nullsFirst), and inline-ingests the just-connected provider bounded at 8 s. The connect→ingest link was dead: all pull ingestion ran only inside sense-tick, which filtered on a flag that defaulted false with no setter anywhere in the product.
- `auto_sense_enabled` (and `auto_trigger_enabled`) **default ON** for new workspaces (`20260707203000`). sense-tick is rule-based (zero AI spend); ordering guarantees the spend guards apply first. Because the default is now ON for everyone, the pre-merge review flagged that sense-tick's `DEMO_FEED` top-up would inject synthetic competitor/customer signals into real signups; `topUpDemoFeed` now gates on the owner being an internal demo account (`@redcadence.app`, fail-closed), so a real workspace only ever sees signals from its own bound connectors.
- **GitHub install returns to onboarding**: an allowlisted `returnTo` rides inside the signed connect-state, so the full-page install redirect resumes onboarding (`?connected=github`) at the critic step instead of stranding the user on a close-tab page.
- **Resumable onboarding**: the `onboarded` flag moved from step 1 to the finish step, so an interruption resumes instead of silently skipping the guided path. The seed guard was fixed (a `head:true` count-query bug meant it never fired) and re-keyed on opportunities (auto-sense's demo top-up can insert signals before track pick, which would falsely trip a signal-count guard). A **skip escape** was added so the connect step can never hard dead-end.
- Empty states on Decide + AutoClustered now offer the concrete next action as a button.

### 5. Felt journey (3.13) — three beats reachable in a first session
- **Surprise**: the onboarding critic now honors what the user actually typed — an edited belief runs the verbatim `runWedgeTeardown` (which was orphaned) instead of critiquing a seeded row. Tier-1 trigger proposals default ON (zero AI spend, HITL-only) so an unprompted self-originated proposal can appear.
- **See it**: `StageTimeline` (shared by opportunity/spec/decision/mission details) gains the one-click "See the full chain in the Trust Ledger" door.
- **Excite** already worked via the intent bar spawning a watchable mission.

## Founder-gated remainder (not autonomous)
- **AI-budget ledger tamper-proofing (chokepoint edit).** The `DELETE` escape is closed above, but a determined non-admin owner can still `PATCH` their own row's spend ledger (`daily_usd_used = 0`, or roll `day_window` forward so `checkBudget`'s `day_window = today` guard short-circuits) and keep spending past the cap. This cannot be closed with RLS or an `auth.uid()`-keyed trigger, because the runtime meters usage through the same authenticated user client a tampering `PATCH` would use (`incrementBudget` in `src/lib/ai/runtime.server.ts` charges via the request's user-scoped client, not `service_role`) — so the two writes are indistinguishable at the DB. Correct closure: route `incrementBudget` / `incrementSurfaceBudget` through the service-role admin client, then revoke `authenticated` `UPDATE` on the ledger columns. That edit lands in the pinned AI-runtime chokepoint, so it is founder-gated. (An earlier attempt at an `auth.uid()` ledger-pin trigger was reverted before merge: an adversarial review showed it would silently discard the runtime's own legitimate charges, freezing usage at 0 and making the cap never bind — worse than the hole it aimed to close.)
- Email confirmation + CAPTCHA on signup (a live Supabase auth-config flip + a friction decision).
- Sentry / PostHog / Better Stack keys (the floor works without them; vendors layer on when keyed and the gate flips).
- The founder-facing error-reader UI (a surface on `/admin`, owned by another lane).
- Ship-verdict visibility on Today (owned by another lane).

## Live-verify checklist (needs prod DB access)
1. Apply the 4 migrations in filename order (195000 → 200000 → 202000 → 203000).
2. Supabase advisors: zero criticals.
3. `SELECT jobname, command FROM cron.job` matches the registrations (esp. cluster-tick present, outcome-tick carries `x-cron-key`).
4. `error_events` receives a test write and the founder account holds the `admin` role the read gate needs.
5. A fresh account created on the production URL reaches signup → first value → first governed action unassisted.

## Cross-lane note
`src/lib/connectors/providers/github.server.ts` and `connect/github/**` are also in lane-3's SW-5 claim. This change's github edits are additive (a new optional `returnTo` param + backward-compatible state parsing) and rebased clean onto current main (git auto-merged against SW-5's `resolveGitHub` `productId` addition — different regions). No chokepoint file was touched.
