/**
 * Credits folded into Billing, and the fold must not have buried the pane.
 *
 * WHY THIS FILE EXISTS. Folding an address is one line: `credits` gets
 * `foldsInto: "billing"` and `paneForSection` resolves both to `billing`. The
 * danger is entirely in what that does to the ROUTE. The settings route rendered
 * the two panes off two mutually exclusive branches:
 *
 *   {active === "billing" && <PlanSection />}
 *   {active === "credits" && <CreditsSection />}
 *
 * After the fold nothing can ever set `active` to "credits", so the second branch
 * is dead. Deleting it and stopping there would have removed the entire credits
 * surface -- the balance, the top-up, the debit history -- while every existing
 * test stayed green, because no test asserted that CreditsSection is reachable.
 * That is this repo's most common defect by its own count: a capability built
 * correctly and reachable from nowhere.
 *
 * So the fold is only safe if the billing pane MOUNTS the credits section, and
 * that is what this pins.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { NAV_DOOR_IDS, paneForSection, sectionLabel } from "@/lib/settings-sections";
import { stripComments } from "@/__tests__/meridian-ratchet-scan";

const route = readFileSync(new URL("../_authenticated.settings.tsx", import.meta.url), "utf8");

/**
 * The route with its comments removed, for any assertion about ABSENCE.
 *
 * The first draft of the dead-branch test below failed against the very comment
 * that explains why the branch was removed: the paragraph quotes
 * `active === "credits"` to say it can no longer occur. Asserting on raw source is
 * how a guard ends up satisfied, or defeated, by prose. Same lesson the ratchet
 * learned, so the same helper does the work rather than a second copy of it.
 */
const shipping = stripComments(route);

/**
 * `expect(route).toContain(...)` prints the WHOLE 87KB file on failure, which
 * buries the one line that matters. Booleans with a sentence instead.
 */
const ships = (needle: string) => shipping.includes(needle);

describe("both money addresses answer, and one pane serves them", () => {
  it("resolves credits to the billing pane", () => {
    expect(paneForSection("credits")).toBe("billing");
    expect(paneForSection("billing")).toBe("billing");
  });

  it("draws one money door, not two", () => {
    expect(NAV_DOOR_IDS).toContain("billing");
    expect(NAV_DOOR_IDS).not.toContain("credits");
  });

  it("calls that door Billing, never Plan, because the spine already owns Plan", () => {
    /*
     * THE COLLISION THIS RENAME FIXES. The spine's third station is Plan, at /plan,
     * where specs are written. This door meant the subscription tier. Two unrelated
     * things, one word, both reachable from the same shell.
     */
    expect(sectionLabel("billing")).toBe("Billing");
    for (const id of NAV_DOOR_IDS) {
      expect(sectionLabel(id), `${id} is labelled Plan, which is a station`).not.toBe("Plan");
    }
  });
});

describe("the credits surface is still reachable", () => {
  it("mounts CreditsSection inside the billing branch", () => {
    // The assertion that would have caught the whole surface disappearing.
    const from = shipping.indexOf('active === "billing"');
    const to = shipping.indexOf('active === "health"');
    expect(from, "the billing branch is gone").toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    const branch = shipping.slice(from, to);
    expect(branch.includes("<PlanSection"), "PlanSection is not on the billing pane").toBe(true);
    expect(
      branch.includes("<CreditsSection"),
      "CreditsSection is unreachable: the fold buried the whole credits surface",
    ).toBe(true);
  });

  it("has no dead branch waiting for an active value that can never occur", () => {
    // `active` is the RESOLVED pane, so a branch keyed on a folded id is unreachable
    // by construction. Leaving one is how a reader concludes the surface is wired.
    expect(ships('active === "credits"'), "a branch keyed on a folded id can never run").toBe(
      false,
    );
    expect(ships('active === "sync"')).toBe(false);
  });
});

describe("the cross-link inside the pane goes somewhere", () => {
  it("scrolls to the credits block rather than navigating to a folded address", () => {
    /*
     * "Buy a credit top-up" used to navigate to `?section=credits`. That address now
     * renders the pane the button is already on, so the click would have looked like
     * it did nothing -- the worst kind of broken control, because the reader blames
     * themselves and stops trusting the others on the page.
     */
    expect(ships('navigate({ search: { section: "credits" } })')).toBe(false);
    expect(ships("CREDITS_ANCHOR")).toBe(true);
  });

  it("spells the anchor once, so the button and its target cannot drift apart", () => {
    // A literal in two places makes a typo in either silently do nothing, which is
    // exactly the failure the fold was meant to remove.
    expect(ships("const CREDITS_ANCHOR ="), "the anchor id is not declared once").toBe(true);
    expect(ships("id={CREDITS_ANCHOR}"), "nothing carries the anchor id").toBe(true);
    expect(ships("getElementById(CREDITS_ANCHOR)"), "the button targets a literal").toBe(true);
  });
});
