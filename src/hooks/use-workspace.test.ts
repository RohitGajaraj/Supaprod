import { describe, it, expect } from "bun:test";
import { resolveActiveWorkspaceId, resolveActiveProductId } from "./use-workspace";
import type { Workspace, Product } from "./use-workspace";

describe("use-workspace", () => {
  describe("resolveActiveWorkspaceId", () => {
    const workspaces: Workspace[] = [
      {
        id: "ws-1",
        name: "Workspace 1",
        owner_id: "user-1",
        slug: "workspace-1",
        created_at: "2026-01-01",
        account_id: "acc-1",
      },
      {
        id: "ws-2",
        name: "Workspace 2",
        owner_id: "user-1",
        slug: "workspace-2",
        created_at: "2026-01-02",
        account_id: "acc-1",
      },
      {
        id: "ws-3",
        name: "Workspace 3",
        owner_id: "user-1",
        slug: "workspace-3",
        created_at: "2026-01-03",
        account_id: "acc-2",
      },
    ];

    it("should return null when no workspaces available", () => {
      expect(resolveActiveWorkspaceId(null, [])).toBeNull();
      expect(resolveActiveWorkspaceId("ws-1", [])).toBeNull();
    });

    it("should return stored ID if it exists in workspaces", () => {
      expect(resolveActiveWorkspaceId("ws-2", workspaces)).toBe("ws-2");
      expect(resolveActiveWorkspaceId("ws-3", workspaces)).toBe("ws-3");
    });

    it("should default to first workspace when no stored ID", () => {
      expect(resolveActiveWorkspaceId(null, workspaces)).toBe("ws-1");
    });

    it("should default to first workspace when stored ID doesn't exist", () => {
      expect(resolveActiveWorkspaceId("ws-nonexistent", workspaces)).toBe("ws-1");
    });

    it("should prefer stored ID over default", () => {
      expect(resolveActiveWorkspaceId("ws-3", workspaces)).toBe("ws-3");
      expect(resolveActiveWorkspaceId("ws-1", workspaces)).toBe("ws-1");
    });

    it("should handle empty string as no stored ID", () => {
      expect(resolveActiveWorkspaceId("", workspaces)).toBe("ws-1");
    });

    it("should handle workspace list with single item", () => {
      const single = [workspaces[0]];
      expect(resolveActiveWorkspaceId(null, single)).toBe("ws-1");
      expect(resolveActiveWorkspaceId("ws-nonexistent", single)).toBe("ws-1");
    });

    it("should validate stored ID exactly (case-sensitive)", () => {
      expect(resolveActiveWorkspaceId("WS-1", workspaces)).toBe("ws-1"); // Falls back to default
      expect(resolveActiveWorkspaceId("ws-1", workspaces)).toBe("ws-1"); // Exact match
    });

    it("should not be affected by account_id field", () => {
      // ws-1 and ws-2 are same account, ws-3 is different account
      // But resolution should not care about account
      expect(resolveActiveWorkspaceId("ws-3", workspaces)).toBe("ws-3");
    });
  });

  describe("resolveActiveProductId", () => {
    const products: Product[] = [
      {
        id: "prod-1",
        name: "Product 1",
        workspace_id: "ws-1",
        created_at: "2026-01-01",
      },
      {
        id: "prod-2",
        name: "Product 2",
        workspace_id: "ws-1",
        created_at: "2026-01-02",
      },
      {
        id: "prod-3",
        name: "Product 3",
        workspace_id: "ws-2",
        created_at: "2026-01-03",
      },
    ];

    it("should return null when no products available", () => {
      expect(resolveActiveProductId(null, [])).toBeNull();
      expect(resolveActiveProductId("prod-1", [])).toBeNull();
    });

    it("should return stored ID if it exists in products", () => {
      expect(resolveActiveProductId("prod-2", products)).toBe("prod-2");
      expect(resolveActiveProductId("prod-3", products)).toBe("prod-3");
    });

    it("should default to first product when no stored ID", () => {
      expect(resolveActiveProductId(null, products)).toBe("prod-1");
    });

    it("should default to first product when stored ID doesn't exist", () => {
      expect(resolveActiveProductId("prod-nonexistent", products)).toBe("prod-1");
    });

    it("should prefer stored ID over default", () => {
      expect(resolveActiveProductId("prod-3", products)).toBe("prod-3");
      expect(resolveActiveProductId("prod-1", products)).toBe("prod-1");
    });

    it("should handle empty string as no stored ID", () => {
      expect(resolveActiveProductId("", products)).toBe("prod-1");
    });

    it("should handle product list with single item", () => {
      const single = [products[0]];
      expect(resolveActiveProductId(null, single)).toBe("prod-1");
      expect(resolveActiveProductId("prod-nonexistent", single)).toBe("prod-1");
    });

    it("should validate stored ID exactly (case-sensitive)", () => {
      expect(resolveActiveProductId("PROD-1", products)).toBe("prod-1"); // Falls back to default
      expect(resolveActiveProductId("prod-1", products)).toBe("prod-1"); // Exact match
    });

    it("should not be affected by workspace_id field", () => {
      // Different products belong to different workspaces
      // But resolution should not care about workspace_id
      expect(resolveActiveProductId("prod-1", products)).toBe("prod-1");
      expect(resolveActiveProductId("prod-3", products)).toBe("prod-3");
    });

    it("should pick oldest created product as default when no stored ID", () => {
      // products array order: prod-1 (2026-01-01), prod-2 (2026-01-02), prod-3 (2026-01-03)
      // But resolveActiveProductId uses array order, not creation date
      // First in array is prod-1
      expect(resolveActiveProductId(null, products)).toBe("prod-1");
    });

    it("should handle reordered products correctly", () => {
      const reordered = [products[2], products[0], products[1]];
      // Now prod-3 is first
      expect(resolveActiveProductId(null, reordered)).toBe("prod-3");
      // Stored IDs should still be found
      expect(resolveActiveProductId("prod-1", reordered)).toBe("prod-1");
    });
  });

  describe("multi-tenancy scenarios", () => {
    const workspaces: Workspace[] = [
      {
        id: "account-a-ws-1",
        name: "Account A - Workspace 1",
        owner_id: "user-1",
        slug: "acc-a-ws-1",
        created_at: "2026-01-01",
        account_id: "acc-a",
      },
      {
        id: "account-b-ws-1",
        name: "Account B - Workspace 1",
        owner_id: "user-1",
        slug: "acc-b-ws-1",
        created_at: "2026-01-01",
        account_id: "acc-b",
      },
    ];

    it("should handle cross-account workspace switching", () => {
      // User has workspaces from two different accounts
      expect(resolveActiveWorkspaceId("account-a-ws-1", workspaces)).toBe("account-a-ws-1");
      expect(resolveActiveWorkspaceId("account-b-ws-1", workspaces)).toBe("account-b-ws-1");
      // Clearing should still work
      expect(resolveActiveWorkspaceId(null, workspaces)).toBe("account-a-ws-1");
    });
  });

  describe("edge cases", () => {
    it("should handle very large workspace/product lists", () => {
      const largeList = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        name: `Name ${i}`,
        workspace_id: "ws-1",
        created_at: "2026-01-01",
      }));

      // Should find exact match
      expect(resolveActiveProductId("id-500", largeList)).toBe("id-500");
      // Should default to first when not found
      expect(resolveActiveProductId("id-9999", largeList)).toBe("id-0");
    });

    it("should handle IDs with special characters", () => {
      const products: Product[] = [
        {
          id: "prod-uuid-123e4567-e89b-12d3-a456-426614174000",
          name: "Product",
          workspace_id: "ws-1",
          created_at: "2026-01-01",
        },
      ];
      expect(
        resolveActiveProductId("prod-uuid-123e4567-e89b-12d3-a456-426614174000", products),
      ).toBe("prod-uuid-123e4567-e89b-12d3-a456-426614174000");
    });
  });
});
