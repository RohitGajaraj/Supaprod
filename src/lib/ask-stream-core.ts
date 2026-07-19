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
 * Hydration prepends history (never replaces) so an exchange the user
 * started before history landed is kept; stream frames patch by id, so
 * prepending under a live stream is safe.
 */
export function prependHydrated(prev: AskStreamMsg[], hydrated: HydratedMsg[]): AskStreamMsg[] {
  return prev.length > 0 ? [...hydrated, ...prev] : [...hydrated];
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
