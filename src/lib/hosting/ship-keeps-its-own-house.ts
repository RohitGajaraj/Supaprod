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
export function houseLine(apps: readonly HostedApp[], now: Date): string {
  if (apps.length === 0) return "No hosted previews are on the record.";
  const reclaimable = apps.filter((a) => mayReclaim(a, now).reclaim).length;
  const held = apps.length - reclaimable;
  if (reclaimable === 0) {
    return `${apps.length} hosted ${apps.length === 1 ? "preview" : "previews"}, all still in use.`;
  }
  return (
    `${apps.length} hosted ${apps.length === 1 ? "preview" : "previews"}: ` +
    `${reclaimable} can be reclaimed, ${held} still in use.`
  );
}
