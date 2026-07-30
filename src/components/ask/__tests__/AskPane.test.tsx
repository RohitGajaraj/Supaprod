/**
 * The pane, and specifically the two things the founder called out on
 * 2026-07-30: that opening Ask showed something "very bare and very lean", and
 * that nobody could tell where Ask ended and Threads began.
 *
 * So the assertions here are about the OPENING state and the SCOPE CHIP, plus
 * the rule that outranks both: a record citation is never invented.
 */
import * as React from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import type { AskStreamMsg } from "@/lib/ask-stream-core";

let pathname = "/today";
let search: Record<string, unknown> = {};

type RouterStateShape = {
  location: { pathname: string; search: Record<string, unknown> };
  matches: { routeId: string }[];
};

const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useRouterState: ({ select }: { select: (s: RouterStateShape) => unknown }) =>
    select({ location: { pathname, search }, matches: [{ routeId: "/_authenticated" }] }),
  useNavigate: () => () => {},
  // A real Link wants a router context the pane does not have in a unit test.
  Link: ({ children, ...rest }: { children?: React.ReactNode; to?: string }) => (
    <a href={rest.to}>{children}</a>
  ),
}));

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({
    activeWorkspace: { id: "w-1", name: "Helio Labs" },
    activeWorkspaceId: "w-1",
    activeProductId: "p-1",
  }),
}));

mock.module("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { email: "rg@example.com" } } }) },
  },
}));

let queueItems: ApprovalQueueItem[] = [];
let queueThrows = false;
mock.module("@/lib/approvals-queue.functions", () => ({
  getApprovalsQueue: async () => {
    if (queueThrows) throw new Error("no");
    return { items: queueItems };
  },
  decideApprovalItem: async () => ({ ok: true }),
  snoozeApprovalItem: async () => ({ ok: true, snoozedUntil: new Date().toISOString() }),
}));

// Spread the real module: replacing it wholesale drops `createServerFn`, which
// every `.functions.ts` in the graph calls at import time.
const startActual = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...startActual,
  useServerFn: (fn: unknown) => fn,
}));

let messages: AskStreamMsg[] = [];
const sendIntent = mock((_: string) => {});
mock.module("@/hooks/use-ask-stream", () => ({
  useAskStream: () => ({
    messages,
    streaming: false,
    liveStatus: null,
    sendIntent,
    retry: () => {},
    startNewConversation: () => {},
    promote: () => {},
    promotedByMsg: {},
    startProjectFromIntent: async () => {},
    startingProject: false,
    dictation: { supported: false, listening: false, interim: "", start: () => {}, stop: () => {} },
    readAloud: { supported: false, speakingId: null, toggle: () => {}, stop: () => {} },
    scopeKey: "product:p-1",
    conversationId: null,
  }),
}));

const { AskPane } = await import("../AskPane");
const { AskProvider } = await import("@/lib/ask-context");

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AskProvider>
        <AskPane />
      </AskProvider>
    </QueryClientProvider>,
  );
}

async function open() {
  const r = mount();
  await act(async () => {
    window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
    await Promise.resolve();
  });
  return r;
}

beforeEach(() => {
  pathname = "/today";
  search = {};
  queueItems = [];
  queueThrows = false;
  messages = [];
  sendIntent.mockClear();
});
afterEach(cleanup);

describe("AskPane: it is summoned, not permanent", () => {
  test("draws nothing until something opens it", () => {
    mount();
    expect(screen.queryByTestId("ask-pane")).toBe(null);
  });

  test("the shared door opens it", async () => {
    await open();
    expect(screen.getByTestId("ask-pane")).toBeTruthy();
  });

  // It sits BESIDE the work, not over it. A dialog would take the screen away,
  // and the screen is the thing being asked about.
  test("it is a complementary region, never a modal", async () => {
    await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.getAttribute("role")).toBe("complementary");
    expect(pane.getAttribute("aria-modal")).toBeNull();
  });
});

