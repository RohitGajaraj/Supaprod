import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { STAGE_LABEL } from "@/components/shell/run-strip";
import { describe, it, expect } from "bun:test";
import {
  SPECIALIST_CATALOG,
  AGENT_FACES,
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  agentDisplayName,
  catalogEntry,
  agentFace,
  agentStation,
  resolveStationTotal,
  agentTier,
  isConductor,
  agentBlurb,
  agentVerb,
  agentRelayVerb,
  agentMark,
  castEntries,
  crewEntries,
  castByStation,
  conductorEntry,
  stepLabel,
  ACTION_LABEL,
} from "./agent-vocabulary";

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

/**
 * Comprehensive coverage for all agent-vocabulary lookup functions.
 * Tests the full catalog query chain: slug lookup, fallback behavior,
 * and the display rendering functions that depend on them.
 */
describe("agent-vocabulary: catalog lookups and displays", () => {
  describe("catalogEntry", () => {
    it("returns null for null/undefined/empty slug", () => {
      expect(catalogEntry(null)).toBeNull();
      expect(catalogEntry(undefined)).toBeNull();
      expect(catalogEntry("")).toBeNull();
    });

    it("returns the entry for a known active slug", () => {
      const entry = catalogEntry("prd-writer");
      expect(entry).toBeDefined();
      expect(entry?.slug).toBe("prd-writer");
      expect(entry?.name).toBe("Draft");
      expect(entry?.station).toBe("define");
    });

    it("returns the entry for a known deprecated slug (map-only alias)", () => {
      const entry = catalogEntry("scribe");
      expect(entry).toBeDefined();
      expect(entry?.slug).toBe("scribe");
      expect(entry?.status).toBe("deprecated");
    });

    it("returns null for unknown slug", () => {
      expect(catalogEntry("unknown-slug-12345")).toBeNull();
    });

    it("is case-insensitive (lowercases the slug before lookup)", () => {
      const lower = catalogEntry("prd-writer");
      const upper = catalogEntry("PRD-WRITER");
      const mixed = catalogEntry("PrD-WrItEr");
      expect(lower).toEqual(upper);
      expect(upper).toEqual(mixed);
    });
  });

  describe("agentFace", () => {
    it("returns the face for a known slug", () => {
      expect(agentFace("prd-writer")).toBe("scribe");
      expect(agentFace("strategist")).toBe("strategist");
      expect(agentFace("critic")).toBe("critic");
    });

    it("returns null for null/undefined/unknown slug", () => {
      expect(agentFace(null)).toBeNull();
      expect(agentFace(undefined)).toBeNull();
      expect(agentFace("unknown-agent")).toBeNull();
    });

    it("works for deprecated aliases", () => {
      const face = agentFace("scribe");
      expect(face).toBe("scribe");
    });
  });

  describe("agentStation", () => {
    it("returns the station for a known slug", () => {
      expect(agentStation("prd-writer")).toBe("define");
      expect(agentStation("discovery-scout")).toBe("sense");
      expect(agentStation("builder")).toBe("build");
    });

    it("returns null for null/undefined/unknown slug", () => {
      expect(agentStation(null)).toBeNull();
      expect(agentStation(undefined)).toBeNull();
      expect(agentStation("unknown-agent")).toBeNull();
    });
  });

  describe("resolveStationTotal", () => {
    it("returns the station for a known slug", () => {
      expect(resolveStationTotal("prd-writer")).toBe("define");
    });

    it("falls back to 'build' for null/undefined/unknown slug (never null)", () => {
      expect(resolveStationTotal(null)).toBe("build");
      expect(resolveStationTotal(undefined)).toBe("build");
      expect(resolveStationTotal("unknown-agent")).toBe("build");
    });

    it("always returns a valid station (never null)", () => {
      for (const slug of ["", null, undefined, "xyz", "random-slug"]) {
        const result = resolveStationTotal(slug);
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
        expect(["sense", "decide", "define", "design", "build", "ship", "learn"]).toContain(result);
      }
    });
  });

  describe("agentTier", () => {
    it("returns 'cast' for cast agents", () => {
      expect(agentTier("prd-writer")).toBe("cast");
      expect(agentTier("builder")).toBe("cast");
    });

    it("returns 'crew' for crew agents", () => {
      expect(agentTier("reactor")).toBe("crew");
      expect(agentTier("archivist")).toBe("crew");
    });

    it("defaults to 'cast' for null/undefined/unknown slug", () => {
      expect(agentTier(null)).toBe("cast");
      expect(agentTier(undefined)).toBe("cast");
      expect(agentTier("unknown-agent")).toBe("cast");
    });
  });

  describe("isConductor", () => {
    it("returns true only for the orchestrator/conductor", () => {
      expect(isConductor("orchestrator")).toBe(true);
    });

    it("returns false for all non-conductor agents", () => {
      expect(isConductor("prd-writer")).toBe(false);
      expect(isConductor("builder")).toBe(false);
      expect(isConductor("reactor")).toBe(false);
    });

    it("returns false for null/undefined/unknown slug", () => {
      expect(isConductor(null)).toBe(false);
      expect(isConductor(undefined)).toBe(false);
      expect(isConductor("unknown-agent")).toBe(false);
    });
  });

  describe("agentDisplayName", () => {
    it("returns catalog name for known slug", () => {
      expect(agentDisplayName("prd-writer")).toBe("Draft");
      expect(agentDisplayName("builder")).toBe("Engineer");
    });

    it("uses fallbackName when slug is unknown or null", () => {
      expect(agentDisplayName(null, "Custom Name")).toBe("Custom Name");
      expect(agentDisplayName("unknown-slug", "Fallback Agent")).toBe("Fallback Agent");
    });

    it("title-cases slug as ultimate fallback (when slug is set but unknown and no fallback)", () => {
      const result = agentDisplayName("unknown-agent-name");
      expect(result).toBe("Unknown Agent Name");
    });

    it("returns 'Agent' when all fallbacks fail (null slug, no fallback)", () => {
      expect(agentDisplayName(null)).toBe("Agent");
      expect(agentDisplayName(undefined)).toBe("Agent");
    });

    it("trims whitespace from fallbackName", () => {
      expect(agentDisplayName(null, "  Trimmed Name  ")).toBe("Trimmed Name");
    });

    it("ignores empty/whitespace-only fallbackName", () => {
      expect(agentDisplayName("unknown", "   ")).toBe("Unknown");
      expect(agentDisplayName("unknown", "")).toBe("Unknown");
    });
  });

  describe("agentBlurb", () => {
    it("returns the agent's blurb for known slug", () => {
      const blurb = agentBlurb("prd-writer");
      expect(blurb).toBe("Turns the decision into a clear spec.");
    });

    it("falls back to face blurb for unknown slug", () => {
      const blurb = agentBlurb("unknown-scribe-agent");
      // Returns scribe face blurb only if the face can be resolved (which it can't from unknown slug)
      expect(blurb).toBeNull();
    });

    it("returns null for null/undefined slug and no face fallback", () => {
      expect(agentBlurb(null)).toBeNull();
      expect(agentBlurb(undefined)).toBeNull();
    });
  });

  describe("agentVerb", () => {
    it("returns the legacy face verb for a known slug", () => {
      expect(agentVerb("prd-writer")).toBe("drafts"); // scribe face
      expect(agentVerb("builder")).toBe("drafts"); // scribe face
    });

    it("returns null for null/undefined/unknown slug", () => {
      expect(agentVerb(null)).toBeNull();
      expect(agentVerb(undefined)).toBeNull();
      expect(agentVerb("unknown-agent")).toBeNull();
    });
  });

  describe("agentRelayVerb", () => {
    it("returns the relay phrase for a known slug", () => {
      expect(agentRelayVerb("prd-writer")).toBe("drafting the spec");
      expect(agentRelayVerb("discovery-scout")).toBe("reading your sources");
    });

    it("returns null for null/undefined/unknown slug", () => {
      expect(agentRelayVerb(null)).toBeNull();
      expect(agentRelayVerb(undefined)).toBeNull();
      expect(agentRelayVerb("unknown-agent")).toBeNull();
    });
  });

  describe("agentMark", () => {
    it("returns hue + glyph for a known slug", () => {
      const mark = agentMark("prd-writer");
      expect(mark.hue).toBeDefined();
      expect(mark.glyph).toBe("file-text");
      expect(typeof mark.hue).toBe("string");
      expect(mark.hue.startsWith("oklch")).toBe(true);
    });

    it("returns machine-blue + generic 'bot' glyph for unknown slug", () => {
      const mark = agentMark("unknown-agent");
      expect(mark.glyph).toBe("bot");
      expect(mark.hue).toBe("oklch(0.55 0.12 196)");
    });

    it("returns fallback mark for null/undefined slug", () => {
      const nullMark = agentMark(null);
      const undefMark = agentMark(undefined);
      expect(nullMark.glyph).toBe("bot");
      expect(undefMark.glyph).toBe("bot");
    });
  });

  describe("castEntries", () => {
    it("returns only active cast entries (not crew, not deprecated)", () => {
      const cast = castEntries();
      expect(cast.length).toBeGreaterThan(0);
      for (const entry of cast) {
        expect(entry.tier).toBe("cast");
        expect(entry.status).toBe("active");
      }
    });

    it("does not include crew or deprecated entries", () => {
      const cast = castEntries();
      const slugs = new Set(cast.map((e) => e.slug));
      expect(slugs.has("reactor")).toBe(false); // crew
      expect(slugs.has("scribe")).toBe(false); // deprecated
    });

    it("includes all known active cast agents", () => {
      const cast = castEntries();
      const slugs = new Set(cast.map((e) => e.slug));
      expect(slugs.has("prd-writer")).toBe(true);
      expect(slugs.has("builder")).toBe(true);
      expect(slugs.has("orchestrator")).toBe(true);
    });
  });

  describe("crewEntries", () => {
    it("returns only active crew entries", () => {
      const crew = crewEntries();
      expect(crew.length).toBeGreaterThan(0);
      for (const entry of crew) {
        expect(entry.tier).toBe("crew");
        expect(entry.status).toBe("active");
      }
    });

    it("does not include cast or deprecated entries", () => {
      const crew = crewEntries();
      const slugs = new Set(crew.map((e) => e.slug));
      expect(slugs.has("prd-writer")).toBe(false); // cast
      expect(slugs.has("scribe")).toBe(false); // deprecated
    });

    it("includes known crew agents like reactor and archivist", () => {
      const crew = crewEntries();
      const slugs = new Set(crew.map((e) => e.slug));
      expect(slugs.has("reactor")).toBe(true);
      expect(slugs.has("archivist")).toBe(true);
    });
  });

  describe("castByStation", () => {
    it("returns cast entries for a specific station", () => {
      const define = castByStation("define");
      expect(define.length).toBeGreaterThan(0);
      for (const entry of define) {
        expect(entry.station).toBe("define");
        expect(entry.tier).toBe("cast");
        expect(entry.status).toBe("active");
      }
    });

    it("excludes the conductor (orchestrator) from station results", () => {
      const decide = castByStation("decide");
      const slugs = new Set(decide.map((e) => e.slug));
      // orchestrator is at decide station but marked conductor, so excluded
      expect(slugs.has("orchestrator")).toBe(false);
    });

    it("works for all seven stations", () => {
      const stations: Array<"sense" | "decide" | "define" | "design" | "build" | "ship" | "learn"> =
        ["sense", "decide", "define", "design", "build", "ship", "learn"];
      for (const station of stations) {
        const entries = castByStation(station);
        expect(entries.length).toBeGreaterThan(0);
        for (const entry of entries) {
          expect(entry.station).toBe(station);
        }
      }
    });
  });

  describe("conductorEntry", () => {
    it("returns the conductor entry (orchestrator)", () => {
      const conductor = conductorEntry();
      expect(conductor).toBeDefined();
      expect(conductor?.slug).toBe("orchestrator");
      expect(conductor?.conductor).toBe(true);
      expect(conductor?.name).toBe("Chief of Staff");
    });

    it("returns null if no active conductor exists (but one should always exist)", () => {
      const conductor = conductorEntry();
      expect(conductor).not.toBeNull();
    });
  });

  describe("stepLabel", () => {
    it("returns 'starting up' for undefined/null step", () => {
      expect(stepLabel(undefined)).toBe("starting up");
      expect(stepLabel(null)).toBe("starting up");
    });

    it("returns 'thinking' for thought steps", () => {
      expect(stepLabel({ kind: "thought" })).toBe("thinking");
    });

    it("returns action label from ACTION_LABEL for tool_call steps", () => {
      expect(stepLabel({ kind: "tool_call", name: "repo.read" })).toBe("reading the repo");
      expect(stepLabel({ kind: "tool_call", name: "studio.commit" })).toBe("saving changes");
    });

    it("returns 'working' for unknown tool_call names", () => {
      expect(stepLabel({ kind: "tool_call", name: "unknown-tool" })).toBe("working");
    });

    it("returns 'working' for unknown step kinds", () => {
      expect(stepLabel({ kind: "unknown" })).toBe("working");
    });

    it("handles missing name in tool_call gracefully", () => {
      expect(stepLabel({ kind: "tool_call" })).toBe("working");
    });
  });

  describe("ACTION_LABEL lookup", () => {
    it("has mapping for all common studio operations", () => {
      expect(ACTION_LABEL["studio.stage"]).toBe("drafting changes");
      expect(ACTION_LABEL["studio.commit"]).toBe("saving changes");
      expect(ACTION_LABEL["studio.pr.open"]).toBe("opening a pull request");
    });

    it("has mapping for repo operations", () => {
      expect(ACTION_LABEL["repo.read"]).toBe("reading the repo");
      expect(ACTION_LABEL["repo.search"]).toBe("searching the repo");
    });

    it("has mapping for CI operations", () => {
      expect(ACTION_LABEL["github.ci.read"]).toBe("checking tests");
      expect(ACTION_LABEL["ci.logs"]).toBe("reading the failing check");
    });
  });
});

