/**
 * What went wrong, newest first.
 *
 * PORTED 2026-07-29 onto src/components/shell/primitives.tsx.
 *
 * WAS: one bordered card per incident, each carrying its own severity pill with
 * a coloured dot, its own trace ref, its own timestamp, a wrapped detail
 * paragraph and its own "Open trace" affordance. Forty of those is forty
 * bordered containers in one region, and the standard caps a region at one
 * (anti-slop.md ban 5). The card also spent four lines on what a row says in
 * two, which is the founder's own complaint: depth is a click away, not
 * showcased on the surface.
 *
 * IS: a list of `Row`s, tight, each one line plus a different second fact. The
 * severity is a `Value` tone rather than a pill with a dot, because the tone
 * already carries the whole message a dot was repeating. The whole row opens
 * its trace, or its mission where there is no trace, which is the same target
 * the card had.
 *
 * NO AGENT MARK, deliberately. `Incident` carries no agent slug (the producer
 * bakes the actor into the title text), so a mark here would be invented. The
 * mark slot still renders empty, which is what keeps every lead on the same
 * line as every other list in the app.
 */
import { useQuery } from "@tanstack/react-query";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { getIncidents, type Incident } from "@/lib/incidents.functions";
import { Block, Empty, Failed, Loading, Row, Value } from "@/components/shell/primitives";
import { CostIncidentBadge } from "./CostIncidentBadge";
import { incidentTraceRefs, incidentTone, INCIDENT_VALUE_TONE } from "./incident-format";

const KIND_LABEL: Record<Incident["kind"], string> = {
  execution: "Execution",
  pipeline: "Pipeline",
  guardrail: "Guardrail",
  cost: "Cost",
  manual: "Manual",
  runaway: "Runaway",
};

/** Plain-words relative time, the same vocabulary the Crew surface uses. Mono
 *  is applied by the row, not here. */
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

function IncidentRow({ n, traceRef }: { n: Incident; traceRef: string }) {
  const navigate = useNavigate();
  const tone = INCIDENT_VALUE_TONE[incidentTone(n.kind)];
  const hasTrace = Boolean(n.traceId);
  // Trace wins when present; otherwise a mission-keyed incident opens its mission.
  const hasMission = !hasTrace && Boolean(n.missionId);
  const open = () => {
    if (n.traceId) navigate({ to: "/traces/$traceId", params: { traceId: n.traceId } });
    else if (n.missionId) navigate({ to: "/build/$missionId", params: { missionId: n.missionId } });
  };

  return (
    <Row
      lead={n.title}
      // The different fact: what kind of failure it was, and what actually
      // happened. Never a restatement of the title.
      sub={
        <>
          <Value tone={tone}>{KIND_LABEL[n.kind]}</Value> {n.detail}
        </>
      }
      time={ago(n.at)}
      tight
      onClick={hasTrace || hasMission ? open : undefined}
      action={
        n.kind === "cost" ? (
          <CostIncidentBadge amountUsd={n.amountUsd} windowKind={n.windowKind} />
        ) : (
          <Num>{traceRef}</Num>
        )
      }
    />
  );
}

export function IncidentsPanel() {
  const fGet = useServerFn(getIncidents);
  const q = useQuery({ queryKey: ["incidents"], queryFn: () => fGet() });

  if (q.isLoading) return <Loading>Reading what went wrong.</Loading>;

  // A failed read is not an empty state and must never wear one's clothes:
  // "nothing went wrong" and "we could not find out" are different facts, and a
  // person acts differently on each.
  if (q.isError) {
    return (
      <Block>
        <Failed onRetry={() => void q.refetch()}>
          The record did not load, so an empty list here would not mean nothing went wrong.
        </Failed>
      </Block>
    );
  }

  const items = q.data?.incidents ?? [];

  if (items.length === 0) {
    return (
      <Empty>
        Nothing has gone wrong recently. A failed tool call, a pipeline error, a guardrail block, a
        spend cap reached or a mission that will not stop lands here, newest first.
      </Empty>
    );
  }

  // Refs are computed over the WHOLE list, not per row, because uniqueness is a
  // property of the set: a six-hex short is only ambiguous relative to its
  // neighbours. Every seeded incident shorted to the same INC.600000 before this.
  const refs = incidentTraceRefs(items.map((n) => n.id));

  return (
    <>
      {items.map((n) => (
        <IncidentRow key={n.id} n={n} traceRef={refs.get(n.id) ?? ""} />
      ))}
    </>
  );
}
