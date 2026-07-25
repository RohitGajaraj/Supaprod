/**
 * OBS-05: wraps the OBS-03 `MissionRow` anatomy around a Build session. The
 * archive/delete overflow menu sits BESIDE the row, not inside it · `MissionRow`'s
 * root is itself a `<button>` (README §5.12: every acting row is a real button),
 * and nesting an interactive `<button>` inside another is invalid HTML, so the
 * quiet `⋯` trigger is a flex sibling rather than a fork of the primitive.
 */
import { ExternalLink, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MissionRow } from "./missionrow";
import { studioToMissionRowStatus, studioVerdict, MISSION_ROW_STEP_LABEL } from "./build-status";
import { fmtCost } from "@/components/studio/studio-format";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AskInContext } from "./AskInContext";
import {
  completionEvidence,
  COMPLETION_EVIDENCE_LABEL,
  COMPLETION_EVIDENCE_REASON,
  COMPLETION_EVIDENCE_TONE,
} from "@/lib/build/verification";
import { InlineApprovalMarker } from "@/components/studio/InlineApprovalMarker";
import { useMissionApprovals } from "@/hooks/use-mission-approvals";
import type { StudioSessionListItem } from "@/lib/studio.functions";

const EVIDENCE_COLOR: Record<"moss" | "ember" | "faint", string> = {
  moss: "var(--moss)",
  ember: "var(--ember)",
  faint: "var(--text-faint)",
};

/** RPT-26: a small honest badge for the "done" claim's own evidence - never
 *  reuses the SHIP/KILL verdict chip's slot, since that answers a different
 *  question (the outcome, not whether it can be checked). */
function CompletionEvidenceBadge({ session }: { session: StudioSessionListItem }) {
  const rawStatus = session.run_status ?? session.status;
  const status = studioToMissionRowStatus(rawStatus, session.pending_approvals);
  const evidence = completionEvidence({
    claimsDone: status === "done",
    kind: session.kind,
    changesetStatus: session.changeset?.status ?? null,
    prUrl: session.changeset?.pr_url ?? null,
  });
  if (!evidence) return null;

  const color = EVIDENCE_COLOR[COMPLETION_EVIDENCE_TONE[evidence]];
  const label = COMPLETION_EVIDENCE_LABEL[evidence];
  const reason = COMPLETION_EVIDENCE_REASON[evidence];

  if (evidence === "verified" && session.changeset?.pr_url) {
    return (
      <a
        href={session.changeset.pr_url}
        target="_blank"
        rel="noopener noreferrer"
        title={reason}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
          color,
          textDecoration: "none",
          padding: "0 8px",
        }}
      >
        {label}
        <ExternalLink size={16} />
      </a>
    );
  }

  return (
    <span
      title={reason}
      style={{
        flexShrink: 0,
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        color,
        padding: "0 8px",
      }}
    >
      {label}
    </span>
  );
}

export function BuildMissionRow({
  session,
  onOpen,
  onArchive,
  onDelete,
}: {
  session: StudioSessionListItem;
  onOpen: () => void;
  onArchive: (archived: boolean) => void;
  onDelete: () => void;
}) {
  const rawStatus = session.run_status ?? session.status;
  const status = studioToMissionRowStatus(rawStatus, session.pending_approvals);
  const verdict = studioVerdict(rawStatus, session.changeset?.status);
  const approvals = useMissionApprovals(session.mission_id);

  return (
    <div className="flex items-center">
      <MissionRow
        className="flex-1"
        status={status}
        title={stripAutoPrefix(session.title)}
        isAuto={isAutoTitle(session.title)}
        verdict={verdict}
        stepLabel={MISSION_ROW_STEP_LABEL[status]}
        cost={fmtCost(session.cost_usd)}
        time={relTimeCaps(session.updated_at)}
        traceLabel={`MIS·${traceRef(session.mission_id)}`}
        onOpen={onOpen}
      />
      <CompletionEvidenceBadge session={session} />
      {/* PC-29 Layer 7a: inline approval marker shows which gate is blocking
          this mission - trust plane made felt on the card itself. */}
      {approvals.data && <InlineApprovalMarker approvals={approvals.data} />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Session actions"
            className="loom-press transition-colors hover:[color:var(--text-body)]"
            style={{
              flexShrink: 0,
              padding: "4px 12px",
              color: "var(--text-faint)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {/* Tempo §8: lucide outline icon, one treatment (was a text "⋯" glyph). */}
            <MoreHorizontal size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onArchive(!session.archived)}>
            {session.archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* PC-29 layer 6: the one contextual delegation verb, only once the
          session has actually shipped (merged) - a running/planned mission
          isn't "shipped work" yet. */}
      {verdict === "SHIP" ? (
        <AskInContext
          stationOrKind="shipped"
          targetId={session.mission_id}
          targetTitle={stripAutoPrefix(session.title)}
        />
      ) : null}
    </div>
  );
}
