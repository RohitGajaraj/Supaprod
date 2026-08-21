import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * NEVER OPEN A SURFACE BY PRETENDING TO BE A KEYBOARD.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-05. Two buttons shipped on Today, both
 * labelled "Ask Supaprod", both opening the Ask pane like this:
 *
 *     window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true }))
 *
 * BOTH WERE DEAD. The binding registered in AskProvider is
 * `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"` — never "j" — so the
 * synthetic events landed on no listener and clicking either button did nothing
 * at all. They shipped in two separate commits whose messages each described the
 * feature as working.
 *
 * NOTHING COULD CATCH IT. A synthetic KeyboardEvent is valid TypeScript, the
 * component renders, and no unit test asserts that a dispatched key matches a
 * registered binding. The two halves — who dispatches and who listens — live in
 * different files and are connected by a string.
 *
 * THE RULE: call the thing the shortcut calls, never the shortcut. For Ask that
 * is `openAsk()` in src/lib/ask-open.ts, which dispatches the `supaprod:open-ask`
 * CustomEvent that AskProvider actually listens for. A button and its keyboard
 * shortcut then cannot disagree, because they end up in the same function.
 *
 * `new KeyboardEvent` in a TEST is fine and expected — a test simulating a user
 * pressing a key is exactly what it should do. This bans it in shipped source.
 */

const SRC = join(import.meta.dir, "..", "..");

/** Every shipped .ts/.tsx under src/, excluding tests and generated files. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      sourceFiles(full, out);
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    // The generated Supabase types are machine output, never hand-written UI.
    if (entry === "types.ts" && full.includes("integrations")) continue;
    out.push(full);
  }
  return out;
}

/**
 * Comments discuss the banned pattern at length — including in this file's own
 * header and in ask-open.ts, which quotes the dead call verbatim so the next
 * reader knows what it looked like. Strip them before scanning, exactly as
 * trigger-dedup-halves.test.ts does.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * Files that dispatch `supaprod:open-ask` directly and may keep doing so.
 *
 * Each is an opener that predates `openAsk()` and passes its own richer detail
 * (a conversation id, a scoped intent). They are listed rather than migrated
 * because the point of this guard is to stop a NEW hand-rolled opener drifting
 * from the contract in ask-context.tsx — not to churn four working surfaces the
 * week of a launch. Adding a fifth should be a deliberate act, so it fails here.
 */
const KNOWN_ASK_OPENERS = [
  join("lib", "ask-open.ts"),
  join("components", "shell", "AppFrame.tsx"),
  join("components", "supaprod", "GotoShortcuts.tsx"),
  join("components", "mission", "composer", "GlobalComposer.tsx"),
  join("components", "mission", "RoomChrome.tsx"),
  join("routes", "_authenticated.m.index.tsx"),
];

describe("no surface opens another surface by synthesising a keypress", () => {
  const files = sourceFiles(SRC);

  it("finds the source tree (guard against an empty scan passing vacuously)", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("constructs no KeyboardEvent in shipped source", () => {
    const offenders: string[] = [];
    for (const file of files) {
      // `(e: KeyboardEvent)` and `React.KeyboardEvent` are TYPE positions on a
      // real handler receiving a real event, which is correct and common. Only
      // CONSTRUCTING one is a simulated keypress.
      if (/new\s+KeyboardEvent\s*\(/.test(stripComments(readFileSync(file, "utf8")))) {
        offenders.push(file.slice(SRC.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("adds no new hand-rolled Ask opener", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = file.slice(SRC.length + 1);
      if (KNOWN_ASK_OPENERS.includes(rel)) continue;
      const src = stripComments(readFileSync(file, "utf8"));
      if (/dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*["']supaprod:open-ask["']/.test(src)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });
});
