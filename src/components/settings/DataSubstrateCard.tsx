import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Database, ArrowRight } from "lucide-react";
import { getLedgerSeal } from "@/lib/trust-ledger.functions";
import { shortHead } from "@/lib/trust-verify";

// BRN-02 "Where your brain lives": one calm Settings > Data card that answers
// the data-custody question plainly, the opposite of the usual Engine-Room
// instinct to hide the mechanism. Composes facts that already exist elsewhere
// (the DB substrate, the memory-on-delete model, the TRUST-VERIFY seal) into
// one legible place instead of leaving them scattered or undocumented in-app.
// Engine-Room: this is the one surface where naming the mechanism IS the
// outcome, disarming the data-custody question in a sales or procurement call.

const TIERS: { label: string; body: string }[] = [
  {
    label: "Archive",
    body: "Hides a build from your list. Fully reversible. Keeps everything, including anything it taught Memory.",
  },
  {
    label: "Delete",
    body: "Removes a build's working files and log. Anything it taught Memory stays, the way a decision outlives the meeting that produced it.",
  },
  {
    label: "Forget",
    body: "A separate, deliberate action for removing something from Memory itself. Not a side effect of tidying up. Coming as its own explicit, warned step.",
  },
];

export function DataSubstrateCard() {
  const fSeal = useServerFn(getLedgerSeal);
  const sealQ = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });
  const seal = sealQ.data;
  const hasSeal = seal?.available && !!seal.head && seal.count > 0;

  return (
    <div className="material-medium" style={{ padding: 24, maxWidth: 640 }}>
      <div className="mono-label" style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Database size={13} strokeWidth={1.8} />
        Where your brain lives
      </div>

      <p
        className="text-copy-13"
        style={{ color: "var(--ink-muted)", marginTop: 8, maxWidth: 520 }}
      >
        Your workspace runs on a dedicated Postgres database, with pgvector for semantic memory
        search. It is not a shared model or a black box. It is your data, in a database you can
        query, export, and take with you.
      </p>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
        <div className="mono-label" style={{ fontSize: 10 }}>
          Ownership
        </div>
        <p
          className="text-copy-13"
          style={{ color: "var(--ink-muted)", marginTop: 6, maxWidth: 520 }}
        >
          This data is yours. Cadence does not train shared models on it or sell it. The full export
          below is the same data you own, in one file, with no lock-in.
        </p>
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
        <div className="mono-label" style={{ fontSize: 10 }}>
          Archive, delete, forget
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          {TIERS.map((t) => (
            <div key={t.label} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span
                className="mono-label"
                style={{ fontSize: 10, color: "var(--ink-subtle)", width: 56, flexShrink: 0 }}
              >
                {t.label}
              </span>
              <p style={{ fontSize: 12.5, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {hasSeal && seal && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
          <div className="mono-label" style={{ fontSize: 10 }}>
            Integrity seal
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 6, maxWidth: 520 }}>
            A SHA-256 fingerprint of your decision and outcome record, so you can confirm later it
            has not been altered. No blockchain, no keys, just a checksum every user can run.
          </p>
          <Link
            to="/engine-room"
            search={{ room: "record" }}
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-subtle)",
            }}
          >
            <span className="tabular-nums" title={seal.head}>
              {shortHead(seal.head)}
            </span>
            <span style={{ color: "var(--ink-faint)" }}>
              · {seal.count} record{seal.count === 1 ? "" : "s"}
            </span>
            <ArrowRight size={11} strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </div>
  );
}
