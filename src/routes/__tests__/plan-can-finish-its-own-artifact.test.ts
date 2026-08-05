import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A STATION THAT CANNOT FINISH ITS OWN ARTIFACT.
 *
 * THE GAP, and it is the purest form of this repo's signature defect: a
 * capability with no door. `loop-surfaces.ts` says Plan "produces: an approved
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

const SPEC = readFileSync(
  join(import.meta.dir, "..", "_authenticated.plan.spec.$id.tsx"),
  "utf8",
);
const DISCOVERY = readFileSync(join(import.meta.dir, "..", "..", "lib", "discovery.functions.ts"), "utf8");
const REACTOR = readFileSync(join(import.meta.dir, "..", "..", "lib", "reactor.functions.ts"), "utf8");

describe("Plan can approve the artifact it exists to produce", () => {
  it("has a control that sets the status, not merely a save", () => {
    expect(SPEC).toMatch(/status:\s*"approved"/);
    expect(SPEC).toMatch(/Approve the spec/);
  });

  it("saves the edits in the SAME write as the approval", () => {
    // Approving while the body on screen differs from the body on the record
    // would approve a version nobody read. One call, one row, one transition.
    expect(SPEC).toMatch(
      /mSave\(\{ data: \{ id, title, body_md: body, status: "approved" \} \}\)/,
    );
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
