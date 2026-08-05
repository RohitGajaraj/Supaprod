import { describe, it, expect } from "bun:test";
import {
  SETTINGS_GROUPS,
  NAV_GROUPS,
  NAV_DOOR_IDS,
  ALL_SECTION_IDS,
  PRIMARY_GROUPS,
  RECESSED_GROUPS,
  LEGACY_SECTION_MAP,
  DEFAULT_SECTION,
  normalizeSection,
  paneForSection,
  groupForSection,
  findGroup,
  primarySection,
  sectionLabel,
  navTabStop,
  isNavKey,
  stepDoor,
  doorByTypeahead,
  type SectionId,
} from "./settings-sections";

/**
 * SETTINGS IA. Two things are locked here, and they are different in kind.
 *
 * THE CONTRACT, which must never move: all 16 section ids exist, each sits in
 * exactly one group, every `?section=` value and legacy alias still resolves.
 * Regrouping is allowed to change which HEADING a door sits under and nothing
 * else, so these tests are what makes a regroup safe to do at all.
 *
 * THE NAV, which is new: the door ring the route renders, the single roving tab
 * stop, the Up/Down/Home/End contract and typeahead. These live here rather than
 * in a DOM test because they are pure functions - a keyboard contract that only
 * exists inside an event handler is a keyboard contract nobody can assert.
 */

// The 16 section ids the route ships with - the routing contract that must hold.
const ORIGINAL_SECTION_IDS: SectionId[] = [
  "connections",
  "ai",
  "staff",
  "autonomy",
  "workspace",
  "brand",
  "products",
  "billing",
  "credits",
  "interop",
  "sync",
  "profile",
  "health",
  "data",
  "notifications",
  "memory",
];

describe("settings-sections - the routing contract is preserved", () => {
  it("exposes exactly the 16 section ids (no id added or dropped)", () => {
    expect([...ALL_SECTION_IDS].sort()).toEqual([...ORIGINAL_SECTION_IDS].sort());
  });

  it("has no duplicate section id across groups", () => {
    expect(new Set(ALL_SECTION_IDS).size).toBe(ALL_SECTION_IDS.length);
  });

  it("every section belongs to exactly one group", () => {
    for (const id of ORIGINAL_SECTION_IDS) {
      const owning = SETTINGS_GROUPS.filter((g) => g.sections.some((s) => s.id === id));
      expect(owning.length).toBe(1);
    }
  });
});

