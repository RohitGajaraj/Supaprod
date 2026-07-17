// PC-32 block 3 — the judgment lane: ONE flat queue answering "what needs me
// right now?". The featured call renders in full; at most two more entries
// (calls first, then pushed Brain insights, which are the same job) sit
// beneath it; everything else folds behind a single "N more" door. Pushed
// insights finally show WHO pushed them (the payload always carried the
// agent slug; the old lane never rendered it).
import * as React from "react";
import { CallCard } from "@/components/obsidian/callcard";
import type { QueueCall, ExpiredCall } from "./TriageQueue";
import type { PushedInsight } from "@/lib/today-lanes.functions";
import { AgentBadge } from "@/components/agents/AgentMark";
import { PixelStat } from "@/components/cadence/PixelStat";

const VISIBLE_SLOTS = 3;

const INSIGHT_LABEL: Record<string, string> = {
  next_best_action: "Do next",
  hidden_connection: "Hidden pattern",
  cost_of_inaction: "Cost of waiting",
};

// No `color` here: the base color rides the [color:…] class on each button so
// the hover:[color:…] variant can actually win (inline style beats classes).
const linkBtn: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: 12,
  fontWeight: 500,
  background: "transparent",
  border: "none",
  padding: "2px 0",
  cursor: "pointer",
};

function InsightRow({
  insight,
  onAct,
  onOpen,
}: {
  insight: PushedInsight;
  onAct?: (ins: PushedInsight) => void;
  onOpen: () => void;
}) {
  const pushAction = insight.action?.kind && onAct ? insight.action : null;
  const actionLabel = pushAction?.label?.trim() || "Open in Brain";
  const slug = insight.action?.agent_slug ?? null;
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--ember-hairline, var(--hairline))",
        borderRadius: "var(--radius-card)",
        padding: "12px 14px",
        boxShadow: "var(--top-light)",
      }}
    >
      <div className="flex items-center" style={{ gap: 8, marginBottom: 4, minWidth: 0 }}>
        {slug ? (
          <AgentBadge slug={slug} size={18} />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ember-text)",
              flexShrink: 0,
            }}
          >
            {INSIGHT_LABEL[insight.kind] ?? "Insight"}
          </span>
        )}
        <span
          className="min-w-0 flex-1 truncate"
          style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 460 }}
        >
          {insight.headline}
        </span>
      </div>
      {insight.detail ? (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-body)",
            margin: "0 0 10px",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {insight.detail}
        </p>
      ) : null}
      <button
        type="button"
        onClick={pushAction ? () => onAct!(insight) : onOpen}
        // Background/border/color live in classes so the hover variants win
        // (an inline declaration always beats a hover class).
        className="loom-press transition-colors [color:var(--text-muted)] [background-color:transparent] [border-color:var(--hairline-strong)] hover:[background-color:var(--surface-raised)] hover:[border-color:var(--text-faint)]"
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-ui)",
          fontSize: 12,
          fontWeight: 500,
          border: "1px solid",
          borderRadius: "var(--radius-control)",
          padding: "5px 11px",
          cursor: "pointer",
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

type Entry =
  | { kind: "call"; id: string; call: QueueCall }
  | { kind: "insight"; id: string; insight: PushedInsight };

