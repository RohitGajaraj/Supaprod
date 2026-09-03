import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SURFACE_KEYS,
  surfaceKeysFor,
  navChords,
  GLOBAL_KEYS,
  KEYBOARD_RULES,
} from "@/lib/key-model";
import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";

/**
 * A REGISTRY THAT CAN DRIFT FROM THE CODE IS WORSE THAN NO REGISTRY.
 *
 * `key-model.ts` declares what every key does so a person can be shown it. The
 * surfaces still bind their own keys, so the declaration and the binding are
 * two facts in two files, and two facts in two files is how the product ended
 * up with a Settings gear promising "shortcut s" when `s` is bound by nothing.
 *
 * So this checks BOTH directions, and the second one is the one that matters:
 *   - Every key DECLARED is really compared against in that surface's file.
 *     Catches a stale entry: a key removed from the code but left in the sheet,
 *     which teaches a keystroke that does nothing.
 *   - Every bare key really compared against in those files is DECLARED.
 *     Catches the opposite and more common failure: a key added to a surface
 *     and drawn nowhere, which is exactly how seven live bindings on the loop
 *     stations stayed invisible for weeks.
 *
 * It reads source text on purpose. Importing the routes would drag in the
 * router, the server functions and a Supabase client for a question that is
 * answerable from the characters in the file.
 */

