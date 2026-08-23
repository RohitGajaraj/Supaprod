// PC-04 - the no-signup demo. The film, and nothing else.
//
// ── WHAT THIS PAGE WAS UNTIL 2026-08-22, AND WHY IT STOPPED ─────────────────
//
// It rendered three live sections read out of the seeded demo workspace at
// request time: an overview with live counts, a decision history, and a
// mission trace. Founder ruling, 2026-08-22: keep the film, keep a line or two
// of description, remove the rest.
//
// THE PRIVACY ARGUMENT, STATED HONESTLY BECAUSE IT IS THE INTERESTING PART.
// No customer data was ever exposed. Those sections read one hardcoded id,
// DEMO_WORKSPACE_ID, which is `is_sample = true`, named "Sample sandbox", and
// holds eleven decisions about an invented savings product. Checked on the
// live database the day this changed.
//
// The SHAPE was the problem. This is an unauthenticated public page that
// reached the database through `supabaseAdmin`, the service-role client, which
// bypasses RLS by design. So the only thing standing between a public page and
// a real tenant's decision history was one constant continuing to be correct.
// There was no second line of defence behind it: no RLS, no is_sample check at
// the callsite, nothing that would fail closed if that id were ever repointed
// or that sandbox ever handed to a real person.
//
// Deleting the sections removes the risk rather than guarding it. This route no
// longer has a loader and makes no database call of any kind, which is a
// property a reader can verify by looking rather than a rule someone has to
// keep obeying.
//
// WHAT WAS KEPT AND WHY, following exactly what the teardown removal did on
// this same page four hours earlier. `getDemoOverview`, `getDemoLedger` and
// `getDemoMissionTrace` stay in demo.functions.ts, unread. They are read-only
// GET server functions over seeded data, and the deletion doctrine of
// 2026-08-19 is explicit that removing the data removes the evidence of the
// gap. Nothing calls them now. That is deliberate, and it mirrors what
// palette-retired-2026-08.md did with palette-catalog.ts.
//
// Speaks the landing v2 ink language (founder 2026-07-15): the starfield
// canvas, zinc text, mono eyebrows, ember reserved for the page's one ask.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { FILM_DURATION_LABEL, FilmPlayer } from "@/components/landing/FilmPlayer";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { trackActivation } from "@/lib/activation.functions";

const SITE = "https://supaprod.ai";
// THE TITLE AND DESCRIPTION FOLLOW THE PAGE. Both promised "a real decision
// history and a real mission trace" and "a live seeded workspace", which is
// what this page used to serve and no longer does. A meta description that
// describes the previous version of a page is the same defect as a stale
// header, except a search engine repeats it.
const TITLE = "Watch Supaprod run. No signup.";
const DESC =
  "Supaprod tells you what to build, builds it, ships it, then grades the call against the forecast you recorded before anyone knew the answer. Watch the whole loop in a film. No account needed.";

