/**
 * The screening floor at the AI chokepoint: rules that apply to every call in
 * every workspace, whether or not anyone configured guardrails.
 *
 * WHY THIS EXISTS. Walking the live product on 2026-08-03, the Engine room's
 * Safety room read "0 guardrails on" directly above a list of blocks that had
 * plainly happened. Chasing it found something worse than a counter: both the
 * display AND `runtime.server.ts`'s `loadGuardrails` filtered `guardrail_rules`
 * by `user_id`. Screening was therefore a property of WHICH PERSON was signed in.
 * An admin could configure 27 rules, a teammate could join, and that teammate's
 * calls would run with no PII redaction, no secret block and no injection check,
 * while the Safety room showed them somebody else's incidents.
 *
 * Migration 20260803191000 moves the table to workspace scope, which is the right
 * model and what `egress-guardrails.ts` already assumed. But scope alone would
 * have made things WORSE for the workspace that surfaced the bug: its 27 rules
 * backfilled into their owners' default workspaces, leaving it with zero. Under
 * user scoping a member's personal rules had at least been screening those calls;
 * under pure workspace scoping, nothing would.
 *
 * So the fix is scope PLUS a floor, and the floor is code-owned rather than
 * seeded. That is not a new idea here, it is the rule `egress-guardrails.ts`
 * already states for the public boundary: "a security floor must not depend on
 * opt-in config". This module says the same thing about the model boundary.
 *
 * WHAT IS AND IS NOT IN THE FLOOR. Only the categories where a miss is a
 * disclosure rather than a matter of taste: personal data, credentials, and
 * prompt injection. Profanity is a house-style preference and stays configurable,
 * because a floor that encodes taste invites teams to switch the floor off.
 *
 * Actions are deliberately the gentlest that still work. Personal data is
 * REDACTED, not blocked, because blocking a support transcript because it
 * contains an email address breaks the actual job. Credentials are BLOCKED,
 * because a leaked key is not recoverable. Injection is WARNED, because the
 * patterns are lexical and a hard block on prose would fire on a customer
 * legitimately quoting an attack.
 */
import type { GuardrailRule } from "./guardrails.server";

function floorRule(
  id: string,
  name: string,
  kind: GuardrailRule["kind"],
  pattern: string,
  action: GuardrailRule["action"],
  appliesTo: GuardrailRule["applies_to"],
): GuardrailRule {
  return { id, name, kind, pattern, action, applies_to: appliesTo, enabled: true };
}

/**
 * Mirrors the `pii`, `secret` and `injection` entries of `BUILTIN_SEED` in
 * `guardrails.functions.ts`. Kept as a separate literal rather than imported
 * because that seed is a CATALOGUE a user may edit, disable or delete per
 * workspace, and this is a FLOOR they may not. `guardrail-floor.test.ts` asserts
 * the two stay in step so a pattern improved in one is not silently missed here.
 *
 * Ids are prefixed `floor-` so a hit recorded against one is distinguishable in
 * `guardrail_hits` from a hit against a workspace's own rule of the same name.
 */
export const GUARDRAIL_FLOOR: GuardrailRule[] = [
  floorRule(
    "floor-pii-email",
    "Email address",
    "pii",
    "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    "redact",
    "both",
  ),
  /*
   * THE UUID EXCLUSION, AND IT IS NOT COSMETIC.
   *
   * MEASURED 2026-08-25 in the live workspace. This rule redacted the leading
   * run of any UUID whose first segment is digits and hyphens, because a UUID
   * is literally "a digit, then eight-or-more of [digit space ( ) . -], then a
   * digit". Two of the four PRDs in that workspace matched. What a station
   * downstream then received was:
   *
   *   PRD id [REDACTED:pii]e-4f49-b5b2-12f21e858042
   *
   * and `ux-architect` answered, correctly and uselessly: "the PRD ID is
   * redacted and could not be located. design.draft requires a valid,
   * unredacted UUID to proceed - no fallback or inference is permitted."
   *
   * So the guardrail meant to protect a person from leaked phone numbers was
   * silently severing the handoff between stations, which is the one thing this
   * product exists to do. The station ran, filed nothing, and held
   * `produced-nothing` - a failure that looks like an agent being unhelpful and
   * is actually us shredding its input.
   *
   * The boundaries are the whole fix: a phone number is never immediately
   * flanked by a hex character or a hyphen, and a UUID's interior always is.
   * Verified against the five real UUIDs in that workspace (zero now redacted)
   * and five phone shapes including E.164 and bare digits (all five still
   * caught).
   */
  floorRule(
    "floor-pii-phone",
    "Phone number",
    "pii",
    "(?<![0-9A-Fa-f-])\\+?\\d[\\d\\s().-]{7,}\\d(?![0-9A-Fa-f-])",
    "redact",
    "both",
  ),
  floorRule("floor-pii-card", "Credit card", "pii", "\\b(?:\\d[ -]*?){13,16}\\b", "redact", "both"),
  floorRule(
    "floor-secret-openai",
    "OpenAI API key",
    "secret",
    "sk-[A-Za-z0-9]{20,}",
    "block",
    "both",
  ),
  floorRule("floor-secret-aws", "AWS access key", "secret", "AKIA[0-9A-Z]{16}", "block", "both"),
  floorRule(
    "floor-secret-github",
    "GitHub token",
    "secret",
    "gh[pousr]_[A-Za-z0-9]{30,}",
    "block",
    "both",
  ),
  floorRule(
    "floor-injection-ignore",
    "Ignore instructions",
    "injection",
    "ignore (all|previous|above) instructions",
    "warn",
    "input",
  ),
  floorRule(
    "floor-injection-leak",
    "System prompt leak",
    "injection",
    "reveal (the )?(your )?(system )?prompt",
    "warn",
    "input",
  ),
];

/**
 * The floor, plus whatever this workspace configured, with the workspace's own
 * rules LAST so that a duplicate name reads as the team's version in the record.
 *
 * De-duplicated on (kind, pattern): a workspace that installed the built-in
 * catalogue would otherwise match every credential twice and write two hits for
 * one leak, which makes the incident count untrustworthy in exactly the surface
 * that exists to be trusted.
 */
export function withFloor(configured: GuardrailRule[]): GuardrailRule[] {
  const seen = new Set(GUARDRAIL_FLOOR.map((r) => `${r.kind}::${r.pattern}`));
  const extra = configured.filter((r) => !seen.has(`${r.kind}::${r.pattern}`));
  return [...GUARDRAIL_FLOOR, ...extra];
}
