// v6 Phase 3 — the public, anonymous shareable-decision page (the viral loop).
// /d/<share_slug> renders ONE decision that its owner made public. SSR loader +
// dynamic head() so a shared link gets a real preview (title + rationale). Data
// comes from getPublicDecision — a safe, minimal projection (no joins, no owner/
// workspace/linked ids); RLS only lets anon read is_public rows. Not under
// _authenticated, so it works with no session.
import { createFileRoute, Link } from "@tanstack/react-router";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { getPublicDecision } from "@/lib/decisions-share.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { PreSignupCTA } from "@/components/plg/PreSignupCTA";
import { stripAutoPrefix } from "@/components/plan/format";

const OG_IMAGE = "https://supaprod.ai/og-supaprod.png";

export const Route = createFileRoute("/d/$slug")({
  ssr: true,
  loader: async ({ params }) => ({
    decision: await getPublicDecision({ data: { slug: params.slug } }),
  }),
  head: ({ loaderData }) => {
    const d = loaderData?.decision;
    const title = d ? `${stripAutoPrefix(d.title)} · Supaprod` : "Decision · Supaprod";
    const desc = (d?.rationale?.trim() || "A product decision, shared from Supaprod.").slice(
      0,
      180,
    );
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: d ? stripAutoPrefix(d.title) : "A decision" },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: d ? stripAutoPrefix(d.title) : "A decision" },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: OG_IMAGE },
      ],
    };
  },
  component: PublicDecisionPage,
});

// Approved / rejected / pending IS the pass / fail / hold ladder Meridian already
// defines, so this stops being three ad-hoc hexes on the one page an outsider is
// shown as evidence. Every one renders its own word beside the dot, so the meaning
// survives greyscale and never rests on hue.
//
// Resolved: this page stamps data-mrd-pinned-dark, which pins --mrd-pass,
// --mrd-fail and --mrd-hold dark per answers/M14 production notes and guarded by
// pinned-dark-matches-root.test.ts.
const STATUS: Record<string, { label: string; color: string }> = {
  approved: { label: "Approved", color: "var(--mrd-pass)" },
  rejected: { label: "Rejected", color: "var(--mrd-fail)" },
  pending: { label: "Pending", color: "var(--mrd-hold)" },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mrd-pinned-dark
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        // Pinned dark, not var(--mrd-bg): PUBLIC_INK_THEME below feeds .bento
        // cards and .mono-label children fixed ink-family values, so an
        // adaptive Meridian ground would flip white under a light theme and
        // leave white text on white. The ground reads --paper from this same
        // element's spread (custom properties serve their own element), so it
        // pins dark with no raw colour. The public-pages fleet is dark-pinned
        // by convention.
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
          borderBottom: "1px solid var(--soft-stone)",
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
          <SupaprodMark />
          <span className="font-display text-mrd-prose">Supaprod</span>
        </Link>
        <span className="mrd-eyebrow whitespace-nowrap" style={{ color: "var(--mrd-faint)" }}>
          shared decision
        </span>
      </header>

      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: "32px 18px" }}>
        <div style={{ width: "100%", maxWidth: 620 }}>{children}</div>
      </main>

      <footer
        className="text-mrd-tiny"
        style={{
          borderTop: "1px solid var(--soft-stone)",
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

function PublicDecisionPage() {
  const { decision } = Route.useLoaderData();

  if (!decision) {
    return (
      <Shell>
        <div className="bento" style={{ padding: 24, textAlign: "center" }}>
          <div className="font-display text-mrd-h3" style={{ marginBottom: 6 }}>
            Not available
          </div>
          <p className="text-mrd-base" style={{ color: "var(--mrd-mute)", margin: 0 }}>
            This decision is private, or the link is no longer valid.
          </p>
        </div>
      </Shell>
    );
  }

  const who = agentDisplayName(decision.decided_by_agent_slug);
  // A status outside the ladder gets the quietest neutral rather than a borrowed
  // status hue: a word we cannot place must not claim an outcome.
  const st = STATUS[decision.status] ?? {
    label: decision.status,
    color: "var(--mrd-faint)",
  };
  const date = new Date(decision.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Shell>
      <div
        className="mrd-eyebrow whitespace-nowrap"
        style={{ color: "var(--mrd-faint)", marginBottom: 10 }}
      >
        Decision · {who} · {date}
      </div>
      {/* Declared display voice for this shared decision title per answers/R011 cluster 5: kept as declared, tuned against its own ground, not a stop. */}
      <h1 className="font-display" style={{ fontSize: 30, lineHeight: 1.2, margin: "0 0 14px" }}>
        {stripAutoPrefix(decision.title)}
      </h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <span
          className="mrd-eyebrow whitespace-nowrap text-mrd-nano"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: st.color,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 99,
              background: st.color,
              display: "inline-block",
            }}
          />
          {st.label}
        </span>
        {/* TRUST-SHARE: the honest provenance outcome — does this call still stand? */}
        <span
          className="mrd-eyebrow whitespace-nowrap text-mrd-nano"
          title={
            decision.outcome === "superseded"
              ? "A later decision superseded this one, shown for honest history."
              : "This decision still stands; nothing has superseded it."
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 99,
            color: decision.outcome === "superseded" ? "var(--mrd-mute)" : "var(--mrd-pass)",
            border: `1px solid ${decision.outcome === "superseded" ? "var(--soft-stone)" : "color-mix(in srgb, var(--mrd-pass) 35%, transparent)"}`,
          }}
        >
          {decision.outcome === "superseded" ? "Superseded" : "Still stands"}
        </span>
      </div>
      <div className="bento" style={{ padding: "var(--card-pad, 18px)" }}>
        <div
          className="mrd-eyebrow whitespace-nowrap"
          style={{ color: "var(--mrd-faint)", marginBottom: 8 }}
        >
          Why
        </div>
        <p
          className="text-mrd-prose"
          style={{
            lineHeight: 1.65,
            color: "var(--mrd-mute)",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {decision.rationale?.trim() || "No rationale was captured for this decision."}
        </p>
      </div>
      <p
        className="text-mrd-data"
        style={{
          color: "var(--mrd-mute)",
          marginTop: 18,
          lineHeight: 1.5,
        }}
      >
        {/* "remembers every outcome" understated the moat on the one page built to be
            shared. A filing cabinet remembers. The claim that is actually ours, and that
            the STILL STANDS chip above has already proved to the reader, is that the last
            outcome changes the next call. Doctrine: it learns and guides, it never
            remembers, stores or logs. */}
        A read-only snapshot of one product decision. Supaprod is the PM chief of staff that
        surfaces the calls, runs the reversible work, and lets what happened guide the next call.
      </p>

      <PreSignupCTA sourceType="decision" />
    </Shell>
  );
}
