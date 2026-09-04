/**
 * "THEN BUILDS IT. SHIPS IT." IS TRUE OF OUR OWN TEMPLATE AND NOTHING ELSE.
 *
 * The honest Ship went live on 2026-09-04 on `relay-homeowner-app`, which is a
 * Supaprod template: `supaprod.json` at the root, a `main.ts` that serves a
 * page. `changeset-deploy` says the scope in its own header. Every repository a
 * customer actually brings ends at `merged` and "No app to show yet".
 *
 * These hold the detection that replaces the marker file, and the sentences a
 * person gets when the answer is no.
 */
import { describe, expect, it } from "bun:test";
import {
  canHost,
  repoShape,
  staticEntrypoint,
  type PackageJson,
} from "@/lib/hosting/what-shape-is-this-repo";

const vite: PackageJson = {
  scripts: { build: "vite build", dev: "vite" },
  devDependencies: { vite: "^5.0.0" },
};

describe("the shapes this product can host", () => {
  it("a template app is served as it stands", () => {
    const s = repoShape({ rootFiles: ["main.ts", "supaprod.json"], pkg: null });
    expect(s.kind).toBe("deno-entrypoint");
    expect(canHost(s)).toBe(true);
  });

  it("a Vite app builds, and what it writes is what goes live", () => {
    const s = repoShape({ rootFiles: ["package.json", "index.html"], pkg: vite });
    expect(s.kind).toBe("static-build");
    if (s.kind === "static-build") {
      expect(s.script).toBe("build");
      expect(s.outDir).toBe("dist");
      expect(s.said).toContain("vite");
    }
    expect(canHost(s)).toBe(true);
  });

  it("reads the output directory from the tool, never from a folder listing", () => {
    /*
     * `dist` exists in plenty of repos that do not build into it, and a wrong
     * directory uploads somebody's source as their website. SvelteKit writes to
     * `build`, Next's export to `out`; each comes from the dependency.
     */
    const kit = repoShape({
      rootFiles: ["package.json"],
      pkg: { scripts: { build: "vite build" }, devDependencies: { "@sveltejs/kit": "^2" } },
    });
    expect(kit.kind === "static-build" && kit.outDir).toBe("build");
    const next = repoShape({
      rootFiles: ["package.json"],
      pkg: { scripts: { build: "next build" }, dependencies: { next: "^14" } },
    });
    expect(next.kind === "static-build" && next.outDir).toBe("out");
  });

  it("the template shape wins even when a package.json is there too", () => {
    // A root `main.ts` is the repo telling us exactly how to serve it.
    const s = repoShape({ rootFiles: ["main.ts", "package.json"], pkg: vite });
    expect(s.kind).toBe("deno-entrypoint");
  });
});

describe("what it refuses, and what it says instead of nothing", () => {
  it("a build script with no tool we know is not hosted on a guess", () => {
    const s = repoShape({
      rootFiles: ["package.json"],
      pkg: { scripts: { build: "make site" }, dependencies: { lodash: "^4" } },
    });
    expect(s.kind).toBe("unknown");
    expect(canHost(s)).toBe(false);
    expect(s.said).toContain("where it puts the finished site");
    // The path that already exists, named rather than left to be found.
    expect(s.said).toContain("hand the address back");
  });

  it("a server is named as a server, not lumped into unknown", () => {
    /*
     * "We do not host servers yet" and "we could not tell what this is" are
     * different sentences and only one of them tells a person whether waiting
     * for us is worth it.
     */
    const s = repoShape({
      rootFiles: ["package.json"],
      pkg: { scripts: { start: "bun server.ts" }, dependencies: {} },
    });
    expect(s.kind).toBe("server");
    expect(s.said).toContain("does not host yet");
    expect(canHost(s)).toBe(false);
  });

  it("a repo with nothing to go on says exactly what was looked for", () => {
    const s = repoShape({ rootFiles: ["README.md"], pkg: null });
    expect(s.kind).toBe("unknown");
    expect(s.said).toContain("no main.ts at the root");
    expect(s.said).toContain("build or start script");
  });

  it("never mentions a marker file a customer would have to adopt", () => {
    /*
     * `isSupaprodManaged` asks whether `supaprod.json` exists, which answers
     * "did we scaffold this" rather than "can we host it". Asking a customer to
     * add our marker is asking them to adopt our convention before we have done
     * anything for them.
     */
    for (const s of [
      repoShape({ rootFiles: ["README.md"], pkg: null }),
      repoShape({ rootFiles: ["package.json"], pkg: { scripts: { start: "node ." } } }),
      repoShape({ rootFiles: ["package.json"], pkg: { scripts: { build: "make" } } }),
    ]) {
      expect(s.said).not.toContain("supaprod.json");
      expect(s.said).not.toContain("cadence.json");
    }
  });
});

describe("the entrypoint generated for a built site", () => {
  it("serves the directory the tool actually writes", () => {
    expect(staticEntrypoint("build")).toContain('"./build"');
    expect(staticEntrypoint("dist")).toContain('"./dist"');
  });

  it("falls back to index.html, which is what every one of these tools expects", () => {
    // A single-page app's deep links are the one behaviour worth assuming.
    expect(staticEntrypoint("dist")).toContain('"/index.html"');
  });

  it("says it is generated, so nobody edits it expecting it to survive", () => {
    expect(staticEntrypoint("dist")).toContain("Generated by Supaprod");
    expect(staticEntrypoint("dist")).toContain("Edit the site, not this file");
  });
});
