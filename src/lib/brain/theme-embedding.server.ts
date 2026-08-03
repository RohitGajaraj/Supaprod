/**
 * Theme embeddings, the backfill.
 *
 * Why this exists, from the live database on 2026-08-02: there were 181 themes and
 * ZERO of them had an embedding. 130 of those carried a `scored_at` timestamp, which
 * means `computeNovelty` had run against them and returned its fail-open result
 * (`{novelty: 1, embedding: null}`) rather than a vector. The theme was written with
 * a null embedding and nothing ever came back for it.
 *
 * That single fact made theme growth inert. `match_themes` filters on
 * `t.embedding IS NOT NULL`, so with no theme embeddings every attach lookup returns
 * an empty set: a signal can never join an existing theme, no matter how well the
 * matching logic above it is written. The clustering path also loses its novelty
 * signal, since novelty is measured against prior theme vectors that do not exist.
 *
 * The fix follows the same shape that proved out for signals (see
 * `sources/signal-embedding.server.ts`): drive it off TABLE STATE rather than the
 * creation call site, because creation already had its chance and failed open. Any
 * theme lacking a vector is picked up here regardless of which code path made it or
 * how long ago.
 *
 * Server-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts, embedThroughChokepointWithModel, type EmbedResult } from "@/lib/rag/embed.server";

/** Themes embedded per sweep. Kept small: a theme is short text, but the batch shares
 *  the tick with the signal sweeper. */
export const THEME_EMBED_BATCH = 64;

/** The text that represents a theme in vector space. Mirrors what `computeNovelty`
 *  embeds (`title` then `summary`) so a backfilled vector and a freshly scored one
 *  are directly comparable, which they must be: they get compared to each other. */
export function themeEmbeddingText(title: string | null, summary: string | null): string {
  const t = (title ?? "").replace(/\s+/g, " ").trim();
  const s = (summary ?? "").replace(/\s+/g, " ").trim();
  const parts = s && s !== t ? [t, s] : [t];
  return parts.filter(Boolean).join("\n").slice(0, 8_000);
}

export type ThemeBackfillResult = { scanned: number; embedded: number; failed: number };

export async function backfillThemeEmbeddings(
  db: SupabaseClient,
  limit: number = THEME_EMBED_BATCH,
): Promise<ThemeBackfillResult> {
  const { data, error } = await db
    .from("themes")
    .select("id, title, summary, user_id")
    .is("embedding", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`backfillThemeEmbeddings select failed: ${error.message}`);

  const rows = (data ?? []) as Array<{
    id: string;
    title: string | null;
    summary: string | null;
    user_id: string;
  }>;
  if (rows.length === 0) return { scanned: 0, embedded: 0, failed: 0 };

  // Newest first, unlike the signal sweeper's oldest-first. A theme is only useful
  // to match against while it is still live, so a backlog should make the themes a
  // user is looking at right now comparable before it works back through history.

  // Per owner, never a mixed batch: embedTexts resolves a BYO provider key from
  // userId, so batching across owners would send one workspace's text to another
  // workspace's key and misattribute the cost. Same rule as the signal sweeper.
  const byUser = new Map<string, typeof rows>();
  for (const r of rows) {
    const g = byUser.get(r.user_id);
    if (g) g.push(r);
    else byUser.set(r.user_id, [r]);
  }

  let embedded = 0;
  let failed = 0;
  for (const [userId, group] of byUser) {
    let result: EmbedResult;
    try {
      result = await embedThroughChokepointWithModel(
        group.map((r) => themeEmbeddingText(r.title, r.summary)),
        { supabase: db, userId, surfaceRef: "theme-embedding-backfill" },
      );
    } catch (e) {
      console.error("backfillThemeEmbeddings embed failed for user", userId, e);
      failed += group.length;
      continue;
    }
    for (let i = 0; i < group.length; i++) {
      const vec = result.vectors[i];
      if (!vec) {
        failed++;
        continue;
      }
      const { error: upErr } = await db
        .from("themes")
        .update({
          embedding: vec as unknown as string,
          embedding_model: result.model,
          scored_at: new Date().toISOString(),
        })
        .eq("id", group[i].id);
      if (upErr) {
        console.error("backfillThemeEmbeddings update failed", group[i].id, upErr.message);
        failed++;
      } else {
        embedded++;
      }
    }
  }
  return { scanned: rows.length, embedded, failed };
}
