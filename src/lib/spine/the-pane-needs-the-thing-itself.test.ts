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

describe("it returns the SPEC's shape, which is the whole reason it was rewritten", () => {
  /**
   * A first version returned a flat `TrackArtifact[]` with one `body` string. It
   * was written before its own spec was read. `SPEC-ARTIFACTS` §1 names the exact
   * type LANE 0 builds `ArtifactPane.tsx` against, and **a server function that
   * is NEARLY the contract is worse than one that is missing, because it
   * typechecks.**
   */
  it("returns stops, not a flat list", () => {
    expect(FN).toContain("Promise<{ stops: StationArtifactView[] }>");
    expect(FN).not.toContain("artifacts: TrackArtifact[]");
  });

  it("carries every field §1 names on a stop", () => {
    for (const k of [
      "station:",
      "label:",
      "state:",
      "waivedReason:",
      "expects:",
      "everDriven:",
      "hold:",
      "holdReason:",
      "items:",
    ]) {
      expect(FN).toContain(k);
    }
  });

  /**
   * Ordering and state come from `buildChain` so this can never disagree with
   * the chain panel about where the work is. Two readers of one track that
   * derive position separately will drift, and the person sees two answers.
   */
  it("derives order and state from buildChain rather than re-deriving them", () => {
    expect(FN).toContain("buildChain({");
  });

  it("returns the per-kind columns as fields", () => {
    expect(FN).toContain("fields: hit?.fields ?? {}");
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

  /**
   * THE COLUMN NAMES ARE NOT GUESSABLE AND A WRONG ONE TYPECHECKS. Three of the
   * seven tables have no `title`: a prototype has `name`, a learning has
   * `summary`, a deployment has no human name at all. So the title is aliased
   * through `ARTIFACT_SOURCE` per kind, and the extra columns are listed per
   * kind rather than shared.
   */
  it("aliases the title per kind instead of selecting a column that may not exist", () => {
    expect(FN).toContain("`title:${source.title}`");
  });

  it("names the forecast columns, which are the reason Decide needed this at all", () => {
    for (const c of [
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
      "forecast_resolution",
    ]) {
      expect(SRC).toContain(c);
    }
  });

  it("does not ask prototypes for a title, which would throw at runtime", () => {
    const fields = SRC.slice(
      SRC.indexOf("const FIELDS"),
      SRC.indexOf("export const getTrackArtifacts"),
    );
    const proto = fields.slice(fields.indexOf("prototype:"), fields.indexOf("changeset:"));
    expect(proto).not.toContain('"title"');
    expect(proto).toContain("entry_path");
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
    expect(FN).toContain(
      "missing: !found.has(`${m.artifact_kind}:${m.artifact_id}`) && looked.has(m.artifact_kind)",
    );
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
    // An unreadable member list yields an empty stop list, never a thrown page,
    // and a track that cannot be read at all yields no stops rather than a lie.
    expect(FN).toContain("if (!trackRow) return { stops: [] }");
    expect(FN).toContain("error || !rows");
    expect(FN).toContain("} catch {");
    expect(FN).toContain("return { stops: [] };");
  });

  it("asks one query per kind, never one per row", () => {
    // A track that ran a full loop holds a few dozen members; a per-row lookup
    // would put that many round trips behind one pane.
    expect(FN).toContain('.in("id", ids)');
    expect(FN).toContain("byKind");
  });

  /**
   * `unknown` does not survive the server-function boundary — TanStack validates
   * the return type as serializable and rejects it. The spec's
   * `Record<string, unknown>` is implemented as the same contract with the
   * serialisable half named, because every one of these columns is a Postgres
   * scalar or a `Json`.
   */
  it("returns a serialisable field map rather than unknown", () => {
    expect(SRC).toContain("export type FieldValue");
    expect(FN).toContain("Record<string, FieldValue>");
  });

  it("is scoped to the one track it was asked about", () => {
    expect(FN).toContain('.eq("track_id", data.trackId)');
  });

  /** Oldest first, so the pane reads as the story of the work. */
  it("returns them in the order they happened", () => {
    expect(FN).toContain('.order("created_at", { ascending: true })');
  });
});
