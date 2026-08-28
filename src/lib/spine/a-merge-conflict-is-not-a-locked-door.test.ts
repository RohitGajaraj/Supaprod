/**
 * F-130: THE MOST ORDINARY FIXABLE THING IN SOFTWARE PERMANENTLY ENDED WORK.
 *
 * `studio.pr.merge` throws on a GitHub 405, the driver files that as
 * `tools-refused`, and `tools-refused` is in `TERMINAL_HOLDS`. So a merge
 * conflict killed the track for good.
 *
 * **Both of the reasons that hold is terminal fail for a conflict, and each is
 * stated in the codebase in its own words:**
 *
 *   F-41, on why a refusal skips correction: a refused tool filed nothing *"for
 *   a reason that has nothing to do with the work"*. A conflict is entirely
 *   about the work.
 *
 *   `correction.ts`, on why it is terminal: *"there is no cheap way to test
 *   whether the ask has been met. 'Is GitHub reachable again' can only be
 *   answered by dispatching a paid run."* A conflict is answered by a plain GET.
 *
 * MEASURED BY S4 across this product's whole life: **eight real merge failures,
 * five of them conflicts.** Not an edge case — the single most common way a real
 * merge has failed here, and under F-75 auto-merge the loop meets it again with
 * no person in the run.
 *
 * ── WHY FALLING THROUGH IS THE WHOLE FIX ───────────────────────────────────
 * A refusal about the work takes the ORDINARY path: the attempt counts, and
 * three of them hand it to `decideCorrection`, which sends it back to be redone.
 * That resolves a conflict by construction, because `studio.commit` branches off
 * the CURRENT default-branch head — so rebuilding lands on what is there now and
 * nobody rebases anything.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { conflictLine, refusalIsAboutTheWork } from "@/lib/spine/refusal-kind";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");

describe("the real refusal strings, as measured", () => {
  it("the five conflicts are about the work", () => {
    // S4's exact string from `agent_approvals.error`.
    expect(
      refusalIsAboutTheWork(
        "studio.pr.merge",
        "GitHub merge 405: Pull Request has merge conflicts",
      ),
    ).toBe(true);
  });

  it("and so is GitHub's other phrasing of the same thing", () => {
    // The word they all share beats a list of sentences someone else controls.
    expect(
      refusalIsAboutTheWork(
        "studio.pr.merge",
        "GitHub merge 405: Pull Request is not mergeable, conflicts present",
      ),
    ).toBe(true);
  });

  it("a missing connection is NOT, and still takes F-41's path", () => {
    expect(
      refusalIsAboutTheWork(
        "studio.pr.merge",
        "GitHub is not connected. Connect it in Settings, then bind a repo on Connectors.",
      ),
    ).toBe(false);
  });

  it("CI still running is NOT, and correcting it would be actively wrong", () => {
    /*
     * The entry I deliberately left out. The work is fine and the answer is to
     * wait; sending it back to be rewritten would destroy a good change over a
     * transient state. One wrong entry in that list does the exact damage F-41
     * was written to stop.
     */
    expect(refusalIsAboutTheWork("studio.pr.merge", "MergeBlocked: CI is still running.")).toBe(
      false,
    );
  });

  it("no open Studio PR is NOT, for now", () => {
    expect(refusalIsAboutTheWork("studio.pr.merge", "no open Studio PR on this mission")).toBe(
      false,
    );
  });
});

