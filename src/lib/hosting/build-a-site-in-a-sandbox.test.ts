/**
 * A CUSTOMER'S SITE, BUILT AND BROUGHT BACK, WITH THE HOST MOCKED.
 *
 * R-41's first non-template shape. The sandbox that runs it has existed all
 * week; what was missing is that `runInE2B` returns a VERDICT -- exit codes and
 * 20,000 characters -- and its `SandboxLike` exposes `commands.run` and nothing
 * else, so no build output could ever come back through it.
 *
 * These run against a fake sandbox: no network, no credit, no E2B.
 */
import { describe, expect, it } from "bun:test";
import {
  buildStaticSite,
  commandFailed,
  manifestScript,
  MAX_SITE_BYTES,
  MAX_SITE_FILES,
  type SiteBuildDeps,
} from "@/lib/hosting/build-a-site-in-a-sandbox.server";

const KEY = "E2B_API_KEY";
const withKey = async (fn: () => Promise<void>) => {
  const had = process.env[KEY];
  process.env[KEY] = "test-key";
  try {
    await fn();
  } finally {
    if (had === undefined) delete process.env[KEY];
    else process.env[KEY] = had;
  }
};

/** A sandbox that succeeds at everything and returns one built file. */
function fakeSandbox(
  over: {
    fail?: (cmd: string) => { exitCode: number; stderr?: string } | null;
    manifest?: unknown;
    onRun?: (cmd: string) => void;
  } = {},
): { deps: SiteBuildDeps; ran: string[]; killed: () => boolean } {
  const ran: string[] = [];
  let wasKilled = false;
  const deps: SiteBuildDeps = {
    createSandbox: async () => ({
      sandboxId: "sbx-1",
      commands: {
        run: async (cmd: string) => {
          ran.push(cmd);
          over.onRun?.(cmd);
          const f = over.fail?.(cmd);
          return f ?? { exitCode: 0, stdout: "", stderr: "" };
        },
      },
      files: {
        read: async () =>
          JSON.stringify(
            over.manifest ?? {
              bytes: 12,
              files: [{ path: "index.html", b64: "PGgxPmhpPC9oMT4=" }],
            },
          ),
      },
      kill: async () => {
        wasKilled = true;
        return null;
      },
    }),
  };
  return { deps, ran, killed: () => wasKilled };
}

const VITE = {
  repo: "acme/site",
  ref: "main",
  token: "ghs_secret",
  script: "build",
  outDir: "dist",
  tool: "vite",
};

