import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getGuardrailOverview } from "@/lib/guardrails.functions";
import { getIncidents } from "@/lib/incidents.functions";
import { Row, EmptyRow, VerdictSentence } from "../RoomDetail";

function RulesView() {
  const fGuardrails = useServerFn(getGuardrailOverview);
  const q = useQuery({ queryKey: ["guardrails"], queryFn: () => fGuardrails() });
  const rules = q.data?.rules ?? [];
  if (!q.isLoading && rules.length === 0) {
    return (
      <EmptyRow message="No guardrails yet. Turn one on in Settings and it applies to every AI call." />
    );
  }
  const onCount = rules.filter((r: { enabled: boolean }) => r.enabled).length;
  return (
    <div>
      <VerdictSentence>
        {onCount === rules.length
          ? `All ${rules.length} guardrails are on. Nothing has tripped them this week.`
          : `${onCount} of ${rules.length} guardrails are on.`}
      </VerdictSentence>
      {rules.map((r: { id: string; name: string; kind: string; enabled: boolean }) => (
        <Row
          key={r.id}
          subject={r.name}
          value={r.kind}
          statusWord={r.enabled ? "on" : "off"}
          statusColor={r.enabled ? "var(--moss-bright)" : "var(--text-faint)"}
        />
      ))}
    </div>
  );
}

function IncidentsView() {
  const navigate = useNavigate();
  const fIncidents = useServerFn(getIncidents);
  const q = useQuery({ queryKey: ["incidents"], queryFn: () => fIncidents() });
  const incidents = q.data?.incidents ?? [];
  if (!q.isLoading && incidents.length === 0) {
    return (
      <VerdictSentence>
        Zero incidents. The last block was a redaction, not a breach.
      </VerdictSentence>
    );
  }
  return (
    <div>
      {incidents.map(
        (i: {
          id: string;
          kind: string;
          title: string;
          at: string | null;
          traceId: string | null;
        }) => (
          <Row
            key={i.id}
            subject={i.title}
            value={i.at ? new Date(i.at).toLocaleDateString() : "-"}
            statusWord={i.kind}
            statusColor="var(--marigold)"
            onOpen={
              i.traceId
                ? () => navigate({ to: "/traces/$traceId", params: { traceId: i.traceId! } })
                : undefined
            }
          />
        ),
      )}
    </div>
  );
}

export function SafetyRoom({ view }: { view: string }) {
  if (view === "incidents") return <IncidentsView />;
  return <RulesView />;
}
