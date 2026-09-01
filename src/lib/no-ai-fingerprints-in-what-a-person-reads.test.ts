import { describe, it, expect } from "bun:test";
import * as ts from "typescript";
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * NO AI FINGERPRINTS IN ANYTHING A PERSON READS.
 *
 * The founder raised this on 2026-08-26: em dashes were visible in the running
 * application. `scripts/check-humanized.sh` was written for exactly this and
 * reported "clean" over a build that shipped thirteen of them, for three reasons
 * worth keeping in mind because each one is a way a guard can be alive and blind
 * at the same time (S4-029):
 *
 *   1. It was wired to nothing. Not a hook, not CI, not a package script.
 *   2. It read only ADDED LINES OF A STAGED DIFF, so everything already
 *      committed was invisible to it permanently.
 *   3. Its path list excluded `src/lib/presence/`, on the stated belief that
 *      "everything else under src/lib is server logic whose dashes never leave".
 *      `src/lib/presence/character.ts` is bundled to the browser and its
 *      sentences are the voice on the run screen, so six of the thirteen lived
 *      in the one directory the guard had been told not to look at.
 *
 * ── WHY THIS PARSES INSTEAD OF GREPPING ────────────────────────────────────
 * A grep of this repo returns 285 hits and almost all of them are commentary,
 * which does not ship. A hand written comment stripper got it down to 19 and was
 * wrong in both directions. So this walks the TypeScript AST and looks only at
 * nodes that can become text a person sees: string literals, the three template
 * literal pieces, and JSX text. Comments are not those node kinds, so they
 * cannot produce a false positive, and nothing that IS a string can hide.
 *
 * A regular expression literal is deliberately NOT visited. `DocsPanel`'s editor
 * input rule matches an em dash on purpose so a typed sequence becomes a
 * horizontal rule, and a guard that broke the editor to satisfy itself would be
 * worse than the problem.
 *
 * ── THE TWO TIERS, AND WHY THE SECOND ONE IS A BASELINE ────────────────────
 * ZERO is required where a person reads the string directly. Everywhere else in
 * `src/lib/**` the count is frozen at what it was when this landed and may only
 * go down. That is the same shape the Meridian token guard already uses, and it
 * is deliberate: those remaining strings are mostly tool descriptions and model
 * briefs, which are load bearing (F-88 turned on a tool description being the
 * only thing that told a station an escape existed), so they get swept
 * deliberately rather than mechanically.
 *
 * **Never widen the baseline to make this pass.** Lower a number or delete its
 * line. Raising one is the failure this file exists to prevent.
 */

const ROOT = process.cwd();

/** Em dash, en dash, and the invisible / lookalike set the convention bans. */
const BANNED = /[—–​‌‍⁠﻿­‎‏�]/;

/** Where a person reads the string directly. Nothing here, ever. */
const RENDERED = ["src/components/", "src/routes/", "src/lib/presence/"];

/**
 * Frozen 2026-08-26. Model briefs and server strings. May only go DOWN.
 * `src/lib/ai/tools/registry.server.ts` is the largest and the most valuable to
 * clear: a model imitates the punctuation of its instructions, so an em dashed
 * brief is where a dash in text nobody wrote comes from.
 */
const BASELINE: Record<string, number> = {
  /*
   * RATCHETED DOWN 2026-08-27, from 29 entries to 2.
   *
   * The founder reported seeing em dashes in the running application, and the
   * sweep that followed cleaned 106 source lines across 34 files. Twenty-six of
   * the entries that used to sit here reached ZERO and their lines are deleted
   * rather than zeroed, so the ground cannot be refilled quietly.
   *
   * The two that remain are honest. `registry.server.ts` still holds 4 in tool
   * descriptions, which are load bearing (F-88 turned on a tool description
   * being the only thing that told a station an escape existed), so they get
   * swept deliberately rather than mechanically.
   *
   * Never widen these. Lower one or delete its line.
   */
  "src/lib/ai/tools/registry.server.ts": 4,
  "src/lib/ai/decision-alternatives.ts": 2,
};

