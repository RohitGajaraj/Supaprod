/**
 * The approval gate is enforced where the act happens, not only where it is drawn.
 *
 * WHY THIS FILE EXISTS. Two surfaces disagreed about whether approval gates a
 * build. `ReadyToBuild` filters the Build station to approved specs and says why
 * in its own words: "building an unapproved spec is the thing the approval gate
 * exists to prevent". The spec page's Approve tooltip asserts the same contract.
 * The dispatch checked only the DESIGN gate, so a draft could be sent to Build,
 * spend a billed builder run on work nobody had approved, and then be absent from
 * the station's own ready list.
 *
 * The spec page later added a client-side refusal, which closed the visible half
 * and left this one: the rule lived in one React component, so every other door
 * still accepted a draft. `/runs` dispatches, and so does an agent through the
 * same server function its own header calls "the agent door".
 *
 * So the second block below is a REACHABILITY test. The first proves the rule is
 * right; only the second proves it is reached, and the repo has been caught four
 * times by tests that did the first and not the second.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  specGateBlocksDispatch,
  SPEC_GATE_BLOCK_MESSAGE,
  BUILDABLE_SPEC_STATUSES,
} from "./spec-gate";

describe("what the approval gate lets through", () => {
  it("blocks a draft, which is the whole point", () => {
    expect(specGateBlocksDispatch({ status: "draft" })).toBe(true);
  });

  it("blocks an archived spec, a stronger no than a draft", () => {
    expect(specGateBlocksDispatch({ status: "archived" })).toBe(true);
  });

  it("lets an approved spec through", () => {
    expect(specGateBlocksDispatch({ status: "approved" })).toBe(false);
  });

  it("lets a shipped spec through, because a second lap is ordinary", () => {
    // A fix, a follow-up, a reverted release. Refusing this would make the gate
    // block the ordinary second build rather than the unapproved first one.
    expect(specGateBlocksDispatch({ status: "shipped" })).toBe(false);
  });

  it("does not block on a status it could not read", () => {
    // A failed read must never masquerade as a governance decision. Failing
    // closed here would refuse every build in the product the moment one column
    // read failed, and the irreversible acts downstream (opening a pull request,
    // merging, publishing) carry their own boundaries and trust none of this.
    expect(specGateBlocksDispatch({ status: null })).toBe(false);
    expect(specGateBlocksDispatch({ status: undefined })).toBe(false);
    expect(specGateBlocksDispatch({})).toBe(false);
    expect(specGateBlocksDispatch({ status: "" })).toBe(false);
  });

  it("blocks any status nobody has thought about yet", () => {
    // The allow-list is closed on purpose. A status added later is refused until
    // somebody decides it is buildable, which is the safe direction for a new
    // word arriving from a migration nobody has read yet.
    expect(specGateBlocksDispatch({ status: "in_review" })).toBe(true);
    expect(specGateBlocksDispatch({ status: "superseded" })).toBe(true);
  });

  it("says the act, the remedy and the cost, in that order", () => {
    expect(SPEC_GATE_BLOCK_MESSAGE).toContain("Approve the spec first");
    expect(SPEC_GATE_BLOCK_MESSAGE.toLowerCase()).toContain("costs money");
    // No em or en dash: this string is rendered to a person.
    expect(SPEC_GATE_BLOCK_MESSAGE).not.toMatch(/[\u2013\u2014]/);
  });

  it("keeps the buildable set to exactly the two that mean somebody said yes", () => {
    expect([...BUILDABLE_SPEC_STATUSES].sort()).toEqual(["approved", "shipped"]);
  });
});

describe("both dispatch paths enforce it, and the client is not the only guard", () => {
  const LIB = join(import.meta.dir, "..");
  /*
   * ONE PATH NOW, NOT TWO (P-29, A-QUEUE.md, 2026-09-03). `studio.functions.ts`'s
   * `dispatchStudioSession` -- the "agent door" this describe block's own
   * header names -- is deleted: it lost its last three callers to R-35 (no
   * door outside the track path may create a mission) and the P-14 ruling
   * that plan.spec.$id.tsx's own "Send to Build" goes, because the run does
   * both. A file that no longer dispatches anything cannot be asked whether
   * its dispatch enforces the gate; `build.functions.ts` (`runBuilder`)
   * remains the one real server-side dispatch path this repo has, and it is
   * still checked below. If a third dispatch path is ever added, add it here
   * and make sure it enforces the gate -- do not shrink this list to dodge a
   * real failure.
   */
  const PATHS = ["build.functions.ts"];

  for (const file of PATHS) {
    it(`${file} refuses an unapproved spec at the server`, () => {
      const code = readFileSync(join(LIB, file), "utf8");
      expect(code).toContain("specGateBlocksDispatch");
      expect(code).toContain("SPEC_GATE_BLOCK_MESSAGE");
    });

    it(`${file} selects the column the rule reads`, () => {
      // The subtle way this breaks: the guard is called, the column is absent
      // from the select, `status` arrives undefined, and the gate fails open on
      // every spec forever while looking perfectly enforced. `tsc` cannot see a
      // missing column inside a select string, which this repo has paid for.
      const code = readFileSync(join(LIB, file), "utf8");
      const selects = code.match(/\.select\("id,title,body_md[^"]*"\)/g) ?? [];
      expect(selects.length).toBeGreaterThan(0);
      for (const s of selects) expect(s).toContain("status");
    });

    it(`${file} checks the spec gate beside the design gate, not instead of it`, () => {
      // They answer different questions and both are real. A refactor that
      // replaced one with the other would pass every test above.
      const code = readFileSync(join(LIB, file), "utf8");
      expect(code).toContain("designGateBlocksDispatch");
    });
  }

  it("is not the ONLY place the rule exists, and is no longer even a hand-typed copy", () => {
    // The spec page keeps its own client-side warning, which is right: it is
    // the friendly, early path, read well before a person ever reaches
    // whichever surface actually dispatches. What it must not be is the ONLY
    // place the rule exists.
    //
    // P-29 (A-QUEUE.md, 2026-09-03): Send to Build is removed from this page
    // (the run dispatches now), and its own client-side check used to
    // hand-type this string rather than import it -- exactly the kind of
    // copy this describe block's own header warns "must not tell two
    // stories" and could have drifted from the server's own words without
    // either test noticing. Fixed alongside the removal: the page now
    // imports `SPEC_GATE_BLOCK_MESSAGE` and `specGateBlocksDispatch`
    // directly, so there is no second string left to drift.
    const page = readFileSync(
      join(LIB, "..", "routes", "_authenticated.plan.spec.$id.tsx"),
      "utf8",
    );
    expect(page).toContain(
      'import { specGateBlocksDispatch, SPEC_GATE_BLOCK_MESSAGE } from "@/lib/build/spec-gate"',
    );
    expect(page).toContain("specGateBlocksDispatch({ status: prdQ.data?.prd?.status })");
  });
});
