import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useIsFetching, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Beaker,
  CheckSquare,
  Download,
  FileCheck2,
  GitCommitVertical,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { gradeOutcomeContract, verifiabilityLabel } from "@/lib/outcome-contract-grade";
import {
  compileContractOracles,
  draftContractFromPrd,
  savePrd,
  supersedeContractClause,
  toggleUatChecklistItem,
  type ContractClause,
  type OutcomeContract,
} from "@/lib/discovery.functions";
import { buildArdDocument, parseArdDocument } from "@/lib/ard-schema";

type Props = {
  prdId: string;
  specTitle: string;
  bodyMd: string;
  contract: OutcomeContract | null | undefined;
  invalidateKey: readonly unknown[];
};

/** CNV-03: download the current contract as a portable ARD JSON file. */
function downloadArd(prdId: string, specTitle: string, contract: OutcomeContract) {
  const doc = buildArdDocument(window.location.origin, prdId, specTitle, contract);
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${
    specTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60) || "spec"
  }.ard.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CNV-03: paste a schema-conformant ARD document (or a bare Outcome Contract)
 * to adopt it directly. Validation is `parseArdDocument` (the same
 * `OutcomeContractSchema` the draft/apply flow already enforces); on success
 * it saves through the exact same `savePrd` path as "Apply contract", so an
 * imported contract can never skip a check an agent-drafted one passes.
 */
