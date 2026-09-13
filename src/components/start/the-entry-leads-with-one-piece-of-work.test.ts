/**
 * ── WHAT THIS REPLACES, AND WHY IT IS A REPLACEMENT RATHER THAN AN EDIT ───
 *
 * `the-journey-is-the-entry.test.ts` pinned the previous answer: the road first,
 * the composer under it, the sentence about the product inside the road's panel.
 * That answer shipped, the founder looked at it, and said the same thing again
 * — *"shows no journey"*, *"I cannot feel the value"*, *"layers 1, 2 and 3 do
 * not stitch together"*. A guard that pins a rejected answer is worse than no
 * guard, so it is gone and this stands in its place.
 *
 * The claim this one holds: **the entry opens with ONE piece of work, told
 * whole, and it costs no read the page was not already paying for.**
 *
 * ── EVERY ASSERTION HERE WAS MADE TO FAIL BEFORE IT WAS TRUSTED ──────────
 *
 * Which matters more than usual on this file, because the last sweep of this
 * surface rewrote its own guards' literals and 15,803 tests passed without one
 * of them having verified anything.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { releaseLine, runInFront, theCallInFront } from "./the-call-in-front";
import type { StartRun } from "@/lib/spine/track.functions";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * ── EVERY ABSENCE BELOW IS ASSERTED AGAINST CODE, NOT AGAINST PROSE ──────
 *
 * This file's first failure was its own: `max-w-[62rem]` is gone from the
 * entry's JSX and still named in the comment that explains why it went, so a
 * `not.toContain` over the raw file failed on the sentence describing the fix.
 *
 * A guard that a comment can break is a guard that gets loosened, and this repo
 * has loosened one before. Comments are stripped first, so "is this still on
 * the page" means the code and never the reasoning — which is exactly what lets
 * the reasoning be written at length directly above the thing it explains.
 */
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const ROUTE = strip(
  readFileSync(join(import.meta.dir, "..", "..", "routes", "_authenticated.start.tsx"), "utf8"),
);
const LEAD = strip(readFileSync(join(import.meta.dir, "TheCallInFront.tsx"), "utf8"));
const PICK = strip(readFileSync(join(import.meta.dir, "the-call-in-front.ts"), "utf8"));

const at = (marker: string) => {
  const i = ROUTE.indexOf(marker);
  expect(i, `${marker} is not on the entry; re-point this test`).toBeGreaterThan(-1);
  return i;
};

describe("the entry opens with one piece of work", () => {
  it("draws the lead before the composer, the runs and the record", () => {
    const lead = at("<TheCallInFront");
    for (const later of ["<Composer", "<YourRuns", "<WhetherItWorked"]) {
      expect({ later, afterTheLead: at(later) > lead }).toEqual({ later, afterTheLead: true });
    }
  });

  it("draws no second road: the abstract station band is gone", () => {
    /*
     * The band counted the same tracks the run rows already draw with
     * `journeyOfRun` at `size="row"`, one region higher. Two drawings of eight
     * tracks on one screen is the repeated-value law, and the founder's
     * "reads as a dump" in its most literal form.
     */
    expect(ROUTE).not.toContain("<JourneyMap");
    expect(ROUTE).not.toContain("promiseStations");
    expect(ROUTE).not.toContain("routeStations");
  });

  it("stops explaining itself: the sentence about the product is gone", () => {
    /* "Seven stations take one sentence from evidence to shipped, and grade
       whether it worked." — true about the PRODUCT, printed at the top of the
       screen a person opens to find out about THEIR product. */
    expect(ROUTE).not.toContain("whatThisDoesForYou");
    expect(ROUTE).not.toContain("theMessage");
  });
});

describe("the entry joins the shell's layout", () => {
  it("uses .sp-inner rather than its own measure", () => {
    /* `shell.css` names this file as the one surface that never did. Measured
       on the served build: 330px of dead field each side at 1920px, while the
       page scrolled. */
    /* The ATTRIBUTE form, not the class. `sp-` is a retired namespace and the
       Meridian ratchet counts every one left in JSX as debt: joining the shell
       by class would have added three, on a file the baseline had frozen clean.
       `shell.css` mints `[data-work]` beside `.sp-inner` for exactly this, on
       `.sp-ctx`'s own reasoning about `data-shell-index`. */
    expect(ROUTE).toContain('data-work=""');
    expect(ROUTE).not.toContain('className="sp-inner"');
    expect(ROUTE).not.toContain("max-w-[62rem]");
  });

  it("has a context column, and layer 3 is inside it", () => {
    const ctx = at("data-work-ctx");
    for (const inside of ["<WhetherItWorked", "<BetStillOpen", "<Arriving", "<CrewAtWork"]) {
      expect({ inside, inTheColumn: at(inside) > ctx }).toEqual({ inside, inTheColumn: true });
    }
  });
});

describe("the lead draws what the page was already paying for", () => {
  it("opens no read of its own", () => {
    /* The whole argument for this shape is that every field was already in the
       browser. A `useQuery` or a `useServerFn` in either file would mean a new
       request per poll and would falsify the claim in both docstrings. */
    for (const f of [LEAD, PICK]) {
      expect(f).not.toContain("useQuery");
      expect(f).not.toContain("useServerFn");
      expect(f).not.toContain("createServerFn");
    }
  });

  it("renders the six queue fields that were being dropped", () => {
    /* Audited 2026-09-10: the home fetched the whole Inbox payload and rendered
       one integer, one noun and one title off it. Each of these is a field that
       reached the browser on every poll and never reached the screen. */
    for (const field of [
      "why", // evidence[]
      "cost", // impact
      "promise", // forecast{claim,howWeWillKnow,horizonDate}
      "approveConsequence",
      "rejectConsequence",
      "releases", // gatesLiveWork
    ]) {
      expect({ field, drawn: LEAD.includes(field) }).toEqual({ field, drawn: true });
    }
  });

  it("draws the road at full width, where the outcome lines survive", () => {
    /* `journeyOfRun` fills `outcome` per station from `produced` on every poll,
       and `size="row"` is 96px wide and drops every one of them. */
    expect(LEAD).toContain('size="full"');
    expect(LEAD).toContain("journeyOfRun");
  });

  it("carries no eyebrow: the call's own sentence is the heading", () => {
    expect(LEAD).not.toContain("mrd-eyebrow");
    expect(LEAD).not.toContain("<Eyebrow");
  });
});

