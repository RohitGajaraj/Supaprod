/**
 * Bundle 9 Slice 1 — Build Console server fns.
 *
 * `listBuilderRuns` is a read-only view over agent_runs WHERE
 * agent_slug='builder' joined to the github.pr.open tool_call result (PR url,
 * number, branch, path) and any pending agent_approvals for that run.
 *
 * TWO CLAIMS IN THIS HEADER WERE FALSE AND ARE CORRECTED RATHER THAN DELETED.
 *
 * It said this "feeds the /build page". It does not: `listBuilderRuns`,
 * `listBuilderClaims` and `releaseBuilderClaim` have no caller anywhere in
 * `src/` — /build imports `listBuildWork` and `canDispatchToRepo` instead
 * (routes/_authenticated.build.index.tsx). They are written, exported and
 * unmounted, and the file-claim error message in the tool registry still tells
 * people to "release the claim from /build", a control that page does not have.
 * Not fixed here: mounting them is a /build change and /build is not this file.
 *
 * And the github.pr.open join is now doubly dead. As of 2026-08-06 the work
 * order this file dispatches names studio.stage → studio.commit →
 * studio.pr.open (see `assembleBuilderGoal`), so a Build Console run will not
 * produce a github.pr.open tool_call for this query to find. What DOES carry
 * the PR is `studio_changesets`, keyed on mission_id, which is what every
 * mounted reader in the product already uses.
 *
 * What this file is actually FOR today is `dispatchBuilderMission` below: the
 * Build Console's one door from an approved spec to a running build.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { createMission } from "@/lib/ai/handoff.server";
import { buildArdDocument, parseArdDocument, type ArdDesignSection } from "@/lib/ard-schema";
import {
  designGateBlocksDispatch,
  toArdDesignSection,
  DESIGN_GATE_BLOCK_MESSAGE,
} from "@/lib/build/design-gate";
import { loadDesignGateState, loadDesignDispatchContext } from "@/lib/build/design-gate.server";
import { recordLineage } from "@/lib/lineage.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import { formatArdWorkOrderBlock, standingClauseTexts } from "@/lib/build/ard-block";
import { nativeBuildDriver } from "@/lib/build/native.server";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
/**
 * ONE DESIGN FOLD, NOT TWO. `formatDesignDispatchSections` is the Studio
 * dispatch's own function and it is imported rather than reimplemented here on
 * purpose: the defect this file carried was precisely that the two dispatch
 * paths disagreed about what a builder is handed, and a second local copy of
 * the fold would be the same defect with an extra place to drift.
 */
import { formatDesignDispatchSections } from "@/lib/studio.functions";

export type BuilderRun = {
  run_id: string;
  mission_id: string | null;
  mission_title: string | null;
  goal: string;
  status: string;
  created_at: string;
  last_checkpoint_at: string | null;
  pr: { number: number; url: string; branch: string; path: string } | null;
  pending_approvals: number;
  ci: {
    overall: "pending" | "success" | "failure" | "neutral";
    updated_at: string;
    head_sha: string;
    failing: { name: string; html_url: string; summary: string | null } | null;
  } | null;
};

export type BuilderClaim = {
  id: string;
  repo: string;
  path: string;
  status: "held" | "released";
  claimed_at: string;
  released_at: string | null;
  released_reason: string | null;
  run_id: string | null;
  mission_id: string | null;
  mission_title: string | null;
  is_mine: boolean;
};

export const listBuilderClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ claims: BuilderClaim[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("builder_file_claims")
      .select(
        "id,repo,path,status,claimed_at,released_at,released_reason,run_id,mission_id,mission_title,user_id",
      )
      .eq("status", "held")
      .order("claimed_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<BuilderClaim & { user_id: string }>;
    return {
      claims: rows.map((r) => ({
        id: r.id,
        repo: r.repo,
        path: r.path,
        status: r.status,
        claimed_at: r.claimed_at,
        released_at: r.released_at,
        released_reason: r.released_reason,
        run_id: r.run_id,
        mission_id: r.mission_id,
        mission_title: r.mission_title,
        is_mine: r.user_id === userId,
      })),
    };
  });

export const releaseBuilderClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ claim_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: updated, error } = await supabase
      .from("builder_file_claims")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
        released_reason: "operator_release",
      })
      .eq("id", data.claim_id)
      .eq("status", "held")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated)
      throw new Error("Claim not found or already released (you may only release claims you own).");
    return { ok: true as const };
  });

