import { describe, it, expect } from "bun:test";
import {
  SETTINGS_GROUPS,
  ALL_SECTION_IDS,
  PRIMARY_GROUPS,
  RECESSED_GROUPS,
  LEGACY_SECTION_MAP,
  DEFAULT_SECTION,
  normalizeSection,
  groupForSection,
  findGroup,
  primarySection,
  sectionLabel,
  type SectionId,
} from "./settings-sections";

/**
 * SETTINGS-SEGREGATE (v11 #13) -> OBS-13 - the grouping must collapse 12 flat
 * tabs into exactly four calm panes (You · Workspace · Connections · Plan)
 * WITHOUT breaking the `?section=` deep-link contract. These tests lock both:
 * the structural invariants of the four-pane model AND that every one of the
 * 12 section ids is still reachable and unchanged. "products" (the ported
 * PortfolioBoard, OBS-10) joined the Workspace pane after the original 11.
 */

// The 12 section ids the route ships with - the routing contract that must hold.
const ORIGINAL_SECTION_IDS: SectionId[] = [
  "connections",
  "ai",
  "staff",
  "workspace",
  "products",
  "billing",
  "credits",
  "interop",
  "profile",
  "health",
  "data",
  "notifications",
];

describe("settings-sections - the routing contract is preserved", () => {
  it("exposes exactly the 12 section ids (no id added or dropped)", () => {
    expect([...ALL_SECTION_IDS].sort()).toEqual([...ORIGINAL_SECTION_IDS].sort());
  });

  it("has no duplicate section id across panes", () => {
    expect(new Set(ALL_SECTION_IDS).size).toBe(ALL_SECTION_IDS.length);
  });

  it("every section belongs to exactly one pane", () => {
    for (const id of ORIGINAL_SECTION_IDS) {
      const owning = SETTINGS_GROUPS.filter((g) => g.sections.some((s) => s.id === id));
      expect(owning.length).toBe(1);
    }
  });
});

describe("settings-sections - four-pane shape", () => {
  it("collapses to exactly four panes, none recessed", () => {
    expect(SETTINGS_GROUPS.length).toBe(4);
    expect(PRIMARY_GROUPS.length).toBe(4);
    expect(RECESSED_GROUPS.length).toBe(0);
  });

  it("the four panes are You, Workspace, Connections, Plan in that order", () => {
    expect(SETTINGS_GROUPS.map((g) => g.id)).toEqual(["you", "workspace", "connections", "plan"]);
  });

  it("every pane has a label, a one-line desc, and at least one section", () => {
    for (const g of SETTINGS_GROUPS) {
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.desc.length).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("the 3-places-to-connect confusion is consolidated: Yours + This workspace's live in one pane", () => {
    expect(groupForSection("connections")).toBe("connections");
    expect(groupForSection("interop")).toBe("connections");
  });

  it("health and data (the old recessed Advanced group) now live in You", () => {
    expect(groupForSection("health")).toBe("you");
    expect(groupForSection("data")).toBe("you");
  });

  it("AI & keys lives in Workspace, not its own pane", () => {
    expect(groupForSection("ai")).toBe("workspace");
  });

  it("Products (OBS-10, /product's PortfolioBoard) lives in Workspace, not a fifth pane", () => {
    expect(groupForSection("products")).toBe("workspace");
  });
});

describe("settings-sections - derivations", () => {
  it("groupForSection round-trips with primarySection for all four panes", () => {
    for (const g of SETTINGS_GROUPS) {
      const primary = primarySection(g.id);
      expect(groupForSection(primary)).toBe(g.id);
      // the primary is the pane's first member
      expect(primary).toBe(g.sections[0]!.id);
    }
  });

  it("You is primary and lands on profile", () => {
    expect(primarySection("you")).toBe("profile");
  });

  it("primarySection falls back to DEFAULT_SECTION for an unknown pane", () => {
    // @ts-expect-error - exercising the runtime guard with a bad id
    expect(primarySection("nope")).toBe(DEFAULT_SECTION);
  });

  it("findGroup returns the definition, or undefined when unknown", () => {
    expect(findGroup("plan")?.label).toBe("Billing");
    // @ts-expect-error - unknown id
    expect(findGroup("nope")).toBeUndefined();
  });

  it("sectionLabel maps ids to human labels and de-jargons Models/Staff", () => {
    expect(sectionLabel("ai")).toBe("AI & keys");
    expect(sectionLabel("workspace")).toBe("Brief & voice");
    expect(sectionLabel("connections")).toBe("Sources");
    // unknown id falls back to itself
    expect(sectionLabel("nope" as SectionId)).toBe("nope");
  });
});

describe("settings-sections - normalizeSection (deep-link safety)", () => {
  it("defaults to profile (You) when nothing is provided", () => {
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

  it("keeps legacy deep links landing (brief -> workspace, calendar -> connections)", () => {
    expect(normalizeSection("brief")).toBe("workspace");
    expect(normalizeSection("calendar")).toBe("connections");
    // every legacy alias resolves to a real section
    for (const target of Object.values(LEGACY_SECTION_MAP)) {
      expect(ORIGINAL_SECTION_IDS).toContain(target);
    }
  });

  it("resolves every pane id to that pane's landing section (?section=plan must land on Plan)", () => {
    expect(normalizeSection("plan")).toBe("billing");
    expect(normalizeSection("you")).toBe("profile");
    // pane ids that double as section ids already pass through
    expect(normalizeSection("workspace")).toBe("workspace");
    expect(normalizeSection("connections")).toBe("connections");
    // full invariant: every GroupId lands inside its own pane
    for (const g of SETTINGS_GROUPS) {
      expect(groupForSection(normalizeSection(g.id))).toBe(g.id);
    }
  });

  it("falls back to the default for an unknown section value", () => {
    expect(normalizeSection("totally-made-up")).toBe(DEFAULT_SECTION);
  });
});
