/**
 * ONE CONDITION, ONE REMEDY (S4-167).
 *
 * On `/today` against a dead backend a person got **two**: the shell's *"Your
 * session ended. Sign in again and this will load"* with a Sign in door, and the
 * body's *"This could not be read…"* with **Try again**. **A retry against a
 * dead token retries into the same failure** — an offer the product cannot
 * honour.
 *
 * ── THE RULE IS ALREADY WRITTEN, THIS CLOSES THE ONE GAP IN IT ────────────
 * `AppFrame`'s own comment: *"A dead token fails every read in the tab at once…
 * a person needs ONE door. So the shell says it once, above everything, and the
 * regions go back to naming which read failed."* Regions that hold an `error`
 * already resolve it through `wayOut`. **The workspaces region holds no error**
 * — every board query is `enabled: Boolean(workspaceId)` and idle in exactly
 * that state — so it kept offering the second door.
 *
 * ── WHY THE DEFAULT DIRECTION MATTERS MORE THAN THE FIX ───────────────────
 * `useSessionEnded()` returns null outside the shell. So a surface rendered
 * without the provider **keeps every remedy it already had**: this can only ever
 * suppress a retry where the shell has already put a working door on screen, and
 * can never strip one from somewhere nothing is watching.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const BOARD = readFileSync("src/components/today/Board.tsx", "utf8");
const FRAME = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const CTX = readFileSync("src/components/shell/session-ended.tsx", "utf8");

/** Source with comments stripped, so prose describing the bug is not read as the bug. */
function codeOnly(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

describe("the shell hands its answer down instead of the region guessing", () => {
  it("derives the fact once, in the shell, from reads that are not workspace-gated", () => {
    /* The five AppFrame queries carry no `enabled`, so they DO error on a dead
       backend - which is why the banner S4 saw was correct while the board's
       own queries sat idle. If someone gates them later, this fact stops being
       available and the banner goes quiet; that is the thing to notice. */
    const code = codeOnly(FRAME);
    expect(code).toContain("const sessionEnded =");
    expect(code).toContain("sessionEndedMessage(missions.error)");
  });

  it("wraps the surface in the provider, so a region can read it", () => {
    expect(codeOnly(FRAME)).toContain("<SessionEndedProvider value={sessionEnded}>");
  });

  it("defaults to null outside the shell, which is the safe direction", () => {
    /* A surface without the provider keeps whatever remedy it had. This can
       only ever remove a retry where a better door is already on screen. */
    expect(codeOnly(CTX)).toContain("createContext<string | null>(null)");
  });
});

describe("the workspaces region drops the offer it cannot honour", () => {
  it("withholds the retry when the session has ended", () => {
    const code = codeOnly(BOARD);
    expect(code).toContain("onRetry={sessionEnded ? undefined : () => refreshWorkspaces()}");
  });

  it("KEEPS the retry when the session is fine, so this is not a deletion", () => {
    /*
     * The failure mode of the test above is satisfying it by removing the retry
     * outright. An unreadable workspace list with a live session is a transient
     * failure and Try again is the right answer there - the ternary is the whole
     * point, and a bare `onRetry={undefined}` would pass a looser check.
     */
    const code = codeOnly(BOARD);
    expect(code).toContain("refreshWorkspaces()");
    expect(code).not.toContain("onRetry={undefined}");
  });

  it("still NAMES which read failed, because that is what the region knows", () => {
    /* AppFrame's rule: the shell owns the door, the region owns the naming.
       Dropping the sentence too would leave a person with a door and no idea
       what was behind it. */
    expect(BOARD).toContain("This could not be read");
  });
});
