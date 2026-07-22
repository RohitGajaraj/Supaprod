// JourneyChips (Mission Control composer, front-end reimagining Phase 2).
// The composer-door journeys from src/lib/journeys.ts as activation chips.
// Data-driven: only journeys whose PRIMARY entry is the composer render here
// (J7 arrives through the armed outcome gate, never a chip). Activating a
// chip emits the journey id; the shell decides what a journey activation
// does. GAP-flagged journeys never reached journeys.ts, so claim cannot
// outrun wiring from this component.
//
// Craft: plain hairline chips (NextLine grammar), token vars only, no ember
// (the gate's Approve keeps the one ember locus per screen).

import { cn } from "@/lib/utils";
import { JOURNEYS, type Journey, type JourneyId } from "@/lib/journeys";

/** The journeys the composer offers: primary entry is the composer chip. */
export const COMPOSER_JOURNEYS: readonly Journey[] = JOURNEYS.filter(
  (j) => j.entry === "composer-chip",
);

export interface JourneyChipsProps {
  onActivate: (id: JourneyId) => void;
  /** The chip the typed intent points at (journeyForIntent); quiet emphasis. */
  suggestedId?: JourneyId | null;
  /** Override for tests or narrower surfaces; defaults to the composer set. */
  journeys?: readonly Journey[];
  className?: string;
}

export function JourneyChips({
  onActivate,
  suggestedId = null,
  journeys = COMPOSER_JOURNEYS,
  className,
}: JourneyChipsProps) {
  if (journeys.length === 0) return null;
  return (
    <div
      data-testid="journey-chips"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {journeys.map((journey) => {
        const suggested = journey.id === suggestedId;
        return (
          <button
            key={journey.id}
            type="button"
            data-journey={journey.id}
            data-suggested={suggested || undefined}
            onClick={() => onActivate(journey.id)}
            className="ink-focus inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-[13px] border px-[11px] text-xs transition-colors hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)]"
            style={
              suggested
                ? { borderColor: "var(--ink-subtle)", color: "var(--ink-text)" }
                : { borderColor: "var(--ink-hairline)", color: "var(--ink-body)" }
            }
          >
            {journey.label}
            <span aria-hidden className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
              {"→"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
