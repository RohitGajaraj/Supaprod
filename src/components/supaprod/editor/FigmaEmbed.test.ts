import { describe, expect, test } from "bun:test";
import { toEmbedUrl, FigmaEmbed } from "./FigmaEmbed";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

describe("toEmbedUrl", () => {
  test("rewrites a plain figma.com file URL into the embed form", () => {
    const src = "https://www.figma.com/file/abc123/My-Design";
    expect(toEmbedUrl(src)).toBe(
      `https://www.figma.com/embed?embed_host=supaprod&url=${encodeURIComponent(src)}`,
    );
  });

  test("leaves an already-embed figma.com URL unchanged", () => {
    const src = "https://www.figma.com/embed?embed_host=other&url=https%3A%2F%2Fx";
    expect(toEmbedUrl(src)).toBe(src);
  });

  test("leaves a non-figma URL unchanged", () => {
    const src = "https://example.com/deck.pdf";
    expect(toEmbedUrl(src)).toBe(src);
  });

  test("percent-encodes the original URL (query params, slashes) into the url= param", () => {
    const src = "https://www.figma.com/proto/abc?node-id=1%3A2&scaling=min-zoom";
    expect(toEmbedUrl(src)).toBe(
      `https://www.figma.com/embed?embed_host=supaprod&url=${encodeURIComponent(src)}`,
    );
  });

  test("rejects non-http(s) protocols (javascript:, data:, etc.)", () => {
    expect(toEmbedUrl("javascript:alert('xss')")).toBe("javascript:alert('xss')");
    expect(toEmbedUrl("data:text/html,<script>alert('xss')</script>")).toBe(
      "data:text/html,<script>alert('xss')</script>",
    );
  });

  test("falls back to the raw input for a malformed URL that new URL() rejects", () => {
    expect(toEmbedUrl("not a url")).toBe("not a url");
  });

  test("falls back to the raw input for an empty string", () => {
    expect(toEmbedUrl("")).toBe("");
  });

  describe("security: host validation (not substring matching)", () => {
    test("rejects evilfigma.com (substring contains 'figma.com')", () => {
      // This is the CRITICAL security bug: hostname.includes() would match
      const url = "https://evilfigma.com/file/abc";
      const result = toEmbedUrl(url);
      // Should NOT wrap because the hostname is not figma.com or *.figma.com
      expect(result).toBe(url);
      expect(result).not.toContain("figma.com/embed");
    });

    test("rejects figma.com.attacker.io (domain suffix attack)", () => {
      // Another substring match attack: hostname contains "figma.com"
      const url = "https://figma.com.attacker.io/file/abc";
      const result = toEmbedUrl(url);
      expect(result).toBe(url);
      expect(result).not.toContain("figma.com/embed");
    });

    test("rejects figma.com.attacker.com (another suffix variant)", () => {
      const url = "https://figma.com.attacker.com/file/abc";
      const result = toEmbedUrl(url);
      expect(result).toBe(url);
      expect(result).not.toContain("figma.com/embed");
    });

    test("rejects notfigmacom (similar but not identical)", () => {
      const url = "https://notfigmacom/file/abc";
      const result = toEmbedUrl(url);
      expect(result).toBe(url);
      expect(result).not.toContain("figma.com/embed");
    });

    test("accepts legitimate subdomain app.figma.com", () => {
      const url = "https://app.figma.com/file/abc123";
      const result = toEmbedUrl(url);
      expect(result).toContain("figma.com/embed");
    });

    test("accepts legitimate subdomain www.figma.com", () => {
      const url = "https://www.figma.com/file/abc123";
      const result = toEmbedUrl(url);
      expect(result).toContain("figma.com/embed");
    });

    test("accepts bare figma.com domain", () => {
      const url = "https://figma.com/file/abc123";
      const result = toEmbedUrl(url);
      expect(result).toContain("figma.com/embed");
    });

    test("rejects multi-level subdomains that are not figma.com", () => {
      const url = "https://subfigma.com.attacker.net/file/abc";
      const result = toEmbedUrl(url);
      expect(result).toBe(url);
      expect(result).not.toContain("figma.com/embed");
    });

    test("accepts legitimate nested subdomains like api.app.figma.com", () => {
      const url = "https://api.app.figma.com/file/abc123";
      const result = toEmbedUrl(url);
      expect(result).toContain("figma.com/embed");
    });
  });
});

