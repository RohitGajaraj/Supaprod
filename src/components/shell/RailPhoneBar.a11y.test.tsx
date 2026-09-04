/**
 * P-90: cheap insurance on `PhoneMoreSheet` (P-81's bespoke, non-Radix
 * bottom sheet -- no violation was found auditing it, but nothing guarded
 * it either, and RunMap shipped the same way). Asserts the three contracts
 * a screen reader needs from any dialog-shaped overlay: it announces itself
 * as one, it is labelled, and it is marked modal.
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, mock } from "bun:test";
import type { ReactNode } from "react";

const pathname = "/start";
const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useRouterState: () => pathname,
  // A real `<Link>` needs a `RouterProvider` this test does not mount --
  // same substitution `the-connect-control-stops-hiding-when-it-is-needed
  // .test.tsx` already uses for the same reason.
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

const { RailPhoneBar } = await import("./RailPhoneBar");

afterEach(cleanup);

describe("RailPhoneBar's More sheet is a real dialog to a screen reader", () => {
  it("opens with role=dialog, aria-modal=true and a label", async () => {
    render(<RailPhoneBar />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    // The labelledby id resolves to a real, present element -- not merely a
    // string that looks like an id.
    expect(document.getElementById(labelId ?? "")).toBeDefined();
  });
});
