// SW-4 / mission 3.4 DESIGN STATION: the pure gate seam, no DB.
import { describe, expect, test } from "bun:test";
import {
  ARD_SCAFFOLD_HTML_CAP,
  designGateBlocksDispatch,
  toArdDesignSection,
  type DesignDispatchContext,
} from "./design-gate";
import type { DesignMemoryRow } from "@/lib/design-memory.functions";

describe("designGateBlocksDispatch", () => {
  test("stage off never blocks, whatever the status", () => {
    expect(designGateBlocksDispatch({ stageEnabled: false, status: null })).toBe(false);
    expect(designGateBlocksDispatch({ stageEnabled: false, status: "pending" })).toBe(false);
    expect(designGateBlocksDispatch({ stageEnabled: false, status: "rejected" })).toBe(false);
  });

  test("stage on blocks everything except an approved gate", () => {
    expect(designGateBlocksDispatch({ stageEnabled: true, status: "approved" })).toBe(false);
    expect(designGateBlocksDispatch({ stageEnabled: true, status: "pending" })).toBe(true);
    expect(designGateBlocksDispatch({ stageEnabled: true, status: "rejected" })).toBe(true);
    // Pre-migration null status with the stage somehow on: fail closed.
    expect(designGateBlocksDispatch({ stageEnabled: true, status: null })).toBe(true);
  });
});

const memoryRow = (over: Partial<DesignMemoryRow> = {}): DesignMemoryRow => ({
  id: "00000000-0000-0000-0000-000000000001",
  workspace_id: "00000000-0000-0000-0000-000000000002",
  category: "token",
  title: "Primary color",
  content: "Deep indigo #3730a3 for primary actions.",
  rationale: null,
  source_kind: "default",
  status: "approved",
  decided_by: null,
  decided_at: null,
  created_at: "2026-07-08T00:00:00.000Z",
  ...over,
});

describe("toArdDesignSection", () => {
  test("null context yields no section", () => {
    expect(toArdDesignSection(null)).toBeNull();
  });

  test("an empty context yields no section, so the ARD stays lean", () => {
    const ctx: DesignDispatchContext = { memory: [], flow: null, scaffoldHtml: null };
    expect(toArdDesignSection(ctx)).toBeNull();
  });

  test("projects memory rows to the wire shape and keeps flow steps", () => {
    const ctx: DesignDispatchContext = {
      memory: [memoryRow()],
      flow: { steps: [{ id: "s1", label: "Sign in" }], edges: [] },
      scaffoldHtml: "<html><body>mock</body></html>",
    };
    const section = toArdDesignSection(ctx);
    expect(section).not.toBeNull();
    expect(section!.memory).toEqual([
      {
        category: "token",
        title: "Primary color",
        content: "Deep indigo #3730a3 for primary actions.",
      },
    ]);
    expect(section!.flow_steps).toEqual([{ id: "s1", label: "Sign in" }]);
    expect(section!.scaffold_html).toBe("<html><body>mock</body></html>");
  });

  test("caps the scaffold html so a mockup never bloats the dispatch", () => {
    const ctx: DesignDispatchContext = {
      memory: [],
      flow: null,
      scaffoldHtml: "x".repeat(ARD_SCAFFOLD_HTML_CAP + 5000),
    };
    const section = toArdDesignSection(ctx);
    expect(section!.scaffold_html!.length).toBe(ARD_SCAFFOLD_HTML_CAP);
  });
});
