import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getImpactLedger, type ImpactLedgerResult } from "@/lib/pm-impact.functions";
import { Button, MonoLabel } from "@/components/obsidian/primitives";

// OBS-08 — the Brain stat trio + "Export my record". Reuses getImpactLedger
// (already backing /impact) read-only; no server-fn change. The prototype's
// illustrative "$214k SAVED BY KILLS" third cell has no matching ledger
// field, so the real iceShiftTotal renders instead (OBS-08.md §5 step 4 +
// §13 risk note: never fabricate a dollar figure).

export type BrainStatCell = { value: string; label: string };

export type BrainStats =
  | { hasRecord: false }
  | { hasRecord: true; cells: BrainStatCell[]; markdown: string | null };

/** PURE — the ledger -> stat-cell mapping. No dashboard/dollar fabrication;
 * the VALIDATED cell is omitted entirely when hitRate is null; the export
 * control is present only when markdown is non-empty (never a dead control). */
export function deriveBrainStats(result: ImpactLedgerResult): BrainStats {
  const { ledger, markdown } = result;
  const hasRecord = ledger.decisionsTotal > 0 || ledger.measuredOutcomes > 0;
  if (!hasRecord) return { hasRecord: false };

  const cells: BrainStatCell[] = [{ value: String(ledger.decisionsTotal), label: "CALLS MADE" }];
  if (ledger.outcomes.hitRate != null) {
    cells.push({ value: `${Math.round(ledger.outcomes.hitRate * 100)}%`, label: "VALIDATED" });
  }
  cells.push({
    value: `${ledger.iceShiftTotal >= 0 ? "+" : ""}${ledger.iceShiftTotal}`,
    label: "ICE MOVED",
  });

  return { hasRecord: true, cells, markdown: markdown || null };
}

function StatCell({ value, label }: BrainStatCell) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 450,
          fontSize: 24,
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <MonoLabel style={{ fontSize: "var(--text-mono-micro)", marginTop: 4 }}>{label}</MonoLabel>
    </div>
  );
}

function download(markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "decision-record.md";
  a.click();
  URL.revokeObjectURL(url);
}

export function BrainStatTrio() {
  const fGet = useServerFn(getImpactLedger);
  const q = useQuery({ queryKey: ["impact-ledger", ""], queryFn: () => fGet({ data: {} }) });

  // No-filler law: nothing paints until the query resolves.
  if (!q.data) return null;

  const stats = deriveBrainStats(q.data);

  if (!stats.hasRecord) {
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid rgba(127,191,142,0.3)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
          marginBottom: 18,
        }}
      >
        <p
          style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-body)", margin: "0 0 12px" }}
        >
          Your track record starts with the first call. Answer one on Today.
        </p>
        <Link
          to="/today"
          style={{
            fontSize: 12.5,
            color: "var(--text-subtle)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
          }}
          className="hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        >
          Go to Today →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end" style={{ gap: 32, marginBottom: 18 }}>
      {stats.cells.map((c) => (
        <StatCell key={c.label} value={c.value} label={c.label} />
      ))}
      <span className="flex-1" />
      {stats.markdown ? (
        <div className="flex flex-col items-end" style={{ gap: 4 }}>
          <Button variant="secondary" onClick={() => download(stats.markdown as string)}>
            Export my record
          </Button>
          <span style={{ fontSize: 11.5, color: "var(--text-subtle)" }}>
            Downloads a cited markdown record · nothing leaves your workspace
          </span>
        </div>
      ) : null}
    </div>
  );
}