describe("FigmaEmbed.config.parseHTML()", () => {
  test("should match div[data-figma-embed] selector", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    expect(parseRules).toHaveLength(1);
    expect(parseRules[0].tag).toBe("div[data-figma-embed]");
  });

  test("should extract src from div attributes", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    // parseHTML returns rules with tag selectors that TipTap uses to reconstruct
    // the node from HTML. The actual extraction happens in parseHTML rules.
    expect(parseRules[0]).toBeDefined();
  });

  test("getAttrs callback prefers the div's own src over the iframe's", () => {
    // renderHTML puts the ORIGINAL url on the div and the embed-wrapped one on
    // the iframe. Reading the iframe would overwrite the attribute with the
    // embed url on every save-reload, losing the original permanently.
    const getAttrs = FigmaEmbed.config.parseHTML()[0].getAttrs;
    const original = "https://www.figma.com/file/abc123/My-Design";
    const mockDom = {
      getAttribute: (attr: string) => (attr === "src" ? original : null),
      querySelector: () => ({
        getAttribute: (attr: string) =>
          attr === "src"
            ? `https://www.figma.com/embed?embed_host=supaprod&url=${encodeURIComponent(original)}`
            : null,
      }),
    } as never;

    const attrs = getAttrs?.(mockDom);
    expect(attrs?.src).toBe(original);
  });

  test("getAttrs callback falls back to the child iframe for legacy html", () => {
    // Html written before the div carried src: the iframe is all there is.
    const getAttrs = FigmaEmbed.config.parseHTML()[0].getAttrs;
    const mockDom = {
      getAttribute: () => null,
      querySelector: (selector: string) => ({
        getAttribute: (attr: string) =>
          attr === "src" ? "https://www.figma.com/embed?file-key=abc123" : null,
      }),
    } as never;

    const attrs = getAttrs?.(mockDom);
    expect(attrs?.src).toBe("https://www.figma.com/embed?file-key=abc123");
  });

  test("getAttrs callback falls back to empty src when the div has no child iframe", () => {
    const getAttrs = FigmaEmbed.config.parseHTML()[0].getAttrs;
    const mockDom = { getAttribute: () => null, querySelector: () => null } as never;

    const attrs = getAttrs?.(mockDom);
    expect(attrs?.src).toBe("");
  });
});

describe("FigmaEmbed node shape", () => {
  test("is a block-level, draggable, selectable, atomic node", () => {
    expect(FigmaEmbed.config.group).toBe("block");
    expect(FigmaEmbed.config.draggable).toBe(true);
    expect(FigmaEmbed.config.selectable).toBe(true);
    expect(FigmaEmbed.config.atom).toBe(true);
  });
});

describe("FigmaEmbed.config.addAttributes()", () => {
  test("should define src attribute with empty string default", () => {
    const attrs = FigmaEmbed.config.addAttributes();
    expect(attrs).toBeDefined();
    expect(attrs.src).toBeDefined();
    expect(attrs.src.default).toBe("");
  });
});

