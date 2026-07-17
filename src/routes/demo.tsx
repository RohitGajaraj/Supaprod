// PC-04 - the no-signup demo. Zero-auth, read-only view of the public demo
// workspace (docs/operations/demo-credentials.md). Every data call is a
// GET-only server function in demo.functions.ts with no mutation path at
// all - there is nothing on this page a visitor can change.
//
// Speaks the landing v2 ink language (founder 2026-07-15): the starfield
// canvas, zinc text, mono eyebrows, blue data numerals, agent voice in blue,
// ember reserved for the page's one ask. The header is the page's single
// piece of pinned chrome - it carries the brand, the read-only honesty tag,
// and the escape hatch. The footer scrolls on purpose: pinning a footer
// permanently spends viewport height that the artifacts need.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  getDemoOverview,
  getDemoTeardown,
  getDemoLedger,
  getDemoMissionTrace,
  type DemoOverview,
  type DemoTeardown,
  type DemoLedgerRow,
  type DemoMissionTrace,
} from "@/lib/demo.functions";
import { trackActivation } from "@/lib/activation.functions";

const TITLE = "Try Supaprod, no signup - a real demo workspace";
const DESC =
  "Walk through a real teardown, a real decision ledger, and a real mission trace. No account needed.";

// The three-voice grammar from the landing: agents speak blue, the human
// ask is the page's one ember object, verdicts keep their status tones.
const AGENT_BLUE = "#6cb0f5";
const VERDICT_COLOR: Record<string, string> = {
  ship: "#4ac26b",
  revise: "#d9a13c",
  kill: "#e5534b",
};

export const Route = createFileRoute("/demo")({
  ssr: true,
  loader: async () => {
    // Each pull degrades on its own: a failed section hides itself instead
    // of turning the whole demo into an error page for a prospect.
    const [overview, teardown, ledger, mission] = await Promise.all([
      getDemoOverview().catch(() => null),
      getDemoTeardown().catch(() => null),
      getDemoLedger().catch(() => [] as DemoLedgerRow[]),
      getDemoMissionTrace().catch(() => null),
    ]);
    return { overview, teardown, ledger, mission };
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DemoPage,
});

function useDemoSessionId() {
  const ref = useRef<string>("");
  if (!ref.current && typeof window !== "undefined") {
    const existing = window.sessionStorage.getItem("supaprod_demo_session");
    if (existing) {
      ref.current = existing;
    } else {
      ref.current = crypto.randomUUID();
      window.sessionStorage.setItem("supaprod_demo_session", ref.current);
    }
  }
  return ref.current;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-3">{children}</p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border border-white/[0.08] bg-[#0d0d0e] rounded-xl p-6">{children}</div>;
}

// Every section that summarizes a real artifact links into the full object:
// the demo is a hub into live pages, not a dead-end sheet.
function ArtifactLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex items-baseline gap-2 mt-4 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
    >
      <span>{children}</span>
      <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
    </a>
  );
}

