// GlobalComposer: the mount point for the two summons on old-app surfaces.
//
// THE CONTRACT CHANGED, and these tests changed with it. Cmd/Ctrl+J and
// Cmd/Ctrl+K used to open the SAME centred overlay, which is why Ask was "very
// bare": it was the command palette with a thread stapled above it. They are
// two surfaces again:
//
//   Cmd/Ctrl+K and supaprod:open-cmdk -> the palette overlay, tested here.
//   Cmd/Ctrl+J and supaprod:open-ask  -> AskPane, which owns its open state in
//     AskProvider. GlobalComposer only mounts it, so the cases that used to
//     assert "open-ask opens the overlay" now assert the opposite: the palette
//     must NOT answer Ask's door, or one key press opens two panels.
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

// The pane has its own tests. Here it only has to be mountable.
mock.module("@/components/ask/AskPane", () => ({
  AskPane: () => <div data-testid="ask-pane-stub" />,
}));

const { GlobalComposer } = await import("../GlobalComposer");
const { AskProvider } = await import("@/lib/ask-context");

function mount() {
  return render(
    <AskProvider>
      <GlobalComposer />
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

describe("GlobalComposer: two summons, two surfaces", () => {
  test("mounts the Ask pane on an old-app route", () => {
    mount();
    expect(screen.getByTestId("ask-pane-stub")).toBeTruthy();
  });

  test("the palette door (supaprod:open-cmdk) opens the palette overlay", () => {
    mount();
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
    expect(screen.getByLabelText("Ask Supaprod anything")).toBeTruthy();
  });

  test("Cmd+K toggles the palette", () => {
    mount();
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.getByTestId("composer-overlay")).toBeTruthy();
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  // The regression this file exists to prevent from coming back: one key press
  // must not open two panels, and Ask's door must not land on the palette.
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

  test("stands down inside the room at its readable URL", () => {
    pathname = "/helio-labs/relay";
    routeId = "/_authenticated/$workspaceSlug/$productSlug";
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    expect(screen.queryByTestId("ask-pane-stub")).toBe(null);
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("stands down inside the room at its legacy uuid URL too", () => {
    pathname = "/m/p-1";
    routeId = "/_authenticated/m/$productId";
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("a journey chip navigates into the room with the journey and its first stage", () => {
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    fireEvent.click(document.querySelector('button[data-journey="j3"]')!);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/$workspaceSlug/$productSlug",
      params: { workspaceSlug: "helio-labs", productSlug: "relay" },
      search: { stage: "plan", journey: "j3" },
    });
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });

  test("a product with no slug yet still opens, through the legacy uuid URL", () => {
    workspaceState = {
      activeProductId: "p-1",
      activeWorkspaceId: "w-1",
      workspaces: [{ id: "w-1", slug: "helio-labs" }],
      products: [{ id: "p-1", workspace_id: "w-1", slug: null }],
    };
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    fireEvent.click(document.querySelector('button[data-journey="j3"]')!);
    expect(navigateSpy).toHaveBeenCalledWith({
      to: "/m/$productId",
      params: { productId: "p-1" },
      search: { stage: "plan", journey: "j3" },
    });
  });

  // Free text in the palette is a QUESTION, and Ask is the surface that answers
  // one. The palette used to stream it itself, which is how two surfaces became
  // one box. It hands it over now, carrying the text.
  test("free text leaves the palette and lands in Ask, carrying the question", () => {
    mount();
    act(() => {
      window.dispatchEvent(new CustomEvent("supaprod:open-cmdk"));
    });
    const handed: string[] = [];
    const onAsk = (e: Event) => {
      const intent = (e as CustomEvent<{ intent?: string }>).detail?.intent;
      if (intent) handed.push(intent);
    };
    window.addEventListener("supaprod:open-ask", onAsk);
    const box = screen.getByLabelText("Ask Supaprod anything");
    fireEvent.change(box, { target: { value: "why did churn spike" } });
    fireEvent.keyDown(box, { key: "Enter" });
    window.removeEventListener("supaprod:open-ask", onAsk);
    expect(handed).toEqual(["why did churn spike"]);
    expect(screen.queryByTestId("composer-overlay")).toBe(null);
  });
});
