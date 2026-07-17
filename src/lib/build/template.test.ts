// W5a: Supaprod starter template rendering tests (pure module, no I/O).

import { describe, it, expect } from "bun:test";
import { renderStarterTemplate, repoNameFromTitle } from "./template";

const PARAMS = { productName: "Acme Notes", specTitle: "Share a note with a link" };

function fileFor(path: string, params = PARAMS) {
  const file = renderStarterTemplate(params).find((f) => f.path === path);
  if (!file) throw new Error(`expected template file ${path}`);
  return file;
}

describe("renderStarterTemplate", () => {
  it("renders all six starter files", () => {
    const paths = renderStarterTemplate(PARAMS).map((f) => f.path);
    expect(paths).toEqual([
      "main.ts",
      "main_test.ts",
      "deno.json",
      ".github/workflows/ci.yml",
      "README.md",
      "supaprod.json",
    ]);
    for (const file of renderStarterTemplate(PARAMS)) {
      expect(file.content.length).toBeGreaterThan(0);
    }
  });

  it("names the product and the spec in the app and the README", () => {
    const main = fileFor("main.ts");
    expect(main.content).toContain('export const PRODUCT_NAME = "Acme Notes";');
    expect(main.content).toContain("Share a note with a link");
    expect(main.content).toContain('url.pathname === "/health"');

    const readme = fileFor("README.md");
    expect(readme.content).toContain("# Acme Notes");
    expect(readme.content).toContain("Share a note with a link");
  });

  it("emits valid JSON for deno.json and supaprod.json", () => {
    const deno = JSON.parse(fileFor("deno.json").content) as {
      tasks: { check: string; test: string };
    };
    expect(deno.tasks.check).toContain("deno check");
    expect(deno.tasks.test).toContain("deno test");

    const supaprod = JSON.parse(fileFor("supaprod.json").content);
    expect(supaprod).toEqual({ managedBy: "supaprod", template: "deno-starter", version: 1 });
  });

  it("runs check and test in CI on push and pull_request", () => {
    const ci = fileFor(".github/workflows/ci.yml").content;
    expect(ci).toContain("push:");
    expect(ci).toContain("pull_request:");
    expect(ci).toContain("deno task check");
    expect(ci).toContain("deno task test");
  });

  it("escapes quotes in the product name so main.ts stays valid", () => {
    const params = { productName: 'The "Best" App', specTitle: "Spec" };
    const main = fileFor("main.ts", params);
    // JS string literal position: JSON-escaped.
    expect(main.content).toContain(
      `export const PRODUCT_NAME = ${JSON.stringify('The "Best" App')};`,
    );
    // HTML position: entity-escaped.
    expect(main.content).toContain("&quot;Best&quot;");
  });

  it("collapses newlines in names and falls back when empty", () => {
    const main = fileFor("main.ts", { productName: "Acme\nNotes", specTitle: "  " });
    expect(main.content).toContain('"Acme Notes"');
    const fallback = fileFor("main.ts", { productName: "", specTitle: "" });
    expect(fallback.content).toContain('"Supaprod build"');
  });
});

describe("repoNameFromTitle", () => {
  it("slugs a spec title into a GitHub-safe repo name", () => {
    expect(repoNameFromTitle("Share a note with a link")).toBe("share-a-note-with-a-link");
    expect(repoNameFromTitle("V2: Onboarding (fast!)")).toBe("v2-onboarding-fast");
  });

  it("falls back when nothing usable remains", () => {
    expect(repoNameFromTitle("???")).toBe("supaprod-build");
    expect(repoNameFromTitle("")).toBe("supaprod-build");
  });
});
