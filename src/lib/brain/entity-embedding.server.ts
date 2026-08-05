/**
 * Entity embeddings: the vectors that make the JUDGMENT itself findable by meaning.
 *
 * THE GAP THIS CLOSES. Signals, themes and memories all have an `embedding` column
 * and a sweeper that fills it. `decisions`, `opportunities`, `prds` and `learnings`
 * had no embedding column at all. So the four tables that hold what a product team
 * actually decided, bet on, specified and learned were the four that semantic recall
 * could not reach, and every "have we thought about this before" question was
 * answered by proxy through `agent_memory` rather than by the entity that holds the
 * judgment. For a product whose claim is compounding judgment, that is the wrong way
 * round. Live counts when this was written: decisions 173, opportunities 249,
 * prds 81, learnings 119.
 *
 * WHY THIS FILE IS TABLE-DRIVEN AND THE OTHER THREE ARE NOT. There were already
 * three near-identical sweepers (`sources/signal-embedding.server.ts`,
 * `brain/theme-embedding.server.ts`, `brain/memory-embedding.server.ts`) and the
 * third one's own comment says: "if a fourth is ever needed, generalise these into
 * one table-driven helper rather than copying again". Four more were needed. So the
 * loop lives once, here, and each entity is DATA: a table, the columns its text is
 * built from, an ordering, and a surface. Adding a fifth entity is a spec, not a file.
 *
 * The three existing sweepers are deliberately left alone. `signal-embedding.server.ts`
 * lives outside this change's blast radius; `theme-embedding.server.ts` stamps a second
 * column (`scored_at`) on update, which this helper has no need to support for anyone
 * else and which would mean adding an unused escape hatch; and `memory-embedding.server.ts`
 * had its select predicate changed hours ago and the result of that change is still
 * unknown, so rewriting it now would destroy the evidence. All three CAN be expressed
 * as specs here later, and the shape below is the one they would take.
 *
 * The mechanism is unchanged from the three that proved out, because that mechanism is
 * the whole point:
 *
 *   - Driven by TABLE STATE (`embedding is null`), never by call sites. Every writer
 *     that exists, every writer added later, and every row written before this shipped
 *     is covered by the same query. A call-site fix would leave the other writers
 *     stamping NULL.
 *   - Batched PER OWNER, never mixed. `embedTexts` resolves a BYO provider key from
 *     `userId`, so a mixed batch would send one workspace's decisions to another
 *     workspace's API key and misattribute the cost on the ai_events row.
 *   - Fail-open per owner: one broken key stalls that workspace's backfill and nobody
 *     else's, and the rows stay NULL so the next tick retries them.
 *   - Failures are REPORTED to `error_events`, not written to a console nobody reads.
 *     That is the lesson from the memory sweeper, which failed for hours today while
 *     the tick kept returning ok, because a sweeper that had never once succeeded and
 *     a sweeper with nothing to do look identical from the outside.
 *
 * Server-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  embedTexts,
  embedThroughChokepointWithModel,
  type EmbedResult,
} from "@/lib/rag/embed.server";
import { recordErrorEvent } from "@/lib/observability/errors";
import { cleanTitle } from "@/components/plan/format";

/** Chars of any one entity fed to the embedder. Same budget the signal and theme
 *  builders use, so vectors across the brain stay comparable in how much text
 *  produced them. */
const MAX_EMBED_CHARS = 8_000;

/** Rows per entity per tick. Four sweeps share the tick with the signal, theme and
 *  memory sweeps, so each stays modest. The whole standing backlog (622 rows across
 *  the four tables) drains in about four ticks, one hour at the 15 minute cadence. */
export const ENTITY_EMBED_BATCH = 64;

/**
 * The tag written when a vector was produced but the model that produced it is not
 * known. Never write NULL in that case: the sweeper's select treats a null tag as work
 * to do, so a null-tagged row would be re-selected and re-embedded on every tick with
 * no way to ever drain. A named sentinel terminates, excludes the row from model-scoped
 * recall (which is the correct outcome for a vector of unknown provenance), and can be
 * counted, so a standing non-zero total is a visible defect rather than a silent one.
 */
export const UNKNOWN_EMBEDDING_MODEL = "unknown";

/* -------------------------------------------------------------------------- */
/* Text builders. Pure, exported, and pinned by tests.                        */
/*                                                                            */
/* What represents an entity in vector space is the decision that determines  */
/* whether recall is any good, so each one below states what it includes and   */
/* what it deliberately leaves out. The rule running through all four: embed   */
/* the SUBJECT, never the FACETS. Status, verdict, ICE numbers and dates are   */
/* things you filter on. Put them in the vector and every row that shares a    */
/* status clusters with every other row that shares it, which buries the       */
/* subject the query was actually about.                                      */
/* -------------------------------------------------------------------------- */

