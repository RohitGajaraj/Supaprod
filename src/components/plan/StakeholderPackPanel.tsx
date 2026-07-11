import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/obsidian";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStakeholderPack } from "@/lib/stakeholder-pack.functions";
import type { PackAudience } from "@/lib/stakeholder-pack";
import { decisionOptionLabel } from "./format";

const AUDIENCE_TABS: { id: PackAudience; label: string }[] = [
  { id: "exec", label: "EXECUTIVE" },
  { id: "eng", label: "ENGINEERING" },
  { id: "board", label: "BOARD" },
];

/**
 * OBS-10: /stakeholder folded into Plan. Same decision picker, audience
 * tabs, copy/download, and rendered pack as the legacy page, restyled to
 * the Obsidian v3 vocabulary already established in this file's siblings
 * (SpecList/RoadmapColumns loading/error/empty shapes, RoomDetail's
 * underline tablist for the 3-way switch).
 */
export function StakeholderPackPanel() {
  const [decisionId, setDecisionId] = useState<string | undefined>(undefined);
  const [audience, setAudience] = useState<PackAudience>("exec");
  const [copied, setCopied] = useState(false);

  const fGet = useServerFn(getStakeholderPack);
  const query = useQuery({
    queryKey: ["stakeholder-pack", decisionId ?? "default"],
    queryFn: () => fGet({ data: { decisionId } }),
  });

  const decisions = query.data?.decisions ?? [];
  const selected = query.data?.selected ?? null;
  const rendered = selected ? selected.packs[audience] : null;
  const markdown = rendered?.markdown ?? "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; the rendered pack below is still selectable */
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stakeholder-${audience}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (query.isPending) {
    return (
      <div role="status" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="sr-only">Building the stakeholder pack…</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              height: 44,
              borderRadius: "var(--radius-control)",
              border: "1px solid var(--hairline)",
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        style={{
          padding: 24,
          background: "var(--surface-card-deep)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--madder)" }}>
          COULDN'T LOAD STAKEHOLDER PACK
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
          {(query.error as Error)?.message}
        </p>
        <button
          type="button"
          onClick={() => query.refetch()}
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-body)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry · reloads the pack
        </button>
      </div>
    );
  }

  if (!selected) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-panel)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          No decisions on record yet. Make a few calls in the loop and they will show up here, ready
          to pack.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="stakeholder-decision"
        style={{
          display: "block",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-label)",
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "var(--text-subtle)",
          marginBottom: 8,
        }}
      >
        Decision
      </label>
      <Select value={selected.decisionId} onValueChange={(v) => setDecisionId(v)}>
        <SelectTrigger
          id="stakeholder-decision"
          aria-label="Decision"
          style={{ marginBottom: 20, height: 40 }}
        >
          <SelectValue placeholder="Pick a decision" />
        </SelectTrigger>
        <SelectContent>
          {decisions.map((d) => (
            <SelectItem key={d.id} value={d.id} title={d.title}>
              {decisionOptionLabel(d.title)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 20, borderBottom: "1px solid var(--hairline)" }}
      >
        <div role="tablist" className="flex" style={{ gap: 20 }}>
          {AUDIENCE_TABS.map((tab) => {
            const active = tab.id === audience;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setAudience(tab.id)}
                className={`loom-press ${active ? "" : "hover:[color:var(--text-body)]"}`}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--text-primary)" : "var(--text-subtle)",
                  paddingBottom: 8,
                  borderBottom: active ? "2px solid var(--text-primary)" : "2px solid transparent",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tab.label}
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

      {rendered ? (
        <div
          className="material-medium"
          style={{
            padding: "22px 24px",
          }}
        >
          {rendered.pack.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {s.heading}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-body)" }}>
                {s.body}
              </div>
            </div>
          ))}
          <div
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              borderTop: "1px solid var(--hairline)",
              paddingTop: 10,
            }}
          >
            {rendered.pack.footer}
          </div>
        </div>
      ) : null}
    </div>
  );
}
