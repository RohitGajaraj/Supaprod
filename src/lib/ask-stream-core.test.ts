import { describe, it, expect } from "bun:test";
import {
  appendExchange,
  askScopeKey,
  conversationIdForScope,
  parseConversationMap,
  patchMessage,
  prependHydrated,
  removeExchange,
  seedPromoted,
  withConversationId,
  type AskStreamMsg,
} from "./ask-stream-core";
import type { HydratedMsg } from "./ask-thread";

const UUID_A = "11111111-2222-3333-4444-555555555555";
const UUID_B = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

function msg(partial: Partial<AskStreamMsg> & { id: string }): AskStreamMsg {
  return { role: "assistant", content: "", at: 0, ...partial };
}

/* ------------------------- thread reducer ------------------------- */

describe("appendExchange", () => {
  it("appends the user turn and its streaming assistant turn in order", () => {
    const prev = [msg({ id: "old" })];
    const user = msg({ id: "u-1", role: "user", content: "hi" });
    const assistant = msg({ id: "a-1" });
    const next = appendExchange(prev, user, assistant);
    expect(next.map((m) => m.id)).toEqual(["old", "u-1", "a-1"]);
    expect(prev).toHaveLength(1); // immutably
  });
});

describe("patchMessage", () => {
  it("patches only the targeted id", () => {
    const prev = [msg({ id: "a" }), msg({ id: "b" })];
    const next = patchMessage(prev, "b", { content: "streamed" });
    expect(next[0].content).toBe("");
    expect(next[1].content).toBe("streamed");
    expect(prev[1].content).toBe("");
  });

  it("is a no-op when the id is gone (thread reset under an aborted stream)", () => {
    const prev = [msg({ id: "a" })];
    const next = patchMessage(prev, "vanished", { content: "late frame" });
    expect(next).toEqual(prev);
  });
});

describe("removeExchange", () => {
  it("removes the error card and the user turn directly above it", () => {
    const prev = [
      msg({ id: "u-0", role: "user" }),
      msg({ id: "a-0" }),
      msg({ id: "u-1", role: "user" }),
      msg({ id: "a-1", error: true }),
    ];
    const next = removeExchange(prev, "a-1");
    expect(next.map((m) => m.id)).toEqual(["u-0", "a-0"]);
  });

  it("removes only the card when the message above is not a user turn", () => {
    const prev = [msg({ id: "a-0" }), msg({ id: "a-1", error: true })];
    const next = removeExchange(prev, "a-1");
    expect(next.map((m) => m.id)).toEqual(["a-0"]);
  });

  it("works mid-thread, never a blind last-two slice", () => {
    const prev = [
      msg({ id: "u-0", role: "user" }),
      msg({ id: "a-0", error: true }),
      msg({ id: "u-1", role: "user" }),
      msg({ id: "a-1" }),
    ];
    const next = removeExchange(prev, "a-0");
    expect(next.map((m) => m.id)).toEqual(["u-1", "a-1"]);
  });

  it("is a no-op for a missing id", () => {
    const prev = [msg({ id: "a-0" })];
    expect(removeExchange(prev, "nope")).toEqual(prev);
  });
});

describe("prependHydrated", () => {
  const history = [
    { id: UUID_A, role: "user", content: "earlier", at: 1 },
  ] as unknown as HydratedMsg[];

  it("prepends history before a live exchange, never replacing it", () => {
    const live = [msg({ id: "u-9", role: "user" }), msg({ id: "a-9" })];
    const next = prependHydrated(live, history);
    expect(next.map((m) => m.id)).toEqual([UUID_A, "u-9", "a-9"]);
  });

  it("returns the history alone into an empty thread", () => {
    expect(prependHydrated([], history).map((m) => m.id)).toEqual([UUID_A]);
  });
});

describe("seedPromoted", () => {
  it("seeds receipt chips from hydrated rows and keeps existing entries", () => {
    const hydrated = [
      { id: "m1", role: "assistant", content: "", at: 0, promoted: { note: "n1" } },
      { id: "m2", role: "assistant", content: "", at: 0 },
    ] as unknown as HydratedMsg[];
    const next = seedPromoted({ m0: { task: "t0" } }, hydrated);
    expect(next).toEqual({ m0: { task: "t0" }, m1: { note: "n1" } });
  });
});

/* ---------------------- persistence keying ------------------------ */

describe("askScopeKey", () => {
  it("keys by product when one is active", () => {
    expect(askScopeKey("p1", "w1")).toBe("product:p1");
  });
  it("falls back to the workspace", () => {
    expect(askScopeKey(null, "w1")).toBe("workspace:w1");
    expect(askScopeKey(undefined, "w1")).toBe("workspace:w1");
  });
  it("falls back to the global bucket when nothing is resolved", () => {
    expect(askScopeKey(null, null)).toBe("global");
  });
});

describe("parseConversationMap", () => {
  it("reads a valid map", () => {
    const raw = JSON.stringify({ "product:p1": UUID_A, "workspace:w1": UUID_B });
    expect(parseConversationMap(raw)).toEqual({
      "product:p1": UUID_A,
      "workspace:w1": UUID_B,
    });
  });

  it("reads malformed storage as empty", () => {
    expect(parseConversationMap(null)).toEqual({});
    expect(parseConversationMap("not json")).toEqual({});
    expect(parseConversationMap("[1,2]")).toEqual({});
    expect(parseConversationMap('"a string"')).toEqual({});
  });

  it("drops non-uuid values so hydration can never wedge on a bad id", () => {
    const raw = JSON.stringify({ "product:p1": "not-a-uuid", "workspace:w1": UUID_B, x: 7 });
    expect(parseConversationMap(raw)).toEqual({ "workspace:w1": UUID_B });
  });
});

describe("conversationIdForScope", () => {
  const map = { "product:p1": UUID_A };

  it("returns the scope's own conversation first", () => {
    expect(conversationIdForScope(map, "product:p1", UUID_B)).toBe(UUID_A);
  });

  it("honors the legacy v1 id for workspace and global scopes", () => {
    expect(conversationIdForScope({}, "workspace:w1", UUID_B)).toBe(UUID_B);
    expect(conversationIdForScope({}, "global", UUID_B)).toBe(UUID_B);
  });

  it("never hands the legacy conversation to a product scope", () => {
    expect(conversationIdForScope({}, "product:p2", UUID_B)).toBeNull();
  });

  it("ignores an invalid legacy value", () => {
    expect(conversationIdForScope({}, "global", "junk")).toBeNull();
    expect(conversationIdForScope({}, "global", null)).toBeNull();
  });
});

describe("withConversationId", () => {
  it("sets a scope's conversation without mutating the input", () => {
    const map = { "workspace:w1": UUID_B };
    const next = withConversationId(map, "product:p1", UUID_A);
    expect(next).toEqual({ "workspace:w1": UUID_B, "product:p1": UUID_A });
    expect(map).toEqual({ "workspace:w1": UUID_B });
  });

  it("clears a scope's conversation with null", () => {
    const map = { "product:p1": UUID_A, "workspace:w1": UUID_B };
    expect(withConversationId(map, "product:p1", null)).toEqual({ "workspace:w1": UUID_B });
  });
});
