import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expiryDefaultFor } from "@/lib/ai/approval-expiry";
import { UNCATALOGUED_EFFECT, gateHeadline, toolConsequence } from "@/lib/tool-consequences";

/**
 * A SEED MAY NOT STAND UP A GATE THE PRODUCT CANNOT DESCRIBE.
 *
 * THE DEFECT THIS PREVENTS, measured 2026-08-23. `agent_approvals` has two
 * writers. The loop raises a gate for a tool the registry defines, and a seed
 * migration writes one with a tool name typed by hand into SQL. Every existing
 * guard watches the first door and none watches the second:
 *
 *   - `tool-risk-six-dimensions.test.ts:71` starts from `TOOL_DEFAULTS`;
 *   - `:181` re-derives the same roster from the registry SOURCE, deliberately
 *     with a different regex so the two cannot share a blind spot;
 *   - `:241` asserts every registry tool has a consequence and a profile;
 *   - `:253` asserts no registry tool falls through to the generic sentence;
 *   - `tool-consequences.test.ts:312` asserts the same for gated tools.
 *
 * All five ask "does the catalogue cover the registry". All five pass -- 59
 * registered tools, 59 consequence rows, 59 risk profiles, no gaps in either
 * direction since 2026-08-19/20. NONE of them asks the reverse question, which
 * is whether everything that can REACH the approvals table is a tool at all.
 *
 * It is not. Five seed migrations write six tool names that no tool defines:
 *
 *     code.commit          6 tuples   (3 files, all `executed`)
 *     decisions.kill       7 tuples   (4 files, all `approved`)
 *     rollout.ramp         3 tuples   (3 files, ALL `pending`, expires_at +3d)
 *     schema.migrate       3 tuples   (3 files, ALL `pending`, expires_at +2d)
 *     changelog.publish    1 tuple    (1 file,      `pending`, expires_at +5h)
 *     experiments.create   1 tuple    (1 file,      `pending`, expires_at +3d)
 *
 * 21 tuples, 32 rows standing in production, and 8 of the 21 are written as
 * `status = 'pending'` with a live deadline. Each of those eight is a gate a
 * person is asked to answer, whose heading -- the 19px `sp-gate-q`, the biggest
 * thing on the surface -- read "Runs the tool with the agent's arguments.",
 * because `toolConsequence` has no row and falls through to the sentinel. That
 * exact rendering was the 2026-08-16 defect, found on the rendered /today.
 *
 * THIS WAS ALREADY DIAGNOSED ONCE AND HALF-FIXED. Migration
 * `20260820013000_the_futile_approvals_came_back_and_brought_a_second_kind.sql:72`
 * says it in capitals: "SO THE SEED IS THE REAL DEFECT AND CANCELLING IS ONLY
 * HALF. A re-seed puts all seven back". It cancelled the rows and named the line
 * to correct. Three days later that line is unchanged, because it CANNOT be
 * corrected: `docs/operations/hooks.md:46` blocks editing an applied migration in
 * place, and all five files are applied. So the door cannot be shut by editing
 * the seeds; it can only be watched. That is what this file is.
 *
 * WHY NOT JUST CATALOGUE THE SIX. Because a `CONSEQUENCES` row for a name no tool
 * defines is an orphan, and `tool-risk-six-dimensions.test.ts:91` fails the build
 * on exactly that ("these rows apply to no registered tool"). The six are not
 * under-documented tools; they are names of tools that do not exist.
 */

const MIGRATIONS = join(process.cwd(), "supabase/migrations");

/**
 * The six names five applied seed migrations write and no tool defines, frozen
 * 2026-08-23 with the count each contributes.
 *
 * THIS SET IS A WART AND IT IS SUPPOSED TO LOOK LIKE ONE. It exists only because
 * the migrations that write these names are already applied and so cannot be
 * edited (see the header). It is asserted in BOTH directions on purpose: nothing
 * new may join it, and a name that stops appearing in the tree must be deleted
 * from it. Without the second direction it would quietly become the place a
 * seventh phantom goes to hide.
 *
 * `deploy.promote` is deliberately NOT here. Production holds one
 * `agent_approvals` row for it (status `approved`, 2026-07-08), and no migration
 * on disk writes it into this table -- its single hit,
 * `20260725130000_helio_demo_seed_rich.sql:1023`, is inside an
 * `INSERT INTO public.human_gate_events`. Carrying it would make the second
 * assertion below fail, and would claim this guard covers a row it never saw.
 */
