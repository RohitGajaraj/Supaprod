import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { defineConfig, devices } from "@playwright/test";

import { STORAGE_STATE, findRepoRoot } from "./e2e/helpers/auth";

/**
 * READ `.env` SO NOBODY HAS TO EXPORT ANYTHING BY HAND.
 *
 * `E2E_DEMO_PASSWORD` is the one secret the suite needs, and requiring an
 * `export` before every run is how a working harness becomes an unused one: it
 * fails for the next person in a way that looks like the suite is broken rather
 * than unconfigured. `.env` is already this repo's home for secrets and is
 * gitignored, so the credential can live there and never reach git.
 *
 * Parsed by hand rather than adding a dotenv dependency for four lines, and it
 * never OVERWRITES a variable already set, so an explicit export still wins for
 * a one-off run against another account.
 */
function loadEnvFile(): void {
  const file = path.join(findRepoRoot(), ".env");
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    process.env[key] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

loadEnvFile();


/**
 * A SPEC THAT NOBODY REVIEWED MUST NOT RUN.
 *
 * `testDir: "./e2e"` collects every `*.spec.ts` in that directory, tracked or not.
 * Sessions driving a browser drop throwaway probe specs there and leave them behind:
 * `zz-probe.spec.ts` and `qq-probe.spec.ts` were both found on 2026-09-02, written by
 * audit agents that had already exited. A blocklist of name prefixes cannot work,
 * because the names are arbitrary and the second one appeared minutes after the rule
 * for the first was written.
 *
 * So key on the property that actually distinguishes them: **a real spec is tracked in
 * git, and a scratch spec never is.** Every one of the 16 reviewed specs is tracked; a
 * new one joins the run the moment it is `git add`ed.
 *
 * This matters because an unreviewed spec is not merely noise. `round-8.spec.ts` and
 * `phase-3-visible-agency.spec.ts` both sign into a real environment and create real
 * rows, and both carry an explicit opt-in guard for exactly that reason. A probe written
 * ad hoc by an agent carries no such guard, and on 2026-08-25 that shape created six
 * duplicate tracks which starved the one track a session was watching.
 *
 * Loud, never silent: skipped files are named on stderr. If git is unavailable the list
 * is empty and everything runs, because a config that silently skips the whole suite is
 * worse than the problem it solves.
 */
function unreviewedSpecs(): string[] {
  try {
    const tracked = new Set(
      execFileSync("git", ["ls-files", "e2e"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
        .split("\n")
        .filter(Boolean),
    );
    const found = fs
      .readdirSync("e2e")
      .filter((f) => f.endsWith(".spec.ts"))
      .map((f) => `e2e/${f}`)
      .filter((f) => !tracked.has(f));
    if (found.length > 0) {
      console.warn(
        `[playwright] Skipping ${found.length} untracked spec(s), which nobody reviewed: ${found.join(", ")}\n` +
          `[playwright] If one of these is real, \`git add\` it and it joins the run. See docs/conventions/workspace-hygiene.md.`,
      );
    }
    return found;
  } catch {
    return [];
  }
}

const UNREVIEWED_SPECS = unreviewedSpecs();

export default defineConfig({
  testDir: "./e2e",
  // Two gates, and the first is the one that holds. See unreviewedSpecs() above.
  testIgnore: [
    ...UNREVIEWED_SPECS,
    // Belt and braces for the case the first gate cannot catch: a scratch spec that
    // somebody actually committed. `zz-` is the documented prefix for a throwaway.
    /(^|\/)(zz|qq)-.*\.spec\.ts$/,
  ],
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 60000,
  reporter: [
    ["html", { outputFolder: "./test-results/html-report", open: "never" }],
    ["junit", { outputFile: "./test-results/junit.xml" }],
    ["list"],
  ],
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "on",
    video: "off",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    /**
     * Sign in once, save the session, and let every other project start from
     * it. See `e2e/auth.setup.ts` for why this is not optional: the per-test
     * cookie replay the specs used to do could never carry a Supabase session,
     * because that session is a localStorage entry and `context.cookies()`
     * cannot see one. `storageState` captures localStorage too.
     */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      /**
       * THE ONE TEST THAT TYPES A PASSWORD RECORDS NOTHING.
       *
       * Every other project starts from `storageState`, so `auth.setup.ts` is
       * the only place a credential ever reaches a page — which makes this the
       * only project whose artifacts can contain one.
       *
       * Measured on 2026-08-11, not assumed. A trace of a login carries the
       * password in TWO independent places:
       *
       *   "method":"fill","params":{...,"value":"<the password>"}
       *   ["INPUT",{"__playwright_value_":"<the password>", "type":"password"…
       *
       * the recorded action, and the `__playwright_value_` attribute stamped
       * into every DOM snapshot so the trace viewer can replay the form. Both
       * survive clearing the field afterwards, because neither is the live DOM.
       * `error-context.md` IS the live DOM — an aria snapshot, which renders a
       * password field as `- textbox "Password": <plaintext>` — and that one is
       * handled in `helpers/auth.ts` by emptying the field before we return.
       *
       * The trap worth naming: the browser masks the field visually, so a
       * SCREENSHOT of the failing moment shows dots. The artifact everyone
       * thinks to protect is the safe one.
       *
       * Nothing diagnostic is lost. This test's failure message already says
       * exactly what went wrong and what to do about it; a trace of it adds a
       * credential and no information. `test-results/` is gitignored so none of
       * this could be committed, but it is precisely the directory somebody
       * zips onto a bug report.
       */
      use: { trace: "off", screenshot: "off", video: "off" },
    },
    {
      name: "chromium-desktop",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: "chromium-tablet",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: "chromium-mobile",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 667 },
        storageState: STORAGE_STATE,
      },
    },
  ],
});
