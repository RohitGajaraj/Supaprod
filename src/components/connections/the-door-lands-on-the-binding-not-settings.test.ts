/**
 * P-44 (A-QUEUE.md). "Finish it in Settings" pointed at the account list
 * (`/settings?section=connections`), and `AccountConnectionsSection`'s own
 * header names where a binding is actually changed: `/sync`. This pins the
 * door at its corrected target, with the run's own product carried along so
 * it lands preselected rather than on whatever the switcher shows.
 */
import { describe, expect, it } from "bun:test";

import { bindingDoorTarget } from "./AskInPlace";

describe("the connected-but-unbound door", () => {
  it("lands on the binding surface, not the account list", () => {
    expect(bindingDoorTarget(null).to).toBe("/sync");
  });

  it("carries the run's product so it is preselected there", () => {
    expect(bindingDoorTarget("prod-relay")).toEqual({
      to: "/sync",
      search: { product: "prod-relay" },
    });
  });

  it("omits the param rather than guessing when the caller has no product", () => {
    expect(bindingDoorTarget(null)).toEqual({ to: "/sync", search: {} });
    expect(bindingDoorTarget(undefined)).toEqual({ to: "/sync", search: {} });
  });
});
