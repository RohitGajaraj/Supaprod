/**
 * One chokepoint for every AI call in Supaprod.
 * - Loads + applies guardrails (input + output)
 * - Routes to Lovable AI Gateway or BYO provider
 * - Captures tokens/cost/latency/status
 * - Persists ai_events + guardrail_hits
 * - Enforces (lightweight) per-user daily/monthly budgets
 * - Returns { output, eventId, hits, blocked }
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  maxAttemptsFor,
  nextRetryDelayMs,
  parseRetryAfterMs,
  rateLimitBudgetMs,
} from "./retry-policy";
import { estimateCostUsd, creditsForCost, projectCallCredits } from "./pricing";
import { costRoutedModel, cheapestLiveModel } from "./routing";
import { resolveFallbackChain } from "./fallback";
import { activeModelId, type Capability, type Model } from "./models";
import { providerRoute, splitModelId } from "./provider-route";
import { resolvePlatformProviderKey, isPlatformProviderConfigured } from "./platform-keys.server";
import { capabilityRoutedModel } from "./capability";
import { assertSafeBaseUrl } from "../url-safety";
import {
  capExceeded,
  creditWindowStartIso,
  sumDebitCredits,
  type LedgerDebitRow,
} from "../credits.functions";
import {
  isChargeableSurface,
  isAmbientSurface,
  isMoatSurfaceLockedToManaged,
  byokFeeUsd,
  BYOK_FEE_PCT,
  withinBoundedOverage,
} from "./credit-policy";
import { supabaseAdmin } from "../../integrations/supabase/client.server";
import { evaluateGuardrails, type GuardrailRule } from "./guardrails.server";
import { withFloor } from "./guardrail-floor";
import { retrieve, formatContextBlock, type RetrievedChunk } from "../rag/retriever.server";
import { resolvePrompt, logPromptRun, withHumanizeDirective } from "./prompts.server";
import { humanizeText, isFenceOpen } from "./humanize";
import { entitlementsFor, normalizePlanTier } from "../entitlements";
// AFD-04, the refusal half. Telemetry only: these fill ai_events.error_code
// (a column that has existed since the first schema and was written by nothing)
// and forward a refusal, never a completed call, to the product-analytics
// facade. No AI behaviour reads them. See ../observability/gates.ts.
import { GATE_CODES, classifyFailureCode, noteGate, type GateCode } from "../observability/gates";

import {
  generateCacheKey,
  shouldCacheCall,
  formatCachedResponse,
  cacheTtlSeconds,
  readCache,
  writeCache,
  type CacheEntry,
} from "./cache.server";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
// Local-dev fallback (KI-06): the cloud injects LOVABLE_API_KEY automatically,
// but a local .env may not have it. When it is absent, google/* models route
// directly to Google's OpenAI-compatible endpoint using GEMINI_API_KEY
// (free key: https://aistudio.google.com). The Lovable gateway always wins
// when its key exists, so cloud behavior is unchanged.
const GOOGLE_OPENAI_GATEWAY =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// A single non-streaming model call (callAnthropic / callOpenAICompat / callGateway,
// invoked from callModel's attempt()) had no client-side timeout: a hung, slow, or
// rate-limited provider left the fetch pending forever, which froze a mission's
// in-progress step ("step N/7 reasoning") with no error, no retry, and no recovery -
// the KI-07 fail-mark in loop.server.ts never ran because nothing ever threw. 90s
// gives room for a legitimately slow generation over a large prompt (a full ARD/contract
// plus tool descriptions can be several thousand tokens) while still bounding a step to a
// duration a human waiting on "reasoning..." will tolerate before something visibly happens.
const MODEL_CALL_TIMEOUT_MS = 90_000;

// Mask API-key-shaped tokens out of a provider error body before it is thrown (and later
// persisted into ai_events.error_message). A 401/4xx body can echo back the caller's own key
// prefix; this keeps even that out of stored telemetry. Conservative: only known key shapes.
function maskKeyLike(s: string): string {
  return s
    .replace(/\b(sk-ant|sk|xai|gsk|ghp|pk|AIza)[-_]?[A-Za-z0-9_-]{6,}/g, "$1-***")
    .replace(/(api[_-]?key["':\s]+)[A-Za-z0-9_-]{8,}/gi, "$1***");
}

function resolveGateway(model: string): { url: string; key: string; model: string } {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) return { url: GATEWAY, key: lovableKey, model };
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && model.startsWith("google/")) {
    return { url: GOOGLE_OPENAI_GATEWAY, key: geminiKey, model: model.slice("google/".length) };
  }
  throw new Error(
    geminiKey
      ? `AI is not configured for "${model}" (GEMINI_API_KEY only covers google/* models; set LOVABLE_API_KEY).`
      : "AI is not configured (missing LOVABLE_API_KEY; for local dev, set GEMINI_API_KEY to route google/* models directly).",
  );
}

// WM-M15: cost-aware routing is opt-in via the AI_COST_ROUTING env flag (default OFF, so
// the chokepoint is byte-identical to today until the founder enables it). When on, a
// routine surface's call may be routed to a cheaper model (see routing.ts; hard surfaces
// are never downgraded). Read per call (cheap string compare); no caching needed.
function costRoutingEnabled(): boolean {
  const v = process.env.AI_COST_ROUTING;
  return v === "1" || v === "true";
}

// AI_CAPABILITY_ROUTING: Perplexity-style capability routing (capability.ts) is ON by
// default (founder ruling — the platform optimizes every internal AI action AND the
// consumer "Auto" mode to the best model for the task). Set to "off"/"0"/"false" to disable
// (then behavior is byte-identical to pinned-model routing). It NEVER overrides an explicit,
// capable consumer model pick; eval + judge are always excluded (benchmark integrity).
function capabilityRoutingEnabled(): boolean {
  const v = (process.env.AI_CAPABILITY_ROUTING ?? "").toLowerCase();
  return v !== "off" && v !== "0" && v !== "false";
}

// A model is reachable when it is gateway-live OR the platform operator has configured a key
// for its provider (AI_PROVIDER_<P>_KEY). Used to keep capability routing to callable models.
//
// "GATEWAY-LIVE" IS A CLAIM ABOUT THE GATEWAY, so it is only true when there is a gateway.
// `resolveGateway` has two modes: with LOVABLE_API_KEY every `live` model is reachable, and
// without it only `google/*` is, via the GEMINI_API_KEY local-dev route. This predicate
// asserted the first unconditionally, so on a machine with GEMINI_API_KEY and no
// LOVABLE_API_KEY, Auto mode would resolve "reasoning" to `openai/gpt-5` (live: true) and
// `resolveGateway` would then throw "AI is not configured for openai/gpt-5". Auto picked a
// model the runtime had already decided it could not call.
//
// Read per call, like every other env flag here, so a key added to .env takes effect on the
// next request rather than at process start. In the deployed Worker LOVABLE_API_KEY is always
// injected, so this branch is a no-op there and behaviour is unchanged.
function modelAvailability(): (m: Model) => boolean {
  const gatewayCarriesEveryLiveModel = !!process.env.LOVABLE_API_KEY;
  return (m) => {
    if (isPlatformProviderConfigured(m.provider)) return true;
    if (!m.live) return false;
    return gatewayCarriesEveryLiveModel || m.provider === "google";
  };
}

// PROVIDER-FALLBACK: an opt-in (AI_PROVIDER_FALLBACK, default OFF) cross-model degrade. When
// off, the chokepoint is byte-identical to today (only an explicit fallbackModel/fallbackModels
// is tried after the primary). When on, a failed primary also degrades to the cheapest live
// model on most surfaces (eval + embed are excluded, see callModel/callModelStream). Read per
// call (cheap string compare); the fallback path only runs once the primary has hard-failed.
function providerFallbackEnabled(): boolean {
  const v = process.env.AI_PROVIDER_FALLBACK;
  return v === "1" || v === "true";
}

// Some providers (observed with Qwen/DashScope) don't reliably honor a "no markdown
// fences" instruction even under responseFormat=json_object, unlike Gemini/OpenAI which
// always return bare JSON. Strip a wrapping ```/```json fence before giving up, so a
// caller-model choice doesn't change JSON-mode reliability for every call site that uses it.
function parseModelJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (!fenced) return undefined;
    try {
      return JSON.parse(fenced[1]);
    } catch {
      return undefined;
    }
  }
}

/**
 * Governance halt — thrown by the chokepoint when a kill-switch is engaged
 * or a per-mission cap would be exceeded. Surfaced as status='blocked' in
 * ai_events with error_message='governance_halt: <reason>'.
 */
export class GovernanceHaltError extends Error {
  readonly code = "GOVERNANCE_HALT";
  readonly kind: "kill_switch" | "mission_token_cap" | "mission_spend_cap";
  constructor(kind: GovernanceHaltError["kind"], message: string) {
    super(message);
    this.name = "GovernanceHaltError";
    this.kind = kind;
  }
}

async function checkKillSwitch(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("current_kill_state", {
      ws: (workspaceId ?? null) as unknown as string,
    });
    if (error) {
      console.error("current_kill_state failed:", error);
      return;
    }
    const row = Array.isArray(data)
      ? (data[0] as
          | { system_paused?: boolean; workspace_paused?: boolean; reason?: string | null }
          | undefined)
      : (data as {
          system_paused?: boolean;
          workspace_paused?: boolean;
          reason?: string | null;
        } | null);
    if (!row) return;
    if (row.system_paused) {
      throw new GovernanceHaltError(
        "kill_switch",
        `System paused${row.reason ? `: ${row.reason}` : ""}`,
      );
    }
    if (row.workspace_paused) {
      throw new GovernanceHaltError(
        "kill_switch",
        `Workspace paused${row.reason ? `: ${row.reason}` : ""}`,
      );
    }
  } catch (e) {
    if (e instanceof GovernanceHaltError) throw e;
    console.error("kill-switch check failed (allowing call):", e);
  }
}

async function checkMissionCaps(
  supabase: SupabaseClient,
  runId: string | null | undefined,
): Promise<void> {
  if (!runId) return;
  // mission_cap_state returns the run's caps AND the totals summed across every
  // run in the same mission, in one round trip because this runs before every
  // model call. It replaced a plain select on agent_runs that compared the cap
  // against THIS RUN's spend only: `mission_spend_cap_usd` sits on agent_runs
  // and record_mission_usage credits one run, so a ten hop mission got ten
  // separate ceilings and could spend ten times the cap with every individual
  // check passing. The column was a per-run ceiling wearing a mission name.
  const { data, error } = await supabase.rpc("mission_cap_state", { _run_id: runId });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return;
  const r = row as {
    mission_spend_cap_usd: number | null;
    mission_token_cap: number | null;
    tokens_used: number | null;
    spend_used_usd: number | null;
    halted_reason: string | null;
    status: string;
    mission_spend_total_usd: number | null;
    mission_token_total: number | null;
  };
  if (r.status === "halted" || r.halted_reason) {
    throw new GovernanceHaltError(
      "kill_switch",
      `Mission halted${r.halted_reason ? `: ${r.halted_reason}` : ""}`,
    );
  }
  const tokensSoFar = Number(r.mission_token_total ?? r.tokens_used ?? 0);
  if (r.mission_token_cap != null && tokensSoFar >= Number(r.mission_token_cap)) {
    throw new GovernanceHaltError(
      "mission_token_cap",
      `Mission token cap reached (${tokensSoFar}/${r.mission_token_cap})`,
    );
  }
  const spentSoFar = Number(r.mission_spend_total_usd ?? r.spend_used_usd ?? 0);
  if (r.mission_spend_cap_usd != null && spentSoFar >= Number(r.mission_spend_cap_usd)) {
    throw new GovernanceHaltError(
      "mission_spend_cap",
      `Mission spend cap reached ($${spentSoFar.toFixed(4)}/$${Number(r.mission_spend_cap_usd).toFixed(4)})`,
    );
  }
}

async function recordMissionUsage(
  supabase: SupabaseClient,
  runId: string | null | undefined,
  tokens: number,
  costUsd: number,
): Promise<void> {
  if (!runId) return;
  try {
    await supabase.rpc("record_mission_usage", {
      _run_id: runId,
      _tokens: tokens,
      _cost_usd: costUsd,
    });
  } catch (e) {
    console.error("record_mission_usage failed:", e);
  }
}

