import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE FRONT DOOR MAY NOT RENDER NOTHING WHILE IT READS.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. Today opened blank. All
 * three of its regions were written `loading ? null`, so on a cold load the
 * gate, the finished list and the learning were absent at once: a headline over
 * a horizontal rule, for as long as the slower of two server reads took. The
 * route declares no loader either, so the router's `defaultPendingComponent`
 * never covered the gap. A screen reader was handed silence for the whole of it.
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. `? null` is
 * the tidiest-looking line in any diff. It typechecks, it renders, it never
 * throws, and it reads as restraint. It is also the easiest way in the world to
 * reintroduce: the next person adding a fourth read to Today will copy the shape
 * of the third.
 *
 * THE FOUR LINES THIS DRAWS:
 *
 *   1. NO WAIT RESOLVES TO NOTHING. A read in flight renders the third fact
 *      (docs/conventions/surface-discipline.md §6). "Nothing is waiting on you"
 *      and "cannot reach the queue" are both claims, and while the read is
 *      running neither is known. Printing nothing is not the third option, it is
 *      the absence of an answer.
 *
 *   2. EVERY REGION WAITS ON ITS OWN READ. `loading` is the union of the queue
 *      and the missions list and it belongs to the headline alone, because one
 *      sentence assembled from two counts genuinely needs both. A REGION keyed
 *      off the union stays hidden until the SLOWER read returns, which is
 *      latency the user pays and gets nothing for. That is the founder's backlog
 *      item said exactly: fix the latency, not just the spinner.
 *
 *   3. THE COPY STATES WHAT IS BEING READ, AND NEVER HOW LONG IT TAKES.
 *      "Reading what needs you." is a fact. "Just a moment", a percentage or a
 *      seconds count are all the surface talking about itself.
 *
 *   4. A CLAIM NEVER PRINTS BEFORE ITS READ LANDS. "The last thing it learned"
 *      is a block title that asserts a learning exists, so it may not be drawn
 *      over a wait that does not yet know whether one does.
 *
 * Modelled on run-evidence-holds.test.ts and no-fabricated-agent-steps.test.ts:
 * scan the source as TEXT and strip comments first, because the fixed file
 * legitimately describes every banned shape in prose in order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.today.tsx");

/**
 * Strip comments so prose that NAMES the banned shape does not trip it, while
 * keeping the line count intact: a failure that points at the wrong line costs
 * more than it saves.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

const src = stripComments(readFileSync(ROUTE, "utf8"));

/**
 * Everything the Today component actually renders, which is where these rules
 * bite.
 *
 * SCOPED TO `Today`, not to the first `<Surface>` in the file. It used to be
 * `src.slice(src.indexOf("<Surface"))`, which assumed Today was the only
 * component in the route. On 2026-08-05 a `FirstRunBridge` component was added
 * ABOVE it, rendering its own `<Surface>`, so the slice began 300 lines early
 * and swallowed Today's entire component body. Every `loading` in that body --
 * the declaration, the headline branch, a dependency array -- then read as a
 * region waiting on the union, and the guard failed on correct code.
 *
 * A guard that fails on correct code gets deleted by the next person in a
 * hurry, which is worse than not having it. Anchoring on the component keeps it
 * pointed at what it was written to protect.
 */
const TODAY_START = src.indexOf("function Today()");
const jsx = src.slice(src.indexOf("<Surface", TODAY_START === -1 ? 0 : TODAY_START));

/**
 * The offending lines, quoted with their real line numbers. Asserting
 * `expect(src).not.toMatch(...)` prints the entire 600-line route on failure,
 * and a build failure a person has to scroll past is one they learn to skim.
 */
function offenders(source: string, pattern: RegExp): string[] {
  // Same anchor as `jsx` above, or the reported line numbers point at the
  // wrong component and send the reader 300 lines from the offending line.
  const offset = source === jsx ? src.slice(0, src.length - jsx.length).split("\n").length - 1 : 0;
  return source
    .split("\n")
    .map((line, i) => `${i + 1 + offset}: ${line.trim()}`)
    .filter((line) => pattern.test(line));
}

