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

export type HeroCopy = { eyebrow: string | null; title: string; line: string };

const PROMISE =
  "Say it in one sentence. It finds the evidence, makes the call, writes the spec, builds the change, ships it and checks that it did what you said. Here, where you can watch.";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function heroCopy(input: {
  product: string | null;
  runs: readonly Pick<StartRun, "status" | "needsYou" | "working">[] | undefined;
}): HeroCopy {
  const name = input.product ?? "your product";
  const runs = input.runs;
  const eyebrow = input.product;

  if (runs === undefined) {
    // Unread. Say the invitation; never a count that has not been looked up.
    return { eyebrow, title: `What should ${name} do next?`, line: PROMISE };
  }
  const open = runs.filter((r) => r.status === "open");
  const needs = open.filter((r) => r.needsYou).length;
  const moving = open.filter((r) => r.working).length;

  if (runs.length === 0) {
    return { eyebrow, title: `What should ${name} do next?`, line: PROMISE };
  }
  if (needs > 0) {
    const rest = moving > 0 ? ` ${plural(moving, "run is", "runs are")} moving on their own.` : "";
    return {
      eyebrow,
      title: `${plural(needs, "run needs", "runs need")} you.`,
      line: `Answer below and the work carries on.${rest}`,
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
    <header data-mrd="" className="flex flex-col gap-mrd-3">
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
