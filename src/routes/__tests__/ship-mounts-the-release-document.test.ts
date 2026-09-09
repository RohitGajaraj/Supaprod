import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A CAPABILITY WITH NO DOOR DOES NOT EXIST, and this one spent an hour proving it.
 *
 * `src/components/ship/WhatShipped.tsx` was built, tested, reviewed and merged
 * while nothing in the application imported it. It assembles the release
 * document the founder asked for -- what shipped, from the bet through the spec,
 * the design gate, the changeset, the pull request and the deploy, with not one
 * word typed by a human -- and a person using the product could not reach a
 * single line of it. Its own header said so: "SHIPS UNMOUNTED".
 *
 * WHY A SOURCE TEST AND NOT A RENDER TEST. Rendering the Ship route means a
 * router, a workspace provider, a confirm provider and eleven server functions,
 * and every one of those is a thing that can break this test for a reason that
 * has nothing to do with whether the document is mounted. The question here is
 * narrow and structural -- is the component wired into the page, is it gated on
 * the read that decides whether anything shipped, and does the new door take a
 * door away from something else -- and source text answers exactly that.
 * ship-can-ship.test.ts and ship-has-an-agent.test.ts guard this same file the
 * same way for the same reason.
 *
 * THE FOUR RULES, and each one is a failure that has actually happened on this
 * surface or on a sibling of it:
 *
 *   MOUNTED. The component is imported and rendered. Without this the whole
 *   feature is dead code that passes its own tests.
 *
 *   GATED ON THE READ, NOT ON THE LIST. Every query on Ship is `enabled: !!wid`,
 *   and a disabled query is pending WITHOUT fetching, so `isLoading` is false
 *   before a workspace is known. A section that checks only the list length
 *   therefore prints "nothing has shipped yet" on the first paint of every
 *   session, which is a confident false sentence about a list nobody has looked
 *   in yet. So `docReading` must also test `!wid`.
 *
 *   AN HONEST EMPTY STATE. "Nothing has shipped" and "we could not find out" are
 *   different sentences and at most one of them is ever true, so a failed
 *   changelog read must reach `Failed` and never `NoReleaseYet`.
 *
 *   THE NEW DOOR TAKES NOTHING. The release-note row's click was already spoken
 *   for twice -- a contributor starts an announcement draft, everyone else opens
 *   the production address. Binding the document to that click would have traded
 *   one capability for another, which the ratchet forbids, so the document has
 *   its own control in the row's action slot and `startFrom` keeps the click.
 */

/**
 * THE ROUTE THIS FILE READS MOVED (P-14b, A-QUEUE.md, 2026-09-09). `/ship` is a
 * redirect to `/outcomes?tab=artifacts` now, and every region it drew is
 * `src/components/ship/ShipRecord.tsx`, mounted above the artifacts shelf. Not
 * one line of the body changed in the fold, so every assertion below is the one
 * it was, pointed at the file that holds the code.
 */
const SHIP = join(import.meta.dir, "..", "..", "components", "ship", "ShipRecord.tsx");

/** Source with comments removed, so a rule can never be satisfied by prose
 *  ABOUT the rule. Same treatment ship-can-ship.test.ts uses. */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const shipSrc = code(SHIP);

describe("the release document is reachable from Ship", () => {
  it("imports the component and its empty state from the component file", () => {
    expect(shipSrc).toContain('from "@/components/ship/WhatShipped"');
    expect(shipSrc).toMatch(/import\s*\{[^}]*\bWhatShipped\b[^}]*\}/);
    expect(shipSrc).toMatch(/import\s*\{[^}]*\bNoReleaseYet\b[^}]*\}/);
  });

  it("renders it against a real changelog entry and the active workspace", () => {
    expect(shipSrc).toMatch(/<WhatShipped\s+entry=\{docEntry\}\s+workspaceId=\{wid \|\| null\}/);
  });

  it("picks the newest release until the reader picks another", () => {
    // The fallback chain is the whole of it: a chosen id, else the newest, else
    // nothing. A chosen release that has left the list falls back rather than
    // blanking the section on a background refetch.
    expect(shipSrc).toMatch(/docId \?[\s\S]{0,80}notes\.find\(\(e\) => e\.id === docId\)/);
    expect(shipSrc).toMatch(/\?\? notes\[0\] \?\? null/);
  });
});

