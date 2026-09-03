import { parseChatMeta, type ChatMeta } from "@/lib/chat-meta";
import { parseResearchStatus, type ResearchStatus } from "@/components/chat/ResearchActivity";
import { isAnswerBlock, type AnswerBlock } from "@/lib/ask-blocks";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { asDispatchBlock, type DispatchBlock } from "@/lib/chat-dispatch";
import { parsePlanProposal, type PlanProposal } from "@/lib/ask/plan-proposal";

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
   * a classifier's guess that nothing routes by. `tool` goes out wherever a
   * tool really runs within the life of the stream: once per research phase
   * that calls one (`web.search`, `web.fetch`, `workspace.search`), and once on
   * the lightweight chat branch, which calls `retrieve` — `workspace.search`
   * itself — with no research pipeline around it. The phases that call nothing
   * send nothing. `landing` goes out once the mission row exists.
   *
   * WHAT THIS PROTOCOL CANNOT CARRY, AND WHY THAT IS NOT A MISSING LINE.
   *
   * A `tool` frame for MISSION work can never arrive on this stream. The
   * mission branch of `api/chat.ts` dispatches the run fire-and-forget through
   * `keepAliveAfterResponse`, then writes delta, station, landing, meta and
   * `[DONE]` and CLOSES the controller — all before the agent loop has called
   * anything. There is no emitter to add, because by the time a tool name
   * exists the stream it would travel on is shut. The frames above describe
   * what THE REQUEST did, and a mission is by construction work that outlives
   * the request.
   *
   * So the honest state of a dispatching turn is: one station (when a mention
   * named the agent), one landing, and then nothing. Filling that silence from
   * the client — a timer walking an index through step labels while the stream
   * is closed — is theatre by this repo's own definition, and a component was
   * deleted for exactly it.
   *
   * WHAT WOULD CARRY IT is a transport that outlives the request, and one
   * already exists: `_authenticated.runs.$missionId.tsx` polls the run every 4s
   * and its stage lineage every 8s, which is where mission tool names surface
   * today. The `landing` frame is the bridge to it — it hands the reader to the
   * run rather than pretending this stream can follow it. A per-run SSE
   * endpoint would upgrade that poll to a live feed, but it is a SECOND
   * transport with its own route and its own lifetime, not a line missing from
   * this one.
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
   *
   * A FOURTH JOINED THEM on 2026-08-22, and it is the one that says NO work
   * started. Its own comment is below `landing`; it belongs to this group and
   * follows every rule in it.
   */
  /** The work moved to this station. One of AGENT_STATION_ORDER. */
  | { kind: "station"; station: AgentStation }
  /** An agent started this tool. A registry name, never a sentence. */
  | { kind: "tool"; tool: string }
  /** The result came to rest here, so the reader can go and see it. */
  | { kind: "landing"; artifact: { kind: string; id: string; station?: AgentStation } }
  /**
   * ── THE FOURTH WORK FRAME: A RUN THAT DID NOT OPEN ──────────────────────
   *
   * The three above say what work DID. This one says that none started, and it
   * exists because the alternative was the failure this protocol keeps making
   * in a new place each time: a real state delivered as a paragraph.
   *
   * WHAT IT REPLACES, WHICH WAS ALREADY THE SECOND ATTEMPT. The first version
   * of a blocked dispatch spliced the Postgres error into the answer prompt and
   * had a model paraphrase it, so the person read a generated account of a
   * database fault. That was repaired on 2026-08-20 into `dispatchBlockedMessage`
   * — our own sentence, written once, never paraphrased. Better, and still
   * prose: it arrives on the delta channel, renders inside `Answer`, and is
   * pixel-for-pixel an answer. Somebody who pressed "Hand it over" gets back
   * something shaped exactly like the thing they did not ask for, and neither
   * the pane nor any later reader of the transcript can tell a refusal from a
   * reply. A protocol that can say "the work landed on Build" and cannot say
   * "no work started" is missing the half that matters more.
   *
   * IT CARRIES THE ID, NOT THE SENTENCE, on the rule the three frames above
   * already follow: the smallest honest fact, never a rendered string. The
   * words live in `dispatchBlockedMessage` and the destination in
   * `dispatchBlockRoute`, both keyed off this id, so the sentence a person
   * reads and the button they press cannot name two different things.
   *
   * VALIDATED AGAINST THE CLOSED SET, exactly like `station`: a reason this
   * client does not know parses as `ignored`, so a server that grows a sixth
   * state degrades to the prose that still streams beside this frame rather
   * than rendering an empty card.
   */
  | { kind: "dispatch-blocked"; reason: DispatchBlock }
  /**
   * ── THE FIFTH WORK FRAME, AND THE ONLY ONE THAT ASKS SOMETHING ──────────
   *
   * The four above REPORT: work moved here, a tool ran, a result landed, no run
   * opened. This one proposes, and then the request stops and waits.
   *
   * WHY IT IS NOT A CONTRADICTION OF THE RULE ABOVE. Every frame in this
   * protocol is emitted only where it is a FACT rather than a forecast, and a
   * proposal looks like the forecast the rule forbids. It is not, and the
   * distinction is the same one the `void routed` paragraph in `api/chat.ts`
   * draws: what was refused there was a classifier's guess printed as a REPORT
   * about a dispatch that had already happened. This frame is emitted BEFORE
   * anything is dispatched, and what it asserts is checkable on the spot — no
   * mission row exists, nothing has been charged, and this is the route the work
   * would take. A person is being asked, not told.
   *
   * IT CARRIES THE INPUTS TO THE ROUTE, NOT THE ROUTE. `routeIntent` is pure, so
   * shape + station + origin regenerate the path, the waivers and the crew
   * identically on either side of the wire. That is what lets the confirmation
   * route recompute the plan a person answered about instead of trusting a copy
   * of it. See `plan-proposal.ts`, which is where the whole argument lives.
   *
   * THE STREAM ENDS UNDER IT, on purpose. A gate makes the request outlive its
   * own stream, so the answer cannot come back on it; `/api/plan-gate` is the
   * transport for that, the way `mission_steps` approvals already work. This
   * frame is the handover to it.
   */
  | { kind: "plan-proposal"; proposal: PlanProposal }
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

  /**
   * `dispatch_blocked`, not `blocked`, and the long name is deliberate: `block`
   * is already this protocol's word for a typed ANSWER card (`AnswerBlock`), and
   * two frames one letter apart in a wire format nobody can typecheck is how the
   * next reader ships the wrong one. Read as an object with a `reason` rather
   * than a bare string so the frame has somewhere to grow — a retry-after, an
   * error id — without a second key at the top level.
   */
  const blockedReason = asDispatchBlock(
    (parsed as { dispatch_blocked?: { reason?: unknown } }).dispatch_blocked?.reason,
  );
  if (blockedReason) return { kind: "dispatch-blocked", reason: blockedReason };

  /**
   * The plan a person is being asked about. Read through `parsePlanProposal`
   * rather than cast, on this protocol's standing rule: a proposal that fails
   * any one of its checks parses as `ignored`, so a gate is never drawn about a
   * plan whose shape, station or ceiling this client cannot name. The one
   * surface where silence beats a guess is the one that decides how much may be
   * spent without asking again.
   */
  const proposal = parsePlanProposal((parsed as { plan_proposal?: unknown }).plan_proposal);
  if (proposal) return { kind: "plan-proposal", proposal };

  const choices = (parsed as { choices?: { delta?: { content?: string; mission_id?: string } }[] })
    .choices;
  const piece = choices?.[0]?.delta?.content;
  const missionId = choices?.[0]?.delta?.mission_id;
  if (piece || missionId) return { kind: "delta", piece, missionId };
  return { kind: "ignored" };
}
