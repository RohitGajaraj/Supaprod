import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * NO EM DASHES AND NO EN DASHES IN ANYTHING A PERSON READS.
 *
 * Founder, 2026-08-26, having spotted them on the running product: *"I do not
 * want any traces of AI ... with m dashes and n dashes, because I am able to see
 * a couple of them on the application. I do not want that left anywhere."*
 *
 * ── WHY A TEST RATHER THAN A SWEEP ─────────────────────────────────────────
 * A sweep fixes the four that exist today. This repo's own record says the next
 * one arrives within the week and nobody greps for it, which is how the retired
 * design tokens kept coming back until a test refused them. Punctuation a model
 * reaches for by reflex needs the same guard: cheap to state, impossible to
 * drift past.
 *
 * ── COMMENTS ARE DELIBERATELY EXEMPT, AND THAT IS NOT A LOOPHOLE ───────────
 * This file's own neighbours are written in a house style thick with em dashes,
 * and none of it is rendered. The rule is about what reaches a person, so the
 * check strips comments and reads what is left. Rewriting the commentary would
 * be a large diff that changes nothing a customer can see.
 *
 * ── THE STRIPPER TRACKS STRING STATE ON PURPOSE ────────────────────────────
 * The obvious version treats `//` as the start of a comment wherever it appears,
 * and the first thing it would mangle is `"https://github.com/owner/repo"` --
 * silently blinding the guard to every character after a URL on that line. So
 * quotes and template literals are tracked, and only a `//` or a slash-star in
 * CODE begins a comment.
 *
 * ── SCOPE IS S1'S PREFIX, BECAUSE A LANE CANNOT GREEN ANOTHER LANE'S FILES ──
 * Widening this test to another lane's files would fail the build for a session
 * over copy it owns.
 *
 * ── THIS IS ONE OF THREE, AND THAT IS A DEFECT, NOT A BELT AND BRACES ──────
 * Three sessions each wrote a guard for the same founder instruction on the same
 * day: this one, S2's under `src/__tests__/`, and S4's under `src/lib/`, which
 * parses the TypeScript AST rather than scanning text. **S4's is the better
 * reader and S0 should keep exactly one.** Two properties decide it, and neither
 * scoped scanner has both: `src/lib/presence/` must be IN scope, because
 * `character.ts` is bundled to the browser and six of the thirteen user-facing
 * dashes were its spoken lines on the run screen; and the reader must NOT visit
 * regex literals, because DocsPanel's editor input rule matches an em dash on
 * purpose to make a horizontal rule. This file is kept only until that one
 * covers these paths, and is then deleted rather than left as a second opinion.
 *
 * ── AND A TEXT SWEEP CANNOT FINISH THE JOB ────────────────────────────────
 * S2 measured the live database: `decisions.rationale` rows carry em dashes in
 * the unmistakable register, and no single prompt writes them. Model-authored
 * text is rendered by this surface and no scan of source can reach it; the root
 * is a punctuation rule every agent loop reads (`src/lib/ai/house-style.ts`).
 * The repo also already had `scripts/check-humanized.sh`, which only scans
 * `git diff --cached` -- which is how the tree drifted to 115 lines while the
 * commit gate stayed green.
 *
 * ── TWO TRAPS FOR WHOEVER WIDENS THIS (S3 hit both, expensively) ──────────
 * A bulk rewrite cannot do it: the character does at least six different jobs,
 * including a no-value placeholder (`${x ?? "-"}`) that is not punctuation at
 * all. And four checker hits under `src/lib/**` are `"&nbsp;": " "` DECODER
 * entries whose lines REMOVE the character; "fixing" those puts it back.
 */

const ROOTS = [
  "src/components/track",
  "src/components/spine",
  "src/components/presence",
  "src/components/decisions",
  "src/components/learn",
  "src/components/ask",
  "src/components/discover",
];

const ROUTES = [
  "src/routes/_authenticated.start.tsx",
  "src/routes/_authenticated.decide.tsx",
  "src/routes/_authenticated.learn.tsx",
  "src/components/learn/LearnRecord.tsx",
  "src/components/ship/ShipRecord.tsx",
  "src/routes/_authenticated.discover.tsx",
  "src/routes/_authenticated.track.$trackId.tsx",
];

