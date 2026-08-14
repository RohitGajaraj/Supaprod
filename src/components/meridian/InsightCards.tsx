import { useState } from "react";
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
 * ── WHERE THEIR COLOUR WENT ─────────────────────────────────────────────
 * Their chart draws two categorical hues, an orange and a blue, picked so the
 * two lines are separable. A chart is exactly where an invented palette creeps
 * back into a system, so no hue here is chosen for separability. The roles
 * carry it: a forecast line is what a PERSON believed, so it is orchid at rest,
 * and the actual line is an OUTCOME, so it is green or red once settled and a
 * neutral while it is still open.
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
    tone: "pass" | "fail" | "open";
  }[];
  followUp?: string;
};

export type Insight = TrendInsight | SplitInsight;

const TONE_VAR = {
  pass: "var(--mrd-pass)",
  fail: "var(--mrd-fail)",
  open: "var(--mrd-body)",
} as const;

function seriesColour(series: InsightSeries, verdict: TrendInsight["verdict"]) {
  if (series.role === "forecast") return "var(--mrd-you-dim)";
  return TONE_VAR[verdict ?? "open"];
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-edge-focus)]";

/* ── the chart ────────────────────────────────────────────────────────── */

const VIEW_W = 300;
const VIEW_H = 120;
const VIEW_PAD = 12;

