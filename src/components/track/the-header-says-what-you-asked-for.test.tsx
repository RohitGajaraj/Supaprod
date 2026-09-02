/**
 * THE RUN HEADER IS THE PERSON'S SENTENCE AND ONE STATUS CHIP.
 *
 * ── WHAT IT SAID BEFORE, AND WHY THREE OF THE FOUR BLOCKS HAD TO GO ───────
 * Photographed on `/track/ce846e9b`, the top of the screen read, in order: the
 * title, then "Now: Build. Next: Ship.", then two clamped lines of the opening
 * brief ending mid-word, then a status chip. Four blocks, of which:
 *
 *   "Now: Build. Next: Ship."   a POSITION. R-13 refused positions on a route
 *                               that waives and reopens stations, and the
 *                               station strip 40px above it was lighting the
 *                               same station at the same moment.
 *   the origin, clamped         the run's opening brief, up to a whole
 *                               paragraph of it, under the title. It is the
 *                               run's FIRST FACT, and the transcript's first
 *                               entry is where a first fact belongs.
 *
 * ── WHY THIS IS A RENDERING TEST AND NOT A GREP ───────────────────────────
 * The rule is a negative -- the origin never appears in the header -- and a
 * negative cannot be checked by looking for the absence of an import. `Reveal`
 * and `originLine` are both gone from the file today, and a future edit that
 * reintroduces the fact through some other path (a summary prop, a `sub` on the
 * heading, the origin folded into `runStatus`'s second line) would pass every
 * grep and put the paragraph straight back. So this renders the header with an
 * origin that is impossible to miss and asserts none of it is on screen.
 *
 * ── THE ORIGIN USED HERE IS DELIBERATELY LONG AND DISTINCTIVE ─────────────
 * A short one could be a substring of the title by accident. This one shares no
 * word with the title, so a single leaked fragment fails the test.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { RunHeader } from "@/routes/_authenticated.track.$trackId";
import { goalRepeatsOrigin } from "./ArtifactPane";
import type { Track } from "@/lib/spine/track.functions";

const ORIGIN =
  "Zebra crossing telemetry arrived overnight from four separate rooftops and nobody has reconciled it.";

const track = (over: Partial<Track> = {}): Track => ({
  id: "11111111-1111-1111-1111-111111111111",
  title: "Make checkout accept an Amex card",
  origin: ORIGIN,
  entry: "sense",
  station: "build",
  status: "open",
  route: { path: ["sense", "decide", "define", "design", "build", "ship", "learn"], waived: [] },
  summary: "",
  updatedAt: "2026-09-02T10:00:00Z",
  hold: null,
  holdReason: null,
  holdBecause: null,
  drivenAt: "2026-09-02T09:00:00Z",
  attempts: 0,
  ...over,
});

describe("the run header", () => {
  it("prints the person's sentence", () => {
    const { container } = render(<RunHeader track={track()} />);
    expect(container.textContent).toContain("Make checkout accept an Amex card");
  });

  it("never renders the origin, whole or in part", () => {
    const { container } = render(<RunHeader track={track()} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain(ORIGIN);
    // Every distinctive word of it, so a clamp or a summary cannot slip through.
    for (const word of ["Zebra", "telemetry", "rooftops", "reconciled"]) {
      expect(text).not.toContain(word);
    }
  });

  it("says no position, because a waivable route has none", () => {
    const { container } = render(<RunHeader track={track()} />);
    const text = container.textContent ?? "";
    // The exact shape that shipped: "Now: Build. Next: Ship."
    expect(text).not.toMatch(/\bNow:/);
    expect(text).not.toMatch(/\bNext:/);
    // And the meter's shape, which lived directly below it.
    expect(text).not.toMatch(/\bStation\s+\d+\s+of\s+\d+/i);
  });

  it("wears exactly one status chip", () => {
    const { container } = render(<RunHeader track={track({ status: "done" })} />);
    /*
     * One per screen is the rule, and the header is where the one lives. The
     * selector is `data-status`, which is `StatusChip`'s own attribute, so a
     * second chip drawn by any other means still counts.
     */
    expect(container.querySelectorAll("[data-status]").length).toBe(1);
  });

  it("still says a run came back on its own, which nothing else on the screen can", () => {
    /*
     * The one fact kept beside the title. It is not the origin and not a
     * position: it is the product's own loop closing, and `cameBackOnItsOwn`
     * exists because a track the return edge created carries no press and is
     * otherwise indistinguishable from one a person started.
     */
    const { container } = render(
      <RunHeader track={track()} fromLearningId="22222222-2222-2222-2222-222222222222" />,
    );
    expect((container.textContent ?? "").length).toBeGreaterThan(
      "Make checkout accept an Amex card".length,
    );
  });

  it("says nothing is being forecast when the decision is waived", () => {
    const { container } = render(<RunHeader track={track()} decideWaived />);
    expect(container.textContent).toContain("nothing is being forecast");
  });
});

describe("and the origin does not reach the screen through another door", () => {
  /*
   * ── THE SAME PROSE, ARRIVING AT THE OTHER PANE (A1, on `2fdf93b6`) ───────
   * The header was cut back to the person's sentence and one chip, and the Build
   * row's run card then printed *"Created directly by S0 on 2026-09-01 as the
   * FOURTH acceptance candidate, no press (F-164)..."* as its body.
   *
   * Not a coincidence: `trackGoalSentence` composes a mission's goal as
   * `${title}. ${originLine(title, origin)}`, so the mission's description IS
   * the origin with the title in front of it. Cutting one door and leaving the
   * other open is how internal prose keeps reaching a customer.
   */
  const ORIGIN_PROSE =
    "Created directly by S0 on 2026-09-01 as the FOURTH acceptance candidate, and it carries no press: F-164 measured that 18 of 20 driven tracks were pressed as their FIRST drive.";

  it("suppresses a run card body that is the origin wearing a title", () => {
    const goal = `Make checkout accept an Amex card. ${ORIGIN_PROSE}`;
    expect(goalRepeatsOrigin(goal, ORIGIN_PROSE)).toBe(true);
  });

  it("keeps a goal that is genuinely not the origin, because nothing else says it", () => {
    /*
     * Deleting the body outright would satisfy the rule and lose the one case
     * worth keeping. A mission whose goal is its own sentence has something to
     * say and no other place on this screen to say it.
     */
    expect(
      goalRepeatsOrigin("Prefill the checkout address from the account record.", ORIGIN_PROSE),
    ).toBe(false);
  });

  it("refuses to match on an origin too short to be evidence of anything", () => {
    // A very short origin could be a substring of an unrelated goal by accident.
    expect(goalRepeatsOrigin("Ship the thing", "Ship")).toBe(false);
    expect(goalRepeatsOrigin("anything at all", null)).toBe(false);
  });

  it("is not defeated by the markdown the render strips on the way out", () => {
    /*
     * The goal has been through `saidOnce` and `plainProse` by the time a reader
     * sees it, and 3 mission goals in the database carry `**bold**`. Whitespace
     * or a stripped asterisk must not be what decides whether internal prose
     * reaches a customer.
     */
    const goal = `Some title.  **${ORIGIN_PROSE}**`;
    expect(goalRepeatsOrigin(goal, ORIGIN_PROSE)).toBe(true);
  });
});
