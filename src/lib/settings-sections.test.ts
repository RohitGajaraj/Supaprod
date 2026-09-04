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
 * THE CONTRACT, which must never move: all 17 section ids exist, each sits in
 * exactly one group, every `?section=` value and legacy alias still resolves.
 * Regrouping is allowed to change which HEADING a door sits under and nothing
 * else, so these tests are what makes a regroup safe to do at all.
 *
 * THE NAV, which is new: the door ring the route renders, the single roving tab
 * stop, the Up/Down/Home/End contract and typeahead. These live here rather than
 * in a DOM test because they are pure functions - a keyboard contract that only
 * exists inside an event handler is a keyboard contract nobody can assert.
 *
 * SEVEN GROUPS SINCE P-23 (2026-09-02), UP FROM FOUR. The 16 original section
 * ids all survive; one is new (`brief`, split out of `workspace`). See
 * `settings-sections.ts`'s own header for the full ruling.
 */

/*
 * The 18 section ids the route ships with - the routing contract that must
 * hold. WAS 17; `hosting` joined it (P-118b) because a preview app is a thing
 * this workspace put outside itself and the account it fills is the founder's,
 * so it needed somewhere to be looked at. Adding an id is meant to fail this
 * list: a door nobody decided to add is the thing it is guarding against.
 */
const ORIGINAL_SECTION_IDS: SectionId[] = [
  "connections",
  "ai",
  "staff",
  "autonomy",
  "brief",
  "workspace",
  "brand",
  "products",
  "billing",
  "credits",
  "interop",
  "hosting",
  "sync",
  "profile",
  "health",
  "data",
  "notifications",
  "memory",
];

