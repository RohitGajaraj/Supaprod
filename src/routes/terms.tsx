// PC-03: plain-language terms of service. Public, unauthenticated, required
// for Google OAuth verification.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, LegalSection } from "@/components/supaprod/LegalPageShell";

const SITE = "https://supaprod.ai";
const TITLE = "Terms of service · Supaprod";
const DESC = "The plain-language terms for using Supaprod.";

export const Route = createFileRoute("/terms")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/terms` }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Terms of service" updated="July 10, 2026">
      <p>
        By creating a Supaprod account or using supaprod.ai, you agree to these terms. Supaprod is
        in beta. Features change quickly, and we will tell you when something material changes.
      </p>

      <LegalSection title="What Supaprod does">
        <p>
          Supaprod is where product decisions live when agents do the work: it senses signals,
          proposes decisions, drafts specs, and can dispatch coding agents to build against them.
          Every action that ships, merges, or otherwise takes effect outside your review requires
          your explicit approval, per the approval mode you set for that action.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for the accuracy of the information you provide and for activity under
          your account. Keep your credentials to yourself; tell us if you suspect unauthorized
          access.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You own what you put into Supaprod and what it produces on your behalf: decisions, specs,
          code, and the record of what happened. You grant us the license needed to store, process,
          and display it back to you and your workspace members, and nothing more.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>
          Do not use Supaprod to violate the law, to attempt to access another workspace's data, or
          to abuse the connected AI providers (spam, generating disallowed content, or attempting to
          circumvent usage limits).
        </p>
      </LegalSection>

      <LegalSection title="Connected sources and AI providers">
        <p>
          Connecting a third-party source (GitHub, Slack, and similar) is also subject to that
          provider's own terms. If you bring your own AI provider key, your use of that key is
          subject to that provider's terms; Supaprod is not a party to that agreement.
        </p>
      </LegalSection>

      <LegalSection title="Beta status and availability">
        <p>
          Supaprod is offered "as is" during this beta period. We aim for reliability but do not
          guarantee uninterrupted availability. Back up anything mission-critical outside Supaprod
          until we say otherwise.
        </p>
      </LegalSection>

      <LegalSection title="Billing (when enabled)">
        <p>
          Paid plans, when live, are billed per the pricing page in effect at the time of purchase.
          Credits and usage are metered transparently in-product; we will never surprise-bill you
          for usage you cannot see coming.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You can close your account at any time from Settings; your data is deleted per the{" "}
          <a href="/privacy" style={{ color: "#ff9542" }}>
            privacy policy
          </a>
          . We may suspend accounts that violate acceptable use, with notice where practical.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          Supaprod proposes decisions and can execute work with your approval, but the accountable
          call remains yours. That is the product's own thesis. We are not liable for outcomes of
          decisions you approved.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          We will date every revision here and notify you in-product of material changes before they
          take effect.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
