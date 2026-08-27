/**
 * What may run on a schedule without asking, and what is armed but cannot.
 *
 * WHY THIS COMPONENT EXISTS, and it is the second half of a fix that stopped
 * halfway.
 *
 * `workspaces.auto_derive_enabled` shipped with `NOT NULL DEFAULT false` and no
 * writer anywhere in the repo for six weeks. Two cron jobs read it as a filter,
 * so both selected zero rows on every run, on schedule, reporting healthy, and
 * everything behind it was dark: insight resolution, brier scoring, and the whole
 * forecast audit the positioning rests on. The repair built the writers.
 *
 * The writers had no door. `getWorkspaceAutomation` and `setWorkspaceAutomation`
 * were correct, RLS-enforced, zero-row-checked, tested, and called by NOTHING in
 * `src/components` or `src/routes`. So the flag went from "no code can write it"
 * to "no person can reach the code that writes it", which is the same outcome
 * wearing a better implementation. Arming these still required SQL.
 *
 * THE THIRD STATE IS THE POINT. A switch reading on while the platform cannot do
 * the work is worse than a switch reading off, because it answers the question
 * and the answer is wrong. Market watching is gated on a platform secret nobody
 * in the workspace can see, and both sweeps behind it return before their job
 * ledger is even opened, so nothing anywhere recorded the silence. `grounded`
 * says it out loud.
 *
 * IT LIVES ON /boundary because the page's own sub-line is the doctrine these
 * switches implement: "Set once, in advance. Moving a boundary never interrupts
 * work that is already running." That is policy rather than permission, which is
 * what this product says it is built on.
 */
import * as React from "react";
import { humanWriteError } from "@/lib/roles.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getWorkspaceAutomation,
  setWorkspaceAutomation,
} from "@/lib/workspace-automation.functions";
import {
  AUTOMATION_FLAGS,
  automationRunState,
  type AutomationFlag,
} from "@/lib/workspace-automation";
/*
 * PORTED TO MERIDIAN 2026-08-16, on the rebase that first put this file and the
 * ratchet in one tree. The guard failed the moment they met: this file was born
 * on the retired component layer, and the rule is that a file the baseline has
 * never seen must be born clean.
 *
 * It is portable at all because `Row` and `Line` were built in Meridian earlier
 * the same day. Before that there was nowhere for either to go.
 *
 * `tone="hold"` became `tone="hold"`, which is a rename of the SAME meaning
 * rather than the nearest colour: Meridian spends `--mrd-hold` on "stopped, and
 * not on you", and "armed, idle" is a condition rather than a decision anyone
 * can make. Orchid there would send a reader hunting a button that is not there.
 */
import { ReadFailed, Reading, Region, Toggle, Value } from "@/components/meridian/surface-parts";
import { Line, Row } from "@/components/meridian/rows";

type Receipt = { verb: string; consequence: string; failed?: boolean } | null;

