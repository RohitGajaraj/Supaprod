import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { VERB_BY_TOOL } from "@/lib/presence/character";
import { holdTone, stationCrew } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";

import type { PlanStep } from "@/components/meridian/PlanCard";
import type { RunMapStation } from "@/components/meridian/RunMap";
import type { StepMeterStep } from "@/components/meridian/progress";

/**
 * The first mention of `tool` in a brief that is not part of a longer id.
 *
 * A bare `indexOf` is correct against today's catalogue -- no key in
 * `VERB_BY_TOOL` is a prefix of another, checked -- and would silently stop
 * being correct the day somebody adds `signals.logs` beside `signals.log`. The
 * boundary test is two character comparisons and removes the trap rather than
 * leaving a comment warning about it.
 */
function mentionedAt(brief: string, tool: string): number {
  for (let at = brief.indexOf(tool); at >= 0; at = brief.indexOf(tool, at + 1)) {
    const before = at === 0 ? " " : brief[at - 1];
    const after = brief[at + tool.length] ?? " ";
    if (!/[\w.]/.test(before) && !/[\w.]/.test(after)) return at;
  }
  return -1;
}

/**
 * WHAT A STATION IS ABOUT TO DO, READ OFF THE BRIEF ITS CREW WILL BE HANDED.
 *
 * ── THE BRANCH THIS FEEDS SHIPPED DEAD ────────────────────────────────────
 * `RunMap` has always drawn a step graph for an opened station and headed it
 * *"What ${name} intends to do"* when that station is `pending`. Nothing ever
 * populated `RunMapStation.steps`: this function pushed six shapes and set the
 * field on none of them, and the only other producer of stops,
 * `AskPlanGate.stopsForRoute`, does not set it either. So the map could say
 * what a station INTENDS and was never handed anything to say it with, and the
 * goal's *"what it is about to do"* was answered at STATION level alone -- the
 * strip marks the next stop (`run-strip-spec.ts`) and nothing anywhere said
 * what that stop would actually go and do.
 *
 * ── WHERE THE STEPS COME FROM, WHICH MATTERS MORE THAN THAT THEY EXIST ────
 * `CREW_ROLE[slug].file` is the seat's own brief, and `CrewRole` documents that
 * field as *"What it must FILE, named as the tool that files it"*. `stationCrew`
 * returns the seats in crew order, which `driver.ts` records as *"the station's
 * actual sequence of work"* and enforces by ordering (*"Verify runs BEFORE
 * Announce"*). So the station's plan is already written down, in the very text
 * the driver will hand its crew minutes from now. This reads that text, in that
 * order, and reads nothing else.
 *
 * `job` IS DELIBERATELY NOT READ, and that is the whole difference between a
 * derivation and a plausible-looking script. `CrewRole.job` is prose *"in its
 * own terms"*, where a tool id can appear as a WARNING rather than an
 * instruction: `builder.job` names `repo.search` three separate times, every one
 * of them to say it does not reliably reach a private repository and that an
 * empty result is not evidence the code is absent. Scanning it put "Searching
 * the repository" into Build's plan on the strength of a sentence telling the
 * seat not to trust the tool -- measured while building this, and the reason the
 * scan is `file` only. `builder.file`'s conditional recovery call
 * (`studio.unstage`, for a path the commit refused) is dropped by the same cut,
 * correctly: a step taken only when something goes wrong is not a plan.
 *
 * ── A CURATED VERB OR NO STEP AT ALL ──────────────────────────────────────
 * The label is `VERB_BY_TOOL[tool]` verbatim, sentence-cased for a node title
 * and otherwise untouched. Two standing rules meet here and both point the same
 * way. `verbForTool`'s fallback is `running ${tool}`, which IS a tool name, and
 * `RunMap`'s header bans one from its rendered output structurally -- *"there is
 * no field on `RunMapStation` that carries a tool name"* -- with
 * `run-map.test.tsx` pinning it. And `VERB_BY_TOOL` is the walk's own
 * vocabulary, so a step here and the character narrating that same call cannot
 * describe one action two ways, which is the rule `holdLine` is kept in one file
 * for.
 *
 * The cost is real and is the point. A tool with no curated verb yields NO step.
 * Measured against the catalogue on 2026-09-01, that silences two of the fifteen
 * active cast seats: `sprint-planner` files `tasks.create` and `insight-keeper`
 * files `memory.remember` then `memory.promote`, and `VERB_BY_TOOL` (which this
 * lane does not own) has an entry for none of the three. Plan and Learn
 * therefore show one step each rather than both their seats' work. A partial
 * true plan beats a complete invented one.
 *
 * `why` and `touches` are left unset on every step, which is also a refusal.
 * `PlanStep.why` is documented as *"Why this step was skipped, or why it
 * failed"*, so filling it on work that has not started would misuse the field;
 * `touches` is *"what this step will act on"*, and its own docblock rules that
 * *"a step whose object the planner does not know yet must not have one invented
 * for it"*. A brief names the call, never the branch or the artifact it will
 * land on.
 */
