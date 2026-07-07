/**
 * SW-4 / mission 3.10 LOOP MODE: hidden crons promoted to user-owned loops.
 *
 * A loop is a governed recurring mission: pick a kind (each wraps a pass the
 * platform already runs as a hidden cron), pick a cadence, and the loop-tick
 * cron runs it on schedule. Every run writes a loop_runs receipt (when, what
 * happened, what it cost) and the pause switch is the user's, not ours.
 *
 * The generated Database types lag the new `loops`/`loop_runs` tables until
 * the next regeneration, so the client is cast once per handler (the goals /
 * stage-events precedent) and the query shapes stay explicit.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recordStageEvent } from "@/lib/stage-events.server";
import { LOOP_KINDS, isLoopKind, type LoopRow, type LoopStatus } from "@/lib/loops.shared";
import { runLoopPass, type LoopPassResult } from "@/lib/loops.server";

export interface LoopRunItem {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  summary: string | null;
  error_message: string | null;
  tokens: number | null;
  cost_usd: number | null;
}

export interface LoopListItem extends LoopRow {
  created_at: string;
  /** Newest first, capped. */
  recent_runs: LoopRunItem[];
  run_count: number;
  total_cost_usd: number;
}

const LOOP_STATUSES = ["active", "paused", "archived"] as const;
const LOOP_KIND_KEYS = Object.keys(LOOP_KINDS) as [string, ...string[]];
const RECENT_RUNS_PER_LOOP = 5;

export const listLoops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LoopListItem[]> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: loops, error } = await db
      .from("loops")
      .select("id, user_id, workspace_id, kind, title, cadence, status, last_run_at, next_run_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      // Table not migrated yet: render the honest empty state, not a crash.
      if (error.code === "42P01" || error.code === "PGRST205") return [];
      throw new Error(error.message);
    }
    const rows = (loops ?? []) as Array<LoopRow & { created_at: string }>;
    if (rows.length === 0) return [];

    const { data: runs } = await db
      .from("loop_runs")
      .select("id, loop_id, started_at, finished_at, status, summary, error_message, tokens, cost_usd")
      .in("loop_id", rows.map((l) => l.id))
      .order("started_at", { ascending: false })
      .limit(200);

    const byLoop = new Map<string, LoopRunItem[]>();
    const countByLoop = new Map<string, number>();
    const costByLoop = new Map<string, number>();
    for (const r of (runs ?? []) as Array<LoopRunItem & { loop_id: string }>) {
      countByLoop.set(r.loop_id, (countByLoop.get(r.loop_id) ?? 0) + 1);
      costByLoop.set(r.loop_id, (costByLoop.get(r.loop_id) ?? 0) + Number(r.cost_usd ?? 0));
      const list = byLoop.get(r.loop_id) ?? [];
      if (list.length < RECENT_RUNS_PER_LOOP) {
        const { loop_id: _drop, ...item } = r;
        list.push(item);
      }
      byLoop.set(r.loop_id, list);
    }

    return rows.map((l) => ({
      ...l,
      recent_runs: byLoop.get(l.id) ?? [],
      run_count: countByLoop.get(l.id) ?? 0,
      total_cost_usd: Math.round((costByLoop.get(l.id) ?? 0) * 1e6) / 1e6,
    }));
  });

export const createLoop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        kind: z.enum(LOOP_KIND_KEYS),
        cadence: z.enum(["hourly", "daily", "weekly"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<{ loop: LoopRow; firstRun: LoopPassResult | null }> => {
    if (!isLoopKind(data.kind)) throw new Error(`Unknown loop kind: ${data.kind}`);
    const spec = LOOP_KINDS[data.kind];
    const db = context.supabase as unknown as SupabaseClient;
    const { data: loop, error } = await db
      .from("loops")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        title: spec.label,
        cadence: data.cadence ?? spec.defaultCadence,
      } as never)
      .select("id, user_id, workspace_id, kind, title, cadence, status, last_run_at, next_run_at")
      .single();
    if (error || !loop) throw new Error(error?.message ?? "Could not create the loop");
    const row = loop as LoopRow;

    await recordStageEvent(db, {
      entityType: "loop",
      entityId: row.id,
      from: null,
      to: "active",
      actor: "human",
      workspaceId: row.workspace_id,
      userId: context.userId,
    });

    // The loop starts working immediately: one inline run, best-effort, so
    // there is run history to look at without waiting for the tick. Failure
    // is honest and non-fatal; the loop-tick picks it up on schedule.
    let firstRun: LoopPassResult | null = null;
    try {
      firstRun = await runLoopPass(db, row);
    } catch (e) {
      console.error(`[loops] first run failed for ${row.id}:`, e instanceof Error ? e.message : e);
    }

    return { loop: row, firstRun };
  });

export const setLoopStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ loopId: z.string().uuid(), status: z.enum(LOOP_STATUSES) }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: prior, error: readErr } = await db
      .from("loops")
      .select("id, status, workspace_id")
      .eq("id", data.loopId)
      .single();
    if (readErr || !prior) throw new Error(readErr?.message ?? "Loop not found");

    const { error } = await db
      .from("loops")
      .update({ status: data.status, updated_at: new Date().toISOString() } as never)
      .eq("id", data.loopId);
    if (error) throw new Error(error.message);

    await recordStageEvent(db, {
      entityType: "loop",
      entityId: data.loopId,
      from: (prior as { status: string }).status,
      to: data.status,
      actor: "human",
      workspaceId: (prior as { workspace_id: string }).workspace_id,
      userId: context.userId,
    });
    return { ok: true };
  });

export type { LoopStatus };
