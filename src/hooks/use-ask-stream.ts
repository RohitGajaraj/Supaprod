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
import type { DispatchBlock } from "@/lib/chat-dispatch";
import type { PlanProposal } from "@/lib/ask/plan-proposal";
import type { PlanGateDecision } from "@/components/meridian/PlanGate";
import type { AgentStation } from "@/lib/agent-vocabulary";
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

/* ------------------------- the work this turn ---------------------- */

/**
 * WHAT THE CREW IS DOING, as distinct from what the answer says.
 *
 * The five original SSE frames all describe an ANSWER. When a message
 * DISPATCHES work instead, `/api/chat` emits one delta carrying a mission id
 * and then `[DONE]`, so from that moment the pane knows a mission exists and
 * nothing else about it: the person is told work opened and then shown nothing.
 * `src/lib/ask-sse.ts` now parses three frames that fix that at the protocol
 * level (`station`, `tool`, `landing`); this is the state they land in.
 *
 * Each field holds the SMALLEST honest fact the frame carried, never a rendered
 * sentence. `station` is one of the seven, so a surface can light the spine.
 * `tools` is the registry names seen this turn IN ORDER, which a surface turns
 * into "drafting a spec" through `toolActionLabel` and must never print raw.
 * `landing` is where a result came to rest, so a run can hand back to the
 * station that owns it instead of ending in a chat log.
 *
 * A FOURTH FIELD, `blocked`, HOLDS THE OPPOSITE FACT: a run was asked for and
 * none opened. It is here rather than on the message because it is a state, not
 * a sentence, and the sentence a person reads is derived from it.
 *
 * TWO OF THE THREE ARE ON THE WIRE NOW. `api/chat.ts` emits `station` once, off
 * the agent a mention resolved to, and a `tool` frame per research phase that
 * actually calls one -- plus, since 2026-08-22, one on the plain chat branch for
 * the workspace search it was already running silently. `landing` is emitted from
 * the mission branch. The frames still arrive only on turns that dispatch,
 * research, or search, so `NO_WORK` below stays
 * a single frozen value rather than a fresh object per render: an ordinary
 * answer gets the IDENTICAL reference on every render and a memoized consumer
 * sees no change at all.
 */
export type AskWork = {
  /** The station the work moved to, or null when no frame has said. */
  station: AgentStation | null;
  /** Registry tool names seen this turn, oldest first. Never shown raw. */
  tools: string[];
  /**
   * Everywhere a result came to rest this turn, oldest first.
   *
   * PLURAL, AND IT WAS SINGULAR FOR AN HOUR. Built as one nullable landing
   * overwritten by each frame, which silently kept only the LAST one. A single
   * run routinely hands back more than one thing -- a decision, and then the
   * spec that followed from it -- and the one that got dropped was the second,
   * whose home is the harder of the two to guess. `AskTurn` was written the
   * same day against `landings: LandedArtifact[]` for exactly that reason, so
   * the two halves of one feature disagreed about the shape while nothing was
   * yet emitting frames to make the disagreement visible.
   */
  landings: Array<{ kind: string; id: string; station?: AgentStation }>;
  /**
   * WHY NO RUN OPENED, when one was asked for and none did.
   *
   * The three fields above are facts about work that happened. This is the
   * absence, and it is a field rather than the lack of one because a person who
   * pressed "Hand it over" is owed the difference between "nothing has arrived
   * yet" and "nothing is coming". Null on every turn where a run was not
   * refused, which is nearly all of them.
   *
   * The ID, never the sentence. `dispatchBlockedMessage` and
   * `dispatchBlockRoute` both key off it, so the surface renders one state
   * rather than assembling two halves that could disagree.
   */
  blocked: DispatchBlock | null;
};

/** The inert value. Frozen so a consumer cannot mutate the shared empty. The
 *  array is frozen too: an unfrozen one would let a consumer push into the
 *  shared empty and give every other turn a landing it never had. */
