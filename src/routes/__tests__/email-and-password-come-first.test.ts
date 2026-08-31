import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * EMAIL AND PASSWORD MUST COME BEFORE GOOGLE ON THE SIGNUP FORM.
 *
 * SESSION-3 §J3 names this as a trap rather than a preference: *"One trap that
 * is specific and expensive: a Google/OAuth signup leaves no password, so no
 * agent can ever fill that form again on the founder's behalf. If you are
 * building a signup flow the founder will use, make email+password work first."*
 *
 * ── WHAT WAS ACTUALLY SHIPPING ────────────────────────────────────────────
 * Both paths worked. The ORDER decided which one a person takes, and "Continue
 * with Google" was the first control after the invite gate, with the email form
 * below it behind an "or". The founder is the person who will use this. An
 * account created through Google has **no password**, so every later
 * agent-driven sign-in on his behalf is impossible *and undiagnosable*: the form
 * is right there and simply never accepts him.
 *
 * Verified in a browser on the running dev server before it was moved, not from
 * source: the accessibility tree had "Continue with Google" ahead of "Work
 * email" on /signup.
 *
 * ── AND THE BROWSER CAUGHT MY FIX MID-WAY ─────────────────────────────────
 * The first move relocated the Google button and its "or" divider together, so
 * the page then read "Create account" → "Continue with Google" → "or", with the
 * divider stranded below the thing it divides. tsc was clean and nothing in the
 * suite could see it. **A source-order test alone would have passed that too**,
 * which is why the browser check is the instrument here and this file only
 * guards the regression.
 *
 * GOOGLE IS NOT REMOVED and nothing about it changed — same button, same busy
 * state, same wording. It is the alternative now rather than the default. The
 * invite gate stays above both, for the reason its own comment gives: it gates
 * both paths and must be visible before the thing it gates.
 */

const SIGNUP = readFileSync(join(import.meta.dir, "..", "signup.tsx"), "utf8");
/** Assertions read code only; the header above quotes the control's label. */
const CODE = SIGNUP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const at = (needle: string): number => {
  const i = CODE.indexOf(needle);
  expect(i).toBeGreaterThan(-1);
  return i;
};

describe("the signup door offers a password before it offers Google", () => {
  it("puts the email and password form before the Google button", () => {
    expect(at("<form onSubmit={signup}>")).toBeLessThan(at("onClick={signupGoogle}"));
  });

  it("puts the submit that creates the account before the Google button too", () => {
    expect(at("Create account")).toBeLessThan(at("onClick={signupGoogle}"));
  });

  /**
   * The stranded-divider regression, caught in a browser and pinned here. The
   * "or" separates the two paths, so it belongs between them; below Google it
   * divides the form from nothing.
   */
  it("keeps the divider between the two paths, not after both", () => {
    const divider = at('<span className="mrd-eyebrow whitespace-nowrap">or</span>');
    expect(at("Create account")).toBeLessThan(divider);
    expect(divider).toBeLessThan(at("onClick={signupGoogle}"));
  });

  it("still offers Google, because this reorders the door and removes nothing", () => {
    expect(CODE).toContain("Continue with Google");
    expect(CODE).toContain("signupGoogle");
  });

  /**
   * The invite gate is deliberately above BOTH paths and must stay there: it
   * gates both, and a gate has to be visible before the thing it gates.
   */
  it("leaves the invite gate above both paths", () => {
    const invite = at('htmlFor="signup-invite"');
    expect(invite).toBeLessThan(at("<form onSubmit={signup}>"));
    expect(invite).toBeLessThan(at("onClick={signupGoogle}"));
  });
});