/* ── THE PICKER, AS BEHAVIOUR ─────────────────────────────────────────── */

const RUN = (over: Partial<StartRun> = {}): StartRun =>
  ({
    id: "r1",
    title: "A run",
    status: "open",
    station: "build",
    stationName: "Build",
    updatedAt: "2026-09-01T00:00:00.000Z",
    drivenAt: null,
    holdReason: null,
    holdBecause: null,
    working: null,
    needsYou: null,
    produced: [],
    forecast: null,
    liveSince: null,
    credits: null,
    stoppedBecause: null,
    ...over,
  }) as StartRun;

const ITEM = (over: Partial<ApprovalQueueItem> = {}): ApprovalQueueItem =>
  ({
    id: "i1",
    kind: "GATE",
    kindKey: "tool_call",
    sourceId: "s1",
    filterBucket: "gates",
    projectId: null,
    projectName: null,
    trackId: null,
    gatesLiveWork: null,
    title: "A call",
    evidence: [],
    approveConsequence: "",
    rejectConsequence: "",
    ...over,
  }) as ApprovalQueueItem;

describe("a failed read is not an empty one", () => {
  it("is unread when both reads are unread, and says nothing", () => {
    expect(theCallInFront({ queue: null, runs: null, lineFor: () => "" }).kind).toBe("unread");
  });

  it("is 'nothing' only when both reads answered and both are empty", () => {
    expect(theCallInFront({ queue: [], runs: [], lineFor: () => "" }).kind).toBe("nothing");
    /* One read answered empty and the other refused is NOT an all-clear. A home
       that says "nothing is waiting on you" when it means "we could not find
       out" is the most expensive lie this surface can tell: the person stops
       looking. */
    expect(theCallInFront({ queue: [], runs: null, lineFor: () => "" }).kind).toBe("unread");
  });
});

describe("the call it picks is the one the Inbox would hand you", () => {
  it("takes the oldest, in the Inbox's own order", () => {
    const lead = theCallInFront({
      queue: [
        ITEM({ id: "new", title: "Newer", timestamp: "2026-09-09T00:00:00.000Z" }),
        ITEM({ id: "old", title: "Older", timestamp: "2026-09-01T00:00:00.000Z" }),
      ],
      runs: [],
      lineFor: () => "",
    });
    expect(lead.kind === "call" && lead.item.title).toBe("Older");
  });

  it("joins the call to the run it is holding, by trackId", () => {
    const lead = theCallInFront({
      queue: [ITEM({ trackId: "r1" })],
      runs: [RUN({ id: "r1", title: "The held run" })],
      lineFor: () => "",
    });
    expect(lead.kind === "call" && lead.run?.title).toBe("The held run");
  });

  it("says nothing about release when nobody looked", () => {
    /* 22 of 29 pending tool-call gates hold a run that has already finished, so
       `false` is worth saying out loud. `null` means the lookup could not
       answer, and collapsing it into `false` would tell a person the work had
       finished when nothing ever started. */
    expect(releaseLine(null)).toBeNull();
    expect(releaseLine(false)).toContain("releases nothing");
    expect(releaseLine(true)).toContain("releases it");
  });
});

describe("when nothing waits on a person, the lead is still the thing worth looking at", () => {
  it("prefers a run that is asking over one that is merely working", () => {
    const asking = RUN({ id: "asks", needsYou: { tool: "merge" } });
    const working = RUN({
      id: "works",
      working: {
        seat: "Draft",
        slug: null,
        since: "2026-09-09T00:00:00.000Z",
        tool: null,
        lastCallAt: null,
        verb: null,
        objectLabel: null,
      },
      updatedAt: "2026-09-09T00:00:00.000Z",
    });
    expect(runInFront([working, asking])?.id).toBe("asks");
  });

  it("prefers a working run over one that stopped a week ago", () => {
    const working = RUN({
      id: "works",
      working: {
        seat: "Draft",
        slug: null,
        since: "2026-09-09T00:00:00.000Z",
        tool: null,
        lastCallAt: null,
        verb: null,
        objectLabel: null,
      },
    });
    const stopped = RUN({ id: "stops", holdReason: "given-up" });
    expect(runInFront([stopped, working])?.id).toBe("works");
  });

  it("picks the OLDEST stop, not the newest", () => {
    /* Every list on this page is newest-first because a person is scanning it.
       A single lead is CHOSEN, and the one worth choosing is the one that has
       been stuck longest with nobody looking. */
    const old = RUN({
      id: "old",
      holdReason: "out-of-time",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
    const recent = RUN({
      id: "recent",
      holdReason: "out-of-time",
      updatedAt: "2026-09-09T00:00:00.000Z",
    });
    expect(runInFront([recent, old])?.id).toBe("old");
  });

  it("never picks a closed run while an open one exists", () => {
    const done = RUN({ id: "done", status: "done", updatedAt: "2026-09-09T00:00:00.000Z" });
    const open = RUN({ id: "open", updatedAt: "2026-08-01T00:00:00.000Z" });
    expect(runInFront([done, open])?.id).toBe("open");
  });
});
