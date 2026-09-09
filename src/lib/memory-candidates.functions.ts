/**
 * RPT-28: Memory write review gate.
 *
 * The general `agent_memory` table auto-writes with no gate (the loop distills
 * an outcome, an agent reflects, a row lands in the moat with no human in the
 * way). Wrong memories anchor every future judgment, so this puts a consent
 * gate AT THE WRITE: a dedicated `memory_candidates` pending queue in front of
 * agent_memory, cloning the SHIPPED design_memory / house_rules pattern
 * (dedicated table + pending/approved/rejected status; see
 * design-memory.functions.ts and house-rules.functions.ts).
 *
 * Curate-at-write: nothing reaches agent_memory without an approval here.
 * Supersede-on-conflict: an approved candidate carrying supersedes_memory_id
 * retires (deletes) that existing agent_memory row on approval. The
 * "save this to the brain" affordance is proposeMemoryCandidate (source
 * 'user'); detectConflict prefills supersedes_memory_id by best-effort semantic
 * match so the reviewer sees what an approval would replace.
 *
 * Every read is workspace-scoped (defense in depth over the owner-scoped RLS on
 * memory_candidates). The embed + insert path is exactly the one rememberOutcome
 * uses (ai/memory.server.ts): embed via embedOne, insert into agent_memory with
 * a null embedding never written (an unrecallable ghost row is worse than none).
 * Content is screened through assessAndQuarantine before it is stored, since a
 * curated memory is an AI-consumed store like house_rules.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { embedOne } from "@/lib/rag/embed.server";
import { assessAndQuarantine } from "@/lib/injection-classifier";
import type { MemoryCandidateSource, MemoryCandidateStatus } from "@/lib/memory-candidates";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

export type { MemoryCandidateSource, MemoryCandidateStatus };

export type MemoryCandidateRow = {
  id: string;
  user_id: string;
  workspace_id: string;
  source_kind: MemoryCandidateSource;
  scope: string | null;
  kind: string | null;
  content: string;
  importance: number | null;
  status: MemoryCandidateStatus;
  supersedes_memory_id: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
};

/** A listing row plus the resolved content of the memory an approval would
 *  retire (for the "supersedes: ..." indicator). Null when nothing conflicts. */
export type MemoryCandidateView = MemoryCandidateRow & {
  supersedes_content: string | null;
};

const SELECT_COLUMNS =
  "id,user_id,workspace_id,source_kind,scope,kind,content,importance,status,supersedes_memory_id,decided_by,decided_at,created_at";

// Above this cosine similarity an existing memory is treated as the same claim,
// so approving the candidate should retire it (supersede-on-conflict). Tuned
// conservatively: a false negative just means no auto-prefill (the reviewer can
// still approve as a fresh memory), a false positive would wrongly offer to
// retire an unrelated memory, which is the worse error.
const CONFLICT_SIMILARITY_THRESHOLD = 0.82;

async function resolveWorkspaceId(
  supabase: SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return defaultWorkspaceId(data);
}

/** Best-effort semantic match of `content` against this workspace's existing
 *  agent_memory. Returns the single closest memory at/above the conflict
 *  threshold, or null. Fail-safe: any embed/RPC error returns null (no
 *  conflict), never throws — a prefill is a convenience, not a gate. */
async function findConflictingMemory(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string | null,
  content: string,
): Promise<{ id: string; content: string; similarity: number } | null> {
  try {
    const v = await embedOne(content, {
      supabase,
      userId,
      surfaceRef: "memory-candidate-conflict",
    });
    const emb = Array.isArray(v) && v.length > 0 ? v : null;
    if (!emb) return null;

    const baseArgs = {
      query_embedding: emb as unknown as string,
      for_user: userId,
      for_agent_slug: null as string | null,
      match_count: 3,
      for_workspace: workspaceId,
    };
    let res = await supabase.rpc("match_agent_memory", baseArgs);
    // Pre-migration tolerance (same idiom as ai/memory.server.ts): if the
    // for_workspace overload is not live yet, step the signature back so
    // conflict detection never hard-errors the whole propose call.
    if (res.error?.code === "PGRST202") {
      res = await supabase.rpc("match_agent_memory", {
        query_embedding: emb as unknown as string,
        for_user: userId,
        for_agent_slug: null,
        match_count: 3,
      });
    }
    if (res.error) return null;

    const rows = (res.data ?? []) as {
      id?: string;
      content?: string;
      similarity?: number;
    }[];
    const top = rows.find(
      (r) =>
        typeof r.id === "string" &&
        typeof r.content === "string" &&
        typeof r.similarity === "number" &&
        r.similarity >= CONFLICT_SIMILARITY_THRESHOLD,
    );
    return top ? { id: top.id!, content: top.content!, similarity: top.similarity! } : null;
  } catch {
    return null;
  }
}

// --- proposeMemoryCandidate: the "save this to the brain" affordance ---