const INTENT_BY_STATION = new Map<AgentStation, PlanStep[]>();

export function stationIntent(station: AgentStation): PlanStep[] {
  const already = INTENT_BY_STATION.get(station);
  if (already) return already;

  const steps: PlanStep[] = [];
  /* Verbs, not tool ids: see the dedupe note below. */
  const said = new Set<string>();

  for (const seat of stationCrew(station)) {
    const filed = Object.keys(VERB_BY_TOOL)
      .map((tool) => ({ tool, at: mentionedAt(seat.file, tool) }))
      .filter((m) => m.at >= 0)
      /* The order the brief names them IS the order the seat is told to work
         in, so the sequence is read off the text rather than assigned here.
         `qa.file` is the proof it matters: stage, commit, review, open the pull
         request, run the checks, merge -- and a list in any other order would
         show a review happening after the merge it was meant to gate. */
      .sort((a, b) => a.at - b.at);

    for (const { tool } of filed) {
      const verb = VERB_BY_TOOL[tool];
      /*
       * ONE VERB, ONCE PER STATION, and deduped on the VERB rather than on the
       * tool because the map is deliberately many-to-one: `repo.read` and
       * `repo.tree` both read "reading the repository". Keying on the tool would
       * draw that node twice at Build and read as two passes over the repo.
       * Across seats too -- `signals.log` is filed by all three Discover seats,
       * and one station's plan should say "filing the evidence I found" once.
       */
      if (said.has(verb)) continue;
      said.add(verb);
      steps.push({
        id: `${seat.slug}:${tool}`,
        label: verb.charAt(0).toUpperCase() + verb.slice(1),
        /* Nothing here has run. `RunMap` heads the graph off the STATION's
           state, but `PlanCard` renders the same `PlanStep[]` and paints per
           step, so a step claiming `done` would report a finished call. */
        state: "pending",
        /* Who is briefed to do it -- a catalogue fact, not an inference.
           `PlanStep.agentSlug` resolves through `agentDisplayName`, so no slug
           reaches a surface. */
        agentSlug: seat.slug,
      });
    }
  }

  /* Memoised on the station because every input is a module constant:
     `SPECIALIST_CATALOG`, `CREW_ROLE` and `VERB_BY_TOOL` are all frozen at
     import. `runPosition` runs on a ten-second poll and on every render of the
     pane, and re-deriving seven stations' plans from string scans on each of
     those is work whose answer cannot have changed. */
  INTENT_BY_STATION.set(station, steps);
  return steps;
}

/**
 * WHERE THE WORK STANDS ON ITS OWN ROUTE, DERIVED FROM ONE ROW.
 *
 * ── EVERY FIGURE HERE IS TWO INTEGERS OFF `spine_tracks`, NOT AN ESTIMATE ──
 * `route.path` is the stations this work will visit, decided before it started
 * and stored; `route.waived` is the ones taken off it, each with the reason
 * somebody gave. `station` is where it is now. So "station 5 of 7" is counting,
 * not forecasting, which is the only kind of progress this system permits a
 * surface to draw (`Spend`'s header: both numbers known, the denominator does
 * not move, the proportion is the fact).
 *
 * NOTHING HERE READS A SECOND QUERY. The whole position comes off the `Track`
 * the pane already polls on its ten-second beat, so the header, the meter and
 * the route cannot disagree with each other about one run -- which is the exact
 * drift the route file's own header records being caught live ("the walk below
 * announced a hold while this header still said Running").
 *
 * ── THE FOUR WAYS OF STANDING AT A STATION, AND WHY THEY ARE FOUR ─────────
 * `walking` is the only input that is not a row, and it is the client's own
 * fact: a drive mutation is in flight from THIS tab. It is what separates "an
 * agent is inside Build" from "it is parked at Build and nobody is driving it",
 * and the second is what 58 of 59 tracks in this product's history actually
 * were. `holdTone` reads the RAW hold reason, never the prose, for the reason
 * `TrackStart` was repaired: branching on wording is how every hold once
 * painted amber.
 */
