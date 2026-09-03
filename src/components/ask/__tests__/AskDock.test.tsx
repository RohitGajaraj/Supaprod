/**
 * P-18b (A-QUEUE.md). THE DOCK MUST NEVER CLAIM WHAT THE BAR DENIES.
 *
 * At 06:45 IST the shell's own top bar read "Nothing running" while this
 * dock's right-hand line, on the very same screen, read "Review is working
 * on Checkout asks for already-save…" -- two readers, one fact, two answers.
 * P-18/P-18a already fixed the bar (`genuinely-working.ts`): a mission only
 * counts as working once its OWN TRACK also shows up in the real
 * `agent_runs`-backed moving set, never from `missions.status` alone, which
 * can go stale independently of the work it names. `useLiveAgents` now runs
 * the same cross-check (`use-live-agents.ts`).
 *
 * THIS RENDERS THE ACTUAL DOCK against `useLiveAgents`'s own RESULT SHAPE,
 * not a source scan of its text, and not a second `mock.module` of
 * `@/lib/missions.functions`/`@/lib/spine/track.functions` two layers down.
 * `AskPane.test.tsx` already mocks `@/lib/missions.functions`
 * process-wide (Bun's `mock.module` persists for the whole run --
 * `a-module-mock-is-process-wide.test.ts`), so a second file mocking it here
 * would be exactly the collision that guard exists to catch. `AskDock`'s own
 * `liveAgents` prop (added alongside this test, same seam as `pane`) injects
 * the hook's RESULT instead, so this file never touches either module.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach, mock } from "bun:test";
import type { LiveAgents } from "@/hooks/use-live-agents";

// AskProvider (the dock always needs one, `useAsk` throws without it) reads
// `useRouterState` for the current scope. A minimal, static mock is enough:
// nothing in these tests opens the pane or depends on navigation. Already in
// `a-module-mock-is-process-wide.test.ts`'s `KNOWN_SHARED` list, so this does
// not grow that ratchet.
type RouterStateShape = {
  location: { pathname: string; search: Record<string, unknown> };
  matches: { routeId: string }[];
};
const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useRouterState: ({ select }: { select: (s: RouterStateShape) => unknown }) =>
    select({
      location: { pathname: "/start", search: {} },
      matches: [{ routeId: "/_authenticated" }, { routeId: "/_authenticated/start" }],
    }),
  useNavigate: () => () => {},
}));

const { AskDock } = await import("../AskDock");
const { AskProvider } = await import("@/lib/ask-context");

const Stub = () => <div data-testid="pane-stub" />;

const EMPTY: LiveAgents = { working: [], any: false, lastDone: null };

function mount(liveAgents: () => LiveAgents = () => EMPTY) {
  return render(
    <AskProvider>
      <AskDock pane={Stub} liveAgents={liveAgents} />
    </AskProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("case (a): the reproduction -- a running mission, zero moving tracks", () => {
  test("the dock never says an agent is working", () => {
    // The cross-check happens inside `useLiveAgents` itself (its own unit
    // coverage owns that); here the seam is already the hook's OUTPUT, so
    // the reproduction is just: nothing genuinely working.
    mount(() => EMPTY);
    const dock = screen.getByTestId("ask-dock");
    expect(dock.textContent).not.toMatch(/is working/);
  });
});

describe("case (b): a mission whose own track is genuinely moving", () => {
  test("the dock says the agent is working, by name and title", () => {
    mount(() => ({
      working: [
        {
          missionId: "m1",
          title: "Checkout asks for already-saved address",
          slug: "reviewer",
          name: "Review",
          subGoal: null,
        },
      ],
      any: true,
      lastDone: null,
    }));

    const dock = screen.getByTestId("ask-dock");
    expect(dock.textContent).toMatch(/is working/);
    expect(dock.textContent).toContain("Checkout asks for already-saved address");
  });
});

describe("nothing moving, but something has finished -- past tense, not silence", () => {
  test("the dock names the last finished mission instead of going quiet", () => {
    mount(() => ({
      working: [],
      any: false,
      lastDone: { title: "Batch firmware push scheduler", completedAt: "2026-09-02T10:05:00Z" },
    }));

    const dock = screen.getByTestId("ask-dock");
    expect(dock.textContent).toContain("Batch firmware push scheduler");
    expect(dock.textContent).toMatch(/finished/);
    expect(dock.textContent).not.toMatch(/is working/);
  });
});

describe("nothing running, nothing ever finished -- the invitation alone", () => {
  test("the dock names neither a working agent nor a finished one", () => {
    mount(() => EMPTY);
    const dock = screen.getByTestId("ask-dock");
    expect(dock.textContent).not.toMatch(/is working|finished/);
    expect(dock.textContent).toContain("Ask about your work");
  });
});