async function logGovernanceHalt(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  err: GovernanceHaltError,
): Promise<void> {
  try {
    await supabase.from("ai_events").insert({
      user_id: userId,
      trace_id: opts.traceId ?? null,
      parent_event_id: opts.parentEventId ?? null,
      surface: opts.surface,
      surface_ref: opts.surface_ref ?? null,
      // ai_events.workspace_id defaults to current_user_default_workspace(), which resolves
      // via auth.uid(), NULL for a service-role caller (a cron tick), so the default used to
      // throw (cascading into a NOT NULL violation on accounts.owner_id) and this insert was
      // silently swallowed by the catch below on every cron-driven halt. Pass the workspace we
      // already have explicitly so the DEFAULT (only correct for a real user session) is never
      // relied on here; omit the key when null so that path is unaffected.
      ...(opts.workspaceId ? { workspace_id: opts.workspaceId } : {}),
      provider: "governance",
      via: "gateway",
      model: opts.model,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      est_cost_usd: 0,
      latency_ms: 0,
      status: "blocked",
      // AFD-04: the typed half of the same fact. error_message stays the human
      // sentence; error_code is what "which gate stops the most work" groups by.
      error_code: GATE_CODES[err.kind],
      error_message: `governance_halt:${err.kind}: ${err.message}`,
      input_preview: (opts.messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
      system_preview: (opts.messages.find((m) => m.role === "system")?.content ?? "").slice(
        0,
        4000,
      ),
      output_preview: "",
    });
  } catch (e) {
    console.error("governance_halt event insert failed:", e);
  }
  // AFD-04 vendor forward. Fire and forget, no-op with no PostHog key.
  void noteGate(GATE_CODES[err.kind], {
    userId,
    surface: opts.surface,
    model: opts.model,
    workspaceId: opts.workspaceId ?? null,
    runId: opts.runId ?? null,
  });
  if (opts.runId) {
    try {
      await supabase.rpc("halt_agent_run", {
        _run_id: opts.runId,
        _reason: `${err.kind}: ${err.message}`,
      });
    } catch (e) {
      console.error("halt_agent_run failed:", e);
    }
  }
}

export type CallSurface =
  | "agent"
  | "chat"
  | "copilot"
  | "prd"
  | "discovery"
  | "studio"
  | "brief"
  | "eval"
  | "judge"
  | "embed"
  | "scheduler"
  | "sense"
  // Decision-record work (rationale revision via the registry tool); its own
  // cost bucket, added 2026-07-11 when the tool landed without extending
  // this union (the chokepoint contract requires the literal to live here).
  | "decision"
  | "test";

export type CallOpts = {
  surface: CallSurface;
  surface_ref?: string | null;
  model: string;
  messages: { role: string; content: string }[];
  traceId?: string | null;
  parentEventId?: string | null;
  /** Workspace the call belongs to — required for kill-switch check (skipped when null). */
  workspaceId?: string | null;
  /** When set, ties the call to an agent_runs row for per-mission caps + usage accounting. */
  runId?: string | null;
  /**
   * Product the call is attributed to (WM-M14 per-product credit attribution + caps).
   * Null / omitted = unattributed (the account-pool default). Threaded into the credit
   * ledger debit + the per-product cap check; inert only where credits_enabled() is off,
   * which production is not (live since 2026-08-03).
   *
   * Fed today only by the product-scoped paths (discovery clustering). Most call sites
   * leave it null, so their spend attributes to the account pool (per-MEMBER attribution,
   * keyed on userId, is always driven); product-scoped sites adopt this field over time.
   * INVARIANT: only pass a server-derived productId that belongs to this call's account
   * (never a raw user-supplied id), or a member could dodge a per-product cap / mis-tag
   * another product's spend.
   */
  productId?: string | null;
  /** Whether to run guardrails (default true, false for internal judge/eval) */
  guardrails?: boolean;
  /** Optional override of LOVABLE_API_KEY (e.g. when test-running a BYO key) */
  byoOverride?: { provider: string; apiKey: string; baseUrl?: string };
  /** Ask provider for strict JSON */
  responseFormat?: "json_object";
  /**
   * AGT-01 - native structured-output tool-calling. When set, passed to the
   * provider as its own tool/function-calling definitions instead of (or
   * alongside) a text-described tool list; a response then arrives as
   * structured tool_use/function_call blocks rather than JSON-in-text.
   * Additive and optional: every existing caller is unaffected.
   */
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[];
  /** Model to retry with if primary fails after retries (legacy single fallback). */
  fallbackModel?: string;
  /** Ordered fallback chain tried after the primary fails (PROVIDER-FALLBACK). Takes
   *  precedence over fallbackModel; the runtime may append a flag-gated auto-fallback. */
  fallbackModels?: string[];
  /** Max retries on 429/5xx for the primary model (default 2) */
  maxRetries?: number;
  /** Total ms this call may spend WAITING on rate limits, excluding the requests
   *  themselves. Defaults per surface: a background tick can sit out a per-minute
   *  window, a person watching a stream cannot. See `retry-policy.ts`. */
  retryBudgetMs?: number;
  /** When true, retrieve relevant chunks from rag_chunks and prepend as system context */
  retrieval?: boolean | { k?: number; sourceKinds?: string[] };
  /** When set, resolve a prompt template (surface, key) and prepend its system prompt. */
  promptKey?: string;
  /**
   * Capability hint for Perplexity-style routing (capability.ts). When set (or when
   * model === "auto"), the chokepoint routes to the model best at this task instead of
   * the passed `model`. Internal system surfaces (agent/brief/discovery/scheduler) route
   * by their default capability even without this. Ignored for eval/judge.
   */
  task?: Capability;
  /** Optional AbortSignal for cancelling the request (e.g., when client disconnects) */
  signal?: AbortSignal;
  /**
   * Optional cross-call cache for key resolution. When provided, reused across multiple
   * callModel invocations (e.g., across steps in an agent loop) to avoid re-deriving BYOK
   * eligibility and reloading vault keys for the same provider. If not provided, a fresh
   * cache is created for each call (backwards compatible).
   */
  keyResolutionCache?: KeyResolutionCache;
};

export type CallResult = {
  output: string;
  eventId: string | null;
  status: "ok" | "error" | "blocked";
  hits: { rule_name: string; side: "input" | "output"; action: string }[];
  via: "gateway" | "byo" | "cache";
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  /**
   * Input tokens the provider served from its own cache, as IT reported them. A subset
   * of prompt_tokens. 0 when the provider reports no cache field. Exposed so a caller
   * can explain a cost rather than only quote one.
   */
  cached_tokens?: number;
  est_cost_usd: number;
  latency_ms: number;
  error?: string;
  fallback?: boolean;
  /** Parsed JSON when responseFormat=json_object (best-effort) */
  json?: unknown;
  /** AGT-01 - structured tool calls the provider returned, when opts.tools was set. */
  toolCalls?: { id: string; name: string; args: unknown }[];
  /** Chunks injected as context (when retrieval enabled) */
  citations?: {
    id: string;
    source_kind: string;
    source_id: string | null;
    title: string | null;
    chunk_index: number;
    similarity: number;
  }[];
};

/**
 * WM-M9: bring-your-own AI keys are enterprise-only; every other tier is
 * credits-only self-serve (model-agnostic provider routing still happens, but
 * always through the platform's own keys). Resolves the SAME account
 * `resolveCreditAccountId` already uses (the workspace's account, else the
 * user's default account), so this can never disagree with which pool credits
 * draw from. Fails to `false` (deny BYOK) on any error, the safe default when
 * gating a retired capability, deliberately the opposite of this file's
 * "never strand a call" fail-open convention used for budgets/guardrails.
 */
async function byokAllowedForCall(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null | undefined,
): Promise<boolean> {
  try {
    const accountId = await resolveCreditAccountId(supabase, userId, workspaceId);
    if (!accountId) return false;
    const { data } = await supabase
      .from("accounts")
      .select("plan_tier")
      .eq("id", accountId)
      .maybeSingle();
    const tier = normalizePlanTier((data as { plan_tier?: unknown } | null)?.plan_tier);
    return entitlementsFor(tier).byokAllowed;
  } catch {
    return false;
  }
}

/**
 * MODEL-AGNOSTIC key resolution. Resolve the credential (and its base URL) to use
 * for a model's provider, in precedence order:
 *   1. byoOverride       — the Settings "Test" path (a pasted, not-yet-saved key)
 *   2. user vault        — a BYO key in user_api_keys (RLS-scoped, enterprise tier only)
 *   3. platform env      — the platform operator's own key (AI_PROVIDER_<P>_KEY)
 * Returns null when none is configured → the caller uses the managed gateway.
 *
 * Resolving per-attempt-model (rather than once for the primary) means a cross-provider
 * fallback uses the RIGHT key for the model it actually tries.
 *
 * G-PRICE PR-C1: `surface` gates the vault-key branch (step 2) — a moat surface
 * (judge/eval/decision) never resolves to an enterprise's BYOK vault key, so it always
 * stays on Supaprod's own managed models (pricing-architecture §5's "approved-model
 * lists" default). The byoOverride test path and the platform's own key are unaffected.
 */
/**
 * In-call cache for provider key resolution. Populated on first call for a
 * (userId, workspaceId, surface) tuple and reused for subsequent calls (e.g.,
 * during retries or fallback chain traversal). Prevents re-deriving BYOK
 * eligibility and reloading keys from the vault multiple times per callModel.
 *
 * When provided via CallOpts.keyResolutionCache, the cache persists across
 * multiple callModel invocations (e.g., across loop steps), enabling cross-call
 * optimization: same-provider calls avoid re-deriving BYOK eligibility + vault reloads.
 */
export type KeyResolutionCache = {
  byokEligible?: boolean;
  keysByProvider?: Map<
    string,
    { apiKey: string; baseUrl: string | null; source: "vault" | "platform" }
  >;
};

async function resolveCallKey(
  supabase: SupabaseClient,
  userId: string,
  provider: string,
  byoOverride?: { provider: string; apiKey: string; baseUrl?: string },
  workspaceId?: string | null,
  surface?: CallSurface,
  cache?: KeyResolutionCache,
): Promise<{
  apiKey: string;
  baseUrl: string | null;
  source: "override" | "vault" | "platform";
} | null> {
  if (byoOverride) {
    return { apiKey: byoOverride.apiKey, baseUrl: byoOverride.baseUrl ?? null, source: "override" };
  }

  // Check cache for already-resolved keys for this provider
  if (cache?.keysByProvider?.has(provider)) {
    const cached = cache.keysByProvider.get(provider)!;
    return { ...cached };
  }

  // Determine BYOK eligibility once per call (cached) instead of per provider
  let byokEligible = cache?.byokEligible;
  if (byokEligible === undefined) {
    byokEligible = !surface || !isMoatSurfaceLockedToManaged(surface);
    if (cache) cache.byokEligible = byokEligible;
  }

  if (byokEligible && (await byokAllowedForCall(supabase, userId, workspaceId))) {
    const { loadBYOKey } = await import("@/lib/byokeys-vault.server");
    const vault = await loadBYOKey(supabase, userId, provider);
    if (vault?.api_key) {
      const result = { apiKey: vault.api_key, baseUrl: vault.base_url, source: "vault" as const };
      if (cache) {
        if (!cache.keysByProvider) cache.keysByProvider = new Map();
        cache.keysByProvider.set(provider, result);
      }
      return { apiKey: result.apiKey, baseUrl: result.baseUrl, source: result.source };
    }
  }

  const plat = resolvePlatformProviderKey(provider);
  if (plat) {
    const result = { apiKey: plat.apiKey, baseUrl: plat.baseUrl, source: "platform" as const };
    if (cache) {
      if (!cache.keysByProvider) cache.keysByProvider = new Map();
      cache.keysByProvider.set(provider, result);
    }
    return result;
  }
  return null;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  msgs: { role: string; content: string }[],
  url = "https://api.anthropic.com/v1/messages",
  tools?: CallOpts["tools"],
  signal?: AbortSignal,
) {
  const system = msgs.find((m) => m.role === "system")?.content ?? "";
  const rest = msgs.filter((m) => m.role !== "system");
  const t0 = Date.now();

  // Compose request signal (if provided) with timeout signal
  const timeoutSignal = AbortSignal.timeout(MODEL_CALL_TIMEOUT_MS);
  const composedSignal = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;

  const res = await fetch(url, {
    method: "POST",
    signal: composedSignal,
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      // AGT-01 (adversarial review finding): a tool_use response needs room
      // for the schema-shaped args JSON on top of any reasoning text, on top
      // of the existing 2048 budget - a cut-off mid-args is otherwise a
      // truncated tool_use.input that fails argsSchema.safeParse downstream
      // (a graceful, already-handled error path, but worth avoiding). Every
      // non-tool call keeps the exact prior 2048 budget.
      max_tokens: tools?.length ? 4096 : 2048,
      system,
      messages: rest,
      // AGT-01: Anthropic's native tool_use format. Only sent when the
      // caller opted in - every existing (non-tool) call is unaffected.
      ...(tools?.length
        ? {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.input_schema,
            })),
          }
        : {}),
    }),
  });
  const latency = Date.now() - t0;
  if (!res.ok)
    throw new Error(`Anthropic (${res.status}): ${maskKeyLike((await res.text()).slice(0, 200))}`);
  const j = (await res.json()) as {
    content?: { type?: string; text?: string; id?: string; name?: string; input?: unknown }[];
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      // Anthropic reports cache reads separately, and (unlike the OpenAI shape) these
      // are NOT included in input_tokens. Left unpriced for now: no sourced cached
      // rate is set for anthropic/* in MODEL_PRICING, so it bills at the full input
      // rate, which over-estimates rather than under-estimates.
      cache_read_input_tokens?: number;
    };
  };
  // AGT-01: a tool_use block has no `text` field, so it contributes nothing
  // to the plain-text join below by construction - extracted separately here
  // rather than dropped, which is what happened before this change (the
  // "silent data loss" risk the research phase flagged).
  const toolCalls = (j.content ?? [])
    .filter((c) => c.type === "tool_use" && c.name)
    .map((c) => ({ id: c.id ?? "", name: c.name as string, args: c.input }));
  return {
    text:
      j.content
        ?.map((c) => c.text ?? "")
        .join("")
        .trim() ?? "",
    in_tok: (j.usage?.input_tokens ?? 0) + (j.usage?.cache_read_input_tokens ?? 0),
    out_tok: j.usage?.output_tokens ?? 0,
    cached_tok: j.usage?.cache_read_input_tokens ?? 0,
    latency,
    toolCalls: toolCalls.length ? toolCalls : undefined,
  };
}

