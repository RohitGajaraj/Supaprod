/**
 * THE SEARCH WORKED AND THE SURFACE COULD NOT BE READ.
 *
 * ── WALKED ON `supaprod.ai`, 2026-09-03, SEARCHING *address* ──────────────
 * The results panel was `absolute left-0 right-0`, so it took the rail's 204px
 * and every result truncated at three or four words:
 *
 *   Let returning custom…      Running
 *   Homeowners aband…          Abandoned
 *   The saved address …        Running
 *   Checkout asks a ho…        Running
 *   Homeowners aband…          (cut in half by the panel's max-height)
 *
 * Two of those rows are the same four words. The search had found the right
 * things; the surface could not show which was which, and the row a person
 * wanted was the one the ellipsis ate. A search whose results cannot be told
 * apart has not answered the question.
 *
 * ── TWO CAUSES, AND FIXING EITHER ALONE FIXES NOTHING ─────────────────────
 * The panel was as wide as its field, AND `Row` was called with `tight`, which
 * applies `truncate`. A wider panel with `tight` still cuts every title at one
 * line, just further along; a wrapping title in a 204px panel is five lines of
 * three words. Both assertions are here for that reason.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { RESULTS_MIN_WIDTH } from "@/components/meridian/results-popover";

const FIND = readFileSync("src/components/shell/FindAnything.tsx", "utf8");
const POPOVER = readFileSync("src/components/meridian/results-popover.tsx", "utf8");
const code = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
const findCode = code(FIND);
const popCode = code(POPOVER);

describe("the panel is as wide as its content needs", () => {
  it("no longer stretches to the field it hangs from", () => {
    // `left-0 right-0` IS the defect: it says "be exactly as wide as the rail".
    expect(findCode).not.toContain("absolute left-0 right-0");
  });

  it("has a floor wide enough for a run title", () => {
    expect(RESULTS_MIN_WIDTH).toBeGreaterThanOrEqual(480);
    expect(popCode).toContain(`minWidth: \`\${RESULTS_MIN_WIDTH}px\``);
  });

  it("grows right from the field's left edge, so it escapes the rail", () => {
    expect(popCode).toContain("absolute left-0");
    expect(popCode).not.toContain("right-0");
  });

  it("never pushes past the window, and the floor still wins on a small one", () => {
    /*
     * A fixed 480px would put a horizontal scrollbar on the page below about
     * 700px of viewport. `max()` of the floor and the available width means a
     * window narrower than the floor gets the window instead.
     */
    expect(popCode).toContain("maxWidth");
    expect(popCode).toContain("max(");
    expect(popCode).toContain("calc(100vw - var(--shell-rail-w) - 3rem)");
  });
});

describe("and the titles inside it are not cut", () => {
  it("stops asking Row to truncate", () => {
    /*
     * THE HALF THE WIDTH DOES NOT FIX. `tight` is a caller's assertion that a
     * row is a scan line whose full content has a detail view to open. That is
     * exactly wrong here: this IS the surface where a person decides which of
     * five similar titles is theirs.
     */
    const list = findCode.slice(findCode.indexOf('role="option"'));
    expect(list).not.toMatch(/^\s*tight$/m);
    expect(list).not.toContain("tight\n");
  });

  it("wraps a title to two lines rather than cutting it at one", () => {
    expect(findCode).toContain('<span className="line-clamp-2">');
  });

  it("keeps the context line to one, so a long run title cannot push the rows apart", () => {
    expect(findCode).toContain('<span className="line-clamp-1">');
  });
});

describe("the keyboard model, which P-25 built and this must not break", () => {
  it("still moves, chooses and closes on the same keys", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) {
      expect(findCode, `${key} is no longer handled`).toContain(`"${key}"`);
    }
  });

  it("still wraps at both ends rather than stopping", () => {
    expect(findCode).toContain("at === options.length - 1 ? 0 : at + 1");
    expect(findCode).toContain("at === 0 ? options.length - 1 : at - 1");
  });

  it("announces the highlighted option, which virtual focus does not do by itself", () => {
    /*
     * P-25 follow-up 3. The input keeps real DOM focus and `cursor` marks the
     * current option -- the right model, and invisible to a screen reader
     * without this. `aria-selected` says which option is chosen;
     * `aria-activedescendant` is what makes it ANNOUNCED as the arrows move.
     */
    expect(findCode).toContain("aria-activedescendant={");
    expect(findCode).toContain('role="combobox"');
    expect(findCode).toContain("aria-controls={LIST_ID}");
    expect(findCode).toContain("id={optionId(i)}");
  });

  it("points at nothing when there is nothing highlighted", () => {
    // A dangling `aria-activedescendant` names an element that is not there,
    // which is worse for a reader than none: it announces an empty string.
    expect(findCode).toContain("open && options.length > 0 ? optionId(");
    expect(findCode).toContain(": undefined");
  });

  it("clamps the id to the list, so a stale cursor cannot point past the end", () => {
    // The same clamp the key handler uses. A shorter result set arriving under
    // a cursor at index 9 would otherwise name an option that does not exist.
    expect(findCode).toContain("optionId(Math.min(cursor, options.length - 1))");
  });
});

describe("what P-25a did not change", () => {
  it("the empty answer is still a sentence, still built from the group list", () => {
    expect(findCode).toContain("NOTHING_NAMED_THAT");
  });

  it("a read in flight still says so rather than wearing the empty state", () => {
    expect(findCode).toContain("Searching.");
  });

  it("the panel still scrolls rather than growing without bound", () => {
    expect(popCode).toContain("overflow-y-auto");
    // And does not scroll the page behind it when it reaches its end.
    expect(popCode).toContain("overscroll-contain");
  });
});
