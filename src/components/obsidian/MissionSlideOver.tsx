/**
 * OBS-05: the Build mission slide-over (depth 2). Consumes the OBS-03 `SlideOver` +
 * `CallCard` chassis; the one mutation it calls is the pre-existing `decideApproval`
 * (the same fn `ApprovalCard.tsx` calls) · answering a gate here invalidates the
 * Today Call queue + the mission list so the decision ripples everywhere at once.
 *
 * Trace data gap (spec §13, pre-authorized, not a fabrication): `LoopStep` carries
 * neither a per-step timestamp nor a per-step cost, only the prototype's static
 * sample does. The trace toggle below renders the real tool/thought/final steps
 * and their real status; it omits the timestamp and per-hop-cost columns the
 * prototype shows rather than inventing values the data contract doesn't have.
 */
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlideOver } from "./slideover";
import { CallCard } from "./callcard";
import { StatusDot, STATUS_WORD } from "./status";
import { MonoLabel } from "./primitives";
import { useToast } from "./toast";
import { TestStationPanel } from "./TestStationPanel";
import {
  studioToStatusState,
  findPendingApproval,
  stepDotState,
  stepDescription,
  gateTitle,
  gateConsequence,
} from "./build-status";
import { getStudioSession, type StudioApproval } from "@/lib/studio.functions";
import { decideApproval } from "@/lib/agent_loop.functions";
import { promoteMission } from "@/lib/missions.functions";
import { fmtCost } from "@/components/studio/studio-format";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { stripAutoPrefix } from "@/components/plan/format";
import type { LoopStep } from "@/lib/ai/loop.server";

/** The dim 17 meta row: the mission's start time a touch more present
 * (--text-subtle), the copyable MIS trace ref the faintest tone. */
function MissionMeta({
  missionId,
  startedIso,
  onCopy,
}: {
  missionId: string;
  startedIso?: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
      {startedIso ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "0.06em",
            color: "var(--text-subtle)",
          }}
        >
          STARTED {relTimeCaps(startedIso)}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy trace id"
        title="Copy the full trace id"
        className="loom-press flex items-center hover:[color:var(--text-subtle)]"
        style={{
          gap: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
          background: "transparent",
          border: "none",
          padding: "3px 2px",
          cursor: "pointer",
        }}
      >
        MIS·{traceRef(missionId)}
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Provenance: link a mission back up the loop to the spec it was built from
 * (dim 17). Real link only, from getStudioSession's artifact_lineage lookup. */
function SpecProvenanceLink({ spec }: { spec: { id: string; title: string } }) {
  return (
    <Link
      to="/plan/spec/$id"
      params={{ id: spec.id }}
      className="hover:[color:var(--text-primary)]"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.06em",
        color: "var(--glacier)",
        textDecoration: "none",
      }}
    >
      Built from spec · {stripAutoPrefix(spec.title).slice(0, 48)} →
    </Link>
  );
}

