import { Fragment, type ReactNode } from "react";

import { ProviderMark } from "@/components/meridian/source-marks";

import { STATION_GLYPHS, type StationGlyphKind } from "./station-glyphs";
import { WorkGlyph, glyphForArtifactKind } from "./work-glyphs";

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
 * `Thinking` is beautifului.dev's "Thinking" ported from that page's own source,
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

/**
 * THE ROW'S FIRST LINE, AND WHY IT HAS A DECLARED HEIGHT.
 *
 * ── THE DEFECT, MEASURED ─────────────────────────────────────────────────
 * Founder review 2026-08-20 on `PlanCard`: the alignment is not properly put.
 * Rendered against the real stylesheet and measured, the mark's centre against
 * its subject's centre came out:
 *
 *   rows with no chip    +0.63px
 *   rows with a chip     -1.00px
 *
 * A 1.63px swing, alternating down the card according to whether that row
 * happened to have something to say. The cause is that this line is
 * `items-center` and a `StatusChip` is 22px tall against a 12.5px subject's
 * 18.75px line box, so a chip RAISES the line and drags the subject's centre
 * down with it, while the mark stayed pinned to the offset a chipless line
 * needs.
 *
 * ── SO THE LINE IS 22px ON EVERY ROW, CHIP OR NOT ────────────────────────
 * `min-h-[22px]` is the chip's own height, which is why it is that number: the
 * tallest thing this line can contain sets the line, and then a row's geometry
 * stops depending on its content. `GLYPH_SLOT`'s offset is solved against it
 * rather than against the bare line box, so the two cannot disagree again.
 *
 * A chipless row grows by 3.25px, which is the direction the ratchet allows.
 * Shrinking the chip to fit the text would have been the other repair and it is
 * the forbidden one: the chip's height is what carries its status word at a
 * readable size on paper.
 */
export const RUN_LINE = "flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-1";

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
 * `mt-[4px]` is the one measured offset and it is on the SLOT, not the drawing:
 * a 14px box centred in `RUN_LINE`'s 22px needs (22 - 14) / 2, which is exactly 4.
 * One number, one place, every glyph.
 *
 * IT WAS 3px UNTIL 2026-08-20, solved against the bare 18.75px line box a
 * chipless subject makes, which was the wrong thing to solve against: a row with
 * a chip has a 22px line, so the mark sat 1.63px away from where a chipless row
 * put it. See `RUN_LINE` for the measurement. The clock column has been on 4px
 * all along, so the old 3px also had the two columns of one row disagreeing by a
 * pixel.
 *
 * ── THE INK, MEASURED, ALL THIRTEEN ─────────────────────────────────────
 * Founder review 2026-08-20: align the mark optically to the text baseline
 * rather than to its bounding box. Every mark in this system was rendered and
 * its ink bounding box read with `getBBox`, because that is the only way to see
 * where the ink is rather than where the box is. Offsets from 12, 12 in viewBox
 * units, and one unit is 0.583px at the 14px these ship at:
 *
 *   eleven of thirteen   within 0.30 down and 0.00 across, so under 0.18px
 *   run:tool             11.35, 10.55 -- 0.85px HIGH. Redrawn, see below
 *   station:decide       13.00, 12.00 -- 1.00 across, and CORRECT. See below
 *
 * SO THE LAYOUT WAS NEVER THE PROBLEM, which the founder's own note anticipated:
 * glyph box against text centre measures 0.6px across five rendered rows. One
 * drawing was off, and it was off because it was the wrong drawing.
 *
 * `station:decide` IS LEFT ALONE ON PURPOSE, and this is where bbox centring and
 * optical centring part company. Its diamond spans 5..19 and is centred on 12;
 * the +1.00 comes entirely from the 2-unit stub that draws the chosen branch
 * leaving the diamond to the right. The eye centres a mark on its BODY, not on
 * its extremities, so obeying the bbox here would shift a symmetric diamond a
 * whole unit left to compensate for a tail, and it would then look wrong beside
 * the six marks whose bodies are centred. A measurement that disagrees with the
 * rule it was taken to serve is a measurement to explain, not to obey.
 */
