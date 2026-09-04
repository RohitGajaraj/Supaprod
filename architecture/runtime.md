# architecture/runtime.md — The AI chokepoint contract

> _Created: 2026-06-03 · Last updated: 2026-08-20_

> **Corrected 2026-08-20 against the code, in three places, because this is the file a new agent reads to learn the call path and each one taught something false.**
>
> 1. **`ai_traces` does not exist and never did.** Zero occurrences in `src/**` and `supabase/migrations/**`. Spans are two columns on `ai_events`.
> 2. **The `surface` list named two literals that are not in the union and omitted four that are.** That is the most load-bearing line in the file: a new AI surface needs a valid `CallSurface` literal, and this list was where an author would look for one.
> 3. **The cron-hook list named six hooks, one of which (`agent-tick`) does not exist, out of 38 that do.**

> Every AI call in Cadence goes through one function. This file is its contract. Rules: [`AGENTS.md`](../docs/archive/agent-operating-manual.md). Build history: [`docs/planning/archive/build-log.md`](../docs/planning/archive/build-log.md).

## The one rule

**Every model call goes through `src/lib/ai/runtime.server.ts`. There is no second path.** Agents, chat, copilot, PRD `/ai`, discovery, studio, daily brief, the judge itself, embeddings — all of it. This is what makes telemetry, safety, cost control, RAG, guardrails, and replay uniform across every surface for free.

## The entry point

```
callModel({ surface, traceId, parentEventId, model, messages, tools?, retrieval?, userId, workspaceId?, runId? })
  -> { text, tool_calls, usage, latency_ms, ttft_ms }
```

`surface` is one of the known surfaces. **The union is declared at `src/lib/ai/runtime.server.ts:350` and that declaration is the contract — read it there rather than trusting this list, which has already drifted once.** As of 2026-08-20 it holds fourteen literals:

```
agent · chat · copilot · prd · discovery · studio · brief
eval · judge · embed · scheduler · sense · decision · test
```

**`mcp_server` and `a2a` are not among them.** An earlier version of this file named both, and neither has ever existed in the union, so an author following this line would have failed to compile. `scheduler`, `sense`, `decision` and `test` are real and were missing: `decision` was added 2026-07-11 when the decision-record tool landed without extending the union, which is the same failure in the other direction and is why the literal is required to live in the exported type.

It drives per-surface defaults, color coding ([`docs/design/archive/ember-editorial-landing.md`](../docs/design/archive/ember-editorial-landing.md)), and analytics filters. `workspaceId` scopes the kill-switch check; `runId` ties the call to an `agent_runs` row for per-mission token/spend caps and atomic usage accounting.

## The pipeline (in order)

0. **Governance halt check** — `current_kill_state(workspaceId)` is read first. If `system_paused` or `workspace_paused`, throw a typed `GovernanceHaltError('kill_switch')` _before any spend_. If `runId` is set, read `agent_runs` and throw `GovernanceHaltError('mission_token_cap' | 'mission_spend_cap')` when the running totals already meet/exceed the cap, or `'kill_switch'` if the run was previously halted. On halt: log an `ai_events` row with `status='blocked'` and `error_message='governance_halt:<kind> — <msg>'`, and call `halt_agent_run()` so the mission is marked halted. **Caps and pause are sacred — see [`security.md`](./security.md).**
1. **Budget check** — if the user is over their daily/monthly cap, throw a friendly error _before any spend_. Caps are sacred.
2. **Cache lookup** — exact (`request_hash`) + near-dupe (embedding similarity). Cache key is salted with `user_id` + `workspace_id` + `surface` to prevent cross-user leakage. Cache hits are still logged (`cache_hit=true`).
3. **Pre-guardrails** — PII / prompt-injection / secret / keyword on input. `block` aborts, `redact` rewrites before the provider sees it, `warn` logs. Writes `guardrail_hits`.
4. **Retrieval (optional)** — if `retrieval=true`, embed the prompt, fetch top-k `rag_chunks` for the user, inject as a `CONTEXT:` block. See [`data.md`](./data.md).

   **PRD generation (Scribe) bypasses this flag** and calls `retrieve()` directly so it can persist the citation list onto `prds.citations` (caller-side retrieval, model still cites inline as `[n]`). See [`../docs/features/prd-rag-citations.md`](../docs/features/prd-rag-citations.md).

