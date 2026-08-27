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
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { LandingNav } from "@/components/landing/LandingNav";
import { SectionAlternate } from "@/components/landing/SectionAlternate";
import { FramedVisual } from "@/components/landing/FramedVisual";

const SITE = "https://supaprod.ai";
const TITLE = "How Supaprod Builds Your Product · Supaprod";
const DESC =
  "Discover signals, decide what matters, define specs, build with agents, ship to production, then learn from outcomes. All in one loop, all evidence.";

export const Route = createFileRoute("/product")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/product` },
      { property: "og:image", content: `${SITE}/og-supaprod.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content:
          "Supaprod: agents that own outcomes, not just output. Seven stations in orbit, the return path from Learn to Discover lit.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${SITE}/og-supaprod.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/product` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const sections = [
    {
      station: "Discover",
      headline: "All your signals in one place",
      body: "Your Brain threads signals from 13+ tools into themes. No manual clustering. Human stays in the loop: every theme is a gate.",
      capabilities: ["LIVE SIGNALS", "THEME CLUSTERING", "HUMAN GATE", "PRECEDENT CHECK"],
      imagePath: "/images/discover.png",
      imageAlt: "The Discover surface: signal fabric and theme clustering",
    },
    {
      station: "Decide",
      headline: "Rank what actually matters",
      body: "Signals become bets. The Critic red-teams them. Past outcomes re-weight the score. You make the call. Every decision is recorded.",
      capabilities: ["ICE RANKING", "CRITIC TEARDOWN", "OUTCOME WEIGHTS", "TRACK RECORD"],
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
      headline: "Agents that code with evidence",
      body: "Specs compile to test plans. Agents write, debug, and merge PRs through your gates. CI is the evidence. Every line traces to the spec.",
      capabilities: ["SPEC COMPILATION", "AGENT BUILD LOOP", "CI EVIDENCE", "MERGE GATES"],
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
      imageAlt: "The Learn surface: outcome history and playbook generation",
    },
  ];

  return (
    <div
      className="public-ink bg-[#0a0a0a] min-h-screen"
      style={{ ...PUBLIC_INK_THEME }}
      data-obsidian
    >
      {/* Backdrop: grid + starfield (inherited from landing) */}
      <LandingBackdrop />

      {/* This page had no chrome at all: no brand, no nav, no route home.
          Arriving here from search or a shared link left you with no way to
          tell whose product it is or where to go next. The shared landing nav
          carries the wordmark and the way back, so it matches every other
          public page. The hero's 120px top padding already clears it. */}
      <LandingNav />

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
            className="text-mrd-small"
            style={{
              fontFamily: "var(--mrd-mono)",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--mrd-mute)",
            }}
          >
            How it works
          </p>

          {/* Pixel brand face carries no type stop by design (R006), so the literal size is the only correct spelling. Kept as declared per answers/R011 cluster 5. */}
          <h1
            style={{
              fontFamily: "var(--font-pixel, 'Geist Pixel Square')",
              fontSize: "64px",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "var(--ink)",
              whiteSpace: "balance",
            }}
          >
            The six-station loop
          </h1>

          {/* Judged paragraph body, not a subheading: three sentences of copy at 1.6 measure, so it takes prose per answers/R011 cluster 3. */}
          <p
            className="text-mrd-prose"
            style={{
              fontFamily: "var(--mrd-font)",
              lineHeight: 1.6,
              color: "var(--mrd-mute)",
              maxWidth: "480px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            From market signal to shipped outcome, every step runs end-to-end. Agents handle the
            grunt. You handle the gates. The audit trail records both.
          </p>
        </section>

        {/* Six showcase sections */}
        {sections.map((section, idx) => (
          <SectionAlternate
            key={section.station}
            index={idx}
            headline={section.headline}
            body={section.body}
            visual={<FramedVisual src={section.imagePath} alt={section.imageAlt} dimmed />}
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
          {/* Pixel brand face carries no type stop by design (R006), so the literal size is the only correct spelling. Kept as declared per answers/R011 cluster 5. */}
          <h2
            style={{
              fontFamily: "var(--font-pixel, 'Geist Pixel Square')",
              fontSize: "48px",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "var(--ink)",
            }}
          >
            Ready to run your loop?
          </h2>

          {/* Judged paragraph body, not a subheading: plain supporting copy under the CTA heading, so it takes prose per answers/R011 cluster 3. */}
          <p
            className="text-mrd-prose"
            style={{
              fontFamily: "var(--mrd-font)",
              lineHeight: 1.6,
              color: "var(--mrd-mute)",
            }}
          >
            {/* "Join 100+ design partners" WAS NOT TRUE, and it sat one line above
                the CTA on the page a partner or an investor is most likely to be
                sent to. There are no hundred design partners. There is no source
                for the number anywhere in the codebase, no query behind it, and
                nothing that would make it true tomorrow.

                It is the same defect the /privacy page carried until 2026-08-07,
                when it was found to be describing a tracking cookie, four
                localStorage keys and an analytics vendor that do not exist. Both
                were written as placeholder text and neither was ever revisited.

                Why it mattered more than most: this product's whole argument is
                receipts rather than claims. /proof publishes a calibration score
                including the misses, the landing counters refuse to render when
                they cannot be pulled live, and the waitlist confirmation was
                changed the same evening to stop publishing a queue size it could
                not stand behind. One visitor asking "which hundred" would have
                cost every other number on the site its credibility.

                The replacement states the access model, which is true, checkable
                in one click, and the thing a reader at this exact point actually
                needs to know before pressing the button under it. */}
            The beta is invite only. Leave your name and your code arrives the moment a place opens.
          </p>

          <button
            className="text-mrd-prose"
            style={{
              fontFamily: "var(--mrd-font)",
              fontWeight: 500,
              padding: "12px 24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "var(--mrd-you)",
              color: "var(--mrd-bg)",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#ff8344"; /* hover tint: no token exists and inkTheme is not mine to extend */
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--mrd-you)";
            }}
            // Was "Start free" at "/?signup=true", and neither half held up.
            // Signup is invite only from 2026-08-07, and nothing in the app
            // reads a `signup` query parameter, so the promise was already
            // landing on the marketing page and doing nothing when it got
            // there. It goes to the one waitlist form the site has.
            onClick={() => {
              window.location.href = "/#join";
            }}
          >
            Request access
          </button>
        </section>
      </div>
    </div>
  );
}
