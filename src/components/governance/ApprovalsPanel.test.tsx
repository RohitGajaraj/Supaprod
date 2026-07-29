import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApprovalsPanel } from "./ApprovalsPanel";

/**
 * ApprovalsPanel Test Suite
 *
 * REWRITTEN 2026-07-29 alongside the port onto the shell primitives. The suite
 * was almost entirely placeholders, and the placeholders described a surface
 * that no longer exists: approval CARDS, a "Nothing waiting" slate, and success
 * TOASTS. Leaving those in place would be worse than having no tests, because a
 * future reader would take them as the spec and rebuild the thing that was
 * deliberately removed. The descriptions below name the surface as it is:
 *
 *   - one Gate (the soonest-to-expire pending call) plus one-line Rows
 *   - Loading / Failed-with-retry / Empty, three distinct facts
 *   - a Receipt for every settled call, and NEVER a success toast
 *     (agents/FINAL-agent-presence.md R10)
 *   - a batch approval that reports both halves of a partial failure
 *
 * The harness gap is unchanged and is the reason most of these are still
 * pending: ApprovalsPanel reads through `useServerFn` + `useQuery` with no
 * injection seam, so there is no way to drive it from a test without the
 * mock.module pattern documented in DecisionsPanel.test.tsx. That is a real
 * piece of work, not a formatting one, and it is called out here rather than
 * faked with a test that asserts nothing.
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

  describe("Mounting", () => {
    test("mounts without throwing, with no data and no router", () => {
      // The one thing this suite can genuinely assert today. It is not nothing:
      // the panel calls useNavigate, and a component that reaches for a router
      // it cannot have would fail here rather than in the Engine Room.
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <ApprovalsPanel />
        </QueryClientProvider>,
      );
      expect(container).toBeTruthy();
    });
  });

  describe("Read states, which are three different facts", () => {
    test("in flight renders Loading, never an empty state", () => {
      // Expected: <Loading>Reading the queue.</Loading>
      // TODO: needs the mock.module harness for useQuery injection
    });

    test("a failed read renders Failed with a retry, never an empty state", () => {
      // "Nothing here" and "we could not find out" are different facts and a
      // person acts differently on each.
      // Expected: Failed, copy naming that the count below is not the real one,
      // and a retry that calls q.refetch()
      // TODO: needs the mock.module harness
    });

    test("an empty queue renders Empty naming who acts next", () => {
      // Expected: the agents are running inside their lanes, and a call lands
      // here when one needs a decision.
      // TODO: needs the mock.module harness
    });
  });

  describe("One Gate plus a list", () => {
    test("the soonest-to-expire pending call is the Gate", () => {
      // Sort is on expires_at ascending, with a "9999" fallback for a null.
      // TODO: needs the mock.module harness
    });

    test("every other pending call is a one-line Row, not a second Gate", () => {
      // The defect this replaced: twenty cards, twenty approve/reject pairs,
      // and nothing to look at first.
      // TODO: needs the mock.module harness
    });

    test("clicking a waiting Row makes it the Gate", () => {
      // setFocusedId, and the Gate follows it.
      // TODO: needs the mock.module harness
    });

    test("resolved calls render below, quiet, with their RESOLVED_LINE tone", () => {
      // TODO: needs the mock.module harness
    });

    test("exactly one AgentMark wears state=gate", () => {
      // The blink is the system's only one, so it has to mean "look here".
      // Waiting rows take state=waiting, resolved rows take state=quiet.
      // TODO: needs the mock.module harness
    });

    test("the payload sits behind a disclosure, never in a list row", () => {
      // A <pre> in a row would make the row wrap, and a row never wraps.
      // TODO: needs the mock.module harness
    });
  });

  describe("THE COMMIT: judgment leaves a receipt, never a toast", () => {
    test("approving renders a Receipt saying the tool RAN", () => {
      // Expected: verb "You approved", consequence "<tool> ran." when the
      // server reports executed, and "<tool> is cleared..." when it does not.
      // Explicitly NOT: toast.success("Approved · <tool> ran.")
      // TODO: needs the mock.module harness
    });

    test("declining renders a Receipt saying nothing ran", () => {
      // Expected: verb "You declined", consequence naming the tool.
      // TODO: needs the mock.module harness
    });

    test("a FAILED write renders a Receipt marked failed, not a success shape", () => {
      // Never a success shape over a failed write: that is the one thing that
      // makes the successful receipts trustworthy.
      // TODO: needs the mock.module harness
    });

    test("extending renders a Receipt about the clock, not about a judgment", () => {
      // An extension is not a decision, so its verb says what it did to the
      // clock. Its FAILURE is a plain error toast for the same reason: there is
      // no judgment to write a receipt about.
      // TODO: needs the mock.module harness
    });

    test("no code path calls toast.success", () => {
      // The single most important assertion in this file once the harness
      // exists. Grep-level truth today: ApprovalsPanel imports toast only for
      // the extend failure path.
      // TODO: needs the mock.module harness
    });
  });

  describe("Approve all low risk", () => {
    test("the control appears only when more than one low-risk call is waiting", () => {
      // Rendered as Block `more`, so it is a quiet affordance on the list
      // header rather than a second primary action competing with the Gate.
      // TODO: needs the mock.module harness
    });

    test("decides each id independently rather than breaking on the first error", () => {
      // FIXED 2026-07-29. The old mutationFn was a bare `for` loop of awaits, so
      // one rejection threw out of the whole batch: ids before it had ALREADY
      // been approved server-side and the UI reported only the error, so a
      // person could not tell what had run. Each call is now caught
      // individually and sorted into ran[] / failed[].
      // TODO: needs the mock.module harness
    });

    test("a partial failure renders BOTH receipts, the successes and the failures", () => {
      // SCENARIO: [a1, a2, a3], a2 rejects with "Permission denied".
      // Expected: one Receipt "You approved 2 calls" naming the two tools that
      // ran, AND one failed Receipt naming a2 and its message.
      // Never a single number that quietly averages the two.
      // TODO: needs the mock.module harness
    });
  });

  describe("Trust graduations share the surface", () => {
    test("the graduation block renders below the tool queue", () => {
      // TODO: needs the mock.module harness
    });

    test("it does NOT draw its Gate while a tool call is waiting", () => {
      // ApprovalsPanel passes lead={!focused}. A tool approval has an agent
      // stopped mid run; a graduation has no clock at all. Two Gates would be
      // two primary actions and neither would read as the one thing asking.
      // TODO: needs the mock.module harness
    });

    test("it DOES draw its Gate when the tool queue is clear", () => {
      // TODO: needs the mock.module harness
    });
  });

  describe("Data flow", () => {
    test("reads listGovernApprovals under the govern-approvals key", () => {
      // TODO: needs a spy on useServerFn
    });

    test("every settle invalidates govern-approvals and governance", () => {
      // Both keys, on success AND on error: a failed decide can still have
      // moved the server row, so refusing to refetch would leave a stale queue.
      // TODO: needs the mock.module harness
    });
  });

  describe("Edge cases", () => {
    test("an approval with no expires_at sorts last, never first", () => {
      // Fallback string "9999" in the localeCompare.
      // TODO: needs the mock.module harness
    });

    test("an approval with no mission_id renders no mission control", () => {
      // An affordance is a promise. A button that opens nothing is a lie.
      // TODO: needs the mock.module harness
    });

    test("a missing track record renders 'no decided calls yet', never a zero", () => {
      // formatTrackRecord returns null below one decided row, and a fabricated
      // "approved 0/0" would be a number nobody measured.
      // TODO: needs the mock.module harness
    });

    test("an unknown risk level still renders a word and a tone", () => {
      // riskWord falls through to "<risk> risk", toneForRisk falls through to
      // warn. A risk nobody classified must not look harmless.
      // TODO: needs the mock.module harness
    });
  });
});
