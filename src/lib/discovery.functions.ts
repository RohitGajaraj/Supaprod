import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { extractArrayField } from "@/lib/ai/json-shape";
import { clusterSignalsCore } from "@/lib/ai/cluster.server";
import { runCritic } from "@/lib/ai/critic.server";
import { loadDecisionPrecedent } from "@/lib/ai/decision-precedent.server";
import { recordLineage, recordLineageSafe } from "@/lib/lineage.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import { retrieve } from "@/lib/rag/retriever.server";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { prepareScaffoldSpeculative } from "@/lib/design-scaffold.functions";
import { gradeOutcomeContract } from "@/lib/outcome-contract-grade";
import { ROADMAP_TEXT_MAX } from "@/lib/roadmap-governance";
import { recordGateSignalCore } from "@/lib/gate-signals.functions";
import { writeSignals } from "@/lib/sources/sink.server";
import {
  MAX_BODY_CHARS,
  bodyCandidate,
  titleFromBody,
  typedCandidates,
} from "@/lib/sources/manual";
import type { SignalCandidate, SinkResult } from "@/lib/sources/kinds";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------- CRITIC (DEC-02 opportunities · DEF-03 specs) ----------
// DEC-02-LOOP: runCritic + CriticReview now live in src/lib/ai/critic.server.ts
// so the Critic is also callable from the agent loop as the `critic.evaluate`
// tool. Re-exported here because ~8 modules import the type from this module.
export type { CriticReview } from "@/lib/ai/critic.server";

/** Manual Critic re-run from the UI ("Re-run Critic" on the badge). */
export const runCriticReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        target_kind: z.enum(["opportunity", "prd"]),
        target_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const review = await runCritic(context.supabase, context.userId, {
      kind: data.target_kind,
      id: data.target_id,
    });
    if (!review) throw new Error("Critic review failed");
    return { review };
  });

// ---------- WEDGE (Critic-teardown first-run) ----------
//
// Engine-Room: the felt entry. The operator names a feature they believe in
// and gets an evidence-backed teardown in one call. The machinery (the judge
// model, the ICE scoring, the opportunities table) stays behind the outcome
// ("see why your idea might be wrong, with receipts"). It records the idea
// verbatim so the Critic judges exactly what the operator said, then red-teams
// it inline. No source connection or data setup is required, so a brand-new
// account reaches the first verdict in its first session.

/**
 * Record a feature idea as an opportunity (verbatim, neutral ICE) and run the
 * Critic against it in the same call. Returns the opportunity plus the verdict
 * for the first-run surface to render. The verdict may be `null` when the AI
 * gateway is unavailable (e.g. local dev with no key) — the idea is still saved
 * and the caller shows an honest fallback rather than a broken card.
 */
export const runWedgeTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        idea: z.string().trim().min(3).max(200),
        problem: z.string().trim().max(2000).optional(),
        target_user: z.string().trim().max(200).optional(),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: opp, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        title: data.idea.slice(0, 200),
        problem: (data.problem ?? "").slice(0, 2000),
        target_user: data.target_user?.slice(0, 200) ?? null,
        // Neutral ICE: the operator hasn't scored the bet, so we don't fake a
        // score. The Critic judges the idea itself and surfaces what's undefined
        // through `missing_evidence` — which is most of the first-run value.
        impact: 5,
        confidence: 5,
        ease: 5,
        project_id: data.project_id ?? null,
      })
      .select()
      .single();
    if (error || !opp) throw new Error(error?.message ?? "Could not record the idea");

    // SEAM-1: stage history for the created opportunity.
    await recordStageEvent(supabase, {
      entityType: "opportunity",
      entityId: opp.id,
      from: null,
      to: opp.status ?? "backlog",
      actor: "human",
      workspaceId: opp.workspace_id,
      userId,
    });

    const review = await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    return { opportunity: opp, review };
  });

// ---------- TASK GRAPH (M1: H1 — PRD → engineering plan) ----------

/** The Planner step: decompose an approved spec into a DEPENDENCY-ORDERED
 *  engineering task graph an agent team can execute. Replaces any prior
 *  generated graph for the PRD (rows with seq IS NOT NULL); manually-added
 *  tasks (seq NULL) are untouched. Pre-migration tolerant: if the graph columns
 *  aren't applied yet, falls back to a flat task list so the spec still yields
 *  executable tasks. */
export const generateTaskGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prd_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id")
      .eq("id", data.prd_id)
      .single();
    if (pErr || !prd) throw new Error("Spec not found");

    const system = `You are the Planner agent. Turn an approved product SPEC into a DEPENDENCY-ORDERED engineering task graph an agent team can execute. Decompose into 4-12 concrete build tasks (not phases), ordered so dependencies come first. For each task give a 1-line detail, an hour estimate, an owner (agent for code/test/infra, human for decisions/design/external), any risk, and which earlier tasks it depends on (by their 1-based seq).
Return STRICT JSON only:
{"tasks":[{"seq":1,"title":"max 120 chars","detail":"max 200 chars","estimate_hours":<number>,"assignee":"agent|human","risk":"short or empty","depends_on":[<seq>...]}]}
Be concrete and buildable. Only tasks the spec actually implies - do not invent scope. depends_on must reference lower seq numbers only.`;

    let result;
    try {
      result = await callModel(supabase, userId, {
        surface: "prd",
        surface_ref: `taskgraph:${data.prd_id}`,
        model: "google/gemini-2.5-pro",
        fallbackModel: "google/gemini-2.5-flash",
        responseFormat: "json_object",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `SPEC\nTitle: ${prd.title}\nBody:\n${(prd.body_md ?? "").slice(0, 6000)}`,
          },
        ],
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Planner failed");
    }

    const tasksRaw = extractArrayField(result.json, "tasks") ?? [];
    const tasks = tasksRaw.slice(0, 20).map((t, i) => {
      const o = (t ?? {}) as Record<string, unknown>;
      const seq = Number.isFinite(Number(o.seq)) ? Number(o.seq) : i + 1;
      return {
        seq,
        title: String(o.title ?? "Task").slice(0, 200),
        detail: String(o.detail ?? "").slice(0, 400),
        estimate_hours: Math.max(0, Math.min(200, Number(o.estimate_hours) || 0)),
        assignee: o.assignee === "human" ? "human" : "agent",
        risk: String(o.risk ?? "").slice(0, 200),
        depends_on: Array.isArray(o.depends_on)
          ? o.depends_on.map(Number).filter((n) => Number.isFinite(n) && n < seq)
          : [],
      };
    });
    if (tasks.length === 0) throw new Error("Planner returned no tasks");

    const baseRow = (t: (typeof tasks)[number]) => ({
      user_id: userId,
      workspace_id: prd.workspace_id ?? null,
      prd_id: prd.id,
      title: t.title,
      status: "todo",
      priority: "medium",
      assignee_kind: t.assignee,
      estimate_hours: t.estimate_hours || null,
    });
    const graphRow = (t: (typeof tasks)[number]) => ({
      ...baseRow(t),
      seq: t.seq,
      detail: t.detail || null,
      risk: t.risk || null,
      depends_on: t.depends_on,
    });

    try {
      // Replace the prior generated graph; keep manual tasks (seq NULL).
      await supabase.from("tasks").delete().eq("prd_id", prd.id).not("seq", "is", null);
      const { error } = await supabase.from("tasks").insert(tasks.map(graphRow) as never);
      if (error) throw error;
      return { count: tasks.length, graph: true };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (
        err.code === "42703" ||
        err.code === "PGRST204" ||
        /column .* does not exist|could not find the .* column/i.test(err.message ?? "")
      ) {
        // Pre-migration: insert a flat task list (no graph edges) so tasks still land.
        const { error } = await supabase.from("tasks").insert(tasks.map(baseRow) as never);
        if (error) throw new Error(error.message);
        return { count: tasks.length, graph: false };
      }
      throw new Error(err.message ?? "Task graph insert failed");
    }
  });

// ---------- SIGNALS ----------

// F3 (per-product feed): when a product is active the client passes its id and
// the feed scopes to that product (`project_id`); with no product active the
// input is empty and the query is unscoped, exactly as before (back-compatible).
// Unassigned signals (no product, e.g. the workspace ingest webhook) live in the
// all-products view, so nothing is hidden, it just is not filed under a product.
export const listSignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    // A product-scoped view must still surface workspace-level signals with
    // no product of their own (connector ingest - github/slack/etc - never
    // assigns project_id, since a bound repo or channel isn't inherently
    // one product in a multi-product workspace). Without the OR, every
    // connector-sensed signal silently vanished the moment ANY product was
    // active, which in practice is always, since a product is the sticky
    // default context - "unassigned signals live in the all-products view"
    // was true in principle but unreachable for real users.
    if (data.productId) query = query.or(`project_id.eq.${data.productId},project_id.is.null`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { signals: rows ?? [] };
  });

/**
 * MANUAL CAPTURE GOES THROUGH THE SAME DOOR AS EVERY CONNECTOR (2026-08-02).
 *
 * `sink.server.ts` calls itself "the single write path into public.signals" and
 * names manual as one of its lanes, but the human's own two doors, `createSignal`
 * and `bulkImportSignals`, built a raw row here and inserted it directly. So a
 * signal a product lead typed with their own hands was the ONLY kind of signal in
 * the product that arrived with:
 *
 *   - no `source_kind`, so `getSenseCoverage` filed it under a bare channel token
 *     and the surface could not tell a person "you captured this" from "a
 *     connector sensed this";
 *   - no `external_id`, so re-uploading the same document grew a phantom cluster;
 *   - no `stage_events` row, which is the FIRST link of the Trust Ledger chain,
 *     so the one signal whose provenance a human could personally vouch for was
 *     the one with no trail;
 *   - no embedding until the next sweeper pass, so it could not join a cluster or
 *     be recognised as a near-duplicate at the moment it was captured.
 *
 * Routing both through `writeSignals` gets all four by construction, and any
 * future guarantee the sink grows arrives here for free.
 *
 * The sink is service-role because dedup has to read across the workspace. That
 * is safe here and nowhere near a tenancy hole: `userId` comes from the verified
 * token, and `workspaceId` from `current_user_default_workspace()`, an RPC run on
 * the CALLER's client so `auth.uid()` is the caller. Neither is ever taken from
 * the request body.
 */
async function captureManual(
  supabase: SupabaseClient,
  userId: string,
  candidates: SignalCandidate[],
  productId: string | null,
): Promise<SinkResult> {
  if (candidates.length === 0) return { inserted: 0, skipped: 0, quarantined: 0 };
  const { data: workspaceId, error } = await supabase.rpc("current_user_default_workspace");
  if (error) throw new Error(`Could not resolve your workspace: ${error.message}`);
  if (!workspaceId) {
    throw new Error("No workspace is active, so there is nowhere to file this. Reload and retry.");
  }
  return writeSignals(userId, workspaceId as string, candidates, { productId });
}

/**
 * One captured thing: a typed note, a document, or a transcript.
 *
 * `kind` is a fact about the MATERIAL and it decides three things the caller
 * should not have to know: the `source` token written on the row, whether the
 * text is keyed for dedup, and whether the sink screens it. See manual.ts.
 *
 * `content` runs to MAX_BODY_CHARS rather than the old 8000, because a document
 * or a transcript is the point of the document and transcript kinds and 8000
 * characters is about three pages.
 */
export const createSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        content: z.string().min(2).max(MAX_BODY_CHARS),
        source: z.string().min(1).max(40).default("manual"),
        kind: z.enum(["note", "document", "transcript"]).optional(),
        title: z.string().max(200).optional(),
        url: z.string().url().max(500).optional().or(z.literal("")),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const kind = data.kind ?? "note";

    if (kind === "document" || kind === "transcript") {
      const { candidate, dropped } = bodyCandidate(kind, data.title ?? "", data.content);
      const result = await captureManual(
        context.supabase as unknown as SupabaseClient,
        context.userId,
        [{ ...candidate, url: data.url || null, sentiment: data.sentiment }],
        data.project_id ?? null,
      );
      return { ...result, dropped };
    }

    // A note keeps whatever `source` the caller passed (DocsPanel sends "doc",
    // the Discover box sends "note"), so an existing door does not silently
    // change what it writes. Everything else about it is now the sink's.
    //
    // The derived title takes the FIRST LINE, never the whole body: a title is a
    // row lead, and a lead carrying three paragraphs of newlines is not one.
    const title = data.title?.trim() || titleFromBody(data.content, "A captured note");
    const result = await captureManual(
      context.supabase as unknown as SupabaseClient,
      context.userId,
      [
        {
          source: data.source,
          sourceKind: "manual",
          title,
          content: data.content,
          url: data.url || null,
          sentiment: data.sentiment,
          untrusted: false,
        },
      ],
      data.project_id ?? null,
    );
    return { ...result, dropped: 0 };
  });

