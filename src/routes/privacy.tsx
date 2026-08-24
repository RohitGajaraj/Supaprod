// PC-03: plain-language privacy policy. Public, unauthenticated, required
// for Google OAuth verification. Honest specifics over boilerplate: names the
// actual stack (Supabase Postgres + RLS, connector OAuth scopes, BYO keys)
// rather than generic legal filler.
//
// THE STORAGE SECTION IS DERIVED, NOT AUTHORED. Every claim in "Cookies and
// local storage" comes from docs/operations/security/cookie-and-storage-policy.md,
// which lists each key with the file and line that writes it. Change one and
// change the other in the same commit; src/__tests__/client-storage-consent.test.ts
// fails if the code grows a key the policy does not name.
//
// WHY THAT RULE EXISTS. Until 2026-08-07 this section described a `session-id`
// cookie with a 30 minute lifetime, four localStorage keys named user_id /
// workspace_id / auth_token / preferences, and "Flock Analytics" as the vendor,
// linked to /subprocessors. None of it was true: this product sets no cookie at
// all, none of those four key names exist, and no such vendor appears anywhere in
// the repo or on the page it linked to. The copy was written against a /~flock.js
// script that is not in this codebase. A policy is a factual claim about
// behaviour, and claiming storage more invasive than what happens is the failure
// direction that costs trust the moment a reviewer opens devtools and checks.
import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell, LegalSection } from "@/components/supaprod/LegalPageShell";

const SITE = "https://supaprod.ai";
const TITLE = "Privacy policy · Supaprod";
const DESC =
  "What Supaprod reads, what it never touches, how to revoke access, and where your data lives.";

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
    links: [{ rel: "canonical", href: `${SITE}/privacy` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPageShell eyebrow="Legal" title="Privacy policy" updated="August 7, 2026">
      <p>
        This is the plain-language version, followed by the specifics. We read what you connect, we
        never use your product's data to train a shared model, you can revoke any connection with
        one click, and you can export or delete your data at any time.
      </p>

      <LegalSection title="What we collect">
        <p>
          Account details you give us at signup (name, email, workspace name). Content you create in
          Supaprod: decisions, specs, opportunities, and their outcomes. Content from any source you
          explicitly connect (GitHub, Slack, Linear, and similar), scoped to the permissions you
          grant at connect time and shown to you before you grant them. Usage data (page views,
          feature interactions) so we can tell what is working.
        </p>
      </LegalSection>

      <LegalSection title="What we never touch">
        <p>
          Supaprod never merges code, ships a release, or takes an irreversible action without your
          explicit approval. The merge gate is always human-reviewed. We do not read sources you
          have not connected, and we do not expand a connection's scope without asking again.
        </p>
      </LegalSection>

      <LegalSection title="No training on your data">
        <p>
          Your decisions, specs, code, and outcomes are not used to train a shared or public AI
          model. When Supaprod calls an underlying model provider to do its work, your data is sent
          for that request only, under that provider's standard API terms, not their consumer
          product terms.
        </p>
      </LegalSection>

      <LegalSection title="Where your data lives">
        <p>
          In your workspace's own Postgres database (hosted on Supabase), isolated from other
          workspaces by row-level security. You can export your data in open formats at any time
          from Settings. The third parties that process data on Supaprod's behalf, and what each one
          receives, are listed publicly on{" "}
          <a href="/subprocessors" style={{ color: "var(--mrd-you)" }}>
            the sub-processor disclosure
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          <strong>Supaprod sets no cookies, and loads no third-party script.</strong> No advertising
          network, no tag manager, no session recorder, no analytics SDK runs in your browser, so no
          third party can store anything there or learn that you visited. That is also why you see
          no consent banner: there is nothing here that consent law asks us to ask you about.
        </p>
        <p>
          What we do store is kept in your browser and stays there. Your sign-in session (so you are
          not signed out on every page), the workspace and product you last had open, and the
          preferences you set yourself: theme, density, rail width, sound, and the notices you have
          already dismissed. Those persist until you clear them. A second, shorter-lived group is
          held only until you close the tab: where you got to in onboarding, a demo in progress, and
          the palette's recent items.
        </p>
        <p>
          One item is measurement rather than function. The first time you land on the marketing
          site we generate a random 32-character value that lets us tell that one visit and one
          signup were the same person, instead of two unrelated numbers. It contains nothing about
          you, your device or your network, it is random and nothing else. It never leaves Supaprod,
          it is destroyed when you close the tab, and it is deleted the moment an account claims it.
        </p>
        <p>
          Clearing your browser storage for this site removes all of it, and nothing breaks except
          that you sign in again. The full technical inventory, every key with the file that writes
          it, is kept alongside the code so this page can be checked rather than trusted.
        </p>
      </LegalSection>

      <LegalSection title="Bring your own AI keys">
        <p>
          If you prefer, you can run Supaprod against your own model provider key instead of ours.
          Nothing about your data handling changes either way. This is a routing choice, not a trust
          boundary.
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
          Members of your workspace, per the role you grant them. We do not sell your data. Supaprod
          staff access production data only to operate the service (debugging, support you have
          requested) and that access is logged.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy or a request to export or delete your data: email{" "}
          <a href="mailto:privacy@supaprod.ai" style={{ color: "var(--mrd-you)" }}>
            privacy@supaprod.ai
          </a>
          , or see the{" "}
          <a href="/security" style={{ color: "var(--mrd-you)" }}>
            security page
          </a>{" "}
          for how to report a concern.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          Supaprod is in beta and this policy will get more detailed as we add capabilities
          (billing, more connectors). We will date every revision here; material changes get a
          notice inside the product, not a silent edit.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
