import type { ReactNode } from "react";

import { isOverdue, stoppedFor } from "./stopped-for";

/*
 * THE CALL IN FRONT OF YOU, drawn in Meridian.
 *
 * ── WHAT IT REPLACES ────────────────────────────────────────────────────
 * The `Gate` primitive from src/components/shell/primitives.tsx, which drew
 * this surface until 2026-08-14. Everything that primitive's header insists on
 * is kept here, because those rules were written after real defects:
 *
 *   ONE QUESTION, THEN THE FACTS, THEN THE ACTIONS, in that order. A change on
 *   2026-08-05 lifted the reasons OUT of the gate and placed them after it,
 *   which put the evidence BELOW the Approve button and asked a person to
 *   decide above the reasons for deciding. Anything that argues for the answer
 *   sits between the question and the controls, and nowhere else.
 *
 *   ONE PRIMARY, AND ONLY ONE. The queue behind this gate carries no commit
 *   control of its own for the same reason: twenty approve buttons is twenty
 *   primary actions and nothing to look at first.
 *
 * ── WHAT IS NEW, AND WHY ────────────────────────────────────────────────
 * The age. Measured in production on 2026-08-14: twelve gates pending, ages in
 * hours 86, 83, 83, 83, 80, 74, 68, 67, 66, 55, 52, 51, the oldest entered at
 * 18:31 on 10 August. Nothing anywhere in the product told anyone, so the loop
 * sat for three and a half days waiting on a click.
 *
 * The diagnosis was not that the queue looked bad. It was that A PENDING
 * APPROVAL IS A ROW IN A LIST, NOT A STALLED PIECE OF WORK WITH A COST. The
 * queue below now carries that through StalledWork; this is the same fact for
 * the one call being asked, and it is stated beside the question rather than
 * exiled to a corner as metadata, because it is the reason to answer now.
 *
 * ── WHERE THE ACCENT GOES ───────────────────────────────────────────────
 * Twice, and both times it means the same thing: a person is required. Once on
 * the standing marker that says so, and once on the control that releases the
 * agent, which is that fact offered rather than stated. This follows
 * ApprovalCard, whose header sets the same rule for the same control: the
 * neutral primary face is right for chrome, and wrong for the one control on
 * the surface that is itself the pending human action. The age joins them only
 * once it is overdue, which is the same boundary StalledWork's rows use.
 *
 * Nothing else here carries colour. There is no warn hue in this system and no
 * token for one: a call that has waited too long is drawn with weight and with
 * a raised ground, never with amber.
 */

/**
 * THE KEYBOARD RING, copied character for character from the ported Meridian
 * components that already carry it (ContextCards, FilterTable, RecordsTable,
 * Search, SidebarNav, InsightCards, FineTuneCard).
 *
 * Without it a control on this surface falls through to the app-wide
 * `:focus-visible` in styles.css, which paints an indigo ring from the `--sp-*`
 * layer this surface has otherwise left. That layer is life support, and a
 * migrated surface borrowing one colour back from it is how a migration stalls
 * half done. Exported so every control in this directory rings the same way.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mrd-edge-focus)]";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/**
 * A control that settles the call.
 *
 * THE KEYCAP IS DRAWN BY THE CALLER, ON PURPOSE. `shortcut` renders a <kbd> and
 * binds nothing, which is how this product once shipped a Settings gear
 * promising a key that fired nothing. The rule the repo settled on is that the
 * file which BINDS a key is the file that DRAWS it, so these props are passed
 * from the route that registers the listener and never from a component that
 * cannot see it.
 */
