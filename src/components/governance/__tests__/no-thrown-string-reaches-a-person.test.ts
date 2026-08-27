/**
 * "UNAUTHORIZED: INVALID TOKEN" REACHED FOUR SURFACES IN FOUR DIFFERENT SHAPES.
 *
 * It was found on Settings, then Brain twice, then the Admin console, then the
 * boundary pane -- each time after a sweep that was supposed to have finished
 * the job. Each shape defeated the previous sweep's grep:
 *
 *   {(q.error as Error)?.message ?? "fallback"}     caught in U-040
 *   {(q.error as Error).message}                    caught in U-045
 *   Sentence. {(q.error as Error)?.message}         caught in U-048
 *
 * Three greps, three misses, because the defect was never the shape. It is that
 * a component decides what a failure SAYS. So this counts the shapes rather than
 * chasing them: a component in these directories must hand the ERROR to the
 * primitive and let it decide.
 *
 * That matters beyond tidiness. ReadFailed knows a recognised dead session gets
 * a way to /login, where "Try again" would re-read with the same dead token
 * forever -- an offered control that cannot work, which S1 photographed on
 * /approvals.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
  "governance",
  "engine-room",
  "settings",
  "admin",
  "knowledge",
  "brain",
  "connections",
  "memory",
  "trust",
].map((d) => join(import.meta.dir, "..", "..", d));

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "__tests__") continue;
      out.push(...tsxFiles(p));
    } else if (name.endsWith(".tsx") && !name.includes(".test.")) {
      out.push(p);
    }
  }
  return out;
}

describe("no thrown string is rendered to a person", () => {
  it("no component in the platform's surfaces interpolates a raw error message", () => {
    const offenders: string[] = [];
    for (const root of ROOTS) {
      for (const file of tsxFiles(root)) {
        const src = readFileSync(file, "utf8");
        // The JSX shape: a thrown message placed directly into rendered output.
        const re = /\{\(?[^{}]*\bas Error\)?\??\.message[^}]*\}/g;
        for (const hit of src.match(re) ?? []) {
          // `{ message: (e as Error).message }` builds a DATA object; this rule
          // is about what reaches a screen, not about every mention.
          if (/\bmessage:\s*\(/.test(hit)) continue;
          offenders.push(`${file.split("/src/")[1]}: ${hit.slice(0, 70)}`);
        }
      }
    }
    expect(offenders, "hand the error to ReadFailed instead: <ReadFailed error={q.error}>").toEqual(
      [],
    );
  });
});
