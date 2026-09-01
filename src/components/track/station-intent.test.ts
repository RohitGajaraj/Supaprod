/**
 * WHAT A STATION IS ABOUT TO DO, AND EVERYTHING IT REFUSES TO SAY IT WILL.
 *
 * `RunMap` has drawn a step graph headed *"What ${name} intends to do"* since
 * 2026-08-20 and `runPosition` never populated `RunMapStation.steps`, so the
 * branch was unreachable: the map could say what a station INTENDS and was
 * never handed anything to say it with. `stationIntent` feeds it.
 *
 * The assertions that matter here are NOT that steps appear. This repo has
 * already rejected a branch for *"a timer advancing an index through step
 * labels, i.e. theatre by the repo's own definition"*, and a step list is the
 * easiest place in the product to reintroduce that: a plausible plan reads
 * better than a partial one, and nothing on screen tells them apart. So what is
 * pinned below is the derivation's REFUSALS --
 *
 *   every step traces to a tool its own seat's brief tells it to call,
 *   every label is the walk's own curated verb and never a tool name,
 *   a seat whose brief names no curated verb contributes NOTHING,
 *   a settled, waived, abandoned or given-up station intends nothing at all,
 *
 * -- each with a control beside it, because a refusal test that passes because
 * the derivation produces nothing at all is not evidence of anything.
 */
import { describe, expect, test } from "bun:test";

import { runPosition, stationIntent } from "./run-position";

import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { VERB_BY_TOOL } from "@/lib/presence/character";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { CREW_ROLE, stationCrew } from "@/lib/spine/driver";

type Arg = Parameters<typeof runPosition>[0];

function track(over: Partial<Arg> = {}): Arg {
  return {
    station: "decide",
    status: "open",
    route: { path: [...AGENT_STATION_ORDER], waived: [] },
    holdReason: null,
    ...over,
  };
}

/** `stationIntent` writes ids as `slug:tool`, which is what makes a step traceable. */
function partsOf(id: string): { slug: string; tool: string } {
  const cut = id.indexOf(":");
  return { slug: id.slice(0, cut), tool: id.slice(cut + 1) };
}

const CURATED = new Set(Object.values(VERB_BY_TOOL));

