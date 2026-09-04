import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { announcementDraftBody } from "../_authenticated.ship";

/**
 * THE COMPOSER STARTS FROM THE RELEASE, NOT FROM A MODEL (P-133, A-QUEUE.md).
 *
 * THIS FILE USED TO GUARD THE OPPOSITE CONTRACT. Ship was once the one
 * station with no agent anywhere on it, and the fix wired `generateLaunchKit`
 * -- a real model pass over the changeset -- into `startFrom` so the crew
 * drafted "what it means for your customers" before a human ever saw the box.
 * That guard was right for the defect it closed: a composer with two empty
 * fields and nobody writing either of them.
 *
 * IT WAS THE WRONG FIX FOR WHAT SHIPS TO A CUSTOMER. A1 read the served page
 * on 2026-09-04 and found the picked-release press opening the release
 * document instead of the composer, so she wrote the first announcement by
 * hand from the notes and the PR -- and the packet's own Why is explicit
 * about what should NOT replace that: "plain register (no filler, a
 * verifiable mechanism first)". A model inventing what a change means for a
 * customer, in a document with no review gate before it goes out, is filler
 * with a byline. `<AgentPulse>` showed the automation was real; it did not
 * make the sentence it produced any less invented.
 *
 * SO THE COMPOSER NOW SOURCES EVERYTHING IT CAN FROM A COLUMN. `title`,
 * "What changed" and the closing line (shipped date, PR, address) all trace
 * to the release row `startFrom` already holds -- `announcementDraftBody`
 * is pure and tested directly below rather than through the route's own
 * network calls. The one sentence no row can answer, what the change means
 * for a customer, is left as a bracketed prompt for the person to write,
 * never guessed. This file's job changed from "prove a model runs" to
 * "prove nothing here claims to know what the founder has not yet said".
 */

const SHIP = join(import.meta.dir, "..", "_authenticated.ship.tsx");
const src = readFileSync(SHIP, "utf8");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the announcement composer starts from the release, never from a model", () => {
  it("startFrom composes the draft from announcementDraftBody, not a server call", () => {
    const flat = code.replace(/\s+/g, " ");
    const fn = flat.slice(flat.indexOf("function startFrom("));
    const body = fn.slice(0, fn.indexOf("setMode({ kind: \"new\" }") + 40);
    expect(body).toMatch(/announcementDraftBody\(/);
    // The old shape is gone, not merely unused: no model call inside startFrom,
    // no drafting pulse to key off of. A regression here would silently bring
    // back an AI-authored customer sentence with no fixture that can catch it.
    expect(body).not.toMatch(/fLaunchKit|generateLaunchKit/);
  });

  it("generateLaunchKit is not imported by this route (its callers are elsewhere)", () => {
    expect(code).not.toMatch(/generateLaunchKit/);
  });

  it("a fixture release prefills all three parts, in order", () => {
    const draft = announcementDraftBody({
      body: "The checkout step no longer asks for an address it already has.",
      released_at: "2026-09-04T06:58:00.000Z",
      pr_number: 42,
      production_url: "https://example.com/p/checkout-address",
    });
    const changedAt = draft.indexOf("What changed");
    const meansAt = draft.indexOf("What it means for your customers");
    const closingAt = draft.indexOf("Shipped");
    expect(changedAt).toBeGreaterThanOrEqual(0);
    expect(meansAt).toBeGreaterThan(changedAt);
    expect(closingAt).toBeGreaterThan(meansAt);
    expect(draft).toContain("The checkout step no longer asks for an address it already has.");
    // What it means is a PROMPT, never a guess.
    expect(draft).toMatch(/\[.*write.*\]/i);
    expect(draft).toContain("PR #42");
    expect(draft).toContain("https://example.com/p/checkout-address");
  });

  it("drops a closing-line part cleanly when its data is absent, never a bare label", () => {
    const draft = announcementDraftBody({
      body: "Notes here.",
      released_at: "2026-09-04T06:58:00.000Z",
      pr_number: null,
      production_url: null,
    });
    expect(draft).not.toMatch(/PR #/);
    // The date still stands alone; the line is never fully empty for a real release.
    expect(draft).toMatch(/Shipped/);
  });

  it("an empty composer is reachable only from Write another, never from a live release", () => {
    // startNew() is the only path that clears both fields with no release
    // behind it; startFrom always calls announcementDraftBody first.
    expect(code).toMatch(/function startNew\(\) \{\s*setDraftTitle\(""\)/);
  });
});
