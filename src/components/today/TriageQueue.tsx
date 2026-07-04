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
}

export function TriageQueue({ groups }: { groups: QueueGroup[] }) {
  const [expanded, setExpanded] = React.useState<Partial<Record<CallFamily, boolean>>>({});
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
                · {group.calls.length}
              </span>
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              <CallCard {...top.props} featured={group.family === featuredFamily} />
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
    </div>
  );
}
