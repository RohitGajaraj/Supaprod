/**
 * Starting a piece of work, and giving it a route through the seven stations.
 *
 * FOUNDER RULING 2026-08-01, the one this whole object exists for: the loop is a
 * ROUTE, not a conveyor. Work does not always begin at Discover and does not
 * always visit every station. "There might be scenarios that only certain parts
 * of the loop cycle would be needed... this particular loop can avoid the design
 * strip and move directly from plan to build. And what happens to already
 * existing product... I'll select the two, three, and five, and seven."
 *
 * WHY THIS LIVES ON PLAN. The case with no representation anywhere in the
 * product was the most common one a real customer has: work on a product that
 * already exists. It has no signal and no theme behind it, so it has no lineage
 * root, so before the track object there was literally nothing to name it. That
 * work enters at Plan, so the door belongs here.
 *
 * WHY A SHAPE AND NOT SEVEN CHECKBOXES. Asking a person to tick which of seven
 * stations their work will visit is asking them to know the model before they
 * have used it. Naming the shape of the work in their own language and letting
 * the product propose the route is the same decision with none of the learning
 * curve, and every waiver it proposes is visible, reasoned and reversible. The
 * route is a proposal; nothing here is final.
 *
 * WHAT IT WILL NOT DO. It will not start work that entered below Discover with
 * no stated reason. `validateRoute` refuses it server-side and this surface says
 * why, because work with no evidence AND no stated intent is the exact record
 * Learn cannot grade an outcome against later.
 *
 * WHY THE LIST CARRIES A CONTROL AT ALL, given that the whole point of the
 * driver is that nobody has to watch. `advanceTrack` existed with no caller
 * anywhere in the product, so the ONLY thing that could move a piece of work was
 * the autonomous sweep. That is fine on the day the sweep is running and it is
 * the entire product on the day it is not: a track parked on `no-agent` or
 * `stalled` would sit there forever with the reason printed on it and no way for
 * the person reading the reason to act on it. Policy is set in advance and does
 * not block; it does not follow that a person may never move their own work.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  advanceTrack,
  listTracks,
  retryStation,
  startTrack,
  type Track,
} from "@/lib/spine/track.functions";
import { TrackChain } from "@/components/spine/TrackChain";
import { TrackActivity } from "@/components/spine/TrackActivity";
import { nextStation, WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";
import { HOLD_LINE } from "@/lib/spine/driver";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import {
  Actions,
  Block,
  Button,
  Empty,
  Field,
  Input,
  MoreItem,
  MoreMenu,
  Receipt,
  Row,
  Textarea,
  Value,
} from "@/components/shell/primitives";

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];

/** Shapes that begin below Discover, and therefore owe a reason for existing. */
const NEEDS_ORIGIN: ReadonlySet<WorkShape> = new Set<WorkShape>([
  "existing-feature",
  "interface-change",
  "under-the-hood",
  "incident-fix",
]);

/** What a move left behind. Rendered as a Receipt, never as a toast. */
type MoveReceipt = { verb: string; consequence: React.ReactNode; failed?: boolean };

