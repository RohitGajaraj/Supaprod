import { describe, expect, test } from "bun:test";
import { NOTEPAD_CHANGE_EVENT, notepadKey, readNotepad, writeNotepad } from "./notepad";

function memStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe("notepadKey", () => {
  test("scopes by workspace id, falls back to a stable default", () => {
    expect(notepadKey("ws-1")).toBe("supaprod.notepad.ws-1");
    expect(notepadKey(null)).toBe("supaprod.notepad.default");
  });
});

describe("readNotepad / writeNotepad", () => {
  test("round-trips text for a workspace", () => {
    const s = memStorage();
    writeNotepad(s, "ws-1", "call Priya about the escalation SLA");
    const entry = readNotepad(s, "ws-1");
    expect(entry.text).toBe("call Priya about the escalation SLA");
    expect(entry.updatedAt).toBeGreaterThan(0);
  });

  test("workspaces never bleed into each other", () => {
    const s = memStorage();
    writeNotepad(s, "ws-1", "note for workspace one");
    writeNotepad(s, "ws-2", "note for workspace two");
    expect(readNotepad(s, "ws-1").text).toBe("note for workspace one");
    expect(readNotepad(s, "ws-2").text).toBe("note for workspace two");
  });

  test("empty/whitespace text clears the entry instead of storing blank", () => {
    const s = memStorage();
    writeNotepad(s, "ws-1", "something");
    writeNotepad(s, "ws-1", "   ");
    expect(readNotepad(s, "ws-1").text).toBe("");
  });

  test("null storage and malformed JSON degrade to empty, never throw", () => {
    expect(readNotepad(null, "ws-1")).toEqual({ text: "", updatedAt: 0 });
    const s = memStorage();
    s.setItem("supaprod.notepad.ws-1", "not json");
    expect(readNotepad(s, "ws-1")).toEqual({ text: "", updatedAt: 0 });
  });
});

describe("NOTEPAD_CHANGE_EVENT", () => {
  // This test runtime has no ambient `window` (verified: typeof window is
  // "undefined" here even with the DOM preload), so writeNotepad's dispatch
  // guard would silently no-op without one. Stub the minimal EventTarget
  // surface it needs (addEventListener/removeEventListener/dispatchEvent)
  // for the lifetime of each test, restoring the prior value after.
  function withWindowStub<T>(run: () => T): T {
    const prev = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = new EventTarget();
    try {
      return run();
    } finally {
      (globalThis as { window?: unknown }).window = prev;
    }
  }

  // Regression test for a live-verification finding: a note typed in the
  // dock's Note tab silently never appeared in the Desk's NotepadCard (a
  // sibling mounted component reading the same key) until a page reload.
  // Every write must announce itself so any mounted consumer can re-read.
  test("a write dispatches the change event so a sibling consumer can re-sync", () => {
    withWindowStub(() => {
      const s = memStorage();
      let fired = 0;
      let lastDetail: unknown = null;
      const onChange = (e: Event) => {
        fired += 1;
        lastDetail = (e as CustomEvent).detail;
      };
      window.addEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      writeNotepad(s, "ws-1", "call Priya re escalation SLA");
      window.removeEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      expect(fired).toBe(1);
      expect(lastDetail).toEqual({ workspaceId: "ws-1" });
    });
  });

  test("clearing (empty text) also dispatches the change event", () => {
    withWindowStub(() => {
      const s = memStorage();
      writeNotepad(s, "ws-1", "something");
      let fired = 0;
      const onChange = () => {
        fired += 1;
      };
      window.addEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      writeNotepad(s, "ws-1", "");
      window.removeEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      expect(fired).toBe(1);
      expect(readNotepad(s, "ws-1").text).toBe("");
    });
  });

  test("a denied/throwing storage never dispatches (nothing actually changed)", () => {
    withWindowStub(() => {
      const throwing: Pick<Storage, "setItem" | "removeItem"> = {
        setItem: () => {
          throw new Error("denied");
        },
        removeItem: () => {
          throw new Error("denied");
        },
      };
      let fired = 0;
      const onChange = () => {
        fired += 1;
      };
      window.addEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      writeNotepad(throwing, "ws-1", "text");
      window.removeEventListener(NOTEPAD_CHANGE_EVENT, onChange);
      expect(fired).toBe(0);
    });
  });
});
