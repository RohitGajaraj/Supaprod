/**
 * THE TRACE IS THE LOOPHOLE IN §2, AND THIS IS WHERE IT IS CLOSED.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §2 disciplines the cursor: no live run, no cursor.
 * **§3.2 then asks for a mark that stays AFTER the teammate leaves** — which is,
 * by construction, a thing drawn about a row that is no longer live. That is the
 * one place in this feature where the obvious implementation is the forbidden
 * one: keep a copy, start a countdown, fade it out.
 *
 * A countdown is a timer, and §2 names a timer advancing labels as the exact
 * regression that has already failed a branch in this repository.
 *
 * **So the trace's lifetime is the AGE OF ITS ROW**, and the test that proves
 * the difference is the fourth one below: a change that happened four minutes
 * ago draws nothing the moment its teammate departs, where a
 * departure-triggered countdown would have drawn it for another forty-five
 * seconds and been wrong for every one of them.
 */
import { describe, expect, it } from "bun:test";
import { rememberAnchors, tracesFrom, TRACE_MS, type Trace } from "./presence-trace";
import { groupKeyOf, type Anchor } from "@/lib/presence/collision";

const PRD = "e9e5b033-1111-4222-8333-444455556666";
const T0 = Date.parse("2026-08-31T12:00:00.000Z");

function anchor(over: Partial<Anchor> = {}): Anchor {
  return {
    runId: "run-1",
    agentSlug: "builder",
    missionId: "m1",
    toolName: "prd.revise", // side-effecting: it changes the thing
    targetKind: "row:prd",
    targetId: PRD,
    createdAt: new Date(T0).toISOString(),
    ...over,
  };
}

const remember = (live: Anchor[], now = T0, seen: Map<string, Trace> = new Map()) =>
  rememberAnchors(seen, live, now);

describe("what leaves a trace, and what does not", () => {
  it("remembers a change", () => {
    const seen = remember([anchor()]);
    expect(seen.size).toBe(1);
    expect(seen.get(groupKeyOf(anchor()))!.slug).toBe("builder");
  });

  it("does NOT remember a read, because nothing moved", () => {
    /* §3.2's words are "can still see WHAT MOVED". A `repo.read` moved nothing.
       And this is the common case rather than an edge one - the tools that name
       a target are overwhelmingly reads - so a trace on a read would be the
       always-on mark that teaches a person to stop looking. */
    expect(remember([anchor({ toolName: "repo.read" })]).size).toBe(0);
    expect(remember([anchor({ toolName: "prd.get" })]).size).toBe(0);
  });

  it("drops an anchor whose timestamp cannot be read", () => {
    /* A trace is nothing but an age. Treating an unparseable stamp as `now`
       would make it the LONGEST-lived mark on screen, which is the opposite of
       what an unusable value should buy. */
    expect(remember([anchor({ createdAt: "not a date" })]).size).toBe(0);
  });
});

describe("a trace expires by its row's age, never by our clock", () => {
  it("draws nothing for a change that is already older than the window", () => {
    /*
     * THE ONE THAT PROVES THE DESIGN.
     *
     * The teammate is gone (no live anchors). Its last change was four minutes
     * ago. A departure-triggered countdown would start now and draw "changed
     * this" for the next forty-five seconds - and it would be false the entire
     * time, because nothing changed just now.
     */
    const old = T0 - 4 * 60_000;
    const seen = remember([anchor({ createdAt: new Date(old).toISOString() })], old);
    expect(seen.size).toBe(1); // we did see it happen...
    expect(tracesFrom(seen, [], T0)).toEqual([]); // ...and it is not "just now"
  });

  it("draws a change that is still inside the window after the teammate goes", () => {
    const seen = remember([anchor()]);
    const out = tracesFrom(seen, [], T0 + TRACE_MS - 1_000);
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe("builder");
  });

  it("stops drawing it the moment the window closes", () => {
    const seen = remember([anchor()]);
    expect(tracesFrom(seen, [], T0 + TRACE_MS)).toEqual([]);
  });

  it("forgets it, so the memory cannot grow with the session", () => {
    /* The other way a remembered-state feature fails: quietly, over hours. An
       entry is only carried forward while its row is inside the window. */
    const seen = remember([anchor()]);
    expect(rememberAnchors(seen, [], T0 + TRACE_MS).size).toBe(0);
  });
});

describe("a live object is not a trace", () => {
  it("yields to the cursor while the teammate is still on it", () => {
    /* Two marks on one object saying the same teammate both is and is not there
       is worse than either alone. */
    const a = anchor();
    const seen = remember([a]);
    expect(tracesFrom(seen, [a], T0 + 1_000)).toEqual([]);
  });

  it("returns as a trace once that teammate moves on", () => {
    const a = anchor();
    const seen = remember([a]);
    const elsewhere = anchor({ targetId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" });
    expect(tracesFrom(seen, [elsewhere], T0 + 1_000)).toHaveLength(1);
  });
});

describe("one object, one trace", () => {
  it("keeps the newest change rather than the first", () => {
    /* "Changed just now" is a claim about the OBJECT, not about a person, so
       the later action is the true one. */
    const first = anchor({ runId: "r1", agentSlug: "builder" });
    const later = anchor({
      runId: "r2",
      agentSlug: "designer",
      toolName: "design.draft",
      createdAt: new Date(T0 + 5_000).toISOString(),
    });
    const seen = remember([first, later], T0 + 5_000);
    expect(seen.size).toBe(1);
    expect(seen.get(groupKeyOf(first))!.slug).toBe("designer");
  });

  it("orders the newest last so the freshest change paints on top", () => {
    const a = anchor({ targetId: PRD });
    const b = anchor({
      targetId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      createdAt: new Date(T0 + 5_000).toISOString(),
    });
    const seen = remember([a, b], T0 + 5_000);
    const out = tracesFrom(seen, [], T0 + 6_000);
    expect(out.map((t) => t.at)).toEqual([T0, T0 + 5_000]);
  });
});
