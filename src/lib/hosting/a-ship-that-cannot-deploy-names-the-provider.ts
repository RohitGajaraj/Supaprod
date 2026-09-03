/**
 * ── WHAT STOPPED SHIP, IN WORDS THE PERSON CAN ACT ON (P-59) ─────────────
 *
 * The first honest Ship (tablet track 0c7374b6, 06:44 UTC 2026-09-03) failed at
 * preview. The bound repo is servable -- its `main.ts` is a Deno.serve program
 * with `/health`, and `supaprod.json` names the managed template. What stopped
 * it was ONE SECRET the Worker does not hold, and nothing on any surface said
 * so: the track read `produced-nothing`, the failure reason lived inside a
 * deployment card, and Settings did not know the provider was unconfigured.
 *
 * The founder asked at 14:00 what exactly he had to set. The product should
 * have told him, and that is the whole of this file: turn a failure reason into
 * the name of the thing to set and the place to set it, or admit it cannot.
 *
 * ── THE THREE ANSWERS, AND WHY THE THIRD EXISTS ──────────────────────────
 *
 * `missing-provider`  we know which variable is absent. Say it, and say where.
 * `other`             the deploy failed for a reason we can show but not act on.
 * `unknown`           there is no reason on the row at all.
 *
 * The third is not a formality. The one failed deployment in production TODAY
 * carries `failure_reason` NULL -- it predates P-39 item 3, which starts
 * recording it -- so the very row this packet was written for is the row we
 * cannot classify. Collapsing that into `missing-provider` would tell the
 * founder to set a token that may already be set, and collapsing it into
 * `other` would print "the host said:" with nothing after it. A surface that
 * says "nothing on this row says why" is worth more than either.
 */

/** The variables the managed preview host needs, in the order they are set. */
export const PREVIEW_HOST_VARS = ["DENO_DEPLOY_TOKEN", "DENO_DEPLOY_ORG"] as const;

/** Where they are set. Named because "set the token" without this is a puzzle. */
export const PREVIEW_HOST_WHERE = "the Lovable project";

export type ShipStop =
  | { kind: "missing-provider"; vars: readonly string[]; where: string }
  | { kind: "other"; said: string }
  | { kind: "unknown" };

/*
 * Matched on the variable NAME, not on a sentence. `deno-deploy.server.ts:61`
 * throws exactly "DENO_DEPLOY_TOKEN is not set", and matching that string would
 * break the moment somebody rewords the throw -- which is the same class of
 * coupling this repo has paid for repeatedly. The name is the stable part, and
 * a reason that mentions it is about that variable whatever the sentence around
 * it says.
 */
const NAMES_A_VAR = new RegExp(`\\b(${PREVIEW_HOST_VARS.join("|")}|DENO_DEPLOY_ACCESS_TOKEN)\\b`);

/** What stopped this Ship, from the failed deployment's own reason. */
export function shipStopFrom(failureReason: string | null | undefined): ShipStop {
  const said = (failureReason ?? "").trim();
  if (!said) return { kind: "unknown" };
  if (NAMES_A_VAR.test(said)) {
    return { kind: "missing-provider", vars: PREVIEW_HOST_VARS, where: PREVIEW_HOST_WHERE };
  }
  return { kind: "other", said };
}

/**
 * The sentence on the hold card.
 *
 * It names the variables and the place, and it ends on the one action, because
 * a person reading a hold needs to know what to do rather than what happened.
 * Both variables are named even though only one is usually missing: the org is
 * useless without the token and the token is useless without the org, so
 * setting one and coming back is a second failed Ship.
 */
export function shipStopLine(stop: ShipStop): string {
  if (stop.kind === "missing-provider") {
    return (
      `Ship has no preview host. Set ${stop.vars.join(" and ")} on ${stop.where}, ` +
      "then press Try again."
    );
  }
  if (stop.kind === "other") {
    return `Ship could not deploy. The host said: ${stop.said}`;
  }
  return "Ship could not deploy, and nothing on the attempt says why. Try again records a reason.";
}

/**
 * Nobody did anything wrong here, so the hold is not `produced-nothing`.
 *
 * `produced-nothing` reads "the run worked and its output went nowhere", which
 * points a person at the crew. A missing secret points at a person, and
 * `waiting-on-a-person` is the hold that says so. `other` and `unknown` stay
 * where they were: the deploy genuinely failed, and we are not claiming to know
 * whose move it is.
 */
export function shipStopWaitsOnAPerson(stop: ShipStop): boolean {
  return stop.kind === "missing-provider";
}
