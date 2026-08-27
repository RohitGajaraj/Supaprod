/**
 * ADMIN / ROUTING. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The operator who has just seen the AI bill, here to find the one surface
 *    that is spending more than it is worth and decide whether a cheaper model
 *    would do the same job. One surface, one decision, then they leave.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Choosing a model per surface on EVIDENCE rather than on vibes. The eval
 *    score is the whole point: anyone can pick a cheaper model, and only this
 *    page can say whether the cheaper one scored the same on this workload.
 *    Everything here either carries that evidence or is a candidate for removal.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP  the per-surface row: cost per task, p50 latency, call volume and the
 *          eval score, all real 7-day aggregates from ai_events and eval_runs.
 *          This is the evidence, and it exists nowhere else in the product.
 *    KEEP  the recommendation and its reason. It is the decision, pre-argued.
 *    KEEP  the pin, and say the truth about it out loud (see 5).
 *    KILL  the three-mode policy bar. Nothing anywhere reads `routing.policy`:
 *          grep says the only reader is the console that writes it, and this
 *          page's own recommendations are computed identically in all three
 *          modes. So the three buttons all do the same nothing, and one of them
 *          ("Auto-adopt cheaper, equal") promised the system would switch models
 *          by itself, which no code does. Three controls with one effect, and
 *          the effect is none.
 *    KILL  the six-column table inside `overflow-x: auto`. Horizontal scrolling
 *          was named as a pain point twice; fourteen surfaces is a list, and a
 *          list is read down.
 *    KILL  the standalone footnote paragraph explaining where cost and latency
 *          come from. It is one fact per column and it now rides the block's
 *          own sub-line, said once.
 *    KILL  "Every surface, routed. You hold the pins." It read as a promise the
 *          engine does not keep (see 5) and as decoration either way.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The model picker. A row is the surface, its setting and its evidence on two
 *    lines; changing the pin by hand is the rare path, so it opens on click. The
 *    common path (take the recommendation) stays on the row as one button.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The moment: a row that says a cheaper model already scored the same on this
 *    exact surface, with the two scores quoted, and one button to take it.
 *    The confusion this surface must refuse, and the reason this pass matters:
 *    a pin is recorded and THE ENGINE DOES NOT READ IT YET. `routing.pin.*` is
 *    written by setSurfacePin and read by nothing outside this console; the AI
 *    chokepoint still resolves models through capability.ts. The old page hid
 *    that behind "You hold the pins", which is a fake success. It is now stated
 *    on the block, once, in plain words. An honest state beats a flattering one.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Nowhere, deliberately. The rows are CALL SURFACES, not agents: "agent" here
 *    is the name of one surface among fourteen, and drawing an AgentMark beside
 *    it would say a specific crew member is involved when the row is about every
 *    call the loop makes. A decorative mark is exactly the overclaim the presence
 *    doctrine bans. What the crew's work does show up as is the evidence itself:
 *    every number on this page is the crew's own spend and its own eval results.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Num,
  Picker,
  ReadFailed,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getRoutingTable,
  ROUTING_SURFACES,
  setSurfacePin,
  type RoutingRow,
  type RoutingSurface,
} from "@/lib/routing-console.functions";
import { toast } from "@/lib/notify";

export const Route = createFileRoute("/_authenticated/admin/routing")({
  component: AdminRouting,
});

const QUERY_KEY = ["admin-routing-table"];

type LiveModel = { id: string; label: string; provider: string; tier: string };

function modelLabel(models: LiveModel[], id: string | null): string | null {
  if (!id) return null;
  return models.find((m) => m.id === id)?.label ?? id;
}

/** Never a fabricated figure: a window with no calls says there were none. */
function costText(v: number | null): string | null {
  if (v === null) return null;
  return `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}/task`;
}

