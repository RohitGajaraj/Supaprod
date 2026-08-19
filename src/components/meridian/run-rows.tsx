import type { ReactNode } from "react";

import { ProviderMark } from "@/components/connections/provider-marks";

import { STATION_GLYPHS, type StationGlyphKind } from "./station-glyphs";

/*
 * ONE RHYTHM FOR THE THREE VIEWS OF A RUN.
 *
 * ── THE DEFECT THIS CLOSES ──────────────────────────────────────────────
 * `PlanCard`, `RunTimeline` and `ToolStream` are three views of one run and they
 * shipped as three products. Measured across them before this file existed:
 * three mark sizes (13, 13, 18), three gutters (6, 8, 10px), three subject sizes
 * (12.5, 12.5, 13), two of them with no time column at all, and a duration that
 * sat in the label column on one row type and in the clock column on the next.
 * Every one of those passed typecheck, tests and the ratchet.
 *
 * That is the arbitrariness failure, not an ugliness failure: each value was
 * defensible on its own and none of them was chosen against its neighbours.
 *
 * ── WHERE EVERY NUMBER BELOW COMES FROM, AND IT IS NOT PREFERENCE ────────
 * `Thinking` is beautifui.dev's "Thinking" ported from that page's own source,
 * and it is the reference's DENSE TRACE: a rail, a glyph, a subject, a
 * qualifier, rows that arrive as work happens. All three run views are that
 * object. So the rhythm is read off it rather than invented:
 *
 *   row min-height   28px   `min-h-7`, Thinking's row
 *   gutter in a row  8px    `gap-2`, Thinking's row
 *   gap between rows 4px    `gap-1`, Thinking's trace column
 *   glyph            14px   Thinking's glyphs, every one
 *   subject          12.5px Thinking's `primary`
 *   qualifier        11.5px Thinking's `secondary`
 *   rail             1px `--mrd-line`, stopping at the last row
 *
 * The one value not in Thinking is the CLOCK COLUMN, because Thinking has no
 * clock. It is 40px, which is `--mrd-s7` exactly: one spacing token, wide enough
 * for `03:12` set in 11.5px JetBrains Mono with tabular figures, and a spacing
 * token rather than a measured string width so it cannot drift when the face
 * changes.
 *
 * ── THE COLUMNS ARE A GRID, NOT A FLEX ROW, AND THAT IS THE POINT ────────
 * Three columns declared once, so a figure cannot land in the label column on
 * one row type and the clock column on another. That was live: `RunTimeline`'s
 * silence rows put `28m 0s` inline in the body while every event row put its
 * time in the clock column, and no gate could see it. A shared
 * `grid-template-columns` makes it impossible rather than discouraged.
 *
 * ── ONE FORMAT FOR ONE IDEA ─────────────────────────────────────────────
 * `who` is the only text on the meta line, always. The STATION is never text
 * here: it is the glyph, per law 4, identity is shape. An agent credited
 * `Research · Discover` on one row and `Challenge` on the next was two formats
 * for one idea, and the cause was that a station could be present or absent. It
 * cannot be either now, because it is not on that line at all.
 */

/** 40px, `--mrd-s7`. See the header for why it is a spacing token. */
export const RUN_GRID = "grid-cols-[var(--mrd-s7)_14px_1fr]";

/** Every run row, so a caller cannot compose its own spacing by accident. */
export const RUN_ROW = `grid ${RUN_GRID} gap-2 min-h-7 items-start`;

/** Between rows. Thinking's `gap-1`. */
export const RUN_STACK = "flex flex-col gap-1";

/*
 * ── THE GLYPH GRID, AND WHY THE MARKS ARE NORMALISED RATHER THAN NUDGED ──
 *
 * A glyph aligned to its BOUNDING BOX rather than to the text it sits beside
 * reads as sitting too low or too high, and the reflex fix is a per-glyph
 * `translateY`, which is a nudge per drawing and drifts the moment one changes.
 *
 * The real fix is the one `provider-marks.tsx` already documents for its twenty:
 * one viewBox and one optical square, so every mark has the same visual mass in
 * the same place and a single `items-start` with a shared line box aligns all of
 * them. Every glyph below is 24x24 with its ink inside 4..20 on both axes, which
 * is `station-glyphs.tsx`'s grid, so a station mark and a kind mark are
 * interchangeable in this slot without either looking bigger.
 *
 * `mt-[3px]` is the one measured offset and it is on the SLOT, not the drawing:
 * a 14px box centred against a 12.5px subject on 1.5 leading (an 18.75px line
 * box) needs (18.75 - 14) / 2, which rounds to 3 within half a pixel. One
 * number, one place, every glyph.
 */
