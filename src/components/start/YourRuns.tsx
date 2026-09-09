/**
 * ── YOUR RUNS: EVERY PIECE OF WORK, AS A POSITION ON THE ROAD ──────────────
 *
 * A1-REPORT §4: *"Rows are the only way a person meets an approval, a verdict
 * or a hold."* That holds. What changed on 2026-09-08 (Lane 1) is what a row
 * IS: it was a title and a paragraph; it is now a title, a Journey mark that
 * says where the work stands and what state it is in, one short sentence, and
 * the one control that fits that state. A run that needs a person leads with
 * an Answer press; everything else opens on the row.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cursor's task list (title, status chip, one distinguishing fact) and Devin's
 * session list (the exception state said in words under the title). What is
 * added over both is the road: their work has no stations; ours does, and the
 * position is the fact a person reads first.
 *
 * ── THREE STATES, AND THEY ARE THREE DIFFERENT THINGS ─────────────────────
 * Still reading, could not read, and genuinely no runs. The read raises rather
 * than swallows, so the middle state is reachable and is said.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { Journey, JOURNEY_ROW_WIDTH, type JourneyKey } from "@/components/meridian/Journey";
import { ROW_GAP, Row } from "@/components/meridian/rows";
import { Action, Chevron, Eyebrow, ReadFailedLine } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { RecordTag } from "@/components/meridian/RecordsTable";
import { SlowRead } from "@/components/shell/SlowRead";
import { KIND_WORD } from "@/lib/spine/attach";
import { AGENT_STATIONS, toolActionLabel } from "@/lib/agent-vocabulary";
import { relativeTime } from "@/lib/memory-view";
import {
  abandonedLine,
  groupStartRows,
  startRows,
  type StartRow,
  type StartRowKind,
} from "@/components/today/tracks-feed";
import { callWithoutAGate, journeyOfRun, standingState } from "@/components/start/journey-of-a-run";
import { TrackConsent } from "@/components/track/TrackConsent";
import { HoldCard } from "@/components/track/HoldCard";
import { listRunsForStart, pinTrack, type StartRun } from "@/lib/spine/track.functions";
import { HOME_STALE_MS } from "@/components/start/home-read";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTimezone } from "@/hooks/use-timezone";

/**
 * The word on the chip, and only where a chip earns its place.
 *
 * `running` gets none: the Journey mark is already alive on that row and the
 * sentence says who is working with a clock. `waiting` gets none either,
 * because "waiting" is what a list of runs mostly is and a chip that appears
 * on the majority of rows sorts nothing.
 */
const CHIP: Partial<Record<StartRowKind, { status: "pass" | "fail"; word: string }>> = {
  finished: { status: "pass", word: "Finished" },
  abandoned: { status: "fail", word: "Abandoned" },
};

/** The marks column: seven dots and their links. */
/* The marks column is the road's own width, so the road can never run into
   the title (founder, 2026-09-08). */
const MARKS_WIDTH = JOURNEY_ROW_WIDTH;
/* The time-and-credits column and the control slot are fixed, so every row's
   controls stand in the same place down the list, whether or not this row
   has a control at all. */
const META_WIDTH = 168;
const CONTROL_SLOT = 176;

