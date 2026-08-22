import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSkillpack, clampSkillpackLimit, type SkillpackLessonInput } from "./skillpack";
import { supersededChildIds, type LineageEdgeLite } from "./trust-ledger.functions";
import { screenIngestText, INGEST_REVIEW_TAG } from "./ingest-guardrails";
import { OutcomeContractSchema } from "./discovery.functions";
// The forecast rules, from the one place that owns them. Both the human door
// (`createDecision`, `setDecisionForecastSchema`) and the agent door
// (`decision.record`) wire this same function rather than re-deriving it, which
// is why all three can be asserted to reach identical verdicts.
import { forecastRefusal } from "./decisions.functions";
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

/**
 * THE REFUSAL, WORD FOR WORD FROM THE INTERNAL DOOR.
 *
 * `decision.record` (lib/ai/tools/registry.server.ts) carries this exact string
 * on all three forecast fields, and the reasoning for it lives there: the tool
 * loop hands `error.message` straight back to the model, so whatever is written
 * here is the entire explanation a caller gets, and zod's default "Required"
 * teaches the shape rather than the point.
 *
 * IT IS DUPLICATED RATHER THAN IMPORTED, and that is a deliberate trade with a
 * guard on it. `registry.server.ts` pulls in the whole agent runtime, and this
 * module is reachable from client bundles through its `createServerFn` exports,
 * so importing it here would drag the tool registry into the browser graph — the
 * same reason `settleOutcome` below reaches `applyOutcome` by dynamic import.
 * The copy is pinned instead: `mcp-record-decision-drift.test.ts` parses the
 * same bad input through both doors and asserts the messages are byte-identical,
 * so the day one of them is reworded the other fails rather than drifting.
 */
const FORECAST_REQUIRED =
  "A decision needs a forecast, and this one has none. Give all three parts: forecast_claim (what you expect to happen), forecast_how_we_will_know (the observable that will settle it), and forecast_horizon_date (an ISO 8601 timestamp with offset, in the future). A decision with no forecast is an opinion, not a bet. It is the one thing about a decision that cannot be reconstructed afterwards, so it is recorded now or it is never recorded at all.";

/**
 * ── THE HEADLESS DOOR WAS THE WEAKER ONE INTO THE SAME TABLE (2026-08-22) ──
 *
 * `decision.record` was tightened on 2026-08-22 to refuse a decision with no
 * rationale, no rejected alternative, or no forecast. This schema still asked
 * for `title` alone: no alternatives field, no forecast field at all. So an
 * external agent holding `write:decision` could write, into `decisions`, a row
 * the product's own agents are refused — and the weaker door was the one facing
 * outward, which is the wrong way round for every reason at once.
 *
 * The rules are the internal tool's, matched field for field and message for
 * message, and the horizon rule is not re-derived here: `forecastRefusal` is the
 * function both other doors wire, so a fourth rule added there arrives on this
 * door the same day.
 *
 * TWO DIFFERENCES ARE KEPT ON PURPOSE, because they make this door STRICTER
 * rather than looser, and closing an asymmetry does not mean levelling down:
 *
 *   · `status: 'pending'`, always. The internal tool runs `decideDecisionReview`
 *     and usually lands 'approved'. Nothing an external agent writes lands
 *     finished; that is this surface's whole posture and it is not relaxed here.
 *   · No `prd_id`. The internal tool accepts one and then stamps the edge with
 *     `recordDecisionOrigins`. Accepting the id here without writing that hop
 *     would create exactly the silent gap `the-ledger-chain-has-a-writer-for-
 *     every-hop.test.ts` exists to find, so the parameter stays off this door
 *     until the hop is written with it.
 *
 * `title` drops from 300 to 200 to match. A title accepted at one door and
 * refused at the other is the same drift in miniature, and nothing is broken by
 * narrowing it: `decisions WHERE source_kind='mcp'` is 0 rows.
 */