describe("AskPane: the scope chip is real", () => {
  test("on a run it names the run", async () => {
    pathname = "/runs/11111111-2222-3333-4444-555555555555";
    await open();
    expect(screen.getAllByText("this run").length).toBeGreaterThan(0);
  });

  test("on a decision it names the decision", async () => {
    pathname = "/brain";
    search = { decision: "d-3" };
    await open();
    expect(screen.getAllByText("this decision").length).toBeGreaterThan(0);
  });

  // "Otherwise the workspace", and by NAME, which a person recognises.
  test("everywhere else it names the workspace", async () => {
    pathname = "/today";
    await open();
    expect(screen.getAllByText("Helio Labs").length).toBeGreaterThan(0);
  });

  test("the composer asks about the same thing the chip names", async () => {
    pathname = "/runs/11111111-2222-3333-4444-555555555555";
    await open();
    expect(screen.getByLabelText("Ask about this run")).toBeTruthy();
  });
});

describe("AskPane: the emptiest realistic state", () => {
  test("reports rather than greets, and says where the conversation goes", async () => {
    await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.textContent).toContain("Ask about");
    expect(pane.textContent).toContain("Threads");
    // Never a greeting. The first line is a fact.
    expect(pane.textContent).not.toContain("Hi ");
    expect(pane.textContent).not.toContain("Welcome");
  });

  test("says plainly that nothing needs you, rather than drawing an empty box", async () => {
    await open();
    expect(screen.getByTestId("ask-pane").textContent).toContain("Nothing needs your call here");
  });

  // A failed read is a DIFFERENT fact from nothing waiting, and a person acts
  // differently on each.
  test("a failed queue read never wears the empty state's clothes", async () => {
    queueThrows = true;
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).toContain("could not read what is waiting");
    expect(text).not.toContain("Nothing needs your call here");
    r.unmount();
  });
});

describe("AskPane: the record register", () => {
  const answered = (over: Partial<AskStreamMsg> = {}): AskStreamMsg[] => [
    { id: "u1", role: "user", content: "what happened", at: 1 },
    { id: "a1", role: "assistant", content: "It merged.", at: 2, ...over },
  ];

  test("is absent when the answer cited nothing", async () => {
    messages = answered();
    await open();
    expect(screen.queryByText("From the record")).toBe(null);
  });

  test("appears, with the fact, when a server-resolved block backs it", async () => {
    messages = answered({
      blocks: [
        {
          kind: "decision",
          id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          title: "Fix it in the caller",
          status: "approved",
          rationale: null,
          decidedBy: null,
          sourceKind: "manual",
          createdAt: "2026-03-14T09:00:00.000Z",
        },
      ],
    });
    await open();
    expect(screen.getByText("From the record")).toBeTruthy();
    expect(screen.getByTestId("ask-pane").textContent).toContain("Fix it in the caller");
  });

  // The honest absence. It is a muted LINE, never the lit recess: the one lit
  // surface in the product stays reserved for a fact the record can be quoted on.
  test("says the record held nothing, when it can actually read that", async () => {
    messages = answered({
      meta: {
        model: "m",
        via: "gateway",
        latency_ms: 1,
        tokens_in: 1,
        tokens_out: 1,
        cost_usd: 0,
        sources: [],
        web_used: false,
        workspace_chunks: 0,
      },
    });
    await open();
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).toContain("The record has nothing on this yet");
    expect(screen.queryByText("From the record")).toBe(null);
  });
});

describe("AskPane: the fork is visible before you commit", () => {
  test("the send control says which of the two is about to happen", async () => {
    await open();
    // Nothing typed: the pane offers the safe one and does not spend anything.
    // The word appears twice on the surface (the pane is called Ask), so this
    // asserts the CONTROL, which is the thing that commits.
    const send = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("data-variant") === "primary");
    expect(send?.textContent).toContain("Ask");
    expect(send?.textContent).not.toContain("Hand it over");
  });

  test("a gate that is genuinely waiting is settleable here, not linked to", async () => {
    queueItems = [
      {
        id: "decision:x",
        kindKey: "decision",
        sourceId: "x",
        filterBucket: "gates",
        kind: "PROPOSAL",
        title: "Ship the caller fix",
        evidence: ["Two of three checks passed."],
        approveConsequence: "Approve · it goes out",
        rejectConsequence: "Reject · it stays put",
        projectId: null,
        projectName: null,
      } as ApprovalQueueItem,
    ];
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    expect(screen.getByText("Approve")).toBeTruthy();
    expect(screen.getByTestId("ask-pane").textContent).toContain("Ship the caller fix");
    r.unmount();
  });
});
