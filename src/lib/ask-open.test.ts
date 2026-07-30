/**
 * ASK AND THREADS ARE ONE OBJECT AT TWO MOMENTS. Two obligations follow, and
 * this file is the proof for both. Without them the architecture is a claim.
 */
import { describe, expect, it, beforeEach } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openAskConversation } from "./ask-open";
import {
  ASK_CONVERSATION_MAP_KEY,
  clearSessionConversations,
  parseConversationMap,
  readSessionConversationId,
} from "./ask-stream-core";

const CONV = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function src(rel: string): string {
  return readFileSync(join(import.meta.dir, rel), "utf8");
}

/**
 * OBLIGATION ONE: every Ask conversation is findable in Threads.
 *
 * This is a property of WHERE the two halves write and read, so it is asserted
 * at that level rather than mocked. Ask mints its conversation through
 * `createConversation`, which inserts into `conversations`; `listThreads` reads
 * `conversations` with nothing but RLS in front of it and no filter of its own.
 * Same table, same rows, so the conversation is a thread the moment it exists.
 *
 * The test that would actually catch the regression is the one that fails if
 * either half moves to a different table, which is exactly what these assert.
 */
describe("Ask conversations are findable in Threads", () => {
  const conversations = src("conversations.functions.ts");
  const threads = src("threads.functions.ts");

  it("Ask mints its conversation in the `conversations` table", () => {
    expect(conversations).toContain("export const createConversation");
    expect(conversations).toContain('.from("conversations")');
  });

  it("Threads lists that same table", () => {
    expect(threads).toContain("export const listThreads");
    expect(threads).toContain('.from("conversations")');
  });

  it("and the turns land in `messages`, which is what Threads reads back", () => {
    expect(threads).toContain('.from("messages")');
    // The Ask stream persists through /api/chat, so the writer is over there.
    const chat = readFileSync(join(import.meta.dir, "..", "routes", "api", "chat.ts"), "utf8");
    expect(chat).toContain('.from("messages")');
    expect(chat).toContain('.from("conversations")');
  });

  it("Threads has a way back into Ask, so re-reading and continuing are one motion", () => {
    const threadsSurface = readFileSync(
      join(import.meta.dir, "..", "routes", "_authenticated.threads.tsx"),
      "utf8",
    );
    expect(threadsSurface).toContain("openAskConversation");
    expect(threadsSurface).toContain("Continue in Ask");
  });
});

/**
 * OBLIGATION TWO: Threads can reopen a conversation INTO Ask.
 *
 * `useAskStream` resolves its conversation once, from the per-scope map, in a
 * state initialiser. So reopening is: write that scope's entry, then summon.
 */
describe("openAskConversation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearSessionConversations();
  });

  // The pane stopped reading the durable map when Ask was made to open fresh on
  // every page load (founder ruling 2026-07-30). A localStorage-only write
  // would leave the click doing nothing visible, which is the exact defect the
  // switcher exists to remove.
  //
  // And it lands in the WORKSPACE bucket even for a product-scoped thread: the
  // pane holds one live conversation per session, so filing this under p-9
  // would survive exactly until the first Escape and then vanish.
  it("points the ASK PANE at it, which is the store the pane actually reads", () => {
    openAskConversation({ conversationId: CONV, productId: "p-9", workspaceId: "w-1" });
    expect(readSessionConversationId("workspace:w-1")).toBe(CONV);
    expect(readSessionConversationId("product:p-9")).toBeNull();
  });

  it("files the conversation under the THREAD's product, not the active one", () => {
    openAskConversation({ conversationId: CONV, productId: "p-9", workspaceId: "w-1" });
    const map = parseConversationMap(window.localStorage.getItem(ASK_CONVERSATION_MAP_KEY));
    expect(map["product:p-9"]).toBe(CONV);
    expect(map["workspace:w-1"]).toBeUndefined();
  });

  it("a thread with no product of its own lands in the workspace bucket", () => {
    openAskConversation({ conversationId: CONV, productId: null, workspaceId: "w-1" });
    const map = parseConversationMap(window.localStorage.getItem(ASK_CONVERSATION_MAP_KEY));
    expect(map["workspace:w-1"]).toBe(CONV);
  });

  it("leaves every other scope's thread alone", () => {
    window.localStorage.setItem(
      ASK_CONVERSATION_MAP_KEY,
      JSON.stringify({ "product:other": "11111111-2222-3333-4444-555555555555" }),
    );
    openAskConversation({ conversationId: CONV, productId: "p-9", workspaceId: "w-1" });
    const map = parseConversationMap(window.localStorage.getItem(ASK_CONVERSATION_MAP_KEY));
    expect(map["product:other"]).toBe("11111111-2222-3333-4444-555555555555");
    expect(map["product:p-9"]).toBe(CONV);
  });

  it("summons Ask, carrying the conversation so the pane can remount on it", () => {
    const seen: { conversationId?: string; productId?: string | null }[] = [];
    const onAsk = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener("supaprod:open-ask", onAsk);
    openAskConversation({ conversationId: CONV, productId: "p-9", workspaceId: "w-1" });
    window.removeEventListener("supaprod:open-ask", onAsk);
    expect(seen).toEqual([{ conversationId: CONV, productId: "p-9" }]);
  });
});
