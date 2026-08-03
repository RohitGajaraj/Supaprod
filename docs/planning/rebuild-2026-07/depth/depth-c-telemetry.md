# Depth C: Telemetry and the product's own feedback loop

> _Created: 2026-07-28 · Angle C of the depth layer (A: audit/trace/lineage · B: agentic Ask · C: telemetry)_
>
> **Scope:** how Supaprod measures itself, how a failure becomes traceable, how product usage feeds the self-improvement machinery that already exists, and which of the resulting numbers a user is allowed to see.
>
> **Standing rule this document is written under:** a claim never outruns the wiring. Every statement below is tagged **EXISTS**, **WIRING**, or **BUILD**, and every gap names the file and line where the work goes.

---

## 0. Corrections to the brief, verified in code this session

I was handed a ground-truth block. Four items in it are wrong, one is right and the founder is mistaken, and I found one defect nobody flagged. Correcting these first, because the rest of the design depends on them.

### 0.1 CORRECTION (major): "Telemetry: FACADE ONLY ... the AFD initiative was never built"

**False.** AFD-03, AFD-04, AFD-05, AFD-07 and AFD-12 are built, shipped, and load-bearing.

| Piece | File | State |
| --- | --- | --- |
| Config + gate + PII scrub | `src/lib/observability/config.ts` (109 lines) | **EXISTS**, complete |
| Analytics facade (`track`, `identify`) | `src/lib/observability/analytics.ts` (87) | **EXISTS**, complete |
| Error facade (`captureError`, `recordErrorEvent`) | `src/lib/observability/errors.ts` (177) | **EXISTS**, complete, unit-tested (`errors.test.ts`, 261) |
| Job ledger + cron watchdog | `src/lib/observability/jobs.ts` (111) | **EXISTS**, 26 expected jobs declared, **37 cron routes call `withJobRun`** |
| Uptime heartbeat | `src/lib/observability/uptime.ts` (30) | **EXISTS** |
| Admin read surface | `src/lib/observability.functions.ts` (255) + `src/routes/_authenticated.admin.observability.tsx` | **EXISTS** |
| `error_events` table + RLS + 30d sweep | `supabase/migrations/20260707200000_sw6_error_events.sql` | **EXISTS** |
| `job_runs`, `product_analytics`, `ice_adjustments` | migrations 2026-06-25 / 2026-06-26 | **EXISTS** |

The reason `posthog-js` and `@sentry/*` are absent from `package.json` is **a deliberate architecture decision, not a gap**. Read `errors.ts:8-10`:

> _"Uses Sentry's 'envelope' HTTP API directly so we don't pull a heavyweight SDK into the Cloudflare Worker bundle."_

Same for PostHog: `analytics.ts:55` posts to `${host}/capture/` with `fetch`. This is correct for a Workers runtime and it is the right call. **Do not install the vendor SDKs.** The bundle-size and cold-start cost of `@sentry/node` on a Worker is real, the envelope format is stable, and the facade is 264 lines total for both vendors.

What is actually missing is smaller and sharper than "nothing is built" (see §1.2).

### 0.2 CORRECTION: the founder's "we have PostHog ... we are using Sentry for error catching"

Half right, and the half that is wrong matters.

- **The code path exists** for both. **EXISTS.**
- **The keys do not.** Verified against `.env`: there is no `POSTHOG_API_KEY`, no `POSTHOG_PERSONAL_API_KEY`, no `POSTHOG_PROJECT_ID`, no `SENTRY_DSN`, no `BETTER_STACK_HEARTBEAT_URL`. The 44 keys present are model providers, connectors, Supabase, GitHub, Slack, Stripe-adjacent, and `ZEROENTROPY_API_KEY`.
- **Therefore every vendor call in the codebase currently returns `false` at the first line.** `analytics.ts:39` (`if (!cfg.posthog.enabled) return false`), `errors.ts:112` (`if (!cfg.sentry.enabled) return false`).

So: **no product-usage analytics is reaching any vendor today, and no error has ever reached Sentry.** What IS working is the in-house floor: `recordErrorEvent` writes `error_events` unconditionally (`errors.ts:104`, before the gate), and `withJobRun` writes `job_runs` unconditionally. The founder can see cron failures and server errors today. He cannot see anything about product usage.

**Honest one-liner for the founder:** _"The plumbing for PostHog and Sentry is built and tested. Neither has a key, so neither has ever received a single event. Turning them on is an env var and a gate flip, but do not flip it until §2 is fixed, because the inbound path has a cross-tenant bug."_

### 0.3 CONFIRMED: ZeroEntropy is not a product dependency

The brief is right and the founder is mistaken. Verified: `grep -rn "ZEROENTROPY\|zeroentropy\|zembed" src/` returns **zero matches**. The key in `.env` powers the founder's local developer brain (gbrain, `~/.gbrain/`), documented in his own global `CLAUDE.md`.

The product's embeddings run through `src/lib/rag/embed.server.ts`, which uses **Cohere `embed-v4.0`** (line 27) with an **OpenAI `text-embedding-3-small`** path (line 29) via the Lovable gateway, plus a 24h in-process cache keyed on `<model>:<sha256>` so a BYO model switch never serves a foreign vector.

**Say this plainly to the founder:** ZeroEntropy is your laptop's knowledge brain, not Supaprod's. It is not in the product, it is not in `package.json`, and it must not appear in any architecture diagram, investor material, or subprocessor disclosure. `src/lib/compliance/subprocessors.ts` derives the sub-processor list from the live model catalog precisely so this class of drift cannot happen; adding ZeroEntropy by hand would break that invariant.

### 0.4 NEW DEFECT (severe, blocking): the PostHog inbound path is cross-tenant

Nobody flagged this. It is the single most important finding in this document.

`src/lib/analytics-ingest.server.ts:54-70` builds a HogQL query with **no workspace predicate**:

```sql
SELECT event, toString(toDate(timestamp)) AS day, count(DISTINCT person_id), count()
FROM events
WHERE timestamp >= now() - toIntervalDay(${days})
  AND event IN ('decision_made', 'mission_started', ...)
GROUP BY event, day
```

It then labels the **global** result with the caller's workspace at line 98:

```ts
const rows = data.results.map(([event, day, distinctUsers, eventCount]) => ({
  workspace_id: workspaceId,   // <- every workspace gets the same global numbers
  feature_event: event, ...
}));
```

And `src/routes/api/public/hooks/sense-tick.ts:134` calls it **once per workspace**, for every workspace with `auto_sense_enabled`:

```ts
const posthog = await ingestPostHogAnalytics(ws.id, ws.owner_id).catch(() => null);
```

The blast radius is not "a wrong chart". It propagates:

1. `product_analytics` gets identical global rows for every tenant.
2. `insertSpikeSignals` (`analytics-ingest.server.ts:119-158`) writes a **`signals` row** into each workspace derived from other tenants' usage.
3. `cluster-tick` clusters those signals into **themes and opportunities**.
4. `autoAdjustIce` (`src/lib/ice-adjust.server.ts:41`) reads `product_analytics` and **rewrites the opportunity's Impact and Confidence**, recording provenance in `ice_adjustments` that says the number came from this workspace's usage.

**One tenant's usage silently reprioritizes another tenant's roadmap, with a provenance trail that lies about where the number came from.** In a product whose entire pitch is a trustworthy decision record, this is the worst possible bug.

It is dormant today only because the keys are absent. **It must be fixed before any PostHog key is added.** Fix in §7, task T-01/T-02.

### 0.5 NEW: the taxonomy already declared is 58% dead code

`analytics.ts:10-28` declares 19 `TrackEvent` names. Actual `track()` call sites in the whole repo:

- `src/lib/decisions.functions.ts:140` -> `decision_made`
- `src/lib/ai/handoff.server.ts:244` -> `mission_started`
- `src/lib/landing.functions.ts:113` -> the 4 landing events, dynamically

**Eleven declared events are never fired anywhere:** `decision_superseded`, `decision_shipped`, `mission_completed`, `agent_run_started`, `agent_run_completed`, `agent_run_failed`, `connection_connected`, `connection_disconnected`, `signal_ingested`, `ai_kill_switch_flipped`, `budget_exceeded`.

Worse, the inbound HogQL query (`analytics-ingest.server.ts:63-67`) asks PostHog for ten events, **eight of which the app never emits**. So even fully keyed, the ingest would return near-nothing, and `autoAdjustIce` would find "no analytics data yet" forever.

