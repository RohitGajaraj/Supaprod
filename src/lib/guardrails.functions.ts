/**
 * Server functions for the Guardrails UI (/guardrails):
 * - getGuardrailOverview: list rules, recent hits, built-in catalog
 * - upsertGuardrailRule / deleteGuardrailRule / toggleGuardrailRule
 * - seedBuiltInGuardrails: insert a curated starter set
 * - testGuardrailRule: dry-run a rule against sample text
 * - getGuardrailHitCount: RPT-18 — the real, all-time guardrail_hits count (getGuardrailOverview
 *   caps its hits list at 100 rows for the recent-activity table, so it cannot answer "how many
 *   guardrail hits, total" without a dedicated exact count).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { evaluateGuardrails, type GuardrailRule } from "./ai/guardrails.server";
import { GUARDRAIL_FLOOR } from "@/lib/ai/guardrail-floor";
import { getUserWorkspaceRole, writeDeniedReason, type Role } from "./roles.functions";

const BUILTIN_SEED = [
  {
    name: "Email address",
    kind: "pii",
    pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
    action: "redact",
    applies_to: "both",
  },
  {
    name: "Phone number",
    kind: "pii",
    // The lookarounds keep hex ids and UUID fragments from reading as phone
    // numbers - the same fix the floor rule took when the PII redactor was
    // shredding UUIDs (17b75df9a); the seed had been left on the old pattern.
    pattern: "(?<![0-9A-Fa-f-])\\+?\\d[\\d\\s().-]{7,}\\d(?![0-9A-Fa-f-])",
    action: "redact",
    applies_to: "both",
  },
  {
    name: "Credit card",
    kind: "pii",
    pattern: "\\b(?:\\d[ -]*?){13,16}\\b",
    action: "redact",
    applies_to: "both",
  },
  {
    name: "OpenAI API key",
    kind: "secret",
    pattern: "sk-[A-Za-z0-9]{20,}",
    action: "block",
    applies_to: "both",
  },
  {
    name: "AWS access key",
    kind: "secret",
    pattern: "AKIA[0-9A-Z]{16}",
    action: "block",
    applies_to: "both",
  },
  {
    name: "GitHub token",
    kind: "secret",
    pattern: "gh[pousr]_[A-Za-z0-9]{30,}",
    action: "block",
    applies_to: "both",
  },
  {
    name: "Ignore instructions",
    kind: "injection",
    pattern: "ignore (all|previous|above) instructions",
    action: "warn",
    applies_to: "input",
  },
  {
    name: "System prompt leak",
    kind: "injection",
    pattern: "reveal (the )?(your )?(system )?prompt",
    action: "warn",
    applies_to: "input",
  },
  {
    name: "Profanity (mild)",
    kind: "keyword",
    pattern: "fuck",
    action: "redact",
    applies_to: "output",
  },
] as const;

export const getGuardrailOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    // WORKSPACE, NOT USER. Both halves of this used to filter by user_id, which is
    // how the Safety room came to read "0 guardrails on - 7 incidents" with the
    // blocks listed underneath: the viewer owned none of the rules that had been
    // screening the workspace. Rules and hits are now read through the same lens,
    // so the two numbers describe the same thing. RLS is membership-keyed after
    // migration 20260803191000, so the select needs no explicit filter and cannot
    // be widened by a caller.
    const [rulesRes, hitsRes] = await Promise.all([
      supabase.from("guardrail_rules").select("*").order("created_at", { ascending: false }),
      supabase
        .from("guardrail_hits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      rules: rulesRes.data ?? [],
      hits: hitsRes.data ?? [],
      builtins: BUILTIN_SEED,
      /**
       * The rules that screen this workspace whether or not it configured any.
       * Surfaced so the Safety room can stop saying "Nothing checks your AI calls
       * yet" to a workspace whose calls are, in fact, being checked. A count of
       * zero CONFIGURED rules is now a true and unalarming statement, because the
       * floor is reported beside it.
       */
      floor: GUARDRAIL_FLOOR.map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind,
        action: r.action,
      })),
    };
  });