export function AutomationBoundary({
  workspaceId,
  only,
  title = "What runs on its own",
  sub = "Set once, in advance. Each one is off until you say otherwise, and the ones that spend money say so.",
}: {
  workspaceId: string | null;
  /**
   * Render a SUBSET of the catalogue, for a station that owns one of these.
   *
   * WHY A FILTER RATHER THAN A SECOND COMPONENT. Discover's whole job is reading
   * sources, so the switch that decides whether sources are read on a schedule
   * belongs on Discover and not only on a governance page two sections away. But
   * a second implementation of the same switch is how two controls for one column
   * come to disagree, and this product already carries a scar from a Discover
   * switch whose label promised reading while it wrote the clustering flag. One
   * component, one pair of server functions, rendered in both places.
   *
   * Absent means the whole catalogue, which is what /boundary wants.
   */
  only?: readonly string[];
  title?: string;
  sub?: string;
}) {
  const qc = useQueryClient();
  const fGet = useServerFn(getWorkspaceAutomation);
  const fSet = useServerFn(setWorkspaceAutomation);
  const [receipt, setReceipt] = React.useState<Receipt>(null);

  const q = useQuery({
    queryKey: ["workspace-automation", workspaceId],
    queryFn: () => fGet({ data: { workspaceId: workspaceId as string } }),
    enabled: !!workspaceId,
  });

  const flip = useMutation({
    mutationFn: (v: { flag: AutomationFlag; enabled: boolean }) =>
      fSet({
        data: { workspaceId: workspaceId as string, column: v.flag.column, enabled: v.enabled },
      }),
    onSuccess: (_res, v) => {
      void qc.invalidateQueries({ queryKey: ["workspace-automation", workspaceId] });
      setReceipt({
        verb: v.enabled ? "Switched on" : "Switched off",
        // Says what changes, not that a column moved. Turning one OFF is the case
        // where a person most needs to be told the consequence, so the
        // catalogue's own darkWhenOff sentence is what they get.
        consequence: v.enabled ? `${v.flag.label}. It runs on the next sweep.` : v.flag.darkWhenOff,
      });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "Nothing changed",
        // The server's own sentence. It refuses a non-owner by name and checks
        // for the zero-row RLS refusal that supabase-js reports as success.
        consequence: e.message,
        failed: true,
      }),
  });

  if (!workspaceId) return null;

  return (
    <Region title={title} sub={sub}>
      {/* LOADING IS ASKED FIRST, AND THE EMPTY BRANCH IS GONE.
          It used to read "These switches belong to a workspace, and none is
          open" — a sentence that could never be true where it stood. The early
          return above this block already sends every workspace-less render
          away, so by here a workspace IS open, and the message named the one
          cause it had just ruled out.
          It was also unreachable. `getWorkspaceAutomationImpl` coerces a
          missing row to `{}` and returns `{ state, platform }` on every path,
          so a settled success never carries falsy data. What is left is a
          defensive narrowing for `q.data` below, and a read that came back
          with nothing is a failed read from a person's side rather than an
          empty one — so it says so and offers the same retry, instead of
          dead-ending on a diagnosis of its own. */}
      {q.isLoading ? (
        <Reading>Reading what runs without asking.</Reading>
      ) : q.isError || !q.data ? (
        <ReadFailed onRetry={() => void q.refetch()}>
          {humanWriteError(q.error, "The switches did not come back.")}
        </ReadFailed>
      ) : (
        <>
          {receipt ? <Line label={receipt.consequence} /> : null}
          {AUTOMATION_FLAGS.filter((f) => !only || only.includes(f.column)).map((flag) => {
            const enabled = q.data.state[flag.column] === true;
            const platformReady = flag.requiresPlatform
              ? q.data.platform[flag.requiresPlatform.key]
              : null;
            const state = automationRunState({ flag, enabled, platformReady });
            const busy = flip.isPending && flip.variables?.flag.column === flag.column;
            return (
              <Row
                key={flag.column}
                lead={flag.label}
                sub={
                  /* THE THREE STATES, each saying a different thing to do.
                     `grounded` names the platform gap rather than the variable,
                     because the person reading this cannot set an env var and
                     telling them the name of one is not help. */
                  state === "grounded" && flag.requiresPlatform
                    ? flag.requiresPlatform.missing
                    : state === "on"
                      ? "Running on its own."
                      : flag.darkWhenOff
                }
                action={
                  <>
                    {/* Stated before the switch, never after it. A person deciding
                        whether to arm something needs to know it costs money
                        before they press, not once it is running. */}
                    {flag.costsModelCalls ? <Value tone="quiet">spends</Value> : null}
                    {state === "grounded" ? <Value tone="hold">armed, idle</Value> : null}
                    <Toggle
                      checked={enabled}
                      disabled={busy}
                      label={flag.label}
                      onChange={(next) => flip.mutate({ flag, enabled: next })}
                    />
                  </>
                }
              />
            );
          })}
        </>
      )}
    </Region>
  );
}
