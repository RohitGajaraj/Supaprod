// PC-04 - the no-signup demo. Zero-auth, read-only view of the public demo
// workspace (docs/operations/demo-credentials.md). Every data call is a
// GET-only server function in demo.functions.ts with no mutation path at
// all - there is nothing on this page a visitor can change. Matches the
// homepage's dark canvas (index.tsx) so the /signup CTA flow feels like one
// site, not a handoff to a different page.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CadenceMark } from "@/components/cadence/Primitives";
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

const TITLE = "Try Cadence, no signup - a real demo workspace";
const DESC =
  "Walk through a real teardown, a real decision ledger, and a real mission trace. No account needed.";

const C = {
  bg: "#07070f",
  bgCard: "rgba(255,255,255,0.034)",
  border: "rgba(255,255,255,0.07)",
  divider: "rgba(255,255,255,0.06)",
  ember: "#fb7100",
  emberBright: "#ff9542",
  emberGlow: "rgba(251,113,0,0.4)",
  emberDim: "rgba(251,113,0,0.12)",
  text: "#f8fafc",
  muted: "#94a3b8",
  faint: "#475569",
  green: "#4ade80",
  amber: "#fbbf24",
  rose: "#f87171",
};

const VERDICT_COLOR: Record<string, string> = {
  ship: C.green,
  revise: C.amber,
  kill: C.rose,
};

export const Route = createFileRoute("/demo")({
  ssr: true,
  loader: async () => {
    const [overview, teardown, ledger, mission] = await Promise.all([
      getDemoOverview(),
      getDemoTeardown(),
      getDemoLedger(),
      getDemoMissionTrace(),
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
    const existing = window.sessionStorage.getItem("cadence_demo_session");
    if (existing) {
      ref.current = existing;
    } else {
      ref.current = crypto.randomUUID();
      window.sessionStorage.setItem("cadence_demo_session", ref.current);
    }
  }
  return ref.current;
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
        fontSize: 9,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.emberBright,
        display: "block",
        marginBottom: 10,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        background: C.bgCard,
        borderRadius: 14,
        padding: "22px 24px",
      }}
    >
      {children}
    </div>
  );
}

