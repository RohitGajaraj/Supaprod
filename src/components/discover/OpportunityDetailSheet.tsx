import { Copy, GitBranch } from "lucide-react";
import type { ReactNode } from "react";
import { Button, MonoLabel, VerdictChip } from "@/components/obsidian";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import type { CriticReview } from "@/lib/discovery.functions";
import { relTimeCaps, traceRef, type VerdictWord } from "./format";
import {
  OPPORTUNITY_STATUSES,
  STATUS_META,
  StatusPill,
  statusLabel,
  type OpportunityStatus,
} from "./OpportunityRow";

/** The real opportunity columns the sheet reads. Never fabricated: every
 * field maps to an `opportunities` row column. */
export interface OpportunityDetailRecord {
  id: string;
  title: string;
  problem: string;
  hypothesis: string | null;
  target_user: string | null;
  impact: number;
  confidence: number;
  ease: number;
  ice_score: number | null;
  critic_review: CriticReview | null;
  status: string;
  theme_id: string | null;
  created_at: string;
  updated_at: string;
}

/** A label/value block, mirroring the SignalRecord field style: a quiet
 * mono-caps label over a readable body value. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: "5px" }}>
      <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
        {label}
      </MonoLabel>
      <p
        style={{
          fontSize: "var(--text-base)",
          lineHeight: 1.6,
          color: "var(--text-body)",
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/** One ICE component as a small stat cell (number over label). */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-control)",
        padding: "10px 8px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "19px",
          fontWeight: 460,
          color: "var(--text-primary)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          letterSpacing: "0.1em",
          color: "var(--text-subtle)",
          marginTop: "5px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section style={{ display: "grid", gap: "9px" }}>
      <MonoLabel style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}>
        {heading}
      </MonoLabel>
      {children}
    </section>
  );
}

/** An absolute date plus a quiet relative caption, so the reader sees both
 * exactly when and how long ago. */
function TimeLine({ iso }: { iso: string }) {
  return (
    <span
      className="flex items-baseline"
      style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
    >
      <span>{new Date(iso).toLocaleString()}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
        }}
      >
        {relTimeCaps(iso)}
      </span>
    </span>
  );
}

export interface OpportunityDetailSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  opportunity: OpportunityDetailRecord | null;
  verdict: VerdictWord;
  onChallenge: () => void;
  onDraftSpec: () => void;
  onViewLineage: () => void;
  onSetStatus: (status: OpportunityStatus) => void;
  onDelete: () => void;
}

/**
 * One ranked bet in full, in the same right-side Sheet language as the signal
 * record and the lineage drawer. It answers "what is this bet, where did it
 * come from, when did it move, and what does the Critic think" from real
 * columns only, and carries the same actions as the row so the operator can
 * decide in place. Honest empty states: no fabricated lineage or Critic take.
 */
export function OpportunityDetailSheet({
  open,
  onOpenChange,
  opportunity,
  verdict,
  onChallenge,
  onDraftSpec,
  onViewLineage,
  onSetStatus,
  onDelete,
}: OpportunityDetailSheetProps) {
  const copyTraceId = () => {
    if (!opportunity) return;
    void navigator.clipboard?.writeText(opportunity.id);
    toast("Trace id copied");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{ fontFamily: "var(--font-ui)", color: "var(--text-primary)" }}>
            {opportunity?.title ?? "Opportunity"}
          </SheetTitle>
          <SheetDescription style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
            One ranked bet in full: where it came from, its ICE, and the Critic's take.
          </SheetDescription>
        </SheetHeader>

        {opportunity ? (
          <div className="mt-3" style={{ display: "grid", gap: "16px" }}>
            {/* Header meta: status + quick move, and the copyable trace ref. */}
            <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
              <StatusPill status={opportunity.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="loom-press"
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "11.5px",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      background: "transparent",
                      border: "1px solid var(--hairline-strong)",
                      borderRadius: "var(--radius-control)",
                      padding: "3px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Move to
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {OPPORTUNITY_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => onSetStatus(s)}>
                      {STATUS_META[s].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={copyTraceId}
                aria-label="Copy trace id"
                title="Copy the full trace id"
                className="loom-press flex items-center hover:[color:var(--text-primary)]"
                style={{
                  marginLeft: "auto",
                  gap: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: "var(--text-subtle)",
                  background: "var(--card)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "999px",
                  padding: "3px 9px",
                  cursor: "pointer",
                }}
              >
                OPP·{traceRef(opportunity.id)}
                <Copy className="h-3 w-3" />
              </button>
            </div>

            {/* Provenance: honest, from theme_id only. */}
            <Section heading="Where it came from">
              {opportunity.theme_id ? (
                <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
                  <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                    Promoted from a Discover theme.
                  </span>
                  <button
                    type="button"
                    onClick={onViewLineage}
                    className="loom-press flex items-center hover:[color:var(--text-primary)]"
                    style={{
                      gap: "6px",
                      fontSize: "12px",
                      color: "var(--glacier)",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    View lineage
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                  Promoted directly.
                </span>
              )}
            </Section>

            {/* Activity: when it was promoted and last changed. */}
            <Section heading="Activity">
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Promoted</span>
                  <TimeLine iso={opportunity.created_at} />
                </div>
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Last updated</span>
                  <TimeLine iso={opportunity.updated_at} />
                </div>
              </div>
            </Section>

            {/* The bet itself: real fields, blanks skipped. */}
            {opportunity.problem ? <Field label="Problem" value={opportunity.problem} /> : null}
            {opportunity.hypothesis ? (
              <Field label="Hypothesis" value={opportunity.hypothesis} />
            ) : null}
            {opportunity.target_user ? (
              <Field label="Target user" value={opportunity.target_user} />
            ) : null}

            {/* ICE breakdown. */}
            <Section heading="ICE">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                <Stat label="IMPACT" value={String(opportunity.impact)} />
                <Stat label="CONFIDENCE" value={String(opportunity.confidence)} />
                <Stat label="EASE" value={String(opportunity.ease)} />
                <Stat
                  label="SCORE"
                  value={opportunity.ice_score != null ? opportunity.ice_score.toFixed(1) : "-"}
                />
              </div>
            </Section>

            {/* Critic: verdict + summary if present, honest empty otherwise. */}
            <Section heading="Critic">
              <div style={{ display: "grid", gap: "9px" }}>
                <VerdictChip tone={verdict} style={{ justifySelf: "start" }} />
                {opportunity.critic_review?.summary ? (
                  <p
                    style={{
                      fontSize: "12.5px",
                      lineHeight: 1.6,
                      color: "var(--text-body)",
                      margin: 0,
                    }}
                  >
                    {opportunity.critic_review.summary}
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-subtle)",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    Not yet reviewed by the Critic. Challenge it below to get an evidence-backed
                    teardown.
                  </p>
                )}
              </div>
            </Section>

            {/* Actions, mirroring the row. */}
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: "10px",
                paddingTop: "6px",
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <Button variant="primary" size="sm" onClick={onDraftSpec}>
                Draft spec
              </Button>
              <Button variant="secondary" size="sm" onClick={onChallenge}>
                Challenge with the Critic
              </Button>
              <Button
                variant="tertiary"
                size="sm"
                onClick={onDelete}
                style={{ marginLeft: "auto", color: "var(--madder)" }}
              >
                Delete
              </Button>
            </div>

            <span className="sr-only">Current stage: {statusLabel(opportunity.status)}</span>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
