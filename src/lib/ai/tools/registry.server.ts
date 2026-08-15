/**
 * Tool registry for the agent planner/executor loop.
 * Each tool: zod-validated args, classified read/write, executed against the
 * authenticated user's supabase client. Writes that the user has flagged
 * `confirm` or `review` mode are queued as agent_approvals instead of run.
 */
import { z } from "zod";
import {
  defaultChecks,
  defaultSetup,
  e2bAvailable,
  runInE2B,
  withGitToken,
} from "@/lib/exec/e2b.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieve } from "@/lib/rag/retriever.server";
import { embedOne } from "@/lib/rag/embed.server";
import { withIdempotency } from "@/lib/runtime/idempotency.server";
import { callModel } from "@/lib/ai/runtime.server";
import { extractArrayField, wrapBareArrayField } from "@/lib/ai/json-shape";
import { enqueueHandoff, resolveAgent, type HandoffPayload } from "@/lib/ai/handoff.server";
import { enqueueFanout, fanoutEnabled } from "@/lib/ai/fanout.server";
import {
  FANOUT_MAX_CHILDREN,
  fanoutDepthOf,
  canSpawnAtDepth,
  remainingMissionBudget,
} from "@/lib/ai/fanout";
import { submitDelegation } from "@/lib/delegate/openhands.server";
import { DELEGATE_TASK_MAX_CHARS } from "@/lib/delegate/provider";
import { rememberOutcome } from "@/lib/ai/memory.server";
// The in-house error floor, so a memory write that silently produced nothing is a
// row someone can query rather than a console line in a Worker. Server-only file,
// so the admin client this lazy-loads is available. See learning.record.
import { recordErrorEvent } from "@/lib/observability/errors";
// The verdict rules, read from the one place that owns them, so the agent path
// and the human recordOutcome path can never disagree about what a verdict does
// to a bet's confidence. See the comment on the exports in outcome.functions.ts.
import { VERDICT_CONFIDENCE_DELTA, clampConfidence, iceOf } from "@/lib/outcome.functions";
import { webSearch, webFetch, webMap, webCrawl } from "./firecrawl.server";
import {
  missionPlan,
  missionDispatch,
  missionObserve,
  missionFinalize,
} from "./orchestrator.server";
import { decideDecisionReview, DECISION_RECORD_EFFECT } from "@/lib/decision-gate";
import { recordAutoApproval } from "@/lib/decision-gate.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runCriticTool } from "@/lib/ai/critic.server";
import { promoteChangesetToProductionCore } from "@/lib/deployments.functions";
import { autoReflect } from "@/lib/ai/reflection.server";
import { studioBranchName } from "@/lib/ai/studio-branch";
import { mergeReadinessFromCi, overallFromChecks } from "@/lib/ai/studio-ci";
import { fetchFailingCiDetail } from "@/lib/ai/studio-ci-logs.server";
import { evalRegressionReadiness, type SuiteScorePair } from "@/lib/ai/eval-gate";
import { isTestPath } from "@/lib/ai/studio-inspection";
import {
  scanStagedChangesForSecrets,
  describeStagedSecrets,
  type StagedChangeContent,
} from "@/lib/build/secret-scan";
import { planChangesetTests } from "@/lib/build/test-plan";
import {
  normalizeDependabotAlert,
  summarizeDepAlerts,
  depsAuditGate,
  isDependencyManifest,
  lockfileDivergenceNote,
  DEP_SEVERITY_RANK,
  type DepAlert,
} from "@/lib/build/deps-audit";
import { runChangesetReview, loadStagedContent } from "@/lib/build/code-review.server";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import type { ProviderAuthCache } from "@/lib/connectors/resolve.server";
import { runRollbackRelease } from "@/lib/studio-rollbacks";
/* Back-import into studio.functions.ts, which itself imports TOOL_REGISTRY from
 * this file. The cycle is real and it is safe here for one specific reason:
 * stampSpecShippedOnStudioMerge is a HOISTED async function declaration, and it
 * is only dereferenced inside the tool's run() closure, long after both modules
 * have finished evaluating. A const arrow export would TDZ. Verified with a full
 * `bun run build`, not just tsc, because only the Worker bundle proves it. */
import { stampSpecShippedOnStudioMerge } from "@/lib/studio.functions";
import { clusterSignalsCore } from "@/lib/ai/cluster.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { recordDecisionOrigins, recordLineageSafe } from "@/lib/lineage.functions";
// design.draft draws through the SAME generator the human path uses, so an
// agent's drawing inherits the workspace design language and lands in the one
// row (`prd_scaffolds`) the gate, the Design surface and both dispatch paths
// already read. See the tool's own comment for why a `prototypes` row was not.
import { prepareScaffoldSpeculative, type UnattendedDraw } from "@/lib/design-scaffold.functions";
import { buildAuditInsert } from "@/lib/roadmap-audit";
import { validateCommitment } from "@/lib/roadmap-governance";
import { CONNECTOR_REGISTRY } from "@/lib/connectors/registry";

export type ToolCtx = {
  supabase: SupabaseClient;
  userId: string;
  agentSlug?: string;
  agentId?: string | null;
  traceId?: string | null;
  runId?: string | null;
  stepIndex?: number | null;
  missionId?: string | null;
  /**
   * The piece of work this run belongs to, when the autonomous driver started it.
   *
   * ADDED BECAUSE THE MOAT'S ONLY LINK DEPENDED ON PROSE. `learning.record` needs
   * the spec its verdict is about, or the outcome attaches to nothing and can
   * never re-rank the bet that produced it. On the driver's route the two existing
   * recoveries are both dead -- `missionId` is null at Learn, and
   * `decisions.prd_id` is null by construction at Decide -- so the only remaining
   * link was the driver naming the id in `stationGoal` and the model choosing to
   * copy it into a tool argument. Live: the one track that completed the loop
   * autonomously recorded two verdicts with prd_id, opportunity_id and mission_id
   * all null.
   *
   * The driver already FILES the spec as a track member, so the id is on the
   * record either way. Handing the track down lets a tool read it instead of
   * trusting the prompt, which is the difference between a link and a hope.
   */
  trackId?: string | null;
  workspaceId?: string | null;
  /** Per-run cache for provider auth to avoid redundant credential chain re-queries across multiple tool calls within the same agent run. */
  authCache?: ProviderAuthCache;
};

export type ToolDef<S extends z.ZodTypeAny = z.ZodTypeAny> = {
  name: string;
  description: string;
  category: "read" | "write" | "memory" | "planning";
  argsSchema: S;
  /** Plain-language render of the call for approval cards */
  preview: (args: z.infer<S>) => string;
  run: (args: z.infer<S>, ctx: ToolCtx) => Promise<unknown>;
};

function def<S extends z.ZodTypeAny>(d: ToolDef<S>) {
  return d as unknown as ToolDef;
}

/**
 * Resolve GitHub credentials via the connector chain
 * (product binding → workspace binding → user connection → env fallback).
 * The ONE way GitHub tools obtain {token, repo}; never read
 * GITHUB_TOKEN/GITHUB_REPO directly. The mission's product (via its newest
 * changeset, which stamps product_id) scopes the repo when a product-level
 * binding exists, so the /sync "Product repo override" finally applies
 * during builds, not just deploy capture (seam-2 fix). Fail-soft: any
 * lookup error degrades to the workspace chain, never blocks resolution.
 */
async function requireGithub(ctx: ToolCtx) {
  let productId: string | null = null;
  if (ctx.missionId) {
    try {
      const { data } = await ctx.supabase
        .from("studio_changesets")
        .select("product_id")
        .eq("mission_id", ctx.missionId)
        .neq("status", "abandoned")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      productId = (data as { product_id?: string | null } | null)?.product_id ?? null;
    } catch {
      productId = null;
    }
  }
  return resolveGitHub({
    userId: ctx.userId,
    workspaceId: ctx.workspaceId,
    productId,
    userClient: ctx.supabase,
    cache: ctx.authCache,
  });
}

// ── read tools ────────────────────────────────────────────────────────
const workspaceSearch = def({
  name: "workspace.search",
  description:
    "Semantic search across the workspace (docs, PRDs, notes, signals, meetings). Returns top chunks.",
  category: "read",
  argsSchema: z.object({
    query: z.string().min(1).max(500),
    k: z.number().int().min(1).max(10).optional(),
  }),
  preview: (a) => `Search workspace: "${a.query}"`,
  run: async ({ query, k }, { supabase, userId }) => {
    const chunks = await retrieve(supabase, userId, { query, k: k ?? 5, mmr: true });
    return chunks.map((c) => ({
      kind: c.source_kind,
      id: c.source_id,
      title: c.title,
      snippet: c.content.slice(0, 280),
      score: Number(c.similarity?.toFixed(3)),
    }));
  },
});

