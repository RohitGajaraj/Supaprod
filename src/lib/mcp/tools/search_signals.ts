import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed } from "../supabase-for-user";

export default defineTool({
  name: "search_signals",
  title: "Search signals",
  description: "Text search the connected user's signals in one workspace.",
  inputSchema: {
    workspace_id: z.string().uuid(),
    query: z.string().trim().min(1).max(200),
    limit: z.number().int().min(1).max(50).default(20).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const safe = query.replace(/[%,()]/g, " ");
    const { data, error } = await supabase
      .from("signals")
      .select("id, title, content, source, created_at")
      .eq("workspace_id", workspace_id)
      .or(`title.ilike.%${safe}%,content.ilike.%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { signals: data ?? [] },
    };
  },
});