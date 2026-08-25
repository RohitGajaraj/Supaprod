/**
 * The spine route: which stations a piece of work will actually visit.
 *
 * PURE. No I/O, no clock, no Supabase. Every function here is a total function
 * of its arguments so the routing rules can be unit tested without a database,
 * and so the same rules can run on the server, in the agent loop, and in the UI
 * without three copies drifting apart.
 *
 * WHY THIS EXISTS. Until 2026-08-01 there was no station model in this repo at
 * all: no `advanceStation`, no `nextStation`, nothing. A station transition was
 * a client-side `useNavigate` call, which means the product could not answer
 * "where is this work, and where does it go next" except by looking at which
 * page a human happened to be on. The spine strip's unit is a MISSION, and
 * missions only exist once work reaches Build, so the first four stations had no
 * run-level representation whatsoever.
 *
 * THE FOUNDER'S ASK, AND THE ARGUMENT AGAINST TAKING IT LITERALLY.
 * The ask (2026-08-01) was to pick the stations up front: "I'll select the two,
 * three, and five, and seven." The requirement behind it is right and
 * underserved: work does NOT always need all seven, and an existing product
 * getting one feature must be able to enter at Plan or Design rather than being
 * marched through discovery for a problem that is already settled.
 *
 * Selecting the set up front is the wrong mechanism for it, for two reasons:
 *
 *   1. It asks a human for a routing decision at the moment they know least,
 *      before the work has started. That is the same defect as an approvals
 *      queue, which the governance canon already rejects: the gate is the
 *      exception, not the loop.
 *   2. Reality invalidates it. "Backend only, so skip Design" is frequently
 *      wrong; you discover a user-visible surface halfway through Build. A
 *      checklist ticked on Monday cannot reopen itself on Thursday.
 *
 * SO STATIONS ARE NOT SKIPPED, THEY ARE WAIVED. Every waiver carries a reason
 * and a `reopensWhen` condition. The MODEL honours the founder's literal ask —
 * a human waiver is recorded as exactly that (`by: "human"`,
 * `reopensWhen: "never"`) rather than being flattened into a policy rule — but
 * only the waive half of that override has a working door. See the next
 * paragraph before relying on the other half.
 *
 * HALF OF THAT IS BUILT AND HALF IS NOT, and this paragraph has now been wrong
 * twice. It first read "a waiver CAN EXPIRE ... a condition that brings the
 * station back", and nothing brought one back. The 2026-08-06 correction then
 * asserted that `setStationWaiver` "lets a PERSON reopen a station whenever they
 * decide the waiver stopped being true", and that is not true either. What
 * follows was checked symbol by symbol on 2026-08-06 and is what the code does:
 *
 *   BUILT: the reason and the condition are recorded on every waiver; `waive`
 *   and `reopen` below are total pure functions with unit tests
 *   (./route.test.ts); and the route is honoured end to end by `nextStation`.
 *
 *   NOT BUILT: NOTHING BRINGS A WAIVED STATION BACK — not on a trigger, and not
 *   by hand either. Two independent gaps, both verified rather than assumed:
 *
 *     - NO EVALUATOR. Nothing reads `reopensWhen`. `applyTrigger` below is the
 *       function that would, and it has no production caller: the loop never
 *       derives a trigger from what a station filed.
 *
 *     - NO DOOR FOR A PERSON. `setStationWaiver` (./track.functions.ts:427) is
 *       the only server function that would un-waive a station, and a repo-wide
 *       grep finds no caller of it whatsoever: no UI, no route, no test. (The
 *       control grep is `attachToTrack`, which this repo already documents as
 *       caller-less; it returns the same shape, so the zero is real and not a
 *       search that missed.) And a caller alone would not be enough: that
 *       handler hard-codes `reopensWhen: "never"` on every human waiver it
 *       writes (:463) and then calls `reopen` with NO `force` on its un-waive
 *       branch (:465), which `reopen` refuses at :364 below. It would go on to
 *       write the unchanged path and waived list and return `problems: []` —
 *       a no-op reported as a success.
 *
 *   So a waiver is a one-way door today, and `reopensWhen` is a stated intention
 *   a reader can audit rather than a rule the system enforces. Closing it takes
 *   two changes, neither of them in this file: `{ force: true }` on
 *   setStationWaiver's un-waive branch, and a surface that calls it.
 *
 * The ambition stands and the reason for it is unchanged: a route that corrects
 * itself is an operating system and a checklist is a workflow tool, and the
 * second one is absorbable by any vendor next quarter. What is written above is
 * where the line currently falls.
 *
 * THE ORIGIN RULE, which is the part nobody asked for and the record needs.
 * Work entering below Discover has no evidence behind it, because evidence is
 * what Discover produces. If that is allowed silently then Learn has nothing to
 * grade the outcome against, and the compounding record develops a hole exactly
 * where most real work happens: existing products. So an entry below `sense`
 * REQUIRES a stated origin, which becomes the thing later stations cite and
 * Learn measures against. `validateRoute` enforces it.
 */

