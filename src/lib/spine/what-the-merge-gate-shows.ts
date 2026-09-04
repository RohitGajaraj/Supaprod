/**
 * ── R-40: THE MERGE GATE SHOWS WHAT THE CHANGE IS (P-72) ─────────────────
 *
 * The tablet track's pull request was merged on a gate whose only evidence was
 * a green check. What it actually contained was 90 lines of CSS for
 * `.address-summary` selectors and one line in `AddressStep.tsx`, in a repo with
 * no address summary component, after the Build seat had written that the work
 * belongs elsewhere and the Design critic had said the spec's premise
 * contradicts the brief.
 *
 * Every one of those facts existed in the record at the moment of the press.
 * None of them was on the card.
 *
 * ── A GREEN CHECK IS NOT EVIDENCE THAT THE RIGHT THING WAS BUILT ─────────
 *
 * It is evidence that what was built compiles and its tests pass. Those are
 * different claims, and the gap between them is exactly where this change went
 * through. So the check stays, LAST, and three facts a person can judge come
 * first: what the change touches, what the seat concluded, what the critic said.
 *
 * PURE. The reads are in the server function; these are the sentences, so they
 * can be tested against real shapes without a database.
 */

/** One file in the change, with how much of it moved. */
export type ChangedFile = { path: string; added: number; removed: number };

export type MergeGateEvidence = {
  files: ChangedFile[];
  /** The seat's own conclusion, when it halted. Null when it did not. */
  buildHalt: string | null;
  /** The design critic's verdict and its sharpest finding, when there is one. */
  designVerdict: { verdict: string; finding: string | null } | null;
  /** False when a read failed: the card then says so rather than showing zero. */
  known: boolean;
};

/** Lines added and removed between two versions of a file. A count, not a diff:
 *  the card needs the SIZE of the change, and a diff belongs behind the link. */
export function countLines(
  base: string | null,
  next: string | null,
): {
  added: number;
  removed: number;
} {
  const b = base ? base.split("\n").length : 0;
  const n = next ? next.split("\n").length : 0;
  /*
   * A rewrite of the same length reads as 0 added and 0 removed here, and that
   * is the honest limit of a line COUNT. The card says "touches N files" beside
   * it so a person is never told nothing changed; the exact diff is one click
   * away and this is not trying to be it.
   */
  return { added: Math.max(0, n - b), removed: Math.max(0, b - n) };
}

/**
 * The sentence naming what the change touches.
 *
 * Files first, because "one file in a checkout module" and "ninety lines of CSS
 * in a stylesheet nothing imports" are the same green check and different
 * decisions.
 */
export function filesLine(files: readonly ChangedFile[]): string {
  if (files.length === 0) return "This change touches no files, which cannot be right.";
  const added = files.reduce((t, f) => t + f.added, 0);
  const removed = files.reduce((t, f) => t + f.removed, 0);
  const names = files
    .slice(0, 3)
    .map((f) => f.path)
    .join(", ");
  const rest = files.length > 3 ? `, and ${files.length - 3} more` : "";
  const size = added || removed ? ` (+${added} / -${removed})` : " (rewritten, same length)";
  return `Touches ${files.length} ${files.length === 1 ? "file" : "files"}${size}: ${names}${rest}.`;
}

/** What the Build seat concluded, when it concluded something worth reading. */
export function buildLine(halt: string | null): string | null {
  if (!halt) return null;
  return `Build halted and said: ${halt.trim().replace(/\s+/g, " ")}`;
}

/** What Design said, when it said anything. */
export function designLine(v: MergeGateEvidence["designVerdict"]): string | null {
  if (!v) return null;
  const said = (v.finding ?? "").trim().replace(/\s+/g, " ");
  return said
    ? `Design's verdict was ${v.verdict}: ${said}`
    : `Design's verdict on this was ${v.verdict}.`;
}

/**
 * The card's evidence lines, in the order a person needs them.
 *
 * What it touches, what the seat concluded, what the critic said. The check is
 * NOT here: it is drawn by the card that already draws it, after these, because
 * the whole finding is that it was standing in for all three.
 */
export function mergeGateLines(e: MergeGateEvidence): string[] {
  if (!e.known) {
    return [
      "What this change contains could not be read, so nothing here describes it. Open the pull request before answering.",
    ];
  }
  return [filesLine(e.files), buildLine(e.buildHalt), designLine(e.designVerdict)].filter(
    (l): l is string => !!l,
  );
}

/**
 * May the gate draw its approve control?
 *
 * NO when the seat halted, and that is the packet's second half: a person
 * should not be offered a one-press merge of a change the seat that wrote it
 * said should not exist. The gate still renders, with the reason, and declining
 * is still one press: what goes is the affirmative.
 */
export function mayDrawApprove(e: MergeGateEvidence): boolean {
  return !e.buildHalt;
}

