import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSkillpack, clampSkillpackLimit, type SkillpackLessonInput } from "./skillpack";
import { supersededChildIds, type LineageEdgeLite } from "./trust-ledger.functions";
import { screenIngestText, INGEST_REVIEW_TAG } from "./ingest-guardrails";
import { OutcomeContractSchema } from "./discovery.functions";
import { buildArdDocument, type ArdDesignSection } from "./ard-schema";
import { MCP_WRITE_SCOPES } from "./mcp-protocol";
import { loadDesignDispatchContext } from "@/lib/build/design-gate.server";

/**
 * Q1-MCP · Read-only MCP (Model Context Protocol) server functions.
 *
 * External agents call Supaprod via MCP to read signals/opportunities/decisions/
 * PRDs/roadmap and export a decision-lessons skill pack, governed by workspace
 * scope, rate limits, and audit. The decision-WRITE half is founder-gated
 * (Phase 4b) and is intentionally not exposed here.
 */

export interface MCPTokenInfo {
  id: string;
  workspace_id: string;
  slug: string;
  rate_limit_per_min: number;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Token Management (workspace scoped, auth required)
// ─────────────────────────────────────────────────────────────────────

export const listMCPTokens = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspace_id: z.string().uuid(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: tokens, error } = await supabase
      .from("mcp_tokens")
      .select("id,workspace_id,slug,rate_limit_per_min,created_at,last_used_at,revoked_at")
      .eq("workspace_id", data.workspace_id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (tokens ?? []) as MCPTokenInfo[];
  });

export const issueMCPToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspace_id: z.string().uuid(),
        slug: z.string().min(1).max(100),
        rate_limit_per_min: z.number().int().min(1).max(1000).optional(),
        // INTEROP-V11 Q2: capability scopes. Still an allow-list, so a token can
        // never be minted with an arbitrary scope string; default [] =
        // read-only. A write scope is INERT until the global
        // interop_write_enabled() gate is flipped on.
        //
        // TAKEN FROM WRITE_SCOPE_BY_TOOL RATHER THAN LISTED AGAIN. This was a
        // hand-kept second copy reading `["write:signal"]`, and when the write
        // layer grew from one tool to four on 2026-08-10 it was never widened.
        // record_decision, draft_spec and settle_outcome were catalogued,
        // dispatched, scope-checked and unit-tested while being impossible to
        // authorize through the product: the only tokens in production carrying
        // write:decision were minted by calling the SQL RPC directly, around
        // this validator. Deriving the list means a new write tool is mintable
        // the day it is added, and mcp-protocol.test.ts pins the two together.
        scopes: z.array(z.enum(MCP_WRITE_SCOPES as unknown as [string, ...string[]])).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    // requireSupabaseAuth puts the caller on context.userId (not context.auth);
    // the old `auth.user.id` threw "Cannot read properties of undefined
    // (reading 'user')", which 500'd every token issue and made the whole MCP
    // server unreachable (no token could ever be minted).
    const { supabase, userId } = context;
    if (!userId) throw new Error("Unauthorized");

    // Generate random secret and hash
    const crypto = await import("crypto");
    const secret = crypto.randomBytes(32).toString("hex");
    const secretHash = crypto.createHash("sha256").update(secret).digest("hex");

    const { data: token, error } = await supabase.rpc("issue_mcp_token", {
      _workspace_id: data.workspace_id,
      _user_id: userId,
      _slug: data.slug,
      _secret_hash: secretHash,
      _rate_limit_per_min: data.rate_limit_per_min || 60,
      _scopes: data.scopes ?? [],
    });

    if (error) throw new Error(error.message);

    // Return token only once (never stored plaintext)
    return {
      token_id: (token as { id: string }).id,
      display_token: `${data.slug}:${secret}`,
      slug: data.slug,
      created_at: (token as { created_at: string }).created_at,
    };
  });

