/**
 * F-119: A FAILED READ OF THE AUTONOMY DIAL GRANTED MORE THAN ANYONE SET.
 *
 * `loadAgentArc` destructured `const { data }` and never looked at `error`. So a
 * refused, timed-out or malformed read arrived as `data: null`, took the absence
 * branch, and returned **"trusted"** — the widest arc short of ambient. An
 * operator who had deliberately pinned an agent to `observing` would have had
 * that pin silently discarded by a transient database error.
 *
 * This is F-76's shape landing on the worst possible surface. Everywhere else
 * the cost of confusing "the read failed" with "there is nothing there" is a
 * page that says "nothing here". Here the cost is an agent acting without the
 * review its operator asked for, and 190 of 283 live agents have no row at all,
 * so the absence branch is the one most calls take.
 *
 * ── WHY `observing` ON ERROR, AND WHY THAT IS NOT THE THING autonomy-policy.ts
 *    ARGUES AGAINST ──────────────────────────────────────────────────────────
 * That module says a missing POLICY must resolve to the shipped default rather
 * than to an extreme, because falling closed "would freeze the loop ... and the
 * human is back to approving everything". Correct, and it does not reach this
 * case: that is a workspace-level configuration row whose absence is a permanent
 * state, this is one transient read on one tool call. Falling to `observing`
 * here queues ONE review. It stops nothing.
 *
 * The absence branch is untouched and still returns "trusted", because that is
 * the founder's SW-7 ruling and it is about absence, not about failure.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { loadAgentArc, resolveApprovalMode } from "./trust.server";

/** A client whose single read returns whatever this test wants it to. */
const clientReturning = (res: { data: unknown; error: { message: string } | null }) =>
  ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: async () => res }),
        }),
      }),
    }),
  }) as unknown as SupabaseClient;

describe("absence and failure are told apart", () => {
  it("NO ROW runs trusted, which is the founder's SW-7 ruling", async () => {
    // 190 of 283 live agents are in this shape, so this is the common path and
    // the fix must not disturb it.
    expect(await loadAgentArc(clientReturning({ data: null, error: null }), "u", "a")).toBe(
      "trusted",
    );
  });

  it("A FAILED READ falls back to review, not to trusted", async () => {
    const arc = await loadAgentArc(
      clientReturning({ data: null, error: { message: "statement timeout" } }),
      "u",
      "a",
    );
    expect(arc).toBe("observing");
    expect(arc).not.toBe("trusted");
  });

  it("an operator's explicit arc is still honoured", async () => {
    expect(
      await loadAgentArc(clientReturning({ data: { arc: "proving" }, error: null }), "u", "a"),
    ).toBe("proving");
  });

  it("and an error wins even when a row somehow came back with it", async () => {
    // If the driver reports both, the failure is the fact that matters: we do
    // not know whether that row is current.
    expect(
      await loadAgentArc(
        clientReturning({ data: { arc: "trusted" }, error: { message: "partial read" } }),
        "u",
        "a",
      ),
    ).toBe("observing");
  });
});

describe("what the fallback actually costs, in the dial's own terms", () => {
  it("observing sends every tool to review, including auto ones", () => {
    expect(resolveApprovalMode("auto", "observing")).toBe("review");
    expect(resolveApprovalMode("confirm", "observing")).toBe("review");
  });

  it("which is exactly what the unreadable case should do: ask, not proceed", () => {
    // The consequence of the old behaviour, stated as the contrast it is.
    expect(resolveApprovalMode("confirm", "trusted")).toBe("auto");
    expect(resolveApprovalMode("confirm", "observing")).toBe("review");
  });

  it("and it is a fallback rather than a freeze: review is a queue, not a stop", () => {
    // `review` is the mode every workspace ran under before anyone opted in, so
    // it is a known-working state rather than an extreme.
    expect(resolveApprovalMode("review", "trusted")).toBe("review");
  });
});