/**
 * Many observations at once: newline separated, one signal per line.
 *
 * The line floor moved from 4 characters to the fabric's own MIN_LINE_CHARS (2)
 * so this door and the Discover capture box stop disagreeing about what counts as
 * a line. Everything else about the contract is unchanged.
 */
export const bulkImportSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        source: z.string().min(1).max(40).default("paste"),
        // newline-separated, one signal per line
        text: z.string().min(2).max(MAX_BODY_CHARS),
        // F3: file the imported signals under the active product when one is set.
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const candidates = typedCandidates(data.text, "paste").map((c) => ({
      ...c,
      source: data.source,
    }));
    const result = await captureManual(
      context.supabase as unknown as SupabaseClient,
      context.userId,
      candidates,
      data.project_id ?? null,
    );
    return result;
  });

/**
 * NO DOOR, ON PURPOSE, AND IT REPORTED SUCCESS ON A DELETE THAT DID NOT HAPPEN.
 *
 * A sweep on 2026-08-06 found 97 of 590 server functions referenced by nothing
 * outside their own file. Most are unbuilt futures; this one is different,
 * because the reason it has no caller is a PRODUCT decision that was never
 * written down, so every future reader has to re-derive it.
 *
 * DISCOVER DOES NOT DELETE EVIDENCE. Its three dispositions are promote, merge
 * and decline, and all three keep the signal on the record -- the station's whole
 * claim is that a cluster can be re-opened when the same complaint arrives again,
 * and `shouldEscalate` reads the frequency a declined theme had when it was
 * declined. Hard-deleting rows out from under that makes the corroboration count
 * a number nobody can reproduce. Leave it doorless unless the founder decides a
 * mis-captured signal needs removing rather than declining, and if that day
 * comes, the right shape is almost certainly a soft delete.
 *
 * THE BUG IT WOULD HAVE SHIPPED WITH. `.delete()` with no `.select()` returns
 * `{ error: null }` when row-level security refuses it, because supabase-js
 * resolves a refusal rather than throwing. So this returned `{ ok: true }` having
 * removed nothing, and any surface that ever mounted it would have shown the row
 * vanish optimistically and reappear on the next read, with no error anywhere.
 * Fixed now rather than left as a trap for whoever wires it up.
 */
export const deleteSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: gone, error } = await context.supabase
      .from("signals")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!gone || gone.length === 0) {
      throw new Error("That signal was not removed. It may not be yours to delete.");
    }
    return { ok: true };
  });

// ---------- THEMES ----------

export const listThemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("themes")
      .select("*")
      .order("frequency", { ascending: false })
      .limit(300);
    // Same fix as listSignals: a theme clustered by the cron path (projectId
    // null - it clusters a whole workspace, not one product) must still show
    // inside a product-scoped view, not just the unreachable all-products one.
    if (data.productId) query = query.or(`project_id.eq.${data.productId},project_id.is.null`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { themes: rows ?? [] };
  });

/** AI cluster: read unclustered signals, ask Gemini Pro for themes JSON, persist. */
export const clusterSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Delegates to the shared core (also driven by the cluster-tick cron). The
    // manual path is RLS-scoped to the caller, so workspaceId is null; productId
    // scopes to the active product (F3 per-product), exactly as before.
    return clusterSignalsCore(supabase, userId, null, data.productId ?? null);
  });

// ---------- F3: AUTO-CLUSTER OPT-IN (workspace owner) ----------
// The cluster-tick cron only processes workspaces where auto_cluster_enabled is
// true, so unattended SENSE is OFF by default and the owner turns it on
// explicitly (it commits recurring AI spend, so it stays founder/owner-gated).

export const getWorkspaceClusterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // RLS ("ws owner manage") scopes this to a workspace the caller owns.
    // If the column is not migrated yet, the select soft-fails and we report
    // not-owner so the toggle simply stays hidden.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("auto_cluster_enabled, last_auto_cluster_at")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    return {
      is_owner: Boolean(ws),
      enabled: ws?.auto_cluster_enabled ?? false,
      last_run_at: ws?.last_auto_cluster_at ?? null,
    };
  });

export const toggleAutoCluster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ enabled: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws) throw new Error("Only the workspace owner can change auto-cluster settings.");
    const { error } = await supabase
      .from("workspaces")
      .update({ auto_cluster_enabled: data.enabled })
      .eq("id", ws.id);
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

// ---------- SENSE TRIAGE: the station's missing verbs (2026-08-01) ----------
//
// Discover shipped with exactly one verb, "promote", and promotion is the RARE
// case. The proven shape for this job is Sentry's issue stream crossed with
// Linear's triage inbox: raw events group into an issue, and the operator
// spends most of their time saying "not a pattern" or "same as that one", not
// "make this a bet". Without those two verbs a cluster that is noise stays at
// the top of the ranking forever and the only way to remove it is to delete the
// evidence, which is the one thing a record-keeping product must never make
// easy.
//
// `themes.status` has existed since the first migration (TEXT NOT NULL DEFAULT
// 'new', no CHECK), so none of this needs a migration. It was simply never
// written by anything but the demo seeds.

/**
 * Triage a cluster without destroying its evidence.
 *
 * `dismissed` is not `deleted`: the signals stay, the cluster stays, and the
 * judgment that it was not a pattern becomes part of the record. That matters
 * twice over. A dismissed cluster is still corroboration if the same complaint
 * returns louder later, and "we looked at this and said no" is exactly the kind
 * of prior call the brain is supposed to hand back the next time it forms.
 */
export const setThemeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        theme_id: z.string().uuid(),
        status: z.enum(["new", "dismissed"]),
        reason: z.string().max(400).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prior } = await supabase
      .from("themes")
      .select("status,workspace_id,title,frequency")
      .eq("id", data.theme_id)
      .maybeSingle();
    if (!prior) throw new Error("Theme not found");

    // Record how big the cluster was at the moment it was declined. This is what
    // makes "not a pattern" mean "not YET a pattern": theme growth compares later
    // frequency against this number, so a decline at 3 signals and a decline at 40
    // are held to proportionate bars rather than one flat threshold. Cleared on the
    // way back to `new` so a second decline is measured from where it actually
    // stood, not from a stale reading taken the first time round.
    const update: Record<string, unknown> = { status: data.status };
    if (data.status === "dismissed") {
      update.dismissed_at_frequency = (prior as { frequency?: number | null }).frequency ?? 0;
    } else {
      update.dismissed_at_frequency = null;
      update.escalated_at = null;
    }

    const { error } = await supabase.from("themes").update(update).eq("id", data.theme_id);
    if (error) throw new Error(error.message);

    // SEAM-1: a triage call is a stage transition and belongs in the history
    // beside the promotions, so the record shows what was rejected as well as
    // what was kept. A record that only holds the yeses is a highlight reel.
    await recordStageEvent(supabase, {
      entityType: "theme",
      entityId: data.theme_id,
      from: prior.status ?? null,
      to: data.status,
      actor: "human",
      workspaceId: (prior.workspace_id as string | null) ?? null,
      userId,
    });

    return { ok: true, status: data.status, title: prior.title as string };
  });

/**
 * "This is not a new bet, it is more evidence for one we already have."
 *
 * The single most common real outcome of triage, and the one Discover could not
 * express at all: every cluster either became a brand-new opportunity or sat
 * there. So a team running the loop for a month accumulated four opportunities
 * that were all the same bet, each with a quarter of the evidence, and the
 * ranked queue on /decide ranked the duplicates against each other.
 *
 * Lifted from Sentry's "merge duplicate issues" and Productboard's
 * link-insight-to-feature. The evidence re-parents onto the existing bet, the
 * cluster is marked merged rather than deleted, and nothing is re-scored behind
 * the user's back: attaching evidence must not silently change a bet's rank,
 * because that would make the queue move for a reason nobody can see.
 */
export const attachThemeToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        theme_id: z.string().uuid(),
        opportunity_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const [{ data: theme }, { data: opp }] = await Promise.all([
      supabase
        .from("themes")
        .select("id,title,status,workspace_id")
        .eq("id", data.theme_id)
        .maybeSingle(),
      supabase.from("opportunities").select("id,title").eq("id", data.opportunity_id).maybeSingle(),
    ]);
    if (!theme) throw new Error("Theme not found");
    if (!opp) throw new Error("That bet no longer exists");

    const { data: memberRows } = await supabase
      .from("signals")
      .select("id")
      .eq("theme_id", data.theme_id);
    const memberIds = (memberRows ?? []).map((r) => (r as { id: string }).id);

    // The cluster's own edge, then one per quote. Same shape promotion writes,
    // so a merged cluster's evidence walks back exactly like a promoted one's.
    await recordLineageSafe(supabase, userId, {
      parent_kind: "theme",
      parent_id: theme.id as string,
      child_kind: "opportunity",
      child_id: opp.id as string,
      relation: "supports",
      rationale: "Merged into an existing bet as further evidence",
      created_by_agent: null,
    });
    if (memberIds.length > 0) {
      try {
        await supabase.from("artifact_lineage").upsert(
          memberIds.map((sid) => ({
            user_id: userId,
            parent_kind: "signal" as const,
            parent_id: sid,
            child_kind: "opportunity" as const,
            child_id: opp.id as string,
            relation: "supports",
            rationale: "Evidence merged from a later cluster",
            created_by_agent: null,
          })),
          { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
        );
      } catch {
        // Best-effort provenance; the theme edge above already survived.
      }
    }

    await supabase.from("themes").update({ status: "merged" }).eq("id", data.theme_id);
    await recordStageEvent(supabase, {
      entityType: "theme",
      entityId: theme.id as string,
      from: (theme.status as string | null) ?? null,
      to: "merged",
      actor: "human",
      workspaceId: (theme.workspace_id as string | null) ?? null,
      userId,
    });

    return {
      ok: true,
      opportunity: { id: opp.id as string, title: opp.title as string },
      evidence: memberIds.length,
    };
  });

/**
 * "Am I seeing everything?" - the first question anyone asks of a discovery
 * surface, and the one Discover could not answer.
 *
 * The asymmetry this closes is stark: an AGENT has had `sources.status` since
 * 2026-06-30 (registry.server.ts), which reports exactly this. The human
 * standing on the surface those signals feed had no equivalent anywhere in the
 * product. An operator who cannot see the shape of their intake cannot trust a
 * ranking built on it, and enterprise buyers ask this question first.
 *
 * `quiet` is the load-bearing field, not the counts. A source that used to
 * deliver and has stopped is a blind spot, and a blind spot is invisible by
 * definition unless something names it.
 */
export const getSenseCoverage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const now = Date.now();
    const windowMs = 7 * 86_400_000;
    const since = new Date(now - 2 * windowMs).toISOString();

    let q = supabase
      .from("signals")
      .select("source,source_kind,created_at,theme_id")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (data.productId) q = q.or(`project_id.eq.${data.productId},project_id.is.null`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    type Bucket = { source: string; recent: number; prior: number; lastAt: string | null };
    const bySource = new Map<string, Bucket>();
    let unclustered = 0;

    for (const r of rows ?? []) {
      const row = r as {
        source: string | null;
        source_kind: string | null;
        created_at: string;
        theme_id: string | null;
      };
      const key = row.source_kind || row.source || "unknown";
      const b = bySource.get(key) ?? { source: key, recent: 0, prior: 0, lastAt: null };
      const age = now - Date.parse(row.created_at);
      if (age <= windowMs) b.recent += 1;
      else b.prior += 1;
      if (!b.lastAt || row.created_at > b.lastAt) b.lastAt = row.created_at;
      bySource.set(key, b);
      if (!row.theme_id) unclustered += 1;
    }

    const sources = [...bySource.values()]
      .map((b) => ({
        ...b,
        // Delivered before, silent now. Not "zero signals", which is the
        // ordinary state of a source nobody connected.
        quiet: b.recent === 0 && b.prior > 0,
      }))
      .sort((a, b) => b.recent - a.recent || b.prior - a.prior);

    return {
      sources,
      total7d: sources.reduce((n, s) => n + s.recent, 0),
      totalPrior7d: sources.reduce((n, s) => n + s.prior, 0),
      unclustered,
      quietCount: sources.filter((s) => s.quiet).length,
    };
  });

/**
 * What the record already knows about this cluster, BEFORE it becomes a bet.
 *
 * The product's own canon says the brain "warns before you repeat what was
 * wrong". /decide honours that with its record recess. Discover, which is the
 * surface that COMPUTES the novelty score in the first place
 * (cluster.server.ts calls computeNovelty on every insert and stores the basis
 * on the row), showed none of it. So the warning arrived one station after the
 * cheapest moment to act on it: killing a repeat at Discover costs nothing,
 * killing it at Decide has already spent a critic run and a person's attention.
 *
 * Nothing new is computed here. `loadDecisionPrecedent` takes arbitrary text and
 * has since the Decision Brain increment, and `novelty_basis.themeId` is already
 * on the row. This is a door onto machinery that was built and never opened.
 */
