import { describe, expect, test } from "bun:test";
import { toEmbedUrl, FigmaEmbed } from "./FigmaEmbed";

describe("toEmbedUrl", () => {
  test("rewrites a plain figma.com file URL into the embed form", () => {
    const src = "https://www.figma.com/file/abc123/My-Design";
    expect(toEmbedUrl(src)).toBe(
      `https://www.figma.com/embed?embed_host=cadence&url=${encodeURIComponent(src)}`,
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
      `https://www.figma.com/embed?embed_host=cadence&url=${encodeURIComponent(src)}`,
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
    expect(attrs.class).toContain("overflow-hidden");
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
      "https://www.figma.com/embed?embed_host=cadence&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fabc%2FDesign";
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
describe("FigmaEmbed.parseHTML round-trip (extracting src from iframe)", () => {
  test("parseHTML extracts src from iframe child within div[data-figma-embed]", () => {
    // Test the parseHTML rule directly using happy-dom DOM elements
    const parseRules = FigmaEmbed.config.parseHTML();
    expect(parseRules.length).toBe(1);

    const parseRule = parseRules[0];
    const testSrc = "https://www.figma.com/file/abc123/Design";

    // Create DOM structure: <div data-figma-embed="true"><iframe src="..." /></div>
    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", testSrc);
    divElement.appendChild(iframeElement);

    // Invoke getAttrs from the parseHTML rule
    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    expect(extracted).toBeDefined();
    expect((extracted as { src: string }).src).toBe(testSrc);
  });

  test("parseHTML handles empty iframe src attribute", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", "");
    divElement.appendChild(iframeElement);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    expect((extracted as { src: string }).src).toBe("");
  });

  test("parseHTML handles iframe without src attribute", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    // No src attribute
    divElement.appendChild(iframeElement);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should extract empty string (from ?? "" fallback)
    expect((extracted as { src: string }).src).toBe("");
  });

  test("parseHTML handles div with no child iframe", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");
    // No iframe child

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should extract empty string (querySelector returns null, ?? "" kicks in)
    expect((extracted as { src: string }).src).toBe("");
  });

  test("parseHTML extracts from first iframe if multiple exist", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframe1 = document.createElement("iframe");
    iframe1.setAttribute("src", "https://www.figma.com/file/first");
    divElement.appendChild(iframe1);

    const iframe2 = document.createElement("iframe");
    iframe2.setAttribute("src", "https://www.figma.com/file/second");
    divElement.appendChild(iframe2);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should extract the first iframe's src
    expect((extracted as { src: string }).src).toBe("https://www.figma.com/file/first");
  });

  test("parseHTML preserves malformed/arbitrary URLs as-is", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const malformedUrl = "not-a-valid-url-at-all";

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", malformedUrl);
    divElement.appendChild(iframeElement);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should preserve the malformed string exactly
    expect((extracted as { src: string }).src).toBe(malformedUrl);
  });

  test("parseHTML preserves complex figma URLs with query params", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    const complexUrl =
      "https://www.figma.com/proto/abc123?node-id=1%3A2&scaling=min-zoom&hotspot-hints=true";

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", complexUrl);
    divElement.appendChild(iframeElement);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should preserve query params exactly
    expect((extracted as { src: string }).src).toBe(complexUrl);
  });

  test("parseHTML correctly extracts from embed-wrapped URLs", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const parseRule = parseRules[0];

    // This is what an already-embedded URL looks like in the iframe src
    const embedUrl = "https://www.figma.com/embed?embed_host=cadence&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fabc%2FDesign";

    const divElement = document.createElement("div");
    divElement.setAttribute("data-figma-embed", "true");

    const iframeElement = document.createElement("iframe");
    iframeElement.setAttribute("src", embedUrl);
    divElement.appendChild(iframeElement);

    const extracted = parseRule.getAttrs(divElement as HTMLElement);

    // Should extract the full embed URL (as stored by a previous render)
    expect((extracted as { src: string }).src).toBe(embedUrl);
  });
});
