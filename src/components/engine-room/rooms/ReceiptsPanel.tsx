/**
 * TRUST-LEDGER MERGE (IA spine 2026-07-11): the Trust Ledger surface, lifted
 * out of the retired /trust-ledger route into the Record room's front tab.
 * Receipts, the tamper seal, and the mission chain are the one Record answer;
 * public-share controls live on the receipt's detail sheet (ShareControl reuses
 * /d/$slug). The route now only 301-redirects; this panel is the content.
 *
 * PORTED to the rebuild primitives (2026-07-29). What changed inside, and why:
 *
 *  - THE CARD IS GONE. A receipt was a bordered card carrying an icon tile, two
 *    pills, a rationale paragraph, a source label, an evidence count, a share
 *    button and a trace ref. Twenty of those inside a room that is already a
 *    bordered region is a card in a card, and it is the exact verbosity the
 *    founder named. A receipt is now a Row: one line, one second line carrying
 *    DIFFERENT facts, and the rest one click away in the detail sheet that
 *    already renders every one of them, share control included.
 *
 *  - THE SUBJECT LEADS. The list sits at the top. The tamper check and the
 *    mission chain are machinery, so they sit under it, each in its own Block
 *    rather than each in its own card.
 *
 *  - ATTRIBUTION IS THE POINT of this surface, so every row carries a mark and
 *    says who: the agent that made the call, you and the agent together when
 *    you settled it, and the honest word "unattributed" when the record does
 *    not say. A row is never silent about its author and never invents one.
 *
 *  - COLOUR HAS JOBS. Monochrome by default. Ember only on a receipt still
 *    waiting on a human (the mark's gate state). Red on a rejected or failed
 *    outcome, green on a decision an outcome has proven. Nothing else.
 *
 * Every server function, query key and exported signature is untouched.
 */
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/components/admin/admin-ui";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Line,
  Num,
  PairMark,
  Record as RecordVerdict,
  Row,
  Select,
  YouMark,
  type MarkState,
} from "@/components/shell/primitives";
import {
  listTrustReceipts,
  getLedgerSeal,
  verifyLedgerSeal,
  type TrustReceipt,
} from "@/lib/trust-ledger.functions";
import { shortHead } from "@/lib/trust-verify";
import { stripAutoPrefix } from "@/components/plan/format";
import { relTimeCaps } from "@/components/discover/format";
import { receiptStatusLabel, ledgerSummary } from "@/components/trust/format";
import { ReceiptDetailSheet } from "@/components/trust/ReceiptDetailSheet";
import { getMissionChain, listChainMissions } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";

type Kind = "all" | "decision" | "action";
type Outcome = "all" | "standing" | "superseded" | "proven";

const KIND_TABS: { id: Kind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "decision", label: "Decisions" },
  { id: "action", label: "Actions" },
];

/** The shared relative stamp, said the way a person says it. relTimeCaps
 *  shouts ("3H AGO") because the retired system set every timestamp in mono
 *  caps; the row's time slot is already mono, so the shout is spare ink. */
function since(iso: string | null | undefined): string {
  return iso ? relTimeCaps(iso).toLowerCase() : "";
}

/** Your initials, derived the same way the app header derives them, so the
 *  disc on a receipt you settled is the same disc you see in the corner. */