function OverviewSection({ overview }: { overview: DemoOverview }) {
  return (
    <section style={{ padding: "0 24px 40px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Tag>Today, in {overview.workspaceName}</Tag>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
          What Cadence is watching right now.
        </h2>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {[
            [overview.openOpportunities, "open opportunities"],
            [overview.decisionsRecorded, "decisions on record"],
            [overview.missionsInFlight, "missions in flight"],
          ].map(([n, label]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
                  fontSize: 22,
                  fontWeight: 700,
                  color: C.emberBright,
                }}
              >
                {n}
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeardownSection({ teardown }: { teardown: DemoTeardown | null }) {
  if (!teardown) return null;
  const col = teardown.verdict ? (VERDICT_COLOR[teardown.verdict] ?? C.muted) : C.muted;
  return (
    <section style={{ padding: "0 24px 40px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Tag>A real teardown</Tag>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
          {stripAutoPrefix(teardown.title)}
        </h2>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {teardown.verdict ? (
              <span
                style={{
                  fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
                  fontSize: 10.5,
                  color: col,
                  border: `1px solid ${col}55`,
                  borderRadius: 99,
                  padding: "3px 11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {teardown.verdict}
              </span>
            ) : null}
            {teardown.iceScore !== null ? (
              <span style={{ fontSize: 12, color: C.faint }}>
                ICE {teardown.iceScore.toFixed(1)}
              </span>
            ) : null}
          </div>
          {teardown.summary ? (
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: "0 0 16px" }}>
              {teardown.summary}
            </p>
          ) : null}
          {teardown.risks.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: C.faint, margin: "0 0 6px" }}>Risks</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13 }}>
                {teardown.risks.slice(0, 3).map((r) => (
                  <li key={r} style={{ marginBottom: 4, lineHeight: 1.5 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {teardown.missingEvidence.length > 0 ? (
            <div>
              <p style={{ fontSize: 11, color: C.faint, margin: "0 0 6px" }}>
                What you cannot prove yet
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.muted, fontSize: 13 }}>
                {teardown.missingEvidence.slice(0, 3).map((r) => (
                  <li key={r} style={{ marginBottom: 4, lineHeight: 1.5 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}

function LedgerSection({ ledger }: { ledger: DemoLedgerRow[] }) {
  if (ledger.length === 0) return null;
  return (
    <section style={{ padding: "0 24px 40px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Tag>The Ledger</Tag>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
          Every call, on the record.
        </h2>
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${C.border}`,
            background: C.bgCard,
            overflow: "hidden",
          }}
        >
          {ledger.map((row, i) => (
            <div
              key={row.title + row.createdAt}
              style={{
                padding: "14px 20px",
                borderBottom: i < ledger.length - 1 ? `1px solid ${C.divider}` : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 13.5, color: C.text, fontWeight: 550 }}>
                  {stripAutoPrefix(row.title)}
                </span>
                <span
                  style={{
                    fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
                    fontSize: 9.5,
                    color: C.faint,
                    textTransform: "uppercase",
                  }}
                >
                  {row.status}
                </span>
              </div>
              {row.rationale ? (
                <p
                  style={{
                    fontSize: 12.5,
                    color: C.muted,
                    margin: 0,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {row.rationale}
                </p>
              ) : null}
              <p style={{ fontSize: 11, color: C.faint, margin: "6px 0 0" }}>
                {agentDisplayName(row.agentSlug)} ·{" "}
                {new Date(row.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionSection({ mission }: { mission: DemoMissionTrace | null }) {
  if (!mission) return null;
  return (
    <section style={{ padding: "0 24px 56px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Tag>One mission, in motion</Tag>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: "0 0 16px" }}>
          {stripAutoPrefix(mission.title)}
        </h2>
        <Card>
          <p
            style={{
              fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
              fontSize: 10.5,
              color: C.emberBright,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 14px",
            }}
          >
            {mission.status}
          </p>
          {mission.steps.length === 0 ? (
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>
              This mission has not dispatched a step yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mission.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.emberBright,
                      minWidth: 100,
                    }}
                  >
                    {agentDisplayName(s.agentSlug)}
                  </span>
                  <span style={{ fontSize: 13, color: C.muted, flex: 1 }}>
                    {s.subGoal ?? "Working"}
                  </span>
                  <span
                    style={{
                      fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
                      fontSize: 10,
                      color: C.faint,
                      textTransform: "uppercase",
                    }}
                  >
                    {s.status}
                  </span>
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
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "12px 24px",
          background: "rgba(7,7,15,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.divider}`,
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none" }}
          >
            <span style={{ color: "rgba(255,255,255,0.9)", display: "inline-flex" }}>
              <CadenceMark size={20} tile={false} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 550, color: C.text }}>Cadence</span>
          </Link>
          <a
            href="/signup"
            className="btn btn-primary btn-sm"
            style={{ textDecoration: "none" }}
            onClick={onSignupClick}
          >
            Start free
          </a>
        </div>
      </header>

      {/* Sticky banner: honest about being a demo, one clear next step. */}
      <div
        style={{
          position: "sticky",
          top: 53,
          zIndex: 40,
          padding: "10px 24px",
          background: C.emberDim,
          borderBottom: `1px solid ${C.border}`,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 12.5, color: C.text }}>
          You are in the demo, read-only, seeded data.{" "}
        </span>
        <a
          href="/signup"
          onClick={onSignupClick}
          style={{ fontSize: 12.5, color: C.emberBright, fontWeight: 600, textDecoration: "none" }}
        >
          Make it yours &rarr;
        </a>
      </div>

      <main style={{ flex: 1, paddingTop: 40 }}>
        <section style={{ padding: "0 24px 32px", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "clamp(26px,3.6vw,38px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
              }}
            >
              This is a real Cadence workspace.
            </h1>
            <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.65, margin: 0 }}>
              No login, nothing to set up. Everything below is real data from a seeded demo
              workspace: a real teardown, a real decision ledger, a real mission trace.
            </p>
          </div>
        </section>

        <OverviewSection overview={overview} />
        <TeardownSection teardown={teardown} />
        <LedgerSection ledger={ledger} />
        <MissionSection mission={mission} />

        <section style={{ padding: "0 24px 64px", textAlign: "center" }}>
          <a
            href="/signup"
            className="btn btn-primary"
            style={{ textDecoration: "none" }}
            onClick={onSignupClick}
          >
            Tear down your own pet feature (free)
          </a>
        </section>
      </main>

      <footer style={{ padding: "16px 24px", borderTop: `1px solid ${C.divider}` }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {[
            { href: "/security", label: "Security" },
            { href: "/ard", label: "ARD" },
            { href: "/updates", label: "Changelog" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ fontSize: 10.5, color: C.faint, textDecoration: "none" }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
