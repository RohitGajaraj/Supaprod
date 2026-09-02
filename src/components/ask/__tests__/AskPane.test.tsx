/**
 * The pane, and specifically the two things the founder called out on
 * 2026-07-30: that opening Ask showed something "very bare and very lean", and
 * that nobody could tell where Ask ended and Threads began.
 *
 * So the assertions here are about the OPENING state and the SCOPE CHIP, plus
 * the rule that outranks both: a record citation is never invented.
 */
import * as React from "react";
import { render, screen, cleanup, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import type { AskStreamMsg } from "@/lib/ask-stream-core";
import type { ThreadSummary } from "@/lib/threads.functions";
import { threadsMock, resetThreadsMock, threadsModuleMock } from "@/lib/testing/threads-mock";
import type { DictationState } from "@/hooks/use-voice";

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

// The switcher reads the SAME server function `/threads` does; nothing new was
// written for it, so the mock is that one read.
//
// THROUGH THE SHARED STORE, not a literal here. `mock.module` is process-wide
// and is only observed when a consumer is FIRST imported, so whichever test
// file mounts AskPane first decides what AskPane sees for the whole run. That
// is not hypothetical: escape-layers.test.tsx mounts this pane to test Escape
// ordering, loaded it first, and these switcher tests started failing in the
// full suite while passing on their own. See src/lib/testing/threads-mock.ts.
mock.module("@/lib/threads.functions", () => threadsModuleMock());

// The way in is built from real runs, so the pane reads the SAME missions the
// rail counts. Grounded suggestions need a grounding source in the test too.
let missionRows: { title: string; status: string; completed_at: string | null }[] = [];
let missionsThrow = false;
mock.module("@/lib/missions.functions", () => ({
  listMissions: async () => {
    if (missionsThrow) throw new Error("no");
    return { missions: missionRows };
  },
}));

let messages: AskStreamMsg[] = [];
let streaming = false;
let liveStatus: { phase: string; label: string } | null = null;
const sendIntent = mock((_: string) => {});
const startNewConversation = mock(() => {});
const startDictation = mock(() => {});
const stopDictation = mock(() => {});
let dictation: DictationState;
mock.module("@/hooks/use-ask-stream", () => ({
  useAskStream: () => ({
    messages,
    streaming,
    liveStatus,
    sendIntent,
    retry: () => {},
    startNewConversation,
    promote: () => {},
    promotedByMsg: {},
    startProjectFromIntent: async () => {},
    startingProject: false,
    dictation,
    readAloud: { supported: false, speakingId: null, toggle: () => {}, stop: () => {} },
    scopeKey: "product:p-1",
    conversationId: null,
    /**
     * `work` IS PART OF THE HOOK'S CONTRACT AND THIS MOCK HAD DRIFTED OFF IT.
     *
     * The real hook always returns it -- `NO_WORK` is a frozen default returned
     * by identity so a memoised consumer sees no change while no frame is on
     * the wire -- so `stream.work` is never undefined in the product. This mock
     * simply predated the field, and the moment AskPane read it, fourteen tests
     * died on `undefined is not an object`.
     *
     * Filled in rather than answered with `?.` in the component. Optional
     * chaining there would have made the production code defend against a state
     * the hook cannot produce, and hidden the fact that a mock had stopped
     * describing the thing it stands in for. A mock that has drifted is a test
     * suite asserting against a contract nobody ships.
     */
    work: { station: null, tools: [], landings: [] },
    /**
     * THE PLAN GATE'S THREE, and the paragraph above is the reason they are
     * here rather than defended against in the pane.
     *
     * The real hook always returns all three: two maps that are empty on every
     * turn that did not publish a plan, and the action that answers one. The
     * pane reads them by message id, so an absent map is `undefined[id]` and
     * kills the render — which is exactly how `work` broke fourteen tests the
     * last time this mock fell behind the contract.
     */
    proposalByMsg: {},
    planDecisionByMsg: {},
    decidePlan: () => {},
  }),
}));

const { WORKING_EFFORT_WORDS } = await import("../Working");
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
  streaming = false;
  liveStatus = null;
  missionRows = [];
  missionsThrow = false;
  resetThreadsMock();
  dictation = {
    supported: false,
    listening: false,
    interim: "",
    start: startDictation,
    stop: stopDictation,
  };
  sendIntent.mockClear();
  startNewConversation.mockClear();
  startDictation.mockClear();
  stopDictation.mockClear();
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
    pathname = "/outcomes";
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

/** One real, genuinely-waiting gate out of `getApprovalsQueue`. */
const gate = (over: Partial<ApprovalQueueItem> = {}): ApprovalQueueItem =>
  ({
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
    ...over,
  }) as ApprovalQueueItem;

describe("AskPane: the emptiest realistic state", () => {
  test("reports rather than greets, and says where the conversation goes", async () => {
    await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.textContent).toContain("Ask about");
    expect(pane.textContent).toContain("Conversations");
    // Never a greeting. The first line is a fact.
    expect(pane.textContent).not.toContain("Hi ");
    expect(pane.textContent).not.toContain("Welcome");
  });

  /**
   * ASK DOES NOT CARRY THE QUEUE. Founder ruling 2026-07-30: "approval should
   * not go under Ask... If I click Ask, it should open a fresh window, no
   * approvals waiting for me, nothing like that."
   *
   * The queue is still READ (an answer that is about a gate settles it inline),
   * so this asserts the display rule and not the absence of the read: with a
   * real, genuinely-waiting gate in the workspace, a fresh conversation shows
   * no trace of it. Not the card, not the count, and not the "all clear" line
   * that used to stand in its place, which is still Ask answering a question
   * nobody asked.
   */
  test("a fresh conversation shows no approvals at all, even when some are waiting", async () => {
    queueItems = [gate()];
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).not.toContain("Ship the caller fix");
    expect(text).not.toContain("Waiting on you");
    expect(screen.queryByText("Approve")).toBe(null);
    // Nor the old all-clear, which was the same surface making the same claim.
    expect(text).not.toContain("Nothing needs your call here");
    r.unmount();
  });

  /**
   * THE WAY IN KNOWS THE WORKSPACE. Founder ruling, same day: the suggestions
   * must be "aligned with the product, what it is working on", never "just
   * blind one".
   */
  test("the suggestions name a run that genuinely exists", async () => {
    missionRows = [{ title: "Ship SSO login for Beacon", status: "running", completed_at: null }];
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    expect(screen.getByTestId("ask-pane").textContent).toContain("Ship SSO login for Beacon");
    r.unmount();
  });

  // A failed read is a DIFFERENT fact from nothing running, and the failure
  // mode this guards is the tempting one: quietly falling back to a generic
  // suggestion, which is indistinguishable from a grounded one and therefore
  // teaches people that none of them are grounded.
  test("a failed read says so, and never invents a suggestion to fill the space", async () => {
    missionsThrow = true;
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).toContain("could not read what is running");
    expect(text).not.toContain("Nothing has run in this workspace yet");
    expect(text).not.toContain("A way in");
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
    // asserts the CONTROL, which is the thing that commits. The control moved
    // onto Meridian's Action, which carries no data-variant attribute; the
    // locator now keys on the Meridian marker plus the verb itself.
    const send = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("data-mrd") !== null)
      .find((b) => (b.textContent ?? "").includes("Ask"));
    expect(send).toBeTruthy();
    expect(send?.textContent).toContain("Ask");
    expect(send?.textContent).not.toContain("Hand it over");
  });

  /**
   * THE OTHER HALF OF THE APPROVALS RULING, and the half that makes it a
   * relocation rather than a deletion: "when some conversation happens, user
   * triggers conversation asking about certain things, what is waiting for me,
   * where the action needs to be taken, then you can display those cards."
   *
   * Asked, the card appears WITH ITS REAL RESOLVER, settleable in place. Ask is
   * not a ChatGPT clone that answers with a link to where the button lives.
   */
  test("asked what is waiting, the gate is drawn here and settleable here", async () => {
    queueItems = [gate()];
    messages = [
      { id: "u1", role: "user", content: "what is waiting on me?", at: 1 },
      { id: "a1", role: "assistant", content: "One call.", at: 2 },
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

/**
 * The archive had exactly ONE live inbound link in the whole app, buried in a
 * sentence in this pane, which is why the founder concluded it did not exist.
 * These assert the door is a control, that it is the only one, and that the
 * switcher is the shallow half of one idea rather than a rival to `/threads`.
 */
describe("AskPane: the conversation switcher", () => {
  const thread = (over: Partial<ThreadSummary> = {}): ThreadSummary => ({
    id: "11111111-2222-3333-4444-555555555555",
    title: "Why the caller fix shipped",
    updatedAt: new Date().toISOString(),
    snippet: "Because two of three checks passed.",
    productId: "p-1",
    folderId: null,
    lastRole: "assistant",
    inBrain: false,
    waiting: false,
    ...over,
  });

  /**
   * Open the pane, open the switcher, and WAIT FOR THE READ TO SETTLE rather
   * than for a number of milliseconds.
   *
   * THE DEFECT THIS ENDS, and it is worth the paragraph because it read as a
   * regression in the switcher and was not one. This used to be
   * `await new Promise((res) => setTimeout(res, 10))`, which does not wait for
   * anything: it is a bet that `listThreads` resolves AND React commits the
   * result inside ten milliseconds. The switcher needs two macrotask ticks
   * after the click -- the click's render is what MOUNTS `AskSwitcher` and
   * therefore what starts the query, so the resolution can only commit on the
   * tick after that -- and one commit of this tree costs 10-25ms under
   * happy-dom. The bet was won or lost by a hair depending on machine load,
   * and the three tests that read the settled list failed roughly one run in
   * three.
   *
   * Then the tree got heavier and the bet started losing every time, so three
   * tests went from flaky to red together and looked like something had broken
   * the switcher. Nothing had. Measured on the same commit, the read settles in
   * 13-26ms and every assertion below passes; the tests were simply reading the
   * pane while it still said "Reading your conversations." A timing bet that
   * has drifted onto the wrong side of its deadline reports itself as a
   * behavioural failure, which is the most expensive kind of false alarm.
   *
   * `waitFor` polls for the condition instead of guessing at a duration, so
   * these read the settled state on any machine and at any tree size.
   */
  async function openSwitcher() {
    const r = await open();
    await act(async () => {
      screen.getByText("Conversations").click();
    });
    // Settled means the read is OVER, whichever way it went: rows, the empty
    // state, or the failure. Waiting on any one of those three would make the
    // other two hang for the full timeout instead of failing on their own
    // assertion, which is the difference between a useful failure and a slow one.
    await waitFor(() => {
      const pane = screen.getByTestId("ask-pane");
      expect(pane.textContent).toContain("Recent");
      expect(pane.textContent).not.toContain("Reading your conversations");
    });
    return r;
  }

  test("the door is a control in the chrome, not a word in a paragraph", async () => {
    await open();
    const door = screen.getByText("Conversations");
    expect(door.tagName).toBe("BUTTON");
    expect(door.getAttribute("aria-expanded")).toBe("false");
  });

  test("it opens in place and lists what was already asked", async () => {
    threadsMock.rows = [thread()];
    const r = await openSwitcher();
    expect(screen.getByText("Conversations").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("ask-pane").textContent).toContain("Why the caller fix shipped");
    r.unmount();
  });

  // The label is "Start fresh" and not the obvious "New conversation" for a
  // reason worth a test: that string is the DEFAULT title of every thread
  // nobody renamed, so the button would have worn the same words as the rows.
  test("starting fresh is one press, and it is not the primary", async () => {
    threadsMock.rows = [thread({ title: "New conversation" })];
    const r = await openSwitcher();
    expect(screen.getAllByText("New conversation").length).toBe(1);
    const fresh = screen.getByText("Start fresh");
    expect(fresh.getAttribute("data-variant")).not.toBe("primary");
    await act(async () => {
      fresh.click();
    });
    expect(startNewConversation).toHaveBeenCalled();
    r.unmount();
  });

  // Two DEPTHS of one idea. The recent list is the fast path; the archive is
  // where search lives, and it is reached from inside the switcher rather than
  // competing with it.
  test("the full archive is one row down, and it is the only other way there", async () => {
    const r = await openSwitcher();
    const pane = screen.getByTestId("ask-pane");
    const out = [...pane.querySelectorAll("a")].filter(
      (a) => a.getAttribute("href") === "/threads",
    );
    expect(out.length).toBe(1);
    expect(out[0].textContent).toContain("All conversations");
    r.unmount();
  });

  test("a failed read says so, and never wears the empty state's clothes", async () => {
    threadsMock.throws = true;
    const r = await openSwitcher();
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).toContain("could not read your conversations");
    expect(text).not.toContain("Nothing asked yet");
    r.unmount();
  });
});

/**
 * The mic existed in `use-voice.ts` and was handed to the UI by
 * `use-ask-stream.ts`; no surface in the new shell drew it. It is drawn now,
 * and the one rule that matters is that it is ABSENT rather than dead where the
 * browser cannot hear.
 */
describe("AskPane: the mic", () => {
  test("no control at all where the browser has no speech recognition", async () => {
    await open();
    expect(screen.queryByLabelText("Start dictation")).toBe(null);
    expect(screen.queryByLabelText("Stop dictation")).toBe(null);
  });

  test("it starts, and it is stoppable", async () => {
    dictation = { ...dictation, supported: true };
    const r = await open();
    await act(async () => {
      screen.getByLabelText("Start dictation").click();
    });
    expect(startDictation).toHaveBeenCalled();
    r.unmount();
  });

  /**
   * A GLYPH, AND THE NAME STILL SAYS WHICH WAY THE NEXT PRESS GOES (founder
   * ruling 2026-07-30). The word is gone from the screen and must NOT be gone
   * from the accessibility tree: a wordless control with no accessible name is
   * a control only sighted mouse users have.
   */
  test("it is a glyph with a name, not a word", async () => {
    dictation = { ...dictation, supported: true };
    const r = await open();
    const mic = screen.getByLabelText("Start dictation");
    expect(mic.textContent).toBe("");
    expect(mic.querySelector("svg")).toBeTruthy();
    r.unmount();
  });

  test("listening shows the live transcript, and the name flips, never a blink", async () => {
    dictation = { ...dictation, supported: true, listening: true, interim: "what changed in" };
    const r = await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.textContent).toContain("what changed in");
    expect(screen.getByLabelText("Stop dictation").getAttribute("aria-pressed")).toBe("true");
    // The only blink in the system is `gate`, and nothing here may take it.
    expect(pane.querySelector('[data-state="gate"]')).toBe(null);
    r.unmount();
  });
});

/**
 * THE BIGGEST ONE. The founder, reading a real answer: "it is showing in form of
 * hash and asterisk for headers and highlights... We should not display anything
 * in form of hash and hashtags. See how PERMANENTLY we can solve this."
 *
 * These assert the RENDERED RESULT rather than the presence of a library, and
 * the streaming case specifically, because a surface that renders Markdown only
 * once the answer settles shows raw hashes for the whole time a person is
 * actually watching it.
 */
describe("AskPane: the crew's words are read, not printed", () => {
  const withAnswer = (content: string): AskStreamMsg[] => [
    { id: "u1", role: "user", content: "summarise it", at: 1 },
    { id: "a1", role: "assistant", content, at: 2 },
  ];

  test("a heading is a heading, and the hashes are gone", async () => {
    messages = withAnswer("## Workspace status\n\nAll clear.");
    const r = await open();
    const pane = screen.getByTestId("ask-pane");
    const heading = pane.querySelector("h3");
    expect(heading?.textContent).toBe("Workspace status");
    expect(pane.textContent).not.toContain("##");
    r.unmount();
  });

  /** Caught in the browser, not by a type: react-markdown hands every override
   *  the mdast `node` for inspection, and spreading it straight through put a
   *  literal `node="[object Object]"` on every heading in the DOM. */
  test("no markdown internals leak into the markup", async () => {
    messages = withAnswer("# One\n\n## Two\n\n### Three\n");
    const r = await open();
    for (const h of screen.getByTestId("ask-pane").querySelectorAll("h3")) {
      expect(h.hasAttribute("node")).toBe(false);
    }
    r.unmount();
  });

  test("bold is bold, italics are italics, and the asterisks are gone", async () => {
    messages = withAnswer("We are **finalizing the port** and *not* shipping yet.");
    const r = await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.querySelector("strong")?.textContent).toBe("finalizing the port");
    expect(pane.querySelector("em")?.textContent).toBe("not");
    expect(pane.textContent).not.toContain("**");
    r.unmount();
  });

  test("a list is a list, with real items", async () => {
    messages = withAnswer("Next:\n\n- Ship the fix\n- Tell the team\n");
    const r = await open();
    const items = screen.getByTestId("ask-pane").querySelectorAll("li");
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe("Ship the fix");
    r.unmount();
  });

  test("inline code and a code block both render as code", async () => {
    messages = withAnswer("Set `retry_after` first.\n\n```\nbun run build\n```\n");
    const pane = (await open()) && screen.getByTestId("ask-pane");
    expect(pane.querySelector("code")?.textContent).toBe("retry_after");
    expect(pane.querySelector("pre")).toBeTruthy();
    expect(pane.textContent).not.toContain("```");
  });

  // A link the model wrote is a link we did not verify: it leaves in a new tab
  // and hands the destination no reference back.
  test("a link opens away from the conversation, and safely", async () => {
    messages = withAnswer("See [the changelog](https://example.com/log).");
    const r = await open();
    const a = screen
      .getByTestId("ask-pane")
      .querySelector<HTMLAnchorElement>('a[href="https://example.com/log"]');
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer");
    r.unmount();
  });

  /** THE FAILURE MODE WORTH A TEST OF ITS OWN. Half-written Markdown arrives on
   *  the SAME message the finished answer lands on, so there is no second path
   *  that could print hashes for the eight seconds a person is watching. */
  test("a half-streamed answer is already rendered, not raw", async () => {
    streaming = true;
    messages = withAnswer("## Workspace status\n\nStill wr");
    const r = await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.querySelector("h3")?.textContent).toBe("Workspace status");
    expect(pane.textContent).not.toContain("##");
    r.unmount();
  });

  // Your OWN words go through verbatim. A `#` you typed is a `#` you meant.
  test("your question is never reformatted back at you", async () => {
    messages = [{ id: "u1", role: "user", content: "## is this rendered?", at: 1 }];
    const r = await open();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.textContent).toContain("## is this rendered?");
    expect(pane.querySelector("h3")).toBe(null);
    r.unmount();
  });
});

