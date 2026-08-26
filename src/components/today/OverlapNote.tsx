import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { getWorkspaceAnchors } from "@/lib/approvals-queue.functions";
import { check, checkLine, contestedOverlapsByMission, overlapLine } from "./overlaps";

/**
 * WHERE TWO TEAMMATES ARE ABOUT TO COLLIDE, SAID ON THE ROW THAT OWNS IT.
 *
 * The fourth thing the mission brief says a person must get in one glance, and
 * the only one that had never been built: *"two pieces of work touching the same
 * thing, or two teammates about to redo each other's output."* Amoeba's claim is
 * the value line — coordinated teammates SPLIT duplicate work instead of
 * repeating it — and `SPEC-MULTIPLAYER-PRESENCE` §3.3 says where it goes: **on
 * the object, once.** On this board the object is the row.
 *
 * ── ONE READ, HOWEVER MANY ROWS ────────────────────────────────────────────
 * Same shape as `HandoverNote`, and for the same reason. Today's wait contract
 * (`today-states-its-wait.test.ts`) counts the route's reads and requires each to
 * own a REGION with its own stated wait and refusal. This is not a region — it is
 * an ENRICHMENT of rows that already stand — so the read lives here, under one
 * shared react-query key that both exports use. React-query dedupes it to a
 * single round trip no matter how many running rows mount.
 *
 * ── WHY THIS DRAWS FEWER MARKS THAN THE DATA CONTAINS ──────────────────────
 * S0's derivation reports every shared target; only `contested` ones (at least
 * one side writes) are drawn. Measured 2026-08-26, the tools that name a target
 * are overwhelmingly reads, so marking every shared target would put a permanent
 * mark on a healthy afternoon — **and a mark that is always on is furniture.**
 * `overlaps.ts` carries the full argument.
 *
 * ── WHY THE VERB IS "changing"/"reading" AND NOT `verbForTool` ─────────────
 * `src/lib/presence/character.ts` already holds `VERB_BY_TOOL` and it was checked
 * first, per the brief's rule about not adding what exists. It is not used here:
 * those verbs are FIRST PERSON and built for the character's own line ("revising
 * the spec"), so a third-person mark would carry two verbs and double the clause
 * — and the one fact this mark turns on is exactly the one the derivation used to
 * decide it was worth drawing, which is whether the other side WRITES. Saying it
 * twice would be longer and no truer.
 *
 * ── COLOUR IS NOT DRAWN, DELIBERATELY ──────────────────────────────────────
 * §3.1 wants each teammate in its own colour, assigned once in `src/lib/presence/**`
 * so every surface agrees. That assignment does not exist yet and it is S0's to
 * make (§4), so this renders in amber — the token that already means "off-nominal,
 * look at it" (`ChangesPanel` uses it for a scope breach) — rather than inventing a
 * per-teammate palette here that a later one would contradict. Ask filed.
 */

/** One key for every mark on the page, so the whole board costs one request. */
function useAnchors(workspaceId: string | null) {
  const fAnchors = useServerFn(getWorkspaceAnchors);
  return useQuery({
    queryKey: ["presence", "anchors", workspaceId],
    queryFn: () => fAnchors({ data: { workspaceId: workspaceId as string } }),
    // The read validates a uuid, so a workspace that has not resolved is not a
    // read that returns nothing — it is a read that must not be made.
    enabled: Boolean(workspaceId),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/**
 * The mark under a running row, or nothing.
 *
 * NOTHING IS THE HONEST DEFAULT while the read is in flight or has failed:
 * absence of a mark claims nothing, and this component never gets to say the
 * word "clear". That claim belongs to `OverlapCheck`, which is the only place
 * on this surface allowed to make it and the only place that knows what it
 * could not check.
 */
export function OverlapNote({
  missionId,
  workspaceId,
}: {
  missionId: string;
  workspaceId: string | null;
}) {
  const q = useAnchors(workspaceId);
  const overlap = React.useMemo(
    () => contestedOverlapsByMission(q.data?.anchors, q.data?.collisions).get(missionId),
    [q.data, missionId],
  );
  return <OverlapLine line={overlapLine(overlap)} />;
}

/**
 * The one sentence that lets a quiet board be trusted.
 *
 * A DEDUPE SCREEN THAT RETURNS NOTHING IS WORSE THAN NONE — the brief's words,
 * and the repo has the graveyard to prove it: the restatement fold answered
 * `ids: []` and ~46 tracks of honest work read as producing nothing. So "nobody
 * is on the same thing" is SAID, and said beside the number of pieces of work
 * that could not be checked at all, which is never folded into that zero.
 */
export function OverlapCheck({ workspaceId }: { workspaceId: string | null }) {
  const q = useAnchors(workspaceId);
  const state: "pending" | "failed" | "ready" = q.isError
    ? "failed"
    : !workspaceId || q.data === undefined
      ? "pending"
      : "ready";
  const line = checkLine(
    state === "ready" ? check(q.data?.anchors, q.data?.collisions, q.data?.unknowableRuns) : null,
    state,
  );
  if (!line) return null;
  return <span className="text-mrd-mute"> {line}</span>;
}

/**
 * The paint, split from the read so a test can render it without the server-fn
 * runtime. Nothing here decides a fact; it draws the one it was handed.
 */
export function OverlapLine({ line }: { line: string | null }) {
  if (!line) return null;
  return <p className="px-mrd-2 pb-mrd-2 text-mrd-data text-mrd-hold">{line}</p>;
}
