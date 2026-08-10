import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { artifactTable } from "@/lib/artifact-tables";
import type { SupabaseClient } from "@supabase/supabase-js";

export const ARTIFACT_KINDS = [
  "signal",
  "theme",
  "opportunity",
  "prd",
  "roadmap_item",
  "task",
  "meeting",
  "decision",
  "mission",
  "house_rule",
  "design_memory",
  "prototype",
  "capability_change",
  // Added 2026-08-02 to match what is actually stored. A live census of
  // artifact_lineage found these being written by real code paths while absent
  // from every vocabulary, so they parsed nowhere and rendered untitled.
  "learning",
  "deployment",
  // prd_flow is written to artifact_lineage by flows.functions.ts and was declared
  // in no vocabulary at all, found by the liveness vocabulary check.
  "prd_flow",
  "changeset",
  "prd_scaffold",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

const KindSchema = z.enum(ARTIFACT_KINDS);

/** What a refused edge reports: enough to name which link went missing. */
type LineageFailureContext = {
  surface: string;
  user_id: string;
  failure_kind: string;
};

/**
 * Insert a lineage edge. Idempotent via the unique index.
 *
 * FAIL-SOFT, BUT NO LONGER SILENT. A provenance stamp always runs after the
 * main write has already succeeded, so a failed edge must never fail the
 * promotion or abort a clustering pass. That part is deliberate and unchanged.
 *
 * What WAS wrong, found 2026-08-05: this awaited the upsert and never
 * destructured `error`. supabase-js RESOLVES a refused write rather than
 * rejecting it, so a rejected edge returned normally, and the `try/catch` in
 * recordLineageSafe below was guarding a throw that essentially never came.
 * Both layers reported success for a write that did not happen.
 *
 * That is not a theoretical gap. The prd -> mission edge is the ONLY link
 * between a spec and the mission built from it (missions carry no prd column),
 * every changeset resolves its spec through it, and a missing edge ends with
 * the outcome-memory pool empty. A break worth four hops of damage was
 * invisible at the seam that caused it. Per the repo's own rule — console.error
 * is not observability, error_events is — the failure is now recorded there,
 * and the function still resolves normally either way.
 */
export async function recordLineage(
  supabase: SupabaseClient,
  userId: string,
  edge: {
    parent_kind: ArtifactKind;
    parent_id: string;
    child_kind: ArtifactKind;
    child_id: string;
    relation?: string;
    rationale?: string | null;
    created_by_agent?: string | null;
    ai_event_id?: string | null;
    /**
     * The workspace this edge belongs to. OPTIONAL, and omitting it is the
     * long-standing behaviour: the column carries
     * `default current_user_default_workspace()`, so an omitted value resolves
     * to the CALLER'S DEFAULT workspace rather than the workspace of the two
     * artifacts being linked.
     *
     * Those differ the moment a user belongs to more than one workspace, and an
     * edge filed under the wrong workspace is read by the wrong reader forever
     * after, which is the WM-F1 failure exactly. Measured 2026-08-10: 0 of 31
     * prd->mission edges are currently misfiled, so this is latent rather than
     * live, and it is latent only because the affected users have one workspace
     * each.
     *
     * Pass it wherever the caller already knows it. It is not made required
     * because doing so would force every existing call site to change in one
     * commit, and a default that is right today is better than a migration that
     * is half applied.
     */
    workspace_id?: string | null;
  },
  // Injected reporter, same idiom recordErrorEvent already uses for its own
  // client. A test supplies a spy instead of mock.module()-ing the
  // observability module, which in Bun is a GLOBAL registry swap that leaks
  // into every later test file — it broke the recordErrorEvent suite when
  // written that way.
  opts: { report?: (err: unknown, ctx: LineageFailureContext) => Promise<unknown> } = {},
): Promise<void> {
  const relation = edge.relation ?? "promoted";
  const { error } = await supabase.from("artifact_lineage").upsert(
    {
      user_id: userId,
      parent_kind: edge.parent_kind,
      parent_id: edge.parent_id,
      child_kind: edge.child_kind,
      child_id: edge.child_id,
      relation,
      rationale: edge.rationale ?? null,
      created_by_agent: edge.created_by_agent ?? null,
      ai_event_id: edge.ai_event_id ?? null,
      // Spread rather than a null literal: writing `workspace_id: null` would
      // SUPPRESS the column default and violate NOT NULL, turning an omitted
      // optional into a refused edge for every existing caller.
      ...(edge.workspace_id ? { workspace_id: edge.workspace_id } : {}),
    },
    { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
  );
  if (!error) return;

  try {
    // Dynamic import by default so the happy path costs nothing and the
    // observability module never enters this file's import-time graph.
    const report =
      opts.report ??
      (async (err: unknown, ctx: LineageFailureContext) => {
        const { recordErrorEvent } = await import("@/lib/observability/errors");
        return recordErrorEvent(err, ctx);
      });
    await report(new Error(`lineage edge refused: ${error.message}`), {
      surface: "lineage.recordLineage",
      user_id: userId,
      // The edge itself, so the record says WHICH link is missing rather than
      // that some link somewhere failed.
      failure_kind: `${edge.parent_kind}->${edge.child_kind}:${relation}`,
    });
  } catch {
    // Recording the failure must not become a second failure.
  }
}

/**
 * Fail-soft recordLineage (SW-5 / mission 3.11 chain audit, data-gaps c2+c3).
 * A provenance stamp always runs AFTER the main write has succeeded, so a
 * lineage failure (a transient transport error, for example) must never fail
 * the promotion or abort a clustering loop mid-pass. recordLineage already
 * ignores row-level upsert errors; this also absorbs thrown transport errors.
 */
export async function recordLineageSafe(
  supabase: SupabaseClient,
  userId: string,
  edge: Parameters<typeof recordLineage>[2],
): Promise<void> {
  try {
    await recordLineage(supabase, userId, edge);
  } catch {
    // Best-effort provenance; the artifact the edge points at already exists.
  }
}

type LineageEdge = {
  id: string;
  parent_kind: ArtifactKind;
  parent_id: string;
  child_kind: ArtifactKind;
  child_id: string;
  relation: string;
  rationale: string | null;
  created_at: string;
  // PC-29 layer 3: the agent slug that authored this edge, or null for a
  // human-made link. select("*") already returns this column; it was simply
  // never in this type.
  created_by_agent: string | null;
  // Hydrated title for the "other" end of the edge:
  peer_title?: string | null;
};

/* Kind -> table + title column comes from the one shared map (`@/lib/artifact-tables`).
   A kind with no entry there (today: `roadmap_item`, which has no backing table) is
   skipped below and its edge keeps a null `peer_title`. */

async function hydrateTitles(
  supabase: SupabaseClient,
  rows: LineageEdge[],
  side: "parent" | "child",
): Promise<LineageEdge[]> {
  const grouped = new Map<ArtifactKind, string[]>();
  for (const r of rows) {
    const kind = side === "parent" ? r.parent_kind : r.child_kind;
    const id = side === "parent" ? r.parent_id : r.child_id;
    const arr = grouped.get(kind) ?? [];
    arr.push(id);
    grouped.set(kind, arr);
  }
  const titleByKey = new Map<string, string>();
  for (const [kind, ids] of grouped) {
    const spec = artifactTable(kind);
    if (!spec) continue;
    const col = spec.titleCol;
    const { data } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (s: string) => { in: (c: string, v: string[]) => Promise<{ data: unknown }> };
        };
      }
    )
      .from(spec.table)
      .select(`id, ${col}`)
      .in("id", ids);
    for (const row of (data as Array<Record<string, unknown>> | null) ?? []) {
      const id = row.id as string | undefined;
      const title = row[col];
      if (id) titleByKey.set(`${kind}:${id}`, typeof title === "string" ? title : "");
    }
  }
  return rows.map((r) => {
    const kind = side === "parent" ? r.parent_kind : r.child_kind;
    const id = side === "parent" ? r.parent_id : r.child_id;
    return { ...r, peer_title: titleByKey.get(`${kind}:${id}`) ?? null };
  });
}

