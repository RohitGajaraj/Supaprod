/**
 * THE FIRST THING A SIGNED-IN PERSON READS.
 *
 * Founder, 2026-09-08: "a user lands on home and it is not appealing,
 * carries no message, shows no journey." The home opened on a text box with
 * an example placeholder and four sentences of status. Nothing said what the
 * product is for or what starting a run does.
 *
 * This is the message, and it changes with the state of the workspace rather
 * than repeating itself:
 *
 *   nothing yet     the invitation, naming the product: what should it do next?
 *   something needs a person   that, first, because it is the one thing only
 *                   they can do
 *   things moving   how many, so the person knows the machine is at work
 *   all settled     the invitation again
 *
 * One headline, one line under it. The composer under that. Anthropic, OpenAI
 * and Perplexity all open on one sentence and one box; this is the same
 * shape, with the sentence doing the work of an onboarding tour.
 */
import * as React from "react";
import { Link } from "@tanstack/react-router";

import type { StartRun } from "@/lib/spine/track.functions";
import { quotedTitle } from "@/components/start/a-title-inside-a-sentence";
import { standingState, type RunLike } from "@/components/start/journey-of-a-run";
import { quietFor } from "@/components/start/CrewAtWork";

export type HeroCopy = {
  eyebrow: string | null;
  title: string;
  line: string;
  /** A door on the sentence that names a place: "Answer them in Inbox" gets
   *  Inbox as a press (third review, 2026-09-08). */
  door?: { label: string; to: string } | null;
};

const PROMISE =
  "Say it in one sentence. It finds the evidence, makes the call, writes the spec, builds the change, ships it and checks that it did what you said. Here, where you can watch.";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * A TITLE INSIDE A SENTENCE IS QUOTED AND BOUNDED, and the rule now lives in
 * `a-title-inside-a-sentence.ts` because a second surface needed it: the home's
 * "your work moved" line read *"...is cancelled reached Build"* without it. A
 * copied rule drifts on the day somebody tunes the length, so it moved rather
 * than being duplicated. Same function, same 72.
 */
const quoted = quotedTitle;

