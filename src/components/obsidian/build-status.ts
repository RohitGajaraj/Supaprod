/**
 * OBS-05: maps Build's status vocabulary onto the Obsidian primitives' typed
 * states. Pure so the mapping is unit-testable without mounting a component;
 * `BuildMissionRow` and `MissionSlideOver` both consume it so a mission's
 * status reads identically in the row and the slide-over header.
 *
 * Two disjoint vocabularies feed this (adversarial review finding, both
 * `BuildMissionRow` and `MissionSlideOver` fall back to the mission-table
 * value when a run-level one is unavailable): `agent_runs.status` (queued /
 * running / waiting_approval / halted / completed / failed / cancelled /
 * done, see `studio-ui.tsx`'s `BADGE_STATE`) and `missions.status` (proposed
 * / queued / running / blocked / halted / cancelled / completed /
 * completed_with_failures / failed, see `resume-runs.ts`). Critically,
 * `missions.status` uses `"blocked"` for a mission genuinely waiting on a
 * human gate — it never says `"waiting_approval"` — and answering a gate
 * only updates `agent_approvals` immediately; `missions.status` only catches
 * up on the next `resume-runs` cron tick (~60s). An earlier draft read
 * `mission.status` for the slide-over header and silently fell through every
 * branch to "done", showing a false SHIPPED for up to a minute after every
 * gate answer, including a reject. Every mapping below treats `"blocked"` as
 * its own gate, `"cancelled"`/`"completed_with_failures"` as failures (never
 * a false "done"), and only a genuinely unrecognized string falls back to
 * "queued" (a neutral state) rather than the terminal "done" bucket.
 */
import type { MissionRowStatus } from "./missionrow";
import type { StatusState } from "./status";
import type { VerdictTone } from "./verdict";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { StudioApproval } from "@/lib/studio.functions";

const FAILURE_STATUSES = new Set(["failed", "halted", "cancelled", "completed_with_failures"]);
const TERMINAL_OK_STATUSES = new Set(["completed", "done"]);

/** `MissionRowStatus` now has five buckets (working/gate/done/blocked/queued, see missionrow.tsx) ·
 * a failed/halted/cancelled/completed_with_failures mission reads its own "blocked" state, matching
 * the slide-over, rather than collapsing into "done"; `studioVerdict` below still drives the row's
 * optional verdict chip (which now also renders on "blocked" rows) to tell KILL from SHIP. */
export function studioToMissionRowStatus(
  status: string,
  pendingApprovals: number,
): MissionRowStatus {
  if (pendingApprovals > 0 || status === "waiting_approval" || status === "blocked") return "gate";
  // OBS-10: 'proposed' is the trigger-tick's own HITL gate — a mission an
  // ambient trigger proposed but a human has not yet promoted to queued
  // (missions.functions.ts `promoteMission`). Distinct from 'queued', which
  // is already running through the loop unattended.
  if (status === "proposed") return "gate";
  if (status === "running") return "working";
  if (status === "queued") return "queued";
  if (FAILURE_STATUSES.has(status)) return "blocked";
  if (TERMINAL_OK_STATUSES.has(status)) return "done";
  return "queued";
}

/** The slide-over header isn't constrained to the row's 4-value union, so a failed/halted/
 * cancelled mission gets its own (madder) `blocked` state instead of collapsing into "done". */
export function studioToStatusState(status: string, pendingApprovals: number): StatusState {
  if (pendingApprovals > 0 || status === "waiting_approval" || status === "blocked") return "gate";
  if (status === "proposed") return "gate";
  if (status === "running") return "working";
  if (status === "queued") return "queued";
  if (FAILURE_STATUSES.has(status)) return "blocked";
  if (TERMINAL_OK_STATUSES.has(status)) return "done";
  return "queued";
}

/** Only a terminal mission carries a verdict; a merged changeset is the real "shipped"
 * outcome (the changeset ladder's own moss terminal state, see `ChangesetChip`) · a
 * "completed" mission whose changeset never merged (e.g. still `pr_open`) gets no verdict
 * rather than a misleading SHIP. */
export function studioVerdict(
  status: string,
  changesetStatus: string | null | undefined,
): VerdictTone | undefined {
  if (FAILURE_STATUSES.has(status)) return "KILL";
  if (changesetStatus === "merged") return "SHIP";
  return undefined;
}

/** A deliberate simplification of the prototype's row-level step label (e.g.
 * "SCOUT · STEP 2/5", "MERGING", "REVISING"): `StudioSessionListItem` (the
 * `listStudioSessions` row shape) carries no current-step-name or per-step
 * history field, only `getStudioSession`'s detail query does. Fabricating a
 * step name the list data doesn't have would violate the spec's own
 * "do not fabricate, render what exists" rule (§13), so the row's right slot
 * says what the status MEANS instead (LOOM v4: the old copy repeated the
 * StatusDot's word verbatim, so "WAITING ON YOU" printed twice per row);
 * the real step-by-step detail lives one layer deeper, in the slide-over.
 * Every phrase still derives purely from the 5-bucket status. */
export const MISSION_ROW_STEP_LABEL: Record<MissionRowStatus, string> = {
  working: "RUNNING UNATTENDED",
  gate: "ONE ANSWER UNBLOCKS IT",
  done: "FINISHED",
  blocked: "DID NOT SHIP",
  queued: "STARTS SHORTLY",
};

/** The mission slide-over's gate block shows at most one approval · the oldest
 * pending one, since `approvals` is ordered by `created_at` ascending (see
 * `getStudioSession`). Returns `undefined` when nothing is awaiting a decision. */
export function findPendingApproval(approvals: StudioApproval[]): StudioApproval | undefined {
  return approvals.find((a) => a.status === "pending");
}

/** A step's dot state for the slide-over's step list. `thought`/`final` steps are
 * always past-tense narration (no live/pending state of their own); only a
 * `tool_call` step can be the live gate (its `approval_id` names a still-pending
 * approval) or carry its own terminal outcome. */
export function stepDotState(
  step: LoopStep,
  approvals: StudioApproval[],
): Extract<StatusState, "gate" | "done" | "blocked" | "queued"> {
  if (step.kind !== "tool_call") return "done";
  if (step.approval_id && approvals.find((a) => a.id === step.approval_id)?.status === "pending")
    return "gate";
  if (step.status === "executed") return "done";
  if (step.status === "error" || step.status === "denied") return "blocked";
  return "queued";
}

/** The step list / trace line description. Truncated to 140 chars · this is
 * display copy, not the full stored text, and long thoughts/finals would blow
 * out the fixed-width row. */
export function stepDescription(step: LoopStep): string {
  if (step.kind === "tool_call") return step.name;
  if (step.kind === "thought") return step.text.slice(0, 140);
  return step.message.slice(0, 140);
}

/** Plain-words gate title per tool (voice law: name the outcome, not the mechanism).
 * Mirrors `ApprovalCard.tsx`'s `approveLabel`/`toolDescription`, the production
 * copy for these exact same two tools, adapted to the Approve / Send back voice. */
export function gateTitle(toolName: string): string {
  if (toolName === "studio.pr.merge") return "Merge the pull request";
  if (toolName === "delegate.openhands") return "Hand off to OpenHands";
  return `Run ${toolName}`;
}

export function gateConsequence(toolName: string): string {
  if (toolName === "studio.pr.merge") return "Opens the pull request · nothing ships without you.";
  if (toolName === "delegate.openhands")
    return "Sends the build task to an external coding agent · this cannot be undone once sent.";
  return "Nothing runs until you decide.";
}
