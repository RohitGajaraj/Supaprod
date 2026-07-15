import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { joinWaitlist, trackLandingEvent, type JoinWaitlistResult } from "@/lib/landing.functions";

/**
 * The waitlist mechanic (plan section 7.1): email + the optional bet field.
 * The first 100 get their bet red-teamed by the Critic; sharing your link
 * moves you up the queue. Honeypot field for bots, no captcha.
 */
export function WaitlistForm() {
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
    mutationFn: (input: { email: string; betText?: string; referredBy?: string; website?: string }) =>
      joinWaitlist({ data: input }),
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
          <p className="text-zinc-400 text-sm mb-5">
            Position <span className="text-white font-semibold">#{result.position}</span> of{" "}
            {result.total}. Each signup through your link moves you up.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareLink}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-zinc-300 text-xs font-mono outline-none"
              aria-label="Your referral link"
            />
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(shareLink)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    void trackLandingEvent({ data: { event: "referral_share" } });
                  })
                  .catch(() => {});
              }}
              className="h-10 px-4 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
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
        });
      }}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Work email"
          className="flex-1 h-12 px-4 rounded-full bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus-visible:border-[#FF6B2C]/60 transition-colors"
        />
        <button
          type="submit"
          disabled={mutation.isPending}
          className="h-12 px-7 rounded-full bg-[#FF6B2C] text-white font-medium text-sm hover:bg-[#ff8344] active:scale-[0.98] transition-all disabled:opacity-60"
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
          className="w-full px-4 py-3 mb-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-zinc-600 outline-none focus-visible:border-[#FF6B2C]/60 transition-colors resize-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowBet(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4 decoration-zinc-700 mb-3 transition-colors"
        >
          Add the bet you want red-teamed (optional)
        </button>
      )}

      {result && !result.ok && (
        <p className="text-sm text-red-400 mb-3" role="alert">
          {result.error}
        </p>
      )}

      <p className="text-xs text-zinc-600 font-mono">
        First 100 get their riskiest roadmap bet torn down by our red-team agent, the Critic. Each signup through your link moves you up.
      </p>
    </form>
  );
}
