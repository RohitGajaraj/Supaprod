/**
 * Signal Fabric - the MANUAL lane.
 *
 * The connectors, the Scout, the MCP adapter and the public webhook each have a
 * producer that turns their payload into `SignalCandidate[]` and hands it to the
 * sink. The human did not. Every hand-entered signal was assembled as a raw
 * `signals` row at its own call site, which is why manual capture inherited none
 * of what the sink gives every other source: dedup, the `source_kind` stamp, the
 * `stage_events` trail, and the comparison vector.
 *
 * This is that missing producer, and it is PURE so the shape is pinned by tests
 * rather than by a live database. `discovery.functions.ts` wraps it with the
 * workspace lookup and the `writeSignals` call.
 *
 * Client-safe (types + string work only, no server imports), so the surface can
 * count what it is about to send before it sends it.
 */
import type { SignalCandidate } from "./kinds";

/**
 * What a person is holding when they capture something.
 *
 * These are facts about the MATERIAL, not about our storage. A note in their own
 * words, a document they wrote or were sent, a meeting transcript, and a block of
 * many separate observations pasted at once are four different things a product
 * lead actually has in hand, and each one carries a different provenance forward.
 */
export type ManualKind = "note" | "document" | "transcript" | "paste";

/** The `signals.source` token per kind. `source_kind` is always "manual"; this is
 *  the finer grain, and it is what the surface prints so a row never reads as if
 *  a connector produced it. */
export const MANUAL_SOURCE: Record<ManualKind, string> = {
  note: "note",
  document: "document",
  transcript: "transcript",
  paste: "paste",
};

/** One typed line becomes one signal. Two characters is the floor, below which a
 *  line is punctuation rather than an observation. */
export const MIN_LINE_CHARS = 2;

/** How many lines one paste may become. Matches the cap `bulkImportSignals` has
 *  enforced since it was written, so the two doors agree. */
export const MAX_PASTED_LINES = 200;

/** How much of a document or transcript is stored on the signal. Same ceiling as
 *  the bulk paste body. Anything past it is dropped, and the caller SAYS so
 *  rather than truncating in silence. */
export const MAX_BODY_CHARS = 50_000;

/** How long a derived title may be. `signals.title` is text, but a title is a
 *  row lead and a row lead never wraps. */
export const MAX_TITLE_CHARS = 200;

/**
 * A stable, non-cryptographic content key (FNV-1a, 32 bit, hex).
 *
 * Deliberately not `node:crypto`: this module is client-safe so the surface can
 * compute the same key the server will. Collision risk is irrelevant here because
 * the key is only ever compared inside one (user, workspace) and a collision
 * costs one skipped duplicate, never a wrong read.
 */
export function contentKey(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Collapse whitespace so the same document pasted with different wrapping keys
 *  identically. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * A title for a body that did not come with one: the first line that carries
 * words, trimmed to a row lead. Falls back to the caller's word when the body is
 * whitespace, because `signals.title` reading "" is worse than reading nothing.
 */
export function titleFromBody(body: string, fallback: string): string {
  const first = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!first) return fallback;
  const cleaned = first.replace(/^#{1,6}\s+/, "").trim();
  if (!cleaned) return fallback;
  return cleaned.length > MAX_TITLE_CHARS ? `${cleaned.slice(0, MAX_TITLE_CHARS - 1)}…` : cleaned;
}

/**
 * Free text a person typed, one signal per line.
 *
 * NO `externalId`, and that is the decision worth recording: repetition is
 * EVIDENCE here. Hearing "they want SSO" from three calls in one week is three
 * signals and the cluster's frequency is the whole point, so keying these by
 * content would quietly delete the second and third and make a loud pattern look
 * like a single remark. Documents and transcripts take the opposite rule below,
 * for the opposite reason.
 */
export function typedCandidates(
  text: string,
  kind: Extract<ManualKind, "note" | "paste"> = "note",
): SignalCandidate[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= MIN_LINE_CHARS)
    .slice(0, MAX_PASTED_LINES)
    .map((line) => ({
      source: MANUAL_SOURCE[kind],
      sourceKind: "manual" as const,
      title: line.length > MAX_TITLE_CHARS ? `${line.slice(0, MAX_TITLE_CHARS - 1)}…` : line,
      content: line,
      // A person typing into their own workspace is not an untrusted producer.
      untrusted: false,
    }));
}

/** What `bodyCandidate` decided, so the surface can report it instead of guessing. */
export type BodyCapture = {
  candidate: SignalCandidate;
  /** Characters dropped because the body ran past MAX_BODY_CHARS. Zero normally. */
  dropped: number;
};

/**
 * One document or one transcript, captured whole as ONE signal.
 *
 * KEYED by content, unlike typed lines. Re-uploading the same file is an accident
 * (a double click, a retry after a slow save), never new evidence, so the sink's
 * `external_id` dedup should absorb it and the surface should say "already on the
 * record" rather than growing a phantom cluster out of one document.
 *
 * SCREENED, unlike typed lines. The person chose the file, but they did not
 * necessarily write it: a customer-supplied brief or a vendor transcript is
 * third-party text that lands in the same context an agent later reads. The sink
 * already owns that screen; this just declares the material untrusted so it runs.
 */
export function bodyCandidate(
  kind: Extract<ManualKind, "document" | "transcript">,
  rawTitle: string,
  rawBody: string,
): BodyCapture {
  const body = rawBody.trim();
  const dropped = Math.max(0, body.length - MAX_BODY_CHARS);
  const content = dropped > 0 ? body.slice(0, MAX_BODY_CHARS) : body;
  const fallback = kind === "transcript" ? "Transcript" : "Document";
  const given = rawTitle.trim();
  const title =
    given.length > 0
      ? given.length > MAX_TITLE_CHARS
        ? `${given.slice(0, MAX_TITLE_CHARS - 1)}…`
        : given
      : titleFromBody(content, fallback);

  return {
    candidate: {
      externalId: `manual:${kind}:${contentKey(`${normalize(title)} ${normalize(content)}`)}`,
      source: MANUAL_SOURCE[kind],
      sourceKind: "manual",
      title,
      content: content || title,
      untrusted: true,
    },
    dropped,
  };
}

/** File extensions the product can actually read today. Kept here rather than in
 *  the component so the server-side story and the file picker cannot disagree.
 *  `.pdf` and `.docx` are absent on purpose: nothing in this repo parses either,
 *  and an accept filter that lets a file in only to fail on it is a dead end. */
export const READABLE_EXTENSIONS = [".txt", ".md", ".markdown", ".text", ".vtt", ".srt"] as const;

/** True when a file name ends in something we can turn into text. */
export function isReadableFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return READABLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
