/**
 * THE MODEL, IN WORDS A PERSON USES.
 *
 * Founder, 2026-07-30, reading `google/gemini-3-flash-preview` under an answer:
 * *"should you say just Google Gemini Flash? I don't know why preview is
 * there."*
 *
 * He is describing a routing identifier that leaked into the interface. The
 * slug is what the gateway needs; the vendor slash, the lowercase, and the
 * release-channel suffix are all addressed to a machine. What a person wants to
 * know is who made it and which one it was.
 *
 * WHAT IS DROPPED, AND WHY THAT IS NOT A LIE. Only the release channel
 * (`-preview`, `-latest`, `-exp`, a trailing date stamp). Those say WHICH BUILD
 * of a model answered, which matters to us and to nobody reading a thread. The
 * FAMILY and the VERSION always survive, because "Gemini 3 Flash" and "Gemini 3
 * Pro" cost different money and are a real difference a person may need to see.
 *
 * AND IT NEVER GUESSES. There is no lookup table of pretty names here, on
 * purpose: a table goes stale the week a new model ships and then confidently
 * prints the wrong vendor. This only reformats what it was given, so an
 * unrecognised slug degrades to the slug itself rather than to a wrong answer.
 */

/** Release-channel noise. Not part of a model's identity to a reader. */
const CHANNEL = new Set(["preview", "latest", "exp", "experimental", "beta", "stable"]);

/** A trailing build stamp: 20250219, 2025-02-19, v2. */
const STAMP = /^(v\d+|\d{6,8}|\d{4}-\d{2}-\d{2})$/;

/** Vendors whose casing a person would notice us getting wrong. */
const VENDOR: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  anthropic: "Anthropic",
  meta: "Meta",
  mistralai: "Mistral",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  xai: "xAI",
  qwen: "Qwen",
  cohere: "Cohere",
  perplexity: "Perplexity",
};

/** `gpt`, `4o` and friends are not words and must not be title-cased into
 *  "Gpt" and "4O". Anything with a digit in it, or already carrying capitals,
 *  is left exactly as the vendor wrote it. */
function word(part: string): string {
  const known: Record<string, string> = { gpt: "GPT", o: "o" };
  if (known[part]) return known[part];
  // A vendor name can appear INSIDE the model half too ("openai/openai-o3"),
  // and it wants the same casing there as it gets in front of the slash.
  const vendor = VENDOR[part.toLowerCase()];
  if (vendor) return vendor;
  if (/\d/.test(part)) return part;
  if (part !== part.toLowerCase()) return part;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/**
 * "google/gemini-3-flash-preview" -> "Google Gemini 3 Flash".
 *
 * Returns the input untouched when there is nothing it can confidently do with
 * it, which is the honest failure and keeps the fact on screen either way.
 */
export function modelLabel(model: string | null | undefined): string | null {
  const raw = (model ?? "").trim();
  if (!raw) return null;

  const slash = raw.lastIndexOf("/");
  const vendorSlug = slash > 0 ? raw.slice(0, slash).toLowerCase() : "";
  const rest = slash > 0 ? raw.slice(slash + 1) : raw;

  const parts = rest
    .split(/[-_.]/)
    .filter(Boolean)
    .filter((p) => !CHANNEL.has(p.toLowerCase()) && !STAMP.test(p.toLowerCase()));
  if (parts.length === 0) return raw;

  const vendor = vendorSlug ? (VENDOR[vendorSlug] ?? word(vendorSlug)) : "";
  const name = parts.map(word).join(" ");
  // A vendor that already opens the model name ("openai/openai-o3") would read
  // as a stutter.
  if (vendor && !name.toLowerCase().startsWith(vendor.toLowerCase())) return `${vendor} ${name}`;
  return name;
}

/**
 * What the exchange cost, in words rather than in a float.
 *
 * Sub-cent is the overwhelmingly common case and "$0.00" reads as free, which
 * is the one thing it must not say on a surface whose whole argument is that
 * every call is on the record. Null means we genuinely do not know, and an
 * unknown cost is never rendered as zero.
 */
export function spendLabel(costUsd: number | null | undefined): string | null {
  if (typeof costUsd !== "number" || !Number.isFinite(costUsd) || costUsd <= 0) return null;
  return costUsd < 0.01 ? "under a cent" : `$${costUsd.toFixed(2)}`;
}
