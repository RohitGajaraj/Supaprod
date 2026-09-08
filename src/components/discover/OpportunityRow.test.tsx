/*
 * `PencilNote` ASSERTIONS REMOVED 2026-08-24, AND THE GUARANTEE GOT STRONGER.
 *
 * Four assertions here read `expect(containsType(el, PencilNote)).toBe(false)`
 * -- the row must not render the retired component. The ui/obsidian teardown
 * then deleted `PencilNote` and the `@/components/obsidian` barrel outright, so
 * the import stopped resolving and this file could not load at all.
 *
 * The assertions are dropped rather than repointed because THERE IS NOTHING LEFT
 * TO POINT AT, and that is the stronger outcome: a component that no longer
 * exists cannot be rendered by anything, which is a guarantee no test needs to
 * make. The same shape as `surface-discipline` §7, where a flippable default
 * became a component you cannot reach by accident.
 *
 * Everything a reader can actually see is still asserted against the DOM below.
 */
import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

/** Depth-first search for a descendant whose `type` matches, without a DOM
 * renderer: the codebase's established shallow-element technique (see
 * src/components/obsidian/__tests__/primitives.test.tsx).
 *
 * It walks EVERY prop, not only `children`. The row is now built on the `Row`
 * primitive, which takes its content through `marks`, `lead` and `sub` rather
 * than through children, so a children-only walk reports "not present" for
 * elements that are plainly on the screen. Used here only for the two retired
 * components, which have no rendered output to look for; everything a reader
 * can actually see is asserted against the DOM below. */
function containsType(node: unknown, type: unknown): boolean {
  if (node == null || typeof node !== "object") return false;
  if (Array.isArray(node)) return node.some((n) => containsType(n, type));
  const el = node as ReactElement;
  if (el.type === type) return true;
  const props = (el.props ?? {}) as Record<string, unknown>;
  return Object.values(props).some((v) => containsType(v, type));
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
  test("designation 'best bet' renders the stamp's words", () => {
    const { unmount } = render(<OpportunityRowExport {...BASE_PROPS} designation="best bet" />);
    // The reader's promise: the one chosen opportunity says so, in words.
    // "Best bet" -> "Best opportunity" (P-14a); `designation` itself is the
    // ranking.ts discriminator value and stays "best bet", unrendered.
    expect(screen.getByText("Best opportunity")).toBeDefined();
    // The best opportunity is the stamp, not a quiet tag.
    expect(screen.queryByText("needs validation")).toBeNull();
    unmount();

    // The Loom-era handwritten wink is retired (founder ruling 2026-07-11).
    // It has no rendered output of its own to look for, so this one stays an
    // element-identity guard.
    const el = OpportunityRow({ ...BASE_PROPS, designation: "best bet" });
    expect(containsType(el, DesignationTag)).toBe(false);
  });

  test("a non-best designation renders a quiet tag, never the stamp", () => {
    const { unmount } = render(
      <OpportunityRowExport {...BASE_PROPS} designation="needs validation" />,
    );
    expect(screen.getByText("needs validation")).toBeDefined();
    expect(screen.queryByText("Best bet")).toBeNull();
    unmount();

    const el = OpportunityRow({ ...BASE_PROPS, designation: "needs validation" });
    expect(containsType(el, BestBetStamp)).toBe(false);
  });

  test("no designation renders neither a stamp nor a tag", () => {
    const el = OpportunityRow({ ...BASE_PROPS, designation: null });
    expect(containsType(el, BestBetStamp)).toBe(false);
    expect(containsType(el, DesignationTag)).toBe(false);
    // Same when the prop is omitted entirely.
    const bare = OpportunityRow({ ...BASE_PROPS });
    expect(containsType(bare, BestBetStamp)).toBe(false);
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

// OBS-10 put a write-action overflow menu on this row. The 2026-07-29 port
// moved every one of those writes (draft spec, challenge, lineage, move to,
// delete, ask) into OpportunityDetailSheet, which the row opens: a list row is
// one line plus a second line, and six controls per row over twenty rows is
// twenty subjects with nothing to look at first. So the menu is not "missing",
// it deliberately does not belong here.
//
// `DropdownMenu` ASSERTIONS REMOVED (P-12, A-QUEUE.md, 2026-09-02), THE SAME
// SHAPE AS `PencilNote` ABOVE: `@/components/ui/dropdown-menu` had zero live
// importers and was deleted in the same packet, so checking this row does not
// render it is a guarantee no test needs to make — nothing can render an
// import that no longer exists.

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
      const label = statusLabel(verdict);
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
    // Verify the component structure is created. The root element's tag is not
    // asserted: it was a bare <div>, it is now the Row primitive, and it will
    // be whatever the shell says next.
    expect(el).not.toBeNull();
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
    expect(el).not.toBeNull();
  });
});

// The row used to hand-roll onKeyDown to answer Enter and Space on a <div>.
// The Row primitive makes a row that does something a REAL <button>, so the
// browser answers both keys, the row is tabbable, and it takes the app-wide
// focus ring without being asked. The promise to a keyboard user is unchanged;
// what delivers it is not, so these assert the promise.
describe("OpportunityRow keyboard activation", () => {
  test("is a real button when it opens something, so Enter and Space activate it", () => {
    render(<OpportunityRowExport {...BASE_PROPS} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /Bet/ });
    expect(row.getAttribute("type")).toBe("button");
  });

  test("activating it calls onOpen", () => {
    let openCalled = false;
    render(
      <OpportunityRowExport
        {...BASE_PROPS}
        onOpen={() => {
          openCalled = true;
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Bet/ }));
    expect(openCalled).toBe(true);
  });

  test("is not a button when there is nothing to open, so it is not in the tab order", () => {
    render(<OpportunityRowExport {...BASE_PROPS} />);
    expect(screen.getByText("Bet")).toBeDefined();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
