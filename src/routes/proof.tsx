// RPT-07 + RPT-30 — the public Trust Ledger / calibration scorecard.
// /proof renders the redacted public calibration score (getPublicCalibration)
// plus the most recent real public decisions (listPublicDecisions, seeded/demo
// workspaces excluded — docs/pitch/trust-ledger-launch-plan.md). SSR loader,
// no auth, same parchment shell as /d/$slug for a coherent public-page feel.
// Honest when sparse: a zero-decision or zero-outcome state is a real message,
// never a placeholder made to look like data.
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { getPublicCalibration } from "@/lib/proof-share.functions";
import { listPublicDecisions } from "@/lib/decisions-share.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { PreSignupCTA } from "@/components/plg/PreSignupCTA";
import { stripAutoPrefix } from "@/components/plan/format";
import { calibrationClaim } from "@/components/landing/calibration-claim";

const SITE = "https://supaprod.ai";
const OG_IMAGE = `${SITE}/og-supaprod.png`;

export const Route = createFileRoute("/proof")({
  ssr: true,
  /**
   * A PUBLIC PAGE MAY NOT 500 BECAUSE A READ FAILED.
   *
   * This loader awaited both calls bare, so one rejection took the whole page
   * to "This page hit an error. Something went wrong while loading this page."
   * Reproduced through the render harness on 2026-08-27, on the committed
   * version and on this one identically, so it predates both.
   *
   * `computePredictionHitRate` and `listPublicDecisions` both already catch and
   * return an empty shape. `computeSupersessionsCaught` does not, and it calls
   * `sampleWorkspaceIds()` before its own error check, so an unreachable
   * database rejects `getPublicCalibration` and the page is gone.
   *
   * The route is the right place to decide this rather than the reader: the
   * page ALREADY has an honest state for "we cannot say", it is what
   * `tableReady: false` renders, and a page whose whole argument is that we
   * publish numbers we cannot dress up should degrade to that sentence rather
   * than to a stack trace. `Promise.allSettled` and not two try/catches,
   * because a failure in one must never decide the other: the decision list
   * can render while the score cannot, and the reverse.
   */
  loader: async () => {
    const [cal, dec] = await Promise.allSettled([getPublicCalibration(), listPublicDecisions()]);
    return {
      calibration:
        cal.status === "fulfilled"
          ? cal.value
          : {
              predictionHitRate: { rate: null, hits: 0, total: 0, tableReady: false },
              supersessionsCaughtTotal: 0,
            },
      decisions: dec.status === "fulfilled" ? dec.value : [],
    };
  },
  head: () => ({
    meta: [
      { title: "The track record · Supaprod" },
      {
        name: "description",
        content:
          "Supaprod's own calibration score and public decision history. Published, including the misses.",
      },
      { property: "og:title", content: "The track record" },
      {
        property: "og:description",
        content: "We publish our own calibration score. Including the misses.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The track record · Supaprod" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE}/proof` }],
  }),
  component: ProofPage,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd-pinned-dark
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--mrd-bg)",
        color: "var(--ink)",
        isolation: "isolate",
        ...PUBLIC_INK_THEME,
      }}
    >
      {/* The landing starfield/grid, painted above this root's background
          but below all content (negative z inside the isolated root). */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} aria-hidden>
        <LandingBackdrop />
      </div>
      <header
        style={{
          borderBottom: "1px solid var(--mrd-edge)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <SupaprodWordmark tier="public" />
        </Link>
        <span className="mrd-eyebrow whitespace-nowrap" style={{ color: "var(--mrd-faint)" }}>
          the track record
        </span>
      </header>

      <main style={{ flex: 1, padding: "32px 18px" }}>
        {/* 680px stays: this column holds the decision CARDS as well as the
            prose, and narrowing it to a reading measure would squeeze the
            evidence. The three prose blocks inside carry `--mrd-measure`
            themselves, which is what meridian.css means by "prose only, never
            a table or a row". */}
        <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>{children}</div>
      </main>

      <footer
        className="text-mrd-tiny"
        style={{
          borderTop: "1px solid var(--mrd-edge)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "var(--mrd-mute)",
        }}
      >
        <span className="mrd-eyebrow whitespace-nowrap">Made with Supaprod</span>
        <Link to="/" className="btn btn-ghost btn-sm">
          Make your own calls →
        </Link>
      </footer>
    </div>
  );
}

function CalibrationHero({
  hits,
  total,
  rate,
  tableReady,
  supersessions,
}: {
  hits: number;
  total: number;
  rate: number | null;
  tableReady: boolean;
  supersessions: number;
}) {
  /*
   * THREE STATES, AND THE MIDDLE ONE IS THE ADDITION. This page's own argument
   * is "we would rather show you an honest zero than a number that isn't real
   * yet", and it then published a percentage the moment `total > 0`. Measured
   * live on 2026-08-27 with the sample workspaces excluded: FOUR scored
   * outcomes. "That is 50%" from four observations is noise wearing a percent
   * sign, on the one page built to prove we do not do that. See
   * calibration-claim.ts for the threshold and why it is ten.
   */
  const claim = calibrationClaim({ hits, total, rate, tableReady });
  return (
    <div className="bento rise-2" style={{ padding: "26px 24px", marginBottom: 22 }}>
      <div
        className="mrd-eyebrow whitespace-nowrap"
        style={{ color: "var(--mrd-faint)", marginBottom: 10 }}
      >
        Calibration · updated live
      </div>
      {/* Declared display voice for this page's hero verdict per answers/R011
          cluster 5: tuned against its own ground, not a stop. The empty state
          keeps its smaller size, because a sentence about having nothing is not
          the thing this page is here to say. */}
      <h1
        className="font-display"
        style={{ fontSize: claim.kind === "none" ? 24 : 28, lineHeight: 1.25, margin: "0 0 8px" }}
      >
        {claim.headline}
      </h1>
      <p
        className="text-mrd-prose"
        style={{
          lineHeight: 1.6,
          color: "var(--mrd-mute)",
          margin: 0,
          maxWidth: "var(--mrd-measure)",
        }}
      >
        {claim.body}
      </p>
      <div
        className="mrd-eyebrow whitespace-nowrap text-mrd-nano"
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--mrd-edge)",
          color: "var(--mrd-mute)",
        }}
      >
        {supersessions} decision{supersessions === 1 ? "" : "s"} caught and corrected by a later
        call
      </div>
    </div>
  );
}

function ProofPage() {
  const { calibration, decisions } = Route.useLoaderData();
  const { predictionHitRate, supersessionsCaughtTotal } = calibration;

  return (
    <Shell>
      <CalibrationHero
        hits={predictionHitRate.hits}
        total={predictionHitRate.total}
        rate={predictionHitRate.rate}
        tableReady={predictionHitRate.tableReady}
        supersessions={supersessionsCaughtTotal}
      />

      {/* <h2>, not <div>. Same accessibility correction as /pricing, 2026-08-07:
       * this page had one <h1> and no headings under it, so the one section
       * boundary on the page was invisible to assistive technology.
       *
       * The colour also moves off --ink-faint, which measures 2.56:1 on #0a0a0a
       * and fails even the 3:1 large-text floor, let alone the 4.5:1 this 9px
       * text needs. --text-subtle is 4.51:1 and was already defined. */}
      <h2
        className="mrd-eyebrow whitespace-nowrap"
        style={{
          color: "var(--mrd-mute)",
          margin: "0 0 12px",
          fontWeight: 500,
        }}
      >
        Recent public decisions
      </h2>

      {decisions.length === 0 ? (
        <div className="bento" style={{ padding: 24, textAlign: "center" }}>
          <p
            className="text-mrd-base"
            style={{
              color: "var(--mrd-mute)",
              margin: "0 auto",
              lineHeight: 1.6,
              maxWidth: "var(--mrd-measure)",
            }}
          >
            No public decisions yet. Every one of these is a real call from Supaprod's own build,
            shared by its owner with its evidence, never seeded or staged. That is why this section
            is honestly empty until one exists.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {decisions.map((d, i) => (
            <Link
              key={d.share_slug}
              to="/d/$slug"
              params={{ slug: d.share_slug }}
              className="bento rise-2"
              style={{
                padding: "14px 16px",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                animationDelay: `${Math.min(i, 8) * 45}ms`,
                transition: "transform 160ms var(--ease-out), border-color 160ms var(--ease-out)",
              }}
            >
              <div
                className="font-display"
                style={{ fontSize: 15, lineHeight: 1.35, marginBottom: 4 }}
              >
                {stripAutoPrefix(d.title)}
              </div>
              <div className="mrd-eyebrow whitespace-nowrap" style={{ color: "var(--mrd-faint)" }}>
                {agentDisplayName(d.decided_by_agent_slug)} ·{" "}
                {new Date(d.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </Link>
          ))}
        </div>
      )}

      <PreSignupCTA sourceType="proof" />
    </Shell>
  );
}
