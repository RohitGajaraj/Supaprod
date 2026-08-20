/**
 * Feature liveness: the registry.
 *
 * ONE ENTRY PER TRACKED CAPABILITY, and each entry answers one question: what
 * row does this feature write when it works? That is the whole contract. If a
 * capability cannot answer it, either the feature leaves no trace and needs one,
 * or it is not a capability, it is a code path.
 *
 * THIS FILE IS DATA. Nothing here queries anything. `probe.ts` executes the
 * declarations and `evaluate.ts` judges the results, so adding a capability is
 * an entry here and never a new query written by hand in a route.
 *
 * SEEDED WITH THE FIVE REAL CASES. On 2026-08-02 five separately shipped
 * features were found to be doing nothing in production, all in one session,
 * all passing typecheck and tests. They are entries 1 through 5 below, marked
 * with their finding, so the first run of this report reproduces the whole day.
 * Any future entry should be able to point at the same kind of sentence.
 *
 * WHAT DOES NOT BELONG HERE. Usage funnels. This report answers "is this
 * executing at all", not "how many people used it". A capability with one
 * execution a month is alive. A capability with none is the thing that cost us
 * the day.
 */

import { GRAPH_NODE_KINDS } from "@/lib/knowledge-graph-view";
import type { Cadence } from "./evaluate";
import type { ProbeSpec, IntegrityProbeSpec, VocabularyProbeSpec } from "./probe";

const MINUTE = 60_000;

export type TrackedCapability = {
  /** Stable id. Used as a React key and as the error surface when it dies. */
  id: string;
  /** What the capability does, in the operator's words, not the schema's. */
  title: string;
  /** What proves it ran. One line, readable on the surface next to the verdict. */
  proof: string;
  /** How often it should execute when it is working. */
  cadence: Cadence;
  /** Override the cadence when the real rhythm has a number rather than a word. */
  expectedIntervalMs?: number;
  /** Below this many executions in the window, cap the verdict at quiet. */
  minExpectedInWindow?: number;
  probe: ProbeSpec;
  /** Why it is tracked. Names the incident where there was one. */
  note?: string;
};

export type TrackedIntegrityCheck = {
  id: string;
  title: string;
  /** What reads the column, so a broken verdict says what has gone dark. */
  readBy: string;
  probe: IntegrityProbeSpec;
  toleratedNullRatio?: number;
  brokenNullRatio?: number;
  segmentMinRows?: number;
  note?: string;
};

export type TrackedVocabularyCheck = {
  id: string;
  title: string;
  /** Where the vocabulary lives, so the fix is one file away. */
  declaredBy: string;
  probe: VocabularyProbeSpec;
  note?: string;
};

/* ------------------------------------------------------------------ *
 * Capabilities
 * ------------------------------------------------------------------ */

