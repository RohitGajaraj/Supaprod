/**
 * G-PRICE PR-B2: the optional Balanced / Deep / Fast model menu (Pro+).
 *
 * pricing-architecture.md §3: "for users who want to choose, a small curated menu maps
 * to model classes, each with a credit-burn rate — an in-product dial, exactly like
 * v0/Bolt, NOT a billing bypass. Model choice changes how fast you spend credits, never
 * who bills you." Platform-managed routing (PR-B1, already the default via
 * capability.ts / routing.ts) stays untouched underneath; this is a consumer-facing
 * DIAL on top of it, not a second routing path.
 *
 * Founder-config: which live model each class maps to. Placeholders below pick a
 * sensible model per class from the existing catalog (models.ts); tune freely, the
 * mechanism (3 named classes -> a model id, gated Pro+) is final.
 */
import type { PlanTier } from "../entitlements";

export type ModelMenuClass = "fast" | "balanced" | "deep";

export type ModelMenuOption = {
  id: ModelMenuClass;
  label: string;
  description: string;
  /** The catalog model id this class currently routes to. */
  modelId: string;
  /** Relative credit-burn rate vs "balanced" (1.0), for the usage-indicator dial only — never shown as a dollar figure. */
  creditBurnRate: number;
};

export const MODEL_MENU: readonly ModelMenuOption[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Quick answers for routine work. Burns credits slowest.",
    modelId: "google/gemini-2.5-flash-lite",
    creditBurnRate: 0.4,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "The default: strong quality at a reasonable pace.",
    modelId: "google/gemini-2.5-flash",
    creditBurnRate: 1.0,
  },
  {
    id: "deep",
    label: "Deep",
    description: "Slower, deeper reasoning for the hardest calls.",
    modelId: "google/gemini-2.5-pro",
    creditBurnRate: 2.5,
  },
] as const;

export function modelMenuOption(id: ModelMenuClass): ModelMenuOption {
  return MODEL_MENU.find((m) => m.id === id) ?? MODEL_MENU[1];
}

/** The model menu is a Pro+ capability (Free stays on pure platform-managed auto-routing). */
export function modelMenuAvailable(tier: PlanTier): boolean {
  return tier !== "free";
}

/**
 * Resolve a user's chosen model-menu class to the model id the chokepoint should route
 * to. Falls back to "balanced" for an unset/unknown class, and refuses to apply the
 * dial at all for a tier that does not have the menu (Free) — callers on Free ignore
 * this and stay on pure Auto routing. Pure.
 */
export function resolveModelMenuChoice(
  tier: PlanTier,
  choice: ModelMenuClass | null | undefined,
): string | null {
  if (!modelMenuAvailable(tier)) return null;
  if (!choice) return null;
  return modelMenuOption(choice).modelId;
}

/** Re-exported for callers that want the entitlement check alongside the menu. */
export function planAllowsModelMenu(tier: PlanTier): boolean {
  return modelMenuAvailable(tier);
}