5. **Provider call** — gateway by default; BYO key if the user has a matching one AND is on the enterprise tier (WM-M9: every other tier is credits-only self-serve, routed through the platform's own keys). Capture tokens, latency, ttft. Provider adapters normalize to the uniform return shape.
6. **Post-guardrails** — toxicity / leaked-system-prompt / output PII. Groundedness-below-threshold flags a contradiction with retrieved context.
7. **Persist + usage** — write `ai_events` (+ `tool_calls`). **The span tree is two columns on `ai_events`, `trace_id` and `parent_event_id`, and there is no separate span table.** An earlier version of this line said the row was linked "into the `ai_traces` span tree"; `ai_traces` has zero occurrences in `src/**` and in `supabase/migrations/**`, so it is a table that was designed and never built. `trace_id` correlates every call inside one `runAgentLoop` invocation and `parent_event_id` links a child call to its parent, which is the whole mechanism. `/traces` reads it, and so does the trust score's eval leg, by joining `ai_evals.event_id` to `ai_events.id`. On a successful, non-blocked call, increment per-user/per-surface budgets **and** call `record_mission_usage(runId, tokens, cost_usd)` to atomically bump `agent_runs.tokens_used` and `spend_used_usd`. The next call in the same mission sees the bump and can be halted by the cap check above.
8. **Async eval** — queue the event for the LLM-as-judge (`/api/public/hooks/eval-tick`).
9. **Retry / fallback** — on 429/5xx, backoff retry; if still failing, fall back to a configured backup model and record `fallback=true`.

## Provider adapters

Lovable/AI gateway (default, no user key) and BYO adapters (Anthropic, DeepSeek, Grok, Ollama, OpenAI-compatible). Each normalizes request/response and surfaces `{ text, tool_calls, usage, latency_ms, ttft_ms }`. Cadence is **model-agnostic by contract** — adding a provider means adding an adapter, not touching call sites. This is also the moat lever: the model is an input, never the product ([`README.md`](../README.md)).

**Local-dev gateway fallback (2026-06-11, KI-06).** The cloud injects `LOVABLE_API_KEY`; a local `.env` may not have it. `resolveGateway()` in `runtime.server.ts` routes `google/*` models directly to Google's OpenAI-compatible endpoint using `GEMINI_API_KEY` (free key from [AI Studio](https://aistudio.google.com)) **only when the Lovable key is absent** — cloud behavior is unchanged, and non-`google/*` models still require the Lovable gateway or a BYO key. Covers both `callModel` and `callModelStream`; embeddings (`src/lib/rag/embed.server.ts`) remain Lovable-gateway-only.

## The agent loop

`src/lib/ai/loop.server.ts`: `plan → tool calls → observe → reflect → answer`, with max-step and max-cost caps. Tools are server-validated against the agent's allow-list and every call logs to `tool_calls`. Side-effect tools honor the agent's `approval_mode` (`auto | confirm | review`). Any trace can be replayed against a different model/prompt version.

## Cost & pricing

`model_pricing` (in/out per Mtok) drives cost math (`src/lib/ai/pricing.ts`); hand-maintained, update when providers change pricing. Budgets enforced server-side; per-surface and per-agent cost surface in `/analytics`.

## Invariants (do not break)

- No direct provider calls outside the chokepoint.
- Judge/eval/embedding calls also flow through it (`surface='judge'|'eval'|'embed'`) so they are measured too.
- Cron-poked endpoints live under `/api/public/hooks/*`. **There are 38 of them, not the six an earlier version of this line listed, and `agent-tick` was one of the six and does not exist** (zero occurrences in `src/**` and `supabase/migrations/**`). The list is not reproduced here, because a list of 38 in a contract file is a list that goes stale: `ls src/routes/api/public/hooks/` is the answer, and the schedule for each is the `cron.schedule` call in the migration that registered it. The ones that carry the loop are `resume-runs` (every minute) and `track-tick` (every 10 minutes); see [`orchestration.md`](./orchestration.md) for what each drives.
- Trace IDs are time-sortable (UUIDv7).
- Eval failure (≥10-point regression on a "Cadence core" case, 0–100 scale — KI-14) is a deploy gate; drift is a passive watcher.
- Both `callModel()` and `callModelStream()` enforce the governance halt check identically. Streaming halts emit a `status='blocked'` event before the SSE stream is ever opened.

Change anything here and update this file + [`docs/planning/archive/build-log.md`](../docs/planning/archive/build-log.md) (see [`AGENTS.md`](../docs/archive/agent-operating-manual.md), section 5).

## Observability hooks (AFD, planned · founder-gated)

When the [AFD initiative](../docs/planning/initiatives/analytics-and-failure-detection-plan.md) ships, the chokepoint gains two side-effects per call (both behind the `src/lib/observability/` façade, both no-op without env / when `observabilityEnabled()=false`):

- `track('agent_run_finished', { surface, model, latency_ms, cost_usd, status })` → PostHog (AFD-04).
- `agent_runs.failure_kind` is written from a typed taxonomy on every error path (AFD-06).

The cron hooks gain a `withJobRun(name, fn)` wrapper (AFD-07) that records to a new `job_runs` table and fires a Better Stack heartbeat on success (AFD-08). Façade contract: [`../docs/features/observability-facade.md`](../docs/features/observability-facade.md). Vendor SDKs are NEVER imported outside `src/lib/observability/`.
