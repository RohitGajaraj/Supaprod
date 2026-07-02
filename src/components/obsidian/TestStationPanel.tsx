/**
 * JNY-03, the test station. Shown inside the Build mission slide-over only when the
 * mission's PRD has a compiled Outcome Contract (CNV-02) to test against; renders
 * nothing otherwise, per the calm-front doctrine.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusDot } from "./status";
import { MonoLabel } from "./primitives";
import { useToast } from "./toast";
import {
  getMissionTestPlan,
  recordTestStationVerdict,
  type EvalPlanItem,
  type CiPlanItem,
  type UatPlanItem,
} from "@/lib/test-station.functions";
import { toggleUatChecklistItem } from "@/lib/discovery.functions";

const VERDICT_META = {
  passing: { state: "shipped" as const, word: "PASSING" },
  blocked: { state: "blocked" as const, word: "BLOCKED" },
  pending: { state: "queued" as const, word: "PENDING" },
};

const ITEM_META = {
  passed: { state: "shipped" as const, word: "PASSED" },
  failed: { state: "blocked" as const, word: "FAILED" },
  pending: { state: "queued" as const, word: "PENDING" },
};

export function TestStationPanel({ missionId }: { missionId: string }) {
  const qc = useQueryClient();
  const showToast = useToast();
  const fGet = useServerFn(getMissionTestPlan);
  const fToggleUat = useServerFn(toggleUatChecklistItem);
  const fRecord = useServerFn(recordTestStationVerdict);

  const planQuery = useQuery({
    queryKey: ["mission-test-plan", missionId],
    queryFn: () => fGet({ data: { missionId } }),
  });

  const toggleUat = useMutation({
    mutationFn: (vars: { id: string; clause_id: string; checked: boolean }) =>
      fToggleUat({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mission-test-plan", missionId] }),
  });

  const record = useMutation({
    mutationFn: () => fRecord({ data: { missionId } }),
    onSuccess: (res) => {
      if (res.ok) {
        showToast("Verdict recorded on the decision.");
        qc.invalidateQueries({ queryKey: ["mission-test-plan", missionId] });
        qc.invalidateQueries({ queryKey: ["ledger-seal"] });
      } else {
        showToast("Could not record the verdict yet.");
      }
    },
  });

  const plan = planQuery.data;
  if (!plan || !plan.available) return null;

  const meta = VERDICT_META[plan.verdict];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <MonoLabel tone="muted">TEST STATION</MonoLabel>
        <StatusDot state={meta.state} word={meta.word} />
        {plan.verdict === "passing" ? (
          plan.alreadyRecorded ? (
            <span
              className="ml-auto"
              style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}
            >
              Recorded on the decision
            </span>
          ) : (
            <button
              type="button"
              onClick={() => record.mutate()}
              disabled={record.isPending}
              className="ml-auto"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.08em",
                color: "var(--glacier)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {record.isPending ? "Recording…" : "Record verdict →"}
            </button>
          )
        ) : null}
      </div>

      {plan.eval.length > 0 ? (
        <TestItemGroup label="Eval cases">
          {plan.eval.map((item: EvalPlanItem) => (
            <TestItemRow key={item.clauseId} text={item.text} meta={ITEM_META[item.result]} />
          ))}
        </TestItemGroup>
      ) : null}

      {plan.ci.length > 0 ? (
        <TestItemGroup label="CI expectations">
          {plan.ci.map((item: CiPlanItem) => (
            <TestItemRow
              key={item.clauseId}
              text={item.text}
              meta={
                plan.verdict === "blocked"
                  ? ITEM_META.failed
                  : plan.verdict === "passing"
                    ? ITEM_META.passed
                    : ITEM_META.pending
              }
            />
          ))}
        </TestItemGroup>
      ) : null}

      {plan.uat.length > 0 ? (
        <TestItemGroup label="UAT checklist">
          {plan.uat.map((item: UatPlanItem) => (
            <button
              key={item.clauseId}
              type="button"
              onClick={() =>
                toggleUat.mutate({ id: plan.prdId, clause_id: item.clauseId, checked: !item.checked })
              }
              disabled={toggleUat.isPending}
              className="flex w-full items-center gap-3 text-left"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <StatusDot
                state={item.checked ? "shipped" : "queued"}
                word={item.checked ? "CHECKED" : "UNCHECKED"}
                style={{ width: 84, flexShrink: 0 }}
              />
              <span
                className="min-w-0 flex-1 truncate"
                style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-body)" }}
              >
                {item.text}
              </span>
            </button>
          ))}
        </TestItemGroup>
      ) : null}
    </div>
  );
}

function TestItemGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          letterSpacing: "0.1em",
          color: "var(--text-faint)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function TestItemRow({
  text,
  meta,
}: {
  text: string;
  meta: { state: "shipped" | "blocked" | "queued"; word: string };
}) {
  return (
    <div className="flex items-center gap-3">
      <StatusDot state={meta.state} word={meta.word} style={{ width: 84, flexShrink: 0 }} />
      <span
        className="min-w-0 flex-1 truncate"
        style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text-body)" }}
      >
        {text}
      </span>
    </div>
  );
}
