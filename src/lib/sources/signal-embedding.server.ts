/**
 * Signal embeddings - the vector that makes a signal comparable to other signals.
 *
 * This is NOT the RAG index. `rag_chunks` holds many chunk vectors per source and
 * answers "what text is relevant to this question". `signals.embedding` holds ONE
 * vector per signal and answers "is this the same thing we already heard" - it is
 * what `match_signals` reads, and what near-duplicate detection and theme growth
 * are built on. Two stores, two jobs; do not collapse them.
 *
 * Why a sweeper and not just a call-site fix: `sink.server.ts` describes itself as
 * the single write path into `public.signals`, but it is not - twelve modules insert
 * into that table directly (onboarding, meetings, audio, analytics, mcp, pulse, the
 * sense/steward ticks, the public ingest route, and discovery's own CRUD). Stamping
 * the vector at one call site would leave eleven writing NULL. So correctness lives
 * in `backfillSignalEmbeddings`, which is driven by TABLE STATE (`embedding is null`)
 * and therefore cannot be bypassed by a write path that has never heard of it - and
 * which backfills the rows already stored, for free, by the same query.
 *
 * `attachEmbeddings` is then only a latency optimisation for the hot connector path,
 * so a freshly sensed signal is comparable immediately instead of at the next tick.
 * Both are fail-open: a signal that cannot be embedded is still a signal, and the
 * sweeper will retry it on the next pass.
 *
 * Server-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/rag/embed.server";

/** Chars of a signal fed to the embedder. Titles carry most of the discriminating power. */
const MAX_EMBED_CHARS = 8_000;

/** Rows embedded per sweeper batch. Bounded so one tick stays inside the Worker CPU budget. */
export const EMBED_SWEEP_BATCH = 96;

/**
 * The text that represents a signal in vector space.
 *
 * Pure, and exported so the shape is pinned by a test: title first (it is the
 * strongest discriminator and survives truncation), then content. Whitespace is
 * collapsed so the same complaint arriving from two sources with different wrapping
 * produces the same vector.
 */
export function signalEmbeddingText(title: string | null, content: string | null): string {
  const t = (title ?? "").replace(/\s+/g, " ").trim();
  const c = (content ?? "").replace(/\s+/g, " ").trim();
  // Join only the parts that exist: a signal with no title (some webhook payloads)
  // must not embed as "\n\n<content>", which would drag every title-less signal
  // toward the same corner of vector space regardless of what it says.
  // Content that merely repeats the title adds nothing and wastes the budget.
  const parts = c && c !== t ? [t, c] : [t];
  return parts.filter(Boolean).join("\n\n").slice(0, MAX_EMBED_CHARS);
}

type EmbeddableRow = { title: string; content: string };

/**
 * Attach embeddings to prepared rows before insert (hot path, connectors).
 *
 * Fail-open by contract: if the embedder is down, over budget, or missing a key,
 * every row comes back unchanged and the caller inserts it without a vector. The
 * sweeper picks it up later. An embedding outage must never stop signal intake.
 */
export async function attachEmbeddings<T extends EmbeddableRow>(
  rows: T[],
  opts: { supabase?: SupabaseClient; userId?: string } = {},
): Promise<Array<T & { embedding?: string }>> {
  if (rows.length === 0) return rows;
  try {
    const vectors = await embedTexts(
      rows.map((r) => signalEmbeddingText(r.title, r.content)),
      { ...opts, surfaceRef: "signal-embedding" },
    );
    return rows.map((r, i) =>
      vectors[i] ? { ...r, embedding: vectors[i] as unknown as string } : r,
    );
  } catch (e) {
    console.error("attachEmbeddings failed, inserting without vectors:", e);
    return rows;
  }
}

export type BackfillResult = { scanned: number; embedded: number; failed: number };

/**
 * Embed stored signals that have no vector yet.
 *
 * This is the guarantee. It reads table state, so it covers every write path that
 * exists today, every write path added later, and every row written before signal
 * embeddings shipped. Ordered oldest-first so a backlog drains deterministically
 * rather than starving old rows behind a busy connector.
 */
export async function backfillSignalEmbeddings(
  db: SupabaseClient,
  limit: number = EMBED_SWEEP_BATCH,
): Promise<BackfillResult> {
  const { data, error } = await db
    .from("signals")
    .select("id, title, content, user_id")
    .is("embedding", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(`backfillSignalEmbeddings select failed: ${error.message}`);

  const rows = (data ?? []) as Array<{
    id: string;
    title: string | null;
    content: string | null;
    user_id: string;
  }>;
  if (rows.length === 0) return { scanned: 0, embedded: 0, failed: 0 };

  // Embed PER OWNER, never across the whole batch. `embedTexts` resolves a BYO
  // provider key from `opts.userId`, so a mixed batch would send one workspace's
  // signal text to another workspace's API key, a real cross-tenant leak, and
  // would misattribute the cost on the ai_events row. Grouping keeps both honest.
  const byUser = new Map<string, typeof rows>();
  for (const r of rows) {
    const group = byUser.get(r.user_id);
    if (group) group.push(r);
    else byUser.set(r.user_id, [r]);
  }

  let embedded = 0;
  let failed = 0;
  for (const [userId, group] of byUser) {
    let vectors: number[][];
    try {
      vectors = await embedTexts(
        group.map((r) => signalEmbeddingText(r.title, r.content)),
        { supabase: db, userId, surfaceRef: "signal-embedding-backfill" },
      );
    } catch (e) {
      // This owner's batch failed (provider down / bad BYO key / budget). Leave the
      // rows unset so the next tick retries them, and keep sweeping other owners.
      // One workspace's broken key must not stall everyone else's backfill.
      console.error("backfillSignalEmbeddings embed failed for user", userId, e);
      failed += group.length;
      continue;
    }
    for (let i = 0; i < group.length; i++) {
      const vec = vectors[i];
      if (!vec) {
        failed++;
        continue;
      }
      const { error: upErr } = await db
        .from("signals")
        .update({ embedding: vec as unknown as string })
        .eq("id", group[i].id);
      if (upErr) {
        console.error("backfillSignalEmbeddings update failed", group[i].id, upErr.message);
        failed++;
      } else {
        embedded++;
      }
    }
  }
  return { scanned: rows.length, embedded, failed };
}
