/**
 * SBX-1: the E2B execution backend behind the `ExecProvider` seam.
 *
 * This is the half of the sandbox decision that actually runs code. The seam, the
 * $0 GitHub Actions floor and the pure verdict mapping live in `provider.ts`, which
 * a CLIENT component imports; the E2B SDK and the API key live only here.
 *
 * WHY E2B AND NOT CLOUDFLARE, in one line, with the full argument in
 * `docs/decisions/build-sandbox-vendor.md`: Lovable owns the Workers deployment, so
 * Cloudflare would have been a new billing relationship too, which was the entire
 * basis of the earlier recommendation.
 *
 * FOUR THINGS THE LIVE SMOKE TEST TAUGHT, all of which shape the code below and none
 * of which were guessable from the docs:
 *
 *   1. A NON-ZERO EXIT THROWS. `commands.run("exit 7")` raises `CommandExitError`
 *      carrying `exitCode`; it does NOT return a result with a non-zero code. Code
 *      that assumed the return value would have treated every failing test suite as
 *      an infrastructure error, which is a false GREEN on the merge gate. This is
 *      the single most important line in this file.
 *   2. BUN IS NOT IN THE DEFAULT TEMPLATE. `which bun` finds nothing; the image
 *      carries node v20.9.0, npm, python 3.11.6 and git. This repo runs on Bun, so
 *      Bun is installed in setup. A custom E2B template would make that a one-time
 *      cost instead of a per-run one, and that is the first optimisation to make
 *      once this is used in anger.
 *   3. Sandbox creation takes about 500ms and the full create-run-kill round trip
 *      about 2s. Fast enough to sit inside an agent's loop.
 *   4. `git` IS present, so cloning needs no extra install.
 *
 * COST DISCIPLINE. Billing is per second of sandbox life, so an orphaned sandbox
 * bills until its own timeout expires. Every path here kills the sandbox in a
 * `finally`, and every sandbox is created with a hard `timeoutMs` so even a lost
 * kill (a Worker torn down mid-run, which is a real failure mode in this codebase)
 * cannot bill forever. The founder has NOT set a spend cap, deliberately, because
 * there is no card on file and the account holds a one-time $100 credit, so the
 * credit itself is the ceiling. That makes the in-code bound the only thing standing
 * between a runaway agent loop and a dead sandbox budget.
 *
 * .server.ts: Worker-only; never bundled to the client.
 */
import {
  execVerdictFromRun,
  type ExecCommandResult,
  type ExecCommandSpec,
  type ExecProvider,
  type ExecRunOutcome,
  type ExecRunSpec,
  type CiCheckLite,
  type ExecVerdict,
} from "./provider";
import { overallFromChecks, mergeReadinessFromCi } from "@/lib/ai/studio-ci";

/** Whole-run ceiling. Past this the sandbox is killed and the run reads as failed. */
export const E2B_DEFAULT_TIMEOUT_MS = 10 * 60_000;

/**
 * Hard cap, above the free tier's own 1-hour session limit is pointless and below it
 * is where we want to live anyway. A caller asking for more gets this.
 */
export const E2B_MAX_TIMEOUT_MS = 30 * 60_000;

/** Per-stream capture cap. Enough to diagnose, small enough to store and to prompt with. */
export const E2B_MAX_OUTPUT_CHARS = 20_000;

