import { describe, it, expect } from "bun:test";
import {
  filterActiveDesignMemory,
  formatDesignMemoryContext,
  parseExtractedItems,
  isPublicHost,
  type DesignMemoryRow,
} from "./design-memory.functions";

function row(id: string, overrides: Partial<DesignMemoryRow> = {}): DesignMemoryRow {
  return {
    id,
    workspace_id: "ws-1",
    category: "token",
    title: `Entry ${id}`,
    content: `Content ${id}`,
    rationale: null,
    source_kind: "default",
    status: "approved",
    decided_by: null,
    decided_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterActiveDesignMemory", () => {
  it("returns all approved rows when there are no supersede edges", () => {
    const rows = [row("a"), row("b")];
    expect(filterActiveDesignMemory(rows, [])).toEqual(rows);
  });

  it("retires an entry superseded by an APPROVED replacement", () => {
    const oldRow = row("old");
    const newRow = row("new");
    const active = filterActiveDesignMemory(
      [oldRow, newRow],
      [{ parent_id: "new", child_id: "old" }],
    );
    expect(active.map((r) => r.id)).toEqual(["new"]);
  });

  it("does NOT retire an entry whose replacement is still pending (not in the approved set)", () => {
    // "new" is pending, so it is never in the approved-rows array passed in.
    const active = filterActiveDesignMemory([row("old")], [{ parent_id: "new", child_id: "old" }]);
    expect(active.map((r) => r.id)).toEqual(["old"]);
  });

  it("ignores edges that reference entries outside the approved set entirely", () => {
    const rows = [row("a"), row("b")];
    const active = filterActiveDesignMemory(rows, [{ parent_id: "x", child_id: "y" }]);
    expect(active).toEqual(rows);
  });
});

describe("formatDesignMemoryContext", () => {
  it("returns '' for an empty list (byte-identical prompt with no design memory)", () => {
    expect(formatDesignMemoryContext([])).toBe("");
  });

  it("groups entries by category and renders title: content bullets", () => {
    const block = formatDesignMemoryContext([
      row("a", { category: "token", title: "Accent color", content: "#F4A64A" }),
      row("b", { category: "pattern", title: "Button styles", content: "max 2" }),
      row("c", { category: "token", title: "Surface color", content: "#111" }),
    ]);
    expect(block).toContain("Workspace design language");
    expect(block).toContain("TOKEN:");
    expect(block).toContain("  - Accent color: #F4A64A");
    expect(block).toContain("  - Surface color: #111");
    expect(block).toContain("PATTERN:");
    expect(block).toContain("  - Button styles: max 2");
    // Category order follows DESIGN_MEMORY_CATEGORIES, not insertion order.
    expect(block.indexOf("TOKEN:")).toBeLessThan(block.indexOf("PATTERN:"));
  });
});

describe("parseExtractedItems", () => {
  it("returns [] for non-object / missing items", () => {
    expect(parseExtractedItems(null)).toEqual([]);
    expect(parseExtractedItems({})).toEqual([]);
    expect(parseExtractedItems({ items: "not an array" })).toEqual([]);
  });

  it("keeps only entries with a valid category, non-empty title, and non-empty content", () => {
    const items = parseExtractedItems({
      items: [
        { category: "token", title: "Accent", content: "#F4A64A", rationale: "brand refresh" },
        { category: "bogus-category", title: "X", content: "Y" },
        { category: "voice", title: "", content: "no title" },
        { category: "voice", title: "No content", content: "" },
        "not an object",
        { category: "pattern", title: "Button styles", content: "max 2" },
      ],
    });
    expect(items).toEqual([
      { category: "token", title: "Accent", content: "#F4A64A", rationale: "brand refresh" },
      { category: "pattern", title: "Button styles", content: "max 2", rationale: null },
    ]);
  });

  it("caps at MAX_EXTRACTED_ITEMS (12)", () => {
    const raw = Array.from({ length: 20 }, (_, i) => ({
      category: "token",
      title: `T${i}`,
      content: `C${i}`,
    }));
    expect(parseExtractedItems({ items: raw })).toHaveLength(12);
  });

  it("truncates overlong title/content/rationale", () => {
    const items = parseExtractedItems({
      items: [
        {
          category: "voice",
          title: "t".repeat(300),
          content: "c".repeat(2000),
          rationale: "r".repeat(1000),
        },
      ],
    });
    expect(items[0].title.length).toBe(200);
    expect(items[0].content.length).toBe(1000);
    expect(items[0].rationale?.length).toBe(500);
  });
});

describe("isPublicHost (SSRF guard for importDesignMemoryFromUrl)", () => {
  it("allows a public hostname", () => {
    expect(isPublicHost("example.com")).toBe(true);
    expect(isPublicHost(new URL("https://api.example.com/page").hostname)).toBe(true);
  });

  it("blocks localhost and loopback", () => {
    expect(isPublicHost("localhost")).toBe(false);
    expect(isPublicHost("127.0.0.1")).toBe(false);
    expect(isPublicHost(new URL("https://[::1]/").hostname)).toBe(false);
  });

  it("blocks private IPv4 ranges and cloud metadata", () => {
    for (const host of ["10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254"]) {
      expect(isPublicHost(host)).toBe(false);
    }
  });

  it("blocks internal-resolvable hostname suffixes", () => {
    for (const host of [
      "printer.local",
      "gateway.lan",
      "svc.internal",
      "metadata.google.internal",
    ]) {
      expect(isPublicHost(host)).toBe(false);
    }
  });

  it("blocks IPv4-mapped IPv6 literals that embed a private address", () => {
    // new URL(...).hostname normalizes these to hex form before isPublicHost ever sees them.
    expect(isPublicHost(new URL("https://[::ffff:127.0.0.1]/").hostname)).toBe(false);
    expect(isPublicHost(new URL("https://[::ffff:169.254.169.254]/").hostname)).toBe(false);
    expect(isPublicHost(new URL("https://[::ffff:10.0.0.1]/").hostname)).toBe(false);
  });

  it("allows an IPv4-mapped IPv6 literal that embeds a PUBLIC address", () => {
    expect(isPublicHost(new URL("https://[::ffff:8.8.8.8]/").hostname)).toBe(true);
  });
});
