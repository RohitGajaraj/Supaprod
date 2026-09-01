/**
 * ONE RULE, THREE COPIES, ONE SCREEN (2026-09-01).
 *
 * Photographed on Settings -> What they may do without asking:
 *
 *     Your crew does 68 of 74 things without asking.
 *     Set once, in advance. Moving a boundary never interrupts work that is
 *     already running.
 *   What runs on its own
 *     Set once, in advance. Each one is off until you say otherwise, and the
 *     ones that spend money say so.
 *   What your crew may do alone
 *     Set once, in advance. Moving one never interrupts work that is already
 *     running.
 *
 * Three components each stated the pane's governing rule, because each is
 * correct alone and no one of them can see the other two. The posture line
 * keeps it -- it is the sentence that governs the page -- and the two region
 * subs under it dropped it.
 *
 * ── THE TRIPWIRE, AND WHAT IT IS ACTUALLY PROTECTING ──────────────────────
 * `BoundaryStatement` drops the rule when `ruleShownElsewhere` is passed, and
 * `ControlsPanel` passes it when `controlsOnly` is set. `controlsOnly` means
 * "embedded in the Settings pane", which is true of exactly one call site
 * today and is a PROXY -- the day somebody embeds ControlsPanel somewhere
 * without a posture line above it, the rule disappears from that surface and
 * no screen says it at all.
 *
 * Nothing about that failure looks broken. There is no error, no gap, no
 * missing control: a sentence is simply absent, on a page about what agents
 * are allowed to do without asking. So the guard counts the call sites and
 * fails on a new one, which makes the next author read this instead of
 * discovering it in a screenshot months later.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../..", import.meta.url));

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** The clause that was printed three times. */
const RULE = "Set once, in advance";

/**
 * Comments are stripped before scanning, and that is not tidiness.
 * `AutomationBoundary`'s header QUOTES the rule while explaining which switches
 * implement it, which is exactly the kind of writing this repo wants and is not
 * a third copy on anybody's screen. A guard that counted it would push the next
 * author to delete an explanation to make a test pass.
 */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("the boundary rule", () => {
  it("is written in exactly one component, so it cannot drift apart", () => {
    const carriers = tsxFiles(SRC)
      .filter((f) => !f.endsWith(".test.tsx"))
      .filter((f) => code(f).includes(RULE))
      .map((f) => f.replace(SRC, ""));
    /*
     * TWO, and each is the only statement on the surface it governs.
     * `BoundaryControls` carries the posture line that heads the Settings pane.
     * `BoundaryStatement` carries it for the Engine Room's Safety view, where
     * no posture line exists and it would otherwise be said nowhere. A THIRD
     * carrier is the defect this file was written for.
     */
    expect(carriers).toEqual([
      "components/governance/BoundaryControls.tsx",
      "components/governance/BoundaryStatement.tsx",
    ]);
  });

  it("is suppressed only where another component is already stating it", () => {
    const controls = readFileSync(join(SRC, "components/governance/ControlsPanel.tsx"), "utf8");
    // The suppression is tied to `controlsOnly` and to nothing else. A bare
    // `ruleShownElsewhere` or a hardcoded `true` would silence it everywhere.
    expect(controls).toContain("<BoundaryStatement ruleShownElsewhere={controlsOnly} />");
  });

  it("has exactly one surface embedding ControlsPanel, and it states the rule", () => {
    const embedders = tsxFiles(SRC)
      .filter((f) => !f.endsWith(".test.tsx"))
      .filter((f) => /<ControlsPanel[^>]*\bcontrolsOnly\b/s.test(code(f)))
      .map((f) => f.replace(SRC, ""));
    expect(embedders).toEqual(["routes/_authenticated.settings.tsx"]);

    // And that surface renders the component whose posture line carries it.
    const settings = readFileSync(join(SRC, "routes/_authenticated.settings.tsx"), "utf8");
    expect(settings).toContain("<BoundaryControls headingShownElsewhere />");
  });
});