This is a claim-outruns-wiring instance living inside the code itself. Concretely: `src/lib/decisions.functions.ts:207` (`updateDecision`) writes a `stage_events` row on every status change and does **not** fire `decision_shipped` or `decision_superseded` two lines away.

### 0.6 NEW: the facade's own contract doc outruns its wiring

`docs/features/observability-facade.md` declares `pageView()`, `captureMessage()`, `setUser()`, `setTag()`, and **`forget(userId)` (right to erasure)**. None exist in `src/lib/observability/index.ts` (10 lines, 5 exports). The doc also asserts:

> _"An ESLint rule (added at build time) enforces this."_

`eslint.config.js:23` has exactly one `no-restricted-imports` entry, for the `server-only` package. **There is no rule preventing a direct `posthog-js` or `@sentry/*` import anywhere in `src/`.** The one-way street is a convention held up by nothing. Fix: T-03.

`forget(userId)` being undeclared-but-documented is a GDPR Art. 17 exposure the moment a vendor key exists. Fix: T-14.

### 0.7 NEW: there is zero client-side telemetry, and that is a feature

Every facade call in the repo is server-side. `identify()` is exported and never called. There is no pageview hook, no `posthog-js` bootstrap, no session replay, no heatmap, no `window` instrumentation of any kind. Confirmed by reading `src/hooks/` (16 files, none telemetric).

Do not treat this as a gap to fill. Convert it into doctrine (§4.1). A product that stores a PM's strategy must not also watch them type it.

---

## 1. The vendor decision

### 1.1 The ruling

**PostHog EU stays. Sentry EU stays. Better Stack does not.** No vendor SDK gets installed. And the architectural relationship inverts.

**Founder ruling I am overriding:** the AFD plan and the founder's framing both treat PostHog as *where analytics lives*. That is wrong for this product. It produced the cross-tenant defect in §0.4 directly, because when the vendor is the ledger, the only way to read your own usage back is a query you cannot make tenant-safe cheaply.

**The correct relationship: first-party is the ledger, the vendor is a lens.**

- Every product-usage fact is written to a first-party, RLS-scoped, workspace-keyed table **in the same code path as the thing it describes**.
- A projection job forwards a **de-identified, low-cardinality subset** to PostHog for the founder's own funnel and retention work.
- Nothing in the product loop ever reads from a vendor.

Four reasons, in priority order:

1. **The loop has to reason over usage.** `self-improve-tick` runs hourly across every workspace. It cannot make rate-limited HogQL round trips inside a cron. It needs SQL against a table it owns.
2. **Tenancy is only enforceable where RLS is.** §0.4 is what happens otherwise.
3. **The data is the customers' product decisions.** A tenant must be able to see, export, and delete their own telemetry. You cannot offer that over a vendor you do not control.
4. **Vendor churn must be free.** If PostHog goes, the ICE auto-adjust loop, the calibration loop, and the self-improvement engine must keep running unchanged. Under the current design they all break.

**Better Stack is cut.** It buys one thing, an external heartbeat, and `src/routes/api/public/hooks/uptime-tick.ts` already does the opposite of what an external monitor is for: it fetches the app's own health endpoint **from inside the same Cloudflare Worker platform**. When the platform is down the tick does not run, so the silence is the signal, and the cron watchdog in `observability.functions.ts:113-133` already detects exactly that silence via `EXPECTED_JOBS`. Adding Better Stack adds a vendor, a key, a DPA entry and a subprocessor disclosure to buy a signal we compute. Cut it, keep `heartbeat()` as a no-op seam, and **never show an uptime percentage sourced from `uptime-tick`** (§6.3).

### 1.2 What to actually install: nothing

```
Vendor SDKs to add to package.json:  none
Env vars to add:                     POSTHOG_API_KEY, POSTHOG_HOST (default already eu.i.posthog.com),
                                     SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE
Env vars to explicitly NOT add:      POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID  (the inbound
                                     HogQL path is being retired, see T-02)
                                     BETTER_STACK_HEARTBEAT_URL                    (vendor cut)
Gate to flip:                        admin_set_observability_enabled(true), AFTER T-01..T-03 land
```

`SENTRY_RELEASE` already falls back to `CF_VERSION_METADATA_ID` (`config.ts:53`), which is correct and means a Sentry issue is attributable to a deploy for free.

### 1.3 The facade contract, corrected

`src/lib/observability/index.ts` must export exactly this and nothing more. Anything outside `src/lib/observability/**` importing a vendor name is a lint error (T-03).

```ts
// ---- Usage (first-party ledger, vendor projection) --------------------------
export function recordUsage(e: UsageEvent): Promise<string | null>;  // BUILD, returns usage_event id
export type UsageEvent = { /* §3.1 */ };
export type UsageKind = /* the 18 literals in §3.2 */;

// ---- Analytics (the projection; PostHog under the hood) ---------------------
export function track(kind: UsageKind, distinctId: string, props?: TrackProps): Promise<boolean>;  // EXISTS, rewrite
export function identify(distinctId: string, traits?: TrackProps): Promise<boolean>;               // EXISTS, still unused

// ---- Errors (Sentry under the hood) ----------------------------------------
export function captureError(err: unknown, ctx?: ErrorContext): Promise<IncidentRef | null>;       // WIRING: return the ref
export function recordErrorEvent(err: unknown, ctx?: ErrorContext): Promise<IncidentRef | null>;   // WIRING: same
export type IncidentRef = { ref: string; id: number; fingerprint: string };                        // BUILD

// ---- Jobs (in-house job_runs) ----------------------------------------------
export function withJobRun<T>(job: string, fn: () => Promise<T>): Promise<T>;                      // EXISTS
export function heartbeat(job: string, phase: "start" | "ok" | "fail"): Promise<boolean>;          // EXISTS, now permanent no-op

// ---- Governance ------------------------------------------------------------
export function telemetryMode(workspaceId: string): Promise<TelemetryMode>;                        // BUILD, §4.4
export function forget(userId: string): Promise<{ firstParty: number; vendor: boolean }>;          // BUILD, §4.5
export function observabilityGateOn(): Promise<boolean>;                                           // EXISTS
export function readObservabilityConfig(): ObservabilityConfig;                                    // EXISTS
```

Deliberately **not** in the contract, and each for a reason:

- `pageView()` (documented, never built): there are no pageviews in this taxonomy. Route-level counting is the generic scheme §3 exists to replace. Delete from the doc.
- `captureMessage()`: a log line that is not an error and not a usage event has no consumer. It would become a dumping ground.
- `setUser()` / `setTag()`: implies ambient per-request vendor state, which a Worker isolate cannot hold safely across concurrent requests. Context is passed explicitly per call, as `ErrorContext` already does.
- Session replay, autocapture, heatmaps, feature flags: banned outright (§4.1). PostHog project config must have autocapture and replay **off**, and `analytics.ts` must never send `$pageview` or `$autocapture`.

### 1.4 EU residency and consent constraints

**Residency. EXISTS and correct.**
- PostHog: `config.ts:47` defaults `https://eu.i.posthog.com`. The project must be created in the **EU cloud region**; a US project reachable at an EU-looking host is not residency. Verify at project creation, once, and record it in `src/lib/compliance/subprocessors.ts` with `region: "EU"`.
- Sentry: the DSN must be an `ingest.de.sentry.io` DSN. `errors.ts:116` parses the host out of the DSN and posts there, so residency follows the DSN with no extra config. **Add a startup assertion**: if `SENTRY_DSN` host does not end in `.de.sentry.io`, refuse to enable and log once. A US DSN pasted by accident is a silent transfer.
- Both must be added to `src/lib/compliance/subprocessors.ts` as `category: "infrastructure"`, `active: true`, with honest `dataCategories`. That file is derived-where-possible by design; these two are curated entries, so they need a test asserting they are present whenever the corresponding env key is set.

**Consent. This is where the real work is.**

The GDPR posture splits cleanly along one line that this codebase already draws elsewhere:

