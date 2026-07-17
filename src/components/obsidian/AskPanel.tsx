import * as React from "react";
import { Sparkles, ArrowUp, Filter, Mic, Volume2, Square } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useAsk } from "@/lib/ask-context";
import { findAuditIds, formatAuditId } from "@/lib/audit-id";
import { openLineage } from "@/components/supaprod/AuditLineageSheet";
import { SupaprodLoader, SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { MissionCanvasBlocks } from "@/components/obsidian";
import { PendingApprovalsStrip } from "@/components/obsidian/ask-canvas";
import { AnswerBlocks } from "@/components/obsidian/ask-blocks";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createConversation, getConversation } from "@/lib/conversations.functions";
import { createDecision } from "@/lib/decisions.functions";
import { createTask } from "@/lib/tasks.functions";
import { createNoteFromAsk, markMessagePromoted } from "@/lib/ask-promote.functions";
import { toast } from "@/lib/notify";
import { useDictation, useReadAloud, type ReadAloudState } from "@/hooks/use-voice";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  answerTitle,
  dayLabel,
  needsDayDivider,
  hydrateMessages,
  type StoredMessageRow,
} from "@/lib/ask-thread";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import type { ChatMeta } from "@/components/chat/MessageMeta";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { parseSseLine } from "@/lib/ask-sse";
import type { AnswerBlock } from "@/lib/ask-blocks";
import {
  matchSlashCommands,
  suggestedAsksForContext,
  type SlashCommand,
} from "@/lib/ask-suggestions";

// OBS-12 - Ask (Cmd+J), the summonable AI panel. A right-docked 420px glass
// panel over any screen, not a destination. The SSE streaming client below
// is ported from the retired `_authenticated.chat.tsx` `sendMessage` (the
// /api/chat protocol is consumed read-only, byte-identical - see
// OBS-12.md §3 Scope OUT). Radix Dialog directly (not the shared `SlideOver`)
// because this panel's header (mono ASK label + context chip) doesn't fit
// SlideOver's fixed `title: string` header contract; the chrome values below
// (width, hairline, shadow, cadSlideIn) mirror SlideOver's own exactly.

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Local receive time, for hover timestamps and day dividers (PC-36 G). */
  at: number;
  mission_id?: string | null;
  meta?: ChatMeta | null;
  /** PC-36 C: typed answer blocks, rendered above the prose. */
  blocks?: AnswerBlock[];
  /** The persisted row id (from the {persisted} frame), for promote write-back. */
  dbId?: string;
  error?: boolean;
  /** The user content to resend from the error card's retry (PC-36 G). */
  retryContent?: string;
};

/** What an answer was promoted into (PC-36 E), keyed per message. */
type PromotedRecords = Partial<{ note: string; decision: string; task: string }>;

/** localStorage key for the panel's last conversation (PC-36 rehydration). */
const ASK_CONVERSATION_KEY = "supaprod.ask.conversation.v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class AskUiError extends Error {}

function ShimmerStatus({ label }: { label: string }) {
  // The codified platform pairing for "the machine is working" copy: the
  // shared .ai-working-word utility (Pixel face + glacier shimmer, reduced
  // motion gated in styles.css) + the brand loader (the spiral spinning), so
  // the working moment is unmistakably ours. Never re-roll the shimmer.
  return (
    <span className="inline-flex items-center" style={{ gap: 8 }}>
      <SupaprodLoader size={16} />
      <span className="ai-working-word" style={{ fontSize: 12 }}>
        {label}
      </span>
    </span>
  );
}

// Memoized so a streaming assistant reply (which changes the messages array
// reference on every token) never re-renders the already-settled user turns
// above it - only the message whose props actually changed re-executes.
const AskUserTurn = React.memo(function AskUserTurn({
  content,
  at,
}: {
  content: string;
  at: number;
}) {
  // PC-36 G: right-aligned, compact, muted fill, no avatar; the mono
  // timestamp appears on hover only, so the thread stays calm at rest.
  return (
    <div className="group flex items-center justify-end" style={{ gap: 8 }}>
      <span
        className="opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.05em",
          color: "var(--text-faint)",
          flexShrink: 0,
        }}
      >
        {new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
      <div
        style={{
          background: "var(--surface-card-deep, #0E0E10)",
          borderRadius: "var(--radius-card)",
          padding: "10px 14px",
          maxWidth: "80%",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--text-primary)",
        }}
      >
        {content}
      </div>
    </div>
  );
});

