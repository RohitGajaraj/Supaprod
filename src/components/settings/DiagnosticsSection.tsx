/**
 * DIAGNOSTICS. Rebuilt on the primitives 2026-07-29, replacing HealthCard.
 *
 * This is the one section of Settings that is a REPORT rather than a boundary,
 * and it survives the "does it deserve the place" test on a single ground: it
 * is the answer to "is it me or is it you" at the moment a person is already in
 * Settings changing something because a run went wrong. It stays until the
 * Engine room's Quality room can carry the whole question, and this file's job
 * is to be the smallest honest version of it.
 *
 * KILLED, and what each cost:
 *   - The `material-medium` shell and the `btn btn-ghost` window buttons, all
 *     written against classes and tokens the rebuild deleted.
 *   - RunawayMissionsDetail, the mission-by-mission churn table. That is the
 *     deep report, it belongs to the Engine room, and it was the reason this
 *     section scrolled. What stays is the count and a door to it.
 *   - The "100% of calls succeeded" line on a window with zero calls, which is
 *     what computeSlo returns by construction (availabilityPct defaults to 100
 *     when nothing was evaluated). A percentage over an empty sample is a
 *     fabricated number; the section now says there were no calls.
 */
import { useState } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getReliabilitySlo, getRunawayMissions } from "@/lib/reliability.functions";
import { summarizeHealth } from "@/lib/reliability/health-view";
import { Block, Button, Empty, Failed, Line, Loading, PageHead } from "@/components/shell/primitives";

const WINDOWS = [7, 30] as const;

export function DiagnosticsSection() {
  const [days, setDays] = useState<number>(7);
  const fSlo = useServerFn(getReliabilitySlo);
  const fRunaway = useServerFn(getRunawayMissions);

  // Distinct cache namespace from the cockpit glance so prefix-match
  // invalidations on either surface never spuriously refetch the other.
  const sloQ = useQuery({
    queryKey: ["health-slo", days],
    queryFn: () => fSlo({ data: { days } }),
  });
  const runawayQ = useQuery({
    queryKey: ["health-runaway", days],
    queryFn: () => fRunaway({ data: { days } }),
  });

  const rollup = summarizeHealth(sloQ.data, runawayQ.data);
  const bothFailed = sloQ.isError && runawayQ.isError;
  const loading = sloQ.isLoading && runawayQ.isLoading;

  const metrics = sloQ.data?.metrics;
  const evaluated = metrics?.evaluated ?? 0;
  const budget = metrics?.budget;
  const budgetClass =
    budget?.status === "exhausted"
      ? "sp-fail"
      : budget?.status === "warning"
        ? "sp-warn"
        : undefined;

  const spinning = runawayQ.data?.flagged.filter((f) => f.severity === "runaway").length ?? 0;
  const toReview = runawayQ.data?.flagged.filter((f) => f.severity === "watch").length ?? 0;

  return (
    <>
      <PageHead
        title="Diagnostics"
        sub={
          bothFailed
            ? "The reliability reads failed, so nothing below is known."
            : loading
              ? "Reading how the last few days went."
              : rollup.headline
        }
      />

      <Line label="Window" sub={`Everything below covers the last ${days} days.`}>
        {WINDOWS.map((w) => (
          <Button
            key={w}
            variant={days === w ? "default" : "ghost"}
            aria-pressed={days === w}
            onClick={() => setDays(w)}
          >
            {w} days
          </Button>
        ))}
      </Line>

      {rollup.signals.length > 0 ? (
        <Block title="What needs a look">
          {rollup.signals.map((s, i) => (
            <Line key={i} label={s} />
          ))}
        </Block>
      ) : null}

      <Block title="AI calls">
        {sloQ.isError ? (
          <Failed onRetry={() => void sloQ.refetch()}>
            The call health did not load. {(sloQ.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : sloQ.isLoading ? (
          <Loading>Reading call health.</Loading>
        ) : evaluated === 0 ? (
          <Empty>
            No AI calls in the last {days} days, so there is nothing to score. Start a run and this
            fills in.
          </Empty>
        ) : metrics && budget ? (
          <>
            <Line
              label="Calls that came back"
              sub={
                <>
                  <Num>{metrics.ok}</Num> of <Num>{evaluated}</Num> scored calls
                  {sloQ.data?.truncated ? ", counting the most recent 5000 only" : ""}.
                </>
              }
            >
              <Num>{metrics.availabilityPct}%</Num>
            </Line>
            <Line
              label="Calls that failed"
              sub="Provider errors and timeouts. These are the ones a person feels."
            >
              <Num>{metrics.errors}</Num>
            </Line>
            <Line
              label="Calls stopped on policy"
              sub="A guardrail or a credit ceiling held. Deliberate, and never counted as downtime."
            >
              <Num>{metrics.blocked}</Num>
            </Line>
            <Line
              label="How long a call takes"
              sub="The middle call, and the slowest one in twenty."
            >
              <Num>{metrics.p50LatencyMs}ms</Num>
              <span style={{ color: "var(--sp-mute)", fontSize: "var(--sp-text-meta)" }}>and</span>
              <Num>{metrics.p95LatencyMs}ms</Num>
            </Line>
            <Line
              label="Error budget left"
              sub={`The target is ${budget.targetAvailabilityPct}% of calls coming back. Spend the budget and the next failure is a real outage rather than an allowance.`}
            >
              <span className={budgetClass}>
                <Num>{budget.remainingPct}%</Num>
              </span>
            </Line>
          </>
        ) : null}
      </Block>

      <Block title="Runs">
        {runawayQ.isError ? (
          <Failed onRetry={() => void runawayQ.refetch()}>
            The run scan did not load. {(runawayQ.error as Error)?.message ?? "The read failed."}
          </Failed>
        ) : runawayQ.isLoading ? (
          <Loading>Scanning runs.</Loading>
        ) : spinning === 0 && toReview === 0 ? (
          <Empty>
            No run in the last {days} days went in circles or ran past what it should have.
          </Empty>
        ) : (
          <>
            {spinning > 0 ? (
              <Line
                label="Going in circles right now"
                sub="Still active, and past the step count its work should have needed."
              >
                <span className="sp-fail">
                  <Num>{spinning}</Num>
                </span>
              </Line>
            ) : null}
            {toReview > 0 ? (
              <Line
                label="Finished, worth reviewing"
                sub="Already done, but they took more than the shape of the work suggests."
              >
                <Num>{toReview}</Num>
              </Line>
            ) : null}
            <Line label="Which runs, and what they cost" sub="Run by run, in the engine room.">
              <Link
                to="/engine-room"
                search={{ room: "quality" }}
                className="sp-btn"
                data-variant="ghost"
              >
                Open quality
              </Link>
            </Line>
          </>
        )}
      </Block>
    </>
  );
}
