import { useState } from "react";
import { cn } from "@/lib/utils";
import { VerdictChip, type VerdictTone } from "./chips";
import { agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * ApprovalCard - one item in the single queue of everything awaiting human
 * judgment. Anatomy (architecture §5): what the agent proposes · why, with
 * provenance · cost/impact · one-tap approve / reject / edit. The approve
 * action is the only ember on the card; consequence text under every action.
 */

export type ApprovalItem = {
  id: string;
  /** Card kind chip, e.g. "PROPOSAL", "PLAN", "SHIP GATE", "SPEND", "MEMORY". */
  kind: string;
  kindTone?: VerdictTone;
  /** The agent that owns this gate; renders the attribution chip. */
  agentSlug?: string | null;
  project?: string;
  /** What the agent proposes, one plain sentence. */
  title: string;
  /** Why: evidence lines with provenance ("12 signals point at checkout friction"). */
  evidence: string[];
  /** Cost / impact line ("~120 credits · touches checkout flow only"). */
  impact?: string;
  /** Consequence phrases (button helper text). */
  approveConsequence: string;
  rejectConsequence: string;
  timestamp?: string;
};

/** Humanize an ISO timestamp to a short, calm form ("2h ago", "Jul 9"). */
function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ApprovalCard({
  item,
  onApprove,
  onReject,
  onOpen,
  className,
}: {
  item: ApprovalItem;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  /** Open the underlying work (project / pass / evidence door). */
  onOpen?: (id: string) => void;
  className?: string;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "approve" | "reject") {
    if (pending) return;
    setPending(kind);
    setError(null);
    try {
      await (kind === "approve" ? onApprove(item.id) : onReject(item.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <article
      className={cn("ink-panel p-4 transition-colors duration-150", className)}
      aria-label={`${item.kind}: ${item.title}`}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <VerdictChip tone={item.kindTone ?? "human"}>{item.kind}</VerdictChip>
          {item.agentSlug ? (
            <span className="ink-mono shrink-0 rounded border border-[var(--ink-hairline)] px-1.5 text-mrd-nano uppercase tracking-[0.04em] text-[var(--ink-subtle)]">
              {agentDisplayName(item.agentSlug)}
            </span>
          ) : null}
          {item.project ? (
            <span className="ink-mono truncate text-mrd-tiny text-[var(--ink-subtle)]">
              {item.project}
            </span>
          ) : null}
        </div>
        {item.timestamp ? (
          <time
            dateTime={item.timestamp}
            className="ink-mono shrink-0 text-mrd-tiny text-[var(--ink-faint)]"
          >
            {shortTime(item.timestamp)}
          </time>
        ) : null}
      </header>

      <h3 className="mt-2.5 text-mrd-prose font-medium leading-6 text-[var(--ink-text)]">
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="ink-focus rounded-sm text-left hover:underline hover:underline-offset-4"
          >
            {item.title}
          </button>
        ) : (
          item.title
        )}
      </h3>

      {item.evidence.length > 0 && (
        <ul className="mt-2 space-y-1">
          {item.evidence.map((line, i) => (
            <li key={i} className="flex gap-2 text-mrd-base leading-5 text-[var(--ink-body)]">
              <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-[var(--ink-hairline)]" />
              {line}
            </li>
          ))}
        </ul>
      )}

      {item.impact ? (
        <p className="ink-mono mt-2.5 text-mrd-tiny text-[var(--ink-subtle)]">{item.impact}</p>
      ) : null}

      {error ? (
        <p className="ink-mono mt-2.5 text-mrd-tiny text-[var(--ink-madder)]" role="alert">
          {error}
        </p>
      ) : null}

      <footer className="mt-3.5 flex items-end justify-between gap-3 border-t border-[var(--ink-hairline-soft)] pt-3">
        <div className="flex gap-6">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void act("approve")}
              className={cn(
                "ink-focus self-start rounded-md bg-[var(--voice-human)] px-3.5 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-[var(--voice-human-hover)]",
                pending && "opacity-60",
              )}
            >
              {pending === "approve" ? "Approving" : "Approve"}
            </button>
            <span className="ink-mono text-mrd-nano text-[var(--ink-faint)]">
              {item.approveConsequence}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void act("reject")}
              className={cn(
                "ink-focus self-start rounded-md border border-[var(--ink-hairline)] px-3.5 py-1.5 text-sm font-medium text-[var(--ink-body)] transition-colors duration-150 hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)]",
                pending && "opacity-60",
              )}
            >
              {pending === "reject" ? "Rejecting" : "Reject"}
            </button>
            <span className="ink-mono text-mrd-nano text-[var(--ink-faint)]">
              {item.rejectConsequence}
            </span>
          </div>
        </div>
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="ink-focus rounded-sm text-mrd-base text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink-text)]"
          >
            Open
          </button>
        ) : null}
      </footer>
    </article>
  );
}
