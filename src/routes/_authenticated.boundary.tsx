/**
 * The Boundary. The one place a person says what their crew may do alone.
 *
 * FOUNDER RULING 2026-08-01, and the positioning it serves, ratified the same
 * day:
 *
 *   "Agents that run the whole product loop without asking permission, because
 *    you set the boundary once, and every crossing is on the record."
 *
 * 1. WHO IS HERE, AND WHY. Someone accountable for what a fleet of agents does
 *    in their company, who needs to answer one question out loud: what can
 *    these things do without me? Today that answer is spread across four Engine
 *    Room rooms and a settings page, so nobody can say it.
 *
 * 2. THE ONE THING IT EXISTS FOR. To turn a permission model into a policy you
 *    set once. Everything on this surface is a boundary, and moving one does
 *    not block any work that is running.
 *
 * 3. WHY IT IS A FIRST-CLASS SURFACE AND NOT AN ENGINE ROOM VIEW. The
 *    Engine-Room doctrine puts machinery behind one door, and this looks like
 *    machinery. It is not. GOVERNANCE-PRINCIPLE.md names it as its own
 *    surface, and the argument is that machinery is what the product does to
 *    itself, while a boundary is what a person decides. The doctrine governs
 *    the first; the governance canon governs the second, and it outranks the
 *    gate-centric assumption everywhere it disagrees.
 *
 * 4. WHY THIS IS A LEAD AND NOT A CATCH-UP (docs/design/REFERENCE-PATTERNS.md,
 *    verified against official docs 2026-08-01). Five products have converged
 *    on exactly this model and every one of them keeps it in a FILE: Cursor's
 *    permissions.json, Claude Code's settings.json, Codex's config.toml, VS
 *    Code's chat.tools.terminal.autoApprove. Cursor went further and
 *    DEPRECATED per-action approval in 3.5, and OpenAI's stated reason for
 *    building an approval-reviewer agent is that "approval friction harms
 *    security" because it drives people to Full Access and rubber-stamping.
 *    The whole market agrees policy beats permission. **Not one of them shows
 *    the policy as a surface a person can read.** That is the opening.
 *
 * 5. THE THREE QUESTIONS, IN THE FOUNDER'S OWN WORDS. "What agents may do
 *    alone, what needs them, and what nobody may do." Those are the three
 *    blocks, in that order, because that is the order of the question a person
 *    actually asks.
 *
 * 6. WHAT IS DELIBERATELY NOT HERE. No approval queue: this surface never
 *    shows a pending item, because the moment it did it would become the thing
 *    it exists to shrink. No per-tool risk score printed as a number, for the
 *    same reason the Discover pass refused a confidence percentage: a number
 *    invites an argument about the number. Risk appears only where it
 *    CONSTRAINS you, as a floor that explains why a control is missing.
 *
 * 7. THE FLOORS ARE READ FROM THE REAL RESOLVER. `getBoundary` computes each
 *    bucket from the same `toolRisk`, `HIGH_RISK_FORCE_REVIEW` and
 *    `HIGH_RISK_MIN_CONFIRM` the agent loop enforces. A boundary screen that
 *    disagrees with the engine is worse than no boundary screen.
 *
 * VOICE: never greet, always report. The first line is a count out of the
 * record, and it is phrased as capability rather than as configuration.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { getBoundary, setWorkspaceSpendPolicy } from "@/lib/governance.functions";
import type { BoundaryTool } from "@/lib/governance.functions";
import { updateToolMode } from "@/lib/agent_loop.functions";
import {
  Block,
  CtxBody,
  CtxHead,
  Empty,
  Failed,
  Input,
  Line,
  Loading,
  MoreItem,
  MoreMenu,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  Value,
} from "@/components/shell/primitives";

/** How many tools a block shows before it counts the rest. A boundary is read,
 *  not browsed, and forty rows in one block is a settings page again. */
const VISIBLE = 8;

type BoundaryReceipt = { verb: string; consequence: React.ReactNode; failed?: boolean };

