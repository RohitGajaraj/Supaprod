import {
  useState,
  useMemo,
  useRef,
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  BulkBar,
  NothingYet,
  Num,
  ReadFailedLine,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
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
import { Choices } from "@/components/meridian/forms";
import { Receipt } from "@/components/meridian/Receipt";
/* `use-selection` is NOT the retired layer and stays. It sits in `shell/` only
   because that folder's convention gave a hook its own file: it holds no class
   name, reads no token and renders nothing. `BulkBar` takes the object it
   returns, which is why Meridian imports the type from here too. */
import { useSelection } from "@/components/shell/use-selection";

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
  gap: "var(--mrd-s5)",
};

/**
 * HOW THE BOARD IS ORDERED, AND IT USED TO BE ONE ANSWER.
 *
 * Every column sorted by `ice_score` descending, hardcoded, with no control and
 * no label. Two things were wrong with that beyond the missing choice. The
 * score itself was PASSED INTO THE CARD AND DISCARDED, so the order was
 * unexplained; that is fixed on the card. And ICE is the DISCOVER ranking, which
 * answers "what is worth doing", while a person standing on Plan is usually
 * asking one of two other questions: what is stale, and what is not finished
 * being promised.
 *
 * Three orders, each one a real question, and each computed from a column this
 * board already reads. Nothing new is fetched.
 */
const SORTS = [
  { id: "rank", label: "Rank", title: "By ICE, the score the Decide queue is ordered by" },
  { id: "moved", label: "Last moved", title: "Most recently changed first" },
  { id: "undeclared", label: "Undeclared first", title: "Bets carrying no promise, first" },
] as const;
type Sort = (typeof SORTS)[number]["id"];

