// SW-4 / mission 3.10 LOOP MODE: the pure seam, importable from BOTH sides.
//
// The kind registry, cadence math, and row types have no server dependency,
// and the LoopsPanel needs the registry as a real client value, so they live
// here instead of loops.server.ts (whose suffix bars client imports). The
// work pass itself (runLoopPass) stays server-only in loops.server.ts.

export type LoopKind = "competitor_sweep" | "signal_recluster" | "outcome_review";
export type LoopCadence = "hourly" | "daily" | "weekly";
export type LoopStatus = "active" | "paused" | "archived";

export interface LoopRow {
  id: string;
  user_id: string;
  workspace_id: string;
  kind: string;
  title: string;
  cadence: string;
  status: string;
  last_run_at: string | null;
  next_run_at: string;
}

/** The promotable kinds: each wraps a pass that already exists as a hidden cron. */
export const LOOP_KINDS: Record<
  LoopKind,
  { label: string; description: string; defaultCadence: LoopCadence }
> = {
  competitor_sweep: {
    label: "Competitor sweep",
    description: "Summarize the week's competitor and platform moves into briefs.",
    defaultCadence: "weekly",
  },
  signal_recluster: {
    label: "Signal re-cluster",
    description: "Re-cluster new signals into themes so Discover stays fresh.",
    defaultCadence: "daily",
  },
  outcome_review: {
    label: "Outcome review",
    description: "Review shipped bets whose outcome window has closed.",
    defaultCadence: "daily",
  },
};

export const CADENCE_MS: Record<LoopCadence, number> = {
  hourly: 3600_000,
  daily: 24 * 3600_000,
  weekly: 7 * 24 * 3600_000,
};

/** Next due time for a cadence. Unknown cadences fall back to daily so a bad
 *  row can never hot-loop the tick. */
export function nextRunAt(cadence: string, from: Date = new Date()): string {
  const ms = CADENCE_MS[cadence as LoopCadence] ?? CADENCE_MS.daily;
  return new Date(from.getTime() + ms).toISOString();
}

export function isLoopKind(v: string): v is LoopKind {
  return v in LOOP_KINDS;
}
