import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";

import type { RunMapStation } from "@/components/meridian/RunMap";
import type { StepMeterStep } from "@/components/meridian/progress";

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
): { stops: RunMapStation[]; meter: StepMeterStep[]; index: number; total: number } {
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
      stops.push({ station, state: "done" });
      meter.push({ key: station, label: name, state: "done" });
      return;
    }
    if (here >= 0 && i === here) {
      if (!open) {
        stops.push({ station, state: "done" });
        meter.push({ key: station, label: name, state: "done" });
        return;
      }
      if (walking) {
        stops.push({ station, state: "active" });
        meter.push({ key: station, label: name, state: "working" });
        return;
      }
      if (tone === "you") {
        stops.push({ station, state: "needs-approval", hold: track.holdReason });
        meter.push({ key: station, label: name, state: "waiting" });
        return;
      }
      if (tone === "hold") {
        stops.push({ station, state: "held", hold: track.holdReason });
        meter.push({ key: station, label: name, state: "held" });
        return;
      }
      /* Standing here, and nothing is moving it. NOT `active`: there is no
         agent inside this station, and saying there is would be the one claim
         this surface must never make about itself. */
      stops.push({ station, state: "here" });
      meter.push({ key: station, label: name, state: "here" });
      return;
    }
    stops.push({ station, state: "pending" });
    meter.push({ key: station, label: name, state: "ahead" });
  });

  return { stops, meter, index: here >= 0 ? here + 1 : 0, total: shown.length };
}
