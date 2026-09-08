// AGENT-EXP: pure, side-effect-free mappers that turn the live swarm/mission
// data into the calm "relay" the user reads. No React, no server imports (the
// data shapes are type-only), so this stays unit-testable and client-safe.
//
// The relay shows agents IN MOTION grouped by station: each agent is one row
// showing only its latest line (ephemeral), parallel agents read as calm rows,
// and the work collapses to the artifact when done. Crew agents and the
// conductor are never shown in the relay.

import type { SwarmHud } from "@/lib/swarm.functions";
import type { MissionDetail } from "@/lib/missions.functions";
import {
  AGENT_STATION_ORDER,
  AGENT_STATIONS,
  agentDisplayName,
  agentRelayVerb,
  agentTier,
  isConductor,
  resolveStationTotal,
  type AgentStation,
} from "@/lib/agent-vocabulary";

export type RelayStatus = "running" | "gate" | "done" | "planned" | "failed" | "idle";

/** Map a raw run/mission/step status string to the relay's calm vocabulary. */
export function mapRelayStatus(s: string | null | undefined): RelayStatus {
  switch ((s ?? "").toLowerCase()) {
    case "running":
    case "queued":
    case "dispatched":
      return "running";
    case "awaiting_review":
    case "waiting_approval":
    case "gate":
      return "gate";
    case "completed":
    /*
     * `completed_with_failures` IS `done` HERE, AND NO SIXTH WORD IS ADDED.
     *
     * 618 of 1,825 `agent_runs` rows, 33.9%, measured in production 2026-08-20.
     * It fell to `default: return "idle"`, so a third of all finished runs were
     * drawn as nothing happening on both mounted surfaces (DiscoverSurface and
     * MissionOrchestratorDetail). Together with `complete`'s 2 rows that was
     * 620 runs, 34.0%, finished and drawn idle.
     *
     * Why not a sixth `RelayStatus` word for "finished with a hole in it":
     *
     *   1. THE RELAY ASKS A DIFFERENT QUESTION than a scorecard does. Its six
     *      words are all about motion and attention, never about the quality of
     *      an outcome: who is working, who is waiting on you, who is finished.
     *      A run that finished, produced output and handed off does not need a
     *      person, and that is the only thing this vocabulary is for. The hole
     *      in what it shipped is a fact about the artifact, and it belongs in
     *      the run detail where a reader can act on it.
     *   2. A SIXTH WORD WOULD HAVE NOWHERE TO RENDER, so it would repeat this
     *      exact defect in a new coat. The only consumer, `markFor` in
     *      AgentRelay.tsx, is an if-chain that falls through to `"quiet"`, and
     *      `MarkState` carries no value meaning "finished with failures". An
     *      unhandled sixth word would typecheck clean and draw QUIETER than
     *      `done` does.
     *   3. `latestLine` below branches on these same words, and its `done` arm
     *      shows the run's final message. A run that finished with failures has
     *      one, and it is the line worth showing.
     *   4. THE REPO HAS ALREADY RULED IT, on measurements rather than taste:
     *      `agent-fleet.ts` buckets it `done` for the supervise-by-exception
     *      tally (zero `failure_kind` against `failed`'s 347; 37,098 tokens
     *      burned against `failed`'s 1,097, so it runs further than a clean
     *      success rather than dying early; 67% of its missions reach a
     *      completed state). That tally asks the same question the relay asks.
     *      `reliability/runaway.ts` calls it terminal for the same reason.
     *
     * The cost is accepted and it is the same one agent-fleet.ts accepted: the
     * relay calls this run delivered where `run-state.ts` and `build-status.ts`
     * call it stopped. Those two ask *was this a clean success*. This one asks
     * *is anyone still working on it*.
     */
    case "completed_with_failures":
    // The singular, written by `runAgent` on the happy path
    // (agents.functions.ts). 2 rows in production, and it was falling to `idle`
    // with the other 618. Falls through.
    case "complete":
    // Zero rows in production write `done`. It stays: the defect was the
    // absence of the two above, not its presence, and it costs nothing.
    // Falls through.
    case "done":
      return "done";
    case "failed":
    case "halted":
    case "error":
    case "cancelled":
      return "failed";
    case "planned":
    case "ready":
      return "planned";
    default:
      return "idle";
  }
}

export type RelayStep = {
  runId: string;
  slug: string;
  name: string;
  station: AgentStation;
  status: RelayStatus;
  /** The agent's latest line (ephemeral): outcome when done, the relay verb while running. */
  latestLine: string;
  handoffToSlug: string | null;
  handoffToName: string | null;
  isGate: boolean;
};

