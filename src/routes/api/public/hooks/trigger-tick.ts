import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  evaluateTriggers,
  shouldAutoPromote,
  AUTO_TRIGGER_DAILY_CAP,
  MAX_PROPOSALS_PER_TICK,
  type ThemeState,
  type OutcomeState,
  type SignalSenseState,
} from "@/lib/sensing/trigger";
import { withJobRunHttp } from "@/lib/observability";
import { recordStageEvent } from "@/lib/stage-events.server";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { decideDecisionReview, DECISION_RECORD_EFFECT } from "@/lib/decision-gate";
import { recordAutoApproval } from "@/lib/decision-gate.server";
import { recordDecisionOrigins } from "@/lib/lineage.functions";

/**
 * AMBIENT-TRIGGER (v11 #4) + SF-AUTOTRIGGER (Phase 3) trigger-tick.
 *
 * Two-tier self-driving policy layer:
 *
 * TIER 1 — HITL proposals (always on when auto_trigger_enabled=true):
 *   For every opted-in workspace, evaluates accumulated state (clusters, missed
 *   outcomes, signal volumes) and self-originates missions with status='proposed'.
 *   A proposed mission costs ZERO AI spend; nothing drives it until somebody
 *   launches it — a person through promoteMission (src/lib/missions.functions.ts)
 *   or Tier 2 below.
 *   THE HITL GATE IS THE MISSION, NOT ITS RECEIPT. The `decisions` row written
 *   alongside it is a Trust-Ledger receipt, and `decideDecisionReview`
 *   (src/lib/decision-gate.ts) decides its status rather than this file naming
 *   one. Born 'pending' unconditionally, it had put 170 items in front of the
 *   founder that no click of his could move; the mission's own "Review & launch"
 *   is where the actual decision lives. Every auto-approval writes a
 *   workspace_audit_log row carrying the gate's reasons.
 *
 * TIER 2 — Auto-LAUNCH (SF-AUTOTRIGGER, activated by BRAIN_AUTO_TRIGGER=1):
 *   After creating a proposed mission, if all four conditions hold, it is
 *   launched on the spot — flipped to 'running' and handed to the orchestrator:
 *     1. BRAIN_AUTO_TRIGGER=1  — founder's circuit breaker (default OFF)
 *     2. proposal.reversible   — only analysis missions (Watch/Listen), not write ops
 *     3. ambient arc           — no missions currently running/in_progress in workspace
 *     4. daily cap             — fewer than AUTO_TRIGGER_DAILY_CAP auto-runs today
 *   The launch is recorded via auto_trigger_source='auto' on the mission row and
 *   annotated on the Trust-Ledger decision receipt for full auditability.
 *
 *   THIS TIER USED TO WRITE status='queued' AND STOP THERE, and that is why it is
 *   worded as a launch now. Nothing in this product consumes a mission at
 *   'queued': resume-runs advances running/in_progress, maybeCompleteMission
 *   finalizes running/in_progress, and the mission page read 'queued' as
 *   already-live. It was a terminal state wearing a non-terminal label, and this
 *   line wrote 6 of the 8 missions found stranded there on 2026-08-06 (the other
 *   2 came from the human button, fixed in the same wave). Tier 2 now makes the
 *   same two moves the human path makes, in the same order, rather than a second
 *   launch mechanism: guarded flip to 'running', then one orchestrator run to
 *   plan and dispatch wave 0. The deterministic engine carries it from there.
 *
 * Bounded: ≤5 workspaces per tick, ≤5 proposals per workspace, idempotent on
 * title, and — since a launched mission fills its own workspace's ambient arc —
 * at most ONE auto-launch per workspace per tick.
 */

/** Set BRAIN_AUTO_TRIGGER=1 in Lovable project settings to activate auto-promotion. */
const BRAIN_AUTO_TRIGGER = process.env.BRAIN_AUTO_TRIGGER === "1";

const MAX_WORKSPACES = 5;
/* Open = this workspace already has this work in hand, so do not re-propose it.
 *
 * 'queued' is KEPT here and is now legacy-only: nothing writes it any more (this
 * file was the last writer, see Tier 2 below), but 8 rows were left at it and a
 * restored backup could hold more. They must keep suppressing their own
 * re-proposal while they exist — and note the suppression is only temporary now
 * that resume-runs adopts a 'queued' mission into 'running': it lifts by itself
 * when the mission reaches a terminal status, which is exactly what could never
 * happen while the row sat at 'queued' with nothing able to move it. */