const recordDecisionSchema = z
  .object({
    title: z.string().min(1).max(200),
    // Required now. A call with no stated reason cannot be re-read later by the
    // person who has to live with it, and the internal door refuses it.
    rationale: z.string().min(1).max(4000),
    // A choice with nothing weighed against it is an assertion, not a decision.
    alternatives_considered: z.array(z.string().min(1).max(500)).min(1).max(10),
    agent_slug: z.string().max(80).optional(),
    forecast_claim: z
      .string({ required_error: FORECAST_REQUIRED, invalid_type_error: FORECAST_REQUIRED })
      .min(1)
      .max(500),
    forecast_how_we_will_know: z
      .string({ required_error: FORECAST_REQUIRED, invalid_type_error: FORECAST_REQUIRED })
      .min(1)
      .max(500),
    /** ISO 8601 with offset, and in the future. Both rules are refusals. */
    forecast_horizon_date: z
      .string({ required_error: FORECAST_REQUIRED, invalid_type_error: FORECAST_REQUIRED })
      .datetime({
        offset: true,
        message:
          "forecast_horizon_date must be an ISO 8601 timestamp with an offset, for example 2026-09-05T00:00:00Z. A bare date leaves the moment it comes due ambiguous, and this column is what the due index reads.",
      }),
  })
  .superRefine((v, ctx) => {
    const bad = forecastRefusal(v);
    if (bad) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [bad.path], message: bad.message });
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
    /*
     * THE REASON TRAVELS WITH THE REFUSAL, which the shape hint alone cannot do.
     * This threw a bare "expected { title, rationale?, agent_slug? }" and
     * discarded every zod message, so the forecast refusal above — the one
     * sentence that explains WHY a decision needs a bet — would have been
     * written and then never seen by the only reader it is addressed to. The
     * shape hint is kept first, because a caller scanning for the arg list still
     * finds it, and the messages follow it.
     */
    throw new Error(
      "expected { title: string, rationale: string, alternatives_considered: string[], forecast_claim: string, forecast_how_we_will_know: string, forecast_horizon_date: ISO 8601 with offset, in the future, agent_slug?: string }. " +
        parsed.error.issues.map((i) => i.message).join(" "),
    );
  }
  const {
    title,
    rationale,
    alternatives_considered,
    agent_slug,
    forecast_claim,
    forecast_how_we_will_know,
    forecast_horizon_date,
  } = parsed.data;

  // ALL OF IT IS SCREENED, not just the title and the rationale. The
  // alternatives and the forecast are free text an external caller wrote, they
  // land in a human's reading pane and in later agent context exactly as the
  // rationale does, and screening the two oldest fields while three new ones go
  // through unread is the half-fix this file's own test already names.
  const decision = screenIngestText(
    [title, rationale, ...alternatives_considered, forecast_claim, forecast_how_we_will_know].join(
      " ",
    ),
  );
  if (decision === "quarantine") return { status: "quarantined", id: null };

  const { data, error } = await supabaseClient
    .from("decisions")
    .insert({
      user_id,
      workspace_id,
      title,
      rationale: rationale.trim(),
      alternatives_considered,
      /*
       * ALWAYS THREE VALUES, NEVER A NULL — the schema refuses the call without
       * all three, so there is no branch here that writes a forecast-less
       * decision. Set-once from this statement on: `enforce_forecast_immutable`
       * refuses any later change, so `record_forecast` will correctly report
       * this decision as already carrying one.
       *
       * NO SECOND SCOPE IS REQUIRED FOR THIS, and the separation the forecast
       * tools were built on is intact. `write:forecast` guards attaching a
       * forecast to a decision somebody ELSE recorded, and
       * `write:forecast_resolution` guards grading one — the loop the
       * immutability trigger exists to break. Stating what you expect from the
       * call you are recording, in the same write, is one act, and gating it
       * behind a scope the caller may not hold would make a REQUIRED field
       * unwritable, which is a tool that always fails.
       */
      forecast_claim,
      forecast_how_we_will_know,
      forecast_horizon_date,
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

// ───────────────────────────────────────────────────────────────────────────
// FC-01 — the forecast tools.
//
// WHY THESE EXIST. Before 2026-08-14 not one of the fifteen MCP tools touched a
// forecast column. A forecast could be recorded only by a human typing into one
// collapsed form on one route, listed only by that route's own loader, and
// settled only by clicking a control on that same panel. Every other station in
// the lifecycle had at least a read; this one had nothing.
//
// That is the wrong way round for this product. Most decisions here are captured
// by agents (the meeting extractor, discovery, the trigger tick, the tool
// registry, this very MCP surface), and the moat argument rests on the belief
// being recorded BEFORE the outcome is known. An agent that can record a
// decision and cannot say what it expects to follow from it is capturing the
// half that a competitor can reconstruct and dropping the half that they cannot.
// ───────────────────────────────────────────────────────────────────────────

const recordForecastSchema = z.object({
  decision_id: z.string().uuid(),
  claim: z.string().min(1).max(500),
  how_we_will_know: z.string().min(1).max(500),
  horizon_date: z.string().datetime({ offset: true }),
});

export async function recordForecast(
  supabaseClient: any,
  _workspace_id: string,
  user_id: string,
  args: unknown,
): Promise<{ status: "stored" | "quarantined"; decisionId: string | null }> {
  const parsed = recordForecastSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      "expected { decision_id: uuid, claim: string, how_we_will_know: string, horizon_date: ISO 8601 with offset, in the future }",
    );
  }
  const p = parsed.data;

  // Screened like every other inbound text on this surface. A forecast is read
  // back to a person at settle time and fed to a model in the audit prompt, so
  // it is exactly the kind of stored text a structural injection targets.
  const screened = screenIngestText(`${p.claim} ${p.how_we_will_know}`);
  if (screened === "quarantine") return { status: "quarantined", decisionId: null };

  /**
   * THE SAME FUNCTION THE HUMAN PATH CALLS, reached through the impl rather than
   * the server function so this does not become a second copy of the set-once
   * rule. setDecisionForecastImpl owns all of it: all three parts or none, the
   * horizon must still be open, and the write is refused if the decision already
   * carries a forecast. `_workspace_id` is unused deliberately, because the impl
   * scopes by the decision's own owner, which is stricter than trusting the
   * token's workspace claim.
   */
  const { setDecisionForecastImpl } = await import("@/lib/decisions.functions");
  const res = await setDecisionForecastImpl(supabaseClient, user_id, {
    decisionId: p.decision_id,
    forecast_claim: p.claim,
    forecast_how_we_will_know: p.how_we_will_know,
    forecast_horizon_date: p.horizon_date,
  });
  return { status: "stored", decisionId: res.decisionId };
}

