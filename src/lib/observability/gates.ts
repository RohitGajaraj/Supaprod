/**
 * AFD-04, the half that never shipped: the refusal vocabulary.
 *
 * WHAT THIS IS FOR. `ai_events` already records every AI call the product
 * makes. What it never recorded is WHY the product refused to make one, in a
 * form you can group by. Every gate wrote its reason into `error_message` as
 * prose ("governance_halt:kill_switch ...", "credit_exhausted: account ..."),
 * so the question the founder actually asks, which gate stops the most work,
 * was a LIKE over free text that nobody was ever going to run.
 *
 * WHY NO NEW TABLE. `ai_events.error_code` has existed since the first schema
 * (migration 20260522001642, line 24) and has never been written by anything
 * and never read by anything. It is the same dead-column shape as `ttft_ms`,
 * and it is exactly the typed slot this needs. So the gate signal costs zero
 * migrations: the rows are already being written, one column on each of them
 * was blank, and this file owns the vocabulary that fills it.
 *
 * TWO RULES THIS FILE KEEPS.
 *
 *  1. The code is the fact, the message is the story. `error_code` is a closed
 *     vocabulary you can GROUP BY; `error_message` stays the human sentence.
 *     Never derive one from the other at read time.
 *
 *  2. The vendor forward is the exception, never the rule. A COMPLETED call is
 *     accounting, and `ai_events` already keeps that better than any vendor
 *     would, so it does not cross to PostHog. Only a REFUSAL crosses, because a
 *     refusal is a product event: someone asked for work and did not get it.
 *     That is the one thing the ledger cannot answer on its own, since the
 *     ledger has no idea who the person was outside this workspace.
 *
 * ONE VOCABULARY, TWO TABLES. A gate code is `gate_*`. A failure code is the
 * SAME string `agent_runs.failure_kind` already uses (AFD-06), on purpose: an
 * AI call that failed and the run that carried it now say the same word, so a
 * count across both is a union and not a translation table.
 */
import { track } from "./analytics";

/** Every way the product declines, defers, or downgrades work at the AI chokepoint. */
export const GATE_CODES = {
  /** System or workspace kill switch is engaged. */
  kill_switch: "gate_kill_switch",
  /** The mission hit its token ceiling. */
  mission_token_cap: "gate_mission_token_cap",
  /** The mission hit its spend ceiling. */
  mission_spend_cap: "gate_mission_spend_cap",
  /** The account credit pool cannot cover the projected call. */
  credit_exhausted: "gate_credit_exhausted",
  /** A per-product or per-user credit cap for this cycle is used up. */
  credit_cap: "gate_credit_cap",
  /** Ambient work routed to the free floor instead of halting (PR-D2). */
  ambient_downgrade: "gate_ambient_downgrade",
  /** A guardrail rule blocked the output. */
  guardrail_block: "gate_guardrail_block",
} as const;

export type GateKind = keyof typeof GATE_CODES;
export type GateCode = (typeof GATE_CODES)[GateKind];

/** True when a stored `error_code` is a refusal rather than a failure. */
export function isGateCode(code: string | null | undefined): boolean {
  return typeof code === "string" && code.startsWith("gate_");
}

/**
 * The failure taxonomy, moved here from the chokepoint so both the awaited and
 * the streaming path can reach it and so the read side has one list to name.
 * Behaviour is unchanged: same inputs, same strings, and `agent_runs.failure_kind`
 * still receives exactly what it received before.
 *
 * Cheap and string-based on purpose. The goal is rough categorisation for a
 * dashboard, not certainty.
 */
export function classifyFailureCode(errMsg: string | null | undefined): string {
  const m = (errMsg ?? "").toLowerCase();
  if (!m) return "unknown";
  if (m.includes("timeout") || m.includes("timed out")) return "timeout";
  if (m.includes("aborted") || m.includes("cancelled") || m.includes("canceled"))
    return "user_aborted";
  if (
    m.includes("budget") ||
    m.includes("cap") ||
    m.includes("credits exhausted") ||
    m.includes("402")
  )
    return "budget_kill";
  if (m.includes("guardrail") || m.includes("blocked")) return "guardrail_block";
  if (m.includes("injection") || m.includes("prompt injection")) return "injection_block";
  if (m.includes("rls") || m.includes("permission denied") || m.includes("forbidden"))
    return "rls_denied";
  if (m.includes("tool") || m.includes("function call")) return "tool_error";
  return "model_error";
}

export type GateContext = {
  userId: string;
  surface: string;
  model?: string | null;
  workspaceId?: string | null;
  runId?: string | null;
};

/**
 * Forward one refusal to the product-analytics vendor. Fire and forget, never
 * throws, and a hard no-op with no PostHog key or with the founder gate off,
 * which is the state today. The in-house record of the same refusal is the
 * `ai_events` row the caller is already writing with this code on it, so
 * nothing here duplicates a ledger write.
 */
export async function noteGate(code: GateCode, ctx: GateContext): Promise<boolean> {
  try {
    return await track("ai_gate_fired", ctx.userId, {
      gate: code,
      surface: ctx.surface,
      model: ctx.model ?? undefined,
      workspace_id: ctx.workspaceId ?? undefined,
      run_id: ctx.runId ?? undefined,
    });
  } catch {
    // Telemetry may never break a user flow, and a gate firing is already the
    // bad day. Swallow.
    return false;
  }
}
