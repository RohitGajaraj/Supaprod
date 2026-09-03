import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A STATION THAT CANNOT FINISH ITS OWN ARTIFACT.
 *
 * THE GAP, and it is the purest form of this repo's signature defect: a
 * capability with no door. `loop-surfaces.ts` (now deleted, P-29, A-QUEUE.md
 * -- dead code by then, zero real callers) said Plan "produces: an approved
 * spec". No control anywhere in the product set that status. The only app-code
 * writer of `prds.status` is in `decisions.functions.ts` and it writes "review".
 * Fifty-five approved specs sit on the live database and not one of them was
 * approved by a person using this product.
 *
 * EVERY OTHER PIECE WAS ALREADY BUILT, which is what makes it expensive rather
 * than merely missing:
 *   - `savePrd` accepts `status: "approved"` and already detects the
 *     draft-or-review to approved transition, to write its Decisions entry and
 *     grade the outcome contract;
 *   - the `prds_reactor_fanout` trigger fires on UPDATE (verified on the live
 *     database, AFTER INSERT and AFTER UPDATE);
 *   - `prd.approved` is a registered reactor event type, offered in the
 *     governance Controls picker, and `reactor.functions.ts` carries a written
 *     prompt for it: "A spec was just approved. Plan a multi-agent execution:
 *     break it into specialist steps, dispatch the first wave."
 *
 * So an entire downstream automation sat dark behind a missing button, and the
 * agents waiting on that event were never woken. Nothing could catch it: every
 * file typechecks, every test passes, and the surface looks complete, because
 * an absent control leaves no trace anywhere except in what never happens.
 */

const SPEC = readFileSync(join(import.meta.dir, "..", "_authenticated.plan.spec.$id.tsx"), "utf8");
const DISCOVERY = readFileSync(
  join(import.meta.dir, "..", "..", "lib", "discovery.functions.ts"),
  "utf8",
);
const REACTOR = readFileSync(
  join(import.meta.dir, "..", "..", "lib", "reactor.functions.ts"),
  "utf8",
);
const GATE_DIALOG = readFileSync(
  join(import.meta.dir, "..", "..", "components", "studio", "RepoGateDialog.tsx"),
  "utf8",
);

describe("Plan can approve the artifact it exists to produce", () => {
  it("has a control that sets the status, not merely a save", () => {
    expect(SPEC).toMatch(/status:\s*"approved"/);
    expect(SPEC).toMatch(/Approve the spec/);
  });

  it("saves the edits in the SAME write as the approval", () => {
    // Approving while the body on screen differs from the body on the record
    // would approve a version nobody read. One call, one row, one transition.
    expect(SPEC).toMatch(/mSave\(\{ data: \{ id, title, body_md: body, status: "approved" \} \}\)/);
  });

  it("is not offered on a spec that is already approved", () => {
    // A control that repeats an act already taken is a control that teaches
    // people their press did nothing.
    expect(SPEC).toMatch(/prd\.status !== "approved" \?/);
  });

  it("says what the approval CAUSED, not that a field changed", () => {
    // The receipt names the consequence a person can go and check: Build can
    // pick it up, and the crew was told. "Status updated" would be true and
    // useless.
    expect(SPEC).toMatch(/You approved the spec/);
    expect(SPEC).toMatch(/Build can pick it up/);
  });

  it("reports a failure rather than wearing the shape of a success", () => {
    expect(SPEC).toMatch(/The spec is not approved/);
  });
});

/**
 * 2026-08-06, THE SELF-SUFFICIENCY PASS. Four claims this surface used to make
 * that its own code did not keep. None of them broke a type and none of them
 * failed a test, which is why they are pinned here: every one is a sentence or
 * a disabled attribute, and the only trace a regression would leave is a person
 * being told something untrue.
 */
describe("the spec page does not say what its code will not do", () => {
  it("refetches the row it just changed, on both writers", () => {
    // ["prds"] is the LIST on /plan; this page reads ["prd", id], and the two
    // do not partial-match. Invalidating only the list left the page that
    // approved the spec printing "draft" under a receipt saying it approved it.
    // Both writers of the prds row on this page carry both keys.
    const both = SPEC.match(/queryKey: \["prd", id\]/g) ?? [];
    expect(both.length).toBeGreaterThanOrEqual(3);
    expect(SPEC).toMatch(/status: "approved"[\s\S]{0,400}?queryKey: \["prd", id\]/);
  });

  // "does not disable the send on a missing GitHub issue" retired, not
  // re-spelled (P-29, A-QUEUE.md, 2026-09-03): it pinned `routeBlocker`'s
  // exact body, and `routeBlocker` answered "why can't the dispatch run" --
  // a question with no subject once Send to Build is removed from this page
  // (the P-14 ruling table's own line: "Send to Build and Create issue go,
  // because the run does both"). `sendsWithoutIssue`, the note it demoted
  // to, survives and stays pinned by name below.
  it("still names a GitHub issue as optional, as a note rather than a blocker", () => {
    expect(SPEC).toMatch(/const sendsWithoutIssue = \(\): boolean =>/);
  });

  it("sends the issue door's not-connected refusal to the same gate the send uses", () => {
    // Two acts, one resolveGitHub, one refusal. The issue door used to write a
    // dead receipt where the dispatch offered /sync and a starter repo.
    expect(SPEC).toMatch(
      /isRepoNotConnectedError\(e\.message\)\) setRepoGate\(\{ reason: e\.message, retry: "issue" \}\)/,
    );
  });

  it("tells the gate which act it interrupted, and tells the dialog the same thing", () => {
    // `onRetry` was hardwired to the dispatch, so provisioning a repo from the
    // issue door would have started a build nobody asked for. Branching the
    // retry is only half of it: every sentence inside the dialog was written
    // about the dispatch too, down to a toast reading "Build dispatched".
    expect(SPEC).toMatch(/retry: "dispatch" \| "issue"/);
    expect(SPEC).toMatch(/act=\{repoGate\?\.retry \?\? "dispatch"\}/);
    expect(GATE_DIALOG).toMatch(/act\?: RepoGateAct/);
    expect(GATE_DIALOG).toMatch(/The issue is being opened on the fresh repo/);
  });
});

describe("the machinery the button was missing from is genuinely there", () => {
  it("savePrd accepts the approved status", () => {
    // If this ever narrows, the button above becomes a lie rather than a bug.
    expect(DISCOVERY).toMatch(
      /status:\s*z\.enum\(\["draft", "review", "approved", "shipped"\]\)\.optional\(\)/,
    );
  });

  it("the reactor still has a prompt waiting for the event", () => {
    // The event type, its handler and the DB trigger all predate the control.
    // If this handler is ever deleted, approving a spec silently stops waking
    // anyone and the button keeps looking like it works.
    expect(REACTOR).toContain('case "prd.approved":');
    expect(REACTOR).toMatch(/A spec was just approved/);
  });
});
