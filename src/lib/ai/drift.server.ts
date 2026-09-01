/**
 * Drift detector — rolls up ai_events + eval_case_results into daily
 * drift_snapshots per (surface, model, prompt_version), then compares the
 * recent window to the baseline window and opens drift_incidents when a
 * metric crosses the user's configured % threshold.
 *
 * Metrics tracked: avg_latency_ms, p95_latency_ms, avg_total_tokens,
 * avg_cost_usd, error_rate, avg_eval_score.
 *
 * Pure-SQL rollups via supabase-js; no model calls. Safe to run on a
 * schedule from the drift-tick hook or invoked manually from the UI.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchInstantEmail } from "@/lib/notifications.functions";
import type { Database } from "@/integrations/supabase/types";

/** The rolled-up row this module writes and then reads back to compare windows. */
type SnapshotRow = Database["public"]["Tables"]["drift_snapshots"]["Row"];

/** The five numeric snapshot columns `weighted()` is allowed to average.
 *  Named as a union rather than `string` on purpose: every call site passes the
 *  metric name TWICE -- once as `metric:` and once as the field to read -- and
 *  when `rows` was `any[]` and `field` was `string`, a typo in the second copy
 *  read `undefined`, became `Number(undefined) || 0`, and produced a
 *  weighted average of 0. That is a drift check that can only ever say
 *  "no change", with nothing anywhere reporting a problem. Same shape as the
 *  FORECAST_COLS defect: a column named in a string, checked by nothing. */
type WeightedField =
  "avg_latency_ms" | "p95_latency_ms" | "avg_total_tokens" | "avg_cost_usd" | "avg_eval_score";

// EventRow, PromptRun and EvalResult used to be declared here: three
// hand-written copies of database row shapes, sitting next to queries that were
// made through an untyped client and so could not disagree with them. EventRow
// was already dead (nothing referenced it -- it had been orphaned when the loop
// below switched to `events as any[]`), and the other two were only used to
// annotate map callbacks whose rows the client now types from the schema. All
// three are gone: the select strings below are the single declaration of what
// each query returns, and tsc checks them.

type Bucket = {
  user_id: string;
  bucket_date: string;
  surface: string;
  model: string;
  prompt_version_id: string | null;
  latencies: number[];
  tokens: number[];
  costs: number[];
  errors: number;
  total: number;
  scores: number[];
};

