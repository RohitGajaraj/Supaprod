/**
 * PublishTeardown — the control that turns a private bet into the public
 * /t/<slug> page.
 *
 * WHAT THIS SUITE IS FOR. Everything downstream of this button shipped months
 * ago (the SSR route, the anon column grants, the RLS policy, the rate limiter)
 * and the button did not exist, so not one teardown had ever been published.
 * The risk in adding it is not that it fails to work; it is that it publishes
 * MORE than it said it would, or publishes a link to a page with nothing on it,
 * or fails a write and says nothing. Each of those is a test below.
 *
 * HARNESS. The mock.module pattern documented in DecisionsPanel.test.tsx, with
 * one addition: `@tanstack/react-start` is re-exported wholesale and only
 * `useServerFn` is swapped for identity, because the *.functions modules in the
 * import graph call `createServerFn` at module scope and a partial mock would
 * break them at eval. React Query itself is REAL here: the point is the states a
 * person actually passes through, not a rehearsal of them.
 */
import { describe, expect, test, mock, beforeEach } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { fileURLToPath } from "node:url";
import type { CriticReview } from "@/lib/ai/critic.server";
import type { TeardownShareState } from "@/lib/opportunities-share.functions";

type ShareArgs = { data: { id: string } };
type SetArgs = { data: { id: string; isPublic: boolean } };

let readState: (a: ShareArgs) => Promise<TeardownShareState>;
let writeState: (a: SetArgs) => Promise<TeardownShareState>;
let writes: SetArgs["data"][] = [];

const realStart = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...realStart,
  useServerFn: (fn: unknown) => fn,
}));
mock.module("@/lib/opportunities-share.functions", () => ({
  getTeardownShareState: (a: ShareArgs) => readState(a),
  setTeardownShared: (a: SetArgs) => {
    writes.push(a.data);
    return writeState(a);
  },
}));

const { PublishTeardown } = await import("./OpportunityDetailSheet");
type Opportunity = Parameters<typeof PublishTeardown>[0]["opportunity"];

/**
 * The disclosure, written out here rather than imported from the component.
 *
 * ON PURPOSE. Importing the constant would only prove the component renders its
 * own array, which is true of any array. These seven lines are a SAFETY CLAIM
 * about what leaves the workspace, so they are pinned here: widening what gets
 * published without widening what the person was told fails right here.
 */
const DISCLOSED = [
  "the title of this bet",
  "the Critic verdict, and the confidence behind it",
  "the summary the Critic wrote",
  "the risks it listed",
  "what it said would kill this",
  "what it said you cannot prove yet",
  "the date the bet was raised",
];

/** The columns anon is never granted. Named, so the promise is checkable. */
const WITHHELD = "The problem, the hypothesis, the target user, your impact";

const REVIEW: CriticReview = {
  verdict: "kill",
  summary: "The wedge assumes a buyer who does not exist yet.",
  risks: ["No named buyer"],
  kill_criteria: ["Three discovery calls with no pull"],
  missing_evidence: ["Anyone paying for this today"],
  confidence: 0.62,
  reviewer_model: "test",
  reviewed_at: "2026-08-01T00:00:00.000Z",
};

function bet(critic_review: CriticReview | null = REVIEW): Opportunity {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Ship the teardown link",
    problem: "Nobody can share a teardown.",
    hypothesis: null,
    target_user: null,
    impact: 8,
    confidence: 6,
    ease: 5,
    ice_score: 6.3,
    critic_review,
    status: "shortlisted",
    theme_id: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-02T00:00:00.000Z",
  };
}

function shown(opportunity: Opportunity = bet()): ReactNode {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <PublishTeardown opportunity={opportunity} />
    </QueryClientProvider>
  );
}

const PRIVATE: TeardownShareState = { available: true, is_public: false, share_slug: null };
const PUBLIC: TeardownShareState = {
  available: true,
  is_public: true,
  share_slug: "abcdef0123456789abcdef0123456789",
};

beforeEach(() => {
  writes = [];
  readState = async () => PRIVATE;
  writeState = async () => PUBLIC;
});

describe("before the press, it says what publishing does", () => {
  test("names every field that becomes public, and what stays private", async () => {
    render(shown());
    await screen.findByText(/Publish this teardown/);

    // Not a category and not a reassurance: each line names a field the public
    // projection actually selects and /t/<slug> actually draws.
    for (const field of DISCLOSED) {
      expect(screen.getByText(field)).toBeTruthy();
    }
    expect(screen.getByText(new RegExp(WITHHELD))).toBeTruthy();
    expect(screen.getByText(/needs no account/)).toBeTruthy();
  });

  test("the disclosure is complete against the public projection itself", async () => {
    // NEVER FABRICATE, enforced rather than promised. If the anon-facing select
    // in opportunities-share.functions.ts ever widens, this fails and the
    // disclosure above has to widen with it before the suite goes green again.
    // fileURLToPath, not .pathname: this repo lives under a path with spaces
    // and .pathname hands back the percent-encoded form.
    const src = await Bun.file(
      fileURLToPath(new URL("../../lib/opportunities-share.functions.ts", import.meta.url)),
    ).text();
    expect(src).toContain('.select("title,critic_review,created_at,is_public")');
    // Those four columns are exactly what the seven disclosed lines describe:
    // title, the review (verdict, confidence, summary, risks, kill criteria,
    // missing evidence) and created_at. is_public is the gate, not content.
    expect(DISCLOSED).toHaveLength(7);
    // And the page draws no fifth thing: every section on /t/<slug> comes out of
    // that projection, so a new one there would need a new line above.
    const page = await Bun.file(
      fileURLToPath(new URL("../../routes/t.$slug.tsx", import.meta.url)),
    ).text();
    expect(page).toContain("getPublicTeardown");
  });

  test("nothing is published until the press", async () => {
    render(shown());
    await screen.findByText(/Publish this teardown/);
    expect(writes).toHaveLength(0);
  });
});

