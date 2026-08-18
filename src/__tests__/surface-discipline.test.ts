import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards for docs/conventions/surface-discipline.md.
 *
 * WHY THESE ARE TESTS AND NOT PROSE. Every rule here was written after a defect the
 * founder hit in the running product, and each one is the kind of mistake that
 * typechecks perfectly and looks fine in a diff. A document describing them protects
 * nothing on the day somebody is moving fast; a failing test does.
 *
 * FOUNDER RULING 2026-08-01, and it is the reason this file exists rather than a
 * note in a session handoff: "this is not just you going and fixing right now.
 * Tomorrow, if something changes, we are adding some new features or modifying it,
 * the same rules should also apply for tomorrow's thing as well ... please
 * incorporate this into some rules or something so that it knows exactly what and
 * how it needs to be done."
 *
 * Each test names the defect it exists to prevent. If one of these ever needs to
 * change, change the rule in the doc first and say why here.
 */

const SRC = join(import.meta.dir, "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** CSS comments legitimately discuss the banned patterns in order to ban them. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** One CSS rule body, by selector, with comments already stripped. */
function ruleBody(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match the selector only when it is the whole selector list for the block, so
  // `.sp-codediff-body` does not also match `.sp-codediff-body[data-wrap]`.
  const re = new RegExp(`(^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, "m");
  const m = re.exec(stripCssComments(css));
  return m ? m[2] : null;
}

describe("surface-discipline §1: exactly one page scroller", () => {
  test("the diff body never becomes a vertical scroll container", () => {
    // THE DEFECT: `max-height: 60vh; overflow: auto` on this box made it a second
    // vertical scroller inside `.sp-work`. Wheeling over the diff scrolled the diff
    // and the page stayed still, so the page read as frozen. Reported as "I'm not
    // able to scroll to the end. It's got stuck."
    /*
     * READ FROM THE COMPONENT, NOT FROM primitives.css, SINCE 2026-08-18.
     *
     * The diff's paint moved into `CodeDiff.tsx`'s own `<style>` sheet as part
     * of the Meridian port, so the `.sp-codediff-*` rules this used to read are
     * now orphaned: nothing renders them. The guard kept passing, because the
     * dead rules still satisfied it.
     *
     * That is the same failure this repo found twice today: a guard pinned to a
     * string while the meaning moved somewhere else. It was protecting a real
     * reported defect, so pointing it at the live rules matters more than
     * usual.
     */
    const body = ruleBody(read("components/studio/CodeDiff.tsx"), ".cd-body");
    expect(body).not.toBeNull();
    expect(body!).toContain("overflow-x");
    // Sideways is the point: a long line has nowhere else to go.
    expect(body!).not.toMatch(/overflow-y:\s*(auto|scroll)/);
    expect(body!).not.toMatch(/^\s*overflow:\s*(auto|scroll)/m);
    // And it must not be pinned to a height (§3).
    expect(body!).not.toMatch(/max-height:/);
    expect(body!).not.toMatch(/(^|[^-])height:/);
  });

  test("the work column is the only scroller the shell declares", () => {
    // If a second page-level scroller ever appears, scroll restoration and the
    // wheel both become ambiguous. `.sp-work` owns it.
    const shell = stripCssComments(read("styles/shell.css"));
    const pageScrollers = [...shell.matchAll(/\.sp-(work|inner|main|wide)\s*\{([^}]*)\}/g)].filter(
      ([, , decls]) => /overflow-y:\s*(auto|scroll)/.test(decls),
    );
    expect(pageScrollers.map(([, name]) => name)).toEqual(["work"]);
  });
});

describe("surface-discipline §2: container queries inside a pane", () => {
  test("the diff's own breakpoints are container queries, not viewport queries", () => {
    // THE DEFECT: `@media (max-width: 900px)` never fires at a 1512px window while
    // the pane it targets is 467px wide, so the two-column diff would have rendered
    // two ~230px columns of unreadable code.
    const css = stripCssComments(read("components/studio/CodeDiff.tsx"));
    const paneSelectors = [".cd-pair", ".cd-split"];
    for (const sel of paneSelectors) {
      // Every breakpoint that mentions a pane selector must be a @container.
      const blocks = [...css.matchAll(/@(media|container)([^{]*)\{((?:[^{}]|\{[^}]*\})*)\}/g)];
      for (const [, kind, , inner] of blocks) {
        if (inner.includes(sel)) {
          expect(kind).toBe("container");
        }
      }
    }
  });

  test("a container query has an ancestor that declares containment", () => {
    // A `@container` with no `container-type` anywhere silently never matches,
    // which is a worse failure than a viewport query because it looks correct.
    const css = stripCssComments(read("components/studio/CodeDiff.tsx"));
    if (css.includes("@container")) {
      expect(css).toMatch(/container-type:\s*inline-size/);
    }
  });
});

describe("surface-discipline §5: a diff delta is green and red, and never a fake zero", () => {
  test("the diffstat uses the outcome tokens rather than literal hex", () => {
    // Semantic tokens only: a hex pair here would not follow the theme, and the
    // light theme uses different values for the same meaning.
    const body = ruleBody(read("styles/primitives.css"), ".sp-diff .sp-pass");
    expect(body).not.toBeNull();
    expect(body!).toContain("--sp-pass");
    expect(body!).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  test("per-line diff colour comes from the tokens, in both directions", () => {
    const css = stripCssComments(read("styles/primitives.css"));
    const add = ruleBody(css, '.sp-codediff-row[data-kind="add"]');
    const del = ruleBody(css, '.sp-codediff-row[data-kind="del"]');
    expect(add).not.toBeNull();
    expect(del).not.toBeNull();
    expect(add!).toContain("--sp-pass");
    expect(del!).toContain("--sp-fail");
    // Colour is never the only carrier: the sign column must exist too.
    expect(css).toContain(".sp-codediff-sign");
  });

  test("Diffstat draws no zero side", () => {
    // THE DEFECT: a created file rendered "+10 -0", presenting a zero as a finding
    // when nothing was removed because there was nothing there to remove.
    const src = read("components/shell/primitives.tsx");
    // Slice from the declaration to the next top-level `export`, rather than to the
    // first `\n}`: that one closes the destructured props, not the function.
    const start = src.indexOf("export function Diffstat(");
    expect(start).toBeGreaterThan(-1);
    const rest = src.slice(start + 1);
    const end = rest.indexOf("\nexport ");
    const fn = end === -1 ? rest : rest.slice(0, end);
    // Both halves are conditional, so a zero side is never rendered as a finding.
    expect(fn).toMatch(/added > 0/);
    expect(fn).toMatch(/removed > 0/);
  });
});

describe("surface-discipline: a quiet action is never drawn in the metadata ink", () => {
  test("the quiet action sits one step up the ink scale from metadata", () => {
    // THE DEFECT: `.sp-block-more` was `--sp-mute`, which is the ink used for
    // "merged", "3 files" and every timestamp. A VERB and a LABEL rendered
    // identically, so nothing on the surface said where a person could act.
    // Reported as "it looks like a very non-activated texture".
    const css = read("styles/primitives.css");
    const act = ruleBody(css, ".sp-block-more");
    const meta = ruleBody(css, ".sp-row-sub");
    expect(act).not.toBeNull();
    expect(meta).not.toBeNull();
    // Metadata stays quiet; the action must not share that ink.
    expect(meta!).toContain("--sp-mute");
    expect(act!).toContain("--sp-body");
    expect(act!).not.toMatch(/color:\s*var\(--sp-mute\)/);
  });

  test("it carries a rest-state affordance, not only a hover one", () => {
    // A signal you can only receive by hovering is a signal received by accident,
    // and it never reaches touch or a keyboard scan at all.
    const act = ruleBody(read("styles/primitives.css"), ".sp-block-more");
    expect(act!).toMatch(/text-decoration-style:\s*dotted/);
    expect(act!).toContain("cursor: pointer");
  });

  test("its focus ring is an outline, not a box-shadow", () => {
    // `styles.css` carries an unlayered `[data-obsidian] :focus-visible
    // { box-shadow: none }` that sits AFTER primitives.css in source order, so a
    // shadow-based ring is silently erased. Five rules in primitives.css were
    // already inert for exactly this reason.
    const focus = ruleBody(read("styles/primitives.css"), ".sp-block-more:focus-visible");
    expect(focus).not.toBeNull();
    expect(focus!).toMatch(/outline:/);
    expect(focus!).not.toMatch(/box-shadow:/);
  });

  test("a disabled quiet action stops promising", () => {
    const off = ruleBody(read("styles/primitives.css"), ".sp-block-more:disabled");
    expect(off).not.toBeNull();
    expect(off!).toMatch(/text-decoration:\s*none/);
    expect(off!).toMatch(/cursor:\s*default/);
  });
});

