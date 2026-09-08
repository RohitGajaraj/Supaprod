// PC-36 G - the pure half of the Ask thread's conversation anatomy, split
// out of AskPanel.tsx per the house convention (logic in a lib file, thin
// JSX in the component) so it is unit-testable without the component graph.

import { parseChatMeta, type ChatMeta } from "@/lib/chat-meta";
import { isAnswerBlock, type AnswerBlock } from "@/lib/ask-blocks";

/** The wire shape getConversation returns per message (generated types
 * predate mission_id/metadata, so the row is typed here). */
export type StoredMessageRow = {
  id: string;
  role: string;
  content: string | null;
  created_at: string;
  mission_id?: string | null;
  metadata?: unknown;
};

export type PromotedRecordIds = Partial<{ note: string; decision: string; task: string }>;

export type HydratedMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  mission_id?: string | null;
  meta?: ChatMeta | null;
  blocks?: AnswerBlock[];
  /** What this answer was already promoted into (metadata.promoted), so the
   * receipt chips survive a refresh instead of offering a duplicate save. */
  promoted?: PromotedRecordIds;
};

const PROMOTE_KINDS = ["note", "decision", "task"] as const;

function parsePromoted(metadata: unknown): PromotedRecordIds | undefined {
  const raw = (metadata as { promoted?: unknown } | null)?.promoted;
  if (!raw || typeof raw !== "object") return undefined;
  const out: PromotedRecordIds = {};
  for (const kind of PROMOTE_KINDS) {
    const id = (raw as Record<string, unknown>)[kind];
    if (typeof id === "string" && id) out[kind] = id;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Rehydrate persisted rows into thread messages (PC-36: nothing said in Ask
 * may evaporate, including across a page refresh). Meta and typed blocks
 * ride inside metadata; rows that fail to parse degrade to plain prose
 * rather than dropping the message. System/tool rows never render.
 */
export function hydrateMessages(rows: StoredMessageRow[]): HydratedMsg[] {
  const out: HydratedMsg[] = [];
  for (const row of rows) {
    if (row.role !== "user" && row.role !== "assistant") continue;
    const at = Date.parse(row.created_at);
    const meta = parseChatMeta(row.metadata);
    const rawBlocks = (row.metadata as { blocks?: unknown } | null)?.blocks;
    const blocks = Array.isArray(rawBlocks) ? rawBlocks.filter(isAnswerBlock) : [];
    const promoted = parsePromoted(row.metadata);
    out.push({
      id: row.id,
      role: row.role,
      content: row.content ?? "",
      at: Number.isFinite(at) ? at : 0,
      ...(row.mission_id ? { mission_id: row.mission_id } : {}),
      ...(meta ? { meta } : {}),
      ...(blocks.length > 0 ? { blocks } : {}),
      ...(promoted ? { promoted } : {}),
    });
  }
  return out;
}

/** First markdown-stripped line of an answer, for promoted record titles (PC-36 E). */
export function answerTitle(text: string, max = 280): string {
  const line =
    text
      .split("\n")
      .map((l) =>
        l
          .replace(/^#{1,6}\s+/, "")
          .replace(/[*_`>]/g, "")
          .trim(),
      )
      .find((l) => l.length > 0) ?? "Ask answer";
  return line.slice(0, max);
}