/** Collapse whitespace so the same text stored with different wrapping embeds
 *  identically. Two records of the same call must not land in two places. */
export function collapseText(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Join the parts that exist, dropping empties and exact repeats.
 *
 * Dropping empties matters: a row with no body must not embed as "\n\n<title>",
 * which would drag every body-less row of a table toward the same corner of
 * vector space regardless of what it says. Dropping repeats matters because a
 * body that merely restates the title adds nothing and spends the budget twice.
 */
function joinParts(parts: string[], maxChars: number = MAX_EMBED_CHARS): string {
  const kept: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (kept.includes(p)) continue;
    kept.push(p);
  }
  return kept.join("\n\n").slice(0, maxChars);
}

/**
 * A DECISION is its title plus its rationale.
 *
 * The title names the call ("Ship the weekly digest behind a flag"). The rationale
 * is the judgment: the WHY, and the only part of the row that answers the question
 * people actually bring to a decision record, which is never "what did we decide"
 * but "why did we decide it, and does that reasoning still hold".
 *
 * `alternatives_considered` is deliberately EXCLUDED even though it is the richest
 * remaining column. It holds the paths NOT taken, so including it would make a
 * decision match queries about its own rejected options: ask "did we consider
 * Postgres full text search" and you would surface the decision that rejected it
 * with the same strength as one that adopted it, with no way to tell which from
 * the similarity score. That is worse than not finding it. `status` is a facet.
 */
export function decisionEmbeddingText(title: string | null, rationale: string | null): string {
  // The retired "[auto] " marker must never be embedded. It is a dedup key,
  // so it carries no meaning, and because EVERY auto-raised decision shared
  // it, it pulled them together in vector space for a reason that has nothing
  // to do with what they say. Rows embedded before this are stale and need a
  // recompute, not just a strip.
  return joinParts([collapseText(cleanTitle(title)), collapseText(rationale)]);
}

/**
 * An OPPORTUNITY is its title plus the problem.
 *
 * An opportunity is a bet on a PROBLEM, and `problem` is the column that states it
 * (NOT NULL DEFAULT '', so it is present on nearly every row). Title plus problem is
 * the need, in the words whoever framed it used.
 *
 * `hypothesis` is excluded, and this is the sharp call. A hypothesis is the proposed
 * FIX, not the need. Fold it in and two opportunities that propose similar fixes to
 * unrelated problems start to look alike, which is exactly the collision this store
 * must not make when the question is "have we already framed this problem". Keep the
 * vector on the need; the fix is what the PRD is for. `target_user` is excluded for a
 * different reason: it is a short segment label from a small vocabulary, so it repeats
 * across hundreds of rows and pulls them together on a word that discriminates nothing.
 * The problem statement names its user anyway. ICE numbers are facets and never text.
 */
export function opportunityEmbeddingText(title: string | null, problem: string | null): string {
  return joinParts([collapseText(title), collapseText(problem)]);
}

/** Chars of PRD body that reach the vector. See `prdEmbeddingText`. */
export const PRD_LEAD_CHARS = 4_000;

/**
 * Flatten markdown to the prose underneath it.
 *
 * A PRD body is markdown, and the markup is noise in vector space: heading hashes,
 * bullets, table pipes and URL slugs are tokens that every PRD in the workspace
 * shares, so they push all 81 of them together. Code fences go entirely, because an
 * implementation snippet is not what anyone searches a PRD for and it is the densest
 * text in the file. Link labels are kept and their URLs dropped, since a repo URL
 * contributes no meaning and its path segments collide across every PRD that links
 * to the same repo.
 *
 * Underscores are left alone on purpose, unlike asterisks and backticks: stripping
 * them would turn `body_md` into `bodymd` and break the identifiers that are often
 * the most searchable nouns in a technical PRD. Underscore emphasis is rarer than
 * snake_case here, so this trade favours the identifiers.
 */
