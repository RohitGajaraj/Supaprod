/**
 * ── THE LIFECYCLE, AND WHERE THE WORK IS ON IT (P-74) ────────────────────
 *
 * FOUNDER, 04:09: a person in a run needs to see the lifecycle and where the
 * work is on it. Read live on the tablet track, the seven names appear only as
 * transcript labels and Ship and Learn not at all.
 *
 * This turns the record the run screen already holds into one row per station
 * with one sentence: what that station DID, not what it is for. "Found 3
 * things" and "Discover" are different claims, and only the first tells a
 * person whether to keep reading.
 *
 * ── DERIVED, NEVER INVENTED ──────────────────────────────────────────────
 *
 * Every sentence comes from a row: the artifacts filed at that stop, its hold,
 * its waiver. A station with nothing on the record gets NO sentence rather than
 * a plausible one -- the map says where the work is and stays silent about what
 * it cannot see, which is the whole difference between a map and a decoration.
 *
 * ── IT IS NOT NAVIGATION (R-01) ──────────────────────────────────────────
 *
 * The seven stations are the route the work takes, not places a person goes.
 * Nothing here carries a destination; at most a row scrolls the transcript to
 * the turn it describes.
 */
import type { AgentStation } from "@/lib/agent-vocabulary";
import type { PlanStepState } from "@/components/meridian/PlanCard";
import type { RunMapStation } from "@/components/meridian/RunMap";

/** The shape the run screen already has from `getTrackArtifacts`. */
export type StopLike = {
  station: AgentStation;
  state: "passed" | "here" | "not-reached" | "waived";
  waivedReason: string | null;
  hold: string | null;
  holdReason: string | null;
  everDriven: boolean;
  items: ReadonlyArray<{ kind?: string | null; title?: string | null; fields?: unknown }>;
};

/** `StopState` in the map's own vocabulary. Live only where the work IS. */
export function stateFor(stop: StopLike): PlanStepState {
  if (stop.state === "waived") return "skipped";
  if (stop.state === "passed") return "done";
  if (stop.state === "not-reached") return "pending";
  /* `here` and held reads as held; `here` and moving reads as active. A station
     standing on a hold is not working, and drawing it live would be the spinner
     this product refuses. */
  return stop.hold ? "held" : "active";
}

/** How many of one kind this stop filed. */
function count(stop: StopLike, kind: string): number {
  return stop.items.filter((i) => i.kind === kind).length;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * What this station did, in one sentence, or null when the record says nothing.
 *
 * The per-station shapes are written out rather than generated because each
 * station's evidence is a different noun, and a generic "filed 2 artifacts"
 * would be true of all seven and useful about none.
 */
export function didLine(stop: StopLike): string | null {
  if (stop.state === "waived") {
    return stop.waivedReason ? `Waived: ${stop.waivedReason}` : "Waived.";
  }

  /*
   * THE HOLD SPEAKS FIRST WHERE THE WORK IS STANDING. A station stopped on
   * something is not described by what it filed before stopping, and the hold
   * is the thing a person can act on.
   */
  if (stop.state === "here" && stop.holdReason) return stop.holdReason;

  switch (stop.station) {
    case "sense": {
      const n = count(stop, "signal");
      if (n > 0) return `Found ${plural(n, "thing", "things")}.`;
      /* R-36: nothing found is not nothing done. The carry IS the finding. */
      return stop.everDriven ? "Searched and found nothing; carried on your sentence." : null;
    }
    case "decide": {
      const n = count(stop, "decision");
      return n > 0 ? "The call is on the record." : null;
    }
    case "define": {
      const n = count(stop, "prd");
      return n > 0 ? "Spec written." : null;
    }
    case "design": {
      const n = count(stop, "prototype");
      return n > 0 ? `${plural(n, "drawing", "drawings")} filed.` : null;
    }
    case "build": {
      const n = count(stop, "mission") + count(stop, "changeset");
      return n > 0 ? "A change was made." : null;
    }
    case "ship": {
      const n = count(stop, "deployment");
      return n > 0 ? "Released." : null;
    }
    case "learn": {
      const n = count(stop, "learning");
      return n > 0 ? "Graded." : null;
    }
    default:
      return null;
  }
}

/**
 * The run's stations, as the map draws them.
 *
 * `outcome` is left undefined rather than set to an empty string when there is
 * nothing to say: the map renders a station with no outcome as a name and a
 * state, which is exactly the honest reading of a station that has not run.
 */
export function stationsForMap(stops: readonly StopLike[]): RunMapStation[] {
  return stops.map((stop) => {
    const said = didLine(stop);
    return {
      station: stop.station,
      state: stateFor(stop),
      ...(said ? { outcome: said } : {}),
      hold: stop.hold,
      ...(stop.state === "waived" && stop.waivedReason ? { waivedReason: stop.waivedReason } : {}),
    };
  });
}
