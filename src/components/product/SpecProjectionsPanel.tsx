import { useMemo, useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button, VerdictChip } from "@/components/obsidian";
import type { VerdictTone } from "@/components/obsidian";
import type { OutcomeContract } from "@/lib/discovery.functions";
import {
  composeSpecProjections,
  renderProjectionMarkdown,
  PROJECTION_LABEL,
  type ProjectionSource,
  type SpecProjectionKind,
  type DriftState,
} from "@/lib/spec-projections";

type Props = {
  title: string;
  status: string;
  updatedAt: string;
  contract: OutcomeContract | null | undefined;
  bodyMd?: string;
  citations?: ProjectionSource[] | null;
};

const DRIFT_TONE: Record<DriftState, VerdictTone> = {
  current: "VALIDATED",
  stale: "WATCH",
  "no-contract": "PENDING",
};

const TAB_ORDER: readonly SpecProjectionKind[] = ["prd", "frd", "status", "onepager"];

/**
 * RPT-43: artifacts are projections; the ledger is the source. The PRD, FRD,
 * status update, and one-pager are one-click views generated fresh from this
 * spec's typed Outcome Contract, stamped with a generation date and a
 * drift-state. Deterministic (no server call, no LLM): the projections are a
 * pure function of the contract already loaded on the page. Mirrors the
 * StakeholderPackPanel shape (audience tabs, copy/download, rendered artifact)
 * but projects from the contract spine rather than a decision.
 */
export function SpecProjectionsPanel({
  title,
  status,
  updatedAt,
  contract,
  bodyMd,
  citations,
}: Props) {
  const [active, setActive] = useState<SpecProjectionKind>("prd");
  const [copied, setCopied] = useState(false);
  // RPT-43: pin the generation timestamp once per mount so the "Generated"
  // stamp stays stable across renders that do not change contract content
  // (e.g. live body edits when this panel is fed the editor's body state).
  const [generatedAt] = useState(() => new Date().toISOString());

  // Deterministic: composed purely from the contract already on the page.
  // Re-stamped only when an input actually changes, so switching tabs never
  // moves the generation date.
  const set = useMemo(
    () =>
      composeSpecProjections(
        {
          title,
          status,
          updatedAt,
          contract: contract ?? null,
          bodyMd,
          citations: citations ?? null,
        },
        generatedAt,
      ),
    [title, status, updatedAt, contract, bodyMd, citations, generatedAt],
  );

  const current = set.projections.find((p) => p.kind === active) ?? set.projections[0] ?? null;
  const markdown = current
    ? renderProjectionMarkdown(current, { generatedOn: set.generatedOn, drift: set.drift })
    : "";

  async function copy() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; the rendered projection below is still selectable */
    }
  }

  function download() {
    if (!current) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spec-${current.kind}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const stamp = (
    <div className="flex items-center" style={{ gap: 10, flexWrap: "wrap" }}>
      <VerdictChip tone={DRIFT_TONE[set.drift.state]}>{set.drift.label}</VerdictChip>
      <span style={{ color: "var(--text-muted)" }}>Generated {set.generatedOn}</span>
    </div>
  );

  // No contract to project from: nothing is fabricated. Point to the Contract
  // tab, where drafting the Outcome Contract makes these views appear.
  if (set.projections.length === 0) {
    return (
      <div
        style={{
          padding: "var(--geist-gap-section)",
          textAlign: "center",
          background: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-panel)",
          boxShadow: "var(--top-light)",
        }}
      >
        <p style={{ color: "var(--text-body)", margin: "0 0 8px" }}>
          No Outcome Contract yet, so there is nothing to project.
        </p>
        <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Draft one on the Contract tab. The PRD, FRD, status, and one-pager then generate from that
          typed spine automatically, so no document is ever hand-maintained.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        style={{
          color: "var(--text-muted)",
          lineHeight: 1.6,
          margin: "0 0 16px",
          maxWidth: "68ch",
        }}
      >
        Every view below is generated fresh from this spec's Outcome Contract. Nothing here is
        hand-maintained. Competitors generate documents; Supaprod deprecates documents into views.
      </p>

      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 16, borderBottom: "1px solid var(--hairline)", flexWrap: "wrap" }}
      >
        <div role="tablist" aria-label="Projection views" className="flex" style={{ gap: 18 }}>
          {TAB_ORDER.map((kind) => {
            const activeTab = kind === active;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={activeTab}
                onClick={() => setActive(kind)}
                className={`loom-press ${activeTab ? "" : "hover:[color:var(--text-body)]"}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: activeTab ? "var(--text-primary)" : "var(--text-subtle)",
                  paddingBottom: 8,
                  borderBottom: activeTab
                    ? "2px solid var(--text-primary)"
                    : "2px solid transparent",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {PROJECTION_LABEL[kind]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center" style={{ gap: 6, paddingBottom: 8 }}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            title={copied ? "Copied" : "Copy to clipboard"}
            style={{ padding: "6px 9px" }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onClick={download}
            aria-label="Download as Markdown"
            title="Download as Markdown"
            style={{ padding: "6px 9px" }}
          >
            <Download size={14} />
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>{stamp}</div>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 18px" }}>
        {set.drift.detail}
      </p>

      {current ? (
        <div className="material-medium" style={{ padding: "22px 24px" }}>
          {current.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {s.heading}
              </div>
              <div
                style={{
                  lineHeight: 1.6,
                  color: "var(--text-body)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
          {current.sources.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                Sources
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, color: "var(--text-body)" }}>
                {current.sources.map((c, i) => (
                  <li key={i}>{c.label}</li>
                ))}
              </ol>
            </div>
          ) : null}
          <div
            style={{
              color: "var(--text-faint)",
              borderTop: "1px solid var(--hairline)",
              paddingTop: 10,
            }}
          >
            {current.footer}
          </div>
        </div>
      ) : null}
    </div>
  );
}
