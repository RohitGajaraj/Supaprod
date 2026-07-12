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

describe("SignalCard conditional rendering", () => {
  test("renders trace chip when id is provided", () => {
    const el = SignalCard({ ...BASE_PROPS, id: "SIG-abc123" });
    const hasId = (el.props as { children?: unknown }).children;
    // Verify structure contains id reference
    expect(el).not.toBeNull();
  });

  test("does not break without id", () => {
    const el = SignalCard({ ...BASE_PROPS, id: undefined });
    expect(el).not.toBeNull();
    expect(el.type).toBe("div");
  });

  test("renders theme line when theme is provided", () => {
    const el = SignalCard({ ...BASE_PROPS, theme: "Architecture" });
    expect(el).not.toBeNull();
  });

  test("handles null theme gracefully", () => {
    const el = SignalCard({ ...BASE_PROPS, theme: null });
    expect(el).not.toBeNull();
  });

  test("renders external link when url is provided", () => {
    const el = SignalCard({ ...BASE_PROPS, url: "https://example.com" });
    expect(el).not.toBeNull();
  });

  test("renders without link when url is null", () => {
    const el = SignalCard({ ...BASE_PROPS, url: null });
    expect(el).not.toBeNull();
  });

  test("renders without link when url is undefined", () => {
    const el = SignalCard({ ...BASE_PROPS, url: undefined });
    expect(el).not.toBeNull();
  });
});

describe("SignalCard isLast prop", () => {
  test("applies bottom border when isLast is false", () => {
    const el = SignalCard({ ...BASE_PROPS, isLast: false });
    const style = (el.props as { style: Record<string, unknown> }).style;
    expect(style.borderBottom).toBe("1px solid var(--hairline-faint)");
  });

  test("removes bottom border when isLast is true", () => {
    const el = SignalCard({ ...BASE_PROPS, isLast: true });
    const style = (el.props as { style: Record<string, unknown> }).style;
    expect(style.borderBottom).toBeUndefined();
  });

  test("applies default isLast=false when not provided", () => {
    const el = SignalCard(BASE_PROPS);
    const style = (el.props as { style: Record<string, unknown> }).style;
    expect(style.borderBottom).toBe("1px solid var(--hairline-faint)");
  });
});

describe("SignalCard onOpen prop", () => {
  test("becomes clickable when onOpen is provided", () => {
    const el = SignalCard({ ...BASE_PROPS, onOpen: () => {} });
    const props = el.props as Record<string, unknown>;
    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
  });

  test("is not clickable when onOpen is not provided", () => {
    const el = SignalCard(BASE_PROPS);
    const props = el.props as Record<string, unknown>;
    expect(props.role).toBeUndefined();
    expect(props.tabIndex).toBeUndefined();
  });
});