const GLYPH_SLOT = "mt-[3px] flex size-[14px] shrink-0 items-center justify-center";

/**
 * WHAT KINDS OF THING HAPPEN IN A RUN, and every one wears the mark of the thing
 * it names rather than a letter or an arrow.
 *
 * The founder's rule: a pull request wears the source-host mark, a web fetch a
 * globe, a human gate the person mark. `[]`, `->` and `H` are placeholders, and
 * this set replaced exactly those.
 *
 *   station   the loop's own dial, from `station-glyphs.tsx`. Reused rather than
 *             redrawn, so a station is the same shape here as on the rail.
 *   tool      a wrench. The generic call, when nothing more specific is known.
 *   fetch     a globe, and it is `Thinking`'s globe path verbatim: that component
 *             already draws a source it read, and two globes in one system is
 *             two globes to keep in step.
 *   repo      the source host's own mark, drawn by `ProviderMark`. A pull
 *             request, a commit and a branch are all this.
 *   check     a clipboard with a tick. The station's own verification, NOT a
 *             test runner's logo: what a reader is looking at is Supaprod
 *             running its checks, and putting a third party's trademark on our
 *             own station would be both wrong and somebody else's geometry.
 *   handoff   two arcs passing. One agent giving the work to the next.
 *   gate      a person. Head and shoulders, filled, because a person is a
 *             different KIND of object in this system from an agent and not a
 *             different colour of one. Same argument as `YouMark`.
 *   note      a filled dot. Something happened and it has no shape of its own.
 */
export type RunGlyphKind =
  | "station"
  | "tool"
  | "fetch"
  | "repo"
  | "check"
  | "handoff"
  | "gate"
  | "note";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const PATHS: Record<Exclude<RunGlyphKind, "station" | "repo">, ReactNode> = {
  /* A wrench, angled the way a wrench is held. */
  tool: <path d="M15.5 8.5a3.5 3.5 0 1 0-4.2-4.2l3 3-2.1 2.1-3-3A3.5 3.5 0 0 0 8.5 12l-4 4 3.5 3.5 4-4a3.5 3.5 0 0 0 3.5-3.5z" />,
  /* Thinking.tsx's globe, verbatim. One globe in the system. */
  fetch: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4a13 13 0 0 1 0 16M12 4a13 13 0 0 0 0 16" />
    </>
  ),
  /* A clipboard with a tick: our own verification, not a runner's logo. */
  check: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M9 5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1H9z" />
      <path d="M8.5 13l2.2 2.2 4.8-5" />
    </>
  ),
  /* Two arcs passing the work along. */
  handoff: (
    <>
      <path d="M5 9h11l-3-3M19 15H8l3 3" />
    </>
  ),
  /* A person. Filled head, because a person is a solid object here. */
  gate: (
    <>
      <circle cx="12" cy="8" r="3.4" fill="currentColor" stroke="none" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  note: <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />,
};

/**
 * One run glyph in the rail slot.
 *
 * `aria-hidden` without exception: every row names its subject in text on the
 * same line, so announcing the mark would read the row twice. That is the same
 * contract `ProviderMark`, `StationGlyph` and `AgentMark` all state.
 */
export function RunGlyph({
  kind,
  station,
  className = "",
}: {
  kind: RunGlyphKind;
  /** Required when `kind` is "station": which one. */
  station?: StationGlyphKind;
  className?: string;
}) {
  if (kind === "repo") {
    /*
     * 12 inside an 18px box is `ProviderMark`'s own 16-in-22 proportion, which is
     * why this lands on the same optical square as the drawn glyphs rather than
     * near it. The negative margins pull its box back to the 14px slot without
     * scaling the mark, so the source-host mark has the same ink weight here as
     * it does in the connections list.
     */
    return (
      <span className={`${GLYPH_SLOT} ${className}`}>
        <span className="-m-[2px] flex">
          <ProviderMark provider="github" size={12} />
        </span>
      </span>
    );
  }

  return (
    <span className={`${GLYPH_SLOT} ${className}`}>
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" {...STROKE}>
        {kind === "station" ? (station ? STATION_GLYPHS[station] : PATHS.note) : PATHS[kind]}
      </svg>
    </span>
  );
}

/**
 * WHICH MARK A REGISTRY TOOL WEARS, derived from its namespace.
 *
 * Derived rather than passed, and that is deliberate: a `kind` prop is one more
 * thing two callers can answer differently for the same tool, which is the
 * one-idea-two-ways failure at the data layer instead of the paint layer. The
 * namespace is the honest source, it is stable, and it is what the registry
 * already organises tools by.
 *
 * The default is the generic wrench rather than a question mark: an uncatalogued
 * tool is still a tool call, and the row's LABEL is where an unknown tool shows
 * itself, in the raw name that `toolActionLabel` could not translate.
 */
