/**
 * ONE LIST OF CHECKS, NOT TWO THAT AGREE TODAY (gap #18, 2026-08-31).
 *
 * The three names lived inside a `.server.ts`, so a surface that wanted to show
 * a customer what runs before a pull request could not import them, and the
 * tempting fix was to type the words again in the component. That is the
 * one-idea-two-vocabularies defect this repo has paid for repeatedly, and the
 * second copy is always the one that goes stale silently. These tests fail if
 * the runner and the shared list ever stop being the same list.
 */
import { describe, expect, it } from "bun:test";

import { CHECK_NAMES, CHECK_ORDER } from "./check-names";
import { defaultChecks } from "./e2b.server";

describe("the runner runs exactly the checks the shared list names", () => {
  it("same names, same order", () => {
    expect(defaultChecks().map((c) => c.name)).toEqual([...CHECK_ORDER]);
  });

  it("every named check has a real command behind it", () => {
    // Guards the mapping: a name with no entry would yield `run: undefined` and
    // fail at the sandbox rather than here.
    for (const c of defaultChecks()) {
      expect(typeof c.run, `${c.name} has no command`).toBe("string");
      expect(c.run.length).toBeGreaterThan(10);
    }
  });

  it("typecheck runs first, because its failure makes the other two noise", () => {
    expect(defaultChecks()[0]?.name).toBe("typecheck");
  });

  it("every check says what it answers, in words with no jargon in them", () => {
    for (const c of CHECK_NAMES) {
      expect(c.says.length).toBeGreaterThan(0);
      // Operating model section 12: if a person would not say it to a
      // colleague, it does not go on a surface.
      for (const banned of ["guardrail", "artifact", "signal", "provenance"]) {
        expect(c.says.toLowerCase()).not.toContain(banned);
      }
    }
  });

  it("THE SHARED LIST CARRIES NO SHELL, so a surface cannot learn how to run one", () => {
    /*
     * The split that makes this safe to import anywhere: names are the promise,
     * commands are a deployment detail. If a `run` field ever appears here,
     * this module has stopped being the shared half.
     */
    for (const c of CHECK_NAMES) {
      expect(Object.keys(c).sort()).toEqual(["name", "says"]);
    }
  });
});
