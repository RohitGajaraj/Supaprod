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
import { claimLandingSession } from "@/lib/landing.functions";
import {
  checkInviteCode,
  redeemInviteCode,
  normalizeInviteCode,
  checkWorkspaceInviteToken,
  tokenFromNextPath,
} from "@/lib/invites.functions";
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
// had just left: "/" is server-rendered with a loader query, ships
// Hero/TheGap/ThreeLayers/LoopWalkthrough/Receipts/TrustClose, hydrates, and
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
  /** The invite code, carried in the URL so an emailed link is one click. */
  invite?: string;
};

/**
 * Where the waitlist actually lives. It is an anchor on the marketing page's
 * close beat, not a route of its own (TrustClose.tsx owns `#join`), so anyone
 * turned away here is sent to a form and not to a page that has to be scrolled
 * before it offers anything.
 */
const REQUEST_ACCESS_HREF = "/#join" as const;

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
    // Normalised the same way the server normalises it, so a code that survived
    // an email client's soft wrap arrives in the field looking like the one on
    // the card. This is presentation only: the server re-normalises and is the
    // only thing that decides.
    ...(typeof search.invite === "string" ? { invite: normalizeInviteCode(search.invite) } : {}),
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
  const { next, from, plan, credits, billing, invite } = Route.useSearch();
  const dest = safeNextPath(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Seeded from ?invite= and then owned by the field. Prefilled and VISIBLE, not
  // carried invisibly in the URL: somebody who mistypes their own address and
  // comes back to the form has to be able to see the code is still there, and a
  // hidden input that silently gates the button is the shape that produces "it
  // just does nothing when I press it".
  const [inviteCode, setInviteCode] = useState(invite ?? "");
  const [inviteError, setInviteError] = useState<string | null>(null);
  // Which of the two screens this is. Derived rather than stored so pasting a
  // code swaps the explainer for the confirmation the instant it lands, and
  // clearing the field brings the explanation straight back. It says NOTHING
  // about whether the code is good; that verdict is the server's and arrives
  // later.
  const hasCode = inviteCode.trim().length > 0;
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

  /**
   * The gate, and it is a SERVER round trip every time.
   *
   * Nothing in this file knows what makes a code good. It cannot: the rules live
   * in the database (revoked, expired, exhausted) and the only thing that
   * crosses back is a verdict. That is deliberate rather than tidy. A gate the
   * browser can evaluate is a gate the browser can be edited past, and this one
   * is the difference between a chosen cohort and whoever wandered in.
   *
   * Returns true when the caller may go on and create an account.
   */
  async function passesGate(setBusyFalse: () => void): Promise<boolean> {
    // THE SECOND DOOR. A workspace invitation is its own proof of admission, and
    // for one evening it was not: gating signup walked somebody an existing
    // member had invited BY NAME straight into the code wall. That person is the
    // most vetted arrival the product gets, more so than anyone holding a code we
    // handed out, because a member staked their own workspace on them.
    //
    // The token is CHECKED, never trusted. `next` is a string anyone can type,
    // so it is treated as a claim and the server decides; an invented token
    // takes the same path as no token at all and falls through to the code gate
    // below. See checkWorkspaceInviteToken for why this cannot be read from the
    // browser (the invitee has no RLS read on their own invitation, on purpose)
    // and for the single bit it is allowed to disclose.
    const joinToken = tokenFromNextPath(next);
    if (joinToken) {
      const ws = await checkWorkspaceInviteToken({ data: { token: joinToken } }).catch(() => null);
      if (ws?.valid) return true;
      // Not valid, and deliberately silent about it. The invitation may simply
      // have expired, and this person still has a legitimate way in if they were
      // also given a code. Announcing "your invitation is dead" here would strand
      // them on a screen whose actual subject is a different credential.
    }

    const verdict = await checkInviteCode({ data: { code: inviteCode } }).catch(() => null);
    // A round trip that never landed is not a bad code and must not be dressed
    // as one. The person is told to try again, never told their code is wrong.
    if (!verdict) {
      setBusyFalse();
      const msg = "We could not check that code just now. Try again in a moment.";
      setInviteError(msg);
      toast.error(msg);
      return false;
    }
    if (!verdict.ok) {
      setBusyFalse();
      setInviteError(verdict.message);
      toast.error(verdict.message);
      return false;
    }
    return true;
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);
    setInviteError(null);
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    // Before signUp, never after. A code that is not ours must not leave an
    // account behind it, and the only way to guarantee that is to refuse before
    // the account exists rather than to clean up after it.
    if (!(await passesGate(() => setLoading(false)))) return;
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
    // THE USE IS SPENT HERE, and here is after the account exists.
    //
    // Ordering is the whole point. A signup that fails on a taken address, a
    // weak password or a network drop must not cost somebody a slot in a beta
    // that has a fixed number of them, and the only way to be sure is to spend
    // the use once there is an account to spend it on.
    //
    // AWAITED, not fired and forgotten. Two lines below this function navigates
    // the whole document, which cancels any request still in flight, and a
    // redemption lost that way is a code that quietly never runs out.
    //
    // A REFUSAL HERE IS NOT A FAILED SIGNUP. The account is already real. The
    // only way to reach a refusal at this point is that the last use went to
    // somebody else between the check above and this line, and telling a person
    // who has just created an account that they cannot have it would be the
    // unrecoverable half of the trade the whole gate is set up to avoid. They
    // get in, `uses` reads one short, and the founder can see the cohort against
    // the account list on /admin/invites.
    await redeemInviteCode({ data: { code: inviteCode } }).catch((redeemError: unknown) => {
      console.error("invite redemption after signup failed", redeemError);
    });
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
    setInviteError(null);
    setLoadingGoogle(true);
    // Google is a door too, and gating only the email form would have left the
    // louder of the two buttons open. Same server verdict, same refusal copy.
    if (!(await passesGate(() => setLoadingGoogle(false)))) return;
    // SPENT HERE, BEFORE THE HANDOFF, WHICH IS THE OPPOSITE OF THE EMAIL PATH,
    // and the difference is forced rather than chosen.
    //
    // The email path waits for the account because it can SEE the account
    // appear. This one cannot see anything: the SDK sets window.location to its
    // broker and the round trip returns at window.location.origin, a route this
    // file does not own and never runs again (see the redirect_uri note below).
    // There is no line after the account exists for a redemption to sit on.
    //
    // So the choice is spend now or never spend at all, and never spending
    // would mean a limited code with a Google user behind it never running out,
    // which is the failure the founder closed the door to prevent. Spending now
    // costs a use when somebody abandons the Google screen. That is why the
    // migration says `uses` counts REDEMPTIONS and not accounts: this is a
    // redemption, truthfully recorded, and when it costs a real person a slot
    // the fix is one edit to max_uses on /admin/invites.
    await redeemInviteCode({ data: { code: inviteCode } }).catch((redeemError: unknown) => {
      console.error("invite redemption before Google handoff failed", redeemError);
    });
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
      // of all in launch week. One line here, the identical line in login.tsx,
      // and one allow-list entry: all three together, or none of them.
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
          {/* This said "Free to start, no card required" while the door behind
              it was open, and both halves were true. Only one of them still is.
              The price has not changed and the availability has.
              The access fact is NOT restated here, though, because the panel at
              the top of the card carries it in full and a header that says the
              same thing is the label-sublabel-helper triplet this system bans.
              What is left is the half that is still true and that the panel does
              not say: what happens once you are in, and that it costs nothing. */}
          <p
            style={{
              fontSize: 12,
              color: "var(--mrd-mute)",
              marginTop: 10,
              lineHeight: "var(--mrd-lh-snug)",
              maxWidth: 290,
            }}
          >
            No card, now or at setup. Supaprod pressure-tests your calls and lets every outcome
            guide the next.
          </p>
          {planPickLine ? (
            <p
              style={{
                fontSize: 11.5,
                color: "var(--mrd-mute)",
                marginTop: 8,
                lineHeight: "var(--mrd-lh-snug)",
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
              color: "var(--mrd-body)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* THE NO-CODE SCREEN IS THE PRIMARY DESIGN, NOT THE ERROR PATH.
       *
       * Founder, 2026-08-07 20:41: "it cannot be just blank... currently, it is
       * only invite through, will notify you, don't worry, join the waitlist."
       *
       * Arithmetic backs the instruction. Every stranger who follows a link from
       * Product Hunt, an ad, a search result or the nav lands here holding
       * nothing, and only the handful of people we have personally emailed
       * arrive with a code. So the empty state is the MODAL state of this screen,
       * and building it as a red message that appears after a failed submit would
       * mean the version most visitors see is the one nobody designed.
       *
       * THE TONE IS THE REQUIREMENT, not a nicety. Three things have to land
       * before anything else on the page: access is invite only, that is
       * temporary and about our capacity rather than about them, and here is the
       * exact next thing to do. It has to read as "you are early" and never as
       * "you are not welcome", which is why it says what we are doing and why,
       * and puts the waitlist under the reader's thumb instead of in a footnote.
       *
       * TWO PRIMARY-WEIGHT BUTTONS END UP ON THIS SCREEN, and that breaks the
       * usual one-ember-object rule on purpose. The founder asked for the
       * waitlist to be "the obvious next action on the screen, not a footnote",
       * and for the visitor this panel is written for it IS the only action that
       * can succeed. The panel's border keeps the two from reading as a pair.
       *
       * NOTHING IS DISABLED. A greyed-out Create account would be the cheaper
       * way to make the waitlist the only live control and it would be the wrong
       * one: somebody with a code sitting on their clipboard has to be able to
       * paste it and go, and a disabled button with no explanation is how a
       * gated product reads as a broken one. */}
      {hasCode ? (
        <div
          style={{
            border: "1px solid var(--mrd-edge)",
            borderRadius: "var(--radius-card)",
            background: "var(--mrd-lift)",
            padding: "10px 12px",
            marginBottom: 14,
            fontSize: 12,
            lineHeight: "var(--mrd-lh-snug)",
            color: "var(--mrd-body)",
          }}
        >
          {/* Confirms the LINK WORKED and claims nothing beyond that. It has not
              been checked yet, so it does not get to say "valid": that verdict
              belongs to the server and arrives when the account is created. */}
          Your invite code is in the field below. We check it the moment you create the account.
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--mrd-edge)",
            borderRadius: "var(--radius-card)",
            background: "var(--mrd-lift)",
            padding: "14px 14px 12px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontSize: 13.5,
              color: "var(--mrd-ink)",
              margin: "0 0 6px",
              lineHeight: "var(--mrd-lh-snug)",
            }}
          >
            Invite only, for now
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--mrd-body)",
              margin: "0 0 12px",
              lineHeight: "var(--mrd-lh-prose)",
            }}
          >
            {/* 45 words down to 21, founder 2026-08-07: "it looks like a paragraph".
                He was right, and the tell was that the one line worth keeping was
                buried in the middle of it. "Not a no, a not yet" does the entire
                emotional job in five words: it tells a stranger they have not been
                rejected, which is the only thing this panel has to achieve. The
                sentence about looking after the first ones through was us
                explaining our reasoning to someone who did not ask for it. */}
            Not a no, a not yet. Leave your name and your code arrives the moment a place opens.
          </p>
          <a
            href={REQUEST_ACCESS_HREF}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            Join the waitlist
          </a>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--mrd-mute)",
              margin: "10px 0 0",
              lineHeight: "var(--mrd-lh-snug)",
            }}
          >
            Already have one? Paste it below. The whole invite link works too.
          </p>
        </div>
      )}

      {/* ABOVE BOTH BUTTONS, not inside the email form, because it gates both.
          Put in the form it would sit BELOW "Continue with Google", and the
          person who pressed Google first would be told to fill in a field they
          had not scrolled to yet. A gate has to be visible before the thing it
          gates. */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="signup-invite" className="mono-label" style={fieldLabelStyle}>
          Invite code
        </label>
        <input
          id="signup-invite"
          className="input"
          type="text"
          required
          // A code is not a word: no autocorrect, no capitalisation guess, no
          // browser offering last month's email address for it.
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="paste your code or invite link"
          value={inviteCode}
          onChange={(e) => {
            // Normalised on the way IN, which is what makes a pasted invite URL
            // work: the field shows the code it pulled out of the link rather
            // than leaving a URL sitting in a box labelled "code" for the person
            // to tidy up themselves. Same function the server runs, so what is on
            // screen is what will be checked.
            setInviteCode(normalizeInviteCode(e.target.value));
            setInviteError(null);
          }}
          aria-invalid={inviteError ? true : undefined}
          aria-describedby={inviteError ? "signup-invite-error" : "signup-invite-help"}
          style={{ width: "100%", marginBottom: 8 }}
        />
        {inviteError ? (
          <p id="signup-invite-error" role="alert" style={fieldErrorStyle}>
            {inviteError}{" "}
            <a
              href={REQUEST_ACCESS_HREF}
              style={{
                color: "var(--mrd-body)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Join the waitlist
            </a>
          </p>
        ) : (
          // NOT A DEAD END, in either state. Somebody who reaches this page
          // without a working code wanted the product enough to find the signup
          // form, which is the strongest signal the waitlist can collect, and
          // "invite only" with nothing after it throws that away at the exact
          // moment it is worth the most.
          <p
            id="signup-invite-help"
            style={{ fontSize: 11.5, color: "var(--mrd-mute)", margin: 0, lineHeight: "var(--mrd-lh-snug)" }}
          >
            Codes are not case sensitive, and pasting the whole invite link is fine.
          </p>
        )}
      </div>
      <Action
        variant="default"
        className="w-full justify-center"
        onClick={signupGoogle}
        disabled={busy}
        busy={loadingGoogle}
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
      </Action>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--mrd-edge)" }}></span>
        <span className="mono-label" style={{ fontSize: 8.5 }}>
          or
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--mrd-edge)" }}></span>
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
          <p id="signup-error" role="alert" style={fieldErrorStyle}>
            {formError}
          </p>
        ) : null}
        <Action
          variant="primary"
          type="submit"
          className="w-full justify-center"
          disabled={busy}
          busy={loading}
          title={loadingGoogle ? "Hold on, opening Google" : undefined}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Creating your account
            </>
          ) : (
            "Create account · setup starts"
          )}
        </Action>
      </form>
    </AuthScaffold>
  );
}
