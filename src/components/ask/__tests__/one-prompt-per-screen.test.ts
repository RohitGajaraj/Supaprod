import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ONE INVITATION PER SCREEN.
 *
 * THE DEFECT, seen in a browser at 1280px. Today rendered its own Ask card --
 * the one its comment calls "PRIMARY INTERFACE: Ask bar (agentic-first entry
 * point)" -- and the global dock sat 500 pixels below it reading the same
 * words. The front door asked "What should we build?" twice, in two controls
 * that do the same thing, on the surface whose entire job is to make prompting
 * feel like the primary interaction.
 *
 * THE RULE ALREADY EXISTED AND WAS APPLIED ONCE. `AskDock`'s own comment: "The
 * pane owns the screen while it is open; the dock stands down so there is never
 * a second input for the same conversation." Correct, and never extended to a
 * SURFACE that owns a composer.
 *
 * DECLARATIVE, SO IT MAINTAINS ITSELF. A surface marks its composer
 * `data-page-composer` and the dock yields via `:has()`. No React state, no
 * route list to keep in step, and no way for the two to disagree -- which is
 * the shape of bug this repo paid for repeatedly overnight, every time one fact
 * lived in two files.
 *
 * NOTHING IS REMOVED. `AskDock` still renders `AskPane`, kept mounted so
 * opening and closing never remounts a conversation. Verified in a browser:
 * with the dock row hidden, Cmd+K still opens the pane and Escape still closes
 * it. The capability is untouched; only the second copy of the invitation is
 * gone, which is what the ratchet protects and what it does not.
 */

const ROOT = join(import.meta.dir, "..", "..", "..");
const TODAY = readFileSync(join(ROOT, "routes", "_authenticated.today.tsx"), "utf8");
const SHELL = readFileSync(join(ROOT, "styles", "shell.css"), "utf8");
const DOCK = readFileSync(join(ROOT, "components", "ask", "AskDock.tsx"), "utf8");

describe("a surface that owns the prompt gets the dock out of its way", () => {
  it("Today marks its composer", () => {
    expect(TODAY).toMatch(/data-page-composer/);
  });

  it("the dock yields to it", () => {
    expect(SHELL).toMatch(/body:has\(\[data-page-composer\]\) \.sp-dock \{\s*display: none;/);
  });

  it("and the work region reclaims the space the dock reserved", () => {
    // `.sp-work` carries a bottom padding sized for the dock. Leaving it would
    // hold open a gap for a control that is not there, which reads as the page
    // ending early.
    expect(SHELL).toMatch(/body:has\(\[data-page-composer\]\) \.sp-work \{\s*padding-bottom: 0;/);
  });

  it("only the collapsed ROW yields, never the pane", () => {
    // The pane stays mounted so a conversation survives opening and closing.
    // If this ever became `.sp-dock, .sp-askpane` the surface would lose Cmd+K,
    // which is the one control the whole product is organised around.
    const rule = SHELL.slice(SHELL.indexOf("body:has([data-page-composer])"));
    expect(rule.slice(0, 300)).not.toMatch(/askpane|ask-pane/i);
    expect(DOCK).toMatch(/<Pane \/>/);
  });

  it("the dock still stands down for the open pane, which is where the rule came from", () => {
    // The original case must keep working: two inputs for one conversation is
    // the thing being prevented, whichever way the second one arrives.
    expect(DOCK).toMatch(/if \(ask\.isOpen\) return <Pane \/>;/);
  });
});