function RunRow({
  r,
  run,
  now,
  onOpen,
  onPin,
  pinning,
  askOpen,
  onAsk,
  onAnswered,
}: {
  r: StartRow;
  run: StartRun | undefined;
  now: number;
  onOpen: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  pinning: boolean;
  /** This row's ask is open under it. */
  askOpen: boolean;
  onAsk: (id: string) => void;
  onAnswered: () => void;
}) {
  const chip = CHIP[r.kind];
  const canPin = r.kind !== "finished" && r.kind !== "abandoned";
  const needsYou = r.kind === "needs-you";
  /* STOPPED, ON A CONDITION OR FOR GOOD: the row offers the run screen's own
     hold card in place (Lane 2's HoldCard, standalone by trackId), with "Let
     X try again" and "Stop spending on this" for a hold, "Run it now" for a
     loop that quit. Both states open it; the mark tells them apart (fourth
     review, 2026-09-09). */
  const standing = !needsYou && run ? standingState(run) : null;
  const held = standing === "held" || standing === "stopped";
  /* A person's call with no gate under it (the driver says it is theirs and
     nothing is coming, but there is no approval row): the answer is on the
     run screen, so the control opens the run rather than an empty card. */
  const callOnRun = run ? callWithoutAGate(run) : false;
  /* FOCUS COMES BACK. When the card under the row closes (answered, or
     Close), keyboard focus used to drop to the document body; it returns to
     the control that opened it, and when the answer took that control away
     with it (the row is no longer waiting on anyone, so Answer and Why it
     stopped are gone), to the row itself (third review, 2026-09-08). Keyed on the
     card being mounted, not on askOpen alone: the row can change kind under
     an open card, and that unmounts the card with focus inside it. */
  const toggleRef = React.useRef<HTMLSpanElement | null>(null);
  /* HTMLElement, because the row's readable region is a button when the press
     does something and an ANCHOR when it navigates -- and this row navigates.
     The ref only ever calls `.focus()`, which every HTMLElement has. */
  const bodyRef = React.useRef<HTMLElement | null>(null);
  const cardOpen = (needsYou || held) && askOpen;
  const wasOpen = React.useRef(cardOpen);
  React.useEffect(() => {
    if (wasOpen.current && !cardOpen) {
      (toggleRef.current?.querySelector<HTMLElement>("button") ?? bodyRef.current)?.focus();
    }
    wasOpen.current = cardOpen;
  }, [cardOpen]);
  return (
    <>
      <Row
        bodyRef={(el) => {
          bodyRef.current = el;
        }}
        marksWidth={MARKS_WIDTH}
        marks={run ? <Journey size="row" word={false} stations={journeyOfRun(run)} /> : null}
        lead={r.title}
        sub={r.middle}
        subTitle={r.detail ?? undefined}
        align="start"
        timeWidth={META_WIDTH}
        time={
          [r.at ? relativeTime(new Date(r.at).toISOString(), now) : null, r.creditsLine]
            .filter(Boolean)
            .join(" · ") || null
        }
        /*
         * THE ROW NAVIGATES, SO THE ROW IS A LINK. `onOpen` did nothing but
         * `navigate({ to: "/track/$trackId" })`, and wrapping a real URL in a
         * <button> takes away every affordance a URL carries: cmd-click,
         * middle-click, "copy link address", and the destination in the status
         * bar on hover. A person could not open two runs side by side on the
         * one screen whose whole job is showing them several runs at once.
         *
         * The trailing controls stay buttons and stay SIBLINGS of this region
         * (see `Row`), so nothing is nested inside the anchor.
         */
        navigateTo={{ to: "/track/$trackId", params: { trackId: r.id } }}
        action={
          <span
            className="grid items-center gap-mrd-2"
            /* Items keep their own width: a Finished chip in the first cell
               must not stretch to the slot (seen live 20:00 IST 09-08).

               A FLOOR, NOT A FIXED WIDTH (seen live 2026-09-09 on the served
               build). The slot was `width: 176`, and the widest real pair on
               this page is "Answer on the run" beside "Put first", which needs
               about 204. `minmax(0, 1fr)` lets the first COLUMN shrink; it does
               not shrink the button inside it, so the button simply drew over
               the pin and covered the first two letters of its word. A control
               painted across another control is worse than a misaligned one.

               `minWidth` keeps the rule the fixed width was written for, which
               is that controls stand in the same place down the list: every
               row that fits still lands on the same 176. The rare wide pair
               takes the room it needs instead of colliding, and because the
               slot sits at the row's end their right edges stay aligned either
               way. `auto auto` so each control is its own width and the gap
               between them is real. */
            style={{
              minWidth: CONTROL_SLOT,
              gridTemplateColumns: "auto auto",
              justifyItems: "start",
              justifyContent: "end",
            }}
          >
            {needsYou ? (
              /* THE ONE THING ONLY A PERSON CAN DO, AS THE ROW'S OWN CONTROL.
               It opens the ask UNDER THE ROW (R-04: consent is asked in
               place, never in a queue), the same TrackConsent the run screen
               draws, reading its own gate; no second copy of the question. */
              <span ref={toggleRef} className="contents">
                <Action variant="primary" aria-expanded={askOpen} onClick={() => onAsk(r.id)}>
                  {askOpen ? "Close" : "Answer"}
                </Action>
              </span>
            ) : held ? (
              /* NAMED FOR WHAT IT OPENS, never for a station. It read
                 "Decide", the name of the second stop on the map above it
                 and a word R-01 keeps off every door; the card it opens
                 leads with why the run stopped, and the hero on the same
                 screen says "Each one says why below" (fourth review,
                 2026-09-09). */
              <span ref={toggleRef} className="contents">
                <Action variant="default" aria-expanded={askOpen} onClick={() => onAsk(r.id)}>
                  {askOpen ? "Close" : "Why it stopped"}
                </Action>
              </span>
            ) : callOnRun ? (
              /* Says where it goes: the other Answer in this column opens in
                 place, and one word doing two things is a lie (third
                 review, 2026-09-08). */
              <Action variant="primary" onClick={() => onOpen(r.id)}>
                Answer on the run
              </Action>
            ) : r.pinnedAt ? (
              /* A PREFERENCE IS NOT A CALL. The pin wore the you-hue chip,
                 the one colour on this page that means a person is required
                 (law 3), on the one row nobody was waiting on. A tag is
                 square and carries a category; this is one (fourth review,
                 2026-09-09). */
              <RecordTag label="First" />
            ) : chip ? (
              <StatusChip status={chip.status} pulse={false}>
                {chip.word}
              </StatusChip>
            ) : (
              <span aria-hidden="true" />
            )}
            {canPin && !needsYou ? (
              <Action variant="quiet" busy={pinning} onClick={() => onPin(r.id, !r.pinnedAt)}>
                {r.pinnedAt ? "Unpin" : "Put first"}
              </Action>
            ) : (
              <span aria-hidden="true" />
            )}
          </span>
        }
      />
      {needsYou && askOpen ? (
        <div
          className="mb-mrd-3 mt-mrd-2 sm:ml-[var(--mrd-row-under)]"
          style={{ ["--mrd-row-under" as string]: `${MARKS_WIDTH + ROW_GAP}px` }}
          data-mrd=""
        >
          <TrackConsent trackId={r.id} onAnswered={onAnswered} />
        </div>
      ) : null}
      {held && askOpen ? (
        <div
          className="mb-mrd-3 mt-mrd-2 sm:ml-[var(--mrd-row-under)]"
          style={{ ["--mrd-row-under" as string]: `${MARKS_WIDTH + ROW_GAP}px` }}
          data-mrd=""
        >
          <HoldCard trackId={r.id} onSettled={onAnswered} />
        </div>
      ) : null}
    </>
  );
}

