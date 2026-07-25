import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getValueReceipts } from "@/lib/value-receipts.functions";

// RPT-33: the value-receipts attribution meter. Two counts Supaprod can
// actually stand behind - decisions closed, PRs shipped - never a
// fabricated "hours saved" figure. That third number needs a real,
// defensible methodology before it ships; this card names that honestly
// rather than inventing a plausible-looking estimate.
function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div className="tabular-nums" style={{ fontWeight: 600, lineHeight: 1 }}>
        {value}
      </div>
      <div className="mono-label" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
    </div>
  );
}

export function ValueReceiptsCard() {
  const fValueReceipts = useServerFn(getValueReceipts);
  const { data, isLoading } = useQuery({
    queryKey: ["value-receipts"],
    queryFn: () => fValueReceipts(),
  });

  return (
    <div className="material-medium" style={{ padding: 24, maxWidth: 640, marginTop: 16 }}>
      <div className="mono-label">Value delivered</div>
      <p
        className="text-copy-13"
        style={{ color: "var(--ink-muted)", marginTop: 8, maxWidth: 520 }}
      >
        What this workspace has actually closed out with Supaprod, counted straight from the ledger -
        never estimated.
      </p>
      {isLoading ? (
        <p className="text-label-13" style={{ color: "var(--ink-faint)", marginTop: 16 }}>
          Loading
        </p>
      ) : (
        <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
          <Stat value={data?.decisionsClosed ?? 0} label="Decisions closed" />
          <Stat value={data?.prsShipped ?? 0} label="PRs shipped" />
        </div>
      )}
    </div>
  );
}
