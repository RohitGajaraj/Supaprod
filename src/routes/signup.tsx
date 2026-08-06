import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/supaprod/AuthScaffold";
import { recordAuthEvent } from "@/lib/observability/auth.functions";
import { claimLandingSession } from "@/lib/landing.functions";
import { clearLandingSessionKey, peekLandingSessionKey } from "@/lib/landing-session";
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

// Where a signup with no `next` lands. NOT "/", which is the marketing landing.
//
// Pressing "Create account" used to hand the person straight back the page they
// had just left: "/" is server-rendered with five COUNT queries (getLandingStats),
// ships Hero/TheGap/ThreeLayers/LoopWalkthrough/Receipts/TrustClose, hydrates, and
// only THEN does a client effect in src/routes/index.tsx call getUser() and
// window.location.replace("/today") — a second full document load — after which the
// _authenticated gate sends a first-run account on to /onboarding. Two document
// loads and a marketing page in between, which reads as a signup that failed.
//
// Landing on /today runs that same gate chain inside ONE load: _authenticated's
// beforeLoad reads the session from localStorage, needsOnboarding() sees the
// onboarded:false row written below, and redirects to /onboarding in-router.
// Nothing about "/" changes — someone typing the domain still gets the landing page.
const SIGNED_IN_HOME = "/today" as const;

// Only allow an internal absolute path as a post-signup destination, never an
// external or protocol-relative URL (open-redirect guard). Mirrors login.tsx; used
// by the invite flow (/signup?next=/join/<token>). /join is a top-level route, so
// the invite accepts before the onboarding gate runs.
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return SIGNED_IN_HOME;
  if (next.startsWith("//") || next.startsWith("/\\")) return SIGNED_IN_HOME;
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
    // getUser() is inside the try; every redirect below is OUTSIDE it. Both
    // halves matter, and login.tsx:44-63 arrived at this exact shape first.
    //
    // The try: a stale refresh token left in a prior session's localStorage
    // makes getUser() THROW. This call was bare, so that throw rendered a route
    // error where the signup form should be — on the one surface a Product Hunt
    // visitor reaches before anything else, and the same class of first
    // impression failure this file was rewritten to remove. login.tsx already
    // carried the guard; signup did not, and it is the more expensive of the
    // two to lose.
    //
    // The redirects outside it: a TanStack `redirect` is a `Response`, not an
    // `Error` (router-core), so a try that wrapped them would have to be very
    // careful not to swallow real control flow. login.tsx:53-57 records that
    // exact bug leaving a signed-in visitor staring at a sign-in form. Keeping
    // the try around the one call that can fail makes it unreachable here.
    let signedIn = false;
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = !!data.user;
    } catch {
      // Treated as "not signed in", which is what the form below is for.
      return;
    }
    if (!signedIn) return;
    // Already signed in: honor a purchase intent from /pricing by landing on
    // the plan section directly instead of dropping it at the front door.
    if (search.plan) {
      throw redirect({ to: "/settings", search: { section: "plan" } });
    }
    // Already signed in and no invite to honor: into the workspace, in-router.
    // A real `next` is an opaque internal path, so reach it via the browser.
    const dest = safeNextPath(search.next);
    if (dest === SIGNED_IN_HOME) throw redirect({ to: SIGNED_IN_HOME });
    window.location.replace(dest);
  },
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up · Supaprod" }] }),
});

