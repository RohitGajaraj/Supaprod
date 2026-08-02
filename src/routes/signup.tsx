import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/supaprod/AuthScaffold";
import { recordAuthEvent } from "@/lib/observability/auth.functions";
import {
  planPresentation,
  CREDIT_DROPDOWN_TIERS,
  type PlanTier,
  type CreditTier,
} from "@/lib/entitlements";

// Sign-up on the shared dark auth scaffold (auth_surfaces pass). Creates the
// account with onboarded:false so the first-run flow (/onboarding) greets the
// new user. The REAL flow is unchanged (Supabase signUp + profiles upsert +
// Lovable Google OAuth + the /pricing plan-intent carry); this pass is
// presentation, form states, humanized error copy, and double-submit hardening.

// Only allow an internal absolute path as a post-signup destination, never an
// external or protocol-relative URL (open-redirect guard). Mirrors login.tsx; used
// by the invite flow (/signup?next=/join/<token>). /join is a top-level route, so
// the invite accepts before the onboarding gate runs.
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

// Purchasable tiers a /pricing CTA can carry into signup. "max" is internal,
// "free" and "enterprise" never send a plan param.
const PURCHASABLE_TIERS = ["pro", "team"] as const satisfies readonly PlanTier[];
type PurchasableTier = (typeof PURCHASABLE_TIERS)[number];

type SignupSearch = {
  next?: string;
  from?: string;
  plan?: PurchasableTier;
  credits?: CreditTier;
  billing?: "monthly" | "annual";
};

// The /pricing → /signup purchase intent (D-03): the params were previously
// dropped on the floor. Validate each strictly; anything malformed reads as
// no intent (never fake a plan pick).
function parsePlanIntent(search: Record<string, unknown>): Omit<SignupSearch, "next" | "from"> {
  const plan = PURCHASABLE_TIERS.find((t) => t === search.plan);
  if (!plan) return {};
  const credits = CREDIT_DROPDOWN_TIERS.find((c) => c === Number(search.credits));
  const billing =
    search.billing === "annual" || search.billing === "monthly" ? search.billing : undefined;
  return { plan, credits, billing };
}

export const Route = createFileRoute("/signup")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SignupSearch => ({
    ...(typeof search.next === "string" ? { next: search.next } : {}),
    ...(typeof search.from === "string" ? { from: search.from } : {}),
    ...parsePlanIntent(search),
  }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    // Already signed in: honor a purchase intent from /pricing by landing on
    // the plan section directly instead of dropping it at the front door.
    if (search.plan) {
      throw redirect({ to: "/settings", search: { section: "plan" } });
    }
    const dest = safeNextPath(search.next);
    if (dest === "/") throw redirect({ to: "/" });
    window.location.replace(dest);
  },
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up · Supaprod" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const { next, from, plan, credits, billing } = Route.useSearch();
  const dest = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const busy = loading || loadingGoogle;

  // PLG continuity: when the user arrives from a public funnel surface
  // (a shared teardown/decision or /pricing), carry that context into a
  // welcome line so the jump from "I saw a teardown" to "create account"
  // feels like one flow. Read-only; never changes the signup logic.
  const contextLine =
    from === "teardown"
      ? "Continue from the teardown you just read"
      : from === "decision"
        ? "Continue from the decision you just read"
        : from === "pricing"
          ? "Every plan starts free"
          : null;

  // The honest handoff for a /pricing pick: name it here, and confirm it on
  // the plan section after setup. No subscription exists until the user
  // upgrades there; this note never claims otherwise.
  const planPickLine = plan
    ? [
        `Your pick: ${planPresentation(plan).name}`,
        credits ? `${credits.toLocaleString()} credits a month` : null,
        billing ? `billed ${billing === "annual" ? "annually" : "monthly"}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setLoading(false);
      const msg = authErrorMessage(error, "signup");
      setFormError(msg);
      return toast.error(msg);
    }
    // Auto-confirm is on; session should be present. Mark the account
    // un-onboarded so the _authenticated gate routes it through /onboarding,
    // where the first step now captures name + role (the single identity-capture
    // surface shared with the Google path). onboarded stays false.
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id, onboarded: false }, { onConflict: "id" });
      // Non-fatal: the handle_new_user trigger seeds the profile row anyway;
      // surface the miss instead of swallowing it (audit D-30).
      if (profileError) console.error("profiles upsert after signup failed", profileError);
    }
    setLoading(false);
    toast.success("Account created");
    // AFD-04: identify plus the signup event, at the one moment the person has
    // just become a known account. This is the only place in the product that
    // calls identify(), so before this every event a PostHog project received
    // would have been a bare uuid with no traits behind it. Fire and forget;
    // the in-house record of the account is auth.users.created_at, and the
    // first workspace still gets its funnel_milestones row from the
    // trigger_funnel_signup trigger, so nothing here duplicates a ledger.
    void recordAuthEvent({
      data: { event: "signup_completed", method: "password", from, plan },
    });
    // Carry a /pricing purchase intent toward the plan section. First-run
    // accounts detour through /onboarding (the gate always wins); the pick
    // note above told the user where to confirm the plan.
    if (plan && dest === "/") {
      window.location.assign("/settings?section=plan");
      return;
    }
    if (dest === "/") navigate({ to: "/" });
    else window.location.assign(dest);
  }

  async function signupGoogle() {
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
      screenLabel="Sign up"
      title="Create your workspace"
      intro={contextLine}
      subhead={
        <>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-subtle)",
              marginTop: 10,
              lineHeight: 1.5,
              maxWidth: 290,
            }}
          >
            Free to start, no card required. Supaprod pressure-tests your calls and remembers every
            outcome.
          </p>
          {planPickLine ? (
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 8,
                lineHeight: 1.5,
                maxWidth: 290,
              }}
            >
              {planPickLine}. Confirm it in Settings under Plan once setup finishes; nothing is
              charged until you do.
            </p>
          ) : null}
        </>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--text-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign in
          </Link>
        </>
      }
    >
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={signupGoogle}
        disabled={busy}
        aria-busy={loadingGoogle || undefined}
        title={loading ? "Hold on, creating your account" : undefined}
      >
        {loadingGoogle ? (
          <>
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Opening Google
          </>
        ) : (
          "Continue with Google"
        )}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--hairline)" }}></span>
        <span className="mono-label" style={{ fontSize: 8.5 }}>
          or
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--hairline)" }}></span>
      </div>
      <form onSubmit={signup}>
        <label htmlFor="signup-email" className="mono-label" style={fieldLabelStyle}>
          Work email
        </label>
        <input
          id="signup-email"
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
          aria-describedby={formError ? "signup-error" : undefined}
          style={{ marginBottom: 10, width: "100%" }}
        />
        <label htmlFor="signup-password" className="mono-label" style={fieldLabelStyle}>
          Password
        </label>
        <div style={{ position: "relative", marginBottom: formError ? 8 : 10 }}>
          <input
            id="signup-password"
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
            aria-describedby={formError ? "signup-error" : undefined}
            style={{ width: "100%", paddingRight: 34 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="loom-press transition-colors hover:[color:var(--text-primary)]"
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
          <p id="signup-error" role="alert" style={fieldErrorStyle}>
            {formError}
          </p>
        ) : null}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy}
          aria-busy={loading || undefined}
          title={loadingGoogle ? "Hold on, opening Google" : undefined}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Creating your account
            </>
          ) : (
            "Create account · setup starts"
          )}
        </button>
      </form>
    </AuthScaffold>
  );
}
