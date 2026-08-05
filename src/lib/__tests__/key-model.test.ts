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
    expect(navChords().length).toBe(13);
  });
});

describe("the surface lookup answers with the right one", () => {
  it("prefers the longest match, so one run is not the board", () => {
    expect(surfaceKeysFor("/runs")?.path).toBe("/runs");
    expect(surfaceKeysFor("/runs/abc123")?.path).toBe("/runs/$missionId");
  });

  it("reads a $param as any one segment", () => {
    expect(surfaceKeysFor("/plan/spec/9f2b")?.label).toBe("A spec");
  });

  it("says nothing rather than guessing on a surface with no keyboard", () => {
    // /design and /crew both run gate queues with no keys bound. The honest
    // answer is that they have none, not the nearest surface's keys.
    for (const path of ["/design", "/crew", "/brain", "/settings", "/learn"]) {
      expect(surfaceKeysFor(path)).toBeNull();
    }
  });
});

describe("the sheet does not claim more than the product does", () => {
  it("never promises that digits are unbound, because /discover binds three", () => {
    // The audit's draft of the rules carried "no digits anywhere". /discover
    // binds 1, 2 and 3 to promote, merge and decline. Shipping that line would
    // have made the help sheet itself the lie it exists to prevent.
    const discover = SURFACE_KEYS.find((s) => s.path === "/discover");
    expect(discover?.keys.map((k) => k.key)).toContain("1");
    for (const rule of KEYBOARD_RULES) {
      expect(rule).not.toMatch(/no (digits|numbers) anywhere/i);
    }
  });

  it("marks the keys that bite", () => {
    const destructive = SURFACE_KEYS.flatMap((s) => s.keys).filter((k) => k.destructive);
    // Approve, decline, promote, merge, drop, keep, challenge, start a run.
    expect(destructive.length).toBeGreaterThanOrEqual(8);
    for (const k of destructive) expect(k.does.endsWith(".")).toBe(true);
  });

  it("every sentence is a sentence, so the sheet reads rather than labels", () => {
    for (const k of [...SURFACE_KEYS.flatMap((s) => s.keys), ...GLOBAL_KEYS]) {
      expect(k.does[0]).toBe(k.does[0].toUpperCase());
      expect(k.does.endsWith(".")).toBe(true);
    }
  });
});