const NO_WORK: AskWork = Object.freeze({
  station: null,
  tools: [],
  landings: Object.freeze([]) as unknown as AskWork["landings"],
  blocked: null,
});

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
/**
 * WHAT BECAME OF ONE PLAN GATE, once it was answered.
 *
 * FOUR STATES AND NOT A BOOLEAN, because the four are what a person needs told
 * apart and three of them are terminal in different ways. "Sent back" is not a
 * failure and must not read as one; "failed" is not a send-back and the answer
 * can be given again; "started" is the only one where a run exists to go and
 * watch. A `busy` flag plus a nullable mission id would collapse three of these
 * into the same rendering.
 */
export type PlanDecisionState =
  | { status: "deciding" }
  // `trackId` is the work's identity since R-24 folded gated dispatches into
  // tracks; `missionId` remains for the SSE mission path and stays null here.
  | { status: "started"; trackId?: string | null; missionId?: string | null }
  | { status: "sent-back" }
  | { status: "failed"; message: string };

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
  /**
   * The work frames for the CURRENT turn. Reset when a new turn starts, and
   * deliberately NOT cleared when the stream ends: the whole defect is that the
   * pane goes blind at `[DONE]` on a message that dispatched work, so the last
   * station and the landing have to survive past it for the reader to act on.
   */
  work: AskWork;
  /** Send one user intent into the thread (no-op while a stream is in flight). */
  sendIntent: (content: string, intent?: "ask" | "do") => void;
  /** Remove an error exchange and resend its content. */
  retry: (msgId: string, content: string) => void;
  startNewConversation: () => void;
  /** Promote an answer to a record (note / decision / task). */
  promote: (msg: AskStreamMsg, kind: "note" | "decision" | "task") => void;
  promotedByMsg: Record<string, PromotedRecords>;
  /**
   * The plan published on an answer, keyed by that answer's id.
   *
   * Kept across later turns on purpose: a gate is an open question, and clearing
   * it when the next message is sent would take it off the screen with no way
   * back to it. See the `plan-proposal` branch in the read loop.
   */
  proposalByMsg: Record<string, PlanProposal>;
  /** What became of each answered gate. Absent means it is still open. */
  planDecisionByMsg: Record<string, PlanDecisionState>;
  /** Answer one plan gate. The route it posts to outlives the stream that asked. */
  decidePlan: (msgId: string, decision: PlanGateDecision) => void;
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
  const [work, setWork] = React.useState<AskWork>(NO_WORK);
  const [promotedByMsg, setPromotedByMsg] = React.useState<Record<string, PromotedRecords>>({});
  /**
   * THE OPEN GATES, one per answer that published a plan.
   *
   * Two maps rather than one object with a nullable decision, because they are
   * written by two different things at two different times: the stream writes
   * the proposal and only the person's answer writes the decision. Merging them
   * would make every proposal frame touch a field it knows nothing about.
   */
  const [proposalByMsg, setProposalByMsg] = React.useState<Record<string, PlanProposal>>({});
  const [planDecisionByMsg, setPlanDecisionByMsg] = React.useState<
    Record<string, PlanDecisionState>
  >({});
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
    setWork(NO_WORK);
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
    setWork(NO_WORK);
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
      // A new turn starts with no work behind it. With no server emitting the
      // work frames this sets the state to the SAME reference it already holds,
      // which React bails out of, so nothing re-renders and the existing path
      // is untouched.
      setWork(NO_WORK);
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
            /**
             * THE THREE WORK FRAMES. They sit here, above the `delta` guard
             * that used to swallow everything it did not recognise, and each
             * one only ever ADDS a fact: nothing below is reordered and no
             * existing branch changed, so a server that emits none of them
             * leaves this loop behaving exactly as it did.
             */
            if (event.kind === "station") {
              // Same station twice is the same fact. Returning the previous
              // object rather than a fresh one keeps a re-render off the
              // surface for a frame that said nothing new.
              setWork((w) => (w.station === event.station ? w : { ...w, station: event.station }));
              continue;
            }
            if (event.kind === "tool") {
              // Appended, never deduplicated: an agent that ran the same tool
              // twice DID run it twice, and collapsing that would quietly
              // rewrite the trail. The array is per-turn and reset on the next
              // send, so it cannot accumulate across a conversation.
              setWork((w) => ({ ...w, tools: [...w.tools, event.tool] }));
              continue;
            }
            if (event.kind === "landing") {
              // A landing carries the station that OWNS the result, so when it
              // names one the spine follows it there. That is the frame's whole
              // purpose: a run hands back to a station rather than ending in a
              // chat log. When it names none, the station already lit stands.
              setWork((w) => ({
                ...w,
                // Append, never replace. See the field's own comment: a run
                // that hands back two artifacts must not report one.
                landings: [...w.landings, event.artifact],
                station: event.artifact.station ?? w.station,
              }));
              continue;
            }
            if (event.kind === "plan-proposal") {
              /**
               * KEYED BY THE MESSAGE, NOT HELD IN `work`, and that is the one
               * place this frame parts company with the four beside it.
               *
               * `work` is per-TURN and reset the moment the next one starts, and
               * for `station` / `tool` / `landing` / `blocked` that is right:
               * they describe the request in flight and re-labelling an older
               * answer with a newer run's facts is the exact lie those fields
               * exist to prevent.
               *
               * A gate is different because it is UNANSWERED. Clearing it on the
               * next send would take an open question off the screen while it
               * was still open, and the person would have no way back to it —
               * nothing persists a proposal. So it lands in a map beside
               * `promotedByMsg`, which already keeps a per-message fact across
               * turns for exactly this reason, and stays on its own turn where
               * the question was asked.
               *
               * FIRST ONE WINS, on the same rule as `dispatch-blocked`: the
               * server returns the instant it publishes a plan, so a second
               * proposal on one turn would be two plans for one request, and
               * overwriting would swap the plan under a person mid-decision.
               */
              const forMsg = assistantMsg.id;
              setProposalByMsg((m) => (m[forMsg] ? m : { ...m, [forMsg]: event.proposal }));
              continue;
            }
            if (event.kind === "dispatch-blocked") {
              // FIRST REASON WINS. `api/chat.ts` returns the instant it blocks,
              // so a second one on the same turn would mean two refusals for one
              // request, and the later one would be describing a retry this
              // stream never made. Overwriting would show the person the second.
              setWork((w) => (w.blocked ? w : { ...w, blocked: event.reason }));
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

  /**
   * THE FORK THE PERSON PRESSED WAS THROWN AWAY HERE.
   *
   * `send` above has always accepted an `intent` and forwarded it as a request
   * field, and `api/chat.ts:399-400` has always read it into `forcedAsk` /
   * `forcedDo`. This wrapper took one argument and passed one argument, so the
   * field was never emitted by anything and both flags were permanently false.
   * The classifier went on guessing while the pane showed a control implying it
   * did not have to.
   *
   * "Hand it over" survived the gap by accident: `contentForIntent` prefixes
   * the conductor's alias, and a resolved mention skips the classifier on its
   * own (a prefix retired 2026-08-22; see `ask-intent.ts`). ASK had no
   * such fallback, so the half that was broken is the half that matters — the
   * one where a question misread as an instruction dispatches a mission the
   * person never asked for and spends real money doing it.
   */
  const sendIntent = React.useCallback(
    (content: string, intent?: "ask" | "do") => {
      void send(content, intent);
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

  /**
   * ANSWER ONE PLAN GATE.
   *
   * ── WHY THIS IS A SECOND REQUEST AND NOT A FRAME BACK UP THE STREAM ─────
   *
   * The stream that published the plan is closed. It closed itself: the server
   * writes the proposal, the meta and `[DONE]` and shuts the controller, because
   * a person reading a plan takes seconds or minutes and an isolate held open
   * for that is an isolate held open for nothing. So the answer travels on
   * `/api/plan-gate`, which is a route with its own lifetime — the same shape
   * `mission_steps` approvals have always had, and the shape `ask-sse.ts` argues
   * for whenever something outlives the request that started it.
   *
   * ── WHAT IS SENT, AND WHAT IS DELIBERATELY NOT ─────────────────────────
   *
   * The proposal goes back exactly as it arrived, and the server re-derives the
   * route from it rather than believing any plan this client draws. What only
   * this client can supply travels beside it: the answer, and the edits the
   * person made before answering. `PlanGate` hands back the whole edited plan as
   * component state; it is reduced here to the two things that are actually a
   * DIFFERENCE from what was proposed — steps taken out and stations waived,
   * each with the reason given. Posting the full step list would be posting a
   * copy of something the server can compute, and a copy is a thing that drifts.
   *
   * ONE ANSWER PER GATE IS ENFORCED IN BOTH PLACES. Here, because the state is
   * set to `deciding` before the fetch and a second call sees it. And on the
   * server, off the proposal id, because a guard that only exists in a React
   * component is not a guard — this repo has a migration whose whole subject is
   * a gate that was answered twice.
   */
  const decidePlan = React.useCallback(
    (msgId: string, decision: PlanGateDecision) => {
      const proposal = proposalByMsg[msgId];
      if (!proposal) return;
      /*
       * A FAILED ANSWER IS NOT AN ANSWER, so it does not close the gate. Every
       * other state does: `deciding` means one is in flight, and `started` and
       * `sent-back` are both settled and both wrote a row. Only the failure left
       * the plan exactly as it was, which is the one case where asking again is
       * the right thing rather than a second decision.
       */
      const current = planDecisionByMsg[msgId];
      if (current && current.status !== "failed") return;
      setPlanDecisionByMsg((m) => ({ ...m, [msgId]: { status: "deciding" } }));

      void (async () => {
        try {
          const convId = conversationIdRef.current;
          if (!convId) throw new Error("no conversation");
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const res = await fetch("/api/plan-gate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({
              conversationId: convId,
              proposal: {
                id: proposal.id,
                shape: proposal.shape,
                station: proposal.station,
                origin: proposal.origin,
                title: proposal.title,
                goal: proposal.goal,
                spend_cap_usd: proposal.spendCapUsd,
              },
              autonomy: decision.autonomy,
              ...(decision.reason ? { reason: decision.reason } : {}),
              edits: {
                skipped: decision.editedPlan.steps
                  .filter((s) => s.state === "skipped")
                  .map((s) => ({ id: s.id, why: s.why ?? null })),
                waived: decision.editedPlan.stops
                  .filter((s) => s.state === "skipped")
                  .map((s) => ({ station: s.station, reason: s.waivedReason ?? null })),
              },
            }),
          });
          const payload = (await res.json().catch(() => null)) as {
            missionId?: string | null;
            trackId?: string | null;
            message?: string;
            error?: string;
          } | null;
          if (!res.ok) {
            throw new Error(payload?.error || "I could not send that answer just now. Try again.");
          }
          /*
           * A confirmed piece of work now comes back as a TRACK (R-24, item
           * 16): the gate's answer creates it with the route the person just
           * confirmed, and the persisted assistant message carries the
           * `/track/:id?start=true` door. `missionId` stays in the payload and
           * stays null until the Build station opens one, so it is read second,
           * not deleted — the SSE mission path still uses that field.
           */
          const trackId = payload?.trackId ?? null;
          const missionId = payload?.missionId ?? null;
          if (trackId || missionId) {
            setPlanDecisionByMsg((m) => ({
              ...m,
              [msgId]: { status: "started", trackId, missionId },
            }));
            if (missionId) {
              // The mission attach only when one truly exists — patching a null
              // in would light AskRunCard for a run that is not a mission.
              setMessages((prev) => patchMessage(prev, msgId, { mission_id: missionId }));
            }
          } else {
            setPlanDecisionByMsg((m) => ({ ...m, [msgId]: { status: "sent-back" } }));
          }
        } catch (e) {
          setPlanDecisionByMsg((m) => ({
            ...m,
            [msgId]: {
              status: "failed",
              message:
                e instanceof Error && e.message
                  ? e.message
                  : "I could not send that answer just now. Try again.",
            },
          }));
        }
      })();
    },
    [proposalByMsg, planDecisionByMsg],
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
    work,
    sendIntent,
    retry,
    startNewConversation,
    promote: promoteMessage,
    promotedByMsg,
    proposalByMsg,
    planDecisionByMsg,
    decidePlan,
    startProjectFromIntent,
    startingProject,
    dictation,
    readAloud,
    scopeKey,
    conversationId: storedConvId,
  };
}