export const getThemePrecedent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ theme_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: theme } = await supabase
      .from("themes")
      .select("id,title,summary,novelty,novelty_basis,workspace_id")
      .eq("id", data.theme_id)
      .maybeSingle();
    if (!theme) throw new Error("Theme not found");

    const basis = (theme.novelty_basis ?? null) as {
      maxSim?: number | null;
      maxThemeSim?: number | null;
      themeId?: string | null;
    } | null;

    // The prior CLUSTER this most resembles, resolved from the basis already on
    // the row. "You have seen this shape before" is a different and cheaper
    // claim than "you decided this before", and both are worth saying.
    let priorTheme: { id: string; title: string; similarity: number | null } | null = null;
    if (basis?.themeId) {
      const { data: pt } = await supabase
        .from("themes")
        .select("id,title")
        .eq("id", basis.themeId)
        .maybeSingle();
      if (pt) {
        priorTheme = {
          id: pt.id as string,
          title: pt.title as string,
          similarity: basis.maxThemeSim ?? null,
        };
      }
    }

    // The prior OUTCOME. Fail-safe by contract: loadDecisionPrecedent returns
    // [] on any embedding or RPC failure, so a quiet brain degrades to silence
    // rather than to an error on a surface whose main job still works.
    const text = `${theme.title}\n${theme.summary ?? ""}`.trim();
    const precedent = await loadDecisionPrecedent(supabase as unknown as SupabaseClient, {
      userId,
      workspaceId: (theme.workspace_id as string | null) ?? null,
      text,
    });

    return {
      novelty: (theme.novelty as number | null) ?? null,
      priorTheme,
      precedent: precedent.map((p) => ({
        id: p.id,
        title: p.title,
        verdict: p.verdict,
        summary: p.summary,
        opportunityId: p.opportunityId,
        score: p.score,
      })),
    };
  });

// ---------- OPPORTUNITIES ----------

export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("opportunities")
      .select("*")
      .order("ice_score", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const opportunities = data ?? [];

    // PC-29 layer 3 (2026-07-17 repair pass): decided_by_agent_slug
    // attribution on Decide's opportunity cards. No FK runs from
    // opportunities to decisions directly (decisions key off prd_id, not
    // opportunity_id), so this is a two-hop join in JS, same idiom as
    // governance.functions.ts's outcomeByAgent (learnings -> decisions via
    // prd_id). Both hops are scoped to ids drawn from the opportunities
    // result above, which RLS already filtered for this caller, so this can
    // only enrich rows already visible, never widen what's visible.
    const oppIds = opportunities.map((o) => o.id as string);
    const agentSlugByOpportunity = new Map<string, string>();
    if (oppIds.length) {
      const { data: prdRows } = await context.supabase
        .from("prds")
        .select("id,opportunity_id")
        .in("opportunity_id", oppIds);
      const prdToOpp = new Map<string, string>(
        ((prdRows ?? []) as { id: string; opportunity_id: string | null }[])
          .filter((p) => p.opportunity_id)
          .map((p) => [p.id, p.opportunity_id as string]),
      );
      const prdIds = [...prdToOpp.keys()];
      if (prdIds.length) {
        const { data: decisionRows } = await context.supabase
          .from("decisions")
          .select("prd_id,decided_by_agent_slug,created_at")
          .in("prd_id", prdIds)
          .not("decided_by_agent_slug", "is", null)
          .order("created_at", { ascending: false });
        for (const d of (decisionRows ?? []) as {
          prd_id: string | null;
          decided_by_agent_slug: string | null;
        }[]) {
          const oppId = d.prd_id ? prdToOpp.get(d.prd_id) : undefined;
          // Descending order + set-if-absent keeps the MOST RECENT decision
          // per opportunity (a bet can be revisited more than once).
          if (oppId && d.decided_by_agent_slug && !agentSlugByOpportunity.has(oppId)) {
            agentSlugByOpportunity.set(oppId, d.decided_by_agent_slug);
          }
        }
      }
    }

    return {
      opportunities: opportunities.map((o) => ({
        ...o,
        decided_by_agent_slug: agentSlugByOpportunity.get(o.id as string) ?? null,
      })),
    };
  });

export const promoteThemeToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ theme_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: theme, error } = await supabase
      .from("themes")
      .select("*")
      .eq("id", data.theme_id)
      .single();
    if (error || !theme) throw new Error("Theme not found");

    // THE EVIDENCE IS READ BEFORE THE BET IS MADE, because it is what the bet
    // is made OF. Discover's Gate says "this evidence travels with it", and
    // until 2026-08-01 that sentence was false: only a single theme ->
    // opportunity edge was written, so /decide showed a stale integer and the
    // lineage walk could not reach one quote. A promise the surface makes and
    // the write does not keep is worse than no promise.
    const { data: memberRows } = await supabase
      .from("signals")
      .select("id")
      .eq("theme_id", theme.id);
    const memberIds = (memberRows ?? []).map((r) => (r as { id: string }).id);

    const { data: opp, error: oErr } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        theme_id: theme.id,
        title: theme.title,
        problem: theme.summary,
        hypothesis: `If we address "${theme.title}", we expect to reduce reported pain and improve activation.`,
        impact: Math.min(10, theme.severity * 2),
        confidence: Math.round(theme.confidence * 10),
        ease: 5,
        // SCOPE TRAVELS TOO. `listThemes` is product-scoped and
        // `listOpportunities` is not, so a bet promoted from a product's theme
        // used to land in every product's queue at once. Carrying the theme's
        // own scope is the only reading that keeps the two lists agreeing.
        project_id: theme.project_id,
        product_id: theme.product_id,
        /**
         * AND SO DOES THE WORKSPACE, WHICH IT DID NOT, and that one moved rows
         * between tenants rather than between lists.
         *
         * `opportunities.workspace_id` is NOT NULL with a column default of
         * `current_user_default_workspace()`. Omitting it here did not leave it
         * blank: it silently filled with the PROMOTER'S DEFAULT workspace. So a
         * person who belongs to more than one, standing in workspace B and
         * promoting one of B's themes, created the bet in workspace A -- their
         * oldest membership -- where the theme it was made of does not exist.
         *
         * Not hypothetical. Measured on the live database while fixing this:
         * 2 of 86 promoted opportunities sit in a workspace other than their
         * own theme's.
         *
         * THOSE TWO ROWS ARE DELIBERATELY NOT MOVED, and the reason is worth
         * recording because moving them was tried and reverted. A bet does not
         * travel alone: its spec, and whatever hangs off that spec, were all
         * written into the SAME workspace the bet landed in, consistently. So
         * the historical rows are internally consistent and disagree only with
         * the theme. Re-homing the opportunity by itself replaced one
         * disagreement with another -- it separated a bet from its own spec,
         * which is worse, because that is the link a person actually follows.
         * A correct backfill has to walk the whole lineage, and `missions` has
         * no prd column so that walk is over edges rather than columns. That is
         * a considered migration, not something to do mid-investigation while
         * nobody is awake to look at it.
         *
         * The code fix is what matters: it stops the next one. Two rows are
         * recorded here so the eventual backfill knows what it is looking for.
         *
         * The comment directly above is the same lesson learned once already
         * for `project_id`. A column default is not a fallback, it is a guess
         * the database makes when the writer declines to say -- and the guess
         * is about the WRITER, never about the row.
         */
        workspace_id: theme.workspace_id,
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    if (opp) {
      // SEAM-1: stage history for the created opportunity.
      await recordStageEvent(supabase, {
        entityType: "opportunity",
        entityId: opp.id,
        from: null,
        to: opp.status ?? "backlog",
        actor: "human",
        workspaceId: opp.workspace_id,
        userId,
      });
      // SW-5 chain audit: fail-soft, the opportunity already exists and a
      // lineage hiccup must not fail the promotion (a retry would duplicate it).
      await recordLineageSafe(supabase, userId, {
        parent_kind: "theme",
        parent_id: theme.id,
        child_kind: "opportunity",
        child_id: opp.id,
        rationale: "Promoted from theme",
        created_by_agent: "discovery-scout",
      });
      // EVERY QUOTE GETS ITS OWN EDGE. One theme edge made the chain two hops
      // deep and the quotes unreachable except by re-deriving them through the
      // theme, which `LineageDrawer` does not do. A direct signal ->
      // opportunity edge per member is what makes "traces back to" answer with
      // the actual sentences a person read before they decided. Batched and
      // fail-soft: the bet already exists, and provenance must never be able to
      // fail a promotion that a retry would then duplicate.
      if (memberIds.length > 0) {
        try {
          await supabase.from("artifact_lineage").upsert(
            memberIds.map((sid) => ({
              user_id: userId,
              parent_kind: "signal" as const,
              parent_id: sid,
              child_kind: "opportunity" as const,
              child_id: opp.id as string,
              relation: "promoted",
              rationale: "Evidence behind the promoted theme",
              created_by_agent: "discovery-scout",
            })),
            { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
          );
        } catch {
          // Best-effort provenance; the theme edge above already survived.
        }
      }
      await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    }
    // `evidence` is returned so the surface can render a Receipt that states
    // what the promotion actually carried, rather than a toast asserting that
    // something happened (anti-slop.md §5).
    /**
     * THE CLUSTER IS SETTLED NOW, AND NOTHING SAID SO.
     *
     * MEASURED LIVE, 2026-08-06: 10 themes carried more than one bet, 50
     * opportunities between them, one theme with SIX. Every duplicate ran its
     * own Critic pass, so this was billing the founder for the same judgment
     * repeatedly and putting six identical bets in front of the user in /decide.
     *
     * The cause was that promotion wrote no terminal state. Discover's `ranked`
     * filter drops only `dismissed` and `merged`, so a promoted cluster stayed
     * in the queue, `focusedId` still pointed at it, and the Gate re-rendered
     * the identical question with "Make it a bet" still armed. Pressing `a`
     * twice -- the fastest key on the station, and the one the surface tells you
     * to press -- was enough.
     *
     * Written LAST, after the opportunity and its lineage exist, so a failure
     * anywhere above leaves the cluster promotable rather than stranding it in a
     * state with no bet to show for it. Fail-soft for the same reason: a bet
     * that exists and is unmarked is recoverable, one that is marked with
     * nothing behind it is not.
     */
    const { error: markErr } = await supabase
      .from("themes")
      .update({ status: "promoted" })
      .eq("id", theme.id);
    if (markErr) {
      console.error(`[promote] theme ${theme.id} kept its old status: ${markErr.message}`);
    }

    return { opportunity: opp, evidence: memberIds.length };
  });

export const updateOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        problem: z.string().max(2000).optional(),
        target_user: z.string().max(200).nullable().optional(),
        hypothesis: z.string().max(1000).nullable().optional(),
        impact: z.number().int().min(1).max(10).optional(),
        confidence: z.number().int().min(1).max(10).optional(),
        ease: z.number().int().min(1).max(10).optional(),
        status: z.enum(["backlog", "now", "next", "later", "shipped", "dropped"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;

    // SEAM-1: capture the prior stage before a status-bearing update.
    let prior: { status: string | null; workspace_id: string | null; user_id: string } | null =
      null;
    if (rest.status) {
      const { data: p } = await context.supabase
        .from("opportunities")
        .select("status,workspace_id,user_id")
        .eq("id", id)
        .maybeSingle();
      prior = p ?? null;
    }

    const patch = { ...rest, updated_at: new Date().toISOString() };
    const { data: row, error } = await context.supabase
      .from("opportunities")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (rest.status) {
      await recordStageEvent(context.supabase, {
        entityType: "opportunity",
        entityId: id,
        from: prior?.status ?? null,
        to: rest.status,
        actor: "human",
        workspaceId: prior?.workspace_id ?? null,
        userId: prior?.user_id ?? context.userId,
      });
      await recordJudgment(context.supabase, context.userId, {
        id,
        row: row as Record<string, unknown> | null,
        from: prior?.status ?? null,
        to: rest.status,
        workspaceId: prior?.workspace_id ?? null,
      });
    }
    return { opportunity: row };
  });