describe("a station's plan is read off the brief its crew will actually be handed", () => {
  // Without this the whole file could pass on a derivation that returns [].
  test("the derivation produces a real plan, so the refusals below mean something", () => {
    const total = AGENT_STATION_ORDER.reduce((n, s) => n + stationIntent(s).length, 0);
    expect(total).toBeGreaterThan(10);
    // Build is the longest brief in the catalogue and the one a reader most
    // wants opened: stage, commit, review, open the pull request, run the
    // checks, merge.
    expect(stationIntent("build").length).toBe(6);
  });

  test("every step names a tool that seat's own brief tells it to call", () => {
    // The anti-fabrication assertion. A step that cannot be traced back to a
    // line of `CREW_ROLE` is one somebody wrote.
    for (const station of AGENT_STATION_ORDER) {
      for (const step of stationIntent(station)) {
        const { slug, tool } = partsOf(step.id);
        const seat = CREW_ROLE[slug];
        expect(seat, `${station}: step ${step.id} names a seat that does not exist`).toBeTruthy();
        expect(seat.file.includes(tool), `${station}: ${slug} is never told to call ${tool}`).toBe(
          true,
        );
      }
    }
  });

  test("only seats that actually work the station appear in its plan", () => {
    for (const station of AGENT_STATION_ORDER) {
      const crew = new Set(stationCrew(station).map((s) => s.slug));
      for (const step of stationIntent(station)) {
        expect(
          crew.has(partsOf(step.id).slug),
          `${partsOf(step.id).slug} is not ${station}'s`,
        ).toBe(true);
      }
    }
  });

  test("every label is the walk's own curated verb, never a tool name", () => {
    /*
     * `RunMap`'s header bans a tool name from the rendered output structurally
     * ("there is no field on `RunMapStation` that carries a tool name"), and
     * `verbForTool`'s fallback is `running ${tool}` -- so taking that fallback
     * would put `running studio.pr.merge` on the map. The rule is a curated
     * verb or no step, and this is what holds it.
     */
    for (const station of AGENT_STATION_ORDER) {
      for (const step of stationIntent(station)) {
        const verb = step.label.charAt(0).toLowerCase() + step.label.slice(1);
        expect(CURATED.has(verb), `${station}: "${step.label}" is not a curated verb`).toBe(true);
        /*
         * A tool id is the only thing in this vocabulary shaped `word.word`, so
         * this is what actually catches `running ${tool}`. A guard on the word
         * "Running" was written here first and FAILED against an honest label:
         * `studio.checks.run`'s curated verb is "running the checks". That is
         * the "pin the claim, not the spelling" trap in miniature -- a guard on
         * a literal prefix fires on good copy and would have said nothing about
         * `Running studio.pr.merge`, which is the string that matters.
         */
        expect(step.label, `${station}: a tool id reached a label`).not.toMatch(/[a-z]+\.[a-z]+/);
      }
    }
  });

  test("the order is the order the brief names the calls", () => {
    // `driver.ts` records crew order as "the station's actual sequence of work"
    // and the seat's own brief orders the calls inside a seat. A plan that
    // showed the review after the merge would describe a gate that gates
    // nothing.
    const ids = stationIntent("build").map((s) => s.id);
    const at = (tool: string) => ids.findIndex((id) => partsOf(id).tool === tool);
    expect(at("studio.stage")).toBeLessThan(at("studio.commit"));
    expect(at("studio.commit")).toBeLessThan(at("studio.review"));
    expect(at("studio.review")).toBeLessThan(at("studio.pr.merge"));
    expect(at("studio.checks.run")).toBeLessThan(at("studio.pr.merge"));
  });

  test("one verb per station, however many seats file it", () => {
    // Deduped on the VERB, not the tool, because the map is many-to-one:
    // `repo.read` and `repo.tree` both read "reading the repository".
    for (const station of AGENT_STATION_ORDER) {
      const labels = stationIntent(station).map((s) => s.label);
      expect(new Set(labels).size, `${station} says the same thing twice`).toBe(labels.length);
    }
    // The control: all three Discover seats file `signals.log`, and the plan
    // says it once.
    const filing = stationCrew("sense").filter((s) => s.file.includes("signals.log"));
    expect(filing.length).toBeGreaterThan(1);
    expect(stationIntent("sense").filter((s) => partsOf(s.id).tool === "signals.log").length).toBe(
      1,
    );
  });
});

describe("it stays quiet where it cannot derive, rather than filling the gap", () => {
  test("a seat whose brief names no curated verb contributes no step", () => {
    /*
     * THE MINIMUM CASE, AND IT IS LIVE RATHER THAN HYPOTHETICAL. Measured
     * 2026-09-01: `sprint-planner` files `tasks.create` and `insight-keeper`
     * files `memory.remember`/`memory.promote`, and `VERB_BY_TOOL` carries an
     * entry for none of the three. Both seats therefore say nothing, and Plan
     * and Learn show one step each rather than two seats' worth. Partial and
     * true beats complete and invented.
     */
    const silent = AGENT_STATION_ORDER.flatMap((station) =>
      stationCrew(station)
        .filter((seat) => !Object.keys(VERB_BY_TOOL).some((t) => seat.file.includes(t)))
        .map((seat) => ({ station, slug: seat.slug })),
    );
    expect(silent.length, "no seat lacks a curated verb, so this proves nothing").toBeGreaterThan(
      0,
    );
    for (const { station, slug } of silent) {
      const spoke = stationIntent(station).filter((s) => partsOf(s.id).slug === slug);
      expect(spoke, `${slug} was given words its brief does not have`).toEqual([]);
    }
  });

  test("a tool the vocabulary has no verb for is never given one", () => {
    for (const station of AGENT_STATION_ORDER) {
      const ids = stationIntent(station).map((s) => s.id);
      for (const seat of stationCrew(station)) {
        // Every `word.word` token the brief names, curated or not.
        for (const tool of seat.file.match(/\b[a-z]+(?:\.[a-z_]+)+\b/g) ?? []) {
          if (tool in VERB_BY_TOOL) continue;
          expect(ids.includes(`${seat.slug}:${tool}`), `${tool} was invented a verb`).toBe(false);
        }
      }
    }
  });

  test("no step claims a reason or an object it does not have", () => {
    // `PlanStep.why` is documented as "why this step was skipped, or why it
    // failed" and `touches` as what it will act on, whose own rule is that "a
    // step whose object the planner does not know yet must not have one
    // invented for it". A brief names the call and never the branch.
    for (const station of AGENT_STATION_ORDER) {
      for (const step of stationIntent(station)) {
        expect(step.why).toBeUndefined();
        expect(step.touches).toBeUndefined();
      }
    }
  });
});

