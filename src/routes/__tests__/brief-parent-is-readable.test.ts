import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE PUBLIC BRIEF HAS A BODY IN ITS PARENT DOCUMENT.
 *
 * The interactive deck is deliberately an iframe so its keyboard navigation,
 * fonts and print layout remain isolated. Search and answer engines do not
 * credit that child document to /brief or /investors, so the parent must carry
 * the same narrative in semantic, user-visible HTML. Hidden keyword text would
 * trade one launch defect for cloaking, which is worse.
 */

const ROOT = join(import.meta.dir, "..", "..");
const DECK = readFileSync(join(ROOT, "components", "supaprod", "BriefDeck.tsx"), "utf8");
const BRIEF = readFileSync(join(ROOT, "routes", "brief.tsx"), "utf8");
const INVESTORS = readFileSync(join(ROOT, "routes", "investors.tsx"), "utf8");

const summaryAt = DECK.indexOf('<article id="brief-summary"');
const summary = DECK.slice(summaryAt);

describe("the public brief parent is readable", () => {
  it("keeps the interactive deck as the first full viewport", () => {
    expect(DECK).toContain('export const DECK_SRC = "/brief.html"');
    expect(DECK).toContain("<iframe");
    expect(DECK).toContain('height: "100svh"');
    expect(DECK.indexOf("<iframe")).toBeLessThan(summaryAt);
  });

  it("renders a semantic parent narrative", () => {
    expect(DECK).toContain("<main");
    expect(summaryAt).toBeGreaterThan(-1);
    expect(summary).toContain("<h1");
    expect(summary.match(/<h2/g)).toHaveLength(3);
    expect(summary).toContain("The director tells you what to build.");
    // PINS THE IDEA, NOT THE SPELLING (2026-08-13), for the same reason as
    // layer 03 below and by the same precedent. This read
    // toContain("The operating system runs the whole lifecycle.") until the
    // 2026-08-11 retire-everywhere ruling reached the surfaces it had missed:
    // "operating system" is on the Never list for the landing page, brief and
    // listings (docs/strategy/positioning-locked-2026-08.md:203), and layer 02
    // renders as "the loop" on the site already. What this test exists to prove
    // is that layer 02 is present in the parent document as real semantic text
    // rather than living only in the iframe. What that layer is CALLED is
    // positioning's call.
    //
    // AND THIS LINE PROVED ITS OWN HEADER RIGHT, 2026-08-27. It read
    // toMatch(/runs the whole lifecycle\./) until canon 5N banned exactly that
    // string in outward copy on 2026-08-26, because it invites the "so you are
    // Lovable, plus advice" comparison the ruling refuses. So a guard written
    // to protect INDEXABILITY spent a day enforcing a phrase a founder ruling
    // had outlawed, and would have failed the build of anyone who fixed the
    // site. That is the exact failure mode the two notes above describe, on the
    // third try, in the same file.
    //
    // Pinned to the half of 5N's replacement that is the CLAIM rather than the
    // wording: this layer hands work out and checks the result. If positioning
    // rewords it again, update the phrase here and leave the shape alone.
    expect(summary).toMatch(/checks what came back\./);
    // PINS THE IDEA, NOT THE SPELLING (2026-08-11). This read
    // toContain("The company brain learns, then guides.") until the
    // practitioner-vocabulary ruling retired "company brain"
    // (docs/growth/vocabulary-change-list-2026-08.md), at which point a guard
    // written to protect INDEXABILITY was instead blocking a rename it has no
    // opinion about. What this test exists to prove is that layer 03 is present
    // in the parent document as real semantic text rather than living only in
    // the iframe. The layer's claim is that it learns and then guides; which
    // adjective sits in front of "brain" is positioning's call, not this file's.
    expect(summary).toMatch(/brain learns, then guides\./);
  });

  it("keeps the semantic summary visible instead of hiding SEO copy", () => {
    expect(summary).not.toMatch(/display:\s*"none"|visibility:\s*"hidden"|opacity:\s*0/);
    expect(DECK).not.toMatch(/navigator\.userAgent|Googlebot|GPTBot|ClaudeBot/);
  });
});

describe("both public URLs serve the same indexable body", () => {
  for (const [path, source] of [
    ["/brief", BRIEF],
    ["/investors", INVESTORS],
  ] as const) {
    it(`${path} renders BriefDeck and stays indexable`, () => {
      expect(source).toContain(`createFileRoute("${path}")`);
      expect(source).toContain("component: BriefDeck");
      expect(source).toContain('{ name: "robots", content: "index, follow" }');
      expect(source).toContain('links: [{ rel: "canonical", href: `${SITE}/brief` }]');
    });
  }
});