/**
 * AGT-01: OpenAI-style `tools` array shared by callOpenAICompat and
 * callGateway. Exported (alongside extractOpenAiToolCalls below) so this
 * wire-format translation is directly unit-testable without mocking fetch.
 */
export function openAiToolsPayload(tools?: CallOpts["tools"]) {
  return tools?.length
    ? {
        tools: tools.map((t) => ({
          type: "function",
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
      }
    : {};
}

/** AGT-01: extract OpenAI-style `message.tool_calls` (never read before this change). */
export function extractOpenAiToolCalls(
  toolCalls: { id?: string; function?: { name?: string; arguments?: string } }[] | undefined,
) {
  if (!toolCalls?.length) return undefined;
  const calls = toolCalls
    .filter((tc) => tc.function?.name)
    .map((tc) => {
      let args: unknown = {};
      try {
        args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        args = tc.function?.arguments ?? {};
      }
      return { id: tc.id ?? "", name: tc.function?.name as string, args };
    });
  return calls.length ? calls : undefined;
}

async function callOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  msgs: { role: string; content: string }[],
  responseFormat?: "json_object",
  tools?: CallOpts["tools"],
  signal?: AbortSignal,
) {
  const t0 = Date.now();

  // Compose request signal (if provided) with timeout signal
  const timeoutSignal = AbortSignal.timeout(MODEL_CALL_TIMEOUT_MS);
  const composedSignal = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;

  const res = await fetch(url, {
    method: "POST",
    signal: composedSignal,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: msgs,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
      ...openAiToolsPayload(tools),
    }),
  });
  const latency = Date.now() - t0;
  if (!res.ok)
    throw new Error(`Provider (${res.status}): ${maskKeyLike((await res.text()).slice(0, 200))}`);
  const j = (await res.json()) as {
    choices?: {
      message?: {
        content?: string;
        tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
      };
    }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      // Cached input the provider served from its context cache. This is a SUBSET of
      // prompt_tokens, verified live against Qwen on 2026-08-03 (2521 prompt / 2432
      // cached on a repeated prefix), so it must never be added to it.
      prompt_tokens_details?: { cached_tokens?: number };
    };
  };
  return {
    text: j.choices?.[0]?.message?.content?.trim() ?? "",
    in_tok: j.usage?.prompt_tokens ?? 0,
    out_tok: j.usage?.completion_tokens ?? 0,
    cached_tok: j.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    latency,
    toolCalls: extractOpenAiToolCalls(j.choices?.[0]?.message?.tool_calls),
  };
}

async function callGateway(
  model: string,
  msgs: { role: string; content: string }[],
  responseFormat?: "json_object",
  tools?: CallOpts["tools"],
  signal?: AbortSignal,
) {
  const gw = resolveGateway(model);
  const t0 = Date.now();

  // Compose request signal (if provided) with timeout signal
  const timeoutSignal = AbortSignal.timeout(MODEL_CALL_TIMEOUT_MS);
  const composedSignal = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;

  const res = await fetch(gw.url, {
    method: "POST",
    signal: composedSignal,
    headers: { Authorization: `Bearer ${gw.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: gw.model,
      messages: msgs,
      ...(responseFormat ? { response_format: { type: responseFormat } } : {}),
      ...openAiToolsPayload(tools),
    }),
  });
  const latency = Date.now() - t0;
  if (res.status === 429) {
    const e = new Error("AI rate limit reached. Try again in a moment.");
    (e as { code?: string }).code = "RATE_LIMIT";
    // The gateway usually says how long to wait. Nothing read this until
    // 2026-08-21, which is why three retries inside 1.2s never cleared a
    // per-minute limit. See retry-policy.ts for the measurement.
    (e as { retryAfterMs?: number | null }).retryAfterMs = parseRetryAfterMs(
      res.headers.get("retry-after"),
      Date.now(),
    );
    throw e;
  }
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Usage.");
  if (res.status >= 500) {
    const e = new Error(`AI gateway ${res.status}`);
    (e as { code?: string }).code = "SERVER_ERROR";
    throw e;
  }
  if (!res.ok)
    throw new Error(`AI gateway (${res.status}): ${maskKeyLike((await res.text()).slice(0, 200))}`);
  const j = (await res.json()) as {
    choices?: {
      message?: {
        content?: string;
        tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
      };
    }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      // Cached input the provider served from its context cache. This is a SUBSET of
      // prompt_tokens, verified live against Qwen on 2026-08-03 (2521 prompt / 2432
      // cached on a repeated prefix), so it must never be added to it.
      prompt_tokens_details?: { cached_tokens?: number };
    };
  };
  return {
    text: j.choices?.[0]?.message?.content?.trim() ?? "",
    in_tok: j.usage?.prompt_tokens ?? 0,
    out_tok: j.usage?.completion_tokens ?? 0,
    cached_tok: j.usage?.prompt_tokens_details?.cached_tokens ?? 0,
    latency,
    toolCalls: extractOpenAiToolCalls(j.choices?.[0]?.message?.tool_calls),
  };
}

/**
 * Streaming-safe wrapper around humanizeText. The sanitizer needs full context
 * for sequences that humanizeText reasons about (a fence marker `` ``` ``, an
 * inline `` `code` `` span, a dash with its neighbours, a partial multi-byte
 * char). All of those, except a fenced block, live within a single line, so the
 * safe streaming boundary is a complete line. We buffer until a newline lands,
 * humanize the completed lines as one unit (so the line has full context), and
 * emit that. A line that opens a fenced block (its backtick count is unbalanced)
 * is held until the fence closes so the block is humanized whole, never split.
 *
 * This is consistent with the non-streamed callModel path: the streamed
 * concatenation equals humanizeText(wholeText) because each emitted unit is a
 * maximal run of complete lines that contains no open construct.
 */
function createStreamHumanizer() {
  let done = ""; // text already consumed; always ends at a fence-closed newline
  let emittedLen = 0; // length of humanizeText(done) already streamed
  let tail = ""; // unconsumed text since the last consumed boundary

  return {
    /** Append a streamed piece; return humanized text for the units now complete. */
    push(piece: string): string {
      tail += piece;
      let emit = "";
      let nl: number;
      // A safe boundary is a newline that is NOT inside an open fenced block.
      // Every dash, inline span, and multi-byte char lives within one line, so
      // a complete line (or a completed fenced block) carries full context.
      while ((nl = tail.indexOf("\n")) !== -1) {
        const candidate = tail.slice(0, nl + 1);
        if (isFenceOpen(done + candidate)) break; // fence still open: wait
        done += candidate;
        tail = tail.slice(nl + 1);
        const humanized = humanizeText(done);
        emit += humanized.slice(emittedLen);
        emittedLen = humanized.length;
      }
      return emit;
    },
    /** Drain the unconsumed tail at stream end, humanized. */
    flush(): string {
      const humanized = humanizeText(done + tail);
      const out = humanized.slice(emittedLen);
      done = humanized;
      emittedLen = humanized.length;
      tail = "";
      return out;
    },
  };
}

/**
 * The rules that screen this call: the platform floor, plus whatever this
 * WORKSPACE configured on top of it.
 *
 * This used to filter `.eq("user_id", userId)`, which made screening a property
 * of who was signed in rather than of the tenant. Found 2026-08-03: an admin had
 * 27 enabled rules and a colleague in the same workspace was screened by none of
 * them, with no PII redaction, no secret block and no injection check, while the
 * Safety room showed that colleague the admin's incidents.
 *
 * Two changes, and both are needed. Workspace scope is the correct MODEL, and on
 * its own it would have made the failing workspace worse, since a workspace that
 * configured nothing would then get nothing. `withFloor` is what makes it safe:
 * personal data, credentials and injection are screened on every call in every
 * workspace, configured or not, brand new or years old. See guardrail-floor.ts.
 *
 * `workspaceId` is nullable at this seam, and a null one gets the floor alone
 * rather than a colleague's rules. Fewer configured rules, never fewer floors.
 */
async function loadGuardrails(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
): Promise<GuardrailRule[]> {
  if (!workspaceId) return withFloor([]);
  const { data } = await supabase
    .from("guardrail_rules")
    .select("id,name,kind,pattern,action,applies_to,enabled")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);
  return withFloor((data ?? []) as GuardrailRule[]);
}

async function checkBudget(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: b } = await supabase
    .from("ai_budgets")
    .select("daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used,day_window,month_window")
    .eq("user_id", userId)
    .maybeSingle();
  if (!b) return;
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7) + "-01";
  if (
    b.daily_usd_cap != null &&
    b.day_window === today &&
    Number(b.daily_usd_used) >= Number(b.daily_usd_cap)
  )
    throw new Error("Daily AI budget reached. Raise the cap in Pulse → Spend.");
  if (
    b.monthly_usd_cap != null &&
    b.month_window === thisMonth &&
    Number(b.monthly_usd_used) >= Number(b.monthly_usd_cap)
  )
    throw new Error("Monthly AI budget reached. Raise the cap in Engine Room → Spend.");
}

async function checkSurfaceBudget(
  supabase: SupabaseClient,
  userId: string,
  surface: string,
): Promise<void> {
  const { data: b } = await supabase
    .from("ai_surface_budgets")
    .select(
      "daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used,day_window,month_window,enabled",
    )
    .eq("user_id", userId)
    .eq("surface", surface)
    .maybeSingle();
  if (!b || !b.enabled) return;
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7) + "-01";
  if (
    b.daily_usd_cap != null &&
    b.day_window === today &&
    Number(b.daily_usd_used) >= Number(b.daily_usd_cap)
  )
    throw new Error(`Daily budget for "${surface}" reached. Raise the cap in /budgets.`);
  if (
    b.monthly_usd_cap != null &&
    b.month_window === thisMonth &&
    Number(b.monthly_usd_used) >= Number(b.monthly_usd_cap)
  )
    throw new Error(`Monthly budget for "${surface}" reached. Raise the cap in /budgets.`);
}

async function logBudgetAlert(
  supabase: SupabaseClient,
  userId: string,
  args: {
    scope: "global" | "surface";
    surface: string | null;
    window_kind: "day" | "month";
    kind: "warn" | "block";
    used: number;
    cap: number;
    traceId?: string | null;
  },
) {
  const pct = args.cap > 0 ? Math.min(100, (args.used / args.cap) * 100) : 0;
  try {
    await supabase.from("ai_budget_alerts").insert({
      user_id: userId,
      scope: args.scope,
      surface: args.surface,
      window_kind: args.window_kind,
      kind: args.kind,
      usd_used: args.used,
      usd_cap: args.cap,
      pct,
      trace_id: args.traceId ?? null,
    });
  } catch {
    /* best-effort */
  }
}

// ---------------------------------------------------------------------------
// WM-M4: dormant account-level credit seam.
//
// The credit engine (WM-M10..M16) plugs into the chokepoint here without re-plumbing.
// `assertAccountCredits` runs right after the per-user budget check (pre-call) and may
// throw `CreditExhaustedError` to halt; `debitAccountCredits` runs next to
// `incrementBudget` (post-call) and meters the account pool. BOTH are gated behind the
// `credits_enabled()` DB flag and are a strict no-op while it is false (today's dormant
// state, and the flag/tables do not even exist until WM-M2 publishes), so there is zero
// behavior change. WM-M12 hardens the enabled bodies (atomic draw-down RPC,
// included-then-top-up order, the blocked-event log, per-product attribution); this is
// the seam plus a minimal v1. Credit writes target the service-role-only credit tables
// via `supabaseAdmin`.
// ---------------------------------------------------------------------------
export class CreditExhaustedError extends Error {
  readonly code = "CREDIT_EXHAUSTED";
  readonly accountId: string | null;
  constructor(accountId: string | null, message: string) {
    super(message);
    this.name = "CreditExhaustedError";
    this.accountId = accountId;
  }
}

