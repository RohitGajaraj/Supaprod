import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRow } from "../memory/MemoryRow";
import { describe, test, expect, mock } from "bun:test";

describe("MemoryRow Component", () => {
  const mockProps = {
    snippet: "Users complained about slow checkout",
    source: "Support team feedback",
    date: new Date("2026-07-20").toISOString(),
    verdict: { tone: "moss" as const, label: "CONFIRMED" },
  };

  describe("Rendering", () => {
    test("renders snippet text", () => {
      render(<MemoryRow {...mockProps} />);
      expect(screen.getByText("Users complained about slow checkout")).toBeTruthy();
    });

    test("renders source text", () => {
      render(<MemoryRow {...mockProps} />);
      expect(screen.getByText("Support team feedback")).toBeTruthy();
    });

    test("renders formatted date", () => {
      render(<MemoryRow {...mockProps} />);
      expect(screen.getByText(/Jul 20, 2026/)).toBeTruthy();
    });

    test("renders verdict chip when provided", () => {
      render(<MemoryRow {...mockProps} />);
      expect(screen.getByText("CONFIRMED")).toBeTruthy();
    });

    test("omits verdict chip when not provided", () => {
      const { verdict, ...rest } = mockProps;
      render(<MemoryRow {...rest} />);
      expect(screen.queryByText("CONFIRMED")).toBeNull();
    });

    test("renders Forget button when onDelete provided", () => {
      render(<MemoryRow {...mockProps} onDelete={async () => {}} />);
      expect(screen.getByText("Forget")).toBeTruthy();
    });

    test("omits button and shows read-only note when no onDelete and readOnlyNote provided", () => {
      render(<MemoryRow {...mockProps} readOnlyNote="This entry is from a trusted source" />);
      expect(screen.queryByText("Forget")).toBeNull();
      expect(screen.getByText("read only")).toBeTruthy();
    });
  });

  describe("Delete Action", () => {
    test("calls onDelete when Forget button clicked", async () => {
      const onDelete = mock(async () => {});
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledTimes(1);
      });
    });

    test("shows 'Forgetting…' text during delete", async () => {
      const onDelete = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.getByText("Forgetting…")).toBeTruthy();
      });
    });

    test("disables button during delete operation", async () => {
      const onDelete = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget") as HTMLButtonElement;
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(forgetBtn.disabled).toBe(true);
      });
    });

    test("re-enables button after delete completes", async () => {
      const onDelete = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget") as HTMLButtonElement;
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.getByText("Forget")).toBeTruthy();
        expect(forgetBtn.disabled).toBe(false);
      });
    });

    test("prevents double-click during delete operation", async () => {
      const onDelete = mock(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Error Handling (CRITICAL: silent-failure fix)", () => {
    test("displays error message when onDelete throws Error object", async () => {
      const onDelete = mock(async () => {
        throw new Error("Permission denied: cannot delete system entry");
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.getByText("Permission denied: cannot delete system entry")).toBeTruthy();
      });
    });

    test("displays fallback message when non-Error object is thrown", async () => {
      const onDelete = mock(async () => {
        // eslint-disable-next-line no-throw-literal
        throw "Unknown error";
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.getByText("Failed to delete memory entry. Try again.")).toBeTruthy();
      });
    });

    test("error message has role=alert for accessibility", async () => {
      const onDelete = mock(async () => {
        throw new Error("Delete failed");
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        const errorMsg = screen.getByRole("alert");
        expect(errorMsg).toBeTruthy();
        expect(errorMsg.textContent).toContain("Delete failed");
      });
    });

    test("clears previous error when retry succeeds after failure", async () => {
      let callCount = 0;
      const onDelete = mock(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First attempt failed");
        }
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget");

      // First click fails
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.getByText("First attempt failed")).toBeTruthy();
      });

      // Second click succeeds
      fireEvent.click(forgetBtn);
      await waitFor(() => {
        expect(screen.queryByText("First attempt failed")).toBeNull();
      });
    });

    test("re-enables button after error (clears pending state on error)", async () => {
      const onDelete = mock(async () => {
        throw new Error("Delete failed");
      });
      render(<MemoryRow {...mockProps} onDelete={onDelete} />);
      const forgetBtn = screen.getByText("Forget") as HTMLButtonElement;

      fireEvent.click(forgetBtn);

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeTruthy();
      });

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(forgetBtn.disabled).toBe(false);
      });
    });
  });

  describe("Custom Labels and Notes", () => {
    test("uses custom delete label when provided", () => {
      render(<MemoryRow {...mockProps} onDelete={async () => {}} deleteLabel="Remove" />);
      expect(screen.getByText("Remove")).toBeTruthy();
      expect(screen.queryByText("Forget")).toBeNull();
    });

    test("shows read-only note with title attribute when no onDelete", () => {
      const { container } = render(
        <MemoryRow
          {...mockProps}
          readOnlyNote="This is a system-generated insight"
        />,
      );
      const readOnlySpan = screen.getByText("read only");
      expect(readOnlySpan.getAttribute("title")).toBe("This is a system-generated insight");
    });
  });

  describe("Edge Cases", () => {
    test("handles very long snippet text", () => {
      const longSnippet = "A".repeat(500);
      render(<MemoryRow {...mockProps} snippet={longSnippet} />);
      expect(screen.getByText(longSnippet)).toBeTruthy();
    });

    test("handles malformed date gracefully", () => {
      render(<MemoryRow {...mockProps} date="invalid-date" />);
      expect(screen.getByText("invalid-date")).toBeTruthy();
    });

    test("applies custom className", () => {
      const { container } = render(
        <MemoryRow {...mockProps} className="custom-row" />,
      );
      const row = container.querySelector("div");
      expect(row?.className).toContain("custom-row");
    });
  });
});