export const listBuilderRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ runs: BuilderRun[] }> => {
    const { supabase, userId } = context;

    const { data: runs, error } = await supabase
      .from("agent_runs")
      .select("id,mission_id,input,status,created_at,last_checkpoint_at")
      .eq("user_id", userId)
      .eq("agent_slug", "builder")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const rows = (runs ?? []) as {
      id: string;
      mission_id: string | null;
      input: string;
      status: string;
      created_at: string;
      last_checkpoint_at: string | null;
    }[];
    if (rows.length === 0) return { runs: [] };

    const missionIds = [...new Set(rows.map((r) => r.mission_id).filter((m): m is string => !!m))];
    const { data: missions } = missionIds.length
      ? await supabase.from("missions").select("id,title").in("id", missionIds)
      : { data: [] as { id: string; title: string }[] };
    const titleByMission = new Map<string, string>(
      (missions ?? []).map((m) => [m.id as string, m.title as string]),
    );

    // Pull github.pr.open results for these runs via trace_id (joined through latest checkpoint).
    const runIds = rows.map((r) => r.id);
    const { data: cps } = await supabase
      .from("agent_run_checkpoints")
      .select("run_id,state,step_index")
      .in("run_id", runIds)
      .order("step_index", { ascending: false });
    const traceByRun = new Map<string, string>();
    for (const cp of (cps ?? []) as {
      run_id: string;
      state: Record<string, unknown>;
      step_index: number;
    }[]) {
      if (traceByRun.has(cp.run_id)) continue;
      const t = (cp.state as { traceId?: string }).traceId;
      if (typeof t === "string" && t.length > 0) traceByRun.set(cp.run_id, t);
    }
    const traceIds = [...traceByRun.values()];
    const { data: tcs } = traceIds.length
      ? await supabase
          .from("tool_calls")
          .select("trace_id,tool_name,result,ok,created_at")
          .in("trace_id", traceIds)
          .in("tool_name", ["github.pr.open", "github.ci.read"])
          .order("created_at", { ascending: true })
      : {
          data: [] as {
            trace_id: string;
            tool_name: string;
            result: unknown;
            ok: boolean;
            created_at: string;
          }[],
        };
    const prByTrace = new Map<
      string,
      { number: number; url: string; branch: string; path: string }
    >();
    type CiResult = {
      overall: "pending" | "success" | "failure" | "neutral";
      updated_at: string;
      head_sha: string;
      checks?: Array<{
        name: string;
        conclusion: string | null;
        status: string;
        html_url: string;
        summary: string | null;
      }>;
    };
    const ciByTrace = new Map<string, CiResult>();
    for (const t of (tcs ?? []) as {
      trace_id: string;
      tool_name: string;
      result: Record<string, unknown> | null;
      ok: boolean;
      created_at: string;
    }[]) {
      if (!t.ok || !t.result) continue;
      if (t.tool_name === "github.pr.open") {
        const r = t.result as { number?: number; url?: string; branch?: string; path?: string };
        if (
          typeof r.number === "number" &&
          typeof r.url === "string" &&
          typeof r.branch === "string" &&
          typeof r.path === "string"
        ) {
          prByTrace.set(t.trace_id, {
            number: r.number,
            url: r.url,
            branch: r.branch,
            path: r.path,
          });
        }
      } else if (t.tool_name === "github.ci.read") {
        const r = t.result as CiResult;
        // Keep the latest read (loop ascends by created_at).
        if (r && typeof r.overall === "string" && typeof r.head_sha === "string") {
          ciByTrace.set(t.trace_id, r);
        }
      }
    }

    // Count pending approvals per run via trace_id (agent_approvals has no run_id column).
    const pendingByRun = new Map<string, number>();
    if (traceIds.length) {
      const { data: apps } = await supabase
        .from("agent_approvals")
        .select("id,trace_id,status")
        .in("trace_id", traceIds)
        .eq("status", "pending");
      const runByTrace = new Map<string, string>();
      for (const [runId, traceId] of traceByRun.entries()) runByTrace.set(traceId, runId);
      for (const a of (apps ?? []) as { trace_id: string | null }[]) {
        if (!a.trace_id) continue;
        const runId = runByTrace.get(a.trace_id);
        if (!runId) continue;
        pendingByRun.set(runId, (pendingByRun.get(runId) ?? 0) + 1);
      }
    }

    return {
      runs: rows.map((r) => {
        const trace = traceByRun.get(r.id);
        const ciRaw = trace ? (ciByTrace.get(trace) ?? null) : null;
        const failing =
          ciRaw?.overall === "failure"
            ? (ciRaw.checks?.find(
                (c) =>
                  c.conclusion === "failure" ||
                  c.conclusion === "timed_out" ||
                  c.conclusion === "action_required" ||
                  c.conclusion === "cancelled",
              ) ?? null)
            : null;
        return {
          run_id: r.id,
          mission_id: r.mission_id,
          mission_title: r.mission_id ? (titleByMission.get(r.mission_id) ?? null) : null,
          goal: r.input,
          status: r.status,
          created_at: r.created_at,
          last_checkpoint_at: r.last_checkpoint_at,
          pr: trace ? (prByTrace.get(trace) ?? null) : null,
          pending_approvals: pendingByRun.get(r.id) ?? 0,
          ci: ciRaw
            ? {
                overall: ciRaw.overall,
                updated_at: ciRaw.updated_at,
                head_sha: ciRaw.head_sha,
                failing: failing
                  ? { name: failing.name, html_url: failing.html_url, summary: failing.summary }
                  : null,
              }
            : null,
        };
      }),
    };
  });

/** The slice of a PRD row the pure dispatch assembly below needs. */
type DispatchPrd = { id: string; title: string; contract?: unknown };

/**
 * PURE (tested in build/dispatch-parity.test.ts). Mission 3.3 dispatch
 * parity: the ARD rider for a Build Console dispatch, the exact fold
 * dispatchStudioSession applies. When the linked spec carries a compiled
 * Outcome Contract, its machine-readable ARD document becomes a delimited
 * fenced work-order block and the standing success-metric clauses become the
 * acceptance criteria. Returns null when there is no usable contract.
 */
