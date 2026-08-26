/**
 * THE CLIENT'S LIMIT IS THE SERVER'S LIMIT, AND THIS TEST KEEPS IT TRUE.
 *
 * `STEER_MAX` exists so a long instruction is cut WHERE IT CAN BE SAID rather
 * than silently by the validator or at injection. That only works while the
 * three numbers agree -- the constant here, `steerTrack`'s zod cap, and the
 * loop's injection slice. They live in files S1 cannot write, so this is the
 * tripwire: change any one of them and this fails, loudly, instead of a
 * person's sentence vanishing from the middle.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { STEER_MAX } from "./SteerComposer";

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("STEER_MAX agrees with every reader of the field", () => {
  it("matches the server validator that would refuse longer text", () => {
    const src = read("../../lib/spine/track.functions.ts");
    expect(src).toContain(`message: z.string().trim().min(1).max(${STEER_MAX})`);
  });

  it("matches the loop's injection slice", () => {
    const src = read("../../lib/ai/loop.server.ts");
    expect(src).toContain(`text.slice(0, ${STEER_MAX})`);
  });
});