describe("settings-sections - the routing contract is preserved", () => {
  it("exposes exactly the 18 section ids (no id added or dropped)", () => {
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

describe("settings-sections - the seven groups are named by the boundary they set", () => {
  /*
   * SEVEN SINCE P-23, up from four. The count is still pinned rather than
   * loosened: a closed number is what makes an eighth group a decision
   * somebody takes on purpose instead of a drift.
   */
  it("presents exactly seven groups, none recessed", () => {
    expect(SETTINGS_GROUPS.length).toBe(7);
    expect(PRIMARY_GROUPS.length).toBe(7);
    expect(RECESSED_GROUPS.length).toBe(0);
  });

  it("the seven groups run you, autonomy, brief, connections, workspace, usage, security", () => {
    expect(SETTINGS_GROUPS.map((g) => g.id)).toEqual([
      "you",
      "autonomy",
      "brief",
      "connections",
      "workspace",
      "usage",
      "security",
    ]);
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

  it("Autonomy holds who works here and their rope, and NOT the models", () => {
    /*
     * `ai` MOVED TO `connections` UNDER P-23 (A1's ruling, 2026-09-02 22:25):
     * "a provider key is a connection to what the agents run on - one group
     * for everything external."
     */
    expect(groupForSection("staff")).toBe("autonomy");
    expect(groupForSection("autonomy")).toBe("autonomy");
    expect(groupForSection("ai")).toBe("connections");
  });

  it("puts who works here BEFORE the rope they are given", () => {
    // A person cannot have an opinion about anybody's autonomy before they have met
    // the crew. Autonomy was leading with a dial for agents the reader had not seen.
    const agents = SETTINGS_GROUPS.find((g) => g.id === "autonomy")!;
    expect(agents.sections.map((sec) => sec.id)).toEqual(["staff", "autonomy"]);
  });

  it("Brief is its own group now, split out of Workspace (P-23)", () => {
    expect(groupForSection("brief")).toBe("brief");
    expect(groupForSection("workspace")).toBe("workspace");
    const brief = SETTINGS_GROUPS.find((g) => g.id === "brief")!;
    expect(brief.sections.map((sec) => sec.id)).toEqual(["brief"]);
  });

  it("Connections holds connectors, sync, models and outside access", () => {
    expect(groupForSection("connections")).toBe("connections");
    expect(groupForSection("sync")).toBe("connections");
    expect(groupForSection("ai")).toBe("connections");
    expect(groupForSection("interop")).toBe("connections");
  });

  it("Workspace holds the company: brand, products and the memory address", () => {
    expect(groupForSection("workspace")).toBe("workspace");
    expect(groupForSection("brand")).toBe("workspace");
    expect(groupForSection("products")).toBe("workspace");
    expect(groupForSection("memory")).toBe("workspace");
  });

  it("You holds profile and notifications only - billing and health moved to Usage", () => {
    expect(groupForSection("profile")).toBe("you");
    expect(groupForSection("notifications")).toBe("you");
    expect(groupForSection("billing")).toBe("usage");
    expect(groupForSection("health")).toBe("usage");
  });

  it("Usage holds what this costs and whether it works", () => {
    expect(groupForSection("billing")).toBe("usage");
    expect(groupForSection("credits")).toBe("usage");
    expect(groupForSection("health")).toBe("usage");
  });

  it("Security holds your data - the export door", () => {
    expect(groupForSection("data")).toBe("security");
  });

  it("Diagnostics keeps its address and draws no door, because it reports rather than sets", () => {
    /*
     * IT USED TO SIT WITH THE MONEY under `you`; P-23 moved the whole GROUP it
     * sits inside (billing joined it as Usage), not its own door-less status.
     * Settings is where a person STATES what they want; Diagnostics reports
     * whether the machine is achieving it. Its door is drawn from the Engine
     * Room now and the pane stays here, so every saved `?section=health` link
     * still answers.
     */
    expect(groupForSection("health")).toBe("usage");
    expect(NAV_DOOR_IDS).not.toContain("health");
    expect(ALL_SECTION_IDS).toContain("health");
  });
});

describe("settings-sections - the nav ring", () => {
  it("draws 14 doors: every section except the four that are address-only", () => {
    /* 13 before Hosting. The four address-only sections below are unchanged:
       this is one more DOOR, not one fewer exception. */
    expect(NAV_DOOR_IDS.length).toBe(14);
    /*
     * FOUR ADDRESS-ONLY SECTIONS, unchanged in count and reason by the regroup:
     *   memory  - dead pane, live address
     *   sync    - folds into Connectors, same bindings
     *   credits - folds into Billing, one money errand
     *   health  - reports rather than sets; its door is in the Engine Room
     */
    const ADDRESS_ONLY: readonly SectionId[] = ["memory", "sync", "credits", "health"];
    for (const id of ADDRESS_ONLY) expect(NAV_DOOR_IDS).not.toContain(id);
    // Everything else IS a door. A section with neither a door nor a documented
    // reason is a capability with no way in.
    for (const id of ORIGINAL_SECTION_IDS) {
      if (ADDRESS_ONLY.includes(id)) continue;
      expect(NAV_DOOR_IDS).toContain(id);
    }
  });

  it("NAV_GROUPS is the same seven headings, in the same order, with doors only", () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(SETTINGS_GROUPS.map((g) => g.id));
    expect(NAV_GROUPS.flatMap((g) => g.sections.map((s) => s.id))).toEqual([...NAV_DOOR_IDS]);
    for (const g of NAV_GROUPS) {
      for (const s of g.sections) expect(s.door).not.toBe(false);
    }
  });

  it("Profile leads and Your data (Security) is last, so Home and End reach both in one press", () => {
    /* Profile, because that is where every bare entrance to this surface already
       lands. */
    expect(NAV_DOOR_IDS[0]).toBe("profile");
    /* End must land on the last DOOR, never on a section that is only an address.
       `data` is Security's one section and Security is the last group. */
    expect(NAV_DOOR_IDS[NAV_DOOR_IDS.length - 1]).toBe("data");
  });

  // A bare /settings is an address people ARRIVE at - the account menu, `g s`,
  // the /notifications redirect - rather than one they ask for, so it must not
  // land on the governance pane. Autonomy is the second group, so Home then one
  // Down still reaches it in two presses from anywhere in the index.
  it("a bare /settings does not open on a governance pane", () => {
    expect(DEFAULT_SECTION).toBe("profile");
    expect(DEFAULT_SECTION).not.toBe("autonomy");
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
  it("sync renders Connectors and credits renders Billing; everything else renders itself", () => {
    const FOLDS: Partial<Record<SectionId, SectionId>> = {
      sync: "connections",
      credits: "billing",
    };
    for (const id of ORIGINAL_SECTION_IDS) {
      expect(paneForSection(id)).toBe(FOLDS[id] ?? id);
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
  it("groupForSection round-trips with primarySection for all seven groups", () => {
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
    // Asserts the lookup resolves, not the copy. Pinning the exact label here
    // is what made a wording fix fail an unrelated test: this case is about
    // findGroup, and the labels are guarded on their own terms below.
    /* `plan` was retired as a GROUP; billing lives under Usage now. The id
       survives only as a `?section=` alias, which normalizeSection still honours. */
    expect(findGroup("plan" as never)).toBeUndefined();
    expect(findGroup("you")?.sections.map((s) => s.id)).toEqual(["profile", "notifications"]);
    expect(findGroup("usage")?.sections.map((s) => s.id)).toContain("billing");
    // @ts-expect-error - unknown id
    expect(findGroup("nope")).toBeUndefined();
  });

  /**
   * A sidebar is scanned for a noun, not read for a sentence.
   */
  it("names every group with a noun rather than a sentence", () => {
    for (const g of SETTINGS_GROUPS) {
      expect(g.label).not.toMatch(/^(what|how|where|when|who|why)\b/i);
      expect(g.label).not.toContain("?");
      // Short enough to scan at a glance rather than read.
      expect(g.label.split(/\s+/).length).toBeLessThanOrEqual(3);
      // The sentence it replaced has to survive somewhere.
      expect(g.desc.length).toBeGreaterThan(20);
    }
  });

  it("sectionLabel matches the label the nav actually draws", () => {
    // These used to differ from the rendered nav ("Models & keys" here vs
    // "Models and keys" on screen) because the route carried its own door list.
    // It reads this module now, so the two cannot drift again.
    expect(sectionLabel("ai")).toBe("Models");
    /* "Who works here", not "Roster": a house word nobody types, and "Agents" would
       have collided with its own group heading. The keywords still carry "roster". */
    expect(sectionLabel("staff")).toBe("Who works here");
    expect(sectionLabel("workspace")).toBe("About your company");
    expect(sectionLabel("brief")).toBe("Brief and voice");
    expect(sectionLabel("autonomy")).toBe("What they may do without asking");
    // Founder ruling 2026-07-29 (commit 9900c049): "Sources is now Connectors,
    // in the nav label, the head and every line of prose."
    expect(sectionLabel("connections")).toBe("Connected tools");
    expect(sectionLabel("nope" as SectionId)).toBe("nope");
  });
});

describe("settings-sections - normalizeSection (deep-link safety)", () => {
  it("defaults to Profile when nothing is provided", () => {
    expect(normalizeSection(undefined)).toBe(DEFAULT_SECTION);
    expect(normalizeSection(null)).toBe(DEFAULT_SECTION);
    expect(normalizeSection("")).toBe(DEFAULT_SECTION);
    expect(DEFAULT_SECTION).toBe("profile");
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

  it("lands ?section=brief on the real Brief pane now, not folded into Workspace", () => {
    /*
     * P-23 CHANGED THIS ANSWER ON PURPOSE. `brief` used to fold into
     * `workspace` because there was no dedicated pane; there is one now, so
     * the same address landing somewhere MORE specific is the alias becoming
     * correct rather than a break. See settings-sections.ts's header, §3.
     */
    expect(normalizeSection("brief")).toBe("brief");
  });

  it("keeps legacy deep links landing (calendar -> connections)", () => {
    expect(normalizeSection("calendar")).toBe("connections");
    for (const target of Object.values(LEGACY_SECTION_MAP)) {
      expect(ORIGINAL_SECTION_IDS).toContain(target);
    }
  });

  it("?section=plan lands on Billing - the checkout redirect and account menu depend on it", () => {
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
    /*
     * `navTabStop` FALLS BACK TO THE GLOBAL FIRST DOOR, NOT THE OWNING
     * GROUP'S. Diagnostics draws no door and sets no `foldsInto`, so
     * `paneForSection` returns "health" itself, which is not in
     * `NAV_DOOR_IDS` - the function then falls back to `NAV_DOOR_IDS[0]`,
     * always Profile, regardless of which group the address is actually in.
     * True before P-23 (Profile happened to be Health's own group's first
     * door too) and unchanged after, though now less locally true: Health
     * moved to Usage, whose own first door is Billing, and a keyboard user
     * on `?section=health` still lands the tab stop on Profile rather than
     * Billing. Noted in the Report as a pre-existing simplification this
     * packet did not widen scope to fix.
     */
    expect(navTabStop("health")).toBe("profile");
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

  it("gives exactly one tab stop for every one of the 17 addresses", () => {
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
    /* Order since P-23: profile, notifications | staff, autonomy | brief |
       connections, ai, interop | workspace, brand, products | billing | data
       The pipes are group boundaries, and the ring must cross them without
       stopping. */
    expect(stepDoor("notifications", "ArrowDown")).toBe("staff");
    expect(stepDoor("staff", "ArrowUp")).toBe("notifications");
    expect(stepDoor("autonomy", "ArrowDown")).toBe("brief");
    expect(stepDoor("brief", "ArrowUp")).toBe("autonomy");
    expect(stepDoor("brief", "ArrowDown")).toBe("connections");
    /* Hosting sits after Outside access in Connections, so the step that used
       to cross into Workspace now lands on it first and crosses from there.
       The ring still crosses the boundary, which is what this asserts. */
    expect(stepDoor("interop", "ArrowDown")).toBe("hosting");
    expect(stepDoor("hosting", "ArrowDown")).toBe("workspace");
    expect(stepDoor("workspace", "ArrowUp")).toBe("hosting");
    expect(stepDoor("products", "ArrowDown")).toBe("billing");
    expect(stepDoor("billing", "ArrowDown")).toBe("data");
  });

  it("Down wraps at the end and Up wraps at the start", () => {
    expect(stepDoor("data", "ArrowDown")).toBe("profile");
    expect(stepDoor("profile", "ArrowUp")).toBe("data");
  });

  it("Home and End reach the ends from anywhere, which is the fix for the crawl", () => {
    for (const id of NAV_DOOR_IDS) {
      expect(stepDoor(id, "Home")).toBe("profile");
      expect(stepDoor(id, "End")).toBe("data");
    }
  });

  it("steps from a doorless section as if from the top, rather than nowhere", () => {
    expect(stepDoor("memory", "ArrowDown")).toBe(NAV_DOOR_IDS[1]);
  });

  it("walking Down through the whole ring visits all 13 doors exactly once", () => {
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

describe("settings-sections - typeahead, the shortcut into any of the thirteen", () => {
  it("jumps to the first door whose label starts with what you typed", () => {
    /*
     * TYPEAHEAD MATCHES THE LABEL, NEVER THE ID, and this pair is the clearest
     * demonstration of it: the section id is `data` and nothing reaches it with
     * "d", because a person reads "Your data". "y" reaches it instead - unchanged
     * by P-23, since neither label moved.
     *
     * "d" still reaches nothing: Diagnostics never drew a door and nothing else
     * in the new seven groups starts with D either.
     */
    expect(doorByTypeahead("y", "autonomy")).toBe("data");
    expect(doorByTypeahead("d", "autonomy")).toBeNull();
    expect(doorByTypeahead("a", "autonomy")).toBe("workspace");
    expect(doorByTypeahead("br", "autonomy")).toBe("brief");
    // Credits folded into Billing, so "cre" has no door of its own to reach.
    expect(doorByTypeahead("cre", "autonomy")).toBeNull();
  });

  it("a single repeated letter cycles through every door that starts with it", () => {
    // B: "Brief", "Brand", "Billing" - three now, up from the pair under four
    // groups, because Brief moved to its own group whose door is also a B.
    const first = doorByTypeahead("b", "autonomy");
    expect(first).toBe("brief");
    const second = doorByTypeahead("b", first!);
    expect(second).toBe("brand");
    const third = doorByTypeahead("b", second!);
    expect(third).toBe("billing");
    // Round again: the fourth press returns to the first door.
    expect(doorByTypeahead("b", third!)).toBe("brief");
  });

  it("a refining buffer is allowed to keep matching the door you are on", () => {
    // Typing "c" then "o" must not skip past Connectors just because focus already
    // got there on the "c".
    expect(doorByTypeahead("co", "connections")).toBe("connections");
  });

  it("returns null on a typo rather than jumping somewhere arbitrary", () => {
    expect(doorByTypeahead("zzz", "autonomy")).toBeNull();
    expect(doorByTypeahead("", "autonomy")).toBeNull();
    expect(doorByTypeahead("   ", "autonomy")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(doorByTypeahead("Y", "autonomy")).toBe("data");
    expect(doorByTypeahead("CO", "autonomy")).toBe("connections");
  });

  it("reaches every one of the 13 doors by its own full label", () => {
    // The claim "type a name" in the nav's hint is only true if it is true for
    // all of them.
    for (const id of NAV_DOOR_IDS) {
      expect(doorByTypeahead(sectionLabel(id), "autonomy")).toBe(id);
    }
  });
});
