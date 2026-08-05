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
 * WHY THIS REPLACES THE ONE-LINE `Row` AND WHERE THE ROOM COMES FROM.
 * The ratchet (docs/conventions/surface-discipline.md) forbids paying for an
 * addition by shrinking something, so nothing here is paid for that way:
 *
 * 1. THE VERTICAL SPACE IS TAKEN FROM EMPTINESS. The overview was a title,
 *    four 44px rows and one "Reading from" row: roughly 250px of a work region
 *    that is nine hundred tall. Every figure strip lands in space that was
 *    blank, and nothing below it is displaced off a screen it used to fit on.
 * 2. NOTHING GOT SMALLER. The room name keeps `--sp-text-body` and its strong
 *    weight, the verdict keeps its own line, "Needs a look" keeps its place and
 *    its warn colour. The figures are ADDITIONAL lines at the metadata size the
 *    system already uses for a row's second line.
 * 3. THE ROWS STOP BEING `tight`. That is a capability gain, not a loss: a
 *    tight row truncates its verdict with an ellipsis, and Safety's new
 *    unconfigured verdict is longer than the old one and must not be cut.
 * 4. THE NEXT-STEP SENTENCE IS ADDED, NOT MOVED. The route's own note said it
 *    was withheld from the overview because it names a tab that is not on
 *    screen yet. It still names that tab; what changed is that the overview is
 *    now where you decide WHICH ROOM to open, and "raise it in Limits" is the
 *    single fact that decides it. The room's context column keeps its copy, so
 *    nothing was taken from the room to pay for this.
 *
 * The one thing that did change shape: four multi-line blocks separated by a
 * hairline read as a wall of text, so each room sits on the system's own
 * recessed `.sp-cell` ground. That is the existing primitive for "a thing you
 * scan and then open", it is tinted rather than bordered (one bordered
 * container per region is the cap), and its hover is computed from its own tint
 * so it cannot drift from the rest of the system.
 */

import * as React from "react";
import { Num, Who } from "@/components/shell/primitives";
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

/** The state word, in the system's own outcome colours. `unconfigured` is
 *  deliberately NOT the warn amber that `watch` wears: nothing has gone wrong,
 *  a control is simply absent, and dressing an absence as a failure is how a
 *  governance surface teaches people to ignore its colours. */
function StateWord({ state }: { state: RoomGlance["state"] }) {
  if (state === "watch") return <span className="sp-warn">Needs a look</span>;
  if (state === "unconfigured") return <span style={{ color: "var(--sp-mute)" }}>Not set up</span>;
  return null;
}

/**
 * One figure: the number first at reading size, its plain label under it, and
 * the clause that bounds it under that. Three lines, because a number whose
 * window is not stated is a number you cannot act on.
 *
 * EVERY ELEMENT IN THIS FILE IS A `<span>` WITH `display: block`, AND THAT IS A
 * CORRECTNESS CONSTRAINT RATHER THAN A STYLE ONE. A card is a real `<button>`
 * so it is tabbable and answers Space and Enter without being asked, and a
 * `<button>` may only contain phrasing content. A `<div>` in here makes the
 * markup invalid and React refuses to hydrate it — the identical defect the
 * `Empty` primitive carries a note about, caught in a browser on /today.
 */
function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <span style={{ display: "block", minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontSize: "var(--sp-text-body)",
          color: "var(--sp-ink)",
          lineHeight: "var(--sp-leading-row)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={value}
      >
        <Num>{value}</Num>
      </span>
      <span
        style={{
          display: "block",
          fontSize: "var(--sp-text-label)",
          color: "var(--sp-body)",
          lineHeight: "var(--sp-leading-row)",
        }}
      >
        {label}
      </span>
      {note ? (
        <span
          style={{
            display: "block",
            fontSize: "var(--sp-text-data)",
            color: "var(--sp-mute)",
            lineHeight: "var(--sp-leading-row)",
          }}
        >
          {note}
        </span>
      ) : null}
    </span>
  );
}

