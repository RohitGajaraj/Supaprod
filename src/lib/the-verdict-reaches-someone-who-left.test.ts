/**
 * THE VERDICT REACHES SOMEONE WHO CLOSED THE TAB (gap #2, 2026-08-26).
 *
 * Authorised gap #2, ranked second: *"Nothing reaches a person who left the page…
 * No notification, email, push or digest exists that carries a verdict to someone
 * who closed the tab."* F-84 measured what that costs — **43 of 93 tracks, 46.2%
 * of all work ever created**, parked in `TERMINAL_HOLDS` waiting on a person
 * nobody told.
 *
 * S1 is shipping the promise in the same phase — *"I'm on it, you can leave this
 * page"* — and **a promise without delivery is a lie under standard #7**, which is
 * why they land together.
 *
 * ── WHAT THESE PIN, AND WHY EACH ONE MATTERS ───────────────────────────────
 * The copy makes two claims that must never be guesses:
 *  · *"This work carried no written expectation"* must mean **there is no
 *    decision**, never *"I did not look one up"*. A null `decisionId` is the
 *    positive absence (F-61's waived-Decide shape); a set one is read.
 *  · The pairing — expected beside happened — is the product. A verdict alone is
 *    a status word, and the forecast beside it is the thing no other vendor can
 *    reconstruct after the fact.
 *
 * And the whole call is best-effort by contract: **a mail failure must never
 * fail the tool that produced the verdict.**
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { dispatchVerdictEmail } from "./notifications.functions";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const REGISTRY = read("./ai/tools/registry.server.ts");
const NOTIF = read("./notifications.functions.ts");

/** A client that answers the preference read, then the decision read. */
const client = (opts: { emailVerdict?: boolean | null; forecast?: string | null }) =>
  ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            table === "user_notification_preferences"
              ? {
                  data:
                    opts.emailVerdict === null
                      ? null
                      : { email_verdict: opts.emailVerdict ?? true },
                  error: null,
                }
              : { data: { forecast_claim: opts.forecast ?? null }, error: null },
        }),
      }),
    }),
    auth: { admin: undefined },
  }) as never;

const base = {
  userId: "u1",
  learningId: "l1",
  verdict: "validated" as const,
  summary: "checkout completion rose 4 points",
};

describe("the person's own preference is obeyed", () => {
  it("does not send when they turned verdict email off", async () => {
    const out = await dispatchVerdictEmail(client({ emailVerdict: false }), base);
    expect(out.sent).toBe(false);
    expect(out.reason).toContain("turned verdict email off");
  });

  it("an absent preference row is a default, not a refusal", async () => {
    // Never configured means never opted out. It proceeds far enough to try to
    // resolve a recipient, which is the next honest failure rather than a
    // silent preference-shaped one.
    const out = await dispatchVerdictEmail(client({ emailVerdict: null }), base);
    expect(out.reason).not.toContain("turned verdict email off");
  });
});

describe("it never throws, because the verdict is already written", () => {
  it("a client that explodes still returns rather than unwinding the tool", async () => {
    const exploding = {
      from: () => {
        throw new Error("database on fire");
      },
    } as never;
    const out = await dispatchVerdictEmail(exploding, base);
    expect(out.sent).toBe(false);
    expect(out.reason).toContain("database on fire");
  });
});

describe("the wiring says what it must", () => {
  it("fires from the agent path, awaited", () => {
    // Awaited for the reason the rememberOutcome block beside it states: an
    // unawaited promise in a Cloudflare Worker can be dropped when the request
    // settles, which would put the send in the same nowhere it came from.
    expect(REGISTRY).toContain("await dispatchVerdictEmail(supabase, {");
    expect(REGISTRY).toContain("decisionId: resolvedDecisionId");
  });

  it("the human settle path does NOT email", () => {
    // recordOutcome's person is looking at the result already. Mailing somebody
    // a thing they are reading is how a channel teaches people to ignore it.
    const settle = REGISTRY.indexOf("recordOutcome");
    if (settle > -1) {
      const near = REGISTRY.slice(settle, settle + 2000);
      expect(near).not.toContain("dispatchVerdictEmail");
    }
  });

  it("the forecast is read here, so the absence line cannot mean 'I did not look'", () => {
    const fn = NOTIF.slice(NOTIF.indexOf("export async function dispatchVerdictEmail"));
    expect(fn).toContain('.select("forecast_claim")');
    expect(fn).toContain("carried no written expectation");
  });

  it("the copy pairs expected with happened, which is the product", () => {
    const fn = NOTIF.slice(NOTIF.indexOf("export async function dispatchVerdictEmail"));
    expect(fn).toContain("What we expected:");
    expect(fn).toContain("What happened:");
  });

  it("uses no banned vocabulary on a surface a person reads", () => {
    const fn = NOTIF.slice(NOTIF.indexOf("export async function dispatchVerdictEmail"));
    const copy = [...fn.matchAll(/"([^"]{12,})"/g)].map((m) => m[1]).join(" | ");
    for (const banned of ["receipts", "ledger", "company brain", "unattended", "provenance"]) {
      expect(copy.toLowerCase()).not.toContain(banned);
    }
  });
});
