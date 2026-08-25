/**
 * A mission that was built twice showed one build and hid the other.
 *
 * `getStudioSession` reads the changeset with `.limit(1).maybeSingle()`, so the
 * newest non-abandoned changeset is the only one that ever reaches a surface and
 * **every earlier attempt is unreachable from anywhere in the product**. That is
 * the wrong default here: a build that was superseded is the most interesting
 * thing on a mission that took three goes, and "what did we try before" is
 * precisely the question somebody opens a session to answer.
 *
 * Reported by LANE 0's Build census (REQ-L0-019 item 5), routed to MAIN as queue
 * item 27 because the server function is the half that cannot answer.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(fileURLToPath(new URL("./studio.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(
  SRC.indexOf("export const getStudioSession"),
  SRC.indexOf("Mid-session natural-language steering"),
);

describe("the history is returned beside the active build, not instead of it", () => {
  /**
   * Every caller reads `changeset` as "the one being worked on". Turning it into
   * a list would move that meaning underneath them, so the active one is
   * untouched and the history arrives as its own field.
   */
  it("leaves the active changeset exactly as it was", () => {
    expect(FN).toContain(".limit(1)");
    expect(FN).toContain("changeset: csRow");
    expect(FN).toContain("file_count: changes.length");
  });

  it("returns the earlier attempts as their own field", () => {
    expect(FN).toContain("superseded,");
    expect(FN).toContain('.eq("mission_id", data.missionId)');
  });

  /** The active one must not appear twice — once as active and once as history. */
  it("excludes the active changeset from the history", () => {
    expect(FN).toContain("(r) => r.id !== activeId");
  });

  it("orders newest first, like every other history on this surface", () => {
    const at = FN.indexOf("priorRows");
    expect(FN.slice(at, at + 400)).toContain('.order("created_at", { ascending: false })');
  });

  /** An abandoned changeset is not history a person wants; it is noise. */
  it("keeps abandoned builds out of the history", () => {
    const at = FN.indexOf("priorRows");
    expect(FN.slice(at, at + 400)).toContain('.neq("status", "abandoned")');
  });

  /**
   * Thin on purpose. A superseded changeset is a DOOR; loading its body on every
   * session read would pay for something almost nobody opens, and
   * `getStudioChanges` already answers the body when somebody asks.
   */
  it("carries a door and not a body", () => {
    const at = FN.indexOf("priorRows");
    const read = FN.slice(at, at + 400);
    expect(read).toContain("id,status,title,branch,pr_url,pr_number,created_at,updated_at");
    expect(read).not.toContain("base_content");
    expect(read).not.toContain("new_content");
  });

  /** Bounded, so a pathological mission cannot put an unbounded list in a page. */
  it("is bounded", () => {
    const at = FN.indexOf("priorRows");
    expect(FN.slice(at, at + 400)).toContain(".limit(20)");
  });
});
