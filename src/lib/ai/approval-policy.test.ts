/**
 * THE INVARIANT IS THE TEST, and the branch coverage is the supporting cast.
 *
 * A policy engine is not correct because each of its `if` statements returns what
 * somebody expected. It is correct because a property holds over every input,
 * and here the property is the whole design: **a track record may only make the
 * answer stricter.** That is "demotion is automatic, promotion is not" expressed
 * as something a machine can check, and it is checked below over generated
 * records rather than only on the paths somebody thought to write.
 *
 * THE PURITY ASSERTION IS NOT DECORATION EITHER. This module's value is that it
 * can be reasoned about without a database, and the way that stops being true is
 * one convenient import six months from now. So the source is read and its import
 * list is checked, which is the only way to fail a build on it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  APPROVAL_DEMOTE_N,
  isNeverLaxerThanDefault,
  resolveApprovalPolicy,
  type ApprovalDecision,
  type ApprovalTrackRecord,
} from "./approval-policy";
import { HIGH_RISK_FORCE_REVIEW } from "./trust-ramp";

/** One tool per cell of the two-axis table, read off the real catalogue. */
const INTERNAL_REVERSIBLE = "studio.review";
const INTERNAL_PARTIAL = "mission.dispatch";
const INTERNAL_IRREVERSIBLE = "agent.spawn";
const EXTERNAL_REVERSIBLE = "github.issue.create";
const EXTERNAL_PARTIAL = "studio.commit";
const EXTERNAL_IRREVERSIBLE = "delegate.openhands";
const FORCE_REVIEW = "release.publish";
/*
 * A NAME IN NO CATALOGUE. It was `repo.read` when this file was written, and K-11
 * catalogued all seventeen read-only tools the next hour, which broke two
 * assertions here. That is the right kind of break: the fix moved the tool out of
 * the uncatalogued case, so the example moved with it. The payoff is asserted
 * below in "a catalogued read asks nothing".
 */
const UNCATALOGUED = "quarry.excavate";

function record(
  over: Partial<ApprovalTrackRecord> = {},
): ApprovalTrackRecord {
  return { approved: 0, rejected: 0, consecutiveRejections: 0, ...over };
}

function decide(tool: string, over?: Partial<ApprovalTrackRecord>): ApprovalDecision {
  return resolveApprovalPolicy(over ? { tool, record: record(over) } : { tool }).decision;
}

describe("the axis default, before anybody has ruled on anything", () => {
  it("asks nothing for an internal reversible tool", () => {
    expect(decide(INTERNAL_REVERSIBLE)).toBe("never-ask");
  });

  it("makes an internal partly-reversible tool earn it", () => {
    expect(decide(INTERNAL_PARTIAL)).toBe("earn-it");
  });

  it("makes an external reversible tool earn it", () => {
    // The two axes are independent: opening an issue can be undone and still
    // reaches a system outside the workspace, which is the wider blast radius.
    expect(decide(EXTERNAL_REVERSIBLE)).toBe("earn-it");
  });

  it("holds an external partly-reversible tool at a person, every time", () => {
    expect(decide(EXTERNAL_PARTIAL)).toBe("always-human");
  });

  it("holds every irreversible tool at a person, inside the workspace or out", () => {
    /*
     * THE ONE CELL OF THE SPECIFIED MATRIX THAT IS OVERRIDDEN, and this is the
     * tool it actually affects. `agent.spawn` is internal and irreversible: it
     * starts several sub-agents at once, each already spending a split of the
     * budget. The matrix said `earn-it`; governance names "anything irreversible
     * from inside the product" as a floor no boundary may lower, so an
     * irreversible act may not sit on a rung a record can move.
     */
    expect(decide(INTERNAL_IRREVERSIBLE)).toBe("always-human");
    expect(decide(EXTERNAL_IRREVERSIBLE)).toBe("always-human");
  });

  it("gives an empty record exactly the axis default, and not something else", () => {
    // Stated separately because "no record" and "a record of zeroes" are two
    // different call shapes and a reader should not have to guess they agree.
    expect(decide(INTERNAL_REVERSIBLE)).toBe(decide(INTERNAL_REVERSIBLE, {}));
    expect(decide(EXTERNAL_REVERSIBLE)).toBe(decide(EXTERNAL_REVERSIBLE, {}));
  });
});