/**
 * THE LIVE LINE. Founder: "when the user has asked and the agent is working, a
 * constant message should be going on, like Claude Code shows."
 *
 * The rule these protect is not that it appears, it is that it never LIES: the
 * plain chat path emits no progress events at all, so anything more specific
 * than "Working" there would be invented.
 */
describe("AskPane: the working line", () => {
  const inFlight: AskStreamMsg[] = [
    { id: "u1", role: "user", content: "what happened", at: 1 },
    { id: "a1", role: "assistant", content: "", at: 2 },
  ];

  test("it says the server's own words when the server has said any", async () => {
    streaming = true;
    liveStatus = { phase: "read", label: "Reading 4 sources" };
    messages = inFlight;
    const r = await open();
    expect(screen.getByTestId("ask-pane").textContent).toContain("Reading 4 sources");
    r.unmount();
  });

  // With no server event the verb is a flavour word that names no operation.
  // The vocabulary itself is guarded in Working.test.ts; this asserts the line
  // renders one of them and never a claim about something we did not do.
  test("with no status event it still says something, and invents no operation", async () => {
    streaming = true;
    messages = inFlight;
    const r = await open();
    const say = screen.getByTestId("ask-pane").querySelector(".sp-working-say");
    expect(WORKING_EFFORT_WORDS).toContain(say?.textContent ?? "");
    r.unmount();
  });

  test("it is gone the moment the answer has landed", async () => {
    streaming = false;
    messages = [
      { id: "u1", role: "user", content: "what happened", at: 1 },
      { id: "a1", role: "assistant", content: "It merged.", at: 2 },
    ];
    const r = await open();
    expect(screen.getByTestId("ask-pane").querySelector(".sp-working")).toBe(null);
    r.unmount();
  });
});

