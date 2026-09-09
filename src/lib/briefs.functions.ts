/**
 * Strategic Briefing (Bundle 2 / C5) — one brief per workspace.
 *
 * The brief is shared operating context that gets injected into every agent
 * mission's system prompt (see src/lib/ai/loop.server.ts → buildBriefBlock).
 * Editing the brief visibly changes the next Discovery / Strategist output —
 * that is the verification target.
 *
 * JNY-02 (v12 §8): the free-text fields below stay as the legacy projection
 * (dual projection, same pattern as CNV-01's contract jsonb alongside
 * prds.body_md), and brief_items adds a structured, versioned decision
 * cluster on top — vision / icp / positioning (singleton, edits supersede
 * the prior standing row) and top_bet (a small portfolio). Each item gets
 * its own watched assumptions via assumptions.brief_item_id (FS-02's watch
 * cron reuse), so the workspace's highest-level calls get the same
 * "standing until challenged" machinery every other decision already has.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

export type WorkspaceBrief = {
  id: string | null;
  workspace_id: string;
  mission: string;
  target_user: string;
  current_focus: string;
  anti_goals: string;
  notes: string;
  updated_at: string | null;
};

async function resolveWorkspaceId(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return defaultWorkspaceId(data);
}

export const getActiveBrief = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<WorkspaceBrief | null> => {
    const { supabase } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return null;

    const { data: row } = await supabase
      .from("workspace_briefs")
      .select("id,workspace_id,mission,target_user,current_focus,anti_goals,notes,updated_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (row) return row as WorkspaceBrief;
    // Return an empty stub so the UI can render the editor.
    return {
      id: null,
      workspace_id: workspaceId,
      mission: "",
      target_user: "",
      current_focus: "",
      anti_goals: "",
      notes: "",
      updated_at: null,
    };
  });

const UpsertSchema = z.object({
  workspaceId: z.string().uuid().nullable().optional(),
  mission: z.string().max(2000).optional().default(""),
  target_user: z.string().max(2000).optional().default(""),
  current_focus: z.string().max(2000).optional().default(""),
  anti_goals: z.string().max(2000).optional().default(""),
  notes: z.string().max(4000).optional().default(""),
});

export const upsertBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpsertSchema>) => UpsertSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) throw new Error("No workspace is available for this account.");

    const { data: row, error } = await supabase
      .from("workspace_briefs")
      .upsert(
        {
          workspace_id: workspaceId,
          mission: data.mission,
          target_user: data.target_user,
          current_focus: data.current_focus,
          anti_goals: data.anti_goals,
          notes: data.notes,
          updated_by: userId,
        },
        { onConflict: "workspace_id" },
      )
      .select("id,workspace_id,mission,target_user,current_focus,anti_goals,notes,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as WorkspaceBrief;
  });

// ---------------------------------------------------------------------------
// JNY-02: structured brief items (vision / icp / positioning / top_bet).
// ---------------------------------------------------------------------------

export type BriefItemKind = "vision" | "icp" | "positioning" | "top_bet";

export type BriefItem = {
  id: string;
  workspace_id: string;
  kind: BriefItemKind;
  title: string;
  body: string;
  status: "standing" | "superseded";
  version: number;
  supersedes_id: string | null;
  created_at: string;
  updated_at: string;
};

const BRIEF_ITEM_COLUMNS =
  "id,workspace_id,kind,title,body,status,version,supersedes_id,created_at,updated_at";

/** Singleton kinds: an edit always supersedes the current standing row of the
 *  same kind. top_bet is a portfolio — a new bet is additive unless the
 *  caller explicitly names the bet it replaces (supersedesId). */
const SINGLETON_BRIEF_KINDS: readonly BriefItemKind[] = ["vision", "icp", "positioning"];

export const listBriefItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<BriefItem[]> => {
    const { supabase } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return [];
    const { data: rows } = await supabase
      .from("brief_items")
      .select(BRIEF_ITEM_COLUMNS)
      .eq("workspace_id", workspaceId)
      .eq("status", "standing")
      .order("kind", { ascending: true })
      .order("created_at", { ascending: true })
      // PC-32 density budget: three singleton kinds + the top_bet portfolio.
      // 40 is far above any sane portfolio; the cap exists so a runaway
      // writer can never make this list unbounded.
      .limit(40);
    return (rows ?? []) as BriefItem[];
  });

