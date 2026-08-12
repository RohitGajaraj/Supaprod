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
 * 4. ONE CLICK AWAY. The tables, charts, rosters and traces are inside the
 *    room, and the full source list is on /sync.
 *
 *    AMENDED 2026-08-06. This said "a room row is one line, the name plus what
 *    it says", and the founder's verdict on that shape was: "We have four
 *    sections but those are NOT SPEAKING TO THE VOLUMES AND DEPTH until and
 *    unless the user clicks and checks." He was describing a real waste, not a
 *    taste: `useEngineRoomGlance` makes nine server reads and the four rows
 *    rendered four sentences of them, dropping the call count, the token
 *    volume, the day-over-day move, the costliest model, the judge score, the
 *    open drift, the guardrail floor, the recorded steps and the sealed
 *    receipts. A row is now a card carrying those figures, the room's newest
 *    dated event and its next step. Nothing was made smaller to fit them; the
 *    argument for where the room came from is in RoomGlanceCard.tsx's header.
 *    The evidence itself still lives inside the rooms.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is "All four rooms are clear" on
 *    one line, from four real reads, on the one surface that exists to find
 *    trouble. The confusion this surface must keep refusing is a failed read
 *    wearing a healthy verdict's clothes, so a room that did not load says so
 *    on its own line, keeps its verdict blank, and offers one retry.
 *
 *    A SECOND CONFUSION, closed the same day: an UNSET room wearing a clear
 *    one's clothes. `buildSafetyGlance` returned healthy whenever no incident
 *    had been recorded, so a workspace that had never switched a guardrail on
 *    was counted into "All four rooms are clear" — the reading for seventeen of
 *    the twenty-one workspaces in the live database. The headline now counts
 *    that case in its own clause, because nothing has gone wrong in a room
 *    nobody has set up and sending someone to "look at" it would be the wrong
 *    instruction.
 *
 * The room bodies (SpendRoom, QualityRoom, SafetyRoom, RecordRoom) are
 * untouched: they are the dense tables the engineer came for.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { useEngineRoomGlance, type RoomStatus } from "@/components/engine-room/EngineRoomSurface";
import {
  RoomGlanceCard,
  RoomGlanceCardFailed,
  RoomGlanceCardPending,
} from "@/components/engine-room/RoomGlanceCard";
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
  Loading,
  Num,
  PageHead,
  Row,
  Surface,
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
  /**
   * THE DOCUMENT TITLE CARRIES THE ROOM, and it used to be one hardcoded string
   * for all five URLs. Five distinct pages sharing one title makes browser
   * history unusable: back through Spend, Safety and Record and every entry
   * reads "Engine room · Supaprod", so the list cannot tell you where you have
   * been. `match.search` is the same validated object the component reads, so
   * the tab and the page can never disagree about which room is open.
   */
  head: ({ match }) => {
    const open = match.search.room;
    return {
      meta: [
        { title: open ? `${ROOM_NAMES[open]} · Engine room · Supaprod` : "Engine room · Supaprod" },
      ],
    };
  },
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
 * One room's door in the overview.
 *
 * WAS a single `Row`: the name, the verdict, and a "Needs a look" second line.
 * Founder, 2026-08-06: "We have four sections but those are NOT SPEAKING TO THE
 * VOLUMES AND DEPTH until and unless the user clicks and checks." The verdict
 * is one sentence assembled from nine server reads, and the rest of what those
 * reads returned was being dropped, so the router had a name and a headline on
 * each door and nothing to choose between them with. `RoomGlanceCard` carries
 * the same name and the same verdict plus the volumes behind it, the room's
 * newest dated event, and the next step. Where the vertical room comes from,
 * and what was NOT shrunk to pay for it, is argued in that file's header.
 *
 * The next-step sentence now DOES appear here. The note it replaces said it was
 * withheld because it names a tab that is not on screen yet; it still does, and
 * that is now the point, because the overview is where you choose which room to
 * open and "raise it in Limits" is the fact that chooses it. The room's own
 * context column keeps its copy, so nothing moved out of the room.
 */
