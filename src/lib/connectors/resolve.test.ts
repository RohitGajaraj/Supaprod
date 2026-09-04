import { expect, test, describe } from "bun:test";
import { bindingConnectionAllowed, bindingOrRetryWithAdmin } from "./resolve.server";

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

/*
 * P-122 (A-QUEUE.md): "with a workspace binding present, the retry's
 * resolved source is `binding`; a fixture where the binding read fails
 * under RLS still resolves the binding, never `env`." A person's own RLS
 * client could not see a `connection_bindings` row that genuinely exists
 * for their own workspace (an RLS gap, a stale client, a permissions
 * quirk); this asserts the fallback that makes that recoverable rather than
 * a silent fall-through to a weaker credential.
 */
describe("P-122: a binding read that comes back empty is retried with admin, not trusted as absence", () => {
  const FAKE_BINDING = {
    id: "b1",
    connection_id: "c1",
    resource_id: "owner/repo",
    resource_label: null,
    config: {},
    created_by: "u1",
  };
  const fakeUserClient = {} as never; // never dereferenced by bindingOrRetryWithAdmin itself

  test("a binding found on the first read is returned as-is -- no retry fires", async () => {
    let rereadCalls = 0;
    const result = await bindingOrRetryWithAdmin(fakeUserClient, FAKE_BINDING, async () => {
      rereadCalls++;
      return FAKE_BINDING;
    });
    expect(result).toBe(FAKE_BINDING);
    expect(rereadCalls).toBe(0);
  });

  test("an empty first read, with a userClient supplied, retries with admin and returns what admin finds", async () => {
    const result = await bindingOrRetryWithAdmin(fakeUserClient, undefined, async () => FAKE_BINDING);
    expect(result).toBe(FAKE_BINDING);
  });

  test("an empty read genuinely stays empty when admin ALSO finds nothing -- never invents a binding", async () => {
    const result = await bindingOrRetryWithAdmin(fakeUserClient, undefined, async () => undefined);
    expect(result).toBeUndefined();
  });

  test("no userClient at all (the tick's own shape) never retries -- it was already reading as admin", async () => {
    let rereadCalls = 0;
    const result = await bindingOrRetryWithAdmin(undefined, undefined, async () => {
      rereadCalls++;
      return FAKE_BINDING;
    });
    expect(result).toBeUndefined();
    expect(rereadCalls).toBe(0);
  });
});