// ---------------------------------------------------------------------------
// PC-33 (minimal, PC-32 block 2): the product identity object — what the
// masthead line renders. Composes existing rows only; no new tables.
// ---------------------------------------------------------------------------

export type ProductContext = {
  productName: string;
  /** The Brief's positioning one-liner (falls back to the legacy mission). */
  oneLiner: string | null;
  /** The current top bet (falls back to the legacy current_focus). */
  topBet: string | null;
};

export const getProductContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null } | undefined) =>
    z.object({ workspaceId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ context, data }): Promise<ProductContext | null> => {
    const { supabase } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return null;

    const [wsRes, itemsRes, legacyRes] = await Promise.all([
      supabase.from("workspaces").select("name").eq("id", workspaceId).maybeSingle(),
      supabase
        .from("brief_items")
        .select("kind,title,body,created_at")
        .eq("workspace_id", workspaceId)
        .eq("status", "standing")
        .in("kind", ["positioning", "top_bet"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("workspace_briefs")
        .select("mission,current_focus")
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    ]);

    const items = (itemsRes.data ?? []) as Pick<BriefItem, "kind" | "title" | "body">[];
    const positioning = items.find((i) => i.kind === "positioning");
    const bet = items.find((i) => i.kind === "top_bet");
    const legacy = legacyRes.data as {
      mission: string | null;
      current_focus: string | null;
    } | null;

    const oneLiner = positioning?.body?.trim() || legacy?.mission?.trim() || null;
    const topBet = bet?.title?.trim() || legacy?.current_focus?.trim() || null;
    return {
      productName: (wsRes.data?.name as string | undefined)?.trim() || "Your product",
      oneLiner: oneLiner ? oneLiner.slice(0, 200) : null,
      topBet: topBet ? topBet.slice(0, 140) : null,
    };
  });

const UpsertBriefItemSchema = z.object({
  workspaceId: z.string().uuid().nullable().optional(),
  kind: z.enum(["vision", "icp", "positioning", "top_bet"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  supersedesId: z.string().uuid().nullable().optional(),
});

export const upsertBriefItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpsertBriefItemSchema>) => UpsertBriefItemSchema.parse(d))
  .handler(({ context, data }): Promise<BriefItem> =>
    upsertBriefItemCore(context.supabase, context.userId, data),
  );

/** The write behind `upsertBriefItem`, callable with a client you already hold
 *  (`openFirstRun` writes the positioning line with the rest of the door's
 *  work in one round trip). */
export async function upsertBriefItemCore(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: z.output<typeof UpsertBriefItemSchema>,
): Promise<BriefItem> {
  {
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) throw new Error("No workspace is available for this account.");

    let priorId = data.supersedesId ?? null;
    let nextVersion = 1;
    if (!priorId && SINGLETON_BRIEF_KINDS.includes(data.kind)) {
      const { data: existing } = await supabase
        .from("brief_items")
        .select("id,version")
        .eq("workspace_id", workspaceId)
        .eq("kind", data.kind)
        .eq("status", "standing")
        .maybeSingle();
      if (existing) {
        priorId = existing.id as string;
        nextVersion = ((existing.version as number) ?? 1) + 1;
      }
    } else if (priorId) {
      const { data: existing } = await supabase
        .from("brief_items")
        .select("version")
        .eq("id", priorId)
        .maybeSingle();
      nextVersion = ((existing?.version as number) ?? 1) + 1;
    }

    if (priorId) {
      await supabase.from("brief_items").update({ status: "superseded" }).eq("id", priorId);
    }

    const { data: row, error } = await supabase
      .from("brief_items")
      .insert({
        workspace_id: workspaceId,
        kind: data.kind,
        title: data.title,
        body: data.body,
        version: nextVersion,
        supersedes_id: priorId,
        created_by: userId,
      })
      .select(BRIEF_ITEM_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    await extractBriefAssumptions(
      supabase,
      userId,
      workspaceId,
      row.id as string,
      data.title,
      data.body,
    );

    return row as BriefItem;
  }
}

/** Retire a top_bet with no replacement (the portfolio just shrinks). Refuses
 *  silently (no-op) on an already-superseded id so a double-click is safe. */
export const retireBriefItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("brief_items")
      .update({ status: "superseded" })
      .eq("id", data.id)
      .eq("status", "standing");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const EXTRACT_BRIEF_ASSUMPTION_SYSTEM = `You are the Supaprod strategy analyst. Given a strategic brief item's title and body, extract the standing assumptions it depends on.
Rules:
- Each assumption is a single falsifiable statement about the world that, if it stopped being true, would call this item into question.
- Extract at most 3, most load-bearing first.
- If the body is too thin to support a real assumption, return an empty list rather than inventing one.
- Signal-first: state the assumption directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"assumptions": ["...", "..."]}`;

/**
 * Fail-safe sibling of ai/assumptions.server.ts's extractAssumptions (FS-02),
 * kept as a small local duplicate rather than a generalized shared function:
 * the two other call sites (createDecision, compileContractOracles) live in
 * files this ticket does not otherwise touch, and the insert shape (which
 * foreign key gets populated) is the one thing that actually differs.
 * Never throws into the caller (upsertBriefItem's write must still succeed
 * even if the AI call or the assumptions insert fails).
 */
async function extractBriefAssumptions(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  briefItemId: string,
  title: string,
  body: string,
): Promise<void> {
  if (!body || body.trim().length < 20) return;
  try {
    const res = await callModel(supabase as never, userId, {
      surface: "sense",
      surface_ref: "extract_brief_assumptions",
      model: "google/gemini-2.5-flash",
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: EXTRACT_BRIEF_ASSUMPTION_SYSTEM },
        {
          role: "user",
          content: `BRIEF ITEM: ${title.slice(0, 280)}\nBODY: ${body.slice(0, 1500)}\n\nExtract the assumptions.`,
        },
      ],
    });
    const j = (res.json ?? {}) as { assumptions?: unknown };
    const raw = Array.isArray(j.assumptions) ? j.assumptions : [];
    const statements = raw
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, 3)
      .map((s) => s.trim().slice(0, 500));
    if (statements.length === 0) return;

    await supabase.from("assumptions").insert(
      statements.map((statement) => ({
        user_id: userId,
        workspace_id: workspaceId,
        brief_item_id: briefItemId,
        statement,
      })),
    );
  } catch (e) {
    console.error("extractBriefAssumptions failed (non-fatal):", e);
  }
}

