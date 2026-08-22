import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { parseSseLine } from "@/lib/ask-sse";
import {
  asPlanAutonomy,
  asWorkShape,
  describePlanEdits,
  parsePlanProposal,
  planProposalLine,
  PLAN_AUTONOMY,
  type PlanProposal,
} from "@/lib/ask/plan-proposal";
import { routeIntent } from "@/lib/ask/route-intent";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import { WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";

/**
 * THE PLAN GATE'S WIRE, WALKED THROUGH THE REAL PARSER.
 *
 * ── WHY THE ROUND TRIP IS THE CENTRAL TEST HERE ─────────────────────────
 *
 * This protocol has already shipped a frame nobody could read. The first
 * `landing` emitter in `api/chat.ts` wrote the parser's RETURN type
 * (`{kind:"landing", artifact:{…}}`) instead of its INPUT (`{landing:{…}}`), and
 * `parseSseLine` read it as `ignored` and dropped it in silence. No type could
 * catch it: both ends were internally consistent and only disagreed about the
 * wire. A dropped frame is survivable for a `landing` — the reader loses a link.
 * For a GATE it is not: the person is told a plan is waiting and shown nothing,
 * with the run held behind a card that never renders.
 *
 * So every assertion below that touches the wire goes through
 * `planProposalLine` -> `parseSseLine`, the same two functions the server and
 * the pane actually call, and the line is split the way `use-ask-stream` splits
 * it rather than passed in whole.
 */

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

const A_PROPOSAL: PlanProposal = {
  id: "6f1c2f7e-0d2a-4a1f-9a1b-2c3d4e5f6a7b",
  shape: "existing-feature",
  station: "define",
  origin: "the onboarding drop-off after email verify is getting worse",
  title: "Verify-step drop-off",
  goal: "Find out why the onboarding drop-off after email verify is getting worse and fix it",
  spendCapUsd: 5,
};

/** Exactly what the pane's reader does to one chunk before parsing it. */
function framesFrom(wire: string) {
  return wire
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line))
    .map(parseSseLine)
    .filter((e) => e && e.kind !== "ignored");
}

describe("the proposal frame survives the real parser", () => {
  it("comes back off the wire as a plan-proposal, not as ignored", () => {
    const events = framesFrom(planProposalLine(A_PROPOSAL));
    expect(events).toHaveLength(1);
    expect(events[0]!.kind).toBe("plan-proposal");
  });

  it("carries every field back unchanged, for every shape the spine has", () => {
    for (const shape of SHAPES) {
      const sent: PlanProposal = { ...A_PROPOSAL, shape };
      const events = framesFrom(planProposalLine(sent));
      const event = events[0];
      expect(event?.kind).toBe("plan-proposal");
      if (event?.kind !== "plan-proposal") throw new Error("not a proposal");
      expect(event.proposal).toEqual(sent);
    }
  });

  it("survives a station the classifier never named", () => {
    const events = framesFrom(planProposalLine({ ...A_PROPOSAL, station: null }));
    const event = events[0];
    expect(event?.kind).toBe("plan-proposal");
    if (event?.kind !== "plan-proposal") throw new Error("not a proposal");
    expect(event.proposal.station).toBeNull();
  });

  it("survives a workspace that has cleared its ceiling", () => {
    // `null` is a real state, not an absence: the run has no cap and the gate
    // has to be able to say so. Rounding it to a number here would put a
    // ceiling on the card that nothing enforces.
    const events = framesFrom(planProposalLine({ ...A_PROPOSAL, spendCapUsd: null }));
    const event = events[0];
    if (event?.kind !== "plan-proposal") throw new Error("not a proposal");
    expect(event.proposal.spendCapUsd).toBeNull();
  });

  it("is not read as any other frame in the protocol", () => {
    // The guard against the near-miss `dispatch_blocked` was named for: two keys
    // that could plausibly be read as each other's payload.
    const event = framesFrom(planProposalLine(A_PROPOSAL))[0];
    expect(event?.kind).not.toBe("delta");
    expect(event?.kind).not.toBe("block");
    expect(event?.kind).not.toBe("dispatch-blocked");
    expect(event?.kind).not.toBe("landing");
  });

  it("does not disturb the frames that were already on this wire", () => {
    for (const line of [
      `data: ${JSON.stringify({ landing: { kind: "mission", id: "m1", station: "build" } })}`,
      `data: ${JSON.stringify({ station: "build" })}`,
      `data: ${JSON.stringify({ tool: "web.search" })}`,
      `data: ${JSON.stringify({ dispatch_blocked: { reason: "no-workspace" } })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "hello" } }] })}`,
      "data: [DONE]",
    ]) {
      expect(parseSseLine(line)?.kind).not.toBe("plan-proposal");
    }
  });
});

