// SW-3 mission 3.2: extract the alternatives a mission's own output explicitly
// rejected, so an agent-captured decision carries its paths-not-taken
// (decisions.alternatives_considered). HONEST extraction only: rows come solely
// from lines where the source text literally names a rejected path (an
// "Alternatives considered" section, or a "Rejected ..." bullet). Prose that
// never names one yields [], never a fabrication. Pure + DB-free.

export type RejectedAlternative = { title: string; reason_rejected: string };

const MAX_ALTERNATIVES = 8;
const TITLE_MAX = 280;
const REASON_MAX = 500;

/** A heading line that opens an explicit alternatives section. */
const SECTION_HEADING =
  /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:alternatives considered|paths not taken|rejected (?:alternatives|options|paths|approaches))\s*:?\s*(?:\*\*)?\s*$/i;
/** A markdown-ish bullet line. */
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;
/** A standalone "Rejected ..." bullet anywhere in the text. */
const REJECTED_BULLET = /^\s*(?:[-*•]|\d+[.)])\s+rejected\b[:\s]*(.+)$/i;

/** Split one named alternative into title + reason. Separators tried in order:
 * "title: reason", then a spaced em dash, en dash, or hyphen. A bullet with no
 * separator keeps the whole line as the title and states honestly that the
 * reason was not given. */
function splitTitleReason(line: string): RejectedAlternative | null {
  const cleaned = line.replace(/\*\*/g, "").trim();
  if (!cleaned) return null;
  const seps = [": ", " \u2014 ", " \u2013 ", " - "];
  for (const sep of seps) {
    const at = cleaned.indexOf(sep);
    if (at > 0) {
      const title = cleaned.slice(0, at).trim();
      const reason = cleaned.slice(at + sep.length).trim();
      if (title && reason) {
        return { title: title.slice(0, TITLE_MAX), reason_rejected: reason.slice(0, REASON_MAX) };
      }
    }
  }
  return {
    title: cleaned.slice(0, TITLE_MAX),
    reason_rejected: "Reason not stated in the source output.",
  };
}

/** PURE: scan agent output for explicitly named rejected paths. */
export function extractRejectedAlternatives(
  text: string | null | undefined,
  max = MAX_ALTERNATIVES,
): RejectedAlternative[] {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/);
  const out: RejectedAlternative[] = [];
  const seen = new Set<string>();
  const push = (alt: RejectedAlternative | null) => {
    if (!alt || out.length >= max) return;
    const key = alt.title.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(alt);
  };

  let i = 0;
  while (i < lines.length) {
    if (SECTION_HEADING.test(lines[i])) {
      // Consume the section's bullet run: skip leading blanks, stop at the
      // first non-blank non-bullet line (or a blank after bullets started).
      let j = i + 1;
      let sawBullet = false;
      while (j < lines.length) {
        const line = lines[j];
        if (!line.trim()) {
          if (sawBullet) break;
          j++;
          continue;
        }
        const m = BULLET.exec(line);
        if (!m) break;
        sawBullet = true;
        // Inside an explicit section a leading "Rejected:" marker is noise;
        // the title is the path itself.
        push(splitTitleReason(m[1].replace(/^rejected\b[:\s]*/i, "")));
        j++;
      }
      i = j;
      continue;
    }
    const m = REJECTED_BULLET.exec(lines[i]);
    if (m) push(splitTitleReason(m[1]));
    i++;
  }
  return out;
}
