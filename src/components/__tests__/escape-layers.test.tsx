import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, expect, afterEach } from "bun:test";

/**
 * ONE ESCAPE, ONE LAYER.
 *
 * THE DEFECT THIS GUARDS. In an engine room with Ask open and a lineage trail
 * traced, a single Escape ran three handlers in one dispatch: the lineage pane
 * closed the trail, AskPane closed the pane, and the room navigated back out of
 * the room. The person meant to close one thing and lost three, including their
 * place in the room.
 *
 * It cost more than a keystroke because Ask's own footer INSTRUCTS the press:
 * while an answer streams it prints "Escape leaves it running.", which is
 * exactly the moment the composer is disabled and focus has fallen to <body>,
 * so the room's "is focus in a field" guard has nothing to hold it back. We were
 * telling people to press the key that lost their place.
 *
 * NOTHING COULD CATCH IT. Each handler is correct read on its own; the bug is
 * entirely in the relationship between them, and they live in three files that
 * never import each other.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE NO LONGER MOUNTS THE REAL COMPONENTS, and it is not a retreat
 * from rigour. The first version rendered AskPane, the lineage sheet and the
 * engine room together, which needed EIGHTEEN `mock.module` calls.
 *
 * `mock.module` is not scoped to the file that calls it. It swaps a
 * process-wide registry, and the swap is only observed when a consumer is FIRST
 * imported. Seven of the eight modules AskPane's own suite mocks were also
 * mocked here with different bodies, so whichever file loaded AskPane first
 * decided what AskPane saw for the whole run. `bun test src/components/ask`
 * passed; the full suite failed, with a DIFFERENT switcher test failing on each
 * run, from a file that does not import the file that failed.
 *
 * A test that only fails in company is a test nobody can debug from its own
 * output, and a flaky suite is worse than a smaller one: it makes every real
 * regression indistinguishable from noise, which costs far more than the
 * coverage it buys.
 *
 * SO THE GUARANTEE IS KEPT AND THE FLAKE IS DROPPED, in two halves that between
 * them cover the same ground:
 *
 *   1. THE LADDER, proved against the real DOM with listeners registered in
 *      exactly the phases the three files use. The bug was never inside a
 *      component; it was in which phase each handler chose. That is what is
 *      tested here, and it needs no component in order to be true.
 *
 *   2. THE CONTRACTS, read out of the three source files: the phase each binds
 *      in, the guards it carries, whether it stops propagation. If a future edit
 *      moves a handler to the wrong phase or drops a guard, half 2 fails while
 *      half 1 still passes -- half 1 tests the rule, half 2 tests that the files
 *      still obey it, and they fail independently, which is why both exist.
 *
 * Same shape as chord-owns-its-second-key.test.ts, which caught a real defect
 * the day it was written.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const SHEET = strip(read(join("components", "supaprod", "AuditLineageSheet.tsx")));
const ASK = strip(read(join("components", "ask", "AskPane.tsx")));
/* P-79 (A-QUEUE.md): the room's own content, and its Escape handler with it,
 * moved from the now-redirect-only `_authenticated.engine-room.tsx` into
 * `EngineRoomEmbedded.tsx`, mounted under Team's own URL. */
const ROOM = strip(read(join("components", "engine-room", "EngineRoomEmbedded.tsx")));

/* ------------------------------------------------------------- half one *
 * The ladder itself. Listeners in the four positions the shell really uses, one
 * press, and the assertion is that exactly one rung fires.
 *
 * THE PRESS IS DISPATCHED ON document.body, NEVER ON window, and that is not a
 * detail. A real keypress targets the focused element and travels through
 * document on its way up; an event dispatched AT `window` has a propagation
 * path of exactly one node and reaches no document listener at all. Dispatching
 * on window would be testing a press no user can perform -- and it is the exact
 * mistake that made an earlier run of this investigation report a working fix
 * as broken. */

type Rung = { name: string; target: Window | Document; capture: boolean };

/** The four rungs, outermost first. This is the order the browser runs them in
 *  for an event targeted at document.body: window capture, document capture,
 *  document bubble, window bubble. */
const LADDER: Rung[] = [
  { name: "lineage sheet", target: window, capture: true },
  { name: "a popover inside Ask", target: document, capture: true },
  { name: "Ask", target: document, capture: false },
  { name: "the room", target: window, capture: false },
];

const teardown: Array<() => void> = [];
afterEach(() => {
  while (teardown.length) teardown.pop()!();
});

/** Register a rung that CLAIMS the key -- preventDefault and stopPropagation,
 *  exactly as each real handler does -- so nothing below it hears the press. */
