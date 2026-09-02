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

import { WhatWeAlreadyHold } from "@/components/spine/WhatWeAlreadyHold";
import { failureLine } from "@/lib/error-copy";
import { Row } from "@/components/meridian/rows";
import { Actions, ReadFailedLine } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { stillWaiting } from "@/lib/query-state";

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
import { holdTone } from "@/lib/spine/driver";
import { nothingIsComing } from "@/components/track/nothing-is-coming";
import { StatusChip } from "@/components/meridian/StatusChip";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import {
  ACTION_LINK_FACE,
  Action,
  NothingYet,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Choices, Field, Input, Textarea } from "@/components/meridian/forms";
import { MoreItem, MoreMenu } from "@/components/meridian/MoreMenu";
import { Receipt } from "@/components/meridian/Receipt";

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

export function TrackStart({
  onCreated,
}: {
  /**
   * WHERE WORK BEGINS IS THE HOST'S CALL (item 4's split, per L1's note on
   * request 020). Default behaviour stays the inline reveal -- /plan keeps
   * showing the started track exactly as before, and a browser Back returns
   * to it. A host that wants to LAND the person on the run passes this and
   * navigates itself; the component never owns the route.
   */
  onCreated?: (track: Track) => void;
}) {
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

  /**
   * THE HALF THE PORT WOULD OTHERWISE HAVE LOST SILENTLY.
   *
   * The retired `Field` was a `<label>` that WRAPPED its control, so the pair
   * was bound by containment and needed no id. Meridian's `Field` is a div that
   * renders `<label htmlFor>` beside the control, so a Field with no id pair
   * renders a label pointing at nothing and the control loses its accessible
   * name with nothing failing. These are that pair.
   */
  const titleFieldId = React.useId();
  const originFieldId = React.useId();

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
      onCreated?.(res.track);
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
            : "That is the last step on its route."
        }${emptyNote}`,
      });
    },
    onError: (e: Error, t) =>
      setMoved({
        verb: "It did not move",
        consequence: failureLine(`${t.title} is still at ${AGENT_STATIONS[t.station].name}.`, e),
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
        consequence: failureLine(
          `${t.title} is still held at ${AGENT_STATIONS[t.station].name}.`,
          e,
        ),
        failed: true,
      }),
  });
  const list = tracks.data ?? [];
  const needsOrigin = shape !== null && NEEDS_ORIGIN.has(shape);
  const ready = title.trim().length > 0 && shape !== null && (!needsOrigin || origin.trim());

  return (
    <Region
      title="Work in flight"
      sub="Each one carries its own route through the seven steps, including the ones it waives and why."
      /* `toggle`, NOT `goTo` AND NOT `act`. This control opens and closes a
         form that lives INSIDE this region: it navigates nowhere and it starts
         no work, it discloses. `toggled` is the half the retired `more`/`onMore`
         could not express — the label changed for anyone who could see it and
         nothing at all was announced to anyone who could not. */
      toggle={open ? "Never mind" : "Start work"}
      toggled={open}
      onToggle={() => {
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
        /* THE GAP THE RETIRED LAYER WAS DRAWING FOR THIS FORM. `.sp-field` set
           `margin-top: 12px` on every field, so the stack spaced itself and no
           caller ever said so out loud. Meridian's `Field` sets no outer margin
           at all — a composition decision belongs to the composition — so the
           12px is written here, where it now has an owner. */
        <div className="flex flex-col gap-[12px]">
          <Field label="What is the work" htmlFor={titleFieldId}>
            <Input
              id={titleFieldId}
              value={title}
              autoFocus
              placeholder="Add SSO to the admin console"
              onChange={(e) => setTitle(e.currentTarget.value)}
            />
            {/*
             * THE SECOND DOOR THAT STARTS WORK (F-184, SPEC-BUILD-PATHS §2.3).
             * `/start`'s composer got this first and was driven; this one is
             * live on `/plan` (`plan.index.tsx:902`) and starts work the same
             * way, so the same sentence belongs here. It TELLS and never gates:
             * nothing below changes what this form does.
             */}
            <WhatWeAlreadyHold subject={title} />
          </Field>

          {/* Their language, not the model's. A person picks the sentence that
            describes their situation; the product derives the route.

            THE HAND-ROLLED GROUP IS GONE AND ITS ARIA WENT WITH IT. Five
            buttons carrying `aria-pressed` announce five independent toggles
            and never say that picking one unpicks the others, which is what
            `Choices`' own header calls out as quietly wrong for a mutually
            exclusive set. `mode="one"` is a radio group: one tab stop, arrow
            keys inside it, and `aria-checked` telling the truth.

            `flex-wrap` IS LOAD-BEARING, not tidiness. Meridian's track is
            `inline-flex` with no wrap and these five options are whole
            sentences, so without it the last two run off the edge of the work
            column. The retired `.sp-choices` wrapped; this keeps that.

            AND IT IS DELIBERATELY NOT INSIDE A `Field`. Meridian's `Field`
            now REQUIRES an `htmlFor`, because its children render outside its
            `<label>` and an id is the only thing that can bind them. `label
            for` may only point at a LABELABLE element, and a radiogroup is not
            one — there is no id here that a `for` could honestly name. So the
            caption is set in the Field label's own paint and the GROUP names
            itself through `Choices`' `label`, which is exactly how the div this
            replaces was named. Inventing an id to satisfy the type would have
            produced a `for` pointing at nothing. */}
          <div className="flex flex-col gap-1.5">
            <span
              className="font-medium text-mrd-prose text-mrd-body"
              style={{ letterSpacing: "var(--mrd-track-label)" }}
            >
              What kind of work is it
            </span>
            <Choices<WorkShape>
              mode="one"
              className="flex-wrap"
              label="What kind of work is it"
              value={(shape ?? "") as WorkShape}
              options={SHAPES.map((s) => ({ id: s, label: WORK_SHAPE_LABEL[s] }))}
              onChange={setShape}
            />
          </div>

          {needsOrigin ? (
            <Field label="Why are we doing it" htmlFor={originFieldId}>
              <Textarea
                id={originFieldId}
                rows={2}
                value={origin}
                placeholder="Two enterprise deals are blocked on it"
                onChange={(e) => setOrigin(e.currentTarget.value)}
              />
            </Field>
          ) : null}

          <Actions>
            {/* `Action`, not `Approve`. Orchid is spent on one meaning — a
                person is required — and this releases nothing that is stopped:
                it starts a new piece of work. */}
            <Action
              variant="primary"
              disabled={!ready || start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending ? "Starting" : "Start it"}
            </Action>
          </Actions>

          {needsOrigin ? (
            <Row
              lead="This work skips Discover"
              sub="Nothing was sensed and nothing was decided, so the reason above is the only thing Learn will have to grade the outcome against later."
            />
          ) : null}
        </div>
      ) : null}

      {tracks.isError ? (
        /*
         * A FAILED READ IS NOT AN EMPTY DESK, and this region was the last
         * place in the lane still saying otherwise.
         *
         * `list` is `tracks.data ?? []`, so a read that fails produces exactly
         * the same empty array a genuinely empty workspace produces, and the
         * branch below then tells a person "Nothing is in flight." That is a
         * claim about their work, made from an absence of information. This
         * region mounts on /plan and on the run screen, so the sentence lands
         * next to runs that may well be moving.
         *
         * Found by auditing this prefix for S0's F-120 shape -- a component
         * reading from something that can fail and rendering the empty case
         * when it does. This was the only one of 16 query-bearing components
         * here with no `isError` branch anywhere in the file.
         */
        <ReadFailedLine onRetry={() => void tracks.refetch()} error={tracks.error}>
          Your work in flight did not load, so this cannot say what is running.
        </ReadFailedLine>
      ) : stillWaiting(tracks) ? (
        /*
         * AND AN ANSWER THAT HAS NOT ARRIVED IS NOT THE ANSWER "NONE".
         *
         * The branch above closed the FAILED read and left the SLOW one open,
         * which is the same defect in its other clothes: `list` is
         * `tracks.data ?? []` while the read is still in flight, so the empty
         * branch below states "Nothing is in flight." as a fact and is then
         * replaced by however many tracks are running. On a cold cache that is
         * the first frame a person sees on /plan, and it tells them their work
         * is not moving.
         *
         * `stillWaiting` rather than `isLoading`, for the reason its own file
         * gives: v5's `isLoading` is `isPending && isFetching`, so a query that
         * is pending and NOT in flight reports false and the wait stands down
         * with `data` still undefined. It also stands down on a failed read and
         * on a query that is switched off, so this branch cannot become the
         * permanent spinner it replaces -- and the failure is caught above it
         * either way.
         */
        <Reading>Reading your work in flight.</Reading>
      ) : list.length === 0 && !open ? (
        // The BARE half of the empty pair. This sits under a region heading
        // that already frames it, and the standard caps a region at one
        // bordered box.
        <NothingYet>
          Nothing is in flight. Work started here carries its route with it, so a change nobody
          needs to design goes from Plan straight to Build without anyone remembering that it
          should.
        </NothingYet>
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
          /*
           * OFF THE RAW REASON NOW, NOT OFF THE SENTENCE.
           *
           * This read `t.hold === HOLD_LINE["waiting-on-a-person"]`, comparing
           * the RENDERED PROSE. It happened to work for that one reason and
           * could never work for two of the other three that also need a
           * person: `holdLine` replaces the leading "This station" with the
           * station's display name, so `station-cannot-finish` and `given-up`
           * never equal their own entry in `HOLD_LINE` on a track that has a
           * station. `retry-station.test.ts` refused prose-branching for the
           * retry control on the same grounds.
           */
          const tone = holdTone(t.holdReason);
          /**
           * THE ONE HOLD WHERE THE MENU HIDES, AND IT IS ONE HOLD, NOT FOUR.
           *
           * This used to read `tone === "you"`, so hiding the menu for a call
           * waiting on the reader also hid it on `station-cannot-finish`,
           * `corrections-spent` and `given-up` -- three of the four holds the
           * release control exists for, since no code path clears them. Only
           * `waiting-on-a-person` has the property the argument below describes:
           * the pending call is scoped to the PERSON, so handing past it reports
           * progress it did not buy. The other three keep both controls.
           */
          const waitingOnAPerson = t.holdReason === "waiting-on-a-person";

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
                    {/*
                    ── THE STATION IS A FACT AGAIN, AND THE STATUS MOVED TO A CHIP ──

                    This read `tone={t.hold ? "hold" : "quiet"}`, so EVERY hold
                    painted the station amber, including `waiting-on-a-person`.
                    Amber means stopped and NOT on you, so a gate waiting on the
                    reader was wearing the one token that says it is not theirs:
                    the single distinction those two tokens exist to draw,
                    inverted for the case where it matters most.

                    The reflex fix is a `you` tone on this `Value`, and the
                    component refuses one on purpose: *"A value is something you
                    READ; if a person is required, that belongs on a control, not
                    on a fact."* That is right, and it is the better answer than
                    the one the item asked for. The station name answers "where
                    is this", which is why the row is read at all, so it goes
                    back to `quiet` and stops carrying a state it never owned.

                    The state goes on a `StatusChip`, which is also the standing
                    law from 2026-08-19: on paper the five status hues collapse
                    to between 5.06 and 6.00 against the ground and stop reading
                    as colour, so coloured TEXT cannot carry status and a chip
                    has to. One idea, one place, and it survives greyscale
                    because the reason sentence in the row's `sub` already says
                    which it is.
                    */}
                    {tone ? (
                      <StatusChip
                        status={tone}
                        pulse={tone === "you" && !nothingIsComing(t.holdReason)}
                      >
                        {tone === "you"
                          ? /*
                             * THE TERMINAL SPLIT, and this list is where it was
                             * missed. RUN-125 corrected five surfaces on the run
                             * screen; this one derives its own chip and kept the
                             * old sentence, so a person scanning their work still
                             * read "Waiting on you" beside 36 of the 37 tracks
                             * that have nothing pending for anybody. §12: a word
                             * corrected in one place and left stale in another has
                             * made the problem worse.
                             *
                             * The word matches `run-status.ts` exactly, and the
                             * pulse goes off with it: a pulse is motion and the
                             * sweep has dropped this track.
                             */
                            nothingIsComing(t.holdReason)
                            ? "Needs a restart"
                            : "Waiting on you"
                          : // A learn hold whose reason is an undated forecast is a
                            // calendar wait, not a stoppage (queue 67); the pane
                            // renders the date where the record is open.
                            t.holdReason === "needs-evidence" && t.station === "learn"
                            ? "Waiting on time"
                            : "On hold"}
                      </StatusChip>
                    ) : null}
                    <Value tone="quiet">{AGENT_STATIONS[t.station].name}</Value>

                    {/* Behind the three dots rather than out on the row, which is
                    the shape boundary.tsx already uses for a per-row move: a
                    button repeated down fifty rows is fifty invitations to do
                    something a person should be doing rarely, and it competes
                    with the station for the eye every time the list is scanned.
                    boundary.tsx also settles the refused case: where a move is
                    forbidden the row shows the fact and no control, because a
                    dead button that never says why is worse than no button. */}
                    {waitingOnAPerson ? (
                      /*
                       * THE ONE ROW THAT SAYS A PERSON IS REQUIRED WAS THE ONE
                       * ROW WITH NOTHING TO PRESS.
                       *
                       * Hiding the menu here is right and the argument above
                       * still stands: handing this track past the gate reports
                       * progress it did not buy, so neither move belongs on it.
                       * What did not follow is that the row should therefore be
                       * inert. It wears orchid and a pulse -- the product's one
                       * statement that somebody is being waited on -- next to a
                       * chip, a station name and no way to act, while every row
                       * that is NOT waiting on anybody carries a menu.
                       *
                       * The way out is the call itself, and the call renders on
                       * the run screen: `way-out.ts` classifies
                       * `waiting-on-a-person` as "the call itself is the way
                       * out, and it renders above", which is that screen. So the
                       * control names that destination and does nothing else. It
                       * is not an `Approve`: pressing it answers nothing, it
                       * opens the place where the answer is given, and orchid on
                       * a button that only navigates would promise a decision
                       * this row cannot take.
                       *
                       * A `Link` and not a button, per `ACTION_LINK_FACE`'s own
                       * ruling: this is a navigation, so middle-click and
                       * modifier-click have to keep working. The row still has
                       * exactly one thing that can be pressed beside its
                       * readable half, which is the shape every other row here
                       * keeps.
                       */
                      <Link
                        data-mrd=""
                        to="/track/$trackId"
                        params={{ trackId: t.id }}
                        aria-label={`Open the run for ${t.title}`}
                        className={ACTION_LINK_FACE.quiet}
                      >
                        Open the run
                      </Link>
                    ) : (
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
    </Region>
  );
}
