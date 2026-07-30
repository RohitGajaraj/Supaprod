import { describe, expect, it } from "bun:test";
import { contentForIntent, defaultIntent, HANDOVER_MENTION } from "./ask-intent";

describe("ask-intent: the fork the old box hid", () => {
  it("reads a question as a question", () => {
    expect(defaultIntent("what happened to run 41")).toBe("question");
    expect(defaultIntent("why did we decide that")).toBe("question");
    expect(defaultIntent("show me the spec")).toBe("question");
  });

  it("reads work as work", () => {
    expect(defaultIntent("fix the checkout redirect")).toBe("instruction");
    expect(defaultIntent("draft the release note")).toBe("instruction");
    expect(defaultIntent("migrate the settings table")).toBe("instruction");
  });

  // The clearest signal a person gives, and it wins over everything: a question
  // phrased as an imperative must never silently start a run.
  it("a question mark outranks an imperative verb", () => {
    expect(defaultIntent("run me through the checkout change?")).toBe("question");
  });

  it("an explicit mention is already a command", () => {
    expect(defaultIntent("@engineer rename the caller")).toBe("instruction");
  });

  it("an empty draft is a question, because nothing should default to spending", () => {
    expect(defaultIntent("")).toBe("question");
    expect(defaultIntent("   ")).toBe("question");
  });

  it("falls back to a question when it cannot tell, for the same reason", () => {
    expect(defaultIntent("checkout redirect")).toBe("question");
  });
});

describe("ask-intent: what goes on the wire", () => {
  it("a question travels verbatim", () => {
    expect(contentForIntent("  what happened  ", "question")).toBe("what happened");
  });

  // The dispatch lever, and it is an existing documented server behaviour:
  // api/chat.ts treats a leading @slug as an unambiguous command and skips its
  // classifier. Nothing about the SSE contract changes.
  it("handing work over addresses the conductor, visibly", () => {
    expect(contentForIntent("fix the redirect", "instruction")).toBe(
      `${HANDOVER_MENTION} fix the redirect`,
    );
  });

  it("never double-prefixes a draft that already names an agent", () => {
    expect(contentForIntent("@engineer fix it", "instruction")).toBe("@engineer fix it");
  });
});
