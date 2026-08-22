import type { TimelineEvent, TimelineState } from "@/components/meridian/RunTimeline";
import { agentDisplayName } from "@/lib/agent-vocabulary";

/*
 * A MISSION'S PLAN, PUT ON A CLOCK — AND THE RULE THAT KEEPS IT HONEST.
 *
 * ── WHY IT IS A MODULE AND NOT TWENTY LINES INSIDE THE CARD ──────────────
 * The whole value of `RunTimeline` on this path rests on one claim: every
 * instant it prints and every silence it measures came out of the record, and
 * nothing was interpolated to fill a row. That claim is the kind that passes
 * review by looking reasonable and fails in production by being wrong, so it is
 * a pure function with a test on it rather than a `map` inside a 1,700-line
 * component nobody can call from a test without a router and a query client.
 *
 * ── THE RECORD THIS READS ────────────────────────────────────────────────
 * `mission_steps` carries `dispatched_at` and `completed_at` on every row, and
 * `listMissionSteps` already selects both. The card's List view and the graph
 * that shares its rows both throw them away, so this data has been arriving on
 * every poll and has never been drawable as a time axis.
 *
 * ── ONE INSTANT, AND IT IS ALWAYS THE SAME ONE ───────────────────────────
 * `dispatched_at`. A step with none is DROPPED rather than dated off its
 * `completed_at`, even though that would fill more rows. A clock column that
 * means "started" on one row and "finished" on the next is one idea in two
 * formats, which is the defect `run-rows.tsx` was written to close; and a
 * silence measured between a start and a finish is not a duration of anything.
 *
 * ── WHAT IS DROPPED IS COUNTED, NEVER JUST DROPPED ───────────────────────
 * A step at `planned` or `ready` has not happened. It has no instant, and giving
 * it one would put it on the axis at a time nobody recorded. So it comes off,
 * and the caller renders the count in words beside the List view that still
 * holds every row. A view that shows less is fine; a view that hides something
 * is what ratchet law 1 forbids.
 */

/** The shape this reads off a `mission_steps` row, and nothing more of it. */
export type MissionStepRow = {
  id?: string | null;
  agent_slug?: string | null;
  sub_goal?: string | null;
  status?: string | null;
  error?: string | null;
  dispatched_at?: string | null;
  completed_at?: string | null;
};

/**
 * A MISSION STEP'S STATUS → THE TIMELINE'S, AND `null` MEANS IT IS NOT ON THE
 * AXIS AT ALL.
 *
 * The dot, badge and graph mappings in `MissionOrchestratorDetail` all have a
 * `default` arm, because each of those has to draw SOMETHING for every row. A
 * time axis does not, so absence is a return value here rather than a
 * fall-through.
 *
 * `queued` is `held` and not `working`, which is that file's own ruling applied
 * one layer down: a mission at `queued` is STOPPED — no sweeper has advanced it
 * and no run exists for it — and the hold chip reads "stopped, and NOT on you: a
 * condition has to change", which is exactly a step waiting for the next tick to
 * adopt it. Calling it `working` would put an agent on something nothing is
 * working on, which is the one reading that can cost somebody their morning.
 */
export function stepTimelineState(status?: string | null): TimelineState | null {
  if (status === "dispatched" || status === "running") return "working";
  if (status === "done" || status === "completed") return "done";
  if (status === "failed" || status === "halted") return "failed";
  if (status === "awaiting_review" || status === "gate") return "gate";
  if (status === "queued") return "held";
  return null;
}

/**
 * The plan's steps as timeline events, oldest first, and only the ones that
 * genuinely happened at a recorded instant.
 *
 * Never built from the hop fallback that `planRows` uses. Two reasons, both
 * about not drawing one thing twice: a hop's instants are ALREADY on screen, in
 * TraceHop's timing bar, and a hop status this file does not recognise would
 * have to be given a state it does not really have.
 */
export function missionStepEvents(rows: readonly MissionStepRow[]): TimelineEvent[] {
  const out: TimelineEvent[] = [];

  rows.forEach((step, i) => {
    const state = stepTimelineState(step.status);
    if (!state) return;

    const at = Date.parse(step.dispatched_at ?? "");
    if (!Number.isFinite(at)) return;

    const end = Date.parse(step.completed_at ?? "");

    out.push({
      id: step.id ?? `step-${i}`,
      at,
      /* Two arcs passing: the orchestrator handing this step to an agent, which
         is literally what a dispatch is. */
      kind: "handoff",
      /* The sub-goal is the sentence the planner wrote, which is what a reader
         came for. The agent's name is the fallback rather than a raw slug or an
         index, because a row with no words is a row nobody can use. */
      label: step.sub_goal?.trim() || agentDisplayName(step.agent_slug ?? ""),
      detail: step.error ?? undefined,
      agentSlug: step.agent_slug ?? null,
      /* Omitted rather than estimated where the step has not finished, and
         guarded against a `completed_at` that precedes its own dispatch: a
         negative duration is a record defect and not a fact to render. */
      durationMs: Number.isFinite(end) && end >= at ? end - at : undefined,
      state,
    });
  });

  return out.sort((a, b) => a.at - b.at);
}
