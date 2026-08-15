import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, MonoLabel } from "./primitives";

export interface CallCardEvidence {
  src: string;
  text: string;
}

export interface CallCardProps {
  kind: string;
  expiry: string;
  title: string;
  body: string;
  ev: CallCardEvidence[];
  okLabel: string;
  noLabel: string;
  consequence: string;
  onOk: () => void;
  onNo: () => void;
  /** Optional third verb (the honest "Later"): a quiet tertiary action that
   * defers the call without answering it. Rendered only when both label and
   * handler are wired — never a dead button. */
  laterLabel?: string;
  onLater?: () => void;
  compact?: boolean;
  /** Loom v4 §3: the screen's ONE featured call carries the solid top-lit
   * ember CTA; every other card's approve is ember tint/line/text. */
  featured?: boolean;
  className?: string;
  /** Dim 17 click-to-open: when set, a single click (or Enter/Space) on the
   * card body opens the call's own detail. The Approve/Send-back buttons stop
   * propagation so they never also fire this. Omitted keeps the card
   * non-clickable (its other consumers, e.g. the mission slide-over). */
  onOpen?: () => void;
  /** Dim 17 trace-and-time tail: a quiet mono trace ref (faintest tone) and a
   * timestamp (a touch more present), rendered in the header meta row. Already
   * styled by the caller so the card stays presentational. */
  traceRef?: React.ReactNode;
  time?: React.ReactNode;
}

/**
 * The atomic unit of the one attention queue (README law 2). Pure: `onOk`
 * and `onNo` are called and nothing else - the surface owns removing the
 * card from the queue and syncing any linked mission.
 */
export const CallCard = React.forwardRef<HTMLDivElement, CallCardProps>(
  (
    {
      kind,
      expiry,
      title,
      body,
      ev,
      okLabel,
      noLabel,
      consequence,
      onOk,
      onNo,
      laterLabel,
      onLater,
      compact = false,
      featured = false,
      className,
      onOpen,
      traceRef,
      time,
    },
    ref,
  ) => {
    const clickable = Boolean(onOpen);
    // When the card is click-to-open, its action buttons must not also fire
    // the open. When it is not (the mission slide-over, the specimen), the
    // handlers stay referentially identical to the props so nothing downstream
    // changes.
    const handleOk = clickable
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          onOk();
        }
      : onOk;
    const handleNo = clickable
      ? (e: React.MouseEvent) => {
          e.stopPropagation();
          onNo();
        }
      : onNo;
    const handleLater =
      clickable && onLater
        ? (e: React.MouseEvent) => {
            e.stopPropagation();
            onLater();
          }
        : onLater;
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          clickable &&
            "loom-press cursor-pointer outline-none transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
          className,
        )}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `Open ${title}` : undefined}
        onClick={clickable ? () => onOpen?.() : undefined}
        onKeyDown={
          clickable
            ? (event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen?.();
                }
              }
            : undefined
        }
        style={{
          backgroundColor: "var(--surface-card-deep)",
          // Token-traced ember hairline (was rgba over a hardcoded hex).
          border: "1px solid color-mix(in srgb, var(--ember) 25%, transparent)",
          borderRadius: "var(--radius-card)",
          padding: compact ? "16px 18px" : "var(--density-card-pad) var(--density-card-pad-lg)",
          gap: "12px",
          // Loom v4 §2: raised decision cards catch the light; the featured
          // call also casts the ambient shadow.
          boxShadow: featured ? "var(--shadow-elevated)" : "var(--top-light)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className="inline-flex items-center"
            style={{
              border: "1px solid color-mix(in srgb, var(--ember) 25%, transparent)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px",
            }}
          >
            <MonoLabel tone="ember" style={{}}>
              {compact ? "YOUR CALL" : kind}
            </MonoLabel>
          </span>
          {/* Dim 17 trace-and-time tail: time first (a touch more present), then
            the expiry, then the faintest trace ref. */}
          <span className="flex items-center" style={{ gap: "10px" }}>
            {time}
            {expiry ? <MonoLabel tone="faint">{expiry}</MonoLabel> : null}
            {traceRef}
          </span>
        </div>

        <h3
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: compact ? "17px" : "var(--text-card-title)",
            fontWeight: 460,
            lineHeight: 1.3,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            lineHeight: 1.65,
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          {body}
        </p>

        {ev.length > 0 ? (
          <div className="flex flex-col gap-2">
            {ev.map((row) => (
              <div key={`${row.src}-${row.text}`} className="flex flex-col gap-1">
                <span
                  className="inline-flex w-fit items-center uppercase"
                  style={{
                    fontFamily: "var(--font-mono)",
                    // Source chips speak the one link role (U6): blossom is
                    // retired from links/citations, so text and hairline both
                    // derive from var(--link). color-mix keeps the chip's
                    // existing 0.25 hairline alpha without a hardcoded hex.
                    color: "var(--link)",
                    border: "1px solid color-mix(in srgb, var(--link) 25%, transparent)",
                    borderRadius: "var(--radius-pill)",
                    padding: "2px 8px",
                  }}
                >
                  {row.src}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--text-body)",
                  }}
                >
                  {row.text}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-3">
            <Button
              variant="accent"
              onClick={handleOk}
              className={featured ? "hover:brightness-110" : "hover:brightness-125"}
              style={
                featured
                  ? {
                      // §3: the one primary CTA is a top-lit gradient.
                      background:
                        "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
                      color: "var(--cta-ink)",
                    }
                  : {
                      // §3: everything else speaks ember as tint + line + text.
                      background: "var(--ember-tint)",
                      color: "var(--ember-text)",
                      border: "1px solid var(--ember-line)",
                    }
              }
            >
              {okLabel}
            </Button>
            <Button variant="secondary" onClick={handleNo}>
              {noLabel}
            </Button>
            {laterLabel && handleLater ? (
              <Button variant="tertiary" onClick={handleLater}>
                {laterLabel}
              </Button>
            ) : null}
          </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--text-subtle)",
            }}
          >
            {consequence}
          </span>
        </div>
      </div>
    );
  },
);
CallCard.displayName = "CallCard";
