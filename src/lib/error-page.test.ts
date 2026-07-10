import { describe, it, expect } from "bun:test";
import { renderErrorPage } from "./error-page";

// This is the catastrophic-500 fallback src/server.ts renders when h3 has
// already swallowed the real error (CLAUDE.md: "treat src/server.ts as
// load-bearing"). It takes no arguments and must never leak diagnostic detail
// to an end user, so the tests are a content/regression contract, not just a
// smoke test.

describe("renderErrorPage", () => {
  it("returns a standalone, valid HTML document", () => {
    const html = renderErrorPage();
    expect(html.trim().startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("shows the branded, non-technical copy", () => {
    const html = renderErrorPage();
    expect(html).toContain("This page didn't load");
    expect(html).toContain("Something went wrong on our end");
  });

  it("offers both recovery actions: retry and go home", () => {
    const html = renderErrorPage();
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).toContain("location.reload()");
  });

  it("never leaks a raw stack trace or exception detail (no params in, none can appear)", () => {
    const html = renderErrorPage();
    expect(html).not.toMatch(/\bat \S+ \(.*:\d+:\d+\)/); // "at fn (file:line:col)" stack frame shape
    expect(html).not.toContain("Error:");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("[object");
  });

  it("inlines its own styles (no external stylesheet the fallback path could fail to reach)", () => {
    const html = renderErrorPage();
    expect(html).toContain("<style>");
    expect(html).not.toMatch(/<link[^>]+rel=["']stylesheet["']/);
  });

  it("is deterministic across calls (no timestamps, ids, or randomness baked in)", () => {
    expect(renderErrorPage()).toBe(renderErrorPage());
  });
});
