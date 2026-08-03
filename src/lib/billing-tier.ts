/**
 * Map a Stripe price `lookup_key` to a Supaprod PlanTier.
 *
 * Lookup keys follow a stable prefix convention seeded with the Stripe catalog:
 *   cluster_*       -> pro
 *   constellation_* -> max
 *   galaxy_*        -> team
 *   topup_*         -> null (one-time, never changes plan)
 *
 * Single source of truth used by the webhook to flip accounts.plan_tier and by
 * the checkout UI to pick a sensible default bundle for an upgrade.
 */
import { MAX_MONTHLY_USD, type PlanTier } from "@/lib/entitlements";

export function tierFromLookupKey(lookupKey: string | null | undefined): PlanTier | null {
  if (!lookupKey) return null;
  if (lookupKey.startsWith("cluster_")) return "pro";
  if (lookupKey.startsWith("constellation_")) return "max";
  if (lookupKey.startsWith("galaxy_")) return "team";
  return null;
}

/**
 * Base monthly prices (USD) for the 100-credit base tier of each self-serve plan.
 * Linear pricing: priceForCredits(tier, credits, "monthly") = BASE * (credits / 100).
 * Annual = monthly * ANNUAL_DISCOUNT_FACTOR (~10/12, roughly 17% off).
 * Source: pricing-strategy.md §2 (2026-06-26 founder decision).
 * Set final numbers in the Stripe admin catalog; these are the reference placeholders.
 */
const TIER_BASE_MONTHLY_USD: Record<"pro" | "team", number> = {
  pro: 20,
  team: 50,
};

/**
 * Compute the display price for a given (tier, credits, interval) selection.
 * Returns null for free or enterprise (no self-serve numeric price).
 * Pure — used by the pricing page and settings billing tab to update the price
 * display reactively as the user adjusts the credit dropdown or billing toggle.
 */
export function priceForCredits(
  tier: PlanTier,
  credits: number,
  interval: "monthly" | "yearly",
): number | null {
  // Max is a flat price with no band to multiply. Returning null here was why
  // the advertised number could not be reproduced anywhere in the product.
  if (tier === "max")
    return interval === "yearly" ? Math.round(MAX_MONTHLY_USD * (10 / 12)) : MAX_MONTHLY_USD;
  const base = TIER_BASE_MONTHLY_USD[tier as "pro" | "team"];
  if (!base) return null;
  // FLAT PER TIER since 2026-08-03 (founder ruling). `credits` is accepted for call-site
  // compatibility and deliberately ignored.
  //
  // It used to scale the price linearly: BASE * (credits / 100). That is what produced
  // two defects visible on the live public page. Pro's default band was 100 credits for
  // 20 USD against a FREE tier granting 750, so the entry paid plan was 7.5x WORSE than
  // free and matching the free grant cost 160 USD a month. And the top band rendered
  // "$2000/mo" for volume whose underlying COGS is about 2 USD.
  //
  // The deeper error was conflating two axes. A tier sells SEATS AND CAPABILITY; credits
  // sell CAPACITY. Making a solo user climb to a team plan to get volume charges them
  // for collaboration they did not ask for, which the pricing copy itself contradicts
  // ("Business starts at two seats"). Capacity now has its own control: top-ups, already
  // implemented (entitlements.creditTopUps, topUpCycleCap = grant x 2), so a Pro user can
  // reach 3x their allowance without ever changing plan.
  const monthly = base;
  // Annual = monthly * (10/12) billed per month (or * 10 billed upfront).
  return interval === "yearly" ? Math.round(monthly * (10 / 12)) : monthly;
}

/**
 * Format the price for display. Returns "from $X/mo" for the base tier,
 * "$X/mo" for a specific credit selection.
 */
export function formatPrice(
  tier: PlanTier,
  credits: number,
  interval: "monthly" | "yearly",
): string {
  const price = priceForCredits(tier, credits, interval);
  if (price === null) return interval === "yearly" ? "Contact sales" : "Contact sales";
  return `$${price}/mo`;
}

/** Default monthly bundle lookup key for a tier, used when the user clicks "Upgrade" without picking a bundle size. */
export function defaultMonthlyLookupKey(tier: PlanTier): string | null {
  switch (tier) {
    case "pro":
      return "cluster_100_monthly";
    case "max":
      return "constellation_100_monthly";
    case "team":
      return "galaxy_100_monthly";
    default:
      return null;
  }
}

/** Tier slug -> Stripe lookup_key prefix. */
const TIER_PREFIX: Record<Exclude<PlanTier, "free" | "enterprise">, string> = {
  pro: "cluster",
  max: "constellation",
  team: "galaxy",
};

/**
 * Parse a credits shorthand token into a credit count. Mirrors the shorthand
 * `lookupKeyFor` emits, plus the `N_Mk` decimal form the seeded top-up keys use:
 *   "500" -> 500 · "1k" -> 1000 · "10k" -> 10000 · "2500" -> 2500 · "2_5k" -> 2500
 * Returns null for an unrecognized token. Pure.
 */