export function ardDispatchBlock(
  prd: DispatchPrd | null,
  // Mission 3.4: the design station's structured section rides the ARD.
  design?: ArdDesignSection | null,
): { block: string; acceptanceCriteria: string[] | null } | null {
  if (!prd?.contract) return null;
  const parsed = parseArdDocument(prd.contract);
  if (!parsed.ok || !parsed.contract.intent.trim()) return null;
  // Origin "" keeps schema_url an app-relative path (/api/public/ard/schema):
  // a server fn has no request origin at hand, and a fabricated host would
  // be dishonest data.
  const ard = buildArdDocument("", prd.id, prd.title, parsed.contract, undefined, design);
  const criteria = standingClauseTexts(parsed.contract.success_metrics);
  return {
    block: formatArdWorkOrderBlock(ard),
    acceptanceCriteria: criteria.length ? criteria : null,
  };
}

/**
 * PURE (tested in build/dispatch-parity.test.ts). Assemble the Builder work
 * order the Build Console dispatches. This path hands the goal straight to
 * the agent loop, so the work-order text IS the whole payload: the design
 * station's sections, the ARD block and its acceptance criteria all travel
 * inside it, after the prose, exactly like the Studio dispatch path.
 *
 * THE WORK ORDER NAMES THE TOOLS THE BUILDER ACTUALLY HAS AN OPERATING LOOP
 * FOR. It read: "ship a single-file scoped PR via github.pr.open with
 * idempotency_key". Two things were wrong with that sentence at once.
 *
 * First, `github.pr.open` writes NO `studio_changesets` row -- it calls the
 * GitHub REST API and stops -- and every reader in this product is keyed on
 * `studio_changesets.mission_id`: the run page's changeset, diff and PR link,
 * the seven-stage strip, the /build work list, design parity, and the ship
 * stamp. An obedient agent therefore opened a real pull request that Supaprod
 * could not see, under a run page still reading "Pull request: not opened yet".
 *
 * Second, it contradicted the agent's own instructions. Verified against the
 * live roster on 2026-08-06: all 16 `builder` agents' system prompts name
 * `studio.stage` and `studio.pr.open`, and NOT ONE mentions `github.pr.open`.
 * So there was no branch where both halves were right -- obey the work order
 * and the product goes blind, obey the prompt and the "Closes #N via
 * github.pr.open" wiring is simply ignored.
 *
 * `studio.pr.open` takes `{title, body}` and has no idempotency argument, so
 * the "Closes #N" instruction moves into the PR body where GitHub reads it
 * anyway. Re-opening is already idempotent a level down: `studio.pr.open`
 * returns the cached `{pr_number, pr_url}` when the changeset already has one.
 */
export function assembleBuilderGoal(input: {
  issueNumber: number;
  intent: string;
  prd: DispatchPrd | null;
  ard: ReturnType<typeof ardDispatchBlock>;
  /** The design station's own sections (standing design language, the spec's
   *  flow, the mockup in its own html fence), already formatted by
   *  `formatDesignDispatchSections`. Empty when the spec has no design. */
  designSections?: string[];
  referenceLinks?: string[];
}): string {
  const sections: string[] = [
    `Pick up GitHub issue #${input.issueNumber} on the connected repo. Read the issue body, then build it as this mission's Studio changeset: studio.stage the files, studio.commit them to the mission's studio/* branch, then studio.pr.open. Put "Closes #${input.issueNumber}" in the PR body so merging the pull request closes the issue.`,
    `\nUser intent:\n${input.intent}`,
  ];
  if (input.prd)
    sections.push(
      `\nLinked spec: "${input.prd.title}" (id ${input.prd.id}). Use it as the source of truth for scope.`,
    );
  /**
   * THE DESIGN SECTIONS RIDE UNCONDITIONALLY, AND THAT IS THE WHOLE FIX.
   *
   * They used to reach the agent only inside the ARD's `design` key, and
   * `ardDispatchBlock` returns null before it ever looks at `design` when the
   * spec has no compiled Outcome Contract. Re-measured 2026-08-06: 41 of the 42
   * specs with status='approved' -- the rows the Build Console offers -- carry
   * `contract = '{}'`, so the ARD is null for all but one of them and the design
   * station's entire output was loaded, formatted and thrown away on every
   * dispatch but that one. (This read "all 41" when it was written earlier the
   * same day. One spec has been given a compiled contract since, which moves the
   * figure and not the argument.)
   * The builder's own system prompt tells it to read the mockup and to "never
   * invent a screen when an approved one was handed to you"; it was handed none,
   * took its documented no-design fallback, and built past the drawing a human
   * had just approved.
   *
   * Placed before the ARD block for the same reason `dispatchStudioSession`
   * places it there (studio.functions.ts:296-300): the design is context the
   * contract is then graded against, so the reader meets it first.
   */
  if (input.designSections?.length) {
    for (const section of input.designSections) sections.push(`\n${section}`);
  }
  if (input.ard) {
    sections.push(`\n${input.ard.block}`);
    if (input.ard.acceptanceCriteria) {
      sections.push(
        `\nAcceptance criteria (every one must hold):\n${input.ard.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`,
      );
    }
  }
  if (input.referenceLinks?.length) {
    sections.push(`\nReferences:\n${input.referenceLinks.map((u) => `- ${u}`).join("\n")}`);
  }
  return sections.join("\n");
}

/**
 * Dispatch a Builder mission from the Build Console with free-form input.
 *
 * Three ways to resolve the GitHub issue the Builder closes:
 *   1. prdId given + that PRD has github_issue_url → reuse it.
 *   2. explicit issueNumber → use it.
 *   3. autoCreateIssue=true → open a fresh issue from the goal (+ optional
 *      PRD body and reference links appended as context).
 *
 * THE BUILDER'S TOOL CONTRACT CHANGED HERE, 2026-08-06. This said "unchanged:
 * it still calls github.pr.open with the same allow-list and per-issue
 * idempotency key". The work order now names studio.stage → studio.commit →
 * studio.pr.open instead, which is what the builder's own system prompt has
 * always told it to use and the only path that writes a `studio_changesets`
 * row for the product to read the PR back out of. Both tools remain in the
 * registry and neither allow-list moved; what changed is which one this
 * dispatch asks for. The reasoning is on `assembleBuilderGoal` above.
 */
