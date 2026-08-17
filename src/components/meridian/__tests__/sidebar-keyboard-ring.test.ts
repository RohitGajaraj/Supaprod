/**
 * The rail is one tab stop with arrows, not a row-by-row crawl.
 *
 * WHY THIS IS IN MERIDIAN AND NOT IN A SURFACE. The rail shipped with no keyboard
 * handling: every row its own tab stop, no arrows, no typeahead. Reaching the last
 * of twelve rows was twelve presses, and Tabbing PAST the rail to the actual work
 * was twelve more.
 *
 * `_authenticated.settings.tsx` had already hit that, measured it in its own header
 * ("Diagnostics was a fourteen-press crawl"), and fixed it by hand-rolling a roving
 * tabindex over its own door list. So the product had the fix in exactly one place,
 * in a form nothing else could use. Adopting this rail in Settings would therefore
 * have REGRESSED the keyboard, which is what made this a gap in the design system
 * rather than a feature request for one surface.
 *
 * The ring is pure and exported so it can be tested without a DOM, the same way
 * settings-sections tests its own. There is now ONE implementation, so the two navs
 * cannot answer End differently.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { isRailKey, railTypeahead, stepRail, type RailItem } from "../SidebarNav";

/** Two sections, so the ring is proven to cross a heading rather than stop at one. */
const ITEMS: RailItem[] = [
  { key: "autonomy", label: "Autonomy and approvals", section: "Agents" },
  { key: "roster", label: "Roster", section: "Agents" },
  { key: "models", label: "Models and keys", section: "Agents" },
  { key: "brief", label: "Brief and voice", section: "Company" },
  { key: "brand", label: "Brand", section: "Company" },
  { key: "billing", label: "Billing", section: "Account" },
];

const FIRST = "autonomy";
const LAST = "billing";

describe("the rail owns four keys and no others", () => {
  it("claims the arrows, Home and End", () => {
    for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
      expect(isRailKey(key), `${key} is not claimed`).toBe(true);
    }
  });

  it("leaves everything else alone", () => {
    /*
     * THE ONE THAT MATTERS. preventDefault on a key the rail does not own is how a
     * nav silently breaks page scrolling, browser find, and Tab itself.
     */
    for (const key of ["Tab", "Enter", " ", "PageDown", "ArrowLeft", "ArrowRight", "Escape", "a"]) {
      expect(isRailKey(key), `${key} is being swallowed`).toBe(false);
    }
  });
});

describe("focus moves through the whole rail, across section headings", () => {
  it("Down walks every row in draw order and wraps", () => {
    const seen: string[] = [];
    let at = FIRST;
    for (let i = 0; i < ITEMS.length; i += 1) {
      seen.push(at);
      at = stepRail(ITEMS, at, "ArrowDown")!;
    }
    // Crosses Agents -> Company -> Account without stopping at a heading.
    expect(seen).toEqual(["autonomy", "roster", "models", "brief", "brand", "billing"]);
    expect(at, "Down did not wrap to the start").toBe(FIRST);
  });

  it("Up wraps backwards from the first row", () => {
    expect(stepRail(ITEMS, FIRST, "ArrowUp")).toBe(LAST);
  });

  it("Home and End reach the ends from anywhere, which is the whole fix", () => {
    for (const item of ITEMS) {
      expect(stepRail(ITEMS, item.key, "Home")).toBe(FIRST);
      expect(stepRail(ITEMS, item.key, "End")).toBe(LAST);
    }
  });

  it("starts from the first row when focus is somewhere the rail does not know", () => {
    expect(stepRail(ITEMS, "not-a-row", "ArrowDown")).toBe(FIRST);
  });

  it("answers null for a key it does not own, rather than guessing a move", () => {
    expect(stepRail(ITEMS, FIRST, "PageDown")).toBeNull();
  });

  it("survives an empty rail without throwing", () => {
    expect(stepRail([], FIRST, "ArrowDown")).toBeNull();
    expect(stepRail([], FIRST, "Home")).toBeNull();
  });
});

describe("typeahead is the shortcut into any row", () => {
  it("jumps to a row by the start of its label", () => {
    expect(railTypeahead(ITEMS, "ro", FIRST)).toBe("roster");
    expect(railTypeahead(ITEMS, "mo", FIRST)).toBe("models");
  });

  it("matches the LABEL and never the key", () => {
    // A person reads "Brief and voice"; the key is `brief` and that is a coincidence
    // here. `models` is the proof: its label starts with M, so "mod" reaches it and
    // nothing reaches it by typing its id.
    expect(railTypeahead(ITEMS, "models", FIRST)).toBe("models");
    expect(railTypeahead(ITEMS, "autonomy and", FIRST)).toBe("autonomy");
  });

  it("cycles through every row starting with the same letter", () => {
    /*
     * THE REASON IT SEARCHES FORWARD AND WRAPS rather than taking the first match.
     * Three rows start with B. Pressing b three times must visit all three and come
     * back round; a first-match implementation sits on Brief for ever.
     */
    const first = railTypeahead(ITEMS, "b", FIRST);
    expect(first).toBe("brief");
    const second = railTypeahead(ITEMS, "b", first!);
    expect(second).toBe("brand");
    const third = railTypeahead(ITEMS, "b", second!);
    expect(third).toBe("billing");
    expect(railTypeahead(ITEMS, "b", third!)).toBe("brief");
  });

  it("lets a refining buffer keep matching the row focus is already on", () => {
    // Typing "b" lands on Brief; typing "r" after it must not skip to Brand just
    // because focus is already on a b row. Hence the current row is searched LAST.
    expect(railTypeahead(ITEMS, "br", "brief")).toBe("brief");
    expect(railTypeahead(ITEMS, "bra", "brief")).toBe("brand");
  });

  it("is case-insensitive, because nobody holds shift to navigate", () => {
    expect(railTypeahead(ITEMS, "RO", FIRST)).toBe("roster");
    expect(railTypeahead(ITEMS, "BiL", FIRST)).toBe("billing");
  });

  it("returns null on a typo rather than jumping somewhere arbitrary", () => {
    // Landing "close enough" is worse than not moving: the person cannot tell they
    // mistyped, and they act on the wrong row.
    expect(railTypeahead(ITEMS, "zzz", FIRST)).toBeNull();
    expect(railTypeahead(ITEMS, "", FIRST)).toBeNull();
    expect(railTypeahead(ITEMS, "   ", FIRST)).toBeNull();
  });
});

describe("the component wires the ring up", () => {
  const source = readFileSync(new URL("../SidebarNav.tsx", import.meta.url), "utf8");
  const has = (needle: string) => source.includes(needle);

  it("puts the tab stop on exactly one row and moves it with the selection", () => {
    expect(has("tabIndex: item.key === tabStop ? 0 : -1"), "rows are all tab stops").toBe(true);
    // The ACTIVE row, so Tab lands where the person already is rather than at the
    // top of a list they have already navigated.
    expect(has("order.includes(active) ? active"), "the tab stop is pinned, not roving").toBe(true);
  });

  it("handles keys on the landmark rather than once per row", () => {
    expect(has("onKeyDown={onRailKeyDown}")).toBe(true);
  });

  it("stands down when focus is not on a row", () => {
    // The search field and the primary action are inside the same landmark. Without
    // this, typing in search drags focus into the rows and End moves the caret to
    // the last station.
    expect(has("if (!focused) return;"), "the rail hijacks keys from its own search box").toBe(
      true,
    );
  });
});
