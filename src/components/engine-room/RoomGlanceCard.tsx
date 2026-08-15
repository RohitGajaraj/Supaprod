/**
 * ONE ROOM'S DOOR ON THE ENGINE ROOM OVERVIEW, with the volumes on it.
 *
 * FOUNDER, 2026-08-06: "We have four sections but those are NOT SPEAKING TO THE
 * VOLUMES AND DEPTH until and unless the user clicks and checks." He is right
 * about the mechanism as well as the feeling. `useEngineRoomGlance` already
 * fetches nine reads and hands the builders four sentences' worth of them; the
 * rest — call counts, token volume, the day-over-day move, the costliest model,
 * the judge score, the drift that opened, the guardrail floor, the steps
 * recorded, the sealed receipt count — was computed on the server, sent over
 * the wire, and dropped on the floor. This card spends none of it twice.
 *
 * WHY THIS REPLACES THE ONE-LINE ROW AND WHERE THE ROOM COMES FROM.
 * The ratchet (docs/conventions/surface-discipline.md) forbids paying for an
 * addition by shrinking something, so nothing here is paid for that way:
 *
 * 1. THE VERTICAL SPACE IS TAKEN FROM EMPTINESS. The overview was a title,
 *    four 44px rows and one "Reading from" row: roughly 250px of a work region
 *    that is nine hundred tall. Every figure strip lands in space that was
 *    blank, and nothing below it is displaced off a screen it used to fit on.
 * 2. NOTHING GOT SMALLER. The room name keeps its reading size and its strong
 *    weight, the verdict keeps its own line, the state word keeps its place.
 *    The figures are ADDITIONAL lines at the metadata size the system already
 *    uses for a row's second line.
 * 3. THE ROWS STOP BEING TIGHT. That is a capability gain, not a loss: a tight
 *    row truncates its verdict with an ellipsis, and Safety's unconfigured
 *    verdict is longer than the old one and must not be cut.
 * 4. THE NEXT-STEP SENTENCE IS ADDED, NOT MOVED. The overview is where you
 *    decide WHICH ROOM to open, and "raise it in Limits" is the single fact
 *    that decides it. The room's own header keeps its copy.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-15: PORTED TO MERIDIAN, and two things about it are new.
 *
 * THE CARD IS A CARD AGAIN. It used to be built from about sixty inline style
 * objects reading `--sp-*` values, on top of the `.sp-cell` class, because the
 * legacy grid primitive was written for a two-line cell and this is a
 * six-figure panel. Every one of those values now comes from a Tailwind
 * utility over `--mrd-*`, so the ground, the radius, the ink ladder and the
 * hover all move with the system instead of being re-derived here.
 *
 * THE STATE WORD IS BOUND TO A TOKEN. "Needs a look" was `.sp-warn` and "Not
 * set up" was a hand-written `var(--sp-mute)`, which is the shape meridian.css
 * bans: a colour chosen at the call site is a colour nobody can audit.
 * `StateWord` owns all four states now and the argument for each token is in
 * EngineChrome.tsx's header.
 *
 * EVERY ELEMENT INSIDE THE CARD IS STILL A `<span>`, AND THAT IS A CORRECTNESS
 * CONSTRAINT RATHER THAN A STYLE ONE. A card is a real `<button>` so it is
 * tabbable and answers Space and Enter without being asked, and a `<button>`
 * may only contain phrasing content. A `<div>` in here makes the markup invalid
 * and React refuses to hydrate it — the identical defect caught in a browser on
 * /today. `display: block` is applied through `block`/`flex`/`grid` utilities,
 * which changes the box and not the content model.
 */

import type { ReactNode } from "react";

import { Figure, FOCUS_RING, StateWord } from "./EngineChrome";
import { ROOM_NAMES, type RoomKey, type RoomGlance } from "@/lib/engine-room-glance";

/**
 * A terse relative stamp. Local rather than shared for the reason nine other
 * files in this codebase kept theirs local: the shared one lives in
 * `components/product/format.ts` and is owned by a different surface, and a
 * formatter is cheaper to copy than a cross-surface dependency is to keep
 * honest. Returns null rather than a dash when there is no time, so the caller
 * renders nothing at all instead of an empty slot pretending to hold a date.
 */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * One figure: the number first at reading size, its plain label under it, and
 * the clause that bounds it under that. Three lines, because a number whose
 * window is not stated is a number you cannot act on.
 */
function GlanceFigure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <span className="block min-w-0">
      <span className="block truncate text-[13px] leading-snug" title={value}>
        <Figure>{value}</Figure>
      </span>
      <span className="block text-[12px] leading-snug text-mrd-body">{label}</span>
      {note ? <span className="block text-[11.5px] leading-snug text-mrd-mute">{note}</span> : null}
    </span>
  );
}

