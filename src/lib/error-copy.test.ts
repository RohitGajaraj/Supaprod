import { describe, expect, it, test } from "bun:test";

import { failureLine, messageForPerson, sessionEndedMessage } from "./error-copy";

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
    expect(
      messageForPerson(new Error("Track a30238f5-767b-4a2b-854d-3624f714f068 was not found.")),
    ).toBeNull();
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
    // This used to assert the ended-session case and no longer can: that string
    // now has a BETTER answer than the surface's own sentence alone, which is
    // the whole of S3's correction. The property it was written to protect is
    // unchanged, so it is asserted here with a failure nothing can improve on.
    expect(
      failureLine(
        own,
        new Error('null value in column "to_agent_slug" violates not-null constraint'),
      ),
    ).toBe(own);
    expect(
      failureLine(own, new Error("That step is ahead of this work, and undo only goes back.")),
    ).toBe("Nothing moved. That step is ahead of this work, and undo only goes back.");
    expect(failureLine(own, null)).toBe(own);
  });

  it("carries no em dash of its own", () => {
    expect(failureLine("Nothing moved.", new Error("x"))).not.toMatch(/[—–]/);
  });
});

/*
 * THE ENDED SESSION, which S3 found and I had wrong.
 *
 * `messageForPerson` rejects "Unauthorized: Invalid token" correctly and then
 * leaves the reader with only the surface's own sentence. That is right about
 * the string and wrong about the moment: this is the one failure on the list
 * the reader can fix in a single action, and no other part of the screen is
 * going to tell them so.
 */
test("an ended session says what to do about it, where silence used to be", () => {
  // The exact string S4 read on /learn.
  expect(sessionEndedMessage(new Error("Unauthorized: Invalid token"))).toBe(
    "Your session ended. Sign in again and this will load.",
  );
  expect(sessionEndedMessage(new Error("jwt expired"))).not.toBeNull();
  expect(sessionEndedMessage(new Error("Auth session missing!"))).not.toBeNull();
});

test("it does not claim an ended session over an unrelated failure", () => {
  expect(sessionEndedMessage(new Error("That step is ahead of this work."))).toBeNull();
  expect(sessionEndedMessage(new Error("Failed to fetch"))).toBeNull();
  expect(sessionEndedMessage(new Error(""))).toBeNull();
  // "unauthorized" anchored at the start only: a sentence ABOUT authorisation
  // is not the auth layer refusing, and must not be answered with sign in.
  expect(sessionEndedMessage(new Error("The reviewer is unauthorized for this repo."))).toBeNull();
});

test("failureLine puts the action a reader can take ahead of everything else", () => {
  // Before this, the whole line was just the surface's own sentence.
  expect(failureLine("This is still waiting for you.", new Error("Unauthorized"))).toBe(
    "This is still waiting for you. Your session ended. Sign in again and this will load.",
  );
  // A real server sentence still wins when the session is fine.
  expect(
    failureLine(
      "Nothing moved.",
      new Error("That step is ahead of this work, and undo only goes back."),
    ),
  ).toBe("Nothing moved. That step is ahead of this work, and undo only goes back.");
});

/*
 * THINGS THAT LOOK LIKE PROSE AND ARE NOT, all three found by S2 while adopting
 * this helper across their prefix, and every one of them passed the original
 * shape test: enough words, no identifier, ending in a full stop. That is the
 * value of a second reader on a rule whose whole job is judgment.
 */
test("a stack frame does not reach a person by ending in a full stop", () => {
  expect(
    messageForPerson(
      "The upstream service returned an unexpected response at handler (src/lib/x.ts:214).",
    ),
  ).toBeNull();
  expect(messageForPerson("It broke at renderRow (TrackRun.tsx:812).")).toBeNull();
});

test("a body is not a sentence, whatever it ends with", () => {
  expect(messageForPerson('{"detail":"' + "x".repeat(300) + '"}. It ended in a stop.')).toBeNull();
  expect(messageForPerson("[1, 2, 3] and then some words about it.")).toBeNull();
  // The cap alone, with nothing else machine-shaped about it.
  expect(
    messageForPerson("A perfectly ordinary sentence. " + "Repeated over and over. ".repeat(12)),
  ).toBeNull();
});

test("an address leaks nothing, with or without a scheme", () => {
  expect(
    messageForPerson("Failed to reach https://api.example.com/v1/thing gateway timeout."),
  ).toBeNull();
  // The half "http" misses, which is why the scheme test is not enough.
  expect(messageForPerson("The call to api.example.com never came back at all.")).toBeNull();
});

test("and the good sentences all still survive it", () => {
  // The regression this whole family risks: a rule that hides real copy is a
  // worse failure than one that shows a log line, because nobody notices.
  for (const good of [
    "That step is ahead of this work, and undo only goes back.",
    "This work is closed, so there is no station to hand back to.",
    "Somebody has to choose between the two before this can move.",
    "That step is ahead of this work. Undo only goes back, so there is nothing behind it to return to.",
  ]) {
    expect(messageForPerson(good)).toBe(good);
  }
});

test("a thrown object is read the same as a thrown Error", () => {
  // What a fetch rejection and several server helpers actually throw. S3's
  // original handled it; merging their work into this file dropped it, and S2
  // caught the regression while wrapping their own helper over this one.
  expect(sessionEndedMessage({ message: "Unauthorized: Invalid token" })).toBe(
    "Your session ended. Sign in again and this will load.",
  );
  expect(
    messageForPerson({ message: "That step is ahead of this work, and undo only goes back." }),
  ).toBe("That step is ahead of this work, and undo only goes back.");
  // And the shapes that carry no message stay silent rather than throwing.
  expect(messageForPerson(null)).toBeNull();
  expect(messageForPerson(undefined)).toBeNull();
  expect(messageForPerson({ message: 42 })).toBeNull();
  expect(messageForPerson({})).toBeNull();
});
