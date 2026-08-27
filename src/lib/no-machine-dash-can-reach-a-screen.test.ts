/**
 * NOTHING A PERSON CAN READ CARRIES AN EM OR AN EN DASH.
 *
 * ── WHY THIS EXISTS BESIDE `scripts/check-humanized.sh` RATHER THAN INSTEAD ─
 * That script is scoped by an explicit founder ruling (2026-08-03): only
 * consumer-facing code is worth spending on, *"it's okay to have it at the
 * source code back end, which is not consumer facing"*. Its allowlist is
 * `src/components/`, `src/routes/`, the prompt and humanizer modules, and
 * `public/`. That ruling is right and this file does not widen it.
 *
 * **What has drifted is the allowlist's stated premise.** Its comment reads
 * *"Everything else under `src/lib/**` is server logic whose dashes never leave
 * the repo."* That was true when it was written. It is not true now:
 * `spine/correction.ts` and `forecast.functions.ts` are imported directly by
 * surfaces, and `spec-gate.ts`, `paste-back.ts` and `surface-parts` error copy
 * all export SENTENCES A PERSON READS. Roughly fifteen more were written into
 * `src/lib` in one night.
 *
 * A static string never passes through the runtime sanitizer. `humanizeText`
 * cleans what a MODEL wrote; copy we typed goes straight to the screen. So the
 * one class the two existing defences both miss is prose we author ourselves,
 * in a file the shell guard does not scan.
 *
 * ── REACHABILITY, NOT A HAND-KEPT LIST ─────────────────────────────────────
 * A second allowlist would drift exactly as the first one's premise did, and I
 * would be the one maintaining it badly. So the set is COMPUTED: start at every
 * component and route, follow `@/` imports transitively, and check whatever that
 * reaches. It is exactly as narrow as reality and it cannot go stale, because
 * adding an import is what puts a file in scope.
 *
 * ── THE INSTRUMENT PROVES IT CAN FAIL, FIRST ───────────────────────────────
 * F-102's real lesson was not about dashes. Two scans that day reported CLEAN
 * over live hits: one grep did not match a two-space indent, and `xargs -a` is
 * not a BSD option so it silently scanned nothing. **A guard that cannot fail is
 * indistinguishable from a guard that passes.** The first test below feeds the
 * checker a known-bad string and requires it to complain.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Glob } from "bun";

const ROOT = fileURLToPath(new URL("..", import.meta.url)); // src/
const MACHINE_DASH = /[–—]/;

/**
 * Remove comments, keep string literals.
 *
 * This repo writes long prose comments, and 241 of 563 surface files contain a
 * dash inside one. Counting those would bury the real hits under noise nobody
 * can act on, which is how a guard gets switched off.
 */
function stripComments(src: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("/*", i)) {
      const j = src.indexOf("*/", i + 2);
      i = j === -1 ? src.length : j + 2;
      continue;
    }
    // `//` inside a URL is not a comment, and this repo's comments cite URLs.
    if (src.startsWith("//", i) && src[i - 1] !== ":") {
      const j = src.indexOf("\n", i);
      i = j === -1 ? src.length : j;
      continue;
    }
    out.push(src[i]!);
    i += 1;
  }
  return out.join("");
}

const IMPORT_RE = /from\s+["'](@\/[^"']+)["']/g;

function resolve(spec: string): string | null {
  const base = ROOT + spec.slice(2);
  for (const cand of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (existsSync(cand)) return cand;
  }
  return null;
}

/** Every file a surface can reach, following `@/` imports from the entry set. */
function reachable(entries: string[]): string[] {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const f = queue.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    let src: string;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const m of src.matchAll(IMPORT_RE)) {
      const next = resolve(m[1]!);
      if (next && !seen.has(next)) queue.push(next);
    }
  }
  return [...seen];
}

const isTest = (f: string) => f.includes(".test.") || f.includes("__tests__");

const SURFACES = [
  ...new Glob("components/**/*.{ts,tsx}").scanSync({ cwd: ROOT, absolute: true }),
  ...new Glob("routes/**/*.{ts,tsx}").scanSync({ cwd: ROOT, absolute: true }),
].filter((f) => !isTest(f));

const REACHED = reachable(SURFACES).filter((f) => !isTest(f));

/** Files whose code, comments removed, still carries a machine dash. */
function offenders(files: string[]): { file: string; line: number; text: string }[] {
  const hits: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    let code: string;
    try {
      code = stripComments(readFileSync(f, "utf8"));
    } catch {
      continue;
    }
    code.split("\n").forEach((line, i) => {
      if (MACHINE_DASH.test(line)) {
        hits.push({ file: f.replace(ROOT, "src/"), line: i + 1, text: line.trim().slice(0, 100) });
      }
    });
  }
  return hits;
}

describe("the instrument can fail", () => {
  it("the comment stripper keeps string literals and removes comments", () => {
    const probe = '/* a — b */ const x = "c — d"; // e — f';
    const out = stripComments(probe);
    expect(out, "stripper ate a string literal").toContain("c — d");
    expect(out, "stripper missed a block comment").not.toContain("a — b");
    expect(out, "stripper missed a line comment").not.toContain("e — f");
  });

  it("a dash in a string literal IS reported", () => {
    // The exact shape the founder saw on screen: prose we typed, not model output.
    const bad = 'const label = "we shipped it — and it worked";';
    expect(MACHINE_DASH.test(stripComments(bad))).toBe(true);
  });

  it("a dash in a comment is NOT reported, so the signal stays actionable", () => {
    expect(MACHINE_DASH.test(stripComments("// a — b"))).toBe(false);
  });

  it("an escaped codepoint does not count, because a matcher may recognise them", () => {
    // `track-origin.ts` strips joining punctuation and must therefore KNOW these
    // characters. S1's rule: a matcher needs to recognise what it strips, not
    // contain it. Escapes are how you write that without spending the guard.
    expect(MACHINE_DASH.test("const J = /^[\\s.,;:\\u2014\\u2013-]+/;")).toBe(false);
  });
});

describe("the scan actually covered something", () => {
  it("found the surfaces", () => {
    // A scan of zero files reports clean. Twice in one day, per F-102.
    expect(SURFACES.length).toBeGreaterThan(400);
  });

  it("and followed imports beyond them into lib", () => {
    expect(REACHED.length).toBeGreaterThan(SURFACES.length);
    expect(REACHED.some((f) => f.includes("/lib/"))).toBe(true);
  });

  it("including the lib modules whose prose a person reads", () => {
    // Named so a refactor that severs one of these from the surface has to
    // notice. Each exports sentences that render.
    for (const named of ["spine/correction.ts", "forecast.functions.ts"]) {
      expect(
        REACHED.some((f) => f.endsWith(named)),
        `${named} is no longer reachable from a surface`,
      ).toBe(true);
    }
  });
});

describe("THE ASSERTION", () => {
  it("nothing a person can reach carries an em or en dash in its code", () => {
    const hits = offenders(REACHED);
    const shown = hits
      .slice(0, 20)
      .map((h) => `${h.file}:${h.line}  ${h.text}`)
      .join("\n");
    expect(hits.length, hits.length ? `\n${shown}` : "").toBe(0);
  });
});
