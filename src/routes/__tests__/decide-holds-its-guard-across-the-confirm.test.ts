import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A CONFIRM DIALOG MAY NOT LEAVE THE KEYS BEHIND IT LIVE.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. /decide binds bare k, c and
 * x on a window keydown listener, and the effect that binds them stands them
 * down while a record is open by returning early on `openId`. The delete
 * handler in the record cleared `openId` and only THEN awaited the confirm, so
 * for the entire life of "Delete this bet?" all three keys were armed again,
 * addressed to `activeOpp`, the bet under the Gate, rather than to the bet the
 * dialog names.
 *
 * "x" carried the cost. It is the obvious way to wave a dialog away, it was
 * still DRAWN on the keycaps behind the scrim, so it read as the offered exit,
 * and pressing it dropped a different bet than the one the question was about.
 * The receipt then named a bet the person had never touched, and the delete
 * they actually came for went through as well the moment they answered.
 *
 * WHY A TEST AND NOT A REVIEW NOTE. The bug is an ORDER, and both statements
 * are correct on their own. `setOpenId(null)` before `await askDelete(...)`
 * typechecks, renders, throws nothing, and reads in the order anyone would
 * write it; the only thing separating the two lines is an await, which occupies
 * no line in a diff. Nor could any existing test see it: it needs a modal owned
 * by ConfirmProvider and a window keydown owned by this route to be live in the
 * same instant, and nothing in the suite had ever put both on screen at once.
 * The same shape is one edit away from coming back, because closing the sheet
 * first is what every other dismissal on this surface does.
 *
 * WHAT IT PINS:
 *
 *   1. THE KEYS ARE STILL BOUND, and the effect still treats an open record as
 *      an overlay that owns the keyboard. Without both of those the ordering
 *      assertion below guards nothing and passes vacuously.
 *   2. THE GUARD OUTLIVES THE QUESTION. `setOpenId(null)` may not run until the
 *      confirm has resolved, which in source terms means it comes after the
 *      await or after `.then(`, never before the call.
 *   3. THE HOUSE GUARDS COME FIRST. The modifier return and the typing return
 *      are the same two lines that run on /today and /approvals, and both sit
 *      ahead of the first `e.key` read. A guard that runs after the dispatch
 *      guards nothing.
 *   4. THE RATCHET (docs/conventions/surface-discipline.md): k, c and x are all
 *      still bound. The answer to a key firing at the wrong moment is never to
 *      stop binding the key.
 *
 * Scoped to this one route on purpose, in the style of
 * approvals-keys-stand-down.test.ts: other lanes are editing sibling surfaces
 * in this tree, and a test that fails because a file it does not own moved
 * teaches people to ignore it.
 *
 * Modelled on today-states-its-wait.test.ts: read the source as TEXT and strip
 * comments first, because the fixed file describes the banned ordering in prose
 * in order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.decide.tsx");

/** Blank the comments while keeping every newline, so a failure still points at
 *  the line it means. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

/** Everything between the brace at `open` and its partner, found by counting
 *  rather than by regex, so a nested block cannot end the match early. */
function braced(source: string, open: number, what: string): string {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`${what} has no closing brace`);
}

/** The body of the effect that binds the gate keys, reached from the listener
 *  it registers rather than from its position in the file. */
function gateKeyEffect(source: string): string {
  const anchor = source.indexOf('window.addEventListener("keydown", onKey)');
  if (anchor === -1) throw new Error("the gate keys are no longer bound on a window keydown");
  const start = source.lastIndexOf("React.useEffect(() => {", anchor);
  if (start === -1) throw new Error("the keydown listener is not inside a React.useEffect");
  return braced(source, source.indexOf("{", start), "the gate-key effect");
}

/** The keydown handler itself. */
function keyHandler(source: string): string {
  const start = source.indexOf("const onKey = (e: KeyboardEvent) => {");
  if (start === -1) throw new Error("the keydown handler is not named onKey any more");
  return braced(source, source.indexOf("{", start), "the keydown handler");
}

/** The delete handler passed to the record sheet, including its arrow wrapper. */
function deleteHandler(source: string): string {
  const start = source.indexOf("onDelete={");
  if (start === -1) throw new Error("the record sheet no longer takes an onDelete");
  return braced(source, source.indexOf("{", start), "the onDelete handler");
}

const SOURCE = stripComments(readFileSync(ROUTE, "utf8"));
const EFFECT = gateKeyEffect(SOURCE);
const HANDLER = keyHandler(SOURCE);
const DELETE = deleteHandler(SOURCE);

const MODIFIER_GUARD = "if (e.metaKey || e.ctrlKey || e.altKey) return;";
const TYPING_GUARD =
  "if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;";

describe("/decide holds its gate-key guard across the delete confirm", () => {
  it("still binds every key it draws: k, c and x", () => {
    expect(SOURCE).toContain('window.addEventListener("keydown", onKey)');
    for (const key of ["k", "c", "x"]) {
      expect(HANDLER).toContain(`e.key === "${key}"`);
    }
  });

  it("treats an open record as an overlay that owns the keyboard", () => {
    // Without this early return the ordering assertion below is vacuous: there
    // would be no guard left for the confirm to drop.
    const guard = EFFECT.slice(0, EFFECT.indexOf("const onKey"));
    expect(/if \([^)]*openId[^)]*\) return;/.test(guard)).toBe(true);
  });

  it("does not let go of that guard until the confirm has been answered", () => {
    const ask = DELETE.indexOf("askDelete(");
    const close = DELETE.indexOf("setOpenId(null)");
    const resolved = DELETE.search(/\.then\(|await\s+askDelete\(/);

    expect(ask).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(-1);
    // THE DEFECT, stated as an index: the close used to come first.
    expect(close).toBeGreaterThan(ask);
    // And it is not merely later in the text, it is on the far side of the
    // await. Two statements in sequence would put `close` after `ask` and still
    // run before the person has answered anything.
    expect(resolved).toBeGreaterThan(-1);
    expect(close).toBeGreaterThan(resolved);
  });

  it("keeps the modifier and typing guards ahead of every key it reads", () => {
    const statements = HANDLER.split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(statements[0]).toBe(MODIFIER_GUARD);
    expect(HANDLER).toContain(TYPING_GUARD);
    expect(HANDLER.indexOf(MODIFIER_GUARD)).toBeLessThan(HANDLER.indexOf("e.key"));
    expect(HANDLER.indexOf(TYPING_GUARD)).toBeLessThan(HANDLER.indexOf("e.key"));
  });
});