import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/** Who took a station off the path. Kept apart because they carry different
 *  authority: a policy waiver is a rule the workspace set once and can be
 *  argued with, a human waiver is a specific call on a specific piece of work,
 *  and an agent waiver is a proposal that must be able to be overturned. */
export type WaiverSource = "policy" | "human" | "agent";

/**
 * What would bring a waived station back onto the path.
 *
 * A closed vocabulary rather than free text, because these are meant to be
 * evaluated by machine — `applyTrigger` is the evaluator and it has no caller.
 * That does NOT leave a manual path standing in its place: the person's door,
 * `setStationWaiver`, is itself uncalled and passes no `force`, so no reopen
 * happens by any route today. The module header has the verification.
 * (Corrected twice: this first implied the evaluation happened, then said every
 * reopen was a person's.)
 *
 * `never` is the value a human waiver is written with, and it is the one value
 * that stays true under a future wiring: a person said no and meant it, and
 * `reopen` refuses it without `force`.
 */
export type ReopenTrigger =
  | "touches-interface" // the work turns out to change something a user sees
  | "touches-schema" // the work turns out to change stored data
  | "customer-visible" // the change reaches customers
  | "outcome-contested" // someone disputes whether it worked
  | "never";

export type StationWaiver = {
  station: AgentStation;
  /** Plain words, shown to a person. Never a mechanism word. */
  reason: string;
  by: WaiverSource;
  reopensWhen: ReopenTrigger;
};

export type SpineRoute = {
  /** Where the work entered the loop. Not always `sense`. */
  entry: AgentStation;
  /** The stations still to visit or already visited, in spine order. */
  path: AgentStation[];
  waived: StationWaiver[];
  /**
   * Why this work exists, when it did not come from Discover. Required for any
   * entry below `sense`; see the origin rule in the module header.
   */
  origin: string | null;
};

const ORDER_INDEX: Record<AgentStation, number> = AGENT_STATION_ORDER.reduce(
  (acc, s, i) => {
    acc[s] = i;
    return acc;
  },
  {} as Record<AgentStation, number>,
);

/** Spine order, always. A path is a subset of the spine, never a reordering of
 *  it: Build before Plan is not a route, it is a bug. */
export function inSpineOrder(stations: AgentStation[]): AgentStation[] {
  return [...stations].sort((a, b) => ORDER_INDEX[a] - ORDER_INDEX[b]);
}

/** Every station, the default for genuinely new work. */
export function fullRoute(): SpineRoute {
  return { entry: "sense", path: [...AGENT_STATION_ORDER], waived: [], origin: null };
}