/**
 * PURE, and the only place this file decides what to say about a refused write.
 * A guardrail rule is the `guardrail_rules` governed surface, so the answer is
 * writeDeniedReason's, and null means the role may write.
 *
 * THE DEFECT THIS EXISTS TO PREVENT: RLS refuses an UPDATE or a DELETE by
 * matching zero rows, not by raising. Migration 20260805130000 narrowed every
 * guardrail write to owner or admin, so from that migration onward a viewer or
 * a member pressing Save on /guardrails would have got ok:true back having
 * changed nothing at all. A control that silently does nothing is the exact
 * failure this codebase has spent the day removing. The INSERT half is no
 * kinder unaided: a WITH CHECK violation does raise, but it raises "new row
 * violates row-level security policy", which names the mechanism at a person
 * who only wanted to know they are not allowed.
 */
export function guardrailWriteDenial(role: Role | null | undefined): string | null {
  return writeDeniedReason(role, "guardrail_rules");
}

/** Said when the rule is not there to begin with. Distinct from "not allowed". */
const RULE_IS_GONE = "That guardrail rule is no longer here, so nothing changed.";

/**
 * Said when the write RAN and the database returned no row.
 *
 * We genuinely cannot tell a policy refusal apart from a row someone else
 * removed a moment earlier: both come back as zero rows and PostgREST does not
 * say which. So this states the uncertainty instead of picking one, and the
 * call sites throw it rather than returning ok:true for a write they cannot
 * vouch for.
 */
function unconfirmedWrite(what: string): string {
  return `We could not confirm ${what}. Reload the page and check this rule before relying on it.`;
}

/**
 * The narrow escape hatch used to reach `guardrail_rules.workspace_id` and the
 * current_user_default_workspace() RPC.
 *
 * Both are LIVE, verified against the database on 2026-08-05: the column landed
 * in migration 20260803191000. What is stale is
 * src/integrations/supabase/types.ts, which has not been regenerated since, so
 * tsc cannot see a column that really is there. Typed this narrowly rather than
 * as `any` so the escape hatch stays exactly two calls wide and disappears the
 * day the types are regenerated.
 */
type StaleTypedReads = {
  from: (table: "guardrail_rules") => {
    select: (columns: "workspace_id") => {
      eq: (
        column: "id",
        value: string,
      ) => { maybeSingle: () => Promise<{ data: { workspace_id: string } | null }> };
    };
  };
  rpc: (fn: "current_user_default_workspace") => Promise<{ data: string | null }>;
};

/**
 * The workspace a guardrail rule belongs to, or null when the caller cannot see
 * the rule at all (the SELECT policy is membership-keyed).
 */
async function guardrailRuleWorkspace(
  supabase: SupabaseClient<Database>,
  ruleId: string,
): Promise<string | null> {
  const { data } = await (supabase as unknown as StaleTypedReads)
    .from("guardrail_rules")
    .select("workspace_id")
    .eq("id", ruleId)
    .maybeSingle();
  return data?.workspace_id ?? null;
}

/**
 * The workspace a NEW rule will land in. guardrail_rules.workspace_id defaults
 * to current_user_default_workspace(), so asking the same function the column
 * default asks is how the permission check and the insert stay talking about
 * the same workspace.
 */
async function defaultGuardrailWorkspace(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const { data } = await (supabase as unknown as StaleTypedReads).rpc(
    "current_user_default_workspace",
  );
  return data ?? null;
}

/**
 * Refuse a guardrail write BEFORE attempting it, in a sentence a person can act
 * on. Mirrors can_manage_workspace() exactly (owner or admin, read off
 * workspace_members), because the database is the enforcement and a check that
 * disagreed with it would be worse than none.
 */
async function assertCanWriteGuardrails(
  supabase: SupabaseClient<Database>,
  userId: string,
  workspaceId: string | null,
): Promise<void> {
  if (!workspaceId) {
    throw new Error(
      "We could not tell which workspace this guardrail belongs to, so nothing was changed.",
    );
  }
  const role = await getUserWorkspaceRole(supabase, workspaceId, userId);
  const denial = guardrailWriteDenial(role);
  if (denial) throw new Error(denial);
}

const RuleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  kind: z.enum(["regex", "keyword", "pii", "injection", "secret"]),
  pattern: z.string().min(1).max(1000),
  action: z.enum(["block", "warn", "redact"]),
  applies_to: z.enum(["input", "output", "both"]),
  enabled: z.boolean(),
});