const settleForecastMcpSchema = z.object({
  decision_id: z.string().uuid(),
  resolution: z.enum(["hit", "miss", "inconclusive"]),
  rationale: z.string().min(1).max(1000),
  agent_slug: z.string().max(100).optional(),
});

export async function settleForecastViaMcp(
  supabaseClient: any,
  _workspace_id: string,
  _user_id: string,
  args: unknown,
): Promise<{ status: "stored" | "quarantined" | "already_settled"; decisionId: string | null }> {
  const parsed = settleForecastMcpSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      "expected { decision_id: uuid, resolution: hit|miss|inconclusive, rationale: string, agent_slug?: string }",
    );
  }
  const p = parsed.data;

  const screened = screenIngestText(p.rationale);
  if (screened === "quarantine") return { status: "quarantined", decisionId: null };

  const { buildSettlePatch } = await import("@/lib/brain/forecast-resolution");
  const patch = buildSettlePatch({
    resolution: p.resolution,
    rationale: p.rationale,
    nowIso: new Date().toISOString(),
    agentSlug: p.agent_slug?.trim() || "mcp-agent",
  });

  /**
   * REFUSES TO OVERWRITE A VERDICT ALREADY ON THE RECORD, and the refusal is in
   * the WHERE clause rather than in a preceding read, so it cannot be raced.
   *
   * This mirrors applyOutcome, which refuses an agent overwrite of a settled
   * outcome for the same reason: an agent had its chance before the row was
   * settled, and disagreeing afterwards is a person's move. Here the argument is
   * stronger, because the thing being protected is a human's judgment about
   * whether their own prediction came true.
   *
   * `.is("forecast_resolution", null)` also makes a repeat call harmless, which
   * is the closest this tool gets to idempotency: the second call reports
   * already_settled instead of quietly rewriting the first verdict with a new
   * timestamp.
   */
  const { data: rows, error } = await supabaseClient
    .from("decisions")
    .update(patch)
    .eq("id", p.decision_id)
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    /**
     * Three different situations land here and the caller deserves to be able to
     * tell them apart, so we look rather than guess: no such decision, no
     * forecast on it, or a verdict already recorded. Returning a bare failure
     * would send an agent to retry a call that can never succeed.
     */
    const { data: probe } = await supabaseClient
      .from("decisions")
      .select("id,forecast_claim,forecast_resolution")
      .eq("id", p.decision_id)
      .maybeSingle();
    const row = probe as {
      forecast_claim: string | null;
      forecast_resolution: string | null;
    } | null;
    if (!row) throw new Error("No decision with that id is visible to this token.");
    if (row.forecast_claim == null) {
      throw new Error(
        "That decision carries no forecast, so there is nothing to settle. Use record_forecast first, and note that it must be recorded before the horizon passes.",
      );
    }
    return { status: "already_settled", decisionId: p.decision_id };
  }
  return { status: "stored", decisionId: p.decision_id };
}