/**
 * The named shapes work actually takes.
 *
 * Deliberately few. Five shapes that each describe a real, common piece of
 * product work beat twenty that describe a taxonomy nobody recognises, and
 * every waiver below states a reason a person would accept out loud.
 *
 * `learn` is on every single one of them, and that is the one non-negotiable.
 * A change that ships and is never graded is how a company stops learning,
 * which is the whole thing this product claims to fix.
 */
export type WorkShape =
  "new-capability" | "existing-feature" | "interface-change" | "under-the-hood" | "incident-fix";

export const WORK_SHAPE_LABEL: Record<WorkShape, string> = {
  "new-capability": "Something we have not built before",
  "existing-feature": "A feature on a product we already run",
  "interface-change": "A change to something people see",
  "under-the-hood": "A change nobody sees directly",
  "incident-fix": "Something is broken now",
};

type ShapeSpec = {
  entry: AgentStation;
  waive: { station: AgentStation; reason: string; reopensWhen: ReopenTrigger }[];
};

const SHAPES: Record<WorkShape, ShapeSpec> = {
  // The full loop. Nothing is waived, because nothing is known yet.
  "new-capability": { entry: "sense", waive: [] },

  // The common case for any real customer: the product exists, the problem is
  // settled, and forcing it through discovery would be theatre. It still needs
  // a spec, because a feature with no written intent cannot be graded later.
  "existing-feature": {
    /*
     * ENTERS AT DECIDE, AND DECIDE IS NO LONGER WAIVED (REQ-2, 2026-08-25).
     *
     * THE MOAT IS THE FORECAST CAPTURED AT DECISION TIME, and the forecast is
     * written by `decision.record`, which refuses a decision that has none. So a
     * route that waives Decide is a route that structurally CANNOT capture the
     * one thing this product claims as its moat. Four of the five shapes waived
     * it, which left the moat reachable from one card in five.
     *
     * A contradiction between the route model and the positioning canon is not a
     * preference to be balanced. One of them is wrong, and it is the route model.
     *
     * THE ENTRY HAD TO MOVE WITH THE WAIVER, and dropping the waiver alone would
     * have done nothing at all. `validateRoute` requires the entry to be ON the
     * path; it does NOT require it to be FIRST. Un-waiving Decide while entering
     * at Plan gives `path: [decide, define, ...]` with the track starting at
     * `define` -- and `nextStation` only ever looks forward, so Decide would sit
     * behind the entry and never run, except as a correction target, which is the
     * opposite of capturing a forecast up front.
     *
     * WHAT DECIDE IS FOR HERE, since the old waiver reason was not wrong: the
     * call to build it really is already made. The station's job on this shape is
     * not to re-litigate that. It is to say what we expect this to do and when we
     * will know -- which is the forecast, and the only station that writes one.
     */
    entry: "decide",
    waive: [
      {
        station: "sense",
        reason: "The problem is already known, so there is nothing to discover",
        reopensWhen: "outcome-contested",
      },
    ],
  },

  // Design leads. There is no new problem and no new spec, there is a surface
  // that should be better.
  /*
   * DECIDE STAYS WAIVED HERE, AND IT IS THE ONE SHAPE THAT CANNOT TAKE REQ-2.
   *
   * REQ-2 asked for Decide on all three shapes that waive it, and the argument
   * is right in general. This shape is the exception, and the reason is a
   * handoff rather than a preference.
   *
   * `define` is waived here, so with Decide on the path the route would be
   * `[decide, design, build, ship, learn]` and the first handoff would be Decide
   * to Design. `STATION_NEEDS.design` wants a **prd**, from Plan. Decide files a
   * **decision**. So every `interface-change` track would file a perfectly good
   * decision, fail `needIsMet` at the very next step, hold `nothing-to-hand-on`
   * three times, and then escalate `needs-a-waived-station` because the station
   * that files the missing spec is waived off its own route. **It would break
   * this shape outright rather than improve it.**
   *
   * The only way to give this shape a forecast is to un-waive Plan as well,
   * which contradicts that waiver's own reason ("the change is small enough to
   * describe in the design itself") and turns the shortest route in the product
   * into a six-station one. That is a bigger call than REQ-2 asked for, so it is
   * not being made in passing.
   */
  "interface-change": {
    entry: "design",
    waive: [
      {
        station: "sense",
        reason: "The problem is already known, so there is nothing to discover",
        reopensWhen: "outcome-contested",
      },
      {
        station: "decide",
        reason: "The call to change it is already made",
        reopensWhen: "outcome-contested",
      },
      {
        station: "define",
        reason: "The change is small enough to describe in the design itself",
        reopensWhen: "touches-schema",
      },
    ],
  },

  // The one that most needs a reopen condition rather than a skip. "No user
  // sees this" is a claim about the work, and the claim is often wrong.
  //
  // The condition below SAYS it reopens when the work touches an interface. It
  // does not, and nothing else does it either. Nothing evaluates `reopensWhen`
  // (`applyTrigger` has no caller), and there is no manual fallback to lean on:
  // `setStationWaiver` is the only function that could put Design back on this
  // route and it has no caller and passes no `force`. See the module header.
  //
  // So on today's code, a track that waives Design and then turns out to change
  // a screen builds that screen with no design station and no way to add one.
  // This records the intention; that is the whole of what it does.
  // (Corrected twice: this first asserted the reopen happened, then asserted a
  // person could do it by hand.)
  "under-the-hood": {
    // Decide un-waived and the entry moved with it, for the reason given on
    // `existing-feature` above: the forecast is written at Decide and nowhere
    // else. Invisible work is if anything MORE in need of a stated expectation,
    // because nobody will see it and disagree.
    entry: "decide",
    waive: [
      {
        station: "sense",
        reason: "The problem is already known",
        reopensWhen: "outcome-contested",
      },
      {
        station: "design",
        reason: "Nothing a user sees changes",
        reopensWhen: "touches-interface",
      },
    ],
  },

  // Speed matters and the loop must not be the reason a fix waits. It still
  // ships and it is still graded; what it skips is the part that decides
  // WHETHER to do it, because that is already answered by it being broken.
  "incident-fix": {
    entry: "build",
    waive: [
      { station: "sense", reason: "The problem is in front of us", reopensWhen: "never" },
      { station: "decide", reason: "A break does not need a business case", reopensWhen: "never" },
      { station: "define", reason: "The fix is the spec", reopensWhen: "touches-schema" },
      {
        station: "design",
        reason: "Nothing a user sees changes",
        reopensWhen: "touches-interface",
      },
    ],
  },
};

