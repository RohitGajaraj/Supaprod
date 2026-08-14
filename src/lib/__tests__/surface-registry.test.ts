// Surface registry CI gate (front-end reimagining, no-orphan enforcement):
// every server-function domain on disk must declare where it lives in the
// Mission Control IA and the visible element that reaches it. A capability
// with no on-screen door is an orphan and fails this suite. Deliberately
// fs-based and synchronous, same shape as route-inventory.test.ts.
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  PLACEHOLDER_DOMAINS,
  SURFACE_KINDS,
  SURFACE_REGISTRY,
  SURFACE_STATUSES,
  surfaceForDomain,
  type SurfaceEntry,
} from "../surface-registry";

const LIB_DIR = join(import.meta.dir, "..");

function domainsOnDisk(): string[] {
  return readdirSync(LIB_DIR)
    .filter((f) => f.endsWith(".functions.ts"))
    .map((f) => f.slice(0, -".functions.ts".length))
    .sort();
}

const entries = Object.entries(SURFACE_REGISTRY) as Array<[string, SurfaceEntry]>;

describe("surface registry", () => {
  test("every *.functions.ts domain on disk has a registry entry", () => {
    const registered = new Set(Object.keys(SURFACE_REGISTRY));
    const missing = domainsOnDisk().filter((d) => !registered.has(d));
    expect(
      missing,
      `Unregistered server-function domains (add each to SURFACE_REGISTRY with a real home and a visible opensFrom): ${missing.join(", ")}`,
    ).toEqual([]);
  });

  test("every registry entry maps to a real file on disk (no rot)", () => {
    const onDisk = new Set(domainsOnDisk());
    const placeholders = new Set<string>(PLACEHOLDER_DOMAINS);
    const stale = Object.keys(SURFACE_REGISTRY).filter(
      (d) => !onDisk.has(d) && !placeholders.has(d),
    );
    expect(
      stale,
      `Registry entries with no matching src/lib/<domain>.functions.ts (remove or rename): ${stale.join(", ")}`,
    ).toEqual([]);
  });

  test("placeholder domains stay honest: status planned, no file on disk yet", () => {
    // Addendum 1.1 items 5-6 (Threads and Artifacts homes): these are the
    // only entries allowed to exist without a *.functions.ts module. Each
    // must remain 'planned', and the moment its domain module lands it must
    // leave PLACEHOLDER_DOMAINS so the no-rot gate covers it again.
    const onDisk = new Set(domainsOnDisk());
    for (const domain of PLACEHOLDER_DOMAINS) {
      const entry = surfaceForDomain(domain);
      expect(entry, `Placeholder ${domain} missing from SURFACE_REGISTRY`).toBeDefined();
      expect(entry?.status, `Placeholder ${domain} must stay status 'planned'`).toBe("planned");
      expect(
        onDisk.has(domain),
        `${domain}.functions.ts now exists on disk: remove '${domain}' from PLACEHOLDER_DOMAINS`,
      ).toBe(false);
    }
  });

  test("no entry has an empty opensFrom: every domain is reachable from a visible element", () => {
    const orphans = entries
      .filter(([, e]) => e.opensFrom.trim().length === 0)
      .map(([domain]) => domain);
    expect(orphans, `Domains with no visible door: ${orphans.join(", ")}`).toEqual([]);
  });

  test("every kind is valid", () => {
    const validKinds = new Set<string>(SURFACE_KINDS);
    const bad = entries
      .filter(([, e]) => !validKinds.has(e.kind))
      .map(([domain, e]) => `${domain} (${e.kind})`);
    expect(bad, `Invalid kinds: ${bad.join(", ")}`).toEqual([]);
  });

  test("every status is valid and every home is non-empty", () => {
    const validStatuses = new Set<string>(SURFACE_STATUSES);
    const badStatus = entries
      .filter(([, e]) => !validStatuses.has(e.status))
      .map(([domain]) => domain);
    const emptyHome = entries
      .filter(([, e]) => e.home.trim().length === 0)
      .map(([domain]) => domain);
    expect(badStatus, `Invalid statuses: ${badStatus.join(", ")}`).toEqual([]);
    expect(emptyHome, `Empty homes: ${emptyHome.join(", ")}`).toEqual([]);
  });

  test("settings and admin kinds keep their nav doors", () => {
    // settings-nav / admin-nav are the accepted doors for those kinds; other
    // kinds must name a specific element, not lean on a nav catch-all.
    const leaning = entries
      .filter(
        ([, e]) =>
          (e.opensFrom === "settings-nav" && e.kind !== "settings") ||
          (e.opensFrom === "admin-nav" && e.kind !== "admin"),
      )
      .map(([domain]) => domain);
    expect(
      leaning,
      `Non-settings/admin entries hiding behind a nav catch-all: ${leaning.join(", ")}`,
    ).toEqual([]);
  });

  test("surfaceForDomain returns entries for known domains and undefined otherwise", () => {
    expect(surfaceForDomain("brain")).toEqual({
      kind: "route",
      home: "brain",
      opensFrom: "nav-rail-brain",
      status: "live",
    });
    expect(surfaceForDomain("not-a-domain")).toBeUndefined();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// THE GATE THIS FILE'S OWN HEADER PROMISES, AND DID NOT ENFORCE.
//
// The header says a capability with no on-screen door is an orphan and fails
// this suite. It did not. Every test above asks whether a domain has a REGISTRY
// ENTRY with a non-empty `opensFrom` string, which is a declaration of intent,
// not a fact about the code. So 27 modules with no importer anywhere in `src/`
// passed CI indefinitely, including a 558-line second implementation of Today
// that `/today` does not use.
//
// This is the fourth instance of one pattern found on 2026-08-14: a green test
// guarding a thing nobody reaches. The others were a workspace flag no code
// could write, three MCP write tools whose scope no code could grant, and a
// connector cap no code calls. Every one of those tests asked "does this unit
// behave correctly" and none asked "is this unit reached".
//
// WHY AN ENUMERATED LIST RATHER THAN A CLEAN ASSERTION. The 27 below are real
// and each is a product decision (wire the UI, or delete the module) rather than
// a defect to fix in a test file. Failing the build on all of them today would
// force a rushed answer to 27 separate questions. Listing them converts an
// invisible problem into a debt that is counted, and the gate below makes the
// list SHRINK ONLY: a new orphan fails immediately, and a wired-up or deleted
// module must be removed from the list or the suite fails for the opposite
// reason. Neither direction can drift quietly.
// ───────────────────────────────────────────────────────────────────────────

/**
 * Domains with no importer anywhere in `src/`, measured 2026-08-14.
 *
 * The verdicts are in docs/planning/initiatives/audit-reports/long-tail-and-orphans.md:
 * roughly half are a real capability one screen away and half are second copies
 * of something that shipped better. Two live routes (`/calendar`, `/meetings`)
 * currently advertise capabilities on this list.
 */
const KNOWN_UNREACHED: readonly string[] = [
  "ambient",
  "audio",
  "briefing",
  "calendar",
  "changelog-heartbeat",
  "cost-per-outcome",
  "dashboard",
  "delegate-desk",
  "delegate-poll",
  "design-interchange",
  "fanout",
  "funnel",
  "goals",
  "greeting",
  "loop-health",
  "loops",
  "meetings",
  "moat",
  "product-context",
  "researcher",
  "rework",
  "run-analytics",
  "shared-premise",
  "strategy-registry",
  "task-graph",
  "today-lanes",
  // Built 2026-08-14 for a flag that had no writer at all. The control is Lane
  // 1's and is not built yet, which is why this is registered `planned`.
  "workspace-automation",
];

function sourceFilesUnderSrc(): string[] {
  const SRC = join(LIB_DIR, "..");
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "__tests__") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
    }
  };
  walk(SRC);
  return out;
}

/**
 * COMPUTED ONCE, AND THE FIRST VERSION FLAKED FOR WANT OF IT.
 *
 * Each call reads every source file under `src/` and runs 160 domains against
 * all of them, which is 8 to 13 seconds. Calling it per test meant three full
 * sweeps, and under load (two other lanes running agents on this machine) every
 * one of them blew bun's 5-second default and the suite went red on a green
 * codebase.
 *
 * That is the worst kind of failing test: it passes on a quiet box and fails on
 * a busy one, so the next person reads it as noise and stops trusting the gate.
 * A gate nobody trusts is the thing this file was written to replace. Memoised
 * here rather than given a longer timeout, because the sweep genuinely only
 * needs to happen once and 24 seconds of repeated work is the actual defect.
 */
let unreachedCache: string[] | null = null;

/**
 * ONE PASS OVER THE FILES, NOT ONE PASS PER DOMAIN.
 *
 * The first version asked, for each of 160 domains, whether any of ~1,000 files
 * mentioned it: 160,000 substring scans over large strings, 8 to 13 seconds. It
 * blew bun's 5-second default whenever the machine was busy, so the gate went
 * red on a green codebase and read as noise. A gate nobody trusts is the thing
 * this file exists to replace.
 *
 * Inverted: read every file once, pull out the module specifier of every import
 * that names a `*.functions` module, and collect them in a set. A domain is then
 * unreached if its own name is missing from that set, which is a lookup rather
 * than a search. Same answer, and it no longer depends on how loaded the box is.
 *
 * The pattern deliberately covers the aliased form, both relative forms, and the
 * dynamic `await import(...)` several server modules use to keep a heavy
 * dependency out of a client bundle. Missing that last one would report a
 * reached module as an orphan, which is exactly the false positive that gets a
 * gate switched off.
 */
const IMPORTED_FUNCTIONS_MODULE = /["'](?:@\/lib|\.{1,2}(?:\/[\w.-]+)*)\/([\w-]+)\.functions["']/g;

function unreachedDomains(): string[] {
  if (unreachedCache) return unreachedCache;

  const referenced = new Set<string>();
  for (const file of sourceFilesUnderSrc()) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORTED_FUNCTIONS_MODULE)) {
      // A module importing itself is not a reader of itself.
      if (file.endsWith(`lib/${m[1]}.functions.ts`)) continue;
      referenced.add(m[1]);
    }
  }

  unreachedCache = domainsOnDisk().filter((d) => !referenced.has(d));
  return unreachedCache;
}

