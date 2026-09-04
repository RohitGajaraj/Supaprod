/**
 * BUILD SOMEBODY ELSE'S SITE, AND BRING BACK ONLY WHAT IT WROTE.
 *
 * ── WHAT R-41 ASKED FOR AND WHAT WAS MISSING (P-128b) ────────────────────
 * The first non-template shape Supaprod hosts is a static build: a repo with a
 * build script and a tool whose output directory is unambiguous. The sandbox
 * that runs it already exists -- `e2b.server` clones, installs and executes,
 * and it has been doing so all week for `studio.checks.run`.
 *
 * What it could not do is bring anything BACK. `runInE2B` returns a verdict:
 * exit codes and at most 20,000 characters of output, which is right for
 * "did the checks pass" and useless for "here is the site". Its `SandboxLike`
 * deliberately exposes `commands.run` and nothing else.
 *
 * So this is a sibling rather than a parameter on that one. It reuses the parts
 * that must not be re-derived -- `defaultSetup`'s clone with its credential
 * scrub, `withGitToken`, `assertSafeRef`, `redactSecrets` -- and adds the one
 * capability that is genuinely new: reading the build output.
 *
 * ── THE CREDENTIAL RULES ARE INHERITED, NOT RESTATED ─────────────────────
 * The token rides on the clone step's own `envs`, the clone scrubs it out of
 * `.git/config` in the same command, and the scrub is asserted. Everything
 * after that -- `bun install`, the repo's own build script -- is untrusted code
 * running with no credential in reach. That is `defaultSetup`'s design and this
 * uses it unchanged rather than writing a second clone that has to be audited
 * separately.
 *
 * ── AND IT COMES BACK THROUGH ONE FILE, WITH CEILINGS ────────────────────
 * The sandbox walks the output directory, refuses past the ceilings itself, and
 * writes ONE manifest. Reading N files over the API would be N round trips and
 * an unbounded appetite; one file is one read and one number to cap.
 *
 * Base64 throughout, because a built site is not text. A Vite build has PNGs
 * and woff2 in it, and the previous deploy path could only carry UTF-8 -- which
 * is the second reason this shape could never have shipped through it.
 */
import {
  assertSafeRef,
  defaultSetup,
  e2bApiKey,
  quoteShellArg,
  redactSecrets,
  resolveTimeoutMs,
  withGitToken,
} from "@/lib/exec/e2b.server";

/** The build gets its own ceiling, well under the check runner's. */
export const SITE_BUILD_TIMEOUT_MS = 8 * 60_000;

/** Matches the managed deploy path's own caps, so one shape cannot outgrow the other. */
export const MAX_SITE_FILES = 400;
export const MAX_SITE_BYTES = 12 * 1024 * 1024;

/** What comes back from the sandbox, as the deploy call wants it. */
export type SiteFile = { path: string; content: string; encoding: "base64" };

export type SiteBuildResult =
  | {
      ok: true;
      files: SiteFile[];
      tool: string;
      outDir: string;
      buildMs: number;
      /** Total bytes of the built site, for the record and the ceiling. */
      bytes: number;
    }
  | { ok: false; reason: string };

/** The sandbox this needs: commands, and the one thing `SandboxLike` lacks. */
export type SiteSandbox = {
  sandboxId: string;
  commands: { run: (cmd: string, opts?: Record<string, unknown>) => Promise<unknown> };
  files: { read: (path: string, opts?: Record<string, unknown>) => Promise<unknown> };
  kill: () => Promise<unknown>;
};

export type SiteBuildDeps = {
  createSandbox: (opts: { timeoutMs: number; apiKey: string }) => Promise<SiteSandbox>;
};

async function realCreateSiteSandbox(opts: {
  timeoutMs: number;
  apiKey: string;
}): Promise<SiteSandbox> {
  const { Sandbox } = await import("e2b");
  return (await Sandbox.create({
    timeoutMs: opts.timeoutMs,
    apiKey: opts.apiKey,
  })) as unknown as SiteSandbox;
}

/** PURE: exit code and stderr out of whatever the SDK handed back. */
export function commandFailed(res: unknown): { failed: boolean; detail: string } {
  const r = (res ?? {}) as { exitCode?: unknown; stderr?: unknown; stdout?: unknown };
  const code = typeof r.exitCode === "number" ? r.exitCode : 0;
  const detail = [r.stderr, r.stdout]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .slice(-2000);
  return { failed: code !== 0, detail };
}

/**
 * The script the sandbox runs to package what the build wrote.
 *
 * PURE and exported so a guard can read it without a sandbox. It enforces the
 * ceilings INSIDE the sandbox: a 2 GB output directory must be refused before
 * anything tries to carry it across, not after.
 */
