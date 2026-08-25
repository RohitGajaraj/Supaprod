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

/**
 * THE RELATION A DECISION'S ORIGIN EDGE CARRIES.
 *
 * Not a new word. `recordJudgment` (discovery.functions.ts) has written
 * `opportunity --decided--> decision` since the judgment gate was built, and
 * that edge has exactly this shape: PARENT is the artifact the call was made
 * about, CHILD is the decision that recorded it. Reusing the spelling is what
 * lets one query — `relation = 'decided'` — answer "what calls were recorded
 * against this artifact" for a bet, a spec and a mission alike, instead of
 * three readers each learning a different word.
 *
 * What it was weighed against, since a relation nobody argued about is how a
 * vocabulary forks:
 *   `produced`     mission -> changeset, a mechanical output. A judgment is not
 *                  a build artifact and should not read as one.
 *   `test_verdict` already occupies mission -> decision (test-station), and
 *                  deliberately stays narrow: one specific verdict, not "a call
 *                  was recorded here". Both survive, because `relation` is part
 *                  of the unique index.
 *   `documents`    capability_change -> decision, which the read layer folds
 *                  into `relates-to`. Too weak: it asserts adjacency, and this
 *                  edge asserts origin.
 *   `informs` / `cites`  declared families, but both claim INFLUENCE. The spec
 *                  did not influence its approval receipt; it is what the
 *                  receipt is about.
 *   `derived-from` declared, and its rendered voice ("gave rise to") is right.
 *                  Rejected on spelling alone: written on a parent -> child row
 *                  the literal string reads backwards, and this file already
 *                  carries one documented exception of that kind.
 */
export const DECISION_ORIGIN_RELATION = "decided";

/**
 * THE EDGES A DECISION'S OWN FOREIGN KEYS ALWAYS IMPLIED AND NOTHING WROTE.
 *
 * `decisions` carries `prd_id` and `mission_id` — the two directions the schema
 * genuinely models, every foreign key on a decision pointing at the artifact
 * the call was made ABOUT. Measured against production 2026-08-10: 105 of 154
 * real decisions carry `source_kind='mission'` and NOT ONE has an edge in
 * `artifact_lineage` saying which mission. So the graph could not see the
 * largest single source of decisions in the product, and every reading of the
 * station chain under-measured Decide's real inbound.
 *
 * This is not the struck `decision -> prd` row. That one failed both cheap
 * tests — no column could hold it and no door could supply the parent. These
 * two pass both: the column exists on the child, and every door that creates a
 * decision already has the parent id in hand at the moment it writes.
 *
 * `recordLineageSafe`, never `recordLineage`: a provenance stamp runs after the
 * decision row already exists, and a transport failure must never fail the
 * settle, the mission completion or the spec approval that produced it.
 *
 * WORKSPACE IS REQUIRED HERE rather than optional, which is the one thing this
 * helper exists to enforce. `artifact_lineage.workspace_id` defaults to
 * `current_user_default_workspace()` — the CALLER'S default, not the
 * workspace the two artifacts live in. Those differ the moment a user belongs
 * to more than one workspace, and an edge filed under the wrong one is read by
 * the wrong reader forever after: the WM-F1 failure. Making the parameter
 * required means a caller cannot omit it by not thinking about it; it can only
 * pass null deliberately, and every caller today passes the PARENT artifact's
 * own workspace.
 *
 * BOTH edges are written when a decision carries both ids — `decision.record`
 * files a mission-scoped call against a spec routinely — because both are true
 * and each answers a different reader's question.
 */
export async function recordDecisionOrigins(
  supabase: SupabaseClient,
  userId: string,
  input: {
    /** The decision row, AFTER its insert has been confirmed to have landed. */
    decisionId: string;
    missionId?: string | null;
    prdId?: string | null;
    /**
     * The workspace the ARTIFACTS live in, not the writer's. Null only when the
     * caller genuinely cannot name it, and then the column default fires — the
     * behaviour this parameter exists to make visible rather than to hide.
     */
    workspaceId: string | null;
    createdByAgent?: string | null;
    rationale?: string | null;
  },
): Promise<void> {
  if (!input.decisionId) return;
  // Everything both edges share EXCEPT the two fields that name the hop. Those
  // stay spelled out at each call below so `parent_kind: "mission"` and
  // `child_kind: "decision"` sit in one object a reader (and the chain guard)
  // can see together.
  const common = {
    relation: DECISION_ORIGIN_RELATION,
    rationale: input.rationale ?? null,
    created_by_agent: input.createdByAgent ?? null,
    workspace_id: input.workspaceId,
  };
  /*
   * Two spelled-out calls rather than a loop over a parents array. The loop was
   * written first and is shorter, and it hides both hops from every grep in the
   * repo: `parent_kind: "mission"` would appear nowhere, and the chain guard —
   * which reads source text because there is no code to call when a hop is
   * missing — cannot see a kind that only exists as a variable. A hop the guard
   * cannot read is the exact failure this pair of edges was filed under.
   */
  if (input.missionId) {
    await recordLineageSafe(supabase, userId, {
      parent_kind: "mission",
      parent_id: input.missionId,
      child_kind: "decision",
      child_id: input.decisionId,
      ...common,
    });
  }
  if (input.prdId) {
    await recordLineageSafe(supabase, userId, {
      parent_kind: "prd",
      parent_id: input.prdId,
      child_kind: "decision",
      child_id: input.decisionId,
      ...common,
    });
  }
}