const LEGACY_SEEDED_NAMES = [
  "changelog.publish",
  "code.commit",
  "decisions.kill",
  "experiments.create",
  "rollout.ramp",
  "schema.migrate",
] as const;

/**
 * Strip SQL comments, tracking string literals as it goes.
 *
 * Order matters and it is the opposite of the obvious one: comments are removed
 * while string state is tracked, not before it. `-- don't` inside a comment
 * carries an apostrophe that would otherwise open a phantom string literal and
 * desynchronise every parse after it in the file.
 */
function stripSqlComments(sql: string): string {
  let out = "";
  let i = 0;
  let inStr = false;
  while (i < sql.length) {
    const ch = sql[i];
    if (inStr) {
      out += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          out += sql[i + 1];
          i += 2;
          continue;
        }
        inStr = false;
      }
      i++;
      continue;
    }
    if (ch === "'") {
      inStr = true;
      out += ch;
      i++;
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/** The contents of the parenthesised group starting at `start`, and the index after its `)`. */
function readGroup(sql: string, start: number): [string | null, number] {
  let depth = 0;
  let inStr = false;
  for (let i = start; i < sql.length; i++) {
    const ch = sql[i];
    if (inStr) {
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          i++;
          continue;
        }
        inStr = false;
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return [sql.slice(start + 1, i), i + 1];
    }
  }
  return [null, sql.length];
}

/** Split on commas at nesting depth zero, ignoring commas inside strings and calls. */
function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr = false;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      cur += ch;
      if (ch === "'") {
        if (s[i + 1] === "'") {
          cur += s[++i];
          continue;
        }
        inStr = false;
      }
      continue;
    }
    if (ch === "'") {
      inStr = true;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim());
}

interface SeededRow {
  file: string;
  /** Raw text of the value sitting in the `tool_name` column position. */
  raw: string;
  columnCount: number;
  valueCount: number;
}

interface Scan {
  rows: SeededRow[];
  statements: number;
  /** Insert sites this parser could not read. Must stay empty; see the assertion. */
  unparsed: string[];
}

/**
 * Every row any migration inserts into `agent_approvals`, read at the `tool_name`
 * COLUMN POSITION.
 *
 * THE ORDINAL IS THE WHOLE POINT, and the cheaper rule was tried and measured
 * first. "Pull every single-quoted dotted literal out of the VALUES tuple"
 * returns eight names, two of which are not tools at all:
 * `feature_flag.fraud_precision` and `feature_flag.guided_first_question`, both
 * jsonb_build_object arguments sitting inside `code.commit` tuples
 * (20260705120000:565 and :908, duplicated in the two 20260705 sibling files).
 * A guard built on that rule fails on day one against strings that were never
 * claiming to be tool names. So the column list is parsed, `tool_name` is located
 * in it, and only that slot is read. The last assertion in the first block pins
 * this: it proves a feature flag does NOT come back, so a future simplification
 * of this scanner fails loudly instead of quietly widening.
 *
 * WHAT THIS CANNOT SEE, stated rather than implied: a tuple whose `tool_name` is
 * an expression instead of a literal, and an `INSERT ... SELECT`. Neither is
 * silently tolerated -- the first shows up as a non-literal and the second as an
 * unparsed site, and both are asserted empty below, so adding one fails the build
 * and forces this scanner to be extended rather than bypassed.
 */
