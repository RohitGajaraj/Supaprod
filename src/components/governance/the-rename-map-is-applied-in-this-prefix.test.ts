import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * §12's RENAME MAP, APPLIED AND HELD ACROSS THIS LANE'S PREFIX.
 *
 * The operating model §12 is a law rather than a copy preference: *"if a person
 * would not say the word out loud to a colleague, it does not go on a surface."*
 * S0 rules each row and owns the sweep; **a lane applies it inside its own
 * prefix**, which is what this guards.
 *
 * ── WHY A GUARD AND NOT JUST A FIX ────────────────────────────────────────
 * §12's own warning is the reason: *"A word renamed in one place and left stale
 * in another has made the problem worse."* That is a live hazard right now —
 * S2 owns the rail literals in `AppFrame.tsx` and has renamed **Guardrails →
 * "What it's allowed to do"** and **Brain → "What we've learned"** on their
 * branch, while the pages those doors land on are mine. A door and its
 * destination disagreeing is worse than both being wrong together, because the
 * reader concludes they clicked the wrong thing.
 *
 * ── WHAT WAS ACTUALLY LEFT, MEASURED RATHER THAN ASSUMED ──────────────────
 * Across governance, engine-room, brain, memory, knowledge, trust, settings and
 * billing, exactly **one** user-facing instance survived: `ControlsPanel`'s
 * *"They are in the Engine Room."* Everything else had already been applied by
 * an earlier S3. Hits for `Evals` turned out to be component identifiers, not
 * rendered text, which is why this test reads props and JSX text rather than
 * grepping the file wholesale — a rule that fails on an identifier trains people
 * to weaken it.
 *
 * ── SCOPE, DELIBERATELY NARROW ────────────────────────────────────────────
 * Only the rows whose destination pages are in this prefix. `Crew · Agents ·
 * Fleet · Swarm`, `Cockpit · Mission Control · Observe · Today` and `Missions ·
 * Tracks · Runs` land on S1 and S2 surfaces and are theirs to hold. And only
 * USER-FACING positions: an import, a component name, a query key or a route
 * path may say anything, because slugs are stable by R-01 and the display name
 * is what §12 governs.
 */

const ROOT = join(import.meta.dir, "..");
const OWNED = [
  "governance",
  "engine-room",
  "brain",
  "memory",
  "knowledge",
  "trust",
  "settings",
  "billing",
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

const FILES = tsxUnder(join(ROOT, OWNED[0])).concat(
  ...OWNED.slice(1).map((d) => tsxUnder(join(ROOT, d))),
);

/**
 * JSX COMMENTS COME OUT WITH THEIR BRACES, and the first version of this file did
 * not do that. It stripped `/* ... *\/` and left the surrounding `{` and `}`
 * behind, so a `{/* ... *\/}` sitting immediately above a rendered string put a
 * brace between the `>` and the word and the JSX-text matcher stopped seeing it.
 *
 * **Mutation-testing is what caught it**: restoring "Open the Engine Room" left
 * this suite GREEN, because the explanatory comment I had written directly above
 * that line was shielding it. A guard that any adjacent comment can switch off is
 * worse than no guard, because it reports the clean result with authority.
 */
const stripComments = (s: string) =>
  s
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, "");

/**
 * The rows of §12's map whose destinations are in this prefix. The retired word
 * is what may not reach a surface; the plain phrase is what replaced it.
 */
const RETIRED = ["Engine Room", "Guardrails", "Trust ledger", "Trust Ledger"];

/**
 * A retired word in a USER-FACING position: a rendering prop, or bare JSX text.
 * Identifiers, imports, query keys and route paths are all deliberately exempt.
 */
function userFacingHits(source: string): string[] {
  const code = stripComments(source);
  const hits: string[] = [];
  for (const word of RETIRED) {
    const inProp = new RegExp(
      `(?:title|label|sub|heading|placeholder|alt)="[^"]*${word}[^"]*"`,
      "g",
    );
    const inText = new RegExp(`>\\s*[^<>{}]*${word}[^<>{}]*\\s*<`, "g");
    for (const m of code.match(inProp) ?? []) hits.push(m.slice(0, 90));
    for (const m of code.match(inText) ?? []) hits.push(m.slice(0, 90));
  }
  return hits;
}

