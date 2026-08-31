import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { crossingLabel, aPersonAnsweredThis } from "./what-the-record-can-say";
import { CHECK_NAMES, CHECK_ORDER } from "@/lib/exec/check-names";

/**
 * WHAT THE AUDIT TRAIL IS ALLOWED TO CLAIM, AND WHAT THE PAGE SAYS COUNTS AS DONE.
 *
 * TWO GAPS, ONE SURFACE, so one file (`SPEC-AI-NATIVE-SDLC.md` §3 E and §3 H).
 *
 * ── GAP #19, THE NAMED APPROVER ───────────────────────────────────────────
 * The boundary page labelled every settled crossing "You allowed it" or "You
 * said no". `agent_approvals.decided_by` is NULL on **18 of 176** answered
 * approvals, so on 10% of rows that "You" was an attribution the data does not
 * support.
 *
 * The important half was measured before the fix, because the alarming reading
 * turned out to be the false one: `decided_by <> user_id` returns **0**. Nothing
 * was crediting one person's decision to another. It is an UNSUPPORTED
 * attribution, not a misattribution, and that is a smaller wrong of the same
 * wrong kind for a trail a company is meant to audit.
 *
 * ── GAP #18, WHAT COUNTS AS DONE ──────────────────────────────────────────
 * Nothing anywhere answered it. The three checks are real and are OURS, and the
 * page now says both. The tests below pin the two things that would quietly rot:
 * the names must come from the shared list rather than being retyped, and the
 * copy must not claim the checks GATE anything while F-148 is open.
 */

const PAGE = readFileSync(join(import.meta.dir, "BoundaryControls.tsx"), "utf8");
/** Comments quote the retired copy; assertions read code only. */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const CODE = PAGE.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

const row = (outcome: string, decidedBy: string | null) =>
  crossingLabel({ outcome, decidedBy } as Parameters<typeof crossingLabel>[0]);

describe("gap #19 — the trail stops saying 'you' about rows that cannot name anybody", () => {
  it("still says You when the record names a decider", () => {
    expect(row("allowed", "u-1").text).toBe("You allowed it");
    expect(row("declined", "u-1").text).toBe("You said no");
    expect(row("allowed", "u-1").caveat).toBeNull();
  });

  it("drops the You and says so when the record names nobody", () => {
    expect(row("allowed", null).text).toBe("Allowed");
    expect(row("declined", null).text).toBe("Declined");
    expect(row("allowed", null).caveat).toBe("who answered is not on the record");
    expect(row("declined", null).caveat).toBe("who answered is not on the record");
  });

  /**
   * The failure mode of an over-eager fix. A rule hit has a null decider BY
   * CONSTRUCTION and an expiry was answered by a clock, so printing "who
   * answered is not on the record" there would be a NEW false statement about a
   * case where there is correctly nobody to name.
   */
  it("says nothing about a missing answerer where there was never one to miss", () => {
    for (const outcome of ["blocked", "expired", "waiting"]) {
      expect(row(outcome, null).caveat).toBeNull();
      expect(aPersonAnsweredThis(outcome as never)).toBe(false);
    }
    expect(row("blocked", null).text).toBe("Stopped by a rule");
    expect(row("expired", null).text).toBe("Ran out of time");
  });

  it("never weakens the tone, because how it ended did not change", () => {
    expect(row("allowed", null).tone).toBe(row("allowed", "u-1").tone);
    expect(row("declined", null).tone).toBe(row("declined", "u-1").tone);
  });

  it("the page reads the caveat from the label instead of testing decidedBy again", () => {
    expect(CODE).toContain("o.caveat");
    const rowBlock = CODE.slice(CODE.indexOf("crossingLabel(e)"), CODE.indexOf("{waiting > 0"));
    expect(rowBlock).not.toContain("decidedBy");
  });
});

describe("gap #18 — the page says what counts as done, and does not overclaim it", () => {
  it("renders the section", () => {
    expect(CODE).toContain('title="What counts as done"');
  });

  /**
   * The one-idea-two-vocabularies guard. Retyping "typecheck, test, lint" into
   * the component is the defect `check-names.ts` was extracted to prevent, and
   * the second copy is always the one that goes stale silently.
   */
  it("takes the names from the shared list rather than retyping them", () => {
    expect(CODE).toContain("CHECK_NAMES.map");
    const region = CODE.slice(
      CODE.indexOf('title="What counts as done"'),
      CODE.indexOf('title="What counts as done"') + 1200,
    );
    for (const name of CHECK_ORDER) {
      expect(region).not.toContain(`"${name}"`);
    }
  });

  it("names ours as ours, which is the fourth floor's rule", () => {
    expect(CODE).toContain("We chose them, not you");
  });

  /**
   * F-148 IS OPEN: `studio.checks.run` is implemented and briefed, and the
   * Build-to-Ship advance is not refused on a red verdict. `check-names.ts` says
   * in its own header that any surface built on it must describe what gets RUN
   * and never what must PASS. This is that rule, enforced.
   *
   * THE GUARD IS DELIBERATELY BLUNT AND THE COPY MOVED TO SUIT IT. The first
   * draft of that line read "not as what it must pass", which is honest English
   * and trips this substring check, because a substring cannot read a negation.
   * Teaching the guard about negation would make it defeatable by the next
   * phrasing nobody anticipated; rewording the copy to "not as a bar it has to
   * clear" costs nothing and keeps a check that cannot be talked around. If this
   * fails on copy you believe is honest, prefer changing the copy.
   */
  it("does not claim the checks gate a release while F-148 is open", () => {
    expect(CODE).toContain("not a gate that blocks a release");
    const region = CODE.slice(CODE.indexOf('title="What counts as done"'));
    const untilNextRegion = region.slice(0, region.indexOf("</Region>"));
    for (const overclaim of [
      "must pass",
      "blocks the release",
      "cannot ship",
      "required to ship",
    ]) {
      expect(untilNextRegion.toLowerCase()).not.toContain(overclaim);
    }
  });

  it("the shared list is the three checks the runner actually runs", () => {
    expect(CHECK_NAMES.map((c) => c.name)).toEqual(["typecheck", "test", "lint"]);
    const runner = readFileSync(
      join(import.meta.dir, "..", "..", "lib", "exec", "e2b.server.ts"),
      "utf8",
    );
    expect(runner).toContain("CHECK_NAMES");
  });
});