describe("the section says only what it knows", () => {
  it("treats an unresolved workspace as still reading, not as nothing shipped", () => {
    expect(shipSrc).toMatch(/const docReading\s*=\s*!wid \|\| changelog\.isLoading/);
  });

  it("mounts the document only once the changelog read has genuinely answered", () => {
    expect(shipSrc).toMatch(
      /!docReading && !changelog\.isError && docEntry\s*\?\s*\(\s*<WhatShipped/,
    );
  });

  it("separates 'nothing has shipped' from 'the read failed'", () => {
    // Both sentences exist, and the failure carries the retry rather than
    // pretending the list is empty.
    expect(shipSrc).toContain("<NoReleaseYet />");
    /* THE COMPONENT NAME IS NOT THE CLAIM. This pinned `<Failed`, the retired
       primitive, so a Meridian port that renamed it to `ReadFailedLine` -- the
       bare half, correct inside a region that already draws its own container
       -- broke a guard whose requirement it satisfied exactly. What must hold is
       that the failed read says so AND carries the refetch, above its own
       sentence.

       AND IT HAPPENED A SECOND TIME, which is why the shape below is now loose
       rather than exact. The rewritten version still pinned the tag's full
       attribute list, so adding `error={changelog.error}` -- which gives an
       ended session a sign-in door instead of a retry that cannot work, and is
       strictly MORE of what this test asks for -- broke it again. A guard that
       fails on an improvement to the thing it guards is testing syntax, not
       behaviour. The three requirements are asserted with gaps between them so
       any further prop, in any order, passes. */
    expect(shipSrc).toMatch(
      /changelog\.isError\s*\?\s*\(\s*<ReadFailed(?:Line)?\b[\s\S]{0,240}?onRetry=\{\(\) => void changelog\.refetch\(\)\}[\s\S]{0,160}?The releases did not load/,
    );
    // The empty state is only reachable after both of those were ruled out.
    expect(shipSrc).toMatch(
      /docReading \?[\s\S]{0,600}?changelog\.isError \?[\s\S]{0,400}?!docEntry \?\s*\(\s*<NoReleaseYet/,
    );
  });
});

describe("the new door costs the row nothing", () => {
  it("gives the document its own control instead of taking the row's click", () => {
    expect(shipSrc).toMatch(/onClick=\{\(\) => setDocId\(e\.id\)\}/);
    /*
     * The two doors that were already on this row survive.
     *
     * The composer's is now CONDITIONAL, and that is P-96 rather than drift: an
     * announcement is the only thing here a stranger reads, so it is offered
     * over a release with a production deploy on the record and not over one
     * that merged and was never promoted. The requirement this guard holds is
     * that a contributor still reaches the composer from the row; which rows
     * qualify is `mayAnnounce`'s, and its own guards hold that.
     */
    /* `[\s\S]{0,140}?` and not `[^?]*`: the condition now contains `??`, so a
       class excluding `?` could never reach the ternary it is looking for. */
    expect(shipSrc).toMatch(/canContribute[\s\S]{0,140}?\?\s*\(\)\s*=>\s*startFrom\(e\)/);
    expect(shipSrc).toContain("mayAnnounce({ productionUrl: e.production_url ?? null })");
    expect(shipSrc).toContain("<Addr href={e.production_url}>Open it</Addr>");
  });

  it("marks the release in focus rather than offering a control that does nothing", () => {
    expect(shipSrc).toMatch(/const inFocus = docEntry\?\.id === e\.id/);
    expect(shipSrc).toMatch(/focused=\{inFocus\}/);
    /* THE PAREN WAS NEVER THE CLAIM. This read `inFocus ? null : (`, so it was
       pinning PRETTIER'S line-breaking as much as the behaviour: the Meridian
       port replaced a five-line raw `<button>` with a one-line `RowDoor`, the
       wrapping parenthesis stopped being needed, and a guard about a control
       that must not be drawn failed over whitespace. The requirement is that the
       release in focus is offered NOTHING in the action slot. */
    expect(shipSrc).toMatch(/inFocus \? null :/);
  });
});
