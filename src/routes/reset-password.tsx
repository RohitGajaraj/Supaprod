import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { ACTION_LINK_FACE, Action } from "@/components/meridian/surface-parts";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/supaprod/AuthScaffold";

// Recovery-link landing on the shared dark auth scaffold (auth_surfaces pass).
// Real flow unchanged: a valid recovery link carries a session,
// updateUser({ password }) sets the new one and leaves the user signed in.
//
// D-09 (audit, preserved): no blanket beforeLoad redirect (it raced the
// recovery link and Supabase can consume the URL hash before the component
// reads it). Accept the recovery hash, an existing session, or the
// PASSWORD_RECOVERY / SIGNED_IN auth event as proof the form may show.

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset password · Supaprod" }] }),
});

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
    if (loading) return;
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
      const msg = authErrorMessage(error, "reset-update");
      setFormError(msg);
      return toast.error(msg);
    }
    setDone(true);
    toast.success("Password updated");
  }

  return (
    <AuthScaffold screenLabel="New password" title="Choose a new password">
      {done ? (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--mrd-mute)",
              margin: "4px 0 14px",
              lineHeight: "var(--mrd-lh-prose)",
            }}
          >
            Your password is updated. You are signed in with it now.
          </p>
          <Link
            to="/"
            className={`${ACTION_LINK_FACE.primary} w-full justify-center`}
          >
            Continue · opens your workspace
          </Link>
        </div>
      ) : canReset === null ? (
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Loader2
            size={16}
            className="animate-spin"
            aria-hidden="true"
            style={{ color: "var(--mrd-mute)" }}
          />
          <p
            style={{
              fontSize: 12.5,
              color: "var(--mrd-mute)",
              margin: "4px 0",
              lineHeight: "var(--mrd-lh-prose)",
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
              color: "var(--mrd-mute)",
              margin: "4px 0 14px",
              lineHeight: "var(--mrd-lh-prose)",
            }}
          >
            This reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className={`${ACTION_LINK_FACE.quiet} w-full justify-center`}
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
              aria-pressed={showPassword}
              className="loom-press transition-colors hover:[color:var(--mrd-ink)]"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--mrd-mute)",
                display: "flex",
              }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <label htmlFor="reset-password-confirm" className="mono-label" style={fieldLabelStyle}>
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
          <Action
            variant="primary"
            type="submit"
            className="w-full justify-center"
            disabled={loading}
            busy={loading}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Updating
              </>
            ) : (
              "Update password · takes effect now"
            )}
          </Action>
        </form>
      )}
    </AuthScaffold>
  );
}
