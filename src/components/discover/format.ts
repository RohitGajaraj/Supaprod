import { plainProse } from "@/lib/plain-prose";
import type { CriticReview } from "@/lib/discovery.functions";

export type VerdictWord = "SHIP" | "REVISE" | "KILL" | "WATCH" | "PENDING";

/** The subset of an opportunity row `verdictFor` reads. */
export interface OpportunityVerdictInput {
  status: string;
  critic_review?: CriticReview | null;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Mono-caps relative time: `12M AGO` / `1H AGO` / `3D AGO`. Floors to zero
 * for future or malformed timestamps rather than showing a negative value. */
export function relTimeCaps(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const deltaMs = Math.max(0, Date.now() - then);
  if (deltaMs < HOUR_MS) return `${Math.max(1, Math.floor(deltaMs / MINUTE_MS))}M AGO`;
  if (deltaMs < DAY_MS) return `${Math.floor(deltaMs / HOUR_MS)}H AGO`;
  return `${Math.floor(deltaMs / DAY_MS)}D AGO`;
}

/** `intercom` -> `INTERCOM`. */
export function sourceCaps(source: string): string {
  return source.toUpperCase();
}

// --- Where a signal came from, in words -------------------------------------
//
// Discover printed the raw `signals.source` token, so the queue read `note`,
// `pull_connector`, `transcript_action`, `product_pulse`. Those are OUR column
// values, not a sentence, and the one question a person asks about a row they did
// not expect is "why is this in front of me". A signal a colleague pasted by hand
// and a signal a connector pulled at 4am are the same shape on screen and are
// completely different levels of evidence, so the provenance has to be readable.
//
// Two inputs because the fabric carries two facts: `source_kind` is the LANE
// (manual, pull_connector, web_scout, mcp_source, webhook) and `source` is the
// CHANNEL inside it (github, note, transcript). The channel wins when we have a
// word for it, because "GitHub" tells you more than "Connected tools"; the lane
// is the fallback, which is what makes a brand new connector readable on the day
// it ships rather than after someone remembers to add it here.

/** The lanes of the signal fabric (`signals.source_kind`), in plain words. */
const KIND_WORDS: Record<string, string> = {
  manual: "Captured by hand",
  pull_connector: "A connected tool",
  web_scout: "The web scout",
  mcp_source: "A connected agent",
  webhook: "An inbound webhook",
};

/** Channels we can name outright. Every manual channel is here, because those are
 *  the ones a person needs to recognise as their own work. */
const SOURCE_WORDS: Record<string, string> = {
  note: "A note you wrote",
  document: "A document you added",
  transcript: "A transcript you added",
  paste: "Lines you pasted",
  manual: "Captured by hand",
  doc: "A page from Written",
  meeting: "A meeting",
  transcript_action: "A recorded call",
  product_pulse: "Feedback on Supaprod",
  webhook: "An inbound webhook",
  mcp: "A connected agent",
};

/** Products whose own capitalisation we should not mangle. */
const BRAND_WORDS: Record<string, string> = {
  github: "GitHub",
  gitlab: "GitLab",
  posthog: "PostHog",
  hubspot: "HubSpot",
  g2: "G2",
};

/** `scout_competitor` -> `Scout competitor`. The honest last resort: a channel we
 *  have no word for is still readable, and it never pretends to be something it
 *  is not. */
function prettyToken(token: string): string {
  const words = token.replace(/[_-]+/g, " ").trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * One readable phrase for where a signal came from.
 *
 * Also serves the coverage list, whose grouping key is `source_kind || source`,
 * so a lane token arriving in the `source` position resolves the same way.
 */
export function sourceLabel(source: string | null | undefined, sourceKind?: string | null): string {
  const s = (source ?? "").trim().toLowerCase();
  const k = (sourceKind ?? "").trim().toLowerCase();
  if (s && SOURCE_WORDS[s]) return SOURCE_WORDS[s];
  if (s && KIND_WORDS[s]) return KIND_WORDS[s];
  if (s && BRAND_WORDS[s]) return BRAND_WORDS[s];
  if (s) return prettyToken(s);
  if (k && KIND_WORDS[k]) return KIND_WORDS[k];
  return "An unnamed source";
}

/**
 * True when a person put this here themselves.
 *
 * Reads `source_kind` first because that is the column the fabric stamps, and
 * falls back to the channel token so the rows written before manual capture went
 * through the sink (which carry a null `source_kind`) are still attributed
 * correctly rather than reading as if a machine produced them.
 */
export function capturedByHand(
  source: string | null | undefined,
  sourceKind?: string | null,
): boolean {
  if ((sourceKind ?? "").trim().toLowerCase() === "manual") return true;
  const s = (source ?? "").trim().toLowerCase();
  return s === "note" || s === "document" || s === "transcript" || s === "paste" || s === "manual";
}

/** The most-recent (max) of a set of ISO timestamps, skipping null / blank /
 * malformed entries. Returns null when none are valid. Lets an object backed
 * by several rows (a provider with many accounts, a binding chain) show ONE
 * honest "last synced / verified" recency instead of picking a row at random. */
export function latestIso(isos: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const iso of isos) {
    if (!iso) continue;
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms > bestMs) {
      bestMs = ms;
      best = iso;
    }
  }
  return best;
}