/**
 * ── THE SAME SUMMARY, ON THE PAGE THAT LISTS RELEASES (P-96) ─────────────
 *
 * The merge gate got these three facts because a green check had been standing
 * in for all of them. /ship lists the releases those merges produced and said
 * less than the gate did: a title, a product name, and the words "live in
 * production". A person reading the list could not see what any release
 * contained, what the seat concluded, or what the critic said -- the same gap,
 * one surface along, after the decision rather than before it.
 *
 * So the sentences are composed HERE, once, and both surfaces call them. Two
 * copies of this vocabulary would drift within a week, and the drift would be
 * invisible: the gate and the list would describe one release differently and
 * nothing would compare them.
 *
 * ── AND A RELEASE HAS ONE FACT THE GATE NEVER HAS ────────────────────────
 * Where it actually went. The gate is asked BEFORE the merge, so there is no
 * deploy to describe; a release row is read after, when there is. That word
 * comes from `releaseStanding`, which already owns the distinction this
 * product's central claim rests on -- `success` is a provider reporting a
 * deploy, `claimed` is a person having typed a link -- so it is passed in
 * resolved rather than re-derived here. One vocabulary for the standing, one
 * for the summary, and neither reimplements the other.
 */

/** Where this release went, in the standing vocabulary's own words. */
export type ReleaseDeployment = {
  /** `releaseStanding().word` -- resolved by the caller, never re-derived. */
  word: string;
  /** `releaseStanding().note`: what that word does not say. */
  note: string | null;
} | null;

export type ReleaseEvidence = MergeGateEvidence & {
  deployment: ReleaseDeployment;
  /**
   * True when this release is a person's handback rather than work the product
   * did: `submitStationByHand` wrote a pasted link and there is no changeset of
   * ours behind it.
   */
  handRecorded: boolean;
};

/** Where it went, and what that word does not say. */
export function deploymentLine(d: ReleaseDeployment): string {
  if (!d) return "No deploy is on the record for this release.";
  return d.note ? `${d.word}. ${d.note}` : `${d.word}.`;
}

/**
 * A release somebody else's builder made, and we were told about.
 *
 * ── WHY THIS CANNOT BE LEFT TO `filesLine` ───────────────────────────────
 * `filesLine([])` says "This change touches no files, which cannot be right",
 * and for a merge gate that is exactly right: a changeset we staged with
 * nothing in it is a defect worth stopping on.
 *
 * For a handback it is a FALSE ACCUSATION. `paste-back.ts` exists so a customer
 * can use their own builder, and the whole design is that we need only the
 * outcome: "the verdict is measured against the forecast, not against the
 * code." There are no files because the change was never ours to stage. Telling
 * that person their release "cannot be right" reports the supported path as a
 * malfunction.
 *
 * So it says the two true things instead -- who recorded it, and that the
 * absence of a diff is a fact about our record rather than about their work.
 */
export function handRecordedLine(): string {
  return (
    "Recorded by a person, not built here. There is no change for this product to show: " +
    "it was made somewhere else and we were told the outcome."
  );
}

/**
 * THREE STATES, NOT TWO (P-121, A-QUEUE.md). `filesLine([])` says "This
 * change touches no files, which cannot be right" -- exactly right for the
 * gate, where an empty changeset WE staged is a defect worth stopping on.
 *
 * A release row is not the gate. Served Ship, 12:10 IST 09-04, on the
 * release the founder shows people ("Batch firmware push scheduler", live
 * since July 9): the gate's own accusation, unearned. That changeset simply
 * has no file rows recorded -- a seeded or historical release, from before
 * file tracking existed or from a path that never wrote them -- which is not
 * a malfunction to flag, the same distinction P-96 already drew for a
 * DIFFERENT empty-files case (a customer's handback, `handRecordedLine`
 * below). A release earns the neutral "no file list was recorded" sentence
 * instead; only the gate itself, through `filesLine` directly
 * (`mergeGateLines` above), keeps the accusation.
 */
export function releaseFilesLine(files: readonly ChangedFile[]): string {
  if (files.length === 0) return "No file list was recorded for this change.";
  return filesLine(files);
}

/**
 * The release row's evidence, in the order a person needs it.
 *
 * Same three facts as the gate, plus where it went. The hand-recorded case
 * REPLACES the files line rather than adding to it, because an empty change is
 * the ordinary shape of a handback and `filesLine` reads an empty change as a
 * defect. Getting that wrong is worse than saying nothing: it would tell the
 * customers using the cheapest handback mechanism we have that the product
 * thinks their release is broken. Every OTHER empty-files release (P-121)
 * reads through `releaseFilesLine`, not `filesLine`, for the same reason one
 * level up: only the gate stages its own changeset, so only the gate may
 * call an empty one a defect.
 */
export function releaseSummaryLines(e: ReleaseEvidence): string[] {
  if (!e.known) {
    return [
      "What this release contains could not be read, so nothing here describes it.",
      deploymentLine(e.deployment),
    ];
  }
  const what =
    e.handRecorded && e.files.length === 0 ? handRecordedLine() : releaseFilesLine(e.files);
  return [
    what,
    buildLine(e.buildHalt),
    designLine(e.designVerdict),
    deploymentLine(e.deployment),
  ].filter((l): l is string => !!l);
}

