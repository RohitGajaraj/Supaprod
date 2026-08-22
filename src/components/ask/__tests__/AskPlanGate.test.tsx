import * as React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, test, expect, afterEach } from "bun:test";

import { AskPlanGate, stepsForRoute, stopsForRoute } from "../AskPlanGate";
import { PlanGate } from "@/components/meridian/PlanGate";
import { routeIntent } from "@/lib/ask/route-intent";
import type { PlanProposal } from "@/lib/ask/plan-proposal";
import { inSpineOrder, WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";
import { stationCrew } from "@/lib/spine/driver";

/**
 * NOTHING ON THIS CARD WAS INVENTED.
 *
 * This repo deleted a component for walking a timer through a list of step
 * labels, called it theatre by its own definition, and left a build-failing test
 * behind so it could not come back. The same rule binds harder at a gate,
 * because a fabricated step here is not decoration: it is a thing a person
 * weighed before deciding how much money could be spent without asking them
 * again. So the assertions below are about WHERE EACH LINE CAME FROM rather than
 * about rendering — every step must trace to a seat the spine actually assigns,
 * and every stop to a station the route actually visits.
 */

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

const PROPOSAL: PlanProposal = {
  id: "6f1c2f7e-0d2a-4a1f-9a1b-2c3d4e5f6a7b",
  shape: "existing-feature",
  station: "define",
  origin: "the onboarding drop-off after email verify is getting worse",
  title: "Verify-step drop-off",
  goal: "Find out why the drop-off after email verify is getting worse",
  spendCapUsd: 5,
};

afterEach(cleanup);

describe("every step comes from the route and from nowhere else", () => {
  test("there is exactly one step per seat the spine assigns, in that order", () => {
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: PROPOSAL.origin, station: null });
      const steps = stepsForRoute(routed);
      const seats = stationCrew(routed.station);
      expect(steps.map((s) => s.id)).toEqual(seats.map((c) => c.slug));
      expect(steps.map((s) => s.agentSlug)).toEqual(seats.map((c) => c.slug));
    }
  });

  test("every label is the seat's own brief, character for character", () => {
    // Not a summary of it. A summary would be a second copy that drifts, and the
    // first thing it loses is the qualification that makes some of these briefs
    // honest ("say so plainly rather than finding a reason").
    const routed = routeIntent({ shape: "existing-feature", origin: PROPOSAL.origin });
    for (const step of stepsForRoute(routed)) {
      const seat = routed.crew.find((c) => c.slug === step.id);
      expect(step.label).toBe(seat!.job);
    }
  });

  test("nothing has run, so every step is pending and none claims otherwise", () => {
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: PROPOSAL.origin, station: null });
      for (const step of stepsForRoute(routed)) expect(step.state).toBe("pending");
    }
  });

  test("no step invents an object for the work to act on", () => {
    // `touches` is what a step will act on: a branch, a path, a recipient. The
    // route knows none of those, and absent is the honest default rather than a
    // gap to fill with something plausible.
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: PROPOSAL.origin, station: null });
      for (const step of stepsForRoute(routed)) {
        expect(step.touches).toBeUndefined();
        expect(step.why).toBeUndefined();
      }
    }
  });
});

describe("the route is drawn as the route, waivers included", () => {
  test("draws the whole spine: what it visits AND what policy took off it", () => {
    /*
     * `route.path` EXCLUDES the waived stations, and drawing only the path would
     * hide a decision that was already taken on this person's behalf at the one
     * moment they can still overturn it. So the stops are path + waived, in
     * spine order, and never a reordering of it: Build before Plan is not a
     * route, it is a bug.
     */
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: PROPOSAL.origin, station: null });
      const drawn = stopsForRoute(routed).map((s) => s.station);
      const expected = inSpineOrder([
        ...routed.route.path,
        ...routed.route.waived.map((w) => w.station),
      ]);
      expect(drawn).toEqual(expected);
      // Nothing is drawn twice, and nothing the route knows about is missing.
      expect(new Set(drawn).size).toBe(drawn.length);
      for (const s of routed.route.path) expect(drawn).toContain(s);
      for (const w of routed.route.waived) expect(drawn).toContain(w.station);
    }
  });

  test("a waived station is drawn as waived and keeps the reason it was waived for", () => {
    // Founder ruling: a skipped station is a decision on the record WITH a
    // reason, not an absence. `suggestRoute` supplies one for every waiver it
    // issues, so a blank here would mean one was dropped in transit.
    let sawAWaiver = false;
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: PROPOSAL.origin, station: null });
      const waived = new Map(routed.route.waived.map((w) => [w.station, w.reason]));
      for (const stop of stopsForRoute(routed)) {
        if (!waived.has(stop.station)) {
          expect(stop.state).toBe("pending");
          expect(stop.waivedReason).toBeUndefined();
          continue;
        }
        sawAWaiver = true;
        expect(stop.state).toBe("skipped");
        expect(stop.waivedReason).toBe(waived.get(stop.station)!);
        expect(stop.waivedReason!.length).toBeGreaterThan(0);
      }
    }
    // A pass that never met a waiver would prove nothing about waivers.
    expect(sawAWaiver).toBe(true);
  });
});