| Class | Legal basis | Consent needed | Gate |
| --- | --- | --- | --- |
| **Service operation**: `error_events`, `job_runs`, `ai_events` (cost + billing), `api_calls` | Contract performance, Art. 6(1)(b) | No | Always on |
| **Product improvement**: `usage_events` first-party | Legitimate interest, Art. 6(1)(f), with a documented LIA | No, but must be objectable | `telemetry_mode != 'off'` |
| **Vendor projection**: anything leaving to PostHog or Sentry | Legitimate interest **plus** a transfer to a processor | Opt-out, workspace level | `telemetry_mode == 'full'` AND `observability_enabled()` |
| **Pre-signup landing**: `landing_events` | Consent, ePrivacy | Yes, if it uses storage | Cookie banner (does not exist yet) |

Three concrete constraints that follow:

1. **No cookie banner is needed for the authenticated app**, because there is no client-side telemetry and no analytics cookie (§0.7). This is a real competitive advantage for enterprise sales and it is free. Protect it: the ban in §4.1 is what keeps it true.
2. **`landing_events` is the exception.** `src/lib/landing.functions.ts:105` writes a `session_key`. If that key is persisted in browser storage, it needs consent under ePrivacy regardless of GDPR basis. Either make it a per-request, non-persisted value (preferred, it only needs to dedupe within one page load) or ship a banner. Decide before launch. **BUILD.**
3. **Legitimate-interest processing must be objectable.** That is what `telemetry_mode` is for (§4.4), and it must be reachable by the workspace owner in two clicks, not by emailing support.

`src/lib/consent-classes.ts` already implements a four-class consent model for *tool consequences* with the same philosophy ("Supaprod drafts, you release"). Telemetry consent should read as a fifth class in the same Settings surface, using the same vocabulary, so a customer meets one consent grammar and not two.

---

## 2. What exists today, in one table

Before designing new capture, here is every telemetry store that already works. **Most of the taxonomy in §3 is a projection of these, not new capture.** That is the point: this product's first-party instrumentation is already richer than what a PostHog install would give it.

| Store | Written by | Carries | State |
| --- | --- | --- | --- |
| `ai_events` | `src/lib/ai/runtime.server.ts` (single chokepoint) | surface, model, provider, tokens, cost, latency, ttft, cache_hit, fallback, **`trace_id`**, `parent_event_id`, status, error_code | **EXISTS**, complete |
| `job_runs` | `withJobRun`, 37 cron routes | job_name, status, duration, error_kind/message | **EXISTS**, complete |
| `error_events` | `recordErrorEvent` | surface, error_kind/message, stack, request path/method, user, workspace, deployment_id | **EXISTS**, missing trace linkage (§5) |
| `stage_events` | `recordStageEvent`, 12 call sites incl. `deployments.functions.ts:258`, `outcome.functions.ts:161`, `missions.functions.ts:546/672` | entity_type, entity_id, from_stage, to_stage, **actor** (human / agent_slug / system) | **EXISTS**, the lifecycle spine |
| `human_gate_events` | gate resolvers | gate_type (approval/rejection/edit/override), subject, **agent_slug**, tool_name, verdict, diff_summary | **EXISTS**, feeds self-improve |
| `tool_calls` | agent loop, inline (auto-mode) executions | tool_name, ok | **EXISTS** |
| `agent_approvals` | `loop.server.ts:1137` | tool_name, status, decided_at, snoozed_until | **EXISTS** |
| `approval_feedback` | `sendBackApprovalItem` | kind, source_id, note | **EXISTS** |
| `memory_recall_log` | RAG recall path | memory_id, **`trace_id`**, outcome ∈ {used, ignored, contradicted} | **EXISTS**, underused |
| `insights` | derive-tick | kind, claim, confidence, horizon_date, resolution, **`brier_score`**, resolved_at | **EXISTS**, the calibration spine |
| `learnings` | `recordOutcome` | verdict ∈ {validated, missed, mixed}, prior_ice, new_ice | **EXISTS** |
| `activation_events` | `trackActivation` | 7 pre/post-signup milestones, session_id | **EXISTS** |
| `funnel_milestones` | `funnel.functions.ts:60` | signup -> connected -> first_teardown -> ... | **EXISTS** |
| `landing_events` | `landing.functions.ts:100` | 4 events, session_key | **EXISTS** |
| `product_analytics` | `ingestPostHogAnalytics` | workspace, feature_event, cohort_date, distinct_users, event_count | **EXISTS**, source is broken (§0.4) |
| `ice_adjustments` | `autoAdjustIce` | old/new impact + confidence, sample size, reason | **EXISTS** |

**What no store covers, and therefore what §3 actually adds:**

1. **Evidence consumption.** Nothing records that a human opened a lineage sheet, traversed a graph, opened a trace, or asked "why did we decide this". The founder's entire depth mandate is currently unmeasurable.
2. **Evidence failure.** Nothing records that a human asked for lineage and got nothing. This is the highest-value missing event in the product.
3. **Where a decision happened.** `agent_approvals` records *that* a call was decided. Nothing records whether it was decided **inside the conversation** or in the separate `/approvals` queue. That is exactly the before/after measurement for depth-B's Ask work.
4. **Precedent acted on by a human.** `memory_recall_log` records whether the *model* used a memory. Nothing records whether the *person* followed or contradicted a surfaced precedent.
5. **Loop completeness.** Nothing asks whether a signal actually reached an outcome with every hop intact.
6. **Abandonment.** Nothing records started-then-dropped intent.

---

## 3. The event taxonomy

### 3.1 The spine: one new table

**BUILD.** `supabase/migrations/2026XXXXXXXXXX_usage_events.sql`

```sql
CREATE TABLE public.usage_events (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid,                       -- NULL when the actor is an agent or a cron
  kind          text NOT NULL,              -- one of the 18 literals in 3.2, CHECK-constrained
  actor         text NOT NULL DEFAULT 'human',  -- 'human' | '<agent_slug>' | 'system'
  surface       text,                       -- the route/panel, low cardinality, enum-checked in app
  -- Lineage citizenship: a usage fact is a first-class node, not a side channel.
  audit_kind    text,                       -- matches src/lib/audit-id.ts AuditKind
  audit_id      uuid,                       -- the entity this fact is about
  trace_id      uuid,                       -- the ai_events trace this fact belongs to
  -- Bounded, typed properties. NO free text, NO user content. Enforced in app + a CHECK on size.
  props         jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT usage_events_props_bounded CHECK (pg_column_size(props) < 2048)
);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Read: workspace members read their own workspace's telemetry. This is the
-- creepiness gate: if we would not show it to the customer, we do not collect it.
CREATE POLICY "usage_events ws read" ON public.usage_events FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- Write: service_role only. Clients never post telemetry directly (an app that
-- lets the browser write its own analytics rows cannot trust any of them).
GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL    ON public.usage_events TO service_role;

CREATE INDEX usage_events_ws_kind_at_idx ON public.usage_events (workspace_id, kind, occurred_at DESC);
CREATE INDEX usage_events_audit_idx      ON public.usage_events (audit_kind, audit_id) WHERE audit_id IS NOT NULL;
CREATE INDEX usage_events_trace_idx      ON public.usage_events (trace_id) WHERE trace_id IS NOT NULL;

-- Daily rollup, so the 90-day raw window can be purged without losing the trend.
CREATE TABLE public.usage_rollup_daily (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  day          date NOT NULL,
  kind         text NOT NULL,
  actor_class  text NOT NULL,          -- 'human' | 'agent' | 'system'
  n            integer NOT NULL DEFAULT 0,
  distinct_users integer NOT NULL DEFAULT 0,
  p50_ms       integer,                -- for the timed kinds only
  PRIMARY KEY (workspace_id, day, kind, actor_class)
);
```

Three properties of this design are load-bearing:

- **`audit_id` + `trace_id` make a usage fact a lineage node.** This is what makes this proposal of a piece with the founder's mandate rather than a bolt-on. "Why did we decide this" can answer with *who looked at it, when, and what the loop did next*, from the same graph. Hand-off to depth-A: add `usage_event` to `GRAPH_NODE_KINDS` so the graph can render it, dimmed, as evidence-of-attention.
- **`props` is bounded and typed.** 2KB CHECK, no free text (§4.2). A telemetry table that accepts arbitrary blobs becomes an accidental PII store within a month.
- **Clients cannot write.** Every emission goes through a server function or a server-side helper, so `workspace_id` and `actor` are derived from the session and can never be forged.

### 3.2 The eighteen kinds

Naming rule: `noun_verbpast`, snake_case, stable forever. A kind is never renamed; a wrong one is deprecated and a new one added. Every kind is a real product moment, not a page.

#### A. Evidence consumption, the depth layer's own proof

