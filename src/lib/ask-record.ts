/**
 * The third register: "From the record".
 *
 * THE ONE RULE. A citation here is assembled from facts the SERVER resolved,
 * never from anything the model wrote. `ask-blocks.server.ts` picks its blocks
 * deterministically from retrieval refs (its own header: "No model call decides
 * a block, so the vocabulary stays honest"), and `meta.sources` are the records
 * retrieval actually read. Both carry an id, a title and a date. This module
 * turns one of those into a sentence and its evidence, and returns null when
 * there is nothing to turn.
 *
 * That is why it is pure and lives here rather than inside the pane: a
 * fabricated citation on the brain surface is the worst defect this product can
 * ship, so the code that could commit it is one small file with a test beside
 * it and no access to the answer prose.
 *
 * NOT drawn from: the answer text (the model wrote it), the `status` block (a
 * live count of what is running is the present, not the record), or a web
 * source (the workspace's own history is the claim being made).
 */

import type { AnswerBlock } from "@/lib/ask-blocks";
import type { ChatMeta, ChatSource } from "@/components/chat/MessageMeta";
import { formatAuditId } from "@/lib/audit-id";

export type RecordCitation = {
  /** What the record says. A claim, in plain words. */
  text: string;
  /** What backs it: an audit tag, a date, a count. Mono. */
  evidence: string | null;
  /** Where to read it in full, or null when the entity has no surface. */
  href: string | null;
};

/** A short date, never a fake precision. */
function on(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function join(parts: (string | null)[]): string | null {
  const kept = parts.filter((p): p is string => !!p && p.length > 0);
  return kept.length ? kept.join(" · ") : null;
}

/** One line, so a citation never becomes a paragraph inside a 392px pane. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function clip(s: string, max = 120): string {
  const t = oneLine(s);
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
}

/** Internal records only. A web page is not this workspace's history. */
export function isInternalSource(s: ChatSource): s is ChatSource & { href: string } {
  return s.kind !== "web" && typeof s.href === "string" && s.href.length > 0;
}

const SOURCE_NOUN: Record<string, string> = {
  signal: "a signal",
  prd: "a spec",
  doc: "a document",
  meeting: "a meeting",
  opportunity: "an opportunity",
  roadmap: "the roadmap",
  decision: "a decision",
  mission: "a run",
  finding: "a finding",
};

function fromDecision(b: Extract<AnswerBlock, { kind: "decision" }>): RecordCitation {
  const s = (b.status ?? "").toLowerCase();
  const title = clip(b.title);
  const text =
    s === "approved" || s === "accepted"
      ? `This was decided already: ${title}. It still stands.`
      : s === "rejected" || s === "dropped"
        ? `This came up before and was turned down: ${title}.`
        : `A call on this is already open: ${title}.`;
  return {
    text,
    evidence: join([formatAuditId("decision", b.id), on(b.createdAt)]),
    href: `/brain?tab=decisions&decision=${b.id}`,
  };
}

const MISSION_LINE: Record<string, (t: string) => string> = {
  completed: (t) => `The crew has run this before: ${t}. It finished.`,
  failed: (t) => `The crew ran this before and it failed: ${t}.`,
  running: (t) => `This is running right now: ${t}.`,
};

function fromMission(b: Extract<AnswerBlock, { kind: "mission" }>): RecordCitation {
  const title = clip(b.title);
  const line = MISSION_LINE[(b.status ?? "").toLowerCase()];
  return {
    text: line ? line(title) : `The crew already has this on the record: ${title}.`,
    evidence: join([formatAuditId("mission", b.id), on(b.createdAt)]),
    href: `/runs/${b.id}`,
  };
}

function fromOpportunity(b: Extract<AnswerBlock, { kind: "opportunity" }>): RecordCitation {
  return {
    text: `This is already on the board: ${clip(b.title)}.`,
    evidence: join([
      formatAuditId("opportunity", b.id),
      b.status ? `ranked ${b.status}` : null,
      typeof b.iceScore === "number" ? `ICE ${b.iceScore}` : null,
    ]),
    href: "/arriving",
  };
}

function fromTimeline(b: Extract<AnswerBlock, { kind: "timeline" }>): RecordCitation | null {
  if (b.events.length === 0) return null;
  const n = b.events.length;
  const window = b.label.toLowerCase();
  const newest = b.events[0];
  return {
    text: `${n === 1 ? "One thing" : `${n} things`} touched this in the ${window}.`,
    evidence: join([clip(newest.label, 60), newest.ref, on(newest.at)]),
    href: null,
  };
}

function fromSource(s: ChatSource & { href: string }): RecordCitation {
  const noun = SOURCE_NOUN[s.kind] ?? "a record";
  return {
    text: `This is on the record already, as ${noun}: ${clip(s.title)}.`,
    evidence: s.sub ? clip(s.sub, 60) : null,
    href: s.href,
  };
}

/**
 * The citation for one answered turn, or null.
 *
 * Order is by how much the fact CLAIMS, not by how recent it is: a decision
 * contradicts or confirms you, a run is precedent, an opportunity is a
 * position already taken, a timeline is a count. A retrieved source is last
 * because it only says the record was read, and it is still better than
 * silence when it is all we have.
 */
export function recordCitationFor(msg: {
  blocks?: AnswerBlock[] | null;
  meta?: ChatMeta | null;
}): RecordCitation | null {
  const blocks = msg.blocks ?? [];

  const decision = blocks.find((b) => b.kind === "decision");
  if (decision) return fromDecision(decision);

  const mission = blocks.find((b) => b.kind === "mission");
  if (mission) return fromMission(mission);

  const opportunity = blocks.find((b) => b.kind === "opportunity");
  if (opportunity) return fromOpportunity(opportunity);

  const timeline = blocks.find((b) => b.kind === "timeline");
  if (timeline) {
    const cited = fromTimeline(timeline);
    if (cited) return cited;
  }

  const internal = (msg.meta?.sources ?? []).filter(isInternalSource);
  if (internal.length > 0) return fromSource(internal[0]);

  // Nothing the record can be quoted on. The register is ABSENT, and the pane
  // draws nothing in its place. A plausible sentence here would be the one
  // defect this whole file exists to prevent.
  return null;
}