const GLYPH_SLOT = "mt-[4px] flex size-[14px] shrink-0 items-center justify-center";

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
  "station" | "tool" | "fetch" | "repo" | "check" | "handoff" | "gate" | "note";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const PATHS: Record<Exclude<RunGlyphKind, "station" | "repo">, ReactNode> = {
  /*
   * A WRENCH, AND THE ONE BEFORE IT WAS NOT A DRAWING OF ANYTHING.
   *
   * The previous path was written as "a wrench, angled the way a wrench is
   * held", and rendered at 120px it is an unreadable tangle: a loop, a lump and a
   * stub, with no jaw and no handle. At 14px, which is the only size it ships at,
   * it is three grey marks. That is the placeholder failure the whole glyph set
   * was built to remove, hiding inside the set: `[]` and `H` were obviously
   * placeholders and got replaced, and this one passed because it had a plausible
   * comment above it.
   *
   * FOUND BY MEASURING, THEN BY LOOKING. Its ink centre sat at 11.35, 10.55
   * against the 12, 12 this file requires, which is 0.85px high at 14px and the
   * largest offset of the thirteen marks in the system. Rendering it to check the
   * offset is what showed the drawing itself was wrong, which no amount of
   * nudging would have fixed.
   *
   * WHY THIS ONE OF FOUR CANDIDATES. Four were drawn and rendered side by side at
   * 120, 20 and 14px on both grounds. Two read as a wrench at 14px; of those, this
   * is the only one whose ink lands INSIDE the 4..20 optical square this file
   * declares (4.19..19.87 across, 4.13..20.21 down) with a centre within 0.17 of
   * 12, 12. The other legible candidate measured 18.44 wide, which breaks the
   * 16-unit norm every other glyph here holds, and sat 0.52 right of centre.
   */
  tool: (
    <>
      {/* the handle, thumbed down to the bottom left */}
      <path d="M9.8 11.4 4.6 16.6a2.3 2.3 0 0 0 3.2 3.2l5.2-5.2" />
      {/* the head: an open jaw round the top right */}
      <path d="M13 14.6a4.8 4.8 0 0 0 6.3-6.6l-2.6 2.6-2.6-.7-.7-2.6 2.6-2.6a4.8 4.8 0 0 0-6.6 6.3z" />
    </>
  ),
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

/*
 * ── THERE IS NO `RunFigure` ANY MORE, AND THE COLUMN IS 40px FOR A REASON ─
 *
 * It existed to put a DURATION in the clock column, on the argument that a
 * duration is a number about time and belongs where every other number about time
 * is. That argument was wrong, and the founder named why on 2026-08-20: the clock
 * column answers WHEN, and a duration answers HOW LONG, which is a what.
 *
 * IT WAS ALSO ARITHMETICALLY IMPOSSIBLE, which settles it past the semantics. He
 * offered two repairs, move the duration or shed precision, reading a six-hour
 * silence that had wrapped to three lines. Measured in JetBrains Mono at 11.5px
 * with tabular figures, against this column's 40px:
 *
 *   03:12         34.50px   fits, with 5.5px spare. This is what 40px is for
 *   6h 11m 00s    69.00px   wraps to three lines and 52px tall
 *   28m 0s        41.41px   ALREADY WRAPS, by 1.4px. Nobody had noticed
 *   6h 11m        41.41px   still wraps. So shedding the seconds does not help
 *   12h 00m       48.30px   worse
 *
 * No duration this product can print fits 40px: the longest that would is four
 * characters. So the second repair was unavailable and the first is the only one,
 * and the column now holds a wall clock and nothing else, ever. That is a stronger
 * rule than "durations go elsewhere" and it is why the helper is deleted rather
 * than narrowed: a slot that only ever takes one kind of thing cannot be handed
 * the other kind by a future row type.
 */

/** Nothing in the clock column, holding it open so the body never shifts left. */
export function RunClockEmpty() {
  return <span aria-hidden />;
}

/**
 * HOW LONG SOMETHING TOOK, in the body, in the one treatment all three views use.
 *
 * A duration is a `what`, so it sits in the content column beside the subject it
 * belongs to, exactly as it already did on every event row. This exists so the
 * silence row, the live tail and the event rows cannot end up with three
 * renderings of one figure, which is what happened when it was two of them.
 */
export function RunTook({ children }: { children: ReactNode }) {
  return (
    <span className="font-mrd-mono text-mrd-data text-mrd-faint tabular-nums">{children}</span>
  );
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
    <span className="mt-0.5 block text-mrd-data leading-mrd-prose text-mrd-body">{children}</span>
  );
}