const ProposeSchema = z
  .object({
    content: z.string().trim().min(3).max(2000),
    scope: z.string().trim().max(120).optional(),
    kind: z.string().trim().max(60).optional(),
    importance: z.number().int().min(1).max(5).optional(),
    sourceKind: z.enum(["user", "agent", "outcome"]).optional(),
    workspaceId: z.string().uuid().nullable().optional(),
    /** The thread this was saved from (screen-9 Threads rail link). */
    sourceConversationId: z.string().uuid().nullable().optional(),
  })
  .strip();

export type ProposeMemoryCandidateResult = {
  id: string;
  supersedesMemoryId: string | null;
};

/**
 * Insert a pending memory candidate, workspace-scoped, with content screened
 * through the injection guard. Prefills supersedes_memory_id by a best-effort
 * semantic match so the reviewer sees what approving it would retire. This is
 * the ONLY path a human-typed memory enters the queue; nothing here touches
 * agent_memory (that happens only on approval).
 */
export const proposeMemoryCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ProposeSchema>) => ProposeSchema.parse(d))
  .handler(async ({ context, data }): Promise<ProposeMemoryCandidateResult> => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) throw new Error("proposeMemoryCandidate: no workspace");

    // Same untrusted-boundary screening as house_rules / design_memory: a
    // curated memory is injected into future agent recall once approved.
    const screened = assessAndQuarantine(data.content);

    const conflict = await findConflictingMemory(supabase, userId, workspaceId, screened.text);

    const baseRow = {
      user_id: userId,
      workspace_id: workspaceId,
      source_kind: data.sourceKind ?? "user",
      scope: data.scope ?? null,
      kind: data.kind ?? null,
      content: screened.text,
      importance: data.importance ?? null,
      status: "pending",
      supersedes_memory_id: conflict?.id ?? null,
    };
    // Carry the source conversation link when present; tolerant of the
    // pre-migration window (retry without it if the column is not there yet).
    let inserted: { id: string; supersedes_memory_id: string | null } | null = null;
    {
      const withConv =
        data.sourceConversationId != null
          ? { ...baseRow, source_conversation_id: data.sourceConversationId }
          : baseRow;
      const first = await supabase
        .from("memory_candidates")
        .insert(withConv)
        .select("id,supersedes_memory_id")
        .single();
      if (
        first.error &&
        data.sourceConversationId != null &&
        /source_conversation_id/.test(first.error.message)
      ) {
        const retry = await supabase
          .from("memory_candidates")
          .insert(baseRow)
          .select("id,supersedes_memory_id")
          .single();
        if (retry.error) throw new Error(retry.error.message);
        inserted = retry.data as { id: string; supersedes_memory_id: string | null };
      } else if (first.error) {
        throw new Error(first.error.message);
      } else {
        inserted = first.data as { id: string; supersedes_memory_id: string | null };
      }
    }

    const row = inserted as { id: string; supersedes_memory_id: string | null };
    return { id: row.id, supersedesMemoryId: row.supersedes_memory_id };
  });

// --- listMemoryCandidates: the pending queue for the workspace ---

const ListSchema = z
  .object({
    workspaceId: z.string().uuid().nullable().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  })
  .strip();

export type ListMemoryCandidatesResult = { items: MemoryCandidateView[] };

/**
 * UI read: memory candidates for the workspace, newest first. Defaults to the
 * pending queue (status='pending') since that is what the review gate is for;
 * an explicit status filters instead. Resolves the superseded memory's content
 * so the row can render the "supersedes: <existing memory>" indicator.
 */
export const listMemoryCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListSchema> | undefined) => ListSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ListMemoryCandidatesResult> => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return { items: [] };

    const { data: rows, error } = await supabase
      .from("memory_candidates")
      .select(SELECT_COLUMNS)
      .eq("workspace_id", workspaceId)
      .eq("status", data.status ?? "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const candidates = (rows ?? []) as MemoryCandidateRow[];

    // Batch-resolve the superseded memory contents (owner-scoped read; RLS
    // confines it to the caller's own agent_memory).
    const superIds = Array.from(
      new Set(candidates.map((c) => c.supersedes_memory_id).filter((x): x is string => !!x)),
    );
    const superMap = new Map<string, string>();
    if (superIds.length > 0) {
      const { data: mems } = await supabase
        .from("agent_memory")
        .select("id,content")
        .eq("user_id", userId)
        .in("id", superIds);
      for (const m of (mems ?? []) as { id: string; content: string }[]) {
        superMap.set(m.id, m.content);
      }
    }

    const items: MemoryCandidateView[] = candidates.map((c) => ({
      ...c,
      supersedes_content: c.supersedes_memory_id
        ? (superMap.get(c.supersedes_memory_id) ?? null)
        : null,
    }));
    return { items };
  });

// --- decideMemoryCandidate: approve (commit to agent_memory) or reject ---

const DecideSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
});

export type DecideMemoryCandidateResult = {
  ok: boolean;
  memoryId: string | null;
  superseded: boolean;
};