export const TRACKED_CAPABILITIES: TrackedCapability[] = [
  // --- Finding 5, and the clearest instance of the whole class ---------------
  {
    id: "product-pulse-capture",
    title: "Product pulse, the in-product feedback widget",
    proof: "A signal row whose source is product_pulse",
    cadence: "on_demand",
    probe: {
      source: "table",
      table: "signals",
      timeColumn: "created_at",
      filters: [{ column: "source", op: "eq", value: "product_pulse" }],
    },
    note: "Finding 5, 2026-08-02. The widget wrote source_kind 'product_pulse', which the signals_source_kind_check constraint does not admit, so every insert failed and it had recorded nothing since the constraint landed. It was shipped, rendered, and clickable the whole time. On demand, so age alone can never call it dead: only a total absence of rows can, which is exactly what was true.",
  },

  // --- Finding 3, expressed as the capability rather than the vocabulary ------
  {
    id: "learning-graph-edges",
    title: "Recorded outcomes joining the knowledge graph",
    proof: "An artifact_lineage edge whose child is a learning",
    cadence: "weekly",
    probe: {
      source: "table",
      table: "artifact_lineage",
      timeColumn: "created_at",
      filters: [{ column: "child_kind", op: "eq", value: "learning" }],
    },
    note: "Finding 3, 2026-08-02. The graph could not name or focus a learning node, the second most commonest kind in the table, because three vocabularies each declared ten kinds against the thirteen the database held. This entry watches the edges; the vocabulary check below watches the disagreement that hid them. Reads the child side only, because the filter language here is one column at a time and learnings are written as the child of the thing they came from.",
  },
  {
    id: "learning-records",
    title: "Learnings written when a loop closes",
    proof: "A row in learnings",
    cadence: "weekly",
    probe: { source: "table", table: "learnings", timeColumn: "created_at" },
    note: "The product's central claim is that how a bet turned out changes the next call. If this is dead, the claim is dead, and nothing else on this page matters as much.",
  },

  // --- Finding 6, 2026-08-20: dead for fifteen days, and nothing here watched it
  {
    id: "eval-judging",
    title: "The judge scoring what the models actually produced",
    proof: "An ai_evals row written by the tick, not by the demo seed",
    cadence: "continuous",
    // cron.job 40, */30. Two fires an hour when it is working.
    expectedIntervalMs: 30 * MINUTE,
    probe: { source: "job_runs", jobName: "cron.eval-tick", successfulOnly: true },
    note: "THE ENTRY THIS FILE'S OWN PREMISE ASKED FOR, ARRIVING SIX INSTANCES LATE. This capability had never worked: ai_evals.workspace_id was NOT NULL defaulting to current_user_default_workspace(), which is null under the service role, so every insert the tick ever attempted failed the constraint -- and eval-tick.ts discarded the insert error and reported a concurrency race, so ~620 runs went green writing nothing. Then on 2026-08-05 its cron job began posting to /hooks/cadence-eval-tick, a route that does not exist, and a 404 never reaches withJobRun, so it stopped producing even a failing row. Fifteen days of total silence read as health on every surface, because nothing asked when this last ran. Fixed 2026-08-20 by 20260820072500 and 20260820074000; first real rows written at 02:30 that day. Registered so the next fifteen days are one query away instead of an accident.",
  },

  // --- The sweep that keeps findings 1, 2 and 4 fixed -------------------------
  {
    id: "embedding-sweep",
    title: "Embedding sweep, the job that vectors signals, themes and memories",
    proof: "A job_runs row for cron.embed-tick",
    cadence: "continuous",
    // Registered at */15 in migration 20260802160000_signal_embedding_sweeper.
    expectedIntervalMs: 15 * MINUTE,
    probe: { source: "job_runs", jobName: "cron.embed-tick", successfulOnly: true },
    note: "This one job is the standing fix for three of the five findings. Twelve modules insert into signals and only one stamps a vector inline, so the sweep is what makes the column true. If it stops, the three integrity checks below rot back to broken over days and nobody would otherwise notice until a search returned nothing.",
  },
  {
    id: "signal-embedding-calls",
    title: "The signal sweep actually calling the embedding provider",
    proof: "An ai_events row from the signal embedding backfill",
    cadence: "daily",
    probe: {
      source: "ai_events",
      surface: "embed",
      surfaceRef: "signal-embedding-backfill",
    },
    note: "The job running and the job doing something are different facts. A sweep with an empty backlog runs, succeeds, and embeds nothing, which is correct; a sweep whose provider key is dead also runs and succeeds, and embeds nothing, which is not. This row separates them.",
  },

  // --- Finding 2's user-visible outcome ---------------------------------------
  {
    id: "theme-attachment",
    title: "Signals attaching to a theme",
    proof: "A theme whose last_signal_at moved",
    cadence: "daily",
    probe: { source: "table", table: "themes", timeColumn: "last_signal_at" },
    note: "Finding 2, 2026-08-02. Theme growth shipped and could not attach a single signal, because match_themes filters on embedding IS NOT NULL and zero of the 181 themes had one. The matching logic was correct and unreachable. Watching last_signal_at watches the outcome rather than the code.",
  },

  // --- The floor everything else stands on -------------------------------------
  {
    id: "model-chokepoint",
    title: "Model calls through the chokepoint",
    proof: "Any ai_events row",
    cadence: "continuous",
    probe: { source: "table", table: "ai_events", timeColumn: "created_at" },
    note: "The canary. Every AI path in the product logs here, so silence means the whole engine stopped and not that one feature did. It leads the list only when it is the thing that is wrong.",
  },
  {
    id: "error-floor",
    title: "The in-house error floor accepting writes",
    proof: "A row in error_events",
    cadence: "on_demand",
    probe: { source: "table", table: "error_events", timeColumn: "occurred_at" },
    note: "An empty error store is either a quiet week or a write path that has never worked. This entry cannot tell those apart and does not pretend to: it goes dead only when there has never been a single row, which would mean the failure floor itself is the thing failing silently.",
  },

  // --- This report, watching itself -------------------------------------------
  {
    id: "liveness-tick",
    title: "This report running on its own",
    proof: "A job_runs row for cron.liveness-tick",
    cadence: "daily",
    probe: { source: "job_runs", jobName: "cron.liveness-tick" },
    note: "A liveness report you have to remember to open is itself a feature that can quietly do nothing. The tick route exists in the codebase; until its pg_cron registration is applied it has never run, and this entry will say so in the same words it uses for everything else. See LIVENESS-NEEDS-MIGRATION.md.",
  },
];

