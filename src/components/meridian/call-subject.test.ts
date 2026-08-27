import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { callSubject } from "./call-subject";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/**
 * A CALL'S SCOPE IS REPORTED, NEVER INVENTED.
 *
 * The board drew `?? "This workspace"` where `/approvals` drew nothing and had
 * written down why. That is a claim about scope made on a call whose read
 * returned no scope, and it is wrong in a case the payload cannot flag:
 * `approvals-queue.functions.ts:563` resolves a decision's project as
 * `d.prd_id ? projectByPrd.get(d.prd_id) : undefined`, so a decision that
 * BELONGS to a PRD whose project did not resolve arrives with both
 * `projectName` and `projectId` null - identical to a genuinely workspace-wide
 * call, and "This workspace" is false for it.
 */

const item = (o: Partial<ApprovalQueueItem>) => o as ApprovalQueueItem;

describe("callSubject", () => {
  it("prefers the resolved name", () => {
    expect(callSubject(item({ project: "Prism", projectName: "Prism (PRD)" }))).toBe("Prism");
    expect(callSubject(item({ project: undefined, projectName: "Prism" }))).toBe("Prism");
  });

  it("RETURNS NULL RATHER THAN NAMING THE WORKSPACE", () => {
    // Both nulls, from either cause, get the same answer: we do not know, so
    // we say nothing. There is no third value the payload could carry here.
    expect(callSubject(item({ project: undefined, projectName: null }))).toBeNull();
  });

  it("does not treat an empty string as a name", () => {
    // A blank would render as a stray separator with nothing after it.
    expect(callSubject(item({ project: "", projectName: null }))).toBeNull();
  });
});

describe("the board", () => {
  const SRC = readFileSync("src/components/today/DecisionQueue.tsx", "utf8");

  it("no longer claims a workspace it was not told about", () => {
    expect(SRC).not.toContain('?? "This workspace"');
  });

  it("draws the subject only when there is one, at both call sites", () => {
    // The gate's meta row and the list row's sub line. Two sites, one rule:
    // the list row builds its sub by joining what exists, so a missing subject
    // cannot leave a dangling separator.
    expect(SRC).toContain("{callSubject(item) ? <span>{callSubject(item)}</span> : null}");
    expect(SRC).toContain('.join(" · ")');
  });

  it("reads it from the shared module, so the two surfaces cannot drift", () => {
    expect(SRC).toContain('from "@/components/meridian/call-subject"');
  });
});