export function MissionSlideOver({
  missionId,
  onClose,
}: {
  missionId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const showToast = useToast();
  const fGet = useServerFn(getStudioSession);
  const fDecide = useServerFn(decideApproval);
  const fPromote = useServerFn(promoteMission);
  const [traceOpen, setTraceOpen] = useState(false);

  useEffect(() => {
    setTraceOpen(false);
  }, [missionId]);

  const session = useQuery({
    queryKey: ["studio-session", missionId],
    queryFn: () => fGet({ data: { missionId: missionId! } }),
    enabled: !!missionId,
    refetchInterval: 4000,
  });

  const decide = useMutation({
    mutationFn: (vars: { approvalId: string; decision: "approve" | "reject" }) =>
      fDecide({ data: vars }),
    onSuccess: (_r, vars) => {
      showToast(
        vars.decision === "approve"
          ? "Good call. The PR is open."
          : "Sent back. It is reworking it for your next look.",
      );
      qc.invalidateQueries({ queryKey: ["needs-you"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["studio-sessions"] });
      qc.invalidateQueries({ queryKey: ["studio-session", missionId] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  // OBS-10: the trigger-tick's own HITL gate — a mission an ambient trigger
  // proposed but no human has promoted to 'queued' yet (ported from the
  // retired /missions list row's "Review & launch" button).
  const promote = useMutation({
    mutationFn: () => fPromote({ data: { missionId: missionId! } }),
    onSuccess: () => {
      showToast("Mission queued. The agent will pick it up shortly.");
      qc.invalidateQueries({ queryKey: ["studio-sessions"] });
      qc.invalidateQueries({ queryKey: ["studio-session", missionId] });
    },
    onError: (e: Error) => showToast(e.message),
  });

  const copyId = () => {
    if (!missionId) return;
    void navigator.clipboard?.writeText(missionId);
    showToast("Trace id copied");
  };

  const data = session.data;
  const mission = data?.mission as
    | { title: string; status: string; goal?: string; created_at?: string; updated_at?: string }
    | undefined;
  const spec = (data?.spec ?? null) as { id: string; title: string } | null;
  const isOrchestratorMission = data?.kind === "mission";
  const approvals = (data?.approvals ?? []) as StudioApproval[];
  const pendingApproval = findPendingApproval(approvals) ?? null;
  const runs = data?.runs ?? [];
  const latestRun = runs.length ? runs[runs.length - 1] : null;
  const steps: LoopStep[] = latestRun?.steps ?? [];
  const totalCost = data?.total_cost_usd ?? 0;
  // The run's own status (agent_runs), not mission.status (missions): the two
  // are disjoint vocabularies (missions.status uses "blocked" for a
  // gate-waiting mission, never "waiting_approval") and answering a gate only
  // updates agent_approvals immediately, missions.status catches up on the
  // next resume-runs cron tick (~60s) — reading mission.status here showed a
  // false "SHIPPED" for up to a minute after every gate answer, including a
  // reject (adversarial review finding). `run_status ?? status` mirrors
  // exactly how BuildMissionRow derives the same mission's state, so the row
  // and the slide-over never disagree.
  const rawStatus = latestRun?.status ?? mission?.status ?? "queued";
  const headerState = studioToStatusState(rawStatus, pendingApproval ? 1 : 0);

  return (
    <SlideOver
      open={!!missionId}
      onClose={onClose}
      title={stripAutoPrefix(mission?.title ?? "Mission")}
      footer="Every hop cites the memory it drew on · Esc closes"
    >
      {session.isError ? (
        // An error never wears the loading state's clothes: name the cause, offer retry.
        <div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Couldn't load this mission. {(session.error as Error)?.message ?? ""}
          </p>
          <button
            type="button"
            onClick={() => void session.refetch()}
            className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              marginTop: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-subtle)",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            Retry · reloads the mission
          </button>
        </div>
      ) : !mission ? (
        <div role="status" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="sr-only">Loading the mission…</span>
          {["40%", "100%", "80%"].map((w) => (
            <div
              key={w}
              aria-hidden="true"
              style={{
                height: 14,
                width: w,
                borderRadius: 4,
                backgroundImage: "var(--shimmer-gradient)",
                backgroundSize: "280% 100%",
                animation: "cadShimmer 5s linear infinite",
                opacity: 0.35,
              }}
            />
          ))}
        </div>
      ) : isOrchestratorMission ? (
        // OBS-10: an orchestrator goal-run, not a Studio session — no changeset,
        // no build steps. The rich detail (hops, replay, cancel, the Compounding
        // moat view) lives one layer deeper, at the full page; this stays a
        // condensed summary per the slide-over's own depth-2 contract.
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <MonoLabel tone="muted">MISSION</MonoLabel>
              <StatusDot state={headerState} word={STATUS_WORD[headerState]} />
            </div>
            {missionId ? (
              <MissionMeta missionId={missionId} startedIso={mission.created_at} onCopy={copyId} />
            ) : null}
            {spec ? <SpecProvenanceLink spec={spec} /> : null}
          </div>
          {mission.goal ? (
            <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5 }}>
              {mission.goal}
            </p>
          ) : null}
          {mission.status === "proposed" ? (
            <CallCard
              compact
              kind="mission.promote"
              expiry="No expiry"
              title="Launch this mission"
              body="A trigger proposed this goal. Nothing runs until you launch it."
              ev={[]}
              okLabel={promote.isPending ? "Launching…" : "Review & launch"}
              noLabel="Not now"
              consequence="The agent mesh picks this up on its next tick."
              onOk={() => promote.mutate()}
              onNo={onClose}
            />
          ) : null}
          {missionId ? (
            <Link
              to="/build/$missionId"
              params={{ missionId }}
              className="hover:underline"
              style={{
                alignSelf: "flex-start",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: "var(--glacier)",
                textDecoration: "none",
              }}
            >
              Open full view →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <MonoLabel tone="muted">MISSION</MonoLabel>
              <StatusDot state={headerState} word={STATUS_WORD[headerState]} />
              <span
                className="ml-auto"
                style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}
              >
                {fmtCost(totalCost)}
              </span>
            </div>
            {missionId ? (
              <MissionMeta missionId={missionId} startedIso={mission.created_at} onCopy={copyId} />
            ) : null}
            {spec ? <SpecProvenanceLink spec={spec} /> : null}
          </div>

          {missionId ? (
            <Link
              to="/build/$missionId"
              params={{ missionId }}
              className="hover:underline hover:[color:var(--text-primary)]"
              style={{
                alignSelf: "flex-start",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: "var(--text-subtle)",
                textDecoration: "none",
              }}
            >
              Open full view →
            </Link>
          ) : null}

          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--text-faint)",
                    width: 20,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StatusDot
                  state={stepDotState(step, approvals)}
                  word={STATUS_WORD[stepDotState(step, approvals)]}
                  style={{ width: 84, flexShrink: 0 }}
                />
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-body)" }}
                >
                  {stepDescription(step)}
                </span>
                {/* Real, not a placeholder: getStudioSession filters runs to
                    agent_slug "builder" only, so every step in this array IS
                    the builder agent's own step; there is no per-step agent
                    variance to read from the data. */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8,
                    color: "var(--text-faint)",
                  }}
                >
                  BUILDER
                </span>
              </div>
            ))}
            {steps.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>No steps recorded yet.</p>
            ) : null}
          </div>

          {pendingApproval ? (
            <CallCard
              compact
              kind={pendingApproval.tool_name}
              expiry={
                pendingApproval.expires_at
                  ? `Expires ${pendingApproval.expires_at.slice(0, 16).replace("T", " ")}`
                  : "No expiry"
              }
              title={gateTitle(pendingApproval.tool_name)}
              body={pendingApproval.rationale ?? `Approve to run ${pendingApproval.tool_name}.`}
              ev={
                pendingApproval.rationale ? [{ src: "WHY", text: pendingApproval.rationale }] : []
              }
              okLabel={decide.isPending ? "Deciding…" : "Approve"}
              noLabel="Send back"
              consequence={gateConsequence(pendingApproval.tool_name)}
              onOk={() => decide.mutate({ approvalId: pendingApproval.id, decision: "approve" })}
              onNo={() => decide.mutate({ approvalId: pendingApproval.id, decision: "reject" })}
            />
          ) : null}

          {missionId ? <TestStationPanel missionId={missionId} /> : null}

          <button
            type="button"
            onClick={() => setTraceOpen((v) => !v)}
            aria-expanded={traceOpen}
            className="loom-press transition-colors hover:[color:var(--text-primary)]"
            style={{
              alignSelf: "flex-start",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {traceOpen ? "Hide the raw trace" : "Show the raw trace →"}
          </button>
          {traceOpen ? (
            <div
              style={{
                backgroundColor: "var(--surface-recessed)",
                borderRadius: "var(--radius-control)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {steps.map((step, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--text-subtle)",
                  }}
                >
                  {step.kind} · {stepDescription(step)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </SlideOver>
  );
}
