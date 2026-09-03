/**
 * A SHIP THAT CANNOT DEPLOY BECAUSE A SECRET IS MISSING IS NOT A FAILED CREW
 * (P-59b, A-QUEUE.md).
 *
 * P-59 gave the hold card the right sentence ("Ship has no preview host. Set
 * DENO_DEPLOY_TOKEN and DENO_DEPLOY_ORG..."). The RECORD still fell into
 * `produced-nothing`, which counts an attempt against the crew and reads as
 * "the crew tried and produced nothing" -- the wrong attribution for a
 * station that ran, reached the host, and was correctly turned away for a
 * secret nobody on this run could set.
 *
 * `shipStopFrom`/`shipStopWaitsOnAPerson` are P-59's own classifier, already
 * unit-tested in `a-ship-that-cannot-deploy-names-the-provider.test.ts`. This
 * file tests the WIRING in `driveTrackOnce`: the newest deployment for the
 * changeset is read, classified, and only a `missing-provider` result holds
 * as `waiting-on-a-person` with attempts left untouched -- everything else
 * (an `other` reason, no reason at all, no deployment row) falls straight
 * through to the ordinary `produced-nothing` path below it, unchanged.
 *
 * Text-based, matching `a-station-that-filed-nothing-says-what-stopped-it
 * .test.ts`'s own established discipline for this file: `driveTrackOnce`
 * has no working precedent for a direct-invocation test (Supabase-client
 * shape, the loop's own dispatch, F-186's byte-window lesson already paid
 * for once), so this asserts ORDER and CONTENT off the source rather than
 * behaviour off a mocked run.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DRIVER = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");
const BODY = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));

/** The ship-only hold branch, found by its own anchor rather than a byte
 *  window, so an edit elsewhere in the function cannot silently widen or
 *  narrow what this checks (the exact lesson F-175/F-186 already paid for
 *  on the neighbouring branch this one sits beside). */
function shipBranch(): string {
  const from = BODY.indexOf('station === "ship"');
  expect(from, "the ship-only hold branch is gone").toBeGreaterThan(-1);
  const to = BODY.indexOf("\n  if (!producedThisVisit) {", from);
  expect(to, "could not find the generic produced-nothing fallback after it").toBeGreaterThan(from);
  return BODY.slice(from, to);
}

describe("imports the classifier P-59 already built, rather than re-matching a string", () => {
  it("reads shipStopFrom and shipStopWaitsOnAPerson from their own module", () => {
    // Checked as three separate facts, not one literal line, so prettier
    // reflowing an import list across lines cannot fail a guard that never
    // meant to pin formatting.
    const importBlock = DRIVER.slice(0, DRIVER.indexOf("export async function driveTrackOnce("));
    expect(importBlock).toContain(
      'from "@/lib/hosting/a-ship-that-cannot-deploy-names-the-provider"',
    );
    expect(importBlock).toContain("shipStopFrom");
    expect(importBlock).toContain("shipStopWaitsOnAPerson");
  });
});

describe("the ship branch runs before the generic produced-nothing fallback", () => {
  it("sits above the generic branch in source order", () => {
    const shipAt = BODY.indexOf('station === "ship"');
    const genericAt = BODY.indexOf("\n  if (!producedThisVisit) {");
    expect(shipAt).toBeGreaterThan(-1);
    expect(genericAt).toBeGreaterThan(shipAt);
  });

  it("only runs when the station filed nothing this visit, same guard as its siblings", () => {
    expect(BODY).toContain('!producedThisVisit && station === "ship"');
  });
});

describe("reads the newest deployment for the track's changeset", () => {
  const branch = shipBranch();

  it("orders newest first and takes exactly one row", () => {
    expect(branch).toContain('.order("created_at", { ascending: false })');
    expect(branch).toContain(".limit(1)");
  });

  it("selects the failure reason, the one column the classifier needs", () => {
    expect(branch).toContain("failure_reason");
  });

  it("scopes the read to this track's own changeset", () => {
    expect(branch).toContain('.eq("changeset_id", changesetId)');
  });

  it("classifies through shipStopFrom, not a re-matched string", () => {
    expect(branch).toContain("shipStopFrom(");
  });
});

describe("only a missing-provider result holds as waiting-on-a-person", () => {
  const branch = shipBranch();

  it("gates the hold write on shipStopWaitsOnAPerson", () => {
    expect(branch).toContain("shipStopWaitsOnAPerson(stop)");
  });

  it("writes waiting-on-a-person, never produced-nothing, inside that gate", () => {
    const gated = branch.slice(branch.indexOf("shipStopWaitsOnAPerson(stop)"));
    expect(gated).toContain('last_hold: "waiting-on-a-person"');
    expect(gated).not.toContain('last_hold: "produced-nothing"');
  });

  it("does NOT increment attempts on this path", () => {
    // The whole point: a crew that did nothing wrong must not spend a try.
    // Checked as an absence within the gated write, not a global absence in
    // the branch, so an `attempts` mention in a comment cannot false-pass it.
    const gated = branch.slice(branch.indexOf("shipStopWaitsOnAPerson(stop)"));
    const write = gated.slice(gated.indexOf(".update({"), gated.indexOf("} as never)"));
    expect(write).not.toMatch(/attempts:/);
  });

  it("carries the reason onto the row, not only onto the returned line", () => {
    const gated = branch.slice(branch.indexOf("shipStopWaitsOnAPerson(stop)"));
    const write = gated.slice(gated.indexOf(".update({"), gated.indexOf("} as never)"));
    expect(write).toContain("last_hold_because: because");
  });
});

describe("everything that is not a missing-provider reason falls through unchanged", () => {
  it("the branch has no unconditional return -- a hit that is not missing-provider keeps going", () => {
    // If shipStopWaitsOnAPerson is false, or there is no changeset, or the read
    // errored, control must reach the generic `if (!producedThisVisit)` block
    // below with `attempts` still counted there, same as before this packet.
    const branch = shipBranch();
    const returns = branch.match(/\breturn\s*\{/g) ?? [];
    // Exactly one return in the whole branch: the one inside the
    // shipStopWaitsOnAPerson gate. Any other return would let some other
    // condition (a read error, an ordinary failure) escape without counting
    // an attempt, which is the produced-nothing block's job, not this one's.
    expect(returns.length).toBe(1);
  });

  it("a read error is logged, never thrown, so a person still gets the ordinary hold", () => {
    const branch = shipBranch();
    expect(branch).toContain("console.error(");
  });
});
