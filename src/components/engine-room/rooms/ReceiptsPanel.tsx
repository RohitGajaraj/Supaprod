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
 *  - COLOUR HAS JOBS. Monochrome by default. The accent only on a record still
 *    waiting on a human. Red on a rejected or failed outcome, green on a
 *    decision an outcome has proven. Nothing else.
 *
 * Every server function, query key and exported signature is untouched.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-15: PORTED TO MERIDIAN, and one state that was missing is now drawn.
 *
 * A READ IN FLIGHT WAS A BLANK PAGE. The list rendered `query.isPending ? null`,
 * so on a cold load this tab drew its filters and then nothing at all, for as
 * long as the read took, with no signal that anything was coming. Nothing here,
 * nothing matched, the read failed and the read is still running are four
 * different facts in this product precisely so that a read in flight never
 * wears the clothes of an empty record, and this panel was skipping straight
 * past that rule. /approvals had the identical defect and fixed it the same
 * way: a plain quiet line, in a live region, and never the elapsed-timer loader
 * (that one belongs where an agent genuinely runs for seconds; on an ordinary
 * row read it invents a wait).
 *
 * THE MARKS ARE NEUTRAL NOW. The shell's mark encodes the agent as a shape AND
 * its loop stage as a hue. Meridian spends colour on one distinction, what a
 * machine did against what a person must decide, and a stage rainbow down fifty
 * rows competes with the one accent that says a record is still waiting on a
 * person. The shape still carries the identity and survives greyscale alone.
 */
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/components/admin/admin-ui";
import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { glyphForSlug } from "@/components/shell/agent-glyphs";
import { Field, SegmentedFilter, TextInput } from "../EngineChrome";
import {
  Action,
  Actions,
  Figure,
  NothingHere,
  Picker,
  ReadFailed,
  Reading,
  RecordSpeaks,
  Region,
} from "@/components/meridian/surface-parts";
import { Line } from "@/components/meridian/rows";
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

/**
 * Four states, four tokens, and no fifth.
 *
 *  QUIET   a call a later one replaced. It is history, so it recedes.
 *  ORCHID  still waiting on a human. The one meaning the accent has.
 *  RED     refused, or it failed. An outcome, which is all red ever means.
 *  NEUTRAL settled and unremarkable.
 *
 * NOTHING BLINKS HERE. The blink is the system's single reserved animation and
 * exactly one mark on a screen may wear it: the one thing actually asking. This
 * is a LIST, and a workspace with a dozen open decisions blinked a dozen marks
 * at once, which spends the whole restraint budget and stops the blink meaning
 * "look here".
 */
type ReceiptMarkState = "quiet" | "waiting" | "failed" | "idle";

const MARK_INK: Record<ReceiptMarkState, string> = {
  quiet: "text-mrd-faint",
  waiting: "text-mrd-you",
  failed: "text-mrd-fail",
  idle: "text-mrd-mute",
};

function markState(r: TrustReceipt): ReceiptMarkState {
  if (r.outcome === "superseded") return "quiet";
  if (r.status === "rejected" || r.status === "failed") return "failed";
  if (r.status === "pending") return "waiting";
  return "idle";
}

/**
 * THE AGENT, AND YOU, AS TWO DIFFERENT KINDS OF MARK.
 *
 * You are a filled disc carrying initials; an agent is its own silhouette in a
 * bordered tile. That difference is structural rather than chromatic, which is
 * what lets both survive greyscale and what keeps the colour free to say
 * whether the record is still waiting on someone.
 *
 * DUPLICATED FROM components/crew/CrewChrome.tsx, deliberately and visibly. The
 * right home for one agent mark drawn in Meridian is components/meridian/, and
 * this lane does not own that folder; reaching into the Crew surface's parts
 * from the Engine Room would couple two surfaces that must stay separately
 * changeable. Recorded here rather than hidden, and flagged in the report.
 */
