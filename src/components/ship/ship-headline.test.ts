import { describe, it, expect } from "bun:test";
import { shipHeadline } from "./ship-headline";

describe("what the ship station says at the top", () => {
  it("does not call a draft nothing", () => {
    /*
     * THE SCREEN THAT PROMPTED THIS. Headline said "Nothing is waiting to go
     * out." while the gate eight lines below said "Batch firmware push
     * scheduler is still a draft" with a Send for approval button. Something
     * plainly was waiting, and it was waiting on the person reading.
     */
    expect(shipHeadline({ pending: 0, drafts: 1 })).toBe("One announcement is waiting on you.");
    expect(shipHeadline({ pending: 0, drafts: 3 })).toBe("3 announcements are waiting on you.");
  });

  it("keeps the two waits apart, because only one of them is yours", () => {
    // "Waiting on an approver" and "waiting on you" are different jobs, and
    // merging them into one count would hide the one a reader can act on.
    expect(shipHeadline({ pending: 1, drafts: 0 })).toBe(
      "One announcement is waiting to go out.",
    );
    expect(shipHeadline({ pending: 2, drafts: 5 })).toBe(
      "2 announcements are waiting to go out.",
    );
  });

  it("still says nothing is waiting when nothing is", () => {
    expect(shipHeadline({ pending: 0, drafts: 0 })).toBe("Nothing is waiting to go out.");
  });

  it("says nothing at all while the counts are unknown", () => {
    // A heading that cannot know its count must not guess zero: zero is a claim,
    // and this station's whole job is reporting what needs a person.
    expect(shipHeadline(null)).toBeNull();
    expect(shipHeadline(undefined)).toBeNull();
  });
});
