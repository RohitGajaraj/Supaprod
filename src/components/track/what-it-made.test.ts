/**
 * THE PRODUCT FIRST, IN THE STATION'S OWN NOUN, THEN THE REST QUIETER.
 *
 * Seen live 2026-09-08 on a run whose Ship station had gone to production:
 * "Ship filed 4 prototypes, 1 decision and 1 release. 4 of them say the same
 * thing." Ship filed no prototypes; they were attached. And four rows with one
 * title are one thing filed four times, not a confession.
 */
import { describe, expect, it } from "bun:test";

import { whatItMade, type MadeMember } from "./what-it-made";

const TITLE = "Relay Checkout Tablet - Address Confirmation Screen (read-only)";

const m = (
  kind: string,
  title: string | null = null,
  fields: Record<string, unknown> = {},
  createdAt?: string,
  missing = false,
): MadeMember => ({ kind, title, fields, createdAt, missing });

describe("Ship says where it released to, and only what was attached after", () => {
  it("the live case: the release leads and the context follows, fainter", () => {
    const out = whatItMade({
      station: "ship",
      label: "Ship",
      members: [
        m("prototype", TITLE, {}, "2026-09-08T11:41:47Z"),
        m("prototype", TITLE, {}, "2026-09-08T12:20:33Z"),
        m("prototype", TITLE, {}, "2026-09-08T12:21:16Z"),
        m("prototype", TITLE, {}, "2026-09-08T12:21:16Z"),
        m("decision", "Address confirmation is worth a release", {}, "2026-09-08T12:30:00Z"),
        m(
          "deployment",
          "v1.4.2",
          { status: "success", environment: "production" },
          "2026-09-08T12:40:00Z",
        ),
      ],
    });
    expect(out?.lead).toBe("Released to production.");
    expect(out?.quiet).toBe(`Alongside, 4 drawings of ${TITLE} and 1 decision.`);
  });

  it("never says the confession, and never counts the context as Ship's filing", () => {
    const out = whatItMade({
      station: "ship",
      label: "Ship",
      members: [
        m("prototype", TITLE),
        m("prototype", TITLE),
        m("deployment", null, { status: "success", environment: "production" }),
      ],
    });
    const whole = `${out?.lead} ${out?.quiet ?? ""}`;
    expect(whole).not.toContain("say the same thing");
    expect(whole).not.toContain("Ship filed");
    expect(out?.lead.startsWith("Released")).toBe(true);
  });

  it("claims only what the provider reported, in release-words' own distinction", () => {
    const at = (status: string, environment = "production") =>
      whatItMade({
        station: "ship",
        label: "Ship",
        members: [m("deployment", null, { status, environment })],
      })?.lead;
    expect(at("success")).toBe("Released to production.");
    // A pasted address is not a release that was checked.
    expect(at("claimed", "preview")).toBe("Said to have been released to preview.");
    expect(at("failure")).toBe("The release to production did not go out.");
    expect(at("building")).toBe("Going out to production.");
  });

  it("counts rather than claims while the artifacts read has not landed", () => {
    // Chain members carry no fields. "1 release." claims nothing it cannot show,
    // and the line becomes "Released to production." a poll later.
    const out = whatItMade({
      station: "ship",
      label: "Ship",
      members: [{ kind: "deployment", missing: false, title: null }],
    });
    expect(out?.lead).toBe("1 release.");
    expect(out?.quiet).toBeNull();
  });

  it("leads with the newest release and counts the earlier ones quietly", () => {
    const out = whatItMade({
      station: "ship",
      label: "Ship",
      members: [
        m(
          "deployment",
          null,
          { status: "failure", environment: "preview" },
          "2026-09-08T10:00:00Z",
        ),
        m(
          "deployment",
          null,
          { status: "success", environment: "production" },
          "2026-09-08T11:00:00Z",
        ),
      ],
    });
    expect(out?.lead).toBe("Released to production.");
    expect(out?.quiet).toBe("1 earlier release.");
  });
});

describe("Build says which pull request it opened", () => {
  it("names the PR", () => {
    const out = whatItMade({
      station: "build",
      label: "Build",
      members: [m("changeset", "Confirm the address before checkout", { pr_number: 5 })],
    });
    expect(out?.lead).toBe("Opened PR #5.");
  });

  it("names every PR in filing order, and the mission alongside", () => {
    const out = whatItMade({
      station: "build",
      label: "Build",
      members: [
        m("mission", "Build the address screen"),
        m("changeset", "First cut", { pr_number: "3" }),
        m("changeset", "Second cut", { pr_number: 5 }),
      ],
    });
    expect(out?.lead).toBe("Opened PR #3 and PR #5.");
    expect(out?.quiet).toBe("Alongside, 1 run.");
  });

  it("counts a change with no pull request rather than inventing one", () => {
    expect(
      whatItMade({ station: "build", label: "Build", members: [m("changeset", "Staged")] })?.lead,
    ).toBe("1 code change.");
    const mixed = whatItMade({
      station: "build",
      label: "Build",
      members: [m("changeset", "Staged"), m("changeset", "Opened", { pr_number: 7 })],
    });
    expect(mixed?.lead).toBe("Opened PR #7.");
    expect(mixed?.quiet).toBe("1 more code change without a pull request.");
  });
});

