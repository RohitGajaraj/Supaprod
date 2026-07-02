import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, MonoLabel, rgba } from "./primitives";

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
  compact?: boolean;
  className?: string;
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
      compact = false,
      className,
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      style={{
        backgroundColor: "var(--surface-card-deep)",
        border: `1px solid ${rgba("#FF6B2C", 0.25)}`,
        borderRadius: "var(--radius-card)",
        padding: compact ? "16px 18px" : "var(--density-card-pad) var(--density-card-pad-lg)",
        gap: "12px",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center"
          style={{
            border: `1px solid ${rgba("#FF6B2C", 0.25)}`,
            borderRadius: "var(--radius-pill)",
            padding: "3px 10px",
          }}
        >
          <MonoLabel tone="ember" style={{ fontSize: "9px" }}>
            {compact ? "YOUR CALL" : kind}
          </MonoLabel>
        </span>
        <MonoLabel tone="faint">{expiry}</MonoLabel>
      </div>

      <h3
        style={{
          fontFamily: "var(--font-serif)",
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
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
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
                  fontSize: "8.5px",
                  color: "var(--blossom)",
                  // No numeric alpha is given for a "blossom hairline" pill;
                  // reuses the one literal hairline alpha this component
                  // does have (the card's own ember border, 0.25) rather
                  // than inventing a distinct number.
                  border: `1px solid ${rgba("#E5BDDF", 0.25)}`,
                  borderRadius: "var(--radius-pill)",
                  padding: "2px 8px",
                }}
              >
                {row.src}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "12.5px",
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
          <Button variant="primary" onClick={onOk}>
            {okLabel}
          </Button>
          <Button variant="secondary" onClick={onNo}>
            {noLabel}
          </Button>
        </div>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-helper)",
            color: "var(--text-subtle)",
          }}
        >
          {consequence}
        </span>
      </div>
    </div>
  ),
);
CallCard.displayName = "CallCard";