/**
 * THE JUDGMENT GATE RECORDED ONLY THAT A CALL HAPPENED, NEVER WHY.
 *
 * WHAT WAS MISSING. Decide is the highest-stakes human act in the product: keep
 * this bet or kill it. Settling one wrote a status enum on `opportunities` and a
 * `stage_events` row, and nothing else. Measured on the live database: 267
 * `decisions` rows exist and every one of them carries a rationale -- from
 * missions, specs, the roadmap, the Critic, retrospectives, meetings -- and NOT
 * ONE comes from the gate. `createDecision` has call sites; /decide is not one.
 *
 * WHY THAT BREAKS THE MOAT RATHER THAN A REPORT. Layer 03 is the only layer
 * defensible alone: a settled outcome re-ranks the next call. Learn grades a
 * decision against what happened, and it cannot grade a judgment that left no
 * reasoning behind. So the single richest signal the product generates -- a
 * human weighing evidence and choosing -- was being thrown away at the moment
 * it was made, and every future recommendation was poorer for it.
 *
 * NOBODY IS ASKED TO TYPE ANYTHING, which is the whole point of an agentic
 * product. The rationale is ASSEMBLED from what the gate itself had on screen
 * when the person pressed the key: the bet's own impact, confidence and ease,
 * and the lane it moved between. Every clause traces to a column on the row
 * that was just written. Asking for a sentence would add friction to the one
 * interaction that must stay a single keystroke, and would collect prose that
 * is worse evidence than the numbers already are.
 *
 * IT NEVER BLOCKS THE CALL. A decision that cannot be recorded must not stop a
 * bet being settled: the person's judgment is the fact, and the record of it is
 * a consequence. Failures report themselves through `recordLineageSafe`'s own
 * channel rather than surfacing as a failed settle.
 */
/**
 * PURE. The verdict a lane change amounts to, and the sentence that records it.
 *
 * Separated from the write so it can be read and tested without a database, and
 * so the one part with judgement in it -- which moves count as a call, and what
 * the record says -- is inspectable on its own. `null` means this was not a
 * judgment and nothing should be written.
 */
export function judgmentFor(input: {
  row: Record<string, unknown> | null;
  from: string | null;
  to: string;
}): { verdict: "approved" | "rejected"; title: string; rationale: string } | null {
  /**
   * ONLY THE MOVES THAT ARE A JUDGMENT. Dropping is a rejection and promoting
   * into an active lane is an approval. Everything else -- parking in Later,
   * returning to Backlog -- is SCHEDULING, and filing every drag as a decision
   * would bury the real ones. A decision log that records everything records
   * nothing, which is the failure mode that makes most of them useless.
   */
  const verdict =
    input.to === "dropped"
      ? ("rejected" as const)
      : input.to === "now" || input.to === "next"
        ? ("approved" as const)
        : null;
  if (!verdict) return null;

  const r = input.row ?? {};
  const title = typeof r.title === "string" && r.title ? r.title : "This bet";
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  /**
   * ASSEMBLED, NOT WRITTEN, AND NOBODY IS ASKED TO TYPE IT. Each clause names a
   * column, so the sentence can be CHECKED against the row rather than
   * believed. Asking for a sentence would put friction on the one interaction
   * that has to stay a single keystroke, and would collect prose that is worse
   * evidence than the numbers already are.
   *
   * A missing number is DROPPED rather than defaulted. A fabricated "5 out of
   * 10" would be indistinguishable from a real one, and `ease` genuinely
   * carries a placeholder on every promoted bet today.
   */
  const scored = [
    num(r.impact) !== null ? `impact ${num(r.impact)}/10` : null,
    num(r.confidence) !== null ? `confidence ${num(r.confidence)}/10` : null,
    num(r.ease) !== null ? `ease ${num(r.ease)}/10` : null,
  ].filter(Boolean);
  const lane = input.from ? `from ${input.from} to ${input.to}` : `set to ${input.to}`;
  const tail = scored.length ? `, scored ${scored.join(", ")}` : "";
  const rationale =
    verdict === "rejected"
      ? `Dropped at the gate, ${lane}. The evidence stays on the record${tail}.`
      : `Kept at the gate, ${lane}${tail}.`;

  return { verdict, title, rationale };
}

async function recordJudgment(
  supabase: SupabaseClient,
  userId: string,
  input: {
    id: string;
    row: Record<string, unknown> | null;
    from: string | null;
    to: string;
    workspaceId: string | null;
  },
): Promise<void> {
  const judged = judgmentFor({ row: input.row, from: input.from, to: input.to });
  if (!judged) return;
  const { verdict, title, rationale } = judged;
  const r = input.row ?? {};

  try {
    const { data: decision, error } = await supabase
      .from("decisions")
      .insert({
        user_id: userId,
        title,
        rationale,
        status: verdict,
        source_kind: "opportunity",
        // EXPLICIT, because `decisions.workspace_id` is NOT NULL with a default
        // of `current_user_default_workspace()` -- the same trap that put two
        // bets in a workspace that never saw their evidence. A column default
        // is a guess about the WRITER, never about the row.
        ...(input.workspaceId ? { workspace_id: input.workspaceId } : {}),
        ...(typeof r.project_id === "string" ? { project_id: r.project_id } : {}),
        ...(typeof r.product_id === "string" ? { product_id: r.product_id } : {}),
      } as never)
      .select("id")
      .single();
    // supabase-js RESOLVES a refused write rather than throwing, so an
    // unchecked insert reports success having changed nothing. The house rule.
    if (error || !decision) return;

    // The edge is what lets Learn walk back from a graded outcome to the call
    // that caused it. Without it the decision row exists and is an orphan.
    await recordLineageSafe(supabase, userId, {
      parent_kind: "opportunity",
      parent_id: input.id,
      child_kind: "decision",
      child_id: (decision as { id: string }).id,
      relation: "decided",
      rationale: "Settled at the judgment gate",
      created_by_agent: null,
    });
  } catch {
    // Never block the settle. See the header.
  }
}

export const deleteOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- PRDs ----------

export const listPrds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prds")
      .select("id,title,status,updated_at,opportunity_id,github_issue_url")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { prds: data ?? [] };
  });

/**
 * Specs table (Product · Specs, Ember Editorial port): PRD rows plus the
 * Critic verdict and citation payload the reference's State/Critic/Cites
 * columns render. Additive — `listPrds` keeps its narrow select for existing
 * consumers (roadmap, pickers).
 */
export const listSpecs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prds")
      .select(
        "id,title,status,updated_at,opportunity_id,github_issue_url,critic_review,citations,project_id,design_gate_status",
      )
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { prds: data ?? [] };
  });

export const getPrd = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("prds")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { prd: row };
  });

// ---------- CNV-01: The Outcome Contract (typed dual projection) ----------
// v12 sec 7.4: a typed contract (JSONB sections) alongside body_md, backward
// compatible. body_md stays the human narrative; `contract` is the machine
// view an agent can consume directly instead of re-parsing prose. Clauses
// are individually supersedable using the same standing/superseded idiom
// FS-02's `assumptions.status` already uses (an edit never overwrites a
// clause in place; see supersedeContractClause below).

const ContractClauseSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(2000),
  status: z.enum(["standing", "superseded"]),
  superseded_by: z.string().uuid().nullable(),
  // Filled in by CNV-02's requirement-to-oracle compiler; every clause starts
  // unclassified. oracle_ref points at the eval_case id ("eval"), the
  // assumption id ("unverifiable"), or an inline label/checklist text
  // ("ci"/"uat" — no separate row needed for those two kinds).
  oracle_kind: z.enum(["eval", "ci", "uat", "unverifiable"]).nullable(),
  oracle_ref: z.string().max(2000).nullable(),
  // "uat" clauses only: a real checklist item the human ticks off.
  uat_checked: z.boolean().optional(),
  uat_checked_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type ContractClause = z.infer<typeof ContractClauseSchema>;

export const OutcomeContractSchema = z.object({
  version: z.number().int().min(1),
  intent: z.string().max(2000),
  evidence_links: z
    .array(
      z.object({
        source_kind: z.string().max(40),
        source_id: z.string().max(100),
        title: z.string().max(200).nullable(),
      }),
    )
    .default([]),
  success_metrics: z.array(ContractClauseSchema).default([]),
  non_goals: z.array(ContractClauseSchema).default([]),
  budget: z
    .object({
      estimate: z.string().max(200).nullable(),
      blast_radius: z.string().max(500).nullable(),
    })
    .nullable(),
  ambiguity_policy: z.string().max(1000).nullable(),
  drafted_by: z.enum(["agent", "human"]),
  drafted_at: z.string(),
});
export type OutcomeContract = z.infer<typeof OutcomeContractSchema>;

const CONTRACT_DRAFT_SYSTEM = `You are the Supaprod contract analyst. Given a spec's title and markdown body, extract a structured Outcome Contract from what it already says.
Rules:
- intent: one tight paragraph, the core bet in plain language.
- success_metrics: the acceptance criteria / success metrics as short, individually falsifiable statements (max 8, most load-bearing first).
- non_goals: what is explicitly out of scope, as short statements (max 6).
- budget_estimate and blast_radius: a rough cost/effort note and what breaks if this goes wrong, only if the text actually addresses them, else null.
- ambiguity_policy: one sentence on how to resolve ambiguity, only if the text states or clearly implies one, else null.
- Extract only what the text supports. Never invent a metric, non-goal, or policy it does not contain.
- Signal-first: state each item directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"intent": "...", "success_metrics": ["..."], "non_goals": ["..."], "budget_estimate": "..." or null, "blast_radius": "..." or null, "ambiguity_policy": "..." or null}`;

function draftedClause(text: string, nowIso: string): ContractClause {
  return {
    id: crypto.randomUUID(),
    text: text.slice(0, 2000),
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: nowIso,
  };
}

function draftedStrings(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .slice(0, max)
    .map((s) => s.trim());
}

/**
 * Pure: mark one clause superseded and append its replacement as a new
 * standing clause. Never mutates a clause in place, so a machine reader can
 * always see what a requirement used to say and why it changed. Exported for
 * unit tests (same pattern as assumption-watch.server.ts's deriveWatchVerdict).
 */
export function supersedeClause(
  clauses: ContractClause[],
  clauseId: string,
  newText: string,
  nowIso: string,
): ContractClause[] {
  const idx = clauses.findIndex((c) => c.id === clauseId);
  if (idx === -1) throw new Error("Clause not found");
  if (clauses[idx].status === "superseded") throw new Error("That clause is already superseded");

  const next = draftedClause(newText, nowIso);
  const updated = [...clauses];
  updated[idx] = { ...updated[idx], status: "superseded", superseded_by: next.id };
  updated.push(next);
  return updated;
}

/**
 * AI: structure an existing PRD's narrative body into an Outcome Contract.
 * Returns a DRAFT only — nothing is persisted here. The lazy-migration flow
 * this backs (v12: "AI structures on open, human confirms") always ends with
 * the human reviewing the draft and calling savePrd({ id, contract }) to
 * apply it, same as any other spec edit.
 */
export const draftContractFromPrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");
    if (!(prd.body_md ?? "").trim()) throw new Error("This spec has no content to structure yet");

    const res = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_draft",
      model: "google/gemini-2.5-flash",
      workspaceId: prd.workspace_id,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_DRAFT_SYSTEM },
        {
          role: "user",
          content: `TITLE: ${prd.title}\n\nBODY:\n${(prd.body_md ?? "").slice(0, 12000)}`,
        },
      ],
    });
    const j = (res.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
    };

    const nowIso = new Date().toISOString();
    const intent = typeof j.intent === "string" ? j.intent.trim().slice(0, 2000) : "";
    if (!intent) throw new Error("Could not extract a clear intent from this spec's content");

    const budgetEstimate =
      typeof j.budget_estimate === "string" ? j.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof j.blast_radius === "string" ? j.blast_radius.trim().slice(0, 500) : null;

    const contract: OutcomeContract = {
      version: 1,
      intent,
      evidence_links: [],
      success_metrics: draftedStrings(j.success_metrics, 8).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(j.non_goals, 6).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof j.ambiguity_policy === "string" ? j.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };
    return { contract };
  });

// ---------- CNV-04: agent-authored contracts (the friction killer) ----------

const CONTRACT_FROM_INTENT_SYSTEM = `You are the Supaprod contract author. Given a one-line product intent plus standing workspace context and precedent (prior specs, docs, notes, meetings — numbered chunks you may draw from), draft a full Outcome Contract in seconds so the human edits deltas instead of writing from a blank page.
Rules:
- intent: restate the bet as one tight, sharpened paragraph (not the one-liner verbatim).
- success_metrics: up to 6 falsifiable acceptance criteria / success metrics, most load-bearing first.
- non_goals: up to 5 explicit out-of-scope statements.
- budget_estimate: a rough size/effort note (e.g. "Size M, roughly 2-3 days"). Null if nothing in the intent or context supports an estimate.
- blast_radius: what breaks or is at risk if this goes wrong. Null if genuinely unclear.
- ambiguity_policy: one sentence on how to resolve ambiguity while building this — default to the reversible interpretation, log the assumption, escalate only if irreversible or over budget.
- clarifying_questions: at most 5 questions, ONLY the ones that are genuinely load-bearing and cannot be inferred from the intent or context. Empty array if there is nothing that actually blocks starting.
- narrative: a short Markdown body (## Problem, ## Approach, ## Success Metrics, ## Non-Goals, ## Budget & Risk), under 400 words, restating the same content for human reading. Cite context chunks inline as [n] where you draw from them.
- Ground everything you can in the provided context. Where nothing supports a field, still fill intent/success_metrics/non_goals from the intent alone, but leave budget_estimate/blast_radius/ambiguity_policy null rather than inventing specifics.
- Signal-first: state each item directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"intent": "...", "success_metrics": ["..."], "non_goals": ["..."], "budget_estimate": "..." or null, "blast_radius": "..." or null, "ambiguity_policy": "...", "clarifying_questions": ["..."], "narrative": "..."}`;

