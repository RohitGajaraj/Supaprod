import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { ReactElement } from "react";
import { DecisionsPanel, SourceLink } from "./DecisionsPanel";
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

/**
 * A COMPLETE `DecisionRow`, with the fields each test is about overridden.
 *
 * The six fixtures below were hand-built literals missing `meeting_id` and
 * `snapshot_before`, so none of them was the shape `listDecisions` returns.
 * They typechecked nowhere until `bun run typecheck:tests` existed, and bun
 * strips types without resolving them.
 *
 * Same factory as decisions-shared.test.ts, for the same reason: padding six
 * literals with two fields nobody is testing buries the one or two that each
 * test is actually about.
 */
function row(over: Partial<DecisionRow> = {}): DecisionRow {
  return {
    id: "dec-1",
    title: "Test decision",
    rationale: null,
    status: "pending",
    source_kind: "mission",
    source_label: "Mission ABC",
    snapshot_before: null,
    mission_id: null,
    prd_id: null,
    meeting_id: null,
    created_at: new Date().toISOString(),
    decided_by_agent_slug: null,
    ...over,
  } as DecisionRow;
}

describe("SourceLink", () => {
  test("renders Link to mission when mission_id is present", () => {
    const decision: DecisionRow = row({
      status: "pending",
      decided_by_agent_slug: null,
      mission_id: "mission-abc",
      prd_id: null,
      source_kind: "mission",
      source_label: "Mission ABC",
      rationale: null,
    });

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
    const decision: DecisionRow = row({
      status: "approved",
      decided_by_agent_slug: null,
      mission_id: null,
      prd_id: "prd-xyz",
      source_kind: "prd",
      source_label: "Spec XYZ",
      rationale: "Why this spec matters",
    });

    const el = SourceLink({
      d: decision,
      children: "Spec Link",
    });

    expect((el?.props as { to?: string })?.to).toBe("/plan/spec/$id");
    expect((el?.props as { params?: { id: string } })?.params?.id).toBe("prd-xyz");
  });

  test("prioritizes mission_id over prd_id when both are present", () => {
    const decision: DecisionRow = row({
      status: "rejected",
      decided_by_agent_slug: null,
      mission_id: "mission-1",
      prd_id: "prd-1",
      source_kind: "mission",
      source_label: "Mission",
      rationale: null,
    });

    const el = SourceLink({
      d: decision,
      children: "Dual Link",
    });

    // Mission takes precedence
    expect((el?.props as { to?: string })?.to).toBe("/build/$missionId");
  });

  test("renders null when neither mission_id nor prd_id is present (meeting-sourced)", () => {
    const decision: DecisionRow = row({
      status: "pending",
      decided_by_agent_slug: null,
      mission_id: null,
      prd_id: null,
      source_kind: "meeting",
      source_label: "Design Sync",
      rationale: null,
    });

    const el = SourceLink({
      d: decision,
      children: "Meeting Link",
    });

    expect(el).toBeNull();
  });

  test("applies className and style props to Link", () => {
    const decision: DecisionRow = row({
      status: "approved",
      decided_by_agent_slug: null,
      mission_id: "mission-styled",
      prd_id: null,
      source_kind: "mission",
      source_label: "Styled Mission",
      rationale: null,
    });

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
    const decision: DecisionRow = row({
      status: "pending",
      decided_by_agent_slug: null,
      mission_id: "mission-click",
      prd_id: null,
      source_kind: "mission",
      source_label: "Mission",
      rationale: null,
    });

    const handleClick = mock(() => {});
    const el = SourceLink({
      d: decision,
      onClick: handleClick as any,
      children: "Clickable Link",
    });

    expect((el?.props as { onClick?: unknown })?.onClick).toBeDefined();
  });
});

// OBS_STATUS_TONE is gone (2026-07-29). It existed only to feed a VerdictChip,
// the chip is retired, and the outcome vocabulary now lives once in
// decisions-shared.ts as OUTCOME_WORD so the list and the drill cannot drift.
// Its coverage moved with it: __tests__/decisions-shared.test.ts.

describe("DecisionsPanel data states", () => {
  /**
   * IMPLEMENTATION NOTES: Full DecisionsPanel testing uses mock.module to intercept
   * @tanstack/react-query useQuery, @tanstack/react-start useServerFn, and TanStack
   * Router useNavigate at import time. This allows controlled data states without
   * a full DOM renderer or integration test harness.
   *
   * Pattern:
   *   const module = import.meta.require("./path.tsx");
   *   await module.__test__.setQueryState({ isLoading, isError, data });
   *   const el = module.DecisionsPanel();
   *   // verify output
   *
   * Key: The component is wrapped with __test__ export hooks that allow tests to
   * inject mock states.
   */

  // Test 1: Loading state (PanelSkeleton)
  test.skip("renders PanelSkeleton when decisions.isLoading is true", async () => {
    // TODO: Requires mock.module pattern implementation in DecisionsPanel.tsx
    // Expected behavior: DecisionsPanel renders <PanelSkeleton /> when useQuery state is loading
  });

  // Test 2: Error state with retry
  test.skip("renders error card when decisions.isError is true", async () => {
    // TODO: Requires mock.module pattern implementation in DecisionsPanel.tsx
    // Expected behavior: DecisionsPanel renders error card with message + refetch button
  });

  // Test 3: Empty state
  test.skip("renders empty state when decisions.data.decisions is empty array", async () => {
    // TODO: Requires mock.module pattern implementation in DecisionsPanel.tsx
    // Expected behavior: DecisionsPanel renders EmptyState-like message
  });

  // Test 4: Render with data
  test.skip("renders decision rows when data.decisions has items", async () => {
    // TODO: Requires mock.module pattern implementation in DecisionsPanel.tsx
    // Expected behavior: Maps rows and renders table structure with decision data
  });

  /*
   * THIRTY-SIX DECLARED BEHAVIOURS OF THIS PANEL ARE NOT TESTED, and four more
   * are skipped. They are listed rather than written because the panel cannot
   * be mounted without a `mock.module` pattern nobody has built, which the
   * skipped ones say in their own comments.
   *
   * They are `test.todo`, so bun reports them as todo rather than as passes --
   * which is the honest version of this and the reason they stay. Every one of
   * them also produces a type error under `bun run typecheck:tests`, because
   * bun's types want a function argument that `test.todo(name)` does not need
   * at runtime. Thirty-six of the forty-two errors in this file are that, and
   * none of them is a defect.
   *
   * Left alone deliberately: passing a no-op function to satisfy a type would
   * turn a visible "todo" into something that looks written. The panel's real
   * gap is that nobody can mount it, and padding these hides that rather than
   * fixing it.
   */
  // Legacy todo tests (kept for reference)
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
  test.todo("leaves a Receipt naming what the logged call causes (never a toast)");
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
