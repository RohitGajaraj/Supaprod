import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * The room's canonical URL, /helio-labs/relay. Retired, and the URL kept alive.
 *
 * THIS ROUTE WAS ALSO A TRAP, which is the reason it is dealt with before the
 * room is ported rather than after. It is a TWO-SEGMENT DYNAMIC route at the
 * root of the authenticated namespace, so it matches ANY unmatched two-segment
 * path. A typo, a stale bookmark, a pre-rebuild demo link: all of them scored
 * against this route, resolved no workspace and no product, and rendered the
 * retired room's dead-end state in `--ink-*` chrome. `AuthedNotFound` in
 * `_authenticated.tsx` could never fire for a two-segment URL, because this
 * route caught them first.
 *
 * So the product's own not-found was unreachable across a whole shape of URL,
 * and what a person got instead was a surface drawn in a design system the rest
 * of the app has replaced.
 *
 * NOT PORTED, DELIBERATELY. The room carries its own five-region shell and 199
 * `--ink-*` tokens; porting it is real work and it is not launch work. A
 * redirect costs nothing, keeps every URL alive per repo doctrine, and lets
 * `ROOM_ROUTE_IDS` empty out so AppFrame wraps 100% of authenticated surfaces
 * and the real not-found becomes reachable again.
 *
 * WHEN THE ROOM IS PORTED, this is where it comes back: same path, same
 * `validateSearch: validateRoomSearch`, with ?stage= picking the Canvas face
 * and ?journey= holding the lit Spine slice. Both are removed with the
 * component, which also keeps RoomSurface out of this route's chunk.
 */
export const Route = createFileRoute("/_authenticated/$workspaceSlug/$productSlug")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
