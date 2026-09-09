/**
 * THE FIRST THREE RUNS, WRITTEN FROM THE ONE LINE THE PERSON GAVE.
 *
 * After the first run screen the home was an invitation over nothing: no
 * runs, no sources, and ExampleJobs draws only when evidence has arrived,
 * which for a fresh workspace is never. Founder, 2026-09-08: "Anticipate, do
 * not interrogate." So the product reads the product's name and the one
 * line, and writes three sentences a person could start with, once, kept on
 * the product row (Lane 3, `listStarterRuns`, 2026-09-08).
 *
 * ── THE READING IS THE FIRST VISIBLE WORK ────────────────────────────────
 * While the answer has not landed the screen says so, in the agent hue with
 * a live dot: the machine is at work, on what, for the person. Not a
 * spinner, and not a blank. When it lands the three sentences stand as pick
 * cards; a press puts the sentence in the composer and focuses it, starting
 * nothing, the same rule ExampleJobs holds for an example: these are read
 * from one line, not from evidence, and the person's Enter is the consent.
 * When the model refused, the line says so and the invitation above stands.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { PresenceDot } from "@/components/meridian/AgentPresence";
import { PickCard } from "@/components/meridian/onramp-parts";
import { SketchProblem } from "@/components/meridian/sketch-glyphs";
import { listStarterRuns } from "@/lib/onboarding.functions";

export type StarterState = {
  pending: boolean;
  runs: ReadonlyArray<{ sentence: string; why: string }>;
  reason: string | null;
};

/**
 * A WHY IS A REASON, NOT A BRIEF. The server bounds a new row's why at 160
 * characters; rows written before that bound carry three sentences and a
 * number, and one such card stood twice the height of its neighbours on the
 * home (read live on 5be2e7d0, 2026-09-09). The same bound applies here, at
 * a sentence end where there is one, so three cards weigh the same and
 * nothing is hidden behind a tooltip a touch never shows.
 */
export const WHY_MAX = 160;
export function boundWhy(why: string, max: number = WHY_MAX): string {
  const text = why.trim();
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("? "),
    head.lastIndexOf("! "),
  );
  if (sentenceEnd >= 40) return head.slice(0, sentenceEnd + 1);
  const wordEnd = head.lastIndexOf(" ");
  return `${head.slice(0, wordEnd > 40 ? wordEnd : max).replace(/[,;:]$/, "")}…`;
}

/** The one line above the cards, or the line that stands in for them. */
export function starterLine(state: StarterState | undefined, name: string): string | null {
  if (!state) return null;
  if (state.pending && state.reason)
    return `It could not write the first runs yet (${state.reason}). Trying again.`;
  if (state.pending)
    return `Reading what you said about ${name}, and writing three runs it could start with.`;
  if (state.runs.length > 0)
    return `Three runs ${name} could start with, from what you said. Press one to put it in the box above.`;
  if (state.reason)
    return `It could not write the first runs: ${state.reason} Say the first thing yourself, above.`;
  return null;
}

export function starterRunsKey(productId: string) {
  return ["starter-runs", productId] as const;
}

export function StarterRuns({
  productId,
  productName,
  onUse,
}: {
  productId: string;
  productName: string;
  /** Put the sentence in the composer and focus it. Starts nothing. */
  onUse: (sentence: string) => void;
}) {
  const fList = useServerFn(listStarterRuns);
  const q = useQuery({
    queryKey: starterRunsKey(productId),
    queryFn: () => fList({ data: { productId } }),
    /* Only while the answer is still being written: two and a half seconds
       is fast enough that the three arrive on the first look, and nothing
       polls once they are on the row. */
    refetchInterval: (query) => (query.state.data?.pending ? 2_500 : false),
    staleTime: 5 * 60_000,
  });
  const line = starterLine(q.data, productName);
  if (!line) return null;

  return (
    <section
      data-mrd=""
      aria-label="First runs"
      aria-live="polite"
      className="flex flex-col gap-mrd-3"
    >
      <div className="flex items-center gap-mrd-2">
        {q.data?.pending ? <PresenceDot colour="--mrd-agent" size={8} /> : null}
        <p className="mrd-meta">{line}</p>
      </div>
      {q.data && !q.data.pending && q.data.runs.length > 0 ? (
        <ul className="grid gap-mrd-3 md:grid-cols-3">
          {q.data.runs.slice(0, 3).map((r) => (
            <li key={r.sentence}>
              <PickCard
                lead={r.sentence}
                sub={boundWhy(r.why)}
                glyph={<SketchProblem />}
                onSelect={() => onUse(r.sentence)}
                className="h-full"
                /* The why exists nowhere but this card (the press carries
                   only the sentence); bounded above at a sentence end, it is
                   never clipped (fourth review, 2026-09-09). */
                clamp={false}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default StarterRuns;
