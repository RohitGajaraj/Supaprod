import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { joinWaitlist, trackLandingEvent, type JoinWaitlistResult } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";

/**
 * The waitlist mechanic (plan section 7.1): email + the optional bet field.
 * Honeypot field for bots, no captcha.
 *
 * Quietened 2026-07-25 (founder: the close "shouldn't it be a little
 * subtle"). The offer used to end the page at full volume: a two-sentence
 * scarcity paragraph plus a stack of avatar orbs behind a headcount. On a page
 * whose whole argument is receipts, a growth tactic in the last viewport is
 * the one thing that reads as unearned. What is left is one mono line stating
 * what the first hundred actually get, and, once there is a real crowd, one
 * mono line counting it. No orbs: three abstract circles standing in for
 * people were decoration doing persuasion.
 */

// The count only motivates once it reads as a crowd; below the floor the
// offer line does the work alone (founder ruling 2026-07-15).
const WAITLIST_NUDGE_FLOOR = 2000;

// The floor below which the CONFIRMATION does not state the queue's size.
//
// Deliberately far below WAITLIST_NUDGE_FLOOR, because the two numbers are
// answering different questions. The nudge above has to read as a crowd to
// persuade a stranger who has not yet decided. This one only has to not read as
// EMPTY to somebody who has already committed, and that is a much lower bar: a
// queue of a few hundred is respectable to the person standing in it, while a
// queue of two tells them they are early in the way that means abandoned.
const QUEUE_SIZE_FLOOR = 250;

