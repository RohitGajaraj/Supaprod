import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { conversations: data ?? [] };
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    // PC-36 rehydration hardening: named columns (metadata carries the typed
    // answer blocks; the generated types predate it), a bound (the newest 80
    // rows, returned oldest-first), and surfaced errors instead of a silent
    // { conversation: null } that reads like an empty thread.
    //
    // messages.mission_id and messages.metadata are OPTIONAL at runtime. Two
    // migrations race to add mission_id (20260607095340 adds it referencing
    // agent_runs with IF NOT EXISTS; 20260607100000 adds it referencing
    // missions without one), so whichever lands first makes the other fail and
    // neither column is guaranteed. Asking for a column Postgres does not have
    // fails the WHOLE select with 42703, which is why every rehydration used to
    // reject and the Ask panel rendered its empty state on a thread that had
    // messages. Try enriched, fall back to the columns the base table has
    // always had. hydrateMessages already treats both as optional, so the
    // fallback loses answer blocks and mission deep-links, never the prose --
    // and the enriched path starts working by itself the day the column lands.
    const BASE_COLUMNS = "id,role,content,model,created_at";
    const ENRICHED_COLUMNS = `${BASE_COLUMNS},mission_id,metadata`;

    const messagesFor = (columns: string) =>
      supabase
        .from("messages")
        .select(columns as "*")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: false })
        .limit(80);

    const [convRes, enrichedRes] = await Promise.all([
      supabase.from("conversations").select("*").eq("id", data.id).maybeSingle(),
      messagesFor(ENRICHED_COLUMNS),
    ]);
    if (convRes.error) throw new Error(convRes.error.message);

    // 42703 is undefined_column. Anything else is a real failure and still throws.
    const msgRes =
      enrichedRes.error?.code === "42703" ? await messagesFor(BASE_COLUMNS) : enrichedRes;
    if (msgRes.error) throw new Error(msgRes.error.message);

    return { conversation: convRes.data, messages: (msgRes.data ?? []).reverse() };
  });

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        title: z.string().min(1).max(120).optional(),
        model: z.string().min(1).max(80).optional(),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: data.title ?? "New conversation",
        model: data.model ?? "google/gemini-3-flash-preview",
        project_id: data.project_id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { conversation: conv };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const builder = context.supabase.from("conversations") as unknown as {
      update: (p: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await builder
      .update({ title: data.title, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
