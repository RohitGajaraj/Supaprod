/**
 * OBS-05: wraps the OBS-03 `MissionRow` anatomy around a Build session. The
 * archive/delete overflow menu sits BESIDE the row, not inside it · `MissionRow`'s
 * root is itself a `<button>` (README §5.12: every acting row is a real button),
 * and nesting an interactive `<button>` inside another is invalid HTML, so the
 * quiet `⋯` trigger is a flex sibling rather than a fork of the primitive.
 */
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
import type { StudioSessionListItem } from "@/lib/studio.functions";

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Session actions"
            style={{
              flexShrink: 0,
              padding: "4px 12px",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              color: "var(--text-faint)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ⋯
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