export function runPosition(
  track: {
    station: AgentStation;
    status: "open" | "done" | "abandoned";
    route: { path: AgentStation[]; waived: { station: AgentStation; reason: string }[] };
    holdReason: string | null;
  },
  walking: boolean,
  /**
   * WHAT CAME OF EACH STATION, already reduced to a sentence by the caller.
   *
   * ── PASSED IN, NOT FETCHED, AND THAT IS THIS FILE'S OWN RULE ────────────
   * The comment on the `pending` branch below states the constraint plainly:
   * this function *"reads ONE row and takes no second query ... the reason the
   * header, the meter and the route cannot disagree"*. Adding a fetch here to
   * fill `outcome` would break exactly that. So the caller does the read and
   * hands over the finished words, and `runPosition` stays pure and stays
   * testable.
   *
   * Optional because most callers do not have it and must not be forced to
   * invent one: `run-strip-spec.ts` and the four test files call this with two
   * arguments and get stops with no outcome, which is the state that shipped
   * for months. An absent map is "nobody looked", not "nothing happened".
   *
   * `station-outcome.ts` builds it, and its header explains why the sentence
   * counts agent runs rather than naming the artifact the docstring on
   * `RunMapStation.outcome` promised: no artifact table carries a `track_id`,
   * so the artifact cannot be resolved from a track without guessing.
   */
  outcomes?: Partial<Record<AgentStation, string>>,
): { stops: RunMapStation[]; meter: StepMeterStep[]; index: number; total: number } {
  /* A settled stop gets the words; a `skipped` one never does. A waived station
     did not run, so a count of agents at it would be a claim about work that
     was deliberately not done -- and it already carries `waivedReason`, which
     is the one fact about it that matters. `pending` is excluded for the same
     reason the branch below excludes it from anything but intent. */
  const said = (station: AgentStation): { outcome?: string } => {
    const line = outcomes?.[station];
    return line ? { outcome: line } : {};
  };
  const waivedBy = new Map(track.route.waived.map((w) => [w.station, w.reason]));
  /*
   * SPINE ORDER, ALWAYS, and the union of the path and the waivers so a station
   * taken off the route still appears as the decision it was. `buildChain` does
   * the same union server-side for the same reason: a gap where a station used
   * to be reads as an omission, and the founder ruling is that it is a decision
   * on the record.
   */
  const shown = AGENT_STATION_ORDER.filter((s) => track.route.path.includes(s) || waivedBy.has(s));
  const here = shown.indexOf(track.station);
  const tone = holdTone(track.holdReason);
  /* `buildChain`'s own rule, matched deliberately: a closed track has PASSED
     the station it stopped on, an open one is still standing there. */
  const open = track.status === "open";
  /*
   * ── A PLAN IS ONLY DRAWN WHILE SOMETHING IS STILL COMING ─────────────────
   * Both gates are borrowed rather than invented, because two neighbours of
   * this file already answered the same question and disagreeing with them is
   * how one run comes to be described four ways.
   *
   * A CLOSED RUN. `run-strip-spec.ts` marks its `next` station only under
   * `track.status === "open"`, and its reason applies here word for word: *"On
   * a settled run there is no next, and marking one would promise work that
   * will not happen."* This matters concretely rather than in theory -- an
   * abandoned track parked at Build still carries Ship and Learn as `pending`
   * stops on its map (`run-position.test.ts` fixes exactly that case), and
   * telling a reader what Ship intends to do on work nobody will resume is a
   * fabricated future.
   *
   * A TERMINAL HOLD. `nothingIsComing` is already imported here for the
   * approval split, and it means *"the loop has stopped for good and only a
   * person restarts it"*: `track-tick.ts` drops those tracks from its selection
   * entirely, so nothing will drive them again. Not a corner case either --
   * 36 of the 56 open held tracks were measured in that state on 2026-08-31.
   * A route that will not move must not narrate what it is about to do.
   */
  const stillComing = open && !nothingIsComing(track.holdReason);

  const stops: RunMapStation[] = [];
  const meter: StepMeterStep[] = [];

  shown.forEach((station, i) => {
    const reason = waivedBy.get(station);
    const name = AGENT_STATIONS[station]?.name ?? station;

    if (reason !== undefined) {
      stops.push({ station, state: "skipped", waivedReason: reason });
      meter.push({ key: station, label: name, state: "waived" });
      return;
    }
    if (here >= 0 && i < here) {
      stops.push({ station, state: "done", ...said(station) });
      meter.push({ key: station, label: name, state: "done" });
      return;
    }
    if (here >= 0 && i === here) {
      if (!open) {
        stops.push({ station, state: "done", ...said(station) });
        meter.push({ key: station, label: name, state: "done" });
        return;
      }
      if (walking) {
        stops.push({ station, state: "active", ...said(station) });
        meter.push({ key: station, label: name, state: "working" });
        return;
      }
      if (tone === "you") {
        /*
         * ── A STATION THE LOOP GAVE UP ON DOES NOT NEED AN APPROVAL ────────
         *
         * `needs-approval` is not a mood, it is a claim with a control behind
         * it: `PlanCard.tsx:73` defines it as *"a person is required before
         * this one moves"*, `:187` draws it as a hollow ring with a solid
         * centre because **something is IN it**, and `:476` gates the Approve
         * button on exactly this state (`canApprove = !!onApproveStep &&
         * step.state === "needs-approval"`).
         *
         * `holdTone` returns "you" for `HOLD_NEEDS_PERSON`, and **four of
         * those six reasons are the whole of `TERMINAL_HOLDS`**. So 36 of the
         * 37 open tracks reaching this branch had their current station drawn
         * as awaiting an approval that does not exist, with an approval glyph,
         * in approval colour, and a chip reading "Needs you". Found by driving
         * `a30238f5` (`given-up` at Ship) and reading **"Ship / Needs you"** in
         * the step list, directly above a hold line saying nothing more would
         * be tried on it automatically.
         *
         * RunMap draws no Approve control today, so nothing is currently
         * clickable-and-dead. That is luck rather than design: the state is the
         * gate, `PlanCard` renders the same `PlanStepState`, and the first
         * caller to pass `onApproveStep` would offer approval on a station
         * nobody can approve. **A state is a claim whether or not this
         * renderer acts on it.**
         *
         * So the split is by whether anything is coming, the same predicate the
         * footer, the header chip, the browser tab, the run heading, the
         * open-work list and the way out all read. A terminal hold is `held`,
         * which RunMap already chips as "On hold" -- coarser than the footer's
         * "Needs a restart" and not in conflict with it, where "Needs you" was.
         */
        if (nothingIsComing(track.holdReason)) {
          stops.push({ station, state: "held", hold: track.holdReason, ...said(station) });
          meter.push({ key: station, label: name, state: "held" });
          return;
        }
        stops.push({ station, state: "needs-approval", hold: track.holdReason, ...said(station) });
        meter.push({ key: station, label: name, state: "waiting" });
        return;
      }
      if (tone === "hold") {
        stops.push({ station, state: "held", hold: track.holdReason, ...said(station) });
        meter.push({ key: station, label: name, state: "held" });
        return;
      }
      /* Standing here, and nothing is moving it. NOT `active`: there is no
         agent inside this station, and saying there is would be the one claim
         this surface must never make about itself. */
      stops.push({ station, state: "here", ...said(station) });
      meter.push({ key: station, label: name, state: "here" });
      return;
    }
    /*
     * ── ONLY A STATION THAT HAS NOT RUN MAY BE DESCRIBED AS INTENDING ──────
     * `pending` is the one state that gets a plan, and `RunMap` is the reason:
     * it heads the graph *"intends to do"* on `pending` and *"did"* on every
     * other state. These steps are the BRIEF -- a document written before the
     * work -- so hanging them on a `done`, `here`, `active` or `held` stop
     * would print what a station DID from the list of what it was ASKED to do.
     * That is the difference between a record and a script, and it is the one
     * this repo rejected a branch over.
     *
     * There is no honest alternative to reach for. This function reads ONE row
     * and takes no second query (the header's rule, and the reason the header,
     * the meter and the route cannot disagree), so it cannot know which tools a
     * settled station actually called. That fact belongs to `RunTimeline` and
     * `ToolStream`, *"behind their own door"* in `RunMap`'s own words. A waived
     * stop stays silent for a simpler reason: it never runs at all.
     */
    const stop: RunMapStation = { station, state: "pending" };
    const intent = stillComing ? stationIntent(station) : [];
    /* Absent rather than empty. `RunMap` reads `steps?.length` to decide
       whether the whole stop is a button, so the two are equivalent to it
       today -- but an empty array stored on the record claims "this station
       plans nothing", and no station does. */
    if (intent.length > 0) stop.steps = intent;
    stops.push(stop);
    meter.push({ key: station, label: name, state: "ahead" });
  });

  return { stops, meter, index: here >= 0 ? here + 1 : 0, total: shown.length };
}
