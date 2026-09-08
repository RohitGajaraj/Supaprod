/**
 * F-141: THE STATION STRIP COUNTED ONE PERSON'S RUNS AND CALLED IT A WORKSPACE.
 *
 * S2 measured it on the primary "where is the work" control, and raised it twice
 * rather than changing it, which was right: fifteen consumers share this read and
 * a scope change silently alters what every one of them counts.
 *
 * ── TWO DEFECTS IN ONE READ ────────────────────────────────────────────────
 * **Scope.** Both run queries read `.eq("user_id", userId)` with no workspace
 * filter anywhere in the handler, while the strip renders the tally directly
 * under a breadcrumb reading "Helio Labs / Prism" and directly above a board
 * whose every other number is workspace-scoped. It said *"89 runs waiting on
 * you"* at Discover, and switching workspace would not have changed it.
 *
 * **Caps.** The read bounds twice at 100 and once more at 200 on the assembled
 * array, and the per-station numbers were rendered as facts. So they were what
 * SURVIVED the read, with nothing able to say so — exactly the shape S1 measured
 * on the approvals queue, where 116 pending design gates met a limit of 100 and
 * sixteen calls were on no screen at all.
 *
 * ── BOTH FIXES ARE ADDITIVE, FOLLOWING S2'S OWN PRECEDENT ──────────────────
 * `listDueForecastsHere` is the shape: a second door, the original read
 * untouched, each caller choosing. So `workspaceId` is optional and its absence
 * is byte-for-byte the read that shipped, and `bounded` is a new field rather
 * than a changed one.
 *
 * `bounded` does not say how many were dropped — we do not know without a second
 * count — only that the answer is a **floor**. A surface can then say "at least
 * N", which is weaker than N and true, rather than N, which is stronger and
 * sometimes false.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./studio.functions.ts", import.meta.url)), "utf8");
/** Comments stripped: this header quotes the very shapes being asserted. */
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

describe("a caller can ask for one workspace", () => {
  it("the input accepts it, optionally", () => {
    expect(CODE).toContain("workspaceId: z.string().uuid().optional()");
  });

  it("and both run reads honour it", () => {
    expect(CODE).toContain('if (workspaceId) builderQ = builderQ.eq("workspace_id", workspaceId);');
    expect(CODE).toContain('if (workspaceId) otherQ = otherQ.eq("workspace_id", workspaceId);');
  });

  it("absent, the read is what it always was", () => {
    /*
     * Fifteen consumers share this. The default has to be the old behaviour or
     * a scope change lands on every one of them at once, which is precisely why
     * S2 declined to make it.
     */
    // The server function hands its input to the read behind it
    // (readStudioSessions, since the eleven-hop collapse of 2026-09-08), and
    // the default is decided once, at that handoff.
    expect(CODE).toContain("workspaceId: data?.workspaceId ?? null,");
    expect(CODE).toContain("const workspaceId = opts.workspaceId;");
  });

  it("it is a conditional chain, not an invented builder method", () => {
    // I first wrote `.apply((q) => ...)`, which PostgREST's builder does not
    // have. A plausible-looking method typechecks against `any` and throws at
    // runtime, which is the same class as a wrong column inside a select string.
    expect(CODE).not.toContain(".apply((q)");
  });
});

describe("a bounded read reports itself", () => {
  it("the flag exists and is returned", () => {
    expect(CODE).toContain("bounded: boolean");
    expect(CODE).toContain("bounded: bounded || sessions.length > ASSEMBLED_CAP");
  });

  it("it is true when EITHER page filled", () => {
    // Two reads keep separate pages on purpose, so either filling means the
    // assembled answer is short.
    expect(CODE).toContain(
      "(runs?.length ?? 0) >= RUN_PAGE || (otherRuns?.length ?? 0) >= RUN_PAGE",
    );
  });

  it("and the caps are named, so the flag cannot drift from them", () => {
    expect(CODE).toContain("const RUN_PAGE = 100;");
    expect(CODE).toContain("const ASSEMBLED_CAP = 200;");
    // The magic numbers are gone from the query and the slice.
    expect(CODE).not.toContain(".limit(100)");
    expect(CODE).not.toContain("sessions.slice(0, 200)");
  });

  it("the early return carries it too, so an empty answer is not implicitly complete", () => {
    // A workspace with no missions at all still deserves to say whether the
    // read that found none was itself bounded.
    expect(CODE).toContain("return { sessions: [], bounded };");
  });
});
