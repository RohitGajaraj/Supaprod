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
import { CHECK_NAMES } from "@/lib/exec/check-names";

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
 * Credential shapes that must never leave this module in captured output.
 *
 * Pattern matching is the SECOND line of defence, not the first. The first is not
 * putting the credential in the command at all (see {@link defaultSetup}). This
 * exists because `git` echoes the remote URL into stderr on a failed clone, and that
 * stderr flows into the tool result, the model's context, and the stored run record.
 * A leak there is durable and it is replayed into future prompts.
 */
const SECRET_PATTERNS: RegExp[] = [
  // GitHub tokens: app installation (ghs_), classic PAT (ghp_), fine-grained, OAuth.
  /\bgh[pousr]_[A-Za-z0-9]{16,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
  // Any credential embedded in a URL, which is the exact shape a clone URL takes.
  /(https?:\/\/)[^/\s:@]+:[^/\s@]+@/g,
  /\be2b_[A-Za-z0-9]{16,}/g,
];

const REDACTED = "[redacted]";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A GIT REF IS UNTRUSTED INPUT, AND IT SHARED A COMMAND LINE WITH A WRITE TOKEN.
 *
 * `defaultSetup` interpolated `ref` unquoted into the clone, on the one command
 * in this whole file that carries `$SUPAPROD_GIT_TOKEN` in its environment --
 * and BEFORE the `git remote set-url` scrub and the `! grep -q "x-access-token"`
 * assertion that follow it. The header above that step says the token is never
 * interpolated into a command string. That was true of the token and false of
 * the value two words to its left.
 *
 * The value is not ours. `changesetRef` returns `changeset.branch` or, failing
 * that, the repo's `default_branch` straight from the GitHub API -- a name the
 * repo's owner chooses. `git check-ref-format --branch` accepts `a;id`,
 * `a$(id)`, `` a`id` ``, `a|id`, `a&&id` and `a'id`, so a branch name was a way
 * to run a command next to a token with push access to the customer's repo.
 *
 * Two guards, because either alone can be argued around:
 *
 *   1. REFUSE what is not a plausible ref. A branch name is a constrained value,
 *      so an allowlist is honest here in a way it would not be for free text.
 *      Refusing beats sanitising: a mangled ref would clone the wrong thing.
 *   2. QUOTE what survives. POSIX single quotes take everything literally, and
 *      the only character that needs care is `'` itself, closed and re-opened
 *      through a backslash. Belt and braces, so a future loosening of the
 *      allowlist cannot silently reopen this.
 */
const REF_ALLOWED = /^[A-Za-z0-9._\/-]{1,255}$/;

export function assertSafeRef(ref: string): string {
  // git's own rules, the subset that matters: no leading dash (it would read as
  // a flag), no `..` (path traversal in a ref), no trailing `.lock`, no leading
  // or trailing slash, and nothing outside the allowlist.
  if (
    !REF_ALLOWED.test(ref) ||
    ref.startsWith("-") ||
    ref.startsWith("/") ||
    ref.endsWith("/") ||
    ref.endsWith(".lock") ||
    ref.includes("..")
  ) {
    throw new Error(
      `Refusing to clone: ${JSON.stringify(ref)} is not a usable git ref. ` +
        `A ref may contain letters, digits, dot, underscore, slash and hyphen.`,
    );
  }
  return ref;
}

/** POSIX single-quoting. Everything inside is literal; only `'` needs escaping. */
export function quoteShellArg(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/**
 * PURE: strip credentials from a captured stream.
 *
 * `literals` are the exact secret values this run was handed, which is the reliable
 * half; the patterns catch a credential we were never told about (one baked into the
 * repo's own CI config, say). Short literals are ignored deliberately: redacting a
 * 3-character "secret" would blank out half of normal build output and teach everyone
 * to distrust the redaction.
 */
export function redactSecrets(s: string, literals: string[] = []): string {
  let out = typeof s === "string" ? s : "";
  for (const lit of literals) {
    if (typeof lit === "string" && lit.length >= 8) {
      out = out.replace(new RegExp(escapeRe(lit), "g"), REDACTED);
    }
  }
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, (m) =>
      m.endsWith("@") ? `${m.split("//")[0]}//${REDACTED}@` : REDACTED,
    );
  }
  return out;
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

/** The env var the clone step reads its credential from. Scoped to that step only. */
export const GIT_TOKEN_ENV = "SUPAPROD_GIT_TOKEN";

/**
 * The commands that put this repo's toolchain in a fresh sandbox.
 *
 * Bun is installed per run because the default template does not carry it (smoke
 * test, finding 2). `--frozen-lockfile` so a sandbox can never silently resolve a
 * different dependency tree than CI would.
 *
 * THE CREDENTIAL HANDLING HERE IS THE SECURITY-CRITICAL PART. The threat model is
 * not hypothetical: this sandbox exists precisely to run UNTRUSTED code. `bun
 * install` executes the repo's postinstall scripts and `bun test` executes its test
 * files, both of which an attacker controls if they control the repo. So the GitHub
 * installation token, which carries WRITE access, must be unreachable by the time
 * either runs. Three rules, and all three are needed:
 *
 *   1. THE TOKEN IS NEVER INTERPOLATED INTO A COMMAND STRING. It arrives in the
 *      clone step's own `envs` and is expanded by the shell inside the sandbox, so
 *      it never exists in anything we build, log, store, or hand to a model.
 *   2. THE CLONE SCRUBS ITS OWN CREDENTIAL, IN THE SAME COMMAND. `git clone` with a
 *      credential in the URL PERSISTS it into `.git/config`, where any postinstall
 *      script can read it. `git remote set-url` rewrites it to the bare URL
 *      immediately, before anything else runs.
 *   3. THE SCRUB IS ASSERTED, NOT ASSUMED. The final `grep` fails the command if any
 *      credential survived in `.git/config`. A failed setup step aborts the whole
 *      run, so the failure mode is "no checks ran" rather than "untrusted code ran
 *      next to a live write token". Fail closed, because the alternative is handing
 *      an attacker push access to the customer's repository.
 *
 * The token is deliberately absent from the `deps` step and from every check.
 */
export function defaultSetup(repo: string, ref: string): ExecCommandSpec[] {
  const bare = `https://github.com/${repo}.git`;
  return [
    { name: "install-bun", run: "curl -fsSL https://bun.sh/install | bash" },
    {
      name: "clone",
      // `$SUPAPROD_GIT_TOKEN` is expanded by the sandbox's shell, never by us.
      run: [
        `git clone --depth 1 --branch ${quoteShellArg(assertSafeRef(ref))} "https://x-access-token:$${GIT_TOKEN_ENV}@github.com/${repo}.git" /home/user/repo`,
        `cd /home/user/repo`,
        `git remote set-url origin "${bare}"`,
        // Fail loudly if the credential outlived the rewrite.
        `! grep -q "x-access-token" .git/config`,
      ].join(" && "),
      envs: {},
    },
    {
      name: "deps",
      run: 'cd /home/user/repo && export PATH="$HOME/.bun/bin:$PATH" && bun install --frozen-lockfile',
    },
  ];
}

/** Attach the clone credential to the clone step, and to nothing else. */
export function withGitToken(setup: ExecCommandSpec[], token: string): ExecCommandSpec[] {
  return setup.map((s) =>
    s.name === "clone" ? { ...s, envs: { ...s.envs, [GIT_TOKEN_ENV]: token } } : s,
  );
}

/**
 * The checks worth running before an agent opens a pull request.
 *
 * THE NAMES COME FROM `@/lib/exec/check-names` AND THE COMMANDS STAY HERE
 * (gap #18). A surface showing a customer what we run needs the names and must
 * never be able to import a shell line, so the shared half is the vocabulary
 * and the server half is the mechanism. Built by mapping `CHECK_NAMES` so the
 * two lists cannot drift into disagreeing about what "the three checks" are.
 */
export function defaultChecks(): ExecCommandSpec[] {
  const cd = 'cd /home/user/repo && export PATH="$HOME/.bun/bin:$PATH" && ';
  const RUN: Record<string, string> = {
    typecheck: `${cd}bunx tsc --noEmit`,
    test: `${cd}bun test`,
    lint: `${cd}bun run lint`,
  };
  return CHECK_NAMES.map((c) => ({ name: c.name, run: RUN[c.name] }));
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

  // Every literal the caller declared secret, plus every per-command env value,
  // because a credential passed as an env is by definition a secret this run holds
  // and the caller should not have to declare it twice.
  const secrets = [
    ...(spec.secrets ?? []),
    ...[...(spec.setup ?? []), ...spec.commands].flatMap((c) => Object.values(c.envs ?? {})),
  ];

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
    // Per-command envs win, so a credential is scoped to the one step that needs it
    // and is absent from every step that runs untrusted repo code.
    const envs = { ...(spec.envs ?? {}), ...(c.envs ?? {}) };
    let r: ExecCommandResult;
    try {
      const v = await sandbox!.commands.run(c.run, { timeoutMs: remaining, envs });
      r = toCommandResult(c.name, Date.now() - started, v);
    } catch (e) {
      r = toCommandResult(c.name, Date.now() - started, undefined, e);
    }
    // Redact BEFORE the result escapes this function, so there is no path by which
    // an unredacted stream reaches a caller, a prompt, or the run record.
    return {
      ...r,
      stdout: redactSecrets(r.stdout, secrets),
      stderr: redactSecrets(r.stderr, secrets),
    };
  };

  try {
    sandbox = await deps.createSandbox({ timeoutMs, apiKey });

    // SETUP is infrastructure, not evidence. A failed clone or install says nothing
    // about the code, so it aborts the run as an infra failure instead of being
    // reported as a red check that an agent would then try to "fix" in the source.
    for (const s of spec.setup ?? []) {
      const r = await runOne(s);
      if (r.exitCode !== 0) {
        // r.stderr is already redacted by runOne. Redacting again is cheap and means
        // this line stays safe even if someone later reorders the two.
        infraError = redactSecrets(
          `setup step "${s.name}" failed (exit ${r.exitCode}): ${r.stderr.slice(0, 400)}`,
          secrets,
        );
        break;
      }
    }

    if (!infraError) {
      for (const c of spec.commands) {
        results.push(await runOne(c));
      }
    }
  } catch (e) {
    infraError = redactSecrets(e instanceof Error ? `${e.name}: ${e.message}` : String(e), secrets);
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

  return {
    provider,
    results,
    infraError,
    verdict: execVerdictFromRun(provider, results, infraError),
  };
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
