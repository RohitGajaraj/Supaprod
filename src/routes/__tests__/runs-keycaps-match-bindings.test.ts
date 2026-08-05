import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE KEYCAP AND THE KEY ARE ONE FACT, AND ON /runs THEY HAD COME APART BOTH WAYS.
 *
 * TWO DEFECTS, found 2026-08-06, opposite halves of the same failure.
 *
 * 1. A BINDING DRAWN NOWHERE. The single run surface bound Cmd/Ctrl+Enter on
 *    the steer textarea and drew no keycap anywhere. Sending a note is the most
 *    repeated act on that page, once per course correction, so the cost was
 *    paid on every correction by every person who never found the chord.
 *
 * 2. A KEYCAP THE KEY COULD NOT REACH. The runs board bound the chord on the
 *    TEXTAREA and drew the keycap on the Start button seventy lines below. On
 *    the "From a spec" door `canStart` accepts a picked spec with an empty
 *    prompt, so the common path leaves focus on the Select, the textarea never
 *    sees the keydown, and the button promises a chord that cannot fire. It was
 *    drawn on the DISABLED button too, promising a key that does nothing at all.
 *
 * WHY A TEST AND NOT A REVIEW NOTE. Both halves are absences, and an absence is
 * invisible in a diff. A handler with no keycap compiles, renders, and passes
 * every other test in this suite. A keycap with no reachable handler does too:
 * the <kbd> is a string, the button works on click, and the only way to see the
 * lie is to put focus somewhere the reviewer did not think to put it. Nothing
 * on the page throws, so nothing tells you.
 *
 * WHAT IT PINS:
 *
 *   1. BOTH SURFACES DRAW THE CHORD THEY BIND, in the one glyph the rest of the
 *      product uses. The spec surface draws ⌘S on Save; a third spelling of the
 *      command key would read as a third product.
 *   2. THE KEYCAP IS CONDITIONAL ON EXACTLY THE EXPRESSION THE CHORD TESTS.
 *      Not merely conditional: the same identifier. Two conditions that agree
 *      today drift apart silently, and the drift shows up as a keycap on a dead
 *      button, which is the bug we just paid for.
 *   3. THE BINDING IS HOISTED OFF THE TEXTAREA. A promise drawn on a button has
 *      to hold wherever the button holds, so the listener sits on the element
 *      that wraps the whole composer. A returned onKeyDown on the Textarea is
 *      the old shape and fails here.
 *   4. THE BUTTON AND THE CHORD DO THE SAME THING. A keycap wired to a second,
 *      subtly different action is the same lie with more steps.
 *
 * Scoped to the two /runs files on purpose. Other lanes are editing the spec
 * surface and /today in this tree, and a guard that fails because a file it
 * does not own moved is a guard people learn to ignore.
 *
 * Modelled on approvals-keys-stand-down.test.ts: read the source as TEXT and
 * blank the comments first, because both fixed files describe the banned shape
 * in prose in order to ban it.
 */

const BOARD = join(import.meta.dir, "..", "_authenticated.runs.index.tsx");
const RUN = join(import.meta.dir, "..", "_authenticated.runs.$missionId.tsx");

/** The one command-key glyph in the product. The spec surface spells Save's as
 *  "⌘S" and the board already spelled Start's this way, so this is the string
 *  being held still, not a new one. */
const GLYPH = "⌘⏎";

/** Blank the comments while keeping every newline, so a failure still points at
 *  the line it means. Block comments become spaces rather than nothing so that
 *  a JSX `{/* ... *\/}` keeps its braces balanced for the counters below. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

/** The body of `const <name> = (...) => { ... }`, found by counting braces
 *  rather than by regex, so a nested block inside it cannot end the match. */
function handlerBody(source: string, name: string): string {
  const start = source.indexOf(`const ${name} = (`);
  if (start === -1) throw new Error(`${name} is not declared any more`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`${name} has no closing brace`);
}

/** Every opening tag for `<Tag`, as text. Braces are counted so a `>` living
 *  inside an attribute expression, which is every arrow function, does not end
 *  the tag early. */
function openingTags(source: string, tag: string): string[] {
  const found: string[] = [];
  for (let i = source.indexOf(`<${tag}`); i !== -1; i = source.indexOf(`<${tag}`, i + 1)) {
    let depth = 0;
    for (let j = i; j < source.length; j += 1) {
      const c = source[j];
      if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) {
        found.push(source.slice(i, j + 1));
        break;
      }
    }
  }
  return found;
}

/** The identifier the keycap is drawn on, from `shortcut={X ? "⌘⏎" : undefined}`. */
function keycapCondition(tag: string): string | null {
  const m = tag.match(/shortcut=\{\s*(\w+)\s*\?\s*"⌘⏎"\s*:\s*undefined\s*\}/);
  return m ? m[1] : null;
}

const BOARD_SRC = stripComments(readFileSync(BOARD, "utf8"));
const RUN_SRC = stripComments(readFileSync(RUN, "utf8"));

const SURFACES = [
  {
    what: "the runs board composer",
    src: BOARD_SRC,
    handler: "onComposerChord",
    /** What the chord and the click must both reach. */
    action: "run",
    /** Proof the file still holds the surface this is about. */
    anchor: "Hand it over",
  },
  {
    what: "the single run's note box",
    src: RUN_SRC,
    handler: "onNoteChord",
    action: "steer.mutate",
    anchor: "Send the note",
  },
];

describe("/runs draws every Cmd chord it binds, on the button that fires it", () => {
  for (const s of SURFACES) {
    describe(s.what, () => {
      it("is still the surface this guard is about (a vacuous pass is not a pass)", () => {
        expect(s.src).toContain(s.anchor);
        expect(openingTags(s.src, "Button").length).toBeGreaterThan(0);
      });

      it("draws the chord somewhere, in the house glyph", () => {
        expect(s.src).toContain(GLYPH);
      });

      it("draws it on exactly one button, and never on a dead one", () => {
        const carrying = openingTags(s.src, "Button").filter((t) => t.includes(GLYPH));
        expect(carrying.length).toBe(1);
        // Unconditional is the shape that promised a key on a disabled button.
        expect(carrying[0]).not.toContain(`shortcut="${GLYPH}"`);
        expect(keycapCondition(carrying[0])).not.toBeNull();
      });

      it("draws it on the same expression the chord tests, not a second one that agrees today", () => {
        const carrying = openingTags(s.src, "Button").find((t) => t.includes(GLYPH)) as string;
        const cond = keycapCondition(carrying) as string;
        const body = handlerBody(s.src, s.handler);
        expect(body).toContain(`if (!${cond}) return;`);
        // The same condition disables the button, so click and chord agree too.
        expect(carrying).toContain(`disabled={!${cond}}`);
      });

      it("requires the modifier and Enter before it does anything", () => {
        const body = handlerBody(s.src, s.handler);
        const statements = body
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        expect(statements[0]).toBe('if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;');
      });

      it("fires the same action the button fires", () => {
        const body = handlerBody(s.src, s.handler);
        const carrying = openingTags(s.src, "Button").find((t) => t.includes(GLYPH)) as string;
        expect(body).toContain(`${s.action}(`);
        expect(carrying).toContain(s.action);
      });

      it("hangs the listener on the composer, not on the textarea", () => {
        expect(s.src).toContain(`onKeyDown={${s.handler}}`);
        for (const tag of openingTags(s.src, "Textarea")) {
          expect(tag).not.toContain("onKeyDown");
        }
      });
    });
  }
});