const listTasks = def({
  name: "workspace.list_tasks",
  description: "List tasks. Filter by status (todo|in_progress|done) and/or priority.",
  category: "read",
  argsSchema: z.object({
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  preview: (a) =>
    `List tasks${a.status ? ` · ${a.status}` : ""}${a.priority ? ` · ${a.priority}` : ""}`,
  run: async ({ status, priority, limit }, { supabase, userId }) => {
    let q = supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,is_deep_work,estimate_hours")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) q = q.eq("status", status);
    if (priority) q = q.eq("priority", priority);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

// ── write tools ───────────────────────────────────────────────────────
const createTask = def({
  name: "tasks.create",
  description: "Create a task in the workspace.",
  category: "write",
  argsSchema: z.object({
    title: z.string().min(1).max(280),
    priority: z.enum(["low", "medium", "high"]).optional(),
    estimate_hours: z.number().min(0.25).max(40).optional(),
    is_deep_work: z.boolean().optional(),
    due_date: z.string().optional(),
  }),
  preview: (a) => `Create task: "${a.title}"${a.priority ? ` (${a.priority})` : ""}`,
  // Same tenancy miss as `signals.log` above, same fix, found in the same sweep:
  // `tasks` is in the NOT NULL workspace_id set, so an agent-created task died on
  // the default resolving NULL. These two were the oldest write tools in the file
  // and the only two the retrofit skipped; research.synthesize, prd.draft,
  // decision.record and learning.record all already stamp it.
  run: async (a, { supabase, userId, workspaceId }) => {
    if (!workspaceId) {
      throw new Error(
        "No workspace is in context, so there is nowhere to file this task. This is a wiring fault, not something to retry.",
      );
    }
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        title: a.title,
        priority: a.priority ?? "medium",
        estimate_hours: a.estimate_hours ?? null,
        is_deep_work: a.is_deep_work ?? false,
        due_date: a.due_date ?? null,
      })
      .select("id,title")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const updateTaskStatus = def({
  name: "tasks.update_status",
  description: "Change a task's status. Use 'done' to mark complete.",
  category: "write",
  argsSchema: z.object({
    task_id: z.string().uuid(),
    status: z.enum(["todo", "in_progress", "done"]),
  }),
  preview: (a) => `Mark task ${a.task_id.slice(0, 8)} → ${a.status}`,
  run: async (a, { supabase, userId }) => {
    const patch: Record<string, unknown> = { status: a.status };
    if (a.status === "done") patch.completed_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", a.task_id)
      .eq("user_id", userId)
      .select("id,status")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const logSignal = def({
  name: "signals.log",
  description: "Log a discovery signal (user feedback, support ticket, interview quote).",
  category: "write",
  argsSchema: z.object({
    content: z.string().min(1).max(4000),
    title: z.string().max(200).optional(),
    source: z.string().max(40).optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    tags: z.array(z.string().max(40)).max(10).optional(),
  }),
  preview: (a) => `Log signal: "${(a.title ?? a.content).slice(0, 80)}"`,
  /**
   * THE WRITE THAT FROZE THE LOOP (found 2026-08-03 by walking the live product).
   *
   * This insert omitted `workspace_id`, and the tenancy retrofit
   * (20260530120200_tenancy_c_tighten_policies.sql) made that fatal: it set the
   * column NOT NULL with a DEFAULT of `current_user_default_workspace()`, which
   * resolves off `auth.uid()`. An agent runs server-side with no end-user JWT, so
   * the default resolved NULL against a NOT NULL column and EVERY agent-logged
   * signal failed. That migration's own header predicted this exact miss: "Once
   * request-context plumbing lands, set workspace_id + product_id explicitly in
   * server functions." `signals.list` (immediately below) was updated; this was not.
   *
   * What it cost, visible on the live product: 14 consecutive runs on one track
   * titled "finished, filing nothing", one of them naming the cause outright
   * ("signals.log tool fails with null workspace_id error despite explicit
   * 'helio-labs' parameter"), three tracks parked at Discover with every later
   * station "not reached", and Plan reading "Nothing is committed yet". Evidence
   * could not accumulate, so themes kept a seeded `frequency` with no linked rows,
   * which is why a 40-signal cluster promoted carrying 0 signals of evidence.
   *
   * Fail LOUD, not soft. If the context carries no workspace there is nowhere
   * correct to file this, and silently writing it somewhere else would put one
   * tenant's evidence in another tenant's record. Saying so is the safe answer,
   * and the agent can surface it instead of burning its remaining steps.
   */
  /**
   * THROUGH THE SINK, NOT STRAIGHT INTO THE TABLE (changed 2026-08-15).
   *
   * This inserted a `signals` row by hand, and `writeSignals` exists precisely so
   * that no source does. What the hand-rolled insert skipped, in the order it
   * costs:
   *
   *   THE TRAIL ROW. The sink writes `stage_events` with `to_stage='sensed'`,
   *   which is the first link of the record chain, and `loop-state.functions.ts`
   *   renders "New signals came in" from exactly that row. So every signal the
   *   AUTONOMOUS SPINE filed was invisible to the surface that reports where the
   *   loop stands: Discover ran, evidence landed, the driver counted it and
   *   advanced, and the loop view said nothing had come in. This is the tool
   *   Discover's whole crew is told to call, so it was the one door where the
   *   omission cost the most.
   *
   *   `source_kind`, which every read that filters the fabric by lane depends on.
   *   A row without it is in no lane.
   *
   *   THE INLINE EMBEDDING, so a freshly filed signal is clusterable on this tick
   *   rather than at the next backfill sweep. Discover's own next act is usually
   *   clustering, so the gap was directly in the way.
   *
   *   Dedup on `externalId`, which lets a re-run of the same station file the same
   *   evidence without duplicating it.
   *
   * `untrusted` is FALSE here, deliberately. The screen exists for text arriving
   * from outside (web, webhook, external MCP); this text was composed by our own
   * agent inside the loop, and screening it would mean treating the platform's own
   * output as an attacker's. The agent's INPUTS are screened where they enter.
   *
   * The loud refusal on a missing workspace stays exactly as it was: there is
   * nowhere correct to file without one, and filing it elsewhere would put one
   * tenant's evidence in another tenant's record.
   */
  run: async (a, { userId, workspaceId }) => {
    if (!workspaceId) {
      throw new Error(
        "No workspace is in context, so there is nowhere to file this signal. This is a wiring fault, not something to retry.",
      );
    }
    const { writeSignals } = await import("@/lib/sources/sink.server");
    const result = await writeSignals(userId, workspaceId, [
      {
        source: a.source ?? "agent",
        sourceKind: "manual",
        title: a.title ?? a.content.slice(0, 120),
        content: a.content,
        tags: a.tags ?? [],
        sentiment: a.sentiment ?? undefined,
        untrusted: false,
      },
    ]);
    /**
     * REPORTED AS A COUNT, because the sink writes a batch and does not hand back
     * ids. The previous shape returned `{id}` from its own insert.
     *
     * That matters to ONE caller and it is the important one: `collectAttachments`
     * reads a step's result to file a member row, and `TOOL_PRODUCTS` maps
     * `signals.log` to `{kind: "signal", idField: "id"}`. So a result with no `id`
     * would make the driver see a station that filed nothing, which is the exact
     * freeze this whole pass has been closing. The sink is therefore asked for the
     * id it just wrote rather than being trusted to imply one.
     */
    return { inserted: result.inserted, skipped: result.skipped, id: result.ids[0] ?? null };
  },
});

// ── Signal Fabric read / sense tools ──────────────────────────────────
const listSignals = def({
  name: "signals.list",
  description:
    "List recent signals ingested into the workspace. Filterable by source_kind, tag, sentiment, and how many days back to look.",
  category: "read",
  argsSchema: z.object({
    source_kind: z.string().max(60).optional(),
    tag: z.string().max(60).optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    // 30, not 7. THIS DEFAULT IS WHY NOTHING HAD EVER LEFT DISCOVER.
    //
    // Measured on the live database 2026-08-02: 308 signals exist, 144 of them
    // inside 30 days, and SIX inside 7. So this tool answered "empty" for almost
    // every workspace on almost every call, the Discover station filed nothing,
    // its track burned three attempts and froze. 42 open tracks, every one of
    // them standing at `sense`, exactly one track in the product's history has
    // ever reached `done`.
    //
    // A pattern-finding station needs enough history to contain a pattern. Seven
    // days is a status-update window, not an evidence window, and it does not
    // match the scout's own 30 day horizon or the clustering horizon either.
    lookback_days: z.number().int().min(1).max(90).default(30),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  preview: (a) =>
    `List signals (${a.lookback_days}d, source=${a.source_kind ?? "any"}, tag=${a.tag ?? "any"})`,
  run: async (a, { supabase, userId, workspaceId }) => {
    const cutoff = new Date(Date.now() - a.lookback_days * 86_400_000).toISOString();
    let q = supabase
      .from("signals")
      .select("id, title, content, source, source_kind, sentiment, tags, created_at")
      .eq("user_id", userId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(a.limit);
    if (workspaceId) q = q.eq("workspace_id", workspaceId);
    if (a.source_kind) q = q.eq("source_kind", a.source_kind);
    if (a.sentiment) q = q.eq("sentiment", a.sentiment);
    if (a.tag) q = q.contains("tags", [a.tag]);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (rows.length > 0) return rows;

    // AN EMPTY WINDOW AND AN EMPTY WORKSPACE ARE DIFFERENT FACTS, and returning
    // a bare [] for both is what let this fail silently for weeks: the station
    // read "no signals" and reported "connect a source" to workspaces holding
    // thirty. So when the window is empty, say what is outside it. The agent can
    // then widen the lookback instead of concluding the desk is empty, and a
    // human reading the run sees the real reason. Filters are repeated rather
    // than shared because PostgREST's count option exists only on the FIRST
    // select in a chain, so the two queries cannot share a builder.
    let c = supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (workspaceId) c = c.eq("workspace_id", workspaceId);
    if (a.source_kind) c = c.eq("source_kind", a.source_kind);
    if (a.sentiment) c = c.eq("sentiment", a.sentiment);
    if (a.tag) c = c.contains("tags", [a.tag]);
    const { count } = await c;
    const outside = count ?? 0;
    if (outside === 0) return [];
    return {
      signals: [],
      window_days: a.lookback_days,
      older_signals_outside_window: outside,
      note: `No signals in the last ${a.lookback_days} days, but this workspace holds ${outside} older ones. Call again with a larger lookback_days before concluding there is nothing to work with.`,
    };
  },
});

const listThemes = def({
  name: "themes.list",
  description:
    "List the current workspace's clustered signal themes (insight clusters). Each theme has a title, summary, severity, confidence, and member count.",
  category: "read",
  argsSchema: z.object({
    min_severity: z.number().int().min(1).max(5).default(1),
    limit: z.number().int().min(1).max(30).default(10),
  }),
  preview: (a) => `List themes (severity >= ${a.min_severity})`,
  run: async (a, { supabase, userId, workspaceId }) => {
    let q = supabase
      .from("signal_themes")
      .select("id, title, summary, severity, confidence, member_count, updated_at")
      .eq("user_id", userId)
      .gte("severity", a.min_severity)
      .order("severity", { ascending: false })
      .limit(a.limit);
    if (workspaceId) q = q.eq("workspace_id", workspaceId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

const sourcesStatus = def({
  name: "sources.status",
  description:
    "Show signal ingestion health: signal counts by source_kind over the last 7 days and the number of active scout targets. Use to understand where signals are (or aren't) coming from.",
  category: "read",
  argsSchema: z.object({}),
  preview: () => "Sources status: signal counts by source_kind (7d)",
  run: async (_a, { supabase, userId, workspaceId }) => {
    const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();

    let sigQ = supabase
      .from("signals")
      .select("source_kind")
      .eq("user_id", userId)
      .gte("created_at", cutoff);
    if (workspaceId) sigQ = sigQ.eq("workspace_id", workspaceId);
    const { data: sigRows, error: sigErr } = await sigQ;
    if (sigErr) throw new Error(sigErr.message);

    const counts: Record<string, number> = {};
    for (const row of sigRows ?? []) {
      const k = (row as { source_kind?: string | null }).source_kind ?? "unknown";
      counts[k] = (counts[k] ?? 0) + 1;
    }

    let targetCount = 0;
    if (workspaceId) {
      const { count } = await supabase
        .from("scout_targets")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("enabled", true);
      targetCount = count ?? 0;
    }

    return { signals_7d_by_source: counts, active_scout_targets: targetCount };
  },
});

const clusterTrigger = def({
  name: "cluster.trigger",
  description:
    "Re-run signal clustering for the current workspace. Groups recent signals into insight themes. Useful after a batch of new signals arrives.",
  category: "write",
  argsSchema: z.object({
    project_id: z.string().uuid().optional(),
  }),
  preview: () => "Trigger signal clustering",
  run: async (a, { supabase, userId, workspaceId }) =>
    clusterSignalsCore(supabase, userId, workspaceId ?? null, a.project_id ?? null),
});

const sourcesConnect = def({
  name: "sources.connect",
  description:
    "Look up setup instructions and capabilities for a named data source / connector. Use to guide the user through connecting a new tool (GitHub, Stripe, Slack, etc.).",
  category: "read",
  argsSchema: z.object({
    provider: z.string().min(1).max(60),
  }),
  preview: (a) => `Sources connect: ${a.provider}`,
  run: async (a) => {
    const spec = CONNECTOR_REGISTRY[a.provider as keyof typeof CONNECTOR_REGISTRY];
    if (!spec) {
      const available = Object.keys(CONNECTOR_REGISTRY).join(", ");
      return { error: `Unknown provider "${a.provider}". Available: ${available}` };
    }
    return {
      id: spec.id,
      label: spec.label,
      description: spec.description,
      capabilities: spec.capabilities,
      setup_hint: spec.setupHint ?? null,
    };
  },
});

const createNote = def({
  name: "notes.create",
  description: "Save a free-form note.",
  category: "write",
  argsSchema: z.object({
    body: z.string().min(1).max(8000),
    tags: z.array(z.string().max(40)).max(10).optional(),
  }),
  preview: (a) => `Note: "${a.body.slice(0, 80)}"`,
  run: async (a, { supabase, userId }) => {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        body: a.body,
        tags: a.tags ?? [],
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

// ── memory tools ──────────────────────────────────────────────────────
const remember = def({
  name: "memory.remember",
  description:
    "Save a long-term memory the agent should recall later. Use sparingly for durable facts.",
  category: "memory",
  argsSchema: z.object({
    content: z.string().min(1).max(1000),
    importance: z.number().int().min(1).max(5).optional(),
    scope: z.enum(["global", "agent"]).optional(),
  }),
  preview: (a) => `Remember: "${a.content.slice(0, 80)}"`,
  run: async (a, { supabase, userId, agentSlug, agentId, workspaceId }) => {
    let emb: number[] | null = null;
    try {
      emb = await embedOne(a.content, { supabase, userId, surfaceRef: "memory.remember" });
    } catch {
      /* ignore embed failure */
    }
    const { data, error } = await supabase
      .from("agent_memory")
      .insert({
        user_id: userId,
        agent_id: agentId ?? null,
        agent_slug: agentSlug ?? null,
        scope: a.scope ?? "agent",
        kind: "note",
        content: a.content,
        importance: a.importance ?? 3,
        embedding: emb as unknown as string | null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // WM-F1b: land the memory in the ACTIVE workspace, not just the owner's default.
    // The DB BEFORE-INSERT trigger fills workspace_id from user_id when omitted (so
    // workspace isolation never depends on this app tag), but recording the active
    // workspace keeps recall correctly scoped for a multi-workspace user. Done as a
    // separate, error-tolerant update so it stays pre-migration safe: before the column
    // exists the update no-ops (mirrors rememberOutcome in memory.server.ts).
    if (workspaceId && (data as { id?: string } | null)?.id) {
      try {
        await supabase
          .from("agent_memory")
          .update({ workspace_id: workspaceId })
          .eq("id", (data as { id: string }).id);
      } catch {
        /* column not present yet (pre-migration); non-fatal */
      }
    }
    return data;
  },
});

/**
 * memory.reflect — F-AGENT-2.
 * Distil a lesson from this run and persist it as a reflection. The loop
 * auto-calls the same helper on every clean completion, so explicit calls
 * from the model are optional — useful when the agent wants to record
 * something *before* a planned handoff. Idempotency falls out of the loop's
 * tool idempotency wrapper.
 */
const memoryReflect = def({
  name: "memory.reflect",
  description:
    "Record a one-paragraph lesson from this run so future runs of the same agent can recall it. Optional — the system reflects automatically on clean completion. Use this only when you want to capture a lesson mid-run (e.g. before a handoff).",
  category: "memory",
  argsSchema: z.object({
    note: z.string().max(400).optional(),
  }),
  preview: (a) => `Reflect on this run${a.note ? ` · note: "${a.note.slice(0, 60)}"` : ""}`,
  run: async (a, { supabase, userId, agentId, agentSlug, workspaceId, runId, traceId }) => {
    if (!agentSlug) throw new Error("memory.reflect requires an agent context");
    // Pull the current run input as the "goal"; fall back to the model's note.
    let goal = a.note ?? "(mid-run reflection)";
    let finalMsg = a.note ?? "(no final message yet — mid-run)";
    if (runId) {
      const { data: run } = await supabase
        .from("agent_runs")
        .select("input,output")
        .eq("id", runId)
        .maybeSingle();
      if (run?.input) goal = run.input as string;
      if (run?.output) finalMsg = run.output as string;
    }
    const row = await autoReflect(supabase, {
      userId,
      agentId: agentId ?? null,
      agentSlug,
      workspaceId: workspaceId ?? null,
      runId: runId ?? null,
      traceId: traceId ?? null,
      goal,
      finalMsg,
    });
    if (!row) return { ok: false, reason: "no lesson produced" };
    return { ok: true, memory_id: row.id, importance: row.importance, content: row.content };
  },
});

/**
 * memory.promote — F-AGENT-2.
 * Escalate a memory's scope from `agent` (only this agent recalls it) to
 * `global` (every agent in the workspace recalls it). Use sparingly for
 * workspace-wide truths (e.g. "Q3 priority is retention").
 */
const memoryPromote = def({
  name: "memory.promote",
  description:
    "Promote a memory from agent-scope to workspace-scope so every agent recalls it. Pass memory_id (returned by memory.remember or memory.reflect). Use only for cross-agent truths.",
  category: "memory",
  argsSchema: z.object({
    memory_id: z.string().uuid(),
  }),
  preview: (a) => `Promote memory ${a.memory_id.slice(0, 8)} → workspace`,
  run: async (a, { supabase, userId }) => {
    const { data, error } = await supabase
      .from("agent_memory")
      .update({ scope: "global" })
      .eq("id", a.memory_id)
      .eq("user_id", userId)
      .select("id,scope,kind,content")
      .maybeSingle();
    if (error) throw new Error(error.message);
    // SAY WHAT IS ACTUALLY WRONG. `.single()` used to raise PostgREST's "Cannot
    // coerce the result to a single JSON object" when no row matched, which
    // tells the agent nothing it can act on. Observed live on 2026-08-01:
    // insight-keeper passed the id of the `learnings` row it had just written,
    // because a learning IS the thing it wants remembered, and spent every one
    // of its steps re-trying a call that could never work. The id was wrong, not
    // the intent, and the error now says so and points at the fix.
    if (!data) {
      throw new Error(
        `No memory with id ${a.memory_id}. memory.promote only raises the scope of a memory that ALREADY exists; ` +
          `it does not create one, and it does not accept the id of a learning, prd or any other row. ` +
          `Call memory.remember first and promote the memory_id it returns.`,
      );
    }
    return data;
  },
});

// ── planning tools ────────────────────────────────────────────────────
const proposeSlots = def({
  name: "scheduler.propose",
  description: "Generate calendar slot proposals based on the user's working hours.",
  category: "planning",
  argsSchema: z.object({
    title: z.string().min(1).max(200),
    duration_minutes: z.number().int().min(15).max(240).optional(),
    description: z.string().max(2000).optional(),
  }),
  preview: (a) => `Propose ${a.duration_minutes ?? 30}m slots for "${a.title}"`,
  run: async (a, { supabase, userId }) => {
    const dur = a.duration_minutes ?? 30;
    const { data: profile } = await supabase
      .from("profiles")
      .select("working_hours_start,working_hours_end")
      .eq("id", userId)
      .maybeSingle();
    const start = profile?.working_hours_start ?? 9;
    const end = profile?.working_hours_end ?? 18;
    const slots: { start: string; end: string }[] = [];
    const now = new Date();
    now.setMinutes(0, 0, 0);
    for (let d = 1; d <= 5 && slots.length < 5; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      for (const h of [start + 1, Math.floor((start + end) / 2), end - 2]) {
        if (slots.length >= 5) break;
        const s = new Date(day);
        s.setHours(h, 0, 0, 0);
        const e = new Date(s);
        e.setMinutes(s.getMinutes() + dur);
        slots.push({ start: s.toISOString(), end: e.toISOString() });
      }
    }
    const { data, error } = await supabase
      .from("scheduler_proposals")
      .insert({
        user_id: userId,
        title: a.title,
        description: a.description ?? null,
        duration_minutes: dur,
        slots,
      })
      .select("id,slots")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

const createCalendarEvent = def({
  name: "calendar.create",
  description:
    "Create a calendar event after the user picked a slot. Requires start_at + end_at + title.",
  category: "write",
  argsSchema: z.object({
    title: z.string().min(1).max(200),
    start_at: z.string(),
    end_at: z.string(),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
  }),
  preview: (a) => `Calendar event "${a.title}" at ${new Date(a.start_at).toLocaleString()}`,
  run: async (a, { supabase, userId }) => {
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: userId,
        title: a.title,
        start_at: a.start_at,
        end_at: a.end_at,
        description: a.description ?? null,
        location: a.location ?? null,
        external_id: `local-${crypto.randomUUID()}`,
        calendar_id: "primary",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

// ── lifecycle / build tools ───────────────────────────────────────────
/**
 * github.issue.create — opens a real GitHub issue on the allow-listed repo.
 * Allow-list = the single repo resolved by requireGithub (workspace binding →
 * user connection → GITHUB_REPO env fallback), always "owner/name".
 * Idempotent via key = github_issue:{idempotency_key}; safe to retry across
 * worker restarts without double-creating issues.
 */
const githubIssueCreate = def({
  name: "github.issue.create",
  description:
    "Open a GitHub issue on the connected product repo. Pass an idempotency_key (e.g. the PRD id) so re-execution does not double-create. Use to hand work from PRD → engineering backlog.",
  category: "write",
  argsSchema: z.object({
    title: z.string().min(1).max(280),
    body: z.string().min(1).max(60_000),
    labels: z.array(z.string().min(1).max(50)).max(10).optional(),
    idempotency_key: z.string().min(1).max(200),
  }),
  preview: (a) => `Open GitHub issue: "${a.title}"`,
  run: async (a, ctx) => {
    const { supabase, userId, runId } = ctx;
    const { token, repo } = await requireGithub(ctx);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Invalid GitHub repo format: ${repo}`);
    const outcome = await withIdempotency(
      supabase,
      "github_issue",
      a.idempotency_key,
      userId,
      runId ?? null,
      async () => {
        const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "supaprod-agent",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: a.title, body: a.body, labels: a.labels ?? [] }),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`GitHub ${res.status}: ${txt.slice(0, 400)}`);
        }
        const json = (await res.json()) as { number: number; html_url: string; id: number };
        return { number: json.number, url: json.html_url, id: json.id, repo };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

/**
 * github.pr.open — Bundle 9 Slice 1.
 * Opens a SINGLE-FILE scoped PR on the allow-listed repo (resolved via
 * requireGithub: workspace binding → user connection → env fallback).
 * REST-only flow because the Worker runtime has no native git. Steps:
 *   1) GET the default branch + its head sha (the base)
 *   2) POST a new ref (branch) off that sha
 *   3) GET existing file sha on the new branch (404 = new file)
 *   4) PUT the file contents (create or update)
 *   5) POST a pull request from the new branch → default branch
 * Idempotent via withIdempotency(key = "github_pr:<idempotency_key>") so a
 * worker restart or re-approval returns the cached {number, url, branch}.
 */
const githubPrOpen = def({
  name: "github.pr.open",
  description:
    "Builder agent: open a single-file scoped pull request on the connected product repo. Pass an idempotency_key like 'issue-42' so re-execution does not double-open. NEVER auto-merges.",
  category: "write",
  argsSchema: z.object({
    issue_number: z.number().int().min(1).max(10_000_000),
    path: z
      .string()
      .min(1)
      .max(400)
      .regex(
        /^[^\s][\w\-./]+[^\s/]$/,
        "path must be a repo-relative file (no leading slash, no spaces)",
      ),
    contents: z.string().min(1).max(120_000),
    title: z.string().min(1).max(280),
    body: z.string().min(1).max(60_000),
    idempotency_key: z.string().min(1).max(200),
  }),
  preview: (a) => `Open PR for issue #${a.issue_number}: "${a.title}" · ${a.path}`,
  run: async (a, ctx) => {
    const { supabase, userId, runId, missionId, workspaceId } = ctx;
    const { token, repo, actorLabel } = await requireGithub(ctx);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Invalid GitHub repo format: ${repo}`);
    // Disallow paths the Builder must never touch.
    const forbiddenPrefixes = [
      ".github/",
      "supabase/migrations/",
      ".env",
      "bun.lock",
      "package-lock.json",
    ];
    if (forbiddenPrefixes.some((p) => a.path === p || a.path.startsWith(p))) {
      throw new Error(
        `Builder is not allowed to modify ${a.path} (CI / migrations / lockfiles are out of scope).`,
      );
    }

    // Bundle 9 Slice 3 — claim the (repo, path) before opening the PR. A
    // second parallel mission targeting the same file will hit the partial
    // unique index and get a typed error instead of silently opening a
    // competing PR. The claim is auto-released when this run reaches a
    // terminal state (trigger on agent_runs).
    if (runId) {
      // Did we already claim it on a prior attempt of this same run?
      const { data: existing } = await supabase
        .from("builder_file_claims")
        .select("id,run_id,status")
        .eq("repo", repo)
        .eq("path", a.path)
        .eq("status", "held")
        .maybeSingle();
      if (existing && existing.run_id !== runId) {
        // Look up the holder's mission title for a helpful error message.
        let holderTitle: string | null = null;
        const { data: holderRun } = await supabase
          .from("agent_runs")
          .select("mission_id")
          .eq("id", existing.run_id)
          .maybeSingle();
        const holderMissionId =
          (holderRun as { mission_id?: string | null } | null)?.mission_id ?? null;
        if (holderMissionId) {
          const { data: m } = await supabase
            .from("missions")
            .select("title")
            .eq("id", holderMissionId)
            .maybeSingle();
          holderTitle = (m as { title?: string } | null)?.title ?? null;
        }
        throw new Error(
          `BuilderFileConflict: path "${a.path}" is already claimed by another Builder mission${holderTitle ? ` ("${holderTitle}")` : ""}. ` +
            `Wait for it to finish or have the operator release the claim from /build.`,
        );
      } else if (!existing) {
        // Try to take the claim. If a parallel call beats us, fall back to
        // the typed conflict error.
        let missionTitle: string | null = null;
        if (missionId) {
          const { data: m } = await supabase
            .from("missions")
            .select("title")
            .eq("id", missionId)
            .maybeSingle();
          missionTitle = (m as { title?: string } | null)?.title ?? null;
        }
        const { error: insErr } = await supabase.from("builder_file_claims").insert({
          user_id: userId,
          workspace_id: workspaceId ?? null,
          run_id: runId,
          mission_id: missionId ?? null,
          mission_title: missionTitle,
          repo,
          path: a.path,
          status: "held",
        });
        if (insErr) {
          if (/unique|duplicate/i.test(insErr.message)) {
            throw new Error(
              `BuilderFileConflict: path "${a.path}" was just claimed by another Builder mission. ` +
                `Wait for it to finish or have the operator release the claim from /build.`,
            );
          }
          // Non-conflict insert failure is non-fatal — log and proceed; the
          // worst case is the next slice (operator release) is unavailable.
          console.error("[github.pr.open] claim insert failed:", insErr.message);
        }
      }
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "supaprod-builder",
      "Content-Type": "application/json",
    };

    const outcome = await withIdempotency(
      supabase,
      "github_pr",
      a.idempotency_key,
      userId,
      runId ?? null,
      async () => {
        // 1) default branch + its head sha
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`, { headers });
        if (!repoRes.ok)
          throw new Error(
            `GitHub repo lookup ${repoRes.status}: ${(await repoRes.text()).slice(0, 300)}`,
          );
        const repoJson = (await repoRes.json()) as { default_branch: string };
        const baseBranch = repoJson.default_branch;

        const baseRefRes = await fetch(
          `https://api.github.com/repos/${repo}/git/ref/heads/${baseBranch}`,
          { headers },
        );
        if (!baseRefRes.ok)
          throw new Error(
            `GitHub base-ref ${baseRefRes.status}: ${(await baseRefRes.text()).slice(0, 300)}`,
          );
        const baseRefJson = (await baseRefRes.json()) as { object: { sha: string } };
        const baseSha = baseRefJson.object.sha;

        // 2) create branch — include short uuid suffix so reopening after a deleted branch still works
        const safeSlug = a.path
          .replace(/[^a-z0-9]+/gi, "-")
          .toLowerCase()
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const suffix = Math.random().toString(36).slice(2, 8);
        const branch = `builder/issue-${a.issue_number}-${safeSlug}-${suffix}`.slice(0, 80);
        const newRefRes = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
        });
        if (!newRefRes.ok) {
          throw new Error(
            `GitHub create-branch ${newRefRes.status}: ${(await newRefRes.text()).slice(0, 300)}`,
          );
        }

        // 3) optional existing sha on new branch (almost always 404)
        const existingRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(a.path)}?ref=${branch}`,
          { headers },
        );
        let existingSha: string | undefined;
        if (existingRes.ok) {
          const j = (await existingRes.json()) as { sha?: string };
          existingSha = j.sha;
        }

        // 4) PUT contents
        // Buffer is available (nodejs_compat). Worker has no atob/btoa unicode safety, so use Buffer.
        const contentB64 = Buffer.from(a.contents, "utf8").toString("base64");
        const putRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(a.path)}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: `Builder agent: ${a.title}`.slice(0, 200),
              content: contentB64,
              branch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          },
        );
        if (!putRes.ok) {
          throw new Error(
            `GitHub put-contents ${putRes.status}: ${(await putRes.text()).slice(0, 300)}`,
          );
        }

        // 5) open PR
        const prBody = `${a.body.trim()}\n\nCloses #${a.issue_number}\n\n_Opened by the Supaprod Builder agent — approval-gated, single file (\`${a.path}\`) · acting as ${actorLabel}._`;
        const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: a.title,
            body: prBody,
            head: branch,
            base: baseBranch,
            maintainer_can_modify: true,
          }),
        });
        if (!prRes.ok) {
          throw new Error(`GitHub open-pr ${prRes.status}: ${(await prRes.text()).slice(0, 300)}`);
        }
        const prJson = (await prRes.json()) as { number: number; html_url: string; id: number };
        return {
          number: prJson.number,
          url: prJson.html_url,
          id: prJson.id,
          repo,
          branch,
          path: a.path,
        };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

/**
 * github.ci.read — Bundle 9 Slice 2.
 * Read-only inspector for a PR's CI status. Returns the overall conclusion
 * (pending | success | failure | neutral) plus the per-check list. Cached
 * via withIdempotency keyed on `<pr>-<head_sha>` so re-polling within the
 * same loop step doesn't burn quota; cache invalidates naturally when the
 * branch's head_sha changes (e.g. after github.commit.append lands).
 */
const githubCiRead = def({
  name: "github.ci.read",
  description:
    "Builder agent: read GitHub Actions / status-check state on a pull request. Read-only. Use AFTER github.pr.open to decide whether to ship or to append a fix commit.",
  category: "read",
  argsSchema: z.object({
    pr_number: z.number().int().min(1).max(10_000_000),
  }),
  preview: (a) => `Read CI on PR #${a.pr_number}`,
  run: async (a, ctx) => {
    const { supabase, userId, runId } = ctx;
    const { token, repo } = await requireGithub(ctx);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Invalid GitHub repo format: ${repo}`);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "supaprod-builder",
    };

    // 1) PR → head sha + branch (uncached so we always see new commits).
    const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${a.pr_number}`, {
      headers,
    });
    if (!prRes.ok)
      throw new Error(`GitHub get-pr ${prRes.status}: ${(await prRes.text()).slice(0, 300)}`);
    const prJson = (await prRes.json()) as {
      head: { sha: string; ref: string };
      html_url: string;
      merged: boolean;
      state: string;
    };
    const headSha = prJson.head.sha;

    // 2) Cache the heavy parts (check-runs + status) keyed by (pr, head_sha).
    const idemKey = `${a.pr_number}-${headSha}`;
    const outcome = await withIdempotency(
      supabase,
      "github_ci",
      idemKey,
      userId,
      runId ?? null,
      async () => {
        const [checksRes, statusRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}/commits/${headSha}/check-runs?per_page=50`, {
            headers,
          }),
          fetch(`https://api.github.com/repos/${repo}/commits/${headSha}/status`, { headers }),
        ]);
        if (!checksRes.ok)
          throw new Error(
            `GitHub check-runs ${checksRes.status}: ${(await checksRes.text()).slice(0, 300)}`,
          );
        if (!statusRes.ok)
          throw new Error(
            `GitHub combined-status ${statusRes.status}: ${(await statusRes.text()).slice(0, 300)}`,
          );

        const checksJson = (await checksRes.json()) as {
          check_runs?: Array<{
            name: string;
            status: string;
            conclusion: string | null;
            html_url: string;
            id: number;
            output?: { title?: string | null; summary?: string | null };
          }>;
        };
        const statusJson = (await statusRes.json()) as {
          state: "pending" | "success" | "failure" | "error";
          statuses?: Array<{
            context: string;
            state: string;
            description?: string | null;
            target_url?: string | null;
          }>;
        };

        const checks = (checksJson.check_runs ?? []).map((c) => ({
          name: c.name,
          status: c.status, // queued | in_progress | completed
          conclusion: c.conclusion ?? null, // success | failure | neutral | cancelled | skipped | timed_out | action_required | null
          html_url: c.html_url,
          id: c.id,
          summary: (c.output?.title ?? c.output?.summary ?? null)?.toString().slice(0, 240) ?? null,
        }));
        const statuses = (statusJson.statuses ?? []).map((s) => ({
          name: s.context,
          status: s.state === "pending" ? "in_progress" : "completed",
          conclusion: s.state === "pending" ? null : s.state === "success" ? "success" : "failure",
          html_url: s.target_url ?? prJson.html_url,
          id: 0,
          summary: s.description ? s.description.slice(0, 240) : null,
        }));
        const all = [...checks, ...statuses];

        // Single source of truth for the verdict, shared with the J2
        // studio.pr.merge gate (src/lib/ai/studio-ci.ts).
        const overall = overallFromChecks(all);

        return {
          pr_number: a.pr_number,
          head_sha: headSha,
          branch: prJson.head.ref,
          pr_url: prJson.html_url,
          merged: prJson.merged,
          pr_state: prJson.state,
          overall,
          checks: all,
          updated_at: new Date().toISOString(),
        };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

/**
 * github.commit.append — Bundle 9 Slice 2.
 * Append a single follow-up commit to an OPEN PR's branch — used by the
 * Builder when CI is red. Same single-file allow-list as github.pr.open.
 * Idempotent via withIdempotency keyed on the caller-supplied idempotency_key
 * (e.g. "issue-42-fix-1") so a worker restart or re-approval returns the
 * cached { sha, commit_url } without double-appending.
 */
const githubCommitAppend = def({
  name: "github.commit.append",
  description:
    "Builder agent: append ONE single-file follow-up commit to an open PR's branch. Use ONLY when github.ci.read returned overall='failure'. Pass idempotency_key like 'issue-42-fix-1' so re-execution does not double-commit. NEVER auto-merges.",
  category: "write",
  argsSchema: z.object({
    pr_number: z.number().int().min(1).max(10_000_000),
    path: z
      .string()
      .min(1)
      .max(400)
      .regex(
        /^[^\s][\w\-./]+[^\s/]$/,
        "path must be a repo-relative file (no leading slash, no spaces)",
      ),
    contents: z.string().min(1).max(120_000),
    message: z.string().min(1).max(280),
    idempotency_key: z.string().min(1).max(200),
  }),
  preview: (a) => `Append fix to PR #${a.pr_number} (${a.path}): "${a.message.slice(0, 60)}"`,
  run: async (a, ctx) => {
    const { supabase, userId, runId } = ctx;
    const { token, repo } = await requireGithub(ctx);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Invalid GitHub repo format: ${repo}`);
    // Same allow-list as github.pr.open — Builder must never touch CI / migrations / lockfiles.
    const forbiddenPrefixes = [
      ".github/",
      "supabase/migrations/",
      ".env",
      "bun.lock",
      "package-lock.json",
    ];
    if (forbiddenPrefixes.some((p) => a.path === p || a.path.startsWith(p))) {
      throw new Error(
        `Builder is not allowed to modify ${a.path} (CI / migrations / lockfiles are out of scope).`,
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "supaprod-builder",
      "Content-Type": "application/json",
    };

    const outcome = await withIdempotency(
      supabase,
      "github_commit",
      a.idempotency_key,
      userId,
      runId ?? null,
      async () => {
        // 1) Look up the PR's head branch (refuse if PR is closed/merged).
        const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${a.pr_number}`, {
          headers,
        });
        if (!prRes.ok)
          throw new Error(`GitHub get-pr ${prRes.status}: ${(await prRes.text()).slice(0, 300)}`);
        const prJson = (await prRes.json()) as {
          head: { ref: string; sha: string };
          html_url: string;
          state: string;
          merged: boolean;
        };
        if (prJson.state !== "open" || prJson.merged) {
          throw new Error(
            `Cannot append to PR #${a.pr_number}: state=${prJson.state}, merged=${prJson.merged}`,
          );
        }
        const branch = prJson.head.ref;

        // 2) Look up the existing file's sha on the branch (404 → new file).
        const existingRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(a.path)}?ref=${branch}`,
          { headers },
        );
        let existingSha: string | undefined;
        if (existingRes.ok) {
          const j = (await existingRes.json()) as { sha?: string };
          existingSha = j.sha;
        } else if (existingRes.status !== 404) {
          throw new Error(
            `GitHub get-contents ${existingRes.status}: ${(await existingRes.text()).slice(0, 300)}`,
          );
        }

        // 3) PUT new contents (create or update).
        const contentB64 = Buffer.from(a.contents, "utf8").toString("base64");
        const putRes = await fetch(
          `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(a.path)}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({
              message: `Builder fix: ${a.message}`.slice(0, 200),
              content: contentB64,
              branch,
              ...(existingSha ? { sha: existingSha } : {}),
            }),
          },
        );
        if (!putRes.ok) {
          throw new Error(
            `GitHub put-contents ${putRes.status}: ${(await putRes.text()).slice(0, 300)}`,
          );
        }
        const putJson = (await putRes.json()) as { commit: { sha: string; html_url: string } };
        return {
          pr_number: a.pr_number,
          branch,
          path: a.path,
          sha: putJson.commit.sha,
          commit_url: putJson.commit.html_url,
          pr_url: prJson.html_url,
        };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

// ── Studio engine tools (F-STUDIO) ────────────────────────────────────
// Studio = the in-platform development engine. Reads the bound repo, stages
// multi-file changes in a DB changeset (NO GitHub write), then ships through
// gated commit → PR → merge. Display name "Studio"; agent slug stays
// 'builder' (legacy equivalence). See docs/features/studio.md.

const STUDIO_FORBIDDEN_PREFIXES = [
  ".github/",
  "supabase/migrations/",
  ".env",
  "bun.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

function assertStudioPathAllowed(path: string) {
  if (STUDIO_FORBIDDEN_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    throw new Error(
      `Studio is not allowed to modify ${path} (CI / migrations / env / lockfiles are out of scope).`,
    );
  }
}

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "supaprod-studio",
    "Content-Type": "application/json",
  };
}

async function ghJson<T>(url: string, headers: Record<string, string>, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    throw new Error(
      `GitHub ${res.status} on ${url.split("github.com")[1]}: ${(await res.text()).slice(0, 300)}`,
    );
  }
  return (await res.json()) as T;
}

async function getDefaultBranch(repo: string, headers: Record<string, string>) {
  const j = await ghJson<{ default_branch: string }>(
    `https://api.github.com/repos/${repo}`,
    headers,
  );
  return j.default_branch;
}

const STUDIO_PATH_REGEX = /^[^\s/][\w\-./]*[^\s/]$/;

type ChangesetRow = {
  id: string;
  mission_id: string | null;
  repo: string;
  branch: string | null;
  base_sha: string | null;
  status: string;
  title: string;
  pr_url: string | null;
  pr_number: number | null;
};

/**
 * Deterministic FNV-1a fingerprint of staged contents. Part of the
 * studio.commit idempotency key so re-committing with a reused message but
 * DIFFERENT staged files is a new commit, while a true retry (same files,
 * same message) still dedups (audit finding: a message-only key swallowed
 * CI-fix commits).
 */
function fingerprintChanges(
  changes: Array<{ path: string; op: string; new_content: string | null }>,
): string {
  const serialized = changes
    .map((c) => `${c.path}${c.op}${c.new_content ?? ""}`)
    .sort()
    .join("");
  let h = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    h ^= serialized.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Latest non-abandoned changeset for the mission — the "active" one tools upsert into. */
async function getActiveChangeset(
  supabase: SupabaseClient,
  missionId: string,
): Promise<ChangesetRow | null> {
  const { data } = await supabase
    .from("studio_changesets")
    .select("id,mission_id,repo,branch,base_sha,status,title,pr_url,pr_number")
    .eq("mission_id", missionId)
    .neq("status", "abandoned")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ChangesetRow | null) ?? null;
}

/**
 * The spec a mission was dispatched from, or null when it came from a bare
 * prompt or an opportunity.
 *
 * WHY THIS IS APPLICATION CODE AND NOT A TRIGGER. studio_changesets.prd_id has
 * a doc comment on decideStudioMergeShipStamp saying the value is "stamped at
 * creation by the studio_changeset_link_prd trigger". Checked live on
 * 2026-08-05: that trigger and its function do not exist in the database.
 * Migration 20260629120100 added the COLUMN and never the trigger, so the
 * column has been null on every real changeset since it was created, and the
 * whole spec -> merge -> ship -> learn chain has been severed at this seam the
 * entire time. Resolving it here needs no DDL, which also means it cannot fall
 * out of sync with a migration that was committed but never applied — the
 * failure mode that produced this bug in the first place.
 *
 * Fails SOFT and returns null. A changeset must still be creatable when the
 * lineage read fails; a null prd_id is exactly the state we are already in, so
 * the worst case is no worse than today, while the good case closes the loop.
 */
async function resolvePrdForMission(
  supabase: SupabaseClient,
  missionId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("artifact_lineage")
      .select("parent_id")
      .eq("parent_kind", "prd")
      .eq("child_kind", "mission")
      .eq("child_id", missionId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return ((data as { parent_id?: string } | null)?.parent_id ?? null) || null;
  } catch {
    return null;
  }
}

const repoTree = def({
  name: "repo.tree",
  description:
    "Studio: list the connected repo's file tree (paths, types, sizes). Optionally scope to a path prefix or a ref. Read-only. Use FIRST to map the project before reading or editing anything.",
  category: "read",
  argsSchema: z.object({
    path: z.string().max(400).optional(),
    ref: z.string().max(200).optional(),
  }),
  preview: (a) => `Read repo tree${a.path ? ` · ${a.path}` : ""}${a.ref ? ` @ ${a.ref}` : ""}`,
  run: async (a, ctx) => {
    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const ref = a.ref ?? (await getDefaultBranch(repo, headers));
    const j = await ghJson<{
      tree?: Array<{ path: string; type: string; size?: number }>;
      truncated?: boolean;
    }>(
      `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      headers,
    );
    let entries = (j.tree ?? []).map((e) => ({
      path: e.path,
      type: e.type === "tree" ? "dir" : "file",
      size: e.size ?? null,
    }));
    if (a.path) {
      const prefix = a.path.replace(/\/+$/, "");
      entries = entries.filter((e) => e.path === prefix || e.path.startsWith(prefix + "/"));
    }
    const CAP = 400;
    const truncated = Boolean(j.truncated) || entries.length > CAP;
    return {
      repo,
      ref,
      total: entries.length,
      truncated,
      ...(truncated
        ? { note: `Listing capped at ${CAP} entries — narrow with the path arg.` }
        : {}),
      entries: entries.slice(0, CAP),
    };
  },
});

const repoRead = def({
  name: "repo.read",
  description:
    "Studio: read up to 8 files from the connected repo (decoded contents). Read-only. NEVER stage an edit to a file you have not read in this session.",
  category: "read",
  argsSchema: z.object({
    paths: z.array(z.string().min(1).max(400).regex(STUDIO_PATH_REGEX)).min(1).max(8),
    ref: z.string().max(200).optional(),
  }),
  preview: (a) =>
    `Read ${a.paths.length} file(s): ${a.paths.slice(0, 3).join(", ")}${a.paths.length > 3 ? "…" : ""}`,
  run: async (a, ctx) => {
    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const MAX_BYTES = 120_000;
    const files = await Promise.all(
      a.paths.map(async (path) => {
        try {
          const refQ = a.ref ? `?ref=${encodeURIComponent(a.ref)}` : "";
          const res = await fetch(
            `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path)}${refQ}`,
            { headers },
          );
          if (res.status === 404) return { path, error: "not found" };
          if (!res.ok) return { path, error: `GitHub ${res.status}` };
          const j = (await res.json()) as {
            content?: string;
            sha?: string;
            size?: number;
            type?: string;
          };
          if (j.type !== "file") return { path, error: `not a file (${j.type})` };
          if ((j.size ?? 0) > MAX_BYTES)
            return { path, sha: j.sha, size: j.size, error: "too large to read inline" };
          const content = Buffer.from(j.content ?? "", "base64").toString("utf8");
          if (content.includes("\u0000"))
            return { path, sha: j.sha, size: j.size, error: "binary file" };
          return { path, sha: j.sha, size: j.size, content };
        } catch (e) {
          return { path, error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    return { repo, ref: a.ref ?? "(default branch)", files };
  },
});

const repoSearch = def({
  name: "repo.search",
  description:
    "Studio: GitHub code search scoped to the connected repo. Returns matching paths with text fragments. Read-only. Use to locate the code relevant to the work order.",
  category: "read",
  argsSchema: z.object({
    query: z.string().min(1).max(200),
  }),
  preview: (a) => `Search repo code: "${a.query}"`,
  run: async (a, ctx) => {
    const { token, repo } = await requireGithub(ctx);
    const headers = {
      ...ghHeaders(token),
      Accept: "application/vnd.github.text-match+json",
    };
    const q = encodeURIComponent(`${a.query} repo:${repo}`);
    const j = await ghJson<{
      total_count: number;
      items?: Array<{
        path: string;
        text_matches?: Array<{ fragment?: string }>;
      }>;
    }>(`https://api.github.com/search/code?q=${q}&per_page=10`, headers);
    return {
      repo,
      total: j.total_count,
      hits: (j.items ?? []).map((it) => ({
        path: it.path,
        fragments: (it.text_matches ?? [])
          .map((m) => (m.fragment ?? "").slice(0, 300))
          .filter(Boolean)
          .slice(0, 3),
      })),
    };
  },
});

const studioStage = def({
  name: "studio.stage",
  description:
    "Studio: stage multi-file edits into the mission's changeset. REQUIRED on every change: 'path', 'op' ('create'|'update'|'delete'), and 'content' (the FULL new file text, not a diff; omit only when op is 'delete'). Edits land in the platform DB, nothing touches GitHub until studio.commit. Re-stage a path to replace its staged contents.",
  category: "write",
  // Shape-drift fix: the two most common ways a model forgets the documented
  // array wrapper are {changes: {...single change...}} and the change object
  // sent bare at the top level with no `changes` key at all. Both self-
  // corrected on retry every time this session, costing a wasted step each
  // time - normalize them here instead of relying on the retry.
  argsSchema: z.preprocess(
    (raw) => {
      const wrapped = wrapBareArrayField(raw, "changes");
      if (wrapped !== raw) return wrapped;
      if (
        raw !== null &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        !("changes" in raw) &&
        typeof (raw as Record<string, unknown>).path === "string" &&
        typeof (raw as Record<string, unknown>).op === "string"
      ) {
        const { title, summary, ...change } = raw as Record<string, unknown>;
        return { changes: [change], title, summary };
      }
      return raw;
    },
    z.object({
      changes: z
        .array(
          z.object({
            path: z.string().min(1).max(400).regex(STUDIO_PATH_REGEX),
            op: z.enum(["create", "update", "delete"]),
            content: z.string().max(150_000).optional(),
          }),
        )
        .min(1)
        .max(20),
      title: z.string().max(200).optional(),
      summary: z.string().max(2000).optional(),
    }),
  ),
  preview: (a) =>
    `Stage ${a.changes.length} change(s): ${a.changes
      .slice(0, 3)
      .map((c) => `${c.op} ${c.path}`)
      .join(", ")}${a.changes.length > 3 ? "…" : ""}`,
  run: async (a, ctx) => {
    const { supabase, userId, missionId, workspaceId } = ctx;
    if (!missionId) throw new Error("studio.stage requires a mission (dispatch via Studio)");
    if (!workspaceId) throw new Error("studio.stage requires a workspace");
    for (const c of a.changes) {
      assertStudioPathAllowed(c.path);
      if (c.op !== "delete" && typeof c.content !== "string")
        throw new Error(`change for ${c.path}: op '${c.op}' requires content`);
    }

    /**
     * A DECLARED TOUCH LIST IS A BOUNDARY, SO IT HAS TO HOLD HERE.
     *
     * Found 2026-08-03: `studio_changeset_constraints.allowed_paths` was written
     * at dispatch, and then only ever READ to compute `outOfPolicy` for the
     * Changes tab, which reports the violation AFTER the file is already staged.
     * So an operator who narrowed the scope to `src/checkout/**` got a report
     * that the agent had written elsewhere, not a refusal.
     *
     * That is the governance canon inverted. The human's job is to set the
     * boundary in advance; a boundary that is merely narrated afterwards is a
     * log, and it is worse than no boundary because the operator believes they
     * set one. The hard floor (assertStudioPathAllowed: CI, migrations, env,
     * lockfiles) already refuses at this seam; a boundary the user chose
     * themselves deserves at least the same standing.
     *
     * Undeclared stays unbounded, deliberately: the default is autonomy, and an
     * empty list means "nobody narrowed this", not "narrow it to nothing".
     * Fail-soft on the READ only, so a constraints table that cannot be reached
     * never blocks a legitimate run.
     */
    let allowedPaths: string[] = [];
    try {
      const { data: constraintRow } = await supabase
        .from("studio_changeset_constraints")
        .select("allowed_paths")
        .eq("mission_id", missionId)
        .maybeSingle();
      allowedPaths = ((constraintRow as { allowed_paths?: string[] | null } | null)
        ?.allowed_paths ?? []) as string[];
    } catch {
      allowedPaths = [];
    }
    if (allowedPaths.length > 0) {
      const within = (path: string) =>
        allowedPaths.some((rule) => {
          const r = rule.trim().replace(/\*+$/, "");
          return r === "" ? false : path === r || path.startsWith(r.endsWith("/") ? r : `${r}/`);
        });
      const outside = a.changes.map((c) => c.path).filter((p) => !within(p));
      if (outside.length > 0) {
        throw new Error(
          `Outside the declared touch list: ${outside.join(", ")}. This run may only write under ${allowedPaths.join(", ")}. Widen the scope on the Changes tab if that is wrong.`,
        );
      }
    }
    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);

    let changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) {
      const { data: created, error } = await supabase
        .from("studio_changesets")
        .insert({
          user_id: userId,
          workspace_id: workspaceId,
          mission_id: missionId,
          repo,
          title: a.title ?? "",
          summary: a.summary ?? null,
          // The link that lets a merge stamp its spec shipped. See
          // resolvePrdForMission: null here is the pre-2026-08-05 behaviour and
          // is still correct for a prompt-only session with no spec behind it.
          prd_id: await resolvePrdForMission(supabase, missionId),
        })
        .select("id,mission_id,repo,branch,base_sha,status,title,pr_url,pr_number")
        .single();
      if (error) throw new Error(`changeset create failed: ${error.message}`);
      changeset = created as ChangesetRow;

      /**
       * THE EDGE BUILD NEVER WROTE.
       *
       * `artifact_lineage` declares `changeset` as a first-class kind, the
       * Trust Ledger walks signal -> decision -> spec -> build -> merge ->
       * deploy -> outcome through it, and the Helio demo seed fabricates 21
       * `mission -> changeset` edges so the walk looks unbroken in a demo.
       *
       * Measured against production 2026-08-10: NO code path in src/ has ever
       * written `child_kind: "changeset"`. Not one. Against 228 real missions
       * there are ZERO real `mission -> changeset` edges, so the chain has
       * always stopped dead at the busiest station in the product and the only
       * place it appeared to continue was seeded data.
       *
       * This is the write. It belongs here rather than at commit or merge
       * because this branch runs exactly once per changeset, at creation,
       * which is what makes the edge idempotent by construction rather than by
       * relying on the unique index to absorb repeats.
       *
       * `recordLineageSafe`, not `recordLineage`: a provenance stamp runs after
       * the changeset already exists, and a transport failure must never fail
       * the stage call that produced real staged files. A missing edge is a
       * reporting gap; a thrown stage is lost work.
       *
       * The workspace is passed explicitly. Omitting it would resolve the
       * column default `current_user_default_workspace()`, which is the
       * CALLER'S default and not necessarily the workspace this mission lives
       * in. Those differ as soon as a user has two workspaces, and an edge
       * filed under the wrong one is read by the wrong reader forever.
       */
      await recordLineageSafe(supabase, userId, {
        parent_kind: "mission",
        parent_id: missionId,
        child_kind: "changeset",
        child_id: changeset.id,
        relation: "produced",
        rationale: "Studio staged the first change for this mission",
        created_by_agent: "studio",
        workspace_id: workspaceId,
      });
    }

    // Snapshot base from the branch the commit will build on: the changeset's
    // own branch once it exists (it carries earlier Studio commits), else the
    // default branch head.
    const baseRef = changeset.branch ?? (await getDefaultBranch(repo, headers));

    const { data: existingRows } = await supabase
      .from("studio_changes")
      .select("path")
      .eq("changeset_id", changeset.id)
      .in(
        "path",
        a.changes.map((c) => c.path),
      );
    const alreadyStaged = new Set((existingRows ?? []).map((r: { path: string }) => r.path));

    const staged: { path: string; op: string }[] = [];
    for (const c of a.changes) {
      let baseContent: string | null = null;
      let baseSha: string | null = null;
      let op = c.op;
      if (!alreadyStaged.has(c.path)) {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(c.path)}?ref=${encodeURIComponent(baseRef)}`,
          { headers },
        );
        if (res.ok) {
          const j = (await res.json()) as { content?: string; sha?: string; type?: string };
          if (j.type === "file") {
            baseSha = j.sha ?? null;
            const decoded = Buffer.from(j.content ?? "", "base64").toString("utf8");
            baseContent = decoded.includes("\u0000") ? null : decoded;
          }
        } else if (res.status !== 404) {
          throw new Error(`GitHub base read ${res.status} for ${c.path}`);
        }
        // Normalize op against reality so the commit step never lies.
        if (op === "create" && baseSha) op = "update";
        if (op === "update" && !baseSha) op = "create";
        if (op === "delete" && !baseSha)
          throw new Error(`cannot delete ${c.path}: it does not exist on ${baseRef}`);
      }
      const row: Record<string, unknown> = {
        changeset_id: changeset.id,
        user_id: userId,
        path: c.path,
        op,
        new_content: op === "delete" ? null : (c.content ?? null),
        updated_at: new Date().toISOString(),
      };
      // Only set base_* on first stage of a path — re-stages keep the original snapshot.
      if (!alreadyStaged.has(c.path)) {
        row.base_content = baseContent;
        row.base_sha = baseSha;
      }
      const { error } = await supabase
        .from("studio_changes")
        .upsert(row, { onConflict: "changeset_id,path" });
      if (error) throw new Error(`stage failed for ${c.path}: ${error.message}`);
      staged.push({ path: c.path, op });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (a.title) patch.title = a.title;
    if (a.summary) patch.summary = a.summary;
    await supabase.from("studio_changesets").update(patch).eq("id", changeset.id);

    const { count } = await supabase
      .from("studio_changes")
      .select("id", { count: "exact", head: true })
      .eq("changeset_id", changeset.id);
    return {
      changeset_id: changeset.id,
      repo,
      staged,
      total_staged_paths: count ?? staged.length,
      note:
        changeset.status === "staged"
          ? "Staged in the platform only — call studio.commit to push to a studio/* branch."
          : "Changeset already has commits — studio.commit again to push these changes to the same branch.",
    };
  },
});

const studioCommit = def({
  name: "studio.commit",
  description:
    "Studio: commit ALL staged changes to an isolated studio/* branch via the Git Data API (creates the branch off the default-branch head on first commit). Operator-gated. Call again after staging CI fixes to append to the same branch.",
  category: "write",
  argsSchema: z.object({
    message: z.string().min(4).max(280),
  }),
  preview: (a) => `Commit staged changes: "${a.message.slice(0, 80)}"`,
  run: async (a, ctx) => {
    const { supabase, userId, missionId, workspaceId, runId } = ctx;
    if (!missionId) throw new Error("studio.commit requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset — call studio.stage first");
    const { data: changes } = await supabase
      .from("studio_changes")
      .select("path,op,base_content,new_content")
      .eq("changeset_id", changeset.id)
      .order("path");
    if (!changes?.length) throw new Error("changeset has no staged changes");
    for (const c of changes as { path: string }[]) assertStudioPathAllowed(c.path);

    // THE SECRET FLOOR, and it sits here for one reason: this line is the last
    // point at which a credential is still only in our database. Everything
    // after it is a Git Data API write to a real customer repo, where a secret
    // is in history, in every fork and clone, and unrecallable from inside the
    // product. That is the same class of boundary `assertStudioPathAllowed`
    // guards a few lines up, so it is enforced the same way: a hard refusal
    // with no argument and no override, never a warning an agent can read past.
    //
    // Scoped to lines this changeset ADDS (see secret-scan.ts), so a repo that
    // already contains a credential somewhere does not become un-editable, and
    // matched only against the platform's existing high-confidence structural
    // rules, so a refusal is a real credential rather than a guess. The message
    // names path, line, and kind, and never the value.
    const secretScan = scanStagedChangesForSecrets(changes as StagedChangeContent[]);
    if (secretScan.blocked) throw new Error(describeStagedSecrets(secretScan));

    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const branch = changeset.branch ?? studioBranchName(missionId, changeset.id);
    const paths = (changes as { path: string }[]).map((c) => c.path);

    // Claim every path (Bundle 9 Slice 3 semantics) — a parallel mission
    // holding any of these paths is a typed conflict, not a silent race.
    const { data: held } = await supabase
      .from("builder_file_claims")
      .select("path,mission_id,mission_title")
      .eq("repo", repo)
      .eq("status", "held")
      .in("path", paths);
    const foreign = (held ?? []).find(
      (h: { mission_id: string | null }) => h.mission_id && h.mission_id !== missionId,
    );
    if (foreign) {
      throw new Error(
        `BuilderFileConflict: path "${(foreign as { path: string }).path}" is claimed by another Studio mission${(foreign as { mission_title?: string }).mission_title ? ` ("${(foreign as { mission_title: string }).mission_title}")` : ""}. Wait or release the claim.`,
      );
    }
    const ours = new Set(
      (held ?? [])
        .filter((h: { mission_id: string | null }) => h.mission_id === missionId)
        .map((h: { path: string }) => h.path),
    );
    let missionTitle: string | null = null;
    {
      const { data: m } = await supabase
        .from("missions")
        .select("title")
        .eq("id", missionId)
        .maybeSingle();
      missionTitle = (m as { title?: string } | null)?.title ?? null;
    }
    // Batch insert new claims instead of sequential per-path inserts (N+1 fix)
    const claimsToInsert = Array.from(paths)
      .filter((path) => !ours.has(path))
      .map((path) => ({
        user_id: userId,
        workspace_id: workspaceId ?? null,
        run_id: runId ?? null,
        mission_id: missionId,
        mission_title: missionTitle,
        repo,
        path,
        status: "held" as const,
      }));
    if (claimsToInsert.length > 0) {
      const { error } = await supabase.from("builder_file_claims").insert(claimsToInsert);
      if (error && !/unique|duplicate/i.test(error.message)) {
        console.error("[studio.commit] batch claim insert failed:", error.message);
      }
    }

    const outcome = await withIdempotency(
      supabase,
      "studio_commit",
      `${changeset.id}:${fingerprintChanges(changes as Array<{ path: string; op: string; new_content: string | null }>)}:${a.message.slice(0, 64)}`,
      userId,
      runId ?? null,
      async () => {
        const defaultBranch = await getDefaultBranch(repo, headers);
        // Parent = the studio branch head if it exists, else default-branch head
        // (and we create the branch from it).
        let parentSha: string;
        const refRes = await fetch(
          `https://api.github.com/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
          { headers },
        );
        if (refRes.ok) {
          parentSha = ((await refRes.json()) as { object: { sha: string } }).object.sha;
        } else {
          const baseRef = await ghJson<{ object: { sha: string } }>(
            `https://api.github.com/repos/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
            headers,
          );
          parentSha = baseRef.object.sha;
          await ghJson(`https://api.github.com/repos/${repo}/git/refs`, headers, {
            method: "POST",
            body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: parentSha }),
          });
        }
        const parentCommit = await ghJson<{ tree: { sha: string } }>(
          `https://api.github.com/repos/${repo}/git/commits/${parentSha}`,
          headers,
        );
        const tree = (changes as { path: string; op: string; new_content: string | null }[]).map(
          (c) =>
            c.op === "delete"
              ? { path: c.path, mode: "100644", type: "blob", sha: null }
              : { path: c.path, mode: "100644", type: "blob", content: c.new_content ?? "" },
        );
        const newTree = await ghJson<{ sha: string }>(
          `https://api.github.com/repos/${repo}/git/trees`,
          headers,
          {
            method: "POST",
            body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
          },
        );
        const commit = await ghJson<{ sha: string; html_url: string }>(
          `https://api.github.com/repos/${repo}/git/commits`,
          headers,
          {
            method: "POST",
            body: JSON.stringify({
              message: `${a.message}\n\nShipped by Supaprod Studio (mission ${missionId.slice(0, 8)})`,
              tree: newTree.sha,
              parents: [parentSha],
            }),
          },
        );
        await ghJson(
          `https://api.github.com/repos/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
          headers,
          { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) },
        );
        await supabase
          .from("studio_changesets")
          .update({
            branch,
            base_sha: parentSha,
            status: changeset.status === "pr_open" ? "pr_open" : "committed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", changeset.id);
        return {
          changeset_id: changeset.id,
          repo,
          branch,
          commit_sha: commit.sha,
          commit_url: commit.html_url,
          files: paths,
        };
      },
    );
    // I1b: record this commit as an atomic revision (the changeset's history
    // trail). Best-effort and only on a FRESH commit, so a cached re-attempt
    // (idempotency replay) never double-records.
    if (!outcome.cached) {
      try {
        const { count } = await supabase
          .from("studio_changeset_revisions")
          .select("id", { count: "exact", head: true })
          .eq("changeset_id", changeset.id);
        await supabase.from("studio_changeset_revisions").insert({
          changeset_id: changeset.id,
          user_id: userId,
          revision_no: (count ?? 0) + 1,
          commit_sha: outcome.result.commit_sha,
          commit_url: outcome.result.commit_url ?? null,
          message: a.message,
          files: (changes as { path: string; op: string }[]).map((c) => ({
            path: c.path,
            op: c.op,
          })),
        });
      } catch (e) {
        console.error("[studio.commit] revision record failed:", e);
      }
    }
    return { ...outcome.result, cached: outcome.cached };
  },
});

/** SEAM-2 (mission 3.6): bounded autonomous CI-fix budget per changeset. */
const CI_FIX_BUDGET = Math.max(1, Number(process.env.CI_FIX_BUDGET ?? 3) || 3);

const ciLogs = def({
  name: "ci.logs",
  description:
    "Builder agent: fetch the FAILING check runs on a PR with their full output detail and job log tails. Read-only. Use to diagnose red CI before staging a fix (github.ci.read only carries 240-char summaries). pr_number is optional: omit it to use this mission's own open PR.",
  category: "read",
  argsSchema: z.object({
    pr_number: z.number().int().min(1).max(10_000_000).optional(),
  }),
  preview: (a) =>
    a.pr_number
      ? `Read failing CI detail on PR #${a.pr_number}`
      : "Read failing CI detail on this mission's PR",
  run: async (a, ctx) => {
    const { token, repo } = await requireGithub(ctx);
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error(`Invalid GitHub repo format: ${repo}`);
    // Finding 32 (SW-7): every run used to fumble this arg once before
    // self-correcting. The mission's own active changeset already carries the
    // PR it opened, so resolve it there when the caller omits pr_number.
    let prNumber = a.pr_number ?? null;
    if (!prNumber && ctx.missionId) {
      const changeset = await getActiveChangeset(ctx.supabase, ctx.missionId);
      prNumber = changeset?.pr_number ?? null;
    }
    if (!prNumber)
      throw new Error("ci.logs: no pr_number given and this mission has no open PR to default to");
    const headers = ghHeaders(token);
    const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, {
      headers,
    });
    if (!prRes.ok)
      throw new Error(`GitHub get-pr ${prRes.status}: ${(await prRes.text()).slice(0, 300)}`);
    const prJson = (await prRes.json()) as { head: { sha: string } };
    const detail = await fetchFailingCiDetail({ token, repo, headSha: prJson.head.sha });
    return {
      pr_number: prNumber,
      head_sha: detail.headSha,
      overall: detail.overall,
      failing_count: detail.failing.length,
      detail: detail.rendered || "No failing checks found at this head.",
    };
  },
});

const studioFixCommit = def({
  name: "studio.fix.commit",
  description:
    "Studio: append staged CI-fix changes to this mission's EXISTING pr_open studio branch. Only valid AFTER a human opened the PR (studio.pr.open) — that prior human gate is why this runs without a fresh gate; the merge gate still holds. Bounded by the changeset's fix budget. For first commits use studio.commit.",
  category: "write",
  argsSchema: z.object({
    message: z.string().min(4).max(280),
  }),
  preview: (a) => `Append CI fix: "${a.message.slice(0, 80)}"`,
  run: async (a, ctx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("studio.fix.commit requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset — nothing to fix");
    if (changeset.status !== "pr_open") {
      throw new Error(
        "studio.fix.commit only appends to a branch whose PR a human already opened. Use studio.commit (operator-gated) instead.",
      );
    }
    const { data: budgetRow } = await supabase
      .from("studio_changesets")
      .select("fix_attempts")
      .eq("id", changeset.id)
      .maybeSingle();
    const attempts = (budgetRow as { fix_attempts?: number } | null)?.fix_attempts ?? 0;
    if (attempts >= CI_FIX_BUDGET) {
      throw new Error(
        `CI fix budget exhausted (${attempts}/${CI_FIX_BUDGET} autonomous attempts). Stop and report; a human decides the next move at the merge gate.`,
      );
    }
    const result = (await studioCommit.run(a, ctx)) as { cached?: boolean };
    // The budget is consumed PER COMMIT by the tool itself (not only by the
    // tick's dispatch), so repeated calls inside one run genuinely trip the
    // cap instead of re-reading a stale count. Cached idempotency replays do
    // not consume budget.
    if (!result?.cached) {
      await supabase
        .from("studio_changesets")
        .update({ fix_attempts: attempts + 1, updated_at: new Date().toISOString() } as never)
        .eq("id", changeset.id);
    }
    return result;
  },
});

// ── Build verification: the four checks that run BEFORE a pull request ──────
//
// Everything above this line either writes code or reads what CI said about it
// afterwards. Nothing read the code itself. These four close that, and every one
// of them is a VERIFICATION action that gates a merge, which is what makes them
// Build's and not Ship's: they are cheap, reversible, and their entire job is to
// be right before anything irreversible happens. Ship's floors (release.publish,
// studio.pr.merge, studio.revert) stay exactly where they are.
//
// The four READ-ONLY ones below read, diff, match and judge; none of them
// executes anything, and each says so in its own description.
//
// SBX-1 (2026-08-03) added the fifth, `studio.checks.run`, which DOES execute, in
// an E2B sandbox behind the `ExecProvider` seam. Until then the only wired backend
// was the connected repo's GitHub Actions CI, which runs after a push, so an agent
// could read a verdict and never produce one: every check cost a push and a CI wait,
// and an agent that must push to learn anything cannot iterate.
//
// The old invariant here read "a tool that claimed to have RUN the test suite would
// be a lie with a green tick on it". That is still exactly right, and it is now
// enforced rather than avoided: `studio.checks.run` reports a real exit code from a
// real process, and when the sandbox itself fails it returns a REFUSAL, never the
// permissive "no CI configured, nothing to gate on" that an empty check list would
// otherwise produce (see execVerdictFromRun in src/lib/exec/provider.ts).

/**
 * Every test file on a ref, for the test plan's "already covered in the repo"
 * arm. Fail-soft by design: an unreadable tree yields [], which over-reports
 * gaps rather than under-reporting them, and a plan that names a test which
 * turns out to exist costs one repo.read.
 */
async function listRepoTestPaths(
  repo: string,
  headers: Record<string, string>,
  ref: string,
): Promise<string[]> {
  try {
    const j = await ghJson<{ tree?: Array<{ path: string; type: string }> }>(
      `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`,
      headers,
    );
    return (j.tree ?? []).filter((e) => e.type === "blob" && isTestPath(e.path)).map((e) => e.path);
  } catch {
    return [];
  }
}

/** The ref a changeset's checks read from: its own branch once it has one. */
async function changesetRef(
  changeset: ChangesetRow,
  repo: string,
  headers: Record<string, string>,
): Promise<string> {
  return changeset.branch ?? (await getDefaultBranch(repo, headers));
}

/**
 * The audit GitHub has already run: open Dependabot alerts for the repo.
 *
 * Honest about not being able to look. 403 means the installed token lacks the
 * `security_events` scope; 404 means Dependabot alerts are switched off for the
 * repo. Neither is a clean bill of health and neither is reported as one.
 */
async function fetchDependabotAlerts(
  repo: string,
  headers: Record<string, string>,
): Promise<{ available: boolean; reason: string | null; alerts: DepAlert[] }> {
  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${repo}/dependabot/alerts?state=open&per_page=100`,
      { headers },
    );
  } catch (e) {
    return {
      available: false,
      reason: e instanceof Error ? e.message.slice(0, 160) : "network error",
      alerts: [],
    };
  }
  if (res.status === 403) {
    return {
      available: false,
      reason: "the connected GitHub credential has no security_events scope",
      alerts: [],
    };
  }
  if (res.status === 404) {
    return {
      available: false,
      reason: "Dependabot alerts are not enabled on this repo",
      alerts: [],
    };
  }
  if (!res.ok) {
    return { available: false, reason: `GitHub ${res.status}`, alerts: [] };
  }
  const raw = (await res.json()) as unknown;
  if (!Array.isArray(raw)) {
    return { available: false, reason: "GitHub returned an unreadable alert list", alerts: [] };
  }
  return {
    available: true,
    reason: null,
    alerts: raw.map(normalizeDependabotAlert).filter((a): a is DepAlert => a !== null),
  };
}

const studioSecretsScan = def({
  name: "studio.secrets.scan",
  description:
    "Studio: scan this mission's STAGED changes for credentials before they reach the repo. Read-only. Matches the platform's own high-confidence secret rules against lines this changeset ADDS (a credential already in the file does not trip it), and reports path, line, and the KIND of secret, never the value. studio.commit enforces this same scan as a hard refusal, so run it while you can still fix a file cheaply.",
  category: "read",
  argsSchema: z.object({}),
  preview: () => "Scan the staged changes for credentials",
  run: async (_a, ctx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("studio.secrets.scan requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset, call studio.stage first");
    const changes = await loadStagedContent(supabase, changeset.id);
    if (!changes.length) throw new Error("changeset has no staged changes to scan");
    const scan = scanStagedChangesForSecrets(changes);
    return {
      changeset_id: changeset.id,
      clean: !scan.blocked,
      findings: scan.findings,
      files_scanned: scan.files_scanned,
      added_lines_scanned: scan.added_lines_scanned,
      truncated: scan.truncated,
      note: scan.blocked
        ? describeStagedSecrets(scan)
        : "No high-confidence credential on any added line. This checks structural credential formats only; it is not a guarantee that nothing sensitive is in the diff.",
    };
  },
});

const studioTestsPlan = def({
  name: "studio.tests.plan",
  description:
    "Studio: work out which tests this changeset still owes. Read-only. Compares every changed source file against the repo's test-file convention and the tests already on the branch, and returns the concrete list of test files that do not exist yet. Call it after staging and stage each gap with studio.stage. It does NOT run tests: nothing here executes, and whether a test passes is decided by the repo's CI after the PR opens (read that with ci.logs).",
  category: "read",
  argsSchema: z.object({}),
  preview: () => "Plan the tests this changeset still owes",
  run: async (_a, ctx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("studio.tests.plan requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset, call studio.stage first");
    const { data: changes } = await supabase
      .from("studio_changes")
      .select("path,op")
      .eq("changeset_id", changeset.id)
      .order("path");
    if (!changes?.length) throw new Error("changeset has no staged changes to plan against");

    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const ref = await changesetRef(changeset, repo, headers);
    const repoTestPaths = await listRepoTestPaths(repo, headers, ref);
    const plan = planChangesetTests(changes as Array<{ path: string; op: string }>, repoTestPaths);
    return {
      changeset_id: changeset.id,
      repo,
      ref,
      gaps: plan.gaps,
      covered: plan.items.filter((i) => i.coverage !== "gap"),
      staged_test_files: plan.staged_test_files,
      not_applicable: plan.not_applicable,
      note: plan.note,
    };
  },
});

/**
 * SBX-1: run this changeset's checks for real, in a sandbox, BEFORE opening a PR.
 *
 * The one tool in this section that executes. It is deliberately `category: "read"`
 * despite running code, because it changes nothing a user can see: a fresh sandbox
 * is created, the changeset's branch is cloned into it, checks run, and the sandbox
 * is destroyed. Nothing is written to the repo, the PR, or the database. Classing it
 * as a write would put it behind an approval gate for an action with no consequence,
 * which is precisely the "queue instead of automation" the governance canon rejects.
 *
 * Availability is honest: with no E2B key configured the seam refuses and says so,
 * rather than returning a green verdict on checks that never ran.
 */
const studioChecksRun = def({
  name: "studio.checks.run",
  description:
    "Studio: actually RUN this changeset's checks (typecheck, tests, lint) in a disposable sandbox and report the real exit codes, before opening a pull request. This is the one build tool that executes: it clones the changeset's branch into a fresh sandbox, runs the checks, and destroys it. Use it to verify a fix before you commit to it, instead of pushing and waiting for CI. If the sandbox cannot run, it returns not-clear-to-merge and says why: it never reports green for checks that did not run.",
  category: "read",
  argsSchema: z.object({
    checks: z
      .array(z.enum(["typecheck", "test", "lint"]))
      .optional()
      .describe("Which checks to run. Defaults to all three."),
  }),
  preview: (a) => `Run ${a.checks?.length ? a.checks.join(", ") : "all"} checks in a sandbox`,
  run: async (a, ctx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("studio.checks.run requires a mission");
    if (!e2bAvailable()) {
      return {
        available: false,
        may_proceed: false,
        reason:
          "No execution sandbox is configured, so these checks cannot be run here. The repo's CI still runs them after a push; read it with ci.logs.",
      };
    }
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset, call studio.stage first");

    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const ref = await changesetRef(changeset, repo, headers);

    // CREDENTIAL HANDLING. The installation token carries WRITE access to the
    // customer's repo, and everything after the clone in this sandbox is UNTRUSTED
    // code: `bun install` runs the repo's postinstall scripts, `bun test` runs its
    // test files. So the token is handed to the clone step alone, as an env the
    // sandbox's shell expands, and it is declared as a secret so any stream that
    // echoes it (git prints the remote URL on a failed clone) is redacted before it
    // reaches this result, the model, or the stored run record.
    const wanted = a.checks?.length ? new Set(a.checks) : null;
    const commands = defaultChecks().filter((c) => !wanted || wanted.has(c.name as never));

    const outcome = await runInE2B({
      setup: withGitToken(defaultSetup(repo, ref), token),
      commands,
      secrets: [token],
    });

    return {
      available: true,
      repo,
      ref,
      changeset_id: changeset.id,
      may_proceed: outcome.verdict.mayProceed,
      overall: outcome.verdict.overall,
      reason: outcome.verdict.reason,
      infra_error: outcome.infraError,
      // Streams are capped upstream; stderr is what an agent needs to fix a failure,
      // and stdout on a PASSING check is noise, so it is dropped for those.
      checks: outcome.results.map((r) => ({
        name: r.name,
        passed: r.exitCode === 0 && !r.timedOut,
        exit_code: r.exitCode,
        duration_ms: r.durationMs,
        timed_out: r.timedOut ?? false,
        stderr: r.stderr || null,
        stdout: r.exitCode === 0 ? null : r.stdout || null,
      })),
    };
  },
});

const studioDepsAudit = def({
  name: "studio.deps.audit",
  description:
    "Studio: audit the repo's dependencies for known vulnerabilities. Read-only. Reads GitHub's own Dependabot alerts (computed from the committed manifests against the GitHub Advisory Database), correlates them with whatever dependency manifest this changeset touches, and reports whether that is a reason not to open the pull request. Reports 'not available' honestly when the repo has Dependabot off or the credential lacks the scope; that is never the same as clean.",
  category: "read",
  argsSchema: z.object({}),
  preview: () => "Audit dependencies for known vulnerabilities",
  run: async (_a, ctx) => {
    const { supabase, missionId } = ctx;
    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);

    let touchedPaths: string[] = [];
    let changesetId: string | null = null;
    if (missionId) {
      const changeset = await getActiveChangeset(supabase, missionId);
      if (changeset) {
        changesetId = changeset.id;
        const { data } = await supabase
          .from("studio_changes")
          .select("path")
          .eq("changeset_id", changeset.id);
        touchedPaths = ((data ?? []) as Array<{ path: string }>).map((r) => r.path);
      }
    }

    const { available, reason, alerts } = await fetchDependabotAlerts(repo, headers);
    const summary = summarizeDepAlerts(alerts);
    const touchesManifest = touchedPaths.some(isDependencyManifest);
    const gate = depsAuditGate({
      available,
      unavailableReason: reason,
      summary,
      touchesManifest,
    });
    return {
      changeset_id: changesetId,
      repo,
      available,
      unavailable_reason: reason,
      summary,
      // The list is capped because a repo with a long tail of low advisories
      // would otherwise crowd the agent's context with things this changeset
      // neither caused nor can fix.
      alerts: alerts
        .slice()
        .sort((a, b) => DEP_SEVERITY_RANK[b.severity] - DEP_SEVERITY_RANK[a.severity])
        .slice(0, 20),
      touches_manifest: touchesManifest,
      may_proceed: gate.mayProceed,
      reason: gate.reason,
      lockfile_note: lockfileDivergenceNote(touchedPaths) || null,
    };
  },
});

const studioReview = def({
  name: "studio.review",
  description:
    "Studio: review this mission's STAGED diff before it becomes a pull request. Read-only and advisory. Runs the deterministic checks (credentials on added lines, forbidden paths, missing test files) and then one reviewer pass over the diff for security, correctness, swallowed errors, scope creep, and convention breaks. Returns a verdict of approve / revise / block / unreviewed with per-file, per-line findings. Call it AFTER studio.commit and BEFORE studio.pr.open, and act on the blockers rather than opening the PR anyway. 'unreviewed' means the reviewer did not run; it is not a pass.",
  // 'planning' + the loop's control-flow handling, matching critic.evaluate: the
  // verdict is advisory and side-effect-free beyond its own row, so gating it
  // behind an approval would put a queue in front of the check that exists to
  // shorten the queue.
  category: "planning",
  argsSchema: z.object({
    intent: z.string().max(4000).optional(),
  }),
  preview: () => "Review the staged diff before opening a pull request",
  run: async (a, ctx) => {
    const { supabase, userId, missionId, workspaceId, runId } = ctx;
    if (!missionId) throw new Error("studio.review requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset, call studio.stage first");

    // Finding 32's lesson, applied ahead of time: the mission already knows what
    // it was asked to do, so an omitted `intent` resolves from the changeset
    // rather than costing a step to self-correct.
    let intent = a.intent?.trim() || "";
    if (!intent) {
      const { data: m } = await supabase
        .from("missions")
        .select("title,goal")
        .eq("id", missionId)
        .maybeSingle();
      const mission = m as { title?: string | null; goal?: string | null } | null;
      intent = [changeset.title, mission?.title, mission?.goal]
        .map((s) => (s ?? "").trim())
        .filter(Boolean)
        .join("\n");
    }

    // The repo-side facts the deterministic pass needs. Both fail soft: a
    // GitHub outage degrades the review to the diff-only checks rather than
    // throwing away the whole review.
    let repoTestPaths: string[] = [];
    let dependencyNote: string | null = null;
    try {
      const { token, repo } = await requireGithub(ctx);
      const headers = ghHeaders(token);
      const ref = await changesetRef(changeset, repo, headers);
      repoTestPaths = await listRepoTestPaths(repo, headers, ref);
      const { data: pathRows } = await supabase
        .from("studio_changes")
        .select("path")
        .eq("changeset_id", changeset.id);
      dependencyNote =
        lockfileDivergenceNote(((pathRows ?? []) as Array<{ path: string }>).map((r) => r.path)) ||
        null;
    } catch (e) {
      console.error("[studio.review] repo context unavailable:", e);
    }

    const result = await runChangesetReview(supabase, userId, {
      changesetId: changeset.id,
      workspaceId,
      runId,
      intent: intent || null,
      repoTestPaths,
      dependencyNote,
    });
    return {
      changeset_id: changeset.id,
      verdict: result.review.verdict,
      summary: result.review.summary,
      findings: result.review.findings,
      files_reviewed: result.review.files_reviewed,
      reviewer_model: result.review.reviewer_model,
      may_open_pr: result.gate.mayOpenPr,
      reason: result.gate.reason,
      // Stated rather than implied: without the changeset column this verdict
      // exists only in this run's tool trail. See BUILD-NEEDS-MIGRATION.md.
      persisted: result.persisted,
      model_error: result.model_error,
    };
  },
});

const studioPrOpen = def({
  name: "studio.pr.open",
  description:
    "Studio: open a multi-file pull request from the changeset's studio/* branch. Operator-gated. Distinct from the legacy single-file github.pr.open. Call AFTER studio.commit.",
  category: "write",
  argsSchema: z.object({
    title: z.string().min(4).max(280),
    body: z.string().min(4).max(60_000),
  }),
  preview: (a) => `Open Studio PR: "${a.title.slice(0, 80)}"`,
  run: async (a, ctx) => {
    const { supabase, userId, missionId, runId } = ctx;
    if (!missionId) throw new Error("studio.pr.open requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset — stage and commit first");
    if (!changeset.branch) throw new Error("changeset has no branch — call studio.commit first");
    if (changeset.pr_number && changeset.pr_url) {
      return {
        changeset_id: changeset.id,
        pr_number: changeset.pr_number,
        pr_url: changeset.pr_url,
        cached: true,
      };
    }
    const { token, repo, actorLabel } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const outcome = await withIdempotency(
      supabase,
      "studio_pr",
      changeset.id,
      userId,
      runId ?? null,
      async () => {
        const defaultBranch = await getDefaultBranch(repo, headers);
        const { count } = await supabase
          .from("studio_changes")
          .select("id", { count: "exact", head: true })
          .eq("changeset_id", changeset.id);
        const body = `${a.body.trim()}\n\n_Opened by Supaprod Studio, multi-file changeset (${count ?? "?"} file${(count ?? 0) === 1 ? "" : "s"}), approval-gated · acting as ${actorLabel}._`;
        const pr = await ghJson<{ number: number; html_url: string }>(
          `https://api.github.com/repos/${repo}/pulls`,
          headers,
          {
            method: "POST",
            body: JSON.stringify({
              title: a.title,
              body,
              head: changeset.branch,
              base: defaultBranch,
              maintainer_can_modify: true,
            }),
          },
        );
        await supabase
          .from("studio_changesets")
          .update({
            status: "pr_open",
            pr_url: pr.html_url,
            pr_number: pr.number,
            updated_at: new Date().toISOString(),
          })
          .eq("id", changeset.id);
        return {
          changeset_id: changeset.id,
          repo,
          branch: changeset.branch,
          pr_number: pr.number,
          pr_url: pr.html_url,
        };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

const studioPrMerge = def({
  name: "studio.pr.merge",
  description:
    "Studio: merge the changeset's pull request (squash by default) and close the loop in-platform. Review-gated AND hard-gated on CI: the merge is refused while CI is red or still running, so request it only once github.ci.read reports success (or the repo has no CI). Releases the mission's file claims.",
  category: "write",
  argsSchema: z.object({
    method: z.enum(["squash", "merge", "rebase"]).optional(),
  }),
  preview: (a) => `Merge Studio PR (${a.method ?? "squash"})`,
  run: async (a, ctx) => {
    const { supabase, userId, missionId, runId } = ctx;
    if (!missionId) throw new Error("studio.pr.merge requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset?.pr_number) throw new Error("no open Studio PR on this mission");
    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);

    // J2 — CI-green merge gate. studio.pr.merge is review-gated, but we also
    // refuse at the Supaprod level when CI is red or still running, so a clean
    // run is the only path to ship (independent of whether the repo configures
    // GitHub required checks). Read fresh so we never merge on a stale green;
    // kept outside withIdempotency so a blocked attempt re-checks each time and
    // only a green merge is cached. Verdict logic shared with github.ci.read.
    /* The PR's BASE branch, carried out of the CI-gate block below.
     *
     * The merge is the moment a spec can honestly be called shipped, and
     * stampSpecShippedOnStudioMerge refuses to stamp unless the merge landed on
     * the repo's DEFAULT branch. That check needs the base ref, which is only
     * read inside the gate's own scope, so it is captured here rather than
     * paying for a second GitHub round trip in the merge body. */
    let prBaseRef: string | null = null;
    {
      const prRes = await fetch(
        `https://api.github.com/repos/${repo}/pulls/${changeset.pr_number}`,
        { headers },
      );
      if (!prRes.ok)
        throw new Error(`GitHub get-pr ${prRes.status}: ${(await prRes.text()).slice(0, 200)}`);
      const prJson = (await prRes.json()) as {
        head: { sha: string };
        base: { ref: string };
        merged: boolean;
        state: string;
      };
      prBaseRef = prJson.base?.ref ?? null;
      // A closed-but-unmerged PR can't be merged; fail clearly instead of
      // falling through to a misleading "conflicts or pending checks" 405.
      if (prJson.state !== "open" && !prJson.merged)
        throw new Error(
          `MergeBlocked: the pull request is ${prJson.state}, not open. Reopen it or open a fresh one.`,
        );
      if (!prJson.merged) {
        const headSha = prJson.head.sha;
        const [checksRes, statusRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo}/commits/${headSha}/check-runs?per_page=100`, {
            headers,
          }),
          fetch(`https://api.github.com/repos/${repo}/commits/${headSha}/status`, { headers }),
        ]);
        if (!checksRes.ok) throw new Error(`GitHub check-runs ${checksRes.status} (merge gate)`);
        if (!statusRes.ok)
          throw new Error(`GitHub combined-status ${statusRes.status} (merge gate)`);
        const checksJson = (await checksRes.json()) as {
          total_count?: number;
          check_runs?: Array<{ status: string; conclusion: string | null }>;
        };
        const statusJson = (await statusRes.json()) as {
          statuses?: Array<{ state: string }>;
        };
        const runs = checksJson.check_runs ?? [];
        // Fail safe: if more check-runs exist than we fetched in one page, we
        // cannot confirm they are all green, so refuse rather than risk a false
        // allow (a missed failing check beyond the page would read as success).
        if ((checksJson.total_count ?? runs.length) > runs.length)
          throw new Error(
            "MergeBlocked: too many CI checks to verify in one page. Confirm CI is green and merge from GitHub.",
          );
        const ciChecks = [
          ...runs.map((c) => ({
            status: c.status,
            conclusion: c.conclusion ?? null,
          })),
          ...(statusJson.statuses ?? []).map((s) => ({
            status: s.state === "pending" ? "in_progress" : "completed",
            conclusion:
              s.state === "pending" ? null : s.state === "success" ? "success" : "failure",
          })),
        ];
        const gate = mergeReadinessFromCi(overallFromChecks(ciChecks));
        if (!gate.allowed) throw new Error(`MergeBlocked: ${gate.reason}`);

        // P4-GATE: eval-regression merge gate (the J2 pattern applied to the
        // eval trend instead of CI). Refuse the merge if the latest completed
        // eval run for any suite is >=10 points below the prior one. Evals run
        // on a schedule, so this reads the already-measured trend; it never
        // triggers a run. Explicitly user-scoped (and RLS-scoped), read-only,
        // and degrades to allowed when no suite has a two-run history. The
        // operator can still merge from GitHub directly; this gates only the
        // agent's studio.pr.merge tool.
        const { data: evalRunRows } = await supabase
          .from("eval_runs")
          .select("suite_id,avg_score,created_at")
          .eq("user_id", userId)
          .eq("status", "completed")
          .not("avg_score", "is", null)
          .order("created_at", { ascending: false })
          .limit(80);
        const latestTwoBySuite = new Map<string, number[]>();
        for (const r of evalRunRows ?? []) {
          const sid = (r as { suite_id: string | null }).suite_id;
          if (!sid) continue;
          const arr = latestTwoBySuite.get(sid) ?? [];
          if (arr.length < 2) {
            arr.push(Number((r as { avg_score: number | string | null }).avg_score));
            latestTwoBySuite.set(sid, arr);
          }
        }
        const pairedSuiteIds = [...latestTwoBySuite.entries()]
          .filter(([, v]) => v.length === 2)
          .map(([id]) => id);
        if (pairedSuiteIds.length > 0) {
          const { data: suiteRows } = await supabase
            .from("eval_suites")
            .select("id,name")
            .eq("user_id", userId)
            .in("id", pairedSuiteIds);
          const nameById = new Map(
            (suiteRows ?? []).map((s) => [
              (s as { id: string }).id,
              (s as { name: string | null }).name ?? "an eval suite",
            ]),
          );
          const pairs: SuiteScorePair[] = pairedSuiteIds.map((id) => {
            const [latest, prior] = latestTwoBySuite.get(id)!;
            return { suite_name: nameById.get(id) ?? "an eval suite", latest, prior };
          });
          const evalGate = evalRegressionReadiness(pairs);
          if (!evalGate.allowed) throw new Error(`MergeBlocked: ${evalGate.reason}`);
        }
      }
    }

    const outcome = await withIdempotency(
      supabase,
      "studio_merge",
      changeset.id,
      userId,
      runId ?? null,
      async () => {
        const res = await fetch(
          `https://api.github.com/repos/${repo}/pulls/${changeset.pr_number}/merge`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ merge_method: a.method ?? "squash" }),
          },
        );
        if (!res.ok) {
          throw new Error(
            `GitHub merge ${res.status}: ${(await res.text()).slice(0, 300)} — the PR may have conflicts or pending required checks.`,
          );
        }
        const j = (await res.json()) as { sha: string; merged: boolean };
        await supabase
          .from("studio_changesets")
          .update({ status: "merged", updated_at: new Date().toISOString() })
          .eq("id", changeset.id);

        /* THE LOOP USED TO END HERE, and that is why the moat never filled.
         *
         * The chain is spec, build, merge, and then nothing: no writer ever
         * stamped prds.shipped_at in practice, so no outcome ever entered the
         * settle queue, so rememberOutcome was never called, so agent_memory
         * holds ZERO rows of kind "outcome" and every precedent lookup returns
         * empty. loadDecisionPrecedent has fired 71 times and found nothing all
         * 71. The landing page's "past calls surface before this one is made"
         * was false for exactly this reason.
         *
         * The other two writers cannot cover a real customer. checkPrdShipped
         * needs a linked GitHub issue to close, and the promote path refuses
         * without a preview deployment row that ci-poll-tick only creates for
         * Supaprod-managed repos. On a customer's own repo there was NO
         * reachable writer at all: 16 merged changesets, 0 shipped specs.
         *
         * Merge is the honest trigger, and it is strictly STRONGER than the
         * writer this product already trusts: checkPrdShipped stamps when an
         * issue closes, which also happens for wontfix and duplicate. Here
         * GitHub has confirmed merged:true with a SHA onto the default branch,
         * past the CI-green gate. The stamper refuses everything short of that
         * and never overwrites an existing shipped_at, so a deploy that already
         * recorded a truer moment keeps it.
         *
         * Best effort by design: the merge has happened and must stand even if
         * this bookkeeping write fails. It is awaited so a failure is observable
         * rather than a floating promise. */
        try {
          await stampSpecShippedOnStudioMerge(supabase, {
            changesetId: changeset.id,
            userId,
            mergeConfirmed: j.merged,
            mergeSha: j.sha,
            baseBranch: prBaseRef,
            defaultBranch: await getDefaultBranch(repo, headers),
          });
        } catch (e) {
          void recordErrorEvent(e, {
            surface: "studio.pr.merge.ship-stamp",
            failure_kind: "ship_stamp_failed",
            user_id: userId,
          });
        }
        await supabase
          .from("builder_file_claims")
          .update({
            status: "released",
            released_at: new Date().toISOString(),
            released_reason: "studio_merge",
          })
          .eq("mission_id", missionId)
          .eq("status", "held");
        return {
          changeset_id: changeset.id,
          pr_number: changeset.pr_number,
          pr_url: changeset.pr_url,
          merged: j.merged,
          merge_sha: j.sha,
        };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

/**
 * Studio: sync the changeset's PR branch with the default branch, the
 * agent-callable equivalent of GitHub's "Update branch" button. Merges the
 * default branch INTO the studio/* branch via the Merge-a-branch endpoint;
 * it never touches files, so it needs no path allow-listing
 * (assertStudioPathAllowed is irrelevant here, nothing is staged or
 * written through the Git Data API). Use case: the base branch moved on
 * (another PR landed) and the PR's CI run is now stale/out of date. This
 * re-triggers a fresh CI run on the updated branch without a code change.
 */
const studioSyncBranch = def({
  name: "studio.sync_branch",
  description:
    "Studio: sync this mission's changeset branch with the repo's default branch, the same effect as clicking GitHub's 'Update branch' button on a PR. Use this when a stale or out-of-date CI check needs re-triggering because the default branch moved on since the PR branch was created (e.g. another PR merged first). Merges the default branch INTO the changeset branch via the GitHub Merge API; touches no files and stages nothing, so it never conflicts with restricted paths like .github/workflows/*. If the branch is already up to date, reports that as success, not an error.",
  category: "write",
  argsSchema: z.object({}),
  preview: () => "Sync PR branch with the default branch (re-trigger CI)",
  run: async (_a, ctx) => {
    const { supabase, missionId } = ctx;
    if (!missionId) throw new Error("studio.sync_branch requires a mission");
    const changeset = await getActiveChangeset(supabase, missionId);
    if (!changeset) throw new Error("no active changeset, call studio.stage first");
    if (!changeset.branch) throw new Error("changeset has no branch, call studio.commit first");

    const { token, repo } = await requireGithub(ctx);
    const headers = ghHeaders(token);
    const defaultBranch = await getDefaultBranch(repo, headers);

    const res = await fetch(`https://api.github.com/repos/${repo}/merges`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base: changeset.branch,
        head: defaultBranch,
        commit_message: `Sync ${changeset.branch} with ${defaultBranch} to re-trigger CI, Supaprod Studio`,
      }),
    });

    // 204 = base already contains head; GitHub's own "already up to date"
    // signal, not a failure. Treat it as a clean success, matching the
    // "Update branch" button's behavior when there is nothing to update.
    if (res.status === 204) {
      return {
        changeset_id: changeset.id,
        repo,
        branch: changeset.branch,
        base: defaultBranch,
        synced: false,
        message: `${changeset.branch} is already up to date with ${defaultBranch}, nothing to sync.`,
      };
    }
    if (res.status === 409) {
      throw new Error(
        `MergeConflict: syncing ${changeset.branch} with ${defaultBranch} hit a conflict that needs manual resolution on GitHub.`,
      );
    }
    if (!res.ok) {
      throw new Error(`GitHub merge ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    const j = (await res.json()) as { sha?: string; html_url?: string };
    return {
      changeset_id: changeset.id,
      repo,
      branch: changeset.branch,
      base: defaultBranch,
      synced: true,
      merge_sha: j.sha ?? null,
      merge_url: j.html_url ?? null,
      message: `Synced ${changeset.branch} with the latest ${defaultBranch}. CI will re-run on the new head commit.`,
    };
  },
});

/**
 * K2: roll back a merged release by synthesizing an inverse changeset.
 * The revert flows through the existing commit → PR → CI gate → merge rails.
 * Review-gated (operator approval required). Returns the revert mission ID.
 */
const studioRevert = def({
  name: "studio.revert",
  description:
    "Studio: roll back a merged release by synthesizing an inverse changeset. The revert changeset flows through the existing commit → PR → CI gate → merge rails. Review-gated (operator approval required). Returns the revert mission ID and PR URL.",
  category: "write",
  argsSchema: z.object({
    changesetId: z.string().uuid(),
    reason: z.string().min(1).max(500),
  }),
  preview: (a) =>
    `Roll back changeset ${a.changesetId.slice(0, 8)} (reason: ${a.reason.slice(0, 40)})`,
  run: async (a, ctx) => {
    const { supabase, userId, missionId, runId } = ctx;
    if (!missionId) throw new Error("studio.revert requires a mission (dispatch via Studio)");

    // Wrap in idempotency to prevent duplicate rollback submissions
    const outcome = await withIdempotency(
      supabase,
      "studio_revert",
      a.changesetId,
      userId,
      runId ?? null,
      async () => {
        const { rollbackId, revertChangesetId, revertMissionId } = await runRollbackRelease(
          supabase,
          userId,
          a,
        );
        return { rollbackId, revertChangesetId, revertMissionId };
      },
    );
    return { ...outcome.result, cached: outcome.cached };
  },
});

// ── PM lifecycle tools ────────────────────────────────────────────────
const DRAFT_MODEL = "google/gemini-2.5-flash";

/**
 * prd.link_issue — write the URL of the GitHub issue opened for a PRD back
 * onto the PRD row. Closes the loop on the Discover→Define→Plan slice so the
 * PRD view links straight to the engineering ticket. Idempotent (no-op if
 * already set to the same URL).
 */
const prdLinkIssue = def({
  name: "prd.link_issue",
  description:
    "Attach a GitHub issue URL to a PRD. Call this immediately after github.issue.create so the PRD links back to the engineering ticket. Pass the prd_id and the html_url returned by github.issue.create.",
  category: "write",
  argsSchema: z.object({
    prd_id: z.string().uuid(),
    issue_url: z.string().url().max(500),
  }),
  preview: (a) => `Link PRD ${a.prd_id.slice(0, 8)} → ${a.issue_url}`,
  run: async (a, { supabase, userId }) => {
    const { data, error } = await supabase
      .from("prds")
      .update({ github_issue_url: a.issue_url })
      .eq("id", a.prd_id)
      .eq("user_id", userId)
      .select("id,title,github_issue_url")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
});

function safeJson<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    const m = s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

/**
 * research.synthesize — Discovery stage.
 * Pulls recent ungrouped signals, asks the model to cluster them into themes,
 * writes new `themes` rows and links the source signals via theme_id.
 */
const researchSynthesize = def({
  name: "research.synthesize",
  description:
    "Cluster recent user-research signals into themes. Reads signals (optionally filtered by tag/sentiment), uses AI to group them, writes themes and links signals. Use at the start of Discover→Plan to turn raw feedback into themes.",
  category: "write",
  argsSchema: z.object({
    lookback_days: z.number().int().min(1).max(180).optional(),
    max_signals: z.number().int().min(5).max(200).optional(),
    tag: z.string().max(40).optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    only_unclustered: z.boolean().optional(),
  }),
  preview: (a) =>
    `Synthesize themes from last ${a.lookback_days ?? 30}d of signals${a.tag ? ` · #${a.tag}` : ""}`,
  run: async (a, { supabase, userId, traceId, runId, agentSlug }) => {
    const days = a.lookback_days ?? 30;
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    let q = supabase
      .from("signals")
      .select("id,title,content,source,sentiment,tags,theme_id,workspace_id")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(a.max_signals ?? 60);
    if (a.sentiment) q = q.eq("sentiment", a.sentiment);
    if (a.tag) q = q.contains("tags", [a.tag]);
    if (a.only_unclustered !== false) q = q.is("theme_id", null);
    const { data: signals, error } = await q;
    if (error) throw new Error(error.message);
    if (!signals || signals.length < 2)
      return { themes_created: 0, signals_linked: 0, reason: "not enough signals to cluster" };

    const corpus = signals
      .map(
        (s, i) =>
          `[${i}] (${s.sentiment ?? "n/a"}) ${s.title ? s.title + " — " : ""}${(s.content ?? "").slice(0, 400)}`,
      )
      .join("\n");
    const res = await callModel(supabase, userId, {
      surface: "discovery",
      surface_ref: "research.synthesize",
      model: DRAFT_MODEL,
      traceId: traceId ?? null,
      runId: runId ?? null,
      responseFormat: "json_object",
      messages: [
        {
          role: "system",
          content:
            'You cluster product-research signals into THEMES. Return strict JSON: {"themes":[{"title":string,"summary":string,"severity":1-5,"confidence":0..1,"signal_indices":number[]}]}. Aim for 2-6 cohesive themes. Each signal_indices references the [n] tag in the input. Never invent indices.',
        },
        { role: "user", content: corpus },
      ],
    });
    const rawJson = res.json ?? safeJson(res.output);
    const themes =
      extractArrayField<{
        title: string;
        summary: string;
        severity?: number;
        confidence?: number;
        signal_indices?: number[];
      }>(rawJson, "themes") ?? [];
    if (!themes.length)
      return { themes_created: 0, signals_linked: 0, reason: "model returned no themes" };

    const themeIds: string[] = [];
    let created = 0,
      linked = 0;
    for (const t of themes) {
      const idxs = (t.signal_indices ?? []).filter(
        (i) => Number.isInteger(i) && i >= 0 && i < signals.length,
      );
      if (!idxs.length) continue;
      const ws = signals[idxs[0]].workspace_id;
      const { data: themeRow, error: tErr } = await supabase
        .from("themes")
        .insert({
          user_id: userId,
          workspace_id: ws,
          title: t.title.slice(0, 200),
          summary: (t.summary ?? "").slice(0, 4000),
          severity: Math.min(5, Math.max(1, Math.round(t.severity ?? 3))),
          confidence: Math.min(1, Math.max(0, Number(t.confidence ?? 0.6))),
          frequency: idxs.length,
        })
        .select("id")
        .single();
      if (tErr || !themeRow) continue;
      created++;
      // SEAM-1: theme creation event, attributed to the acting agent.
      await recordStageEvent(supabase, {
        entityType: "theme",
        entityId: themeRow.id,
        to: "new",
        actor: agentSlug ?? "system",
        workspaceId: ws,
        userId,
      });
      const sigIds = idxs.map((i) => signals[i].id);
      const { error: uErr, count } = await supabase
        .from("signals")
        .update({ theme_id: themeRow.id }, { count: "exact" })
        .in("id", sigIds)
        .eq("user_id", userId);
      if (!uErr) linked += count ?? sigIds.length;
      // Carried out with the count so the spine driver can file these themes
      // against the track that asked for them. It reads a tool's own reported
      // return value, never a query for what appeared lately, so a tool that
      // returns only a count is invisible to it (src/lib/spine/attach.ts).
      themeIds.push(themeRow.id as string);
    }
    return {
      themes_created: created,
      theme_ids: themeIds,
      signals_linked: linked,
      model: DRAFT_MODEL,
    };
  },
});

/**
 * prd.draft — Define stage.
 * Takes an opportunity_id OR a brief. With an opportunity it pulls the
 * opportunity + linked theme + top signals; with a brief it drafts from the
 * words the station was given. Either way it asks the model to draft a
 * structured PRD and writes a `prds` row in draft status.
 *
 * THE DEFINE STATION HAD NO DOOR FOR WORK THAT SKIPPED DECIDE.
 *
 * `opportunity_id` used to be REQUIRED here, and this is the only spec-creating
 * tool in the registry — while no tool in the registry can create an
 * opportunity (all eight `.from("opportunities")` calls in this file are SELECT
 * or UPDATE). So a track that entered mid-lifecycle with Decide waived, which is
 * exactly the shape "the seven stations are the full path, not the only path"
 * asks for, was briefed to call a tool it structurally could not satisfy. Live
 * consequence, measured: prd-writer had 34 `completed_with_failures` runs
 * against tracks and `spine_track_members` held ZERO rows of artifact_kind
 * 'prd' across all 43 tracks. Plan burned its step budget and filed nothing.
 *
 * WHAT IT DID INSTEAD — re-measured 2026-08-06, because the first draft of this
 * paragraph asserted under a "measured" heading an outcome the database does not
 * contain. Those 34 runs span 2026-08-04 to 2026-08-05 and the newest `prds` row
 * is 2026-07-30, so not one spec was written in the window. The model invented
 * uuids to satisfy the required argument — three distinct ones across the 34 runs
 * (ae60bdef…, fa95b9b2…, 81d5aa2d…) — and not one of them matches any row in
 * `opportunities`, `spine_tracks`, `missions`, `themes` or `prds`. All 21
 * `tool_calls` rows for `prd.draft` are seed rows and none carries an
 * `opportunity_id` argument, so no invented id ever reached the read below —
 * and that absence really is evidence here, because a REFUSED tool call still
 * writes its row, with its args and `ok:false` (src/lib/ai/loop.server.ts:1336).
 * The runs died on the step limit before the call went out at all. A
 * guess that HAD landed on a live bet would have bound the spec to an unrelated
 * one and let `learning.record` move that bet's confidence — that is the hazard a
 * required argument with no door creates, and it is written here as a hazard
 * because it is not in the data.
 *
 * The brief path mirrors `generatePrd` (src/lib/discovery.functions.ts:2449-2557),
 * which has taken `opportunity_id` OR `brief` for as long as it has existed and
 * is the human door onto the same shape. `stationGoal` already threads the
 * track's title and origin into the Define prompt
 * (src/lib/spine/driver.ts:354-387), so the agent has the words to compose one.
 *
 * WHAT A SPEC WITH NO BET COSTS AT LEARN, checked before this was widened rather
 * than assumed, because trading a dead end for a silent one is not an
 * improvement:
 *   - IT IS SETTLEABLE. `applyOutcome` guards every bet-dependent step on
 *     `if (prd.opportunity_id)` (src/lib/outcome.functions.ts:497), passes
 *     `?? null` into rememberOutcome (:634), inferSupersession (:710) and
 *     inferDirectEdge (:730), and skips the theme-support count when there is no
 *     theme (:768). Nothing on that path requires a bet.
 *   - IT REACHES THE DESK. `listPendingOutcomes` selects on `outcome is null`
 *     plus `shipped_at`, never on a bet (:1130-1153), and reads the bet as
 *     optional (:1320). `SettlePanel` says "No bet is linked to this spec, so
 *     settling it moves no priority" before the verdict and "No bet was linked,
 *     so no priority moved" after it (src/components/learn/SettlePanel.tsx:920,998),
 *     and the settle sweep states the same fact (src/lib/ai/outcome-review.ts:420).
 *   - IT REACHES THE MOAT. rememberOutcome's `prdId` is what gates the outcome
 *     memory, and a brief-drafted spec has one.
 *   - LIVE SHAPE, not a new one: 39 of 81 prds already carry opportunity_id
 *     null, 21 of them shipped and all 7 settled specs in the database are
 *     null-bet ones. This widening files the shape the product already stores.
 *
 * THE ONE THING IT DOES LOSE, stated because it is real: the learning written
 * against such a spec carries opportunity_id null, and /decide derives a
 * learning's theme THROUGH the bet (the `opportunity:opportunities(theme_id)`
 * embed at src/lib/outcome.functions.ts:1711). So the verdict is recorded,
 * remembered and visible on /learn, and it does not re-rank new bets on the same
 * evidence, because there is no evidence cluster to re-rank against. That is a
 * smaller loss than a station that cannot file at all, and it is the same loss
 * the human brief path has always carried.
 */
const prdDraft = def({
  name: "prd.draft",
  description:
    "Draft a spec, from an opportunity or from a brief. Pass opportunity_id when a bet already exists: it reads the opportunity, its theme, and supporting signals. Pass brief instead when this work entered mid-lifecycle and no bet was ever filed — say what the work is and why it exists, in the words of the job you were given. At least one of the two is required, and if you pass both the opportunity is used and the brief is ignored. Nothing in this toolset creates an opportunity, so do not stall waiting for one, never pass an id of another kind in its place, and never invent a uuid to fill the field — pass brief instead. Writes a draft spec with problem, goals, non-goals, user stories, success metrics, and risks.",
  category: "write",
  /**
   * Both fields are optional here and the either/or is enforced in `run`, which
   * is the same choice `studio.stage` makes for its op-conditional field: a
   * `.refine()` would wrap this in a ZodEffects whose constraint is invisible in
   * the JSON Schema the provider is handed (src/lib/ai/tool-schemas.server.ts:39),
   * so the model would gain nothing and the thrown message would say less.
   */
  argsSchema: z.object({
    opportunity_id: z.string().uuid().optional(),
    brief: z.string().max(4000).optional(),
    title: z.string().max(280).optional(),
    audience: z.string().max(200).optional(),
  }),
  preview: (a) =>
    a.opportunity_id
      ? `Draft spec for opportunity ${a.opportunity_id.slice(0, 8)}${a.title ? ` — "${a.title}"` : ""}`
      : `Draft spec from a brief, with no bet behind it${a.title ? ` — "${a.title}"` : ""}`,
  run: async (a, { supabase, userId, traceId, runId, agentSlug, workspaceId }) => {
    const brief = a.brief?.trim() ?? "";
    if (!a.opportunity_id && !brief) {
      throw new Error(
        "prd.draft needs either opportunity_id, the bet this spec serves, or brief, what the work is and why it exists when no bet was ever filed. Nothing in this registry creates an opportunity, so pass a brief rather than trying to make one.",
      );
    }

    type OppRow = {
      id: string;
      title: string;
      problem: string | null;
      target_user: string | null;
      hypothesis: string | null;
      theme_id: string | null;
      workspace_id: string | null;
      product_id: string | null;
    };
    let opp: OppRow | null = null;
    if (a.opportunity_id) {
      const { data, error: oErr } = await supabase
        .from("opportunities")
        .select(
          "id,title,problem,target_user,hypothesis,impact,confidence,ease,theme_id,workspace_id,product_id",
        )
        .eq("id", a.opportunity_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (oErr) throw new Error(oErr.message);
      /* WRITTEN FOR THE READER IT ACTUALLY HAS, which is a model, not a person.
       * "opportunity not found" told the agent nothing it could act on, and the
       * measured failure above is precisely this: three invented uuids across 34
       * runs, matching no row of any kind. So name the likely mistake and name the
       * door, because the door now exists — retrying with another guessed id is the
       * one response that cannot work, and nothing in this registry can create the
       * bet the agent is looking for. */
      if (!data)
        throw new Error(
          `No opportunity ${a.opportunity_id} exists for this user. Do not retry with a different id: if you were not handed a real bet id, you cannot invent one and nothing in this toolset creates one. Call prd.draft again with \`brief\` instead — what the work is and why it exists — and leave opportunity_id out.`,
        );
      opp = data;
    }

    let themeCtx = "";
    if (opp?.theme_id) {
      const { data: th } = await supabase
        .from("themes")
        .select("title,summary,severity,frequency")
        .eq("id", opp.theme_id)
        .maybeSingle();
      if (th)
        themeCtx = `Theme: ${th.title}\n${th.summary}\n(severity ${th.severity}, frequency ${th.frequency})`;
    }
    let signalCtx = "";
    if (opp?.theme_id) {
      const { data: sigs } = await supabase
        .from("signals")
        .select("title,content,sentiment")
        .eq("theme_id", opp.theme_id)
        .limit(8);
      if (sigs?.length) {
        signalCtx =
          "Supporting signals:\n" +
          sigs
            .map(
              (s) =>
                `- (${s.sentiment ?? "n/a"}) ${s.title ? s.title + ": " : ""}${(s.content ?? "").slice(0, 240)}`,
            )
            .join("\n");
      }
    }

    const res = await callModel(supabase, userId, {
      surface: "prd",
      // "brief" on the no-bet path, the same surface_ref generatePrd uses for it
      // (src/lib/discovery.functions.ts:2640), so spend on the two paths stays
      // tellable apart in ai_events without a join.
      surface_ref: opp ? opp.id : "brief",
      model: DRAFT_MODEL,
      traceId: traceId ?? null,
      runId: runId ?? null,
      messages: [
        {
          role: "system",
          content:
            "You are a senior product manager. Write a concise, decision-ready spec in Markdown with these sections: ## Problem, ## Target user, ## Goals, ## Non-goals, ## User stories, ## Solution sketch, ## Success metrics, ## Risks & open questions. Be specific and grounded in the provided context. Do not invent metrics.",
        },
        {
          role: "user",
          content: (opp
            ? [
                `Opportunity: ${opp.title}`,
                `Problem: ${opp.problem || "(not specified)"}`,
                opp.target_user ? `Target user: ${opp.target_user}` : "",
                opp.hypothesis ? `Hypothesis: ${opp.hypothesis}` : "",
                a.audience ? `Audience override: ${a.audience}` : "",
                themeCtx,
                signalCtx,
              ]
            : [
                `The work, and why it exists:\n${brief}`,
                a.audience ? `Audience: ${a.audience}` : "",
                // Said out loud so the model does not invent a bet to anchor to.
                // It has no theme and no signals here; grounding it in the brief
                // is the whole job.
                "No prior bet was filed for this work, so there is no ICE score, theme or signal set behind it. Ground the spec in the brief above and nothing else.",
              ]
          )
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
    });
    const body = res.output?.trim();
    if (!body) throw new Error("model returned empty PRD body");

    /** The bet's title when there is one; otherwise the brief's first sentence,
     *  the same heuristic generatePrd falls back to (discovery.functions.ts:2583-2586).
     *  Deterministic on purpose: a second model call to name a spec is a cost
     *  the Define station's step budget has already proven it cannot spare. */
    const derived = opp
      ? `Spec: ${opp.title}`
      : (brief.split(/[\n.!?]/)[0] ?? "").trim().slice(0, 120) || "Untitled spec";

    /** STAMP THE TENANT OR REFUSE BY NAME. DO NOT MAKE THIS KEY CONDITIONAL AGAIN,
     *  and do not "simplify" it to a plain null either — here is why both fail.
     *
     *  Verified in the live schema 2026-08-06: `prds.workspace_id` is NOT NULL with
     *  default `current_user_default_workspace()`. That default is
     *  `SELECT ensure_user_default_workspace(auth.uid())`, and
     *  `ensure_user_default_workspace` opens with `IF _user_id IS NULL THEN RETURN
     *  NULL`. So the default only fills for a request that carries a JWT. An
     *  explicit null is refused always; an OMITTED key is refused too whenever
     *  `auth.uid()` is absent.
     *
     *  THE EARLIER COMMENT HERE GOT THE RULE RIGHT AND THE CALLER WRONG. `generatePrd`
     *  really does omit the key and really is filled by the default
     *  (discovery.functions.ts:2742-2753) — it is a `createServerFn` behind
     *  requireSupabaseAuth, so a browser is on the other end. `prd.draft` is an AGENT
     *  tool: the spine driver runs it from src/routes/api/public/hooks/track-tick.ts
     *  on `supabaseAdmin`, the service role, where `auth.uid()` is null. On that path
     *  omitting the key buys a NOT NULL rejection, not a fill. That is what
     *  tenancy-stamp.test.ts in this directory exists to say, after the 2026-08-03
     *  outage where two agent tools were left leaning on this same default.
     *
     *  The omit branch could not even have been the lucky one. When the caller passes
     *  no workspace, `ctx.workspaceId` is itself the result of
     *  `current_user_default_workspace()` (src/lib/ai/loop.server.ts:505-508) — so a
     *  null reaching here means that RPC already returned null, which means
     *  `auth.uid()` was null, which means the column default is about to return null
     *  as well. There is no state in which dropping the key succeeds.
     *
     *  Hence a named refusal, the same move `studio.stage` makes at :1627
     *  ("studio.stage requires a workspace"), and hence an UNCONDITIONAL stamp: a
     *  conditional spread still satisfies tenancy-stamp.test.ts's
     *  `/\bworkspace_id\s*:/` scan, so the guard would keep reading green over a
     *  weaker guarantee than the one it was written to hold.
     *
     *  Near-unreachable today and kept anyway: `opportunities.workspace_id` is NOT
     *  NULL so the bet path always carries one, and 0 of 1136 `agent_runs` have a
     *  null workspace. */
    const specWorkspaceId = opp?.workspace_id ?? workspaceId ?? null;
    if (!specWorkspaceId) {
      throw new Error(
        "prd.draft requires a workspace: neither the bet nor this run carried one. `prds.workspace_id` is NOT NULL and its default only fills for a signed-in browser request, so the insert would be refused with a constraint error nobody can act on. Dispatch this run with a workspace.",
      );
    }
    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .insert({
        user_id: userId,
        workspace_id: specWorkspaceId,
        product_id: opp?.product_id ?? null,
        opportunity_id: opp?.id ?? null,
        title: (a.title ?? derived).slice(0, 280),
        body_md: body,
        status: "draft",
        model: DRAFT_MODEL,
      })
      // `workspace_id` is read back rather than assumed: the stage event below has
      // to describe the row Postgres actually wrote. stage_events is read with a
      // workspace filter on at least three surfaces (today-lanes, loop-state,
      // briefing) and recordStageEvent swallows its own errors, so a mis-stamped
      // SEAM-1 row is both invisible and silent — a spec in one workspace whose
      // creation event is in another, or in none.
      .select("id,title,status,workspace_id")
      .single();
    if (pErr) throw new Error(pErr.message);
    // SEAM-1: spec (PRD) creation event, attributed to the acting agent.
    await recordStageEvent(supabase, {
      entityType: "spec",
      entityId: prd.id,
      to: "draft",
      actor: agentSlug ?? "system",
      workspaceId: prd.workspace_id ?? specWorkspaceId,
      userId,
    });
    // `opportunity_id` is null on the brief path, and that null is the signal:
    // it is how a reader tells a spec that serves a bet from one that entered
    // mid-lifecycle. The field list stays exactly as it was, so
    // src/lib/spine/attach.ts's `prd.draft` product (idField "prd_id") is
    // unaffected.
    return {
      prd_id: prd.id,
      title: prd.title,
      status: prd.status,
      opportunity_id: opp?.id ?? null,
    };
  },
});

/**
 * prd.revise — Define stage.
 * Revises an EXISTING spec's body in place from a revision instruction, and
 * captures the prior body as a rewindable snapshot (PC-10 capture-on-write) plus
 * a provenance edge so the rewind can be filed against the reviser on the Trust
 * Ledger. Use to fold feedback into a spec; use prd.draft to create a new one.
 */
const prdRevise = def({
  name: "prd.revise",
  description:
    "Revise an existing spec in place from a revision instruction. Reads the current spec body, applies ONLY the requested change, and overwrites it -- capturing the prior body so the owner can one-key Rewind this edit (the rewind also lands on the audit trail). Use to fold in feedback or update an existing spec; use prd.draft to create a new one.",
  category: "write",
  argsSchema: z.object({
    prd_id: z.string().uuid(),
    instruction: z.string().min(1).max(2000),
  }),
  preview: (a) =>
    `Revise spec ${a.prd_id.slice(0, 8)}: "${a.instruction.slice(0, 60)}${a.instruction.length > 60 ? "..." : ""}"`,
  run: async (a, { supabase, userId, traceId, runId, agentSlug }) => {
    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id,status,opportunity_id")
      .eq("id", a.prd_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prd) throw new Error("spec not found");
    if (!(prd.body_md ?? "").trim()) throw new Error("spec has no body to revise");

    const res = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: prd.id,
      model: DRAFT_MODEL,
      traceId: traceId ?? null,
      runId: runId ?? null,
      messages: [
        {
          role: "system",
          content:
            "You are a senior product manager revising an EXISTING spec. Apply only the requested change; preserve the spec's structure, sections, and everything the change does not touch. Return the FULL revised spec in Markdown, not a diff or a fragment. Do not invent metrics.",
        },
        {
          role: "user",
          content: `Current spec:\n\n${prd.body_md}\n\nRequested change:\n${a.instruction}`,
        },
      ],
    });
    const body = res.output?.trim();
    if (!body) throw new Error("model returned empty revised spec");

    // PC-10 capture-on-write: snapshot the prior body BEFORE overwriting so the
    // owner can one-key Rewind this agent edit. snapshot_before is the bare prior
    // body string -- the exact shape revertPrdToPrevious reads back.
    const { error: uErr } = await supabase
      .from("prds")
      .update({ body_md: body, snapshot_before: prd.body_md, updated_at: new Date().toISOString() })
      .eq("id", a.prd_id)
      .eq("user_id", userId);
    if (uErr) throw new Error(uErr.message);

    // Attribution for the rewind's Trust Ledger receipt: revertPrdToPrevious
    // reads the artifact_lineage edge whose child is this spec + created_by_agent
    // to file the rewind as a REJECTED judgment against the reviser. prd.draft
    // writes no such edge, so record a 'revised' edge here (idempotent per
    // relation; fail-soft, since the spec write already succeeded).
    await recordLineageSafe(supabase, userId, {
      parent_kind: prd.opportunity_id ? "opportunity" : "prd",
      parent_id: prd.opportunity_id ?? prd.id,
      child_kind: "prd",
      child_id: prd.id,
      relation: "revised",
      created_by_agent: agentSlug ?? null,
    });
    return { prd_id: prd.id, title: prd.title, revised: true };
  },
});

/**
 * decision.revise — Decide stage.
 * Revises an EXISTING decision's rationale in place from a revision instruction,
 * capturing the prior rationale as a rewindable snapshot (PC-10) and attributing
 * the change to the acting agent so a rewind files against it on the Trust Ledger
 * (decisions attribute via decided_by_agent_slug directly, not a lineage edge).
 */
const decisionRevise = def({
  name: "decision.revise",
  description:
    "Revise an existing decision's rationale in place from a revision instruction (e.g. to fold in new evidence). Reads the current rationale, applies ONLY the requested change, and overwrites it -- capturing the prior rationale so the owner can one-key Rewind this edit (the rewind also lands on the audit trail). Does not change the decision's status.",
  category: "write",
  argsSchema: z.object({
    decision_id: z.string().uuid(),
    instruction: z.string().min(1).max(2000),
  }),
  preview: (a) =>
    `Revise decision ${a.decision_id.slice(0, 8)}: "${a.instruction.slice(0, 60)}${a.instruction.length > 60 ? "..." : ""}"`,
  run: async (a, { supabase, userId, traceId, runId, agentSlug }) => {
    const { data: decision, error: dErr } = await supabase
      .from("decisions")
      .select("id,title,rationale,workspace_id")
      .eq("id", a.decision_id)
      .maybeSingle();
    if (dErr) throw new Error(dErr.message);
    if (!decision) throw new Error("decision not found");
    if (!(decision.rationale ?? "").trim()) throw new Error("decision has no rationale to revise");

    const res = await callModel(supabase, userId, {
      // No dedicated "decision" CallSurface exists (that union lives in the pinned
      // runtime.server.ts); reuse "prd", the established artifact-revise surface
      // prd.revise already uses, so both revise tools share one cost bucket.
      surface: "prd",
      surface_ref: decision.id,
      model: DRAFT_MODEL,
      traceId: traceId ?? null,
      runId: runId ?? null,
      messages: [
        {
          role: "system",
          content:
            "You are a senior product manager revising the rationale of an EXISTING decision. Apply only the requested change; preserve everything the change does not touch. Return the FULL revised rationale as plain prose, not a diff or a fragment.",
        },
        {
          role: "user",
          content: `Decision: ${decision.title}\n\nCurrent rationale:\n${decision.rationale}\n\nRequested change:\n${a.instruction}`,
        },
      ],
    });
    const rationale = res.output?.trim();
    if (!rationale) throw new Error("model returned empty revised rationale");

    // PC-10 capture-on-write: snapshot the prior rationale BEFORE overwriting, and
    // attribute the decision to the acting agent so revertDecisionToPrevious files
    // the rewind as a REJECTED judgment against it. Bare-string snapshot -- the
    // exact shape revertDecisionToPrevious reads back.
    const { error: uErr } = await supabase
      .from("decisions")
      .update({
        rationale,
        snapshot_before: decision.rationale,
        decided_by_agent_slug: agentSlug ?? null,
      })
      .eq("id", a.decision_id);
    if (uErr) throw new Error(uErr.message);
    return { decision_id: decision.id, title: decision.title, revised: true };
  },
});

/* ------------------------------------------------------------------ *
 * The four stations that had no hands
 *
 * FOUNDER RULING 2026-08-01. Sense had six tools, Define four, Build fifteen.
 * Decide, Design, Ship and Learn had ZERO that create their station's artifact:
 * `decision.revise` can only edit a decision that already exists, and the other
 * three had nothing at all. Every one of those stations has an active lead
 * agent and a fully shaped table waiting for it, so an agent arrived, was
 * handed a goal, and had no way to write anything down. A track walked the
 * route and left no record at four of its seven stops.
 *
 * The surface had started EXCUSING this ("design is done with people today"),
 * which is the wrapper story told in our own product: four sevenths of the loop
 * advertised as human work. The doctrine's third test is explicit that a
 * surface an autonomous agent cannot run end to end under policy is legacy the
 * day it ships. So the excuse is deleted and the hands are built.
 *
 * THREE ARE REVERSIBLE INTERNAL WRITES and run autonomously by default, which
 * is the governance canon's posture: the human sets boundaries, the agent does
 * the work. The fourth, shipping to production, is named in the four floors no
 * boundary may lower, so it is pinned to review and a test asserts the pin.
 * That is one gate in seven stations: the exception, not the loop.
 * ------------------------------------------------------------------ */

/**
 * decision.record, the Decide stage.
 * The station's missing artifact. Records the call an agent actually made, with
 * what it rejected, which is the column the company brain compounds on: next
 * time it can say this was already weighed and why it lost.
 */
const decisionRecord = def({
  name: "decision.record",
  description:
    "Record a decision you have made: the call, why you made it, and the alternatives you rejected. Use at the Decide station once the call is genuinely made, not to propose one. Requires at least one rejected alternative -- a choice with nothing weighed against it is an assertion, not a decision, and is refused.",
  category: "write",
  argsSchema: z.object({
    title: z.string().min(1).max(200),
    rationale: z.string().min(1).max(4000),
    alternatives_considered: z.array(z.string().min(1).max(500)).min(1).max(10),
    prd_id: z.string().uuid().optional(),
  }),
  preview: (a) =>
    `Record decision "${a.title}" against ${a.alternatives_considered.length} rejected alternative${a.alternatives_considered.length === 1 ? "" : "s"}`,
  run: async (a, { supabase, userId, agentSlug, missionId, workspaceId }) => {
    /**
     * THE STATUS IS DECIDED HERE, NOT ASSERTED. This line used to read
     * `status: "approved"` outright.
     *
     * The comment defending it was RIGHT about the outcome and wrong about the
     * mechanism: filing every agent call as pending would turn the one station
     * whose job is deciding into a queue for a person, which this product does
     * refuse. But "the answer is usually approve" is not a reason to skip
     * asking. An approval with no test behind it and no reason recorded cannot
     * be audited and cannot be overturned by anyone who does not already know
     * it happened, and the founder's condition for keeping anything off the
     * queue was that it stay attributable and reversible. A literal is neither.
     *
     * `decideDecisionReview` is the same gate the two mission write points use,
     * so all three doors now answer the same policy. In the ordinary case it
     * returns "approved" and this tool behaves exactly as before — the change
     * is that there is now a recorded reason, and five other conditions that
     * can take the call away from the agent when provenance, attribution or
     * effect are not clean.
     *
     * WHY `medium` AND NOT `high`. The convention in confidence.ts is that a
     * writer maps a signal it already holds and says medium rather than
     * fabricating high. The signal here is real but weak: the args schema
     * refuses a decision with no rejected alternative, which is this product's
     * own test of whether a call was weighed or merely asserted, so a tool call
     * that got this far has weighed something. Nothing external verified it,
     * which is precisely what "high" would claim. Note that gate 4 refuses on
     * ABSENCE as well as on "low", so a future edit that drops this field sends
     * the row to a human rather than through.
     */
    const gate = decideDecisionReview({
      sourceKind: "agent",
      agentSlug: agentSlug ?? null,
      confidence: "medium",
      effect: DECISION_RECORD_EFFECT,
      /* False, and checkable rather than hopeful, on the same grounds
       * handoff.server.ts states: `updateDecision` and `routeDecision` are the
       * only two paths that resolve a decision and both only flip `status` and
       * write a stage event. The lineage edges written below are internal and
       * reversible. No spend starts, nothing ships, nothing leaves the
       * workspace. If landing a decision is ever made to DO something, this
       * argument is the line that has to change with it. */
      commitsBeyondTheRecord: false,
    });
    const { data, error } = await supabase
      .from("decisions")
      .insert({
        user_id: userId,
        workspace_id: workspaceId ?? null,
        mission_id: missionId ?? null,
        prd_id: a.prd_id ?? null,
        title: a.title,
        rationale: a.rationale,
        alternatives_considered: a.alternatives_considered,
        status: gate.status,
        decided_by_agent_slug: agentSlug ?? null,
        /**
         * 'agent' — and until 2026-08-11 the database refused this value, so
         * EVERY call of this tool threw and the Decide station's only
         * artifact-creating hand wrote nothing for ten days. Measured before
         * the fix: 296 decisions across eight source kinds and zero 'agent'.
         * `decisions_source_kind_check` was widened in migration
         * 20260811140000, and the-source-kinds-agree.test.ts now fails if the
         * constraint and the union ever drift apart again — which they had
         * done three times.
         */
        source_kind: "agent",
        /* The loop raised this, not a person. Same column and same reason as
         * the mission receipt: an auto-approval a human cannot FIND is the half
         * of "attributable and reversible" that is easy to miss. */
        auto_origin: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const decisionId = (data as { id: string }).id;
    /**
     * The receipt for a call a human never saw, written before anyone asks for
     * it — the question "why was I not shown this" always arrives after the
     * fact. `supabaseAdmin` because `workspace_audit_log` has no insert policy
     * at all by design; only the service role writes it. Never throws: a
     * missing trail row is a gap, a thrown one would lose the decision.
     */
    if (gate.action === "auto_approve") {
      await recordAutoApproval(supabaseAdmin, {
        decisionId,
        workspaceId: workspaceId ?? null,
        userId: userId ?? null,
        agentSlug: agentSlug ?? null,
        missionId: missionId ?? null,
        sourceKind: "agent",
        writtenBy: "decision.record (lib/ai/tools/registry.server.ts)",
        decision: gate,
      });
    }
    /**
     * THE AGENT'S OWN CALL, PUT ON THE GRAPH.
     *
     * This tool is the Decide station's hand, and it already files both ids the
     * schema models: `mission_id` from the run context and `prd_id` from the
     * agent's argument. Both are written, because a call made during a mission
     * about a spec is genuinely both, and each end answers a different reader —
     * "what did this mission decide" and "what has been decided about this
     * spec". The unique index keys on the pair plus the relation, so two edges
     * from one decision never collide.
     *
     * After the insert and after `error` is checked, because supabase-js
     * resolves a refused write: the throw above is what proves the row landed.
     *
     * `workspaceId` comes from the tool context — the workspace the run is
     * executing in, and the same value the insert above filed the decision
     * under. Not the column default, which would resolve the caller's default
     * workspace and misfile the edge for any operator with two.
     */
    await recordDecisionOrigins(supabase, userId, {
      decisionId,
      missionId: missionId ?? null,
      prdId: a.prd_id ?? null,
      workspaceId: workspaceId ?? null,
      createdByAgent: agentSlug ?? null,
      rationale: "The artifact this agent's call was recorded against",
    });
    return {
      decision_id: decisionId,
      title: a.title,
      alternatives_weighed: a.alternatives_considered.length,
    };
  },
});

/**
 * design.draft, the Design stage.
 *
 * IT NOW DRAWS. The previous version inserted a `prototypes` row and stopped,
 * with a comment saying "the scaffold generator remains where it is; this is
 * the record that a design exists". That record was stranded, and the audit is
 * worth keeping because the shape of the mistake is general: nothing in the
 * loop reads `prototypes` as a design. `loadDesignDispatchContext` hands Build
 * `prd_scaffolds.html`; `loadDesignGateState` counts `prd_scaffolds` to decide
 * whether there is a drawing to judge; the /design surface builds its whole
 * drawings map out of `prd_scaffolds`; and `publishPrototypeFromPrd` READS a
 * scaffold to fill a prototype's file. A `prototypes` row has no html column at
 * all: its markup lives in `prototype_files`, which this tool never wrote. So
 * an unattended design run produced a name, a sentence and a share link that
 * opened onto an empty document, and Build never saw a design.
 *
 * The drawing is `prd_scaffolds.html` and the prototype is the wrapper around
 * it, so this draws first and registers second. It is the SAME generator the
 * human path uses (prepareScaffoldSpeculative -> buildDesignScaffoldHtml), not
 * a second one: an agent's drawing therefore inherits the workspace's design
 * language, records its grounding lineage, and lands in the one row the gate,
 * the surface and the dispatch already read.
 *
 * THE GATE IS UNTOUCHED AND THAT IS DELIBERATE. Because a drawing now exists,
 * `designGateBlocksDispatch` starts holding this spec out of Build until a
 * human approves it, exactly as it does for a drawing a person asked for. That
 * is the rule the gate is for. The deliberate way past it is the route on the
 * spec page: a spec that does not need a screen is sent straight to Build and
 * no drawing is made, so nothing is held. The return value says all of this
 * plainly, because an agent that is told "drawn" and not told "a call is now
 * owed" will report the loop as finished when it is waiting.
 */
const designDraft = def({
  name: "design.draft",
  description:
    "Draw the screen a spec implies and register it as a prototype at the Design station. Pass prd_id: the drawing is made from that spec's own words and is what Build later reads, so without a spec id this records a name and nothing anybody downstream can use. A drawing that exists needs a human to approve it before that spec reaches Build.",
  category: "write",
  argsSchema: z.object({
    name: z.string().min(1).max(160),
    description: z.string().min(1).max(2000),
    prd_id: z.string().uuid().optional(),
    entry_path: z.string().min(1).max(200).optional(),
  }),
  preview: (a) =>
    a.prd_id
      ? `Draw the screen for spec ${a.prd_id.slice(0, 8)} and register it as "${a.name}"`
      : `Register prototype "${a.name}" with no drawing (no spec given)`,
  run: async (a, { supabase, userId, workspaceId }) => {
    // 1. THE DRAWING, first, because it is the artifact everything downstream
    //    reads. Never throws: a registered prototype must not be lost because a
    //    model timed out, and the result is reported rather than assumed.
    let drew: UnattendedDraw = {
      drawn: false,
      reason: "no spec was given, so there were no words to draw from",
    };
    if (a.prd_id) {
      const { data: prdRow } = await supabase
        .from("prds")
        .select("body_md")
        .eq("id", a.prd_id)
        .maybeSingle();
      if (!prdRow) {
        drew = { drawn: false, reason: "that spec is not readable from this workspace" };
      } else {
        drew = await prepareScaffoldSpeculative(supabase, userId, {
          prdId: a.prd_id,
          specBody: ((prdRow as { body_md: string | null }).body_md ?? "").trim().slice(0, 20000),
          workspaceId,
        });
      }
    }

    // 2. THE SHARE RECORD. Unchanged shape and unchanged return field, because
    //    src/lib/spine/attach.ts files this tool's output by `prototype_id`.
    const { data, error } = await supabase
      .from("prototypes")
      .insert({
        user_id: userId,
        workspace_id: workspaceId ?? null,
        prd_id: a.prd_id ?? null,
        name: a.name,
        description: a.description,
        entry_path: a.entry_path ?? "index.html",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const prototypeId = (data as { id: string }).id;

    // 3. Give the share something to show. `/p/$slug` renders `prototype_files`
    //    and nothing else, so a prototype with no file is a link onto a blank
    //    page. Non-fatal: the drawing is already safe in `prd_scaffolds`, and
    //    losing the shareable copy must not cost the tool its whole call.
    let shareable = false;
    if (drew.drawn && workspaceId) {
      const { error: fileErr } = await supabase.from("prototype_files").insert({
        prototype_id: prototypeId,
        user_id: userId,
        workspace_id: workspaceId,
        path: a.entry_path ?? "index.html",
        content: drew.html,
        language: "html",
      });
      shareable = !fileErr;
      if (fileErr) console.error("design.draft prototype_files write failed:", fileErr.message);
    }

    return {
      prototype_id: prototypeId,
      name: a.name,
      drawing: drew.drawn
        ? {
            drawn: true,
            fidelity: drew.fidelity,
            screens: drew.screenCount,
            controls: drew.controlCount,
            shareable,
          }
        : { drawn: false, reason: drew.reason },
      next: drew.drawn
        ? "The screen is drawn and Build will read it. A human has to approve this design before this spec can dispatch, unless the workspace has the design gate off."
        : "Nothing was drawn, so Build has no design to read for this spec and the design gate is not holding it.",
    };
  },
});

/**
 * learning.record, the Learn stage.
 * What the outcome actually meant. This is where the record stops being storage
 * and starts guiding: a verdict here is what memory compounds on later, so the
 * vocabulary matches what the compounding layer already reads.
 */
const learningRecord = def({
  name: "learning.record",
  description:
    "Record what a shipped piece of work actually taught us. verdict is validated (it did what we expected), missed (it did not), mixed (some of both), or uncertain (not enough evidence yet). Say uncertain rather than guessing: only the first three compound into future guidance, so a wrong confident verdict poisons later advice.",
  category: "write",
  argsSchema: z.object({
    summary: z.string().min(1).max(4000),
    verdict: z.enum(["validated", "missed", "mixed", "uncertain"]),
    metric_label: z.string().min(1).max(120).optional(),
    metric_value: z.string().min(1).max(120).optional(),
    prd_id: z.string().uuid().optional(),
  }),
  preview: (a) =>
    `Record learning (${a.verdict}): "${a.summary.slice(0, 60)}${a.summary.length > 60 ? "..." : ""}"`,
  run: async (a, { supabase, userId, agentSlug, missionId, trackId, workspaceId }) => {
    // THE LOOP HAS TO CLOSE FOR THE AGENT, NOT ONLY FOR THE HUMAN.
    //
    // This used to insert a learnings row carrying prd_id and nothing else. That
    // looked complete and was not: listLearnings derives a learning's theme
    // THROUGH opportunity_id, and /decide drops any learning with no theme, so
    // an agent's verdict was written to a table nobody's ranking could see. The
    // human path and the nightly outcome-review cron both set it and both work.
    // In a product whose claim is that agents run the loop unattended, the
    // unattended path was the one that did not compound.
    //
    // So the tool now does what recordOutcome does, reading the SAME exported
    // rules rather than a second copy of the arithmetic: resolve the bet behind
    // the spec, move its confidence by the verdict, recompute ICE, and carry
    // prior/new ICE onto the learning so the audit trail matches.
    let opportunityId: string | null = null;
    let resolvedWorkspace: string | null = workspaceId ?? null;
    let priorIce: number | null = null;
    let newIce: number | null = null;
    let prdTitle: string | null = null;
    let oppTitle: string | null = null;

    // RESOLVE THE SPEC WHEN THE AGENT DID NOT NAME ONE. `prd_id` is optional on this
    // tool, and an outcome recorded without it is an ORPHAN: it carries a verdict but
    // attaches to nothing, so it can never re-rank the bet that produced it. That is the
    // compounding claim quietly failing. Measured on live data before this change: 119
    // learnings, 35 with a spec, and 35 attached to NOTHING at all.
    //
    // A mission is the unit of work an outcome is being recorded about, and while
    // missions carry no spec link of their own, the DECISION that mission produced does.
    // So mission -> decision -> spec recovers the link the agent omitted, which is a
    // real inference rather than a guess: the outcome belongs to whatever spec that
    // mission decided on. Newest decision wins, since a mission that decided twice has
    // superseded its earlier call.
    //
    // Fail-soft on purpose. If nothing resolves, the learning is still written with its
    // verdict, exactly as before. An unlinked outcome is worth less than a linked one
    // and far more than a lost one, so this never blocks the write.
    //
    // AND THE RECOVERY ABOVE DOES NOT REACH THE PATH THAT NEEDS IT MOST. It is
    // guarded on `missionId`, which arrives from the run context, and the
    // autonomous driver attaches a mission only at Build:
    // `station === "build" ? await missionForTrack(...) : null` — the sole call
    // site of `missionForTrack` in src/lib/spine/driver.server.ts, :988 at
    // a6dc2c69. Follow the symbol, not the number: that file is being edited by
    // another workflow and this pointer already drifted once, from :783. At Learn,
    // `missionId` is null on every driver-run track, so the two-hop fallback
    // described above is unreachable there and the agent's own `prd_id` argument
    // is the only link that can exist. The second hop is dead on that route too:
    // `decision.record` writes `prd_id` only when the agent passes one
    // (`prd_id: a.prd_id ?? null`, :3571 ABOVE — the earlier text here said
    // ":3384 below" and was wrong in the number and in the direction), and at
    // Decide the spec does not exist yet, so `decisions.prd_id` is null by
    // construction.
    // Live: the one track that completed the loop autonomously recorded two
    // verdicts, both with prd_id, opportunity_id and mission_id all NULL.
    //
    // CLOSED 2026-08-14, and the sentence that used to be here was "the fix for
    // that is in the driver, not here — this tool cannot see a track". It can now:
    // `ToolCtx.trackId` carries it, and the third recovery below reads the spec off
    // `spine_track_members`, which the driver has already filed. The reporting
    // branch above `outcomeMemoryId` stays either way, because a resolution that
    // finds nothing must still say so.
    let resolvedPrdId: string | null = a.prd_id ?? null;
    if (!resolvedPrdId && missionId) {
      const { data: fromMission } = await supabase
        .from("decisions")
        .select("prd_id")
        .eq("mission_id", missionId)
        .not("prd_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedPrdId = (fromMission as { prd_id?: string | null } | null)?.prd_id ?? null;
    }
    /**
     * AND THE ROUTE THE OTHER TWO CANNOT REACH: read it off the track.
     *
     * The paragraph above ends "the fix for that is in the driver, not here --
     * this tool cannot see a track". It can now. `ToolCtx.trackId` carries the
     * piece of work a driver-started run belongs to, and the driver FILES the spec
     * as a track member the moment Plan produces one, so the id this needs is
     * already on the record by the time Learn runs.
     *
     * WHY THIS IS THE DURABLE FIX AND THE EXISTING ONE IS NOT. The driver hands
     * the analyst the spec id in `stationGoal` and asks it to pass `prd_id`. That
     * works when the model complies and silently produces an orphan verdict when
     * it does not, which is the same shape as the nine features this repo found
     * doing nothing in production: correct code whose contract was a hope. Reading
     * the record needs no cooperation.
     *
     * Newest spec wins, matching `newestSpecId`, which is what the driver put in
     * the brief the agent was looking at. Fail-soft like both recoveries above: an
     * unlinked verdict is worth less than a linked one and far more than a lost
     * one, so nothing here may block the write.
     */
    if (!resolvedPrdId && trackId) {
      const { data: fromTrack } = await supabase
        .from("spine_track_members" as never)
        .select("artifact_id")
        .eq("track_id", trackId)
        .eq("artifact_kind", "prd")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      resolvedPrdId = (fromTrack as { artifact_id?: string | null } | null)?.artifact_id ?? null;
    }

    if (resolvedPrdId) {
      const { data: prd } = await supabase
        .from("prds")
        .select("id,workspace_id,opportunity_id,title")
        .eq("id", resolvedPrdId)
        .maybeSingle();
      if (prd) {
        opportunityId = (prd.opportunity_id as string | null) ?? null;
        resolvedWorkspace = (prd.workspace_id as string | null) ?? resolvedWorkspace;
        prdTitle = (prd.title as string | null) ?? null;
      }
    }

    if (opportunityId) {
      const { data: opp } = await supabase
        .from("opportunities")
        .select("id,impact,confidence,ease,ice_score,title")
        .eq("id", opportunityId)
        .maybeSingle();
      if (opp) {
        oppTitle = (opp.title as string | null) ?? null;
        priorIce = opp.ice_score == null ? null : Number(opp.ice_score);
        // `uncertain` is deliberately absent from the delta table and must not
        // move confidence: the tool's own description tells the agent to say
        // uncertain rather than guess, so acting on it would punish honesty.
        const delta = VERDICT_CONFIDENCE_DELTA[a.verdict as keyof typeof VERDICT_CONFIDENCE_DELTA];
        if (typeof delta === "number") {
          const newConfidence = clampConfidence((opp.confidence ?? 5) + delta);
          await supabase
            .from("opportunities")
            .update({ confidence: newConfidence, updated_at: new Date().toISOString() })
            .eq("id", opp.id);
          // ice_score is a GENERATED column, so compute the new value here rather
          // than re-reading a row Postgres has not recomputed yet.
          newIce = iceOf(opp.impact, newConfidence, opp.ease);
        }
      }
    }

    const { data, error } = await supabase
      .from("learnings")
      .insert({
        user_id: userId,
        workspace_id: resolvedWorkspace,
        mission_id: missionId ?? null,
        // The RESOLVED id, not the raw argument: an outcome the agent did not attach
        // is linked through its mission rather than written as an orphan.
        prd_id: resolvedPrdId,
        opportunity_id: opportunityId,
        summary: a.summary,
        verdict: a.verdict,
        metric_label: a.metric_label ?? null,
        metric_value: a.metric_value ?? null,
        prior_ice: priorIce,
        new_ice: newIce,
        recorded_by_agent_slug: agentSlug ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const learningId = (data as { id: string }).id;

    // The verdict has to reach memory too, or the next Critic red-team cannot
    // cite it. Best effort: the learning is already written and a memory miss
    // must not fail the tool. rememberOutcome refuses to insert an unembeddable
    // memory by design, since match_agent_memory hard filters on the vector.
    /* THE MOAT'S ONLY WRITER, GATED ON THE WRONG VARIABLE.
     *
     * This tested `a.prd_id`, the RAW argument, while the learning row above is
     * written with `resolvedPrdId` (the `prd_id:` field of the learnings insert,
     * :3859) — the mission-resolved id, added precisely so an agent that names no
     * prd still files its learning against the right one. So the exact case that
     * fix exists for wrote the learning and then skipped the memory.
     *
     * The consequence is the whole product claim. `agent_memory` has 846
     * reflections, 28 precedents, 26 notes, 8 corrections and ZERO rows of kind
     * "outcome", and outcome is the kind every precedent path filters on:
     * loadDecisionPrecedent, the RF-02 outcome-weighted rerank, the Critic's
     * red-team block. loadDecisionPrecedent has fired 71 times since 2026-07-30
     * and returned nothing on all 71, because the pool it searches has never had
     * a single row in it. "It learns and guides" is true of reflections, which
     * do get recalled, and was not yet true of OUTCOMES, which is the half that
     * makes it a moat.
     *
     * Using the resolved id is what lets the pool start filling. */
    /* AND THE FAILURE HAS TO BE VISIBLE, NOT JUST THE SUCCESS.
     *
     * `rememberOutcome` returns `{ id, supersedes, error }` precisely so a write
     * that produced no memory says why. This call used to discard the whole
     * result and catch only a throw, which `rememberOutcome` never does: it
     * returns its refusals (unembeddable content, a rejected insert) instead. So
     * the agent path could report a recorded learning while the outcome memory,
     * the only thing that fills the precedent pool, was silently never written,
     * and the sole trace was a console line in a Worker nobody reads. The human
     * path already stamps this into `prds.outcome.settled_memory_error`; this is
     * the same fact for the agent path, on the record instead of on stdout.
     *
     * Still best effort by design: the learnings row above is already committed
     * and must stay committed, so a memory miss reports and never throws. */
    /* AND THE REPORT WAS NESTED INSIDE THE THING IT EXISTS TO REPORT ON.
     *
     * `recordErrorEvent` — the whole point of which is to make a swallowed
     * memory write findable — used to sit INSIDE `if (resolvedPrdId)`, the same
     * branch that decides whether the memory is attempted at all. So the
     * loudest case was the silent one: a verdict whose spec could not be
     * resolved landed in `learnings` with prd_id null, produced no
     * `agent_memory` row, and produced no error event either. Nothing anywhere
     * said the lesson had been dropped, and the run reported success.
     *
     * That is not hypothetical. Measured live: 119 learnings, 93 of them
     * decisive, and ZERO rows in `agent_memory` of kind 'outcome' — the pool
     * `loadDecisionPrecedent` and the Critic's red-team block are the only
     * readers of. The pool has never held a row, and this branch is one of the
     * mechanisms.
     *
     * The reporting half now sits OUTSIDE the guard, so every path that reaches
     * this point either carries a memory id or says why it does not.
     *
     * CLOSED 2026-08-14. The widening this comment asked for had already landed
     * in src/lib/ai/memory.server.ts, whose `prdId` reads `string | null` and
     * whose docblock says null is a real, supported case. The `if` it asked to
     * drop had not been. So the sprinkler was plumbed and the valve stayed shut,
     * and the pool measured ZERO 'outcome' rows for another eight days while 358
     * precedent lookups ran against it.
     *
     * A verdict now compounds on its own text whether or not a spec could be
     * resolved. That is the correct behaviour and not a lowering of the bar: the
     * lesson "we shipped the wrong thing for the third time" is worth recalling
     * on its own words, and demanding a foreign key before a lesson may be
     * remembered was always a filing rule wearing the costume of a data rule.
     * The spec id remains on the row when there is one, so attribution is not
     * lost, only stopped from being a precondition. */
    let outcomeMemoryId: string | null = null;
    let outcomeMemoryError: string | null = null;
    try {
      const memory = await rememberOutcome(supabase, {
        userId,
        workspaceId: resolvedWorkspace,
        prdId: resolvedPrdId,
        opportunityId,
        learningId,
        content: a.summary,
        importance: a.verdict === "uncertain" ? 3 : 5,
        verdict: a.verdict,
        priorIce,
        newIce,
        prdTitle,
        oppTitle,
      });
      outcomeMemoryId = memory.id;
      outcomeMemoryError = memory.error;
    } catch (e) {
      outcomeMemoryError = e instanceof Error ? e.message : String(e);
    }
    if (outcomeMemoryError) {
      // Awaited, not fired and forgotten: an unawaited promise in a Cloudflare
      // Worker can be dropped when the request settles, which would put this
      // report back in the same nowhere the console line was in.
      // recordErrorEvent never throws and swallows its own failures.
      await recordErrorEvent(new Error(outcomeMemoryError), {
        surface: "learning.record",
        failure_kind: "outcome_memory_not_written",
        user_id: userId,
        workspace_id: resolvedWorkspace ?? undefined,
        extras: {
          // Null here is the diagnosis, not a missing field: it says this
          // verdict had no spec to attach to, which is a different bug from a
          // spec whose memory write was refused.
          prd_id: resolvedPrdId,
          learning_id: learningId,
          opportunity_id: opportunityId,
          verdict: a.verdict,
          agent_slug: agentSlug ?? null,
          mission_id: missionId ?? null,
        },
      });
    }

    return {
      learning_id: learningId,
      verdict: a.verdict,
      opportunity_id: opportunityId,
      prior_ice: priorIce,
      new_ice: newIce,
      // The agent reading this result learns the same thing the error store does:
      // whether its verdict actually reached the pool future runs search.
      outcome_memory_id: outcomeMemoryId,
      outcome_memory_error: outcomeMemoryError,
    };
  },
});

/**
 * release.publish, the Ship stage.
 * The one genuine gate in the loop. Calls the same promote path a person does,
 * so there are not two ways to ship that can disagree, and it is pinned to
 * review because a production deploy is irreversible and customers see it.
 */
const releasePublish = def({
  name: "release.publish",
  description:
    "Ship a merged changeset to production. Requires the changeset to be merged with a successful preview deploy already recorded. This is irreversible and customers see it, so it always goes to a person before it runs.",
  category: "write",
  argsSchema: z.object({ changeset_id: z.string().uuid() }),
  preview: (a) => `Ship changeset ${a.changeset_id.slice(0, 8)} to production`,
  run: async (a, { supabase, userId }) => {
    const res = await promoteChangesetToProductionCore(supabase, userId, a.changeset_id);
    return {
      deployment_id: res.deploymentId,
      url: res.productionUrl,
      changeset_id: a.changeset_id,
      // The agent that ran the promote learns the same thing the person at
      // /ship does: everything after the deploy — the Trust Ledger receipt, the
      // spec's shipped stamp, the 30-day outcome window — is best-effort,
      // because production has already happened and no bookkeeping failure can
      // undo it. Dropping these told the agent its ship was clean when the
      // record behind it had been refused, and nothing downstream would ever
      // ask. Same argument as `outcome_memory_error` above.
      warnings: res.warnings,
    };
  },
});

/**
 * roadmap.move — Plan stage.
 * Moves an opportunity to a Now/Next/Later roadmap bucket (or back to backlog),
 * the AI counterpart to the human drag board. A Now/Next/Later commitment must
 * carry a declared outcome AND measure (the H2 governance rule). Captures the
 * prior placement (PC-10) so the move can be one-key Rewound, and attributes it
 * to the acting agent so a rewind files against it on the Trust Ledger.
 */
const roadmapMove = def({
  name: "roadmap.move",
  description:
    "Move an opportunity to a Now/Next/Later roadmap bucket (or back to the backlog with bucket=null). A Now/Next/Later commitment must carry a declared outcome AND measure. Captures the prior placement so the move can be one-key Rewound, and attributes it to you so a rewind lands on the audit trail. Use to commit a researched, ranked opportunity to the roadmap.",
  category: "write",
  argsSchema: z.object({
    opportunity_id: z.string().uuid(),
    bucket: z.enum(["now", "next", "later"]).nullable(),
    outcome: z.string().max(500).nullable().optional(),
    measure: z.string().max(500).nullable().optional(),
  }),
  preview: (a) => `Move opportunity ${a.opportunity_id.slice(0, 8)} to ${a.bucket ?? "backlog"}`,
  run: async (a, { supabase, userId, agentSlug }) => {
    const { data: opp, error: oErr } = await supabase
      .from("opportunities")
      .select("id,title,workspace_id,roadmap_bucket,roadmap_outcome,roadmap_measure")
      .eq("id", a.opportunity_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!opp) throw new Error("opportunity not found");

    // Fall back to the already-declared outcome/measure so a pure bucket move
    // does not silently drop them; governance then checks the effective pair.
    const outcome = a.outcome ?? opp.roadmap_outcome ?? null;
    const measure = a.measure ?? opp.roadmap_measure ?? null;
    const check = validateCommitment({ bucket: a.bucket, outcome, measure });
    if (!check.ok) throw new Error(check.reason);

    const norm = (s: string | null) => (s && s.trim().length > 0 ? s.trim() : null);
    const nextOutcome = norm(outcome);
    const nextMeasure = norm(measure);
    // PC-10 Finding-3 fix: only snapshot when the placement actually changes, so a
    // no-op move (same bucket + outcome + measure) never creates a phantom
    // rewindable state. On a real change, capture the prior placement + attribute
    // to the agent so the move is one-key rewindable and files against this agent.
    const changed =
      a.bucket !== (opp.roadmap_bucket ?? null) ||
      nextOutcome !== (opp.roadmap_outcome ?? null) ||
      nextMeasure !== (opp.roadmap_measure ?? null);
    const updatePayload: Record<string, unknown> = {
      roadmap_bucket: a.bucket,
      roadmap_outcome: nextOutcome,
      roadmap_measure: nextMeasure,
    };
    if (changed) {
      updatePayload.roadmap_snapshot_before = {
        bucket: opp.roadmap_bucket ?? null,
        outcome: opp.roadmap_outcome ?? null,
        measure: opp.roadmap_measure ?? null,
      };
      updatePayload.roadmap_last_agent_slug = agentSlug ?? null;
    }
    const { error: uErr } = await supabase
      .from("opportunities")
      .update(updatePayload)
      .eq("id", a.opportunity_id)
      .eq("user_id", userId);
    if (uErr) throw new Error(uErr.message);

    // H2-AUDIT: record the move in the governance trail, same as the human board.
    // Best-effort: the move already landed, an audit hiccup must not fail the tool.
    try {
      await supabase.from("roadmap_audit").insert(
        buildAuditInsert({
          opportunityId: a.opportunity_id,
          workspaceId: opp.workspace_id ?? null,
          action: a.bucket === opp.roadmap_bucket ? "commit" : "move",
          fromBucket: opp.roadmap_bucket ?? null,
          toBucket: a.bucket,
          outcome: norm(outcome),
          measure: norm(measure),
        }),
      );
    } catch {
      // governance trail is additive; never blocks the move
    }
    return { opportunity_id: a.opportunity_id, title: opp.title, bucket: a.bucket };
  },
});

/**
 * backlog.prioritize — Plan stage.
 * Re-scores backlog opportunities (ICE) using AI grounded in supporting-signal
 * counts/recency. Updates rows in place; returns the new ranked list.
 */
const backlogPrioritize = def({
  name: "backlog.prioritize",
  description:
    "Re-score and rank backlog opportunities. For each backlog opportunity, gathers supporting-signal counts and recency, asks the model to update impact/confidence/ease (1-10), writes the new scores, and returns the ranked list. Use weekly or when new themes land.",
  category: "write",
  argsSchema: z.object({
    limit: z.number().int().min(1).max(30).optional(),
    status: z.enum(["backlog", "discovery", "validated"]).optional(),
  }),
  preview: (a) => `Re-prioritize ${a.limit ?? 15} opportunities (${a.status ?? "backlog"})`,
  run: async (a, { supabase, userId, traceId, runId }) => {
    const status = a.status ?? "backlog";
    const { data: opps, error } = await supabase
      .from("opportunities")
      .select("id,title,problem,target_user,impact,confidence,ease,theme_id,workspace_id")
      .eq("user_id", userId)
      .eq("status", status)
      .order("updated_at", { ascending: false })
      .limit(a.limit ?? 15);
    if (error) throw new Error(error.message);
    if (!opps?.length) return { rescored: 0, ranked: [], reason: "no opportunities in scope" };

    const themeIds = Array.from(new Set(opps.map((o) => o.theme_id).filter(Boolean))) as string[];
    const counts: Record<string, { n: number; recent: number }> = {};
    if (themeIds.length) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const { data: sigs } = await supabase
        .from("signals")
        .select("theme_id,created_at")
        .in("theme_id", themeIds)
        .eq("user_id", userId);
      for (const s of sigs ?? []) {
        const k = s.theme_id as string;
        counts[k] = counts[k] ?? { n: 0, recent: 0 };
        counts[k].n++;
        if (s.created_at && s.created_at > sevenDaysAgo) counts[k].recent++;
      }
    }

    const payload = opps.map((o) => ({
      id: o.id,
      title: o.title,
      problem: (o.problem ?? "").slice(0, 400),
      target_user: o.target_user ?? null,
      current: { impact: o.impact, confidence: o.confidence, ease: o.ease },
      evidence: o.theme_id ? (counts[o.theme_id] ?? { n: 0, recent: 0 }) : { n: 0, recent: 0 },
    }));
    const res = await callModel(supabase, userId, {
      surface: "discovery",
      surface_ref: "backlog.prioritize",
      model: DRAFT_MODEL,
      traceId: traceId ?? null,
      runId: runId ?? null,
      responseFormat: "json_object",
      messages: [
        {
          role: "system",
          content:
            'You re-score product opportunities on ICE (impact, confidence, ease), each 1-10 integers. Higher evidence.n and evidence.recent → higher confidence. Vague problem statements → lower confidence. Wide-scope problems → lower ease. Return strict JSON: {"scores":[{"id":string,"impact":int,"confidence":int,"ease":int,"rationale":string}]}. Include every input id once.',
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });
    const rawJson = res.json ?? safeJson(res.output);
    const scores =
      extractArrayField<{
        id: string;
        impact: number;
        confidence: number;
        ease: number;
        rationale?: string;
      }>(rawJson, "scores") ?? [];
    if (!scores.length) return { rescored: 0, ranked: [], reason: "model returned no scores" };

    let rescored = 0;
    const rationales: Record<string, string> = {};
    for (const s of scores) {
      const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(n)));
      const { error: uErr } = await supabase
        .from("opportunities")
        .update({ impact: clamp(s.impact), confidence: clamp(s.confidence), ease: clamp(s.ease) })
        .eq("id", s.id)
        .eq("user_id", userId);
      if (!uErr) {
        rescored++;
        if (s.rationale) rationales[s.id] = s.rationale.slice(0, 400);
      }
    }
    const { data: ranked } = await supabase
      .from("opportunities")
      .select("id,title,impact,confidence,ease,ice_score")
      .in(
        "id",
        scores.map((s) => s.id),
      )
      .order("ice_score", { ascending: false });
    return {
      rescored,
      model: DRAFT_MODEL,
      ranked: (ranked ?? []).map((r) => ({ ...r, rationale: rationales[r.id] ?? null })),
    };
  },
});

// ── A2A handoff ───────────────────────────────────────────────────────
// ── web I/O tools ─────────────────────────────────────────────────────
// Outbound web access via Firecrawl. Defaults to `auto` for read-only
// search/fetch/map; `web.crawl` defaults to `confirm` because it spends
// real credits and time. Results re-enter the loop as untrusted input —
// the next callModel runs pre-guardrails (PII / prompt-injection / secret).
const webSearchTool = def({
  name: "web.search",
  description:
    "Search the public web. Returns ranked results (url, title, snippet). Set scrape=true to also fetch markdown of each result (cheap recon). Use this BEFORE making claims about products, companies, news, or competitors you don't already have workspace context on.",
  category: "read",
  argsSchema: z.object({
    query: z.string().min(1).max(300),
    limit: z.number().int().min(1).max(10).optional(),
    scrape: z.boolean().optional(),
    recency: z.enum(["day", "week", "month", "year"]).optional(),
  }),
  preview: (a) => `Web search: "${a.query}"${a.recency ? ` · past ${a.recency}` : ""}`,
  run: async (a) => webSearch(a),
});

const webFetchTool = def({
  name: "web.fetch",
  description:
    "Fetch a single URL and return its main content as markdown. Use after web.search to read a specific page in full. Always cite the returned URL when you use facts from it.",
  category: "read",
  argsSchema: z.object({
    url: z.string().url().max(2000),
    maxChars: z.number().int().min(2000).max(20000).optional(),
  }),
  preview: (a) => `Fetch ${a.url}`,
  run: async (a) => webFetch(a),
});

const webMapTool = def({
  name: "web.map",
  description:
    "Discover URLs on a domain (cheap sitemap). Optionally filter by keyword. Use BEFORE web.crawl to pick a small set of pages instead of crawling blindly.",
  category: "read",
  argsSchema: z.object({
    url: z.string().url().max(500),
    search: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(500).optional(),
    includeSubdomains: z.boolean().optional(),
  }),
  preview: (a) => `Map ${a.url}${a.search ? ` · "${a.search}"` : ""}`,
  run: async (a) => webMap(a),
});

const webCrawlTool = def({
  name: "web.crawl",
  description:
    "Crawl a bounded set of pages on a domain (max 25 pages, depth 2). Costs real credits — prefer web.search + web.fetch unless you genuinely need many pages. Defaults to a confirm approval gate.",
  category: "read",
  argsSchema: z.object({
    url: z.string().url().max(500),
    limit: z.number().int().min(1).max(25).optional(),
    maxDepth: z.number().int().min(1).max(2).optional(),
    includePaths: z.array(z.string().min(1).max(200)).max(10).optional(),
    excludePaths: z.array(z.string().min(1).max(200)).max(10).optional(),
  }),
  preview: (a) => `Crawl up to ${a.limit ?? 10} pages from ${a.url}`,
  run: async (a) => webCrawl(a),
});

/**
 * agent.handoff — pass the mission to another agent with a STRUCTURED payload.
 * Defaults to `confirm` mode (operator sees the structured payload + receiver
 * in the approval card). When executed, it inserts an `agent_messages` row and
 * enqueues a child `agent_runs` row with the same `mission_id`; the resume-runs
 * sweeper picks it up on its next tick.
 * Only usable from inside a mission — fails fast otherwise so the operator can
 * see this in the trace.
 */
const agentHandoff = def({
  name: "agent.handoff",
  description:
    "Hand the current mission off to another agent with a structured payload (task + context + artifacts + open questions + constraints + evidence). Use when your stage is done and a different specialist should pick up. Requires you to be inside a mission (the operator started it that way). When you list artifacts, also cite evidence_ids: the signals/themes/opportunities/PRDs/decisions/memory that justify them, so the receiver can verify your claim instead of taking it on trust (the runtime can reject an evidence-free handoff).",
  category: "write",
  argsSchema: z.object({
    to_agent_slug: z.string().min(1).max(60),
    task: z.string().min(1).max(1000),
    context: z.record(z.string(), z.unknown()).optional(),
    artifacts: z
      .array(
        z.object({
          kind: z.string().min(1).max(40),
          id: z.string().min(1).max(200),
          title: z.string().max(280).optional(),
        }),
      )
      .max(20)
      .optional(),
    open_questions: z.array(z.string().min(1).max(400)).max(10).optional(),
    constraints: z.array(z.string().min(1).max(400)).max(10).optional(),
    evidence_ids: z
      .array(
        z.object({
          kind: z.string().min(1).max(40),
          id: z.string().min(1).max(200),
          note: z.string().max(280).optional(),
        }),
      )
      .max(20)
      .optional(),
  }),
  preview: (a) => `Handoff to ${a.to_agent_slug}: "${a.task.slice(0, 80)}"`,
  run: async (
    a,
    { supabase, userId, agentId, agentSlug, traceId, runId, missionId, workspaceId },
  ) => {
    if (!missionId)
      throw new Error("agent.handoff requires a mission_id (start the run with a mission)");
    if (!workspaceId) throw new Error("agent.handoff requires a workspace_id");
    // Guard: delegate.openhands is a TOOL, not an agent slug. If the model
    // mistakenly routes here, fail fast with an actionable message so the model
    // retries with the correct tool call.
    if (a.to_agent_slug === "delegate.openhands") {
      throw new Error(
        "agent.handoff: 'delegate.openhands' is a tool, not an agent slug. Call the `delegate.openhands` tool directly with args: task, repo_url, base_branch, evidence_ids.",
      );
    }
    // KI-19: resolveAgent filters to enabled agents only and throws a clear,
    // slug-named error when the target is disabled or off-roster — so a model
    // can never dispatch a child run to a disabled agent. Resolve before the
    // self-handoff guard so the disabled/off-roster case surfaces first.
    const to = await resolveAgent(supabase, userId, { agent_slug: a.to_agent_slug });
    if (to.id === agentId) throw new Error("agent.handoff: cannot hand off to yourself");
    const payload: HandoffPayload = {
      task: a.task,
      context: a.context as Record<string, unknown> | undefined,
      artifacts: a.artifacts,
      open_questions: a.open_questions,
      constraints: a.constraints,
      evidence_ids: a.evidence_ids,
    };
    const result = await enqueueHandoff(supabase, userId, {
      mission_id: missionId,
      workspace_id: workspaceId,
      from_agent_id: agentId ?? null,
      from_agent_slug: agentSlug ?? null,
      to,
      payload,
      source_run_id: runId ?? null,
      source_trace_id: traceId ?? null,
    });
    return {
      message_id: result.message_id,
      queued_run_id: result.queued_run_id,
      to_agent_slug: to.slug,
      mission_id: missionId,
    };
  },
});

/**
 * agent.spawn: fan out independent, parallelizable subwork across N bounded
 * ephemeral sub-agents of ONE specialist (e.g. one per source to ingest, per spec
 * section, per file to build), each under a split of the mission budget. Each child
 * is a normal A2A handoff, so the existing mission engine carries and completes them;
 * results flow back into the mission. Capped at FANOUT_MAX_CHILDREN per spawn and
 * gated OFF by default (AGENT_FANOUT), so it errors until the founder enables it.
 */
const agentSpawn = def({
  name: "agent.spawn",
  description: `Fan out independent, parallelizable subtasks across up to ${FANOUT_MAX_CHILDREN} bounded sub-agents of one specialist (e.g. one per source to ingest, per spec section to draft, per file to build), each running under a split of the mission budget. Use ONLY for genuinely independent subtasks that can run in parallel; for a single next step use agent.handoff. Requires you to be inside a mission.`,
  category: "write",
  argsSchema: z.object({
    to_agent_slug: z.string().min(1).max(60),
    items: z
      .array(
        z.object({
          task: z.string().min(1).max(1000),
          context: z.record(z.string(), z.unknown()).optional(),
        }),
      )
      .min(1)
      .max(FANOUT_MAX_CHILDREN),
  }),
  preview: (a) => `Spawn ${a.items.length} ${a.to_agent_slug} sub-agent(s)`,
  run: async (
    a,
    { supabase, userId, agentId, agentSlug, traceId, runId, missionId, workspaceId },
  ) => {
    if (!fanoutEnabled())
      throw new Error("agent.spawn: fan-out is not enabled (set AGENT_FANOUT=1).");
    if (!missionId)
      throw new Error("agent.spawn requires a mission_id (start the run with a mission)");
    if (!workspaceId) throw new Error("agent.spawn requires a workspace_id");

    // The current run carries (a) its fan-out depth, via the inbound fan-out handoff
    // that started it, and (b) its own cap + usage. Read both.
    let myDepth = 0;
    let spendCap: number | null = null;
    let tokenCap: number | null = null;
    let spendUsed = 0;
    let tokenUsed = 0;
    if (runId) {
      const [{ data: run }, { data: inbound }] = await Promise.all([
        supabase
          .from("agent_runs")
          .select("mission_spend_cap_usd,mission_token_cap,spend_used_usd,tokens_used")
          .eq("id", runId)
          .maybeSingle(),
        supabase
          .from("agent_messages")
          .select("payload")
          .eq("consumed_by_run_id", runId)
          .eq("kind", "handoff")
          .limit(1)
          .maybeSingle(),
      ]);
      spendCap = (run?.mission_spend_cap_usd as number | null) ?? null;
      tokenCap = (run?.mission_token_cap as number | null) ?? null;
      spendUsed = (run?.spend_used_usd as number | null) ?? 0;
      tokenUsed = (run?.tokens_used as number | null) ?? 0;
      myDepth = fanoutDepthOf(inbound?.payload ?? null);
    }

    // Bound nested fan-out: a spawned worker (depth >= FANOUT_MAX_DEPTH) may not itself
    // spawn, so a chain can never explode. This, plus the per-spawn count cap, is the
    // guard on HOW MANY runs exist; the budget below is the guard on what they may
    // spend, and neither substitutes for the other.
    if (!canSpawnAtDepth(myDepth)) {
      throw new Error(
        "agent.spawn: a spawned sub-agent cannot itself fan out (nested fan-out is bounded to prevent runaway).",
      );
    }

    // Split the REMAINING budget (cap minus what this run already used) across the
    // children. When this run's own ceiling is NOT a number we pass `undefined`, not
    // `null`, and the difference is the whole guard: `enqueueFanout` feeds this to
    // `resolveMissionSpendCap`, which reads `undefined` as "nobody said" and inherits
    // the workspace ceiling, but reads `null` as "somebody said no ceiling" and
    // returns it verbatim without ever reading the workspace.
    //
    // THE BUG THIS LINE USED TO BE, and the comment that used to sit here asserting
    // the opposite. `spendCap` is null on three paths that all mean "we don't know":
    // the `agent_runs` read above errored, there is no `runId` to read, or the row
    // predates the day every writer began resolving. This line wrote `: null` on all
    // three, so a single failed SELECT uncapped every child of the fan-out — the one
    // tool call that becomes N runs, so the one place an absent ceiling costs N times
    // what it costs anywhere else. Proved 2026-08-10 by driving `enqueueFanout` with
    // an explicit null: `[null, null]` landed on the child `agent_runs` rows and the
    // workspaces table was never read. `mission-caps.server.ts` names this exact fail
    // direction as "exactly backwards for a safety control".
    const remainingSpend = remainingMissionBudget(spendCap, spendUsed);
    const remainingTokens = remainingMissionBudget(tokenCap, tokenUsed);

    const res = await enqueueFanout(supabase, userId, {
      mission_id: missionId,
      workspace_id: workspaceId,
      from_agent_id: agentId ?? null,
      from_agent_slug: agentSlug ?? null,
      to_agent_slug: a.to_agent_slug,
      items: a.items,
      parent_depth: myDepth,
      source_run_id: runId ?? null,
      source_trace_id: traceId ?? null,
      spend_cap_usd: remainingSpend,
      token_cap: remainingTokens,
    });
    return {
      spawned: res.spawned.length,
      dropped: res.dropped,
      to_agent_slug: a.to_agent_slug,
      mission_id: missionId,
    };
  },
});

/**
 * delegate.openhands: governed delegate-out to an EXTERNAL coding agent (v4 Law 5,
 * frontier-absorption). Wires the dormant provider seam (src/lib/delegate, lane 3)
 * under our governance: the delegation MUST cite evidence_ids (the rows that justify
 * the work), it is in HIGH_RISK_FORCE_REVIEW so a human ALWAYS approves before it
 * leaves, and it is catalogued irreversible/external for the blast-radius cap. The
 * seam itself is dormant by default (DELEGATE_OUTBOUND_ENABLED + OPENHANDS_ENDPOINT):
 * when disabled, submitDelegation resolves to the null floor and returns an
 * accepted:false verdict with NO network call, so this is safe even before config.
 */
const delegateOpenhands = def({
  name: "delegate.openhands",
  description:
    "Delegate a heavy, well-bounded build task to an EXTERNAL coding agent (OpenHands) working against a repo, UNDER our governance. Cite evidence_ids (the rows that justify the work) WHENEVER any exist; greenfield work against a new or empty repo may legitimately have none, in which case pass an empty list rather than manufacturing evidence. The delegation is ALWAYS human-reviewed before it leaves (the real guardrail), and the result folds back into the mission. Provide repo_url + base_branch. Use only for build work an external agent is better at; for in-house work hand off to the builder. Requires a mission.",
  category: "write",
  argsSchema: z.object({
    task: z.string().min(1).max(DELEGATE_TASK_MAX_CHARS),
    repo_url: z.string().min(1).max(400),
    base_branch: z.string().min(1).max(200),
    // Evidence is cited when it exists, but is NOT mandatory: greenfield work
    // against an empty repo has nothing to cite, and the human approval gate
    // (HIGH_RISK_FORCE_REVIEW) is the real guardrail. Defaults to [] so the
    // model can omit it cleanly instead of fabricating a signal to satisfy a
    // min-length check. The run fn + ApprovalCard both tolerate an empty list.
    evidence_ids: z
      .array(
        z.object({
          kind: z.string().min(1).max(40),
          id: z.string().min(1).max(200),
        }),
      )
      .max(20)
      .default([]),
  }),
  preview: (a) =>
    `Delegate to OpenHands: "${a.task.slice(0, 60)}" on ${a.repo_url}#${a.base_branch}`,
  run: async (a, { supabase, runId, missionId }) => {
    if (!missionId)
      throw new Error("delegate.openhands requires a mission_id (start the run with a mission)");
    const verdict = await submitDelegation(
      {
        task: a.task,
        repoUrl: a.repo_url,
        baseBranch: a.base_branch,
        context: { evidence_ids: a.evidence_ids },
        supaprodRunId: runId ?? null,
      },
      "openhands",
    );
    // Surface honest errors: disabled env, refused by provider, etc.
    // Without this, executeApproval sees a resolved promise and toasts success
    // even though no task was ever sent to OpenHands.
    if (!verdict.accepted) {
      throw new Error(verdict.reason ?? "delegate.openhands: submission rejected");
    }
    // Persist the external job id so the poll/fold cycle can locate this run.
    if (verdict.accepted && verdict.externalJobId && runId) {
      await supabase
        .from("agent_runs")
        .update({
          delegate_meta: {
            provider: verdict.provider,
            external_job_id: verdict.externalJobId,
            submitted_at: new Date().toISOString(),
          },
        })
        .eq("id", runId);
    }
    return {
      provider: verdict.provider,
      accepted: verdict.accepted,
      external_job_id: verdict.externalJobId,
      reason: verdict.reason,
      evidence_count: a.evidence_ids.length,
      mission_id: missionId,
    };
  },
});

// DEC-02-LOOP — the Critic as a routable, gating-exempt loop tool. Lets the
// orchestrator (or any specialist) red-team an opportunity/PRD in-loop, not
// only via the inline promotion/spec paths. category 'planning' + membership in
// loop.server's ORCHESTRATION_CONTROL_FLOW_TOOLS keeps it inline (the verdict is
// advisory and side-effect-free beyond the row's own critic_review column).
const criticEvaluate = def({
  name: "critic.evaluate",
  description:
    "Adversarially red-team an opportunity or PRD before a human approves it. Persists a ship/revise/kill verdict with risks, kill-criteria, and missing evidence on the row. The verdict is advisory.",
  category: "planning",
  argsSchema: z.object({
    target_kind: z.enum(["opportunity", "prd"]),
    target_id: z.string().uuid(),
  }),
  preview: (a) => `Critic: red-team ${a.target_kind} ${a.target_id.slice(0, 8)}`,
  run: (args, ctx) => runCriticTool(args, ctx),
});

export const TOOL_REGISTRY: Record<string, ToolDef> = Object.fromEntries(
  [
    workspaceSearch,
    listTasks,
    createTask,
    updateTaskStatus,
    logSignal,
    listSignals,
    listThemes,
    sourcesStatus,
    clusterTrigger,
    sourcesConnect,
    createNote,
    remember,
    memoryReflect,
    memoryPromote,
    proposeSlots,
    createCalendarEvent,
    githubIssueCreate,
    githubPrOpen,
    githubCiRead,
    ciLogs,
    githubCommitAppend,
    repoTree,
    repoRead,
    repoSearch,
    studioStage,
    studioCommit,
    studioFixCommit,
    studioSecretsScan,
    studioTestsPlan,
    studioChecksRun,
    studioDepsAudit,
    studioReview,
    studioPrOpen,
    studioPrMerge,
    studioSyncBranch,
    studioRevert,
    prdLinkIssue,
    researchSynthesize,
    prdDraft,
    prdRevise,
    decisionRevise,
    decisionRecord,
    designDraft,
    learningRecord,
    releasePublish,
    roadmapMove,
    backlogPrioritize,
    agentHandoff,
    agentSpawn,
    delegateOpenhands,
    webSearchTool,
    webFetchTool,
    webMapTool,
    webCrawlTool,
    missionPlan,
    missionDispatch,
    missionObserve,
    missionFinalize,
    criticEvaluate,
  ].map((t) => [t.name, t]),
);

/** Tool descriptors safe for inclusion in a system prompt (no schemas). */
export function describeToolsForPrompt(enabled: { tool_name: string; mode: string }[]): string {
  return enabled
    .filter((t) => t.mode !== "off")
    .map((t) => {
      const def = TOOL_REGISTRY[t.tool_name];
      if (!def) return null;
      return `- ${def.name} (${def.category}, ${t.mode}): ${def.description}`;
    })
    .filter(Boolean)
    .join("\n");
}
