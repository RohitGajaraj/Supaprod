// SEAM-1 FOUNDATIONS: read side of the per-transition stage history.
// The StageTimeline block on every detail view (spec, mission, opportunity,
// decision) renders from these rows; RLS scopes visibility to workspace
// members plus own-row fallback.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface StageEventRow {
  id: string;
  entity_type: string;
  entity_id: string;
  from_stage: string | null;
  to_stage: string;
  actor: string;
  at: string;
}

interface StageEventsReadClient {
  from(table: string): {
    select(cols: string): {
      eq(
        col: string,
        val: string,
      ): {
        eq(
          col: string,
          val: string,
        ): {
          order(
            col: string,
            opts: { ascending: boolean },
          ): {
            limit(
              n: number,
            ): PromiseLike<{ data: StageEventRow[] | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
}

export const getStageEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        entityType: z.enum(["spec", "mission", "opportunity", "theme", "decision", "goal", "loop"]),
        entityId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const client = context.supabase as unknown as StageEventsReadClient;
    const { data: rows, error } = await client
      .from("stage_events")
      .select("id,entity_type,entity_id,from_stage,to_stage,actor,at")
      .eq("entity_type", data.entityType)
      .eq("entity_id", data.entityId)
      .order("at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return { events: rows ?? [] };
  });
