/**
 * THE RECORD SPEAKING, across the whole crew at once.
 *
 * PORTED AND REDUCED 2026-07-29. This used to be the Autonomy trust dial: four
 * clickable rungs per agent, writing `agent_autonomy.arc` through `setAgentArc`,
 * with a success toast on every click. That control now lives on `/crew`, where
 * it says what each rung MEANS in plain words ("Runs alone, except the risky
 * calls"), says who set it, and sits directly above the per-tool policy it
 * composes with. Two controls writing one column from two screens with two
 * vocabularies is drift with a schedule, so this one is gone and the act moved.
 *
 * What did NOT move, and is the only reason this file still exists: Crew shows
 * one agent per page. Finding the agent whose record disagrees with the rope you
 * gave it costs thirteen clicks there. Here it is one glance, and it is the
 * product's own thesis rendered as an interaction: the machine earned something,
 * or it has more room than its record backs, and the record says so before you
 * ask. That is what an Engine Room is for.
 *
 * IT RENDERS NOTHING when every agent sits where its record puts it. Calm front,
 * deep engine: a panel that is silent when there is nothing to say is worth more
 * than one that always has a number on it.
 *
 * HONESTY FLOOR, and it is load-bearing: `suggestArc` returns "observing" for
 * any agent with fewer than three signals (ai/trust.server.ts). Drawing that as
 * advice would be inventing a verdict out of an absence of evidence, so this
 * gates on `samples >= 3` exactly as `_authenticated.crew.tsx` does. An agent
 * with no record is not an agent the record disagrees with.
 */

import { Fragment } from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getAllAgentTrust, type AgentTrust } from "@/lib/trust.functions";
import { ladderIndex, ladderLabel } from "@/lib/trust-ladder";
import { Actions, Block, Button, Failed, Loading, // Aliased, as `_authenticated.crew.tsx` aliases it: the primitive is a value
  // and the TypeScript utility type of the same name is used in this file, and
  // one shadowing the other is a bug waiting to be written.
  Record as RecordSays } from "@/components/shell/primitives";

/** What each rung actually lets an agent do, in the words a person would use.
 *  One fact, said once. The ladder's own labels say WHICH rung; this says what
 *  the rung buys, so the two lines never restate each other. */
const ARC_MEANING: Record<string, string> = {
  observing: "everything waits for you",
  proving: "it asks before it acts",
  trusted: "it runs alone, except the risky calls",
  ambient: "it runs alone, always",
};

type Info = { name: string; slug: string; role: string };

/** One agent whose record and rung disagree. */
type Disagreement = {
  trust: AgentTrust;
  info: Info | undefined;
  direction: "up" | "down";
};

export function TrustDial({ infoById }: { infoById: Map<string, Info> }) {
  const navigate = useNavigate();
  const fTrust = useServerFn(getAllAgentTrust);

  // Trust is user and agent scoped, so this query is deliberately workspace
  // agnostic. Same key as the roster's read, so TanStack serves one fetch.
  const trustQ = useQuery({ queryKey: ["agent-trust"], queryFn: () => fTrust() });

  const trust = (trustQ.data?.trust ?? []) as AgentTrust[];

  if (trustQ.isLoading && trust.length === 0) {
    return (
      <Block title="What the record says">
        <Loading>Reading what each one has earned.</Loading>
      </Block>
    );
  }

  // A failed read is not silence. Staying quiet here would say "every agent
  // sits where it belongs", which is a claim this component cannot make when
  // it could not read the record at all.
  if (trustQ.isError) {
    return (
      <Block title="What the record says">
        <Failed onRetry={() => trustQ.refetch()}>
          The record did not load, so nothing here can tell you whether a boundary is wrong.
        </Failed>
      </Block>
    );
  }

  const disagreements: Disagreement[] = trust
    .filter((t) => t.breakdown.samples >= 3 && t.suggested_arc !== t.arc)
    .map((t) => ({
      trust: t,
      info: infoById.get(t.agent_id),
      direction:
        ladderIndex(t.suggested_arc) > ladderIndex(t.arc) ? ("up" as const) : ("down" as const),
    }))
    // The widest gap first: the agent furthest from where its record puts it is
    // the one worth opening.
    .sort(
      (a, b) =>
        Math.abs(ladderIndex(b.trust.suggested_arc) - ladderIndex(b.trust.arc)) -
        Math.abs(ladderIndex(a.trust.suggested_arc) - ladderIndex(a.trust.arc)),
    );

  // Silent when there is nothing to say.
  if (disagreements.length === 0) return null;

  return (
    <Block
      title="What the record says"
      // What qualifies a row for this section, said once. The ladder itself is
      // NOT named here: each line below already says which rung it belongs at
      // and what that rung buys, so printing the whole chain would be the
      // fourth way of saying one thing.
      sub="Every one below is set somewhere its own record does not put it."
    >
      {disagreements.map((d) => {
        const t = d.trust;
        const b = t.breakdown;
        const name = d.info?.name ?? `Agent ${t.agent_id.slice(0, 6)}`;
        const slug = d.info?.slug ?? null;
        return (
          <Fragment key={t.agent_id}>
            <RecordSays
              evidence={
                <>
                  <Num>{t.score}</Num> out of <Num>100</Num>, from <Num>{b.samples}</Num> signals
                  {b.approvals_total > 0 ? (
                    <>
                      , you said yes to <Num>{b.approvals_approved}</Num> of{" "}
                      <Num>{b.approvals_total}</Num>
                    </>
                  ) : null}
                  {b.outcomes_total > 0 ? (
                    <>
                      , <Num>{b.outcomes_validated}</Num> of <Num>{b.outcomes_total}</Num> turned
                      out right
                    </>
                  ) : null}
                </>
              }
            >
              {d.direction === "up"
                ? `${name} has earned more room than you have given it. On what it has actually done, it belongs at ${ladderLabel(t.suggested_arc)}, where ${ARC_MEANING[t.suggested_arc] ?? "it runs under that boundary"}.`
                : `${name} has more room than its record backs. On what it has actually done, it belongs at ${ladderLabel(t.suggested_arc)}, where ${ARC_MEANING[t.suggested_arc] ?? "it runs under that boundary"}.`}
            </RecordSays>
            {slug ? (
              <Actions>
                <Button
                  variant="ghost"
                  onClick={() => void navigate({ to: "/crew", search: { agent: slug } })}
                >
                  {d.direction === "up" ? `Give ${name} that room` : `Pull ${name} back`}
                </Button>
              </Actions>
            ) : null}
          </Fragment>
        );
      })}
    </Block>
  );
}
