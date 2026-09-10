// Static migration SQL apply-safety linter.
//
// The existing `scripts/check-migrations.sh` only checks that every migration FILE
// has been applied to the DB; it needs DB access and says nothing about whether a
// file's SQL will actually apply. This module fills that gap: a pure, OFFLINE,
// deterministic linter that catches apply-time-fatal SQL patterns BEFORE a migration
// ships, so a broken migration never fails on the founder's publish.
//
// Motivation (real, recurring): this project repeatedly shipped migrations that would
// fail to apply, e.g. `CREATE POLICY ... IF NOT EXISTS` (Postgres ERROR 42601 -
// CREATE POLICY has never supported IF NOT EXISTS; the safe idiom is DROP POLICY IF
// EXISTS then CREATE POLICY). Those are detected here with ZERO false positives,
// because the construct is ALWAYS invalid SQL, never a legitimate choice.
//
// Spec: docs/features/migration-lint.md

export type MigrationLintSeverity = "error" | "warn";

export interface MigrationLintFinding {
  severity: MigrationLintSeverity;
  rule: string;
  /** 1-based line number in the original SQL. */
  line: number;
  message: string;
}

/**
 * Replace SQL comment characters with spaces while preserving length and newlines, so
 * a match offset still maps to the right ORIGINAL line and a commented-out statement
 * never trips a rule. String literals are tracked only so a `--` inside one does not
 * start a comment; their contents are left intact (a credential-like phrase inside a
 * string is not our concern here, and migrations rarely embed rule text in strings).
 */
function blankComments(sql: string): string {
  const chars = sql.split("");
  const n = chars.length;
  let i = 0;
  let inLine = false;
  let inBlock = false;
  let inString = false;
  while (i < n) {
    const c = chars[i];
    const c2 = i + 1 < n ? chars[i + 1] : "";
    if (inLine) {
      if (c === "\n") inLine = false;
      else chars[i] = " ";
      i++;
      continue;
    }
    if (inBlock) {
      if (c === "*" && c2 === "/") {
        chars[i] = " ";
        chars[i + 1] = " ";
        i += 2;
        inBlock = false;
        continue;
      }
      if (c !== "\n") chars[i] = " ";
      i++;
      continue;
    }
    if (inString) {
      if (c === "'") inString = false;
      i++;
      continue;
    }
    // Dollar-quoted body ($$...$$ or $tag$...$tag$, e.g. a plpgsql function): blank
    // the whole body so free text inside it (a RAISE NOTICE or comment that mentions
    // a forbidden phrase) can never trip a rule. A bare `$1` positional param is not a
    // dollar-quote (no closing `$`), so it is left intact.
    if (c === "$") {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(chars[j])) j++;
      if (j < n && chars[j] === "$") {
        const tag = sql.slice(i, j + 1);
        const close = sql.indexOf(tag, j + 1);
        const end = close === -1 ? n : close + tag.length;
        for (let k = i; k < end && k < n; k++) {
          if (chars[k] !== "\n") chars[k] = " ";
        }
        i = end;
        continue;
      }
    }
    if (c === "-" && c2 === "-") {
      chars[i] = " ";
      chars[i + 1] = " ";
      i += 2;
      inLine = true;
      continue;
    }
    if (c === "/" && c2 === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      i += 2;
      inBlock = true;
      continue;
    }
    if (c === "'") {
      inString = true;
      i++;
      continue;
    }
    i++;
  }
  return chars.join("");
}

/** 1-based line number of a character offset. */
function lineOf(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") line++;
  }
  return line;
}

type RegexRule = { rule: string; severity: MigrationLintSeverity; re: RegExp; message: string };

// Patterns that are ALWAYS invalid SQL (apply-fatal). Zero false positives: the
// construct cannot legitimately appear, so a hard error is safe.
const REGEX_RULES: RegexRule[] = [
  {
    rule: "create-policy-if-not-exists",
    severity: "error",
    re: /\bcreate\s+policy\s+if\s+not\s+exists\b/gi,
    message:
      'CREATE POLICY does not support IF NOT EXISTS (Postgres ERROR 42601 on apply). Use: DROP POLICY IF EXISTS "name" ON table; CREATE POLICY ...',
  },
  {
    rule: "create-trigger-if-not-exists",
    severity: "error",
    re: /\bcreate\s+trigger\s+if\s+not\s+exists\b/gi,
    message:
      "CREATE TRIGGER does not support IF NOT EXISTS (fails on apply). Use: DROP TRIGGER IF EXISTS name ON table; CREATE TRIGGER ...",
  },
];