export function WaitlistForm({ waitlistCount }: { waitlistCount: number | null }) {
  const [email, setEmail] = useState("");
  const [bet, setBet] = useState("");
  const [showBet, setShowBet] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot: humans never see it
  const [referredBy, setReferredBy] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get("r");
      if (r) setReferredBy(r);
    } catch {
      // no-op
    }
  }, []);

  const mutation = useMutation({
    mutationFn: (input: {
      email: string;
      betText?: string;
      referredBy?: string;
      website?: string;
      sessionKey?: string;
    }) => joinWaitlist({ data: input }),
  });

  const result = mutation.data as JoinWaitlistResult | undefined;
  const joined = result?.ok === true;

  if (joined && result.ok) {
    const shareLink = `${window.location.origin}/?r=${result.referralCode}`;
    return (
      <div className="max-w-md">
        <div className="rounded-xl border border-white/10 bg-[#0d0d0e] p-6">
          <p className="text-white text-lg font-medium mb-1">
            {result.alreadyJoined ? "You are already in line." : "You are in line."}
          </p>
          {/* "Position #2 of 2" PUBLISHED THE LIST SIZE, and on launch day that
              is the one number a visitor must not be handed. It told every early
              signup that the queue they just joined has two people in it, which
              reads as nobody wants this, and it did so at the single most
              persuadable moment on the site. The founder caught it live on
              2026-08-07 at exactly two rows.

              The denominator is not deleted, it is FLOORED, which is the same
              rule getLandingStats already applies to the social-proof counter on
              the close beat. Below the floor the total is simply not stated;
              above it the total is the thing worth saying and it appears. No
              number here is ever inflated or invented, so the claims law holds
              either way: we withhold a true number, we never publish a false one.

              The position itself always shows. It is the thing the person asked
              for, it is the thing the referral mechanic acts on, and it is
              flattering rather than damaging when small. */}
          <p className="text-zinc-400 text-sm mb-5" style={{ fontVariantNumeric: "tabular-nums" }}>
            You are <span className="text-white font-semibold">#{result.position}</span>
            {result.total >= QUEUE_SIZE_FLOOR ? ` of ${result.total}` : ""} in line. Each signup
            through your link moves you up.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 h-10 px-3 rounded-lg bg-[#0d0d0e] border border-white/10 text-zinc-300 text-xs font-mono outline-none"
              aria-label="Your referral link"
            />
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(shareLink)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    void trackLandingEvent({
                      data: { event: "referral_share", sessionKey: getLandingSessionKey() },
                    });
                  })
                  .catch(() => {});
              }}
              className="h-10 px-4 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        if (mutation.isPending) return;
        mutation.mutate({
          email,
          betText: bet || undefined,
          referredBy,
          website: website || undefined,
          // Read on submit, never at render, so the form server renders without
          // touching sessionStorage. The join succeeds either way: the key only
          // decides whether the waitlist_join event can be tied to the visit.
          sessionKey: getLandingSessionKey(),
        });
      }}
    >
      {/* THE REFERRAL LINK USED TO DO NOTHING VISIBLE. `?r=` was read into
          state and posted correctly with the join, so the mechanic worked, but
          the page it landed on was byte-identical to the cold one. That breaks
          the loop at both ends: the person who shared has no evidence their link
          did anything, and the person who arrived is given no reason to finish
          rather than wander off. A queue-bump nobody can see is not a mechanic,
          it is a database column.

          Deliberately anonymous. We hold a referral CODE, never the referrer's
          name, and inventing one ("Rohit invited you") would be a claim about a
          person we cannot support. Saying what is true, that somebody's link
          brought them here and finishing the form credits it, is both honest and
          the part that actually motivates. */}
      {referredBy ? (
        <p className="text-zinc-400 text-sm mb-4">
          Someone shared this with you. Joining here moves them up the queue.
        </p>
      ) : null}

      {/* One ember object in this viewport, and it is this button. */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Work email"
          className="flex-1 h-12 px-4 rounded-full bg-[#0d0d0e] border border-white/10 text-white text-sm placeholder:text-zinc-400 outline-none focus-visible:border-white/30 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          // text-[var(--mrd-sheet)]: white on ember is 2.84:1 and fails WCAG AA.
          // See the note on Hero.tsx's CTA. This is the site's only conversion
          // form, so it is the worst place to carry the failure.
          className="h-12 px-7 rounded-full bg-[#FF6B2C] text-[var(--mrd-sheet)] font-medium text-sm hover:bg-[#ff8344] active:scale-[0.98] transition-[background-color,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-60"
        >
          {mutation.isPending ? "Joining..." : "Join the beta"}
        </button>
      </div>

      {/* Honeypot: visually hidden, tab-skipped. Bots fill it, humans never see it. */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        placeholder="Website"
      />

      {showBet ? (
        <textarea
          value={bet}
          onChange={(e) => setBet(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="The product bet you are least sure about"
          aria-label="The product bet you are least sure about (optional)"
          className="w-full px-4 py-3 mb-5 rounded-xl bg-[#0d0d0e] border border-white/10 text-white text-sm placeholder:text-zinc-400 outline-none focus-visible:border-white/30 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] resize-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowBet(true)}
          className="inline-block text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 mb-5 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          Add the bet you want red-teamed (optional)
        </button>
      )}

      {result && !result.ok && (
        <p className="text-sm text-[#e5534b] mb-4" role="alert">
          {result.error}
        </p>
      )}

      {/* The offer, stated once, in the metadata voice: what the first hundred
          get, not how few are left. Mono, 11px, zinc-600 (founder 2026-07-25). */}
      <p className="text-mrd-tiny leading-mrd-prose text-zinc-400 font-mono">
        First 100 get the Critic: our red-team agent tears your riskiest bet apart before you spend
        a sprint on it.
      </p>

      {waitlistCount != null && waitlistCount >= WAITLIST_NUDGE_FLOOR && (
        <p className="mt-2 text-mrd-tiny font-mono text-zinc-400">
          <span className="text-zinc-400" style={{ fontVariantNumeric: "tabular-nums" }}>
            {waitlistCount.toLocaleString()}
          </span>{" "}
          already in line.
        </p>
      )}
    </form>
  );
}