describe("the never-graduates set is read, not restated", () => {
  it("holds every member at a person", () => {
    for (const tool of HIGH_RISK_FORCE_REVIEW) {
      expect(decide(tool), `${tool} can be automated`).toBe("always-human");
    }
  });

  it("has members to check, so a broken import cannot pass this file", () => {
    expect(HIGH_RISK_FORCE_REVIEW.size).toBeGreaterThan(3);
  });

  it("keeps them there on a spotless record", () => {
    /*
     * Rule 1, and the reason it is stated as absolute: a perfect record is
     * exactly the argument somebody will make for removing the gate, and a
     * production deploy being fine two hundred times is not evidence that the
     * two hundred and first needs no person.
     */
    expect(decide(FORCE_REVIEW, { approved: 500, rejected: 0 })).toBe("always-human");
  });
});

describe("an uncatalogued tool fails closed, and says why in words", () => {
  it("treats an unknown blast radius as the largest one", () => {
    expect(decide(UNCATALOGUED)).toBe("always-human");
  });

  it("blames the missing record rather than inventing a consequence", () => {
    /*
     * This currently OVER-gates, and the reason has to say so. 17 registry tools
     * have no catalogue entry and most are plainly read-only, so they land here
     * for the same wrong reason they score high risk in `toolRisk`. A reason that
     * invented a consequence would hide a missing table row; this one points at
     * it.
     */
    const { reason } = resolveApprovalPolicy({ tool: UNCATALOGUED });
    expect(reason).toContain("Nothing is written down");
    expect(reason).not.toContain("cannot be undone");
  });

  it("handles a name that is not a tool at all without throwing", () => {
    expect(decide("")).toBe("always-human");
    expect(decide("not.a.real.tool")).toBe("always-human");
  });

  it("asks nothing for a read, now that reads are catalogued", () => {
    /*
     * THE PAYOFF OF K-11, ASSERTED FROM THIS SIDE. Before those seventeen rows
     * existed, every one of these resolved `always-human` here for the same reason
     * they scored `high` in `toolRisk`: an unknown blast radius is treated as the
     * largest one. They are internal and reversible, so they are now the axis
     * default, which is to not ask at all.
     */
    for (const tool of [
      "repo.read",
      "repo.tree",
      "workspace.search",
      "signals.list",
      "themes.list",
      "mission.observe",
      "sources.connect",
    ]) {
      expect(decide(tool), tool).toBe("never-ask");
    }
  });

  it("still makes a metered read earn it, because the spend is the consequence", () => {
    // `web.*` are `partial` beside `web.crawl`, for its own stated reason: they
    // change nothing and the credits they spend are not refundable.
    for (const tool of ["web.search", "web.fetch", "web.map"]) {
      expect(decide(tool), tool).toBe("earn-it");
    }
  });
});

describe("all refusals switches it off rather than asking again", () => {
  it("disables a tool nobody has ever let run", () => {
    expect(decide(INTERNAL_PARTIAL, { rejected: APPROVAL_DEMOTE_N })).toBe("disabled");
  });

  it("needs a pattern rather than an afternoon", () => {
    /*
     * Without a sample floor, one early refusal on a consequential tool switches
     * it off on the evidence of a single decision.
     */
    expect(decide(INTERNAL_PARTIAL, { rejected: 1 })).not.toBe("disabled");
    expect(decide(INTERNAL_PARTIAL, { rejected: APPROVAL_DEMOTE_N - 1 })).not.toBe("disabled");
  });

  it("stops applying the moment anything was approved", () => {
    expect(decide(INTERNAL_PARTIAL, { approved: 1, rejected: 40 })).not.toBe("disabled");
  });

  it("applies to an always-human tool too, and that is not a graduation", () => {
    /*
     * Switching a tool off is the STRICTEST answer available, so it does not
     * conflict with "always-human never graduates": graduating means getting
     * laxer. A gate a person has refused every single time is a question whose
     * answer is already known.
     */
    expect(decide(FORCE_REVIEW, { rejected: 4 })).toBe("disabled");
  });

  it("says how many, because the count is the argument", () => {
    const { reason } = resolveApprovalPolicy({
      tool: INTERNAL_PARTIAL,
      record: record({ rejected: 7 }),
    });
    expect(reason).toContain("7");
  });
});

