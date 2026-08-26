import { describe, expect, it } from "bun:test";

import { footerMode } from "./footer-mode";

const at = (o: Partial<Parameters<typeof footerMode>[0]>) =>
  footerMode({ status: "open", tone: null, walking: false, crewLive: false, ...o });

describe("the footer", () => {
  it("never says a position", () => {
    /*
     * THE-ONE-SCREEN:31, and the reason is R-13's: a route that waives and
     * reopens stations cannot honestly be drawn as a position. "Step 3 of 7" is
     * a position wearing a sentence, so no branch may count anything.
     */
    const every = [
      at({ walking: true }),
      at({ crewLive: true }),
      at({ tone: "you" }),
      at({ tone: "hold" }),
      at({}),
      at({ status: "done" }),
      at({ status: "abandoned" }),
    ];
    for (const m of every) {
      expect(m.line).not.toMatch(/\bstep\b/i);
      expect(m.line).not.toMatch(/\d+\s*of\s*\d+/i);
      expect(m.line).not.toMatch(/[—–]/);
    }
  });

  it("offers a Stop only where a press here can actually stop something", () => {
    // This tab's own press bought the legs, so cancelling them is real.
    expect(at({ walking: true }).canStop).toBe(true);
    // The sweep's run is not stoppable from this surface. Drawing a Stop for it
    // would be a control that cannot act, which is the failure RunMap's own Stop
    // was removed for.
    expect(at({ crewLive: true }).canStop).toBe(false);
    for (const m of [at({ tone: "you" }), at({ tone: "hold" }), at({ status: "done" })]) {
      expect(m.canStop).toBe(false);
    }
  });

  it("tells the truth about work it cannot stop, rather than going quiet", () => {
    // Same mode line either way: something IS working. Only the control differs.
    expect(at({ crewLive: true }).line).toBe(at({ walking: true }).line);
  });

  it("says it will ask before it ships, which R-27 makes true everywhere", () => {
    /*
     * Not a mood. release.publish is pinned to review and can never graduate,
     * and R-27 refused the flag that would have let it run unattended. It is a
     * platform invariant, not a workspace setting, which is what makes it safe
     * to say on every run.
     */
    expect(at({ walking: true }).line).toContain("ask before it ships");
  });

  it("separates waiting on a person from stopped for another reason", () => {
    expect(at({ tone: "you" }).line).toContain("you");
    expect(at({ tone: "hold" }).line).toContain("not on you");
  });
});
