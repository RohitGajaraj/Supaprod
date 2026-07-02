import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { PencilNote } from "@/components/obsidian";
import { OpportunityRow } from "./OpportunityRow";

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

describe("OpportunityRow pencil", () => {
  test("renders a PencilNote when hasPencil is true", () => {
    const el = OpportunityRow({ ...BASE_PROPS, hasPencil: true });
    expect(containsType(el, PencilNote)).toBe(true);
  });

  test("renders no PencilNote when hasPencil is false", () => {
    const el = OpportunityRow({ ...BASE_PROPS, hasPencil: false });
    expect(containsType(el, PencilNote)).toBe(false);
  });
});
