// The one rule that keeps the room reachable: a readable link is only built
// when BOTH slugs exist. Anything less falls back to the legacy /m/<uuid>
// shape, which is why no row can end up with no URL at all.
import { describe, test, expect } from "bun:test";
import { isUuid, roomLinkFor, ROOM_PRODUCT_ROUTE_IDS, ROOM_ROUTE_IDS } from "./room-url";

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
  // The room is identified by route id everywhere, so both URLs must be listed
  // or a guard (the AppShell bypass, the GlobalComposer stand-down) goes half
  // blind the moment traffic arrives on the other one.
  test("both product URLs count as the room", () => {
    expect([...ROOM_PRODUCT_ROUTE_IDS]).toEqual([
      "/_authenticated/$workspaceSlug/$productSlug",
      "/_authenticated/m/$productId",
    ]);
    expect(ROOM_ROUTE_IDS).toContain("/_authenticated/m/");
  });
});