/**
 * Server-side helper: render the standing structured brief items as a
 * plain-text block suitable for injection into an agent's system prompt,
 * appended alongside renderBriefBlock's legacy free-text output. Returns ""
 * when there are no standing items (so we never inject noise pre-adoption).
 */
export function renderBriefItemsBlock(items: BriefItem[] | null | undefined): string {
  if (!items || items.length === 0) return "";
  const KIND_LABEL: Record<BriefItemKind, string> = {
    vision: "Vision",
    icp: "Target user (ICP)",
    positioning: "Positioning",
    top_bet: "Top bets",
  };
  const byKind = new Map<BriefItemKind, BriefItem[]>();
  for (const it of items) {
    const list = byKind.get(it.kind) ?? [];
    list.push(it);
    byKind.set(it.kind, list);
  }
  const sections: string[] = [];
  for (const kind of ["vision", "icp", "positioning", "top_bet"] as BriefItemKind[]) {
    const rows = byKind.get(kind);
    if (!rows || rows.length === 0) continue;
    const body =
      kind === "top_bet" ? rows.map((r) => `- ${r.title}: ${r.body}`).join("\n") : rows[0].body;
    sections.push(`${KIND_LABEL[kind]}:\n${body}`);
  }
  if (!sections.length) return "";
  return `\n--- Strategic decisions (versioned, operator-approved) ---\n${sections.join("\n\n")}\n--- End strategic decisions ---\n`;
}

/**
 * Server-side helper: render a workspace brief as a plain-text block suitable
 * for injection into an agent's system prompt. Returns "" if the brief is
 * absent or entirely empty (so we never inject noise).
 */
export function renderBriefBlock(b: WorkspaceBrief | null): string {
  if (!b) return "";
  const fields: [string, string][] = [
    ["Mission", b.mission],
    ["Target user (ICP)", b.target_user],
    ["Current focus", b.current_focus],
    ["Anti-goals (do NOT pursue)", b.anti_goals],
    ["Notes", b.notes],
  ].filter(([, v]) => v && v.trim().length > 0) as [string, string][];
  if (!fields.length) return "";
  const body = fields.map(([k, v]) => `${k}:\n${v.trim()}`).join("\n\n");
  return `\n--- Workspace Strategic Brief (operator-set, authoritative) ---\n${body}\n--- End brief ---\n`;
}
