// ImpactLedgerPanel - Brain tab (OBS-10, folds the retired /impact page).
// Reuses getImpactLedger, the same server fn already backing BrainStatTrio's
// always-visible summary strip above the tab row, for the full portable
// record the legacy page rendered: the 4-stat breakdown with sublabels
// (human/agent split, validated/missed counts), the "Standout calls"
// highlights, name customization, copy-to-clipboard + download, and the full
// inline markdown preview. BrainStatTrio stays the condensed strip; this
// panel is the deeper dive, not a duplicate of it.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Download } from "lucide-react";
import { getImpactLedger } from "@/lib/pm-impact.functions";
import { Button, MonoLabel } from "@/components/obsidian/primitives";
import { PanelSkeleton } from "./PanelSkeleton";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "14px 16px",
      }}
    >
      <div
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 450,
          fontSize: 22,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
      <MonoLabel style={{ fontSize: "var(--text-mono-micro)", marginTop: 4 }}>{label}</MonoLabel>
      {sub ? (
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>{sub}</div>
      ) : null}
    </div>
  );
}

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "decision-record.md";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImpactLedgerPanel() {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const fGet = useServerFn(getImpactLedger);
  const query = useQuery({
    queryKey: ["impact-ledger", name.trim()],
    queryFn: () => fGet({ data: { name: name.trim() || undefined } }),
  });

  async function copyMarkdown(markdown: string) {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; the markdown preview below is still selectable */
    }
  }

  if (query.isError) {
    return (
      <Card>
        <MonoLabel style={{ marginBottom: 8 }}>Impact Ledger · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
          {(query.error as Error)?.message ?? "Unknown error"}
        </p>
      </Card>
    );
  }

  if (!query.data) {
    return <PanelSkeleton rows={[52, 96, 180]} />;
  }

  const { ledger, markdown } = query.data;
  const hitRate =
    ledger.outcomes.hitRate !== null ? `${Math.round(ledger.outcomes.hitRate * 100)}%` : "-";
  const iceSign = ledger.iceShiftTotal >= 0 ? "+" : "";

  return (
    <div>
      <p style={{ fontSize: 13.5, color: "var(--text-body)", margin: "0 0 18px", lineHeight: 1.5 }}>
        {ledger.headline}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <StatCard
          value={String(ledger.decisionsTotal)}
          label="Decisions made"
          sub={`${ledger.humanLed} yours · ${ledger.agentLed} agent-led`}
        />
        <StatCard
          value={hitRate}
          label="Hit rate"
          sub={`${ledger.outcomes.validated} validated · ${ledger.outcomes.missed} missed`}
        />
        <StatCard
          value={ledger.measuredOutcomes > 0 ? `${iceSign}${ledger.iceShiftTotal}` : "-"}
          label="Priority impact"
          sub={`net ICE · ${ledger.measuredOutcomes} measured`}
        />
        <StatCard
          value={String(ledger.beliefsRevised)}
          label="Beliefs revised"
          sub="changed your mind on evidence"
        />
      </div>

      {ledger.highlights.length > 0 ? (
        <div style={{ marginBottom: 22 }}>
          <MonoLabel style={{ marginBottom: 8, display: "block" }}>Standout calls</MonoLabel>
          {ledger.highlights.map((h, i) => (
            <div
              key={i}
              style={{
                fontSize: 12.5,
                color: "var(--text-subtle)",
                padding: "8px 0",
                borderTop: i ? "1px solid var(--hairline)" : "none",
              }}
            >
              {h.summary}
              {h.metricLabel && h.metricValue ? (
                <span style={{ color: "var(--text-faint)" }}>
                  {" "}
                  ({h.metricLabel}: {h.metricValue})
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center" style={{ gap: 10, marginBottom: 14 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional, for the record header)"
          className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            flex: 1,
            minWidth: 220,
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
            padding: "7px 11px",
            fontSize: 12.5,
            color: "var(--text-primary)",
          }}
        />
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => copyMarkdown(markdown)}
          aria-label={copied ? "Copied" : "Copy to clipboard"}
          title={copied ? "Copied" : "Copy to clipboard"}
          style={{ padding: "6px 9px" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => downloadMarkdown(markdown)}
          aria-label="Download as Markdown"
          title="Download as Markdown"
          style={{ padding: "6px 9px" }}
        >
          <Download size={14} />
        </Button>
      </div>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text-body)",
          background: "var(--surface-card-deep)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
        }}
      >
        {markdown}
      </pre>
    </div>
  );
}
