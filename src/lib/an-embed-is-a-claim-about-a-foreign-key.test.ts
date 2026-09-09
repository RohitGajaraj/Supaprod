/**
 * ── EVERY POSTGREST EMBED NAMES A FOREIGN KEY, OR IT IS A 400 IN PRODUCTION ─
 *
 * `.select("id,title,workspaces(account_id)")` reads like a join and is not
 * one. PostgREST resolves an embed through a FOREIGN KEY between the two
 * tables. Where the key exists it is free -- one round trip, one payload. Where
 * it does not, the request errors, and in this codebase an errored read on a
 * primary surface goes through `failSoftOrThrow` and takes the whole reader
 * down with it.
 *
 * ── THE DEFECT THIS WAS WRITTEN FROM, AND IT WAS MINE ──────────────────────
 * 2026-09-10. I added `workspaces(account_id)` to `listRunsForStart`'s base
 * select, to resolve the wallet behind each track without a hop. `spine_tracks`
 * has three foreign keys -- to `learnings`, `opportunities` and `themes` -- and
 * **none to `workspaces`**: `workspace_id` is an unconstrained uuid. The home's
 * largest read died on every arrival and the entry sat on "Reading your
 * workspace. Still reading." until it was caught on the served build.
 *
 * **I checked that the column existed and inferred the relationship from it.**
 * Those are different facts, and the function's OTHER embed --
 * `spine_track_members(artifact_kind)`, backed by a real key -- is what made
 * mine look routine.
 *
 * ── HOW THIS GUARDS IT ────────────────────────────────────────────────────
 * It cannot reach the database, so it does the next best thing: every embed
 * written anywhere in `src/` must appear below, with the key that makes it
 * legal, verified against `pg_constraint` on production and dated. A new embed
 * fails here until somebody has actually looked the key up -- which is the one
 * step I skipped.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Verified on production 2026-09-10 by reading `pg_constraint` directly.
 * `child -> parent` for a forward embed, `parent -> child` for a reverse one;
 * either direction resolves as long as the key is between the two tables.
 */
const VERIFIED_KEYS: Readonly<Record<string, string>> = {
  // decisions.opportunity_id -> opportunities.id
  // learnings.opportunity_id -> opportunities.id
  opportunities: "REFERENCES opportunities(id)",
  // learnings.decision_id -> decisions.id
  decisions: "REFERENCES decisions(id)",
  // agent_autonomy.agent_id -> agents.id, read in reverse from `agents`
  agent_autonomy: "agent_autonomy.agent_id REFERENCES agents(id)",
  // account_credits.account_id -> accounts.id
  accounts: "REFERENCES accounts(id)",
  // spine_track_members.track_id -> spine_tracks.id, read in reverse
  spine_track_members: "spine_track_members.track_id REFERENCES spine_tracks(id)",
  // studio_changesets.mission_id -> missions.id, and several children point
  // back at it (studio_changes, deployments, changelog_entries)
  studio_changesets: "studio_changesets.mission_id REFERENCES missions(id)",
};

/**
 * NAMED, SO THE ONE THAT BROKE STAYS BROKEN. `spine_tracks` has no key to
 * `workspaces`, so this embed can never be written from it however obvious the
 * column makes it look. Listed rather than merely absent, because "absent"
 * reads as "nobody has needed it yet".
 */
const KNOWN_ABSENT: ReadonlyArray<string> = ["workspaces"];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const SRC = join(import.meta.dir, "..");

/** Every `table(cols)` written inside a `.select("...")` string in `src/`. */
function embeds(): Array<{ table: string; file: string }> {
  const found: Array<{ table: string; file: string }> = [];
  for (const file of walk(SRC)) {
    const text = readFileSync(file, "utf8");
    /*
     * THE STRING LITERALS AFTER `.select(`, NOT THE CALL. My first version
     * matched up to the call's closing paren, and an embed's OWN paren --
     * `spine_track_members(artifact_kind)` -- closes it early, truncating the
     * string before its quote and finding nothing. The mirror below caught
     * that, which is the only reason this comment exists.
     */
    for (const call of text.matchAll(/\.select\(\s*((?:"[^"]*"\s*\+?\s*)+)/g)) {
      for (const str of call[1].matchAll(/"([^"]*)"/g)) {
        /*
         * `table!hint(` and `table!inner(` are both real PostgREST. The base
         * table is what needs a key; the `!hint` half NAMES the constraint,
         * which is a stronger claim than this file's own list, so it is
         * accepted on sight.
         */
        for (const em of str[1].matchAll(/([a-z_][a-z0-9_]*)(?:!([a-z0-9_]+))?\s*\(/g)) {
          const hint = em[2];
          if (hint && hint.endsWith("_fkey")) continue;
          found.push({ table: em[1], file: file.slice(SRC.length + 1) });
        }
      }
    }
  }
  return found;
}

describe("an embed is a claim about a foreign key", () => {
  it("writes none this repo has not looked up", () => {
    const unknown = embeds().filter((e) => !(e.table in VERIFIED_KEYS));
    expect(
      unknown,
      "a PostgREST embed here names a relationship nobody has verified. Read pg_constraint for the key between the two tables, then add it to VERIFIED_KEYS with the constraint. If there is no key, the embed is a 400 and you need a second read.",
    ).toEqual([]);
  });

  it("never writes the one already proved impossible", () => {
    const banned = embeds().filter((e) => KNOWN_ABSENT.includes(e.table));
    expect(
      banned,
      "`spine_tracks` has no foreign key to `workspaces`, so this embed errors and takes the reader down with it. Resolve the account through its own read.",
    ).toEqual([]);
  });

  it("still finds the embeds that are there", () => {
    /*
     * THE MIRROR. Both assertions above pass by finding nothing, so a regex
     * that stopped matching would report a clean bill of health over a file
     * full of unverified embeds. This fails when the MEASUREMENT breaks.
     */
    const seen = new Set(embeds().map((e) => e.table));
    for (const known of ["spine_track_members", "opportunities"]) {
      expect({ known, found: seen.has(known) }).toEqual({ known, found: true });
    }
  });
});