describe("surface-discipline §6: the wait", () => {
  test("the app-wide loader renders the mark and never the product name", () => {
    // THE DEFECT: the loader drew the word "supaprod" in Geist Pixel. The product
    // name is the one fact a person waiting already has.
    const wait = read("components/supaprod/BrandWait.tsx");
    const router = read("router.tsx");
    // No visible product name anywhere in the rendered output. It may appear in
    // comments and imports, so strip those first.
    const rendered = wait
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/^import .*$/gm, "");
    expect(rendered).not.toMatch(/>\s*supaprod\s*</i);
    expect(rendered).not.toMatch(/Geist Pixel/);
    expect(wait).toContain("SupaprodMark");
    // Wired app-wide, so one change reaches every route.
    expect(router).toContain("BrandWait");
    expect(router).toContain("defaultPendingComponent");
  });

  test("the wait is centred against the viewport and announces itself", () => {
    // THE DEFECT: `min-height: 40vh` centres in the top 40% of the region, which
    // reads as a mistake rather than a composition. And the old loader was
    // aria-hidden, so a screen reader was told nothing at all during the wait.
    const wait = read("components/supaprod/BrandWait.tsx");
    expect(wait).toContain("placeItems");
    expect(wait).toMatch(/position:\s*"fixed"/);
    expect(wait).toContain('role="status"');
    expect(wait).toContain('aria-live="polite"');
  });

  test("the loader's own mark stays legible while it turns", () => {
    // THE DEFECT: the loader's full-curve track was `--hairline-strong` (about 0.09
    // alpha) at opacity 0.22, an effective alpha near 0.02. Invisible. So a person
    // saw only the travelling comet and the seven-petal mark could not be
    // recognised, which is the one job a brand loader has.
    const mark = read("components/supaprod/SupaprodMark.tsx");
    const track = /opacity=\{(0\.\d+)\}/.exec(mark);
    expect(track).not.toBeNull();
    expect(Number(track![1])).toBeGreaterThanOrEqual(0.3);
  });
});

