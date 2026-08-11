// Front-end reimagining (Mission Control): the pure half of the Ask stream
// hook (src/hooks/use-ask-stream.ts), EXTRACTED from AskPanel.tsx so the
// thread reducer and the per-scope conversation persistence are unit-testable
// without a mounted React tree. AskPanel keeps its own inline copies and its
// v1 single-conversation key; nothing here changes its behavior.

import type { ChatMeta } from "@/components/chat/MessageMeta";
import type { AnswerBlock } from "@/lib/ask-blocks";
import type { HydratedMsg, PromotedRecordIds } from "@/lib/ask-thread";

/** One thread message. Shape identical to AskPanel's private `Msg`. */
export type AskStreamMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Local receive time, for hover timestamps and day dividers. */
  at: number;
  mission_id?: string | null;
  meta?: ChatMeta | null;
  /** Typed answer blocks, rendered above the prose. */
  blocks?: AnswerBlock[];
  /** The persisted row id (from the {persisted} frame), for promote write-back. */
  dbId?: string;
  error?: boolean;
  /** The user content to resend from the error card's retry. */
  retryContent?: string;
};

/** What an answer was promoted into, keyed per message. */
export type PromotedRecords = PromotedRecordIds;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ------------------------- thread reducer ------------------------- */

/** A send appends the user turn and its empty streaming assistant turn. */
export function appendExchange(
  prev: AskStreamMsg[],
  userMsg: AskStreamMsg,
  assistantMsg: AskStreamMsg,
): AskStreamMsg[] {
  return [...prev, userMsg, assistantMsg];
}

/**
 * Patch ONE message by id, never "the last message" by index, so no thread
 * mutation (a retry removing an exchange, a hydration prepend under a live
 * stream) can redirect in-flight frames onto the wrong message. Missing id
 * is a no-op (the thread may have been reset under an aborted stream).
 */
export function patchMessage(
  prev: AskStreamMsg[],
  id: string,
  patch: Partial<AskStreamMsg>,
): AskStreamMsg[] {
  return prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

/**
 * Retry removes THAT exchange (the error card plus its user turn when the
 * message directly above is one), wherever it sits in the thread - never a
 * blind last-two slice. Extracted verbatim from AskPanel's retry.
 */
export function removeExchange(prev: AskStreamMsg[], msgId: string): AskStreamMsg[] {
  const i = prev.findIndex((m) => m.id === msgId);
  if (i === -1) return prev;
  const start = i > 0 && prev[i - 1].role === "user" ? i - 1 : i;
  return [...prev.slice(0, start), ...prev.slice(i + 1)];
}

/**
 * How close in time two rows must be before identical text is read as ONE
 * message seen twice rather than as somebody asking the same thing again.
 *
 * Two minutes is chosen against the thing being measured: the gap between a
 * client minting an optimistic row and the server's copy of that same row
 * coming back through hydration. That is a network round trip plus a write, so
 * it is seconds, and two minutes is roughly two orders of magnitude of headroom
 * for a slow connection and a skewed clock. It is also far below the gap
 * between a person asking one question and deciding to ask it again in the same
 * words, which is the only case this could ever get wrong.
 */
const SAME_MESSAGE_WINDOW_MS = 120_000;

/**
 * HYDRATION PREPENDS HISTORY, AND SINCE 2026-08-11 IT NO LONGER PREPENDS THE
 * MESSAGE YOU JUST SENT.
 *
 * THE DEFECT, in the founder's words: *"If I type anything or if the user gives
 * an input, every input gets recorded twice in the conversation pane, and it
 * gets displayed. It's not proper. Something is buggy."*
 *
 * THE RACE. `use-ask-stream` runs a hydration query gated on
 * `messages.length === 0`, which is evaluated when the query is CREATED and does
 * not cancel a request already in flight. So:
 *   1. the pane opens on a stored conversation, the thread is empty, hydration
 *      starts, and the request is on the wire;
 *   2. before it lands, the person sends. `appendExchange` optimistically adds
 *      their turn with a locally minted id, `u-<timestamp>`, and `/api/chat`
 *      writes that same turn to the conversation server side;
 *   3. hydration resolves, carrying the server's copy of the turn just written;
 *   4. this function spliced the whole server list in front of local state and
 *      de-duplicated nothing, so both copies survived. Their ids differ, one
 *      local and one a uuid, so React keys never collided and both rendered.
 *
 * It reproduces on EVERY open, not once: the pane unmounts when closed, so
 * `messages` and the hook's `hydratedRef` are fresh on each summon, and the
 * whole race runs again. Anybody who types straight after pressing Cmd+K sees
 * it; anybody who waits a second never does, which is why it looked
 * intermittent.
 *
 * THE RECORD WAS NEVER WRONG. One row was written and one row exists. This is a
 * client-side merge defect, and this function is where the merge lives.
 *
 * WHY NOT THE OBVIOUSLY CLEANER FIX. The right answer is for the optimistic row
 * to ADOPT the server's id once the write returns, after which a union by id
 * collapses the two with no inspection of content at all. `/api/chat` does not
 * surface that id: it persists the user turn itself and its SSE response
 * contract is locked, so the ids only ever come back through hydration. Doing it
 * properly is a server change and belongs in its own pass. This is the correct
 * fix available on the client today.
 *
 * WHY IT DROPS THE SERVER'S COPY RATHER THAN THE LOCAL ONE, which is not
 * arbitrary. Live stream frames patch by the LOCAL id (`patchMessage` against
 * `a-<timestamp>`), and `removeExchange` on a retry works off the same ids.
 * Dropping the local row would strand an in-flight answer with nothing to write
 * into. The local row is load bearing; the server's copy of it is not.
 *
 * WHY A TIME WINDOW AND NOT CONTENT ALONE. Asking the same question twice is a
 * real thing people do, and matching on text alone would silently swallow the
 * older one. Pairing text with `SAME_MESSAGE_WINDOW_MS` means the only way to
 * lose a line is to send character-identical text twice inside two minutes
 * across a hydration boundary. Even then nothing is destroyed: the record is
 * untouched and reopening the conversation shows both, because by then there is
 * no local copy to match against.
 *
 * MATCHED ONCE EACH. The pairing is a multiset, so a person who genuinely sent
 * the same line twice inside the window and has two local copies keeps two.
 */
export function prependHydrated(prev: AskStreamMsg[], hydrated: HydratedMsg[]): AskStreamMsg[] {
  if (prev.length === 0) return [...hydrated];
  // Each local row may absorb at most one server row, so `claimed` marks the
  // local rows already spoken for.
  const claimed = new Set<number>();
  const history = hydrated.filter((h) => {
    const i = prev.findIndex(
      (p, idx) =>
        !claimed.has(idx) &&
        p.role === h.role &&
        p.content === h.content &&
        Math.abs(p.at - h.at) <= SAME_MESSAGE_WINDOW_MS,
    );
    if (i === -1) return true;
    claimed.add(i);
    return false;
  });
  return [...history, ...prev];
}

/** Seed the promoted-records map from hydrated rows (receipt chips survive refresh). */
export function seedPromoted(
  prev: Record<string, PromotedRecords>,
  hydrated: HydratedMsg[],
): Record<string, PromotedRecords> {
  const seeded = { ...prev };
  for (const m of hydrated) if (m.promoted) seeded[m.id] = m.promoted;
  return seeded;
}

/* ---------------------- persistence keying ------------------------ */
// Per-scope thread persistence: the hook replaces AskPanel's single
// localStorage conversation key with a client-side map keyed by product
// (workspace fallback). NO schema change: the map lives in localStorage and
// the conversations themselves persist through conversations.functions.ts
// exactly as AskPanel uses them.

/** The v2 map key: JSON object of scopeKey -> conversation uuid. */
export const ASK_CONVERSATION_MAP_KEY = "supaprod.ask.conversations.v2";
/** AskPanel's v1 single-conversation key, read as a fallback only. */
export const LEGACY_ASK_CONVERSATION_KEY = "supaprod.ask.conversation.v1";

/** Product wins, workspace is the fallback, then a global bucket. */
export function askScopeKey(productId?: string | null, workspaceId?: string | null): string {
  if (productId) return `product:${productId}`;
  if (workspaceId) return `workspace:${workspaceId}`;
  return "global";
}

/**
 * Parse the stored map. Malformed storage reads as empty and non-uuid values
 * are dropped (same hardening as AskPanel's v1 read: the server fn rejects
 * non-uuids, so a bad value would wedge hydration in a permanent error).
 */
export function parseConversationMap(raw: string | null): Record<string, string> {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string" && UUID_RE.test(value)) out[key] = value;
  }
  return out;
}

