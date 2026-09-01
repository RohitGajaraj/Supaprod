import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApprovalCard, type ApprovalItem } from "../ApprovalCard";
import { describe, test, expect, beforeEach, mock } from "bun:test";

describe("ApprovalCard Component", () => {
  const mockItem: ApprovalItem = {
    id: "approval-1",
    kind: "PROPOSAL",
    kindTone: "human",
    project: "project-slug",
    title: "Add user authentication to checkout",
    evidence: ["12 signals point at checkout friction", "Competitor X has this feature"],
    impact: "~120 credits · touches checkout flow only",
    approveConsequence: "authentication layer deployed",
    rejectConsequence: "checkbox friction persists",
    timestamp: new Date().toISOString(),
  };

  describe("Rendering", () => {
    test("renders card with aria-label from kind and title", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      const card = screen.getByLabelText(/PROPOSAL.*Add user authentication/i);
      expect(card).toBeTruthy();
    });

    test("renders VerdictChip with kind and correct tone", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.getByText("PROPOSAL")).toBeTruthy();
    });

    test("renders project slug when present", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.getByText("project-slug")).toBeTruthy();
    });

    test("omits project slug when not present", () => {
      const itemWithoutProject = { ...mockItem, project: undefined };
      render(
        <ApprovalCard
          item={itemWithoutProject}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.queryByText("project-slug")).toBeNull();
    });

    test("renders title as heading", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.getByText("Add user authentication to checkout")).toBeTruthy();
    });

    test("renders evidence list with bullets", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.getByText("12 signals point at checkout friction")).toBeTruthy();
      expect(screen.getByText("Competitor X has this feature")).toBeTruthy();
    });

    test("omits evidence list when empty", () => {
      const itemWithoutEvidence = { ...mockItem, evidence: [] };
      const { container } = render(
        <ApprovalCard
          item={itemWithoutEvidence}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      const list = container.querySelector("ul");
      expect(list).toBeNull();
    });

    test("renders impact line when present", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.getByText("~120 credits · touches checkout flow only")).toBeTruthy();
    });

    test("omits impact line when not present", () => {
      const itemWithoutImpact = { ...mockItem, impact: undefined };
      render(
        <ApprovalCard
          item={itemWithoutImpact}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.queryByText(/credits/)).toBeNull();
    });

    test("renders Approve and Reject buttons with consequences", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");
      const rejectBtn = screen.getByText("Reject");
      expect(approveBtn).toBeTruthy();
      expect(rejectBtn).toBeTruthy();
      expect(screen.getByText("authentication layer deployed")).toBeTruthy();
      expect(screen.getByText("checkbox friction persists")).toBeTruthy();
    });
  });

  describe("Async Approval Handling", () => {
    test("calls onApprove when Approve button clicked", async () => {
      const onApprove = mock(async () => {});
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");
      fireEvent.click(approveBtn);
      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledWith(mockItem.id);
      });
    });

    test("calls onReject when Reject button clicked", async () => {
      const onReject = mock(async () => {});
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={onReject} />);
      const rejectBtn = screen.getByText("Reject");
      fireEvent.click(rejectBtn);
      await waitFor(() => {
        expect(onReject).toHaveBeenCalledWith(mockItem.id);
      });
    });

    test("shows 'Approving' text during approval", async () => {
      const onApprove = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");
      fireEvent.click(approveBtn);
      await waitFor(() => {
        expect(screen.getByText("Approving")).toBeTruthy();
      });
    });

    test("shows 'Rejecting' text during rejection", async () => {
      const onReject = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={onReject} />);
      const rejectBtn = screen.getByText("Reject");
      fireEvent.click(rejectBtn);
      await waitFor(() => {
        expect(screen.getByText("Rejecting")).toBeTruthy();
      });
    });
  });

  describe("Double-Click Race Condition Prevention (CRITICAL)", () => {
    test("prevents double-click on Approve button via pending lock", async () => {
      const onApprove = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      // First click triggers approval
      fireEvent.click(approveBtn);

      // Immediate second click should be ignored (pending lock active)
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledTimes(1);
      });
    });

    test("prevents double-click on Reject button via pending lock", async () => {
      const onReject = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={onReject} />);
      const rejectBtn = screen.getByText("Reject");

      // First click triggers rejection
      fireEvent.click(rejectBtn);

      // Immediate second click should be ignored (pending lock active)
      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(onReject).toHaveBeenCalledTimes(1);
      });
    });

    test("disables both buttons during approval to prevent cross-action clicking", async () => {
      const onApprove = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");
      const rejectBtn = screen.getByText("Reject");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(approveBtn.hasAttribute("disabled")).toBe(true);
        expect(rejectBtn.hasAttribute("disabled")).toBe(true);
      });
    });

    test("disables both buttons during rejection to prevent cross-action clicking", async () => {
      const onReject = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={onReject} />);
      const approveBtn = screen.getByText("Approve");
      const rejectBtn = screen.getByText("Reject");

      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(approveBtn.hasAttribute("disabled")).toBe(true);
        expect(rejectBtn.hasAttribute("disabled")).toBe(true);
      });
    });
  });

  describe("Timestamp Formatting", () => {
    test("formats recent timestamps as minutes ago", () => {
      const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const itemWithTimestamp = { ...mockItem, timestamp: recentTime };
      render(
        <ApprovalCard
          item={itemWithTimestamp}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText(/30m ago/)).toBeTruthy();
    });

    test("formats hour-old timestamps as hours ago", () => {
      const hourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const itemWithTimestamp = { ...mockItem, timestamp: hourAgo };
      render(
        <ApprovalCard
          item={itemWithTimestamp}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText(/2h ago/)).toBeTruthy();
    });

    test("formats old timestamps as date", () => {
      const oldDate = new Date("2026-06-15").toISOString();
      const itemWithTimestamp = { ...mockItem, timestamp: oldDate };
      render(
        <ApprovalCard
          item={itemWithTimestamp}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText(/Jun 15/)).toBeTruthy();
    });

    test("handles malformed timestamp gracefully", () => {
      const itemWithBadTimestamp = {
        ...mockItem,
        timestamp: "not a valid date",
      };
      render(
        <ApprovalCard
          item={itemWithBadTimestamp}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText("not a valid date")).toBeTruthy();
    });

    test("omits timestamp when not present", () => {
      const itemWithoutTimestamp = { ...mockItem, timestamp: undefined };
      render(
        <ApprovalCard
          item={itemWithoutTimestamp}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.queryByText(/ago/)).toBeNull();
    });
  });

  describe("Open Button (Optional)", () => {
    test("renders Open button when onOpen provided", () => {
      const onOpen = mock(() => {});
      render(
        <ApprovalCard
          item={mockItem}
          onApprove={async () => {}}
          onReject={async () => {}}
          onOpen={onOpen}
        />,
      );
      const openBtn = screen.getByText("Open");
      expect(openBtn).toBeTruthy();
    });

    test("omits Open button when onOpen not provided", () => {
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />);
      expect(screen.queryByText("Open")).toBeNull();
    });

    test("calls onOpen with item id when Open clicked", () => {
      const onOpen = mock(() => {});
      render(
        <ApprovalCard
          item={mockItem}
          onApprove={async () => {}}
          onReject={async () => {}}
          onOpen={onOpen}
        />,
      );
      const openBtn = screen.getByText("Open");
      fireEvent.click(openBtn);
      expect(onOpen).toHaveBeenCalledWith(mockItem.id);
    });

    test("makes title clickable when onOpen provided", () => {
      const onOpen = mock(() => {});
      render(
        <ApprovalCard
          item={mockItem}
          onApprove={async () => {}}
          onReject={async () => {}}
          onOpen={onOpen}
        />,
      );
      const titleButton = screen.getByRole("button", {
        name: /Add user authentication/,
      });
      expect(titleButton).toBeTruthy();
    });
  });

  describe("Styling and CSS", () => {
    test("applies custom className", () => {
      const { container } = render(
        <ApprovalCard
          item={mockItem}
          onApprove={async () => {}}
          onReject={async () => {}}
          className="custom-class"
        />,
      );
      const card = container.querySelector("article");
      expect(card?.className).toContain("custom-class");
      expect(card?.className).toContain("ink-panel");
    });

    test("Approve button has correct styling during normal state", () => {
      const { container } = render(
        <ApprovalCard item={mockItem} onApprove={async () => {}} onReject={async () => {}} />,
      );
      const approveBtn = screen.getByText("Approve");
      expect(approveBtn?.className).toContain("bg-[var(--voice-human)]");
    });
  });

  describe("Error Handling (CRITICAL: silent-failure fix)", () => {
    test("displays error message when onApprove throws Error object", async () => {
      const onApprove = mock(async () => {
        throw new Error("Network timeout during approval");
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText("Network timeout during approval")).toBeTruthy();
      });
    });

    test("displays error message when onReject throws Error object", async () => {
      const onReject = mock(async () => {
        throw new Error("Permission denied on rejection");
      });
      render(<ApprovalCard item={mockItem} onApprove={async () => {}} onReject={onReject} />);
      const rejectBtn = screen.getByText("Reject");

      fireEvent.click(rejectBtn);

      await waitFor(() => {
        expect(screen.getByText("Permission denied on rejection")).toBeTruthy();
      });
    });

    test("displays fallback message when non-Error object is thrown", async () => {
      const onApprove = mock(async () => {
        throw "Unknown error";
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong. Try again.")).toBeTruthy();
      });
    });

    test("error message has role=alert for accessibility", async () => {
      const onApprove = mock(async () => {
        throw new Error("Test error");
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        const errorMsg = screen.getByRole("alert");
        expect(errorMsg).toBeTruthy();
        expect(errorMsg.textContent).toContain("Test error");
      });
    });

    test("clears previous error when retry succeeds after failure", async () => {
      let callCount = 0;
      const onApprove = mock(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First attempt failed");
        }
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      // First click fails
      fireEvent.click(approveBtn);
      await waitFor(() => {
        expect(screen.getByText("First attempt failed")).toBeTruthy();
      });

      // Second click succeeds
      fireEvent.click(approveBtn);
      await waitFor(() => {
        expect(screen.queryByText("First attempt failed")).toBeNull();
      });
    });

    test("re-enables buttons after error (clears pending state on error)", async () => {
      const onApprove = mock(async () => {
        throw new Error("Approval failed");
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");
      const rejectBtn = screen.getByText("Reject");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText("Approval failed")).toBeTruthy();
      });

      // Buttons should be re-enabled after error
      await waitFor(() => {
        expect(approveBtn.hasAttribute("disabled")).toBe(false);
        expect(rejectBtn.hasAttribute("disabled")).toBe(false);
      });
    });

    test("shows 'Approving' text even during approval that will error", async () => {
      const onApprove = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error("Delayed error");
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText("Approving")).toBeTruthy();
      });

      // After error resolves, should show error message
      await waitFor(() => {
        expect(screen.getByText("Delayed error")).toBeTruthy();
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles very long title", () => {
      const longTitle = "A".repeat(500);
      const itemWithLongTitle = { ...mockItem, title: longTitle };
      render(
        <ApprovalCard
          item={itemWithLongTitle}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText(longTitle)).toBeTruthy();
    });

    test("handles many evidence lines", () => {
      const manyEvidence = Array.from({ length: 20 }, (_, i) => `Evidence point ${i + 1}`);
      const itemWithManyEvidence = {
        ...mockItem,
        evidence: manyEvidence,
      };
      render(
        <ApprovalCard
          item={itemWithManyEvidence}
          onApprove={async () => {}}
          onReject={async () => {}}
        />,
      );
      expect(screen.getByText("Evidence point 1")).toBeTruthy();
      expect(screen.getByText("Evidence point 20")).toBeTruthy();
    });

    test("clears pending state after async approval completes", async () => {
      const onApprove = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      render(<ApprovalCard item={mockItem} onApprove={onApprove} onReject={async () => {}} />);
      const approveBtn = screen.getByText("Approve");

      // Initially shows Approve text
      expect(screen.getByText("Approve")).toBeTruthy();

      fireEvent.click(approveBtn);

      // During async action, shows Approving text
      await waitFor(() => {
        expect(screen.getByText("Approving")).toBeTruthy();
      });

      // After approval completes, button text reverts to "Approve"
      await waitFor(() => {
        expect(screen.getByText("Approve")).toBeTruthy();
        expect(screen.queryByText("Approving")).toBeNull();
      });
    });
  });
});
