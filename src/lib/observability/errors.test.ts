import { describe, it, expect, beforeEach } from "bun:test";
import { recordErrorEvent, resetErrorStormGuardForTests } from "./errors";

/** Minimal fake of the narrow ErrorEventsClient surface recordErrorEvent uses. */
function fakeClient(behavior: "ok" | "db-error" | "throw" = "ok") {
  const inserted: Record<string, unknown>[] = [];
  return {
    inserted,
    from(_table: string) {
      return {
        insert(values: Record<string, unknown>) {
          if (behavior === "throw") throw new Error("connection refused");
          inserted.push(values);
          return Promise.resolve({
            error: behavior === "db-error" ? { message: "permission denied" } : null,
          });
        },
      };
    },
  };
}

describe("recordErrorEvent (SW-6 in-house failure floor)", () => {
  beforeEach(() => {
    resetErrorStormGuardForTests();
  });

  it("persists an Error with its kind, message, stack, and context", async () => {
    const client = fakeClient();
    const err = new TypeError("boom on the way down");
    const ok = await recordErrorEvent(
      err,
      { surface: "ssr", request_path: "/today", request_method: "GET" },
      { client },
    );
    expect(ok).toBe(true);
    expect(client.inserted).toHaveLength(1);
    const row = client.inserted[0];
    expect(row.surface).toBe("ssr");
    expect(row.error_kind).toBe("TypeError");
    expect(row.error_message).toBe("boom on the way down");
    expect(row.request_path).toBe("/today");
    expect(row.request_method).toBe("GET");
    expect(typeof row.stack).toBe("string");
  });

  it("wraps non-Error throwables so nothing is lost", async () => {
    const client = fakeClient();
    const ok = await recordErrorEvent("plain string failure", {}, { client });
    expect(ok).toBe(true);
    expect(client.inserted[0].error_message).toBe("plain string failure");
    expect(client.inserted[0].surface).toBe("unknown");
  });

  it("caps oversized messages, stacks, and paths at write time", async () => {
    const client = fakeClient();
    const err = new Error("x".repeat(10_000));
    err.stack = "y".repeat(50_000);
    await recordErrorEvent(err, { request_path: "/p".repeat(2_000) }, { client });
    const row = client.inserted[0];
    expect((row.error_message as string).length).toBeLessThanOrEqual(2_000);
    expect((row.stack as string).length).toBeLessThanOrEqual(8_000);
    expect((row.request_path as string).length).toBeLessThanOrEqual(500);
  });

  it("returns false (never throws) when the insert reports a DB error", async () => {
    const client = fakeClient("db-error");
    const ok = await recordErrorEvent(new Error("boom"), {}, { client });
    expect(ok).toBe(false);
  });

  it("returns false (never throws) when the client itself throws", async () => {
    const client = fakeClient("throw");
    const ok = await recordErrorEvent(new Error("boom"), {}, { client });
    expect(ok).toBe(false);
  });

  it("storm guard: stops writing after the per-minute cap so an error loop cannot amplify", async () => {
    const client = fakeClient();
    let accepted = 0;
    for (let i = 0; i < 60; i++) {
      if (await recordErrorEvent(new Error(`e${i}`), {}, { client })) accepted += 1;
    }
    expect(accepted).toBe(40);
    expect(client.inserted).toHaveLength(40);
  });
});
