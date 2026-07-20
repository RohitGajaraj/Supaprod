// Thread (Mission Control, front-end reimagining Phase 2): the left-column
// conversation. Order of the day: the day divider, the machine-authored
// Briefing (getBriefing), inline gate cards (the SAME approvals data the
// needs-you pill counts - one count, one source), then the conversation
// (use-ask-stream messages rendered with ChatMarkdown).
//
// Craft grid on every card (Addendum 1.1 rule 2): chip row with the label
// left and the mono timestamp right, body, optional evidence chips, action
// row. NO edge strips. Cost figures never render here (spec 7).
//
// Pure view on purpose: data and callbacks arrive as props (the shell owns
// useAskStream, getBriefing, and the approvals query), so the component
// tests run without providers.

import * as React from "react";
import { Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Briefing } from "@/lib/briefing.functions";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import type { AskStreamMsg, PromotedRecords } from "@/lib/ask-stream-core";
import type { AnswerBlock } from "@/lib/ask-blocks";
import type { ReadAloudState } from "@/hooks/use-voice";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { formatAuditId } from "@/lib/audit-id";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { GateChip, PulseLine, ReceiptLine } from "@/components/mission/primitives";

/** How many gate cards render inline before the door chip takes over. */
const INLINE_GATE_CAP = 3;

export interface ThreadProps {
  /** "Saturday, July 19" - the day divider above the Briefing. */
  dayLabel: string;
  /** getBriefing result; null while loading or when the read failed. */
  briefing: Briefing | null;
  /** True once the briefing read settled, so the placeholder is honest. */
  briefingLoaded: boolean;
  /** The approvals queue slice for this room (already product-filtered). */
  gates: ApprovalQueueItem[];
  onDecideGate: (item: ApprovalQueueItem, verdict: "approve" | "reject") => void;
  /** The full approvals surface: evidence, send-back editing, the rest of the queue. */
  onOpenApprovals: () => void;
  messages: AskStreamMsg[];
  streaming: boolean;
  liveStatus: ResearchStatus | null;
  promotedByMsg: Record<string, PromotedRecords>;
  onPromote: (msg: AskStreamMsg, kind: "note" | "decision" | "task") => void;
  onRetry: (msgId: string, content: string) => void;
  readAloud: ReadAloudState;
  className?: string;
}

