import { useCallback, useEffect, useRef, useState } from "react";

/*
 * THE FACTS ABOUT ONE HOP, and the ids an engineer came here to carry away.
 *
 * ── WHAT WAS WRONG ──────────────────────────────────────────────────────
 * These were four module level style objects in the route file, and one of them
 * did real damage. Every fact was rendered into a 148px grid cell set to
 * `nowrap` with an ellipsis, which is fine for "1,204 tokens" and wrong for the
 * two longest strings on the surface: a 36 character span id and a model name
 * like `claude-sonnet-4-5-20260514` both truncated, so the identifier the reader
 * opened the page to copy was the one thing on it they could not read. The same
 * page printed the TRACE id in full, with a word break, three inches away.
 *
 * ── WHAT THE FIX IS ─────────────────────────────────────────────────────
 * An id is not a fact in a grid, it is a thing you take with you. It gets its
 * own full width line, it breaks rather than truncates, and it carries a copy
 * control, because reading 36 characters off a screen to retype them into a log
 * query is the failure this surface exists to prevent. Short facts keep the
 * grid and simply wrap instead of truncating, so a long model name stays legible
 * without a tooltip.
 *
 * ── COLOUR ──────────────────────────────────────────────────────────────
 * None of it. These atoms carry labels, values and one control, and every one
 * of those is a neutral. The only hue on this surface belongs to outcome, and
 * outcome is composed by the caller.
 */

/** The label above a fact, a section, or an id. One atom, so a section heading
 *  and a field heading can never drift apart by six pixels. */
export function FactLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-mrd-3 text-[11px] font-medium text-mrd-mute">{children}</div>;
}

/*
 * The 148px floor is a real layout knob rather than a taste value: below it the
 * shortest pair (a label and a duration) starts wrapping, and above it a six
 * fact row drops to two columns on a laptop. It is stated once, here.
 */
export function Facts({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-mrd-6 gap-y-mrd-5 [grid-template-columns:repeat(auto-fit,minmax(148px,1fr))]">
      {children}
    </div>
  );
}

export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <FactLabel>{label}</FactLabel>
      {/* Wraps. It used to truncate, and a truncated model name is a wrong
          answer rendered confidently. */}
      <div className="text-[13px] leading-mrd-snug break-words text-mrd-ink">{children}</div>
    </div>
  );
}

/**
 * Copy, guarded on both sides.
 *
 * `navigator.clipboard` is undefined outside a secure context and the write can
 * be refused, so a button that assumes either reports a success that did not
 * happen. The pass colour is spent on "Copied" because that is an outcome that
 * actually occurred, which is the only thing that colour is allowed to mean.
 */
export function CopyButton({ value, what }: { value: string; what: string }) {
  const [copied, setCopied] = useState(false);
  const resetAt = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetAt.current), []);

  const copy = useCallback(() => {
    if (!value || !navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        window.clearTimeout(resetAt.current);
        resetAt.current = window.setTimeout(() => setCopied(false), 1500);
      },
      () => setCopied(false),
    );
  }, [value]);

  return (
    <button
      type="button"
      aria-label={`Copy the ${what}`}
      onClick={copy}
      className={`flex h-6 shrink-0 items-center rounded-mrd-xs px-1.5 text-[11px] font-medium transition-colors duration-100 hover:bg-mrd-hover ${
        copied ? "text-mrd-pass" : "text-mrd-mute hover:text-mrd-ink"
      }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** An identifier: readable in full, breakable, and takeable. */
export function IdFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-mrd-5">
      <FactLabel>{label}</FactLabel>
      <div className="flex flex-wrap items-center gap-x-mrd-4 gap-y-mrd-2">
        <code className="min-w-0 font-mrd-mono text-[12px] break-all text-mrd-ink" title={value}>
          {value}
        </code>
        <CopyButton value={value} what={label.toLowerCase()} />
      </div>
    </div>
  );
}
