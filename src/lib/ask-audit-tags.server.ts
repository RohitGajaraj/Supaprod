/**
 * The server half of "an id in a question is a lookup". See `ask-audit-tags.ts`
 * for why this exists and what the emitted block promises.
 *
 * WHY THIS FILE RESOLVES NOTHING ITSELF. `resolveEntityLineage`
 * (audit-lineage.functions.ts) already turns a tag into a titled row: it owns
 * the table map, the uuid prefix range, the collision report, and the connected
 * links. A second resolver here would be a second answer to "what is
 * MIS·600000", and the two would drift the first time either was fixed. So this
 * calls it and translates, and the only judgement it makes is which tags to look
 * up and what to say about the ones it did not.
 *
 * IT TAKES THE CALLER'S CLIENT, and that is the whole security story. The
 * client passed in from /api/chat is the per-user RLS-scoped one (same pattern
 * as `resolveAnswerBlocks`), so a tag from another workspace matches no row and
 * comes back not-found. There is no path here that can print a title the caller
 * could not already read, and no admin client is imported, so there is none to
 * reach for by accident.
 *
 * ON THE SHAPE COMING BACK. `AuditLineage` belongs to another lane and is under
 * active edit, so this reads only the fields it needs and tolerates extra ones
 * arriving. `ambiguous` landed while this was being written and is handled as a
 * state of its own rather than folded into "not found", because a colliding tag
 * that reports as missing is a lie about a record that is right there.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuditIds, formatAuditId } from "@/lib/audit-id";
import { resolveEntityLineage, type AuditLineage } from "@/lib/audit-lineage.functions";
import {
  MAX_RESOLVED_TAGS,
  MAX_LISTED_CANDIDATES,
  formatAuditTagBlock,
  type AuditTagCandidate,
  type ResolvedAuditTag,
} from "@/lib/ask-audit-tags";

export type AuditTagContext = {
  /** The system-prompt block, or "" when the question named no tags. */
  block: string;
  /** The per-tag facts, so a caller can also render what was resolved. */
  resolved: ResolvedAuditTag[];
};

const EMPTY: AuditTagContext = { block: "", resolved: [] };

/** How many connected links are worth naming before the block becomes a map. */
const MAX_CONNECTED = 5;

function base(ref: string): ResolvedAuditTag {
  return {
    ref,
    state: "not_found",
    kind: null,
    entityId: null,
    label: null,
    stage: null,
    title: null,
    status: null,
    createdAt: null,
    who: null,
    connected: [],
    candidates: [],
    candidateCount: 0,
  };
}

/** The connected entities the lineage walk found, deduped and capped. */
function connectedRefs(lineage: AuditLineage): string[] {
  const steps = Array.isArray(lineage.steps) ? lineage.steps : [];
  const out: string[] = [];
  for (const step of steps) {
    // The first step's ref is the entity itself; only link steps point out.
    if (!step || typeof step.ref !== "string" || !step.ref) continue;
    if (typeof step.label !== "string" || !step.label.startsWith("Connected ")) continue;
    if (out.includes(step.ref)) continue;
    out.push(step.ref);
    if (out.length >= MAX_CONNECTED) break;
  }
  return out;
}

/** Only what the resolver actually returned; a malformed row is dropped, not
 *  patched up with a placeholder that would read as a fact. */
function candidatesOf(lineage: AuditLineage): AuditTagCandidate[] {
  const raw = Array.isArray(lineage.candidates) ? lineage.candidates : [];
  const out: AuditTagCandidate[] = [];
  for (const c of raw) {
    if (!c || typeof c.entityId !== "string" || !c.entityId) continue;
    out.push({
      entityId: c.entityId,
      title: typeof c.title === "string" ? c.title : c.entityId,
      status: typeof c.status === "string" ? c.status : null,
      createdAt: typeof c.createdAt === "string" ? c.createdAt : null,
    });
    if (out.length >= MAX_LISTED_CANDIDATES) break;
  }
  return out;
}

function translate(ref: string, lineage: AuditLineage): ResolvedAuditTag {
  const row = base(ref);
  const known = { kind: lineage.kind ?? null, label: lineage.label ?? null };

  // Checked before `found`, because the resolver leaves `found` false on a
  // collision so that older consumers fall back to their empty state.
  if (lineage.ambiguous === true) {
    const candidates = candidatesOf(lineage);
    return {
      ...row,
      ...known,
      state: "ambiguous",
      stage: lineage.stage ?? null,
      candidates,
      candidateCount: Math.max(
        typeof lineage.candidateCount === "number" ? lineage.candidateCount : 0,
        candidates.length,
      ),
    };
  }

  if (!lineage.found) return { ...row, ...known };

  return {
    ...row,
    ...known,
    ref: typeof lineage.ref === "string" && lineage.ref ? lineage.ref : ref,
    state: "found",
    entityId: lineage.entityId ?? null,
    stage: lineage.stage ?? null,
    title: lineage.title ?? null,
    status: lineage.status ?? null,
    createdAt: lineage.createdAt ?? null,
    who: lineage.who ?? null,
    connected: connectedRefs(lineage),
  };
}

/**
 * Look up every audit tag named in an Ask question, up to the cap, and return
 * the facts plus the block to put in front of the model.
 *
 * Never throws: a question with no tags, or a lookup that falls over, returns a
 * context the caller can push into the prompt unconditionally. A failed lookup
 * becomes "not checked" rather than vanishing, so the model is never quietly
 * left to invent the record it was denied.
 */
export async function resolveAuditTagContext(
  supabase: SupabaseClient,
  question: string,
): Promise<AuditTagContext> {
  let named: ReturnType<typeof findAuditIds>;
  try {
    named = findAuditIds(question);
  } catch (e) {
    console.error("[ask-audit-tags] tag scan failed (skipping):", e);
    return EMPTY;
  }
  if (named.length === 0) return EMPTY;

  const picked = named.slice(0, MAX_RESOLVED_TAGS);
  const overflow = named.slice(MAX_RESOLVED_TAGS).map((p) => formatAuditId(p.kind, p.short));

  const resolved = await Promise.all(
    picked.map(async (p): Promise<ResolvedAuditTag> => {
      const ref = formatAuditId(p.kind, p.short);
      try {
        const lineage = await resolveEntityLineage(supabase, ref);
        if (!lineage || typeof lineage !== "object") {
          return { ...base(ref), state: "unchecked", kind: p.kind };
        }
        return translate(ref, lineage);
      } catch (e) {
        console.error(`[ask-audit-tags] lookup failed for ${ref}:`, e);
        return { ...base(ref), state: "unchecked", kind: p.kind };
      }
    }),
  );

  return { block: formatAuditTagBlock(resolved, overflow), resolved };
}
