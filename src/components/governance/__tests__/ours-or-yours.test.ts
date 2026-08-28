/**
 * EVERY TOOL ROW LOOKED THE SAME WHETHER SOMEBODY HAD RULED ON IT OR NEVER SEEN IT.
 *
 * On the screen that exists to answer "what can these agents do without asking
 * me", the difference between a permission a person GRANTED and one the
 * platform ASSUMED is the whole question. The governance canon's fourth floor
 * already states the rule for the numeric bars -- a default the user never set
 * is our choice, and the surface names it as ours -- and `oursNote()` says so
 * beside each of them. The tool list said nothing.
 *
 * `BoundaryTool.chosen` has been available since F-139 and no surface read it.
 *
 * Measured 2026-08-27: 97 `agent_tools` rows across 16 workspaces, every one
 * edited after creation, the most recent today. People do move this. What they
 * have not moved is the platform's guess.
 */
import { describe, it, expect } from "bun:test";
import { oursNotYours } from "../who-chose-this";

describe("ours or yours", () => {
  it("counts the ones nobody ruled on", () => {
    expect(oursNotYours([{ chosen: true }, { chosen: false }, { chosen: false }])).toBe(
      "2 of these are what we ship, not settings anybody here has made.",
    );
  });

  it("says it plainly when the whole block is ours", () => {
    expect(oursNotYours([{ chosen: false }, { chosen: false }])).toBe(
      "These are what we ship, not settings anybody here has made.",
    );
    expect(oursNotYours([{ chosen: false }])).toBe("This is what we ship, not something you set.");
  });

  it("says nothing when every row was chosen", () => {
    expect(oursNotYours([{ chosen: true }, { chosen: true }])).toBeNull();
  });

  it("a count over nothing is not a fact", () => {
    expect(oursNotYours([])).toBeNull();
    expect(oursNotYours(null)).toBeNull();
    expect(oursNotYours(undefined)).toBeNull();
  });

  /**
   * ABSENT IS NOT FALSE. A read that predates the field carries `undefined`,
   * which means we cannot tell, and counting it as "ours" would put a
   * disclosure on a row nobody can vouch for. Same three-state discipline as
   * `gatesLiveWork` and `didAlone`.
   */
  it("an unknown provenance is never claimed as ours", () => {
    expect(oursNotYours([{}, {}, {}])).toBeNull();
    expect(oursNotYours([{ chosen: false }, {}, {}])).toBe(
      "1 of these is what we ship, not one anybody here has made.",
    );
  });

  /* A default nobody ruled on is not a mistake. Most are correct, and
     re-deciding all of them would be worse than leaving them. */
  it("counts without scolding", () => {
    const said = oursNotYours([{ chosen: false }, { chosen: true }]) ?? "";
    expect(said.toLowerCase()).not.toMatch(/\b(should|must|review these|fix|risk)\b/);
  });
});