function OverviewSection({ overview }: { overview: DemoOverview | null }) {
  if (!overview) return null;
  return (
    <section className="px-6 pb-14">
      <div className="max-w-5xl mx-auto">
        <Eyebrow>Today, in {overview.workspaceName}</Eyebrow>
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ letterSpacing: "-0.02em" }}>
          What Supaprod is watching right now.
        </h2>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {[
            [overview.openOpportunities, "open opportunities"],
            [overview.decisionsRecorded, "decisions on record"],
            [overview.missionsInFlight, "missions in flight"],
          ].map(([n, label]) => (
            <div key={label as string} className="flex items-baseline gap-2.5">
              <span
                className="text-2xl"
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontVariantNumeric: "tabular-nums",
                  // Blue data tone (the in-app PixelStat ruling), same as the
                  // landing's live counters.
                  color: AGENT_BLUE,
                }}
              >
                {n}
              </span>
              <span className="text-sm text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeardownSection({ teardown }: { teardown: DemoTeardown | null }) {
  if (!teardown) return null;
  const col = teardown.verdict ? (VERDICT_COLOR[teardown.verdict] ?? "#a1a1aa") : "#a1a1aa";
  return (
    <section className="px-6 pb-14">
      <div className="max-w-5xl mx-auto">
        <Eyebrow>A real teardown</Eyebrow>
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ letterSpacing: "-0.02em" }}>
          {stripAutoPrefix(teardown.title)}
        </h2>
        <Card>
          <div className="flex items-center gap-3 mb-4">
            {teardown.verdict ? (
              <span
                className="font-mono text-[10.5px] uppercase rounded-full px-3 py-0.5"
                style={{ color: col, border: `1px solid ${col}55`, letterSpacing: "0.06em" }}
              >
                {teardown.verdict}
              </span>
            ) : null}
            {teardown.iceScore !== null ? (
              <span className="text-xs text-zinc-600 font-mono">
                ICE {teardown.iceScore.toFixed(1)}
              </span>
            ) : null}
          </div>
          {teardown.summary ? (
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{teardown.summary}</p>
          ) : null}
          {teardown.risks.length > 0 ? (
            <div className="mb-3">
              <p className="text-[11px] text-zinc-600 mb-1.5">Risks</p>
              <ul className="m-0 pl-4 list-disc text-sm text-zinc-500">
                {teardown.risks.slice(0, 3).map((r) => (
                  <li key={r} className="mb-1 leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {teardown.missingEvidence.length > 0 ? (
            <div>
              <p className="text-[11px] text-zinc-600 mb-1.5">What you cannot prove yet</p>
              <ul className="m-0 pl-4 list-disc text-sm text-zinc-500">
                {teardown.missingEvidence.slice(0, 3).map((r) => (
                  <li key={r} className="mb-1 leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
        <ArtifactLink href="/p/teardown">Read a full public teardown, no signup</ArtifactLink>
      </div>
    </section>
  );
}

function LedgerSection({ ledger }: { ledger: DemoLedgerRow[] }) {
  if (ledger.length === 0) return null;
  return (
    <section className="px-6 pb-14">
      <div className="max-w-5xl mx-auto">
        <Eyebrow>The ledger</Eyebrow>
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ letterSpacing: "-0.02em" }}>
          Every call, on the record.
        </h2>
        <div className="border border-white/[0.08] bg-[#0d0d0e] rounded-xl overflow-hidden">
          {ledger.map((row, i) => (
            <div
              key={row.title + row.createdAt}
              className={`px-5 py-4 ${i < ledger.length - 1 ? "border-b border-white/[0.06]" : ""}`}
            >
              <div className="flex items-baseline gap-2.5 mb-1">
                <span className="text-sm text-zinc-100 font-medium">
                  {stripAutoPrefix(row.title)}
                </span>
                <span className="font-mono text-[9.5px] uppercase text-zinc-600">{row.status}</span>
              </div>
              {row.rationale ? (
                <p
                  className="text-[13px] text-zinc-500 leading-relaxed m-0"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {row.rationale}
                </p>
              ) : null}
              <p className="text-[11px] text-zinc-600 mt-1.5 m-0">
                <span style={{ color: AGENT_BLUE }}>{agentDisplayName(row.agentSlug)}</span>{" "}
                &middot;{" "}
                {new Date(row.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
        <ArtifactLink href="/proof">The whole trust ledger, wins and misses</ArtifactLink>
      </div>
    </section>
  );
}

function MissionSection({ mission }: { mission: DemoMissionTrace | null }) {
  if (!mission) return null;
  return (
    <section className="px-6 pb-16">
      <div className="max-w-5xl mx-auto">
        <Eyebrow>One mission, in motion</Eyebrow>
        <h2 className="text-2xl font-semibold text-white mb-6" style={{ letterSpacing: "-0.02em" }}>
          {stripAutoPrefix(mission.title)}
        </h2>
        <Card>
          <p
            className="font-mono text-[10.5px] uppercase mb-4"
            style={{ color: AGENT_BLUE, letterSpacing: "0.06em" }}
          >
            {mission.status}
          </p>
          {mission.steps.length === 0 ? (
            <p className="text-sm text-zinc-600 m-0">This mission has not dispatched a step yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {mission.steps.map((s, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span
                    className="text-[13px] font-medium shrink-0"
                    style={{ color: AGENT_BLUE, minWidth: 100 }}
                  >
                    {agentDisplayName(s.agentSlug)}
                  </span>
                  <span className="text-sm text-zinc-400 flex-1">{s.subGoal ?? "Working"}</span>
                  <span className="font-mono text-[10px] uppercase text-zinc-600">{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function DemoPage() {
  const { overview, teardown, ledger, mission } = Route.useLoaderData();
  const sessionId = useDemoSessionId();
  const fTrack = useServerFn(trackActivation);
  const [viewedTracked, setViewedTracked] = useState(false);

  useEffect(() => {
    if (viewedTracked || !sessionId) return;
    setViewedTracked(true);
    fTrack({ data: { event: "demo_viewed", sessionId } }).catch(() => {});
  }, [viewedTracked, sessionId, fTrack]);

  const onSignupClick = () => {
    if (sessionId) fTrack({ data: { event: "demo_to_signup", sessionId } }).catch(() => {});
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#0a0a0a] text-zinc-100"
      style={{ ...PUBLIC_INK_THEME, isolation: "isolate" }}
    >
      {/* The landing starfield, painted behind all content */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }} aria-hidden>
        <LandingBackdrop />
      </div>

      {/* The one pinned bar: brand, the read-only honesty tag, the escape
          hatch. Neutral CTA up here so the closing ask below keeps the
          page's single ember object (landing law 4.1b). */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/75 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <SupaprodMark size={22} />
            <span className="text-sm font-medium text-white">Supaprod</span>
          </Link>
          <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            read-only demo &middot; live seeded data
          </span>
          <a
            href="/signup"
            onClick={onSignupClick}
            className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
          >
            Join the beta
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-16 pb-14">
          <div className="max-w-5xl mx-auto">
            <h1
              className="text-3xl md:text-4xl text-white m-0"
              style={{ fontFamily: "var(--font-pixel)", fontWeight: 400, maxWidth: "24ch" }}
            >
              This is a real Supaprod workspace.
            </h1>
            <p
              className="text-lg text-zinc-400 leading-relaxed mt-5 mb-0"
              style={{ maxWidth: "58ch" }}
            >
              No login, nothing to set up. Everything below is live data from a seeded demo
              workspace: a real teardown, a real decision ledger, a real mission trace. You cannot
              break anything, so look around.
            </p>
          </div>
        </section>

        <OverviewSection overview={overview} />
        <TeardownSection teardown={teardown} />
        <LedgerSection ledger={ledger} />
        <MissionSection mission={mission} />

        {/* The close: this page's single ember object */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <a
              href="/signup"
              onClick={onSignupClick}
              className="inline-block px-8 py-3 rounded-full bg-[#FF6B2C] text-white font-medium hover:bg-[#ff8344] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              Tear down your own pet feature
            </a>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-4 mb-0">
              the beta is open for sign-ups
            </p>
          </div>
        </section>
      </main>

      {/* Scrolls with the page on purpose: the pinned job (orientation and
          the next step) belongs to the header; a fixed footer would spend
          viewport height the artifacts need. */}
      <footer className="border-t border-white/[0.07] px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-zinc-600 m-0">&copy; 2026 Supaprod</p>
          <div className="flex flex-wrap gap-5">
            {[
              { href: "/security", label: "Security" },
              { href: "/ard", label: "ARD" },
              { href: "/updates", label: "Changelog" },
              { href: "/proof", label: "Proof" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors no-underline"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