/**
 * THE SUGGESTION RAIL, which replaced the travelling strip on 2026-08-11.
 *
 * The capability the founder asked for is unchanged and is what these protect:
 * *"that tells users what all you can do. With one click you can just click that
 * and execute those actions, and it is real-time data feeding from the
 * workspace, not randomly seeded."*
 *
 * What changed is that every offer can now be READ. The strip's capsules were
 * nowrap and capped at 300px inside a 392px pane, so most sentences were
 * ellipsised and its edge mask cut the rest mid-word; worse, where a scope had
 * only four prompts to deal into three rows, the copies a seamless loop needs
 * put the SAME suggestion on screen twice at once. So the assertions below are
 * about grouping, about each offer existing exactly once, and about nothing
 * being clipped by construction.
 */
describe("AskPane: the suggestion rail", () => {
  async function openWithRuns() {
    missionRows = [{ title: "Ship SSO login for Beacon", status: "running", completed_at: null }];
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    return r;
  }

  test("the offers are grouped, and every heading says what a press will do", async () => {
    const r = await openWithRuns();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.querySelector('[data-testid="ask-suggestions"]')).toBeTruthy();
    // The grounded group leads, because a run in flight is what a person walks
    // in wondering about.
    const labels = [...pane.querySelectorAll(".sp-suggest-label")].map((n) => n.textContent);
    expect(labels[0]).toBe("Work in motion");
    expect(labels).toContain("Answered from the record");
    r.unmount();
  });

  /**
   * THE DEFECT THAT CONDEMNED THE MARQUEE, asserted so it cannot return. Its
   * loop rendered the content three times over and hid two copies from the
   * accessibility tree, which kept a screen reader honest and did nothing at all
   * for the eye: a row holding one chip showed that chip three times across the
   * pane. Nothing repeats now, in either channel.
   */
  test("no suggestion is offered twice, to the eye or to the reader", async () => {
    const r = await openWithRuns();
    const pane = screen.getByTestId("ask-pane");
    const rows = [...pane.querySelectorAll<HTMLElement>(".sp-suggest-row")];
    const names = rows.map((b) => b.getAttribute("aria-label"));
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
    // And the tree agrees with the pixels: no aria-hidden duplicate copies.
    expect(pane.querySelectorAll("[aria-hidden] .sp-suggest-row").length).toBe(0);
    r.unmount();
  });

  /**
   * LEGIBILITY IS STRUCTURAL, NOT A STYLE PREFERENCE. A capsule clipped because
   * it was told to: nowrap, a max-width and a mask over the container's edges.
   * A row that wraps cannot clip, so the assertion is that none of the three
   * mechanisms is present on this surface any more.
   */
  test("nothing on the rail is built to clip a sentence", async () => {
    const r = await openWithRuns();
    const pane = screen.getByTestId("ask-pane");
    expect(pane.querySelector(".sp-marquee")).toBe(null);
    expect(pane.querySelector(".sp-chip")).toBe(null);
    for (const row of pane.querySelectorAll<HTMLElement>(".sp-suggest-row")) {
      expect(row.style.whiteSpace).not.toBe("nowrap");
      expect(row.style.maxWidth).toBe("");
    }
    r.unmount();
  });

  // The founder's sentence, made visible: "here you can do everything out of
  // those seven stations". A capability line wears the station it came out of,
  // and the station is one of the product's own seven.
  test("a capability row names the station it comes out of", async () => {
    pathname = "/outcomes";
    search = { decision: "d-3" };
    const r = await openWithRuns();
    const tags = [...screen.getByTestId("ask-pane").querySelectorAll(".sp-suggest-station")];
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => t.textContent === "Decide")).toBe(true);
    r.unmount();
  });

  // A press does not send: it lands the whole sentence in the composer, where
  // the person can edit it and continue. "That comes into the chat."
  test("a press lands the whole sentence in the composer, and does not send it", async () => {
    const r = await openWithRuns();
    await act(async () => {
      screen.getByRole("button", { name: "What is the crew working on right now?" }).click();
    });
    const box = screen.getByLabelText("Ask about Helio Labs") as HTMLTextAreaElement;
    expect(box.value).toBe("What is the crew working on right now?");
    expect(sendIntent).not.toHaveBeenCalled();
    r.unmount();
  });

  // The capability lines name nothing, so they survive a workspace read that
  // failed: a person on day one needs them more than anyone.
  test("a failed workspace read still leaves the capability lines standing", async () => {
    missionsThrow = true;
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    const pane = screen.getByTestId("ask-pane");
    expect(pane.textContent).toContain("could not read what is running");
    expect(
      screen.getAllByRole("button", { name: "What needs my call before it can move?" }).length,
    ).toBe(1);
    // And the grounded groups are simply absent rather than filled with
    // something invented to cover the gap.
    const labels = [...pane.querySelectorAll(".sp-suggest-label")].map((n) => n.textContent);
    expect(labels).not.toContain("Work in motion");
    r.unmount();
  });
});

