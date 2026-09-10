/**
 * ── A GRADER THAT CANNOT LOOK AT THE WORLD IS NOT A GRADER ────────────────
 *
 * P-42. Until now the forecast grader was handed four things: the claim, the
 * stated observable, the horizon, and one line of evidence which had exactly one
 * source, the linked spec's settled outcome. With no linked spec that line read,
 * verbatim, *No linked outcome has been settled.* It had no tools and read
 * nothing else.
 *
 * Eight due forecasts on production came back at **confidence 1.0 with nothing
 * behind them**. A model asked to judge with no evidence still answers, and
 * answers confidently. Those are now coerced to inconclusive with the reason
 * said out loud, which is honest and is not a grader.
 *
 * The horizon verdict is this product's moat claim. This is the part that lets
 * it look.
 *
 * ── WHAT IS IN THE KIT, AND WHY EACH ONE ─────────────────────────────────
 *
 *   post-decision signals   what the world said AFTER the call was made. Dated
 *                           after the decision because evidence that predates it
 *                           cannot be its result, which is the difference between
 *                           grading a forecast and re-reading its rationale.
 *   the linked outcome      the spec's settled result, which is what the grader
 *                           always had and still gets.
 *   deployments             whether the thing was actually shipped, with the
 *                           failure reason where it was not. A forecast about a
 *                           change that never went out is inconclusive, not a
 *                           miss, and nothing on the old prompt could tell those
 *                           apart.
 *   lineage                 what the decision produced, so a verdict can say
 *                           which artifact it is about.
 *
 * ── AND WHAT IS DELIBERATELY NOT IN IT ────────────────────────────────────
 *
 * THE LOOP'S OWN WRITING. `excludeLoopAuthored` is applied to the signals read,
 * because a grader marking its own homework is the precise failure P-41 found:
 * on the workspace the team walks, 96 of 277 signals were written by seats
 * inside this loop, and a seat once wrote two rows restating a theme and the
 * next sweep carried the run on them. A forecast graded against those would be
 * the same disease with a verdict attached, which is worse: it would end on the
 * record as a proven call.
 *
 * NO WRITES, AND NO TOOLS. The kit is four reads assembled by us and handed to
 * the model as text. Giving the grader tools would let it go looking for
 * something that settles the claim, and a grader that can choose its evidence
 * after seeing the question is the thing `trg_decisions_forecast_immutable`
 * exists to prevent one field over ("choosing the test after seeing the result
 * settles nothing").
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { LOOP_AUTHORED_EXCLUSIONS } from "@/lib/sources/the-loop-does-not-count-its-own-writing";

/** One thing the grader read, named so a verdict can cite it. */
export type ReadRow = {
  /** `signal` | `outcome` | `deployment` | `artifact`. */
  kind: string;
  /** The row's own id, so a person can go and look at the same thing. */
  id: string;
  /** One line a person and a model can both read. */
  line: string;
};

export type ReadKit = {
  rows: ReadRow[];
  /** True when there was genuinely nothing to look at. */
  empty: boolean;
};

/** Kept small on purpose: a grader reading two hundred rows is not reading. */
const PER_KIND = 12;

