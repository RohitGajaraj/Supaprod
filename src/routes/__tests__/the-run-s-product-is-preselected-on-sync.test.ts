/**
 * P-44 (A-QUEUE.md). `/sources?product=<id>` -- the corrected target of the
 * "Finish it on Sync" door (`AskInPlace.bindingDoorTarget`) -- has to land
 * with that product actually selected, not just carried in the URL.
 *
 * Both functions are pulled out of the route file itself and tested
 * directly: this repo has no working precedent for mounting a full
 * TanStack Router route in a test (`shouldClaimComposerFocus`,
 * `measuredQueryFn` are the established substitute).
 */
import { describe, expect, it } from "bun:test";

import { parseSyncSearch, productToPreselect } from "../_authenticated.sources";

describe("the deep-link search", () => {
  it("carries a product alongside the existing conflict param", () => {
    expect(parseSyncSearch({ product: "prod-relay" })).toEqual({ product: "prod-relay" });
    expect(parseSyncSearch({ conflict: "map-1", product: "prod-relay" })).toEqual({
      conflict: "map-1",
      product: "prod-relay",
    });
  });

  it("drops an empty or non-string product rather than carrying a lie", () => {
    expect(parseSyncSearch({ product: "" })).toEqual({});
    expect(parseSyncSearch({ product: 42 })).toEqual({});
    expect(parseSyncSearch({})).toEqual({});
  });
});

describe("whether to preselect the product a door named", () => {
  it("selects it when it is a real product and not already active", () => {
    expect(productToPreselect("prod-relay", "prod-other", ["prod-relay", "prod-other"])).toBe(
      "prod-relay",
    );
  });

  it("does nothing when no product was named", () => {
    expect(productToPreselect(undefined, "prod-other", ["prod-relay", "prod-other"])).toBeNull();
  });

  it("does nothing when it already matches the active product", () => {
    expect(productToPreselect("prod-relay", "prod-relay", ["prod-relay"])).toBeNull();
  });

  it("refuses a product this workspace does not list, rather than switching to an id nothing below can resolve", () => {
    expect(productToPreselect("prod-stale", "prod-other", ["prod-relay", "prod-other"])).toBeNull();
  });
});
