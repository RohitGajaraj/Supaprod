/**
 * Engine room. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md). The port
 * pass handed it the primitives; this pass made it answer for what is on it.
 *
 * 1. WHO IS HERE, AND WHY. An engineer who suspects the machine did something
 *    wrong (spend jumped, an eval is failing, a guardrail tripped, a run
 *    misbehaved) and came to find out what it actually did. Mechanism words are
 *    correct HERE and almost nowhere else, because that is the vocabulary they
 *    arrived with.
 *
 * 2. THE ONE THING IT EXISTS FOR. To route a suspicion to the exact room and
 *    view that holds the evidence, in one click. The overview is a router with
 *    a real verdict on each door. The evidence itself lives inside the rooms.
 *
 * 3. KEEP / MOVE / KILL, on what the port pass left here:
 *    KEEP  the four room rows and their verdicts. This is the routing decision,
 *          and the verdict is what makes it a decision rather than a menu.
 *    KEEP  the assembled headline. It is the only line that says whether
 *          anything is wrong at all, and it never folds a failed read into a
 *          clear one.
 *    KEEP  the room chassis: the question as the title, the verdict as the sub,
 *          Escape backing out, and the ?room / ?view / ?suite / ?agent /
 *          ?surface contract every deep link in the product depends on.
 *    KILL  the room QUESTION on each overview row ("Spend, what is this costing
 *          me?"). The name and the question are one fact in two registers, and
 *          the question is already the title of the page one click away. The
 *          verdict now rides the name's line and says what the room means far
 *          better than the question did.
 *    KILL  the page sub ("Spend, quality, safety and the record. Approvals find
 *          you on Today..."). Its first half listed the four rows directly
 *          beneath it. Its second half was orientation to a different surface.
 *    KILL  the "The four rooms" block title. The headline above it counts them.
 *    KILL  the "While you worked" panel (runs this week, decisions closed, PRs
 *          shipped). Real numbers, wrong surface: that is a value receipt for a
 *          founder, not machine state for a debugger, and the runs count is
 *          what the Spend room renders in full.
 *          => belongs on TODAY, in the "what happened while you were away"
 *          moment. This pass removed it here and did not add it there.
 *    KILL  the Record room's "Open the public scorecard" aside. The receipts
 *          view inside that same room already carries the share controls and
 *          the tamper seal, so this was a second door to something one click
 *          away inside the room it sat on.
 *    KILL  the "so a stack trace and a screen name the same thing" clause. The
 *          mapping is the information. Explaining the mapping is not.
 *    KILL  the hand-rolled sp-inner/sp-wide/sp-ctx chassis and the inline view
 *          strip. Surface takes `wide` now, and a view switcher is a filter
 *          strip (sp-tabs), not seven equally weighted buttons wrapping onto
 *          two rows.
 *    MOVE  the Connected sources list (five binding rows, an "N more" row and a
 *          separate conflicts row) down to ONE line. Every row opened /sync,
 *          which owns bindings, the connect flow and conflict resolution and
 *          does that job completely. What stays is the only part that is engine
 *          state: how many sources are bound, and whether sync is stuck.
 *          => the list itself belongs to /sync, where it already exists.
 *
 * 4. ONE CLICK AWAY. Everything except the verdict. A room row is one line, the
 *    name plus what it says, and grows a second line only when the room needs a
 *    look or its read failed. The tables, charts, rosters and traces are inside
 *    the room, and the full source list is on /sync.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is "All four rooms are clear" on
 *    one line, from four real reads, on the one surface that exists to find
 *    trouble. The confusion this surface must keep refusing is a failed read
 *    wearing a healthy verdict's clothes, so a room that did not load says so
 *    on its own line, keeps its verdict blank, and offers one retry.
 *
 * The room bodies (SpendRoom, QualityRoom, SafetyRoom, RecordRoom) are
 * untouched: they are the dense tables the engineer came for.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { useEngineRoomGlance, type RoomStatus } from "@/components/engine-room/EngineRoomSurface";
import type { RoomBodyProps } from "@/components/engine-room/RoomDetail";
import { SpendRoom } from "@/components/engine-room/rooms/SpendRoom";
import { QualityRoom } from "@/components/engine-room/rooms/QualityRoom";
import { SafetyRoom } from "@/components/engine-room/rooms/SafetyRoom";
import { RecordRoom } from "@/components/engine-room/rooms/RecordRoom";
import { ROOM_NAMES, ROOM_QUESTIONS, ROOM_TAB_META, type RoomKey } from "@/lib/engine-room-glance";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { listSyncMappings } from "@/lib/integrations.functions";
import {
  Actions,
  Block,
  Button,
  Failed,
  Num,
  PageHead,
  Row,
  Surface,
  Who,
} from "@/components/shell/primitives";

const ROOM_KEYS: RoomKey[] = ["spend", "quality", "safety", "record"];

/** The four bodies. Private in RoomDetail, so the chassis that replaced it
 *  keeps its own map rather than reaching into that module. */
