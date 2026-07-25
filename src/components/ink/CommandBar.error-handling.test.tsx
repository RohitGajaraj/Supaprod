import { describe, it, expect, beforeEach } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { CommandBar } from "./CommandBar";

/**
 * CommandBar Error Handling Test Suite
 *
 * KNOWN ISSUE (documented in CommandBar.tsx lines 29-39):
 * The submit() function has a try-finally but NO catch block,
 * allowing Promise rejections from onSubmit to propagate as
 * unhandled rejections.
 *
 * This test suite documents the current buggy behavior and provides
 * a pattern for testing error handling once the bug is fixed.
 *
 * CURRENT STATE: CommandBar.submit() does:
 *   try { await onSubmit(intent); }
 *   finally { setBusy(false); }
 *
 * EXPECTED STATE (once fixed):
 *   try { await onSubmit(intent); }
 *   catch (error) { handleError(error); }
 *   finally { setBusy(false); }
 */

describe("CommandBar Error Handling (KNOWN ISSUE)", () => {
  describe("current behavior: unhandled rejections", () => {
    it("propagates rejection when onSubmit rejects", async () => {
      let unhandledRejection: Error | null = null;

      const rejectionHandler = (event: PromiseRejectionEvent) => {
        unhandledRejection = event.reason;
      };

      // Attach global handler to capture unhandled rejections
      globalThis.addEventListener("unhandledrejection", rejectionHandler);

      const testError = new Error("Submit failed");
      const onSubmit = async () => {
        throw testError;
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test intent" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(unhandledRejection).toBe(testError);
      });

      globalThis.removeEventListener("unhandledrejection", rejectionHandler);
    });

    it("busy state is reset even when onSubmit rejects", async () => {
      const onSubmit = async () => {
        throw new Error("Submit failed");
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test intent" } });
      fireEvent.click(button);

      // Busy state should be set briefly
      await waitFor(() => {
        expect(container.textContent).toContain("Handing to agents");
      });

      // But finally block resets it
      await waitFor(
        () => {
          expect(container.textContent).not.toContain("Handing to agents");
        },
        { timeout: 1000 },
      );
    });
  });

  describe("error recovery patterns (post-fix guidance)", () => {
    it("workaround pattern: callers should handle errors", async () => {
      let errorHandled = false;

      const onSubmit = async (intent: string) => {
        // Workaround: handle errors at call site
        try {
          throw new Error("Intentional error");
        } catch (error) {
          errorHandled = true;
          console.error("Command submission failed:", error);
        }
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(errorHandled).toBe(true);
      });
    });

    it("post-fix: component should expose onError callback", async () => {
      let errorCaught: Error | null = null;

      const onError = (error: Error) => {
        errorCaught = error;
      };

      const testError = new Error("Submit failed");
      const onSubmit = async () => {
        throw testError;
      };

      // Once fixed, CommandBar should accept onError prop
      const { container } = render(
        <CommandBar placeholder="Enter" onSubmit={onSubmit} onError={onError} />,
      );

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(errorCaught).toBe(testError);
      });
    });
  });

  describe("fix verification: proper error handling", () => {
    it("PENDING FIX: should catch rejection and handle gracefully", async () => {
      // This test documents the expected behavior once the fix is applied.
      // Currently skipped because CommandBar doesn't have proper error handling.

      const testError = new Error("Network error");
      const onSubmit = async () => {
        throw testError;
      };

      let errorHandled = false;

      const onError = (error: Error) => {
        errorHandled = true;
        expect(error).toBe(testError);
      };

      const { container } = render(
        <CommandBar placeholder="Enter" onSubmit={onSubmit} onError={onError} />,
      );

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      // Should NOT have unhandled rejection
      let unhandledRejection: Error | null = null;
      const rejectionHandler = (event: PromiseRejectionEvent) => {
        unhandledRejection = event.reason;
      };
      globalThis.addEventListener("unhandledrejection", rejectionHandler);

      await waitFor(() => {
        expect(errorHandled).toBe(true);
        expect(unhandledRejection).toBeNull();
      });

      globalThis.removeEventListener("unhandledrejection", rejectionHandler);
    });

    it("PENDING FIX: should display error message to user", async () => {
      const testError = new Error("Failed to process command");
      const onSubmit = async () => {
        throw testError;
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      // Once fixed, should show error message
      await waitFor(() => {
        expect(container.textContent).toContain("Failed to process command");
      });
    });

    it("PENDING FIX: should retry on transient error", async () => {
      let attemptCount = 0;
      const transientError = new Error("Temporary network issue");

      const onSubmit = async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw transientError;
        }
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(container.textContent).toContain("Retry");
      });

      const retryButton = container.querySelector("button[aria-label*='Retry']");
      if (retryButton) {
        fireEvent.click(retryButton);
      }

      await waitFor(() => {
        expect(attemptCount).toBe(2);
      });
    });
  });

  describe("error type handling", () => {
    it("distinguishes network errors from validation errors", async () => {
      const networkError = new Error("Network timeout");
      networkError.name = "NetworkError";

      const onSubmit = async () => {
        throw networkError;
      };

      let caughtError: Error | null = null;

      const onError = (error: Error) => {
        caughtError = error;
      };

      const { container } = render(
        <CommandBar placeholder="Enter" onSubmit={onSubmit} onError={onError} />,
      );

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(caughtError?.name).toBe("NetworkError");
      });
    });

    it("distinguishes timeout errors from other errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";

      const onSubmit = async () => {
        throw timeoutError;
      };

      let caughtError: Error | null = null;

      const onError = (error: Error) => {
        caughtError = error;
      };

      const { container } = render(
        <CommandBar placeholder="Enter" onSubmit={onSubmit} onError={onError} />,
      );

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(caughtError?.name).toBe("TimeoutError");
      });
    });
  });

  describe("error state UI (post-fix)", () => {
    it("displays error message in command bar", async () => {
      const onSubmit = async () => {
        throw new Error("Command failed");
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        const errorMessage = container.querySelector(".error-message");
        expect(errorMessage?.textContent).toContain("Command failed");
      });
    });

    it("shows retry button on transient errors", async () => {
      const onSubmit = async () => {
        throw new Error("Network timeout");
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        const retryButton = container.querySelector("button[aria-label*='Retry']");
        expect(retryButton).toBeTruthy();
      });
    });

    it("auto-dismisses error message after delay", async () => {
      jest.useFakeTimers();

      const onSubmit = async () => {
        throw new Error("Temporary error");
      };

      const { container } = render(<CommandBar placeholder="Enter" onSubmit={onSubmit} />);

      const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
      const button = container.querySelector("button");

      fireEvent.change(textarea, { target: { value: "Test" } });
      fireEvent.click(button);

      await waitFor(() => {
        expect(container.textContent).toContain("Temporary error");
      });

      jest.advanceTimersByTime(5000);

      expect(container.textContent).not.toContain("Temporary error");

      jest.useRealTimers();
    });
  });
});
