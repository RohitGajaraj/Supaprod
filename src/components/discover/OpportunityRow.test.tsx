import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { PencilNote } from "@/components/obsidian";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  BestBetStamp,
  DesignationTag,
  OpportunityRow as OpportunityRowExport,
  OPPORTUNITY_STATUSES,
  statusLabel,
} from "./OpportunityRow";

// OpportunityRow is wrapped in React.memo; memo() returns an exotic object
// whose callable inner component lives on `.type`. Unwrap it so the shallow
// call-the-component technique below keeps working.
const OpportunityRow = ((
  OpportunityRowExport as unknown as { type?: (props: object) => ReactElement }
).type ?? OpportunityRowExport) as (props: object) => ReactElement;

/** Depth-first search for a child whose `type` matches, walking `props.children`
 * without a DOM renderer, the codebase's established shallow-element
 * technique (see src/components/obsidian/__tests__/primitives.test.tsx). */
function containsType(node: unknown, type: unknown): boolean {
  if (node == null || typeof node !== "object") return false;
  const el = node as ReactElement;
  if (el.type === type) return true;
  const children = (el.props as { children?: unknown })?.children;
  if (Array.isArray(children)) return children.some((c) => containsType(c, type));
  return containsType(children, type);
}

const BASE_PROPS = {
  ice: 8.4,
  title: "Bet",
  sub: "Sub line",
  verdict: "PENDING" as const,
  onChallenge: () => {},
  challengePending: false,
};

describe("OpportunityRow designation marker", () => {
  test("designation 'best bet' renders the inline BestBetStamp, never the retired PencilNote", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: "best bet" });
    expect(containsType(el, BestBetStamp)).toBe(true);
    // The Loom-era handwritten wink is retired (founder ruling 2026-07-11).
    expect(containsType(el, PencilNote)).toBe(false);
    // The best bet is the stamp, not a quiet tag: no DesignationTag on the card.
    expect(containsType(el, DesignationTag)).toBe(false);
  });

  test("a non-best designation renders a quiet tag, never the stamp", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: "needs validation" });
    expect(containsType(el, DesignationTag)).toBe(true);
    expect(containsType(el, BestBetStamp)).toBe(false);
    expect(containsType(el, PencilNote)).toBe(false);
  });

  test("no designation renders neither a stamp nor a tag", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: null });
    expect(containsType(el, BestBetStamp)).toBe(false);
    expect(containsType(el, PencilNote)).toBe(false);
    expect(containsType(el, DesignationTag)).toBe(false);
    // Same when the prop is omitted entirely.
    const bare = OpportunityRow({ ...BASE_PROPS });
    expect(containsType(bare, BestBetStamp)).toBe(false);
    expect(containsType(bare, PencilNote)).toBe(false);
    expect(containsType(bare, DesignationTag)).toBe(false);
  });
});

describe("DesignationTag", () => {
  test("renders a tag element for each non-best designation", () => {
    expect(DesignationTag({ designation: "needs validation" })).not.toBe(null);
    expect(DesignationTag({ designation: "quick win" })).not.toBe(null);
    expect(DesignationTag({ designation: "heavy lift" })).not.toBe(null);
    expect(DesignationTag({ designation: "watch this week" })).not.toBe(null);
  });

  test("renders nothing for the best bet (that is the stamp) or no designation", () => {
    expect(DesignationTag({ designation: "best bet" })).toBe(null);
    expect(DesignationTag({ designation: null })).toBe(null);
    expect(DesignationTag({})).toBe(null);
  });
});

// OBS-10: the write-action overflow menu ported from the retired /product
// Opportunities tab. Every handler is optional so the row degrades cleanly
// (e.g. a read-only embed) when none are passed, verify that degradation,
// not just the fully-wired case.
describe("OpportunityRow write-action overflow", () => {
  test("renders no action menu when every handler is omitted", () => {
    const el = OpportunityRow({ ...BASE_PROPS });
    expect(containsType(el, DropdownMenu)).toBe(false);
  });

  test("renders the action menu when at least one handler is passed", () => {
    const el = OpportunityRow({ ...BASE_PROPS, onDelete: () => {} });
    expect(containsType(el, DropdownMenu)).toBe(true);
  });

  test("still renders the action menu with only onLineage passed", () => {
    const el = OpportunityRow({ ...BASE_PROPS, onLineage: () => {} });
    expect(containsType(el, DropdownMenu)).toBe(true);
  });
});

describe("OPPORTUNITY_STATUSES", () => {
  test("is the six lanes the server fn's status enum accepts, in board order", () => {
    expect(OPPORTUNITY_STATUSES).toEqual(["backlog", "now", "next", "later", "shipped", "dropped"]);
  });
});

describe("statusLabel pure function", () => {
  test("statusLabel maps PENDING verdict", () => {
    const label = statusLabel("PENDING");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  test("statusLabel maps SHIP verdict", () => {
    const label = statusLabel("SHIP");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  test("statusLabel maps REVISE verdict", () => {
    const label = statusLabel("REVISE");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  test("statusLabel returns non-empty string for all known verdicts", () => {
    const verdicts = ["PENDING", "SHIP", "REVISE"];
    verdicts.forEach((verdict) => {
      const label = statusLabel(verdict as unknown as any);
      expect(typeof label).toBe("string");
      expect(label.trim().length).toBeGreaterThan(0);
    });
  });
});

describe("OpportunityRow verdict rendering", () => {
  test("renders with PENDING verdict", () => {
    const el = OpportunityRow({ ...BASE_PROPS, verdict: "PENDING" });
    expect(el).not.toBeNull();
  });

  test("renders with SHIP verdict", () => {
    const el = OpportunityRow({ ...BASE_PROPS, verdict: "SHIP" });
    expect(el).not.toBeNull();
  });

  test("renders with REVISE verdict", () => {
    const el = OpportunityRow({ ...BASE_PROPS, verdict: "REVISE" });
    expect(el).not.toBeNull();
  });
});

describe("OpportunityRow challenge action", () => {
  test("includes onChallenge handler in props", () => {
    const mockHandler = () => {};
    const el = OpportunityRow({ ...BASE_PROPS, onChallenge: mockHandler });
    // Verify the component structure is created
    expect(el).not.toBeNull();
    expect(el.type).toBe("div");
  });

  test("respects challengePending flag", () => {
    const el = OpportunityRow({ ...BASE_PROPS, challengePending: true });
    expect(el).not.toBeNull();
  });
});

describe("OpportunityRow optional handlers", () => {
  test("accepts onPromote handler", () => {
    const el = OpportunityRow({ ...BASE_PROPS, onPromote: () => {} });
    expect(el).not.toBeNull();
  });

  test("accepts onLineage handler", () => {
    const el = OpportunityRow({ ...BASE_PROPS, onLineage: () => {} });
    expect(el).not.toBeNull();
  });

  test("accepts multiple handlers simultaneously", () => {
    const el = OpportunityRow({
      ...BASE_PROPS,
      onPromote: () => {},
      onLineage: () => {},
      onDelete: () => {},
    });
    expect(containsType(el, DropdownMenu)).toBe(true);
  });
});
