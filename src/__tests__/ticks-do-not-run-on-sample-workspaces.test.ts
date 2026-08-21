/**
 * NO TICK MAY SPEND A MODEL CALL ON A DEMO FIXTURE.
 *
 * Measured in production 2026-08-21, joining `ai_events` to `workspaces.is_sample`:
 *
 *   agent      1034 calls   $1.6556   100% SAMPLE workspace
 *   discovery   239 calls   $0.0507    98% SAMPLE
 *   sense       131 calls   $0.0073   100% SAMPLE
 *
 * $1.71 of the $1.92 spent that day, 89%, went to autonomous agents running
 * against demo fixtures. Real workspaces drew ZERO agent calls. All 230 agent
 * runs in the window were on a sample workspace, still firing at 08:00.
 *
 * The cause was uniform rather than clever: FOURTEEN hook files selected
 * workspaces and NOT ONE filtered `is_sample`. That is a shape, not a location,
 * which is why this guard reads every hook rather than the twelve that were
 * fixed.
 *
 * `is_sample` is `NOT NULL DEFAULT false`, so equality is exact and there is no
 * NULL to fall through.
 *
 * WHAT THIS DOES NOT ASSERT. A query that resolves a KNOWN workspace's owner
 * (`.eq("id", ...)` / `.in("id", ...)`) is a lookup, not a selection. Filtering
 * those would break the lookup without stopping any work, so they are exempt and
 * named as such.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const HOOKS = join(import.meta.dir, "..", "routes", "api", "public", "hooks");

function hookFiles(): string[] {
  return readdirSync(HOOKS).filter((f) => f.endsWith(".ts") && !f.includes(".test."));
}

/** Each `.from("workspaces")` with the ~6 lines that follow it. */
function workspaceQueries(src: string): string[] {
  const lines = src.split("\n");
  const out: string[] = [];
  lines.forEach((l, i) => {
    if (l.includes('.from("workspaces")')) out.push(lines.slice(i, i + 7).join("\n"));
  });
  return out;
}

