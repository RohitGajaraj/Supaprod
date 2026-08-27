/**
 * A COMMA IS RIGHT FOR ONE CASE AND WRONG FOR FIVE (S1 → S0, 2026-08-27).
 *
 * `normalizeDashes` replaced every dash with a comma unconditionally. That is
 * correct for the aside — *"The run, which was held, never moved."* — and it
 * produced five results MORE obviously machine-made than the dash they replaced:
 *
 *     "It said this —"          ->  "It said this ,"     a dangling comma
 *     "— and then it stopped."  ->  ", and then it..."   opens with a comma
 *     "It stopped — ."          ->  "It stopped, ."      comma before a full stop
 *     "First, — then second."   ->  "First,, then..."    a doubled comma
 *     "a run–time decision"     ->  "a run, time..."     A DIFFERENT SENTENCE
 *
 * The founder's instruction is that no trace of machine writing is left where a
 * person can see it. The tell had not been removed, it had been swapped for a
 * stranger one, and the compound case changed the meaning outright.
 *
 * S1 found it by probing the SQL trigger and the TypeScript with identical
 * inputs and getting identical output — which was the point of mirroring them,
 * and meant the mirror faithfully carried five defects.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { humanizeText } from "./humanize";

const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);

const SQL = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/20260827030000_a_comma_is_right_for_one_case_and_wrong_for_five.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

/**
 * THE FIXTURE BOTH HALVES ARE HELD TO. Every case below has been run against the
 * live database function as well, and matched character for character.
 */
const CASES: ReadonlyArray<readonly [string, string]> = [
  [`It said this ${EM}`, "It said this"],
  [`${EM} and then it stopped.`, "and then it stopped."],
  [`It stopped ${EM} .`, "It stopped."],
  [`First, ${EM} then second.`, "First, then second."],
  [`a run${EN}time decision`, "a run-time decision"],
  [`The run ${EM} which was held ${EM} never moved.`, "The run, which was held, never moved."],
  [`4${EN}12h`, "4 to 12h"],
];

describe("the five it used to get wrong", () => {
  for (const [input, want] of CASES) {
    it(`${JSON.stringify(input)} -> ${JSON.stringify(want)}`, () => {
      expect(humanizeText(input)).toBe(want);
    });
  }
});

describe("and the punctuation it must never invent", () => {
  it("never leaves a dangling or doubled comma anywhere", () => {
    for (const [input] of CASES) {
      const out = humanizeText(input);
      expect(out, `dangling comma in ${JSON.stringify(out)}`).not.toMatch(/\s,\s*$/);
      expect(out, `doubled comma in ${JSON.stringify(out)}`).not.toContain(",,");
      expect(out, `comma before a stop in ${JSON.stringify(out)}`).not.toMatch(/,\s*[.;:!?]/);
      expect(out, `opens with a comma: ${JSON.stringify(out)}`).not.toMatch(/^\s*,/);
    }
  });

  it("an ASCII hyphen is still never touched", () => {
    const ids = "src/lib/ai/humanize-text.ts and lane/first-run and 8391835f-0999";
    expect(humanizeText(ids)).toBe(ids);
  });
});

describe("THE TWO HALVES MUST MOVE TOGETHER, or a third variant is born", () => {
  it("the SQL mirror carries the same eight steps", () => {
    // Order is the rule: each step removes a dash the general rule would
    // mishandle, so the unconditional comma only ever sees the aside.
    for (const step of ["'\\1 to \\2'", "'\\1-\\2'", "([[:alpha:]])", "'\\1'"]) {
      expect(SQL, `the SQL lost a step: ${step}`).toContain(step);
    }
  });

  it("and says out loud that it must not drift", () => {
    expect(SQL).toContain("Change both or neither");
  });
});
