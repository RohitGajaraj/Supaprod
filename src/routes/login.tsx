import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { authErrorMessage } from "@/lib/auth-errors";
import { Action } from "@/components/meridian/surface-parts";
import { AuthScaffold, fieldLabelStyle, fieldErrorStyle } from "@/components/supaprod/AuthScaffold";
import { recordAuthEvent } from "@/lib/observability/auth.functions";

// Sign-in on the shared dark auth scaffold (auth_surfaces pass). The REAL auth
// flow is unchanged (Supabase password + Lovable Google OAuth); this pass is
// presentation, form states, humanized error copy, and double-submit
// hardening. Reference deviations kept: SAML SSO button omitted (no SAML in
// production); consequence-first submit label.

// Where a sign-in with no `next` lands. NOT "/", which is the marketing landing:
// it server-renders five COUNT queries, ships the whole pitch, hydrates, and only
// then does a client effect in src/routes/index.tsx notice the session and
// window.location.replace("/today") — so signing in cost a second full document
// load and put the page you signed in FROM on screen in between. /today is the
// first rail row and the workspace's own home; the _authenticated gate still runs
// on arrival and sends an unfinished first-run account to /onboarding. Nothing
// about "/" changes: someone typing the domain still gets the landing page.
const SIGNED_IN_HOME = "/today" as const;

// Only allow an internal absolute path as a post-login destination, never an
// external or protocol-relative URL (open-redirect guard). Used by the invite
// flow, which sends a logged-out invitee to /login?next=/join/<token> so they
// land back on the accept page after signing in.
function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/")) return SIGNED_IN_HOME;
  if (next.startsWith("//") || next.startsWith("/\\")) return SIGNED_IN_HOME;
  return next;
}

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === "string" ? { next: search.next } : {},
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    let signedIn = false;
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = !!data.user;
    } catch {
      // Suppress stale refresh-token errors from a prior session's
      // localStorage. The form below handles a fresh sign-in attempt cleanly.
      return;
    }
    if (!signedIn) return;
    // The redirect is thrown OUTSIDE that try on purpose. It used to be thrown
    // inside it, under a catch that re-threw only when `error instanceof Error`
    // — and a TanStack redirect is a `Response`, not an Error (router-core
    // redirect.ts), so the catch swallowed it and an already-signed-in visitor
    // was left looking at the sign-in form. Now it is real control flow.
    //
    // SPA redirect for the no-next case; a real `next` is an opaque internal
    // path, so navigate via the browser to reach it reliably.
    const dest = safeNextPath(search.next);
    if (dest === SIGNED_IN_HOME) throw redirect({ to: SIGNED_IN_HOME });
    window.location.replace(dest);
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · Supaprod" }] }),
});

