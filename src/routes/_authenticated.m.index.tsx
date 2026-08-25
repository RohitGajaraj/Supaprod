import { createFileRoute, redirect } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * /m retired. It resolved your newest product and opened the room.
 *
 * THE ROOM IS THE ONE UNPORTED LEGACY SURFACE. It carries its own five-region
 * shell instead of AppFrame and is drawn in the retired `--ink-*` tokens, which
 * is why `_authenticated.tsx` had to special-case it (ROOM_ROUTE_IDS) and
 * render a bare Outlet with no rail, no header and no spine strip. That special
 * case is what this removes: every authenticated URL now gets the real shell.
 *
 * THE URL STAYS ALIVE, because bookmarks and the room's own account menu still
 * point at it and repo doctrine is that a URL keeps working. It simply lands on
 * Today rather than opening a surface the product has replaced.
 *
 * A redirect in `beforeLoad` rather than a component that navigates. The old
 * one rendered a chromeless "Opening Mission Control." on `--ink-bg` while it
 * resolved a product, so the shell was torn down for a frame on the way to
 * somewhere else. Nothing renders here now, and RoomChromeShell no longer
 * enters this route's chunk.
 *
 * WHAT IS LOST, said plainly: a zero-product workspace used to get a WarmSlot
 * here inviting it to describe what it is building. Today's own empty state now
 * carries that invitation, and it does it inside the real shell rather than
 * inside the retired one.
 */
export const Route = createFileRoute("/_authenticated/m/")({
  beforeLoad: () => {
    throw redirect({ to: SIGNED_IN_HOME });
  },
});