export function heroCopy(input: {
  product: string | null;
  runs:
    readonly (Pick<StartRun, "status" | "needsYou" | "working"> & Partial<RunLike>)[] | undefined;
  /** The runs read REFUSED, as opposed to not having answered yet. The
   *  hero then says so rather than drawing the first visit over a workspace
   *  with a year of runs (fourth review, 2026-09-09). */
  failed?: boolean;
  /** Everything in the approvals queue for a person, the number the Inbox
   *  page lists and the rail's Inbox row counts. Null while unread, and null
   *  when the read refused: a null is never an all-clear. */
  waiting?: number | null;
  /** The same queue by family, largest first, as the Inbox page's own
   *  `queueShape` returns it. The hero names the largest family rather than
   *  printing a raw total, which is the Inbox page's rule too. */
  waitingShape?: ReadonlyArray<{ n: number; label: string }> | null;
  /**
   * THE ONE TO START WITH, from the same read and the same order the Inbox
   * puts it in: oldest first, which is the card the Inbox focuses when you
   * arrive. Null when the queue is unread, when it is empty, or when the
   * oldest item has no title to name (fifth review, 2026-09-09).
   */
  waitingFirst?: string | null;
  /** The Inbox page's own caveat when the queue answered short (a family
   *  failed or hit its ceiling), composed by `notTheWholeQueue`. Appended
   *  here so the hero and the Inbox say one thing about the same queue. */
  queueShort?: string | null;
  /** The clock a quiet seat is measured against. Now, unless a test says. */
  nowMs?: number;
}): HeroCopy {
  const name = input.product ?? "your product";
  const runs = input.runs;
  const eyebrow = input.product;
  const nowMs = input.nowMs ?? Date.now();
  const short = input.queueShort ? ` ${input.queueShort}` : "";

  if (runs === undefined) {
    if (input.failed) {
      /* A refused read is not a first visit. The list below carries the
         retry; this line only says what is true. */
      return {
        eyebrow,
        title: `What should ${name} do next?`,
        line: "Your runs could not be read. Whatever is running is still running; the list below can try again.",
      };
    }
    // Unread. Say the invitation; never a count that has not been looked up.
    return { eyebrow, title: `What should ${name} do next?`, line: PROMISE };
  }
  const open = runs.filter((r) => r.status === "open");
  /* A call is a person's whether it is a gate (`needsYou`) or a hold the
     driver marks as theirs: one predicate, the row's own. */
  const needs = open.filter(
    (r) => r.needsYou || ("holdReason" in r && standingState(r as RunLike) === "you"),
  ).length;
  /*
   * A QUIET SEAT IS NOT MOVING. Every other surface on the page (the strip,
   * the row, the row's mark) calls a seat quiet past the stall threshold and
   * stops its clock; this line, the largest type on the page, still said
   * "1 run is moving." over it (fourth review, 2026-09-09). The same
   * predicate the strip uses, so the two can never disagree.
   */
  const working = open.filter((r) => r.working);
  const quietMs = working.map((r) => (r.working ? (quietFor(r.working, nowMs) ?? 0) : 0));
  const quiet = quietMs.filter((ms) => ms > 0).length;
  const moving = working.length - quiet;
  const longestQuiet = Math.max(0, ...quietMs);
  /*
   * STOPPED IS ALSO ON YOU. Seen live on the founder's workspace: four runs
   * stood held at Build and Ship (ran again and again without moving on)
   * while this line said nothing was waiting. A hold on a condition is not
   * an ask, but nothing will move it except a person looking, and the rows
   * say so. So it is counted here, after the asks and before the quiet.
   * `held` (a condition) and `stopped` (the loop quit, a person restarts)
   * are both stopped here; the row's mark tells them apart.
   */
  const stopped = open.filter((r) => {
    if (r.needsYou || r.working || !("holdReason" in r)) return false;
    const s = standingState(r as RunLike);
    return s === "held" || s === "stopped";
  }).length;

  /* THE SECOND LINE CARRIES THE OTHER FACTS. It used to say only what was
     moving, and "1 run is moving on their own" (entry review, 2026-09-08).
     Each fact carries its own noun, and the headline's own fact is left out
     of its second line rather than said twice. */
  const facts: ReadonlyArray<[key: string, sentence: string | null]> = [
    [
      "moving",
      moving > 0
        ? `${plural(moving, "run is", "runs are")} moving on ${moving === 1 ? "its" : "their"} own`
        : null,
    ],
    ["quiet", quiet > 0 ? `${plural(quiet, "run has", "runs have")} gone quiet` : null],
    ["stopped", stopped > 0 ? `${plural(stopped, "run has", "runs have")} stopped` : null],
  ];
  const rest = (own: string | null): string => {
    const bits = facts.filter(([k, s]) => k !== own && s).map(([, s]) => s);
    return bits.length > 0 ? ` ${bits.join("; ")}.` : "";
  };
  /*
   * ── ONE FACT, NOT A TALLY JOINED BY SEMICOLONS ────────────────────────────
   *
   * For the branch where CALLS lead. Read on the served entry, 2026-09-09:
   *
   *   Start with "Show homeowner installer arrival window on order page".
   *   Answer them in Inbox, or on the runs below that carry them. 2 runs have
   *   stopped. Open Inbox
   *
   * Four clauses, three different subjects, wrapping to two lines under the
   * largest type on the landing page. On a workspace with all three facts the
   * same slot reads "...; 2 runs have gone quiet; 2 runs have stopped." That
   * is the *"dump of data and content"* the founder named, in the one line
   * that is supposed to tell him what to do.
   *
   * `rest(null)` is right where the headline is ABOUT the runs, because there
   * the tally is the subject. Here the subject is the calls, and the runs are
   * a second topic entirely, so the line takes the ONE that most needs a
   * person and drops the rest to the list that draws them properly.
   *
   * QUIET BEFORE STOPPED, on this file's own established order: *"a stopped
   * run spends nothing more, a quiet seat may."* And `moving` never qualifies
   * -- a run getting on with it by itself is the system working, and it has no
   * business on a line a person is reading to find out what to do.
   */
  const mostUrgent = (): string => {
    /*
     * ── AND `stopped` LEFT THIS LINE, BECAUSE THE ROAD NOW SAYS IT BETTER ───
     *
     * Read together on the served entry, 2026-09-10, about 200px apart:
     *
     *   hero:  "...2 runs have stopped. Open Inbox"
     *   road:  "Design has stopped, and will not move without you."
     *
     * The road's version is strictly better. It names WHICH station and what
     * it means, where the hero could only ever count. And on a headline whose
     * subject is CALLS WAITING, a tally of runs was a second subject anyway --
     * which is the reduction this function was written for, applied one step
     * further now that somewhere else owns the fact.
     *
     * QUIET STAYS, and that is the whole reason this is a filter rather than a
     * deletion. The road has no state for a seat that has gone quiet mid-turn:
     * that run is still `working` on the map and the station looks alive. So
     * the hero is the only place it can be said, and a quiet seat may still be
     * spending money, which is why this file already ranks it above stopped.
     *
     * When there is nothing quiet, the line simply ends after the lead. One
     * fact, in the one place that says it best.
     */
    const pick = facts.find(([k, s]) => s && k === "quiet");
    return pick ? ` ${pick[1]}.` : "";
  };
  /*
   * THE ASKS BEYOND THE RUNS. Read live: the Inbox page listed six calls
   * (design gates, decisions) while this line said nothing was waiting,
   * because none of them was a gate on a run row. The queue's number is the
   * one the person will meet on Inbox; it leads when it is larger.
   *
   * UNREAD IS NOT ZERO. A null used to fall to 0 here and the line below
   * said nothing was waiting on a read that never answered (fourth review,
   * 2026-09-09). The all-clear is said only when the queue said it.
   */
  const unread = input.waiting == null;
  const waiting = input.waiting ?? 0;
  if (waiting > needs) {
    const biggest = input.waitingShape?.[0] ?? null;
    const others = biggest ? waiting - biggest.n : 0;
    const title = biggest
      ? others > 0
        ? `${biggest.label} and ${plural(others, "other call are", "other calls are")} waiting for you.`
        : `${biggest.label} ${biggest.n === 1 ? "is" : "are"} waiting for you.`
      : `${plural(waiting, "call is", "calls are")} waiting for you.`;
    /*
     * A COUNT IS A DEBT; THE NEXT STEP IS A DIRECTION (fifth review,
     * 2026-09-09). The headline stays the count, because that is the state and
     * a person takes it in at a glance. The line under it used to say only
     * where to answer, which left the largest type on the landing page
     * reporting how far behind you are and nothing about what to do first.
     * Findings settled the same question on its own surface by naming the one
     * cluster to start with; this names the one call, and it is the same item
     * the Inbox focuses when you get there, so the two cannot disagree.
     */
    const start = input.waitingFirst?.trim();
    const lead = start ? `Start with ${quoted(start)}.` : "";
    /*
     * WHERE TO ANSWER IS THE FALLBACK, NOT THE LEAD. It used to run in front
     * of every one of these lines, and next to a door labelled "Open Inbox"
     * with the runs visibly below, it explains the layout to somebody who is
     * looking at the layout. It earns its place only when there is no call to
     * name -- then it is the whole direction rather than a preamble to one.
     */
    return {
      eyebrow,
      title,
      line: `${lead || "Answer them in Inbox, or on the runs below that carry them."}${mostUrgent()}${short}`,
      door: { label: "Open Inbox", to: "/approvals" },
    };
  }
  if (runs.length === 0) {
    /* The person just read the road on the first run screen; saying it
       again word for word is the product repeating itself on its second
       screen (entry review, 2026-09-08). Here the line is about the sentence. */
    return {
      eyebrow,
      title: `What should ${name} do first?`,
      /* The three starter runs say themselves when they arrive; the hero does
         not promise them before then (third review, 2026-09-08). */
      line: `Say it in one sentence. You will watch it happen on the run's own page, and it stops to ask you only where the call is yours.${short}`,
    };
  }
  if (needs > 0) {
    return {
      eyebrow,
      title: `${plural(needs, "run needs", "runs need")} you.`,
      line: `Answer below and the work carries on.${rest(null)}${short}`,
    };
  }
  if (quiet > 0) {
    /* Before stopped: a stopped run spends nothing more, a quiet seat may. */
    return {
      eyebrow,
      title: `${plural(quiet, "run has", "runs have")} gone quiet.`,
      line: `${quiet === 1 ? "Its seat has" : "Their seats have"} not moved for ${Math.round(longestQuiet / 60_000)} min. Look below before more is spent on ${quiet === 1 ? "it" : "them"}.${rest("quiet")}${short}`,
    };
  }
  if (stopped > 0) {
    return {
      eyebrow,
      title: `${plural(stopped, "run has", "runs have")} stopped.`,
      line: `Each one says why below. Look before more is spent on it.${rest("stopped")}${short}`,
    };
  }
  if (moving > 0) {
    return {
      eyebrow,
      title: `${plural(moving, "run is", "runs are")} moving.`,
      line: unread
        ? "Watch them below. Whether anything else is waiting for you could not be read."
        : input.queueShort
          ? `Watch them below.${short}`
          : "Watch them below, or hand over the next thing.",
    };
  }
  return {
    eyebrow,
    title: `What should ${name} do next?`,
    line: unread
      ? "Whether anything is waiting for you could not be read. Say the next thing and it starts here."
      : input.queueShort
        ? `${input.queueShort} Say the next thing and it starts here.`
        : "Nothing you started is waiting on you. Say the next thing and it starts here.",
  };
}