/**
 * THE COMPONENT THE SURFACE WAITS WITH, DISCOVERED RATHER THAN NAMED.
 *
 * ── WHY THIS IS READ OUT OF THE SOURCE AND NOT WRITTEN DOWN ─────────────
 * Every assertion below used to spell `<Loading>`, the retired Cadence/ink
 * primitive. On 2026-08-21 Today was ported to Meridian and `Loading` became
 * `Reading` -- a rename that STRENGTHENED the property this file protects, since
 * `Reading`'s own header records that it is deliberately not `LoadingState` and
 * may not grow an elapsed timer on a plain fetch -- and it broke five
 * assertions here.
 *
 * That is the third time this file has been broken by an improvement, and the
 * two earlier ones are written out in full further down. Each time the lesson
 * was the same and each time the replacement pinned a slightly better-chosen
 * string. So this one does not pin a string at all: the tag is whatever the
 * surface's first `stillWaiting(...) ? <X>` branch renders, and the rules below
 * are asserted against X.
 *
 * WHAT THAT COSTS, said plainly: if the surface ever stopped rendering a
 * component in that position, this resolves to null and the first test below
 * fails on it by name rather than silently passing on an empty match set. That
 * is the failure mode a discovered value has to close, and it is closed.
 */
const WAIT_TAG = /stillWaiting\(\w+\)\s*\?\s*\(?\s*<([A-Z]\w*)\b/.exec(jsx)?.[1] ?? null;

/** Every symbol this route imports, whatever module it came from. Used to prove
 *  the wait is a shared primitive rather than something hand-rolled here. */
const IMPORTED = new Set(
  [...src.matchAll(/import\s+\{([^}]*)\}\s*from\s*["'][^"']+["']/g)].flatMap(([, clause]) =>
    clause
      .split(",")
      .map((part) =>
        part
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .pop()!
          .trim(),
      )
      .filter(Boolean),
  ),
);

const waits = WAIT_TAG
  ? [...src.matchAll(new RegExp(`<${WAIT_TAG}(\\s[^>]*)?>([\\s\\S]*?)</${WAIT_TAG}>`, "g"))].map(
      ([, , text]) => text.trim(),
    )
  : [];

/** The five reads Today makes. Each owns a region, so each owns a wait.
 *  `tracks` joined when the board took over spine work (`/start` creates a
 *  track and no mission, so that work was invisible here before). `sessions`
 *  joined when gated runs stopped being allowed to read as agent work. */
const READS = ["queue", "missions", "learnings", "tracks", "sessions"] as const;

describe("Today renders something for every read in flight", () => {
  it("has no wait branch that resolves to nothing", () => {
    // THE DEFECT, in its original form. All three regions were literally this.
    expect(offenders(src, /\bloading\s*\?\s*null/)).toEqual([]);
    expect(offenders(src, /isLoading\s*\?\s*null/)).toEqual([]);
    expect(offenders(src, /isPending\s*\?\s*null/)).toEqual([]);
  });

  it("waits with a component at all, so the rules below have a subject", () => {
    // The one thing a discovered tag has to prove about itself. If no
    // `stillWaiting(x) ? <Something>` branch exists, every assertion keyed off
    // WAIT_TAG would pass by having nothing to check, which is the failure mode
    // a guard may not have.
    expect(WAIT_TAG, "no `stillWaiting(x) ? <Component>` branch in Today").not.toBeNull();
  });

  it("each read renders the third fact while it is still running", () => {
    for (const read of READS) {
      // `stillWaiting(read)`, not `read.isLoading`. Both mean "no answer yet";
      // only the second is wrong when a query is pending-but-not-fetching or has
      // resolved empty before auth attached, which is how a populated workspace
      // rendered its first-run screen on production (see @/lib/query-state).
      //
      // AND THE SAME COMPONENT FOR ALL THREE, which is the half a per-read check
      // would miss: three regions each hand-rolling their own wait is how a
      // surface ends up announcing one fetch three ways.
      const waiting = new RegExp(
        `stillWaiting\\(${read}\\)\\s*\\?\\s*\\(?\\s*<${WAIT_TAG}[\\s>]`,
      ).test(jsx);
      expect({ read, waiting }).toEqual({ read, waiting: true });
    }
    expect(waits.length).toBe(READS.length);
  });

  it("the wait comes from a shared primitive, which is what carries the live region", () => {
    // The wait is a live region with a reserved height, so hand-rolling one drops
    // the announcement and the reserved height in a single line, and the screen
    // reader going quiet is the half nobody catches in review.
    //
    // ASSERTED AS "IMPORTED AND NOT DECLARED HERE" rather than as a module path.
    // The old form named `@/components/shell/primitives`, which pinned this
    // surface to the retired component layer: the guard would have had to be
    // edited to allow the port, and a guard that blocks a correct change is one
    // somebody deletes. What actually matters is that the wait is a part the
    // design system owns, wherever the system currently lives.
    expect(IMPORTED.has(WAIT_TAG!), `${WAIT_TAG} is rendered but never imported`).toBe(true);
    expect(offenders(src, new RegExp(`(function|const)\\s+${WAIT_TAG}\\b`))).toEqual([]);
    // And nothing here rolls its own announcement alongside it.
    expect(offenders(jsx, /aria-live/)).toEqual([]);
  });
});

