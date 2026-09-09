/**
 * ── A TOKEN NOBODY DEFINED IS NOT A COLOUR, AND IT IS WORSE THAN NONE ─────
 *
 * `var(--not-a-token)` does not fall back to something sensible. In a plain
 * property the declaration is dropped. Inside a **compound value** -- a
 * gradient, a `color-mix`, a shorthand -- it invalidates the WHOLE declaration,
 * so one missing name takes a working gradient with it. And in a **custom
 * property** it is guaranteed-invalid at computed-value time, which takes every
 * consumer of that property to `unset` together.
 *
 * ── THE THREE THIS WAS WRITTEN FROM, ALL FOUND 2026-09-10 ─────────────────
 *
 *   `--sp-stage-{discover,decide,plan,design,ship}`  five of seven station
 *      hues, defined nowhere. `AskLanding` put one straight into `background`,
 *      so its dot did not draw on five of seven stations. `SuggestionRail` set
 *      `--sp-suggest-hue` from the same map INLINE, over a CSS declaration that
 *      had a working fallback -- and because the inline value referenced an
 *      undefined property, the tag's border, background and colour all fell to
 *      `unset`. **A declared fallback only applies when nothing sets the
 *      property, and something always did.**
 *
 *   `--ds-blue-700`  in `.ai-pulse-text`'s seven-stop gradient. Its four
 *      siblings are defined; this one is not, so the entire `background` is
 *      void and the shimmer that class exists for cannot draw. Filed rather
 *      than fixed below, with the measurement.
 *
 * **Nobody reported any of it.** Every one was found by counting, which is why
 * this is a census and not a review.
 *
 * ── WHAT IS ALLOWED, AND IT IS NOT AN ALLOWLIST OF NAMES ──────────────────
 * A reference is fine when it carries its own fallback -- `var(--x, 0.35)` --
 * or when something outside the stylesheets sets it at runtime. Both are stated
 * per entry below, with the reason, so a new one has to be argued rather than
 * appended.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const FILES = walk(ROOT);
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every custom property DEFINED anywhere in the stylesheets. */
function defined(): Set<string> {
  const out = new Set<string>();
  for (const f of FILES.filter((f) => f.endsWith(".css"))) {
    for (const m of readFileSync(f, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g)) out.add(m[1]!);
  }
  return out;
}

/**
 * Every `var(--x)` reference that does NOT carry its own fallback.
 *
 * `var(--x, something)` is a different statement: it says the author knows the
 * name may be absent and has said what to do. Those are safe by construction
 * and are not counted.
 */
function bareReferences(): Array<{ token: string; file: string }> {
  const out: Array<{ token: string; file: string }> = [];
  for (const f of FILES) {
    const src = strip(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/g)) {
      if (m[2] === ",") continue;
      out.push({ token: m[1]!, file: f.slice(ROOT.length + 1) });
    }
  }
  return out;
}

/**
 * Names something outside the stylesheets sets at runtime, with who sets it.
 * Not an allowlist for convenience: each entry names its writer.
 */
const SET_ELSEWHERE: Readonly<Record<string, string>> = {
  // Radix writes this on the popper element itself before paint.
  "--radix-popper-transform-origin": "@radix-ui/react-popper",
};

/**
 * KNOWN BROKEN, WITH WHAT IT COSTS. Listed rather than merely absent, because
 * "absent" reads as "nobody has hit it yet". **Removing an entry is the win.**
 */
const KNOWN_BROKEN: Readonly<Record<string, string>> = {
  /*
   * `.ai-pulse-text`'s gradient (`src/styles.css`) names seven stops and four
   * distinct tokens; this one is defined nowhere, so the whole `background` is
   * invalid and the shimmer cannot draw.
   *
   * NOT FIXED HERE, AND THE REASON IS THAT NOBODY CAN SEE IT. `AiPulse` is the
   * class's only user and it has NO reader outside its own test -- measured
   * 2026-09-10. Defining the token would mean adding one in the retired `--ds-*`
   * namespace to repair an unmounted component; deleting the component is a
   * wider call than this file should make on its own. What must not happen is
   * somebody mounting it tomorrow and spending an afternoon on unstyled text.
   */
  "--ds-blue-700": "unmounted: AiPulse has no reader outside its own test",
};

describe("a token nobody defined is not a colour", () => {
  it("references no custom property that nothing defines and nothing sets", () => {
    const have = defined();
    const missing = bareReferences().filter(
      (r) => !have.has(r.token) && !(r.token in SET_ELSEWHERE) && !(r.token in KNOWN_BROKEN),
    );
    expect(
      missing,
      "a style reads a custom property that no stylesheet defines. In a plain property the declaration is dropped; in a gradient or color-mix it voids the WHOLE declaration; in a custom property it is invalid at computed-value time and takes every consumer to `unset`. Give it a fallback, define it, or stop reading it.",
    ).toEqual([]);
  });

  it("keeps the known-broken list honest: each entry must still be broken", () => {
    /*
     * A stale exemption is how a guard quietly stops guarding: the debt is paid
     * and the entry outlives it. If somebody defines the token, this fails and
     * the entry has to come out.
     */
    const have = defined();
    for (const token of Object.keys(KNOWN_BROKEN)) {
      expect({ token, stillMissing: !have.has(token) }).toEqual({ token, stillMissing: true });
    }
  });

  it("does not reintroduce the per-station hue helper", () => {
    /*
     * The founder's 2026-09-08 ruling keeps status colour off labels and law 4
     * says identity is shape. A helper that hands a station a colour invites
     * the rainbow that ruling rejected, and its return value cannot be checked
     * by a type -- which is exactly how five of seven went missing unnoticed.
     */
    const src = FILES.filter((f) => !f.endsWith(".css")).map((f) => strip(readFileSync(f, "utf8")));
    expect(src.filter((s) => /stageHueForStation/.test(s)).length).toBe(0);
  });

  it("still reads the tree it claims to read", () => {
    /*
     * THE MIRROR. The first assertion passes by finding nothing, so a walker
     * that stopped descending, or a regex that stopped matching, would report a
     * clean bill of health over any number of broken references.
     */
    expect(FILES.length).toBeGreaterThan(500);
    expect(defined().size).toBeGreaterThan(300);
    expect(bareReferences().length).toBeGreaterThan(1000);
  });
});
