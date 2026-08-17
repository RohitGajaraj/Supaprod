/**
 * ── REMOVING A DOOR IS ONLY ALLOWED IF THE CAPABILITY KEEPS ONE ──────────────────
 * _Created: 2026-08-17_
 *
 * Founder: "you have eliminated all the sections that were underneath and the features
 * that were underneath ... I do not want you to eliminate any of the features without
 * thinking twice. If there is a duplicate, you can eliminate it, but if there is no
 * home or if it is not there at all, then you don't have the right to remove anything."
 *
 * What happened, in full: collapsing the three-click path to one click was right, and
 * removing the general "Open Crew" button from the top of the roster was right. What was
 * wrong is that the inline panel that replaced it shipped with ZERO actions -- no
 * button, no link, no navigate. A reader could look at an agent from Settings and change
 * nothing, and had no route to the surface that can. The commit message asserted the
 * tweak path was "reached from the agent you are already reading". It was not built.
 *
 * `/crew` was never orphaned -- it keeps its rail door in `nav-model.ts` -- so this was
 * not a doorless capability. It was worse in one specific way: the surface that had just
 * taken over the reading of an agent quietly stopped offering the doing of anything.
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
const ROUTE = fileURLToPath(new URL("../routes/_authenticated.settings.tsx", import.meta.url));

/**
 * The panel's own source with comments removed.
 *
 * Every one of these guards has been satisfied by its own explanatory comment at least
 * once on this surface, three times before today, so the prose is stripped first and the
 * slice is bounded to the component rather than the 100KB route.
 */
function panelSource(): string {
  const source = stripComments(readFileSync(ROUTE, "utf8"));
  const start = source.indexOf("function AgentDetail(");
  const end = source.indexOf("function ModelsSection(", start);
  expect(start, "AgentDetail no longer exists in the settings route").toBeGreaterThan(-1);
  expect(end, "could not bound the AgentDetail component").toBeGreaterThan(start);
  return source.slice(start, end);
}

describe("the open agent can still reach everything it cannot do itself", () => {
  it("offers at least one real action, so the panel is never read-only", () => {
    /*
     * THE ASSERTION THAT WOULD HAVE CAUGHT THE DEFECT. The shipped panel had no
     * `onClick` at all. Proven red by deleting the foot of the panel.
     */
    const panel = panelSource();
    expect(
      /onClick=\{/.test(panel),
      "AgentDetail has no action at all: a reader can look at an agent and change nothing",
    ).toBe(true);
  });

  it("routes that action to the agent being read, not to a general escape hatch", () => {
    /*
     * The old door opened the crew page with no agent, which is what made it three
     * clicks. The replacement must carry the slug, or it is the same defect with fewer
     * words.
     */
    const panel = panelSource();
    expect(
      /onOpenRecord\(member\.slug\)/.test(panel),
      "the action must open THIS agent, carrying its slug",
    ).toBe(true);
  });

  it("names every question the agent's record answers, so nothing is silently dropped", () => {
    /*
     * One label per thing `/crew` owns. If a facet is deleted, this fails and the
     * deletion has to be argued for rather than happening by omission -- which is
     * exactly how "What it has learned" went missing the first time.
     */
    const panel = panelSource();
    for (const facet of [
      "is asked to do",
      "What it may do without you",
      "What it can touch",
      "What it has learned",
      "Track record",
    ]) {
      expect(panel.includes(facet), `the panel no longer answers "${facet}"`).toBe(true);
    }
  });

  it("raises a request for more room instead of leaving it on another screen", () => {
    // `asking` is a gate action: a person is required. It must never be readable only.
    const panel = panelSource();
    expect(
      /asking > 0/.test(panel),
      "an agent asking for more room is a call for a person and has to surface here",
    ).toBe(true);
    expect(
      /--mrd-you/.test(panel),
      "the one place `you` is spent in this panel is the request for a person",
    ).toBe(true);
  });
});
