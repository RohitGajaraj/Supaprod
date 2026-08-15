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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-15: PORTED TO MERIDIAN. Every `--sp-*` shape is gone from this file;
 * only `Surface`, the shell's own two-column region, is kept, exactly as
 * /approvals keeps it. The parts are in components/engine-room/EngineChrome.tsx.
 *
 * ONE DEFECT WAS FOUND AND CLOSED IN THE PORT, and it is worth naming because
 * nothing in the file admitted it. The next-step sentence was rendered TWICE —
 * once in the context column under `.sp-er-next-aside`, once inline in the page
 * sub under `.sp-er-next-inline` — with a long comment explaining that a
 * container query in `styles/engine-room.css` shows exactly one of them. THAT
 * STYLESHEET DOES NOT EXIST. Neither class is declared anywhere in src/styles,
 * and neither is `.sp-er-crumb`. So the switch had never engaged: both copies
 * drew, at every width, and the crumb had no layout at all. The sentence is now
 * rendered ONCE, in the page sub beside the verdict it belongs to, which is
 * also the position the comment itself called the safe one — the aside can
 * stack below the fold and land under the fixed composer, and the sub never
 * can.
 *
 * THE VERDICT WORDS ARE BOUND TO TOKENS RATHER THAN CHOSEN. "Needs a look" is
 * `--mrd-hold`, amber, which in this system means stopped and NOT on you: a
 * room needs a condition to change, not a decision, and orchid would promise a
 * control that does not exist. "Not set up" carries no hue, because nothing has
 * gone wrong. "Did not load" is `--mrd-fail`, an outcome. A clear room says
 * nothing at all. The full argument is in EngineChrome.tsx's header.
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
import { Surface } from "@/components/meridian/Surface";
import { Crumb, StateWord } from "@/components/engine-room/EngineChrome";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";
import {
  Action,
  Actions,
  Figure,
  PageHeading,
  ReadFailed,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

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
      <div className="flex flex-col gap-mrd-6">
        <PageHeading title="The engine room did not open." />
        <ReadFailed onRetry={reset}>{(error as Error)?.message ?? "The read failed."}</ReadFailed>
      </div>
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
          /* THE TECHNICAL WHISPER, AND ONLY THAT. The next step used to be
             drawn here as well as in the sub above, under a pair of classes
             that were supposed to show exactly one of them; the stylesheet
             those classes needed does not exist, so both drew. The aside is the
             wrong home for it anyway: below the split it stacks under the whole
             room body and can land beneath the fixed composer, which is where
             the original comment measured it. The sub always sits at eye
             level. */
          <div className="flex flex-col gap-mrd-3">
            <h2 className="text-[11px] font-medium tracking-wide text-mrd-mute uppercase">
              The engine calls this
            </h2>
            <p className="text-[12.5px] leading-relaxed text-mrd-body">{meta.technical}</p>
          </div>
        }
      >
        <div className="flex flex-col gap-mrd-6">
          {/* WHERE YOU ARE, AND THE WAY BACK, ON ONE LINE ABOVE THE TITLE.
              The room's NAME was rendered exactly once in the whole chassis, as
              the tablist's `aria-label`, so a screen reader heard "Spend views"
              and a sighted reader had no word for the room they were standing
              in: the title is the question, the rail says "Engine room" on all
              four, and the full `main` innerText of ?room=spend contained no
              "Spend". The question is the room's PURPOSE and stays the title;
              the name is its ADDRESS and belongs here, beside the way out. */}
          <Crumb back={back} backLabel="All four rooms" here={ROOM_NAMES[room]} />

          <div className="flex flex-col gap-mrd-4">
            <PageHeading
              title={ROOM_QUESTIONS[room]}
              sub={
                status?.error != null ? (
                  "This room's summary did not load."
                ) : status?.glance ? (
                  <>
                    {status.glance.verdict}
                    {/* THE NEXT STEP, ONCE. It names a tab that is not on screen
                        yet, and that is the point: this is the sentence that
                        decides what the reader does after reading the verdict,
                        so it sits directly after it. */}
                    {status.glance.action ? <> {status.glance.action}</> : null}
                  </>
                ) : (
                  "Reading."
                )
              }
            />

            {/* The state word rides its own line under the verdict rather than
                being punctuated into it. It is the one fact on this header a
                reader scans for, and a word wedged between two full stops is
                the hardest possible place to find one. */}
            {status?.error != null ? (
              <StateWord state="failed" />
            ) : status?.glance ? (
              <StateWord state={status.glance.state} />
            ) : null}
          </div>

          {/* THE ONE GENUINE TAB ROW of the three that shared `ViewTabs`. It
              swaps the panel below it wholesale, it has no "all", and it
              combines with nothing, so it is what `role="tablist"` actually
              describes. The other two turned out to be a filter and a
              duplicated navigation control; see EngineChrome. */}
          <Tabs
            group={`room-${room}`}
            tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
            active={activeView}
            onSelect={(id) => void navigate({ search: { room, view: id } })}
            label={`${ROOM_NAMES[room]} views`}
          />

          {/* The one plain line that says what this view answers, so a click
              never lands on a bare table with no context. */}
          <TabPanel group={`room-${room}`} active={activeView}>
            <Region sub={meta.descriptor}>
              <Body view={activeView} suite={suite} agent={agent} surface={surface} />
            </Region>
          </TabPanel>
        </div>
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
      <div className="flex flex-col gap-mrd-7">
        <PageHeading title={headline} />

        {/* A column of cards rather than a row-list. Nothing sets a height, so
            a room with six figures is as tall as it needs to be and a room with
            three is not padded out to match it. */}
        <div className="flex flex-col gap-mrd-4">
          <div className="grid gap-mrd-2">{rooms.map((r) => roomCard(r, openRoom))}</div>
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
      </div>
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
        <span className="block text-[13px] font-medium text-mrd-ink">
          {count === 0 ? (
            "Nothing is bound to this workspace yet"
          ) : (
            <>
              <Figure>{count}</Figure> {count === 1 ? "source" : "sources"} bound to this workspace
            </>
          )}
        </span>
        {/* A different fact, and only when there is one: sync stopped on
            something it cannot settle alone, or it could not tell us either
            way. A conflict is AMBER rather than orchid: it is stopped on a
            condition somewhere else, and this row cannot settle it — it can
            only carry you to the surface that can. A read that failed is red,
            which is the outcome it is. */}
        {conflicts.length > 0 ? (
          <span className="mt-0.5 block text-[12px] text-mrd-hold">
            {conflicts.length === 1
              ? "One conflict is waiting on your call"
              : `${conflicts.length} conflicts are waiting on your call`}
          </span>
        ) : syncQ.isError ? (
          <span className="mt-0.5 block text-[12px] text-mrd-fail">
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
        className="shrink-0 text-mrd-faint transition-colors group-hover:text-mrd-body"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
