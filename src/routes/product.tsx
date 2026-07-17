/**
 * /product — the holistic product overview page
 *
 * Shows all six stations of the loop end-to-end: Discover, Decide, Define, Build, Ship, Learn.
 * Uses the alternating SectionAlternate pattern.
 * Landing v2 ink-and-starfield theme + backdrop applies throughout.
 *
 * Status: SHIPPED 2026-07-18 (v13 proof campaign phase 1)
 */

import { createFileRoute } from "@tanstack/react-router";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { SectionAlternate } from "@/components/landing/SectionAlternate";
import { FramedVisual } from "@/components/landing/FramedVisual";

const TITLE = "How Cadence Builds Your Product · Cadence";
const DESC =
  "Discover signals, decide what matters, define specs, build with agents, ship to production, then learn from outcomes. All in one loop, all receipts.";

export const Route = createFileRoute("/product")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const sections = [
    {
      station: "Discover",
      headline: "All your signals in one place",
      body: "Your Brain threads signals from 13+ tools into themes. No manual clustering. Human stays in the loop — every theme is a gate.",
      capabilities: ["LIVE SIGNALS", "THEME CLUSTERING", "HUMAN GATE", "PRECEDENT CHECK"],
      imagePath: "/images/discover.png",
      imageAlt: "The Discover surface: signal fabric and theme clustering",
    },
    {
      station: "Decide",
      headline: "Rank what actually matters",
      body: "Signals become bets. The Critic red-teams them. Past outcomes re-weight the score. You make the call. Every decision is recorded.",
      capabilities: ["ICE RANKING", "CRITIC TEARDOWN", "OUTCOME WEIGHTS", "PROOF LEDGER"],
      imagePath: "/images/decide.png",
      imageAlt: "The Decide surface: ICE-ranked bets and Critic teardowns",
    },
    {
      station: "Define",
      headline: "Specs that match reality",
      body: "Agents write PRDs from your decision. Acceptance tests compile to requirements. Architects check parity with design. Humans edit taste.",
      capabilities: ["PRD GENERATION", "ACCEPTANCE ORACLES", "LINEAGE TREE", "APPROVAL GATES"],
      imagePath: "/images/define.png",
      imageAlt: "The Define surface: PRD with lineage tree and design parity",
    },
    {
      station: "Build",
      headline: "Agents that code with receipts",
      body: "Specs compile to test plans. Agents write, debug, and merge PRs through your gates. CI is a receipt. Every line traces to the spec.",
      capabilities: ["SPEC COMPILATION", "AGENT BUILD LOOP", "CI RECEIPTS", "MERGE GATES"],
      imagePath: "/images/build.png",
      imageAlt: "The Build surface: mission trace with agent runs and CI status",
    },
    {
      station: "Ship",
      headline: "Launch packs for every stakeholder",
      body: "The changelog writes itself. Stakeholder packs brief the team. Release notes mirror what actually shipped. One truth.",
      capabilities: ["AUTO CHANGELOG", "STAKEHOLDER PACKS", "LAUNCH BRIEF", "RELEASE NOTES"],
      imagePath: "/images/ship.png",
      imageAlt: "The Ship surface: launch plans and changelog generation",
    },
    {
      station: "Learn",
      headline: "Outcomes that teach",
      body: "D+7 and D+14 windows grade the call. Learnings re-rank next bets. Playbooks write themselves from precedent. Your team gets smarter.",
      capabilities: ["OUTCOME WINDOWS", "LEARNING RECORDS", "PLAYBOOK GEN", "REINFORCED RANKING"],
      imagePath: "/images/learn.png",
      imageAlt: "The Learn surface: outcome ledger and playbook generation",
    },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen" data-obsidian>
      {/* Backdrop: grid + starfield (inherited from landing) */}
      <LandingBackdrop />

      <div className="relative z-[1]">
        {/* Hero section */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "1280px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "96px",
            paddingRight: "96px",
            paddingTop: "120px",
            paddingBottom: "80px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#71717a",
            }}
          >
            How it works
          </p>

          <h1
            style={{
              fontFamily: "var(--font-pixel, 'Geist Pixel Square')",
              fontSize: "64px",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "#f4f4f5",
              whiteSpace: "balance",
            }}
          >
            The six-station loop
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#a1a1aa",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            From market signal to shipped outcome, every step runs end-to-end. Agents handle the grunt. You handle the gates. Ledger records both.
          </p>
        </section>

        {/* Six showcase sections */}
        {sections.map((section, idx) => (
          <SectionAlternate
            key={section.station}
            index={idx}
            headline={section.headline}
            body={section.body}
            visual={
              <FramedVisual src={section.imagePath} alt={section.imageAlt} dimmed />
            }
            capabilities={section.capabilities}
          />
        ))}

        {/* Close section: CTA */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "640px",
            marginLeft: "auto",
            marginRight: "auto",
            paddingLeft: "96px",
            paddingRight: "96px",
            paddingTop: "120px",
            paddingBottom: "120px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-pixel, 'Geist Pixel Square')",
              fontSize: "48px",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "#f4f4f5",
            }}
          >
            Ready to run your loop?
          </h2>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "16px",
              lineHeight: 1.6,
              color: "#a1a1aa",
            }}
          >
            Join 100+ design partners building the next generation of product teams.
          </p>

          <button
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "12px 24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#FF6B2C",
              color: "#0a0a0a",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ff8344";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FF6B2C";
            }}
            onClick={() => {
              window.location.href = "/?signup=true";
            }}
          >
            Start free
          </button>
        </section>
      </div>
    </div>
  );
}
