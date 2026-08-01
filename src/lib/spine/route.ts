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
 * SO STATIONS ARE NOT SKIPPED, THEY ARE WAIVED, AND A WAIVER CAN EXPIRE. Every
 * waiver carries a reason and a condition that brings the station back. A human
 * may still waive by hand and that is honoured exactly (`by: "human"`,
 * `reopensWhen: "never"`), so the founder's literal ask survives as a manual
 * override. It is simply not the primary mechanism, because a route that
 * corrects itself is an operating system and a checklist is a workflow tool,
 * and the second one is absorbable by any vendor next quarter.
 *
 * THE ORIGIN RULE, which is the part nobody asked for and the record needs.
 * Work entering below Discover has no evidence behind it, because evidence is
 * what Discover produces. If that is allowed silently then Learn has nothing to
 * grade the outcome against, and the compounding record develops a hole exactly
 * where most real work happens: existing products. So an entry below `sense`
 * REQUIRES a stated origin, which becomes the thing later stations cite and
 * Learn measures against. `validateRoute` enforces it.
 */

import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/** Who took a station off the path. Kept apart because they carry different
 *  authority: a policy waiver is a rule the workspace set once and can be
 *  argued with, a human waiver is a specific call on a specific piece of work,
 *  and an agent waiver is a proposal that must be able to be overturned. */
export type WaiverSource = "policy" | "human" | "agent";

/**
 * What would bring a waived station back onto the path.
 *
 * A closed vocabulary rather than free text, because these have to be evaluated
 * by machine. `never` is the manual override: a person said no and meant it, and
 * nothing reopens it without another person.
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
    entry: "define",
    waive: [
      {
        station: "sense",
        reason: "The problem is already known, so there is nothing to discover",
        reopensWhen: "outcome-contested",
      },
      {
        station: "decide",
        reason: "The call to build it is already made",
        reopensWhen: "outcome-contested",
      },
    ],
  },

  // Design leads. There is no new problem and no new spec, there is a surface
  // that should be better.
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
  // sees this" is a claim about the work, and the claim is often wrong: it
  // reopens the moment Build touches an interface.
  "under-the-hood": {
    entry: "define",
    waive: [
      {
        station: "sense",
        reason: "The problem is already known",
        reopensWhen: "outcome-contested",
      },
      { station: "decide", reason: "The call is already made", reopensWhen: "outcome-contested" },
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
 * The agent calls this when it learns something about the work: it touched a
 * component, it changed a table, it reached customers. Reopening is automatic
 * because the whole argument for waiving over skipping is that the system
 * notices when the waiver stopped being true.
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
  const names = route.path.length;
  if (route.waived.length === 0) return `All seven stations, starting at ${route.entry}.`;
  const skipped = route.waived.map((w) => w.station).join(", ");
  return `${names} station${names === 1 ? "" : "s"}, starting at ${route.entry}. Waived: ${skipped}.`;
}