/**
 * The shared shell, so the ready, reading and failed cards are one object in
 * three states rather than three components that drift apart. A card that did
 * not load must occupy the same ground as one that did, or the page reflows
 * under the reader as the four reads land.
 */
function CardShell({
  children,
  onOpen,
  label,
}: {
  children: ReactNode;
  onOpen?: () => void;
  label?: string;
}) {
  const inner = <span className="flex w-full min-w-0 flex-col gap-mrd-3">{children}</span>;
  const face =
    "flex w-full items-stretch rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left";

  if (!onOpen) return <div className={face}>{inner}</div>;

  return (
    <button
      type="button"
      className={`${face} transition-colors hover:bg-mrd-lift ${FOCUS_RING}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
      aria-label={label}
      onClick={onOpen}
    >
      {inner}
    </button>
  );
}

/** The head line every state shares: the room's name, then whatever that state
 *  can honestly put beside it. */
function Head({ room, trailing }: { room: RoomKey; trailing?: ReactNode }) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-mrd-3 gap-y-mrd-1">
      <span className="text-[13px] font-medium text-mrd-ink">{ROOM_NAMES[room]}</span>
      {trailing}
    </span>
  );
}

export function RoomGlanceCard({ glance, onOpen }: { glance: RoomGlance; onOpen: () => void }) {
  const stamp = ago(glance.latest?.at);
  return (
    <CardShell onOpen={onOpen} label={`Open the ${ROOM_NAMES[glance.key]} room`}>
      <Head
        room={glance.key}
        trailing={
          <>
            <span className="min-w-0 text-[12.5px] text-mrd-body">{glance.verdict}</span>
            <StateWord state={glance.state} />
          </>
        }
      />

      {/* The figures. `auto-fit` rather than a fixed column count: a room with
          three figures fills its width instead of leaving a dead fourth
          column, and the strip wraps to two rows on a narrow region rather
          than clipping or scrolling. */}
      {glance.figures.length > 0 ? (
        <span className="grid gap-x-mrd-4 gap-y-mrd-2 pt-mrd-1 [grid-template-columns:repeat(auto-fit,minmax(132px,1fr))]">
          {glance.figures.map((f) => (
            <GlanceFigure key={f.label} label={f.label} value={f.value} note={f.note} />
          ))}
        </span>
      ) : null}

      {/* The newest dated thing the room holds. Its time is rendered only when
          the source row carried one, so this line never dates an event we
          cannot date. */}
      {glance.latest ? (
        <span className="flex min-w-0 items-baseline gap-mrd-3 text-[12px] text-mrd-mute">
          <span className="shrink-0">Latest</span>
          <span className="min-w-0 truncate text-mrd-body" title={glance.latest.what}>
            {glance.latest.what}
          </span>
          {stamp ? (
            <span className="font-mrd-mono shrink-0 text-[11.5px] text-mrd-faint tabular-nums">
              {stamp}
            </span>
          ) : null}
        </span>
      ) : null}

      {/* The next step, on the surface where the door is chosen. */}
      {glance.action ? (
        <span className="text-[12px] leading-snug text-mrd-body">{glance.action}</span>
      ) : null}
    </CardShell>
  );
}

/** Reading. The name is real, so the card is identifiable while it loads, and
 *  nothing else is drawn: a shimmer where a number will land is still a shape
 *  that says "a number is coming", and this surface has four of them at once. */
export function RoomGlanceCardPending({ room }: { room: RoomKey }) {
  return (
    <CardShell>
      <Head
        room={room}
        trailing={
          <span className="text-[12.5px] text-mrd-mute" role="status" aria-live="polite">
            Reading.
          </span>
        }
      />
    </CardShell>
  );
}

/** A read that failed. No verdict, no figures: a room that did not load never
 *  wears a healthy one's clothes, and it certainly never wears its volumes. */
export function RoomGlanceCardFailed({
  room,
  message,
  onRetry,
}: {
  room: RoomKey;
  message: string;
  onRetry: () => void;
}) {
  return (
    <CardShell>
      <Head room={room} trailing={<StateWord state="failed" />} />
      <span className="text-[12px] leading-snug text-mrd-mute">{message}</span>
      <span>
        {/*
         * A control inside the shell rather than the shell itself. The card is
         * a plain div in this state, so this button is not nested inside
         * another, and the retry is the only thing on it that can act: opening
         * a room whose read failed would land the reader on a page with no
         * summary and no explanation of why.
         */}
        <button
          type="button"
          onClick={onRetry}
          className={`rounded-mrd-xs text-[12.5px] text-mrd-mute transition-colors hover:text-mrd-ink ${FOCUS_RING}`}
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Read this room again
        </button>
      </span>
    </CardShell>
  );
}
