import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE HEADLINE ON /crew COUNTED OUR SOURCE CODE AND CALLED IT YOUR WORKSPACE.
 *
 * It rendered `count(all.length)`, and `all` is `rosterCatalog()` — a catalogue
 * compiled into the route, deduplicated by name, that makes **no query at all**.
 * So "16 agents work here" was a fact about this repository printed as a fact
 * about the reader's account, and it printed the same 16 whether the workspace
 * held sixteen, one, or none, and whether the backend answered or died.
 *
 * ── IT WAS WRONG FOR EVERY ACCOUNT, NOT JUST THE BROKEN ONES ──────────────
 * S4 found it on a dead backend; I asked them to settle it against a LIVE one
 * before filing, because a constant that happens to equal the true count is a
 * much weaker finding. The live answer is worse. Distinct agent names per owner:
 * 22 for one, 19 for three, 17 for twelve, and **sixteen for nobody**. The
 * nearest true value is 17. So the constant was wrong for 100% of accounts, on
 * the page whose entire subject is who is working for you.
 *
 * ── WHY IT SLIPPED, AND THIS IS THE TRANSFERABLE PART ─────────────────────
 * The headline never READ the data, so it never looked like a read that could
 * fail. Every guard in that file protects something that queries — a SlowRead
 * with a measured 6.9s escalation, a sub-line replaced on error, a ReadFailed
 * card — and `all.length` queries nothing, so it was never on the list of things
 * that could be wrong. Its own comment reasons carefully about the verb
 * agreement of a number that was never true.
 *
 * ── WHY `present` AND NOT THE RAW LIVE COUNT ──────────────────────────────
 * The database holds 17 slugs for every owner; the catalogue deduplicates to 16
 * identities deliberately ("five slugs all mean Watch; the roster should show one
 * Watch, not five"). `present` is the catalogue entries that have a live agent
 * row, which is exactly the set rendered below the headline. Counting raw slugs
 * would put 17 over a list of 16 and recreate the headline-contradicts-body
 * defect that the empty branch's own comment records fixing once already.
 */

const FILE = join(import.meta.dir, "..", "_authenticated.crew.tsx");
const SRC = readFileSync(FILE, "utf8");
/** Assertions read code only; the comments above quote the retired expression. */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/** The title expression, isolated so a mention elsewhere cannot satisfy us. */
const TITLE_DECL = (() => {
  const i = CODE.indexOf("const crewTitle");
  expect(i).toBeGreaterThan(-1);
  return CODE.slice(i, CODE.indexOf("<PageHeading", i));
})();

describe("the /crew headline counts the workspace, not the catalogue", () => {
  it("no longer derives the title straight from the compiled catalogue", () => {
    expect(CODE).not.toContain("title={\n            all.length === 1");
    expect(CODE).toContain("title={crewTitle}");
  });

  it("asserts no number until the read has landed", () => {
    expect(TITLE_DECL).toContain("!crew.isSuccess");
    const beforeBranch = TITLE_DECL.slice(0, TITLE_DECL.indexOf("crew.data?.empty"));
    expect(beforeBranch).not.toContain("count(");
  });

  it("counts what is present and rendered on a live roster", () => {
    expect(TITLE_DECL).toContain("count(present.length)");
  });

  /**
   * The deliberate exception. An account with no `agents` rows has not lost its
   * crew, it has never narrowed one, and the sub beneath argues exactly that
   * from the catalogue. "No agents work here" over "All 16 run without asking
   * you" would be the same contradiction pointing the other way.
   */
  it("keeps the catalogue count on an empty account, where the sub argues from it", () => {
    expect(TITLE_DECL).toContain("crew.data?.empty");
    const emptyArm = TITLE_DECL.slice(TITLE_DECL.indexOf("crew.data?.empty"));
    expect(emptyArm).toContain("count(all.length)");
  });

  /**
   * `rosterCatalog` must stay query-free — that is the whole point of it — so
   * this pins the reason the headline may not be built from it, rather than the
   * headline's wording.
   */
  it("and the catalogue it replaced still makes no query, which is why it could not be trusted", () => {
    const fn = CODE.slice(CODE.indexOf("function rosterCatalog"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    for (const readish of ["useQuery", "useServerFn", "await", "fetch("]) {
      expect(body).not.toContain(readish);
    }
  });
});

/*
 * ── TWO EQUAL COUNTS, STACKED, MAKE A READER COMPARE THEM ─────────────────
 *
 * READ ON THE SERVED /crew, 2026-09-10:
 *
 *   16 agents work here.
 *   16 run without asking you.
 *
 * The second line is only informative BECAUSE it equals the first, and stating
 * it as a bare number makes the reader do the comparison to discover that.
 *
 * A THIRD CASE OF ONE SHAPE FOUND IN A NIGHT: an individually-correct decision
 * arriving somewhere it did not intend. This branch was written for "16 run
 * without asking you, 3 ask first", where the counts differ and both earn
 * their place. The zero-omission beside it is right and argued at length --
 * nobody says "0 ask first". What nobody looked at is the sentence LEFT BEHIND
 * when that clause is omitted and `alone` equals the roster, which is the
 * common case on a workspace that has never narrowed anything.
 */
describe("the autonomy line does not restate the headline's number", () => {
  const SRC = readFileSync("src/routes/_authenticated.crew.tsx", "utf8");

  it("says ALL when every agent runs unattended", () => {
    expect(SRC).toContain('{alone === all.length ? "All " : null}');
  });

  it("still states the bare count when some agents do ask", () => {
    // The mirror. "All 12 run without asking you, 4 ask first" would be a lie
    // about the roster, so the word appears only on the equality.
    const line = SRC.match(/\{alone === all\.length[\s\S]{0,220}?run without asking you/);
    expect(line, "the autonomy line moved; re-point this test").not.toBeNull();
    expect(line![0]).toContain("alone === all.length");
    expect(line![0]).not.toMatch(/"All ".*"All "/);
  });

  it("keeps the empty-account branch, which already said it correctly", () => {
    // That branch has said "All N run without asking you" since the day the
    // headline and the sub contradicted each other; this change makes the
    // other branch agree with it rather than inventing a second phrasing.
    expect(SRC).toContain("run without asking you. Nothing has been narrowed here yet.");
  });
});
