// NextLine (comprehension primitive 6.5, design-language-spec).
// The forward door: every artifact card renders its next-step journey chips
// inline so nothing dead-ends, ever. One or two chips, plain-words labels
// from the journey catalog ("Design it" / "Build it" / "Ship it").
// Hovering a chip pre-lights the Spine slice it would run: the cheapest
// possible answer to "what will this do".

import { cn } from "@/lib/utils";
import type { MissionStage } from "@/lib/mission-vocabulary";

export interface JourneyDoor {
  /** Plain-words journey label ("Design it", "Check how it landed"). */
  label: string;
  /** The stage this door would run, for the Spine pre-light. */
  stage?: MissionStage;
  onGo?: () => void;
}

export interface NextLineProps {
  /** One or two forward doors. An artifact with zero doors is a CI failure, not a render path. */
  doors: readonly [JourneyDoor] | readonly [JourneyDoor, JourneyDoor];
  /** Pre-lights the Spine slice a hovered door would run; null on leave. */
  onPreview?: (stage: MissionStage | null) => void;
  className?: string;
}

export function NextLine({ doors, onPreview, className }: NextLineProps) {
  return (
    <div className={cn("mt-2.5 flex items-center gap-2", className)}>
      {doors.map((door) => (
        <button
          key={door.label}
          type="button"
          onClick={door.onGo}
          onMouseEnter={() => onPreview?.(door.stage ?? null)}
          onMouseLeave={() => onPreview?.(null)}
          onFocus={() => onPreview?.(door.stage ?? null)}
          onBlur={() => onPreview?.(null)}
          className="ink-focus inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-[13px] border px-[11px] text-xs transition-colors hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)]"
          style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-body)" }}
        >
          {door.label}
          <span aria-hidden className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
            {"→"}
          </span>
        </button>
      ))}
    </div>
  );
}
