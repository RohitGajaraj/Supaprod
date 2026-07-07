import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { getIncidents, type Incident } from "@/lib/incidents.functions";
import { relTimeCaps } from "@/components/discover/format";
import { CostIncidentBadge } from "./CostIncidentBadge";
import { incidentTraceRef, incidentTone, INCIDENT_TONE_VAR } from "./incident-format";

// P7 · Incidents, read-only "what went wrong" log on the Engine Room: failed
// tool executions, errored auto-pipeline events, guardrail blocks, cost
// breaches, and runaway missions, newest first. Engine-Room: names the outcome
// ("what went wrong"); dim 17: each incident is a first-class object (severity
// pill, timestamp, trace ref) and single-clicks to its trace where one exists.

const KIND_LABEL: Record<Incident["kind"], string> = {
  execution: "Execution",
  pipeline: "Pipeline",
  guardrail: "Guardrail",
  cost: "Cost",
  manual: "Manual",
  runaway: "Runaway",
};

function IncidentCard({ n }: { n: Incident }) {
  const navigate = useNavigate();
  const tone = INCIDENT_TONE_VAR[incidentTone(n.kind)];
  const hasTrace = Boolean(n.traceId);
  const open = () => {
    if (n.traceId) navigate({ to: "/traces/$traceId", params: { traceId: n.traceId } });
  };

  return (
    <article
      role={hasTrace ? "button" : undefined}
      tabIndex={hasTrace ? 0 : undefined}
      aria-label={hasTrace ? `Open trace for: ${n.title}` : undefined}
      onClick={hasTrace ? open : undefined}
      onKeyDown={
        hasTrace
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
      className={hasTrace ? "loom-press" : undefined}
      style={{
        padding: "14px 16px",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        background: "var(--card)",
        cursor: hasTrace ? "pointer" : "default",
        outline: "none",
        transitionProperty: "background-color",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
      onMouseEnter={(e) => {
        if (hasTrace) e.currentTarget.style.background = "var(--raised)";
      }}
      onMouseLeave={(e) => {
        if (hasTrace) e.currentTarget.style.background = "var(--card)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          className="uppercase"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "0.08em",
            color: tone,
            border: "1px solid var(--hairline)",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          <span
            aria-hidden
            style={{ width: 6, height: 6, borderRadius: 999, background: tone, flexShrink: 0 }}
          />
          {KIND_LABEL[n.kind]}
        </span>
        {n.kind === "cost" ? (
          <CostIncidentBadge amountUsd={n.amountUsd} windowKind={n.windowKind} />
        ) : null}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
          {n.at ? (
            <span
              className="tabular-nums"
              title={new Date(n.at).toLocaleString()}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9.5,
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
              }}
            >
              {relTimeCaps(n.at)}
            </span>
          ) : null}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9.5,
              letterSpacing: "0.06em",
              color: "var(--text-faint)",
            }}
          >
            {incidentTraceRef(n.id)}
          </span>
        </span>
      </div>
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: "var(--text-primary)",
          marginTop: 8,
        }}
      >
        {n.title}
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "var(--text-body)",
          marginTop: 4,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {n.detail}
      </p>
      {hasTrace ? (
        <span
          className="uppercase"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            marginTop: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            letterSpacing: "0.1em",
            color: "var(--glacier)",
          }}
        >
          Open trace
          <ArrowUpRight size={12} strokeWidth={2} />
        </span>
      ) : null}
    </article>
  );
}

export function IncidentsPanel() {
  const fGet = useServerFn(getIncidents);
  const q = useQuery({ queryKey: ["incidents"], queryFn: () => fGet() });
  const items = q.data?.incidents ?? [];

  if (q.isLoading) {
    return (
      <p
        className="uppercase"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor, 10.5px)",
          letterSpacing: "0.11em",
          color: "var(--text-subtle)",
          padding: "24px 0",
        }}
      >
        Reading the record
      </p>
    );
  }

  // An error may never wear an empty state's clothes (LOOM §9b): a failed read
  // says so and offers one retry, never the calm "no incidents" slate.
  if (q.isError) {
    return (
      <div style={{ padding: "20px 0" }}>
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--madder)",
            marginBottom: 10,
          }}
        >
          <AlertTriangle size={15} strokeWidth={1.9} />
          The incidents record did not load. {(q.error as Error)?.message}
        </p>
        <button
          type="button"
          className="uppercase cursor-pointer"
          onClick={() => void q.refetch()}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor, 10.5px)",
            letterSpacing: "0.11em",
            color: "var(--glacier)",
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          RETRY
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "32px 24px",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          background: "var(--card)",
          textAlign: "center",
        }}
      >
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor, 10.5px)",
            letterSpacing: "0.11em",
            color: "var(--moss-bright)",
          }}
        >
          All clear
        </span>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-subtle)",
            marginTop: 8,
            maxWidth: 460,
            marginInline: "auto",
            lineHeight: 1.5,
          }}
        >
          Nothing has gone wrong recently. Failed tool calls, pipeline errors, guardrail blocks, cost
          breaches, and spinning missions land here, newest first, each linked to its trace.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((n) => (
        <IncidentCard key={n.id} n={n} />
      ))}
    </div>
  );
}
