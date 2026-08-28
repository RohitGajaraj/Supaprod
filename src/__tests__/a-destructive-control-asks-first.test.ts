/**
 * REMOVING A LIMIT WAS CHEAPER THAN SETTING ONE.
 *
 * ── THE INVERSION, AND THIS REPO HAS NOW FOUND IT FOUR TIMES ───────────────
 * `MembersCard` records it first: *"removing a person was one click, while
 * handing over OWNERSHIP - a thing you can undo by asking for it back - carried
 * a two-step inline confirm. So taking away somebody's access was cheaper than
 * promoting them."* Its comment says /boundary found the same on its own mode
 * controls. RUN-120 found the third on the run screen, where `deleteSignal` is a
 * hard DELETE with no undo and fired on one click while the REVERSIBLE control
 * beside it asked why.
 *
 * The fourth is this one, and it is the worst-shaped of them because the act
 * WIDENS authority. Setting a spending cap takes a form, a number and a window.
 * Removing one took a single click, on the surfaces whose entire job is saying
 * what the system is allowed to do.
 *
 * ── WHAT THIS GUARD ASKS, AND WHAT IT DELIBERATELY DOES NOT ────────────────
 * It cannot judge whether a confirmation is well worded, and it does not try.
 * It asks one mechanical question: does a component that calls a delete- or
 * remove-shaped server function have ANY asking step at all -- `useConfirm`, or
 * a two-step state of its own? A file with neither is firing an irreversible
 * write straight off a click, and that is the shape all four instances shared.
 *
 * Reversible removals are exempt WITH THEIR REASON, not by pattern. Falling back
 * to a default is not destruction, and asking about it is friction guarding
 * nothing. Each entry has to say which it is.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const SRC = join(ROOT, "src");

/** A server function whose name says it removes a row. */
const DESTRUCTIVE_CALL = /useServerFn\(\s*(delete|remove)[A-Z]\w*/;

/** Any asking step: the shared dialog, or a component's own two-step state. */
const ASKS = /useConfirm|setConfirming|confirmingDiscard|openPanel|typedConfirm/;

/**
 * THE EXEMPTION REGISTER. Each entry says why the removal is not destruction,
 * because "it looked fine" is what let three of the four ship.
 */
const EXEMPT: ReadonlyArray<{ file: string; why: string }> = [
  {
    file: "src/components/connections/ProductBindingsSection.tsx",
    why: "The removal is a FALLBACK, not a severing: its own control is labelled 'Use the workspace one' and the product lands on the workspace binding, which still exists. Re-binding restores it. WorkspaceBindingsSection runs the SAME server function and does ask, because a workspace binding is the bottom of that chain and has nothing underneath to inherit",
  },
];

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      tsxFiles(full, out);
      continue;
    }
    if (!e.name.endsWith(".tsx")) continue;
    if (/\.test\.tsx$/.test(e.name)) continue;
    out.push(full);
  }
  return out;
}

describe("a destructive control asks first", () => {
  const offenders: string[] = [];
  let guarded = 0;

  for (const file of tsxFiles(SRC)) {
    const src = readFileSync(file, "utf8");
    if (!DESTRUCTIVE_CALL.test(src)) continue;
    const rel = file.slice(file.indexOf("src/"));
    if (EXEMPT.some((e) => e.file === rel)) continue;
    if (ASKS.test(src)) {
      guarded++;
      continue;
    }
    offenders.push(rel);
  }

  it("no component fires a delete or remove straight off a click", () => {
    expect(offenders.sort()).toEqual([]);
  });

  it("and the guard is actually looking at something", () => {
    // A regex that matched nothing would pass the test above forever.
    expect(guarded).toBeGreaterThan(3);
  });

  it("every exemption says why the removal is not destruction", () => {
    for (const e of EXEMPT) {
      expect(e.why.length).toBeGreaterThan(40);
      expect(readFileSync(join(ROOT, e.file), "utf8")).toContain("useServerFn");
    }
  });
});
