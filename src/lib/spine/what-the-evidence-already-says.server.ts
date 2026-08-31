import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countByTerm,
  NO_EVIDENCE_READ,
  searchTermsFor,
  type SubjectEvidence,
} from "@/lib/spine/what-the-evidence-already-says";

/**
 * Count the signals in one workspace that mention a subject, and name where they
 * came from (F-184).
 *
 * ── WORKSPACE-SCOPED, AND THAT IS THE ENTERPRISE GATE NOT A DETAIL ──────────
 * Every read here is `.eq("workspace_id", …)`. A count that leaked across
 * tenants would be worse than no count: it would tell one customer how much
 * another has said about their problem.
 *
 * ── A FAILED READ RETURNS null, NEVER 0 ─────────────────────────────────────
 * `count: 0` is a claim about the workspace — *nothing here mentions this* — and
 * a database error is not that claim. Returning 0 on failure would put the exact
 * sentence that killed `060bc5ff` in front of a person who might have plenty of
 * evidence. F-76, on the surface that exists to prevent a wasted run.
 */
export async function evidenceForSubject(
  db: SupabaseClient,
  workspaceId: string,
  subject: string,
): Promise<SubjectEvidence> {
  const terms = searchTermsFor(subject);
  // No searchable terms is not a failed read and not zero evidence: it is a
  // subject we could not turn into a question. Say so by returning a null count
  // with the empty term list beside it, which `evidenceLine` renders honestly.
  if (terms.length === 0) return { ...NO_EVIDENCE_READ };

  // One `.or()` over title and content. `%` and `,` are the only characters that
  // can change this filter's shape and `searchTermsFor` emits `[a-z0-9]` only,
  // so the terms cannot carry either — the same reasoning `kindFromEdges` uses
  // for its uuid gate, and it is load-bearing for the same reason.
  const clause = terms.flatMap((t) => [`title.ilike.%${t}%`, `content.ilike.%${t}%`]).join(",");
  const { data, error } = await db
    .from("signals")
    .select("source,title,content")
    .eq("workspace_id", workspaceId)
    .or(clause)
    .limit(500);
  if (error || !data) return { ...NO_EVIDENCE_READ };

  const rows = data as Array<{
    source: string | null;
    title: string | null;
    content: string | null;
  }>;
  const bySource = new Map<string, number>();
  for (const r of rows) {
    const s = (r.source ?? "").trim();
    if (!s) continue;
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
  }
  const sources = [...bySource.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([s]) => s);

  return {
    count: rows.length,
    sources,
    byTerm: countByTerm(terms, rows),
    agentAuthored: rows.filter((r) => (r.source ?? "").trim() === "agent").length,
  };
}
