import { createServerFn } from "@tanstack/react-start";

/**
 * Backend drift check: does the database this build is talking to actually
 * carry the schema this build's code writes to?
 *
 * Cannot auto-APPLY migrations from the app: Lovable Cloud Workers have no DDL
 * credentials and no migration runner. The job here is to FAIL LOUD with a
 * clear message instead of letting users hit cryptic Postgres errors (missing
 * column, undefined function) deep inside flows like onboarding.
 *
 * WHY THIS IS NOT A LIST OF MIGRATION VERSIONS ANY MORE.
 * It was, and the list had one entry ("20260617") while the repo carried 372
 * migration versions dated after it (counted 2026-08-06 over
 * supabase/migrations/), so the banner could not fire for any of them.
 * A bare version number is unfalsifiable at runtime: nothing in the app can
 * tell you whether the number is right, so a wrong number looks exactly like a
 * healthy backend. Every entry below instead names a TABLE AND COLUMN that
 * user-facing code reads or writes, which the app can ask Postgres about
 * directly.
 *
 * That closes half the rot and no more, so be precise about which half. An
 * entry that is WRONG — names a column production does not have — now raises
 * the banner on the next page load instead of sitting silent. An entry that is
 * MISSING, because someone shipped a migration and did not come here, is still
 * silence. Nothing inside a Worker can see supabase/migrations/, so that half
 * has to be closed by a repo test; see REQUIRED_SCHEMA below.
 *
 * TWO PROBES, and only the first can raise the banner on its own:
 *
 *  1. COLUMN PROBE (authoritative). Ask PostgREST for one row of the column.
 *     An absent column comes back as an error rather than data — the same
 *     error the user would otherwise hit mid-flow — and only the codes in
 *     ABSENT_CODES below are read as absence; every other error is treated as
 *     unanswerable. This probe is reachable today: it reads public tables as
 *     service_role, which is how the rest of the app reads them.
 *
 *  2. MIGRATION-LEDGER PROBE (fallback only). Reads
 *     supabase_migrations.schema_migrations. Measured 2026-08-06 through the
 *     Lovable MCP against project 371dd588-1b70-4629-9bb5-9f003f3af373:
 *     that schema's `nspacl` and the table's `relacl` are both NULL (owner
 *     only), and has_schema_privilege('service_role', 'supabase_migrations',
 *     'USAGE') and has_table_privilege('service_role',
 *     'supabase_migrations.schema_migrations', 'SELECT') are both false. Those
 *     grants are what was measured; the consequence is that `supabaseAdmin`,
 *     which reaches PostgREST as service_role, cannot read this table, so the
 *     probe answers nothing until an operator grants access. It is kept and
 *     repaired so it starts working the day that grant lands, and it is
 *     consulted ONLY when the column probe could not answer — which is why an
 *     unreadable ledger can never by itself put the banner on screen.
 *
 * ADDING AN ENTRY IS HOW YOU ARM THIS CHECK FOR A NEW MIGRATION. One entry per
 * migration whose schema user-facing code depends on, naming a column that
 * migration adds. Two shapes this cannot see, by construction: a migration
 * that only changes a CHECK constraint or a function body, and a migration
 * that only backfills data. Both need the ledger probe (see above) or a test.
 *
 * The prebuild twin, scripts/check-migrations.sh, compares every file under
 * supabase/migrations/ against the same ledger, but exits 0 with a warning
 * when PGHOST is unset — which is the Lovable build environment (README.md
 * :357: hosting and deploys are Lovable's). Do not read a green build as
 * evidence that migrations applied.
 */

type RequiredSchema = {
  /** public-schema table, as PostgREST addresses it. */
  table: string;
  /** Column the migration added, and that app code depends on. */
  column: string;
  /** Full migration version = the numeric filename prefix under supabase/migrations/. */
  since: string;
  /** What breaks for a user when this column is absent. */
  why: string;
};

