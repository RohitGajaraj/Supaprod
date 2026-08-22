import * as React from "react";

import { PlanGate, type PlanGateDecision } from "@/components/meridian/PlanGate";
import type { PlanStep } from "@/components/meridian/PlanCard";
import type { RunMapStation } from "@/components/meridian/RunMap";
import { GLYPH_FOR_STATION } from "@/components/meridian/station-glyphs";
import { routeIntent, type RoutedIntent } from "@/lib/ask/route-intent";
import { inSpineOrder } from "@/lib/spine/route";
import type { PlanProposal } from "@/lib/ask/plan-proposal";
import { AGENT_STATIONS, agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * THE PROPOSAL, DRAWN AS A PLAN A PERSON CAN ANSWER.
 *
 * `PlanGate` is mounted, not rebuilt. It already carries the whole interaction —
 * three answers, one keystroke each, no accent on any of them, a reason field on
 * the one that sends work back, the spend ceiling above the answers, and its own
 * refusal to draw a gate about an empty plan. What was missing was the thing in
 * front of it: nothing turned a real route into the steps it renders. This is
 * that adapter and nothing else.
 *
 * ── EVERY STEP COMES FROM THE ROUTE. THERE IS NO SECOND SOURCE ───────────
 *
 * This repo deleted a component for advancing a timer through a list of step
 * labels and called it theatre by its own definition, and the guard that killed
 * it is a build-failing test. The same rule binds harder here, because a
 * fabricated step at a gate is not decoration — it is a thing a person weighed
 * before deciding how much money could be spent without asking them again.
 *
 * So: the steps are `routed.crew`, which is `stationCrew(station)` — the seats
 * the spine actually assigns to the entry station — and each label is that
 * seat's own `job` string from the driver's catalogue, the same words the agent
 * is briefed with. The stops are the stations of `routed.route` — the ones the
 * work will visit drawn as pending, the ones policy already took off it drawn as
 * waived and carrying the waiver's own reason. Nothing here composes a sentence,
 * and there is no fallback list to fall back to.
 *
 * ── WHEN THE ROUTE IS NOT KNOWN ─────────────────────────────────────────
 *
 * `routeIntent` cannot fail — it is total over the five shapes — so the only way
 * to arrive here without a plan is a station or a shape this build does not
 * know, which `parsePlanProposal` already refuses on the wire. If a crew comes
 * back empty anyway (a station with no active cast seat is a real state:
 * `stationCrew` filters on tier, status and conductor), `PlanGate` draws its own
 * no-plan card and offers NO answers. That is the honest degrade and it is
 * deliberately not softened: there is nothing to decide about, so the gate says
 * so rather than asking for a click about five plausible-looking steps.
 */

/** The steps the gate shows, derived from the route and from nothing else. */
export function stepsForRoute(routed: RoutedIntent): PlanStep[] {
  return routed.crew.map((role) => ({
    id: role.slug,
    /*
     * THE SEAT'S OWN BRIEF, not a sentence about it. `CREW_ROLE[slug].job` is
     * what the agent is literally asked to do, so what a person reads at the
     * gate and what the agent is told are the same words. A summary written here
     * would be a second copy that drifts, and the first thing it would lose is
     * the qualifications that make some of these briefs honest ("say so plainly
     * rather than finding a reason").
     */
    label: role.job,
    /*
     * `pending` is the only truthful state for every one of them. Nothing has
     * run; that is the entire premise of the gate. `PlanCard` has this state and
     * `TaskStatus` does not, which is why the card is the right component here.
     */
    state: "pending",
    agentSlug: role.slug,
    // Drawn, never written. `GLYPH_FOR_STATION` is the one place the database's
    // station ids and Meridian's glyph kinds meet.
    station: GLYPH_FOR_STATION[routed.station],
  }));
}

/**
 * The route the work would take, WITH the stations policy already took off it.
 *
 * ── WHY THE WAIVED ONES ARE DRAWN AT ALL ────────────────────────────────
 *
 * `suggestRoute` returns a `path` that already excludes them and a `waived` list
 * beside it, so the smaller thing to render is the path alone. That would be
 * wrong here, and the reason is what the gate is for. A person deciding how much
 * rope this work gets is deciding partly on how much checking it will pass
 * through, and "Decide was skipped because this is a feature on a product we
 * already run" is exactly the kind of thing they might disagree with. Drawing
 * only the path hides a decision that was already taken on their behalf, at the
 * one moment they can still overturn it — `RunMap` in `editable` mode lets them
 * take more stations off, and hiding the waived ones would make that control
 * look like the only waiving that ever happened.
 *
 * A WAIVED STATION KEEPS ITS REASON, which is a standing ruling: a skipped
 * station is a decision on the record with a reason, not an absence.
 * `suggestRoute` supplies one for every waiver it issues, so there is never a
 * blank to fill in here.
 */
export function stopsForRoute(routed: RoutedIntent): RunMapStation[] {
  const waived = new Map(routed.route.waived.map((w) => [w.station, w.reason]));
  const all = inSpineOrder([...routed.route.path, ...waived.keys()]);
  return all.map((station) => {
    const reason = waived.get(station);
    return reason
      ? { station, state: "skipped" as const, waivedReason: reason }
      : { station, state: "pending" as const };
  });
}

export function AskPlanGate({
  proposal,
  busy = false,
  onDecide,
}: {
  proposal: PlanProposal;
  busy?: boolean;
  onDecide: (decision: PlanGateDecision) => void;
}) {
  /*
   * THE SAME PURE CALL THE SERVER MADE, on the same three values, which is the
   * point of the frame carrying inputs rather than a rendered plan. Memoised on
   * the proposal identity because it is pure: the same proposal can only ever
   * produce the same route, so recomputing it per render would be work with a
   * guaranteed identical answer.
   */
  const routed = React.useMemo(
    () =>
      routeIntent({
        shape: proposal.shape,
        origin: proposal.origin,
        station: proposal.station,
      }),
    [proposal.shape, proposal.origin, proposal.station],
  );

  const steps = React.useMemo(() => stepsForRoute(routed), [routed]);
  const stops = React.useMemo(() => stopsForRoute(routed), [routed]);

  const lead = routed.crew[0];
  const seat = lead ? agentDisplayName(lead.slug, null) : null;
  const stationName = AGENT_STATIONS[routed.station].name;

  return (
    <PlanGate
      /*
       * THE TITLE IS THE ROUTE, SAID IN THE WORDS `route-intent.ts` SCOPES IT
       * TO: "the one sentence the pane can show BEFORE anything is dispatched".
       * That is exactly this position, which is the only place that helper's own
       * comment permits it — used one line after a dispatch it would have been a
       * report of work nobody did, and `api/chat.ts` withdrew it for that.
       *
       * It says the station and the seat rather than a promise about the
       * outcome, because both are checkable the moment the run starts.
       */
      title={
        seat && seat.toLowerCase() !== stationName.toLowerCase()
          ? `${stationName} picks this up, with ${seat} on it`
          : `${stationName} picks this up`
      }
      steps={steps}
      stops={stops}
      spend={{
        label: "Spend ceiling",
        // NOTHING HAS BEEN SPENT, and that is a fact rather than a placeholder:
        // no mission row exists, so no run exists, so no meter has moved.
        spent: 0,
        cap: proposal.spendCapUsd,
        /*
         * NO NOTE ON THE UNCAPPED CASE, because `Spend` already writes that
         * sentence itself and ignores this prop when the cap is null. Passing
         * one would be writing a line nothing renders, which is how a surface
         * comes to carry copy nobody has ever seen.
         */
        note: proposal.spendCapUsd ? "The run halts here rather than asking for more." : undefined,
      }}
      busy={busy}
      onDecide={onDecide}
    />
  );
}

export default AskPlanGate;
