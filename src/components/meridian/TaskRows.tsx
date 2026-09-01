import { useState } from "react";

/*
 * TASK ROWS, one line per unit of agent work, with what state it is in.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Task Rows"
 *                 (their file: components/TaskRows.tsx), MIT licensed, read
 *                 on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * /runs and Today's four lanes. Today currently prints a raw database enum
 * into the Stuck row, so a reader is shown `halted` and left to work out what
 * that is and whether it is theirs to fix. `taskStatus` below is the fix: raw
 * values go in, one of the meanings below comes out, and no surface prints the
 * enum again.
 *
 * ── THE STATES ARE THE COMPONENT ────────────────────────────────────────
 * This row exists to separate facts that all otherwise read as "not
 * finished", and the separation is the entire point of the file:
 *
 *   running   `--mrd-agent`. A machine is working. Nothing is asked of anyone.
 *   queued    `--mrd-hold`. Nothing has picked it up yet. Waiting on a
 *             condition, and NOT on a person.
 *   blocked   `--mrd-you`. A person is required, and until one arrives this
 *             row is not moving.
 *   stopped   `--mrd-mute`. It ended without finishing, by decision or by the
 *             engine. Terminal, and needs nobody.
 *   partial   `--mrd-ink`. It finished and produced output with a hole in it.
 *   done      `--mrd-pass`. Outcome. It worked.
 *   failed    `--mrd-fail`. Outcome. It did not.
 *
 * THE THREE THAT ARRIVED LATE, AND WHY EACH IS NOT A NEW COLOUR. `queued`,
 * `stopped` and `partial` were all reaching `taskStatus`' `default` and coming
 * out `blocked`, so eight spellings a writer in this repo actually produces
 * were telling a reader that a person was required. `--mrd-hold` is already
 * declared "stopped, and not on you" and `run-parts.tsx` already spends it on a
 * queued run, so `queued` reuses that rather than inventing a hue. `stopped`
 * and `partial` take a NEUTRAL and no status hue at all, which is not an
 * omission: `today/RunState.tsx` settled both, in writing, before this mapping
 * could answer for them. A deliberate stop is not an outcome, so it is neither
 * green nor red, and it needs nobody, so it is not orchid. A run that shipped
 * with a hole in it is not a fifth outcome and there is no colour for one, so
 * it takes the brightest ink and medium weight. There is no warn token and
 * there must not be one.
 *
 * "running" and "blocked" are the pair that matters. Both look like unfinished
 * work in a list and they demand opposite responses: one says wait, the other
 * says it has been waiting for you. So they are told apart twice over, by hue
 * and by motion. Only running spins. A blocked row is deliberately still,
 * because a spinner on work that has stopped is a claim that something is
 * happening, and nothing is.
 *
 * ── WHAT IS DELIBERATELY NOT COPIED ─────────────────────────────────────
 * The reference is a timed demo: a hardcoded tick array walks the rows through
 * a scripted sequence regardless of any real work. That is a showreel, not a
 * component, so the tick harness is gone and status arrives as a prop.
 *
 * The reference puts a permanently spinning retry glyph inside the Failed
 * pill. It spins whether or not anything is retrying, which is the same lie as
 * a spinner on a blocked row. Retry here is a real control, drawn only when
 * the caller can actually act on it.
 *
 * The reference has no blocked state at all, because its palette has nowhere
 * to put one. Adding it is the reason this component was picked.
 */

/*
 * A row is a full-bleed button inside a container that is both rounded and
 * overflow-hidden, so the system's default OUTSET focus ring is clipped on all
 * four sides and comes back as four disconnected fragments. That is the exact
 * failure meridian.css keeps the inset variant for. The explicit utilities
 * restate what the `[data-mrd]` rule already says, so the treatment survives on
 * a surface that rule has not reached.
 */
const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

export type TaskStatus =
  "running" | "queued" | "blocked" | "stopped" | "partial" | "done" | "failed";

/**
 * Terminal, as this vocabulary spells it. Exported because it is the thing every
 * other status normaliser in the repo also has to answer, and a guard that
 * re-derives it from the union would be asserting its own copy.
 *
 * `stopped` and `partial` are here and `blocked` is not, which is the whole
 * distinction: a blocked row is still going to move when somebody arrives.
 */
export const TERMINAL_TASK_STATUS: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  "done",
  "failed",
  "stopped",
  "partial",
]);

export type TaskDetail = { label: string; meta?: string };

export type Task = {
  id: string;
  /** What was attempted, in a reader's words and never a mechanism name. */
  label: string;
  status: TaskStatus;
  /** A count or size, e.g. "7 SKUs". Optional; omit rather than invent one. */
  amount?: string;
  /** Position in the run. Shown inside the ring while the work is running. */
  step?: number;
  details?: TaskDetail[];
};