function scanSeededApprovals(): Scan {
  const rows: SeededRow[] = [];
  const unparsed: string[] = [];
  let statements = 0;
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = stripSqlComments(readFileSync(join(MIGRATIONS, file), "utf8"));
    for (const m of sql.matchAll(/INSERT\s+INTO\s+(?:public\.)?agent_approvals\b/gi)) {
      let i = (m.index ?? 0) + m[0].length;
      while (i < sql.length && /\s/.test(sql[i])) i++;
      if (sql[i] !== "(") {
        unparsed.push(`${file}: insert with no column list`);
        continue;
      }
      const [columnsRaw, afterColumns] = readGroup(sql, i);
      if (columnsRaw === null) {
        unparsed.push(`${file}: unterminated column list`);
        continue;
      }
      const columns = splitTopLevel(columnsRaw).map((c) => c.replace(/"/g, "").toLowerCase());
      const ordinal = columns.indexOf("tool_name");
      if (ordinal < 0) {
        unparsed.push(`${file}: insert names no tool_name column`);
        continue;
      }
      const valuesKeyword = /^\s*VALUES\s*/i.exec(sql.slice(afterColumns));
      if (!valuesKeyword) {
        unparsed.push(`${file}: insert is not a VALUES insert`);
        continue;
      }
      statements++;
      let j = afterColumns + valuesKeyword[0].length;
      for (;;) {
        while (j < sql.length && /\s/.test(sql[j])) j++;
        if (sql[j] !== "(") break;
        const [tupleRaw, afterTuple] = readGroup(sql, j);
        if (tupleRaw === null) {
          unparsed.push(`${file}: unterminated VALUES tuple`);
          break;
        }
        const values = splitTopLevel(tupleRaw);
        rows.push({
          file,
          raw: values[ordinal] ?? "",
          columnCount: columns.length,
          valueCount: values.length,
        });
        j = afterTuple;
        while (j < sql.length && /\s/.test(sql[j])) j++;
        if (sql[j] === ",") {
          j++;
          continue;
        }
        break;
      }
    }
  }
  return { rows, statements, unparsed };
}

/** `'a.b'` -> `a.b`; anything that is not a plain single-quoted literal -> null. */
function asLiteral(raw: string): string | null {
  const m = /^'((?:[^']|'')*)'$/.exec(raw.trim());
  return m ? m[1].replace(/''/g, "'") : null;
}

/**
 * The registry roster, re-derived from source.
 *
 * The regex is lifted verbatim from `tool-risk-six-dimensions.test.ts:197`,
 * including its reason: the `name:`/`category:` pair is bounded by a lookahead
 * and NOT by a character window, because a 900-character window silently dropped
 * `decision.record`, whose description runs 1186 characters, and every coverage
 * assertion downstream passed on the reduced set. Reading source rather than
 * importing is not laziness either -- `registry.server.ts` is worker-only and
 * pulls in Supabase, the AI runtime and every connector adapter.
 */
function registeredToolsFromSource(): string[] {
  const dir = join(process.cwd(), "src/lib/ai/tools");
  const src = ["registry.server.ts", "orchestrator.server.ts"]
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
  return [
    ...src.matchAll(
      /name:\s*"([^"]+)",(?:(?!\bname:\s*")[\s\S])*?category:\s*"(?:read|write|memory|planning)"/g,
    ),
  ].map((m) => m[1]);
}

describe("the seed cannot raise a gate the product cannot answer", () => {
  const scan = scanSeededApprovals();
  const registered = registeredToolsFromSource();
  const literals = scan.rows.map((r) => ({ file: r.file, name: asLiteral(r.raw), raw: r.raw }));
  const seededNames = [...new Set(literals.map((l) => l.name).filter((n): n is string => !!n))];

  it("read every insert in the tree, so the assertions below are not measuring a fragment", () => {
    /*
     * Floors first. Every set comparison in this file passes vacuously against a
     * scan that found nothing, which is the failure mode a guard over parsed text
     * actually has -- it does not throw, it goes quiet. These numbers are the
     * measurement of 2026-08-23 (20 statements, 42 rows, 20 distinct names) held
     * well below their real values so ordinary seed churn does not trip them.
     */
    expect(scan.unparsed, "extend the scanner rather than letting a site go unread").toEqual([]);
    expect(scan.statements).toBeGreaterThan(10);
    expect(scan.rows.length).toBeGreaterThan(30);
    expect(seededNames.length).toBeGreaterThan(10);
  });

  it("read the tool_name column itself, not a literal that happened to sit nearby", () => {
    /*
     * Three separate proofs that the ordinal is aligned, because the ordinal is
     * the only thing standing between this guard and the eight-name false
     * positive described on `scanSeededApprovals`.
     */
    const misaligned = scan.rows.filter((r) => r.columnCount !== r.valueCount);
    expect(misaligned, "column list and VALUES tuple disagree; the ordinal is unsafe").toEqual([]);

    const notLiterals = literals.filter((l) => l.name === null);
    expect(notLiterals, "a computed tool_name is invisible to this guard").toEqual([]);

    // The regression pin. `feature_flag.fraud_precision` is a jsonb argument
    // inside a `code.commit` tuple; a scanner that reads the tuple instead of the
    // column returns it as a tool name.
    expect(seededNames).toContain("code.commit");
    expect(seededNames).not.toContain("feature_flag.fraud_precision");
    expect(seededNames).not.toContain("feature_flag.guided_first_question");
  });

  it("has a real registry to check against", () => {
    expect(registered.length).toBeGreaterThan(50);
    expect([...new Set(registered)].length).toBe(registered.length);
  });

  it("seeds no tool name that is neither registered nor a known legacy name", () => {
    /*
     * THE ASSERTION THIS FILE EXISTS FOR. A new seed row for a name no tool
     * defines is a gate whose heading cannot say what approving it would change,
     * and whose expiry lane is `cancel` for the same reason. Failing here names
     * the offender, because that is the whole work of fixing it: either register
     * the tool, or write the seed against a tool that exists.
     */
    const unanswerable = seededNames.filter(
      (n) => !registered.includes(n) && !LEGACY_SEEDED_NAMES.includes(n as never),
    );
    expect(unanswerable, "no tool defines these, so no gate for them can be answered").toEqual([]);
  });

  it("keeps no legacy name that the migration tree no longer writes", () => {
    /*
     * The other direction, so the frozen set shrinks as seeds are cleaned and
     * never becomes a lean-to for a seventh name. Guarded the way `EXTERNAL_TOOLS`
     * and `READ_ONLY_TOOLS` are guarded in `tool-consequences.ts`: both ways, or
     * the hand-kept copy drifts.
     */
    const stale = LEGACY_SEEDED_NAMES.filter((n) => !seededNames.includes(n));
    expect(stale, "delete these from LEGACY_SEEDED_NAMES; nothing writes them any more").toEqual(
      [],
    );
  });
});

