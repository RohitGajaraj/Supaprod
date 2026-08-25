/**
 * F-67. THE COMMIT FLOOR WAS RIGHT, AND IT WAS ALSO PERMANENT.
 *
 * Changeset `f9354439` was staged at 13:01 on 2026-08-25 carrying the
 * `package.json` the builder rewrote to disable the type check (F-63). F-63's
 * floor then arrived and `studio.commit` began refusing it — correctly, and
 * this is precisely the defence-in-depth case the guard was written for, since
 * the staging guard did not exist when that file was staged.
 *
 * **But the refusal never expired.** At 15:00 two clean stages succeeded —
 * `AddressStep.tsx` and a new `AddressStep.test.ts` — and the commit carrying
 * them was refused because of a file staged two hours earlier. No tool removed
 * a staged path. The operator's curation (`rejectStagedFile`, `enforceTouchList`
 * in studio.functions.ts) sits behind `requireSupabaseAuth` as a TanStack server
 * function: reachable from a browser session, and from nowhere an agent stands.
 * So a changeset that ever touched a forbidden path was unshippable forever,
 * and the crew's own good work was trapped behind it on a track running with no
 * human in it.
 *
 * WHAT THIS FILE PINS:
 *
 *   · **The floor does not move.** `studio.commit` still refuses, still whole,
 *     still with no override — the F-63 guarantee is unchanged, and the first
 *     block here re-proves it rather than taking it on trust.
 *
 *   · **The refusal names the way out.** F-24's lesson is that a prohibition
 *     whose alternative the agent cannot see gets the same behaviour under a
 *     new name, and here the agent could not see one BECAUSE THERE WAS NOT ONE.
 *
 *   · **`studio.unstage` exists, runs unattended, and removes the staged intent
 *     only.** It is not a revert and must never claim to be: an agent that
 *     believes it undid a pushed commit will report exactly that, which is F-68
 *     arriving from a new direction.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";
import { toolConsequence, toolRisk } from "@/lib/tool-consequences";

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "registry.server.ts"), "utf8");

/** The file staged at 13:01 that made the changeset permanently unshippable. */
const THE_POISONED_PATH = "package.json";
/** The two clean stages from 15:00 that were trapped behind it. */
const THE_TRAPPED_WORK = ["src/checkout/AddressStep.tsx", "src/checkout/AddressStep.test.ts"];

const CHANGESET_ID = "f9354439-1111-4111-8111-111111111111";
const MISSION_ID = "11111111-1111-4111-8111-111111111111";

/**
 * Routed by table so `idempotency_keys` answers empty (a client that hands one
 * row to every table makes `withIdempotency` report a replay and the tool
 * returns without doing anything). `deleted` records what left `studio_changes`,
 * which is the only observable effect studio.unstage has.
 */
function fakeSupabase(opts: { staged: string[]; status?: string; branch?: string | null }) {
  const deleted: string[][] = [];
  const changeset = {
    id: CHANGESET_ID,
    mission_id: MISSION_ID,
    repo: "Supaprod/relay-homeowner-app",
    branch: opts.branch === undefined ? "studio/m1-f9354439" : opts.branch,
    base_sha: "abc",
    status: opts.status ?? "staged",
    title: "checkout address step",
    pr_url: null,
    pr_number: null,
    product_id: null,
  };
  let staged = [...opts.staged];

  const make = (table: string) => {
    let isDelete = false;
    let inPaths: string[] | null = null;
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "neq", "is", "order", "limit", "update", "insert"]) {
      b[m] = () => b;
    }
    b.delete = () => {
      isDelete = true;
      return b;
    };
    b.in = (_col: string, vals: string[]) => {
      inPaths = vals;
      return b;
    };
    const settle = () => {
      if (table === "studio_changes" && isDelete) {
        const removing = inPaths ?? [];
        deleted.push([...removing]);
        staged = staged.filter((p) => !removing.includes(p));
        return { data: null, error: null };
      }
      if (table === "studio_changes") {
        const rows = staged.map((path) => ({
          path,
          op: "update",
          base_content: "",
          new_content: "x",
        }));
        return { data: rows, error: null, count: rows.length };
      }
      return { data: null, error: null, count: 0 };
    };
    b.maybeSingle = async () => ({
      data: table === "studio_changesets" ? changeset : null,
      error: null,
    });
    b.single = async () => ({
      data: table === "studio_changesets" ? changeset : null,
      error: null,
    });
    b.then = (resolve: (v: unknown) => unknown) => Promise.resolve(settle()).then(resolve);
    return b;
  };
  return {
    client: { from: (table: string) => make(table) } as never,
    deleted,
    stagedNow: () => staged,
  };
}

