/**
 * Mission row for the Build cockpit and "machine right now" lists.
 * Status dot + title + step in mono + cost. Clicking opens the mission slide-over.
 */
export interface MissionRowProps {
  title: string;
  status?: "working" | "thinking" | "waiting" | "review" | "shipped" | "blocked" | "queued";
  /** Mono step label, e.g. "SCOUT · STEP 2/5" or "WAITING ON YOU" */
  stepLabel?: string;
  /** Outcome chip for finished missions, e.g. "VALIDATED" */
  verdict?: string;
  /** e.g. "$0.84" */
  cost?: string;
  onClick?: () => void;
}
