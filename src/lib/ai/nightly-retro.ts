/**
 * RPT-39: Nightly retro agent, the pure core.
 *
 * The AI rung that complements RF-04's outcome distiller. RF-04 reads human
 * `learnings` (what a bet was worth) and drafts standing rules. This retro reads
 * the week's AGENT EXECUTION TRACES (`agent_runs`: what the autonomous agents
 * actually DID, including failures and halts) and drafts standing OPERATING
 * rules to prevent recurring operational problems, or repeat what worked. Both
 * land in the same review-gated `house_rules` substrate, so an approved rule
 * reaches every future agent's system prompt at the chokepoint. Never auto-
 * applied: self-improvement as a reviewable, auditable artifact, never silent
 * drift.
 *
 * This module is deliberately pure (no db, no AI, no Date.now via injected
 * clock) so the numbering, parsing, and truncation edges get a bun test. The DB
 * read, the untrusted-corpus screen, and the model call live in the tick route
 * (`src/routes/api/public/hooks/retro-tick.ts`), mirroring RF-04's shape.
 */

export const RETRO_LOOKBACK_DAYS = 7;
export const RETRO_MIN_RUNS_TO_CLUSTER = 4;
export const RETRO_MAX_RUNS_PER_PASS = 60;
export const RETRO_MAX_RULES_PER_PASS = 3;
export const RETRO_SNIPPET_CHARS = 320;

/**
 * One agent-execution trace, already screened for injection. `agent`, `status`,
 * and `failure` are trusted system fields (registry slug + enums); `snippet` is
 * the neutralized free-text (input/output/halted reason) that has passed through
 * quarantineUntrustedCorpus before reaching here.
 */
export type ScreenedRun = {
  agent: string;
  status: string;
  failure: string | null;
  snippet: string;
};

export type RetroDraft = { rule_text: string; rationale: string; source_indices: number[] };

export const RETRO_SYSTEM_PROMPT = `You are an engineering-operations retro steward. You are given a workspace's recent AGENT EXECUTION TRACES from the past week. Each line is one step an autonomous agent ran, with its status and any failure or halt reason, plus a short excerpt of what it was working on. Find real RECURRING OPERATIONAL PATTERNS across two or more traces (an agent that repeatedly halts on the same kind of task, a failure mode that recurs, a step that consistently burns effort) and draft short STANDING OPERATING RULES that would prevent the problem, or repeat what worked, on every future mission.

Good rule examples: "the build agent halts on auth-touching tasks without a credentials check first, so add that check to its plan step", "code review consistently misses migration safety, so always run the migration linter before a merge".

Rules:
- Only draft a rule when at least 2 traces genuinely support the same pattern. Never draft a rule from a single trace.
- Each rule is one sentence, plain language, no markdown, no em dashes.
- Draft at most 3 rules. Fewer, sharper rules beat many vague ones.
- Do NOT restate a rule that is already in the "rules already in force" list you are given.
- source_indices are the 1-based indices (from the numbered trace list) of the traces that support each rule.

Return STRICT JSON only: {"rules":[{"rule_text":"...","rationale":"one line: why this pattern is real","source_indices":[1,3]}]}
If no genuine pattern exists, return {"rules":[]}.`;

/** Truncate free text to a bound, collapsing whitespace so one trace is one line. */
export function snippetOf(raw: string | null | undefined, max = RETRO_SNIPPET_CHARS): string {
  if (!raw) return "";
  const flat = String(raw).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}

/**
 * Render the numbered trace list the model reasons over. Takes already-screened
 * runs, so no untrusted text is introduced here. 1-based indices match the
 * source_indices the model returns.
 */
export function buildRetroDigest(runs: ScreenedRun[]): string {
  return runs
    .map((r, i) => {
      const bits = [`agent=${r.agent || "unknown"}`, `status=${r.status || "unknown"}`];
      if (r.failure) bits.push(`failure=${r.failure}`);
      const snip = r.snippet ? ` :: ${r.snippet}` : "";
      return `[${i + 1}] ${bits.join(" ")}${snip}`;
    })
    .join("\n");
}

/** The "rules already in force" block, so the model never restates a live rule. */
export function buildActiveRulesBlock(rules: string[]): string {
  const cleaned = rules.map((r) => r.trim()).filter((r) => r.length > 0);
  if (cleaned.length === 0) return "Rules already in force: (none yet)";
  return `Rules already in force (do not restate these):\n${cleaned
    .map((r) => `- ${r}`)
    .join("\n")}`;
}

/**
 * Parse the model's strict-JSON draft, keeping only well-formed rules. Mirrors
 * RF-04's parseDraft: a malformed or non-array payload yields [], never a throw.
 */
export function parseRetroDraft(text: string): RetroDraft[] {
  try {
    const parsed = JSON.parse(text) as { rules?: unknown };
    if (!Array.isArray(parsed.rules)) return [];
    return parsed.rules.filter(
      (r): r is RetroDraft =>
        !!r &&
        typeof (r as RetroDraft).rule_text === "string" &&
        (r as RetroDraft).rule_text.trim().length > 0 &&
        Array.isArray((r as RetroDraft).source_indices),
    );
  } catch {
    return [];
  }
}

/** Midnight UTC of the given day, as an ISO string. Used for the per-day guard. */
export function startOfDayUtc(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

/** ISO week label, e.g. "2026-W28". Deterministic, no external dep. */
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