| Kind | Fires when | Props |
| --- | --- | --- |
| `lineage_opened` | `AuditLineageSheet` mounts | `entry` (card \| ask \| deeplink \| incident), `node_count`, `depth_reached`, `latency_ms` |
| `lineage_traversed` | a node in the sheet or graph is clicked | `from_kind`, `to_kind`, `relation`, `hop_index` |
| `trace_opened` | `/traces/$traceId` renders | `entry` (entity \| list \| incident \| ask), `event_count`, `has_guardrail_hit`, `has_eval` |
| `why_asked` | a "why did we decide this" intent resolves | `answered` (bool), `evidence_count`, `latency_ms`, `resolved_via` (graph \| rag \| none) |
| **`evidence_dead_end`** | **a lineage or why request returns nothing** | **`missing_relation`, `stage`, `asked_via`** |

`evidence_dead_end` is the most valuable event in this taxonomy. It is the one that would have found the depth-B lineage hole automatically: a user standing on a shipped mission asks for its outcome, `lineage.functions.ts` has no `changeset` / `deployment` / `outcome` node kind, the query returns empty, and the product records *that it could not answer, and which relation was missing*. That single event stream, aggregated, is a self-diagnosing product. See §6.2 rule U-1.

#### B. Agency, the Ask-does-actions mandate

| Kind | Fires when | Props |
| --- | --- | --- |
| `agent_action_proposed` | `loop.server.ts:1137` writes an `agent_approvals` row | `tool_name`, `consequence_class` (from `consent-classes.ts:134`), `mode`, `risk`, `forced_by_risk` (bool) |
| `agent_action_decided` | a gate resolves | `tool_name`, `verdict` (approved \| rejected \| sent_back \| snoozed), `seconds_to_decide`, **`in_conversation`** (bool), `decided_at_surface` |
| `agent_action_executed` | an approved call runs, or an auto-mode `tool_calls` row is written | `tool_name`, `ok`, `duration_ms`, `mode` |
| `agent_action_reverted` | a rollback, undo, or reverting commit lands within 7 days | `tool_name`, `hours_since_execute`, `reason_class` |

**`in_conversation` is the single most important property in the whole taxonomy.** It is the honest before/after measurement of the highest-leverage gap in the product. Today it is structurally always `false`: `src/routes/api/chat.ts` contains **zero** references to `agent_approvals` (verified), so every approval necessarily appears in the separate `/approvals` queue. When depth-B lands the approval card inside the chat thread, this property is the number that proves it, and it is the number that proves it *did not work* if adoption stays low. Wire it now so the baseline exists before the change.

#### C. Judgment, the calibration loop

| Kind | Fires when | Props |
| --- | --- | --- |
| `forecast_made` | an `insights` row with a claim + horizon is created | `forecast_kind` (prediction \| risk), `confidence_bucket` (0-2 \| 2-4 \| ... ), `horizon_days`, `generator` |
| `forecast_resolved` | `calibrateExpiredInsights` scores one | `forecast_kind`, `outcome` (hit \| miss \| inconclusive), `brier`, `confidence_bucket`, `days_to_resolve`, `judged_by` (model \| measured) |
| `precedent_surfaced` | a memory is recalled into a human-visible surface | `recall_rank`, `similarity_bucket`, `surface`, `memory_ref` (HMAC, §4.3) |
| `precedent_acted_on` | the human's next action agrees with or contradicts a surfaced precedent | `action` (followed \| contradicted \| ignored), `memory_ref`, `seconds_since_surface` |

`judged_by` on `forecast_resolved` matters: today `calibrate-insights.server.ts:49` resolves every forecast by asking a model whether the claim came true. That is a model grading a model. Where a forecast names a measurable event, resolve it arithmetically instead (§6.2 rule U-4) and stamp `judged_by: 'measured'`. Then the Brier score can be reported honestly, split by how it was judged.

#### D. Delivery, the loop's own completion

| Kind | Fires when | Props |
| --- | --- | --- |
| `spec_shipped` | `deployments.functions.ts:141` promotes to production | `days_from_signal`, `gate_count`, `human_edit_count`, `agent_slugs` (count, not names) |
| `outcome_recorded` | `outcome.functions.ts:180` `recordOutcome` | `verdict`, `days_from_ship`, `moved_ice` (bool), `had_forecast` (bool) |
| **`loop_closed`** | an outcome resolves and the chain back to a signal is walked | **`complete` (bool), `hop_count`, `span_days`, `broke_at_stage`** |

`loop_closed` with `complete: false` and `broke_at_stage: 'ship'` is the machine-readable form of "the product does not feel connected". Aggregated, it is §6.2 rule U-3.

#### E. Friction, the negative space

| Kind | Fires when | Props |
| --- | --- | --- |
| `surface_abandoned` | a *started* intent is dropped: a composer with text and no send, a gate opened and left undecided > 60s then navigated away | `surface`, `dwell_ms`, `had_draft` (bool) |
| `gate_snoozed_repeat` | `snoozeApprovalItem` on an item already snoozed | `kind`, `snooze_count` |

`surface_abandoned` is deliberately **not** a bounce or a pageview. It requires evidence of started intent. A user who opens a page and leaves generates nothing. This keeps the taxonomy honest and keeps the volume low.

#### Projections, not new capture

These four already have first-class stores and must **not** be duplicated into `usage_events`. The rollup job reads them directly and the vendor projection forwards them:

- `agent_run_started` / `agent_run_completed` / `agent_run_failed` -> `agent_runs` + `ai_events`
- `signal_ingested` -> `signals`
- `connection_connected` / `connection_disconnected` -> `connections`
- `ai_kill_switch_flipped` / `budget_exceeded` -> `ai_budget_alerts`, `admin_audit_log`

Duplicating a fact into two ledgers guarantees they disagree. The rule: **if a table already records the fact with the fidelity the loop needs, `usage_events` does not repeat it.**

### 3.3 Universal properties

Every `usage_events` row carries `workspace_id`, `actor`, `occurred_at`, and `kind`. Every row that is *about* an entity carries `audit_kind` + `audit_id`. Every row produced inside an agent run carries `trace_id`.

Cardinality discipline, enforced in `recordUsage`:

- `surface` is a closed enum, validated against a const array. An unknown surface is coerced to `"other"` and logged once.
- Numeric props are **bucketed at the write, not the read**: `confidence_bucket`, `similarity_bucket`, `dwell_ms` rounded to 500ms. Raw high-precision timings let you fingerprint a session.
- No prop key may be dynamic. The allowed key set per kind is a static table in `src/lib/observability/usage-schema.ts` and a prop outside it is dropped, not stored.

---

## 4. What NOT to capture

This product stores its customers' product decisions. Every analytics decision has to be made as if the customer will read the schema, because §4.6 says they can.

### 4.1 The banned list, absolute

Never, under any configuration, key, or gate:

1. **Session replay, autocapture, heatmaps, scroll depth, mouse movement, keystroke timing, clipboard, or form-field values.** PostHog's replay and autocapture must be off at the project level, and `analytics.ts` must never emit `$pageview`, `$autocapture`, or `$snapshot`. A product that holds a PM's strategy must not also film them writing it. This is not a privacy nicety, it is the reason the product has no cookie banner (§1.4) and it is a sales asset.
2. **Any user-authored content.** No spec title, no decision rationale, no signal text, no memory content, no prompt, no completion, no comment, no PR title, no repo name, no branch name, no file path, no customer name, no meeting attendee. The vendor learns `spec_shipped {days_from_signal: 12, gate_count: 3}` and never which spec.
3. **A resolvable identifier, at the vendor.** See §4.3.
4. **A per-person behavioral profile.** No "PM score", no "decision quality index", no leaderboard, no per-human productivity ranking. Beyond being repellent, an automated per-person evaluation with any consequence is GDPR Art. 22 territory. Explicitly out of scope forever.
5. **Cross-tenant derivation.** §0.4. A number shown to workspace A must be computable from workspace A's own rows, full stop, unless §6.4's k-anonymity benchmark conditions are met.
6. **IP address, precise geo, or user agent string beyond a coarse device class.** `errors.ts` already does not send them; keep it that way. Sentry's `beforeSend` equivalent here is simply never constructing the field.

`errors.ts:82-92` currently sends `stack`, `request_path` and `extras` first-party. Stacks can contain interpolated values. **WIRING:** add a scrubber to `recordErrorEvent` that redacts anything matching a UUID, a JWT shape, an email, or a `Bearer` token from `stack` and `error_message` before write. This is cheap and it closes the most likely accidental-PII path in the whole system.

