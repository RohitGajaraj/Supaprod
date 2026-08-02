/**
 * Memory embeddings, the backfill.
 *
 * `agent_memory` is the layer that pushes what happened before into an agent's
 * prompt and into the Critic's precedent. `recallMemoryRefs` reaches it through
 * `match_agent_memory`, which, like every other vector RPC here, filters on
 * `embedding IS NOT NULL`. A memory with no vector is therefore not a weak
 * memory, it is an absent one: it can never be recalled by meaning, only found
 * by someone already looking straight at it.
 *
 * From the live database on 2026-08-02, 249 of 421 memories had no vector, and
 * the split was not random:
 *
 *   reflection  367 rows, 195 unembedded
 *   precedent    28 rows,  28 unembedded  (all of them)
 *   note         26 rows,  26 unembedded  (all of them)
 *
 * The two kinds that were ENTIRELY unembedded are the two a human curates.
 * `note` is what survives the memory-candidate review gate, which exists so a
 * person can decide what the system should remember; `precedent` is a decision
 * kept on purpose. So the most deliberate knowledge in the workspace, the part
 * someone actually chose, was the part semantic recall could never surface,
 * while the machine's own reflections were mostly fine. Exactly backwards.
 *
 * Same shape as the signal and theme sweepers, and for the same reason: driven
 * by TABLE STATE, so it covers every writer that exists, every writer added
 * later, and every row written before any of this shipped.
 *
 * (Third sweeper of this shape. If a fourth is ever needed, generalise these
 * into one table-driven helper rather than copying again.)
 *
 * Server-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/rag/embed.server";

export const MEMORY_EMBED_BATCH = 64;

/** What a memory looks like in vector space: its content, whitespace collapsed. */
export function memoryEmbeddingText(content: string | null): string {
  return (content ?? "").replace(/\s+/g, " ").trim().slice(0, 8_000);
}

export type MemoryBackfillResult = { scanned: number; embedded: number; failed: number };

export async function backfillMemoryEmbeddings(
  db: SupabaseClient,
  limit: number = MEMORY_EMBED_BATCH,
): Promise<MemoryBackfillResult> {
  const { data, error } = await db
    .from("agent_memory")
    .select("id, content, user_id")
    .is("embedding", null)
    .not("content", "is", null)
    .order("importance", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`backfillMemoryEmbeddings select failed: ${error.message}`);

  const rows = (data ?? []) as Array<{ id: string; content: string | null; user_id: string }>;
  if (rows.length === 0) return { scanned: 0, embedded: 0, failed: 0 };

  // Most important first, not oldest first. A backlog here is a recall gap, and
  // the memories a human marked as mattering should stop being invisible before
  // the machine's routine reflections do.

  // Per owner, never a mixed batch: embedTexts resolves a BYO provider key from
  // userId, so a mixed batch would send one workspace's text to another
  // workspace's key and misattribute the cost.
  const byUser = new Map<string, typeof rows>();
  for (const r of rows) {
    const g = byUser.get(r.user_id);
    if (g) g.push(r);
    else byUser.set(r.user_id, [r]);
  }

  let embedded = 0;
  let failed = 0;
  for (const [userId, group] of byUser) {
    let vectors: number[][];
    try {
      vectors = await embedTexts(
        group.map((r) => memoryEmbeddingText(r.content)),
        { supabase: db, userId, surfaceRef: "memory-embedding-backfill" },
      );
    } catch (e) {
      console.error("backfillMemoryEmbeddings embed failed for user", userId, e);
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
        .from("agent_memory")
        .update({ embedding: vec as unknown as string })
        .eq("id", group[i].id);
      if (upErr) {
        console.error("backfillMemoryEmbeddings update failed", group[i].id, upErr.message);
        failed++;
      } else {
        embedded++;
      }
    }
  }
  return { scanned: rows.length, embedded, failed };
}
