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
  /** The product this thread is scoped to (screen-9 scope switcher), or null. */
  productId: string | null;
  /** The folder it is filed under, or null (screen-9 Unfiled view). */
  folderId: string | null;
  /** Role of the most recent message: 'user' rows show the "you" chip. */
  lastRole: string | null;
  /** screen-9 rail views: an approved memory candidate saved from this thread
   *  (In the brain), and a pending one (Waiting on you, a gate on the thread). */
  inBrain: boolean;
  waiting: boolean;
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
    /*
     * ── THREADS READ ONE WORKSPACE (P-70) ─────────────────────────────────
     *
     * These reads said "RLS-scoped" in their own comments and that was the
     * mistake in one word: RLS answers whether this person may see the row, and
     * a person in two workspaces may see both. So the thread list, the search
     * and the memory-candidate lookup mixed desks. Unresolved stays unfiltered.
     */
    const { data: wsDefault } = await context.supabase.rpc("current_user_default_workspace");
    const wid = (wsDefault as string | null) ?? null;

    let convQ = db.from("conversations").select("id,title,updated_at,product_id,folder_id");
    if (wid) convQ = convQ.eq("workspace_id", wid);
    const { data: convRows, error } = await convQ
      .order("updated_at", { ascending: false })
      .limit(80);
    if (error) throw new Error(error.message);

    const conversations = (convRows ?? []) as Row[];
    const ids = conversations.map((c) => String(c.id));

    // One batched read for the latest message per conversation (the snippet +
    // its role, so a thread whose last word was yours shows the "you" chip).
    const snippetByConv = new Map<string, string>();
    const lastRoleByConv = new Map<string, string>();
    if (ids.length > 0) {
      const { data: msgRows } = await db
        .from("messages")
        .select("conversation_id,content,role,created_at")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(600);
      for (const m of (msgRows ?? []) as Row[]) {
        const cid = str(m.conversation_id);
        if (!cid) continue;
        if (!lastRoleByConv.has(cid)) lastRoleByConv.set(cid, str(m.role) ?? "");
        const content = str(m.content);
        if (snippetByConv.has(cid)) continue;
        if (content && content.trim()) {
          snippetByConv.set(cid, content.trim().replace(/\s+/g, " ").slice(0, 140));
        }
      }
    }

    // screen-9 rail views: which threads have a memory candidate saved from
    // them (approved -> In the brain; pending -> Waiting on you). Tolerant: if
    // the source_conversation_id column has not migrated yet, both stay empty.
    const inBrainByConv = new Set<string>();
    const waitingByConv = new Set<string>();
    if (ids.length > 0) {
      let memQ = db.from("memory_candidates").select("source_conversation_id,status");
      if (wid) memQ = memQ.eq("workspace_id", wid);
      const { data: memRows, error: memErr } = await memQ.in("source_conversation_id", ids);
      if (!memErr) {
        for (const m of (memRows ?? []) as Row[]) {
          const cid = str(m.source_conversation_id);
          if (!cid) continue;
          if (str(m.status) === "approved") inBrainByConv.add(cid);
          else if (str(m.status) === "pending") waitingByConv.add(cid);
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
        productId: str(c.product_id),
        folderId: str(c.folder_id),
        lastRole: lastRoleByConv.get(id) ?? null,
        inBrain: inBrainByConv.has(id),
        waiting: waitingByConv.has(id),
      };
    });

    return { threads };
  });

// Read one thread for the preview. Deliberately selects ONLY columns that
// exist on messages here (the shared getConversation selects messages.mission_id,
// which is absent in this database); a narrow, tolerant read keeps the Threads
// preview working regardless of that schema drift.
/*
 * ── A THREAD OPENED BY ID MUST BELONG TO THE WORKSPACE YOU ARE IN (P-75) ──
 *
 * A1 opened the empty probe workspace's Conversations and read Helio's kept
 * thread: "What needs my call before it can move?", theirs, from 23:29. The
 * LIST has been scoped since P-70. This read takes an id, and RLS answers
 * "may this person see it" -- which for a member of both workspaces is yes.
 *
 * That is the whole class in miniature: scoping a list does not scope the
 * thing the list links to, and an id in a URL outlives the workspace it was
 * copied from. So the thread is fetched WITH the workspace, and a thread that
 * belongs to another one is not found rather than shown.
 *
 * REFUSED AS NOT FOUND, deliberately, and not as "you may not see this": the
 * person often may -- they are a member -- it simply is not part of the desk
 * they have open, and a permission error would say something false about their
 * access.
 */
export const getThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        workspaceId: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }): Promise<{ title: string; messages: ThreadMessage[] }> => {
    const db = context.supabase as unknown as SupabaseClient;

    let wid = data.workspaceId ?? null;
    if (!wid) {
      const { data: ws } = await context.supabase.rpc("current_user_default_workspace");
      wid = (ws as string | null) ?? null;
    }

    let convQ = db.from("conversations").select("id,title").eq("id", data.id);
    if (wid) convQ = convQ.eq("workspace_id", wid);
    const { data: conv } = await convQ.maybeSingle();
    /*
     * NOT THIS WORKSPACE'S THREAD. Nothing is read beyond this point: fetching
     * its messages anyway would put another desk's conversation on the screen
     * under an empty title, which is worse than an honest absence.
     */
    if (!conv) {
      return {
        title: "",
        messages: [],
      };
    }

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
  });

