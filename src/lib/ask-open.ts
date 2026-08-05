/**
 * The way back from Threads into Ask.
 *
 * Ask and Threads are one object at two moments. Ask is the conversation
 * happening; Threads is that same conversation remembered. The first direction
 * needs no code at all: Ask writes through `conversations.functions.ts` and
 * `listThreads` reads the `conversations` table with nothing but RLS in front
 * of it, so an Ask conversation is a thread as soon as it exists.
 *
 * The second direction is this file. `useAskStream` resolves its conversation
 * ONCE, from the per-scope map in localStorage, in a state initialiser. So
 * reopening a thread is: write that scope's entry, then summon. The pane is
 * keyed on the conversation id, so it remounts and the hook hydrates the thread
 * from the same table Threads just read it from.
 *
 * Deliberately NOT a change to `use-ask-stream.ts`: the hook's resolve-once
 * behaviour is what keeps a live stream from being yanked onto another
 * conversation mid-answer, and adding a second write path into it to support
 * one button would be trading that guarantee for a convenience.
 */

import {
  ASK_CONVERSATION_MAP_KEY,
  askScopeKey,
  parseConversationMap,
  withConversationId,
  writeSessionConversationId,
} from "@/lib/ask-stream-core";
import type { AskOpenDetail } from "@/lib/ask-context";

/**
 * Open the Ask pane. The one way any surface asks for the front door.
 *
 * WHY THIS EXISTS RATHER THAN EACH CALLER DOING IT. Two buttons shipped on
 * Today (2026-08-05) that opened Ask by synthesising a keyboard event:
 *
 *     window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }))
 *
 * Both were DEAD. The binding in AskProvider is `(metaKey || ctrlKey) && key === "k"`
 * (ask-context.tsx), never "j", so those events landed on no listener at all and
 * clicking either button did nothing. Neither typecheck nor any test could see
 * it: a synthetic event is valid TypeScript, and nothing asserts that a
 * dispatched key matches a registered binding.
 *
 * Two lessons are baked in here. Never drive the app by simulating the input a
 * human would make — call the thing the shortcut calls, so a button and its
 * shortcut cannot disagree. And `supaprod:open-ask` is that thing: it is the
 * event AskProvider listens for, and what the shell's own Ask button dispatches.
 *
 * `intent` runs the moment the pane opens, so a surface that already knows what
 * the person came to do can hand the conversation its first turn.
 */
export function openAsk(intent?: string): void {
  if (typeof window === "undefined") return;
  const trimmed = intent?.trim();
  const detail: AskOpenDetail = trimmed ? { intent: trimmed } : {};
  window.dispatchEvent(new CustomEvent("supaprod:open-ask", { detail }));
}

/**
 * Reopen a conversation in Ask.
 *
 * `productId` is the THREAD's product, not the active one: a thread that was
 * never scoped to a product belongs in the workspace bucket, and filing it
 * under whatever product happens to be selected would quietly move it.
 */
export function openAskConversation(args: {
  conversationId: string;
  productId: string | null;
  workspaceId: string | null;
}): void {
  if (typeof window === "undefined") return;
  const scopeKey = askScopeKey(args.productId, args.workspaceId);
  // BOTH stores, because they answer different questions.
  //
  // The session map is the ASK PANE's pointer: the pane opens on a new
  // conversation after every page load (founder ruling 2026-07-30), so it no
  // longer reads the durable map at all and a localStorage-only write would
  // leave this click doing nothing visible. It is written to the WORKSPACE
  // bucket rather than the thread's product, because the pane now holds one
  // live conversation per session; filing it under the thread's product would
  // put it somewhere the pane never looks the moment it closes.
  //
  // The durable map is the Mission Control room's, it still files a thread
  // under the thread's own product, and it is left exactly as it was.
  writeSessionConversationId(askScopeKey(null, args.workspaceId), args.conversationId);
  try {
    const map = parseConversationMap(window.localStorage.getItem(ASK_CONVERSATION_MAP_KEY));
    window.localStorage.setItem(
      ASK_CONVERSATION_MAP_KEY,
      JSON.stringify(withConversationId(map, scopeKey, args.conversationId)),
    );
  } catch {
    // Storage can be unavailable (private mode). The pane still opens; it just
    // opens on this scope's current thread rather than the one asked for, and
    // that is a smaller lie than pretending the click did nothing.
  }
  const detail: AskOpenDetail = {
    conversationId: args.conversationId,
    productId: args.productId,
  };
  window.dispatchEvent(new CustomEvent("supaprod:open-ask", { detail }));
}
