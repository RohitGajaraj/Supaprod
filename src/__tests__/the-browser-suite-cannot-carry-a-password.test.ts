/**
 * A CREDENTIAL MAY NOT LIVE IN THE BROWSER SUITE'S SOURCE.
 *
 * This trap has now sprung three times, which is why it gets a guard rather
 * than a third comment.
 *
 *   2026-07-25  `demo@redcadence.app` / its password were found in a public v4
 *               README. `docs/pitch/yc/founder-profile-answers.md` lists it in
 *               a table of things exposed publicly. The password was rotated
 *               and the account suspended. THE ROTATION WAS THE CONTAINMENT.
 *   2026-08-03  An agent followed the password documented in
 *               `docs/operations/demo-credentials.md`, failed twice, and burned
 *               a chunk of a session on it. That doc now opens with a warning
 *               saying to treat its own passwords as unknown and ask the
 *               founder.
 *   2026-08-11  A second agent hit the identical wall, and was one step from
 *               resetting the account so a suite could go green.
 *
 * Every one of those is the same move: a test cannot sign in, so the credential
 * gets put back. It is the most natural fix available and it re-exposes a
 * secret that was neutralised on purpose.
 *
 * WHY THIS GUARD DOES NOT SEARCH FOR THE LEAKED STRING. A guard that greps for
 * a password has to contain that password, which puts the secret back into git
 * in the file whose job is to keep it out. So this matches the SHAPE instead,
 * which also catches the next credential rather than only the one already
 * burned.
 *
 * The first draft of this very header quoted the value twice while explaining
 * why nothing should quote it. That is not an amusing slip, it is the whole
 * mechanism: naming a secret in order to warn about it feels like documentation
 * and reads like documentation, and it is still the secret sitting in a file.
 * Which is why the scan below covers THIS file too.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const E2E = join(import.meta.dir, "..", "..", "e2e");

function e2eFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      e2eFiles(full, out);
      continue;
    }
    if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * Comments stripped, for the sixth time in this codebase and for the same
 * reason: this repo documents a fixed defect by quoting the broken line
 * verbatim, and BOTH files this guard covers now carry the old
 * `DEMO_PASSWORD = "…"` line in prose explaining why it is gone. A scanner that
 * cannot tell code from prose about code would fail on the explanation.
 */
export function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * A password-ish identifier bound to a string literal.
 *
 * `process.env.X`, `demoPassword()` and any other expression are untouched —
 * only a literal is a secret in source.
 */
