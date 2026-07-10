/**
 * PC-15: in-product feedback pulse. Writes straight into `signals` with
 * `source_kind='product_pulse'` -- the dogfood point of this row: our own
 * feedback on our own product becomes a real signal into the same
 * sense/cluster loop every other signal feeds, not a separate mailbox
 * nobody reads.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PULSE_SURFACES = ["teardown", "morning_brief", "composite_review"] as const;
export type PulseSurface = (typeof PULSE_SURFACES)[number];

export const submitPulse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        surface: z.enum(PULSE_SURFACES),
        targetId: z.string().max(200),
        useful: z.boolean(),
        note: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { supabase } = context;
    const title = `Pulse: ${data.surface.replace("_", " ")} ${data.useful ? "useful" : "not useful"}`;
    const content =
      data.note?.trim() ||
      (data.useful ? "Marked useful, no note." : "Marked not useful, no note.");
    const { error } = await supabase.from("signals").insert({
      source: "product_pulse",
      source_kind: "product_pulse",
      title,
      content,
      sentiment: data.useful ? "positive" : "negative",
      tags: ["product_pulse", data.surface],
      external_id: `pulse:${data.surface}:${data.targetId}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