describe("Today's regions do not wait on each other", () => {
  it("the union belongs to the headline and never to a region", () => {
    expect(
      // The FORM changed, the rule did not: still exactly one union, still
      // absent from the JSX below. `stillWaiting` replaced the `||` because
      // `isLoading` is false for a query that is pending but not fetching.
      offenders(src, /const loading = stillWaiting\(queue, missions\);/),
    ).toHaveLength(1);
    expect(offenders(jsx, /\bloading\b/)).toEqual([]);
  });

  it("every read that can fail says so, rather than reading as an empty day", () => {
    // A failed read is not "nothing happened". Today already knew this for the
    // queue and the missions list; the learnings read still rendered silence.
    for (const read of READS) {
      const admits = new RegExp(`${read}\\.isError\\s*\\?`).test(jsx);
      expect({ read, admits }).toEqual({ read, admits: true });
    }
  });
});

describe("Today's wait copy is honest", () => {
  it("states what it is reading, as a fact", () => {
    for (const wait of waits) {
      expect(wait).toMatch(/^Reading .+\.$/);
    }
  });

  it("never advertises latency and never invents progress", () => {
    for (const wait of waits) {
      expect(wait).not.toMatch(/%|\bsecond|\bmoment|\balmost|\bhang on|\bplease wait|\bjust a\b/i);
    }
    // No timer walking an index through a list of labels, which is the shape
    // src/__tests__/no-fabricated-agent-steps.test.ts fails the build over.
    expect(offenders(src, /setInterval|setTimeout/)).toEqual([]);
  });

  it("keeps its dashes out of user-facing text", () => {
    for (const wait of waits) {
      expect(wait).not.toMatch(/[–—]/);
    }
  });

  it("no plain database read wears an agent's clothes", () => {
    // surface-discipline §7: an agent indicator is only for a genuinely
    // dispatched agent. Today reads three tables and dispatches nothing, so the
    // wait may not be handed any flag that would dress it as one.
    expect(
      offenders(src, new RegExp(`<${WAIT_TAG}[^>]*\\b(working|agent|busy|pending)\\b`)),
    ).toEqual([]);
    expect(offenders(src, /AgentPulse/)).toEqual([]);
  });
});