function AgentGlyphMark({ slug, state }: { slug: string; state: ReceiptMarkState }) {
  const Glyph = glyphForSlug(slug);
  return (
    <span
      aria-hidden
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-mrd-chip border border-mrd-line bg-mrd-sink [&>svg]:size-3.5 ${MARK_INK[state]}`}
    >
      <Glyph />
    </span>
  );
}

function YouDisc({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="font-mrd-mono inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-mrd-solid text-[10px] font-medium text-mrd-on-solid"
      style={{ boxShadow: "inset 0 1px 0 var(--mrd-sheen)" }}
    >
      {initials}
    </span>
  );
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
      <span className="flex shrink-0 items-center -space-x-1.5">
        <AgentGlyphMark slug={r.actor} state={state} />
        <YouDisc initials={initials} />
      </span>
    ) : (
      <YouDisc initials={initials} />
    )
  ) : r.actor ? (
    <AgentGlyphMark slug={r.actor} state={state} />
  ) : null;

  const stamp = since(r.occurredAt);

  return (
    <button
      type="button"
      data-mrd=""
      onClick={onOpen}
      className="flex w-full items-center gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-mrd-4 text-left transition-colors last:border-0 hover:bg-mrd-hover"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {marks}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-mrd-ink">
          {stripAutoPrefix(r.title)}
        </span>
        {/* The second line is a different fact, never more of the first: who,
            what family of record, and how it stands. The rationale, the
            evidence and where it came from belong to the one record you open,
            not to fifty rows. */}
        <span className="mt-0.5 block truncate text-[12px] text-mrd-mute">
          {attribution(r)} · {r.kind} ·{" "}
          <span className={failed ? "text-mrd-fail" : undefined}>
            {receiptStatusLabel(r.status)}
          </span>
          {r.outcome === "superseded" ? " · superseded" : null}
          {r.outcome === "proven" ? (
            <>
              {" · "}
              <span className="text-mrd-pass">proven by an outcome</span>
            </>
          ) : null}
        </span>
      </span>
      {stamp ? (
        <span className="font-mrd-mono shrink-0 text-[11.5px] text-mrd-faint tabular-nums">
          {stamp}
        </span>
      ) : null}
    </button>
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
      <Region title="Tamper check">
        <ReadFailed onRetry={() => void sealQ.refetch()}>The tamper check did not load.</ReadFailed>
      </Region>
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
    <Region
      title="Tamper check"
      sub="Save this fingerprint now. Re-check it later and it tells you whether anything on the record was quietly changed."
    >
      <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4">
        <div className="flex flex-wrap items-start justify-between gap-mrd-4">
          <div className="min-w-0">
            {/* A fingerprint, a count and a stamp are all figures, so all three
                are mono. The words around them are not. */}
            <p className="text-[13px] text-mrd-ink">
              Fingerprint <Figure>{shortHead(seal.head)}</Figure>
            </p>
            <p className="mt-0.5 text-[12px] text-mrd-mute">
              <Figure>{seal.count}</Figure> record{seal.count === 1 ? "" : "s"}
              {sealedAt ? (
                <>
                  , sealed <Figure>{sealedAt}</Figure>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-mrd-3">
            <Action
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
            </Action>
            <Action aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              {open ? "Close" : "Verify"}
            </Action>
          </div>
        </div>

        {open ? (
          <div className="mt-mrd-5 flex flex-col gap-mrd-4 border-t border-mrd-line-soft pt-mrd-5">
            <Field label="A fingerprint you saved earlier" htmlFor="seal-paste">
              <TextInput
                id="seal-paste"
                className="font-mrd-mono w-full max-w-[46ch]"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="Paste it here"
                spellCheck={false}
              />
            </Field>
            <Actions>
              <Action
                disabled={verify.isPending || !ready}
                title={ready ? undefined : "Paste a saved fingerprint first, at least 8 characters"}
                onClick={() => ready && verify.mutate(paste)}
              >
                {verify.isPending ? "Checking" : "Check it"}
              </Action>
            </Actions>
            {v ? (
              /* The check is the record speaking, so it renders as a claim with
                 its evidence rather than as a coloured sentence with an icon
                 glued to it. Red on the negative answer is an OUTCOME: the
                 comparison ran and it did not match. */
              <RecordSpeaks evidence={diff ? <Figure>{diff}</Figure> : undefined}>
                {v.ok ? (
                  "Unchanged. The record still matches the fingerprint you saved."
                ) : (
                  <span className="text-mrd-fail">
                    Changed. {v.reason ?? "the record no longer matches that fingerprint"}.
                  </span>
                )}
              </RecordSpeaks>
            ) : verify.isError ? (
              <ReadFailed onRetry={() => ready && verify.mutate(paste)}>
                The check did not run.
              </ReadFailed>
            ) : null}
          </div>
        ) : null}
      </div>
    </Region>
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
    /*
     * NO TITLE ON THIS REGION, and it is a fix rather than a trim.
     *
     * `MissionChain` draws its own section headed by the mission's title, so a
     * titled Region around it stacked two headings: "Mission chain" above the
     * name of the actual mission. `block-chrome-discipline` exists to catch
     * exactly that, and it could not see this one -- it only knew `Block`, and
     * this outer wrapper had already moved to `Region`, so the nest went quiet
     * the day the outer half was ported. Teaching the guard `Region` on
     * 2026-08-18 surfaced it.
     *
     * The heading that survives is the mission's own name, which is the better
     * of the two: it names the thing on screen rather than the panel around it.
     * The sub moves down to a Line so the sentence is kept -- rule 1 protects
     * information, and "a missing link is shown, never hidden" is the promise
     * this panel exists to make.
     */
    <Region>
      <Line label="Mission chain" sub="A missing link is shown, never hidden." />
      {missions.length > 0 ? (
        <div className="mb-mrd-4">
          <Picker
            aria-label="Choose a mission"
            className="w-full max-w-[340px]"
            value={active ?? ""}
            onChange={(e) => setSelected(e.target.value)}
          >
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {stripAutoPrefix(m.title)}
              </option>
            ))}
          </Picker>
        </div>
      ) : null}

      {missionsQ.isError ? (
        <ReadFailed onRetry={() => void missionsQ.refetch()}>
          The missions did not load. {(missionsQ.error as Error)?.message}
        </ReadFailed>
      ) : chainQ.isError ? (
        <ReadFailed onRetry={() => void chainQ.refetch()}>
          This mission&apos;s chain did not load. {(chainQ.error as Error)?.message}
        </ReadFailed>
      ) : chainQ.data ? (
        <MissionChain chain={chainQ.data} />
      ) : null}
    </Region>
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
    <div data-mrd="" className="flex flex-col gap-mrd-5">
      {/* What the record holds, in plain words, from real counts only. */}
      {!query.isPending && !query.isError && counts.all > 0 ? (
        <p className="max-w-[74ch] text-[13px] leading-relaxed text-mrd-body">
          {ledgerSummary(counts)}
        </p>
      ) : null}

      <div className="flex flex-col gap-mrd-4">
        <SegmentedFilter
          options={KIND_TABS}
          active={kind}
          onSelect={setKind}
          label="Filter by what was recorded"
        />

        <div className="flex flex-wrap items-center gap-mrd-3">
          <Picker
            aria-label="Filter by outcome"
            className="w-[210px] flex-none"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as Outcome)}
          >
            <option value="all">Every outcome</option>
            <option value="standing">
              Standing{counts.standing ? ` · ${counts.standing}` : ""}
            </option>
            <option value="proven">Proven{counts.proven ? ` · ${counts.proven}` : ""}</option>
            <option value="superseded">
              Superseded{counts.superseded ? ` · ${counts.superseded}` : ""}
            </option>
          </Picker>
          <TextInput
            className="min-w-[200px] flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search what, why, or who"
            aria-label="Search the record"
          />
        </div>
      </div>

      {/* FOUR FACTS, NOT TWO, and the fourth is the one that was missing. A read
          in flight used to render nothing at all, which is the blank-rectangle
          defect /approvals fixed on the same argument: empty, failed, excluded
          by a filter and still reading are four different things, and a person
          acts differently on each. */}
      {query.isPending ? (
        <Reading>Reading the record.</Reading>
      ) : query.isError ? (
        <ReadFailed onRetry={() => void query.refetch()}>
          The record did not load. {(query.error as Error)?.message}
        </ReadFailed>
      ) : receipts.length === 0 ? (
        narrowed ? (
          <NothingHere>
            Nothing on the record matches that. The rest of the record is still there, behind the
            filters above.
          </NothingHere>
        ) : (
          <div className="flex flex-col gap-mrd-4">
            <NothingHere>
              Nothing on the record yet. A decision, or an autonomous action you let through, leaves
              evidence the moment it happens.
            </NothingHere>
            <Actions>
              <Action
                onClick={() => {
                  // The approvals record lives one sub-tab over in this room.
                  navigate({
                    to: "/engine-room",
                    search: { room: "record", view: "approvals" },
                  });
                }}
              >
                Open your decisions
              </Action>
            </Actions>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet">
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
    </div>
  );
}