/**
 * THE ONLY HOP THAT LEAVES A LEARNING, and until 2026-08-11 there was none.
 *
 * Every edge INTO an outcome was written and not one edge OUT of one ever had
 * been: `grep -rn 'parent_kind: "learning"' src/` returned hits in tests only. A
 * learning was a permanent leaf, so nothing could trace forward from evidence to
 * the call it changed — which is the entire claim the product is sold on. The 71
 * `learning -> *` rows in production are seed; none is newer than 2026-07-23,
 * and four workspaces hold exactly ten each.
 *
 * WHY `informs` AND WHY THIS DIRECTION. `learning_citations` records that a
 * learning was cited as PRECEDENT while a decision was being made
 * (`decision-judgment.functions.ts`, `cited_by: "decision-precedent"`,
 * `trace_id: "decision:<id>"`). That is forward in time and forward in meaning:
 * the learning already existed, then it shaped a later call.
 *
 * ── CORRECTED 2026-08-25: THIS SAID "98 REAL ROWS, ONE LIVE WRITER" ────────
 *
 * **The writer is real. Not one of the 98 rows came from it.** Measured:
 *
 *   SELECT count(*), count(DISTINCT date_part('microsecond', created_at)),
 *          count(DISTINCT created_at::date) FROM learning_citations;
 *   -- 98 rows | 1 distinct microsecond | 7 distinct days
 *
 * **Ninety-eight rows spread across seven days share exactly one microsecond
 * value.** That cannot happen organically; it is one `INSERT`
 * (`20260725130000_helio_demo_seed_rich.sql`) wearing seven dates. The live
 * writer at `decision-judgment.functions.ts` (`cited_by: "decision-precedent"`)
 * has produced **zero rows in the product's lifetime**, and the four brain tools
 * — `learning.record`, `brain.due_forecasts`, `brain.outcome_history`,
 * `brain.contradictions` — have **zero calls across 2,638 agent runs**.
 *
 * The old sentence was true about its own bookkeeping (a writer does exist) and
 * false about the world (nothing it wrote is in there). That is the same shape
 * as F-64's `conclusion: failure` on a job that never started, F-58's
 * `total_count: 0` from an unindexed search, and F-66's `ok: true` from a stale
 * cache — **the fourth instance this week, and the first one found in a comment
 * rather than in a signal.** A comment is a signal a future reader trusts
 * without being able to check it, so it is corrected in place rather than
 * quietly deleted.
 *
 * **Nothing about the CODE below is wrong** — the relation, the direction and
 * the trap-avoidance are all still right. What was wrong was the claim that the
 * data is real. `informs` is a registered relation family, so the graph reads
 * "informed" from the learning and "was informed by" from the decision rather
 * than falling through to the generic "links to".
 *
 * THE OBVIOUS PARENT COLUMN IS A TRAP AND IS DELIBERATELY NOT USED HERE. An
 * audit proposed emitting `learning -> opportunity` from `learnings.
 * opportunity_id`. That column is set to `prd.opportunity_id`
 * (`outcome.functions.ts`), so it names the opportunity the work DESCENDED
 * FROM — an ancestor. Writing that edge would assert a learning produced the
 * opportunity that produced it, and since provenance walks parents only, it
 * would put a cycle in the graph. It is the same defect the seeded
 * `learning -> prd` rows carry, which are being struck in the same cycle. An
 * ancestor column cannot be reused as a descendant edge just because both ends
 * are present.
 *
 * A LOOP IS CORRECT HERE, unlike in `recordDecisionOrigins` above. That one
 * refuses to loop because a loop over a PARENTS array hides the KIND from every
 * grep and from the chain guard, which reads source text. Here both kinds are
 * constants spelled out in the object below; only the id varies. The guard can
 * still read the hop.
 */
export const LEARNING_PRECEDENT_RELATION = "informs";

export async function recordLearningPrecedents(
  supabase: SupabaseClient,
  userId: string,
  input: {
    /** The decision that cited them, AFTER its citations have landed. */
    decisionId: string;
    /** The learnings cited as precedent for it. Empty is a no-op, not an error. */
    learningIds: readonly string[];
    /**
     * The workspace the ARTIFACTS live in, not the writer's. Required for the
     * same WM-F1 reason `recordDecisionOrigins` states above.
     */
    workspaceId: string | null;
    createdByAgent?: string | null;
  },
): Promise<void> {
  if (!input.decisionId || input.learningIds.length === 0) return;
  for (const learningId of input.learningIds) {
    if (!learningId) continue;
    await recordLineageSafe(supabase, userId, {
      parent_kind: "learning",
      parent_id: learningId,
      child_kind: "decision",
      child_id: input.decisionId,
      relation: LEARNING_PRECEDENT_RELATION,
      rationale: "Cited as precedent when this call was made",
      created_by_agent: input.createdByAgent ?? "learn",
      workspace_id: input.workspaceId,
    });
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
