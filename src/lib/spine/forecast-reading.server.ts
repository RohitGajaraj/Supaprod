import type { SupabaseClient } from "@supabase/supabase-js";
import { forecastReadings } from "./forecast-readings";
import type { HandReading } from "./what-would-measure-this";

export type ForecastReadingState = {
  status: "ready" | "unlinked" | "unavailable";
  reading: HandReading | null;
  count: number;
};

/** Resolve the recorded clause, even when its spec is absent from the run's shelf. */
export async function readForecastReading(
  db: SupabaseClient,
  workspaceId: string | null,
  decisionId: string,
  clauseId: string | null,
): Promise<ForecastReadingState> {
  if (!clauseId) return { status: "unlinked", reading: null, count: 0 };
  if (!workspaceId) return { status: "unavailable", reading: null, count: 0 };
  const { data, error } = await db
    .from("prds")
    .select("contract")
    .eq("workspace_id", workspaceId)
    .contains("contract", {
      success_metrics: [{ id: clauseId, measures_decision_id: decisionId }],
    });
  if (error || !data) return { status: "unavailable", reading: null, count: 0 };

  // Copies of the same clause in several contracts are ambiguous ownership.
  // The shared reader refuses duplicate IDs instead of picking a convenient copy.
  const clauses = (data as Array<{ contract: unknown }>).flatMap(({ contract }) => {
    const metrics = (contract as { success_metrics?: unknown } | null)?.success_metrics;
    return Array.isArray(metrics) ? metrics : [];
  });
  const record = forecastReadings({ success_metrics: clauses }, { decisionId, clauseId });
  return { status: "ready", ...record };
}
