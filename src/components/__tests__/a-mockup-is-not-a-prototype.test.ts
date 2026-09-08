import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE PRODUCT CALLED A STILL IMAGE A PROTOTYPE.
 *
 * WHAT THE ARTIFACT ACTUALLY IS. `design-scaffold.functions.ts` generates it,
 * and its own prompt is unambiguous: "Do NOT include any <script> tags or
 * external CDN links. CSS only." and "Show the MAIN screen for the spec". One
 * page, no behaviour, `[User Name]` and `[Date]` where content goes.
 *
 * WHY THE WORD MATTERS TO THE PERSON READING IT. In product design a prototype
 * is INTERACTIVE -- clickable, multi-state, a flow you can walk and test on
 * someone. A mockup is a still. Calling the still a prototype promises a
 * designer something the artifact cannot do, and it is the founder's own
 * distinction: "what and all prototypes, mock up needs to be there". Three
 * surfaces showed him the wrong one of those two words.
 *
 * `/design` already translated it correctly at the edge, rendering the kind as
 * "shared link", which is why this was easy to miss: the station that OWNS the
 * artifact was honest about it and the three surfaces that merely list it were
 * not.
 *
 * THE DB KIND IS UNTOUCHED. `prototype` stays the stored value forever under
 * the rename-disclaimer rule -- slugs are stable, and a data migration to fix a
 * word a person reads would be the tail wagging the dog. Only the label moved.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

const ARTIFACTS = read(join("components", "brain", "ArtifactsView.tsx"));
const LINEAGE = read(join("lib", "artifact-words.ts"));
const GRAPH = read(join("components", "knowledge", "graph-visual.ts"));
const GENERATOR = read(join("lib", "design-scaffold.functions.ts"));

describe("the artifact is named what it is", () => {
  it("Brain lists Mockups, singular and plural", () => {
    expect(ARTIFACTS).toMatch(/prototype: "Mockup",/);
    expect(ARTIFACTS).toMatch(/prototype: "Mockups",/);
  });

  it("the lineage vocabulary and the graph agree with it", () => {
    // Three surfaces, one word. A kind labelled differently in two places is
    // two names for one thing, which is how a vocabulary rots.
    expect(LINEAGE).toMatch(/prototype: "Mockup",/);
    expect(GRAPH).toMatch(/label: "Mockup"/);
  });

  it("no surface still promises interactivity", () => {
    for (const [name, src] of [
      ["ArtifactsView", ARTIFACTS],
      ["artifact-words", LINEAGE],
      ["graph-visual", GRAPH],
    ] as const) {
      // Comments explaining the change necessarily quote the old word, so the
      // check is on the LABEL position rather than on the file's text.
      const labels = [...src.matchAll(/prototype:\s*"([^"]+)"/g)].map((m) => m[1]);
      const graphLabels = [...src.matchAll(/label:\s*"(Prototype[s]?)"/g)].map((m) => m[1]);
      expect({ name, labels: labels.filter((l) => /^Prototype/.test(l)) }).toEqual({
        name,
        labels: [],
      });
      expect({ name, graphLabels }).toEqual({ name, graphLabels: [] });
    }
  });
});

describe("the generator still makes the thing the word now describes", () => {
  it("forbids script, so it cannot be interactive", () => {
    // If this ever changes -- if the scaffold gains behaviour -- the artifact
    // becomes a prototype in the real sense and the label should follow it
    // back. That is a deliberate trigger, not an accident waiting to happen.
    expect(GENERATOR).toMatch(/Do NOT include any <script> tags/);
  });

  it("draws one screen, not a flow", () => {
    expect(GENERATOR).toMatch(/Show the MAIN screen for the spec/);
  });
});
