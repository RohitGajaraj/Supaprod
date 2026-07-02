import * as React from "react";
import { cn } from "@/lib/utils";
import { VerdictChip } from "@/components/obsidian";
import type { RoomGlance } from "@/lib/engine-room-glance";

export interface RoomCardProps {
  glance: RoomGlance;
  onOpen: () => void;
  className?: string;
}

/** One 2x2 glance card (§7 RoomCard anatomy). A real `<button>`: opening a
 * room is a state change (`?room=`), never a page navigation surprise. */
export const RoomCard = React.forwardRef<HTMLButtonElement, RoomCardProps>(
  ({ glance, onOpen, className }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={cn(
        "grid text-left outline-none",
        "hover:[background-color:#141416]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
        className,
      )}
      style={{
        gap: "7px",
        backgroundColor: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "18px 20px",
        transitionProperty: "background-color",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <span className="flex items-center gap-[10px]">
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "14px",
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
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--text-faint)" }}>
        {glance.question}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
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