describe("F-137: the branch had already moved on before the merge was reached", () => {
  /*
   * Both halves of the measurement live in DIFFERENT TABLES, and reading either
   * alone makes the other look like it never happened. `agent_approvals.error`
   * holds the 5 merge conflicts; `tool_calls.error` holds 7 rows of the PR
   * failing to OPEN for the same underlying reason, and `studio.pr.merge` has
   * never failed there at all. Measured 2026-08-28.
   */
  it("a branch behind main is about the work, exactly as a conflict is", () => {
    // The recorded string, 7 rows, under the tool's name at the time.
    expect(
      refusalIsAboutTheWork(
        "studio.pr.open",
        "branch relay-app/checkout-single-address is 14 commits behind main, rebase required before a PR can open",
      ),
    ).toBe(true);
  });

  it("either phrase alone is enough, since the tools word it differently", () => {
    expect(refusalIsAboutTheWork("studio.pr.open", "rebase required")).toBe(true);
    expect(refusalIsAboutTheWork("studio.pr.open", "the branch is behind main")).toBe(true);
  });

  it("and the merge tool still answers to the stale-branch wording too", () => {
    expect(refusalIsAboutTheWork("studio.pr.merge", "not mergeable, rebase required")).toBe(true);
  });

  it("a repo-binding refusal on the same tool is NOT, and stays terminal", () => {
    /*
     * The other real failure recorded against this tool. It is a policy refusal
     * about which repository the evidence belongs to, and rebuilding the branch
     * would not touch it, so it must keep taking F-41's path.
     */
    expect(
      refusalIsAboutTheWork(
        "studio.pr.open",
        "Refused: this changeset's pull request is #5 on RohitGajaraj/relay-homeowner-app, and this workspace is bound to Supaprod/relay-homeowner-app.",
      ),
    ).toBe(false);
  });

  it("the sentence covers the open as well as the merge", () => {
    // It used to say "could not merge", which is wrong for the case that has
    // actually happened here seven times.
    expect(conflictLine()).not.toContain("could not merge");
    expect(conflictLine()).toContain("could not land");
  });
});

describe("both halves are required, so this cannot widen by accident", () => {
  it("a real refusal containing the word conflict is still excluded by the tool gate", () => {
    /*
     * THE LIVE PROOF THAT THE TOOL GATE DOES WORK RATHER THAN BEING ASSERTED TO.
     * This string is recorded once in `agent_approvals.error`. A path claimed by
     * another mission is NOT fixed by rebuilding, because the other mission
     * still holds it, so widening the phrase list without the tool gate would
     * send good work back to be rewritten over a concurrency clash.
     */
    expect(
      refusalIsAboutTheWork(
        "studio.commit",
        'BuilderFileConflict: path "health.json" is claimed by another Studio mission',
      ),
    ).toBe(false);
  });

  it("another tool's message mentioning conflict does not count", () => {
    // The tool gate is what keeps the word "conflict" from firing on an
    // unrelated refusal that happens to contain it.
    expect(refusalIsAboutTheWork("prd.draft", "this spec conflicts with an existing one")).toBe(
      false,
    );
    expect(refusalIsAboutTheWork("repo.read", "merge conflicts")).toBe(false);
  });

  it("the right tool with an unrelated message does not count", () => {
    expect(refusalIsAboutTheWork("studio.pr.merge", "GitHub merge 401: Bad credentials")).toBe(
      false,
    );
  });

  it("absent inputs never count, because unknown is not a conflict", () => {
    for (const [t, e] of [
      [null, "merge conflicts"],
      ["studio.pr.merge", null],
      ["studio.pr.merge", ""],
      [undefined, undefined],
    ] as const) {
      expect(refusalIsAboutTheWork(t, e)).toBe(false);
    }
  });
});

describe("the driver lets it through to the ordinary path", () => {
  it("a work-refusal is not filed as tools-refused", () => {
    expect(DRIVER).toContain(
      "refusalFound && refusalIsAboutTheWork(refusalFound.tool, refusalFound.error)",
    );
  });

  it("and tools-refused is still terminal for everything else", () => {
    // The fix must not weaken F-41. A locked door still stops the sweep.
    expect(TERMINAL_HOLDS).toContain("tools-refused");
  });
});

describe("the sentence tells a person they need not step in", () => {
  it("it says what happened and what happens next", () => {
    expect(conflictLine()).toContain("branch it was built on has moved on");
    expect(conflictLine()).toContain("rebuilt on what is there now");
  });

  it("it says plainly that this is not a dead end", () => {
    // A hold that says only "it conflicted" leaves a person deciding whether to
    // intervene, on the one surface built so they do not have to.
    expect(conflictLine()).toContain("not a dead end");
  });

  it("and it carries no machine punctuation", () => {
    expect(conflictLine()).not.toMatch(/[–—]/);
  });
});
