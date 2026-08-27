// CNV-03 · the public ARD (Agent Requirements Document) spec page.
// Explains the wire format for Supaprod's Outcome Contract to anyone who is
// not a Supaprod user: a dispatched coding agent, an integrator's MCP client,
// or a person evaluating the standard. Public, unauthenticated, landing-page
// tokens (parchment) per the design contract; the authenticated app's
// Obsidian tokens do not apply here.
import { createFileRoute, Link } from "@tanstack/react-router";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { ARD_SCHEMA_PATH, ARD_SCHEMA_VERSION } from "@/lib/ard-schema";

const SITE = "https://supaprod.ai";
const TITLE = "ARD · Agent Requirements Document · Supaprod";
const DESC =
  "The ARD is Supaprod's published, versioned wire format for a spec's Outcome Contract: intent, success metrics with their proof oracle, non-goals, and a budget. The same contract a dispatched coding agent receives instead of re-parsed prose.";

export const Route = createFileRoute("/ard")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/ard` }],
  }),
  component: ArdPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</h2>
      {/* The prose carries the measure; a code block opts out below. This page
          bounds its column at 760px, about 87ch at this type -- the widest
          public measure in the product and the page an external developer
          reads to implement against us. Bounding the COLUMN would have
          narrowed the example document with it, which is the one thing here
          that wants the width: meridian.css says the token is "prose only,
          never a table or a row". */}
      <div
        className="text-mrd-prose"
        style={{ color: "var(--mrd-mute)", lineHeight: 1.6, maxWidth: "var(--mrd-measure)" }}
      >
        {children}
      </div>
    </section>
  );
}

const EXAMPLE = `{
  "ard_version": "${ARD_SCHEMA_VERSION}",
  "schema_url": "https://supaprod.app${ARD_SCHEMA_PATH}",
  "spec_id": "9b1e2f3a-4c5d-4e6f-8a9b-0c1d2e3f4a5b",
  "spec_title": "Add CSV export to the roadmap view",
  "exported_at": "2026-07-03T02:00:00.000Z",
  "contract": {
    "version": 1,
    "intent": "Let a PM export the current roadmap as a CSV for a board deck.",
    "success_metrics": [
      {
        "id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "text": "Export completes for a 500-row roadmap in under 3 seconds.",
        "status": "standing",
        "superseded_by": null,
        "oracle_kind": "eval",
        "oracle_ref": null,
        "created_at": "2026-07-02T00:00:00.000Z"
      }
    ],
    "non_goals": [],
    "budget": { "estimate": "1 day", "blast_radius": "Read-only, no schema change." },
    "ambiguity_policy": null,
    "drafted_by": "human",
    "drafted_at": "2026-07-02T00:00:00.000Z"
  }
}`;

function ArdPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        // Pinned dark via this element's own spread (custom properties serve
        // their own element): without a ground the page re-themes light for
        // light-theme users while every other public page pins dark. Same
        // pattern as subprocessors and checkout.return. No data-obsidian:
        // nothing here needs that scope and it is counted debt.
        ...PUBLIC_INK_THEME,
        background: "var(--mrd-bg)",
        color: "var(--ink)",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--soft-stone)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <SupaprodMark size={22} />
          <span style={{ fontWeight: 600 }}>Supaprod</span>
        </Link>
        <nav className="text-mrd-base" style={{ display: "flex", gap: 14 }}>
          <a href="/llms.txt" style={{ color: "inherit", textDecoration: "none" }}>
            llms.txt
          </a>
          <a href="/.well-known/agent.json" style={{ color: "inherit", textDecoration: "none" }}>
            Agent card
          </a>
          <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>
            Sign in
          </Link>
        </nav>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>
        <p
          className="text-mrd-tiny"
          style={{
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--mrd-mute)",
          }}
        >
          Interop standard · v{ARD_SCHEMA_VERSION}
        </p>
        {/* Declared display voice for this page title per answers/R011 cluster 5: the page's single largest voice, tuned against its own ground, not a stop. */}
        <h1
          style={{
            fontSize: 34,
            fontWeight: 500,
            margin: "8px 0 14px",
            fontFamily: "var(--font-display, ui-sans-serif, system-ui, sans-serif)",
          }}
        >
          The Agent Requirements Document (ARD)
        </h1>
        {/* The lead sits outside `Section`, so it needs the measure of its own.
            It is the first paragraph an external developer reads. */}
        <p
          className="text-mrd-prose"
          style={{ color: "var(--mrd-mute)", lineHeight: 1.6, maxWidth: "var(--mrd-measure)" }}
        >
          Every spec inside Supaprod carries an Outcome Contract: a typed, structured statement of
          what it is trying to achieve, how success is proven, and what is explicitly out of scope.
          The ARD is that same contract published as an open standard, so a coding agent Supaprod
          dispatches work to, and any MCP client you bring, reads the identical acceptance contract
          Supaprod checks a build against. Not a summary of the spec. The spec's actual terms.
        </p>

        <Section title="Why this exists">
          A one-line prompt loses everything a team actually agreed to the moment it crosses into
          another tool. The ARD keeps intent, success metrics, non-goals, and budget attached to the
          work as it moves, in a shape any system can parse without asking a model to re-interpret
          prose first.
        </Section>

        <Section title="What is in a contract">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>
              <strong>Intent</strong>: one paragraph naming the actual bet.
            </li>
            <li>
              <strong>Success metrics</strong>: falsifiable statements, each tagged with the proof
              oracle that closes it: an eval a model judge grades, the standard CI gate, a human
              checklist item, or a watched assumption when nothing yet falsifies it.
            </li>
            <li>
              <strong>Non-goals</strong>: what is explicitly out of scope.
            </li>
            <li>
              <strong>Budget</strong>: a rough estimate and the blast radius if it goes wrong.
            </li>
            <li>
              <strong>Ambiguity policy</strong>: how to resolve what the contract does not cover.
            </li>
          </ul>
        </Section>

        <Section title="Schema">
          The formal JSON Schema is published at{" "}
          <a href={ARD_SCHEMA_PATH} style={{ color: "inherit" }}>
            {ARD_SCHEMA_PATH}
          </a>
          . It is versioned; a document names the version it conforms to in its own{" "}
          <code>ard_version</code> field, so a consumer can detect drift instead of guessing.
        </Section>

        <Section title="Reading and writing an ARD">
          <p style={{ margin: 0 }}>
            <strong>Fetch one.</strong> Call the <code>get_ard</code> tool over Supaprod&apos;s MCP
            server (<code>POST /api/mcp</code>, bearer token issued at Settings &gt; Interop) with a{" "}
            <code>prd_id</code>. It returns the full envelope below.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            <strong>Export one.</strong> Open any spec&apos;s Contract tab in Supaprod and use
            Export ARD to download the same JSON as a file.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            <strong>Import one.</strong> Paste a schema-conformant ARD document into a spec&apos;s
            Contract tab to adopt it directly, no re-authoring required.
          </p>
        </Section>

        <Section title="Example document">
          <pre
            className="text-mrd-small"
            style={{
              /* Opting out of the prose measure: a JSON document is read by
                 scanning structure, not by line, and wrapping it at 68ch would
                 break the shape that makes it legible. */
              maxWidth: "none",
              background: "rgba(0,0,0,0.04)",
              border: "1px solid var(--soft-stone)",
              borderRadius: 8,
              padding: "14px 16px",
              lineHeight: 1.55,
              overflowX: "auto",
              fontFamily:
                "var(--mrd-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
            }}
          >
            {EXAMPLE}
          </pre>
        </Section>

        <p
          className="text-mrd-label"
          style={{
            color: "var(--mrd-mute)",
            margin: "40px 0 0",
            lineHeight: 1.6,
            borderTop: "1px solid var(--soft-stone)",
            paddingTop: 20,
          }}
        >
          See{" "}
          <a href="/llms.txt" style={{ color: "inherit" }}>
            llms.txt
          </a>{" "}
          for the full list of machine-readable interfaces, and{" "}
          <a href="/agents.txt" style={{ color: "inherit" }}>
            agents.txt
          </a>{" "}
          for the agent access policy.
        </p>
      </main>
    </div>
  );
}
