import { useState, useMemo, type CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "@/lib/notify";
import {
  getRoadmap,
  updateRoadmapItem,
  commitRoadmapItem,
  bulkUpdateRoadmapItems,
  type RoadmapItem,
  type RoadmapBucket,
} from "@/lib/roadmap.functions";
import { isCommitmentGoverned } from "@/lib/roadmap-governance";
import { stripAutoPrefix } from "./format";
import { BetCard } from "./BetCard";
import { revertRoadmapItemToPrevious } from "@/lib/artifact-rewind.functions";
import { stillWaiting } from "@/lib/query-state";
import { CommitCeremony, type CommitCeremonyBet } from "./CommitCeremony";
import { Actions, Button, Empty, Failed, Num } from "@/components/shell/primitives";

/** The three columns, in plain words. NOW used to be printed in ember: ember
 *  marks the human and the one thing waiting on you, never a column heading, so
 *  the board is monochrome and the count carries the weight. */
const COLUMNS: { key: RoadmapBucket; label: string }[] = [
  { key: "now", label: "Now" },
  { key: "next", label: "Next" },
  { key: "later", label: "Later" },
];

// Anti-scroll (founder ruling 2026-07-06): each column shows its top few and
// expands independently, same idiom as SignalFeed/AutoClustered.
const VISIBLE_ITEMS = 5;

/** The board scrolls INSIDE ITS OWN BOX rather than making the page scroll
 *  sideways: horizontal scrolling on the page was named twice as a pain point.
 *  The track is intrinsically responsive (auto-fit, not a breakpoint), so it
 *  answers to the width of the region it is dropped into rather than to the
 *  width of the window, and it only ever scrolls when three columns genuinely
 *  cannot fit. */
const BOARD_SCROLLER: CSSProperties = { overflowX: "auto" };
const BOARD_TRACK: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "var(--sp-space-4)",
};

/**
 * The outcome-declared Now/Next/Later board. Backlog items (`bucket: null`) draw
 * no card in the columns, which are lanes and can only hold what has a lane.
 *
 * ONE EXCEPTION, AND IT IS THE POINT OF THIS SURFACE. A lane-less bet whose
 * LIFECYCLE status is already 'committed' or 'now' is named here and can be
 * placed from here, because "we are building this" and "it is in a lane" are
 * different facts and this is the only surface that can reconcile them. It is
 * named in BOTH exits below. The empty state names it in a SECOND branch — a
 * workspace that genuinely holds nothing keeps its original sentence and its
 * original instruction, untouched — and once the board has drawn its first card
 * a quiet line above the columns keeps naming what is left, because placing one
 * bet does not place the rest and the door must not shut after one press. See
 * `unplacedDecided` for the measurement.
 *
 * It draws no heading and no card of its own: the section holding it is already
 * titled and is the one bordered container in the region.
 *
 * Editing the outcome of an ALREADY-committed bet goes through the same
 * governed `commitRoadmapItem` path (bucket stays put, outcome+measure get
 * re-declared), and a multi-select bulk re-prioritize bar calls
 * `bulkUpdateRoadmapItems`.
 */