/**
 * Lint one migration's SQL for apply-safety problems. Pure and deterministic; no DB,
 * no clock. `error`-severity findings are apply-fatal (the migration would not apply);
 * `warn`-severity are advisory risks a human should confirm.
 */
/**
 * ── A MIGRATION THAT STAMPS THE LEDGER MUST STAMP ITSELF ─────────────────────
 *
 * Measured 2026-09-10. **22 migrations in this repo write rows into
 * `supabase_migrations.schema_migrations` on behalf of OTHER migrations** --
 * catch-up files, written after a lane applies a batch by hand -- and they stamp
 * 112 distinct versions between them. **NOT ONE OF THE 22 STAMPS ITS OWN
 * VERSION.** Zero for twenty-two is not a tendency, it is a property.
 *
 * The consequence is the drift itself. Lovable records the catch-up file under
 * its own apply-time version, so the catch-up's FILE version is the one that
 * goes missing from the ledger, and `check-migrations.sh` -- which compares
 * filenames against that ledger -- would report those files as PENDING when they
 * are applied. On 2026-09-10 that was 22 files, all 22 verified applied by hand:
 * **a gate that cries 22 and means zero is a gate somebody switches off.**
 *
 * ── WHY THIS RULE RATHER THAN A SCHEMA ORACLE ────────────────────────────────
 *
 * The tempting fix is to stop trusting the ledger and assert the OBJECTS each
 * migration creates. It does not survive contact: six of those 22 are DATA
 * migrations -- seeding 2,225 lineage rows, setting a flag on 283, reserving a
 * slug, tightening a constraint, writing ledger rows -- and **you cannot derive
 * from arbitrary SQL which object to assert.** An object oracle needs a
 * hand-written expectation per migration, which is one more hand-maintained
 * second source, and this repo retired four of those in a single night for
 * exactly that failure.
 *
 * The ledger is not unreliable in principle. It is unreliable because 22 files
 * write it by hand and none writes its own row. **Close the cause and the drift
 * has no source**, which is what this does: it is derivable (the file's own name
 * against the versions it inserts), it needs no database, it maintains nothing,
 * and it would have caught all 22 historically.
 *
 * ── AND IT HAS AN EFFECTIVE DATE, WHICH IS THE POINT OF THE WHOLE EXERCISE ───
 *
 * Run over the repo with no cutoff it flags all 22 and FAILS THE BUILD, on files
 * that are already applied and cannot be usefully fixed: editing an applied
 * migration changes nothing in the database, and the versions they omitted are a
 * closed, verified set awaiting one backfill.
 *
 * **A guard that fires 22 times and means zero is a guard somebody switches
 * off** -- which is the exact sentence this repo used about `check-migrations.sh`
 * an hour before this rule was written. Repeating that mistake inside the fix for
 * it would be the funniest possible outcome and the least useful.
 *
 * So the rule governs migrations written FROM `LEDGER_STAMP_RULE_FROM` onward. It
 * cannot be quietly widened backwards to bless a new offender, because
 * `a-catch-up-migration-stamps-itself.test.ts` pins the pre-cutoff set at exactly
 * 22 by name.
 */

/**
 * The rule's effective date: migrations from this version onward must stamp
 * themselves. Everything before it is the 22 catch-up files measured on
 * 2026-09-10, which are pinned by name in the guard rather than trusted to a
 * count.
 */
export const LEDGER_STAMP_RULE_FROM = "20260910000000";
function ledgerStampMissesItself(
  clean: string,
  filename: string,
): { line: number; stamped: string[] } | null {
  const own = /^([0-9]+)/.exec(filename)?.[1];
  if (!own) return null;
  /* Lexicographic, which is correct here: both sides are zero-padded
     `YYYYMMDDHHMMSS`, so string order IS chronological order. */
  if (own < LEDGER_STAMP_RULE_FROM) return null;
  const at = clean.search(/insert\s+into\s+supabase_migrations\.schema_migrations/i);
  if (at === -1) return null;
  /* The whole statement, so a multi-row VALUES list is read in full. A file may
     carry more than one such insert; the union of everything they stamp is what
     matters, because stamping yourself anywhere in the file is enough. */
  const stamped = new Set<string>();
  const re = /insert\s+into\s+supabase_migrations\.schema_migrations/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    const end = clean.indexOf(";", m.index);
    const stmt = clean.slice(m.index, end === -1 ? undefined : end);
    for (const v of stmt.matchAll(/'([0-9]{8,20})'/g)) stamped.add(v[1]);
  }
  if (stamped.size === 0) return null;
  if (stamped.has(own)) return null;
  return { line: lineOf(clean, at), stamped: [...stamped].sort() };
}