describe("a proposal this build cannot name is dropped, never guessed at", () => {
  it("refuses a shape the spine does not have", () => {
    const wire = `data: ${JSON.stringify({
      plan_proposal: { ...A_PROPOSAL, shape: "bugfix", spend_cap_usd: 5 },
    })}`;
    expect(parseSseLine(wire)?.kind).toBe("ignored");
  });

  it("refuses a station that is present and is not one of the seven", () => {
    // Absent is allowed (the classifier may not know). Present-and-unknown means
    // the two ends disagree about the seven, and the plan drawn from it would
    // not be the plan the server recomputes on confirmation.
    const wire = `data: ${JSON.stringify({
      plan_proposal: { ...A_PROPOSAL, station: "triage", spend_cap_usd: 5 },
    })}`;
    expect(parseSseLine(wire)?.kind).toBe("ignored");
  });

  it("refuses a ceiling that does not parse rather than reading it as no ceiling", () => {
    // The one reading of an unreadable number a person must never be shown is
    // "this may spend without limit".
    for (const cap of ["lots", -1, {}]) {
      const wire = `data: ${JSON.stringify({
        plan_proposal: { ...A_PROPOSAL, spend_cap_usd: cap },
      })}`;
      expect(parseSseLine(wire)?.kind).toBe("ignored");
    }
  });

  it("catches a non-finite ceiling at the builder, because JSON cannot carry one", () => {
    /*
     * THIS IS WHY THE GUARD IS ON THE PRODUCING SIDE AND NOT ONLY IN THE PARSER,
     * and it was found by writing this test rather than by reading the code.
     * `JSON.stringify(NaN)` is `null`, and `null` in this field means "this
     * workspace has no ceiling" — so a broken number crosses the wire as
     * permission to spend without limit, and arrives as a well-formed null the
     * parser has no grounds to refuse. It has to be caught while it is still a
     * number, and it falls to a ceiling of zero, which draws as already reached.
     */
    const broken = { ...A_PROPOSAL, spendCapUsd: Number.NaN };
    const event = framesFrom(planProposalLine(broken))[0];
    if (event?.kind !== "plan-proposal") throw new Error("not a proposal");
    expect(event.proposal.spendCapUsd).toBe(0);
    expect(event.proposal.spendCapUsd).not.toBeNull();
  });

  it("refuses a proposal with no title, goal, origin or id", () => {
    for (const missing of ["id", "title", "goal", "origin"]) {
      const raw: Record<string, unknown> = { ...A_PROPOSAL, spend_cap_usd: 5 };
      delete raw[missing];
      expect(parsePlanProposal(raw)).toBeNull();
    }
  });

  it("refuses anything that is not an object", () => {
    for (const junk of [null, undefined, "plan", 7, []]) {
      expect(parsePlanProposal(junk)).toBeNull();
    }
  });
});

describe("the route is regenerated, never received", () => {
  it("gives the same route on both sides of the wire, for every shape", () => {
    /*
     * THE WHOLE REASON THE FRAME CARRIES INPUTS INSTEAD OF A PLAN. The client
     * draws the gate from its own `routeIntent` call and the confirmation route
     * recomputes the same call from the same three values, so the plan a person
     * answered about and the plan that is recorded cannot be two different
     * things. If `routeIntent` ever stops being pure, this is what fails.
     */
    for (const shape of SHAPES) {
      const onServer = routeIntent({
        shape,
        origin: A_PROPOSAL.origin,
        station: A_PROPOSAL.station,
      });
      const event = framesFrom(planProposalLine({ ...A_PROPOSAL, shape }))[0];
      if (event?.kind !== "plan-proposal") throw new Error("not a proposal");
      const onClient = routeIntent({
        shape: event.proposal.shape,
        origin: event.proposal.origin,
        station: event.proposal.station,
      });
      expect(onClient).toEqual(onServer);
    }
  });

  it("puts the entry station and every stop inside the seven", () => {
    for (const shape of SHAPES) {
      const routed = routeIntent({ shape, origin: A_PROPOSAL.origin, station: null });
      expect(AGENT_STATION_ORDER).toContain(routed.station);
      for (const stop of routed.route.path) expect(AGENT_STATION_ORDER).toContain(stop);
    }
  });
});

