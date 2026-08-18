/**
 * THE TEAM TAB, in the Engine Room's Safety room.
 *
 * PORTED AND NARROWED 2026-07-29. What this panel used to be: a static render
 * of the agent catalog, grouped by station, three name-and-blurb rows per
 * group, carrying no live data and offering no action. That is the exact thing
 * the founder rejected about the old Crew surface ("it is just a display of
 * what it is, but there is no action items there"), and Crew has since been
 * redesigned to do the same job LIVE and better: real mark states read from the
 * run rows, the per-agent boundary, the per-tool policy, and the graduation
 * queue.
 *
 * So this panel stops being a second copy of that. `_authenticated.crew.tsx`
 * records the debt in its own header ("this leaves the same control in two
 * places until that lane retires its copy"). This is that lane, and this is the
 * retirement:
 *
 *   MOVED OUT, to /crew  the per-agent autonomy dial. It was TrustDial's four
 *                        clickable rungs writing `agent_autonomy.arc`, and Crew
 *                        writes the same column through `setAgentArc` with
 *                        plain-words choices, with who-set-it on the second
 *                        line, and composed with the tool policy underneath it.
 *                        Two dials on the same column with two vocabularies is
 *                        drift with a schedule. Every row here is now a door to
 *                        the one that stayed.
 *   KILLED               the static station roster. It listed thirteen names
 *                        and blurbs from the catalog with no state and no
 *                        click. Crew renders the same catalog live.
 *   KEPT                 the whole crew at once, which is the read Crew cannot
 *                        give you: Crew shows one agent per page, so finding
 *                        the one whose record disagrees with its rung costs
 *                        thirteen clicks. That is what an Engine Room is for.
 *   KEPT                 the raw run and memory read (AgentInspector). Crew
 *                        shows an agent's written lessons; nothing else shows
 *                        what it actually ran and what it holds.
 *
 * Engine-Room: the live agent mesh, its record, and what each one has done
 *   -> one door, revealed on demand, never on the calm front
 *   -> named for the outcome ("who is working, and what their record says").
 */

import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Num } from "@/components/meridian/surface-parts";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSwarmHud } from "@/lib/swarm.functions";
import { getAllAgentTrust, type AgentTrust } from "@/lib/trust.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Block, Empty, Failed, Loading, Value } from "@/components/shell/primitives";
import { AgentMark, type MarkState } from "@/components/meridian/marks";
import { ladderLabel, type Arc } from "@/lib/trust-ladder";
import { TrustDial } from "@/components/cockpit/TrustDial";
import { AgentInspector } from "@/components/cockpit/AgentInspector";
import { AgentScorecardPanel } from "@/components/engine-room/AgentScorecardPanel";

