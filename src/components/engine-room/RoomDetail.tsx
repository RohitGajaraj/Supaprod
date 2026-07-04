import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, VerdictChip } from "@/components/obsidian";
import { ROOM_QUESTIONS, type RoomKey } from "@/lib/engine-room-glance";
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
        onOpen && "hover:[background-color:#141416] cursor-pointer active:scale-[0.995]",
        !onOpen && "cursor-default",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
      )}
      style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--hairline)",
        transitionProperty: "background-color, transform",
        transitionDuration: "var(--dur-press)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {subject}
      </span>
      <span
        className="shrink-0 text-right tabular-nums"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-muted)",
        }}
      >
        {value}
      </span>
      <span
        className="shrink-0 text-right uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
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
        fontSize: "var(--text-base)",
        color: "var(--text-subtle)",
        padding: "18px 0",
      }}
    >
      {message}
    </p>
  );
}

/** Suspense/loading fallback for a lazy room body: a quiet shimmer line at
 * the reading position, never a blank frame (LOOM §9). */
export function PanelPending() {
  return (
    <div aria-hidden="true" style={{ padding: "24px 0" }}>
      <span
        className="block rounded-full"
        style={{
          width: 220,
          height: 3,
          background:
            "linear-gradient(90deg, rgba(127,209,220,0), rgba(127,209,220,0.5), rgba(127,209,220,0))",
          backgroundSize: "280% 100%",
          animation: "cadShimmer 1.6s linear infinite",
        }}
      />
    </div>
  );
}

export function VerdictSentence({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-base)",
        lineHeight: 1.5,
        color: "var(--text-body)",
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}

// LOOM W2: /govern's live tabs folded into the four rooms (the audit's #1 IA
// insight: ONE Engine Room). Question-shaped rooms; ids are the ?view=
// routing contract. Labels are plain words in the room-detail mono voice.
export const ROOM_TABS: Record<RoomKey, RoomTab[]> = {
  spend: [
    { id: "trend", label: "TREND" },
    { id: "by-agent", label: "BY AGENT" },
    { id: "caps", label: "CAPS" },
    { id: "usage", label: "USAGE" },
  ],
  quality: [
    { id: "score", label: "SCORE" },
    { id: "suites", label: "SUITES" },
    { id: "drift", label: "DRIFT" },
    { id: "prompts", label: "PROMPTS" },
    { id: "proof", label: "PROOF" },
  ],
  safety: [
    { id: "rules", label: "RULES" },
    { id: "controls", label: "CONTROLS" },
    { id: "team", label: "TEAM" },
    { id: "house-rules", label: "HOUSE RULES" },
    { id: "incidents", label: "INCIDENTS" },
  ],
  record: [
    { id: "traces", label: "TRACES" },
    { id: "approvals", label: "APPROVALS" },
    { id: "ledger", label: "LEDGER" },
    { id: "support", label: "SUPPORT" },
  ],
};

/** Drill params carried on the URL so deep links land exactly (LOOM §9b):
 * ?suite= (Quality suites), ?agent= (Spend usage/by-agent), ?surface=
 * (Quality drift). */
export interface RoomDrillParams {
  suite?: string;
  agent?: string;
  surface?: string;
}

export interface RoomBodyProps extends RoomDrillParams {
  view: string;
}

const ROOM_BODY: Record<RoomKey, React.ComponentType<RoomBodyProps>> = {
  spend: SpendRoom,
  quality: QualityRoom,
  safety: SafetyRoom,
  record: RecordRoom,
};

export interface RoomDetailProps {
  room: RoomKey;
  view: string;
  drill: RoomDrillParams;
  onSetView: (view: string) => void;
  onBack: () => void;
}

/** The room-detail chassis shared by all four rooms (extensions §5): back
 * affordance, question header, mono sub-tabs, and the active body. Depth
 * never exceeds glance -> room -> sub-tab -> row detail (four levels). */
export function RoomDetail({ room, view, drill, onSetView, onBack }: RoomDetailProps) {
  const { rooms } = useEngineRoomGlance();
  const status = rooms.find((r) => r.key === room);
  const tabs = ROOM_TABS[room];
  const activeView = tabs.some((t) => t.id === view) ? view : tabs[0]!.id;
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
              fontSize: "var(--text-h2)",
              lineHeight: 1.25,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {ROOM_QUESTIONS[room]}
          </h2>
          <p
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.04em",
              color: status?.error ? "var(--madder-bright)" : "var(--text-muted)",
              margin: "6px 0 0",
              minHeight: "14px",
            }}
          >
            {status?.error ? "This room's summary did not load." : (status?.glance?.verdict ?? " ")}
          </p>
        </div>
        {status?.glance ? (
          <VerdictChip tone={status.glance.state === "watch" ? "WATCH" : "VALIDATED"}>
            {status.glance.state === "watch" ? "WATCH" : "HEALTHY"}
          </VerdictChip>
        ) : null}
      </div>

      <div
        role="tablist"
        className="flex flex-wrap"
        style={{ gap: "20px", marginBottom: "20px", borderBottom: "1px solid var(--hairline)" }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeView;
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
                !active && "hover:[color:var(--text-body)] cursor-pointer",
              )}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-floor)",
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

      <Body view={activeView} {...drill} />
    </div>
  );
}
