/**
 * JNY-03, the test station. Compiles CNV-02's oracle-classified acceptance clauses
 * (eval / ci / uat) into a per-mission test plan, and records a passing verdict onto
 * the PRD's linked decision (F-DECISIONS-CAPTURE) as an `artifact_lineage` edge, so it
 * surfaces on the Trust Ledger for free (the ledger is a derived read over
 * decisions/agent_approvals/artifact_lineage, never a separate write target).
 *
 * No migration: `artifact_lineage.relation` already accepts arbitrary values (see
 * "supersedes"/"contradicts"/"promoted"), so a new "test_verdict" relation needs no
 * schema change. `missions` carries no `prd_id` column; the real link is
 * `studio_changesets.mission_id -> studio_changesets.prd_id` (already relied on by
 * BYO-P3's outcome.functions.ts), so this resolves the PRD the same way.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ContractClauseSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  status: z.enum(["standing", "superseded"]),
  oracle_kind: z.enum(["eval", "ci", "uat", "unverifiable"]).nullable().optional(),
  oracle_ref: z.string().nullable().optional(),
  uat_checked: z.boolean().optional(),
  uat_checked_at: z.string().nullable().optional(),
});

const SUCCESS_STATUSES = new Set(["done", "completed"]);
const FAILURE_STATUSES = new Set(["failed", "cancelled", "canceled"]);

/** PURE. Whether the mission's own run status satisfies the "ci" oracle clauses. */
export function ciGateStatus(missionStatus: string): "satisfied" | "blocked" | "pending" {
  if (SUCCESS_STATUSES.has(missionStatus)) return "satisfied";
  if (FAILURE_STATUSES.has(missionStatus)) return "blocked";
  return "pending";
}

export type EvalPlanItem = {
  clauseId: string;
  text: string;
  caseId: string;
  result: "pending" | "passed" | "failed";
};
export type CiPlanItem = { clauseId: string; text: string };
export type UatPlanItem = {
  clauseId: string;
  text: string;
  checked: boolean;
  checkedAt: string | null;
};

export type TestPlanVerdict = "passing" | "blocked" | "pending";

/** PURE. The station's overall call: any failed eval or a failed mission gate blocks;
 * an unresolved eval, an unfinished mission, or an unchecked UAT item is pending;
 * only when everything checks out is it passing. */
export function computeVerdict(input: {
  evalItems: EvalPlanItem[];
  ci: CiPlanItem[];
  ciStatus: "satisfied" | "blocked" | "pending";
  uatItems: UatPlanItem[];
}): TestPlanVerdict {
  const evalBlocked = input.evalItems.some((e) => e.result === "failed");
  if (evalBlocked || (input.ci.length > 0 && input.ciStatus === "blocked")) return "blocked";
  const evalPending = input.evalItems.some((e) => e.result === "pending");
  const ciPending = input.ci.length > 0 && input.ciStatus === "pending";
  const uatPending = input.uatItems.some((u) => !u.checked);
  if (evalPending || ciPending || uatPending) return "pending";
  return "passing";
}

export type MissionTestPlan =
  | { available: false; reason: "no_prd" | "not_compiled" }
  | {
      available: true;
      prdId: string;
      prdTitle: string;
      verdict: TestPlanVerdict;
      eval: EvalPlanItem[];
      ci: CiPlanItem[];
      uat: UatPlanItem[];
      alreadyRecorded: boolean;
    };

