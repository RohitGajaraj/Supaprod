import { useId, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

/*
 * INSIGHT CARDS, the Learn station's paged read of what an outcome taught.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Insight Cards"
 *                 (their file: components/InsightCards.tsx), MIT licensed,
 *                 read on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * How this copy was taken: six agent tabs were open on that page at once and it
 * never reached document idle, so the panel could not be clicked. The panel is
 * fed by the page's own inlined source payload, which declares each blob's byte
 * length ahead of it. This blob declared 0x45b3 and arrived at 17843 bytes, so
 * it is the whole file rather than a truncated or inferred read.
 *
 * ── THE HONESTY CONSTRAINT, WHICH DECIDED THE WHOLE COMPONENT ───────────
 * Never claim accumulated learning in the present tense. Production holds zero
 * rows of kind `outcome`, so the empty case is not an edge here; it is the case
 * a reviewer will actually see, and it is composed first and hardest. The dense
 * case below it is hypothetical until a real verdict lands.
 *
 * Two shapes were available for the pager and only one is allowed. A bare count
 * beside the word Insights, which is what the source renders, offers volume as
 * evidence that something was learnt. It is the banned shape. A label that names
 * what the number IS is the correct one, so the pager reads "Insight 2 of 3":
 * a position in a set, which claims nothing about whether the set is any good.
 * The zero state uses the same rule for its one figure, "Settled outcomes 0",
 * where the label carries the meaning and the number carries no argument.
 *
 * ── A FAILED READ IS NOT AN EMPTY STATE ─────────────────────────────────
 * If the station cannot be read, that is a third case and it must not wear the
 * empty state's clothes. Silence that means "nothing has happened yet" and
 * silence that means "we could not find out" are opposite facts, and a reader
 * who cannot tell them apart will act on the wrong one. `loadError` renders its
 * own shape and offers a way out.
 *
 * ── WHERE THEIR COLOUR WENT, AND WHERE IT CAME BACK ─────────────────────
 * The TREND chart's two lines carry MEANING, so they take semantic colour: a
 * forecast is what a PERSON believed, so it is orchid at rest, and the actual
 * line is an OUTCOME, so it is green or red once settled and neutral while it
 * is still open. That pairing is the product's whole thesis and it would be
 * lost to a categorical palette.
 *
 * The BREAKDOWN card decides PER SEGMENT, because its slices are not all the
 * same kind of thing. A slice that is only a bucket takes the
 * data-visualisation palette (`--mrd-viz-*`, the reference's own values, on a
 * founder ruling of 2026-08-15) and a weight ladder under it. A slice that is
 * genuinely a state — shipped, waiting on a person — keeps its status colour,
 * because that is the fact the reader came for. Forcing either rule across the
 * whole bar loses something: all-status paints verdicts onto buckets, and
 * all-categorical throws away the green on the one slice that succeeded.
 *
 * Two lines is the ceiling this earns, because there are only two meanings in
 * the frame. The forecast is also DASHED and the actual solid, so the pair
 * still separates with the hue removed, which is the greyscale test the system
 * is meant to survive. A third series would need a fourth meaning and there is
 * no fourth meaning, so it separates by dash and lightness rather than by a new
 * colour. Nothing here is invented to fill a legend, and there is no amber for
 * a "warning" series: this system has no warning colour and does not need one.
 *
 * Their `liveline` dependency is gone. It is not in this app, it took a
 * `theme={dark ? "dark" : "light"}` prop, and the whole `useDarkMode` observer
 * in their file exists only to feed it. Meridian tokens re-resolve on their own,
 * so writing a light variant here would have meant the mapping was wrong. The
 * replacement is an inline path, which also made the chart keyboard scrubbable.
 */

export type InsightSeries = {
  id: string;
  label: string;
  values: number[];
  /**
   * What the line MEANS, which is what picks its colour.
   *   forecast  what a person believed would happen, recorded before the fact
   *   actual    what happened
   */
  role: "forecast" | "actual";
};

export type TrendInsight = {
  kind: "trend";
  key: string;
  /** The sentence above the card. Keep it a finding, not a category. */
  lead: ReactNode;
  title: string;
  series: InsightSeries[];
  /**
   * Settled or still open. An unsettled actual stays neutral, because green
   * and red are outcome and an outcome that has not landed is not one.
   */
  verdict?: "pass" | "fail" | "open";
  /** Two named views of the same card, e.g. the metric and its cost. */
  views?: { id: string; label: string; series: InsightSeries[] }[];
  format?: (value: number) => string;
  /** A figure the reader can check, with a label naming what it is. */
  figures?: { label: string; value: string; tone?: "pass" | "fail" }[];
  followUp?: string;
};

export type SplitInsight = {
  kind: "split";
  key: string;
  lead: ReactNode;
  title: string;
  headline: string;
  segments: {
    id: string;
    label: string;
    percent: number;
    detail: string;
    /**
     * The segment's real meaning, when it has one. Omit it and the segment
     * takes its place on the neutral ladder. See the note on SegmentTone.
     */
    tone?: SegmentTone;
    /**
     * This segment's own figure, shown as the card's hero while it is
     * selected. Omit it on every segment and the card falls back to
     * `headline`, which is the older fixed-number behaviour.
     */
    amount?: string;
  }[];
  followUp?: string;
};

/**
 * THE THIRD CARD, ported 2026-08-15.
 *
 * ── WHAT WAS MISSING ────────────────────────────────────────────────────
 * The reference pages three cards — a comparison, an ANOMALY, and an
 * allocation. The first port took the comparison (`TrendInsight`) and the
 * allocation (`SplitInsight`) and dropped the middle one, so the pager offered
 * two shapes where the source offers three. The founder spotted it from the
 * outside on 2026-08-15: "the graph/insights area currently has two cards,
 * while the reference has three".
 *
 * ── WHAT IT BECOMES HERE, RATHER THAN A COPY ────────────────────────────
 * Their anomaly card is a freezer bill that spiked past what the shop
 * normally spends. The shape underneath it is the useful part: ONE series, a
 * line it was not supposed to cross, and a figure naming the overshoot. This
 * product already has that exact fact and does not have to invent it — every
 * track carries a spend cap, and a run that crosses one is a real, recorded,
 * checkable event. So this is a port of the structure onto a capability we
 * already ship, which is the honest version of "build what is missing".
 *
 * ── WHY IT IS AN OUTCOME AND NOT A CALL ─────────────────────────────────
 * A breached cap reads as urgent, and it is tempting to give it the orchid
 * that means "a person is required". It gets the FAIL colour instead. The
 * crossing already happened; nothing about drawing it is asking anyone to
 * decide anything. Orchid here would be the same mistake as an ember focus
 * ring — spending the one "this needs you" signal on something that merely
 * happened, until the signal stops meaning anything.
 */
export type ThresholdInsight = {
  kind: "threshold";
  key: string;
  lead: ReactNode;
  title: string;
  /** The line that must not be crossed, in the units of every view below. */
  limit: number;
  /** How the limit is named on screen, e.g. "$5.00 cap". */
  limitLabel: string;
  /**
   * Named readings of the same run. The reference toggles spend against
   * usage; ours toggles whatever two facts a reader would check against each
   * other. One view is legal — the toggle simply does not render.
   */
  views: {
    id: string;
    label: string;
    values: number[];
    format: (value: number) => string;
  }[];
  /** The figure under the chart. `over` is what the reader came for. */
  figure: { value: string; over?: string; note?: string };
  followUp?: string;
};

export type Insight = TrendInsight | SplitInsight | ThresholdInsight;

const TONE_VAR = {
  pass: "var(--mrd-pass)",
  fail: "var(--mrd-fail)",
  hold: "var(--mrd-hold)",
  open: "var(--mrd-body)",
} as const;

/*
 * ── HOW A BREAKDOWN IS COLOURED, AND WHY ONLY ONE SEGMENT GETS A HUE ────
 *
 * Lifted from the reference's allocation card, which does something quietly
 * excellent: it colours the DOMINANT segment and draws every other one as a
 * neutral of decreasing weight (`bg-orange`, then `bg-line-strong`, then
 * `bg-line`). Their label tones follow the same ladder — the coloured one gets
 * the colour, the rest step down through the text greys.
 *
 * That is better than a colour per segment for two reasons. A pie of five hues
 * asks the reader to hold a five-item legend in their head before the bar means
 * anything, and it spends five colours on what is usually one finding: this
 * slice is most of it. One hue plus a weight ladder says the same thing with
 * nothing to memorise, and it still works at four or five segments where a
 * rainbow stops working entirely.
 *
 * The hue is `--mrd-viz-1`, the data-visualisation orange, NOT a status colour.
 * A breakdown is categorical: "Held at Discover" is a bucket, not a verdict.
 * Founder ruling 2026-08-15 — see the note on the viz palette in meridian.css.
 */
const SEGMENT_FILL = [
  "var(--mrd-viz-1)",
  "var(--mrd-edge)",
  "var(--mrd-line)",
  "var(--mrd-line-soft)",
] as const;

const SEGMENT_LABEL = [
  "var(--mrd-viz-1)",
  "var(--mrd-body)",
  "var(--mrd-mute)",
  "var(--mrd-faint)",
] as const;

/*
 * ── WHEN A SEGMENT MEANS SOMETHING, IT KEEPS ITS MEANING ────────────────
 *
 * The ladder above is the right default and the wrong answer for some data,
 * and the founder caught the difference immediately: with three buckets, the
 * second and third both came out grey and "we lost the green one, which was
 * good for shipped".
 *
 * He is right, and the distinction is real. The reference's breakdown is three
 * ice-cream flavours — pure categories, where a hue would be noise. Ours is
 * often not: "Held at Discover", "Waiting on a person" and "Shipped" are three
 * different STATES of the same work, and one of them genuinely succeeded.
 * Flattening those to a weight ladder throws away the one fact a reader most
 * wants off that bar.
 *
 * So `tone` is optional per segment:
 *
 *   omitted   the ladder — orange for the dominant slice, then decreasing
 *             neutrals. Correct for true categories, and it scales to any
 *             number of segments without inventing a colour per slice.
 *   given     the segment's real meaning. Use it only where the state is
 *             genuinely one of these, never to brighten a bucket.
 *
 * `viz` is here so a caller can pin the data orange to a segment that is NOT
 * the dominant one, which the bare ladder cannot express.
 */
export type SegmentTone = "viz" | "you" | "hold" | "pass" | "fail" | "quiet";

const SEGMENT_TONE_FILL: Record<SegmentTone, string> = {
  viz: "var(--mrd-viz-1)",
  you: "var(--mrd-you)",
  hold: "var(--mrd-hold)",
  pass: "var(--mrd-pass)",
  fail: "var(--mrd-fail)",
  quiet: "var(--mrd-edge)",
};

/** Past the fourth segment everything is the quietest stop; a fifth slice of a
 *  breakdown is a rounding error, and giving it its own step implies otherwise. */
const segmentFill = (i: number, tone?: SegmentTone) =>
  tone ? SEGMENT_TONE_FILL[tone] : SEGMENT_FILL[Math.min(i, SEGMENT_FILL.length - 1)];

/*
 * The label takes the same colour as its segment when the segment is
 * meaningful, and steps down the text greys when it is only a category. The
 * `quiet` case is the exception: `--mrd-edge` is a border alpha and is far too
 * faint to read as text, so a quiet segment's label falls back to body.
 */
const segmentLabel = (i: number, tone?: SegmentTone) =>
  tone
    ? tone === "quiet"
      ? "var(--mrd-body)"
      : SEGMENT_TONE_FILL[tone]
    : SEGMENT_LABEL[Math.min(i, SEGMENT_LABEL.length - 1)];

function seriesColour(series: InsightSeries, verdict: TrendInsight["verdict"]) {
  if (series.role === "forecast") return "var(--mrd-you-dim)";
  return TONE_VAR[verdict ?? "open"];
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-focus)]";

