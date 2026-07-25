// Mission Control, the room. THIS IS THE PRODUCT'S HOME: index.tsx redirects
// every signed-in user here, and the room was merged to main in dd851c4d. It is
// not a sandbox and not optional, whatever older comments elsewhere still claim.
//
// /m/$productId renders the five-region MissionShell for one product;
// ?stage= picks the Canvas face (01 discover .. 07 learn) and is set by the
// Spine, keys 1-7, without remounting the shell (search-param navigation on
// the same route). ?journey= records the active journey so the lit Spine
// slice survives reload and deep links (a chip activation sets journey AND
// its first stage in ONE navigation).
//
// Migration state (read before adding a surface): the strangler is only part
// way. Some legacy surfaces still render inside the old AppShell, so there are
// two answers to "where am I". Closing that is the post-demo priority; do not
// add a NEW surface to the old shell.
import { createFileRoute } from "@tanstack/react-router";
import { MissionShell } from "@/components/mission/MissionShell";
import { SPINE_STAGES, type StageId } from "@/components/mission/Spine";
import { JOURNEYS, type JourneyId } from "@/lib/journeys";

const STAGE_IDS = SPINE_STAGES.map((s) => s.id) as readonly StageId[];
const JOURNEY_IDS = JOURNEYS.map((j) => j.id) as readonly JourneyId[];

export const Route = createFileRoute("/_authenticated/m/$productId")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { stage?: StageId; journey?: JourneyId; panel?: "approvals" } => {
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
  },
  component: MissionRoom,
  head: () => ({ meta: [{ title: "Mission Control · Supaprod" }] }),
});

function MissionRoom() {
  const { productId } = Route.useParams();
  const { stage, journey, panel } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MissionShell
      productId={productId}
      stage={stage}
      journey={journey ?? null}
      trayOpen={panel === "approvals"}
      onTrayChange={(open) =>
        void navigate({
          search: (prev) => ({ ...prev, panel: open ? "approvals" : undefined }),
          resetScroll: false,
        })
      }
      onStageChange={(next) =>
        void navigate({
          search: (prev) => ({ ...prev, stage: next }),
          resetScroll: false,
        })
      }
      onJourneyChange={(nextJourney, nextStage) =>
        void navigate({
          search: (prev) => ({
            ...prev,
            journey: nextJourney ?? undefined,
            ...(nextStage ? { stage: nextStage } : {}),
          }),
          resetScroll: false,
        })
      }
    />
  );
}
