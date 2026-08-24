/**
 * Search the workspace's OWN RECORDS, because the index has never held them.
 *
 * ── THE FINDING THIS EXISTS FOR, AND IT IS THE BIGGEST ONE ─────────────────
 *
 * `workspace.search` describes itself as "Semantic search across the workspace
 * (docs, PRDs, notes, signals, meetings)". It searches `rag_chunks`, and nothing
 * else. Measured on the live database 2026-08-24:
 *
 *   SELECT source_kind, count(*), count(embedding) FROM rag_chunks GROUP BY 1;
 *   -- finding | 17 | 1
 *
 * **Seventeen rows in the entire index, all of one kind, and one of them has an
 * embedding.** And they are not content. Their titles are:
 *
 *   "sso"
 *   "what happened with DEC-6416AD?"
 *   "Summarise what is waiting on me and what shipped this week."
 *   "can we add the dark mode to the app?"
 *
 * **Those are the QUESTIONS people asked. The index has been storing the
 * prompts, never the answers.** Not one signal, PRD, decision, theme or learning
 * has ever been indexed. So `workspace.search` cannot return a signal. Not
 * "rarely" -- it is structurally incapable of it, and has been for as long as
 * the tool has existed.
 *
 * ── WHAT THAT COST, WHICH IS EVERYTHING ───────────────────────────────────
 *
 * Every Discover agent reaches for `workspace.search` first. It answered
 * "nothing here" every time, and every agent did the correct thing with that
 * answer: refused to invent evidence and reported the workspace empty. Then the
 * next station read that report, and Decide declined for want of evidence.
 *
 * Measured in the one live workspace `0b792d52`:
 *
 *   - **72 signals exist**, from 8 sources, including a Canny request titled
 *     "Add Dark Mode & System Preference theme in addition to the light theme."
 *   - **52 of those 72 are `source: 'agent'`** and are the agents' own notes
 *     recording that they could not find anything. **The loop has been indexing
 *     its own emptiness back into itself.**
 *   - 18 tracks are stalled at Discover.
 *   - The live run that prompted this fix searched
 *     `'dark mode OR system preference OR theme OR canny'` and got `[]`, with the
 *     matching row sitting in `signals` the whole time.
 *
 * **The agents were right every single time. The tool was blind.** One of the
 * workspace's own internal-audit signals already says this in as many words --
 * *"A tool that cannot ask the question reports the emptiness as fact"* -- and
 * nothing was done about it.
 *
 * ── WHY THIS SEARCHES TABLES RATHER THAN FIXING THE INDEXER ────────────────
 *
 * An indexer is the right long-term answer and it is a bigger piece of work: it
 * needs a backfill, an embedding budget, and a write path on every one of these
 * tables. This is the correct answer regardless of whether that gets built,
 * because **the tables are the source of truth and the index is a cache.** A
 * search that can only read the cache reports a cold cache as an empty world,
 * which is the defect above. The index path still runs first and still wins on
 * ranking; this is what happens when it comes back short.
 *
 * ── TENANT ISOLATION IS THE FIRST RULE HERE, NOT AN AFTERTHOUGHT ───────────
 *
 * These tables are read with whatever client the tool was handed, and on the
 * autonomous driver's path that is a SERVICE-ROLE client with no RLS. So an
 * unscoped query here would read every tenant's evidence. **Every query is
 * scoped by `workspace_id`, and a call with no workspace returns nothing rather
 * than everything.** Failing closed is the only acceptable direction for a
 * search that an agent can aim.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { ARTIFACT_SOURCE } from "@/lib/spine/chain";

/** One hit, shaped like the chunks `workspace.search` already returns. */
export type RecordHit = {
  kind: string;
  id: string;
  title: string;
  snippet: string;
  score: number;
};