/** The shared shell, so the ready / loading / failed cards are the same object
 *  in three states rather than three components that drift apart. A card that
 *  did not load must occupy the same ground as one that did, or the page
 *  reflows under the reader as the four reads land. */
function CardShell({
  children,
  onOpen,
  label,
}: {
  children: React.ReactNode;
  onOpen?: () => void;
  label?: string;
}) {
  const inner = (
    <span
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-space-2)",
        width: "100%",
        minWidth: 0,
      }}
    >
      {children}
    </span>
  );
  const style: React.CSSProperties = {
    alignItems: "stretch",
    padding: "var(--sp-space-3) var(--sp-space-4)",
  };
  if (!onOpen) {
    return (
      <div className="sp-cell" data-tone="recessed" style={style}>
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="sp-cell"
      data-tone="recessed"
      style={style}
      aria-label={label}
      onClick={onOpen}
    >
      {inner}
    </button>
  );
}

/** The head line every state shares: the room's name, then whatever that state
 *  can honestly put beside it. */
function Head({ room, trailing }: { room: RoomKey; trailing?: React.ReactNode }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "var(--sp-space-2)",
        flexWrap: "wrap",
        fontSize: "var(--sp-text-body)",
        color: "var(--sp-ink)",
        lineHeight: "var(--sp-leading-row)",
      }}
    >
      <Who>{ROOM_NAMES[room]}</Who>
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
            <span style={{ color: "var(--sp-mute)" }}>·</span>
            <span style={{ color: "var(--sp-body)" }}>{glance.verdict}</span>
            <StateWord state={glance.state} />
          </>
        }
      />

      {/* The figures. `auto-fit` rather than a fixed column count: a room with
          three figures fills its width instead of leaving a dead fourth
          column, and the strip wraps to two rows on a narrow region rather
          than clipping or scrolling. */}
      {glance.figures.length > 0 ? (
        <span
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
            gap: "var(--sp-space-2) var(--sp-space-4)",
            paddingTop: "var(--sp-space-1)",
          }}
        >
          {glance.figures.map((f) => (
            <Figure key={f.label} label={f.label} value={f.value} note={f.note} />
          ))}
        </span>
      ) : null}

      {/* The newest dated thing the room holds. Its time is rendered only when
          the source row carried one, so this line never dates an event we
          cannot date. */}
      {glance.latest ? (
        <span
          style={{
            display: "flex",
            gap: "var(--sp-space-2)",
            alignItems: "baseline",
            fontSize: "var(--sp-text-meta)",
            color: "var(--sp-mute)",
            minWidth: 0,
          }}
        >
          <span style={{ flex: "none" }}>Latest</span>
          <span
            style={{
              color: "var(--sp-body)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={glance.latest.what}
          >
            {glance.latest.what}
          </span>
          {stamp ? (
            <span style={{ flex: "none" }}>
              <Num>{stamp}</Num>
            </span>
          ) : null}
        </span>
      ) : null}

      {/* The next step, on the surface where the door is chosen. */}
      {glance.action ? (
        <span
          style={{
            fontSize: "var(--sp-text-meta)",
            color: "var(--sp-body)",
            lineHeight: "var(--sp-leading-row)",
          }}
        >
          {glance.action}
        </span>
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
      <Head room={room} trailing={<span style={{ color: "var(--sp-mute)" }}>· Reading.</span>} />
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
      <Head room={room} trailing={<span className="sp-fail">did not load</span>} />
      <span
        style={{
          fontSize: "var(--sp-text-meta)",
          color: "var(--sp-mute)",
          lineHeight: "var(--sp-leading-row)",
        }}
      >
        {message}
      </span>
      <span>
        <button type="button" className="sp-block-more" onClick={onRetry}>
          Read this room again
        </button>
      </span>
    </CardShell>
  );
}
