import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "./runtime.server";

// FS-02: at decision time, extract the assumptions a decision stands on as
// typed rows so a later watcher can match incoming signals against them.

const MODEL = "google/gemini-2.5-flash" as const;
const MAX_ASSUMPTIONS = 3;
const MIN_RATIONALE_CHARS = 20;

const EXTRACT_SYSTEM = `You are the Cadence decision analyst. Given a decision's title and rationale, extract the standing assumptions it depends on.
Rules:
- Each assumption is a single falsifiable statement about the world that, if it stopped being true, would call the decision into question.
- Extract at most 3, most load-bearing first.
- If the rationale is too thin to support a real assumption, return an empty list rather than inventing one.
- Signal-first: state the assumption directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"assumptions": ["...", "..."]}`;

export type ExtractedAssumption = { id: string; statement: string };

/** Fail-safe: never throws into the caller (createDecision). Returns [] on any failure. */
export async function extractAssumptions(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  decisionId: string,
  title: string,
  rationale: string | null,
): Promise<ExtractedAssumption[]> {
  if (!rationale || rationale.trim().length < MIN_RATIONALE_CHARS) return [];

  try {
    const res = await callModel(supabase as never, userId, {
      surface: "sense",
      surface_ref: "extract_assumptions",
      model: MODEL,
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        {
          role: "user",
          content: `DECISION: ${title.slice(0, 280)}\nRATIONALE: ${rationale.slice(0, 1500)}\n\nExtract the assumptions.`,
        },
      ],
    });
    const j = (res.json ?? {}) as { assumptions?: unknown };
    const raw = Array.isArray(j.assumptions) ? j.assumptions : [];
    const statements = raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, MAX_ASSUMPTIONS)
      .map((s) => s.trim().slice(0, 500));
    if (statements.length === 0) return [];

    const { data: rows, error } = await supabase
      .from("assumptions")
      .insert(
        statements.map((statement) => ({
          user_id: userId,
          workspace_id: workspaceId,
          decision_id: decisionId,
          statement,
        })),
      )
      .select("id,statement");
    if (error || !rows) return [];
    return rows as ExtractedAssumption[];
  } catch {
    return [];
  }
}
