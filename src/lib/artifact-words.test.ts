import { describe, expect, test } from "bun:test";
import { artifactWord, relationWord } from "./artifact-words";

describe("artifactWord", () => {
  test("the stored kind `prd` reads as the IA word every surface uses", () => {
    expect(artifactWord("prd")).toBe("spec");
  });

  test("the table-shaped kinds never reach a reader as stored", () => {
    expect(artifactWord("house_rule")).toBe("standing rule");
    expect(artifactWord("design_memory")).toBe("design rule");
    expect(artifactWord("changeset")).toBe("code change");
    expect(artifactWord("prd_scaffold")).toBe("drawing");
    expect(artifactWord("capability_change")).toBe("capability change");
  });

  test("a learning is the outcome word the rest of the product uses", () => {
    expect(artifactWord("learning")).toBe("outcome");
  });

  test("no word carries an underscore, which is the whole point", () => {
    for (const kind of [
      "signal",
      "opportunity",
      "decision",
      "spec",
      "prd",
      "goal",
      "prototype",
      "mission",
      "release",
      "meeting",
      "memory",
      "doc",
      "theme",
      "task",
      "roadmap_item",
      "house_rule",
      "design_memory",
      "capability_change",
      "changeset",
      "deployment",
      "prd_scaffold",
      "prd_flow",
      "learning",
    ]) {
      expect(artifactWord(kind)).not.toContain("_");
    }
  });

  test("an unmapped kind still loses its underscores rather than printing raw", () => {
    expect(artifactWord("some_future_kind")).toBe("some future kind");
  });

  test("blank input claims nothing rather than rendering an empty span", () => {
    expect(artifactWord(null)).toBe("record");
    expect(artifactWord(undefined)).toBe("record");
    expect(artifactWord("   ")).toBe("record");
  });
});

describe("relationWord", () => {
  test("the edge table's stored keys read as phrases", () => {
    expect(relationWord("derived_from")).toBe("derived from");
    expect(relationWord("design_parity")).toBe("design parity");
  });

  test("already-plain relations pass through untouched", () => {
    expect(relationWord("supersedes")).toBe("supersedes");
    expect(relationWord("contradicts")).toBe("contradicts");
  });

  test("no relation asserts only that the two are linked", () => {
    expect(relationWord(null)).toBe("linked");
    expect(relationWord(undefined)).toBe("linked");
    expect(relationWord("")).toBe("linked");
  });
});