/**
 * THE TURN'S ROLLUP: the figures that close a turn, on one line, separated once.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ────────────────────────────────
 * Devin closes every turn with a collapsed rollup reading *"Worked for 11s ·
 * Thought for 9s · 7/7 Test the app end-to-end"*, and Relevance AI puts the same
 * facts in a details rail: Status, Actions used, Credits used, Run time. What is
 * borrowed is the INFORMATION MODEL -- a turn is a unit of work with a cost and a
 * result, and the cost is stated rather than implied -- not the disclosure
 * triangle, which hides the one fact the whole surface exists to show.
 *
 * ── IT TAKES ITEMS, NOT A STRING, AND THAT IS THE ARBITRARINESS FIX ─────
 * The obvious signature is `children`, and it is the one that lets the third
 * caller separate its facts with a comma, the fourth with a slash, and the fifth
 * with two spaces. This file already carries the scar: the same run was drawn
 * three ways across three views because each one composed its own spacing. So
 * the separator lives HERE, once, and a caller cannot reach it.
 *
 * ── AN EMPTY ITEM IS DROPPED, NOT DRAWN AS A GAP ────────────────────────
 * Every figure a turn can carry is missing on real rows -- `duration_ms` is null
 * or a placeholder zero on 917 of 2,272 track-linked runs -- so the common case
 * is a rollup with holes in it. Falsy items are filtered rather than rendered,
 * which is what stops a missing figure printing as a stray separator, and it
 * means a caller writes `took ? <RunTook>...</RunTook> : null` and nothing else.
 *
 * `text-mrd-mute` and `--mrd-t-data`, which is `RunMeta`'s treatment: this line
 * is the same rank of information as the seat's name, and giving it its own stop
 * would be a fourth type size on a row that already has three.
 *
 * ── `mt-1` AND NOT `mt-0.5`, WHICH IS THE ONE VALUE HERE THAT DIFFERS ───
 * `RunMeta` and `RunNote` both open 2px, and copying them was the reflex. They
 * are TEXT lines, so their 2px sits on top of their own leading and reads as
 * more. This line can hold `RunArtifact`, which is a 20px bordered box with no
 * leading at all, and 2px would put that box hard against the words above it.
 * `mt-1` is `RUN_STACK`'s own `gap-1`, which is the gap this file already uses
 * between OBJECTS rather than between text lines, so the value is read off the
 * file rather than picked.
 */
