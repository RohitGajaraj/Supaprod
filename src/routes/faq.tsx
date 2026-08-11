// PC-03: public FAQ page with question-shaped headings for AI answer engines.
// Perplexity, ChatGPT, Claude, and Google AI Overviews explicitly look for
// question-phrased h2 headings and FAQ schema (JSON-LD FAQPage) to lift and cite.
// This page surfaces Supaprod in AI-generated answers by matching their indexing rules.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, LegalSection } from "@/components/supaprod/LegalPageShell";

const SITE = "https://supaprod.ai";
const TITLE = "FAQ · Supaprod";
const DESC =
  "Frequently asked questions about Supaprod: how it works, pricing, data privacy, integrations, and team collaboration.";

/**
 * ONE array, two renderings. The JSON-LD below and the visible page are BOTH
 * derived from this, so they cannot say different things.
 *
 * The first version of this file kept the schema and the markup as two hand-written
 * copies under a comment promising they were "byte-identical". They were not, and
 * the divergence is the dangerous direction: an answer engine lifts the JSON-LD, so
 * a stale schema is the copy strangers actually get quoted. An invariant a human has
 * to maintain is a wish. Derive it and it is a fact.
 *
 * EVERY ANSWER HERE IS A PUBLIC CLAIM ABOUT WHAT THE PRODUCT DOES. Check it against
 * the code before you change it. The integrations answer is checked against
 * src/lib/connectors/providers/index.server.ts, where anything mapped to `stubAdapter`
 * returns "adapter not implemented" and must not be listed as working. The export
 * answer is checked against src/lib/projects.functions.ts, which emits JSON only.
 * Pricing deliberately does not restate limits, because those move and this page
 * would silently go stale; it points at /pricing instead.
 */
type FaqEntry = {
  q: string;
  /** One string per paragraph. The schema joins them with a space. */
  a: string[];
  more?: { label: string; href: string };
};

const FAQ: FaqEntry[] = [
  {
    q: "What is Supaprod?",
    a: [
      "Supaprod is where product decisions live when agents do the work. It tells you what to build, builds and ships it, then learns what actually worked. Agents do the product work end to end and you make the calls. Nothing irreversible happens without your approval.",
    ],
  },
  {
    q: "How is Supaprod different from product management software?",
    a: [
      "Most product tools end at the decision. Supaprod carries it forward: it joins the call you made to the outcome you actually got, labelled over time, and uses that to guide the next call. So the next decision does not start from a blank page. It tells you what is right, and warns you before you repeat what went wrong.",
    ],
  },
  {
    q: "Do I need to be technical to use Supaprod?",
    a: [
      "No. Supaprod is built for product managers, product leads and non-technical founders. If you can describe what you want to build, Supaprod can help you clarify it, pressure-test it and ship it. Agents do the engineering.",
    ],
  },
  {
    q: "Can I use Supaprod offline?",
    a: [
      "No. Supaprod is a cloud tool, so you need an internet connection. Your data lives in a Postgres database where every row carries your workspace id, and row-level security is what stops one workspace from reading another's.",
    ],
  },
  {
    q: "What happens to my data?",
    a: [
      "It stays in your workspace. It is never used to train shared models and it is never sold. You own every decision, spec and outcome you create, and you can export or delete all of it from Settings.",
    ],
    more: { label: "Read the privacy policy", href: "/privacy" },
  },
  {
    q: "Can I export my decisions and specs?",
    a: [
      "Yes. Settings exports your whole workspace as a single JSON snapshot, and any one product as its own JSON file. The export takes everything rather than letting you choose sections. There is no CSV export today.",
      "Full export is available on every tier including the free one, deliberately. Leaving should never be the thing that traps you.",
    ],
  },
  {
    q: "How does pricing work?",
    a: [
      "There is a free tier and paid tiers. What the paid tiers raise is how many workspaces you get, how many agents can run at once, and what your team can do together. Those limits move, so the pricing page is the authority rather than this answer.",
    ],
    more: { label: "See pricing", href: "/pricing" },
  },
  {
    q: "Can I invite my team to collaborate?",
    a: [
      "Yes, on paid plans. You can invite people with different roles and set which actions need an approval before they run. Decisions are shared across the workspace; what varies by role is who can wave something through.",
    ],
  },
  {
    q: "What if I change my mind about a decision?",
    a: [
      "A decision stays reversible right up to the ship gate. After it ships, Supaprod settles the real outcome against the call you made and grades its own advice, and that grade is what feeds the next recommendation.",
    ],
  },
  {
    q: "What does Supaprod integrate with?",
    a: [
      "GitHub is the deepest and the one to start with: it reads signals from your repository, and it can open and merge pull requests. Slack, Intercom, Zendesk, Stripe, HubSpot, Salesforce, Canny and Productboard have working adapters that feed signals into Discover.",
      "Linear, Jira, Notion, Figma and the Google and Microsoft suites appear in the connector list but their adapters are not built yet, so connecting one will not return signals. They are listed because they are next, not because they work today. Better to say so here than to let you find it after you have connected one.",
    ],
  },
];

// Derived, never hand-maintained. See the note on FAQ above.
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.a.join(" "),
    },
  })),
};

export const Route = createFileRoute("/faq")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/faq` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(FAQ_SCHEMA) }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <LegalPageShell eyebrow="Help" title="Frequently asked questions" updated="August 7, 2026">
      {FAQ.map((entry) => (
        <LegalSection key={entry.q} title={entry.q}>
          {entry.a.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {entry.more ? (
            <p>
              <a href={entry.more.href} style={{ color: "#ff9542" }}>
                {entry.more.label}
              </a>
            </p>
          ) : null}
        </LegalSection>
      ))}
    </LegalPageShell>
  );
}