export function runGlyphForTool(toolName: string): RunGlyphKind {
  const head = toolName.split(".")[0] ?? "";
  const rest = toolName.slice(head.length + 1);

  if (head === "web") return "fetch";
  if (head === "github" || head === "repo") return "repo";
  if (head === "studio") {
    /* The verification family, which is OUR station's checks. `pr` and `commit`
       cross the boundary to the host, so they wear the host's mark. */
    if (/^(checks|tests|review|secrets|deps)/.test(rest)) return "check";
    if (/^(pr|commit|revert|sync_branch|stage|fix)/.test(rest)) return "repo";
    return "tool";
  }
  if (head === "agent" || head === "mission" || head === "delegate") return "handoff";
  if (head === "calendar" || head === "prd" || head === "decision" || head === "learning") {
    return "tool";
  }
  return "tool";
}

/**
 * The clock column. A real `<time>` with a machine-readable instant on it.
 *
 * `toLocaleTimeString` with `hour12: false` rather than a hand-built `HH:MM`,
 * because a hand-built one is wrong in every locale that does not use a colon.
 * Right-aligned and tabular so the column is a column: the digits sit under each
 * other and a 1 takes the same room as an 8.
 */
export function RunClock({ at }: { at: number }) {
  const d = new Date(at);
  return (
    <time
      dateTime={d.toISOString()}
      className="mt-[4px] text-right font-mrd-mono text-mrd-data text-mrd-faint tabular-nums"
    >
      {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
    </time>
  );
}

/**
 * A figure in the clock column where there is no clock.
 *
 * THIS IS THE FIX FOR THE MISALIGNED SILENCE ROW. A duration is a number about
 * time, so it belongs in the column every other number about time is in. Putting
 * it inline in the body was the single most visible tell that the component was
 * assembled rather than designed.
 */
export function RunFigure({ children }: { children: ReactNode }) {
  return (
    <span className="mt-[4px] text-right font-mrd-mono text-mrd-data text-mrd-faint tabular-nums">
      {children}
    </span>
  );
}

/** Nothing in the clock column, holding it open so the body never shifts left. */
export function RunClockEmpty() {
  return <span aria-hidden />;
}

/** What happened, in a reader's words. Thinking's `primary`. */
export function RunSubject({ children }: { children: ReactNode }) {
  return <span className="text-mrd-label font-medium text-mrd-ink">{children}</span>;
}

/**
 * Who did it. The ONLY text on this line, ever.
 *
 * A station is not allowed here; it is the glyph. That is what stops one idea
 * being expressed two ways depending on whether a row happened to carry both.
 */
export function RunMeta({ children }: { children: ReactNode }) {
  return <span className="mt-0.5 block text-mrd-data text-mrd-mute">{children}</span>;
}

/** A second line: a reason, a path, an error. Wraps rather than truncates,
 *  because half a reason is worse than a wrapped one. */
export function RunNote({ children }: { children: ReactNode }) {
  return (
    <span className="mt-0.5 block text-mrd-data leading-relaxed text-mrd-body">{children}</span>
  );
}

/**
 * The rail, drawn per row and stopped on the last one.
 *
 * A line continuing past the last thing that happened is a claim that something
 * else is coming. Thinking measures its rail to the final row's midpoint for the
 * same reason; per row is the same result without a `useLayoutEffect`, and it
 * survives a row wrapping to three lines, which a measured height does not.
 */
export function RunRail() {
  return <span aria-hidden className="w-px flex-1 bg-mrd-line" />;
}

/**
 * ELAPSED, WITH AN HOURS BRANCH.
 *
 * `useElapsed` formats `${m}m ${s}s` above sixty seconds and never rolls over, so
 * an 86-hour hold renders as `5160m 0.0s`. That is one of the sizes nobody drew:
 * it typechecks, it is not wrong, and no reader can parse it.
 *
 * This is the same shape as `formatDuration` in `studio/run-return.ts` and is
 * NOT a second copy of it: that one takes a finished span in milliseconds and is
 * exact to the second, which is right for "worked for 18m 06s" on a settled run.
 * This one takes a live tick in tenths and drops the tenths the moment they stop
 * being the interesting digit, because a counter that renders `5160m 0.0s` is
 * reporting precision it has no use for.
 */
export function formatElapsed(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0.0s";
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;

  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  /* Under an hour keeps whole seconds: they are still the digit that moves.
     Past an hour they are noise beside the hours, and dropping them stops the
     figure changing width every second on a long hold. */
  if (h === 0) return `${m}m ${s % 60}s`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}