const OPEN_MISSION_STATUSES = ["proposed", "queued", "running", "in_progress", "waiting_approval"];

export const Route = createFileRoute("/api/public/hooks/trigger-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRunHttp("cron.trigger-tick", async () => {
          const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id, last_auto_trigger_at")
            .eq("auto_trigger_enabled", true)
            .order("last_auto_trigger_at", { ascending: true, nullsFirst: true })
            .limit(MAX_WORKSPACES);

          if (error) {
            const code = (error as { code?: string }).code;
            if (code === "42703" || code === "PGRST204") {
              return json({ ok: true, processed: 0, note: "auto_trigger not migrated yet" });
            }
            // Thrown, not returned as a 500. Returning a Response RESOLVES,
            // and withJobRun scored any resolved callback as status='ok', so
            // this line wrote a green ledger row for a tick that could not read
            // its own inputs. withJobRunHttp rebuilds the identical JSON 500
            // outside the wrapper, so pg_cron sees exactly what it saw before.
            throw new Error(`workspaces read failed: ${error.message}`);
          }

          const results: Array<{ workspace_id: string; proposed?: number; error?: string }> = [];
          for (const ws of workspaces ?? []) {
            try {
              if (!ws.owner_id) {
                results.push({ workspace_id: ws.id, error: "no owner" });
                continue;
              }
              const proposed = await runTriggers(ws.owner_id, ws.id);
              await supabaseAdmin
                .from("workspaces")
                .update({ last_auto_trigger_at: new Date().toISOString() })
                .eq("id", ws.id);
              results.push({ workspace_id: ws.id, proposed });
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
        });
      },
    },
  },
});

/** Evaluate triggers for one workspace and originate the proposed missions + receipts.
 *  Returns the number of new proposals written. Spend-free (proposed missions never execute). */
