import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DISPATCH_REFUSED_PREFIX,
  dispatchRefusalReason,
  isDispatchRefusal,
  refuseDispatch,
} from "./dispatch-refusal";

/**
 * "NOTHING WAS DISPATCHED" WAS SAID ON EVERY FAILURE, INCLUDING THE ONES WHERE
 * EVERYTHING WAS.
 *
 * The Build Console's `onError` appended "Nothing was dispatched, so the spec is
 * still waiting." to whatever it caught, and the comment above it argued the
 * sentence was safe because `dispatchBuilderMission` throws only where nothing
 * durable happened. That reasoning covers a SERVER THROW and nothing else.
 * `onError` also fires for a gateway timeout, a dropped connection, an edge 5xx
 * and an aborted fetch, and in every one of those the request may have reached
 * the handler and run it to the end: the GitHub issue open, a mission created, a
 * builder queued and about to spend. The natural response to being told nothing
 * happened is to press again, and a second press is a second issue, a second
 * mission and a second billed run.
 *
 * This file pins the mark and, more importantly, its FAIL DIRECTION: anything
 * unmarked must read as "we cannot tell", never as "nothing happened".
 */
describe("only the handler's own pre-durable refusal may claim nothing happened", () => {
  test("a marked message is recognised, and gives back its own words", () => {
    const e = refuseDispatch("Need a GitHub issue: link a PRD with one.");
    expect(isDispatchRefusal(e.message)).toBe(true);
    expect(dispatchRefusalReason(e.message)).toBe("Need a GitHub issue: link a PRD with one.");
  });

  test("every transport shape is NOT a refusal", () => {
    // The four the panel actually meets. None of them is evidence about what
    // the handler did or did not do.
    for (const m of [
      "Failed to fetch",
      "504 Gateway Timeout",
      "<html><title>502 Bad Gateway</title></html>",
      "The operation was aborted.",
    ]) {
      expect({ m, refusal: isDispatchRefusal(m) }).toEqual({ m, refusal: false });
    }
  });

  test("an unmarked message keeps its words when printed", () => {
    // The panel prints `dispatchRefusalReason` on both branches, so a message
    // with no mark must survive it unchanged rather than come back empty.
    expect(dispatchRefusalReason("Failed to fetch")).toBe("Failed to fetch");
  });

  test("null, undefined and the empty string are not refusals", () => {
    expect(isDispatchRefusal(null)).toBe(false);
    expect(isDispatchRefusal(undefined)).toBe(false);
    expect(isDispatchRefusal("")).toBe(false);
  });

  test("the mark is a PREFIX, not a substring anywhere in the message", () => {
    // A server message that quoted the sentence back (an echoed error, a log
    // line) must not be mistaken for the handler's own refusal.
    expect(isDispatchRefusal(`upstream said: ${DISPATCH_REFUSED_PREFIX}nope`)).toBe(false);
  });

  test("the mark leaves the repo gate's own matcher working", () => {
    /**
     * `resolveGitHub`'s not-connected refusal is classified everywhere by
     * `isRepoNotConnectedError`, a case-insensitive test for "github is not
     * connected" ANYWHERE in the message. Marking that throw must not hide it,
     * or the connect-a-repo dialog stops opening and the person meets a raw
     * error instead of the two real paths.
     */
    const marked = refuseDispatch("GitHub is not connected for this workspace.");
    expect(/github is not connected/i.test(marked.message)).toBe(true);
  });
});

const HERE = join(import.meta.dir, "..");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const DISPATCH = strip(readFileSync(join(HERE, "build.functions.ts"), "utf8"));
const PANEL = strip(
  readFileSync(join(HERE, "..", "components", "build", "ReadyToBuild.tsx"), "utf8"),
);

describe("both halves of the mark are wired", () => {
  test("the producer marks its pre-durable throws and makes no unmarked ones", () => {
    /**
     * WHOLE-HANDLER, because one unmarked throw is enough to put the false
     * sentence back on screen: the panel's `refused` branch is keyed on the
     * mark, and a `new Error` thrown from the pre-durable phase would be read
     * as a transport failure, which is the SAFE direction, so this rule is
     * about keeping the confident sentence reachable at all rather than about
     * preventing a lie. The slice stops at the next export so
     * `listSpecDispatches` (which reports rather than throws) is not swept in.
     */
    const handler = DISPATCH.slice(
      DISPATCH.indexOf("export const dispatchBuilderMission"),
      DISPATCH.indexOf("export type SpecDispatch"),
    );
    expect(handler.length).toBeGreaterThan(0);
    expect(handler).toContain("refuseDispatch(");
    // Every throw in the handler goes through the mark. `throw e`/`throw err`
    // re-throws are allowed: they carry whatever mark they arrived with.
    const throws = handler.match(/throw\s+[A-Za-z_$][\w$]*\(/g) ?? [];
    expect(throws.length).toBeGreaterThan(0);
    expect(throws.filter((t) => !t.startsWith("throw refuseDispatch"))).toEqual([]);
  });

  test("the consumer branches on it rather than asserting the old sentence", () => {
    expect(PANEL).toContain("isDispatchRefusal(e.message)");
    // The confident sentence survives, and only on the branch it is true of.
    const onError = PANEL.slice(PANEL.indexOf("onError: (e: Error) => {"));
    const refusedArm = onError.slice(0, onError.indexOf("});"));
    expect(refusedArm).toContain("Nothing was dispatched");
    expect(refusedArm).toContain("Check Runs before pressing again");
  });
});