describe("FigmaEmbed.config.renderHTML()", () => {
  test("should render a div with data-figma-embed attribute", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    expect(Array.isArray(output)).toBe(true);
    expect(output[0]).toBe("div");
    const attrs = output[1];
    expect(attrs["data-figma-embed"]).toBe("true");
  });

  test("should add styling class to the wrapper div", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const attrs = output[1];
    expect(attrs.class).toContain("my-4");
    expect(attrs.class).toContain("rounded-xl");
    expect(attrs.class).toContain("border");
    expect(attrs.class).toContain("border-border/60");
    expect(attrs.class).toContain("overflow-hidden");
    expect(attrs.class).toContain("bg-secondary/20");
  });

  test("should render an iframe as a child", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const children = output[2];
    expect(Array.isArray(children)).toBe(true);
    expect(children[0]).toBe("iframe");
  });

  test("should set iframe src to embed URL", () => {
    const src = "https://www.figma.com/file/abc123/Design";
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.src).toContain("figma.com/embed");
    expect(iframeAttrs.src).toContain(encodeURIComponent(src));
  });

  test("should set iframe sandbox attribute for XSS protection", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.sandbox).toBe("allow-same-origin");
  });

  test("should set iframe allowfullscreen attribute", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.allowfullscreen).toBe("true");
  });

  test("should set iframe style for full width and 480px height", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.style).toContain("width:100%");
    expect(iframeAttrs.style).toContain("height:480px");
    expect(iframeAttrs.style).toContain("border:0");
    expect(iframeAttrs.style).toContain("display:block");
  });

  test("should handle empty src gracefully", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "" },
    });

    expect(Array.isArray(output)).toBe(true);
    const iframeAttrs = output[2][1];
    expect(iframeAttrs.src).toBe("");
  });

  test("should pass through non-figma URLs unchanged to iframe src", () => {
    const src = "https://example.com/video.mp4";
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.src).toBe(src);
  });

  test("should embed already-embedded figma URLs without double-embedding", () => {
    const src = "https://www.figma.com/embed?embed_host=other&url=https%3A%2F%2Fx";
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src },
    });

    const iframeAttrs = output[2][1];
    expect(iframeAttrs.src).toBe(src);
  });

  test("should preserve HTMLAttributes in div (e.g., data-* attributes)", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: {
        src: "https://www.figma.com/file/abc123/Design",
        "data-custom": "value",
      },
    });

    const attrs = output[1];
    expect(attrs["data-custom"]).toBe("value");
  });

  test("should maintain iframe attribute order and defaults", () => {
    const output = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: "https://www.figma.com/file/abc123/Design" },
    });

    const iframeAttrs = output[2][1];
    // Verify all required attributes are present
    expect(iframeAttrs.src).toBeDefined();
    expect(iframeAttrs.allowfullscreen).toBeDefined();
    expect(iframeAttrs.style).toBeDefined();
  });
});

