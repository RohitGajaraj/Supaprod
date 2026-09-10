/**
 * RPT-18: Eval-depth rigor block — per-surface calibration scores + coverage.
 *
 * Shows the live rigor picture per canonical AI surface: which surfaces are
 * guarded (covered/stale/uncovered), and their current pass rate if guarded.
 * Drillable to the eval suites and individual test cases per surface.
 *
 * Data model: grouping listEvalSuites (surface + latest score) by surface +
 * overlaying getEvalCoverage (state per surface) to show both rigor (evals run)
 * and coverage (which surfaces have a guard at all).
 *
 * 2026-08-15: PORTED TO MERIDIAN. The three coverage dots used to be hand-picked
 * colours off a retired palette (moss, faint, marigold); they are named meanings
 * now and `RecordStatus` owns which token draws each one:
 *
 *   COVERED is `pass`. A guard exists and it has run: that is an outcome.
 *   UNPROVEN is `quiet`. A guard exists and has proved nothing yet, which is an
 *     absence of evidence rather than a bad result, and dressing it as either
 *     green or amber would claim a verdict nobody has.
 *   UNGUARDED is `hold`, amber. Nothing is watching this surface at all, and it
 *     is the missing-precondition case amber exists for: it needs a suite to be
 *     written, which is a condition, not a decision made here.
 */

import * as React from "react";
import {
  scoreSurface,
  allSuitesClear,
  type SuiteResult,
} from "@/components/engine-room/surface-calibration";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { listEvalSuites, getEvalCoverage } from "@/lib/evals.functions";
import { EVAL_COVERAGE_TARGETS } from "@/lib/evals/coverage";
import { humanWriteError } from "@/lib/roles.functions";
import { ErrorRetry, PanelPending } from "./room-parts";
import { RecordStatus, type RecordTone } from "@/components/meridian/RecordsTable";

// Surface labels (reused from QualityRoom for consistency)
const SURFACE_LABELS: Record<string, string> = Object.fromEntries(
  EVAL_COVERAGE_TARGETS.map((t) => [t.surface, t.label.split(",")[0]!.trim()]),
);
function surfaceLabel(surface: string): string {
  if (surface === "unassigned") return "Unassigned";
  return SURFACE_LABELS[surface] ?? surface.charAt(0).toUpperCase() + surface.slice(1);
}

/**
 * Per-surface calibration row: coverage state + judge score + drillable link.
 *
 * ── IT WAS NEVER A PASS RATE, AND IT RENDERED AS 8463% (2026-09-01) ────────
 * The field was called `passRate`, and the row printed
 * `Math.round(passRate * 100)` with a per-cent sign after it. What it actually
 * holds is the mean of `eval_runs.avg_score`, which is a JUDGE SCORE OUT OF
 * 100. Measured against production the day this was found: 19 scored runs,
 * min 68, max 91, mean 84.63. So every guarded surface on Quality > By surface
 * was printing a figure two orders of magnitude wrong.
 *
 * THE COLOUR WAS WORSE THAN THE NUMBER. The threshold read `passRatePct >= 90`
 * with a comment defending it as "green only where it is an OUTCOME worth
 * reporting: a surface passing at or above ninety". Multiplied by a hundred,
 * any score of 0.9 or better clears it -- so every surface in the product was
 * green, permanently, whatever it scored. A verdict that cannot come out the
 * other way is not a verdict.
 *
 * WHAT REPLACES IT IS NOT A RESCALED VERSION OF THE SAME CLAIM. There is no
 * single threshold to compare a surface against, because a surface aggregates
 * several suites and `eval_suites.pass_threshold` is set PER SUITE (70 to 80
 * in production). So the score is reported as a score, with its scale named,
 * and the pass/fail judgement is made where the thresholds actually live: a
 * surface is green when every suite behind it cleared its OWN bar.
 */
interface SurfaceCalibration {
  surface: string;
  label: string;
  coverageState: "covered" | "stale" | "uncovered";
  suiteIds: string[];
  /** Mean of the latest `avg_score` across this surface's suites. Out of 100. */
  avgScore: number | null;
  /** How many of those suites met their own `pass_threshold`. */
  clearing: number;
  runCount: number;
}

