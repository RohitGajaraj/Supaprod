import { describe, it, expect } from "bun:test";
import { cameBackOnItsOwn, originRunsFull } from "./came-back-on-its-own";

describe("work that came back from a missed forecast", () => {
  it("says nobody started it, which is the one thing the origin cannot say", () => {
    /*
     * The origin beneath this already carries the forecast, the horizon and the
     * outcome. This adds the fact that no person asked for it -- which is what
     * makes the track the acceptance path: return-edge.ts's own header notes
     * that 18 of 20 driven tracks were pressed as their first drive, and the
     * acceptance query excludes any track carrying a press.
     */
    expect(cameBackOnItsOwn("l-1")).toBe(
      "Nobody started this. It came back on its own because a forecast did not hold.",
    );
  });

  it("says nothing at all about ordinary work", () => {
    // 106 of 106 tracks today. A sentence here would be a claim about how the
    // work started that the column does not support.
    expect(cameBackOnItsOwn(null)).toBeNull();
    expect(cameBackOnItsOwn(undefined)).toBeNull();
    expect(cameBackOnItsOwn("")).toBeNull();
  });

  it("lets ONLY a returned origin past the header's two-line clamp", () => {
    /*
     * The clamp is right for the ordinary case and this does not remove it: an
     * unbounded origin block competes with the status for first read, which is
     * why it was added. A returned origin is different in kind -- it is the
     * forecast travelling VERBATIM with the work (SPEC §2.5's rule, so a claim
     * cannot be read after its source row changed) -- and truncating evidence
     * is the one thing this surface may not do.
     */
    expect(originRunsFull("l-1")).toBe(true);
    expect(originRunsFull(null)).toBe(false);
    expect(originRunsFull(undefined)).toBe(false);
    expect(originRunsFull("")).toBe(false);
  });

  it("does not dress it as an alert, because it must stay refusable", () => {
    // The whole shape the edge adopted: a missed forecast becomes ORDINARY,
    // refusable work, and returnedWorkOrigin ends by saying so. A person cannot
    // decline a thing the product has dressed as an alarm, so the copy is a
    // statement rather than a warning and carries no urgency word.
    const line = cameBackOnItsOwn("l-1") ?? "";
    for (const alarm of ["alert", "urgent", "failed", "error", "action required", "!"]) {
      expect(line.toLowerCase()).not.toContain(alarm);
    }
  });
});
