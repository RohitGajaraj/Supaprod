// PUBLIC checkout (founder ruling 2026-08-03).
//
// WHY THIS PAGE EXISTS. Every paid CTA used to land on /signup, so a visitor who had
// already decided to pay was asked to create an account FIRST and then hunt for billing
// inside the app. That is the funnel backwards: it asks for commitment before it takes
// the money, and it puts an authentication wall between "I want this" and "here is my
// card". The order that converts, and the order that is also safer, is decide, price it,
// pay, and only then provision the account.
//
// WHY THE SEAT COUNTER IS HERE AND NOT ON /pricing. It was briefly built onto the
// pricing card and that was wrong: a pricing page compares plans, and a comparison
// grid should not turn into a configurator. /pricing shows one honest number per tier
// ($50/mo for Business) and this page is where a buyer configures what they are actually
// buying. One job per surface.
//
// THE JOURNEY: choose plan -> set seats -> give name and email -> see the real total ->
// pay -> confirmation -> sign in and invite the team.
//
// PAYMENTS ARE NOT WIRED YET, and this page says so out loud rather than rendering a
// dead button. The honesty law in stripe.ts applies: a disabled buy is still a dead
// promise, so when payments are unconfigured the final step states plainly what will
// happen and offers the free path instead. Everything up to that point is real, so the
// moment a payment provider is configured this page is already the flow.
import { useState, type CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { Action } from "@/components/meridian/surface-parts";
import { planPresentation, includedCreditsFor, type PlanTier } from "@/lib/entitlements";
import { priceForCredits } from "@/lib/billing-tier";
import { paymentsConfigured } from "@/lib/stripe";

const TITLE = "Checkout · Supaprod";
const DESC = "Pick your plan, set your seats, and start.";

/** Two is the floor for Business by design: with one author there is nothing to pool, and that is Pro. */
const MIN_SEATS = 2;

/** Only these are self-serve. Free needs no checkout; Enterprise is a conversation. */
const BUYABLE: PlanTier[] = ["pro", "team"];

type Search = {
  plan?: string;
  billing?: string;
  seats?: number;
};

export const Route = createFileRoute("/checkout")({
  ssr: true,
  validateSearch: (search: Record<string, unknown>): Search => ({
    plan: typeof search.plan === "string" ? search.plan : undefined,
    billing: search.billing === "annual" ? "annual" : "monthly",
    seats: typeof search.seats === "number" ? search.seats : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: CheckoutPage,
});

const label: CSSProperties = {
  display: "block",
  fontSize: 9.5,
  letterSpacing: "0.08em",
  color: "var(--mrd-mute)",
  marginBottom: 6,
};

const field: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 8,
  // `--mrd-field` is the border of a form control at rest, measured at 3.05:1 on
  // both grounds. `--mrd-line` is a structural edge and reads too quiet on an input.
  border: "1px solid var(--mrd-field)",
  background: "var(--mrd-sink)",
  color: "var(--mrd-ink)",
};

function CheckoutPage() {
  const search = Route.useSearch();

  const initialTier: PlanTier = BUYABLE.includes(search.plan as PlanTier)
    ? (search.plan as PlanTier)
    : "pro";

  const [tier, setTier] = useState<PlanTier>(initialTier);
  const [annual, setAnnual] = useState(search.billing === "annual");
  const [seats, setSeats] = useState(Math.max(MIN_SEATS, search.seats ?? MIN_SEATS));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const isBusiness = tier === "team";
  const p = planPresentation(tier);

  // Business subscribes against a PER-SEAT price, so the total is unit x seats. Pro is
  // one seat by definition. This is the arithmetic the buyer was never shown before.
  const unit = priceForCredits(tier, 0, annual ? "yearly" : "monthly") ?? 0;
  const seatCount = isBusiness ? seats : 1;
  const total = unit * seatCount;
  const includedCredits = (includedCreditsFor(tier) ?? 0) * seatCount;

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = name.trim().length > 1 && emailLooksValid;
  const payable = paymentsConfigured();

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <LandingBackdrop />
      <div
        style={{
          position: "relative",
          maxWidth: 620,
          margin: "0 auto",
          padding: "32px 20px 64px",
        }}
      >
        <Link
          to="/pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 26,
            fontSize: 13,
            color: "var(--mrd-mute)",
            textDecoration: "none",
          }}
        >
          <SupaprodMark size={20} />
          Back to plans
        </Link>

        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Start with {p.name}</h1>
        <p style={{ fontSize: 14, color: "var(--mrd-mute)", marginBottom: 26 }}>{p.tagline}</p>

        {/* 1 — plan, switchable here so a buyer who changed their mind does not go back */}
        <section style={{ marginBottom: 22 }}>
          <span style={label}>PLAN</span>
          <div style={{ display: "flex", gap: 8 }}>
            {BUYABLE.map((t) => {
              const on = t === tier;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 9,
                    textAlign: "left",
                    cursor: "pointer",
                    // Chosen is told by the select wash and a heavier edge, so it
                    // survives greyscale. Ember never doubles as an interaction state.
                    border: on ? "1.5px solid var(--mrd-edge)" : "1px solid var(--mrd-line)",
                    background: on ? "var(--mrd-select)" : "transparent",
                    color: "var(--mrd-ink)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{planPresentation(t).name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--mrd-mute)" }}>
                    ${priceForCredits(t, 0, "monthly")}/mo{t === "team" ? " per seat" : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2 — seats, Business only. The minus disables at the floor so the rule is visible. */}
        {isBusiness && (
          <section style={{ marginBottom: 22 }}>
            <span style={label}>SEATS</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Action
                type="button"
                aria-label="Remove a seat"
                disabled={seats <= MIN_SEATS}
                onClick={() => setSeats((n) => Math.max(MIN_SEATS, n - 1))}
              >
                -
              </Action>
              <span style={{ fontSize: 18, fontWeight: 500, minWidth: 24, textAlign: "center" }}>
                {seats}
              </span>
              <Action type="button" aria-label="Add a seat" onClick={() => setSeats((n) => n + 1)}>
                +
              </Action>
              <span style={{ fontSize: 12, color: "var(--mrd-mute)" }}>
                Two minimum. You can invite the rest after you sign in.
              </span>
            </div>
          </section>
        )}

        {/* 3 — who this is for */}
        <section style={{ marginBottom: 22 }}>
          <span style={label}>YOUR NAME</span>
          <input
            style={{ ...field, marginBottom: 14 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            autoComplete="name"
          />
          <span style={label}>WORK EMAIL</span>
          <input
            style={field}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
          <p style={{ fontSize: 11.5, color: "var(--mrd-mute)", marginTop: 6 }}>
            This becomes the owner of the workspace. Your account is created after payment succeeds,
            never before.
          </p>
        </section>

        {/* 4 — billing period */}
        <section style={{ marginBottom: 22 }}>
          <span style={label}>BILLING</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { on: !annual, text: "Monthly", set: () => setAnnual(false) },
              { on: annual, text: "Annual · save around 17%", set: () => setAnnual(true) },
            ].map((o) => (
              <button
                key={o.text}
                type="button"
                onClick={o.set}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 9,
                  fontSize: 13,
                  cursor: "pointer",
                  border: o.on ? "1.5px solid var(--mrd-edge)" : "1px solid var(--mrd-line)",
                  background: o.on ? "var(--mrd-select)" : "transparent",
                  color: "var(--mrd-ink)",
                }}
              >
                {o.text}
              </button>
            ))}
          </div>
        </section>

        {/* 5 — the arithmetic, shown rather than asserted */}
        <section
          style={{
            border: "1px solid var(--mrd-line)",
            borderRadius: 11,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span>
              {p.name}
              {isBusiness ? ` · ${seats} seats × $${unit}` : ""}
            </span>
            <span>${total}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--mrd-mute)",
              marginTop: 6,
            }}
          >
            <span>Credits included</span>
            <span>{includedCredits.toLocaleString()} a month</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 17,
              fontWeight: 600,
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--mrd-line)",
            }}
          >
            <span>Total</span>
            <span>${total}/mo</span>
          </div>
        </section>

        {/* 6 — pay. Honest when there is nothing to pay with. */}
        {payable ? (
          <Action
            type="button"
            variant="primary"
            className="w-full"
            disabled={!canContinue}
          >
            Continue to payment · ${total}/mo
          </Action>
        ) : (
          <div
            style={{
              border: "1px solid var(--mrd-line)",
              borderRadius: 11,
              padding: 16,
              fontSize: 13,
              color: "var(--mrd-mute)",
            }}
          >
            <strong style={{ color: "var(--mrd-ink)" }}>Card payments open shortly.</strong> Rather
            than show you a button that cannot take your money, here is what happens when it does:
            you pay ${total} a month, your workspace is created with{" "}
            {includedCredits.toLocaleString()} credits
            {isBusiness ? ` and ${seats} seats` : ""}, and you sign in and invite your team.
            {/* "Start free in the meantime" sent a visitor to a signup form
                that has been invite only since 2026-08-07, so the consolation
                prize for a card reader that is not ready yet would have been a
                second locked door. The waitlist is the thing they can actually
                do in the meantime. */}
            <div style={{ marginTop: 12 }}>
              <a
                href="/#join"
                style={{ color: "var(--mrd-ink)", textDecoration: "underline", fontWeight: 500 }}
              >
                Ask for a beta invite in the meantime →
              </a>
            </div>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: "var(--mrd-mute)", marginTop: 16 }}>
          Change or cancel anytime from Settings. Need more capacity later? Add credits without
          changing plan.
        </p>
      </div>
    </div>
  );
}