// WM-M14: thrown when an owner-set per-product / per-member cap would be exceeded, even
// though the account pool still has credits. Halts ONLY that scope. Logged as a blocked
// ai_events row (reason 'credit_cap_reached'), mirroring the CreditExhaustedError halt.
export class CreditCapError extends Error {
  readonly code = "CREDIT_CAP_REACHED";
  readonly accountId: string | null;
  readonly scope: "product" | "member";
  readonly targetId: string;
  constructor(
    accountId: string | null,
    scope: "product" | "member",
    targetId: string,
    message: string,
  ) {
    super(message);
    this.name = "CreditCapError";
    this.accountId = accountId;
    this.scope = scope;
    this.targetId = targetId;
  }
}

// credits_enabled() is a rarely-flipped flag; cache it in-process so the dormant hot
// path costs at most one RPC per process per TTL, not a round-trip per AI call. A
// missing function / error reads the engine as OFF (false) and never blocks a call. Note
// that production reads TRUE; this is the fail-open path, not the normal one.
let _creditsEnabledCache: { value: boolean; at: number } | null = null;
const CREDITS_FLAG_TTL_MS = 5 * 60 * 1000;

async function creditsEnabled(supabase: SupabaseClient): Promise<boolean> {
  const now = Date.now();
  if (_creditsEnabledCache && now - _creditsEnabledCache.at < CREDITS_FLAG_TTL_MS) {
    return _creditsEnabledCache.value;
  }
  let value = false;
  try {
    const { data, error } = await supabase.rpc("credits_enabled");
    if (!error) value = data === true;
  } catch {
    value = false;
  }
  _creditsEnabledCache = { value, at: now };
  return value;
}

