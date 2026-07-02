import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/obsidian";
import { Surface } from "@/components/obsidian/Surface";
import { EngineRoomSurface } from "@/components/engine-room/EngineRoomSurface";
import { RoomDetail } from "@/components/engine-room/RoomDetail";
import type { RoomKey } from "@/lib/engine-room-glance";

// OBS-09: the Engine Room ported to Obsidian, one door and four rooms (Spend,
// Quality, Safety, Record). Additive alongside the untouched parchment
// /govern until OBS-10 folds the legacy governance routes into this surface
// and repoints the rail door + `g`. See docs/planning/obsidian-port/OBS-09.md.
const ROOM_KEYS: RoomKey[] = ["spend", "quality", "safety", "record"];

export const Route = createFileRoute("/_authenticated/engine-room")({
  validateSearch: (search: Record<string, unknown>): { room?: RoomKey; view?: string } => ({
    room: ROOM_KEYS.includes(search.room as RoomKey) ? (search.room as RoomKey) : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  component: EngineRoomPage,
  head: () => ({ meta: [{ title: "Engine Room · Cadence" }] }),
  // OBS-02 hoisted the Obsidian shell into _authenticated.tsx, so this route
  // renders bare. No AppShell wrap here.
  errorComponent: ({ error, reset }) => (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "64px 32px" }}>
      <p style={{ fontFamily: "var(--font-ui)", fontSize: "14px", color: "var(--text-primary)" }}>
        Could not open the Engine Room.
      </p>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
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

const DEFAULT_VIEW: Record<RoomKey, string> = {
  spend: "trend",
  quality: "score",
  safety: "rules",
  record: "traces",
};

function EngineRoomPage() {
  const { room, view } = Route.useSearch();
  const navigate = useNavigate({ from: "/engine-room" });

  if (!room) return <EngineRoomSurface />;

  return (
    <Surface>
      <RoomDetail
        room={room}
        view={view ?? DEFAULT_VIEW[room]}
        onSetView={(next) => navigate({ search: { room, view: next } })}
        onBack={() => navigate({ search: {} })}
      />
    </Surface>
  );
}