export const getLineage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ kind: KindSchema, id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;

    const { data: ancestorsRaw } = await supabase
      .from("artifact_lineage")
      .select("*")
      .eq("child_kind", data.kind)
      .eq("child_id", data.id)
      .order("created_at", { ascending: false });

    const { data: descendantsRaw } = await supabase
      .from("artifact_lineage")
      .select("*")
      .eq("parent_kind", data.kind)
      .eq("parent_id", data.id)
      .order("created_at", { ascending: false });

    const ancestors = await hydrateTitles(
      supabase,
      (ancestorsRaw ?? []) as LineageEdge[],
      "parent",
    );
    const descendants = await hydrateTitles(
      supabase,
      (descendantsRaw ?? []) as LineageEdge[],
      "child",
    );
    return { ancestors, descendants };
  });

export type ProvenanceSignal = {
  id: string;
  title: string | null;
  content: string | null;
  source: string | null;
  sentiment: string | null;
  created_at: string;
};

/**
 * O1 (provenance slice) - "why is this on the roadmap?". getLineage shows only
 * the IMMEDIATE parents (an opportunity's theme); this walks the whole ancestor
 * chain up the artifact_lineage graph to the ROOT source signals - the raw user
 * evidence the decision rests on. Bounded (depth + node cap) so a cyclic or huge
 * graph can never run away. RLS-scoped: only edges + signals the caller owns.
 */
