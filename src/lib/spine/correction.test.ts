/**
 * The correction loop's rules, tested without a database.
 *
 * These tests are the safety of an autonomous loop that MOVES WORK BACKWARDS
 * with nobody watching, which is a strictly more dangerous thing than the driver
 * refusing to move it forward. Three invariants matter more than the rest and
 * each has its own block: a correction never routes work forwards, it never
 * fires while cheap retries remain, and it always stops at the correction cap.
 * A loop that can bounce a track between two stations forever is worse than a
 * frozen track, because it bills for the privilege.
 */

import { describe, expect, it, test } from "bun:test";
import {
  CORRECTABLE_HOLDS,
  correctableTo,
  correctionFixMemory,
  correctionMemory,
  correctionNote,
  decideCorrection,
  holdForCorrection,
  isEnvironmentFailure,
  MAX_TRACK_CORRECTIONS,
  needIsMet,
  STATION_NEEDS,
  type CorrectionInputs,
} from "./correction";
import {
  HOLD_LINE,
  MAX_STATION_ATTEMPTS,
  REPO_ROOT_ACCESS_REFUSED,
  decideDrive,
  type HoldReason,
} from "./driver";
import { ARTIFACT_SOURCE } from "./chain";
import { fullRoute, suggestRoute, type SpineRoute } from "./route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

const ORDER = new Map<AgentStation, number>(AGENT_STATION_ORDER.map((s, i) => [s, i]));

const at = (station: AgentStation, over: Partial<CorrectionInputs> = {}): CorrectionInputs => ({
  hold: "stalled",
  station,
  route: fullRoute(),
  attempts: MAX_STATION_ATTEMPTS,
  corrections: 0,
  filed: [],
  ...over,
});

/**
 * Holds the correction loop must leave alone AND that decideCorrection retries.
 *
 * Money, clocks, kill switches and open boundary calls are handled where they
 * arise. Hoisted to module scope because the partition test below reads it: two
 * hand-written copies of this list would drift, and the drift would show up as a
 * hold nothing tests.
 */
const RETRIED_UNTOUCHED: HoldReason[] = [
  "paused",
  "waiting-on-a-person",
  "done",
  "no-agent",
  "over-budget",
  "out-of-time",
  "out-of-credit",
  "needs-evidence",
  "given-up",
];

/**
 * Holds it must also leave alone, but which do NOT simply retry: they end the
 * track or wait on a person to widen the route. Kept apart from the list above
 * rather than merged, because the assertion that fits them is a different one.
 */
const ENDS_OR_WAITS: HoldReason[] = [
  "needs-a-waived-station",
  "corrections-spent",
  "station-cannot-finish",
  // F-41, 2026-08-25. This one belongs here rather than in CORRECTABLE_HOLDS,
  // and the distinction is the whole finding: the correction loop reroutes a
  // station that RAN AND COULD NOT DO ITS JOB, on the theory that the fix lives
  // upstream. A station whose tool was refused did not do its job badly — it was
  // never let in. Rerouting it threw away a correct spec, six good tasks and a
  // real prototype, and rebuilt them against the same GitHub 401.
  "tools-refused",
  // F-43. Same reasoning one step further out: the correction loop reroutes a
  // station that RAN AND COULD NOT DO ITS JOB. A station that is merely being
  // dispatched forever has not failed at anything the loop can name, so there is
  // no upstream fix to send it to — it needs a person, not a rewrite.
  "going-in-circles",
];

