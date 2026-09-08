/**
 * WHAT SUPAPROD'S OWN KEYS COVER, IN ONE SENTENCE A PERSON CAN ACT ON.
 *
 * The settings page said "Every other plan runs on Supaprod credits ... It
 * just uses our keys" and never said WHICH keys, while `listPlatformProviders`
 * (the read that knows) had no reader at all (P-155). A person deciding whether
 * to add a key of their own needs the answer to one question: is the provider
 * I want already covered, and what will my agents run on if I add nothing.
 *
 * PURE. Labels come from the same list the picker draws, so a provider is
 * never named two ways on one page; an id the list does not know is shown as
 * its id rather than dropped, because a configured provider that is not on
 * the picker is exactly the fact worth seeing.
 */

/** The English list: "Claude", "Claude and OpenAI", "Claude, OpenAI and Gemini". */
export function listOf(words: readonly string[]): string {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0]!;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

/** "Claude (Anthropic)" reads as "Claude" mid-sentence; the parenthetical is the picker's, not prose. */
function short(label: string): string {
  return label.replace(/\s*\(.*\)\s*$/, "").trim();
}

export function platformCoverageLine(input: {
  providers: readonly string[];
  recommendedModel: string | null;
  labels: ReadonlyArray<{ id: string; label: string }>;
  /** True when the person can add a key of their own on this plan. */
  canAddOwn: boolean;
}): string {
  const names = input.providers.map((id) =>
    short(input.labels.find((l) => l.id === id)?.label ?? id),
  );
  if (names.length === 0) {
    // A deployment with no platform key runs nothing. Said plainly: it is the
    // fault a person would otherwise meet as a failed run with no reason.
    return "No provider key is configured on this deployment, so no run can start until one is.";
  }
  const model = input.recommendedModel?.trim();
  const covered = `Supaprod's own keys cover ${listOf(names)}`;
  const runsOn = model ? ` Agents run on ${model} unless a run names another model.` : "";
  const own = input.canAddOwn
    ? " A key you add takes precedence for its provider and is billed to you."
    : "";
  return `${covered}.${runsOn}${own}`;
}