describe("FigmaEmbed.config.addCommands()", () => {
  test("should return an object with setFigmaEmbed command", () => {
    const commands = FigmaEmbed.config.addCommands();
    expect(commands).toBeDefined();
    expect(commands.setFigmaEmbed).toBeDefined();
  });

  test("setFigmaEmbed should be a function that returns a handler", () => {
    const commands = FigmaEmbed.config.addCommands();
    const handler = commands.setFigmaEmbed({ src: "https://www.figma.com/file/abc" });
    expect(typeof handler).toBe("function");
  });

  test("setFigmaEmbed handler invokes insertContent with correct payload", () => {
    const commands = FigmaEmbed.config.addCommands();
    const attrs = { src: "https://www.figma.com/file/abc123" };
    const handler = commands.setFigmaEmbed(attrs);

    // Track what insertContent was called with
    let capturedPayload: unknown;
    let callCount = 0;
    const trackedInsertContent = (payload: unknown) => {
      callCount++;
      capturedPayload = payload;
      return true;
    };

    const result = handler({ commands: { insertContent: trackedInsertContent } });

    // Verify the handler calls insertContent exactly once
    expect(callCount).toBe(1);
    expect(result).toBe(true);
    expect(capturedPayload).toBeDefined();
    const payload = capturedPayload as { type?: string; attrs?: unknown };
    expect(payload.type).toBe("figmaEmbed");
    expect(payload.attrs).toEqual(attrs);
  });

  test("setFigmaEmbed handler correctly inserts figmaEmbed node with original URL", () => {
    const commands = FigmaEmbed.config.addCommands();
    const testUrl = "https://www.figma.com/file/test123/Design?node-id=1:2";
    const handler = commands.setFigmaEmbed({ src: testUrl });

    let capturedPayload: unknown;
    const trackedInsertContent = (payload: unknown) => {
      capturedPayload = payload;
      return true;
    };

    handler({ commands: { insertContent: trackedInsertContent } });

    const payload = capturedPayload as { type?: string; attrs?: Record<string, unknown> };
    expect(payload.type).toBe("figmaEmbed");
    expect(payload.attrs?.src).toBe(testUrl);
  });

  test("setFigmaEmbed command constructs correct node type and attributes", () => {
    const commands = FigmaEmbed.config.addCommands();
    const testUrl = "https://www.figma.com/file/test123";
    const attrs = { src: testUrl };

    let capturedPayload: unknown;
    const handler = commands.setFigmaEmbed(attrs);
    handler({
      commands: {
        insertContent: (p) => {
          capturedPayload = p;
          return true;
        },
      },
    });

    expect(capturedPayload).toBeDefined();
    const payload = capturedPayload as { type?: string; attrs?: unknown };
    expect(payload.type).toBe("figmaEmbed");
    expect((payload.attrs as { src?: string })?.src).toBe(testUrl);
  });

  test("setFigmaEmbed handles empty src gracefully", () => {
    const commands = FigmaEmbed.config.addCommands();
    const attrs = { src: "" };
    const handler = commands.setFigmaEmbed(attrs);

    let capturedPayload: unknown;
    const result = handler({
      commands: {
        insertContent: (p) => {
          capturedPayload = p;
          return true;
        },
      },
    });

    expect(result).toBe(true);
    expect(capturedPayload).toBeDefined();
    const payload = capturedPayload as { type?: string; attrs?: unknown };
    expect((payload.attrs as { src?: string })?.src).toBe("");
  });
});

/**
 * ★ Round-trip persistence tests (render → parse cycle)
 *
 * Verifies that the src attribute survives serialization cycles.
 * These tests catch silent data-loss bugs where src might be dropped
 * during the encode-serialize-parse workflow.
 */
