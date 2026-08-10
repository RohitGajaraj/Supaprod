import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

import { login, STORAGE_STATE, findRepoRoot } from "./helpers/auth";

/**
 * Log in ONCE for the whole run and save the result to disk.
 *
 * WHY THIS FILE EXISTS. Eight of the nine specs opened by logging in on a
 * throwaway page, calling `context.cookies()`, and replaying the result per
 * test with `addCookies`. That never carried a session: the Supabase client is
 * built with `auth: { storage: localStorage }`, so the session is a
 * localStorage entry and `context.cookies()` cannot see it. The mechanism
 * stayed invisible because every replay was followed by
 * `if (page.url().includes('/login')) await login(page)`, which quietly did the
 * whole job. So the suite passed while its own optimisation did nothing, and
 * paid a full interactive login per test.
 *
 * `storageState` is the fix because it captures localStorage as well as
 * cookies. This project runs first, every other project depends on it, and
 * each test starts already signed in.
 *
 * The header on `helpers/auth.ts` reported this and deliberately left the fix
 * to the wiring lane rather than half-migrating the file. This is that fix.
 */
setup("authenticate once for the run", async ({ page }) => {
  const ok = await login(page);
  if (!ok) {
    throw new Error(
      "Could not sign in with the demo account. The dev server must be running on " +
        "http://localhost:8080 and the demo user must exist. Nothing downstream can " +
        "be trusted without this, so the run stops here rather than reporting a " +
        "wall of auth failures that all mean one thing.",
    );
  }

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });

  // Prove the artifact carries the session rather than assuming it does. An
  // empty storageState file is the exact failure this project exists to
  // prevent, and it would otherwise show up as every later spec redirecting to
  // /login for no stated reason.
  const saved = JSON.parse(fs.readFileSync(STORAGE_STATE, "utf8")) as {
    origins?: { localStorage?: { name: string }[] }[];
  };
  const keys = (saved.origins ?? []).flatMap((o) => (o.localStorage ?? []).map((e) => e.name));
  const hasSession = keys.some((k) => /supabase|sb-/i.test(k));
  if (!hasSession) {
    throw new Error(
      `Signed in, but the saved storageState carries no Supabase session key. Found: ${
        keys.join(", ") || "nothing"
      }. Repo root resolved to ${findRepoRoot()}.`,
    );
  }
});
