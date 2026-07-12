/**
 * TRUST-LEDGER MERGE (IA spine 2026-07-11): the Trust Ledger surface, lifted
 * out of the retired /trust-ledger route into the Record room's front tab.
 * Receipts, the tamper seal, and the mission chain are the one Record answer;
 * public-share controls stay here on the receipts tab (ShareControl reuses
 * /d/$slug). The route now only 301-redirects; this panel is the content.
 */
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState, type CSSProperties } from "react";
import { useDebouncedValue } from "@/components/admin/admin-ui";
import {
  ScrollText,
  Gavel,
  Zap,
  User,
  Bot,
  History,
  Link2,
  Search,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { TabRow, EmptyState, MonoLabel } from "@/components/cadence/Primitives";
import {
  listTrustReceipts,
  getLedgerSeal,
  verifyLedgerSeal,
  type TrustReceipt,
} from "@/lib/trust-ledger.functions";
import { shortHead } from "@/lib/trust-verify";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";
import { relTimeCaps } from "@/components/discover/format";
import {
  receiptStatusTone,
  receiptStatusLabel,
  RECEIPT_TONE_VAR,
  receiptTraceRef,
  ledgerSummary,
} from "@/components/trust/format";
import { ReceiptDetailSheet, ShareControl } from "@/components/trust/ReceiptDetailSheet";
import { getMissionChain, listChainMissions } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";

type Kind = "all" | "decision" | "action";
type Outcome = "all" | "standing" | "superseded" | "proven";

function OutcomePill({
  outcome,
  supersededBy,
}: {
  outcome: TrustReceipt["outcome"];
  supersededBy: string | null;
}) {
  const superseded = outcome === "superseded";
  const label = superseded ? "Superseded" : outcome === "proven" ? "Proven" : "Standing";
  return (
    <span
      title={superseded && supersededBy ? `Superseded by ${supersededBy.slice(0, 8)}` : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        padding: "2px 8px",
        borderRadius: 999,
        color: superseded ? "var(--text-subtle)" : "var(--moss)",
        background: superseded
          ? "var(--raised)"
          : "color-mix(in srgb, var(--moss) 12%, transparent)",
        border: `1px solid ${superseded ? "var(--hairline)" : "color-mix(in srgb, var(--moss) 30%, transparent)"}`,
      }}
    >
      {superseded ? <History size={10} strokeWidth={2} /> : null}
      {label}
    </span>
  );
}

/** A quiet mono-caps status pill, colored by the receipt's semantic role tone.
 * Obsidian correctness: rejected/failed reads madder (alert), never the soft
 * data pink that `--rose` resolves to under the dark theme. */
function StatusPill({ status }: { status: string }) {
  const tone = RECEIPT_TONE_VAR[receiptStatusTone(status)];
  return (
    <span
      className="tabular-nums"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        color: tone,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        border: "1px solid var(--hairline)",
        borderRadius: 999,
        padding: "2px 8px",
      }}
    >
      {receiptStatusLabel(status)}
    </span>
  );
}

