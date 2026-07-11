/**
 * Stakeholder status update composer (PM-STATUS-UPDATE) - PURE.
 *
 * Turns a snapshot of live product state into a shareable, paste-ready status update so a PM
 * gets their weekly stakeholder note in one keystroke instead of writing it by hand (the #1
 * PM time-sink). Deterministic + truthful: every figure traces to real state, nothing is
 * generated or invented, and sparse state reads honestly ("a quiet stretch") rather than
 * padding with zeros.
 *
 * VOICE (the felt-voice precedent, docs/conventions/humanized-output.md "The felt voice"):
 * this is generated output that leaves the app into Slack/email, so it must hand the reader
 * value, not data. Signal first (a one-line lede carries the gist), short and precise (no
 * preamble, no assistant framing), and the register shifts with the content: product-narrative
 * lines name the work, metric lines are interpreted ("every reviewed bet held up", not a raw
 * "100.0%"). No db, no network, no AI - fully offline-verifiable.
 */

export type StakeholderSnapshot = {
  /** e.g. "the last 7 days". */
  periodLabel: string;
  workspaceName: string | null;
  /**
   * The signed-in author's display name, when known. Personalizes the headline ("Rohit's
   * update...") and the closing line ("N calls waiting on Rohit."). Null/omitted keeps the
   * anonymous voice byte-identical to the pre-authorName format.
   */
  authorName?: string | null;
  /** Deep-work tasks completed in the period. */
  shipped: number;
  /** Decisions (approvals) decided in the period. */
  decisions: number;
  /** Outcomes validated in the period. */
  validated: number;
  /** Names of currently-running missions. */
  activeMissions: string[];
  /** The now/next roadmap commitments, each with its ICE score when known. */
  upNext: { title: string; iceScore: number | null }[];
  /** Size of the calls queue (decisions waiting on the human). */
  needsYou: number;
  /** The three proof metrics, each 0..100 or null when there is not enough data. */
  metrics: {
    acceptancePct: number | null;
    autonomyPct: number | null;
    outcomeAccuracyPct: number | null;
  };
  /** AI spend over the period, in USD. */
  spendUsd: number;
  /** The most recent reviewed outcome, if any. */
  latestOutcome: { title: string; verdict: string } | null;
};

export type StakeholderUpdateSection = { title: string; bullets: string[] };

export type StakeholderUpdateResult = {
  headline: string;
  /** Signal-first one-liner: the gist, before any detail. */
  lede: string;
  sections: StakeholderUpdateSection[];
  /** The paste-ready rendering (Slack/email/markdown). */
  markdown: string;
};

/** How many list items to show before collapsing the tail into a "+N more" line. */
const LIST_CAP = 5;

/** "1 decision" / "3 decisions" - count with a regular plural. */
const count = (n: number, singular: string): string => `${n} ${singular}${n === 1 ? "" : "s"}`;

/** The felt verb for an outcome verdict (a metric reads as meaning, not a raw label). */
function outcomeVerb(verdict: string): string {
  if (verdict === "validated") return "held up";
  if (verdict === "missed") return "fell short";
  if (verdict === "mixed") return "was mixed";
  return verdict;
}

/** Cap a list to LIST_CAP, appending a single honest "+N more" line when it overflows. */
function capList(items: string[]): string[] {
  if (items.length <= LIST_CAP) return [...items];
  const shown = items.slice(0, LIST_CAP);
  shown.push(`+${items.length - LIST_CAP} more`);
  return shown;
}

