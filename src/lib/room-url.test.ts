// The one rule that keeps the room reachable: a readable link is only built
// when BOTH slugs exist. Anything less falls back to the legacy /m/<uuid>
// shape, which is why no row can end up with no URL at all.
import { describe, test, expect } from "bun:test";
import {
  isUuid,
  roomLinkFor,
  ROOM_PRODUCT_ROUTE_IDS,
  ROOM_ROUTE_IDS,
  matchesRoom,
} from "./room-url";

const workspaces = [
  { id: "w-1", slug: "helio-labs" },
  { id: "w-2", slug: null },
];
const products = [
  { id: "p-1", workspace_id: "w-1", slug: "relay" },
  { id: "p-2", workspace_id: "w-1", slug: null },
  { id: "p-3", workspace_id: "w-2", slug: "atlas" },
];

describe("roomLinkFor", () => {
  test("builds the readable link when both slugs exist", () => {
    expect(roomLinkFor(workspaces, products, "p-1")).toEqual({
      workspaceSlug: "helio-labs",
      productSlug: "relay",
    });
  });

  test("falls back when the product has no slug", () => {
    expect(roomLinkFor(workspaces, products, "p-2")).toBe(null);
  });

  test("falls back when the workspace has no slug", () => {
    expect(roomLinkFor(workspaces, products, "p-3")).toBe(null);
  });

  test("falls back for a product this workspace does not hold", () => {
    expect(roomLinkFor(workspaces, products, "p-nope")).toBe(null);
  });
});

describe("isUuid", () => {
  test("recognises the legacy product id shape", () => {
    expect(isUuid("60000000-0000-4000-8000-0000000000a2")).toBe(true);
  });

  test("a slug is not a uuid", () => {
    expect(isUuid("relay")).toBe(false);
    expect(isUuid("helio-labs")).toBe(false);
  });
});

describe("room route ids", () => {
  /**
   * THIS LIST IS EMPTY NOW, AND THE ASSERTION IS INVERTED ON PURPOSE.
   *
   * It used to require both product URLs to be listed, so that the guards
   * keyed off them (the AppShell bypass, the GlobalComposer stand-down) could
   * not go half blind when traffic arrived on the other one. That was right
   * while the room was a live surface.
   *
   * The room is retired: all three of its routes are redirect stubs to /today,
   * because it is the one unported legacy surface and it carries its own
   * five-region shell in the retired --ink- tokens. An empty list is what makes
   * AppFrame wrap 100% of authenticated surfaces, and it is what un-blocks
   * AuthedNotFound, which could never fire for a two-segment URL while
   * /$workspaceSlug/$productSlug caught every unmatched one.
   *
   * So the test now holds the opposite invariant: nothing may re-enter this
   * list without the room being ported first, because anything in it renders
   * with no rail, no header and no spine strip.
   */
  test("is empty, because every room route is a redirect stub now", () => {
    expect([...ROOM_PRODUCT_ROUTE_IDS]).toEqual([]);
    expect([...ROOM_ROUTE_IDS]).toEqual([]);
  });

  test("matchesRoom answers false for the retired URLs rather than throwing", () => {
    // The helper still compiles and still runs against an empty list; callers
    // simply always take the non-room branch.
    expect(
      matchesRoom(ROOM_ROUTE_IDS, matchesRoom, ["/_authenticated/$workspaceSlug/$productSlug"]),
    ).toBe(false);
    expect(matchesRoom(ROOM_ROUTE_IDS, ["/_authenticated/m/$productId"])).toBe(false);
  });
});
