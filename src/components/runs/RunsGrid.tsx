import * as React from "react";
import type { StepProgress } from "@/components/runs/step-progress";
import { skippedClause } from "@/components/runs/step-progress";

import {
  RecordsTable,
  RecordStatus,
  RecordTag,
  type RecordColumn,
} from "@/components/meridian/RecordsTable";
import { FilterTable, type Facet } from "@/components/meridian/FilterTable";
import { Search } from "@/components/meridian/Search";
import { Actor, RunMark, type RunMarkState } from "./run-parts";
import { Figure } from "@/components/meridian/surface-parts";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  completionEvidence,
  COMPLETION_EVIDENCE_LABEL,
  COMPLETION_EVIDENCE_REASON,
  type CompletionEvidence,
} from "@/lib/build/verification";
import type { StudioSessionListItem } from "@/lib/studio.functions";
import { actorName, actorSlug, actorVerb, ago, runState } from "./run-state";
import { RowAction, RowActions } from "./RowActions";

/*
 * THE RUN LIST, as a grid you can narrow, search and sort.
 *
 * ── THE HOLE THIS FILLS ─────────────────────────────────────────────────
 * This is a workspace-wide list. It had a cap, and it had nothing else: no
 * search, no filter, no sort, and one control that read "All 43" without ever
 * saying how many of them were being withheld. Past about ten rows the reader
 * is scrolling and hoping, which is exactly the state the 2026-08-14 surface
 * audit found on three surfaces at once.
 *
 * ── FOUR FACTS, NOT TWO ─────────────────────────────────────────────────
 * The grid underneath (`RecordsTable`) separates four things the old list
 * collapsed into two, and the separation is the reason it is used rather than
 * a hand-rolled table:
 *
 *   nothing exists         an empty workspace. The route answers this one
 *                          ABOVE this component, because an empty workspace
 *                          also needs a door and a grid cannot carry one.
 *   a filter hid it        the rows exist and the chip you pressed is holding
 *                          them back. `FilterTable` passes `isFiltered` and
 *                          `totalBeforeFilter` down, which is the only way the
 *                          grid can tell this apart from the line above it.
 *   the read failed        also answered above, in the surface's own voice.
 *   capped                 the cap prints both real numbers and offers the way
 *                          past it. Silent truncation is a failure this
 *                          product has already shipped once.
 *
 * ── WHY THE CHIPS COME AND GO ───────────────────────────────────────────
 * Chips are the answer to a list you cannot scan. Over three runs there is
 * nothing to scan, every chip would read 0 or 1, and the chip row would be
 * furniture standing over the content it is meant to serve. Under that count
 * the bare grid renders and nothing pretends to narrow anything. A control
 * that cannot change what you are looking at is the small lie that teaches a
 * reader to stop trusting the other controls.
 *
 * ── WHY SEARCH IS SUMMONED RATHER THAN STANDING OPEN ────────────────────
 * `Search` is a whole panel: a field AND its own list of matches. Left open
 * over the grid it would render the same runs twice, a few pixels apart, which
 * is the defect this surface already removed once when it killed two of its
 * three renderings of one list. So it is asked for, from the region's own
 * quiet action, and only offered when there are more runs than the grid shows
 * at once. A finder over a list you can already see whole is furniture.
 */

/** A row's second line, one separator, one rhythm.
 *
 *  It moved here with the rows it formats. Assembling it by hand put a double
 *  space and a stray middot into the first draft of every branch, which is what
 *  a list of facts joined by string concatenation always does. */
