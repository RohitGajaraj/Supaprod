/**
 * No two agents may share a mark, because shape is the only thing that says which
 * agent this is.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────────
 * Founder: "it would be great if you could differentiate the logos for Archivist,
 * Reactor, Guide, Verify, and Critique. All five hold the same logo."
 *
 * The cause is written in `agent-glyphs.tsx`'s own header: it was built for "thirteen
 * distinct silhouettes" and the catalog now carries eighteen active agents. The five
 * added since fell through `BY_NAME` to `Unknown` -- so the single mark that means "no
 * drawing exists" was standing in for a fifth of the crew.
 *
 * That matters more here than it would in most products. This system deliberately
 * refuses to encode agent identity as colour (law 4: identity is shape, status is hue,
 * and the colour ramp has been removed three times). Shape is therefore not decoration
 * on top of a colour, it is the WHOLE encoding -- so two agents sharing a silhouette
 * are, to a reader, the same agent.
 *
 * This test fails the moment a nineteenth agent is added without a drawing, which is
 * the only way that stays true.
 */
import { describe, expect, it } from "bun:test";

import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { SPECIALIST_CATALOG, agentDisplayName } from "@/lib/agent-vocabulary";

const ACTIVE = SPECIALIST_CATALOG.filter((entry) => entry.status === "active");

describe("every active agent has a mark of its own", () => {
  it("has active agents to check, so a broken catalog read cannot pass this file", () => {
    // Without this, an empty ACTIVE would make every assertion below vacuously true.
    expect(ACTIVE.length).toBeGreaterThan(12);
  });

  it("draws a distinct component for each display name", () => {
    /*
     * Keyed on DISPLAY NAME, matching the module, because the catalog rolls several
     * slugs onto one identity on purpose (discovery-scout, discovery, scout and
     * competitor-watcher are all "Watch"). Those sharing a mark is correct; two
     * different names sharing one is the bug.
     */
    const byName = new Map<string, () => unknown>();
    for (const entry of ACTIVE) byName.set(agentDisplayName(entry.slug), glyphForSlug(entry.slug));

    const marks = new Map<unknown, string[]>();
    for (const [name, glyph] of byName) {
      marks.set(glyph, [...(marks.get(glyph) ?? []), name]);
    }

    const shared = [...marks.values()].filter((names) => names.length > 1);
    expect(
      shared.map((names) => names.join(" + ")),
      "these agents share one silhouette, so a reader cannot tell them apart",
    ).toEqual([]);
  });

  it("gives nobody the fallback mark", () => {
    /*
     * THE ASSERTION THAT WOULD HAVE CAUGHT THE ORIGINAL FIVE. Distinctness alone is not
     * enough: if every missing agent resolves to `Unknown`, they are distinct from the
     * DRAWN ones and identical to each other. This checks the fallback is unused, by
     * comparing against a slug the catalog certainly does not hold.
     */
    const fallback = glyphForSlug("a-slug-that-does-not-exist-anywhere");
    const onFallback = ACTIVE.filter((entry) => glyphForSlug(entry.slug) === fallback).map(
      (entry) => agentDisplayName(entry.slug),
    );
    expect(onFallback, "these agents have no drawing and share the placeholder").toEqual([]);
  });

  it("keeps the five the founder named specifically", () => {
    // Named rather than left to the general rule, so a regression reports the same
    // words he used and nobody has to re-derive which five.
    for (const name of ["Archivist", "Reactor", "Guide", "Verify", "Critique"]) {
      const entry = ACTIVE.find((candidate) => agentDisplayName(candidate.slug) === name);
      expect(entry, `${name} is no longer an active agent`).toBeDefined();
      const fallback = glyphForSlug("a-slug-that-does-not-exist-anywhere");
      expect(glyphForSlug(entry!.slug), `${name} is back on the placeholder`).not.toBe(fallback);
    }
  });
});
