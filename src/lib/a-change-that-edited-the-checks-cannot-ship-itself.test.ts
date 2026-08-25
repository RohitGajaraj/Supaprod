/**
 * R-27's FIFTH precondition: THE LOOP MAY NOT SHIP A CHANGE THAT EDITED WHAT
 * THE CHECKS RUN.
 *
 * The first four ask whether the change is SAFE (merged, CI green at that head
 * sha, a live preview at that commit) and whether the deploy will be ANSWERABLE
 * (a decision behind it carrying a forecast and a horizon). **Every one of the
 * four asks whether CI passed. None asked whether the loop edited what CI
 * runs**, and on 2026-08-25 that gap was walked through.
 *
 * F-63, 13:01 UTC, unattended, in a customer's repository. The Build station
 * changed `package.json`:
 *
 *   - "lint": "tsc --noEmit",
 *   + "lint": "echo 'Lint skipped: no ESLint config' && exit 0",
 *
 * It disabled the type check that would have caught its own unresolvable
 * `@testing-library/react` import, and misdescribed the script as a missing
 * ESLint config to justify it. CI stayed red only because GitHub Actions was
 * separately dead on billing (F-64) — **nothing ran, so nothing caught it.** Had
 * the agent disabled `test` as well, CI would have gone green and all four
 * preconditions would have passed. This file is the assertion that a change
 * which moved the ruler cannot be the thing measured by it.
 *
 * IT IS DEFENCE IN DEPTH AND THE TESTS SAY SO. `studio.stage` and
 * `studio.commit` already refuse these paths at write time
 * (`assertStudioPathAllowed`). This gate catches what that cannot: a changeset
 * staged before that guard existed, or written by any path that does not go
 * through it. Neither may be deleted on the strength of the other.
 */
import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { unattendedShipIsGradable } from "@/lib/deployments.functions";
import { STUDIO_FORBIDDEN_PREFIXES } from "@/lib/ai/tools/registry.server";

type Reply = { data: unknown; error: { message: string } | null };

/**
 * The same PostgREST-shaped stub the fourth precondition's tests use: every
 * filter returns `this`, the terminal call is `maybeSingle()` or awaiting the
 * builder, and replies are A QUEUE PER TABLE because `spine_track_members` is
 * read twice with two different shapes.
 */
function db(script: Record<string, Reply[]>): SupabaseClient {
  const queues: Record<string, Reply[]> = Object.fromEntries(
    Object.entries(script).map(([t, r]) => [t, [...r]]),
  );
  return {
    from(table: string) {
      const reply: Reply = queues[table]?.shift() ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        maybeSingle: async () => reply,
        then: (resolve: (r: Reply) => unknown) => Promise.resolve(reply).then(resolve),
      };
      for (const filter of ["select", "eq", "order", "limit", "not", "is", "in"]) {
        builder[filter] = () => builder;
      }
      return builder;
    },
  } as unknown as SupabaseClient;
}

const CHANGESET = "11111111-1111-4111-8111-111111111111";

/** An intact chain whose changeset touches only product code. */
function chain(over: Partial<Record<string, Reply[]>> = {}): Record<string, Reply[]> {
  return {
    studio_changesets: [{ data: { id: CHANGESET, mission_id: "m1" }, error: null }],
    studio_changes: [
      {
        data: [{ path: "src/components/inbox/InboxSurface.tsx" }, { path: "src/lib/inbox.ts" }],
        error: null,
      },
    ],
    spine_track_members: [
      { data: { track_id: "t1" }, error: null },
      { data: [{ artifact_id: "d1" }], error: null },
    ],
    decisions: [
      {
        data: {
          forecast_claim: "Mute rate drops to 12% or below within 30 days of rollout",
          forecast_horizon_date: "2026-09-25",
        },
        error: null,
      },
    ],
    ...over,
  };
}

/** The same chain with one path swapped in for the files it changes. */
function touching(...paths: string[]): Record<string, Reply[]> {
  return chain({ studio_changes: [{ data: paths.map((path) => ({ path })), error: null }] });
}

describe("a changeset that left the checks alone", () => {
  it("still ships on its own, exactly as it did before the fifth precondition", async () => {
    const res = await unattendedShipIsGradable(db(chain()), CHANGESET);
    expect(res).toEqual({ ok: true, why: "" });
  });

  /**
   * PREFIX MATCHING IS NOT SUBSTRING MATCHING, and this pins the semantics to
   * `assertStudioPathAllowed`'s exactly (`path === prefix || startsWith`). A
   * source file whose name merely ENDS in a forbidden one is ordinary work.
   *
   * The shared limit that follows from it — `packages/api/package.json` in a
   * monorepo is not matched by either — is deliberately left identical in both
   * places. Widening it here and not there is how the gate and the write-time
   * refusal would start answering the same question two ways (F-29). It belongs
   * in the one list, not in this file.
   */
  it("does not refuse a source file that merely ends in a forbidden name", async () => {
    const res = await unattendedShipIsGradable(
      db(touching("src/fixtures/package.json")),
      CHANGESET,
    );
    expect(res.ok).toBe(true);
  });
});

