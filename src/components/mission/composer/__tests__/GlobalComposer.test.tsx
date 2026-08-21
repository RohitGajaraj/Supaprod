// GlobalComposer: Ask's mount point, and the guard that the palette stays gone.
//
// THIS FILE IS NOW A RETIREMENT GUARD. Cmd/Ctrl+J and Cmd/Ctrl+K used to open
// the SAME centred overlay, which is why Ask read "very bare": it was the
// command palette with a thread stapled above it. The palette was retired by
// ruling on 2026-08-21 and its overlay deleted
// (docs/decisions/palette-retired-2026-08.md), so every assertion below is
// NEGATIVE by design and that is the point:
//
//   supaprod:open-cmdk -> must open NOTHING. It was the palette's summon and
//     nothing in `src/` has ever dispatched it; this asserts that a stale
//     dispatcher appearing later still cannot resurrect the overlay.
//   Cmd/Ctrl+K and supaprod:open-ask -> AskPane, which owns its open state in
//     AskProvider. GlobalComposer only mounts it.
//
// Do not "fix" these tests by deleting them when they look tautological. A
// passing negative here is the evidence that the retirement held.
//
// AskPane is MOCKED here on purpose, and not only for isolation: it imports the
// approvals queue's server functions, which transitively load the Supabase
// modules that `-_auth.server.test.ts` mocks at import time. Pulling that graph
// in from this file broke six unrelated tests in the full run. A stub keeps this
// file about GlobalComposer, which is what it is for.
import * as React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import type { DictationState } from "@/hooks/use-voice";

let pathname = "/today";
// The room is identified by its MATCHED ROUTE ID, never by a path prefix: the
// room's URL moved from /m/<uuid> to /$workspaceSlug/$productSlug, and a
// pathname test would have gone quietly false there, mounting a second stream
// on the room's own conversation. The test asserts the route id, so it cannot
// keep passing against a URL shape that no longer exists.
let routeId = "/_authenticated/today";
const navigateSpy = mock((_: unknown) => {});

type RouterStateShape = {
  location: { pathname: string; search: Record<string, unknown> };
  matches: { routeId: string }[];
};

const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useRouterState: ({ select }: { select: (s: RouterStateShape) => unknown }) =>
    select({
      location: { pathname, search: {} },
      matches: [{ routeId: "/_authenticated" }, { routeId }],
    }),
  useNavigate: () => navigateSpy,
}));

// The room link the workspace context can build. Mutable so one test can take
// the slugs away and prove the legacy uuid URL is still the floor.
let workspaceState: Record<string, unknown> = {
  activeProductId: "p-1",
  activeWorkspaceId: "w-1",
  workspaces: [{ id: "w-1", slug: "helio-labs" }],
  products: [{ id: "p-1", workspace_id: "w-1", slug: "relay" }],
};

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => workspaceState,
}));

const dictation: DictationState = {
  supported: false,
  listening: false,
  interim: "",
  start: mock(() => {}),
  stop: mock(() => {}),
};
mock.module("@/hooks/use-voice", () => ({
  useDictation: () => dictation,
  useReadAloud: () => ({ supported: false, speakingId: null, toggle: () => {}, stop: () => {} }),
}));

/**
 * THE PANE HAS ITS OWN TESTS. Here it only has to be MOUNTABLE, so these tests
 * INJECT a stub through `GlobalComposer`'s `pane` prop rather than swapping the
 * module.
 *
 * IT USED TO STUB THE MODULE, and that quietly broke another suite.
 * `mock.module("@/components/ask/AskPane", …)` is not scoped to this file: it
 * swaps a process-wide registry entry. Whenever this file loaded before
 * `components/ask/__tests__/AskPane.test.tsx`, that suite imported THIS stub --
 * a bare div -- and its conversation-switcher tests failed against a pane that
 * structurally could not render a conversation. Three of four full-suite runs
 * were clean and the fourth failed three tests, from a file that does not
 * import the file that failed.
 *
 * The comment that used to sit here read "the pane has its own tests", which
 * was exactly right and exactly the problem: a module stub takes those tests
 * with it. A prop leaves the registry alone, so nothing here can reach another
 * file.
 */
