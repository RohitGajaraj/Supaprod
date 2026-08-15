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
 */

import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { listEvalSuites, getEvalCoverage } from "@/lib/evals.functions";
import { EVAL_COVERAGE_TARGETS } from "@/lib/evals/coverage";
import { ErrorRetry, PanelPending } from "./RoomDetail";

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
      <p
        style={{
          fontFamily: "var(--font-sans)",
          color: "var(--text-subtle)",
          padding: "18px 0",
        }}
      >
        No AI surfaces are registered for calibration yet. Add an eval suite under Quality, then its
        surface appears here with a coverage verdict.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {calibrations.map((cal) => {
          const stateMeta =
            cal.coverageState === "covered"
              ? { dot: "var(--moss)", label: "Covered" }
              : cal.coverageState === "stale"
                ? { dot: "var(--text-faint)", label: "Unproven" }
                : { dot: "var(--marigold)", label: "Unguarded" };

          const passRatePct = cal.passRate != null ? Math.round(cal.passRate * 100) : null;

          return (
            <button
              key={cal.surface}
              type="button"
              onClick={() => drillToSurface(cal.surface)}
              // Hover in CSS, not JS mouse handlers, so keyboard focus and
              // reduced-motion behave; the transition names its properties
              // (checklist 1/2/8).
              className="active:scale-[0.995] hover:[border-color:var(--text-faint)] hover:[background-color:var(--surface-2)]"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                backgroundColor: "var(--card)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-card)",
                cursor: "pointer",
                transitionProperty: "background-color, border-color, transform",
                transitionDuration: "160ms",
                transitionTimingFunction: "var(--ease)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--geist-space-3x)",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Coverage state dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "100%",
                    backgroundColor: stateMeta.dot,
                    flex: "none",
                  }}
                  title={stateMeta.label}
                />

                {/* Surface name + coverage label */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cal.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-faint)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {stateMeta.label}
                  </div>
                </div>
              </div>

              {/* Pass rate or "—" if uncovered */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--geist-space-3x)",
                  flex: "none",
                }}
              >
                <div
                  style={{
                    textAlign: "right",
                    minWidth: 60,
                  }}
                >
                  {passRatePct != null ? (
                    <div
                      style={{
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                        color: passRatePct >= 90 ? "var(--moss)" : "var(--text-primary)",
                      }}
                    >
                      {passRatePct}%
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "var(--text-faint)",
                      }}
                    >
                      no runs
                    </div>
                  )}
                  {cal.runCount > 0 ? (
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-faint)",
                        marginTop: 2,
                      }}
                    >
                      {cal.runCount} suite{cal.runCount === 1 ? "" : "s"}
                    </div>
                  ) : null}
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.5}
                  style={{ color: "var(--text-faint)", flex: "none" }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary line when complete coverage */}
      {calibrations.every((c) => c.coverageState === "covered") ? (
        <div
          style={{
            marginTop: 8,
            paddingTop: 12,
            borderTop: "1px solid var(--hairline)",
            color: "var(--text-faint)",
            fontFamily: "var(--font-mono)",
          }}
        >
          All canonical surfaces are guarded with evals.
        </div>
      ) : null}
    </div>
  );
}