const ctxFor = (client: unknown) =>
  ({
    supabase: client,
    userId: "u1",
    workspaceId: "w1",
    missionId: MISSION_ID,
    runId: null,
  }) as never;

const commitWith = (staged: string[]) => {
  const db = fakeSupabase({ staged });
  return TOOL_REGISTRY["studio.commit"]!.run(
    { message: "the work order's change" },
    ctxFor(db.client),
  );
};

const unstage = (args: unknown, opts: Parameters<typeof fakeSupabase>[0]) => {
  const db = fakeSupabase(opts);
  const tool = TOOL_REGISTRY["studio.unstage"]!;
  return { db, run: () => tool.run(tool.argsSchema.parse(args), ctxFor(db.client)) };
};

// ── the floor is unchanged ─────────────────────────────────────────────────

describe("studio.commit still refuses the file the loop is not allowed to write", () => {
  it("refuses the exact changeset that stalled the acceptance run", async () => {
    // package.json plus the two honest files from 15:00, which is the real
    // shape: the refusal is not about a changeset full of poison.
    await expect(commitWith([THE_POISONED_PATH, ...THE_TRAPPED_WORK])).rejects.toThrow(/Refused/i);
  });

  it("refuses whole rather than committing the clean files and skipping the rest", async () => {
    // Option (c), rejected. A commit that silently carries fewer files than the
    // agent staged is the platform manufacturing F-68 — and "it reports what it
    // skipped" is exactly the mitigation the day's evidence says does not work,
    // since a seat asserted "committed" over a visible ok:false in one turn.
    const src = REGISTRY_SOURCE.slice(
      REGISTRY_SOURCE.indexOf("F-67. THE COMMIT FLOOR WAS RIGHT"),
      REGISTRY_SOURCE.indexOf("THE SECRET FLOOR"),
    );
    expect(src).toContain("throw new Error");
    expect(src).not.toContain(".filter((c) => !isStudioPathForbidden");
  });

  it("refuses before a credential is resolved, so it cannot depend on GitHub being up", async () => {
    // The fake client reaches no network. If this ever needs one, the floor has
    // slipped below a seam that can fail for unrelated reasons.
    await expect(commitWith([THE_POISONED_PATH])).rejects.toThrow(/Refused/i);
  });

  it("lets the two clean stages through the path floor", async () => {
    // They must fail for a DIFFERENT reason (the fake reaches no GitHub), never
    // for the path. That distinction is the whole assertion.
    await expect(commitWith(THE_TRAPPED_WORK)).rejects.not.toThrow(/Refused/i);
  });

  it("asks the same question the stage floor asks, from the same list", () => {
    // One list and one matching rule. Two copies is how prd_scaffolds and
    // prototypes came to disagree about what a drawing is (F-29).
    expect(REGISTRY_SOURCE).toContain("function isStudioPathForbidden(path: string): boolean {");
    expect(REGISTRY_SOURCE).toContain("if (isStudioPathForbidden(path)) {");
  });
});

// ── and now it points somewhere ────────────────────────────────────────────