export const Route = createFileRoute("/demo")({
  ssr: true,
  // NO LOADER, deliberately, and this is the privacy fix rather than a tidy-up.
  // It fetched the demo workspace's overview, decisions and mission trace on
  // every request through the service-role client. The page shows the film now,
  // so it reads nothing.
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/demo` }],
  }),
  component: DemoPage,
});

function useDemoSessionId() {
  const ref = useRef<string>("");
  if (!ref.current && typeof window !== "undefined") {
    const existing = window.sessionStorage.getItem("supaprod_demo_session");
    if (existing) {
      ref.current = existing;
    } else {
      ref.current = crypto.randomUUID();
      window.sessionStorage.setItem("supaprod_demo_session", ref.current);
    }
  }
  return ref.current;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-mrd-nano font-mono uppercase tracking-widest text-zinc-600 mb-3">{children}</p>
  );
}

function DemoPage() {
  const sessionId = useDemoSessionId();
  const fTrack = useServerFn(trackActivation);
  const [viewedTracked, setViewedTracked] = useState(false);

  useEffect(() => {
    if (viewedTracked || !sessionId) return;
    setViewedTracked(true);
    fTrack({ data: { event: "demo_viewed", sessionId } }).catch(() => {});
  }, [viewedTracked, sessionId, fTrack]);

  const onSignupClick = () => {
    if (sessionId) fTrack({ data: { event: "demo_to_signup", sessionId } }).catch(() => {});
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0a0a0a] text-zinc-100"
      style={{ ...PUBLIC_INK_THEME, isolation: "isolate" }}
    >
      {/* The landing starfield, painted behind all content */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} aria-hidden>
        <LandingBackdrop />
      </div>

      {/* The one pinned bar: brand and the escape hatch. Neutral CTA up here so
          the closing ask below keeps the page's single ember object (landing
          law 4.1b).

          THE HONESTY TAG IS GONE WITH THE DATA IT WAS ABOUT. It read "read-only
          demo · live seeded data", which existed to tell a visitor that the
          numbers under it were real rows rather than a mockup. There are no
          numbers now, so the tag would be answering a question the page no
          longer raises. */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/75 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center no-underline text-white">
            <SupaprodWordmark tier="public" />
          </Link>
          <div className="flex items-center gap-4">
            {/* SIGN IN, ADDED 2026-08-22, BECAUSE THIS PAGE STRANDED THE PEOPLE
                WHO ALREADY HAVE ACCOUNTS. The landing nav has carried
                `Sign in -> /login` next to its beta CTA for weeks and this
                header never did, so an existing user who landed here had no
                door at all: every control pointed at a waitlist they are
                already past.

                It goes in the nav rather than beside the ask, which is
                Hero.tsx's standing rule and its reason: three doors under one
                button is what made the old hero unreadable. The nav is where a
                returning person looks for it, and it costs the ember CTA
                nothing. */}
            <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </a>
            {/* Pointed at /signup while signup was open. It is invite only from
                2026-08-07, and a demo visitor is by definition somebody who has
                not been invited yet: sending them to a form that asks for a code
                would end the best sales page we have on a locked door. The
                waitlist anchor on the landing page is where the ask now lands. */}
            <a
              href="/#join"
              onClick={onSignupClick}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              Request access
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* THE HEADING CHANGED WITH THE PAGE. It said "This is a real Supaprod
            workspace." and the paragraph under it said "Everything below is
            live data from a seeded demo workspace: a real decision history and
            a real mission trace." Both were true of the old page and neither is
            true of this one, and a page that opens by describing content that
            is not on it is worse than a page with no opening at all. */}
        <section className="px-6 pt-16 pb-10">
          <div className="max-w-5xl mx-auto">
            <h1
              className="text-3xl md:text-4xl text-white m-0"
              style={{ fontFamily: "var(--font-pixel)", fontWeight: 400, maxWidth: "24ch" }}
            >
              See the whole loop.
            </h1>
            {/* WHY THIS SENTENCE HAS TWO HALVES, and why the second one is the
                one that cannot be cut.

                The first draft read "what to build, built, shipped, then
                graded" and stopped there. Everything it named is the part any
                vendor can claim: the lifecycle. It left out the half the
                product is actually defensible on -- the forecast recorded at
                the moment of the call, before the outcome was known, which is
                what the grade is measured against and what makes the next call
                better than the last.

                Ordered so the forecast arrives BEFORE the grade, because that
                is the whole point of it. A forecast written after the fact is a
                summary; the claim here is that it was on the record first.

                Present tense describes the MECHANISM, not a body of learning
                already accumulated. The standing rule is that we never claim
                accrued learning in the present tense, and "guides the next one"
                is what the loop does with a settled forecast, which is wired
                and proven. */}
            <p
              className="text-lg text-zinc-400 leading-mrd-prose mt-5 mb-0"
              style={{ maxWidth: "58ch" }}
            >
              Supaprod tells you what to build, builds it, and ships it. Then it grades the call
              against the forecast you recorded before anyone knew the answer, and that is what
              guides the next one.
            </p>
          </div>
        </section>

        {/* THE FILM, ADDED 2026-08-12, AND NOW THE ONLY THING HERE.
            The landing hero's tertiary link read "Watch a real run" and pointed
            at this page for weeks while nothing on it moved: every section was
            live seeded DATA, which is not a run anybody can watch. The film was
            the moving answer. As of 2026-08-22 it is the whole answer. */}
        <section className="px-6 pb-14">
          <div className="mx-auto max-w-5xl">
            <Eyebrow>The film &middot; {FILM_DURATION_LABEL} &middot; sound on</Eyebrow>
            <FilmPlayer surface="demo" />
          </div>
        </section>

        {/* The close: this page's single ember object */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            {/* THIS CLOSE HAS NOW BEEN RULED ON THREE TIMES, and the third
                ruling takes away the answer the first two had found.

                It read "Tear down your own pet feature" and pointed at
                /p/teardown. Before that it required an account, which stopped
                being honest when signup shut on 2026-08-07. The teardown was
                the fix for that: the one thing a visitor could genuinely have
                this minute.

                2026-08-22 (founder) retired the public teardown, so the fix is
                gone and the page is back to asking. There is no third option to
                reach for -- every other door in this product needs an invite
                code -- so the close now says the true thing instead of
                inventing a softer one, and the invite ask is promoted from the
                line beneath the button into the button itself. Record:
                docs/decisions/public-teardown-retired-2026-08.md. */}
            <a
              href="/#join"
              onClick={onSignupClick}
              // text-[var(--cta-ink)]: white on ember is 2.84:1 and fails WCAG
              // AA. See the note on Hero.tsx's CTA.
              className="inline-block px-8 py-3 rounded-full bg-[var(--ember)] text-[var(--cta-ink)] font-medium hover:bg-[#ff8344] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              Join the beta
            </a>
            {/* THE TRAILING LINE IS GONE, and dropping it finishes a ruling
                rather than reversing one.

                It read "invite only · everything above is real and needs no
                login". The second half was a claim about the live sections, and
                there are none now, so it described a film as though it were
                data. That much is just rot.

                The first half went with it, on three grounds. The 2026-08-22
                ruling had already "promoted the invite ask from the line
                beneath the button into the button itself" -- this line is the
                residue that move left behind, not a separate decision. The
                header now says "Request access" and "Sign in" side by side,
                which states the gate in the place a person is actually deciding
                something. And the landing, which is the surface this page has
                to agree with, carries no invite-only caveat at all: two words in
                mono under a button is the weakest place on a page to put a
                fact, and it was the third statement of the same one. */}
          </div>
        </section>
      </main>

      {/* Scrolls with the page on purpose: the pinned job (orientation and
          the next step) belongs to the header; a fixed footer would spend
          viewport height the film needs. */}
      <footer className="border-t border-white/[0.07] px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-zinc-600 m-0">&copy; 2026 Supaprod</p>
          <div className="flex flex-wrap gap-5">
            {[
              { href: "/security", label: "Security" },
              { href: "/ard", label: "ARD" },
              { href: "/updates", label: "Changelog" },
              { href: "/proof", label: "Proof" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors no-underline"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
