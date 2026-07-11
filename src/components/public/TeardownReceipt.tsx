import type { CSSProperties } from "react";
import {
  CheckCircle2,
  PencilRuler,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import type { Teardown, TeardownVerdict } from "@/lib/ai/public-teardown.server";

// RPT-03 receipt. Renders a Teardown as a Critic receipt: the verdict as a
// labeled chip (icon + word, so it is grayscale-safe and never color-only), the
// headline, RISKS and GAPS as two labeled lists, the recommendation, and a
// confidence line. Dark ember Tempo aesthetic; reads under the data-obsidian
// scope its parent page mounts. One honest caption grounds what the Critic did.

const VERDICT_META: Record<TeardownVerdict, { color: string; Icon: typeof CheckCircle2 }> = {
  "worth building": { color: "var(--moss)", Icon: CheckCircle2 },
  "needs work": { color: "var(--marigold)", Icon: PencilRuler },
  "risky as written": { color: "var(--madder)", Icon: ShieldAlert },
};

const sectionLabel: CSSProperties = {
  fontSize: 9,
  color: "var(--text-subtle)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 10,
};

const hairline: CSSProperties = {
  height: 1,
  background: "var(--hairline)",
  margin: "20px 0",
};

function List({
  items,
  Icon,
  tone,
  empty,
}: {
  items: string[];
  Icon: typeof AlertTriangle;
  tone: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--text-subtle)", lineHeight: 1.5 }}>{empty}</p>;
  }
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <Icon size={15} strokeWidth={1.5} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TeardownReceipt({ teardown }: { teardown: Teardown }) {
  const meta = VERDICT_META[teardown.verdict] ?? VERDICT_META["needs work"];
  const { Icon: VerdictIcon, color } = meta;
  const confidencePct = Math.round(teardown.confidence * 100);

  return (
    <div
      className="material-medium fade-up"
      style={{ padding: 24, textAlign: "left", width: "100%" }}
      aria-label="Cadence Critic teardown receipt"
    >
      {/* Receipt header: mono kicker + verdict chip. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div className="mono-label" style={{ fontSize: 9, color: "var(--text-subtle)" }}>
          Cadence Critic · receipt
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            borderRadius: 999,
            border: `1px solid ${color}`,
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
          }}
        >
          <VerdictIcon size={14} strokeWidth={1.75} style={{ color }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              textTransform: "capitalize",
            }}
          >
            {teardown.verdict}
          </span>
        </div>
      </div>

      {/* Headline. */}
      <h2
        style={{
          fontSize: 19,
          lineHeight: 1.35,
          color: "var(--text-primary)",
          margin: "16px 0 0",
          fontWeight: 600,
        }}
      >
        {teardown.headline || "The Critic read your document."}
      </h2>

      <div style={hairline} />

      {/* Risks. */}
      <div className="mono-label" style={sectionLabel}>
        <AlertTriangle size={12} strokeWidth={1.75} />
        Risks
      </div>
      <List
        items={teardown.risks}
        Icon={AlertTriangle}
        tone="var(--madder)"
        empty="No load-bearing risks flagged in what you pasted."
      />

      <div style={hairline} />

      {/* Gaps. */}
      <div className="mono-label" style={sectionLabel}>
        <HelpCircle size={12} strokeWidth={1.75} />
        Gaps
      </div>
      <List
        items={teardown.gaps}
        Icon={HelpCircle}
        tone="var(--marigold)"
        empty="No missing evidence flagged in what you pasted."
      />

      {teardown.recommendation ? (
        <>
          <div style={hairline} />
          <div className="mono-label" style={sectionLabel}>
            <ArrowRight size={12} strokeWidth={1.75} />
            Recommendation
          </div>
          <p style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55 }}>
            {teardown.recommendation}
          </p>
        </>
      ) : null}

      <div style={hairline} />

      {/* Confidence line: label + value + a thin grayscale-safe meter. */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <span className="mono-label" style={{ fontSize: 9, color: "var(--text-subtle)" }}>
          Critic confidence
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 200 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: "var(--hairline)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${confidencePct}%`,
                height: "100%",
                background: "var(--text-body)",
                borderRadius: 999,
              }}
            />
          </div>
          <span
            className="mono-label"
            style={{ fontSize: 10, color: "var(--text-body)", minWidth: 34, textAlign: "right" }}
          >
            {confidencePct}%
          </span>
        </div>
      </div>

      {/* Honest caption: what this receipt is, and what it is not. */}
      <p
        style={{
          fontSize: 11,
          color: "var(--text-subtle)",
          lineHeight: 1.55,
          marginTop: 18,
        }}
      >
        Cadence's Critic read only the text you pasted. No web search, no market data, no memory of
        a workspace. It judges what your words support, nothing more.
      </p>
    </div>
  );
}