/**
 * May this release be announced?
 *
 * ── ONLY WITH A PRODUCTION DEPLOY ON THE RECORD ──────────────────────────
 * An announcement is the one thing in this product a stranger can read. Every
 * other surface is answerable to the person looking at it; this one goes out.
 *
 * The list offered the composer on every release row, including releases that
 * had merged and never been promoted, and releases whose only production
 * evidence was a pasted address. Both would have been announced in the same
 * words as something actually live, and the second is the sharper failure:
 * `claimed` exists precisely so a typed link can never stand as proof that
 * something shipped, and announcing one publishes that claim to people who
 * cannot check it.
 *
 * `productionUrl` is the test because `listChangelog` resolves it from
 * environment=production AND status=success -- so it is the provider's word,
 * which is the only word strong enough to say this out loud.
 */
export function mayAnnounce(input: { productionUrl: string | null }): boolean {
  return !!input.productionUrl?.trim();
}

/** Why the composer is not offered, for the row that cannot offer it. */
export function whyNotAnnounceable(input: { deployment: ReleaseDeployment }): string {
  if (input.deployment?.word) {
    return `Not live yet, so there is nothing to announce. ${deploymentLine(input.deployment)}`;
  }
  return "Not live yet, so there is nothing to announce. Promote it first.";
}

/**
 * ── ONE CARD, THREE SURFACES, AND FACTS PINNED WHEN THE GATE ROSE (P-116) ─
 *
 * P-72 gave the merge gate its three facts and `TrackConsent` draws them. The
 * other two places a person meets the same question did not: the run screen's
 * banner showed a headline and two buttons, and the Waiting page showed the
 * tool's name. Measured on the tablet track's own merge gate -- `rationale`
 * null, `args` `{}` -- so the card a person actually pressed from carried no
 * files, no check conclusion and no verdict.
 *
 * Two halves, and the second is the one that matters.
 *
 * ── THE CARD IS COMPOSED ONCE ────────────────────────────────────────────
 * `mergeCardLines` is what all three call. A second surface writing its own
 * sentences is how the gate and the list came to describe one release
 * differently in P-96, one packet ago.
 *
 * ── AND THE FACTS ARE PINNED AT THE RAISE, NOT ONLY READ AT THE RENDER ───
 * `mergeGateEvidence` reads the changeset LIVE, which is right for a card that
 * wants the current diff and wrong for a decision. Between the raise and the
 * press the loop can commit again -- it did exactly that on 2026-09-04, twice
 * in three minutes -- so a card read at render can describe a diff that is not
 * the one the gate was raised about. Worse, both of us then read a stale checks
 * result and reported a green PR as red.
 *
 * So the raise writes down what it knew: the files it had just committed and
 * what the checks said at that moment. The render still prefers live evidence,
 * because a person deciding now wants the current state -- but when there is
 * none, the pinned sentence is what the gate was raised about rather than
 * silence.
 */

/**
 * The gates this card is about.
 *
 * MOVED HERE FROM `TrackConsent` (P-116). It was a private const in the one
 * surface that drew the card, so the two surfaces that did not draw it had no
 * way to ask the question -- which is a small version of the same defect: the
 * knowledge of what a merge card IS lived with one renderer.
 *
 * Every other tool's card asks about a call rather than about a diff, and would
 * read as noise with files on it.
 */
export const isMergeGate = (tool: string | null | undefined): boolean =>
  tool === "studio.pr.merge" || tool === "release.publish";

/** What the run knew about itself at the moment it asked. */
export function raisedOverLine(input: {
  /** Paths from the run's own `studio.commit` result, if it made one. */
  committedFiles: readonly string[];
  /** Check names that failed at the raise, from `studio.checks.run`. */
  failingChecks: readonly string[];
  /** True when the checks ran and all passed. */
  checksPassed: boolean;
}): string | null {
  const files = input.committedFiles.filter((f) => f.trim().length > 0);
  const parts: string[] = [];
  if (files.length > 0) {
    const names = files.slice(0, 3).join(", ");
    const rest = files.length > 3 ? `, and ${files.length - 3} more` : "";
    parts.push(
      `Raised over ${files.length} ${files.length === 1 ? "file" : "files"}: ${names}${rest}.`,
    );
  }
  if (input.failingChecks.length > 0) {
    parts.push(`The checks were red at the time: ${input.failingChecks.join(", ")}.`);
  } else if (input.checksPassed) {
    parts.push("The checks had passed at the time.");
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * The lines a merge card shows, wherever it is drawn.
 *
 * Live evidence first, because a person deciding now is deciding about the
 * change as it is. The pinned sentence when there is none. And when there is
 * neither, it SAYS so -- a card with nothing on it reads as a change with
 * nothing in it, which is the one reading that must never be available.
 */
export function mergeCardLines(input: {
  /** Live evidence, when the surface has a track to read one for. */
  evidence: MergeGateEvidence | null;
  /** `agent_approvals.rationale`, which the raise pins for a merge gate. */
  rationale: string | null;
}): string[] {
  if (input.evidence && input.evidence.known) return mergeGateLines(input.evidence);
  const pinned = (input.rationale ?? "").trim();
  if (pinned) return [pinned];
  return ["What this change contains is not on this card. Open the pull request before answering."];
}