describe("what the rule refuses to touch", () => {
  it("leaves every hold that is not a station failing alone", () => {
    // Money, clocks, kill switches and open boundary calls are handled where
    // they arise. A correction loop that reasoned past a kill switch would be
    // the single worst bug this feature could have.
    for (const hold of RETRIED_UNTOUCHED) {
      expect(decideCorrection(at("build", { hold })).action).toBe("retry");
      expect(CORRECTABLE_HOLDS.has(hold)).toBe(false);
    }
  });

  it("owns exactly the three holds that mean a station ran and could not finish", () => {
    // A CLOSED SET, deliberately. Adding a hold here widens what the correction
    // loop is allowed to reroute, and this line is the place that decision has to
    // be made on purpose. `nothing-to-hand-on` joined on 2026-08-14: a station
    // that filed the wrong artifact ran and could not do its job, same as its two
    // siblings, and the fix may equally live at an earlier station.
    expect([...CORRECTABLE_HOLDS].sort()).toEqual([
      "nothing-to-hand-on",
      "produced-nothing",
      "stalled",
    ]);
  });

  it("sorts every hold that exists into correctable or left alone", () => {
    // THE GUARD ON THE GUARD. The two lists above are hand-written, so a new hold
    // could join HoldReason and appear in neither -- untested in both directions
    // and silently retried forever. HOLD_LINE has to name every hold a person can
    // hit (its own test enforces that), which makes it the register to check
    // against. This is what turns two lists into an actual partition.
    const everyHold = Object.keys(HOLD_LINE) as HoldReason[];
    for (const hold of everyHold) {
      const sorted =
        CORRECTABLE_HOLDS.has(hold) ||
        RETRIED_UNTOUCHED.includes(hold) ||
        ENDS_OR_WAITS.includes(hold);
      expect(sorted, `${hold} is in neither list, so nothing tests what it does`).toBe(true);
    }
  });

  it("never corrects while the station still has attempts", () => {
    // attempts is the cheap bound and it is checked first. Correcting early
    // would replace a one-run retry with a round trip through another station.
    for (let a = 0; a < MAX_STATION_ATTEMPTS; a += 1) {
      expect(decideCorrection(at("build", { attempts: a })).action).toBe("retry");
    }
  });
});

describe("go back to where the fix lives", () => {
  it("sends Build with no spec back to Plan, not round again at Build", () => {
    // The founder's own example, and the whole point of the module: a blind
    // retry at Build is what attempts already does, and it froze real work.
    const d = decideCorrection(at("build"));
    expect(d.action).toBe("go-back");
    if (d.action !== "go-back") return;
    expect(d.station).toBe("define");
    expect(d.kind).toBe("absent");
    expect(d.because).toContain("Plan");
  });

  it("sends Build back to Plan even WITH a spec, and says why it is different", () => {
    // Having a spec and having a spec you can build from are different facts.
    // Three clean runs against this input produced nothing, so the input is the
    // thing to fix and the station that filed it is the one to fix it.
    const d = decideCorrection(at("build", { filed: ["prd"] }));
    expect(d.action).toBe("go-back");
    if (d.action !== "go-back") return;
    expect(d.station).toBe("define");
    expect(d.kind).toBe("not-enough");
    expect(d.because).toContain("not enough");
  });

  it("covers all seven stations, not just Build and Ship", () => {
    // The founder ruling this exists for: "it should not be limited to a
    // particular stage. It should be across all seven stages."
    for (const station of AGENT_STATION_ORDER) {
      expect(STATION_NEEDS[station]).toBeTruthy();
      expect(STATION_NEEDS[station].kinds.length).toBeGreaterThan(0);
      expect(STATION_NEEDS[station].missing.trim().length).toBeGreaterThan(5);
    }
  });

  it("never routes work FORWARDS, whatever it is given", () => {
    // A correction that moved work forward would advance it on the strength of
    // a station that failed, which is the exact thing the driver refuses to do.
    for (const station of AGENT_STATION_ORDER) {
      for (const filed of [[], ["prd"], ["decision"], ["signal"], ["changeset"]]) {
        const d = decideCorrection(at(station, { filed }));
        if (d.action !== "go-back") continue;
        expect(ORDER.get(d.station)!).toBeLessThan(ORDER.get(station)!);
      }
    }
  });

  it("routes to a station that is actually on the route", () => {
    const route = suggestRoute("under-the-hood", "A slow query is timing out");
    for (const station of route.path) {
      const d = decideCorrection(at(station, { route }));
      if (d.action !== "go-back") continue;
      expect(route.path).toContain(d.station);
    }
  });
});

