import { suggestRoute, type SpineRoute, type WorkShape } from "@/lib/spine/route";
import { stationCrew, type CrewRole } from "@/lib/spine/driver";
import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  agentDisplayName,
  type AgentStation,
} from "@/lib/agent-vocabulary";

/**
 * WHERE A SPOKEN INTENT ENTERS THE SEVEN STATIONS.
 *
 * THE GAP THIS FILLS, and it is a smaller one than it sounds. A read-only study
 * of the codebase found that a conversational front door is a ROUTING problem
 * rather than a rebuild, and then named the two lines the conclusion was
 * standing on: `startTrackCore` has two production callers and `api/chat.ts` is
 * not one of them, and the classifier's parse emits no station, so there is no
 * key to look up in a routing table that is otherwise fully built.
 *
 * Everything else exists. `WorkShape` is a closed union of five. `suggestRoute`
 * already turns a shape into an entry station, a path and its policy waivers.
 * `AGENT_STATION_ORDER` is the seven. `stationCrew` already resolves a station
 * to the ordered seats that serve it. This module is the missing composition,
 * and it is deliberately nothing more than that.
 *
 * PURE, AND UNCALLED ON PURPOSE. Nothing imports it yet. It ships ahead of the
 * classifier change and the `startTrackCore` call because those touch a live
 * response path on a Workers isolate and this does not, so the piece that can
 * be reasoned about and tested in isolation gets settled first and the risky
 * piece arrives with its logic already proven.
 *
 * NO MODEL CALL, NO NETWORK, NO CLOCK. Given the same intent it returns the
 * same route forever, which is what lets a test pin it and what lets the pane
 * show a person where their words are about to go BEFORE they press anything.
 */

export type RoutedIntent = {
  /** Where the work enters the loop. */
  station: AgentStation;
  /** What a person reads: "Decide", "Plan", never the internal id. */
  stationName: string;
  /** The full route, including which stations policy waives and why. */
  route: SpineRoute;
  /** The seats that serve the entry station, in order. */
  crew: CrewRole[];
};

/**
 * The station a shape enters at, its route, and who picks it up.
 *
 * `origin` is passed straight through to `suggestRoute`, which needs it for the
 * ORIGIN RULE: work entering below Discover has no evidence behind it, so Learn
 * would have nothing to grade against, and a route without a stated origin is
 * refused. That rule is the reason this returns `suggestRoute`'s own object
 * rather than a reduced one; dropping the waivers would drop the reasons.
 */
export function routeIntent(input: {
  shape: WorkShape;
  origin?: string | null;
  /**
   * A station the classifier named explicitly, when it did. It OVERRIDES the
   * shape's default entry, because a person who says "design the checkout" has
   * told us where to start more directly than any inference from shape. It
   * cannot invent a station: an unknown id falls back to the shape's entry
   * rather than throwing, so a model returning something new degrades to the
   * old behaviour instead of failing the send.
   */
  station?: string | null;
}): RoutedIntent {
  const route = suggestRoute(input.shape, input.origin ?? null);
  const named = asStation(input.station);
  const station = named ?? route.entry;
  return {
    station,
    stationName: AGENT_STATIONS[station].name,
    route,
    crew: stationCrew(station),
  };
}

/** A station id the seven actually contain, or null. Never throws. */
export function asStation(value: unknown): AgentStation | null {
  if (typeof value !== "string") return null;
  return (AGENT_STATION_ORDER as readonly string[]).includes(value)
    ? (value as AgentStation)
    : null;
}

/**
 * The one sentence the pane can show before anything is dispatched.
 *
 * Deliberately says the STATION and the SEAT rather than a promise about the
 * outcome: "Plan picks this up, with Scribe on it" is checkable the moment the
 * run starts, and "we will build this for you" is not. The product does not
 * claim work it has not done.
 */
export function describeRoutedIntent(routed: RoutedIntent): string {
  const lead = routed.crew[0];
  if (!lead) return `${routed.stationName} picks this up.`;

  // `CrewRole` carries the DB slug, never a display name: the rename-disclaimer
  // rule keeps slugs stable forever and puts the reading of them in one place.
  const seat = agentDisplayName(lead.slug, null);

  /**
   * A STATION AND ITS LEAD SEAT SOMETIMES SHARE A NAME, and the naive sentence
   * says it twice. Found by printing all five shapes rather than trusting the
   * template: an interface change produced "Design picks this up, with Design
   * on it." Two facts collapsing into one word reads as a bug to anyone who
   * notices, and as noise to anyone who does not.
   *
   * The station is the part that carries information here (it is where the work
   * enters, and it is what the person can go and look at), so the seat clause
   * is what gives way.
   */
  if (seat.toLowerCase() === routed.stationName.toLowerCase()) {
    return `${routed.stationName} picks this up.`;
  }
  return `${routed.stationName} picks this up, with ${seat} on it.`;
}
