import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const { data: created, error: cerr } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select()
        .single();
      if (cerr) throw new Error(cerr.message);
      return { profile: created };
    }
    return { profile: data };
  });

const UpdateSchema = z.object({
  full_name: z.string().min(1).max(80).optional(),
  display_name: z.string().min(1).max(40).optional(),
  role: z.string().min(1).max(80).optional(),
  timezone: z.string().min(1).max(60).optional(),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
  working_hours_start: z.number().int().min(0).max(23).optional(),
  working_hours_end: z.number().int().min(1).max(24).optional(),
  default_model: z.string().min(1).max(80).optional(),
  /**
   * THE MODEL EVERY AUTONOMOUS RUN USES, and it was silently discarded on every
   * save. `z.object` strips unknown keys rather than refusing them, so the
   * Settings control sent `{agentic_model}`, the schema reduced the patch to
   * nothing, the mutation resolved, and the success toast fired. Reloading
   * showed the old value.
   *
   * It is not a cosmetic preference. `resolveAgenticModel` reads it for every
   * background tick (ai/platform-keys.server.ts), and cluster and reflection
   * read it directly, so a workspace pinning a cheaper or stronger model for
   * unattended work was pinning nothing and every tick ran on the default.
   * `default_model` sat beside it in this same schema and DID work, which is
   * why nobody caught it.
   */
  agentic_model: z.string().min(1).max(80).optional(),
  voice_anchor_text: z.string().max(2000).optional(),
  onboarded: z.boolean().optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const patch: {
      full_name?: string;
      display_name?: string;
      role?: string;
      timezone?: string;
      avatar_url?: string | null;
      working_hours_start?: number;
      working_hours_end?: number;
      default_model?: string;
      agentic_model?: string;
      voice_anchor_text?: string | null;
      onboarded?: boolean;
      updated_at: string;
    } = { ...data, updated_at: new Date().toISOString() };
    if (data.avatar_url === "") patch.avatar_url = null;
    if (data.voice_anchor_text === "") patch.voice_anchor_text = null;
    const { data: row, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { profile: row };
  });