describe("what the gate shows", () => {
  test("names the station and the seat, and asks for one answer", () => {
    render(<AskPlanGate proposal={PROPOSAL} onDecide={() => {}} />);
    // The route said out loud, in the one position `route-intent.ts` scopes its
    // sentence to: before anything is dispatched.
    expect(screen.getByText(/picks this up/i)).toBeTruthy();
    expect(screen.getByText("Start it, and let it run")).toBeTruthy();
    expect(screen.getByText("Start it, check with me on writes")).toBeTruthy();
    expect(screen.getByText("Keep planning")).toBeTruthy();
  });

  test("shows the ceiling that was read, never a number of its own", () => {
    render(<AskPlanGate proposal={PROPOSAL} onDecide={() => {}} />);
    expect(screen.getByText("Spend ceiling")).toBeTruthy();
    expect(screen.getAllByText(/\$5\.00/).length).toBeGreaterThan(0);
  });

  test("says so plainly when the workspace has cleared its ceiling", () => {
    // `Spend` owns this sentence and ignores the caller's note when the cap is
    // null, which is why the adapter passes none: a line nothing renders is how
    // a surface comes to carry copy nobody has ever seen.
    render(<AskPlanGate proposal={{ ...PROPOSAL, spendCapUsd: null }} onDecide={() => {}} />);
    expect(screen.getByText(/nothing stops this on spend/i)).toBeTruthy();
  });

  test("hands back the answer and the plan as it stood", () => {
    let taken: string | null = null;
    render(
      <AskPlanGate
        proposal={PROPOSAL}
        onDecide={(d) => {
          taken = d.autonomy;
        }}
      />,
    );
    act(() => {
      (
        screen.getByText("Start it, check with me on writes").closest("button") as HTMLButtonElement
      ).click();
    });
    expect(taken).toBe("check-writes");
  });

  test("keep planning asks what should change before it commits anything", () => {
    // The one answer that is not a single keystroke, and the one where a
    // keystroke alone would record nothing: sending work back with no note is a
    // shrug, and the crew replans from the same brief and files the same thing.
    let called = 0;
    render(
      <AskPlanGate
        proposal={PROPOSAL}
        onDecide={() => {
          called += 1;
        }}
      />,
    );
    act(() => {
      (screen.getByText("Keep planning").closest("button") as HTMLButtonElement).click();
    });
    expect(called).toBe(0);
    expect(screen.getByText("What should change?")).toBeTruthy();
  });
});

describe("when there is no plan to decide about", () => {
  test("says so, and offers no answers at all", () => {
    /*
     * THE HONEST DEGRADE. A station with no active cast seat is a real state —
     * `stationCrew` filters on tier, status and conductor — and it yields a plan
     * with no steps. What must NOT happen then is five plausible-looking steps,
     * or three answers about an empty card, which is a decision a person could
     * take that would mean nothing. `PlanGate` refuses both.
     */
    const routed = routeIntent({ shape: "existing-feature", origin: PROPOSAL.origin });
    const empty = { ...routed, crew: [] };
    expect(stepsForRoute(empty)).toEqual([]);

    render(
      <PlanGate
        steps={[]}
        stops={[]}
        spend={{ label: "Spend ceiling", spent: 0, cap: 5 }}
        onDecide={() => {}}
      />,
    );
    expect(screen.getByText("There is no plan to decide on yet.")).toBeTruthy();
    expect(screen.queryByText("Start it, and let it run")).toBeNull();
    expect(screen.queryByText("Keep planning")).toBeNull();
  });
});
