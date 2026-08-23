import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Action } from "@/components/meridian/surface-parts";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/supaprod/AuthScaffold";

// Reset-request on the shared dark auth scaffold (auth_surfaces pass). Real
// flow unchanged: supabase resetPasswordForEmail → /reset-password recovery
// link. Security: the confirmation is deliberately neutral about whether the
// email exists (no user enumeration); Supabase returns success either way.

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Forgot password · Supaprod" }] }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function sendResetLink(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setFormError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const msg = authErrorMessage(error, "reset-request");
      setFormError(msg);
      return toast.error(msg);
    }
    setSent(true);
    toast.success("Check your email for the reset link");
  }

  return (
    <AuthScaffold
      screenLabel="Reset password"
      title="Reset your password"
      footer={
        <>
          Remembered it?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--mrd-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div style={{ textAlign: "center" }}>
          <p
            className="text-mrd-label"
            style={{
              color: "var(--mrd-mute)",
              margin: "4px 0 14px",
              lineHeight: "var(--mrd-lh-prose)",
            }}
          >
            If an account exists for{" "}
            <strong style={{ color: "var(--mrd-ink)" }}>{email}</strong>, the reset link is on
            its way.
          </p>
          <Action
            variant="default"
            className="w-full justify-center"
            onClick={() => setSent(false)}
          >
            Send again · same address
          </Action>
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
                Sending the link
              </>
            ) : (
              "Send reset link · lands in your inbox"
            )}
          </Action>
        </form>
      )}
    </AuthScaffold>
  );
}