export function RoadmapColumns() {
  const qc = useQueryClient();
  const fRoadmap = useServerFn(getRoadmap);
  const fUpdate = useServerFn(updateRoadmapItem);
  const fCommit = useServerFn(commitRoadmapItem);
  const fBulk = useServerFn(bulkUpdateRoadmapItems);
  const fRewind = useServerFn(revertRoadmapItemToPrevious);
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => fRoadmap() });
  const [ceremonyBet, setCeremonyBet] = useState<CommitCeremonyBet | null>(null);
  const [sort, setSort] = useState<Sort>("rank");
  /** Show only the bets that carry no declared promise. A filter and not a sort,
   *  because it answers a different question: not "which first" but "which of
   *  these is the station's own Gate about". */
  const [onlyUndeclared, setOnlyUndeclared] = useState(false);
  // One toggle per column (Now/Next/Later are independent lists).
  const [expandedCols, setExpandedCols] = useState<Set<RoadmapBucket>>(new Set());
  const toggleExpanded = (key: RoadmapBucket) =>
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Hooks must run unconditionally before the read-state early returns below
  // (isError, then stillWaiting — the pair was isLoading/isError until the wait
  // was widened), or the hook count changes between the loading and loaded
  // renders and React throws "Rendered more hooks than during the previous
  // render." (found + fixed 2026-07-11).
  const allItems = useMemo(() => roadmap.data?.items ?? [], [roadmap.data]);
  const items = useMemo(
    () => allItems.filter((i): i is RoadmapItem & { bucket: RoadmapBucket } => i.bucket !== null),
    [allItems],
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
   * Re-measured through the Lovable MCP on 2026-08-06: of 294 opportunities, 36
   * read status 'committed' and 10 read 'now' - 46 decided bets - and exactly 1
   * carries a lane. That leaves 45 decided bets in no lane, across 13 of the 21
   * workspaces.
   *
   * THE LANE COUNT IS NOT A CONSTANT AND MUST NOT BE WRITTEN HERE AS ONE. It was
   * 0 database-wide all morning, and an earlier version of this paragraph drew a
   * universal conclusion from it that became false 15 minutes later, when the
   * first bet was placed. So the branch below is CONDITIONAL: a caller who can
   * reach a placed bet gets a board with a card on it and never sees the empty
   * branch, and a caller who cannot gets an empty board.
   *
   * TEN OF THOSE 46 CARRY STATUS 'now', AND THIS COPY STILL CALLS THEM
   * "committed". That is deliberate rather than sloppy: plan.index's head uses
   * the byte-identical predicate and the byte-identical word forty pixels above
   * (its `decided`), and the two surfaces agreeing is the entire point. The word
   * is loose on both in the same way, so it changes on both in one commit or on
   * neither.
   *
   * Sorted by ICE the way the board's default order is, so "highest-ranked"
   * means one thing on this surface.
   */
  const unplacedDecided = useMemo(
    () =>
      allItems
        .filter((i) => i.bucket === null && (i.status === "committed" || i.status === "now"))
        .sort((a, b) => (b.ice_score ?? 0) - (a.ice_score ?? 0)),
    [allItems],
  );

  /**
   * Each column's list, filtered then ordered. Memoized so re-filtering does not
   * run on every render (the selection changes far more often than the data).
   */
  const itemsByBucket = useMemo(() => {
    const compare = (a: RoadmapItem, b: RoadmapItem) => {
      if (sort === "moved") {
        // A missing timestamp sorts last rather than first: a row that never
        // recorded a change is not the most recently changed thing on the board.
        const at = a.updated_at ? Date.parse(a.updated_at) : 0;
        const bt = b.updated_at ? Date.parse(b.updated_at) : 0;
        return bt - at;
      }
      if (sort === "undeclared") {
        const ag = isCommitmentGoverned(a) ? 1 : 0;
        const bg = isCommitmentGoverned(b) ? 1 : 0;
        // Undeclared first, then by rank inside each group, so the second key is
        // the board's own default and the order never looks arbitrary.
        if (ag !== bg) return ag - bg;
      }
      return (b.ice_score ?? 0) - (a.ice_score ?? 0);
    };
    const grouped = new Map<RoadmapBucket, RoadmapItem[]>();
    for (const col of COLUMNS) grouped.set(col.key, []);
    for (const item of items) {
      if (onlyUndeclared && isCommitmentGoverned(item)) continue;
      grouped.get(item.bucket)?.push(item);
    }
    for (const arr of grouped.values()) arr.sort(compare);
    return grouped;
  }, [items, sort, onlyUndeclared]);

  /** What is on screen right now, in reading order: down Now, then Next, then
   *  Later. This is BOTH the range-select order and the arrow-key order, and it
   *  has to be one list or shift-click would select rows the eye did not sweep. */
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const col of COLUMNS) {
      const colItems = itemsByBucket.get(col.key) ?? [];
      const shown = expandedCols.has(col.key) ? colItems : colItems.slice(0, VISIBLE_ITEMS);
      for (const i of shown) ids.push(i.id);
    }
    return ids;
  }, [itemsByBucket, expandedCols]);

  const selection = useSelection(visibleIds);
  const undeclaredSelected = useMemo(
    () => items.filter((i) => selection.has(i.id) && !isCommitmentGoverned(i)).length,
    [items, selection],
  );

  /**
   * ============================================================================
   * THE RECEIPTS, WHICH USED TO BE TOASTS, AND WHY THAT WAS A SCHISM RATHER
   * THAN A PREFERENCE.
   * ============================================================================
   *
   * This component fired TEN toasts across five mutations, and it is embedded
   * inside plan.index.tsx, forty pixels below a surface that writes `<Receipt>`
   * for the very same class of act (a promise declared, a promise refused, a
   * spec that did not get written). So one station had two idioms for "what your
   * click caused", and which one you got depended on whether the button you
   * pressed happened to live in the route file or in this one.
   *
   * The rule is the shell's, stated at the `Receipt` primitive and in
   * agents/FINAL-agent-presence.md R10: a toast confirms that your CLICK
   * REGISTERED; a receipt renders what your click CAUSED. On a product whose
   * whole claim is that judgement compounds, an act that erases itself after
   * four seconds teaches a person their judgement left no trace. Receipts is the
   * station's own idiom, so receipts is what this uses.
   *
   * SESSION-LOCAL AND CAPPED AT FOUR, the same shape the spec editor keeps: the
   * durable record is the roadmap row and the decision `commitRoadmapItem`
   * writes, and a second copy of it here would be a second source of one truth.
   *
   * ONE STRING WENT ENTIRELY. `rewind`'s toast used to read "The change is on the
   * Trust Ledger." Two things were wrong with it. "Ledger" is dead vocabulary,
   * 0.2 uses per million words against 562.8 for "decisions", so it named a thing
   * nobody says. And it was very likely false: `revertRoadmapItemToPrevious`
   * writes an `agent_approvals` row only when `roadmap_last_agent_slug` is set,
   * which a human move never sets and the first rewind clears, so a rewind of a
   * human placement wrote nothing anywhere called a ledger. That string had
   * already been narrowed once, to "Reverted to the previous placement. You can
   * rewind back."; the receipt below says the same true thing in the station's
   * own voice and the dead word does not come back.
   */
  const [receipts, setReceipts] = useState<
    { key: number; verb: string; consequence: string; failed?: boolean }[]
  >([]);
  const receiptSeq = useRef(0);
  const commitReceipt = useCallback((verb: string, consequence: string, failed?: boolean) => {
    receiptSeq.current += 1;
    setReceipts((r) => [{ key: receiptSeq.current, verb, consequence, failed }, ...r].slice(0, 4));
  }, []);

  const move = useMutation({
    mutationFn: (v: { id: string; bucket: RoadmapBucket; title: string }) =>
      fUpdate({ data: { id: v.id, bucket: v.bucket } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      // The consequence is what the lane MEANS, not the lane's name. "Moved to
      // Next" tells a person what they already watched happen.
      commitReceipt(
        "You moved the bet",
        v.bucket === "next"
          ? `${v.title} is lined up behind Now, and nothing starts on it yet.`
          : `${v.title} is parked in Later. It keeps its promise and waits.`,
      );
    },
    onError: (e: Error, v) =>
      commitReceipt("The bet did not move", `${v.title} is where it was. ${e.message}`, true),
  });

  // PC-10: one-key rewind of the last placement change (agent roadmap.move or a
  // human move/commit). The button only shows when hasSnapshot is true.
  const rewind = useMutation({
    mutationFn: (v: { opportunity_id: string; title: string }) =>
      fRewind({ data: { opportunity_id: v.opportunity_id } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      // Narrowed to what actually happens on EVERY path, which is the snapshot
      // being re-captured. See the receipts docblock above for the claim that
      // used to be here and was not true of a human placement.
      commitReceipt(
        "You put the placement back",
        `${v.title} is where it was before the last change, and the change it undid is now the one you can rewind to.`,
      );
    },
    onError: (e: Error, v) =>
      commitReceipt("Nothing was rewound", `${v.title} is unchanged. ${e.message}`, true),
  });

  const commit = useMutation({
    mutationFn: (v: { id: string; outcome: string; measure: string; title: string }) =>
      fCommit({ data: { id: v.id, bucket: "now", outcome: v.outcome, measure: v.measure } }),
    onSuccess: (_d, v) => {
      setCeremonyBet(null);
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      commitReceipt(
        "You wrote the promise",
        `${v.title} is in Now and promises ${v.outcome}, and Learn can grade it.`,
      );
    },
    onError: (e: Error, v) =>
      commitReceipt(
        "The promise was not written",
        `${v.title} is unchanged on the board. ${e.message}`,
        true,
      ),
  });

  // Re-declare outcome+measure for a bet already sitting in a bucket, the same
  // governed write as `commit` above, but the bucket is the bet's current one
  // (not forced to "now"), so it never re-homes a bet for an edit.
  const editOutcome = useMutation({
    mutationFn: (v: {
      id: string;
      bucket: RoadmapBucket;
      outcome: string;
      measure: string;
      title: string;
    }) => fCommit({ data: { id: v.id, bucket: v.bucket, outcome: v.outcome, measure: v.measure } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      commitReceipt(
        "You rewrote the promise",
        `${v.title} now promises ${v.outcome}, and it stayed in the lane it was in.`,
      );
    },
    onError: (e: Error, v) =>
      commitReceipt(
        "The promise was not saved",
        `${v.title} still reads as it did. ${e.message}`,
        true,
      ),
  });

  /**
   * THE BULK MOVE, AND WHAT IT SKIPS, SAID OUT LOUD.
   *
   * `bulkUpdateRoadmapItems` sets the lane and nothing else. It does not run the
   * ceremony, so a set moved into Now through this bar can land there carrying no
   * outcome and no measure, which is exactly the state the station's Gate exists
   * to catch. That was documented in a comment on this file and stated NOWHERE on
   * screen: a person selected six bets, pressed Now, and six commitments entered
   * the lane the product calls "the one thing the team builds next" without one
   * of them promising anything.
   *
   * THREE THINGS CHANGED, AND NONE OF THEM IS A REFUSAL.
   *   · The bar COUNTS, before the press, how many of the selected bets carry no
   *     promise. It is read off `isCommitmentGoverned`, the same predicate the
   *     Gate and the card use, so the number cannot disagree with either.
   *   · The receipt afterwards names what is now undeclared in Now rather than
   *     saying "Moved 6".
   *   · Moving ONE bet into Now still goes through the ceremony, because that is
   *     the single-bet path and there is no reason for a selection of one to be a
   *     way around it.
   * Bulk stays lenient on purpose: a person re-prioritising twenty bets at once
   * is doing lane work, and forcing twenty ceremonies would mean nobody ever
   * re-prioritises. What it must not do is stay quiet about it.
   */
  const bulkMove = useMutation({
    mutationFn: (v: { ids: string[]; bucket: RoadmapBucket; undeclared: number }) =>
      fBulk({ data: { ids: v.ids, bucket: v.bucket } }),
    onSuccess: (res, v) => {
      selection.clear();
      qc.invalidateQueries({ queryKey: ["roadmap"] });
      if (res.moved === 0) {
        commitReceipt("Nothing moved", "Every bet you picked was already in that lane.");
        return;
      }
      const lane = COLUMNS.find((c) => c.key === v.bucket)?.label ?? v.bucket;
      const skipped = res.skipped ? ` ${res.skipped} were already there.` : "";
      commitReceipt(
        "You re-lined the board",
        v.undeclared > 0
          ? `${res.moved} ${res.moved === 1 ? "bet is" : "bets are"} in ${lane}.${skipped} ${v.undeclared} of them carry no outcome, so they are tasks rather than promises until somebody declares one.`
          : `${res.moved} ${res.moved === 1 ? "bet is" : "bets are"} in ${lane}, each still carrying the promise it already had.${skipped}`,
      );
    },
    onError: (e: Error) => commitReceipt("Nothing moved", e.message, true),
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
    move.mutate({ id: item.id, bucket, title: stripAutoPrefix(item.title) });
  };

  /**
   * THE KEYBOARD, AND THE BOARD HAD NONE.
   *
   * A board is a composite widget: the whole thing is one tab stop and the arrows
   * move within it, which is how every list in every operating system behaves and
   * what a screen reader user expects the moment they meet a grid of cards.
   * Before this, reaching the twelfth bet meant Tab through eleven cards' worth
   * of checkboxes, move buttons, history popovers and rewinds.
   *
   * Up and Down walk the column, Left and Right cross to the same position in the
   * next one, Home and End jump to the ends of the whole board. Space toggles the
   * selection because the checkbox is a real checkbox and gets that for free.
   *
   * NO BARE LETTERS, and this is a deliberate limit rather than an oversight.
   * `src/lib/key-model.ts` is the product's single declaration of every key, and
   * `key-model.test.ts` fails the build in BOTH directions against it: a key
   * bound and not declared is the exact defect it exists to catch, and that file
   * is not this lane's to edit. Arrows, Home, End and Space are structural rather
   * than shortcuts, which key-model's own comment states, so they need no entry.
   * Whoever adds `n`, `x` or `d` here owns declaring them there in the same
   * commit.
   */
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusCard = useCallback((id: string | undefined) => {
    if (!id) return;
    cardRefs.current.get(id)?.focus();
    setFocusedId(id);
  }, []);

  const onCardKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, colIndex: number, rowIndex: number) => {
      const colKey = COLUMNS[colIndex].key;
      const colItems = itemsByBucket.get(colKey) ?? [];
      const shown = expandedCols.has(colKey) ? colItems : colItems.slice(0, VISIBLE_ITEMS);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const next = shown[rowIndex + (e.key === "ArrowDown" ? 1 : -1)];
        if (!next) return;
        e.preventDefault();
        focusCard(next.id);
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const step = e.key === "ArrowRight" ? 1 : -1;
        // Walk past an empty column rather than stopping dead in it.
        for (let c = colIndex + step; c >= 0 && c < COLUMNS.length; c += step) {
          const other = itemsByBucket.get(COLUMNS[c].key) ?? [];
          const otherShown = expandedCols.has(COLUMNS[c].key)
            ? other
            : other.slice(0, VISIBLE_ITEMS);
          if (otherShown.length === 0) continue;
          e.preventDefault();
          focusCard((otherShown[rowIndex] ?? otherShown[otherShown.length - 1]).id);
          return;
        }
        return;
      }
      if (e.key === "Home" || e.key === "End") {
        if (visibleIds.length === 0) return;
        e.preventDefault();
        focusCard(e.key === "Home" ? visibleIds[0] : visibleIds[visibleIds.length - 1]);
      }
    },
    [itemsByBucket, expandedCols, visibleIds, focusCard],
  );

  /** The one card carrying tabIndex 0. Falls back to the first on the board, so
   *  the board is always reachable with a single Tab even before anything has
   *  been focused inside it. */
  const tabStopId = focusedId && visibleIds.includes(focusedId) ? focusedId : visibleIds[0];

  // A read that failed is not an empty state. "Nothing is committed" and "we
  // could not find out" are different facts and a person acts differently on each.
  //
  // TESTED BEFORE THE WAIT. The order has been right for three different
  // reasons now, which is worth recording because the reason keeps expiring and
  // the order keeps not needing to change.
  //
  // It first sat BELOW the skeleton, harmless while the skeleton asked
  // `roadmap.isLoading`, because v5's `isLoading` is `isPending && isFetching`
  // and an errored query is neither. It moved above when the wait became
  // `stillWaiting`, which at the time was `isPending || data === undefined` and
  // so was true for an errored query too: with the old order a failed read sat
  // under a skeleton for ever and this branch, carrying the retry, was
  // unreachable.
  //
  // `stillWaiting` STANDS DOWN ON A FAILED READ AS OF 2026-08-11, so that second
  // reason is spent and this is no longer load-bearing against it. It stays
  // first because it is the right order on its own terms: the strongest known
  // fact is stated first, and "we could not find out" outranks "still looking".
  // Do not move it back down on the grounds that it is now safe there.
  //
  // `ReadFailedLine` AND NOT `ReadFailed`, which is the bordered half of the
  // pair. plan.index mounts this board inside `<Region title="Now, Next and
  // Later">`, so the container is already drawn and two containers around one
  // sentence is a frame. It is also what the retired `Failed` drew: a bare
  // `.sp-empty` line, never a box.
  if (roadmap.isError) {
    return (
      <ReadFailedLine onRetry={() => void roadmap.refetch()}>
        {(roadmap.error as Error)?.message ?? "The roadmap did not load."}
      </ReadFailedLine>
    );
  }

  /**
   * AN ANSWER THAT HAS NOT ARRIVED IS NOT THE ANSWER "NONE".
   *
   * This asked `roadmap.isLoading`, which is `isPending && isFetching` in
   * react-query v5 and therefore FALSE for a query that is pending but not in
   * flight (paused with no network, or not yet started). In that state the
   * skeleton stood down and the branch below announced "No bets on the roadmap
   * yet." to a workspace whose bets had simply not arrived. `stillWaiting` is the
   * shared guard written for exactly this (src/lib/query-state.ts).
   *
   * IT NO LONGER COVERS THE ERROR PATH, and this comment said it did until
   * 2026-08-11. The helper used to answer "true" for ever after a cold failure,
   * which is what forced the <Failed> branch above to sit ahead of it. It now
   * stands down when a read has failed, so a failure falls through this wait on
   * its own. The branch above still comes first, for the reason written there.
   */
  if (stillWaiting(roadmap)) {
    return (
      <div data-mrd="" role="status" style={BOARD_SCROLLER}>
        <span className="sr-only">Reading the roadmap.</span>
        <div style={BOARD_TRACK} aria-hidden="true">
          {COLUMNS.map((c) => (
            <div key={c.key} className="min-w-0">
              {/* The stand-in for a column heading, then for its first card. The
                  card's radius follows `--mrd-r-card`, which is the stop a real
                  BetCard will sit on: a skeleton drawn on a different radius from
                  the thing it stands in for makes the swap visible. */}
              <div className="mb-mrd-5 h-2.5 w-[72px] rounded-mrd-xs bg-mrd-lift opacity-60" />
              <div className="min-h-[132px] rounded-mrd-card bg-mrd-sink opacity-50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /**
   * The commit ceremony belongs to BOTH exits below, not just the loaded board.
   * The empty branch opens it too, and a dialog mounted on only one of two
   * returns is a button that silently does nothing on the other.
   */
  const ceremony = ceremonyBet ? (
    <CommitCeremony
      bet={ceremonyBet}
      pending={commit.isPending}
      onCancel={() => setCeremonyBet(null)}
      onConfirm={(values) =>
        commit.mutate({ id: ceremonyBet.id, title: ceremonyBet.title, ...values })
      }
    />
  ) : null;

  /** What the last few acts on this board caused. Above everything, because a
   *  consequence a person has to scroll to find is one they do not read. */
  const receiptStack = receipts.length ? (
    <>
      {receipts.map((r) => (
        <Receipt key={r.key} verb={r.verb} consequence={r.consequence} failed={r.failed} />
      ))}
    </>
  ) : null;

  /**
   * THE UNPLACED DOOR, WRITTEN ONCE.
   *
   * There were two copies of this button, one in the empty branch and one above
   * the columns, in mutually exclusive branches and therefore never visible at
   * the same time. That is worse than a visible duplicate, not better: nobody
   * looking at the screen could ever see that the two had drifted, and they had
   * already drifted in emphasis (one was `variant="primary"`, the other was not,
   * for a reason that is real and is preserved below).
   *
   * `lead` is the only difference between the two sites and it is a genuine one:
   * on an empty board the sentence explains why the board is blank, and on a
   * drawn board it explains what is still missing from it.
   */
  const placeDoor = (variant: "primary" | undefined) =>
    unplacedDecided.length > 0 ? (
      /* `Action` and not `Approve`, even at `primary`. Approve is reserved for a
         click that RELEASES something held; this one opens the ceremony, which
         then asks for the promise. Nothing is blocked pending the press. */
      <Action variant={variant} onClick={() => handleMove(unplacedDecided[0], "now")}>
        Place it in Now
      </Action>
    ) : null;

  if (items.length === 0) {
    // RATCHET: a workspace that genuinely has nothing keeps the exact sentence
    // it has always had, instruction and all. What follows is a second branch
    // for the case that sentence was WRONG about, never a replacement for it.
    if (unplacedDecided.length === 0) {
      return (
        <>
          {receiptStack}
          {onlyUndeclared ? (
            // The filter's own empty state, which is a different fact from an
            // empty board and must not borrow its instruction: telling somebody
            // to go to Discover when they have simply filtered everything out
            // would send them away from the answer.
            <NothingYet
              action={<Action onClick={() => setOnlyUndeclared(false)}>Show every bet</Action>}
            >
              Every bet on the board names an outcome, so the filter has nothing to show.
            </NothingYet>
          ) : (
            <NothingYet>
              No bets on the roadmap yet. Commit a ranked opportunity from Discover.
            </NothingYet>
          )}
        </>
      );
    }
    // The bet the board would have drawn first if it could draw any of them.
    const top = unplacedDecided[0];
    const topTitle = stripAutoPrefix(top.title);
    return (
      <>
        {receiptStack}
        {/* The station's primary act, reachable from the surface that exists to
            perform it. It calls the SAME `handleMove(item, "now")` a card calls,
            so a promise declared from here and one declared from the board are
            one function and cannot drift. No competing primary is on screen in
            this state: plan.index's Gate reads its `undeclared` out of the
            BUCKETED bets, which is the empty set here, and TrackStart's primary
            mounts only once its own form is opened.

            ONE KNOWN LIMIT, STATED RATHER THAN FIXED. A successful commit from
            here unmounts this whole branch, and CommitCeremony overrides nothing
            about Radix's close behaviour, so focus returns to a trigger that no
            longer exists and falls to document.body. It is not this branch's
            invention: three other `<Empty action={<Button…>}>` callers open a
            dialog that then changes the branch out from under the trigger and
            behave identically (DecisionsPanel, DesignMemoryPanel and ProductsTab,
            all checked). The fix belongs where the idiom lives, either as an
            `onCloseAutoFocus` on the ceremony or as a focus target handed to
            Empty, and neither of those is this file. */}
        <NothingYet action={placeDoor("primary")}>
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
        </NothingYet>
        {ceremony}
      </>
    );
  }

  return (
    <>
      {receiptStack}

      {/* HOW THE BOARD IS ORDERED AND WHAT IT IS SHOWING, as a control rather
          than as a hardcoded constant nobody could see. A `Choices` radio group,
          not a tab strip: the station strip is the navigation on this page and
          this is a control on one list. The filter sits beside it as its own
          quiet toggle, because "which first" and "which at all" are different
          questions and a five-option control that mixed them would answer
          neither. */}
      <Actions
        trailing={
          /* THE PRESSED FACE IS THE VARIANT, NOT A CLASS ON TOP OF ONE. The
             retired sheet drew `[data-variant="ghost"][aria-pressed="true"]` as
             ink on lift with a line border, so the toggle showed it was on;
             Meridian's `Action` has no `aria-pressed` face, and adding
             `text-mrd-ink` after `variant="quiet"`'s `text-mrd-mute` would be two
             same-specificity utilities racing on stylesheet order. `default` IS
             that face, so the state is carried by picking the variant. */
          <Action
            variant={onlyUndeclared ? "default" : "quiet"}
            aria-pressed={onlyUndeclared}
            onClick={() => setOnlyUndeclared((v) => !v)}
            title="Show only the committed bets that carry no outcome and no measure"
          >
            {onlyUndeclared ? "Showing undeclared only" : "Only undeclared"}
          </Action>
        }
      >
        <span className="text-[13px] text-mrd-mute">Order by</span>
        {/* `mode="one"` is now DECLARED rather than defaulted. The retired
            `Choices` defaulted to it; Meridian's makes it required, because the
            ARIA differs between the two modes and a default was how a radio
            group shipped announcing three toggle buttons. */}
        <Choices<Sort>
          mode="one"
          label="How the board is ordered"
          value={sort}
          options={SORTS.map((s) => ({ id: s.id, label: s.label, title: s.title }))}
          onChange={setSort}
        />
      </Actions>

      {/* THE BETS THE COLUMNS STILL CANNOT DRAW, ONCE THE BOARD CAN DRAW SOME.
          Placing one bet does not place the others, so without this line the
          first press of the empty state's button would carry the board out of
          the branch above and take the remaining bets off the page with it: the
          door this surface just opened would shut after one press, and a count
          the user had just been shown would silently stop being shown.

          Deliberately NOT variant="primary". Here the columns are not empty, so
          plan.index's Gate can fire, because it reads `undeclared` out of the
          BUCKETED bets, and that Gate owns the one primary act on this station;
          Actions' own contract is one primary among them and only one. To be
          exact about which bets can make it fire, because the looser version of
          this sentence read as though this button could: never one placed from
          HERE. CommitCeremony will not confirm until both fields are filled
          (`canConfirm`), so this path always writes an outcome. It is the lenient
          drag (`updateRoadmapItem`) and the bulk bar that can leave a placed bet
          carrying no promise, and the bulk bar now says so. */}
      {unplacedDecided.length > 0 && (
        <Line
          label={
            <>
              <Num>{unplacedDecided.length}</Num>{" "}
              {unplacedDecided.length === 1 ? "committed bet is" : "committed bets are"} in no lane
            </>
          }
          sub={`Highest-ranked: ${stripAutoPrefix(unplacedDecided[0].title)}`}
        >
          {placeDoor(undefined)}
        </Line>
      )}

      {/* THE SELECTION BAR, IN THE LIST'S OWN HEADER SLOT. It replaces a
          hand-rolled `Actions` row that carried three lane buttons and a Clear,
          and it brings three things that row never had: a select-all over
          everything on screen, Escape to leave the mode, and range-select from a
          shift-click, all of which arrive with `useSelection` rather than being
          written here for a ninth time.

          THE SENTENCE UNDER IT IS THE CEREMONY BYPASS, NAMED. See `bulkMove`.

          IT IS `BulkBar`, NOT `SelectionActions`. Meridian exports both and only
          one of them is this: `SelectionActions` takes a live DOM `Range` and a
          container ref and draws highlight panels over a passage of prose, so
          pointed at a set of row ids it renders nothing at all. Same contract as
          the retired bar it replaces, plus a height that matches Meridian's 44px
          row floor rather than the retired sheet's 38px. */}
      <BulkBar selection={selection} total={visibleIds.length} noun="bet">
        {COLUMNS.map((col) => (
          <Action
            key={col.key}
            busy={bulkMove.isPending}
            title={
              col.key === "now" && undeclaredSelected > 0
                ? `${undeclaredSelected} of these carry no outcome. A bulk move places the lane and does not ask for one.`
                : undefined
            }
            onClick={() =>
              bulkMove.mutate({
                ids: [...selection.ids],
                bucket: col.key,
                undeclared: undeclaredSelected,
              })
            }
          >
            {col.label}
          </Action>
        ))}
      </BulkBar>
      {selection.count > 0 && undeclaredSelected > 0 ? (
        <p data-mrd="" className="mt-mrd-4 mb-0 text-[13px] text-mrd-mute">
          <Num>{undeclaredSelected}</Num> of the{" "}
          {selection.count === 1 ? "bet you picked carries" : "bets you picked carry"} no outcome. A
          bulk move sets the lane and does not ask for one, so they stay tasks rather than promises
          until somebody declares one. Moving a single bet into Now still asks.
        </p>
      ) : null}

      <div style={BOARD_SCROLLER}>
        <div style={BOARD_TRACK}>
          {COLUMNS.map((col, colIndex) => {
            const colItems = itemsByBucket.get(col.key) ?? [];
            const expanded = expandedCols.has(col.key);
            const shownItems = expanded ? colItems : colItems.slice(0, VISIBLE_ITEMS);
            return (
              <div key={col.key} className="min-w-0">
                {/* THE RULE UNDER THE COLUMN HEADING IS GONE, and it is not an
                    oversight. It was `1px solid var(--sp-line-soft)`. Founder
                    ruling 2026-08-18, made while reviewing exactly this class of
                    thing: a retired system's hairlines and section rules are not
                    the baseline, the baseline is Meridian, and nothing of that
                    kind comes back "now or in the future". Rule 1 of the ratchet
                    protects information and composition; a divider is neither. So
                    the separation is space, which is what Meridian uses
                    everywhere else, and the heading's own padding-bottom becomes
                    part of the gap rather than the gutter for a line. */}
                <div className="mb-mrd-5 flex items-baseline gap-mrd-4">
                  <span className="text-[12.5px] font-semibold text-mrd-ink">{col.label}</span>
                  <Num>{colItems.length}</Num>
                </div>
                <div className="flex flex-col gap-mrd-5">
                  {shownItems.map((item, rowIndex) => (
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
                      selected={selection.has(item.id)}
                      onToggleSelect={(_on, e) => selection.toggle(item.id, e)}
                      onMoveTo={(bucket) => handleMove(item, bucket)}
                      onEditOutcome={(values) =>
                        editOutcome.mutate({
                          id: item.id,
                          bucket: col.key,
                          title: stripAutoPrefix(item.title),
                          ...values,
                        })
                      }
                      editPending={editOutcome.isPending && editOutcome.variables?.id === item.id}
                      canRewind={item.hasSnapshot}
                      onRewind={() =>
                        rewind.mutate({
                          opportunity_id: item.id,
                          title: stripAutoPrefix(item.title),
                        })
                      }
                      rewindPending={
                        rewind.isPending && rewind.variables?.opportunity_id === item.id
                      }
                      tabIndex={item.id === tabStopId ? 0 : -1}
                      onCardKeyDown={(e) => onCardKeyDown(e, colIndex, rowIndex)}
                      onFocusCard={() => setFocusedId(item.id)}
                      registerRef={(el) => {
                        if (el) cardRefs.current.set(item.id, el);
                        else cardRefs.current.delete(item.id);
                      }}
                    />
                  ))}
                  {colItems.length === 0 ? (
                    <span className="py-mrd-4 text-[13px] text-mrd-mute">
                      {onlyUndeclared ? "Every bet here names an outcome." : "Nothing here."}
                    </span>
                  ) : null}
                  {colItems.length > VISIBLE_ITEMS ? (
                    <Action variant="quiet" onClick={() => toggleExpanded(col.key)}>
                      {expanded ? "Show fewer" : `Show ${colItems.length - VISIBLE_ITEMS} more`}
                    </Action>
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
