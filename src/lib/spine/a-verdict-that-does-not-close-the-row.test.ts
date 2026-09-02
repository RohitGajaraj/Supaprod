/**
 * THE GRADER WAS UNWIRED, AND THAT IS WHY THE HORIZON VERDICT NEVER ARRIVED.
 *
 * ── WHAT WAS ACTUALLY WRONG ────────────────────────────────────────────────
 * `learning.record` is the tool the Learn station is told to finish with. It
 * READ three `forecast_*` columns to guard itself -- not before the horizon, and
 * not against a different claim -- and wrote none of them back. So an agent
 * could grade at Learn, file a `learnings` row, and leave
 * `decisions.forecast_resolution` NULL: the bet stayed due forever, the Learn
 * desk kept offering it, and the verdict this product is built around never
 * appeared.
 *
 * Not a missing grader. An unwired one, which is why three months of looking for
 * the missing piece found nothing.
 *
 * The only other closers are the human desk, MCP `settle_forecast`, and the
 * auditor tick -- and the auditor tick rode a workspace flag that defaults false
 * on every workspace in the database, so on a track driven by the loop nothing
 * closed the row at all.
 *
 * A1's ruling, 2026-09-03: *"a verdict that does not close the row is not a
 * verdict."*
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const REG = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
const code = REG.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const flat = code.replace(/\s+/g, " ");

/** The `learning.record` handler alone, so a match elsewhere cannot stand in. */
const LEARNING = code.slice(
  code.indexOf('"learning.record"'),
  code.indexOf('"memory.remember"', code.indexOf('"learning.record"')),
);
/** Whitespace-insensitive, because prettier decides where a ternary breaks and
 *  a guard that a reformat can break is a guard that gets deleted. */
const learningFlat = LEARNING.replace(/\s+/g, " ");

describe("the verdict closes the row", () => {
  it("settles the decision it graded", () => {
    expect(LEARNING).toContain("buildSettlePatch({");
    expect(LEARNING).toContain('.from("decisions")');
    expect(LEARNING).toContain('.eq("id", resolvedDecisionId)');
  });

  it("maps each verdict to a resolution, and mixed is not a hit", () => {
    /*
     * `mixed` is the one that would be tempting to round up. A partially-held
     * forecast recorded as `hit` is the same defect as a self-referential one
     * graded `hit`: a win on the record for something that did not happen.
     */
    expect(flat).toContain('a.verdict === "validated" ? "hit"');
    expect(flat).toContain('a.verdict === "missed" ? "miss"');
    expect(flat).toContain('"inconclusive"');
  });

  it("only settles a bet nobody has settled, unlike the human desk", () => {
    /*
     * The asymmetry is deliberate. A person re-scoring on better evidence is
     * legitimate and has a reopen path that files the old verdict first; an
     * agent silently overwriting a settled bet would destroy the record this
     * product sells.
     */
    expect(LEARNING).toContain('.is("forecast_resolution", null)');
  });

  it("does not fail the whole grade when the settle fails", () => {
    // The `learnings` row has already landed. Throwing would report the grade as
    // failed and invite the seat to file it twice, which is worse than a bet
    // that stays open one more tick.
    expect(LEARNING).toContain("[learning.record] could not settle the forecast:");
    expect(LEARNING).toContain("[learning.record] settle threw:");
  });
});

describe("every resolution files a row, not only the ones taken back", () => {
  it("writes the log from the grader too", () => {
    /*
     * `forecast_resolution_log` had exactly one writer, the reopen path, so it
     * held a history of CORRECTIONS with no history of the things corrected.
     * A1's ruling: every resolution files a row, the grader's included.
     */
    expect(LEARNING).toContain('.from("forecast_resolution_log")');
    expect(LEARNING).toContain("Graded at Learn when the horizon came due.");
  });

  it("only after the settle actually landed", () => {
    // A log row for a settle that matched no rows would record a verdict the
    // decision never took.
    expect(LEARNING.indexOf('.is("forecast_resolution", null)')).toBeLessThan(
      LEARNING.indexOf('.from("forecast_resolution_log")'),
    );
    expect(LEARNING).toContain("settled && settled.length > 0");
  });

  it("a lost log line costs the trail, not the answer", () => {
    expect(LEARNING).toContain("[learning.record] verdict filed but not logged:");
  });
});

