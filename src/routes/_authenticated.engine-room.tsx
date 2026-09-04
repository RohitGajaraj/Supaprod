/**
 * `/engine-room` IS A REDIRECT STUB NOW (P-79, A-QUEUE.md). P-61's ruling:
 * "Crew and spend" is `/crew` with the engine room as its spend tab, and this
 * is that move. The content itself -- the four rooms, the chassis, the
 * Escape ladder, the sources line -- lives in
 * `components/engine-room/EngineRoomEmbedded.tsx` now, moved whole rather
 * than duplicated; read that file's own header for the full design reasoning
 * this route used to carry (REDESIGNED, not re-skinned; KEEP/MOVE/KILL on
 * the port pass; the founder's "NOT SPEAKING TO THE VOLUMES AND DEPTH"
 * ruling that grew the overview from a row to a card).
 *
 * EVERY OLD LINK STILL WORKS. `room` and `view` are forwarded verbatim (this
 * packet's own acceptance line); `suite` and `surface` too. `agent` is
 * translated to `roomAgent` -- Team's own `?agent=` already names a crew
 * member, so the two could not share a name once this content moved under
 * Team's URL, and a redirect is exactly the place to absorb a rename without
 * breaking whoever still has the old one.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROOM_KEYS } from "@/components/engine-room/EngineRoomEmbedded";
import type { RoomKey } from "@/lib/engine-room-glance";

export const Route = createFileRoute("/_authenticated/engine-room")({
  beforeLoad: ({ search }) => {
    const s = search as Record<string, unknown>;
    const room = ROOM_KEYS.includes(s.room as RoomKey) ? (s.room as RoomKey) : undefined;
    const view = typeof s.view === "string" ? s.view : undefined;
    const suite = typeof s.suite === "string" ? s.suite : undefined;
    const roomAgent = typeof s.agent === "string" ? s.agent : undefined;
    const surface = typeof s.surface === "string" ? s.surface : undefined;
    throw redirect({
      to: "/crew",
      search: {
        tab: "spend" as const,
        ...(room ? { room } : {}),
        ...(view ? { view } : {}),
        ...(suite ? { suite } : {}),
        ...(roomAgent ? { roomAgent } : {}),
        ...(surface ? { surface } : {}),
      },
    });
  },
});
