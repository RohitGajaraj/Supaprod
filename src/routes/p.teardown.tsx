import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { useState, type CSSProperties } from "react";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import { useObsidianAuthSurface } from "@/components/supaprod/AuthScaffold";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { TeardownReceipt } from "@/components/public/TeardownReceipt";
import type { Teardown } from "@/lib/ai/public-teardown.server";

// RPT-03: Zero-connector first receipt. THE public demo wedge: a stranger, no
// signup and no connectors, pastes a PRD or a one-line product bet and gets a
// receipted Critic teardown. Self-hosted Geist, mono-labels, one Pixel brand
// moment in the hero.
//
// THE COLOUR LAYER IS MERIDIAN, ported 2026-08-22. The header used to promise a
// "dark ember Tempo aesthetic matching /login" with "hairline borders", written
// when both of those systems were live. 15 occurrences of the retired
// vocabulary are gone and the file carries none. The page still mounts the
// data-obsidian scope through `useObsidianAuthSurface`, because /login and the
// rest of the auth surfaces have not been ported and the scope is what keeps
// them consistent with each other; that is the remaining retired thing here and
// it is a shared decision, not this file's to make alone.
//
// Meridian's tokens live on `:root` and flip on `[data-theme="light"]`, exactly
// as the `--ds-*` scale underneath the obsidian scope already did, so this page
// reads correctly in both grounds for the same reason it did before.
//
// Two calls needed judgement rather than a table:
//   - the character counter turning at 90% of the cap is `--mrd-hold`, not
//     `--mrd-fail`. Nothing has failed; the textarea is about to be capped by a
//     condition, and red reports a result rather than warning of one. Meridian
//     retired the sixth status word on purpose, so `hold` is the honest stop.
//   - the error notice is `--mrd-fail`. The Critic ran and did not finish, which
//     is an outcome that happened.

const MAX = 8000;

/**
 * The specimen the "Try it on an example" control loads.
 *
 * Deliberately the SAME bet the placeholder has always shown, so the page makes
 * no new claim and the Critic is judged on a case a reader can see is ordinary.
 * It is also a genuinely weak bet (a solution with no evidence of the problem
 * and a vanity success metric), which is what makes the receipt worth reading:
 * a specimen the Critic waves through would prove nothing.
 */
const EXAMPLE_BET =
  "We should ship a weekly AI digest so PMs stop missing customer signals. Success = 40% of teams open it twice a week.";

const SITE = "https://supaprod.ai";

export const Route = createFileRoute("/p/teardown")({
  ssr: true,
  component: TeardownPage,
  head: () => ({
    meta: [
      { title: "Free PRD teardown · Supaprod" },
      {
        name: "description",
        content:
          "Paste a PRD or a product bet and get a sharp, honest, evidence-backed teardown from Supaprod's Critic. No signup, no setup.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/p/teardown` }],
  }),
});

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; teardown: Teardown }
  | { kind: "limited"; minutes: number }
  | { kind: "error"; message: string };

const surface: CSSProperties = {
  position: "relative",
  isolation: "isolate",
  minHeight: "100vh",
  background: "var(--mrd-bg)",
  color: "var(--mrd-ink)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "48px 24px 72px",
  overflow: "hidden",
};

const noticeBox: CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 12,
  border: "1px solid var(--mrd-edge)",
  background: "var(--mrd-lift)",
  fontSize: 13.5,
  lineHeight: 1.55,
  color: "var(--mrd-ink)",
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
};

