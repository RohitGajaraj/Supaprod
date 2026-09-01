/**
 * A COLUMN A MIGRATION ADDED THAT THE GENERATED TYPES DO NOT CARRY.
 *
 * ── WHAT HAPPENED, 2026-09-01 ───────────────────────────────────────────
 * `src/integrations/supabase/types.ts` is GENERATED from the database, and it
 * went stale. Production `public.decisions` carried 20 `forecast_*` columns
 * while the generated file knew 11. The nine it did not know were the forecast
 * BAND, shipped 2026-08-31, which is the machine-checkable half of the thing
 * this product says it sells.
 *
 * The consequence was worse than a missing type. `tsc` validates Supabase
 * column names against that file, so it was REJECTING COLUMNS THAT GENUINELY
 * EXIST. An agent building a forecast tool read the type error, concluded the
 * column was not real, and shipped a forecast surface with every number
 * stripped out of it. The type check was confidently wrong in the one
 * direction nobody re-checks, because a green typecheck is normally where the
 * question ends rather than where it starts.
 *
 * Nothing in the repo could see that. `bunx tsc --noEmit` was clean, `bun test`
 * was green, and the file that was lying is the file both of them believe.
 *
 * ── WHAT THIS GUARD DOES ────────────────────────────────────────────────
 * `supabase/migrations/*.sql` is in the repo and is the only in-repo record of
 * what the schema was asked to become. This reads all 591 of them, collects
 * every `ALTER TABLE ... ADD COLUMN` (and the `DROP COLUMN`s that later undo
 * one), collects every `CREATE TABLE`, and asserts that the generated types
 * carry each surviving (table, column) pair and each created table.
 *
 * It reads two files off disk and nothing else. NO NETWORK, no database, no
 * credentials: it has to run in CI, where there is neither.
 *
 * ── WHAT IT CANNOT SEE, AND THIS MATTERS MORE THAN WHAT IT CAN ──────────
 * A guard that overstates its reach is worse than one that names its edge,
 * because the overstated one gets trusted in the gap.
 *
 *   1. A COLUMN ADDED OUTSIDE A MIGRATION IS INVISIBLE HERE. Lovable's own
 *      console writes DDL directly, and a connector's setup step creates its
 *      own tables. That is exactly how the Firecrawl tables arrived on
 *      2026-09-01: no migration file, so nothing below has anything to read.
 *      This guard covers the migration path only.
 *   2. IT DOES NOT READ A `CREATE TABLE` BODY. Only the table NAME is taken
 *      from a create. Parsing column definitions out of a create body means
 *      parsing types, constraints and nested parens, and a parser that is
 *      wrong there produces false failures, which is how a guard gets
 *      switched off. `ALTER TABLE ... ADD COLUMN` is one line and unambiguous.
 *   3. IT CANNOT RESOLVE A DYNAMIC TABLE NAME. Four `ADD COLUMN`s in this
 *      corpus are inside `execute format('alter table public.%I ...', t)`
 *      loops over an array of table names (the 2026-05-30 tenancy migrations
 *      that added `workspace_id` and `product_id` across the board). The
 *      target is a placeholder, so those four are counted and skipped rather
 *      than blamed on a table called "public".
 *   4. A MIGRATION FILE IS AN INTENT, NOT A FACT. It says what was asked for,
 *      not what the database now holds. `user_ai_rate_limits` below is that
 *      gap, in the direction nobody expects.
 *
 * ── WHAT IT FOUND WHEN IT WAS FIRST RUN, 2026-09-01 ─────────────────────
 * Zero missing columns. types.ts had already been regenerated upstream, and it
 * is genuinely current: measured against `information_schema` the same
 * afternoon, all 175 public base tables are present and every one of their
 * column sets is md5-identical to its `Row` block. `decisions` reads 43
 * columns in both, with all 20 `forecast_*` present.
 *
 * So this guard ships GREEN on the column axis, and its teeth are proved by
 * the fixtures at the bottom rather than by a backlog. That is deliberate:
 * with the real drift at zero a flat assertion is enforceable, and a recorded
 * baseline of known drift would be a machine with nothing to hold. The one
 * table-level exception is a single named constant with its measurement
 * attached, which is where the reasoning stays readable.
 *
 * The DROP COLUMN pass is not decoration. With it removed the same scan
 * reports three false failures -- `workspaces.autonomous_ship_enabled`,
 * `_at` and `_by`, added 2026-07 and dropped again later.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/* fileURLToPath, not `.pathname`: this checkout's path contains spaces, and a
 * raw URL pathname percent-encodes them into a path that does not exist. */
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase", "migrations");
const TYPES_FILE = join(REPO_ROOT, "src", "integrations", "supabase", "types.ts");