/**
 * WHAT THE RAIL OFFERS FIRST, now that nothing has to be lifted out of a moving
 * strip to hold still.
 *
 * A "Start here" row used to be promoted above the marquee for exactly one
 * reason: asking somebody to click a travelling target is the worst thing that
 * pattern does. Nothing travels, so the promotion became a second way of saying
 * one thing, and the group heading says it better. These assert what the
 * promotion was really protecting: the live run leads, it is named, and one
 * press behaves the way it always did.
 */
describe("AskPane: the live run leads", () => {
  async function openWith(rows: typeof missionRows) {
    missionRows = rows;
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    return r;
  }

  // Grounded prompts come first, so where a run is genuinely in motion it is the
  // first thing offered. Nothing here is invented: the title is the row
  // `listMissions` returned.
  test("it names the run that is genuinely in motion, and names it first", async () => {
    const r = await openWith([
      { title: "Ship SSO login for Beacon", status: "running", completed_at: null },
    ]);
    const first = screen.getByTestId("ask-pane").querySelector<HTMLElement>(".sp-suggest-row");
    expect(first?.textContent).toContain("Ship SSO login for Beacon");
    r.unmount();
  });

  // OFFERED ONCE. A run standing still AND riding a strip would be read twice by
  // a screen reader and pressed twice by nobody.
  test("the run is offered exactly once", async () => {
    const r = await openWith([
      { title: "Ship SSO login for Beacon", status: "running", completed_at: null },
    ]);
    const pane = screen.getByTestId("ask-pane");
    const named = [...pane.querySelectorAll("button")].filter((b) =>
      (b.textContent ?? "").includes("Ship SSO login for Beacon"),
    );
    expect(named.length).toBe(1);
    r.unmount();
  });

  // It goes nowhere, it sends nothing, it puts the whole sentence in the box and
  // lets the person continue from there.
  test("a press lands the whole sentence in the composer, and does not send it", async () => {
    const r = await openWith([
      { title: "Ship SSO login for Beacon", status: "running", completed_at: null },
    ]);
    await act(async () => {
      screen.getByRole("button", { name: /Ship SSO login for Beacon/ }).click();
    });
    const box = screen.getByLabelText("Ask about Helio Labs") as HTMLTextAreaElement;
    expect(box.value).toBe("What is the crew doing on Ship SSO login for Beacon?");
    expect(sendIntent).not.toHaveBeenCalled();
    r.unmount();
  });

  // With nothing running there is still a first offer, and it is the surface's
  // own question rather than a constant. Standing on a run, it asks about the
  // run. This is the day-one case.
  test("with nothing running it is still the question for the surface you are on", async () => {
    pathname = "/runs/11111111-2222-3333-4444-555555555555";
    const r = await openWith([]);
    expect(screen.getByRole("button", { name: "Where is this, and what is left?" })).toBeTruthy();
    r.unmount();
  });

  /**
   * BOTH HALVES OF THE BOX, SAID BEFORE ANYTHING IS TYPED. The fork between
   * asking and handing over is what makes this not a chat window, and it used
   * to be invisible until you had typed a line into the composer.
   */
  test("the opening says the same box also hands work over", async () => {
    const r = await openWith([]);
    const text = screen.getByTestId("ask-pane").textContent ?? "";
    expect(text).toContain("hand the work over");
    expect(text).toContain("becomes a run");
    r.unmount();
  });
});

