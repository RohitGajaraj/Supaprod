/**
 * EVERY DRAWING IN THE WORKSPACE, AS SOMETHING A PERSON CAN ACTUALLY READ.
 *
 * WHY THIS EXISTS. The Design station rendered every drawing it could read as a
 * flat list of two-line rows: uncapped, unsorted past the server's own ranking,
 * with no way to narrow it and no way to find one by name. Decide, Plan, Ship
 * and Build all cap. Design did not, and it is the surface with the most rows:
 * `listDesignWork` returns up to forty specs and production carries eighty one,
 * so the dense case here is live rather than hypothetical.
 *
 * TWO CONTROLS, BECAUSE THERE ARE TWO QUESTIONS. A filter answers "show me the
 * ones like this" and a search answers "show me the one I already have in
 * mind". They are not the same act and neither substitutes for the other, so
 * the finder sits above the grid and is drawn only once the list is longer than
 * a person can scan, and the chips sit on the grid where the counts are.
 *
 * WHAT THE GRID IS ALLOWED TO SAY, and it is the reason it is worth the change:
 * a list can be four different things and this one used to be able to say two.
 * Nothing exists, a chip excluded everything, the read failed, and the grid is
 * capped are four separate facts, and the last two are the ones this station
 * has been getting wrong. The cap now prints both real numbers and offers the
 * way past it, which is the one thing a silent slice can never do.
 *
 * COLOUR. One meaning only: orchid where a drawn screen is waiting on a
 * person's call, because that is a decision that unblocks a dispatch to Build.
 * Everything else on the row is a neutral, including the settled verdicts: a
 * gate that was approved or sent back is a fact about the past and painting it
 * would spend the accent on inventory. The grid survives greyscale, because
 * every state carries a word as well as a dot.
 *
 * WHAT IS DELIBERATELY NOT HERE. No indicator for a redraw in flight. The
 * station already carries three of those and they are all bound to the same
 * mutation state in this tab, so a fourth on the row would be a louder copy of
 * a fact the reader has already been told twice, which is exactly what
 * surface-discipline asks before a second live indicator is allowed.
 */

import * as React from "react";

import { FilterTable, type Facet } from "@/components/meridian/FilterTable";
import {
  RecordStatus,
  RecordsTable,
  type RecordColumn,
  type RecordTone,
} from "@/components/meridian/RecordsTable";
import { Search } from "@/components/meridian/Search";
import { AgentMark } from "@/components/meridian/marks";
import type { DesignFidelity, DesignWorkRow } from "@/lib/design-scaffold.functions";
import { FIDELITY_WORD, GATE_WORD } from "./vocabulary";

/** Sketch, wireframe, mockup, in the order they answer bigger questions. A
 *  drawing whose fidelity was never recorded sorts after all three and an
 *  undrawn spec after that, so sorting this column reads as a spectrum rather
 *  than as an alphabet. */
const FIDELITY_RANK: Record<DesignFidelity, number> = { sketch: 1, wireframe: 2, mockup: 3 };

/** Rows on screen before the grid states its cap and offers the rest. Twelve
 *  because that is about where a reader stops scanning and starts scrolling,
 *  and the count of what is withheld is on screen either way. */
const ROWS_ON_SCREEN = 12;

/** Past this many rows a person who knows the name is faster typing it than
 *  looking for it, so the finder appears. Below it the grid IS the finder and a
 *  second list would be furniture. */
const FINDER_FLOOR = 10;

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

/**
 * Plain-words relative time. Mono and alignment are the column's job, not this
 * function's. Moved here from the route with the rows it describes.
 */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** The one moment on the row, whichever kind of change it was. A spec sent past
 *  Design has no drawing and no verdict, and its skip is the only thing that
 *  ever happened to it here, so the route's date is the fallback rather than an
 *  empty cell. */
function changedAt(r: DesignWorkRow): string | null {
  return r.drawing?.drawnAt ?? r.gateDecidedAt ?? r.route?.at ?? null;
}

