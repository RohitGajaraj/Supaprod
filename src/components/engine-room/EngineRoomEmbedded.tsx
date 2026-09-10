/**
 * P-79: THE ENGINE ROOM'S CONTENT, MOUNTED UNDER TEAM'S OWN URL.
 *
 * This is `_authenticated.engine-room.tsx`'s own former `EngineRoomPage` /
 * `EngineRoomOverview` / `SourcesLine`, moved here whole rather than
 * duplicated: P-61's own ruling was "Crew and spend" is `/team` with the
 * engine room as its spend tab, and this is that move, not a re-skin. Every
 * `useNavigate({ from: "/engine-room" })` call is now `useNavigate({ from:
 * "/team" })`, and every search update carries `tab: "spend"` alongside
 * `room`/`view`, because this content no longer has a route of its own to
 * navigate within -- `/engine-room` is a redirect stub now (see that file).
 *
 * NOTHING ELSE CHANGED. The chassis, the Escape ladder, the crumb, the
 * context aside, the headline arithmetic, the sources line -- all untouched.
 * `EngineChrome.tsx`'s own header still carries the design reasoning for the
 * parts; this file only carries where they are reached from now.
 */
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { useEngineRoomGlance, type RoomStatus } from "@/components/engine-room/EngineRoomSurface";
import {
  RoomGlanceCard,
  RoomGlanceCardFailed,
  RoomGlanceCardPending,
} from "@/components/engine-room/RoomGlanceCard";
import type { RoomBodyProps } from "@/components/engine-room/room-parts";
import { SpendRoom } from "@/components/engine-room/rooms/SpendRoom";
import { QualityRoom } from "@/components/engine-room/rooms/QualityRoom";
import { SafetyRoom } from "@/components/engine-room/rooms/SafetyRoom";
import { RecordRoom } from "@/components/engine-room/rooms/RecordRoom";
import {
  ROOM_NAMES,
  ROOM_QUESTIONS,
  ROOM_TAB_META,
  drawnRoomTabs,
  type RoomKey,
} from "@/lib/engine-room-glance";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { listSyncMappings } from "@/lib/integrations.functions";
import { Surface } from "@/components/meridian/Surface";
import { Crumb, StateWord } from "@/components/engine-room/EngineChrome";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Action,
  Actions,
  Figure,
  PageHeading,
  ReadFailed,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

/** The four room keys, exported so the redirect and the tab can share one
 *  list rather than each writing its own (P-79's own guard). */
export const ROOM_KEYS: RoomKey[] = ["spend", "quality", "safety", "record"];

const ROOM_BODY: Record<RoomKey, React.ComponentType<RoomBodyProps>> = {
  spend: SpendRoom,
  quality: QualityRoom,
  safety: SafetyRoom,
  record: RecordRoom,
};

/** The five fields this content reads, unchanged in name and shape from
 *  `/engine-room`'s own former search -- except `agent`, renamed
 *  `roomAgent` here because Team's own `?agent=` already names a crew
 *  member. The redirect translates the old name to the new one. */
export type EngineRoomEmbeddedSearch = {
  room?: RoomKey;
  view?: string;
  suite?: string;
  roomAgent?: string;
  surface?: string;
};

function roomCard(status: RoomStatus, openRoom: (key: RoomKey) => void): React.ReactNode {
  if (status.error !== null) {
    return (
      <RoomGlanceCardFailed
        key={status.key}
        room={status.key}
        message={status.error}
        onRetry={status.retry}
      />
    );
  }
  if (status.loading || status.glance === null) {
    return <RoomGlanceCardPending key={status.key} room={status.key} />;
  }
  return (
    <RoomGlanceCard key={status.key} glance={status.glance} onOpen={() => openRoom(status.key)} />
  );
}