export function lintMigrationSql(sql: string, filename?: string): MigrationLintFinding[] {
  const findings: MigrationLintFinding[] = [];
  if (!sql) return findings;
  const clean = blankComments(sql);

  // 1. Always-invalid constructs (apply-fatal).
  for (const r of REGEX_RULES) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.re.exec(clean)) !== null) {
      findings.push({
        severity: r.severity,
        rule: r.rule,
        line: lineOf(clean, m.index),
        message: r.message,
      });
      if (r.re.lastIndex === m.index) r.re.lastIndex++;
    }
  }

  // 2. A new PUBLIC-schema table with no RLS enabled in the SAME file (the repo
  //    requires RLS on tenant tables). Advisory: RLS may be enabled in a later
  //    migration. A table in a non-public schema (e.g. app_private) is intentionally
  //    service-role-only, so it is skipped rather than flagged.
  const tableRe = /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:("?[\w]+"?)\.)?("?[\w]+"?)/gi;
  let tm: RegExpExecArray | null;
  while ((tm = tableRe.exec(clean)) !== null) {
    const idx = tm.index;
    if (tableRe.lastIndex === idx) tableRe.lastIndex++;
    const schema = (tm[1] ?? "").replace(/"/g, "").toLowerCase();
    const name = tm[2].replace(/"/g, "");
    if (schema && schema !== "public") continue; // non-public table: intentionally RLS-exempt
    const rlsRe = new RegExp(
      `alter\\s+table\\s+(?:public\\.)?"?${name}"?\\s+enable\\s+row\\s+level\\s+security`,
      "i",
    );
    if (!rlsRe.test(clean)) {
      findings.push({
        severity: "warn",
        rule: "new-table-no-rls",
        line: lineOf(clean, idx),
        message: `New table "${name}" has no ENABLE ROW LEVEL SECURITY in this migration. Confirm RLS is intended (tenant tables must enable it).`,
      });
    }
  }

  // 3. ADD COLUMN ... NOT NULL without a DEFAULT (fails on a populated table).
  //    Per-statement so the DEFAULT must be in the SAME statement to clear it.
  for (const stmt of splitStatements(clean)) {
    if (
      /\badd\s+column\b/i.test(stmt.text) &&
      /\bnot\s+null\b/i.test(stmt.text) &&
      !/\bdefault\b/i.test(stmt.text)
    ) {
      findings.push({
        severity: "warn",
        rule: "add-column-notnull-no-default",
        line: lineOf(clean, stmt.index),
        message:
          "ADD COLUMN ... NOT NULL without a DEFAULT fails on a table that already has rows. Add a DEFAULT, or backfill then SET NOT NULL.",
      });
    }
  }

  // 4. A catch-up migration that records other versions and not its own.
  if (filename) {
    const miss = ledgerStampMissesItself(clean, filename);
    if (miss) {
      findings.push({
        severity: "error",
        rule: "ledger-stamp-omits-self",
        line: miss.line,
        message:
          `This migration writes supabase_migrations.schema_migrations for ${miss.stamped.length} ` +
          `other version(s) and not for its own. Add its own version to the VALUES list. ` +
          `A catch-up file that stamps everything but itself is the reason check-migrations ` +
          `reports applied migrations as pending.`,
      });
    }
  }

  return findings.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
}

/** Split SQL into statements on top-level semicolons, tracking each one's start offset. */
function splitStatements(clean: string): Array<{ text: string; index: number }> {
  const out: Array<{ text: string; index: number }> = [];
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === ";") {
      out.push({ text: clean.slice(start, i), index: start });
      start = i + 1;
    }
  }
  if (start < clean.length) out.push({ text: clean.slice(start), index: start });
  return out;
}

export function hasBlockingError(findings: MigrationLintFinding[]): boolean {
  return findings.some((f) => f.severity === "error");
}

export function summarizeMigrationLint(findings: MigrationLintFinding[]): string {
  if (findings.length === 0) return "No migration apply-safety issues.";
  const errors = findings.filter((f) => f.severity === "error").length;
  const warns = findings.length - errors;
  const parts: string[] = [];
  if (errors) parts.push(`${errors} apply-fatal error${errors === 1 ? "" : "s"}`);
  if (warns) parts.push(`${warns} warning${warns === 1 ? "" : "s"}`);
  return parts.join(", ") + ".";
}