/** Read the key at call time, never at module load, so a test can set it per case. */
export function e2bApiKey(): string | null {
  const k = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.E2B_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

export function e2bAvailable(): boolean {
  return e2bApiKey() !== null;
}

/** PURE: clamp a requested timeout into the supported band. */
export function resolveTimeoutMs(requested?: number): number {
  if (!requested || !Number.isFinite(requested) || requested <= 0) return E2B_DEFAULT_TIMEOUT_MS;
  return Math.min(requested, E2B_MAX_TIMEOUT_MS);
}

/** PURE: bound one captured stream so a chatty build cannot blow up a row or a prompt. */
export function clampOutput(s: unknown, max = E2B_MAX_OUTPUT_CHARS): string {
  const t = typeof s === "string" ? s : "";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n...[truncated ${t.length - max} chars]`;
}

/**
 * PURE: normalise whatever `commands.run` produced into one result.
 *
 * Handles BOTH shapes deliberately, because the SDK uses both: a resolved value for
 * a zero exit, and a thrown `CommandExitError` for a non-zero one. Anything that is
 * neither (a network drop, an SDK bug) has no exit code at all, and is reported as
 * exit 1 with the message on stderr rather than being silently treated as a pass.
 */
export function toCommandResult(
  name: string,
  durationMs: number,
  value: unknown,
  thrown?: unknown,
): ExecCommandResult {
  if (thrown !== undefined) {
    const e = thrown as { exitCode?: number; stdout?: string; stderr?: string; message?: string };
    const hasExit = typeof e?.exitCode === "number";
    return {
      name,
      exitCode: hasExit ? (e.exitCode as number) : 1,
      stdout: clampOutput(e?.stdout),
      stderr: clampOutput(e?.stderr || e?.message || "command failed"),
      durationMs,
    };
  }
  const v = value as { exitCode?: number; stdout?: string; stderr?: string };
  return {
    name,
    exitCode: typeof v?.exitCode === "number" ? v.exitCode : 0,
    stdout: clampOutput(v?.stdout),
    stderr: clampOutput(v?.stderr),
    durationMs,
  };
}

/**
 * The commands that put this repo's toolchain in a fresh sandbox.
 *
 * Bun is installed per run because the default template does not carry it (smoke
 * test, finding 2). `--frozen-lockfile` so a sandbox can never silently resolve a
 * different dependency tree than CI would.
 */
export function defaultSetup(repoUrl: string, ref: string): ExecCommandSpec[] {
  return [
    { name: "install-bun", run: "curl -fsSL https://bun.sh/install | bash" },
    { name: "clone", run: `git clone --depth 1 --branch ${ref} ${repoUrl} /home/user/repo` },
    {
      name: "deps",
      run: 'cd /home/user/repo && export PATH="$HOME/.bun/bin:$PATH" && bun install --frozen-lockfile',
    },
  ];
}

/** The checks worth running before an agent opens a pull request. */
export function defaultChecks(): ExecCommandSpec[] {
  const cd = 'cd /home/user/repo && export PATH="$HOME/.bun/bin:$PATH" && ';
  return [
    { name: "typecheck", run: `${cd}bunx tsc --noEmit` },
    { name: "test", run: `${cd}bun test` },
    { name: "lint", run: `${cd}bun run lint` },
  ];
}

type SandboxLike = {
  sandboxId: string;
  commands: { run: (cmd: string, opts?: Record<string, unknown>) => Promise<unknown> };
  kill: () => Promise<unknown>;
};

export type E2BDeps = {
  /** Seam for tests, so the suite never touches the network or spends credit. */
  createSandbox: (opts: { timeoutMs: number; apiKey: string }) => Promise<SandboxLike>;
};

async function realCreateSandbox(opts: {
  timeoutMs: number;
  apiKey: string;
}): Promise<SandboxLike> {
  const { Sandbox } = await import("e2b");
  return (await Sandbox.create({
    timeoutMs: opts.timeoutMs,
    apiKey: opts.apiKey,
  })) as unknown as SandboxLike;
}

/**
 * Run a spec in a fresh E2B sandbox and return a merge verdict.
 *
 * Never throws. Every failure becomes an `infraError`, which
 * {@link execVerdictFromRun} maps to a REFUSAL rather than to the permissive
 * "neutral" an empty check list would otherwise produce.
 */
export async function runInE2B(
  spec: ExecRunSpec,
  deps: E2BDeps = { createSandbox: realCreateSandbox },
): Promise<ExecRunOutcome> {
  const provider = "e2b" as const;
  const apiKey = e2bApiKey();
  if (!apiKey) {
    return {
      provider,
      results: [],
      infraError: "E2B_API_KEY is not configured",
      verdict: execVerdictFromRun(provider, [], "E2B_API_KEY is not configured"),
    };
  }

  const timeoutMs = resolveTimeoutMs(spec.timeoutMs);
  const deadline = Date.now() + timeoutMs;
  const results: ExecCommandResult[] = [];
  let infraError: string | null = null;
  let sandbox: SandboxLike | undefined;

  const runOne = async (c: ExecCommandSpec): Promise<ExecCommandResult> => {
    const started = Date.now();
    const remaining = deadline - started;
    if (remaining <= 0) {
      return {
        name: c.name,
        exitCode: 1,
        stdout: "",
        stderr: "the run's time budget was exhausted before this command started",
        durationMs: 0,
        timedOut: true,
      };
    }
    try {
      const v = await sandbox!.commands.run(c.run, {
        timeoutMs: remaining,
        envs: spec.envs,
      });
      return toCommandResult(c.name, Date.now() - started, v);
    } catch (e) {
      return toCommandResult(c.name, Date.now() - started, undefined, e);
    }
  };

  try {
    sandbox = await deps.createSandbox({ timeoutMs, apiKey });

    // SETUP is infrastructure, not evidence. A failed clone or install says nothing
    // about the code, so it aborts the run as an infra failure instead of being
    // reported as a red check that an agent would then try to "fix" in the source.
    for (const s of spec.setup ?? []) {
      const r = await runOne(s);
      if (r.exitCode !== 0) {
        infraError = `setup step "${s.name}" failed (exit ${r.exitCode}): ${r.stderr.slice(0, 400)}`;
        break;
      }
    }

    if (!infraError) {
      for (const c of spec.commands) {
        results.push(await runOne(c));
      }
    }
  } catch (e) {
    infraError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  } finally {
    // Billing is per second of sandbox life, so this kill is the cost control. It is
    // best-effort by necessity: if it throws we still have the create-time timeoutMs
    // as the backstop, and swallowing its error must never turn a good run bad.
    if (sandbox) {
      try {
        await sandbox.kill();
      } catch {
        /* the sandbox's own timeout will reap it */
      }
    }
  }

  return { provider, results, infraError, verdict: execVerdictFromRun(provider, results, infraError) };
}

/**
 * The E2B provider descriptor.
 *
 * `available` is computed per access rather than frozen at module load, so adding the
 * key does not require a redeploy to take effect, and a missing key degrades to the
 * $0 floor instead of erroring.
 *
 * `previewsBuilds` is false ON PURPOSE. E2B can serve a port, but we decided not to
 * offer a preview: the build agent works in the CUSTOMER's repo and their pull
 * requests already carry their own preview deploys, so ours would duplicate
 * infrastructure they own and be less trustworthy than theirs. See the decision doc.
 */
export const e2bProvider: ExecProvider = {
  id: "e2b",
  label: "Supaprod sandbox",
  get available(): boolean {
    return e2bAvailable();
  },
  previewsBuilds: false,
  executes: true,
  verdictFromChecks(checks: CiCheckLite[]): ExecVerdict {
    const overall = overallFromChecks(checks);
    const { allowed, reason } = mergeReadinessFromCi(overall);
    return { provider: "e2b", overall, mayProceed: allowed, reason };
  },
};
