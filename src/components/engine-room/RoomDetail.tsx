import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, VerdictChip } from "@/components/obsidian";
import { ROOM_QUESTIONS, type RoomGlance, type RoomKey } from "@/lib/engine-room-glance";
import { useEngineRoomGlance } from "./EngineRoomSurface";
import { SpendRoom } from "./rooms/SpendRoom";
import { QualityRoom } from "./rooms/QualityRoom";
import { SafetyRoom } from "./rooms/SafetyRoom";
import { RecordRoom } from "./rooms/RecordRoom";

export interface RoomTab {
  id: string;
  label: string;
}

export interface RowProps {
  subject: string;
  value: string;
  statusWord: string;
  statusColor: string;
  onOpen?: () => void;
}

/** Shared row anatomy (§7): subject + right-aligned mono value + a status
 * word. Every row is a real `<button>` (README §5.12); a row with no drill
 * target still renders as one, just non-interactive-looking (no hover). */
export function Row({ subject, value, statusWord, statusColor, onOpen }: RowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className={cn(
        "flex w-full items-center gap-3 text-left outline-none",
        onOpen && "hover:[background-color:#141416] cursor-pointer",
        !onOpen && "cursor-default",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
      )}
      style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--hairline)",
        transitionProperty: "background-color",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "13.5px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {subject}
      </span>
      <span
        className="shrink-0 text-right"
        style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--text-muted)" }}
      >
        {value}
      </span>
      <span
        className="shrink-0 text-right uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          letterSpacing: "0.11em",
          color: statusColor,
        }}
      >
        {statusWord}
      </span>
    </button>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "13px",
        color: "var(--text-faint)",
        padding: "18px 0",
      }}
    >
      {message}
    </p>
  );
}

export function VerdictSentence({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "14px",
        lineHeight: 1.5,
        color: "var(--text-body)",
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}

// Sub-tab labels verbatim from OBS-09 §9.
export const ROOM_TABS: Record<RoomKey, RoomTab[]> = {
  spend: [
    { id: "trend", label: "TREND" },
    { id: "by-agent", label: "BY AGENT" },
    { id: "caps", label: "CAPS" },
  ],
  quality: [
    { id: "score", label: "SCORE" },
    { id: "drift", label: "DRIFT" },
    { id: "suites", label: "SUITES" },
  ],
  safety: [
    { id: "rules", label: "RULES" },
    { id: "incidents", label: "INCIDENTS" },
  ],
  record: [
    { id: "traces", label: "TRACES" },
    { id: "ledger", label: "LEDGER" },
  ],
};

const ROOM_BODY: Record<RoomKey, React.ComponentType<{ view: string }>> = {
  spend: SpendRoom,
  quality: QualityRoom,
  safety: SafetyRoom,
  record: RecordRoom,
};

export interface RoomDetailProps {
  room: RoomKey;
  view: string;
  onSetView: (view: string) => void;
  onBack: () => void;
}

/** The room-detail chassis shared by all four rooms (extensions §5): back
 * affordance, question header, mono sub-tabs, and the active body. Depth
 * never exceeds glance -> room -> sub-tab -> row detail (four levels). */
export function RoomDetail({ room, view, onSetView, onBack }: RoomDetailProps) {
  const { rooms } = useEngineRoomGlance();
  const glance: RoomGlance | undefined = rooms.find((r) => r.key === room);
  const tabs = ROOM_TABS[room];
  const Body = ROOM_BODY[room];

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onBack]);

  return (
    <div>
      <Button variant="quiet" onClick={onBack} style={{ marginBottom: "16px" }}>
        ← ALL ROOMS
      </Button>

      <div className="flex items-start justify-between" style={{ marginBottom: "20px" }}>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 450,
              fontSize: "20px",
              lineHeight: 1.3,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {ROOM_QUESTIONS[room]}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.04em",
              color: "var(--text-muted)",
              margin: "4px 0 0",
            }}
          >
            {glance?.verdict}
          </p>
        </div>
        {glance ? (
          <VerdictChip tone={glance.state === "watch" ? "WATCH" : "VALIDATED"}>
            {glance.state === "watch" ? "WATCH" : "HEALTHY"}
          </VerdictChip>
        ) : null}
      </div>

      <div
        role="tablist"
        className="flex"
        style={{ gap: "20px", marginBottom: "20px", borderBottom: "1px solid var(--hairline)" }}
      >
        {tabs.map((tab) => {
          const active = tab.id === view;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSetView(tab.id)}
              className={cn(
                "uppercase outline-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
                !active && "hover:[color:var(--text-body)]",
              )}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9.5px",
                letterSpacing: "0.1em",
                color: active ? "var(--text-primary)" : "var(--text-subtle)",
                paddingBottom: "8px",
                borderBottom: active ? "2px solid var(--glacier)" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <Body view={view} />
    </div>
  );
}