/**
 * ONE TABLE IS KNOWN ABSENT, AND IT IS A LIVE DEFECT RATHER THAN AN EXEMPTION.
 *
 * `user_ai_rate_limits` is created by
 * `20260707195000_sw6_fresh_workspace_guards.sql`, and it is in neither the
 * generated types nor the database. Measured 2026-09-01 against production:
 *
 *   - `supabase_migrations.schema_migrations` DOES hold version 20260707195000,
 *     so the applier recorded the file as run.
 *   - `pg_class` holds no relation named `user_ai_rate_limits` in any schema.
 *     Only `ingest_rate_limits` and `public_decision_rate_limits` exist.
 *
 * That combination is why this is written down rather than fixed here: the
 * table is absent from the types because it is absent from the database, so
 * regenerating types.ts would not add it. `src/lib/ai-ratelimit.server.ts`
 * still reads it from `/api/chat` and `/api/plan-gate`, catches the resulting
 * error, logs "[ai-ratelimit] DB error, allowing request" and RETURNS ALLOWED.
 * The per-user burst cap on the authenticated chat surface is therefore off,
 * silently, and has been since it shipped.
 *
 * Fixing it needs a migration and a source change, both outside this lane.
 * When it is fixed, DELETE THE ENTRY -- the assertion below fails if a table
 * listed here turns up in the types, so the ground gained is kept.
 */
const TABLES_KNOWN_ABSENT_FROM_TYPES: Record<string, string> = {
  user_ai_rate_limits:
    "created by 20260707195000_sw6_fresh_workspace_guards.sql; absent from pg_class in production " +
    "on 2026-09-01 although the migration is recorded as applied. The per-user AI burst cap that " +
    "reads it fails open. Needs a migration plus a fix in src/lib/ai-ratelimit.server.ts.",
};

/**
 * Postgres identifier as it appears after ALTER TABLE / ADD COLUMN: bare,
 * double-quoted, or a `format()` placeholder such as `%I`. The placeholder is
 * matched ON PURPOSE so a dynamic target can be RECOGNISED and skipped. Left
 * unmatched, `alter table public.%I` would parse as the table `public` and
 * every column in that loop would be attributed to a table that does not
 * exist -- a silent wrong answer rather than a visible gap.
 */
const IDENTIFIER = String.raw`(?:"[^"]*"|%[A-Za-z]|[A-Za-z_][A-Za-z0-9_$]*)`;
const QUALIFIED_NAME = `${IDENTIFIER}(?:\\s*\\.\\s*${IDENTIFIER})?`;

/**
 * Strip `--` line comments and block comments before any matching.
 *
 * These migrations are heavily commented -- the reasoning for a schema change
 * lives above it -- and those comments quote the DDL they are about. Counting
 * a commented `add column` would invent a column nobody created. The precedent
 * is `meridian-ratchet-scan.ts`, which strips for the same reason: only code
 * ships.
 *
 * A block comment becomes a space so the tokens either side of it cannot fuse.
 * The known imprecision is a `--` inside a single-quoted string literal, which
 * this treats as a comment; that can only DROP an add-column from the scan, so
 * it costs coverage and never invents a failure.
 */
function stripSqlComments(sql: string): string {
  let out = "";
  let i = 0;
  while (i < sql.length) {
    const pair = sql.slice(i, i + 2);
    if (pair === "--") {
      const newline = sql.indexOf("\n", i);
      // Stop AT the newline, not past it, so the line break survives and the
      // next statement cannot glue itself onto the commented one.
      i = newline === -1 ? sql.length : newline;
      continue;
    }
    if (pair === "/*") {
      const close = sql.indexOf("*/", i + 2);
      i = close === -1 ? sql.length : close + 2;
      out += " ";
      continue;
    }
    out += sql[i];
    i += 1;
  }
  return out;
}

function unquote(raw: string): string {
  return raw.trim().replace(/^"/, "").replace(/"$/, "");
}

/** `foo` -> public.foo, `other.foo` -> other.foo, `public.%I` -> dynamic. */
function qualify(raw: string): { schema: string; table: string; dynamic: boolean } {
  const parts = raw.split(".").map(unquote);
  const schema = parts.length > 1 ? parts[0] : "public";
  const table = parts.length > 1 ? parts[1] : parts[0];
  return { schema, table, dynamic: schema.includes("%") || table.includes("%") };
}

