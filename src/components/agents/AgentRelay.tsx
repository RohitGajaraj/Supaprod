/**
 * The relay: agents IN MOTION, grouped by station, each as one row that says who
 * is working, what they last did, and who picks it up next.
 *
 * PORTED 2026-07-29 onto shell/primitives. What changed and why:
 *   · The `full` variant was a bordered `<section>` with its own background,
 *     radius and padding, mounted INSIDE mission detail's own card. That is a
 *     card in a card, and the standard caps a region at one bordered container.
 *     It is a `Block` now, which draws a rule where the register changes.
 *   · `StepDot` is gone. Status was a coloured dot beside a name while the mark
 *     beside it said nothing; the mark carries the state now, which is where the
 *     system already puts it. State is never a hue: a ring means running, ember
 *     means it needs you, red means it failed.
 *   · Exactly ONE mark on a surface may blink. A relay with three gates used to
 *     draw three ember dots, which spends the whole restraint budget and stops
 *     the blink meaning "look here". The first thing asking wears `gate`;
 *     everything queued behind it wears `waiting`.
 *   · The gate line was ember TEXT. Ember marks the human, not a sentence, so
 *     the words say it instead and the mark carries the colour.
 *
 * The reads are unchanged: `getMission` shares the mission route's cache key,
 * and both live lines share one `["swarm","hud",workspaceId]` query, so mounting
 * them together still costs one round trip.
 */

import { Link } from "@tanstack/react-router";
import { Row, Who } from "@/components/meridian/rows";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMission } from "@/lib/missions.functions";
import { getSwarmHud } from "@/lib/swarm.functions";
import { Block } from "@/components/shell/primitives";
import { AgentMark, MarkStack, type MarkState } from "@/components/meridian/marks";
import type { AgentStation } from "@/lib/agent-vocabulary";
import {
  miniRelay,
  relayByStation,
  stationActiveRun,
  toRelaySteps,
  type RelayStatus,
} from "@/lib/relay";

/** A run's status as the mark speaks it. `gate` is handed out ONCE per surface
 *  by the caller; everything else asking takes `waiting`. */
function markFor(s: RelayStatus): MarkState {
  if (s === "running") return "running";
  if (s === "failed") return "failed";
  if (s === "gate") return "waiting";
  if (s === "done") return "idle";
  return "quiet";
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

  // The one thing actually asking. Everything behind it is queued, not urgent.
  const blinkRunId = steps.find((s) => s.status === "gate")?.runId ?? null;

  return (
    <Block title="The relay" sub="Who is working, and who picks it up next.">
      {groups.map((g) => (
        <div key={g.station}>
          <div className="sp-block-sub" style={{ margin: "var(--mrd-s5) 0 0" }}>
            {g.name}
          </div>
          {g.steps.map((s) => (
            <Row
              key={s.runId}
              marks={
                <AgentMark
                  slug={s.slug}
                  name={s.name}
                  state={s.runId === blinkRunId ? "gate" : markFor(s.status)}
                />
              }
              lead={
                <>
                  <Who>{s.name}</Who>
                  {s.handoffToName ? <> hands it to {s.handoffToName}</> : null}
                </>
              }
              // The gate says so in words. Ember marks the human, and it is
              // already doing that on the mark to the left.
              sub={s.isGate ? `Waiting on you. ${s.latestLine}` : s.latestLine}
              tight
            />
          ))}
        </div>
      ))}
    </Block>
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
    return <div style={{ color: "var(--mrd-mute)" }}>All quiet. Nothing needs you right now.</div>;
  }

  const body = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-space-3)",
        minWidth: 0,
      }}
    >
      <MarkStack agents={r.agentSlugs.slice(0, 4).map((slug) => ({ slug }))} state="running" />
      <span
        style={{
          color: "var(--mrd-ink)",
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
        to="/runs/$missionId"
        params={{ missionId: r.missionId }}
        style={{ textDecoration: "none", display: "block", color: "inherit" }}
      >
        {body}
      </Link>
    );
  }
  return body;
}

/**
 * A single station's compact inline line, shown only while that station has an
 * active run. It renders nothing otherwise, so a quiet station never grows a
 * placeholder. Shares the swarm HUD query with the mini line (same key), so
 * mounting both costs no extra round trip.
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

  // Owns its own bottom margin (present only while a run is live) so a quiet
  // station never reserves layout space for an empty wrapper. One line, one
  // mark: this is the only thing running at this station, so it may blink.
  const body = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-space-2)",
        minWidth: 0,
        marginBottom: "var(--sp-space-5)",
      }}
    >
      <AgentMark slug={run.slug} name={run.name} state={run.isGate ? "gate" : "running"} />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        <span className="sp-row-who">{run.name}</span>
        <span style={{ color: "var(--mrd-mute)" }}>
          {" "}
          {run.isGate ? "is waiting on you" : `${run.verb}...`}
        </span>
      </span>
    </div>
  );

  if (run.missionId) {
    return (
      <Link
        to="/runs/$missionId"
        params={{ missionId: run.missionId }}
        style={{ textDecoration: "none", display: "block", color: "inherit" }}
      >
        {body}
      </Link>
    );
  }
  return body;
}
