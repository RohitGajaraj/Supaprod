/**
 * A FAILED READ IS NOT AN EMPTY RESULT, EXCEPT IN ONE CASE.
 *
 * ── THE DEFECT THIS EXISTS TO STOP, WHICH THIS REPO HAS PAID FOR REPEATEDLY ─
 * `if (error) return []` makes "the query failed" and "there is nothing there"
 * the same answer. Every instance found so far produced a surface stating a
 * confident falsehood rather than an error:
 *
 *   · the forecast desk reported no overdue calls, then VANISHED from the page,
 *     because its panel returns null when all three reads come back empty (F-120)
 *   · Guardrails said "Nothing checks your AI calls yet" over a table it could
 *     not read (F-118)
 *   · the autonomy dial returned `trusted` on a failed read, granting more
 *     independence than the operator had set (F-119)
 *   · the shell's live-work strip shows nothing in flight while work moves (S1)
 *
 * ── AND THE ONE CASE WHERE FAILING SOFT IS RIGHT ───────────────────────────
 * Four tests defended the old behaviour with a reason better than the first fix
 * that replaced it: *"Migrations and deploys are two switches with no enforced
 * order, and PostgREST answers an unknown column with an error rather than a
 * null. Throwing here would take the whole Learn desk down."*
 *
 * Both are correct, and they are about DIFFERENT ERRORS:
 *
 *   A MISSING COLUMN is a deployment-ordering fact. The feature is not there
 *   yet, the surface should stand, and an empty result is the honest answer.
 *
 *   ANYTHING ELSE is a runtime fact. The data exists and we could not read it,
 *   and returning empty is a claim we cannot support.
 *
 * The codes are the two PostgREST already uses, and `decideDesignGate` checks
 * the identical pair for the identical reason. Kept in one module because it was
 * written twice within a day of itself, and two copies of a rule about telling
 * two things apart is how they drift back together.
 */

/** PostgREST's undefined-column codes: `42703` from Postgres, `PGRST204` from the schema cache. */
export function isPreMigration(error: { code?: string | null } | null | undefined): boolean {
  return error?.code === "42703" || error?.code === "PGRST204";
}

/**
 * Raise unless the failure is the migration window, in which case say nothing
 * and let the caller return its empty shape.
 *
 * Returns `true` when the caller should fall soft, so a call site reads as one
 * line and cannot accidentally invert the test:
 *
 *     if (error) {
 *       if (failSoftOrThrow(error, "The forecasts that are due")) return { due: [] };
 *     }
 *
 * `what` is a NOUN PHRASE naming the thing, not a sentence: the message is
 * assembled here so every one of these reads the same way to a person, and so a
 * new call site cannot invent a different voice for the same event.
 */
export function failSoftOrThrow(
  error: { code?: string | null; message?: string | null } | null | undefined,
  what: string,
): boolean {
  if (!error) return true;
  if (isPreMigration(error)) return true;
  throw new Error(`${what} could not be read: ${error.message ?? "the database refused the read"}`);
}
