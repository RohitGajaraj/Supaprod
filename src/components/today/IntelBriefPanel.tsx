// RPT-46: "What changed upstream". The daily upstream intelligence brief,

// surfaced with receipts. Reads the latest market / competitor / tech-shift

// briefs the researcher-tick and scout-tick already write into `signals`, and

// reveals the contributing raw signals (artifact_lineage, relation

// `derived-from`) behind an "N receipts" affordance. Gate-resilient: renders an

// honest empty state while the live feed is dormant, and the briefs the moment

// signals exist. Surface-only; no migration, no touching the tick machinery.

import { useQuery } from "@tanstack/react-query";

import { useServerFn } from "@tanstack/react-start";

import { useState } from "react";

import { Button, MonoLabel } from "@/components/obsidian";

import { listIntelligenceBriefs, type IntelBrief } from "@/lib/strategy-registry.functions";

import { relTimeCaps, withTimeout } from "@/components/discover/format";

import { SkeletonBar } from "@/components/discover/SkeletonBar";

const KIND_LABEL: Record<IntelBrief["kind"], string> = {
  market: "MARKET",

  competitor: "COMPETITOR",

  tech_shift: "TECH SHIFT",
};

/** Show the top few and let the rest expand on demand, so the section never



 * becomes a wall (matches StrategySection's anti-scroll idiom). */

const VISIBLE_BRIEFS = 3;

function KindPill({ kind }: { kind: IntelBrief["kind"] }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",

        letterSpacing: "0.08em",

        color: "var(--text-muted)",

        border: "1px solid color-mix(in srgb, var(--text-muted) 35%, transparent)",

        borderRadius: "var(--radius-pill)",

        padding: "1px 7px",
      }}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

function BriefCard({ brief, isLast }: { brief: IntelBrief; isLast: boolean }) {
  const [revealed, setRevealed] = useState(false);

  const hasReceipts = brief.receiptCount > 0;

  return (
    <div
      style={{
        display: "grid",

        gap: "6px",

        paddingBottom: "14px",

        borderBottom: isLast ? undefined : "1px solid var(--hairline-faint)",
      }}
    >
      <div className="flex items-center gap-2">
        <KindPill kind={brief.kind} />

        <span
          style={{
            fontFamily: "var(--font-mono)",

            letterSpacing: "0.08em",

            color: "var(--text-subtle)",
          }}
        >
          {relTimeCaps(brief.created_at)}
        </span>
      </div>

      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{brief.title}</div>

      {brief.content ? (
        <p
          className="text-label-12"

          style={{
            lineHeight: 1.6,

            color: "var(--text-body)",

            margin: 0,

            whiteSpace: "pre-wrap",
          }}
        >
          {brief.content}
        </p>
      ) : null}

      {hasReceipts ? (
        <div style={{ marginTop: "2px" }}>
          <Button
            variant="link"

            size="sm"

            onClick={() => setRevealed((v) => !v)}

            aria-expanded={revealed}

            style={{
              fontWeight: 500,

              padding: 0,
            }}
          >
            {revealed
              ? "Hide receipts"
              : `${brief.receiptCount} ${brief.receiptCount === 1 ? "receipt" : "receipts"}`}
          </Button>

          {revealed ? (
            <ul
              style={{
                listStyle: "none",

                margin: "8px 0 0",

                padding: 0,

                display: "grid",

                gap: "5px",
              }}
            >
              {brief.receipts.map((r) => (
                <li
                  key={r.id}

                  className="flex items-start gap-2 text-label-12"

                  style={{ color: "var(--text-muted)", lineHeight: 1.5 }}
                >
                  <span
                    aria-hidden="true"

                    style={{
                      width: 4,

                      height: 4,

                      borderRadius: 99,

                      background: "var(--text-faint)",

                      marginTop: "7px",

                      flexShrink: 0,
                    }}
                  />

                  <span style={{ minWidth: 0 }}>{r.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**



 * Mounted on the Plan surface (RPT-46). Compact, aligned to the standard Plan



 * container so it reads as one more Plan section below the fold.



 */

export function IntelBriefPanel() {
  const fBriefs = useServerFn(listIntelligenceBriefs);

  const [showAll, setShowAll] = useState(false);

  const briefsQ = useQuery({
    queryKey: ["plan-intel-briefs"],

    queryFn: () => withTimeout(fBriefs()),
  });

  const briefs = briefsQ.data ?? [];

  const shown = showAll ? briefs : briefs.slice(0, VISIBLE_BRIEFS);

  return (
    <section
      aria-label="What changed upstream"

      style={{
        maxWidth: "var(--container-standard)",

        width: "100%",

        margin: "0 auto",

        padding: "0 32px 64px",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h2
          style={{
            margin: 0,

            fontWeight: 600,

            color: "var(--text-primary)",

            lineHeight: 1.3,
          }}
        >
          What changed upstream
        </h2>

        <p style={{ margin: "3px 0 0", color: "var(--text-subtle)" }}>
          Daily market, competitor, and tech-shift briefs, each with its receipts
        </p>
      </div>

      <div className="material-medium" style={{ padding: "18px 20px" }}>
        {briefsQ.isLoading ? (
          <div className="grid gap-2" aria-label="Loading briefs" role="status">
            <SkeletonBar width="96px" height={14} />

            <SkeletonBar width="60%" height={13} />

            <SkeletonBar width="92%" />
          </div>
        ) : briefsQ.error ? (
          <div>
            <MonoLabel style={{ color: "var(--madder)" }}>Could not load briefs</MonoLabel>

            <p className="text-label-12" style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              {(briefsQ.error as Error).message}
            </p>

            <Button
              variant="secondary"

              style={{ marginTop: "12px" }}

              onClick={() => briefsQ.refetch()}
            >
              Retry
            </Button>
          </div>
        ) : briefs.length === 0 ? (
          <p
            className="text-label-12"
            style={{ lineHeight: 1.6, color: "var(--text-subtle)", margin: 0 }}
          >
            No briefs yet. Lands when a tracked surface actually changes; nothing to configure.
          </p>
        ) : (
          <div className="grid gap-3.5">
            {shown.map((b, i) => (
              <BriefCard key={b.id} brief={b} isLast={i === shown.length - 1} />
            ))}

            {briefs.length > VISIBLE_BRIEFS ? (
              <button
                type="button"

                aria-expanded={showAll}

                onClick={() => setShowAll((v) => !v)}

                // Border color rides a class: an inline `border` shorthand

                // would defeat the hover:[border-color:…] variant.

                className="loom-press w-full outline-none transition-colors [color:var(--text-muted)] [border-color:var(--hairline-strong)] hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"

                style={{
                  fontWeight: 500,

                  background: "transparent",

                  border: "1px solid",

                  borderRadius: "var(--radius-control)",

                  padding: "8px 14px",
                }}
              >
                {showAll ? "Show fewer" : `Show ${briefs.length - VISIBLE_BRIEFS} more`}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