/** Exported so a guard can read the WORD a state prints rather than guessing at
 *  it, and so a failure message can name the label a reader would have seen. */
export const TASK_LABEL: Record<TaskStatus, string> = {
  running: "Running",
  queued: "Queued",
  blocked: "Waiting on you",
  stopped: "Stopped",
  partial: "Partial",
  done: "Completed",
  failed: "Failed",
};

/** Exported for the same reason, and for one more: `--mrd-you` means a person is
 *  required, so which states may spend it is a claim worth failing a build. */
export const TASK_TONE: Record<TaskStatus, string> = {
  running: "var(--mrd-agent)",
  queued: "var(--mrd-hold)",
  blocked: "var(--mrd-you)",
  stopped: "var(--mrd-mute)",
  partial: "var(--mrd-ink)",
  done: "var(--mrd-pass)",
  failed: "var(--mrd-fail)",
};

/**
 * Raw run state to one meaning a reader can act on.
 *
 * ── WHAT THE DEFAULT ARM USED TO SWALLOW ────────────────────────────────
 * This had three cases and a `default: return "blocked"`, so EVERY spelling
 * below arrived at the label "Waiting on you" in `--mrd-you`, the one hue this
 * system reserves for a person being required:
 *
 *   queued, pending, scheduled   nobody has picked it up. It is waiting for a
 *                                worker, not for a reader.
 *   halted, cancelled            it already ended. `cancelMission` withdraws
 *                                that mission's approvals as it closes, so the
 *                                product had stopped asking while the row went
 *                                on saying it was asking.
 *   completed_with_failures      it finished and produced output. 627 runs,
 *                                the second largest status in the table.
 *
 * `today/RunState.tsx` had already wrapped this function in a `STOPPED` map to
 * patch two of them, with a comment saying both were arriving as "waiting on
 * you, in ORCHID". A fix applied at one caller is how the next caller inherits
 * the bug, so it is applied here and the caller keeps only its choice of WORDS.
 *
 * ── WHAT STAYS EXACTLY AS IT WAS ────────────────────────────────────────
 * `proposed`, `blocked` and `waiting_approval` DO need a person, and reached the
 * right answer through that default. They are explicit cases now so the answer
 * is stated rather than inherited: a proposed mission is one an ambient trigger
 * raised and nobody has promoted, which is 232 of 349 missions.
 *
 * And an unrecognised value still resolves to "blocked", which is unchanged and
 * deliberate. Every spelling a writer in this repo produces now has a case, so
 * this arm only sees words nobody writes, and the alternatives are both worse:
 * calling an unrecognised state "running" claims a machine is working when
 * nobody knows that, and calling it "failed" reports an outcome that has not
 * happened. "A person should look at this" is the only reading that is true
 * whatever the value turns out to mean.
 *
 * Held by `lib/__tests__/one-run-status-vocabulary.test.ts`, which drives this
 * and the repo's three other status normalisers over one table and fails when
 * they disagree about what has finished or about who is being asked.
 */
export function taskStatus(raw: string | null | undefined): TaskStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "running":
    case "in_progress":
    case "dispatched":
    case "processing":
    case "executing":
    case "active":
    case "working":
    case "started":
      return "running";
    case "queued":
    case "pending":
    case "scheduled":
      return "queued";
    case "waiting_approval":
    case "blocked":
    case "proposed":
      return "blocked";
    case "halted":
    case "cancelled":
    case "canceled":
      return "stopped";
    case "completed_with_failures":
      return "partial";
    case "done":
    case "complete":
    case "completed":
    case "succeeded":
    case "success":
      return "done";
    case "failed":
    case "failure":
    case "error":
    case "errored":
    case "timed_out":
      return "failed";
    default:
      return "blocked";
  }
}