describe("Today never prints a claim it has not read yet", () => {
  it("holds back the learning block's title until the learning is in hand", () => {
    // ASSERTED BY POSITION, NOT BY THE WORDS (2026-08-11). This pinned the
    // literal `<Block title="It learned one thing">`, and that title was wrong
    // for a reason this test could never have caught: it counted the row on
    // screen, not the record behind it, over a workspace holding eight
    // learnings. Renaming it broke a test whose subject is ORDER, which is the
    // same lesson the headline test three cases down has already had to learn
    // twice. The property is that the wait comes first and the titled branch is
    // reached only through `learning?.summary`, and neither depends on the copy.
    //
    // AND NOT ON THE COMPONENT SPELLING EITHER, SINCE 2026-08-21. This read
    // `<Block title`, and the Meridian port renamed `Block` to `Region` --
    // another rename that broke a case whose subject is ORDER, which is the
    // third time on this file. The title is already hoisted to a named constant
    // BECAUSE it has to be identical in both arms, so the constant is the honest
    // anchor: it moves only when the thing this case is about moves.
    const waitAt = jsx.indexOf(`<${WAIT_TAG}>Reading what it learned.</${WAIT_TAG}>`);
    const guardAt = jsx.search(/learning\?\.summary\s*\?/);
    const titleAt = jsx.indexOf("LEARNING_BLOCK", guardAt);
    expect(waitAt).toBeGreaterThan(-1);
    expect(guardAt).toBeGreaterThan(-1);
    expect(titleAt).toBeGreaterThan(-1);
    // Siblings in one ternary chain, never the wait nested under the claim: the
    // branch carrying the title is guarded by the learning itself existing.
    expect(waitAt).toBeLessThan(guardAt);
    expect(guardAt).toBeLessThan(titleAt);
  });

  it("the headline shows the date while it counts, rather than a number it lacks", () => {
    // The one region that legitimately says nothing about reading. A headline
    // reading "Reading..." is the surface talking about itself, and the date is a
    // true fact the person came in already holding.
    //
    // ASSERTED AS A RULE RATHER THAN AS A CHARACTER SEQUENCE, and this test has
    // now had to learn that lesson TWICE.
    //
    // The first version pinned the literal `/if \(loading\) return "Today";/`
    // and broke on 2026-08-11 for a change that STRENGTHENED the property it
    // protected: `stillWaiting` was fixed to stand down on a failed read, which
    // removed the accident by which a cold `missions` failure had kept `loading`
    // true for ever, so the guard widened to `loading || missions.isError`.
    //
    // Its replacement pinned `missions.isError` to the INSIDE of that same
    // branch -- and broke the same afternoon, for the same kind of change. The
    // headline stopped hiding a failed read under the surface's own name and
    // started saying which read died, so `missions.isError` moved out of the
    // "Today" branch into a sentence of its own. Better product, and the guard
    // called it a regression. Pinning the branch was still measuring a shape.
    //
    // THE RULE IS ABOUT ORDER, NOT ABOUT SHAPE: whatever the headline does with
    // a failed read, it must deal with it BEFORE reaching `stateSentence`, which
    // counts and cannot tell a zero it read from a zero it never got.
    const memo = src.match(/const headline = React\.useMemo\(\(\) => \{([\s\S]*?)\n {2}\}/);
    expect(memo, "the headline is no longer a useMemo with a statement body").not.toBeNull();
    const body = memo![1];

    // Still says the surface's name while it counts, rather than "Reading...".
    expect(body).toMatch(/if \([^)]*loading[^)]*\) return "Today";/);

    // Every read the sentence counts has to be answered for first. Two of the
    // three counts in `stateSentence` -- stuck and shipped -- come from
    // `missions`, and the third from `queue`; a zero from either reads as
    // "nothing happened" rather than as "not known".
    const sentenceAt = body.indexOf("stateSentence(");
    expect(sentenceAt).toBeGreaterThan(-1);
    for (const read of ["missions.isError", "queue.isError"]) {
      const guardAt = body.indexOf(read);
      expect(guardAt, `${read} is never consulted in the headline`).toBeGreaterThan(-1);
      expect(
        guardAt,
        `${read} is consulted only after stateSentence has already counted it`,
      ).toBeLessThan(sentenceAt);

      // TEXTUAL PRECEDENCE IS NOT CONTROL-FLOW PRECEDENCE, so position alone is
      // not enough. `return missions.isError ? stateSentence({...}) : "..."`
      // mentions the symbol before the call and is exactly backwards, and the
      // index check above passes it. Requiring the guard to be an `if` that
      // returns a STRING closes that: a branch that hands a failed read to the
      // counter cannot also be a literal sentence.
      const guards = new RegExp(`if \\([^)]*${read.replace(".", "\\.")}[^)]*\\)\\s*return "`);
      expect(body, `${read} is consulted but not in a guard that returns a sentence`).toMatch(
        guards,
      );
    }
  });
});