/**
 * The kinds worth searching, and the reason the list is not "all of them".
 *
 * These five are the workspace's KNOWLEDGE: what was observed, how it was
 * grouped, what was decided, what was specified, and what was learned. The
 * others in `ARTIFACT_SOURCE` are containers or addresses -- a mission is a
 * container, a deployment is a URL, a task is a unit of work rather than a
 * statement about the world -- and returning them to an agent asking "what do we
 * know about dark mode" would be noise wearing the shape of evidence.
 */
export const SEARCHABLE_KINDS = ["signal", "theme", "decision", "prd", "learning"] as const;

/**
 * The terms worth matching on, from a query written by a model.
 *
 * Agents write queries like `dark mode OR system preference OR theme OR canny`.
 * Boolean words are not search terms and short words match everything, so both
 * are dropped. Bounded to six because this becomes one `or(...)` per kind and an
 * unbounded query would build an unbounded filter.
 */
export function searchTerms(query: string): string[] {
  const STOP = new Set(["and", "or", "not", "the", "for", "with", "from", "into", "about"]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of query.split(/[^A-Za-z0-9]+/)) {
    const w = raw.trim().toLowerCase();
    if (w.length <= 3 || STOP.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length === 6) break;
  }
  return out;
}

/** PostgREST `or()` treats , and ) as syntax, so a term carrying them is dropped. */
function safeTerm(term: string): boolean {
  return !/[,()*]/.test(term);
}

/**
 * What this workspace actually holds on this subject.
 *
 * Returns `[]` on any failure, including a missing workspace. This sits behind a
 * read tool an agent calls speculatively; it must never throw into a station's
 * run, and it must never widen its scope to compensate for a bad argument.
 */
export async function searchWorkspaceRecords(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
  query: string,
  limit = 5,
): Promise<RecordHit[]> {
  // THE ISOLATION GATE. No workspace, no results -- never "all workspaces".
  if (!workspaceId) return [];

  const terms = searchTerms(query).filter(safeTerm);
  if (terms.length === 0) return [];

  const hits: RecordHit[] = [];

  await Promise.all(
    SEARCHABLE_KINDS.map(async (kind) => {
      const source = ARTIFACT_SOURCE[kind];
      if (!source) return;
      const cols = ["id", `title:${source.title}`];
      if (source.body) cols.push(`body:${source.body}`);

      // One filter per term per column, OR'd. A row matching any term is a
      // candidate; ranking below decides which candidates survive.
      const filters = terms.flatMap((t) =>
        source.body
          ? [`${source.title}.ilike.%${t}%`, `${source.body}.ilike.%${t}%`]
          : [`${source.title}.ilike.%${t}%`],
      );

      try {
        const { data, error } = await supabase
          .from(source.table)
          .select(cols.join(","))
          .eq("workspace_id", workspaceId)
          .or(filters.join(","))
          .limit(limit * 2);
        if (error || !data) return;

        for (const r of data as unknown as Array<{
          id: string;
          title: string | null;
          body?: string | null;
        }>) {
          const title = r.title ?? "untitled";
          const body = (r.body ?? "").trim();
          hits.push({
            kind,
            id: r.id,
            title,
            snippet: body.slice(0, 280),
            score: scoreHit(terms, title, body),
          });
        }
      } catch {
        // A table this deployment does not have, or a column rename. Silent by
        // design: one missing kind must not take the other four with it.
      }
    }),
  );

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * How well a row answers the query, without an embedding.
 *
 * Deliberately crude and deliberately BELOW the index's own scores, so a real
 * semantic hit always outranks a keyword one when the index has anything to say.
 * A term in the title counts for more than a term in the body, because a title
 * is what the row is ABOUT and a body may only mention it.
 */
export function scoreHit(terms: readonly string[], title: string, body: string): number {
  const t = title.toLowerCase();
  const b = body.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (t.includes(term)) score += 2;
    else if (b.includes(term)) score += 1;
  }
  // Normalised into 0..0.35 so it can never beat a genuine ANN similarity.
  const ceiling = terms.length * 2;
  return ceiling === 0 ? 0 : Number(((score / ceiling) * 0.35).toFixed(3));
}