export const dispatchBuilderMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        goal: z.string().min(4).max(4000),
        prdId: z.string().uuid().optional(),
        issueNumber: z.number().int().positive().optional(),
        autoCreateIssue: z.boolean().optional(),
        referenceLinks: z.array(z.string().url().max(500)).max(10).optional(),
        missionTitle: z.string().min(1).max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Resolve PRD context if provided.
    type PrdCtx = {
      id: string;
      title: string;
      body_md: string | null;
      github_issue_url: string | null;
      workspace_id: string | null;
      /** Which product this spec belongs to. Read ONLY so the GitHub resolve
       *  below can honour a product-scoped repo binding; see its use site. */
      product_id: string | null;
      contract: unknown;
    };
    let prd: PrdCtx | null = null;
    if (data.prdId) {
      const { data: row, error } = await supabase
        .from("prds")
        .select("id,title,body_md,github_issue_url,workspace_id,product_id,contract")
        .eq("id", data.prdId)
        .single();
      if (error) throw new Error(`PRD lookup failed: ${error.message}`);
      prd = row as unknown as PrdCtx;
    }

    // SW-4 / mission 3.4: the design station gates dispatch here exactly as
    // it does on the Studio path; fail-open pre-migration.
    const designGate = await loadDesignGateState(supabase as unknown as SupabaseClient, prd);
    if (designGateBlocksDispatch(designGate)) throw new Error(DESIGN_GATE_BLOCK_MESSAGE);

    // Mission 3.3 dispatch parity: the payload dispatched to Build IS the
    // ARD. Fold the linked spec's compiled contract once; it rides every
    // prose injection point below (issue body + work-order goal). Mission
    // 3.4 adds the design station's structured section to the same fold.
    const designCtx = await loadDesignDispatchContext(supabase as unknown as SupabaseClient, prd);
    const ard = ardDispatchBlock(prd, toArdDesignSection(designCtx));
    /**
     * The design station's PROSE half, carried independently of the ARD.
     *
     * `toArdDesignSection` above is the structured half and it survives only
     * inside the ARD document, which does not exist without a compiled
     * contract. These sections are the same design context in the shape
     * `dispatchStudioSession` has always sent -- standing design language, the
     * spec's flow, and the mockup in its OWN fenced html block -- and they now
     * ride whether or not a contract compiled, which is the only way the
     * approved mockup reaches a Build Console dispatch today.
     *
     * NOTHING RIDES WHEN THERE IS NOTHING TO SEND, which was worth checking
     * rather than assuming. `formatDesignMemoryContext`, `formatFlowContext` and
     * `formatScaffoldHtmlBlock` each return "" for an empty input and
     * `formatDesignDispatchSections` pushes only non-empty strings, so a spec
     * with no brand rules, no flow and no drawing yields `[]` and
     * `assembleBuilderGoal`'s length guard adds no heading at all. That
     * distinction matters: an empty labelled section is not silence, it is the
     * design station stating it had nothing to say, and a builder told that
     * builds past a drawing it should have gone looking for.
     *
     * THE COUNT ON THAT SENTENCE WAS WRONG AND IS CORRECTED HERE RATHER THAN
     * DROPPED. It read "39 of the 41 approved specs on 2026-08-06", which was
     * the count of approved specs with no DRAWING at that moment (41 minus the 2
     * that had one), reused as though it were the count with nothing at all.
     * Design memory is WORKSPACE-scoped, not per-spec: a spec inherits its
     * workspace's standing design language whether or not anyone ever drew it,
     * so `[]` is much rarer than that sentence claimed. Re-measured 2026-08-06
     * through the same filter `getActiveDesignMemoryForWorkspace` applies
     * (design_memory.status 'approved', minus any row retired by a `supersedes`
     * edge whose parent is itself approved): of the 42 approved specs, 29 sit in
     * a workspace WITH active design memory and therefore carry a non-empty
     * `designSections`, 3 carry a drawing, 0 carry a flow, and 13 yield `[]`.
     * All three drawn specs are inside the 29, so the ordinary non-empty case is
     * the workspace design language travelling alone.
     *
     * READ TWICE ON THE SAME DAY, and the second read is the one above: the
     * cross-section moved by one spec between them (41/28/2 -> 42/29/3) while
     * the load-bearing figure, the 13 that yield `[]`, did not. A count in a
     * comment is a snapshot; what it is here to justify is that `[]` is the
     * MINORITY case and is handled, and that holds at either reading.
     */
    const designSections = formatDesignDispatchSections(designCtx);

    // Workspace: prefer the PRD's, else the user's default (also used for the mission).
    const { data: ws } = await supabase.rpc("current_user_default_workspace");
    const workspaceId = prd?.workspace_id ?? (ws as string | null) ?? null;

    // Resolve issue number.
    let issueNumber: number | null = data.issueNumber ?? null;
    let issueUrl: string | null = null;
    /** Set when the issue was opened but writing it back onto the spec did not
     *  take. Reported, never thrown — the reasoning is on the write itself. */
    let issueLinkError: string | null = null;

    if (!issueNumber && prd?.github_issue_url) {
      const m = prd.github_issue_url.match(/\/issues\/(\d+)/);
      if (m) {
        issueNumber = Number(m[1]);
        issueUrl = prd.github_issue_url;
      }
    }

    if (!issueNumber && data.autoCreateIssue) {
      const gh = await resolveGitHub({
        userId,
        workspaceId,
        /**
         * THE PANEL AND THE DISPATCH MUST RESOLVE THE SAME REPOSITORY.
         *
         * `canDispatchToRepo` resolves WITH the active product, so the panel
         * above this button reads "Where the next build lands:
         * owner/some-product-repo" off a product-scoped binding. This call
         * omitted it, and `resolveGitHub` documents productId as the "most
         * specific, wins over workspace" override -- so the dispatch skipped the
         * product branch entirely and fell through to the workspace binding,
         * which is filtered `.is("product_id", null)`.
         *
         * Two outcomes, and the second is the dangerous one. With no workspace
         * binding it throws NOT_CONNECTED_ERROR, printing "GitHub is not
         * connected" directly beneath a panel that just named the repository.
         * WITH a workspace binding it succeeds and opens the issue, and later
         * the pull request, in THE WRONG REPOSITORY -- a customer's, silently.
         *
         * Taken from the PRD rather than a parameter because the spec is what is
         * being built; if the spec belongs to a product, that product's binding
         * is the correct one whatever the UI happened to have selected.
         */
        productId: prd?.product_id ?? null,
        userClient: supabase as unknown as SupabaseClient,
      });

      const titleSrc = data.missionTitle?.trim() || data.goal.split(/\r?\n/)[0].slice(0, 120);
      const bodyParts: string[] = [data.goal.slice(0, 40_000)];
      if (prd)
        bodyParts.push(
          `\n---\n**From PRD:** ${prd.title}\n\n${(prd.body_md ?? "").slice(0, 20_000)}`,
        );
      if (ard) bodyParts.push(`\n---\n${ard.block}`);
      /**
       * THE MOCKUP DELIBERATELY DOES NOT GO IN THE ISSUE BODY, AND THIS IS THE
       * HALF OF THE DESIGN FIX THAT IS NOT DONE HERE.
       *
       * `designSections` reaches the building agent through the work order
       * above, which is the channel the agent actually reads and the one that
       * was broken. Repeating them here would put an approved mockup (capped at
       * `ARD_SCAFFOLD_HTML_CAP`, 20,000 chars) plus the standing design language
       * into a body that already carries the goal (4,000), the spec (20,000) and
       * the ARD (8,000) -- against GitHub's 65,536-char issue-body limit, whose
       * only failure mode here is a 422 that throws and kills the whole
       * dispatch. A human reading the issue can open the spec's Design tab; an
       * agent that never receives the markup cannot.
       */
      if (data.referenceLinks?.length) {
        bodyParts.push(
          `\n---\n**References:**\n${data.referenceLinks.map((u) => `- ${u}`).join("\n")}`,
        );
      }
      bodyParts.push(`\n---\n_Opened from Supaprod Build Console_`);

      const res = await fetch(`https://api.github.com/repos/${gh.repo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gh.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "supaprod-agent",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: titleSrc.slice(0, 250),
          body: bodyParts.join("\n"),
          labels: ["supaprod", "build"],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`GitHub ${res.status}: ${txt.slice(0, 400)}`);
      }
      const json = (await res.json()) as { number: number; html_url: string };
      issueNumber = json.number;
      issueUrl = json.html_url;

      if (prd && !prd.github_issue_url) {
        /**
         * CHECKED, BECAUSE supabase-js RESOLVES A REFUSED WRITE.
         *
         * This was a bare `await supabase.from("prds").update(...).eq("id",
         * prd.id)` with neither an `error` inspection nor a `.select()`, so a
         * refusal came back as a resolved promise: `github_issue_url` stayed
         * null and nobody was told.
         *
         * IT IS REACHABLE, AND WHAT IT COSTS IS THE DOUBLE DISPATCH THE REST OF
         * THIS FILE EXISTS TO PREVENT. Live policy on `prds`, pulled from
         * pg_policy on 2026-08-06: READ is `is_workspace_member(workspace_id)`,
         * UPDATE is USING and WITH CHECK `is_workspace_member(workspace_id) AND
         * user_id = auth.uid()`. So a workspace member who is not the spec's
         * author can see an approved spec, press Build on it, open the GitHub
         * issue — and have this one write silently refused. The next press finds
         * `github_issue_url` still null, opens a SECOND issue and mints a SECOND
         * billed builder run against the same spec.
         *
         * NOT THROWN. The issue is already open and the agent is still worth
         * starting, and a throw from here lands on the caller's "Nothing was
         * dispatched, so the spec is still waiting" sentence, which would be
         * false. It rides back on `issue_link_error` instead, and ReadyToBuild
         * stops navigating away from a dispatch that carries one so the warning
         * is actually read.
         */
        const { data: linked, error: linkErr } = await supabase
          .from("prds")
          .update({ github_issue_url: issueUrl, updated_at: new Date().toISOString() })
          .eq("id", prd.id)
          .select("id");
        if (linkErr) issueLinkError = linkErr.message;
        else if (!(linked ?? []).length)
          issueLinkError =
            "The spec's row refused the update and reported no error, which is what row-level security looks like from here.";
      }
    }

    if (!issueNumber) {
      throw new Error(
        "Need a GitHub issue: link a PRD with one, enter an issue number, or enable Auto-create.",
      );
    }

    // Build a context-rich goal for the Builder agent (pure assembly above:
    // the ARD block + acceptance criteria ride the work order).
    const fullGoal = assembleBuilderGoal({
      issueNumber,
      intent: data.goal,
      prd,
      ard,
      designSections,
      referenceLinks: data.referenceLinks,
    });

    /**
     * Resolve builder agent, create mission, then run.
     *
     * A ROSTER READ THAT FAILED IS NOT AN EMPTY ROSTER, and this read used to
     * discard its `error` and let `agent === null` stand for both. The two are
     * not the same fact and the difference reaches a person: `agent` null
     * suppresses mission creation below, and ReadyToBuild turned that silence
     * into a definite instruction — "no mission was created for it, so there is
     * no run to open. Check that a builder agent exists in your roster." On a
     * transport failure or an RLS refusal that sends someone to fix a roster
     * that is fine, while the real fault goes unnamed. It is exactly the
     * absence-as-evidence pattern this repo keeps paying for.
     *
     * The read's outcome is unchanged on purpose — a failed read must not
     * fabricate an agent, so mission creation is still skipped — but the reason
     * now travels on `roster_error` and the caller says which of the two
     * happened. Nothing is thrown: by this line the GitHub issue is already
     * open, so "nothing was dispatched" would be false.
     */
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", "builder")
      .maybeSingle();
    const rosterError = agentError ? agentError.message : null;

    /**
     * EVERYTHING FROM HERE IS DURABLE, SO A FAILURE FROM HERE IS NOT "NOTHING
     * HAPPENED".
     *
     * This handler awaits the ENTIRE inline agent turn, and by the time it does
     * it has already opened the GitHub issue, written `prds.github_issue_url`,
     * created the mission, written the prd->mission lineage edge and recorded
     * the stage event. Any failure inside `runAgentLoop` -- a spend cap, a model
     * error, a later GitHub call, or the request simply timing out on a long
     * build -- used to be thrown, and the Build Console's error row appends
     * "Nothing was dispatched, so the spec is still waiting." to whatever it
     * catches. That is the opposite of what happened, and the natural response
     * to it is to press again: the second press finds `github_issue_url` set,
     * skips issue creation, and mints a SECOND mission, a second lineage edge
     * and a second billed builder run against the same issue.
     *
     * So a failure that lands after the mission exists is REPORTED, not thrown:
     * the caller gets the mission id it needs to open the run alongside
     * `run_error`. Only a failure with no mission and no called loop behind it
     * still throws, because for that one the caller's sentence is true.
     *
     * `run_started` IS THE THIRD CASE, AND THE LOOP IS WHAT ANSWERS IT. A caller
     * holding only `{mission_id, run_error}` cannot tell "a run exists and its
     * page carries the whole story" from "the mission row exists and nothing was
     * ever started on it", where /runs/<id> is an empty page. That second state
     * is reachable when `recordLineage` throws a transport error a few lines
     * below (`recordStageEvent` cannot throw; stage-events.server.ts swallows its
     * own). So the field reports the `agent_runs` row `runAgentLoop` says it
     * inserted — `result.run_id` — and nothing else.
     *
     * IT USED TO BE `loopEntered`, ASSIGNED BEFORE THE AWAIT, so it meant "we
     * called the loop" while every reader took it for "a run exists". Those come
     * apart on anything that throws before that insert lands, and `runAgentLoop`
     * has three such sites: `Unknown agent`, `Agent is disabled` (the roster read
     * above selects `id` alone, so a disabled builder passes it, the mission is
     * created, and the loop refuses it after), and the `agent_runs insert failed`
     * guard on the insert itself. Each returned `run_started: true` with no
     * run behind it, and ReadyToBuild navigates on that field — the exact empty
     * page it was added to prevent. Latent as of 2026-08-06 (16 of 16 builder
     * agents enabled) and one RLS refusal on `agent_runs` away.
     *
     * ON THE FAILURE PATH THE LOOP'S ANSWER IS GONE WITH THE THROW, so the field
     * is false there and the caller states the reason in place with a door onto
     * the mission instead of navigating. That is never worse: the run page is one
     * click away either way, and the reason is on screen rather than discarded.
     * What it must NOT do is claim no run exists — a throw from inside the step
     * loop leaves a real `agent_runs` row behind — so the caller's sentence for
     * this case says the dispatch got no run id back, which is true of all of
     * them.
     *
     * `loopCalled` keeps the other half of the old variable's job, and only that
     * half: whether anything is behind this failure at all, which is what decides
     * between rethrowing and reporting.
     */
    let missionId: string | null = null;
    let loopCalled = false;
    try {
      if (workspaceId && agent) {
        const m = await createMission(supabase, userId, workspaceId, {
          title: (
            data.missionTitle?.trim() || `Build · #${issueNumber} ${data.goal.slice(0, 60)}`
          ).slice(0, 200),
          goal: fullGoal,
          starting_agent_id: (agent as { id: string }).id,
          // BD-1: this dispatch runs the in-house loop below, so the mission is
          // stamped with the engine that actually builds it.
          build_driver: nativeBuildDriver.id,
        });
        missionId = m.id;
        // Mission 3.4: the spec's dispatch is a stage transition like any
        // other; the ledger chain walks design -> build on real rows.
        if (prd) {
          /**
           * THE EDGE THAT CARRIES THE SPEC INTO THE RECORD.
           *
           * Found 2026-08-05: this is the SECOND path that dispatches a Build
           * mission from a spec, and it was the only one not writing this edge.
           * dispatchStudioSession (studio.functions.ts) writes it; this one wrote
           * the stage event and stopped. Nothing downstream could tell the two
           * dispatches apart, because a mission carries no prd column — the edge
           * IS the link.
           *
           * What that cost, four hops down: the changeset an agent opens resolves
           * its spec through this edge, so a mission dispatched here produced a
           * changeset with a null prd_id; decideStudioMergeShipStamp then refused
           * every such merge with "this change has no spec behind it"; no spec was
           * stamped shipped; the settle sweep had nothing to grade; and the
           * outcome memory pool — the moat — stayed empty. 21 of 23 live
           * changesets came through here, which is the whole gap.
           *
           * Same shape and relation as the Studio dispatch deliberately, so the
           * two paths write ONE kind of edge and every reader stays single-path.
           */
          await recordLineage(supabase, userId, {
            parent_kind: "prd",
            parent_id: prd.id,
            child_kind: "mission",
            child_id: m.id,
            relation: "dispatched",
            rationale: "Sent to Build",
            created_by_agent: "builder",
          });
          await recordStageEvent(supabase, {
            entityType: "spec",
            entityId: prd.id,
            from: null,
            to: "build",
            actor: "human",
            workspaceId,
            userId,
          });
        }
      }

      loopCalled = true;
      const result = await runAgentLoop(supabase, userId, {
        agentSlug: "builder",
        goal: fullGoal,
        missionId,
      });

      return {
        ...result,
        mission_id: missionId,
        issue_number: issueNumber,
        issue_url: issueUrl,
        issue_link_error: issueLinkError,
        roster_error: rosterError,
        run_error: null as string | null,
        // The loop's own answer, not this function's control flow. `run_id` is
        // null when the `agent_runs` insert came back empty without erroring,
        // and a caller sent to that mission's run page would find nothing on it.
        run_started: (result.run_id ?? null) !== null,
      };
    } catch (e) {
      // Nothing durable to point the caller at: the mission was never created
      // and the loop was never called. "Nothing was dispatched" is true here, so
      // let it throw and let the caller say it.
      if (!missionId && !loopCalled) throw e;
      return {
        mission_id: missionId,
        issue_number: issueNumber,
        issue_url: issueUrl,
        issue_link_error: issueLinkError,
        roster_error: rosterError,
        run_error: e instanceof Error ? e.message : String(e),
        // The throw took the loop's answer with it. False means "no run id came
        // back", never "no run exists" — see the paragraph above.
        run_started: false,
      };
    }
  });