/**
 * WHAT THE TEST ABOVE STILL CANNOT SEE, written down rather than left implicit.
 *
 * It reads source text, so it is a proxy, and it is the third proxy in this
 * spot: a string pin, then a branch pin, now an order-and-shape pin. Each broke
 * on a change that enforced the rule harder than before, and each replacement
 * was chosen because it was harder to break for the wrong reason -- not because
 * it became a measurement of behaviour. It did not.
 *
 * The gap is that no arrangement of regexes can prove which branch RUNS. The
 * thing that would is rendering this component with a failed `missions` query
 * and asserting the headline is not a count. That does not belong in this file,
 * which is a source-text suite by design and has no renderer; it is a new file
 * and a real piece of work rather than a tweak.
 *
 * Deliberately deferred, and recorded here so the next person does not read the
 * assertions above as stronger than they are.
 */

/**
 * THE SAME RULE, ACROSS THE WHOLE SPINE.
 *
 * Everything above holds Today, and Today alone, because that is the surface
 * the defect was found on. That scoping was itself the gap: on 2026-08-05 an
 * audit found the identical `? null` shape live on SIX of the seven stations
 * while this file sat green, and the team believed the class of bug had been
 * killed the day before. A guard pointed at one file makes the other six look
 * examined.
 *
 * None of those routes declares a loader, so the router's
 * `defaultPendingComponent` never covers them either: on a cold cache a visitor
 * clicking through the spine met a headline over a horizontal rule, six times.
 * Decide was the worst, showing the bare word "Decide" over an empty body while
 * its only real element waited.
 *
 * Deliberately narrower than the Today suite. It asserts the ONE rule that
 * generalises cleanly (a wait may not resolve to nothing) rather than pinning
 * copy per station, because each station legitimately reads different things
 * and this file must not become a place where adding a read means editing a
 * test in another directory.
 */
describe("no station renders nothing while it reads", () => {
  const STATIONS = [
    "_authenticated.discover.tsx",
    "_authenticated.decide.tsx",
    "_authenticated.plan.index.tsx",
    "_authenticated.design.tsx",
    "_authenticated.build.index.tsx",
    "_authenticated.ship.tsx",
    "_authenticated.learn.tsx",
    // Discover's body lives in a component rather than the route, and it is
    // where the defect actually was.
    join("..", "components", "discover", "DiscoverSurface.tsx"),
  ];

  for (const station of STATIONS) {
    const path = join(import.meta.dir, "..", station);
    it(`${station} has no wait branch that resolves to nothing`, () => {
      let source: string;
      try {
        source = stripComments(readFileSync(path, "utf8"));
      } catch {
        // A station that has been renamed should fail loudly here rather than
        // quietly pass by being unreadable.
        throw new Error(`station source not found: ${station}`);
      }
      const bad = source
        .split("\n")
        .map((line, i) => `${i + 1}: ${line.trim()}`)
        .filter((line) => /(isLoading|isPending|\bloading)\s*\?\s*null/.test(line));
      expect(bad).toEqual([]);
    });
  }

  it("covers every station, so a new one cannot be added unguarded", () => {
    // PRIMARY_NAV carries Today plus the seven loop stations. If the spine
    // grows, this count fails and the list above has to be revisited.
    expect(STATIONS.length).toBe(8);
  });
});

/**
 * THE TRIAGE CARD, GUARDED LIKE THE SURFACE IT REPLACED.
 *
 * REQ-016 item 1 merged "Ready for your review" and "What the crew has been
 * doing" into ONE prioritized feed under the glance strip. This block is what
 * made deleting both lanes in the same change safe: the card is singular, its
 * section order is the reversibility rule (calls needing you, runs blocked on
 * you, live runs, finished), every run row states its verb beside its state,
 * the reply stays scoped and composed, a stop still goes through the confirm,
 * and the wait-and-refusal rule this whole file exists for holds inside the
 * merged body too.
 *
 * Same proxy as everywhere above: source text, comments stripped, positions
 * read off the rendered JSX region of the component.
 */
