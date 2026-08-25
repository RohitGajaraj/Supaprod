/**
 * The artifact pane asks a different question from the chain, so it needs a
 * different reader.
 *
 * `getTrackChain` answers *what was filed*: kind, id, title, and whether it
 * still resolves. `ChainMember` deliberately carries **no body**, and that is
 * correct — a few thousand characters of spec in every row of a trail panel
 * would make the trail unreadable and the query expensive for a reader who only
 * wanted to see that a spec exists.
 *
 * The pane asks *show me the thing*. A pane that renders `prd (id 5568…)` has
 * told the reader nothing the chain did not already, and the acceptance this
 * repo is built around says a person watching a run sees **what each station
 * produced** — not a list of nouns. `getTrackArtifacts` is the missing half, and
 * queue item 3 was blocked on it.
 *
 * WHAT THIS FILE GUARDS is the one subtle rule, which is shared with
 * `getTrackChain` and must never drift from it: **`missing` means we looked and
 * it was not there.** A read that errored leaves `missing` false and the body
 * null, because we did not look and so we claim nothing. Collapsing those two
 * would let one transient error report a shelf of healthy artifacts as
 * destroyed, which is a far worse lie than a row with no body.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { ARTIFACT_SOURCE } from "./chain";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(
  SRC.indexOf("export const getTrackArtifacts"),
  SRC.indexOf("export const getTrackChain"),
);

describe("it reads the body, which is the whole reason it exists", () => {
  it("selects the body column when the kind has one", () => {
    expect(FN).toContain("if (source.body) cols.push(`body:${source.body}`)");
  });

  it("returns the body on the artifact", () => {
    expect(FN).toContain("body: hit?.body ?? null");
  });

  /**
   * `HANDOFF_BODY_CHARS` bounds what goes into a PROMPT, where a long spec costs
   * money at every station. A person looking at their own spec should see their
   * own spec; the pane decides how much to show.
   */
  it("does not truncate, because that bound is about prompts and not about people", () => {
    expect(FN).not.toContain("HANDOFF_BODY_CHARS");
    expect(FN).not.toContain(".slice(0, 6000)");
  });

  /** Reuses the one map both the handoff and the chain already read from. */
  it("resolves tables through ARTIFACT_SOURCE rather than a second map", () => {
    expect(FN).toContain("ARTIFACT_SOURCE[");
    expect(ARTIFACT_SOURCE.prd.body).toBe("body_md");
    expect(ARTIFACT_SOURCE.decision.body).toBe("rationale");
  });
});

describe("missing means we looked, and this must not drift from getTrackChain", () => {
  /**
   * THE RULE, and the reason it is a `looked` set rather than a null check. A
   * refused read returns no rows, which is indistinguishable from "every row is
   * gone" unless the function records that the query itself failed.
   */
  it("only calls an artifact missing when its own read succeeded", () => {
    expect(FN).toContain("looked.add(kind)");
    expect(FN).toContain("missing: !hit && looked.has(m.artifact_kind)");
  });

  it("returns early from a failed read WITHOUT marking that kind looked at", () => {
    const at = FN.indexOf("if (readErr) return;");
    expect(at).toBeGreaterThan(-1);
    // The `looked.add` must come after the guard, or a refused read would mark
    // every artifact of that kind destroyed.
    expect(FN.indexOf("looked.add(kind)")).toBeGreaterThan(at);
  });

  it("never claims missing on a kind it has no table for", () => {
    // Such a kind is skipped when the id lists are built, so it is never looked
    // at and can never be marked missing.
    expect(FN).toContain("if (!ARTIFACT_SOURCE[m.artifact_kind]) continue");
  });
});

describe("it fails the way every other handler in this module fails", () => {
  it("degrades to an empty list rather than throwing a page", () => {
    expect(FN).toContain("if (error || !rows) return { artifacts: [] }");
    expect(FN).toContain("} catch {");
  });

  it("asks one query per kind, never one per row", () => {
    // A track that ran a full loop holds a few dozen members; a per-row lookup
    // would put that many round trips behind one pane.
    expect(FN).toContain('.in("id", ids)');
    expect(FN).toContain("byKind");
  });

  it("is scoped to the one track it was asked about", () => {
    expect(FN).toContain('.eq("track_id", data.trackId)');
  });

  /** Oldest first, so the pane reads as the story of the work. */
  it("returns them in the order they happened", () => {
    expect(FN).toContain('.order("created_at", { ascending: true })');
  });
});