describe("the answer is one of three and the server checks it", () => {
  it("has exactly the three the gate offers", () => {
    expect([...PLAN_AUTONOMY]).toEqual(["run-it", "check-writes", "keep-planning"]);
  });

  it("refuses a fourth", () => {
    for (const junk of ["yes", "approve", "", null, 1, "RUN-IT"]) {
      expect(asPlanAutonomy(junk)).toBeNull();
    }
  });

  it("does not accept a prototype key as a work shape", () => {
    // `in` walks the prototype chain, and the first version of this check let
    // "constructor" through into `suggestRoute`, which threw on it.
    for (const junk of ["constructor", "toString", "hasOwnProperty"]) {
      expect(asWorkShape(junk)).toBeNull();
    }
    for (const shape of SHAPES) expect(asWorkShape(shape)).toBe(shape);
  });
});

describe("what a person changed reaches the record", () => {
  it("says nothing at all when the plan was accepted as filed", () => {
    expect(describePlanEdits({})).toBe("");
    expect(describePlanEdits({ skipped: [], waived: [] })).toBe("");
  });

  it("keeps the reason beside the thing it explains", () => {
    const said = describePlanEdits({
      skipped: [{ id: "critic", why: "already red-teamed this last week" }],
      waived: [{ station: "design", reason: "no surface changes" }],
    });
    expect(said).toContain("critic");
    expect(said).toContain("already red-teamed this last week");
    expect(said).toContain("design");
    expect(said).toContain("no surface changes");
  });

  it("survives an edit with no reason rather than dropping the edit", () => {
    // A skip without a reason is a weaker record than one with, and it is still
    // a fact about what the person changed. Dropping it would lose the change.
    expect(describePlanEdits({ skipped: [{ id: "qa" }] })).toBe("skipped qa");
  });
});

/**
 * THE WIRING, WHICH IS A LEXICAL FACT IN A ROUTE MODULE.
 *
 * `src/routes/api/chat.ts` and `src/routes/api/plan-gate.ts` cannot be imported
 * by a test in this repo: they pull `runtime.server`, the service-role client
 * and the whole orchestration graph behind them. `chat-dispatch.test.ts` makes
 * this argument at length and checks its own wiring the same way. What is
 * asserted here is only what a source read can genuinely see — that the gate is
 * between the route and the mission row, and that the belief is written.
 */
const CHAT = readFileSync("src/routes/api/chat.ts", "utf8");
const GATE = readFileSync("src/routes/api/plan-gate.ts", "utf8");

describe("the gate is between the route and the mission row", () => {
  it("computes the route BEFORE createMission rather than after it", () => {
    const routeAt = CHAT.indexOf("const routed =");
    const missionAt = CHAT.indexOf("await createMission(");
    expect(routeAt).toBeGreaterThan(-1);
    expect(missionAt).toBeGreaterThan(-1);
    expect(routeAt).toBeLessThan(missionAt);
  });

  it("no longer throws the route away", () => {
    expect(CHAT).not.toContain("void routed;");
  });

  it("returns from the gated branch before anything is created or dispatched", () => {
    const gateAt = CHAT.indexOf("return new Response(gateStream");
    const missionAt = CHAT.indexOf("await createMission(");
    expect(gateAt).toBeGreaterThan(-1);
    expect(gateAt).toBeLessThan(missionAt);
  });

  it("does not gate a mention, because a mention has no route to show", () => {
    expect(CHAT.replace(/\s+/g, " ")).toContain("classifiedShape && !mentionedAgent");
  });

  it("builds the frame through the one builder rather than a template", () => {
    // The `landing` frame shipped wrong because it was hand-written at the call
    // site. One builder, one shape, and the round trip above proves the shape.
    expect(CHAT).toContain("planProposalLine(proposal)");
  });

  it("reads the real ceiling instead of naming a number", () => {
    expect(CHAT).toContain("resolveMissionSpendCap(supabase, workspaceId, undefined)");
  });
});

describe("the answer outlives the stream, and is recorded", () => {
  it("is a route of its own", () => {
    expect(GATE).toContain('createFileRoute("/api/plan-gate")');
  });

  it("writes the belief into the table that exists for it", () => {
    expect(GATE).toContain('from("human_gate_events")');
    expect(GATE).toContain("verdict: autonomy");
    expect(GATE).toContain('subject_type: "plan"');
    expect(GATE).toContain("subject_ref: proposal.id");
  });

  it("recomputes the route rather than accepting a plan from the client", () => {
    const routeAt = GATE.indexOf("const routed = routeIntent({");
    const missionAt = GATE.indexOf("await createMission(");
    expect(routeAt).toBeGreaterThan(-1);
    expect(routeAt).toBeLessThan(missionAt);
  });

  it("refuses a second answer to one plan", () => {
    expect(GATE).toContain('.eq("subject_ref", proposal.id)');
    expect(GATE).toContain("already");
  });

  it("keeps the dispatch alive past the response, like every other dispatcher here", () => {
    expect(GATE).toContain("keepAliveAfterResponse(");
    expect(GATE).toContain("waitUntil");
  });
});
