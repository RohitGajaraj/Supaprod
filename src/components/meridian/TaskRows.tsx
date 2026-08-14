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
 * values go in, one of four meanings comes out, and no surface prints the
 * enum again.
 *
 * ── THE FOUR STATES ARE THE COMPONENT ───────────────────────────────────
 * This row exists to separate four facts that all currently read as "not
 * finished", and the separation is the entire point of the file:
 *
 *   running   `--mrd-agent`. A machine is working. Nothing is asked of anyone.
 *   done      `--mrd-pass`. Outcome. It worked.
 *   failed    `--mrd-fail`. Outcome. It did not.
 *   blocked   `--mrd-you`. A person is required, and until one arrives this
 *             row is not moving.
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

export type TaskStatus = "running" | "done" | "failed" | "blocked";

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

const LABEL: Record<TaskStatus, string> = {
  running: "Running",
  done: "Completed",
  failed: "Failed",
  blocked: "Waiting on you",
};

const TONE: Record<TaskStatus, string> = {
  running: "var(--mrd-agent)",
  done: "var(--mrd-pass)",
  failed: "var(--mrd-fail)",
  blocked: "var(--mrd-you)",
};

/**
 * Raw run state to one of the four meanings a reader can act on.
 *
 * Unknown values resolve to "blocked" on purpose. The alternative defaults are
 * both worse: calling an unrecognised state "running" claims a machine is
 * working when nobody knows that, and calling it "failed" reports an outcome
 * that has not happened. "A person should look at this" is the only reading
 * that is true whatever the value turns out to mean.
 */
export function taskStatus(raw: string | null | undefined): TaskStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "running":
    case "in_progress":
    case "active":
    case "working":
    case "started":
      return "running";
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
      return "failed";
    default:
      return "blocked";
  }
}

function Glyph({ d, size = 12, width = 3 }: { d: string; size?: number; width?: number }) {
  return (
    <svg
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
            stroke={TONE.running}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * 0.28} ${c * 0.72}`}
          />
        ) : (
          /*
           * Blocked. A closed ring, not an arc: an arc is a progress reading
           * and there is no progress to report on work that has stopped.
           */
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={TONE.blocked}
            strokeWidth={stroke}
          />
        )}
      </svg>
      <span className="relative text-[10.5px] font-semibold tabular-nums text-mrd-ink">
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
        background: TONE[status],
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
      className="inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[11.5px] font-medium"
      style={{
        color: TONE[status],
        background: `color-mix(in oklab, ${TONE[status]} 16%, transparent)`,
        animation: "mrd-fade-in 200ms var(--mrd-ease-soft) both",
      }}
    >
      {LABEL[status]}
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
      <div className="w-full max-w-[440px] rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-4">
        <p className="text-[13px] font-medium text-mrd-body">No work has run here yet.</p>
        <p className="mt-1 text-[12px] leading-relaxed text-mrd-mute">
          Each step an agent takes gets a line here, with whether it is running, finished, broken,
          or waiting on you.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full max-w-[440px] flex-col ${
        list
          ? "gap-0 overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
          : "gap-2"
      }`}
    >
      {tasks.map((task, i) => {
        const open = openRows[task.id] ?? false;
        const hasDetails = Boolean(task.details?.length);
        return (
          <div
            key={task.id}
            className={`self-stretch overflow-hidden transition-[border-radius] duration-300 ${
              list ? "border-b border-mrd-line-soft last:border-0" : "bg-mrd-sheet"
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
              className="flex h-11 w-full items-center gap-2.5 px-2.5 text-left transition-colors duration-100 enabled:hover:bg-mrd-hover disabled:cursor-default"
            >
              <Marker status={task.status} step={task.step} />

              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-mrd-ink">
                {task.label}
              </span>

              {task.amount ? (
                <span className="shrink-0 font-mrd-mono text-[12px] text-mrd-body tabular-nums">
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
                  className="-ml-1 flex size-6 shrink-0 items-center justify-center rounded-full text-mrd-mute"
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
                <span aria-hidden className="-ml-1 size-6 shrink-0" />
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
                          <span className="min-w-0 truncate text-[12px] text-mrd-body">
                            {detail.label}
                          </span>
                          {detail.meta ? (
                            <span className="shrink-0 font-mrd-mono text-[11.5px] text-mrd-mute tabular-nums">
                              {detail.meta}
                            </span>
                          ) : null}
                        </div>
                      ))}

                      {task.status === "failed" && onRetry ? (
                        <button
                          type="button"
                          onClick={() => onRetry(task)}
                          className="mt-0.5 flex w-fit items-center gap-1.5 rounded-mrd-ctl bg-mrd-lift px-2 py-1 text-[12px] font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
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