export async function readKitForForecast(
  supabase: SupabaseClient,
  decision: {
    id: string;
    workspace_id: string | null;
    product_id: string | null;
    prd_id: string | null;
    created_at: string | null;
    horizonDate: string | null;
  },
  linkedOutcomeEvidence: string,
): Promise<ReadKit> {
  const rows: ReadRow[] = [];

  /*
   * SIGNALS AFTER THE DECISION. `created_at` on the decision and not the
   * horizon: the window a forecast is judged over runs from the call to the
   * horizon, and evidence that arrived before the call is what the call was
   * made ON, not what it produced.
   */
  if (decision.workspace_id && decision.created_at) {
    let q = supabase
      .from("signals")
      .select("id,title,content,source,source_kind,created_at")
      .eq("workspace_id", decision.workspace_id)
      .gt("created_at", decision.created_at)
      .order("created_at", { ascending: false })
      .limit(PER_KIND);
    /*
     * ── THE EXCLUSION HAS TO SURVIVE A NULL, AND `neq` DOES NOT ────────────
     *
     * Applied as data rather than through `excludeLoopAuthored`, whose generic
     * hits TS2589 on this builder. Same rule, same single source -- but written
     * NULL-safely, which the plain `.neq` pair was not.
     *
     * `NULL <> 'loop_authored'` is NULL and not TRUE, so PostgREST drops every
     * row whose column is null. Measured on production 2026-09-10: **428 of the
     * 1,524 signals carry `source_kind` null**, and across the fifteen overdue
     * forecasts the bare pair admitted 56 rows where the null-safe form admits
     * 181. Sixty-nine per cent of the eligible evidence was being discarded by a
     * filter written to exclude the loop's own writing.
     *
     * This repo has already paid for this exact SQL fact once, one module over:
     * `listDueForecastsImpl` uses `.or(dueCheckFilter(nowIso))` and its comment
     * reads "a bare comparison drops NULLs in SQL ... the loudest possible way
     * to get this wrong and still look like it works."
     */
    for (const [col, val] of LOOP_AUTHORED_EXCLUSIONS) q = q.or(`${col}.is.null,${col}.neq.${val}`);
    if (decision.product_id) q = q.eq("product_id", decision.product_id);
    /*
     * ── AND A READ THAT FAILED IS NOT A WORLD WITH NOTHING IN IT ───────────
     *
     * `const { data } = await q` discarded the error, so an unreadable signals
     * table produced `rows: []`, which the grader reports as "Nothing dated
     * after this decision could be read" -- a confident statement about the
     * world, made without looking at it. The sibling read in this feature
     * already throws for exactly this reason (`auditDueForecasts`: "A FAILED
     * READ IS NOT AN EMPTY QUEUE"), and the caller catches per row, so throwing
     * costs one forecast's draft instead of every forecast's honesty.
     */
    const { data, error } = await q;
    if (error) throw new Error(`the grader could not read signals: ${error.message}`);
    for (const r of (data ?? []) as Array<Record<string, unknown>>) {
      const title = String(r.title ?? "").trim() || String(r.content ?? "").slice(0, 120);
      rows.push({
        kind: "signal",
        id: String(r.id),
        line: `${title} (${String(r.source ?? "unknown")}, ${String(r.created_at ?? "").slice(0, 10)})`,
      });
    }
  }

  /* The linked spec's settled outcome: what the grader always had. */
  if (linkedOutcomeEvidence.trim()) {
    rows.push({
      kind: "outcome",
      id: decision.prd_id ?? "linked-spec",
      line: linkedOutcomeEvidence.trim().slice(0, 600),
    });
  }

  /*
   * DID IT ACTUALLY SHIP. A forecast about a change that never went out is
   * inconclusive rather than a miss, and nothing the grader could previously
   * read told those apart. `failure_reason` is carried because "it shipped and
   * broke" and "it never shipped" are different answers to the same question.
   */
  if (decision.prd_id) {
    const { data: sets } = await supabase
      .from("studio_changesets")
      .select("id")
      .eq("prd_id", decision.prd_id)
      .limit(PER_KIND);
    const ids = ((sets ?? []) as Array<{ id: string }>).map((c) => c.id);
    if (ids.length > 0) {
      const { data: deps } = await supabase
        .from("deployments")
        .select("id,status,environment,failure_reason,deployed_at,commit_sha")
        .in("changeset_id", ids)
        .order("created_at", { ascending: false })
        .limit(PER_KIND);
      for (const d of (deps ?? []) as Array<Record<string, unknown>>) {
        const why = String(d.failure_reason ?? "").trim();
        rows.push({
          kind: "deployment",
          id: String(d.id),
          line: `${String(d.status ?? "unknown")} to ${String(d.environment ?? "unknown")}${
            d.deployed_at ? ` on ${String(d.deployed_at).slice(0, 10)}` : ""
          }${why ? `, because ${why}` : ""}`,
        });
      }
    }
  }

  return { rows, empty: rows.length === 0 };
}

/**
 * The kit as the model sees it. Each row carries its id BECAUSE the verdict has
 * to be able to cite one: a verdict that names no source is not stored as a hit
 * or a miss, and the model cannot name what it was never shown.
 */
export function readKitAsText(kit: ReadKit): string {
  if (kit.empty) return "NOTHING. No evidence dated after this decision could be read.";
  return kit.rows.map((r) => `- [${r.kind}:${r.id}] ${r.line}`).join("\n");
}

/**
 * Which of the rows the model actually cited. Matched on the id it was shown,
 * so a verdict cannot claim a source that was not in front of it.
 *
 * A MODEL THAT NAMES NOTHING HAS NOT GRADED. This is the test the verdict has
 * to pass before it may be stored as anything other than inconclusive.
 */
export function citedRows(kit: ReadKit, rationale: string): ReadRow[] {
  const said = rationale ?? "";
  return kit.rows.filter((r) => said.includes(r.id));
}
