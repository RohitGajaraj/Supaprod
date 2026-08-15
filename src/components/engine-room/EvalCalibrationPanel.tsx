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
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { listEvalSuites, getEvalCoverage } from "@/lib/evals.functions";
import { EVAL_COVERAGE_TARGETS } from "@/lib/evals/coverage";
import { ErrorRetry, PanelPending } from "./RoomDetail";
import { RecordStatus, type RecordTone } from "@/components/meridian/RecordsTable";
import { FOCUS_RING } from "./EngineChrome";

// Surface labels (reused from QualityRoom for consistency)
const SURFACE_LABELS: Record<string, string> = Object.fromEntries(
  EVAL_COVERAGE_TARGETS.map((t) => [t.surface, t.label.split(",")[0]!.trim()]),
);
function surfaceLabel(surface: string): string {
  if (surface === "unassigned") return "Unassigned";
  return SURFACE_LABELS[surface] ?? surface.charAt(0).toUpperCase() + surface.slice(1);
}

/**
 * Per-surface calibration row: coverage state + pass rate + drillable link.
 * The pass rate is the average of all the surface's latest suite runs.
 */
interface SurfaceCalibration {
  surface: string;
  label: string;
  coverageState: "covered" | "stale" | "uncovered";
  suiteIds: string[];
  passRate: number | null;
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
        message={`Calibration data did not load. ${cause instanceof Error ? cause.message : "The read failed."}`}
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
  const byTarget = new Map<string, { suite: (typeof suites)[0]; pass: number | null }[]>();
  for (const suite of suites) {
    const key = `${suite.surface}/${suite.prompt_key}`;
    if (!byTarget.has(key)) byTarget.set(key, []);
    byTarget.get(key)!.push({
      suite,
      pass: suite.last_run?.avg_score != null ? Number(suite.last_run.avg_score) : null,
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
        passRate: null,
        runCount: 0,
      });
    }
    const cal = bySurface.get(surface)!;
    cal.coverageState = target.state;
  }

  // Accumulate suite pass rates by surface
  for (const [surface, cals] of bySurface) {
    const passes: number[] = [];
    for (const target of targets.filter((t) => t.surface === surface)) {
      const key = `${target.surface}/${target.key}`;
      const targetSuites = byTarget.get(key) ?? [];
      for (const ts of targetSuites) {
        cals.suiteIds.push(ts.suite.id);
        if (ts.pass != null) passes.push(ts.pass);
      }
    }
    if (passes.length > 0) {
      cals.passRate = passes.reduce((a, b) => a + b) / passes.length;
      cals.runCount = passes.length;
    }
  }

  calibrations.push(
    ...Array.from(bySurface.values()).sort((a, b) => a.label.localeCompare(b.label)),
  );

  const drillToSurface = (surface: string) => {
    navigate({ to: "/engine-room", search: { room: "quality", view: "suites", surface } });
  };

  if (calibrations.length === 0) {
    return (
      <p className="py-mrd-5 text-[13px] leading-relaxed text-mrd-mute">
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

          const passRatePct = cal.passRate != null ? Math.round(cal.passRate * 100) : null;

          return (
            <button
              key={cal.surface}
              type="button"
              onClick={() => drillToSurface(cal.surface)}
              // Hover in CSS, not JS mouse handlers, so keyboard focus and
              // reduced-motion behave; the transition names its properties.
              className={`group flex items-center justify-between gap-mrd-4 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift ${FOCUS_RING}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-mrd-1">
                <span className="truncate text-[13px] font-medium text-mrd-ink">{cal.label}</span>
                {/* The dot and its word travel together, so the state never
                    reads by colour alone and survives greyscale. */}
                <RecordStatus tone={stateMeta.tone} label={stateMeta.label} />
              </span>

              <span className="flex flex-none items-center gap-mrd-4">
                <span className="min-w-[60px] text-right">
                  {passRatePct != null ? (
                    <span
                      className={`font-mrd-mono block text-[13px] font-medium tabular-nums ${
                        /* Green only where it is an OUTCOME worth reporting: a
                           surface passing at or above ninety. Below that the
                           figure is a measurement and stays neutral, because a
                           second threshold nobody set would be a verdict
                           invented by the palette. */
                        passRatePct >= 90 ? "text-mrd-pass" : "text-mrd-ink"
                      }`}
                    >
                      {passRatePct}%
                    </span>
                  ) : (
                    <span className="block text-[12px] text-mrd-faint">no runs</span>
                  )}
                  {cal.runCount > 0 ? (
                    <span className="font-mrd-mono mt-0.5 block text-[11.5px] text-mrd-faint tabular-nums">
                      {cal.runCount} suite{cal.runCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </span>
                <ChevronRight
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden
                  className="flex-none text-mrd-faint transition-colors group-hover:text-mrd-body"
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* Summary line when coverage is complete. */}
      {calibrations.every((c) => c.coverageState === "covered") ? (
        <p className="border-t border-mrd-line-soft pt-mrd-4 text-[12px] text-mrd-mute">
          All canonical surfaces are guarded with evals.
        </p>
      ) : null}
    </div>
  );
}