export const getProvenance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ kind: KindSchema.default("opportunity"), id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const MAX_NODES = 80;
    const MAX_DEPTH = 8;

    const seen = new Set<string>([`${data.kind}:${data.id}`]);
    let frontier: { kind: ArtifactKind; id: string }[] = [{ kind: data.kind, id: data.id }];
    const signalIds = new Set<string>();
    let depth = 0;
    let truncated = false;

    while (frontier.length && depth < MAX_DEPTH && seen.size < MAX_NODES) {
      depth++;
      const byKind = new Map<ArtifactKind, string[]>();
      for (const n of frontier) {
        const arr = byKind.get(n.kind) ?? [];
        arr.push(n.id);
        byKind.set(n.kind, arr);
      }
      const next: { kind: ArtifactKind; id: string }[] = [];
      for (const [kind, ids] of byKind) {
        const { data: rows } = await supabase
          .from("artifact_lineage")
          .select("parent_kind,parent_id")
          .eq("child_kind", kind)
          .in("child_id", ids);
        for (const e of (rows ?? []) as { parent_kind: ArtifactKind; parent_id: string }[]) {
          const key = `${e.parent_kind}:${e.parent_id}`;
          if (seen.has(key)) continue;
          if (seen.size >= MAX_NODES) {
            truncated = true;
            break;
          }
          seen.add(key);
          if (e.parent_kind === "signal") signalIds.add(e.parent_id);
          else next.push({ kind: e.parent_kind, id: e.parent_id });
        }
      }
      frontier = next;
    }
    if (frontier.length > 0) truncated = true;

    let source_signals: ProvenanceSignal[] = [];
    const ids = [...signalIds];
    if (ids.length) {
      const { data: sigs } = await supabase
        .from("signals")
        .select("id,title,content,source,sentiment,created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      source_signals = (sigs ?? []) as ProvenanceSignal[];
    }

    return {
      source_signals,
      signal_count: source_signals.length,
      depth,
      node_count: seen.size - 1, // exclude the starting node itself
      truncated,
    };
  });

/** AI: split a PRD into 5-8 atomic tasks; record lineage prd → task[]. */
export const promotePrdToTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        prd_id: z.string().uuid(),
        model: z.string().max(80).default("google/gemini-2.5-flash"),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .select("id, title, body_md, project_id")
      .eq("id", data.prd_id)
      .single();
    if (pErr || !prd) throw new Error("PRD not found");

    const system = `You break a PRD into 5-8 atomic, shippable engineering tasks.
Return STRICT JSON only, no prose:
{"tasks":[{"title":"...","priority":"low|medium|high","is_deep_work":true|false}]}
Each title must be a concrete verb-led action under 80 chars. Order by build sequence.`;

    const result = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: `prd:${prd.id}:tasks`,
      model: data.model,
      fallbackModel: "google/gemini-2.5-flash-lite",
      // Returns strict {"tasks":[...]} JSON; declare json-mode so the runtime
      // humanizer never rewrites task-title string values (sanitizer wiring).
      responseFormat: "json_object",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `PRD: ${prd.title}\n\n${prd.body_md}` },
      ],
    });

    let parsed: { tasks?: Array<{ title: string; priority?: string; is_deep_work?: boolean }> } =
      {};
    try {
      const cleaned = result.output
        .trim()
        .replace(/^```json\s*|\s*```$/g, "")
        .replace(/^```\s*|\s*```$/g, "");
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("AI returned malformed task list");
    }
    const raw = Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 12) : [];
    if (raw.length === 0) throw new Error("AI produced no tasks");

    const toInsert = raw
      .filter((t) => typeof t.title === "string" && t.title.trim())
      .map((t) => ({
        user_id: userId,
        title: t.title.trim().slice(0, 280),
        priority: (t.priority === "low" || t.priority === "high" ? t.priority : "medium") as
          "low" | "medium" | "high",
        is_deep_work: Boolean(t.is_deep_work),
        project_id: prd.project_id ?? null,
      }));

    const { data: tasks, error: tErr } = await supabase
      .from("tasks")
      .insert(toInsert)
      .select("id, title");
    if (tErr) throw new Error(tErr.message);

    // Batch-upsert all lineage edges using the same onConflict target as recordLineage.
    // Runs after the real write succeeds, so we log-not-throw on error (fail-soft).
    if (tasks && tasks.length > 0) {
      const lineageEdges = (tasks ?? []).map((t) => ({
        user_id: userId,
        parent_kind: "prd" as const,
        parent_id: prd.id,
        child_kind: "task" as const,
        child_id: t.id,
        relation: "promoted" as const,
        rationale: "Generated from PRD by promotePrdToTasks",
        created_by_agent: "prd-writer",
        ai_event_id: null,
      }));
      const { error: lineageErr } = await supabase.from("artifact_lineage").upsert(lineageEdges, {
        onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation",
      });
      if (lineageErr) {
        console.error("promotePrdToTasks: batch lineage upsert failed:", lineageErr.message);
      }
    }

    return { tasks: tasks ?? [], count: tasks?.length ?? 0 };
  });