/**
 * Verified present in production on 2026-08-06 via the Lovable MCP
 * (information_schema.columns, project 371dd588-1b70-4629-9bb5-9f003f3af373),
 * so this list is silent today rather than alarming on arrival.
 *
 * Exported so a repo test can assert each `since` names a real file under
 * supabase/migrations/ and that a newer column-adding migration has not
 * arrived without an entry. That test does not live here because this file
 * runs in a Worker and cannot read the filesystem.
 */
export const REQUIRED_SCHEMA: readonly RequiredSchema[] = [
  {
    table: "prds",
    column: "is_sample",
    since: "20260806120000",
    why: "discovery.functions.ts carries it onto the spec it writes from a seeded bet, and both spec-list reads select it; without the column, drawing a spec from the Example bet fails on an unknown column.",
  },
  {
    table: "opportunities",
    column: "is_sample",
    since: "20260805220000",
    why: "Discover tags a seeded bet as an example before the click; Decide refuses to open the station on one when real work exists.",
  },
  {
    table: "themes",
    column: "is_sample",
    since: "20260806060000",
    why: "DiscoverSurface labels a theme made only of examples as an example.",
  },
  {
    table: "workspaces",
    column: "is_sample",
    since: "20260708160000",
    why: "The whole example-workspace honesty chain keys off this; Decide reads it to decide whether the user is standing in a demo.",
  },
];

/**
 * SQLSTATEs and PostgREST codes that mean the thing genuinely is not there.
 * Anything else — a timeout, a transport failure, an unrecognised code — is
 * treated as "could not answer" and fails open, because a banner shown to
 * every user on a network blip is worse than the drift it would warn about.
 */
const ABSENT_CODES = new Set(["42703", "42P01", "PGRST204", "PGRST205"]);

type ProbeVerdict = "present" | "missing" | "unknown";

export type BackendHealth = {
  ok: boolean;
  pending: string[];
  checkedAt: string;
  reason?: string;
  /** Entries neither probe could answer for. Never counted as drift. */
  inconclusive?: string[];
};

/** Warn the operator once per Worker isolate, not once per user session. */
let warnedLedgerUnreachable = false;
let warnedDrift = false;

