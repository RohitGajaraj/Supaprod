import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "./runtime.server";
import { cleanTitle } from "@/components/plan/format";

// RPT-25: the contradiction auditor (drift pointed inward). A standing judge
// re-reads a bounded window of the workspace's prior decisions after a new one
// is made and flags the ones that genuinely disagree with it ("N of M
// disagree"), each with a plain-language rationale, so the operator can propose
// a supersession edge. Grounds only in real decision rows (no vector search);
// one batched judge call keeps it cheap. Mirrors the assumption-watch shape.

const MODEL = "google/gemini-2.5-flash" as const;
const MAX_CORPUS = 24;

const AUDIT_SYSTEM = `You are the Supaprod contradiction auditor. You are given a decision that was just made, and a numbered list of prior decisions from the same workspace. Find the prior decisions that genuinely disagree with, or are now superseded by, the decision that was just made.
Rules:
- Only flag a real, substantive disagreement. A merely related or adjacent decision is not a contradiction.
- For each contradiction, give its 0-based index from the list and one plain sentence saying how it disagrees.
- If nothing disagrees, return an empty list.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, crucial, game-changer).
- Output ONLY valid JSON: {"contradictions": [{"index": 0, "rationale": "..."}]}`;

type CorpusItem = { id: string; title: string; rationale: string | null };

export type ContradictionItem = {
  decisionId: string;
  title: string;
  rationale: string;
};

export type ContradictionAudit = {
  /** How many prior decisions were read. */
  scanned: number;
  /** How many of them the judge flagged as disagreeing. */
  count: number;
  items: ContradictionItem[];
};

type RawContradiction = { index?: unknown; rationale?: unknown };

/** Pure: validates the judge's raw contradiction list against the corpus length.
 *  An index the model invents that is out of range, negative, non-integer, or a
 *  duplicate can never be trusted as a real prior decision, so it is dropped;
 *  the rationale is trimmed and capped. Exported for unit tests. */
export function deriveAuditReport(
  raw: { contradictions?: unknown },
  corpusLength: number,
): { index: number; rationale: string }[] {
  const list = Array.isArray(raw?.contradictions) ? raw.contradictions : [];
  const seen = new Set<number>();
  const out: { index: number; rationale: string }[] = [];
  for (const entry of list) {
    const c = entry as RawContradiction;
    const idx = c?.index;
    if (
      typeof idx !== "number" ||
      !Number.isInteger(idx) ||
      idx < 0 ||
      idx >= corpusLength ||
      seen.has(idx)
    ) {
      continue;
    }
    seen.add(idx);
    out.push({
      index: idx,
      rationale: typeof c.rationale === "string" ? c.rationale.trim().slice(0, 500) : "",
    });
  }
  return out;
}

/**
 * Re-reads the workspace's prior decisions and flags the ones that disagree with
 * the subject decision. Fail-safe: it never throws to the caller. A corpus-load
 * failure returns a fully empty report; a judge failure still reports how many
 * were scanned so the surface reads honestly.
 */
export async function auditDecisionContradictions(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  subject: { id: string; title: string; rationale: string | null },
): Promise<ContradictionAudit> {
  let corpus: CorpusItem[] = [];
  try {
    const { data } = await supabase
      .from("decisions")
      .select("id,title,rationale")
      .eq("workspace_id", workspaceId)
      .neq("id", subject.id)
      .order("created_at", { ascending: false })
      .limit(MAX_CORPUS);
    corpus = (data ?? []) as CorpusItem[];
  } catch (e) {
    console.error("contradiction auditor corpus load failed (non-fatal):", e);
    return { scanned: 0, count: 0, items: [] };
  }
  if (corpus.length === 0) return { scanned: 0, count: 0, items: [] };

  const corpusBlock = corpus
    .map((c, i) => {
      const why = c.rationale ? ` Rationale: ${c.rationale}` : "";
      return `[${i}] ${cleanTitle(c.title)}.${why}`.slice(0, 500);
    })
    .join("\n");
  const subjectBlock = `THE DECISION JUST MADE: ${cleanTitle(subject.title)}${
    subject.rationale ? `\nRationale: ${subject.rationale}` : ""
  }`;

  try {
    const res = await callModel(supabase as never, userId, {
      surface: "judge",
      surface_ref: "contradiction_audit",
      model: MODEL,
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: AUDIT_SYSTEM },
        {
          role: "user",
          content: `${subjectBlock}\n\nPRIOR DECISIONS:\n${corpusBlock}\n\nWhich of these prior decisions disagree with the decision just made?`,
        },
      ],
    });
    const contradictions = deriveAuditReport(
      (res.json ?? {}) as { contradictions?: unknown },
      corpus.length,
    );
    const items: ContradictionItem[] = contradictions.map((c) => ({
      decisionId: corpus[c.index].id,
      title: corpus[c.index].title,
      rationale:
        c.rationale || "This prior decision appears to disagree with the decision just made.",
    }));
    return { scanned: corpus.length, count: items.length, items };
  } catch (e) {
    console.error("contradiction auditor judge failed (non-fatal):", e);
    return { scanned: corpus.length, count: 0, items: [] };
  }
}