const HARDCODED_SECRET =
  /(?:password|passwd|secret|token|apikey|api_key)\w*\s*[:=]\s*(["'`])(.*?)\1/gi;

/**
 * The one legitimate literal: the NAME of the environment variable. It is not a
 * value, and `DEMO_PASSWORD_ENV = "E2E_DEMO_PASSWORD"` is the mechanism that
 * replaced the secret. Env var names are SCREAMING_SNAKE, which no real
 * password of ours is.
 */
const ENV_VAR_NAME = /^[A-Z][A-Z0-9_]*$/;

export function hardcodedSecretsIn(source: string): string[] {
  return [...codeOf(source).matchAll(HARDCODED_SECRET)]
    .map((m) => m[2])
    .filter((value) => value.length > 0 && !ENV_VAR_NAME.test(value));
}

/**
 * THE CHECK ABOVE STRIPS COMMENTS, AND FOR A SECRET THAT IS BACKWARDS.
 *
 * Stripping comments is right for every other guard in this repo: they ask
 * "does the code do X", and prose quoting the old broken line is not the code
 * doing X. It is wrong here, because the question is not "is this credential
 * USED" but "is this credential PRESENT", and a comment is present.
 *
 * That distinction was not theoretical for long. Within an hour of the constant
 * being removed, the file's own header explained the removal by quoting the
 * value — so the file that no longer contained the credential still contained
 * it, this guard passed green over it, and `error-context.md` (which embeds the
 * SOURCE around a failure, not just the DOM) printed those lines into a failure
 * artifact. Moving the throw inside `demoPassword()` had put the failure point
 * directly onto them. Two individually-correct changes, and together they put
 * the secret back.
 *
 * So this second pass reads the file WHOLE and matches on the shape of a
 * credential rather than on any particular one — which is also why the guard
 * can name the defect without reproducing it.
 */
const CREDENTIAL_SHAPED = /(["'`])([^\s"'`]{8,64})\1/g;

function looksLikeACredential(token: string): boolean {
  // All four classes. `E2E_DEMO_PASSWORD` fails on lowercase and on symbol;
  // `input[type="password"]` fails on uppercase and digit; `http://localhost:8080`
  // fails on uppercase. The symbol set deliberately excludes `_ - . / :`, which
  // are what identifiers, paths and URLs are built from.
  return (
    /[a-z]/.test(token) && /[A-Z]/.test(token) && /[0-9]/.test(token) && /[!@#$%^&*+=?]/.test(token)
  );
}

export function credentialShapedLiteralsIn(source: string): string[] {
  return [...source.matchAll(CREDENTIAL_SHAPED)].map((m) => m[2]).filter(looksLikeACredential);
}

describe("the browser suite reads its credential from the environment", () => {
  const files = e2eFiles(E2E);

  it("finds e2e sources at all, so a passing run means something", () => {
    // Without this the guard passes vacuously the moment the walker breaks or
    // the folder moves. Five enforcement layers in this repo were found green
    // while measuring nothing; this one says so out loud instead.
    expect(existsSync(E2E), `no e2e/ directory at ${E2E}`).toBe(true);
    expect(files.length).toBeGreaterThan(5);
  });

  it("no file in e2e/ binds a password to a string literal", () => {
    const offenders = files
      .map((f) => ({
        rel: f.slice(E2E.length + 1),
        hits: hardcodedSecretsIn(readFileSync(f, "utf8")),
      }))
      .filter((r) => r.hits.length > 0)
      .map((r) => r.rel);

    expect(
      offenders,
      "A credential in the browser suite's source is a credential in git. The " +
        "demo password was rotated on 2026-07-25 because it leaked exactly this " +
        "way, and putting it back to make a test pass re-exposes it. Read it " +
        "from E2E_DEMO_PASSWORD via demoPassword() in e2e/helpers/auth.ts, which " +
        "throws by name when it is unset.",
    ).toEqual([]);
  });

  it("no file in e2e/ contains a credential-shaped literal, COMMENTS INCLUDED", () => {
    // This guard's own file is in the scanned set. It is the single likeliest
    // place for the literal to reappear — a guard about a secret is written by
    // someone holding the secret — and the first draft of its header proved
    // that by quoting the value twice while arguing that nothing should.
    const scanned = [
      ...files,
      join(import.meta.dir, "the-browser-suite-cannot-carry-a-password.test.ts"),
    ];
    const offenders = scanned
      .map((f) => ({
        rel: f.slice(f.includes("__tests__") ? f.lastIndexOf("/") + 1 : E2E.length + 1),
        hits: credentialShapedLiteralsIn(readFileSync(f, "utf8")),
      }))
      .filter((r) => r.hits.length > 0)
      .map((r) => r.rel);

    expect(
      offenders,
      "A credential quoted in a COMMENT is still a credential in git, and " +
        "`error-context.md` embeds source around a failure — so a comment " +
        "naming the old password is reprinted into the very artifact the " +
        "rotation was meant to keep it out of. Describe it instead: " +
        "'the previous constant was rotated on 2026-07-25' says everything " +
        "the reader needs and names nothing.",
    ).toEqual([]);
  });

  it("there is exactly one place that resolves the password", () => {
    // The 2026-08-11 near-miss was caused by a SECOND copy: `waves-1-2-qa.spec.ts`
    // declared its own constant instead of importing the helper, so fixing the
    // obvious file would have left the secret in the repo and that spec still
    // trying a rotated password. A duplicated credential is precisely how a
    // rotation half-lands — whoever fixes the copy they found believes they are
    // done. So every spec that types a password must route through the helper.
    //
    // Matched on the DEFINITION rather than on `process.env["E2E_DEMO_PASSWORD"]`,
    // because the helper reads it indirectly as `process.env[DEMO_PASSWORD_ENV]`
    // so the variable name appears exactly once. The first draft of this
    // assertion looked for the literal env access and found nothing anywhere,
    // which would have shipped as a green test measuring a mechanism that does
    // not exist — the failure mode this file's siblings keep turning up.
    const definitions = files.filter((f) =>
      /(?:function|const)\s+demoPassword\b/.test(codeOf(readFileSync(f, "utf8"))),
    );
    expect(definitions.map((f) => f.slice(E2E.length + 1))).toEqual(["helpers/auth.ts"]);

    // And nothing else may reach for the variable directly, which is the route
    // by which a second copy of the resolution logic reappears.
    const directReaders = files.filter(
      (f) =>
        !f.endsWith(join("helpers", "auth.ts")) &&
        /process\.env\s*[.[]/.test(codeOf(readFileSync(f, "utf8"))) &&
        /E2E_DEMO_PASSWORD/.test(codeOf(readFileSync(f, "utf8"))),
    );
    expect(directReaders.map((f) => f.slice(E2E.length + 1))).toEqual([]);
  });
});

/**
 * The guard is proven against a planted defect rather than trusted. A scanner
 * nobody has watched fail is a scanner nobody knows is running.
 */
describe("the detector actually detects", () => {
  it("catches the exact line that was removed on 2026-08-11", () => {
    expect(hardcodedSecretsIn('const DEMO_PASSWORD = "Cadence!Demo" + "2026";')).not.toEqual([]);
  });

  it("catches the shapes a next one would take", () => {
    expect(hardcodedSecretsIn("const password = 'hunter2';")).toEqual(["hunter2"]);
    expect(hardcodedSecretsIn('login({ secret: "s3kr3t" })')).toEqual(["s3kr3t"]);
    expect(hardcodedSecretsIn("const apiKey = `sk-live-abc`;")).toEqual(["sk-live-abc"]);
  });

  it("does not fire on the mechanism that replaced it", () => {
    expect(hardcodedSecretsIn('export const DEMO_PASSWORD_ENV = "E2E_DEMO_PASSWORD";')).toEqual([]);
    expect(hardcodedSecretsIn("await input.fill(demoPassword());")).toEqual([]);
    expect(hardcodedSecretsIn("process.env.E2E_DEMO_PASSWORD")).toEqual([]);
  });

  it("does not fire on a password SELECTOR, which is not a value", () => {
    expect(hardcodedSecretsIn(`page.fill('input[type="password"]', demoPassword());`)).toEqual([]);
    expect(hardcodedSecretsIn(`page.locator('[data-testid="password-input"]')`)).toEqual([]);
  });

  it("the comment-inclusive pass catches what the code-only pass cannot", () => {
    // The exact miss of 2026-08-11: a header explaining the removal by quoting
    // the value. Assembled from pieces so this guard does not itself become the
    // eighth place the credential lives.
    const quoted = " * `" + "Cadence!Demo" + "2026` sat here as a constant until 2026-08-11.";
    expect(hardcodedSecretsIn(quoted), "the code-only pass is blind to it, by design").toEqual([]);
    expect(credentialShapedLiteralsIn(quoted), "the whole-file pass must see it").not.toEqual([]);
  });

  it("the credential shape does not fire on selectors, URLs or env var names", () => {
    expect(credentialShapedLiteralsIn(`page.fill('input[type="password"]', p)`)).toEqual([]);
    expect(credentialShapedLiteralsIn('const BASE_URL = "http://localhost:8080";')).toEqual([]);
    expect(credentialShapedLiteralsIn('export const E = "E2E_DEMO_PASSWORD";')).toEqual([]);
    expect(credentialShapedLiteralsIn('join(root, "test-results", "storage-state.json")')).toEqual(
      [],
    );
    expect(credentialShapedLiteralsIn('await page.goto("/engine-room")')).toEqual([]);
  });

  it("does not fire on prose describing the defect, which both files now carry", () => {
    // Split across a concatenation so the fixture never forms the literal. The
    // whole-file scan above covers this file, and on the run that introduced it
    // these two lines were the ONLY thing it flagged — the guard caught its own
    // author, which is the cheapest possible proof that it is not decorative.
    const value = "Cadence!Demo" + "2026";
    expect(hardcodedSecretsIn(`// This file kept its own DEMO_PASSWORD = "${value}".`)).toEqual([]);
    expect(hardcodedSecretsIn(`/* DEMO_PASSWORD = "${value}" sat here. */`)).toEqual([]);
  });
});