function LoginPage() {
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
    // AFD-04: the funnel's actual entry, and it had nothing until now. Fire and
    // forget so a sign-in never waits on telemetry; the navigation below may cut
    // the request short, which is acceptable for an analytics forward and would
    // never be acceptable for a ledger write. The in-house record of this login
    // is auth.users.last_sign_in_at, which Supabase has already written.
    void recordAuthEvent({ data: { event: "login_succeeded", method: "password" } });
    // Always a full browser navigation, never the SPA transition. The SPA
    // path was observed live (SW-7 step-0 rerun, 2026-07-09) hanging as an
    // empty Suspense tree mid gate-redirect (/ -> /onboarding) on fresh
    // accounts - a hard blank screen until manual reload. A fresh document runs
    // the gate chain from a clean router (the authenticated tree is ssr:false,
    // so that chain is client-side either way) and lands correctly every time;
    // login is a full context switch, so the reload cost is right anyway.
    //
    // `dest` is /today unless an invite sent a `next`, so this is now one load
    // into the workspace instead of one into the landing page plus the reload
    // that page performs on itself.
    window.location.assign(dest);
  }

  async function signInGoogle() {
    if (busy) return;
    setFormError(null);
    setLoadingGoogle(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      // THE LAST PATH STILL PAYING THE TWO-LOAD DETOUR, AND IT IS LEFT THAT WAY
      // ON PURPOSE. The code half of this fix cannot ship without a dashboard
      // half, and shipping it alone breaks Google sign-in outright.
      //
      // First, what this line is NOT: it is not a destination someone aimed at
      // the marketing page. `@lovable.dev/cloud-auth-js@1.1.2` resolves
      // `opts.redirect_uri ?? window.location.origin`, so this IS the SDK
      // default, written down. Deleting the line changes nothing.
      //
      // What it costs. Outside an iframe the SDK sets `window.location.href` to
      // its same-origin broker (`DEFAULT_OAUTH_BROKER_URL`, "/~oauth/initiate")
      // and returns `{ redirected: true }`, which is why the
      // `window.location.assign(dest)` below is unreachable in the usual case.
      // The round trip comes back to this URL, "/", so pressing "Continue with
      // Google" renders the whole marketing landing, its loader query included,
      // and only then does the effect at index.tsx:161 notice the session and
      // `window.location.replace("/today")`. Two documents, on the button most
      // people press, and precisely the detour SIGNED_IN_HOME removes from the
      // email path above.
      //
      // Why it is not simply `${window.location.origin}${SIGNED_IN_HOME}`.
      // Whoever runs the broker decides which return URLs are acceptable, and
      // the broker is Lovable-hosted: nothing in this repo serves
      // /~oauth/initiate, so that set is neither readable nor changeable from
      // code. (A broker that returned tokens to any URL a caller named would be
      // an open redirect, so there is near-certainly a list. That is reasoning,
      // not something verified here.) If /today is not on it, Google sign-in
      // FAILS rather than detours, which is worse than one extra load and worst
      // of all in launch week. One line here, the identical line in signup.tsx,
      // and one allow-list entry: all three together, or none of them.
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoadingGoogle(false);
      return toast.error(authErrorMessage(result.error, "oauth"));
    }
    if (result.redirected) return;
    // Same rule as the email path: a full browser navigation, so the gate
    // chain can never strand a fresh account on a hung blank transition. And
    // `dest`, not a hardcoded "/", so an invitee who signs in with Google
    // without leaving the page still lands back on the accept page. The usual
    // case redirects away and returns at the OAuth callback URL instead, which
    // this line cannot reach.
    window.location.assign(dest);
  }

  return (
    <AuthScaffold
      screenLabel="Login"
      title="Welcome back"
      subhead={
        <p
          className="text-mrd-small"
          style={{
            color: "var(--mrd-mute)",
            marginTop: 10,
            lineHeight: "var(--mrd-lh-snug)",
            maxWidth: 290,
          }}
        >
          {/* "RECEIPTS" AND "CALLS" BOTH WENT, 2026-08-10, and this line survived
              two earlier sweeps because it is on the auth surface rather than
              inside the app.
              Measured across 5.72M words of real product-operator conversation:
              "receipts" appears 3.0 times per million and is dead in BOTH
              registers -- the only word in the sweep that fails on the marketing
              side and the in-product side at once. "Calls" is barely better here
              and collides with a phone call in the same breath as agents and
              runs; the shell header moved off it for the same reason. Against
              that, "decisions" is the single most common substantive term
              operators use at 562.8, and "evidence" at 50.9 is what a receipt
              actually IS.
              The sentence also stopped listing three nouns and started naming
              the sequence, because the loop's whole argument is that the three
              are connected: what you decided, what it rested on, what happened. */}
          Sign in. Your decisions, the evidence behind them, and what happened next.
        </p>
      }
      footer={
        <>
          {/* Said "New here? Create an account", which promised something the
              door stopped granting on 2026-08-07. The destination is UNCHANGED
              and that is deliberate: /signup now leads with the invite-only
              explanation and puts the waitlist under the reader's thumb, so it
              is the right landing for somebody with a code AND for somebody
              without one. Only the promise needed correcting. */}
          New here?{" "}
          <Link
            to="/signup"
            style={{
              color: "var(--mrd-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Create an account with an invite code
          </Link>{" "}
          ·{" "}
          <Link
            to="/forgot-password"
            style={{
              color: "var(--mrd-body)",
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
      <Action
        variant="default"
        className="w-full justify-center"
        onClick={signInGoogle}
        disabled={busy}
        busy={loadingGoogle}
        title={loadingEmail ? "Hold on, signing you in" : undefined}
      >
        {loadingGoogle ? (
          <>
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Opening Google
          </>
        ) : (
          "Continue with Google"
        )}
      </Action>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--mrd-edge)" }}></span>
        <span className="mono-label" style={{ fontSize: 8.5 }}>
          or
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--mrd-edge)" }}></span>
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
        {formError ? (
          <p id="login-error" role="alert" style={fieldErrorStyle}>
            {formError}
          </p>
        ) : null}
        <Action
          variant="primary"
          type="submit"
          className="w-full justify-center"
          disabled={busy}
          busy={loadingEmail}
          title={loadingGoogle ? "Hold on, opening Google" : undefined}
        >
          {loadingEmail ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Signing in
            </>
          ) : (
            "Sign in · opens your workspace"
          )}
        </Action>
      </form>
    </AuthScaffold>
  );
}
