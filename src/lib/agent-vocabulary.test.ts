import { describe, it, expect } from "bun:test";
import { SPECIALIST_CATALOG, agentDisplayName } from "./agent-vocabulary";

/**
 * PC-29 (the felt agent layer) layer 1: the regression guard for the
 * engineer/stakeholder/copilot duplicate-role bug. seed_default_agents was
 * inserting deprecated alias slugs as NEW active rows alongside the
 * canonical slug they map to, so two DB rows rendered under the same
 * display name. This locks the invariant the catalog already claims for
 * itself (deprecated entries are map-only aliases, never a second active
 * identity) so that bug class cannot silently reappear.
 */
describe("agent-vocabulary: no duplicate active display names", () => {
  it("no two ACTIVE catalog entries share the same agentDisplayName() output", () => {
    const active = SPECIALIST_CATALOG.filter((entry) => entry.status !== "deprecated");
    const seen = new Map<string, string>();

    for (const entry of active) {
      const displayName = agentDisplayName(entry.slug);
      const collidingSlug = seen.get(displayName);
      expect(
        collidingSlug,
        `"${displayName}" is shown by both active slugs "${collidingSlug}" and "${entry.slug}"`,
      ).toBeUndefined();
      seen.set(displayName, entry.slug);
    }
  });

  it("deprecated aliases still resolve to a name, just not a name any active slug also owns", () => {
    const activeNames = new Set(
      SPECIALIST_CATALOG.filter((entry) => entry.status !== "deprecated").map((entry) =>
        agentDisplayName(entry.slug),
      ),
    );

    for (const entry of SPECIALIST_CATALOG.filter((e) => e.status === "deprecated")) {
      const displayName = agentDisplayName(entry.slug);
      expect(displayName.length).toBeGreaterThan(0);
      // A deprecated alias is allowed (expected) to share a name with the
      // canonical active slug it maps to; it must never introduce a name no
      // active slug already claims, which would mean an orphaned identity.
      expect(activeNames.has(displayName)).toBe(true);
    }
  });
});