function pathFor(values: number[], lo: number, hi: number) {
  const span = hi - lo || 1;
  const stepX = values.length > 1 ? VIEW_W / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = VIEW_PAD + (1 - (value - lo) / span) * (VIEW_H - VIEW_PAD * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function Chart({
  series,
  verdict,
  format,
  label,
}: {
  series: InsightSeries[];
  verdict: TrendInsight["verdict"];
  format: (value: number) => string;
  label: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const count = Math.max(...series.map((s) => s.values.length), 1);
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(...all);
  const hi = Math.max(...all);

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
        {series.map((line) => (
          <path
            key={line.id}
            d={pathFor(line.values, lo, hi)}
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
                className="flex items-center gap-1.5 text-[11px] whitespace-nowrap text-mrd-body"
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

/* ── the two card bodies ──────────────────────────────────────────────── */

function TrendBody({ insight }: { insight: TrendInsight }) {
  const [view, setView] = useState(0);
  const format = insight.format ?? ((value: number) => String(value));
  const active = insight.views?.[view]?.series ?? insight.series;

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s4)]">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-mrd-ink">{insight.title}</span>
        {insight.views && insight.views.length > 1 && (
          <span className="flex shrink-0 rounded-full bg-mrd-sink p-0.5">
            {insight.views.map((option, i) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={i === view}
                onClick={() => setView(i)}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96] ${
                  i === view ? "bg-mrd-lift text-mrd-ink" : "text-mrd-mute hover:text-mrd-body"
                } ${FOCUS_RING}`}
              >
                {option.label}
              </button>
            ))}
          </span>
        )}
      </div>

      {/* Legend, which is also where each line's MEANING is stated in words. */}
      <div className="mt-[var(--mrd-s3)] flex flex-wrap items-center gap-x-4 gap-y-1">
        {active.map((line) => (
          <span key={line.id} className="flex items-center gap-1.5 text-[11.5px] text-mrd-body">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: seriesColour(line, insight.verdict) }}
            />
            {line.label}
          </span>
        ))}
      </div>

      <div className="mt-[var(--mrd-s3)] overflow-hidden rounded-mrd-ctl border border-mrd-line bg-mrd-sink">
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
              <dt className="text-[11px] text-mrd-mute">{figure.label}</dt>
              <dd
                className={`font-mrd-mono text-[16px] font-semibold tabular-nums ${
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

function SplitBody({ insight }: { insight: SplitInsight }) {
  const [selected, setSelected] = useState(insight.segments[0]?.id ?? "");
  const active = insight.segments.find((segment) => segment.id === selected) ?? insight.segments[0];

  return (
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s4)]">
      <span className="block text-[13px] font-medium text-mrd-ink">{insight.title}</span>
      <span className="mt-1 block font-mrd-mono text-[20px] font-semibold tracking-[-0.01em] text-mrd-ink tabular-nums">
        {insight.headline}
      </span>

      <div
        role="group"
        aria-label={`${insight.title}, segments`}
        className="mt-[var(--mrd-s4)] flex h-9 gap-0.5 overflow-hidden rounded-full bg-mrd-sink p-0.5"
      >
        {insight.segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            aria-pressed={selected === segment.id}
            aria-label={`${segment.label}, ${segment.percent} percent`}
            onClick={() => setSelected(segment.id)}
            className={`h-full rounded-full transition-[opacity,transform] duration-300 active:scale-[0.98] ${FOCUS_RING}`}
            style={{
              width: `${segment.percent}%`,
              background: TONE_VAR[segment.tone],
              opacity: selected === segment.id ? 1 : 0.5,
              transitionTimingFunction: "var(--mrd-ease)",
            }}
          />
        ))}
      </div>

      <div className="mt-[var(--mrd-s3)] flex flex-wrap items-center gap-1.5">
        {insight.segments.map((segment) => (
          <button
            key={segment.id}
            type="button"
            aria-pressed={selected === segment.id}
            onClick={() => setSelected(segment.id)}
            className={`flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[11.5px] transition-[background-color,color] duration-150 ${
              selected === segment.id
                ? "bg-mrd-lift text-mrd-ink"
                : "text-mrd-body hover:bg-mrd-hover hover:text-mrd-ink"
            } ${FOCUS_RING}`}
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: TONE_VAR[segment.tone] }}
            />
            {segment.label} <span className="font-mrd-mono tabular-nums">{segment.percent}%</span>
          </button>
        ))}
      </div>

      {active && (
        <p className="mt-[var(--mrd-s4)] rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-2.5 py-2 text-[11.5px] leading-relaxed text-mrd-body">
          {active.detail}
        </p>
      )}
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
    <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s5)]">
      <span className="block text-[16px] font-medium text-mrd-ink">
        No outcome has been settled yet
      </span>
      <p className="mt-[var(--mrd-s3)] max-w-[46ch] text-[13px] leading-relaxed text-mrd-body">
        The loop is wired and proven, and it begins accruing on first real use. An insight appears
        here once a shipped decision gets its verdict at Learn and that verdict is written back
        against the call that caused it.
      </p>

      <dl className="mt-[var(--mrd-s5)] flex flex-wrap gap-x-8 gap-y-3 border-t border-mrd-line-soft pt-[var(--mrd-s4)]">
        <div>
          <dt className="text-[11px] text-mrd-mute">Settled outcomes</dt>
          <dd className="font-mrd-mono text-[20px] font-semibold text-mrd-ink tabular-nums">
            {settledOutcomes}
          </dd>
        </div>
        {awaitingVerdict !== undefined && (
          <div>
            <dt className="text-[11px] text-mrd-mute">Awaiting a verdict</dt>
            <dd className="font-mrd-mono text-[20px] font-semibold text-mrd-ink tabular-nums">
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
      role="alert"
      className="rounded-mrd-card border border-mrd-line bg-mrd-sheet p-[var(--mrd-s5)]"
    >
      <span className="flex items-center gap-2 text-[16px] font-medium text-mrd-ink">
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
      <p className="mt-[var(--mrd-s3)] max-w-[46ch] text-[13px] leading-relaxed text-mrd-body">
        {reason} Nothing below is missing because the station is empty; it is missing because this
        read did not complete.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-[var(--mrd-s4)] rounded-mrd-ctl bg-mrd-solid px-3 py-1.5 text-[13px] font-medium text-mrd-ink transition-[filter,transform] duration-100 hover:brightness-110 active:scale-[0.97] ${FOCUS_RING}`}
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
      className={`font-mrd-mono text-[11.5px] ${tone === "pass" ? "text-mrd-pass" : "text-mrd-fail"}`}
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
    <section aria-label="Insights" className="w-full max-w-86">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-mrd-ink">Insights</span>

        {insights.length > 0 && (
          <span className="flex items-center gap-1">
            {/*
             * "Insight 2 of 3", never "Insights 3". The label names what the
             * number is, which is a position. A bare total next to the word
             * Insights reads as proof that something was learnt, and that is
             * the shape this product does not use.
             */}
            <span aria-live="polite" className="text-[11.5px] text-mrd-mute tabular-nums">
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
            <p className="text-[12.5px] leading-relaxed text-mrd-body">{current.lead}</p>
            <div className="mt-[var(--mrd-s4)]">
              {current.kind === "trend" ? (
                <TrendBody insight={current} />
              ) : (
                <SplitBody insight={current} />
              )}
            </div>
            {current.followUp && (
              <button
                type="button"
                onClick={() => onFollowUp?.(current.followUp as string)}
                className={`mt-[var(--mrd-s4)] rounded-full border border-mrd-line bg-mrd-sheet px-3 py-1.5 text-left text-[12px] text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover ${FOCUS_RING}`}
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
