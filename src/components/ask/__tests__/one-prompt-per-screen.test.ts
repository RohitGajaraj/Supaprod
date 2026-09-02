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
const START = readFileSync(join(ROOT, "routes", "_authenticated.start.tsx"), "utf8");
const SHELL = readFileSync(join(ROOT, "styles", "shell.css"), "utf8");
const DOCK = readFileSync(join(ROOT, "components", "ask", "AskDock.tsx"), "utf8");

describe("a surface that owns the prompt gets the dock out of its way", () => {
  // "Today marks its composer" left this describe block (P-14, A-QUEUE.md):
  // `components/today/Board.tsx` was unmounted (zero importers) and deleted.

  it("and so does Start, which is the surface that needed it most", () => {
    /* THE RULE WAS WRITTEN AND APPLIED TO ONE SURFACE. /start went unmarked
       for as long as this test has existed, so the FIRST screen a person
       meets asked for their sentence twice: once in its own field, under a
       character saying "Say what needs doing in one sentence", and again 500px
       below in a bar reading "What should we build?". Photographed at 1440.

       Worse than Today's version, because the two do not do the same thing.
       F-04 measures that the dock files a MISSION the run workbench cannot
       see; this field files a track. A person picking the wrong one of two
       identical-looking invitations gets work the product cannot show them. */
    expect(START).toMatch(/data-page-composer/);
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

/**
 * R-24's INTERIM, ENFORCED SO IT CANNOT SILENTLY COME BACK.
 *
 * The ruling: "AskDock must stop saying 'What should we build?' while it opens
 * a chat. That copy promises the loop and delivers a conversation." It stood
 * ruled and unbuilt from 2026-08-25, on the most-seen string in the product.
 *
 * This guards the ABSENCE rather than the replacement, because the replacement
 * is copy and copy is allowed to improve. What is not allowed is promising the
 * loop from a control that opens a conversation -- until queue item 16 makes a
 * dispatch create a track, at which point delete this test rather than edit it.
 */
describe("the dock does not promise the loop while it opens a chat", () => {
  it("has stopped asking what to build", () => {
    expect(DOCK).not.toMatch(/What should we build\?/);
    // The accessible name is the same promise, heard rather than read, and was
    // the half most likely to be missed.
    expect(DOCK).not.toMatch(/aria-label="[^"]*what to build/i);
  });

  it("still invites, rather than going silent", () => {
    // The failure mode of a copy ruling is deleting the sentence. The dock's
    // whole purpose is that the door is visible without knowing a shortcut.
    expect(DOCK).toMatch(/<span className="sp-dock-prompt">[^<]{8,}<\/span>/);
  });
});
