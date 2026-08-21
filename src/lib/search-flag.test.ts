import { describe, expect, it } from "bun:test";
import { searchFlag } from "./search-flag";

describe("searchFlag", () => {
  it("accepts every shape a URL flag arrives in", () => {
    // THE NUMBER AND THE BOOLEAN ARE THE ONES THAT MATTER. TanStack Router
    // JSON-parses each search value before a validator runs, so `?capture=1`
    // arrives as 1 and `?capture=true` as true. The string forms are here
    // because an in-app `navigate({ search: { capture: "1" } })` passes the
    // string straight through, and `PaletteRun.search` is typed
    // `Record<string, string>`, so the palette cannot send anything else.
    for (const shape of [true, 1, "1", "true"]) {
      expect(searchFlag(shape)).toBe(true);
    }
  });

  it("rejects everything else, and returns undefined rather than false", () => {
    // `undefined` is the value that DROPS OUT of the URL. Returning `false`
    // would leave `?capture=false` sitting in the address bar claiming to be a
    // decision somebody made.
    for (const shape of [undefined, null, false, 0, "", "0", "false", "yes", {}, []]) {
      expect(searchFlag(shape)).toBeUndefined();
    }
  });
});