// Resolve the account that owns this call: the workspace's account, else the user's
// default account. Best-effort, never throws on the hot path (null on any error).
// Exported (G-PRICE PR-A1): the abandon-refund path in loop.server.ts resolves the
// same account a run's debits were drawn from, so a refund targets the right pool
// without re-deriving the workspace-to-account lookup a second way.
export async function resolveCreditAccountId(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null | undefined,
): Promise<string | null> {
  try {
    if (workspaceId) {
      const { data } = await supabase
        .from("workspaces")
        .select("account_id")
        .eq("id", workspaceId)
        .maybeSingle();
      const acc = (data as { account_id?: string | null } | null)?.account_id ?? null;
      if (acc) return acc;
    }
    const { data } = await supabase.rpc("ensure_user_default_account", { _user_id: userId });
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Pre-call: when credits are enabled, halt with CreditExhaustedError if the account's
 * pool (included + top-up) is empty. No-op where the gate is off (not production). Any read failure degrades to
 * "allow" so the credit engine can never block a real call by accident.
 */
// Log a blocked ai_events row when a call is halted for an empty pool (mirrors the
// governance-halt pattern). Best-effort; a logging failure must not mask the halt.
async function insertBlockedCreditEvent(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  errorMessage: string,
  code: GateCode,
): Promise<void> {
  try {
    await supabase.from("ai_events").insert({
      user_id: userId,
      trace_id: opts.traceId ?? null,
      parent_event_id: opts.parentEventId ?? null,
      surface: opts.surface,
      surface_ref: opts.surface_ref ?? null,
      // See the same note in logGovernanceHalt: pass the workspace explicitly so a
      // service-role (cron) caller never relies on the auth.uid()-based column default.
      ...(opts.workspaceId ? { workspace_id: opts.workspaceId } : {}),
      provider: "credits",
      via: "gateway",
      model: opts.model,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      est_cost_usd: 0,
      latency_ms: 0,
      status: "blocked",
      error_code: code,
      error_message: errorMessage,
      input_preview: (opts.messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
      system_preview: "",
      output_preview: "",
    });
  } catch (e) {
    console.error("blocked credit event insert failed:", e);
  }
  void noteGate(code, {
    userId,
    surface: opts.surface,
    model: opts.model,
    workspaceId: opts.workspaceId ?? null,
    runId: opts.runId ?? null,
  });
}

async function logCreditExhausted(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  accountId: string,
  balance: number,
  projected: number,
): Promise<void> {
  await insertBlockedCreditEvent(
    supabase,
    userId,
    opts,
    `credit_exhausted: account ${accountId} balance ${balance} below projected ${projected}`,
    GATE_CODES.credit_exhausted,
  );
}

// G-PRICE PR-D2: log the ambient-surface downgrade-to-free as an informational (not
// blocked) ai_events row, so the account owner can see in their trace that an ambient
// tick ran on the free floor rather than silently drawing (or silently skipping).
async function logAmbientDowngrade(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  accountId: string,
  balance: number,
  projected: number,
): Promise<void> {
  try {
    await supabase.from("ai_events").insert({
      user_id: userId,
      trace_id: opts.traceId ?? null,
      parent_event_id: opts.parentEventId ?? null,
      surface: opts.surface,
      surface_ref: opts.surface_ref ?? null,
      ...(opts.workspaceId ? { workspace_id: opts.workspaceId } : {}),
      provider: "credits",
      via: "gateway",
      model: opts.model,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      est_cost_usd: 0,
      latency_ms: 0,
      status: "ok",
      // Not a block, still a refusal of what was asked for: the model the
      // caller wanted was swapped for the free floor. It counts in gate pressure.
      error_code: GATE_CODES.ambient_downgrade,
      error_message: `ambient_downgrade: account ${accountId} balance ${balance} below projected ${projected}, routed to free floor`,
      input_preview: "",
      system_preview: "",
      output_preview: "",
    });
  } catch (e) {
    console.error("ambient downgrade event insert failed:", e);
  }
  void noteGate(GATE_CODES.ambient_downgrade, {
    userId,
    surface: opts.surface,
    model: opts.model,
    workspaceId: opts.workspaceId ?? null,
    runId: opts.runId ?? null,
  });
}

/**
 * Pre-call: when credits are enabled, project the call's cost and halt with
 * CreditExhaustedError (after logging a blocked ai_events row) if the account pool
 * (included + top-up) cannot cover it. No-op where the gate is off (not production). A read failure degrades to
 * "allow" so the engine can never block a real call by accident.
 *
 * G-PRICE PR-D2 — returns a model-id OVERRIDE (or null) rather than plain void: an
 * AMBIENT surface (sense — autonomous, self-initiated signal ingestion) that would
 * otherwise halt on an empty pool instead DOWNGRADES to the free floor (the cheapest
 * live model, whose call then costs 0 credits at the coarse artifact-cost table used
 * everywhere else) rather than dead-stopping. Every other surface still hard-halts
 * (pricing-architecture §2 Rule 4: default stop-at-allowance, never silent overspend —
 * the downgrade-to-free is an EXCEPTION carved out only for ambient/autonomous work,
 * never a general bypass).
 */
async function assertAccountCredits(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  effectiveModel: string,
): Promise<string | null> {
  if (!(await creditsEnabled(supabase))) return null;
  // G-PRICE PR-A2: a FREE surface (eval/judge/embed/scheduler/test) never halts on an
  // empty pool either — it must always be able to run so it can keep grading/screening
  // even when the account is out of billable credits.
  if (!isChargeableSurface(opts.surface)) return null;
  const accountId = await resolveCreditAccountId(supabase, userId, opts.workspaceId ?? null);
  if (!accountId) return null;
  const admin = supabaseAdmin as unknown as SupabaseClient;
  let balance = 0;
  let cycleAnchorIso: string | null = null;
  let monthlyGrant = 0;
  let overageEnabled = false;
  let overageCapMultiplier = 1.25;
  try {
    const { data } = await admin
      .from("account_credits")
      .select(
        "balance_credits, topup_credits, cycle_anchor, monthly_grant_credits, overage_enabled, overage_cap_multiplier",
      )
      .eq("account_id", accountId)
      .maybeSingle();
    const row = (data ?? {}) as {
      balance_credits?: number;
      topup_credits?: number;
      cycle_anchor?: string | null;
      monthly_grant_credits?: number;
      overage_enabled?: boolean;
      overage_cap_multiplier?: number;
    };
    balance = Number(row.balance_credits ?? 0) + Number(row.topup_credits ?? 0);
    cycleAnchorIso = row.cycle_anchor ?? null;
    monthlyGrant = Number(row.monthly_grant_credits ?? 0);
    overageEnabled = row.overage_enabled === true;
    overageCapMultiplier = Number(row.overage_cap_multiplier ?? 1.25);
  } catch {
    return null;
  }
  const projected = projectCallCredits(effectiveModel, opts.messages);
  if (balance <= 0 || balance < projected) {
    // G-PRICE PR-D2: ambient/autonomous work downgrades to the free floor at the cap
    // rather than dead-stopping (pricing-architecture §2 Rule 4, §5). `sense` is the
    // one ambient-tick surface that runs unattended (cron-driven signal ingestion);
    // route it to the cheapest live model instead of halting, so the account keeps its
    // baseline ambient intelligence even at zero credits. Every other chargeable
    // surface still hard-halts below — this is a narrow, named exception, not a bypass.
    if (isAmbientSurface(opts.surface)) {
      const downgraded = cheapestLiveModel();
      await logAmbientDowngrade(supabase, userId, opts, accountId, balance, projected);
      return downgraded;
    }
    // G-PRICE PR-D2: bounded, opt-in overage. The account must have explicitly turned
    // this on (never a default); even then the draw is capped at a bounded multiplier
    // of the monthly grant (1.0-3.0x, Zapier's precedent), never unlimited. The "spent
    // since grant" basis is (monthlyGrant - balance) clamped to 0 - the pool's own
    // draw-down already tracks this without a second ledger scan.
    if (overageEnabled) {
      const spentSinceGrant = Math.max(0, monthlyGrant - balance);
      if (withinBoundedOverage(spentSinceGrant, projected, monthlyGrant, overageCapMultiplier)) {
        await assertCreditCaps(supabase, userId, opts, accountId, projected, cycleAnchorIso);
        return null;
      }
    }
    await logCreditExhausted(supabase, userId, opts, accountId, balance, projected);
    throw new CreditExhaustedError(
      accountId,
      `Account credit balance (${balance}) is below the projected cost (${projected}).`,
    );
  }
  // WM-M14: the account pool can cover the call, but an owner-set per-product / per-member
  // cap may still halt this one scope. Only runs when an enabled cap exists.
  await assertCreditCaps(supabase, userId, opts, accountId, projected, cycleAnchorIso);
  return null;
}

/**
 * WM-M14 per-product / per-member cap enforcement. When credits are enabled and an owner
 * has set an enabled cap for this call's product or member, sum the window's debits for
 * that scope and throw CreditCapError (logging a blocked event) if this call would push it
 * over the cap, while the account pool itself may still have credits. Reads via the
 * service-role client (the account is already resolved). Any read failure degrades to
 * "allow" so a cap can never block a real call by accident. A no-op when no cap exists.
 */
async function assertCreditCaps(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  accountId: string,
  projected: number,
  cycleAnchorIso: string | null,
): Promise<void> {
  const productId = opts.productId ?? null;
  // The (scope, target) pairs this call could hit: always its member, plus its product.
  const targets: { scope: "product" | "member"; targetId: string }[] = [
    { scope: "member", targetId: userId },
  ];
  if (productId) targets.push({ scope: "product", targetId: productId });

  const admin = supabaseAdmin as unknown as SupabaseClient;
  type CapRow = { scope: string; target_id: string; cap_credits: number; window_kind: string };
  let caps: CapRow[] = [];
  try {
    const { data } = await admin
      .from("credit_caps")
      .select("scope, target_id, cap_credits, window_kind")
      .eq("account_id", accountId)
      .eq("enabled", true)
      .in(
        "target_id",
        targets.map((t) => t.targetId),
      );
    caps = (data ?? []) as CapRow[];
  } catch {
    return; // cannot read caps -> never block a real call
  }
  if (caps.length === 0) return;

  const nowIso = new Date().toISOString();
  for (const cap of caps) {
    // Enforce only a cap whose (scope, target) actually matches this call (a member id and
    // a product id could collide in `target_id IN (...)`, so re-check the scope).
    const match = targets.find((t) => t.scope === cap.scope && t.targetId === cap.target_id);
    if (!match) continue;
    const windowKind =
      cap.window_kind === "day" || cap.window_kind === "month" ? cap.window_kind : "cycle";
    const sinceIso = creditWindowStartIso(windowKind, cycleAnchorIso, nowIso);
    let spent = 0;
    try {
      const column = cap.scope === "product" ? "product_id" : "user_id";
      const { data } = await admin
        .from("credit_ledger")
        .select("delta_credits, product_id, user_id")
        .eq("account_id", accountId)
        .eq("reason", "debit")
        .eq(column, cap.target_id)
        .gte("created_at", sinceIso);
      spent = sumDebitCredits((data ?? []) as LedgerDebitRow[]);
    } catch {
      continue; // cannot read this scope's spend -> do not block it
    }
    if (capExceeded(spent, projected, Number(cap.cap_credits))) {
      await insertBlockedCreditEvent(
        supabase,
        userId,
        opts,
        `credit_cap_reached: ${cap.scope} ${cap.target_id} spent ${spent} of ${cap.cap_credits}`,
        GATE_CODES.credit_cap,
      );
      throw new CreditCapError(
        accountId,
        match.scope,
        cap.target_id,
        `Credit cap for this ${cap.scope} reached (${spent} of ${cap.cap_credits} used this cycle).`,
      );
    }
  }
}

/**
 * Post-call: when credits are enabled, meter the call against the account pool via the
 * atomic `debit_account_credits` RPC (draws INCLUDED first, then TOP-UP, in one locked
 * transaction, and writes the credit_ledger debit tagged with the ai_event + surface).
 * No-op where the gate is off (not production); never throws (a metering failure must not
 * fail a completed call).
 */
async function debitAccountCredits(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  estCostUsd: number,
  aiEventId: string | null,
  model: string,
): Promise<void> {
  if (!(await creditsEnabled(supabase))) return;
  // G-PRICE PR-A2: the free-vs-charged surface map. eval/judge/embed/scheduler/test
  // are the trust + plumbing layer (pricing-architecture §2 Rule 1) and never draw
  // the meter, no matter their token cost — charging for verifying our own output
  // would suppress the exact mechanism that is the moat.
  if (!isChargeableSurface(opts.surface)) return;
  // WM-M15: meter the credit RATE on the model that ACTUALLY ran (cost-routed and/or
  // fallback), matching the est_cost_usd basis, not the originally-requested opts.model.
  const credits = creditsForCost(estCostUsd, model);
  if (credits <= 0) return;
  const accountId = await resolveCreditAccountId(supabase, userId, opts.workspaceId ?? null);
  if (!accountId) return;
  try {
    await (supabaseAdmin as unknown as SupabaseClient).rpc("debit_account_credits", {
      _account_id: accountId,
      _credits: credits,
      _user_id: userId,
      _surface: opts.surface,
      _ai_event_id: aiEventId,
      _product_id: opts.productId ?? null,
    });
  } catch (e) {
    console.error("debitAccountCredits failed:", e);
  }
}

/**
 * G-PRICE PR-C2: accrue the thin BYOK platform fee for one enterprise BYOK call. The
 * customer's own key already paid the raw model tokens (pricing-architecture §4) - this
 * writes ONE byok_fee_accrual row of Supaprod's orchestration-margin cut on that rated
 * spend, read back later as a single contract-invoice line, never a live meter. Runs
 * independently of credits_enabled() (a contract-billing concern, not the consumer
 * credit engine) but is itself always a no-op unless the call actually resolved a BYOK
 * vault key (via === "byo"), checked by the caller before this is invoked. Best-effort;
 * never throws (a metering failure must not fail a completed call).
 */
async function accrueByokFee(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
  estCostUsd: number,
  aiEventId: string | null,
): Promise<void> {
  const feeUsd = byokFeeUsd(estCostUsd);
  if (feeUsd <= 0) return;
  try {
    const accountId = await resolveCreditAccountId(supabase, userId, opts.workspaceId ?? null);
    if (!accountId) return;
    await (supabaseAdmin as unknown as SupabaseClient).from("byok_fee_accrual").insert({
      account_id: accountId,
      user_id: userId,
      ai_event_id: aiEventId,
      surface: opts.surface,
      rated_spend_usd: estCostUsd,
      fee_pct: BYOK_FEE_PCT,
      fee_usd: feeUsd,
    });
  } catch (e) {
    console.error("accrueByokFee failed:", e);
  }
}

async function incrementBudget(
  supabase: SupabaseClient,
  userId: string,
  tokens: number,
  usd: number,
  traceId?: string | null,
) {
  // ATOMIC, THROUGH AN RPC, and the reason is money rather than tidiness.
  //
  // This used to read the row, add in JavaScript, and blind-write the sum. Two
  // concurrent calls both read 10.00 and both wrote 10.50, so one call's spend
  // vanished. Unlike a balance check that is corrected by the next true read,
  // a LEDGER lost update is permanent: nothing recomputes the number, so the
  // cap under-reports for the rest of the day and the month. The agent loop
  // makes these calls in parallel by design, so the collision was the normal
  // case. `record_mission_usage` had done this correctly since June.
  //
  // The spend ledger is service-role territory. authenticated is column-restricted
  // to caps only (migration 20260708153000), so a user cannot PATCH their own usage
  // back to 0 or roll the window forward to dodge the cap. The runtime therefore
  // meters through supabaseAdmin, the same principal split that lets checkBudget
  // still read via the user client while only the service role advances the ledger.
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const { data: metered, error: meterErr } = await admin.rpc("record_ai_budget_usage", {
    _user_id: userId,
    _tokens: Math.trunc(tokens),
    _usd: usd,
  });
  // A meter that could not be written must not also lose the alert it would have
  // raised, so the failure is reported rather than swallowed. It is not thrown:
  // the model call already happened and already cost money, and turning a
  // bookkeeping failure into a caller-visible error would discard a completed
  // answer the user has paid for.
  if (meterErr) {
    console.error("[budget] account meter did not record:", meterErr.message);
    return;
  }
  const row = (Array.isArray(metered) ? metered[0] : metered) as
    | {
        new_daily_usd: number | string | null;
        new_monthly_usd: number | string | null;
        daily_usd_cap: number | string | null;
        monthly_usd_cap: number | string | null;
        alert_at_pct: number | string | null;
      }
    | null
    | undefined;
  if (!row) return;

  const newDailyUsd = Number(row.new_daily_usd ?? 0);
  const newMonthlyUsd = Number(row.new_monthly_usd ?? 0);

  // Soft-cap alert: emit one when crossing the threshold (between prior and new).
  //
  // "PRIOR" IS NOW THIS CALL'S OWN BEFORE-VALUE, derived by subtracting this
  // call's own contribution from the authoritative new total. That is stricter
  // than the stale read it replaces: every racing caller used to share one
  // before-value, so a crossing fired several times or not at all. Subtracting
  // your own delta means exactly one caller sees the threshold cross.
  const pctAlert = Number(row.alert_at_pct ?? 80);
  const prevDaily = newDailyUsd - usd;
  const dailyCap = Number(row.daily_usd_cap ?? 0);
  if (dailyCap > 0) {
    const thr = (pctAlert / 100) * dailyCap;
    if (prevDaily < thr && newDailyUsd >= thr) {
      await logBudgetAlert(supabase, userId, {
        scope: "global",
        surface: null,
        window_kind: "day",
        kind: "warn",
        used: newDailyUsd,
        cap: dailyCap,
        traceId,
      });
    }
  }
  const prevMonthly = newMonthlyUsd - usd;
  const monthlyCap = Number(row.monthly_usd_cap ?? 0);
  if (monthlyCap > 0) {
    const thr = (pctAlert / 100) * monthlyCap;
    if (prevMonthly < thr && newMonthlyUsd >= thr) {
      await logBudgetAlert(supabase, userId, {
        scope: "global",
        surface: null,
        window_kind: "month",
        kind: "warn",
        used: newMonthlyUsd,
        cap: monthlyCap,
        traceId,
      });
    }
  }
}

async function incrementSurfaceBudget(
  supabase: SupabaseClient,
  userId: string,
  surface: string,
  usd: number,
  traceId?: string | null,
) {
  // Atomic, for the same reason as the account meter above. The RPC returns no
  // row when the surface has no budget configured, which is the same "not
  // metered" answer the read-then-update version gave on a missing row.
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const { data: metered, error: meterErr } = await admin.rpc("record_ai_surface_usage", {
    _user_id: userId,
    _surface: surface,
    _usd: usd,
  });
  if (meterErr) {
    console.error(`[budget] surface meter did not record for ${surface}:`, meterErr.message);
    return;
  }
  const row = (Array.isArray(metered) ? metered[0] : metered) as
    | {
        new_daily_usd: number | string | null;
        new_monthly_usd: number | string | null;
        daily_usd_cap: number | string | null;
        monthly_usd_cap: number | string | null;
      }
    | null
    | undefined;
  if (!row) return; // no per-surface budget configured
  const newDaily = Number(row.new_daily_usd ?? 0);
  const newMonthly = Number(row.new_monthly_usd ?? 0);
  const prevDaily = newDaily - usd;
  const prevMonthly = newMonthly - usd;

  const dailyCap = Number(row.daily_usd_cap ?? 0);
  if (dailyCap > 0) {
    const thr = 0.8 * dailyCap;
    if (prevDaily < thr && newDaily >= thr) {
      await logBudgetAlert(supabase, userId, {
        scope: "surface",
        surface,
        window_kind: "day",
        kind: "warn",
        used: newDaily,
        cap: dailyCap,
        traceId,
      });
    }
  }
  const monthlyCap = Number(row.monthly_usd_cap ?? 0);
  if (monthlyCap > 0) {
    const thr = 0.8 * monthlyCap;
    if (prevMonthly < thr && newMonthly >= thr) {
      await logBudgetAlert(supabase, userId, {
        scope: "surface",
        surface,
        window_kind: "month",
        kind: "warn",
        used: newMonthly,
        cap: monthlyCap,
        traceId,
      });
    }
  }
}

/**
 * Public entry point. Every AI call in the platform should go through this.
 */
export async function callModel(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
): Promise<CallResult> {
  const useGuards = opts.guardrails !== false;
  // AGT-01: a native tool-calling turn is structured output, exactly like
  // responseFormat=json_object - it must skip the same prose-only steps
  // (the humanize directive going in, guardrail-scrubbing and humanizeText
  // coming out) or those would corrupt tool_call args. One shared flag so
  // every one of those checks stays in sync instead of drifting individually.
  const isStructuredOutput = opts.responseFormat === "json_object" || !!opts.tools?.length;

  // 0. Governance — kill-switch + mission caps (throws GovernanceHaltError on halt)
  try {
    // Parallelize both governance checks: neither depends on the other's result.
    await Promise.all([
      checkKillSwitch(supabase, opts.workspaceId ?? null),
      checkMissionCaps(supabase, opts.runId ?? null),
    ]);
  } catch (e) {
    if (e instanceof GovernanceHaltError) {
      await logGovernanceHalt(supabase, userId, opts, e);
      throw e;
    }
    throw e;
  }

  // 1. Budget
  // Parallelize both budget checks: neither depends on the other's result.
  await Promise.all([
    checkBudget(supabase, userId),
    checkSurfaceBudget(supabase, userId, opts.surface),
  ]);
  // MODEL-AGNOSTIC effective-model resolution, in order:
  //  1. activeModelId   — route a deprecated model to its live replacement (no-op when none).
  //  2. capabilityRouted — Perplexity-style: pick the model best at the task ("auto" mode, a
  //     task hint, or an internal system surface); never overrides an explicit consumer pick.
  //  3. costRouted       — WM-M15 cost-aware downgrade of routine surfaces (no-op unless
  //     AI_COST_ROUTING is on). Resolved up front so the credit pre-check projects the real model.
  const requested = activeModelId(opts.model);
  const capabilityResolved = capabilityRoutedModel({
    surface: opts.surface,
    requestedModel: requested,
    task: opts.task,
    messages: opts.messages,
    isAvailable: modelAvailability(),
    enabled: capabilityRoutingEnabled(),
  });
  let effectiveModel = costRoutingEnabled()
    ? costRoutedModel(opts.surface, capabilityResolved)
    : capabilityResolved;
  // WM-M4: dormant account-level credit pre-check (no-op while credits_enabled() is false).
  // G-PRICE PR-D2: a non-null return is the ambient-surface downgrade-to-free override.
  const ambientOverride = await assertAccountCredits(supabase, userId, opts, effectiveModel);
  if (ambientOverride) effectiveModel = ambientOverride;

  // 2. Pre-guardrails on the user content
  const rules = useGuards ? await loadGuardrails(supabase, opts.workspaceId) : [];
  const hits: {
    rule_id: string;
    rule_name: string;
    side: "input" | "output";
    action: string;
    kind: string;
    matched: string;
  }[] = [];
  let messages = opts.messages;
  // 2a. Prompt template resolution — prepend the assigned system prompt
  let resolvedPrompt: Awaited<ReturnType<typeof resolvePrompt>> = null;
  if (opts.promptKey) {
    try {
      resolvedPrompt = await resolvePrompt(supabase, userId, opts.surface, opts.promptKey);
      if (resolvedPrompt?.system_prompt) {
        messages = [{ role: "system", content: resolvedPrompt.system_prompt }, ...messages];
      }
    } catch (e) {
      console.error("prompt resolve failed:", e);
    }
  }
  let citations: RetrievedChunk[] = [];
  if (opts.retrieval) {
    const rOpts = typeof opts.retrieval === "object" ? opts.retrieval : {};
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (lastUser.trim()) {
      try {
        citations = await retrieve(supabase, userId, {
          query: lastUser,
          k: rOpts.k ?? 6,
          sourceKinds: rOpts.sourceKinds,
          mmr: true,
        });
      } catch (e) {
        console.error("retrieval failed:", e);
      }
      if (citations.length > 0) {
        const ctx = formatContextBlock(citations);
        messages = [{ role: "system", content: ctx }, ...opts.messages];
      }
    }
  }
  if (useGuards) {
    // AN INPUT BLOCK USED TO BE INVISIBLE EVERYWHERE, on BOTH call paths. This
    // threw straight out of a .map() without writing an ai_events row, so the one
    // call the product refused outright left no trace at all: not in the ledger,
    // not in gate pressure, not in the cost record. The OUTPUT-side block has
    // always written its row, so refusals were half recorded, and the missing
    // half was the half that never even reached a provider.
    //
    // It matters past tidiness. "How often do we refuse a user, and which rule
    // does it" is the question the governance canon needs answered before the
    // product can honestly offer to relax a rule, and the input side is where
    // most refusals live.
    //
    // The block is detected first and handled OUTSIDE the map, because writing
    // the row is async and a throw from inside a synchronous map cannot await.
    let blockedBy: string | null = null;
    messages = messages.map((m) => {
      if (m.role !== "user") return m;
      const r = evaluateGuardrails(m.content, rules, "input");
      r.hits.forEach((h) => hits.push(h));
      if (r.blocked && !blockedBy) {
        blockedBy = r.hits.find((h) => h.action === "block")?.rule_name ?? "a safety rule";
      }
      return { ...m, content: r.text };
    });

    if (blockedBy) {
      const reason = `A safety rule blocked this: ${blockedBy}`;
      // Fail-safe: the refusal is the point, so a telemetry failure must never
      // turn a clean block into a confusing crash. Record what we can, then throw
      // the same error with the same code, so every caller behaves as before.
      try {
        const { data: blockEvt } = await supabase
          .from("ai_events")
          .insert({
            user_id: userId,
            surface: opts.surface,
            model: effectiveModel,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            est_cost_usd: 0,
            latency_ms: 0,
            status: "blocked",
            error_code: GATE_CODES.guardrail_block,
            error_message: reason,
            input_preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
          })
          .select("id")
          .single();
        const blockEventId = (blockEvt as { id: string } | null)?.id ?? null;
        if (blockEventId && hits.length) {
          await supabase.from("guardrail_hits").insert(
            hits.map((h) => ({
              user_id: userId,
              event_id: blockEventId,
              rule_id: h.rule_id,
              rule_name: h.rule_name,
              kind: h.kind,
              side: h.side,
              action: h.action,
              matched: h.matched,
            })),
          );
        }
        void noteGate(GATE_CODES.guardrail_block, {
          userId,
          surface: opts.surface,
          model: effectiveModel,
          workspaceId: opts.workspaceId ?? null,
          runId: opts.runId ?? null,
        });
      } catch (e) {
        console.error("input guardrail block telemetry failed:", e);
      }
      throw Object.assign(new Error(reason), { code: "GUARDRAIL_BLOCK" });
    }
  }

  // 2b. Soft humanization directive (prose only; JSON/tool-calling calls keep
  // their exact schema instructions). The hard gate is humanizeText() below.
  if (!isStructuredOutput) {
    messages = withHumanizeDirective(messages);
  }

  // 3. Provider call. effectiveModel (resolved above with the credit pre-check) is used for
  // dispatch and the recorded modelUsed. Key + endpoint are resolved per-attempt-model
  // inside attempt() (so a cross-provider fallback uses the right key), see resolveCallKey.
  const t0 = Date.now();
  let providerOut: {
    text: string;
    in_tok: number;
    out_tok: number;
    /**
     * Input tokens the provider served FROM ITS CACHE, as the provider reported them.
     * A subset of in_tok, priced at the model's cached rate when one is sourced.
     * 0 when the provider reports nothing, which prices the call exactly as before.
     */
    cached_tok?: number;
    latency: number;
    toolCalls?: { id: string; name: string; args: unknown }[];
  } = {
    text: "",
    in_tok: 0,
    out_tok: 0,
    cached_tok: 0,
    latency: 0,
  };
  let via: "gateway" | "byo" | "cache" = "gateway";
  let provider = "lovable";
  let status: "ok" | "error" | "blocked" = "ok";
  let errMsg: string | undefined;
  let fallback = false;
  let modelUsed = effectiveModel;


  // WM-M15b: Response cache check
  let cacheHit = false;
  const shouldCache = shouldCacheCall(
    opts.surface,
    opts.retrieval,
    opts.guardrails,
    opts.responseFormat,
    !!opts.tools?.length,
  );
  let cacheKey: string | null = null;
  if (shouldCache) {
    cacheKey = await generateCacheKey(effectiveModel, messages, opts.responseFormat);
    const cached = await readCache(supabaseAdmin, userId, effectiveModel, cacheKey);
    if (cached) {
      cacheHit = true;
      providerOut = formatCachedResponse(cached);
      via = "cache";
      provider = "cache";
      modelUsed = effectiveModel;
      status = "ok";
      errMsg = undefined;
    }
  }

  // Cache for key resolution across retry attempts and fallback chain traversal.
  // This avoids re-deriving BYOK eligibility and reloading vault keys if the same
  // provider appears in retries or multiple fallback models use the same provider.
  // If a cache is provided (cross-call optimization), reuse it; otherwise create fresh.
  const keyResolutionCache: KeyResolutionCache = opts.keyResolutionCache ?? {};

  const attempt = async (model: string) => {
    const { provider: prov } = splitModelId(model);
    const keyInfo = await resolveCallKey(
      supabase,
      userId,
      prov,
      opts.byoOverride,
      opts.workspaceId,
      opts.surface,
      keyResolutionCache,
    );
    if (keyInfo) {
      const route = providerRoute(model, { baseUrl: keyInfo.baseUrl });
      if (route) {
        via = "byo";
        provider = route.provider;
        const safeUrl = assertSafeBaseUrl(route.url);
        return route.style === "anthropic_messages"
          ? callAnthropic(keyInfo.apiKey, route.model, messages, safeUrl, opts.tools, opts.signal)
          : callOpenAICompat(
              safeUrl,
              keyInfo.apiKey,
              route.model,
              messages,
              opts.responseFormat,
              opts.tools,
              opts.signal,
            );
      }
    }
    via = "gateway";
    provider = "lovable";
    return callGateway(model, messages, opts.responseFormat, opts.tools, opts.signal);
  };

  let lastErr: unknown = null;
  // WM-M15b fix: on a cache hit, providerOut is already populated above — skip the
  // provider call entirely (this is the COGS win; the original shipped version ran
  // the provider unconditionally, making the cache a no-op).
  if (!cacheHit) {
    providerOut = { text: "", in_tok: 0, out_tok: 0, latency: Date.now() - t0 };
    let retryAttempt = 0;
    let retryWaitedMs = 0;
    for (;;) {
      try {
        providerOut = await attempt(effectiveModel);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        const code = (e as { code?: string }).code ?? "";
        const delay = nextRetryDelayMs({
          attempt: retryAttempt,
          code,
          retryAfterMs: (e as { retryAfterMs?: number | null }).retryAfterMs,
          spentMs: retryWaitedMs,
          budgetMs: rateLimitBudgetMs(opts.surface, opts.retryBudgetMs),
          maxAttempts: maxAttemptsFor(code, opts.surface, opts.maxRetries),
        });
        if (delay === null) break;
        await new Promise((r) => setTimeout(r, delay));
        retryWaitedMs += delay;
        retryAttempt++;
      }
    }
    if (lastErr) {
      // PROVIDER-FALLBACK: walk the ordered fallback chain (explicit caller fallbacks first,
      // then a flag-gated auto-degrade to the cheapest live model). The happy path above is
      // untouched; this only runs once the primary has exhausted its retries.
      const primaryErr = lastErr; // root-cause error to surface if the whole chain also fails
      const chain = resolveFallbackChain(effectiveModel, {
        fallbackModels: opts.fallbackModels,
        fallbackModel: opts.fallbackModel,
        autoFallback:
          providerFallbackEnabled() && opts.surface !== "eval" && opts.surface !== "embed"
            ? cheapestLiveModel()
            : null,
      });
      for (const fb of chain) {
        try {
          providerOut = await attempt(fb);
          modelUsed = fb;
          fallback = true;
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      // Chain exhausted: surface the primary's failure (the root cause), not the last
      // fallback's error, so an outage incident reports what actually went down.
      if (lastErr) lastErr = primaryErr;
    }
  }
  // WM-M15b fix: write to cache only on a fresh, successful, non-fallback call. Store
  // under effectiveModel (the model the cache key was computed from) and skip fallback
  // responses so later reads keyed by (model, cache_key) stay consistent.
  if (!cacheHit && !lastErr && !fallback && cacheKey && shouldCache) {
    try {
      await writeCache(
        supabaseAdmin,
        userId,
        effectiveModel,
        cacheKey,
        providerOut.text,
        providerOut.in_tok,
        providerOut.out_tok,
      );
    } catch (e) {
      // Cache write errors are ignored
      console.error("cache write failed:", e);
    }
  }

  if (lastErr) {
    status = "error";
    errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  }

  // 4. Post-guardrails on output
  let outputText = providerOut.text;
  if (useGuards && outputText && !isStructuredOutput) {
    const r = evaluateGuardrails(outputText, rules, "output");
    r.hits.forEach((h) => hits.push(h));
    outputText = r.text;
  }

  // 4a. Humanize prose output (zero AI fingerprints). PROSE ONLY - JSON and
  // tool-calling responses must stay byte-exact so downstream JSON.parse (or
  // a tool call's args) never breaks.
  if (outputText && !isStructuredOutput) {
    outputText = humanizeText(outputText);
  }

  // 5. Cost
  // METERED FROM PROVIDER-REPORTED USAGE. cached_tok is what the provider said it
  // served from cache; it is a subset of in_tok and is priced at the model's cached
  // rate. Providers that report nothing yield 0, which prices identically to before.
  const est = estimateCostUsd(
    modelUsed,
    providerOut.in_tok,
    providerOut.out_tok,
    providerOut.cached_tok ?? 0,
  );
  const totalTok = providerOut.in_tok + providerOut.out_tok;

  // 6. Persist event + hits
  let eventId: string | null = null;
  try {
    const { data: evt } = await supabase
      .from("ai_events")
      .insert({
        user_id: userId,
        trace_id: opts.traceId ?? null,
        parent_event_id: opts.parentEventId ?? null,
        surface: opts.surface,
        surface_ref: opts.surface_ref ?? null,
        // See the note on logGovernanceHalt above: never rely on the auth.uid()-based
        // column default for a service-role (cron) call: pass the workspace explicitly
        // when we have one. This was silently dropping every cron-driven ai_events row
        // (cluster-tick, sense-tick, steward-tick, and so on), which is why the JSON-shape bug
        // below produced zero DB evidence until this was fixed.
        ...(opts.workspaceId ? { workspace_id: opts.workspaceId } : {}),
        provider,
        via,
        model: modelUsed,
        fallback,
        prompt_tokens: providerOut.in_tok,
        completion_tokens: providerOut.out_tok,
        // What the PROVIDER said it served from cache, so est_cost_usd can be audited
        // against a real invoice rather than trusted. Subset of prompt_tokens.
        cached_tokens: providerOut.cached_tok ?? 0,
        total_tokens: totalTok,
        est_cost_usd: est,
        latency_ms: providerOut.latency,
        // ttft_ms stays null here on purpose. This is the awaited path: there
        // is no first token, only a whole response, so any number written here
        // would be latency wearing a second name. The streaming path below
        // measures it for real.
        status,
        // AFD-04: the same taxonomy agent_runs.failure_kind uses, now recorded
        // for EVERY failed call and not only the ones that belong to a run.
        error_code: status === "error" ? classifyFailureKind(errMsg) : null,
        error_message: errMsg ?? null,
        input_preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
        system_preview: (messages.find((m) => m.role === "system")?.content ?? "").slice(0, 4000),
        // AGT-01: a pure native tool-call turn can have empty outputText (no
        // accompanying prose) - fall back to a stringified tool-call summary
        // so the log row isn't a blank string.
        output_preview: (
          outputText ||
          (providerOut.toolCalls?.length
            ? `[tool_call] ${providerOut.toolCalls.map((c) => c.name).join(", ")}`
            : "")
        ).slice(0, 1000),
      })
      .select("id")
      .single();
    eventId = (evt as { id: string } | null)?.id ?? null;

    if (hits.length && eventId) {
      await supabase.from("guardrail_hits").insert(
        hits.map((h) => ({
          user_id: userId,
          event_id: eventId,
          rule_id: h.rule_id,
          rule_name: h.rule_name,
          kind: h.kind,
          action: h.action,
          side: h.side,
          matched: h.matched,
          trace_id: opts.traceId ?? null,
        })),
      );
    }

    if (status === "ok" && totalTok > 0) {
      await incrementBudget(supabase, userId, totalTok, est, opts.traceId ?? null);
      await incrementSurfaceBudget(supabase, userId, opts.surface, est, opts.traceId ?? null);
      await recordMissionUsage(supabase, opts.runId ?? null, totalTok, est);
      // WM-M4 seam + WM-M12 debit: account-level credit metering (live; a no-op only where the gate is off).
      await debitAccountCredits(supabase, userId, opts, est, eventId, modelUsed);
      // G-PRICE PR-C2: an enterprise BYOK call still accrues Supaprod's thin platform
      // fee on the rated spend, independent of the consumer credit meter above.
      if ((via as string) === "byo") await accrueByokFee(supabase, userId, opts, est, eventId);
    }
    if (resolvedPrompt && eventId) {
      await logPromptRun(supabase, userId, {
        template_id: resolvedPrompt.template_id,
        version_id: resolvedPrompt.version_id,
        variant: resolvedPrompt.variant,
        event_id: eventId,
        rendered_input: messages.find((m) => m.role === "user")?.content ?? "",
      });
    }
  } catch (e) {
    console.error("ai_events insert failed:", e);
  }

  if (status === "error") {
    // AFD-06: tag the parent agent_runs row with a failure taxonomy + capture to Sentry façade.
    try {
      const kind = classifyFailureKind(errMsg);
      if (opts.runId) {
        await supabase.from("agent_runs").update({ failure_kind: kind }).eq("id", opts.runId);
      }
      const { captureError } = await import("@/lib/observability");
      void captureError(new Error(errMsg ?? "AI call failed"), {
        user_id: userId,
        surface: opts.surface,
        failure_kind: kind,
        extras: {
          surface_ref: opts.surface_ref ?? null,
          model: modelUsed,
          provider,
          runId: opts.runId ?? null,
        },
      });
    } catch (_e) {
      // Observability must never block user flows.
    }
    throw new Error(errMsg ?? "AI call failed");
  }

  /**
   * AFD-06: heuristic mapping of AI-call error strings to the agent_runs.failure_kind taxonomy.
   * The rules moved to src/lib/observability/gates.ts unchanged, so the streaming path and the
   * read side can name the same list. Same inputs, same strings, same column.
   */
  function classifyFailureKind(errMsg: string | null | undefined): string {
    return classifyFailureCode(errMsg);
  }

  let parsedJson: unknown = undefined;
  if (opts.responseFormat === "json_object" && outputText) {
    parsedJson = parseModelJson(outputText);
  }

  return {
    output: outputText,
    eventId,
    status,
    hits: hits.map((h) => ({ rule_name: h.rule_name, side: h.side, action: h.action })),
    via,
    provider,
    prompt_tokens: providerOut.in_tok,
    completion_tokens: providerOut.out_tok,
    cached_tokens: providerOut.cached_tok ?? 0,
    est_cost_usd: est,
    latency_ms: providerOut.latency,
    fallback,
    json: parsedJson,
    toolCalls: providerOut.toolCalls,
    citations: citations.map((c) => ({
      id: c.id,
      source_kind: c.source_kind,
      source_id: c.source_id,
      title: c.title,
      chunk_index: c.chunk_index,
      similarity: c.similarity,
    })),
  };
}

/**
 * Log a completed AI event when the call was made outside of callModel
 * (e.g. streaming SSE in /api/chat). Best-effort, never throws.
 */
export async function logAiEvent(
  supabase: SupabaseClient,
  userId: string,
  evt: {
    surface: CallSurface;
    surface_ref?: string | null;
    model: string;
    provider?: string;
    via?: "gateway" | "byo" | "cache";
    prompt_tokens?: number;
    completion_tokens?: number;
    latency_ms?: number;
    status?: "ok" | "error";
    error_message?: string | null;
    input_preview?: string;
    system_preview?: string;
    output_preview?: string;
    trace_id?: string | null;
  },
): Promise<string | null> {
  try {
    const totalTok = (evt.prompt_tokens ?? 0) + (evt.completion_tokens ?? 0);
    const est = estimateCostUsd(evt.model, evt.prompt_tokens ?? 0, evt.completion_tokens ?? 0);
    const { data } = await supabase
      .from("ai_events")
      .insert({
        user_id: userId,
        surface: evt.surface,
        surface_ref: evt.surface_ref ?? null,
        provider: evt.provider ?? "lovable",
        via: evt.via ?? "gateway",
        model: evt.model,
        prompt_tokens: evt.prompt_tokens ?? 0,
        completion_tokens: evt.completion_tokens ?? 0,
        total_tokens: totalTok,
        est_cost_usd: est,
        latency_ms: evt.latency_ms ?? 0,
        status: evt.status ?? "ok",
        // AFD-04: classify here too, so a stream that died before its first
        // byte lands in the same taxonomy as everything else.
        error_code:
          (evt.status ?? "ok") === "error" ? classifyFailureCode(evt.error_message) : null,
        error_message: evt.error_message ?? null,
        input_preview: (evt.input_preview ?? "").slice(0, 500),
        system_preview: (evt.system_preview ?? "").slice(0, 4000),
        output_preview: (evt.output_preview ?? "").slice(0, 1000),
        trace_id: evt.trace_id ?? null,
      })
      .select("id")
      .single();
    if (evt.status !== "error" && totalTok > 0) {
      await incrementBudget(supabase, userId, totalTok, est, evt.trace_id ?? null);
      await incrementSurfaceBudget(supabase, userId, evt.surface, est, evt.trace_id ?? null);
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (e) {
    console.error("logAiEvent failed:", e);
    return null;
  }
}

/**
 * Streaming entry point. Routes streaming completions through the AI chokepoint,
 * enforcing budget checks, input/output guardrails, prompt templates, and RAG retrieval.
 */
export async function callModelStream(
  supabase: SupabaseClient,
  userId: string,
  opts: CallOpts,
): Promise<{
  stream: ReadableStream<Uint8Array>;
  via: "gateway" | "byo" | "cache";
  provider: string;
  model: string;
}> {
  const useGuards = opts.guardrails !== false;

  // 0. Governance — kill-switch + mission caps
  try {
    // Parallelize both governance checks: neither depends on the other's result.
    await Promise.all([
      checkKillSwitch(supabase, opts.workspaceId ?? null),
      checkMissionCaps(supabase, opts.runId ?? null),
    ]);
  } catch (e) {
    if (e instanceof GovernanceHaltError) {
      await logGovernanceHalt(supabase, userId, opts, e);
      throw e;
    }
    throw e;
  }

  // 1. Budget
  // Parallelize both budget checks: neither depends on the other's result.
  await Promise.all([
    checkBudget(supabase, userId),
    checkSurfaceBudget(supabase, userId, opts.surface),
  ]);
  // MODEL-AGNOSTIC effective-model resolution, in order:
  //  1. activeModelId   — route a deprecated model to its live replacement (no-op when none).
  //  2. capabilityRouted — Perplexity-style: pick the model best at the task ("auto" mode, a
  //     task hint, or an internal system surface); never overrides an explicit consumer pick.
  //  3. costRouted       — WM-M15 cost-aware downgrade of routine surfaces (no-op unless
  //     AI_COST_ROUTING is on). Resolved up front so the credit pre-check projects the real model.
  const requested = activeModelId(opts.model);
  const capabilityResolved = capabilityRoutedModel({
    surface: opts.surface,
    requestedModel: requested,
    task: opts.task,
    messages: opts.messages,
    isAvailable: modelAvailability(),
    enabled: capabilityRoutingEnabled(),
  });
  let effectiveModel = costRoutingEnabled()
    ? costRoutedModel(opts.surface, capabilityResolved)
    : capabilityResolved;
  // WM-M4: dormant account-level credit pre-check (no-op while credits_enabled() is false).
  // G-PRICE PR-D2: a non-null return is the ambient-surface downgrade-to-free override.
  const ambientOverride = await assertAccountCredits(supabase, userId, opts, effectiveModel);
  if (ambientOverride) effectiveModel = ambientOverride;

  // 2. Pre-guardrails on the user content
  const rules = useGuards ? await loadGuardrails(supabase, opts.workspaceId) : [];
  const hits: {
    rule_id: string;
    rule_name: string;
    side: "input" | "output";
    action: string;
    kind: string;
    matched: string;
  }[] = [];
  let messages = opts.messages;

  // 2a. Prompt template resolution — prepend the assigned system prompt
  let resolvedPrompt: Awaited<ReturnType<typeof resolvePrompt>> = null;
  if (opts.promptKey) {
    try {
      resolvedPrompt = await resolvePrompt(supabase, userId, opts.surface, opts.promptKey);
      if (resolvedPrompt?.system_prompt) {
        messages = [{ role: "system", content: resolvedPrompt.system_prompt }, ...messages];
      }
    } catch (e) {
      console.error("prompt resolve failed:", e);
    }
  }

  let citations: RetrievedChunk[] = [];
  if (opts.retrieval) {
    const rOpts = typeof opts.retrieval === "object" ? opts.retrieval : {};
    const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (lastUser.trim()) {
      try {
        citations = await retrieve(supabase, userId, {
          query: lastUser,
          k: rOpts.k ?? 6,
          sourceKinds: rOpts.sourceKinds,
          mmr: true,
        });
      } catch (e) {
        console.error("retrieval failed:", e);
      }
      if (citations.length > 0) {
        const ctx = formatContextBlock(citations);
        messages = [{ role: "system", content: ctx }, ...opts.messages];
      }
    }
  }

  if (useGuards) {
    // AN INPUT BLOCK USED TO BE INVISIBLE EVERYWHERE, on BOTH call paths. This
    // threw straight out of a .map() without writing an ai_events row, so the one
    // call the product refused outright left no trace at all: not in the ledger,
    // not in gate pressure, not in the cost record. The OUTPUT-side block has
    // always written its row, so refusals were half recorded, and the missing
    // half was the half that never even reached a provider.
    //
    // It matters past tidiness. "How often do we refuse a user, and which rule
    // does it" is the question the governance canon needs answered before the
    // product can honestly offer to relax a rule, and the input side is where
    // most refusals live.
    //
    // The block is detected first and handled OUTSIDE the map, because writing
    // the row is async and a throw from inside a synchronous map cannot await.
    let blockedBy: string | null = null;
    messages = messages.map((m) => {
      if (m.role !== "user") return m;
      const r = evaluateGuardrails(m.content, rules, "input");
      r.hits.forEach((h) => hits.push(h));
      if (r.blocked && !blockedBy) {
        blockedBy = r.hits.find((h) => h.action === "block")?.rule_name ?? "a safety rule";
      }
      return { ...m, content: r.text };
    });

    if (blockedBy) {
      const reason = `A safety rule blocked this: ${blockedBy}`;
      // Fail-safe: the refusal is the point, so a telemetry failure must never
      // turn a clean block into a confusing crash. Record what we can, then throw
      // the same error with the same code, so every caller behaves as before.
      try {
        const { data: blockEvt } = await supabase
          .from("ai_events")
          .insert({
            user_id: userId,
            surface: opts.surface,
            model: effectiveModel,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            est_cost_usd: 0,
            latency_ms: 0,
            status: "blocked",
            error_code: GATE_CODES.guardrail_block,
            error_message: reason,
            input_preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
          })
          .select("id")
          .single();
        const blockEventId = (blockEvt as { id: string } | null)?.id ?? null;
        if (blockEventId && hits.length) {
          await supabase.from("guardrail_hits").insert(
            hits.map((h) => ({
              user_id: userId,
              event_id: blockEventId,
              rule_id: h.rule_id,
              rule_name: h.rule_name,
              kind: h.kind,
              side: h.side,
              action: h.action,
              matched: h.matched,
            })),
          );
        }
        void noteGate(GATE_CODES.guardrail_block, {
          userId,
          surface: opts.surface,
          model: effectiveModel,
          workspaceId: opts.workspaceId ?? null,
          runId: opts.runId ?? null,
        });
      } catch (e) {
        console.error("input guardrail block telemetry failed:", e);
      }
      throw Object.assign(new Error(reason), { code: "GUARDRAIL_BLOCK" });
    }
  }

  // 2b. Soft humanization directive (prose only). The streamed output also
  // passes through the buffered humanizer below as the hard gate.
  if (opts.responseFormat !== "json_object") {
    messages = withHumanizeDirective(messages);
  }

  // 3. Provider call setup. effectiveModel (resolved above with the credit pre-check) is used
  // for dispatch, the stream, and the recorded modelUsed. Key + endpoint are resolved
  // per-attempt-model inside attemptStream() (cross-provider-fallback safe), see resolveCallKey.
  let via: "gateway" | "byo" | "cache" = "gateway";
  let provider = "lovable";
  // The wire shape of the active stream — drives SSE parsing below (Anthropic events vs
  // OpenAI deltas). Set per attempt; an anthropic-style provider (or proxy) parses as Anthropic.
  let anthropicWire = false;
  let status: "ok" | "error" | "blocked" = "ok";
  let errMsg: string | undefined;
  let fallback = false;
  let modelUsed = effectiveModel;

  // Cache for key resolution across retry attempts and fallback chain traversal.
  // This avoids re-deriving BYOK eligibility and reloading vault keys if the same
  // provider appears in multiple fallback models.
  const keyResolutionCacheStream: KeyResolutionCache = {};

  const attemptStream = async (model: string): Promise<Response> => {
    const { provider: prov } = splitModelId(model);
    const keyInfo = await resolveCallKey(
      supabase,
      userId,
      prov,
      opts.byoOverride,
      opts.workspaceId,
      opts.surface,
      keyResolutionCacheStream,
    );
    if (keyInfo) {
      const route = providerRoute(model, { baseUrl: keyInfo.baseUrl });
      if (route) {
        via = "byo";
        provider = route.provider;
        anthropicWire = route.style === "anthropic_messages";
        const safeUrl = assertSafeBaseUrl(route.url);
        if (anthropicWire) {
          const system = messages.find((m) => m.role === "system")?.content ?? "";
          const rest = messages.filter((m) => m.role !== "system");
          return fetch(safeUrl, {
            method: "POST",
            headers: {
              "x-api-key": keyInfo.apiKey,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: route.model,
              max_tokens: 2048,
              system,
              messages: rest,
              stream: true,
            }),
            signal: opts.signal,
          });
        }
        return fetch(safeUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyInfo.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: route.model,
            messages,
            stream: true,
            ...(opts.responseFormat ? { response_format: { type: opts.responseFormat } } : {}),
          }),
          signal: opts.signal,
        });
      }
    }
    via = "gateway";
    provider = "lovable";
    anthropicWire = false;
    const gw = resolveGateway(model);
    return fetch(gw.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${gw.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: gw.model,
        messages,
        stream: true,
        ...(opts.responseFormat ? { response_format: { type: opts.responseFormat } } : {}),
      }),
      signal: opts.signal,
    });
  };

  let response: Response | null = null;
  let lastErr: unknown = null;

  // ai_events.ttft_ms, written for the first time. The column has existed since
  // migration 20260522001642 and nothing has ever filled it, which is why
  // AnalyticsPanel omits the datum. Time to first token is measured from the
  // moment the first request leaves, retries and provider fallback included,
  // because that is the wait a person actually sits through. Note the two
  // clocks differ on purpose: latency_ms below is the stream read window, timed
  // from response headers, so on a very short stream ttft_ms can exceed it.
  const tDispatch = Date.now();
  let ttftMs: number | null = null;
  const markFirstToken = () => {
    if (ttftMs === null) ttftMs = Date.now() - tDispatch;
  };

  let retryAttempt = 0;
  let retryWaitedMs = 0;
  for (;;) {
    try {
      response = await attemptStream(effectiveModel);
      if (response.status === 429) {
        throw Object.assign(new Error("AI rate limit reached. Try again in a moment."), {
          code: "RATE_LIMIT",
          retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after"), Date.now()),
        });
      }
      if (response.status >= 500) {
        throw Object.assign(new Error(`AI gateway ${response.status}`), { code: "SERVER_ERROR" });
      }
      if (!response.ok) {
        throw new Error(`AI provider error (${response.status}): ${await response.text()}`);
      }
      lastErr = null;
      break;
    } catch (e) {
      lastErr = e;
      const code = (e as { code?: string }).code ?? "";
      const delay = nextRetryDelayMs({
        attempt: retryAttempt,
        code,
        retryAfterMs: (e as { retryAfterMs?: number | null }).retryAfterMs,
        spentMs: retryWaitedMs,
        budgetMs: rateLimitBudgetMs(opts.surface, opts.retryBudgetMs),
        maxAttempts: maxAttemptsFor(code, opts.surface, opts.maxRetries),
      });
      if (delay === null) break;
      await new Promise((r) => setTimeout(r, delay));
      retryWaitedMs += delay;
      retryAttempt++;
    }
  }

  if (lastErr) {
    // PROVIDER-FALLBACK: walk the ordered fallback chain (see callModel). Streaming variant;
    // a non-ok fallback response is treated as a failure and we try the next chain entry.
    const primaryErr = lastErr; // root-cause error to surface if the whole chain also fails
    const chain = resolveFallbackChain(effectiveModel, {
      fallbackModels: opts.fallbackModels,
      fallbackModel: opts.fallbackModel,
      autoFallback:
        providerFallbackEnabled() && opts.surface !== "eval" && opts.surface !== "embed"
          ? cheapestLiveModel()
          : null,
    });
    for (const fb of chain) {
      try {
        response = await attemptStream(fb);
        if (!response.ok) throw new Error(`AI fallback error (${response.status})`);
        modelUsed = fb;
        fallback = true;
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    // Chain exhausted: surface the primary's failure (the root cause), not the last
    // fallback's error, so an outage incident reports what actually went down.
    if (lastErr) lastErr = primaryErr;
  }

  if (lastErr || !response || !response.body) {
    status = "error";
    errMsg =
      lastErr instanceof Error ? lastErr.message : String(lastErr || "Failed to initiate stream");
    await logAiEvent(supabase, userId, {
      surface: opts.surface,
      surface_ref: opts.surface_ref,
      model: modelUsed,
      provider,
      via,
      status: "error",
      error_message: errMsg,
      input_preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
      system_preview: (messages.find((m) => m.role === "system")?.content ?? "").slice(0, 4000),
      trace_id: opts.traceId,
    });
    throw new Error(errMsg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let assistantText = "";
  let buffer = "";
  let promptTokens = 0;
  let completionTokens = 0;
  const tStart = Date.now();
  const messagesLength = messages.reduce((sum, m) => sum + m.content.length, 0);

  // Humanize streamed PROSE on a buffered boundary so a dash, a fence marker, or
  // a multi-byte char is never split across chunks. Skipped for JSON responses,
  // which must stay byte-exact (the consumer parses them).
  const humanizeStream = opts.responseFormat !== "json_object";
  const humanizer = createStreamHumanizer();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emitContent = (text: string) => {
        if (!text) return;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
          ),
        );
      };
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (anthropicWire) {
            buffer += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, nl).trim();
              buffer = buffer.slice(nl + 1);

              if (line.startsWith("event: ")) continue;
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  const piece = parsed.delta.text;
                  markFirstToken();
                  assistantText += piece;
                  emitContent(humanizeStream ? humanizer.push(piece) : piece);
                } else if (parsed.type === "message_start" && parsed.message?.usage) {
                  promptTokens = parsed.message.usage.input_tokens ?? promptTokens;
                } else if (parsed.type === "message_delta" && parsed.usage) {
                  completionTokens = parsed.usage.output_tokens ?? completionTokens;
                }
              } catch (e) {
                // Ignore partial JSON
              }
            }
          } else {
            // OpenAI-compatible SSE. We no longer pass raw chunks through: each
            // content delta is re-emitted after the prose sanitizer so dashes
            // and invisible chars never reach the user. Usage chunks are
            // forwarded verbatim (the consumer reads token counts off them).
            buffer += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, nl).trim();
              buffer = buffer.slice(nl + 1);
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const piece = parsed.choices?.[0]?.delta?.content;
                if (piece) {
                  markFirstToken();
                  assistantText += piece;
                  if (humanizeStream) emitContent(humanizer.push(piece));
                }
                const usage = parsed.usage;
                if (usage) {
                  promptTokens = usage.prompt_tokens ?? promptTokens;
                  completionTokens = usage.completion_tokens ?? completionTokens;
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                }
                // When not humanizing (JSON), forward the original chunk so the
                // structured payload reaches the consumer byte-exact.
                if (!humanizeStream && !usage) {
                  controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
        // Drain any held-back tail, then close the OpenAI-shaped stream.
        if (humanizeStream) emitContent(humanizer.flush());
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("[callModelStream] stream error:", e);
        controller.enqueue(encoder.encode(`data: {"error":"stream interrupted"}\n\n`));
      } finally {
        controller.close();

        // 4 & 5 & 6. Persist + Telemetry + Budget
        const finalLatency = Date.now() - tStart;
        const inTok = promptTokens || Math.ceil(messagesLength / 4);
        const outTok = completionTokens || Math.ceil(assistantText.length / 4);
        const estCost = estimateCostUsd(modelUsed, inTok, outTok);

        let outputText = assistantText;
        if (useGuards && outputText && opts.responseFormat !== "json_object") {
          const r = evaluateGuardrails(outputText, rules, "output");
          r.hits.forEach((h) => hits.push(h));
          outputText = r.text;
        }
        // Persist the humanized text so the stored preview matches what the
        // user actually received over the wire (prose only; JSON stays exact).
        if (outputText && opts.responseFormat !== "json_object") {
          outputText = humanizeText(outputText);
        }

        try {
          const { data: evt } = await supabase
            .from("ai_events")
            .insert({
              user_id: userId,
              trace_id: opts.traceId ?? null,
              parent_event_id: opts.parentEventId ?? null,
              surface: opts.surface,
              surface_ref: opts.surface_ref ?? null,
              // See the note on logGovernanceHalt above.
              ...(opts.workspaceId ? { workspace_id: opts.workspaceId } : {}),
              provider,
              via,
              model: modelUsed,
              fallback,
              prompt_tokens: inTok,
              completion_tokens: outTok,
              total_tokens: inTok + outTok,
              est_cost_usd: estCost,
              latency_ms: finalLatency,
              // Null when no token ever arrived, which is itself the fact: the
              // stream opened and produced nothing.
              ttft_ms: ttftMs,
              status: hits.some((h) => h.action === "block") ? "blocked" : "ok",
              error_code: hits.some((h) => h.action === "block")
                ? GATE_CODES.guardrail_block
                : null,
              error_message: hits.some((h) => h.action === "block")
                ? `Blocked by guardrail: ${hits.find((h) => h.action === "block")?.rule_name}`
                : null,
              input_preview: (messages.find((m) => m.role === "user")?.content ?? "").slice(0, 500),
              system_preview: (messages.find((m) => m.role === "system")?.content ?? "").slice(
                0,
                4000,
              ),
              output_preview: outputText.slice(0, 1000),
            })
            .select("id")
            .single();

          const eventId = (evt as { id: string } | null)?.id ?? null;

          if (hits.some((h) => h.action === "block")) {
            void noteGate(GATE_CODES.guardrail_block, {
              userId,
              surface: opts.surface,
              model: modelUsed,
              workspaceId: opts.workspaceId ?? null,
              runId: opts.runId ?? null,
            });
          }

          if (hits.length && eventId) {
            await supabase.from("guardrail_hits").insert(
              hits.map((h) => ({
                user_id: userId,
                event_id: eventId,
                rule_id: h.rule_id,
                rule_name: h.rule_name,
                kind: h.kind,
                action: h.action,
                side: h.side,
                matched: h.matched,
                trace_id: opts.traceId ?? null,
              })),
            );
          }

          if (!hits.some((h) => h.action === "block") && inTok + outTok > 0) {
            await incrementBudget(supabase, userId, inTok + outTok, estCost, opts.traceId ?? null);
            await incrementSurfaceBudget(
              supabase,
              userId,
              opts.surface,
              estCost,
              opts.traceId ?? null,
            );
            await recordMissionUsage(supabase, opts.runId ?? null, inTok + outTok, estCost);
            // WM-M4 seam + WM-M12 debit: account-level credit metering (live; a no-op only where the gate is off).
            await debitAccountCredits(supabase, userId, opts, estCost, eventId, modelUsed);
            // G-PRICE PR-C2: an enterprise BYOK call still accrues Supaprod's thin
            // platform fee on the rated spend, independent of the credit meter above.
            if (via === "byo") await accrueByokFee(supabase, userId, opts, estCost, eventId);
          }

          if (resolvedPrompt && eventId) {
            await logPromptRun(supabase, userId, {
              template_id: resolvedPrompt.template_id,
              version_id: resolvedPrompt.version_id,
              variant: resolvedPrompt.variant,
              event_id: eventId,
              rendered_input: messages.find((m) => m.role === "user")?.content ?? "",
            });
          }
        } catch (e) {
          console.error("[callModelStream] telemetry insert failed:", e);
        }
      }
    },
  });

  return {
    stream,
    via,
    provider,
    model: modelUsed,
  };
}
