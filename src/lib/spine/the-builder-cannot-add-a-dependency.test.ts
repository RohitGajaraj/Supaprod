/**
 * F-56. AN AGENT WORKING IN SOMEBODY ELSE'S REPOSITORY CANNOT ADD A DEPENDENCY.
 *
 * MEASURED ON THE FIRST PULL REQUEST THIS PRODUCT EVER PRODUCED. Track
 * `48eee889`, PR #3 on `RohitGajaraj/relay-homeowner-app`, 2026-08-25. The
 * builder wrote **449 lines across 6 files, 316 of them tests**, and the tests
 * cite the spec's acceptance criteria by number — genuinely good work. CI failed
 * in **two seconds**, on both commits, and the release seat correctly refused to
 * ship on a red check.
 *
 * The whole cause is one import:
 *
 *   import { render, screen, fireEvent } from '@testing-library/react';
 *
 *   gh api repos/…/contents/node_modules --jq '.[].name'
 *   → .bin · @types · bun-types · csstype · react · typescript · undici-types
 *
 * **Neither testing-library package is in `node_modules` or in `package.json`.**
 * The workflow's lint step is literally `tsc --noEmit`, so it cannot resolve the
 * module, and `bun install` will not fetch a package the manifest does not name.
 *
 * WHY IT IS FATAL RATHER THAN UNTIDY. `studio.pr.merge` proves CI green in-tool,
 * fresh at the head sha, and refuses red. So **one unavailable import is the
 * difference between a mergeable pull request and a station that can never hand
 * on** — and `release.publish` then refuses too, because it takes only a merged
 * changeset.
 *
 * AND THE SELF-REPAIR LOOP CANNOT REACH IT. `ci-poll-tick`'s bounded fix
 * appender DID fire on this PR (commit `bca88e8f`) and spent its budget repairing
 * an unrelated pre-existing file, because a missing package is not something an
 * appended patch can fix. This class has to be prevented at the brief or not at
 * all.
 */
import { describe, expect, it } from "bun:test";

import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { stationCrew, stationGoal } from "./driver";

const builder = stationCrew("build").find((s) => s.slug === "builder");
const brief = `${builder?.job ?? ""} ${builder?.file ?? ""}`;

describe("the builder is told what it may not reach for", () => {
  it("exists at all", () => {
    expect(builder).toBeDefined();
    expect(brief.trim().length).toBeGreaterThan(50);
  });

  /**
   * THE MANIFEST BY NAME, not "check the dependencies". `specId`'s precedent in
   * the same file: an agent told to go and find something spends steps finding
   * it, and the Define station's budget burn is what that costs.
   */
  it("names the file to read rather than describing it", () => {
    expect(brief).toContain("package.json");
    expect(brief).toContain("deno.json");
  });

  it("says plainly that it cannot add one", () => {
    expect(brief).toMatch(/cannot add a dependency/i);
  });

  /**
   * A PROHIBITION WITH NO ALTERNATIVE GETS THE SAME BEHAVIOUR UNDER A NEW NAME.
   * That is F-24's lesson, learned when `signals.log` was told not to file
   * absence notes and needed to be told where the observation goes instead. Here
   * the alternative is: say the spec cannot be built with what is present.
   */
  it("gives it somewhere to go when the spec needs what is not there", () => {
    expect(brief).toMatch(/say that plainly|cannot be built/i);
  });

  /**
   * THE CONSEQUENCE, because a rule with none attached is the half agents drop
   * first — and this consequence is measured, not asserted: two seconds, twice.
   */
  it("says what it costs", () => {
    expect(brief).toMatch(/fails its checks|stops the work/i);
  });

  it("keeps the boundary sentence it already had", () => {
    expect(brief).toContain("Stop at anything your boundary does not let you do alone");
  });
});

describe("it lands on Build and nowhere else", () => {
  /**
   * Sense through Design write no code, and Ship works from a merged changeset.
   * A toolchain constraint read by a seat that writes prose is one more sentence
   * competing with the instruction that matters — which is what F-30 cost, when
   * the brief's first sentence disagreed with the spec and stopped a run dead.
   */
  it.each(AGENT_STATION_ORDER.filter((s) => s !== "build"))(
    "%s is not told about the manifest",
    (station) => {
      const goal = stationGoal(
        station as AgentStation,
        { title: "a piece of work", origin: null },
        [],
      );
      expect(goal).not.toContain("package.json");
    },
  );
});
