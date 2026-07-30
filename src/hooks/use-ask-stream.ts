import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createConversation, getConversation } from "@/lib/conversations.functions";
import { createDecision } from "@/lib/decisions.functions";
import { createTask } from "@/lib/tasks.functions";
import { createNoteFromAsk, markMessagePromoted } from "@/lib/ask-promote.functions";
import { createProject } from "@/lib/projects.functions";
import { nameFromIntent } from "@/lib/intent-name";
import { toast } from "@/lib/notify";
import { formatAuditId } from "@/lib/audit-id";
import {
  useDictation,
  useReadAloud,
  type DictationState,
  type ReadAloudState,
} from "@/hooks/use-voice";
import { useWorkspace } from "@/hooks/use-workspace";
import { answerTitle, hydrateMessages, type StoredMessageRow } from "@/lib/ask-thread";
import { parseSseLine } from "@/lib/ask-sse";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import type { AskScope } from "@/lib/ask-context";
import {
  ASK_CONVERSATION_MAP_KEY,
  LEGACY_ASK_CONVERSATION_KEY,
  UUID_RE,
  appendExchange,
  askScopeKey,
  conversationIdForScope,
  parseConversationMap,
  patchMessage,
  prependHydrated,
  readSessionConversationId,
  removeExchange,
  seedPromoted,
  withConversationId,
  writeSessionConversationId,
  type AskStreamMsg,
  type PromotedRecords,
} from "@/lib/ask-stream-core";

// Front-end reimagining (Mission Control): the Ask stream as a hook,
// EXTRACTED from src/components/obsidian/AskPanel.tsx so the Mission Control
// composer and Thread can consume the same conversation machinery without
// the panel chrome. The /api/chat SSE protocol below is contract-locked and
// consumed byte-identical to AskPanel (which itself ports the retired
// _authenticated.chat.tsx reader). AskPanel stays untouched and keeps
// working; it can migrate to this hook later or stay as is.
//
// What this hook changes vs. AskPanel: thread persistence is PER SCOPE.
// AskPanel remembers one conversation for the whole app (v1 key); here the
// remembered conversation is keyed by productId with a workspace fallback
// (client-side map, v2 key - no schema change; conversations persist through
// conversations.functions.ts exactly as before).

class AskUiError extends Error {}

/* -------------------- localStorage (SSR-safe) --------------------- */

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return parseConversationMap(window.localStorage.getItem(ASK_CONVERSATION_MAP_KEY));
  } catch {
    return {};
  }
}

function readScopedConversationId(scopeKey: string): string | null {
  if (typeof window === "undefined") return null;
  let legacy: string | null = null;
  try {
    legacy = window.localStorage.getItem(LEGACY_ASK_CONVERSATION_KEY);
  } catch {
    // Storage can be unavailable (private mode); the thread just won't persist.
  }
  return conversationIdForScope(readMap(), scopeKey, legacy);
}

function writeScopedConversationId(scopeKey: string, id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const next = withConversationId(readMap(), scopeKey, id);
    window.localStorage.setItem(ASK_CONVERSATION_MAP_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); the thread just won't persist.
  }
}

/**
 * Where the "which conversation is live" pointer lives. See the note on
 * `readSessionConversationId` for the ruling: a summoned pane opens fresh on
 * every page load and keeps its thread across a close and reopen, and those
 * two facts are the same storage choice.
 */
export type AskPointer = "durable" | "session";

function readPointer(pointer: AskPointer, scopeKey: string): string | null {
  return pointer === "session"
    ? readSessionConversationId(scopeKey)
    : readScopedConversationId(scopeKey);
}

function writePointer(pointer: AskPointer, scopeKey: string, id: string | null): void {
  if (pointer === "session") writeSessionConversationId(scopeKey, id);
  else writeScopedConversationId(scopeKey, id);
}

/* ------------------------------ hook ------------------------------ */

export type UseAskStreamOptions = {
  /** Gate hydration + keep-alive; false behaves like AskPanel closing (abort + quiet). Default true. */
  enabled?: boolean;
  /** Retrieval scope forwarded to /api/chat (same shape AskPanel sends). */
  scope?: AskScope | null;
  /** Opt-in product narrowing for retrieval (AskPanel's product chip). */
  retrievalProductId?: string | null;
  /**
   * Persistence scope override. Undefined = the workspace's active product
   * (the default per-product thread); null = force the workspace bucket.
   */
  productId?: string | null;
  /** Final dictation transcripts land here (append into your composer draft). */
  onDictation?: (text: string) => void;
  /**
   * Which pointer store resolves this surface's live conversation. Default
   * `durable` is the per-scope localStorage map and is unchanged behaviour
   * (the Mission Control room). `session` is the in-memory map: the surface
   * opens on a new conversation after every page load, and keeps the one it
   * is on across an unmount and remount.
   */
  pointer?: AskPointer;
};