describe("a Vite repo reaches files a deploy can carry", () => {
  it("builds, packages and returns the site", async () => {
    await withKey(async () => {
      const { deps } = fakeSandbox();
      const out = await buildStaticSite({ ...VITE, deps });
      expect(out.ok).toBe(true);
      if (out.ok) {
        expect(out.files).toHaveLength(1);
        expect(out.files[0]!.path).toBe("index.html");
        // Base64, because a built site is not text: a Vite build carries PNGs
        // and woff2, and UTF-8 corrupts them silently.
        expect(out.files[0]!.encoding).toBe("base64");
        expect(out.tool).toBe("vite");
        expect(out.outDir).toBe("dist");
        expect(out.buildMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it("runs the script package.json named, quoted, never interpolated raw", async () => {
    await withKey(async () => {
      const { deps, ran } = fakeSandbox();
      await buildStaticSite({ ...VITE, script: "build:prod", deps });
      expect(ran.some((c) => c.includes("bun run 'build:prod'"))).toBe(true);
    });
  });

  it("inherits the clone that scrubs its own credential", async () => {
    /*
     * `defaultSetup` is used unchanged rather than a second clone written here.
     * The token rides the clone step's envs, the URL is rewritten in the same
     * command, and the scrub is asserted -- and everything after it is the
     * repo's own untrusted code.
     */
    await withKey(async () => {
      const { deps, ran } = fakeSandbox();
      await buildStaticSite({ ...VITE, deps });
      const clone = ran.find((c) => c.includes("git clone"));
      expect(clone).toBeTruthy();
      expect(clone).toContain("git remote set-url origin");
      expect(clone).toContain('! grep -q "x-access-token"');
      // The token is never in a command string we build.
      expect(ran.join("\n")).not.toContain("ghs_secret");
    });
  });

  it("kills the sandbox even when a step fails", async () => {
    await withKey(async () => {
      const { deps, killed } = fakeSandbox({
        fail: (c) => (c.includes("bun run") ? { exitCode: 1, stderr: "boom" } : null),
      });
      await buildStaticSite({ ...VITE, deps });
      expect(killed()).toBe(true);
    });
  });
});

describe("what it refuses, in words a person can act on", () => {
  it("a failed build carries the build's own output", async () => {
    await withKey(async () => {
      const { deps } = fakeSandbox({
        fail: (c) =>
          c.includes("bun run") ? { exitCode: 1, stderr: "Could not resolve ./App" } : null,
      });
      const out = await buildStaticSite({ ...VITE, deps });
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.reason).toContain("Could not resolve ./App");
    });
  });

  it("a build that wrote nothing names the directory it was looked for in", async () => {
    await withKey(async () => {
      const { deps } = fakeSandbox({
        fail: (c) =>
          c.includes("SUPAPROD_NO_OUTPUT") ? { exitCode: 3, stderr: "SUPAPROD_NO_OUTPUT" } : null,
      });
      const out = await buildStaticSite({ ...VITE, deps });
      expect(out.ok).toBe(false);
      if (!out.ok) {
        expect(out.reason).toContain("dist");
        expect(out.reason).toContain("vite");
      }
    });
  });

  it("a site past the ceiling says the ceiling and offers the handback", async () => {
    await withKey(async () => {
      const { deps } = fakeSandbox({
        fail: (c) =>
          c.includes("SUPAPROD_TOO_BIG")
            ? { exitCode: 4, stderr: "SUPAPROD_TOO_BIG 900 99999999" }
            : null,
      });
      const out = await buildStaticSite({ ...VITE, deps });
      expect(out.ok).toBe(false);
      if (!out.ok) {
        expect(out.reason).toContain(String(MAX_SITE_FILES));
        expect(out.reason).toContain("hand the address back");
      }
    });
  });

  it("an empty manifest is a refusal, not an empty deploy", async () => {
    await withKey(async () => {
      const { deps } = fakeSandbox({ manifest: { bytes: 0, files: [] } });
      const out = await buildStaticSite({ ...VITE, deps });
      expect(out.ok).toBe(false);
    });
  });

  it("a dangerous ref never reaches a clone", async () => {
    await withKey(async () => {
      const { deps, ran } = fakeSandbox();
      const out = await buildStaticSite({ ...VITE, ref: "--upload-pack=evil", deps });
      expect(out.ok).toBe(false);
      expect(ran).toHaveLength(0);
    });
  });

  it("no sandbox configured is said plainly, not thrown", async () => {
    const had = process.env[KEY];
    delete process.env[KEY];
    try {
      const out = await buildStaticSite({ ...VITE, deps: fakeSandbox().deps });
      expect(out.ok).toBe(false);
      if (!out.ok) expect(out.reason).toContain("No build sandbox is configured");
    } finally {
      if (had !== undefined) process.env[KEY] = had;
    }
  });
});

describe("the ceilings are enforced inside the sandbox", () => {
  it("the manifest script carries both, so a huge build is refused before it travels", () => {
    // A 2 GB output directory must be refused before anything tries to carry
    // it across, not after.
    const script = manifestScript("dist", MAX_SITE_FILES, MAX_SITE_BYTES);
    expect(script).toContain(String(MAX_SITE_FILES));
    expect(script).toContain(String(MAX_SITE_BYTES));
    expect(script).toContain("SUPAPROD_TOO_BIG");
  });

  it("and the directory it walks is quoted", () => {
    expect(manifestScript("my dist", MAX_SITE_FILES, MAX_SITE_BYTES)).toContain("'my dist'");
  });
});

describe("reading an exit code out of whatever the SDK returned", () => {
  it("no exitCode is not a failure", () => {
    expect(commandFailed({}).failed).toBe(false);
    expect(commandFailed(null).failed).toBe(false);
  });
  it("a non-zero one is, and carries what it said", () => {
    const r = commandFailed({ exitCode: 2, stderr: "nope" });
    expect(r.failed).toBe(true);
    expect(r.detail).toContain("nope");
  });
});
