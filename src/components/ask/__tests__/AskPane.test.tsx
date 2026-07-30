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
import type { ThreadSummary } from "@/lib/threads.functions";
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
let threadRows: ThreadSummary[] = [];
let threadsThrow = false;
mock.module("@/lib/threads.functions", () => ({
  listThreads: async () => {
    if (threadsThrow) throw new Error("no");
    return { threads: threadRows };
  },
}));

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
  threadRows = [];
  threadsThrow = false;
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
    // asserts the CONTROL, which is the thing that commits.
    const send = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("data-variant") === "primary");
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

  async function openSwitcher() {
    const r = await open();
    await act(async () => {
      screen.getByText("Conversations").click();
      await new Promise((res) => setTimeout(res, 10));
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
    threadRows = [thread()];
    const r = await openSwitcher();
    expect(screen.getByText("Conversations").getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("ask-pane").textContent).toContain("Why the caller fix shipped");
    r.unmount();
  });

  // The label is "Start fresh" and not the obvious "New conversation" for a
  // reason worth a test: that string is the DEFAULT title of every thread
  // nobody renamed, so the button would have worn the same words as the rows.
  test("starting fresh is one press, and it is not the primary", async () => {
    threadRows = [thread({ title: "New conversation" })];
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
    threadsThrow = true;
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
 * THE SUGGESTION STRIP. Founder ruling 2026-07-30: the two headed lists became
 * three travelling rows, "so that the user would see all the possible use
 * cases. And when he clicks, that comes into the chat and continues from there."
 */
describe("AskPane: the suggestion marquee", () => {
  async function openWithRuns() {
    missionRows = [{ title: "Ship SSO login for Beacon", status: "running", completed_at: null }];
    const r = mount();
    await act(async () => {
      window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
      await new Promise((res) => setTimeout(res, 10));
    });
    return r;
  }

  test("three rows, each one travelling, and they alternate direction", async () => {
    const r = await openWithRuns();
    const tracks = screen
      .getByTestId("ask-pane")
      .querySelectorAll<HTMLElement>(".sp-marquee-track");
    expect(tracks.length).toBe(3);
    expect([...tracks].map((t) => t.dataset.dir)).toEqual(["ltr", "rtl", "ltr"]);
    r.unmount();
  });

  /**
   * THE ACCESSIBILITY TRAP a marquee sets. A seamless loop needs the content
   * rendered several times over; every copy after the first must be hidden, or
   * a screen reader is read thirty-nine buttons where there are thirteen.
   */
  test("the loop's duplicate copies are hidden from the tree, so nothing is read twice", async () => {
    const r = await openWithRuns();
    const pane = screen.getByTestId("ask-pane");
    const copies = pane.querySelectorAll(".sp-marquee-copy");
    expect(copies.length).toBeGreaterThan(3);
    const visible = [...copies].filter((c) => !c.hasAttribute("aria-hidden"));
    // Exactly one visible copy per row.
    expect(visible.length).toBe(3);
    // And every suggestion is reachable exactly once. A ROLE query is the
    // point of this assertion: it walks the accessibility tree and so honours
    // the aria-hidden that a plain text query would sail straight past, which
    // is exactly the difference a screen reader experiences.
    const chips = screen.getAllByRole("button", {
      name: /What is the crew doing on Ship SSO login for Beacon/,
    });
    expect(chips.length).toBe(1);
    r.unmount();
  });

  // A press does not send: it lands the whole sentence in the composer, where
  // the person can edit it and continue. "That comes into the chat."
  test("a press lands the whole sentence in the composer, and does not send it", async () => {
    const r = await openWithRuns();
    await act(async () => {
      screen
        .getAllByRole("button", { name: /What is the crew doing on Ship SSO login for Beacon/ })[0]
        .click();
    });
    const box = screen.getByLabelText("Ask about Helio Labs") as HTMLTextAreaElement;
    expect(box.value).toBe("What is the crew doing on Ship SSO login for Beacon?");
    expect(sendIntent).not.toHaveBeenCalled();
    r.unmount();
  });

  // The use cases name nothing, so they survive a workspace read that failed:
  // a person on day one needs them more than anyone.
  test("a failed workspace read still leaves the use cases standing", async () => {
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
    r.unmount();
  });
});