describe("the press", () => {
  test("publishes, then shows the real link the server returned", async () => {
    render(shown());
    const btn = await screen.findByText(/Publish it and get the link/);
    fireEvent.click(btn);

    await screen.findByText(/This teardown is public/);
    expect(writes).toEqual([{ id: bet().id, isPublic: true }]);

    // The link is PRINTED, not only copied: a blocked clipboard must never be
    // the difference between having the link and not having it.
    const link = screen.getByText(new RegExp(`/t/${PUBLIC.share_slug}$`));
    expect(link.getAttribute("href")).toContain(`/t/${PUBLIC.share_slug}`);
    expect(screen.getByText(/Copy the link/)).toBeTruthy();
  });

  test("the state shown afterwards is the server's, never an assumption", async () => {
    // The write succeeds but the row comes back still private (an RLS no-op on
    // a row the caller does not own writes nothing and returns what is there).
    // A control that flipped its own local flag would now be lying.
    writeState = async () => PRIVATE;
    render(shown());
    fireEvent.click(await screen.findByText(/Publish it and get the link/));

    await waitFor(() => expect(writes).toHaveLength(1));
    expect(screen.queryByText(/This teardown is public/)).toBeNull();
    expect(screen.getByText(/Publish it and get the link/)).toBeTruthy();
  });

  test("a failed write says so rather than silently doing nothing", async () => {
    // This is the real shape of the failure: setTeardownShared refuses to make a
    // teardown anon-readable when the egress scan finds a secret or customer PII.
    writeState = async () => {
      throw new Error("Blocked: this teardown carries what looks like a customer email address.");
    };
    render(shown());
    fireEvent.click(await screen.findByText(/Publish it and get the link/));

    await screen.findByText(/looks like a customer email address/);
    expect(screen.queryByText(/This teardown is public/)).toBeNull();
    // And the door stays open, so the person can fix it and try again.
    expect(screen.getByText(/Publish it and get the link/)).toBeTruthy();
  });
});

describe("unsharing", () => {
  test("a public teardown reads as public on arrival, with no press", async () => {
    readState = async () => PUBLIC;
    render(shown());
    await screen.findByText(/This teardown is public/);
    expect(writes).toHaveLength(0);
    expect(screen.getByText(/Make it private/)).toBeTruthy();
  });

  test("making it private takes the page down and offers the press again", async () => {
    readState = async () => PUBLIC;
    writeState = async () => PRIVATE;
    render(shown());
    fireEvent.click(await screen.findByText(/Make it private/));

    await screen.findByText(/Publish it and get the link/);
    expect(writes).toEqual([{ id: bet().id, isPublic: false }]);
  });
});

describe("what it refuses to do", () => {
  test("never mints a link to a page with nothing on it", async () => {
    // getPublicTeardown returns null for a row whose critic_review carries no
    // ship/revise/kill verdict, so /t/<slug> would render "Not available". A
    // live link to that is worse than no link.
    render(shown(bet(null)));
    await screen.findByText(/Publish this teardown/);
    expect(screen.queryByText(/Publish it and get the link/)).toBeNull();
    expect(screen.getByText(/has not reached a verdict/)).toBeTruthy();
    // The disclosure is still there: what publishing WOULD do is not a secret
    // just because it cannot be done yet.
    expect(screen.getByText(DISCLOSED[0]!)).toBeTruthy();
  });

  test("a malformed verdict is treated as no verdict", async () => {
    const bad = { ...REVIEW, verdict: "maybe" } as unknown as CriticReview;
    render(shown(bet(bad)));
    await screen.findByText(/has not reached a verdict/);
    expect(screen.queryByText(/Publish it and get the link/)).toBeNull();
  });

  test("a read that failed is a failure, never a quiet 'not shared'", async () => {
    readState = async () => {
      throw new Error("network");
    };
    render(shown());
    await screen.findByText(/Could not read whether this teardown is public/);
    expect(screen.queryByText(/Publish it and get the link/)).toBeNull();
    expect(screen.getByText(/Try again/)).toBeTruthy();
  });

  test("pre-migration, it names the reason instead of offering a broken press", async () => {
    readState = async () => ({ available: false, is_public: false, share_slug: null });
    render(shown());
    await screen.findByText(/lights up once the next sync/);
    expect(screen.queryByText(/Publish it and get the link/)).toBeNull();
  });
});
