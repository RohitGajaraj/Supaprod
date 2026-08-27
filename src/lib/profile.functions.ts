import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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

/**
 * A CONTROL THAT REPORTS A SAVE IT NEVER MADE IS THE WORST BUG THIS FILE CAN
 * SHIP, AND IT HAS SHIPPED TWICE.
 *
 * `agentic_model` above is the first: the column existed, the Settings control
 * sent it, `z.object` stripped the unknown key, the patch reduced to nothing,
 * the mutation resolved and the toast fired. `email_verdict` on
 * notifications.functions.ts was the second, found on 2026-08-26, identical
 * shape. Both were invisible because a stripped key is not an error -- it is
 * silence, and every layer above reports success.
 *
 * So the schema is BOUND TO THE TABLE rather than trusted to remember it. The
 * column list comes from the generated Supabase types, which are regenerated
 * from the real database, so adding a profile column and forgetting the schema
 * stops compiling here instead of failing quietly in front of a person.
 *
 * This is deliberately stricter than the equivalent guard on notification
 * preferences, which binds to a hand-written type: a hand-written type can
 * forget a column in exactly the same way the schema can, so the two agree with
 * each other and both are wrong. This one cannot, because its left-hand side is
 * generated.
 *
 * ADDING A COLUMN THAT MUST NOT BE SELF-EDITABLE? Name it in `NotSelfEditable`
 * WITH ITS REASON. That list is a set of decisions, not a way to silence the
 * check, and every entry below states why a person may not patch it here.
 */
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

type NotSelfEditable =
  /** Identity. Set from the auth session, never from a request body. */
  | "id"
  /** Written once by the database. */
  | "created_at"
  /** Stamped by the handler on every save, so a caller must not choose it. */
  | "updated_at"
  /**
   * AN ACCOUNT HOLD, AND THE ONE EXCLUSION THAT IS A SECURITY BOUNDARY RATHER
   * THAN A TIDINESS RULE. This door authenticates as the profile's owner and
   * patches by `id = userId`, so accepting this key would let a suspended
   * account lift its own suspension in one request.
   */
  | "suspended";

type SelfEditableColumn = Exclude<keyof ProfileRow, NotSelfEditable>;
type SchemaAccepts = keyof z.infer<typeof UpdateSchema>;
type EverySelfEditableColumnIsSavable = SelfEditableColumn extends SchemaAccepts ? true : never;
const _everySelfEditableColumnIsSavable: EverySelfEditableColumnIsSavable = true;
void _everySelfEditableColumnIsSavable;

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
