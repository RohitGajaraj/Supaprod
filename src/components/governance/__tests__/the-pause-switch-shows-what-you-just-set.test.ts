/**
 * P-17 follow-up 2 (A-QUEUE.md, A1 live 2026-09-02 22:03): the "Agents may
 * run" toggle sat on its OLD position for three seconds after a press,
 * because `onSuccess` only invalidated the boundary query -- which marks it
 * stale, not updated -- so the switch waited on a full refetch to say what had
 * already been written. Pinned as a source scan for the reason
 * `one-station-display-on-the-run-screen.test.ts` gives for the same choice
 * elsewhere in this app: standing up `BoundaryControls` means mocking five
 * `useServerFn` reads and a `useQuery`/`useMutation` pair, and a render test
 * whose scaffolding dwarfs the one behaviour it checks is not one anybody
 * keeps current. This proves the SHAPE of the fix -- optimistic set on
 * mutate, rollback on error -- which is what a source scan can actually see.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../BoundaryControls.tsx", import.meta.url), "utf8");

describe("the kill switch shows what you just set, before the server confirms it", () => {
  it("cancels in-flight reads and snapshots the previous value before writing the optimistic one", () => {
    expect(src).toContain("onMutate: async (next: boolean) => {");
    expect(src).toContain("await qc.cancelQueries({ queryKey: key });");
    expect(src).toContain("const previous = qc.getQueryData(key);");
  });

  it("sets the cache to the value being written, not to a guess about the response shape", () => {
    expect(src).toContain(
      "qc.setQueryData(key, (old: typeof b.data) => (old ? { ...old, paused: next } : old));",
    );
    expect(src).toContain("return { previous };");
  });

  it("rolls back to the exact snapshot on a failed write, never to a hardcoded default", () => {
    expect(src).toContain("onError: (e: Error, _next, context) => {");
    expect(src).toContain(
      'if (context) qc.setQueryData(["boundary", activeWorkspaceId], context.previous);',
    );
  });

  it("still invalidates on success, so the optimistic value is reconciled against the real row", () => {
    expect(src).toContain('void qc.invalidateQueries({ queryKey: ["boundary"] });');
  });
});
