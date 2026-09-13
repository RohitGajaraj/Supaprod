/**
 * DRIFT, one surface. Ported off the retired system (2026-07-29).
 *
 * It rides ?surface= inside the Quality room, which already draws the Surface,
 * the page title and the tab strip, so this file draws no second h1. The drill
 * subject is a Region title and the way back is the Region's own `goTo`, "All
 * surfaces", which is exactly how the room itself returns from a room to the
 * four rooms and how /admin/people returns from one person to the directory. A
 * page heading here would put a 25px title inside a page that already has one,
 * and a second h1 in the document outline. `goTo` and not `toggle`: it leaves
 * this region for a named destination, and it discloses nothing.
 *
 * KEEP / KILL, and why:
 *
 *  KILL the DrillHeader, the mono caps labels and the VerdictChip, for the
 *       reasons the list file states: mono is for DATA, and a status is a word.
 *  KILL the three bento grid. A card carrying the headline pair, a second card
 *       carrying a chart and two more carrying lists, all inside a region that
 *       is already one bordered container, is the card stack the standard bans.
 *       The facts are Lines and Rows inside plain Blocks now.
 *  KEEP the chart, alone in the pair, and this is the one judgment call in the
 *       port. On the list it was decoration: four pooled averages that could
 *       not say which surface moved. Here it is the opposite. A person standing
 *       on one surface with one open incident is deciding whether to resolve
 *       it, and that turns entirely on a shape a sentence cannot carry: a spike
 *       that has already come back is not a slide that is still going. So it
 *       survives as a minimal polyline drawn only from --sp-* tokens, with the
 *       stored baseline as a dashed gate line and the peak and the low labelled
 *       in Num. The interactive scrubber does NOT survive: the numbers a scrub
 *       would reveal are printed beside it, so the interaction bought nothing.
 *  KEEP every honesty rule the retired version had won. The window kicker is
 *       built from the user's real drift_baselines row. The headline pair and
 *       the delta come from the worst OPEN incident's stored values. The chart
 *       plots the surface's real per day series against the incident's STORED
 *       baseline, never a browser recomputed one: snapshots are capped at 30
 *       days while baseline_days can be 180, so client side baseline maths can
 *       silently lie. Probable cause and Action prose stay omitted, because
 *       drift_incidents.detail is always {}.
 *  KEEP every server function, every prop and the ["drift_overview"] key this
 *       shares with the list, so a resolve here still invalidates the list.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Resolving an incident,
 * reopening one and re-running the check are all consequential, and all three
 * used to end in a toast or in nothing at all. Each leaves a Receipt carrying
 * what it actually caused, and a failed write leaves a failed Receipt rather
 * than a message that erases itself.
 *
 * The metric vocabulary and formatters below are verbatim from DriftPanel
 * (module private there; react-refresh lint keeps value exports out of
 * component files). Change them in lockstep or the list and the drill disagree
 * on a number.
 */
import { useMemo, useState, type ReactNode } from "react";
import { failureLine, messageForPerson } from "@/lib/error-copy";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDriftOverview,
  runDriftNow,
  resolveDriftIncident,
  reopenDriftIncident,
} from "@/lib/drift.functions";
import { relTime } from "@/components/product/format";
import type { Incident, Snapshot } from "./DriftPanel";
import { Receipt } from "@/components/meridian/Receipt";

const DEFAULT_WINDOWS = { window_days: 7, baseline_days: 14 };

const METRIC_LABELS: Record<string, string> = {
  avg_latency_ms: "Latency",
  avg_total_tokens: "Tokens",
  avg_cost_usd: "Cost",
  avg_eval_score: "Eval score",
  error_rate: "Error rate",
};

function fmtMetric(metric: string, v: number) {
  if (metric === "avg_cost_usd") return `$${v.toFixed(4)}`;
  if (metric === "avg_latency_ms") return `${Math.round(v)}ms`;
  if (metric === "error_rate") return `${v.toFixed(1)}%`;
  if (metric === "avg_eval_score") return Math.round(v).toString(); // 0 to 100 scale (KI-14)
  return v.toFixed(1);
}

