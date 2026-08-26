import { describe, expect, it } from "bun:test";

import { keyAction, shouldIgnoreKey } from "./run-keys";

describe("shouldIgnoreKey", () => {
  const bare = (target: unknown) => ({ target, metaKey: false, ctrlKey: false, altKey: false });

  it("never fires while a person is typing", () => {
    expect(shouldIgnoreKey(bare({ tagName: "TEXTAREA" }))).toBe(true);
    expect(shouldIgnoreKey(bare({ tagName: "input" }))).toBe(true);
    expect(shouldIgnoreKey(bare({ tagName: "select" }))).toBe(true);
    expect(shouldIgnoreKey(bare({ isContentEditable: true, tagName: "DIV" }))).toBe(true);
  });

  it("never steals a chord", () => {
    expect(shouldIgnoreKey({ target: { tagName: "BODY" }, metaKey: true })).toBe(true);
    expect(shouldIgnoreKey({ target: { tagName: "BODY" }, ctrlKey: true })).toBe(true);
    expect(shouldIgnoreKey({ target: { tagName: "BODY" }, altKey: true })).toBe(true);
  });

  it("a bare key on the page itself means the shortcut", () => {
    expect(shouldIgnoreKey(bare({ tagName: "BODY" }))).toBe(false);
    expect(shouldIgnoreKey(bare({ tagName: "BUTTON" }))).toBe(false);
  });
});

describe("keyAction", () => {
  it("slash jumps to the steer box; r runs", () => {
    expect(keyAction("/")).toBe("steer");
    expect(keyAction("r")).toBe("run");
  });

  it("every other key means nothing", () => {
    expect(keyAction("R")).toBeNull();
    expect(keyAction("Enter")).toBeNull();
    expect(keyAction("")).toBeNull();
  });
});