export function Hero({ copy }: { copy: HeroCopy }) {
  return (
    <header
      data-mrd=""
      className="flex flex-col gap-mrd-3"
      /* It arrives once, on the arrival, and on Meridian's own fade rather
         than in one frame (motion review, 2026-09-08); the reduced-motion
         block in meridian.css keys on the keyframe name and stops it. */
      style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease-soft) both" }}
    >
      {copy.eyebrow ? <span className="mrd-eyebrow">{copy.eyebrow}</span> : null}
      <h1 className="font-mrd-display text-mrd-h1 leading-mrd-tight font-medium tracking-[-0.015em] text-mrd-ink">
        {copy.title}
      </h1>
      <p className="max-w-[var(--mrd-measure-page)] text-mrd-prose leading-mrd-prose text-mrd-body">
        {copy.line}
        {copy.door ? (
          <>
            {" "}
            {/*
             * ── A CONTROL'S LABEL IS ONE PHRASE AND NEVER BREAKS ──────────
             *
             * SEEN ON THE SERVED ENTRY, 2026-09-10: "Open Inbox" occupied TWO
             * line boxes, with "Open" ending one line and "Inbox" starting the
             * next. Measured with `getClientRects().length`, not by eye.
             *
             * A two-word door split across lines stops reading as a control at
             * all -- the eye takes "...2 runs have stopped. Open" as the end of
             * a sentence and "Inbox" as the start of another. This door sits in
             * the largest paragraph on the landing page, so it is the worst
             * place in the product for that to happen.
             *
             * `nowrap` on the LABEL only. The paragraph still wraps wherever it
             * likes; what cannot break is the thing a person is meant to press.
             */}
            <Link
              to={copy.door.to}
              className="whitespace-nowrap rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              {copy.door.label}
            </Link>
          </>
        ) : null}
      </p>
    </header>
  );
}

export default Hero;
