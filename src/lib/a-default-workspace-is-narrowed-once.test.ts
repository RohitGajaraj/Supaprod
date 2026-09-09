/**
 * ── AN ID IS A CHECK, NOT A CAST ─────────────────────────────────────────────
 *
 * `current_user_default_workspace` answers a uuid or nothing, and every caller
 * took that answer as `(data as string | null) ?? null`. The cast is a claim
 * and `??` only guards null and undefined, so any other shape passed through
 * wearing the type of an id. Lane 1 watched an empty array do exactly that one
 * layer down on 2026-09-09: it is truthy, it became the workspace id, every
 * read filtered on it and every read answered zero, in a file whose own header
 * says null means "we could not find out" and must never become zero.
 *
 * One narrowing, in one place, and it is a check.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { defaultWorkspaceId } from "./workspaces.functions";

describe("an id is a check, not a cast", () => {
  it("takes a non-empty string and nothing else", () => {
    expect(defaultWorkspaceId("60000000-0000-4000-8000-000000000000")).toBe(
      "60000000-0000-4000-8000-000000000000",
    );
    expect(defaultWorkspaceId(null)).toBeNull();
    expect(defaultWorkspaceId(undefined)).toBeNull();
  });

  it("refuses the shapes a cast would have let through", () => {
    // The one that was measured in the wild. It is truthy.
    expect(defaultWorkspaceId([])).toBeNull();
    expect(defaultWorkspaceId([{ id: "x" }])).toBeNull();
    expect(defaultWorkspaceId({})).toBeNull();
    expect(defaultWorkspaceId({ id: "x" })).toBeNull();
    expect(defaultWorkspaceId(0)).toBeNull();
    expect(defaultWorkspaceId(true)).toBeNull();
    expect(defaultWorkspaceId("")).toBeNull();
    expect(defaultWorkspaceId("   ")).toBeNull();
  });

  it("and no caller narrows that answer with a cast of its own", () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.ts$/.test(p) && !/\.test\.|__tests__/.test(p)) out.push(p);
      }
      return out;
    };
    const offenders: string[] = [];
    for (const f of [...walk("src/lib"), ...walk("src/routes")]) {
      const src = readFileSync(f, "utf8");
      const calls = [
        ...src.matchAll(
          /const \{ data(?:: (\w+))? \} = await [\w.]*\.?rpc\(\s*"current_user_default_workspace"\s*\)/g,
        ),
      ];
      for (const m of calls) {
        const name = m[1] ?? "data";
        // The cast this guard exists to prevent, on the variable that call bound.
        if (new RegExp(`\\(${name} as string \\| null\\)\\s*\\?\\?`).test(src)) {
          offenders.push(`${f} (${name})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