function ArdImportControl({
  prdId,
  invalidateKey,
  onApplied,
}: {
  prdId: string;
  invalidateKey: readonly unknown[];
  onApplied?: () => void;
}) {
  const qc = useQueryClient();
  const fSave = useServerFn(savePrd);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const importMut = useMutation({
    mutationFn: (c: OutcomeContract) => fSave({ data: { id: prdId, contract: c } }),
    onSuccess: () => {
      setOpen(false);
      setText("");
      setError(null);
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("ARD imported");
      onApplied?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-pill-outline px-3 py-1 text-[11px] inline-flex items-center gap-1.5"
      >
        <Upload className="h-3 w-3" />
        Import ARD JSON
      </button>
    );
  }

  return (
    <div className="mt-3">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder="Paste an ARD document or a bare Outcome Contract JSON"
        className="w-full min-h-[120px] rounded-md border hairline bg-background px-2 py-1.5 text-xs font-mono outline-none focus:border-foreground resize-y"
        autoFocus
      />
      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => {
            let json: unknown;
            try {
              json = JSON.parse(text);
            } catch {
              setError("Not valid JSON");
              return;
            }
            const result = parseArdDocument(json);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            importMut.mutate(result.contract);
          }}
          disabled={importMut.isPending || !text.trim()}
          className="btn-pill px-3 py-1 text-[11px] disabled:opacity-50"
        >
          {importMut.isPending ? "Importing…" : "Parse and apply"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setText("");
            setError(null);
          }}
          className="btn-pill-outline px-2 py-1 text-[11px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * RPT-23: the owner-facing verifiability verdict. Reads the same grade the
 * server gate enforces, so what the owner sees is exactly what the approve
 * step will allow. A "hazy" contract (metrics present, none verifiable yet)
 * shows a constructive block with the specific clauses to fix; a verifiable
 * contract shows a calm confirmation that outcome day can check it.
 */
function VerifiabilityVerdict({ contract }: { contract: OutcomeContract }) {
  const grade = gradeOutcomeContract(contract);
  // Nothing to structure yet: the empty-state UI already covers this.
  if (grade.verdict === "empty") return null;

  if (grade.blocksApproval) {
    return (
      <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-destructive">
              Cannot be approved: no success metric can be checked.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {grade.reason}
            </p>
            {grade.unverifiableClauses.length > 0 ? (
              <ul className="mt-1.5 space-y-1">
                {grade.unverifiableClauses.map((c) => (
                  <li
                    key={c.id}
                    className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="mono-label text-[9px] mt-0.5 shrink-0 opacity-70">
                      {c.pending ? "uncompiled" : "watched"}
                    </span>
                    <span className="min-w-0">{c.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (grade.verdict === "hazy") {
    // Non-blocking: metrics exist but none are compiled to an oracle yet. This
    // is a constructive nudge, not a hard block. Compiling the oracles (auto at
    // creation, or the "Compile oracles" button) classifies them, and approval
    // is only refused if they resolve to purely unfalsifiable.
    return (
      <div className="mt-4 rounded-md border hairline bg-background/40 px-3 py-2 flex items-start gap-2">
        <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-medium">Verification is hazy</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{grade.reason}</p>
        </div>
      </div>
    );
  }

  const label = verifiabilityLabel(grade);
  return (
    <div className="mt-4 rounded-md border hairline bg-background/40 px-3 py-2 flex items-start gap-2">
      <ShieldCheck
        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
          grade.verdict === "verifiable" ? "text-foreground" : "text-muted-foreground"
        }`}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{grade.reason}</p>
      </div>
    </div>
  );
}

/**
 * CNV-01 machine view: the typed Outcome Contract projection of a spec,
 * alongside the narrative Edit/Preview modes. Empty `intent` means this PRD
 * has never been structured — the lazy-migration entry point (v12: "AI
 * structures on open, human confirms").
 */
export function OutcomeContractPanel({ prdId, specTitle, bodyMd, contract, invalidateKey }: Props) {
  const qc = useQueryClient();
  const fDraft = useServerFn(draftContractFromPrd);
  const fSave = useServerFn(savePrd);
  const fCompile = useServerFn(compileContractOracles);
  const [draft, setDraft] = useState<OutcomeContract | null>(null);

  const draftMut = useMutation({
    mutationFn: () => fDraft({ data: { id: prdId } }),
    onSuccess: (r) => setDraft(r.contract),
    onError: (e: Error) => toast.error(e.message),
  });

  const applyMut = useMutation({
    mutationFn: (c: OutcomeContract) => fSave({ data: { id: prdId, contract: c } }),
    onSuccess: () => {
      setDraft(null);
      qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("Contract applied");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // CNV-02: compile every unclassified success-metric clause into a real
  // oracle (eval case, CI label, UAT checklist, or a watched assumption).
  const compileMut = useMutation({
    mutationFn: () => fCompile({ data: { id: prdId } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: invalidateKey });
      const parts = [
        r.eval_cases_created > 0
          ? `${r.eval_cases_created} eval case${r.eval_cases_created === 1 ? "" : "s"}`
          : null,
        r.ci_count > 0 ? `${r.ci_count} covered by CI` : null,
        r.uat_count > 0 ? `${r.uat_count} UAT item${r.uat_count === 1 ? "" : "s"}` : null,
        r.assumptions_filed > 0
          ? `${r.assumptions_filed} watched assumption${r.assumptions_filed === 1 ? "" : "s"}`
          : null,
      ].filter((p): p is string => !!p);
      toast.success(
        parts.length > 0 ? `Compiled: ${parts.join(", ")}` : "Every metric already has an oracle",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hasContract = !!contract?.intent?.trim();

  if (!hasContract && !draft) {
    return (
      <div className="rounded-lg border hairline bg-card/60 p-6 text-center">
        <FileCheck2 className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          This spec has not been structured into an Outcome Contract yet.
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          The AI reads what is already written and drafts a typed contract (intent, success metrics,
          non-goals, budget). You review before anything is saved.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => draftMut.mutate()}
            disabled={draftMut.isPending || !bodyMd.trim()}
            className="btn-pill px-4 py-1.5 text-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            title={!bodyMd.trim() ? "Write the spec body first" : undefined}
          >
            <Sparkles className="h-3 w-3" />
            {draftMut.isPending ? "Drafting…" : "Draft contract from this spec"}
          </button>
        </div>
        <div className="mt-3 text-left">
          <ArdImportControl prdId={prdId} invalidateKey={invalidateKey} />
        </div>
      </div>
    );
  }

  if (draft) {
    return (
      <div className="rounded-lg border hairline bg-card/60 p-6">
        <div className="mono-label mb-3 flex items-center justify-between">
          <span>Drafted contract · review before applying</span>
          <button
            onClick={() => setDraft(null)}
            className="text-muted-foreground hover:text-foreground"
            title="Discard draft"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <ContractBody contract={draft} />
        <VerifiabilityVerdict contract={draft} />
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => applyMut.mutate(draft)}
            disabled={applyMut.isPending}
            className="btn-pill px-4 py-1.5 text-xs disabled:opacity-50"
          >
            {applyMut.isPending ? "Applying…" : "Apply contract"}
          </button>
          <button
            onClick={() => setDraft(null)}
            className="btn-pill-outline px-3 py-1 text-xs"
            disabled={applyMut.isPending}
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  const uncompiledCount = (contract?.success_metrics ?? []).filter(
    (c) => c.status === "standing" && !c.oracle_kind,
  ).length;

  return (
    <div className="rounded-lg border hairline bg-card/60 p-6">
      <div className="mono-label mb-3 flex items-center justify-between gap-2 flex-wrap">
        <span>Outcome Contract</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadArd(prdId, specTitle, contract as OutcomeContract)}
            className="btn-pill-outline px-3 py-1 text-[11px] inline-flex items-center gap-1.5 normal-case tracking-normal"
            title="Download this contract as a portable ARD JSON file"
          >
            <Download className="h-3 w-3" />
            Export ARD
          </button>
          {(contract?.success_metrics ?? []).some((c) => c.status === "standing") ? (
            <button
              onClick={() => compileMut.mutate()}
              disabled={compileMut.isPending || uncompiledCount === 0}
              className="btn-pill-outline px-3 py-1 text-[11px] inline-flex items-center gap-1.5 disabled:opacity-50 normal-case tracking-normal"
              title="Compile every success metric into an eval case, a CI label, a UAT checklist item, or a watched assumption"
            >
              <Beaker className="h-3 w-3" />
              {compileMut.isPending
                ? "Compiling…"
                : uncompiledCount === 0
                  ? "Oracles compiled"
                  : `Compile ${uncompiledCount} oracle${uncompiledCount === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </div>
      </div>
      <ContractBody
        contract={contract as OutcomeContract}
        prdId={prdId}
        invalidateKey={invalidateKey}
      />
      <p className="mt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        Drafted by {contract?.drafted_by ?? "human"}
        {contract?.drafted_at ? ` · ${new Date(contract.drafted_at).toLocaleDateString()}` : ""}
      </p>
    </div>
  );
}

function ContractBody({
  contract,
  prdId,
  invalidateKey,
}: {
  contract: OutcomeContract;
  prdId?: string;
  invalidateKey?: readonly unknown[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mono-label text-[10px] text-muted-foreground mb-1.5">Intent</div>
        <p className="text-sm leading-relaxed">{contract.intent}</p>
      </div>

      <ClauseList
        label="Success metrics"
        clauses={contract.success_metrics}
        section="success_metrics"
        showOracle
        contract={contract}
        prdId={prdId}
        invalidateKey={invalidateKey}
      />
      <ClauseList
        label="Non-goals"
        clauses={contract.non_goals}
        section="non_goals"
        contract={contract}
        prdId={prdId}
        invalidateKey={invalidateKey}
      />

      {contract.budget && (contract.budget.estimate || contract.budget.blast_radius) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contract.budget.estimate ? (
            <div>
              <div className="mono-label text-[10px] text-muted-foreground mb-1.5">Budget</div>
              <p className="text-xs leading-relaxed">{contract.budget.estimate}</p>
            </div>
          ) : null}
          {contract.budget.blast_radius ? (
            <div>
              <div className="mono-label text-[10px] text-muted-foreground mb-1.5">
                Blast radius
              </div>
              <p className="text-xs leading-relaxed">{contract.budget.blast_radius}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {contract.ambiguity_policy ? (
        <div>
          <div className="mono-label text-[10px] text-muted-foreground mb-1.5">
            Ambiguity policy
          </div>
          <p className="text-xs leading-relaxed">{contract.ambiguity_policy}</p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A clause id minted in the browser, because this is the one contract write the
 * client composes itself. `savePrd` validates the whole contract against
 * OutcomeContractSchema, whose clause `id` is `z.string().uuid()`.
 *
 * Under the pinned zod (^3.25.76) that check is a plain hex-and-dashes regex
 * with no version or variant class, so 16 bytes of any randomness in the right
 * shape passes today; no rejection has been observed here. The two nibble lines
 * below are set anyway, for two reasons that outlive this version. Every other
 * clause id in the column comes from the server's `draftedClause`, which is
 * `crypto.randomUUID`, so a hand-added clause reads as the same kind of id as a
 * drafted one. And zod 4 tightens `.uuid()` to read exactly those nibbles, so
 * emitting a real v4 now is what carries this through that upgrade instead of
 * turning it into a validation toast the owner cannot act on.
 *
 * crypto.randomUUID is the first choice and is what draftedClause uses; it
 * needs a secure context and is simply absent on plain http, which is exactly
 * where a `bun run dev` preview opened from a phone on the LAN lives, so
 * getRandomValues assembles the same shape by hand there. That secure-context
 * reasoning is the one mint() in src/lib/landing-session.ts spells out, but the
 * fallback order is deliberately NOT the same: mint() has no randomUUID branch
 * at all and returns undefined when the browser offers no randomness, because a
 * guessable session key is worse than no key. A clause id only has to be
 * distinct from the handful of other ids inside one contract and is never a
 * credential, so the last tier here is Math.random, which keeps the owner able
 * to add a criterion rather than handing them a dead button.
 */
function newClauseId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Byte 6 high nibble to 4 (version), byte 8 top two bits to 10 (variant).
  // Without these two lines the string is 32 correct hex characters that the
  // pinned zod still accepts; what they buy is the two things the doc comment
  // above names — parity with draftedClause, and surviving zod 4's stricter
  // .uuid(), which does read these nibbles.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * The whole contract with one new standing clause appended to one section.
 *
 * savePrd validates against the FULL OutcomeContractSchema, not the
 * `.partial()` one supersedeContractClause parses with, so every required key
 * has to survive the round trip. Contracts written by draftContractFromPrd and
 * draftContractFromIntent carry all of them, but a row whose contract reached
 * the column another way can be missing one, and the failure there is a zod
 * "Required" toast naming a field the owner has never seen. Each missing key is
 * filled with the same value the two drafters use, so this changes nothing on a
 * normal row and keeps the add working on an odd one.
 *
 * `drafted_by` is carried through untouched on purpose. It is not a record of
 * who wrote the newest clause; supersedeContractClause reads it to decide
 * whether a human edit counts as a correction of an agent draft (RPT-32), so
 * flipping it to "human" here would silently switch off that gate signal for
 * every later edit of an agent-drafted contract.
 */
function contractWithClause(
  contract: OutcomeContract,
  section: "success_metrics" | "non_goals",
  text: string,
): OutcomeContract {
  const partial = contract as Partial<OutcomeContract>;
  const clause: ContractClause = {
    id: newClauseId(),
    text: text.trim().slice(0, 2000),
    status: "standing",
    superseded_by: null,
    // Deliberately uncompiled. Classifying a metric into an eval case, a CI
    // label, a UAT item or a watched assumption is the oracle compiler's call
    // (CNV-02), and guessing it here would stamp a verdict on the clause that
    // no oracle actually backs. Adding a metric makes "Compile oracles" appear.
    oracle_kind: null,
    oracle_ref: null,
    created_at: new Date().toISOString(),
  };
  const base = {
    version: partial.version ?? 1,
    intent: partial.intent ?? "",
    evidence_links: partial.evidence_links ?? [],
    success_metrics: partial.success_metrics ?? [],
    non_goals: partial.non_goals ?? [],
    budget: partial.budget ?? null,
    ambiguity_policy: partial.ambiguity_policy ?? null,
    drafted_by: partial.drafted_by ?? "human",
    drafted_at: partial.drafted_at ?? new Date().toISOString(),
  };
  return {
    ...base,
    success_metrics:
      section === "success_metrics" ? [...base.success_metrics, clause] : base.success_metrics,
    non_goals: section === "non_goals" ? [...base.non_goals, clause] : base.non_goals,
  };
}

/**
 * WRITE AN ACCEPTANCE CRITERION BY HAND. This station's stated job is "a spec
 * with acceptance criteria", and until this control existed a human could not
 * produce one: ClauseRow can supersede a clause that already exists and the
 * compiler can classify one, but nothing could create the first, so a contract
 * the drafter returned with an empty success_metrics stayed empty for good and
 * the spec approved with nothing to check on outcome day.
 *
 * It writes through savePrd({ id, contract }), the same single write path the
 * draft-apply and the ARD import already use, so a hand-written clause clears
 * exactly the checks an agent-drafted one clears. No new server function: the
 * contract is composed here and the existing validator judges it.
 *
 * That choice has one cost worth naming, because the clause write next door does
 * not pay it: supersedeContractClause re-reads the row on the server and edits
 * what it finds, so it cannot clobber a concurrent change. This one sends a
 * whole contract composed from the `contract` prop, so it is last-write-wins
 * against whatever landed since that prop was read. The reachable version is one
 * owner adding twice in a row: add a metric, reopen, add a second before the
 * invalidated query has refetched, and the second write carries the pre-first
 * contract, dropping the first clause while the toast still says it was added.
 * The guard below is the fix that stays on the client — while the panel's own
 * query is in flight the prop is known stale, so Add waits rather than sending.
 */
/**
 * A query key nothing in the app registers under, so `useIsFetching` against it
 * is always 0. It stands in for `invalidateKey` when the caller has none, which
 * keeps the staleness guard a plain unconditional hook call.
 */
const NO_PANEL_QUERY_KEY = ["outcome-contract", "no-panel-query"] as const;

function AddClauseControl({
  contract,
  prdId,
  section,
  invalidateKey,
}: {
  contract: OutcomeContract;
  prdId: string;
  section: "success_metrics" | "non_goals";
  invalidateKey?: readonly unknown[];
}) {
  const qc = useQueryClient();
  const fSave = useServerFn(savePrd);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const isMetric = section === "success_metrics";

  // True while the panel's own query is refetching, which is exactly the window
  // in which `contract` is a stale copy and composing a whole contract from it
  // would drop whatever landed in between. A hook cannot be called
  // conditionally, so with no invalidateKey to watch this matches a key nothing
  // registers under and stays at 0, leaving the button as it was.
  const contractIsStale = useIsFetching({ queryKey: invalidateKey ?? NO_PANEL_QUERY_KEY }) > 0;

  const addMut = useMutation({
    mutationFn: (t: string) =>
      fSave({ data: { id: prdId, contract: contractWithClause(contract, section, t) } }),
    onSuccess: () => {
      setOpen(false);
      setText("");
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success(isMetric ? "Success metric added" : "Non-goal added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-pill-outline mt-2 px-3 py-1 text-[11px] inline-flex items-center gap-1.5 normal-case tracking-normal"
      >
        <Plus className="h-3 w-3" />
        {isMetric ? "Add a success metric" : "Add a non-goal"}
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-start gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          isMetric
            ? "One falsifiable statement. What has to be true on outcome day."
            : "One thing this spec will not do."
        }
        className="flex-1 min-h-[60px] rounded-md border hairline bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground resize-y"
        autoFocus
      />
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={() => addMut.mutate(text)}
          disabled={addMut.isPending || contractIsStale || !text.trim()}
          className="btn-pill px-2 py-1 text-[11px] disabled:opacity-50"
          title={
            contractIsStale
              ? "Reloading the saved contract. Adding now would send the version from before your last change."
              : undefined
          }
        >
          {addMut.isPending ? "Adding…" : contractIsStale ? "Syncing…" : "Add"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          disabled={addMut.isPending}
          className="btn-pill-outline px-2 py-1 text-[11px] disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * One section of the contract, INCLUDING WHEN IT IS EMPTY. This used to return
 * null on an empty array, which took the heading down with the list: a contract
 * whose success_metrics came back empty rendered as Intent, "Drafted by agent"
 * and nothing else, so the panel gave no sign that the spec had no acceptance
 * criteria at all. An empty section is a fact about the spec worth stating, and
 * it is the only place the control that fixes it can live.
 *
 * The same is true when every clause has been superseded: standing is empty,
 * which used to leave a bare heading over an empty list.
 */
function ClauseList({
  label,
  clauses,
  section,
  showOracle,
  contract,
  prdId,
  invalidateKey,
}: {
  label: string;
  clauses: ContractClause[];
  section: "success_metrics" | "non_goals";
  showOracle?: boolean;
  /** The contract these clauses belong to, so an add can send back the whole of it. */
  contract: OutcomeContract;
  prdId?: string;
  invalidateKey?: readonly unknown[];
}) {
  const all = clauses ?? [];
  const standing = all.filter((c) => c.status === "standing");
  const superseded = all.filter((c) => c.status === "superseded");

  return (
    <div>
      <div className="mono-label text-[10px] text-muted-foreground mb-1.5">{label}</div>
      {standing.length > 0 ? (
        <ul className="space-y-1.5">
          {standing.map((c) => (
            <ClauseRow
              key={c.id}
              clause={c}
              section={section}
              showOracle={showOracle}
              prdId={prdId}
              invalidateKey={invalidateKey}
            />
          ))}
        </ul>
      ) : (
        /* The labelled empty state carries its own control. Without prdId this
           is the draft-review pass, where there is no saved row to write to
           yet, so it states the gap and the Apply step below handles the rest. */
        <div className="rounded-md border border-dashed hairline px-3 py-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {section === "success_metrics"
              ? "No success metric yet. Nothing on this contract can be checked on outcome day until one exists."
              : "No non-goal yet. Nothing is written down as out of scope, so anything is fair game to build."}
          </p>
          {prdId ? (
            <AddClauseControl
              contract={contract}
              prdId={prdId}
              section={section}
              invalidateKey={invalidateKey}
            />
          ) : null}
        </div>
      )}
      {superseded.length > 0 ? (
        <details className="mt-1.5">
          <summary className="text-[11px] text-muted-foreground cursor-pointer">
            {superseded.length} superseded
          </summary>
          <ul className="mt-1.5 space-y-1 pl-3">
            {superseded.map((c) => (
              <li key={c.id} className="text-xs text-muted-foreground line-through">
                {c.text}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {/* The same control below a list that already has clauses. An empty
          contract was the loudest case, but a contract with three criteria
          could not get a fourth either: supersede retires one standing clause
          as it appends its replacement, so the standing count never grows. */}
      {standing.length > 0 && prdId ? (
        <AddClauseControl
          contract={contract}
          prdId={prdId}
          section={section}
          invalidateKey={invalidateKey}
        />
      ) : null}
    </div>
  );
}

function ClauseRow({
  clause,
  section,
  showOracle,
  prdId,
  invalidateKey,
}: {
  clause: ContractClause;
  section: "success_metrics" | "non_goals";
  showOracle?: boolean;
  prdId?: string;
  invalidateKey?: readonly unknown[];
}) {
  const qc = useQueryClient();
  const fSupersede = useServerFn(supersedeContractClause);
  const fToggleUat = useServerFn(toggleUatChecklistItem);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(clause.text);

  const supersede = useMutation({
    mutationFn: () =>
      fSupersede({
        data: { id: prdId as string, section, clause_id: clause.id, new_text: text },
      }),
    onSuccess: () => {
      setEditing(false);
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
      toast.success("Clause superseded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleUat = useMutation({
    mutationFn: (checked: boolean) =>
      fToggleUat({ data: { id: prdId as string, clause_id: clause.id, checked } }),
    onSuccess: () => {
      if (invalidateKey) qc.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <li className="flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 min-h-[60px] rounded-md border hairline bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground resize-y"
          autoFocus
        />
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => supersede.mutate()}
            disabled={supersede.isPending || !text.trim()}
            className="btn-pill px-2 py-1 text-[11px] disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setText(clause.text);
            }}
            className="btn-pill-outline px-2 py-1 text-[11px]"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="text-sm leading-relaxed flex items-start gap-2 group">
      {showOracle && clause.oracle_kind === "uat" ? (
        <button
          onClick={() => toggleUat.mutate(!clause.uat_checked)}
          disabled={toggleUat.isPending || !prdId}
          className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
          title={clause.uat_checked ? "Mark not verified" : "Mark verified"}
        >
          {clause.uat_checked ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
      <span className={`flex-1 ${clause.uat_checked ? "line-through text-muted-foreground" : ""}`}>
        {clause.text}
      </span>
      {showOracle ? <OracleBadge clause={clause} /> : null}
      {prdId ? (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
          title="Supersede this clause"
        >
          <Pencil className="h-3 w-3" />
        </button>
      ) : null}
    </li>
  );
}

const ORACLE_LABEL: Record<NonNullable<ContractClause["oracle_kind"]>, string> = {
  eval: "eval",
  ci: "ci",
  uat: "uat",
  unverifiable: "watched",
};

/** CNV-02: shows how a success-metric clause is verified, once compiled. */
function OracleBadge({ clause }: { clause: ContractClause }) {
  if (!clause.oracle_kind) return null;
  const title =
    clause.oracle_kind === "eval"
      ? "Compiled to an eval case, graded by Supaprod"
      : clause.oracle_kind === "ci"
        ? clause.oracle_ref || "Covered by the standard CI gate"
        : clause.oracle_kind === "uat"
          ? "Manual checklist item, tick when verified"
          : "Not falsifiable as written; filed as a watched assumption (FS-02)";
  return (
    <span
      title={title}
      className="mono-label shrink-0 text-[9px] px-1.5 py-0.5 rounded border hairline text-muted-foreground inline-flex items-center gap-1"
    >
      {clause.oracle_kind === "eval" ? <Beaker className="h-2.5 w-2.5" /> : null}
      {clause.oracle_kind === "ci" ? <GitCommitVertical className="h-2.5 w-2.5" /> : null}
      {ORACLE_LABEL[clause.oracle_kind]}
    </span>
  );
}