/** What a floor forbids, in plain words. Never the mechanism name. */
function floorLine(floor: BoundaryTool["floor"]): string | null {
  if (floor === "review") return "Always yours to approve. This one cannot be handed over.";
  if (floor === "confirm") return "Can never run silently.";
  return null;
}

function BoundarySurface() {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const fBoundary = useServerFn(getBoundary);
  const fSetMode = useServerFn(updateToolMode);
  const fSetCap = useServerFn(setWorkspaceSpendPolicy);

  const [receipt, setReceipt] = React.useState<BoundaryReceipt | null>(null);
  const [showAll, setShowAll] = React.useState<Record<string, boolean>>({});

  const b = useQuery({
    queryKey: ["boundary", activeWorkspaceId],
    queryFn: () => fBoundary(),
  });

  const move = useMutation({
    mutationFn: (v: { tool: BoundaryTool; mode: "auto" | "confirm" | "off" }) =>
      fSetMode({ data: { toolId: v.tool.id, mode: v.mode, enabled: v.mode !== "off" } }),
    onSuccess: (_r, v) => {
      // The consequence is what the boundary now LETS THROUGH, in the same
      // words the blocks use, never "Saved."
      setReceipt({
        verb: "You moved the boundary",
        consequence:
          v.mode === "auto"
            ? `${v.tool.label} runs without asking you.`
            : v.mode === "off"
              ? `${v.tool.label} is off. Nobody may do it, including you.`
              : `${v.tool.label} comes to you first.`,
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "The boundary did not move", consequence: e.message, failed: true }),
  });

  const setCap = useMutation({
    mutationFn: (cap: number | null) => fSetCap({ data: { cap_usd: cap } }),
    onSuccess: (_r, cap) => {
      setReceipt({
        verb: "You moved the ceiling",
        consequence:
          cap === null ? (
            "A run now continues until it finishes. Nothing stops it on spend."
          ) : (
            <>
              A run now halts at <Num>${cap.toFixed(2)}</Num>.
            </>
          ),
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "The ceiling did not move", consequence: e.message, failed: true }),
  });

  const data = b.data;
  const total = data ? data.alone.length + data.asks.length + data.never.length : 0;

  /** One block of the boundary. The menu offers only the moves a floor allows,
   *  and where a move is forbidden the row says why instead of showing a
   *  control that does nothing. */
  const block = (key: string, title: string, sub: string, tools: BoundaryTool[], empty: string) => {
    const open = showAll[key] ?? false;
    const shown = open ? tools : tools.slice(0, VISIBLE);
    return (
      <Block
        title={title}
        sub={sub}
        more={tools.length > VISIBLE ? (open ? "Show fewer" : `All ${tools.length}`) : undefined}
        onMore={() => setShowAll((s) => ({ ...s, [key]: !open }))}
      >
        {tools.length === 0 ? (
          <Empty>{empty}</Empty>
        ) : (
          shown.map((t) => (
            <Row
              key={t.id}
              tight
              lead={t.label}
              // The different fact: what it does, or what the floor forbids.
              sub={floorLine(t.floor) ?? t.what ?? t.category}
              action={
                t.floor === "review" ? (
                  <Value tone="warn">Yours</Value>
                ) : (
                  <MoreMenu label={`Move the boundary for ${t.label}`}>
                    {t.mode !== "auto" && t.floor !== "confirm" ? (
                      <MoreItem onClick={() => move.mutate({ tool: t, mode: "auto" })}>
                        Let them do it alone
                      </MoreItem>
                    ) : null}
                    {t.mode !== "confirm" ? (
                      <MoreItem onClick={() => move.mutate({ tool: t, mode: "confirm" })}>
                        Come to me first
                      </MoreItem>
                    ) : null}
                    {t.mode !== "off" ? (
                      <MoreItem onClick={() => move.mutate({ tool: t, mode: "off" })}>
                        Nobody may do this
                      </MoreItem>
                    ) : null}
                  </MoreMenu>
                )
              }
            />
          ))
        )}
      </Block>
    );
  };

  return (
    <Surface
      context={
        <>
          <CtxHead>How a boundary works</CtxHead>
          <CtxBody>
            Policy is set here, in advance, and it never blocks work that is already running. A gate
            is the exception, not the loop.
          </CtxBody>
          {data ? (
            <>
              <CtxHead>What cannot be handed over</CtxHead>
              <CtxBody>
                Anything the product cannot undo from inside itself stays yours: a production
                deploy, anything a customer sees, and spend past the ceiling. Those floors are not
                settings.
              </CtxBody>
            </>
          ) : null}
        </>
      }
    >
      <PageHead
        title={
          b.isLoading ? (
            "Reading the boundary."
          ) : b.isError ? (
            "The boundary could not be read."
          ) : total === 0 ? (
            "No crew has been given anything to do yet."
          ) : (
            <>
              Your crew does <Num>{data?.alone.length ?? 0}</Num> of <Num>{total}</Num> things
              without asking.
            </>
          )
        }
        sub={
          total > 0
            ? "Set once, in advance. Moving a boundary never interrupts work that is already running."
            : undefined
        }
      />

      {b.isError ? (
        <Failed onRetry={() => void b.refetch()}>
          {(b.error as Error)?.message ?? "The reason did not come back with the error."}
        </Failed>
      ) : b.isLoading ? (
        <Loading>Reading what your crew is allowed to do.</Loading>
      ) : !data ? null : (
        <>
          {receipt ? (
            <Receipt
              verb={receipt.verb}
              consequence={receipt.consequence}
              failed={receipt.failed}
            />
          ) : null}

          {block(
            "alone",
            "What they do alone",
            "No approval, no interruption. This is where the leverage is.",
            data.alone,
            "Nothing runs without you yet. Every one of these is a person in the loop.",
          )}

          {block(
            "asks",
            "What still comes to you",
            "Each of these costs one interruption every time it happens.",
            data.asks,
            "Nothing asks. Your crew runs the loop on its own.",
          )}

          {block(
            "never",
            "What nobody may do",
            "Off for agents and for people. Turning one back on is a decision on the record.",
            data.never,
            "Nothing is switched off.",
          )}

          {/* The ceiling. It belongs on the boundary because a spend limit IS a
            boundary, and because arguing for more autonomy without one is the
            single version of this story a risk officer will refuse. */}
          {data.isOwner ? (
            <Block
              title="The ceiling"
              sub="What one run may spend before it stops, whatever else it is allowed to do."
            >
              <Line
                label="Dollars one run may spend"
                sub={
                  data.capUsd === null ? (
                    "No ceiling. A run continues until it finishes or something else stops it."
                  ) : (
                    <>
                      <Num>${data.capUsd.toFixed(2)}</Num>. A run that reaches it halts and says so,
                      and the halt is on the record.
                    </>
                  )
                }
              >
                <Input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={data.capUsd ?? undefined}
                  aria-label="Dollars one run may spend before it stops"
                  style={{ width: 96, textAlign: "right" }}
                  disabled={setCap.isPending}
                  onBlur={(e) => {
                    const raw = e.currentTarget.value.trim();
                    const next = raw === "" ? null : Number(raw);
                    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
                    if (next === data.capUsd) return;
                    setCap.mutate(next);
                  }}
                />
              </Line>
              {data.paused ? (
                <Line
                  label="Everything is paused"
                  sub="A kill switch is on for this workspace, so nothing runs whatever the boundary says."
                >
                  <Value tone="fail">Paused</Value>
                </Line>
              ) : null}
            </Block>
          ) : null}
        </>
      )}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/boundary")({
  component: BoundarySurface,
  head: () => ({ meta: [{ title: "The boundary · Supaprod" }] }),
  errorComponent: ({ error }) => (
    <Surface>
      <PageHead
        title="The boundary did not load."
        sub={(error as Error)?.message ?? "The reason did not come back with the error."}
      />
      <Block>
        <Empty>
          Nothing changed. Your crew is still working to the boundary you last set, which is the
          safe way for this screen to fail.
        </Empty>
      </Block>
    </Surface>
  ),
});
