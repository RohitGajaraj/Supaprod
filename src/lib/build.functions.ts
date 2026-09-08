/**
 * Bundle 9 Slice 1 — Build Console server fns.
 *
 * `listBuilderRuns` is a read-only view over agent_runs WHERE
 * agent_slug='builder' joined to the github.pr.open tool_call result (PR url,
 * number, branch, path) and any pending agent_approvals for that run.
 *
 * TWO CLAIMS IN THIS HEADER WERE FALSE AND ARE CORRECTED RATHER THAN DELETED.
 *
 * It said this "feeds the /build page". It did not: `listBuilderRuns`,
 * `listBuilderClaims` and `releaseBuilderClaim` had no caller anywhere in
 * `src/`: /build imported `listBuildWork` and `canDispatchToRepo` instead. The
 * file-claim error message in the tool registry told people to "release the
 * claim from /build", a control that page did not have, so the one recovery
 * instruction the product gives for a claim conflict was a dead end.
 *
 * THE DOOR CAME AND WENT. On 2026-08-06 `listBuilderClaims` and
 * `releaseBuilderClaim` were mounted by `components/build/HeldClaims.tsx` on
 * /build; P-14 (2026-09-03) retired /build to a redirect stub and deleted the
 * component. `listBuilderClaims` is deleted with this note (2026-09-08): the
 * one live reader of "who holds this path" is `whoHoldsThePath` in
 * spine/track.functions.ts, on the run screen. `releaseBuilderClaim` stays,
 * unmounted: a claim releases on its own when its run reaches a terminal
 * status (the `release_claims_for_terminal_run` trigger), on cancel, on
 * abandon and on merge, and the registry's conflict sentence now says that
 * instead of pointing at a page. There is no operator force-release today;
 * a held claim on a run that never reached a terminal status has no manual
 * exit, which is a gap the queue records rather than this header hides.
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
import { buildArdDocument, parseArdDocument, type ArdDesignSection } from "@/lib/ard-schema";
import {
  designGateBlocksDispatch,
  toArdDesignSection,
  DESIGN_GATE_BLOCK_MESSAGE,
} from "@/lib/build/design-gate";
import { specGateBlocksDispatch, SPEC_GATE_BLOCK_MESSAGE } from "@/lib/build/spec-gate";
import { loadDesignGateState, loadDesignDispatchContext } from "@/lib/build/design-gate.server";
import { recordLineage } from "@/lib/lineage.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import { formatArdWorkOrderBlock, standingClauseTexts } from "@/lib/build/ard-block";
import { nativeBuildDriver } from "@/lib/build/native.server";
import { refuseDispatch } from "@/lib/build/dispatch-refusal";
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
 *
 * AND IT STOPPED HOLDING THE BROWSER OPEN, 2026-08-06. This handler used to
 * `await runAgentLoop(...)`, so the station's only dispatch ran an entire
 * builder session inside one Cloudflare Worker request: "Build this" sat on
 * "Starting" for the length of a real build, the run the station exists to let
 * you watch was unreachable until it had finished, and every failure mode of a
 * long request (a gateway timeout, a dropped connection, an evicted worker)
 * landed on a caller that had been told nothing was dispatched.
 *
 * The sibling path had already solved it. `dispatchStudioSession` calls
 * `nativeBuildDriver.dispatch`, which creates the mission, inserts a QUEUED
 * `agent_runs` row and returns; the resume-runs sweeper (pg_cron, every minute)
 * promotes it and runs the loop with a worker's full budget rather than a
 * request's. This dispatch now does the same, returns `{mission_id, run_id}`
 * immediately, and the caller navigates onto a run page that has a real run on
 * it from the first frame.
 *
 * WHAT THAT MOVED, AND WHAT HAD TO MOVE WITH IT. `runAgentLoop` stamped
 * `mission_spend_cap_usd` on the run row it inserted, and that column is what
 * `checkMissionCaps` reads before every model call. The seam did not stamp it,
 * so switching without touching it would have silently removed the spend
 * ceiling from every Build Console dispatch while /build's own "boundary" line
 * kept promising one. `nativeBuildDriver.dispatch` now resolves the ceiling
 * itself, which fixes the Studio path in the same edit.
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

    /**
     * EVERY THROW IN THIS HANDLER IS MARKED, AND ONLY THE PRE-DURABLE ONES ARE
     * REACHABLE AS THROWS.
     *
     * `refuseDispatch` prefixes the message with the mark defined in
     * build/dispatch-refusal.ts, and ReadyToBuild's `onError` says "Nothing was
     * dispatched, so the spec is still waiting" only for a message carrying it.
     * Anything else that reaches `onError` (a gateway timeout, an edge 5xx, a
     * dropped connection) is a failure whose OUTCOME IS UNKNOWN to the client,
     * and it gets the cautious sentence instead. The mark stops after the
     * GitHub issue is opened: from that line on there is something durable in
     * the world, and this handler reports rather than throws.
     */

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
      /** `prds.status`. Read by the approval gate; see ./build/spec-gate. */
      status?: string | null;
    };
    let prd: PrdCtx | null = null;
    if (data.prdId) {
      const { data: row, error } = await supabase
        .from("prds")
        .select("id,title,body_md,github_issue_url,workspace_id,product_id,contract,status")
        .eq("id", data.prdId)
        .single();
      if (error) throw refuseDispatch(`PRD lookup failed: ${error.message}`);
      prd = row as unknown as PrdCtx;
      // THE APPROVAL GATE, AT THE SERVER. Beside the design gate rather than
      // instead of it: they answer different questions and both are real.
      //
      // The rule lived in one React component's `routeBlocker`, so every other
      // door accepted a draft: /runs dispatches, and so does an agent through
      // this same function. A governance rule enforced in the client and not at
      // the server is a suggestion with good manners. Reasoning: ./build/spec-gate.
      if (specGateBlocksDispatch({ status: prd.status }))
        throw refuseDispatch(SPEC_GATE_BLOCK_MESSAGE);
    }

    // SW-4 / mission 3.4: the design station gates dispatch here exactly as
    // it does on the Studio path; fail-open pre-migration.
    const designGate = await loadDesignGateState(supabase as unknown as SupabaseClient, prd);
    if (designGateBlocksDispatch(designGate)) throw refuseDispatch(DESIGN_GATE_BLOCK_MESSAGE);

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
      /**
       * MARKED, AND THE MARK MUST NOT SWALLOW THE WORDS THE GATE MATCHES ON.
       *
       * `resolveGitHub` throws NOT_CONNECTED_ERROR, and both /runs and
       * ReadyToBuild's own repo gate classify it with `isRepoNotConnectedError`,
       * a case-insensitive test for "github is not connected" ANYWHERE in the
       * message. Prefixing leaves that substring intact, so the gate still
       * opens on it; it is re-thrown rather than wrapped in new prose for
       * exactly that reason.
       */
      const ghArgs = {
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
      };
      let gh: Awaited<ReturnType<typeof resolveGitHub>>;
      try {
        gh = await resolveGitHub(ghArgs);
      } catch (e) {
        throw refuseDispatch(e instanceof Error ? e.message : String(e));
      }

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
        // Still pre-durable: GitHub refused, so no issue exists and nothing
        // else has been written. The last throw in this handler that may say so.
        throw refuseDispatch(`GitHub ${res.status}: ${txt.slice(0, 400)}`);
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
      // Reachable only when auto-create was off and no issue resolved, so
      // nothing was created above and the refusal mark is honest.
      throw refuseDispatch(
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
     * Resolve builder agent, then hand the work to the build seam.
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
     * fabricate an agent, so no mission is created, but the reason travels on
     * `roster_error` and the caller says which of the two happened. Nothing is
     * thrown: by this line the GitHub issue may already be open, so "nothing
     * was dispatched" would be false.
     *
     * `name` IS SELECTED NOW BECAUSE THE SEAM NEEDS IT. `nativeBuildDriver`
     * stamps `agent_runs.agent_name`, which is what every run list shows as the
     * actor; `runAgentLoop` used to resolve the roster row a second time and
     * fill it in, and the seam does not. `enabled` is deliberately NOT filtered
     * on: a disabled builder still passes this read, the queued run is created,
     * and `resumeAgentLoop` refuses it on the next sweep with the disabled
     * agent's own error on the run page. Filtering here would be a different
     * behaviour (no mission at all) than the one this handler has always had.
     */
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id,name")
      .eq("user_id", userId)
      .eq("slug", "builder")
      .maybeSingle();
    const rosterError = agentError ? agentError.message : null;

    /**
     * NOTHING BELOW THIS LINE THROWS, AND THAT IS THE CONTRACT.
     *
     * By here the GitHub issue may be open and `prds.github_issue_url` written,
     * so "nothing was dispatched" would be false, and the caller's error row
     * says exactly that sentence. So every failure from here is REPORTED on
     * `run_error` with whatever the caller needs to reach what does exist. Only
     * the marked pre-durable throws above may reach `onError`.
     *
     * `run_started` MEANS A QUEUED RUN ROW EXISTS, and since 2026-08-06 that is
     * a different claim than it used to be. It was "`runAgentLoop` came back
     * holding an `agent_runs` id", after a full inline build. It is now "the
     * seam inserted the queued `agent_runs` row the resume-runs sweeper
     * promotes". Both mean the same thing to the caller, which is the only
     * thing the caller does with it: /runs/<mission> has a real run on it and
     * navigating there shows work rather than an empty page. What changed is
     * WHEN it is true, which is now within a second of the press rather than at
     * the end of the build.
     *
     * THE ONE STATE THE SEAM CAN LEAVE THAT THIS CANNOT SEE. `dispatch` creates
     * the mission and then inserts the run; if the insert is refused it throws
     * with the mission already written, and the mission id went with the throw.
     * That is reported as `mission_id: null` plus a `run_error`, and the
     * caller's copy for it says a mission may exist rather than that none does.
     * Closing it properly is a change to the seam's return contract (a partial
     * session), and the seam is shared with the Studio dispatch.
     */
    let missionId: string | null = null;
    let runId: string | null = null;
    let runError: string | null = null;

    const missionTitle = (
      data.missionTitle?.trim() || `Build · #${issueNumber} ${data.goal.slice(0, 60)}`
    ).slice(0, 200);

    if (!workspaceId || !agent) {
      // No mission is created without both, exactly as before. The caller has
      // three distinct sentences for the three reasons, so this reports which.
      const why = rosterError
        ? `Your agent roster could not be read (${rosterError}), so no builder agent resolved and no mission was created.`
        : !workspaceId
          ? "No workspace resolved for this spec, so there was nowhere to put the mission."
          : "No builder agent is in your roster, so no mission was created.";
      return {
        mission_id: missionId,
        run_id: runId,
        issue_number: issueNumber,
        issue_url: issueUrl,
        issue_link_error: issueLinkError,
        roster_error: rosterError,
        run_error: why,
        run_started: false,
      };
    }

    try {
      /**
       * THE SEAM, NOT AN INLINE LOOP. `nativeBuildDriver.dispatch` performs
       * exactly what this handler used to do by hand (createMission stamped
       * `build_driver`), and then inserts a QUEUED `agent_runs` row instead of
       * running the build inside this request. See the header for what that
       * cost and why the ceiling had to move with it.
       *
       * The spec passes `goal` alone. `assembleBuilderGoal` has already folded
       * the acceptance criteria into the work-order text, so passing them again
       * as `acceptanceCriteria` would print the same bar twice in the mission
       * goal the agent reads.
       */
      const session = await nativeBuildDriver.dispatch(
        {
          supabase: supabase as unknown as SupabaseClient,
          userId,
          workspaceId,
          agent: {
            id: (agent as { id: string }).id,
            slug: "builder",
            name: (agent as { name?: string | null }).name ?? "Engineer",
          },
          missionTitle,
        },
        { goal: fullGoal },
      );
      missionId = session.missionId;
      runId = session.runId ?? null;
    } catch (e) {
      runError = e instanceof Error ? e.message : String(e);
    }

    // Mission 3.4: the spec's dispatch is a stage transition like any other;
    // the ledger chain walks design -> build on real rows.
    if (missionId && prd) {
      /**
       * THE EDGE THAT CARRIES THE SPEC INTO THE RECORD.
       *
       * Found 2026-08-05: this is the SECOND path that dispatches a Build
       * mission from a spec, and it was the only one not writing this edge.
       * dispatchStudioSession (studio.functions.ts) writes it; this one wrote
       * the stage event and stopped. Nothing downstream could tell the two
       * dispatches apart, because a mission carries no prd column: the edge
       * IS the link.
       *
       * What that cost, four hops down: the changeset an agent opens resolves
       * its spec through this edge, so a mission dispatched here produced a
       * changeset with a null prd_id; decideStudioMergeShipStamp then refused
       * every such merge with "this change has no spec behind it"; no spec was
       * stamped shipped; the settle sweep had nothing to grade; and the
       * outcome memory pool (the moat) stayed empty. 21 of 23 live
       * changesets came through here, which is the whole gap.
       *
       * Same shape and relation as the Studio dispatch deliberately, so the
       * two paths write ONE kind of edge and every reader stays single-path.
       *
       * AND IT IS THE EDGE `listSpecDispatches` READS BACK, which is what
       * retires "Build this" on the Build Console once a spec has a run. A
       * transport failure here therefore costs a visible fact as well as a
       * provenance one, so the reason is reported rather than swallowed: the
       * run is real either way and the caller is told the link is not.
       */
      try {
        await recordLineage(supabase, userId, {
          parent_kind: "prd",
          parent_id: prd.id,
          child_kind: "mission",
          child_id: missionId,
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
      } catch (e) {
        const why = e instanceof Error ? e.message : String(e);
        runError = runError
          ? `${runError} The spec was also not linked to its run (${why}).`
          : `The build was dispatched, but the spec was not linked to its run (${why}), so this station cannot tell that this spec already has a build.`;
      }
    }

    return {
      mission_id: missionId,
      run_id: runId,
      issue_number: issueNumber,
      issue_url: issueUrl,
      issue_link_error: issueLinkError,
      roster_error: rosterError,
      run_error: runError,
      // The seam's own answer, not this function's control flow: the queued
      // `agent_runs` row it says it inserted. Null when the insert came back
      // empty without erroring, and a caller sent to that mission's run page
      // would find nothing on it.
      run_started: runId !== null,
    };
  });

/** One Build mission a spec has already been dispatched to. */
export type SpecDispatch = {
  /** The spec the edge starts at. */
  prdId: string;
  missionId: string;
  missionTitle: string | null;
  /** `missions.status` exactly as stored, or null when the mission row was
   *  not readable (the edge survives a deleted or refused mission row). */
  status: string | null;
  /** When the edge was written, which is when the dispatch happened. */
  dispatchedAt: string;
};

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
