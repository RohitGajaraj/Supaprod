/**
 * ── THE ENTRY LEADS WITH ONE PIECE OF WORK, TOLD WHOLE ───────────────────
 *
 * FOUNDER, 2026-09-10: *"A user lands on home and it is not appealing, carries
 * no message, shows no journey. I cannot feel the value and I cannot see any
 * real connectivity. Layers 1, 2 and 3 do not stitch together, and it reads as
 * a dump of data and content."*
 *
 * ── WHY THE PREVIOUS ANSWER DID NOT HOLD ─────────────────────────────────
 *
 * The pass before this one read *"shows no journey"* as **the drawing of the
 * journey is not visible enough**, and moved the seven-station road from eighth
 * position to first. That shipped. The founder looked at it and said the same
 * thing again, so the placement was never the defect.
 *
 * **A journey is not a diagram of stages. A journey is one thing moving through
 * time.** The road at the top of the home renders identically for every
 * workspace holding the same counts: it is the machine's self-portrait, which
 * is layer 2 — the layer this product explicitly rents rather than owns — given
 * the largest region on the most important screen.
 *
 * The journey a person cannot see runs **evidence → the call → the work → the
 * verdict**, on one specific thing they care about. That is layers 1, 2 and 3
 * stitched, and it cannot be drawn as an abstraction, because the stitching IS
 * the content.
 *
 * ── EVERY FIELD BELOW IS ALREADY IN THE BROWSER ──────────────────────────
 *
 * This module invents no read. `getApprovalsQueue` is already fetched by the
 * home (it pays for the whole Inbox payload), and audited 2026-09-10 the home
 * rendered **one integer, one noun and one title** off it and dropped the rest:
 * `evidence[]`, `impact`, `forecast{claim,howWeWillKnow,horizonDate}`,
 * `approveConsequence`, `rejectConsequence`, `agentSlug`, `gatesLiveWork` and —
 * the one that mattered most — `trackId`, the join back to the run list four
 * hundred pixels below it on the same screen.
 *
 * So the whole of "one piece of work told whole" was already paid for, already
 * in memory, and already thrown away on every poll. That is this repo's oldest
 * defect class and this is its largest instance.
 *
 * ── WHAT THE DATA CAN HONESTLY LEAD WITH, MEASURED ───────────────────────
 *
 * Production, 2026-09-10 05:39 UTC, samples excluded, whole database:
 *
 *   33,777 rows describing MOTION.
 *   ~14 rows describing a RESULT — 9 forecasts with a hit/miss verdict,
 *   3 shipped things with an outcome, 2 learnings — against 69,543 credits
 *   spent and 3,205 agent runs.
 *
 * So an entry that leads with PROOF is empty, and an entry that leads with
 * MOTION confirms exactly the feeling the founder described. The third option
 * is the only honest one, and it happens to be the product's own wedge:
 * **what is stuck, on whom, and for how long.** In the realest workspace that
 * is 28 items waiting on a person, the oldest for 55 days.
 *
 * ── AND THE STATUS COLUMN LIES, WHICH IS WHY `gatesLiveWork` IS DRAWN ────
 *
 * Measured in the same read: five consecutive `agent_runs` rows on one track,
 * ten minutes apart, every one `status='completed'`, every one producing the
 * same refusal, all five blocked behind a design gate no human ever answered.
 * A "completed" run that accomplished nothing.
 *
 * `gatesLiveWork` is the field that stops this surface repeating that lie.
 * 22 of 29 pending tool-call gates hold a run that has already finished, so
 * answering them releases nothing. The lead SAYS SO when it knows, and stays
 * silent when it does not — `null` is never collapsed into `false`, because
 * telling a person the work had finished when nothing ever started is the more
 * expensive of the two wrong answers.
 */

import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import type { StartRun } from "@/lib/spine/track.functions";
import { stoppedFor } from "@/components/meridian/stopped-for";

/** The bet a call carries, in the three fields a person needs to judge it. */
export type LeadPromise = {
  claim: string;
  howWeWillKnow: string | null;
  /** ISO. The caller formats it in the reader's own zone. */
  horizonDate: string | null;
};

/**
 * WHAT THE LEAD IS SHOWING, as a closed set rather than a pile of optional
 * fields. Four shapes, and the component draws exactly one — so a movement that
 * has nothing to say still keeps its place on the screen (law 32) instead of
 * unmounting and taking the page's shape with it.
 */
export type Lead =
  /** A person is required. The product's own wedge, and the only state here
   *  that carries controls. */
  | {
      kind: "call";
      item: ApprovalQueueItem;
      /** The run this call sits on, when `trackId` joins one the home already
       *  holds. Null is common and honest: only tool-call gates carry a run. */
      run: StartRun | null;
      /** How long it has waited, in the same words every other surface uses. */
      waited: string;
      /**
       * Whether answering still releases anything, and SILENCE when unknown.
       * Never a guess: see the note above on 22 of 29 dead gates.
       */
      releases: string | null;
      /** Why it is being asked, with provenance. Empty is normal. */
      why: readonly string[];
      /** What it costs or touches. */
      cost: string | null;
      /** What it is betting on, when the call carries a forecast. */
      promise: LeadPromise | null;
    }
  /** Nothing is waiting on a person, but something is stopped, running, or
   *  finished. The most important run, told with the sentence that is true of
   *  it and no other. */
  | { kind: "run"; run: StartRun; line: string }
  /** The reads answered and there is genuinely nothing. Still drawn. */
  | { kind: "nothing" }
  /** A read did not answer. Draws nothing and states nothing — a zero here is
   *  a lie about a question we did not get to ask. */
  | { kind: "unread" };

