import { describe, expect, it } from "bun:test";

import { failureLine, messageForPerson } from "./error-copy";

describe("what a person may read when something fails", () => {
  it("keeps the sentences this product's own server functions write", () => {
    /*
     * These are real returns from rewindTrackTo and submitStationByHand. They
     * are the best failure copy on the surface and they arrive through the same
     * channel as the junk, which is why a rule that stripped every message
     * would leave a person with less than they have now.
     */
    for (const good of [
      "That step is ahead of this work, and undo only goes back.",
      "This work is closed, so there is no station to hand back to.",
      "Paste the link to the pull request or the deploy.",
      "That is a repository link, not a pull request. Paste the link to the PR itself.",
    ]) {
      expect(messageForPerson(new Error(good))).toBe(good);
    }
  });

  it("refuses the transport strings that were reaching the screen", () => {
    // The first is the one seen on /learn by a person, verbatim.
    for (const junk of [
      "Unauthorized: Invalid token",
      "Failed to fetch",
      'null value in column "to_agent_slug" of relation "agent_messages" violates not-null constraint',
      "NetworkError when attempting to fetch resource.",
      "TypeError: Cannot read properties of undefined",
      "HTTP 503",
    ]) {
      expect(messageForPerson(new Error(junk))).toBeNull();
    }
  });

  it("refuses anything carrying an identifier a person cannot use", () => {
    expect(messageForPerson(new Error("Track a30238f5-767b-4a2b-854d-3624f714f068 was not found."))).toBeNull();
    expect(messageForPerson(new Error("The column forecast_claim is immutable here."))).toBeNull();
  });

  it("stays silent rather than guessing", () => {
    // Conservative on purpose: hiding one good sentence costs a line; showing
    // one bad one makes the product look broken and leaks its internals.
    expect(messageForPerson(new Error("nope"))).toBeNull();
    expect(messageForPerson(new Error("Something went wrong"))).toBeNull();
    expect(messageForPerson(null)).toBeNull();
    expect(messageForPerson(undefined)).toBeNull();
    expect(messageForPerson("")).toBeNull();
  });

  it("always says something, because silence is the defect being fixed", () => {
    const own = "Nothing moved.";
    expect(failureLine(own, new Error("Unauthorized: Invalid token"))).toBe(own);
    expect(failureLine(own, new Error("That step is ahead of this work, and undo only goes back."))).toBe(
      "Nothing moved. That step is ahead of this work, and undo only goes back.",
    );
    expect(failureLine(own, null)).toBe(own);
  });

  it("carries no em dash of its own", () => {
    expect(failureLine("Nothing moved.", new Error("x"))).not.toMatch(/[—–]/);
  });
});
