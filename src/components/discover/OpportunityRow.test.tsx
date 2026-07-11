import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { PencilNote } from "@/components/obsidian";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  DesignationTag,
  OpportunityRow as OpportunityRowExport,
  OPPORTUNITY_STATUSES,
} from "./OpportunityRow";

// OpportunityRow is wrapped in React.memo; memo() returns an exotic object
// whose callable inner component lives on `.type`. Unwrap it so the shallow
// call-the-component technique below keeps working.
const OpportunityRow = (
  (OpportunityRowExport as unknown as { type?: (props: object) => ReactElement }).type ??
  OpportunityRowExport
) as (props: object) => ReactElement;

/** Depth-first search for a child whose `type` matches, walking `props.children`
 * without a DOM renderer — the codebase's established shallow-element
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
  test("designation 'best bet' renders the single lime PencilNote wink", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: "best bet" });
    expect(containsType(el, PencilNote)).toBe(true);
    // The best bet is the pencil, not a quiet tag: no DesignationTag on the card.
    expect(containsType(el, DesignationTag)).toBe(false);
  });

  test("a non-best designation renders a quiet tag, never a PencilNote", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: "needs validation" });
    expect(containsType(el, DesignationTag)).toBe(true);
    expect(containsType(el, PencilNote)).toBe(false);
  });

  test("no designation renders neither a PencilNote nor a tag", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: null });
    expect(containsType(el, PencilNote)).toBe(false);
    expect(containsType(el, DesignationTag)).toBe(false);
    // Same when the prop is omitted entirely.
    const bare = OpportunityRow({ ...BASE_PROPS });
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

  test("renders nothing for the best bet (that is the pencil) or no designation", () => {
    expect(DesignationTag({ designation: "best bet" })).toBe(null);
    expect(DesignationTag({ designation: null })).toBe(null);
    expect(DesignationTag({})).toBe(null);
  });
});

// OBS-10: the write-action overflow menu ported from the retired /product
// Opportunities tab. Every handler is optional so the row degrades cleanly
// (e.g. a read-only embed) when none are passed — verify that degradation,
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