export function EngineRoomEmbedded({
  room,
  view,
  suite,
  roomAgent,
  surface,
}: EngineRoomEmbeddedSearch) {
  const navigate = useNavigate({ from: "/team" });
  const { rooms } = useEngineRoomGlance();

  const tabs = room ? ROOM_TAB_META[room] : null;
  const activeView =
    room && tabs ? (tabs.some((t) => t.id === view) ? view! : tabs[0]!.id) : undefined;

  const openRoom = React.useCallback(
    (key: RoomKey) => void navigate({ search: (prev) => ({ ...prev, tab: "spend", room: key }) }),
    [navigate],
  );
  const back = React.useCallback(() => void navigate({ search: { tab: "spend" } }), [navigate]);
  const openSync = React.useCallback(
    (conflictId?: string) =>
      void navigate({ to: "/sources", search: conflictId ? { conflict: conflictId } : {} }),
    [navigate],
  );

  // See `_authenticated.engine-room.tsx`'s former header for the full Escape
  // ladder reasoning; unchanged here.
  React.useEffect(() => {
    if (!room) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.closest("input, textarea, select, [contenteditable='true']") ||
          t.closest("[role='dialog'], [role='menu'], [role='listbox']"))
      ) {
        return;
      }
      back();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [room, back]);

  if (room && tabs && activeView) {
    const status = rooms.find((r) => r.key === room);
    const meta = tabs.find((t) => t.id === activeView) ?? tabs[0]!;
    const Body = ROOM_BODY[room];
    return (
      <Surface
        wide
        context={
          <div className="flex flex-col gap-mrd-3">
            <h2 className="text-mrd-tiny font-medium tracking-wide text-mrd-mute uppercase">
              The engine calls this
            </h2>
            <p className="leading-mrd-prose text-mrd-prose text-mrd-body">{meta.technical}</p>
          </div>
        }
      >
        <div className="flex flex-col gap-mrd-6">
          <Crumb back={back} backLabel="Spend and limits" here={ROOM_NAMES[room]} />

          <div className="flex flex-col gap-mrd-4">
            <PageHeading
              title={ROOM_QUESTIONS[room]}
              sub={
                status?.error != null ? (
                  "There is no verdict for this room right now."
                ) : status?.glance ? (
                  <>
                    {status.glance.verdict}
                    {status.glance.action ? <> {status.glance.action}</> : null}
                  </>
                ) : (
                  "Reading."
                )
              }
            />

            {status?.error != null ? (
              <StateWord state="failed" />
            ) : status?.glance ? (
              <StateWord state={status.glance.state} />
            ) : null}
          </div>

          <Tabs
            group={`room-${room}`}
            tabs={drawnRoomTabs(room, activeView).map((t) => ({ id: t.id, label: t.label }))}
            active={activeView}
            onSelect={(id) =>
              void navigate({ search: (prev) => ({ ...prev, tab: "spend", room, view: id }) })
            }
            label={`${ROOM_NAMES[room]} views`}
          />

          <TabPanel group={`room-${room}`} active={activeView}>
            <Region sub={meta.descriptor}>
              <Body view={activeView} suite={suite} agent={roomAgent} surface={surface} />
            </Region>
          </TabPanel>
        </div>
      </Surface>
    );
  }

  return <EngineRoomOverview rooms={rooms} openRoom={openRoom} openSync={openSync} />;
}