/* ------------------------------------------------------------------ *
 * Integrity checks: the column that exists, is read, and is never written
 * ------------------------------------------------------------------ */

export const TRACKED_INTEGRITY_CHECKS: TrackedIntegrityCheck[] = [
  {
    id: "signals-embedding",
    title: "Every signal carries a comparison vector",
    readBy: "match_signals and the clustering pass in cluster.server.ts",
    probe: { table: "signals", column: "embedding" },
    note: "Finding 1, 2026-08-02. The column existed, the RPC filtered on it being present, and nothing wrote it, so semantic search over signals returned zero every time and returned it correctly. Twelve of the thirteen insert paths still write a null vector and rely on the sweep, so a broken verdict here means the sweep stopped rather than that a call site regressed.",
  },
  {
    id: "themes-embedding",
    title: "Every theme carries a comparison vector",
    readBy: "match_themes, which filters on embedding IS NOT NULL",
    probe: { table: "themes", column: "embedding" },
    note: "Finding 2, 2026-08-02. 181 themes, zero embeddings. computeNovelty fails open and writes a null vector, so a provider blip became a permanent hole and theme growth could never attach anything.",
  },
  {
    id: "agent-memory-embedding",
    title: "Every agent memory is reachable by recall",
    readBy: "match_agent_memory, the Critic's precedent lookup, and novelty scoring",
    probe: {
      table: "agent_memory",
      column: "embedding",
      segmentColumn: "kind",
      // Declared rather than discovered. agent_memory.kind has no CHECK
      // constraint, so this list IS the contract, and a kind written by the
      // product but missing here is the same blind spot as a missing vocabulary
      // entry. Sources: reflection.server.ts, tools/registry.server.ts,
      // memory.server.ts, seed-workspace.server.ts, and the SQL seeds.
      segments: ["reflection", "note", "outcome", "fact", "preference", "precedent"],
    },
    note: "Finding 4, 2026-08-02. 249 of 421 rows had no vector, which reads like an ordinary backlog. The sharp fact is underneath it: note and precedent were 100 percent unembedded, so the memories a HUMAN curated were exactly the ones recall could never reach. The whole-table ratio hid that. This is why the check counts each kind on its own, and why one wholly empty kind outranks any ratio.",
  },
];

/* ------------------------------------------------------------------ *
 * Vocabulary checks: values the database holds and the code does not declare
 * ------------------------------------------------------------------ */

export const TRACKED_VOCABULARY_CHECKS: TrackedVocabularyCheck[] = [
  {
    id: "lineage-child-kind",
    title: "Every graph edge points at a kind the product can open",
    declaredBy: "GRAPH_NODE_KINDS in src/lib/knowledge-graph-view.ts",
    probe: {
      table: "artifact_lineage",
      column: "child_kind",
      // Imported, not copied. A vocabulary check that keeps its own copy of the
      // vocabulary is the bug it exists to catch.
      declared: GRAPH_NODE_KINDS,
    },
    note: "Finding 3, 2026-08-02. Three vocabularies each listed ten kinds while artifact_lineage held thirteen, so the graph could not name or focus a learning node and nothing anywhere raised an error. The check is a subtraction: rows minus the rows carrying a declared kind. Anything left over is written by the product and unreadable by it.",
  },
  {
    id: "lineage-parent-kind",
    title: "Every graph edge starts at a kind the product can open",
    declaredBy: "GRAPH_NODE_KINDS in src/lib/knowledge-graph-view.ts",
    probe: {
      table: "artifact_lineage",
      column: "parent_kind",
      declared: GRAPH_NODE_KINDS,
    },
    note: "The other end of the same edge. Kept separate rather than combined because a drift on one side only is a real and different finding: it tells you which direction of the graph is dark.",
  },
];