function ReceiptCard({ r, onOpen }: { r: TrustReceipt; onOpen: () => void }) {
  const KindIcon = r.kind === "decision" ? Gavel : Zap;
  const superseded = r.outcome === "superseded";
  const pendingGate = r.status === "pending" && !superseded;
  // Honest verdict line (LOOM §9b): the status pill carries the verdict, so
  // the actor label stays neutral.
  const decidedBy = r.humanDecided
    ? { Icon: User, label: "decided by you" }
    : { Icon: Bot, label: r.actor ? `${r.actor}` : "agent" };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open receipt: ${stripAutoPrefix(r.title)}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      // Hover in CSS (conditional class), not JS mouse handlers, so the
      // state can never stick after a keyboard interaction (checklist 1).
      className={`loom-press${pendingGate ? "" : " hover:[background-color:var(--raised)]"}`}
      data-superseded={superseded ? "true" : undefined}
      style={{
        padding: "16px 18px",
        borderRadius: "var(--radius-card)",
        cursor: "pointer",
        opacity: superseded ? 0.72 : 1,
        border: `1px solid ${pendingGate ? "var(--ember-line)" : "var(--hairline)"}`,
        background: pendingGate ? "var(--ember-tint)" : "var(--card)",
        transitionProperty: "background-color, border-color",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span
          aria-hidden
          style={{
            display: "inline-flex",
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 9,
            background: "var(--raised)",
            color: "var(--text-subtle)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KindIcon size={15} strokeWidth={1.9} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>
              {stripAutoPrefix(r.title)}
            </span>
            {isAutoTitle(r.title) ? <AutoChip /> : null}
            <OutcomePill outcome={r.outcome} supersededBy={r.supersededBy} />
          </div>
          {r.rationale ? (
            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-body)",
                lineHeight: 1.5,
                marginTop: 5,
              }}
            >
              {r.rationale}
            </p>
          ) : (
            <p
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                marginTop: 5,
                fontStyle: "italic",
              }}
            >
              No rationale recorded.
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <MonoLabel icon={decidedBy.Icon} style={{ fontSize: 10.5 }}>
              {decidedBy.label}
            </MonoLabel>
            <StatusPill status={r.status} />
            {r.source.label ? (
              <MonoLabel icon={Link2} style={{ fontSize: 10.5, color: "var(--text-faint)" }}>
                {r.source.kind ? `${r.source.kind}: ` : ""}
                {r.source.label}
              </MonoLabel>
            ) : null}
            {r.evidenceCount > 0 ? (
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-faint)",
                }}
                title="Provenance edges linked to this record"
              >
                {r.evidenceCount} evidence
              </span>
            ) : null}
            {/* TRUST-SHARE: only decisions are publicly shareable (reuse /d/$slug). */}
            {r.kind === "decision" ? <ShareControl decisionId={r.id} /> : null}
            <span className="flex items-center" style={{ marginLeft: "auto", gap: 10 }}>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.06em",
                  color: "var(--text-subtle)",
                }}
              >
                {relTimeCaps(r.occurredAt)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.06em",
                  color: "var(--text-faint)",
                }}
              >
                {receiptTraceRef(r)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * TRUST-VERIFY (#26): the integrity check. Shows a SHA-256 FINGERPRINT (a plain
 * checksum, NOT a blockchain) of the whole decision-and-outcome record, what a user
 * SAVES now and re-checks later to confirm the ledger has not changed. "Verify" checks
 * the current record against a fingerprint saved earlier. Available to every user.
 * Calm chrome: one quiet bar, the check revealed on demand.
 */
function SealPanel() {
  const fSeal = useServerFn(getLedgerSeal);
  const fVerify = useServerFn(verifyLedgerSeal);
  const sealQ = useQuery({ queryKey: ["ledger-seal"], queryFn: () => fSeal({ data: {} }) });
  const verify = useMutation({
    mutationFn: (head: string) => fVerify({ data: { head: head.trim() } }),
  });
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);

  const seal = sealQ.data;
  // A failed seal read may not vanish silently (an error never wears an empty
  // state's clothes): name it and offer the one retry.
  if (sealQ.isError) {
    return (
      <section
        style={{
          padding: "12px 16px",
          marginBottom: 18,
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 12.5, color: "var(--madder-bright)" }}>
          The tamper check did not load.
        </span>
        <button
          type="button"
          onClick={() => void sealQ.refetch()}
          className="hover:underline active:opacity-80"
          style={chipStyle}
        >
          Retry
        </button>
      </section>
    );
  }
  // Hide when there is nothing to fingerprint: an empty ledger hashes to a fixed
  // genesis constant (identical across workspaces), so showing it would offer a
  // meaningless "match", guard on count === 0.
  if (!seal || seal.available === false || !seal.head || seal.count === 0) return null;

  const v = verify.data;

  return (
    <section
      style={{
        padding: "12px 16px",
        marginBottom: 18,
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <ShieldCheck size={15} strokeWidth={1.9} color="var(--moss)" />
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-primary)" }}>
          Tamper check
        </span>
        <span
          className="tabular-nums"
          title={seal.head}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-subtle)" }}
        >
          {shortHead(seal.head)}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}>
          {seal.count} record{seal.count === 1 ? "" : "s"} · as of {relTimeCaps(seal.sealedAt)}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(seal.head);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* clipboard blocked, the full head is in the title attribute */
              }
            }}
            className="hover:[background-color:var(--raised)] active:opacity-80"
            style={chipStyle}
            title="Copy the full fingerprint to save it"
          >
            {copied ? <Check size={11} strokeWidth={2} /> : <Copy size={11} strokeWidth={1.8} />}
            {copied ? "Copied" : "Copy fingerprint"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="hover:[background-color:var(--raised)] active:opacity-80"
            style={chipStyle}
            aria-expanded={open}
          >
            {open ? "Close" : "Verify"}
          </button>
        </span>
      </div>

      <p
        style={{ fontSize: 11.5, color: "var(--text-subtle)", margin: "8px 0 0", lineHeight: 1.5 }}
      >
        A fingerprint of the whole record. Save it now, and re-check it later to confirm nothing was
        quietly changed.
      </p>

      {open ? (
        <div
          style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
        >
          <input
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Paste a fingerprint you saved earlier"
            aria-label="Fingerprint to check"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 220,
              fontFamily: "var(--font-mono)",
              fontSize: 11.5,
              padding: "7px 10px",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              background: "var(--surface-recessed)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={() => paste.trim() && verify.mutate(paste)}
            disabled={verify.isPending || paste.trim().length < 8}
            title={
              paste.trim().length < 8
                ? "Paste a saved fingerprint first (at least 8 characters)"
                : undefined
            }
            className="hover:enabled:[background-color:var(--raised)] active:enabled:opacity-80"
            style={{
              ...chipStyle,
              opacity: verify.isPending || paste.trim().length < 8 ? 0.55 : 1,
              cursor: verify.isPending || paste.trim().length < 8 ? "not-allowed" : "pointer",
            }}
          >
            {verify.isPending ? "Checking" : "Check"}
          </button>
          {v ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: v.ok ? "var(--moss)" : "var(--madder)",
              }}
            >
              {v.ok ? (
                <Check size={13} strokeWidth={2.2} />
              ) : (
                <AlertTriangle size={13} strokeWidth={2} />
              )}
              {v.ok
                ? "Unchanged. Your ledger matches this fingerprint."
                : `Changed: ${v.reason ?? "the ledger no longer matches this fingerprint"}.`}
            </span>
          ) : verify.isError ? (
            <span style={{ fontSize: 12, color: "var(--madder)" }}>
              Could not verify. Try again.
            </span>
          ) : null}
          {v && !v.ok && v.changed ? (
            <span
              className="tabular-nums"
              style={{
                width: "100%",
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--text-subtle)",
              }}
            >
              {sealDiffLine(v.changed)}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Plain words for the pinpointed change (from the saved seal's per-record links);
 * empty when the saved fingerprint predates seal persistence (head-only compare). */
function sealDiffLine(changed: { added: string[]; removed: string[]; mutated: string[] }): string {
  const show = (ids: string[]) =>
    ids
      .slice(0, 6)
      .map((i) => i.slice(0, 8))
      .join(", ") + (ids.length > 6 ? ` +${ids.length - 6} more` : "");
  return [
    changed.mutated.length ? `altered: ${show(changed.mutated)}` : null,
    changed.added.length ? `added: ${show(changed.added)}` : null,
    changed.removed.length ? `removed: ${show(changed.removed)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  color: "var(--text-subtle)",
  background: "transparent",
  border: "1px solid var(--hairline)",
  borderRadius: 99,
  padding: "3px 9px",
  cursor: "pointer",
};

/** A plain-language line, from REAL counts only, so a non-expert understands
 * what the ledger holds without knowing the schema. */
function LedgerSummary({
  counts,
}: {
  counts: { all: number; standing: number; superseded: number; proven?: number };
}) {
  if (counts.all === 0) return null;
  return (
    <p
      style={{
        fontSize: 12.5,
        color: "var(--text-body)",
        margin: "0 0 18px",
        lineHeight: 1.5,
      }}
    >
      {ledgerSummary(counts)}
    </p>
  );
}

/**
 * SW-5 deliverable B: the per-mission chain walk. Pick a mission and the ledger
 * shows its signal -> decision -> contract -> design -> build -> test -> merge
 * -> deploy -> outcome chain from real rows, marking any missing link. This is
 * the moat made visible, distinct from the flat receipt list + tamper seal.
 */
function MissionChainPanel() {
  const fMissions = useServerFn(listChainMissions);
  const fChain = useServerFn(getMissionChain);
  const missionsQ = useQuery({
    queryKey: ["chain-missions"],
    queryFn: () => fMissions(),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const missions = missionsQ.data ?? [];
  const active = selected ?? missions[0]?.id ?? null;

  const chainQ = useQuery({
    queryKey: ["mission-chain", active],
    queryFn: () => fChain({ data: { missionId: active as string } }),
    enabled: Boolean(active),
  });

  // An empty workspace hides the panel; a failed load must NOT (silence would
  // read as "no missions" on the trust surface - render the error instead).
  if (!missionsQ.isPending && !missionsQ.isError && missions.length === 0) return null;

  return (
    <section aria-label="Mission chain" style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <MonoLabel style={{ fontSize: 10.5 }}>Mission chain</MonoLabel>
        <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>
          the loop, walked end to end
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
        {missions.length > 0 ? (
          <select
            className="input"
            aria-label="Choose a mission"
            value={active ?? ""}
            onChange={(e) => setSelected(e.target.value)}
            style={{ fontSize: 12, maxWidth: 260, padding: "4px 8px" }}
          >
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {stripAutoPrefix(m.title)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {missionsQ.isError ? (
        <div style={{ fontSize: 12.5, color: "var(--madder-bright)", padding: "10px 0" }}>
          Could not load missions for the chain. {(missionsQ.error as Error)?.message}{" "}
          <button
            type="button"
            onClick={() => void missionsQ.refetch()}
            className="cursor-pointer hover:underline active:opacity-80"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--text-primary)",
              fontSize: 12.5,
            }}
          >
            Retry
          </button>
        </div>
      ) : chainQ.isError ? (
        <div style={{ fontSize: 12.5, color: "var(--madder-bright)", padding: "10px 0" }}>
          Could not walk this mission's chain. {(chainQ.error as Error)?.message}{" "}
          <button
            type="button"
            onClick={() => void chainQ.refetch()}
            className="cursor-pointer hover:underline active:opacity-80"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--text-primary)",
              fontSize: 12.5,
            }}
          >
            Retry
          </button>
        </div>
      ) : chainQ.data ? (
        <MissionChain chain={chainQ.data} />
      ) : chainQ.isPending ? (
        <div
          aria-hidden="true"
          style={{
            height: 240,
            borderRadius: "var(--radius-card)",
            background: "var(--surface-card-deep)",
            boxShadow: "var(--top-light)",
          }}
        />
      ) : null}
    </section>
  );
}

export function ReceiptsPanel() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>("all");
  const [outcome, setOutcome] = useState<Outcome>("all");
  const [q, setQ] = useState("");
  const [openReceipt, setOpenReceipt] = useState<TrustReceipt | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fList = useServerFn(listTrustReceipts);
  // Debounce search input so keystrokes don't fire a request per character.
  const debouncedQ = useDebouncedValue(q, 275);
  const query = useQuery({
    queryKey: ["trust-receipts", kind, outcome, debouncedQ],
    queryFn: () => fList({ data: { kind, outcome, q: debouncedQ.trim() || undefined } }),
  });

  const receipts = query.data?.receipts ?? [];
  const counts = query.data?.counts ?? { all: 0, standing: 0, superseded: 0, proven: 0 };

  const kindTabs = useMemo(
    () => [
      { id: "all", label: "All" },
      { id: "decision", label: "Decisions" },
      { id: "action", label: "Actions" },
    ],
    [],
  );

  const open = (r: TrustReceipt) => {
    setOpenReceipt(r);
    setSheetOpen(true);
  };

  return (
    <>
      {!query.isPending && !query.isError ? <LedgerSummary counts={counts} /> : null}

      <SealPanel />

      <MissionChainPanel />

      <TabRow tabs={kindTabs} active={kind} onSet={(id) => setKind(id as Kind)} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div
          role="group"
          aria-label="Filter by outcome"
          style={{
            display: "inline-flex",
            gap: 2,
            padding: 2,
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
          }}
        >
          {(["all", "standing", "proven", "superseded"] as Outcome[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOutcome(o)}
              aria-pressed={outcome === o}
              className="tabular-nums loom-press hover:[color:var(--text-primary)]"
              style={{
                fontSize: 11.5,
                padding: "4px 11px",
                borderRadius: 6,
                textTransform: "capitalize",
                color: outcome === o ? "var(--text-primary)" : "var(--text-subtle)",
                background: outcome === o ? "var(--card)" : "transparent",
                fontWeight: outcome === o ? 600 : 400,
                boxShadow: outcome === o ? "var(--top-light)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {o}
              {o === "standing" && counts.standing ? ` · ${counts.standing}` : ""}
              {o === "proven" && counts.proven ? ` · ${counts.proven}` : ""}
              {o === "superseded" && counts.superseded ? ` · ${counts.superseded}` : ""}
            </button>
          ))}
        </div>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            flex: 1,
            minWidth: 200,
            padding: "6px 11px",
            border: "1px solid var(--hairline)",
            borderRadius: 8,
          }}
        >
          <Search size={14} strokeWidth={1.8} color="var(--text-faint)" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search what, why, or who"
            aria-label="Search receipts"
            // No outline:none here: the focus ring is never removed (Tempo
            // law); the global [data-obsidian] :focus-visible rule draws it.
            style={{
              border: "none",
              background: "transparent",
              fontSize: 12.5,
              width: "100%",
              color: "var(--text-primary)",
            }}
          />
        </label>
      </div>

      {query.isPending ? (
        <div style={{ fontSize: 13, color: "var(--text-subtle)", padding: "32px 0" }}>
          Loading receipts
        </div>
      ) : query.isError ? (
        <div style={{ fontSize: 13, color: "var(--madder)", padding: "32px 0" }}>
          Could not load the receipts. {(query.error as Error)?.message}{" "}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="cursor-pointer hover:underline active:opacity-80"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No receipts yet"
          body="Decisions and approved autonomous actions appear here as receipts the moment they happen, with their evidence and whether they still stand."
          cta="Open your decisions"
          onCta={() => {
            // The approvals record lives one sub-tab over in this same room.
            navigate({ to: "/engine-room", search: { room: "record", view: "approvals" } });
          }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {receipts.map((r) => (
            <ReceiptCard key={`${r.kind}-${r.id}`} r={r} onOpen={() => open(r)} />
          ))}
        </div>
      )}

      <ReceiptDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        receipt={openReceipt}
        onOpenReceipt={(id) => {
          const next = receipts.find((x) => x.id === id);
          if (next) setOpenReceipt(next);
          else toast("That record is not in the current list");
        }}
      />
    </>
  );
}
