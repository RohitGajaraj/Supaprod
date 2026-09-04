/**
 * SHIP KEEPS ITS OWN HOUSE, OR IT STOPS BEING ABLE TO SHIP.
 *
 * ── THE WALL, AND WHY IT WAS OUR DOING ───────────────────────────────────
 * On 2026-09-04 a merged release could not get a preview: ten of ten Deno app
 * slots were used, every one of them a July preview shell for a changeset that
 * had long since merged or been abandoned. Nothing had ever deleted one.
 *
 * A product that creates a hosted app per changeset and never reclaims any is a
 * product with a countdown on it. `a-bad-request-is-not-an-existing-app` makes
 * the wall legible when it is hit; this decides which apps should never have
 * been holding a slot in the first place.
 *
 * ── DELETION IS THE ONE ACT THIS FILE WILL NOT INFER ─────────────────────
 * So it decides and does not delete. Every rule below is written to answer
 * "may this be reclaimed" with a default of NO, and the caller does the
 * reclaiming under whatever authority it has. Three reasons, in order:
 *
 *   A slot is cheap and a deleted preview is not recoverable. The asymmetry
 *   runs entirely one way, so the bias must too.
 *
 *   The app names in the account are not all ours. `deriveAppSlug` stamps
 *   `cad-<workspace>-<changeset>`; anything that does not match that shape was
 *   put there by somebody else and is none of our business.
 *
 *   And a preview that is still serving something is not rubbish. A changeset
 *   nobody has closed may be under review right now, and a production address
 *   is the live product.
 */

/** The prefix `deriveAppSlug` stamps on every app this product creates. */
export const OUR_APP_PREFIX = "cad-";

/** How long a closed changeset's preview keeps its slot. */
export const KEEP_CLOSED_PREVIEW_DAYS = 7;

/** What the caller knows about one hosted app. */
export type HostedApp = {
  slug: string;
  /** The changeset this app was created for, when the slug resolves to one. */
  changesetId: string | null;
  /** `studio_changesets.status`, or null when it could not be read. */
  changesetStatus: string | null;
  /** True when a production deploy for this changeset is on the record. */
  servesProduction: boolean;
  /** When the app was created, ISO. Null when unknown. */
  createdAt: string | null;
  /**
   * When a person reclaimed this app, ISO, or null.
   *
   * ── A DESTRUCTIVE ACT WITH NOTHING ON THE RECORD (P-118c) ──────────────
   * A1 pressed Reclaim live at 14:37 and the row kept its button, and "1 can be
   * reclaimed" stayed until a reload. Neither is a refresh bug: the verdict is
   * derived from the CHANGESET, and deleting the app changes nothing about the
   * changeset. Nothing anywhere said the slot had been released, so the list
   * could only go on offering it -- and a product whose claim is that acts are
   * on the record had just taken an irreversible one and written nothing down.
   */
  reclaimedAt: string | null;
};

/** A changeset in one of these is finished with its preview. */
const CLOSED = new Set(["merged", "abandoned", "closed"]);

export type ReclaimVerdict =
  { reclaim: true; because: string } | { reclaim: false; because: string };

/**
 * May this app's slot be reclaimed?
 *
 * Every `false` names what is holding it, because the point of the list is that
 * a person can see WHY the account is full, and "9 apps, all in use" is not an
 * answer anybody can act on.
 */
export function mayReclaim(app: HostedApp, now: Date): ReclaimVerdict {
  if (!app.slug.startsWith(OUR_APP_PREFIX)) {
    return { reclaim: false, because: "Not created by this product." };
  }
  if (app.servesProduction) {
    return { reclaim: false, because: "Serving this release in production." };
  }
  if (app.reclaimedAt) {
    /* Said in the past tense with its date, because "cannot be reclaimed" over
       a row somebody reclaimed reads as a refusal rather than as a receipt. */
    return {
      reclaim: false,
      because: `Reclaimed on ${app.reclaimedAt.slice(0, 10)}. Its slot is already free.`,
    };
  }
  if (!app.changesetId) {
    /* The slug is ours but resolves to nothing we hold. That is a gap in our
       record, not a licence to delete somebody's app. */
    return { reclaim: false, because: "No change on the record matches this app." };
  }
  if (!app.changesetStatus) {
    return { reclaim: false, because: "Its change could not be read, so nothing is assumed." };
  }
  if (!CLOSED.has(app.changesetStatus.toLowerCase())) {
    return { reclaim: false, because: `Its change is still open (${app.changesetStatus}).` };
  }
  if (!app.createdAt) {
    return { reclaim: false, because: "Its age is unknown, so the keep-window cannot be applied." };
  }
  const ageMs = now.getTime() - Date.parse(app.createdAt);
  if (Number.isNaN(ageMs)) {
    return { reclaim: false, because: "Its age could not be read, so nothing is assumed." };
  }
  const days = ageMs / 86_400_000;
  if (days < KEEP_CLOSED_PREVIEW_DAYS) {
    return {
      reclaim: false,
      because: `Its change closed recently; previews are kept for ${KEEP_CLOSED_PREVIEW_DAYS} days.`,
    };
  }
  return {
    reclaim: true,
    because: `Its change is ${app.changesetStatus} and the preview is ${Math.floor(days)} days old.`,
  };
}

/** The house, in one sentence a person can act on. */
/**
 * The house, in one sentence a person can act on.
 *
 * ── IT COUNTS WHAT WE MADE, AND MUST NOT LOOK LIKE THE ACCOUNT (P-118c) ──
 * This said "11 hosted previews" while the plan said 10 of 10 used, and A1 read
 * the 11 as the account -- reasonably, because a bare count on a page titled
 * Hosting is read as the account's. It is not: this list is built from our own
 * record on purpose (it must never offer to delete an app somebody else made),
 * so its number answers a different question from the one a full account
 * prompts.
 *
 * A number that looks like the one a person needs and is not is worse than no
 * number. So the sentence says whose count it is, and where the real one lives.
 *
 * `capacitySaid` is the host's own last word, when we have one -- the
 * APP_LIMIT_EXCEEDED body a failed create carried. Never derived, never
 * estimated: we cannot see the account and do not pretend to.
 */
export function houseLine(
  apps: readonly HostedApp[],
  now: Date,
  capacitySaid?: string | null,
): string {
  const cap = capacitySaid?.trim()
    ? ` The host last said: ${capacitySaid.trim()}`
    : " Your Deno account may hold others; its dashboard has the account's own count.";
  if (apps.length === 0) return `No previews created by Supaprod are on the record.${cap}`;
  const reclaimable = apps.filter((a) => mayReclaim(a, now).reclaim).length;
  const held = apps.length - reclaimable;
  const noun = apps.length === 1 ? "preview" : "previews";
  if (reclaimable === 0) {
    return `${apps.length} ${noun} created by Supaprod, all still in use.${cap}`;
  }
  return (
    `${apps.length} ${noun} created by Supaprod: ` +
    `${reclaimable} can be reclaimed, ${held} still in use.${cap}`
  );
}
