/**
 * DRIFT, the list. Ported off the retired system (2026-07-29).
 *
 * It renders inside the Quality room, which already draws the Surface, the
 * page title, the tab strip and the Region around this body. So this file draws
 * no Surface and no second title: it is content, not a page.
 *
 * KEEP / KILL, and why:
 *
 *  KILL the bento table. Five CSS grid columns, a header strip in mono caps and
 *       a chevron on every line is a hand-rolled table wearing a card. A
 *       surface is a Row now: the name leads, the second line carries ONE
 *       different fact (what moved and by how much, or how long it has been
 *       quiet), the time slot says when it was last sampled, and the whole row
 *       opens the drill. The chevron goes with it: a Row with an onClick
 *       already reads as openable, so a chevron per line is decoration.
 *  KILL the VerdictChip. A drift status is a WORD. A pill inside a row is a
 *       card inside a card, and the word survives greyscale on its own.
 *  KILL the mono caps labels. Mono is for DATA, so every delta, threshold,
 *       count, day figure and cost is in Num, and nothing else is.
 *  KILL the four trend cards. They plotted request weighted averages POOLED
 *       ACROSS EVERY SURFACE, on the one screen whose whole job is to say WHICH
 *       surface moved. The shape answered no question the list above it had not
 *       already answered by name, and four bordered cards inside a bordered
 *       region is the card stack the standard bans. The four facts survive as
 *       four lines: the latest value, with the peak and the low across the
 *       sampled window. The per surface SHAPE, which genuinely does carry
 *       information a sentence cannot, is drawn in the drill, where a person is
 *       actually asking whether a metric spiked or slid.
 *  KEEP every server function, the ["drift_overview"] key this shares with the
 *       drill, and the Incident / Snapshot exports.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10). Running a check and moving a
 * threshold both change what the detector does next, and both used to end in a
 * toast that erased itself in four seconds. Each leaves a Receipt carrying the
 * real consequence the server returned, and a failed write leaves a failed
 * Receipt rather than silence.
 *
 * The metric vocabulary and formatters are re-declared in DriftSurfaceDetail
 * verbatim (react-refresh lint keeps value exports out of component files).
 * Change them in lockstep, or the list and the drill disagree on a number.
 */
import { useNavigate } from "@tanstack/react-router";
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
import { Checkbox, Input } from "@/components/meridian/forms";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { getDriftOverview, runDriftNow, updateDriftBaseline } from "@/lib/drift.functions";
import { relTime } from "@/components/product/format";
import { Receipt } from "@/components/meridian/Receipt";

const DEFAULT_CFG = {
  window_days: 7,
  baseline_days: 14,
  latency_pct_threshold: 25,
  tokens_pct_threshold: 30,
  cost_pct_threshold: 30,
  score_pct_threshold: 10,
  error_rate_pct_threshold: 5,
  enabled: true,
};

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

/** A snapshot bucket is a DATE, so it is read at local midnight before it is
 *  turned into a relative stamp. Parsing the bare date string would read it as
 *  UTC and put today's roll-up a timezone off. */
