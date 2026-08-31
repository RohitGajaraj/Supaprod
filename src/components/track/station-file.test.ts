import { describe, it, expect } from "bun:test";
import {
  bodyOf,
  fileNameFor,
  stationFile,
  tookItLine,
  type FiledItem,
  type StationFileInput,
} from "./station-file";

const item = (over: Partial<FiledItem> = {}): FiledItem => ({
  kind: "prd",
  word: "spec",
  title: "Skip the address re-confirm when nothing changed",
  missing: false,
  fields: { body_md: "We stop asking for the address a second time when it has not changed." },
  ...over,
});

const input = (over: Partial<StationFileInput> = {}): StationFileInput => ({
  trackTitle: "Checkout and notification friction in the homeowner app",
  stationLabel: "Plan",
  expects: "spec",
  gap: null,
  waivedReason: null,
  items: [item()],
  url: "https://supaprod.ai/track/425e6887",
  ...over,
});

describe("which column carries the substance", () => {
  it("takes the longest readable one, because the kinds do not share a shape", () => {
    /*
     * A spec's substance is `body_md`, a theme's is `summary`, a task's is
     * `detail`. A row can carry two with one of them a stub, so first-wins
     * would hand over the stub for whichever kind happened to be listed first.
     */
    const two = item({
      fields: { summary: "Short.", body_md: "A much longer body that matters." },
    });
    expect(bodyOf(two)).toBe("A much longer body that matters.");
  });

  it("treats blank and non-string as absent", () => {
    expect(bodyOf(item({ fields: { body_md: "   " } }))).toBeNull();
    expect(bodyOf(item({ fields: { body_md: 42 } }))).toBeNull();
    expect(bodyOf(item({ fields: {} }))).toBeNull();
  });
});

describe("the name it lands under", () => {
  it("leads with the station, because three files about one run differ only by it", () => {
    expect(fileNameFor("Checkout and notification friction", "Plan")).toBe(
      "plan-checkout-and-notification-friction.md",
    );
  });

  it("is ASCII and never ends in a dash", () => {
    // It lands in a Downloads folder and then usually in a repo.
    const n = fileNameFor("Café — 100% checkout ✅", "Ship");
    expect(n).toMatch(/^[a-z0-9.-]+$/);
    expect(n).not.toMatch(/-\.md$/);
  });

  it("still produces a name when the title is unusable", () => {
    expect(fileNameFor("", "Design")).toBe("design.md");
    expect(fileNameFor("✅✅", "")).toBe("station.md");
  });
});

