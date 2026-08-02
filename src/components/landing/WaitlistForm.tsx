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
          <p className="text-zinc-400 text-sm mb-5" style={{ fontVariantNumeric: "tabular-nums" }}>
            Position <span className="text-white font-semibold">#{result.position}</span> of{" "}
            {result.total}. Each signup through your link moves you up.
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
      {/* One ember object in this viewport, and it is this button. */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Work email"
          className="flex-1 h-12 px-4 rounded-full bg-[#0d0d0e] border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus-visible:border-white/30 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-12 px-7 rounded-full bg-[#FF6B2C] text-white font-medium text-sm hover:bg-[#ff8344] active:scale-[0.98] transition-[background-color,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-60"
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
          className="w-full px-4 py-3 mb-5 rounded-xl bg-[#0d0d0e] border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus-visible:border-white/30 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] resize-none"
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
      <p className="text-[11px] leading-relaxed text-zinc-600 font-mono">
        First 100 get the Critic: our red-team agent tears your riskiest bet apart before you spend
        a sprint on it.
      </p>

      {waitlistCount != null && waitlistCount >= WAITLIST_NUDGE_FLOOR && (
        <p className="mt-2 text-[11px] font-mono text-zinc-600">
          <span className="text-zinc-400" style={{ fontVariantNumeric: "tabular-nums" }}>
            {waitlistCount.toLocaleString()}
          </span>{" "}
          already in line.
        </p>
      )}
    </form>
  );
}