### 4.2 The props rule

`props` is a **shape**, never a **content**. The test, written down so it can be applied without judgement:

> If the value could differ between two workspaces because of *what they are working on* rather than *how the machinery behaved*, it does not go in props.

`gate_count: 3` passes. `gate_names: ["security-review"]` fails. `days_from_signal: 12` passes. `signal_source: "acme-corp-slack"` fails.

Enforcement is the static per-kind key table in §3.3 plus a unit test that asserts every allowed key is a scalar with a bounded domain.

### 4.3 De-identification at the vendor boundary

`usage_events` keeps real `workspace_id`, `user_id`, and `audit_id`, because it is RLS-scoped and the customer owns it. The **projection** to PostHog does not.

```ts
// src/lib/observability/project.ts   BUILD
distinct_id = hmac_sha256(TELEMETRY_SALT, workspace_id).slice(0, 16)   // the workspace, never the person
audit_ref   = hmac_sha256(TELEMETRY_SALT + workspace_id, audit_id).slice(0, 12)
memory_ref  = hmac_sha256(TELEMETRY_SALT + workspace_id, memory_id).slice(0, 12)
```

Three consequences, all intended:

- The founder can count and cohort in PostHog. He **cannot** look anything up. There is no join path from a PostHog row back to a customer record without the salt and the database.
- Salting per workspace means the same entity in two workspaces produces different refs, so nothing correlates across tenants even inside the vendor.
- **`distinct_id` is the workspace, not the user.** Per-user cuts stay first-party and RLS-scoped, which is exactly the pattern `gauntlet.functions.ts` already uses (owner-scoped reads with an explicit `.eq("user_id", context.userId)` as defense in depth). The one exception is the pre-signup landing funnel, where there is no workspace yet; `landing.functions.ts:113` already uses an anonymous `sessionKey`, which is correct.

`TELEMETRY_SALT` is a new wrangler secret. Rotating it severs all historical vendor correlation, which is a feature: it is the cheap panic button.

### 4.4 The workspace switch

**BUILD.** `workspace_settings.telemetry_mode text NOT NULL DEFAULT 'full' CHECK (telemetry_mode IN ('full','first_party_only','off'))`

| Mode | `usage_events` | Vendor projection | `error_events` / `job_runs` / `ai_events` |
| --- | --- | --- | --- |
| `full` (default) | yes | yes | yes |
| `first_party_only` | yes | **no** | yes |
| `off` | **no** | no | **yes** |

`off` still writes reliability and cost rows, because operating the service and billing for it is contract performance, not analytics. **Say that in the DPA in exactly those words**, so an enterprise reviewer sees the line drawn deliberately rather than discovering it.

`telemetryMode()` is read inside `recordUsage` and inside the projection job, cached 30s per isolate exactly like `observabilityGateOn` (`config.ts:71-89`).

### 4.5 Erasure

**BUILD.** `forget(userId)` is documented in the facade contract and does not exist (§0.6).

```ts
export async function forget(userId: string): Promise<{ firstParty: number; vendor: boolean }>
```

- First-party: null out `user_id` on `usage_events` and `error_events` (keep the row, the aggregate is legitimate; the link is what must go), delete `activation_events` and `funnel_milestones` rows for that user.
- Vendor: POST PostHog's `/api/person/{distinct_id}/delete/` and Sentry's user-report deletion. Because `distinct_id` is the workspace HMAC (§4.3), a *user* erasure needs no vendor call at all in the normal case, which is the design working as intended. Return `vendor: false` honestly rather than pretending a call happened.
- Wire it into the existing account-deletion path and add a test asserting no `usage_events` row retains the user id afterwards.

### 4.6 The creepiness test, and the surface that enforces it

One rule, and it is cheap because the data is first-party and RLS-scoped:

> **If we would not show a row to the customer, we do not collect it.**

**BUILD.** `/settings/telemetry`, a real surface, not a policy page:

- Every `kind` the workspace emits, with a one-line plain-words description of why it exists and what it changes in the product.
- **The last 50 rows, verbatim**, straight from `usage_events` through the existing RLS SELECT policy. Not a summary. The actual JSON.
- The `telemetry_mode` control, three radio options, with honest consequences named ("`off` also turns off the self-improvement proposals that read your usage").
- "Export my telemetry" -> CSV. "Delete my telemetry" -> the `off` mode plus a purge.

This surface is the reason the taxonomy in §3 is austere. Designing every event against "would I be comfortable showing this row to the person it is about" is a far better filter than any policy document, and it costs one route.

### 4.7 Retention

Extend `purge_old_telemetry` (called by `src/routes/api/public/hooks/retention-tick.ts:35`, currently 180 days for `ai_events` / `prompt_runs` / `tool_calls`, dormant behind `data_retention_enabled()`):

| Store | Raw | Then |
| --- | --- | --- |
| `usage_events` | 90 days | rolled into `usage_rollup_daily`, kept 400 days |
| `error_events` | 30 days (already swept) | fingerprint + count kept 400 days |
| `ai_events`, `tool_calls`, `prompt_runs` | 180 days (unchanged) | dropped |
| Vendor (PostHog) | 90 days, set at the project level | dropped |
| `stage_events`, `learnings`, `insights`, `decisions` | **never purged** | these are the customer's record, not telemetry |

That last row is the important one. The line between "telemetry we age out" and "the customer's decision record we keep forever" must be explicit in the retention function, or a future cleanup will delete the moat.

---

## 5. Error capture: from a user-visible failure to a traceable incident

### 5.1 What exists

- `recordErrorEvent` (`errors.ts:67`) writes `error_events` **always**, before any gate. Storm-guarded at 40 writes / 60s / isolate (`errors.ts:32-44`). Never throws.
- `captureError` (`errors.ts:103`) = floor + gated Sentry envelope.
- Call sites: `src/server.ts:201` (SSR 500s, including the h3-swallowed ones the custom server entry exists to catch), `src/lib/ai/runtime.server.ts:1901` (every AI failure, with a `failure_kind` taxonomy at `runtime.server.ts:1918`), `withJobRun` (`jobs.ts:108`, every cron failure), `uptime-tick.ts:55/64`.
- `listErrorEvents` (`observability.functions.ts:231`) gives the founder an admin read.
- `agent_runs.failure_kind` is tagged on AI failure (`runtime.server.ts:1899`) and rolled up in `getObservabilityStatus` (`observability.functions.ts:102-106`).

This is a genuinely good failure floor. Four things are missing and they are all small.

### 5.2 The four gaps, precisely

**Gap 1: `error_events` has no trace linkage.** Verified columns: `id, occurred_at, surface, error_kind, error_message, stack, request_path, request_method, user_id, workspace_id, deployment_id, extras`. There is no `trace_id`, no `audit_id`, no `agent_run_id`. **This is the mechanical reason a failure cannot become a traceable incident.**

**Gap 2: the one call site that has the trace does not pass it.** `src/lib/ai/runtime.server.ts:1901` constructs the `ErrorContext` with `surface`, `failure_kind`, `model`, `provider`, `runId` and **omits `traceId`**, which is in scope in that function. One added field closes the highest-value half of gap 1.

**Gap 3: the user has nothing to quote.** `src/server.ts:201` captures the error and renders a branded error page. The page carries no reference. A user reporting "it broke" gives the founder a timestamp and a guess.

**Gap 4: the storm guard drops instead of counting.** `errors.ts:37-44` returns `false` past 40 writes/minute. A real incident is exactly the case that exceeds 40, so **the worst incidents are the ones the store under-reports**, and there is no `occurrence_count` to recover the truth from.

### 5.3 The design: the incident ref

**BUILD.** Migration adding to `error_events`:

```sql
ALTER TABLE public.error_events
  ADD COLUMN incident_ref     text,     -- 'INC·7F2A19', user-quotable, unique per fingerprint+window
  ADD COLUMN fingerprint      text,     -- sha256(error_kind + normalized_message + top_frame)[0:16]
  ADD COLUMN occurrence_count integer NOT NULL DEFAULT 1,
  ADD COLUMN trace_id         uuid,
  ADD COLUMN agent_run_id     uuid,
  ADD COLUMN audit_kind       text,
  ADD COLUMN audit_id         uuid,
  ADD COLUMN status           text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','acknowledged','resolved','ignored'));

CREATE UNIQUE INDEX error_events_fingerprint_window_idx
  ON public.error_events (fingerprint, date_trunc('hour', occurred_at));
CREATE INDEX error_events_trace_idx ON public.error_events (trace_id) WHERE trace_id IS NOT NULL;
CREATE INDEX error_events_ref_idx   ON public.error_events (incident_ref);
```