describe("the refusal names the way out, not just the rule", () => {
  const messageFor = async (staged: string[]) => {
    try {
      await commitWith(staged);
      return "";
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  it("names the offending path, so the next call is a copy rather than a guess", async () => {
    expect(await messageFor([THE_POISONED_PATH, ...THE_TRAPPED_WORK])).toContain(THE_POISONED_PATH);
  });

  it("names studio.unstage, which is the tool that clears it", async () => {
    expect(await messageFor([THE_POISONED_PATH])).toContain("studio.unstage");
  });

  it("says the run does not have to end here", async () => {
    const m = await messageFor([THE_POISONED_PATH]);
    expect(m).toMatch(/does not have to end the run/i);
    expect(m).toMatch(/commit the rest/i);
  });

  it("keeps F-56's honest alternative and forbids the obvious workaround", async () => {
    const m = await messageFor([THE_POISONED_PATH]);
    expect(m).toMatch(/cannot be built with what is present/i);
    // Re-staging the original contents would satisfy the letter and put the
    // manifest back in the commit, which is the F-63 hole reopened sideways.
    expect(m).toMatch(/do not re-stage/i);
  });

  it("reads for one path and for several without a grammar seam", async () => {
    expect(await messageFor([THE_POISONED_PATH])).toContain("is staged on this changeset");
    expect(await messageFor([THE_POISONED_PATH, "bun.lock"])).toContain(
      "are staged on this changeset",
    );
  });
});

// ── the tool itself ────────────────────────────────────────────────────────

describe("studio.unstage is registered as a tool an unattended loop can actually reach", () => {
  it("exists, and writes", () => {
    expect(TOOL_REGISTRY["studio.unstage"]).toBeTruthy();
    expect(TOOL_REGISTRY["studio.unstage"]!.category).toBe("write");
  });

  it("carries a platform default at auto", () => {
    // A gate here would put the approval queue in front of the escape hatch
    // from a dead end that needed no approval to enter.
    expect(TOOL_DEFAULTS["studio.unstage"]?.mode).toBe("auto");
    expect(TOOL_DEFAULTS["studio.unstage"]?.enabled).toBe(true);
  });

  it("is catalogued, or the runtime demotes it to confirm and the loop still strands", () => {
    // The failure this prevents is invisible from the default above: toolRisk
    // answers "high" for a tool it has never heard of, and resolveToolMode
    // demotes every high-risk auto tool to confirm. An uncatalogued escape
    // hatch queues an approval on the way out.
    expect(toolRisk("studio.unstage")).not.toBe("high");
    expect(toolConsequence("studio.unstage").effect).not.toBe(
      "Runs the tool with the agent's arguments.",
    );
  });

  it("tells the agent when to reach for it, in the words the refusal uses", () => {
    const d = TOOL_REGISTRY["studio.unstage"]!.description;
    expect(d).toMatch(/way out/i);
    expect(d).toMatch(/studio\.commit refuses/i);
    // And what it is NOT, said in the description because that is the half the
    // model reads.
    expect(d).toMatch(/does not revert a commit already pushed/i);
  });

  it("normalizes the two shapes a model gets wrong on a single path", () => {
    // studio.stage's precedent: both self-correct on retry and both cost a step.
    const s = TOOL_REGISTRY["studio.unstage"]!.argsSchema;
    expect(s.parse({ paths: ["package.json"] })).toEqual({ paths: ["package.json"] });
    expect(s.parse({ paths: "package.json" })).toEqual({ paths: ["package.json"] });
    expect(s.parse({ path: "package.json" })).toEqual({ paths: ["package.json"] });
    expect(s.parse("package.json")).toEqual({ paths: ["package.json"] });
    expect(s.safeParse({ paths: [] }).success).toBe(false);
  });
});

describe("studio.unstage removes the staged intent, and says so honestly", () => {
  it("clears the poisoned path and leaves the trapped work staged", async () => {
    const { db, run } = unstage(
      { paths: [THE_POISONED_PATH] },
      { staged: [THE_POISONED_PATH, ...THE_TRAPPED_WORK] },
    );
    const out = (await run()) as Record<string, unknown>;
    expect(out.unstaged).toEqual([THE_POISONED_PATH]);
    expect(out.remaining_staged_paths).toEqual(THE_TRAPPED_WORK);
    expect(db.deleted).toEqual([[THE_POISONED_PATH]]);
    expect(db.stagedNow()).toEqual(THE_TRAPPED_WORK);
  });

  it("unblocks the commit that was permanently refused", async () => {
    /*
     * The end-to-end claim of this whole finding, asserted rather than assumed:
     * the same changeset, minus the one path, no longer trips the floor.
     *
     * Asserted POSITIVELY as well as negatively. `rejects.not.toThrow(/Refused/)`
     * alone would pass if the commit fell over one line earlier for a reason
     * that has nothing to do with the floor, which is how a fix ships
     * shape-correct and inert. It gets as far as resolving a credential — past
     * the floor, past the secret scan — and this fake reaches no GitHub.
     */
    let m = "";
    try {
      await commitWith(THE_TRAPPED_WORK);
      m = "(resolved)";
    } catch (e) {
      m = e instanceof Error ? e.message : String(e);
    }
    expect(m).not.toMatch(/Refused/i);
    expect(m).toMatch(/GitHub is not connected/i);
  });

  it("never claims to have undone a commit that is already on the branch", async () => {
    // A changeset with a branch has pushed at least once, and git carries the
    // parent tree forward: the path is still in that commit. An agent told
    // otherwise reports otherwise.
    const { run } = unstage({ paths: [THE_POISONED_PATH] }, { staged: [THE_POISONED_PATH] });
    const out = (await run()) as Record<string, unknown>;
    expect(String(out.note)).toMatch(/does NOT undo what is already committed/);
    expect(String(out.note)).toContain("studio/m1-f9354439");
  });

  it("says plainly when nothing reached the repo at all", async () => {
    const { run } = unstage(
      { paths: [THE_POISONED_PATH] },
      { staged: [THE_POISONED_PATH], branch: null },
    );
    const out = (await run()) as Record<string, unknown>;
    expect(String(out.note)).toMatch(/never been committed/i);
  });

  it("warns when it has emptied the changeset rather than leaving that to be discovered", async () => {
    const { run } = unstage({ paths: [THE_POISONED_PATH] }, { staged: [THE_POISONED_PATH] });
    const out = (await run()) as Record<string, unknown>;
    expect(String(out.note)).toMatch(/no staged changes/i);
  });

  it("reports a path the caller named and it did not find", async () => {
    const { run } = unstage(
      { paths: [THE_POISONED_PATH, "src/nowhere.ts"] },
      { staged: [THE_POISONED_PATH] },
    );
    const out = (await run()) as Record<string, unknown>;
    expect(out.unstaged).toEqual([THE_POISONED_PATH]);
    expect(out.not_staged).toEqual(["src/nowhere.ts"]);
  });
});

describe("studio.unstage refuses rather than answering an empty success", () => {
  it("throws when nothing it was asked for is staged", async () => {
    // ok:true carrying unstaged:[] is an invitation to write "I removed
    // package.json" — the F-68 shape, a seat asserting over a tool answer that
    // says otherwise.
    const { run } = unstage({ paths: ["src/nowhere.ts"] }, { staged: THE_TRAPPED_WORK });
    await expect(run()).rejects.toThrow(/none of src\/nowhere\.ts is staged/i);
  });

  it("lists what IS staged, so the next call is a copy rather than another guess", async () => {
    const { run } = unstage({ paths: ["src/nowhere.ts"] }, { staged: THE_TRAPPED_WORK });
    let m = "";
    try {
      await run();
    } catch (e) {
      m = e instanceof Error ? e.message : String(e);
    }
    for (const p of THE_TRAPPED_WORK) expect(m).toContain(p);
  });

  it("deletes nothing on that path", async () => {
    const { db, run } = unstage({ paths: ["src/nowhere.ts"] }, { staged: THE_TRAPPED_WORK });
    await expect(run()).rejects.toThrow();
    expect(db.deleted).toEqual([]);
  });

  it("refuses on a merged changeset and names studio.revert instead", async () => {
    // Pulling a row out of a merged changeset edits the record of what shipped
    // without changing what shipped. The alternative is named, not alluded to.
    const { run } = unstage(
      { paths: [THE_POISONED_PATH] },
      { staged: [THE_POISONED_PATH], status: "merged" },
    );
    await expect(run()).rejects.toThrow(/studio\.revert/);
  });
});
