import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import {
  getPushedInsights,
  markInsightActioned,
  type PushedInsight,
} from "@/lib/brain-insights.functions";
import { Block, Button, Row } from "@/components/shell/primitives";

/**
 * WHAT THE BRAIN NOTICED WHILE NOBODY WAS LOOKING.
 *
 * WHAT WAS FOUND. `runInsightPush` rides the two-hourly derive tick and writes
 * push rows into `insights`: a ground shift, a bet contradicted by new evidence,
 * a calibration miss. Each carries a one-click action. `getPushedInsights` reads
 * them back and `markInsightActioned` settles them. All three had ZERO React
 * callers, exactly like `getFocusNext` before tonight. The product was noticing
 * things every two hours and telling nobody.
 *
 * THIS IS THE UNPROMPTED HALF OF LAYER 01. `FocusNext` answers "what should I
 * work on next", which is a question. These are the things nobody asked about:
 * the product volunteering that something changed under a decision already
 * made. A director that only speaks when spoken to is a search box.
 *
 * IT CAN SETTLE, NOT ONLY SHOW. A lane that lists work without letting a person
 * finish it is a notification tray, and this product has a standing rule
 * against a capability with no door. Each card acts or is waved off, and either
 * way it leaves the lane, because `getPushedInsights` returns only open rows.
 *
 * IT IS SILENT WHEN THERE IS NOTHING. No pushes means no Block at all, rather
 * than an empty heading promising insight that never arrives. Same rule as the
 * gate above it, and the same reason: the product does not claim work it has
 * not done.
 */
export function PushedInsights() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fPushed = useServerFn(getPushedInsights);
  const fActioned = useServerFn(markInsightActioned);

  const pushed = useQuery({
    queryKey: ["brain", "pushed-insights"],
    queryFn: () => fPushed(),
    // The write side rides a two-hourly tick, so anything shorter is asking a
    // question that cannot have a new answer yet.
    staleTime: 10 * 60 * 1000,
  });

  const settle = useMutation({
    mutationFn: (v: { id: string; outcome: "acted" | "dismissed" }) => fActioned({ data: v }),
    // OPTIMISTIC, because the card is the person's own press and waiting on a
    // round trip to remove it makes a settled card look stuck. The refetch
    // below is what makes it true.
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["brain", "pushed-insights"] });
      const before = qc.getQueryData<{ insights: PushedInsight[] }>(["brain", "pushed-insights"]);
      qc.setQueryData<{ insights: PushedInsight[] }>(["brain", "pushed-insights"], (old) =>
        old ? { insights: old.insights.filter((i) => i.id !== id) } : old,
      );
      return { before };
    },
    // A refused write RESOLVES in supabase-js rather than throwing, so the
    // rollback below is not the only guard: the refetch is what proves the row
    // really left. Putting the card back on a genuine error is the half a
    // person can see.
    onError: (_e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(["brain", "pushed-insights"], ctx.before);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["brain", "pushed-insights"] }),
  });

  if (pushed.isLoading || pushed.isError) return null;
  const insights = pushed.data?.insights ?? [];
  if (insights.length === 0) return null;

  return (
    <Block
      title="The brain noticed this on its own"
      sub="Nobody asked for these. They came out of the record while you were elsewhere."
    >
      {insights.map((i) => (
        <Row
          key={i.id}
          lead={i.title}
          sub={i.body}
          action={
            <>
              {/* THE ACTION IS THE PUSH'S OWN LABEL, verbatim. The write side
                  chose the verb when it noticed the thing, and re-deriving one
                  here would let the button and the reasoning drift apart. */}
              <Button
                variant="primary"
                disabled={settle.isPending}
                onClick={() => {
                  settle.mutate({ id: i.id, outcome: "acted" });
                  void navigate({ to: targetRoute(i.action.kind) });
                }}
              >
                {i.action.label}
              </Button>
              <Button
                variant="ghost"
                disabled={settle.isPending}
                onClick={() => settle.mutate({ id: i.id, outcome: "dismissed" })}
                title="Not worth acting on. It leaves the lane and the record keeps it."
              >
                Not this
              </Button>
            </>
          }
        />
      ))}
    </Block>
  );
}

/**
 * Where a push's action kind lives. Deliberately a small closed map with a
 * FALLBACK rather than a lookup that can return undefined: an unknown kind
 * sends a person to the Brain, which holds everything, instead of to a broken
 * link. A push whose kind this file has not learned yet is the normal case as
 * the write side grows, not an error.
 */
function targetRoute(kind: string): string {
  switch (kind) {
    case "opportunity":
    case "theme":
      return "/discover";
    case "decision":
      return "/decide";
    case "prd":
    case "spec":
      return "/plan";
    case "mission":
    case "changeset":
      return "/runs";
    case "outcome":
    case "learning":
      return "/learn";
    default:
      return "/brain";
  }
}
