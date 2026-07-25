import { cn } from "@/lib/utils";

/**
 * ActivityTrace - the layered agent-activity narrative in the machine voice.
 * Summary altitude by default (one quiet line); the row list one click in;
 * full instrumentation lives one deliberate door deeper (the engine room).
 * Three-voice grammar: machine blue for agent rows, ember for human gates,
 * memory gold ONLY on memory rows (the gold ban holds).
 */

export type TraceVoice = "machine" | "human" | "memory" | "system";

export type TraceRow = {
  id: string;
  time: string;
  voice: TraceVoice;
  /** Plain-words event ("Drafted the checkout spec", "You approved the plan"). */
  text: string;
  /** Optional receipt suffix ("PR #42", "3 files"). */
  receipt?: string;
};

const VOICE_COLOR: Record<TraceVoice, string> = {
  machine: "var(--voice-machine)",
  human: "var(--voice-human)",
  memory: "var(--voice-memory)",
  system: "var(--ink-subtle)",
};

export function ActivitySummaryLine({
  text,
  onOpen,
  className,
}: {
  /** One receipt sentence: "3 agents working · 14 tasks done overnight". */
  text: string;
  onOpen?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "ink-focus ink-mono flex items-center gap-2 rounded-md px-1 py-0.5 text-[11px] text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink-body)]",
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--voice-machine)]" />
      {text}
    </button>
  );
}

export function ActivityTrace({
  rows,
  streaming,
  className,
}: {
  rows: TraceRow[];
  /** Marks the last row as live (streaming caret). */
  streaming?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0.5", className)} aria-label="Agent activity">
      {rows.map((row, i) => {
        const live = streaming && i === rows.length - 1;
        return (
          <li
            key={row.id}
            className="grid grid-cols-[52px_10px_1fr] items-baseline gap-2 rounded px-1 py-[3px] font-mono text-[12px] leading-5"
          >
            <time className="text-right text-[var(--ink-faint)]">{row.time}</time>
            <span
              aria-hidden
              className="h-[5px] w-[5px] translate-y-[-1px] rotate-45 justify-self-center"
              style={{ background: VOICE_COLOR[row.voice] }}
            />
            <span className={cn("min-w-0", live && "ink-caret")}>
              <span
                className={
                  row.voice === "human" ? "text-[var(--ink-text)]" : "text-[var(--ink-body)]"
                }
              >
                {row.text}
              </span>
              {row.receipt ? (
                <span className="text-[var(--ink-faint)]"> · {row.receipt}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
