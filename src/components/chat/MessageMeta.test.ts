import { describe, it, expect } from "bun:test";
import {
  parseChatMeta,
  formatCost,
  domainOf,
  fmtTokens,
  safeSourceUrl,
  safeSourceHref,
  pickFeedbackId,
} from "./MessageMeta";

describe("MessageMeta", () => {
  describe("parseChatMeta", () => {
    it("should reject null/undefined input", () => {
      expect(parseChatMeta(null)).toBeNull();
      expect(parseChatMeta(undefined)).toBeNull();
    });

    it("should reject non-object input", () => {
      expect(parseChatMeta("string")).toBeNull();
      expect(parseChatMeta(123)).toBeNull();
      expect(parseChatMeta(true)).toBeNull();
    });

    it("should reject objects without required fields", () => {
      expect(parseChatMeta({})).toBeNull();
      expect(parseChatMeta({ model: "gpt-4" })).toBeNull(); // missing via
      expect(parseChatMeta({ via: "gateway" })).toBeNull(); // missing model
    });

    it("should reject invalid via values", () => {
      expect(parseChatMeta({ model: "gpt-4", via: "invalid" })).toBeNull();
      expect(parseChatMeta({ model: "gpt-4", via: "hybrid" })).toBeNull();
    });

    it("should parse minimal valid metadata", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
      });
      expect(result).not.toBeNull();
      expect(result?.model).toBe("gpt-4");
      expect(result?.via).toBe("gateway");
      expect(result?.sources).toEqual([]);
      expect(result?.web_used).toBe(false);
      expect(result?.workspace_chunks).toBe(0);
    });

    it("should default numeric fields to 0 for non-numeric values", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        latency_ms: "not a number",
        tokens_in: null,
        tokens_out: undefined,
        cost_usd: Infinity,
        workspace_chunks: NaN,
      });
      expect(result?.latency_ms).toBe(0);
      expect(result?.tokens_in).toBe(0);
      expect(result?.tokens_out).toBe(0);
      expect(result?.cost_usd).toBe(0);
      expect(result?.workspace_chunks).toBe(0);
    });

    it("should accept negative finite numbers (no validation of sign)", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        workspace_chunks: -1,
        latency_ms: -500,
      });
      expect(result?.workspace_chunks).toBe(-1);
      expect(result?.latency_ms).toBe(-500);
    });

    it("should parse finite positive numeric fields", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "byo",
        latency_ms: 1234.5,
        tokens_in: 567,
        tokens_out: 890,
        cost_usd: 0.0123,
        workspace_chunks: 5,
      });
      expect(result?.latency_ms).toBe(1234.5);
      expect(result?.tokens_in).toBe(567);
      expect(result?.tokens_out).toBe(890);
      expect(result?.cost_usd).toBe(0.0123);
      expect(result?.workspace_chunks).toBe(5);
    });

    it("should parse web_used boolean", () => {
      expect(parseChatMeta({ model: "gpt-4", via: "gateway", web_used: true })?.web_used).toBe(
        true,
      );
      expect(parseChatMeta({ model: "gpt-4", via: "gateway", web_used: false })?.web_used).toBe(
        false,
      );
      expect(parseChatMeta({ model: "gpt-4", via: "gateway", web_used: "yes" })?.web_used).toBe(
        false,
      );
    });

    it("should parse sources array with valid entries", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        sources: [
          {
            n: 1,
            kind: "web",
            title: "Example.com",
            url: "https://example.com",
            sub: "example.com",
          },
          {
            n: 2,
            kind: "doc",
            title: "My Document",
            href: "/docs/123",
          },
        ],
      });
      expect(result?.sources).toHaveLength(2);
      expect(result?.sources[0]).toEqual({
        n: 1,
        kind: "web",
        title: "Example.com",
        url: "https://example.com",
        href: undefined,
        sub: "example.com",
      });
      expect(result?.sources[1]).toEqual({
        n: 2,
        kind: "doc",
        title: "My Document",
        url: undefined,
        href: "/docs/123",
        sub: undefined,
      });
    });

    it("should filter out invalid source entries", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        sources: [
          null,
          undefined,
          { n: 1 }, // no url/href/title
          { title: "Valid", url: "https://example.com" },
          "not an object",
        ],
      });
      expect(result?.sources).toHaveLength(1);
      expect(result?.sources[0].title).toBe("Valid");
    });

    it("should default source.n to index + 1", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        sources: [
          { title: "First", url: "https://first.com" },
          { title: "Second", url: "https://second.com" },
          { n: 99, title: "Third", url: "https://third.com" },
        ],
      });
      expect(result?.sources[0].n).toBe(1);
      expect(result?.sources[1].n).toBe(2);
      expect(result?.sources[2].n).toBe(99);
    });

    it("should map unknown source.kind to 'web'", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        sources: [
          { title: "Unknown", url: "https://unknown.com", kind: "unknown-type" },
          { title: "Valid", url: "https://valid.com", kind: "prd" },
        ],
      });
      expect(result?.sources[0].kind).toBe("web");
      expect(result?.sources[1].kind).toBe("prd");
    });

    it("should validate all SourceKind values", () => {
      const validKinds = [
        "web",
        "signal",
        "prd",
        "doc",
        "meeting",
        "opportunity",
        "roadmap",
        "decision",
        "mission",
        "finding",
      ];
      for (const kind of validKinds) {
        const result = parseChatMeta({
          model: "gpt-4",
          via: "gateway",
          sources: [{ title: "Test", url: "https://test.com", kind }],
        });
        expect(result?.sources[0].kind).toBe(kind);
      }
    });

    it("should parse research metadata", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        research: {
          mode: "web",
          sub_queries: ["query 1", "query 2", null, 123, "query 3"],
        },
      });
      expect(result?.research).toEqual({
        mode: "web",
        sub_queries: ["query 1", "query 2", "query 3"],
      });
    });

    it("should reject invalid research.mode", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        research: { mode: "invalid", sub_queries: [] },
      });
      expect(result?.research).toBeUndefined();
    });

    it("should validate all research modes", () => {
      const validModes = ["chat", "web", "internal", "both"];
      for (const mode of validModes) {
        const result = parseChatMeta({
          model: "gpt-4",
          via: "gateway",
          research: { mode, sub_queries: [] },
        });
        expect(result?.research?.mode).toBe(mode);
      }
    });

    it("should parse judge score (0-100, rounded)", () => {
      const result = parseChatMeta({
        model: "gpt-4",
        via: "gateway",
        judge: 87.6,
      });
      expect(result?.judge).toBe(88);
    });

    it("should reject non-finite judge values", () => {
      expect(
        parseChatMeta({ model: "gpt-4", via: "gateway", judge: Infinity })?.judge,
      ).toBeUndefined();
      expect(parseChatMeta({ model: "gpt-4", via: "gateway", judge: NaN })?.judge).toBeUndefined();
      expect(parseChatMeta({ model: "gpt-4", via: "gateway", judge: "87" })?.judge).toBeUndefined();
    });

    it("should parse full realistic metadata payload", () => {
      const payload = {
        model: "claude-3-5-sonnet",
        via: "gateway",
        latency_ms: 2345,
        tokens_in: 1234,
        tokens_out: 567,
        cost_usd: 0.0456,
        sources: [
          { n: 1, kind: "web", title: "Prisma", url: "https://prisma.io", sub: "prisma.io" },
          { n: 2, kind: "doc", title: "Our Docs", href: "/docs/api", sub: "Internal" },
        ],
        web_used: true,
        workspace_chunks: 3,
        research: {
          mode: "both",
          sub_queries: ["ORMs", "database abstraction"],
        },
        judge: 92,
      };
      const result = parseChatMeta(payload);
      expect(result).not.toBeNull();
      expect(result?.model).toBe("claude-3-5-sonnet");
      expect(result?.judge).toBe(92);
      expect(result?.sources).toHaveLength(2);
      expect(result?.research?.mode).toBe("both");
    });
  });

  describe("formatCost", () => {
    it("should format costs < $0.01 to 4 decimals", () => {
      expect(formatCost(0)).toBe("$0.0000");
      expect(formatCost(0.001)).toBe("$0.0010");
      expect(formatCost(0.0099)).toBe("$0.0099");
    });

    it("should format costs >= $0.01 to 2 decimals", () => {
      expect(formatCost(0.01)).toBe("$0.01");
      expect(formatCost(0.1)).toBe("$0.10");
      expect(formatCost(1.234)).toBe("$1.23");
      expect(formatCost(99.999)).toBe("$100.00");
    });

    it("should handle large costs", () => {
      expect(formatCost(1000)).toBe("$1000.00");
      expect(formatCost(12345.6789)).toBe("$12345.68");
    });
  });

  describe("domainOf", () => {
    it("should extract hostname from valid URLs", () => {
      expect(domainOf("https://example.com/path")).toBe("example.com");
      expect(domainOf("https://api.github.com")).toBe("api.github.com");
    });

    it("should strip www prefix", () => {
      expect(domainOf("https://www.example.com")).toBe("example.com");
      expect(domainOf("https://www.github.com/user")).toBe("github.com");
    });

    it("should handle edge cases", () => {
      expect(domainOf("invalid-url")).toBe("invalid-url");
      expect(domainOf("not-a-url")).toBe("not-a-url");
    });

    it("should handle URLs with ports", () => {
      expect(domainOf("https://localhost:3000")).toBe("localhost");
      expect(domainOf("https://example.com:8080/path")).toBe("example.com");
    });
  });

  describe("fmtTokens", () => {
    it("should return plain number for values < 1000", () => {
      expect(fmtTokens(0)).toBe("0");
      expect(fmtTokens(999)).toBe("999");
      expect(fmtTokens(500)).toBe("500");
    });

    it("should format values >= 1000 to 'k' notation", () => {
      expect(fmtTokens(1000)).toBe("1k");
      expect(fmtTokens(1500)).toBe("1.5k");
      expect(fmtTokens(1234)).toBe("1.2k");
      expect(fmtTokens(10000)).toBe("10k");
    });

    it("should strip trailing .0 for round thousands", () => {
      expect(fmtTokens(2000)).toBe("2k");
      expect(fmtTokens(5000)).toBe("5k");
      expect(fmtTokens(1000)).toBe("1k");
    });

    it("should handle edge cases", () => {
      expect(fmtTokens(999999)).toBe("1000k");
      expect(fmtTokens(1)).toBe("1");
    });
  });

  describe("safeSourceUrl", () => {
    it("should accept http/https URLs", () => {
      expect(safeSourceUrl("https://example.com")).toBe("https://example.com");
      expect(safeSourceUrl("http://example.com")).toBe("http://example.com");
      expect(safeSourceUrl("HTTPS://example.com")).toBe("HTTPS://example.com");
    });

    it("should reject javascript: protocol", () => {
      expect(safeSourceUrl("javascript:alert('xss')")).toBeUndefined();
    });

    it("should reject data: protocol", () => {
      expect(safeSourceUrl("data:text/html,<script>alert('xss')</script>")).toBeUndefined();
    });

    it("should reject protocol-relative URLs", () => {
      expect(safeSourceUrl("//example.com")).toBeUndefined();
    });

    it("should reject empty/undefined", () => {
      expect(safeSourceUrl(undefined)).toBeUndefined();
      expect(safeSourceUrl("")).toBeUndefined();
    });

    it("should reject ftp and other protocols", () => {
      expect(safeSourceUrl("ftp://example.com")).toBeUndefined();
      expect(safeSourceUrl("file:///etc/passwd")).toBeUndefined();
    });
  });

  describe("safeSourceHref", () => {
    it("should accept root-relative paths", () => {
      expect(safeSourceHref("/docs/123")).toBe("/docs/123");
      expect(safeSourceHref("/prds")).toBe("/prds");
      expect(safeSourceHref("/")).toBe("/");
    });

    it("should reject protocol-relative paths", () => {
      expect(safeSourceHref("//example.com")).toBeUndefined();
    });

    it("should reject absolute URLs", () => {
      expect(safeSourceHref("https://example.com")).toBeUndefined();
      expect(safeSourceHref("http://example.com")).toBeUndefined();
    });

    it("should reject relative paths starting without /", () => {
      expect(safeSourceHref("docs/123")).toBeUndefined();
      expect(safeSourceHref("./docs")).toBeUndefined();
      expect(safeSourceHref("../docs")).toBeUndefined();
    });

    it("should reject javascript: protocol", () => {
      expect(safeSourceHref("javascript:alert('xss')")).toBeUndefined();
    });

    it("should reject undefined/null", () => {
      expect(safeSourceHref(undefined)).toBeUndefined();
      expect(safeSourceHref("")).toBeUndefined();
    });
  });

  describe("pickFeedbackId", () => {
    it("should accept valid UUIDs", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(pickFeedbackId(uuid)).toBe(uuid);
    });

    it("should accept first valid UUID among candidates", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(pickFeedbackId(null, uuid, "invalid")).toBe(uuid);
      expect(pickFeedbackId("not-uuid", uuid)).toBe(uuid);
    });

    it("should reject non-UUID strings", () => {
      expect(pickFeedbackId("not-a-uuid")).toBeNull();
      expect(pickFeedbackId("123e4567-e89b-12d3-a456")).toBeNull();
      expect(pickFeedbackId("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")).toBeNull();
    });

    it("should reject null/undefined", () => {
      expect(pickFeedbackId(null)).toBeNull();
      expect(pickFeedbackId(undefined)).toBeNull();
      expect(pickFeedbackId(null, undefined)).toBeNull();
    });

    it("should be case-insensitive", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const upper = "123E4567-E89B-12D3-A456-426614174000";
      expect(pickFeedbackId(upper)).toBe(upper);
    });

    it("should return null if no UUID found in candidates", () => {
      expect(pickFeedbackId("not-uuid", null, "also-not")).toBeNull();
    });
  });
});
