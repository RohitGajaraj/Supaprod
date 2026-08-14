import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE SILENT-DISCARD CLASS, pinned.
 *
 * `agentic_model` was sent by the Settings control on every save and was not in
 * `UpdateSchema`. `z.object` STRIPS unknown keys rather than refusing them, so
 * the patch reduced to `{updated_at}`, the update succeeded, the mutation
 * resolved, and the success toast fired. Reloading showed the old value. The
 * control that picks which model every unattended background tick runs on was
 * inoperative and congratulated you for using it.
 *
 * `default_model` sat beside it in the same schema and worked, which is exactly
 * why it survived: the surface looked correct because its neighbour was.
 *
 * A unit test of `updateProfile` would not have caught this. It would have
 * passed a field the schema knows about. The only thing that catches it is
 * comparing what the CALLER sends against what the schema accepts, which is what
 * this does, by reading both files.
 */

const LIB = import.meta.dir;
const schemaSrc = readFileSync(join(LIB, "profile.functions.ts"), "utf8");
const settingsSrc = readFileSync(
  join(LIB, "..", "routes", "_authenticated.settings.tsx"),
  "utf8",
);

/** The field names inside the `const UpdateSchema = z.object({ ... })` literal. */
function schemaFields(): string[] {
  const start = schemaSrc.indexOf("const UpdateSchema = z.object({");
  expect(start).toBeGreaterThan(-1);
  const body = schemaSrc.slice(start, schemaSrc.indexOf("});", start));
  return [...body.matchAll(/^\s{2}([a-z_]+):\s*z\./gm)].map((m) => m[1]);
}

describe("updateProfile accepts every field the Settings surface sends it", () => {
  test("agentic_model is accepted, not silently stripped", () => {
    // The regression itself. It is read by resolveAgenticModel for every
    // background tick, and by cluster and reflection directly.
    expect(schemaFields()).toContain("agentic_model");
  });

  test("its neighbour still works, so the fix did not trade one for the other", () => {
    expect(schemaFields()).toContain("default_model");
  });

  /**
   * The general form. Any `mUpdate({ data: { x } })` in the Settings route names
   * a field the profile schema must accept. This is the check that would have
   * caught the original and will catch the next one.
   */
  test("every field Settings sends to updateProfile is in the schema", () => {
    const accepted = new Set(schemaFields());
    // Matches `mUpdate({ data: { agentic_model } })` and the multi-key form.
    const sent = new Set<string>();
    for (const call of settingsSrc.matchAll(/mUpdate\(\s*\{\s*data:\s*\{([^}]*)\}/g)) {
      for (const part of call[1].split(",")) {
        const key = part.split(":")[0].trim();
        if (/^[a-z_]+$/.test(key)) sent.add(key);
      }
    }
    // If this is empty the scan broke and a green result would mean nothing.
    expect(sent.size).toBeGreaterThan(0);
    expect([...sent].filter((f) => !accepted.has(f))).toEqual([]);
  });
});
