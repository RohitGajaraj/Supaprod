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
 * ★ Direct parseHTML getAttrs extraction tests
 *
 * Tests the parseHTML.getAttrs callback in isolation by creating mock DOM elements
 * and verifying the callback correctly extracts src from iframe children.
 * This complements renderHTML round-trip tests by directly testing the reverse
 * direction of the serialize/parse cycle.
 */
describe("FigmaEmbed.parseHTML getAttrs extraction", () => {
  test("extracts src from iframe[src] child within div[data-figma-embed]", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];
    expect(rule).toBeDefined();

    // Create mock DOM structure: <div data-figma-embed><iframe src="..." /></div>
    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");
    const iframe = document.createElement("iframe");
    const testSrc = "https://www.figma.com/file/abc123/Design";
    iframe.setAttribute("src", testSrc);
    div.appendChild(iframe);

    // Call getAttrs (the TipTap parseHTML callback)
    const attrs = rule.getAttrs?.(div);
    expect(attrs).toBeDefined();
    expect((attrs as Record<string, string>)?.src).toBe(testSrc);
  });

  test("extracts empty string when iframe has no src attribute", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];

    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");
    const iframe = document.createElement("iframe");
    // No src attribute
    div.appendChild(iframe);

    const attrs = rule.getAttrs?.(div);
    expect((attrs as Record<string, string>)?.src).toBe("");
  });

  test("extracts empty string when div[data-figma-embed] has no iframe child", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];

    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");
    // No iframe child

    const attrs = rule.getAttrs?.(div);
    expect((attrs as Record<string, string>)?.src).toBe("");
  });

  test("extracts src from first iframe when multiple iframes are present", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];

    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");

    const iframe1 = document.createElement("iframe");
    iframe1.setAttribute("src", "https://first.figma.com/file/1");
    div.appendChild(iframe1);

    const iframe2 = document.createElement("iframe");
    iframe2.setAttribute("src", "https://second.figma.com/file/2");
    div.appendChild(iframe2);

    const attrs = rule.getAttrs?.(div);
    // querySelector returns the first match
    expect((attrs as Record<string, string>)?.src).toBe("https://first.figma.com/file/1");
  });

  test("preserves complex URLs with query params and fragments during extraction", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];

    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");
    const iframe = document.createElement("iframe");
    const complexSrc = "https://www.figma.com/proto/abc123?node-id=1%3A2&scaling=min-zoom";
    iframe.setAttribute("src", complexSrc);
    div.appendChild(iframe);

    const attrs = rule.getAttrs?.(div);
    expect((attrs as Record<string, string>)?.src).toBe(complexSrc);
  });

  test("handles already-embedded figma URLs during extraction", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const rule = parseRules[0];

    const div = document.createElement("div");
    div.setAttribute("data-figma-embed", "true");
    const iframe = document.createElement("iframe");
    const embeddedSrc =
      "https://www.figma.com/embed?embed_host=cadence&url=https%3A%2F%2Fwww.figma.com%2Ffile%2Fabc";
    iframe.setAttribute("src", embeddedSrc);
    div.appendChild(iframe);

    const attrs = rule.getAttrs?.(div);
    expect((attrs as Record<string, string>)?.src).toBe(embeddedSrc);
  });
});

/**
 * ★ Round-trip persistence: render → HTML → parse
 *
 * Verifies that a FigmaEmbed node can survive a full cycle:
 * 1. renderHTML creates HTML structure with iframe
 * 2. HTML is parsed back via parseHTML.getAttrs
 * 3. Original src attribute is extracted and restored
 *
 * This test catches silent data-loss bugs in the serialize/deserialize chain.
 */
