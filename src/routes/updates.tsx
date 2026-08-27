// PC-03 footer requirement: a public, GitHub-style changelog. Curated real
// ships in plain language (no internal codenames), each dated from the
// build log. PC-15 extends this page with a "you said, we changed" section
// fed by product-pulse feedback; this is the honest starting shape.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/supaprod/LegalPageShell";

const SITE = "https://supaprod.ai";
const TITLE = "Changelog · Supaprod";
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
    links: [{ rel: "canonical", href: `${SITE}/updates` }],
  }),
  component: UpdatesPage,
});

// Each entry is dated from the real build log, verified against git rather than
// paraphrased from a commit subject (2026-08-09: the landing page links here as
// "What shipped this week" while the newest row read 2026-07-10, a month back).
//
// The bar for a row: a stranger with an account would NOTICE it. Internal
// refactors, audits, doc passes and design-system work do not qualify no matter
// how much of the month they took. The connector fleet is deliberately absent
// even though it is the biggest thing in this window's neighbourhood -- every
// provider landed 2026-06-30 to 07-09, so it predates the row below it.
const ENTRIES: { date: string; title: string; body: string; fromPulse?: boolean }[] = [
  {
    /* Added 2026-08-11 with the duration ruling. Onboarding's three setup
     * screens were unreachable from 2026-08-10 and have now been deleted, so
     * the newest word this page had on onboarding described a flow that no
     * longer exists and priced it at ten minutes. A changelog supersedes, it
     * does not silently edit, so the correction is this row rather than a
     * rewrite of the 2026-07-10 one below. Dated to when the change a stranger
     * would notice actually landed. */
    date: "2026-08-10",
    title: "Onboarding is one question now",
    body: "Signing up used to mean naming your product and connecting a source before Supaprod did anything for you. It now opens on the one thing worth asking: write the assumption you would hate to be wrong about, and the Critic challenges it and shows the evidence, usually in under a minute. Everything else is offered afterwards, once you have a result to react to.",
  },
  {
    date: "2026-08-09",
    title: "Today opens on the call, not the dashboard",
    body: "Today now leads with the single call most worth making, the evidence standing behind it, and the follow-through attached to it, in one brief. It replaces a screen of panels that asked what you wanted to do with one that says what is worth doing.",
  },
  {
    date: "2026-08-07",
    title: "Invite only, on purpose, while the beta is small",
    body: "Signing up now takes an invite code. It is a deliberate limit rather than a waiting list: a small beta means every early team gets real attention while the loop is still being tuned. Ask for a code and we will send you one.",
  },
  {
    date: "2026-08-07",
    title: "Our public scorecard now counts only real calls",
    body: "The track record was computing its score partly from sample workspaces, which meant it was grading fixtures. It now counts real decisions in real workspaces only. That is why it currently shows an honest zero rather than a number, and it fills in as outcomes land.",
  },
  {
    date: "2026-08-06",
    title: "The record brings things to you",
    body: "Insights no longer wait for you to go looking for them. When something already in your record should change a call you are about to make, it surfaces on Today with the evidence attached.",
  },
  {
    date: "2026-08-01",
    title: "A hard ceiling on what any run can spend",
    body: "Every track of work carries its own spend cap now, and so does every mission. An agent stops at the ceiling and tells you, rather than continuing and telling you afterwards.",
  },
  {
    date: "2026-07-12",
    title: "The teardown, free, with no account",
    body: "Paste a PRD and Supaprod tears it down with the evidence for and against it. No signup, no setup. It is the same critic that runs inside the product, pointed at your own document.",
  },
  {
    date: "2026-07-10",
    /* This row was titled "The first ten minutes now prove the value" until
     * 2026-08-11. The number went, the row stayed. Ten minutes was never a
     * measured figure, it carried no query, and docs/pitch/verified-numbers.md
     * is explicit that a number quoted outward without one does not ship. The
     * entry's substance is untouched and still true of what landed that day:
     * this is a correction to an unverifiable claim, not a rewrite of history.
     * The row above supersedes it on the flow itself. */
    title: "Onboarding starts with your own bet, not a tour",
    body: "Onboarding no longer starts with a tour. Name your product, connect one source or paste your notes, and Supaprod tears down your own bet with real evidence before you have done anything else.",
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
    body: "Supaprod now re-ranks what it recalls by how past decisions actually turned out, not just by how similar they read. Your Supaprod gets smarter about your product with every outcome it records.",
  },
  {
    date: "2026-06-25",
    title: "The track record",
    body: "Every call Supaprod makes is now recorded with the evidence behind it, then graded once the outcome lands. Right or wrong, it becomes precedent the next call reads from.",
  },
];

/**
 * DERIVED FROM THE NEWEST ENTRY, never typed by hand.
 *
 * The header read `updated="August 9, 2026"` while the newest entry below was
 * dated 2026-08-10. A hand-typed date sitting inches from the data it claims to
 * describe had already drifted by a day, and nothing could catch it because the
 * two were never connected.
 *
 * This is the derivation law the rest of the repo uses for keycaps and station
 * names, applied to a date: read it from the same source that renders it, so
 * the two cannot disagree. Adding an entry now updates the header for free, and
 * forgetting to add one shows the real age instead of a comfortable one.
 */
const NEWEST = ENTRIES.reduce((latest, e) => (e.date > latest ? e.date : latest), ENTRIES[0].date);

function UpdatesPage() {
  return (
    <LegalPageShell
      eyebrow="Product"
      title="Changelog"
      updated={new Date(`${NEWEST}T00:00:00Z`).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })}
    >
      <p style={{ marginBottom: 8 }}>
        What shipped, in plain language. No marketing spin, dated against the real build log.
      </p>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 28 }}>
        {ENTRIES.map((e) => (
          <div key={e.title} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 20 }}>
            <span
              className="text-mrd-data"
              style={{
                fontFamily: "Geist Mono, monospace",
                color: "var(--mrd-mute)",
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
                  color: "var(--mrd-ink)",
                  margin: "0 0 6px",
                }}
              >
                {e.title}
              </h3>
              <p
                className="text-mrd-prose"
                style={{ color: "var(--mrd-mute)", margin: 0, lineHeight: 1.6 }}
              >
                {e.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* PC-15: fed by shipped rows tagged fromPulse above. Honest empty
          state until a real one exists post-beta, never a fabricated one. */}
      <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid var(--mrd-line)" }}>
        <h2
          className="mrd-subtitle"
          style={{ fontWeight: 600, color: "var(--mrd-ink)", margin: "0 0 6px" }}
        >
          You said, we changed
        </h2>
        {ENTRIES.some((e) => e.fromPulse) ? (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            {ENTRIES.filter((e) => e.fromPulse).map((e) => (
              <div key={e.title}>
                <h3
                  className="text-mrd-prose"
                  style={{ fontWeight: 600, color: "var(--mrd-ink)", margin: "0 0 4px" }}
                >
                  {e.title}
                </h3>
                <p
                  className="text-mrd-base"
                  style={{ color: "var(--mrd-mute)", margin: 0, lineHeight: 1.6 }}
                >
                  {e.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-mrd-base" style={{ color: "var(--mrd-faint)", margin: 0 }}>
            Nothing here yet. Every thumbs-up or thumbs-down in the product becomes a real signal,
            and this section fills in with real shipped changes once one drives a decision.
          </p>
        )}
      </div>
    </LegalPageShell>
  );
}