export const checkBackendHealth = createServerFn({ method: "GET" }).handler(
  async (): Promise<BackendHealth> => {
    const checkedAt = new Date().toISOString();
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      /**
       * An EMPTY ROW SET IS A VALID ANSWER HERE and must not be read as
       * failure: an empty table still proves the column parsed. What proves
       * presence is the absence of `error`, because PostgREST rejects an
       * unknown column before it ever runs the query.
       */
      const probeColumn = async (entry: RequiredSchema): Promise<ProbeVerdict> => {
        const { error } = await supabaseAdmin
          .from(entry.table as never)
          .select(entry.column as never)
          .limit(1);
        if (!error) return "present";
        return ABSENT_CODES.has(error.code ?? "") ? "missing" : "unknown";
      };

      /** Why the ledger could not be read, kept for `reason` and the log line. */
      let ledgerError: string | undefined;

      /**
       * Returns the applied versions, or null when the ledger could not be
       * read. NULL IS THE ANSWER FOR AN EMPTY ROW SET TOO: a refused read
       * resolves rather than throwing, and production held 599 rows here when
       * measured on 2026-08-06, so zero rows means the read was refused, not
       * that nothing has ever been applied. Treating empty as "nothing
       * applied" would mark every entry pending and show the banner to
       * everyone.
       *
       * READS `name` AS WELL AS `version`, and for the same reason
       * scripts/check-migrations.sh:49-54 does. Lovable records its own apply
       * timestamp in `version`, which for its auto-generated migrations lands
       * a few seconds after the filename. Measured 2026-08-06 against the
       * repo's 479 distinct migration versions: 35 have no exact `version`
       * row. 32 of those are that clock skew (file 20260712203617 is recorded
       * as version 20260712203623) and all 32 still carry the filename in
       * `name`, so reading `name` recovers every one; matching on `version`
       * alone would call all 32 unapplied. The remaining 3 are genuinely
       * unapplied and neither column finds them, which is the answer we want.
       */
      const probeLedger = async (): Promise<Set<string> | null> => {
        const { data, error } = await supabaseAdmin
          .schema("supabase_migrations" as never)
          .from("schema_migrations" as never)
          .select("version, name");
        if (error) {
          ledgerError = error.message;
          return null;
        }
        const rows = (data ?? []) as Array<{ version: string | null; name: string | null }>;
        if (rows.length === 0) {
          ledgerError = "zero rows, which for this table means the read was refused";
          return null;
        }
        const applied = new Set<string>();
        for (const row of rows) {
          if (row.version) applied.add(row.version);
          const fromName = row.name?.match(/^(\d+)/)?.[1];
          if (fromName) applied.add(fromName);
        }
        return applied;
      };

      const [verdicts, applied] = await Promise.all([
        Promise.all(REQUIRED_SCHEMA.map(probeColumn)),
        probeLedger(),
      ]);

      if (!applied && !warnedLedgerUnreachable) {
        warnedLedgerUnreachable = true;
        console.warn(
          `[health] migration ledger unreadable (${ledgerError ?? "no error reported"}); ` +
            "drift detection is running on column probes alone. Grant service_role USAGE on " +
            "schema supabase_migrations and SELECT on supabase_migrations.schema_migrations, " +
            "or expose a SECURITY DEFINER reader in public, to re-arm the fallback.",
        );
      }

      const pending: string[] = [];
      const inconclusive: string[] = [];
      const drifted: RequiredSchema[] = [];

      REQUIRED_SCHEMA.forEach((entry, i) => {
        const label = `${entry.table}.${entry.column} (migration ${entry.since})`;
        const verdict = verdicts[i];
        if (verdict === "present") return;
        if (verdict === "missing") {
          pending.push(label);
          drifted.push(entry);
          return;
        }
        // Column probe could not answer. Fall back to the ledger, and only
        // call it drift when the ledger is readable AND has no record of the
        // migration. An unreadable ledger leaves the entry inconclusive.
        if (applied && !applied.has(entry.since)) {
          pending.push(label);
          drifted.push(entry);
          return;
        }
        inconclusive.push(label);
      });

      // The banner can only say how many, and it reaches the user, not the
      // person who can fix it. This is the line that reaches the operator, and
      // it carries the one thing that makes the fix obvious: which migration
      // to apply, and what it costs the user until they do.
      if (drifted.length === 0) {
        // Re-arm, so drift that comes back inside the life of one isolate is
        // logged again rather than swallowed by the first clean check.
        warnedDrift = false;
      } else if (!warnedDrift) {
        warnedDrift = true;
        console.error(
          `[health] backend drift — apply these migrations:\n${drifted
            .map(
              (e) => `  - supabase/migrations/${e.since}_*.sql (${e.table}.${e.column}) — ${e.why}`,
            )
            .join("\n")}`,
        );
      }

      // `reason` is set even when ok === true, because "the check passed" and
      // "the check could not run" must not look the same to whoever reads this
      // payload. That confusion is what let the old version sit dead for weeks.
      const notes: string[] = [];
      if (!applied) {
        notes.push(`migration ledger unreadable (${ledgerError ?? "no error reported"})`);
      }
      if (inconclusive.length > 0) {
        notes.push(`${inconclusive.length}/${REQUIRED_SCHEMA.length} entries unverified`);
      }
      const reason = notes.length > 0 ? notes.join("; ") : undefined;

      return {
        ok: pending.length === 0,
        pending,
        checkedAt,
        ...(reason ? { reason } : {}),
        ...(inconclusive.length > 0 ? { inconclusive } : {}),
      };
    } catch (err) {
      // Fail open: an exception here shouldn't block users behind a banner
      // they cannot act on.
      return {
        ok: true,
        pending: [],
        checkedAt,
        reason: `probe-threw: ${(err as Error).message}`,
      };
    }
  },
);