function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function useInitials(): string {
  const [initials, setInitials] = useState("?");
  useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setInitials(
        initialsFrom(
          data.user?.email ?? null,
          (data.user?.user_metadata?.full_name as string | undefined) ?? null,
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, []);
  return initials;
}

/** State is never a hue (primitives.css): quiet for a call a later one
 *  replaced, ember for one still waiting on a human, red for one that was
 *  refused or that failed. Everything else stays monochrome.
 *
 *  "waiting", not "gate". Both are ember, but "gate" BLINKS and it is the only
 *  blink in the system, so exactly one mark on a screen may wear it: the one
 *  thing actually asking. This is a LIST, and a workspace with a dozen open
 *  decisions blinked a dozen marks at once, which spends the whole restraint
 *  budget and stops the blink meaning "look here". */
function markState(r: TrustReceipt): MarkState {
  if (r.outcome === "superseded") return "quiet";
  if (r.status === "rejected" || r.status === "failed") return "failed";
  if (r.status === "pending") return "waiting";
  return "idle";
}

/** WHO, in one phrase. The record either names an author or it does not, and
 *  "unattributed" is the honest word for the second case. */
function attribution(r: TrustReceipt): string {
  if (r.humanDecided) {
    return r.actor ? `${agentDisplayName(r.actor)}, settled by you` : "You settled it";
  }
  return r.actor ? agentDisplayName(r.actor) : "unattributed";
}

function ReceiptRow({
  r,
  initials,
  onOpen,
}: {
  r: TrustReceipt;
  initials: string;
  onOpen: () => void;
}) {
  const state = markState(r);
  const failed = r.status === "rejected" || r.status === "failed";
  // You are a different KIND of mark from an agent, not a different colour of
  // the same one. Both marks appear when the crew proposed it and you settled.
  const marks = r.humanDecided ? (
    r.actor ? (
      <PairMark slug={r.actor} initials={initials} state={state} />
    ) : (
      <YouMark initials={initials} mine />
    )
  ) : r.actor ? (
    <AgentMark slug={r.actor} state={state} />
  ) : null;

  return (
    <Row
      tight
      marks={marks}
      lead={stripAutoPrefix(r.title)}
      // The second line is a different fact, never more of the first: who, what
      // family of record, where it landed. The rationale, the evidence and the
      // provenance belong to the one receipt you open, not to fifty rows.
      sub={
        <>
          {attribution(r)} {"·"} {r.kind} {"·"}{" "}
          <span className={failed ? "sp-fail" : undefined}>{receiptStatusLabel(r.status)}</span>
          {r.outcome === "superseded" ? ` · superseded` : null}
          {r.outcome === "proven" ? (
            <>
              {" · "}
              <span className="sp-pass">proven by an outcome</span>
            </>
          ) : null}
        </>
      }
      time={since(r.occurredAt) || null}
      onClick={onOpen}
    />
  );
}

/**
 * TRUST-VERIFY (#26): the integrity check. A SHA-256 FINGERPRINT (a plain
 * checksum, NOT a blockchain) of the whole decision-and-outcome record, which a
 * user SAVES now and re-checks later to confirm the ledger has not changed.
 * The check itself is the record speaking, so its answer renders as the record
 * recess rather than as a coloured sentence with an icon glued to it.
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

  // A failed read may never wear an empty state's clothes: name it, offer the
  // one retry.
  if (sealQ.isError) {
    return (
      <Block title="Tamper check">
        <Failed onRetry={() => void sealQ.refetch()}>The tamper check did not load.</Failed>
      </Block>
    );
  }
  // Hide when there is nothing to fingerprint: an empty ledger hashes to a
  // fixed genesis constant (identical across workspaces), so showing it would
  // offer a meaningless "match". Guard on count === 0.
  if (!seal || seal.available === false || !seal.head || seal.count === 0) return null;

  const v = verify.data;
  const diff = v && !v.ok && v.changed ? sealDiffLine(v.changed) : "";
  const sealedAt = since(seal.sealedAt);
  const ready = paste.trim().length >= 8;

  return (
    <Block
      title="Tamper check"
      sub="Save this fingerprint now. Re-check it later and it tells you whether anything on the record was quietly changed."
    >
      <Line
        label={
          <>
            Fingerprint <Num>{shortHead(seal.head)}</Num>
          </>
        }
        sub={
          <>
            <Num>{seal.count}</Num> record{seal.count === 1 ? "" : "s"}
            {sealedAt ? (
              <>
                , sealed <Num>{sealedAt}</Num>
              </>
            ) : null}
          </>
        }
      >
        <Button
          variant="ghost"
          title={seal.head}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(seal.head);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard blocked, the full head is in the title attribute */
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Verify"}
        </Button>
      </Line>

      {open ? (
        <>
          <Field label="A fingerprint you saved earlier">
            <Input
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste it here"
              spellCheck={false}
            />
          </Field>
          <Actions>
            <Button
              disabled={verify.isPending || !ready}
              title={ready ? undefined : "Paste a saved fingerprint first, at least 8 characters"}
              onClick={() => ready && verify.mutate(paste)}
            >
              {verify.isPending ? "Checking" : "Check it"}
            </Button>
          </Actions>
          {v ? (
            <RecordVerdict evidence={diff ? <Num>{diff}</Num> : undefined}>
              {v.ok ? (
                "Unchanged. The record still matches the fingerprint you saved."
              ) : (
                <span className="sp-fail">
                  Changed. {v.reason ?? "the record no longer matches that fingerprint"}.
                </span>
              )}
            </RecordVerdict>
          ) : verify.isError ? (
            <Failed onRetry={() => ready && verify.mutate(paste)}>The check did not run.</Failed>
          ) : null}
        </>
      ) : null}
    </Block>
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
    <Block title="Mission chain" sub="A missing link is shown, never hidden.">
      {missions.length > 0 ? (
        <Select
          aria-label="Choose a mission"
          value={active ?? ""}
          onChange={(e) => setSelected(e.target.value)}
          style={{ maxWidth: 340, marginBottom: "var(--sp-space-3)" }}
        >
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              {stripAutoPrefix(m.title)}
            </option>
          ))}
        </Select>
      ) : null}

      {missionsQ.isError ? (
        <Failed onRetry={() => void missionsQ.refetch()}>
          The missions did not load. {(missionsQ.error as Error)?.message}
        </Failed>
      ) : chainQ.isError ? (
        <Failed onRetry={() => void chainQ.refetch()}>
          This mission&apos;s chain did not load. {(chainQ.error as Error)?.message}
        </Failed>
      ) : chainQ.data ? (
        <MissionChain chain={chainQ.data} />
      ) : null}
    </Block>
  );
}