const DEFAULTS = {
  window_days: 7,
  baseline_days: 14,
  latency_pct_threshold: 25,
  tokens_pct_threshold: 30,
  cost_pct_threshold: 30,
  score_pct_threshold: 10,
  error_rate_pct_threshold: 5,
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}
function p95(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
}
function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + Number(b), 0) / arr.length : 0;
}
function pctDelta(current: number, baseline: number): number {
  if (!baseline) return current === 0 ? 0 : 100;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Roll up the last `lookbackDays` of ai_events into drift_snapshots
 * (one row per user/day/surface/model/version), upserting.
 */
export async function rollupSnapshots(
  supabase: SupabaseClient<Database>,
  userId: string,
  lookbackDays = 21,
): Promise<number> {
  const since = new Date(Date.now() - lookbackDays * 86400000).toISOString();

  const { data: events, error } = await supabase
    .from("ai_events")
    .select("id,surface,model,latency_ms,total_tokens,est_cost_usd,status,created_at")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  if (!events?.length) return 0;

  const eventIds = events.map((e) => e.id);
  const { data: runs } = await supabase
    .from("prompt_runs")
    .select("event_id,version_id")
    .eq("user_id", userId)
    .in("event_id", eventIds);
  const versionByEvent = new Map<string, string | null>();
  (runs ?? []).forEach((r) => {
    if (r.event_id) versionByEvent.set(r.event_id, r.version_id);
  });

  const { data: evals } = await supabase
    .from("eval_case_results")
    .select("ai_event_id,score")
    .eq("user_id", userId)
    .in("ai_event_id", eventIds);
  const scoreByEvent = new Map<string, number>();
  (evals ?? []).forEach((r) => {
    if (r.ai_event_id && r.score != null) scoreByEvent.set(r.ai_event_id, Number(r.score));
  });

  const buckets = new Map<string, Bucket>();
  for (const e of events) {
    const day = dayKey(e.created_at);
    const version = versionByEvent.get(e.id) ?? null;
    const key = `${day}|${e.surface}|${e.model}|${version ?? ""}`;
    let b = buckets.get(key);
    if (!b) {
      b = {
        user_id: userId,
        bucket_date: day,
        surface: e.surface,
        model: e.model,
        prompt_version_id: version,
        latencies: [],
        tokens: [],
        costs: [],
        errors: 0,
        total: 0,
        scores: [],
      };
      buckets.set(key, b);
    }
    b.total += 1;
    b.latencies.push(Number(e.latency_ms) || 0);
    b.tokens.push(Number(e.total_tokens) || 0);
    b.costs.push(Number(e.est_cost_usd) || 0);
    if (e.status === "error") b.errors += 1;
    const sc = scoreByEvent.get(e.id);
    if (sc != null) b.scores.push(sc);
  }

  const rows = Array.from(buckets.values()).map((b) => ({
    user_id: b.user_id,
    bucket_date: b.bucket_date,
    surface: b.surface,
    model: b.model,
    prompt_version_id: b.prompt_version_id,
    request_count: b.total,
    error_count: b.errors,
    avg_latency_ms: avg(b.latencies),
    p95_latency_ms: p95(b.latencies),
    avg_total_tokens: avg(b.tokens),
    avg_cost_usd: avg(b.costs),
    avg_eval_score: b.scores.length ? avg(b.scores) : null,
  }));

  if (!rows.length) return 0;
  const { error: upErr } = await supabase
    .from("drift_snapshots")
    .upsert(rows, { onConflict: "user_id,bucket_date,surface,model,prompt_version_id" });
  if (upErr) throw new Error(upErr.message);
  return rows.length;
}

/**
 * Compare the recent window vs baseline window per (surface, model, version).
 * Opens drift_incidents on threshold breaches; auto-resolves prior open
 * incidents that have recovered.
 */
export async function detectIncidents(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ opened: number; resolved: number }> {
  const { data: baseline } = await supabase
    .from("drift_baselines")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const cfg = baseline?.enabled === false ? null : { ...DEFAULTS, ...(baseline ?? {}) };
  if (!cfg) return { opened: 0, resolved: 0 };

  const totalDays = cfg.window_days + cfg.baseline_days;
  const sinceDate = new Date(Date.now() - totalDays * 86400000).toISOString().slice(0, 10);
  const { data: snaps, error } = await supabase
    .from("drift_snapshots")
    .select("*")
    .eq("user_id", userId)
    .gte("bucket_date", sinceDate);
  if (error) throw new Error(error.message);
  if (!snaps?.length) return { opened: 0, resolved: 0 };

  const cutoff = new Date(Date.now() - cfg.window_days * 86400000).toISOString().slice(0, 10);
  const groups = new Map<string, SnapshotRow[]>();
  for (const s of snaps) {
    const k = `${s.surface}|${s.model}|${s.prompt_version_id ?? ""}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  type Open = { surface: string; model: string; prompt_version_id: string | null; metric: string };
  const breaches: Array<{
    surface: string;
    model: string;
    prompt_version_id: string | null;
    metric: string;
    baseline_value: number;
    current_value: number;
    delta_pct: number;
    severity: string;
  }> = [];

  const weighted = (rows: SnapshotRow[], field: WeightedField) => {
    let num = 0,
      den = 0;
    for (const r of rows) {
      const v = Number(r[field]) || 0;
      const w = Number(r.request_count) || 0;
      num += v * w;
      den += w;
    }
    return den ? num / den : 0;
  };
  const errorRate = (rows: SnapshotRow[]) => {
    const errs = rows.reduce((a, r) => a + (Number(r.error_count) || 0), 0);
    const total = rows.reduce((a, r) => a + (Number(r.request_count) || 0), 0);
    return total ? (errs / total) * 100 : 0;
  };

  for (const [k, rows] of groups) {
    const recent = rows.filter((r) => r.bucket_date > cutoff);
    const base = rows.filter((r) => r.bucket_date <= cutoff);
    if (!recent.length || !base.length) continue;
    const [surface, model, vid] = k.split("|");
    const prompt_version_id = vid || null;

    const checks: Array<{
      metric: string;
      cur: number;
      base: number;
      thr: number;
      higherIsBad: boolean;
    }> = [
      {
        metric: "avg_latency_ms",
        cur: weighted(recent, "avg_latency_ms"),
        base: weighted(base, "avg_latency_ms"),
        thr: cfg.latency_pct_threshold,
        higherIsBad: true,
      },
      {
        metric: "avg_total_tokens",
        cur: weighted(recent, "avg_total_tokens"),
        base: weighted(base, "avg_total_tokens"),
        thr: cfg.tokens_pct_threshold,
        higherIsBad: true,
      },
      {
        metric: "avg_cost_usd",
        cur: weighted(recent, "avg_cost_usd"),
        base: weighted(base, "avg_cost_usd"),
        thr: cfg.cost_pct_threshold,
        higherIsBad: true,
      },
      {
        metric: "error_rate",
        cur: errorRate(recent),
        base: errorRate(base),
        thr: cfg.error_rate_pct_threshold,
        higherIsBad: true,
      },
      {
        metric: "avg_eval_score",
        cur: weighted(
          recent.filter((r) => r.avg_eval_score != null),
          "avg_eval_score",
        ),
        base: weighted(
          base.filter((r) => r.avg_eval_score != null),
          "avg_eval_score",
        ),
        thr: cfg.score_pct_threshold,
        higherIsBad: false,
      },
    ];

    for (const c of checks) {
      if (c.metric === "avg_eval_score" && (!c.cur || !c.base)) continue;
      const d = pctDelta(c.cur, c.base);
      const bad = c.higherIsBad ? d > c.thr : d < -c.thr;
      if (!bad) continue;
      const mag = Math.abs(d);
      const severity = mag > c.thr * 2 ? "critical" : "warn";
      breaches.push({
        surface,
        model,
        prompt_version_id,
        metric: c.metric,
        baseline_value: c.base,
        current_value: c.cur,
        delta_pct: d,
        severity,
      });
    }
  }

  // Open new incidents (skip if an open one already exists for same key+metric)
  const { data: existing } = await supabase
    .from("drift_incidents")
    .select("id,surface,model,prompt_version_id,metric")
    .eq("user_id", userId)
    .eq("status", "open");
  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.surface}|${e.model}|${e.prompt_version_id ?? ""}|${e.metric}`),
  );

  let opened = 0;
  const toInsert = breaches.filter((b) => {
    const k = `${b.surface}|${b.model}|${b.prompt_version_id ?? ""}|${b.metric}`;
    return !existingKeys.has(k);
  });
  if (toInsert.length) {
    const { error: insErr } = await supabase
      .from("drift_incidents")
      .insert(toInsert.map((b) => ({ user_id: userId, ...b, detail: {} })));
    if (insErr) throw new Error(insErr.message);
    opened = toInsert.length;

    // FS-03: the other instant-email trigger — a critical incident, not just an
    // expiring gate. Fail-safe: a notification failure never blocks drift detection.
    for (const b of toInsert.filter((x) => x.severity === "critical")) {
      try {
        await dispatchInstantEmail(supabase, userId, {
          kind: "drift",
          severity: "warning",
          title: `Critical drift: ${b.metric} on ${b.surface}`,
          detail: `${b.model} moved ${b.delta_pct > 0 ? "+" : ""}${b.delta_pct.toFixed(0)}% vs baseline.`,
        });
      } catch (e) {
        console.error("critical-drift email failed (non-fatal):", e);
      }
    }
  }

  // Auto-resolve: open incidents whose metric no longer breaches
  const breachKeys = new Set(
    breaches.map((b) => `${b.surface}|${b.model}|${b.prompt_version_id ?? ""}|${b.metric}`),
  );
  const toResolve = (existing ?? []).filter((e) => {
    const k = `${e.surface}|${e.model}|${e.prompt_version_id ?? ""}|${e.metric}`;
    return !breachKeys.has(k);
  });
  let resolved = 0;
  if (toResolve.length) {
    const ids = toResolve.map((e) => e.id);
    const { error: upErr } = await supabase
      .from("drift_incidents")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .in("id", ids);
    if (!upErr) resolved = ids.length;
  }

  return { opened, resolved };
}

export async function runDriftForUser(supabase: SupabaseClient<Database>, userId: string) {
  const snapshots = await rollupSnapshots(supabase, userId);
  const { opened, resolved } = await detectIncidents(supabase, userId);
  return { snapshots, opened, resolved };
}