describe("a forecast that grades itself is settled, not refused", () => {
  it("is inconclusive with the founder's sentence, through this same path", () => {
    /*
     * The founder's ruling of 2026-09-02 was to GRADE these, not delete them.
     * A refusal like the two guards around it would leave eight bets hanging
     * with nothing on the record saying why.
     */
    expect(LEARNING).toContain("aboutOurOwnPaperwork(observable, Object.keys(TOOL_REGISTRY))");
    expect(LEARNING).toContain("ungradeableBecause = whyItCannotBeGraded(paperwork.named)");
    expect(learningFlat).toContain("ungradeableBecause ? CANNOT_BE_GRADED");
  });

  it("skips the overlap check for those, because nothing could satisfy it", () => {
    /*
     * The overlap guard would refuse the tool outright -- "your verdict does not
     * mention prd.get" -- and the honest answer is that no verdict could mention
     * it usefully. `else if` rather than a second `if` is the whole fix.
     */
    expect(LEARNING).toContain("} else if (observable.trim()) {");
  });

  it("uses the platform's sentence as the rationale, not the agent's summary", () => {
    // The summary grades something the forecast never asked about, so storing it
    // as the reason would put a real-sounding rationale on a bet nobody measured.
    expect(LEARNING).toContain("const rationale = ungradeableBecause ?? a.summary;");
  });

  it("passes the registry's own names rather than keeping a second list", () => {
    // One source of truth handed across the boundary. A copied list drifts on
    // the first rename, and the drift is silent.
    expect(LEARNING).toContain("Object.keys(TOOL_REGISTRY)");
  });
});

describe("the tick that runs the auditor", () => {
  const TICK = readFileSync("src/routes/api/public/hooks/calibrate-tick.ts", "utf8");
  const tickCode = TICK.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("no longer asks a derivation preference whether a bet may be graded", () => {
    /*
     * `auto_derive_enabled` means "derive themes for me automatically". Grading
     * a forecast whose horizon passed is not derivation, and nobody opting out
     * of automatic themes was asking for their bets to go ungraded forever. The
     * forecast pass rode that flag only because it was added to a tick that
     * already existed, and the cost is measured: the auditor has never run once.
     */
    const selection = tickCode.slice(0, tickCode.indexOf("if (error)"));
    expect(selection).not.toContain('.eq("auto_derive_enabled", true)');
    expect(selection).toContain('.eq("is_sample", false)');
  });

  it("but derivation keeps its own preference, which is a real one a person sets", () => {
    /*
     * NOT removed and NOT defaulted true, which were the two options on the
     * table. Both are bigger than this: defaulting true switches on automatic
     * theme derivation for every workspace, and removing it takes away a control
     * Settings can actually write today.
     */
    expect(tickCode).toContain("ws.auto_derive_enabled");
    expect(tickCode).toContain("calibrateExpiredInsights");
  });

  it("and the forecast pass runs for every non-sample workspace", () => {
    /*
     * The whole point, and the thing that is easy to get wrong by tidying: the
     * auditor call must sit OUTSIDE the flag's ternary. The `totalScored` line
     * between them is the proof the branch has closed -- if a later edit pulled
     * the auditor inside, that line would no longer separate them.
     */
    const tickFlat = tickCode.replace(/\s+/g, " ");
    expect(tickFlat).toContain(
      "const f = await auditDueForecasts(supabaseAdmin, ws.owner_id, ws.id);",
    );
    const flagAt = tickFlat.indexOf("ws.auto_derive_enabled");
    // Searched from the flag onward: a bare `indexOf` finds the IMPORT of
    // `auditDueForecasts` at the top of the file, which is before everything and
    // proves nothing about the call.
    const auditAt = tickFlat.indexOf("await auditDueForecasts(", flagAt);
    expect(flagAt).toBeGreaterThan(-1);
    expect(flagAt).toBeLessThan(auditAt);
    expect(tickFlat.slice(flagAt, auditAt)).toContain("totalScored += scored;");
  });
});
