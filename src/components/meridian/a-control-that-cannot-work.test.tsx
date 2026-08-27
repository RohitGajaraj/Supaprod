/**
 * A CONTROL THAT CANNOT WORK IS WORSE THAN NO CONTROL (S1 → S0, 2026-08-27).
 *
 * S1 forced a 401 with the exact string auth throws and photographed
 * `/approvals`. Every sentence on the screen was true:
 *
 *     ! The queue did not load.
 *       Nothing has been settled and nothing has been lost. The queue is still
 *       whatever it was a moment ago; this screen just could not read it.
 *       [ Try again ]
 *
 * **The button was not.** Their session had ended, so "Try again" re-reads with
 * the same dead token and fails identically, forever. Nothing else on the screen
 * mentions signing in, and the one way out offered is the one that cannot work.
 * A person presses it three times and concludes the product is broken.
 *
 * It is the contradiction class this repo already knows — two halves each
 * correct, the composition wrong — arriving in a CONTROL rather than a sentence.
 * That is worse: a sentence that misleads costs a reader a moment, a control
 * that misleads costs them their trust.
 *
 * **128 files render one of these two components**, so it was every
 * read-failure surface in the product.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sessionEndedMessage } from "@/lib/error-copy";

const SRC = readFileSync(fileURLToPath(new URL("./surface-parts.tsx", import.meta.url)), "utf8");

describe("the way out matches what actually went wrong", () => {
  it("a dead session is recognised from the string auth really throws", () => {
    // The exact message S1 reproduced against a signed-in shell.
    expect(sessionEndedMessage(new Error("Unauthorized: Invalid token"))).toBe(
      "Your session ended. Sign in again and this will load.",
    );
  });

  it("and an ordinary read failure is not mistaken for one", () => {
    // Otherwise every failed read would send a signed-in person to /login.
    expect(sessionEndedMessage(new Error("relation does not exist"))).toBeNull();
    expect(sessionEndedMessage(undefined)).toBeNull();
  });

  it("both components decide it, rather than each caller remembering to", () => {
    expect(SRC).toContain("function wayOut(");
    const at = SRC.indexOf("function wayOut(");
    const body = SRC.slice(at, at + 900);
    expect(body).toContain("sessionEndedMessage(error)");
    expect(body).toContain('label: "Sign in"');
    expect(body).toContain('window.location.assign("/login")');
  });

  it("ReadFailed and ReadFailedLine both use it", () => {
    expect([...SRC.matchAll(/wayOut\(error,/g)]).toHaveLength(2);
  });
});

describe("THE 128 CALLERS MUST NOT BREAK", () => {
  it("the error prop is optional on both", () => {
    // A caller that does not pass it behaves exactly as it did before; one that
    // does gets the honest way out. No sweep required to land this safely.
    expect([...SRC.matchAll(/error\?: unknown;/g)]).toHaveLength(2);
  });

  it("and the retry path is untouched when the session is fine", () => {
    const at = SRC.indexOf("function wayOut(");
    const body = SRC.slice(at, at + 900);
    // The early return: no session-ended message means today's behaviour,
    // including the caller's own detail sentence and its own retry label.
    expect(body).toContain("if (!ended) return { detail, label: retryLabel, act: onRetry };");
  });
});
