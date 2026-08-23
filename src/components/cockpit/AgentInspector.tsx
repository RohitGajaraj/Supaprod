/**
 * ONE AGENT, IN FULL: what it has actually run, and what it holds.
 *
 * PORTED 2026-07-29 onto the primitives. It used to be a `material-medium` card
 * with a hand-rolled `<select>`, a hand-rolled hairline (`color-mix` on
 * `--ink-faint`) redrawn on every row, and "Loading" as a bare div for both
 * reads with no failure state at all, so a read that ERRORED rendered exactly
 * like an agent with no history. Those are different facts and an operator acts
 * differently on each.
 *
 * It survives the Crew retirement because it is the one read Crew does not do.
 * Crew shows an agent's written LESSONS, the reflections it composed after a
 * run. This shows the runs themselves and the memory pool it draws on, which is
 * the raw material underneath. Read only, RLS scoped.
 *
 * Engine-Room: raw per-agent run rows + the memory pool
 *   -> named for the outcome ("what this one has been doing, and what it knows").
 */

import { useState } from "react";
import { Row, Line } from "@/components/meridian/rows";
import { Num, ReadFailedLine } from "@/components/meridian/surface-parts";
import { EmptyRegion } from "@/components/meridian/EmptyRegion";
import { LoadingState } from "@/components/meridian/LoadingState";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getAgentRuns,
  getAgentMemory,
  type AgentRun,
  type AgentMemory,
} from "@/lib/agent-runs.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Select, Value } from "@/components/shell/primitives";
import { Region } from "@/components/meridian/surface-parts";
import { AgentMark, type MarkState } from "@/components/meridian/marks";

type AgentLite = { agent_id: string; slug: string; name: string; role: string };

/** The run's own status, in the words a person would use. The raw enum is the
 *  correct technical whisper in a log and nowhere else. */
const RUN_STATUS: Record<string, string> = {
  running: "Running",
  // `waiting_approval` is the word the loop writes when a run parks at a gate
  // (`ai/loop.server.ts`). This map keyed an `awaiting`-prefixed spelling that no
  // writer anywhere produces, plus `planning`, which is a missions word, so the
  // one label a person most needs to see never printed: a gated run fell through
  // to the raw column value below. There is no `planning` run, so there is no
  // label for one.
  waiting_approval: "Waiting on a decision from you",
  completed: "Finished",
  completed_with_failures: "Finished, with failures",
  failed: "Failed",
  cancelled: "Cancelled",
};

function runStatusLabel(status: string | null): string {
  if (!status) return "Status not recorded";
  return RUN_STATUS[status] ?? status.replace(/_/g, " ");
}

function runMarkState(status: string | null): MarkState {
  if (status === "running") return "running";
  if (status === "waiting_approval") return "waiting";
  if (status === "failed" || status === "completed_with_failures") return "failed";
  return "idle";
}

/** Plain-words relative time. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function AgentInspector({ agents }: { agents: AgentLite[] }) {
  const [selected, setSelected] = useState<string>(agents[0]?.agent_id ?? "");

  const fRuns = useServerFn(getAgentRuns);
  const runsQ = useQuery({
    queryKey: ["agent-runs", selected],
    queryFn: () => fRuns({ data: { agentId: selected } }),
    enabled: !!selected,
  });

  const fMem = useServerFn(getAgentMemory);
  const memQ = useQuery({
    queryKey: ["agent-memory", selected],
    queryFn: () => fMem({ data: { agentId: selected } }),
    enabled: !!selected,
  });

  // The roster above already says this account has no agents. Saying it twice
  // is the redundant-writing ban, so this stays quiet.
  if (agents.length === 0) return null;

  const runs: AgentRun[] = runsQ.data?.runs ?? [];
  const memories: AgentMemory[] = memQ.data?.memories ?? [];
  const current = agents.find((a) => a.agent_id === selected) ?? agents[0];
  const name = agentDisplayName(current.slug, current.name);

  return (
    <>
      <Region title="What one of them has been doing">
        <Line
          label="Which one"
          // A different fact from the control beside it: the control says WHICH
          // agent, this says what picking one gets you.
          sub="Its last runs, and what it draws on, both read live."
          htmlFor="agent-inspector-pick"
        >
          <Select
            id="agent-inspector-pick"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.agent_id} value={a.agent_id}>
                {agentDisplayName(a.slug, a.name)}
              </option>
            ))}
          </Select>
        </Line>

        {runsQ.isLoading ? (
          <LoadingState label="Reading its runs." />
        ) : runsQ.isError ? (
          <ReadFailedLine onRetry={() => runsQ.refetch()}>
            Its runs did not load, so this is not the whole history.
          </ReadFailedLine>
        ) : runs.length === 0 ? (
          <EmptyRegion title="No runs yet">
            {name} has not run in this account yet. A run is recorded the first time a mission
            dispatches it.
          </EmptyRegion>
        ) : (
          runs.map((r) => (
            <Row
              key={r.id}
              marks={
                <AgentMark slug={current.slug} name={current.name} state={runMarkState(r.status)} />
              }
              lead={runStatusLabel(r.status)}
              sub={
                r.mission_id ? (
                  <>
                    In a mission
                    {r.step_index != null ? (
                      <>
                        , step <Num>{r.step_index}</Num>
                      </>
                    ) : null}
                  </>
                ) : (
                  "Run on its own, outside a mission"
                )
              }
              time={ago(r.created_at)}
              tight
            />
          ))
        )}
      </Region>

      <Region
        title="What it knows"
        sub="What it learned itself, plus the shared pool every agent here draws on."
      >
        {memQ.isLoading ? (
          <LoadingState label="Reading what it learned." />
        ) : memQ.isError ? (
          <ReadFailedLine onRetry={() => memQ.refetch()}>
            This did not load, so it is not everything the agent goes on.
          </ReadFailedLine>
        ) : memories.length === 0 ? (
          <EmptyRegion title="No lessons yet">
            {name} has learned nothing yet. It draws a lesson after a run it can learn from, and it
            reads anything the crew has put in the shared pool.
          </EmptyRegion>
        ) : (
          memories.map((m) => (
            <Row
              key={m.id}
              lead={m.content}
              sub={
                <>
                  <Value tone="quiet">{m.scope === "global" ? "Shared" : "Its own"}</Value>
                  {m.kind ? <> {m.kind.replace(/_/g, " ")}</> : null}
                </>
              }
              time={ago(m.last_used_at)}
              tight
            />
          ))
        )}
      </Region>
    </>
  );
}
