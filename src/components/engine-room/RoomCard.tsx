import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, VerdictChip } from "@/components/obsidian";
import {
  ROOM_QUESTIONS,
  ROOM_NAMES,
  type RoomGlance,
  type RoomKey,
} from "@/lib/engine-room-glance";

// Tempo v5 §4: fill/radius/shadow come from the material-medium preset
// (className below). Only the stateful border (color varies per card state)
// stays here. PENDING VISUAL QA (2026-07-11): material-medium's background
// (--ds-background-100) may not match the legacy --card tone under
// [data-obsidian] scope - see DESIGN-TEMPO.md pending-issues note.
const CARD_BASE: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  padding: "18px 20px",
};

export interface RoomCardProps {
  glance: RoomGlance;
  onOpen: () => void;
  className?: string;
}

/** One 2x2 glance card (§7 RoomCard anatomy). A real `<button>`: opening a
 * room is a state change (`?room=`), never a page navigation surprise.
 * LOOM v4: top-light + ambient shadow; hover lifts one surface step and
 * brightens the top-light; press answers the finger (scale 0.98, 140ms). */
export const RoomCard = React.forwardRef<HTMLButtonElement, RoomCardProps>(
  ({ glance, onOpen, className }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={cn(
        "grid text-left outline-none material-medium",
        "hover:[background-color:#141416]",
        "hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.07),0_8px_24px_-12px_rgba(0,0,0,0.55)]",
        "active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
        className,
      )}
      style={{
        ...CARD_BASE,
        gap: "7px",
        transitionProperty: "background-color, box-shadow, transform",
        transitionDuration: "var(--dur-press)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <span className="flex items-center gap-[10px]">
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {glance.name}
        </span>
        {/* VALIDATED's moss hue is the exact HEALTHY token match; the tone label
         * is overridden to the room's own HEALTHY/WATCH word. */}
        <VerdictChip tone={glance.state === "watch" ? "WATCH" : "VALIDATED"}>
          {glance.state === "watch" ? "WATCH" : "HEALTHY"}
        </VerdictChip>
      </span>
      <span
        style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--text-subtle)" }}
      >
        {glance.question}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          letterSpacing: "0.04em",
          color: "var(--text-muted)",
        }}
      >
        {glance.verdict}
      </span>
    </button>
  ),
);
RoomCard.displayName = "RoomCard";

function ShimmerBar({ width, height = 10 }: { width: number | string; height?: number }) {
  return (
    <span
      aria-hidden="true"
      className="block rounded-full"
      style={{
        width,
        height,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.11), rgba(255,255,255,0.05))",
        backgroundSize: "280% 100%",
        animation: "cadShimmer 1.6s linear infinite",
      }}
    />
  );
}

/** The loading state matches the loaded card's layout (LOOM §9): name row,
 * question line, verdict line - shimmer where the number will land, never a
 * fabricated number. */
export function RoomCardSkeleton({ room }: { room: RoomKey }) {
  return (
    <div className="grid material-medium" style={{ ...CARD_BASE, gap: "9px" }}>
      <span className="flex items-center gap-[10px]">
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {ROOM_NAMES[room]}
        </span>
        <ShimmerBar width={56} height={16} />
      </span>
      <span
        style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--text-subtle)" }}
      >
        {ROOM_QUESTIONS[room]}
      </span>
      <ShimmerBar width="55%" />
    </div>
  );
}

/** An error may never wear an empty state's clothes (LOOM §9b): a room whose
 * reads failed says so, shows the cause, and offers one retry. */
export function RoomCardError({
  room,
  message,
  onRetry,
}: {
  room: RoomKey;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="grid material-medium"
      style={{ ...CARD_BASE, gap: "7px", borderColor: "rgba(224, 101, 87, 0.4)" }}
    >
      <span className="flex items-center gap-[10px]">
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {ROOM_NAMES[room]}
        </span>
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.1em",
            color: "var(--madder-bright)",
          }}
        >
          NOT LOADED
        </span>
      </span>
      <span
        style={{ fontFamily: "var(--font-ui)", fontSize: "12.5px", color: "var(--text-subtle)" }}
      >
        {ROOM_QUESTIONS[room]}
      </span>
      <span
        className="truncate"
        title={message}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-muted)",
        }}
      >
        {message}
      </span>
      <span>
        <Button variant="quiet" onClick={onRetry}>
          RETRY
        </Button>
      </span>
    </div>
  );
}