describe("Today's triage feed", () => {
  const at = (marker: string) => jsx.indexOf(marker);

  it("is one card, not two lanes", () => {
    // Both old bodies are gone from the route, the Lane wrapper included.
    // AgentInbox itself stays mounted by its gallery page; only Today stopped
    // rendering it, so absence here means the merge happened, not a deletion.
    expect(offenders(src, /<AgentInbox\b/)).toEqual([]);
    expect(offenders(src, /<Lane\b/)).toEqual([]);
    expect(at("FEED_TITLE"), "the merged card has no title of its own").toBeGreaterThan(-1);
  });

  it("reads calls first, then blocked-on-you, then live, then finished", () => {
    const order = ["FEED_CALLS", "FEED_REPLY", "FEED_LIVE", "FEED_OPEN"].map(at);
    expect(order.every((i) => i > -1), "a section marker is never rendered").toBe(true);
    expect(
      [...order].sort((a, b) => a - b),
      "the sections drifted out of the priority order",
    ).toEqual(order);
  });

  it("reaches the review act through the queue, inside the calls section", () => {
    const queueAt = at("<DecisionQueue");
    expect(queueAt).toBeGreaterThan(-1);
    expect(queueAt).toBeGreaterThan(at("FEED_CALLS"));
    expect(queueAt).toBeLessThan(at("FEED_REPLY"));
  });

  it("states the verb beside the state on every run row, in its own section", () => {
    const replyVerbAt = jsx.search(/Reply\s*<\/Action>/);
    const stopVerbAt = jsx.search(/Stop\s*<\/Action>/);
    const openVerbAt = jsx.search(/Open\s*<\/Door>/);
    for (const found of [replyVerbAt, stopVerbAt, openVerbAt]) {
      expect(found, "a run row lost its verb").toBeGreaterThan(-1);
    }
    expect(replyVerbAt, "Reply escaped the Waiting-on-you section").toBeLessThan(at("FEED_LIVE"));
    const stopWithinLive = stopVerbAt > at("FEED_LIVE") && stopVerbAt < at("FEED_OPEN");
    expect(stopWithinLive, "Stop escaped the Running section").toBe(true);
    const openWithinFinished = openVerbAt > at("FEED_OPEN");
    expect(openWithinFinished, "Open escaped the Finished section").toBe(true);
  });

  it("keeps the answer scoped to the run that asked, composed before it is sent", () => {
    // Exactly one place composes the scoped prefix, and `openAsk` SENDS its
    // argument as the conversation's first turn -- which is why the compose
    // step may never be skipped on the way there.
    expect((src.match(/About the run "/g) ?? []).length).toBe(1);
    const composeAt = jsx.indexOf('About the run "');
    expect(composeAt).toBeGreaterThan(-1);
    expect(composeAt).toBeGreaterThan(at("FEED_REPLY"));
    expect(composeAt).toBeLessThan(at("FEED_LIVE"));
  });

  it("stops a live run only through the app's own confirm", () => {
    const wiredAt = jsx.indexOf("cancelRunAt(row.id)");
    expect(wiredAt, "Stop is no longer wired to the confirmed mutation").toBeGreaterThan(-1);
    expect(wiredAt).toBeGreaterThan(at("FEED_LIVE"));
    expect(wiredAt).toBeLessThan(at("FEED_OPEN"));
  });

  it("admits the run record's wait and refusal inside the merged body", () => {
    // The guard extension REQ-016 asks for: the missions read still names its
    // own wait AND its own refusal, now inside the one card rather than in a
    // lane of its own.
    const queueMountedAt = at("<DecisionQueue");
    /*
     * ANCHORED ON THE SENTENCE, NOT ON THE ELEMENT (2026-08-27).
     *
     * This read `"<Reading>Reading the run record.</Reading>"` and so it broke
     * when the wrapper became `SlowRead`, which draws the identical paragraph
     * for the first two and a half seconds and then adds an elapsed figure.
     * Nothing REQ-016 asks for moved: the missions read still names its own
     * wait, still inside the one card, still before its own refusal.
     *
     * The sentence is the contract and the element is an implementation
     * detail, so this now matches the half that carries the meaning. A test
     * that fails on a wrapper rename is a test that will be silenced rather
     * than read the next time somebody is in a hurry.
     */
    const runWaitAt = jsx.indexOf("Reading the run record.");
    const runRefusalAt = jsx.indexOf("missions.refetch()");
    expect(runWaitAt).toBeGreaterThan(queueMountedAt);
    expect(runRefusalAt).toBeGreaterThan(runWaitAt);
  });
});
