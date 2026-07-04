import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { CadenceMark } from "@/components/cadence/Primitives";

// Screen 8 completion (F-DESIGN-EMBER) — the auth family's reset-request
// page on the login stage (login.tsx is the pattern source). Real flow
// unchanged: supabase resetPasswordForEmail → /reset-password recovery link.
// ssr:false kept — the auth pages hydrate browser-only (preview-blank fix).

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Forgot password · Cadence" }] }),
});

// Small mono-caps field label above each input — the a11y fix for the
// placeholder-only pattern (SC 1.3.1, 3.3.2), styled to the design language.
const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  textAlign: "left",
  fontSize: 9,
  marginBottom: 5,
};

const fieldErrorStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--rose)",
  textAlign: "left",
  lineHeight: 1.5,
  margin: "0 0 10px",
};

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function sendResetLink(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setFormError(error.message);
      return toast.error(error.message);
    }
    setSent(true);
    toast.success("Check your email for the reset link");
  }

  return (
    <div
      data-screen-label="Reset password"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper)",
        color: "var(--ink)",
        overflow: "hidden",
      }}
    >
      {/* giant mono butterfly watermark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -120,
          bottom: -130,
          color: "var(--ink)",
          opacity: 0.05,
          transform: "rotate(-12deg)",
        }}
      >
        <CadenceMark size={520} tile={false} />
      </div>

      <div
        className="fade-up"
        style={{ width: 360, maxWidth: "calc(100vw - 48px)", position: "relative", zIndex: 1 }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: 26,
          }}
        >
          <CadenceMark size={52} />
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 440, marginTop: 14 }}>
            Reset your password
          </h1>
          <div className="mono-label" style={{ marginTop: 6 }}>
            you make the calls · Cadence runs the rest
          </div>
        </div>

        <div className="bento" style={{ padding: 22 }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  margin: "4px 0 14px",
                  lineHeight: 1.55,
                }}
              >
                If an account exists for <strong style={{ color: "var(--ink)" }}>{email}</strong>,
                the reset link is on its way.
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setSent(false)}
              >
                Send again · same address
              </button>
            </div>
          ) : (
            <form onSubmit={sendResetLink}>
              <label htmlFor="forgot-email" className="mono-label" style={fieldLabelStyle}>
                Work email
              </label>
              <input
                id="forgot-email"
                className="input"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                }}
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? "forgot-error" : undefined}
                style={{ marginBottom: formError ? 8 : 10, width: "100%" }}
              />
              {formError ? (
                <p id="forgot-error" role="alert" style={fieldErrorStyle}>
                  {formError}
                </p>
              ) : null}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Send reset link · lands in your inbox"
                )}
              </button>
            </form>
          )}
        </div>

        <p
          style={{
            fontSize: 11.5,
            color: "var(--ink-subtle)",
            textAlign: "center",
            marginTop: 16,
            lineHeight: 1.5,
          }}
        >
          Remembered it?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--ink-subtle)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
