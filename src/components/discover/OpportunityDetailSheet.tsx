/**
 * One ranked bet in full. This is the depth behind a queue row, so everything
 * the row stopped drawing lives here and nothing here is a second copy of the
 * row.
 *
 * Ported off the retired system (2026-07-29). What changed, and why:
 *
 * KILL the DetailKit shell. DetailHeader drew its own chip rail and trace tail,
 *      DetailSection drew a heading register of its own, and the priority band
 *      was a bordered card sitting inside a bordered sheet. Sections are now
 *      `Block`, which is a rule rather than a box: one bordered container per
 *      region, and the sheet is the region.
 * KILL the four-cell ICE strip. Four tinted stat tiles for four small integers
 *      is decoration doing a sentence's job; the scores are one quiet line.
 * KILL the verdict chip, the confidence chip and the "Move to" chip in the
 *      header. What the Critic concluded is a sentence with a name in front of
 *      it, at the confidence the Critic actually disclosed. The status menu is
 *      an action, so it sits with the actions.
 * KILL the designation's stock explanation. It said what to do, and the
 *      ranking's own `nextAction` says what to do about THIS bet. Two of those
 *      is the same sentence twice (hard ban 10); the specific one wins.
 * KEEP every server function, query key, mutation and prop. The brief link
 *      still writes through setOpportunityBriefLink and still invalidates
 *      ["opportunities"] and ["brief-alignment"]; the judgment read still uses
 *      ["opportunity-judgment", id].
 *
 * THE MOMENT. The precedent is the record speaking, so it renders in the
 * record recess, the one lit surface in the product, rather than as another
 * paragraph. It arrives at the only instant it can change an outcome: while
 * you are looking at the bet and deciding what to do with it.
 *
 * ATTRIBUTION. Every claim in here says who made it. The teardown wears the
 * Critic's mark, the recorded decision wears the mark of the agent that made
 * it, and a bet nobody has reviewed says so instead of going quiet.
 */

import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listBriefItems } from "@/lib/briefs.functions";
import { setOpportunityBriefLink } from "@/lib/brief-opportunity.functions";
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
import { iceNum } from "@/lib/moat-vis";
import type { CriticReview } from "@/lib/discovery.functions";
import { AuditTag } from "@/components/supaprod/AuditTag";
import { PulsePrompt } from "@/components/supaprod/PulsePrompt";
import { AskInContext } from "@/components/obsidian/AskInContext";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { ProductAnalyticsPanel } from "@/components/product/ProductAnalyticsPanel";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Line,
  Num,
  PageHead,
  Record as RecordRecess,
  Row,
  Who,
} from "@/components/shell/primitives";
import type { VerdictWord } from "./format";
import type { Designation } from "./ranking";
import {
  BestBetStamp,
  DesignationTag,
  OPPORTUNITY_STATUSES,
  STATUS_META,
  StatusPill,
  type OpportunityStatus,
} from "./OpportunityRow";

/** The agent that red-teams a bet, named from the one catalog. */
const CHALLENGER = "critic";

/** A recorded outcome is an outcome, so it is one of the three colours that
 * carry one. Nothing else in this sheet reaches for a hue. */
const OUTCOME_TONE: Record<"validated" | "missed" | "mixed", string> = {
  validated: "var(--sp-pass)",
  missed: "var(--sp-fail)",
  mixed: "var(--sp-warn)",
};

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
  // RPT-47: the strategic top bet a human tied this opportunity to (nullable).
  linked_brief_item_id?: string | null;
  // PC-29 layer 3 (2026-07-17): the agent that recorded the decision behind
  // this bet's linked spec, if any (null until a spec exists and carries a
  // decision with decided_by_agent_slug set).
  decided_by_agent_slug?: string | null;
}

/* ------------------------------------------------------------------ *
 * Local shapes. Neither is a primitive: one is read-only prose and the
 * other is a label over a paragraph, and the `Field` primitive labels a
 * CONTROL. Reported as a gap rather than invented as a shared shape.
 * ------------------------------------------------------------------ */

/** Supporting prose inside a block. */
function P({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "var(--sp-text-meta)",
        lineHeight: "var(--sp-leading-body)",
        color: "var(--sp-body)",
      }}
    >
      {children}
    </p>
  );
}

/** One stated fact: a label, and under it the thing itself. ONE label, and the
 * value is never a restatement of it. */
function Stated({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: "var(--sp-space-3)" }}>
      <span
        style={{
          display: "block",
          fontSize: "var(--sp-text-label)",
          fontWeight: "var(--sp-weight-medium)",
          color: "var(--sp-mute)",
          marginBottom: "var(--sp-space-1)",
        }}
      >
        {label}
      </span>
      <P>{children}</P>
    </div>
  );
}

