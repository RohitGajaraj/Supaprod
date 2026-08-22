import { useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  PencilRuler,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Copy,
} from "lucide-react";
import type { Teardown, TeardownVerdict } from "@/lib/ai/public-teardown.server";

// RPT-03 receipt. Renders a Teardown as a Critic receipt: the verdict as a
// labeled chip (icon + word, so it is grayscale-safe and never color-only), the
// headline, RISKS and GAPS as two labeled lists, the recommendation, and a
// confidence line. One honest caption grounds what the Critic did.
//
// THE COLOUR LAYER IS MERIDIAN, ported 2026-08-22. This header used to claim a
// "dark ember Tempo aesthetic" reading under the data-obsidian scope its parent
// page mounts. Both systems are retired, so the claim was a description of a
// palette that no longer decides anything here. 17 occurrences of the retired
// vocabulary are gone and the file carries none.
//
// Mapped by MEANING, which is the naming law, and the three verdicts are the
// only calls in the file that needed judgement rather than a table:
//   - "worth building" is `--mrd-pass` and "risky as written" is `--mrd-fail`.
//     Both are outcomes that HAVE happened: the Critic read the text and
//     reached a judgement, which is exactly what those two words mean.
//   - "needs work" is `--mrd-hold`, not `--mrd-you`. Meridian's `you` means a
//     person is REQUIRED to unblock something, and no decision unblocks this;
//     what it waits on is the spec getting better, which is a condition. That
//     is `hold`, and Meridian has no sixth status word to reach for instead.
//   - the GAPS list takes `--mrd-hold` for the same reason. A gap is what you
//     cannot prove YET: it waits on evidence arriving, not on a person.
//   - the RISKS list takes `--mrd-fail`. A flagged risk is a result the Critic
//     reported, not an intent, so the clause that keeps red off "roll back"
//     does not apply to it.
//   - the copy control turns `--mrd-pass` once the clipboard write RESOLVES,
//     never on the press, so the colour still reports something that happened.
//
// Nothing was dropped. Every verdict still carries its own icon beside the
// word, so the receipt survives the greyscale test on shape alone and the
// colour is doing no load-bearing work by itself.

const VERDICT_META: Record<TeardownVerdict, { color: string; Icon: typeof CheckCircle2 }> = {
  "worth building": { color: "var(--mrd-pass)", Icon: CheckCircle2 },
  "needs work": { color: "var(--mrd-hold)", Icon: PencilRuler },
  "risky as written": { color: "var(--mrd-fail)", Icon: ShieldAlert },
};

const sectionLabel: CSSProperties = {
  color: "var(--mrd-mute)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 10,
};

const hairline: CSSProperties = {
  height: 1,
  background: "var(--mrd-edge)",
  margin: "20px 0",
};