/**
 * FOUNDER RULING 2026-08-01: the first station is Discover, on every surface.
 *
 * The guard that was missing. The catalog said "Sense" while the nav, the spine
 * rail, the audit ledger, the briefing, the Ask chip and the public landing all
 * said Discover, and run-strip.tsx aliased around the disagreement instead of
 * fixing it. The alias held for weeks while every surface rendering straight
 * from the catalog leaked the internal word, until a Plan receipt read
 * "Waived: sense, decide" under a rail saying Discover.
 */
describe("the first station is called Discover everywhere", () => {
  it("names it Discover in the catalog every surface renders from", () => {
    expect(AGENT_STATIONS.sense.name).toBe("Discover");
  });

  it("keeps the run strip a restatement of the catalog, never an exception", () => {
    for (const station of AGENT_STATION_ORDER) {
      expect(STAGE_LABEL[station]).toBe(AGENT_STATIONS[station].name);
    }
  });

  it("never shows an internal station id as a display name", () => {
    for (const station of AGENT_STATION_ORDER) {
      expect(AGENT_STATIONS[station].name).not.toBe(station);
    }
  });
});

/**
 * THE GUARD ABOVE READS TWO MAPS. THE LEAK WAS IN A FILE.
 *
 * F-150, measured 2026-08-31. `src/components/track/RunTimeline.tsx` carried its
 * own `STATION_DISPLAY_NAMES` with `sense: "Sense"` and `define: "Define"` — and
 * a `discover:` key sitting as a SIBLING of `sense:`, so one object held both
 * vocabularies at once. Its own test asserted both appeared, so `bun test` was
 * green while the defect sat there. Nothing but that test imported it; the live
 * component is `src/components/meridian/RunTimeline.tsx`.
 *
 * WHY THE THREE CASES ABOVE COULD NOT SEE IT. They read `AGENT_STATIONS` and
 * `STAGE_LABEL`. A component that declares its own private map is invisible to
 * both. And the map was typed `Record<string, string>` rather than
 * `Record<AgentStation, string>`, so renaming the union — the fix that was
 * proposed for this — raises ZERO type errors here and would have left the
 * complaint on disk.
 *
 * WHAT IS FORBIDDEN, AND WHY IT IS DERIVED RATHER THAN LISTED. Five of the seven
 * slugs title-case to their own display name (Decide, Design, Build, Ship,
 * Learn), so seeing them is harmless. Two do not: `sense` displays as Discover
 * and `define` displays as Plan. Those two title-cases are words the customer
 * has never seen. The set is computed from `AGENT_STATIONS` so that if a display
 * name ever changes, the forbidden set follows it instead of going stale.
 *
 * WHAT IT DOES NOT DO. It reads string LITERALS in shipped source only:
 * comments are stripped (three files discuss this incident in prose, including
 * the one above), and test files are skipped (`route-intent.test.ts` uses
 * "Sense" as a deliberate bad input). A guard that fired on either would have
 * been turned off within a day.
 */