/**
 * Resolve the conversation for a scope. The legacy v1 id (AskPanel's key)
 * is honored only for non-product scopes: the old key never knew products,
 * so a product thread must not silently inherit the global conversation.
 */
export function conversationIdForScope(
  map: Record<string, string>,
  scopeKey: string,
  legacyId?: string | null,
): string | null {
  const direct = map[scopeKey];
  if (direct) return direct;
  if (!scopeKey.startsWith("product:") && legacyId && UUID_RE.test(legacyId)) return legacyId;
  return null;
}

/** Return a new map with the scope's conversation set (or cleared with null). */
export function withConversationId(
  map: Record<string, string>,
  scopeKey: string,
  id: string | null,
): Record<string, string> {
  const next = { ...map };
  if (id) next[scopeKey] = id;
  else delete next[scopeKey];
  return next;
}

/* ------------- the session pointer: fresh on every load ----------- */

/**
 * WHICH CONVERSATION IS LIVE, for a surface that must open FRESH.
 *
 * Founder ruling, 2026-07-30: *"every single time when a user logs in,
 * shouldn't it be a new window where a fresh screen appears? If you show me
 * threads of a hundred plus messages, it would become too humongous to
 * grasp."* And the nuance that makes it right rather than merely new: closing
 * a pane is not ending a conversation, so Escape and reopen must land back in
 * the same one. Getting either half backwards is a bug.
 *
 * Both halves are one storage decision. The map above lives in localStorage,
 * so it outlives the tab and hands a fresh login a months-old thread. This map
 * is a module variable, so it dies with the page and survives everything
 * shorter than that: the Ask pane unmounts on every close and remounts on
 * every open, and a module does not.
 *
 * It is a SECOND store rather than a replacement because the Mission Control
 * room keeps the durable one. That room is one long-lived workspace per URL
 * rather than a summoned pane, and nothing about it asked to be reset.
 */
const sessionConversations: Record<string, string> = {};

export function readSessionConversationId(scopeKey: string): string | null {
  return sessionConversations[scopeKey] ?? null;
}

export function writeSessionConversationId(scopeKey: string, id: string | null): void {
  if (id) sessionConversations[scopeKey] = id;
  else delete sessionConversations[scopeKey];
}

/** Tests only. A module map outlives a test case the way it outlives a pane. */
export function clearSessionConversations(): void {
  for (const key of Object.keys(sessionConversations)) delete sessionConversations[key];
}
