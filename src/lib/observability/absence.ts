/**
 * Telling ABSENCE from FAILURE, for database errors.
 *
 * This lives in the observability folder because that distinction IS the
 * observability concern. Several ticks are deliberately "pre-migration
 * tolerant": they run before the migration that creates the table or function
 * they need, and a missing object genuinely is a skip rather than an incident.
 * The way that tolerance was written, though, was `if (error) return { ok: true,
 * skipped }` -- which also swallows a revoked grant, a network fault, a
 * permission denial, and a function that started raising. retention-tick
 * reported a data-retention purge that had not happened as a success every day
 * on exactly that line.
 *
 * A skip is only honest when it is narrowed to the one error that means "not
 * built yet". Everything else has to reach `job_runs` as an error.
 */

export type PostgrestLikeError =
  { code?: string | null; message?: string | null } | null | undefined;

/**
 * Codes for "the object you named is not there". Postgres raises the 42xxx
 * ones; PostgREST answers with its own PGRST2xx when its schema cache has no
 * such table/function/column, which is what a Supabase client actually sees
 * before a migration lands.
 */
const MISSING_OBJECT_CODES = new Set([
  "42P01", // undefined_table
  "42883", // undefined_function
  "42703", // undefined_column
  "PGRST202", // function not found in the schema cache
  "PGRST204", // column not found in the schema cache
  "PGRST205", // table not found in the schema cache
]);

/**
 * Codes are the reliable signal; the message is the fallback for clients that
 * drop the code. Deliberately narrow: "permission denied for table x" must NOT
 * match, because a revoked grant is the incident this whole check exists to stop
 * being reported as a skip.
 */
const MISSING_OBJECT_MESSAGE =
  /(?:relation|table|function|column) .*does not exist|could not find the .*(?:table|function|column)/i;

/** True only when the error means "this database object has not been created
 *  yet". Any other error, including one with no code at all, is a failure. */
export function isMissingDatabaseObject(error: PostgrestLikeError): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  if (code && MISSING_OBJECT_CODES.has(code)) return true;
  return MISSING_OBJECT_MESSAGE.test(error.message ?? "");
}
