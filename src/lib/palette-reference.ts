/**
 * Paste an id, land on the thing.
 *
 * Founder ruling 2026-07-30: *"if I give the ID it should show me the details
 * and the connected lineages."* Every core entity has printed a canonical tag
 * on its card since 2026-07-13 (`MIS·7E7D59`, `OPP·005C82`), and until now
 * nothing in the product would take one back. This is the reading step: given
 * one typed line, decide whether it IS a reference to a record rather than a
 * question, so the surface can offer to open it instead of sending it to a
 * model that will guess.
 *
 * PURE. No React, no DB, no server import, so it unit-tests as arithmetic.
 *
 * WHY THIS IS NOT A CHANGE TO `parseAuditId`. That function is the shared
 * contract: `audit-lineage.functions.ts` resolves real rows with it and its
 * behaviour is pinned by `audit-id.test.ts`. Widening it would widen every
 * caller at once. This is one surface's own reading of one line, and it is
 * deliberately both wider and narrower than the shared parser:
 *
 *   WIDER ON THE SEPARATOR. The canonical tag prints a middle dot, and almost
 *   nobody can type one. A person copying a tag out of a terminal, a chat
 *   message or a screenshot arrives with a hyphen, a space or a period.
 *   `parseAuditId` already accepts `·`, `-`, `:`, `_`, `/` and whitespace; the
 *   period is the one real-world separator it does not, so a period is
 *   normalised here before the token is handed over. The shared parser still
 *   decides what a prefix means: this file owns no vocabulary of its own.
 *
 *   NARROWER ON THE REF. `parseAuditId` takes two or more alphanumerics after
 *   the prefix, which is right for a lenient parse and wrong for a suggestion
 *   row that must not light up on ordinary prose: under that rule `doc.md` and
 *   `pro.beta` are both valid references. A canonical short is whatever
 *   `formatAuditId` prints, which is the first six alphanumerics of the row's
 *   uuid, and every one of the twelve audit tables keys on `uuid` (verified
 *   against the migrations, not assumed), so a real short is ALWAYS exactly six
 *   hex characters. Requiring exactly that is what stops a sentence from
 *   looking like an id.
 *
 * ON BARE UUIDS. A uuid names a row but not a table, so `kind` comes back null
 * and the caller cannot say what it is looking at until something resolves it.
 * Worth knowing before you wire one up: `getEntityLineage` resolves its input
 * through `parseAuditId`, which cannot parse a bare uuid, so the pane answers
 * "not found" for one today. Detecting it here is still the right half of the
 * job (the surface can offer the row, and gains a real answer the moment the
 * resolver learns to sweep by uuid); claiming it works would not be.
 */

import { parseAuditId, formatAuditId, type AuditKind } from "@/lib/audit-id";

export type DetectedReference = {
  /** The entity kind for a tag. Null for a bare uuid, which names no table. */
  kind: AuditKind | null;
  /** The short trace for a tag (six hex, uppercase); the uuid for a uuid. */
  id: string;
  /** What to hand to `openLineage`: the canonical tag, or the uuid. */
  ref: string;
};

/** A stage prefix, any separator a human plausibly types, and exactly the six
 *  hex characters `formatAuditId` prints. Anchored: this reads a whole line, so
 *  a sentence that merely contains a tag is prose, not a reference. */
const TAG = /^([A-Za-z]{2,4})[\s.·:_/-]+([0-9A-Fa-f]{6})$/;

/** The canonical dashed form, which is how a uuid arrives from a URL or a
 *  copy out of the table. Case-insensitive, like everything else here. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Read one typed line as a reference to a record, or return null.
 *
 * Case-insensitive throughout: `mis·7e7d59` and `MIS-7E7D59` are the same
 * reference, and both come back in the canonical form the record prints.
 */
export function detectReference(query: string): DetectedReference | null {
  const text = query.trim();
  if (!text) return null;

  const m = TAG.exec(text);
  if (m) {
    // Re-joined with the separator the shared parser already takes, so the
    // prefix vocabulary keeps exactly one owner (audit-id.ts). An unknown
    // prefix returns null there and is not a reference here either.
    const parsed = parseAuditId(`${m[1]}·${m[2]}`);
    if (!parsed) return null;
    return {
      kind: parsed.kind,
      id: parsed.short,
      // The canonical formatter, not a hand-built string, so the row a person
      // clicks and the tag a card prints can never disagree.
      ref: formatAuditId(parsed.kind, parsed.short),
    };
  }

  if (UUID.test(text)) {
    const id = text.toLowerCase();
    return { kind: null, id, ref: id };
  }

  return null;
}
