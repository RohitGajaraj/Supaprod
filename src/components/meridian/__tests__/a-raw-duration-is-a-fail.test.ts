/**
 * TWO MOTION SYSTEMS IN ONE DIRECTORY, AND ONE OF THEM IS NOT MERIDIAN.
 *
 * R-20 §4: a raw duration is a fail. Measured 2026-09-03 across
 * `src/components/meridian/**`:
 *
 *   duration-100 ×24   beside   --mrd-d-press ×56
 *   duration-150 ×11            --mrd-d-move  ×28
 *   duration-200 ×8             --mrd-d-enter ×10
 *   duration-300 ×7             --mrd-d-alive ×6
 *   duration-500 ×1
 *
 * Fifty-one hand-written numbers next to four named ones, in the directory that
 * IS the design system. `meridian.css` already records what that costs, about a
 * different literal: *"one idea, four literals, and they drift the first time
 * anybody changes one."*
 *
 * ── WHY THIS IS ABSOLUTE AND NOT RATCHETED ────────────────────────────────
 * The Meridian ratchet is a per-file debt ledger: a baseline of what each file
 * already carries, and a refusal to let any file get worse. That is the right
 * shape for retired vocabulary spread across 900 files of product surface, where
 * the debt is paid down over months.
 *
 * It is the wrong shape HERE. This directory is the system itself, the count is
 * zero as of this packet, and a ledger would record fifty-one entries as
 * permitted debt. Zero is the only number this can be, so it is asserted
 * directly rather than carried.
 *
 * ── AND MEANING DECIDES THE TOKEN, NOT THE NEAREST NUMBER ─────────────────
 * `--mrd-d-press` is 120ms and `duration-100` is the closest raw class to it,
 * but that is not why they map: `press` means "a control acknowledging a press",
 * and what makes a mapping right is that the thing moving IS an acknowledgement.
 * A hover colour written `duration-300` is still a press. A panel growing
 * written `duration-100` is still a move. The packet's own rule, and the reason
 * every mapping in this pass was read in context rather than substituted.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/components/meridian";

function filesUnder(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesUnder(path, acc);
    else if (/\.(tsx?|css)$/.test(name)) acc.push(path);
  }
  return acc;
}

/** Every raw duration class, with where it is, so a failure is actionable. */
function rawDurations(): Array<{ file: string; line: number; raw: string }> {
  const out: Array<{ file: string; line: number; raw: string }> = [];
  for (const file of filesUnder(DIR)) {
    // The test files in this directory quote the class to talk about it, which
    // is not the design system speaking two languages.
    if (file.includes("__tests__") || file.includes(".test.")) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/\bduration-(\d+)\b/g)) {
        out.push({ file, line: i + 1, raw: m[0] });
      }
    });
  }
  return out;
}

describe("Meridian speaks one motion vocabulary", () => {
  it("carries no raw duration at all", () => {
    const found = rawDurations();
    const said = found.map((f) => `${f.file}:${f.line}  ${f.raw}`).join("\n");
    /*
     * The message is the value of this test. A count tells whoever broke it
     * nothing; the file, the line and the class tell them everything, and the
     * fix is always the same question — what does this motion MEAN? A control
     * acknowledging is `--mrd-d-press`; a thing changing position or size is
     * `--mrd-d-move`; content arriving unasked is `--mrd-d-enter`; a repeating
     * highlight saying work has not stopped is `--mrd-d-alive`.
     */
    expect(found, `\n${said}\n`).toEqual([]);
  });

  it("scans real files, so an empty walk cannot pass by finding nothing", () => {
    // THE GUARD ON THE GUARD. If the directory moves or the extension filter
    // stops matching, every lookup misses and this file goes quietly green,
    // which is the same silent pass it exists to prevent.
    const files = filesUnder(DIR).filter((f) => !f.includes("__tests__"));
    expect(files.length).toBeGreaterThan(40);
    expect(files.some((f) => f.endsWith("SidebarNav.tsx"))).toBe(true);
  });

  it("would catch one if it came back", () => {
    // Proves the matcher itself, without reintroducing a real one.
    const line = 'className="transition-colors duration-200 hover:bg-mrd-hover"';
    expect([...line.matchAll(/\bduration-(\d+)\b/g)]).toHaveLength(1);
    // And does not fire on the tokens, which are the thing it is protecting.
    expect([..."duration-[var(--mrd-d-press)]".matchAll(/\bduration-(\d+)\b/g)]).toHaveLength(0);
  });

  it("names all four tokens in the system it is guarding", () => {
    // A guard that forbids the raw form must be able to point at the named one.
    const css = readFileSync("src/styles/meridian.css", "utf8");
    for (const token of ["--mrd-d-press", "--mrd-d-move", "--mrd-d-enter", "--mrd-d-alive"]) {
      expect(css, `${token} is not declared`).toContain(`${token}:`);
    }
  });
});