export function EvalCalibrationPanel() {
  const navigate = useNavigate();
  const suitesFn = useServerFn(listEvalSuites);
  const suitesQ = useQuery({ queryKey: ["eval_suites"], queryFn: () => suitesFn() });
  const coverageFn = useServerFn(getEvalCoverage);
  const coverageQ = useQuery({ queryKey: ["eval_coverage"], queryFn: () => coverageFn() });

  if (suitesQ.isError || coverageQ.isError) {
    const cause = suitesQ.error ?? coverageQ.error;
    return (
      <ErrorRetry
        message={`Calibration data did not load. ${humanWriteError(cause, "The read failed.")}`}
        onRetry={() => {
          suitesQ.refetch();
          coverageQ.refetch();
        }}
      />
    );
  }
  if (suitesQ.isLoading || coverageQ.isLoading) return <PanelPending />;

  const suites = suitesQ.data ?? [];
  const targets = coverageQ.data?.targets ?? [];

  // Group suites by surface
  const byTarget = new Map<string, { suite: (typeof suites)[0]; score: number | null }[]>();
  for (const suite of suites) {
    const key = `${suite.surface}/${suite.prompt_key}`;
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key)!.push({
      suite,
      /* Named `score`, not `pass`. It was called `pass` and it is a number out
         of 100, which is how it ended up multiplied by a hundred and printed
         with a per-cent sign three screens away. */
      score: suite.last_run?.avg_score != null ? Number(suite.last_run.avg_score) : null,
    });
  }

  // Build per-surface calibration
  const calibrations: SurfaceCalibration[] = [];
  const bySurface = new Map<string, SurfaceCalibration>();

  for (const target of targets) {
    const surface = target.surface;
    if (!bySurface.has(surface)) {
      bySurface.set(surface, {
        surface,
        label: surfaceLabel(surface),
        coverageState: target.state,
        suiteIds: [],
        avgScore: null,
        clearing: 0,
        runCount: 0,
      });
    }
    const cal = bySurface.get(surface)!;
    cal.coverageState = target.state;
  }

  // Accumulate suite scores by surface, and count how many cleared their own bar.
  for (const [surface, cals] of bySurface) {
    const results: SuiteResult[] = [];
    for (const target of targets.filter((t) => t.surface === surface)) {
      const key = `${target.surface}/${target.key}`;
      for (const ts of byTarget.get(key) ?? []) {
        cals.suiteIds.push(ts.suite.id);
        results.push({ score: ts.score, passThreshold: ts.suite.pass_threshold });
      }
    }
    const scored = scoreSurface(results);
    cals.avgScore = scored.avgScore;
    cals.clearing = scored.clearing;
    cals.runCount = scored.runCount;
  }

  calibrations.push(
    ...Array.from(bySurface.values()).sort((a, b) => a.label.localeCompare(b.label)),
  );

  const drillToSurface = (surface: string) => {
    navigate({ to: "/team", search: { tab: "spend", room: "quality", view: "suites", surface } });
  };

  if (calibrations.length === 0) {
    return (
      <p className="py-mrd-5 text-mrd-base leading-mrd-prose text-mrd-mute">
        No AI surfaces are registered for calibration yet. Add an eval suite under Quality, then its
        surface appears here with a coverage verdict.
      </p>
    );
  }

  return (
    <div data-mrd="" className="flex flex-col gap-mrd-4">
      <div className="flex flex-col gap-mrd-3">
        {calibrations.map((cal) => {
          const stateMeta: { tone: RecordTone; label: string } =
            cal.coverageState === "covered"
              ? { tone: "pass", label: "Covered" }
              : cal.coverageState === "stale"
                ? { tone: "quiet", label: "Unproven" }
                : { tone: "hold", label: "Unguarded" };

          const score = cal.avgScore != null ? Math.round(cal.avgScore) : null;
          const allClear = allSuitesClear(cal);

          return (
            <button
              key={cal.surface}
              type="button"
              onClick={() => drillToSurface(cal.surface)}
              // Hover in CSS, not JS mouse handlers, so keyboard focus and
              // reduced-motion behave; the transition names its properties.
              className={`group flex items-center justify-between gap-mrd-4 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-mrd-1">
                <span className="truncate text-mrd-base font-medium text-mrd-ink">{cal.label}</span>
                {/* The dot and its word travel together, so the state never
                    reads by colour alone and survives greyscale. */}
                <RecordStatus tone={stateMeta.tone} label={stateMeta.label} />
              </span>

              <span className="flex flex-none items-center gap-mrd-4">
                <span className="min-w-[60px] text-right">
                  {score != null ? (
                    <span
                      className={`font-mrd-mono block text-mrd-base font-medium tabular-nums ${
                        allClear ? "text-mrd-pass" : "text-mrd-ink"
                      }`}
                      /* The scale is named where the figure is, because "84"
                         alone is the same defect as the per-cent sign was: a
                         number that does not say what it measures. */
                      title={
                        cal.clearing === cal.runCount
                          ? `Mean judge score out of 100. All ${cal.runCount} suites met their own pass threshold.`
                          : `Mean judge score out of 100. ${cal.clearing} of ${cal.runCount} suites met their own pass threshold.`
                      }
                    >
                      {score}
                      <span className="text-mrd-mute">/100</span>
                    </span>
                  ) : (
                    <span className="block text-mrd-small text-mrd-faint">no runs</span>
                  )}
                  {cal.runCount > 0 ? (
                    <span className="font-mrd-mono mt-0.5 block text-mrd-data text-mrd-faint tabular-nums">
                      {cal.runCount} suite{cal.runCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </span>
                <ChevronRight
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden
                  className="flex-none text-mrd-faint transition-colors group-hover:text-mrd-ink text-mrd-body"
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary line when coverage is complete. */}
      {calibrations.every((c) => c.coverageState === "covered") ? (
        <p className="border-t border-mrd-line-soft pt-mrd-4 text-mrd-small text-mrd-mute">
          All canonical surfaces are guarded with evals.
        </p>
      ) : null}
    </div>
  );
}
