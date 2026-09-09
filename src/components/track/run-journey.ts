/**
 * THE RUN'S ROAD, FILLED FROM ITS OWN ROWS.
 *
 * Meridian's `Journey` draws seven stations as one flow; this decides what
 * each stop says for one run. It is the run screen's only station display,
 * in the header, and it doubles as the selector for the right pane: press a
 * stop and the pane opens what that station made.
 *
 * ── WHAT EACH STOP SAYS, AND WHY ─────────────────────────────────────────
 * The line under a stop is the PRODUCT, not the work: "8 drawings", not "3
 * turns, 2 with failures". `what-each-station-did.ts` learned that the hard
 * way on 2026-09-02 and its `didLine` is the source here, shortened to the
 * width a stop has. Build and Ship say the thing a person would repeat, the
 * PR number and the environment, when the record carries them.
 *
 * ── STATE, FROM THE SAME PREDICATES THE REST OF THE SCREEN READS ────────
 * `holdTone` for whose move it is, `nothingIsComing` for a stop nothing will
 * pick up, `waitingOnTime` for the calendar wait. The stop the work stands at
 * is `working` only while a seat is genuinely live; standing on a hold is not
 * working, and drawing it live would be the spinner this product refuses.
 *
 * Pure. Takes the artifact stops the pane already polls, the track, and the
 * live facts the transcript already lifts.
 */
import type { JourneyStation, JourneyState } from "@/components/meridian/Journey";
import type { StationArtifactView } from "@/lib/spine/track.functions";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";
import { waitingOnTime } from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { parseReview, hasVerdict } from "@/components/track/verdict-reading";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { KIND_WORD } from "@/lib/spine/attach";
import { foldVersions } from "@/components/track/versions-of-one-thing";

type Stop = Pick<
  StationArtifactView,
  "station" | "state" | "waivedReason" | "hold" | "holdReason" | "everDriven" | "items"
>;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function count(stop: Stop, kind: string): number {
  return stop.items.filter((i) => i.kind === kind && !i.missing).length;
}

/**
 * WHEN THE STATION FILED IT, FALLING BACK TO WHEN THE LOOP ATTACHED IT.
 *
 * `createdAt` on an item is `spine_track_members.created_at`, the ATTACHMENT
 * time, and the driver attaches a station's whole output in one write: 1,155
 * of 1,522 members share that timestamp with a sibling of the same kind on the
 * same track, to the microsecond. Sorting by it leaves "the newest drawing"
 * decided by whichever row won a tie, and on `6cc7a010` the two tied drawings
 * were filed 29 seconds apart, one with a file and one with none.
 *
 * `filedAt` is the artifact's own `created_at` and settles it. The fallback is
 * not decoration: an artifact whose row could not be read has no filed time,
 * and the attachment time is then the only ordering fact there is, which is
 * better than dropping the item out of the sort entirely.
 */
function orderedAt(item: { createdAt: string; filedAt?: string | null }): number {
  return Date.parse(item.filedAt ?? item.createdAt);
}

function newest(stop: Stop, kind: string) {
  return stop.items
    .filter((i) => i.kind === kind && !i.missing)
    .sort((a, b) => orderedAt(b) - orderedAt(a))[0];
}

/**
 * `${n} <noun>`, with the noun read from the one vocabulary rather than typed
 * out here.
 *
 * IT USED TO TAKE THE WORDS AS ARGUMENTS, AND THE COMMENT SAW IT COMING. The
 * Design case read "The canon's noun, not a local swap. See what-it-made.ts."
 * one line above `plural(n, "prototype", "prototypes")` -- a comment asserting
 * the noun is the canon's, directly over the noun being hand-typed. It agreed
 * with `KIND_WORD` on the day it was written and nothing held it there: rename
 * `prototype` in the canon and the road keeps the old word while the transcript,
 * the story and the Start row all move.
 *
 * `what-it-made.ts` records paying for exactly that ("carried the same local
 * swap"), and the census in `one-vocabulary-counts-what-a-station-filed.test.ts`
 * now enforces it for every tally in the product.
 */
function plural(n: number, kind: string): string {
  const word = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
  return `${n} ${n === 1 ? word.one : word.many}`;
}

const REVIEW_VERDICT: Record<string, "pass" | "fail" | "open"> = {
  approve: "pass",
  reject: "fail",
  revise: "open",
};

