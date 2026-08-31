/**
 * A CONTROL THAT CANNOT RESOLVE MUST NOT BE OFFERED.
 *
 * `CameFrom` opens the lineage sheet for a row. The sheet resolves an audit tag
 * — `MIS·ABC123` — through `AUDIT_KINDS`, and **`AUDIT_KINDS` has an entry for
 * `mission` and none for a spine track.** So a track row offered this control
 * would open a sheet that can never answer, which is worse than no offer: it
 * spends a person's click to tell them nothing, on a surface whose whole claim
 * is that it says what is true.
 *
 * That is the same rule the Stop verb already follows on this board — a track
 * row takes no Stop because `cancelMission` is a mission mutation — so this
 * test pins the second instance of a rule the file already had one of.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { missionTraceRef } from "./CameFrom";
import { AUDIT_KINDS, parseAuditId } from "@/lib/audit-id";

const BOARD = readFileSync("src/components/today/Board.tsx", "utf8");
const SRC = readFileSync("src/components/today/CameFrom.tsx", "utf8");

/** Source with comments stripped, so prose naming a thing is not read as code. */
function codeOnly(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

describe("the offer is only made where the record can answer", () => {
  it("has a `mission` audit kind, which is what makes the ref resolvable at all", () => {
    expect(AUDIT_KINDS.some((k) => k.kind === "mission")).toBe(true);
  });

  it("has NO audit kind for a spine track, which is why a track gets no control", () => {
    /* The premise of the guard below. If someone adds a track kind later, this
       fails and the `isTrack` bail-out should be revisited rather than left as
       a rule nobody remembers the reason for. */
    const kinds = AUDIT_KINDS.map((k) => k.kind as string);
    expect(kinds).not.toContain("track");
    expect(kinds).not.toContain("spine_track");
  });

  it("bails out on a track row", () => {
    expect(codeOnly(SRC)).toContain("if (isTrack) return null;");
  });

  it("produces a ref the resolver can actually parse", () => {
    const ref = missionTraceRef("a30238f5-767b-4a2b-854d-3624f714f068");
    const parsed = parseAuditId(ref);
    expect(parsed).not.toBeNull();
    expect(parsed!.kind).toBe("mission");
  });
});

describe("the row keeps its own click", () => {
  it("stops propagation, so asking where something came from does not navigate away", () => {
    /* The whole row is a click target that opens the work. Without this the
       control would answer the question by leaving the page that asked it. */
    expect(codeOnly(SRC)).toContain("e.stopPropagation()");
  });
});

describe("the words, which §12 makes a law rather than a preference", () => {
  it("never says provenance, which the positioning canon bans outright", () => {
    expect(SRC.toLowerCase()).not.toMatch(/>\s*provenance/);
    expect(codeOnly(SRC).toLowerCase()).not.toContain("provenance");
  });

  it("puts a plain sentence on the control, not a noun from the schema", () => {
    /* "Lineage" and "audit tag" are what the machinery calls itself. A person
       asks where something came from. */
    const code = codeOnly(SRC);
    expect(code).toContain("Where this came from");
    expect(code).not.toMatch(/>\s*Lineage\s*</);
    expect(code).not.toMatch(/>\s*Trace\s*</);
  });
});

describe("it is mounted where a person meets a row", () => {
  it("renders on the board, under BOTH row sections that carry a note line", () => {
    /* A mount is not a render, and this is the weaker of the two checks - the
       browser drive is the real one. What it catches is the regression where a
       later edit keeps one call site and silently drops the other, which is
       exactly how this surface lost features before. */
    const code = codeOnly(BOARD);
    const mounts = code.match(/<CameFrom\s/g) ?? [];
    expect(mounts.length).toBe(2);
    expect(code).toContain("missionId={row.id}");
    expect(code).toContain("isTrack={row.isTrack}");
  });

  it("imports the sheet rather than mounting a second one", () => {
    /* AppFrame already renders <AuditLineageSheet /> app-wide. A second mount
       would give one press two listeners, which the sheet's own file records as
       a bug it already had. */
    expect(codeOnly(SRC)).toContain("openLineage");
    expect(codeOnly(SRC)).not.toContain("<AuditLineageSheet");
  });
});
