/**
 * Embeddings chokepoint (EMBED-CHOKEPOINT).
 *
 * Every vector in Supaprod is produced HERE, so embeddings get the same governance treatment as
 * completions instead of calling the gateway directly with no oversight: a cost estimate, an
 * `ai_events` telemetry row, and BYO-key routing. It reuses the SAME shared primitives the
 * completion chokepoint (`ai/runtime.server.ts`) uses — `estimateCostUsd` (pricing.ts), `loadBYOKey`
 * (the vault), and the `ai_events` table — rather than duplicating them, so the two chokepoints stay
 * consistent. Embeddings are a distinct API shape (no messages / guardrails / JSON), so they get
 * their own thin chokepoint here rather than being forced through `callModel`.
 *
 * Context (`supabase` + `userId`) is OPTIONAL and threaded by the caller. When present the call
 * BYO-routes (an OpenAI BYO key) and logs an embed event; when absent it routes via the gateway and
 * skips logging (ai_events.user_id is NOT NULL, so an unattributed event cannot be written). Logging
 * is fail-open: a telemetry write never breaks an embedding. Uses the 1536-dim Matryoshka size so
 * vectors fit the `vector(1536)` columns our migrations define.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { estimateCostUsd } from "@/lib/ai/pricing";
import { loadBYOKey } from "@/lib/byokeys-vault.server";

const GATEWAY_EMB_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const OPENAI_EMB_URL = "https://api.openai.com/v1/embeddings";
// Cohere embed-v4 via OpenAI-compatible endpoint. 1536 dims = native max output (no schema change).
// 128K token limit handles full PRDs without truncation. Activated by COHERE_API_KEY env var.
const COHERE_EMB_URL = "https://api.cohere.ai/compatibility/v1/embeddings";
const COHERE_EMB_MODEL_RAW = "embed-v4.0"; // the model name Cohere's API expects
const COHERE_EMB_MODEL_LOG = "cohere/embed-v4.0"; // namespaced form for ai_events logging
export const EMB_MODEL = "openai/text-embedding-3-small"; // kept for back-compat; gateway uses this
export const EMB_DIMS = 1536; // unchanged — Cohere embed-v4 native max is also 1536; zero migration
const BATCH = 64;
const MAX_INPUT_CHARS = 32_000;

// In-process embedding cache: keyed by "<model>:<sha256-hex>" so a BYO model switch
// never serves a vector from a different model. TTL is 24h (model weights are stable
// within a Worker isolate lifetime; Cloudflare Workers restart frequently enough that
// the Map never grows unbounded). Eviction is opportunistic on every cache write.
const EMBED_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const embedCache = new Map<string, { vector: number[]; expiresAt: number }>();

/** Compute a short deterministic cache key for a single input string + model. */
async function embedCacheKey(model: string, text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  const hex = hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${model}:${hex}`;
}

/** Opportunistically evict expired entries. Called on every cache write to keep
 *  the Map bounded without a dedicated background timer (not available in Workers). */
function evictExpiredEmbedCache(): void {
  const now = Date.now();
  for (const [k, v] of embedCache) {
    if (v.expiresAt <= now) embedCache.delete(k);
  }
}

export type EmbedContext = {
  /** User-scoped or service client used to write the ai_events telemetry row + load a BYO key. */
  supabase?: SupabaseClient;
  /** The owner the call is attributed to; required to log (ai_events.user_id is NOT NULL). */
  userId?: string | null;
  /** ai_events.surface_ref, e.g. the source_kind being indexed. */
  surfaceRef?: string | null;
  /** Explicit BYO key override (e.g. test-running a key); else an OpenAI BYO key is auto-loaded.
   *  OpenAI-only by design (the sole BYO embeddings provider), so it always routes to the fixed,
   *  trusted OpenAI endpoint — there is deliberately no caller-supplied base URL (an arbitrary
   *  URL would send the user's key to an attacker-controlled host). */
  byoOverride?: { apiKey: string };
};

type EmbedRoute = {
  via: "gateway" | "byo";
  provider: "lovable" | "openai" | "cohere";
  url: string;
  key: string;
  /** The model id as the chosen endpoint expects it (gateway keeps the `openai/` prefix; direct
   *  OpenAI API strips it; Cohere compatibility API uses the raw model name). */
  model: string;
  /** The namespaced model string written to ai_events (e.g. "cohere/embed-v4.0"). */
  logModel: string;
};

/** chars/4 token heuristic, matching the completion estimator's spirit. Pure + total. */
export function estimateEmbedTokens(inputs: string[]): number {
  let chars = 0;
  for (const s of inputs) chars += s.length;
  return Math.ceil(chars / 4);
}

const OPENAI_MODEL = EMB_MODEL.replace(/^openai\//, "");

/**
 * Resolve which endpoint + key an embedding call uses. Priority order:
 *   1. Explicit byoOverride (test/admin override — always OpenAI endpoint)
 *   2. User's OpenAI BYO key from the vault (user-supplied, user's billing)
 *   3. COHERE_API_KEY env var → Cohere embed-v4 via OpenAI-compatible endpoint (platform default)
 *   4. Lovable gateway (absolute fallback; used until COHERE_API_KEY is set)
 *
 * Steps 1-2 respect user-supplied keys first; step 3 is the platform's preferred provider;
 * step 4 ensures the app never hard-fails even when no platform key is configured.
 */
export async function resolveEmbedRoute(opts: EmbedContext): Promise<EmbedRoute> {
  if (opts.byoOverride?.apiKey) {
    return {
      via: "byo",
      provider: "openai",
      url: OPENAI_EMB_URL,
      key: opts.byoOverride.apiKey,
      model: OPENAI_MODEL,
      logModel: EMB_MODEL,
    };
  }
  if (opts.supabase && opts.userId) {
    const byo = await loadBYOKey(opts.supabase, opts.userId, "openai");
    if (byo?.api_key) {
      return {
        via: "byo",
        provider: "openai",
        url: OPENAI_EMB_URL,
        key: byo.api_key,
        model: OPENAI_MODEL,
        logModel: EMB_MODEL,
      };
    }
  }
  // Platform's preferred embedding provider. Active once COHERE_API_KEY is set in the environment.
  // Uses Cohere's OpenAI-compatible endpoint — same request/response shape, no fetch-logic changes.
  const cohereKey = process.env.COHERE_API_KEY;
  if (cohereKey) {
    return {
      via: "byo",
      provider: "cohere",
      url: COHERE_EMB_URL,
      key: cohereKey,
      model: COHERE_EMB_MODEL_RAW,
      logModel: COHERE_EMB_MODEL_LOG,
    };
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  return {
    via: "gateway",
    provider: "lovable",
    url: GATEWAY_EMB_URL,
    key,
    model: EMB_MODEL,
    logModel: EMB_MODEL,
  };
}

async function logEmbedEvent(
  opts: EmbedContext,
  route: EmbedRoute,
  inTok: number,
  latencyMs: number,
): Promise<void> {
  // No user context -> cannot attribute (ai_events.user_id is NOT NULL). The call still routed
  // through this chokepoint; it just isn't logged until the caller threads context.
  if (!opts.supabase || !opts.userId) return;
  try {
    await opts.supabase.from("ai_events").insert({
      user_id: opts.userId,
      surface: "embed",
      surface_ref: opts.surfaceRef ?? null,
      provider: route.provider,
      via: route.via,
      model: route.logModel, // reflects the actual model used (Cohere or OpenAI), not a hardcoded constant
      prompt_tokens: inTok,
      completion_tokens: 0,
      total_tokens: inTok,
      est_cost_usd: estimateCostUsd(route.logModel, inTok, 0),
      latency_ms: latencyMs,
      status: "ok",
    });
  } catch (e) {
    // Fail-open: telemetry must never break embedding.
    console.error("embed ai_events insert failed:", e);
  }
}

export async function embedThroughChokepoint(
  inputs: string[],
  opts: EmbedContext = {},
): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const route = await resolveEmbedRoute(opts);
  const started = Date.now();
  const out: number[][] = new Array(inputs.length);
  const now = Date.now();

  // Check the in-process cache first. Collect indices that are cache misses.
  const missIndices: number[] = [];
  const missTexts: string[] = [];
  const cacheKeys: string[] = await Promise.all(
    inputs.map((text) => embedCacheKey(route.logModel, text.slice(0, MAX_INPUT_CHARS))),
  );
  for (let i = 0; i < inputs.length; i++) {
    const entry = embedCache.get(cacheKeys[i]);
    if (entry && entry.expiresAt > now) {
      out[i] = entry.vector;
    } else {
      missIndices.push(i);
      missTexts.push(inputs[i]);
    }
  }

  let usageTokens = 0;
  if (missTexts.length > 0) {
    // Batch in chunks of 64 to stay well under the 256 limit.
    for (let b = 0; b < missTexts.length; b += BATCH) {
      const slice = missTexts.slice(b, b + BATCH).map((s) => s.slice(0, MAX_INPUT_CHARS));
      const res = await fetch(route.url, {
        method: "POST",
        headers: { Authorization: `Bearer ${route.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: route.model, input: slice, dimensions: EMB_DIMS }),
      });
      if (!res.ok) {
        // Redact any echoed key material before the body reaches an error / log (defense in depth).
        const body = (await res.text()).slice(0, 200).replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");
        throw new Error(`embeddings ${res.status}: ${body}`);
      }
      const j = (await res.json()) as {
        data: { embedding: number[]; index: number }[];
        usage?: { prompt_tokens?: number; total_tokens?: number };
      };
      for (const row of j.data) {
        const globalIdx = missIndices[b + row.index];
        out[globalIdx] = row.embedding;
        // Populate cache; evict expired entries on every write to keep Map bounded.
        embedCache.set(cacheKeys[globalIdx], {
          vector: row.embedding,
          expiresAt: Date.now() + EMBED_CACHE_TTL_MS,
        });
      }
      evictExpiredEmbedCache();
      usageTokens += j.usage?.prompt_tokens ?? j.usage?.total_tokens ?? 0;
    }
  }

  // Log only the tokens actually sent to the API (cache hits are free).
  if (missTexts.length > 0) {
    const inTok = usageTokens > 0 ? usageTokens : estimateEmbedTokens(missTexts);
    await logEmbedEvent(opts, route, inTok, Date.now() - started);
  }
  return out;
}

// Back-compat wrappers: existing callers pass no opts and behave exactly as before (gateway, no
// logging); callers that thread context get BYO routing + embed telemetry.
export async function embedTexts(inputs: string[], opts: EmbedContext = {}): Promise<number[][]> {
  return embedThroughChokepoint(inputs, opts);
}

export async function embedOne(text: string, opts: EmbedContext = {}): Promise<number[]> {
  const [v] = await embedThroughChokepoint([text], opts);
  return v;
}
