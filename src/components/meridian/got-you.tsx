/**
 * ── WHAT A PIECE OF WORK GOT YOU: THE THINGS, THEN THE FACTS ABOUT THEM ───
 *
 * One strip. A row of chips naming what exists, each of which opens the thing it
 * names, and under it a line of quiet clauses that state facts and open nothing.
 * That division is the component: a person can tell at a glance which half they
 * can press, because the pressable half looks pressable and the other half never
 * does.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cofounder's completion screen (Mobbin, 2026-09-02) closes a run with **What
 * shipped** and **Verified** as two short lists rather than a log; Devin's puts
 * the PR link first, above the evidence. What is borrowed is the information
 * order: what you now have, then whether it is any good, then what it cost.
 *
 * ── WHY THIS KNOWS NOTHING ABOUT RUNS ─────────────────────────────────────
 * The version it replaces read two server functions, counted `spine_track_members`
 * by artifact kind, parsed a review column and formatted a cost. As one component
 * on one screen that was right. As a primitive it would be a strip that can only
 * ever describe a track. So the COUNTING stays in the surface (`run-tally.ts`,
 * which owns the artifact vocabulary and the refusals about a zero) and this
 * takes chips and clauses.
 *
 * ── A CHIP IS A CONTROL ONLY IF SOMETHING IS LISTENING ────────────────────
 * Without `onOpen` the chips are facts, with no pointer and no tab stop. That is
 * the contract `ToolStream` and the shell's stage chips already hold, and it is
 * the rule that stops a surface advertising a door nobody is behind.
 */
import type * as React from "react";

export type GotYouChip = {
  /** What the chip opens, and what `active` is compared against. */
  id: string;
  /** The person's own word for it, already counted: "spec", "2 prototypes". */
  label: string;
  /** A one-character mark, or nothing. Never a wrong one. */
  mark?: string;
};

export function GotYou({
  label,
  chips,
  clauses = [],
  link,
  active = null,
  onOpen,
}: {
  /** The region's accessible name. Never drawn: the chips are the heading. */
  label: string;
  chips: readonly GotYouChip[];
  /** Facts about the whole of it. None of them opens anything. */
  clauses?: readonly string[];
  /** The one thing that leaves, when there is one. */
  link?: { label: string; href: string } | null;
  /** Which chip is showing, so it can say so. */
  active?: string | null;
  /** Omit and the chips are plain facts with no pointer and no tab stop. */
  onOpen?: (id: string) => void;
}) {
  if (chips.length === 0 && clauses.length === 0 && !link) return null;

  return (
    /*
     * A STRIP, NOT A CARD. This sits above a bordered region inside a bordered
     * pane; a fourth box would make the column read as a dashboard of containers
     * rather than one surface. One hairline under it, and the type carries the
     * hierarchy: what you have in ink, everything about it quiet.
     */
    <section
      data-mrd=""
      aria-label={label}
      className="flex flex-col gap-mrd-2 border-b border-mrd-line pb-mrd-4 font-mrd"
    >
      <div className="flex flex-wrap items-center gap-mrd-2">
        {chips.map((c) => {
          const on = active === c.id;
          const body = (
            <>
              {c.mark ? <span className="text-mrd-data text-mrd-faint">{c.mark}</span> : null}
              <span>{c.label}</span>
            </>
          );
          if (!onOpen) {
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-mrd-chip bg-mrd-sink px-2 py-1 text-mrd-small text-mrd-body"
              >
                {body}
              </span>
            );
          }
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onOpen(c.id)}
              className={`mrd-focus-inset inline-flex items-center gap-1.5 rounded-mrd-chip px-2 py-1 text-mrd-small transition-colors duration-[var(--mrd-d-press)] ${
                on ? "bg-mrd-lift text-mrd-ink" : "bg-mrd-sink text-mrd-body hover:bg-mrd-hover"
              }`}
            >
              {body}
            </button>
          );
        })}

        {/* THE ONE THING THAT LEAVES, drawn as a link because it does. It sits
            with the things it belongs beside and keeps the one behaviour that
            separates it from them. */}
        {link ? (
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="mrd-focus-inset inline-flex items-center rounded-mrd-chip px-2 py-1 text-mrd-small font-medium text-mrd-you underline underline-offset-2"
          >
            {link.label}
          </a>
        ) : null}
      </div>

      {clauses.length > 0 ? (
        <p className="flex flex-wrap items-baseline gap-x-mrd-2 gap-y-mrd-1 text-mrd-base text-mrd-mute">
          {clauses.map((c, i) => (
            <Clause key={c} first={i === 0}>
              {c}
            </Clause>
          ))}
        </p>
      ) : null}
    </section>
  );
}

/** One clause, separated by a middot only when something precedes it. */
function Clause({ children, first }: { children: React.ReactNode; first: boolean }) {
  return (
    <>
      {first ? null : (
        /* Hidden from assistive tech: it is punctuation between facts that are
           each read out in full, and "middle dot" between every one of them is
           extra words a listener has to discard. */
        <span aria-hidden className="text-mrd-faint">
          ·
        </span>
      )}
      <span>{children}</span>
    </>
  );
}

export default GotYou;
