/**
 * A GATE THAT CANNOT FIRE, AND A HEADING THAT PROMISED IT COULD.
 *
 * `agent_runs` carries `mission_token_cap`, `checkMissionCaps` compares it
 * before every model call, and `executeLoop` accepts a `missionTokenCap` input
 * and writes it to the row.
 *
 * NO CALLER PASSES ONE. The only three references to `missionTokenCap` in src/
 * are the optional field on the input type and the two `?? null` writes. So the
 * column is null on every run ever written, and the token half of the gate has
 * never had anything to compare against.
 *
 * Measured on the live database, 2026-08-27: of 2,570 runs in the last 30 days,
 * 2,555 carry a spend cap and ZERO carry a token cap.
 *
 * The row was already honest -- it prints "of N" only when a cap exists. It was
 * the REGION HEADING that promised "against the caps it was given" for both
 * numbers. This pins the shape of that fix, and pins the finding itself so that
 * wiring the input later fails here and makes somebody restore the sentence.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if ((p.endsWith(".ts") || p.endsWith(".tsx")) && !p.includes(".test.")) out.push(p);
  }
  return out;
}

describe("a cap nobody sets", () => {
  it("nothing in the product passes a mission token cap", () => {
    const passers: string[] = [];
    for (const f of walk("src")) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/missionTokenCap/g)) {
        const line = src.slice(0, m.index).split("\n").length;
        const text = src.split("\n")[line - 1] ?? "";
        // The declaration and the two writes are the mechanism. A CALL SITE
        // would look like `missionTokenCap: <something other than null>`.
        if (/missionTokenCap\s*:\s*(?!number|input\.)/.test(text) && !text.includes("?? null")) {
          passers.push(`${f}:${line}`);
        }
      }
    }
    /* If this ever fails, the cap has been wired and the heading below should
       go back to naming both numbers. That is the point of asserting it. */
    expect(passers).toEqual([]);
  });

  it("the heading claims a comparison only for the number that has one", () => {
    const src = readFileSync("src/components/governance/ControlsPanel.tsx", "utf8");
    const body = src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    expect(body).toContain("against the ceiling it was given");
    expect(body).not.toContain("against the caps it was given");
  });

  it("and the row still refuses to invent a denominator", () => {
    const src = readFileSync("src/components/governance/ControlsPanel.tsx", "utf8");
    // `of N` is rendered only inside a truthiness check on the cap itself.
    expect(src).toMatch(/tokCap \?/);
    expect(src).toMatch(/spendCap \?/);
  });
});