/** The quiet evidence line under a claim. Numbers inside it wear mono via
 * `Num`; the words around them do not. */
function Meta({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "var(--sp-space-2)",
        fontSize: "var(--sp-text-label)",
        lineHeight: "var(--sp-leading-tight)",
        color: "var(--sp-mute)",
      }}
    >
      {children}
    </div>
  );
}

/** What the reviewer did, as a verb rather than a chip. */
function verdictVerb(verdict: VerdictWord): string {
  return verdict === "PENDING" ? "has not reviewed it yet" : `says ${verdict.toLowerCase()}`;
}

/** The disclosed confidence, folded into the sentence it qualifies. Absent
 * (not zero) until the Critic has actually given one. */
function confidenceTail(confidence: number | null | undefined): ReactNode {
  if (confidence == null) return null;
  return (
    <>
      {" at "}
      <Num>{Math.round(confidence * 100)}%</Num>
      {" confidence"}
    </>
  );
}

/** An absolute day, for the activity ledger. The relative age is already in
 * the header, so this carries the other half of the fact. */
function day(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "unknown" : d.toLocaleDateString();
}

/** Plain-words relative time. */
function ago(iso?: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** SW-7 step-3 oracle: the best bet shows its precedent ("last time we
 * reasoned this way, here is what happened", the same Ambient Precedent recall
 * the decision card uses) and the live queue it was ranked against. Honest
 * states throughout: a failed read is a failure and says so, an empty result
 * is empty and says who fills it, and neither wears the other's clothes. */
function OpportunityJudgmentBlocks({ opportunityId }: { opportunityId: string }) {
  const fJudgment = useServerFn(getOpportunityJudgment);
  const q = useQuery({
    queryKey: ["opportunity-judgment", opportunityId],
    queryFn: () => fJudgment({ data: { id: opportunityId } }),
  });

  const precedents = q.data?.precedents ?? [];
  const peers = q.data?.consideredAgainst ?? [];

  // A read that FAILED is not an empty state. It used to render "No recorded
  // outcome matches this bet yet", which is a different fact entirely.
  if (q.isError) {
    return (
      <Block title="Precedent">
        <Failed onRetry={() => void q.refetch()}>
          Could not read this bet's judgment. {(q.error as Error).message}
        </Failed>
      </Block>
    );
  }

  return (
    <>
      <Block
        title="Precedent"
        sub={
          precedents.length > 0
            ? "The last time we reasoned this way, here is what happened."
            : undefined
        }
      >
        {q.isPending ? (
          <P>Recalling past outcomes.</P>
        ) : precedents.length > 0 ? (
          precedents.map((p) => (
            <RecordRecess
              key={p.memoryId}
              evidence={
                <>
                  <span style={{ color: OUTCOME_TONE[p.verdict] }}>{p.verdict}</span>
                  {p.title ? ` · ${p.title}` : ""}
                </>
              }
            >
              {p.summary}
            </RecordRecess>
          ))
        ) : (
          <Empty>
            No recorded outcome matches this bet yet. Ship one and the record recalls it here the
            next time a bet looks like this.
          </Empty>
        )}
      </Block>

      <Block title="Considered against">
        {q.isPending ? (
          <P>Reading the queue.</P>
        ) : peers.length > 0 ? (
          peers.map((a) => (
            <Line key={a.id} label={a.title}>
              {a.ice != null ? (
                <>
                  <Num>{a.ice.toFixed(1)}</Num>
                  {" ICE"}
                </>
              ) : (
                <span style={{ fontSize: "var(--sp-text-label)", color: "var(--sp-mute)" }}>
                  unscored
                </span>
              )}
            </Line>
          ))
        ) : (
          <Empty>Nothing else is live in the queue right now.</Empty>
        )}
      </Block>
    </>
  );
}

/**
 * RPT-47: tie this opportunity to a strategic top bet, the human action that
 * lets a watched assumption feed the ranking. A standing bet lifts the
 * opportunity in the queue; if that bet's assumption is later challenged, the
 * opportunity sinks. Never inferred: the operator chooses. Hidden until at
 * least one top bet exists to tie to, so it never offers an empty choice.
 *
 * It is a boundary you set, so it is a sentence with a control at the end of
 * it rather than a panel: the `Line` shape, one per line, divided.
 */
function BriefLinkLine({ opportunity }: { opportunity: OpportunityDetailRecord }) {
  const qc = useQueryClient();
  const fList = useServerFn(listBriefItems);
  const fSetLink = useServerFn(setOpportunityBriefLink);

  const bets = useQuery({ queryKey: ["brief-items"], queryFn: () => fList({ data: {} }) });
  const topBets = (bets.data ?? []).filter((b) => b.kind === "top_bet");
  const linkedId = opportunity.linked_brief_item_id ?? null;
  const linkedBet = topBets.find((b) => b.id === linkedId) ?? null;

  const setLink = useMutation({
    mutationFn: (briefItemId: string | null) =>
      fSetLink({ data: { opportunityId: opportunity.id, briefItemId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["brief-alignment"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (topBets.length === 0) return null;

  return (
    <Line
      label="Strategic bet"
      sub="A challenged assumption on the bet you tie it to sinks this one in the ranking."
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={setLink.isPending}>
            <span
              style={{
                display: "block",
                maxWidth: "16ch",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {linkedBet ? linkedBet.title : "Not tied to a bet"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLink.mutate(null)}>
            Not tied to a bet
          </DropdownMenuItem>
          {topBets.map((b) => (
            <DropdownMenuItem key={b.id} onClick={() => setLink.mutate(b.id)}>
              {b.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Line>
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
  /** The system-derived bet designation (from ranking.ts), shown on the
   * ranking's evidence line so a human or an agent reads what the bet is.
   * Absent renders nothing. */
  designation?: Designation;
  /** Any mutation in flight for this bet: disables every action so a second
   * click can never double-fire. */
  busy?: boolean;
  /** The Critic challenge is in flight. */
  challengePending?: boolean;
  /** The spec draft is in flight. */
  draftPending?: boolean;
}

/**
 * The full record for one ranked bet, on the primitives, in the order an
 * operator reads it: what it is and where it stands, why it ranks where it
 * does, where it came from, the bet itself, what the Critic found, what the
 * record remembers, what it was ranked against, its history, and only then
 * what you can do about it.
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
  busy = false,
  challengePending = false,
  draftPending = false,
}: OpportunityDetailSheetProps) {
  const { activeWorkspaceId } = useWorkspace();
  const challengerName = agentDisplayName(CHALLENGER);
  // PostgREST can serialize the `numeric` ice_score column as a string, not a
  // number (the generated Supabase type lies) - iceNum coerces it the same way
  // moat-vis.ts and decision-judgment.functions.ts already do for the same
  // column, so .toFixed never throws here.
  const iceScore = opportunity ? iceNum(opportunity.ice_score) : null;
  const criticConfidence = opportunity?.critic_review?.confidence ?? null;
  const updatedAgo = opportunity ? ago(opportunity.updated_at) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        {/* Accessible name and description for the dialog. The visible head
            below carries the same title, so this stays screen-reader only. */}
        <SheetHeader className="sr-only">
          <SheetTitle>{opportunity?.title ?? "Opportunity"}</SheetTitle>
          <SheetDescription>
            One ranked bet in full: where it came from, why it ranks where it does, and what the
            Critic found.
          </SheetDescription>
        </SheetHeader>

        {opportunity ? (
          <div style={{ paddingBottom: "var(--sp-space-4)" }}>
            {/* The close control floats at the top right of the sheet, so the
                title keeps clear of it rather than running underneath. */}
            <div style={{ paddingRight: "28px" }}>
              <PageHead
                title={opportunity.title}
                sub={
                  <>
                    <StatusPill status={opportunity.status} />
                    {" · "}
                    {challengerName} {verdictVerb(verdict)}
                    {confidenceTail(criticConfidence)}
                    {updatedAgo ? (
                      <>
                        {" · moved "}
                        <Num>{updatedAgo}</Num>
                        {" ago"}
                      </>
                    ) : null}
                  </>
                }
              />
            </div>
            <div style={{ marginTop: "var(--sp-space-3)" }}>
              <AuditTag kind="opportunity" id={opportunity.id} copyable />
            </div>

            {/* Why it ranks here. The ranking's own reason, then the one
                recommended move, then the numbers that produced the order. */}
            <Block title="Why it ranks here">
              {rationale ? <P>{rationale}</P> : null}
              {nextAction ? <Stated label="Recommended next">{nextAction}</Stated> : null}
              <Meta>
                {rank != null ? (
                  <>
                    <Num>#{rank}</Num>
                    {" · "}
                  </>
                ) : null}
                {designation === "best bet" ? (
                  <>
                    <BestBetStamp />
                    {" · "}
                  </>
                ) : null}
                {designation && designation !== "best bet" ? (
                  <>
                    <DesignationTag designation={designation} />
                    {" · "}
                  </>
                ) : null}
                {"Impact "}
                <Num>{opportunity.impact}</Num>
                {" · Confidence "}
                <Num>{opportunity.confidence}</Num>
                {" · Ease "}
                <Num>{opportunity.ease}</Num>
                {iceScore != null ? (
                  <>
                    {" · ICE "}
                    <Num>{iceScore.toFixed(1)}</Num>
                  </>
                ) : null}
              </Meta>
              <BriefLinkLine opportunity={opportunity} />
            </Block>

            {/* Provenance: honest, from theme_id only. The lineage door sits on
                the heading, and only when there is a theme to trace back to. */}
            <Block
              title="Where it came from"
              more={opportunity.theme_id ? "View lineage" : undefined}
              onMore={onViewLineage}
            >
              <P>
                {opportunity.theme_id
                  ? "Promoted from a Discover theme, with its signals attached."
                  : "Promoted directly. No theme backs it."}
              </P>
            </Block>

            {/* The bet itself: real fields, blanks skipped. */}
            {opportunity.problem ||
            opportunity.hypothesis ||
            opportunity.target_user ||
            opportunity.decided_by_agent_slug ? (
              <Block title="The bet">
                {opportunity.problem ? (
                  <Stated label="Problem">{opportunity.problem}</Stated>
                ) : null}
                {opportunity.hypothesis ? (
                  <Stated label="Hypothesis">{opportunity.hypothesis}</Stated>
                ) : null}
                {opportunity.target_user ? (
                  <Stated label="Target user">{opportunity.target_user}</Stated>
                ) : null}
                {/* PC-29 layer 3 (2026-07-17): decided_by_agent_slug, rendered
                    as attribution rather than as another labelled string, so
                    the agent that made the call carries its own mark. */}
                {opportunity.decided_by_agent_slug ? (
                  <Row
                    marks={<AgentMark slug={opportunity.decided_by_agent_slug} state="idle" />}
                    lead={
                      <>
                        <Who>{agentDisplayName(opportunity.decided_by_agent_slug)}</Who> recorded
                        the decision behind this bet
                      </>
                    }
                  />
                ) : null}
              </Block>
            ) : null}

            {/* The teardown. One row that says who concluded what, and under it
                what they actually found. Never a chip: a verdict with no author
                is an assertion nobody signed. */}
            <Block title="The teardown">
              <Row
                marks={
                  <AgentMark
                    slug={CHALLENGER}
                    state={opportunity.critic_review ? "idle" : "quiet"}
                  />
                }
                lead={
                  <>
                    <Who>{challengerName}</Who> {verdictVerb(verdict)}
                    {confidenceTail(criticConfidence)}
                  </>
                }
                sub={
                  opportunity.critic_review?.summary ??
                  "Challenge it and the teardown lands on the record, with its receipts attached."
                }
              />
              {opportunity.critic_review?.summary ? (
                <PulsePrompt surface="teardown" targetId={opportunity.id} />
              ) : null}
            </Block>

            {/* SW-7 step 3: the bet's judgment. Precedent recall in the record
                recess, then the queue it was ranked against. */}
            <OpportunityJudgmentBlocks opportunityId={opportunity.id} />

            {/* Stage history: real per-transition rows; renders nothing until
                the first transition lands. */}
            <StageTimeline entityType="opportunity" entityId={opportunity.id} />

            {/* Post-ship product analytics for this bet (adoption vs. the
                outcome it declared). Self-fetches; renders nothing until real
                analytics exist. */}
            {activeWorkspaceId ? (
              <ProductAnalyticsPanel
                opportunityId={opportunity.id}
                workspaceId={activeWorkspaceId}
              />
            ) : null}

            <Block title="Activity">
              <Line label="Promoted">
                <Num>{day(opportunity.created_at)}</Num>
              </Line>
              <Line label="Last changed">
                <Num>{day(opportunity.updated_at)}</Num>
              </Line>
            </Block>

            {/* One primary, and only one. Delete is separated by distance
                rather than by colour: red carries an outcome here, not an
                intent, and ember marks the human. */}
            <Block>
              <Actions
                trailing={
                  <Button variant="ghost" onClick={onDelete} disabled={busy}>
                    Delete
                  </Button>
                }
              >
                <Button variant="primary" onClick={onDraftSpec} disabled={busy || draftPending}>
                  {draftPending ? "Drafting the spec" : "Draft spec"}
                </Button>
                <Button onClick={onChallenge} disabled={busy || challengePending}>
                  {challengePending ? "Challenging it" : "Challenge it"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={busy}>Move to</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {OPPORTUNITY_STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => onSetStatus(s)}>
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* PC-29 layer 6: the one contextual delegation verb for a bet.
                    It moved off the list row and into the depth, where every
                    other write on this bet already lives. */}
                <AskInContext
                  stationOrKind="opportunity"
                  targetId={opportunity.id}
                  targetTitle={opportunity.title}
                />
              </Actions>
            </Block>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