describe("a waiver is not a defect", () => {
  /**
   * THE FIXTURE MOVED, THE INVARIANT DID NOT. This used `existing-feature`,
   * which waived Decide until REQ-2 (2026-08-25) un-waived it so the route could
   * capture a forecast. `interface-change` still waives Plan, so it carries the
   * same rule: work must never be sent back to a station its own route took off
   * the path, because nobody is going to file the thing it is short of.
   */
  it("never sends work back to a station its route waived", () => {
    const route = suggestRoute("interface-change", "The picker is unreadable on a narrow screen");
    const d = decideCorrection(at("design", { route }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("needs-a-waived-station");
    // Actionable: it names the station to put back and offers the alternative.
    expect(d.because).toContain("Plan");
    expect(d.because.toLowerCase()).toContain("route");
  });

  /**
   * THE OTHER HALF OF REQ-2, and the reason un-waiving Decide is an improvement
   * rather than a cost. `existing-feature` work that reaches Plan with no
   * decision behind it can now be SENT BACK to get one, by an agent, instead of
   * stopping and asking a person to edit the route. A correction an agent can
   * make is always better than an escalation a person has to.
   */
  it("sends existing-feature work back to Decide now that Decide is on its route", () => {
    const route = suggestRoute("existing-feature", "Two enterprise deals are blocked on SSO");
    const d = decideCorrection(at("define", { route }));
    expect(d.action).toBe("go-back");
    if (d.action !== "go-back") return;
    expect(d.station).toBe("decide");
  });

  it("correctableTo refuses a waived owner, an off-path owner, and a later one", () => {
    // `interface-change` waives Plan; `existing-feature` no longer waives Decide
    // (REQ-2), so it is not the shape that demonstrates a waived owner any more.
    const waived = suggestRoute("interface-change", "why");
    expect(correctableTo(STATION_NEEDS.design, waived, "design")).toBeNull();

    const offPath: SpineRoute = { ...fullRoute(), path: ["build", "ship", "learn"] };
    expect(correctableTo(STATION_NEEDS.build, offPath, "build")).toBeNull();

    // A precondition owned by the station itself is not somewhere to go back to.
    expect(
      correctableTo({ ...STATION_NEEDS.build, from: "build" }, fullRoute(), "build"),
    ).toBeNull();
  });
});

describe("the one precondition no station can produce", () => {
  it("asks a person for evidence rather than retrying Discover forever", () => {
    // The live failure this was built from. Nine tracks sat at Discover at the
    // attempt ceiling; every run had correctly reported that the workspace holds
    // no signals and refused to invent any. Three more attempts find the same
    // nothing, so the honest move is one specific ask.
    const d = decideCorrection(at("sense", { externalMet: false }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("needs-evidence");
    expect(d.because.toLowerCase()).toContain("connect a source");
  });

  it("treats an unchecked world as unsatisfied, never as a reason to spend", () => {
    expect(decideCorrection(at("sense")).action).toBe("escalate");
    expect(decideCorrection(at("sense", { externalMet: null })).action).toBe("escalate");
  });

  it("says something different when the evidence is there and Discover still fails", () => {
    // Telling somebody to connect a source when one is already connected wastes
    // their time and their trust. Same hold, different diagnosis, different ask.
    const d = decideCorrection(at("sense", { externalMet: true }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("station-cannot-finish");
    expect(d.because).toContain("Discover");
  });

  it("never proposes a go-back from the entry of the loop", () => {
    for (const met of [true, false, null]) {
      expect(decideCorrection(at("sense", { externalMet: met })).action).not.toBe("go-back");
    }
  });
});

describe("the correction budget, which is what stops this being worse than a freeze", () => {
  it("stops proposing go-backs at the cap", () => {
    for (const filed of [[], ["prd"]]) {
      const d = decideCorrection(at("build", { filed, corrections: MAX_TRACK_CORRECTIONS }));
      expect(d.action).not.toBe("go-back");
    }
  });

  it("escalates with the specific thing still missing when the cap is spent", () => {
    const d = decideCorrection(at("build", { corrections: MAX_TRACK_CORRECTIONS }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("corrections-spent");
    expect(d.because).toContain("Plan");
  });

  it("gives up, and says so, when everything is present and it still cannot finish", () => {
    const d = decideCorrection(at("build", { filed: ["prd"], corrections: MAX_TRACK_CORRECTIONS }));
    expect(d.action).toBe("give-up");
    if (d.action !== "give-up") return;
    expect(d.because.toLowerCase()).toContain("nothing more");
  });

  it("spends at most MAX_TRACK_CORRECTIONS whatever the station", () => {
    for (const station of AGENT_STATION_ORDER) {
      const d = decideCorrection(at(station, { corrections: MAX_TRACK_CORRECTIONS + 5 }));
      expect(d.action === "escalate" || d.action === "give-up").toBe(true);
    }
  });
});

describe("an escalation that answers itself", () => {
  it("resumes Discover once the evidence it asked for exists", () => {
    // The drain. The loop stopped and named one thing it needed from a person.
    // Making them ALSO come back and unstick the work by hand is the approvals
    // queue in another costume, which the governance canon rejects outright.
    const d = decideCorrection(at("sense", { priorHold: "needs-evidence", externalMet: true }));
    expect(d.action).toBe("retry");
    if (d.action !== "retry") return;
    expect(d.resume).toBe(true);
  });

  it("does not resume while the thing it asked for is still missing", () => {
    const d = decideCorrection(at("sense", { priorHold: "needs-evidence", externalMet: false }));
    expect(d.action).toBe("escalate");
  });

  it("resumes Plan once a reopened Decide has filed the decision", () => {
    const d = decideCorrection(
      at("define", { priorHold: "needs-a-waived-station", filed: ["decision"] }),
    );
    expect(d.action).toBe("retry");
    if (d.action !== "retry") return;
    expect(d.resume).toBe(true);
  });

  it("cannot resume twice, because the run it grants overwrites the ask", () => {
    // The bound. After the resumed pass the track carries `stalled` or
    // `produced-nothing`, never the ask, so this branch cannot fire again and
    // the ordinary rules take over.
    const after = decideCorrection(at("sense", { priorHold: "stalled", externalMet: true }));
    expect(after.action).toBe("escalate");
    if (after.action !== "escalate") return;
    expect(after.reason).toBe("station-cannot-finish");
  });

  it("never resumes a hold that asked for nothing", () => {
    for (const priorHold of ["station-cannot-finish", "given-up"] as HoldReason[]) {
      const d = decideCorrection(at("sense", { priorHold, externalMet: true }));
      expect(d.action).not.toBe("retry");
    }
  });

  it("resumes on the record, never on the hold alone", () => {
    // A hold that says "we asked for a spec" with no spec filed must not clear
    // the ceiling, or the ask becomes a way to buy three more attempts.
    const d = decideCorrection(
      at("build", {
        priorHold: "corrections-spent",
        corrections: MAX_TRACK_CORRECTIONS,
        filed: [],
      }),
    );
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("corrections-spent");
  });
});

describe("needIsMet", () => {
  it("takes any one of the kinds, not all of them", () => {
    expect(needIsMet(STATION_NEEDS.build, ["task"])).toBe(true);
    expect(needIsMet(STATION_NEEDS.build, ["prd"])).toBe(true);
    expect(needIsMet(STATION_NEEDS.build, ["signal"])).toBe(false);
  });

  it("only lets the outside world satisfy a precondition no station owns", () => {
    expect(needIsMet(STATION_NEEDS.sense, [], true)).toBe(true);
    // Build's precondition is Plan's job. No amount of world state fills it.
    expect(needIsMet(STATION_NEEDS.build, [], true)).toBe(false);
  });

  it("refuses to let a station's own output satisfy a precondition it cannot produce", () => {
    // THE COLLAPSE THIS PINS. Discover's need kinds are `signal` and `theme`,
    // which is exactly what Discover files. So a membership test answered yes
    // the moment Discover succeeded once, for the rest of the track's life, and
    // a later tick that found nothing NEW was diagnosed as a station that has
    // everything and still fails. That escalation is terminal and it sends a
    // person to inspect a station which was behaving correctly.
    expect(needIsMet(STATION_NEEDS.sense, ["signal"])).toBe(false);
    expect(needIsMet(STATION_NEEDS.sense, ["theme"])).toBe(false);
    expect(needIsMet(STATION_NEEDS.sense, ["signal", "theme"], false)).toBe(false);
    // The world is still the one thing that can answer it.
    expect(needIsMet(STATION_NEEDS.sense, ["signal"], true)).toBe(true);
  });

  it("keeps reading the record for every precondition a station does own", () => {
    // The change above must not leak into the other six. Each of these is a
    // question about the track's own record and nothing else.
    for (const station of AGENT_STATION_ORDER) {
      const need = STATION_NEEDS[station];
      if (need.from === null) continue;
      expect(needIsMet(need, [need.kinds[0]])).toBe(true);
      // And the world cannot stand in for a station that owes the work.
      expect(needIsMet(need, [], true)).toBe(false);
    }
  });
});

describe("a starved station is not a broken one", () => {
  /**
   * The live freeze this closes. 26 of 43 production tracks sat at Discover on
   * `station-cannot-finish` -- terminal, "needs your eyes on the station" --
   * while the station was doing exactly the right thing: it looked, found
   * nothing new, and refused to invent evidence.
   *
   * The two holds are not interchangeable and the difference is everything a
   * person does next. `needs-evidence` names a one-minute job and is RESUMABLE,
   * so the work restarts itself the moment a source is connected.
   * `station-cannot-finish` asks somebody to debug a station and nothing can
   * ever clear it.
   */
  it("asks for a source when nothing new has landed, even after Discover once succeeded", () => {
    const d = decideCorrection(at("sense", { filed: ["signal", "theme"], externalMet: false }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("needs-evidence");
    expect(d.because.toLowerCase()).toContain("connect a source");
  });

  it("keeps that escalation resumable, so a connected source restarts the work", () => {
    // The whole point of choosing this hold. A person supplies what only they
    // can and the loop carries on by itself, rather than leaving nineteen pieces
    // of work to be unstuck by hand.
    const asked = decideCorrection(at("sense", { filed: ["signal"], externalMet: false }));
    const hold = holdForCorrection(asked);
    expect(hold).toBe("needs-evidence");
    const answered = decideCorrection(
      at("sense", { filed: ["signal"], priorHold: hold as HoldReason, externalMet: true }),
    );
    expect(answered.action).toBe("retry");
    if (answered.action !== "retry") return;
    expect(answered.resume).toBe(true);
  });

  it("still calls a genuinely broken Discover broken", () => {
    // The other side of the same predicate, and it must not be lost: evidence
    // IS arriving and the station still files nothing three times over. That is
    // the station rather than the world, and it earns a person's attention.
    const d = decideCorrection(at("sense", { filed: ["signal"], externalMet: true }));
    expect(d.action).toBe("escalate");
    if (d.action !== "escalate") return;
    expect(d.reason).toBe("station-cannot-finish");
  });

  it("never sends work back from the entry of the loop, whatever it has filed", () => {
    for (const met of [true, false, null]) {
      for (const filed of [[], ["signal"], ["theme"], ["signal", "theme", "decision"]]) {
        expect(decideCorrection(at("sense", { filed, externalMet: met })).action).not.toBe(
          "go-back",
        );
      }
    }
  });

  it("cannot be reached from a station that sends work backwards", () => {
    // `backNote` in the driver calls needIsMet with no externalMet argument, so
    // the change above would read every external precondition as unsatisfied
    // there. That is only safe because a station whose precondition has no owner
    // can never be the origin of a correction: correctableTo returns null for
    // it, so it never sends work back and never appears as `history.last.from`.
    // Pinned rather than reasoned about, because it is load-bearing and invisible.
    for (const station of AGENT_STATION_ORDER) {
      if (STATION_NEEDS[station].from !== null) continue;
      expect(correctableTo(STATION_NEEDS[station], fullRoute(), station)).toBeNull();
    }
  });
});

describe("every escalation reaches a person as a sentence, never a status word", () => {
  it("maps every stopping decision onto a hold the surface can explain", () => {
    const stopping = [
      decideCorrection(at("sense")),
      decideCorrection(at("sense", { externalMet: true })),
      // A waived owner, which since REQ-2 is `interface-change` at Design rather
      // than `existing-feature` at Plan. Still an escalation, still a sentence.
      decideCorrection(at("design", { route: suggestRoute("interface-change", "why") })),
      decideCorrection(at("build", { corrections: MAX_TRACK_CORRECTIONS })),
      decideCorrection(at("build", { filed: ["prd"], corrections: MAX_TRACK_CORRECTIONS })),
    ];
    for (const d of stopping) {
      const hold = holdForCorrection(d);
      expect(hold).toBeTruthy();
      expect(HOLD_LINE[hold as HoldReason]).toBeTruthy();
      expect(HOLD_LINE[hold as HoldReason].length).toBeGreaterThan(20);
    }
  });

  it("gives a moving decision no hold at all, so a corrected track reads as moving", () => {
    expect(holdForCorrection(decideCorrection(at("build")))).toBeNull();
    expect(holdForCorrection(decideCorrection(at("build", { attempts: 0 })))).toBeNull();
  });

  it("names a station and an action in every reason it gives", () => {
    const names = AGENT_STATION_ORDER.map((s) => s);
    const cases = [
      decideCorrection(at("sense")),
      decideCorrection(at("build")),
      decideCorrection(at("build", { filed: ["prd"] })),
      decideCorrection(at("build", { corrections: MAX_TRACK_CORRECTIONS })),
    ];
    for (const d of cases) {
      const line = "because" in d ? d.because : "";
      // Long enough to be a sentence, and not a bare status token.
      expect(line.length).toBeGreaterThan(30);
      expect(line).toMatch(/\s/);
      expect(names).not.toContain(line as AgentStation);
    }
  });
});

describe("the sentences the loop writes", () => {
  const sentences = [
    correctionNote("build", "define", "absent"),
    correctionNote("build", "define", "not-enough"),
    correctionMemory({
      title: "Add SSO to the admin console",
      from: "build",
      to: "define",
      missing: STATION_NEEDS.build.missing,
      kind: "absent",
    }),
    correctionFixMemory({
      title: "Add SSO to the admin console",
      from: "build",
      to: "define",
      missing: STATION_NEEDS.build.missing,
    }),
    ...Object.values(HOLD_LINE),
  ];

  it("carries no em dash and no en dash anywhere", () => {
    // The humanized-output convention is a hard gate on everything the platform
    // generates for a user, and these strings reach both a prompt and a surface.
    for (const s of sentences) {
      // Written as escapes rather than as the characters, because the commit
      // hook that enforces this rule would reject the test that enforces it.
      expect(s).not.toContain("\u2014");
      expect(s).not.toContain("\u2013");
    }
  });

  it("tells the station being sent back to what NOT to do again", () => {
    // A station handed corrected work with no idea what went wrong files the
    // same thing again, and the round trip bought nothing.
    const note = correctionNote("build", "define", "absent");
    expect(note).toContain("Build");
    expect(note).toContain("Plan");
    expect(note.toLowerCase()).toContain("do not");
  });

  it("writes memory as guidance for next time, not as an incident report", () => {
    const m = correctionMemory({
      title: "Add SSO",
      from: "build",
      to: "define",
      missing: STATION_NEEDS.build.missing,
      kind: "absent",
    });
    // An agent reading "track 4a8f failed" learns nothing it can act on.
    expect(m.toLowerCase()).toContain("before handing work");
    expect(m).toContain("Build");
    expect(m).toContain("Plan");
  });

  it("says the fix worked only in the memory written once it did", () => {
    const fix = correctionFixMemory({
      title: "Add SSO",
      from: "build",
      to: "define",
      missing: STATION_NEEDS.build.missing,
    });
    expect(fix.toLowerCase()).toContain("not a retry");
  });
});

describe("the precondition vocabulary cannot drift from the record", () => {
  it("names only artifact kinds the chain reader can resolve", () => {
    // STATION_NEEDS is matched against `spine_track_members.artifact_kind`. A
    // kind no reader knows would be a precondition that can never be satisfied,
    // which would send healthy work backwards forever.
    for (const station of AGENT_STATION_ORDER) {
      for (const kind of STATION_NEEDS[station].kinds) {
        expect(ARTIFACT_SOURCE[kind]).toBeTruthy();
      }
    }
  });

  it("owns each precondition at a station that comes earlier on the spine", () => {
    for (const station of AGENT_STATION_ORDER) {
      const from = STATION_NEEDS[station].from;
      if (!from) continue;
      expect(ORDER.get(from)!).toBeLessThan(ORDER.get(station)!);
    }
  });

  it("leaves exactly one precondition to the outside world, and it is the first", () => {
    const outside = AGENT_STATION_ORDER.filter((s) => STATION_NEEDS[s].from === null);
    expect(outside).toEqual(["sense"]);
    expect(STATION_NEEDS.sense.fix.trim().length).toBeGreaterThan(20);
  });
});

describe("a failure that was never the station's", () => {
  it("recognises the credit refusals the runtime actually raises", () => {
    // Verbatim from src/lib/ai/runtime.server.ts, and from the live agent_runs
    // rows that froze three tracks without ever running a station.
    expect(
      isEnvironmentFailure("Account credit balance (16) is below the projected cost (20)."),
    ).toBe(true);
    expect(isEnvironmentFailure("Product credit cap reached for this cycle")).toBe(true);
  });

  it("does not swallow a real station failure", () => {
    // The more expensive of the two bugs: a station that never counts an attempt
    // is a track that runs forever instead of one that freezes.
    expect(isEnvironmentFailure("prd.draft is not registered for this user")).toBe(false);
    expect(isEnvironmentFailure("Tool call failed: 500")).toBe(false);
    expect(isEnvironmentFailure(null)).toBe(false);
    expect(isEnvironmentFailure("")).toBe(false);
  });

  it("does not swallow the stamped repo-root refusal, which has its own door", () => {
    // F-57. The repo-root 404 is a locked door, but it is the DRIVER's door:
    // the stamped sentence must arrive as a step error, be matched by
    // REFUSAL_SIGNS, and file `tools-refused` — a terminal hold that names the
    // tool. If isEnvironmentFailure claimed it, the run would instead take the
    // no-attempt throw path, which retries forever against a repo the
    // credential cannot see and never tells anyone which door was locked.
    // Built from the imported constant so the two classifiers cannot drift
    // apart without this test saying so.
    const stamped =
      `GitHub answered 404 for the repository root of o/r, which the workspace binding names — ` +
      `${REPO_ROOT_ACCESS_REFUSED}. Grant the GitHub App access to o/r, or re-bind the repo on Connectors.`;
    expect(isEnvironmentFailure(stamped)).toBe(false);
    expect(isEnvironmentFailure(new Error(stamped))).toBe(false);
  });
});

describe("isEnvironmentFailure recognises the refusal in every form it arrives in", () => {
  /**
   * THE REGRESSION THAT FROZE 26 TRACKS, pinned.
   *
   * The runtime raises one refusal in two wordings. CreditExhaustedError says
   * "Account credit balance (0) is below the projected cost (2)." and the
   * ai_events row logged beside it says "credit_exhausted: account <id> balance
   * 0 below projected 2". The original guard tested `includes("credit balance")`,
   * which is true of the first and false of the second, because the second never
   * puts those two words together. Measured in production on 2026-08-14: every
   * live failure carried the SECOND wording.
   *
   * A guard on a sentence passes when the meaning breaks and fails when the copy
   * improves. These pin the fact instead.
   */
  test("the ai_events wording is recognised, not only the thrown one", () => {
    expect(
      isEnvironmentFailure(
        "credit_exhausted: account 16417eac-c480-45f7-aeff-55d787dba2f3 balance 0 below projected 2",
      ),
    ).toBe(true);
  });

  test("the thrown wording still works", () => {
    expect(
      isEnvironmentFailure("Account credit balance (0) is below the projected cost (2)."),
    ).toBe(true);
  });

  /**
   * The identity, which is what this should always have tested. Both classes
   * declare a readonly `code`, so neither depends on anyone's prose surviving a
   * copy edit.
   */
  test("an error object is matched on its code, whatever its message says", () => {
    const err = Object.assign(new Error("something entirely reworded"), {
      code: "CREDIT_EXHAUSTED",
    });
    expect(isEnvironmentFailure(err)).toBe(true);
  });

  test("and on its class name when the code is absent", () => {
    const err = new Error("reworded again");
    err.name = "CreditExhaustedError";
    expect(isEnvironmentFailure(err)).toBe(true);
  });

  test("a per-scope cap is environmental too", () => {
    const err = Object.assign(new Error("x"), { code: "CREDIT_CAP_REACHED" });
    expect(isEnvironmentFailure(err)).toBe(true);
  });

  /**
   * STILL NARROW, and this is the half that matters most. Swallowing a real
   * station failure into a hold that never counts an attempt replaces a track
   * that freezes with a track that runs forever, which is the more expensive bug.
   */
  test("a genuine station failure is NOT environmental", () => {
    expect(isEnvironmentFailure("prd.draft returned no id")).toBe(false);
    expect(isEnvironmentFailure(new Error("the model returned invalid JSON"))).toBe(false);
    expect(isEnvironmentFailure(Object.assign(new Error("x"), { code: "TOOL_FAILED" }))).toBe(
      false,
    );
    expect(isEnvironmentFailure(null)).toBe(false);
    expect(isEnvironmentFailure(undefined)).toBe(false);
    expect(isEnvironmentFailure("")).toBe(false);
  });
});

describe("the attempt ceiling does not apply to an account that could not pay", () => {
  const base = {
    paused: false,
    station: "sense" as const,
    title: "A track",
    origin: null,
    pendingApprovals: 0,
  };

  /**
   * A track whose last stop was out-of-credit never ran, so its attempts were
   * not spent on anything. Applying the ceiling to it means an account that
   * empties for three ticks freezes every track it owns PERMANENTLY, and topping
   * up does not revive them, because `stalled` escalates to
   * `station-cannot-finish`, which is terminal and asks a person to inspect a
   * station that was never the problem.
   */
  test("a track frozen at the ceiling behind an empty account still acts", () => {
    const d = decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS, lastHold: "out-of-credit" });
    expect(d.act).toBe(true);
  });

  test("the same applies to a budget ceiling", () => {
    const d = decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS, lastHold: "over-budget" });
    expect(d.act).toBe(true);
  });

  test("a station that genuinely failed still stalls at the ceiling", () => {
    const d = decideDrive({
      ...base,
      attempts: MAX_STATION_ATTEMPTS,
      lastHold: "produced-nothing",
    });
    expect(d.act).toBe(false);
    expect(d.hold).toBe("stalled");
  });

  test("an absent hold is treated as a real failure, never as free passage", () => {
    // Fail safe: an unknown reason must not buy an unbounded retry.
    const d = decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS, lastHold: null });
    expect(d.act).toBe(false);
    expect(d.hold).toBe("stalled");
  });

  test("money never outranks the kill switch or an open call", () => {
    expect(
      decideDrive({
        ...base,
        paused: true,
        attempts: MAX_STATION_ATTEMPTS,
        lastHold: "out-of-credit",
      }).hold,
    ).toBe("paused");
    expect(
      decideDrive({
        ...base,
        pendingApprovals: 1,
        attempts: MAX_STATION_ATTEMPTS,
        lastHold: "out-of-credit",
      }).hold,
    ).toBe("waiting-on-a-person");
  });
});
