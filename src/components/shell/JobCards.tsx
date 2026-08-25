import * as React from "react";

import type { WorkShape } from "@/lib/spine/route";

/**
 * THE FOUR JOBS A PERSON ARRIVES WITH, drawn as cards you pick from.
 *
 * WHY A LOCAL CARD AND NOT MERIDIAN'S `Cell`. The landing's copy is the
 * feature: "I have a problem and I do not know what to build" is the job, and
 * `Cell` truncates both of its lines unconditionally by its own ruling --
 * "a cell in a grid never should [wrap] ... So there is no prop"
 * (`surface-parts.tsx:1720-1724`). Shortening the sentence to fit a component
 * is backwards. So this keeps everything that makes a card read as Meridian --
 * the raised tone pair, ring-not-fill selection as a pseudo-element overlay,
 * the 44px floor, `rounded-mrd-ctl`, `Row`'s type rhythm -- and lets both lines
 * wrap. Filed under R-17 as `coordination/requests/mrd-jobcard.md`; swap and
 * delete this when MAIN promotes or names what was missed.
 *
 * THE COPY IS RULED, NOT AUTHORED HERE. Each `sub` paraphrases that WorkShape's
 * own waiver reason from `src/lib/spine/route.ts`, so a card can only describe
 * a route the product will actually take (`SPEC-ONRAMP.md` §1.3). No station
 * name appears on any face (R-01): these are jobs in the person's words.
 */

type Job = {
  shape: WorkShape;
  lead: string;
  sub: string;
  /** What the composer asks once this job is picked. */
  placeholder: string;
};

export const JOBS: Job[] = [
  {
    shape: "new-capability",
    lead: "I have a problem and I do not know what to build",
    sub: "It reads your sources first and comes back with what the pattern actually is.",
    placeholder: "What is going wrong?",
  },
  {
    shape: "existing-feature",
    lead: "I know what to build. Write it up.",
    sub: "The call is already made, so it starts on the written spec.",
    placeholder: "What are you building, and what should it do?",
  },
  {
    shape: "interface-change",
    lead: "Change something people see",
    sub: "It starts on the screen itself, not on the problem behind it.",
    placeholder: "What should change on the screen, and what should it do?",
  },
  {
    shape: "incident-fix",
    lead: "Something is broken right now",
    sub: "It goes straight to the fix. Nothing gets decided first.",
    placeholder: "What is broken?",
  },
];

/** Placeholder for the un-picked state, ruled at SPEC-ONRAMP §2.1. */
export const OPEN_PLACEHOLDER = "What are you changing, and what should it do?";

function JobCard({
  lead,
  sub,
  selected,
  onSelect,
}: {
  lead: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
}) {
  /*
   * A RING, NEVER A FILL, and drawn as an overlay rather than an inset shadow
   * for the reason `Cell` documents: the app-wide focus rule sets
   * `box-shadow: none` unlayered, so a selection drawn as a shadow vanishes the
   * moment a keyboard reader arrives on it.
   */
  const ring = selected
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-mrd-ink before:content-['']"
    : "";

  return (
    <button
      type="button"
      data-mrd=""
      data-selected={selected}
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex w-full items-start gap-[13px] min-h-11 rounded-mrd-ctl px-mrd-4 py-mrd-3 text-left transition-colors bg-mrd-lift enabled:hover:bg-mrd-lift-hover ${ring}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      <span className="min-w-0">
        <span className="block text-mrd-prose leading-[1.4] font-medium text-mrd-ink">{lead}</span>
        <span className="mt-1 block text-mrd-base leading-[1.4] text-mrd-mute">{sub}</span>
      </span>
    </button>
  );
}

/**
 * Four cards, two by two from the Meridian breakpoint, stacked below it (the
 * one line of stacking R-19 keeps). Picking again unpicks: the composer then
 * speaks for every kind of work, which is the default, not a fallback.
 */
export function JobCards({
  selected,
  onSelect,
}: {
  selected: WorkShape | null;
  onSelect: (shape: WorkShape | null) => void;
}) {
  return (
    <div data-mrd="" className="flex flex-col gap-mrd-3">
      <p className="mrd-meta">Pick one if it fits. Not picking is fine.</p>
      <div className="grid grid-cols-1 gap-mrd-3 md:grid-cols-2">
        {JOBS.map((job) => (
          <JobCard
            key={job.shape}
            lead={job.lead}
            sub={job.sub}
            selected={selected === job.shape}
            onSelect={() => onSelect(selected === job.shape ? null : job.shape)}
          />
        ))}
      </div>
    </div>
  );
}
