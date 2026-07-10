/**
 * PC-04 / PC-06: activation event tracking.
 *
 * trackActivation writes into activation_events (migration
 * 20260710210000), the anonymous, pre-signup sibling of PC-06's
 * funnel_milestones (39f6779a): a demo visitor has no user_id/workspace_id
 * yet, so it cannot use that table. PC-06 extends the canonical event set
 * here rather than duplicating the write path.
 *
 * activation_events is new since the last generated Supabase types; the
 * admin client is cast to the untyped SupabaseClient the same way existing
 * new-column reads in this repo do (see artifact-rewind.functions.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const db = supabaseAdmin as unknown as SupabaseClient;

export const ACTIVATION_EVENTS = [
  "demo_viewed",
  "demo_to_signup",
  "signup_completed",
  "source_connected",
  "notes_pasted",
  "first_teardown_viewed",
  "first_mission_dispatched",
] as const;

export type ActivationEventName = (typeof ACTIVATION_EVENTS)[number];

export const trackActivation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        event: z.enum(ACTIVATION_EVENTS),
        sessionId: z.string().max(200).optional(),
        userId: z.string().uuid().optional(),
        workspaceId: z.string().uuid().optional(),
        props: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    // Best-effort: a failed analytics write must never break the page it
    // instruments (a demo visitor should never see an error from this).
    try {
      await db.from("activation_events").insert({
        event_name: data.event,
        session_id: data.sessionId ?? null,
        user_id: data.userId ?? null,
        workspace_id: data.workspaceId ?? null,
        props: data.props ?? {},
      });
    } catch (err) {
      console.error("[trackActivation] write failed", err);
    }
    return { ok: true };
  });
