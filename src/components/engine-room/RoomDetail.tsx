import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { RecordStatus, type RecordTone } from "@/components/meridian/RecordsTable";
import { PanelReading, StateWord, ViewSwitch } from "./EngineChrome";
import { ReadFailed } from "@/components/meridian/surface-parts";
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
  /**
   * WHAT THE STATUS WORD MEANS, not what colour it should be.
   *
   * This was `statusColor: string` and every caller passed a raw CSS variable
   * off the Obsidian layer — `var(--madder-bright)`, `var(--moss-bright)`,
   * `var(--text-muted)`. That is the exact shape meridian.css bans: a colour
   * chosen at the call site is a colour nobody can audit, and it is how a
   * product ends up with three greens that mean three different things. The
   * tone is a MEANING now, and `RecordStatus` owns which token draws it.
   *
   * Omitting it leaves the word neutral, which is the honest default for a
   * value that is a measurement rather than a verdict (a percentage, a count).
   */
  tone?: RecordTone;
  onOpen?: () => void;
}

/**
 * Shared row anatomy: subject, then a right-aligned mono value, then the status
 * word. The subject truncates and the two right-hand facts never do, because
 * the numbers are what a scan is for.
 *
 * IT IS A REAL `<button>` ONLY WHEN IT OPENS SOMETHING. It used to render as a
 * disabled button either way, which is wrong twice over: a disabled control
 * announces itself to a screen reader as a thing that could act and currently
 * cannot, and it takes `cursor: default` while looking exactly like the row
 * beside it that does open. A row that goes nowhere is a div.
 *
 * The status cell is `RecordStatus`, Meridian's own, which draws a dot in the
 * tone's token plus the word — so the state survives greyscale and a caller
 * never picks a colour.
 */
export function Row({ subject, value, statusWord, tone, onOpen }: RowProps) {
  const body = (
    <>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-mrd-ink">
        {subject}
      </span>
      <span className="font-mrd-mono shrink-0 text-right text-[12px] text-mrd-mute tabular-nums">
        {value}
      </span>
      <span className="shrink-0 text-right text-[12px]">
        {tone ? (
          <RecordStatus tone={tone} label={statusWord} />
        ) : (
          <span className="text-mrd-mute">{statusWord}</span>
        )}
      </span>
    </>
  );

  if (!onOpen) {
    return (
      <div className="flex w-full items-center gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-mrd-4 last:border-0">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-mrd=""
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-mrd-4 text-left transition-colors last:border-0 hover:bg-mrd-hover",
        "mrd-focus-inset",
      )}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {body}
    </button>
  );
}

/** NOTHING EXISTS in this view, which is not a failed read and not a filter. */
export function EmptyRow({ message }: { message: string }) {
  return (
    <p data-mrd="" className="py-mrd-5 text-[13px] leading-mrd-prose text-mrd-mute">
      {message}
    </p>
  );
}

/** A failed read says so and offers one retry: an error may never wear an empty
 *  state's clothes. Shared by all four rooms' views. */
export function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-mrd-4">
      <ReadFailed onRetry={onRetry} retryLabel="Read it again">
        {message}
      </ReadFailed>
    </div>
  );
}

/**
 * A READ IN FLIGHT, at the reading position.
 *
 * It replaced a 220px shimmer bar drawn `aria-hidden`, which is the worst of
 * both: a decorative pulse tells a sighted reader something is coming and never
 * what, and tells a screen reader nothing at all. `PanelReading` says the word
 * in a live region. The name is kept so every room panel keeps compiling.
 */
export function PanelPending({ children }: { children?: React.ReactNode }) {
  return <PanelReading>{children ?? "Reading."}</PanelReading>;
}

export function VerdictSentence({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-mrd-5 max-w-[74ch] leading-mrd-prose text-mrd-prose text-mrd-body">{children}</p>
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

/**
 * The room-detail chassis: question header, sub-tabs, and the active body.
 * Depth never exceeds glance -> room -> sub-tab -> row detail.
 *
 * NOTHING RENDERS THIS TODAY. `_authenticated.engine-room.tsx` grew its own
 * chassis on 2026-08-06 and this one has been unreachable since; the LIVE
 * exports of this file are the row vocabulary above, which every room panel
 * imports. It is ported rather than left on the old tokens for one reason: it
 * was the last thing in this folder still drawing from the Obsidian layer
 * (`--font-pixel`, `--glacier`, `--madder-bright`), and unreachable code in a
 * ported file is exactly what gets copied into the next one. It is a candidate
 * for deletion, and that is flagged in the report rather than done here, since
 * removing an exported symbol is a wider change than a port.
 */
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
    <div data-mrd="" className="flex flex-col gap-mrd-6">
      <div className="flex flex-wrap items-start justify-between gap-mrd-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] leading-mrd-tight font-medium text-mrd-ink">
            {ROOM_QUESTIONS[room]}
          </h2>
          <p className="mt-mrd-2 leading-mrd-prose text-mrd-prose text-mrd-body">
            {status?.error
              ? "This room's summary did not load."
              : (status?.glance?.verdict ?? "\u00A0")}
          </p>
          {/* The single next step, plain-spoken, only when the room is on watch.
              Guidance text, not a status control, so it carries no accent: it
              is derived from the same real state as the verdict. */}
          {status?.glance?.action ? (
            <p className="mt-mrd-3 border-l-2 border-mrd-edge pl-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">
              <span className="mr-mrd-3 text-[10px] font-[650] tracking-mrd-label text-mrd-mute uppercase">
                Next
              </span>
              {status.glance.action}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-mrd-4">
          {/* The Record room's outward door: the public scorecard at /proof. A
              link role, never a second CTA, so it takes no fill and no accent. */}
          {room === "record" ? (
            <Link
              to="/proof"
              data-mrd=""
              className={cn(
                "rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink",
                "mrd-focus-inset",
              )}
            >
              Public scorecard
            </Link>
          ) : null}
          {status?.error != null ? (
            <StateWord state="failed" />
          ) : status?.glance ? (
            <StateWord state={status.glance.state} />
          ) : null}
        </div>
      </div>

      {/* The view switcher lives in the persistent room rail on desktop; this
          strip stays as the mobile sub-tab switcher, where the rail collapses. */}
      <div className="md:hidden">
        <ViewSwitch
          views={tabs.map((t) => ({ id: t.id, label: t.label }))}
          active={activeView}
          onSelect={onSetView}
          label={`${ROOM_QUESTIONS[room]} views`}
        />
      </div>

      {/* Descriptor strip: the one plain line that says what this view answers,
          so a click never lands on a bare table with no context. */}
      <p className="max-w-[74ch] text-[12.5px] leading-mrd-prose text-mrd-mute">
        {activeMeta.descriptor}
      </p>

      <Body view={activeView} {...drill} />

      {/* The technical trace, kept underneath and subtle (founder ruling
          2026-07-07): a PM reads the plain label above; an engineer finds the
          system term here. Plain on top, technical beneath, never at the front.
          No hue on either term: only the plain label lifts a step brighter than
          the connective words, so the mapping still catches the eye (Stress
          tests -> Gauntlet, Is it slipping? -> Drift) without a tint. */}
      <p className="border-t border-mrd-line-soft pt-mrd-4 text-[11.5px] text-mrd-faint">
        <span className="text-mrd-mute">{activeMeta.label}</span>
        {" · the engine calls this "}
        <span>{activeMeta.technical}</span>
      </p>
    </div>
  );
}