function Meta({ parts }: { parts: React.ReactNode[] }) {
  const kept = parts.filter(Boolean);
  return (
    <>
      {kept.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 ? " · " : null}
          {part}
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * The completion-evidence flag, which used to be drawn in amber.
 *
 * `.sp-warn` resolved to a colour this system does not have a general licence
 * for. Founder ruling 2026-08-14 removed a warm gold as the PRIMARY ACCENT, and
 * meridian.css revised that on 2026-08-15 to admit amber for exactly one
 * meaning: stopped, and NOT on you. That is not this. An unverified Done claim
 * is a person having to go and look, which is orchid, and the three states map
 * onto meanings the product already has:
 *
 *   verified            an OUTCOME, and a checkable one: a merged pull request
 *                       with a real url behind it.
 *   needs verification  a person has to go and look before the Done claim can
 *                       be believed, and until one does, this does not move.
 *                       That is the same fact the accent already carries.
 *   no evidence yet     a structural limit, not an alarm and not a call to
 *                       act. It stays quiet, exactly as the run's own tone
 *                       table (`COMPLETION_EVIDENCE_TONE`) already said.
 *
 * The reason stays on the title, where it already was: the flag says what, and
 * hovering says why.
 */
const EVIDENCE_TONE: Record<CompletionEvidence, "pass" | "you" | "quiet"> = {
  verified: "pass",
  "needs-verification": "you",
  "cannot-do-yet": "quiet",
};

/** Sorting groups like with like, and puts what needs a person at the top. */
const STATE_RANK: Record<ReturnType<typeof runState>, number> = {
  gate: 0,
  working: 1,
  queued: 2,
  stopped: 3,
  done: 4,
};

export type RunsGridProps = {
  rows: StudioSessionListItem[];
  /** How far through the plan each run is, by mission id. */
  progressById: Map<string, StepProgress>;
  /**
   * The one run the Gate above is showing, and the only mark on this surface
   * allowed to move. SYSTEM.md allows exactly one, and this list used to give
   * every waiting run the animated state, so a workspace with a dozen open calls
   * blinked a dozen marks in unison and spent the whole restraint budget. The
   * rest wear the same orchid at rest (`--mrd-you-dim`), which is what the rule
   * prescribes for everything queued behind the one asking.
   *
   * It was called `blinkingId`. Renamed because the name described the drawing
   * and the drawing is now two facts at once, the full accent AND the animation;
   * `asking` is the thing that is actually true about this run and stays true if
   * the motion is ever taken away.
   */
  askingId: string | null;
  /** Manage reveals archived runs AND the two acts on them. One mode. */
  managing: boolean;
  /** The finder is open. Owned by the surface, because its control is up in
   *  the region head where a reader expects a region's controls to be. */
  finding: boolean;
  onOpen: (missionId: string) => void;
  onArchive: (row: StudioSessionListItem) => void;
  onDelete: (row: StudioSessionListItem) => void;
  archivePending: boolean;
  /** The run currently being deleted, so only its own control says so. */
  deletingId: string | null;
  /** Rows shown before the cap notice. The notice prints both real numbers. */
  maxRows: number;
};

/** Below this there is nothing to narrow, so nothing offers to. */
const CHIPS_FROM = 4;

export function RunsGrid({
  rows,
  progressById,
  askingId,
  managing,
  finding,
  onOpen,
  onArchive,
  onDelete,
  archivePending,
  deletingId,
  maxRows,
}: RunsGridProps) {
  const box = React.useRef<HTMLDivElement>(null);

  /* The finder opens with the caret already in it. Asking for a search and
   * then having to click the field is the second half of the same gesture,
   * and it is the half people give up on. */
  React.useEffect(() => {
    if (!finding) return;
    box.current?.querySelector("input")?.focus();
  }, [finding]);

  const columns = React.useMemo<RecordColumn<StudioSessionListItem>[]>(() => {
    const base: RecordColumn<StudioSessionListItem>[] = [
      {
        key: "run",
        header: "Run",
        width: "34ch",
        sortValue: (s) => stripAutoPrefix(s.title).toLowerCase(),
        cell: (s) => (
          /* The row is still a door, and it is a door in Manage mode too.
             It used to stop being one there, for a stated reason that no
             longer holds: on a list row the two Manage controls could only
             sit INSIDE the clickable region, and a button inside a button is
             invalid. In a grid they have a cell of their own, so the title
             keeps its address. */
          <button
            type="button"
            data-mrd=""
            onClick={() => onOpen(s.mission_id)}
            // `mrd-focus-inset` rather than an outline colour of its own: the
            // grid clips, so an outset ring on a cell is sheared off and reads
            // as a broken half-drawn edge. The COLOUR comes from `data-mrd`,
            // which is the whole mechanism meridian.css describes, so this row
            // cannot drift from the app's one focus token.
            className="mrd-focus-inset flex w-full min-w-0 items-center gap-2 rounded-mrd-xs text-left transition-colors hover:text-mrd-ink"
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            <RunMark
              slug={actorSlug(s.kind)}
              state={markState(s)}
              name={s.title}
              // Exactly one moving mark on the surface. See `askingId`.
              asking={s.mission_id === askingId}
            />
            <span className="min-w-0 truncate">{stripAutoPrefix(s.title)}</span>
            {/* Archived is a property of the record, not of what is
                happening, so it sits with the name rather than at the tail of
                the fact line. Colourless by design: it is a category, and the
                accent belongs to status.

                THE LESSON THIS CARRIES FORWARD, from the list this grid
                replaced. "Archived" was pushed onto the end of the fact line,
                and for a while the two Manage controls were pushed there with
                it, so an archived row read "Engineer finished · 3 files ·
                Verified · Archived · Restore · Delete": three states and two
                commands in one rhythm, with the one irreversible act on this
                surface a middot away from a file count. Fixed 2026-08-11 by
                moving the commands into the row's own action slot. A grid
                finishes the job: the commands have a COLUMN, and the category
                sits with the name it describes. */}
            {s.archived ? <RecordTag label="Archived" /> : null}
          </button>
        ),
      },
      {
        key: "doing",
        header: "What is happening",
        // Not the printed string. Sorting the words would put "Engineer
        // finished" above "Waiting on you" and call it order; the rank groups
        // the states and leads with the ones that need a person.
        sortValue: (s) => STATE_RANK[runState(s)],
        cell: (s) => <Meta parts={doing(s, progressById)} />,
      },
      {
        key: "updated",
        header: "Updated",
        numeric: true,
        width: "11ch",
        // Epoch, never the printed relative time: "9d" sorts above "2h" as a
        // string and the column looks like it works.
        sortValue: (s) => (s.updated_at ? new Date(s.updated_at).getTime() : 0),
        cell: (s) => ago(s.updated_at) ?? "",
      },
    ];

    if (!managing) return base;

    return [
      ...base,
      {
        key: "manage",
        header: "Manage",
        width: "20ch",
        cell: (s) => {
          const title = stripAutoPrefix(s.title);
          const deleting = deletingId === s.mission_id;
          return (
            <RowActions
              destructive={
                <RowAction
                  destructive
                  disabled={deleting}
                  // The row's own name, because forty rows of "Delete" are
                  // forty identical accessible names.
                  aria-label={`Delete the run ${title}`}
                  onClick={() => onDelete(s)}
                >
                  {deleting ? "Deleting" : "Delete"}
                </RowAction>
              }
            >
              <RowAction
                disabled={archivePending}
                aria-label={`${s.archived ? "Restore" : "Archive"} the run ${title}`}
                onClick={() => onArchive(s)}
              >
                {s.archived ? "Restore" : "Archive"}
              </RowAction>
            </RowActions>
          );
        },
      },
    ];
  }, [managing, progressById, askingId, archivePending, deletingId, onOpen, onArchive, onDelete]);

  /*
   * The facet set is FIXED for a given mode rather than derived from what is
   * on screen. A chip that disappears when its last row changes state takes
   * the reader's current selection with it, and the counts are what tell you
   * a chip is worth pressing, including when the count is zero.
   */
  const facets = React.useMemo<Facet<StudioSessionListItem>[]>(() => {
    const byState: Facet<StudioSessionListItem>[] = [
      { key: "gate", label: "Waiting on you", match: (s) => runState(s) === "gate" },
      { key: "working", label: "Building", match: (s) => runState(s) === "working" },
      { key: "queued", label: "Queued", match: (s) => runState(s) === "queued" },
      { key: "stopped", label: "Stopped", match: (s) => runState(s) === "stopped" },
      { key: "done", label: "Done", match: (s) => runState(s) === "done" },
    ];
    if (!managing) return byState;
    return [...byState, { key: "archived", label: "Archived", match: (s) => s.archived }];
  }, [managing]);

  /* "Most recently updated", not "newest". `listStudioSessions` sorts on
   * `updated_at` descending (studio.functions.ts), and a caption that said
   * "newest first" would be describing a different column. */
  const caption = "Every run on the record, most recently updated first";
  const emptyTitle = "No runs on the record yet";

  return (
    <div ref={box} className="flex w-full flex-col gap-mrd-4">
      {finding ? (
        <Search
          items={rows}
          itemKey={(s) => s.mission_id}
          itemText={(s) => stripAutoPrefix(s.title)}
          onSelect={(s) => onOpen(s.mission_id)}
          label="Find a run by name"
          placeholder="Find a run"
          maxResults={5}
          emptyTitle={emptyTitle}
          noun="run"
        />
      ) : null}

      {rows.length >= CHIPS_FROM ? (
        <FilterTable
          rows={rows}
          columns={columns}
          facets={facets}
          rowKey={(s) => s.mission_id}
          caption={caption}
          allLabel="All"
          emptyTitle={emptyTitle}
          maxRows={maxRows}
        />
      ) : (
        <RecordsTable
          rows={rows}
          columns={columns}
          rowKey={(s) => s.mission_id}
          caption={caption}
          emptyTitle={emptyTitle}
          maxRows={maxRows}
        />
      )}
    </div>
  );
}

/**
 * The mark carries the state, and the mark owns the colour.
 *
 * It used to translate through `MARK_STATE` into the shell's seven-value
 * `MarkState`, which encoded the AGENT'S LOOP STAGE as the hue and left the run
 * state to opacity plus an orbiting ring. Meridian's law is the opposite
 * assignment: identity is shape, status is hue. So the `RunState` goes straight
 * through and `RunMark` holds the mapping.
 *
 * That also removes the one lossy step in it. `queued` used to become "quiet",
 * which is a 42% neutral, so the commonest state in the workspace rendered
 * fainter than the label beside it and read as a plain count. It is amber now:
 * stopped, and waiting on a condition rather than on you.
 */
function markState(s: StudioSessionListItem): RunMarkState {
  return runState(s);
}

/**
 * ONE line, carrying a DIFFERENT fact from the title: who is on it, what they
 * are doing, how far through the plan they are. Unchanged in what it says; it
 * simply says it in a cell now instead of under the name.
 */
function doing(
  s: StudioSessionListItem,
  progressById: Map<string, StepProgress>,
): React.ReactNode[] {
  const state = runState(s);
  const files = s.changeset?.file_count ?? 0;
  const p = progressById.get(s.mission_id);
  /* The skipped clause, for the reason in step-progress.ts: STEP_DONE counts a
     skipped step as done, and better than one in four of them is. */
  const skipped = skippedClause(p);
  const steps =
    p && p.total > 0 ? (
      <>
        step <Figure>{p.done}</Figure> of <Figure>{p.total}</Figure>
        {skipped ? `, ${skipped}` : ""}
      </>
    ) : null;
  const evidence = completionEvidence({
    claimsDone: state === "done",
    kind: s.kind,
    changesetStatus: s.changeset?.status ?? null,
    prUrl: s.changeset?.pr_url ?? null,
  });

  if (state === "working") {
    return [
      <>
        <Actor>{actorName(s.kind)}</Actor> is {actorVerb(s.kind)}
      </>,
      steps,
    ];
  }
  if (state === "gate") {
    return [
      "Waiting on you",
      s.pending_approvals > 0 ? (
        <>
          <Figure>{s.pending_approvals}</Figure> {s.pending_approvals === 1 ? "call" : "calls"}
        </>
      ) : null,
    ];
  }
  if (state === "stopped") return [steps ? <>Stopped at {steps}</> : "Stopped"];
  if (state === "queued") return [`Queued for ${actorName(s.kind).toLowerCase()}`];

  return [
    <>
      <Actor>{actorName(s.kind)}</Actor> finished
    </>,
    files > 0 ? (
      <>
        <Figure>{files}</Figure> {files === 1 ? "file" : "files"}
      </>
    ) : null,
    // The one element that calls out a Done claim with nothing behind it. Its
    // reason is the tooltip.
    evidence ? (
      <span title={COMPLETION_EVIDENCE_REASON[evidence]}>
        <RecordStatus tone={EVIDENCE_TONE[evidence]} label={COMPLETION_EVIDENCE_LABEL[evidence]} />
      </span>
    ) : null,
  ];
}

export default RunsGrid;
