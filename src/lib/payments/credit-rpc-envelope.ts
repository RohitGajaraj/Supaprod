/**
 * READING THE ANSWER A CREDIT RPC ACTUALLY GIVES.
 *
 * Every credit-moving RPC in this repo (`apply_topup_credits`,
 * `grant_subscription_credits`, `reset_subscription_cycle`,
 * `apply_refund_clawback`) returns a jsonb envelope instead of raising, so a
 * refusal is not an exception. Layered on top of that, supabase-js RESOLVES a
 * refused write as `{data:null,error}` rather than throwing (the same rule
 * written up at build.functions.ts:704-728). The consequence is that a caller
 * doing `await admin.rpc(...)` inside a try/catch has TWO independent ways of
 * being told nothing happened and is listening to neither: a permission error,
 * a `cap_exceeded` refusal and a successful grant are all one resolved promise.
 *
 * This function is the single place that reads both channels. It only decides
 * WHAT HAPPENED. What to DO about it differs by caller and stays with the
 * caller: the payments webhook throws so the route answers non-2xx and the
 * provider retries a charge the customer already paid, while the credit-tick
 * cron logs and moves on so one bad account cannot abort a thousand-account
 * sweep.
 *
 * Benign reasons are passed in per call site rather than shared, because the
 * same word does not mean the same thing to two RPCs: `unchanged` is
 * `grant_subscription_credits` saying the allowance already matches, and would
 * be an unrecognized answer from `apply_topup_credits`. A shared allow-list
 * would wave through a refusal nobody has read.
 *
 * Pure: no client, no IO, no imports.
 */

/** What an RPC did, once both the transport error and the envelope are read. */
export type CreditRpcVerdict = { ok: true; reason: string | null } | { ok: false; failure: string };

/** Name the shape of a non-envelope answer, so the failure message is diagnosable. */
function describeShape(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "an array";
  return `a ${typeof value}`;
}

/**
 * Decide whether a credit RPC applied. `successKey` is the envelope's own
 * verdict field (`applied`, `granted`, `reset`); `benignReasons` are the
 * refusals that mean the desired state already holds, which is success from the
 * caller's point of view. Anything else, including a missing envelope, is a
 * failure: an RPC that has not been migrated yet answers null, and treating
 * that as success is exactly the silence this exists to end.
 */
export function readCreditRpcResult(args: {
  rpc: string;
  successKey: string;
  benignReasons: readonly string[];
  result: unknown;
  error?: { message?: string } | null;
}): CreditRpcVerdict {
  const { rpc, successKey, benignReasons, result, error } = args;

  if (error) {
    return {
      ok: false,
      failure: `${rpc} was refused by the database: ${error.message ?? "no message given"}`,
    };
  }

  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    return {
      ok: false,
      failure:
        `${rpc} returned ${describeShape(result)} instead of its {${successKey}, reason} ` +
        "envelope, so nothing here can know whether the credits moved",
    };
  }

  const envelope = result as Record<string, unknown>;
  if (envelope[successKey] === true) return { ok: true, reason: null };

  const reason = typeof envelope.reason === "string" ? envelope.reason : "unknown";
  if (benignReasons.includes(reason)) return { ok: true, reason };

  return { ok: false, failure: `${rpc} did not apply, reason: ${reason}` };
}