const AskAiMessage = React.memo(function AskAiMessage({
  msg,
  liveStatus,
  readAloud,
  onRetry,
  retryDisabled,
  promoted,
  onPromote,
}: {
  msg: Msg;
  liveStatus: ResearchStatus | null;
  readAloud: ReadAloudState;
  onRetry: (msgId: string, content: string) => void;
  /** True while any stream is in flight; retry waits its turn (review fix). */
  retryDisabled: boolean;
  promoted: PromotedRecords | undefined;
  onPromote: (msg: Msg, kind: "note" | "decision" | "task") => void;
}) {
  const [traceOpen, setTraceOpen] = React.useState(false);
  const thinking = !msg.content && !msg.error;
  // Memoize citations array to prevent ChatMarkdown from re-parsing on every parent render.
  // Hoisted above the early returns below — hooks must run unconditionally on every render.
  const citations = React.useMemo(() => msg.meta?.sources.map((s) => s.n), [msg.meta?.sources]);

  // Review fix (2026-07-16): the server emits blocks BEFORE synthesis so
  // receipts land instantly; both early-return branches must show any
  // already-delivered blocks or the receipts-first contract is theater.
  const earlyBlocks =
    msg.blocks && msg.blocks.length > 0 ? (
      <div style={{ marginBottom: 8 }}>
        <AnswerBlocks blocks={msg.blocks} />
      </div>
    ) : null;

  if (msg.error) {
    // PC-36 G: an error is a retry affordance, not a red wall.
    return (
      <div>
        {earlyBlocks}
        <div
          style={{
            background: "var(--surface-card-deep, #0E0E10)",
            border: "1px solid color-mix(in oklab, var(--madder) 30%, transparent)",
            borderRadius: "var(--radius-card)",
            padding: "10px 14px",
            fontSize: 12.5,
            color: "var(--text-muted)",
          }}
        >
          {msg.content}
          {msg.retryContent ? (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                disabled={retryDisabled}
                onClick={() => onRetry(msg.id, msg.retryContent!)}
                className="transition-colors hover:[background:var(--hover)] disabled:opacity-50"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline)",
                  background: "transparent",
                  color: "var(--text-body)",
                  cursor: retryDisabled ? "default" : "pointer",
                }}
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (thinking) {
    return (
      <div>
        {earlyBlocks}
        <ShimmerStatus label={liveStatus?.label ?? "thinking it through"} />
      </div>
    );
  }

  const meta = msg.meta;
  const settled = msg.content.trim().length > 0;

  return (
    <div>
      {/* PC-36 G: the answer is signed. Supaprod is the accountable voice. */}
      <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
        <SupaprodMark size={13} strokeWidth={2.6} glow={false} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.11em",
            color: "var(--text-subtle)",
          }}
        >
          Supaprod
        </span>
      </div>
      {/* PC-36 C: typed receipts render ABOVE the prose, full width. */}
      {earlyBlocks}
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--text-body)",
        }}
      >
        <ChatMarkdown content={msg.content} citations={citations} />
      </div>
      {msg.mission_id ? (
        <>
          <MissionCanvasBlocks missionId={msg.mission_id} />
          <Link
            to="/build/$missionId"
            params={{ missionId: msg.mission_id }}
            style={{
              display: "inline-block",
              marginTop: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.11em",
              color: "var(--glacier)",
            }}
          >
            Open in Build →
          </Link>
        </>
      ) : null}
      {meta ? (
        <div
          className="flex items-center flex-wrap"
          style={{
            gap: 6,
            marginTop: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--text-faint)",
          }}
        >
          <span>{`${(meta.latency_ms / 1000).toFixed(1)}S`}</span>
          <span>·</span>
          <span>{`$${meta.cost_usd.toFixed(2)}`}</span>
          {meta.workspace_chunks > 0 ? (
            <>
              <span>·</span>
              <span>{`${meta.workspace_chunks} READ`}</span>
            </>
          ) : null}
          {meta.sources.length > 0 ? (
            <>
              <span>·</span>
              <span>{`${meta.sources.length} SOURCE${meta.sources.length === 1 ? "" : "S"}`}</span>
            </>
          ) : null}
          {readAloud.supported && settled ? (
            <button
              type="button"
              onClick={() => readAloud.toggle(msg.id, msg.content)}
              aria-label={readAloud.speakingId === msg.id ? "Stop reading" : "Read aloud"}
              aria-pressed={readAloud.speakingId === msg.id}
              className="inline-flex items-center transition-colors hover:[color:var(--text-primary)]"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: readAloud.speakingId === msg.id ? "var(--glacier)" : "var(--text-subtle)",
              }}
            >
              {readAloud.speakingId === msg.id ? (
                <Square size={11} strokeWidth={2} />
              ) : (
                <Volume2 size={12} strokeWidth={2} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setTraceOpen((v) => !v)}
            aria-expanded={traceOpen}
            className="transition-colors hover:[color:var(--text-primary)]"
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.11em",
              color: "var(--text-subtle)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            How I got this →
          </button>
        </div>
      ) : null}
      {traceOpen && meta ? (
        <div
          style={{
            marginTop: 8,
            // Token-traced (was a dark-only hex): the recessed trace well.
            background: "var(--surface-recessed)",
            borderRadius: 10,
            padding: "10px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--text-subtle)",
          }}
        >
          <div>{`How I got this · ${meta.sources.length} source${meta.sources.length === 1 ? "" : "s"} · ${meta.model}`}</div>
          {meta.research?.sub_queries.map((q, i) => (
            <div key={i}>{`- ${q}`}</div>
          ))}
          {meta.sources.map((s) => (
            <div key={s.n}>{`[${s.n}] ${s.title}`}</div>
          ))}
        </div>
      ) : null}
      {/* PC-36 E (+ D's after-answer suggestions): promote the answer to a
          record. Ledger law: nothing said in Ask may evaporate. A promoted
          kind swaps its chip for the receipt (the decision one is the
          clickable audit ref). Gated on meta (review fix 2026-07-16): meta
          arrives after the last token, so a half-streamed answer can never
          be promoted mid-sentence. */}
      {settled && msg.meta && !msg.mission_id ? (
        <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
          {(
            [
              { kind: "note" as const, label: "Save as note" },
              { kind: "decision" as const, label: "Log decision" },
              { kind: "task" as const, label: "Make task" },
            ] as const
          ).map(({ kind, label }) => {
            const recordId = promoted?.[kind];
            if (recordId) {
              return kind === "decision" ? (
                <button
                  key={kind}
                  type="button"
                  onClick={() => openLineage(formatAuditId("decision", recordId))}
                  className="transition-colors hover:[color:var(--text-primary)]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.05em",
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--hairline)",
                    background: "var(--surface-recessed)",
                    color: "var(--text-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {formatAuditId("decision", recordId)}
                </button>
              ) : (
                <span
                  key={kind}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.05em",
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--hairline)",
                    color: "var(--text-faint)",
                  }}
                >
                  {kind === "note" ? "SAVED" : "TASKED"}
                </span>
              );
            }
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onPromote(msg, kind)}
                className="transition-colors hover:[background:var(--hover)] hover:[color:var(--text-primary)]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  padding: "3px 9px",
                  borderRadius: 999,
                  border: "1px solid var(--hairline)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

