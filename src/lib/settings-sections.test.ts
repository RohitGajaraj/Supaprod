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
 * SETTINGS-SEGREGATE -> front-end reimagining Phase 4 - the grouping presents
 * the 13 flat sections as exactly FIVE named groups (You · Workspace · Agents ·
 * Connections & Data · Plan & Usage) WITHOUT breaking the `?section=` deep-link
 * contract. These tests lock both: the structural invariants of the five-group
 * model AND that every one of the 13 section ids is still reachable and
 * unchanged. Agents is promoted to its own group (charter requirement 9).
 */

// The 13 section ids the route ships with - the routing contract that must
// hold. "memory" joined in the final sweep (the Memory view, architecture
// section on Settings; ledger phase 3).
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

describe("settings-sections - five-group shape", () => {
  it("presents exactly five groups, none recessed", () => {
    expect(SETTINGS_GROUPS.length).toBe(5);
    expect(PRIMARY_GROUPS.length).toBe(5);
    expect(RECESSED_GROUPS.length).toBe(0);
  });

  it("the five groups are You, Workspace, Agents, Connections & Data, Plan & Usage in order", () => {
    expect(SETTINGS_GROUPS.map((g) => g.id)).toEqual([
      "you",
      "workspace",
      "agents",
      "connections",
      "plan",
    ]);
  });

  it("every group has a label, a one-line desc, and at least one section", () => {
    for (const g of SETTINGS_GROUPS) {
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.desc.length).toBeGreaterThan(0);
      expect(g.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("Connections & Data holds Sources, Agent access, and Your data", () => {
    expect(groupForSection("connections")).toBe("connections");
    expect(groupForSection("interop")).toBe("connections");
    expect(groupForSection("data")).toBe("connections");
  });

  it("Diagnostics lives in Plan & Usage (system health + cost, one neighborhood)", () => {
    expect(groupForSection("health")).toBe("plan");
  });

  it("Agents is its own group: Roster (staff), Autonomy & approvals, and Models & keys (ai) live there", () => {
    expect(groupForSection("staff")).toBe("agents");
    expect(groupForSection("autonomy")).toBe("agents");
    expect(groupForSection("ai")).toBe("agents");
  });

  it("Products (OBS-10, /product's PortfolioBoard) still lives in Workspace", () => {
    expect(groupForSection("products")).toBe("workspace");
  });
});

describe("settings-sections - derivations", () => {
  it("groupForSection round-trips with primarySection for all five groups", () => {
    for (const g of SETTINGS_GROUPS) {
      const primary = primarySection(g.id);
      expect(groupForSection(primary)).toBe(g.id);
      // the primary is the group's first member
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
    expect(findGroup("plan")?.label).toBe("Plan & Usage");
    // @ts-expect-error - unknown id
    expect(findGroup("nope")).toBeUndefined();
  });

  it("sectionLabel maps ids to human labels and de-jargons Models/Staff", () => {
    expect(sectionLabel("ai")).toBe("Models & keys");
    expect(sectionLabel("staff")).toBe("Roster");
    expect(sectionLabel("workspace")).toBe("Brief & voice");
    // Founder ruling 2026-07-29 (commit 9900c049): "Sources is now Connectors,
    // in the nav label, the head and every line of prose."
    expect(sectionLabel("connections")).toBe("Connectors");
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