function roomCard(status: RoomStatus, openRoom: (key: RoomKey) => void): React.ReactNode {
  if (status.error !== null) {
    // No verdict and no figures. A room that did not load never wears a healthy
    // one's clothes, and it certainly never wears its volumes.
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

  /**
   * BACKING OUT OF A ROOM IS THE OUTERMOST THING ESCAPE CAN DO, so this is the
   * last rung of the ladder and it stays there: `window`, BUBBLE phase, which is
   * the final stop on a key event's propagation path. Every layer that can sit
   * over this page (the lineage pane on window capture, MoreMenu on document
   * capture, Ask on document bubble) hears the press earlier and calls
   * stopPropagation, so this handler only ever runs when the room is genuinely
   * the innermost open thing. The full ladder is documented on the lineage
   * pane's own Escape handler in components/supaprod/AuditLineageSheet.tsx.
   *
   * DO NOT MOVE THIS TO CAPTURE to fix some other surface. Being last is the
   * whole contract, and losing it is what caused the defect the ladder exists
   * for: one press used to leave the room AND close Ask AND close the trail,
   * because all three listened in the same phase on the same node and mount
   * order decided the winner.
   *
   * THE TWO GUARDS BELOW ARE NOT THAT MECHANISM and never could be. They are
   * about the target: a focused field and a real dialog keep the key. Both Ask
   * and the lineage pane are `role="complementary"` on purpose (they sit beside
   * the work rather than over it), so neither matches the dialog test, and while
   * an answer streams the composer is disabled and focus has fallen to <body>,
   * so neither matches the field test either. They are kept because they are
   * right about what they cover, not because they cover this.
   */
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
            {/* NEXT RIDES THE SUB WHEN THE ASIDE IS AT THE PAGE FLOOR, and this
                pair of classes is the whole switch. Below `--sp-ctx-split` the
                aside stacks under the entire room body: measured on ?room=record
                at 1280 with the rail expanded, `.sp-ctx` was 983px wide at
                y=786.3 of a 900px viewport, with its last line drawn beneath the
                fixed composer. So the one line the reader came to act on sat at
                eye level in one rail state and under the dock in the other. The
                copy is rendered in both places and exactly one is shown; the
                rules live in styles/engine-room.css beside the numbers. */}
            {status?.glance?.action ? (
              <>
                <div className="sp-ctx-head sp-er-next-aside">Next</div>
                <div className="sp-ctx-body sp-er-next-aside">{status.glance.action}</div>
              </>
            ) : null}
            <div className="sp-ctx-head">The engine calls this</div>
            <div className="sp-ctx-body">{meta.technical}</div>
          </>
        }
      >
        {/* WHERE YOU ARE, AND THE WAY BACK, ON ONE LINE ABOVE THE TITLE.
            The room's NAME was rendered exactly once in the whole chassis, as
            the tablist's `aria-label`, so a screen reader heard "Spend views"
            and a sighted reader had no word for the room they were standing in:
            the title is the question, the rail says "Engine room" on all four,
            and the full `main` innerText of ?room=spend contained no "Spend".
            The question is the room's PURPOSE and stays the title; the name is
            its ADDRESS and belongs here, beside the way out. The back control
            came from the Block head 224px down the page, right-aligned with an
            empty cell to its left, which is not where anyone looks for it. */}
        <div className="sp-er-crumb">
          <button type="button" className="sp-block-more" onClick={back}>
            All four rooms
          </button>
          <span aria-hidden="true">·</span>
          <span className="sp-er-crumb-here">{ROOM_NAMES[room]}</span>
        </div>

        <PageHead
          title={ROOM_QUESTIONS[room]}
          sub={
            status?.error != null ? (
              <span className="sp-fail">This room&rsquo;s summary did not load.</span>
            ) : status?.glance ? (
              <>
                {/* The unconfigured state gets its own word here for the same
                    reason it gets one on the card: it is the absence of a
                    control, not a fault, and putting it in warn amber beside
                    real trouble is how a governance surface teaches people to
                    stop reading its colours. Without this clause a room in that
                    state showed a bare verdict and the reader had to infer the
                    state from the sentence. */}
                {status.glance.state === "watch" ? (
                  <>
                    <span className="sp-warn">Needs a look</span>
                    {" · "}
                  </>
                ) : status.glance.state === "unconfigured" ? (
                  <>
                    <span style={{ color: "var(--sp-mute)" }}>Not set up</span>
                    {" · "}
                  </>
                ) : null}
                {status.glance.verdict}
                {/* The other half of the switch above. Shown only when the
                    aside has stacked to the page floor. */}
                {status.glance.action ? (
                  <span className="sp-er-next-inline">
                    {" · "}
                    {status.glance.action}
                  </span>
                ) : null}
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

        {/* No `more` here any more: the way out is the crumb above the title.
            A Block with a `more` and no `title` renders a head whose left cell
            is an empty <span>, so "All four rooms" sat alone at the far right of
            a 983px band, which reads as a stray link rather than as the exit. */}
        <Block sub={meta.descriptor}>
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
  const unset = rooms.filter((r) => r.glance !== null && r.glance.state === "unconfigured");

  /**
   * A fact, assembled from real state. It never claims a count it does not
   * have, and a failed read is never folded into a clear verdict.
   *
   * `unset` joined the arithmetic 2026-08-06 with the Safety room's
   * `unconfigured` state, and it had to. Seventeen of the twenty-one workspaces
   * in the live database have no guardrail rules at all, so before that state
   * existed this line told the clear majority of workspaces that all four rooms
   * were clear while one of them had never been switched on. It reads as its
   * own clause rather than being folded into "needs a look", because nothing
   * has gone wrong in an unconfigured room and telling someone to go look at a
   * room that is merely empty is how a status line stops being read.
   */
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
    // No context column. The overview's whole job is the routing decision, and
    // nothing else read here was machine state.
    //
    // `wide`, and it was missing. The prop's own docstring states the test: the
    // 74ch measure exists so a LINE OF PROSE stays readable and is the wrong
    // constraint for anything laid out in columns. Every card on this page is a
    // `repeat(auto-fill, minmax(132px, 1fr))` figure grid, so it is on the
    // columns side of that rule for exactly the reason the room bodies are.
    //
    // MEASURED AT 1280 BEFORE THIS LINE. Rail expanded (work region 1044px):
    // `.sp-main` was 636.1px ending at 902.4 while the composer ended at 1240,
    // two right edges 337.6px apart with 36% of the region dead black. Rail
    // COLLAPSED (region 1216px) the column did not grow, it only slid left: the
    // gap became 504.7px. So collapsing the rail, whose whole job is to give the
    // work more room, gave this page none. Opening a room then jumped the
    // content 347.4px wider, because line 277 already passes `wide`. One right
    // edge now, on the overview and in its own rooms alike.
    <Surface wide>
      <PageHead title={headline} />

      {/* A column of cards rather than a row-list. The gap is the system's
          between-components step; nothing sets a height, so a room with six
          figures is as tall as it needs to be and a room with three is not
          padded out to match it. */}
      <Block>
        <div style={{ display: "grid", gap: "var(--sp-space-2)" }}>
          {rooms.map((r) => roomCard(r, openRoom))}
        </div>
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

  /* The parent has already printed the "Reading from" heading by the time this
     renders, so returning null leaves a section title standing over nothing,
     which reads as a broken page rather than a slow one. The error arm below
     was written carefully and the loading arm was not, which is the usual
     shape: failure gets designed because someone imagines it, and waiting gets
     skipped because the developer's own machine is fast. */
  if (bindingsQ.isLoading) return <Loading>Reading the connections.</Loading>;
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