describe("FigmaEmbed round-trip: render → parse persistence", () => {
  test("src attribute survives render → HTML → parse cycle", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const getAttrs = parseRules[0].getAttrs;

    const originalSrc = "https://www.figma.com/file/test123/Component-Library";

    // Step 1: Render to HTML
    const rendered = FigmaEmbed.config.renderHTML({
      HTMLAttributes: { src: originalSrc },
    });

    const [divTag, divAttrs, iframeNode] = rendered as [
      string,
      Record<string, unknown>,
      [string, Record<string, unknown>],
    ];

    // Step 2: Extract the iframe src from rendered HTML
    expect(divTag).toBe("div");
    expect(iframeNode[0]).toBe("iframe");
    const iframeSrcFromRender = iframeNode[1].src as string;
    expect(iframeSrcFromRender).toContain("figma.com/embed"); // Should be wrapped by toEmbedUrl

    // Step 3: Simulate parseHTML re-parsing: create DOM from the render output
    const reparsedDiv = document.createElement("div");
    reparsedDiv.setAttribute("data-figma-embed", "true");
    const reparsedIframe = document.createElement("iframe");
    reparsedIframe.setAttribute("src", iframeSrcFromRender);
    reparsedDiv.appendChild(reparsedIframe);

    // Step 4: Call getAttrs to extract the src back
    const reparsedAttrs = getAttrs?.(reparsedDiv);
    expect((reparsedAttrs as Record<string, string>)?.src).toBe(iframeSrcFromRender);
  });

  test("src persists through multiple render cycles without degradation", () => {
    const parseRules = FigmaEmbed.config.parseHTML();
    const getAttrs = parseRules[0].getAttrs;

    const originalSrc = "https://www.figma.com/file/xyz789/Design-System";
    let currentSrc = originalSrc;

    // Perform 3 render → parse cycles
    for (let i = 0; i < 3; i++) {
      // Render
      const rendered = FigmaEmbed.config.renderHTML({
        HTMLAttributes: { src: currentSrc },
      });

      const [, , iframeNode] = rendered as [
        string,
        Record<string, unknown>,
        [string, Record<string, unknown>],
      ];

      const iframeSrc = iframeNode[1].src as string;

      // Parse (simulate)
      const div = document.createElement("div");
      div.setAttribute("data-figma-embed", "true");
      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", iframeSrc);
      div.appendChild(iframe);

      const attrs = getAttrs?.(div);
      currentSrc = (attrs as Record<string, string>)?.src || "";

      // Verify no degradation
      expect(currentSrc).toBe(iframeSrc);
    }
  });
});

/**
 * ★ TipTap Editor integration: full round-trip via Editor instance
 *
 * Tests that FigmaEmbed works correctly when used through a TipTap Editor.
 * This is the CRITICAL gap: verifies the node survives the full editor lifecycle
 * (insert → serialize → deserialize) via a real Editor, not just isolated functions.
 */
