import { describe, it, expect, beforeEach } from "bun:test";
import {
  appendExchange,
  askScopeKey,
  clearSessionConversations,
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

  /**
   * THE DUPLICATION THE FOUNDER REPORTED, 2026-08-11: *"every input gets
   * recorded twice in the conversation pane"*.
   *
   * THE ORDER IS THE TEST. This is a race, so a snapshot of the end state proves
   * nothing about which interleaving produced it. Each case below performs the
   * operations in the order the defect needs, appending BEFORE hydrating, which
   * is the sequence a person creates by pressing Cmd+K and typing immediately
   * while the hydration request is still on the wire.
   */
  describe("the send that lands mid-hydration", () => {
    const SENT_AT = 1_760_000_000_000;
    /** What `appendExchange` puts in the thread on send: a locally minted id,
     *  and an empty assistant turn waiting for stream frames. */
    const optimistic = () => [
      msg({ id: `u-${SENT_AT}`, role: "user", content: "what changed?", at: SENT_AT }),
      msg({ id: `a-${SENT_AT}`, role: "assistant", content: "", at: SENT_AT }),
    ];
    /** What hydration brings back: real history, plus the server's own copy of
     *  the turn that was just written, under a uuid. */
    const served = (over: Partial<{ at: number; content: string }> = {}) =>
      [
        { id: UUID_A, role: "user", content: "earlier", at: SENT_AT - 86_400_000 },
        {
          id: UUID_B,
          role: "user",
          content: over.content ?? "what changed?",
          at: over.at ?? SENT_AT + 400,
        },
      ] as unknown as HydratedMsg[];

    it("shows the message once, not twice", () => {
      const thread = prependHydrated(optimistic(), served());
      const mine = thread.filter((m) => m.role === "user" && m.content === "what changed?");
      expect(mine).toHaveLength(1);
    });

    it("keeps the LOCAL row, because live stream frames patch by that id", () => {
      // Dropping the local row instead would strand the in-flight answer:
      // `patchMessage` writes deltas against `a-<timestamp>`.
      const thread = prependHydrated(optimistic(), served());
      expect(thread.map((m) => m.id)).toEqual([UUID_A, `u-${SENT_AT}`, `a-${SENT_AT}`]);
    });

    it("still restores the older history, which is what hydration is for", () => {
      const thread = prependHydrated(optimistic(), served());
      expect(thread[0].content).toBe("earlier");
    });

    it("holds under a slow round trip, where the server copy lands much later", () => {
      const thread = prependHydrated(optimistic(), served({ at: SENT_AT + 45_000 }));
      expect(thread.filter((m) => m.content === "what changed?")).toHaveLength(1);
    });

    // Clock skew is the reason the window is symmetric: a server clock running
    // behind the client stamps the echo EARLIER than the optimistic row.
    it("holds when the server clock runs behind the client's", () => {
      const thread = prependHydrated(optimistic(), served({ at: SENT_AT - 30_000 }));
      expect(thread.filter((m) => m.content === "what changed?")).toHaveLength(1);
    });
  });

  /**
   * THE OTHER HALF OF THE RULE. De-duplication that swallows a real turn is a
   * worse defect than the one it fixes, on a surface whose whole claim is a
   * faithful record. These pin the cases that must NOT collapse.
   */
  describe("it never swallows a turn that is genuinely its own", () => {
    const NOW = 1_760_000_000_000;

    it("the same question asked again hours later is still two questions", () => {
      const live = [msg({ id: "u-now", role: "user", content: "what changed?", at: NOW })];
      const old = [
        { id: UUID_A, role: "user", content: "what changed?", at: NOW - 7_200_000 },
      ] as unknown as HydratedMsg[];
      expect(prependHydrated(live, old).map((m) => m.id)).toEqual([UUID_A, "u-now"]);
    });

    it("different text at the same instant is left alone", () => {
      const live = [msg({ id: "u-now", role: "user", content: "what changed?", at: NOW })];
      const other = [
        { id: UUID_A, role: "user", content: "what shipped?", at: NOW },
      ] as unknown as HydratedMsg[];
      expect(prependHydrated(live, other)).toHaveLength(2);
    });

    it("the same text from the other speaker is left alone", () => {
      const live = [msg({ id: "a-now", role: "assistant", content: "It merged.", at: NOW })];
      const asUser = [
        { id: UUID_A, role: "user", content: "It merged.", at: NOW },
      ] as unknown as HydratedMsg[];
      expect(prependHydrated(live, asUser)).toHaveLength(2);
    });

    // A multiset, not a set. Somebody who really did send one line twice inside
    // the window has two local rows, and must keep two.
    it("two local copies of one line absorb two server copies, not one", () => {
      const live = [
        msg({ id: "u-1", role: "user", content: "again", at: NOW }),
        msg({ id: "u-2", role: "user", content: "again", at: NOW + 1000 }),
      ];
      const both = [
        { id: UUID_A, role: "user", content: "again", at: NOW + 200 },
        { id: UUID_B, role: "user", content: "again", at: NOW + 1200 },
      ] as unknown as HydratedMsg[];
      expect(prependHydrated(live, both).map((m) => m.id)).toEqual(["u-1", "u-2"]);
    });

    it("one local copy absorbs only one of two server copies", () => {
      const live = [msg({ id: "u-1", role: "user", content: "again", at: NOW })];
      const both = [
        { id: UUID_A, role: "user", content: "again", at: NOW + 200 },
        { id: UUID_B, role: "user", content: "again", at: NOW + 1200 },
      ] as unknown as HydratedMsg[];
      expect(prependHydrated(live, both)).toHaveLength(2);
    });
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

/**
 * NEW PER SESSION, KEPT WITHIN ONE. The durable map above is what handed a
 * fresh login a months-old thread; this store is the other half of the same
 * ruling. There is no test that can reload a page, so what is asserted is the
 * property that makes the reload correct: nothing here reaches storage, so a
 * new JS context starts empty, while every read inside one context agrees.
 */
describe("the session conversation pointer", () => {
  beforeEach(() => clearSessionConversations());

  it("starts empty, which is what a fresh page load sees", () => {
    expect(readSessionConversationId("product:p1")).toBeNull();
  });

  it("keeps the scope's conversation for as long as the page lives", () => {
    writeSessionConversationId("product:p1", UUID_A);
    expect(readSessionConversationId("product:p1")).toBe(UUID_A);
    // Read twice: a pane closes and reopens, and must land back in the same one.
    expect(readSessionConversationId("product:p1")).toBe(UUID_A);
  });

  it("holds one conversation per scope and never leaks across them", () => {
    writeSessionConversationId("product:p1", UUID_A);
    writeSessionConversationId("workspace:w1", UUID_B);
    expect(readSessionConversationId("product:p1")).toBe(UUID_A);
    expect(readSessionConversationId("workspace:w1")).toBe(UUID_B);
  });

  it("clears with null, which is how starting over is stored", () => {
    writeSessionConversationId("product:p1", UUID_A);
    writeSessionConversationId("product:p1", null);
    expect(readSessionConversationId("product:p1")).toBeNull();
  });

  it("never writes to localStorage, or a reload would resurrect the thread", () => {
    window.localStorage.clear();
    writeSessionConversationId("product:p1", UUID_A);
    expect(window.localStorage.length).toBe(0);
  });
});