describe("Design counts its drawings, folding what repeats", () => {
  it("a plain count when every drawing is its own thing", () => {
    const out = whatItMade({
      station: "design",
      label: "Design",
      members: Array.from({ length: 8 }, (_, i) => m("prototype", `Screen ${i + 1}`)),
    });
    expect(out?.lead).toBe("8 drawings.");
    expect(out?.quiet).toBeNull();
  });

  it("one thing drawn four times is four drawings of that thing", () => {
    const out = whatItMade({
      station: "design",
      label: "Design",
      members: [
        m("prototype", TITLE),
        m("prototype", TITLE),
        m("prototype", TITLE),
        m("prototype", TITLE),
      ],
    });
    expect(out?.lead).toBe(`4 drawings of ${TITLE}.`);
  });

  it("names each thing drawn more than once, ce846e9b's shape", () => {
    const out = whatItMade({
      station: "design",
      label: "Design",
      members: [
        ...Array.from({ length: 4 }, () => m("prototype", "OTA Firmware Reboot Status Tile")),
        ...Array.from({ length: 4 }, () => m("prototype", "Tile Differentiation")),
        m("prototype", "Settings sheet"),
        m("prototype", "Onboarding"),
      ],
    });
    expect(out?.lead).toBe(
      "10 drawings (4 of OTA Firmware Reboot Status Tile and 4 of Tile Differentiation).",
    );
  });
});

describe("the other stations", () => {
  it("Decide folds the call it re-made, d2263583's shape", () => {
    const out = whatItMade({
      station: "decide",
      label: "Decide",
      members: [
        m("decision", "Tablet address layout contributes to abandonment"),
        ...Array.from({ length: 4 }, () =>
          m("decision", "Do not attribute tablet checkout abandonment to address"),
        ),
      ],
    });
    expect(out?.lead).toBe(
      "5 decisions (4 on Do not attribute tablet checkout abandonment to address).",
    );
    expect(out?.lead).not.toContain("say the same thing");
  });

  it("Plan says the spec, with the breakdown alongside", () => {
    const out = whatItMade({
      station: "define",
      label: "Plan",
      members: [m("prd", "Cut the sign-up form"), ...Array.from({ length: 6 }, () => m("task"))],
    });
    expect(out?.lead).toBe("1 spec.");
    expect(out?.quiet).toBe("Alongside, 6 tasks.");
  });

  it("Discover says what it found and its clusters, both its own", () => {
    const out = whatItMade({
      station: "sense",
      label: "Discover",
      members: [...Array.from({ length: 12 }, () => m("signal")), m("theme", "A"), m("theme", "B")],
    });
    expect(out?.lead).toBe("Found 12 things.");
    expect(out?.quiet).toBe("2 clusters.");
    expect(whatItMade({ station: "sense", label: "Discover", members: [m("signal")] })?.lead).toBe(
      "Found 1 thing.",
    );
  });

  it("Learn counts its learnings", () => {
    expect(
      whatItMade({ station: "learn", label: "Learn", members: [m("learning", "Graded")] })?.lead,
    ).toBe("1 learning.");
  });
});

describe("the absences", () => {
  it("says no product rather than counting the context as one", () => {
    const out = whatItMade({
      station: "ship",
      label: "Ship",
      members: [m("prototype", TITLE), m("decision", "Go")],
    });
    expect(out?.lead).toBe("No release from Ship.");
    // One drawing is not a fold, so its title is not named here: the row
    // beneath carries it.
    expect(out?.quiet).toBe("Alongside, 1 drawing and 1 decision.");
  });

  it("says yet while a seat is working the stop", () => {
    expect(
      whatItMade({ station: "build", label: "Build", members: [m("mission")], running: true })
        ?.lead,
    ).toBe("No code change from Build yet.");
    expect(
      whatItMade({ station: "sense", label: "Discover", members: [m("decision")], running: true })
        ?.lead,
    ).toBe("Found nothing yet.");
  });

  it("says a member the lookup missed rather than subtracting it", () => {
    const one = whatItMade({
      station: "ship",
      label: "Ship",
      members: [
        m("deployment", null, { status: "success" }),
        m("deployment", null, {}, undefined, true),
      ],
    });
    expect(one?.lead).toBe("Released.");
    expect(one?.quiet).toBe("One more no longer resolves to anything we can show.");
    const two = whatItMade({
      station: "design",
      label: "Design",
      members: [
        m("prototype", "A"),
        m("prototype", "B", {}, undefined, true),
        m("prototype", "C", {}, undefined, true),
      ],
    });
    expect(two?.quiet).toBe("2 more no longer resolve to anything we can show.");
  });

  it("stays silent when nothing present resolves, because the panel owns that case", () => {
    expect(whatItMade({ station: "define", label: "Plan", members: [] })).toBeNull();
    expect(
      whatItMade({
        station: "define",
        label: "Plan",
        members: [m("prd", "A", {}, undefined, true)],
      }),
    ).toBeNull();
  });
});