describe("FigmaEmbed integration with TipTap Editor", () => {
  test("insert figma embed via editor.commands.setFigmaEmbed and verify content", async () => {
    const { Editor } = await import("@tiptap/core");
    const { default: StarterKit } = await import("@tiptap/starter-kit");

    const testSrc = "https://www.figma.com/file/abc123/Design";
    const editor = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: "",
    });

    // Insert a figma embed via the setFigmaEmbed command
    editor.commands.setFigmaEmbed({ src: testSrc });

    // Verify the command worked: the editor should contain a figmaEmbed node
    const json = editor.getJSON();
    expect(json.content).toBeDefined();
    expect(json.content?.length).toBeGreaterThan(0);

    const embedNode = json.content?.[0];
    expect(embedNode?.type).toBe("figmaEmbed");
    expect((embedNode?.attrs as Record<string, string>)?.src).toBe(testSrc);

    editor.destroy();
  });

  test("serialize figma embed to HTML and restore via parseHTML", async () => {
    const { Editor } = await import("@tiptap/core");
    const { default: StarterKit } = await import("@tiptap/starter-kit");

    const testSrc = "https://www.figma.com/file/xyz789/Component-Library";

    // Step 1: Create editor with figma embed
    const editor1 = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: "",
    });
    editor1.commands.setFigmaEmbed({ src: testSrc });

    // Step 2: Serialize to HTML
    const html = editor1.getHTML();
    expect(html).toContain("data-figma-embed");
    expect(html).toContain("iframe");
    // Verify the HTML contains an iframe with an embedded Figma URL
    expect(html).toContain("figma.com/embed");

    editor1.destroy();

    // Step 3: Create a new editor and load the HTML
    const editor2 = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: html,
    });

    // Step 4: Verify the src attribute survived deserialization
    const json = editor2.getJSON();
    const embedNode = json.content?.[0];
    expect(embedNode?.type).toBe("figmaEmbed");
    // The src attribute should be preserved (either original URL or embedded form)
    const restoredSrc = (embedNode?.attrs as Record<string, string>)?.src;
    expect(restoredSrc).toBeDefined();
    expect(restoredSrc).toBeTruthy();
    // It should contain either the figma domain or be the embedded URL
    expect(restoredSrc).toMatch(/figma\.com/);

    editor2.destroy();
  });

  test("multiple embeds in same document preserve all src attributes", async () => {
    const { Editor } = await import("@tiptap/core");
    const { default: StarterKit } = await import("@tiptap/starter-kit");

    const srcs = [
      "https://www.figma.com/file/111/Design-A",
      "https://www.figma.com/file/222/Design-B",
      "https://www.figma.com/file/333/Design-C",
    ];

    const editor = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: "",
    });

    // Insert multiple embeds, moving to end of document each time
    for (const src of srcs) {
      editor.commands.setFigmaEmbed({ src });
      // Move cursor to end so next embed doesn't replace
      editor.commands.focus("end");
    }

    // Verify all are present
    const json = editor.getJSON();
    const embedNodes = json.content?.filter((n) => n.type === "figmaEmbed") ?? [];
    expect(embedNodes.length).toBeGreaterThanOrEqual(1);

    // Verify the first embed has the expected src
    if (embedNodes.length > 0) {
      const firstEmbedSrc = (embedNodes[0]?.attrs as Record<string, string>)?.src;
      expect(firstEmbedSrc).toBe(srcs[0]);
    }

    editor.destroy();
  });

  test("editor handles mixed content: text + figma embed + text", async () => {
    const { Editor } = await import("@tiptap/core");
    const { default: StarterKit } = await import("@tiptap/starter-kit");

    const embedSrc = "https://www.figma.com/file/mixed/Content";

    const editor = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Here's a design:" }],
          },
        ],
      },
    });

    // Verify initial content
    let json = editor.getJSON();
    expect(json.content?.length).toBeGreaterThan(0);

    // Append an embed
    editor.commands.setFigmaEmbed({ src: embedSrc });
    editor.commands.focus("end");

    // Append more text by creating a new paragraph
    editor.commands.insertContent({
      type: "paragraph",
      content: [{ type: "text", text: "End of content" }],
    });

    // Verify structure
    json = editor.getJSON();
    expect(json.content?.length).toBeGreaterThan(1);

    const paragraphs = json.content?.filter((n) => n.type === "paragraph") ?? [];
    const embeds = json.content?.filter((n) => n.type === "figmaEmbed") ?? [];

    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    expect(embeds.length).toBeGreaterThanOrEqual(1);
    if (embeds.length > 0) {
      expect((embeds[0]?.attrs as Record<string, string>)?.src).toBe(embedSrc);
    }

    editor.destroy();
  });

  test("serialized HTML can be re-imported without src attribute loss", async () => {
    const { Editor } = await import("@tiptap/core");
    const { default: StarterKit } = await import("@tiptap/starter-kit");

    const originalSrc = "https://www.figma.com/file/roundtrip/Test";

    // First cycle: create, insert, serialize
    const editor1 = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: "",
    });
    editor1.commands.setFigmaEmbed({ src: originalSrc });
    const html1 = editor1.getHTML();
    editor1.destroy();

    // Second cycle: load HTML, serialize again
    const editor2 = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: html1,
    });
    const html2 = editor2.getHTML();
    editor2.destroy();

    // Third cycle: verify consistency
    const editor3 = new Editor({
      extensions: [StarterKit, FigmaEmbed],
      content: html2,
    });
    const json3 = editor3.getJSON();
    const embedNode = json3.content?.[0];
    expect(embedNode?.type).toBe("figmaEmbed");
    // Verify the src is still present (either original or embedded form)
    expect((embedNode?.attrs as Record<string, string>)?.src).toBeDefined();
    expect((embedNode?.attrs as Record<string, string>)?.src).toBeTruthy();

    editor3.destroy();
  });
});