function sampledAgo(bucketDate: string | null): string | null {
  if (!bucketDate) return null;
  const d = new Date(`${bucketDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : relTime(d.toISOString());
}

export type Incident = {
  id: string;
  status: string;
  surface: string;
  model: string;
  metric: string;
  baseline_value: number | string;
  current_value: number | string;
  delta_pct: number | string;
  severity: string;
  detected_at: string;
};

export type Snapshot = {
  bucket_date: string;
  surface: string;
  avg_latency_ms: number | string;
  avg_total_tokens: number | string;
  avg_cost_usd: number | string;
  avg_eval_score: number | string | null;
  error_count: number | string;
  request_count: number | string;
};

/** What a write left behind, held for this visit. The durable record is the
 *  drift_incidents table itself; a second copy of it here would be a second
 *  source of one truth. */
type Settled = { id: string; verb: string; consequence: ReactNode; failed?: boolean; at: string };

function nowStamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** The seven numbers that decide what counts as drift, as label and key. Each
 *  label carries its own unit, so no line needs a second one saying it again. */
type ThresholdKey = Exclude<keyof typeof DEFAULT_CFG, "enabled">;

const THRESHOLDS: [string, ThresholdKey, string][] = [
  ["Recent window in days", "window_days", "What every check treats as now."],
  ["Baseline window in days", "baseline_days", "What it compares that against."],
  [
    "Latency threshold in percent",
    "latency_pct_threshold",
    "How far average latency may move from its baseline before it opens an incident.",
  ],
  [
    "Tokens threshold in percent",
    "tokens_pct_threshold",
    "How far average tokens per call may move.",
  ],
  ["Cost threshold in percent", "cost_pct_threshold", "How far average cost per call may move."],
  ["Eval score drop in percent", "score_pct_threshold", "How far an average score may fall."],
  [
    "Error rate threshold in percent",
    "error_rate_pct_threshold",
    "How far the error rate may rise.",
  ],
];

export function DriftPanel() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchOverview = useServerFn(getDriftOverview);
  const runNow = useServerFn(runDriftNow);
  const saveCfg = useServerFn(updateDriftBaseline);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["drift_overview"],
    queryFn: () => fetchOverview(),
  });

  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [cfgOpen, setCfgOpen] = useState(false);
  useEffect(() => {
    if (data?.baseline) setCfg({ ...DEFAULT_CFG, ...data.baseline });
  }, [data?.baseline]);

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
          <Num>{r.snapshots}</Num> daily {r.snapshots === 1 ? "snapshot" : "snapshots"} rolled up.
          It opened <Num>{r.opened}</Num> and resolved <Num>{r.resolved}</Num>. The list above is
          re-read from those numbers.
        </>,
      );
      qc.invalidateQueries({ queryKey: ["drift_overview"] });
    },
    onError: (e: Error) =>
      commit("You tried to run the drift check", failureLine("Nothing was rolled up.", e), true),
  });

  const saveMut = useMutation({
    mutationFn: () => saveCfg({ data: cfg }),
    onSuccess: () => {
      commit(
        "You moved the baseline",
        cfg.enabled ? (
          <>
            The next check compares the last <Num>{cfg.window_days}</Num> days against a{" "}
            <Num>{cfg.baseline_days}</Num> day baseline. Incidents already open keep the numbers
            they were opened on.
          </>
        ) : (
          "Detection is off, so checks keep rolling up snapshots and nothing gets flagged until you turn it back on."
        ),
      );
      setCfgOpen(false);
      qc.invalidateQueries({ queryKey: ["drift_overview"] });
    },
    onError: (e: Error) =>
      commit("You tried to move the baseline", failureLine("The old one still stands.", e), true),
  });

  const snapshots = useMemo(() => (data?.snapshots ?? []) as Snapshot[], [data?.snapshots]);
  const openIncidents = useMemo(
    () => (data?.openIncidents ?? []) as Incident[],
    [data?.openIncidents],
  );
  const recentIncidents = useMemo(
    () => (data?.recentIncidents ?? []) as Incident[],
    [data?.recentIncidents],
  );

  // How much of the record each surface actually has. Both facts are read off
  // real snapshot rows; a surface with none of them says nothing rather than
  // borrowing another surface's window.
  const sampling = useMemo(() => {
    const map = new Map<string, { days: Set<string>; last: string | null }>();
    for (const s of snapshots) {
      let e = map.get(s.surface);
      if (!e) {
        e = { days: new Set<string>(), last: null };
        map.set(s.surface, e);
      }
      e.days.add(s.bucket_date);
      if (!e.last || s.bucket_date > e.last) e.last = s.bucket_date;
    }
    return map;
  }, [snapshots]);

  // One row per AI surface, on watch when an open incident exists, else stable.
  // The delta comes from the worst open incident; a stable surface carries no
  // delta at all, because the detector found none and inventing one would be a
  // fabricated number.
  const rows = useMemo(() => {
    const surfaces = new Set<string>();
    for (const s of snapshots) surfaces.add(s.surface);
    for (const i of openIncidents) surfaces.add(i.surface);
    for (const i of recentIncidents) surfaces.add(i.surface);
    return Array.from(surfaces)
      .map((surface) => {
        const open = openIncidents
          .filter((i) => i.surface === surface)
          .sort((a, b) => Math.abs(Number(b.delta_pct)) - Math.abs(Number(a.delta_pct)));
        const worst = open[0];
        const seen = sampling.get(surface);
        return {
          surface,
          watch: open.length > 0,
          delta: worst ? fmtDelta(Number(worst.delta_pct)) : null,
          moved: worst
            ? `${METRIC_LABELS[worst.metric] ?? worst.metric} ${fmtMetric(worst.metric, Number(worst.baseline_value))} to ${fmtMetric(worst.metric, Number(worst.current_value))}`
            : null,
          alsoOpen: Math.max(0, open.length - 1),
          days: seen?.days.size ?? 0,
          last: seen?.last ?? null,
        };
      })
      .sort((a, b) => Number(b.watch) - Number(a.watch) || a.surface.localeCompare(b.surface));
  }, [snapshots, openIncidents, recentIncidents, sampling]);

  const watching = rows.filter((r) => r.watch).length;

  // Request weighted daily averages across every surface. It is the whole
  // engine's movement rather than any one surface's, which is why it reads as
  // four facts at the foot of the list and not as four charts above it.
  const trendByDay = useMemo(() => {
    const map = new Map<
      string,
      { date: string; latency: number; tokens: number; cost: number; reqs: number; errs: number }
    >();
    for (const s of snapshots) {
      const k = s.bucket_date;
      const reqs = Number(s.request_count) || 0;
      let row = map.get(k);
      if (!row) {
        row = { date: k, latency: 0, tokens: 0, cost: 0, reqs: 0, errs: 0 };
        map.set(k, row);
      }
      row.latency += Number(s.avg_latency_ms) * reqs;
      row.tokens += Number(s.avg_total_tokens) * reqs;
      row.cost += Number(s.avg_cost_usd) * reqs;
      row.reqs += reqs;
      row.errs += Number(s.error_count) || 0;
    }
    return Array.from(map.values())
      .map((r) => ({
        date: r.date,
        latency: r.reqs ? r.latency / r.reqs : 0,
        tokens: r.reqs ? r.tokens / r.reqs : 0,
        cost: r.reqs ? r.cost / r.reqs : 0,
        errorRate: r.reqs ? (r.errs / r.reqs) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [snapshots]);

  // A failed read is not an empty list. "Nothing has drifted" and "we could not
  // find out whether anything drifted" are different facts, and a person acts
  // differently on each.
  if (error) {
    return (
      <ReadFailedLine onRetry={() => void refetch()}>
        The drift record did not load, so this is not a claim that nothing moved.{" "}
        {messageForPerson(error)}
      </ReadFailedLine>
    );
  }

  if (isLoading) return <Reading>Reading the drift record.</Reading>;

  return (
    <>
      {rows.length > 0 ? (
        <p className="sp-subtitle">
          <Num>{rows.length}</Num> AI {rows.length === 1 ? "surface" : "surfaces"} sampled.{" "}
          {watching === 0 ? (
            "None has moved past its threshold."
          ) : (
            <>
              <Num>{watching}</Num> {watching === 1 ? "is" : "are"} on watch.
            </>
          )}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <NothingYet
          action={
            <Action busy={runMut.isPending} onClick={() => runMut.mutate()}>
              {runMut.isPending ? "Checking" : "Run the drift check"}
            </Action>
          }
        >
          Nothing has been sampled yet. Once AI calls accumulate, Supaprod rolls a snapshot a day
          and flags any surface that moves against its own baseline.
        </NothingYet>
      ) : (
        rows.map((d) => (
          <Row
            key={d.surface}
            tight
            lead={d.surface}
            // ONE different fact, never more of the name: what moved and by how
            // much on a watched surface, how long it has been quiet on a stable
            // one.
            sub={
              d.watch ? (
                <>
                  <span className="sp-warn">On watch</span>
                  {" · "}
                  <Num>{d.delta}</Num>
                  {" · "}
                  {d.moved}
                  {/* Say the noun. This is the same figure the drill prints
                      (DriftSurfaceDetail), and while this row read "2 more
                      open" the drill read "2 other metrics", so one number wore
                      two different nouns across one click and neither was
                      checkable. It is incidents: alsoOpen is open.length - 1,
                      and an incident is keyed to one model and one metric, so
                      several of them can carry the same metric name. */}
                  {d.alsoOpen > 0 ? (
                    <>
                      {" · "}
                      <Num>{d.alsoOpen}</Num> more {d.alsoOpen === 1 ? "incident" : "incidents"}{" "}
                      open
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  Stable
                  {d.days > 0 ? (
                    <>
                      {" · "}
                      <Num>{d.days}</Num> {d.days === 1 ? "day" : "days"} sampled
                    </>
                  ) : null}
                </>
              )
            }
            time={sampledAgo(d.last)}
            onClick={() =>
              navigate({
                to: "/engine-room",
                search: { room: "quality", view: "drift", surface: d.surface },
              })
            }
          />
        ))
      )}

      {/* The run control is drawn once. On day one it lives in the empty state,
          which is where the next action belongs; after that it lives here. The
          baseline is reachable in both, because a boundary set before any data
          arrives is exactly what policy in advance means. */}
      <Actions>
        {rows.length > 0 ? (
          <Action busy={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? "Checking" : "Run the drift check"}
          </Action>
        ) : null}
        <Action variant="quiet" aria-expanded={cfgOpen} onClick={() => setCfgOpen((v) => !v)}>
          {cfgOpen ? "Close" : "Set the baseline"}
        </Action>
      </Actions>

      {cfgOpen ? (
        <Region
          title="Baseline"
          sub="Policy, set in advance. Every check runs against these numbers without stopping to ask."
        >
          <Line
            label="Detection"
            sub={
              cfg.enabled
                ? "On. Every check measures each surface against its own baseline and opens an incident when one breaks."
                : "Off. Checks still roll up snapshots, and nothing gets flagged until you turn this back on."
            }
            htmlFor="drift-enabled"
          >
            <Checkbox
              id="drift-enabled"
              label="Detection"
              checked={cfg.enabled}
              onChange={(next) => setCfg({ ...cfg, enabled: next })}
            />
          </Line>

          {THRESHOLDS.map(([label, key, why]) => (
            <Line key={key} label={label} sub={why} htmlFor={`drift-${key}`}>
              <Input
                id={`drift-${key}`}
                type="number"
                value={Number(cfg[key])}
                onChange={(e) => setCfg({ ...cfg, [key]: Number(e.target.value) })}
                style={{ width: 96 }}
              />
            </Line>
          ))}

          <Actions>
            <Action variant="primary" busy={saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? "Saving" : "Save the baseline"}
            </Action>
          </Actions>
        </Region>
      ) : null}

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

      {trendByDay.length > 1 ? (
        <Region
          title="Across every surface"
          sub="Request weighted daily averages from the last 30 days of snapshots. This is the whole engine's movement, not any one surface's."
        >
          <PooledLine
            label="Average latency"
            metric="avg_latency_ms"
            series={trendByDay.map((d) => d.latency)}
          />
          <PooledLine
            label="Average tokens per call"
            metric="avg_total_tokens"
            series={trendByDay.map((d) => d.tokens)}
          />
          <PooledLine
            label="Average cost per call"
            metric="avg_cost_usd"
            series={trendByDay.map((d) => d.cost)}
          />
          <PooledLine
            label="Error rate"
            metric="error_rate"
            series={trendByDay.map((d) => d.errorRate)}
          />
        </Region>
      ) : null}
    </>
  );
}

/** One pooled metric: the latest reading on the right, and the range it moved
 *  through on the second line. It replaces a chart because a chart of averages
 *  taken across every surface at once cannot say which surface moved, and that
 *  is the only question this screen is here to answer. */
function PooledLine({
  label,
  metric,
  series,
}: {
  label: string;
  metric: string;
  series: number[];
}) {
  const latest = series[series.length - 1];
  const peak = Math.max(...series);
  const low = Math.min(...series);
  return (
    <Line
      label={label}
      sub={
        <>
          Peak <Num>{fmtMetric(metric, peak)}</Num>, low <Num>{fmtMetric(metric, low)}</Num> across{" "}
          <Num>{series.length}</Num> sampled days
        </>
      }
    >
      <Value>
        <Num>{fmtMetric(metric, latest)}</Num>
      </Value>
    </Line>
  );
}

export function useDriftCounts() {
  const fetchOverview = useServerFn(getDriftOverview);
  const { data } = useQuery({
    queryKey: ["drift_overview"],
    queryFn: () => fetchOverview(),
  });
  return { open: data?.openIncidents?.length ?? 0 };
}