type MigrationSchema = {
  /** table -> columns an ALTER TABLE added, minus nothing. */
  addedColumns: Map<string, Set<string>>;
  /** table -> columns a later ALTER TABLE dropped again. */
  droppedColumns: Map<string, Set<string>>;
  /** every `public` table a CREATE TABLE names. */
  createdTables: Set<string>;
  /** how many ADD COLUMN clauses were seen at all, dynamic ones included. */
  addColumnClauses: number;
  /** how many of those sat under a `%I` target and had to be skipped. */
  dynamicClauses: number;
};

/**
 * Collect the schema the migrations ASK FOR.
 *
 * The statement walk is deliberately blunt. Every `alter table <name>` is a
 * mark; the clauses that belong to it run to the first `;` OR to the next
 * `alter table`, whichever comes first. The second bound is what makes an
 * `execute 'alter table ...'` inside a `do $$ ... $$` block safe: the quoted
 * statement carries no semicolon of its own, so without it the scan would run
 * past the closing quote and swallow the next statement's columns.
 *
 * One ALTER may carry several comma-separated `add column` clauses, so every
 * match inside the bounded body is taken rather than only the first.
 */
function collectMigrationSchema(files: Array<{ name: string; sql: string }>): MigrationSchema {
  const addedColumns = new Map<string, Set<string>>();
  const droppedColumns = new Map<string, Set<string>>();
  const createdTables = new Set<string>();
  let addColumnClauses = 0;
  let dynamicClauses = 0;

  // Fresh regexes per call: these are /g and carry lastIndex between uses,
  // which silently skips matches if one instance is shared across fixtures.
  const alterTable = new RegExp(
    `\\balter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?(${QUALIFIED_NAME})`,
    "gi",
  );
  const createTable = new RegExp(
    `\\bcreate\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(${QUALIFIED_NAME})`,
    "gi",
  );
  const addColumn = new RegExp(
    `\\badd\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?(${IDENTIFIER})`,
    "gi",
  );
  const dropColumn = new RegExp(`\\bdrop\\s+column\\s+(?:if\\s+exists\\s+)?(${IDENTIFIER})`, "gi");

  function record(into: Map<string, Set<string>>, table: string, column: string): void {
    if (!into.has(table)) into.set(table, new Set());
    into.get(table)!.add(column);
  }

  for (const file of files) {
    const sql = stripSqlComments(file.sql);

    createTable.lastIndex = 0;
    for (let hit = createTable.exec(sql); hit; hit = createTable.exec(sql)) {
      const target = qualify(hit[1]);
      if (!target.dynamic && target.schema === "public") createdTables.add(target.table);
    }

    const marks: Array<{ bodyStart: number; target: ReturnType<typeof qualify> }> = [];
    alterTable.lastIndex = 0;
    for (let hit = alterTable.exec(sql); hit; hit = alterTable.exec(sql)) {
      marks.push({ bodyStart: hit.index + hit[0].length, target: qualify(hit[1]) });
    }

    for (let k = 0; k < marks.length; k += 1) {
      const { bodyStart, target } = marks[k];
      const nextAlter = k + 1 < marks.length ? marks[k + 1].bodyStart : sql.length;
      const semicolon = sql.indexOf(";", bodyStart);
      const bodyEnd = Math.min(semicolon === -1 ? sql.length : semicolon, nextAlter);
      const body = sql.slice(bodyStart, bodyEnd);

      addColumn.lastIndex = 0;
      for (let hit = addColumn.exec(body); hit; hit = addColumn.exec(body)) {
        addColumnClauses += 1;
        if (target.dynamic) {
          dynamicClauses += 1;
          continue;
        }
        // Another schema's table is not in `Database["public"]["Tables"]` and
        // is not this guard's business.
        if (target.schema !== "public") continue;
        record(addedColumns, target.table, unquote(hit[1]));
      }

      dropColumn.lastIndex = 0;
      for (let hit = dropColumn.exec(body); hit; hit = dropColumn.exec(body)) {
        if (target.dynamic || target.schema !== "public") continue;
        record(droppedColumns, target.table, unquote(hit[1]));
      }
    }
  }

  return { addedColumns, droppedColumns, createdTables, addColumnClauses, dynamicClauses };
}