function List({
  items,
  Icon,
  tone,
  empty,
}: {
  items: string[];
  Icon: typeof AlertTriangle;
  tone: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p style={{ color: "var(--mrd-mute)", lineHeight: 1.5 }}>{empty}</p>;
  }
  return (
    <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <Icon size={16} strokeWidth={1.5} style={{ color: tone, flexShrink: 0, marginTop: 2 }} />
          <span style={{ color: "var(--mrd-ink)", lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TeardownReceipt({ teardown }: { teardown: Teardown }) {
  const meta = VERDICT_META[teardown.verdict] ?? VERDICT_META["needs work"];
  const { Icon: VerdictIcon, color } = meta;
  const confidencePct = Math.round(teardown.confidence * 100);

  return (
    <div
      className="material-medium fade-up"
      style={{ padding: "var(--geist-gap)", textAlign: "left", width: "100%" }}
      aria-label="Supaprod Critic teardown"
    >
      {/* Receipt header: mono kicker + verdict chip. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--geist-space-3x)",
          flexWrap: "wrap",
        }}
      >
        <div className="mono-label" style={{ color: "var(--mrd-mute)" }}>
          Supaprod Critic · evidence
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            borderRadius: 999,
            border: `1px solid ${color}`,
            background: `color-mix(in oklab, ${color} 12%, transparent)`,
          }}
        >
          <VerdictIcon size={14} strokeWidth={1.5} style={{ color }} />
          <span
            style={{
              fontWeight: 600,
              color: "var(--mrd-ink)",
              textTransform: "capitalize",
            }}
          >
            {teardown.verdict}
          </span>
        </div>
      </div>

      {/* Headline. */}
      <h2
        style={{
          lineHeight: 1.35,
          color: "var(--mrd-ink)",
          margin: "16px 0 0",
          fontWeight: 600,
        }}
      >
        {teardown.headline || "The Critic read your document."}
      </h2>

      <div style={hairline} />

      {/* Risks. */}
      <div className="mono-label" style={sectionLabel}>
        <AlertTriangle size={16} strokeWidth={1.5} />
        Risks
      </div>
      <List
        items={teardown.risks}
        Icon={AlertTriangle}
        tone="var(--mrd-fail)"
        empty="No load-bearing risks flagged in what you pasted."
      />

      <div style={hairline} />

      {/* Gaps. */}
      <div className="mono-label" style={sectionLabel}>
        <HelpCircle size={16} strokeWidth={1.5} />
        Gaps
      </div>
      <List
        items={teardown.gaps}
        Icon={HelpCircle}
        tone="var(--mrd-hold)"
        empty="No missing evidence flagged in what you pasted."
      />

      {teardown.recommendation ? (
        <>
          <div style={hairline} />
          <div className="mono-label" style={sectionLabel}>
            <ArrowRight size={16} strokeWidth={1.5} />
            Recommendation
          </div>
          <p style={{ color: "var(--mrd-ink)", lineHeight: 1.55 }}>{teardown.recommendation}</p>
        </>
      ) : null}

      <div style={hairline} />

      {/* Confidence line: label + value + a thin grayscale-safe meter. */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <span className="mono-label" style={{ color: "var(--mrd-mute)" }}>
          Critic confidence
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: 200 }}>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: "var(--mrd-edge)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${confidencePct}%`,
                height: "100%",
                background: "var(--mrd-ink)",
                borderRadius: 999,
              }}
            />
          </div>
          <span
            className="mono-label"
            style={{ color: "var(--mrd-ink)", minWidth: 34, textAlign: "right" }}
          >
            {confidencePct}%
          </span>
        </div>
      </div>

      {/* THE MOST SHAREABLE THING WE MAKE, AND IT HAD NO WAY OUT.
       *
       * A decision gets a public /d/<slug>, a teardown got nothing, so the one
       * artifact a visitor actually wants to paste into a team channel died on
       * their screen. That is the growth loop, missing.
       *
       * It copies rather than minting a link ON PURPOSE. This page's promise is
       * "Your text is sent once to Supaprod's Critic to write this receipt.
       * Nothing is stored to an account until you make one", and the API keeps
       * that promise by persisting nothing at all. A share URL would require
       * storing the teardown, which is a real change to that promise and the
       * founder's call to make, not a side effect of a share button. Copying
       * hands the reader the whole receipt, costs no schema, and leaves the
       * privacy line true exactly as written. */}
      <CopyReceipt teardown={teardown} />

      {/* Honest caption: what this receipt is, and what it is not. */}
      <p
        style={{
          color: "var(--mrd-mute)",
          lineHeight: 1.55,
          marginTop: 18,
        }}
      >
        Supaprod's Critic read only the text you pasted. No web search, no market data, no memory of
        a workspace. It judges what your words support, nothing more.
      </p>
    </div>
  );
}

/** The receipt as plain text, in the order a reader scans it on screen.
 *  Exported for the test that pins the shared format. */
export function asPlainText(t: Teardown): string {
  const block = (label: string, items: string[]) =>
    items.length ? `\n${label}\n${items.map((i) => `- ${i}`).join("\n")}` : "";
  return [
    `SUPAPROD CRITIC / ${t.verdict.toUpperCase()}`,
    "",
    t.headline,
    block("RISKS", t.risks ?? []),
    block("WHAT YOU CANNOT PROVE YET", t.gaps ?? []),
    t.recommendation ? `\nRECOMMENDATION\n${t.recommendation}` : "",
    "",
    "Torn down by Supaprod's Critic. Try your own: https://supaprod.ai/p/teardown",
  ]
    .filter(Boolean)
    .join("\n");
}

function CopyReceipt({ teardown }: { teardown: Teardown }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(asPlainText(teardown)).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2400);
          },
          // A denied clipboard permission must not look like a broken button.
          () => setCopied(false),
        );
      }}
      className="mono-label"
      style={{
        marginTop: 18,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "1px solid var(--mrd-edge)",
        borderRadius: 999,
        padding: "5px 12px",
        color: copied ? "var(--mrd-pass)" : "var(--mrd-mute)",
        cursor: "pointer",
      }}
      // The label reports what the press DID, not what the button is.
      aria-live="polite"
    >
      {copied ? (
        <>
          <CheckCircle2 size={13} strokeWidth={1.75} /> Copied, paste it anywhere
        </>
      ) : (
        <>
          <Copy size={13} strokeWidth={1.75} /> Copy this teardown
        </>
      )}
    </button>
  );
}
