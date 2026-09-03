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
import { Row } from "@/components/meridian/rows";
import { NothingHere, Num, ReadFailed, Reading, Value } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { getIncidents, type Incident } from "@/lib/incidents.functions";
import { CostIncidentBadge } from "./CostIncidentBadge";
import { incidentTraceRefs, incidentTone, INCIDENT_VALUE_TONE } from "./incident-format";

/**
 * `incident-format.ts` still speaks the RETIRED tone vocabulary and is pinned
 * there by `__tests__/incident-format.test.ts`, which asserts `marigold` reads
 * as "warn". So the translation happens here rather than by widening Meridian's
 * five status words back out to six.
 *
 * `warn` becomes `hold`: a runaway or a pipeline stall is stopped on a
 * condition, which is what Meridian's amber says. Orchid would be the reflex
 * and it is wrong -- it means A PERSON IS REQUIRED, and `Value` deliberately
 * has no `you` tone because a value is something you read.
 */
const MRD_TONE: Record<"quiet" | "pass" | "warn" | "fail", "quiet" | "pass" | "hold" | "fail"> = {
  quiet: "quiet",
  pass: "pass",
  warn: "hold",
  fail: "fail",
};

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
  const tone = MRD_TONE[INCIDENT_VALUE_TONE[incidentTone(n.kind)]];
  const hasTrace = Boolean(n.traceId);
  // Trace wins when present; otherwise a mission-keyed incident opens its mission.
  const hasMission = !hasTrace && Boolean(n.missionId);
  const open = () => {
    if (n.traceId) navigate({ to: "/traces/$traceId", params: { traceId: n.traceId } });
    // P-14 (A-QUEUE.md, R-35): /runs/$missionId is deleted. This incident
    // carries missionId, not a track id, so this falls back to Start rather
    // than a dead link.
    else if (n.missionId) navigate({ to: SIGNED_IN_HOME });
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

  if (q.isLoading) return <Reading>Reading what went wrong.</Reading>;

  // A failed read is not an empty state and must never wear one's clothes:
  // "nothing went wrong" and "we could not find out" are different facts, and a
  // person acts differently on each.
  if (q.isError) {
    return (
      <ReadFailed error={q.error} onRetry={() => void q.refetch()}>
        The record did not load, so an empty list here would not mean nothing went wrong.
      </ReadFailed>
    );
  }

  const items = q.data?.incidents ?? [];

  if (items.length === 0) {
    return (
      <NothingHere>
        Nothing has gone wrong recently. A failed tool call, a pipeline error, a guardrail block, a
        spend cap reached or a mission that will not stop lands here, newest first.
      </NothingHere>
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