function SignupPage() {
  // No useNavigate here on purpose: every post-signup destination is a full
  // browser navigation, so the gate chain runs on a fresh document.
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
        // THE LAST LINE IN THIS FILE STILL POINTING AT THE MARKETING PAGE.
        // Every other post-signup destination was moved to SIGNED_IN_HOME; the
        // confirmation link was missed, so a confirming account would have been
        // dropped on "/" and paid the two-load detour documented above.
        //
        // It is dead today and that is why it was easy to miss. Re-measured
        // through the Lovable MCP on 2026-08-06: `auth.users` has 16 rows, 15
        // with an `email_confirmed_at`, 13 of those within 5 seconds of
        // `created_at`, newest signup 2026-07-25 — auto-confirm is on, so
        // Supabase is not sending this link to anyone. The one event that makes
        // it live again is a deploy that re-enables confirmation, which is
        // exactly the case this file's risk register already named, so it is
        // pointed at the same destination as the rest of the file rather than
        // left aimed at the page the rest of the file exists to skip.
        //
        // The session still arrives: our client sets only storage,
        // persistSession and autoRefreshToken (integrations/supabase/client.ts),
        // leaving `detectSessionInUrl` at the auth-js default of true
        // (@supabase/auth-js GoTrueClient DEFAULT_OPTIONS), so the tokens on
        // the return URL are consumed wherever it lands and the _authenticated
        // gate runs on /today the same way it does after a password signup.
        //
        // ONE THING THIS LINE CANNOT PROMISE ON ITS OWN: Supabase honours an
        // emailRedirectTo only if it matches the project's redirect allow-list,
        // and falls back to the Site URL otherwise. If /today is not on that
        // list the link lands on "/" — exactly where it landed before — so this
        // change cannot be worse than what it replaces, but it is not proven
        // better until confirmation is switched on and the allow-list checked.
        // That is a dashboard setting, not a code one.
        emailRedirectTo: `${window.location.origin}${SIGNED_IN_HOME}`,
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
    // The attribution seam. Everything this person did before this moment was
    // recorded against an anonymous session key in landing_events; this is the
    // moment that session becomes an account, and the only moment the two can
    // honestly be joined. One row, written once, and after that the browser
    // stops carrying the key at all.
    //
    // peek, never mint: somebody who arrived straight at /signup from an email
    // link has no landing session, and inventing one here would file a claim
    // that joins nothing.
    //
    // Fire and forget, and the session key is deliberately NOT added to the
    // signup_completed event above. That event goes to a vendor; this claim
    // stays first party. An anonymous join key is not something to hand to a
    // third party just because it is convenient to attach.
    //
    // KNOWN GAP, stated rather than hidden: the Google path below leaves the
    // page for the OAuth round trip and comes back on a different route, so it
    // never reaches this line and a Google signup is still unjoined. Closing it
    // means claiming from wherever the OAuth return lands, which is a different
    // surface and a separate change.
    const landingSession = peekLandingSessionKey();
    if (landingSession) {
      void claimLandingSession({ data: { sessionKey: landingSession } })
        .then(() => clearLandingSessionKey())
        .catch(() => {
          // The claim is the only thing that failed. The account exists, the
          // person is signed in, and nothing about the signup changes.
        });
    }
    // Carry a /pricing purchase intent toward the plan section. First-run
    // accounts detour through /onboarding (the gate always wins); the pick
    // note above told the user where to confirm the plan.
    //
    // WHAT THIS CONDITION IS, EXACTLY, because it was described elsewhere as
    // "byte for byte" the old `dest === "/"` and it is not quite that. It
    // matches for every REACHABLE input and differs on two hand-typed URLs:
    // `?plan=pro&next=/` no longer fires it (safeNextPath returns "/" verbatim,
    // so the plan is dropped and the person lands on the marketing page), and
    // `?plan=pro&next=/today` now does. Neither shape is produced anywhere in
    // the product: the only link that sends a `next` to /signup is the invite
    // at join.$token.tsx:137-138 (`/join/<token>`; the sibling at :130-131 is
    // the same `next` aimed at /login), and /pricing sends
    // `?from=pricing` with no plan and no next on the free tier while every
    // paid tier goes to /checkout instead (pricing.tsx:481-485) — a grep for a
    // `plan=` producer aimed at /signup returns nothing at all, so this branch
    // is currently reachable only by typing the URL. Said out loud rather than
    // left as a difference someone rediscovers.
    if (plan && dest === SIGNED_IN_HOME) {
      window.location.assign("/settings?section=plan");
      return;
    }
    // One full document load, straight into the app. This used to be two arms:
    // an invite `next` got exactly this call, and everything else got an SPA
    // navigate to the marketing landing, which then reloaded itself into /today.
    // Both arms now do the same thing, and the gate chain inside that single
    // load routes a first-run account on to /onboarding (see SIGNED_IN_HOME).
    // Deliberately not the SPA transition: login.tsx records it hanging as an
    // empty Suspense tree mid gate-redirect on fresh accounts.
    window.location.assign(dest);
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
    // OAuth finished in place instead of leaving the page, which means
    // src/integrations/lovable already called setSession with the tokens. Same
    // rule as the email path above: land in the app, in one full navigation,
    // rather than on the marketing page. The usual case redirects away and comes
    // back at the OAuth callback URL (window.location.origin), so it never
    // reaches this line at all — the same round trip the KNOWN GAP note above
    // describes, and closing it is a change on whatever route the return lands on.
    window.location.assign(dest);
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
            Free to start, no card required. Supaprod pressure-tests your calls and lets every
            outcome guide the next.
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
