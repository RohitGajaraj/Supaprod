import { describe, expect, test } from "bun:test";
import { kindTracePrefix } from "../graph-visual";

// dim 17: every graph node carries a typed trace-ref prefix. The shared object
// kinds use their registered prefix (DESIGN-LOOM dim 17 / design-anatomy §4);
// graph-only kinds carry a stable local 3-letter code so no node is untraceable.
describe("kindTracePrefix", () => {
  test("maps the registered shared kinds to their registry prefix", () => {
    expect(kindTracePrefix("signal")).toBe("SIG");
    expect(kindTracePrefix("theme")).toBe("THM");
    expect(kindTracePrefix("opportunity")).toBe("OPP");
    expect(kindTracePrefix("prd")).toBe("PRD");
    expect(kindTracePrefix("mission")).toBe("MIS");
    // DEC is the prefix newly registered for decisions in this pass.
    expect(kindTracePrefix("decision")).toBe("DEC");
  });

  test("maps the graph-only kinds to their stable local code", () => {
    expect(kindTracePrefix("meeting")).toBe("MTG");
    expect(kindTracePrefix("roadmap_item")).toBe("RDM");
    expect(kindTracePrefix("task")).toBe("TSK");
    expect(kindTracePrefix("design_memory")).toBe("DSG");
  });

  test("derives a 3-letter uppercase code for an unknown kind", () => {
    expect(kindTracePrefix("widget")).toBe("WID");
  });

  test("never returns empty: falls back to REF when no alpha chars exist", () => {
    expect(kindTracePrefix("___")).toBe("REF");
    expect(kindTracePrefix("")).toBe("REF");
  });
});