type Hit = { file: string; line: number; text: string };

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry !== "node_modules") sourceFiles(p, out);
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of sourceFiles(join(ROOT, "src"))) {
    const src = readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (n: ts.Node): void => {
      const isText =
        ts.isStringLiteral(n) ||
        ts.isNoSubstitutionTemplateLiteral(n) ||
        ts.isTemplateHead(n) ||
        ts.isTemplateMiddle(n) ||
        ts.isTemplateTail(n) ||
        ts.isJsxText(n);
      if (isText) {
        const text = (n as unknown as { text: string }).text;
        if (BANNED.test(text)) {
          const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf));
          hits.push({
            file: file.slice(ROOT.length + 1),
            line: line + 1,
            text: text.trim().slice(0, 120),
          });
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return hits;
}

describe("no AI fingerprints in anything a person reads", () => {
  const hits = scan();

  it("zero in every string a person reads directly", () => {
    const rendered = hits.filter((h) => RENDERED.some((p) => h.file.startsWith(p)));
    if (rendered.length > 0) {
      console.error(
        "An em dash, en dash or invisible character reached a string a person reads.\n" +
          "Rewrite the sentence with a full stop, a comma, a colon or parentheses; every one\n" +
          "of these reads the same without it.\n" +
          rendered.map((h) => `  ${h.file}:${h.line}  ${h.text}`).join("\n"),
      );
    }
    expect(rendered.map((h) => `${h.file}:${h.line}`)).toEqual([]);
  });

  it("nowhere else grows its count, and the baseline is never widened", () => {
    const counts = new Map<string, number>();
    for (const h of hits) {
      if (RENDERED.some((p) => h.file.startsWith(p))) continue;
      counts.set(h.file, (counts.get(h.file) ?? 0) + 1);
    }

    const grew: string[] = [];
    for (const [file, n] of counts) {
      const allowed = BASELINE[file] ?? 0;
      if (n > allowed) {
        const where = hits
          .filter((h) => h.file === file)
          .map((h) => `      ${h.file}:${h.line}  ${h.text}`)
          .join("\n");
        grew.push(`  ${file}: ${n} > baseline ${allowed}\n${where}`);
      }
    }

    if (grew.length > 0) {
      console.error(
        "These files gained a banned character. Lower the number or delete the line in\n" +
          "BASELINE; never raise one to make this pass.\n" +
          grew.join("\n"),
      );
    }
    expect(grew).toEqual([]);
  });

  /**
   * REPORTS, DOES NOT FAIL, AND THAT IS A CORRECTION TO MY OWN FIRST VERSION.
   *
   * This started as an assertion: a file cleaner than its baseline failed until
   * BASELINE was lowered in the same commit. Within the hour that was shown to be
   * a trap rather than a guard. S2 and S3 were both sweeping dashes out of
   * `src/lib/**` in their own prefixes at the time, and every file they correctly
   * cleaned would have turned this red until they found and edited a test file in
   * a prefix that is not theirs. **A guard that fails other people's correct work
   * teaches them to route around it**, and it would have been reported as my
   * regression, which it would have been.
   *
   * So it prints. The non-growth assertion above is the one that carries the
   * value; this is a nudge to bank the ground someone else already gained.
   */
  it("says which baselines are now loose, so gained ground gets banked", () => {
    const counts = new Map<string, number>();
    for (const h of hits) {
      if (RENDERED.some((p) => h.file.startsWith(p))) continue;
      counts.set(h.file, (counts.get(h.file) ?? 0) + 1);
    }
    const loose = Object.keys(BASELINE).filter((f) => (counts.get(f) ?? 0) < (BASELINE[f] ?? 0));
    if (loose.length > 0) {
      console.info(
        "These files are now cleaner than their baseline. Lower or delete their BASELINE\n" +
          "entries when you next touch this file, so the ground cannot be refilled:\n" +
          loose.map((f) => `  ${f}: now ${counts.get(f) ?? 0}, baseline ${BASELINE[f]}`).join("\n"),
      );
    }
    expect(true).toBe(true);
  });
});