/**
 * AI: draft a full Outcome Contract from a one-line intent — standing
 * context and precedent pulled from the same RAG index generatePrd already
 * uses (prior PRDs are indexed as source_kind "prd", so precedent is real,
 * not just workspace docs). Unlike draftContractFromPrd (which drafts a
 * PREVIEW for an existing spec the human must apply), this creates the spec
 * immediately: v12's "the agent authors the contract in seconds," so the
 * human's first touch is judging deltas on a real row, not confirming a
 * blank-page draft into existence.
 */
export const draftContractFromIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ intent: z.string().trim().min(3).max(400) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    let chunks: Awaited<ReturnType<typeof retrieve>> = [];
    try {
      chunks = await retrieve(supabase, userId, { query: data.intent, k: 8, mmr: true });
    } catch {
      chunks = [];
    }
    const citations = chunks.map((c, i) => ({
      n: i + 1,
      source_kind: c.source_kind,
      source_id: c.source_id,
      title: c.title ?? null,
      snippet: c.content.slice(0, 280),
      score: Number((c.similarity ?? 0).toFixed(3)),
    }));
    const contextBlock =
      chunks.length === 0
        ? "\n\n(No standing context or precedent found for this intent — draft from the intent alone.)"
        : `\n\nSTANDING CONTEXT + PRECEDENT (cite as [n] in the narrative if you draw from it):\n${chunks
            .map(
              (c, i) =>
                `[${i + 1}] (${c.source_kind}${c.title ? ` · ${c.title.slice(0, 80)}` : ""}) ${c.content.slice(0, 600)}`,
            )
            .join("\n\n")}`;

    const res = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_from_intent",
      model: "google/gemini-2.5-pro",
      fallbackModel: "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_FROM_INTENT_SYSTEM },
        { role: "user", content: `ONE-LINE INTENT: ${data.intent}${contextBlock}` },
      ],
    });
    const j = (res.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
      clarifying_questions?: unknown;
      narrative?: unknown;
    };

    const nowIso = new Date().toISOString();
    const intent =
      typeof j.intent === "string" && j.intent.trim()
        ? j.intent.trim().slice(0, 2000)
        : data.intent;
    const budgetEstimate =
      typeof j.budget_estimate === "string" ? j.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof j.blast_radius === "string" ? j.blast_radius.trim().slice(0, 500) : null;
    const clarifyingQuestions = draftedStrings(j.clarifying_questions, 5).map((q) =>
      q.slice(0, 300),
    );

    const contract: OutcomeContract = {
      version: 1,
      intent,
      evidence_links: citations.map((c) => ({
        source_kind: c.source_kind,
        source_id: c.source_id ?? "",
        title: c.title,
      })),
      success_metrics: draftedStrings(j.success_metrics, 6).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(j.non_goals, 5).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof j.ambiguity_policy === "string" ? j.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };

    let narrative = typeof j.narrative === "string" ? j.narrative.trim() : "";
    if (!narrative) narrative = `## Intent\n${intent}`;
    if (clarifyingQuestions.length > 0) {
      narrative = `## Open questions for you\n${clarifyingQuestions.map((q) => `- ${q}`).join("\n")}\n\n${narrative}`;
    }
    narrative = narrative.slice(0, 8000);

    const title = data.intent.length <= 80 ? data.intent : `${data.intent.slice(0, 77)}…`;

    const { data: prd, error } = await supabase
      .from("prds")
      .insert({
        user_id: userId,
        title,
        body_md: narrative,
        model: "google/gemini-2.5-pro",
        citations,
        contract,
        contract_migrated_at: nowIso,
      })
      .select()
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Could not create the spec");

    // SEAM-1: stage history for the created spec (DB default status is draft).
    await recordStageEvent(supabase, {
      entityType: "spec",
      entityId: prd.id,
      from: null,
      to: prd.status ?? "draft",
      actor: "human",
      workspaceId: prd.workspace_id,
      userId,
    });

    await runCritic(supabase, userId, { kind: "prd", id: prd.id });

    // AGT-03: while the human reviews this freshly drafted contract, pre-stage
    // a design scaffold in the background — fire-and-forget, never awaited,
    // never lets a prep failure affect this response.
    void prepareScaffoldSpeculative(supabase, userId, { prdId: prd.id, specBody: narrative }).catch(
      () => {},
    );

    // RPT-23: automatically compile contract oracles (the machine-checkable eval
    // twin) at creation time. Fire-and-forget: the human reviews the contract
    // while the eval suite and assumptions are prepared in the background, and a
    // prep failure never affects this response. Calls the core directly (not the
    // server-fn wrapper) so it runs with this handler's supabase/userId context.
    void compileContractOraclesCore(supabase, userId, prd.id, { guardConcurrentEdit: true }).catch(
      () => {},
    );

    return { prd, clarifying_questions: clarifyingQuestions };
  });

/**
 * Supersede one contract clause: the prior clause is marked superseded and
 * points at its replacement, a new standing clause is appended. Never
 * mutates a clause in place, so a machine reader can always see what a
 * requirement used to say and why it changed.
 */
export const supersedeContractClause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        section: z.enum(["success_metrics", "non_goals"]),
        clause_id: z.string().uuid(),
        new_text: z.string().min(1).max(2000),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("contract")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");

    let contract: z.infer<ReturnType<typeof OutcomeContractSchema.partial>>;
    try {
      contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
    } catch {
      throw new Error("This spec's contract is in an unexpected shape and cannot be edited here");
    }
    const nowIso = new Date().toISOString();
    const clauses = supersedeClause(
      contract[data.section] ?? [],
      data.clause_id,
      data.new_text,
      nowIso,
    );

    const updatedContract = { ...contract, [data.section]: clauses };
    const { data: updated, error: upErr } = await supabase
      .from("prds")
      .update({ contract: updatedContract, updated_at: nowIso })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);
    if (!updated) throw new Error("Spec not found");
    // RPT-32: a human superseding an AGENT-drafted contract clause is a
    // first-class "edit" gate signal (the human correcting the contract analyst's
    // draft), the highest-signal correction data. Best-effort and awaited so it
    // survives the Workers response teardown but can never break the edit
    // (recordGateSignalCore never throws). Skipped when the contract was
    // human-drafted, since editing your own draft is not a correction of an agent.
    if (contract.drafted_by === "agent") {
      await recordGateSignalCore(supabase, userId, {
        gateType: "edit",
        subjectType: "contract_clause",
        subjectRef: data.clause_id,
        agentSlug: "metric:contract-clause",
        verdict: "edited",
        diffSummary: `${data.section}: ${data.new_text}`.slice(0, 500),
      });
    }
    return { contract: updatedContract };
  });

// ---------- CNV-02: the requirement-to-oracle compiler ----------
// v12 sec 7.2: "a requirement without an oracle is an assumption, and
// assumptions get watched, not asserted." Compiles each success-metric
// clause into whichever real oracle already exists for its kind: an eval
// case (evals engine, LLM-judged), the standard CI gate (inline label, no
// new artifact — Supaprod cannot mint a GitHub check per clause), a UAT
// checklist item (inline, human-ticked), or — when a clause is not
// falsifiable as written — a watched assumption (FS-02), so it is tracked
// against contradicting signals instead of silently asserted.

const ORACLE_CLASSIFY_SYSTEM = `You are the Supaprod oracle compiler. For each acceptance-criteria clause from a spec's Outcome Contract, classify how it can be verified.
Rules:
- "eval": a qualitative or behavioral claim an LLM judge can grade against the spec's intent. Most product claims land here.
- "ci": already covered by the standard CI gate (type-check, lint, automated tests) with no new artifact needed. Use ONLY for claims that are inherently about code correctness or build health, not product behavior.
- "uat": requires a human to manually verify (visual or design judgment, external system state, anything an LLM cannot check from text alone).
- "unverifiable": not falsifiable as written — vague, unmeasurable, or opinion, and cannot become a real oracle without rewriting the clause itself.
- Exactly one classification per clause, indexed to match the input.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"classifications": [{"index": 0, "oracle_kind": "eval" | "ci" | "uat" | "unverifiable", "rationale": "max 140 chars"}]}`;

type OracleKind = "eval" | "ci" | "uat" | "unverifiable";

/**
 * Pure: turn the model's raw classification JSON into a validated
 * index -> oracle_kind map. An out-of-range or malformed entry is dropped
 * rather than trusted. Exported for unit tests (same pattern as
 * assumption-watch.server.ts's deriveWatchVerdict).
 */
export function deriveOracleClassifications(
  raw: unknown[],
  count: number,
): Map<number, OracleKind> {
  const kindByIndex = new Map<number, OracleKind>();
  for (const r of raw) {
    const o = (r ?? {}) as Record<string, unknown>;
    const idx = Number(o.index);
    const kind = o.oracle_kind;
    if (
      Number.isInteger(idx) &&
      idx >= 0 &&
      idx < count &&
      (kind === "eval" || kind === "ci" || kind === "uat" || kind === "unverifiable")
    ) {
      kindByIndex.set(idx, kind);
    }
  }
  return kindByIndex;
}

/**
 * Compile every unclassified success-metric clause on a spec's contract into
 * a real oracle. Idempotent per clause: already-classified clauses are
 * skipped, so re-running after adding new metrics only compiles the new
 * ones. Best-effort on the assumption-filing half (a failed insert still
 * leaves the clause correctly classified "unverifiable"; only the pointer
 * back to the assumption row is missing).
 */
export const compileContractOracles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(({ context, data }) =>
    compileContractOraclesCore(context.supabase, context.userId, data.id),
  );

/**
 * CNV-02 oracle-compilation core, callable with an explicit (supabase, userId).
 * Runs both from the server-fn wrapper AND fire-and-forget at spec creation,
 * where there is no request context to run the auth middleware. Compiling the
 * machine-checkable eval twin automatically at creation is the RPT-23
 * "attached at creation" half; the savePrd approve gate is the enforcement half.
 */
