import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCheck2, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "@/lib/notify";
import {
  draftContractFromPrd,
  savePrd,
  supersedeContractClause,
  type ContractClause,
  type OutcomeContract,
} from "@/lib/discovery.functions";

type Props = {
  prdId: string;
  bodyMd: string;
  contract: OutcomeContract | null | undefined;
  invalidateKey: readonly unknown[];
};

/**
 * CNV-01 machine view: the typed Outcome Contract projection of a spec,
 * alongside the narrative Edit/Preview modes. Empty `intent` means this PRD
 * has never been structured — the lazy-migration entry point (v12: "AI
 * structures on open, human confirms").
 */
export function OutcomeContractPanel({ prdId, bodyMd, contract, invalidateKey }: Props) {
  const qc = useQueryClient();
  const fDraft = useServerFn(draftContractFromPrd);
  const fSave = useServerFn(savePrd);
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

  return (
    <div className="rounded-lg border hairline bg-card/60 p-6">
      <div className="mono-label mb-3">Outcome Contract</div>
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
        prdId={prdId}
        invalidateKey={invalidateKey}
      />
      <ClauseList
        label="Non-goals"
        clauses={contract.non_goals}
        section="non_goals"
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

function ClauseList({
  label,
  clauses,
  section,
  prdId,
  invalidateKey,
}: {
  label: string;
  clauses: ContractClause[];
  section: "success_metrics" | "non_goals";
  prdId?: string;
  invalidateKey?: readonly unknown[];
}) {
  if (!clauses || clauses.length === 0) return null;
  const standing = clauses.filter((c) => c.status === "standing");
  const superseded = clauses.filter((c) => c.status === "superseded");

  return (
    <div>
      <div className="mono-label text-[10px] text-muted-foreground mb-1.5">{label}</div>
      <ul className="space-y-1.5">
        {standing.map((c) => (
          <ClauseRow
            key={c.id}
            clause={c}
            section={section}
            prdId={prdId}
            invalidateKey={invalidateKey}
          />
        ))}
      </ul>
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
    </div>
  );
}

function ClauseRow({
  clause,
  section,
  prdId,
  invalidateKey,
}: {
  clause: ContractClause;
  section: "success_metrics" | "non_goals";
  prdId?: string;
  invalidateKey?: readonly unknown[];
}) {
  const qc = useQueryClient();
  const fSupersede = useServerFn(supersedeContractClause);
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
      <span className="flex-1">{clause.text}</span>
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
