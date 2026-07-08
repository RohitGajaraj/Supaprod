import { Copy, GitBranch } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Button, MonoLabel, VerdictChip } from "@/components/obsidian";
import { getOpportunityJudgment } from "@/lib/decision-judgment.functions";
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
import { DetailHeader, DetailSection, StatCell, StatStrip, toneForScore } from "./DetailKit";
import { relTimeCaps, traceRef, type VerdictWord } from "./format";
import { StageTimeline } from "@/components/shared/StageTimeline";
import type { Designation } from "./ranking";
import {
  DESIGNATION_MEANING,
  DesignationTag,
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

/** A label/value block: a quiet mono caps label over a readable body value. */
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

/** SW-7 step-3 oracle: the best bet shows its precedent ("last time we
 * reasoned this way, here is what happened", the same Ambient Precedent
 * recall the decision card uses) and the live queue it was ranked against.
 * Honest empty states - the blocks never fabricate and never hide. */
function OpportunityJudgmentBlocks({ opportunityId }: { opportunityId: string }) {
  const fJudgment = useServerFn(getOpportunityJudgment);
  const q = useQuery({
    queryKey: ["opportunity-judgment", opportunityId],
    queryFn: () => fJudgment({ data: { id: opportunityId } }),
  });

  const precedents = q.data?.precedents ?? [];
  const peers = q.data?.consideredAgainst ?? [];
  const emptyLine: React.CSSProperties = {
    fontSize: "12px",
    color: "var(--text-subtle)",
    fontStyle: "italic",
    margin: 0,
  };

  return (
    <>
      <DetailSection heading="Precedent">
        {q.isPending ? (
          <p style={emptyLine}>Recalling past outcomes…</p>
        ) : precedents.length > 0 ? (
          <div style={{ display: "grid", gap: "8px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-subtle)", margin: 0 }}>
              Last time we reasoned this way, here is what happened.
            </p>
            {precedents.map((p) => (
              <div key={p.memoryId} style={{ display: "grid", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                  {p.verdict.toUpperCase()}
                  {p.title ? ` · ${p.title}` : ""}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-subtle)", lineHeight: 1.5 }}>
                  {p.summary}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={emptyLine}>
            No recorded outcome matches this bet yet. As outcomes land, the Brain recalls them here.
          </p>
        )}
      </DetailSection>

      <DetailSection heading="Considered against">
        {q.isPending ? (
          <p style={emptyLine}>Reading the queue…</p>
        ) : peers.length > 0 ? (
          <div style={{ display: "grid", gap: "6px" }}>
            {peers.map((a) => (
              <div
                key={a.id}
                className="flex items-baseline"
                style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>{a.title}</span>
                {a.ice != null ? (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10.5px",
                      letterSpacing: "0.06em",
                      color: "var(--text-subtle)",
                    }}
                  >
                    {a.ice.toFixed(1)} ICE
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={emptyLine}>Nothing else is live in the queue right now.</p>
        )}
      </DetailSection>
    </>
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
  /** Deterministic-ranking context for this bet (from ranking.ts), all
   * optional: the 1-based queue position, the short rationale, and the
   * recommended next action. Absent members render nothing. */
  rank?: number;
  rationale?: string;
  nextAction?: string;
  /** The system-derived bet designation (from ranking.ts), shown in the
   * priority band with its one-line meaning so a human or an agent reads what
   * the bet is and what to do. Absent renders nothing. */
  designation?: Designation;
}

/**
 * One ranked bet in full, on the shared DetailKit anatomy so it reads as one
 * language with the signal record and every other object detail. It leads with
 * what the operator needs first, the priority (rank, the single best bet, the
 * recommended next action, and the rationale), then the ICE strip, then the
 * supporting sections (where it came from, the bet itself, the Critic's take,
 * and the activity), and closes with the same actions as the row so the
 * operator can decide in place. Honest empty states: no fabricated lineage or
 * Critic take. All existing wiring and handlers are preserved.
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
  rank,
  rationale,
  nextAction,
  designation,
}: OpportunityDetailSheetProps) {
  const copyTraceId = () => {
    if (!opportunity) return;
    void navigator.clipboard?.writeText(opportunity.id);
    toast("Trace id copied");
  };

  const isBestBet = rank === 1;
  // The one-line meaning shown in the band for a non-best designation, so the
  // reader knows what the bet is and what to do about it. Best bet is already
  // communicated by the band's tint + rank + rationale, so it carries none.
  const designationMeaning =
    designation && designation !== "best bet" ? DESIGNATION_MEANING[designation] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {/* Accessible name and description for the dialog; the visible header
            below is the rich DetailHeader, so this stays screen-reader only. */}
        <SheetHeader className="sr-only">
          <SheetTitle>{opportunity?.title ?? "Opportunity"}</SheetTitle>
          <SheetDescription>
            One ranked bet in full: where it came from, its ICE, and the Critic's take.
          </SheetDescription>
        </SheetHeader>

        {opportunity ? (
          <div style={{ display: "grid", gap: "16px", marginTop: "2px" }}>
            <DetailHeader
              title={opportunity.title}
              chips={
                <>
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
                  <VerdictChip tone={verdict} />
                </>
              }
              time={
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9.5px",
                    letterSpacing: "0.06em",
                    color: "var(--text-subtle)",
                  }}
                >
                  UPDATED {relTimeCaps(opportunity.updated_at)}
                </span>
              }
              traceRef={
                <button
                  type="button"
                  onClick={copyTraceId}
                  aria-label="Copy trace id"
                  title="Copy the full trace id"
                  className="loom-press flex items-center hover:[color:var(--text-subtle)]"
                  style={{
                    gap: "6px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    color: "var(--text-faint)",
                    background: "transparent",
                    border: "none",
                    padding: "3px 2px",
                    cursor: "pointer",
                  }}
                >
                  OPP·{traceRef(opportunity.id)}
                  <Copy className="h-3 w-3" />
                </button>
              }
            />

            {/* Priority band: the agent-and-human priority cue, high in the
                view. The queue position, the single best bet, the recommended
                next action, and the rationale. A calm glacier tint marks the
                best bet (never amber or brown); everything else stays quiet.
                Rendered only when threaded in; absent members render nothing. */}
            {rank != null || rationale || nextAction || designation ? (
              <div
                style={{
                  display: "grid",
                  gap: "9px",
                  background: isBestBet
                    ? "color-mix(in srgb, var(--glacier) 8%, transparent)"
                    : "var(--surface-raised)",
                  border: isBestBet
                    ? "1px solid color-mix(in srgb, var(--glacier) 22%, transparent)"
                    : "1px solid var(--hairline)",
                  borderRadius: "var(--radius-card)",
                  padding: "13px 15px",
                }}
              >
                {rank != null || designation ? (
                  <div className="flex flex-wrap items-center" style={{ gap: "8px" }}>
                    {rank != null ? (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "11px",
                          letterSpacing: "0.04em",
                          color: "var(--text-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        Priority #{rank}
                      </span>
                    ) : null}
                    {isBestBet ? (
                      <span
                        title="The single top-ranked bet in the queue"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.02em",
                          color: "var(--pencil-lime)",
                          border:
                            "1px solid color-mix(in srgb, var(--pencil-lime) 30%, var(--hairline))",
                          borderRadius: "999px",
                          padding: "2px 8px",
                          lineHeight: 1.4,
                        }}
                      >
                        Best bet
                      </span>
                    ) : (
                      <DesignationTag designation={designation} />
                    )}
                  </div>
                ) : null}
                {designationMeaning ? (
                  <p
                    style={{
                      fontSize: "12.5px",
                      lineHeight: 1.6,
                      color: "var(--text-body)",
                      margin: 0,
                    }}
                  >
                    {designationMeaning}
                  </p>
                ) : null}
                {nextAction ? (
                  <div className="flex flex-wrap items-baseline" style={{ gap: "8px" }}>
                    <MonoLabel
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        color: "var(--text-subtle)",
                      }}
                    >
                      Recommended next
                    </MonoLabel>
                    <span
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "13px",
                        fontWeight: 550,
                        color: "var(--text-primary)",
                      }}
                    >
                      {nextAction}
                    </span>
                  </div>
                ) : null}
                {rationale ? (
                  <p
                    style={{
                      fontSize: "12.5px",
                      lineHeight: 1.6,
                      color: "var(--text-subtle)",
                      margin: 0,
                    }}
                  >
                    {rationale}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* The ICE strip: each cell tinted by its own tier. */}
            <StatStrip columns={4}>
              <StatCell
                label="Impact"
                value={String(opportunity.impact)}
                tone={toneForScore(opportunity.impact)}
              />
              <StatCell
                label="Confidence"
                value={String(opportunity.confidence)}
                tone={toneForScore(opportunity.confidence)}
              />
              <StatCell
                label="Ease"
                value={String(opportunity.ease)}
                tone={toneForScore(opportunity.ease)}
              />
              <StatCell
                label="ICE"
                value={opportunity.ice_score != null ? opportunity.ice_score.toFixed(1) : "-"}
                tone={toneForScore(opportunity.ice_score ?? 0)}
              />
            </StatStrip>

            {/* Provenance: honest, from theme_id only. View lineage sits on the
                heading when there is a theme to trace back to. */}
            <DetailSection
              heading="Where it came from"
              action={
                opportunity.theme_id ? (
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
                ) : null
              }
            >
              <span style={{ fontSize: "12.5px", color: "var(--text-body)" }}>
                {opportunity.theme_id ? "Promoted from a Discover theme." : "Promoted directly."}
              </span>
            </DetailSection>

            {/* The bet itself: real fields, blanks skipped. */}
            {opportunity.problem || opportunity.hypothesis || opportunity.target_user ? (
              <DetailSection heading="The bet">
                <div style={{ display: "grid", gap: "14px" }}>
                  {opportunity.problem ? (
                    <Field label="Problem" value={opportunity.problem} />
                  ) : null}
                  {opportunity.hypothesis ? (
                    <Field label="Hypothesis" value={opportunity.hypothesis} />
                  ) : null}
                  {opportunity.target_user ? (
                    <Field label="Target user" value={opportunity.target_user} />
                  ) : null}
                </div>
              </DetailSection>
            ) : null}

            {/* Critic: verdict + summary if present, honest empty otherwise. */}
            <DetailSection heading="Critic">
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
            </DetailSection>

            {/* SW-7 step 3: the bet's judgment - precedent recall + the queue
                it was ranked against. Self-fetched, honest empty states. */}
            <OpportunityJudgmentBlocks opportunityId={opportunity.id} />

            {/* Stage history: real per-transition rows; renders nothing until
                the first transition lands. */}
            <StageTimeline entityType="opportunity" entityId={opportunity.id} />

            {/* Activity: when it was promoted and last changed. */}
            <DetailSection heading="Activity">
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Promoted</span>
                  <TimeLine iso={opportunity.created_at} />
                </div>
                <div style={{ display: "grid", gap: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>
                    Last updated
                  </span>
                  <TimeLine iso={opportunity.updated_at} />
                </div>
              </div>
            </DetailSection>

            {/* Actions, mirroring the row. */}
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: "10px",
                paddingTop: "15px",
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