export function JudgmentLane({
  calls,
  insights,
  onInsightAct,
  onInsightOpen,
  expired,
}: {
  /** Flat, consequence-ordered calls (ship gates → build calls → re-examine). */
  calls: QueueCall[];
  insights: PushedInsight[];
  onInsightAct?: (ins: PushedInsight) => void;
  onInsightOpen: () => void;
  expired?: { total: number; calls: ExpiredCall[] };
}) {
  const [open, setOpen] = React.useState(false);
  const [expiredOpen, setExpiredOpen] = React.useState(false);

  const entries: Entry[] = [
    ...calls.map((call): Entry => ({ kind: "call", id: call.id, call })),
    ...insights.map((insight): Entry => ({ kind: "insight", id: insight.id, insight })),
  ];
  const visible = entries.slice(0, VISIBLE_SLOTS);
  const folded = entries.slice(VISIBLE_SLOTS);

  const renderEntry = (e: Entry, featured: boolean) =>
    e.kind === "call" ? (
      <CallCard
        key={e.id}
        {...e.call.props}
        featured={featured}
        compact={!featured}
        className={featured ? "loom-hairline-fade" : undefined}
      />
    ) : (
      <InsightRow key={e.id} insight={e.insight} onAct={onInsightAct} onOpen={onInsightOpen} />
    );

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {visible.map((e, i) => renderEntry(e, i === 0 && e.kind === "call"))}

      {folded.length > 0 && !open ? (
        <button
          type="button"
          aria-expanded={false}
          className="loom-press w-full text-left outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          onClick={() => setOpen(true)}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12,
            fontWeight: 500,
            background: "transparent",
            border: "1px dashed var(--hairline-strong)",
            borderRadius: "var(--radius-card)",
            padding: "9px 14px",
            cursor: "pointer",
          }}
        >
          <PixelStat value={folded.length} tone="blue" size={12} /> more waiting →
        </button>
      ) : null}
      {open ? (
        <>
          {folded.map((e) => renderEntry(e, false))}
          <button
            type="button"
            aria-expanded={true}
            className="loom-press self-start outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            onClick={() => setOpen(false)}
            style={linkBtn}
          >
            Show fewer
          </button>
        </>
      ) : null}

      {/* Expired gates: out of the live queue, one quiet collapsed door.
          resolveApproval still accepts an expired row, so both affordances
          are wired, never decorative. */}
      {expired && expired.total > 0 ? (
        <section aria-label="Expired calls">
          {!expiredOpen ? (
            <button
              type="button"
              aria-expanded={false}
              className="loom-press w-full text-left outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              onClick={() => setExpiredOpen(true)}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                fontWeight: 500,
                background: "transparent",
                border: "1px dashed var(--hairline)",
                borderRadius: "var(--radius-card)",
                padding: "9px 14px",
                cursor: "pointer",
              }}
            >
              Expired without you · {expired.total} →
            </button>
          ) : (
            <div
              className="flex flex-col"
              style={{
                gap: 10,
                border: "1px solid var(--hairline)",
                borderRadius: "var(--radius-card)",
                padding: "12px 14px",
              }}
            >
              <div className="flex items-baseline" style={{ gap: 8 }}>
                <h3
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    fontWeight: 400,
                    letterSpacing: "0.12em",
                    color: "var(--text-subtle)",
                    textTransform: "uppercase",
                    margin: 0,
                  }}
                >
                  Expired · {expired.total}
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  These expired before you answered. Nothing ran.
                </span>
              </div>
              {expired.calls.map((call) => (
                <div
                  key={call.id}
                  className="flex flex-wrap items-baseline justify-between"
                  style={{ gap: 8 }}
                >
                  <div className="min-w-0 flex-1" style={{ minWidth: 220 }}>
                    <div
                      className="truncate"
                      style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}
                    >
                      {call.headline}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        letterSpacing: "0.08em",
                        color: "var(--text-subtle)",
                        textTransform: "uppercase",
                      }}
                    >
                      {call.tool}
                      {call.agoLabel ? ` · ${call.agoLabel}` : ""}
                    </div>
                  </div>
                  <div className="flex items-baseline" style={{ gap: 14, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="loom-press outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                      onClick={call.onRun}
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 12,
                        fontWeight: 500,
                        background: "transparent",
                        border: "1px solid var(--hairline-strong)",
                        borderRadius: "var(--radius-control)",
                        padding: "5px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Run it now
                    </button>
                    <button
                      type="button"
                      className="loom-press outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                      onClick={call.onDismiss}
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: 12,
                        fontWeight: 500,
                        background: "transparent",
                        border: "1px solid var(--hairline-strong)",
                        borderRadius: "var(--radius-control)",
                        padding: "5px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
              {expired.total > expired.calls.length ? (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.08em",
                    color: "var(--text-subtle)",
                    textTransform: "uppercase",
                  }}
                >
                  Showing {expired.calls.length} of {expired.total}
                </div>
              ) : null}
              <button
                type="button"
                aria-expanded={true}
                className="loom-press self-start outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                onClick={() => setExpiredOpen(false)}
                style={linkBtn}
              >
                Hide expired
              </button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
