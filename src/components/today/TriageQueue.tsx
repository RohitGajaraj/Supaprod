// Loom W2-TODAY (DESIGN-LOOM §8b) — the triage-grouped calls queue.
//
// Never a flat wall of cards: each family renders its top call in full and
// folds the rest behind a quiet "N more" inline expander (one click, no
// navigation). The single highest-stakes call — the first card of the first
// non-empty group — is the screen's featured Call and carries the one solid
// ember CTA (§3). Answering advances naturally: the mutation invalidates the
// queue and the next call takes the top slot.
import * as React from "react";
import { CallCard, type CallCardProps } from "@/components/obsidian/callcard";
import { FAMILY_LABEL, type CallFamily } from "./triage";

export interface QueueCall {
  id: string;
  props: Omit<CallCardProps, "featured" | "compact">;
}

export interface QueueGroup {
  family: CallFamily;
  calls: QueueCall[];
  /** Server-side truth for the group's count chip (R2-ATTENTION #1). The
   *  fetched cards may be capped; the chip never understates. */
  total?: number;
}

/** An expired gate row for the quiet end-of-queue group (R2-ATTENTION #2). */
export interface ExpiredCall {
  id: string;
  /** Outcome-named headline (same template as live gates). */
  headline: string;
  /** Raw tool slug — mono metadata, never the headline. */
  tool: string;
  /** e.g. "expired 3h ago"; empty when unknown. */
  agoLabel: string;
  onRun: () => void;
  onDismiss: () => void;
}

const monoBtn: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  background: "transparent",
  border: "none",
  padding: "2px 0",
  cursor: "pointer",
};

export function TriageQueue({
  groups,
  expired,
}: {
  groups: QueueGroup[];
  /** Expired gates: out of the live count, collapsed at the queue's end. */
  expired?: { total: number; calls: ExpiredCall[] };
}) {
  const [expanded, setExpanded] = React.useState<Partial<Record<CallFamily, boolean>>>({});
  const [expiredOpen, setExpiredOpen] = React.useState(false);
  const nonEmpty = groups.filter((g) => g.calls.length > 0);
  const featuredFamily = nonEmpty[0]?.family;

  return (
    <div className="flex flex-col" style={{ gap: 18 }}>
      {nonEmpty.map((group) => {
        const [top, ...rest] = group.calls;
        const isOpen = Boolean(expanded[group.family]);
        return (
          <section key={group.family} aria-label={FAMILY_LABEL[group.family]}>
            <div className="flex items-baseline" style={{ gap: 8, marginBottom: 8 }}>
              <h2
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
                {FAMILY_LABEL[group.family]}
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color:
                    group.family === featuredFamily ? "var(--ember-text)" : "var(--text-subtle)",
                }}
              >
                · {group.total ?? group.calls.length}
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {/* Loom §2b: the featured (top) call carries the fading hairline,
                  the light catching its top edge. One per screen. */}
              <CallCard
                {...top.props}
                featured={group.family === featuredFamily}
                className={group.family === featuredFamily ? "loom-hairline-fade" : undefined}
              />
              {rest.length > 0 && !isOpen ? (
                <button
                  type="button"
                  className="loom-press w-full text-left outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                  onClick={() => setExpanded((e) => ({ ...e, [group.family]: true }))}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    background: "transparent",
                    border: "1px dashed var(--hairline-strong)",
                    borderRadius: "var(--radius-card)",
                    padding: "9px 14px",
                  }}
                >
                  {rest.length} more →
                </button>
              ) : null}
              {isOpen ? (
                <>
                  {rest.map((call) => (
                    <CallCard key={call.id} {...call.props} compact />
                  ))}
                  <button
                    type="button"
                    className="loom-press self-start outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                    onClick={() => setExpanded((e) => ({ ...e, [group.family]: false }))}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      background: "transparent",
                      border: "none",
                      padding: "2px 0",
                    }}
                  >
                    Show fewer
                  </button>
                </>
              ) : null}
            </div>
          </section>
        );
      })}

      {/* R2-ATTENTION #2: expired gates left the live queue. They sit here,
          quiet and collapsed, with honest affordances: resolveApproval still
          accepts an expired row, so Run it now executes the gated tool and
          Dismiss closes the call. Neither is a dead button. */}
      {expired && expired.total > 0 ? (
        <section aria-label="Expired calls">
          {!expiredOpen ? (
            <button
              type="button"
              className="loom-press w-full text-left outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              onClick={() => setExpiredOpen(true)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-subtle)",
                background: "transparent",
                border: "1px dashed var(--hairline)",
                borderRadius: "var(--radius-card)",
                padding: "9px 14px",
              }}
            >
              Expired · {expired.total} →
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
                <h2
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
                </h2>
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
                      className="loom-press outline-none transition-colors hover:[color:#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      onClick={call.onRun}
                      style={{ ...monoBtn, color: "var(--glacier)" }}
                    >
                      Run it now
                    </button>
                    <button
                      type="button"
                      className="loom-press outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                      onClick={call.onDismiss}
                      style={{ ...monoBtn, color: "var(--text-muted)" }}
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
                className="loom-press self-start outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                onClick={() => setExpiredOpen(false)}
                style={{ ...monoBtn, color: "var(--text-muted)" }}
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
