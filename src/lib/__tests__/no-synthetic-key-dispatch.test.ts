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

describe("no surface opens another surface by synthesising a keypress", () => {
  const files = sourceFiles(SRC);

  it("finds the source tree (guard against an empty scan passing vacuously)", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it("constructs no KeyboardEvent in shipped source", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // `(e: KeyboardEvent)` and `React.KeyboardEvent` are TYPE positions on a
      // real handler receiving a real event, which is correct and common. Only
      // CONSTRUCTING one is a simulated keypress.
      if (/new\s+KeyboardEvent\s*\(/.test(src)) {
        offenders.push(file.slice(SRC.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("routes every Ask opener through the one exported helper", () => {
    // openAsk and openAskConversation both dispatch `supaprod:open-ask`. Any
    // OTHER file dispatching that event by hand is a second opener that can
    // drift from the contract in ask-context.tsx.
    const offenders: string[] = [];
    for (const file of files) {
      const rel = file.slice(SRC.length + 1);
      if (rel === join("lib", "ask-open.ts")) continue;
      // AppFrame's own Ask button is the shell's, and predates the helper.
      if (rel === join("components", "shell", "AppFrame.tsx")) continue;
      const src = readFileSync(file, "utf8");
      if (/dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*["']supaprod:open-ask["']/.test(src)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });
});
