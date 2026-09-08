/**
 * THE FIRST THING A SIGNED-IN PERSON READS.
 *
 * Founder, 2026-09-08: "a user lands on home and it is not appealing,
 * carries no message, shows no journey." The home opened on a text box with
 * an example placeholder and four sentences of status. Nothing said what the
 * product is for or what pressing Enter does.
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

import type { StartRun } from "@/lib/spine/track.functions";
import { standingState, type RunLike } from "@/components/start/journey-of-a-run";

export type HeroCopy = { eyebrow: string | null; title: string; line: string };

const PROMISE =
  "Say it in one sentence. It finds the evidence, makes the call, writes the spec, builds the change, ships it and checks that it did what you said. Here, where you can watch.";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function heroCopy(input: {
  product: string | null;
  runs:
    readonly (Pick<StartRun, "status" | "needsYou" | "working"> & Partial<RunLike>)[] | undefined;
  /** Everything in the approvals queue for a person, the number the Inbox
   *  page lists and the rail's Inbox row counts. Null while unread. */
  waiting?: number | null;
  /** The same queue by family, largest first, as the Inbox page's own
   *  `queueShape` returns it. The hero names the largest family rather than
   *  printing a raw total, which is the Inbox page's rule too. */
  waitingShape?: ReadonlyArray<{ n: number; label: string }> | null;
}): HeroCopy {
  const name = input.product ?? "your product";
  const runs = input.runs;
  const eyebrow = input.product;

  if (runs === undefined) {
    // Unread. Say the invitation; never a count that has not been looked up.
    return { eyebrow, title: `What should ${name} do next?`, line: PROMISE };
  }
  const open = runs.filter((r) => r.status === "open");
  /* A call is a person's whether it is a gate (`needsYou`) or a hold the
     driver marks as theirs: one predicate, the row's own. */
  const needs = open.filter(
    (r) => r.needsYou || ("holdReason" in r && standingState(r as RunLike) === "you"),
  ).length;
  const moving = open.filter((r) => r.working).length;
  /*
   * STOPPED IS ALSO ON YOU. Seen live on the founder's workspace: four runs
   * stood held at Build and Ship (ran again and again without moving on)
   * while this line said nothing was waiting. A hold on a condition is not
   * an ask, but nothing will move it except a person looking, and the rows
   * say so. So it is counted here, after the asks and before the quiet.
   */
  const stopped = open.filter(
    (r) => !r.needsYou && !r.working && "holdReason" in r && standingState(r as RunLike) === "held",
  ).length;

  /* THE SECOND LINE CARRIES BOTH FACTS. It used to say only what was
     moving, and "1 run is moving on their own" (entry review, 2026-09-08). */
  const restBits: string[] = [];
  if (moving > 0)
    restBits.push(
      `${plural(moving, "run is", "runs are")} moving on ${moving === 1 ? "its" : "their"} own`,
    );
  if (stopped > 0) restBits.push(`${plural(stopped, "has", "have")} stopped`);
  const rest = restBits.length > 0 ? ` ${restBits.join("; ")}.` : "";
  /*
   * THE ASKS BEYOND THE RUNS. Read live: the Inbox page listed six calls
   * (design gates, decisions) while this line said nothing was waiting,
   * because none of them was a gate on a run row. The queue's number is the
   * one the person will meet on Inbox; it leads when it is larger.
   */
  const waiting = input.waiting ?? 0;
  if (waiting > needs) {
    const biggest = input.waitingShape?.[0] ?? null;
    const others = biggest ? waiting - biggest.n : 0;
    const title = biggest
      ? others > 0
        ? `${biggest.label} and ${plural(others, "other call are", "other calls are")} waiting for you.`
        : `${biggest.label} ${biggest.n === 1 ? "is" : "are"} waiting for you.`
      : `${plural(waiting, "call is", "calls are")} waiting for you.`;
    return {
      eyebrow,
      title,
      line: `Answer them in Inbox, or on the runs below that carry them.${rest}`,
    };
  }
  if (runs.length === 0) {
    /* The person just read the road on the first run screen; saying it
       again word for word is the product repeating itself on its second
       screen (entry review, 2026-09-08). Here the line is about the sentence. */
    return {
      eyebrow,
      title: `What should ${name} do first?`,
      line: `Say it in one sentence, or press one of the three below. You will watch it happen on the run's own page, and it stops to ask you only where the call is yours.`,
    };
  }
  if (needs > 0) {
    return {
      eyebrow,
      title: `${plural(needs, "run needs", "runs need")} you.`,
      line: `Answer below and the work carries on.${rest}`,
    };
  }
  if (stopped > 0) {
    return {
      eyebrow,
      title: `${plural(stopped, "run has", "runs have")} stopped.`,
      line: `Each one says why below. Look before more is spent on it.${rest}`,
    };
  }
  if (moving > 0) {
    return {
      eyebrow,
      title: `${plural(moving, "run is", "runs are")} moving.`,
      line: "Watch them below, or hand over the next thing.",
    };
  }
  return {
    eyebrow,
    title: `What should ${name} do next?`,
    line: "Nothing you started is waiting on you. Say the next thing and it starts here.",
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
      </p>
    </header>
  );
}

export default Hero;