describe("settings-sections - the five groups are named by the boundary they set", () => {
  it("presents exactly five groups, none recessed", () => {
    expect(SETTINGS_GROUPS.length).toBe(5);
    expect(PRIMARY_GROUPS.length).toBe(5);
    expect(RECESSED_GROUPS.length).toBe(0);
  });

  it("the five groups are crew, brief, reach, you, plan in order", () => {
    expect(SETTINGS_GROUPS.map((g) => g.id)).toEqual(["crew", "brief", "reach", "you", "plan"]);
  });

  it("every group has a label, a one-line desc, and at least one section", () => {
    for (const g of SETTINGS_GROUPS) {
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.desc.length).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("no group is named for whose thing it is: no General, Advanced, Other or Misc", () => {
    // The founder's instruction was to group in the product's own words. These
    // four are the labels a grouping falls back on when nobody decided.
    for (const g of SETTINGS_GROUPS) {
      expect(g.label.toLowerCase()).not.toMatch(/^(general|advanced|other|misc|miscellaneous)$/);
    }
  });

  it("What the crew may do holds Autonomy, the Roster and Models", () => {
    expect(groupForSection("autonomy")).toBe("crew");
    expect(groupForSection("staff")).toBe("crew");
    expect(groupForSection("ai")).toBe("crew");
  });

  it("What the crew reads holds the brief, brand, products and the memory address", () => {
    expect(groupForSection("workspace")).toBe("brief");
    expect(groupForSection("brand")).toBe("brief");
    expect(groupForSection("products")).toBe("brief");
    expect(groupForSection("memory")).toBe("brief");
  });

  it("What it can reach holds connectors, sync, agent access and your data", () => {
    expect(groupForSection("connections")).toBe("reach");
    expect(groupForSection("sync")).toBe("reach");
    expect(groupForSection("interop")).toBe("reach");
    expect(groupForSection("data")).toBe("reach");
  });

  it("What reaches you holds profile and notifications", () => {
    expect(groupForSection("profile")).toBe("you");
    expect(groupForSection("notifications")).toBe("you");
  });

  it("Diagnostics sits with the money: system health and cost are one neighbourhood", () => {
    expect(groupForSection("billing")).toBe("plan");
    expect(groupForSection("credits")).toBe("plan");
    expect(groupForSection("health")).toBe("plan");
  });
});

describe("settings-sections - the nav ring", () => {
  it("draws 14 doors: every section except the two that are address-only", () => {
    expect(NAV_DOOR_IDS.length).toBe(14);
    expect(NAV_DOOR_IDS).not.toContain("memory");
    expect(NAV_DOOR_IDS).not.toContain("sync");
    // Everything else IS a door. A section with neither a door nor a documented
    // reason is a capability with no way in.
    for (const id of ORIGINAL_SECTION_IDS) {
      if (id === "memory" || id === "sync") continue;
      expect(NAV_DOOR_IDS).toContain(id);
    }
  });

  it("NAV_GROUPS is the same five headings, in the same order, with doors only", () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(SETTINGS_GROUPS.map((g) => g.id));
    expect(NAV_GROUPS.flatMap((g) => g.sections.map((s) => s.id))).toEqual([...NAV_DOOR_IDS]);
    for (const g of NAV_GROUPS) {
      for (const s of g.sections) expect(s.door).not.toBe(false);
    }
  });

  it("Autonomy leads and Diagnostics is last, so Home and End reach both in one press", () => {
    expect(NAV_DOOR_IDS[0]).toBe("autonomy");
    expect(NAV_DOOR_IDS[NAV_DOOR_IDS.length - 1]).toBe("health");
    expect(DEFAULT_SECTION).toBe("autonomy");
  });

  it("every group's landing section draws a door", () => {
    // A group whose primary is doorless would send a click to a section the nav
    // cannot show as current.
    for (const g of SETTINGS_GROUPS) {
      expect(NAV_DOOR_IDS).toContain(primarySection(g.id));
    }
  });

  it("no two doors share a label, so typeahead and the eye can both tell them apart", () => {
    const labels = NAV_DOOR_IDS.map((id) => sectionLabel(id).toLowerCase());
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("settings-sections - the folded addresses still answer", () => {
  it("sync renders the Connectors pane; everything else renders itself", () => {
    expect(paneForSection("sync")).toBe("connections");
    for (const id of ORIGINAL_SECTION_IDS) {
      if (id === "sync") continue;
      expect(paneForSection(id)).toBe(id);
    }
  });

  it("every fold target is a real, doored section", () => {
    for (const id of ORIGINAL_SECTION_IDS) {
      const pane = paneForSection(id);
      expect(ORIGINAL_SECTION_IDS).toContain(pane);
      if (pane !== id) expect(NAV_DOOR_IDS).toContain(pane);
    }
  });
});

describe("settings-sections - derivations", () => {
  it("groupForSection round-trips with primarySection for all five groups", () => {
    for (const g of SETTINGS_GROUPS) {
      const primary = primarySection(g.id);
      expect(groupForSection(primary)).toBe(g.id);
      expect(primary).toBe(g.sections[0]!.id);
    }
  });

  it("primarySection falls back to DEFAULT_SECTION for an unknown group", () => {
    // @ts-expect-error - exercising the runtime guard with a bad id
    expect(primarySection("nope")).toBe(DEFAULT_SECTION);
  });

  it("findGroup returns the definition, or undefined when unknown", () => {
    expect(findGroup("plan")?.label).toBe("What it costs, and whether it works");
    // @ts-expect-error - unknown id
    expect(findGroup("nope")).toBeUndefined();
  });

  it("sectionLabel matches the label the nav actually draws", () => {
    // These used to differ from the rendered nav ("Models & keys" here vs
    // "Models and keys" on screen) because the route carried its own door list.
    // It reads this module now, so the two cannot drift again.
    expect(sectionLabel("ai")).toBe("Models and keys");
    expect(sectionLabel("staff")).toBe("Roster");
    expect(sectionLabel("workspace")).toBe("Brief and voice");
    expect(sectionLabel("autonomy")).toBe("Autonomy and approvals");
    // Founder ruling 2026-07-29 (commit 9900c049): "Sources is now Connectors,
    // in the nav label, the head and every line of prose."
    expect(sectionLabel("connections")).toBe("Connectors");
    expect(sectionLabel("nope" as SectionId)).toBe("nope");
  });
});

describe("settings-sections - normalizeSection (deep-link safety)", () => {
  it("defaults to Autonomy when nothing is provided", () => {
    expect(normalizeSection(undefined)).toBe(DEFAULT_SECTION);
    expect(normalizeSection(null)).toBe(DEFAULT_SECTION);
    expect(normalizeSection("")).toBe(DEFAULT_SECTION);
    expect(DEFAULT_SECTION).toBe("autonomy");
  });

  it("passes through every valid section id unchanged", () => {
    for (const id of ORIGINAL_SECTION_IDS) {
      expect(normalizeSection(id)).toBe(id);
    }
  });

  it("keeps the retired group ids landing (agents -> Roster, you -> Profile)", () => {
    // Links saved under the previous grouping still arrive. Profile in
    // particular: the account menu and every "you" link must not fall back to
    // the new default, which would silently send someone to Autonomy.
    expect(normalizeSection("agents")).toBe("staff");
    expect(normalizeSection("you")).toBe("profile");
  });

  it("keeps legacy deep links landing (brief -> workspace, calendar -> connections)", () => {
    expect(normalizeSection("brief")).toBe("workspace");
    expect(normalizeSection("calendar")).toBe("connections");
    for (const target of Object.values(LEGACY_SECTION_MAP)) {
      expect(ORIGINAL_SECTION_IDS).toContain(target);
    }
  });

  it("?section=plan lands on Plan - the checkout redirect and account menu depend on it", () => {
    expect(normalizeSection("plan")).toBe("billing");
  });

  it("every group id lands inside its own group", () => {
    for (const g of SETTINGS_GROUPS) {
      expect(groupForSection(paneForSection(normalizeSection(g.id)))).toBe(g.id);
    }
  });

  it("falls back to the default for an unknown section value", () => {
    expect(normalizeSection("totally-made-up")).toBe(DEFAULT_SECTION);
  });
});

describe("settings-sections - the nav is one tab stop, on every address", () => {
  it("the active door owns the tab stop", () => {
    expect(navTabStop("health")).toBe("health");
    expect(navTabStop("profile")).toBe("profile");
    expect(navTabStop("autonomy")).toBe("autonomy");
  });

  it("a doorless address still leaves the nav reachable", () => {
    // THE DEFECT: with the naive roving rule ("active gets 0, others get -1"),
    // ?section=memory matches no door, every door gets -1, and the whole nav
    // drops out of the tab order - a keyboard-only person on that address is
    // stranded. `memory` renders a real pane, so this is a live address.
    expect(navTabStop("memory")).toBe(NAV_DOOR_IDS[0]);
    // `sync` folds, so its tab stop is the door it folds into, not a fallback.
    expect(navTabStop("sync")).toBe("connections");
  });

  it("gives exactly one tab stop for every one of the 16 addresses", () => {
    for (const id of ORIGINAL_SECTION_IDS) {
      const stop = navTabStop(id);
      expect(NAV_DOOR_IDS.filter((d) => d === stop).length).toBe(1);
    }
  });
});

describe("settings-sections - Up, Down, Home and End", () => {
  it("owns only the four keys it handles", () => {
    expect(isNavKey("ArrowDown")).toBe(true);
    expect(isNavKey("ArrowUp")).toBe(true);
    expect(isNavKey("Home")).toBe(true);
    expect(isNavKey("End")).toBe(true);
    // Left/Right belong to the horizontal flashlight-tabs row, not to a
    // vertical index; Tab must leave the nav, and PageDown must scroll.
    expect(isNavKey("ArrowLeft")).toBe(false);
    expect(isNavKey("ArrowRight")).toBe(false);
    expect(isNavKey("Tab")).toBe(false);
    expect(isNavKey("PageDown")).toBe(false);
  });

  it("returns null for a key it does not own, so the caller does not swallow it", () => {
    expect(stepDoor("autonomy", "Tab")).toBeNull();
    expect(stepDoor("autonomy", "a")).toBeNull();
  });

  it("Down and Up step one door, across group boundaries", () => {
    expect(stepDoor("autonomy", "ArrowDown")).toBe("staff");
    expect(stepDoor("staff", "ArrowUp")).toBe("autonomy");
    // The last door of "What the crew may do" steps into the next group's first.
    expect(stepDoor("ai", "ArrowDown")).toBe("workspace");
    expect(stepDoor("workspace", "ArrowUp")).toBe("ai");
  });

  it("Down wraps at the end and Up wraps at the start", () => {
    expect(stepDoor("health", "ArrowDown")).toBe("autonomy");
    expect(stepDoor("autonomy", "ArrowUp")).toBe("health");
  });

  it("Home and End reach the ends from anywhere, which is the fix for the crawl", () => {
    for (const id of NAV_DOOR_IDS) {
      expect(stepDoor(id, "Home")).toBe("autonomy");
      expect(stepDoor(id, "End")).toBe("health");
    }
  });

  it("steps from a doorless section as if from the top, rather than nowhere", () => {
    expect(stepDoor("memory", "ArrowDown")).toBe(NAV_DOOR_IDS[1]);
  });

  it("walking Down through the whole ring visits all 14 doors exactly once", () => {
    const seen: SectionId[] = [];
    let at: SectionId = NAV_DOOR_IDS[0]!;
    for (let i = 0; i < NAV_DOOR_IDS.length; i += 1) {
      seen.push(at);
      at = stepDoor(at, "ArrowDown")!;
    }
    expect(seen).toEqual([...NAV_DOOR_IDS]);
    expect(at).toBe(NAV_DOOR_IDS[0]!);
  });
});

describe("settings-sections - typeahead, the shortcut into any of the fifteen", () => {
  it("jumps to the first door whose label starts with what you typed", () => {
    expect(doorByTypeahead("d", "autonomy")).toBe("health"); // Diagnostics
    expect(doorByTypeahead("br", "autonomy")).toBe("workspace"); // Brief and voice
    expect(doorByTypeahead("cre", "autonomy")).toBe("credits");
  });

  it("a single repeated letter cycles through every door that starts with it", () => {
    // Products, Profile and Plan all start with P: pressing p three times must
    // visit all three and then come back round, not sit on the first.
    const first = doorByTypeahead("p", "autonomy");
    expect(first).toBe("products");
    const second = doorByTypeahead("p", first!);
    expect(second).toBe("profile");
    const third = doorByTypeahead("p", second!);
    expect(third).toBe("billing"); // labelled "Plan"
    expect(doorByTypeahead("p", third!)).toBe("products");
  });

  it("a refining buffer is allowed to keep matching the door you are on", () => {
    // Typing "c" then "r" must not skip past Credits just because focus already
    // got there on the "c".
    expect(doorByTypeahead("cr", "credits")).toBe("credits");
  });

  it("returns null on a typo rather than jumping somewhere arbitrary", () => {
    expect(doorByTypeahead("zzz", "autonomy")).toBeNull();
    expect(doorByTypeahead("", "autonomy")).toBeNull();
    expect(doorByTypeahead("   ", "autonomy")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(doorByTypeahead("D", "autonomy")).toBe("health");
    expect(doorByTypeahead("CRE", "autonomy")).toBe("credits");
  });

  it("reaches every one of the 14 doors by its own full label", () => {
    // The claim "type a name" in the nav's hint is only true if it is true for
    // all of them.
    for (const id of NAV_DOOR_IDS) {
      expect(doorByTypeahead(sectionLabel(id), "autonomy")).toBe(id);
    }
  });
});