function Glyph({ d, size = 12, width = 3 }: { d: string; size?: number; width?: number }) {
  return (
    /*
     * Hidden from assistive technology at the source. The outcome disc is
     * announced by the status pill beside it and the retry glyph sits on a
     * button that says "Run it again", so an exposed graphic would only make a
     * screen reader say the same thing twice.
     */
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/*
 * The ring reads as motion; the still ring reads as a held place. Both are 24px
 * so a list does not reflow when a row changes state, which is the whole reason
 * the marker is a fixed box rather than a glyph that happens to be that size.
 */
function Ring({ status, step }: { status: TaskStatus; step?: number }) {
  const size = 24;
  const stroke = 2;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const running = status === "running";

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={running ? { animation: "mrd-spin 1.1s linear infinite" } : undefined}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mrd-line)"
          strokeWidth={stroke}
        />
        {running ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={TASK_TONE.running}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * 0.28} ${c * 0.72}`}
          />
        ) : (
          /*
           * Not running. A closed ring, not an arc: an arc is a progress reading
           * and there is no progress to report on work that has stopped.
           *
           * THE STROKE IS THE STATE'S OWN TONE, and it was `TASK_TONE.blocked`
           * hardcoded until the vocabulary grew past four. That was correct
           * while `blocked` was the only state that reached this branch and it
           * became a colour-law breach the moment `queued` did: orchid means a
           * person is required, and a run nobody has picked up requires nobody.
           */
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={TASK_TONE[status]}
            strokeWidth={stroke}
          />
        )}
      </svg>
      <span className="relative text-mrd-micro font-semibold tabular-nums text-mrd-ink">
        {step ?? ""}
      </span>
    </span>
  );
}

/* An outcome is settled, so it gets a filled disc rather than an open ring. */
function Disc({ status }: { status: "done" | "failed" }) {
  return (
    <span
      className="flex size-[22px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: TASK_TONE[status],
        color: "var(--mrd-bg)",
        animation: "mrd-fade-up 300ms var(--mrd-ease) both",
      }}
    >
      <Glyph
        d={status === "done" ? "M20 6L9 17l-5-5" : "M18 6L6 18M6 6l12 12"}
        size={status === "done" ? 13 : 12}
        width={3.5}
      />
    </span>
  );
}

/*
 * `stopped` and `partial` are terminal and still take the RING, which is worth a
 * line because the rule above says an outcome gets a disc. A disc carries a tick
 * or a cross and neither is true of them: a stop is not a verdict on the work,
 * and a partial run has both a tick and a cross in it. The still closed ring in
 * the state's own tone says "this is not moving" without claiming which.
 */
function Marker({ status, step }: { status: TaskStatus; step?: number }) {
  if (status === "done" || status === "failed") return <Disc status={status} />;
  return <Ring status={status} step={step} />;
}

/*
 * Tinted from the semantic token rather than from a second palette, so a chip
 * cannot drift away from the marker it sits beside.
 */
function Pill({ status }: { status: TaskStatus }) {
  return (
    <span
      className="inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-mrd-data font-medium"
      style={{
        color: TASK_TONE[status],
        background: `color-mix(in oklab, ${TASK_TONE[status]} 16%, transparent)`,
        animation: "mrd-fade-in 200ms var(--mrd-ease-soft) both",
      }}
    >
      {TASK_LABEL[status]}
    </span>
  );
}

export function TaskRows({
  tasks,
  variant = "Capsules",
  onRetry,
}: {
  /** An empty list is a real state and gets its own composition below. */
  tasks: Task[];
  /** "Capsules" gives each row its own card. "List" is one bounded sheet. */
  variant?: "Capsules" | "List";
  /** Offered only on failed rows, and only when a caller can actually retry. */
  onRetry?: (task: Task) => void;
}) {
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});
  const list = variant === "List";

  /*
   * THE ZERO CASE. `agent_memory` holds zero rows of kind outcome and this
   * workspace has never had a run land, so an empty list is not an edge, it is
   * the first thing most readers will see. It carries no status colour, because
   * no work is running, finished, broken, or waiting on anyone.
   */
  if (tasks.length === 0) {
    return (
      /*
       * `data-mrd` belongs on THIS root too. It is an early return, which is
       * exactly how a component root loses the attribute: the eye reads the
       * main return as the root and stops. Without it this box keeps the
       * legacy focus ring and the legacy alias chain, so the one state a
       * reviewer meets first is the one state not wearing the system.
       */
      <div
        data-mrd=""
        className="w-full max-w-[440px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-4 font-mrd"
      >
        <p className="text-mrd-base font-medium text-mrd-body">No work has run here yet.</p>
        <p className="mt-1 mrd-meta">
          Each step an agent takes gets a line here, with whether it is running, finished, broken,
          or waiting on you.
        </p>
      </div>
    );
  }

  return (
    /*
     * The 196px floor is on the capsule variant only, and the split is not an
     * oversight. Capsules are loose cards that grow and shrink as rows open,
     * and every one of those moves shoves the page; reserving the tall case
     * means an opening row fills space that was already there. The List variant
     * is a single bounded sheet whose own edge already states where it ends, so
     * a floor there would only pad the bottom of a finished object.
     *
     * The sheet takes the card shadow as well as its border. On the dark ground
     * the border is what separates it from the canvas and the shadow does
     * almost nothing; on paper it is the reverse. Both, and it reads as a
     * raised sheet on either.
     */
    <div
      data-mrd=""
      className={`flex w-full max-w-[440px] flex-col font-mrd ${
        list
          ? "gap-0 self-start overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
          : "min-h-[196px] gap-2"
      }`}
      style={list ? { boxShadow: "var(--mrd-shadow-card)" } : undefined}
    >
      {tasks.map((task, i) => {
        const open = openRows[task.id] ?? false;
        const hasDetails = Boolean(task.details?.length);
        return (
          <div
            key={task.id}
            className={`self-stretch overflow-hidden transition-[border-radius] duration-300 ${
              /* `line`, not `line-soft`. Soft is the token for a rule BETWEEN
                 SECTIONS; these are the edges between records, and at 5.5% on
                 the dark ground the four rows ran together into one slab with
                 no visible seam. The reference draws this at its full edge
                 weight for the same reason. */
              list ? "border-b border-mrd-line last:border-0" : "bg-mrd-sheet"
            }`}
            style={{
              borderRadius: list ? 0 : open ? 14 : 22,
              boxShadow: list ? undefined : "var(--mrd-shadow-card)",
              animation: `mrd-fade-up 450ms var(--mrd-ease) ${i * 80}ms both`,
            }}
          >
            <button
              type="button"
              aria-expanded={hasDetails ? open : undefined}
              disabled={!hasDetails}
              onClick={() => setOpenRows((current) => ({ ...current, [task.id]: !open }))}
              className={`${FOCUS_INSET} flex h-11 w-full items-center gap-2.5 px-2.5 text-left transition-colors duration-100 enabled:hover:bg-mrd-hover disabled:cursor-default`}
            >
              <Marker status={task.status} step={task.step} />

              <span className="min-w-0 flex-1 truncate text-mrd-base font-medium text-mrd-ink">
                {task.label}
              </span>

              {/*
               * PROPORTIONAL, with tabular figures. This was set in mono, and
               * mono is for a figure and nothing else. What this prop actually
               * holds is a figure WITH ITS UNIT — "128 messages", "9 groups" —
               * and a word set in mono reads as a machine token rather than as
               * English. `tabular-nums` on the proportional face keeps the
               * digits in a column down the list, which is the whole reason mono
               * looked right here, without setting the noun in a typewriter.
               * A bare duration like "86h" survives this fine; a noun does not
               * survive the other way round.
               */}
              {task.amount ? (
                <span className="shrink-0 text-mrd-label text-mrd-body tabular-nums">
                  {task.amount}
                </span>
              ) : null}

              <Pill status={task.status} />

              {/*
               * The chevron is drawn only where it does something. A row with
               * no detail showing a control that cannot open is the small lie
               * that teaches readers to stop trusting the other controls.
               */}
              {hasDetails ? (
                <span
                  aria-hidden
                  className="-ml-2 flex size-7 shrink-0 items-center justify-center rounded-full text-mrd-mute"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              ) : (
                /* The same box, empty, so a row without detail keeps its
                   neighbours' column alignment instead of letting the pill
                   slide right on that one line. */
                <span aria-hidden className="-ml-2 size-7 shrink-0" />
              )}
            </button>

            {hasDetails ? (
              <div
                className="grid transition-[grid-template-rows,opacity] duration-300"
                style={{
                  gridTemplateRows: open ? "1fr" : "0fr",
                  opacity: open ? 1 : 0,
                  transitionTimingFunction: "var(--mrd-ease)",
                }}
              >
                <div className="overflow-hidden">
                  <div className="mb-2.5 grid grid-cols-[24px_1fr] gap-2.5 px-2.5">
                    <span aria-hidden className="mx-auto h-full w-px bg-mrd-line" />
                    <div className="flex flex-col gap-1.5">
                      {task.details?.map((detail, j) => (
                        <div
                          key={detail.label}
                          className="flex items-center justify-between gap-3"
                          style={
                            open
                              ? {
                                  animation: `mrd-fade-up 300ms var(--mrd-ease) ${120 + j * 100}ms both`,
                                }
                              : undefined
                          }
                        >
                          <span className="min-w-0 truncate text-mrd-small text-mrd-body">
                            {detail.label}
                          </span>
                          {detail.meta ? (
                            <span className="shrink-0 font-mrd-mono text-mrd-data text-mrd-mute tabular-nums">
                              {detail.meta}
                            </span>
                          ) : null}
                        </div>
                      ))}

                      {task.status === "failed" && onRetry ? (
                        <button
                          type="button"
                          onClick={() => onRetry(task)}
                          className="mt-0.5 flex w-fit items-center gap-1.5 rounded-mrd-ctl bg-mrd-lift px-2 py-1 text-mrd-small font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
                        >
                          <Glyph d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" size={12} width={2.4} />
                          Run it again
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default TaskRows;