describe("a settled station is never described as intending anything", () => {
  /** Every stop that carries a plan, whatever the row. */
  const planned = (t: Arg, walking = false) =>
    runPosition(t, walking).stops.filter((s) => (s.steps?.length ?? 0) > 0);

  test("only a station the work has not reached yet carries a plan", () => {
    for (const station of AGENT_STATION_ORDER) {
      for (const walking of [false, true]) {
        for (const stop of planned(track({ station }), walking)) {
          expect(stop.state, `${station}: a ${stop.state} stop was given a plan`).toBe("pending");
        }
      }
    }
  });

  test("the station the work is standing at intends nothing, however it is standing", () => {
    // `here`, `active`, `held` and `needs-approval` are all "the work is AT this
    // stop". It may already be part-way through its own brief and this function
    // reads one row, so what it has left to do is not knowable here.
    for (const holdReason of [null, "out-of-credit", "waiting-on-a-person", "given-up"]) {
      for (const walking of [false, true]) {
        const p = runPosition(track({ station: "build", holdReason }), walking);
        const at = p.stops.find((s) => s.station === "build");
        expect(at?.steps, `build carried a plan while holding ${holdReason}`).toBeUndefined();
      }
    }
  });

  test("a finished run promises no further work", () => {
    const p = runPosition(track({ station: "learn", status: "done" }), false);
    expect(planned(track({ station: "learn", status: "done" }))).toEqual([]);
    expect(p.stops.every((s) => s.steps === undefined)).toBe(true);
  });

  test("abandoned work does not narrate the stations it will never reach", () => {
    // The concrete case: abandoned at Build leaves Ship and Learn `pending` on
    // the map, and `run-strip-spec.ts` already refuses to mark a `next` on a
    // settled run for this reason -- "marking one would promise work that will
    // not happen".
    const t = track({ station: "build", status: "abandoned" });
    const ahead = runPosition(t, false).stops.filter((s) => s.state === "pending");
    expect(ahead.length, "the fixture no longer leaves stations ahead").toBeGreaterThan(0);
    expect(planned(t)).toEqual([]);
  });

  test("a run the loop has given up on promises nothing ahead of it", () => {
    // `nothingIsComing`: `track-tick.ts` drops these tracks from its selection
    // entirely, so nothing will drive them again.
    for (const holdReason of TERMINAL_HOLDS) {
      const t = track({ station: "define", holdReason });
      const ahead = runPosition(t, false).stops.filter((s) => s.state === "pending");
      expect(ahead.length, `${holdReason} left no station ahead to test`).toBeGreaterThan(0);
      expect(planned(t), `${holdReason} still promised work`).toEqual([]);
    }
  });

  test("but a hold a person can clear still shows what is coming", () => {
    /*
     * THE CONTROL. Without it every assertion above passes on a derivation that
     * returns nothing at all, which is the instrument failure this repo has
     * filed twice ("suspect the instrument when the control fails"). An
     * out-of-credit track is stopped and RESUMABLE, and the stations ahead of
     * it are exactly the ones a person wants to read before topping up.
     */
    const t = track({ station: "build", holdReason: "out-of-credit" });
    expect(TERMINAL_HOLDS.includes("out-of-credit" as never)).toBe(false);
    const names = planned(t).map((s) => s.station);
    expect(names).toEqual(["ship", "learn"]);
  });

  test("a station taken off the route carries no plan", () => {
    // It is a decision on the record, not work that is coming.
    const path = AGENT_STATION_ORDER.filter((s) => s !== "design");
    const t = track({
      station: "decide",
      route: { path, waived: [{ station: "design" as AgentStation, reason: "No interface." }] },
    });
    const design = runPosition(t, false).stops.find((s) => s.station === "design");
    expect(design?.state).toBe("skipped");
    expect(design?.steps).toBeUndefined();
    // ...while the live stations ahead of it still do, so this is the waiver
    // and not the run being quiet.
    expect(planned(t).length).toBeGreaterThan(0);
  });
});