describe("surface-discipline §5b: status colour beyond diffs", () => {
  test("all four status utility classes exist and use their semantic tokens", () => {
    // THE PRINCIPLE: status colour carries meaning and survives greyscale because
    // it is NEVER the only carrier; the shape/position/text already says the state.
    // These utilities let any inline text wear the status without inventing a hex.
    const css = read("styles/primitives.css");
    const pass = ruleBody(css, ".sp-pass");
    const fail = ruleBody(css, ".sp-fail");
    const warn = ruleBody(css, ".sp-warn");
    const gate = ruleBody(css, ".sp-gate");
    expect(pass).not.toBeNull();
    expect(fail).not.toBeNull();
    expect(warn).not.toBeNull();
    expect(gate).not.toBeNull();
    expect(pass!).toContain("--sp-pass");
    expect(fail!).toContain("--sp-fail");
    expect(warn!).toContain("--sp-warn");
    expect(gate!).toContain("--sp-gate");
  });

  test("the status dot already carries gate colour", () => {
    // The dot wears ember in the gate state, which is enough urgency signal
    // without colouring the headline text (founder ruling: no two shades of
    // ember, the text stays ink).
    const css = stripCssComments(read("styles/shell.css"));
    expect(css).toMatch(/\.sp-live-dot\[data-state="gate"\]/);
    expect(css).toContain("--sp-gate");
  });
});

describe("surface-discipline §7: an indicator means an agent is running", () => {
  test("Loading only wears the agent's clothes when told to", () => {
    // `working` must stay opt-in and default off, so a plain fetch can never
    // accidentally claim an agent is reasoning about it.
    const src = read("components/shell/primitives.tsx");
    expect(src).toMatch(/working\s*=\s*false/);
  });

  test("the per-action detail is passed through rather than invented", () => {
    const pulse = read("components/meridian/AgentPulse.tsx");
    expect(pulse).toContain("detail");
    // The rotating word is decorative; the static label is what is announced.
    expect(pulse).toContain('aria-live="polite"');
  });

  /*
   * THE PROP THAT CAUSES THE LIE MUST NOT EXIST.
   *
   * The test above asks whether the indicator is honest about WHAT it reports.
   * This one asks whether it can be handed the wrong fact at all, which is the
   * failure that actually shipped: `primitives.Loading` took a `working`
   * boolean, and eleven of the twelve pulses in the product ended up gated on a
   * mutation's `isPending` -- reporting the fetch the reader's own click
   * started, and dying the instant it resolved.
   *
   * Mounting the component IS the claim that an agent is running. With no
   * boolean to hand it, a caller cannot wire a fetch to it without writing that
   * lie in plain sight at the call site, where a reviewer can see it. A prop
   * that can be handed the wrong fact eventually will be.
   */
  test("the indicator takes no boolean it could be lied to with", () => {
    const pulse = read("components/meridian/AgentPulse.tsx");
    const props = pulse.slice(pulse.indexOf("export function AgentPulse"));
    expect(props).not.toMatch(/\b(working|isPending|isFetching|busy|pending|loading)\??\s*:/);
  });
});
