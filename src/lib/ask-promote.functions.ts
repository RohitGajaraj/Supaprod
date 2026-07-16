/**
 * PC-36 workstream E - promote an Ask answer to a note ("nothing said in Ask
 * may evaporate," the ledger law applied to chat). Decisions and tasks reuse
 * the existing createDecision / createTask server functions directly from
 * the panel (they carry their own seams: stage events, tracking); notes had
 * no client-callable create (only the agent tool notes.create), so this is
 * the one missing write, mirroring that tool's insert exactly.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createNoteFromAsk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        body: z.string().min(1).max(8000),
        tags: z.array(z.string().max(40)).max(10).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("notes")
      .insert({
        user_id: context.userId,
        body: data.body,
        tags: data.tags ?? ["ask"],
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { note: row };
  });
