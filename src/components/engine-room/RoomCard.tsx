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
      /* THE RING IS INHERITED, NOT DECLARED. This card used to ask for one in
       * its own class names and never got it: the authenticated app mounts
       * `[data-obsidian]` on <html>, `src/styles.css` carries an UNLAYERED
       * `[data-obsidian] :focus-visible` rule, and unlayered CSS beats every
       * layer whatever the specificity, so a Tailwind utility (which lands in
       * the `utilities` layer) is permanently inert here. The old declaration
       * was wrong twice over: it lost the cascade AND it named the legacy
       * `--focus-ring` alias rather than Meridian's status-free neutral, so it
       * would have painted the wrong colour even if it had won. `data-mrd` is
       * the mechanism that actually paints, per the rule in meridian.css. */
      data-mrd=""
      className={cn(
        "grid text-left material-medium",
        "hover:[background-color:var(--hover)]",
        "hover:[box-shadow:var(--shadow-raised)]",
        "active:scale-[0.98]",
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
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {glance.name}
        </span>
        {/* VALIDATED's moss hue is the exact HEALTHY token match; the tone label
         * is overridden to the room's own HEALTHY/WATCH word.
         *
         * NOT SET UP takes PENDING, the one tone in the chip's vocabulary that
         * carries no hue, and that is the whole reason it is right: an absent
         * control is not an outcome, so it must not borrow moss (which would
         * repeat the exact defect this state was added to fix, a room with no
         * guardrails reading as validated) and it must not borrow marigold
         * (which says something went wrong when nothing has).
         *
         * NOTE FOR WHOEVER MOUNTS THIS: as of 2026-08-06 nothing imports
         * EngineRoomGlance, so this card renders nowhere. It is kept correct
         * rather than left to rot, because a stale third branch is how a
         * remounted component ships a lie. */}
        <VerdictChip
          tone={
            glance.state === "watch"
              ? "WATCH"
              : glance.state === "unconfigured"
                ? "PENDING"
                : "VALIDATED"
          }
        >
          {glance.state === "watch"
            ? "WATCH"
            : glance.state === "unconfigured"
              ? "NOT SET UP"
              : "HEALTHY"}
        </VerdictChip>
      </span>
      <span style={{ fontFamily: "var(--font-sans)", color: "var(--text-subtle)" }}>
        {glance.question}
      </span>
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
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
          "linear-gradient(90deg, var(--ds-gray-alpha-100), var(--ds-gray-alpha-300), var(--ds-gray-alpha-100))",
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
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {ROOM_NAMES[room]}
        </span>
        <ShimmerBar width={56} height={16} />
      </span>
      <span style={{ fontFamily: "var(--font-sans)", color: "var(--text-subtle)" }}>
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
      style={{
        ...CARD_BASE,
        gap: "7px",
        borderColor: "color-mix(in srgb, var(--madder) 40%, transparent)",
      }}
    >
      <span className="flex items-center gap-[10px]">
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-sans)",
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
            letterSpacing: "0.1em",
            color: "var(--madder-bright)",
          }}
        >
          NOT LOADED
        </span>
      </span>
      <span style={{ fontFamily: "var(--font-sans)", color: "var(--text-subtle)" }}>
        {ROOM_QUESTIONS[room]}
      </span>
      <span
        className="truncate"
        title={message}
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--text-muted)",
        }}
      >
        {message}
      </span>
      <span>
        <Button variant="tertiary" onClick={onRetry}>
          RETRY
        </Button>
      </span>
    </div>
  );
}