async function compileContractOraclesCore(
  supabase: SupabaseClient,
  userId: string,
  prdId: string,
  opts: { guardConcurrentEdit?: boolean } = {},
) {
  const { data: prd, error } = await supabase
    .from("prds")
    .select("id,title,workspace_id,contract,updated_at")
    .eq("id", prdId)
    .single();
  if (error || !prd) throw new Error(error?.message ?? "Spec not found");
  const readUpdatedAt = (prd as { updated_at?: string | null }).updated_at ?? null;

  const contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
  const metrics = contract.success_metrics ?? [];
  const uncompiled = metrics.filter((c) => c.status === "standing" && !c.oracle_kind);
  if (uncompiled.length === 0) {
    return { contract, eval_cases_created: 0, ci_count: 0, uat_count: 0, assumptions_filed: 0 };
  }

  const res = await callModel(supabase, userId, {
    surface: "prd",
    surface_ref: "oracle_compile",
    model: "google/gemini-2.5-flash",
    workspaceId: prd.workspace_id,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: ORACLE_CLASSIFY_SYSTEM },
      { role: "user", content: uncompiled.map((c, i) => `[${i}] ${c.text}`).join("\n") },
    ],
  });
  const raw = extractArrayField(res.json, "classifications") ?? [];
  const kindByIndex = deriveOracleClassifications(raw, uncompiled.length);
  const kindFor = (clauseId: string): OracleKind => {
    const idx = uncompiled.findIndex((u) => u.id === clauseId);
    return idx === -1 ? "unverifiable" : (kindByIndex.get(idx) ?? "unverifiable");
  };

  const evalTargets = uncompiled.filter((c) => kindFor(c.id) === "eval");
  const oracleRefByClauseId = new Map<string, string>();
  let evalCasesCreated = 0;

  if (evalTargets.length > 0) {
    const { data: existingSuite } = await supabase
      .from("eval_suites")
      .select("id")
      .eq("prd_id", prdId)
      .maybeSingle();
    let suiteId = (existingSuite?.id as string | undefined) ?? null;
    if (!suiteId) {
      const { data: newSuite, error: suiteErr } = await supabase
        .from("eval_suites")
        .insert({
          user_id: userId,
          name: `Spec acceptance: ${prd.title}`.slice(0, 200),
          description: "Compiled from this spec's Outcome Contract success metrics (CNV-02).",
          surface: "prd-acceptance",
          prompt_key: `prd:${prdId}`,
          prd_id: prdId,
        })
        .select("id")
        .single();
      if (suiteErr || !newSuite) {
        throw new Error(suiteErr?.message ?? "Could not create the eval suite");
      }
      suiteId = newSuite.id;
    }

    const { data: newCases, error: caseErr } = await supabase
      .from("eval_cases")
      .insert(
        evalTargets.map((c) => ({
          user_id: userId,
          suite_id: suiteId,
          name: c.text.slice(0, 200),
          input:
            `Spec: ${prd.title}\n\nDoes the implementation satisfy this acceptance criterion?\n${c.text}`.slice(
              0,
              20000,
            ),
          rubric: c.text.slice(0, 4000),
        })),
      )
      // A single multi-row INSERT's RETURNING preserves the VALUES order,
      // so zipping by index against evalTargets is safe here.
      .select("id");
    if (caseErr || !newCases) throw new Error(caseErr?.message ?? "Could not create eval cases");
    evalTargets.forEach((c, i) => {
      const row = newCases[i];
      if (row) oracleRefByClauseId.set(c.id, row.id);
    });
    evalCasesCreated = newCases.length;
  }

  const unverifiableTargets = uncompiled.filter((c) => kindFor(c.id) === "unverifiable");
  let assumptionsFiled = 0;
  if (unverifiableTargets.length > 0) {
    const { data: newAssumptions, error: aErr } = await supabase
      .from("assumptions")
      .insert(
        unverifiableTargets.map((c) => ({
          user_id: userId,
          workspace_id: prd.workspace_id,
          prd_id: prdId,
          statement: c.text.slice(0, 500),
        })),
      )
      .select("id");
    if (!aErr && newAssumptions) {
      unverifiableTargets.forEach((c, i) => {
        const row = newAssumptions[i];
        if (row) oracleRefByClauseId.set(c.id, row.id);
      });
      assumptionsFiled = newAssumptions.length;
    }
  }

  let ciCount = 0;
  let uatCount = 0;
  const updatedMetrics = metrics.map((c) => {
    if (c.status !== "standing" || c.oracle_kind) return c;
    const kind = kindFor(c.id);
    if (kind === "ci") {
      ciCount++;
      return {
        ...c,
        oracle_kind: "ci" as const,
        oracle_ref: "Covered by the standard CI gate (type-check, lint, automated tests).",
      };
    }
    if (kind === "uat") {
      uatCount++;
      return { ...c, oracle_kind: "uat" as const, oracle_ref: c.text, uat_checked: false };
    }
    return { ...c, oracle_kind: kind, oracle_ref: oracleRefByClauseId.get(c.id) ?? null };
  });

  const updatedContract = { ...contract, success_metrics: updatedMetrics };
  let updateQuery = supabase
    .from("prds")
    .update({ contract: updatedContract, updated_at: new Date().toISOString() })
    .eq("id", prdId);
  // Optimistic concurrency for the fire-and-forget creation path: this compile
  // read the contract seconds ago and did a multi-second AI round-trip, so a
  // full-column write here could clobber a concurrent user edit (supersede /
  // save / UAT toggle) made in that window. Guard on the read-time updated_at so
  // a compile that lost the race no-ops instead of silently overwriting the edit.
  // The user-initiated "Compile" button (no guard) keeps its unconditional write,
  // since the user's own click is the latest intent.
  if (opts.guardConcurrentEdit && readUpdatedAt) {
    updateQuery = updateQuery.eq("updated_at", readUpdatedAt);
  }
  const { error: upErr } = await updateQuery;
  if (upErr) throw new Error(upErr.message);

  return {
    contract: updatedContract,
    eval_cases_created: evalCasesCreated,
    ci_count: ciCount,
    uat_count: uatCount,
    assumptions_filed: assumptionsFiled,
  };
}

/** Tick or untick a "uat" clause's manual checklist item. */
export const toggleUatChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ id: z.string().uuid(), clause_id: z.string().uuid(), checked: z.boolean() })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("contract")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");

    const contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
    const metrics = contract.success_metrics ?? [];
    const idx = metrics.findIndex((c) => c.id === data.clause_id);
    if (idx === -1) throw new Error("Clause not found");
    if (metrics[idx].oracle_kind !== "uat") throw new Error("Not a UAT checklist clause");

    const nowIso = new Date().toISOString();
    const updatedMetrics = [...metrics];
    updatedMetrics[idx] = {
      ...updatedMetrics[idx],
      uat_checked: data.checked,
      uat_checked_at: data.checked ? nowIso : null,
    };

    const updatedContract = { ...contract, success_metrics: updatedMetrics };
    const { data: updated, error: upErr } = await supabase
      .from("prds")
      .update({ contract: updatedContract, updated_at: nowIso })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);
    if (!updated) throw new Error("Spec not found");
    return { contract: updatedContract };
  });

export const savePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        body_md: z.string().max(50_000).optional(),
        status: z.enum(["draft", "review", "approved", "shipped"]).optional(),
        // CNV-01: the human's confirm step for a drafted/edited Outcome Contract.
        // savePrd is the one write path for both projections (narrative + typed),
        // so status-transition and history logic below never has to special-case it.
        contract: OutcomeContractSchema.optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { supabase, userId } = context;

    // Capture prior status so we can detect a draft/review → approved transition
    // and write a Decisions log entry exactly once. `contract` is read too so the
    // RPT-23 verifiability gate can grade the effective contract on approval.
    const { data: prior } = await supabase
      .from("prds")
      .select("status,workspace_id,title,body_md,contract,model")
      .eq("id", id)
      .maybeSingle();

    // RPT-23: an Outcome Contract that can never be checked on outcome day must
    // not be signed off. On a first approve transition, grade the effective
    // contract (the one being saved, else the one already on the spec); if it
    // has metrics but none are verifiable ("hazy"), refuse the approval and tell
    // the owner exactly what to fix. A spec with no contract at all is exempt so
    // legacy specs still approve. This is the "receipts are the test suite of
    // decision work, enforced at creation" gate.
    if (rest.status === "approved" && (prior?.status ?? null) !== "approved") {
      const rawContract =
        rest.contract ?? (prior as { contract?: unknown } | null)?.contract ?? null;
      const parsed = OutcomeContractSchema.partial().safeParse(rawContract ?? {});
      if (parsed.success && (parsed.data.intent ?? "").trim()) {
        const grade = gradeOutcomeContract({ success_metrics: parsed.data.success_metrics ?? [] });
        if (grade.blocksApproval) {
          throw new Error(`Can't approve this spec yet. ${grade.reason}`);
        }
      }
    }

    const patch: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
    if (rest.contract && rest.contract.intent.trim()) {
      patch.contract_migrated_at = new Date().toISOString();
    }
    // PC-10 capture-on-write (human edit): when the body actually changes,
    // snapshot the prior body so the owner can one-key Rewind their own in-place
    // edit too, not only agent revisions. Bare-string shape, matching
    // revertPrdToPrevious; skipped on a pure status/title save (no body change)
    // so a snapshot is never a no-op copy of the current body.
    if (rest.body_md !== undefined && prior && rest.body_md !== prior.body_md) {
      patch.snapshot_before = prior.body_md;
    }

    const { data: row, error } = await supabase
      .from("prds")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // RPT-32: capture a human's spec-BODY edit of an AGENT-drafted spec as an
    // "edit" gate signal, but ONLY at a status-bearing checkpoint (an explicit
    // advance, not a keystroke autosave) whose body differs from the prior save,
    // so per-keystroke saves never inflate the correction rate. Best-effort and
    // awaited (never throws); skipped for human-authored specs (no model) and
    // unchanged bodies.
    if (
      rest.status &&
      typeof rest.body_md === "string" &&
      rest.body_md !== (prior?.body_md ?? null) &&
      (prior as { model?: string | null } | null)?.model
    ) {
      await recordGateSignalCore(supabase, userId, {
        gateType: "edit",
        subjectType: "spec",
        subjectRef: id,
        agentSlug: "metric:spec-body",
        verdict: "edited",
        diffSummary: `spec body edited before ${rest.status}`,
        workspaceId: (prior as { workspace_id?: string | null } | null)?.workspace_id ?? null,
      });
    }

    // SEAM-1: stage history for a status-bearing spec save (helper skips no-ops).
    if (rest.status) {
      await recordStageEvent(supabase, {
        entityType: "spec",
        entityId: id,
        from: prior?.status ?? null,
        to: rest.status,
        actor: "human",
        workspaceId: prior?.workspace_id ?? null,
        userId,
      });
    }

    // F-DECISIONS-CAPTURE: spec approval is a logged decision. Idempotent on prd_id.
    if (prior && rest.status === "approved" && prior.status !== "approved") {
      const { count } = await supabase
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("prd_id", id);
      if ((count ?? 0) === 0) {
        const title = (rest.title ?? prior.title ?? "Untitled spec").slice(0, 240);
        const rationale = (prior.body_md ?? "").slice(0, 500) || "Spec approved.";
        const { data: decision } = await supabase
          .from("decisions")
          .insert({
            user_id: userId,
            workspace_id: prior.workspace_id,
            title: `Spec approved: ${title}`,
            rationale,
            status: "approved",
            prd_id: id,
            source_kind: "prd",
          })
          .select("id")
          .single();
        if (decision) {
          // SEAM-1: stage history for the captured decision.
          await recordStageEvent(supabase, {
            entityType: "decision",
            entityId: decision.id,
            from: null,
            to: "approved",
            actor: "human",
            workspaceId: prior.workspace_id,
            userId,
          });
        }
      }
    }

    return { prd: row };
  });

export const deletePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("prds").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Create a GitHub issue from a PRD and link it back on the PRD row.
 * One-click bridge between Build → PRDs and the Build Console: once an issue
 * exists, the "Send to Builder" button on the PRD detail page lights up.
 * Idempotent on the PRD: if github_issue_url is already set, returns it.
 */
export const createGithubIssueForPrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,body_md,github_issue_url,workspace_id")
      .eq("id", data.id)
      .single();
    if (prdErr) throw new Error(prdErr.message);
    if (prd.github_issue_url) {
      return { url: prd.github_issue_url, cached: true };
    }

    const gh = await resolveGitHub({
      userId,
      workspaceId: prd.workspace_id,
      userClient: supabase as unknown as SupabaseClient,
    });

    const body = `${(prd.body_md ?? "").slice(0, 55_000)}\n\n---\n_Opened from Supaprod PRD ${prd.id}_`;
    const res = await fetch(`https://api.github.com/repos/${gh.repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "supaprod-agent",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: prd.title.slice(0, 250), body, labels: ["supaprod", "prd"] }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub ${res.status}: ${txt.slice(0, 400)}`);
    }
    const json = (await res.json()) as { number: number; html_url: string };

    const { error: upErr } = await supabase
      .from("prds")
      .update({ github_issue_url: json.html_url, updated_at: new Date().toISOString() })
      .eq("id", prd.id);
    if (upErr) throw new Error(upErr.message);

    return { url: json.html_url, number: json.number, cached: false };
  });

/**
 * PURE. THE TEARDOWN THE USER ALREADY PAID FOR, RENDERED FOR THE SPEC WRITER.
 *
 * WHAT WAS HAPPENING. `generatePrd` fetches the opportunity with select("*"),
 * so `critic_review` -- the Critic's risks, kill criteria and missing evidence
 * on this exact bet -- was already in memory, and the prompt that writes the
 * spec's "## Risks & Open Questions" was assembled from title, problem, target
 * user, hypothesis and the three ICE numbers only. Measured live 2026-08-06: 47
 * of 289 opportunities carry a critic_review, and every one of them lost it at
 * this step.
 *
 * WHY IT IS THE EXPENSIVE ONE. A person presses `c` on /decide, waits for a
 * model to red-team the bet, reads "assumes SSO is already shipped; kill if
 * fewer than three enterprise accounts ask", then presses `a`. The spec's own
 * risk section was then written by a model that had never seen one word of it,
 * so the only way to keep the teardown was to retype it into the editor. The
 * product was deleting its own most expensive output at the moment of handoff.
 *
 * DEFENSIVE ON PURPOSE. `critic_review` is a jsonb column written by a model,
 * so every field is checked rather than trusted. A review with nothing usable
 * in it returns "" and the prompt is left exactly as it was, rather than
 * carrying an empty heading that implies a red team happened.
 */