export async function listDueForecastsForAgent(
  supabaseClient: any,
  _workspace_id: string,
  args: unknown,
): Promise<
  Array<{
    decision_id: string;
    title: string;
    claim: string;
    how_we_will_know: string;
    horizon_date: string;
    days_late: number;
    drafted_verdict: string | null;
    drafted_confidence: number | null;
  }>
> {
  // Clamped, not trusted. An unbounded limit from a caller is how a read tool
  // becomes a way to pull the whole table one request at a time.
  const raw = Number((args as { limit?: unknown })?.limit ?? 20);
  const limit = Number.isFinite(raw) ? Math.max(1, Math.min(Math.trunc(raw), 100)) : 20;
  const nowIso = new Date().toISOString();

  const { dueCheckFilter, isForecastDue } = await import("@/lib/brain/forecast-resolution");
  const { data, error } = await supabaseClient
    .from("decisions")
    .select(
      "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
        "forecast_resolution,forecast_next_check_at,forecast_resolution_suggestion",
    )
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .lte("forecast_horizon_date", nowIso)
    // The NULL-safe deferral clause, taken from the one place that owns it, so
    // this tool and the Learn desk can never disagree about what is due. A bare
    // .lte here would drop every never-deferred forecast, which is almost all of
    // them, and still look like it worked.
    .or(dueCheckFilter(nowIso))
    .order("forecast_horizon_date", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  const nowMs = Date.parse(nowIso);
  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((r) => isForecastDue(r as never, nowIso))
    .map((row) => {
      const horizon = String(row.forecast_horizon_date);
      const s = row.forecast_resolution_suggestion as {
        verdict?: string;
        confidence?: number;
      } | null;
      return {
        decision_id: String(row.id),
        title: String(row.title ?? ""),
        claim: String(row.forecast_claim ?? ""),
        how_we_will_know: String(row.forecast_how_we_will_know ?? ""),
        horizon_date: horizon,
        days_late: Math.floor((nowMs - Date.parse(horizon)) / 86_400_000),
        drafted_verdict: s?.verdict ?? null,
        drafted_confidence: typeof s?.confidence === "number" ? s.confidence : null,
      };
    });
}
