import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import { type VerdictTone } from "@/components/ink";
import { listDecisions } from "@/lib/decisions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { listAgentMemory, forgetMemory } from "@/lib/agent_loop.functions";
import { listHouseRules } from "@/lib/house-rules.functions";
import { listMemoryCandidates } from "@/lib/memory-candidates.functions";
import { MemorySection } from "./MemorySection";
import { MemoryRow } from "./MemoryRow";

/**
 * Settings > Memory - the workspace memory ledger (phase1-architecture §2,
 * `/settings?section=memory`; copy-deck: "What this workspace has learned.
 * Yours to correct."). Four sources, browsable and curatable:
 *  - decisions (with reasons) - read-only: no delete/edit fn exists yet.
 *  - learned lessons (learnings) - verdict chips, read-only for the same reason.
 *  - agent reflections (agent_memory) - deletable via forgetMemory.
 *  - pending conventions (house_rules + memory_candidates) - decided from
 *    Approvals, not here; each links out rather than duplicating that gate.
 * Institutional knowledge framing, never personalization (taste doc §4).
 */
export function MemoryView() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const fDecisions = useServerFn(listDecisions);
  const fLearnings = useServerFn(listLearnings);
  const fAgentMemory = useServerFn(listAgentMemory);
  const fForget = useServerFn(forgetMemory);
  const fHouseRules = useServerFn(listHouseRules);
  const fMemoryCandidates = useServerFn(listMemoryCandidates);

  const decisions = useQuery({
    queryKey: ["memory-view", "decisions"],
    queryFn: () => fDecisions({ data: { limit: 30 } }),
  });
  const learnings = useQuery({
    queryKey: ["memory-view", "learnings"],
    queryFn: () => fLearnings(),
  });
  const agentMemory = useQuery({
    queryKey: ["memory-view", "agent-memory"],
    queryFn: () => fAgentMemory({ data: {} }),
  });
  const houseRules = useQuery({
    queryKey: ["memory-view", "house-rules"],
    queryFn: () => fHouseRules({ data: {} }),
  });
  const memoryCandidates = useQuery({
    queryKey: ["memory-view", "memory-candidates"],
    queryFn: () => fMemoryCandidates({ data: {} }),
  });

  const forget = useMutation({
    mutationFn: (memoryId: string) => fForget({ data: { memoryId } }),
    onSuccess: () => {
      toast.success("Forgotten. Removed from workspace memory.");
      qc.invalidateQueries({ queryKey: ["memory-view", "agent-memory"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not forget this."),
  });

  const decisionRows = decisions.data?.decisions ?? [];
  const learningRows = learnings.data?.learnings ?? [];
  const memoryRows = agentMemory.data?.memories ?? [];
  const pendingHouseRules = (houseRules.data?.rules ?? []).filter((r) => r.status === "pending");
  const pendingCandidates = memoryCandidates.data?.items ?? [];
  const pendingTotal = pendingHouseRules.length + pendingCandidates.length;

  const VERDICT_TONE: Record<string, VerdictTone> = {
    validated: "pass",
    missed: "fail",
    mixed: "neutral",
  };

  return (
    <div className="flex flex-col gap-8">
      <p className="text-[13px] leading-6 text-[var(--ink-subtle)]">
        Everything here is from this workspace only. Edit or delete anything.
      </p>

      <MemorySection
        title="Decisions"
        count={decisions.isLoading || decisions.isError ? undefined : decisionRows.length}
        isLoading={decisions.isLoading}
        isError={decisions.isError}
        errorMessage={decisions.error instanceof Error ? decisions.error.message : undefined}
        onRetry={() => decisions.refetch()}
        emptyLine="Memory starts with your first decision. Approve or reject anything and it begins."
      >
        {decisionRows.map((d) => (
          <MemoryRow
            key={d.id}
            snippet={d.title}
            source={d.source_kind ? `from ${d.source_kind}` : "manual"}
            date={d.created_at}
            readOnlyNote="Decisions are the permanent record; there is no delete here yet."
          />
        ))}
      </MemorySection>

      <MemorySection
        title="Learned lessons"
        count={learnings.isLoading || learnings.isError ? undefined : learningRows.length}
        isLoading={learnings.isLoading}
        isError={learnings.isError}
        errorMessage={learnings.error instanceof Error ? learnings.error.message : undefined}
        onRetry={() => learnings.refetch()}
        emptyLine="Nothing shipped and measured yet. Learnings appear here once a bet proves out or misses."
      >
        {learningRows.map((l) => (
          <MemoryRow
            key={l.id}
            snippet={l.summary}
            source={l.opportunity_title ? `on ${l.opportunity_title}` : "outcome review"}
            date={l.created_at}
            verdict={{ tone: VERDICT_TONE[l.verdict] ?? "neutral", label: l.verdict }}
            readOnlyNote="Learnings are the permanent record; there is no delete here yet."
          />
        ))}
      </MemorySection>

      <MemorySection
        title="Agent reflections"
        count={agentMemory.isLoading || agentMemory.isError ? undefined : memoryRows.length}
        isLoading={agentMemory.isLoading}
        isError={agentMemory.isError}
        errorMessage={agentMemory.error instanceof Error ? agentMemory.error.message : undefined}
        onRetry={() => agentMemory.refetch()}
        emptyLine="Nothing saved yet. Agents remember what they learn as they work, and it lands here."
      >
        {memoryRows.map((m) => (
          <MemoryRow
            key={m.id}
            snippet={m.content}
            source={`${m.agent_slug} · ${m.scope ?? "workspace"}${m.kind ? ` · ${m.kind}` : ""}`}
            date={m.created_at}
            onDelete={async () => {
              await forget.mutateAsync(m.id);
            }}
          />
        ))}
      </MemorySection>

      <section aria-label="Pending conventions" className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="ink-kicker">Pending conventions</h2>
          {pendingTotal > 0 ? (
            <span className="ink-mono text-[10.5px] text-[var(--ink-faint)]">{pendingTotal}</span>
          ) : null}
          <div className="h-px flex-1 bg-[var(--ink-hairline)]" />
        </div>
        {houseRules.isLoading || memoryCandidates.isLoading ? (
          <div className="flex flex-col gap-2 py-1">
            <div className="ink-skeleton h-4 w-2/3" />
          </div>
        ) : pendingTotal === 0 ? (
          <p className="py-1 text-[13px] text-[var(--ink-subtle)]">
            Nothing waiting on a decision. New conventions surface here as agents notice a pattern.
          </p>
        ) : (
          <>
            <p className="text-[12.5px] text-[var(--ink-subtle)]">
              These wait on your call in Approvals, not here.
            </p>
            <div className="flex flex-col">
              {pendingHouseRules.map((r) => (
                <MemoryRow
                  key={r.id}
                  snippet={r.rule_text}
                  source={r.agent_slug ? `for ${r.agent_slug}` : "workspace-wide"}
                  date={r.created_at}
                  readOnlyNote="Decide this in Approvals."
                />
              ))}
              {pendingCandidates.map((c) => (
                <MemoryRow
                  key={c.id}
                  snippet={c.content}
                  source={c.source_kind === "user" ? "you noted this" : "an agent proposed this"}
                  date={c.created_at}
                  readOnlyNote="Decide this in Approvals."
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/approvals" })}
              className="ink-focus mt-1 self-start rounded-md border border-[var(--voice-human-border)] px-3 py-1.5 text-[13px] font-medium text-[var(--voice-human)] transition-colors duration-150 hover:bg-[var(--voice-human-soft)]"
            >
              Review in Approvals →
            </button>
          </>
        )}
      </section>
    </div>
  );
}