`recordErrorEvent` becomes an **upsert on `(fingerprint, hour)`** that increments `occurrence_count`. The storm guard then guards *inserts*, not *truth*: the 500th occurrence in a minute still lands as `occurrence_count = 500` on one row. That is strictly better and strictly cheaper than today.

**The elegant part.** Add one entry to `AUDIT_KINDS` in `src/lib/audit-id.ts:44`:

```ts
{ kind: "incident", prefix: "INC", table: "error_events", label: "Incident", stage: "Operate" },
```

Because `formatAuditId`, `parseAuditId` and `findAuditIds` are all prefix-driven and pure, and because `AuditTag` / `AuditLineageSheet` are already mounted globally and imported in 17 places, **the incident becomes a first-class, clickable, Ask-parseable lineage node for the cost of one array element.** `findAuditIds` (`audit-id.ts:108`) will already pick `INC·7F2A19` out of a user's chat message with no change.

### 5.4 The chain, end to end

```
An AI call throws inside a mission run
  -> runtime.server.ts:1901 captureError({ trace_id, agent_run_id, failure_kind, ... })     WIRING
  -> error_events upsert, fingerprint dedupe, incident_ref 'INC·7F2A19' minted              BUILD
  -> Sentry envelope, tagged incident_ref + trace_id, so the vendor issue joins back        WIRING
  -> the run's UI shows "This step failed. Reference INC·7F2A19."                           BUILD
  -> user types "what happened with INC·7F2A19" into Ask
  -> findAuditIds() parses it, already                                                      EXISTS
  -> resolve error_events by ref -> trace_id
  -> getTrace({ traceId }) returns the full waterfall: every ai_events row, guardrail
     hits, evals, plus the mission reverse-lookup at traces.functions.ts:217-240            EXISTS
  -> AuditLineageSheet renders the incident beside the mission, the spec, the decision      EXISTS + depth-A
```

Nine steps. Four already work. Two are one-line wiring. Three are the migration above. **This is the highest ratio of founder-visible depth to engineering cost anywhere in my angle.**

### 5.5 SSR failures

`src/server.ts:201` should mint the ref and render it. The error page copy, in house voice:

> **Something broke on our side.**
> Reference `INC·7F2A19`. We already have the details. Paste that reference into Ask and it will pull up exactly what happened.

That last sentence is only allowed once §5.4 is wired end to end. Until then the copy stops at the second sentence. **Claim never outruns wiring**, including in error copy.

---

## 6. The interesting part: product usage feeding the loop the product already runs

This is where Supaprod becomes user-zero of its own machinery instead of merely claiming to be.

### 6.1 What the loop is today

`src/lib/self-improve.ts:194`, `composeProposals(signals)`, is a **pure, deterministic, AI-free** function that reads three signal families and emits flagged proposals with named thresholds:

| Family | Source | Floor | Trigger |
| --- | --- | --- | --- |
| `EvalSignal` | `getEvalHealthImpl` | 3 runs | pass rate < 0.60 |
| `AgentSignal` | `human_gate_events` via `summarizeGateSignals` | 5 decisions | human-correction rate > 0.50 |
| `PlaybookSignal` | `playbook_runs` via `rankPlaybooksByOutcome` | 3 runs | win rate < 0.50 |

Every proposal carries its sample size, sorts by severity then evidence, and is stable across recomputes. Thresholds are named exported constants so they are one place to tune and greppable. An AI rung sits *on top* (`enrichSelfImproveProposal`, `self-improve.functions.ts:277`), grounded strictly in the real records behind the flag, cached so it runs at most once per flag, and forbidden from inventing a problem or changing severity.

Separately, `src/lib/brain/calibrate-insights.server.ts` grades the product's own forecasts: `computeBrierScore` (line 26), `summarizeCalibration` over a rolling window of 10 (line 125), and `updateThrottle` (line 143) which **switches off a generator kind** whose hit rate falls below 0.34 over at least 3 samples, for 72 hours.

That last mechanism is the important precedent: **the product already demotes its own capabilities when they are measurably wrong.** Product usage should feed the same pattern.

### 6.2 The fourth signal family

**BUILD.** Add to `src/lib/self-improve.ts`:

```ts
/** One usage-derived quality signal. Same discipline as the other three:
 *  a real rate over a real sample, with a named floor. */
export type UsageSignal = {
  usage_kind: "evidence" | "gate" | "journey" | "precedent";
  subject: string;          // '<audit_kind>:<relation>' | '<tool_name>' | '<stage>' | '<memory_ref>'
  rate: number;             // 0..1, meaning depends on usage_kind
  total: number;            // sample size
};

export const USAGE_EVIDENCE_MIN = 5;
export const USAGE_EVIDENCE_DEAD_END_CEIL = 0.30;
export const USAGE_GATE_MIN_CONFIRMS = 20;
export const USAGE_GATE_PROMOTE_FLOOR = 0.95;
export const USAGE_GATE_DEMOTE_REVERTS = 1;
export const USAGE_JOURNEY_MIN = 3;
export const USAGE_JOURNEY_INCOMPLETE_CEIL = 0.40;
export const USAGE_PRECEDENT_MIN_CONTRADICTIONS = 3;
```

and a `usageProposal()` following `evalProposal` / `agentProposal` / `playbookProposal` exactly (same shape, same `ScoredProposal` return, same silent skip under the floor). Feed it from a new `readUsageSignals()` in `src/lib/self-improve.functions.ts`, alongside `readEvalSignals` (line ~55), `readAgentSignals` (~78), `readPlaybookSignals` (~101), and add it to the `Promise.all` in `computeSelfImprovementForWorkspace` (~155). The pure core stays pure, and `self-improve-tick` picks it up with no changes.

Four rules:

**U-1 · Evidence dead ends.** Group `evidence_dead_end` by `(audit_kind, missing_relation)` over 30 days. At 5+ occurrences and a dead-end rate above 30% of attempts on that pair:

> _"Lineage from a decision to its outcome is missing. 12 people asked in the last 30 days, 12 got nothing."_ (high)

**This rule, running today, would have auto-detected the depth-B lineage hole.** `ARTIFACT_KINDS` in `lineage.functions.ts:7` has no `changeset`, `deployment`, `outcome`, `learning` or `belief`, so every "what came of this" question after Build dead-ends. The product would have told the founder, in plain words, with a count. That is the demo for this entire angle: **a product that finds its own gaps and names them.**

**U-2 · The confirm tax, and the trust arc learning from evidence.** From `agent_action_proposed` / `_decided` / `_executed` / `_reverted`:

- Promote candidate: a tool with 20+ confirms, approval rate ≥ 0.95, **zero** reverts in 60 days -> _"You have approved `create_task` 34 of 34 times with no rollbacks. Consider moving it to auto."_
- Demote candidate: any tool with a revert within 24h of an auto execution -> _"`open_pull_request` ran unattended and was reverted twice. Consider moving it back to ask-first."_ (high)

**The safety-critical constraint, stated once and non-negotiable:** this writes a **proposal** into `self_improve_proposals`. It never mutates `resolveToolMode` (`loop.server.ts:153`), never writes a tool override, and never widens its own permissions. A human approves the promotion through the existing gate. A loop that can silently grant itself more autonomy because people kept saying yes is precisely the failure mode this product exists to prevent, and shipping it would be indefensible however well it worked. Demotions may be **auto-applied**, because the asymmetry is right: tightening on evidence of harm is safe, loosening on evidence of comfort is not.

**U-3 · The incomplete loop.** Group `loop_closed {complete: false}` by `broke_at_stage`. At 3+ in 30 days:

> _"7 of 9 closed loops lost the thread at Ship. Nothing links a deployment back to the spec that asked for it."_ (high)

Concretely today: `deployments.functions.ts`, `outcome.functions.ts` and `missions.functions.ts` write `stage_events` (lines 258, 161, 546/672 respectively) but call `recordLineage` **zero times**. This rule turns that structural fact into a counted, dated, self-reported flag.