/**
 * Propose a route from the shape of the work.
 *
 * A PROPOSAL, not a decision. Everything it waives carries a reason and a way
 * back, and a human can waive or reopen anything afterwards. `origin` is passed
 * in rather than invented because only the person or agent starting the work
 * knows why it exists, and the route is invalid without it below `sense`.
 */
export function suggestRoute(shape: WorkShape, origin: string | null = null): SpineRoute {
  const spec = SHAPES[shape];
  const waivedSet = new Set(spec.waive.map((w) => w.station));
  return {
    entry: spec.entry,
    path: AGENT_STATION_ORDER.filter((s) => !waivedSet.has(s)),
    waived: spec.waive.map((w) => ({ ...w, by: "policy" as const })),
    origin,
  };
}

/** Is this station off the path, and why. */
export function waiverFor(route: SpineRoute, station: AgentStation): StationWaiver | null {
  return route.waived.find((w) => w.station === station) ?? null;
}

/**
 * The handoff target: the next station ON THIS ROUTE, not the next one on the
 * spine. This is the whole point of the module. Returns null at the end of the
 * route, which is a real answer and not a missing one.
 */
export function nextStation(route: SpineRoute, current: AgentStation): AgentStation | null {
  const i = ORDER_INDEX[current];
  return route.path.find((s) => ORDER_INDEX[s] > i) ?? null;
}

