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

// FAQ schema for AI answer engines (Perplexity, ChatGPT, Gemini, Grok).
// Each Q/A is byte-identical to the visible page so citations remain accurate.
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Supaprod?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Supaprod is an AI product team for product managers. It helps you discover what to build, decide on bets, design specs, build with agents, ship with safety, and learn from real-world outcomes. Every irreversible action requires your approval.",
      },
    },
    {
      "@type": "Question",
      name: "How is Supaprod different from product management software?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Supaprod doesn't just store decisions—it guides the next call by learning what actually happened when you shipped. It learns from outcomes and grades its own advice, so each decision benefits from everything you've learned before.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to be technical to use Supaprod?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Supaprod is designed for product managers, product leads, and non-technical founders. If you can describe what you want to build, Supaprod can help you clarify it, test it, and ship it. Agents handle the technical work.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use Supaprod offline?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Supaprod is a cloud-based tool, so you need an internet connection. Your data lives in your workspace's own Postgres database, isolated from other workspaces by row-level security.",
      },
    },
    {
      "@type": "Question",
      name: "What happens to my data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your data stays in your workspace and is never used to train shared models or sell to third parties. You own every decision, spec, and outcome you create. You can export or delete your data at any time from Settings.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my decisions and specs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export your decisions, specs, and outcomes in open formats (JSON, CSV) at any time from Settings. You own everything you create.",
      },
    },
    {
      "@type": "Question",
      name: "How does pricing work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Supaprod has a free tier that covers one author and unlimited decisions. Paid plans add the ability to invite team members and increase agent autonomy. See the pricing page for details.",
      },
    },
    {
      "@type": "Question",
      name: "Can I invite my team to collaborate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, on paid plans. You can invite team members with different roles (owner, admin, member, viewer) and set approval requirements per action. Every decision is shared, but approval gates are role-based.",
      },
    },
    {
      "@type": "Question",
      name: "What if I change my mind about a decision?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every decision is reversible until it's shipped. Once shipped, Supaprod learns from the real outcome and grades its own advice. You can always revert a decision before the ship gate, but shipping is the irreversible point.",
      },
    },
    {
      "@type": "Question",
      name: "What does Supaprod integrate with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Supaprod integrates with GitHub, Linear, Slack, Notion, Google Docs, Jira, and more. You can connect any source to feed signals into decisions. Supaprod can write back to GitHub and Linear.",
      },
    },
  ],
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
      <LegalSection title="What is Supaprod?">
        <p>
          Supaprod is an AI product team for product managers. It helps you discover what to build,
          decide on bets, design specs, build with agents, ship with safety, and learn from
          real-world outcomes. Every irreversible action requires your approval.
        </p>
      </LegalSection>

      <LegalSection title="How is Supaprod different from product management software?">
        <p>
          Supaprod doesn't just store decisions—it guides the next call by learning what actually
          happened when you shipped. It learns from outcomes and grades its own advice, so each
          decision benefits from everything you've learned before.
        </p>
      </LegalSection>

      <LegalSection title="Do I need to be technical to use Supaprod?">
        <p>
          No. Supaprod is designed for product managers, product leads, and non-technical founders.
          If you can describe what you want to build, Supaprod can help you clarify it, test it,
          and ship it. Agents handle the technical work.
        </p>
      </LegalSection>

      <LegalSection title="Can I use Supaprod offline?">
        <p>
          Supaprod is a cloud-based tool, so you need an internet connection. Your data lives in
          your workspace's own Postgres database, isolated from other workspaces by row-level
          security.
        </p>
      </LegalSection>

      <LegalSection title="What happens to my data?">
        <p>
          Your data stays in your workspace and is never used to train shared models or sell to
          third parties. You own every decision, spec, and outcome you create. You can export or
          delete your data at any time from Settings.
        </p>
      </LegalSection>

      <LegalSection title="Can I export my decisions and specs?">
        <p>
          Yes. You can export your decisions, specs, and outcomes in open formats (JSON, CSV) at
          any time from Settings. You own everything you create.
        </p>
      </LegalSection>

      <LegalSection title="How does pricing work?">
        <p>
          Supaprod has a free tier that covers one author and unlimited decisions. Paid plans add
          the ability to invite team members and increase agent autonomy. See the{" "}
          <a href="/pricing" style={{ color: "#ff9542" }}>
            pricing page
          </a>{" "}
          for details.
        </p>
      </LegalSection>

      <LegalSection title="Can I invite my team to collaborate?">
        <p>
          Yes, on paid plans. You can invite team members with different roles (owner, admin,
          member, viewer) and set approval requirements per action. Every decision is shared, but
          approval gates are role-based.
        </p>
      </LegalSection>

      <LegalSection title="What if I change my mind about a decision?">
        <p>
          Every decision is reversible until it's shipped. Once shipped, Supaprod learns from the
          real outcome and grades its own advice. You can always revert a decision before the ship
          gate, but shipping is the irreversible point.
        </p>
      </LegalSection>

      <LegalSection title="What does Supaprod integrate with?">
        <p>
          Supaprod integrates with GitHub, Linear, Slack, Notion, Google Docs, Jira, and more. You
          can connect any source to feed signals into decisions. Supaprod can write back to GitHub
          and Linear.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
