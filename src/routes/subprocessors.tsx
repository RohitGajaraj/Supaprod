// SUBPROC-DISCLOSURE · the PUBLIC sub-processor trust page (`/subprocessors`).
//
// The enterprise/GDPR Art. 28 disclosure surface that a security reviewer can read
// without a login. It renders the SAME catalog-derived registry the in-app
// Settings card uses, but importing the pure `compliance/subprocessors` module
// DIRECTLY (it carries no secrets, so no auth / server fn is needed); the module
// header explicitly sanctions this. The list is derived live from the model
// catalog, so it cannot drift; the legal-reviewed copy, processing regions, and
// the DPA stay a founder/legal pass on top of this factual base.
//
// Engine-Room doctrine: a calm public page that NAMES who has the data and why,
// no jargon. Role-color law: active-vs-available is informational (not a verdict),
// so it uses neutral ink tones, never the reserved ember/madder/moss accents.
import { createFileRoute } from "@tanstack/react-router";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";
import { allSubprocessors, type SubProcessor } from "@/lib/compliance/subprocessors";

const SITE = "https://supaprod.ai";
const TITLE = "Sub-processors · Supaprod";
const DESC =
  "Every third party that touches Supaprod data, what it does, and the region it runs in.";

export const Route = createFileRoute("/subprocessors")({
  component: SubprocessorsPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE}/subprocessors` }],
  }),
});

const CATEGORY_LABEL: Record<SubProcessor["category"], string> = {
  ai_gateway: "AI gateway",
  ai_model_provider: "AI model provider",
  infrastructure: "Infrastructure",
};

function ProcessorRow({ s, first }: { s: SubProcessor; first: boolean }) {
  return (
    <li
      style={{
        padding: "16px 0",
        borderTop: first ? "none" : "1px solid var(--mrd-edge)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{s.name}</span>
        <span className="mono-label text-mrd-nano" style={{ color: "var(--ink-faint)" }}>
          {CATEGORY_LABEL[s.category]}
        </span>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-muted)", margin: "5px 0 0", lineHeight: 1.5 }}>
        {s.purpose}
      </p>
      <p
        className="text-mrd-label"
        style={{ color: "var(--ink-faint)", margin: "5px 0 0", lineHeight: 1.5 }}
      >
        Receives: {s.dataCategories.join(", ")}
        {s.region ? ` · Processed in ${s.region}` : ""}
      </p>
    </li>
  );
}

function Section({ title, note, items }: { title: string; note?: string; items: SubProcessor[] }) {
  if (items.length === 0) return null;
  return (
    <section style={{ marginTop: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: 0 }}>{title}</h2>
      {note && (
        <p
          className="text-mrd-base"
          style={{ color: "var(--ink-faint)", margin: "6px 0 0", lineHeight: 1.5 }}
        >
          {note}
        </p>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0" }}>
        {items.map((s, i) => (
          <ProcessorRow key={s.id} s={s} first={i === 0} />
        ))}
      </ul>
    </section>
  );
}

function SubprocessorsPage() {
  const all = allSubprocessors();
  const active = all.filter((s) => s.active);
  const inactive = all.filter((s) => !s.active);

  return (
    <div
      className="min-h-screen"
      style={{ ...PUBLIC_INK_THEME, background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* This page has no ground mechanism of its own, so without the pinned ink
          set above it silently re-themed light for light-theme users while every
          other public page pins dark. The ground reads --paper from this same
          element's spread (custom properties serve their own element), so it
          pins dark with no raw colour. Same pattern as product.tsx. */}
      <header
        className="border-b hairline px-5 py-3 flex items-center justify-between backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--paper) 60%, transparent)",
        }}
      >
        <a href="/" className="font-display text-sm" style={{ color: "var(--ink)" }}>
          Supaprod
        </a>
        <span className="mono-label text-mrd-nano" style={{ color: "var(--ink-faint)" }}>
          Trust
        </span>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)", margin: 0 }}>
          Sub-processors
        </h1>
        <p
          style={{
            fontSize: 14.5,
            color: "var(--ink-muted)",
            margin: "12px 0 0",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          The third parties that process customer data on Supaprod&apos;s behalf, and what each one
          does. This list is derived from Supaprod&apos;s live model catalog and configuration, so
          it reflects who can receive data today.
        </p>

        <Section title="Currently processing your data" items={active} />
        <Section
          title="Available with your own key"
          note="These providers receive data only if you connect your own provider key. They are listed for transparency about where your data would flow if you enable them."
          items={inactive}
        />

        <p
          className="text-mrd-label"
          style={{
            color: "var(--ink-faint)",
            margin: "40px 0 0",
            lineHeight: 1.6,
            borderTop: "1px solid var(--mrd-edge)",
            paddingTop: 20,
          }}
        >
          For a data-processing agreement (DPA) or details on processing regions, email{" "}
          <a
            href="mailto:privacy@supaprod.ai"
            style={{ color: "var(--ink-faint)", textDecoration: "underline" }}
          >
            privacy@supaprod.ai
          </a>
          .
        </p>
      </main>
    </div>
  );
}
