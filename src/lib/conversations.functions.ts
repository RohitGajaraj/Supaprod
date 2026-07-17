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
    const [convRes, msgRes] = await Promise.all([
      supabase.from("conversations").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("messages")
        .select("id,role,content,model,created_at,mission_id,metadata" as "*")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);
    if (convRes.error) throw new Error(convRes.error.message);
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
