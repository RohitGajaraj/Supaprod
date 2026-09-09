/**
 * F-116, THE WIRING HALF: a gate with no callers is decoration.
 *
 * `decision-gate.ts` says this about itself, having been bitten: gate 4 there
 * was "built and left with zero callers, which is how a convention quietly
 * becomes decoration". `spec-gate.ts` is a gate on a LEVER, so the same mistake
 * would be worse, and these tests exist so it cannot be made silently.
 *
 * Two connections have to hold, and neither is visible from the gate's own
 * tests:
 *   1 · `critic.evaluate` runs the gate, so a filed verdict can clear a spec.
 *   2 · `design-critic` is TOLD to file, so a pass stops being invisible.
 *
 * The second is the actual finding. That seat's brief said only "say plainly if
 * it is sound as it stands", so a design it approved wrote nothing anywhere.
 * 116 of 119 live specs sat on a `pending` design gate that only a human server
 * function can write, and Ship refused every one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { stationCrew, stationGoal } from "@/lib/spine/driver";

const CRITIC = readFileSync(
  fileURLToPath(new URL("../ai/critic.server.ts", import.meta.url)),
  "utf8",
);
const TRACK = { title: "Homeowners abandon checkout on the address screen", origin: null };

describe("the gate has a caller", () => {
  it("critic.evaluate runs it", () => {
    expect(CRITIC).toContain("clearSpecIfProven");
    expect(CRITIC).toContain('from "@/lib/spec-gate.server"');
  });

  it("only for specs, never for opportunities", () => {
    expect(CRITIC).toContain('if (args.target_kind !== "prd") return { ok: true, review };');
  });

  it("and it reports BOTH outcomes, not only a clearance", () => {
    /*
     * A seat told only about a clearance reads silence as "it cleared", and then
     * reports a spec as ready over the gate's refusal. That is F-68 with a new
     * subject: a station asserting a step its own tool call showed was refused.
     */
    expect(CRITIC).toContain('"still needs a person"');
    expect(CRITIC).toContain("spec_status_because: clearance.reason");
  });
});

describe("the seat that judges the design is told to file the judgement", () => {
  const critic = () => stationCrew("design").find((c) => c.slug === "design-critic");

  it("design-critic is still in Design's crew", () => {
    expect(critic(), "design-critic left the crew").toBeDefined();
  });

  it("its DELIVERED brief tells it to call critic.evaluate", () => {
    // Rendered through stationGoal, not read off CREW_ROLE. A rule present in a
    // constant and absent from the composed brief is exactly what F-114 was.
    const brief = stationGoal("design", TRACK, [], critic()!);
    expect(brief).toContain("critic.evaluate");
  });

  it("and to file it WHETHER OR NOT it changed anything, which is the whole fix", () => {
    const brief = stationGoal("design", TRACK, [], critic()!);
    expect(brief).toMatch(/whether or not you changed anything/i);
  });

  it("and it is told WHY, because a bare instruction gets reasoned around", () => {
    const brief = stationGoal("design", TRACK, [], critic()!);
    expect(brief).toMatch(/cannot be told apart from one nobody read/i);
  });

  it("it can still say the design is sound by changing nothing", () => {
    // The fix must not turn "sound as it stands" into a forced revision. The
    // instruction adds a filing step; it does not add a change. Reworded
    // 2026-09-09 to say the same thing the other way round, after the seat was
    // found re-filing the drawing it had just read as its "critique": a redraw
    // is conditional, the verdict is not.
    const brief = stationGoal("design", TRACK, [], critic()!);
    expect(brief).toContain("ONLY if the design itself must change");
    expect(brief).toMatch(/re-filing the drawing you just read is not a critique/i);
  });
});

describe("the clearance can never erase the red-team that already happened", () => {
  const GATE = readFileSync(
    fileURLToPath(new URL("../spec-gate.server.ts", import.meta.url)),
    "utf8",
  );

  it("clearSpecIfProven cannot throw", () => {
    /*
     * Caught by the existing critic tests, and it was a real defect rather than
     * a fixture problem. `clearSpecIfProven` runs AFTER `runCritic` has
     * persisted a verdict. A throw escaping here would make `critic.evaluate`
     * report a tool FAILURE over a write that succeeded, so the seat would be
     * told its red-team did not happen while the row on the spec says it did.
     * F-68 arriving from the other side.
     */
    expect(GATE).toContain("} catch (e) {");
    expect(GATE).toContain("could not be run, so nothing was cleared");
  });

  it("and it says so rather than returning a null the caller reads as 'no'", () => {
    // A clearance that silently did not happen looks exactly like a spec that
    // did not deserve one. That is the F-76 shape this whole line closes.
    expect(GATE).toContain("could not be read, so nothing was cleared");
    expect(GATE).toContain("The bets behind this spec could not be read");
    expect(GATE).toContain("cleared its review but the status could not be written");
  });

  it("the status write is guarded by the state it was decided on", () => {
    // Two Critic runs landing together must not both clear, and a person who
    // shipped or rejected the spec in between must win.
    expect(GATE).toContain('.eq("status", inputs.status ?? "")');
  });
});

describe("the design pass records its own silence (F-132)", () => {
  const CRITIC = readFileSync(
    fileURLToPath(new URL("../ai/critic.server.ts", import.meta.url)),
    "utf8",
  );

  it("a wanted design read that did not come back is written down", () => {
    /*
     * `if (design) review.design = design;` alone left the key ABSENT, and an
     * absent key cannot say which of three things happened: the pass failed, it
     * ran and found nothing, or nobody wanted one.
     *
     * Harmless while the lens only augmented a receipt. It stopped being
     * harmless the moment `spec-gate.ts` gate 8 began reading a missing design
     * verdict as "nobody has read this design back" — a claim about the WORK,
     * over what may be a second model call of ours that did not return.
     */
    expect(CRITIC).toContain("else review.design_unavailable = true;");
  });

  it("only inside the branch where a design read was WANTED", () => {
    // We are under `target.kind === "prd"`, so a null means we asked and did not
    // get one. Outside it, nobody asked and there is nothing to record.
    const branch = CRITIC.slice(CRITIC.indexOf('if (target.kind === "prd") {'));
    expect(branch.slice(0, 1800)).toContain("design_unavailable");
  });

  it("and the type says what the flag is FOR, not just that it exists", () => {
    expect(CRITIC).toContain("design_unavailable?: boolean;");
    expect(CRITIC).toContain("a fact about the work and a fact");
  });
});
