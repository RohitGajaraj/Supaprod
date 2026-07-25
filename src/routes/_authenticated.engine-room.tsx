import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { TopBar } from "@/components/supaprod/TopBar";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  EngineRoomGlance,
  EngineRoomContainer,
  useEngineRoomGlance,
} from "@/components/engine-room/EngineRoomSurface";
import { RoomDetail, ROOM_TABS } from "@/components/engine-room/RoomDetail";
import { RoomRail } from "@/components/engine-room/RoomRail";
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
  head: () => ({ meta: [{ title: "Pulse · Supaprod" }] }),
  // OBS-02 hoisted the Obsidian shell into _authenticated.tsx, so this route
  // renders bare. No AppShell wrap here.
  errorComponent: ({ error, reset }) => (
    <div
      style={{
        width: "100%",
        maxWidth: "var(--container-standard)",
        margin: "0 auto",
        padding: "64px 32px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--tempo-text-base)",
          color: "var(--text-primary)",
        }}
      >
        Could not open Pulse.
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
  const { rooms } = useEngineRoomGlance();
  const { activeWorkspace } = useWorkspace();

  // Normalize the view once so the rail and the detail agree on the active
  // sub-tab (an unknown ?view= falls back to the room's front tab).
  const tabs = room ? ROOM_TABS[room] : null;
  const activeView =
    room && tabs ? (tabs.some((t) => t.id === view) ? view! : tabs[0]!.id) : undefined;

  return (
    <>
      <TopBar crumbs={[activeWorkspace?.name ?? "Workspace", "Pulse"]} />
      <EngineRoomContainer>
        {/* IA 2026-07-11: the persistent room switcher. The rail (rooms + view
          sub-tabs, Vercel project-settings pattern) stays visible from the
          glance and from any room depth; the content column swaps. */}
        <div
          className="flex flex-col md:grid"
          style={{ gridTemplateColumns: "196px minmax(0, 1fr)", gap: 32, alignItems: "start" }}
        >
          <RoomRail
            room={room}
            view={activeView}
            rooms={rooms}
            onOverview={() => navigate({ search: {} })}
            onSelect={(nextRoom, nextView) =>
              navigate({ search: { room: nextRoom, view: nextView } })
            }
          />
          {!room ? (
            <EngineRoomGlance />
          ) : (
            <RoomDetail
              room={room}
              view={activeView!}
              drill={{ suite, agent, surface }}
              // Switching a sub-tab clears any open drill (the /govern tab
              // contract, inherited): a fresh search object drops suite/agent/
              // surface.
              onSetView={(next) => navigate({ search: { room, view: next } })}
              onBack={() => navigate({ search: {} })}
            />
          )}
        </div>
      </EngineRoomContainer>
    </>
  );
}
