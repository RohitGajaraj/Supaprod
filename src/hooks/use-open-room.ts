// One door into the room, for every surface that opens it.
//
// The readable /$workspaceSlug/$productSlug is the shape we navigate to; the
// legacy /m/$productId is the floor when either slug is still missing, so a row
// that predates the slug backfill opens the room instead of a dead URL. Call
// sites say WHICH product, never which shape.
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { roomLinkFor } from "@/lib/room-url";

/** Room search state, kept loose here so this hook stays free of the room's
 * component graph (MissionShell reaches back into this hook). The two route
 * files own the strict schema and validate it on arrival. */
type RoomSearch = Record<string, unknown>;

export type OpenRoomOptions = {
  /** An object of search params, or the usual updater that carries them across. */
  search?: RoomSearch | ((prev: RoomSearch) => RoomSearch);
  replace?: boolean;
};

export function useOpenRoom() {
  const navigate = useNavigate();
  const { workspaces, products } = useWorkspace();

  return useCallback(
    (productId: string, opts?: OpenRoomOptions) => {
      const search = opts?.search === undefined ? {} : { search: opts.search as never };
      const replace = opts?.replace === undefined ? {} : { replace: opts.replace };
      const link = roomLinkFor(workspaces, products, productId);
      if (link) {
        void navigate({ to: "/$workspaceSlug/$productSlug", params: link, ...search, ...replace });
        return;
      }
      void navigate({ to: "/m/$productId", params: { productId }, ...search, ...replace });
    },
    [navigate, workspaces, products],
  );
}