function open(rung: Rung, fired: string[]) {
  const onKey = (e: Event) => {
    if ((e as KeyboardEvent).key !== "Escape") return;
    if (e.defaultPrevented) return;
    fired.push(rung.name);
    e.preventDefault();
    e.stopPropagation();
  };
  rung.target.addEventListener("keydown", onKey, rung.capture);
  teardown.push(() => rung.target.removeEventListener("keydown", onKey, rung.capture));
}

function pressEscape() {
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
}

describe("Escape closes the innermost open thing, and nothing else", () => {
  test("with every layer open, one press closes exactly one", () => {
    const fired: string[] = [];
    for (const rung of LADDER) open(rung, fired);
    pressEscape();
    expect(fired).toEqual(["lineage sheet"]);
  });

  test("four layers, four presses, one each and in order", () => {
    const fired: string[] = [];
    for (let i = 0; i < LADDER.length; i++) {
      // Everything from rung i down is still open; the ones above have closed.
      while (teardown.length) teardown.pop()!();
      for (const rung of LADDER.slice(i)) open(rung, fired);
      pressEscape();
    }
    expect(fired).toEqual(LADDER.map((r) => r.name));
  });

  test("the trail closes without taking Ask with it", () => {
    const fired: string[] = [];
    open(LADDER[0], fired);
    open(LADDER[2], fired);
    pressEscape();
    expect(fired).toEqual(["lineage sheet"]);
  });

  test("Ask closes without taking the room with it", () => {
    const fired: string[] = [];
    open(LADDER[2], fired);
    open(LADDER[3], fired);
    pressEscape();
    expect(fired).toEqual(["Ask"]);
  });

  test("a popover inside Ask keeps the key, and the pane stays open", () => {
    const fired: string[] = [];
    open(LADDER[1], fired);
    open(LADDER[2], fired);
    pressEscape();
    expect(fired).toEqual(["a popover inside Ask"]);
  });

  test("a press already claimed is not claimed twice", () => {
    // `defaultPrevented` is the belt to stopPropagation's braces: a rung in the
    // SAME phase as the claimer never hears stopPropagation, so without this
    // check it would fire as well.
    const fired: string[] = [];
    const first = (e: Event) => {
      if ((e as KeyboardEvent).key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", first, true);
    teardown.push(() => window.removeEventListener("keydown", first, true));
    open(LADDER[0], fired);
    pressEscape();
    expect(fired).toEqual([]);
  });
});

/* ------------------------------------------------------------- half two *
 * The three real files still sit on the rungs they claim. */

describe("the three real handlers still sit on the rungs they claim", () => {
  test("the lineage sheet binds on window capture and claims the key", () => {
    expect(SHEET).toMatch(/window\.addEventListener\("keydown", onKey, true\)/);
    expect(SHEET).toMatch(/window\.removeEventListener\("keydown", onKey, true\)/);
    expect(SHEET).toContain("e.stopPropagation()");
  });

  test("the lineage sheet yields to a claimed press and to an open modal", () => {
    // Without the first, the shortcut sheet's Escape closed the sheet AND wiped
    // the trail underneath it. Without the second, a window CAPTURE listener
    // always outranks Radix, whose dismissable layer listens on document, so
    // Escape cleared the trail while the dialog stayed on screen.
    expect(SHEET).toMatch(/e\.key !== "Escape" \|\| e\.defaultPrevented/);
    expect(SHEET).toContain("document.querySelector(OPEN_MODAL_SELECTOR)");
  });

  test("Ask binds on document, below the two capture rungs", () => {
    expect(ASK).toMatch(/document\.addEventListener\("keydown", onKey\)/);
    expect(ASK).not.toMatch(/document\.addEventListener\("keydown", onKey, true\)/);
  });

  test("Ask yields to a claimed press and to anything modal above it", () => {
    // Ask is not the innermost layer. Its stopPropagation was unconditional,
    // which silenced BoardPanel: a window BUBBLE listener runs after Ask's
    // document handler, so it never heard the key. One press closed Ask while
    // the board the person was reading stayed open.
    expect(ASK).toMatch(/e\.key !== "Escape" \|\| e\.defaultPrevented/);
    expect(ASK).toContain("document.querySelector(OPEN_MODAL_SELECTOR)");
  });

  test("the room is the bottom rung and stays there", () => {
    // If the room moved to capture it would outrank every layer above it and
    // Escape would leave the room first, which is the original defect exactly.
    expect(ROOM).toMatch(/addEventListener\("keydown"/);
    expect(ROOM).not.toMatch(/window\.addEventListener\("keydown",\s*\w+,\s*true\)/);
  });

  test("no rung is silently dropped: all three still handle Escape", () => {
    for (const [name, src] of [
      ["lineage sheet", SHEET],
      ["Ask", ASK],
      ["the room", ROOM],
    ] as const) {
      expect({ name, handles: /"Escape"/.test(src) }).toEqual({ name, handles: true });
    }
  });
});
