/**
 * A queue can be answered in one call, and every id comes back accounted for.
 *
 * WHY THIS EXISTS. Every gate was one press, so a workspace holding two hundred
 * pending approvals held two hundred clicks, and the machine surface had no bulk
 * operation of any kind. The founder's bar is that anything a human can do is
 * available programmatically; a queue drainable only one row at a time fails that
 * on both sides at once.
 *
 * WHAT MATTERS MORE THAN THE FEATURE. A bulk endpoint is easy to build badly in
 * three specific ways, and each one is pinned below: it can become a SECOND write
 * path that drifts from the single-item one, it can abort the whole batch on the
 * first refusal and leave a partially decided set nobody can see the shape of, and
 * it can decide the same gate twice when a caller names it twice. The approvals
 * path was fixed this month for a double-execute that merged a customer pull
 * request twice, so the third one is not hypothetical here.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MAX_BULK_DECISIONS } from "./approvals-queue.functions";

const SRC = readFileSync(join(import.meta.dir, "approvals-queue.functions.ts"), "utf8");

/** The bulk handler body, so a match cannot be satisfied by a neighbour. */
function bulkBody(): string {
  const decl = SRC.indexOf("export const decideApprovalItems");
  expect(decl).toBeGreaterThan(-1);
  // Back up to the doc comment above the declaration. The reasoning a later
  // reader needs is in that comment, so a slice that started at `export` would
  // let the header be deleted without failing anything.
  const start = SRC.lastIndexOf("/**", decl);
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("/** Routes one decided gate", decl);
  expect(end).toBeGreaterThan(decl);
  return SRC.slice(start, end);
}

describe("one write path, not two", () => {
  it("routes every item through the same body the single door uses", () => {
    // THE DRIFT THIS PREVENTS. `routeDecision` is the only place that knows how
    // each of the ten gate families resolves. A bulk endpoint that re-implemented
    // any of it would be a parallel decision path: a family added to one and not
    // the other, or provenance read after the write in one of them.
    expect(bulkBody()).toContain("decideOneApprovalItem(db, context.userId,");
  });

  it("the single door routes through it too, so neither is the special case", () => {
    const single = SRC.slice(
      SRC.indexOf("export const decideApprovalItem = createServerFn"),
      SRC.indexOf("export const MAX_BULK_DECISIONS"),
    );
    expect(single).toContain("decideOneApprovalItem(db, context.userId, data)");
  });

  it("reads provenance before the write, in the shared body", () => {
    // Every resolver rewrites status, and `prds` moves to approved or draft, so
    // reading attribution afterwards would attribute the decision rather than the
    // thing decided on. It is asserted on the shared body precisely so it cannot
    // be true of one door and false of the other.
    const shared = SRC.slice(
      SRC.indexOf("async function decideOneApprovalItem"),
      SRC.indexOf("export const decideApprovalItem = createServerFn"),
    );
    expect(shared.indexOf("readGateAttribution")).toBeLessThan(shared.indexOf("routeDecision"));
  });
});

describe("one refusal does not cost the rest of the batch", () => {
  it("catches per item instead of letting one throw end the loop", () => {
    // A batch that stopped at the first refusal would leave a partially decided
    // set with no record of where it stopped, and the caller would have to diff
    // the queue to find out.
    const body = bulkBody();
    const loop = body.slice(body.indexOf("for (const item of data.items)"));
    expect(loop).toContain("try {");
    expect(loop).toContain("} catch (e) {");
    expect(loop).toContain("refused.push(");
  });

  it("carries the resolver's own reason, never a generic one", () => {
    // "Already answered", "belongs to someone else" and "a real failure" want
    // three different responses from whoever reads this.
    expect(bulkBody()).toContain("e instanceof Error ? e.message");
  });

  it("accounts for every id, in exactly one list", () => {
    // A caller that presses approve on forty gates and gets {ok:true} back knows
    // nothing it can act on: it cannot tell forty successes from thirty-nine plus
    // a silent refusal.
    const body = bulkBody();
    expect(body).toContain("decided.push({ kind: item.kind, id: item.id })");
    expect(body).toContain("return { decided, refused };");
    // And never a bare boolean, which is what the single-item door returns and
    // what would be useless here.
    expect(body).not.toContain("return { ok: true }");
  });
});

describe("a caller's own duplicate is not a double execution", () => {
  it("deduplicates on kind and id before anything runs", () => {
    // Several resolvers are not idempotent. `studio.pr.merge` merging a customer
    // pull request twice is the defect this repo fixed this month, so the same
    // gate named twice in one batch must be decided once.
    const body = bulkBody();
    expect(body).toContain("const seen = new Set<string>()");
    expect(body).toContain("`${item.kind}:${item.id}`");
    expect(body).toContain("if (seen.has(key)) continue;");
  });

  it("runs sequentially, which is a safety choice and not an oversight", () => {
    // Firing fifty non-idempotent resolvers at once multiplies exactly the
    // double-execute risk above, for a saving nobody asked for on a bounded list.
    const body = bulkBody();
    expect(body).not.toContain("Promise.all");
    expect(body).not.toContain("Promise.allSettled");
  });
});

describe("it is bounded, and the bound is stated once", () => {
  it("caps the batch", () => {
    // An unbounded loop of writes behind one request is a way to hold a Worker
    // open until it is killed between two of them.
    expect(MAX_BULK_DECISIONS).toBe(50);
    expect(SRC).toContain(".max(MAX_BULK_DECISIONS)");
  });

  it("refuses an empty batch rather than answering yes to nothing", () => {
    expect(SRC).toContain(".min(1)");
  });

  it("shares the gate-kind vocabulary with the single door", () => {
    // Derived by omitting `verdict` from the single-item schema, so a new gate
    // family is accepted by both doors on the day it is added or by neither.
    expect(SRC).toContain("DecideSchema.omit({ verdict: true })");
  });
});

describe("what it deliberately is not", () => {
  it("says in its own header that it is not the policy fix", () => {
    // The governance canon says a long queue is a policy failure to surface
    // rather than a workload to render, and the right answer to "you approved
    // fourteen of these without changes" is to offer to stop asking. This makes
    // the existing backlog answerable; it does not change any policy, and a
    // future reader must not mistake it for having done so.
    const body = bulkBody();
    expect(body).toContain("policy failure to surface");
    expect(body.toLowerCase()).toContain("still owed");
  });
});
