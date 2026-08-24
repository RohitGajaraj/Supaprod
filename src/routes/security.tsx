// PC-03 footer requirement: a security posture stub. Honest about beta
// stage: no false certification claims, real architecture facts only.
// 2026-07-11: /trust merged in here (homeless-route homing). Its access,
// data-isolation, and privacy-controls content now lives on this page and
// /trust permanently redirects here.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, LegalSection } from "@/components/supaprod/LegalPageShell";

const SITE = "https://supaprod.ai";
const TITLE = "Security · Supaprod";
// NOT "every AI action" -- the body twelve lines down states the true, narrower
// claim and this summary promised more than it. The Critic runs unattended
// (critic.server.ts calls callModel directly), Measure settles outcomes
// unattended (38 of 119 learnings on production carry a recorded_by_agent_slug,
// measured 2026-08-06), and Discover clusters unattended. The gate is on
// IRREVERSIBLE actions, which is the defensible claim and the one the page
// itself makes under "The merge gate". On a security page the gap between the
// summary a buyer reads in search results and the body they read after is what
// costs the deal -- not the posture, which is fine.
const DESC =
  "How Supaprod handles access, data, and privacy: workspace isolation, connector scopes, and the human gate on every irreversible action.";

export const Route = createFileRoute("/security")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/security` }],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <LegalPageShell eyebrow="Trust" title="Security" updated="July 10, 2026">
      <p>
        We are a beta-stage company and say so plainly here rather than claiming certifications we
        do not hold yet. This page states what is actually true about how Supaprod is built.
      </p>

      <LegalSection title="Access and authentication">
        <p>
          Sign-in is handled through our managed authentication provider. Sessions are bound to your
          account, and every request to backend data is authorized server-side. Workspace membership
          controls who can read or change data, and roles (owner, admin, member, viewer) gate
          sensitive actions such as inviting members or transferring ownership.
        </p>
      </LegalSection>

      <LegalSection title="Workspace isolation">
        <p>
          Every workspace's data lives in its own row-level-security-scoped rows in a shared
          Postgres database (Supabase). One workspace's rows are not queryable from another's
          session, enforced at the database layer, not just the application layer. Billing
          identifiers and invitation tokens are restricted to server-side roles and are never
          exposed to other members.
        </p>
      </LegalSection>

      <LegalSection title="Secrets and encryption">
        <p>
          Connection credentials and API keys you bring into Supaprod are encrypted before being
          stored. Decryption happens only inside server-side code paths. Data in transit uses TLS
          provided by the hosting platform.
        </p>
      </LegalSection>

      <LegalSection title="Connector scopes">
        <p>
          Every connected source (GitHub, Slack, Linear, and similar) uses that provider's OAuth
          flow with the minimum scope the feature needs, shown to you before you grant it. Tokens
          are encrypted at rest. Disconnect any source anytime from Settings; access ends
          immediately.
        </p>
      </LegalSection>

      <LegalSection title="The merge gate">
        <p>
          Agents can draft, propose, and build, but nothing merges, ships, or takes an irreversible
          outward action without a human approval through the real approval flow. This is a fixed
          floor, not a setting that can be dialed away.
        </p>
      </LegalSection>

      <LegalSection title="No training on your data">
        <p>
          Your product's decisions, specs, and code are not used to train a shared model. See the{" "}
          <a href="/privacy" style={{ color: "var(--mrd-you)" }}>
            privacy policy
          </a>{" "}
          for the full statement.
        </p>
      </LegalSection>

      <LegalSection title="Who processes your data">
        <p>
          Supaprod relies on infrastructure and AI providers to deliver the product, and on
          third-party services that you explicitly connect (for example a code repository or
          calendar). The full, live list of sub-processors and what each one receives is public at{" "}
          <a href="/subprocessors" style={{ color: "var(--mrd-you)" }}>
            the sub-processor disclosure
          </a>
          . Connections you create are scoped to your workspace, and you can disconnect them at any
          time from Settings.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          You can delete data you have created (workspaces, products, documents, signals) from
          inside the app, and export your data in open formats from Settings. Account deletion or
          data export requests can also be made by emailing{" "}
          <a href="mailto:privacy@supaprod.ai" style={{ color: "var(--mrd-you)" }}>
            privacy@supaprod.ai
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Reporting a concern">
        <p>
          If you find a security issue, tell us before you tell anyone else. Email{" "}
          <a href="mailto:security@supaprod.ai" style={{ color: "var(--mrd-you)" }}>
            security@supaprod.ai
          </a>
          . We will acknowledge real reports and keep you posted as we fix them.
        </p>
      </LegalSection>

      <LegalSection title="What we are not claiming yet">
        <p>
          We do not currently hold a SOC 2 or ISO 27001 certification. If your evaluation needs one,
          tell us. It tells us where to invest next, and we would rather hear it than have you
          assume otherwise.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
