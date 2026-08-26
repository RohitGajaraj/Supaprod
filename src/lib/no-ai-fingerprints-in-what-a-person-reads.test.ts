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
const BANNED =
  /[—–​‌‍⁠﻿­‎‏�]/;

/** Where a person reads the string directly. Nothing here, ever. */
const RENDERED = ["src/components/", "src/routes/", "src/lib/presence/"];

/**
 * Frozen 2026-08-26. Model briefs and server strings. May only go DOWN.
 * `src/lib/ai/tools/registry.server.ts` is the largest and the most valuable to
 * clear: a model imitates the punctuation of its instructions, so an em dashed
 * brief is where a dash in text nobody wrote comes from.
 */
const BASELINE: Record<string, number> = {
  "src/lib/ai/tools/registry.server.ts": 30,
  "src/lib/ai/loop.server.ts": 7,
  "src/lib/deployments.functions.ts": 7,
  "src/lib/ai/critic.server.ts": 4,
  "src/lib/ai/research.server.ts": 4,
  "src/lib/discovery.functions.ts": 4,
  "src/lib/ai/reflection.server.ts": 3,
  "src/lib/ai/tools/orchestrator.server.ts": 3,
  "src/lib/health.functions.ts": 3,
  "src/lib/ai/decision-alternatives.ts": 2,
  "src/lib/ai/tools/own-artifact-source.ts": 2,
  "src/lib/build/ard-block.ts": 2,
  "src/lib/changelog.functions.ts": 2,
  "src/lib/connectors/resolve.server.ts": 2,
  "src/lib/design-interchange.functions.ts": 2,
  "src/lib/studio.functions.ts": 2,
  "src/lib/ai/cluster.server.ts": 1,
  "src/lib/ai/handoff.server.ts": 1,
  "src/lib/ai/mission-advance.server.ts": 1,
  "src/lib/ai/studio-ci-logs.server.ts": 1,
  "src/lib/ai/verify-green.server.ts": 1,
  "src/lib/audio.functions.ts": 1,
  "src/lib/copilot.functions.ts": 1,
  "src/lib/design-scaffold.functions.ts": 1,
  "src/lib/outcome.functions.ts": 1,
  "src/lib/rag/findings.server.ts": 1,
  "src/lib/reactor.functions.ts": 1,
  "src/lib/spine/correction.ts": 1,
  "src/lib/spine/metric-probe.server.ts": 1,
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

  it("the baseline itself only shrinks, so a cleared file cannot silently refill", () => {
    const counts = new Map<string, number>();
    for (const h of hits) {
      if (RENDERED.some((p) => h.file.startsWith(p))) continue;
      counts.set(h.file, (counts.get(h.file) ?? 0) + 1);
    }
    // A file listed in BASELINE that now scans clean should be REMOVED from it.
    // Left in, it silently re-permits what somebody already paid to remove.
    const stale = Object.keys(BASELINE).filter((f) => (counts.get(f) ?? 0) < (BASELINE[f] ?? 0));
    if (stale.length > 0) {
      console.error(
        "These files are cleaner than their baseline. Lower or delete their BASELINE entries\n" +
          "in the same commit, or the ground you just gained is handed back:\n" +
          stale.map((f) => `  ${f}: now ${counts.get(f) ?? 0}, baseline ${BASELINE[f]}`).join("\n"),
      );
    }
    expect(stale).toEqual([]);
  });
});