function latencyText(v: number | null): string | null {
  if (v === null) return null;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s p50` : `${Math.round(v)}ms p50`;
}

/** The current setting, as a person would say it. */
function settingText(row: RoutingRow, models: LiveModel[]): string {
  if (row.setting.kind === "no-model") return "No model";
  if (row.setting.kind === "pinned") {
    return `Pinned to ${modelLabel(models, row.setting.modelId) ?? row.setting.modelId}`;
  }
  const auto = modelLabel(models, row.autoModelId);
  return auto ? `Auto, running ${auto}` : "Auto, nothing live resolves";
}

/** The evidence line. Each fact appears only if it was actually measured. */
function evidence(row: RoutingRow): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const cost = costText(row.costPerTaskUsd7d);
  const latency = latencyText(row.latencyP50Ms7d);
  if (row.callCount7d === 0) {
    parts.push("No calls in the last 7 days");
  } else {
    parts.push(
      <>
        <Num>{row.callCount7d}</Num> calls, 7d
      </>,
    );
    if (cost) parts.push(<Num>{cost}</Num>);
    if (latency) parts.push(<Num>{latency}</Num>);
  }
  parts.push(
    row.evalScore === null ? (
      "not scored"
    ) : (
      <>
        eval <Num>{row.evalScore.toFixed(0)}</Num>
      </>
    ),
  );
  return parts.map((p, i) => (
    <span key={i}>
      {i > 0 ? " · " : ""}
      {p}
    </span>
  ));
}

function AdminRouting() {
  const qc = useQueryClient();
  const fTable = useServerFn(getRoutingTable);
  const fPin = useServerFn(setSurfacePin);

  const [open, setOpen] = useState<RoutingSurface | null>(null);
  const [draft, setDraft] = useState("");
  // Which surface's pin is in flight, so only the row the user pressed
  // announces itself as working while the whole board stays locked.
  const [pinningSurface, setPinningSurface] = useState<RoutingSurface | null>(null);
  function pinRow(surface: RoutingSurface, modelId: string | null) {
    setPinningSurface(surface);
    pin.mutate({ surface, modelId }, { onSettled: () => setPinningSurface(null) });
  }

  const table = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fTable(),
    staleTime: 30_000,
  });

  const pin = useMutation({
    mutationFn: (vars: { surface: RoutingSurface; modelId: string | null }) => fPin({ data: vars }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Recorded. The engine still resolves its own model.");
      setOpen(null);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record the pin."),
  });

  if (table.isLoading) {
    return <Reading>Reading what every surface routes to.</Reading>;
  }

  if (!table.data || "error" in table.data) {
    return (
      <ReadFailed onRetry={() => void table.refetch()}>
        The routing table did not load, so nothing here is safe to change.{" "}
        {table.data && "error" in table.data
          ? table.data.error
          : table.error instanceof Error
            ? table.error.message
            : "The read failed."}
      </ReadFailed>
    );
  }

  const { rows, liveModels } = table.data;
  const opportunities = rows.filter((r) => r.recommendation !== null).length;

  return (
    <Region
      title={
        opportunities === 0
          ? `No cheaper model matches the score on any of the ${rows.length} surfaces`
          : opportunities === 1
            ? "One surface could run a cheaper model at the same score"
            : `${opportunities} surfaces could run a cheaper model at the same score`
      }
      sub={
        <>
          Cost, latency and volume are the last 7 days of real calls, and the score is the average
          of completed eval runs for that surface and model; a surface with no eval runs shows no
          recommendation rather than a guess. A pin is recorded here and the engine does not read it
          yet, so setting one records your decision without changing which model runs.
        </>
      }
    >
      {rows.map((row) => {
        const isOpen = open === row.surface;
        const rec = row.recommendation;
        const recLabel = rec ? (modelLabel(liveModels, rec.modelId) ?? rec.modelId) : null;
        return (
          <div key={row.surface}>
            <Row
              tight
              lead={
                <>
                  <span style={{ fontFamily: "var(--mrd-mono)" }}>{row.surface}</span>
                  {" · "}
                  {settingText(row, liveModels)}
                </>
              }
              sub={
                <>
                  {evidence(row)}
                  {rec ? <> · cheaper option: {rec.reason}</> : null}
                </>
              }
              onClick={
                row.setting.kind === "no-model"
                  ? undefined
                  : () => {
                      const next = isOpen ? null : row.surface;
                      setOpen(next);
                      setDraft(row.setting.kind === "pinned" ? row.setting.modelId : "");
                    }
              }
              action={
                rec ? (
                  <Action
                    busy={pinningSurface === row.surface}
                    disabled={pin.isPending}
                    onClick={() => pinRow(row.surface, rec.modelId)}
                  >
                    {pinningSurface === row.surface ? "Recording" : `Take ${recLabel}`}
                  </Action>
                ) : undefined
              }
            />
            {isOpen ? (
              <div style={{ paddingLeft: "var(--mrd-s6)" }}>
                <Line
                  label="Model for this surface"
                  sub={
                    row.autoModelSource === "capability"
                      ? "Auto picks by what this surface needs the model to be able to do."
                      : row.autoModelSource === "default"
                        ? "This surface has no capability rule, so Auto falls back to the default model."
                        : "Nothing live resolves for this surface today."
                  }
                  htmlFor={`pin-${row.surface}`}
                >
                  <Picker
                    id={`pin-${row.surface}`}
                    value={draft}
                    disabled={pin.isPending}
                    aria-busy={pinningSurface === row.surface}
                    onChange={(e) => setDraft(e.target.value)}
                  >
                    <option value="">
                      Auto{row.autoModelId ? ` (${modelLabel(liveModels, row.autoModelId)})` : ""}
                    </option>
                    {liveModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </Picker>
                </Line>
                <Actions>
                  <Action
                    variant="primary"
                    busy={pinningSurface === row.surface}
                    disabled={
                      pin.isPending ||
                      draft === (row.setting.kind === "pinned" ? row.setting.modelId : "")
                    }
                    onClick={() => pinRow(row.surface, draft || null)}
                  >
                    {pinningSurface === row.surface ? "Recording" : "Record this pin"}
                  </Action>
                  <Action variant="quiet" onClick={() => setOpen(null)}>
                    Close
                  </Action>
                </Actions>
              </div>
            ) : null}
          </div>
        );
      })}
    </Region>
  );
}
