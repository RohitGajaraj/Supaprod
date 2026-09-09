/**
 * THE RUN, TOLD AS THE STORY IT WAS. See `the-through-line.ts` for the argument.
 *
 * ── WHY IT LEADS THE PANE, AND WHY THE CHIPS WENT ─────────────────────────
 * This sits above "What this run got you", where a row of chips used to open:
 * `finding` `decision` `16 tasks` `5 specs` `10 prototypes`. Those five nouns
 * are the "dump of data and content" the founder named, and they were the FIRST
 * thing the pane said. They are gone rather than moved: every one of them named
 * a thing this list now names in a sentence, and each line opens the same
 * artifact the chip did. A chip tells you a noun exists; a line tells you what
 * happened and lets you press into it.
 *
 * Everything else on the proof panel stays. Those rows are not a dump: the
 * check, the release, the bet and the verdict are four different questions, and
 * none of them is answered by the story above.
 */
import * as React from "react";

import { StationGlyph, GLYPH_FOR_STATION } from "@/components/meridian/station-glyphs";
import { throughLine, type LineStop } from "@/components/track/the-through-line";
import type { AgentStation } from "@/lib/agent-vocabulary";

export function ThroughLine({
  stops,
  standing,
  stuckAt,
  stuckSaying,
  active,
  onOpen,
}: {
  stops: readonly LineStop[] | null | undefined;
  standing: AgentStation | null;
  stuckAt?: AgentStation | null;
  stuckSaying?: string | null;
  /** The artifact the pane is showing, so the line that opened it reads as open. */
  active?: string | null;
  onOpen?: (artifactId: string) => void;
}) {
  const lines = throughLine({ stops, standing, stuckAt, stuckSaying });
  /* Nothing has happened yet, so there is no story. The pane's own empty state
     owns that case and says it better than a heading over nothing could. */
  if (lines.length === 0) return null;

  return (
    <section
      data-mrd=""
      aria-label="What happened on this run"
      className="flex flex-col gap-mrd-3 border-b border-mrd-line pb-mrd-4 font-mrd"
    >
      <span className="mrd-eyebrow">What happened</span>
      <ol className="flex flex-col gap-mrd-3">
        {lines.map((l) => {
          const on = Boolean(l.opens) && active === l.opens;
          const body = (
            <>
              <span className="flex min-w-0 items-baseline gap-mrd-2">
                {/* The station's own mark, the one the road draws, so a line
                    here and a stop up there are visibly the same station. */}
                <span aria-hidden className="mt-px shrink-0 text-mrd-mute">
                  <StationGlyph kind={GLYPH_FOR_STATION[l.station]} size={12} />
                </span>
                <span className="min-w-0">
                  <span className="text-mrd-small font-medium text-mrd-ink">{l.name}</span>{" "}
                  <span className="text-mrd-small text-mrd-body">{l.did}</span>
                </span>
              </span>
              {/*
               * THE REASON, UNDER THE ACT AND QUIETER THAN IT. On Decide this
               * is the seat's own rationale and what it weighed against, which
               * had lived one click deep inside a card. On the station that
               * stopped it is the run's own words, in quotation marks, because
               * they are reported speech rather than this surface's claim.
               */}
              {l.because ? (
                <span className="mt-0.5 block max-w-[var(--mrd-measure-prose)] pl-[20px] text-mrd-data leading-mrd-prose text-mrd-mute">
                  {l.because}
                </span>
              ) : null}
            </>
          );
          return (
            <li key={l.station} className="min-w-0">
              {l.opens && onOpen ? (
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onOpen(l.opens!)}
                  className={`mrd-focus-inset -mx-1 flex w-full min-w-0 flex-col rounded-mrd-chip px-1 py-0.5 text-left transition-colors duration-[var(--mrd-d-press)] ${
                    on ? "bg-mrd-lift" : "hover:bg-mrd-hover"
                  }`}
                >
                  {body}
                </button>
              ) : (
                /* No artifact, no button. A control that opens nothing is worse
                   than a line of text, and the stopped station is exactly the
                   line that has nothing behind it. */
                <div className="-mx-1 flex min-w-0 flex-col px-1 py-0.5">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