export function RunRollup({ items }: { items: ReactNode[] }) {
  const shown = items.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    /* `min-w-0` for the reason `RunArtifact`'s own SHAPE carries it: this is a
       flex container, so without it it refuses to shrink below its widest item,
       and its widest item is a chip carrying an artifact title. The row above it
       has `min-w-0` on the grid item; the chain has to be unbroken or the pane
       scrolls sideways. */
    <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-mrd-data text-mrd-mute">
      {shown.map((item, i) => (
        <Fragment key={i}>
          {/* Hidden from assistive tech: it is punctuation between facts that
              are each read out in full, and "middle dot" between every one of
              them is three extra words a listener has to discard. */}
          {i > 0 ? (
            <span aria-hidden className="text-mrd-faint">
              ·
            </span>
          ) : null}
          {item}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * WHAT A TURN ACTUALLY FILED, named, in the transcript, beside the claim.
 *
 * ── THE GAP THIS CLOSES ─────────────────────────────────────────────────
 * A transcript row saying *"Draft filed a spec"* is the agent's account of
 * itself. This is the record's: the kind's own mark, the product's word for the
 * kind, and the artifact's real title read off its own table. The distance
 * between *"it says it filed a spec"* and *"here is the spec"* is the distance
 * this product keeps filing findings about, and one chip closes it without
 * leaving the row.
 *
 * ── IT IS `RecordTag`'S GEOMETRY, DELIBERATELY, NOT `StatusChip`'S ──────
 * `border-mrd-line bg-mrd-sink rounded-mrd-xs px-1.5` at `--mrd-t-data` is the
 * system's CATEGORICAL chip, to the class name. An artifact kind is a category,
 * never a status: `StatusChip` is a round pill carrying one of five hues and
 * putting a spec in one would say a spec is an outcome. The system already made
 * that split (a pill is round and carries status, a tag is square and carries a
 * category) and this obeys it rather than reinterpreting it.
 *
 * `min-h-5` rather than `RecordTag`'s flat `h-5`: a real spec title on this
 * track is 108 characters and a fixed height would clip it. Growing is the
 * direction the ratchet allows; truncating a name is not, and there is no
 * hover-only escape hatch here that a keyboard could not reach.
 *
 * ── THE MARK TAKES ITS DEFAULT SIZE, AND THAT IS THE WHOLE ARGUMENT ────
 * A first draft passed `size={11}` because 11 looked right against 11.5px text.
 * That is a number chosen against nothing, which is the exact failure this
 * file's header is a monument to: three views of one run arrived with three mark
 * sizes, every one defensible alone. `WorkGlyph` defaults to 13 because
 * `StationGlyph` does, every other caller in the product takes that default, and
 * a fourteenth size invented for one chip would be the same defect one drawing
 * further on.
 *
 * ── A KIND WITH NO MARK RENDERS ITS WORD ALONE ──────────────────────────
 * `glyphForArtifactKind` returns null for a kind this build has never heard of,
 * and that null is designed rather than accidental: reaching for a nearby shape
 * would tell a reader an unknown kind is a prototype.
 *
 * ── `missing` IS A THIRD STATE AND IT IS NOT "NO TITLE" ─────────────────
 * The chain read separates *we looked and the row is gone* from *we did not
 * look*. A gone artifact says so, because a chip naming a spec that no longer
 * resolves is a worse lie than a chip with no name on it.
 */
export function RunArtifact({
  kind,
  word,
  title,
  missing = false,
  onOpen,
  selected = false,
}: {
  /** The raw `spine_track_members.artifact_kind`, for the mark. */
  kind: string;
  /** The product's word for that kind, from the one vocabulary the driver uses. */
  word: string;
  title: string | null;
  missing?: boolean;
  /**
   * ── THE CHIP IS THE THING, SO THE CHIP IS THE CONTROL (founder, 2026-09-02) ─
   *
   * Watching the live site: *"When some PRD or spec is written it gives a block,
   * and it is not clickable. It needs to be clickable, viewable, editable...
   * When I click on the PRD the right side should open up."*
   *
   * This chip already NAMES the artifact. It is the only place on the run screen
   * where one specific filed thing is drawn by name, so it is the only place
   * from which one specific filed thing can be opened. The turn's headline
   * beside it opens the turn's NEWEST artifact, which cannot reach the third
   * prototype of ten; this can.
   *
   * OPTIONAL, AND THAT IS THE CONTRACT THIS FILE ALREADY HOLDS ELSEWHERE.
   * `ToolStream` draws its rows as plain facts with no pointer and no tab stop
   * unless `onSelectRow` is supplied, and the shell's stage chips do the same:
   * a chip is a control only if something is listening. Without `onOpen` this
   * renders exactly the span it always did.
   */
  onOpen?: () => void;
  /** True when this is the artifact the pane is currently showing. */
  selected?: boolean;
}) {
  const glyph = glyphForArtifactKind(kind);
  const body = (
    <>
      {glyph ? <WorkGlyph kind={glyph} className="shrink-0 text-mrd-mute" /> : null}
      <span className="shrink-0 text-mrd-mute">{word}</span>
      {missing ? (
        <span className="text-mrd-faint">no longer on file</span>
      ) : title ? (
        <span className="min-w-0">{title}</span>
      ) : null}
    </>
  );

  /*
   * `min-w-0` AS WELL AS `max-w-full`, and the difference between them is the
   * whole defect. `max-w-full` caps the chip at its container's width; it does
   * not let the chip SHRINK, because a flex container defaults to
   * `min-width: auto` and refuses to go below its own content. A prototype
   * title is 54 characters, so the chip took its intrinsic width, the rollup
   * took the chip's, the grid column took the rollup's, and the whole left pane
   * scrolled sideways -- clipping the steer field under it to "ay what to
   * change". Photographed twice: once on the row headline (fixed there) and
   * again here the moment the chip became a control.
   */
  const SHAPE =
    "inline-flex min-h-5 min-w-0 max-w-full items-center gap-1 rounded-mrd-xs border px-1.5 py-0.5 text-mrd-data text-mrd-body";

  /*
   * A MISSING ARTIFACT IS NEVER A CONTROL. The row says "no longer on file",
   * which means the lookup ran and the row was not there, so pressing it could
   * only open an empty pane. A control that opens nothing is the promise this
   * repo removes wherever it finds it.
   */
  if (!onOpen || missing) {
    return <span className={`${SHAPE} border-mrd-line bg-mrd-sink`}>{body}</span>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      /*
       * THE NAME IS THE ARTIFACT, NOT "OPEN". A screen reader announces the
       * accessible name, and "Open" repeated eleven times down a transcript
       * names nothing. The word and the title are already the name; the ROLE
       * says it is pressable, which is what `aria-label="Open the spec"` would
       * have been trying to say and would have destroyed the name to say it.
       */
      className={`${SHAPE} mrd-focus-inset cursor-pointer text-left transition-colors duration-100 ${
        selected
          ? "border-mrd-you bg-mrd-lift text-mrd-ink"
          : "border-mrd-line bg-mrd-sink hover:bg-mrd-hover"
      }`}
    >
      {body}
    </button>
  );
}

/**
 * The rail, drawn per row, stopped on the last one, and CROSSING THE GAP.
 *
 * A line continuing past the last thing that happened is a claim that something
 * else is coming. Thinking measures its rail to the final row's midpoint for the
 * same reason; per row is the same result without a `useLayoutEffect`, and it
 * survives a row wrapping to three lines, which a measured height does not.
 *
 * ── `-mb-1` IS WHY THE ROWS READ AS A SEQUENCE ──────────────────────────
 * Founder review 2026-08-20: nothing connects one row to the next. There WAS a
 * rail and it still did not connect, because `RUN_STACK` puts `gap-1` between
 * rows and a per-row rail stopped at each row's bottom edge. So the line broke
 * for 4px thirteen times down a run and read as a column of ticks rather than as
 * one rail. Thinking, the reference this rhythm is read off, draws ONE continuous
 * line for exactly this reason.
 *
 * `-mb-1` is `RUN_STACK`'s own `gap-1` negated, which is why it is that value and
 * not a number that looked right: the rail is asked to cross precisely the gap
 * the stack opens, so the two cannot drift apart. A flex item with a negative
 * bottom margin is given that much more length by `flex-1`, so the line reaches
 * the next row's glyph rather than merely overhanging.
 */
export function RunRail() {
  return <span aria-hidden className="-mb-1 w-px flex-1 bg-mrd-line" />;
}

/**
 * The rail where nothing happened: same line, same gap crossing, dashed.
 *
 * DASHED CARRIES THE FACT WITHOUT COLOUR, which is the greyscale rule: the SHAPE
 * of the rail changes, so a black-and-white screenshot still shows where the run
 * stopped. It is a `border-l` rather than a background because a 1px dashed
 * background is not expressible in CSS, and `w-0` keeps the border the only ink
 * so the line lands in the same 1px column as the solid one.
 *
 * `-mt-1` as well as `-mb-1`, unlike the solid rail: a silence row has no glyph
 * to receive the line from above, so it has to reach up through the gap as well
 * as down through it, or the break in the rail becomes a hole in the rail.
 */
export function RunRailBreak() {
  return (
    <span aria-hidden className="-mt-1 -mb-1 w-0 flex-1 border-l border-dashed border-mrd-edge" />
  );
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
