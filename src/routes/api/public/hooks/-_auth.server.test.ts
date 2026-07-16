import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";

/**
 * Hook-caller auth guard tests — security-critical gate for 35+ cron/webhook endpoints.
 *
 * These tests verify that:
 *  - Privileged endpoints reject unauthenticated calls
 *  - Header parsing (x-cron-key vs Bearer) works correctly
 *  - Timing-safe comparison prevents secret-length inference attacks
 *  - Multi-secret fallback (env + Supabase RPC) works as designed
 *  - Transient auth lookup errors don't break the gate
 */

// Mock the Supabase client before importing the auth guard
const mockSupabaseAdmin = {
  rpc: async (name: string) => {
    // Default: RPC call fails, so we only use env secrets
    return { data: null, error: new Error("RPC not mocked for this test") };
  },
};

mock.module("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

// Now import after mocking
const { requireHookCaller } = await import("./-_auth.server");

describe("requireHookCaller: privileged-access auth guard", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-1";
    process.env.HOOK_CRON_SECRET = "test-secret-2";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.HOOK_CRON_SECRET;
  });

  describe("successful authentication (returns null)", () => {
    it("accepts x-cron-key header with valid env secret", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "test-secret-1" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("accepts Bearer token with valid env secret", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "Bearer test-secret-2" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("prefers x-cron-key over Bearer when both present", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: {
          "x-cron-key": "test-secret-1",
          authorization: "Bearer wrong-secret",
        },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("accepts Bearer token with Bearer prefix case-insensitive", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "bearer test-secret-1" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("trims whitespace from x-cron-key", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "  test-secret-1  " },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("trims whitespace from Bearer token", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "Bearer   test-secret-2   " },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });
  });

  describe("authentication failure (returns 401)", () => {
    it("rejects request with no auth header", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: {},
      });

      const response = await requireHookCaller(request);
      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);
      const body = await response!.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("rejects request with incorrect x-cron-key", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "wrong-secret" },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("rejects request with incorrect Bearer token", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("rejects malformed Bearer token (no space)", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "Bearertest-secret-1" },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("rejects empty x-cron-key", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "" },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("rejects whitespace-only x-cron-key", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "   " },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });
  });

  describe("header precedence and parsing", () => {
    it("x-cron-key takes precedence even if Bearer is present", async () => {
      // This ensures if both are present, we use x-cron-key; if it's wrong, we don't fall back to Bearer
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: {
          "x-cron-key": "wrong-secret",
          authorization: "Bearer test-secret-1",
        },
      });

      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("falls back to Bearer if x-cron-key is missing", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { authorization: "Bearer test-secret-2" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("handles empty x-cron-key by falling back to Bearer", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: {
          "x-cron-key": "",
          authorization: "Bearer test-secret-1",
        },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });
  });

  describe("timing-safe comparison (prevents length-inference attacks)", () => {
    it("compares secrets without early-exit on length mismatch", async () => {
      // timingSafeEqual throws on buffer length mismatch; the guard should handle this gracefully
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "short" },
      });

      // Should not throw; should return 401 instead
      const response = await requireHookCaller(request);
      expect(response?.status).toBe(401);
    });

    it("accepts exact-length match and rejects near-match", async () => {
      const validSecret = "test-secret-1";
      const almostValid = "test-secret-1x"; // one char longer

      const request1 = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": validSecret },
      });

      const request2 = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": almostValid },
      });

      expect(await requireHookCaller(request1)).toBeNull();
      expect((await requireHookCaller(request2))?.status).toBe(401);
    });
  });

  describe("multi-secret support (env + Supabase RPC fallback)", () => {
    it("tries CRON_SECRET first, then HOOK_CRON_SECRET", async () => {
      // Only HOOK_CRON_SECRET is set to a valid value
      process.env.CRON_SECRET = "invalid-1";
      process.env.HOOK_CRON_SECRET = "valid-secret";

      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "valid-secret" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("handles when only one env secret is configured", async () => {
      process.env.CRON_SECRET = "only-secret";
      delete process.env.HOOK_CRON_SECRET;

      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "only-secret" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });

    it("filters out empty/whitespace-only env secrets", async () => {
      process.env.CRON_SECRET = "   ";
      process.env.HOOK_CRON_SECRET = "real-secret";

      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "real-secret" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });
  });

  describe("response format", () => {
    it("returns JSON response with Content-Type header", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "wrong" },
      });

      const response = await requireHookCaller(request);
      expect(response?.headers.get("Content-Type")).toBe("application/json");
      const body = await response?.json();
      expect(body).toHaveProperty("ok");
      expect(body).toHaveProperty("error");
    });

    it("returns 401 response with ok: false", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "wrong" },
      });

      const response = await requireHookCaller(request);
      const body = await response!.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("Unauthorized");
    });

    it("returns null on success (null is the success signal)", async () => {
      const request = new Request("http://localhost/api/public/hooks/eval-tick", {
        method: "POST",
        headers: { "x-cron-key": "test-secret-1" },
      });

      const response = await requireHookCaller(request);
      expect(response).toBeNull();
    });
  });
});

describe("requireHookCaller: edge cases and robustness", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("handles undefined authorization header safely", async () => {
    const request = new Request("http://localhost/api/public/hooks/eval-tick", {
      method: "POST",
      headers: { "x-cron-key": "test-secret" },
    });

    // authorization header is not set; the code does `request.headers.get("authorization") || ""`
    // This should not throw and should return null (success via x-cron-key)
    const response = await requireHookCaller(request);
    expect(response).toBeNull();
  });

  it("handles Bearer header without a token after space", async () => {
    const request = new Request("http://localhost/api/public/hooks/eval-tick", {
      method: "POST",
      headers: { authorization: "Bearer " },
    });

    // After replace and trim, this becomes an empty string
    const response = await requireHookCaller(request);
    expect(response?.status).toBe(401);
  });

  it("rejects x-cron-key with embedded nulls (if ever passed)", async () => {
    // This is a defense-in-depth test: if someone tries to bypass timing-safe comparison
    // by embedding null bytes, the guard should still reject (timingSafeEqual on different lengths)
    const request = new Request("http://localhost/api/public/hooks/eval-tick", {
      method: "POST",
      headers: { "x-cron-key": "test-secret\x00extra" },
    });

    const response = await requireHookCaller(request);
    expect(response?.status).toBe(401);
  });
});
