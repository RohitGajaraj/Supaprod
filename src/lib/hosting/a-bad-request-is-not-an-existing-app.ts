/**
 * A BAD REQUEST IS NOT AN EXISTING APP.
 *
 * ── WHAT THE MERGED SHIP HIT AT 06:24 UTC ON 2026-09-04 ──────────────────
 * `deployChangesetApp` ensures the app exists before deploying to it, and an
 * already-taken slug is genuinely fine -- the ensure is meant to be idempotent.
 * The test it used:
 *
 *     if (!createRes.ok && createRes.status !== 409 && createRes.status !== 400)
 *
 * 409 is "that slug is taken", which is the case the tolerance exists for. 400
 * is "your request was bad", which is not a case at all -- it is every case the
 * host has no more specific code for. The body that day said
 * `APP_LIMIT_EXCEEDED`: ten of ten Deno apps used, all of them July preview
 * shells nobody deleted.
 *
 * So the ensure returned as though the app were there, the deploy went to an app
 * that had never been created, and the failure a person eventually read was
 * about the deploy rather than about the quota. **The host said exactly what was
 * wrong and we replaced it with silence, then reported a different wall.**
 *
 * The deploy call twelve lines below already does this correctly -- P-39 made it
 * read 500 bytes of the body precisely because "a quota message" runs past 200.
 * The same argument was never applied one call up.
 *
 * ── SO THE RULE IS NARROW AND THE DEFAULT IS TO REFUSE ───────────────────
 * Tolerate the statuses that MEAN the app is there, and read the body before
 * tolerating an ambiguous one. Everything else stops with the host's own
 * sentence attached, because a provider that troubles to say
 * `APP_LIMIT_EXCEEDED` has told us the one thing a person needs.
 *
 * Erring towards refusal is safe here in a way the opposite is not: a false
 * refusal costs one deploy and says why, and a false "it exists" spends the
 * whole deploy and reports the wrong wall -- which is the bug being fixed.
 */

/** What the host's answer to "create this app" actually means. */
export type EnsureAppOutcome =
  { kind: "ready" } | { kind: "refused"; reason: string; atCapacity: boolean };

/** The marker Deno uses when the account has no app slots left. */
const AT_CAPACITY = "app_limit_exceeded";

/**
 * Phrases that mean "this slug is already yours", for a host that answers 400
 * where another would answer 409. Matched on the BODY, never on the status
 * alone, which is the entire distinction this file exists to keep.
 */
const ALREADY_THERE = ["already exists", "already taken", "duplicate", "slug_taken"];

/**
 * Read the create response.
 *
 * `body` is the response text, as much of it as the caller read. An empty body
 * on an ambiguous status yields a refusal rather than a pass: we have no
 * evidence the app is there, and inventing some is the defect.
 */
export function readAppCreate(input: {
  ok: boolean;
  status: number;
  body: string;
}): EnsureAppOutcome {
  if (input.ok) return { kind: "ready" };

  /* The unambiguous one. A taken slug is the ensure working. */
  if (input.status === 409) return { kind: "ready" };

  const body = (input.body ?? "").trim();
  const lower = body.toLowerCase();

  if (lower.includes(AT_CAPACITY)) {
    return {
      kind: "refused",
      atCapacity: true,
      reason:
        "The hosting account has no app slots left, so this preview was never created. " +
        `The host said: ${body.slice(0, 500)}. ` +
        "Delete an app that is no longer needed and run the preview again.",
    };
  }

  if (input.status === 400 && ALREADY_THERE.some((p) => lower.includes(p))) {
    return { kind: "ready" };
  }

  return {
    kind: "refused",
    atCapacity: false,
    reason: body
      ? `The host refused to create the app for this preview (${input.status}): ${body.slice(0, 500)}`
      : `The host refused to create the app for this preview (${input.status}), and said nothing about why.`,
  };
}