/** Turn a mission's hops + handoff messages into ordered relay steps. */
export function toRelaySteps(detail: MissionDetail | null | undefined): RelayStep[] {
  const hops = detail?.hops ?? [];
  const messages = detail?.messages ?? [];

  return hops.map((h) => {
    const status = mapRelayStatus(h.status);
    const steps = h.steps ?? [];
    const last = steps[steps.length - 1];
    const name = agentDisplayName(h.agent_slug, h.agent_name);

    let latestLine = agentRelayVerb(h.agent_slug) ?? "working";
    if (status === "done") {
      if (last && last.kind === "final" && last.message) latestLine = last.message.slice(0, 160);
      else latestLine = `${name} finished`;
    } else if (status === "running") {
      if (last && last.kind === "thought" && last.text) latestLine = last.text.slice(0, 160);
      else latestLine = agentRelayVerb(h.agent_slug) ?? "working";
    } else if (status === "gate") {
      latestLine = "needs your sign-off";
    } else if (status === "failed") {
      latestLine = "hit a problem";
    }

    const outbound = messages.find((m) => m.source_run_id === h.run_id) ?? null;

    return {
      runId: h.run_id,
      slug: h.agent_slug,
      name,
      station: resolveStationTotal(h.agent_slug),
      status,
      latestLine,
      handoffToSlug: outbound?.to_agent_slug ?? null,
      handoffToName: outbound ? agentDisplayName(outbound.to_agent_slug) : null,
      isGate: status === "gate",
    };
  });
}

export type RelayStationGroup = { station: AgentStation; name: string; steps: RelayStep[] };

/** Group relay steps by station, in loop order, dropping empty stations. */
export function relayByStation(steps: RelayStep[]): RelayStationGroup[] {
  const map = new Map<AgentStation, RelayStep[]>();
  for (const s of steps) {
    const list = map.get(s.station) ?? [];
    list.push(s);
    map.set(s.station, list);
  }
  return AGENT_STATION_ORDER.filter((st) => map.has(st)).map((st) => ({
    station: st,
    name: AGENT_STATIONS[st].name,
    steps: map.get(st) ?? [],
  }));
}

export type MiniRelay = {
  missionId: string | null;
  title: string | null;
  /** Running cast agent slugs, for the dots. */
  agentSlugs: string[];
  /** One live line. */
  note: string;
  /** Whether anything is running at all. */
  active: boolean;
};

export type StationActiveRun = {
  slug: string;
  /** The display name of the one cast agent shown for this station's inline line. */
  name: string;
  /** The present-tense relay verb ("reading your sources"), never null (falls back to "working"). */
  verb: string;
  /** The mission this run belongs to, for the "expand to the full trace" link. */
  missionId: string | null;
  /** True when the run is waiting on a human (the inline line reads in ember). */
  isGate: boolean;
};

/**
 * The one cast agent actively working (or gated) at a single station right
 * now, for a surface's compact inline relay line (PC-29 layer 4). Prefers a
 * running agent over a gated one; null when the station is quiet, so the
 * caller can render nothing rather than a stale line.
 */
export function stationActiveRun(
  hud: SwarmHud | null | undefined,
  station: AgentStation,
): StationActiveRun | null {
  const here = (hud?.agents ?? []).filter(
    (a) =>
      agentTier(a.slug) === "cast" &&
      !isConductor(a.slug) &&
      resolveStationTotal(a.slug) === station &&
      (mapRelayStatus(a.latest_run?.status) === "running" ||
        mapRelayStatus(a.latest_run?.status) === "gate"),
  );
  const chosen =
    here.find((a) => mapRelayStatus(a.latest_run?.status) === "running") ?? here[0] ?? null;
  if (!chosen) return null;

  return {
    slug: chosen.slug,
    name: agentDisplayName(chosen.slug),
    verb: agentRelayVerb(chosen.slug) ?? "working",
    missionId: chosen.latest_run?.mission_id ?? null,
    isGate: mapRelayStatus(chosen.latest_run?.status) === "gate",
  };
}

/** Build the one-line "what is running now" summary for Today from the swarm HUD. */
export function miniRelay(hud: SwarmHud | null | undefined): MiniRelay {
  const missions = (hud?.missions ?? []).filter((m) => mapRelayStatus(m.status) === "running");
  const newest =
    missions.slice().sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))[0] ?? null;
  const runningAgents = (hud?.agents ?? []).filter(
    (a) =>
      agentTier(a.slug) === "cast" &&
      !isConductor(a.slug) &&
      mapRelayStatus(a.latest_run?.status) === "running",
  );
  const latestHandoff = (hud?.handoffs ?? [])
    .slice()
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];

  let note = "";
  if (runningAgents[0]?.latest_run?.input) note = runningAgents[0].latest_run.input;
  else if (latestHandoff?.task) note = latestHandoff.task;

  return {
    missionId: newest?.id ?? null,
    title: newest?.title ?? null,
    agentSlugs: runningAgents.map((a) => a.slug),
    note: note.slice(0, 120),
    active: !!newest || runningAgents.length > 0,
  };
}