export function GateAction({
  variant = "default",
  shortcut,
  children,
  ...rest
}: {
  variant?: "default" | "primary";
  shortcut?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const primary = variant === "primary";
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-9 items-center gap-2 rounded-mrd-ctl px-4 text-[13px] font-medium transition-[background-color,opacity,transform] enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-45 ${FOCUS_RING} ${
        primary
          ? // The accent arrives on the control that actually releases the run.
            // Disabled it falls back to the neutral primary face, because a
            // dead control is furniture and must not keep shouting.
            "bg-mrd-you text-mrd-on-you enabled:hover:opacity-90 disabled:bg-mrd-solid disabled:text-mrd-ink"
          : "border border-mrd-line bg-mrd-lift text-mrd-body enabled:hover:bg-mrd-float enabled:hover:text-mrd-ink"
      }`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
      {shortcut ? (
        <kbd className="font-mrd-mono rounded-mrd-xs border border-current px-1 text-[11px] opacity-60">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

export function CallGate({
  question,
  subject,
  since,
  now,
  lines,
  hiddenLineCount = 0,
  consequence,
  children,
}: {
  /** What is being asked, in plain words. Never a mechanism word. */
  question: string;
  /** The mission or project this sits in front of, when there is one. */
  subject?: string | null;
  /** Epoch ms this started waiting. Null when nothing recorded it. */
  since: number | null;
  /** Injectable so this renders deterministically in a test or a screenshot. */
  now: number;
  /** The facts that answer the question. One fact per line. */
  lines: string[];
  /** How many further lines exist and are not drawn. Printed, never silent. */
  hiddenLineCount?: number;
  /** What settling it in the affirmative causes. */
  consequence?: string;
  /** The controls. One primary, and only one. */
  children?: ReactNode;
}) {
  const overdue = since !== null && isOverdue(since, now);

  return (
    <section className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card">
      <div className="flex flex-wrap items-center justify-between gap-mrd-4">
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
          <span className="shrink-0 text-[11px] font-medium text-mrd-you">Waiting on you</span>
          {subject ? (
            <span className="min-w-0 truncate text-[11px] text-mrd-mute">{subject}</span>
          ) : null}
        </span>

        {/*
         * Tabular figures and mono, so the number reads as a measurement rather
         * than as a word, and so it does not jitter when it ticks over. The
         * exact instant rides along as a title for anyone who needs it; the
         * phrase is what changes behaviour.
         */}
        {since !== null ? (
          <span
            title={new Date(since).toLocaleString()}
            className={`font-mrd-mono shrink-0 text-[12px] tabular-nums ${
              overdue ? "font-semibold text-mrd-you" : "font-medium text-mrd-mute"
            }`}
          >
            Stopped for {stoppedFor(since, now)}
          </span>
        ) : (
          <span className="shrink-0 text-[12px] text-mrd-faint">
            How long this has been waiting is not known.
          </span>
        )}
      </div>

      <h2 className="mt-mrd-4 text-[20px] leading-tight font-medium text-mrd-ink">{question}</h2>

      {lines.length > 0 || consequence ? (
        /*
         * A recess, not a second card. The standard caps a region at one
         * bordered container; the evidence reads as part of the question by
         * sitting BELOW the ground rather than on top of it.
         */
        <div className="mt-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-mrd-body">
                {line}
              </li>
            ))}
          </ul>

          {/*
           * A CAP PRINTS ITS REAL NUMBER. This surface has always shown three
           * lines and silently dropped the rest, which is the one thing a list
           * may not do: a reader cannot know they are missing something. No
           * door is drawn to the remainder because there is nowhere to send
           * them, and an arrow to nowhere is worse than none.
           */}
          {hiddenLineCount > 0 ? (
            <p className="font-mrd-mono mt-mrd-3 text-[12px] tabular-nums text-mrd-faint">
              {hiddenLineCount} further {hiddenLineCount === 1 ? "line" : "lines"} not shown here.
            </p>
          ) : null}

          {consequence ? (
            <p className="mt-mrd-4 border-t border-mrd-line-soft pt-mrd-4 text-[13px] leading-relaxed text-mrd-body">
              {consequence}
            </p>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-4">{children}</div> : null}
    </section>
  );
}

/**
 * THE READ FAILED, which is a different fact from an empty queue and must never
 * wear its clothes. It says we do not know, rather than that nothing is there,
 * and it carries the way out.
 *
 * Red is correct here and is not a warning: it reports an OUTCOME, which is the
 * only thing this system's red is ever allowed to mean.
 */
export function ReadFailed({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  return (
    <section
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6"
      role="status"
      aria-live="polite"
    >
      <h2 className="flex items-center gap-mrd-3 text-[16px] leading-snug font-medium text-mrd-ink">
        <span className="text-mrd-fail">
          <Icon>
            <path d="M12 8v5M12 16.5v.01" />
            <circle cx="12" cy="12" r="9" />
          </Icon>
        </span>
        {children}
      </h2>
      <p className="mt-mrd-3 max-w-[62ch] text-[13px] leading-relaxed text-mrd-body">
        Nothing has been settled and nothing has been lost. The queue is still whatever it was a
        moment ago; this screen just could not read it.
      </p>
      <div className="mt-mrd-5">
        <GateAction variant="primary" onClick={onRetry}>
          Try again
        </GateAction>
      </div>
    </section>
  );
}

export default CallGate;