async function runTriggers(ownerId: string, workspaceId: string): Promise<number> {
  const cutoff24h = new Date(Date.now() - 24 * 3600_000).toISOString();

  // State in: clusters (themes) + recorded outcomes (learnings) + signal-volume counts.
  const [
    { data: themes },
    { data: learnings },
    { data: openMissions },
    { count: newSigCount },
    { count: customerSigCount },
  ] = await Promise.all([
    supabaseAdmin
      // `novelty` is the whole reason this loop stopped re-asking answered
      // questions. It was computed by the embedding sweeper and stored the whole
      // time; this SELECT simply never asked for it, so evaluateTriggers judged
      // every cluster blind and raised "alert fatigue" as new seven times in two
      // days. Dropping the column from this list silently restores that bug, and
      // no type error would catch it (a wrong column in a select string
      // typechecks clean here and only shows up at runtime).
      .from("themes")
      .select("id, title, frequency, severity, status, novelty")
      .eq("user_id", ownerId)
      .limit(100),
    supabaseAdmin
      .from("learnings")
      .select("id, verdict, summary, opportunity_id")
      .eq("user_id", ownerId)
      .eq("verdict", "missed")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("missions")
      // auto_trigger_source, not the title, is how the tick finds its own work.
      // See the openTitles note below for why this had to change with autoTitle.
      .select("title, status, auto_trigger_source")
      .eq("workspace_id", workspaceId)
      .in("status", OPEN_MISSION_STATUSES)
      .limit(200),
    // New signals in the last 24h (Watch threshold)
    supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("created_at", cutoff24h),
    // Customer feedback signals from pull connectors in the last 24h (Listen threshold).
    // Bounded to the same 24h window as newSigCount so a workspace with a large
    // historical backlog doesn't trigger perpetual re-proposals.
    supabaseAdmin
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("source_kind", "pull_connector")
      .gte("created_at", cutoff24h),
  ]);

  /* HOW THE TICK FINDS ITS OWN WORK, and why it can no longer be the title.
   *
   * This filtered on isAutoMissionTitle, i.e. titles starting with "[auto] ".
   * That prefix was a machine dedup key living in a DISPLAY column and it
   * leaked to the founder three times, so autoTitle stopped writing it and
   * migration 20260805120000 stripped it from all 195 existing rows.
   *
   * THE TWO HALVES MUST SHIP TOGETHER, and the one time they did not, this
   * became a live incident: with clean titles and a title-based filter,
   * isAutoMissionTitle matched NOTHING, openTitles came back empty, dedup was
   * silently disabled, and the tick re-proposed its whole backlog every 15
   * minutes (15 missions a tick, roughly 1400 a day) until it was caught by
   * reading production rather than the diff.
   *
   * So the filter is the column that the insert below stamps. If you change one
   * of those two lines, change the other in the same commit. */
  const openTitles = new Set(
    (openMissions ?? [])
      .filter((m) => (m as { auto_trigger_source?: string | null }).auto_trigger_source != null)
      .map((m) => m.title as string | null)
      .filter((t): t is string => typeof t === "string" && t.length > 0),
  );

  const senseState: SignalSenseState = {
    newSignalCount: newSigCount ?? 0,
    customerSignalCount: customerSigCount ?? 0,
  };

  // SW-3 mission 3.2: pull the candidate list past the per-tick cap once, so
  // each written decision receipt can record the losing candidates (the paths
  // not taken this tick) honestly. The first MAX_PROPOSALS_PER_TICK rows are
  // byte-identical to the default call (same sort, same slice).
  const allCandidates = evaluateTriggers(
    {
      themes: (themes ?? []) as ThemeState[],
      outcomes: (learnings ?? []) as OutcomeState[],
      signals: senseState,
    },
    openTitles,
    { max: MAX_PROPOSALS_PER_TICK + 8 },
  );
  const proposals = allCandidates.slice(0, MAX_PROPOSALS_PER_TICK);
  if (proposals.length === 0) return 0;

  // The candidates the cap cut this tick; empty when nothing was rejected
  // (never fabricated). Shared by every receipt written in this tick.
  const alternativesConsidered = allCandidates
    .slice(MAX_PROPOSALS_PER_TICK, MAX_PROPOSALS_PER_TICK + 8)
    .map((l) => ({
      title: l.title.slice(0, 280),
      reason_rejected:
        `Considered this tick but not proposed: priority ${l.priority} fell below the ${MAX_PROPOSALS_PER_TICK}-proposal cap.`.slice(
          0,
          500,
        ),
    }));

  // SF-AUTOTRIGGER: pre-fetch ambient + daily-cap counts once per workspace tick
  // (only when the flag is on, to avoid two extra DB round-trips otherwise).
  let ambientCount = 0;
  let autoTodayCount = 0;
  if (BRAIN_AUTO_TRIGGER) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const [{ count: ac }, { count: atc }] = await Promise.all([
      // Ambient arc: workspace is not mid-sprint when no mission is actively running.
      // waiting_approval = paused mid-run for HITL input, so the workspace is still active.
      supabaseAdmin
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        // blocked = stalled mid-sprint on a gate, an active state like
        // running/in_progress/waiting_approval. 'queued' is legacy-only (see
        // OPEN_MISSION_STATUSES above): nothing writes it now, and a leftover row
        // is counted here so a workspace holding one is not treated as idle
        // before resume-runs adopts it.
        .in("status", ["running", "in_progress", "waiting_approval", "queued", "blocked"]),
      // Daily cap: count auto-promoted missions created today (created_at is immutable;
      // updated_at can drift as a mission runs/completes, which would falsely inflate the cap).
      supabaseAdmin
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .filter("auto_trigger_source", "eq", "auto")
        .gte("created_at", todayStart.toISOString()),
    ]);
    ambientCount = ac ?? 0;
    autoTodayCount = atc ?? 0;
  }

  let written = 0;
  for (const p of proposals) {
    // Resolve the pre-assigned sense agent UUID when the proposal targets one.
    let currentAgentId: string | null = null;
    if (p.agentSlug) {
      const { data: agentRow } = await supabaseAdmin
        .from("agents")
        .select("id")
        .eq("user_id", ownerId)
        .eq("slug", p.agentSlug)
        .maybeSingle();
      currentAgentId = (agentRow as { id?: string } | null)?.id ?? null;
    }

    // 1. Self-originate the mission in 'proposed' (resume-runs ignores it; no spend, reversible).
    const { data: mission, error: mErr } = await supabaseAdmin
      .from("missions")
      .insert({
        user_id: ownerId,
        workspace_id: workspaceId,
        title: p.title,
        goal: p.goal,
        status: "proposed",
        /* The column openTitles above reads. 'trigger' and NOT 'auto' on
         * purpose: 'auto' means auto-PROMOTED and is counted for the daily
         * spend cap, so reusing it here would trip that cap on the first
         * proposal of every day. The CHECK constraint allows both. */
        auto_trigger_source: "trigger",
        ...(currentAgentId ? { current_agent_id: currentAgentId } : {}),
      } as never)
      .select("id")
      .single();
    if (mErr || !mission) continue;

    const missionId = (mission as { id: string }).id;
    await recordStageEvent(supabaseAdmin, {
      entityType: "mission",
      entityId: missionId,
      to: "proposed",
      actor: p.agentSlug ?? "strategist",
      workspaceId,
      userId: ownerId,
    });

    /* WILL THIS PROPOSAL SPEND MONEY IN A MOMENT? Decided HERE, before the
     * receipt is written, because the receipt's own status depends on the
     * answer and step 3 below is too late to ask.
     *
     * The four inputs are the same four step 3 reads and nothing mutates them
     * in between — `ambientCount` and `autoTodayCount` only move inside the
     * launch branch — so this is the same call, moved earlier, not a second
     * policy. If you ever add a mutation between here and step 3, this constant
     * is what goes stale, and it goes stale in the permissive direction. */
    const launchesNow = shouldAutoPromote({
      flagEnabled: BRAIN_AUTO_TRIGGER,
      reversible: p.reversible,
      ambientCount,
      autoTodayCount,
    });

    /* THE 170 ROWS THIS DECIDES, and why they were never a question for a human.
     *
     * This receipt used to be born 'pending', unconditionally. On 2026-08-10
     * that had produced 170 of the 172 decisions waiting on the founder. Not
     * one of them was a gate: approving a decision flips `decisions.status` and
     * writes a stage event, and that is the whole of it (`updateDecision`,
     * `routeDecision`). The mission the receipt describes sits at 'proposed'
     * behind its OWN gate — Studio fetches proposed missions separately for
     * exactly that reason (studio.functions.ts) and offers "Review & launch".
     * So the queue asked 170 times for a click that moved nothing, next to a
     * real gate on another screen. That is the opposite of agentic-first.
     *
     * CONFIDENCE IS 'medium', WHICH IS THE HONEST WORD AND NOT A SHRUG.
     * The tier answers "is the row I am writing true", and the row says the
     * loop raised this proposal for this stated reason, which the tick has just
     * done. confidence.ts is explicit that a writer with no strong signal says
     * medium rather than fabricating high, and there is no cheap signal here
     * that bears on the row's truth. NOT the proposal's merit: a thin cluster
     * is a weak idea, not a false receipt, and gating the receipt on the merit
     * of work nobody has agreed to do yet would put all 170 straight back. */
    const gate = decideDecisionReview({
      sourceKind: "mission",
      agentSlug: p.agentSlug ?? "strategist",
      confidence: "medium",
      effect: DECISION_RECORD_EFFECT,
      /* Both halves are real signals, and both refuse rather than assume.
       * `launchesNow` is spend: a mission about to be handed to the orchestrator
       * is money leaving, and the founder's bar says spend always asks even
       * when the flag that allowed it is his own. `p.reversible` is the field
       * TriggerProposal has carried since sensing shipped, documented there as
       * existing so "an activation policy can always HITL-gate an irreversible
       * one" — this is that policy, finally reading it. */
      commitsBeyondTheRecord: launchesNow || !p.reversible,
    });

    // 2. Record the trigger + rationale as a Trust-Ledger decision receipt.
    //    (id selected back so its stage events can reference it.)
    const { data: decisionRow } = await supabaseAdmin
      .from("decisions")
      .insert({
        user_id: ownerId,
        workspace_id: workspaceId,
        title: p.title,
        rationale: p.rationale,
        status: gate.status,
        source_kind: "mission",
        mission_id: missionId,
        decided_by_agent_slug: p.agentSlug ?? "strategist",
        /* The other half of retiring the "[auto] " title marker, and it was
         * nearly missed. The mission insert above stamps auto_trigger_source,
         * but a DECISION carried its provenance only in the title prefix, so
         * once autoTitle stopped writing that prefix, every newly raised
         * decision would have arrived indistinguishable from one a human wrote.
         *
         * The "Auto" chip and the "Raised automatically by the loop" line read
         * this column now, and the backfill in migration 20260805120000 set it
         * on all 84 existing rows. Without this line the backfill would have
         * been a one-off and provenance would have quietly stopped from the
         * moment the marker was retired. */
        auto_origin: true,
        // SW-3: the losing candidates this proposal beat, when any were cut.
        ...(alternativesConsidered.length
          ? { alternatives_considered: alternativesConsidered }
          : {}),
      } as never)
      .select("id")
      .single();
    const decisionId = (decisionRow as { id: string } | null)?.id ?? null;
    if (decisionId) {
      await recordStageEvent(supabaseAdmin, {
        entityType: "decision",
        entityId: decisionId,
        to: gate.status,
        actor: p.agentSlug ?? "strategist",
        workspaceId,
        userId: ownerId,
      });
      /**
       * THE LARGEST DECISION DOOR IN THE PRODUCT, AND IT STAMPED NOTHING.
       *
       * Measured 2026-08-10: 105 of 154 real decisions carry
       * `source_kind='mission'` and not one had an edge saying WHICH mission. 84
       * of those come through here, so the graph could not answer "what produced
       * this call" for the majority of calls the product makes.
       *
       * The guard that exists to catch exactly this could not see it. It holds a
       * hardcoded list of four caller files and this route is not among them, so
       * it was green over the biggest gap it was written to find — a list of
       * known doors can only ever prove the doors somebody already thought of.
       *
       * `recordDecisionOrigins` rather than an inline `recordLineageSafe`,
       * because the workspace rule is the whole point: `artifact_lineage
       * .workspace_id` defaults to the CALLER'S default workspace, not the one
       * the artifacts live in, and a fifth copy of that reasoning is a fifth
       * chance to get WM-F1 wrong. It is fail-soft, so a transport failure on a
       * provenance stamp can never fail the trigger that produced the decision.
       */
      await recordDecisionOrigins(supabaseAdmin, ownerId, {
        decisionId,
        missionId,
        workspaceId,
        createdByAgent: p.agentSlug ?? "strategist",
        rationale: "The mission this trigger receipt was raised for",
      });
      if (gate.action === "auto_approve") {
        // The trail for a receipt the founder will never be shown. Written
        // immediately, because "why was I not asked about this" is a question
        // that only ever arrives after the fact.
        await recordAutoApproval(supabaseAdmin, {
          decisionId,
          workspaceId,
          userId: ownerId,
          agentSlug: p.agentSlug ?? "strategist",
          missionId,
          sourceKind: "mission",
          writtenBy: "runTriggers (routes/api/public/hooks/trigger-tick.ts)",
          decision: gate,
        });
      }
    }
    written++;

    // 3. SF-AUTOTRIGGER: auto-LAUNCH this proposal when all four conditions hold.
    //    Both in-tick counters move the moment the flip lands, so the cap and the
    //    ambient arc are enforced within this tick and not just across ticks.
    //    `launchesNow` was decided above, before the receipt, because the
    //    receipt's status depends on it — same call, same four inputs.
    if (launchesNow) {
      const capNote = `[auto-launched: ambient + reversible + cap ${autoTodayCount + 1}/${AUTO_TRIGGER_DAILY_CAP}]`;
      // NOTE(MEDIUM-1): ambient + cap counts are read once per tick with no DB-level lock.
      // Two concurrent ticks could both pass the cap check (worst-case: 2x cap promotions).
      // Acceptable for v1 (feature behind BRAIN_AUTO_TRIGGER flag, default OFF).
      // TODO: use pg_advisory_lock or a DB function for atomic check-and-promote.

      /* THE FLIP IS TO 'running', NOT 'queued', AND IT IS READ BACK.
       *
       * Why 'running': see Tier 2 in the file docblock. 'queued' is a label no
       * consumer in this product acts on, and this line is where 6 of the 8
       * stranded missions were written.
       *
       * Why .select("id"): supabase-js RESOLVES a refused write, so an RLS
       * refusal or a lost race against another tick returns error null and an
       * EMPTY row set. Without reading the rows back, that is indistinguishable
       * from a successful launch, and we would go on to spend an orchestrator
       * run on a mission whose status never moved. The .eq("status","proposed")
       * guard is the CAS: this row was inserted as 'proposed' a few lines up,
       * and if anything else has touched it since, this tick is not the launcher. */
      const { data: launched, error: flipErr } = await supabaseAdmin
        .from("missions")
        .update({
          status: "running",
          auto_trigger_source: "auto",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", missionId)
        .eq("status", "proposed")
        .select("id");
      if (flipErr || !launched || launched.length === 0) {
        console.error("[SF-AUTOTRIGGER] mission launch flip failed", {
          missionId,
          err: flipErr?.message ?? "write refused or status already moved (no row updated)",
        });
      } else {
        autoTodayCount++; // mission IS launched; count even if the receipt update fails below
        /* The workspace is no longer idle, so condition 3 (ambient arc) is now
         * false for the rest of this tick. That is the rule's own meaning, and it
         * also bounds this cron to one orchestrator run per workspace per tick —
         * which matters because the launch below is a full model loop inside a
         * Worker invocation, not a status write. */
        ambientCount++;
        await recordStageEvent(supabaseAdmin, {
          entityType: "mission",
          entityId: missionId,
          from: "proposed",
          to: "running",
          actor: p.agentSlug ?? "strategist",
          workspaceId,
          userId: ownerId,
        });

        /* The receipt is annotated BEFORE the loop runs, so the audit record is
         * complete even if the Worker is evicted mid-launch.
         *
         * THE STATUS IS NO LONGER TOUCHED HERE, and that is the change worth
         * reading. This line used to write `status: "approved"`: the loop
         * launched a mission, committed real model spend to it, and closed its
         * own receipt in the same breath, so the one event on this path a person
         * would actually want to know about was the one they were never shown.
         * The gate above already decided this receipt 'pending' for exactly that
         * reason — `launchesNow` is spend, and the founder's bar is that spend
         * always asks, whatever else is true and whoever set the flag that
         * allowed it. Flipping it back here would make the gate a no-op on the
         * only path in this file where money moves. The capNote still lands,
         * because the annotation was never the problem. */
        const { error: dErr } = await supabaseAdmin
          .from("decisions")
          .update({ rationale: p.rationale + " " + capNote } as never)
          .eq("mission_id", missionId);
        if (dErr) {
          console.error("[SF-AUTOTRIGGER] decision receipt update failed, audit gap", {
            missionId,
            err: dErr.message,
          });
        }

        /* START THE WORK. Everything here mirrors promoteMission's launch step
         * (src/lib/missions.functions.ts), which mirrors startOrchestratedMission
         * — one launch mechanism, three doors into it. */
        try {
          // Self-healing, as both of those paths do before their own runAgentLoop:
          // seed_default_agents seeds 'orchestrator' at signup, but an account
          // restored from an older backup would otherwise fail here forever with
          // "Unknown agent: orchestrator". Idempotent; cheap.
          const { error: seedErr } = await supabaseAdmin.rpc("seed_orchestrator_agent", {
            p_user_id: ownerId,
          });
          if (seedErr) throw new Error(`seed orchestrator failed: ${seedErr.message}`);
          await runAgentLoop(supabaseAdmin, ownerId, {
            agentSlug: "orchestrator",
            goal: p.goal,
            missionId,
            workspaceId,
          });
        } catch (e) {
          /* A launch that threw must not leave the mission at 'running' with no
           * run and no plan. resume-runs would eventually re-plan it, but the
           * cause is known HERE and nowhere else, so halt it here.
           *
           * The halt-mark is itself a write and gets both checks: a refused halt
           * that went unread would leave the row at 'running' while the stage
           * event below asserted running→halted, which is a worse record than no
           * record. The stage event is only written when a row actually moved. */
          const { data: haltedRows, error: haltErr } = await supabaseAdmin
            .from("missions")
            .update({ status: "halted", updated_at: new Date().toISOString() })
            .eq("id", missionId)
            .eq("status", "running")
            .select("id");
          if (haltErr || !haltedRows || haltedRows.length === 0) {
            console.error("[SF-AUTOTRIGGER] launch failed AND the halt-mark did not land", {
              missionId,
              launchErr: e instanceof Error ? e.message : String(e),
              haltErr: haltErr?.message ?? "write refused or status already moved",
            });
          } else {
            console.error("[SF-AUTOTRIGGER] launch failed, mission halted", {
              missionId,
              err: e instanceof Error ? e.message : String(e),
            });
            await recordStageEvent(supabaseAdmin, {
              entityType: "mission",
              entityId: missionId,
              from: "running",
              to: "halted",
              actor: "system",
              workspaceId,
              userId: ownerId,
            });
          }
          // Deliberately not rethrown: one workspace's failed launch must not
          // abort the remaining proposals in this tick. The caller's per-workspace
          // try/catch is for unexpected faults, not for a handled one.
        }
      }
    }
  }
  return written;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