export type AskStreamState = {
  messages: AskStreamMsg[];
  streaming: boolean;
  liveStatus: ResearchStatus | null;
  /** Send one user intent into the thread (no-op while a stream is in flight). */
  sendIntent: (content: string) => void;
  /** Remove an error exchange and resend its content. */
  retry: (msgId: string, content: string) => void;
  startNewConversation: () => void;
  /** Promote an answer to a record (note / decision / task). */
  promote: (msg: AskStreamMsg, kind: "note" | "decision" | "task") => void;
  promotedByMsg: Record<string, PromotedRecords>;
  /** "Start a project from this": turn the drafted intent into a real project. */
  startProjectFromIntent: (intent: string) => Promise<void>;
  startingProject: boolean;
  /** Mic dictation passthrough (use-voice); render no mic when unsupported. */
  dictation: DictationState;
  /** Read-aloud passthrough (use-voice); hook-level so one answer speaks at a time. */
  readAloud: ReadAloudState;
  /** The persistence scope in effect, e.g. "product:<id>". */
  scopeKey: string;
  conversationId: string | null;
};

export function useAskStream(options: UseAskStreamOptions = {}): AskStreamState {
  const enabled = options.enabled ?? true;
  const pointer = options.pointer ?? "durable";
  const { activeProductId, activeWorkspaceId } = useWorkspace();
  const productId = options.productId === undefined ? activeProductId : options.productId;
  const scopeKey = askScopeKey(productId, activeWorkspaceId);
  const retrievalProductId = options.retrievalProductId ?? null;
  const scope = options.scope ?? null;

  const [messages, setMessages] = React.useState<AskStreamMsg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [liveStatus, setLiveStatus] = React.useState<ResearchStatus | null>(null);
  const [promotedByMsg, setPromotedByMsg] = React.useState<Record<string, PromotedRecords>>({});
  const conversationIdRef = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const fCreate = useServerFn(createConversation);
  const fGetConversation = useServerFn(getConversation);
  const fCreateDecision = useServerFn(createDecision);
  const fCreateTask = useServerFn(createTask);
  const fCreateNote = useServerFn(createNoteFromAsk);
  const fMarkPromoted = useServerFn(markMessagePromoted);
  const doCreateProject = useServerFn(createProject);
  const queryClient = useQueryClient();

  // Voice passthroughs. Dictation's callback rides a ref inside use-voice,
  // so consumers can pass a fresh closure; absent a handler it is a no-op.
  const onDictationRef = React.useRef(options.onDictation);
  onDictationRef.current = options.onDictation;
  const dictation = useDictation((text) => onDictationRef.current?.(text));
  const readAloud = useReadAloud();

  const [storedConvId, setStoredConvId] = React.useState<string | null>(() =>
    readPointer(pointer, scopeKey),
  );
  const rememberConversationId = React.useCallback(
    (id: string | null) => {
      setStoredConvId(id);
      writePointer(pointer, scopeKey, id);
    },
    [pointer, scopeKey],
  );

  // Hydrate once per stored conversation (same contract as AskPanel).
  const hydratedRef = React.useRef<string | null>(null);

  // Scope switch (product/workspace change) swaps to that scope's own
  // thread: abort any in-flight stream (frames patch by id, so late frames
  // land nowhere), reset the thread, and re-read the scoped conversation.
  const prevScopeKeyRef = React.useRef(scopeKey);
  React.useEffect(() => {
    if (prevScopeKeyRef.current === scopeKey) return;
    prevScopeKeyRef.current = scopeKey;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreaming(false);
    setLiveStatus(null);
    conversationIdRef.current = null;
    hydratedRef.current = null;
    setMessages([]);
    setPromotedByMsg({});
    setStoredConvId(readPointer(pointer, scopeKey));
  }, [scopeKey, pointer]);

  const ensureConversation = React.useCallback(async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    // Adopt-and-validate the stored thread first: a message sent before
    // hydration resolves must land IN the stored conversation, not mint a
    // second one and orphan the history. fetchQuery dedupes with the
    // in-flight hydration query (same key).
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
    enabled: enabled && !!storedConvId && messages.length === 0,
    staleTime: Infinity,
  });
  React.useEffect(() => {
    const data = hydration.data;
    if (!data || !storedConvId || hydratedRef.current === storedConvId) return;
    if (!data.conversation) {
      // Stale or foreign id (RLS returns nothing): clear it, start fresh.
      rememberConversationId(null);
      return;
    }
    hydratedRef.current = storedConvId;
    conversationIdRef.current = storedConvId;
    const hydrated = hydrateMessages((data.messages ?? []) as StoredMessageRow[]);
    if (hydrated.length > 0) {
      setMessages((prev) => prependHydrated(prev, hydrated));
      setPromotedByMsg((prev) => seedPromoted(prev, hydrated));
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
    /**
     * `intent` is what the person chose in Ask's visible fork, forwarded so the
     * server stops guessing. Omitting it is exactly today's behaviour: the
     * classifier decides. See the field's note in src/routes/api/chat.ts. This
     * is a request field; the locked SSE response contract is untouched.
     */
    async (content: string, intent?: "ask" | "do") => {
      if (streaming) return;
      setStreaming(true);
      setLiveStatus(null);
      const now = Date.now();
      const userMsg: AskStreamMsg = { id: `u-${now}`, role: "user", content, at: now };
      const assistantMsg: AskStreamMsg = {
        id: `a-${now}`,
        role: "assistant",
        content: "",
        at: now,
      };
      setMessages((prev) => appendExchange(prev, userMsg, assistantMsg));
      // Every stream frame patches THIS message by id, never by index.
      const patchStreaming = (patch: (m: AskStreamMsg) => Partial<AskStreamMsg>) => {
        setMessages((prev) => {
          const target = prev.find((m) => m.id === assistantMsg.id);
          return target ? patchMessage(prev, assistantMsg.id, patch(target)) : prev;
        });
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
            ...(intent ? { intent } : {}),
            ...(scope || retrievalProductId
              ? {
                  scope: {
                    kinds: scope?.kinds,
                    sourceId: scope?.sourceId,
                    productId: retrievalProductId ?? undefined,
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
              // Typed receipts accumulate on the streaming message.
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
        // A deliberate stop (consumer closed mid stream) is not a failure.
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
          retryContent: content,
        }));
      } finally {
        abortControllerRef.current = null;
        setStreaming(false);
        setLiveStatus(null);
      }
    },
    [streaming, ensureConversation, scope, retrievalProductId],
  );

  const sendIntent = React.useCallback(
    (content: string) => {
      void send(content);
    },
    [send],
  );

  // Promote an answer to a record through the EXISTING create seams
  // (createDecision carries its stage-event + tracking side effects; never
  // re-implement them here). One promote per message+kind may be in flight:
  // both server fns are plain inserts, not idempotent.
  const promotePendingRef = React.useRef<Set<string>>(new Set());
  const recordPromotion = React.useCallback(
    (msg: AskStreamMsg, kind: "note" | "decision" | "task", recordId: string) => {
      const messageId = msg.dbId ?? (UUID_RE.test(msg.id) ? msg.id : null);
      if (!messageId) return;
      void fMarkPromoted({ data: { messageId, kind, recordId } }).catch((e) =>
        console.error("[ask] promotion write-back failed:", e),
      );
    },
    [fMarkPromoted],
  );
  const promote = React.useCallback(
    async (msg: AskStreamMsg, kind: "note" | "decision" | "task") => {
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

  // Fire-and-forget face of the async promote, stable for memoized children.
  const promoteMessage = React.useCallback(
    (msg: AskStreamMsg, kind: "note" | "decision" | "task") => {
      void promote(msg, kind);
    },
    [promote],
  );

  const retry = React.useCallback(
    (msgId: string, content: string) => {
      if (streaming) return;
      setMessages((prev) => removeExchange(prev, msgId));
      void send(content);
    },
    [send, streaming],
  );

  // "Start a project from this" (the sentence box folded into Ask, founder
  // ruling 2026-07-18): typing an idea can still start a real project. The
  // project lands in the workspace the user is standing in, never the
  // account default.
  const [startingProject, setStartingProject] = React.useState(false);
  const startingProjectRef = React.useRef(false);
  const startProjectFromIntent = React.useCallback(
    async (intent: string) => {
      const trimmed = intent.trim();
      if (!trimmed || startingProjectRef.current) return;
      startingProjectRef.current = true;
      setStartingProject(true);
      try {
        const created = await doCreateProject({
          data: {
            name: nameFromIntent(trimmed),
            status: "active" as const,
            ...(activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {}),
          },
        });
        const name = created.project?.name ?? "Your project";
        toast.success(`${name} created. The plan starts from your sentence.`);
        // Both caches that list products: the projects screens AND the
        // workspace switcher menu (its own ["products", workspaceId] key).
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["projects"] }),
          queryClient.invalidateQueries({ queryKey: ["products"] }),
        ]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not start the project. Try again.");
      } finally {
        startingProjectRef.current = false;
        setStartingProject(false);
      }
    },
    [doCreateProject, activeWorkspaceId, queryClient],
  );

  // Consumer went away (enabled false = the surface closed): abort any
  // in-flight stream and go quiet, exactly like AskPanel closing.
  React.useEffect(() => {
    if (enabled) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    readAloud.stop();
  }, [enabled, readAloud]);

  // Unmount cleanup: abort any in-flight stream when the component is
  // removed from the tree entirely (route navigation), or the fetch reader
  // loop keeps pulling chunks and calling setState on an unmounted tree.
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    messages,
    streaming,
    liveStatus,
    sendIntent,
    retry,
    startNewConversation,
    promote: promoteMessage,
    promotedByMsg,
    startProjectFromIntent,
    startingProject,
    dictation,
    readAloud,
    scopeKey,
    conversationId: storedConvId,
  };
}