function clockTime(at: number | string): string {
  const d = typeof at === "number" ? new Date(at) : new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** One honest line per typed answer block; the full cards stay on the old
 *  surfaces until the CanvasFaces land (claim never outruns wiring). */
function blockLine(block: AnswerBlock): string {
  switch (block.kind) {
    case "decision":
      return `Decision: ${block.title} (${block.status})`;
    case "opportunity":
      return `Opportunity: ${block.title}${block.status ? ` (${block.status})` : ""}`;
    case "mission":
      return `Mission: ${block.title} (${block.status})`;
    case "status":
      return `${block.scopeLabel}: ${block.counts.running} running, ${block.counts.waiting} waiting, ${block.counts.done} done, ${block.counts.failed} failed`;
    case "timeline":
      return `${block.label}: ${block.events.length} ${block.events.length === 1 ? "event" : "events"}`;
  }
}

/** The machine-authored Briefing card at the top of the day. */
function BriefingCard({
  briefing,
  briefingLoaded,
}: {
  briefing: Briefing | null;
  briefingLoaded: boolean;
}) {
  return (
    <div
      data-testid="briefing-card"
      className="rounded-[10px] px-3 py-2.5"
      // interim per Addendum 1.2, final treatment pending founder pick:
      // machine-voice faint wash marks "this is from the product", replacing
      // the banned edge strip until the founder picks the final treatment.
      style={{ background: "var(--voice-machine-faint)" }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.12em]"
          style={{ color: "var(--chip-fg)" }}
        >
          Briefing
        </span>
      </div>
      {briefing ? (
        <div className="flex flex-col gap-2">
          {briefing.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[12.5px] leading-[1.55]"
              style={{ color: "var(--ink-body)" }}
            >
              {paragraph}
            </p>
          ))}
          {briefing.receipts.length > 0 ? (
            <div className="mt-0.5 flex flex-col gap-1.5">
              {briefing.receipts.map((receipt) => (
                <ReceiptLine key={receipt.id}>{receipt.text}</ReceiptLine>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-subtle)" }}>
          {briefingLoaded
            ? "The briefing could not load. The receipts below still tell the story."
            : "Reading the last 24 hours."}
        </p>
      )}
    </div>
  );
}

/** One gate, inline, on the shared GateChip card. Approve and Decline run
 *  the real decide seam; Send back and the evidence door open the full
 *  approvals surface, where the richer flow already lives (no fake decide
 *  path is wired here - claim never outruns wiring). */
function InlineGate({
  item,
  onDecide,
  onOpenApprovals,
}: {
  item: ApprovalQueueItem;
  onDecide: (item: ApprovalQueueItem, verdict: "approve" | "reject") => void;
  onOpenApprovals: () => void;
}) {
  return (
    <GateChip
      headline={item.title}
      recommendation={item.evidence[0] ?? "Waiting on your call."}
      agentSlug={item.agentSlug ?? undefined}
      receipts={item.project ? [{ label: item.project }] : undefined}
      consequence={item.approveConsequence}
      onApprove={() => onDecide(item, "approve")}
      onSendBack={onOpenApprovals}
      onDecline={() => onDecide(item, "reject")}
      onOpenEvidence={onOpenApprovals}
    />
  );
}

const PROMOTE_KINDS = [
  { kind: "note" as const, label: "Save as note", doneLabel: "Saved" },
  { kind: "decision" as const, label: "Log decision", doneLabel: "" },
  { kind: "task" as const, label: "Make task", doneLabel: "Tasked" },
];

function PromoteRow({
  msg,
  promoted,
  onPromote,
}: {
  msg: AskStreamMsg;
  promoted: PromotedRecords | undefined;
  onPromote: ThreadProps["onPromote"];
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {PROMOTE_KINDS.map(({ kind, label, doneLabel }) => {
        const recordId = promoted?.[kind];
        if (recordId) {
          return (
            <span
              key={kind}
              className="rounded-[5px] border px-[7px] py-[2px] font-mono text-[9.5px] uppercase tracking-[0.08em]"
              style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-faint)" }}
            >
              {kind === "decision" ? formatAuditId("decision", recordId) : doneLabel}
            </span>
          );
        }
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onPromote(msg, kind)}
            className="ink-focus rounded-[5px] border px-[7px] py-[2px] text-[11px] transition-colors hover:bg-[var(--ink-raised)] hover:text-[var(--ink-text)]"
            style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-subtle)" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** One conversation message. Exported so the global ComposerOverlay (old-app
 *  surfaces) renders the SAME message card as the room's Thread: read-aloud,
 *  retry, and the promote chips survive everywhere. */
export function ThreadMessage({
  msg,
  isStreamingThis,
  liveStatus,
  promoted,
  onPromote,
  onRetry,
  readAloud,
}: {
  msg: AskStreamMsg;
  isStreamingThis: boolean;
  liveStatus: ResearchStatus | null;
  promoted: PromotedRecords | undefined;
  onPromote: ThreadProps["onPromote"];
  onRetry: ThreadProps["onRetry"];
  readAloud: ReadAloudState;
}) {
  const time = clockTime(msg.at);

  if (msg.role === "user") {
    return (
      <div
        data-testid="thread-msg-user"
        className="rounded-[10px] px-3 py-2.5"
        style={{ background: "var(--ink-raised)", border: "1px solid var(--ink-hairline-soft)" }}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.12em]"
            style={{ color: "var(--ink-subtle)" }}
          >
            You
          </span>
          <span
            className="ml-auto font-mono text-[10px] tabular-nums"
            style={{ color: "var(--ink-faint)" }}
          >
            {time}
          </span>
        </div>
        <div
          className="whitespace-pre-wrap text-[12.5px] leading-[1.55]"
          style={{ color: "var(--ink-body)" }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  const settled = !isStreamingThis && !msg.error && msg.content.length > 0;
  const citations = msg.meta?.sources.map((s) => s.n);

  if (msg.error) {
    return (
      <div
        data-testid="thread-msg-error"
        className="rounded-[10px] px-3 py-2.5"
        style={{ background: "var(--ink-raised)", border: "1px solid var(--ink-hairline-soft)" }}
      >
        <ReceiptLine
          variant="blocked"
          actionLabel={msg.retryContent ? "Try again" : undefined}
          onAction={
            msg.retryContent ? () => onRetry(msg.id, msg.retryContent as string) : undefined
          }
        >
          {msg.content}
        </ReceiptLine>
      </div>
    );
  }

  return (
    <div
      data-testid="thread-msg-assistant"
      className="rounded-[10px] px-3 py-2.5"
      // interim per Addendum 1.2, final treatment pending founder pick:
      // machine-voice faint wash as the source-recognition treatment.
      style={{ background: "var(--voice-machine-faint)" }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.12em]"
          style={{ color: "var(--chip-fg)" }}
        >
          Supaprod
        </span>
        {readAloud.supported && settled ? (
          <button
            type="button"
            onClick={() => readAloud.toggle(msg.id, msg.content)}
            aria-label={readAloud.speakingId === msg.id ? "Stop reading" : "Read aloud"}
            aria-pressed={readAloud.speakingId === msg.id}
            className="ink-focus inline-flex items-center transition-colors hover:text-[var(--ink-text)]"
            style={{
              color: readAloud.speakingId === msg.id ? "var(--voice-machine)" : "var(--ink-subtle)",
            }}
          >
            {readAloud.speakingId === msg.id ? (
              <Square size={12} strokeWidth={1.5} />
            ) : (
              <Volume2 size={12} strokeWidth={1.5} />
            )}
          </button>
        ) : null}
        <span
          className="ml-auto font-mono text-[10px] tabular-nums"
          style={{ color: "var(--ink-faint)" }}
        >
          {time}
        </span>
      </div>
      {msg.blocks && msg.blocks.length > 0 ? (
        <div className="mb-2 flex flex-col gap-1">
          {msg.blocks.map((block, i) => (
            <div
              key={i}
              className="font-mono text-[11px] leading-[1.5]"
              style={{ color: "var(--ink-subtle)" }}
            >
              {blockLine(block)}
            </div>
          ))}
        </div>
      ) : null}
      {msg.content ? (
        <ChatMarkdown content={msg.content} citations={citations} />
      ) : isStreamingThis ? (
        <PulseLine
          agentSlug="supaprod"
          line={liveStatus?.label ?? "working on your answer"}
          streaming
        />
      ) : null}
      {/* The promote chips: nothing said in the Thread may evaporate. Gated
          on meta (it arrives after the last token), so a half-streamed answer
          can never be promoted mid-sentence. */}
      {settled && msg.meta && !msg.mission_id ? (
        <PromoteRow msg={msg} promoted={promoted} onPromote={onPromote} />
      ) : null}
    </div>
  );
}

export function Thread({
  dayLabel,
  briefing,
  briefingLoaded,
  gates,
  onDecideGate,
  onOpenApprovals,
  messages,
  streaming,
  liveStatus,
  promotedByMsg,
  onPromote,
  onRetry,
  readAloud,
  className,
}: ThreadProps) {
  const inlineGates = gates.slice(0, INLINE_GATE_CAP);
  const remainingGates = gates.length - inlineGates.length;
  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;

  return (
    <div data-testid="thread" className={cn("flex flex-col gap-3", className)}>
      {/* The day divider: the Briefing renders directly under it, top of day. */}
      <div
        data-testid="thread-day-divider"
        className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.1em]"
        style={{ color: "var(--ink-faint)" }}
      >
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ background: "var(--ink-hairline-soft)" }}
        />
        {dayLabel}
        <span
          aria-hidden
          className="h-px flex-1"
          style={{ background: "var(--ink-hairline-soft)" }}
        />
      </div>

      <BriefingCard briefing={briefing} briefingLoaded={briefingLoaded} />

      {inlineGates.map((item) => (
        <InlineGate
          key={item.id}
          item={item}
          onDecide={onDecideGate}
          onOpenApprovals={onOpenApprovals}
        />
      ))}
      {remainingGates > 0 ? (
        <GateChip
          variant="chip"
          count={remainingGates}
          label={remainingGates === 1 ? "more waits in Approvals" : "more wait in Approvals"}
          onOpen={onOpenApprovals}
          className="self-start"
        />
      ) : null}

      {messages.map((msg) => (
        <ThreadMessage
          key={msg.id}
          msg={msg}
          isStreamingThis={streaming && msg.id === lastId && msg.role === "assistant"}
          liveStatus={liveStatus}
          promoted={promotedByMsg[msg.id]}
          onPromote={onPromote}
          onRetry={onRetry}
          readAloud={readAloud}
        />
      ))}
    </div>
  );
}