// Server-side search across conversation titles AND message content (K3). The
// client filter only sees the loaded page; this finds a thread by something
// said deep inside it. ILIKE works today with no migration; a messages
// full-text index is a later perf-only migration, not a correctness gate.
export const searchConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ q: z.string().trim().min(1).max(200) }).parse(i))
  .handler(async ({ context, data }): Promise<{ threads: ThreadSummary[] }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const like = `%${data.q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    /* P-70. See the note in `listThreads`. */
    const { data: wsDefault } = await context.supabase.rpc("current_user_default_workspace");
    const wid = (wsDefault as string | null) ?? null;

    /* Title matches. NOT "RLS-scoped", which is what this comment used to say
       and is the whole defect: RLS answers whether you MAY see it. */
    let titleQ = db.from("conversations").select("id,title,updated_at");
    if (wid) titleQ = titleQ.eq("workspace_id", wid);
    const { data: byTitle } = await titleQ
      .ilike("title", like)
      .order("updated_at", { ascending: false })
      .limit(60);

    // Message-content matches -> their conversation ids (RLS-scoped, tolerant).
    const convIds = new Set<string>();
    for (const r of (byTitle ?? []) as Row[]) convIds.add(String(r.id));
    let msgQ = db.from("messages").select("conversation_id,content");
    if (wid) msgQ = msgQ.eq("workspace_id", wid);
    const { data: byMsg } = await msgQ
      .ilike("content", like)
      .order("created_at", { ascending: false })
      .limit(200);
    const snippetByConv = new Map<string, string>();
    for (const m of (byMsg ?? []) as Row[]) {
      const cid = str(m.conversation_id);
      if (!cid) continue;
      convIds.add(cid);
      const content = str(m.content);
      if (content && !snippetByConv.has(cid)) {
        snippetByConv.set(cid, content.trim().replace(/\s+/g, " ").slice(0, 140));
      }
    }

    if (convIds.size === 0) return { threads: [] };

    // Resolve the union of matched conversations (RLS re-scopes; a message
    // match on a conversation the caller cannot read simply drops out here).
    const { data: convRows } = await db
      .from("conversations")
      .select("id,title,updated_at,product_id,folder_id")
      .in("id", [...convIds])
      .order("updated_at", { ascending: false })
      .limit(80);

    const threads: ThreadSummary[] = ((convRows ?? []) as Row[]).map((c) => {
      const id = String(c.id);
      return {
        id,
        title: str(c.title) ?? "Untitled thread",
        updatedAt: str(c.updated_at),
        snippet: snippetByConv.get(id) ?? "",
        productId: str(c.product_id),
        folderId: str(c.folder_id),
        lastRole: null,
        inBrain: false,
        waiting: false,
      };
    });
    return { threads };
  });

// --- Threads FOLDERS (K1). All tolerant: the conversation_folders table +
//     conversations.folder_id land at the Gate-2 merge; until then reads return
//     empty and writes surface an honest message. ---

export interface ThreadFolder {
  id: string;
  name: string;
}

export const listFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ folders: ThreadFolder[] }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data, error } = await db
      .from("conversation_folders")
      .select("id,name")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) return { folders: [] }; // table not migrated yet -> no folders shown
    return {
      folders: ((data ?? []) as Row[]).map((f) => ({
        id: String(f.id),
        name: str(f.name) ?? "Folder",
      })),
    };
  });

export const createFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ name: z.string().trim().min(1).max(80) }).parse(i))
  .handler(async ({ context, data }): Promise<{ ok: boolean; id: string | null }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: row, error } = await db
      .from("conversation_folders")
      .insert({ user_id: context.userId, name: data.name })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message); // pre-migration -> honest failure
    return { ok: true, id: row ? String((row as Row).id) : null };
  });

export const moveThreadToFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ threadId: z.string().uuid(), folderId: z.string().uuid().nullable() }).parse(i),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const builder = context.supabase.from("conversations") as unknown as {
      update: (p: Record<string, unknown>) => {
        eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await builder.update({ folder_id: data.folderId }).eq("id", data.threadId);
    if (error) throw new Error(error.message); // pre-migration (no folder_id) -> honest failure
    return { ok: true };
  });

export const listThreadsInFolder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ folderId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<{ threads: ThreadSummary[] }> => {
    const db = context.supabase as unknown as SupabaseClient;
    /* P-70. A folder belongs to a workspace, and so does what is in it. */
    const { data: wsDefault } = await context.supabase.rpc("current_user_default_workspace");
    const wid = (wsDefault as string | null) ?? null;
    let folderQ = db.from("conversations").select("id,title,updated_at,product_id");
    if (wid) folderQ = folderQ.eq("workspace_id", wid);
    const { data: rows, error } = await folderQ
      .eq("folder_id", data.folderId)
      .order("updated_at", { ascending: false })
      .limit(80);
    if (error) return { threads: [] }; // folder_id column not migrated yet
    return {
      threads: ((rows ?? []) as Row[]).map((c) => ({
        id: String(c.id),
        title: str(c.title) ?? "Untitled thread",
        updatedAt: str(c.updated_at),
        snippet: "",
        productId: str(c.product_id),
        folderId: data.folderId,
        lastRole: null,
        inBrain: false,
        waiting: false,
      })),
    };
  });
