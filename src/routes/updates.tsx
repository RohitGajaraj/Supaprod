// PC-03 footer requirement: a public, GitHub-style changelog. Curated real
// ships in plain language (no internal codenames), each dated from the
// build log. PC-15 extends this page with a "you said, we changed" section
// fed by product-pulse feedback; this is the honest starting shape.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/cadence/LegalPageShell";

const TITLE = "Changelog · Cadence";
const DESC = "What shipped, in plain language, dated.";

export const Route = createFileRoute("/updates")({
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
  component: UpdatesPage,
});

const ENTRIES: { date: string; title: string; body: string; fromPulse?: boolean }[] = [
  {
    date: "2026-07-10",
    title: "The first ten minutes now prove the value",
    body: "Onboarding no longer starts with a tour. Name your product, connect one source or paste your notes, and Cadence tears down your own bet with real evidence before you have done anything else.",
  },
  {
    date: "2026-07-09",
    title: "Autonomy tiers, with merge always held back",
    body: "Agents can now be trusted to stage, commit, and open a pull request on their own once they have earned it. Merging into production stays a human call, always.",
  },
  {
    date: "2026-07-03",
    title: "Trust that is actually earned",
    body: "The autonomy ramp now checks whether a call's real-world outcome came back right, not just whether it was approved. A clean approval that turned out wrong no longer counts toward more trust.",
  },
  {
    date: "2026-07-03",
    title: "Every outcome makes the next call sharper",
    body: "Cadence now re-ranks what it recalls by how past decisions actually turned out, not just by how similar they read. Your Cadence gets smarter about your product with every outcome it records.",
  },
  {
    date: "2026-06-25",
    title: "The Ledger",
    body: "Every call Cadence makes is now recorded with the evidence behind it, then graded once the outcome lands. Right or wrong, it becomes precedent the next call reads from.",
  },
];

function UpdatesPage() {
  return (
    <LegalPageShell eyebrow="Product" title="Changelog" updated="July 10, 2026">
      <p style={{ marginBottom: 8 }}>
        What shipped, in plain language. No marketing spin, dated against the real build log.
      </p>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 28 }}>
        {ENTRIES.map((e) => (
          <div key={e.title} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 20 }}>
            <span
              style={{
                fontFamily: "Geist Mono, monospace",
                fontSize: 11.5,
                color: "#94a3b8",
                paddingTop: 2,
              }}
            >
              {e.date}
            </span>
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#f8fafc",
                  margin: "0 0 6px",
                }}
              >
                {e.title}
              </h3>
              <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                {e.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* PC-15: fed by shipped rows tagged fromPulse above. Honest empty
          state until a real one exists post-beta, never a fabricated one. */}
      <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #1c1c22" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", margin: "0 0 6px" }}>
          You said, we changed
        </h2>
        {ENTRIES.some((e) => e.fromPulse) ? (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            {ENTRIES.filter((e) => e.fromPulse).map((e) => (
              <div key={e.title}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", margin: "0 0 4px" }}>
                  {e.title}
                </h3>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
                  {e.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
            Nothing here yet. Every thumbs-up or thumbs-down in the product becomes a real signal,
            and this section fills in with real shipped changes once one drives a decision.
          </p>
        )}
      </div>
    </LegalPageShell>
  );
}
