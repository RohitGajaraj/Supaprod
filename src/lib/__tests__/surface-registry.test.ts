// Surface registry CI gate (front-end reimagining, no-orphan enforcement):
// every server-function domain on disk must declare where it lives in the
// Mission Control IA and the visible element that reaches it. A capability
// with no on-screen door is an orphan and fails this suite. Deliberately
// fs-based and synchronous, same shape as route-inventory.test.ts.
import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import {
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
    const stale = Object.keys(SURFACE_REGISTRY).filter((d) => !onDisk.has(d));
    expect(
      stale,
      `Registry entries with no matching src/lib/<domain>.functions.ts (remove or rename): ${stale.join(", ")}`,
    ).toEqual([]);
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