const LEARN_VERDICT: Record<string, "pass" | "fail" | "open"> = {
  held: "pass",
  confirmed: "pass",
  missed: "fail",
  refuted: "fail",
  inconclusive: "open",
};

/** The one short line under a stop. Null when the station has nothing to say yet. */
export function journeyOutcome(stop: Stop, horizonDue: string | null): string | null {
  if (stop.state === "waived") return "skipped";
  /* A station the route has not reached, or was sent back before, still says
     what it filed on an earlier pass; only a station with nothing says nothing. */
  if (stop.state === "not-reached" && !stop.items.some((i) => !i.missing)) return null;
  switch (stop.station) {
    case "sense": {
      /*
       * ── THE BIGGEST INSTANCE OF THIS IN THE PRODUCT, ON ITS BUSIEST NODE ──
       *
       * Measured over every track that filed more than two findings:
       *
       *   track       filed   distinct titles   distinct bodies
       *   6ff86b03     148          19                22
       *   425e6887     125          12                21
       *   3a652670      80           6                 9
       *   47dcbf3c      67           4                 4
       *
       * `47dcbf3c` said **"67 findings"** on the road. There are FOUR, logged
       * about seventeen times each. A person reads 67 as sixty-seven pieces of
       * evidence, which is the impression `whatItProduced`'s header describes
       * paying for on decisions, at twenty times the scale.
       *
       * And Discover is where 82 of the 121 tracks this product has ever made
       * are standing, so this is the most-read node on the most common screen.
       *
       * Same fold as Design below and as the artifact pane, by title, through
       * `foldVersions` -- so the road, the pane and the story cannot disagree
       * about what counts as one finding.
       */
      const found = stop.items.filter((i) => i.kind === "signal" && !i.missing);
      if (found.length === 0) return stop.everDriven ? "nothing found" : null;
      const distinct = foldVersions(found).length;
      return distinct === found.length
        ? plural(found.length, "signal")
        : `${plural(distinct, "signal")}, ${found.length} times`;
    }
    case "decide": {
      const d = newest(stop, "decision");
      if (!d) return null;
      return str(d.fields.forecast_claim) ? "call and forecast" : "call made";
    }
    case "define": {
      const n = count(stop, "prd");
      /* One spec reads as an event on the road ("spec written") rather than a
         tally of one; past that it is a count, and the noun is the canon's. */
      return n > 0 ? (n === 1 ? "spec written" : plural(n, "prd")) : null;
    }
    case "design": {
      /*
       * ── "5 PROTOTYPES" WHERE THERE IS ONE DRAWING, MADE FIVE TIMES ───────
       *
       * Measured across every track that filed more than two:
       *
       *   track       filed   distinct names   distinct bodies
       *   2fdf93b6     13           2                3
       *   ce846e9b     10           3                5
       *   0c0db8e6      5           1                1
       *   6cc7a010      3           1                2
       *
       * On `0c0db8e6` the road said "5 prototypes" and there is ONE name and
       * ONE description. Five copies of one drawing. `whatItProduced`'s own
       * header records paying for this shape on decisions -- *"eight distinct
       * calls is what a person infers, and one call re-made is what
       * happened"* -- and the road is where a person reads it first.
       *
       * It is also the same fact rendered two ways on ONE screen: the artifact
       * pane folds versions and says "5 versions, 4 the same" while this node
       * said "5 prototypes". A reader comparing them has to work out which is
       * true, and both are.
       *
       * `foldVersions` is the pane's own fold, so the two cannot disagree
       * about what counts as one thing. When they agree, the line is unchanged.
       */
      const drawings = stop.items.filter((i) => i.kind === "prototype" && !i.missing);
      if (drawings.length === 0) return null;
      const distinct = foldVersions(drawings).length;
      /* THE REPETITION SURVIVES rather than being folded away. A station that
         drew one screen five times is not a station that drew one screen, and
         on a jam the repetition is the signal a person needs from the road. */
      return distinct === drawings.length
        ? plural(drawings.length, "prototype")
        : `${plural(distinct, "prototype")}, ${drawings.length} times`;
    }
    case "build": {
      const c = newest(stop, "changeset");
      const pr = c ? c.fields.pr_number : null;
      if (typeof pr === "number") return `PR #${pr}`;
      if (c) return "change staged";
      return count(stop, "mission") > 0 ? "building" : null;
    }
    case "ship": {
      const d = newest(stop, "deployment");
      if (!d) return null;
      const status = str(d.fields.status);
      const env = str(d.fields.environment);
      if (status === "failed") return "did not go out";
      return env ? `live · ${env}` : "released";
    }
    case "learn": {
      const l = newest(stop, "learning");
      const v = l ? str(l.fields.verdict) : null;
      if (v === "held" || v === "confirmed") return "held";
      if (v === "missed" || v === "refuted") return "missed";
      if (v === "inconclusive") return "cannot tell";
      return horizonDue ? `due ${horizonDue}` : null;
    }
    default:
      return null;
  }
}

