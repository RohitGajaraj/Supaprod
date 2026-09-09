/**
 * Mission Control Briefing (front-end reimagining) - the machine-authored
 * daily briefing for the Thread column.
 *
 * getBriefing answers "what happened" in receipts-first prose: what agents
 * finished, what is in flight, and how many calls wait on the human. It
 * composes the SAME reads the rest of the room uses (composition, never a
 * new capability):
 *
 *   - gates:      getApprovalsQueue (one count, one source - the 2026-07-18
 *                 ruling; the needs-you pill, the Spine, and this briefing
 *                 can never disagree).
 *   - finished:   stage_events completion transitions in the last 24 hours
 *                 (the SEAM-1 write path today-lanes lane 2 reads; the same
 *                 completion test the Spine uses via isCompletionEvent).
 *   - in flight:  agent_runs running or queued (the loop-state read).
 *
 * Prose rules (design-language-spec + Addendum 1.1): sharp-PM voice, past
 * tense receipts, plain numbers, no em dashes, NO cost figures anywhere
 * (cost-quiet, spec 7 - credits live behind the ReceiptLine kebab, never in
 * briefing prose). The zero state is honest and never empty: "Agents are
 * idle. Nothing waits on you."
 *
 * The composer (composeBriefing) is pure and unit-tested without a DB in
 * briefing.test.ts. stage_events postdates the generated Supabase types, so
 * the read goes through an untyped client - the documented today-lanes
 * precedent.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readApprovalsQueue, type ApprovalsQueueResult } from "@/lib/approvals-queue.functions";
/* One spelling of one caveat: the module that owns what the queue says when it
   cannot report itself in full owns this sentence too (Lane 1, 2026-09-09). */
import { QUEUE_UNREAD_LINE } from "@/components/approvals/not-the-whole-queue";
import { longDayInZone } from "@/lib/time-of-day";
import { zoneForUser } from "@/lib/profile-zone.server";
import {
  LOOP_STAGES,
  isCompletionEvent,
  relativePast,
  stageForEvent,
  stageForGate,
  type LoopStageEvent,
  type LoopStageId,
} from "@/lib/loop-state.functions";

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

/** One receipt for ReceiptLine rendering: past-tense text, honest time. */
export type BriefingReceipt = {
  id: string;
  /** The full past-tense sentence, relative time included. */
  text: string;
  at: string;
  stage: LoopStageId;
  /** 'human', an agent slug, or null - for the source chip, never for prose. */
  actor: string | null;
};

export type Briefing = {
  /** e.g. "Sunday, July 19". */
  dayLabel: string;
  /** Receipts-first prose. Never an empty array. */
  paragraphs: string[];
  /** Newest first, capped. Rendered with ReceiptLine (cost stays behind the kebab). */
  receipts: BriefingReceipt[];
  /** The same count the needs-you pill shows: the approvals queue, product-filtered. */
  needsYouCount: number;
};

// ---------------------------------------------------------------------------
// Pure composer (unit-tested, no DB)
// ---------------------------------------------------------------------------

/** A stage_events row as the briefing needs it (LoopStageEvent + identity). */
export type BriefingEvent = LoopStageEvent & { entity_id?: string | null };

export type BriefingInput = {
  /** stage_events from the last 24 hours, any order. */
  events: BriefingEvent[];
  /** agent_runs currently running or queued. */
  inFlightRuns: number;
  /** Pending gate counts keyed by stage (from the approvals queue). */
  gateCountByStage: Partial<Record<LoopStageId, number>>;
  /**
   * True when the queue this briefing counts could not be read. A failed read
   * arrives here as zero gates, which is indistinguishable from a clear queue,
   * and "Nothing waits on you" is then a claim the briefing cannot support
   * (2026-09-09, the server twin of Lane 1's own loading-guard defect: a
   * sentence standing on a read that had not answered).
   */
  queueUnread?: boolean;
  /** Injectable clock for tests. */
  now?: Date;
  /** The recipient's zone (profiles.timezone), which the day label and every receipt read in. */
  zone: string;
};

const MAX_RECEIPTS = 8;

