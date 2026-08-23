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

const SITE = "https://supaprod.ai";
const OG_IMAGE = `${SITE}/og-supaprod.png`;

export const Route = createFileRoute("/proof")({
  ssr: true,
  loader: async () => {
    const [calibration, decisions] = await Promise.all([
      getPublicCalibration(),
      listPublicDecisions(),
    ]);
    return { calibration, decisions };
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
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
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
        <span className="mono-label" style={{ fontSize: 9, color: "var(--ink-faint)" }}>
          the track record
        </span>
      </header>

      <main style={{ flex: 1, padding: "32px 18px" }}>
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
          color: "var(--ink-subtle)",
        }}
      >
        <span className="mono-label" style={{ fontSize: 9 }}>
          Made with Supaprod
        </span>
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
  const hasData = tableReady && total > 0 && rate !== null;
  return (
    <div className="bento rise-2" style={{ padding: "26px 24px", marginBottom: 22 }}>
      <div
        className="mono-label"
        style={{ fontSize: 9, color: "var(--ink-faint)", marginBottom: 10 }}
      >
        Calibration · updated live
      </div>
      {hasData ? (
        <>
          <h1
            className="font-display"
            style={{ fontSize: 28, lineHeight: 1.25, margin: "0 0 8px" }}
          >
            Supaprod called {hits} of the last {total} calls right.
          </h1>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--ink-muted)",
              margin: 0,
            }}
          >
            That is {Math.round(rate * 100)}%, including the misses. We publish this number because
            a competitor claiming 100% is a competitor not tracking outcomes at all.
          </p>
        </>
      ) : (
        <>
          <h1
            className="font-display"
            style={{ fontSize: 24, lineHeight: 1.25, margin: "0 0 8px" }}
          >
            Not enough recorded outcomes yet.
          </h1>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--ink-muted)",
              margin: 0,
            }}
          >
            This page updates automatically as calibrated outcomes land. We would rather show you an
            honest zero than a number that isn't real yet.
          </p>
        </>
      )}
      <div
        className="mono-label text-mrd-nano"
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--mrd-edge)",
          color: "var(--ink-subtle)",
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
        className="mono-label"
        style={{
          fontSize: 9,
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
            style={{ color: "var(--ink-muted)", margin: 0, lineHeight: 1.6 }}
          >
            No public decisions yet. Every one of these is a real call from Supaprod's own build,
            shared by its owner, receipt and all, never seeded or staged. That is why this section
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
              <div
                className="mono-label"
                style={{ fontSize: 9, color: "var(--ink-faint)" }}
              >
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
