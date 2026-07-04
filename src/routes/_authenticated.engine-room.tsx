import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { EngineRoomSurface, EngineRoomContainer } from "@/components/engine-room/EngineRoomSurface";
import { RoomDetail, ROOM_TABS } from "@/components/engine-room/RoomDetail";
import type { RoomKey } from "@/lib/engine-room-glance";

// LOOM W2 (audit IA insight #1: ONE Engine Room): the door and its four
// rooms (Spend, Quality, Safety, Record) now hold every live /govern tab as
// a room view; /govern is a permanent redirect stub. Drill params (?suite=,
// ?agent=, ?surface=) ride the URL so deep links and the old /govern drill
// links land exactly (LOOM §9b).
const ROOM_KEYS: RoomKey[] = ["spend", "quality", "safety", "record"];

export interface EngineRoomSearch {
  room?: RoomKey;
  view?: string;
  suite?: string;
  agent?: string;
  surface?: string;
}

export const Route = createFileRoute("/_authenticated/engine-room")({
  validateSearch: (search: Record<string, unknown>): EngineRoomSearch => ({
    room: ROOM_KEYS.includes(search.room as RoomKey) ? (search.room as RoomKey) : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
    suite: typeof search.suite === "string" ? search.suite : undefined,
    agent: typeof search.agent === "string" ? search.agent : undefined,
    surface: typeof search.surface === "string" ? search.surface : undefined,
  }),
  component: EngineRoomPage,
  head: () => ({ meta: [{ title: "Engine Room · Cadence" }] }),
  // OBS-02 hoisted the Obsidian shell into _authenticated.tsx, so this route
  // renders bare. No AppShell wrap here.
  errorComponent: ({ error, reset }) => (
    <div style={{ maxWidth: "var(--container-standard)", margin: "0 auto", padding: "64px 32px" }}>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          color: "var(--text-primary)",
        }}
      >
        Could not open the Engine Room.
      </p>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-muted)",
          marginTop: "8px",
        }}
      >
        {(error as Error)?.message ?? "Unknown error"}
      </p>
      <Button variant="quiet" onClick={reset} style={{ marginTop: "16px" }}>
        Retry
      </Button>
    </div>
  ),
});

function EngineRoomPage() {
  const { room, view, suite, agent, surface } = Route.useSearch();
  const navigate = useNavigate({ from: "/engine-room" });

  if (!room) return <EngineRoomSurface />;

  return (
    <EngineRoomContainer>
      <RoomDetail
        room={room}
        view={view ?? ROOM_TABS[room][0]!.id}
        drill={{ suite, agent, surface }}
        // Switching a sub-tab clears any open drill (the /govern tab
        // contract, inherited): a fresh search object drops suite/agent/
        // surface.
        onSetView={(next) => navigate({ search: { room, view: next } })}
        onBack={() => navigate({ search: {} })}
      />
    </EngineRoomContainer>
  );
}
