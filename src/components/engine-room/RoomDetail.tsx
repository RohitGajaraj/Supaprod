import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { VerdictChip, FlashlightTabs } from "@/components/obsidian";
import {
  ROOM_QUESTIONS,
  ROOM_TAB_META,
  type RoomKey,
  type RoomTabMeta,
} from "@/lib/engine-room-glance";
import { useEngineRoomGlance } from "./EngineRoomSurface";
import { SpendRoom } from "./rooms/SpendRoom";
import { QualityRoom } from "./rooms/QualityRoom";
import { SafetyRoom } from "./rooms/SafetyRoom";
import { RecordRoom } from "./rooms/RecordRoom";

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
        onOpen && "hover:[background-color:var(--raised)] cursor-pointer active:scale-[0.995]",
        !onOpen && "cursor-default",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
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
          fontFamily: "var(--font-sans)",
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
          color: "var(--text-muted)",
        }}
      >
        {value}
      </span>
      <span
        className="shrink-0 text-right uppercase"
        style={{
          fontFamily: "var(--font-mono)",
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
        fontFamily: "var(--font-sans)",
        color: "var(--text-subtle)",
        padding: "18px 0",
      }}
    >
      {message}
    </p>
  );
}

/** A failed read says so and offers one retry (LOOM §9b: an error may never
 * wear an empty state's clothes). Shared by all four rooms' views. */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: "18px 0" }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          color: "var(--madder-bright)",
          marginBottom: "10px",
        }}
      >
        {message}
      </p>
      <button
        type="button"
        className="uppercase cursor-pointer hover:underline active:opacity-80"
        onClick={onRetry}
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.11em",
          color: "var(--text-primary)",
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        RETRY
      </button>
    </div>
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
          background: "linear-gradient(90deg, transparent, var(--ds-gray-alpha-400), transparent)",
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
        fontFamily: "var(--font-sans)",
        lineHeight: 1.5,
        color: "var(--text-body)",
        marginBottom: "16px",
      }}
    >
      {children}
    </p>
  );
}

// LOOM W2 / naming model (founder ruling 2026-07-07): the four rooms fold
// every /govern tab. The tab metadata (plain outcome label + technical trace
// + one-line descriptor) is the single source in engine-room-glance.ts;
// ROOM_TABS re-exports it so the route's default-view lookup
// (ROOM_TABS[room][0].id) and every consumer stay pointed at one list.
export type RoomTab = RoomTabMeta;
export const ROOM_TABS = ROOM_TAB_META;

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
  const tabs = ROOM_TAB_META[room];
  const activeView = tabs.some((t) => t.id === view) ? view : tabs[0]!.id;
  const activeMeta = tabs.find((t) => t.id === activeView) ?? tabs[0]!;
  const Body = ROOM_BODY[room];

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Escape closes the innermost layer only: an open overlay (Radix marks
      // its dismissal via defaultPrevented) or a focused field keeps it.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.closest("input, textarea, select, [contenteditable='true']") ||
          t.closest("[role='dialog'], [role='menu'], [role='listbox']"))
      ) {
        return;
      }
      onBack();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onBack]);

  return (
    <div>
      <div
        className="flex items-start justify-between"
        style={{ gap: "16px", marginBottom: "20px" }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-pixel)",
              fontWeight: 400,
              lineHeight: 1.25,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "0.01em",
            }}
          >
            {ROOM_QUESTIONS[room]}
          </h2>
          <p
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.04em",
              color: status?.error ? "var(--madder-bright)" : "var(--text-muted)",
              margin: "6px 0 0",
              minHeight: "14px",
            }}
          >
            {status?.error
              ? "This room's summary did not load."
              : (status?.glance?.verdict ?? "\u00A0")}
          </p>
          {/* The single next step, plain-spoken, only when the room is on
              watch. Neutral gray per the 2026-07-11 glacier narrowing - this
              is guidance text, not a status control, so it no longer wears
              the machine-voice accent. Derived from the same real state as
              the verdict. */}
          {status?.glance?.action ? (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
                color: "var(--text-body)",
                margin: "10px 0 0",
                paddingLeft: "10px",
                borderLeft: "2px solid var(--hairline-strong)",
              }}
            >
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.12em",
                  color: "var(--text-subtle)",
                  marginRight: "8px",
                }}
              >
                Next
              </span>
              {status.glance.action}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: "12px" }}>
          {/* The Record room's outward door: the public scorecard at /proof.
              Glacier, the link role (2026-07-11 ruling); not a second CTA. */}
          {room === "record" ? (
            <Link
              to="/proof"
              className={cn(
                "uppercase outline-none hover:underline",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
              )}
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
                color: "var(--glacier)",
              }}
            >
              Public scorecard
            </Link>
          ) : null}
          {status?.glance ? (
            <VerdictChip tone={status.glance.state === "watch" ? "WATCH" : "VALIDATED"}>
              {status.glance.state === "watch" ? "WATCH" : "HEALTHY"}
            </VerdictChip>
          ) : null}
        </div>
      </div>

      {/* IA 2026-07-11: view switching moved into the persistent RoomRail on
          desktop; this standard tab bar (FlashlightTabs) stays as the mobile
          sub-tab switcher, where the rail collapses to a room strip. */}
      <div className="md:hidden" style={{ marginBottom: "14px" }}>
        <FlashlightTabs
          tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
          active={activeView}
          onSelect={onSetView}
          ariaLabel={`${ROOM_QUESTIONS[room]} views`}
          size="sm"
        />
      </div>

      {/* Descriptor strip: the one plain line that says what this view answers,
          so a click never lands on a bare table with no context. */}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          color: "var(--text-muted)",
          margin: "0 0 18px",
        }}
      >
        {activeMeta.descriptor}
      </p>

      <Body view={activeView} {...drill} />

      {/* The technical trace, kept underneath and subtle (founder ruling
          2026-07-07): a PM reads the plain label above; an engineer finds the
          system term here. Plain on top, technical beneath, never at the front.
          Neutral gray per the 2026-07-11 glacier narrowing (was blossom/glacier
          coloring the two terms) - only the plain label lifts a step brighter
          than the faint connective words, so the mapping still catches the
          eye (Stress tests -> Gauntlet, Is it slipping? -> Drift) without a
          chromatic tint. */}
      <p
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.12em",
          color: "var(--text-faint)",
          margin: "32px 0 0",
          paddingTop: "14px",
          borderTop: "1px solid var(--hairline-faint)",
        }}
      >
        <span style={{ color: "var(--text-subtle)" }}>{activeMeta.label}</span>
        {" · the engine calls this "}
        <span>{activeMeta.technical}</span>
      </p>
    </div>
  );
}
