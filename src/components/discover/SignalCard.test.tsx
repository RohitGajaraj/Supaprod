import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SignalCard as SignalCardExport } from "./SignalCard";

// SignalCard is wrapped in React.memo; memo() returns an exotic object whose
// callable inner component lives on `.type`. Unwrap it so the shallow
// call-the-component technique below keeps working.
const SignalCard = ((SignalCardExport as unknown as { type?: (props: object) => ReactElement })
  .type ?? SignalCardExport) as (props: object) => ReactElement;

/** Depth-first search for a child whose `type` matches, walking `props.children`
 * without a DOM renderer, the codebase's established shallow-element
 * technique (see OpportunityRow.test.tsx / src/components/obsidian/__tests__/primitives.test.tsx). */
function containsType(node: unknown, type: unknown): boolean {
  if (node == null || typeof node !== "object") return false;
  const el = node as ReactElement;
  if (el.type === type) return true;
  const children = (el.props as { children?: unknown })?.children;
  if (Array.isArray(children)) return children.some((c) => containsType(c, type));
  return containsType(children, type);
}

const BASE_PROPS = {
  src: "INTERCOM",
  when: "3H AGO",
  quote: "A verbatim quote.",
  theme: null,
};

// OBS-10: the write-action overflow menu ported from the retired /product
// Signals tab. Every handler is optional so a read-only embed degrades
// cleanly with no menu at all, verify that degradation, not just the
// fully-wired case.
describe("SignalCard write-action overflow", () => {
  test("renders no action menu when every handler is omitted", () => {
    const el = SignalCard(BASE_PROPS);
    expect(containsType(el, DropdownMenu)).toBe(false);
  });

  test("renders the action menu when at least one handler is passed", () => {
    const el = SignalCard({ ...BASE_PROPS, onDelete: () => {} });
    expect(containsType(el, DropdownMenu)).toBe(true);
  });

  test("still renders the action menu with only onPromote passed", () => {
    const el = SignalCard({ ...BASE_PROPS, onPromote: () => {} });
    expect(containsType(el, DropdownMenu)).toBe(true);
  });
});
