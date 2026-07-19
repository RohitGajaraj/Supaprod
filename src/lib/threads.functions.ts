// Threads (front-end reimagining Phase 4; founder-approved 2026-07-19,
// "Threads = build it"). The revisitable home for every conversation: what was
// asked and answered lands here, searchable, saved.
//
// The list is a read over the existing `conversations` table (no migration) -
// so it works the moment this ships. Folders, cross-scope views, full-text
// search, and promote-to-memory are the migration-bearing follow-ups (gaps
// K1-K5); this read never claims them. RLS scopes conversations to the caller;
// the snippet read is best-effort and tolerant (a bad messages read simply
// leaves the snippet empty, never breaks the list).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ThreadSummary {
  id: string;
  title: string;
  updatedAt: string | null;
  /** First line of the most recent message, best-effort. */
  snippet: string;
}

export interface ThreadMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string | null;
}

type Row = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ threads: ThreadSummary[] }> => {
    const db = context.supabase as unknown as SupabaseClient;

    const { data: convRows, error } = await db
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .limit(80);
    if (error) throw new Error(error.message);

    const conversations = (convRows ?? []) as Row[];
    const ids = conversations.map((c) => String(c.id));

    // One batched read for the latest message per conversation (the snippet).
    // Tolerant: any failure just yields no snippets.
    const snippetByConv = new Map<string, string>();
    if (ids.length > 0) {
      const { data: msgRows } = await db
        .from("messages")
        .select("conversation_id,content,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(600);
      for (const m of (msgRows ?? []) as Row[]) {
        const cid = str(m.conversation_id);
        const content = str(m.content);
        if (!cid || snippetByConv.has(cid)) continue;
        if (content && content.trim()) {
          snippetByConv.set(cid, content.trim().replace(/\s+/g, " ").slice(0, 140));
        }
      }
    }

    const threads: ThreadSummary[] = conversations.map((c) => {
      const id = String(c.id);
      return {
        id,
        title: str(c.title) ?? "Untitled thread",
        updatedAt: str(c.updated_at),
        snippet: snippetByConv.get(id) ?? "",
      };
    });

    return { threads };
  });

// Read one thread for the preview. Deliberately selects ONLY columns that
// exist on messages here (the shared getConversation selects messages.mission_id,
// which is absent in this database); a narrow, tolerant read keeps the Threads
// preview working regardless of that schema drift.
export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(
    async ({ context, data }): Promise<{ title: string; messages: ThreadMessage[] }> => {
      const db = context.supabase as unknown as SupabaseClient;

      const { data: conv } = await db
        .from("conversations")
        .select("id,title")
        .eq("id", data.id)
        .maybeSingle();

      const { data: msgRows, error } = await db
        .from("messages")
        .select("id,role,content,created_at")
        .eq("conversation_id", data.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw new Error(error.message);

      const messages: ThreadMessage[] = ((msgRows ?? []) as Row[]).map((m) => ({
        id: String(m.id),
        role: str(m.role) ?? "assistant",
        content: str(m.content) ?? "",
        createdAt: str(m.created_at),
      }));

      const title = ((conv ?? {}) as Row).title;
      return { title: str(title) ?? "Thread", messages };
    },
  );