/**
 * Approve or reject a pending candidate.
 *
 * Approve = the consent that lets the memory into the brain: embed the content
 * (the SAME embedOne path rememberOutcome uses), and if it carries
 * supersedes_memory_id, DELETE that existing agent_memory row first
 * (supersede-on-conflict), then insert the curated memory into agent_memory.
 * If the content cannot be embedded we do NOT insert an unrecallable row and do
 * NOT retire the old one — we surface an error so the human knows nothing was
 * saved (mirrors rememberOutcome's never-write-a-ghost contract).
 *
 * Reject = mark status='rejected' with decided_by/decided_at; agent_memory is
 * never touched.
 */
export const decideMemoryCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DecideSchema>) => DecideSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideMemoryCandidateResult> => {
    const { supabase, userId } = context;
    const nowIso = new Date().toISOString();

    // Load the candidate (RLS confines this to the caller's own rows).
    const { data: candRow, error: candErr } = await supabase
      .from("memory_candidates")
      .select(SELECT_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (candErr) throw new Error(candErr.message);
    if (!candRow) throw new Error("decideMemoryCandidate: candidate not found or not accessible");
    const cand = candRow as MemoryCandidateRow;

    if (data.decision === "reject") {
      const { data: updated, error } = await supabase
        .from("memory_candidates")
        .update({ status: "rejected", decided_by: userId, decided_at: nowIso })
        .eq("id", cand.id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("decideMemoryCandidate: candidate not found or not accessible");
      return { ok: true, memoryId: null, superseded: false };
    }

    // Approve. Idempotent: a candidate already approved does not re-insert.
    if (cand.status === "approved") {
      return { ok: true, memoryId: null, superseded: false };
    }

    // Embed FIRST: a memory the loop can't recall is worse than none, and
    // match_agent_memory hard-filters embedding IS NOT NULL. If we can't embed,
    // do not retire the old memory and do not insert a ghost row.
    let emb: number[] | null = null;
    try {
      const v = await embedOne(cand.content, {
        supabase,
        userId,
        surfaceRef: "memory-candidate-approve",
      });
      emb = Array.isArray(v) && v.length > 0 ? v : null;
    } catch {
      emb = null;
    }
    if (!emb) {
      throw new Error(
        "This could not be filed in a way the agents would ever reach, so nothing changed. Try approving again.",
      );
    }

    // Supersede-on-conflict: retire the existing memory this one replaces
    // BEFORE inserting the replacement. Owner-scoped delete (RLS confines it).
    let superseded = false;
    if (cand.supersedes_memory_id) {
      const { data: removed, error: delErr } = await supabase
        .from("agent_memory")
        .delete()
        .eq("id", cand.supersedes_memory_id)
        .eq("user_id", userId)
        .select("id");
      if (delErr) throw new Error(delErr.message);
      superseded = Array.isArray(removed) && removed.length > 0;
    }

    const { data: memRow, error: insErr } = await supabase
      .from("agent_memory")
      .insert({
        user_id: userId,
        agent_id: null,
        agent_slug: null,
        scope: cand.scope?.trim() || "global",
        kind: cand.kind?.trim() || "note",
        content: cand.content,
        importance: cand.importance ?? 3,
        metadata: {
          source: "curated",
          source_kind: cand.source_kind,
          candidate_id: cand.id,
          workspace_id: cand.workspace_id,
          superseded_memory_id: cand.supersedes_memory_id ?? null,
        },
        embedding: emb as unknown as string,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    const memoryId = (memRow as { id: string }).id;

    // Tag the new agent_memory row with the candidate's workspace. Done as a
    // separate error-tolerant update (same reason as rememberOutcome): the
    // insert trigger already tags a default workspace, this pins it to the
    // candidate's, and a pre-migration column absence stays non-fatal.
    try {
      await supabase
        .from("agent_memory")
        .update({ workspace_id: cand.workspace_id })
        .eq("id", memoryId);
    } catch {
      /* column not present yet (pre-migration) — non-fatal */
    }

    const { data: updated, error: updErr } = await supabase
      .from("memory_candidates")
      .update({ status: "approved", decided_by: userId, decided_at: nowIso })
      .eq("id", cand.id)
      .select("id")
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);
    if (!updated) throw new Error("decideMemoryCandidate: candidate not found or not accessible");

    return { ok: true, memoryId, superseded };
  });

// --- detectConflict: preview what an approval would supersede ---

const DetectSchema = z
  .object({
    content: z.string().trim().min(3).max(2000),
    workspaceId: z.string().uuid().nullable().optional(),
  })
  .strip();

export type DetectConflictResult = {
  conflict: { memoryId: string; content: string; similarity: number } | null;
};

/**
 * Best-effort preview: does `content` conflict with an existing workspace
 * memory? Used to show the reviewer (before they save) what an approval would
 * retire. Never throws — a null conflict is the safe default.
 */
export const detectConflict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DetectSchema>) => DetectSchema.parse(d))
  .handler(async ({ context, data }): Promise<DetectConflictResult> => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return { conflict: null };
    const match = await findConflictingMemory(supabase, userId, workspaceId, data.content);
    return {
      conflict: match
        ? { memoryId: match.id, content: match.content, similarity: match.similarity }
        : null,
    };
  });
