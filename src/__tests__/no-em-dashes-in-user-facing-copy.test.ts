import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * NO EM DASHES AND NO EN DASHES IN ANYTHING A CUSTOMER READS.
 *
 * ── WHY THIS IS A GATE AND NOT A PREFERENCE ────────────────────────────────
 * A founder instruction, 2026-08-26, and it is about the product's credibility
 * rather than about typography: an em dash between two clauses is the single
 * most recognisable tell that a machine wrote the sentence, and this product
 * asks people to trust what it tells them about their own work. Copy that reads
 * as generated undermines that before a word of it is evaluated.
 *
 * It was already visible. Measured the same day, `decisions.rationale` rows
 * written by agents carried lines like *"This is not a hypothesis — it is a
 * confirmed systemic failure"*, and hardcoded strings carried their own:
 * `/start` said *"Edit it freely — it starts however you leave it."*
 *
 * ── WHAT THIS GUARDS, AND WHAT IT DELIBERATELY DOES NOT ────────────────────
 * It guards `src/components` and `src/routes`: the rendering layer, where every
 * string is either shown to a person or is a comment. **Comments are exempt**,
 * and that is not a loophole. This repo documents its reasoning in long prose
 * comments and there are thousands of dashes in them; they compile to nothing
 * and nobody reads them in the app. Forcing them into hyphens would damage the
 * one artefact that makes this codebase legible and would protect no one.
 *
 * Agent-written prose is NOT guarded here, because no test can reach it: it is
 * generated at run time. That half is handled by `PLAIN_PUNCTUATION_RULE` in
 * `src/lib/ai/house-style.ts`, which every agent loop appends to its rules.
 * The two halves are different mechanisms for the same requirement and neither
 * one covers the other.
 *
 * ── WHY THE STRIPPER IGNORES THE SINGLE QUOTE ──────────────────────────────
 * The first version of this scan treated `'` as a string delimiter and reported
 * two hits in the whole tree, which was wrong and would have shipped a green
 * gate over real offenders. JSX text is full of apostrophes: one `don't` opens a
 * string that never closes, and every comment after it is read as string
 * content and skipped. So `'` is ordinary text here. A single-quoted string
 * carrying a dash is still caught, because the line it sits on is not inside a
 * comment either way.
 */

/* `src/lib/presence` IS IN SCOPE and its absence was a real hole, found by S4.
   character.ts is BUNDLED TO THE BROWSER and holds the teammate's spoken lines
   on the run screen, so six user-facing dashes sat in a directory this gate
   called clean. scripts/check-humanized.sh made the identical assumption and
   states it at its line 78, that "everything else under src/lib is server logic
   whose dashes never leave". The build disproves it. Anything under src/lib
   that reaches the client belongs here. */
const ROOTS = ["src/components", "src/routes", "src/lib/presence"] as const;
const DASH = /[—–]/;

/** Strip `//` and block comments. `'` is text, never a delimiter: see above. */
function stripComments(src: string): string {
  const out: string[] = [];
  let i = 0;
  let mode: null | "line" | "block" | "dq" | "tpl" = null;
  while (i < src.length) {
    const c = src[i]!;
    const next = src[i + 1];
    if (mode === null) {
      if (c === "/" && next === "/") {
        mode = "line";
        i += 2;
        continue;
      }
      if (c === "/" && next === "*") {
        mode = "block";
        i += 2;
        continue;
      }
      if (c === '"') {
        mode = "dq";
        out.push(c);
        i += 1;
        continue;
      }
      if (c === "`") {
        mode = "tpl";
        out.push(c);
        i += 1;
        continue;
      }
      out.push(c);
      i += 1;
      continue;
    }
    if (mode === "line") {
      if (c === "\n") {
        mode = null;
        out.push("\n");
      }
      i += 1;
      continue;
    }
    if (mode === "block") {
      if (c === "*" && next === "/") {
        mode = null;
        i += 2;
        continue;
      }
      if (c === "\n") out.push("\n");
      i += 1;
      continue;
    }
    out.push(c);
    if (c === "\\") {
      if (src[i + 1] !== undefined) out.push(src[i + 1]!);
      i += 2;
      continue;
    }
    if (mode === "dq" && c === '"') mode = null;
    else if (mode === "tpl" && c === "`") mode = null;
    i += 1;
  }
  return out.join("");
}

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      walk(full, found);
      continue;
    }
    if (!/\.tsx?$/.test(entry) || entry.includes(".test.")) continue;
    found.push(full);
  }
  return found;
}

function offenders(): string[] {
  const out: string[] = [];
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      const src = readFileSync(file, "utf8");
      if (!DASH.test(src)) continue;
      const lines = stripComments(src).split("\n");
      lines.forEach((line, idx) => {
        const text = line.trim();
        // A JSDoc continuation line. The stripper can lose its place inside a
        // comment that contains a backtick, so this is the second net.
        if (text.startsWith("*")) return;
        if (DASH.test(line)) out.push(`${file}:${idx + 1}: ${text.slice(0, 100)}`);
      });
    }
  }
  return out;
}

describe("user-facing copy carries no em dashes or en dashes", () => {
  it("finds none anywhere in the rendering layer", () => {
    const bad = offenders();
    expect(
      bad,
      `Em or en dash in copy a person can read. Use a comma, a full stop, or a plain\n` +
        `hyphen. Comments are exempt; this is about what renders.\n\n${bad.join("\n")}\n`,
    ).toEqual([]);
  });

  it("actually detects one when it is there, so a green result means something", () => {
    // A gate nobody has seen fail is a gate nobody should trust.
    const sample = `const a = "one thing — another";`;
    expect(DASH.test(stripComments(sample))).toBe(true);
  });

  it("does not fire on a dash inside a comment, which is the exemption", () => {
    const sample = `/* a comment — with a dash */\nconst a = "clean";`;
    expect(DASH.test(stripComments(sample))).toBe(false);
  });

  it("is not fooled by an apostrophe in JSX text", () => {
    // The bug the first version shipped with: `don't` opened a string that
    // never closed, and everything after it went unscanned.
    const sample = `<p>don't stop</p>\nconst a = "later — dash";`;
    expect(DASH.test(stripComments(sample))).toBe(true);
  });
});
