/**
 * A switch on a station says what that switch actually does.
 *
 * WHY THIS EXISTS. Discover's boundary switch was labelled "Read new signals
 * without asking" and it reads nothing: `toggleAutoCluster` writes
 * `auto_cluster_enabled`, which decides whether captured signals are GROUPED on a
 * schedule. Reading connected sources is `auto_sense_enabled`, a different column
 * driven by a different cron job.
 *
 * So somebody who wanted their sources polled turned this on, was told "On", and
 * nothing was ever read. The sub-line half-admitted it by saying "nothing
 * clusters", but the label is the part a person acts on, and a label naming the
 * wrong mechanism is worse than a vague one: it answers the question, and the
 * answer is false.
 *
 * The second half of the fix is that the READING switch now sits on Discover too.
 * It existed nowhere a person could reach except a governance page two sections
 * away, so somebody standing on Discover asking "why has nothing new arrived" was
 * two sections from the control that decides it, on the one station where the
 * question is obvious.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SURFACE = readFileSync(join(import.meta.dir, "DiscoverSurface.tsx"), "utf8");

/** Whole-file toContain prints 3,000 lines on failure. One line instead. */
const has = (needle: string, what: string) =>
  expect(SURFACE.includes(needle), `expected Discover to contain ${what}`).toBe(true);
const lacks = (needle: string, what: string) =>
  expect(SURFACE.includes(needle), `expected Discover NOT to contain ${what}`).toBe(false);

describe("the clustering switch names clustering", () => {
  it("no longer claims to read anything", () => {
    // THE DEFECT. A user acting on this label got the opposite of what it said.
    lacks("Read new signals without asking", "the old label that promised reading");
  });

  it("says it groups, which is what auto_cluster_enabled does", () => {
    has("Group new findings without asking", "a label naming what the switch writes");
  });

  it("keeps its sub-line consistent with the new label", () => {
    // Label and sub-line naming two different mechanisms is the same defect in
    // smaller print.
    has("nothing is grouped until you press the button yourself", "the off-state sentence");
    lacks("nothing clusters until you press", "the old off-state wording");
  });
});

describe("the reading switch is on the station that reads", () => {
  it("mounts the automation control for auto_sense_enabled", () => {
    has("<AutomationBoundary", "the reading switch");
    has('only={["auto_sense_enabled"]}', "a filter to the one flag Discover owns");
  });

  it("reuses the component /boundary renders, rather than a second switch", () => {
    // A second control for one column is how two switches for one setting come to
    // disagree, which is exactly the defect corrected above. One component, one
    // pair of server functions, two places.
    has('from "@/components/governance/AutomationBoundary"', "the shared component");
    lacks("setWorkspaceAutomation", "a hand-rolled writer on this surface");
  });

  it("does not render it while the surface is still resolving or has failed", () => {
    // A switch shown over a failed read invites somebody to set policy against
    // state nobody could confirm.
    has(
      "!picking && !loading && !loadError ? (\n        <AutomationBoundary",
      "the same guards the sibling block uses",
    );
  });
});

describe("the two switches stay distinguishable", () => {
  it("names two different things, not one thing twice", () => {
    // Hard ban on a label and its neighbour saying the same thing: if a reader
    // cannot tell which switch does what, two controls are worse than one.
    const grouping = SURFACE.includes("Group new findings without asking");
    const reading = SURFACE.includes("Reading your sources");
    expect(grouping && reading).toBe(true);
  });

  it("the reading block says what it decides, without restating the title", () => {
    has("read on a schedule, without you asking each time", "a sub that adds a fact");
  });
});
