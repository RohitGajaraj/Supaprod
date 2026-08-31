import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A RAW SERVER ERROR MUST NEVER REACH A PERSON. Craft bar, standard #3.
 *
 * *"No raw error ever reaches a person. Every failure names the thing that
 * failed and the next action."* — OPERATING-MODEL-5-SESSIONS.md §0.6.
 *
 * ── WHAT WAS ACTUALLY SHIPPING ────────────────────────────────────────────
 * Twenty-two sites across fourteen files in this lane's prefix did
 *
 *     toast.error(e instanceof Error ? e.message : "Unbind failed")
 *
 * which prints whatever the server threw — an RLS refusal, a Postgres code, a
 * stack-shaped string — and falls back to a decent sentence only when the error
 * carried no message at all. **The good sentence was reachable only in the case
 * where there was nothing to say.**
 *
 * It bit hardest on permission denial, which is one of the sad paths §J4 names
 * in terms (empty, loading, failed, held, permission-denied, offline). Measured
 * when this landed: of 29 components in the prefix that write, only 10 had any
 * permission-denied handling at all.
 *
 * ── THE FIX WAS ALREADY IN THE REPO ───────────────────────────────────────
 * `humanWriteError(error, fallback)` in `lib/roles.functions.ts` was written for
 * this and used by `BoundaryControls` and `ControlsPanel`. Its own comment gives
 * the precedence: *"Strongest claim first: an action the reader can take, then a
 * sentence the server wrote for a person, then this surface's own honest
 * floor."* So every existing fallback string is preserved and a raw message can
 * no longer outrank it. Nothing was reworded; the calls were wrapped.
 *
 * ── WHY THIS GUARD IS A PATTERN AND NOT A LIST ────────────────────────────
 * SESSION-3's trap list: *"A fix in one field is not a fix. A defect is a shape,
 * not a location. After any copy or validation fix, sweep every field
 * mechanically — reading them one at a time cannot see it."* So this asserts the
 * SHAPE is absent from the whole prefix rather than pinning fourteen files. A
 * new surface written next month with the old idiom fails here.
 */

const ROOT = join(import.meta.dir, "..");

/** The directories this lane owns and may be held to. */
const OWNED = [
  "settings",
  "billing",
  "connections",
  "governance",
  "admin",
  "system",
  "onboarding",
  "engine-room",
  "notifications",
];

function tsxUnder(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) tsxUnder(full, out);
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(full);
  }
  return out;
}

const FILES = OWNED.flatMap((d) => tsxUnder(join(ROOT, d)));

/**
 * `e instanceof Error ? e.message : "..."` on the same identifier — the exact
 * idiom that hands a server string to a person. Comments are stripped first so
 * this file's own quotation of the idiom, and any explanatory comment in the
 * source, cannot register as a violation.
 */
const RAW_ERROR = /(\w+)\s+instanceof\s+Error\s*\?\s*\1\.message/;
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("no raw server error reaches a person", () => {
  it("has files to check, so a path typo cannot make this vacuous", () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it("no surface in this lane's prefix renders a raw error message", () => {
    const offenders = FILES.filter((f) =>
      RAW_ERROR.test(stripComments(readFileSync(f, "utf8"))),
    ).map((f) => f.slice(ROOT.length + 1));
    expect(offenders).toEqual([]);
  });

  /**
   * The guard above is satisfied by deleting the error handling entirely, which
   * would be worse than what it replaced. This asserts the replacement is
   * actually in use, so the shape cannot be removed by removing the message.
   */
  it("and the surfaces that write route their failures through humanWriteError", () => {
    const users = FILES.filter((f) => readFileSync(f, "utf8").includes("humanWriteError("));
    expect(users.length).toBeGreaterThanOrEqual(14);
  });
});