function fmtDelta(pct: number) {
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

type DayRow = {
  date: string;
  reqs: number;
  errs: number;
  latency: number;
  tokens: number;
  cost: number;
  errorRate: number;
  score: number | null;
};

/* Request weighted daily series for one metric (the list's trendByDay rule,
   scoped to a surface). Eval score is nullable, and days without a score are
   dropped rather than zero filled, because the detector skips them too. */
function seriesFor(days: DayRow[], metric: string): number[] {
  if (metric === "avg_eval_score")
    return days.filter((d) => d.score != null).map((d) => d.score as number);
  const sampled = days.filter((d) => d.reqs > 0);
  if (metric === "avg_latency_ms") return sampled.map((d) => d.latency);
  if (metric === "avg_total_tokens") return sampled.map((d) => d.tokens);
  if (metric === "avg_cost_usd") return sampled.map((d) => d.cost);
  if (metric === "error_rate") return sampled.map((d) => d.errorRate);
  return [];
}

function fmtDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** A full timestamp as a calendar day. relTime is right in a row's time slot,
 *  where "3h" is read as shorthand, and wrong inside a sentence, where it falls
 *  back to a date after a week and "since Jul 12 ago" stops being English. */
function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** What a write left behind, held for this visit. The durable record is the
 *  incident row itself. */
type Settled = { id: string; verb: string; consequence: ReactNode; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * The shape, and nothing else. No axes, no grid, no scrubber, no tooltip: the
 * numbers those would reveal are printed above it in Num, so the drawing is
 * left with the one job words cannot do, which is telling a spike from a slide.
 * Every colour is a --mrd-* token, and the stroke does not scale with the box,
 * so a wide region does not thicken the line. The watched stroke is
 * `--mrd-hold` rather than the retired `--sp-warn`: it is the same fact the
 * `Value` above it carries, and Meridian has no "warn" -- amber says stopped,
 * waiting on a condition, which is exactly what an open incident is.
 */
function Trend({
  series,
  baseline,
  watch,
  label,
}: {
  series: number[];
  baseline?: number;
  watch: boolean;
  label: string;
}) {
  const W = 300;
  const H = 64;
  const PAD = 3;
  const values = baseline != null ? [...series, baseline] : series;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => (series.length === 1 ? W / 2 : (i / (series.length - 1)) * W);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const points = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      style={{ width: "100%", height: H, display: "block", marginTop: "var(--mrd-s3)" }}
    >
      {baseline != null ? (
        <line
          x1={0}
          x2={W}
          y1={y(baseline)}
          y2={y(baseline)}
          stroke="var(--mrd-mute)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.55}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke={watch ? "var(--mrd-hold)" : "var(--mrd-mute)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DriftSurfaceDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchOverview = useServerFn(getDriftOverview);
  const runNow = useServerFn(runDriftNow);
  const resolveFn = useServerFn(resolveDriftIncident);
  const reopenFn = useServerFn(reopenDriftIncident);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["drift_overview"],
    queryFn: () => fetchOverview(),
  });

  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (verb: string, consequence: ReactNode, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed, at: nowStamp() },
      ...prev,
    ]);

  const runMut = useMutation({
    mutationFn: () => runNow(),
    onSuccess: (r) => {
      commit(
        "You ran the drift check",
        <>
          <Num>{r.snapshots}</Num> daily {r.snapshots === 1 ? "snapshot" : "snapshots"} rolled up
          across every surface. It opened <Num>{r.opened}</Num> and resolved <Num>{r.resolved}</Num>
          . This page is re-read from those numbers.
        </>,
      );
      qc.invalidateQueries({ queryKey: ["drift_overview"] });
    },
    onError: (e: Error) =>
      commit("You tried to run the drift check", failureLine("Nothing was rolled up.", e), true),
  });

  const snaps = useMemo(
    () => ((data?.snapshots ?? []) as Snapshot[]).filter((s) => s.surface === id),
    [data?.snapshots, id],
  );
  const openIncidents = useMemo(
    () => ((data?.openIncidents ?? []) as Incident[]).filter((i) => i.surface === id),
    [data?.openIncidents, id],
  );
  const recentIncidents = useMemo(
    () => ((data?.recentIncidents ?? []) as Incident[]).filter((i) => i.surface === id),
    [data?.recentIncidents, id],
  );

  const incidents = useMemo(
    () => [...openIncidents, ...recentIncidents],
    [openIncidents, recentIncidents],
  );

  const decideMut = useMutation({
    mutationFn: async ({
      incidentId,
      action,
    }: {
      incidentId: string;
      action: "resolve" | "reopen";
    }) => {
      if (action === "resolve") return resolveFn({ data: { id: incidentId } });
      return reopenFn({ data: { id: incidentId } });
    },
    onSuccess: (_r, { incidentId, action }) => {
      // The consequence is per incident, so it names the metric and the model
      // the incident is actually keyed to rather than confirming a click.
      const inc = incidents.find((i) => i.id === incidentId);
      const what = inc ? `${METRIC_LABELS[inc.metric] ?? inc.metric} on ${inc.model}` : "It";
      if (action === "resolve") {
        commit(
          "You resolved it",
          `${what} goes back to stable. The next sample re-tests it and opens a new incident if it moves again.`,
        );
      } else {
        commit(
          "You reopened it",
          `${what} is back on watch, and this surface counts as drifting until a sample clears it.`,
        );
      }
      qc.invalidateQueries({ queryKey: ["drift_overview"] });
    },
    onError: (e: Error, { action }) =>
      commit(
        action === "resolve" ? "You tried to resolve it" : "You tried to reopen it",
        failureLine("The incident is unchanged.", e),
        true,
      ),
  });

  // Same headline rule as the list row: worst open incident by absolute delta.
  const worst = useMemo(
    () =>
      [...openIncidents].sort(
        (a, b) => Math.abs(Number(b.delta_pct)) - Math.abs(Number(a.delta_pct)),
      )[0] ?? null,
    [openIncidents],
  );

  // Per day rollup across this surface's models, request weighted exactly like
  // the list's, plus a nullable eval score channel.
  const days = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        reqs: number;
        errs: number;
        lat: number;
        tok: number;
        cost: number;
        scoreSum: number;
        scoreReqs: number;
      }
    >();
    for (const s of snaps) {
      const reqs = Number(s.request_count) || 0;
      let row = map.get(s.bucket_date);
      if (!row) {
        row = {
          date: s.bucket_date,
          reqs: 0,
          errs: 0,
          lat: 0,
          tok: 0,
          cost: 0,
          scoreSum: 0,
          scoreReqs: 0,
        };
        map.set(s.bucket_date, row);
      }
      row.lat += Number(s.avg_latency_ms) * reqs;
      row.tok += Number(s.avg_total_tokens) * reqs;
      row.cost += Number(s.avg_cost_usd) * reqs;
      row.reqs += reqs;
      row.errs += Number(s.error_count) || 0;
      if (s.avg_eval_score != null) {
        row.scoreSum += Number(s.avg_eval_score) * reqs;
        row.scoreReqs += reqs;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r): DayRow => ({
        date: r.date,
        reqs: r.reqs,
        errs: r.errs,
        latency: r.reqs ? r.lat / r.reqs : 0,
        tokens: r.reqs ? r.tok / r.reqs : 0,
        cost: r.reqs ? r.cost / r.reqs : 0,
        errorRate: r.reqs ? (r.errs / r.reqs) * 100 : 0,
        score: r.scoreReqs ? r.scoreSum / r.scoreReqs : null,
      }));
  }, [snaps]);

  // On watch, the incident metric's own daily series against its STORED
  // baseline. On stable, calls per day, the one metric neutral real series.
  // The labels carry the real sampled day count, never a hardcoded window.
  const chart: { series: number[]; baseline?: number; metric: string; label: string } =
    useMemo(() => {
      if (worst) {
        const series = seriesFor(days, worst.metric);
        return {
          series,
          baseline: Number(worst.baseline_value),
          metric: worst.metric,
          label: `${METRIC_LABELS[worst.metric] ?? worst.metric} against its baseline, across ${series.length} sampled days`,
        };
      }
      const series = days.map((d) => d.reqs);
      return {
        series,
        metric: "calls",
        label: `Calls per day, across ${series.length} sampled days`,
      };
    }, [worst, days]);

  const recentDays = useMemo(() => days.slice(-7).reverse(), [days]);

  const watch = openIncidents.length > 0;

  const cfgSrc = (data?.baseline ?? {}) as Partial<typeof DEFAULT_WINDOWS>;
  const windowDays = Number(cfgSrc.window_days ?? DEFAULT_WINDOWS.window_days);
  const baselineDays = Number(cfgSrc.baseline_days ?? DEFAULT_WINDOWS.baseline_days);

  const back = () =>
    navigate({ to: "/team", search: { tab: "spend", room: "quality", view: "drift" } });

  const windows = (
    <>
      Comparing the last <Num>{windowDays}</Num> days against a <Num>{baselineDays}</Num> day
      baseline.
    </>
  );

  // A failed read may never wear an empty state's clothes, and the way back
  // stays reachable in every state.
  if (error) {
    return (
      <Region title={id} goTo="All surfaces" onGoTo={back}>
        <ReadFailedLine error={error} onRetry={() => void refetch()}>
          This surface did not load, so nothing here is a claim about whether it drifted.{" "}
          {messageForPerson(error)}
        </ReadFailedLine>
      </Region>
    );
  }

  if (isLoading) {
    return (
      <Region title={id} goTo="All surfaces" onGoTo={back}>
        <Reading>Reading this surface.</Reading>
      </Region>
    );
  }

  if (snaps.length === 0 && incidents.length === 0) {
    return (
      <Region title={id} goTo="All surfaces" onGoTo={back}>
        <NothingYet action={<Action onClick={back}>Back to all surfaces</Action>}>
          Nothing has been sampled on this surface in the last 30 days, so there is nothing to
          compare it against.
        </NothingYet>
      </Region>
    );
  }

  const peak = chart.series.length ? Math.max(...chart.series) : null;
  const low = chart.series.length ? Math.min(...chart.series) : null;
  const chartFmt = (v: number) =>
    chart.metric === "calls" ? String(Math.round(v)) : fmtMetric(chart.metric, v);

  return (
    <>
      <Region title={id} sub={windows} goTo="All surfaces" onGoTo={back}>
        {worst ? (
          <Line
            label={METRIC_LABELS[worst.metric] ?? worst.metric}
            // The verdict, not the numbers. The baseline and current pair lives
            // on the incident row below, where the control that settles it is,
            // so the same figures are never printed twice on one screen.
            sub={
              <>
                Past its threshold since <Num>{fmtWhen(worst.detected_at)}</Num>.
                {/* INCIDENTS, and the noun matters. This counts openIncidents,
                    and the Incidents block below states the reason they are not
                    the same set as metrics: each incident is keyed to a single
                    model AND a single metric, so latency drifting on gpt-4 and
                    on claude is two incidents carrying one metric name. It read
                    "1 other metric is open" until 2026-08-10, so a person who
                    scrolled down expecting a second metric found Latency listed
                    twice and stopped trusting the count. If the metric count is
                    ever the fact wanted here, DERIVE it from the incidents
                    (new Set(openIncidents.map((i) => i.metric)).size - 1) rather
                    than relabelling this one. */}
                {openIncidents.length > 1 ? (
                  <>
                    {" "}
                    <Num>{openIncidents.length - 1}</Num> other{" "}
                    {openIncidents.length === 2 ? "incident is" : "incidents are"} open on this
                    surface too.
                  </>
                ) : null}
              </>
            }
          >
            <Value tone="hold">
              <Num>{fmtDelta(Number(worst.delta_pct))}</Num>
            </Value>
          </Line>
        ) : (
          <Line
            label="Drift"
            sub="Nothing on this surface has moved past its threshold, on any metric or any model."
          >
            <Value tone="pass">stable</Value>
          </Line>
        )}

        <Actions>
          <Action busy={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? "Checking" : "Run the drift check"}
          </Action>
        </Actions>
      </Region>

      <Region
        title="How it moved"
        sub={
          chart.series.length >= 2 && peak != null && low != null ? (
            <>
              {chart.label}. Peak <Num>{chartFmt(peak)}</Num>, low <Num>{chartFmt(low)}</Num>
              {chart.baseline != null ? (
                <>
                  , baseline <Num>{fmtMetric(chart.metric, chart.baseline)}</Num>
                </>
              ) : null}
              .
            </>
          ) : chart.series.length === 1 ? (
            "One sampled day so far. A shape needs a second one."
          ) : (
            "No sampled day carries this metric yet, so there is no shape to draw."
          )
        }
      >
        {chart.series.length >= 2 ? (
          <Trend
            series={chart.series}
            baseline={chart.baseline}
            watch={watch}
            label={chart.label}
          />
        ) : null}
      </Region>

      <Region
        title="Incidents"
        sub="Open and recently resolved. Each one is keyed to a single model and a single metric, so one surface can carry several."
      >
        {/* The empty state may claim no more than this block read. `incidents`
            is openIncidents plus recentIncidents, and the second of those is a
            RECENT list by its own name, so an empty one means nothing is open
            and nothing resolved lately. It said "no incident has ever opened"
            until 2026-08-10, which let a person whose only incident resolved
            outside that window read a clean-history claim off a recent-window
            read and stop looking for the drift they came to check. */}
        {incidents.length === 0 ? (
          <NothingYet>
            No incident is open on this surface, and none has been resolved recently. The detector
            compares the last <Num>{windowDays}</Num> days against a <Num>{baselineDays}</Num> day
            baseline every time it runs.
          </NothingYet>
        ) : (
          incidents.map((inc) => {
            const isOpen = inc.status === "open";
            const critical = isOpen && inc.severity === "critical";
            const busy = decideMut.isPending && decideMut.variables?.incidentId === inc.id;
            return (
              <Row
                key={inc.id}
                tight
                lead={
                  <>
                    {METRIC_LABELS[inc.metric] ?? inc.metric}{" "}
                    <Num>{fmtMetric(inc.metric, Number(inc.baseline_value))}</Num> to{" "}
                    <Num>{fmtMetric(inc.metric, Number(inc.current_value))}</Num>
                  </>
                }
                sub={
                  <>
                    <span className={isOpen ? (critical ? "sp-fail" : "sp-warn") : "sp-pass"}>
                      {critical ? "critical" : isOpen ? "on watch" : "resolved"}
                    </span>
                    {" · "}
                    <Num>{fmtDelta(Number(inc.delta_pct))}</Num>
                    {" · "}
                    {inc.model}
                  </>
                }
                time={relTime(inc.detected_at)}
                action={
                  <Action
                    variant="quiet"
                    busy={busy}
                    onClick={() =>
                      decideMut.mutate({
                        incidentId: inc.id,
                        action: isOpen ? "resolve" : "reopen",
                      })
                    }
                  >
                    {busy ? "Saving" : isOpen ? "Resolve" : "Reopen"}
                  </Action>
                }
              />
            );
          })
        )}
      </Region>

      {settled.length > 0 ? (
        <Region title="What you changed">
          {settled.map((s) => (
            <Receipt
              key={s.id}
              verb={s.verb}
              consequence={s.consequence}
              failed={s.failed}
              time={s.at}
            />
          ))}
        </Region>
      ) : null}

      <Region title="Recent samples" sub="The last seven days that were rolled up, newest first.">
        {recentDays.length === 0 ? (
          <NothingYet>
            No day has been rolled up yet. Run the drift check above and it rolls up today.
          </NothingYet>
        ) : (
          recentDays.map((d) => (
            <Row
              key={d.date}
              tight
              lead={
                <>
                  <Num>{d.reqs}</Num> {d.reqs === 1 ? "call" : "calls"}, <Num>{d.errs}</Num>{" "}
                  {d.errs === 1 ? "error" : "errors"}
                </>
              }
              time={fmtDay(d.date)}
            />
          ))
        )}
      </Region>
    </>
  );
}
