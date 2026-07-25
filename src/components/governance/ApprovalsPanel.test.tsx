import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApprovalsPanel } from "./ApprovalsPanel";

/**
 * ApprovalsPanel Test Suite
 *
 * Tests the governance approval queue panel, including:
 * - Loading and error states
 * - Rendering lists of pending and resolved approvals
 * - Individual approval actions (approve/reject/extend)
 * - Batch "Approve All Low-Risk" mutation with partial-failure handling
 * - TanStack Query state management
 *
 * Key gap: partial-failure scenarios when approveAll fails mid-batch.
 * This test documents the current behavior and expected fixes.
 */

describe("ApprovalsPanel", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const mockApproval = (overrides?: Record<string, any>) => ({
    id: "approval-1",
    agent_slug: "builder",
    tool_name: "execute_shell",
    risk: "low",
    status: "pending" as const,
    expires_at: "2026-07-25T23:59:59Z",
    rationale: "Agent needs to run a command to build the project",
    args: { command: "bun run build" },
    error: null,
    mission_id: "mission-1",
    mission_title: "Q3 Release",
    ...overrides,
  });

  describe("Loading State", () => {
    test("renders PanelSkeleton when approvals query is loading", async () => {
      // Mock useQuery to return loading state
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ApprovalsPanel />
        </QueryClientProvider>,
      );

      // Note: this requires the component to be enhanced with a test-friendly
      // architecture that allows injecting mock data. See mock.module pattern
      // documented in DecisionsPanel.test.tsx comments.

      // Placeholder: currently the test cannot easily mock useQuery
      // without refactoring ApprovalsPanel to accept injected dependencies.
      // TODO: Implement mock.module harness wrapper for ApprovalsPanel
    });

    test("renders 'Reading the queue' message on initial load", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });
  });

  describe("Error State", () => {
    test("renders error card with message when query fails", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });

    test("renders 'Retry' button that calls q.refetch()", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });

    test("shows error message from q.error.message", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });
  });

  describe("Empty State", () => {
    test("renders 'Nothing waiting' message when approvals array is empty", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });

    test("displays explanation text in empty state", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Expected: "The agents are running inside their lanes..."
    });
  });

  describe("Rendering with Data", () => {
    test("renders pending approvals sorted by soonest expiry first", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Test that pending approvals are sorted: earlier expires_at appears first
    });

    test("renders resolved approvals below pending", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Test render order: pending, then resolved
    });

    test("displays pending count with 'X waiting' label", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // e.g., "3 waiting · median response 45s"
    });

    test("shows median response time when available", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // fmtMedian helper should format medianResponseMs correctly
    });

    test("omits median response time when not available", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });
  });

  describe("Individual Approval Actions", () => {
    test("calls decide.mutate with approve decision when Approve button clicked", async () => {
      // TODO: Requires mock.module pattern + component refactoring
      // Verify: decide.mutate({ approvalId, decision: "approve", tool })
    });

    test("calls decide.mutate with reject decision when Reject button clicked", async () => {
      // TODO: Requires mock.module pattern + component refactoring
      // Verify: decide.mutate({ approvalId, decision: "reject", tool })
    });

    test("shows success toast when approve succeeds with executed=true", async () => {
      // TODO: Test toast.success is called with: "Approved · {tool} ran."
    });

    test("shows success toast when approve succeeds with executed=false", async () => {
      // TODO: Test toast.success is called with: "Approved."
    });

    test("shows success toast with custom message on reject", async () => {
      // TODO: Test toast.success is called with: "Rejected · nothing ran."
    });

    test("shows error toast and calls inv() on approve failure", async () => {
      // TODO: Test toast.error and QueryClient invalidateQueries
    });

    test("calls extend.mutate when Extend button clicked", async () => {
      // TODO: Verify: extend.mutate(approvalId) with additionalHours: 24
    });

    test("shows success toast on extend", async () => {
      // TODO: Test toast.success: "Extended · 24h more on the clock."
    });

    test("shows error toast on extend failure", async () => {
      // TODO: Test toast.error called
    });
  });

  describe("Approve All Low-Risk (Batch Mutation)", () => {
    test("renders 'Approve all low-risk' button when lowRisk.length > 1", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Test button text: "Approve all low-risk (N)"
    });

    test("hides 'Approve all' button when only 0 or 1 low-risk approval exists", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });

    test("calls approveAll.mutate with array of low-risk IDs", async () => {
      // TODO: Requires mock.module pattern + component refactoring
      // Verify: approveAll.mutate([id1, id2, id3]) for all low-risk items
    });

    test("shows success toast with count when approveAll succeeds", async () => {
      // TODO: Test toast.success: "{N} low-risk approvals ran."
    });

    test("shows error toast when approveAll fails", async () => {
      // TODO: Test toast.error called with error message
    });

    test("calls inv() to invalidate queries on approveAll success", async () => {
      // TODO: Verify QueryClient invalidateQueries called for both query keys
    });

    test("calls inv() to invalidate queries on approveAll error", async () => {
      // TODO: Verify QueryClient invalidateQueries called even on error
    });
  });

  describe("Partial-Failure Handling (CRITICAL)", () => {
    test("KNOWN ISSUE: batch approval fails mid-loop with no partial-success indication", async () => {
      // This test documents the current gap.
      //
      // SCENARIO: approveAll loops through [id1, id2, id3]
      //   - id1: succeeds (fDecide resolves)
      //   - id2: fails (fDecide rejects with "Permission denied")
      //   - id3: never reached (loop breaks on id2 error)
      //
      // CURRENT BEHAVIOR:
      //   - approveAll.mutationFn rejects (loop exits on first error)
      //   - onError callback shows toast.error with generic message
      //   - User sees: "Permission denied" or error.message
      //   - User has NO indication that id1 was already approved
      //
      // EXPECTED FIX (once implemented):
      //   Option A (Optimistic): Approve each ID sequentially, collect results,
      //     show partial summary: "Approved 1/3 low-risk (others failed)"
      //   Option B (Conservative): Pre-validate all IDs, fail fast if any invalid,
      //     only mutate if all pre-checks pass
      //   Option C (Granular): Change approveAll to approve each item
      //     independently via individual mutations, not a batch loop

      const approvals = [
        mockApproval({ id: "a1", risk: "low" }),
        mockApproval({ id: "a2", risk: "low" }),
        mockApproval({ id: "a3", risk: "low" }),
      ];

      // Mock implementation: second approval fails mid-batch
      // TODO: Implement once mock.module pattern is available
      // const mocks = createTanstackMocks();
      // mocks.setQueryState("govern-approvals", {
      //   data: { approvals, medianResponseMs: 45000, ... },
      //   isLoading: false,
      // });
      // mocks.mockServerFn("decideApproval", async (args) => {
      //   if (args.data.approvalId === "a2") {
      //     throw new Error("Permission denied");
      //   }
      //   return { executed: true };
      // });
      //
      // const { container } = render(withMocks(<ApprovalsPanel />, mocks));
      // fireEvent.click(screen.getByText(/Approve all low-risk/));
      //
      // await waitFor(() => {
      //   // Currently shows generic error, not partial success
      //   expect(screen.getByText("Permission denied")).toBeTruthy();
      //   expect(screen.queryByText(/Approved 1/)).toBeNull();
      // });
    });

    test("ENHANCEMENT: should show partial success when some approvals fail", async () => {
      // TODO: Once batch mutation is refactored to handle partial failures,
      // verify that the UI shows something like:
      //   "Approved 1 of 3 · 2 failed (retry available)"
    });

    test("ENHANCEMENT: should support retry-failed-only", async () => {
      // TODO: After batch failure, user should be able to retry just the
      // failed items without re-approving the successful ones
    });
  });

  describe("TrustGraduationsBlock Integration", () => {
    test("renders TrustGraduationsBlock component", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify component is rendered at top of ApprovalsPanel
    });
  });

  describe("ApprovalCard Delegation", () => {
    test("passes correct props to each ApprovalCard", async () => {
      // TODO: Verify each rendered ApprovalCard receives:
      //   - a: GovernApproval (the approval item)
      //   - track: AgentTrackRecord | null
      //   - outcome: AgentOutcomeRecord | null
      //   - declines: number (from rejectionCountFor)
      //   - busy: boolean (when decide.isPending && decide.variables?.approvalId === a.id)
      //   - extending: boolean (when extend.isPending && extend.variables === a.id)
      //   - onApprove, onReject, onExtend callbacks
    });

    test("renders correct number of ApprovalCard components", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify count matches: pending.length + resolved.length
    });

    test("ApprovalCard onApprove callback triggers decide.mutate", async () => {
      // TODO: Verify callback wiring
    });

    test("ApprovalCard onReject callback triggers decide.mutate", async () => {
      // TODO: Verify callback wiring
    });

    test("ApprovalCard onExtend callback triggers extend.mutate", async () => {
      // TODO: Verify callback wiring
    });
  });

  describe("Resolution State Visualization", () => {
    test("resolved approvals render at reduced opacity (0.45)", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify CSS class or inline style opacity
    });

    test("pending approvals render at full opacity (1)", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
    });

    test("ApprovalCard shows resolved status line for non-pending approvals", async () => {
      // TODO: Verify RESOLVED_LINE content and color based on status
      // (approved, executed, rejected, etc.)
    });
  });

  describe("Keyboard/Accessibility", () => {
    test("buttons have proper aria labels", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify: aria-label on Approve all button, etc.
    });

    test("error card has role=region for screen readers", async () => {
      // TODO: Verify role and aria-live
    });
  });

  describe("Data Flow and Queries", () => {
    test("calls listGovernApprovals on component mount", async () => {
      // TODO: Requires spy on useServerFn(listGovernApprovals)
    });

    test("refetch is called after decide.mutate succeeds", async () => {
      // TODO: Verify useQuery.refetch() or invalidateQueries
    });

    test("refetch is called after extend.mutate succeeds", async () => {
      // TODO: Verify query invalidation
    });

    test("queries are invalidated with correct keys", async () => {
      // TODO: Verify: ["govern-approvals"] and ["governance"]
    });
  });

  describe("Edge Cases", () => {
    test("handles empty trackByAgent data gracefully", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify: track should be null when not in trackByAgent map
    });

    test("handles empty outcomeByAgent data gracefully", async () => {
      // TODO: Requires mock.module pattern for useQuery injection
      // Verify: outcome should be null when not in outcomeByAgent map
    });

    test("handles null rejection count gracefully", async () => {
      // TODO: Verify: declines should be 0 when rejectionCountFor returns null
    });

    test("handles very long approval lists (100+ items) with memoization", async () => {
      // TODO: Verify performance (all, pending, resolved, rows, lowRisk arrays)
      // are memoized to prevent unnecessary re-renders
    });

    test("handles approval.expires_at with missing value", async () => {
      // TODO: Verify sort fallback to "9999" or max date
    });

    test("handles approval without mission_id", async () => {
      // TODO: Verify: Mission link should not render when mission_id is falsy
    });
  });

  describe("Mutation State Transitions", () => {
    test("decide.isPending prevents button clicks during approval", async () => {
      // TODO: Requires mock.module pattern
      // Verify button disabled={busy} when decide.isPending
    });

    test("extend.isPending disables Extend button only", async () => {
      // TODO: Requires mock.module pattern
      // Verify only extend button is disabled, not approve/reject
    });

    test("approveAll.isPending disables 'Approve all' button", async () => {
      // TODO: Requires mock.module pattern
      // Verify button disabled={approveAll.isPending}
    });
  });
});