/** A short, stable, system-generated reference derived from the real id (the
 * first 6 alphanumerics of the uuid, upper-cased). Gives any artifact a
 * human-quotable trace handle without ever exposing the raw uuid. Reusable
 * platform-wide. */
export function traceRef(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
}

/** Loom W2 (audit D-12): a hung server fn must reject instead of leaving the
 * surface on a permanent skeleton (the h3-swallowed-500 class never settles
 * react-query on its own). Race the call against a deadline so the error
 * state, with its retry, gets to render. The timer is cleared on settle so
 * tests hold no open handles. */
export function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error("The server took too long to answer. Retry in a moment.")),
      ms,
    );
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer)) as Promise<T>;
}

/**
 * Maps a production opportunity to one of the five Discover verdict words.
 * The Critic's own verdict wins when present (OBS-06.md step 1); otherwise
 * falls back to the lane status per the spec's literal mapping.
 */
export function verdictFor(opp: OpportunityVerdictInput): VerdictWord {
  const critic = opp.critic_review?.verdict;
  if (critic === "ship") return "SHIP";
  if (critic === "revise") return "REVISE";
  if (critic === "kill") return "KILL";
  if (opp.status === "shipped" || opp.status === "now") return "SHIP";
  if (opp.status === "dropped") return "KILL";
  if (opp.status === "next" || opp.status === "later") return "WATCH";
  return "PENDING";
}

// --- Signal body humanization (Loom section 8, the humanized-output law) ------
// A captured signal's body is stored verbatim, so an ingested connector payload
// can arrive as raw JSON (a Linear MCP issue blob is the canonical offender),
// markdown with embedded image and link syntax, or long bare URLs. Rendering
// that as-is dumps machine noise into the feed and, because a URL has no spaces
// to wrap on, forces the column wider and bleeds into the next one. These
// helpers pull out the human-readable gist and drop the image and URL noise, so
// the feed reads as signal, not source. The untouched original stays reachable
// behind the "raw capture" disclosure in the signal detail.

const SIGNAL_TITLE_KEYS = ["title", "name", "summary", "subject", "heading", "label"];
const SIGNAL_BODY_KEYS = ["description", "body", "content", "text", "message", "detail", "comment"];

function pickFirstString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** Pull the readable gist out of a parsed payload: a title/name and a
 * description/body when present, else the first readable nested value. Bounded
 * recursion so a deep or hostile payload can never spin. */
function readableFromJson(value: unknown, depth = 0): string {
  if (value == null || depth > 4) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .slice(0, 3)
      .map((item) => readableFromJson(item, depth + 1))
      .filter(Boolean)
      .join(". ");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const title = pickFirstString(obj, SIGNAL_TITLE_KEYS);
    const body = pickFirstString(obj, SIGNAL_BODY_KEYS);
    if (title || body) return title && body ? `${title}: ${body}` : title || body;
    for (const nested of Object.values(obj)) {
      const readable = readableFromJson(nested, depth + 1);
      if (readable) return readable;
    }
  }
  return "";
}