export const LEAD_UNREAD: Lead = { kind: "unread" };

/**
 * HOW LONG IT HAS WAITED, or null when the item carries no timestamp.
 *
 * `stoppedFor` is the product's one span vocabulary and is reused rather than
 * re-worded: a call that has waited six days must not read "6 days" here and
 * "6d" on the row below it.
 */
function waitedFor(timestamp: string | undefined, nowMs: number): string | null {
  if (!timestamp) return null;
  const at = new Date(timestamp).getTime();
  if (Number.isNaN(at)) return null;
  return stoppedFor(at, nowMs);
}

/**
 * WHETHER ANSWERING THIS STILL RELEASES ANYTHING.
 *
 * Three states, three sentences, and the third is silence. The false case is
 * the one worth the words: a person who answers a gate whose run has already
 * finished has spent their attention on nothing, and until now no surface in
 * the product told them before they pressed.
 */
export function releaseLine(gatesLiveWork: boolean | null): string | null {
  if (gatesLiveWork === true) return "The run is holding here. Answering releases it.";
  if (gatesLiveWork === false)
    return "The run this held has already finished, so answering it releases nothing.";
  return null;
}

/**
 * WHICH RUN THE LEAD FALLS BACK TO WHEN NOTHING IS WAITING ON A PERSON.
 *
 * Ranked by what a person can actually do something about, not by recency:
 *
 *   1. A run with a boundary call the queue did not federate. The driver says
 *      it is a person's, and that outranks anything the machine is doing.
 *   2. A run working RIGHT NOW. The one moment this product is genuinely
 *      agentic on screen, and it should not lose to a week-old stop.
 *   3. A run that stopped. Ordered oldest-stop first, because the thing that
 *      has been stuck longest is the thing nobody has looked at.
 *   4. The most recently finished run, which is the only place a verdict can
 *      appear at all.
 *
 * `null` when there is nothing in any of those four buckets.
 */
export function runInFront(runs: readonly StartRun[]): StartRun | null {
  if (runs.length === 0) return null;
  const open = runs.filter((r) => r.status === "open");
  const asks = open.find((r) => r.needsYou);
  if (asks) return asks;
  const working = open
    .filter((r) => r.working)
    .sort((a, b) => moved(b) - moved(a))
    .at(0);
  if (working) return working;
  /* OLDEST STOP FIRST, and it is the opposite of every other list on this
     page. A run list is sorted newest-first because a person is scanning it; a
     single lead is chosen, and the one worth choosing is the one that has been
     stuck longest with nobody looking. */
  const stopped = open
    .filter((r) => r.holdReason || r.stoppedBecause)
    .sort((a, b) => moved(a) - moved(b))
    .at(0);
  if (stopped) return stopped;
  const stillOpen = open.sort((a, b) => moved(b) - moved(a)).at(0);
  if (stillOpen) return stillOpen;
  return [...runs].sort((a, b) => moved(b) - moved(a)).at(0) ?? null;
}

function moved(r: StartRun): number {
  const at = new Date(r.drivenAt ?? r.updatedAt).getTime();
  return Number.isNaN(at) ? 0 : at;
}

/**
 * THE ONE PIECE OF WORK THIS ENTRY OPENS WITH.
 *
 * `queue === null` and `runs === null` mean UNREAD, and they are kept apart
 * from empty on purpose: "nothing is waiting on you" and "we could not find out
 * what is waiting on you" are different sentences, and a home that says the
 * first when it means the second is the most expensive lie this surface can
 * tell, because the person stops looking.
 */
export function theCallInFront(input: {
  queue: readonly ApprovalQueueItem[] | null;
  runs: readonly StartRun[] | null;
  /** The sentence that is true of this run and, ideally, of no other row on
   *  the page. Supplied by the caller so the lead and the list cannot drift. */
  lineFor: (run: StartRun) => string;
  nowMs?: number;
}): Lead {
  const { queue, runs, lineFor } = input;
  const nowMs = input.nowMs ?? Date.now();
  if (queue === null && runs === null) return LEAD_UNREAD;

  if (queue && queue.length > 0) {
    /* OLDEST FIRST, which is the Inbox's own order (`inbox.tsx` settles in
       order, oldest first). The home must not lead with a different call from
       the one the queue would hand you, or pressing through from here and
       pressing through from there would answer two different things. */
    const item = [...queue].sort((a, b) => stamp(a) - stamp(b))[0]!;
    const run = item.trackId ? ((runs ?? []).find((r) => r.id === item.trackId) ?? null) : null;
    return {
      kind: "call",
      item,
      run,
      waited: waitedFor(item.timestamp, nowMs) ?? "",
      releases: releaseLine(item.gatesLiveWork),
      why: item.evidence ?? [],
      cost: item.impact ?? null,
      promise: item.forecast?.claim
        ? {
            claim: item.forecast.claim,
            howWeWillKnow: item.forecast.howWeWillKnow ?? null,
            horizonDate: item.forecast.horizonDate ?? null,
          }
        : null,
    };
  }

  if (runs && runs.length > 0) {
    const run = runInFront(runs);
    if (run) return { kind: "run", run, line: lineFor(run) };
  }

  /* Both reads answered and both are empty. That is a real state and it is the
     first thing most people ever see here. */
  if (queue !== null && runs !== null) return { kind: "nothing" };
  return LEAD_UNREAD;
}

function stamp(i: ApprovalQueueItem): number {
  const at = i.timestamp ? new Date(i.timestamp).getTime() : NaN;
  return Number.isNaN(at) ? Number.MAX_SAFE_INTEGER : at;
}
