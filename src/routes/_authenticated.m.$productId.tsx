// Mission Control, the room (front-end reimagining Phase 1, sandbox).
// /m/$productId renders the five-region MissionShell for one product;
// ?stage= picks the Canvas face (01 discover .. 07 learn) and is set by the
// Spine, keys 1-7, without remounting the shell (search-param navigation on
// the same route). The old app is untouched; /m is a parallel room.
import { createFileRoute } from "@tanstack/react-router";
import { MissionShell } from "@/components/mission/MissionShell";
import { SPINE_STAGES, type StageId } from "@/components/mission/Spine";

const STAGE_IDS = SPINE_STAGES.map((s) => s.id) as readonly StageId[];

export const Route = createFileRoute("/_authenticated/m/$productId")({
  validateSearch: (search: Record<string, unknown>): { stage?: StageId } => {
    const s = search.stage;
    return {
      stage: (STAGE_IDS as readonly string[]).includes(s as string) ? (s as StageId) : undefined,
    };
  },
  component: MissionRoom,
  head: () => ({ meta: [{ title: "Mission Control · Supaprod" }] }),
});

function MissionRoom() {
  const { productId } = Route.useParams();
  const { stage } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <MissionShell
      productId={productId}
      stage={stage ?? "discover"}
      onStageChange={(next) =>
        void navigate({
          search: (prev) => ({ ...prev, stage: next }),
          resetScroll: false,
        })
      }
    />
  );
}
