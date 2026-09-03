/**
 * WHICH PRODUCT A SENTENCE MEANS, WHEN IT CAN BE TOLD (P-16b, A-QUEUE.md,
 * from R-36 and the honest run). The founder pressed Start with the
 * switcher on Prism and a sentence about "the homeowner app", which is
 * Relay -- the switcher's own current selection and the sentence's own
 * subject had quietly disagreed, and nothing on screen said so.
 *
 * PURE AND CONSERVATIVE, ON PURPOSE. This never guesses between two
 * candidates it cannot tell apart, and it never counts a short, generic
 * word (a length floor, and a stoplist for repo segments like "app" or
 * "web") as evidence -- a wrong guess offered as fact is worse than no
 * offer, which is the whole reason the composer's own press still has to
 * stand when this returns null.
 */

export type ProductCandidate = {
  id: string;
  name: string;
  /** The `"owner/repo"` string Build most recently filed against this
   *  product, if any -- see `listProductRepos`'s own header for why this is
   *  read off changesets rather than a binding column that does not exist. */
  repo?: string | null;
};

const GENERIC_REPO_WORDS = new Set([
  "app",
  "apps",
  "web",
  "site",
  "api",
  "service",
  "services",
  "backend",
  "frontend",
  "server",
  "client",
  "platform",
  "project",
  "repo",
  "main",
  "core",
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholePhrase(sentence: string, phrase: string): boolean {
  const trimmed = phrase.trim();
  if (!trimmed) return false;
  return new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i").test(sentence);
}

/** The repo's own short name, split into words worth matching on: not the
 *  owner, not a generic hosting-shaped word, not anything under 4 letters
 *  (short segments like "ui" or "cli" false-positive too easily). */
function repoMatchWords(repo: string): string[] {
  const short = repo.split("/").pop() ?? repo;
  return short
    .split(/[-_]+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 4 && !GENERIC_REPO_WORDS.has(w));
}

/**
 * The one product a sentence names, or null when it cannot be told --
 * either nothing matches, or more than one candidate does (an ambiguous
 * sentence is not a told one).
 */
export function matchProductFromSentence(
  sentence: string,
  candidates: readonly ProductCandidate[],
): ProductCandidate | null {
  const text = sentence.trim();
  if (!text || candidates.length === 0) return null;

  const matched = candidates.filter((c) => {
    if (containsWholePhrase(text, c.name)) return true;
    if (c.repo) return repoMatchWords(c.repo).some((w) => containsWholePhrase(text, w));
    return false;
  });

  return matched.length === 1 ? matched[0] : null;
}