/** The station this work came from on this route, or null at the entry. */
export function previousStation(route: SpineRoute, current: AgentStation): AgentStation | null {
  const i = ORDER_INDEX[current];
  const before = route.path.filter((s) => ORDER_INDEX[s] < i);
  return before.length ? before[before.length - 1] : null;
}

/** Take a station off the path, with a reason. Returns a new route. */
export function waive(
  route: SpineRoute,
  station: AgentStation,
  waiver: { reason: string; by: WaiverSource; reopensWhen: ReopenTrigger },
): SpineRoute {
  if (waiverFor(route, station)) return route;
  return {
    ...route,
    path: route.path.filter((s) => s !== station),
    waived: [...route.waived, { station, ...waiver }],
  };
}

/**
 * Put a waived station back on the path, in spine order.
 *
 * This is the function that makes the difference between a route and a
 * checklist, so it is deliberately permissive about WHEN it can be called: a
 * station can reopen after the work has already passed its position, because
 * that is exactly the case that matters (Build discovers an interface change,
 * so Design reopens behind it). Ordering the path by the spine rather than by
 * arrival keeps the reopened station where a reader expects to find it.
 *
 * A `never` waiver is the one thing it will not override on its own; that takes
 * an explicit human reopen, which is what `force` is for.
 *
 * THE PURE HALF OF A DOOR NOBODY OPENS, stated here so a reader does not infer
 * a working feature from a working function. Its only non-test callers are
 * `applyTrigger` below, which has no caller, and `setStationWaiver`
 * (./track.functions.ts:465), which has no caller either and passes no `force`
 * — so `force` is exercised by ./route.test.ts:135 and by nothing in
 * production. This function is ready; the route back is not built.
 */
export function reopen(
  route: SpineRoute,
  station: AgentStation,
  opts: { force?: boolean } = {},
): SpineRoute {
  const w = waiverFor(route, station);
  if (!w) return route;
  if (w.reopensWhen === "never" && !opts.force) return route;
  return {
    ...route,
    path: inSpineOrder([...route.path, station]),
    waived: route.waived.filter((x) => x.station !== station),
  };
}

/**
 * Every station a trigger brings back, applied at once.
 *
 * NOT WIRED. NOTHING CALLS THIS IN PRODUCTION — corrected 2026-08-06, when the
 * text here still read "the agent calls this when it learns something about the
 * work ... reopening is automatic". No agent calls it and nothing is automatic:
 * `driveTrackOnce` never derives a `ReopenTrigger` from what a station filed.
 *
 * AND THERE IS NO HUMAN REOPEN TO FALL BACK ON, which the first correction to
 * this block got wrong. It said "the only reopen that ever happens is the human
 * one through `setStationWaiver`"; `setStationWaiver` has no caller anywhere in
 * the repo and its un-waive branch passes no `force`, so on today's code NO
 * reopen happens by any route at all. The module header carries the checks.
 *
 * The function itself is correct and unit-tested (./route.test.ts); it has no
 * door.
 *
 * WHY IT WAS LEFT UNWIRED RATHER THAN CONNECTED, decided 2026-08-06. The
 * mechanism it needs does not exist yet, and connecting it would trade a missing
 * capability for a false claim, which is the worse of the two:
 *
 *   1. THE ROUTE WOULD GAIN A STATION NOBODY VISITS. `nextStation` only ever
 *      returns a station LATER on the path, so reopening Design while the track
 *      sits at Build puts Design on the path where the driver will never select
 *      it. The route would then advertise a station the work sails past — and
 *      the founder's ruling is precisely that a supported skip must not be
 *      reported as unfinished work.
 *   2. GOING BACK IS THE CORRECTION LOOP'S JOB, and it is driven by holds, not
 *      by triggers: a backward move IS a correction (./correction.server.ts) and
 *      is charged against a bounded correction budget meant for stations that
 *      failed. A trigger-driven reopen would spend that budget on work that did
 *      not fail.
 *   3. THE TRIGGERS CANNOT BE DERIVED FROM WHAT THE DRIVER HAS. An `Attachment`
 *      carries an artifact kind, an id and a station — no file paths — so
 *      "touches-interface" and "touches-schema" would need new reads and a
 *      path-shape guess, and a wrong guess reopens a station on work that never
 *      needed it.
 *
 * So this stays a pure function with a test and no caller until the loop can go
 * backwards for a reason other than failure. Wiring it is a build, not a fix.
 */