/* ── the chart ────────────────────────────────────────────────────────── */

const VIEW_W = 300;
const VIEW_H = 120;
const VIEW_PAD = 12;

type Point = { x: number; y: number };

function pointsFor(values: number[], lo: number, hi: number): Point[] {
  const span = hi - lo || 1;
  const stepX = values.length > 1 ? VIEW_W / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: index * stepX,
    y: VIEW_PAD + (1 - (value - lo) / span) * (VIEW_H - VIEW_PAD * 2),
  }));
}

/*
 * ── THE CURVE, AND WHY IT IS THIS CURVE ─────────────────────────────────
 *
 * The line was a polyline. `M … L … L …` is a chart drawn with a ruler, and it
 * is the single most visible thing separating this from the reference, which
 * runs its series through `liveline` and gets a smooth line and a gradient
 * wash under it. Both are restored here as inline SVG, because `liveline` is
 * not in this app and its whole `useDarkMode` observer exists only to feed it a
 * theme — a prop Meridian does not need, since the tokens re-resolve on their
 * own.
 *
 * MONOTONE CUBIC, NOT CATMULL-ROM, and this is a correctness choice rather
 * than a taste one. The reflex smoothing for a chart is a cardinal or
 * Catmull-Rom spline, and it OVERSHOOTS: between two points it bulges past
 * both, so a series that bottoms out at -4.41 is drawn dipping to -4.9. On a
 * chart whose entire job is "what did a person forecast, and what actually
 * happened", a curve that renders a value the data never held is not a
 * smoothing artefact, it is a false reading — the same class of defect as the
 * confidence meter that reported zero for an unparseable answer.
 *
 * Fritsch–Carlson fixes it by clamping each tangent where the data changes
 * direction, which guarantees the curve stays inside the interval its own two
 * endpoints define. A local maximum in the drawing is a local maximum in the
 * data, always. The tension is not adjustable on purpose: every knob here is a
 * chance for someone to dial the honesty back out.
 */