export function TrackStart() {
  const qc = useQueryClient();
  const fStart = useServerFn(startTrack);
  const fList = useServerFn(listTracks);
  const fAdvance = useServerFn(advanceTrack);
  const fRetry = useServerFn(retryStation);

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [shape, setShape] = React.useState<WorkShape | null>(null);
  const [origin, setOrigin] = React.useState("");
  const [problems, setProblems] = React.useState<string[]>([]);
  const [started, setStarted] = React.useState<Track | null>(null);
  const [moved, setMoved] = React.useState<MoveReceipt | null>(null);
  /** The track whose close is armed, waiting for a second press. */
  const [confirmClose, setConfirmClose] = React.useState<string | null>(null);
  /**
   * The track whose record is open, if any. One at a time: this list answers
   * "where is my work", and seven stops unfolded under every row would bury the
   * question the list exists to answer.
   */
  const [showing, setShowing] = React.useState<string | null>(null);

  const tracks = useQuery({ queryKey: ["spine-tracks"], queryFn: () => fList() });

  const start = useMutation({
    mutationFn: () =>
      fStart({
        data: {
          title: title.trim(),
          shape: shape as WorkShape,
          origin: origin.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      if (!res.track) {
        setProblems(res.problems);
        return;
      }
      setStarted(res.track);
      setProblems([]);
      setOpen(false);
      setTitle("");
      setShape(null);
      setOrigin("");
      void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
    },
    onError: (e: Error) => setProblems([e.message]),
  });

  /**
   * Move one track to the station its own route says comes next.
   *
   * WHAT THE SERVER ACTUALLY DOES, read rather than assumed, because everything
   * below depends on it. `advanceTrack` reads the row, asks `nextStation` for
   * the next station ON THAT ROUTE, and writes it. If the route is finished it
   * writes `status: "done"` instead. It consults nothing else: not the hold, not
   * the kill switch, not the pending calls. So every judgment about when this is
   * offered has to be made here, and it has to be made honestly.
   *
   * THE HONESTY GUARD, and it is not theoretical. When the UPDATE returns no row
   * the handler falls back to returning the track it read BEFORE the write, with
   * `arrivedAt` still set to the station it intended to reach. Rendering the
   * receipt off `arrivedAt` would therefore announce an arrival that never
   * happened. So the receipt is written from what came back: if the track is
   * still open AND still at the station it was at when the click happened, then
   * nothing moved, and the surface says so instead of congratulating anyone.
   */
  const hand = useMutation({
    mutationFn: (t: Track) => fAdvance({ data: { trackId: t.id } }),
    onSuccess: (res, t) => {
      // Re-read either way. A failed move is exactly when the list on screen is
      // least trustworthy, so it is the worst moment to leave a stale one up.
      void qc.invalidateQueries({ queryKey: ["spine-tracks"] });

      // The server now says WHY in its own words rather than leaving the client
      // to infer a cause from a station comparison. It refuses on a kill switch,
      // and it declines to narrate a cause it cannot know when an update comes
      // back unconfirmed. Repeating its sentence is the only honest option here:
      // the client knows strictly less than the handler did.
      if (res.refused) {
        setMoved({ verb: "It did not move", consequence: res.refused, failed: true });
        return;
      }
      if (!res.track) {
        setMoved({
          verb: "It did not move",
          consequence: `${t.title} did not come back, so nothing here is certain.`,
          failed: true,
        });
        return;
      }
      if (res.track.status !== "open") {
        // NOT "it has been graded", which is what the driver's own done line
        // says. The driver says that because it only ever reaches the end after
        // Learn has run; a person pressing this reaches it because the route ran
        // out, and Learn can itself be waived. Closing the track is the whole of
        // what this write did, so closing the track is the whole of what the
        // receipt claims. It also explains the row vanishing, which `listTracks`
        // causes by returning only open work.
        setMoved({
          verb: "You closed it out",
          // THE CLAIM THIS PRODUCT MUST NEVER MAKE is a completed lap that did
          // not happen, and closing a track out is the moment it would be made.
          consequence: `${t.title} reached the end of its route, so it leaves this list.${
            res.emptyStation
              ? ` ${AGENT_STATIONS[res.emptyStation as AgentStation]?.name ?? res.emptyStation} filed nothing, so the record of this work has a gap at that station.`
              : ""
          }`,
        });
        return;
      }
      // Where it goes AFTER this one, straight off the route that came back.
      // Costs nothing, is provable, and is the one thing a person cannot see
      // from the row.
      const after = nextStation(res.track.route, res.track.station);
      /**
       * SAYS WHEN THE STATION YOU LEFT HANDED NOTHING ON.
       *
       * `advanceTrack` consults the kill switch and nothing else, so a person can
       * walk a track through its whole remaining route with an empty member list
       * and the board would report a completed lap that never happened. Refusing
       * the move would be wrong: the canon is explicit that carrying your own work
       * forward is a decision you are allowed to make. What was wrong was the
       * silence, so the receipt now states it.
       *
       * Named as a FACT about the record rather than a warning, because the person
       * chose this and does not need to be told off for it. What they need is to
       * know the next station has nothing from this one to read, since that is
       * what will make it stop.
       */
      const emptyNote = res.emptyStation
        ? ` ${AGENT_STATIONS[res.emptyStation as AgentStation]?.name ?? res.emptyStation} filed nothing, so the next station has nothing from it to work from.`
        : "";
      setMoved({
        verb: "You handed it on",
        consequence: `${t.title} is at ${AGENT_STATIONS[res.track.station].name}. ${
          after
            ? `Its route goes to ${AGENT_STATIONS[after].name} after that.`
            : "That is the last station on its route."
        }${emptyNote}`,
      });
    },
    onError: (e: Error, t) =>
      setMoved({
        verb: "It did not move",
        consequence: `${t.title} is still at ${AGENT_STATIONS[t.station].name}. ${e.message}`,
        failed: true,
      }),
  });

  /**
   * Let the station that stopped run again, without skipping it.
   *
   * THE CONTROL THIS LIST DID NOT HAVE. A held track had two moves: hand it to
   * the next station, or call it finished. Neither is "try again", so a track
   * holding `station-cannot-finish` or `given-up`, both of which no code path
   * clears, was dead to its owner: skip the station that could not finish, or
   * close the work. A person who fixed the real cause outside the product, by
   * connecting a source or topping the account up or writing the missing spec,
   * had no way to say so and the driver never looked again.
   *
   * It says the STATION runs again rather than that the work moved, because it
   * did not move. The next tick does the driving; nothing is dispatched here.
   */
  const release = useMutation({
    mutationFn: (t: Track) => fRetry({ data: { trackId: t.id } }),
    onSuccess: (res, t) => {
      void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
      if (res.refused) {
        setMoved({ verb: "Nothing was released", consequence: res.refused, failed: true });
        return;
      }
      setMoved({
        verb: "You released it",
        consequence: `${AGENT_STATIONS[t.station].name} runs again on ${t.title} at the next sweep. Nothing has been charged for it yet.`,
      });
    },
    onError: (e: Error, t) =>
      setMoved({
        verb: "Nothing was released",
        consequence: `${t.title} is still held at ${AGENT_STATIONS[t.station].name}. ${e.message}`,
        failed: true,
      }),
  });
  const list = tracks.data ?? [];
  const needsOrigin = shape !== null && NEEDS_ORIGIN.has(shape);
  const ready = title.trim().length > 0 && shape !== null && (!needsOrigin || origin.trim());

  return (
    <Block
      title="Work in flight"
      sub="Each one carries its own route through the seven stations, including the ones it waives and why."
      more={open ? "Never mind" : "Start work"}
      onMore={() => {
        setOpen((v) => !v);
        setProblems([]);
      }}
    >
      {/* The receipt names the route rather than saying "created", because the
        route is the only thing about this that a person could not have
        predicted, and the whole point is that they see it before it runs. */}
      {started ? (
        <Receipt
          verb="Work started"
          consequence={
            <>
              {started.title} begins at {AGENT_STATIONS[started.entry].name}. {started.summary}
            </>
          }
        />
      ) : null}

      {problems.length > 0 ? (
        <Receipt verb="It did not start" consequence={problems.join(" ")} failed />
      ) : null}

      {/* One receipt area for the block, not one per row. A receipt drawn
        between two rows breaks the rhythm of the list it is reporting on, and
        the row itself already re-renders at its new station, so this line is
        here to name the consequence rather than to be the only feedback. */}
      {moved ? (
        <Receipt verb={moved.verb} consequence={moved.consequence} failed={moved.failed} />
      ) : null}

      {open ? (
        <>
          <Field label="What is the work">
            <Input
              value={title}
              autoFocus
              placeholder="Add SSO to the admin console"
              onChange={(e) => setTitle(e.currentTarget.value)}
            />
          </Field>

          {/* Their language, not the model's. A person picks the sentence that
            describes their situation; the product derives the route. */}
          <Field label="What kind of work is it">
            <div className="sp-choices" role="radiogroup" aria-label="What kind of work is it">
              {SHAPES.map((s) => (
                <Button
                  key={s}
                  variant={shape === s ? "primary" : "ghost"}
                  aria-pressed={shape === s}
                  onClick={() => setShape(s)}
                >
                  {WORK_SHAPE_LABEL[s]}
                </Button>
              ))}
            </div>
          </Field>

          {needsOrigin ? (
            <Field label="Why are we doing it">
              <Textarea
                rows={2}
                value={origin}
                placeholder="Two enterprise deals are blocked on it"
                onChange={(e) => setOrigin(e.currentTarget.value)}
              />
            </Field>
          ) : null}

          <Actions>
            <Button
              variant="primary"
              disabled={!ready || start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Starting" : "Start it"}
            </Button>
          </Actions>

          {needsOrigin ? (
            <Row
              tight
              lead="This work skips Discover"
              sub="Nothing was sensed and nothing was decided, so the reason above is the only thing Learn will have to grade the outcome against later."
            />
          ) : null}
        </>
      ) : null}

      {list.length === 0 && !open ? (
        <Empty>
          Nothing is in flight. Work started here carries its route with it, so a change nobody
          needs to design goes from Plan straight to Build without anyone remembering that it
          should.
        </Empty>
      ) : (
        list.map((t) => {
          // The next station on THIS track's route, never the next one on the
          // spine. It is what lets the control name a destination instead of a
          // mechanism, and it is the same pure function the server calls, so the
          // word on screen and the write behind it cannot disagree.
          const next = nextStation(t.route, t.station);
          const busy = hand.isPending && hand.variables?.id === t.id;

          /**
           * The one state where moving this track on is refused.
           *
           * `advanceTrack` will not refuse it on this ground: it never looks at
           * the hold. But the hold that says a call is in front of you comes
           * from `decideDrive`, which counts pending approvals scoped to the
           * PERSON rather than to the track (driver.server.ts `pendingApprovals`
           * filters on user_id and status, and on nothing that identifies this
           * track). So the driver will refuse this person's tracks at every
           * station until that call is answered, and a track handed past the
           * gate arrives somewhere new and stays exactly as stuck. The control
           * would report progress it did not buy, which is the one thing this
           * codebase will not render. Answering the call is the move, and the
           * row's own sub line already says so.
           *
           * `stalled` and `no-agent` are the opposite case and keep the control:
           * the driver has stopped for good and only a person can decide the
           * work carries on.
           *
           * `paused` also keeps the control, but the SERVER refuses it, not this
           * line. A kill switch outranks everything, so the refusal belongs
           * where it cannot be forgotten rather than in one component's
           * condition. The person still gets a sentence saying why.
           */
          const waitingOnAPerson = t.hold === HOLD_LINE["waiting-on-a-person"];

          const open = showing === t.id;

          return (
            <React.Fragment key={t.id}>
              <Row
                tight
                focused={open}
                // The row's own contract: tight marks a row whose full content
                // has a detail view to open, and until now this one had none. The
                // record of what the work produced is that detail view, and it
                // opens where the work is already being read rather than behind a
                // second address a person has to find.
                onClick={() => setShowing(open ? null : t.id)}
                lead={t.title}
                // The hold outranks the route, because a person arriving at this
                // list wants to know why their work is not moving before they want
                // to know where it is going. Silence and "still running" look
                // identical, and only one of them is true.
                sub={t.hold ?? t.summary}
                action={
                  <>
                    {/* The station stays. It is the answer to "where is this",
                    which is why the row is read at all, and trading it for a
                    button would swap information for a control. It is a fact and
                    not an affordance, so the row still carries exactly ONE
                    thing that can be pressed. */}
                    <Value tone={t.hold ? "warn" : "quiet"}>{AGENT_STATIONS[t.station].name}</Value>

                    {/* Behind the three dots rather than out on the row, which is
                    the shape boundary.tsx already uses for a per-row move: a
                    button repeated down fifty rows is fifty invitations to do
                    something a person should be doing rarely, and it competes
                    with the station for the eye every time the list is scanned.
                    boundary.tsx also settles the refused case: where a move is
                    forbidden the row shows the fact and no control, because a
                    dead button that never says why is worse than no button. */}
                    {waitingOnAPerson ? null : (
                      <MoreMenu label={`Where ${t.title} goes next`}>
                        {/* The words name the destination, never the machinery.
                        "Advance" is what the function is called; "Hand it to
                        Build" is what happens, and it says who has it next.
                        At the end of the route there is nobody to hand it to,
                        so it says what the write actually does instead. */}
                        {/* CLOSING IT OUT ASKS TWICE, HANDING IT ON DOES NOT.
                        Handing work to the next station is reversible by
                        handing it on again, or by the driver picking it up.
                        Closing it is not: it writes status "done", `listTracks`
                        returns only open work, and there is no reopen anywhere
                        in the product, so one press on a menu item would remove
                        a piece of work from the only list that shows it with no
                        way back. The destructive-actions convention wants a
                        confirm or an undo; there is no undo to offer, so it
                        confirms, and the second press states the consequence
                        rather than repeating the verb. */}
                        {/* FIRST, BECAUSE IT IS THE CHEAPER ANSWER. A held
                        station that can run again should be tried before the
                        work is walked past it, and skipping is the move that
                        cannot be undone by the driver. Only offered on a track
                        the driver actually stopped: on anything else there is
                        nothing to release, and the server refuses it with that
                        sentence rather than writing something that looks like
                        it helped. */}
                        {t.hold ? (
                          <MoreItem
                            onClick={() => {
                              if (release.isPending) return;
                              release.mutate(t);
                            }}
                          >
                            {release.isPending && release.variables?.id === t.id
                              ? "Releasing it"
                              : `Let ${AGENT_STATIONS[t.station].name} try again`}
                          </MoreItem>
                        ) : null}
                        <MoreItem
                          onClick={() => {
                            if (hand.isPending) return;
                            if (!next && confirmClose !== t.id) {
                              setConfirmClose(t.id);
                              return;
                            }
                            setConfirmClose(null);
                            hand.mutate(t);
                          }}
                        >
                          {next
                            ? `${busy ? "Handing" : "Hand"} it to ${AGENT_STATIONS[next].name}`
                            : busy
                              ? "Closing it out"
                              : confirmClose === t.id
                                ? "Close it, and it leaves this list"
                                : "Call it finished"}
                        </MoreItem>
                      </MoreMenu>
                    )}
                  </>
                }
              />
              {/* WHAT IT HAS, then WHO DID IT. The chain answers "what do I
                now have", the activity answers "who acted and what came of
                it". Both, in that order, because a person opening a piece of
                work wants the state before the story. */}
              {open ? <TrackChain trackId={t.id} /> : null}
              {open ? <TrackActivity trackId={t.id} /> : null}
            </React.Fragment>
          );
        })
      )}
    </Block>
  );
}
