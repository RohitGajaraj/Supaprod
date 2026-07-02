import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { useAsk } from "@/lib/ask-context";
import { MonoLabel } from "@/components/obsidian";
import { supabase } from "@/integrations/supabase/client";
import { createConversation } from "@/lib/conversations.functions";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import type { ChatMeta } from "@/components/chat/MessageMeta";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { parseSseLine } from "@/lib/ask-sse";

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
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        background: "var(--shimmer-gradient)",
        backgroundSize: "280%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        animation: "cadShimmer 5s linear infinite",
      }}
    >
      {label}
    </span>
  );
}

function AskUserTurn({ content }: { content: string }) {
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
}

function AskAiMessage({
  msg,
  liveStatus,
}: {
  msg: Msg;
  liveStatus: ResearchStatus | null;
}) {
  const [traceOpen, setTraceOpen] = React.useState(false);
  const thinking = !msg.content && !msg.error;

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
        <ChatMarkdown content={msg.content} citations={meta?.sources.map((s) => s.n)} />
      </div>
      {msg.mission_id ? (
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
          Track the mission →
        </Link>
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
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.11em",
              color: "var(--glacier)",
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
            background: "#0B0B0D",
            borderRadius: 10,
            padding: "10px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--text-subtle)",
          }}
        >
          <div>{`How I got this · ${meta.sources.length} source${meta.sources.length === 1 ? "" : "s"} · ${meta.model}`}</div>
          {meta.research?.sub_queries.map((q, i) => <div key={i}>{`- ${q}`}</div>)}
          {meta.sources.map((s) => (
            <div key={s.n}>{`[${s.n}] ${s.title}`}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AskComposer({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = React.useState("");
  const { close } = useAsk();

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div
      style={{
        border: "1px solid var(--hairline)",
        background: "#0E0E10",
        borderRadius: "var(--radius-card)",
        padding: "10px 12px",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            close();
          }
        }}
        placeholder="Ask about this screen"
        rows={1}
        style={{
          width: "100%",
          resize: "none",
          background: "transparent",
          border: "none",
          outline: "none",
          fontFamily: "var(--font-ui)",
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--text-primary)",
          maxHeight: 80,
        }}
      />
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color: "var(--text-faint)",
        }}
      >
        Enter to send · Esc closes
      </div>
    </div>
  );
}

export function AskPanel() {
  const { isOpen, context, close } = useAsk();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<ResearchStatus | null>(null);
  const conversationIdRef = React.useRef<string | null>(null);
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
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ conversationId: convId, content }),
        });
        if (res.status === 401) throw new AskUiError("Your session needs a refresh. Reload and try again.");
        if (res.status === 429) throw new AskUiError("Rate limit reached. Try again in a few seconds.");
        if (res.status === 402) throw new AskUiError("AI credits exhausted. Add credits in Settings.");
        if (!res.ok || !res.body) throw new AskUiError("I could not reach the model just now. Try again.");

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
        const friendly = e instanceof AskUiError ? e.message : "I could not reach the model just now. Try again.";
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: friendly, error: true };
          return next;
        });
      } finally {
        setStreaming(false);
        setLiveStatus(null);
      }
    },
    [streaming, ensureConversation],
  );

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
          className="fixed inset-y-0 right-0 flex flex-col outline-none"
          style={{
            zIndex: 71,
            width: 420,
            maxWidth: "92vw",
            backgroundColor: "#101013",
            borderLeft: "1px solid var(--hairline-strong)",
            boxShadow: "-30px 0 60px rgba(0,0,0,0.5)",
            animation: "cadSlideIn 240ms var(--ease)",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Ask</DialogPrimitive.Title>
          <div
            className="flex items-center gap-3"
            style={{ padding: "16px 20px", borderBottom: "1px solid var(--hairline)" }}
          >
            <MonoLabel tone="glacier">ASK</MonoLabel>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--glacier)",
                background: "color-mix(in oklab, var(--glacier) 8%, transparent)",
                border: "1px solid rgba(127,209,220,0.35)",
                borderRadius: "var(--radius-pill, 999px)",
                padding: "3px 8px",
              }}
            >
              {`About: ${context}`}
            </span>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
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
          <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "20px", gap: 16 }}>
            {messages.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: 13,
                  color: "var(--text-muted)",
                }}
              >
                Ask about this screen. I read what is in front of you, so you can skip the setup.
                Most answers land in a few seconds.
              </p>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <AskUserTurn key={m.id} content={m.content} />
                ) : (
                  <AskAiMessage key={m.id} msg={m} liveStatus={liveStatus} />
                ),
              )
            )}
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <AskComposer onSend={send} disabled={streaming} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
