/**
 * ── NO PANE MAY BE REACHABLE ONLY BY TYPING ITS URL ──────────────────────────────
 * _Created: 2026-08-17_
 *
 * Founder: "certain features are kept doorless, and there is no option to reach that.
 * Users or agents, if they want to go into these settings, it's not there at all."
 *
 * He was describing a real defect that I had created and then hidden behind my own
 * comment. On 2026-08-17 I removed the Diagnostics door from the Settings rail and wrote
 * "the door is drawn from the Engine Room instead". Nothing in the Engine Room drew it.
 * Nothing anywhere in `src` linked `?section=health`. So `DiagnosticsSection` -- a live
 * report making two real server reads -- was reachable only by typing a URL.
 *
 * ── THE RULE ────────────────────────────────────────────────────────────────────
 * A section may legitimately have no door in the rail, but only in one of three ways,
 * and it has to declare which:
 *
 *   1. `foldsInto` another section, so its pane is that section's pane. Credits and
 *      sync are these: one question, one pane, no second door to disagree with.
 *   2. It renders an APOLOGY -- a pane whose whole content says the thing moved, plus a
 *      door to where it went. `memory` is this: "It is not set here any more", and a
 *      button to Brain, which has its own rail door.
 *   3. Something ELSE in the app links to it. That is the case this test exists to
 *      verify, because it is the one that can silently become false. A comment claiming
 *      a door exists is not a door.
 *
 * Anything else is a capability nobody can reach, which is this repo's most expensive
 * and most repeated defect.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_SECTION_IDS, NAV_DOOR_IDS, SETTINGS_GROUPS } from "./settings-sections";
import { stripComments } from "../__tests__/meridian-ratchet-scan";

/* fileURLToPath, not `.pathname`: this checkout's path contains spaces, and the raw
   pathname yields "My%20Projects", which scandir cannot open. */
const SRC = fileURLToPath(new URL("..", import.meta.url));

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name.endsWith(" 2") || name === "node_modules" || name === "__tests__") continue;
      out.push(...sourceFiles(p));
    } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/**
 * Every non-test source file, concatenated once, WITH COMMENTS REMOVED.
 *
 * The first version of this guard passed for the wrong reason: `settings-sections.ts`
 * carries a comment reading "`?section=health` and every saved link still answer", and a
 * plain text search accepted that prose as a link. A guard satisfied by the very comment
 * that documents the defect is worse than no guard. This surface has now done that four
 * times, so the prose is stripped before anything is searched.
 */
const ALL_SOURCE = stripComments(
  sourceFiles(SRC)
    .map((f) => readFileSync(f, "utf8"))
    .join("\n"),
);

describe("every settings pane can be reached without typing a URL", () => {
  it("gives each doorless section a fold, an apology, or a link from somewhere else", () => {
    const doored = new Set<string>(NAV_DOOR_IDS);
    const sections = SETTINGS_GROUPS.flatMap((g) => g.sections);
    const stranded: string[] = [];

    for (const id of ALL_SECTION_IDS as readonly string[]) {
      if (doored.has(id)) continue;
      const def = sections.find((s) => s.id === id);

      // 1. Folded: its pane is another section's pane.
      if (def?.foldsInto) continue;

      // 2. Linked from elsewhere. `?section=` or a typed `section: "id"` search param.
      const linked =
        new RegExp(`section=${id}\\b`).test(ALL_SOURCE) ||
        new RegExp(`section: "${id}"`).test(ALL_SOURCE);
      if (linked) continue;

      // 3. An apology pane, which must itself carry a door onward.
      //    Detected by the pane component's own words, not by an allowlist, so a pane
      //    that stops apologising and grows real controls starts failing here.
      const route = stripComments(
        readFileSync(join(SRC, "routes/_authenticated.settings.tsx"), "utf8"),
      );
      /* Allows a parenthesised multi-line render: `active === "x" && (\n  <Comp`. The
         first version demanded the component on the same line and missed a real
         apology pane the moment it needed two lines. */
      const apology = new RegExp(`active === "${id}" && \\(?\\s*<(\\w+)`).exec(route);
      if (apology) {
        const component = apology[1]!;
        const body = new RegExp(`function ${component}\\([^]*?\\n\\}`).exec(route)?.[0] ?? "";
        const saysItMoved = /not set here any more|lives? (?:in|now)|moved/i.test(body);
        /*
         * A WIRED control, not merely the word. The first version tested for /onOpen/,
         * which the component's own PARAMETER satisfies -- so replacing
         * `onClick={onOpen}` with `onClick={() => {}}` left the guard green on a pane
         * whose only door had been cut. The handler has to be attached to something.
         */
        const offersADoor =
          /onClick=\{\s*onOpen\s*\}/.test(body) ||
          /onClick=\{\(\)\s*=>\s*(?:void\s*)?(?:navigate|onOpen)/.test(body) ||
          /to: "\/[a-z]/.test(body);
        if (saysItMoved && offersADoor) continue;
      }

      /*
       * A REDIRECT IS THE STRONGEST WAY OF NOT BEING STRANDED, and it was the
       * one this guard could not see.
       *
       * `?section=memory` used to render a pane whose whole content was "It is
       * not set here any more" plus a button to Brain, which satisfied the
       * apology branch above. It is a `beforeLoad` redirect now, so the address
       * still answers every saved link and every search hit and the reader
       * never lands on the dead end at all -- strictly better than an apology,
       * and this test called it stranded because it only knew about panes.
       *
       * Checked against the ROUTE rather than a list here, so it cannot become
       * an exemption: delete the redirect and this section is stranded again.
       */
      if (new RegExp(`asked === "${id}"[^]{0,120}?redirect\\(`).test(route)) continue;

      stranded.push(id);
    }

    expect(
      stranded,
      `these settings panes can only be reached by typing a URL:\n  ${stranded.join("\n  ")}\n` +
        "Give each one a door, a `foldsInto`, or a link from the surface that owns it.",
    ).toEqual([]);
  });

  it("draws the Diagnostics door the Engine Room was only claimed to draw", () => {
    /*
     * The specific regression, pinned by name, because a comment asserting a door is
     * what let this ship. Diagnostics is mounted as a Quality room view rather than
     * copied, so the Engine Room and the Settings address cannot disagree about the
     * platform's health.
     */
    const glance = readFileSync(join(SRC, "lib/engine-room-glance.ts"), "utf8");
    expect(/id: "diagnostics"/.test(glance), "the Quality room has no Diagnostics tab").toBe(true);

    const room = readFileSync(join(SRC, "components/engine-room/rooms/QualityRoom.tsx"), "utf8");
    expect(
      /view === "diagnostics"/.test(room) && /<DiagnosticsSection\s*\/>/.test(room),
      "the Quality room advertises a Diagnostics tab it does not render",
    ).toBe(true);
  });
});
