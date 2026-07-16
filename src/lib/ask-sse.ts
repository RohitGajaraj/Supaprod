import { parseChatMeta, type ChatMeta } from "@/components/chat/MessageMeta";
import { parseResearchStatus, type ResearchStatus } from "@/components/chat/ResearchActivity";
import { isAnswerBlock, type AnswerBlock } from "@/lib/ask-blocks";

// OBS-12 - the pure half of the Ask panel's SSE line parser, split out of
// `AskPanel.tsx` so the /api/chat protocol handling (status/meta/delta
// routing) is unit-testable without a mounted React tree. Byte-identical
// logic to the retired `_authenticated.chat.tsx` `sendMessage` reader.

export type SseEvent =
  | { kind: "status"; status: ResearchStatus }
  | { kind: "meta"; meta: ChatMeta }
  /** PC-36 C: one typed answer block (decision/opportunity/mission/status/timeline). */
  | { kind: "block"; block: AnswerBlock }
  | { kind: "delta"; piece?: string; missionId?: string }
  | { kind: "done" }
  | { kind: "ignored" }
  /** JSON.parse failed - the line may be a chunk-boundary split; the caller
   * must re-buffer it (with its trailing newline) and wait for more data,
   * exactly like the retired chat.tsx reader did. Distinct from `null`
   * (not a `data: ` line at all), which the caller can just skip. */
  | { kind: "parse-error" };

/** PURE - parses one `data: ` SSE line (payload already stripped of the prefix is NOT required; pass the raw line). */
export function parseSseLine(line: string): SseEvent | null {
  if (!line.startsWith("data: ")) return null;
  const payload = line.slice(6).trim();
  if (payload === "[DONE]") return { kind: "done" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { kind: "parse-error" };
  }
  const status = parseResearchStatus((parsed as { status?: unknown }).status);
  if (status) return { kind: "status", status };
  const meta = parseChatMeta((parsed as { meta?: unknown }).meta);
  if (meta) return { kind: "meta", meta };
  const block = (parsed as { block?: unknown }).block;
  if (isAnswerBlock(block)) return { kind: "block", block };
  const choices = (parsed as { choices?: { delta?: { content?: string; mission_id?: string } }[] })
    .choices;
  const piece = choices?.[0]?.delta?.content;
  const missionId = choices?.[0]?.delta?.mission_id;
  if (piece || missionId) return { kind: "delta", piece, missionId };
  return { kind: "ignored" };
}