/**
 * Read `Database["public"]["Tables"][*]["Row"]` out of the generated file.
 *
 * Tracked by brace depth rather than by indent width, so a change in the
 * generator's formatting cannot quietly empty this and leave the guard passing
 * on nothing. The path stack is what keeps it honest about WHICH `Row` it is
 * in: `Views` blocks carry a `Row` too, and a view that happens to expose a
 * column would otherwise vouch for a table that does not have it.
 */
function parseGeneratedRows(source: string): Map<string, Set<string>> {
  const rows = new Map<string, Set<string>>();
  const path: string[] = [];
  let depth = 0;

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();

    if (path[depth - 1] === "Row") {
      const column = /^([A-Za-z_][A-Za-z0-9_]*)\??:/.exec(line);
      const table = path[depth - 2];
      if (column && table && rows.has(table)) rows.get(table)!.add(column[1]);
    }

    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    const keyedBlock = /^([A-Za-z_][A-Za-z0-9_]*):\s*\{$/.exec(line);

    if (keyedBlock) {
      path[depth] = keyedBlock[1];
      // Only a Row directly under public.Tables.<table> counts.
      if (keyedBlock[1] === "Row" && path[depth - 2] === "Tables" && path[depth - 3] === "public") {
        rows.set(path[depth - 1], new Set());
      }
    } else if (opens > closes) {
      // An anonymous block (a Relationships entry, a union member). Named so
      // the depth arithmetic stays aligned and nothing inside it is mistaken
      // for a column.
      path[depth] = "?";
    }

    depth += opens - closes;
    path.length = Math.max(0, depth);
  }

  return rows;
}

type Drift = { missingColumns: string[]; absentTables: string[] };

