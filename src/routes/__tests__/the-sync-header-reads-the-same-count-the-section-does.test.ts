/**
 * P-44 follow-up (A-QUEUE.md). A1's live walk: the header said "Nothing is
 * syncing yet. Point a source at something below" directly above
 * WorkspaceBindingsSection reading "1 pointed, all reading" -- one screen
 * disagreeing with itself about whether anything was pointed anywhere.
 */
import { describe, expect, it } from "bun:test";

import { syncHeadline } from "../_authenticated.sync";

const base = { failed: false, loading: false, conflictCount: 0, syncedCount: 0, boundCount: 0 };

describe("the sync page's own headline", () => {
  it("does not invite pointing a source that is already pointed", () => {
    const line = syncHeadline({ ...base, boundCount: 1 });
    expect(line).not.toContain("Point a source");
  });

  it("still invites pointing one when genuinely nothing is bound either", () => {
    expect(syncHeadline(base)).toContain("Point a source");
  });

  it("a real document conflict outranks the bound-but-no-documents state", () => {
    expect(syncHeadline({ ...base, boundCount: 1, conflictCount: 2 })).toContain(
      "edited on both sides",
    );
  });

  it("synced documents outrank the bound-but-no-documents state", () => {
    expect(syncHeadline({ ...base, boundCount: 1, syncedCount: 3 })).toContain(
      "Nothing is waiting on you",
    );
  });

  it("a failed read is said before any count is read", () => {
    expect(syncHeadline({ ...base, failed: true, boundCount: 1 })).toContain("did not load");
  });

  it("a pending read is said before any count is read", () => {
    expect(syncHeadline({ ...base, loading: true, boundCount: 1 })).toBe(
      "Reading what is in sync.",
    );
  });
});
