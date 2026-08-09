// Repo-wide guards for two defects that each survived their own fix, both for
// the same reason: the fix edited one constant, and the test written alongside
// it read only the one file that had been edited.
//
// ---------------------------------------------------------------------------
// WHY THIS FILE IS NOT SCOPED TO A COMPONENT
//
// On 2026-08-05 a seeded decision slug was removed from the Receipts beat, with
// a long write-up and a guard (Receipts.test.ts) asserting the file contained no
// hardcoded /d/<slug>. That guard passed continuously while the SAME slug stayed
// live in two other places, because it only ever read Receipts.tsx:
//
//   - LandingFooter.tsx, under the heading "proof", labelled "A decision record"
//   - index.tsx MACHINE_CONTENT, under a heading reading "## Live proof",
//     which is the copy served to crawlers and AI answer engines
//
// The slug resolves to a real page in an is_sample workspace, which is the exact
// class of row listPublicDecisions() filters out of /proof. So the site refused
// to show that row on its own ledger while linking it from the footer and
// feeding it to answer engines as live proof.
//
// A file-scoped guard cannot catch a constant that has been copied. This one
// walks the tree.
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const REPO = join(import.meta.dir, "..", "..", "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".output",
  ".wrangler",
  "graphify-out",
  "coverage",
  ".playwright-mcp",
]);

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Strip HTML and block comments so prose ABOUT a banned word is not a hit. */
function stripComments(src: string): string {
  return src.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("no seeded decision slugs anywhere", () => {
  it("hardcodes no /d/<slug> in shipped source or static pages", () => {
    const files = [
      ...walk(join(REPO, "src"), [".ts", ".tsx"]),
      ...walk(join(REPO, "public"), [".html"]),
      ...walk(join(REPO, "docs", "pitch"), [".html"]),
    ].filter((f) => !f.endsWith("no-seeded-slugs.test.ts"));

    // Share slugs are 32 hex chars. Any literal is a constant that cannot be
    // verified real at build time and rots into a link to a fixture, which is
    // what happened twice. Real decisions are resolved through
    // listPublicDecisions(), which applies the is_sample filter server-side.
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      // Comments here deliberately quote the removed slug as documentation.
      for (const m of stripComments(src).matchAll(/\/d\/[0-9a-f]{16,}/gi)) {
        offenders.push(`${relative(REPO, f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("scanned a non-trivial number of files (the walker still works)", () => {
    // A guard that silently walks zero files passes forever. This is the
    // canary for a refactor that moves or renames the directories above.
    const files = walk(join(REPO, "src"), [".ts", ".tsx"]);
    expect(files.length).toBeGreaterThan(200);
  });
});

describe("the brain never remembers, stores or logs", () => {
  // CLAUDE.md and README.md both ban these verbs of the brain: a filing cabinet
  // remembers, storage is a commodity every tool claims, and the defensible half
  // is that it LEARNS and GUIDES. The React surfaces were corrected earlier
  // (Hero.tsx, ThreeLayers.tsx, d.$slug.tsx, t.$slug.tsx all carry the note).
  //
  // The two static decks were missed by every one of those passes, because a
  // find-and-replace over *.tsx does not open a .html file. They shipped
  // "It remembers, and it guides", "brain remembers", and a hero tagline reading
  // "ship it, and remember" until 2026-08-09.
  const STATIC_PAGES = [
    join(REPO, "public", "brief.html"),
    join(REPO, "docs", "pitch", "investor-deck", "supaprod-pre-seed-investor-deck.html"),
  ];

  for (const page of STATIC_PAGES) {
    it(`${relative(REPO, page)} uses no banned brain verb in live copy`, () => {
      const body = stripComments(readFileSync(page, "utf8"));
      const hits = [...body.matchAll(/\bremembers?\b/gi)].map((m) => m[0]);
      expect(hits).toEqual([]);
    });
  }
});