async function resolveMissionPrdId(
  supabase: SupabaseClient,
  missionId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("studio_changesets")
    .select("prd_id")
    .eq("mission_id", missionId)
    .not("prd_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.prd_id as string | undefined) ?? null;
}

/** Exported for PC-07's verifier pass (verify-green.server.ts): the oracle
 * checklist is ONE evaluator, whether a human reads it on the test station
 * or the verifier consults it before letting a mission complete. */
export async function loadMissionTestPlan(
  supabase: SupabaseClient,
  missionId: string,
): Promise<MissionTestPlan> {
  const [prdId, mission] = await Promise.all([
    resolveMissionPrdId(supabase, missionId),
    supabase.from("missions").select("status").eq("id", missionId).maybeSingle(),
  ]);
  if (!prdId) return { available: false, reason: "no_prd" };

  const { data: prd } = await supabase
    .from("prds")
    .select("id,title,contract")
    .eq("id", prdId)
    .maybeSingle();
  if (!prd) return { available: false, reason: "no_prd" };

  const rawMetrics = (prd.contract as { success_metrics?: unknown } | null)?.success_metrics ?? [];
  const metrics = Array.isArray(rawMetrics)
    ? rawMetrics
        .map((m) => ContractClauseSchema.safeParse(m))
        .filter(
          (r): r is { success: true; data: z.infer<typeof ContractClauseSchema> } => r.success,
        )
        .map((r) => r.data)
    : [];
  const compiled = metrics.filter((c) => c.status === "standing" && c.oracle_kind);
  if (compiled.length === 0) {
    return { available: false, reason: "not_compiled" };
  }

  const evalClauses = compiled.filter((c) => c.oracle_kind === "eval" && c.oracle_ref);
  const ciClauses = compiled.filter((c) => c.oracle_kind === "ci");
  const uatClauses = compiled.filter((c) => c.oracle_kind === "uat");

  let evalItems: EvalPlanItem[] = [];
  if (evalClauses.length > 0) {
    const caseIds = evalClauses.map((c) => c.oracle_ref as string);
    const { data: results } = await supabase
      .from("eval_case_results")
      .select("case_id,passed,created_at")
      .in("case_id", caseIds)
      .order("created_at", { ascending: false });
    const latestByCase = new Map<string, boolean>();
    for (const r of (results ?? []) as { case_id: string; passed: boolean }[]) {
      if (!latestByCase.has(r.case_id)) latestByCase.set(r.case_id, r.passed);
    }
    evalItems = evalClauses.map((c) => {
      const caseId = c.oracle_ref as string;
      const passed = latestByCase.get(caseId);
      return {
        clauseId: c.id,
        text: c.text,
        caseId,
        result: passed === undefined ? "pending" : passed ? "passed" : "failed",
      };
    });
  }

  const ci: CiPlanItem[] = ciClauses.map((c) => ({ clauseId: c.id, text: c.text }));
  const uat: UatPlanItem[] = uatClauses.map((c) => ({
    clauseId: c.id,
    text: c.text,
    checked: !!c.uat_checked,
    checkedAt: c.uat_checked_at ?? null,
  }));

  const missionStatus = (mission.data?.status as string | undefined) ?? "running";
  const ciStatus = ciGateStatus(missionStatus);
  const verdict = computeVerdict({ evalItems, ci, ciStatus, uatItems: uat });

  let alreadyRecorded = false;
  if (verdict === "passing") {
    const { data: decisionRows } = await supabase
      .from("decisions")
      .select("id")
      .eq("prd_id", prdId)
      .order("created_at", { ascending: false })
      .limit(1);
    const decision = decisionRows?.[0] ?? null;
    if (decision) {
      const { count } = await supabase
        .from("artifact_lineage")
        .select("id", { count: "exact", head: true })
        .eq("parent_kind", "mission")
        .eq("parent_id", missionId)
        .eq("child_kind", "decision")
        .eq("child_id", decision.id)
        .eq("relation", "test_verdict");
      alreadyRecorded = (count ?? 0) > 0;
    }
  }

  return {
    available: true,
    prdId,
    prdTitle: (prd.title as string) ?? "Untitled spec",
    verdict,
    eval: evalItems,
    ci,
    uat,
    alreadyRecorded,
  };
}

export const recordTestStationVerdict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as SupabaseClient;
    const userId = context.userId as string;
    const plan = await loadMissionTestPlan(supabase, data.missionId);
    if (!plan.available) return { ok: false as const, reason: plan.reason };
    if (plan.verdict !== "passing") return { ok: false as const, reason: "not_passing" as const };

    const { data: decisionRows } = await supabase
      .from("decisions")
      .select("id")
      .eq("prd_id", plan.prdId)
      .order("created_at", { ascending: false })
      .limit(1);
    const decision = decisionRows?.[0] ?? null;
    if (!decision) return { ok: false as const, reason: "no_decision" as const };

    if (!plan.alreadyRecorded) {
      const summary = `Test station: PASSING. ${plan.eval.length} eval case(s), ${plan.ci.length} CI expectation(s), ${plan.uat.length} UAT item(s) all satisfied.`;
      const { error } = await supabase.from("artifact_lineage").insert({
        user_id: userId,
        parent_kind: "mission",
        parent_id: data.missionId,
        child_kind: "decision",
        child_id: decision.id,
        relation: "test_verdict",
        rationale: summary,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const, decisionId: decision.id as string };
  });
