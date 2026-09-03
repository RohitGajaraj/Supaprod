/**
 * F-117: 117 OF 119 SPECS CARRIED NO SUCCESS METRIC.
 *
 * Measured on production 2026-08-27, and it is the plainest reason this
 * product's central claim has never once been demonstrated on a real track. A
 * spec with no measurable success metric can be defined, designed, built and
 * shipped, and then it can never be judged — so the verdict-against-a-forecast
 * that the whole product is for simply never happens.
 *
 * ── IT IS TWO SEPARATE HOLES IN ONE CHAIN ──────────────────────────────────
 *
 * 1 · NOTHING SAID TO WRITE A MEASURE. `prd.draft` really does extract success
 *     metrics, but its extraction prompt says *"Extract only what the text
 *     supports. Never invent a metric"*, and the text is the body it writes
 *     from `prd-writer`'s brief. That seat's `job` line has always said "how
 *     anyone would know it worked"; its `file` line — the one that says what to
 *     actually pass, and the one the seat acts on — did not. So a brief with no
 *     measure produced a spec with nothing to grade, correctly and silently.
 *
 * 2 · NOTHING COMPILED THE ORACLES. Every clause is written `oracle_kind: null`
 *     and `compileContractOraclesCore` is what fills it. It has fired since
 *     RPT-23 from `draftContractFromIntent` — the surface a PERSON drafts a
 *     contract through — and never from `generatePrd`, which is the path every
 *     agent-written spec comes down. Live: 2 specs with a standing metric, 1
 *     with all clauses classified.
 *
 * Either hole alone is enough to make `spec-gate.ts` gate 9 refuse everything,
 * and the second would have refused it for a reason about our own plumbing
 * rather than about the spec — the worst kind of gate.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { stationCrew, stationGoal } from "@/lib/spine/driver";

const DISCOVERY = readFileSync(
  fileURLToPath(new URL("../discovery.functions.ts", import.meta.url)),
  "utf8",
);
const TRACK = { title: "Homeowners abandon checkout on the address screen", origin: null };

describe("the seat that writes the spec is told to state the measure", () => {
  const writer = () => stationCrew("define").find((c) => c.slug === "prd-writer");

  it("prd-writer is still in Define's crew", () => {
    expect(writer(), "prd-writer left the crew").toBeDefined();
  });

  it("its DELIVERED brief demands something a person could go and check", () => {
    // Rendered, not read off CREW_ROLE. F-114's lesson.
    const brief = stationGoal("define", TRACK, [], writer()!);
    expect(brief).toMatch(/what would count as this having worked/i);
    expect(brief).toMatch(/a number, a rate, an event that either happens or does not/i);
    expect(brief).toMatch(/and by when/i);
  });

  it("and it is told WHY, because a bare requirement gets satisfied nominally", () => {
    const brief = stationGoal("define", TRACK, [], writer()!);
    expect(brief).toMatch(/nothing invents a measure you did not state/i);
    expect(brief).toMatch(/built and shipped and then never judged/i);
  });

  it("it still names the arguments prd.draft actually has", () => {
    // The defect this line was already carrying a scar from: a brief that
    // instructs an impossible call is worse than no brief, because the agent
    // obeys it. Adding a requirement must not lose that.
    const brief = stationGoal("define", TRACK, [], writer()!);
    expect(brief).toContain("`opportunity_id`");
    expect(brief).toContain("`brief`");
    expect(brief).toContain("do not compose one to pass in");
  });
});

describe("the loop's own specs get their oracles compiled", () => {
  it("generatePrd compiles them, as the human draft path already did", () => {
    // Whitespace-tolerant anchor: P-35 (A-QUEUE.md) gave the `.select()` on
    // this call a real column list instead of a bare select, which reflowed
    // `.from("prds")` and `.insert(prdRow)` onto separate lines. The anchor's
    // job is finding THIS insert (not the other one this file makes), not
    // pinning its exact formatting.
    const anchor = DISCOVERY.match(/\.from\(\s*"prds"\s*\)\s*\.insert\(prdRow\)/);
    expect(anchor, 'could not find .from("prds").insert(prdRow) at all').not.toBeNull();
    const insert = DISCOVERY.slice(anchor!.index!);
    expect(insert.slice(0, 2500)).toContain("compileContractOraclesCore");
  });

  it("both call sites guard against a concurrent edit", () => {
    expect(DISCOVERY.split("guardConcurrentEdit: true").length - 1).toBeGreaterThanOrEqual(2);
  });

  it("and the loop's failure is LOGGED, not swallowed like the human path's", () => {
    /*
     * The other site swallows deliberately: a person is looking at the contract
     * while it runs, so a failure is visible. Down here nobody is looking, and a
     * silent miscompile would present as a spec that simply did not deserve to
     * clear its review — a gate refusing for a reason about our plumbing.
     */
    expect(DISCOVERY).toContain("oracle compile failed for agent-drafted spec");
  });
});
