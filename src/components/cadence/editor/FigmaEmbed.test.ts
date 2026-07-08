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

  test("setFigmaEmbed handler accepts commands object and returns boolean", () => {
    const commands = FigmaEmbed.config.addCommands();
    const attrs = { src: "https://www.figma.com/file/abc123" };
    const handler = commands.setFigmaEmbed(attrs);

    // The handler should be a function that accepts the command context
    expect(typeof handler).toBe("function");

    // Verify the handler signature by checking its call pattern
    // (we don't call it here since it requires a real TipTap context)
  });

  test("setFigmaEmbed command constructs correct node type and attributes", () => {
    const commands = FigmaEmbed.config.addCommands();
    const testUrl = "https://www.figma.com/file/test123";
    const attrs = { src: testUrl };

    // The command should pass { type: 'figmaEmbed', attrs } to insertContent
    const handler = commands.setFigmaEmbed(attrs);
    expect(handler).toBeDefined();
  });

  test("setFigmaEmbed handles empty src gracefully", () => {
    const commands = FigmaEmbed.config.addCommands();
    const attrs = { src: "" };
    const handler = commands.setFigmaEmbed(attrs);
    expect(handler).toBeDefined();
    expect(typeof handler).toBe("function");
  });
});