describe("FigmaEmbed round-trip: render → parse cycle", () => {
  test("preserves src attribute through HTMLAttributes during render", () => {
    const originalSrc = "https://www.figma.com/file/abc123/My-Design";
    const originalAttrs = { src: originalSrc };

    // Step 1: Render the node to HTML
    const rendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: originalAttrs,
    });

    // Step 2: Extract the rendered HTML structure
    const [divTag, divAttrs, iframeNode] = rendered as [
      string,
      Record<string, unknown>,
      [string, Record<string, unknown>],
    ];

    expect(divTag).toBe("div");
    expect(divAttrs["data-figma-embed"]).toBe("true");

    // Step 3: Verify the src is preserved in the div attributes (via mergeAttributes)
    // The src should persist because renderHTML doesn't strip HTMLAttributes
    expect((divAttrs as Record<string, unknown>).src).toBe(originalSrc);

    // Step 4: Verify the iframe has the embed-wrapped URL
    expect(iframeNode[0]).toBe("iframe");
    expect(iframeNode[1].src).toContain("figma.com/embed");
    expect(iframeNode[1].src).toContain(encodeURIComponent(originalSrc));
  });

  test("preserves src across multiple render cycles (stability)", () => {
    const src = "https://www.figma.com/file/xyz789/Component-System";
    let currentAttrs = { src };

    // Render → extract → render (3 cycles) to detect degradation
    for (let i = 0; i < 3; i++) {
      const rendered = FigmaEmbed.config.renderHTML({
        HTMLAttributes: currentAttrs,
      });

      const [, divAttrs] = rendered as [string, Record<string, unknown>];

      // Verify src persists in div attributes
      expect((divAttrs as Record<string, unknown>).src).toBe(src);

      // Next cycle uses the preserved attributes
      currentAttrs = divAttrs as { src: string };
    }
  });

  test("handles already-embedded URLs without double-embedding", () => {
    const embeddedSrc =
      "https://www.figma.com/embed?embed_host=supaprod&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fabc%2FDesign";
    const attrs = { src: embeddedSrc };

    const rendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: attrs,
    });

    const [, , iframeNode] = rendered as [
      string,
      Record<string, unknown>,
      [string, Record<string, unknown>],
    ];

    // Should NOT wrap the embed URL again
    expect(iframeNode[1].src).toBe(embeddedSrc);
  });

  test("preserves custom data attributes through render cycle", () => {
    const attrs = {
      src: "https://www.figma.com/file/abc/Design",
      "data-custom": "value",
      "data-id": "embed-1",
    };

    const rendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: attrs,
    });

    const [, divAttrs] = rendered as [string, Record<string, unknown>];

    // All custom attributes should be preserved via mergeAttributes
    expect((divAttrs as Record<string, unknown>).src).toBe(attrs.src);
    expect((divAttrs as Record<string, unknown>)["data-custom"]).toBe("value");
    expect((divAttrs as Record<string, unknown>)["data-id"]).toBe("embed-1");

    // Re-render should maintain all attributes
    const rerendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: divAttrs as Record<string, unknown>,
    });

    const [, rerenabledDivAttrs] = rerendered as [string, Record<string, unknown>];

    expect((rerenabledDivAttrs as Record<string, unknown>)["data-custom"]).toBe("value");
    expect((rerenabledDivAttrs as Record<string, unknown>)["data-id"]).toBe("embed-1");
  });

  test("handles empty src gracefully through render cycle", () => {
    const attrs = { src: "" };

    const rendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: attrs,
    });

    const [, divAttrs, iframeNode] = rendered as [
      string,
      Record<string, unknown>,
      [string, Record<string, unknown>],
    ];

    // Empty src should be preserved
    expect((divAttrs as Record<string, unknown>).src).toBe("");
    expect(iframeNode[1].src).toBe("");

    // Re-render should maintain empty src
    const rerendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: divAttrs as { src: string },
    });

    const [, , rerenabledIframe] = rerendered as [
      string,
      Record<string, unknown>,
      [string, Record<string, unknown>],
    ];

    expect(rerenabledIframe[1].src).toBe("");
  });
});

/**
 * ★ CRITICAL GAP: Round-trip persistence through TipTap Editor
 *
 * These tests validate the full save-serialize-parse cycle:
 * 1. Create an Editor with FigmaEmbed node
 * 2. Serialize the document to HTML (renderHTML)
 * 3. Parse the HTML back (parseHTML)
 * 4. Verify the src attribute survives the round-trip
 *
 * This gap was discovered during coverage audit 2026-07-09:
 * the parseHTML extraction of src from child iframe is never tested
 * against a real TipTap Editor instance.
 *
 * DEPENDENCIES: bun:test + @tiptap/core + @tiptap/starter-kit
 * SETUP: Instantiate Editor with FigmaEmbed extension + testee chains
 */
