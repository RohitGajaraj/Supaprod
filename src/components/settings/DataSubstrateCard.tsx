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
      <div className="text-label-13-mono flex items-center gap-[7px]">
        <Database size={16} strokeWidth={1.5} />
        Where your brain lives
      </div>

      <p className="text-copy-13 mt-2 max-w-[520px] text-[var(--ink-muted)]">
        Your workspace runs on a dedicated Postgres database, with pgvector for semantic memory
        search. It is not a shared model or a black box. It is your data, in a database you can
        query, export, and take with you.
      </p>

      <div className="mt-[18px] border-t border-[var(--hairline)] pt-4">
        <div className="text-label-12-mono">Ownership</div>
        <p className="text-copy-13 mt-[6px] max-w-[520px] text-[var(--ink-muted)]">
          This data is yours. Supaprod does not train shared models on it or sell it. The full export
          below is the same data you own, in one file, with no lock-in.
        </p>
      </div>

      <div className="mt-[18px] border-t border-[var(--hairline)] pt-4">
        <div className="text-label-12-mono">Archive, delete, forget</div>
        <div className="grid gap-[10px] mt-2">
          {TIERS.map((t) => (
            <div key={t.label} className="flex gap-[10px] items-baseline">
              <span className="text-label-12-mono w-14 shrink-0 text-[var(--ink-subtle)]">
                {t.label}
              </span>
              <p className="text-copy-13 m-0 leading-[1.5] text-[var(--ink-muted)]">{t.body}</p>
            </div>
          ))}
        </div>
      </div>

      {hasSeal && seal && (
        <div className="mt-[18px] border-t border-[var(--hairline)] pt-4">
          <div className="text-label-12-mono">Integrity seal</div>
          <p className="text-copy-13 mt-[6px] max-w-[520px] text-[var(--ink-muted)]">
            A SHA-256 fingerprint of your decision and outcome record, so you can confirm later it
            has not been altered. No blockchain, no keys, just a checksum every user can run.
          </p>
          <Link
            to="/engine-room"
            search={{ room: "record" }}
            className="text-label-12-mono mt-[10px] inline-flex items-center gap-1.5 text-[var(--ink-subtle)]"
          >
            <span className="tabular-nums" title={seal.head}>
              {shortHead(seal.head)}
            </span>
            <span className="text-[var(--ink-faint)]">
              · {seal.count} record{seal.count === 1 ? "" : "s"}
            </span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      )}
    </div>
  );
}