describe("§12's rename map holds across this lane's prefix", () => {
  it("walked a real set of files, so a path typo cannot make this vacuous", () => {
    expect(FILES.length).toBeGreaterThan(60);
  });

  it("no retired word reaches a surface in this prefix", () => {
    const offenders = FILES.flatMap((f) =>
      userFacingHits(readFileSync(f, "utf8")).map((h) => `${f.slice(ROOT.length + 1)} :: ${h}`),
    );
    expect(offenders).toEqual([]);
  });

  /**
   * The canon's own banned list, which §12 says is "not up for renegotiation".
   * `ledger` is the one that overlaps this prefix, via the Trust ledger row.
   */
  it("and none of the canon's banned words either", () => {
    const banned = ["receipts", "company brain", "decision layer", "unattended", "provenance"];
    const offenders: string[] = [];
    for (const f of FILES) {
      const code = stripComments(readFileSync(f, "utf8"));
      for (const w of banned) {
        const re = new RegExp(`(?:title|label|sub|heading|placeholder|alt)="[^"]*${w}[^"]*"`, "gi");
        for (const m of code.match(re) ?? [])
          offenders.push(`${f.slice(ROOT.length + 1)} :: ${m.slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * THE BROWSER TAB IS A SURFACE, AND THIS GUARD COULD NOT SEE IT.
 *
 * Found by signing in and reading the tab, not by any check: `/engine-room`
 * rendered **"Safety · Engine room · Supaprod"** and `/brain` rendered **"Brain ·
 * Supaprod"**, both retired words, while the assertions above reported the whole
 * prefix clean. They read rendering PROPS and JSX TEXT; a route's `head()`
 * returns a `meta` array of plain objects and matches neither shape.
 *
 * The tab matters more than its size suggests: it is the only thing a
 * backgrounded window shows, so it is the one surface that reaches somebody who
 * has stepped away from the page entirely.
 *
 * The titles match S2's rail doors rather than §12's full phrases, because the
 * founder ruled a door is one word and a tab disagreeing with the door
 * somebody just clicked is the same mismatch §12 exists to prevent, pointing the
 * other way.
 *
 * ── AND THE DOORS HAVE ALREADY MOVED ONCE UNDER THIS TEST ─────────────────
 * They were **Permissions** and **Learnings** for about an hour. The founder
 * ruled twice more the same night and the rail settled on **Home · Approvals ·
 * Insights · Threads · Policies**, one predictable word each, so `/brain` is
 * **Insights** and `/engine-room` is **Policies**.
 *
 * That churn is the argument FOR pinning to the door instead of to a phrase we
 * like. Nobody had to remember the tab existed: this assertion is what carried
 * the second rename across an ownership boundary, from S2's rail into two route
 * files they do not own.
 */
describe("§12 holds in route tab titles, which the checks above cannot see", () => {
  const ROUTES = join(ROOT, "..", "routes");

  /*
   * Any tab-title STRING, not "a string immediately after `title:`". The first
   * version required the latter and missed the engine-room title outright,
   * because it is a ternary: `title: open ? \`…\` : "…"`. Every tab title in this
   * app ends "· Supaprod", so that suffix is the reliable marker and it survives
   * however the expression around it is written.
   */
  const titles = (): string[] => {
    const out: string[] = [];
    for (const f of tsxUnder(ROUTES)) {
      const code = stripComments(readFileSync(f, "utf8"));
      for (const m of code.match(/(?:`[^`]*·\s*Supaprod[^`]*`|"[^"]*·\s*Supaprod[^"]*")/g) ?? []) {
        out.push(`${f.split("/").pop()} :: ${m}`);
      }
    }
    return out;
  };

  it("found tab titles to check, so this cannot pass by looking at nothing", () => {
    expect(titles().length).toBeGreaterThan(5);
  });

  it("no retired word reaches a browser tab", () => {
    const offenders = titles().filter((t) =>
      /Engine room|Engine Room|Guardrails|Trust ledger|Trust Ledger/.test(t),
    );
    expect(offenders).toEqual([]);
  });

  /**
   * Pinned to the doors rather than to §12's phrases: if S2 renames a door, this
   * fails and whoever renamed it has to bring the tab with them, which is the
   * whole point of the rule.
   */
  it("the two tabs say what their rail doors say", () => {
    /*
     * "Insights · Supaprod" -> "Outcomes · Supaprod" (P-14a, 2026-09-02):
     * `_authenticated.brain.tsx` became `_authenticated.outcomes.tsx`, and
     * the tab title changed with it -- exactly the coupling this test
     * exists to hold, not a defect it caught. "Insights" was the door's own
     * word when this test was written; the rail this test's own header
     * describes (Policies/Insights doors) no longer exists after P-11's
     * three-door rework this session, and the page's honest name now is
     * Outcomes.
     *
     * "Policies · Supaprod" -> "Spend and limits · Supaprod" (P-61,
     * 2026-09-04): §12 itself retires "Policies" (P-11's own rename map),
     * so a test that required the tab to keep saying it was pinned to the
     * violation, not the door.
     *
     * AND "Spend and limits · Supaprod" -> gone entirely (P-79, same day):
     * `/engine-room` is a redirect stub now, no `head()` of its own, and its
     * content is mounted under `/team`'s own URL as Team's own tab -- P-79's
     * own scope line is explicit that "the tab title STAYS Team" even with
     * the spend tab open, which this same coupling now argues FOR rather
     * than against: the door and the tab agreeing is the whole point, and
     * the door here is Team on every one of its own tabs, not a second name
     * for one of them. `_authenticated.team.tsx`'s title assertion below
     * covers what this test used to hold about the engine room.
     */
    const all = titles().join("\n");
    expect(all).toContain("Team · Supaprod");
    expect(all).toContain("Outcomes · Supaprod");
  });
});
