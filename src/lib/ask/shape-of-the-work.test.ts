/**
 * THE SENTENCES BELOW ARE THE ONES THE PRODUCT ACTUALLY GETS.
 *
 * Every "real" fixture is a track title from production (Helio Labs and the
 * probe workspace, read 2026-09-09): these are the shapes people and agents
 * really write, so the word lists are scored against them rather than against
 * sentences written to agree with the lists.
 *
 * THE DEFECT THIS GUARDS: `AskPane` passed `shape: "new-capability"` as a
 * literal, and that is the one shape that waives nothing, so every sentence
 * typed into Ask walked all seven stations. The most important assertion in
 * this file is therefore the LAST one: an ordinary sentence must not come back
 * `new-capability`.
 */
import { describe, it, expect } from "bun:test";

import { shapeOfTheWork } from "@/lib/ask/shape-of-the-work";
import { suggestRoute } from "@/lib/spine/route";

describe("the shape of a typed sentence", () => {
  it("calls a break a break, and puts it ahead of the interface it names", () => {
    // The sentence from the finding. It names a button AND a break; the break
    // decides the route, which is why INCIDENT is tested first.
    expect(shapeOfTheWork("fix the broken login button")).toBe("incident-fix");
    expect(shapeOfTheWork("checkout is down for everyone on Safari")).toBe("incident-fix");
    expect(shapeOfTheWork("the reset password link 404s")).toBe("incident-fix");
    expect(shapeOfTheWork("homeowners cannot log in after the update")).toBe("incident-fix");
  });

  it("recognises the machine room", () => {
    expect(shapeOfTheWork("refactor the checkout funnel module")).toBe("under-the-hood");
    expect(shapeOfTheWork("migrate the address table to the new schema")).toBe("under-the-hood");
    expect(shapeOfTheWork("the saved address query is slow")).toBe("under-the-hood");
  });

  it("never derives interface-change, because that shape waives the forecast", () => {
    /*
     * THE ASSERTION THAT KILLED THE FIRST VERSION OF THIS MODULE. It had a word
     * list for `interface-change` and these two production titles scored it: the
     * first came back interface-change on the word "page", the second came back
     * existing-feature because it used none of the listed nouns. Too eager and
     * too blind on one run.
     *
     * That would be a tolerable classifier for a shape that only costs
     * stations. `interface-change` waives DECIDE, which is where the forecast is
     * captured, so a false positive costs the moat silently. No word list gets
     * to make that trade; the home's picker, where a person says it out loud,
     * still can.
     */
    for (const real of [
      "Make OTA notifications visually distinct.",
      "Show the installer's name and photo on the order page before the visit",
      "redesign the empty state on Findings",
      "change the button colour on checkout",
    ]) {
      expect(shapeOfTheWork(real)).not.toBe("interface-change");
    }
  });

  it("calls something new only when the sentence says it is new", () => {
    expect(shapeOfTheWork("we don't have a way to export the ledger")).toBe("new-capability");
    expect(shapeOfTheWork("there is no audit log at all")).toBe("new-capability");
    expect(shapeOfTheWork("introduce a new integration with Stripe")).toBe("new-capability");
  });

  it("does NOT call an addition to an existing thing new work", () => {
    /*
     * THE HEART OF THE FINDING. Every one of these is a change to a product
     * that already runs, and every one of them was being routed as greenfield
     * and walked through Discover, Decide, Plan and Design. Two are real
     * production track titles.
     */
    expect(shapeOfTheWork("Add a saved-payment-methods option to checkout")).toBe(
      "existing-feature",
    );
    expect(
      shapeOfTheWork("Let a homeowner reschedule an installer visit from the order page"),
    ).toBe("existing-feature");
    expect(shapeOfTheWork("Cut the sign-up form from nine fields to four")).toBe(
      "existing-feature",
    );
  });

  it("returns a shape for an empty draft rather than nothing", () => {
    // The hint line renders on every keystroke and cannot say "no shape yet".
    expect(shapeOfTheWork("")).toBe("existing-feature");
    expect(shapeOfTheWork("   ")).toBe("existing-feature");
  });
});

describe("what the shape costs, which is the reason this file exists", () => {
  it("no longer sends an ordinary sentence down all seven stations", () => {
    /*
     * ASSERTED THROUGH `suggestRoute` RATHER THAN AGAINST A SHAPE NAME, so this
     * still holds if the route model changes which stations a shape waives. The
     * claim is about what actually runs, not about a label.
     */
    const ordinary = shapeOfTheWork("Add a saved-payment-methods option to checkout");
    const route = suggestRoute(ordinary);
    expect(route.path.length).toBeLessThan(suggestRoute("new-capability").path.length);
    expect(route.entry).not.toBe("sense");
  });

  it("still captures the forecast, which is the thing that must not be waived", () => {
    // `existing-feature` enters at Decide on purpose (REQ-2): a route that
    // waives Decide structurally cannot capture the forecast. If the default
    // ever moves to a shape that waives it, this fails.
    const route = suggestRoute(shapeOfTheWork("Add a saved-payment-methods option to checkout"));
    expect(route.waived.map((w) => w.station)).not.toContain("decide");
    expect(route.path).toContain("decide");
  });

  it("sends a real break straight to the work", () => {
    const route = suggestRoute(shapeOfTheWork("fix the broken login button"));
    expect(route.path.length).toBeLessThan(suggestRoute("new-capability").path.length);
  });
});
