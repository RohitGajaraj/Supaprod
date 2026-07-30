// detectReference: what counts as "I gave you an id" and, more importantly,
// what does not. The false-positive cases are the point of the file: a
// suggestion row that lights up on ordinary prose is worse than no row.
import { describe, it, expect } from "bun:test";
import { detectReference } from "./palette-reference";
import { AUDIT_KINDS, formatAuditId } from "./audit-id";

describe("palette-reference · a canonical tag", () => {
  it("reads the printed form, middle dot and all", () => {
    expect(detectReference("MIS·7E7D59")).toEqual({
      kind: "mission",
      id: "7E7D59",
      ref: "MIS·7E7D59",
    });
    expect(detectReference("OPP·005C82")).toEqual({
      kind: "opportunity",
      id: "005C82",
      ref: "OPP·005C82",
    });
  });

  it("reads every kind the record can print", () => {
    for (const meta of AUDIT_KINDS) {
      const printed = formatAuditId(meta.kind, "abc123ff");
      const got = detectReference(printed);
      expect(got).toEqual({ kind: meta.kind, id: "ABC123", ref: printed });
    }
  });

  it("comes back in the canonical form whatever was typed", () => {
    // One reference, five ways a person arrives at it.
    for (const typed of ["MIS·7E7D59", "MIS-7E7D59", "MIS 7E7D59", "MIS.7E7D59", "mis·7e7d59"]) {
      expect(detectReference(typed)?.ref).toBe("MIS·7E7D59");
    }
  });

  it("is case-insensitive on both halves", () => {
    expect(detectReference("mis-7e7d59")).toEqual({
      kind: "mission",
      id: "7E7D59",
      ref: "MIS·7E7D59",
    });
    expect(detectReference("Prd.Abf938")).toEqual({
      kind: "spec",
      id: "ABF938",
      ref: "PRD·ABF938",
    });
  });

  it("takes the separators audit-id already takes", () => {
    for (const sep of ["·", "-", ":", "_", "/", " ", "  ", "."]) {
      expect(detectReference(`DEC${sep}8976C0`)?.ref).toBe("DEC·8976C0");
    }
  });

  it("ignores surrounding whitespace, because paste brings it", () => {
    expect(detectReference("   LRN-0A1B2C  ")?.ref).toBe("LRN·0A1B2C");
    expect(detectReference("\nSIG·37AF77\n")?.ref).toBe("SIG·37AF77");
  });
});

describe("palette-reference · what is not a reference", () => {
  it("refuses an unknown prefix", () => {
    expect(detectReference("XYZ·7E7D59")).toBeNull();
    expect(detectReference("TODO-ABC123")).toBeNull();
    expect(detectReference("PR-123456")).toBeNull();
  });

  it("refuses a truncated ref", () => {
    // Five hex is not a short, and a short that cannot resolve must not be
    // offered as if it could.
    expect(detectReference("MIS·7E7D5")).toBeNull();
    expect(detectReference("MIS-7E")).toBeNull();
    expect(detectReference("OPP·0")).toBeNull();
  });

  it("refuses a ref that is too long, or not hex", () => {
    expect(detectReference("MIS·7E7D59A")).toBeNull();
    expect(detectReference("MIS·ZZZZZZ")).toBeNull();
    expect(detectReference("DOC·README")).toBeNull();
  });

  it("refuses a tag with no separator at all", () => {
    expect(detectReference("MIS7E7D59")).toBeNull();
  });

  it("refuses plain English that happens to contain a dot", () => {
    for (const prose of [
      "ship it. now",
      "e.g. the churn spike",
      "No. 5 on the list",
      "doc.md",
      "pro.beta",
      "rel.notes",
      "what is mis.aligned about this",
      "update the DOC.file please",
      "sig.nal",
      "mem.o",
    ]) {
      expect(detectReference(prose)).toBeNull();
    }
  });

  it("refuses a sentence that merely contains a real tag", () => {
    // Reading a whole line, not scanning inside one. Finding ids inside prose
    // is `findAuditIds`, and it is a different job with a different answer.
    expect(detectReference("what happened on MIS·7E7D59 last week")).toBeNull();
    expect(detectReference("MIS·7E7D59 and OPP·005C82")).toBeNull();
  });

  it("refuses empty and whitespace", () => {
    expect(detectReference("")).toBeNull();
    expect(detectReference("   ")).toBeNull();
    expect(detectReference("\n\t")).toBeNull();
  });
});

describe("palette-reference · a bare uuid", () => {
  it("is detected, with no kind, because a uuid names no table", () => {
    expect(detectReference("7e7d59a1-0f2b-4c3d-8e9f-0123456789ab")).toEqual({
      kind: null,
      id: "7e7d59a1-0f2b-4c3d-8e9f-0123456789ab",
      ref: "7e7d59a1-0f2b-4c3d-8e9f-0123456789ab",
    });
  });

  it("is normalised to lower case, and survives paste whitespace", () => {
    expect(detectReference("  7E7D59A1-0F2B-4C3D-8E9F-0123456789AB  ")).toEqual({
      kind: null,
      id: "7e7d59a1-0f2b-4c3d-8e9f-0123456789ab",
      ref: "7e7d59a1-0f2b-4c3d-8e9f-0123456789ab",
    });
  });

  it("refuses something merely uuid-shaped", () => {
    expect(detectReference("7e7d59a1-0f2b-4c3d-8e9f-0123456789")).toBeNull();
    expect(detectReference("7e7d59a1 0f2b 4c3d 8e9f 0123456789ab")).toBeNull();
    expect(detectReference("zzzzzzzz-0f2b-4c3d-8e9f-0123456789ab")).toBeNull();
    // The undashed 32 hex is a uuid to a database and not to this reader.
    expect(detectReference("7e7d59a10f2b4c3d8e9f0123456789ab")).toBeNull();
  });
});