**U-4 · Forecasts judged by arithmetic, not by a model.** Today `judgeOutcome` (`calibrate-insights.server.ts:49`) asks Gemini whether a claim came true, given the linked theme's current state. That is a model grading a model, and every Brier score in the product inherits that softness.

Where a forecast names a measurable event, resolve it **arithmetically** against `usage_rollup_daily`. `opportunities.posthog_event` already exists as the link column (migration `20260626230000`); generalize it to `measure_event` pointing at a `usage_events.kind` plus a threshold. Then `computeBrierScore` gets a hard `actual`, and `forecast_resolved` carries `judged_by: 'measured'`.

This is a strict quality upgrade to an existing loop, it costs one function, and it lets §6.3 report calibration split by how it was judged, which is the honest way to report it.

**U-5 · Memories that keep being wrong.** From `precedent_acted_on {action: 'contradicted'}` grouped by `memory_ref`, 3+ contradictions -> propose retiring or revising that memory. `memory_recall_log` already has the `contradicted` outcome in its CHECK constraint and a `trace_id` to prove it; nothing reads it.

This is the mechanism behind the investor-canon line "it warns before you repeat what was wrong". Right now that line has no wiring. Rule U-5 gives it one: the store learns which of its own entries are misleading. **Do not use that line in any external material until U-5 ships.**

### 6.3 Fixing ICE without a vendor

`autoAdjustIce` (`ice-adjust.server.ts:41`) is a genuinely good idea poisoned by its source. Repoint it:

- `opportunities.posthog_event` -> `opportunities.measure_event` (keep the old column as a deprecated alias for one release).
- `product_analytics` is fed by a **first-party rollup job** reading `usage_rollup_daily`, not by `ingestPostHogAnalytics`.
- Retire `ingestPostHogAnalytics` and `insertSpikeSignals` entirely (T-02). Delete the call at `sense-tick.ts:134`.

Net effect: the cross-tenant defect is gone by construction, the ICE loop **works with zero vendor keys**, and one vendor dependency leaves the core product loop. `getProductAnalytics`'s `ingestGated` flag stays and now means "no usage recorded yet", which is honest.

### 6.4 What to show the user, and what would be dishonest

The bar, stated once so it can be applied without argument:

> **A number is showable when the user could, in principle, falsify it from their own rows.**

Acceptance rate passes: count your approvals, count your rejections, divide. Memory lift fails: you cannot check it without a counterfactual you do not have.

#### SHOW. Earned, honest, already computed.

| Number | Source | Why it is honest |
| --- | --- | --- |
| **Acceptance rate** | `getAcceptanceRate`, `gauntlet.functions.ts:63` | Real head count of decided calls. The accepted set is enumerated explicitly (`approved`/`executed`/`failed`) rather than inferred, with a comment explaining why. Exemplary. |
| **Work the loop carried** | `getAutonomyRatio`, `:143` | Measured, and the denominator is exactly what still comes to you. **Rename it.** See below. |
| **Ritual retention / streak** | `getRitualRetention`, `:240` | A fact about the user's own behavior, with a `realData` flag so a demo account is never mislabeled. |
| **Memory compounds** (stored / recalled / reuse rate) | `getMemoryCompounding`, `:386` | Real counts. `reuseRate` is arithmetic, not a claim. |
| **Outcome accuracy** | `getOutcomeAccuracy`, `:487` | Real `learnings.verdict` values. `mixed` counts in the denominator but not as a win, so the rate is the strict "fully paid off" share. |
| **Forecast hit rate + Brier** | `summarizeResolutions`, `calibrate-insights.server.ts:101` | Falsifiable, resolved against a horizon, and it **throttles itself off when wrong**. This is the single best number in the product and it currently appears in one strip (`GraphCompoundingStrip.tsx:125`). Promote it. |
| **NEW · Time to evidence** | `why_asked` / `lineage_opened` p50 latency, **plus the unanswered rate** | Only honest if shipped as a pair. "Median 1.4s, and 3 of 47 questions went unanswered" is credible. The median alone is marketing. |
| **NEW · Loop completeness** | `loop_closed` | "9 of 14 shipped items have a recorded outcome." Self-critical, and it drives the exact behavior the product wants. |

**Rename "Autonomy ratio" to "Work the loop carried".** The current label overclaims: a rising ratio does not mean less human oversight, it means more of the *reversible* work ran inline. The code comment at `gauntlet.functions.ts:126-132` already says this precisely and the label contradicts it. In investor and product copy, the honest sentence is _"the loop carried 68% of the reversible work; everything with a blast radius still came to you"_, which is a **better** claim because it is the trust story.

#### DO NOT SHOW. Dishonest today.

**1 · Memory lift, as a headline. Do not ship it to users at all.**

`getMemoryLift` (`gauntlet.functions.ts:609`) is the most intellectually honest function in this codebase. It refuses causation, gates on a size floor, a depth-contrast guard and a two-proportion 95% CI, reports negatives as-is, and returns `memoryBounded: false` rather than under-reporting when the timeline exceeds its cap. The doc comment names its own confounders: time collinearity, practice effects, easier later bets, survivorship through hard deletes.

All of that integrity evaporates the moment a card says **"Memory made you 14% more accurate."** It is a correlational within-account split. **Recommendation, and it reverses any prior plan to surface it: keep `getMemoryLift` internal until there is a memory-off control cohort.** Ship it in the internal panel with all four guards visible. If the founder wants a memory number on a user surface, use "Memory compounds" (stored / recalled / reuse), which is a count and cannot lie.

**2 · Any per-person score.** No PM score, no decision-quality index, no leaderboard. Trust, and Art. 22. Permanent.

**3 · Cross-tenant benchmarks.** "Teams like you ship 2.3x faster" is barred until (a) k-anonymity of at least 20 contributing workspaces per cohort cell, (b) explicit workspace opt-in, and (c) the §0.4 defect is fixed and proven fixed by a test. Not at launch.

**4 · Anything computed from a dormant source.** If a source has no data, the surface reads "not measured yet", never `0`, never `-` styled as a value. `getProductAnalytics` returns `ingestGated` for exactly this reason. Every consumer must honor it. `gauntlet.functions.ts` already models this correctly everywhere with `tableReady` and `rate: null`. **This is the house pattern; new surfaces copy it.**

**5 · A confidence number before calibration has samples.** The Brier machinery is honest *because* it needs 3 resolved calls before it will throttle. Do not print a per-forecast confidence on a workspace with fewer than 3 resolved forecasts. Print "no track record yet".

**6 · Uptime percentage.** `uptime-tick` fetches the app's own health endpoint from inside the same platform. When the platform is down, the tick does not run, so the sample is missing exactly when it matters and the computed uptime rounds up toward 100%. A number that is highest when the outage is worst is worse than no number. **Never publish an uptime figure from this source.** Publish incident counts from `error_events` instead, which are honestly floor-biased rather than dishonestly ceiling-biased.

**7 · "It knows what to build."** The investor tagline is directional. On a *product surface*, the honest form of the director claim today is "here is what changed and what it touches", not "here is what to build". Depth-A's lineage work and rule U-1 are what earn the stronger phrasing later.

---

## 7. Build order

Ordered by dependency and by risk. **Phase 0 is blocking: no vendor key may be added until it lands.**

### Phase 0 · Correctness, before any key

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-01 | Fix or retire the cross-tenant HogQL query | `src/lib/analytics-ingest.server.ts:54-70`, caller `src/routes/api/public/hooks/sense-tick.ts:134` | WIRING |
| T-02 | Delete `insertSpikeSignals`; a signal must never be derived from another tenant | `src/lib/analytics-ingest.server.ts:119-158` | WIRING |
| T-03 | Enforce the facade seam: `no-restricted-imports` for `posthog-js`, `posthog-node`, `@sentry/*`, `@betterstack/*`, excluding `src/lib/observability/**` | `eslint.config.js:23` | BUILD |
| T-04 | Scrub UUIDs / JWTs / emails / bearer tokens from `stack` and `error_message` before write | `src/lib/observability/errors.ts:81-92` | BUILD |