const ROOM_BODY: Record<RoomKey, React.ComponentType<RoomBodyProps>> = {
  spend: SpendRoom,
  quality: QualityRoom,
  safety: SafetyRoom,
  record: RecordRoom,
};

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
  head: () => ({ meta: [{ title: "Engine room · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="The engine room did not open."
        sub={(error as Error)?.message ?? "The read failed."}
      />
      <Actions>
        <Button onClick={reset}>Try again</Button>
      </Actions>
    </Surface>
  ),
});

/**
 * One room's line in the overview.
 *
 * The name leads and the VERDICT rides the same line, because the verdict is
 * the answer and the name alone is a menu item. The second line exists only
 * when there is something a healthy room would not have: a read that failed, or
 * a room that wants a look. A clear engine is therefore four one-line rows.
 *
 * The next-step sentence deliberately does NOT appear here. It names a tab that
 * is not on screen yet, so it does its job completely inside the room and would
 * only be a duplicate out here.
 */
function roomLine(status: RoomStatus): { lead: React.ReactNode; sub?: React.ReactNode } {
  const name = <Who>{ROOM_NAMES[status.key]}</Who>;
  if (status.error !== null) {
    // No verdict. A room that did not load never wears a healthy one's clothes.
    return { lead: name, sub: <span className="sp-fail">{status.error}</span> };
  }
  if (status.loading || status.glance === null) {
    return { lead: <>{name} · Reading.</> };
  }
  return {
    lead: (
      <>
        {name} · {status.glance.verdict}
      </>
    ),
    sub:
      status.glance.state === "watch" ? <span className="sp-warn">Needs a look</span> : undefined,
  };
}

function EngineRoomPage() {
  const { room, view, suite, agent, surface } = Route.useSearch();
  const navigate = useNavigate({ from: "/engine-room" });
  const { rooms } = useEngineRoomGlance();

  // Normalized once, so the strip and the body agree on the open sub-view
  // (an unknown ?view= falls back to the room's front tab).
  const tabs = room ? ROOM_TAB_META[room] : null;
  const activeView =
    room && tabs ? (tabs.some((t) => t.id === view) ? view! : tabs[0]!.id) : undefined;

  const openRoom = React.useCallback(
    (key: RoomKey) => void navigate({ search: { room: key } }),
    [navigate],
  );
  const back = React.useCallback(() => void navigate({ search: {} }), [navigate]);
  const openSync = React.useCallback(
    (conflictId?: string) =>
      void navigate({ to: "/sync", search: conflictId ? { conflict: conflictId } : {} }),
    [navigate],
  );

  // Escape closes the innermost layer only, kept from the retired chassis: an
  // open overlay or a focused field keeps it.
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

  // ---------------------------------------------------------------- one room
  if (room && tabs && activeView) {
    const status = rooms.find((r) => r.key === room);
    const meta = tabs.find((t) => t.id === activeView) ?? tabs[0]!;
    const Body = ROOM_BODY[room];
    return (
      // `wide`: the room bodies are tables, charts and rosters, which lay
      // themselves out in columns rather than being read line by line, so the
      // work column drops the 74ch prose measure.
      <Surface
        wide
        context={
          <>
            {status?.glance?.action ? (
              <>
                <div className="sp-ctx-head">Next</div>
                <div className="sp-ctx-body">{status.glance.action}</div>
              </>
            ) : null}
            <div className="sp-ctx-head">The engine calls this</div>
            <div className="sp-ctx-body">{meta.technical}</div>
          </>
        }
      >
        <PageHead
          title={ROOM_QUESTIONS[room]}
          sub={
            status?.error != null ? (
              <span className="sp-fail">This room&rsquo;s summary did not load.</span>
            ) : status?.glance ? (
              <>
                {status.glance.state === "watch" ? (
                  <>
                    <span className="sp-warn">Needs a look</span>
                    {" · "}
                  </>
                ) : null}
                {status.glance.verdict}
              </>
            ) : (
              "Reading."
            )
          }
        />

        {/* Sub-views of one page, not a second rail. A filter strip stays quiet
            until you reach for it, which is what seven of these need to do. */}
        <div className="sp-tabs" role="tablist" aria-label={`${ROOM_NAMES[room]} views`}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={t.id === activeView}
              onClick={() => void navigate({ search: { room, view: t.id } })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Block sub={meta.descriptor} more="All four rooms" onMore={back}>
          <Body view={activeView} suite={suite} agent={agent} surface={surface} />
        </Block>
      </Surface>
    );
  }

  // ------------------------------------------------------------- the overview
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

  // A fact, assembled from real state. It never claims a count it does not
  // have, and a failed read is never folded into a clear verdict.
  const headline = React.useMemo(() => {
    if (reading) return "Reading the engine.";
    const w = watching.length;
    const f = failed.length;
    const needs = w === 1 ? "One room needs a look." : `${w} rooms need a look.`;
    const broke = f === 1 ? "One room did not load." : `${f} rooms did not load.`;
    if (w > 0 && f > 0) return `${needs} ${broke}`;
    if (f > 0) return broke;
    if (w > 0) return needs;
    return "All four rooms are clear.";
  }, [reading, watching.length, failed.length]);

  return (
    // No context column. The overview's whole job is the routing decision, and
    // nothing else read here was machine state.
    <Surface>
      <PageHead title={headline} />

      <Block>
        {rooms.map((r) => {
          const { lead, sub } = roomLine(r);
          return <Row key={r.key} tight lead={lead} sub={sub} onClick={() => openRoom(r.key)} />;
        })}
        {failed.length > 0 ? (
          <Actions>
            <Button
              variant="ghost"
              onClick={() => {
                for (const r of failed) r.retry();
              }}
            >
              Read the rooms again
            </Button>
          </Actions>
        ) : null}
      </Block>

      <Block title="Reading from">
        <SourcesLine onSync={openSync} />
      </Block>
    </Surface>
  );
}

/**
 * What this workspace reads from, in ONE line.
 *
 * The list that used to be here (five provider rows, an "N more" row and a
 * separate conflicts row) put a copy of /sync's own table on this page, where
 * every row opened /sync anyway. /sync owns bindings, the connect flow and the
 * conflict resolver and does that job completely. Two facts are genuinely
 * engine state and stay: how many sources the rooms are reading from, and
 * whether sync is stuck on something only a person can settle.
 *
 * Both reads keep the cache keys /sync already uses, so this line costs nothing
 * once that page has been open.
 */
function SourcesLine({ onSync }: { onSync: (conflictId?: string) => void }) {
  const fBindings = useServerFn(listWorkspaceBindings);
  const fMappings = useServerFn(listSyncMappings);
  const bindingsQ = useQuery({ queryKey: ["workspace-bindings"], queryFn: () => fBindings() });
  const syncQ = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fMappings() });

  if (bindingsQ.isLoading) return null;
  if (bindingsQ.isError) {
    return (
      <Failed onRetry={() => void bindingsQ.refetch()} retryLabel="Read it again">
        The connection read failed, so this line is not the whole truth.
      </Failed>
    );
  }

  const count = bindingsQ.data?.bindings.length ?? 0;
  const conflicts = ((syncQ.data?.mappings ?? []) as { id: string; conflict: boolean }[]).filter(
    (m) => m.conflict,
  );

  return (
    <Row
      tight
      lead={
        count === 0 ? (
          "Nothing is bound to this workspace yet"
        ) : (
          <>
            <Num>{count}</Num> {count === 1 ? "source" : "sources"} bound to this workspace
          </>
        )
      }
      // A different fact, and only when there is one: sync stopped on something
      // it cannot settle alone, or it could not tell us either way.
      sub={
        conflicts.length > 0 ? (
          <span className="sp-warn">
            {conflicts.length === 1
              ? "One conflict is waiting on your call"
              : `${conflicts.length} conflicts are waiting on your call`}
          </span>
        ) : syncQ.isError ? (
          <span className="sp-fail">
            Sync status did not load, so the conflict count is unknown
          </span>
        ) : undefined
      }
      onClick={() => onSync(conflicts[0]?.id)}
    />
  );
}
