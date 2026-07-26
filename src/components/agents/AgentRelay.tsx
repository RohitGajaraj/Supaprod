// AGENT-EXP: the live relay. Shows agents IN MOTION, grouped by station, each as
// one calm ephemeral row (mark + name + latest line + status), with the handoff
// arrow. The gate step reads in ember ("needs your sign-off").
//
// Engine-Room: agent_messages handoff chain + agent_runs hop statuses
//   -> the raw tool-calls/thoughts stay in the mission's "Full execution trace"
//   -> surfaced here as a named-face relay grouped by loop station.
//
//   full = bound to one mission (mission / build detail).
//   mini = one live "what is running now" line for Today.
//   station = one live line SCOPED TO A SINGLE STATION (PC-29 layer 4),
//     shown only while that station has an active run. Wired onto
//     Discover/Decide/Define/Build's calm front; expands via the same
//     /build/$missionId link the mini line already uses.

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight } from "lucide-react";
import { getMission } from "@/lib/missions.functions";
import { getSwarmHud } from "@/lib/swarm.functions";
import { MonoLabel, StepDot } from "@/components/supaprod/Primitives";
import { AgentMark } from "@/components/agents/AgentMark";
import type { AgentStation } from "@/lib/agent-vocabulary";
import {
  miniRelay,
  relayByStation,
  stationActiveRun,
  toRelaySteps,
  type RelayStatus,
} from "@/lib/relay";

function dotFor(s: RelayStatus): "running" | "completed" | "planned" | "failed" | "gate" {
  if (s === "running") return "running";
  if (s === "done") return "completed";
  if (s === "failed") return "failed";
  if (s === "gate") return "gate";
  return "planned";
}

export function AgentRelay(props: {
  variant: "full" | "mini" | "station";
  missionId?: string;
  workspaceId?: string | null;
  /** Required when variant is "station": which station's line to show. */
  station?: AgentStation;
}) {
  if (props.variant === "mini") return <MiniRelayLine workspaceId={props.workspaceId ?? null} />;
  if (props.variant === "station") {
    return props.station ? (
      <StationRelayLine station={props.station} workspaceId={props.workspaceId ?? null} />
    ) : null;
  }
  return props.missionId ? <FullRelay missionId={props.missionId} /> : null;
}

function FullRelay({ missionId }: { missionId: string }) {
  const fGet = useServerFn(getMission);
  const m = useQuery({
    // Same key as the mission-detail route, so this shares its cache (no extra fetch).
    queryKey: ["mission", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: (q) => {
      const st = q.state.data?.mission.status;
      return st === "running" || st === "queued" ? 2000 : false;
    },
  });
  const steps = toRelaySteps(m.data);
  if (steps.length === 0) return null;
  const groups = relayByStation(steps);

  return (
    <section
      style={{
        border: "1px solid var(--hairline)",
        borderRadius: 12,
        background: "var(--surface-1)",
        padding: "16px 18px",
        marginBottom: 20,
      }}
    >
      <MonoLabel>The relay</MonoLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--geist-space-4x)", marginTop: 12 }}>
        {groups.map((g) => (
          <div key={g.station}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-faint)",
                marginBottom: 8,
              }}
            >
              {g.name}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {g.steps.map((s) => (
                <div key={s.runId} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <AgentMark slug={s.slug} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}
                    >
                      <span
                        className={s.status === "running" ? "agent-live" : undefined}
                        style={{
                          fontWeight: 540,
                          color: s.status === "running" ? undefined : "var(--text-primary)",
                        }}
                      >
                        {s.name}
                      </span>
                      <StepDot status={dotFor(s.status)} />
                      {s.handoffToName ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "var(--text-faint)",
                          }}
                        >
                          <ArrowRight size={16} strokeWidth={1.5} />
                          {s.handoffToName}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        color: s.isGate ? "var(--ember)" : "var(--text-subtle)",
                        marginTop: 2,
                        lineHeight: 1.45,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {s.latestLine}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniRelayLine({ workspaceId }: { workspaceId: string | null }) {
  const hudFn = useServerFn(getSwarmHud);
  const q = useQuery({
    queryKey: ["swarm", "hud", workspaceId],
    queryFn: () => hudFn({ data: { workspaceId } }),
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
  const r = miniRelay(q.data);

  if (!r.active) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--geist-space-2x)",
          color: "var(--text-subtle)",
        }}
      >
        <span className="dot dot-planned" />
        All quiet. Nothing needs you right now.
      </div>
    );
  }

  const body = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        {r.agentSlugs.slice(0, 4).map((slug) => (
          <AgentMark key={slug} slug={slug} size={22} />
        ))}
      </span>
      <span
        style={{
          color: "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {r.note || r.title || "Working"}
      </span>
    </div>
  );

  if (r.missionId) {
    return (
      <Link
        to="/build/$missionId"
        params={{ missionId: r.missionId }}
        className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{ textDecoration: "none", display: "block", borderRadius: "var(--radius-control)" }}
      >
        {body}
      </Link>
    );
  }
  return body;
}

/**
 * A single station's compact inline relay line (PC-29 layer 4): "{agent} ·
 * {relay verb}...", shown only while that station has an active run - null
 * (renders nothing) otherwise, so a quiet station never grows a placeholder.
 * Shares the swarm HUD query with MiniRelayLine (same key), so mounting this
 * alongside it costs no extra network round trip. Click expands to the run's
 * mission, the same navigation the mini line already uses.
 */
function StationRelayLine({
  station,
  workspaceId,
}: {
  station: AgentStation;
  workspaceId: string | null;
}) {
  const hudFn = useServerFn(getSwarmHud);
  const q = useQuery({
    queryKey: ["swarm", "hud", workspaceId],
    queryFn: () => hudFn({ data: { workspaceId } }),
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  });
  const run = stationActiveRun(q.data, station);
  if (!run) return null;

  // Owns its own bottom margin (present only while a run is live) so a
  // quiet station never reserves layout space for an empty wrapper.
  const body = (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-2x)", minWidth: 0, marginBottom: 16 }}>
      <AgentMark slug={run.slug} size={16} />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        <span className={run.isGate ? undefined : "agent-live"} style={{ fontWeight: 540 }}>
          {run.name}
        </span>
        <span style={{ color: run.isGate ? "var(--ember)" : "var(--text-subtle)" }}>
          {" "}
          · {run.isGate ? "needs your sign-off" : `${run.verb}...`}
        </span>
      </span>
      <StepDot status={run.isGate ? "gate" : "running"} />
    </div>
  );

  if (run.missionId) {
    return (
      <Link
        to="/build/$missionId"
        params={{ missionId: run.missionId }}
        className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{ textDecoration: "none", display: "block", borderRadius: "var(--radius-control)" }}
      >
        {body}
      </Link>
    );
  }
  return body;
}
