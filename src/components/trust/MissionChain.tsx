/**
 * SW-5 deliverable B - renders a mission's Trust Ledger chain as a vertical
 * walk of the nine links (signal -> ... -> outcome). Missing links are shown,
 * never hidden; the surface never fabricates a link. Per the Obsidian contract
 * this is the machine's own room, so no ember - moss marks a present link,
 * madder marks a real gap, and the faint ink ladder marks skipped / not-yet.
 */

import * as React from "react";
import { traceRef } from "@/components/discover/format";
import type { ChainStep, ChainLinkStatus, MissionChain as MissionChainData } from "@/lib/trust-chain.functions";

const STATUS_DOT: Record<ChainLinkStatus, string> = {
  present: "var(--moss)",
  missing: "var(--madder)",
  skipped: "var(--text-faint)",
  pending: "var(--hairline-strong)",
};

const STATUS_LABEL: Record<ChainLinkStatus, string> = {
  present: "",
  missing: "missing",
  skipped: "skipped",
  pending: "not yet",
};

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

function StepRow({ step, last }: { step: ChainStep; last: boolean }) {
  const dot = STATUS_DOT[step.status];
  const dim = step.status === "pending" || step.status === "skipped";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
      {/* rail: dot + connector */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 14 }}>
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: 99,
            marginTop: 4,
            background: step.status === "present" ? dot : "transparent",
            border: `1.5px solid ${dot}`,
            flexShrink: 0,
          }}
        />
        {!last ? (
          <span
            aria-hidden="true"
            style={{ flex: 1, width: 1, background: "var(--hairline)", marginTop: 2 }}
          />
        ) : null}
      </div>
      {/* body */}
      <div style={{ paddingBottom: last ? 0 : 14, minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 460,
              color: dim ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            {step.label}
          </span>
          {step.status !== "present" ? (
            <span
              style={{
                ...mono,
                color: step.status === "missing" ? "var(--madder)" : "var(--text-faint)",
              }}
            >
              {STATUS_LABEL[step.status]}
            </span>
          ) : null}
          <div style={{ flex: 1 }} />
          {step.occurredAt ? (
            <span style={{ ...mono, color: "var(--text-faint)" }}>{fmtTime(step.occurredAt)}</span>
          ) : null}
          {step.backingId ? (
            <span style={{ ...mono, color: "var(--text-faint)" }}>{traceRef(step.backingId)}</span>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: dim ? "var(--text-faint)" : "var(--text-body)", marginTop: 2 }}>
          {step.detail}
        </div>
      </div>
    </div>
  );
}

export function MissionChain({ chain }: { chain: MissionChainData }) {
  const missingCount = chain.steps.filter((s) => s.status === "missing").length;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "18px 20px",
        boxShadow: "var(--top-light)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
        <h3
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 17,
            fontWeight: 460,
            color: "var(--text-primary)",
            margin: 0,
          }}
          className="min-w-0 flex-1 truncate"
        >
          {chain.missionTitle}
        </h3>
        <span
          style={{
            ...mono,
            fontSize: 10,
            color: chain.unbroken ? "var(--moss)" : "var(--madder)",
          }}
        >
          {chain.unbroken ? "chain unbroken" : `${missingCount} missing`}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {chain.steps.map((s, i) => (
          <StepRow key={s.key} step={s} last={i === chain.steps.length - 1} />
        ))}
      </div>
    </div>
  );
}