/** Everything outside a comment, with comments blanked but line count intact. */
function stripComments(src: string): string {
  type S = "code" | "line" | "block" | "sq" | "dq" | "tpl";
  let out = "";
  let state: S = "code";
  let i = 0;
  /** The last non-space character seen in code, for the apostrophe rule below. */
  let prev = "";
  while (i < src.length) {
    const c = src[i]!;
    const n = src[i + 1] ?? "";
    if (state === "code") {
      if (c === "/" && n === "*") {
        state = "block";
        i += 2;
        continue;
      }
      if (c === "/" && n === "/") {
        state = "line";
        i += 2;
        continue;
      }
      /*
       * An apostrophe only opens a string where a string could START. In JSX
       * text this repo writes "You're watching it work", "Don't run it" and
       * "The change's files" -- and a naive reader treats each as an opening
       * quote, desyncing everything after it. The direction of that failure is
       * safe (a false string state stops comments being stripped, so the guard
       * over-reports rather than going blind), but the noise would be blamed on
       * the rule instead of the reader. A quote preceded by a letter, a digit or
       * a closing bracket is punctuation inside prose, never a delimiter.
       */
      if (c === "'" && !/[A-Za-z0-9_)\]]/.test(prev)) state = "sq";
      else if (c === '"') state = "dq";
      else if (c === "`") state = "tpl";
      if (!/\s/.test(c)) prev = c;
      out += c;
      i += 1;
      continue;
    }
    if (state === "line") {
      if (c === "\n") {
        state = "code";
        out += "\n";
      }
      i += 1;
      continue;
    }
    if (state === "block") {
      if (c === "*" && n === "/") {
        state = "code";
        i += 2;
        continue;
      }
      if (c === "\n") out += "\n";
      i += 1;
      continue;
    }
    // Inside a string of some kind: an escape consumes its next character, so a
    // backslash-quote cannot be mistaken for the closing quote.
    if (c === "\\") {
      out += c + n;
      i += 2;
      continue;
    }
    if (
      (state === "sq" && c === "'") ||
      (state === "dq" && c === '"') ||
      (state === "tpl" && c === "`")
    ) {
      state = "code";
    }
    out += c;
    i += 1;
  }
  return out;
}

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (!/\.tsx?$/.test(e) || e.includes(".test.")) continue;
      found.push(p);
    }
  };
  ROOTS.forEach(walk);
  for (const r of ROUTES) {
    try {
      if (statSync(r).isFile()) found.push(r);
    } catch {
      /* a route this build does not have is not a failure of this rule */
    }
  }
  return found;
}

describe("what a person reads", () => {
  const files = sourceFiles();

  it("scans the surfaces S1 owns, so a silent zero cannot pass for a clean bill", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("carries no em dash and no en dash outside a comment", () => {
    const offences: string[] = [];
    for (const path of files) {
      const code = stripComments(readFileSync(path, "utf-8"));
      code.split("\n").forEach((line, idx) => {
        if (/[—–]/.test(line)) offences.push(`${path}:${idx + 1}  ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offences).toEqual([]);
  });

  it("still sees the text after a URL, which is the stripper's one hard case", () => {
    // `//` inside a string must not start a comment, or every dash after a link
    // on the same line becomes invisible to this guard.
    const sample = 'const a = "https://github.com/owner/repo"; const b = "before — after";';
    expect(stripComments(sample)).toContain("—");
    // And a real comment is still removed.
    expect(stripComments("// a — comment\ncode")).not.toContain("—");
  });

  it("does not mistake an apostrophe in prose for an opening quote", () => {
    // JSX text this repo actually ships. If the reader desyncs here, the comment
    // that follows stops being stripped and the rule starts reporting prose it
    // was never meant to police.
    const jsx = `<p>Don't run it</p>\n/* a — comment */\n<p>after</p>`;
    expect(stripComments(jsx)).not.toContain("—");
  });
});
