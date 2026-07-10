import { describe, test, expect } from "bun:test";
import {
  deriveAppSlug,
  deployableFile,
  previewUrl,
  productionUrl,
} from "@/lib/hosting/changeset-deploy.server";

describe("deriveAppSlug", () => {
  test("stable, lowercase, scoped by workspace + changeset (12 hex of changeset id)", () => {
    const slug = deriveAppSlug("A1B2C3D4-e5f6-7890", "FEDCBA98-7654-3210-abcd");
    expect(slug).toBe("cad-a1b2c3d4-fedcba987654");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slug.length).toBeLessThanOrEqual(32);
  });
});

describe("deployableFile", () => {
  test("accepts the template file family", () => {
    for (const p of [
      "main.ts",
      "deno.json",
      "cadence.json",
      "README.md",
      ".github/workflows/ci.yml",
      "assets/logo.svg",
    ]) {
      expect(deployableFile(p, 1000)).toBe(true);
    }
  });
  test("rejects oversized, binary, and git-internal files", () => {
    expect(deployableFile("main.ts", 500_001)).toBe(false);
    expect(deployableFile("photo.png", 1000)).toBe(false);
    expect(deployableFile("app.wasm", 1000)).toBe(false);
    expect(deployableFile(".git/config", 100)).toBe(false);
    expect(deployableFile("Makefile", 100)).toBe(false);
  });

  test("secrets-shaped names never ship to the public URL", () => {
    expect(deployableFile(".env", 100)).toBe(false);
    expect(deployableFile(".env.example", 100)).toBe(false);
    expect(deployableFile("config/.env.production", 100)).toBe(false);
    expect(deployableFile("secrets.json", 100)).toBe(false);
    expect(deployableFile("aws-credentials.yml", 100)).toBe(false);
  });
});

describe("deploy URLs (shapes live-verified 2026-07-07 against api.deno.com/v2)", () => {
  test("production is the bare slug alias; preview appends the revision id", () => {
    expect(productionUrl("cad-a1-b2")).toMatch(/^https:\/\/cad-a1-b2\.[a-z0-9-]+\.deno\.net$/);
    expect(previewUrl("cad-a1-b2", "rev123")).toMatch(
      /^https:\/\/cad-a1-b2-rev123\.[a-z0-9-]+\.deno\.net$/,
    );
  });
});