/**
 * One blocked row, and the only two facts a surface needs to name the reason
 * without guessing at it.
 */
export type DispatchDesignGate = {
  id: string;
  /**
   * `prds.design_gate_status` exactly as stored, or null pre-migration. It is
   * never "approved": a spec whose gate is approved is not in this list, because
   * `designGateBlocksDispatch` blocks precisely when the status is not.
   */
  status: string | null;
  /**
   * TRUE ONLY WHEN A DRAWING IS KNOWN TO EXIST. `loadDesignGateState` reports
   * `hasDrawing: undefined` when the `prd_scaffolds` count read FAILED, and the
   * gate stays shut on unknown by design. A blocked row with this false must not
   * tell anyone a mockup is waiting for them — nobody knows whether one is.
   */
  drawingConfirmed: boolean;
};

/**
 * THE GATE, READ FOR A LIST — so a surface can say which rows this dispatch
 * would refuse BEFORE the person presses.
 *
 * The Build Console's "Approved and waiting to be built" list filtered on
 * `prds.status === 'approved'` alone and knew nothing about the design gate, so
 * every row read "Approved. Build opens the issue as it starts." while
 * `dispatchBuilderMission` above was going to throw DESIGN_GATE_BLOCK_MESSAGE
 * at it. Re-measured 2026-08-06: of the 42 approved specs, 3 carry a drawing —
 * 2 still `design_gate_status = 'pending'` and therefore blocked, and one
 * (4c0391d5, "Skip the address re-confirm when nothing changed") approved, which
 * is the first approved design gate in the database. No spec anywhere carries
 * 'rejected'. An earlier reading of this paragraph said no approved spec had an
 * approved gate; that was true when written and is not now, which is why the
 * figures here carry the day they were taken.
 *
 * It reuses `loadDesignGateState` + `designGateBlocksDispatch` rather than
 * asking the same three questions in a second shape. That matters more than the
 * query count: the gate rule is subtle (an unmade drawing must NOT block, an
 * unreadable drawing count must), and a surface that guessed at it would go
 * wrong in the direction of telling the 40 approved specs that are NOT blocked
 * (2026-08-06) that they are stuck when they are not.
 *
 * IT USED TO RETURN BARE IDS, "so the caller cannot re-derive the rule", AND
 * THAT DENIED THE CALLER THE FACT IT NEEDED TO SPEAK ACCURATELY. Holding only
 * `string[]`, the Build Console had one sentence for every blocked row and it
 * chose the common one: "a mockup is drawn and nobody has approved or rejected
 * it". `designGateBlocksDispatch` blocks on `status !== "approved"`, which
 * includes `rejected` — a status `decideDesignGate` really writes
 * (see the `decideDesignGate` server fn in design-scaffold.functions.ts) — and
 * it also blocks when the drawing count could not be read at all
 * (`loadDesignGateState` in design-gate.server.ts keeps the gate shut on
 * unknown, deliberately). For those two the row asserted the opposite of the
 * truth.
 *
 * BOTH ARE NAMED BY SYMBOL BECAUSE THE FIRST CITATION HERE HAD ALREADY ROTTED:
 * it read "design-scaffold.functions.ts:1029", which was exact on the day it was
 * written — `decideDesignGate` is at that line in commit 83dd694e — and is stale
 * now because that function has moved several hundred lines down the file. NO
 * REPLACEMENT NUMBER IS GIVEN ON PURPOSE, and not only because a new one would
 * rot the same way: the first attempt at this correction described where :1029
 * "now points" by naming a function that does not exist anywhere in `src/` —
 * the same defect it was in the middle of fixing, one clause later. What caught
 * it is the whole argument for symbols: grepping that name across `src/`
 * returned exactly one hit, the comment that invented it. A symbol can be
 * checked in one command; a line number can only be trusted. ReadyToBuild.tsx
 * dropped a line number for this same reason in the wave that added this one.
 *
 * So the shape now carries the two facts a true sentence needs and
 * NOTHING MORE: it still does not carry `stageEnabled`, so the rule itself
 * remains underivable here and stays in the one predicate both dispatch paths
 * call.
 *
 * `unresolved` closes the other half. An id absent from the `prds` select is
 * absence of evidence, not evidence of an open gate; treating it as not-blocked
 * is the discarded-read pattern this repo keeps paying for. It should be empty
 * in practice — the caller's ids come from `listSpecs`, read under the same
 * RLS — and if it ever is not, the surface can say so instead of promising a
 * build that the dispatch will refuse.
 */
