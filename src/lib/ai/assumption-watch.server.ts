import type { SupabaseClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import { callModel } from "./runtime.server";

// FS-02: the watcher half. Matches standing assumptions against recent
// signals/learnings and opens a supersession-candidate Call BEFORE the
// outcome fails. Grounds directly in a bounded recent-evidence window
// (no vector search — signals.embedding is not populated by writeSignals
// today, and adding that plumbing is out of this ticket's scope).

const MODEL = "google/gemini-2.5-flash" as const;
const WATCH_WINDOW_DAYS = 7;
const MAX_ASSUMPTIONS_PER_TICK = 10;
const MAX_EVIDENCE_ROWS = 20;

const WATCH_SYSTEM = `You are the Supaprod assumption watcher. You are given a standing assumption a past decision depends on, and a batch of recent signals and learnings. Judge whether any of them genuinely contradicts the assumption.
Rules:
- Only flag a real, concrete contradiction; a merely related item is not a contradiction.
- If you flag one, name exactly which item by its index and say why in one sentence.
- If nothing contradicts it, say so plainly.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"contradicted": true or false, "evidence_index": a 0-based index or null, "rationale": "..."}`;

type EvidenceItem = { kind: "signal" | "learning"; id: string; text: string };

async function fetchRecentEvidence(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<EvidenceItem[]> {
  const since = new Date(Date.now() - WATCH_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [signalsRes, learningsRes] = await Promise.all([
    supabase
      .from("signals")
      .select("id,title,content")
      .eq("workspace_id", workspaceId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_EVIDENCE_ROWS),
    supabase
      .from("learnings")
      .select("id,summary,verdict")
      .eq("workspace_id", workspaceId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_EVIDENCE_ROWS),
  ]);
  const signals = (
    (signalsRes.data ?? []) as { id: string; title: string | null; content: string }[]
  ).map((s) => ({
    kind: "signal" as const,
    id: s.id,
    text: `${s.title ?? ""}: ${s.content}`.slice(0, 400),
  }));
  const learnings = (
    (learningsRes.data ?? []) as { id: string; summary: string; verdict: string }[]
  ).map((l) => ({
    kind: "learning" as const,
    id: l.id,
    text: `[${l.verdict}] ${l.summary}`.slice(0, 400),
  }));
  return [...signals, ...learnings].slice(0, MAX_EVIDENCE_ROWS);
}

export type WatchVerdict = {
  contradicted: boolean;
  evidenceIndex: number | null;
  rationale: string;
};

/** Pure: turns the model's raw judge JSON into a safe verdict. An out-of-range or
 *  missing evidence_index can never be trusted as a real contradiction. Exported for
 *  unit tests. */
export function deriveWatchVerdict(
  raw: { contradicted?: unknown; evidence_index?: unknown; rationale?: unknown },
  evidenceLength: number,
): WatchVerdict {
  const idx =
    typeof raw.evidence_index === "number" &&
    Number.isInteger(raw.evidence_index) &&
    raw.evidence_index >= 0 &&
    raw.evidence_index < evidenceLength
      ? raw.evidence_index
      : null;
  return {
    contradicted: !!raw.contradicted && idx !== null,
    evidenceIndex: idx,
    rationale: typeof raw.rationale === "string" ? raw.rationale.trim().slice(0, 500) : "",
  };
}

async function judgeAssumption(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  statement: string,
  evidence: EvidenceItem[],
): Promise<{ contradicted: boolean; evidenceIndex: number | null; rationale: string }> {
  if (evidence.length === 0) return { contradicted: false, evidenceIndex: null, rationale: "" };
  const evidenceBlock = evidence.map((e, i) => `[${i}] (${e.kind}) ${e.text}`).join("\n");
  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "assumption_watch",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: WATCH_SYSTEM },
      {
        role: "user",
        content: `STANDING ASSUMPTION: ${statement}\n\nRECENT SIGNALS/LEARNINGS:\n${evidenceBlock}\n\nDoes any of these contradict the assumption?`,
      },
    ],
  });
  return deriveWatchVerdict((res.json ?? {}) as Record<string, unknown>, evidence.length);
}

/** Scans standing assumptions for a workspace and opens a Call for any real contradiction found. */
export async function watchAssumptions(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ scanned: number; challenged: number }> {
  const { data: assumptions } = await supabase
    .from("assumptions")
    .select("id,statement")
    .eq("workspace_id", workspaceId)
    .eq("status", "standing")
    .order("last_watched_at", { ascending: true, nullsFirst: true })
    .limit(MAX_ASSUMPTIONS_PER_TICK);
  const rows = (assumptions ?? []) as { id: string; statement: string }[];
  if (rows.length === 0) return { scanned: 0, challenged: 0 };

  const evidence = await fetchRecentEvidence(supabase, workspaceId);
  const nowIso = new Date().toISOString();

  // Parallelize AI judgment calls (judgeAssumption is pure per inputs, independent per assumption).
  // Use bounded concurrency (4 concurrent) to avoid overwhelming the AI runtime.
  const limit = pLimit(4);
  const verdictPromises = rows.map((a) =>
    limit(() => judgeAssumption(supabase, userId, workspaceId, a.statement, evidence)),
  );
  const verdicts = await Promise.all(verdictPromises);

  // Batch updates: collect assumption IDs for last_watched_at update and challenged status update.
  const watchedIds: string[] = [];
  const challengedIds: string[] = [];
  const challengeInserts: Array<{
    workspace_id: string;
    assumption_id: string;
    signal_id: string | null;
    learning_id: string | null;
    rationale: string;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    const verdict = verdicts[i];

    watchedIds.push(a.id);
    if (!verdict.contradicted || verdict.evidenceIndex === null) continue;

    const hit = evidence[verdict.evidenceIndex];
    challengeInserts.push({
      workspace_id: workspaceId,
      assumption_id: a.id,
      signal_id: hit.kind === "signal" ? hit.id : null,
      learning_id: hit.kind === "learning" ? hit.id : null,
      rationale: verdict.rationale || "A recent signal appears to contradict this assumption.",
    });
    challengedIds.push(a.id);
  }

  // Batch update last_watched_at for all scanned assumptions.
  if (watchedIds.length > 0) {
    await supabase.from("assumptions").update({ last_watched_at: nowIso }).in("id", watchedIds);
  }

  // Batch insert challenges, and the write error MUST surface. This line used
  // to discard the result under a comment claiming conflicts were ignored --
  // but a plain insert does not ignore a conflict, it fails the WHOLE batch,
  // and every other failure (missing column, RLS refusal) failed the same
  // silent way. Production wrote ZERO challenge rows ever while the tick
  // reported ok. Thrown, same idiom as forecast-audit.server.ts's
  // due-forecasts read, so the tick's per-workspace catch records it against
  // this workspace without stopping the other workspaces' sweep. The throw
  // also skips the status='challenged' update below on purpose: an assumption
  // must not be marked challenged when no challenge row exists for it, and
  // staying 'standing' means the next tick retries it.
  if (challengeInserts.length > 0) {
    const { error: challengeWriteError } = await supabase
      .from("assumption_challenges")
      .insert(challengeInserts);
    if (challengeWriteError) {
      throw new Error(
        `assumption watch could not insert challenges: ${challengeWriteError.message}`,
      );
    }
  }

  // Update challenged assumptions to status='challenged'.
  if (challengedIds.length > 0) {
    await supabase.from("assumptions").update({ status: "challenged" }).in("id", challengedIds);
  }

  return { scanned: rows.length, challenged: challengedIds.length };
}