describe("demotion is automatic and drops exactly one rung", () => {
  it("stops asking nothing after a run of refusals", () => {
    expect(decide(INTERNAL_REVERSIBLE, { approved: 9, consecutiveRejections: APPROVAL_DEMOTE_N })).toBe(
      "earn-it",
    );
  });

  it("takes an earning tool up to a person after a run of refusals", () => {
    expect(decide(INTERNAL_PARTIAL, { approved: 9, consecutiveRejections: APPROVAL_DEMOTE_N })).toBe(
      "always-human",
    );
  });

  it("does not drop on one fewer", () => {
    expect(
      decide(INTERNAL_REVERSIBLE, { approved: 9, consecutiveRejections: APPROVAL_DEMOTE_N - 1 }),
    ).toBe("never-ask");
  });

  it("never drops two rungs at once, however long the run", () => {
    // A single refusal streak is one fact. Reading it as two demotions would let
    // one bad afternoon take a tool from unattended to switched off.
    expect(decide(INTERNAL_REVERSIBLE, { approved: 9, consecutiveRejections: 40 })).toBe("earn-it");
  });

  it("is faster than promotion, which is the whole asymmetry", () => {
    // `TRUST_RAMP_CLEAN_N` is 5. If demotion needed as many or more, a tool could
    // be promoted faster than it could ever be demoted.
    expect(APPROVAL_DEMOTE_N).toBeLessThan(5);
    expect(APPROVAL_DEMOTE_N).toBeGreaterThan(1);
  });
});

describe("the invariant: a record may only ever tighten the answer", () => {
  const TOOLS = [
    INTERNAL_REVERSIBLE,
    INTERNAL_PARTIAL,
    INTERNAL_IRREVERSIBLE,
    EXTERNAL_REVERSIBLE,
    EXTERNAL_PARTIAL,
    EXTERNAL_IRREVERSIBLE,
    FORCE_REVIEW,
    UNCATALOGUED,
  ];

  it("holds over every combination of a generated record", () => {
    /*
     * 8 tools x 6 approved x 6 rejected x 6 streaks. Not a fuzz test in the
     * statistical sense; an exhaustive sweep of a small space, which is stronger
     * for a pure function of three small integers.
     */
    const offences: string[] = [];
    for (const tool of TOOLS) {
      for (const approved of [0, 1, 2, 5, 20, 500]) {
        for (const rejected of [0, 1, 2, 3, 9, 500]) {
          for (const consecutiveRejections of [0, 1, 2, 3, 9, 500]) {
            const input = { tool, record: { approved, rejected, consecutiveRejections } };
            if (!isNeverLaxerThanDefault(input)) {
              offences.push(
                `${tool} a${approved} r${rejected} c${consecutiveRejections} -> ${resolveApprovalPolicy(input).decision}`,
              );
            }
          }
        }
      }
    }

    expect(
      offences.slice(0, 10),
      "a track record made a gate LOOSER, which is automatic promotion and no shipped product does it",
    ).toEqual([]);
  });

  it("checks a space big enough to be worth checking", () => {
    // Without this the sweep above could pass by iterating nothing.
    expect(TOOLS.length * 6 * 6 * 6).toBeGreaterThan(1000);
  });
});