### Phase 1 · The spine

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-05 | `usage_events` + `usage_rollup_daily` migration | `supabase/migrations/` | BUILD |
| T-06 | `recordUsage()` + the static per-kind prop schema | `src/lib/observability/usage.ts`, `usage-schema.ts` | BUILD |
| T-07 | Rewrite `track()` to write first-party then project; HMAC de-identification | `src/lib/observability/analytics.ts:33`, new `project.ts` | WIRING |
| T-08 | Replace the 19-name `TrackEvent` union with the 18 `UsageKind` literals; delete the 11 dead names | `src/lib/observability/analytics.ts:10-28` | WIRING |
| T-09 | `telemetry_mode` column + `telemetryMode()` | migration + `src/lib/observability/config.ts` | BUILD |

### Phase 2 · Incidents (highest depth-per-hour in this angle)

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-10 | `error_events` migration: `incident_ref`, `fingerprint`, `occurrence_count`, `trace_id`, `agent_run_id`, `audit_kind`, `audit_id`, `status` | `supabase/migrations/` | BUILD |
| T-11 | Upsert-on-fingerprint; storm guard counts instead of dropping; return `IncidentRef` | `src/lib/observability/errors.ts:37-44, 67-97` | WIRING |
| T-12 | Pass `traceId` (already in scope) into the capture | `src/lib/ai/runtime.server.ts:1901` | WIRING, one line |
| T-13 | Add `{ kind: "incident", prefix: "INC", table: "error_events", ... }` | `src/lib/audit-id.ts:44` | WIRING, one line |
| T-14 | Render the ref on the branded error page | `src/server.ts:201` | BUILD |
| T-15 | Ask resolves `INC·XXXXXX` -> `error_events` -> `getTrace` (parsing already works) | depth-B's Ask tool registry | WIRING |

### Phase 3 · Emit the taxonomy

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-16 | `agent_action_proposed` at the approval write | `src/lib/ai/loop.server.ts:1137` | WIRING |
| T-17 | `agent_action_decided` with **`in_conversation`** | `src/lib/approvals-queue.functions.ts:718` (`decideApprovalItem`), `:824` (`snooze`), `:885` (`sendBack`) | WIRING |
| T-18 | `agent_action_executed` / `_reverted` | `tool_calls` write path, `src/lib/studio-rollbacks.ts:318` | WIRING |
| T-19 | `spec_shipped` | `src/lib/deployments.functions.ts:141` (`promoteToProduction`) | WIRING |
| T-20 | `outcome_recorded` + `loop_closed` | `src/lib/outcome.functions.ts:180` (`recordOutcome`) | WIRING |
| T-21 | `forecast_made` / `forecast_resolved` | `src/lib/brain/calibrate-insights.server.ts:195` | WIRING |
| T-22 | `precedent_surfaced` / `precedent_acted_on` | RAG recall path + `memory_recall_log` writer | WIRING |
| T-23 | `lineage_opened`, `lineage_traversed`, `trace_opened`, `why_asked`, **`evidence_dead_end`** | `src/components/supaprod/AuditLineageSheet.tsx`, `src/routes/_authenticated.traces.$traceId.tsx`, depth-A's resolver | WIRING, **depends on depth-A** |
| T-24 | Fire the two missing decision events beside the existing stage write | `src/lib/decisions.functions.ts:207` | WIRING, two lines |

### Phase 4 · The loop

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-25 | `UsageSignal` + `usageProposal()` + the seven named thresholds | `src/lib/self-improve.ts` | BUILD |
| T-26 | `readUsageSignals()`; add to the `Promise.all` | `src/lib/self-improve.functions.ts` | WIRING |
| T-27 | Rules U-1 (dead ends) and U-3 (incomplete loop) | in T-25 | BUILD |
| T-28 | Rule U-2, **proposal only for promotions, auto-apply for demotions** | in T-25 + a demotion applier | BUILD |
| T-29 | Rule U-5, memory contradiction retirement proposals | in T-25 | BUILD |
| T-30 | Rule U-4, arithmetic forecast resolution; `judged_by` | `src/lib/brain/calibrate-insights.server.ts:49-90` | BUILD |
| T-31 | Repoint `autoAdjustIce` at first-party rollups; `posthog_event` -> `measure_event` | `src/lib/ice-adjust.server.ts:41`, migration | WIRING |
| T-32 | Daily rollup job + `usage_events` retention; add to `EXPECTED_JOBS` | new `usage-rollup-tick.ts`, `src/lib/observability/jobs.ts:26` | BUILD |

### Phase 5 · Surfaces and honesty

| # | Task | Where | Type |
| --- | --- | --- | --- |
| T-33 | `/settings/telemetry`: every kind, the last 50 rows verbatim, mode control, export, delete | new route | BUILD |
| T-34 | `forget(userId)` + wire into account deletion | `src/lib/observability/` + auth path | BUILD |
| T-35 | Rename "Autonomy ratio" -> "Work the loop carried" everywhere | `gauntlet.functions.ts` consumers | WIRING |
| T-36 | Add Time-to-evidence (with unanswered rate) and Loop completeness to the compounding strip | `src/components/knowledge/GraphCompoundingStrip.tsx` | BUILD |
| T-37 | Register PostHog + Sentry as sub-processors with `region: "EU"`; assert `.de.sentry.io` on the DSN | `src/lib/compliance/subprocessors.ts` | BUILD |
| T-38 | Decide `landing_events` session key: non-persisted, or ship a banner | `src/lib/landing.functions.ts:100` | BUILD |
| T-39 | Fix the facade contract doc: delete `pageView`/`captureMessage`/`setUser`/`setTag`, add the real exports | `docs/features/observability-facade.md` | WIRING |

**Then, and only then:** add `POSTHOG_API_KEY` and `SENTRY_DSN`, flip `admin_set_observability_enabled(true)`.

---

## 8. Hand-off

### To depth-A (audit / trace / lineage)

1. **T-23 depends on you.** `evidence_dead_end` can only fire from a resolver that knows it found nothing. Whatever function answers "why did we decide this" must return a discriminated result, `{ found, nodes }` or `{ empty, missing_relation, stage }`, not an empty array. **An empty array is indistinguishable from a real absence and it is the most valuable telemetry in this document.** Please shape the return type that way.
2. **Please add `usage_event` to `GRAPH_NODE_KINDS`** (`src/lib/knowledge-graph-view.ts`). `usage_events` carries `audit_kind` + `audit_id` + `trace_id` specifically so attention becomes a dimmed, optional layer on your graph: who looked at this decision, when, and what ran next.
3. **`incident` joins `AUDIT_KINDS`** (T-13). Your `AuditLineageSheet` will render it with no change because everything downstream of the prefix map is pure. An incident should appear as a node on the trace it belongs to.
4. Your `ARTIFACT_KINDS` gap (`lineage.functions.ts:7`, missing `changeset` / `deployment` / `outcome` / `learning` / `belief`) is what rules **U-1 and U-3** are built to detect and report. Once you close it, those rules become the regression alarm that stops it reopening.

### To depth-B (agentic Ask)

1. **`in_conversation` on `agent_action_decided` is your success metric,** and it is structurally `false` today: `src/routes/api/chat.ts` has zero references to `agent_approvals`. Wire T-16 and T-17 **before** you land the in-chat approval card so a real baseline exists. Otherwise the improvement is unmeasurable and the claim is unprovable.
2. **T-15 is a small, high-value Ask tool for you.** `findAuditIds` (`audit-id.ts:108`) already parses `INC·7F2A19` out of free text. One registry tool that resolves an incident ref to its `error_events` row and its trace gives you "what happened with INC·7F2A19" for almost nothing, and it is a superb demo moment.
3. **Rule U-2 must never mutate `resolveToolMode` on its own for promotions.** If your Ask surface renders self-improvement proposals, the promotion card is an explicit human gate, worded so the person knows they are widening what the loop may do unattended. Demotions may apply themselves. Please do not let a promotion path slip in as a convenience.
4. Ask should be able to answer "how is Supaprod doing" from `usage_rollup_daily` and the gauntlet functions, honoring every `null` and `tableReady: false` as "not measured yet". Do not let the model round a null to a number.

### The one thing to tell the founder

The plumbing he thinks is running has never received an event, and the thing he thinks is powering the graph is on his laptop, not in the product. Both are cheap to correct. What is not cheap, and what should be corrected first, is that the one place where a vendor already feeds the product loop feeds it other tenants' data. Fix that, invert the relationship so the ledger is ours and the vendor is a lens, and the payoff is the part he actually asked for: a product that watches its own evidence layer fail, counts the failures, and tells him which link is missing, in the same self-improvement queue it already runs 37 crons to fill.
