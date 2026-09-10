/**
 * ── REMOVING A DOOR IS ONLY ALLOWED IF THE CAPABILITY KEEPS ONE ──────────────────
 * _Created: 2026-08-17 · re-pointed 2026-09-09 (fifth review)_
 *
 * Founder: "you have eliminated all the sections that were underneath and the features
 * that were underneath ... I do not want you to eliminate any of the features without
 * thinking twice. If there is a duplicate, you can eliminate it, but if there is no
 * home or if it is not there at all, then you don't have the right to remove anything."
 *
 * WHAT IT GUARDED FIRST. Settings had a roster whose per-agent panel shipped with ZERO
 * actions -- no button, no link, no navigate. A reader could look at an agent from
 * Settings and change nothing, and had no route to the surface that can. The commit
 * message asserted the tweak path was "reached from the agent you are already reading".
 * It was not built.
 *
 * WHY IT READS `/team` NOW. On 2026-09-09 Settings' Autonomy group folded into Team:
 * `/team` is the roster, and Settings' copy of it was a read-only mirror one rail row
 * away from the page that owns the answer. So `RosterSection` and `AgentDetail` are
 * gone from the settings route. That is the founder's own "if there is a duplicate you
 * can eliminate it" -- and this file is the half that proves the other clause, that
 * nothing went with it. The subject moved; the rule did not, and it is a stricter rule
 * here, because `/team` is where the writes actually happen.
 *
 * These assertions are deliberately about the SHAPE, not the wording, so copy can change
 * without a false failure, and they read the route source because there is no way to
 * render this pane in this suite (it sits behind auth and a live workspace query).
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripComments } from "./meridian-ratchet-scan";

/* fileURLToPath, not `.pathname`: this checkout's path contains spaces. */
const CREW = fileURLToPath(new URL("../routes/_authenticated.team.tsx", import.meta.url));
const SETTINGS = fileURLToPath(new URL("../routes/_authenticated.settings.tsx", import.meta.url));

const crew = stripComments(readFileSync(CREW, "utf8"));

/**
 * The open agent's own source with comments removed.
 *
 * Every one of these guards has been satisfied by its own explanatory comment at least
 * once on this surface, three times before today, so the prose is stripped first and the
 * slice is bounded to the component rather than the whole route.
 */
function panelSource(): string {
  const start = crew.indexOf("function MemberView(");
  const end = crew.indexOf("function Proposals(", start);
  expect(start, "MemberView no longer exists in the crew route").toBeGreaterThan(-1);
  expect(end, "could not bound the MemberView component").toBeGreaterThan(start);
  return crew.slice(start, end);
}

describe("the open agent can still reach everything it cannot do itself", () => {
  it("offers at least one real editor, so the panel is never read-only", () => {
    /*
     * THE ASSERTION THAT WOULD HAVE CAUGHT THE DEFECT. The shipped Settings panel had
     * no `onClick` at all and could only send you elsewhere. This one mounts the
     * editors themselves, so the check is that they are there rather than that a link
     * out is: `Boundary` writes the arc, the tool-reach cap and the on/off switch,
     * and `ToolPolicy` writes the per-tool mode.
     */
    const panel = panelSource();
    for (const editor of ["<Boundary member={m}", "<ToolPolicy member={m}"]) {
      expect(panel.includes(editor), `the open agent no longer mounts ${editor}`).toBe(true);
    }
  });

  it("routes every write to the agent being read, not to a general escape hatch", () => {
    /*
     * The old door opened the crew page with no agent, which is what made it three
     * clicks. Every panel here is handed the member it is standing on, or it is the
     * same defect with fewer words.
     */
    const panel = panelSource();
    expect(
      /<Boundary member=\{m\} onChanged=\{invalidate\} \/>/.test(panel),
      "the boundary editor must be handed THIS agent",
    ).toBe(true);
    expect(/<Lessons slug=\{m\.slug\}/.test(panel), "the lessons must be read for THIS agent").toBe(
      true,
    );
  });

  it("names every question the agent's record answers, so nothing is silently dropped", () => {
    /*
     * One heading per thing this page owns. If a facet is deleted, this fails and the
     * deletion has to be argued for rather than happening by omission -- which is
     * exactly how "What it has learned" went missing the first time. The words are the
     * crew page's own; the Settings mirror said "What it can touch" and "Track record"
     * for the last two, and the mirror is the copy that went.
     */
    for (const facet of [
      "What it may do without you",
      "What it does alone",
      "What comes to you",
      "What it has learned",
      "What it has done here",
    ]) {
      expect(crew.includes(facet), `the crew page no longer answers "${facet}"`).toBe(true);
    }
  });

  it("raises a request for more room instead of leaving it on another screen", () => {
    // `asking` is a gate action: a person is required. It must never be readable only.
    const panel = panelSource();
    expect(
      /<Proposals member=\{m\} onDecided=\{invalidate\} \/>/.test(panel),
      "an agent asking for more room is a call for a person and has to surface here",
    ).toBe(true);
    expect(
      /--mrd-you|text-mrd-you/.test(crew),
      "the one place `you` is spent on this page is the request for a person",
    ).toBe(true);
  });

  it("and Settings keeps no second copy of the agent it can no longer act on", () => {
    /*
     * THE OTHER HALF OF THE FOLD. A duplicate may be removed; a duplicate may also
     * quietly come back, and it came back here once already. If a roster or an agent
     * panel is ever declared on the settings route again, this fails and whoever added
     * it has to say why one question needs two doors.
     */
    const settings = stripComments(readFileSync(SETTINGS, "utf8"));
    expect(settings).not.toContain("function RosterSection(");
    expect(settings).not.toContain("function AgentDetail(");
  });
});