export function formatBetTeardown(review: unknown): string {
  if (!review || typeof review !== "object" || Array.isArray(review)) return "";
  const r = review as Record<string, unknown>;
  const lines = (v: unknown, max: number) =>
    Array.isArray(v)
      ? v
          .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
          .slice(0, max)
          .map((s) => `- ${s.trim().slice(0, 400)}`)
      : [];
  const risks = lines(r.risks, 8);
  const kill = lines(r.kill_criteria, 6);
  const missing = lines(r.missing_evidence, 6);
  const summary = typeof r.summary === "string" ? r.summary.trim().slice(0, 400) : "";
  const verdict =
    typeof r.verdict === "string" && ["ship", "revise", "kill"].includes(r.verdict.trim())
      ? r.verdict.trim()
      : "";
  if (!risks.length && !kill.length && !missing.length && !summary) return "";

  const parts: string[] = [];
  if (verdict) parts.push(`Verdict: ${verdict}.`);
  if (summary) parts.push(summary);
  if (risks.length) parts.push(`Risks the Critic named:\n${risks.join("\n")}`);
  if (kill.length) parts.push(`What would kill this bet:\n${kill.join("\n")}`);
  if (missing.length) parts.push(`Evidence the Critic found missing:\n${missing.join("\n")}`);

  return `\n\nPRIOR REVIEW (the Critic's teardown of THIS bet, already run and already read by the person who kept it):\n${parts.join(
    "\n\n",
  )}`;
}

/**
 * PURE. THE PROMISE THE SPEC JUST MADE, IN THE TWO COLUMNS PLAN READS.
 *
 * `generatePrd` drafts success metrics into `prds.contract.success_metrics` and
 * then places the bet in the Next lane with `roadmap_outcome` and
 * `roadmap_measure` left null. Nothing copied one into the other, so /plan's
 * undeclared Gate fired immediately -- "it is a task rather than a promise, and
 * nothing can tell you later whether it worked" -- and opened a BLANK dialog on
 * a bet whose promise the product had written forty seconds earlier. The person
 * read the metric off the spec and typed it back in.
 *
 * THE MAPPING IS NOT ARBITRARY. `roadmap_outcome` is "what changes for the
 * user" (CommitCeremony's own label) and the contract's `intent` is the core
 * bet in plain language, which is the same sentence. `roadmap_measure` is "how
 * we will know", and that is what the success metrics are: short, individually
 * falsifiable statements, most load-bearing first. Two of them at most, because
 * a measure nobody can hold in their head is not a measure.
 *
 * BOTH OR NEITHER, because `isCommitmentGoverned` (roadmap-governance.ts:32)
 * counts a bet as declared only when it carries both, and /plan's Gate says in
 * words that an undeclared bet carries "no outcome and no measure". Seeding one
 * of the two would leave that sentence false on the next station.
 *
 * The MODEL'S intent only, never the assembled fallback. `contractIntent` falls
 * back to the source block ("Title: ... Problem: ...") when the model returns
 * nothing, and filing that as the outcome a team promised would be worse than
 * leaving the promise undeclared and letting the Gate ask for it.
 */
export function commitmentFromContract(input: {
  intent: string | null;
  success_metrics: ContractClause[];
}): { outcome: string; measure: string } | null {
  const intent = (input.intent ?? "").trim();
  const metrics = input.success_metrics
    .filter((c) => c.status !== "superseded")
    .map((c) => c.text.trim())
    .filter((t) => t.length > 0);
  if (!intent || metrics.length === 0) return null;
  return {
    outcome: intent.slice(0, ROADMAP_TEXT_MAX),
    measure: metrics.slice(0, 2).join("; ").slice(0, ROADMAP_TEXT_MAX),
  };
}

/**
 * THE DECIDE -> PLAN HANDOFF: the lane, the promise, and the judgment.
 *
 * Lifted out of `generatePrd` so the second press of "Keep it" can run it too.
 * A bet whose placement was refused the first time is repaired by pressing the
 * key again, which costs one update rather than three model calls.
 *
 * `next`, not `now`. Keeping a bet means the call is made, not that anyone has
 * started; claiming `now` would put work in flight that nobody scheduled.
 *
 * NEVER OVERWRITES. The `.is("roadmap_bucket", null)` filter is the guard: a
 * human who already placed this bet has said something more specific than a
 * default can, and a draft must not move work behind their back. The seeded
 * promise is held to the same rule -- it is written only when BOTH columns are
 * blank, so an agent's sentence can never displace a person's.
 *
 * THE ERROR IS READ NOW. supabase-js RESOLVES a refused write rather than
 * throwing, so the old `const { data: placed }` reported success having changed
 * nothing: an RLS refusal or a PostgREST schema-cache miss left `placed` null,
 * no stage event was written, and /decide still said "Keeping it drafts the
 * spec and moves it into Plan". Live on 2026-08-06, 0 of 289 opportunities
 * carry a roadmap_bucket, so this path has never been observed to succeed in
 * production and the code could not tell anyone why.
 *
 * PARTIAL, AND THIS SENTENCE IS THE HONEST PART: the report travels back on the
 * handler's result, and no surface renders it yet. /decide's `draftSpec`
 * mutation (src/routes/_authenticated.decide.tsx:473-490) navigates to the spec
 * on success and drops every other field, so a refused lane is currently
 * findable in the Worker log and in the returned object, not on the screen.
 */
async function placeKeptBetInNext(
  supabase: SupabaseClient,
  userId: string,
  opp: {
    id: string;
    roadmap_bucket: string | null;
    roadmap_outcome: string | null;
    roadmap_measure: string | null;
  },
  seed: { outcome: string; measure: string } | null,
): Promise<{ moved: boolean; note: string | null }> {
  if (opp.roadmap_bucket) {
    return {
      moved: false,
      note: `This bet was already in the ${opp.roadmap_bucket} lane, so the lane was left as it was.`,
    };
  }
  const refused = {
    moved: false,
    note: "The lane did not move, so this bet is not on the Plan board yet. The spec was written and is safe.",
  };

  const patch: Record<string, unknown> = { roadmap_bucket: "next" };
  if (seed && !opp.roadmap_outcome?.trim() && !opp.roadmap_measure?.trim()) {
    patch.roadmap_outcome = seed.outcome;
    patch.roadmap_measure = seed.measure;
  }

  try {
    const { data: placed, error: placeErr } = await supabase
      .from("opportunities")
      .update(patch)
      .eq("id", opp.id)
      .is("roadmap_bucket", null)
      .select("id,workspace_id,title,impact,confidence,ease,project_id,product_id");
    if (placeErr) {
      console.error(`[keep] opportunity ${opp.id} did not reach Next: ${placeErr.message}`);
      return refused;
    }
    const row = placed?.[0] as
      ({ workspace_id: string | null } & Record<string, unknown>) | undefined;
    // An empty row set IS the refusal case, and it is the one the old code read
    // as success. The already-placed reading is ruled out above, off the row
    // this handler had already fetched.
    if (!row) return refused;

    await recordStageEvent(supabase, {
      entityType: "opportunity",
      entityId: opp.id,
      from: null,
      to: "next",
      actor: "human",
      workspaceId: row.workspace_id,
      userId,
    });

    /**
     * THE PRIMARY ANSWER AT THE GATE NOW WRITES A JUDGMENT.
     *
     * `recordJudgment` had exactly one caller -- `updateOpportunity`, and only
     * when `status` is in the patch -- so "Drop it" wrote a decision and "Keep
     * it" wrote none. Live 2026-08-06: `decisions` carries mission, prd,
     * roadmap, retrospective, critic, manual and meeting rows, and ZERO with
     * source_kind 'opportunity'. The Critic loads precedent out of that table,
     * so "the record has been here before" could only ever cite rejections, and
     * Learn had no approval to grade an outcome against.
     *
     * Nobody is asked to type anything: `judgmentFor` already classifies `next`
     * as an approval and assembles the sentence from the row's own columns,
     * which is why the row is re-selected with title and the ICE numbers on it.
     * It never blocks the keep -- `recordJudgment` swallows its own failures by
     * design, for the reason its header gives.
     */
    await recordJudgment(supabase, userId, {
      id: opp.id,
      row: row as Record<string, unknown>,
      from: null,
      to: "next",
      workspaceId: row.workspace_id,
    });

    return { moved: true, note: null };
  } catch (e) {
    console.error(
      `[keep] opportunity ${opp.id} did not reach Next: ${e instanceof Error ? e.message : String(e)}`,
    );
    return refused;
  }
}

