/**
 * THE ONE CLAIM THIS AXIS MAKES, AND THE ONLY REASON IT IS ALLOWED ON A PRODUCT
 * SURFACE: every instant it prints came out of the record.
 *
 * `RunTimeline` does not merely list steps. It prints a wall clock on every row
 * and it measures the SILENCES between them — "nobody answered for 28 minutes"
 * is a claim about two recorded timestamps, and a timeline fed interpolated
 * instants would state that claim in exactly the same words while inventing it.
 * That is the failure this file exists to make impossible to reintroduce quietly:
 * filling a missing `dispatched_at` from a neighbour looks like a tidy defensive
 * default in a diff, typechecks, renders, and silently fabricates the surface's
 * whole argument.
 *
 * The other half is ratchet law 1. A step that has not been dispatched has no
 * instant, so it comes OFF the axis — and the caller counts what came off and
 * says so beside a List view that still holds every row. A view that shows less
 * is fine. A view that hides something is not.
 */
import { describe, expect, it } from "bun:test";

import { missionStepEvents, stepTimelineState } from "../mission-timeline";

const T = (iso: string) => Date.parse(iso);

const DISPATCHED = "2026-08-22T09:00:00.000Z";
const FINISHED = "2026-08-22T09:18:06.000Z";

function step(over: Partial<Parameters<typeof missionStepEvents>[0][number]> = {}) {
  return {
    id: "s1",
    agent_slug: "researcher",
    sub_goal: "Read Intercom and PostHog for verify-step drop-off",
    status: "done",
    error: null,
    dispatched_at: DISPATCHED,
    completed_at: FINISHED,
    ...over,
  };
}

describe("nothing lands on the axis without a recorded instant", () => {
  it("takes the instant from dispatched_at and from nowhere else", () => {
    const [event] = missionStepEvents([step()]);
    expect(event!.at).toBe(T(DISPATCHED));
  });

  it("drops a step that has never been dispatched rather than dating it off completed_at", () => {
    // The tempting default, and the one that would fabricate the whole surface:
    // this row HAS a real timestamp on it, it is simply not the one the clock
    // column means.
    const events = missionStepEvents([
      step({ id: "never", status: "done", dispatched_at: null, completed_at: FINISHED }),
    ]);
    expect(
      events,
      "a step with no dispatch instant was dated off another column, so the clock now means two things",
    ).toEqual([]);
  });

  it("drops a step whose dispatched_at is not a date at all", () => {
    expect(missionStepEvents([step({ dispatched_at: "soon" })])).toEqual([]);
    expect(missionStepEvents([step({ dispatched_at: "" })])).toEqual([]);
  });

  it("omits the duration rather than estimating one on a step still running", () => {
    const [event] = missionStepEvents([step({ status: "running", completed_at: null })]);
    expect(event!.durationMs).toBeUndefined();
    expect(event!.state).toBe("working");
  });

  it("omits a duration that would be negative, because that is a record defect", () => {
    const [event] = missionStepEvents([
      step({ dispatched_at: FINISHED, completed_at: DISPATCHED }),
    ]);
    expect(event!.durationMs).toBeUndefined();
  });

  it("measures the duration between the two recorded instants and does not round it away", () => {
    const [event] = missionStepEvents([step()]);
    expect(event!.durationMs).toBe(T(FINISHED) - T(DISPATCHED));
  });
});

describe("a step that has not happened is not on a time axis", () => {
  it("resolves planned, ready and skipped to nothing rather than to a state", () => {
    for (const status of ["planned", "ready", "skipped", "", null, undefined]) {
      expect({ status, state: stepTimelineState(status) }).toEqual({ status, state: null });
    }
  });

  it("has no default arm, so an unknown status cannot be drawn as done", () => {
    // The three other mappings on this card all fall through to a drawable
    // value, because a dot and a badge have to draw something. This one must not:
    // resolving an unrecognised status to `done` would report an outcome the
    // record never carried.
    expect(stepTimelineState("something_new")).toBeNull();
  });

  it("counts as dropped, which is what the caller renders in words", () => {
    const rows = [
      step({ id: "a", status: "done" }),
      step({ id: "b", status: "planned", dispatched_at: null, completed_at: null }),
      step({ id: "c", status: "ready", dispatched_at: null, completed_at: null }),
    ];
    const events = missionStepEvents(rows);
    expect(events).toHaveLength(1);
    expect(
      rows.length - events.length,
      "the count the caller prints under the axis has to be derivable from these two numbers",
    ).toBe(2);
  });
});

describe("the states say what actually happened", () => {
  it("calls a queued step held rather than working, because nothing is working on it", () => {
    // This card's own note: a mission at `queued` is STOPPED — no sweeper has
    // advanced it and no run exists for it. Calling it `working` puts an agent on
    // something nobody is doing, which is the reading that costs a morning.
    expect(stepTimelineState("queued")).toBe("held");
  });

  it("maps the rest to what each one means", () => {
    expect(stepTimelineState("dispatched")).toBe("working");
    expect(stepTimelineState("running")).toBe("working");
    expect(stepTimelineState("done")).toBe("done");
    expect(stepTimelineState("completed")).toBe("done");
    expect(stepTimelineState("failed")).toBe("failed");
    expect(stepTimelineState("halted")).toBe("failed");
    expect(stepTimelineState("awaiting_review")).toBe("gate");
  });
});

describe("the row says something a reader can use", () => {
  it("leads with the planner's own sentence", () => {
    const [event] = missionStepEvents([step()]);
    expect(event!.label).toBe("Read Intercom and PostHog for verify-step drop-off");
  });

  it("falls back to the agent's NAME when the plan wrote no sub-goal", () => {
    // Never a raw slug and never an index: a row with no words is a row nobody
    // can use, and a slug on screen is the leak this product keeps finding.
    const [event] = missionStepEvents([step({ sub_goal: "   " })]);
    expect(event!.label).not.toBe("");
    expect(event!.label).not.toBe("researcher");
  });

  it("carries the step's error as the qualifier under it", () => {
    const [event] = missionStepEvents([step({ status: "failed", error: "The branch was gone" })]);
    expect(event!.detail).toBe("The branch was gone");
    expect(event!.state).toBe("failed");
  });

  it("credits the agent, so no row is the work doing itself", () => {
    const [event] = missionStepEvents([step()]);
    expect(event!.agentSlug).toBe("researcher");
  });
});

describe("the axis is in the order it happened", () => {
  it("sorts by instant rather than by the order the rows arrived", () => {
    const events = missionStepEvents([
      step({
        id: "late",
        dispatched_at: "2026-08-22T11:00:00.000Z",
        completed_at: null,
        status: "running",
      }),
      step({ id: "early", dispatched_at: "2026-08-22T09:00:00.000Z" }),
      step({ id: "middle", dispatched_at: "2026-08-22T10:00:00.000Z" }),
    ]);
    expect(events.map((e) => e.id)).toEqual(["early", "middle", "late"]);
  });

  it("gives every row an id, so React and the keyboard have something stable", () => {
    const events = missionStepEvents([step({ id: null }), step({ id: null })]);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });
});
