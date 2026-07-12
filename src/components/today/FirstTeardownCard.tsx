// The pinned "Your first teardown" card (2026-07-11 revamp): the wedge's
// first artifact stays at the TOP of the judgment lane regardless of verdict
// until the human answers it. The server fix in today.functions.ts surfaces
// ANY verdict (the old revise/kill filter silently dropped clean 'ship'
// verdicts, so a first teardown that passed never appeared). Verdict word,
// top risk, confidence bar, then two verbs: Keep (moves it to Now on the
// roadmap) and Share (the public /t/$slug flow, reused verbatim from
// WedgeTeardown's ShareTeardownButton).
import * as React from "react";
import type { NeedsYou } from "@/lib/today.functions";
import { ShareTeardownButton } from "@/components/today/WedgeTeardown";

type Teardown = NonNullable<NeedsYou["firstTeardown"]>;

const VERDICT_META: Record<string, { label: string; color: string; line: string }> = {
  ship: {
    label: "Ship",
    color: "var(--moss)",
    line: "The bet holds up. The risks are bounded, not blocking.",
  },
  revise: {
    label: "Revise",
    color: "var(--ember)",
    line: "Worth pursuing, but not as framed.",
  },
  kill: {
    label: "Kill",
    color: "var(--madder)",
    line: "The Critic would not build this as it stands.",
  },
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

export function FirstTeardownCard({
  teardown,
  onKeep,
  deciding,
}: {
  teardown: Teardown;
  /** Keep = the same call as an opportunity's approve: it moves to Now. */
  onKeep: () => void;
  /** True while any queue decision is in flight; the Keep verb waits. */
  deciding?: boolean;
}) {
  const v = VERDICT_META[teardown.verdict] ?? VERDICT_META.revise;
  const pct =
    teardown.confidence != null
      ? Math.round(Math.min(1, Math.max(0, teardown.confidence)) * 100)
      : null;
  return (
    <section
      aria-label="Your first teardown"
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        boxShadow: "var(--top-light)",
      }}
    >
      <div className="flex items-baseline" style={{ gap: 10, marginBottom: 6, minWidth: 0 }}>
        <span style={{ ...mono, color: "var(--ember-text)", flexShrink: 0 }}>
          Your first teardown
        </span>
        <span style={{ ...mono, color: v.color, flexShrink: 0 }} aria-label={`Verdict: ${v.label}`}>
          {v.label}
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
      </div>
      <h3
        className="min-w-0 truncate"
        style={{
          fontSize: 14.5,
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: "0 0 4px",
          lineHeight: 1.4,
        }}
      >
        {teardown.title}
      </h3>
      {teardown.summary ? (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-body)",
            lineHeight: 1.55,
            margin: "0 0 8px",
            maxWidth: "64ch",
          }}
        >
          {teardown.summary}
        </p>
      ) : (
        <p style={{ fontSize: 12.5, color: "var(--text-body)", margin: "0 0 8px" }}>{v.line}</p>
      )}
      {teardown.topRisk ? (
        <div className="flex items-baseline" style={{ gap: 8, marginBottom: 10, minWidth: 0 }}>
          <span style={{ ...mono, fontSize: 9.5, color: "var(--text-subtle)", flexShrink: 0 }}>
            Risk
          </span>
          <span
            className="min-w-0 flex-1 truncate"
            style={{ fontSize: 12.5, color: "var(--text-muted)" }}
          >
            {teardown.topRisk}
          </span>
        </div>
      ) : null}
      {pct != null ? (
        <div className="flex items-center" style={{ gap: 10, marginBottom: 12 }}>
          <div
            role="meter"
            aria-label="Critic confidence"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              flex: 1,
              maxWidth: 220,
              height: 3,
              background: "var(--hairline)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "var(--text-faint)",
                borderRadius: 99,
              }}
            />
          </div>
          <span style={{ ...mono, fontSize: 9.5, color: "var(--text-subtle)" }}>
            Confidence {pct}%
          </span>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
        <button
          type="button"
          onClick={onKeep}
          disabled={deciding}
          // Color/background ride the class so the hover variants win over
          // inline styles.
          className="loom-press outline-none transition-colors [color:var(--text-muted)] [background-color:transparent] hover:[color:var(--text-body)] hover:[background-color:var(--surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)] disabled:cursor-default disabled:opacity-55"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 32,
            padding: "0 12px",
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            fontWeight: 500,
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            cursor: deciding ? "default" : "pointer",
          }}
          title="Keep it: this opportunity moves to Now on the roadmap"
        >
          {deciding ? "Keeping…" : "Keep"}
        </button>
        <ShareTeardownButton id={teardown.id} />
      </div>
    </section>
  );
}
