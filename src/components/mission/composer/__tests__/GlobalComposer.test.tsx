// GlobalComposer: the ONE summon on old-app surfaces. The overlay must open
// from the shared supaprod:open-ask / supaprod:open-cmdk events and from the
// Cmd/Ctrl+J and Cmd/Ctrl+K keys, must stand down inside the Mission Control
// room (/m/$productId owns its composer), and a journey chip must navigate
// into the room with the journey and its first stage.
//
// mock.module isolates the live seams (router, workspace, ask stream) the
// way DecisionsPanel.test.tsx established for query-backed components.
import * as React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import type { DictationState, ReadAloudState } from "@/hooks/use-voice";

let pathname = "/today";
// The room is identified by its MATCHED ROUTE ID, never by a path prefix: the
// room's URL moved from /m/<uuid> to /$workspaceSlug/$productSlug, and a
// pathname test would have gone quietly false there, mounting a second stream
// on the room's own conversation. The test asserts the route id, so it cannot
// keep passing against a URL shape that no longer exists.
let routeId = "/_authenticated/today";
const navigateSpy = mock((_: unknown) => {});

type RouterStateShape = { location: { pathname: string }; matches: { routeId: string }[] };

const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useRouterState: ({ select }: { select: (s: RouterStateShape) => unknown }) =>
    select({ location: { pathname }, matches: [{ routeId: "/_authenticated" }, { routeId }] }),
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
const readAloud: ReadAloudState = {
  supported: false,
  speakingId: null,
  toggle: mock(() => {}),
  stop: mock(() => {}),
};
const sendIntent = mock((_: string) => {});

mock.module("@/hooks/use-ask-stream", () => ({
  useAskStream: () => ({
    messages: [],
    streaming: false,
    liveStatus: null,
    sendIntent,
    retry: mock(() => {}),
    startNewConversation: mock(() => {}),
    promote: mock(() => {}),
    promotedByMsg: {},
    startProjectFromIntent: mock(async () => {}),
    startingProject: false,
    dictation,
    readAloud,
    scopeKey: "product:p-1",
    conversationId: null,
  }),
}));

const { GlobalComposer } = await import("../GlobalComposer");

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
  sendIntent.mockClear();
});

afterEach(cleanup);

describe("GlobalComposer: the global summon on old-app surfaces", () => {
  test("the supaprod:open-ask event opens the overlay on an old-app route", () => {
    render(<GlobalComposer />);
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
    // The overlay holds THE one input box.
    expect(screen.getByLabelText("Ask Supaprod anything")).toBeTruthy();
  });

  test("an event that carries an intent streams it right away", () => {
    render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("supaprod:open-ask", { detail: { intent: "why did churn spike" } }),
      );
    });
    expect(sendIntent).toHaveBeenCalledWith("why did churn spike");
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
  });

  test("the old palette door (supaprod:open-cmdk) opens the same overlay", () => {
    render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
  });

  test("Cmd+J and Cmd+K both toggle the overlay", () => {
    render(<GlobalComposer />);
    act(() => {
      fireEvent.keyDown(window, { key: "j", metaKey: true });
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
    act(() => {
      fireEvent.keyDown(window, { key: "j", metaKey: true });
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
  });

  test("stands down inside the room at its readable URL", () => {
    pathname = "/helio-labs/relay";
    routeId = "/_authenticated/$workspaceSlug/$productSlug";
    const { container } = render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(container.firstChild).toBe(null);
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("stands down inside the room at its legacy uuid URL too", () => {
    pathname = "/m/p-1";
    routeId = "/_authenticated/m/$productId";
    const { container } = render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    expect(container.firstChild).toBe(null);
  });

  test("a journey chip navigates into the room with the journey and its first stage", () => {
    render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    fireEvent.click(document.querySelector('button[data-journey="j3"]')!);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/$workspaceSlug/$productSlug",
      params: { workspaceSlug: "helio-labs", productSlug: "relay" },
      search: { stage: "plan", journey: "j3" },
    });
    // Activation closes the overlay; the room takes over.
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("a product with no slug yet still opens, through the legacy uuid URL", () => {
    workspaceState = {
      activeProductId: "p-1",
      activeWorkspaceId: "w-1",
      workspaces: [{ id: "w-1", slug: "helio-labs" }],
      products: [{ id: "p-1", workspace_id: "w-1", slug: null }],
    };
    render(<GlobalComposer />);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    });
    fireEvent.click(document.querySelector('button[data-journey="j3"]')!);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/m/$productId",
      params: { productId: "p-1" },
      search: { stage: "plan", journey: "j3" },
    });
  });
});