describe("every reason is a sentence a person could read", () => {
  const CASES: ApprovalPolicyCase[] = [
    { tool: INTERNAL_REVERSIBLE },
    { tool: INTERNAL_PARTIAL },
    { tool: EXTERNAL_REVERSIBLE },
    { tool: EXTERNAL_PARTIAL },
    { tool: INTERNAL_IRREVERSIBLE },
    { tool: FORCE_REVIEW },
    { tool: UNCATALOGUED },
    { tool: INTERNAL_PARTIAL, record: record({ rejected: 5 }) },
    { tool: INTERNAL_REVERSIBLE, record: record({ approved: 9, consecutiveRejections: 3 }) },
    { tool: INTERNAL_PARTIAL, record: record({ approved: 9, consecutiveRejections: 3 }) },
  ];

  type ApprovalPolicyCase = { tool: string; record?: ApprovalTrackRecord };

  it("reads as English, not as a status code", () => {
    for (const input of CASES) {
      const { reason } = resolveApprovalPolicy(input);
      expect(reason.length, `${input.tool} has no reason`).toBeGreaterThan(30);
      expect(reason.endsWith("."), `${input.tool}: "${reason}"`).toBe(true);
      expect(reason[0], `${input.tool} starts lowercase`).toBe(reason[0].toUpperCase());
    }
  });

  it("names no mechanism a reader has no way to know", () => {
    /*
     * Engine-Room doctrine: a label names the outcome, never the machine. A
     * reason mentioning a tool id, a table or a mode name would be the engine
     * leaking into the experience.
     */
    for (const input of CASES) {
      const { reason } = resolveApprovalPolicy(input);
      for (const leak of [
        "CONSEQUENCES",
        "toolRisk",
        "agent_approvals",
        "always-human",
        "earn-it",
        "never-ask",
        "irreversible",
        input.tool,
      ]) {
        expect(reason, `"${reason}" leaks ${leak}`).not.toContain(leak);
      }
    }
  });

  it("carries no em dash or en dash, because a person reads it", () => {
    for (const input of CASES) {
      const { reason } = resolveApprovalPolicy(input);
      expect(reason).not.toContain("\u2014");
      expect(reason).not.toContain("\u2013");
    }
  });

  it("gives a different reason to each decision, rather than one hedge for all", () => {
    const reasons = new Set(CASES.map((input) => resolveApprovalPolicy(input).reason));
    expect(reasons.size).toBeGreaterThan(6);
  });
});

describe("it is pure, and stays pure", () => {
  const source = readFileSync(new URL("./approval-policy.ts", import.meta.url), "utf8");

  it("imports nothing that touches a database, a network or a server", () => {
    /*
     * THE ASSERTION THAT KEEPS THIS MODULE WORTH HAVING. Its value is that a
     * policy can be reasoned about and tested without production, and the way
     * that stops being true is one convenient import later. `tsc` cannot see the
     * difference; this can.
     */
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const from of imports) {
      expect(from, `${from} is a server module`).not.toContain(".server");
      expect(from, `${from} is a Supabase client`).not.toContain("supabase");
      expect(from, `${from} reaches the AI runtime`).not.toContain("runtime");
      expect(from).not.toContain("functions");
    }
  });

  it("calls nothing that reads the outside world", () => {
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const banned of ["fetch(", "await ", "Date.now(", "Math.random(", "process.env"]) {
      expect(code, `it calls ${banned}`).not.toContain(banned);
    }
  });

  it("returns the same answer for the same input, every time", () => {
    const input = { tool: INTERNAL_PARTIAL, record: record({ approved: 3, rejected: 2 }) };
    const first = resolveApprovalPolicy(input);
    for (let i = 0; i < 50; i++) expect(resolveApprovalPolicy(input)).toEqual(first);
  });

  it("does not mutate what it was handed", () => {
    const given = record({ approved: 3, rejected: 4, consecutiveRejections: 2 });
    const copy = { ...given };
    resolveApprovalPolicy({ tool: INTERNAL_PARTIAL, record: given });
    expect(given).toEqual(copy);
  });
});