function AskComposer({
  onSend,
  disabled,
  paletteOpenRef,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
  // Mirrors paletteOpen for the parent dialog's onEscapeKeyDown, which runs
  // as a document-level CAPTURE-phase listener (Radix DismissableLayer) and
  // therefore fires before this component's own bubble-phase onKeyDown can
  // preventDefault() - the dialog needs to know the palette state directly.
  paletteOpenRef: React.MutableRefObject<boolean>;
}) {
  const [value, setValue] = React.useState("");
  const [paletteIndex, setPaletteIndex] = React.useState(0);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { close } = useAsk();

  // PC-36 F phase 1: browser dictation appends final transcripts into the
  // draft; the interim tail previews below the composer. Absent browser
  // support the mic simply does not render (no dead control).
  const dictation = useDictation((text) => {
    setValue((v) => (v ? `${v} ${text}` : text));
    textareaRef.current?.focus();
  });

  const matches = React.useMemo(() => matchSlashCommands(value), [value]);
  const paletteOpen = matches.length > 0;
  React.useEffect(() => {
    paletteOpenRef.current = paletteOpen;
  }, [paletteOpen, paletteOpenRef]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    // Audit-ID (founder ruling 2026-07-13): if the question names an id
    // (MIS·7E7D59, OPP·005C82, LRN·...), open its verifiable lineage instantly
    // alongside the conversational answer.
    const ids = findAuditIds(trimmed);
    if (ids.length > 0) openLineage(`${ids[0].meta.prefix}·${ids[0].short}`);
    onSend(trimmed);
    setValue("");
    setPaletteIndex(0);
  };

  const selectCommand = (command: SlashCommand) => {
    setValue(command.fill);
    setPaletteIndex(0);
    textareaRef.current?.focus();
  };

  return (
    <div style={{ position: "relative" }}>
      {paletteOpen ? (
        <div
          role="listbox"
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 6,
            // Token-traced (was a dark-only hex + hand-rolled shadow).
            background: "var(--raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {matches.map((command, i) => (
            <button
              key={command.cmd}
              type="button"
              role="option"
              aria-selected={i === paletteIndex}
              onMouseDown={(e) => {
                // mousedown (not click) so this fires before the textarea's blur
                e.preventDefault();
                selectCommand(command);
              }}
              // Pointer hover moves the active option (combobox convention),
              // so mouse users get the same highlight the arrows drive.
              onMouseEnter={() => setPaletteIndex(i)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: i === paletteIndex ? "var(--hover)" : "transparent",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--text-primary)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-primary)",
                }}
              >
                {command.cmd}
              </span>
              <span style={{ color: "var(--text-muted)" }}>{command.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="ask-composer"
        style={{
          border: "1px solid var(--hairline)",
          background: "var(--surface-card-deep)",
          borderRadius: 14,
          padding: "11px 13px 9px",
          boxShadow: "inset 0 1px 0 0 color-mix(in oklab, #fff 6%, transparent)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setPaletteIndex(0);
          }}
          onKeyDown={(e) => {
            if (paletteOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              setPaletteIndex((i) =>
                e.key === "ArrowDown" ? Math.min(i + 1, matches.length - 1) : Math.max(i - 1, 0),
              );
              return;
            }
            if (paletteOpen && (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey))) {
              e.preventDefault();
              selectCommand(matches[paletteIndex] ?? matches[0]);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              if (paletteOpen) {
                setValue("");
              } else {
                close();
              }
            }
          }}
          placeholder="Ask anything in Supaprod, or / for commands"
          aria-label="Ask anything in Supaprod"
          rows={1}
          style={{
            width: "100%",
            resize: "none",
            background: "transparent",
            border: "none",
            // No outline:none: the global [data-obsidian] :focus-visible ring
            // is this borderless composer's focus indicator (never removed).
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--text-primary)",
            maxHeight: 80,
          }}
        />
        <div className="flex items-center justify-between" style={{ marginTop: 6, gap: 8 }}>
          <span
            className="truncate"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: dictation.listening ? "var(--glacier)" : "var(--text-faint)",
              minWidth: 0,
            }}
          >
            {dictation.listening
              ? dictation.interim || "Listening"
              : "/ for commands · Enter to send"}
          </span>
          {dictation.supported ? (
            <button
              type="button"
              onClick={dictation.listening ? dictation.stop : dictation.start}
              aria-label={dictation.listening ? "Stop dictation" : "Dictate your question"}
              aria-pressed={dictation.listening}
              className={`inline-flex items-center justify-center outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${dictation.listening ? "flow-pulse" : ""}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                flexShrink: 0,
                marginLeft: "auto",
                border: dictation.listening
                  ? "1px solid var(--glacier)"
                  : "1px solid var(--hairline)",
                background: dictation.listening
                  ? "color-mix(in oklab, var(--glacier) 12%, transparent)"
                  : "transparent",
                color: dictation.listening ? "var(--glacier)" : "var(--text-subtle)",
                cursor: "pointer",
              }}
            >
              <Mic size={14} strokeWidth={2} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            aria-label="Send"
            className="loom-press inline-flex items-center justify-center outline-none transition-[background,transform,opacity] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: "none",
              background: value.trim() && !disabled ? "var(--ember)" : "var(--hover)",
              color: value.trim() && !disabled ? "#fff" : "var(--text-faint)",
              cursor: value.trim() && !disabled ? "pointer" : "default",
              opacity: value.trim() && !disabled ? 1 : 0.7,
              boxShadow:
                value.trim() && !disabled
                  ? "0 4px 12px -4px color-mix(in oklab, var(--ember) 70%, transparent)"
                  : "none",
            }}
          >
            <ArrowUp size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AskPanel() {
  const { isOpen, context, scope, close, pendingIntent, clearPendingIntent } = useAsk();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<ResearchStatus | null>(null);
  // PC-36 workstream B: scope is a suggested default from the screen you're
  // on, never a silent restriction - the user can always drop back to
  // searching everything. Resets whenever the underlying scope changes
  // (navigating to a different screen/mission) so a stale override doesn't
  // linger.
  const [scopeCleared, setScopeCleared] = React.useState(false);
  React.useEffect(() => {
    setScopeCleared(false);
  }, [scope?.label, scope?.sourceId]);
  const effectiveScope = scopeCleared ? null : scope;
  // PC-36 gap fix: product scope. The choice of WHICH product stays with the
  // app's own switcher (useWorkspace persists it per workspace); the chip
  // only toggles whether Ask narrows retrieval to it. Opt-in, because
  // product-less chunks would silently vanish from an always-on filter.
  const { activeProduct, activeProductId, productsVisible } = useWorkspace();
  const [productScoped, setProductScoped] = React.useState(false);
  const effectiveProductId = productScoped && productsVisible ? activeProductId : null;
  const conversationIdRef = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const fCreate = useServerFn(createConversation);
  // PC-36 E: what each answer was promoted into, keyed by message id.
  const [promotedByMsg, setPromotedByMsg] = React.useState<Record<string, PromotedRecords>>({});
  const fCreateDecision = useServerFn(createDecision);
  const fCreateTask = useServerFn(createTask);
  const fCreateNote = useServerFn(createNoteFromAsk);
  const fMarkPromoted = useServerFn(markMessagePromoted);
  // PC-36 F: read-aloud is panel-level so only one answer speaks at a time.
  const readAloud = useReadAloud();

  // PC-36 gap fix: the thread survives a refresh. The last conversation id
  // is remembered client-side; on open, its persisted messages (prose, meta,
  // typed blocks, mission links) rehydrate the thread once, and only into an
  // empty thread so a live session is never clobbered. A stale or foreign id
  // (RLS returns no conversation) clears itself and the panel starts fresh.
  const fGetConversation = useServerFn(getConversation);
  const queryClient = useQueryClient();
  const [storedConvId, setStoredConvId] = React.useState<string | null>(() => {
    // Malformed storage (review fix 2026-07-16) reads as absent, or the
    // hydration query would sit in a permanent error state (the server fn
    // rejects non-uuids) with nothing ever clearing the key.
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(ASK_CONVERSATION_KEY);
    return v && UUID_RE.test(v) ? v : null;
  });
  const rememberConversationId = React.useCallback((id: string | null) => {
    setStoredConvId(id);
    try {
      if (id) window.localStorage.setItem(ASK_CONVERSATION_KEY, id);
      else window.localStorage.removeItem(ASK_CONVERSATION_KEY);
    } catch {
      // Storage can be unavailable (private mode); the thread just won't persist.
    }
  }, []);

  const ensureConversation = React.useCallback(async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    // Adopt-and-validate the stored thread first (review fix 2026-07-16): a
    // message sent before hydration resolves must land IN the stored
    // conversation, not mint a second one and orphan the history.
    // fetchQuery dedupes with the in-flight hydration query (same key), so
    // this awaits the same round-trip rather than adding one.
    if (storedConvId) {
      try {
        const r = await queryClient.fetchQuery({
          queryKey: ["ask-conversation", storedConvId],
          queryFn: () => fGetConversation({ data: { id: storedConvId } }),
          staleTime: Infinity,
        });
        if (r.conversation) {
          conversationIdRef.current = storedConvId;
          return storedConvId;
        }
      } catch {
        // Unreachable or foreign id: fall through and start fresh.
      }
    }
    const r = await fCreate({ data: {} });
    conversationIdRef.current = r.conversation.id;
    rememberConversationId(r.conversation.id);
    return r.conversation.id;
  }, [fCreate, fGetConversation, queryClient, rememberConversationId, storedConvId]);

  const hydration = useQuery({
    queryKey: ["ask-conversation", storedConvId],
    queryFn: () => fGetConversation({ data: { id: storedConvId! } }),
    enabled: isOpen && !!storedConvId && messages.length === 0,
    staleTime: Infinity,
  });
  // Hydrate once per stored conversation. Prepend (not replace) so an
  // exchange the user started before history landed is kept; stream frames
  // patch by message id, never by index, so prepending under a live stream
  // is safe.
  const hydratedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const data = hydration.data;
    if (!data || !storedConvId || hydratedRef.current === storedConvId) return;
    if (!data.conversation) {
      rememberConversationId(null);
      return;
    }
    hydratedRef.current = storedConvId;
    conversationIdRef.current = storedConvId;
    const hydrated = hydrateMessages((data.messages ?? []) as StoredMessageRow[]);
    if (hydrated.length > 0) {
      setMessages((prev) => (prev.length > 0 ? [...hydrated, ...prev] : hydrated));
      setPromotedByMsg((prev) => {
        const seeded = { ...prev };
        for (const m of hydrated) if (m.promoted) seeded[m.id] = m.promoted;
        return seeded;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydration.data, storedConvId]);

  const startNewConversation = React.useCallback(() => {
    if (streaming) return;
    conversationIdRef.current = null;
    rememberConversationId(null);
    setMessages([]);
    setPromotedByMsg({});
  }, [streaming, rememberConversationId]);

  const send = React.useCallback(
    async (content: string) => {
      if (streaming) return;
      setStreaming(true);
      setLiveStatus(null);
      const now = Date.now();
      const userMsg: Msg = { id: `u-${now}`, role: "user", content, at: now };
      const assistantMsg: Msg = { id: `a-${now}`, role: "assistant", content: "", at: now };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      // Review fix (2026-07-16): every stream frame patches THIS message by
      // id, never "the last message" by index, so no thread mutation (a
      // retry removing an exchange, a future insertion) can redirect
      // in-flight frames onto the wrong message.
      const patchStreaming = (patch: (m: Msg) => Partial<Msg>) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, ...patch(m) } : m)),
        );
      };

      try {
        let convId: string;
        try {
          convId = await ensureConversation();
        } catch {
          throw new AskUiError("I could not start this conversation. Try again.");
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        // Create a new AbortController for this request so we can cancel if panel closes
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            conversationId: convId,
            content,
            ...(effectiveScope || effectiveProductId
              ? {
                  scope: {
                    kinds: effectiveScope?.kinds,
                    sourceId: effectiveScope?.sourceId,
                    productId: effectiveProductId ?? undefined,
                  },
                }
              : {}),
          }),
          signal: controller.signal,
        });
        if (res.status === 401)
          throw new AskUiError("Your session needs a refresh. Reload and try again.");
        if (res.status === 429)
          throw new AskUiError("Rate limit reached. Try again in a few seconds.");
        if (res.status === 402)
          throw new AskUiError("AI credits exhausted. Add credits in Settings.");
        if (!res.ok || !res.body)
          throw new AskUiError("I could not reach the model just now. Try again.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            const event = parseSseLine(line);
            if (event?.kind === "parse-error") {
              // Chunk boundary split the JSON payload - re-buffer and wait for more data.
              buffer = line + "\n" + buffer;
              break;
            }
            if (!event || event.kind === "ignored" || event.kind === "done") continue;
            if (event.kind === "status") {
              setLiveStatus(event.status);
              continue;
            }
            if (event.kind === "meta") {
              patchStreaming(() => ({ meta: event.meta }));
              continue;
            }
            if (event.kind === "block") {
              // PC-36 C: typed receipts accumulate on the streaming message,
              // rendered above the prose that follows.
              patchStreaming((m) => ({ blocks: [...(m.blocks ?? []), event.block] }));
              continue;
            }
            if (event.kind === "persisted") {
              patchStreaming(() => ({ dbId: event.messageId }));
              continue;
            }
            if (event.kind !== "delta") continue;
            if (event.piece) acc += event.piece;
            if (event.piece || event.missionId) {
              patchStreaming(() => ({
                content: acc,
                ...(event.missionId ? { mission_id: event.missionId } : {}),
              }));
            }
          }
        }
      } catch (e) {
        // Review fix (2026-07-16): a deliberate stop (panel closed mid
        // stream) is not a failure. Say what happened, keep any receipts
        // already delivered, and skip the error styling + retry.
        if (e instanceof DOMException && e.name === "AbortError") {
          patchStreaming((m) => ({
            content: m.content.trim()
              ? m.content
              : "Stopped before the answer finished. Ask again if you still need it.",
          }));
          return;
        }
        const friendly =
          e instanceof AskUiError ? e.message : "I could not reach the model just now. Try again.";
        patchStreaming(() => ({
          content: friendly,
          error: true,
          // PC-36 G: the error card offers retry with the original ask.
          retryContent: content,
        }));
      } finally {
        abortControllerRef.current = null;
        setStreaming(false);
        setLiveStatus(null);
      }
    },
    [streaming, ensureConversation, effectiveScope, effectiveProductId],
  );

  // PC-36 E: promote an answer to a record through the EXISTING create
  // seams (createDecision carries its stage-event + tracking side effects;
  // never re-implement them here). Decision promotion keeps the panel's one
  // receipt affordance: the audit ref chip that opens lineage.
  // Review fix (2026-07-16): one promote per message+kind may be in flight.
  // Without this, a double-click creates the record twice (both server fns
  // are plain inserts, not idempotent).
  const promotePendingRef = React.useRef<Set<string>>(new Set());
  // Write the promotion onto the message row (fire-and-forget) so the
  // receipt chip survives a refresh instead of re-offering a duplicate
  // save (review fix 2026-07-16). Same-session messages carry dbId from
  // the {persisted} frame; rehydrated ones use their row uuid directly.
  const recordPromotion = React.useCallback(
    (msg: Msg, kind: "note" | "decision" | "task", recordId: string) => {
      const messageId = msg.dbId ?? (UUID_RE.test(msg.id) ? msg.id : null);
      if (!messageId) return;
      void fMarkPromoted({ data: { messageId, kind, recordId } }).catch((e) =>
        console.error("[ask] promotion write-back failed:", e),
      );
    },
    [fMarkPromoted],
  );
  const promote = React.useCallback(
    async (msg: Msg, kind: "note" | "decision" | "task") => {
      const pendingKey = `${msg.id}:${kind}`;
      if (promotePendingRef.current.has(pendingKey)) return;
      promotePendingRef.current.add(pendingKey);
      try {
        if (kind === "note") {
          const r = await fCreateNote({ data: { body: msg.content.slice(0, 8000) } });
          setPromotedByMsg((m) => ({ ...m, [msg.id]: { ...m[msg.id], note: r.note.id } }));
          recordPromotion(msg, "note", r.note.id);
          toast("Saved to notes.");
        } else if (kind === "decision") {
          const r = await fCreateDecision({
            data: {
              title: answerTitle(msg.content),
              rationale: msg.content.slice(0, 2000),
              status: "pending",
              source_kind: "manual",
            },
          });
          const id = (r as { decision?: { id?: string } }).decision?.id;
          if (id) {
            setPromotedByMsg((m) => ({ ...m, [msg.id]: { ...m[msg.id], decision: id } }));
            recordPromotion(msg, "decision", id);
            toast(`Decision drafted. ${formatAuditId("decision", id)}`);
          }
        } else {
          const r = await fCreateTask({
            data: { title: answerTitle(msg.content), priority: "medium" },
          });
          const id = (r as { task?: { id?: string } }).task?.id;
          if (id) {
            setPromotedByMsg((m) => ({ ...m, [msg.id]: { ...m[msg.id], task: id } }));
            recordPromotion(msg, "task", id);
          }
          toast("Task created.");
        }
      } catch (e) {
        console.error("[ask] promote failed:", e);
        toast("That did not save. Try again.");
      } finally {
        promotePendingRef.current.delete(pendingKey);
      }
    },
    [fCreateNote, fCreateDecision, fCreateTask, recordPromotion],
  );

  const retry = React.useCallback(
    (msgId: string, content: string) => {
      // Review fix (2026-07-16): id-targeted and streaming-guarded. The
      // clicked error card can sit anywhere in the thread, so remove THAT
      // exchange (its user turn + the error card), never a blind last-two
      // slice that could delete a healthy exchange or orphan a live stream.
      if (streaming) return;
      setMessages((prev) => {
        const i = prev.findIndex((m) => m.id === msgId);
        if (i === -1) return prev;
        const start = i > 0 && prev[i - 1].role === "user" ? i - 1 : i;
        return [...prev.slice(0, start), ...prev.slice(i + 1)];
      });
      void send(content);
    },
    [send, streaming],
  );

  // Cancel any in-flight stream if the panel closes or when pendingIntent changes
  React.useEffect(() => {
    if (isOpen) return; // Only cleanup when closing
    // Panel is closing: abort any active stream request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // PC-36 F: a closing panel goes quiet.
    readAloud.stop();
  }, [isOpen, readAloud]);

  React.useEffect(() => {
    if (!isOpen || !pendingIntent) return;
    const intent = pendingIntent;
    clearPendingIntent();
    send(intent);
  }, [isOpen, pendingIntent, clearPendingIntent, send]);

  // Follow new content to the bottom, but only while the reader is already
  // near the bottom - never yank scroll away from someone reading history.
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const nearBottomRef = React.useRef(true);
  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Radix's DismissableLayer handles Escape as a document-level capture-phase
  // listener, so it runs (and can close the whole panel) before the composer's
  // own onKeyDown ever sees the key. This ref lets the composer report "the
  // slash palette is open" so the dialog can preventDefault() and swallow that
  // Escape instead of dismissing - the composer's own handler then still runs
  // afterward (preventDefault doesn't stop propagation) and clears the palette.
  const paletteOpenRef = React.useRef(false);

  if (!isOpen) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(next) => !next && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0"
          style={{ zIndex: 70, backgroundColor: "rgba(4,4,5,0.6)", backdropFilter: "blur(3px)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => {
            if (paletteOpenRef.current) e.preventDefault();
          }}
          className="material-large fixed inset-y-0 right-0 flex flex-col outline-none"
          style={{
            zIndex: 71,
            width: 420,
            maxWidth: "92vw",
            animation: "cadSlideIn 300ms var(--ds-motion-timing-swift)",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Ask</DialogPrimitive.Title>
          <div
            style={{
              position: "relative",
              padding: "15px 20px",
              borderBottom: "1px solid var(--hairline)",
              overflow: "hidden",
            }}
          >
            {/* Ambient wash — a soft ember→blue glow so the panel opens with
                life, not a flat header. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(120% 180% at 0% -40%, color-mix(in oklab, var(--ember) 16%, transparent) 0%, transparent 55%), radial-gradient(120% 180% at 100% -40%, color-mix(in oklab, var(--action-blue) 14%, transparent) 0%, transparent 55%)",
                pointerEvents: "none",
              }}
            />
            <div className="flex items-center gap-3" style={{ position: "relative" }}>
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "color-mix(in oklab, var(--ember) 14%, var(--card))",
                  border: "1px solid var(--ember-line)",
                  boxShadow: "0 0 14px -2px color-mix(in oklab, var(--ember) 45%, transparent)",
                }}
              >
                <Sparkles size={14} strokeWidth={2} style={{ color: "var(--ember)" }} />
              </span>
              <div className="min-w-0">
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    lineHeight: 1.15,
                  }}
                >
                  Ask Supaprod
                </div>
                <div
                  className="truncate"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.05em",
                    color: "var(--text-faint)",
                    marginTop: 1,
                  }}
                >
                  Anything in the platform · reads {context}
                </div>
              </div>
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={streaming}
                  aria-label="Start a new conversation"
                  className="transition-colors hover:[color:var(--text-primary)] disabled:opacity-50"
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-subtle)",
                    background: "none",
                    border: "none",
                    cursor: streaming ? "default" : "pointer",
                  }}
                >
                  New
                </button>
              ) : null}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="transition-colors hover:[color:var(--text-primary)]"
                  style={{
                    marginLeft: messages.length > 0 ? undefined : "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-subtle)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </DialogPrimitive.Close>
            </div>
          </div>
          {scope || productsVisible ? (
            <div
              className="flex items-center gap-2 flex-wrap"
              style={{ padding: "8px 20px", borderBottom: "1px solid var(--hairline)" }}
            >
              {scope ? (
                <button
                  type="button"
                  onClick={() => setScopeCleared((prev) => !prev)}
                  aria-pressed={!scopeCleared}
                  className="inline-flex items-center gap-1.5 transition-colors hover:[background:var(--hover)]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.03em",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: `1px solid ${scopeCleared ? "var(--hairline)" : "var(--ember-line)"}`,
                    color: scopeCleared ? "var(--text-subtle)" : "var(--ember)",
                    background: scopeCleared
                      ? "transparent"
                      : "color-mix(in oklab, var(--ember) 8%, transparent)",
                    cursor: "pointer",
                  }}
                >
                  <Filter size={11} strokeWidth={2} />
                  {scopeCleared ? "Searching everything" : `Scoped to ${scope.label}`}
                </button>
              ) : null}
              {productsVisible && activeProduct ? (
                // PC-36 gap fix: opt-in product narrowing. Which product is
                // active stays the app switcher's call; this only toggles
                // whether Ask reads that product alone.
                <button
                  type="button"
                  onClick={() => setProductScoped((prev) => !prev)}
                  aria-pressed={productScoped}
                  className="inline-flex items-center gap-1.5 transition-colors hover:[background:var(--hover)]"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.03em",
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: `1px solid ${productScoped ? "var(--ember-line)" : "var(--hairline)"}`,
                    color: productScoped ? "var(--ember)" : "var(--text-subtle)",
                    background: productScoped
                      ? "color-mix(in oklab, var(--ember) 8%, transparent)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {productScoped ? `${activeProduct.name} only` : "All products"}
                </button>
              ) : null}
              {scope && !scopeCleared ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text-faint)",
                  }}
                >
                  tap to search everything instead
                </span>
              ) : null}
            </div>
          ) : null}
          {/* PC-36 D2: anything waiting on you, actionable without leaving
              the conversation (founder directive 2026-07-16). */}
          <PendingApprovalsStrip />
          <div
            ref={scrollContainerRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
            className="flex-1 overflow-y-auto flex flex-col"
            style={{ padding: "20px", gap: 16 }}
          >
            {messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    Ask anything in Supaprod
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Answers across your whole workspace. I can also read{" "}
                    <span style={{ color: "var(--text-body)" }}>{context}</span> in front of you, so
                    you can skip the setup.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggestedAsksForContext(context).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="transition-colors hover:[background:var(--hover)] hover:[color:var(--text-primary)]"
                      style={{
                        textAlign: "left",
                        padding: "9px 12px",
                        borderRadius: "var(--radius-card)",
                        border: "1px solid var(--hairline)",
                        background: "var(--surface-card-deep)",
                        fontFamily: "var(--font-sans)",
                        fontSize: 12.5,
                        color: "var(--text-body)",
                        cursor: "pointer",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => {
                // PC-36 G: a mono day divider when the calendar day turns
                // over between messages (long-lived panel sessions).
                const prev = messages[i - 1];
                const divider = needsDayDivider(prev?.at, m.at) ? (
                  <div className="flex items-center" style={{ gap: 10 }} aria-hidden="true">
                    <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        letterSpacing: "0.11em",
                        color: "var(--text-faint)",
                      }}
                    >
                      {dayLabel(m.at)}
                    </span>
                    <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
                  </div>
                ) : null;
                return (
                  <React.Fragment key={m.id}>
                    {divider}
                    {m.role === "user" ? (
                      <AskUserTurn content={m.content} at={m.at} />
                    ) : (
                      <AskAiMessage
                        msg={m}
                        // Only the currently-thinking message needs the live
                        // status; passing null (referentially stable) for every
                        // settled message lets React.memo actually skip
                        // re-rendering them on each status tick, instead of the
                        // shared liveStatus reference invalidating every message.
                        liveStatus={!m.content && !m.error ? liveStatus : null}
                        readAloud={readAloud}
                        onRetry={retry}
                        retryDisabled={streaming}
                        promoted={promotedByMsg[m.id]}
                        onPromote={promote}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <AskComposer onSend={send} disabled={streaming} paletteOpenRef={paletteOpenRef} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