export const listDispatchDesignGates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ prdIds: z.array(z.string().uuid()).min(1).max(24) }).parse(i),
  )
  .handler(
    async ({ context, data }): Promise<{ blocked: DispatchDesignGate[]; unresolved: string[] }> => {
      const { supabase } = context;
      const { data: rows, error } = await supabase
        .from("prds")
        .select("id,workspace_id")
        .in("id", data.prdIds);
      if (error) throw new Error(error.message);
      const prds = (rows ?? []) as Array<{ id: string; workspace_id: string | null }>;
      const states = await Promise.all(
        prds.map(async (p) => ({
          id: p.id,
          state: await loadDesignGateState(supabase as unknown as SupabaseClient, p),
        })),
      );
      const resolved = new Set(prds.map((p) => p.id));
      return {
        blocked: states
          .filter((s) => designGateBlocksDispatch(s.state))
          .map((s) => ({
            id: s.id,
            status: s.state.status,
            drawingConfirmed: s.state.hasDrawing === true,
          })),
        unresolved: data.prdIds.filter((id) => !resolved.has(id)),
      };
    },
  );

// ─── K1-deploy: Supaprod-triggered deploy gate ────────────────────────────────

export type DeployResult =
  | { ok: true; provider: string; triggered_at: string }
  | { ok: false; reason: "no_hook_configured" | "forbidden" | "upstream_error"; message: string };

