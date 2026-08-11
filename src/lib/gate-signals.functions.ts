import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildGateEventRow,
  summarizeGateSignals,
  type HumanGateEventInput,
} from "@/lib/gate-signals";

/**
 * RPT-32: best-effort capture of one human-at-gate decision. NEVER throws: a
 * telemetry write must never break the gate it observes (approving/rejecting an
 * agent action, saving a spec). If the table is absent (migration not yet
 * applied) or the insert fails, it no-ops and returns { ok: false }. Callers on
 * the critical path fire-and-forget; a caller that wants to surface a write
 * failure can read `ok`.
 */
export async function recordGateSignalCore(
  supabase: SupabaseClient,
  userId: string,
  input: HumanGateEventInput,
): Promise<{ ok: boolean }> {
  try {
    const row = buildGateEventRow(userId, input);
    const { error } = await supabase.from("human_gate_events").insert(row);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

const RecordSchema = z.object({
  gateType: z.enum(["approval", "rejection", "edit", "override"]),
  subjectType: z.string().min(1).max(60),
  subjectRef: z.string().max(200).nullish(),
  agentSlug: z.string().max(100).nullish(),
  toolName: z.string().max(100).nullish(),
  verdict: z.string().max(60).nullish(),
  diffSummary: z.string().max(2000).nullish(),
  // Required key, nullable value, matching HumanGateEventInput: a caller that
  // forgets the workspace must be told, not silently given a row nobody reads.
  workspaceId: z.string().uuid().nullable(),
});

/** Externally-callable capture (e.g. a client-side edit/override gate). Best-effort. */
export const recordGateSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordSchema.parse(i))
  .handler(({ context, data }) =>
    recordGateSignalCore(context.supabase, context.userId, data as HumanGateEventInput),
  );

/**
 * Read the human-at-gate flywheel signal: the recent gate events plus the
 * per-agent correction rate rolled up from them. Returns an empty, honest
 * signal (never an error) when the table does not exist yet, so a caller can
 * render before the migration lands.
 */
export const getGateSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("human_gate_events")
      .select(
        "id,gate_type,subject_type,subject_ref,agent_slug,tool_name,verdict,diff_summary,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    const { data: rows, error } = await q;
    if (error) {
      return { events: [], signals: summarizeGateSignals([]) };
    }
    const events = rows ?? [];
    return { events, signals: summarizeGateSignals(events) };
  });
