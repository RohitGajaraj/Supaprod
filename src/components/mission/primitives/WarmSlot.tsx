// WarmSlot (comprehension primitive 6.7, design-language-spec).
// The empty and first-run state as a standard component: empty states are
// journey entries, never a bare "No results" and never a blank. Three typed
// slots, always exactly one renders (there is no empty render path):
//   1. own-work: the user's real content exists, render it plainly.
//   2. sample: a seeded preview, honestly badged SAMPLE on the slot itself.
//   3. line: one honest sentence naming who acts next and when, plus the one
//      action that would create the data.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type WarmSlotKind = "own-work" | "sample" | "line";

/**
 * The slot selection, exported for tests and for callers that need to know
 * which slot will render (real work wins, then the sample, then the line).
 */
export function selectWarmSlot(input: { hasOwnWork: boolean; hasSample: boolean }): WarmSlotKind {
  if (input.hasOwnWork) return "own-work";
  if (input.hasSample) return "sample";
  return "line";
}

export interface WarmSlotLine {
  /** One honest sentence: who acts next and when. "Nothing needs you. The next sweep is at 2am." */
  text: string;
  /** The one action that creates the data ("Connect a source"). */
  actionLabel?: string;
  onAction?: () => void;
}

export interface WarmSlotProps {
  /** The user's real content, when any exists. Wins over everything. */
  ownWork?: ReactNode;
  /** A seeded sample preview; renders with the SAMPLE badge. */
  sample?: ReactNode;
  /** One quiet line of context under the sample ("Seeded from the Helio Labs workspace"). */
  sampleNote?: string;
  /** The honest fallback. Required: a WarmSlot can never render empty. */
  line: WarmSlotLine;
  className?: string;
}

function SampleBadge() {
  return (
    <span
      className="flex-none whitespace-nowrap rounded border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em]"
      style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-faint)" }}
    >
      Sample
    </span>
  );
}

export function WarmSlot({ ownWork, sample, sampleNote, line, className }: WarmSlotProps) {
  const kind = selectWarmSlot({
    hasOwnWork: ownWork !== undefined && ownWork !== null && ownWork !== false,
    hasSample: sample !== undefined && sample !== null && sample !== false,
  });

  if (kind === "own-work") {
    return <div className={className}>{ownWork}</div>;
  }

  if (kind === "sample") {
    return (
      <div
        className={cn("rounded-xl border border-dashed p-4", className)}
        style={{ borderColor: "var(--ink-hairline)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <SampleBadge />
          {sampleNote ? (
            <span className="text-[11.5px]" style={{ color: "var(--ink-subtle)" }}>
              {sampleNote}
            </span>
          ) : null}
        </div>
        {sample}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-xl border border-dashed px-6 py-[26px] text-center", className)}
      style={{ borderColor: "var(--ink-hairline)" }}
    >
      <p
        className="mx-auto max-w-[380px] text-[13px] leading-[1.55]"
        style={{ color: "var(--ink-body)" }}
      >
        {line.text}
      </p>
      {line.actionLabel ? (
        <div className="mt-3.5 inline-flex">
          <button
            type="button"
            onClick={line.onAction}
            className="ink-focus inline-flex h-8 items-center gap-[7px] whitespace-nowrap rounded-lg border px-3 text-[12.5px] font-medium transition-colors hover:bg-[var(--ink-raised)]"
            style={{
              background: "var(--ink-raised)",
              borderColor: "var(--ink-hairline)",
              color: "var(--ink-text)",
            }}
          >
            {line.actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