/**
 * K1-deploy: trigger a deploy from inside Supaprod.
 *
 * Posts to the `CLOUDFLARE_DEPLOY_HOOK_URL` wrangler secret (or
 * `LOVABLE_DEPLOY_HOOK_URL` as a fallback). Admins only.
 *
 * ACTIVATION GATE: returns a human-readable no-op when neither env var is set.
 * To activate: add the Cloudflare Deploy Hook URL as a wrangler secret:
 *   wrangler secret put CLOUDFLARE_DEPLOY_HOOK_URL
 *
 * The hook URL should be the "Deploy Hook" URL from the Cloudflare Pages /
 * Workers dashboard for this project (Settings -> Triggers -> Deploy Hooks).
 */
export const triggerDeploy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        reason: z.string().min(1).max(500),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<DeployResult> => {
    const { supabase, userId } = context;

    // Admin gate. Was `profiles.plan_tier === "admin"` until 2026-07-02: `profiles`
    // has no `plan_tier` column at all (only `workspaces`/`accounts` do, for the
    // billing tier), so that check always failed closed for every caller — this
    // deploy trigger has never worked for anyone. Fixed to the real mechanism
    // (`user_roles`), the same one `amIAdmin`/the `/admin/*` layout use.
    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) {
      return {
        ok: false,
        reason: "forbidden",
        message: "Admin role required to trigger a deploy.",
      };
    }

    // Resolve hook URL: Cloudflare first, Lovable as fallback
    const hookUrl = process.env.CLOUDFLARE_DEPLOY_HOOK_URL ?? process.env.LOVABLE_DEPLOY_HOOK_URL;
    if (!hookUrl) {
      return {
        ok: false,
        reason: "no_hook_configured",
        message:
          "No deploy hook configured. Set CLOUDFLARE_DEPLOY_HOOK_URL (or LOVABLE_DEPLOY_HOOK_URL) as a wrangler secret to activate. See docs/operations/deploy.md for setup.",
      };
    }

    // Determine provider from URL pattern for the receipt
    const provider = hookUrl.includes("cloudflare") ? "cloudflare" : "lovable";

    const res = await fetch(hookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggered_by: userId, reason: data.reason }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      return {
        ok: false,
        reason: "upstream_error",
        message: `Deploy hook returned ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const triggered_at = new Date().toISOString();

    // Audit: record in admin_audit_log
    await supabase.from("admin_audit_log").insert({
      admin_id: userId,
      action: "deploy_triggered",
      target_id: null,
      meta: { provider, reason: data.reason, triggered_at },
    });

    return { ok: true, provider, triggered_at };
  });
