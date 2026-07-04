import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { CadenceMark } from "@/components/cadence/Primitives";

// Screen 8 completion (F-DESIGN-EMBER) — the recovery-link landing page on
// the login stage. Real flow unchanged: a valid recovery link carries a
// session, updateUser({ password }) sets the new one and leaves the user
// signed in (the done state continues into the workspace). ssr:false kept.
//
// D-09 (audit): the old beforeLoad bounced ANY signed-in user to "/", which
// raced the recovery link itself (the link signs the user in, then the gate
// threw them into the app before they could set a password), and Supabase can
// consume the URL hash before the component reads it (a valid link showed
// "invalid or expired"). Fix: no blanket redirect; accept the recovery hash,
// an existing session, or the PASSWORD_RECOVERY auth event as proof the form
// may show.

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset password · Cadence" }] }),
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

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // null = still checking the link; true = may set a password; false = the
  // link is genuinely dead (no hash, no session, no recovery event).
  const [canReset, setCanReset] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token=")) {
      setCanReset(true);
    }
    // Supabase may already have consumed the hash into a session.
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setCanReset(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setCanReset(true);
    });
    // No signal after a short grace window: the link really is dead.
    const timer = setTimeout(() => {
      if (active) setCanReset((v) => (v === null ? false : v));
    }, 2500);
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return toast.error("Password must be at least 6 characters");
    }
    if (password !== confirm) {
      setFormError("Passwords do not match");
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setFormError(error.message);
      return toast.error(error.message);
    }
    setDone(true);
    toast.success("Password updated");
  }

  return (
    <div
      data-screen-label="New password"
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
            Choose a new password
          </h1>
          <div className="mono-label" style={{ marginTop: 6 }}>
            you make the calls · Cadence runs the rest
          </div>
        </div>

        <div className="bento" style={{ padding: 22 }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  margin: "4px 0 14px",
                  lineHeight: 1.55,
                }}
              >
                Your password is updated. You are signed in with it now.
              </p>
              <Link
                to="/"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue · opens your workspace
              </Link>
            </div>
          ) : canReset === null ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  margin: "4px 0",
                  lineHeight: 1.55,
                }}
              >
                Checking your reset link.
              </p>
            </div>
          ) : canReset === false ? (
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-muted)",
                  margin: "4px 0 14px",
                  lineHeight: 1.55,
                }}
              >
                This reset link is invalid or has expired.
              </p>
              <Link
                to="/forgot-password"
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Request a new link · takes a minute
              </Link>
            </div>
          ) : (
            <form onSubmit={updatePassword}>
              <label htmlFor="reset-password-new" className="mono-label" style={fieldLabelStyle}>
                New password
              </label>
              <div style={{ position: "relative", marginBottom: 10 }}>
                <input
                  id="reset-password-new"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="at least 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(null);
                  }}
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? "reset-password-error" : undefined}
                  style={{ width: "100%", paddingRight: 34 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--ink-subtle)",
                    display: "flex",
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <label
                htmlFor="reset-password-confirm"
                className="mono-label"
                style={fieldLabelStyle}
              >
                Retype new password
              </label>
              <input
                id="reset-password-confirm"
                className="input"
                type="password"
                required
                autoComplete="new-password"
                placeholder="same password again"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setFormError(null);
                }}
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? "reset-password-error" : undefined}
                style={{ marginBottom: formError ? 8 : 10, width: "100%" }}
              />
              {formError ? (
                <p id="reset-password-error" role="alert" style={fieldErrorStyle}>
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
                  "Update password · takes effect now"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
