import { createFileRoute, redirect } from "@tanstack/react-router";

// 2026-06-12 Build rename — the user-facing name and URL flipped from Studio
// to Build (/build/$missionId is canonical; the surface lives in
// _authenticated.build.$missionId.tsx). Internal studio.* identifiers are
// intentionally kept (CLAUDE.md rename-disclaimer pattern). This mirrors —
// and reverses — the earlier F-V5-MOTHBALL /build → /studio redirect.
// $missionId and ?tab= are preserved so every existing deep link keeps
// working (dispatch surfaces still navigate to /studio/$missionId).
type Tab = "changes" | "pr" | "cost";
const TABS: Tab[] = ["changes", "pr", "cost"];

export const Route = createFileRoute("/_authenticated/studio/$missionId")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = search.tab;
    return { tab: (TABS as string[]).includes(t as string) ? (t as Tab) : undefined };
  },
  // COLLAPSED 2026-08-10. This pointed at /build/$missionId, which is itself a
  // permanent redirect to /runs/$missionId, so every visit here paid TWO hops
  // to reach one surface. Six components still navigate to this route, and the
  // worst of them did it from the rollback success path, so the single
  // highest-stakes action in the product ended on a stutter.
  //
  // /build/$missionId is deliberately LEFT IN PLACE. It is the canonical home
  // of its own deep links and of /missions/$missionId, and deleting it would
  // break bookmarks to buy nothing. What is fixed is that no route now points
  // at a redirect when it can point at the destination.
  //
  // `replace: true` matches what /build already does. Without it the
  // intermediate URL stays in history and the back button walks the user
  // through a hop they never chose to visit.
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/runs/$missionId",
      params: { missionId: params.missionId },
      search: search as never,
      replace: true,
    });
  },
});
