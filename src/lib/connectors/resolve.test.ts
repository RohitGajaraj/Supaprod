import { expect, test, describe } from "bun:test";
import { bindingConnectionAllowed } from "./resolve.server";

// KI-34: before resolveProviderAuth materializes the credential of a connection
// referenced by a workspace binding, it verifies the connection's owner is a
// member of the binding's workspace. This pure decision encodes the policy:
// fail CLOSED — only an affirmatively confirmed member is allowed; a lookup
// error is treated the same as "not a member" (RF-08 fix, 2026-07-02).
describe("KI-34: bindingConnectionAllowed (cross-tenant credential guard)", () => {
  test("allows when the connection owner is a member of the binding's workspace", () => {
    expect(bindingConnectionAllowed({ errored: false, isMember: true })).toBe(true);
  });

  test("BLOCKS when the owner is definitively NOT a member (the cross-tenant attack)", () => {
    expect(bindingConnectionAllowed({ errored: false, isMember: false })).toBe(false);
  });

  test("fails CLOSED on a lookup error (a transient failure must never materialize a cross-tenant credential)", () => {
    expect(bindingConnectionAllowed({ errored: true, isMember: false })).toBe(false);
    expect(bindingConnectionAllowed({ errored: true, isMember: true })).toBe(false);
  });
});
