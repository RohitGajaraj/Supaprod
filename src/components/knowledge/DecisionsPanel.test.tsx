import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { ReactElement } from "react";
import { DecisionsPanel, SourceLink, OBS_STATUS_TONE } from "./DecisionsPanel";
import type { DecisionRow } from "@/lib/decisions.functions";

/**
 * ★ CRITICAL GAP: Testing useQuery + useMutation data-fetching component
 *
 * DecisionsPanel is the first component in the codebase to test a useQuery-backed
 * panel that also uses useMutation. This establishes the mock.module pattern for
 * testing async data-fetching components without a DOM renderer.
 *
 * DEPENDENCIES: bun:test + @tanstack/react-query + @tanstack/react-start
 *
 * SETUP: Mock useQuery to return controlled data states (pending/error/success).
 * Each test provides a query state and verifies the component renders correctly.
 */

describe("SourceLink", () => {
  test("renders Link to mission when mission_id is present", () => {
    const decision: DecisionRow = {
      id: "dec-1",
      title: "Test decision",
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: "mission-abc",
      prd_id: null,
      source_kind: "mission",
      source_label: "Mission ABC",
      rationale: null,
    };

    const el = SourceLink({
      d: decision,
      children: "Test Link",
    });

    // Verify Link component is rendered to the mission route
    expect((el?.props as { to?: string })?.to).toBe("/build/$missionId");
    expect((el?.props as { params?: { missionId: string } })?.params?.missionId).toBe(
      "mission-abc",
    );
  });

  test("renders Link to PRD when prd_id is present (and mission_id is null)", () => {
    const decision: DecisionRow = {
      id: "dec-2",
      title: "Spec decision",
      status: "approved",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: null,
      prd_id: "prd-xyz",
      source_kind: "prd",
      source_label: "Spec XYZ",
      rationale: "Why this spec matters",
    };

    const el = SourceLink({
      d: decision,
      children: "Spec Link",
    });

    expect((el?.props as { to?: string })?.to).toBe("/plan/spec/$id");
    expect((el?.props as { params?: { id: string } })?.params?.id).toBe("prd-xyz");
  });

  test("prioritizes mission_id over prd_id when both are present", () => {
    const decision: DecisionRow = {
      id: "dec-3",
      title: "Dual source",
      status: "rejected",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: "mission-1",
      prd_id: "prd-1",
      source_kind: "mission",
      source_label: "Mission",
      rationale: null,
    };

    const el = SourceLink({
      d: decision,
      children: "Dual Link",
    });

    // Mission takes precedence
    expect((el?.props as { to?: string })?.to).toBe("/build/$missionId");
  });

  test("renders null when neither mission_id nor prd_id is present (meeting-sourced)", () => {
    const decision: DecisionRow = {
      id: "dec-4",
      title: "Meeting decision",
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: null,
      prd_id: null,
      source_kind: "meeting",
      source_label: "Design Sync",
      rationale: null,
    };

    const el = SourceLink({
      d: decision,
      children: "Meeting Link",
    });

    expect(el).toBeNull();
  });

  test("applies className and style props to Link", () => {
    const decision: DecisionRow = {
      id: "dec-5",
      title: "Styled decision",
      status: "approved",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: "mission-styled",
      prd_id: null,
      source_kind: "mission",
      source_label: "Styled Mission",
      rationale: null,
    };

    const el = SourceLink({
      d: decision,
      className: "custom-class",
      style: { color: "red" },
      children: "Styled Link",
    });

    expect((el?.props as { className?: string })?.className).toBe("custom-class");
    expect((el?.props as { style?: Record<string, unknown> })?.style?.color).toBe("red");
  });

  test("passes onClick handler to Link", () => {
    const decision: DecisionRow = {
      id: "dec-6",
      title: "Clickable decision",
      status: "pending",
      created_at: new Date().toISOString(),
      decided_by_agent_slug: null,
      mission_id: "mission-click",
      prd_id: null,
      source_kind: "mission",
      source_label: "Mission",
      rationale: null,
    };

    const handleClick = mock(() => {});
    const el = SourceLink({
      d: decision,
      onClick: handleClick as any,
      children: "Clickable Link",
    });

    expect((el?.props as { onClick?: unknown })?.onClick).toBeDefined();
  });
});