function TeardownPage() {
  useObsidianAuthSurface(); // Safe: hook uses useEffect internally
  const [text, setText] = useState("");
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const trimmed = text.trim();
  const busy = state.kind === "loading";
  const nearLimit = text.length > MAX * 0.9;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || busy) return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/public/teardown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed.slice(0, MAX) }),
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}) as Record<string, unknown>);
        const secs = Number(body?.retryAfterSeconds) || 60;
        setState({ kind: "limited", minutes: Math.max(1, Math.ceil(secs / 60)) });
        return;
      }
      if (!res.ok) {
        /**
         * NEVER PRINT THE SERVER'S OWN WORDS TO A STRANGER.
         *
         * This used to render `body.error` verbatim on any non-503, and the API
         * returns "internal error" on its 500 path. That is a sentence written
         * for a log, shown on the page that decides whether someone signs up.
         *
         * The replacements are not softer generic copy. "Something went wrong.
         * Please try again." is the exact string humanized-output.md names as
         * passing every automated check while still failing: it tells the
         * reader nothing about what happened, what survived, or what to do. Each
         * case now names the failure and says the one thing they most want to
         * know, which is that their pasted text is still in the box.
         */
        const message =
          res.status === 503
            ? "The Critic is offline right now, so nothing was read. Your text is still in the box, and it is worth trying again in a few minutes."
            : "The Critic could not finish reading that. Your text is still in the box, so you can send it again as it is.";
        setState({ kind: "error", message });
        return;
      }
      const body = (await res.json()) as { teardown?: Teardown };
      if (!body?.teardown) {
        setState({
          kind: "error",
          message:
            "The Critic read your document but could not produce a teardown for it. Your text is still in the box. A longer spec, with the problem and the plan in it, usually gives it more to work with.",
        });
        return;
      }
      setState({ kind: "done", teardown: body.teardown });
    } catch {
      setState({
        kind: "error",
        message: "Could not reach the Critic. Check your connection and try again.",
      });
    }
  }

  return (
    <div style={surface}>
      {/* The landing starfield/grid, below all content. */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} aria-hidden>
        <LandingBackdrop />
      </div>
      {/* Watermark brand mark, same treatment as the auth surface. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -130,
          bottom: -140,
          color: "var(--mrd-ink)",
          opacity: 0.04,
          transform: "rotate(-12deg)",
          pointerEvents: "none",
        }}
      >
        <SupaprodMark size={520} />
      </div>

      <div
        className="fade-up"
        style={{ width: "100%", maxWidth: 640, position: "relative", zIndex: 1 }}
      >
        {/* Hero. */}
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SupaprodMark size={44} />
          </div>
          <div className="mono-label" style={{ marginTop: 14, color: "var(--mrd-mute)" }}>
            Supaprod Critic · live teardown
          </div>
          {/* The one Geist Pixel brand moment on this surface. */}
          <h1
            className="font-pixel"
            style={{
              fontSize: "clamp(26px, 6vw, 40px)",
              lineHeight: 1.1,
              marginTop: 12,
              color: "var(--mrd-ink)",
            }}
          >
            Paste a PRD. Get an evidence-backed teardown.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--mrd-mute)",
              lineHeight: 1.55,
              maxWidth: 460,
              margin: "14px auto 0",
            }}
          >
            No signup. No setup. Supaprod's Critic reads what you paste and hands back a sharp,
            honest teardown, usually in under a minute.
          </p>
        </header>

        {/* Input. */}
        <form onSubmit={submit}>
          <label htmlFor="teardown-input" className="mono-label">
            Your PRD or product bet
          </label>
          <textarea
            id="teardown-input"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            disabled={busy}
            rows={9}
            placeholder={
              'Paste a full PRD, or write a one-line bet:\n\n"We should ship a weekly AI digest so PMs stop missing customer signals. Success = 40% of teams open it twice a week."'
            }
            style={{
              width: "100%",
              marginTop: 6,
              resize: "vertical",
              minHeight: 180,
              lineHeight: 1.55,
              fontFamily: "var(--font-sans)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 10,
            }}
          >
            {/* THE BLANK BOX WAS THE CONVERSION KILLER.
             *
             * This page asks a stranger to produce a PRD before it will show
             * them anything. The example lived in the placeholder, where it
             * cannot be used: you have to retype it. Every grader tool that
             * works (Lighthouse, Website Grader) hands you a specimen to run,
             * because the point of the first run is to show what the output
             * looks like, not to grade the visitor's writing.
             *
             * One press fills the box with the same bet the placeholder was
             * already showing, so nothing new is claimed and the visitor is
             * one further press from a real receipt. It hides itself once
             * there is text, so it never competes with their own input. */}
            {trimmed ? (
              <span
                className="mono-label"
                style={{ color: nearLimit ? "var(--mrd-hold)" : "var(--mrd-mute)" }}
              >
                {text.length} / {MAX}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setText(EXAMPLE_BET)}
                className="mono-label"
                style={{
                  color: "var(--mrd-mute)",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid color-mix(in srgb, var(--mrd-mute) 40%, transparent)",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Try it on an example
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !trimmed}
              style={{ minWidth: 168, justifyContent: "center" }}
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Reading your document
                </>
              ) : (
                "Tear it down"
              )}
            </button>
          </div>
        </form>

        {/* Result / states. */}
        <div style={{ marginTop: 24 }}>
          {/*
           * THE MINUTE THIS PAGE SPENDS SAYING NOTHING.
           *
           * `state.kind === "loading"` has existed since this surface was
           * built, and this region branched on done / limited / error only. So
           * for the whole of a run this page's own copy calls "usually in under
           * a minute", the largest area of the screen was EMPTY and no live
           * region announced anything. The only feedback was a 14px spinner
           * inside the disabled submit button.
           *
           * This is the front door for strangers: the hero and the receipts row
           * both point here, and it is what a Product Hunt click lands on. A
           * minute of nothing is where people close the tab.
           *
           * `minHeight` is deliberate and approximates the receipt that lands,
           * so the page does not jump under the reader at the exact moment they
           * start reading. `role="status"` is what makes the wait reach a screen
           * reader at all.
           */}
          {state.kind === "loading" ? (
            <div style={{ ...noticeBox, minHeight: 132, alignItems: "center" }} role="status">
              <Loader2 size={16} className="animate-spin" style={{ flexShrink: 0 }} />
              <span>
                The Critic is reading your document, then checking it against what usually goes
                wrong with a spec like it. Usually under a minute. Your text stays in the box.
              </span>
            </div>
          ) : null}

          {state.kind === "done" ? <TeardownReceipt teardown={state.teardown} /> : null}

          {state.kind === "limited" ? (
            <div style={noticeBox} role="status">
              <Clock size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              {/* "Create a free workspace below" WAS TRUE UNTIL 2026-08-07 and
                  stopped being true the evening signup went invite only. The
                  limit notice was sending somebody to a door that now asks for a
                  code, which turns a polite cap into a second dead end in a row.
                  Caught by the founder asking a different question entirely, about
                  cost, which is usually how this class of thing surfaces.

                  It still converts, because the offer is real: the waitlist is
                  the way in and the limit is exactly the moment somebody has
                  proved they want one. What it must not do is promise an account
                  they cannot open. */}
              <span>
                You have hit the free limit for now. It resets in about {state.minutes}{" "}
                {state.minutes === 1 ? "minute" : "minutes"}. The Critic runs without limits inside
                Supaprod, which is invite only right now. Ask for a code below.
              </span>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div
              style={{ ...noticeBox, borderColor: "var(--mrd-fail)", color: "var(--mrd-ink)" }}
              role="alert"
            >
              <span>{state.message}</span>
            </div>
          ) : null}
        </div>

        {/* One honest conversion CTA, shown once a receipt lands. */}
        {state.kind === "done" || state.kind === "limited" ? (
          <div style={{ marginTop: 22, textAlign: "center" }}>
            <p
              style={{
                fontSize: 13,
                color: "var(--mrd-mute)",
                lineHeight: 1.55,
                maxWidth: 420,
                margin: "0 auto 12px",
              }}
            >
              {/* This is the conversion moment on the strongest public asset we have, and
                  it was promising storage. The visitor has just watched the Critic judge
                  their idea; what earns the signup is that the NEXT judgement is sharper
                  because of this one, not that this one is filed somewhere. */}
              Keep this teardown and your decision history. A workspace is free, and every call you
              make sharpens the next one. Supaprod is in private beta, so ask for a code and we will
              send you one.
            </p>
            {/* Was a Link to /signup labelled "Create a free workspace", which
                was the truth until the founder closed signup on 2026-08-07. A
                visitor here reached this page through a shared link and has no
                code, so the ask is for access. A plain anchor because the
                waitlist is a fragment on the landing page and not a route. */}
            <a
              href="/#join"
              className="btn btn-primary"
              style={{ display: "inline-flex", justifyContent: "center" }}
            >
              Request access <ArrowRight size={14} />
            </a>
          </div>
        ) : null}

        {/* Quiet trust footer. */}
        <p
          style={{
            fontSize: 11,
            color: "var(--mrd-mute)",
            textAlign: "center",
            lineHeight: 1.55,
            marginTop: 32,
          }}
        >
          Your text is sent once to Supaprod's Critic to write this teardown. Nothing is stored to
          an account until you make one.
        </p>
      </div>
    </div>
  );
}
