import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE SPEC SURFACE HAS A PRIMARY OBJECT, AND IT IS THE SPEC.
 *
 * THE DEFECT THIS EXISTS TO KILL, measured 2026-08-05. The largest surface in
 * the product declared six co-equal "modes" in one flat `.sp-tabs` row sitting
 * directly under the shell's seven-chip station strip: two undifferentiated
 * horizontal rows of targets, thirteen of them, stacked. Underneath, fourteen
 * Blocks in a single vertical scroll.
 *
 * The diagnosis was structural rather than cosmetic. A spec is a DOCUMENT, and
 * a document surface has a body and a margin. With six co-equal modes nothing
 * was the body: choosing "Contract" took the spec off the screen entirely, so
 * you read what a document promised with the document itself gone. Every block
 * was fighting thirteen peers for rank and none of them could win.
 *
 * WHY A BUILD-FAILING TEST RATHER THAN A REVIEW NOTE. Adding a seventh tab to a
 * tab strip is the single easiest edit anyone will ever make to this file. It
 * typechecks, it renders, it looks like six lines of nothing in a diff, and it
 * silently undoes the one thing that gives this surface a subject. The next
 * person adding a view will copy the shape of the last one, so the shape has to
 * be the one worth copying.
 *
 * THE FIVE LINES THIS DRAWS:
 *
 *   1. THERE IS A BODY, AND IT IS UNCONDITIONAL. One region titled "The spec"
 *      that is not inside any view branch. If the document can be switched off
 *      by picking something else, the surface is back to having no subject.
 *
 *   2. THE READINGS ARE A CONTROL, NOT A SECOND NAVIGATION. No `.sp-tabs` on
 *      this surface at all. The ruling is Brain's, made on ArtifactsView and
 *      binding here: "Two identical tab rows stacked ... is two things
 *      competing to be the navigation and neither winning. A radio group reads
 *      as a control, which is what it is." The station strip is the navigation.
 *
 *   3. THE RATCHET HOLDS. Every one of the six values `?tab=` accepts still
 *      resolves to something on this page, and every panel that rendered before
 *      the restructure still renders. This was a re-ranking, and a re-ranking
 *      that drops a panel is a deletion wearing a layout's clothes.
 *
 *   4. RANK IS SOURCE ORDER. The body is rendered before the readings taken
 *      from it, and the record recess speaks before the action row rather than
 *      after the handoff. A warning that arrives after the decision is not a
 *      warning.
 *
 *   5. NO DASHES IN USER-FACING TEXT.
 *
 * Modelled on today-states-its-wait.test.ts: scan the source as TEXT and strip
 * comments first, because the fixed file legitimately describes every banned
 * shape in prose in order to ban it.
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.plan.spec.$id.tsx");

/**
 * Strip comments so prose that NAMES the banned shape does not trip it, while
 * keeping the line count intact: a failure that points at the wrong line costs
 * more than it saves.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/^(\s*)\/\/.*$/gm, "$1");
}

const src = stripComments(readFileSync(ROUTE, "utf8"));

/** Where the surface is actually drawn, which is where these rules bite. */
const SURFACE_AT = src.indexOf("<Surface\n        wide");
const jsx = src.slice(SURFACE_AT);

/** The offending lines, quoted with their real line numbers. Asserting against
 *  the whole file prints 1,400 lines on failure, and a build failure a person
 *  has to scroll past is one they learn to skim. */
function offenders(pattern: RegExp): string[] {
  return src
    .split("\n")
    .map((line, i) => `${i + 1}: ${line.trim()}`)
    .filter((line) => pattern.test(line));
}

/** A `const NAME = [...] as const` array literal, read back as its members. */
function constList(name: string): string[] {
  const m = new RegExp(`const ${name} = \\[([^\\]]*)\\] as const`).exec(src);
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map(([, v]) => v);
}

describe("the spec surface has one body, and it is the document", () => {
  it("renders a region titled 'The spec', exactly once", () => {
    expect(offenders(/title="The spec"/)).toHaveLength(1);
  });

  it("the body is not inside a view branch, so nothing can switch it off", () => {
    const bodyAt = jsx.indexOf('title="The spec"');
    const readingsAt = jsx.indexOf('title="What this spec becomes"');
    expect(bodyAt).toBeGreaterThan(-1);
    expect(readingsAt).toBeGreaterThan(-1);

    // The readings are picked with `lens`. If `lens` is consulted anywhere
    // above the body, the body is conditional on a reading and is not a body.
    expect(jsx.slice(0, bodyAt)).not.toMatch(/\blens\b/);
  });

  it("writing and reading are a state OF the body, picked inside it", () => {
    const bodyAt = jsx.indexOf('title="The spec"');
    const readingsAt = jsx.indexOf('title="What this spec becomes"');
    const body = jsx.slice(bodyAt, readingsAt);
    // One control, in the body's own region, and both states are on screen.
    expect(body).toContain("<Choices<Pane>");
    expect(body).toContain('id: "write"');
    expect(body).toContain('id: "read"');
    // The document itself, both ways, inside that region.
    //
    // The read state named `<ReactMarkdown` until 2026-08-10, when the renderer
    // moved to `<SpecProse>` so that the `[n]` citation markers this surface had
    // always printed as literal characters could become real chips. The
    // assertion's SUBJECT is unchanged: this region must contain the document in
    // both of its states, and a route that renders the words through a component
    // rather than inline is still rendering the words. What it must never do is
    // put the document behind a reading.
    expect(body).toContain("<textarea");
    expect(body).toContain("<SpecProse");
  });
});

