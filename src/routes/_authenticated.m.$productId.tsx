import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * The room's legacy /m/<uuid> URL. Kept alive, and no longer a door into the
 * retired shell.
 *
 * WHAT IT DID. It resolved the product's workspace and product slugs and
 * replaced itself with the readable /$workspaceSlug/$productSlug, so an old
 * link upgraded itself in the address bar. Where either slug was missing it
 * rendered the room IN PLACE rather than dying, which was the right call while
 * the room was the product.
 *
 * WHY THAT ENDS HERE. The room is the one unported legacy surface: its own
 * five-region shell instead of AppFrame, drawn in the retired `--ink-*` tokens.
 * Both of this route's branches led there, so the slug-upgrade path was a
 * polite way into a surface the product has replaced, and the fallback rendered
 * it outright. `_authenticated.tsx` had to special-case both to strip the rail,
 * the header and the spine strip.
 *
 * THE URL KEEPS WORKING, per repo doctrine, and now lands on Today. That is a
 * real loss and it is stated rather than hidden: an old /m/<uuid> link no
 * longer opens THAT product, it opens the product. Restoring the upgrade means
 * porting the room, and when that happens this stub is where the slug
 * resolution belongs again. `validateSearch` goes with the component, which
 * also keeps RoomSurface (the retired room's whole component graph) out of this
 * route's chunk.
 */
export const Route = createFileRoute("/_authenticated/m/$productId")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
