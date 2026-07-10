// PC-03: plain-language privacy policy. Public, unauthenticated, required
// for Google OAuth verification. Honest specifics over boilerplate: names the
// actual stack (Supabase Postgres + RLS, connector OAuth scopes, BYO keys)
// rather than generic legal filler.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, LegalSection } from "@/components/cadence/LegalPageShell";

const TITLE = "Privacy policy · Cadence";
const DESC =
  "What Cadence reads, what it never touches, how to revoke access, and where your data lives.";

export const Route = createFileRoute("/privacy")({
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
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Privacy policy" updated="July 10, 2026">
      <p>
        This is the plain-language version, followed by the specifics. We read what you connect, we
        never use your product's data to train a shared model, you can revoke any connection with
        one click, and you can export or delete your data at any time.
      </p>

      <LegalSection title="What we collect">
        <p>
          Account details you give us at signup (name, email, workspace name). Content you create in
          Cadence: decisions, specs, opportunities, and their outcomes. Content from any source you
          explicitly connect (GitHub, Slack, Linear, and similar), scoped to the permissions you
          grant at connect time and shown to you before you grant them. Usage data (page views,
          feature interactions) so we can tell what is working.
        </p>
      </LegalSection>

      <LegalSection title="What we never touch">
        <p>
          Cadence never merges code, ships a release, or takes an irreversible action without your
          explicit approval. The merge gate is always human-reviewed. We do not read sources you
          have not connected, and we do not expand a connection's scope without asking again.
        </p>
      </LegalSection>

      <LegalSection title="No training on your data">
        <p>
          Your decisions, specs, code, and outcomes are not used to train a shared or public AI
          model. When Cadence calls an underlying model provider to do its work, your data is sent
          for that request only, under that provider's standard API terms, not their consumer
          product terms.
        </p>
      </LegalSection>

      <LegalSection title="Where your data lives">
        <p>
          In your workspace's own Postgres database (hosted on Supabase), isolated from other
          workspaces by row-level security. You can export your data in open formats at any time
          from Settings.
        </p>
      </LegalSection>

      <LegalSection title="Bring your own AI keys">
        <p>
          If you prefer, you can run Cadence against your own model provider key instead of ours.
          Nothing about your data handling changes either way. This is a routing choice, not a
          trust boundary.
        </p>
      </LegalSection>

      <LegalSection title="Revoking access">
        <p>
          Disconnect any connected source from Settings → Connected accounts at any time. Access
          ends immediately; nothing further is read from that source.
        </p>
      </LegalSection>

      <LegalSection title="Who can see your data">
        <p>
          Members of your workspace, per the role you grant them. We do not sell your data. Cadence
          staff access production data only to operate the service (debugging, support you have
          requested) and that access is logged.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy or a request to export or delete your data: reach us through
          the contact address on your account, or see the{" "}
          <a href="/security" style={{ color: "#ff9542" }}>
            security page
          </a>{" "}
          for how to report a concern.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          Cadence is in beta and this policy will get more detailed as we add capabilities (billing,
          more connectors). We will date every revision here; material changes get a notice inside
          the product, not a silent edit.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