/** Plain-words relative time. Mono is applied by the row, not here. */
export function ago(iso: string | null | undefined): string | null {
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

/** The statuses `agent_runs` writes while a run is still going. Anything else
 *  is a run that has stopped, so the mark stops with it. */
const LIVE_STATUS = new Set(["planning", "running", "awaiting_approval"]);
const FAILED_STATUS = new Set(["failed", "completed_with_failures"]);

export function AgentRosterPanel({ workspaceId }: { workspaceId: string | null }) {
  const navigate = useNavigate();

  const fHud = useServerFn(getSwarmHud);
  const hud = useQuery({
    queryKey: ["swarm", "hud", workspaceId],
    queryFn: () => fHud({ data: { workspaceId } }),
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });

  // Trust is user scoped rather than workspace scoped (agents are not workspace
  // rows in this app), so this key deliberately carries no workspace. It is the
  // same key TrustDial and the scorecard read, so TanStack dedupes the fetch.
  const fTrust = useServerFn(getAllAgentTrust);
  const trustQ = useQuery({ queryKey: ["agent-trust"], queryFn: () => fTrust() });

  const agents = hud.data?.agents ?? [];
  const trust = (trustQ.data?.trust ?? []) as AgentTrust[];

  const trustById = React.useMemo(() => {
    const m = new Map<string, AgentTrust>();
    for (const t of trust) m.set(t.agent_id, t);
    return m;
  }, [trust]);

  const infoById = React.useMemo(() => {
    const m = new Map<string, { name: string; slug: string; role: string }>();
    for (const a of agents) {
      m.set(a.agent_id, { name: agentDisplayName(a.slug, a.name), slug: a.slug, role: a.role });
    }
    return m;
  }, [agents]);

  // WHETHER THE RECORD IS IN HAND AT ALL, which two different things below both
  // hang off.
  //
  // `hud` got a full error arm and `trustQ` got neither an error nor a loading
  // one, so a failed trust read fell back to `[]` and every row printed "No
  // record yet": thirteen agents each stating, as a fact, that they have earned
  // nothing, on the surface an operator uses to decide whether an agent has
  // earned more room. A read that failed is not a record of zero.
  //
  // The same failure quietly destroyed the ordering. The sort below scores
  // every agent -1 when trust is missing, so "most-trusted first" collapses to
  // catalog order while the panel goes on presenting itself as a ranking. The
  // census says which of the two the reader is actually looking at.
  const ranked = !trustQ.isError && !trustQ.isLoading;

  // Most-trusted first, so the ranking itself is information. An agent with no
  // record sorts to the bottom rather than being given a score it has not
  // earned.
  const rows = React.useMemo(
    () =>
      [...agents].sort((a, b) => {
        const sa = trustById.get(a.agent_id)?.score ?? -1;
        const sb = trustById.get(b.agent_id)?.score ?? -1;
        return sb - sa;
      }),
    [agents, trustById],
  );

  const working = agents.filter((a) => a.enabled && LIVE_STATUS.has(a.latest_run?.status ?? ""));
  const off = agents.filter((a) => !a.enabled);

  function stateFor(a: (typeof agents)[number]): MarkState {
    if (!a.enabled) return "quiet";
    const status = a.latest_run?.status ?? "";
    if (LIVE_STATUS.has(status)) return "running";
    if (FAILED_STATUS.has(status)) return "failed";
    return "idle";
  }

  const open = (slug: string) => void navigate({ to: "/crew", search: { agent: slug } });

  if (hud.isLoading && agents.length === 0) {
    return (
      <Block title="Who is working">
        <Loading>Reading the crew.</Loading>
      </Block>
    );
  }

  // A read that failed is not an empty state. "Nobody is here" and "we could
  // not find out who is here" are different facts, and the operator acts
  // differently on each.
  if (hud.isError) {
    return (
      <Block title="Who is working">
        <Failed onRetry={() => hud.refetch()}>
          The crew did not load, so nothing below would be the real state.
        </Failed>
      </Block>
    );
  }

  const census =
    agents.length === 0 ? null : (
      <>
        <Num>{working.length}</Num> of <Num>{agents.length}</Num> are working right now
        {off.length > 0 ? (
          <>
            , <Num>{off.length}</Num> are switched off
          </>
        ) : null}
        .{" "}
        {ranked
          ? "Most-trusted first."
          : trustQ.isError
            ? "The record did not load, so this is catalog order and not a ranking."
            : "Still reading the record, so this is catalog order for now."}{" "}
        Open one to change what it is allowed to do.
      </>
    );

  return (
    <>
      <Block title="Who is working" sub={census}>
        {agents.length === 0 ? (
          <Empty>
            This account has no agent rows yet. The first mission that needs an agent creates it.
          </Empty>
        ) : (
          rows.map((a) => {
            const t = trustById.get(a.agent_id);
            const name = agentDisplayName(a.slug, a.name);
            const run = a.latest_run;
            const live = a.enabled && LIVE_STATUS.has(run?.status ?? "");
            return (
              <Row
                key={a.agent_id}
                marks={<AgentMark slug={a.slug} name={a.name} state={stateFor(a)} />}
                lead={
                  <>
                    {name}
                    {a.trust_arc ? (
                      <>
                        {" "}
                        {/* ladderLabel falls back to the raw value for an arc it
                            has not been told about, so an arc the catalog gains
                            later reads as itself rather than as nothing. */}
                        <Value tone="quiet">{ladderLabel(a.trust_arc as Arc)}</Value>
                      </>
                    ) : null}
                  </>
                }
                // The second line is always a DIFFERENT fact from the lead: the
                // record, never a restatement of the rung the lead already
                // shows. A score over fewer than three signals is not evidence,
                // so it is not drawn as one.
                //
                // "No record yet" is a CLAIM about this agent and it may only be
                // made off a trust read that landed. When the read failed or is
                // still in flight, `t` is undefined for every agent alike, and
                // saying "no record" thirteen times would be inventing thirteen
                // facts out of one missing answer.
                sub={
                  !a.enabled ? (
                    "Switched off. Nothing dispatches it."
                  ) : live ? (
                    <>
                      Running now
                      {run?.step_index != null ? (
                        <>
                          , step <Num>{run.step_index}</Num>
                        </>
                      ) : null}
                    </>
                  ) : trustQ.isError ? (
                    "Its record did not load, so this line is not its record."
                  ) : trustQ.isLoading ? (
                    "Reading its record."
                  ) : t && t.breakdown.samples >= 3 ? (
                    <>
                      <Num>{t.score}</Num> out of <Num>100</Num>, from{" "}
                      <Num>{t.breakdown.samples}</Num> signals
                    </>
                  ) : (
                    "No record yet. Its boundary is yours to set until there is one."
                  )
                }
                time={ago(run?.created_at)}
                tight
                onClick={() => open(a.slug)}
              />
            );
          })
        )}
      </Block>

      {/* The record speaking, across the whole crew at once. Renders nothing
          when every agent sits where its record says it belongs. */}
      <TrustDial infoById={infoById} />

      {/* RPT-37: the outcome-graded scorecard, per agent and per task type. */}
      <AgentScorecardPanel />

      <AgentInspector agents={agents} />
    </>
  );
}