/** AI: generate a PRD from an opportunity (or from a freeform brief). */
export const generatePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        opportunity_id: z.string().uuid().optional(),
        brief: z.string().max(4000).optional(),
        model: z.string().max(80).default("google/gemini-2.5-pro"),
        /** Write a SECOND spec for a bet that already has one. Off by default;
         *  see the duplicate guard in the handler. */
        force: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    let source = data.brief ?? "";
    let oppId: string | null = null;
    let title = "";
    /** The bet this spec serves, kept in scope past its own block: the lane
     *  write, the seeded promise, the teardown and the sample mark all read it,
     *  and it was already fetched with select("*"). */
    let bet: {
      id: string;
      is_sample: boolean;
      roadmap_bucket: string | null;
      roadmap_outcome: string | null;
      roadmap_measure: string | null;
    } | null = null;
    /** The Critic's teardown of the bet, rendered for the spec writer. "" when
     *  the bet was never challenged. See `formatBetTeardown`. */
    let priorTeardown = "";
    /** What the handoff into Plan actually did. `null` on the brief path, which
     *  has no bet to place. See `placeKeptBetInNext`. */
    let placement: { moved: boolean; note: string | null } | null = null;

    if (data.opportunity_id) {
      const { data: opp, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", data.opportunity_id)
        .single();
      if (error || !opp) throw new Error("Opportunity not found");
      title = opp.title;
      oppId = opp.id;
      bet = {
        id: opp.id,
        is_sample: opp.is_sample === true,
        roadmap_bucket: opp.roadmap_bucket ?? null,
        roadmap_outcome: opp.roadmap_outcome ?? null,
        roadmap_measure: opp.roadmap_measure ?? null,
      };
      priorTeardown = formatBetTeardown(opp.critic_review);
      source = `Title: ${opp.title}
Problem: ${opp.problem}
Target user: ${opp.target_user ?? "Not specified"}
Hypothesis: ${opp.hypothesis ?? ""}
ICE — Impact:${opp.impact} Confidence:${opp.confidence} Ease:${opp.ease}`;

      /**
       * A SECOND PRESS MINTED A SECOND SPEC.
       *
       * The insert below is unconditional and the link is one-way: a bet
       * carries no forward pointer to its spec, and /decide never queries
       * specs, so a kept bet still sits in the ranking on Friday looking
       * undecided. Pressing `a` again cost three model calls plus a Critic run
       * and put two competing specs on /plan, both reading "serves <same bet>".
       * Live: two real bets carry two specs each, written a week apart.
       *
       * The identical shape was already fixed one station upstream -- the
       * write-up is at :1037 -- and this is the same answer: the second press
       * lands on the artifact the first one made, rather than making another.
       *
       * NOT A DELETION. The existing spec is returned, so the surface still
       * navigates the person to a spec; `existing: true` says which one it is.
       * The lane write still runs on this path, so a second press REPAIRS a
       * placement that was refused the first time instead of paying for another
       * generation. It does NOT re-seed the promise: the only intent in hand
       * here is one already stored on the old contract, and it cannot be told
       * apart from the assembled fallback that `contractIntent` writes when the
       * model returns nothing.
       *
       * `force` exists for the case a person genuinely wants a second draft.
       * Nothing calls it yet; it is here so the guard has an escape that is not
       * "delete the first spec".
       */
      if (!data.force) {
        const { data: existing, error: existingErr } = await supabase
          .from("prds")
          .select("*")
          .eq("opportunity_id", oppId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        // A read that FAILED is not a read that found nothing. Generating is
        // the safer answer to "I cannot tell": a duplicate spec is recoverable,
        // a keystroke that refuses to do anything is not.
        if (existingErr) {
          console.error(
            `[keep] could not check for an existing spec on ${oppId}: ${existingErr.message}`,
          );
        } else if (existing) {
          placement = await placeKeptBetInNext(supabase, userId, bet, null);
          return { prd: existing, existing: true, placement };
        }
      }
    }
    if (!source.trim()) throw new Error("Provide an opportunity or a brief.");

    // Derive a concise title from the brief when there's no opportunity.
    if (!title) {
      try {
        const titleResult = await callModel(supabase, userId, {
          surface: "prd",
          surface_ref: "title",
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Return a single concise spec title (max 70 chars, Title Case, no quotes, no trailing punctuation). Only the title, nothing else.",
            },
            { role: "user", content: source.slice(0, 2000) },
          ],
        });
        title = (titleResult.output || "")
          .trim()
          .replace(/^["'`]+|["'`]+$/g, "")
          .split("\n")[0]
          .slice(0, 120);
      } catch {
        // fall through to heuristic
      }
      if (!title) {
        const firstLine = source.trim().split(/[\n.!?]/)[0] ?? "";
        title = firstLine.slice(0, 80).trim() || "Untitled spec";
      }
    }

    const system = `You are a senior product manager writing a crisp, opinionated spec in Markdown.
Sections (use ## headings, in this exact order):
## Problem
## Target Users
## Hypothesis
## Success Metrics
## Scope (MVP)
## Out of Scope
## Risks & Open Questions
## Milestones

Be concrete, terse, and useful. Use tight bullets. No filler.

When the user message contains a CONTEXT block with numbered chunks (e.g. [1], [2]), cite them inline using those numbers wherever you draw from them. Do not invent citation numbers.${
      priorTeardown
        ? `

The user message contains a PRIOR REVIEW block: the Critic's teardown of the bet this spec comes from, which the person has already read. Carry it forward. Every risk, kill criterion and piece of missing evidence it names must appear in "## Risks & Open Questions" (or be answered outright in "## Scope (MVP)" or "## Out of Scope"). Do not restate it as new, and do not contradict it without saying why.`
        : ""
    }`;

    // RAG: retrieve workspace evidence (signals, docs, meetings, notes) and
    // expose it as numbered chunks the model can cite as [n]. Citations are
    // persisted on the PRD row so the UI can deep-link back to each source.
    const ragQuery = `${title}\n${source}`.slice(0, 1200);
    let chunks: Awaited<ReturnType<typeof retrieve>> = [];
    try {
      chunks = await retrieve(supabase, userId, { query: ragQuery, k: 8, mmr: true });
    } catch {
      chunks = [];
    }
    const citations = chunks.map((c, i) => ({
      n: i + 1,
      source_kind: c.source_kind,
      source_id: c.source_id,
      title: c.title ?? null,
      snippet: c.content.slice(0, 280),
      score: Number((c.similarity ?? 0).toFixed(3)),
    }));
    const contextBlock =
      chunks.length === 0
        ? ""
        : `\n\nCONTEXT (cite as [n]):\n${chunks
            .map(
              (c, i) =>
                `[${i + 1}] (${c.source_kind}${c.title ? ` · ${c.title.slice(0, 80)}` : ""}) ${c.content.slice(0, 600)}`,
            )
            .join("\n\n")}`;

    const result = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: oppId ? `opp:${oppId}` : "brief",
      model: data.model,
      fallbackModel: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        // The teardown rides between the bet and the retrieved evidence, so the
        // model reads the objection before it reads the supporting quotes. It
        // is deliberately NOT folded into `source`, which also feeds the RAG
        // query and the contract's intent fallback: a red team is not a
        // description of the bet, and using it as one would skew retrieval and
        // could file a list of risks as the outcome a team promised.
        { role: "user", content: source + priorTeardown + contextBlock },
      ],
    });
    const body_md = result.output;
    if (!body_md.trim()) throw new Error("AI returned an empty spec");

    // Mission 3.3: the draft flow leads with the contract. Structure the
    // freshly generated narrative into an agent-authored Outcome Contract
    // (same extraction prompt as draftContractFromPrd, same build shape as
    // draftContractFromIntent) so the spec is born contract-first, with
    // body_md kept as the secondary prose projection.
    const contractRes = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_from_generate",
      model: "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_DRAFT_SYSTEM },
        { role: "user", content: `TITLE: ${title}\n\nBODY:\n${body_md.slice(0, 12000)}` },
      ],
    });
    const cj = (contractRes.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
    };
    const nowIso = new Date().toISOString();
    /** The model's OWN intent, or null. Held separately from `contractIntent`
     *  because that one falls back to the assembled source block, which reads
     *  "Title: ... Problem: ..." and must never be filed as the outcome a team
     *  promised. See `commitmentFromContract`. */
    const modelIntent = typeof cj.intent === "string" && cj.intent.trim() ? cj.intent.trim() : null;
    const contractIntent = (modelIntent ?? source.trim()).slice(0, 2000);
    const budgetEstimate =
      typeof cj.budget_estimate === "string" ? cj.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof cj.blast_radius === "string" ? cj.blast_radius.trim().slice(0, 500) : null;
    const contract: OutcomeContract = {
      version: 1,
      intent: contractIntent,
      evidence_links: citations.map((c) => ({
        source_kind: c.source_kind,
        source_id: c.source_id ?? "",
        title: c.title,
      })),
      success_metrics: draftedStrings(cj.success_metrics, 8).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(cj.non_goals, 6).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof cj.ambiguity_policy === "string" ? cj.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };

    /**
     * A SPEC DESCENDED FROM AN EXAMPLE IS AN EXAMPLE, AND IT COULD NOT SAY SO.
     *
     * `is_sample` did not cross this seam, and `prds` had no column to put it
     * in. /decide is meticulous about the mark in both directions -- the gate's
     * first line and every queue row -- on the stated grounds that the list is
     * where a person forms their impression of what is in their workspace. One
     * keypress later that care was gone: on a day-one workspace the gate holds
     * a seeded example (decide.tsx falls through to ranked[0] when there is no
     * real bet), so "Keep it" put an invented bet in the Next lane and an
     * invented spec in the Specs list, neither carrying the Example tag Decide
     * printed on the same bet one screen earlier. Live: 20 sample bets across 5
     * workspaces, and this is launch week.
     *
     * The column is added by supabase/migrations/20260806120000_a_spec_drawn_
     * from_an_example_is_an_example.sql, which follows the theme migration's
     * rule: a child is a sample only if it descends from one.
     *
     * WRITTEN ONLY WHEN TRUE. The column defaults to false, so naming it on
     * every real spec would be redundant -- and it would make the ONE write
     * this whole flow depends on fail for everybody if the migration has not
     * reached PostgREST's schema cache yet. A seeded bet is exactly the case
     * the column exists for, and it is the only case that names it.
     *
     * PARTIAL, and this is the true half of the sentence: the flag now travels
     * and is stored. NO SURFACE READS IT YET -- `listSpecs` (:1301) does not
     * select it, `RoadmapItem` (src/lib/roadmap.functions.ts:62) has no such
     * field, and /plan renders no Example tag. Those live in other files. The
     * select cannot be widened here either until the generated Database types
     * carry the column, or the query stops typechecking.
     */
    const prdRow: Database["public"]["Tables"]["prds"]["Insert"] & { is_sample?: boolean } = {
      user_id: userId,
      opportunity_id: oppId,
      title,
      body_md,
      model: data.model,
      citations,
      contract,
      contract_migrated_at: nowIso,
      ...(bet?.is_sample ? { is_sample: true } : {}),
    };
    const { data: prd, error: pErr } = await supabase.from("prds").insert(prdRow).select().single();
    if (pErr) throw new Error(pErr.message);
    if (prd) {
      // SEAM-1: stage history for the created spec (DB default status is draft).
      await recordStageEvent(supabase, {
        entityType: "spec",
        entityId: prd.id,
        from: null,
        to: prd.status ?? "draft",
        actor: "human",
        workspaceId: prd.workspace_id,
        userId,
      });
    }
    if (prd && oppId && bet) {
      await recordLineage(supabase, userId, {
        parent_kind: "opportunity",
        parent_id: oppId,
        child_kind: "prd",
        child_id: prd.id,
        rationale: "Generated spec from opportunity",
        created_by_agent: "prd-writer",
      });

      // THE DECIDE -> PLAN HANDOFF, which did not exist.
      //
      // /decide's Gate says, in these words, "Keeping it drafts the spec and
      // moves it into Plan." The first half was true and the second was not:
      // nothing here or anywhere else ever wrote `roadmap_bucket`, and Plan's
      // committed set is `items.filter(i => i.bucket !== null)`. So a bet the
      // team explicitly kept never appeared as committed on the next station,
      // and the two surfaces disagreed about what had been decided.
      //
      // `next`, not `now`. Keeping a bet means the call is made, not that
      // anyone has started; claiming `now` would put work in flight that
      // nobody scheduled.
      //
      // IT NO LONGER LANDS UNDECLARED, and the paragraph that used to stand
      // here said the opposite. It read: "It lands as an UNDECLARED commitment
      // (no outcome, no measure), which Plan already counts and surfaces, and
      // that is the correct behaviour rather than a gap." That was true of the
      // lane and false of the reason. The promise was not still owed -- the
      // agent had just written it into `contract.success_metrics`, one function
      // call above, and then dropped it. Plan's Gate fired forty seconds into
      // the core flow and opened a blank dialog, so the person read the metric
      // off the spec the product had generated and typed it back in. The
      // comfortable lie was ours, not Plan's. `commitmentFromContract` carries
      // it across; the Gate still fires for a bet whose contract drafted
      // nothing, which is the case where the promise genuinely is still owed.
      //
      // Never overwrites. A human who already placed this bet has said
      // something more specific than a default can, and a draft must not move
      // work behind their back. Fail-soft for the same reason every other
      // stamp here is: the spec exists, and a handoff hiccup must not fail a
      // write that a retry would duplicate.
      //
      // The lane, the seeded promise and the judgment now live together in
      // `placeKeptBetInNext`, above, so the second press of "Keep it" runs the
      // same writes without paying for a second generation.
      placement = await placeKeptBetInNext(
        supabase,
        userId,
        bet,
        commitmentFromContract({ intent: modelIntent, success_metrics: contract.success_metrics }),
      );
    }
    if (prd) {
      await runCritic(supabase, userId, { kind: "prd", id: prd.id });
    }
    return { prd, existing: false, placement };
  });

/** AI: rewrite/expand/critique a selection within a PRD. */
export const prdAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        action: z.enum(["rewrite", "expand", "critique", "shorten"]),
        selection: z.string().min(2).max(8000),
        context: z.string().max(8000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const verb: Record<typeof data.action, string> = {
      rewrite:
        "Rewrite the selection to be sharper, more concrete, and easier to scan. Keep meaning.",
      expand: "Expand the selection with helpful detail, examples, and edge cases. Stay terse.",
      critique:
        "Critique the selection: assumptions, missing risks, weak metrics. Return as bullets.",
      shorten: "Shorten the selection by ~50% without losing meaning.",
    };
    const result = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: `assist:${data.action}`,
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a senior PM editor. Return Markdown only." },
        {
          role: "user",
          content: `${verb[data.action]}\n\n---\n${data.selection}\n---\n\nSurrounding context (optional):\n${data.context ?? ""}`,
        },
      ],
    });
    return { text: result.output };
  });

/** AI: promote a single signal directly into an opportunity (skips the theme step). */
export const promoteSignalToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ signal_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: signal, error } = await supabase
      .from("signals")
      .select("id, content, source, project_id")
      .eq("id", data.signal_id)
      .single();
    if (error || !signal) throw new Error("Signal not found");

    const system = `You convert a single user signal into a sharp product opportunity.
Return STRICT JSON only:
{"title":"...max 80 chars...","problem":"...1-2 sentences...","target_user":"...","hypothesis":"If we ... then ... measured by ...","impact":1-10,"confidence":1-10,"ease":1-10}`;

    const result = await callModel(supabase, userId, {
      surface: "discovery",
      surface_ref: `promote_signal:${signal.id}`,
      model: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-flash-lite",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Signal (${signal.source}): ${signal.content}` },
      ],
    });
    const parsed = (result.json ?? {}) as {
      title?: string;
      problem?: string;
      target_user?: string;
      hypothesis?: string;
      impact?: number;
      confidence?: number;
      ease?: number;
    };
    if (!parsed.title) throw new Error("AI returned no opportunity");
    const clamp = (n: unknown, fb: number) => {
      const v = Math.round(Number(n));
      return Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : fb;
    };
    const { data: opp, error: oErr } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        title: parsed.title.slice(0, 200),
        problem: (parsed.problem ?? signal.content).slice(0, 2000),
        target_user: parsed.target_user?.slice(0, 200) ?? null,
        hypothesis: parsed.hypothesis?.slice(0, 1000) ?? null,
        impact: clamp(parsed.impact, 5),
        confidence: clamp(parsed.confidence, 5),
        ease: clamp(parsed.ease, 5),
        project_id: signal.project_id ?? null,
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    if (opp) {
      // SEAM-1: stage history for the created opportunity.
      await recordStageEvent(supabase, {
        entityType: "opportunity",
        entityId: opp.id,
        from: null,
        to: opp.status ?? "backlog",
        actor: "human",
        workspaceId: opp.workspace_id,
        userId,
      });
      // SW-5 chain audit: fail-soft, same reasoning as promoteThemeToOpportunity.
      await recordLineageSafe(supabase, userId, {
        parent_kind: "signal",
        parent_id: signal.id,
        child_kind: "opportunity",
        child_id: opp.id,
        rationale: "Promoted directly from signal",
        created_by_agent: "discovery-scout",
      });
      await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    }
    return { opportunity: opp };
  });