function monotoneTangents(points: Point[]): number[] {
  const n = points.length;
  if (n < 2) return [0];

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const h = points[i + 1].x - points[i].x;
    dx.push(h);
    slope.push(h === 0 ? 0 : (points[i + 1].y - points[i].y) / h);
  }

  /* Interior tangents start as the weighted harmonic mean of the neighbouring
     slopes; the ends simply take the one slope they have. */
  const m: number[] = new Array(n);
  m[0] = slope[0];
  m[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      /* A direction change, or a flat. The tangent MUST be zero here: any
         other value carries the previous direction past the turn, which is
         exactly the overshoot this function exists to prevent. */
      m[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  /* Fritsch–Carlson's clamp: keep each tangent inside three times its
     neighbouring secant, which is the condition for monotonicity. */
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = (3 / Math.sqrt(s)) * slope[i];
      m[i] = t * a;
      m[i + 1] = t * b;
    }
  }
  return m;
}

function curvePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  const m = monotoneTangents(points);
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const h = (points[i + 1].x - points[i].x) / 3;
    const c1x = points[i].x + h;
    const c1y = points[i].y + m[i] * h;
    const c2x = points[i + 1].x - h;
    const c2y = points[i + 1].y - m[i + 1] * h;
    d +=
      ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)}` +
      ` ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
  }
  return d;
}

/* The same curve, closed to the floor of the frame, so it can be washed. */
function areaPath(points: Point[]): string {
  if (points.length < 2) return "";
  const last = points[points.length - 1];
  return `${curvePath(points)} L${last.x.toFixed(2)} ${VIEW_H} L${points[0].x.toFixed(2)} ${VIEW_H} Z`;
}

