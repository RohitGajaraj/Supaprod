/**
 * JNY-03, the test station. Shown only when the mission's PRD has a compiled
 * Outcome Contract (CNV-02) to test against; renders nothing otherwise, per the
 * calm-front doctrine.
 *
 * ITS HOME MOVED, AND IT WAS NOT CARRIED ACROSS. This was written against
 * `MissionSlideOver.tsx`, which the runs-board rewrite deleted (see the "opening
 * a run" note in `_authenticated.runs.index.tsx`: the slide-over was retired
 * because it showed less than the run's own surface and cost a second copy of
 * the same queries). Nothing picked this up on the way, so for the whole life of
 * the new surface `TestStationPanel` had exactly one repo-wide reference — its
 * own definition — and with it `getMissionTestPlan` and `recordTestStationVerdict`
 * had no caller either. Half of what the Build and Ship stations claim to do was
 * written, tested, documented and unreachable. It now mounts on
 * `/runs/$missionId`, the surface that replaced the slide-over.
 *
 * IT OWNS ITS OWN `Block`, exactly as `StagePanel` does, and for the same reason
 * the host cannot supply one: only the query knows whether this run has a test
 * plan at all, and a `Block` opened by the route would draw a rule, 36px of
 * margin and a heading above nothing on every run whose spec was never compiled
 * — which is most of them. Returning null has to take the section frame with it.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusDot } from "./test-station-status";
import { Region } from "@/components/meridian/surface-parts";
import { toast } from "@/lib/notify";
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
    // A silent failure would leave the checklist lying about its state.
    // THIS WAS `toast.success` ON BOTH FAILURE PATHS, here and in `record` below.
    // Nobody had seen it because the panel had no mount; the moment it gets one,
    // a refused write starts announcing itself in the success voice, which is the
    // one thing the run surface's own commit doctrine forbids ("never a success
    // shape over a failed write").
    onError: () => toast.error("Could not update that checklist item. Try again."),
  });

  const record = useMutation({
    mutationFn: () => fRecord({ data: { missionId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Verdict recorded on the decision.");
        qc.invalidateQueries({ queryKey: ["mission-test-plan", missionId] });
        qc.invalidateQueries({ queryKey: ["ledger-seal"] });
      } else {
        // `recordTestStationVerdict` recomputes the plan server side and refuses
        // on four named grounds. "Yet" was the only word the operator got back
        // for all four, and `no_decision` is not a "yet" — the PRD has no
        // decision row for the edge to hang off, so waiting changes nothing.
        toast.error(
          res.reason === "no_decision"
            ? "This spec has no decision record to hang the verdict on."
            : "Could not record the verdict yet.",
        );
      }
    },
    // The insert throws on a real write error (see the `error` check in
    // test-station.functions.ts). Without this the button simply stopped
    // spinning and the operator was left believing it landed.
    onError: () => toast.error("Could not record the verdict. Nothing was written."),
  });

  const plan = planQuery.data;
  if (!plan || !plan.available) return null;

  const meta = VERDICT_META[plan.verdict];

  return (
    // The title is the Block's, not a MonoLabel inside it. A "TEST STATION"
    // caps label under a section heading is the second heading StagePanel's own
    // KILL list rules out, and the run surface names its sections in plain
    // sentences ("What happened, in order", "What it produced"), so this one
    // says what it answers rather than which station it belongs to.
    <Region title="Whether it meets the spec">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <StatusDot state={meta.state} word={meta.word} />
          {plan.verdict === "passing" ? (
            plan.alreadyRecorded ? (
              <span
                className="ml-auto"
                style={{ fontFamily: "var(--mrd-face-brand)", color: "var(--mrd-faint)" }}
              >
                Recorded on the decision
              </span>
            ) : (
              <button
                type="button"
                onClick={() => record.mutate()}
                disabled={record.isPending}
                className="loom-press ml-auto transition-colors hover:[color:var(--mrd-ink)]"
                style={{
                  fontFamily: "var(--mrd-face-brand)",
                  letterSpacing: "0.08em",
                  color: "var(--mrd-mute)",
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
                  toggleUat.mutate({
                    id: plan.prdId,
                    clause_id: item.clauseId,
                    checked: !item.checked,
                  })
                }
                disabled={toggleUat.isPending}
                aria-pressed={item.checked}
                className="loom-press flex w-full items-center gap-3 text-left transition-colors hover:bg-mrd-hover"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <StatusDot
                  state={item.checked ? "shipped" : "queued"}
                  word={item.checked ? "CHECKED" : "UNCHECKED"}
                  style={{ width: 84, flexShrink: 0 }}
                />
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ fontFamily: "var(--mrd-face-display)", color: "var(--mrd-body)" }}
                >
                  {item.text}
                </span>
              </button>
            ))}
          </TestItemGroup>
        ) : null}
      </div>
    </Region>
  );
}

function TestItemGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        style={{
          fontFamily: "var(--mrd-face-brand)",
          letterSpacing: "0.1em",
          color: "var(--mrd-faint)",
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
        style={{ fontFamily: "var(--mrd-face-display)", color: "var(--mrd-body)" }}
      >
        {text}
      </span>
    </div>
  );
}
