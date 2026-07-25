// The room's body, shared by the two URLs that reach it: the canonical
// /$workspaceSlug/$productSlug and the legacy /m/$productId. Both route files
// own their own params and their own validated search; this holds the ONE
// mapping from that search state onto MissionShell, so the two doors cannot
// drift apart while both are alive.
import { MissionShell } from "@/components/mission/MissionShell";
import { SPINE_STAGES, type StageId } from "@/components/mission/Spine";
import { JOURNEYS, type JourneyId } from "@/lib/journeys";

/** ?stage= picks the Canvas face, ?journey= lights the Spine slice, and
 * ?panel=approvals opens the tray. Everything else is dropped on arrival. */
export type RoomSearch = { stage?: StageId; journey?: JourneyId; panel?: "approvals" };

const STAGE_IDS = SPINE_STAGES.map((s) => s.id) as readonly StageId[];
const JOURNEY_IDS = JOURNEYS.map((j) => j.id) as readonly JourneyId[];

export function validateRoomSearch(search: Record<string, unknown>): RoomSearch {
  const s = search.stage;
  const j = search.journey;
  const p = search.panel;
  return {
    stage: (STAGE_IDS as readonly string[]).includes(s as string) ? (s as StageId) : undefined,
    journey: (JOURNEY_IDS as readonly string[]).includes(j as string)
      ? (j as JourneyId)
      : undefined,
    panel: p === "approvals" ? "approvals" : undefined,
  };
}

export function RoomSurface({
  productId,
  search,
  onSearchChange,
}: {
  productId: string;
  search: RoomSearch;
  /** The route-bound navigate, narrowed to the only thing the room does with
   * it: rewrite its own search params without remounting the shell. */
  onSearchChange: (updater: (prev: RoomSearch) => RoomSearch) => void;
}) {
  const { stage, journey, panel } = search;

  return (
    <MissionShell
      productId={productId}
      stage={stage}
      journey={journey ?? null}
      trayOpen={panel === "approvals"}
      onTrayChange={(open) =>
        onSearchChange((prev) => ({ ...prev, panel: open ? "approvals" : undefined }))
      }
      onStageChange={(next) => onSearchChange((prev) => ({ ...prev, stage: next }))}
      onJourneyChange={(nextJourney, nextStage) =>
        onSearchChange((prev) => ({
          ...prev,
          journey: nextJourney ?? undefined,
          ...(nextStage ? { stage: nextStage } : {}),
        }))
      }
    />
  );
}
