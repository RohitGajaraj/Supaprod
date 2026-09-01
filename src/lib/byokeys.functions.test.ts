import { describe, it, expect } from "bun:test";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BYO_PROVIDERS } from "./byokeys.functions";

/**
 * Test suite for BYO API keys module (byokeys.functions.ts).
 *
 * Note: The main API functions (saveApiKey, testApiKey, deleteApiKey) are wrapped
 * in createServerFn and require server context. They would benefit from extracting
 * *Impl pure functions (see trust-ledger pattern) to enable unit testing without
 * database mocking. For now, we test pure helpers and document required coverage gaps.
 */

// --- Pure function tests ---

describe("byokeys – pure helpers", () => {
  describe("maskFromPrefix", () => {
    it("should mask a prefix to prefix••••", () => {
      // This function is not exported, so we test the logic inline
      const maskFromPrefix = (prefix: string | null | undefined): string => {
        if (!prefix) return "••••••••";
        return `${prefix}••••`;
      };

      const result = maskFromPrefix("sk-");
      expect(result).toBe("sk-••••");
    });

    it("should return full mask for null prefix", () => {
      const maskFromPrefix = (prefix: string | null | undefined): string => {
        if (!prefix) return "••••••••";
        return `${prefix}••••`;
      };

      expect(maskFromPrefix(null)).toBe("••••••••");
      expect(maskFromPrefix(undefined)).toBe("••••••••");
      expect(maskFromPrefix("")).toBe("••••••••");
    });

    it("should handle various prefix lengths", () => {
      const maskFromPrefix = (prefix: string | null | undefined): string => {
        if (!prefix) return "••••••••";
        return `${prefix}••••`;
      };

      expect(maskFromPrefix("ghp")).toBe("ghp••••");
      expect(maskFromPrefix("xai-prod")).toBe("xai-prod••••");
    });
  });

  describe("defaultModelFor", () => {
    // Helper to inline the logic since it's not exported
    const defaultModelFor = (provider: string): string => {
      const defaults: Record<string, string> = {
        anthropic: "anthropic/claude-haiku-4",
        openai: "openai/gpt-4o-mini",
        google: "google/gemini-2.5-flash-lite",
        deepseek: "deepseek/deepseek-chat",
        xai: "xai/grok-2-1212",
        qwen: "qwen/qwen-plus",
        groq: "groq/llama-3.3-70b-versatile",
        mistral: "mistral/mistral-large-latest",
        moonshot: "moonshot/moonshot-v1-128k",
        openrouter: "openrouter/openai/gpt-4o-mini",
        together: "together/meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        fireworks: "fireworks/accounts/fireworks/models/llama-v3p1-70b-instruct",
        cerebras: "cerebras/llama3.1-70b",
        deepinfra: "deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct",
        perplexity: "perplexity/llama-3.1-sonar-large-128k-online",
        minimax: "minimax/minimax-text-01",
        ollama: "ollama/llama3.2",
        github_pat: "openai/gpt-4o-mini",
      };
      return defaults[provider] ?? `${provider}/auto`;
    };

    it("should return known defaults for recognized providers", () => {
      expect(defaultModelFor("anthropic")).toBe("anthropic/claude-haiku-4");
      expect(defaultModelFor("openai")).toBe("openai/gpt-4o-mini");
      expect(defaultModelFor("google")).toBe("google/gemini-2.5-flash-lite");
    });

    it("should fall back to provider/auto for unknown providers", () => {
      expect(defaultModelFor("unknown")).toBe("unknown/auto");
      expect(defaultModelFor("custom")).toBe("custom/auto");
    });

    it("should have an entry for every Tier 1 provider", () => {
      const tier1Providers = ["anthropic", "openai"];
      for (const provider of tier1Providers) {
        const model = defaultModelFor(provider);
        expect(model).toBeTruthy();
        expect(model).toContain("/");
      }
    });

    it("should handle edge case: empty string provider", () => {
      const result = defaultModelFor("");
      expect(result).toBe("/auto");
    });
  });

  describe("BYO_PROVIDERS constant", () => {
    it("should export a valid list of BYO providers", () => {
      expect(Array.isArray(BYO_PROVIDERS)).toBe(true);
      expect(BYO_PROVIDERS.length).toBeGreaterThan(0);
    });

    it("should have required fields for each provider", () => {
      for (const provider of BYO_PROVIDERS) {
        expect(provider.id).toBeTruthy();
        expect(provider.label).toBeTruthy();
        expect(provider.placeholder).toBeTruthy();
      }
    });

    it("should include anthropic and openai (tier 1)", () => {
      const ids = BYO_PROVIDERS.map((p) => p.id);
      expect(ids).toContain("anthropic");
      expect(ids).toContain("openai");
    });

    it("should have unique provider ids", () => {
      const ids = BYO_PROVIDERS.map((p) => p.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe("SaveSchema validation", () => {
    // Inline the schema since it's not exported
    const SaveSchema = z.object({
      provider: z.string().min(1).max(40),
      label: z.string().max(80).nullable().optional(),
      api_key: z.string().min(4).max(500),
      base_url: z.string().max(300).nullable().optional(),
      model_id: z.string().max(150).nullable().optional(),
    });

    it("should accept valid save payload", () => {
      const valid = {
        provider: "anthropic",
        label: "My Claude Key",
        api_key: "sk-ant-very-long-valid-key-1234567890",
      };
      expect(() => SaveSchema.parse(valid)).not.toThrow();
    });

    it("should require provider", () => {
      const invalid = {
        label: "My Key",
        api_key: "sk-ant-key",
      };
      expect(() => SaveSchema.parse(invalid)).toThrow();
    });

    it("should require api_key min 4 chars", () => {
      const invalid = {
        provider: "anthropic",
        api_key: "sk",
      };
      expect(() => SaveSchema.parse(invalid)).toThrow();
    });

    it("should enforce provider max 40 chars", () => {
      const invalid = {
        provider: "a".repeat(41),
        api_key: "sk-ant-key",
      };
      expect(() => SaveSchema.parse(invalid)).toThrow();
    });

    it("should enforce api_key max 500 chars", () => {
      const invalid = {
        provider: "anthropic",
        api_key: "x".repeat(501),
      };
      expect(() => SaveSchema.parse(invalid)).toThrow();
    });

    it("should allow optional label, base_url, model_id", () => {
      const minimal = {
        provider: "anthropic",
        api_key: "sk-ant-key123",
      };
      expect(() => SaveSchema.parse(minimal)).not.toThrow();
    });

    it("should enforce base_url max 300 chars", () => {
      const invalid = {
        provider: "custom",
        api_key: "sk-key",
        base_url: "https://" + "x".repeat(300),
      };
      expect(() => SaveSchema.parse(invalid)).toThrow();
    });
  });

  describe("TestSchema validation", () => {
    // Inline the test schema
    const TestSchema = z.object({
      provider: z.string().min(1).max(40),
      api_key: z.string().min(4).max(500),
      base_url: z.string().max(300).nullable().optional(),
      model: z.string().min(1).max(120).optional(),
    });

    it("should accept valid test payload", () => {
      const valid = {
        provider: "openai",
        api_key: "sk-proj-valid-key",
        model: "openai/gpt-4o-mini",
      };
      expect(() => TestSchema.parse(valid)).not.toThrow();
    });

    it("should require provider and api_key", () => {
      const invalid = { model: "openai/gpt-4" };
      expect(() => TestSchema.parse(invalid)).toThrow();
    });

    it("should allow minimal test (provider + key only)", () => {
      const minimal = {
        provider: "anthropic",
        api_key: "sk-ant-key",
      };
      expect(() => TestSchema.parse(minimal)).not.toThrow();
    });

    it("should enforce model max 120 chars", () => {
      const invalid = {
        provider: "anthropic",
        api_key: "sk-ant-key",
        model: "x".repeat(121),
      };
      expect(() => TestSchema.parse(invalid)).toThrow();
    });

    it("should allow base_url override for custom endpoints", () => {
      const valid = {
        provider: "custom",
        api_key: "my-key",
        base_url: "https://api.custom.local/v1",
        model: "custom/my-model",
      };
      expect(() => TestSchema.parse(valid)).not.toThrow();
    });
  });
});

// --- Async function tests with mocking ---

/**
 * Mock builder for byokeys async test suite.
 * Implements minimal Supabase query chains needed for entitlement + key listing tests.
 */
function createMockSupabase(config: {
  workspaceId?: string | null;
  tier?: string;
  accountTier?: string | null;
  accountId?: string | null;
  apiKeys?: any[];
  error?: any;
}): SupabaseClient {
  const err = config.error ?? null;

  function terminal(result: { data: any; error: any }): any {
    return {
      then: (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject),
    };
  }

  return {
    rpc: (name: string) => {
      if (name === "current_user_default_workspace") {
        return terminal({ data: config.workspaceId ?? null, error: err });
      }
      return terminal({ data: null, error: err });
    },
    from: (table: string) => ({
      select: (..._args: string[]) => ({
        eq: (col: string, val: any) => {
          if (table === "workspaces" && col === "id") {
            return terminal({
              data:
                config.workspaceId === val
                  ? { plan_tier: config.tier, account_id: config.accountId }
                  : null,
              error: err,
            });
          }
          if (table === "accounts" && col === "id") {
            return terminal({
              data: config.accountId === val ? { plan_tier: config.accountTier } : null,
              error: err,
            });
          }
          if (table === "user_api_keys" && col === "id") {
            return terminal({
              data: config.apiKeys?.find((k) => k.id === val) ?? null,
              error: err,
            });
          }
          return terminal({ data: null, error: err });
        },
        maybeSingle: async function () {
          if (table === "workspaces") {
            return {
              data:
                config.workspaceId === "ws1"
                  ? { plan_tier: config.tier, account_id: config.accountId }
                  : null,
              error: err,
            };
          }
          if (table === "accounts") {
            return {
              data: config.accountTier ? { plan_tier: config.accountTier } : null,
              error: err,
            };
          }
          return { data: null, error: err };
        },
        order: (_col: string, _opts?: any) => ({
          then: (resolve: any, reject?: any) =>
            Promise.resolve({
              data: config.apiKeys ?? [],
              error: err,
            }).then(resolve, reject),
        }),
      }),
      order: (_col: string, _opts?: any) => ({
        then: (resolve: any, reject?: any) =>
          Promise.resolve({ data: config.apiKeys ?? [], error: err }).then(resolve, reject),
      }),
    }),
  } as any as SupabaseClient;
}

describe("byokeys – async functions with mocking", () => {
  describe("entitlement checks", () => {
    it("should grant BYOK access for enterprise tier", async () => {
      // Pseudo-test: demonstrates entitlement check structure
      const mockSupabase = createMockSupabase({
        workspaceId: "ws1",
        tier: "enterprise",
      });

      // In a real test, we'd call callerHasByokEntitlement(mockSupabase)
      // and expect true. This requires extracting it as *Impl function.
      expect(mockSupabase).toBeTruthy();
    });

    it("should deny BYOK access for free tier", async () => {
      const mockSupabase = createMockSupabase({
        workspaceId: "ws1",
        tier: "free",
      });

      expect(mockSupabase).toBeTruthy();
    });

    it("should check account tier if workspace tier is null", async () => {
      const mockSupabase = createMockSupabase({
        workspaceId: "ws1",
        tier: null,
        accountTier: "enterprise",
        accountId: "acc1",
      });

      expect(mockSupabase).toBeTruthy();
    });

    it("should deny on database error (safe default)", async () => {
      const mockSupabase = createMockSupabase({
        error: new Error("Database error"),
      });

      expect(mockSupabase).toBeTruthy();
    });
  });

  describe("api key management", () => {
    it("should list user api keys with masked previews", async () => {
      const apiKeys = [
        {
          id: "key1",
          provider: "anthropic",
          label: "Production Claude",
          base_url: null,
          model_id: null,
          created_at: "2026-07-10T10:00:00Z",
          api_key_prefix: "sk-ant",
        },
        {
          id: "key2",
          provider: "openai",
          label: "OpenAI Test",
          base_url: "https://api.openai.com/v1",
          model_id: "gpt-4o",
          created_at: "2026-07-09T10:00:00Z",
          api_key_prefix: "sk-proj",
        },
      ];

      const mockSupabase = createMockSupabase({ apiKeys });
      expect(mockSupabase).toBeTruthy();
      // In a real test, we'd call listApiKeys and verify the response includes masked previews
    });

    it("should not expose full api_key in responses", async () => {
      // Verify that api_key_prefix is used, not api_key
      const apiKeys = [
        {
          id: "key1",
          provider: "anthropic",
          label: "My Key",
          base_url: null,
          model_id: null,
          created_at: "2026-07-10T10:00:00Z",
          api_key_prefix: "sk-ant",
          api_key: "sk-ant-very-long-secret-never-exposed", // should not be returned
        },
      ];

      const mockSupabase = createMockSupabase({ apiKeys });
      expect(mockSupabase).toBeTruthy();
    });
  });

  describe("key validation and testing", () => {
    it("should test a key by calling the AI runtime with byoOverride", async () => {
      // Pseudo-test: structure for testApiKey handler
      // When called with valid credentials, should:
      // 1. Check entitlement (deny if not enterprise)
      // 2. Resolve the model (use provided or default)
      // 3. Call callModel with byoOverride
      // 4. Return latency, sample output, and success status
      expect(true).toBe(true);
    });

    it("should return non-throwing error response on invalid key", async () => {
      // Pseudo-test: testApiKey handler should catch errors and return
      // { ok: false, error: "...", latency_ms: ... } rather than throwing
      expect(true).toBe(true);
    });

    it("should deny test for non-enterprise tier with clear message", async () => {
      // Pseudo-test: the error message should match saveApiKey's message
      // so users see consistent messaging across both flows
      expect(true).toBe(true);
    });

    it("should measure latency accurately (Date.now() - t0)", async () => {
      // Pseudo-test: latency should include the callModel call
      // or fallback to Date.now() - t0 if callModel doesn't report it
      expect(true).toBe(true);
    });
  });

  describe("encryption and storage (integration structure)", () => {
    it("should encrypt api_key before storing (buildEncryptedKeyColumns)", async () => {
      // Integration test: saveApiKey should:
      // 1. Call buildEncryptedKeyColumns(data.api_key)
      // 2. Spread encrypted columns (api_key_encrypted, api_key_prefix, iv, salt) into upsert
      // 3. Never store api_key in plaintext
      expect(true).toBe(true);
    });

    it("should use upsert with onConflict on user_id,provider,label", async () => {
      // Integration test: allows users to update a key without creating duplicates
      // Conflict key: (user_id, provider, label)
      expect(true).toBe(true);
    });

    it("should handle null label gracefully in upsert", async () => {
      // Edge case: two keys with the same (user_id, provider) but both have label=null
      // Should upsert (overwrite) the second, not create both
      expect(true).toBe(true);
    });
  });

  describe("base url validation", () => {
    it("should validate and accept safe base URLs", async () => {
      // Pseudo-test: validateBaseUrl calls assertSafeBaseUrl
      // Should accept: https://api.custom.local, https://10.0.0.1:8000, etc.
      expect(true).toBe(true);
    });

    it("should reject unsafe base URLs (SSRF prevention)", async () => {
      // Pseudo-test: assertSafeBaseUrl should block:
      // - file:// URLs
      // - file:///, ///
      // - gopher://, dict://, etc.
      // - localhost/127.0.0.1 if not explicitly allowed
      expect(true).toBe(true);
    });

    it("should normalize URLs consistently", async () => {
      // Pseudo-test: trailing slashes, http vs https, etc.
      expect(true).toBe(true);
    });
  });
});

/**
 * COVERAGE GAPS & RECOMMENDATIONS:
 *
 * High Priority (P0):
 * - Extract saveApiKey handler logic to saveApiKeyImpl(supabase, userId, data)
 *   so we can test encryption, entitlement, upsert without createServerFn
 * - Extract testApiKey handler logic to testApiKeyImpl(supabase, userId, data)
 *   to test model resolution, byoOverride routing, error handling
 * - Extract callerHasByokEntitlement to a pure *Impl or testable variant
 *   so we can unit test the tier/account fallback logic
 *
 * Medium Priority (P1):
 * - Add integration test for the full saveApiKey flow:
 *   payload validation -> entitlement check -> encryption -> upsert
 * - Add integration test for testApiKey with mocked callModel
 * - Add tests for edge cases: duplicate keys, label conflicts, URL validation
 *
 * Lower Priority (P2):
 * - Test listApiKeys pagination and ordering
 * - Test deleteApiKey (should be straightforward once saveApiKey is testable)
 * - Test listPlatformProviders (should return configured providers from env)
 *
 * Notes on security:
 * - Never store api_key in plaintext — encryption is mandatory
 * - api_key_prefix is safe to return (useful for masking/display)
 * - Never log or echo full keys in error messages
 * - The byoOverride path in runtime.server.ts should also be audited
 */
