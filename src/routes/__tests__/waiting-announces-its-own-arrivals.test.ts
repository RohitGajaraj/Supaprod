/**
 * P-90: Waiting's arrivals (P-83's own realtime push) are announced to a
 * screen reader once, not on every poll. Full-mount is impractical here --
 * `_authenticated.approvals.tsx` pulls in workspace context, router search
 * params, three live queries and a keyboard-handling effect -- so this is
 * source-derived, the same fallback P-16's own report used for the surface
 * it could not drive a live Tab key against.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "..", "_authenticated.approvals.tsx"), "utf8");

describe("the approvals queue carries a live region for arrivals, computed as a delta", () => {
  it("renders a role=status aria-live=polite region for the arrival announcement", () => {
    expect(SRC).toContain('<p role="status" aria-live="polite" className="sr-only">');
    expect(SRC).toContain("{arrivalAnnouncement}");
  });

  it("is a DELTA (count going up), not the live count itself", () => {
    // Rendering the count directly would announce it once on every page
    // LOAD too -- the jump from "no data yet" to the real number -- which
    // is not an arrival. The guard is that the announcement text is only
    // ever set on a genuine increase.
    expect(SRC).toContain("if (prev !== null && count > prev)");
    expect(SRC).toContain("previousQueueCount.current = count");
  });

  it("stays silent (never fires) while the read is still loading", () => {
    expect(SRC).toContain("if (queue.isLoading) return;");
  });

  it("the empty-queue quietLine is also a live region -- P-83's own arrival can update it too", () => {
    expect(SRC).toContain(
      'role="status" aria-live="polite" className="text-mrd-label text-mrd-mute"',
    );
  });

  it('the retired imperative is gone: no "refresh" anywhere live copy could read it (P-83\'s own guard)', () => {
    // Not re-litigating P-83's guard here, just confirming this packet's
    // own edits did not reintroduce it.
    const withoutBlockComments = SRC.replace(/\/\*[\s\S]*?\*\//g, "");
    const withoutLineComments = withoutBlockComments.replace(/\/\/.*$/gm, "");
    expect(withoutLineComments.toLowerCase()).not.toContain("refresh");
  });
});