const isLookup = (q: string) => /\.eq\("id"|\.in\("id"/.test(q);
const isSelection = (q: string) => q.includes(".select(");

describe("no tick selects sample workspaces", () => {
  it("reads the hooks directory at all, so nothing below passes vacuously", () => {
    const files = hookFiles();
    expect(files.length).toBeGreaterThan(20);
    expect(files).toContain("cluster-tick.ts");
  });

  it("finds workspace selections to check, which is the other vacuous failure", () => {
    const selections = hookFiles()
      .flatMap((f) => workspaceQueries(readFileSync(join(HOOKS, f), "utf8")))
      .filter((q) => isSelection(q) && !isLookup(q));
    expect(selections.length).toBeGreaterThanOrEqual(12);
  });

  it("every selection filters is_sample", () => {
    const offenders: string[] = [];
    for (const f of hookFiles()) {
      for (const q of workspaceQueries(readFileSync(join(HOOKS, f), "utf8"))) {
        if (!isSelection(q) || isLookup(q)) continue;
        if (!q.includes('.eq("is_sample", false)')) offenders.push(f);
      }
    }
    expect(offenders.sort()).toEqual([]);
  });
});

/**
 * THE SECOND SHAPE, AND IT COST MORE THAN THE FIRST ONE.
 *
 * Everything above reads `.from("workspaces")`, so it is structurally blind to a
 * tick that picks its work from a WORKSPACE-SCOPED table -- one carrying
 * `workspace_id` and no `is_sample` at all. Both leaks that survived the
 * fourteen-hook fix had exactly that shape, and the guard above passed on both.
 *
 * Measured in production 2026-08-21, in the two hours after that fix deployed:
 *
 *   agent   114 model calls   $0.2072   100% SAMPLE
 *   post-deploy agent_runs WITH a track_id:     23
 *   post-deploy agent_runs WITHOUT a track_id:   0
 *   open spine_tracks on sample workspaces:     52
 *   open spine_tracks on real workspaces:        0
 *
 * So a single unfiltered tick -- `track-tick`, selecting `spine_tracks` -- was
 * the whole of the residual spend, and it was driving 52 demo tracks in a circle
 * while no real work waited. **`researcher-tick` was never a second instance.**
 * Its `researcher` runs all carried a `track_id`: this tick was driving a track
 * through a research station, and that tick's own fix had worked. A run records
 * which AGENT ran, never which TICK started it.
 *
 * SO THIS GUARD IS KEYED ON REACHING A MODEL, NOT ON A TABLE NAME. A table list
 * would have to be kept in step with the schema forever and would have been
 * wrong on the day `spine_tracks` was added. What a hook IMPORTS is the honest
 * proxy for whether it can spend: anything under `@/lib/ai/` or `@/lib/spine/`
 * ends at a model call.
 *
 * An exemption is allowed, and it must say WHY here. That is the point of the
 * map: a new spend tick cannot be written without either resolving the exclusion
 * or arguing in this file that it does not select work.
 */
/**
 * NOT a `/g` regex, and that is load-bearing. The first draft of this guard used
 * one with `.test()`, which is STATEFUL: a global regex carries `lastIndex`
 * between calls, so testing many files against one shared instance skips matches
 * on alternate calls and the result depends on iteration order. It reported four
 * false offenders on its first run, which is exactly the class of defect this
 * file exists to catch, committed inside the catcher.
 */
const SPEND_IMPORT = /from "@\/lib\/(ai|spine)\/[^"]+"/;

/** True when this hook imports anything that ends at a model call. */
const canSpend = (src: string) => SPEND_IMPORT.test(src);

/** Reads the exclusion either way: on `workspaces` directly, or by id. */
const resolvesExclusion = (src: string) =>
  src.includes('.eq("is_sample", false)') || src.includes("sampleWorkspaceIds");

/**
 * Named exemptions with the reason each is safe TODAY. None of these is a
 * verdict that the tick is fine forever -- each is a claim that it does not
 * SELECT work, or that it cannot carry the exclusion, and both are checkable.
 */
const EXEMPT: Record<string, string> = {
  // Polls work that has already been dispatched, keyed by changeset and run id.
  // Nothing sample-scoped reaches it once the dispatchers are filtered, and
  // filtering here would strand a run that was already started and paid for.
  "ci-poll-tick.ts": "polls already-dispatched work by id, selects no new work",
  "fanout-reconcile-tick.ts": "reconciles batches already dispatched, selects no new work",
  // `eval_suites` carries NO `workspace_id` column (confirmed against the live
  // schema 2026-08-21), so the exclusion cannot travel by id from here without a
  // join. It needs the join or a column, and that is a change with a migration
  // in it rather than a filter.
  "eval-suite-tick.ts": "eval_suites has no workspace_id; needs a join or a column, not a filter",
  // `ai_events.workspace_id` IS NULLABLE and 417 of today's calls had none
  // (`judge`, `embed`). A `not in` exclusion drops NULLs, so filtering here
  // would silently remove every unattributed event from the drift input -- a
  // behaviour change nobody has measured. Unattributed AI spend is its own gap.
  "drift-tick.ts": "ai_events.workspace_id is nullable; a not-in filter would drop unattributed events",
  // Selects `prds`, which IS workspace-scoped, so this one is a real instance of
  // the shape and simply has not been filtered yet. It is low volume (7 `prd`
  // calls in the measured day) and it is the moat path, so it is being changed
  // deliberately rather than swept in beside an unrelated fix.
  "outcome-tick.ts": "same shape, unfiltered, filed as open work rather than changed unmeasured",
  // Resumes runs that were already dispatched, by mission and run id. Filtering
  // here would abandon work that has already been paid for.
  "resume-runs.ts": "resumes already-dispatched runs by id, selects no new work",
  // A REAL instance, and the only mention of `is_sample` in that file is a
  // comment about seeded rows rather than a filter. It judges `ai_events`, and
  // today every `agent` event was on a sample workspace, so it was judging
  // fixtures. Left unfiltered ON PURPOSE and sized rather than assumed: the
  // `judge` surface cost **$0.0228 across 417 calls** in the measured day,
  // against **$1.11** for the leak that was fixed. It also hits the nullable
  // `workspace_id` problem drift-tick has. Worth a decision, not worth bundling
  // into a fix for something fifty times larger.
  "eval-tick.ts": "judges ai_events including sample ones; measured at $0.02/day, filed not bundled",
};

describe("no tick that can reach a model runs on a sample workspace", () => {
  const spendHooks = () =>
    hookFiles().filter((f) => canSpend(readFileSync(join(HOOKS, f), "utf8")));

  it("finds the spend hooks at all, so nothing below passes vacuously", () => {
    const hooks = spendHooks();
    expect(hooks.length).toBeGreaterThanOrEqual(10);
    // The tick that was the entire residual leak. If this stops importing a
    // spend module the assertion below would go quiet on it.
    expect(hooks).toContain("track-tick.ts");
  });

  it("every exemption names a hook that exists and still reaches a model", () => {
    // A stale exemption is worse than none: it silently excuses a tick that may
    // have been rewritten since. This fails the build rather than rotting.
    const hooks = spendHooks();
    for (const f of Object.keys(EXEMPT)) {
      expect(hooks).toContain(f);
      expect(EXEMPT[f]!.length).toBeGreaterThan(20);
    }
  });

  it("every non-exempt spend hook resolves the sample exclusion", () => {
    const offenders = spendHooks().filter(
      (f) => !EXEMPT[f] && !resolvesExclusion(readFileSync(join(HOOKS, f), "utf8")),
    );
    expect(offenders.sort()).toEqual([]);
  });
});