describe("what a phantom gate says and does while it stands", () => {
  /*
   * The guard above stops a SEVENTH name. It cannot delete the six, because their
   * migrations are applied. So these are the two properties that bound the damage
   * of the six that remain, asserted on behaviour rather than on set membership --
   * the same reason `tool-risk-six-dimensions.test.ts:253` re-states its coverage
   * check as a rendering check.
   */
  it("does not put the generic sentence in front of a person", () => {
    for (const name of LEGACY_SEEDED_NAMES) {
      expect(gateHeadline(name), `${name} still falls through to the sentinel`).not.toBe(
        UNCATALOGUED_EFFECT,
      );
    }
    // And the sentinel is still reachable through the raw catalogue lookup, so
    // this is a change of what the SURFACE says, not a quiet edit of the default
    // that two other guards pin by literal.
    expect(toolConsequence("rollout.ramp").effect).toBe(UNCATALOGUED_EFFECT);
  });

  it("does not leak the tool id into the sentence a person is asked to judge", () => {
    /*
     * `runs.$missionId.tsx:576` states the rule where the gate is rendered --
     * "Plain words, never the tool name" -- and `tool-consequences.test.ts:333`
     * states it as a property of the fallback, "rather than crash or leak its id".
     * The heading is the 19px slot, so the rule binds hardest exactly here.
     */
    for (const name of LEGACY_SEEDED_NAMES) {
      expect(gateHeadline(name)).not.toContain(name);
    }
    expect(gateHeadline("nope.not.a.tool")).not.toContain("nope");
    expect(gateHeadline(null).length).toBeGreaterThan(0);
  });

  it("leaves every registered tool's heading exactly as the catalogue writes it", () => {
    /*
     * The change may not move anything for the 59 tools that DO have a row. This
     * is the whole registry, not a sample, so a future `gateHeadline` that starts
     * paraphrasing catalogued tools fails here and not in a screenshot.
     */
    const drifted = registeredToolsFromSource().filter(
      (t) => gateHeadline(t) !== toolConsequence(t).effect,
    );
    expect(drifted, "these no longer render their catalogued sentence").toEqual([]);
  });

  it("expires a phantom gate by cancelling it, not by running it", () => {
    /*
     * What bounds the damage to one TTL instead of for ever. `expiryDefaultFor`
     * returns `cancel` for anything the catalogue does not hold, and
     * `approvals-tick` acts on that, so an unanswerable gate stands down by
     * itself. Pinned here because the six names are precisely the input that
     * exercises that branch, and nothing else in the suite feeds it one.
     */
    for (const name of LEGACY_SEEDED_NAMES) {
      expect(expiryDefaultFor(name), `${name} would run itself unread`).toBe("cancel");
    }
  });
});