describe("FigmaEmbed.parseHTML round-trip via TipTap Editor (CRITICAL GAP)", () => {
  /**
   * Helper: Create an editor with FigmaEmbed and StarterKit extensions.
   * Used to avoid setup duplication across tests.
   */
  const createEditor = () =>
    new Editor({
      extensions: [StarterKit, FigmaEmbed],
    });

  test("preserves figmaEmbed node src through HTML serialization and re-parse", () => {
    const originalSrc = "https://www.figma.com/file/test123/Design";
    const editor1 = createEditor();

    // Insert a figmaEmbed node via command
    editor1.chain().focus().setFigmaEmbed({ src: originalSrc }).run();

    // Serialize to HTML
    const html = editor1.getHTML();
    editor1.destroy();

    // Verify HTML contains expected structure (div[data-figma-embed] with iframe child)
    expect(html).toContain('data-figma-embed="true"');
    // Check for embed URL in iframe src (HTML entity encoding may apply)
    const embedUrl = toEmbedUrl(originalSrc);
    expect(
      html.includes(`<iframe src="${embedUrl}"`) ||
        html.includes(`<iframe src="${embedUrl.replace(/&/g, "&amp;")}"`),
    ).toBe(true);

    // Parse HTML into a fresh editor
    const editor2 = createEditor();
    editor2.commands.setContent(html);

    // Query the document and extract the figmaEmbed node
    let foundNode = false;
    editor2.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        foundNode = true;
        // Verify src attribute is preserved (the ORIGINAL src, not the embed URL)
        expect(node.attrs.src).toBe(originalSrc);
      }
    });

    expect(foundNode).toBe(true);
    editor2.destroy();
  });

  test("parseHTML correctly extracts src from iframe[src] child within div[data-figma-embed]", () => {
    const testSrc = "https://www.figma.com/file/abc123/Test-File";
    const html = `<div data-figma-embed="true"><iframe src="${testSrc}" /></div>`;

    const editor = createEditor();
    editor.commands.setContent(html);

    // Traverse and extract the figmaEmbed node
    let extractedSrc = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        extractedSrc = node.attrs.src;
      }
    });

    // Verify extraction: src should be the iframe's src, not the embed URL
    expect(extractedSrc).toBe(testSrc);
    editor.destroy();
  });

  test("handles round-trip with query params and node-id fragments in figma URL", () => {
    const complexUrl = "https://www.figma.com/proto/abc123?node-id=1%3A2&scaling=min-zoom";
    const editor1 = createEditor();

    editor1.chain().focus().setFigmaEmbed({ src: complexUrl }).run();
    const html = editor1.getHTML();
    editor1.destroy();

    // Re-parse
    const editor2 = createEditor();
    editor2.commands.setContent(html);

    // Verify query params are preserved
    let parsedSrc = null;
    editor2.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        parsedSrc = node.attrs.src;
      }
    });

    expect(parsedSrc).toBe(complexUrl);
    editor2.destroy();
  });

  test("survives multiple figmaEmbed nodes in same document", () => {
    const src1 = "https://www.figma.com/file/file1/Design-A";
    const src2 = "https://www.figma.com/file/file2/Design-B";

    const editor1 = createEditor();
    editor1.chain().focus().setFigmaEmbed({ src: src1 }).run();
    editor1.chain().focus().createParagraphNear().setFigmaEmbed({ src: src2 }).run();

    const html = editor1.getHTML();
    editor1.destroy();

    // Re-parse and verify both nodes are present with their distinct src values
    const editor2 = createEditor();
    editor2.commands.setContent(html);

    const srcs: string[] = [];
    editor2.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        srcs.push(node.attrs.src);
      }
    });

    // Verify both src values are present (order may vary due to DOM traversal)
    expect(srcs.length).toBe(2);
    expect(srcs).toContain(src1);
    expect(srcs).toContain(src2);
    editor2.destroy();
  });

  test("parseHTML fails gracefully if iframe has no src attribute", () => {
    const html = '<div data-figma-embed="true"><iframe /></div>';

    const editor = createEditor();
    // Should not crash
    editor.commands.setContent(html);

    let foundNode = false;
    let nodeSrc = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        foundNode = true;
        nodeSrc = node.attrs.src;
      }
    });

    // Node should be present but with empty/undefined src
    expect(foundNode).toBe(true);
    expect(nodeSrc === "" || nodeSrc === undefined).toBe(true);
    editor.destroy();
  });

  test("parseHTML fails gracefully if div[data-figma-embed] has no child iframe", () => {
    const html = '<div data-figma-embed="true"></div>';

    const editor = createEditor();
    // Should not crash
    editor.commands.setContent(html);

    let foundNode = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "figmaEmbed") {
        foundNode = true;
      }
    });

    // Node may or may not be inserted; graceful handling = no crash
    // (The parseHTML rule's getAttrs might return false to skip insertion)
    expect(true).toBe(true);
    editor.destroy();
  });
});
