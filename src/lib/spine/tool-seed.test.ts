/**
 * The build gate on tool reachability.
 *
 * WHY THIS FILE EXISTS. `loop.server.ts` builds an agent's tool list from the
 * `agent_tools` rows a user has. A tool registered in `TOOL_REGISTRY` but never
 * seeded is not disabled, it is INVISIBLE: it never enters the prompt, the agent
 * cannot know it exists, and the station that needed it answers in prose that
 * nothing downstream can read. There is no error, no log line and no failing
 * test. The station simply produces nothing, forever.
 *
 * That went unnoticed for two months. On 2026-08-01 eleven of sixteen live
 * accounts could not call `prd.draft`, and three registered tools were reachable
 * by nobody at all, because seeding had accumulated as six one-shot migrations
 * and only three of them left a trigger behind.
 *
 * So this asserts the one invariant that keeps it from returning: the set of
 * tools the registry defines and the set the seed migration grants are the SAME
 * SET. Register a tool without seeding it and this goes red at build time, which
 * is when it is cheap, rather than in a silent station months later.
 *
 * It reads the migration as text on purpose. The seed is SQL and the registry is
 * TypeScript; nothing but a test can hold two languages to one list, and a test
 * that imported some shared constant would only prove the constant agrees with
 * itself while the SQL that actually runs drifted away underneath it.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The one migration that is allowed to grant tools. */
const SEED_SQL = join(
  process.cwd(),
  "supabase/migrations/20260801220000_agent_tools_one_authority.sql",
);

/**
 * Tool names in the seed's VALUES list.
 *
 * Anchored on the `(_user_id, '...'` shape so prose in the header comment, which
 * names several tools while explaining the defect, cannot be mistaken for a
 * grant. That header genuinely contains `prd.draft` in three places.
 */
function seededTools(): string[] {
  const sql = readFileSync(SEED_SQL, "utf8");
  return [...sql.matchAll(/\(_user_id,\s*'([a-z0-9_.]+)'/g)].map((m) => m[1]);
}

/**
 * Tool names in the registry, read as source.
 *
 * `registry.server.ts` cannot be imported here: it is worker-only and pulls in
 * the Supabase client, the AI runtime and every connector adapter. Matching
 * `name:` inside a `def({` call is enough, and it is the same string the runtime
 * keys `TOOL_REGISTRY` by.
 *
 * The WHOLE tools directory is scanned, not just registry.server.ts. The four
 * `mission.*` tools are defined in orchestrator.server.ts and merely imported
 * into the registry array, and reading one file missed all four -- caught by
 * this test's own second assertion on its first run, which is a fair advert for
 * having written the second assertion.
 */
function registeredTools(): string[] {
  const dir = join(process.cwd(), "src/lib/ai/tools");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .flatMap((f) => [
      ...readFileSync(join(dir, f), "utf8").matchAll(/\bdef\(\{\s*\n\s*name:\s*"([^"]+)"/g),
    ])
    .map((m) => m[1]);
}

describe("agent tool seeding", () => {
  it("grants every registered tool, so no station is left without hands", () => {
    const missing = registeredTools().filter((t) => !seededTools().includes(t));
    // If this fails: add the tool to seed_agent_tools_for in the migration named
    // above. Do NOT write a new one-shot backfill migration; that is the exact
    // habit that produced six seed functions and eleven users who could not
    // write a spec.
    expect(missing).toEqual([]);
  });

  it("grants nothing that is not registered, so the seed cannot rot", () => {
    const extra = seededTools().filter((t) => !registeredTools().includes(t));
    // A seeded row for a tool that no longer exists is harmless at runtime
    // (loop.server filters against TOOL_REGISTRY) but it is a lie in the
    // settings UI, which renders the stored rows.
    expect(extra).toEqual([]);
  });

  it("seeds each tool exactly once", () => {
    const seen = seededTools();
    const dupes = seen.filter((t, i) => seen.indexOf(t) !== i);
    // A duplicate would abort the whole INSERT: ON CONFLICT DO NOTHING resolves
    // conflicts against the TABLE, not against other rows in the same statement,
    // so a repeated name raises "cannot affect row a second time" and no user
    // gets any tools at all.
    expect(dupes).toEqual([]);
  });

  it("keeps every irreversible tool at review, whatever else changes", () => {
    const sql = readFileSync(SEED_SQL, "utf8");
    // These four are the ones a person cannot undo from inside the product: a
    // live release, a merge to the default branch, a revert of shipped code, and
    // handing work to an outside agent. `trust-ramp.ts` floors them too, so this
    // is defence in depth rather than the only guard -- but a seed that shipped
    // one of them at `auto` would be a boundary quietly lowered by a data
    // migration, which is the one change nobody reviews as a policy change.
    for (const tool of [
      "release.publish",
      "studio.pr.merge",
      "studio.revert",
      "delegate.openhands",
    ]) {
      const row = new RegExp(`\\(_user_id,\\s*'${tool.replace(".", "\\.")}'[^)]*`).exec(sql);
      expect(row, `${tool} is not seeded`).not.toBeNull();
      expect(row![0], `${tool} must be seeded at review`).toContain("'review'");
    }
  });
});