describe("the readings are a control, never a second navigation", () => {
  it("draws no tab strip anywhere on this surface", () => {
    // THE DEFECT, in its original form: `<div className="sp-tabs" role="tablist"
    // aria-label="Spec views">` with six `.sp-tab` buttons in it.
    expect(offenders(/className="sp-tabs?"/)).toEqual([]);
    expect(offenders(/role="tab(list)?"/)).toEqual([]);
    expect(offenders(/data-tab-id/)).toEqual([]);
  });

  it("the four readings are one radio group inside the region they govern", () => {
    const readingsAt = jsx.indexOf('title="What this spec becomes"');
    expect(readingsAt).toBeGreaterThan(-1);
    expect(jsx.slice(readingsAt)).toContain("<Choices<Lens>");
    expect(constList("LENS_TABS")).toEqual(["contract", "projections", "flow", "launch"]);
  });
});

describe("the ratchet: nothing became unreachable", () => {
  it("every value a link can carry still resolves", () => {
    const modes = constList("MODE_TABS");
    // The six the route has always validated. Dropping one silently breaks
    // every existing link, redirect and navigate that carries it.
    expect(modes.sort()).toEqual(
      ["contract", "edit", "flow", "launch", "preview", "projections"].sort(),
    );

    // Four of them name a reading; the two left over are the body's own states,
    // and both resolvers are total over the six.
    const lenses = constList("LENS_TABS");
    expect(modes.filter((m) => !lenses.includes(m)).sort()).toEqual(["edit", "preview"]);
    expect(src).toContain("const paneFor = ");
    expect(src).toContain("const lensFor = ");
    expect(src).toContain("paneFor(initialTab)");
    expect(src).toContain("lensFor(initialTab)");
  });

  it("every reading has a branch that draws something", () => {
    for (const lens of constList("LENS_TABS")) {
      // Three of the four are named branches; the fourth is the trailing else,
      // which is why the count is one short of the list on purpose.
      const named = new RegExp(`lens === "${lens}"`).test(jsx);
      expect({ lens, reachable: named || lens === "launch" }).toEqual({ lens, reachable: true });
    }
  });

  it("every panel that rendered before the restructure still renders", () => {
    // The re-ranking moved things. It removed nothing, and a panel quietly
    // dropped during a layout pass is a deletion wearing a layout's clothes.
    const PANELS = [
      "OutcomeContractPanel",
      "IntentVsBuiltReceipt",
      "OutcomeCard",
      "SpecProjectionsPanel",
      "FlowDiagram",
      "DesignScaffoldPanel",
      "LaunchPlanPanel",
      "DesignReadinessPanel",
      "CitationsCard",
      "CriticBadge",
      "RewindButton",
      "RepoGateDialog",
    ];
    for (const panel of PANELS) {
      expect({ panel, drawn: new RegExp(`<${panel}[\\s/>]`).test(src) }).toEqual({
        panel,
        drawn: true,
      });
    }
  });

  it("the handoff, the work and the provenance are still their own regions", () => {
    for (const region of [
      "Where this spec goes next",
      "The work this implies",
      "Why this spec exists",
      "What you did here",
    ]) {
      expect({ region, drawn: jsx.includes(`title="${region}"`) }).toEqual({ region, drawn: true });
    }
  });
});

describe("rank is source order", () => {
  it("the document comes before the readings taken from it", () => {
    expect(jsx.indexOf('title="The spec"')).toBeLessThan(
      jsx.indexOf('title="What this spec becomes"'),
    );
  });

  it("the exit stays high: the handoff sits between the body and the readings", () => {
    const body = jsx.indexOf('title="The spec"');
    const handoff = jsx.indexOf('title="Where this spec goes next"');
    const readings = jsx.indexOf('title="What this spec becomes"');
    expect(body).toBeLessThan(handoff);
    expect(handoff).toBeLessThan(readings);
  });

  it("the record speaks before the actions, not after the handoff", () => {
    // It exists to say the ground under this spec has moved. It used to render
    // below the handoff, which is after the point where you commit.
    //
    // THE HANDLE MOVED WITH THE MERIDIAN PORT, THE CLAIM DID NOT. This read
    // `<RecordRecess`, the local alias the route gave `primitives.Record`. The
    // route now draws `meridian/surface-parts`' `RecordSpeaks`, which is the
    // same object under the name the design system gives it, so the handle is
    // renamed and every assertion below is unchanged. What is pinned here is
    // the ORDER, not the spelling.
    const record = jsx.indexOf("<RecordSpeaks");
    const actions = jsx.indexOf('shortcut="⌘S"');
    const handoff = jsx.indexOf('title="Where this spec goes next"');
    expect(record).toBeGreaterThan(-1);
    expect(record).toBeLessThan(actions);
    expect(record).toBeLessThan(handoff);
    // And it is drawn exactly once. Two regions saying the same thing in
    // different words is the defect the recess was built to end.
    expect(offenders(/<RecordSpeaks/)).toHaveLength(1);
  });

  it("what you did lands next to where you did it", () => {
    const actions = jsx.indexOf('shortcut="⌘S"');
    const receipts = jsx.indexOf('title="What you did here"');
    const body = jsx.indexOf('title="The spec"');
    expect(actions).toBeLessThan(receipts);
    expect(receipts).toBeLessThan(body);
  });
});

describe("the surface's copy stays clean", () => {
  it("keeps its dashes out of user-facing text", () => {
    expect(offenders(/[–—]/)).toEqual([]);
  });

  it("invents no progress on a timer", () => {
    // The shape src/__tests__/no-fabricated-agent-steps.test.ts fails the build
    // over, restated here because this surface runs four agent-facing calls.
    expect(offenders(/setInterval|setTimeout/)).toEqual([]);
  });
});
