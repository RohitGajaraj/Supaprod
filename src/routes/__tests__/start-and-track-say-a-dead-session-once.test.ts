/**
 * P-15 (A-QUEUE.md): "permission-denied" is its own state category, distinct
 * from a generic read failure, and Start and the run screen had never
 * adopted the shared `SessionEnded` component -- Brain, the settings
 * boundary pane and /learn all had, per that component's own header
 * ("Measured on three surfaces... together a wall that makes the product
 * look far more broken than it is"). A dead session on either page fell
 * through to a generic "could not load" sentence instead of the specific,
 * actionable "sign back in, nothing is lost" one.
 *
 * Source-scan, matching `one-cause-said-once.test.ts`'s own convention for
 * this exact mechanism, for the same reason that file gives: standing up
 * either route means mocking the whole read layer, and a guard whose
 * scaffolding is bigger than its subject is a guard nobody maintains.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { endedSessionFor } from "@/components/system/SessionEnded";

function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const START = code(readFileSync("src/routes/_authenticated.start.tsx", "utf8"));
const TRACK = code(readFileSync("src/routes/_authenticated.track.$trackId.tsx", "utf8"));

describe("Start says a dead session once, on the page's own read", () => {
  it("imports the shared component rather than a local copy", () => {
    expect(START).toContain(
      'import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";',
    );
  });

  it("checks the same cache entry YourRuns polls, and returns early", () => {
    expect(START).toContain("const sessionEnded = endedSessionFor(runs.error);");
    expect(START).toContain('<SessionEnded title="Start" error={runs.error}>');
  });
});

describe("The run screen says a dead session once, on the page's own read", () => {
  it("imports the shared component rather than a local copy", () => {
    expect(TRACK).toContain(
      'import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";',
    );
  });

  it("checks trackQ, the same read the header's loading/error/not-found ladder already reads", () => {
    expect(TRACK).toContain("const sessionEnded = endedSessionFor(trackQ.error);");
    expect(TRACK).toContain('<SessionEnded title="This piece of work" error={trackQ.error}>');
  });
});

describe("the predicate both routes now rely on", () => {
  it("recognises an ended session, and nothing else is mistaken for one", () => {
    expect(endedSessionFor(new Error("JWT expired"))).toBeTruthy();
    expect(endedSessionFor(new Error("network unreachable"))).toBeNull();
    expect(endedSessionFor(null)).toBeNull();
  });
});