function EngineRoomOverview({
  rooms,
  openRoom,
  openSync,
}: {
  rooms: RoomStatus[];
  openRoom: (key: RoomKey) => void;
  openSync: (conflictId?: string) => void;
}) {
  const reading = rooms.some((r) => r.loading);
  const failed = rooms.filter((r) => r.error !== null);
  const watching = rooms.filter((r) => r.glance !== null && r.glance.state === "watch");
  const unset = rooms.filter((r) => r.glance !== null && r.glance.state === "unconfigured");

  const headline = React.useMemo(() => {
    if (reading) return "Reading the engine.";
    const w = watching.length;
    const f = failed.length;
    const u = unset.length;
    const clauses: string[] = [];
    if (w > 0) clauses.push(w === 1 ? "One room needs a look." : `${w} rooms need a look.`);
    if (u > 0) clauses.push(u === 1 ? "One room is not set up." : `${u} rooms are not set up.`);
    if (f > 0) clauses.push(f === 1 ? "One room did not load." : `${f} rooms did not load.`);
    if (clauses.length === 0) return "All four rooms are clear.";
    return clauses.join(" ");
  }, [reading, watching.length, unset.length, failed.length]);

  return (
    <Surface wide>
      <div className="flex flex-col gap-mrd-7">
        <PageHeading title={headline} />

        <div className="flex flex-col gap-mrd-4">
          <div className="grid gap-mrd-4">{rooms.map((r) => roomCard(r, openRoom))}</div>
          {failed.length > 0 ? (
            <Actions>
              <Action
                onClick={() => {
                  for (const r of failed) r.retry();
                }}
              >
                Read the rooms again
              </Action>
            </Actions>
          ) : null}
        </div>

        <Region title="Reading from">
          <SourcesLine onSync={openSync} />
        </Region>

        {/*
         * ── "OPEN THE DESIGN SYSTEM" WAS A DOOR ONTO THE HOME PAGE ──────────
         *
         * Cut 2026-09-10. This Region's Door navigated to `/meridian`, and
         * that route's own `beforeLoad` throws `redirect({ to: SIGNED_IN_HOME })`
         * unless `import.meta.env.DEV` (P-10: the gallery renders fabricated
         * data and a customer must never meet it). So for every person who is
         * not us, pressing it left Team and landed on Home -- the failure
         * ApprovalsPanel named on the same day: a link to the home page
         * silently loses your place and looks like it worked.
         *
         * NOT MADE DEV-ONLY, DELETED. `route-inventory.test.ts`'s own
         * exemption for `/meridian` says it is "reached by typing the URL ON A
         * DEV SERVER ONLY" and ends "Delete this exemption if it ever gets a
         * door." This was that door, contradicting the exemption in prose that
         * nothing could check. The gallery is a workbench, not a region of a
         * customer's engine room, and typing the URL on a dev server is the
         * access path the repo has already ruled for it.
         */}
      </div>
    </Surface>
  );
}

function SourcesLine({ onSync }: { onSync: (conflictId?: string) => void }) {
  const fBindings = useServerFn(listWorkspaceBindings);
  const fMappings = useServerFn(listSyncMappings);
  const { activeWorkspaceId } = useWorkspace();
  const bindingsQ = useQuery({
    /* P-75: the key and the call both name the workspace, or one cache entry
       is shared across every workspace a person holds and Sources names another
       desk's repository as something this one may read. */
    queryKey: ["workspace-bindings", activeWorkspaceId ?? null],
    queryFn: () => fBindings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const syncQ = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fMappings() });

  if (bindingsQ.isLoading) return <Reading>Reading the connections.</Reading>;
  if (bindingsQ.isError) {
    return (
      <ReadFailed onRetry={() => void bindingsQ.refetch()} retryLabel="Read it again">
        The connection read failed, so this line is not the whole truth.
      </ReadFailed>
    );
  }

  const count = bindingsQ.data?.bindings.length ?? 0;
  const conflicts = ((syncQ.data?.mappings ?? []) as { id: string; conflict: boolean }[]).filter(
    (m) => m.conflict,
  );

  return (
    <button
      type="button"
      data-mrd=""
      onClick={() => onSync(conflicts[0]?.id)}
      className="group flex w-full items-center gap-mrd-4 rounded-mrd-ctl border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-mrd-base font-medium text-mrd-ink">
          {count === 0 ? (
            "Nothing is bound to this workspace yet"
          ) : (
            <>
              <Figure>{count}</Figure> {count === 1 ? "source" : "sources"} bound to this workspace
            </>
          )}
        </span>
        {conflicts.length > 0 ? (
          <span className="mt-0.5 block text-mrd-small text-mrd-hold">
            {conflicts.length === 1
              ? "One conflict is waiting on your call"
              : `${conflicts.length} conflicts are waiting on your call`}
          </span>
        ) : syncQ.isError ? (
          <span className="mt-0.5 block text-mrd-small text-mrd-fail">
            Sync status did not load, so the conflict count is unknown
          </span>
        ) : null}
      </span>
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="shrink-0 text-mrd-faint transition-colors group-hover:text-mrd-prose text-mrd-body"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

export default EngineRoomEmbedded;