export function applyTrigger(route: SpineRoute, trigger: ReopenTrigger): SpineRoute {
  if (trigger === "never") return route;
  return route.waived
    .filter((w) => w.reopensWhen === trigger)
    .reduce((acc, w) => reopen(acc, w.station), route);
}

export type RouteProblem = { code: string; message: string };

/**
 * The invariants. A route that fails any of these is not a strict route, it is
 * a bug that will strand work somewhere no station owns.
 */
export function validateRoute(route: SpineRoute): RouteProblem[] {
  const problems: RouteProblem[] = [];

  if (route.path.length === 0) {
    problems.push({ code: "empty-path", message: "A route has to visit at least one station." });
  }

  const ordered = inSpineOrder(route.path);
  if (ordered.join(",") !== route.path.join(",")) {
    problems.push({
      code: "out-of-order",
      message: "The path runs backwards through the spine.",
    });
  }

  if (new Set(route.path).size !== route.path.length) {
    problems.push({ code: "duplicate-station", message: "A station appears twice on the path." });
  }

  for (const w of route.waived) {
    if (route.path.includes(w.station)) {
      problems.push({
        code: "waived-and-on-path",
        message: `${w.station} is both waived and on the path.`,
      });
    }
    if (!w.reason.trim()) {
      problems.push({
        code: "waiver-without-reason",
        message: `${w.station} was taken off the path with no reason given.`,
      });
    }
  }

  if (!route.path.includes("learn") && !waiverFor(route, "learn")) {
    problems.push({
      code: "learn-missing",
      message: "Learn is neither on the path nor waived, so nothing will grade this.",
    });
  }

  // THE ORIGIN RULE. Work that skipped Discover has no evidence behind it, so
  // it must say why it exists or Learn has nothing to measure against later.
  if (route.entry !== "sense" && !route.origin?.trim()) {
    problems.push({
      code: "origin-required",
      message: "Work that starts below Discover has to say where it came from.",
    });
  }

  if (!route.path.includes(route.entry) && !waiverFor(route, route.entry)) {
    problems.push({
      code: "entry-off-path",
      message: "The entry station is not on the path.",
    });
  }

  return problems;
}

/**
 * The route in plain words, for a person.
 *
 * Voice rule: report, never greet, and never name a mechanism. "Design is
 * waived because nothing a user sees changes" is readable; "3 stations
 * excluded per policy" is an internal log entry wearing a sentence.
 */
export function describeRoute(route: SpineRoute): string {
  // The station's NAME, never its id. This sentence is read by a person, and it
  // used to interpolate the raw ids straight out of the row, so the Plan receipt
  // said "starting at define. Waived: sense, decide." while the rail directly
  // above it said Plan, Discover and Decide. Three internal slugs in one
  // sentence, on the surface where work is started.
  const label = (s: AgentStation) => AGENT_STATIONS[s]?.name ?? s;
  const names = route.path.length;
  if (route.waived.length === 0) return `All seven stations, starting at ${label(route.entry)}.`;
  const skipped = route.waived.map((w) => label(w.station)).join(", ");
  return `${names} station${names === 1 ? "" : "s"}, starting at ${label(route.entry)}. Waived: ${skipped}.`;
}