function stamp(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * WHERE ONE SPEC STANDS AT THIS STATION, in one word set, used by the column,
 * the chips and the finder so the three can never disagree.
 *
 * THE GATE WORD IS ONLY A FACT WHILE THERE IS A GATE. `prds.design_gate_status`
 * defaults to 'pending' for every spec ever written, so reading it as "waiting
 * on you" with the workspace's gate switched off is the surface inventing a
 * queue out of a column default. With the gate off a drawn spec simply reads as
 * drawn.
 *
 * A SKIP IS A DECISION AND SAYS SO. Without that branch an undrawn spec that
 * somebody deliberately sent past Design is indistinguishable from one nobody
 * has got to yet, and those are opposite facts: the first is settled and the
 * second is waiting on the crew.
 */
function standing(r: DesignWorkRow, gateOn: boolean): { tone: RecordTone; label: string } {
  if (!r.drawing) {
    if (r.route?.route === "direct") return { tone: "quiet", label: "Skipped on purpose" };
    /* A settled gate over an empty frame. Worth its own words rather than the
       bare "Nothing drawn", because this spec can already reach Build and there
       is nothing here for anyone to look at, which is the opposite of a queue. */
    if (gateOn && r.gateStatus === "approved") {
      return { tone: "quiet", label: "Approved, nothing drawn" };
    }
    if (r.route?.route === "design") return { tone: "quiet", label: "Handed here to be drawn" };
    return { tone: "quiet", label: "Nothing drawn" };
  }
  if (!gateOn) return { tone: "quiet", label: "Drawn" };
  if (r.gateStatus === "pending") return { tone: "you", label: "Your call" };
  return { tone: "quiet", label: GATE_WORD[r.gateStatus] };
}

/** Judgeable first, then drawn, then undrawn. The same ranking the server sorts
 *  by, so sorting this column reproduces the order the list arrives in rather
 *  than inventing a second opinion about what matters. */
function rank(r: DesignWorkRow, gateOn: boolean): number {
  if (r.drawing && gateOn && r.gateStatus === "pending") return 0;
  if (r.drawing) return 1;
  return 2;
}

/**
 * The name, and the control that opens it.
 *
 * THE WHOLE CELL IS THE TARGET. A grid row cannot be one button, because the
 * cells scroll under a pinned first column and a button spanning that is a
 * button in two places at once. So the name fills its cell and the cell is the
 * click, which keeps a target a person can hit without aiming.
 *
 * WHICH ONE IS OPEN IS DRAWN WITH STRUCTURE, never with the accent: a row you
 * are looking at is not a row asking you for anything. A bar, a step up the ink
 * ramp and `aria-current` say it three ways, one of which survives greyscale
 * and one of which is spoken.
 */
function NameCell({
  row,
  mark,
  focused,
  onPick,
}: {
  row: DesignWorkRow;
  mark: React.ReactNode;
  focused: boolean;
  onPick: (prdId: string) => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden
        className="h-4 w-0.5 shrink-0 rounded-full"
        style={{ background: focused ? "var(--mrd-edge-focus)" : "transparent" }}
      />
      {mark}
      <button
        type="button"
        onClick={() => onPick(row.prdId)}
        aria-current={focused ? "true" : undefined}
        title={row.title}
        className={`min-w-0 flex-1 truncate rounded-mrd-xs py-0.5 text-left transition-colors ${FOCUS} ${
          focused ? "font-medium text-mrd-ink" : "font-normal text-mrd-body hover:text-mrd-ink"
        }`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {row.title}
      </button>
    </span>
  );
}

export function DrawingsTable({
  rows,
  gateOn,
  focusId,
  drawnBy,
  onPick,
}: {
  rows: DesignWorkRow[];
  /** The workspace's design gate. Off means there is no queue here to be in. */
  gateOn: boolean;
  /** The spec the panel below is open on. */
  focusId: string | null;
  /** The agent that draws, named by the station's own cast entry and passed in
   *  rather than spelled again here: a slug written twice is a slug that drifts
   *  and then marks a row with an agent that does not exist. */
  drawnBy: string;
  onPick: (prdId: string) => void;
}) {
  const columns = React.useMemo<RecordColumn<DesignWorkRow>[]>(
    () => [
      {
        key: "screen",
        header: "Screen",
        width: "30ch",
        sortValue: (r) => r.title.toLowerCase(),
        cell: (r) => (
          /*
           * THE MARK SAYS WHO DREW IT. IT DOES NOT SAY WHAT IT IS WAITING FOR.
           *
           * This passed `state="gate"` or `state="waiting"` for a spec with a
           * pending call. Both resolve, through `.sp-mark[data-state=...]`, to
           * `--sp-gate`: ember, #ff6b2c on dark and #c2500f on paper. Orange.
           * The colour ruling of 2026-08-14 removed that hue from the system
           * outright, and this row was still painting it.
           *
           * It was also the same fact twice. Eight characters to the right, the
           * standing cell renders `RecordStatus tone="you"` in orchid for that
           * same pending call, so a row waiting on a person carried an orange
           * dot and a magenta dot side by side, both meaning the one thing.
           * This file's header already ruled it: everything on the row that is
           * not the standing orchid is a neutral.
           *
           * The blink went with it, and the header's own surface-discipline
           * paragraph is why. The grid sorts judgeable rows to the top and the
           * standing cell names the state in the accent, so a blink is a third
           * telling of a fact the reader has been given twice, which is exactly
           * what that rule refuses. Attention is spent, not decorated.
           */
          <NameCell
            row={r}
            focused={focusId === r.prdId}
            onPick={onPick}
            mark={<AgentMark slug={drawnBy} state="quiet" />}
          />
        ),
      },
      {
        key: "standing",
        header: "Where it stands",
        width: "26ch",
        sortValue: (r) => rank(r, gateOn),
        cell: (r) => {
          const s = standing(r, gateOn);
          return <RecordStatus tone={s.tone} label={s.label} />;
        },
      },
      {
        key: "fidelity",
        header: "How finished",
        width: "16ch",
        sortValue: (r) =>
          !r.drawing ? 5 : r.drawing.fidelity ? FIDELITY_RANK[r.drawing.fidelity] : 4,
        cell: (r) =>
          !r.drawing ? "" : r.drawing.fidelity ? FIDELITY_WORD[r.drawing.fidelity] : "Not recorded",
      },
      {
        key: "screens",
        header: "Screens",
        width: "11ch",
        numeric: true,
        sortValue: (r) => r.drawing?.screenCount ?? -1,
        cell: (r) => (r.drawing ? r.drawing.screenCount : ""),
      },
      {
        /* A zero is not drawn. Nothing came into force after this drawing, and
           printing "0" under a heading about being behind reads as a finding
           rather than as the absence of one. */
        key: "behind",
        header: "Behind your rules",
        width: "18ch",
        numeric: true,
        sortValue: (r) => r.rulesSince,
        cell: (r) => (r.rulesSince > 0 ? r.rulesSince : ""),
      },
      {
        key: "links",
        header: "Shared links",
        width: "14ch",
        numeric: true,
        sortValue: (r) => r.shareCount,
        cell: (r) => (r.shareCount > 0 ? r.shareCount : ""),
      },
      {
        /* The absolute date sits in the title and in the panel below, where a
           skip states the day it was recorded. In a row of forty, relative time
           is the fact a person compares; the exact day is the fact they open. */
        key: "when",
        header: "Last change",
        width: "13ch",
        numeric: true,
        sortValue: (r) => {
          const at = changedAt(r);
          return at ? new Date(at).getTime() : 0;
        },
        cell: (r) => {
          const at = changedAt(r);
          return <span title={stamp(at)}>{ago(at) ?? ""}</span>;
        },
      },
    ],
    [gateOn, focusId, drawnBy, onPick],
  );

  /**
   * The chip set is FIXED for a given gate setting rather than trimmed to the
   * ones that match something. A chip reading zero is a real answer about the
   * workspace, and a set that grows and shrinks under a write can drop the chip
   * that is currently active, which leaves the grid narrowed by a filter that
   * is no longer on screen.
   */
  const facets = React.useMemo<Facet<DesignWorkRow>[]>(() => {
    const list: Facet<DesignWorkRow>[] = [];
    if (gateOn) {
      list.push({
        key: "yours",
        label: "Your call",
        match: (r) => Boolean(r.drawing) && r.gateStatus === "pending",
      });
    }
    list.push({ key: "drawn", label: "Drawn", match: (r) => Boolean(r.drawing) });
    list.push({ key: "undrawn", label: "Nothing drawn", match: (r) => !r.drawing });
    list.push({ key: "behind", label: "Behind your rules", match: (r) => r.rulesSince > 0 });
    list.push({
      key: "skipped",
      label: "Skipped on purpose",
      match: (r) => !r.drawing && r.route?.route === "direct",
    });
    return list;
  }, [gateOn]);

  const caption = "The screens the crew drew, and where each one stands";
  const grid =
    rows.length > 1 ? (
      <FilterTable
        rows={rows}
        columns={columns}
        facets={facets}
        rowKey={(r) => r.prdId}
        caption={caption}
        allLabel="Everything"
        maxRows={ROWS_ON_SCREEN}
        emptyTitle="Nothing to look at"
        emptyDetail="Every drawing in this workspace lands here."
      />
    ) : (
      /* ONE ROW NEEDS NO NARROWING. The chips would read "Everything 1" over a
         single line, which is a control that cannot do anything. Same grid
         underneath, so nothing about the row changes with the second one. */
      <RecordsTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.prdId}
        caption={caption}
        emptyTitle="Nothing to look at"
        emptyDetail="Every drawing in this workspace lands here."
      />
    );

  return (
    <>
      {rows.length > FINDER_FLOOR ? (
        <div className="mb-mrd-5">
          <Search
            items={rows}
            itemKey={(r) => r.prdId}
            itemText={(r) => r.title}
            onSelect={(r) => onPick(r.prdId)}
            label="Find a screen by the name of its spec"
            placeholder="Find a screen"
            maxResults={6}
            emptyTitle="Nothing to search yet"
            noun="spec"
          />
        </div>
      ) : null}
      {grid}
    </>
  );
}

export default DrawingsTable;
