import { parseChatMeta, type ChatMeta } from "@/components/chat/MessageMeta";
import { parseResearchStatus, type ResearchStatus } from "@/components/chat/ResearchActivity";
import { isAnswerBlock, type AnswerBlock } from "@/lib/ask-blocks";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

// OBS-12 - the pure half of the Ask panel's SSE line parser, split out of
// `AskPanel.tsx` so the /api/chat protocol handling (status/meta/delta
// routing) is unit-testable without a mounted React tree. Byte-identical
// logic to the retired `_authenticated.chat.tsx` `sendMessage` reader.

export type SseEvent =
  | { kind: "status"; status: ResearchStatus }
  | { kind: "meta"; meta: ChatMeta }
  /** PC-36 C: one typed answer block (decision/opportunity/mission/status/timeline). */
  | { kind: "block"; block: AnswerBlock }
  /** The answer's persisted row id, so promote actions can record themselves. */
  | { kind: "persisted"; messageId: string }
  | { kind: "delta"; piece?: string; missionId?: string }
  /**
   * THE THREE FRAMES THAT GIVE THIS PROTOCOL A WORD FOR WORK.
   *
   * The five above describe an ANSWER: its status, its metadata, its blocks,
   * its persisted id, its text. That is the whole vocabulary, and it is why a
   * conversational front door cannot yet show what the crew is doing: when a
   * message dispatches work rather than answering, the server emits one delta
   * carrying a mission id and then `[DONE]`, and the pane goes blind and falls
   * back to a four-second poll. A surface whose promise is showing the work
   * cannot be built on a protocol with no word for it.
   *
   * ALL THREE ARE EMITTED NOW, and each only where it is a FACT rather than a
   * forecast, which is the rule that decides where the emitters sit rather than
   * a matter of coverage. `api/chat.ts` sends `station` on the mention branch
   * only, off the station of the agent a mention actually resolved to, and
   * stays silent on the orchestrator branch because there the entry station is
   * a classifier's guess that nothing routes by. `tool` goes out per research
   * phase that really calls one (`web.search`, `web.fetch`,
   * `workspace.search`); the phases that call nothing send nothing. `landing`
   * goes out once the mission row exists.
   *
   * They were declared, parsed and accumulated for some hours before anything
   * sent one. That was survivable because they are additive and the consumer
   * tolerates unknown kinds (its branch chain ends in
   * `if (event.kind !== "delta") continue`), but it is also this repo's
   * signature defect, and the reason the emitters are worth naming here: the
   * next reader should be able to tell from the protocol file whether a frame
   * has a writer.
   *
   * Each carries the SMALLEST honest fact, never a rendered sentence: an id the
   * client already knows how to name. `station` is one of the seven; `tool` is
   * a registry name, which `toolActionLabel` turns into "drafting a spec";
   * `landing` is where a result came to rest, so a run can hand back to the
   * station that owns it instead of ending in a chat log.
   */
  /** The work moved to this station. One of AGENT_STATION_ORDER. */
  | { kind: "station"; station: AgentStation }
  /** An agent started this tool. A registry name, never a sentence. */
  | { kind: "tool"; tool: string }
  /** The result came to rest here, so the reader can go and see it. */
  | { kind: "landing"; artifact: { kind: string; id: string; station?: AgentStation } }
  | { kind: "done" }
  | { kind: "ignored" }
  /** JSON.parse failed - the line may be a chunk-boundary split; the caller
   * must re-buffer it (with its trailing newline) and wait for more data,
   * exactly like the retired chat.tsx reader did. Distinct from `null`
   * (not a `data: ` line at all), which the caller can just skip. */
  | { kind: "parse-error" };

/**
 * A station id, or null. Strict on purpose: the seven are a closed set, and a
 * frame naming an eighth is a server this client does not understand yet.
 */
function parseStation(value: unknown): AgentStation | null {
  if (typeof value !== "string") return null;
  return (AGENT_STATION_ORDER as readonly string[]).includes(value)
    ? (value as AgentStation)
    : null;
}

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
  const persistedId = (parsed as { persisted?: { message_id?: unknown } }).persisted?.message_id;
  if (typeof persistedId === "string" && persistedId)
    return { kind: "persisted", messageId: persistedId };
  /**
   * The work frames, checked BEFORE `delta` and after the answer frames, so a
   * payload can never be read as two things. Each validates rather than trusts:
   * an unknown station id parses as `ignored`, exactly as an unknown frame
   * always has, so a server that emits something this client does not
   * understand degrades to silence instead of rendering a guess.
   */
  const station = parseStation((parsed as { station?: unknown }).station);
  if (station) return { kind: "station", station };

  const tool = (parsed as { tool?: unknown }).tool;
  if (typeof tool === "string" && tool.trim()) return { kind: "tool", tool: tool.trim() };

  const landing = (parsed as { landing?: unknown }).landing;
  if (landing && typeof landing === "object") {
    const l = landing as { kind?: unknown; id?: unknown; station?: unknown };
    if (typeof l.kind === "string" && l.kind && typeof l.id === "string" && l.id) {
      const at = parseStation(l.station);
      return {
        kind: "landing",
        artifact: { kind: l.kind, id: l.id, ...(at ? { station: at } : {}) },
      };
    }
  }

  const choices = (parsed as { choices?: { delta?: { content?: string; mission_id?: string } }[] })
    .choices;
  const piece = choices?.[0]?.delta?.content;
  const missionId = choices?.[0]?.delta?.mission_id;
  if (piece || missionId) return { kind: "delta", piece, missionId };
  return { kind: "ignored" };
}