function driftReport(schema: MigrationSchema, rows: Map<string, Set<string>>): Drift {
  const missingColumns: string[] = [];

  for (const [table, columns] of [...schema.addedColumns].sort()) {
    const row = rows.get(table);
    // A table with no Row block is reported once as an absent TABLE below, not
    // once per column: one cause, one line.
    if (!row) continue;
    for (const column of [...columns].sort()) {
      if (schema.droppedColumns.get(table)?.has(column)) continue;
      if (!row.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }

  const touched = new Set([...schema.createdTables, ...schema.addedColumns.keys()]);
  const absentTables = [...touched].filter((table) => !rows.has(table)).sort();

  return { missingColumns, absentTables };
}

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8") }));

const migrations = collectMigrationSchema(migrationFiles);
const generatedRows = parseGeneratedRows(readFileSync(TYPES_FILE, "utf8"));
const drift = driftReport(migrations, generatedRows);

describe("the generated types must know every column a migration added", () => {
  it("actually read the migrations and the Row blocks", () => {
    /*
     * The failure mode this guard is most exposed to is its own parser going
     * quiet. Both sides are regex-driven over files another tool generates,
     * and an empty scan compared against an empty scan agrees perfectly and
     * forever. These floors are far below what was measured on 2026-09-01 --
     * 591 migration files, 593 add-column clauses, 175 Row blocks -- so they
     * only fire when a parse has collapsed rather than when the repo moved.
     */
    expect(migrationFiles.length).toBeGreaterThanOrEqual(400);
    expect(migrations.addColumnClauses).toBeGreaterThanOrEqual(400);
    expect(migrations.createdTables.size).toBeGreaterThanOrEqual(100);
    expect(generatedRows.size).toBeGreaterThanOrEqual(150);
  });

  it("carries every column a migration added and nothing later dropped", () => {
    expect(
      drift.missingColumns,
      drift.missingColumns.length === 0
        ? ""
        : [
            "",
            "types.ts DOES NOT KNOW A COLUMN A MIGRATION ADDED.",
            "",
            "  " + drift.missingColumns.join("\n  "),
            "",
            "src/integrations/supabase/types.ts is GENERATED. Do not hand-edit it",
            "and do not delete the column from the code that uses it: tsc",
            "validates Supabase column names against this file, so a stale entry",
            "makes the typecheck reject a column that genuinely exists, and the",
            "error reads exactly like the column being wrong. On 2026-09-01 an",
            "agent believed that error and shipped a forecast surface with every",
            "number removed.",
            "",
            "Regenerate the file from the database -- it is a tooling-owned act,",
            "not an edit -- and confirm against the database itself which of",
            "these columns is really there before changing any calling code.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("carries every table a migration created", () => {
    const unexpected = drift.absentTables.filter(
      (table) => !(table in TABLES_KNOWN_ABSENT_FROM_TYPES),
    );

    expect(
      unexpected,
      unexpected.length === 0
        ? ""
        : [
            "",
            "A MIGRATION BUILT A TABLE THE GENERATED TYPES HAVE NEVER HEARD OF.",
            "",
            "  " + unexpected.join("\n  "),
            "",
            "Two causes, and they need opposite fixes, so check which one it is",
            "by asking the database rather than by reading either file:",
            "",
            "  the table EXISTS  -> types.ts is stale. Regenerate it.",
            "  the table is GONE -> the migration did not take, or something",
            "      dropped it afterwards. Anything reading that table is failing",
            "      in production right now, and regenerating types will not fix",
            "      it. See user_ai_rate_limits in this file for that shape.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("drops a known-absent table from the list once it comes back", () => {
    /*
     * The ratchet half, borrowed from meridian-ratchet.test.ts: a recorded
     * exception that is no longer true has to be deleted, or the list slowly
     * becomes a place where real drift can hide behind an old explanation.
     */
    const resolved = Object.keys(TABLES_KNOWN_ABSENT_FROM_TYPES).filter((table) =>
      generatedRows.has(table),
    );

    expect(
      resolved,
      resolved.length === 0
        ? ""
        : [
            "",
            "GOOD NEWS, AND THIS FILE IS NOW STALE.",
            "",
            "  " + resolved.join("\n  "),
            "",
            "These are recorded in TABLES_KNOWN_ABSENT_FROM_TYPES as missing and",
            "the types now carry them. Delete the entry in the same commit that",
            "earned it, so the guard goes back to a flat assertion.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("names the dynamic ALTER TABLE targets it had to skip", () => {
    /*
     * Printed rather than asserted to a number, because the count is a fact
     * about the corpus and not a contract. What IS asserted is that the
     * skipping happens at all: a `%I` target must never be attributed to a
     * table named "public", which is what the naive parse did before the
     * placeholder was added to IDENTIFIER.
     */
    expect(migrations.addedColumns.has("public")).toBe(false);
    expect(migrations.dynamicClauses).toBeGreaterThanOrEqual(0);
    expect(migrations.dynamicClauses).toBeLessThan(migrations.addColumnClauses);
  });
});

/**
 * Build a fragment shaped exactly like the generator's output, so the fixtures
 * below exercise the real parse path rather than a friendlier one.
 */
function generatedTypesFixture(
  tables: Record<string, string[]>,
  views: Record<string, string[]> = {},
): string {
  const block = (entries: Record<string, string[]>) =>
    Object.entries(entries)
      .map(
        ([name, columns]) =>
          `      ${name}: {\n` +
          `        Row: {\n` +
          columns.map((c) => `          ${c}: string | null`).join("\n") +
          `\n        }\n` +
          `        Insert: {\n` +
          columns.map((c) => `          ${c}?: string | null`).join("\n") +
          `\n        }\n` +
          `        Relationships: []\n` +
          `      }`,
      )
      .join("\n");

  return [
    "export type Database = {",
    "  public: {",
    "    Tables: {",
    block(tables),
    "    }",
    "    Views: {",
    block(views),
    "    }",
    "  }",
    "}",
  ].join("\n");
}

/** Run the whole pipeline over one synthetic migration and one synthetic types file. */
function driftOf(sql: string, types: string): Drift {
  return driftReport(
    collectMigrationSchema([{ name: "fixture.sql", sql }]),
    parseGeneratedRows(types),
  );
}

describe("the guard has teeth", () => {
  /*
   * The real repo reports zero drift today, which means the assertions above
   * would pass just as well if every function in this file returned nothing.
   * These fixtures are the proof that they do not. Each one is a shape that
   * actually occurs in supabase/migrations.
   */

  it("flags a column a migration added that the types do not carry", () => {
    const sql = "alter table public.decisions add column forecast_band_missed_at timestamptz;";
    const types = generatedTypesFixture({ decisions: ["id", "forecast_claim"] });
    expect(driftOf(sql, types).missingColumns).toEqual(["decisions.forecast_band_missed_at"]);
  });

  it("passes a column the types do carry", () => {
    const sql = "alter table public.decisions add column forecast_band_missed_at timestamptz;";
    const types = generatedTypesFixture({ decisions: ["id", "forecast_band_missed_at"] });
    expect(driftOf(sql, types).missingColumns).toEqual([]);
  });

  it("is not fooled by a VIEW that exposes the column the table lacks", () => {
    // The reason parseGeneratedRows tracks a path instead of an indent. A view
    // over a table is generated with its own Row block one key away.
    const sql = "alter table public.decisions add column forecast_predicted numeric;";
    const types = generatedTypesFixture(
      { decisions: ["id"] },
      { decisions_public: ["id", "forecast_predicted"] },
    );
    expect(driftOf(sql, types).missingColumns).toEqual(["decisions.forecast_predicted"]);
  });

  it("reads IF NOT EXISTS, a bare table name and quoted identifiers", () => {
    const sql = [
      "ALTER TABLE public.spine_tracks ADD COLUMN IF NOT EXISTS pending_gates jsonb;",
      "alter table workspaces add column if not exists risk_throttle_until timestamptz;",
      'alter table "public"."themes" add column "novelty_basis" text;',
    ].join("\n");
    const types = generatedTypesFixture({
      spine_tracks: ["id"],
      workspaces: ["id"],
      themes: ["id"],
    });
    expect(driftOf(sql, types).missingColumns).toEqual([
      "spine_tracks.pending_gates",
      "themes.novelty_basis",
      "workspaces.risk_throttle_until",
    ]);
  });

  it("reads every clause of one multi-column ALTER TABLE", () => {
    const sql =
      "alter table public.prds add column outcome text, add column outcome_check_by date;";
    const types = generatedTypesFixture({ prds: ["id"] });
    expect(driftOf(sql, types).missingColumns).toEqual(["prds.outcome", "prds.outcome_check_by"]);
  });

  it("forgets a column a later migration dropped", () => {
    // Removing this pass costs three false failures on the real corpus:
    // workspaces.autonomous_ship_enabled, _at and _by.
    const sql = [
      "alter table public.workspaces add column autonomous_ship_enabled boolean;",
      "alter table public.workspaces drop column if exists autonomous_ship_enabled;",
    ].join("\n");
    expect(driftOf(sql, generatedTypesFixture({ workspaces: ["id"] })).missingColumns).toEqual([]);
  });

  it("ignores an ADD COLUMN that only appears in a comment", () => {
    const sql = [
      "-- alter table public.decisions add column forecast_ghost text;",
      "/* alter table public.decisions add column forecast_other text; */",
      "alter table public.decisions add column forecast_real text;",
    ].join("\n");
    expect(driftOf(sql, generatedTypesFixture({ decisions: ["id"] })).missingColumns).toEqual([
      "decisions.forecast_real",
    ]);
  });

  it("skips a dynamic %I target instead of blaming a table called public", () => {
    // The 2026-05-30 tenancy migrations, verbatim in shape.
    const sql = [
      "do $$ begin",
      "  foreach t in array ws_tables loop",
      "    execute format('alter table public.%I add column if not exists workspace_id uuid', t);",
      "  end loop;",
      "end $$;",
    ].join("\n");
    const result = collectMigrationSchema([{ name: "fixture.sql", sql }]);
    expect(result.addColumnClauses).toBe(1);
    expect(result.dynamicClauses).toBe(1);
    expect([...result.addedColumns.keys()]).toEqual([]);
  });

  it("does not let a quoted EXECUTE spill its columns onto the next statement", () => {
    // No semicolon lives inside the quoted statement, so the clause walk is
    // bounded by the next `alter table` rather than by the next `;`. Without
    // that bound, `id_a` would be recorded against `alpha` AND `beta`.
    const sql = [
      "do $$ begin execute 'alter table public.alpha add column id_a text' end $$;",
      "alter table public.beta add column id_b text;",
    ].join("\n");
    const result = collectMigrationSchema([{ name: "fixture.sql", sql }]);
    expect([...(result.addedColumns.get("alpha") ?? [])]).toEqual(["id_a"]);
    expect([...(result.addedColumns.get("beta") ?? [])]).toEqual(["id_b"]);
  });

  it("reports a created table the types have never heard of", () => {
    const sql = "create table if not exists public.user_ai_rate_limits (id uuid primary key);";
    expect(driftOf(sql, generatedTypesFixture({ decisions: ["id"] })).absentTables).toEqual([
      "user_ai_rate_limits",
    ]);
  });

  it("leaves another schema's table alone", () => {
    // `Database["public"]["Tables"]` is the only thing types.ts describes, so a
    // storage or auth table is out of scope rather than drift.
    const sql = "alter table storage.objects add column owner_id text;";
    const result = driftOf(sql, generatedTypesFixture({ decisions: ["id"] }));
    expect(result.missingColumns).toEqual([]);
    expect(result.absentTables).toEqual([]);
  });
});
