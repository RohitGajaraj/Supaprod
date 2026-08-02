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
    const { supabase, userId } = context;
    const title = `Pulse: ${data.surface.replace("_", " ")} ${data.useful ? "useful" : "not useful"}`;
    const content =
      data.note?.trim() ||
      (data.useful ? "Marked useful, no note." : "Marked not useful, no note.");
    const { error } = await supabase.from("signals").insert({
      // NOT NULL with no default, and this insert never set it, so the row was
      // rejected even after the source_kind fix. Two separate faults were
      // stacked on the same statement and fixing only the visible one left the
      // widget just as silent, which is the whole argument for the liveness
      // check that found this: nobody was ever going to notice from the outside.
      user_id: userId,
      source: "product_pulse",
      // `source_kind` is CHECK-constrained to pull_connector | web_scout |
      // mcp_source | webhook | manual (20260702202247_...sql:59). This wrote
      // "product_pulse", which is not in that list, so EVERY pulse insert has
      // been failing the constraint and throwing: the in-product thumbs up and
      // down has recorded nothing since the constraint landed. Confirmed on the
      // live database, where the source_kind census returns zero product_pulse
      // rows against 294 rows across the five legal values.
      //
      // The right value is `manual`: a pulse is a human telling us something in
      // their own words, which is exactly what that kind means, and the specific
      // origin is already carried by `source` (unconstrained text) and by the
      // tags below, so nothing is lost by conforming.
      source_kind: "manual",
      title,
      content,
      sentiment: data.useful ? "positive" : "negative",
      tags: ["product_pulse", data.surface],
      // external_id is deliberately NOT set. It was `pulse:<surface>:<targetId>`,
      // which is identical for every pulse on the same target, so the unique
      // index on (user_id, workspace_id, external_id) dropped every one after
      // the first: a user could never change their mind, and the same surface
      // could never be marked useful twice.
      //
      // That is the same call `sources/manual.ts` already makes for typed notes,
      // and for the same reason: repetition is evidence. Keying feedback by its
      // subject deletes the second and third time you heard it, which is exactly
      // the signal worth keeping. Dedup by external_id is for connectors
      // re-fetching a row that already exists, not for a human pressing a button
      // again.
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
