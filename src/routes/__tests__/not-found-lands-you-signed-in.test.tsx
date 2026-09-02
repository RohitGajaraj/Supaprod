/**
 * P-15 (A-QUEUE.md), found by A1 live 2026-09-02 20:05: `/today` and any
 * dead address 404, and "Go home" sent an already-signed-in reader to the
 * public landing page rather than `/start`.
 *
 * WHY `getSession` IS PASSED AS A PROP, NOT `mock.module`d. Bun's
 * `mock.module` is process-wide, and `@/integrations/supabase/client` is
 * already mocked by `AskPane.test.tsx` -- a second file mocking the same
 * module would join the exact hazard `a-module-mock-is-process-wide.test.ts`
 * freezes the set of, which "may shrink and must never grow". `__root.tsx`
 * made `getSession` injectable for precisely this test, avoiding the module
 * system rather than adding a second collision to it.
 *
 * WHY THE CHILD IS MOCKED. What actually needs proving is narrower than a
 * full render: that `NotFoundComponent` computes the RIGHT `onGoHome` prop
 * for `PageRouteMissing` (Meridian, unedited) once the injected session read
 * settles -- the one-line `window.location.assign(url)` inside that prop is
 * not this packet's logic to re-verify, and this repo has no working pattern
 * for observing it from jsdom anyway (checked; none of this suite's tests
 * do).
 */
import * as React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, mock, afterEach } from "bun:test";

let lastOnGoHome: (() => void) | undefined = "not called" as unknown as undefined;
// `mock.module` is process-wide in bun and outlives this file: a partial stub
// here left `boundary-states.test.tsx` reading a module with no
// `ShellReadFailed` whenever the two ran in one process (three full runs on
// 2026-09-03, green in isolation). So the mock keeps every real export and
// wraps only the one component this test observes, rendering the real thing
// underneath: any other file that lands on this module still sees Meridian.
// Snapshot the real exports BEFORE the mock registers: the namespace import is
// a live binding, and reading it inside the factory or the wrapper would hand
// back the mock itself (the wrapper calling the wrapper ran the process out of
// memory on the first try).
const realBoundaryStates = { ...(await import("@/components/meridian/boundary-states")) };
const RealPageRouteMissing = realBoundaryStates.PageRouteMissing;
mock.module("@/components/meridian/boundary-states", () => ({
  ...realBoundaryStates,
  PageRouteMissing: (props: React.ComponentProps<typeof RealPageRouteMissing>) => {
    lastOnGoHome = props.onGoHome;
    return <RealPageRouteMissing {...props} />;
  },
}));

const { NotFoundComponent } = await import("../__root");

afterEach(() => {
  cleanup();
  lastOnGoHome = "not called" as unknown as undefined;
});

describe("the root 404 knows whether a session exists", () => {
  it("passes an /start override to PageRouteMissing once a session is confirmed", async () => {
    render(<NotFoundComponent getSession={async () => ({ data: { session: { id: "u-1" } } })} />);
    await waitFor(() => {
      expect(screen.getByText("Go home")).toBeDefined();
    });
    expect(typeof lastOnGoHome).toBe("function");
  });

  it('passes no override while signed out, so PageRouteMissing\'s own default ("/") stands', async () => {
    render(<NotFoundComponent getSession={async () => ({ data: { session: null } })} />);
    await waitFor(() => {
      expect(screen.getByText("Go home")).toBeDefined();
    });
    expect(lastOnGoHome).toBeUndefined();
  });
});