export function flattenMarkdown(md: string | null): string {
  return (md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^\s{0,3}([-*_]\s*){3,}$/gm, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+[.)]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A PRD is its title plus the LEAD of its body, not the whole body.
 *
 * Two reasons the whole body is wrong. First, chunk-level retrieval over PRD bodies
 * already exists: `rag/indexer.server.ts` writes every PRD into `rag_chunks` as
 * `source_kind: "prd"`, and that store answers "what passage is relevant to this
 * question". `prds.embedding` answers a different question, "which PRD is this
 * about", and one 1536-dimension vector over a whole document averages the answer
 * into mush. Two stores, two jobs, same rule the signal file states for
 * `signals.embedding` versus `rag_chunks`.
 *
 * Second, past the opening sections a PRD stops being about itself. Acceptance
 * criteria, rollout steps and QA checklists are written in a vocabulary that is
 * near identical across every PRD ever written ("must", "should", "rollback",
 * "verify"), so including them makes all 81 converge on each other. The part a
 * reader would search for is the top: what this is for and who it is for. That is
 * what `PRD_LEAD_CHARS` keeps.
 *
 * A PRD body usually opens with an H1 restating the title, so a leading repeat of
 * the title is dropped rather than embedded twice.
 */
export function prdEmbeddingText(title: string | null, bodyMd: string | null): string {
  const t = collapseText(title);
  let lead = flattenMarkdown(bodyMd);
  if (t && lead.toLowerCase().startsWith(t.toLowerCase())) {
    lead = lead.slice(t.length).replace(/^[\s:.,;-]+/, "");
  }
  return joinParts([t, lead.slice(0, PRD_LEAD_CHARS)]);
}

/**
 * A LEARNING is its summary.
 *
 * `summary` is the sentence someone wrote about what actually happened, and it is
 * the whole of what a learning means. The rest of the row is facets.
 *
 * `verdict` is excluded and would actively hurt: it takes three values
 * (validated / missed / mixed), so embedding it prepends one of three tokens to all
 * 119 rows and clusters learnings by outcome rather than by subject. Ask "what did
 * we learn about onboarding" and you would get whatever shares a verdict. Filter on
 * verdict, never embed it. `metric_value` is a bare number and embeds as noise.
 * `metric_label` was the one real candidate, since "activation rate" is a searchable
 * noun, but a label without its value is a fragment and the summary that a human
 * wrote almost always names the metric already, so it earns nothing it does not
 * already have.
 */
export function learningEmbeddingText(summary: string | null): string {
  return collapseText(summary).slice(0, MAX_EMBED_CHARS);
}

/* -------------------------------------------------------------------------- */
/* The specs. Each entity is data.                                            */
/* -------------------------------------------------------------------------- */

/** A row as it comes back from the narrow select: always `id` and `user_id`, plus
 *  whatever the spec asked for. */
export type EntityRow = { id: string; user_id: string } & Record<string, unknown>;

/** Read a column as a string, or null if it is absent or not text. Keeps every
 *  builder total against a row shape the compiler cannot check (the select column
 *  list is a runtime string). */
function strCol(row: EntityRow, key: string): string | null {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

export type EntityEmbeddingSpec = {
  /** Table to sweep. Needs `id`, `user_id`, the ordering column, and a nullable
   *  `vector(1536) embedding`. */
  table: string;
  /** The columns the text is built from, beyond id and user_id. Explicit so the
   *  select stays narrow and so the spec states, in one place, exactly which parts
   *  of the row reach the vector. */
  columns: readonly string[];
  /** How the backlog drains. */
  order: { column: string; ascending: boolean };
  /** `ai_events.surface_ref`, so embedding spend is attributable per entity. */
  surfaceRef: string;
  /** `error_events.surface`. Distinct per entity so a failing sweep is nameable
   *  from the outside without reading the code. */
  errorSurface: string;
  /** Rows per sweep. */
  batch: number;
  /** Pure: what this row looks like in vector space. */
  text: (row: EntityRow) => string;
};

/**
 * All four sweeps drain NEWEST FIRST, unlike the signal sweeper's oldest-first.
 *
 * The signal backlog is history to be caught up on, so draining it deterministically
 * from the oldest end is right. These four are the live working record of a workspace
 * that someone is using right now, and the judgment most likely to be searched for is
 * the judgment most recently recorded. It also fails better: if embedding stays broken
 * and the backlog never fully drains, newest-first means the rows that did get covered
 * are the ones worth having.
 */
export const DECISION_EMBEDDING_SPEC: EntityEmbeddingSpec = {
  table: "decisions",
  columns: ["title", "rationale"],
  order: { column: "created_at", ascending: false },
  surfaceRef: "decision-embedding-backfill",
  errorSurface: "cron.embed-tick.decisions",
  batch: ENTITY_EMBED_BATCH,
  text: (r) => decisionEmbeddingText(strCol(r, "title"), strCol(r, "rationale")),
};

export const OPPORTUNITY_EMBEDDING_SPEC: EntityEmbeddingSpec = {
  table: "opportunities",
  columns: ["title", "problem"],
  order: { column: "created_at", ascending: false },
  surfaceRef: "opportunity-embedding-backfill",
  errorSurface: "cron.embed-tick.opportunities",
  batch: ENTITY_EMBED_BATCH,
  text: (r) => opportunityEmbeddingText(strCol(r, "title"), strCol(r, "problem")),
};

export const PRD_EMBEDDING_SPEC: EntityEmbeddingSpec = {
  table: "prds",
  columns: ["title", "body_md"],
  order: { column: "created_at", ascending: false },
  surfaceRef: "prd-embedding-backfill",
  errorSurface: "cron.embed-tick.prds",
  batch: ENTITY_EMBED_BATCH,
  text: (r) => prdEmbeddingText(strCol(r, "title"), strCol(r, "body_md")),
};

export const LEARNING_EMBEDDING_SPEC: EntityEmbeddingSpec = {
  table: "learnings",
  columns: ["summary"],
  order: { column: "created_at", ascending: false },
  surfaceRef: "learning-embedding-backfill",
  errorSurface: "cron.embed-tick.learnings",
  batch: ENTITY_EMBED_BATCH,
  text: (r) => learningEmbeddingText(strCol(r, "summary")),
};

/** The sweep list the tick walks. Order is the lifecycle order, opportunity to
 *  decision to prd to learning, so the tick's response reads like the loop. */
export const ENTITY_EMBEDDING_SPECS: readonly EntityEmbeddingSpec[] = [
  OPPORTUNITY_EMBEDDING_SPEC,
  DECISION_EMBEDDING_SPEC,
  PRD_EMBEDDING_SPEC,
  LEARNING_EMBEDDING_SPEC,
];

/* -------------------------------------------------------------------------- */
/* The one sweeper.                                                           */
/* -------------------------------------------------------------------------- */

export type EntityBackfillResult = {
  table: string;
  /** Rows the select returned. */
  scanned: number;
  /** Rows dropped before embedding because they have no text to embed. Counted
   *  rather than silently swallowed: a table with a standing non-zero `skipped`
   *  is a table whose rows will be re-selected forever and never drain. */
  skipped: number;
  embedded: number;
  failed: number;
};

type EmbedFn = typeof embedTexts;
type ReportFn = typeof recordErrorEvent;

/**
 * Embed stored rows of one table that have no vector yet.
 *
 * `opts.embed` and `opts.report` are test seams, following the same injectable
 * pattern `recordErrorEvent` and `recordStageEvent` already use in this codebase.
 * Production passes neither.
 */
export async function backfillEntityEmbeddings(
  db: SupabaseClient,
  spec: EntityEmbeddingSpec,
  opts: { limit?: number; embed?: EmbedFn; report?: ReportFn } = {},
): Promise<EntityBackfillResult> {
  const limit = opts.limit ?? spec.batch;
  const embed = opts.embed ?? embedTexts;
  const report = opts.report ?? recordErrorEvent;

  // A row needs work when it has NO VECTOR, or a vector with NO MODEL TAG.
  //
  // The second half is what makes this self-healing, and it was learned the hard way
  // on 2026-08-03. `embedding IS NULL` alone means a row carrying a vector but no tag
  // is invisible to every sweeper, permanently: it is not in the backlog and never
  // enters it, so the only repair is a human noticing and running UPDATE by hand. That
  // is the "someone has to remember" failure this file's own header argues against.
  // Untagged rows are not hypothetical, they are produced whenever a vector is written
  // by a build that predates model tagging.
  //
  // Re-embedding such a row rather than merely stamping a guessed tag is the point: it
  // makes the vector and the tag agree by construction, instead of asserting a model
  // for a vector we did not produce. At the measured rate (211,358 tokens for a full
  // month of live traffic) the extra calls cost cents.
  const { data, error } = await db
    .from(spec.table)
    .select(["id", "user_id", ...spec.columns].join(", "))
    .or("embedding.is.null,embedding_model.is.null")
    .order(spec.order.column, { ascending: spec.order.ascending })
    .limit(limit);
  if (error) {
    throw new Error(`backfillEntityEmbeddings(${spec.table}) select failed: ${error.message}`);
  }

  const all = (data ?? []) as unknown as EntityRow[];

  // Build the text up front, before grouping, so a row that cannot be embedded at
  // all is dropped ONCE, visibly, and counted. The memory sweeper learned this the
  // hard way by pushing the same filter into the select, where an unexpected
  // predicate returned nothing and the sweeper looked idle instead of broken.
  const prepared = all
    .map((row) => ({ id: row.id, userId: row.user_id, text: spec.text(row) }))
    .filter((r) => typeof r.userId === "string" && r.userId.length > 0 && r.text.length > 0);
  const skipped = all.length - prepared.length;
  if (prepared.length === 0) {
    return { table: spec.table, scanned: all.length, skipped, embedded: 0, failed: 0 };
  }

  // Per owner, never a mixed batch: `embedTexts` resolves a BYO provider key from
  // userId, so a mixed batch would send one workspace's text to another workspace's
  // key and misattribute the cost.
  const byUser = new Map<string, typeof prepared>();
  for (const r of prepared) {
    const g = byUser.get(r.userId);
    if (g) g.push(r);
    else byUser.set(r.userId, [r]);
  }

  let embedded = 0;
  let failed = 0;
  for (const [userId, group] of byUser) {
    let result: EmbedResult | { vectors: number[][]; model: "" };
    try {
      // Use embedThroughChokepointWithModel in production (model-tracked); fall back
      // to the injected embed function for tests (which only returns vectors).
      if (opts.embed) {
        const vectors = await opts.embed(
          group.map((r) => r.text),
          { supabase: db, userId, surfaceRef: spec.surfaceRef },
        );
        result = { vectors, model: "" };
      } else {
        result = await embedThroughChokepointWithModel(
          group.map((r) => r.text),
          { supabase: db, userId, surfaceRef: spec.surfaceRef },
        );
      }
    } catch (e) {
      // REPORTED, not just logged. console.error is not observability; error_events
      // is. This owner's batch failed (provider down, bad BYO key, budget), so leave
      // the rows NULL for the next tick and keep sweeping other owners: one broken
      // key must not stall everyone else's backfill.
      console.error(`backfillEntityEmbeddings(${spec.table}) embed failed for user`, userId, e);
      void report(e, {
        surface: spec.errorSurface,
        user_id: userId,
        failure_kind: "embed_failed",
        extras: { table: spec.table, rows: group.length },
      });
      failed += group.length;
      continue;
    }

    let writeFailures = 0;
    let firstWriteError: string | null = null;
    for (let i = 0; i < group.length; i++) {
      const vec = result.vectors[i];
      if (!vec) {
        failed++;
        writeFailures++;
        if (firstWriteError === null) firstWriteError = "embedder returned no vector for a row";
        continue;
      }
      // Tag the vector with the model that produced it. Production always has the
      // namespaced model from the chokepoint (e.g. "cohere/embed-v4.0"); the injected
      // test path has no model tracking and yields an empty string.
      //
      // NEVER write NULL here while writing a vector. This used to be
      // `result.model || null`, which is a live infinite-loop hazard now that the
      // select above also picks up rows WHERE embedding_model IS NULL: a row written
      // with a null tag would be re-selected on every tick, re-embedded, and written
      // back with a null tag again, burning provider calls forever and never draining.
      // A row must never be left in a state this sweeper is guaranteed to reselect.
      //
      // So an unknown model records itself as UNKNOWN_EMBEDDING_MODEL rather than as
      // nothing. That is honest (we genuinely do not know the vector space), it
      // terminates, and because a model-scoped query filters on a specific model these
      // rows are correctly excluded from recall rather than silently compared against
      // vectors from another model. It is also greppable, so a standing count of them
      // is a visible defect instead of an invisible one.
      const { error: upErr } = await db
        .from(spec.table)
        .update({
          embedding: vec as unknown as string,
          embedding_model: result.model || UNKNOWN_EMBEDDING_MODEL,
        })
        .eq("id", group[i].id);
      if (upErr) {
        failed++;
        writeFailures++;
        if (firstWriteError === null) firstWriteError = upErr.message;
      } else {
        embedded++;
      }
    }

    if (writeFailures > 0) {
      // ONE event for the group, not one per row. `recordErrorEvent` has a 40 writes
      // per minute storm guard per isolate, so 64 identical rows would spend the whole
      // budget and then mask a genuinely different failure elsewhere in the same tick.
      console.error(
        `backfillEntityEmbeddings(${spec.table}) wrote ${writeFailures} failures for user`,
        userId,
        firstWriteError,
      );
      void report(
        new Error(
          `${spec.table} embedding write failed for ${writeFailures} of ${group.length} rows: ${firstWriteError}`,
        ),
        {
          surface: spec.errorSurface,
          user_id: userId,
          failure_kind: "write_failed",
          extras: { table: spec.table, rows: group.length, write_failures: writeFailures },
        },
      );
    }
  }

  return { table: spec.table, scanned: all.length, skipped, embedded, failed };
}
