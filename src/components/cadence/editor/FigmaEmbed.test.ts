import { describe, expect, test } from "bun:test";
import { FigmaEmbed, toEmbedUrl } from "./FigmaEmbed";

describe("toEmbedUrl", () => {
  test("converts regular Figma URL to embed format", () => {
    const url = "https://www.figma.com/file/abc123/MyDesign";
    const result = toEmbedUrl(url);
    expect(result).toContain("figma.com/embed");
    expect(result).toContain(encodeURIComponent(url));
  });

  test("preserves embed URLs unchanged", () => {
    const url = "https://www.figma.com/embed?file-key=abc123";
    const result = toEmbedUrl(url);
    expect(result).toBe(url);
  });

  test("converts http figma URL to https embed", () => {
    const url = "http://figma.com/file/abc123";
    const result = toEmbedUrl(url);
    expect(result).toContain("https://");
    expect(result).toContain("figma.com/embed");
  });

  test("rejects javascript protocol", () => {
    const url = "javascript:alert('xss')";
    const result = toEmbedUrl(url);
    expect(result).toBe(url);
  });

  test("rejects data protocol", () => {
    const url = "data:text/html,<img src=x onerror='alert(1)'>";
    const result = toEmbedUrl(url);
    expect(result).toBe(url);
  });

  test("validates hostname against hostname substring attacks", () => {
    // Should not convert if hostname is not exactly figma.com or a subdomain
    const url = "https://evilfigma.com/file/abc123";
    const result = toEmbedUrl(url);
    // Non-figma host should be returned unchanged
    expect(result).toBe(url);
  });

  test("accepts figma.com subdomains", () => {
    const url = "https://prototype.figma.com/file/abc123";
    const result = toEmbedUrl(url);
    expect(result).toContain("figma.com/embed");
  });

  test("handles URL parsing errors gracefully", () => {
    const url = "not a valid url";
    const result = toEmbedUrl(url);
    expect(result).toBe(url);
  });

  test("includes embed_host=cadence parameter", () => {
    const url = "https://www.figma.com/file/abc123";
    const result = toEmbedUrl(url);
    expect(result).toContain("embed_host=cadence");
  });
});

describe("FigmaEmbed Node", () => {
  test("FigmaEmbed is defined", () => {
    expect(FigmaEmbed).toBeDefined();
  });

  test("FigmaEmbed has name property", () => {
    expect(FigmaEmbed.name).toBe("figmaEmbed");
  });

  test("FigmaEmbed is a block-level node", () => {
    expect(FigmaEmbed.config.group).toBe("block");
  });

  test("FigmaEmbed is draggable", () => {
    expect(FigmaEmbed.config.draggable).toBe(true);
  });

  test("FigmaEmbed is selectable", () => {
    expect(FigmaEmbed.config.selectable).toBe(true);
  });

  test("FigmaEmbed is atomic", () => {
    expect(FigmaEmbed.config.atom).toBe(true);
  });

  test("FigmaEmbed has src attribute", () => {
    const attrs = FigmaEmbed.config.addAttributes?.();
    expect(attrs).toBeDefined();
    expect(attrs?.src).toBeDefined();
    expect(attrs?.src?.default).toBe("");
  });

  test("FigmaEmbed has parseHTML configuration", () => {
    const parseRules = FigmaEmbed.config.parseHTML?.();
    expect(parseRules).toBeDefined();
    expect(Array.isArray(parseRules)).toBe(true);
  });

  test("parseHTML targets data-figma-embed elements", () => {
    const parseRules = FigmaEmbed.config.parseHTML?.();
    const dataEmbedRule = parseRules?.find((r: any) => r.tag === "div[data-figma-embed]");
    expect(dataEmbedRule).toBeDefined();
  });

  test("parseHTML rule has getAttrs callback", () => {
    const parseRules = FigmaEmbed.config.parseHTML?.();
    const dataEmbedRule = parseRules?.[0];
    expect(dataEmbedRule?.getAttrs).toBeDefined();
    expect(typeof dataEmbedRule?.getAttrs).toBe("function");
  });

  test("parseHTML getAttrs extracts iframe src", () => {
    const parseRules = FigmaEmbed.config.parseHTML?.();
    const getAttrs = parseRules?.[0]?.getAttrs;

    // Create a mock DOM element
    const mockDom = {
      querySelector: (selector: string) => ({
        getAttribute: (attr: string) => {
          if (attr === "src") {
            return "https://www.figma.com/embed?file-key=abc123";
          }
          return null;
        },
      }),
    } as any;

    const attrs = getAttrs?.(mockDom);
    expect(attrs?.src).toBe("https://www.figma.com/embed?file-key=abc123");
  });

  test("parseHTML getAttrs handles missing iframe", () => {
    const parseRules = FigmaEmbed.config.parseHTML?.();
    const getAttrs = parseRules?.[0]?.getAttrs;

    // Create a mock DOM element with no iframe
    const mockDom = {
      querySelector: () => null,
    } as any;

    const attrs = getAttrs?.(mockDom);
    expect(attrs?.src).toBe("");
  });
});
