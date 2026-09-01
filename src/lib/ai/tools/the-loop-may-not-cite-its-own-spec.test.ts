/**
 * F-73 — the second face of the exhaust problem, and the harder one to see.
 *
 * `the-loop-must-not-eat-its-own-exhaust.test.ts` (next door) guards against a
 * station filing ABSENCE as evidence: "No signals found for X". That text reads
 * obviously empty, which is why a description line was enough to stop it.
 *
 * This is the same disease with better manners. On 2026-08-25 track `d1168015`
 * cleared Discover by filing three signals whose `source` columns read:
 *
 *     PRD b401ccd4-030a-47b9-adb9-507f153d2f71   ← ANOTHER TRACK'S SPEC
 *     Decision f9ac68cb
 *     workspace.brief
 *
 * A spec cited as a signal reads substantive. It becomes evidence for the next
 * decision, which becomes the next spec, which can be cited again — and the
 * forecast the whole product is built to grade ends up graded against the
 * loop's own output rather than against the world. So this one is a refusal at
 * the write, not advice in a description: filing nothing was always allowed,
 * and it is the honest answer when there is no outside evidence.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { namesOwnArtifact, ownArtifactRefusal } from "./own-artifact-source";

describe("the three sources that were actually filed", () => {
  it("refuses another track's PRD, id and all", () => {
    expect(namesOwnArtifact("PRD b401ccd4-030a-47b9-adb9-507f153d2f71")).toBe("prd");
  });

  it("refuses a decision named by its short id", () => {
    expect(namesOwnArtifact("Decision f9ac68cb")).toBe("decision");
  });

  it("refuses the workspace's own brief", () => {
    expect(namesOwnArtifact("workspace.brief")).toBe("workspace.brief");
  });
});

describe("the kinds, bare and pluralised", () => {
  for (const kind of ["prd", "PRD", "Spec", "changeset", "mission", "forecast", "learning"]) {
    it(`refuses "${kind}" standing alone`, () => {
      expect(namesOwnArtifact(kind)).not.toBeNull();
    });
  }

  it("refuses the plural, because the trick is the word not the count", () => {
    expect(namesOwnArtifact("decisions")).toBe("decision");
  });
});

describe("what must still get through, or the guard costs more than it saves", () => {
  /**
   * A source that merely CONTAINS one of these words is a real place evidence
   * comes from. Refusing "post-decision interview" would push a crew into
   * renaming honest evidence to get past a filter — the exact behaviour this
   * file exists to prevent, arriving through the front door.
   */
  for (const real of [
    "post-decision interview",
    "canny",
    "support ticket",
    "slack #product-feedback",
    "interview",
    "github issue 412",
    "user call",
    "roadmap survey respondent",
  ]) {
    it(`lets "${real}" through`, () => {
      expect(namesOwnArtifact(real)).toBeNull();
    });
  }

  it("says nothing about an absent source, which is the sink's business", () => {
    expect(namesOwnArtifact(undefined)).toBeNull();
    expect(namesOwnArtifact("")).toBeNull();
    expect(namesOwnArtifact("   ")).toBeNull();
  });
});

describe("the refusal tells the crew what to do instead", () => {
  const message = ownArtifactRefusal("PRD b401ccd4", "prd");

  it("names the source it refused, so the crew can see which call failed", () => {
    expect(message).toContain("PRD b401ccd4");
  });

  it("explains the compounding, not just the rule", () => {
    expect(message).toContain("becomes evidence for the next");
  });

  /**
   * The lesson the absence guard already paid for: forbid without redirecting
   * and the same act returns wearing a different title.
   */
  it("makes filing nothing explicitly allowed", () => {
    expect(message).toContain("correct, expected outcome");
  });
});

describe("the write path actually calls it", () => {
  const SRC = readFileSync(fileURLToPath(new URL("./registry.server.ts", import.meta.url)), "utf8");
  const at = SRC.indexOf('name: "signals.log"');
  const tool = SRC.slice(at, SRC.indexOf("const listSignals", at));

  it("refuses inside signals.log's run, not merely in its description", () => {
    expect(tool).toContain("namesOwnArtifact(a.source)");
    expect(tool).toContain("throw new Error(ownArtifactRefusal(");
  });

  it("guards BEFORE the sink is asked to write anything", () => {
    expect(tool.indexOf("namesOwnArtifact(a.source)")).toBeLessThan(tool.indexOf("writeSignals("));
  });

  it("tells the model the rule too, since a refusal it cannot anticipate is a wasted step", () => {
    const description = tool.slice(tool.indexOf("description:"), tool.indexOf("category:"));
    expect(description).toContain("NEVER cite this product's own work as a source");
  });
});

/**
 * THE ROW THAT CAME THROUGH THE LIST AFTER THIS GUARD SHIPPED (2026-09-02).
 *
 * Measured in production: `sources.status` was filed on 2026-08-31, six days
 * after the guard landed, and passed -- `sources` was not in
 * INTERNAL_NAMESPACES. Its content read "sources.status shows 0 active scout
 * targets and near-zero automated signals ... indicating signal ingestion
 * infrastructure failure rather than absence of user behavior": the loop
 * reading its own telemetry and filing it as evidence about customers. It went
 * on to produce the third-ranked cluster on Discover, "Signal Ingestion
 * Infrastructure Failure", so the product was about to rank and spec its own
 * plumbing as a customer problem.
 *
 * The second half of this file is the part that keeps the guard honest. A
 * namespace list only stays useful if it refuses the product's own exhaust
 * WITHOUT refusing a real source, and the cheapest way to break it is to widen
 * it until "design.review" stops being a document somebody can name.
 */
describe("the namespaces the loop uses for its own state", () => {
  it("refuses the telemetry namespace that a real row came through", () => {
    // The exact source string from production.
    expect(namesOwnArtifact("sources.status")).toBe("sources.status");
  });

  it("refuses the rest of the product's own record", () => {
    for (const s of [
      "signals.log",
      "themes.list",
      "brain.query",
      "memory.read",
      "learning.get",
      "roadmap.place",
      "backlog.pull",
      "approvals.open",
      "agent.run",
    ]) {
      expect(namesOwnArtifact(s)).toBe(s);
    }
  });

  /*
   * THE HALF THAT MATTERS MORE. These are real tool namespaces in this product
   * and they are deliberately absent from the list, because each either reads
   * the world or is a word a customer source could plausibly use. If a later
   * change adds them "for consistency", a genuine interview named
   * `design.review` starts being refused at the door and the evidence simply
   * never arrives -- with no error, because refusing is the designed outcome.
   */
  it("leaves alone the namespaces a real source could plausibly use", () => {
    for (const s of [
      "web.search",
      "repo.read",
      "github.issue",
      "research.note",
      "notes.weekly",
      "design.review",
      "tasks.export",
      "build.log",
      "ship.notes",
      "studio.session",
    ]) {
      expect(namesOwnArtifact(s)).toBeNull();
    }
  });

  it("still leaves a real source that merely contains one of the words", () => {
    // The rule at the top of the file: containing a word is not naming one.
    expect(namesOwnArtifact("post-decision interview")).toBeNull();
    expect(namesOwnArtifact("customer signals workshop")).toBeNull();
  });
});
