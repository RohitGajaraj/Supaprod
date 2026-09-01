/**
 * THE ROOM ROW VOCABULARY: what a row inside an Engine Room panel is made of.
 *
 * This file was `RoomDetail.tsx` and it no longer contains a `RoomDetail`.
 *
 * That component was a second room chassis. The route grew its own on
 * 2026-08-06 and nothing has rendered this one since; its own header said so
 * and called itself "a candidate for deletion", flagged rather than done
 * because "removing an exported symbol is a wider change than a port". It sat
 * there long enough that I ported it in U-035 to keep it consistent with a
 * change it could not affect -- work spent on code no person could reach, which
 * is the second cost of dead code and the one its own header warned about:
 * "unreachable code in a ported file is exactly what gets copied into the next
 * one".
 *
 * WHAT WENT: the RoomDetail component, `RoomDetailProps`, the ROOM_BODY map,
 * and `ROOM_TABS`/`RoomTab` -- a re-export of ROOM_TAB_META that nothing read,
 * which was a SECOND name for one list on a surface whose whole problem was
 * things having two names.
 *
 * WHAT STAYED, and is what every room panel actually imports: `Row`, the empty
 * and failed rows, `PanelPending`, `VerdictSentence`, and the `RoomDrillParams`
 * / `RoomBodyProps` pair the four room bodies are typed against.
 *
 * NAMED FOR WHAT IT HOLDS, following `meridian/surface-parts.tsx`, because a
 * file named for a component it does not contain is the same defect as a nav
 * row named for a page it does not open.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { RecordStatus, type RecordTone } from "@/components/meridian/RecordsTable";
import { PanelReading } from "./EngineChrome";
import { ReadFailed } from "@/components/meridian/surface-parts";

export interface RowProps {
  subject: string;
  value: string;
  /**
   * THE SECOND LINE UNDER THE SUBJECT: what this row is ABOUT that is not its
   * name. A surface, a suite, an owner -- a category word, never a number.
   *
   * Added 2026-09-01 because Record > Every run had no slot for one and was
   * joining it into `value` with " · ", which put a variable-length WORD in
   * front of the figures inside a cell that is mono, right-aligned and
   * `tabular-nums`. See the `stamp` note below for what that cost.
   */
  detail?: string;
  /**
   * THE TIME STAMP, in its own fixed slot at the right.
   *
   * The shape is `ReceiptsPanel`'s, which had already solved this on the
   * neighbouring tab: `font-mrd-mono text-mrd-data text-mrd-faint tabular-nums`
   * in a `shrink-0` cell of its own. A relative time is metadata about the row,
   * not one of its measurements, so it sits a full colour stop quieter than the
   * value and does not compete with it.
   *
   * IT CARRIES A FLOOR WIDTH, and that floor is what makes the column a column.
   * The `value` cell is `text-right`, but in a flex row a right-aligned cell
   * only lines up with the one above it if everything to its RIGHT is the same
   * width on both rows. `min-w` rather than a fixed `w` so a stamp longer than
   * the floor pushes the cell instead of spilling out of it.
   */
  stamp?: string;
  statusWord: string;
  /**
   * WHAT THE STATUS WORD MEANS, not what colour it should be.
   *
   * This was `statusColor: string` and every caller passed a raw CSS variable
   * off the Obsidian layer — `var(--mrd-fail-bright)`, `var(--mrd-pass-bright)`,
   * `var(--mrd-mute)`. That is the exact shape meridian.css bans: a colour
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
 * Shared row anatomy: subject, then a right-aligned mono value, then the
 * optional stamp, then the status word. The subject truncates and the
 * right-hand facts never do, because the numbers are what a scan is for.
 *
 * 2026-09-01: THE VALUE CELL HOLDS ONE KIND OF FACT NOW, and it took two new
 * optional slots to get there. Record > Every run was passing
 * `[surface, cost, time].join(" · ")` into `value` -- three unlike facts set at
 * one size, one weight, one colour and one FACE, down 40 rows. Two things were
 * wrong with it and both are structural rather than cosmetic:
 *
 *   1. A category word was set in the figure face. `font-mrd-mono` is reserved
 *      by meridian.css for "every number, duration, count, id and timestamp,
 *      and NOTHING else", and a surface name is none of those.
 *   2. The costs never lined up, in the one cell whose `text-right` and
 *      `tabular-nums` exist to line them up. A variable-length name LED the
 *      string, so the digits started at a different offset on every row.
 *
 * `detail` takes the category word down to a second line under the subject at
 * the `mrd-meta` role, and `stamp` takes the time into its own floored cell.
 * Both are optional, so `SpendRoom`, `QualityRoom` and `VerifyCockpit` render
 * byte-identically to before.
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
export function Row({ subject, value, detail, stamp, statusWord, tone, onOpen }: RowProps) {
  const body = (
    <>
      {/* A column, not a line, so `detail` lands UNDER the name it qualifies
          rather than beside the figures. Every element stays a `<span>`: the
          clickable branch below is a real `<button>`, which may only contain
          phrasing content, and a `<div>` in here makes the markup invalid and
          React refuses to hydrate it. `block`/`flex` change the box, not the
          content model. */}
      <span className="flex min-w-0 flex-1 flex-col gap-mrd-1">
        <span className="truncate text-mrd-label font-medium text-mrd-ink">{subject}</span>
        {detail ? <span className="mrd-meta truncate">{detail}</span> : null}
      </span>
      <span className="font-mrd-mono shrink-0 text-right text-mrd-small text-mrd-mute tabular-nums">
        {value}
      </span>
      {/* 56px is the measured floor: the longest stamp a caller produces is
          "30d ago" (Record reads a 30-day window), 7 mono characters at
          `--mrd-t-data` 11.5px, which sits just inside it. */}
      {stamp ? (
        <span className="font-mrd-mono min-w-[56px] shrink-0 text-right text-mrd-data text-mrd-faint tabular-nums">
          {stamp}
        </span>
      ) : null}
      <span className="shrink-0 text-right text-mrd-small">
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
    <p data-mrd="" className="py-mrd-5 text-mrd-base leading-mrd-prose text-mrd-mute">
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
    <p className="mb-mrd-5 max-w-[74ch] leading-mrd-prose text-mrd-prose text-mrd-body">
      {children}
    </p>
  );
}

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