const STAGE_LABEL: Record<LoopStageId, string> = {
  discover: "Discover",
  decide: "Decide",
  plan: "Plan",
  design: "Design",
  build: "Build",
  ship: "Ship",
  learn: "Learn",
};

/** "Plan" / "Plan and Build" / "Plan, Build, and Ship". */
function listJoin(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/** Past-tense receipt sentence per completion event. Honest time, no cost. */
export function receiptText(
  stage: LoopStageId,
  ev: BriefingEvent,
  now: Date,
  zone: string,
): string {
  const when = relativePast(ev.at, now, zone);
  switch (stage) {
    case "discover":
      if (ev.entity_type === "signal") return `New signals came in ${when}`;
      if (ev.entity_type === "theme") return `Signals clustered into themes ${when}`;
      return `Opportunities ranked ${when}`;
    case "decide":
      return `Decision recorded ${when}`;
    case "plan":
      return `Spec approved ${when}`;
    case "design":
      return `Design approved ${when}`;
    case "build":
      return `Build finished ${when}`;
    case "ship":
      return `Shipped ${when}`;
    case "learn":
      return `Outcome recorded ${when}`;
  }
}

/**
 * Compose the briefing from raw inputs. PURE.
 *
 * Paragraph plan:
 *   1. What finished (agents first, the human's own moves second), or the
 *      honest idle line when nothing did.
 *   2. What is in flight now (only when something is).
 *   3. How many calls wait, with the per-stage breakdown, or "Nothing waits
 *      on you."
 * Full zero state collapses to the single honest sentence pair.
 */
export function composeBriefing(input: BriefingInput): Briefing {
  const now = input.now ?? new Date();
  // In the recipient's zone: a briefing sent at 23:40 in Kolkata is for that
  // day there, not for the day it is in the Worker's own clock.
  const dayLabel = longDayInZone(now.toISOString(), input.zone);

  // Completion transitions only: a stage was produced, not merely touched.
  const completions: Array<{ stage: LoopStageId; ev: BriefingEvent }> = [];
  for (const ev of input.events) {
    const stage = stageForEvent(ev);
    if (!stage) continue;
    if (isCompletionEvent(stage, ev)) completions.push({ stage, ev });
  }
  completions.sort((a, b) => b.ev.at.localeCompare(a.ev.at));

  const receipts: BriefingReceipt[] = completions.slice(0, MAX_RECEIPTS).map(({ stage, ev }) => ({
    id: `${ev.entity_type}:${ev.entity_id ?? "unknown"}:${ev.at}`,
    text: receiptText(stage, ev, now, input.zone),
    at: ev.at,
    stage,
    actor: ev.actor ?? null,
  }));

  const machineDone = completions.filter((c) => c.ev.actor != null && c.ev.actor !== "human");
  const humanDone = completions.filter((c) => c.ev.actor === "human" || c.ev.actor == null);

  const needsYouCount = LOOP_STAGES.reduce(
    (sum, stage) => sum + (input.gateCountByStage[stage] ?? 0),
    0,
  );

  // Full zero state: the one honest sentence pair, never an empty array.
  if (completions.length === 0 && input.inFlightRuns === 0 && needsYouCount === 0) {
    return {
      dayLabel,
      paragraphs: [
        input.queueUnread
          ? `Agents are idle. ${QUEUE_UNREAD_LINE}`
          : "Agents are idle. Nothing waits on you.",
      ],
      receipts: [],
      needsYouCount: 0,
    };
  }

  const paragraphs: string[] = [];

  // 1. What finished.
  if (completions.length === 0 && input.inFlightRuns === 0) {
    paragraphs.push("Agents are idle. Nothing new finished in the last 24 hours.");
  } else if (completions.length === 0) {
    paragraphs.push("Nothing finished in the last 24 hours.");
  } else {
    const sentences: string[] = [];
    if (machineDone.length > 0) {
      const stages = LOOP_STAGES.filter((s) => machineDone.some((c) => c.stage === s)).map(
        (s) => STAGE_LABEL[s],
      );
      const n = machineDone.length;
      sentences.push(
        n === 1
          ? `Agents finished 1 piece of work in the last 24 hours at ${stages[0]}.`
          : `Agents finished ${n} pieces of work in the last 24 hours across ${listJoin(stages)}.`,
      );
    }
    if (humanDone.length > 0) {
      const h = humanDone.length;
      sentences.push(
        machineDone.length > 0
          ? `You moved ${h} ${h === 1 ? "item" : "items"} forward yourself.`
          : `You moved ${h} ${h === 1 ? "item" : "items"} forward in the last 24 hours. Agents finished nothing on their own.`,
      );
    }
    paragraphs.push(sentences.join(" "));
  }

  // 2. What is in flight.
  if (input.inFlightRuns > 0) {
    paragraphs.push(
      input.inFlightRuns === 1
        ? "1 agent run is in flight now."
        : `${input.inFlightRuns} agent runs are in flight now.`,
    );
  }

  // 3. What waits on the human.
  if (needsYouCount > 0) {
    const breakdown = LOOP_STAGES.filter((s) => (input.gateCountByStage[s] ?? 0) > 0).map(
      (s) => `${input.gateCountByStage[s]} at ${STAGE_LABEL[s]}`,
    );
    paragraphs.push(
      `${needsYouCount} ${needsYouCount === 1 ? "call waits" : "calls wait"} on you: ${breakdown.join(", ")}.`,
    );
  } else {
    paragraphs.push("Nothing waits on you.");
  }

  return { dayLabel, paragraphs, receipts, needsYouCount };
}

// ---------------------------------------------------------------------------
// The server function (composition over existing reads)
// ---------------------------------------------------------------------------

const GetBriefingSchema = z.object({
  workspaceId: z.string().uuid(),
  productId: z.string().uuid().optional(),
});

export const getBriefing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof GetBriefingSchema>) => GetBriefingSchema.parse(d))
  .handler(async ({ context, data }): Promise<Briefing> => {
    const { supabase } = context;
    // stage_events postdates the generated types (today-lanes precedent).
    const db = supabase as unknown as SupabaseClient;
    // The honest last-24h window today-lanes lane 2 uses (no reliable
    // per-workspace last-seen boundary exists yet).
    const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [queue, eventsRes, runsRes] = await Promise.all([
      // One count, one source: the same queue the pill and Spine read.
      /* A FAILED READ IS NOT A CLEAR QUEUE. This swallowed the throw into an
         empty list, and an empty list composes "Nothing waits on you", which
         is the one sentence the briefing may not say on a read it did not
         get. The flag travels to the composer, which says so instead. */
      readApprovalsQueue(context.supabase, context.userId, data.workspaceId).catch((e) => {
        console.error(
          `[briefing] the queue could not be read: ${e instanceof Error ? e.message : String(e)}`,
        );
        return { items: [] as ApprovalsQueueResult["items"], unread: true as const };
      }),
      db
        .from("stage_events")
        .select("entity_type,entity_id,to_stage,actor,at")
        .eq("workspace_id", data.workspaceId)
        .gte("at", sinceIso)
        .order("at", { ascending: false })
        .limit(200),
      db
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId)
        .in("status", ["running", "queued"]),
    ]);

    // Product scoping mirrors getLoopState: gates attributed to a DIFFERENT
    // project are dropped; workspace-wide gates (projectId null) stay,
    // because hiding a pending gate is worse than over-showing it.
    const gateCountByStage: Partial<Record<LoopStageId, number>> = {};
    for (const item of queue.items) {
      if (data.productId && item.projectId && item.projectId !== data.productId) continue;
      const stage = stageForGate(item.kindKey);
      gateCountByStage[stage] = (gateCountByStage[stage] ?? 0) + 1;
    }

    return composeBriefing({
      events: (eventsRes.data ?? []) as BriefingEvent[],
      inFlightRuns: runsRes.count ?? 0,
      gateCountByStage,
      queueUnread: (queue as { unread?: boolean }).unread === true,
      zone: await zoneForUser(context.supabase as unknown as SupabaseClient, context.userId),
    });
  });
