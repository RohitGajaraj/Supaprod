/**
 * AGENT PRESENCE. One seat, at work, as a person would point at it.
 *
 * ── WHY (founder, 2026-09-08) ────────────────────────────────────────────
 * "The work that the AI does is not visually seen." The product had a grey
 * dot and the word "Running". This is the primitive every surface draws a
 * working seat with: its identity (a colour that stays the same for that
 * seat everywhere it appears, a glyph when the caller has one, its name),
 * what it is doing right now (a verb and the thing it is doing it to), and
 * how long it has been at it (a clock that ticks). The founder's reference
 * image is twenty-three cursors on one screen, each its own colour; this is
 * the unit that picture is made of.
 *
 * ── THE COLOUR IS IDENTITY, NEVER STATUS (law 3, law 4) ─────────────────
 * A seat's colour comes from the categorical set (`--mrd-viz-1..4`), never
 * from a status hue, and it is the same for that seat on the home strip, in
 * the transcript row, on the diff it is writing and on its cursor. Status is
 * still said by the five status words around it. `presenceColour` is a
 * stable hash so two surfaces never disagree about which colour a seat is.
 *
 * ── THE BREATH IS THE ONLY MOTION ────────────────────────────────────────
 * The dot breathes at the machine cadence StatusChip uses (2400ms), inline
 * so the reduced-motion block in meridian.css can stop it. Nothing else
 * moves. A presence that spins, shimmers or slides is theatre.
 */
import * as React from "react";

import { formatElapsed } from "./run-rows";

export const PRESENCE_COLOURS = [
  "--mrd-viz-1",
  "--mrd-viz-2",
  "--mrd-viz-3",
  "--mrd-viz-4",
] as const;

/** A seat's colour, the same everywhere, from its name alone. */
export function presenceColour(seat: string): string {
  let h = 0;
  for (let i = 0; i < seat.length; i++) h = (h * 31 + seat.charCodeAt(i)) >>> 0;
  return PRESENCE_COLOURS[h % PRESENCE_COLOURS.length]!;
}

function useClock(since: string | null | undefined): string | null {
  const started = since ? Date.parse(since) : NaN;
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!Number.isFinite(started)) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [started]);
  if (!Number.isFinite(started)) return null;
  return formatElapsed(Math.max(0, (now - started) / 1000));
}

/** The dot alone, for a cursor, a row gutter or a diff line's writer mark. */
export function PresenceDot({
  colour,
  alive = true,
  size = 8,
  className = "",
}: {
  /** A token name, e.g. "--mrd-viz-2". */
  colour: string;
  alive?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, background: `var(${colour})` }}
    >
      {alive ? (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 0 ${Math.max(2, Math.round(size / 3))}px var(${colour})`,
            opacity: 0.35,
            animation: "mrd-attention 2400ms var(--mrd-ease-soft) infinite",
          }}
        />
      ) : null}
    </span>
  );
}

export function AgentPresence({
  seat,
  verb,
  object,
  since,
  colour,
  glyph,
  alive = true,
  onOpen,
  className = "",
}: {
  /** The seat's display name: "Scribe", "Studio". */
  seat: string;
  /** What it is doing, first person continuous: "writing the spec". */
  verb?: string | null;
  /** The thing it is doing it to: a file path, a spec title. */
  object?: string | null;
  /** ISO. The clock ticks from here. */
  since?: string | null;
  /** A token name. Defaults to `presenceColour(seat)`. */
  colour?: string;
  /** The seat's own glyph, when the caller has one. */
  glyph?: React.ReactNode;
  /** False once the seat has finished: the dot stops breathing, the clock
   *  stops, and the row reads as a record rather than a presence. */
  alive?: boolean;
  onOpen?: () => void;
  className?: string;
}) {
  const tone = colour ?? presenceColour(seat);
  const clock = useClock(alive ? since : null);
  const line = [verb, object].filter(Boolean).join(" ");

  const body = (
    <>
      <span
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--mrd-lift)", boxShadow: `inset 0 0 0 1px var(${tone})` }}
      >
        {glyph ?? <PresenceDot colour={tone} alive={alive} size={8} />}
      </span>
      <span className="min-w-0 flex-1 truncate text-mrd-base leading-mrd-snug">
        <span className="font-medium text-mrd-ink">{seat}</span>
        {line ? <span className="text-mrd-body"> is {line}</span> : null}
      </span>
      {clock ? (
        <span className="font-mrd-mono shrink-0 text-mrd-data tabular-nums text-mrd-mute">
          {clock}
        </span>
      ) : null}
    </>
  );

  const shape = "flex w-full items-center gap-mrd-3 rounded-mrd-ctl px-mrd-3 py-mrd-2 text-left";

  if (onOpen) {
    return (
      <button
        type="button"
        data-mrd=""
        data-alive={alive}
        onClick={onOpen}
        aria-label={`${seat}${line ? ` is ${line}` : ""}${clock ? `, ${clock}` : ""}`}
        className={`${shape} transition-colors hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] ${className}`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {body}
      </button>
    );
  }
  return (
    <div data-mrd="" data-alive={alive} className={`${shape} ${className}`}>
      {body}
    </div>
  );
}

export default AgentPresence;
