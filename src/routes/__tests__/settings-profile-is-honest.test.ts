/**
 * The Profile pane may not collect what nothing reads, or offer what it cannot show.
 *
 * Two defects the founder found by using the surface, both of the same family: a
 * control whose appearance promises something the code does not deliver.
 *
 *   1. A free-text "Role" field, defaulted to "AI Product Manager", written on every
 *      save and read by NOTHING. Personal data held for no purpose.
 *   2. A twelve-swatch mark picker whose choice was never displayed. The picker saves
 *      to localStorage, and `components/supaprod/Avatar.tsx` -- the only thing that
 *      renders an orb -- is mounted nowhere in the product. The shell draws initials
 *      instead. This route's own header records killing "the avatar identity header",
 *      which had been the one place the choice was ever shown.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { stripComments } from "@/__tests__/meridian-ratchet-scan";

const route = readFileSync(new URL("../_authenticated.settings.tsx", import.meta.url), "utf8");
const profileFns = readFileSync(new URL("../../lib/profile.functions.ts", import.meta.url), "utf8");
const shipping = stripComments(route);
const ships = (needle: string) => shipping.includes(needle);

/** The ProfileSection body only, so an assertion cannot pass on another pane. */
function profilePane(): string {
  const from = shipping.indexOf("function ProfileSection()");
  expect(from, "ProfileSection is gone").toBeGreaterThan(-1);
  const to = shipping.indexOf("\nfunction ", from + 10);
  return shipping.slice(from, to === -1 ? undefined : to);
}

describe("nothing is asked for that nothing reads", () => {
  const pane = profilePane();

  it("no longer asks for a job title", () => {
    /*
     * data-minimalism.md: no field exists unless a NAMED CONSUMER needs it, and
     * "collect now, use later" is not a reason. `role` had no reader anywhere -- every
     * other `role` in the product is a workspace role, which is a different fact.
     */
    expect(pane.includes('label="Role"'), "the Role field is back").toBe(false);
    expect(pane.includes("setRole("), "Role state is back").toBe(false);
  });

  it("does not send a job title on save", () => {
    expect(pane.includes("role: role"), "Role is still written on save").toBe(false);
  });

  it("keeps the field it does read", () => {
    // The guard must be about consumers, not about deleting fields. Display name is
    // read by the shell and the digest, so it stays.
    expect(pane.includes("display_name")).toBe(true);
  });

  it("leaves the stored column alone, because that is a migration", () => {
    // Stopping the capture is this surface's call. Dropping data is not, and doing it
    // silently inside a UI change would be the destructive version of a tidy-up.
    expect(profileFns.includes("role"), "the server contract was rewritten too").toBe(true);
  });
});

describe("the mark a person picks is shown to them", () => {
  const pane = profilePane();

  it("draws the current mark, not only the swatches", () => {
    // THE REPORTED BUG. Twelve 22px swatches with a border on one is a picker with no
    // subject: there was nothing on the pane showing what had been chosen.
    expect(
      pane.includes("orbBackground(avatarChoice ?? defaultAvatarVariant(name))"),
      "the chosen mark is still not drawn anywhere",
    ).toBe(true);
  });

  it("draws it larger than the swatches, so it reads as the subject", () => {
    // Same size as a swatch would be a thirteenth swatch.
    expect(pane).toMatch(/width: 3\d,/);
  });

  it("still lets every mark be chosen", () => {
    expect(pane.includes("AVATAR_VARIANTS")).toBe(true);
    expect(pane.includes("chooseAvatar(i)")).toBe(true);
  });
});

describe("the search keycap keeps its promise", () => {
  const rail = readFileSync(
    new URL("../../components/meridian/SidebarNav.tsx", import.meta.url),
    "utf8",
  );

  it("binds the key the keycap advertises", () => {
    // The field drew <kbd>/</kbd> and nothing was bound to it, so the rail advertised
    // a shortcut that did not exist. A keycap is a promise like a chevron is.
    expect(rail.includes('event.key !== "/"'), "the / key is still unbound").toBe(true);
    expect(rail.includes("searchRef.current?.focus()")).toBe(true);
  });

  it("does not steal the key from somebody typing", () => {
    // Somebody entering a path or a timezone types "/" and must keep it.
    expect(rail.includes('tag === "INPUT"')).toBe(true);
    expect(rail.includes("isContentEditable")).toBe(true);
  });

  it("binds on the DOCUMENT, because that is the only place the key is pressed", () => {
    /*
     * THIS ASSERTION USED TO REQUIRE THE OPPOSITE, AND IT PINNED A BUG. The first
     * version listened on the rail's own <nav>, which meant the shortcut fired only
     * when focus was already inside the rail -- useless -- and did nothing in the one
     * case anybody presses it: reading the page with focus on the body. The founder
     * reported it dead twice. The test agreed with the code and both were wrong.
     */
    expect(rail.includes('document.addEventListener("keydown", onSlash)')).toBe(true);
    expect(rail.includes('document.removeEventListener("keydown", onSlash)')).toBe(true);
  });

  it("lets only one rail own the key, which is why scoping it was tempting", () => {
    // Two rails on one page would otherwise race. The first in document order wins,
    // so they cooperate instead, and the feature is not broken to avoid the race.
    expect(rail.includes('nav[data-mrd] input[aria-label="Search"]')).toBe(true);
  });

  it("does not bind a shortcut to a field that is not there", () => {
    // No onSearch means no field and no keycap, so the key would reach nothing.
    expect(rail.includes("if (!onSearch || isCollapsed) return;")).toBe(true);
  });
});