export function manifestScript(outDir: string, maxFiles: number, maxBytes: number): string {
  return [
    `cd /home/user/repo`,
    `export PATH="$HOME/.bun/bin:$PATH"`,
    `test -d ${quoteShellArg(outDir)} || { echo "SUPAPROD_NO_OUTPUT" >&2; exit 3; }`,
    `bun -e ${quoteShellArg(
      [
        `const fs=require("fs"),p=require("path");`,
        `const root=${JSON.stringify(outDir)};`,
        `let files=[],bytes=0;`,
        `const walk=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){`,
        `const f=p.join(d,e.name);`,
        `if(e.isDirectory()){walk(f);continue;}`,
        `const b=fs.readFileSync(f);bytes+=b.length;`,
        `files.push({path:p.relative(root,f).split(p.sep).join("/"),b64:b.toString("base64")});`,
        `if(files.length>${maxFiles}||bytes>${maxBytes})` +
          `{console.error("SUPAPROD_TOO_BIG "+files.length+" "+bytes);process.exit(4);}`,
        `}};`,
        `walk(root);`,
        `fs.writeFileSync("/tmp/supaprod-site.json",JSON.stringify({bytes,files}));`,
        `console.log("SUPAPROD_OK "+files.length+" "+bytes);`,
      ].join(""),
    )}`,
  ].join(" && ");
}

/**
 * Build a static site from a repo at a ref, and return what it wrote.
 *
 * NEVER THROWS. Every failure is a `reason` a person can read, because this
 * runs behind a preview press and the alternative is the silence P-128 exists
 * to end.
 */
export async function buildStaticSite(args: {
  repo: string;
  ref: string;
  token: string;
  /** The build script name, from `repoShape`. */
  script: string;
  /** Where that tool writes, from `repoShape`. Never guessed here. */
  outDir: string;
  /** The tool that decided the directory, for the record. */
  tool: string;
  deps?: SiteBuildDeps;
}): Promise<SiteBuildResult> {
  const apiKey = e2bApiKey();
  if (!apiKey) {
    return {
      ok: false,
      reason: "No build sandbox is configured, so this site could not be built here.",
    };
  }
  let ref: string;
  try {
    ref = assertSafeRef(args.ref);
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "That ref cannot be cloned." };
  }

  const deps = args.deps ?? { createSandbox: realCreateSiteSandbox };
  const timeoutMs = resolveTimeoutMs(SITE_BUILD_TIMEOUT_MS);
  const startedAt = Date.now();
  let sandbox: SiteSandbox | null = null;
  const clean = (s: string) => redactSecrets(s, [args.token]);

  try {
    sandbox = await deps.createSandbox({ timeoutMs, apiKey });

    /* Clone and install, with `defaultSetup`'s credential handling unchanged. */
    for (const step of withGitToken(defaultSetup(args.repo, ref), args.token)) {
      const res = await sandbox.commands.run(step.run, {
        timeoutMs,
        envs: { ...(step.envs ?? {}) },
      });
      const { failed, detail } = commandFailed(res);
      if (failed) {
        return {
          ok: false,
          reason: `The site could not be prepared (${step.name}): ${clean(detail) || "no output"}`,
        };
      }
    }

    /* The repo's own build, by the name its package.json gave it. */
    const buildCmd =
      `cd /home/user/repo && export PATH="$HOME/.bun/bin:$PATH" && ` +
      `bun run ${quoteShellArg(args.script)}`;
    const buildRes = await sandbox.commands.run(buildCmd, { timeoutMs });
    const build = commandFailed(buildRes);
    if (build.failed) {
      return {
        ok: false,
        reason: `The build failed: ${clean(build.detail) || "it exited non-zero and said nothing."}`,
      };
    }
    const buildMs = Date.now() - startedAt;

    const packRes = await sandbox.commands.run(
      manifestScript(args.outDir, MAX_SITE_FILES, MAX_SITE_BYTES),
      { timeoutMs },
    );
    const pack = commandFailed(packRes);
    if (pack.failed) {
      if (pack.detail.includes("SUPAPROD_NO_OUTPUT")) {
        return {
          ok: false,
          reason: `The build ran but wrote nothing to ${args.outDir}, which is where a ${args.tool} build puts its site.`,
        };
      }
      if (pack.detail.includes("SUPAPROD_TOO_BIG")) {
        return {
          ok: false,
          reason:
            `The built site is past what this path carries (${MAX_SITE_FILES} files, ` +
            `${Math.round(MAX_SITE_BYTES / (1024 * 1024))} MB). Deploy it your way and hand the address back.`,
        };
      }
      return { ok: false, reason: `The build output could not be packaged: ${clean(pack.detail)}` };
    }

    const raw = await sandbox.files.read("/tmp/supaprod-site.json");
    const text = typeof raw === "string" ? raw : new TextDecoder().decode(raw as ArrayBuffer);
    const parsed = JSON.parse(text) as {
      bytes?: number;
      files?: Array<{ path?: string; b64?: string }>;
    };
    const files: SiteFile[] = (parsed.files ?? [])
      .filter((f): f is { path: string; b64: string } => !!f.path && typeof f.b64 === "string")
      .map((f) => ({ path: f.path, content: f.b64, encoding: "base64" as const }));
    if (files.length === 0) {
      return { ok: false, reason: `The build wrote no files into ${args.outDir}.` };
    }
    return {
      ok: true,
      files,
      tool: args.tool,
      outDir: args.outDir,
      buildMs,
      bytes: parsed.bytes ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      reason: clean(e instanceof Error ? e.message : "The build did not finish and said nothing."),
    };
  } finally {
    /* The sandbox is billed by the minute and outlives a thrown error. */
    try {
      await sandbox?.kill();
    } catch {
      /* a sandbox we could not kill is the provider's to reap */
    }
  }
}