/**
 * DISMISSAL, AND IT MATCHES THE SHAPE THIS SURFACE CHOSE.
 *
 * Founder ruling 2026-08-11: *"when I click my mouse cursor somewhere outside,
 * it should collapse if it is a left pane. If it is opening in a full-sized
 * window or pop-up-like window, then Escape or a close button should be fine."*
 *
 * Ask stayed a pane rather than becoming a centred modal, so it owes the light
 * gesture: outside click collapses, and it stands down for the two doors that
 * open it and for anything floating above it. Without the first of those the
 * visible Ask button becomes dead, because pointerdown would close the pane and
 * the click that follows would reopen it.
 */
describe("AskPane: a click outside collapses it", () => {
  /** A real press travels through document on its way up. Dispatching AT
   *  window would have a propagation path of one node and reach no document
   *  listener, which is a press no user can perform. */
  function pressOutside(el: Element = document.body) {
    return act(async () => {
      el.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      await Promise.resolve();
    });
  }

  test("a press on the page behind it closes the pane", async () => {
    const r = await open();
    expect(screen.getByTestId("ask-pane")).toBeTruthy();
    await pressOutside();
    expect(screen.queryByTestId("ask-pane")).toBe(null);
    r.unmount();
  });

  test("a press inside it changes nothing", async () => {
    const r = await open();
    await pressOutside(screen.getByTestId("ask-pane"));
    expect(screen.queryByTestId("ask-pane")).toBeTruthy();
    r.unmount();
  });

  /**
   * THE DOOR STAYS ALIVE. The header control and the dock row both summon Ask
   * on CLICK, which fires after pointerdown. A guardless handler closes on the
   * press and the click immediately reopens, so the button appears to do
   * nothing at all while flickering the whole pane.
   */
  test("a press on the control that opens it is not an outside click", async () => {
    const r = await open();
    const door = document.createElement("button");
    door.className = "sp-askbtn";
    document.body.appendChild(door);
    await pressOutside(door);
    expect(screen.queryByTestId("ask-pane")).toBeTruthy();
    door.remove();
    r.unmount();
  });

  /**
   * THE LINEAGE SHEET IS SUMMONED FROM THIS PANE, takes its exact geometry and
   * covers it. Closing Ask on the press that traces a record would destroy the
   * conversation that asked for the trace.
   */
  test("a press in a surface layered over it is not an outside click", async () => {
    const r = await open();
    for (const spec of [
      { tag: "div", cls: "sp-lineage", attrs: {} },
      { tag: "div", cls: "", attrs: { role: "dialog" } },
      { tag: "div", cls: "", attrs: { role: "menu" } },
    ]) {
      const over = document.createElement(spec.tag);
      if (spec.cls) over.className = spec.cls;
      for (const [k, v] of Object.entries(spec.attrs)) over.setAttribute(k, v);
      document.body.appendChild(over);
      await pressOutside(over);
      expect(screen.queryByTestId("ask-pane")).toBeTruthy();
      over.remove();
    }
    r.unmount();
  });
});
