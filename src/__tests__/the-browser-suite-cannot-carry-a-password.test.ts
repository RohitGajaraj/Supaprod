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
 * `Cadence!Demo2026` has to contain `Cadence!Demo2026`, which puts the secret
 * back into git in the file whose job is to keep it out. So this matches the
 * SHAPE instead — a password-ish name bound to a string literal — which also
 * catches the next credential, not merely the one already burned.
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

  it("does not fire on prose describing the defect, which both files now carry", () => {
    expect(
      hardcodedSecretsIn('// This file kept its own DEMO_PASSWORD = "Cadence!Demo2026".'),
    ).toEqual([]);
    expect(hardcodedSecretsIn('/* DEMO_PASSWORD = "Cadence!Demo2026" sat here. */')).toEqual([]);
  });
});
