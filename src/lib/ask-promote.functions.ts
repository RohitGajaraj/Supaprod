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

/**
 * Records what an answer was promoted into on the message row itself
 * (metadata.promoted), so the receipt chips survive a refresh and a
 * rehydrated thread never offers a duplicate save (review fix 2026-07-16).
 * RLS scopes the update to the caller's own message.
 */
export const markMessagePromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        messageId: z.string().uuid(),
        kind: z.enum(["note", "decision", "task"]),
        recordId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            c: string,
            v: string,
          ) => {
            maybeSingle: () => Promise<{
              data: { metadata: unknown } | null;
              error: { message: string } | null;
            }>;
          };
        };
        update: (p: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
    // Surface the read error instead of discarding it. Discarding it turned a
    // missing messages.metadata column into a silent { ok: false }: the promote
    // did nothing and told nobody, for as long as the column was absent
    // (see 20260728234500_messages_metadata_and_mission_id.sql). A promote that
    // cannot happen must say so, not shrug.
    const { data: row, error: readError } = await db
      .from("messages")
      .select("metadata")
      .eq("id", data.messageId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!row) return { ok: false };
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const promoted = { ...(metadata.promoted as Record<string, string> | undefined) };
    promoted[data.kind] = data.recordId;
    const { error } = await db
      .from("messages")
      .update({ metadata: { ...metadata, promoted } })
      .eq("id", data.messageId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