const ROOT = join(import.meta.dir, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Bare single-character keys a surface compares against, read out of the
 *  source. Deliberately NOT matching multi-character names: Escape, Enter, Tab
 *  and the arrows are structural rather than shortcuts, every surface uses
 *  them, and listing them per surface would bury the three keys that matter. */
function boundBareKeys(src: string): Set<string> {
  const found = new Set<string>();
  for (const m of src.matchAll(/\be\.key === "(.)"/g)) found.add(m[1]);
  return found;
}

describe("every declared key is really bound", () => {
  for (const surface of SURFACE_KEYS) {
    it(`${surface.label} (${surface.path}) binds what it claims`, () => {
      const src = read(surface.source);
      const bound = boundBareKeys(src);
      const missing = surface.keys
        // The Cmd chords are compared with a different shape (`metaKey &&
        // e.key === "Enter"`), so they are checked separately below.
        .filter((k) => k.key.length === 1)
        .filter((k) => !bound.has(k.key))
        .map((k) => `${k.key} is declared but ${surface.source} never compares against it`);
      expect(missing).toEqual([]);
    });
  }

  it("the Cmd chords are bound where they are declared", () => {
    for (const surface of SURFACE_KEYS) {
      for (const k of surface.keys) {
        if (k.key === "⌘S") {
          expect(read(surface.source)).toMatch(/(metaKey|ctrlKey)[\s\S]{0,80}"s"/i);
        }
        if (k.key === "⌘↵") {
          expect(read(surface.source)).toMatch(/(metaKey|ctrlKey)[\s\S]{0,80}"Enter"/);
        }
      }
    }
  });
});

describe("every bound key is declared", () => {
  for (const surface of SURFACE_KEYS) {
    it(`${surface.label} declares every bare key its file binds`, () => {
      const bound = boundBareKeys(read(surface.source));
      const declared = new Set(surface.keys.map((k) => k.key));
      const undeclared = [...bound]
        .filter((k) => !declared.has(k))
        .map((k) => `${surface.source} binds "${k}" and the sheet would never show it`);
      expect(undeclared).toEqual([]);
    });
  }
});

describe("the sheet cannot invent a door", () => {
  it("derives the chords rather than typing them", () => {
    const derived = [...PRIMARY_NAV, ...FOOTER_NAV]
      .filter((d) => navKeyHint(d) !== "")
      .map((d) => ({ label: d.label, keys: `${NAV_CHORD_PREFIX} ${navKeyHint(d)}`, to: d.to }));
    expect(navChords()).toEqual(derived);
  });

  it("drops the door that has no key, rather than inventing one for it", () => {
    // /admin is keyless on purpose: the shell renders no admin control, so a
    // key there would go somewhere the rail cannot follow.
    expect(navChords().map((c) => c.to)).not.toContain("/admin");
    // Derived: every keyed door gets a chord and nothing else does. A count
    // here would say what the list held on one day (P-60).
    expect(navChords().length).toBe(PRIMARY_NAV.filter((d) => navKeyHint(d) !== "").length);
  });
});

describe("the surface lookup answers with the right one", () => {
  it("does not let a bare prefix inherit a longer path's keys", () => {
    /*
     * THIS USED TO ASSERT THE PAIR, then the absence of the shorter half when
     * `/runs` itself folded to a redirect, and now asserts the absence of
     * both: `/runs/$missionId` left the array too (P-14, A-QUEUE.md, R-35),
     * the same fold. Both paths are redirects now and neither has a keyboard.
     */
    expect(surfaceKeysFor("/runs")).toBeNull();
    expect(surfaceKeysFor("/runs/abc123")).toBeNull();
  });

  it("reads a $param as any one segment", () => {
    expect(surfaceKeysFor("/plan/spec/9f2b")?.label).toBe("A spec");
  });

  it("says nothing rather than guessing on a surface with no keyboard", () => {
    // /design and /crew were here when this test was written, because both ran
    // gate queues with nothing bound. They have keys now. These four still do
    // not, and the honest answer for them is none rather than the nearest
    // surface's keys.
    for (const path of ["/outcomes", "/settings", "/learn", "/ship"]) {
      expect(surfaceKeysFor(path)).toBeNull();
    }
  });

  /**
   * ONE ALPHABET ACROSS THE GATES, checked rather than hoped for.
   *
   * The audit's finding: decline changes letter on every station -- `d` on
   * Today, `r` on Approvals, `x` on Decide, `3` on Discover -- each internally
   * consistent, each drawn, and `d` dead on Approvals while `r` is dead on
   * Today. Today's own copy sends you across that boundary. Worse, `k` MOVES
   * THE CURSOR on Approvals and COMMITS on Decide.
   *
   * /design and /crew were bound to `a` and `d` because those are what the
   * front door already teaches. This test holds every gate that has been
   * converted so far to that pair, and it is the list that grows as the rest
   * are converted rather than a rule asserted over surfaces that have not been.
   */
  // "/decide" left this list (P-14, A-QUEUE.md, R-34): the surface and its
  // keybindings are deleted, not converted.
  // "/design" left this list too (P-14, A-QUEUE.md, R-34): the surface and
  // its keybindings are deleted, not converted.
  // "/start" left this list too (P-14, A-QUEUE.md): its entry pointed at
  // Board.tsx's dead DecisionQueue.tsx, never actually mounted on the page;
  // the real, live approve/decline pair lives at "/approvals" below.
  const CONVERTED = ["/crew", "/arriving", "/approvals"];
  for (const path of CONVERTED) {
    it(`${path} accepts with a and declines with d`, () => {
      const keys = surfaceKeysFor(path)?.keys.map((k) => k.key) ?? [];
      expect(keys).toContain("a");
      expect(keys).toContain("d");
    });
  }

  it("no letter means one thing on one gate and another on the next", () => {
    /**
     * THE COLLISION THIS ENDS, and it was the worst one in the product: `k`
     * MOVED THE CURSOR on /approvals and COMMITTED on /decide -- the same key,
     * one surface apart, one harmless and the other spending money to draft a
     * spec. Muscle memory built on either surface was dangerous on the other.
     *
     * The rule is not "every gate binds the same keys": Discover has a merge
     * and Decide has a challenge, and those are real differences. The rule is
     * that a letter cannot mean two different KINDS of thing. So a key that
     * commits anywhere must never merely move somewhere else.
     */
    const commits = new Map<string, string>();
    const moves = new Map<string, string>();
    for (const path of CONVERTED) {
      for (const k of surfaceKeysFor(path)?.keys ?? []) {
        (k.destructive ? commits : moves).set(k.key, path);
      }
    }
    const both = [...commits.keys()]
      .filter((k) => moves.has(k))
      .map((k) => `"${k}" commits on ${commits.get(k)} and only moves on ${moves.get(k)}`);
    expect(both).toEqual([]);
  });

  it("a gate that draws a keycap has bound it, on every converted surface", () => {
    // `shortcut` on a Button renders a <kbd> and binds NOTHING. That is how
    // this product shipped a Settings gear promising a key that fires nothing
    // and a /runs keycap the key could not reach. So on any surface that draws
    // one, the same file must also register a listener for it.
    for (const path of CONVERTED) {
      const surface = surfaceKeysFor(path)!;
      const src = read(surface.source);
      // Scoped to the keys that COMMIT. A movement key (j, k) has no button of
      // its own to wear a keycap, and /discover states them in the ranking's
      // own subtitle instead. The rule that matters is that nothing which
      // changes a record can fire from a key a person was never shown.
      //
      // `keycapDrawn === false` (P-53) is the one other exemption, and it is
      // narrower than it looks: it does not mean the key fires unshown, it
      // means the CONTROL that fires it -- `Ask.answer`/`decline`/
      // `fallbackAction` -- has no keycap slot at all, unlike `Action` and
      // `Approve`. See `SurfaceKey.keycapDrawn`'s own header for why.
      for (const k of surface.keys.filter(
        (x) => x.key.length === 1 && x.destructive && x.keycapDrawn !== false,
      )) {
        expect({ path, key: k.key, drawn: src.includes(`shortcut="${k.key}"`) }).toEqual({
          path,
          key: k.key,
          drawn: true,
        });
      }
    }
  });
});

describe("the sheet does not claim more than the product does", () => {
  /**
   * ONE ALPHABET, AND NOW IT IS ACTUALLY TRUE.
   *
   * This test was written the other way up. The sheet's rules were forbidden
   * from claiming "no digits anywhere" BECAUSE /discover bound 1, 2 and 3 to
   * promote, merge and decline -- directly above a ranking whose rows are
   * numbered 1 to 6, so pressing `3` to pick the third row declined the first.
   * A digit meaning position in one place and disposition six pixels away, with
   * the destructive reading winning.
   *
   * Those became `a`, `m` and `d`. So the claim is now honest and the test
   * flips from banning the sentence to ENFORCING the fact: no surface may bind
   * a digit, and the moment one does, this fails rather than the help sheet
   * quietly starting to lie.
   */
  it("binds no digit on any surface, so the rule the sheet states is true", () => {
    const digits = SURFACE_KEYS.flatMap((s) =>
      s.keys.filter((k) => /^[0-9]$/.test(k.key)).map((k) => `${s.path} binds "${k.key}"`),
    );
    expect(digits).toEqual([]);
  });

  it("says so in the rules, now that it can", () => {
    expect(KEYBOARD_RULES.some((r) => /never a number|no digits/i.test(r))).toBe(true);
  });

  it("marks the keys that bite", () => {
    const destructive = SURFACE_KEYS.flatMap((s) => s.keys).filter((k) => k.destructive);
    // Approve/decline (Approvals), accept/merge/decline (Arriving),
    // approve/decline (Crew). "/start" left this count (P-14, A-QUEUE.md):
    // its two destructive keys pointed at Board.tsx's dead DecisionQueue.tsx.
    expect(destructive.length).toBeGreaterThanOrEqual(7);
    for (const k of destructive) expect(k.does.endsWith(".")).toBe(true);
  });

  it("every sentence is a sentence, so the sheet reads rather than labels", () => {
    for (const k of [...SURFACE_KEYS.flatMap((s) => s.keys), ...GLOBAL_KEYS]) {
      expect(k.does[0]).toBe(k.does[0].toUpperCase());
      expect(k.does.endsWith(".")).toBe(true);
    }
  });
});
