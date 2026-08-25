import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SIGNED_IN_HOME } from "../post-auth-home";

const ROOT = join(import.meta.dir, "..", "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/**
 * THE POST-AUTH HOME HAS ONE DEFINITION (R-15 mechanism 2).
 *
 * Promotion of `/start` is promised to be ONE reversible line. That promise
 * only holds while every "go to the app's home" door reads the same constant;
 * the drift this guard prevents is real — before it existed the answer was
 * spelled independently in login, signup, the public landing and seven
 * retired-route redirects. A future editor who needs the home should import
 * the constant, not re-type a literal that promotion will then miss.
 */
describe("the signed-in home is one value in one place", () => {
  it("is /today until the founder flips it", () => {
    expect(SIGNED_IN_HOME).toBe("/today");
  });

  it("login and signup import it instead of defining their own", () => {
    for (const f of ["routes/login.tsx", "routes/signup.tsx"]) {
      const s = read(f);
      expect(s).toContain('from "@/components/shell/post-auth-home"');
      expect(s).not.toMatch(/const SIGNED_IN_HOME/);
    }
  });

  it("no route file hardcodes the old home as a redirect target any more", () => {
    // The deliberate exceptions live OUTSIDE routes/: start.tsx's compare link
    // names /today on purpose so the founder can see both landings (R-15).
    const offenders: string[] = [];
    for (const f of [
      "routes/index.tsx",
      "routes/_authenticated.settings.tsx",
      "routes/_authenticated.chat.tsx",
      "routes/_authenticated.govern.tsx",
      "routes/_authenticated.inbox.tsx",
      "routes/_authenticated.tasks.tsx",
      "routes/_authenticated.m.index.tsx",
      "routes/_authenticated.m.$productId.tsx",
      "routes/_authenticated.$workspaceSlug.$productSlug.tsx",
    ]) {
      if (read(f).includes('"/today"')) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