const AskPaneStub = () => <div data-testid="ask-pane-stub" />;

/**
 * The dock reads live agents so its collapsed row can name a running one. That
 * is a react-query read, and these tests mount GlobalComposer without a
 * QueryClientProvider on purpose: what they are about is WHICH DOOR renders on
 * which route, not what the crew happens to be doing. Stubbed to idle, which is
 * also the state every assertion below cares about.
 */
mock.module("@/hooks/use-live-agents", () => ({
  useLiveAgents: () => ({ working: [], any: false }),
}));

const { GlobalComposer } = await import("../GlobalComposer");
const { AskProvider } = await import("@/lib/ask-context");

function mount() {
  return render(
    <AskProvider>
      <GlobalComposer pane={AskPaneStub} />
    </AskProvider>,
  );
}

beforeEach(() => {
  pathname = "/today";
  routeId = "/_authenticated/today";
  workspaceState = {
    activeProductId: "p-1",
    activeWorkspaceId: "w-1",
    workspaces: [{ id: "w-1", slug: "helio-labs" }],
    products: [{ id: "p-1", workspace_id: "w-1", slug: "relay" }],
  };
  navigateSpy.mockClear();
});

afterEach(cleanup);

describe("GlobalComposer: one door, and it is Ask", () => {
  test("mounts the Ask pane on an old-app route", () => {
    mount();
    expect(screen.getByTestId("ask-pane-stub")).toBeTruthy();
  });

  /**
   * THE PALETTE IS RETIRED, and these are the assertions that keep it retired.
   *
   * This file used to assert the opposite: that Cmd+K opened the palette
   * overlay and handed free text on to Ask. The founder rejected that on sight,
   * 2026-07-30: *"if I click on Ask or the shortcut Cmd+K, it still opens me
   * that old section... It does not open me the Ask panel. You need to ensure
   * that old one is gone."*
   *
   * A door labelled Ask that opens something that is not Ask is a lie about
   * itself, and the handoff was one extra press between a person and the thing
   * they came for. So the overlay is no longer rendered at all, and the only
   * summon on a rebuilt surface is Ask's own.
   */
  test("Cmd+K never opens the old overlay", () => {
    mount();
    act(() => {
      fireEvent.keyDown(window, { key: "k", metaKey: true });
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  // Belt and braces: even the palette's own legacy summon event finds nothing
  // to open, so a stale dispatcher somewhere cannot resurrect it.
  test("even the legacy palette event opens nothing", () => {
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("Ask's door does NOT open the palette", () => {
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("Cmd+J does NOT open the palette", () => {
    mount();
    act(() => {
      fireEvent.keyDown(window, { key: "j", metaKey: true });
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  /**
   * ASK NO LONGER STANDS DOWN ANYWHERE, AND THAT IS THE IMPROVEMENT.
   *
   * These two tests asserted the opposite: that Ask hid itself inside the room,
   * at both of the room's URLs. The reason was sound while the room existed.
   * It owned its own composer and Thread, and a second stream on the same
   * conversation would go stale mid-answer, so the shell composer withdrew.
   *
   * The room is retired. All three of its routes are redirect stubs to /today,
   * because it is the one unported legacy surface and it carries its own
   * five-region shell in the retired --ink- tokens. Nothing renders there to
   * stand down for, and a person who follows an old link arrives on Today with
   * Ask exactly where it is on every other surface.
   *
   * That is the founder ruling this feature was built on, finally true without
   * an exception: ONE door, and it is Ask. The stand-down was the last place in
   * the product where the answer to "where do I ask" changed depending on which
   * URL you were standing on.
   */
  test("is present at the room's old readable URL, which now lands on Today", () => {
    pathname = "/helio-labs/relay";
    routeId = "/_authenticated/$workspaceSlug/$productSlug";
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(screen.queryByTestId("ask-pane-stub")).not.toBe(null);
  });

  test("is present at the room's old uuid URL too", () => {
    pathname = "/m/p-1";
    routeId = "/_authenticated/m/$productId";
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(screen.queryByTestId("ask-pane-stub")).not.toBe(null);
  });
});