export function journeyStations(input: {
  stops: readonly Stop[] | null | undefined;
  track: {
    station: AgentStation;
    status: "open" | "done" | "abandoned";
    holdReason: string | null;
  } | null;
  /** The route's own path, for the road before the artifacts are read. */
  route?: readonly AgentStation[] | null;
  /** A seat is live on the track right now. */
  live: boolean;
  /** ISO of the newest live turn, for the working stop's clock. */
  liveSince: string | null;
  horizon: string | null;
  gradableBySource: boolean | null;
  nowMs: number;
}): JourneyStation[] {
  /* NOT READ IS NOT NOT-REACHED (fifth review, 2026-09-09, from Lane 2's
     states audit). `stops` is undefined while the artifacts read is in
     flight and when it REFUSED; it is an empty array when the read answered
     and the run has filed nothing. Collapsing the two drew seven `pending`
     stops for a finished run whose read had failed, under a chip saying
     Finished: a run that did all seven reading as one that never started. */
  if (input.stops == null) {
    return (input.route ?? []).map((key) => ({ key, state: "unread" as const }));
  }
  const stops = input.stops;
  /* The road draws the moment the track is read, from its own route, so the
     header does not jump when the artifacts arrive a beat later; every stop
     is pending until the stops say otherwise. */
  if (stops.length === 0) {
    return (input.route ?? []).map((key) => ({ key, state: "pending" as const }));
  }
  const due = formatDeadlineDate(input.horizon ? Date.parse(input.horizon) : null);
  return stops.map((stop) => {
    let state: JourneyState;
    if (stop.state === "waived") state = "waived";
    else if (stop.state === "passed") state = "done";
    else if (stop.state === "not-reached") state = "pending";
    else if (input.track?.status === "done") state = "done";
    else if (input.live) state = "working";
    else if (
      waitingOnTime({
        station: stop.station,
        holdReason: input.track?.holdReason ?? stop.holdReason,
        horizon: input.horizon,
        gradableBySource: input.gradableBySource,
        now: input.nowMs,
      })
    )
      state = "scheduled";
    else {
      const reason = input.track?.holdReason ?? stop.holdReason;
      const tone = holdTone(reason);
      /* A terminal hold is `stopped`, in the you hue, so the road agrees with
         the header's own "Stopped" chip; it was painted red, and
         `failed` is only ever a result (fourth review, 2026-09-09). */
      if (tone === "you") state = nothingIsComing(reason) ? "stopped" : "you";
      else if (tone === "hold") state = "held";
      else state = "waiting";
    }

    let verdict: JourneyStation["verdict"] = null;
    if (stop.station === "build") {
      const c = newest(stop, "changeset");
      const review = c ? parseReview(c.fields.code_review) : null;
      if (hasVerdict(review)) verdict = REVIEW_VERDICT[String(review?.verdict)] ?? "open";
    } else if (stop.station === "learn") {
      const l = newest(stop, "learning");
      const v = l ? str(l.fields.verdict) : null;
      if (v) verdict = LEARN_VERDICT[v] ?? "open";
    }

    return {
      key: stop.station,
      state,
      outcome: journeyOutcome(stop, due),
      verdict,
      at: state === "working" ? input.liveSince : null,
    };
  });
}

/** The newest artifact a station filed, for opening it on the right. */
export function newestArtifactAt(
  stops: readonly Stop[] | null | undefined,
  station: AgentStation,
): string | null {
  const stop = (stops ?? []).find((s) => s.station === station);
  if (!stop) return null;
  const item = [...stop.items]
    .filter((i) => !i.missing)
    .sort((a, b) => orderedAt(b) - orderedAt(a))[0];
  return item ? ((item as { artifactId: string }).artifactId ?? null) : null;
}
