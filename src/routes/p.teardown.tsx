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
// receipted Critic teardown. Dark ember Tempo aesthetic matching /login (mounts
// the same data-obsidian scope), self-hosted Geist, mono-labels, hairline
// borders, one Pixel brand moment in the hero.

const MAX = 8000;

export const Route = createFileRoute("/p/teardown")({
  ssr: false,
  component: TeardownPage,
  head: () => ({
    meta: [
      { title: "Free PRD teardown · Supaprod" },
      {
        name: "description",
        content:
          "Paste a PRD or a product bet and get a sharp, honest, receipted teardown from Supaprod's Critic. No signup, no setup.",
      },
    ],
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
  background: "var(--canvas)",
  color: "var(--text-primary)",
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
  border: "1px solid var(--hairline)",
  background: "var(--surface-1)",
  fontSize: 13.5,
  lineHeight: 1.55,
  color: "var(--text-body)",
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
};

function TeardownPage() {
  useObsidianAuthSurface();
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
        const body = await res.json().catch(() => ({}) as Record<string, unknown>);
        const message =
          res.status === 503
            ? "The live teardown is resting right now. Please try again shortly."
            : typeof body?.error === "string"
              ? body.error
              : "Something went wrong. Please try again.";
        setState({ kind: "error", message });
        return;
      }
      const body = (await res.json()) as { teardown?: Teardown };
      if (!body?.teardown) {
        setState({ kind: "error", message: "Could not generate a teardown. Please try again." });
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
          color: "var(--text-primary)",
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
          <div className="mono-label" style={{ marginTop: 14, color: "var(--text-subtle)" }}>
            Supaprod Critic · live teardown
          </div>
          {/* The one Geist Pixel brand moment on this surface. */}
          <h1
            className="font-pixel"
            style={{
              fontSize: "clamp(26px, 6vw, 40px)",
              lineHeight: 1.1,
              marginTop: 12,
              color: "var(--text-primary)",
            }}
          >
            Paste a PRD. Get a receipted teardown.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-subtle)",
              lineHeight: 1.55,
              maxWidth: 460,
              margin: "14px auto 0",
            }}
          >
            No signup. No setup. Supaprod's Critic reads what you paste and hands back a sharp,
            honest receipt, usually in under a minute.
          </p>
        </header>

        {/* Input. */}
        <form onSubmit={submit}>
          <label htmlFor="teardown-input" className="mono-label" style={{ fontSize: 9 }}>
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
            <span
              className="mono-label"
              style={{ fontSize: 9, color: nearLimit ? "var(--madder)" : "var(--text-subtle)" }}
            >
              {text.length} / {MAX}
            </span>
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
          {state.kind === "done" ? <TeardownReceipt teardown={state.teardown} /> : null}

          {state.kind === "limited" ? (
            <div style={noticeBox} role="status">
              <Clock size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                You have hit the free limit for now. Please try again in about {state.minutes}{" "}
                {state.minutes === 1 ? "minute" : "minutes"}. Want no limits? Create a free
                workspace below.
              </span>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div
              style={{ ...noticeBox, borderColor: "var(--madder)", color: "var(--text-body)" }}
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
                color: "var(--text-subtle)",
                lineHeight: 1.55,
                maxWidth: 420,
                margin: "0 auto 12px",
              }}
            >
              Keep this teardown and your decision history. Create a free workspace and Supaprod
              remembers every call you make.
            </p>
            <Link
              to="/signup"
              className="btn btn-primary"
              style={{ display: "inline-flex", justifyContent: "center" }}
            >
              Create a free workspace <ArrowRight size={14} />
            </Link>
          </div>
        ) : null}

        {/* Quiet trust footer. */}
        <p
          style={{
            fontSize: 11,
            color: "var(--text-subtle)",
            textAlign: "center",
            lineHeight: 1.55,
            marginTop: 32,
          }}
        >
          Your text is sent once to Supaprod's Critic to write this receipt. Nothing is stored to an
          account until you make one.
        </p>
      </div>
    </div>
  );
}