export function YourRuns({
  station = null,
  onClearStation,
  className = "",
}: {
  /** The caller's own outer spacing (craft pass, 2026-09-09). */
  className?: string;
  /** Show only the runs standing at this station (the map's press). */
  station?: JourneyKey | null;
  onClearStation?: () => void;
}) {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const zone = useTimezone();
  const fRuns = useServerFn(listRunsForStart);
  const q = useQuery({
    queryKey: ["start-runs", activeWorkspaceId ?? null],
    queryFn: () => fRuns({ data: { workspaceId: activeWorkspaceId ?? null } }),
    refetchInterval: 10_000,
    /* Seeded by the home's one read; fresh for one poll, so this mount
       joins it rather than fetching the largest read on the page again. */
    staleTime: HOME_STALE_MS,
    enabled: Boolean(activeWorkspaceId),
  });

  const [showAbandoned, setShowAbandoned] = React.useState(false);
  /* One ask open at a time: the row whose question is on screen. */
  const [askOpen, setAskOpen] = React.useState<string | null>(null);
  /* THE CLOCK TICKS WHILE ANYTHING RUNS. The row's "3m 12s" was frozen
     between polls while the strip above ticked per second for the same seat
     (entry review, 2026-09-08). One second is the strip's own cadence. */
  const anyRunning = (q.data ?? []).some((t) => t.working);
  const [tick, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(bump, 1_000);
    return () => clearInterval(id);
  }, [anyRunning]);
  const now = Date.now();
  const byId = React.useMemo(() => new Map((q.data ?? []).map((r) => [r.id, r])), [q.data]);
  const rows = React.useMemo(
    () => startRows(q.data ?? [], Date.now(), KIND_WORD, (tool) => toolActionLabel(tool), zone),
    // `tick` is the clock: the rows are recomposed once a second while a seat works.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q.data, zone, tick],
  );
  const groups = React.useMemo(() => groupStartRows(rows), [rows]);
  /* THE MAP COUNTS OPEN RUNS, SO A STATION'S LIST IS THE OPEN RUNS THERE.
     "Learn · 2 here" used to open every finished run as well (entry
     review, 2026-09-08). */
  const shown = React.useMemo(
    () =>
      station
        ? groups.shown.filter((r) => r.station === station && r.kind !== "finished")
        : groups.shown,
    [groups.shown, station],
  );
  const qc = useQueryClient();
  const fPin = useServerFn(pinTrack);
  const pin = useMutation({
    mutationFn: (v: { trackId: string; pinned: boolean }) => fPin({ data: v }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ["start-runs"] }),
  });

  const open = React.useCallback(
    (id: string) => void navigate({ to: "/track/$trackId", params: { trackId: id }, search: {} }),
    [navigate],
  );

  return (
    <section
      data-mrd=""
      data-your-runs=""
      className={`flex flex-col gap-mrd-2 font-mrd ${className}`}
      aria-label="Your runs"
    >
      {/* ONE WAY TO NAME A BLOCK ON THIS PAGE (craft pass, 2026-09-09). This
          was the home's only `SectionHead`, which draws a hairline seam across
          the column, while its two labelled neighbours drew a bare eyebrow:
          one job, two weights. The seam divides a page into sections, and the
          home is one flowing column whose movements are now separated by the
          spacing ramp, so the rule that does that work is doing it twice. The
          seam stays where sections genuinely need separating, which is the
          dense operator surfaces. */}
      <Eyebrow>Your runs</Eyebrow>
      {/* Not a live region: the rows carry a clock that changes every second
          while a seat works, and a live list read a timestamp aloud once a
          second (third review, 2026-09-08). The state sentences announce. */}
      <div className="flex flex-col">
        {/* Reads as `Reading` for 2.5 s, then shows the figure, then offers
            a way out past the stuck line: only met once the composite home
            read has failed and this list is fetching alone (fourth review,
            2026-09-09). */}
        {q.isLoading ? (
          <SlowRead onRetry={() => void q.refetch()}>Reading your runs.</SlowRead>
        ) : null}

        {q.isError ? (
          /*
           * ONE EVENT, ONE WORDING (Lane 1, 2026-09-09). The hero above says
           * "Your runs could not be read... the list below can try again", and
           * this said "did not load". Two verbs for one event, 400px apart,
           * which is F-215's rule about a noun applied to a verb: a reader
           * cannot tell whether one thing failed or two.
           *
           * The PAIR itself stays, and that is a ruling rather than an
           * oversight. Lane 2 hit a harder version of this the same day, five
           * messages for one cause, and the distinction that came out of it is
           * the right one: a full distinctive sentence repeated makes a reader
           * ask which is the real one, while a statement and its designated
           * remedy are doing different jobs. The hero states the condition and
           * points here on purpose; this is where the press lives. What it must
           * not do is describe the event a second time in its own words.
           */
          <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
            The runs could not be read. Whatever is running is still running.
          </ReadFailedLine>
        ) : null}

        {/* Only from an answered read: a disabled or pending one is not
            "nothing yet", and the sentence used to flash for that beat. */}
        {q.isSuccess && rows.length === 0 ? (
          <p className="text-mrd-base text-mrd-mute">Nothing yet. Your first run starts above.</p>
        ) : null}

        {q.isSuccess && rows.length > 0 && shown.length === 0 && station ? (
          <p className="text-mrd-base text-mrd-mute">
            Nothing is standing at {AGENT_STATIONS[station].name}.
          </p>
        ) : null}

        {shown.map((r) => (
          <RunRow
            key={r.id}
            r={r}
            run={byId.get(r.id)}
            now={now}
            onOpen={open}
            onPin={(trackId, pinned) => pin.mutate({ trackId, pinned })}
            pinning={pin.isPending}
            askOpen={askOpen === r.id}
            onAsk={(id) => setAskOpen((cur) => (cur === id ? null : id))}
            onAnswered={() => {
              /* The card closes when the rows have caught up, not on the
                 same tick: the card's own receipt ("You ran it") is on
                 screen while the refetch is in flight, and the row moves
                 the moment it lands. Closing first left a beat with
                 nothing changed (entry review, 2026-09-08). */
              void qc.invalidateQueries({ queryKey: ["start-runs"] }).then(() => setAskOpen(null));
            }}
          />
        ))}

        {groups.abandonedCount > 0 && !station ? (
          <div className="flex flex-col">
            <button
              type="button"
              aria-expanded={showAbandoned}
              aria-label={abandonedLine(groups.abandonedCount)}
              onClick={() => setShowAbandoned((v) => !v)}
              /* The 44px floor on a phone, the same one every other control
                 on this screen carries (CONTROL_SHAPE): at 11.5px this was
                 a 25px target under a list of 44px rows (fourth review,
                 2026-09-09). Desktop keeps the quiet data line. */
              className="mrd-focus-inset flex w-fit items-center gap-1.5 rounded-mrd-chip py-1 max-md:min-h-11 text-mrd-data text-mrd-mute transition-colors hover:text-mrd-ink"
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              <Chevron open={showAbandoned} />
              <span>{abandonedLine(groups.abandonedCount)}</span>
            </button>
            {showAbandoned
              ? groups.abandoned.map((r) => (
                  <RunRow
                    key={r.id}
                    r={r}
                    run={byId.get(r.id)}
                    now={now}
                    onOpen={open}
                    onPin={(trackId, pinned) => pin.mutate({ trackId, pinned })}
                    pinning={pin.isPending}
                    askOpen={false}
                    onAsk={() => undefined}
                    onAnswered={() => undefined}
                  />
                ))
              : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default YourRuns;
