import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/cadence/AuthScaffold";

// Sign-in on the shared dark auth scaffold (auth_surfaces pass). The REAL auth
// flow is unchanged (Supabase password + Lovable Google OAuth); this pass is
// presentation, form states, humanized error copy, and double-submit
// hardening. Reference deviations kept: SAML SSO button omitted (no SAML in
// production); consequence-first submit label.

// Only allow an internal absolute path as a post-login destination, never an
// external or protocol-relative URL (open-redirect guard). Used by the invite
// flow, which sends a logged-out invitee to /login?next=/join/<token> so they
// land back on the accept page after signing in.
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === "string" ? { next: search.next } : {},
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const dest = safeNextPath(search.next);
    // Preserve the SPA redirect for the common (no-next) case; a real next is an
    // opaque internal path, so navigate via the browser to reach it reliably.
    if (dest === "/") throw redirect({ to: "/" });
    window.location.replace(dest);
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · Cadence" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const busy = loadingEmail || loadingGoogle;

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    setLoadingEmail(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoadingEmail(false);
    if (error) {
      const msg = authErrorMessage(error, "signin");
      setFormError(msg);
      return toast.error(msg);
    }
    toast.success("Welcome back");
    if (dest === "/") navigate({ to: "/" });
    else window.location.assign(dest);
  }

  async function signInGoogle() {
    if (busy) return;
    setFormError(null);
    setLoadingGoogle(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoadingGoogle(false);
      return toast.error(authErrorMessage(result.error, "oauth"));
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <AuthScaffold
      screenLabel="Login"
      title="Welcome back"
      subhead={
        <p
          style={{
            fontSize: 12,
            color: "var(--text-subtle)",
            marginTop: 10,
            lineHeight: 1.5,
            maxWidth: 290,
          }}
        >
          Sign in to your decision workspace. Your calls, the receipts, and the loop, in one place.
        </p>
      }
      footer={
        <>
          New here?{" "}
          <Link
            to="/signup"
            style={{
              color: "var(--text-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Create an account
          </Link>{" "}
          ·{" "}
          <Link
            to="/forgot-password"
            style={{
              color: "var(--text-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Forgot password?
          </Link>
          <br />
          Trouble signing in? Ask your workspace admin to check your invite.
        </>
      }
    >
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={signInGoogle}
        disabled={busy}
      >
        {loadingGoogle ? <Loader2 size={14} className="animate-spin" /> : "Continue with Google"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--hairline)" }}></span>
        <span className="mono-label" style={{ fontSize: 8.5 }}>
          or
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--hairline)" }}></span>
      </div>
      <form onSubmit={signInEmail}>
        <label htmlFor="login-email" className="mono-label" style={fieldLabelStyle}>
          Work email
        </label>
        <input
          id="login-email"
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
          aria-describedby={formError ? "login-error" : undefined}
          style={{ marginBottom: 10, width: "100%" }}
        />
        <label htmlFor="login-password" className="mono-label" style={fieldLabelStyle}>
          Password
        </label>
        <div style={{ position: "relative", marginBottom: formError ? 8 : 10 }}>
          <input
            id="login-password"
            className="input"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError(null);
            }}
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? "login-error" : undefined}
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
              color: "var(--text-subtle)",
              display: "flex",
            }}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {formError ? (
          <p id="login-error" role="alert" style={fieldErrorStyle}>
            {formError}
          </p>
        ) : null}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loadingEmail ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "Sign in · opens your workspace"
          )}
        </button>
      </form>
    </AuthScaffold>
  );
}
