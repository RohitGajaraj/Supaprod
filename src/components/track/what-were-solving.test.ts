import { describe, it, expect } from "bun:test";
import { solvingFields, solvingState, shapeLine, unfilled, type Bet } from "./what-were-solving";

const bet = (over: Partial<Bet> = {}): Bet => ({
  id: "b1",
  title: "Crews retype the same homeowner details",
  problem:
    "Name, service address and panel count are entered once by the rep and again by the installer.",
  hypothesis: "Sync the record so the second entry never happens.",
  target_user: "Install crews, and the Atlas record they work from.",
  ...over,
});

describe("the shape Discover is asked for, read off the bet", () => {
  it("keeps the spec's names and the spec's order", () => {
    // SPEC-STATION-MODEL-AND-ARTIFACTS §2.1 design decision 1: "Their five
    // fields keep their names and their order." A team on the playbook reads
    // a file they already know, so the surface must not reorder them either.
    expect(solvingFields(bet()).map((f) => f.name)).toEqual([
      "Problem",
      "Proposed outcome",
      "Affected users and systems",
    ]);
  });

  it("names a blank instead of skipping it, which is the whole unit", () => {
    /*
     * `OpportunityDetailSheet` renders `{o.target_user ? <Stated/> : null}`,
     * so a bet with no target user shows two fields and the reader cannot tell
     * whether the third was never asked for or never answered. §2.1 calls that
     * passing quietly and rules it a defect.
     */
    const fields = solvingFields(bet({ target_user: null }));
    const affected = fields.find((f) => f.name === "Affected users and systems");
    expect(affected?.value).toBeNull();
    expect(affected?.absent).toBe("Nothing here says who this affects.");
    expect(affected?.answerLabel).toBe("Say who this affects");
    // Still three fields. A gap is drawn, never dropped.
    expect(fields).toHaveLength(3);
  });

  it("treats whitespace as unfilled, because a space is not an answer", () => {
    expect(solvingFields(bet({ problem: "   " }))[0].value).toBeNull();
    expect(solvingFields(bet({ problem: "" }))[0].value).toBeNull();
  });

  it("counts the gaps and never reads as a clean bill when there are any", () => {
    expect(shapeLine(solvingFields(bet()))).toBe(
      "Everything this station is asked for has been written down.",
    );
    expect(shapeLine(solvingFields(bet({ target_user: null })))).toBe(
      "One thing this station is asked for has not been written down.",
    );
    expect(shapeLine(solvingFields(bet({ target_user: null, hypothesis: null })))).toBe(
      "2 things this station is asked for have not been written down.",
    );
    expect(
      shapeLine(solvingFields(bet({ problem: null, hypothesis: null, target_user: null }))),
    ).toBe("This came in as a title, and nothing under it is written down.");
  });

  it("reports every gap, so the sentence above the shape can be derived", () => {
    expect(unfilled(solvingFields(bet())).map((f) => f.name)).toEqual([]);
    expect(
      unfilled(solvingFields(bet({ problem: null, hypothesis: null }))).map((f) => f.name),
    ).toEqual(["Problem", "Proposed outcome"]);
  });
});

describe("what the section is before a field is drawn", () => {
  it("says no pattern when the track carries no theme", () => {
    // 48 of 106 real tracks have a null `theme_id`. There is nothing to
    // promote, so the honest state points down at the evidence rather than
    // offering an action that cannot run.
    expect(solvingState(null, [])).toEqual({ kind: "no-pattern" });
    expect(solvingState(null, [bet()])).toEqual({ kind: "no-pattern" });
  });

  it("distinguishes a pattern nobody promoted from a bet that exists", () => {
    /*
     * The difference this keeps is the one §1.3 forbids collapsing: a theme
     * with no bet is work waiting to be started, and it has an action
     * (`promoteThemeToOpportunity`). An absent theme has none. Drawing them
     * the same way would offer a control that throws.
     */
    expect(solvingState("t1", [])).toEqual({ kind: "no-bet", themeId: "t1" });
    expect(solvingState("t1", [bet()])).toEqual({ kind: "bet", bet: bet() });
  });
});