export const revokeMCPToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        token_id: z.string().uuid(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.rpc("revoke_mcp_token", {
      _token_id: data.token_id,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─────────────────────────────────────────────────────────────────────
// Audit Logging (service-role only, called from MCP route)
// ─────────────────────────────────────────────────────────────────────

export interface LogAPICallInput {
  token_id: string;
  workspace_id: string;
  tool_name: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  result: "success" | "rate_limit" | "not_found" | "error" | "permission_denied";
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Server-side only: log an MCP tool call to the audit trail.
 * Used by the /api/mcp route handler (service-role context).
 */
export async function logMCPCall(input: LogAPICallInput, supabaseClient: any) {
  const { error } = await supabaseClient.rpc("log_api_call", {
    _token_id: input.token_id,
    _workspace_id: input.workspace_id,
    _tool_name: input.tool_name,
    _input_tokens: input.input_tokens || 0,
    _output_tokens: input.output_tokens || 0,
    _cost_usd: input.cost_usd || 0,
    _result: input.result,
    _error_message: input.error_message || null,
    _metadata: input.metadata || {},
  });

  if (error) {
    console.error("Failed to log API call:", error);
    return null;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// MCP Tool Implementations (read-only)
// ─────────────────────────────────────────────────────────────────────

/**
 * PURE. Sanitize a caller-supplied keyword before it is interpolated into a
 * PostgREST `.or(...)` filter string. The `.or()` grammar is a comma-separated
 * list of conditions with parenthesized nesting, so a raw comma/paren/backslash
 * in the query could inject an extra OR branch (e.g. an always-true condition
 * that widens the result set within the caller's own workspace). The tenant
 * boundary still holds (workspace_id is a separate AND'd filter), but we strip
 * the structural characters so the keyword can only ever be a literal `ilike`
 * pattern. `%`/`_` are left intact — they are the intended wildcards.
 */
export function sanitizeIlikeQuery(query: string | null | undefined): string {
  return (query ?? "").replace(/[,()\\]/g, "").trim();
}

/**
 * Search signals by keyword, theme, or product.
 * Called by the MCP server route handler.
 */
export async function searchSignals(
  supabaseClient: any,
  workspace_id: string,
  query: string,
  limit: number = 20,
  offset: number = 0,
) {
  // Live-schema-correct projection (verified against the production schema): the
  // body column is `content` (not `summary`), and there is no `products` table to
  // embed. Safe projection — no owner/workspace ids leak to the external caller.
  let q = supabaseClient
    .from("signals")
    .select("id, title, source, content, product_id, created_at")
    .eq("workspace_id", workspace_id);

  const safe = sanitizeIlikeQuery(query);
  if (safe) {
    q = q.or(`title.ilike.%${safe}%, content.ilike.%${safe}%`);
  }

  const { data, error } = await q
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Search opportunities by keyword or ICE criteria.
 * Called by the MCP server route handler.
 */
export async function searchOpportunities(
  supabaseClient: any,
  workspace_id: string,
  query: string,
  min_ice: number = 0,
  limit: number = 20,
  offset: number = 0,
) {
  // Live-schema-correct projection: the ICE column is `ice_score` (not
  // `predicted_ice`) and the roadmap column is `roadmap_bucket` (not
  // `roadmap_status`). Safe projection — no owner/workspace ids.
  let q = supabaseClient
    .from("opportunities")
    .select("id, title, problem, hypothesis, ice_score, roadmap_bucket, created_at")
    .eq("workspace_id", workspace_id);

  const safe = sanitizeIlikeQuery(query);
  if (safe) {
    q = q.or(`title.ilike.%${safe}%, problem.ilike.%${safe}%`);
  }
  // Only apply the ICE floor when a real minimum is requested. `ice_score >= 0`
  // would silently drop unscored (NULL ICE) opportunities — `NULL >= 0` is NULL,
  // so they would vanish from a default (min_ice = 0) search.
  if (min_ice > 0) {
    q = q.gte("ice_score", min_ice);
  }

  const { data, error } = await q
    .range(offset, offset + limit - 1)
    .order("ice_score", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * PURE (INTEROP-V11). Tag each decision with its honest provenance outcome
 * ("standing" | "superseded") from the supersession map — the same bitemporal
 * rule as the Trust Ledger, so the MCP read and the in-app ledger never disagree.
 */
export function applyDecisionOutcomes<T extends { id: string }>(
  decisions: T[] | null | undefined,
  superseded: Map<string, string>,
): (T & { outcome: "standing" | "superseded" })[] {
  return (Array.isArray(decisions) ? decisions : []).map((d) => ({
    ...d,
    outcome: superseded.has(d.id) ? ("superseded" as const) : ("standing" as const),
  }));
}

/**
 * INTEROP-V11 · Read-only decision-brain access for external agents. Returns the
 * workspace's decisions (safe projection — no owner/workspace/linked ids) each
 * tagged with its standing/superseded outcome, so a peer agent can query "what
 * did this team decide, and did it hold up?". Workspace-scoped + audited like the
 * other MCP read tools. Called by the MCP server route handler.
 */
export async function searchDecisions(
  supabaseClient: any,
  workspace_id: string,
  query: string,
  limit: number = 20,
  offset: number = 0,
) {
  let q = supabaseClient
    .from("decisions")
    .select("id, title, rationale, status, source_kind, decided_by_agent_slug, created_at")
    .eq("workspace_id", workspace_id);

  const safe = sanitizeIlikeQuery(query);
  if (safe) {
    q = q.or(`title.ilike.%${safe}%, rationale.ilike.%${safe}%`);
  }

  const { data: rows, error } = await q
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const decisions = (rows || []) as Array<{ id: string }>;

  // The honest provenance outcome via the bitemporal lineage. Tolerant: any error
  // (incl. a pre-migration missing valid_to) leaves every decision "standing".
  let superseded = new Map<string, string>();
  if (decisions.length) {
    const { data: edges, error: lErr } = await supabaseClient
      .from("artifact_lineage")
      .select("parent_id, child_id, relation, valid_to")
      .eq("workspace_id", workspace_id)
      .in(
        "child_id",
        decisions.map((d) => d.id),
      )
      .in("relation", ["supersedes", "contradicts"]);
    if (!lErr && edges) superseded = supersededChildIds(edges as unknown as LineageEdgeLite[]);
  }
  return applyDecisionOutcomes(decisions as Array<{ id: string }>, superseded);
}

/**
 * Get a specific PRD (spec) by ID.
 * Called by the MCP server route handler.
 *
 * Live-schema-correct: the table is `prds` (not `prd`) and the spec body is
 * `body_md` (the columns `definition`/`acceptance_criteria`/`success_metrics`
 * never existed in production). Safe projection — no owner/workspace ids.
 */
export async function getPRD(supabaseClient: any, workspace_id: string, prd_id: string) {
  const { data: prd, error: prdError } = await supabaseClient
    .from("prds")
    .select("id, title, opportunity_id, status, body_md, created_at, shipped_at")
    .eq("workspace_id", workspace_id)
    .eq("id", prd_id)
    .single();

  if (prdError) throw new Error("PRD not found");
  return prd;
}

/**
 * PURE. The design section `get_ard` returns: the design station's own output,
 * projected for a READER rather than for a dispatch budget.
 *
 * `toArdDesignSection` (build/design-gate.ts) exists for the other half of this
 * and caps `scaffold_html` at `ARD_SCAFFOLD_HTML_CAP`, which is right when the
 * section is about to ride inside a work order that has a token budget. It is
 * wrong here. `get_ard` is the RECOVERY path the work order's own omission
 * notice points a dispatched agent at, so capping the mockup here would mean
 * the recovery hands back the same partial value the reader came to escape.
 * Hence the deliberate duplication: same shape, no cap.
 */
type DesignReadContext = {
  memory: Array<{ category: string; title: string; content: string }>;
  flow: { steps: unknown } | null;
  scaffoldHtml: string | null;
};

function designSectionForRead(ctx: DesignReadContext | null): ArdDesignSection | null {
  if (!ctx) return null;
  const memory = ctx.memory.map((m) => ({
    category: m.category,
    title: m.title,
    content: m.content,
  }));
  const flow_steps = ctx.flow?.steps ?? null;
  const scaffold_html = ctx.scaffoldHtml ?? null;
  if (memory.length === 0 && flow_steps == null && scaffold_html == null) return null;
  return { memory, flow_steps, scaffold_html };
}

/**
 * CNV-03 · fetch a spec's Outcome Contract wrapped as a portable ARD document.
 * The dispatch-time counterpart to `get_prd`: `get_prd` never exposed
 * `contract` (it predates CNV-01), so this is the one MCP read path that
 * hands a dispatched agent the same structured acceptance contract Supaprod
 * itself checks a build against, instead of the narrative body.
 *
 * It also carries the DESIGN section (mission 3.4's shape, wired here
 * 2026-08-05). It did not before, and that was the second half of the mockup
 * defect: when the work-order ARD block ran out of budget it told the agent to
 * "fetch it with the MCP get_ard tool", and this function returned an envelope
 * with no design key at all. The notice named a recovery that could not
 * recover, which is a control promising an act it cannot perform. Nothing
 * caught it because the two halves were written months apart and no test
 * asserted the promise and the tool agreed.
 */
export async function getArdDocument(
  supabaseClient: any,
  workspace_id: string,
  prd_id: string,
  origin: string,
) {
  const { data: prd, error } = await supabaseClient
    .from("prds")
    .select("id, title, contract")
    .eq("workspace_id", workspace_id)
    .eq("id", prd_id)
    .single();

  if (error) throw new Error("PRD not found");
  // `.partial()` first (same defensive idiom discovery.functions.ts uses for
  // every other `prds.contract` read): an empty `{}` default must not throw,
  // it means "not structured yet". Only once `intent` is present do we know a
  // real contract was applied (CNV-01/04's write path always stamps every
  // required field atomically), so the full parse below is safe.
  const partial = OutcomeContractSchema.partial().safeParse(prd.contract ?? {});
  if (!partial.success || !partial.data.intent?.trim()) {
    throw new Error("This spec has no Outcome Contract yet");
  }
  const contract = OutcomeContractSchema.parse(partial.data);
  // Every read inside `loadDesignDispatchContext` degrades to empty rather than
  // throwing, so a spec whose design station never ran still returns its
  // contract exactly as it did before this section existed.
  const designCtx = await loadDesignDispatchContext(supabaseClient, {
    id: prd.id,
    workspace_id,
  });
  return buildArdDocument(
    origin,
    prd.id,
    prd.title,
    contract,
    undefined,
    designSectionForRead(designCtx),
  );
}

/**
 * INTEROP-V11 · Read-only SPEC DISCOVERY for external agents. `get_prd` needs the
 * exact id; this lets a peer agent FIND specs by keyword (title or body) and/or
 * status, the missing half of the spec-read surface. Workspace-scoped + audited
 * like the other MCP read tools. Called by the MCP server route handler.
 */
export async function searchPRDs(
  supabaseClient: any,
  workspace_id: string,
  query: string,
  status: string = "",
  limit: number = 20,
  offset: number = 0,
) {
  let q = supabaseClient
    .from("prds")
    .select("id, title, status, opportunity_id, created_at, shipped_at")
    .eq("workspace_id", workspace_id);

  const safe = sanitizeIlikeQuery(query);
  if (safe) {
    q = q.or(`title.ilike.%${safe}%, body_md.ilike.%${safe}%`);
  }
  if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export type RoadmapItemLite = {
  id: string;
  title: string;
  ice_score: number | null;
  roadmap_bucket: string | null;
};

export type RoadmapView = {
  now: RoadmapItemLite[];
  next: RoadmapItemLite[];
  later: RoadmapItemLite[];
  unbucketed: RoadmapItemLite[];
};

/**
 * PURE (INTEROP-V11). Group opportunities into the roadmap buckets an external
 * agent expects (now / next / later), with everything else under `unbucketed`
 * (the bucket is optional in the live schema, so this is honest, not empty).
 * Within a bucket, highest ICE first.
 */
export function groupByRoadmapBucket(rows: RoadmapItemLite[] | null | undefined): RoadmapView {
  const view: RoadmapView = { now: [], next: [], later: [], unbucketed: [] };
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r.id !== "string" || !r.id) continue;
    // String() coerces a non-string bucket (a future/misconfigured column type)
    // safely to "unbucketed" instead of throwing on .trim().
    const bucket = String(r.roadmap_bucket ?? "")
      .trim()
      .toLowerCase();
    if (bucket === "now") view.now.push(r);
    else if (bucket === "next") view.next.push(r);
    else if (bucket === "later") view.later.push(r);
    else view.unbucketed.push(r);
  }
  const byIce = (a: RoadmapItemLite, b: RoadmapItemLite) => (b.ice_score ?? 0) - (a.ice_score ?? 0);
  view.now.sort(byIce);
  view.next.sort(byIce);
  view.later.sort(byIce);
  view.unbucketed.sort(byIce);
  return view;
}

/**
 * INTEROP-V11 · Read-only ROADMAP access for external agents — the workspace's
 * opportunities arranged into now/next/later buckets (+ unbucketed), highest ICE
 * first. Workspace-scoped + audited. Called by the MCP server route handler.
 */
export async function getRoadmap(
  supabaseClient: any,
  workspace_id: string,
  limit: number = 200,
): Promise<RoadmapView> {
  const capped = Math.max(1, Math.min(limit, 500));
  const { data, error } = await supabaseClient
    .from("opportunities")
    .select("id, title, ice_score, roadmap_bucket")
    .eq("workspace_id", workspace_id)
    .order("ice_score", { ascending: false })
    .limit(capped);

  if (error) throw new Error(error.message);
  return groupByRoadmapBucket((data ?? []) as RoadmapItemLite[]);
}

/**
 * Export a versioned skill pack: the workspace's distilled outcome->lesson
 * `learnings` (validated / missed / mixed decisions, with the ICE move each
 * caused), bundled by the pure `buildSkillpack` into a deterministic,
 * content-fingerprinted envelope an external agent can load as context.
 *
 * Scoped EXPLICITLY by `workspace_id` (the MCP route runs service-role, so the
 * `.eq("workspace_id", ...)` filter is the tenant boundary, not RLS), mirroring
 * the other read tools. Read-only: no writes, no AI, no spend.
 */
export async function exportSkillpack(supabaseClient: any, workspace_id: string, limit?: number) {
  const cap = clampSkillpackLimit(limit);
  // The `id` secondary sort is LOAD-BEARING for the content_hash promise, not
  // cosmetic: `ORDER BY created_at DESC LIMIT cap` alone returns an arbitrary
  // subset of any rows whose created_at ties at the LIMIT boundary, so two
  // exports of an UNCHANGED workspace (>cap learnings, millisecond-clustered
  // timestamps) could fetch different boundary rows and hash differently. Adding
  // `id ASC` matches buildSkillpack's in-memory tiebreak, so the DB top-N is
  // stable and the version fingerprint is reproducible.
  //
  // Tenant scope: `.eq("workspace_id", ...)` on `learnings` is the only boundary
  // (the route runs service-role, RLS OFF). The `opportunity` embed has no
  // workspace predicate, so it is safe ONLY because a learning is co-tenant with
  // its opportunity by construction (recordOutcome writes both from one PRD; WM-F6
  // move_product reassigns them in lockstep). A future migration that lets a
  // learning point at a cross-workspace opportunity would need its own guard here.
  const { data, error } = await supabaseClient
    .from("learnings")
    .select(
      "id, verdict, summary, prior_ice, new_ice, created_at, opportunity:opportunities(title)",
    )
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(cap);

  if (error) throw new Error(error.message);

  // Flatten the to-one opportunity embed (PostgREST may widen it to an array),
  // mirroring getCompounding/listLearnings so the wire shape stays flat.
  type Wire = {
    id: string;
    verdict: string;
    summary: string | null;
    prior_ice: number | string | null;
    new_ice: number | string | null;
    created_at: string;
    opportunity: { title: string | null } | { title: string | null }[] | null;
  };
  const lessons: SkillpackLessonInput[] = ((data ?? []) as Wire[]).map(
    ({ opportunity, ...rest }) => {
      const opp = Array.isArray(opportunity) ? opportunity[0] : opportunity;
      return {
        id: rest.id,
        verdict: rest.verdict,
        summary: rest.summary ?? "",
        prior_ice: rest.prior_ice,
        new_ice: rest.new_ice,
        created_at: rest.created_at,
        opportunity_title: opp?.title ?? null,
      };
    },
  );

  return buildSkillpack({
    workspaceId: workspace_id,
    lessons,
    generatedAt: new Date().toISOString(),
    limit: cap,
  });
}

/**
 * RPT-16 · Given an initiative (an opportunity's name or a keyword), return
 * its recorded outcome history: every learning tied to a matching
 * opportunity, newest first — so an external agent can ask "has a bet like
 * this one turned out well before?" mid-run. An empty/absent initiative
 * returns the workspace's most recent outcomes overall. Workspace-scoped +
 * audited like the other read tools; reuses the same learnings->opportunities
 * embed shape exportSkillpack already established, so the wire format is
 * consistent across tools.
 */
export async function outcomeHistory(
  supabaseClient: any,
  workspace_id: string,
  initiative: string,
  limit: number = 20,
) {
  const safe = sanitizeIlikeQuery(initiative);

  // Resolve to opportunity ids first (rather than filtering the embedded
  // relation directly) - a plain .eq/.ilike/.in on a base table is the
  // established, verified-working pattern in this codebase; filtering
  // PostgREST's embedded-resource columns needs syntax this codebase does
  // not otherwise use, so this avoids introducing an unverified query shape.
  let opportunityIds: string[] | null = null;
  if (safe) {
    const { data: opps, error: oErr } = await supabaseClient
      .from("opportunities")
      .select("id")
      .eq("workspace_id", workspace_id)
      .ilike("title", `%${safe}%`)
      .limit(500);
    if (oErr) throw new Error(oErr.message);
    const ids = (opps ?? []).map((o: { id: string }) => o.id as string);
    if (ids.length === 0) return [];
    opportunityIds = ids;
  }

  let q = supabaseClient
    .from("learnings")
    .select(
      "id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, opportunity:opportunities(title)",
    )
    .eq("workspace_id", workspace_id);
  if (opportunityIds) q = q.in("opportunity_id", opportunityIds);

  const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);

  type Wire = {
    id: string;
    verdict: string;
    summary: string | null;
    metric_label: string | null;
    metric_value: string | null;
    prior_ice: number | string | null;
    new_ice: number | string | null;
    created_at: string;
    opportunity: { title: string | null } | { title: string | null }[] | null;
  };
  return ((data ?? []) as Wire[]).map(({ opportunity, ...rest }) => ({
    ...rest,
    initiative: (Array.isArray(opportunity) ? opportunity[0]?.title : opportunity?.title) ?? null,
  }));
}

// ─────────────────────────────────────────────────────────────────────
// INTEROP-V11 · Q2 — the GOVERNED WRITE tool (ingest_signal).
//
// An external / peer agent contributes a discovery signal into a workspace. The
// route enforces the scope + dormant-gate authorization BEFORE calling this; here
// we (1) re-screen the attacker-controlled text for prompt injection exactly as
// the public ingest-webhook door does, and (2) insert with the SAME column shape
// createSignal/ingest-signals use (schema verified against prod), stamping the
// token's user_id + workspace_id so the tenant boundary can never be spoofed by
// the caller. Pure-ish: all I/O is the single screened insert.
// ─────────────────────────────────────────────────────────────────────

export type IngestSignalArgs = { title?: unknown; content?: unknown; source?: unknown };

export type IngestSignalResult =
  | { status: "stored" | "flagged"; created: 1; quarantined: 0 }
  | { status: "quarantined"; created: 0; quarantined: 1 };

// Matches the F-V5-INGEST-WEBHOOK caps so the two doors agree.
const ingestSignalSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(5000).optional(),
  source: z.string().max(40).optional(),
});

/**
 * Validate + injection-screen + insert ONE governed signal. `workspace_id` and
 * `user_id` come from the validated token (never from the caller). Throws on a
 * validation error (the route reports it as a tool execution error); a structural
 * injection is quarantined (never stored) rather than thrown.
 */
export async function ingestSignal(
  supabaseClient: any,
  workspace_id: string,
  user_id: string,
  args: IngestSignalArgs,
): Promise<IngestSignalResult> {
  const parsed = ingestSignalSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("expected { title: string, content?: string, source?: string }");
  }
  const { title, content, source } = parsed.data;

  // Screen ALL attacker-controlled free text that reaches downstream agent
  // context (title + content + source — the reactor copies `source` into the
  // event payload). Reuses the structural-gate classifier, so an item merely
  // QUOTING an injection is stored, while a fence-breakout / forged-system-turn
  // is rejected and never persisted.
  const decision = screenIngestText(`${title} ${content ?? ""} ${source ?? ""}`);
  if (decision === "quarantine") {
    return { status: "quarantined", created: 0, quarantined: 1 };
  }

  const { error } = await supabaseClient.from("signals").insert({
    user_id,
    workspace_id,
    title,
    content: content?.trim() || title, // signals.content is NOT NULL — fall back to title
    source: source?.trim() || "mcp",
    tags: decision === "flag" ? [INGEST_REVIEW_TAG] : [],
  });
  if (error) throw new Error(error.message);

  return decision === "flag"
    ? { status: "flagged", created: 1, quarantined: 0 }
    : { status: "stored", created: 1, quarantined: 0 };
}

// ───────────────────────────────────────────────────────────────────────────
// THE REST OF THE LOOP, for an agent (founder ruling 2026-08-10).
//
// The agent surface read eleven things and wrote ONE, into station 01. An
// agent could hand us a signal and could not do any of the work, while the
// product's own agents run on a 36-tool registry. These three close that gap:
// record a decision, draft a spec, settle an outcome.
//
// EVERY ONE OF THEM REUSES A VERIFIED-LIVE PATH, because the last write tool
// this endpoint shipped did not. `append_decision` was advertised in
// tools/list, was callable, and targeted a `decision_queue` table and columns
// absent from the schema, so it could never succeed. It was removed
// 2026-06-24. `settle_outcome` therefore calls `applyOutcome`, the same
// function the human path calls, rather than inserting into `learnings`
// itself.
//
// THREE PROPERTIES HOLD ACROSS ALL THREE, and each is deliberate:
//
//   TENANCY IS NEVER CALLER-SUPPLIED. workspace_id and user_id come from the
//   token. zod strips extra args, so a caller cannot name a workspace it does
//   not hold.
//
//   FREE TEXT IS SCREENED. Everything an agent writes lands in a human's
//   reading pane and in later agent context, so all of it goes through
//   `screenIngestText`: a structural injection is REJECTED and never stored, a
//   borderline one is stored flagged.
//
//   NOTHING LANDS FINISHED. A decision arrives 'pending' and a spec arrives
//   'draft'. An agent proposes; a human disposes. That is the graduated-
//   autonomy posture the product already takes at every other gate, and an
//   agent surface that could land an approved decision would be a hole in it.
// ───────────────────────────────────────────────────────────────────────────

const recordDecisionSchema = z.object({
  title: z.string().min(1).max(300),
  rationale: z.string().max(4000).optional(),
  agent_slug: z.string().max(80).optional(),
});

export type RecordDecisionResult = {
  status: "stored" | "flagged" | "quarantined";
  id: string | null;
};

export async function recordDecision(
  supabaseClient: any,
  workspace_id: string,
  user_id: string,
  args: unknown,
): Promise<RecordDecisionResult> {
  const parsed = recordDecisionSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("expected { title: string, rationale?: string, agent_slug?: string }");
  }
  const { title, rationale, agent_slug } = parsed.data;

  const decision = screenIngestText(`${title} ${rationale ?? ""}`);
  if (decision === "quarantine") return { status: "quarantined", id: null };

  const { data, error } = await supabaseClient
    .from("decisions")
    .insert({
      user_id,
      workspace_id,
      title,
      rationale: rationale?.trim() || null,
      // Pending, always. See the header: an agent proposes.
      status: "pending",
      // 'mcp' is a real allowed value as of migration 20260810160000. Writing
      // 'manual' here would have been the tempting shortcut and it asserts a
      // HUMAN authored it, which `isAgentDrafted` reads as "do not score this
      // as an agent correction" -- making an agent's own decisions invisible
      // to the flywheel that ranks agents.
      source_kind: "mcp",
      decided_by_agent_slug: agent_slug?.trim() || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return { status: decision === "flag" ? "flagged" : "stored", id: (data?.id as string) ?? null };
}

const draftSpecSchema = z.object({
  title: z.string().min(1).max(300),
  body_md: z.string().max(20000).optional(),
  opportunity_id: z.string().uuid().optional(),
});

export type DraftSpecResult = {
  status: "stored" | "flagged" | "quarantined";
  id: string | null;
};

export async function draftSpec(
  supabaseClient: any,
  workspace_id: string,
  user_id: string,
  args: unknown,
): Promise<DraftSpecResult> {
  const parsed = draftSpecSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("expected { title: string, body_md?: string, opportunity_id?: uuid }");
  }
  const { title, body_md, opportunity_id } = parsed.data;

  const decision = screenIngestText(`${title} ${body_md ?? ""}`);
  if (decision === "quarantine") return { status: "quarantined", id: null };

  const { data, error } = await supabaseClient
    .from("prds")
    .insert({
      user_id,
      workspace_id,
      title,
      body_md: body_md?.trim() || null,
      // Draft, always. 'approved' and 'shipped' are human states, and
      // `assertSpecStatusWrite` exists precisely to stop a status write
      // contradicting a record already on the books.
      status: "draft",
      opportunity_id: opportunity_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return { status: decision === "flag" ? "flagged" : "stored", id: (data?.id as string) ?? null };
}

const settleOutcomeSchema = z.object({
  prd_id: z.string().uuid(),
  verdict: z.enum(["validated", "missed", "mixed"]),
  summary: z.string().min(1).max(2000),
  metric_label: z.string().max(200).optional(),
  metric_value: z.string().max(200).optional(),
  agent_slug: z.string().max(80).optional(),
});

export type SettleOutcomeResult = {
  status: "stored" | "quarantined";
  learningId: string | null;
};

export async function settleOutcome(
  supabaseClient: any,
  _workspace_id: string,
  user_id: string,
  args: unknown,
): Promise<SettleOutcomeResult> {
  const parsed = settleOutcomeSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      "expected { prd_id: uuid, verdict: validated|missed|mixed, summary: string, metric_label?: string, metric_value?: string }",
    );
  }
  const p = parsed.data;

  const screened = screenIngestText(`${p.summary} ${p.metric_label ?? ""} ${p.metric_value ?? ""}`);
  if (screened === "quarantine") return { status: "quarantined", learningId: null };

  // THE SAME FUNCTION THE HUMAN PATH CALLS. `recordOutcome` is a thin wrapper
  // over `applyOutcome`, so this is not a parallel implementation of the moat
  // path -- it is the moat path, entered from a different door. Dynamic import
  // keeps outcome.functions.ts out of this module's import-time graph.
  //
  // `by.kind: "agent"` is load-bearing rather than decorative: applyOutcome
  // REFUSES to overwrite a verdict already on the record when the caller is an
  // agent. An agent had its chance before the row was settled; disagreeing
  // afterwards is a person's move, not an API call's.
  //
  // `_workspace_id` is unused on purpose: applyOutcome resolves the workspace
  // from the spec itself, which is stricter than trusting the token's. A spec
  // in another workspace is refused by RLS on its own read.
  const { applyOutcome } = await import("@/lib/outcome.functions");
  const res = await applyOutcome(supabaseClient, user_id, {
    prdId: p.prd_id,
    verdict: p.verdict,
    summary: p.summary,
    metricLabel: p.metric_label ?? null,
    metricValue: p.metric_value ?? null,
    by: {
      kind: "agent",
      slug: p.agent_slug?.trim() || "mcp-agent",
      // THE DECISION RECORD SAYS WHAT ACTUALLY HAPPENED, and refuses to
      // fabricate the one thing it does not know.
      //
      // `SettlementDecision` is the shape the autonomous sweep produces after
      // running `decideSettlement` over evidence, stakes and impact. An
      // external agent calling this tool has NOT run that classifier: it was
      // granted the write:outcome scope by a person and it is exercising it.
      // Filling `evidence` and `stakes` with plausible numbers would put
      // invented scores on the permanent record, in the exact fields a human
      // reads before deciding whether to overturn.
      //
      // So the scores are ZERO, which is the truthful reading of "no evidence
      // model was run", and `because` says so in words rather than leaving a
      // reader to infer it from three zeroes.
      decision: {
        action: "settle",
        evidence: 0,
        stakes: 0,
        required: 0,
        reason: `Settled through the agent API by ${p.agent_slug?.trim() || "mcp-agent"} under an explicit write:outcome grant.`,
        because: [
          "Recorded through POST /api/mcp with a scoped token, not by the autonomous settle-or-ask sweep.",
          "No evidence or stakes model was run for this write, so those scores are zero rather than estimated.",
          "The workspace owner granted the write:outcome scope that permitted it.",
        ],
      },
    },
  });
  return {
    status: "stored",
    learningId: (res as { learningId?: string | null })?.learningId ?? null,
  };
}