describe("no-orphan enforcement, on imports rather than intentions", () => {
  test("no NEW server-function domain is unreachable", () => {
    const surprises = unreachedDomains().filter((d) => !KNOWN_UNREACHED.includes(d));
    expect(
      surprises,
      `These domains have no importer anywhere in src/. Either wire the surface that reaches them, delete them, or add them to KNOWN_UNREACHED with a reason: ${surprises.join(", ")}`,
    ).toEqual([]);
  });

  test("the debt list shrinks and never rots", () => {
    // A module that was wired up, or deleted, must leave the list. Without this
    // the allowlist becomes a permanent excuse rather than a countdown.
    const stillUnreached = new Set(unreachedDomains());
    const fixed = KNOWN_UNREACHED.filter((d) => !stillUnreached.has(d));
    expect(
      fixed,
      `These are reachable now (or gone), so remove them from KNOWN_UNREACHED: ${fixed.join(", ")}`,
    ).toEqual([]);
  });

  test("the scan itself is working", () => {
    // If the import detection broke, every domain would look unreached and the
    // first test would pass only because the allowlist swallowed everything.
    // 160 domains against 27 known orphans: anything near the total means the
    // matcher is broken, not that the codebase collapsed.
    expect(unreachedDomains().length).toBeLessThan(domainsOnDisk().length / 2);
    expect(domainsOnDisk().length).toBeGreaterThan(100);
  });
});