function looksLikeJson(text: string): boolean {
  return (
    (text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))
  );
}

/** Strip markdown and URL noise. `keepBreaks` preserves paragraph structure for
 * the detail view; the feed preview collapses everything onto one clean line. */
function stripSignalNoise(text: string, keepBreaks: boolean): string {
  const withoutLinks = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // image markdown, gone
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // link markdown, keep the text
    .replace(/<https?:\/\/[^>\s]*>/gi, " ") // autolinks, gone
    .replace(/https?:\/\/\S+/gi, " ") // bare URLs, gone
    .replace(/```[\s\S]*?```/g, " ") // fenced code, gone
    .replace(/`([^`]*)`/g, "$1") // inline code, keep its text
    .replace(/__|~~/g, ""); // underscore-bold and strike markers, gone

  /*
   * ASTERISK EMPHASIS IS ONE RULE AND IS NOT SPELLED TWICE.
   *
   * This step used to read `/\*\*|__|~~/`, which removed every `**` whether or
   * not it wrapped anything and never saw a single-asterisk `*word*` at all.
   * Measured over the 1,487 signals carrying content: 13 have `**`, which it
   * caught; one has real emphasis it did not, reading "no sync-log data exists
   * to confirm *how* the overwrite occurs", asterisks and all, on the feed.
   *
   * `plainProse` is the rule the run screen and the learn surfaces already use,
   * and two spellings of one rule is how the next person gets two answers from
   * one string. It is also the stricter of the two: it unwraps only markers
   * that close around real text, so a bullet, an unmatched asterisk and an
   * arithmetic `2 * 3` survive rather than being silently edited.
   *
   * It runs HERE rather than first because the steps above have just taken the
   * backticks off inline code, and an asterisk inside a code span is a literal
   * a reader wants to see, not emphasis.
   *
   * `__` and `~~` stay even though both are zero across those 1,487 rows. Zero
   * today is a fact about the rows we happen to hold, not about what an agent
   * may write tomorrow, and the underscore pair is the one case where stripping
   * is safe -- a lone `_` is left alone everywhere, because the identifiers
   * these agents write (`checkout_single_address`) run through this same text
   * and corrupting one makes the sentence false.
   */
  let out = (plainProse(withoutLinks) ?? withoutLinks)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // heading markers, gone
    .replace(/^\s{0,3}>\s?/gm, "") // blockquote markers, gone
    .replace(/^\s{0,3}[-*+]\s+/gm, ""); // list bullets, gone
  if (keepBreaks) {
    out = out
      .replace(/[ \t]+/g, " ") // collapse inline whitespace
      .replace(/[ \t]*\n[ \t]*/g, "\n") // trim around breaks
      .replace(/\n{3,}/g, "\n\n"); // cap blank runs
  } else {
    out = out.replace(/\s+/g, " ");
  }
  return out.trim();
}

function truncateOnWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

function signalGist(content: string, keepBreaks: boolean): string {
  if (!content) return "";
  const trimmed = content.trim();
  let source = trimmed;
  if (looksLikeJson(trimmed)) {
    try {
      const extracted = readableFromJson(JSON.parse(trimmed));
      if (extracted) source = extracted;
    } catch {
      // Not valid JSON after all; clean the raw string instead.
    }
  }
  return stripSignalNoise(source, keepBreaks) || stripSignalNoise(trimmed, keepBreaks);
}

/** One clean, human-readable line for the Signals feed, trimmed on a word
 * boundary. Plain text passes through untouched; a raw payload becomes its
 * gist. */
export function signalPreview(content: string, max = 240): string {
  return truncateOnWord(signalGist(content, false), max);
}

/** The cleaned signal body for the detail view: JSON gist extracted, image and
 * URL noise removed, paragraph breaks preserved. Empty only when the capture was
 * pure noise (an uncaptioned image); the caller then shows the raw. */
export function signalCleanBody(content: string): string {
  return signalGist(content, true);
}

/** True when the cleaned body differs from the raw capture, i.e. there is a raw
 * form worth offering behind a "view raw capture" disclosure. */
export function signalHasRaw(content: string): boolean {
  return signalCleanBody(content).trim() !== (content ?? "").trim();
}
