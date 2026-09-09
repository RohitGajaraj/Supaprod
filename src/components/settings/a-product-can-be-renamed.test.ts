/**
 * ── A PRODUCT CAN BE RENAMED ─────────────────────────────────────────────────
 *
 * FirstRun names the product once. After "Open Supaprod" became one call
 * (openFirstRun, 2026-09-09) `updateProject` had no caller, so nothing let a
 * person change that name. The Products section carries the field now, in
 * the shape Lane 1 asked for: one Meridian Field, prefilled, saved on Enter or
 * blur, a Receipt on success, a ReadFailedLine with retry on failure, and the
 * reads that print the name invalidated so the home follows at once.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const TAB = readFileSync("src/components/settings/ProductsTab.tsx", "utf8");

describe("a product can be renamed", () => {
  it("writes through updateProject from a Meridian field, on Enter or blur", () => {
    expect(TAB).toContain("useServerFn(updateProject)");
    expect(TAB).toContain('from "@/components/meridian/forms"');
    expect(TAB.replace(/\s+/g, " ")).toContain('<Field label="Name"');
    expect(TAB).toContain("onBlur={() => void commit()}");
    expect(TAB).toContain('if (e.key === "Enter")');
  });

  it("says what happened, both ways, and never opens a modal", () => {
    expect(TAB).toContain('<Receipt verb="Renamed" consequence={`to ${saved}`} />');
    expect(TAB).toContain("<ReadFailedLine error={failed} onRetry={() => void commit()}");
    const field = TAB.slice(TAB.indexOf("function RenameField("));
    expect(field).not.toMatch(/useConfirm|usePrompt|Modal/);
  });

  it("invalidates every read that prints the name, the home's first", () => {
    expect(TAB).toContain('qc.invalidateQueries({ queryKey: ["products"] })');
    expect(TAB).toContain('qc.invalidateQueries({ queryKey: ["portfolio"] })');
    expect(TAB).toContain('qc.invalidateQueries({ queryKey: ["projects"] })');
  });
});
