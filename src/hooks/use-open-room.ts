// One door into the room, for every surface that opens it.
//
// P-10 (A-QUEUE.md, 2026-09-02): both /$workspaceSlug/$productSlug and
// /m/$productId were deleted as pure redirect stubs that always threw to
// SIGNED_IN_HOME (the room itself was never ported off its retired shell).
// Every call already landed on /start one hop later; this removes the hop
// rather than changing where a caller ends up.
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

/** Room search state, kept loose here so this hook stays free of the room's
 * component graph (MissionShell reaches back into this hook). */
type RoomSearch = Record<string, unknown>;

export type OpenRoomOptions = {
  /** An object of search params, or the usual updater that carries them across. */
  search?: RoomSearch | ((prev: RoomSearch) => RoomSearch);
  replace?: boolean;
};

export function useOpenRoom() {
  const navigate = useNavigate();

  return useCallback(
    (_productId: string, opts?: OpenRoomOptions) => {
      const search = opts?.search === undefined ? {} : { search: opts.search as never };
      const replace = opts?.replace === undefined ? {} : { replace: opts.replace };
      void navigate({ to: "/start", ...search, ...replace });
    },
    [navigate],
  );
}