describe("OBS_STATUS_TONE mapping", () => {
  test("maps approved status to KEPT tone", () => {
    expect(OBS_STATUS_TONE.approved).toBe("KEPT");
  });

  test("maps rejected status to KILL tone", () => {
    expect(OBS_STATUS_TONE.rejected).toBe("KILL");
  });

  test("maps pending status to PENDING tone", () => {
    expect(OBS_STATUS_TONE.pending).toBe("PENDING");
  });

  test("contains exactly three entries", () => {
    expect(Object.keys(OBS_STATUS_TONE)).toHaveLength(3);
  });
});

describe("DecisionsPanel data states", () => {
  /**
   * NOTE: Full DecisionsPanel testing requires mocking:
   * - @tanstack/react-query useQuery hook
   * - @tanstack/react-start useServerFn hook
   * - TanStack Router useNavigate hook
   *
   * These are complex dependencies without established test patterns in this
   * codebase. The shallow-element technique (used in SignalCard/OpportunityRow
   * tests) cannot extract useQuery state from React hooks.
   *
   * SOLUTION: Use mock.module to intercept useQuery and useServerFn at import
   * time, returning controlled data.
   *
   * DEPENDENCIES FOR IMPLEMENTATION:
   * - Mock useQuery to return { isLoading, isError, data, refetch }
   * - Mock useServerFn to return a mock function
   * - Mock useNavigate to capture calls
   * - Render DecisionsPanel and verify output state (loading/error/empty/success)
   *
   * ESTIMATED TESTS (not yet implemented):
   * - renders PanelSkeleton when isLoading
   * - renders error card with message when isError
   * - renders empty state when rows are empty
   * - renders decision rows when data is present
   * - invokes create mutation when form is submitted
   * - filters by source (meeting/mission/prd/manual)
   * - filters by status (pending/approved/rejected)
   * - debounces search input
   * - shows "Show more" button when rows > VISIBLE_DECISIONS (8)
   * - collapses when "Show fewer" is clicked
   * - navigates to detail on row click
   * - navigates to Today when "Decide on Today" link is clicked (pending only)
   */

  test.todo("renders PanelSkeleton when decisions.isLoading is true");
  test.todo("renders error card when decisions.isError is true");
  test.todo("renders error card with decisions.refetch() button for user retry");
  test.todo("renders empty state when decisions.data.decisions is empty array");
  test.todo("renders decision rows when data.decisions has items");
  test.todo("renders table header with columns: Decision, Made by, When, Why");
  test.todo("renders VerdictChip with status-mapped tone for each row");
  test.todo("renders AutoChip when decision title is auto-generated (via isAutoTitle)");
  test.todo("navigates to detail (tab=decisions, decision=id) on row click");
  test.todo("renders 'Decide on Today' link for pending status (one-home law)");
  test.todo("does not render 'Decide on Today' for approved/rejected status");
  test.todo("changes source filter on button click");
  test.todo("changes status filter on button click");
  test.todo("debounces search input (275ms) before firing listDecisions query");
  test.todo("shows 'Show N more' button when rows.length > VISIBLE_DECISIONS (8)");
  test.todo("shows only first 8 rows by default");
  test.todo("shows all rows when showAll is true");
  test.todo("toggles to 'Show fewer' when all rows are visible");
  test.todo("opens LogDecisionDialog when 'Log decision' button is clicked");
  test.todo("invokes create mutation on dialog submit");
  test.todo("invalidates decisions query on successful create (refetch trigger)");
  test.todo("shows success toast on create mutation success (via toast.success)");
  test.todo("shows error toast on create mutation error (via toast.error)");
  test.todo("disables dialog buttons while create.isPending is true");
  test.todo("closes dialog on successful create");
  test.todo("clears title and rationale on dialog close");
  test.todo("combines all filters (source + status + search) in query");
});

describe("LogDecisionDialog", () => {
  test.todo("renders DialogHeader with title 'Log decision'");
  test.todo("renders DialogDescription with context about capturing decisions");
  test.todo("has title input with placeholder 'What was decided?'");
  test.todo("has rationale textarea with placeholder 'Why this, and not the alternative.'");
  test.todo("title input maxLength is 280 characters");
  test.todo("rationale textarea maxLength is 2000 characters");
  test.todo("title input is autofocused on open");
  test.todo("disables submit button when title is empty or whitespace");
  test.todo("enables submit button when title has content");
  test.todo("invokes onSubmit with trimmed title and rationale");
  test.todo("displays 'Logging…' while submitting is true");
  test.todo("disables all buttons while submitting is true");
  test.todo("closes dialog when Cancel is clicked");
  test.todo("clears form when dialog closes (onOpenChange(false))");
});