describe("no file renders an internal station id as a display name", () => {
  const SRC = join(import.meta.dir, "..");

  /** Words a slug title-cases to that are NOT what the product calls it. */
  function forbiddenDisplayWords(): string[] {
    return AGENT_STATION_ORDER.map((slug) => {
      const titled = slug.charAt(0).toUpperCase() + slug.slice(1);
      return titled === AGENT_STATIONS[slug].name ? null : titled;
    }).filter((w): w is string => w !== null);
  }

  function sourceFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "__tests__") continue;
        sourceFiles(full, out);
      } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        out.push(full);
      }
    }
    return out;
  }

  /** Comments discuss the defect on purpose; only shipped literals count. */
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  }

  it("computes the forbidden set from the catalog, not a hardcoded list", () => {
    expect(forbiddenDisplayWords().sort()).toEqual(["Define", "Sense"]);
  });

  it("no shipped source file contains one as a string literal", () => {
    const forbidden = forbiddenDisplayWords();
    const pattern = new RegExp(`["'\`](${forbidden.join("|")})["'\`]`);
    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const hit = stripComments(readFileSync(file, "utf8")).match(pattern);
      if (!hit) continue;
      const rel = file.slice(file.indexOf("/src/") + 1);
      // KNOWN, FILED, NOT MINE TO FIX. `src/routes/product.tsx` is the public
      // marketing page and it lists the stations as display names, saying
      // "Define" where the whole product says Plan. It is outside S1's prefix,
      // so it is a request rather than an edit:
      // coordination/requests/S1/product-page-says-define-where-we-say-plan.md
      // The assertion below FAILS once it is fixed, which is deliberate — the
      // exception expires instead of quietly becoming permanent.
      if (rel === "src/routes/product.tsx") continue;
      offenders.push(`${rel} renders ${hit[1]}`);
    }

    expect(offenders).toEqual([]);
  });

  it("still has exactly one exception, and fails when it stops being needed", () => {
    const forbidden = forbiddenDisplayWords();
    const pattern = new RegExp(`["'\`](${forbidden.join("|")})["'\`]`);
    const product = join(SRC, "routes", "product.tsx");
    expect(stripComments(readFileSync(product, "utf8"))).toMatch(pattern);
  });
});
