import type { StudioRunDetail } from "@/lib/studio.functions";
import { MonoLabel } from "@/components/cadence/Primitives";
import { StatusChip, LOOM_CARD } from "./studio-ui";
import { fmtCost } from "./studio-format";
import { EmptyState } from "@/components/cadence/EmptyState";

/** Cost tab — per-run model, status, tokens, and cost, with the session total. */
export function CostPanel({ runs, total }: { runs: StudioRunDetail[]; total: number }) {
  if (runs.length === 0) {
    return (
      <EmptyState
        headline="No runs yet"
        body="So nothing spent."
      />
    );
  }
  return (
    <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
      <MonoLabel>Spend by run</MonoLabel>
      <div style={{ marginTop: 8 }}>
        {runs.map((r, i) => (
          <div
            key={r.run_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: i < runs.length - 1 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <span
              className="mono-label tabular-nums"
              style={{ width: 18, textAlign: "right", flexShrink: 0 }}
            >
              {i + 1}
            </span>
            <span
              className="truncate"
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-label-12)",
                color: "var(--text-body)",
              }}
            >
              {r.model ?? "default model"}
            </span>
            <StatusChip status={r.status} />
            <span
              className="tabular-nums"
              style={{
                width: 84,
                textAlign: "right",
                flexShrink: 0,
                fontSize: "var(--text-label-12)",
                color: "var(--text-body)",
              }}
            >
              {r.tokens.toLocaleString()} tok
            </span>
            <span
              className="tabular-nums"
              style={{
                width: 64,
                textAlign: "right",
                flexShrink: 0,
                fontSize: "var(--text-label-12)",
                color: "var(--text-primary)",
              }}
            >
              {fmtCost(r.cost_usd)}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginTop: 2,
          paddingTop: 10,
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <MonoLabel>Session total</MonoLabel>
        <span
          className="tabular-nums"
          style={{ fontSize: "var(--text-label-13)", fontWeight: 600, color: "var(--text-primary)" }}
        >
          {fmtCost(total)}
        </span>
      </div>
    </div>
  );
}
