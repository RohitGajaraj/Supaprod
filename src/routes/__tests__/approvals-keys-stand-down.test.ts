import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * AN IRREVERSIBLE VERDICT MAY NOT RIDE IN ON SOMEBODY ELSE'S CHORD.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. /inbox binds bare a, r,
 * j and k on a window keydown listener, and it was the one gate surface with no
 * modifier guard. `e.key` on a Cmd+R keydown is exactly "r", because the
 * modifier lives on a separate field the handler never read, so Cmd+R and
 * Ctrl+R — reload, pressed constantly — DECLINED the approval in focus on the
 * way out of the page. Cmd+A approved it. Cmd+K opened Ask and moved the queue
 * focus underneath the overlay at the same time. decideApprovalItem writes to
 * the trust ledger and there is no undo, so the price of a reflexive reload was
 * a settled call the user never made, attributed to them permanently.
 *
 * WHY A TEST AND NOT A REVIEW NOTE. The bug is an ABSENCE. Reading `e.key`
 * without reading `e.metaKey` is valid TypeScript, it renders, it throws
 * nothing, and it passes every other test in this suite. Nothing in a one-file
 * diff shows you the line that is not there. /today and /decide had carried the
 * guard for weeks and only a reader who opened all three at once could see that
 * the third did not — which is nobody, on the day the queue is long.
 *
 * WHAT IT PINS, in the order the handler must do it:
 *
 *   1. THE MODIFIER RETURN IS THE FIRST STATEMENT. Not merely present: first.
 *      A guard that runs after the key dispatch guards nothing, and that is the
 *      easy way to reintroduce this while the diff still shows the words
 *      "metaKey" and "return".
 *   2. IT IS THE HOUSE LINE, CHARACTER FOR CHARACTER. The same two lines run on
 *      /today and /decide. Three gate surfaces that each phrase their own guard
 *      will drift, and the drift will be one field wide and silent.
 *   3. SELECT IS IN THE TYPING GUARD. A native <select> holds focus while it is
 *      open and jumps to the option whose label starts with the letter pressed,
 *      so "r" inside one was a selection and a rejection at once.
 *   4. ALL FOUR KEYS ARE STILL BOUND. The ratchet
 *      (docs/conventions/surface-discipline.md): the answer to a key firing
 *      when it should not is never to stop binding the key.
 *
 * Scoped to this one route on purpose. Other lanes are editing /today and
 * /decide in this tree, and a test that fails because a file it does not own
 * moved teaches people to ignore it. Generalising it to all three gate surfaces
 * is worth doing once those settle.
 *
 * Modelled on today-states-its-wait.test.ts: read the source as TEXT and strip
 * comments first, because the fixed file describes the banned shape in prose in
 * order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.inbox.tsx");

/** Blank the comments while keeping every newline, so a failure still points at
 *  the line it means. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

/** The body of `function onKey(e: KeyboardEvent) { ... }`, found by counting
 *  braces rather than by regex, so a nested block inside it cannot end the
 *  match early. */
function keyHandlerBody(source: string): string {
  const start = source.indexOf("function onKey(e: KeyboardEvent) {");
  if (start === -1) throw new Error("the keydown handler is not named onKey any more");
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error("the keydown handler has no closing brace");
}

const SOURCE = stripComments(readFileSync(ROUTE, "utf8"));
const BODY = keyHandlerBody(SOURCE);
const STATEMENTS = BODY.split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const MODIFIER_GUARD = "if (e.metaKey || e.ctrlKey || e.altKey) return;";
const TYPING_GUARD =
  "if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;";

describe("/inbox stands its bare keys down under a modifier", () => {
  it("still registers the handler it is guarding (a vacuous pass is not a pass)", () => {
    expect(SOURCE).toContain('window.addEventListener("keydown", onKey)');
    expect(STATEMENTS.length).toBeGreaterThan(5);
  });

  it("returns on any modifier before it looks at a single key", () => {
    expect(STATEMENTS[0]).toBe(MODIFIER_GUARD);
    expect(BODY.indexOf(MODIFIER_GUARD)).toBeLessThan(BODY.indexOf("e.key"));
  });

  it("stands down inside a select, as well as an input, a textarea and a contenteditable", () => {
    expect(BODY).toContain(TYPING_GUARD);
    expect(BODY.indexOf(TYPING_GUARD)).toBeLessThan(BODY.indexOf("e.key"));
  });

  it("keeps every key it draws bound: j, k, a, d and z", () => {
    // `r` became `d`: one alphabet across every gate, so decline is the same
    // letter here as on Today, where this surface's own copy sends people from.
    // `j`/`k` still MOVE, and no key that moves anywhere commits anywhere else.
    // `z` joined 2026-08-24: the snooze verb, the same letter Today's gate
    // binds to the same resolver.
    for (const key of ["j", "k", "a", "d", "z"]) {
      expect(BODY).toContain(`e.key === "${key}"`);
    }
  });
});