export function RoadmapColumns() {
  const qc = useQueryClient();
  const fRoadmap = useServerFn(getRoadmap);
  const fUpdate = useServerFn(updateRoadmapItem);
  const fCommit = useServerFn(commitRoadmapItem);
  const fBulk = useServerFn(bulkUpdateRoadmapItems);
  const fRewind = useServerFn(revertRoadmapItemToPrevious);
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => fRoadmap() });
  const [ceremonyBet, setCeremonyBet] = useState<CommitCeremonyBet | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // One toggle per column (Now/Next/Later are independent lists).
  const [expandedCols, setExpandedCols] = useState<Set<RoadmapBucket>>(new Set());
  const toggleExpanded = (key: RoadmapBucket) =>
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleSelect = (id: string, on: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const move = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket }) =>
      fUpdate({ data: { id: v.id, bucket: v.bucket } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(`Moved to ${v.bucket === "next" ? "Next" : "Later"}.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // PC-10: one-key rewind of the last placement change (agent roadmap.move or a
  // human move/commit). The button only shows when hasSnapshot is true.
  const rewind = useMutation({
    mutationFn: (v: { opportunity_id: string }) => fRewind({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Reverted to the previous placement. The change is on the Trust Ledger.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: (v: { id: string; outcome: string; measure: string }) =>
      fCommit({ data: { id: v.id, bucket: "now", outcome: v.outcome, measure: v.measure } }),
    onSuccess: () => {
      setCeremonyBet(null);
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Committed to Now. The team builds this next.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Re-declare outcome+measure for a bet already sitting in a bucket, the same
  // governed write as `commit` above, but the bucket is the bet's current one
  // (not forced to "now"), so it never re-homes a bet for an edit.
  const editOutcome = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket; outcome: string; measure: string }) =>
      fCommit({ data: { id: v.id, bucket: v.bucket, outcome: v.outcome, measure: v.measure } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success("Outcome saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Bulk re-prioritize the selected set into one bucket, lenient like the drag
  // move (place-first; per-item outcome+measure governance still applies and the
  // gap surface flags what moved without one).
  const bulkMove = useMutation({
    mutationFn: (v: { ids: string[]; bucket: RoadmapBucket }) =>
      fBulk({ data: { ids: v.ids, bucket: v.bucket } }),
    onSuccess: (res) => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      toast.success(
        res.moved > 0
          ? `Moved ${res.moved}${res.skipped ? ` · ${res.skipped} unchanged` : ""}.`
          : "Nothing to move.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleMove = (item: RoadmapItem, bucket: RoadmapBucket) => {
    if (bucket === "now") {
      setCeremonyBet({
        id: item.id,
        title: stripAutoPrefix(item.title),
        outcome: item.outcome,
        measure: item.measure,
      });
      return;
    }
    move.mutate({ id: item.id, bucket });
  };

  // Hooks must run unconditionally before the read-state early returns below
  // (isError, then stillWaiting — the pair was isLoading/isError until the wait
  // was widened), or the hook count changes between the loading and loaded
  // renders and React throws "Rendered more hooks than during the previous
  // render." (found + fixed 2026-07-11).
  const allItems = roadmap.data?.items ?? [];
  const items = allItems.filter(
    (i): i is RoadmapItem & { bucket: RoadmapBucket } => i.bucket !== null,
  );

  /**
   * THE BETS THIS BOARD CANNOT DRAW, BECAUSE THEY ARE IN NO LANE.
   *
   * `status` is the opportunity's LIFECYCLE state and `bucket` is its LANE.
   * They are different columns meaning different things, and roadmap.functions
   * .ts:117-131 says so at the point the row is mapped. A bet can therefore be
   * decided and still carry no lane, and until this list existed such a bet was
   * invisible on the one surface that exists to place it, while the station head
   * a paragraph above counted it out loud: /plan said "3 bets are committed but
   * sit in no lane." and then, forty pixels lower, "No bets on the roadmap yet."
   *
   * Re-measured through the Lovable MCP on 2026-08-06: of 292 opportunities, 36
   * read status 'committed' and 10 read 'now' - 46 decided bets - and exactly 0
   * carry any lane at all. (An earlier read the same day counted 289; the total
   * moves as Discover writes, so the load-bearing pair is 46 against 0 rather
   * than the denominator.) So every one of the 21 workspaces draws an empty
   * board, and in the 13 holding a decided bet that empty board was
   * contradicting a head which had just counted those bets out loud. The other 8
   * are the genuinely-empty case and keep the original sentence, instruction and
   * all.
   *
   * TEN OF THOSE 46 CARRY STATUS 'now', AND THIS COPY STILL CALLS THEM
   * "committed". That is deliberate rather than sloppy: plan.index's head uses
   * the byte-identical predicate and the byte-identical word forty pixels above
   * (its `decided`), and the two surfaces agreeing is the entire point of this
   * branch. The word is loose on both in the same way, so it changes on both in
   * one commit or on neither - correcting it here alone reopens the
   * contradiction this branch was written to close.
   *
   * This reads the SAME ["roadmap"] cache entry the station head reads, and in
   * the empty branch below no bet has a lane at all, so there this count and the
   * head's own `decided` are the same number by construction rather than by
   * coincidence. Sorted by ICE the way every column on this board is, so
   * "highest-ranked" means one thing on this surface.
   */
  const unplacedDecided = allItems
    .filter((i) => i.bucket === null && (i.status === "committed" || i.status === "now"))
    .sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0));

  // Memoize bucket grouping so we don't re-filter/sort on every render (e.g., when selectedIds changes).
  // Maps each column key to its sorted items, computed once per items change.
  const itemsByBucket = useMemo(() => {
    const grouped = new Map<RoadmapBucket, RoadmapItem[]>();
    for (const col of COLUMNS) grouped.set(col.key, []);
    for (const item of items) {
      grouped.get(item.bucket)?.push(item);
    }
    for (const arr of grouped.values()) {
      arr.sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0));
    }
    return grouped;
  }, [items]);

  // A read that failed is not an empty state. "Nothing is committed" and "we
  // could not find out" are different facts and a person acts differently on each.
  //
  // TESTED BEFORE THE WAIT, AND THE ORDER IS NOW LOAD-BEARING. It used to sit
  // below the skeleton, which was harmless while the skeleton asked
  // `roadmap.isLoading`, because v5's `isLoading` is `isPending && isFetching`
  // and an errored query is neither. The wait below now asks `stillWaiting`,
  // which is true for ANY query holding no `data` — an errored one included — so
  // with the old order a failed read would sit under a skeleton for ever and
  // this branch, with the retry on it, would be unreachable.
  if (roadmap.isError) {
    return (
      <Failed onRetry={() => void roadmap.refetch()}>
        {(roadmap.error as Error)?.message ?? "The roadmap did not load."}
      </Failed>
    );
  }

  /**
   * AN ANSWER THAT HAS NOT ARRIVED IS NOT THE ANSWER "NONE".
   *
   * This asked `roadmap.isLoading`, which is `isPending && isFetching` in
   * react-query v5 and therefore FALSE for a query that is pending but not in
   * flight (paused with no network, or not yet started). In that state the
   * skeleton stood down and the branch below announced "No bets on the roadmap
   * yet. Commit a ranked opportunity from Discover." to a workspace whose bets
   * had simply not arrived — the /discover first-frame defect, on the board that
   * exists to place bets. `stillWaiting` is the shared guard written for exactly
   * this (src/lib/query-state.ts) and it also covers the error path, which is
   * why the <Failed> branch above had to move ahead of it.
   */
  if (stillWaiting(roadmap)) {
    return (
      <div role="status" style={BOARD_SCROLLER}>
        <span className="sr-only">Reading the roadmap.</span>
        <div style={BOARD_TRACK} aria-hidden="true">
          {COLUMNS.map((c) => (
            <div key={c.key} style={{ minWidth: 0 }}>
              <div
                style={{
                  height: 10,
                  width: 72,
                  marginBottom: "var(--sp-space-3)",
                  borderRadius: "var(--sp-radius-xs)",
                  background: "var(--sp-lift)",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  minHeight: 132,
                  borderRadius: "var(--sp-radius-card)",
                  background: "var(--sp-sink)",
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * The commit ceremony belongs to BOTH exits below, not just the loaded board.
   * The empty branch now opens it too, and a dialog mounted on only one of two
   * returns is a button that silently does nothing on the other.
   */
  const ceremony = ceremonyBet ? (
    <CommitCeremony
      bet={ceremonyBet}
      pending={commit.isPending}
      onCancel={() => setCeremonyBet(null)}
      onConfirm={(values) => commit.mutate({ id: ceremonyBet.id, ...values })}
    />
  ) : null;

  if (items.length === 0) {
    // RATCHET: a workspace that genuinely has nothing keeps the exact sentence
    // it has always had, instruction and all. What follows is a second branch
    // for the case that sentence was WRONG about, never a replacement for it.
    if (unplacedDecided.length === 0) {
      return <Empty>No bets on the roadmap yet. Commit a ranked opportunity from Discover.</Empty>;
    }
    // The bet the board would have drawn first if it could draw any of them.
    const top = unplacedDecided[0];
    const topTitle = stripAutoPrefix(top.title);
    return (
      <>
        <Empty
          action={
            /* The station's primary act, finally reachable from the surface
               that exists to perform it. It calls the SAME `handleMove(item,
               "now")` a card's "move to Now" calls, so a promise declared from
               here and one declared from the board are one function and cannot
               drift. No competing primary is on screen in this state:
               plan.index's Gate reads its `undeclared` out of the BUCKETED bets,
               which is the empty set here, and TrackStart's primary only mounts
               once its form is opened.

               ONE KNOWN LIMIT, STATED RATHER THAN FIXED. A successful commit
               from here unmounts this whole branch, and CommitCeremony overrides
               nothing about Radix's close behaviour, so focus returns to a
               trigger that no longer exists and falls to document.body: a
               keyboard user loses their place. It is not this branch's
               invention: three other `<Empty action={<Button…>}>` callers open a
               dialog that then changes the branch out from under the trigger and
               behave identically (DecisionsPanel, DesignMemoryPanel and
               ProductsTab, all checked). The fix belongs where the idiom lives,
               either as an `onCloseAutoFocus` on the ceremony or as a focus
               target handed to Empty, and neither of those is this file. Left
               alone on purpose in launch week rather than solved here for a
               fourth time in a fourth private way. */
            <Button variant="primary" onClick={() => handleMove(top, "now")}>
              Place it in Now
            </Button>
          }
        >
          {unplacedDecided.length === 1 ? (
            <>
              One bet is committed and it is in no lane yet, so this board has nothing to draw:{" "}
              {topTitle}.
            </>
          ) : (
            <>
              <Num>{unplacedDecided.length}</Num> bets are committed and none is in a lane yet, so
              this board has nothing to draw. Highest-ranked: {topTitle}.
            </>
          )}
        </Empty>
        {ceremony}
      </>
    );
  }

  return (
    <>
      {/* THE BETS THE COLUMNS STILL CANNOT DRAW, ONCE THE BOARD CAN DRAW SOME.
          Placing one bet does not place the others, so without this line the
          first press of the empty state's button would carry the board out of
          the branch above and take the remaining bets off the page with it: the
          door this surface just opened would shut after one press, and a count
          the user had just been shown would silently stop being shown.
          Re-measured through the Lovable MCP on 2026-08-06 and unchanged: 13
          workspaces hold unplaced committed bets, 12 of them hold more than one,
          and the counts run 7,5,5,5,3,3,3,3,3,3,3,2,1. The seven seeded demo
          workspaces are the seven 3s, so in those — the ones a visitor is most
          likely to open — the first press leaves two behind.

          THAT IS AS FAR AS THE MEASUREMENT REACHES, and the sentence here used
          to reach further. Across all 13 the first press leaves anywhere from
          six behind (the workspace holding 7) down to none at all (the one
          holding 1, where this line correctly disappears after the press). What
          holds for every one of the 13 is only that placing one bet does not
          place the rest, and that is the whole reason this line exists.

          Deliberately NOT variant="primary". Here the columns are not empty, so
          plan.index's Gate can fire — it reads `undeclared` out of the BUCKETED
          bets — and that Gate owns the one primary act on this station; Actions'
          own contract is one primary among them and only one. To be exact about
          which bets can make it fire, because the looser version of this
          sentence read as though this button could: never one placed from HERE.
          CommitCeremony will not confirm until both fields are filled
          (`canConfirm`), so this path always writes an outcome. It is the
          lenient drag (`updateRoadmapItem`) and the bulk bar that can leave a
          placed bet carrying no promise. */}
      {unplacedDecided.length > 0 && (
        <Actions>
          <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
            <Num>{unplacedDecided.length}</Num>{" "}
            {unplacedDecided.length === 1 ? "committed bet is" : "committed bets are"} in no lane.
            Highest-ranked: {stripAutoPrefix(unplacedDecided[0].title)}
          </span>
          <Button onClick={() => handleMove(unplacedDecided[0], "now")}>Place it in Now</Button>
        </Actions>
      )}
      {/* The bulk bar appears only once a set is selected (calm front), and it is
          a line of actions rather than a panel: a card here would be a card
          inside the section's card. */}
      {selectedIds.size > 0 && (
        <Actions
          trailing={
            <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          }
        >
          <span style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
            <Num>{selectedIds.size}</Num> selected, move to
          </span>
          {COLUMNS.map((col) => (
            <Button
              key={col.key}
              disabled={bulkMove.isPending}
              onClick={() => bulkMove.mutate({ ids: [...selectedIds], bucket: col.key })}
            >
              {col.label}
            </Button>
          ))}
        </Actions>
      )}
      <div style={BOARD_SCROLLER}>
        <div style={BOARD_TRACK}>
          {COLUMNS.map((col) => {
            const colItems = itemsByBucket.get(col.key) ?? [];
            const expanded = expandedCols.has(col.key);
            const shownItems = expanded ? colItems : colItems.slice(0, VISIBLE_ITEMS);
            return (
              <div key={col.key} style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "var(--sp-space-2)",
                    marginBottom: "var(--sp-space-3)",
                    paddingBottom: "var(--sp-space-2)",
                    borderBottom: "1px solid var(--sp-line-soft)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--sp-text-label)",
                      fontWeight: "var(--sp-weight-strong)",
                      color: "var(--sp-ink)",
                    }}
                  >
                    {col.label}
                  </span>
                  <Num>{colItems.length}</Num>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--sp-space-3)",
                  }}
                >
                  {shownItems.map((item) => (
                    <BetCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      measure={item.measure}
                      outcome={item.outcome}
                      column={col.key}
                      iceScore={item.ice_score}
                      hasOutcome={isCommitmentGoverned(item)}
                      updatedAt={item.updated_at}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={(on) => toggleSelect(item.id, on)}
                      onMoveTo={(bucket) => handleMove(item, bucket)}
                      onEditOutcome={(values) =>
                        editOutcome.mutate({ id: item.id, bucket: col.key, ...values })
                      }
                      editPending={editOutcome.isPending && editOutcome.variables?.id === item.id}
                      canRewind={item.hasSnapshot}
                      onRewind={() => rewind.mutate({ opportunity_id: item.id })}
                      rewindPending={
                        rewind.isPending && rewind.variables?.opportunity_id === item.id
                      }
                    />
                  ))}
                  {colItems.length > VISIBLE_ITEMS ? (
                    <Button variant="ghost" onClick={() => toggleExpanded(col.key)}>
                      {expanded ? "Show fewer" : `Show ${colItems.length - VISIBLE_ITEMS} more`}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {ceremony}
    </>
  );
}
