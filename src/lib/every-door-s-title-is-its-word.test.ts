/**
 * P-61 · ONE NAME PER PLACE.
 *
 * A-QUEUE.md's amendment (A1, 01:30 IST 09-04) states the guard plainly:
 * "each route's title equals its door's label from `PRIMARY_NAV`'s one
 * list." H1 is explicitly exempt — "a page's H1 stays its own sentence" —
 * so this checks `<title>` only, against the one list `PRIMARY_NAV` already
 * is, rather than re-deriving a second copy of the door names to compare
 * against.
 *
 * `/track`'s `to` is an identity, not a route (nav-model.ts says so
 * explicitly), so it maps to `_authenticated.track.$trackId.tsx` here by
 * hand rather than by `to`.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { PRIMARY_NAV } from "./nav-model";

const ROUTE_FILE: Record<string, string> = {
  "/start": "src/routes/_authenticated.start.tsx",
  "/inbox": "src/routes/_authenticated.inbox.tsx",
  "/evidence": "src/routes/_authenticated.evidence.tsx",
  "/track": "src/routes/_authenticated.track.$trackId.tsx",
  "/outcomes": "src/routes/_authenticated.outcomes.tsx",
  "/team": "src/routes/_authenticated.team.tsx",
  "/threads": "src/routes/_authenticated.threads.tsx",
  "/sources": "src/routes/_authenticated.sources.tsx",
  "/settings": "src/routes/_authenticated.settings.tsx",
};

function titleOf(routeFile: string): string {
  const src = readFileSync(routeFile, "utf8");
  const match = src.match(/title:\s*"([^"]+)"\s*\}\]\s*\}\)/);
  expect(match).not.toBeNull();
  return match![1]!;
}

describe("every door's title is its word", () => {
  it("maps a route file for every PRIMARY_NAV door, so none is silently skipped", () => {
    expect(PRIMARY_NAV.length).toBeGreaterThan(0);
    for (const door of PRIMARY_NAV) expect(ROUTE_FILE[door.to]).toBeDefined();
  });

  for (const door of PRIMARY_NAV) {
    it(`${door.to}'s <title> reads "${door.label} · Supaprod"`, () => {
      expect(titleOf(ROUTE_FILE[door.to]!)).toBe(`${door.label} · Supaprod`);
    });
  }
});