export function ReceiptsPanel() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>("all");
  const [outcome, setOutcome] = useState<Outcome>("all");
  const [q, setQ] = useState("");
  const [openReceipt, setOpenReceipt] = useState<TrustReceipt | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const initials = useInitials();

  const fList = useServerFn(listTrustReceipts);
  // Debounce search input so keystrokes don't fire a request per character.
  const debouncedQ = useDebouncedValue(q, 275);
  const query = useQuery({
    queryKey: ["trust-receipts", kind, outcome, debouncedQ],
    queryFn: () => fList({ data: { kind, outcome, q: debouncedQ.trim() || undefined } }),
  });

  const receipts = query.data?.receipts ?? [];
  const counts = query.data?.counts ?? { all: 0, standing: 0, superseded: 0, proven: 0 };
  // "Nothing here" and "nothing matches what you asked for" are different facts
  // and a person acts differently on each.
  const narrowed = kind !== "all" || outcome !== "all" || debouncedQ.trim().length > 0;

  const open = (r: TrustReceipt) => {
    setOpenReceipt(r);
    setSheetOpen(true);
  };

  return (
    <>
      {/* What the record holds, in plain words, from real counts only. */}
      {!query.isPending && !query.isError && counts.all > 0 ? (
        <p className="sp-subtitle">{ledgerSummary(counts)}</p>
      ) : null}

      <div className="sp-tabs" role="tablist" aria-label="Filter by what was recorded">
        {KIND_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={kind === t.id}
            onClick={() => setKind(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--sp-space-3)",
          marginTop: "var(--sp-space-3)",
          flexWrap: "wrap",
        }}
      >
        <Select
          aria-label="Filter by outcome"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as Outcome)}
          style={{ flex: "none", width: 210 }}
        >
          <option value="all">Every outcome</option>
          <option value="standing">Standing{counts.standing ? ` · ${counts.standing}` : ""}</option>
          <option value="proven">Proven{counts.proven ? ` · ${counts.proven}` : ""}</option>
          <option value="superseded">
            Superseded{counts.superseded ? ` · ${counts.superseded}` : ""}
          </option>
        </Select>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search what, why, or who"
          aria-label="Search receipts"
          style={{ flex: 1, minWidth: 200, width: "auto" }}
        />
      </div>

      {query.isPending ? null : query.isError ? (
        <Failed onRetry={() => void query.refetch()}>
          The receipts did not load. {(query.error as Error)?.message}
        </Failed>
      ) : receipts.length === 0 ? (
        narrowed ? (
          <Empty>Nothing on the record matches that.</Empty>
        ) : (
          <Empty
            action={
              <Button
                onClick={() => {
                  // The approvals record lives one sub-tab over in this room.
                  navigate({
                    to: "/engine-room",
                    search: { room: "record", view: "approvals" },
                  });
                }}
              >
                Open your decisions
              </Button>
            }
          >
            Nothing on the record yet. A decision, or an autonomous action you let through, writes a
            receipt the moment it happens.
          </Empty>
        )
      ) : (
        <div style={{ marginTop: "var(--sp-space-4)" }}>
          {receipts.map((r) => (
            <ReceiptRow
              key={`${r.kind}-${r.id}`}
              r={r}
              initials={initials}
              onOpen={() => open(r)}
            />
          ))}
        </div>
      )}

      <SealPanel />

      <MissionChainPanel />

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