export const upsertGuardrailRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof RuleSchema>) => RuleSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const workspaceId = await guardrailRuleWorkspace(supabase, data.id);
      if (!workspaceId) throw new Error(RULE_IS_GONE);
      await assertCanWriteGuardrails(supabase, userId, workspaceId);
      // .select() is load-bearing, not decoration: without it a refused update
      // and a saved update are the same empty response, and this handler used
      // to return ok:true for both.
      const { data: updated, error } = await supabase
        .from("guardrail_rules")
        .update({
          name: data.name,
          kind: data.kind,
          pattern: data.pattern,
          action: data.action,
          applies_to: data.applies_to,
          enabled: data.enabled,
        })
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error(unconfirmedWrite("that your edit saved"));
      return { ok: true, id: data.id };
    }
    await assertCanWriteGuardrails(supabase, userId, await defaultGuardrailWorkspace(supabase));
    const { data: ins, error } = await supabase
      .from("guardrail_rules")
      .insert({
        user_id: userId,
        name: data.name,
        kind: data.kind,
        pattern: data.pattern,
        action: data.action,
        applies_to: data.applies_to,
        enabled: data.enabled,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: (ins as { id: string }).id };
  });

export const deleteGuardrailRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const workspaceId = await guardrailRuleWorkspace(supabase, data.id);
    if (!workspaceId) throw new Error(RULE_IS_GONE);
    await assertCanWriteGuardrails(supabase, userId, workspaceId);
    const { data: deleted, error } = await supabase
      .from("guardrail_rules")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deleted) throw new Error(unconfirmedWrite("that the rule was deleted"));
    return { ok: true };
  });

export const toggleGuardrailRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; enabled: boolean }) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const workspaceId = await guardrailRuleWorkspace(supabase, data.id);
    if (!workspaceId) throw new Error(RULE_IS_GONE);
    await assertCanWriteGuardrails(supabase, userId, workspaceId);
    const { data: toggled, error } = await supabase
      .from("guardrail_rules")
      .update({ enabled: data.enabled })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!toggled) throw new Error(unconfirmedWrite("that the switch saved"));
    return { ok: true };
  });

export const seedBuiltInGuardrails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Seeding is nine INSERTs, so it is gated on the same role as any other
    // guardrail write. Checked before the read so a read-only role is told it
    // cannot seed, rather than watching the button do nothing.
    await assertCanWriteGuardrails(supabase, userId, await defaultGuardrailWorkspace(supabase));
    const { data: existing } = await supabase
      .from("guardrail_rules")
      .select("name")
      .eq("built_in", true);
    const have = new Set((existing ?? []).map((r) => r.name));
    const toInsert = BUILTIN_SEED.filter((r) => !have.has(r.name)).map((r) => ({
      user_id: userId,
      built_in: true,
      enabled: true,
      ...r,
    }));
    if (toInsert.length === 0) return { ok: true, inserted: 0 };
    const { error } = await supabase.from("guardrail_rules").insert(toInsert);
    if (error) throw new Error(error.message);
    return { ok: true, inserted: toInsert.length };
  });

const TestSchema = z.object({
  text: z.string().min(1).max(5000),
  side: z.enum(["input", "output"]),
  rule: z.object({
    name: z.string().min(1),
    kind: z.enum(["regex", "keyword", "pii", "injection", "secret"]),
    pattern: z.string().min(1),
    action: z.enum(["block", "warn", "redact"]),
    applies_to: z.enum(["input", "output", "both"]),
  }),
});

export const testGuardrailRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof TestSchema>) => TestSchema.parse(d))
  .handler(async ({ data }) => {
    const rule: GuardrailRule = {
      id: "test",
      enabled: true,
      ...data.rule,
    };
    const r = evaluateGuardrails(data.text, [rule], data.side);
    return { text: r.text, hits: r.hits, blocked: r.blocked };
  });

/**
 * RPT-18 (Governance): the Engine Room's "live rigor" block needs a real, honest guardrail
 * activity number alongside the eval-run count. `guardrail_hits` rows are only inserted when a
 * rule actually matched (runtime.server.ts), so this is a real "rule fired" count, not an
 * invented "checks executed" figure — exact via `count: "exact", head: true` so it is not capped
 * at the 100-row window getGuardrailOverview keeps for its recent-activity table.
 */
export const getGuardrailHitCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    const { supabase } = context;
    // The last user_id filter on a workspace-scoped table. It is why the Engine
    // room reported 7 incidents for a workspace holding 14: the viewer was shown
    // only the hits recorded under their own session, on a ledger that belongs to
    // the tenant. Membership RLS now scopes it, so the count answers the question
    // the surface is actually asking.
    const { count, error } = await supabase
      .from("guardrail_hits")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

export const __builtin_count = BUILTIN_SEED.length;
