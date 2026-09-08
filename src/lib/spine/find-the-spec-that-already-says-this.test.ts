import { describe, test, expect } from "bun:test";
import {
  comparableTitle,
  sameProblem,
  stoppedApplying,
  findTheSpecThatAlreadySaysThis,
  whatDefineDidInstead,
  type ExistingSpec,
} from "./find-the-spec-that-already-says-this";

/** Titles taken verbatim from Helio's drafts, measured 2026-09-04. */
const INSTALLERS =
  "Installers working panel and inverter basements lose cell signal and the app stops syncing";
const INSTALLERS_TWIN =
  "Installers working panel and inverter basements lose cell signal, and the app stops syncing";
const ADDRESS =
  "Remove the redundant address re-confirmation step in Relay checkout to increase tablet checkout completion rate from 67 percent";
const OTA_A = "Differentiate the red status tile shown after an over-the-air firmware failure";
const OTA_B = "Differentiate the red tile shown after an over-the-air firmware failure";
/** A DIFFERENT Relay problem in the same workspace. Must never match. */
const NOTIFICATIONS = "Homeowners are muting Relay notifications because too many are low value";
const CHECKOUT_ABANDON =
  "Homeowners abandon Relay checkout on the address screen because it asks again";

function spec(over: Partial<ExistingSpec> & { id: string; title: string }): ExistingSpec {
  return { status: "draft", ...over };
}

describe("comparableTitle", () => {
  test("drops case, punctuation and articles", () => {
    expect(comparableTitle("The Red Tile, shown after a failure.")).toBe(
      "red tile shown after failure",
    );
  });

  test("the two OTA phrasings reduce to the same words but for one", () => {
    // "status" is the only real difference between four rows describing one
    // firmware tile.
    expect(
      comparableTitle(OTA_B)
        .split(" ")
        .every((w) => comparableTitle(OTA_A).includes(w)),
    ).toBe(true);
  });
});

describe("sameProblem", () => {
  test("the four installer rows are one problem", () => {
    expect(sameProblem(INSTALLERS, INSTALLERS_TWIN)).toBe(true);
  });

  test("the two OTA phrasings are one problem", () => {
    expect(sameProblem(OTA_A, OTA_B)).toBe(true);
  });

  test("an identical title is trivially the same problem", () => {
    expect(sameProblem(ADDRESS, ADDRESS)).toBe(true);
  });

  test("two DIFFERENT Relay problems are not the same problem", () => {
    // The bar has to hold here or it buries real work. Both mention Relay,
    // both are about homeowners, and they are not the same thing.
    expect(sameProblem(NOTIFICATIONS, CHECKOUT_ABANDON)).toBe(false);
    expect(sameProblem(ADDRESS, NOTIFICATIONS)).toBe(false);
    expect(sameProblem(ADDRESS, CHECKOUT_ABANDON)).toBe(false);
  });

  test("a short title cannot match on one shared word", () => {
    expect(sameProblem("Fix checkout", "Fix onboarding")).toBe(false);
    expect(sameProblem("Checkout", "Checkout")).toBe(true); // identical still counts
  });

  test("an empty or punctuation-only title matches nothing", () => {
    expect(sameProblem("", ADDRESS)).toBe(false);
    expect(sameProblem("...", ADDRESS)).toBe(false);
  });
});

describe("stoppedApplying", () => {
  test("a superseded design gate means the spec was retired", () => {
    // P-57b closed these gates and left prds.status as 'draft', so 14 of
    // Helio's 29 drafts read live and are not.
    expect(stoppedApplying(spec({ id: "a", title: "x", designGateStatus: "superseded" }))).toBe(
      true,
    );
  });

  test("a pending or answered gate is not a retirement", () => {
    for (const gate of ["pending", "approved", "rejected", null, undefined]) {
      expect(stoppedApplying(spec({ id: "a", title: "x", designGateStatus: gate }))).toBe(false);
    }
  });
});

describe("findTheSpecThatAlreadySaysThis", () => {
  test("a re-entered SOLVED problem lands on the shipped spec, not a new draft", () => {
    // The measured case: two copies of the address re-confirmation spec sat on
    // Waiting while f2aa82f1 was already live.
    const match = findTheSpecThatAlreadySaysThis(ADDRESS, [
      spec({
        id: "f2aa82f1",
        title: ADDRESS,
        status: "shipped",
        shippedAt: "2026-09-04T07:00:00Z",
      }),
    ]);
    expect(match.kind).toBe("shipped");
    expect(match.kind === "shipped" && match.spec.id).toBe("f2aa82f1");
  });

  test("shipped wins over a live draft of the same problem", () => {
    const match = findTheSpecThatAlreadySaysThis(ADDRESS, [
      spec({ id: "live", title: ADDRESS }),
      spec({ id: "f2aa82f1", title: ADDRESS, status: "shipped" }),
    ]);
    expect(match.kind).toBe("shipped");
  });

  test("a live spec on the same problem is attached to rather than copied", () => {
    const match = findTheSpecThatAlreadySaysThis(INSTALLERS, [
      spec({ id: "a3866e00", title: INSTALLERS_TWIN }),
    ]);
    expect(match.kind).toBe("live");
    expect(match.kind === "live" && match.spec.id).toBe("a3866e00");
  });

  test("a SUPERSEDED spec is never attached to, even on an exact title", () => {
    // Attaching to one would hang new work off a document the record retired.
    const match = findTheSpecThatAlreadySaysThis(INSTALLERS, [
      spec({ id: "74730708", title: INSTALLERS, designGateStatus: "superseded" }),
    ]);
    expect(match.kind).toBe("none");
  });

  test("a superseded copy does not hide the live one behind it", () => {
    const match = findTheSpecThatAlreadySaysThis(INSTALLERS, [
      spec({ id: "74730708", title: INSTALLERS, designGateStatus: "superseded" }),
      spec({ id: "a3866e00", title: INSTALLERS_TWIN }),
    ]);
    expect(match.kind === "live" && match.spec.id).toBe("a3866e00");
  });

  test("a different problem is no match, so the spec still gets written", () => {
    const match = findTheSpecThatAlreadySaysThis(NOTIFICATIONS, [
      spec({ id: "x", title: CHECKOUT_ABANDON }),
      spec({ id: "y", title: ADDRESS, status: "shipped" }),
    ]);
    expect(match.kind).toBe("none");
  });

  test("no candidates at all is no match rather than an error", () => {
    expect(findTheSpecThatAlreadySaysThis(ADDRESS, []).kind).toBe("none");
  });
});

describe("whatDefineDidInstead", () => {
  test("the shipped line names the spec and points at Learn", () => {
    const line = whatDefineDidInstead({
      kind: "shipped",
      spec: spec({
        id: "f2aa82f1",
        title: "Remove the redundant address re-confirmation step",
        status: "shipped",
        shippedAt: "2026-09-04T07:00:00Z",
      }),
    });
    expect(line).toContain("already solved");
    expect(line).toContain("2026-09-04");
    expect(line).toContain("Learn is measuring");
  });

  test("the live line names which spec it attached to", () => {
    const line = whatDefineDidInstead({
      kind: "live",
      spec: spec({ id: "a3866e00", title: INSTALLERS }),
    });
    expect(line).toContain(INSTALLERS);
    expect(line).toContain("attaches to it");
  });

  test("no match says nothing, because nothing happened instead", () => {
    expect(whatDefineDidInstead({ kind: "none" })).toBeNull();
  });
});