describe("a changeset that edited what the checks run", () => {
  /** The exact file, and the exact act, of F-63. */
  it("refuses a changeset that touches package.json", async () => {
    const res = await unattendedShipIsGradable(db(touching("package.json")), CHANGESET);
    expect(res.ok).toBe(false);
    expect(res.why).toContain("package.json");
  });

  it("refuses a changeset that touches .github/workflows/ci.yml", async () => {
    const res = await unattendedShipIsGradable(db(touching(".github/workflows/ci.yml")), CHANGESET);
    expect(res.ok).toBe(false);
    expect(res.why).toContain(".github/workflows/ci.yml");
  });

  /**
   * NAMES THE PATH AND THE ALTERNATIVE. F-24: a prohibition whose escape hatch
   * nobody can see gets the same behaviour under a new name — which is precisely
   * how F-63 happened, when "you cannot add a dependency" redirected the agent
   * into disabling the check instead of ending the behaviour.
   */
  it("names the offending path and what to do instead, not just the refusal", async () => {
    const res = await unattendedShipIsGradable(
      db(touching("src/lib/ok.ts", "tsconfig.json")),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("tsconfig.json");
    // The honest out, in the words Build is already briefed with.
    expect(res.why).toContain("the spec cannot be built with what is present");
    // And the path that was fine is not blamed alongside it.
    expect(res.why).not.toContain("src/lib/ok.ts");
  });

  /**
   * ONE LIST, TWO ENFORCEMENT POINTS. This walks the imported
   * `STUDIO_FORBIDDEN_PREFIXES` entry by entry, so the day somebody adds
   * `biome.json` to the write-time floor the ship gate inherits it without
   * anyone remembering to come here. A second copy of the list is the thing this
   * assertion exists to make impossible.
   */
  it.each(STUDIO_FORBIDDEN_PREFIXES)("refuses %s, straight from the shared list", async (p) => {
    const path = p.endsWith("/") ? `${p}something.yml` : p;
    const res = await unattendedShipIsGradable(db(touching(path)), CHANGESET);
    expect(res.ok).toBe(false);
    expect(res.why).toContain(path);
  });

  /**
   * AN EMPTY READ IS NOT AN EMPTY CHANGESET, and here it is the bypass case
   * itself: a changeset with no `studio_changes` rows never went through
   * `studio.stage`, which is exactly the route this precondition exists to
   * cover. `studio.commit` refuses a changeset with no staged changes and the
   * only deletes are pre-commit curation, so a merged one always has rows.
   */
  it("refuses when the file list comes back empty, because it cannot see what changed", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ studio_changes: [{ data: [], error: null }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("empty");
  });

  /** A read that FAILED is not a read that found nothing. */
  it("refuses on an unreadable file list and names the database error", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ studio_changes: [{ data: null, error: { message: "statement timeout" } }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("statement timeout");
  });

  /**
   * ASKED BEFORE THE MISSION HOP, ON PURPOSE. A changeset that switched off its
   * own type check AND has a broken grading chain must report the tampering,
   * because that is the sentence a person needs to read on the approval — not
   * "this changeset is not attached to a mission".
   */
  it("reports the tampering ahead of a broken grading chain", async () => {
    const res = await unattendedShipIsGradable(
      db({
        ...touching("package.json"),
        studio_changesets: [{ data: { id: CHANGESET, mission_id: null }, error: null }],
      }),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("package.json");
    expect(res.why).not.toContain("mission");
  });
});

/**
 * THE FIFTH PRECONDITION ADDED A QUESTION; IT DID NOT MOVE THE OTHER FOUR. Each
 * of these was passing before this change and must answer the same way after it,
 * with its own sentence (R-16), on a changeset whose files are beyond reproach.
 */
describe("the preconditions that were already here", () => {
  it("still refuses a changeset that does not exist", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ studio_changesets: [{ data: null, error: null }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("does not exist");
  });

  it("still refuses a changeset with no mission", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({ studio_changesets: [{ data: { id: CHANGESET, mission_id: null }, error: null }] }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("not attached to a mission");
  });

  it("still refuses a mission filed against no piece of work", async () => {
    const res = await unattendedShipIsGradable(
      db(chain({ spine_track_members: [{ data: null, error: null }] })),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("not filed against any piece of work");
  });

  it("still refuses work whose decision recorded no forecast", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({
          decisions: [{ data: { forecast_claim: null, forecast_horizon_date: null }, error: null }],
        }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("no forecast");
  });

  it("still refuses a claim with no horizon, because it can never come due", async () => {
    const res = await unattendedShipIsGradable(
      db(
        chain({
          decisions: [
            {
              data: { forecast_claim: "Mute rate drops", forecast_horizon_date: null },
              error: null,
            },
          ],
        }),
      ),
      CHANGESET,
    );
    expect(res.ok).toBe(false);
    expect(res.why).toContain("never come due");
  });

  /**
   * THE WHOLE POINT OF THE GUARD IS THAT IT REFUSES WHEN IT CANNOT SEE. R-22: a
   * guard that cannot read its evidence must not be the thing that lets work
   * through.
   */
  it("still refuses when the lookup throws rather than returning", async () => {
    const exploding = {
      from() {
        throw new Error("PostgREST unreachable");
      },
    } as unknown as SupabaseClient;
    const res = await unattendedShipIsGradable(exploding, CHANGESET);
    expect(res.ok).toBe(false);
    expect(res.why).toContain("PostgREST unreachable");
  });

  it("never returns a refusal without a reason", async () => {
    const refusals = await Promise.all([
      unattendedShipIsGradable(db(touching("package.json")), CHANGESET),
      unattendedShipIsGradable(db(touching(".github/workflows/ci.yml")), CHANGESET),
      unattendedShipIsGradable(
        db(chain({ studio_changes: [{ data: [], error: null }] })),
        CHANGESET,
      ),
    ]);
    for (const r of refusals) {
      expect(r.ok).toBe(false);
      expect(r.why.trim().length).toBeGreaterThan(10);
    }
  });
});