describe("the file itself", () => {
  it("leads with the station and the work, and ends with the one address", () => {
    const out = stationFile(input());
    expect(out.split("\n")[0]).toBe(
      "# Plan: Checkout and notification friction in the homeowner app",
    );
    expect(out.trimEnd().endsWith("The whole run: https://supaprod.ai/track/425e6887")).toBe(true);
  });

  it("carries the body rather than a JSON dump", () => {
    const out = stationFile(input());
    expect(out).toContain("We stop asking for the address a second time when it has not changed.");
    expect(out).not.toContain("body_md");
    expect(out).not.toContain("{");
  });

  it("STILL PRODUCES A FILE when the station filed nothing, and says so", () => {
    /*
     * The tempting version disables the control on an empty station. §2.1's
     * rule is the argument against it -- an empty list is a defect, not a clean
     * bill -- and 81 of 106 tracks are sitting at Discover having filed
     * nothing. Somebody wanting to send "this produced nothing and here is what
     * it was for" is exactly who this is for, and a control that vanishes takes
     * the evidence of the gap with it.
     */
    const out = stationFile(input({ items: [], expects: "spec" }));
    expect(out).toContain("This station has filed nothing. It is where the spec is written.");
    expect(out).toContain("The whole run:");
  });

  it("carries the gap sentence when the chain has one", () => {
    const out = stationFile(
      input({ items: [], gap: "Nothing can land here until a source is connected." }),
    );
    expect(out).toContain("Nothing can land here until a source is connected.");
  });

  it("names a waived station rather than rendering it as empty", () => {
    // A station taken off the route on purpose is not the same fact as one that
    // failed to produce, and the file must not flatten them together.
    const out = stationFile(input({ items: [], waivedReason: "We already know the answer." }));
    expect(out).toContain("This station was taken off the route.");
    expect(out).toContain("We already know the answer.");
  });

  it("DEDUPES, and reports the repeat rather than dropping it silently", () => {
    /*
     * FOUND BY DRIVING IT. On track 425e6887 the Discover file came out at 26KB
     * with the same evidence printed three times, because this composed one
     * section per member and Discover holds many duplicate signals.
     * `summaryText` had already solved it for the clipboard half and said so in
     * its own header; this file repeated the mistake it was written beside.
     *
     * How many times a station filed the same thing is a FACT about the run, so
     * a repeat is counted rather than hidden.
     */
    const dup = item({ title: null, fields: { content: "Users muted alerts in week two." } });
    const out = stationFile(input({ items: [dup, dup, dup] }));
    expect(out.match(/Users muted alerts in week two\./g)?.length).toBe(1);
    expect(out).toContain("(filed 3 times)");
  });

  it("keeps two things apart when they share a body but not a name", () => {
    // Keyed on title AND body: same evidence promoted under two different
    // names is two things, and collapsing them would lose one.
    const a = item({ title: "Alert overload", fields: { summary: "Same body." } });
    const b = item({ title: "Notification fatigue", fields: { summary: "Same body." } });
    const out = stationFile(input({ items: [a, b] }));
    expect(out).toContain("## Alert overload");
    expect(out).toContain("## Notification fatigue");
  });

  it("gives untitled evidence ONE list rather than a heading each", () => {
    /*
     * A signal carries no title, so heading each with its kind produced nine
     * consecutive sections all reading "## finding" and nothing to scan by.
     * Something with a name is a thing you look up; something without one is
     * evidence you read in a run.
     */
    const out = stationFile(
      input({
        items: [
          item({ title: null, word: "finding", fields: { content: "First thing." } }),
          item({ title: null, word: "finding", fields: { content: "Second thing." } }),
          item({ title: "A named pattern", fields: { summary: "Its body." } }),
        ],
      }),
    );
    expect(out.match(/^## /gm)?.length).toBe(2);
    expect(out).toContain("## A named pattern");
    expect(out).toContain("## What this step filed");
    expect(out).toContain("- First thing.");
    expect(out).toContain("- Second thing.");
    expect(out).not.toContain("## finding");
  });

  it("does not head a section with a whole sentence", () => {
    /*
     * FOUND BY DRIVING IT, second pass. Some signal rows carry their content in
     * `title`, and one section of the real file came out headed with a whole
     * customer quote. So the titled/untitled split is about whether the string
     * reads as a NAME, not about whether the column is populated.
     */
    const quote =
      "Good product. I turned off all the alerts in week two because there were several a day. Now I only open it when I remember to.";
    const out = stationFile(input({ items: [item({ title: quote, fields: {} })] }));
    expect(out).not.toContain(`## ${quote}`);
    expect(out).toContain("## What this step filed");
    // Not dropped either: with no body, the over-long title IS the evidence.
    expect(out).toContain(`- ${quote}`);
  });

  it("still heads a section with a real name", () => {
    const out = stationFile(input({ items: [item({ title: "Alert Overload Leads to Muting" })] }));
    expect(out).toContain("## Alert Overload Leads to Muting");
  });

  it("names a member the lookup missed instead of quietly dropping it", () => {
    /*
     * `missing` means the row was LOOKED FOR and was not there, which is not
     * the same as never having existed. The chain keeps those as titles; a file
     * that omitted them would be a cleaner-looking lie than the screen.
     */
    const out = stationFile(
      input({ items: [item(), item({ missing: true, title: "An older draft" })] }),
    );
    expect(out).toContain("Looked for and not found");
    expect(out).toContain("An older draft");
    // And the present one is still a section of its own, not swept into the list.
    expect(out).toContain("## Skip the address re-confirm when nothing changed");
  });

  it("says when a row has a name and nothing else", () => {
    const out = stationFile(input({ items: [item({ fields: {} })] }));
    expect(out).toContain("No detail was recorded beyond the spec's name.");
  });

  it("never leaves a run of blank lines", () => {
    const out = stationFile(input({ items: [item(), item({ fields: {} })] }));
    expect(out).not.toMatch(/\n{3,}/);
  });
});

describe("what the control says after it acts", () => {
  it("counts what it carried, because a silent download cannot be told from a broken one", () => {
    expect(tookItLine("plan-x.md", 0)).toBe("Saved plan-x.md. It says this step filed nothing.");
    expect(tookItLine("plan-x.md", 1)).toBe(
      "Saved plan-x.md. It carries the one thing this step filed.",
    );
    expect(tookItLine("plan-x.md", 3)).toBe(
      "Saved plan-x.md. It carries the 3 things this step filed.",
    );
  });
});