/** PURE. Compose the live snapshot into a headline + signal-first lede + sections + markdown. */
export function buildStakeholderUpdate(s: StakeholderSnapshot): StakeholderUpdateResult {
  const ws = s.workspaceName?.trim() || "Workspace";
  const author = s.authorName?.trim() || null;
  // A middot, never an em/en dash (humanized-output law), separates the author's byline from
  // the dateline. Without an author, the headline is byte-identical to the anonymous format.
  const headline = author
    ? `${author}'s update · ${ws}, ${s.periodLabel}`
    : `${ws}, ${s.periodLabel}`;

  // Interpreted metric phrasing - the register shifts to "meaning, not data".
  const acc = s.metrics.acceptancePct;
  const out = s.metrics.outcomeAccuracyPct;
  const auto = s.metrics.autonomyPct;
  const approvedPhrase =
    acc == null ? null : acc === 100 ? "you approved every call" : `you approved ${acc}% of calls`;
  const heldUpPhrase =
    out == null
      ? null
      : out === 100
        ? "every reviewed bet held up"
        : `${out}% of reviewed bets held up`;
  const autonomyPhrase = auto == null ? null : `the loop ran ${auto}% of the work unattended`;

  // Lede: signal first. The one line that carries the gist before any detail.
  const ledeParts: string[] = [];
  if (s.decisions > 0) ledeParts.push(`${count(s.decisions, "decision")} made`);
  else if (s.shipped > 0) ledeParts.push(`${count(s.shipped, "deep-work block")} done`);
  if (s.activeMissions.length) ledeParts.push(`${s.activeMissions.length} in flight`);
  if (heldUpPhrase) ledeParts.push(heldUpPhrase);
  const lede = ledeParts.length
    ? `${ledeParts.join(", ")}.`
    : "A quiet stretch, nothing to report yet.";

  const sections: StakeholderUpdateSection[] = [];

  // Shipped: the header implies the verb, so the bullets stay terse.
  const shippedBullets: string[] = [];
  const parts: string[] = [];
  if (s.decisions > 0) parts.push(count(s.decisions, "decision"));
  if (s.shipped > 0) parts.push(count(s.shipped, "deep-work block"));
  if (parts.length) shippedBullets.push(parts.join(", "));
  if (s.latestOutcome) {
    shippedBullets.push(`"${s.latestOutcome.title}" ${outcomeVerb(s.latestOutcome.verdict)}`);
  } else if (s.validated > 0) {
    shippedBullets.push(`${count(s.validated, "outcome")} validated`);
  }
  if (shippedBullets.length) sections.push({ title: "Shipped", bullets: shippedBullets });

  if (s.activeMissions.length)
    sections.push({ title: "In flight", bullets: capList(s.activeMissions) });
  if (s.upNext.length) {
    // Real product metrics, not bare titles: name the ICE score when there is one to show.
    const upNextBullets = s.upNext.map(({ title, iceScore }) =>
      typeof iceScore === "number" && iceScore > 0
        ? `${title} (ICE ${iceScore.toFixed(1)})`
        : title,
    );
    sections.push({ title: "Next", bullets: capList(upNextBullets) });
  }

  // Health: interpreted metrics + spend. Null metrics are omitted, never shown as 0% or null.
  const healthBullets: string[] = [];
  const metricClauses = [approvedPhrase, heldUpPhrase, autonomyPhrase].filter(
    (x): x is string => !!x,
  );
  if (metricClauses.length) healthBullets.push(metricClauses.join(", "));
  if (s.spendUsd > 0) healthBullets.push(`$${s.spendUsd.toFixed(2)} spent`);
  if (healthBullets.length) sections.push({ title: "Health", bullets: healthBullets });

  // Serialize: headline, the lede, then the detail. Calls waiting closes it (the product noun).
  const lines: string[] = [`**${headline}**`, "", lede, ""];
  for (const sec of sections) {
    lines.push(sec.title);
    for (const b of sec.bullets) lines.push(`- ${b}`);
    lines.push("");
  }
  if (s.needsYou > 0) lines.push(`${count(s.needsYou, "call")} waiting on ${author ?? "you"}.`);

  const markdown = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  return { headline, lede, sections, markdown };
}

/**
 * The figures an outcome receipt leads with (RPT-49). A narrow slice of StakeholderSnapshot so
 * both the session-scoped composer and the admin-client digest loader can feed buildOutcomeReceipt
 * the exact same shape.
 */
export type OutcomeReceiptSnapshot = {
  /** Deep-work blocks completed in the period. */
  shipped: number;
  /** Decisions (approvals) decided in the period. */
  decisions: number;
  /** The most recent reviewed outcome, if any. */
  latestOutcome: { title: string; verdict: string } | null;
  /** Validated share of reviewed bets (0..100), or null when there is not enough data. */
  outcomeAccuracyPct: number | null;
};

/**
 * PURE. Render the compact "outcome receipt" that LEADS the ambient stakeholder digest (RPT-49),
 * so the note OPENS with what the work produced instead of operational noise. Three pieces, in
 * order: what shipped (deep-work blocks + decisions), what it did (the latest reviewed outcome,
 * read as meaning: held up / fell short), and calibration (the reviewed-bet accuracy). This is
 * outcome-marketing from live state, and it is honest and sparse-safe: a genuinely quiet period
 * (nothing shipped, no reviewed outcome, no accuracy data) returns null so the digest can lead
 * with its operational items rather than a fabricated receipt, and a null metric is omitted, never
 * padded to 0% or the word "null". Terse by design, since this is the lede of a longer digest.
 */
export function buildOutcomeReceipt(s: OutcomeReceiptSnapshot): string | null {
  const lines: string[] = [];

  // What shipped: deep-work blocks + decisions. The line closes with the verb, so it stays terse.
  const shippedParts: string[] = [];
  if (s.decisions > 0) shippedParts.push(count(s.decisions, "decision"));
  if (s.shipped > 0) shippedParts.push(count(s.shipped, "deep-work block"));
  if (shippedParts.length) lines.push(`${shippedParts.join(", ")} shipped.`);

  // What it did: the latest reviewed outcome, interpreted ("held up" / "fell short"), not the raw label.
  if (s.latestOutcome) {
    lines.push(`"${s.latestOutcome.title}" ${outcomeVerb(s.latestOutcome.verdict)}.`);
  }

  // Calibration: the reviewed-bet accuracy, interpreted. A null metric is omitted, never shown as 0%.
  const out = s.outcomeAccuracyPct;
  if (out != null) {
    lines.push(out === 100 ? "Every reviewed bet held up." : `${out}% of reviewed bets held up.`);
  }

  if (lines.length === 0) return null;
  return ["**Receipts**", ...lines].join("\n");
}