function parseCreditsToken(token: string): number | null {
  let m = /^(\d+)k$/.exec(token);
  if (m) return parseInt(m[1], 10) * 1000;
  m = /^(\d+)_(\d+)k$/.exec(token);
  if (m) {
    const frac = parseInt(m[2], 10) / Math.pow(10, m[2].length);
    return Math.round((parseInt(m[1], 10) + frac) * 1000);
  }
  m = /^(\d+)$/.exec(token);
  if (m) return parseInt(m[1], 10);
  return null;
}

/**
 * Inverse of `lookupKeyFor`: the credit volume encoded in a subscription-bundle OR
 * top-up `lookup_key`. The single, catalog-agnostic source the webhook uses to know
 * how many credits a completed purchase grants, so ANY bundle the founder adds in the
 * admin catalog credits correctly (no hardcoded per-key map to drift).
 *   "cluster_1k_monthly" -> 1000 · "galaxy_2500_seat_monthly" -> 2500 ·
 *   "constellation_25k_yearly" -> 25000 · "topup_250" -> 250 · "topup_2_5k" -> 2500
 * Returns null if the key is unrecognized. Pure.
 */
export function creditsFromLookupKey(lookupKey: string | null | undefined): number | null {
  if (!lookupKey) return null;
  if (lookupKey.startsWith("topup_")) {
    return parseCreditsToken(lookupKey.slice("topup_".length));
  }
  const tier = tierFromLookupKey(lookupKey);
  if (!tier || tier === "free" || tier === "enterprise") return null;
  const prefix = TIER_PREFIX[tier];
  const token = lookupKey
    .slice(prefix.length + 1) // strip "<prefix>_"
    .replace(/_(monthly|yearly)$/, "")
    .replace(/_seat$/, "");
  return parseCreditsToken(token);
}

/**
 * Stripe subscription statuses that KEEP the customer's paid entitlements. `active` and `trialing`
 * are obviously entitled; `past_due` is preserved DELIBERATELY (founder ruling: keep access while
 * Stripe retries the card — this is dunning, not termination). Every other status (`canceled`,
 * `unpaid`, `incomplete`, `incomplete_expired`, `paused`, …) drops the customer to `free`.
 */
const TIER_PRESERVING_STATUSES: ReadonlySet<string> = new Set(["active", "trialing", "past_due"]);

/**
 * The tier a customer should hold given their mapped plan tier and Stripe subscription `status`.
 * Returns `tier` while the subscription is entitlement-bearing, else `"free"`. Pure — the single
 * source the payments webhook uses to flip `accounts.plan_tier`, so the access-preservation rule
 * (keep paid access through `past_due`, downgrade on real termination) cannot drift across the
 * subscription created / updated / deleted handlers.
 */
export function effectiveTierForStatus(tier: PlanTier, status: string): PlanTier {
  return TIER_PRESERVING_STATUSES.has(status) ? tier : "free";
}

/**
 * Whether a subscription in this `status` should receive its included monthly credit grant. Only a
 * genuinely paying state (`active` / `trialing`) mints credits; `past_due` keeps ACCESS (see
 * {@link effectiveTierForStatus}) but does NOT grant a fresh allowance until payment clears. Pure.
 */
export function subscriptionStatusGrantsCredits(status: string): boolean {
  return status === "active" || status === "trialing";
}

/** Per-cycle top-up ceiling when the account has no included monthly grant (engine dormant). Matches the SQL RPC fallback. */
export const FALLBACK_TOPUP_CAP = 5_000;

/**
 * The per-cycle capped-top-up ceiling for an account, given its included monthly grant.
 * A paid account may top up to 2x its monthly allowance per cycle; an account with no grant
 * (engine dormant / free) is held to {@link FALLBACK_TOPUP_CAP}. Pure — the SINGLE source the
 * top-up checkout pre-check, the credits view, AND the `apply_topup_credits` SQL RPC all agree
 * on, so the cap the UI shows can never drift from the cap the backend enforces. Mirrors the SQL
 * `_cap := CASE WHEN monthly_grant > 0 THEN monthly_grant * 2 ELSE <fallback> END`
 * (see `topup-cap-sql-parity.test.ts`).
 */
export function topUpCycleCap(monthlyGrantCredits: number | null | undefined): number {
  const grant = Number(monthlyGrantCredits ?? 0);
  return grant > 0 ? grant * 2 : FALLBACK_TOPUP_CAP;
}

/**
 * Build the Stripe `lookup_key` for a (tier, credits, interval) bundle.
 * Convention: `<prefix>_<credits-shorthand>[_seat]_<monthly|yearly>`.
 * - credits < 1000 -> raw number (e.g. `500`)
 * - credits >= 1000 and a multiple of 1000 -> `Nk` (e.g. `1k`, `10k`)
 * - otherwise -> raw number
 * - team adds `_seat` (per-seat pricing).
 */
export function lookupKeyFor(
  tier: PlanTier,
  credits: number,
  interval: "monthly" | "yearly",
): string | null {
  if (tier === "free" || tier === "enterprise") return null;
  const prefix = TIER_PREFIX[tier];
  const shorthand = credits >= 1000 && credits % 1000 === 0 ? `${credits / 1000}k` : `${credits}`;
  const seat = tier === "team" ? "_seat" : "";
  return `${prefix}_${shorthand}${seat}_${interval}`;
}