function Chart({
  series,
  verdict,
  format,
  label,
  fill = true,
  threshold = null,
}: {
  series: InsightSeries[];
  verdict: TrendInsight["verdict"];
  format: (value: number) => string;
  label: string;
  /**
   * The gradient wash under the outcome line. On by default, matching the
   * reference. Turned off where a second reading is already competing for the
   * same area — the threshold card draws a rule across the frame, and a wash
   * behind it makes the one line that matters harder to find, not easier.
   */
  fill?: boolean;
  /**
   * A line the series was not supposed to cross, drawn across the frame.
   * It joins the extent, which is the part that is easy to get wrong: a limit
   * left out of the scale sits off the top of the chart on exactly the runs
   * where it was breached, so the one frame that most needs to show the
   * crossing is the one that hides it.
   */
  threshold?: { value: number; label: string } | null;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const uid = useId();
  const count = Math.max(...series.map((s) => s.values.length), 1);
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(...all, ...(threshold ? [threshold.value] : []));
  const hi = Math.max(...all, ...(threshold ? [threshold.value] : []));
  const thresholdY =
    threshold === null || threshold === undefined
      ? null
      : VIEW_PAD + (1 - (threshold.value - lo) / (hi - lo || 1)) * (VIEW_H - VIEW_PAD * 2);

  function fromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setIndex(Math.round(progress * (count - 1)));
  }

  return (
    /*
     * Focusable and arrow scrubbable. Their version is pointer only, which puts
     * every figure in the chart out of reach of a keyboard, and the figures are
     * the reason the chart is here.
     */
    <div
      role="group"
      aria-label={`${label}, use arrow keys to read each point`}
      tabIndex={0}
      onPointerDown={fromPointer}
      onPointerMove={(event) => index !== null && fromPointer(event)}
      onPointerEnter={fromPointer}
      onPointerLeave={() => setIndex(null)}
      onPointerCancel={() => setIndex(null)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          setIndex((current) => Math.min(count - 1, (current ?? -1) + 1));
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          setIndex((current) => Math.max(0, (current ?? count) - 1));
        } else if (event.key === "Escape") {
          setIndex(null);
        }
      }}
      className={`relative h-[150px] touch-none ${FOCUS_RING}`}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          {/*
           * A gradient per series, and the id is namespaced by `useId`.
           * A fixed id would be the classic SVG collision: the gallery renders
           * several charts on one page, every `url(#actual)` in the document
           * resolves to the FIRST element with that id, and the second card
           * silently paints in the first card's colour. It looks like a token
           * bug and it is a DOM bug.
           */}
          {series.map((line) => (
            <linearGradient key={line.id} id={`${uid}-${line.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesColour(line, verdict)} stopOpacity="0.28" />
              <stop offset="55%" stopColor={seriesColour(line, verdict)} stopOpacity="0.08" />
              <stop offset="100%" stopColor={seriesColour(line, verdict)} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/*
         * THE WASH IS ON THE OUTCOME, NEVER ON THE FORECAST, and the rule is
         * the same one that governs the rest of this component. Area states
         * magnitude — how much of a thing there was. A forecast is a belief
         * about a quantity, and it never had any. Washing under it would draw
         * volume for something that only ever existed as a sentence, which is
         * the present-tense claim this file is built to refuse. The forecast
         * keeps its dashed line and nothing else.
         */}
        {fill &&
          series
            .filter((line) => line.role === "actual")
            .map((line) => (
              <path
                key={`${line.id}-wash`}
                d={areaPath(pointsFor(line.values, lo, hi))}
                fill={`url(#${uid}-${line.id})`}
                stroke="none"
              />
            ))}

        {/*
         * The limit, drawn UNDER the series so the line that crossed it stays
         * the brightest thing in the frame. Dashed and neutral: a threshold is
         * a rule someone set, not an outcome and not a request, so it spends no
         * hue. The crossing is what carries the outcome colour, and it does
         * that on the series itself.
         */}
        {thresholdY !== null && (
          <line
            x1="0"
            y1={thresholdY}
            x2={VIEW_W}
            y2={thresholdY}
            stroke="var(--mrd-edge)"
            strokeWidth="1"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {series.map((line) => (
          <path
            key={line.id}
            d={curvePath(pointsFor(line.values, lo, hi))}
            fill="none"
            stroke={seriesColour(line, verdict)}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            /* Forecast is the belief, drawn as the softer of the two. */
            strokeDasharray={line.role === "forecast" ? "4 3" : undefined}
          />
        ))}
      </svg>

      {/*
       * THE RULE IS NOT LABELLED IN THE FRAME. It was, and rendering it proved
       * the label redundant: the card's own frame header already names the cap
       * two lines above, so the chart printed "$5.00 cap" twice within 40px of
       * itself. One dashed neutral line under a header that names a cap is not
       * ambiguous, and the second label was the kind of thing that reads as
       * unfinished rather than as thorough. If a future frame ever shows
       * something else in that header, put the label back here.
       */}

      {/*
       * THE LATEST POINT, marked permanently. The reference does this and it is
       * not decoration: a line chart with a bare stroke leaves the reader to
       * work out which end is now, and on a frame with two lines of different
       * lengths that guess is sometimes wrong. The dot says "this is where the
       * series has got to", which is the value every figure above the chart is
       * quoting. It hides while scrubbing so it cannot be mistaken for the
       * point under the cursor.
       */}
      {index === null &&
        series.map((line) => {
          const pts = pointsFor(line.values, lo, hi);
          const p = pts[pts.length - 1];
          if (!p) return null;
          return (
            <span
              key={`${line.id}-end`}
              aria-hidden
              className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${(p.x / VIEW_W) * 100}%`,
                top: `${(p.y / VIEW_H) * 100}%`,
                background: seriesColour(line, verdict),
              }}
            />
          );
        })}

      {/*
       * THE SCRUBBED POINT, and it is HTML rather than an SVG <circle> on
       * purpose. This chart stretches to its container with
       * `preserveAspectRatio="none"`, which is what lets one 300x120 viewBox
       * fill any width — and it scales x and y by different factors, so a
       * circle drawn inside it renders as an ellipse that changes shape with
       * the panel. `vectorEffect` does not save it; that rescues stroke width,
       * not geometry. Positioned in percentages out here, the dot is round at
       * every width.
       *
       * It earns its place: the rule below says WHERE the reader is, and with
       * two lines a few units apart it does not say which curve a tooltip
       * figure was read off.
       */}
      {index !== null &&
        series.map((line) => {
          const pts = pointsFor(line.values, lo, hi);
          const p = pts[Math.min(index, pts.length - 1)];
          if (!p) return null;
          return (
            <span
              key={`${line.id}-dot`}
              aria-hidden
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-mrd-sink"
              style={{
                left: `${(p.x / VIEW_W) * 100}%`,
                top: `${(p.y / VIEW_H) * 100}%`,
                background: seriesColour(line, verdict),
              }}
            />
          );
        })}

      {index !== null && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-px bg-mrd-edge"
            style={{ left: `${(index / Math.max(count - 1, 1)) * 100}%` }}
          />
          <span
            className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-mrd-chip border border-mrd-line bg-mrd-float px-2 py-1"
            style={{
              left: `${Math.min(Math.max((index / Math.max(count - 1, 1)) * 100, 26), 74)}%`,
              boxShadow: "var(--mrd-shadow-float)",
            }}
          >
            {series.map((line) => (
              <span
                key={line.id}
                className="flex items-center gap-1.5 text-mrd-tiny whitespace-nowrap text-mrd-body"
              >
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: seriesColour(line, verdict) }}
                />
                {line.label}
                <strong className="font-mrd-mono text-mrd-ink tabular-nums">
                  {format(line.values[Math.min(index, line.values.length - 1)])}
                </strong>
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}

/* ── the three card bodies ────────────────────────────────────────────── */

function TrendBody({ insight }: { insight: TrendInsight }) {
  const [view, setView] = useState(0);
  const format = insight.format ?? ((value: number) => String(value));
  const active = insight.views?.[view]?.series ?? insight.series;

  /*
   * The frame label is DERIVED, never typed. When the frame holds both a
   * belief and an outcome it says so, because that pairing is the entire
   * product thesis and it is the one thing a reader should not have to infer
   * from two dash patterns. With one line it simply names that line.
   */
  const hasForecast = active.some((line) => line.role === "forecast");
  const hasActual = active.some((line) => line.role === "actual");
  const frameLabel =
    hasForecast && hasActual
      ? "Forecast against what happened"
      : (active[0]?.label ?? insight.title);

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s4)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-mrd-base font-medium text-mrd-ink">{insight.title}</span>
        {insight.views && insight.views.length > 1 && (
          <span className="flex shrink-0 rounded-full bg-mrd-sink p-0.5">
            {insight.views.map((option, i) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={i === view}
                onClick={() => setView(i)}
                className={`rounded-full px-2 py-0.5 text-mrd-tiny font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
 i === view ? "bg-mrd-lift text-mrd-ink" : "text-mrd-mute hover:text-mrd-body"
 } ${FOCUS_RING}`}
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </div>

      {/*
       * ── THE STAT BLOCK, AND WHY IT REPLACED A LEGEND ────────────────────
       *
       * This was a row of dots and labels — a legend and nothing else, which
       * costs a full line of the card to say only which colour is which. The
       * reference spends the same line far better: one column per series
       * carrying its NAME, its CURRENT VALUE at reading size, and its MOVE
       * since the start of the window. That is the whole card's finding,
       * legible before the eye reaches the chart, and it still names the
       * colours — the dot is simply attached to a stat that was worth printing
       * anyway.
       *
       * The move is computed here rather than passed in, so it can never
       * disagree with the line drawn beside it. A figure typed into a fixture
       * next to a chart generated from data is a claim waiting to rot.
       */}
      <div className="mt-[var(--mrd-s3)] flex flex-wrap gap-x-6 gap-y-3">
        {active.map((line) => {
          const first = line.values[0];
          const last = line.values[line.values.length - 1];
          const move = last !== undefined && first !== undefined ? last - first : null;
          const tone = seriesColour(line, insight.verdict);
          return (
            <div key={line.id} className="min-w-0">
              <span className="flex items-center gap-1.5 text-mrd-data text-mrd-body">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: tone }}
                />
                <span className="truncate">{line.label}</span>
              </span>
              <span
                className="mt-0.5 block font-mrd-mono text-mrd-lead font-semibold tracking-[-0.01em] tabular-nums"
                style={{ color: tone }}
              >
                {last === undefined ? "—" : format(last)}
              </span>
              {/*
               * WHERE IT STARTED, not how far it moved, and the difference is
               * not pedantry. A delta printed through the series formatter puts
               * a "%" on a change that is measured in percentage POINTS — "+18%"
               * against a line that went 42 to 60, which is a 43% rise, not an
               * 18% one. Every unit has some version of that trap. Naming the
               * starting value sidesteps all of them: it is the same quantity in
               * the same unit as the headline, the reader does the subtraction
               * they were going to do anyway, and nothing on screen can be
               * wrong.
               */}
              {first !== undefined && (
                <span className="block text-mrd-data text-mrd-mute tabular-nums">
                  from {format(first)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-[var(--mrd-s3)] overflow-hidden rounded-mrd-ctl border border-mrd-line bg-mrd-sink">
        {/*
         * The frame's own header, which the port had dropped. It earns its
         * 28px: it names WHAT THE TWO LINES ARE, which a legend of coloured
         * dots never quite does, and it states whether the verdict has landed —
         * the one thing that decides whether the outcome line's colour means
         * anything yet.
         */}
        <div className="flex items-center justify-between gap-2 border-b border-mrd-line px-2.5 py-1.5">
          <span className="truncate text-mrd-tiny text-mrd-mute">{frameLabel}</span>
          <span className="shrink-0 rounded-full bg-mrd-lift px-2 py-0.5 text-mrd-micro font-medium text-mrd-body">
            {insight.verdict === "open" || insight.verdict === undefined ? "Open" : "Settled"}
          </span>
        </div>
        <Chart series={active} verdict={insight.verdict} format={format} label={insight.title} />
      </div>

      {/*
       * Figures carry their label. A number on its own here would be exactly
       * the shape the honesty rule bans, and a label costs one line.
       */}
      {insight.figures && insight.figures.length > 0 && (
        <dl className="mt-[var(--mrd-s4)] flex flex-wrap gap-x-6 gap-y-2">
          {insight.figures.map((figure) => (
            <div key={figure.label}>
              <dt className="text-mrd-tiny text-mrd-mute">{figure.label}</dt>
              <dd
                className={`font-mrd-mono text-mrd-lead font-semibold tabular-nums ${
                  figure.tone === "pass"
                    ? "text-mrd-pass"
                    : figure.tone === "fail"
                      ? "text-mrd-fail"
                      : "text-mrd-ink"
                }`}
              >
                {figure.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/*
 * ── THE SEGMENTED BAR, PORTED PROPERLY 2026-08-15 ───────────────────────
 *
 * The first port had the right ELEMENTS and none of the DETAIL, and the founder
 * caught it by putting the two side by side. Selection was a flat opacity step
 * from 0.5 to 1 and nothing else, so on a dark ground you could not see which
 * segment you had picked. Four things were missing, and all four are in the
 * reference's source rather than inferable from its screenshot:
 *
 *   1. TWO SHADES. Unselected segments sit at 0.58, not 0.5 — close enough to
 *      read as the same colour, far enough that the selected one is obviously
 *      lit. This is the "slightly lighter inside" in the founder's note.
 *   2. AN INSET RING on the selected segment. `inset` is the whole trick: an
 *      outer ring on a segment inside a clipping rounded container is shaved
 *      off by the container, which is exactly why ours was invisible.
 *   3. AN INNER WASH THAT SLIDES. A translucent bar animates its WIDTH from 0
 *      to full inside the chosen segment. That is the movement that makes the
 *      switch feel like a switch rather than a repaint, and it is the single
 *      most expensive-feeling detail on the card.
 *   4. A HERO FIGURE THAT FOLLOWS THE SELECTION. Their number is the ACTIVE
 *      segment's amount, so choosing a segment answers a question. Ours printed
 *      one fixed headline and the bar was decoration.
 *
 * WHAT IS DIFFERENT HERE, AND WHY. Their wash is `bg-white/20`, which is right
 * on their palette and wrong on paper — white over a light segment on the paper
 * ground is invisible. Ours is a token that resolves per ground, so the wash
 * lightens on dark and darkens on paper and the effect survives both.
 */
function SplitBody({ insight }: { insight: SplitInsight }) {
  const [selected, setSelected] = useState(insight.segments[0]?.id ?? "");
  const foundIndex = insight.segments.findIndex((segment) => segment.id === selected);
  const activeIndex = foundIndex === -1 ? 0 : foundIndex;
  const active = insight.segments[activeIndex];

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s4)]">
      <span className="flex items-center gap-1.5 text-mrd-base font-medium text-mrd-ink">
        {/*
         * The monogram disc, which the port had dropped. It takes the ACTIVE
         * segment's tone, so the card's identity mark moves with the selection
         * rather than being a fixed decoration.
         */}
        {active && (
          <span
            aria-hidden
            className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-mrd-nano font-bold"
            style={{ background: segmentFill(activeIndex, active.tone), color: "var(--mrd-bg)" }}
          >
            {active.label.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="truncate">{insight.title}</span>
      </span>

      {/*
       * The figure answers "how much is the thing I just selected", and falls
       * back to the card's own headline when a segment carries no amount.
       * `aria-live` so a keyboard reader is told the number changed — without
       * it, selecting a segment silently rewrites the largest text on screen.
       */}
      <span
        aria-live="polite"
        className="mt-1 block text-mrd-h3 font-semibold tracking-[-0.01em] text-mrd-ink tabular-nums"
      >
        {active?.amount ?? insight.headline}
      </span>

      <div
        role="group"
        aria-label={`${insight.title}, segments`}
        className="mt-[var(--mrd-s4)] flex h-9 gap-0.5 overflow-hidden rounded-full bg-mrd-sink p-0.5"
      >
        {insight.segments.map((segment, i) => {
          const on = selected === segment.id;
          return (
            <button
              key={segment.id}
              type="button"
              aria-pressed={on}
              aria-label={`${segment.label}, ${segment.percent} percent`}
              onClick={() => setSelected(segment.id)}
              className={`relative h-full overflow-hidden rounded-full transition-[opacity,transform,box-shadow] duration-300 active:scale-[0.98] ${FOCUS_RING}`}
              style={{
                /*
                 * A floor, so a 2% slice is still a target and still shows its
                 * ring. Percent alone renders roughly 6px at this card's width,
                 * which is under every published minimum for a pointer target
                 * and too narrow to draw a rounded cap inside. The distortion
                 * is bounded and only ever affects slices already too small to
                 * read; the exact figure is printed in the legend regardless.
                 */
                width: `max(${segment.percent}%, 18px)`,
                background: segmentFill(i, segment.tone),
                opacity: on ? 1 : 0.58,
                boxShadow: on ? "inset 0 0 0 1px var(--mrd-focus)" : undefined,
                transitionTimingFunction: "var(--mrd-ease)",
              }}
            >
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 rounded-full transition-[width,opacity] duration-500"
                style={{
                  width: on ? "calc(100% - 8px)" : "0%",
                  opacity: on ? 1 : 0,
                  background: "var(--mrd-hover)",
                  transitionTimingFunction: "var(--mrd-ease)",
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-[var(--mrd-s3)] flex flex-wrap items-center gap-1.5">
        {insight.segments.map((segment, i) => (
          <button
            key={segment.id}
            type="button"
            aria-pressed={selected === segment.id}
            onClick={() => setSelected(segment.id)}
            className={`flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-mrd-data transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
 selected === segment.id
 ? "bg-mrd-lift text-mrd-ink"
 : "text-mrd-body hover:bg-mrd-hover hover:text-mrd-ink"
 } ${FOCUS_RING}`}
          >
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: segmentFill(i, segment.tone) }}
            />
            {segment.label} <span className="tabular-nums">{segment.percent}%</span>
          </button>
        ))}
      </div>

      {/*
       * `min-h` so the card does not resize as the selected segment's detail
       * changes length. A panel that grows and shrinks under the pointer makes
       * the legend jump away from the cursor that is using it.
       */}
      {active && (
        <div className="mt-[var(--mrd-s4)] min-h-16 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-2.5 py-2">
          {/* Named, and in its own tone, so the panel and the bar agree. */}
          <span
            className="block text-mrd-data font-medium"
            style={{ color: segmentLabel(activeIndex, active.tone) }}
          >
            {active.label}
          </span>
          <span className="mt-1 block text-mrd-tiny leading-mrd-prose text-mrd-body">
            {active.detail}
          </span>
        </div>
      )}
    </div>
  );
}

function ThresholdBody({ insight }: { insight: ThresholdInsight }) {
  const [view, setView] = useState(0);
  const active = insight.views[view] ?? insight.views[0];
  const values = active?.values ?? [];
  const latest = values.length > 0 ? values[values.length - 1] : 0;
  const breached = latest > insight.limit;

  /*
   * ONE SERIES, and its colour is the verdict on the crossing. Below the limit
   * it is a neutral, because a measure inside its own cap is not an outcome
   * worth colouring; over it, it is `fail`. That is `verdict` doing exactly the
   * job it already does on the trend card, so the two cards agree about what a
   * colour means rather than each inventing its own rule.
   */
  const series: InsightSeries[] = [
    { id: active?.id ?? "value", label: active?.label ?? "", values, role: "actual" },
  ];

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s4)]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {/*
           * The arrow only appears on a breach, and it points the way the
           * measure went. On a card that is sometimes about a cap being HELD,
           * a permanent up-arrow would report a spike that did not happen.
           */}
          {breached && (
            <span aria-hidden className="shrink-0 text-mrd-fail">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </span>
          )}
          <span className="truncate text-mrd-base font-medium text-mrd-ink">{insight.title}</span>
        </span>

        {insight.views.length > 1 && (
          <span className="flex shrink-0 rounded-full bg-mrd-sink p-0.5">
            {insight.views.map((option, i) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={i === view}
                onClick={() => setView(i)}
                className={`rounded-full px-2 py-0.5 text-mrd-tiny font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
 i === view ? "bg-mrd-lift text-mrd-ink" : "text-mrd-mute hover:text-mrd-body"
 } ${FOCUS_RING}`}
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="mt-[var(--mrd-s3)] overflow-hidden rounded-mrd-ctl border border-mrd-line bg-mrd-sink">
        {/*
         * The frame's own header names the limit. The reference puts the
         * scrubbed value here and falls back to the threshold; ours states the
         * limit permanently, because the scrubbed figure already appears in the
         * tooltip on the line, and a header that changes under the pointer is a
         * second moving target in a frame that already has one.
         */}
        <div className="flex items-center justify-between gap-2 border-b border-mrd-line px-2.5 py-1.5">
          <span className="truncate font-mrd-mono text-mrd-tiny text-mrd-mute tabular-nums">
            {insight.limitLabel}
          </span>
          <span className="shrink-0 text-mrd-tiny text-mrd-mute">
            {breached ? "Crossed" : "Within"}
          </span>
        </div>

        {/*
         * `fill` off. The wash states magnitude by area, and this frame already
         * states magnitude against the limit line — two answers to one question
         * in the same space, with the wash sitting on top of the rule that is
         * the whole point of the card.
         */}
        <Chart
          series={series}
          verdict={breached ? "fail" : "open"}
          format={active?.format ?? String}
          label={insight.title}
          fill={false}
          threshold={{ value: insight.limit, label: insight.limitLabel }}
        />
      </div>

      <div className="mt-[var(--mrd-s4)] flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mrd-mono text-mrd-h3 font-semibold tracking-[-0.01em] text-mrd-ink tabular-nums">
          {insight.figure.value}
        </span>
        {insight.figure.over && (
          <span className="font-mrd-mono text-mrd-small text-mrd-fail tabular-nums">
            {insight.figure.over}
          </span>
        )}
        {insight.figure.note && (
          <span className="text-mrd-tiny text-mrd-mute">{insight.figure.note}</span>
        )}
      </div>
    </div>
  );
}

/* ── the three states ─────────────────────────────────────────────────── */

/*
 * The primary case. Written in the only tense that is true today: the loop is
 * built and it has not run on a real outcome yet, so nothing is claimed to have
 * been learnt. The single figure is labelled, so the zero is a measurement
 * rather than a verdict on the product.
 */
function NothingSettledYet({
  settledOutcomes,
  awaitingVerdict,
}: {
  settledOutcomes: number;
  awaitingVerdict?: number;
}) {
  return (
    <div
      data-mrd=""
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s5)]"
    >
      <span className="block text-mrd-lead font-medium text-mrd-ink">
        No outcome has been settled yet
      </span>
      <p className="mt-[var(--mrd-s3)] max-w-[46ch] mrd-copy">
        The loop is wired and proven, and it begins accruing on first real use. An insight appears
        here once a shipped decision gets its verdict at Learn and that verdict is written back
        against the call that caused it.
      </p>

      <dl className="mt-[var(--mrd-s5)] flex flex-wrap gap-x-8 gap-y-3 border-t border-mrd-line-soft pt-[var(--mrd-s4)]">
        <div>
          <dt className="text-mrd-tiny text-mrd-mute">Settled outcomes</dt>
          <dd className="font-mrd-mono text-mrd-h3 font-semibold text-mrd-ink tabular-nums">
            {settledOutcomes}
          </dd>
        </div>
        {awaitingVerdict !== undefined && (
          <div>
            <dt className="text-mrd-tiny text-mrd-mute">Awaiting a verdict</dt>
            <dd className="font-mrd-mono text-mrd-h3 font-semibold text-mrd-ink tabular-nums">
              {awaitingVerdict}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/*
 * A failed read, which is not an empty state and must not look like one. It
 * says what failed, it does not pretend to a number it never received, and it
 * offers the way out. The rule on colour holds even here: red is outcome, and a
 * read that fell over is an outcome, so red is correct on this one.
 */
function CouldNotRead({ reason, onRetry }: { reason: string; onRetry?: () => void }) {
  return (
    <div
      data-mrd=""
      role="alert"
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s5)]"
    >
      <span className="flex items-center gap-2 text-mrd-lead font-medium text-mrd-ink">
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mrd-fail)"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6M12 16.5v.01" />
        </svg>
        Learn could not be read
      </span>
      <p className="mt-[var(--mrd-s3)] max-w-[46ch] mrd-copy">
        {reason} Nothing below is missing because the station is empty; it is missing because this
        read did not complete.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-[var(--mrd-s4)] rounded-mrd-ctl bg-mrd-solid px-3 py-1.5 text-mrd-base font-medium text-mrd-on-solid transition-[filter,transform] duration-100 hover:brightness-110 active:scale-[0.97] ${FOCUS_RING}`}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/* ── inline helpers the lead sentence uses ────────────────────────────── */

/**
 * An inline mention. The dot says WHO, which is the only thing worth a colour
 * here: orchid when a person owns it, azure when an agent does.
 */
export function Entity({ name, by }: { name: string; by: "you" | "agent" }) {
  return (
    <span className="inline-flex items-center gap-1 align-baseline font-medium text-mrd-ink">
      <span
        aria-hidden
        className={`inline-block size-2.5 rounded-full ${by === "you" ? "bg-mrd-you" : "bg-mrd-agent"}`}
      />
      @{name}
    </span>
  );
}

/** A settled delta. Green and red only, because a delta is an outcome. */
export function Delta({ children, tone }: { children: ReactNode; tone: "pass" | "fail" }) {
  return (
    <code
      className={`font-mrd-mono text-mrd-data ${tone === "pass" ? "text-mrd-pass" : "text-mrd-fail"}`}
    >
      {children}
    </code>
  );
}

export function InsightCards({
  insights = [],
  settledOutcomes = 0,
  awaitingVerdict,
  loadError,
  onRetry,
  onFollowUp,
}: {
  /** Empty is the default on purpose. It is also production today. */
  insights?: Insight[];
  settledOutcomes?: number;
  awaitingVerdict?: number;
  /** A read that failed. Takes precedence over everything below it. */
  loadError?: string;
  onRetry?: () => void;
  onFollowUp?: (question: string) => void;
}) {
  const [page, setPage] = useState(0);
  const current = insights[Math.min(page, insights.length - 1)];

  function move(direction: -1 | 1) {
    setPage((currentPage) => (currentPage + direction + insights.length) % insights.length);
  }

  return (
    /*
     * ── A FLOOR, SO PAGING DOES NOT MOVE THE CARD ───────────────────────
     *
     * The three insights are different shapes — a trend chart with a stat
     * block, a threshold frame, a segmented breakdown — so they are naturally
     * different heights. Measured in the browser on 2026-08-15 while paging
     * the dense case: 524px, then 448px, then 424px. A HUNDRED PIXEL jump, and
     * the pager arrows are at the TOP of the card, so every press moved
     * everything below the card while the reader's pointer stayed put.
     *
     * The reference solves this the same way, with `min-h-[408px]` on its own
     * pager. Ours is 528 because our cards carry more: a frame header, a stat
     * block and a figures row the reference does not have. The number is the
     * measured tallest rounded up, not a guess, and it is a FLOOR — content
     * taller than this still grows, it simply cannot shrink below it.
     */
    <section
      data-mrd=""
      aria-label="Insights"
      className="w-full max-w-86"
      style={{ minHeight: 528 }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-mrd-base font-semibold text-mrd-ink">Insights</span>

        {insights.length > 0 && (
          <span className="flex items-center gap-1">
            {/*
             * "Insight 2 of 3", never "Insights 3". The label names what the
             * number is, which is a position. A bare total next to the word
             * Insights reads as proof that something was learnt, and that is
             * the shape this product does not use.
             */}
            <span aria-live="polite" className="text-mrd-data text-mrd-mute tabular-nums">
              Insight {page + 1} of {insights.length}
            </span>
            {(
              [
                ["M15 18l-6-6 6-6", "Previous insight", -1],
                ["M9 6l6 6-6 6", "Next insight", 1],
              ] as const
            ).map(([d, label, direction]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => move(direction)}
                className={`flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-[background-color,color,transform] duration-100 hover:bg-mrd-hover hover:text-mrd-ink active:scale-[0.96] ${FOCUS_RING}`}
              >
                <svg
                  aria-hidden
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={d} />
                </svg>
              </button>
            ))}
          </span>
        )}
      </div>

      <div className="mt-[var(--mrd-s4)]">
        {loadError ? (
          <CouldNotRead reason={loadError} onRetry={onRetry} />
        ) : !current ? (
          <NothingSettledYet settledOutcomes={settledOutcomes} awaitingVerdict={awaitingVerdict} />
        ) : (
          <div
            key={current.key}
            style={{
              animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both",
            }}
          >
            <p className="mrd-copy">{current.lead}</p>
            <div className="mt-[var(--mrd-s4)]">
              {current.kind === "trend" ? (
                <TrendBody insight={current} />
              ) : current.kind === "threshold" ? (
                <ThresholdBody insight={current} />
              ) : (
                <SplitBody insight={current} />
              )}
            </div>
            {current.followUp && (
              <button
                type="button"
                onClick={() => onFollowUp?.(current.followUp as string)}
                className={`mt-[var(--mrd-s4)] rounded-full border border-mrd-line bg-mrd-sheet px-3 py-1.5 text-left text-mrd-small text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover ${FOCUS_RING}`}
              >
                {current.followUp}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default InsightCards;
