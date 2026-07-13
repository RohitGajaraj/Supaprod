import * as React from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useAsk } from "@/lib/ask-context";
import { findAuditIds } from "@/lib/audit-id";
import { openLineage } from "@/components/cadence/AuditLineageSheet";
import { MissionCanvasBlocks } from "@/components/obsidian";
import { supabase } from "@/integrations/supabase/client";
import { createConversation } from "@/lib/conversations.functions";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import type { ChatMeta } from "@/components/chat/MessageMeta";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { parseSseLine } from "@/lib/ask-sse";
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
  mission_id?: string | null;
  meta?: ChatMeta | null;
  error?: boolean;
};

class AskUiError extends Error {}

function ShimmerStatus({ label }: { label: string }) {
  // The codified platform pairing for "the machine is working" copy: the
  // shared .ai-working-word utility (Pixel face + glacier shimmer, reduced
  // motion gated in styles.css). Never re-roll the shimmer per surface.
  return (
    <span className="ai-working-word" style={{ fontSize: 12 }}>
      {label}
    </span>
  );
}

// Memoized so a streaming assistant reply (which changes the messages array
// reference on every token) never re-renders the already-settled user turns
// above it - only the message whose props actually changed re-executes.
const AskUserTurn = React.memo(function AskUserTurn({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        style={{
          background: "var(--surface-card-deep, #0E0E10)",
          borderRadius: "var(--radius-card)",
          padding: "10px 14px",
          maxWidth: "80%",
          fontFamily: "var(--font-ui)",
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
}: {
  msg: Msg;
  liveStatus: ResearchStatus | null;
}) {
  const [traceOpen, setTraceOpen] = React.useState(false);
  const thinking = !msg.content && !msg.error;
  // Memoize citations array to prevent ChatMarkdown from re-parsing on every parent render.
  // Hoisted above the early returns below — hooks must run unconditionally on every render.
  const citations = React.useMemo(() => msg.meta?.sources.map((s) => s.n), [msg.meta?.sources]);

  if (msg.error) {
    return (
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
      </div>
    );
  }

  if (thinking) {
    return <ShimmerStatus label={liveStatus?.label ?? "thinking it through"} />;
  }

  const meta = msg.meta;

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-ui)",
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
          {meta.sources.length > 0 ? (
            <>
              <span>·</span>
              <span>{`${meta.sources.length} SOURCE${meta.sources.length === 1 ? "" : "S"}`}</span>
            </>
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
                fontFamily: "var(--font-ui)",
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
          placeholder="Ask anything in Cadence, or / for commands"
          aria-label="Ask anything in Cadence"
          rows={1}
          style={{
            width: "100%",
            resize: "none",
            background: "transparent",
            border: "none",
            // No outline:none: the global [data-obsidian] :focus-visible ring
            // is this borderless composer's focus indicator (never removed).
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--text-primary)",
            maxHeight: 80,
          }}
        />
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 6, gap: 8 }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              color: "var(--text-faint)",
            }}
          >
            / for commands · Enter to send
          </span>
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
  const { isOpen, context, close, pendingIntent, clearPendingIntent } = useAsk();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<ResearchStatus | null>(null);
  const conversationIdRef = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const fCreate = useServerFn(createConversation);

  const ensureConversation = React.useCallback(async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const r = await fCreate({ data: {} });
    conversationIdRef.current = r.conversation.id;
    return r.conversation.id;
  }, [fCreate]);

  const send = React.useCallback(
    async (content: string) => {
      if (streaming) return;
      setStreaming(true);
      setLiveStatus(null);
      const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", content };
      const assistantMsg: Msg = { id: `a-${Date.now()}`, role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

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
          body: JSON.stringify({ conversationId: convId, content }),
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
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], meta: event.meta };
                return next;
              });
              continue;
            }
            if (event.piece) acc += event.piece;
            if (event.piece || event.missionId) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: acc,
                  ...(event.missionId ? { mission_id: event.missionId } : {}),
                };
                return next;
              });
            }
          }
        }
      } catch (e) {
        const friendly =
          e instanceof AskUiError ? e.message : "I could not reach the model just now. Try again.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: friendly, error: true };
          return next;
        });
      } finally {
        abortControllerRef.current = null;
        setStreaming(false);
        setLiveStatus(null);
      }
    },
    [streaming, ensureConversation],
  );

  // Cancel any in-flight stream if the panel closes or when pendingIntent changes
  React.useEffect(() => {
    if (isOpen) return; // Only cleanup when closing
    // Panel is closing: abort any active stream request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen]);

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
                  Ask Cadence
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
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="transition-colors hover:[color:var(--text-primary)]"
                  style={{
                    marginLeft: "auto",
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
                    Ask anything in Cadence
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-ui)",
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
                        fontFamily: "var(--font-ui)",
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
              messages.map((m) =>
                m.role === "user" ? (
                  <AskUserTurn key={m.id} content={m.content} />
                ) : (
                  <AskAiMessage
                    key={m.id}
                    msg={m}
                    // Only the currently-thinking message needs the live
                    // status; passing null (referentially stable) for every
                    // settled message lets React.memo actually skip
                    // re-rendering them on each status tick, instead of the
                    // shared liveStatus reference invalidating every message.
                    liveStatus={!m.content && !m.error ? liveStatus : null}
                  />
                ),
              )
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
