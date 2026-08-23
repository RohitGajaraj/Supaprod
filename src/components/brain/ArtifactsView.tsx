/**
 * Artifacts, as a view inside Brain. Redesigned, not re-skinned
 * (docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md).
 *
 * WHY IT LIVES HERE AND NOT ON A DOOR OF ITS OWN (founder ruling 2026-07-30).
 * A reachability audit found this surface orphaned: the only inbound link left
 * was MissionShell's Artifacts door, and MissionShell is the retired Mission
 * Control chrome that AppFrame replaced, so nothing live reached it. The fix is
 * not a sixth rail item. It is this:
 *
 *   Brain holds what we DECIDED and LEARNED. Artifacts holds what we MADE:
 *   specs, prototypes, docs. Two halves of one record, and only one of them
 *   had a door. "Where is that spec from March" and "what did we decide in
 *   March" are the same question with different nouns, and splitting them
 *   across two rail items makes a person choose between them before they know
 *   which one they want.
 *
 * The rail is five items. A sixth costs every user, every session, forever, to
 * serve a need that turns up occasionally. And agent-native cuts the same way:
 * an agent citing its own work needs ONE addressable record, not two.
 *
 * So /artifacts is now a permanent redirect to /brain?tab=artifacts, and this
 * file is the tab body. It draws no Surface, no PageHead and no h1: Brain owns
 * the surface, its headline and its tab row, and a second h1 under the first
 * would be two pages stacked.
 *
 * 1. WHO IS HERE, AND WHY. A product lead who remembers the crew made
 *    something, a spec or a prototype, and needs to get back to it. They are
 *    not browsing. They have a thing in mind, they half remember its name, and
 *    they want it open in front of them in two clicks.
 *
 * 2. THE ONE THING IT EXISTS FOR. To find the thing the crew made and open it,
 *    knowing WHO made it and WHAT IT CAME FROM. The finding alone is a file
 *    list; the provenance is the reason this is part of the record and not a
 *    folder. Everything else here serves that or is a candidate for removal.
 *
 * 3. KEEP / MOVE / KILL, carried forward from the standalone surface and
 *    re-decided for the move:
 *    KEEP  the list, newest first, and the product filter. The filter is the
 *          one control that turns a workspace-wide shelf into the shelf you
 *          are actually looking at, so the scoping decision is made here.
 *    KEEP  the relative timestamps. On a shelf of near-identical names, "2h
 *          ago" is how a person tells two drafts apart.
 *    KEEP  rename, but only on the item in focus. Real reason, not inertia:
 *          the crew names these things itself, and a bad auto-generated name
 *          is the single reason you fail to find one later. The moment you
 *          fail to recognise it IS the moment you fix it.
 *    KEEP  delete, on the item in focus. This is the only view that sees all
 *          three families at once, so it is the only place you can tidy up.
 *    MOVE  the product filter, off a second tab row and onto a chip row. Two
 *          identical tab rows stacked, Brain's doors and then a product
 *          filter, is two things competing to be the navigation and neither
 *          winning. A chip carrying its own count reads as a control, which is
 *          what it is. (It was a `Choices` radio group between the 2026-07-30
 *          pass and the Meridian port; same semantics, system paint.)
 *    MOVE  "What came out of it" and the live crew line, out of the context
 *          rail and into the body. Brain's Surface has no aside, and a tab
 *          body cannot grow one without lifting this view's focus state up
 *          into the page. It reads better here anyway: who made it and what it
 *          came from, then what came out of it, is cause and consequence in
 *          the order Brain already tells everything else.
 *    KILL  the page's own headline and h1. Brain's head speaks for the record;
 *          this region says what it holds, on the region heading.
 *    KILL  "Newest first. Open one to see who made it and what it came from."
 *          The newest item is ALREADY in focus with its byline rendered, so
 *          the sentence narrates what the reader is looking at (hard ban 10).
 *          The live crew line takes the slot, because it says something the
 *          surface cannot otherwise show.
 *    KILL  the three hover-revealed buttons per row, the bordered mono kind
 *          chip, "Snapshot now", the "N in this workspace" line, the rename
 *          modal, and every toast. Killed in the 2026-07-29 pass and staying
 *          killed; the reasons are in that commit and are not relitigated.
 *    MOVE  version history and Restore, to each artifact's own surface: /plan
 *          for a spec, /docs for a doc, /p/$slug for a prototype. Restoring a
 *          version while looking at a name-only row is restoring blind.
 *
 * 4. ONE CLICK AWAY. A row is one line, its name, plus a second line carrying
 *    DIFFERENT information, the product it belongs to. Its maker, its source,
 *    and what it led to appear when it becomes the item in focus, which is one
 *    click. Each family is capped at six rows, and the cap states its own
 *    arithmetic under the last row with the way out beside it, so the view has
 *    a bottom on day one and on day four hundred and nobody has to guess how
 *    much is behind it. Above twelve artifacts a find field appears, because
 *    past one screen a filter is the only thing that actually answers "too much
 *    scrolling".
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is opening a spec you half
 *    remember and reading "Writer made this. From: the churn cluster from
 *    October." You did not know the record remembered that. The confusion to
 *    avoid is a name-only list that looks like Google Drive; the answer is
 *    that provenance is never absent, it is either shown or honestly refused.
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove every agent from this
 *    product and this view loses its whole top half: the byline on the item in
 *    focus, the source it was made from, the work it led to, and the line
 *    saying the crew is making another one right now. It is not a file list.
 *
 *    ATTRIBUTION, AND THE ONE PLACE IT IS HONESTLY REFUSED. This is doctrine
 *    correction C9, live: `prds`, `prototypes` and `docs` carry NO author
 *    column, so listArtifacts cannot say who made a row and no batch read in
 *    the repo can (getLineage and getProvenance are both per item). So the
 *    maker is read per item from the lineage EDGE, which does carry
 *    created_by_agent, and the rows do not pretend. Where no edge names an
 *    agent the view prints the deliberately ugly `unattributed` rather than
 *    guessing, because one invented byline makes every real byline worthless
 *    (R12). Build item B1 is what turns the rows honest.
 *
 *    WORK IN MOTION. getLiveActivity is read for state only, never for its
 *    action string, which is assembled from tool names and would leak
 *    mechanism words onto a user-facing surface.
 *
 * 7. WOULD A STRANGER RECOGNISE THIS. The identity on this view is the FAMILY
 *    of the thing, and it is drawn as the group heading rather than as a chip
 *    on every row: three headings say Specs, Prototypes, Docs once each, which
 *    is the same information at a fraction of the ink. The scanning path is
 *    the item in focus first, because it is the only region with a byline and
 *    actions, then the group headings, then names. The emptiest realistic
 *    state is a month-old workspace: a few rows, and a focus panel whose
 *    byline reads `unattributed` because no lineage edge was ever written,
 *    which is the honest refusal and not a blank. The one word a stranger may
 *    not carry is "Artifacts" itself, which is why the region heading says it
 *    in plain words: things your crew has made.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, anti-slop.md section 5).
 * Renaming and deleting each leave a receipt that stays in the region, and a
 * failed write still writes one and goes honest immediately. NO handoff arrow
 * is drawn on either: nothing in the repo picks up a rename or a delete, so
 * the receipt says what changed instead. An arrow to nowhere is worse than no
 * arrow.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PORTED TO MERIDIAN, 2026-08-15. Same data, same reads, same handlers. Three
 * things are now drawn by a component instead of by hand, and each replaces
 * something the old part could not do.
 *
 *   THE SHELF IS A `RecordsTable`, one per family. The three groups were lists
 *   of `Row`, capped at six, with a "Show all 14" in the region heading. That
 *   heading control is the exact defect the grid's own header names: a list
 *   that quietly stops at six teaches its reader that six is all there is,
 *   because the cap was stated in a control at the TOP of the region while the
 *   truncation happened at the BOTTOM. RecordsTable prints the real arithmetic
 *   under the last row -- "Showing 6 of 14 rows. 8 not shown." -- and puts the
 *   way out beside it. It also gives the shelf sorting it never had: on a shelf
 *   of near-identical auto-generated names, sorting by when a thing last
 *   changed is how a person tells two drafts apart, and this view's own header
 *   says exactly that about the timestamps.
 *
 *   THE PRODUCT FILTER IS A CHIP ROW, not `Choices`. Same control, same one-of
 *   semantics, and it now carries its count inside the chip the way every other
 *   narrowing control in Meridian does.
 *
 *   `unattributed` IS A `RecordTag`. It used to be the mono `Num` primitive,
 *   which is how the ugliness was drawn. Meridian reserves mono for numbers,
 *   durations, counts, ids and timestamps and nothing else, so the refusal
 *   moves to the system's colourless categorical chip: still visibly not a
 *   name, still not a guess, and no longer borrowing the figure face.
 *
 * WHAT DID NOT SURVIVE THE PORT, stated rather than hidden: opening one family
 * used to CLOSE the others, because a single `openGroup` held the state for all
 * three. Each grid now owns its own cap, so all three can stand open at once.
 * Nothing is hidden by the change and nothing new is reachable; only the
 * closing of a group you did not touch is gone, and that was a side effect of
 * one piece of state rather than a decision anybody made.
 */

import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listArtifacts, type ArtifactKind, type ArtifactSummary } from "@/lib/artifacts.functions";
import { getLineage } from "@/lib/lineage.functions";
import { getLiveActivity } from "@/lib/agents.functions";
import { renamePrototype, deletePrototype } from "@/lib/prototypes.functions";
import { savePrd, deletePrd } from "@/lib/discovery.functions";
import { updateDoc, deleteDoc } from "@/lib/docs.functions";
import { useConfirm } from "@/hooks/use-confirm";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { RecordsTable, RecordTag, type RecordColumn } from "@/components/meridian/RecordsTable";
import { CrewMark, RecordLine } from "@/components/brain/record-parts";
import {
  Action,
  Actions,
  Figure,
  NothingYet,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

/**
 * Said once, on the group heading, instead of on a chip on every row.
 *
 * `prototype` READS "MOCKUP", because that is what it is. The generator's own
 * prompt forbids `<script>` tags and asks for "the MAIN screen" -- one static
 * page, with `[User Name]` placeholders where content goes. In product design a
 * prototype is interactive: clickable, multi-state, a flow you can walk. Calling
 * a still image a prototype promises a designer something the artifact cannot
 * do, and the founder draws exactly that distinction himself ("what and all
 * prototypes, mock up needs to be there").
 *
 * The DB kind stays `prototype`. Slugs are stable forever under the
 * rename-disclaimer rule; only the word a person reads changes, which is the
 * same edge-translation `/design` already does when it renders this kind as
 * "shared link".
 */
const KIND_ONE: Record<ArtifactKind, string> = {
  spec: "Spec",
  prototype: "Mockup",
  doc: "Doc",
};
const KIND_MANY: Record<ArtifactKind, string> = {
  spec: "Specs",
  prototype: "Mockups",
  doc: "Docs",
};
/** Spec first: it is the artifact a product lead comes back to most. */
const KIND_ORDER: ArtifactKind[] = ["spec", "prototype", "doc"];

/** The lineage graph knows two of the three families. `doc` is not one of
 *  ARTIFACT_KINDS, so a doc has no provenance to read and the view says so
 *  rather than rendering an empty provenance block that looks like a bug. */
const LINEAGE_KIND: Record<ArtifactKind, "prd" | "prototype" | null> = {
  spec: "prd",
  prototype: "prototype",
  doc: null,
};

/** One screen of rows across three groups. Past this the view only grows,
 *  which the founder named twice as the failure. */
const GROUP_CAP = 6;
const FIND_FROM = 12;

/** The product filter's "no filter" option. Not a product id, so it cannot
 *  collide with one. */
const ALL = "__all__";

function relTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (Number.isNaN(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const keyOf = (a: ArtifactSummary) => `${a.kind}:${a.id}`;

/**
 * WHICH PRODUCT'S SHELF YOU ARE LOOKING AT.
 *
 * The one control that turns a workspace-wide shelf into the shelf you actually
 * want, so the scoping decision is made here and nowhere else.
 *
 * Chips rather than the shell's `Choices` radio group, and the chip carries its
 * own count. Two things follow from Meridian's own rules and are worth stating:
 *
 *   NO HUE. A count is not a status. Orchid means a person is required, azure
 *   means a machine is working, green and red report an outcome, and a number of
 *   specs belonging to a product is none of those. The chosen chip is separated
 *   by GROUND, by ink weight and by an edge instead, which is what an active
 *   control is separated by anyway and what keeps it legible in greyscale.
 *
 *   THE PRESSED CHIP HAS TO LOOK PRESSED. Fill alone is four points of
 *   lightness on the dark ground and one and a half on paper, which is a chip
 *   that is arguably a different colour rather than one that is obviously
 *   chosen. The three shadows are all inset except the drop, so nothing reflows
 *   when the choice moves along the row.
 */
function ShelfFilter({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string; count: number }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div
      data-mrd=""
      role="group"
      aria-label="Which product"
      className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1"
      style={{ scrollbarWidth: "none" }}
    >
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(option.id)}
            className={`flex h-6.5 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition-[background-color,box-shadow,color] ${
              on
                ? "bg-mrd-lift text-mrd-ink"
                : "text-mrd-prose text-mrd-body hover:bg-mrd-hover hover:text-mrd-ink"
            }`}
            style={{
              boxShadow: on
                ? "inset 0 0 0 1px var(--mrd-line), inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)"
                : "none",
              transitionDuration: "var(--mrd-d-move)",
            }}
          >
            {option.label}
            <span
              className={`rounded-mrd-xs px-1 font-mrd-mono text-[10.5px] tabular-nums ${
                on ? "bg-mrd-sink text-mrd-prose text-mrd-body" : "text-mrd-mute"
              }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** One labelled text field. ONE label: a second line here would carry different
 *  information, never a restatement.
 *
 *  It draws NO focus ring, and that is the system rule rather than an omission.
 *  meridian.css removes the ring from text entry only, because a field already
 *  answers "where is the keyboard" twice and better than a ring can: a caret is
 *  blinking in it, which no other control has, and its border steps up. A third
 *  answer drawn around the outside visibly doubles the field's edge. */
function NameField({
  label,
  id,
  value,
  autoFocus,
  onChange,
  onKeyDown,
}: {
  label: string;
  id: string;
  value: string;
  autoFocus?: boolean;
  onChange: (next: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label data-mrd="" htmlFor={id} className="flex flex-col gap-mrd-2">
      <span className="text-[11px] font-medium tracking-wide text-mrd-mute uppercase">{label}</span>
      <input
        id={id}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="h-8 w-full max-w-[46ch] rounded-mrd-ctl border border-mrd-field bg-mrd-sink px-2.5 text-[13px] text-mrd-ink transition-colors placeholder:text-mrd-faint focus:border-mrd-field-focus"
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      />
    </label>
  );
}

type Settled = {
  id: string;
  verb: string;
  consequence: string;
  at: string;
  failed?: boolean;
};

/**
 * WHAT YOU CHANGED, this session.
 *
 * The shell's `Receipt` drawn in Meridian, and the ruling it carries is not
 * this file's to change: renaming or deleting must not vanish into a toast. A
 * toast confirms that your click REGISTERED; this renders what your click
 * CAUSED. An act that erases itself teaches you that your judgment left no
 * trace, and judgment is the product.
 *
 * `role="status"` is the polite register: it waits for a pause rather than
 * interrupting, which is right for a confirmation of something the person just
 * did deliberately. A failed line keeps status too, because the failure is the
 * answer to their own click and it is on screen where they are already looking.
 *
 * A FAILED WRITE GETS THE FAILED SHAPE IMMEDIATELY, never a success shape over
 * a failed write, which is the one thing that makes the successful ones
 * trustworthy. Red is an OUTCOME here, the only thing red is allowed to be.
 */
function ChangedTrail({ lines }: { lines: Settled[] }) {
  if (lines.length === 0) return null;
  return (
    <Region title="What you changed">
      <ul data-mrd="" className="flex flex-col gap-mrd-2">
        {lines.map((line, i) => (
          <li
            key={`${line.id}-${i}`}
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-5 py-mrd-3"
            style={{ animation: "mrd-fade-up 300ms var(--mrd-ease) both" }}
          >
            <span
              className={`text-[13px] font-medium ${line.failed ? "text-mrd-fail" : "text-mrd-ink"}`}
            >
              {line.verb}
            </span>
            <span className="min-w-0 leading-mrd-snug text-mrd-prose text-mrd-body">
              {line.consequence}
            </span>
            <span className="font-mrd-mono ml-auto shrink-0 text-[12px] tabular-nums text-mrd-faint">
              {line.at}
            </span>
          </li>
        ))}
      </ul>
    </Region>
  );
}

export function ArtifactsView() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fetchArtifacts = useServerFn(listArtifacts);
  const fetchLineage = useServerFn(getLineage);
  const fetchLive = useServerFn(getLiveActivity);
  const fRenameProto = useServerFn(renamePrototype);
  const fDeleteProto = useServerFn(deletePrototype);
  const fSavePrd = useServerFn(savePrd);
  const fDeletePrd = useServerFn(deletePrd);
  const fUpdateDoc = useServerFn(updateDoc);
  const fDeleteDoc = useServerFn(deleteDoc);

  const [productFilter, setProductFilter] = useState<string>(ALL);
  const [find, setFind] = useState("");
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  /** null = not renaming. A string = the draft, including the empty one. */
  const [draft, setDraft] = useState<string | null>(null);
  // THE COMMIT. Session-local on purpose: the durable record is each family's
  // own history, and a second copy here would be a second source of one truth.
  const [settled, setSettled] = useState<Settled[]>([]);

  const q = useQuery({ queryKey: ["artifacts"], queryFn: () => fetchArtifacts() });
  const artifacts = useMemo(() => q.data?.artifacts ?? [], [q.data]);
  const products = useMemo(() => q.data?.products ?? [], [q.data]);
  const productName = useMemo(() => new Map(products.map((p) => [p.id, p.name])), [products]);

  const shown = useMemo(() => {
    const needle = find.trim().toLowerCase();
    return artifacts.filter(
      (a) =>
        (productFilter === ALL || a.productId === productFilter) &&
        (!needle || a.name.toLowerCase().includes(needle)),
    );
  }, [artifacts, productFilter, find]);

  // No effect needed: the newest is the focus until you pick another, and a
  // filter that drops your pick falls back to the newest that survived it.
  const focused = useMemo(
    () => shown.find((a) => keyOf(a) === focusedKey) ?? shown[0] ?? null,
    [shown, focusedKey],
  );
  const rest = useMemo(
    () => (focused ? shown.filter((a) => keyOf(a) !== keyOf(focused)) : shown),
    [shown, focused],
  );

  // WHO MADE IT, and WHAT IT CAME FROM. Per item, because the row-level author
  // column does not exist yet (C9). The edge does carry created_by_agent.
  const lineageKind = focused ? LINEAGE_KIND[focused.kind] : null;
  const lineage = useQuery({
    queryKey: ["artifact-lineage", lineageKind, focused?.id],
    queryFn: () => fetchLineage({ data: { kind: lineageKind, id: focused!.id } }),
    enabled: !!focused && !!lineageKind,
  });
  const ancestors = lineage.data?.ancestors ?? [];
  const descendants = lineage.data?.descendants ?? [];
  const makerSlug = ancestors.find((e) => e.created_by_agent)?.created_by_agent ?? null;
  const cameFrom = ancestors.find((e) => e.peer_title)?.peer_title ?? null;

  const live = useQuery({ queryKey: ["artifacts-live"], queryFn: () => fetchLive() });

  function push(r: Omit<Settled, "at">) {
    setSettled((prev) => [
      {
        ...r,
        at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      },
      ...prev,
    ]);
  }

  const rename = useMutation({
    mutationFn: async ({ a, name }: { a: ArtifactSummary; name: string }) => {
      if (a.kind === "prototype") await fRenameProto({ data: { id: a.id, name } });
      else if (a.kind === "spec") await fSavePrd({ data: { id: a.id, title: name } });
      else await fUpdateDoc({ data: { id: a.id, title: name } });
    },
    onSuccess: (_res, vars) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["artifacts"] });
      push({
        id: keyOf(vars.a),
        verb: "You renamed it",
        // What CHANGED, since nothing picks a rename up. No arrow.
        consequence: `Now called ${vars.name}. It was ${vars.a.name}.`,
      });
    },
    onError: (e: Error, vars) => {
      push({
        id: keyOf(vars.a),
        verb: "Nothing was renamed",
        consequence: e.message,
        failed: true,
      });
    },
  });

  const remove = useMutation({
    mutationFn: async (a: ArtifactSummary) => {
      if (a.kind === "prototype") await fDeleteProto({ data: { id: a.id } });
      else if (a.kind === "spec") await fDeletePrd({ data: { id: a.id } });
      else await fDeleteDoc({ data: { id: a.id } });
    },
    onSuccess: (_res, a) => {
      setFocusedKey(null);
      void qc.invalidateQueries({ queryKey: ["artifacts"] });
      push({
        id: keyOf(a),
        verb: "You deleted it",
        consequence: `${a.name} is off the shelf. This one does not come back.`,
      });
    },
    onError: (e: Error, a) => {
      push({ id: keyOf(a), verb: "Nothing was deleted", consequence: e.message, failed: true });
    },
  });

  const busy = rename.isPending || remove.isPending;

  async function onDelete(a: ArtifactSummary) {
    const ok = await confirm({
      title: "Delete this?",
      body: `${a.name} is removed for everyone in this workspace. It does not come back.`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      destructive: true,
    });
    if (ok) remove.mutate(a);
  }

  const n = artifacts.length;

  /**
   * THE REGION SAYS WHAT IT IS. THE PRIMITIVES SAY WHAT HAPPENED.
   *
   * This heading used to be computed from the query state, and the body then
   * rendered the primitive for the SAME state one line below it, in different
   * words. Three states, each said twice:
   *
   *   "Reading what your crew has made."  /  <Loading>Reading the shelf.</Loading>
   *   "What your crew has made did not load." / <Failed>Could not read your artifacts.</Failed>
   *   "Nothing made yet."  /  <Empty>Your crew has not made anything yet...</Empty>
   *
   * Loading, Failed and Empty exist precisely so a region does not have to
   * narrate its own read; a heading that changes underneath a reader every time
   * a request resolves is a label doing a status line's job, and the two
   * vocabularies drifting apart is what made the duplication visible. The
   * failure copy also reached for "artifacts", which is the one word section 7
   * of this header says a stranger may not carry and which the plain-words
   * heading exists specifically to avoid.
   *
   * So the heading is now the stable noun, and it says the same thing on every
   * read. The count moved out with the states: it was only ever legible on one
   * of the four, and the three group headings below already carry it per family.
   */
  const heading = "What your crew has made";

  // The crew, right now. State only: the action string is assembled from tool
  // names and would leak mechanism onto a user-facing surface.
  const liveLine =
    live.data?.state === "working"
      ? "Your crew is making something right now. It lands here when it is done."
      : live.data?.state === "waiting"
        ? "Nothing is being made. A call is waiting on you."
        : live.data?.state === "idle"
          ? "Nobody is making anything right now."
          : undefined;

  /**
   * THREE COLUMNS, AND THE ONE THAT OPENS SOMETHING IS A REAL CONTROL.
   *
   * A whole-row door is not available in this grid: the identity column is
   * pinned so it survives a sideways scroll, and a `<tr>` cannot be a button.
   * So the name is the button, which is also the only thing on the row worth
   * opening. It is tabbable, it answers Space and Enter, and it takes the
   * system focus ring; a styled `<span>` with an onClick would have none of
   * those. `mrd-focus-inset` because the grid clips, and an outset ring on a
   * cell inside a scrolling container is sheared off and reads as a broken
   * edge rather than as focus.
   *
   * `sortValue` returns something genuinely comparable and never the printed
   * string, which is the trap the grid's own header names: "2h ago" sorts ahead
   * of "9 Jun" alphabetically, which is backwards, and the column looks like it
   * works. The changed column returns epoch ms.
   *
   * The product is a DIFFERENT fact from the name, not more of it. The maker
   * belongs to the one item in focus, which is one click away.
   */
  const shelfColumns: RecordColumn<ArtifactSummary>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        width: "34ch",
        sortValue: (a) => a.name.toLowerCase(),
        cell: (a) => (
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setFocusedKey(keyOf(a));
            }}
            className="mrd-focus-inset block w-full truncate rounded-mrd-xs text-left transition-colors hover:text-mrd-ink"
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {a.name}
          </button>
        ),
      },
      {
        key: "product",
        header: "Product",
        width: "18ch",
        sortValue: (a) => (a.productId ? (productName.get(a.productId) ?? "") : ""),
        cell: (a) => (a.productId ? (productName.get(a.productId) ?? "Unassigned") : "Unassigned"),
      },
      {
        key: "changed",
        header: "Changed",
        width: "12ch",
        numeric: true,
        sortValue: (a) => (a.updatedAt ? new Date(a.updatedAt).getTime() : 0),
        cell: (a) => relTime(a.updatedAt),
      },
    ],
    [productName],
  );

  return (
    <div className="flex flex-col gap-mrd-7">
      <Region title={heading} sub={liveLine}>
        <div className="flex flex-col gap-mrd-5">
          {/* The failure is stated ONCE, here, so this sentence has to carry
              the whole thing: what did not load, and the claim it is refusing to
              make. It also drops "artifacts", the one word section 7 above says a
              stranger may not carry -- the heading avoids it deliberately and the
              error arm was reaching for it one line below. */}
          {q.isError ? (
            <ReadFailedLine onRetry={() => void q.refetch()}>
              The shelf did not load, so this is not a claim that your crew has made nothing.{" "}
              {(q.error as Error).message}
            </ReadFailedLine>
          ) : null}

          {q.isLoading ? <Reading>Reading the shelf.</Reading> : null}

          {!q.isLoading && !q.isError && n === 0 ? (
            <NothingYet>
              Your crew has not made anything yet. Specs, prototypes and docs land here as they are
              written.
            </NothingYet>
          ) : null}

          {products.length > 0 ? (
            <ShelfFilter
              value={productFilter}
              onPick={setProductFilter}
              options={[
                { id: ALL, label: "All", count: n },
                ...products.map((p) => ({ id: p.id, label: p.name, count: p.count })),
              ]}
            />
          ) : null}

          {/* DELIBERATELY NOT MERIDIAN'S `Search`. That component's own header
              draws the line and it is the right one: search answers "show me
              the one I already have in mind" and returns a result list you pick
              from, while a filter answers "show me the ones like this" and
              narrows the grid in place. This field is a FILTER -- it narrows all
              three shelves at once, and this view's header says so ("past one
              screen a filter is the only thing that actually answers too much
              scrolling"). Adopting Search here would change what typing does. */}
          {n > FIND_FROM ? (
            <NameField label="Find by name" id="artifact-find" value={find} onChange={setFind} />
          ) : null}

          {n > 0 && shown.length === 0 ? (
            <NothingYet>
              Nothing here matches. Clear the filter to see all <Figure>{n}</Figure>.
            </NothingYet>
          ) : null}
        </div>
      </Region>

      {/* THE ITEM IN FOCUS. Deliberately NOT a `lead` region: `lead` is the one
          rung between the page title and everything else, and Brain already
          spends it on StandingRules above the tab strip. A surface that marks
          two regions has marked neither. */}
      {focused ? (
        <Region
          title={focused.name}
          sub={`${KIND_ONE[focused.kind]} · changed ${relTime(focused.updatedAt)}${
            focused.productId ? ` · ${productName.get(focused.productId) ?? "Unassigned"}` : ""
          }`}
        >
          {/* THE BYLINE. Every artifact says who made it and what it came from,
              or honestly refuses. Never a guess.

              A FAILED READ MUST NOT CONVICT AN ARTIFACT OF HAVING NO AUTHOR.
              Found 2026-08-10: `unattributed` was reachable from a lineage read
              that ERRORED. On a failure `isLoading` goes false and `makerSlug`
              stays null, so the row printed the deliberately ugly word over
              "Nothing recorded who made this one." -- a POSITIVE claim that the
              record holds no maker, made from a read that never came back.

              The sibling region below, off the SAME query, already had a real
              error arm with a retry. So one screen said the network failed in
              one place and quietly convicted the artifact in the place above
              it, which is the worse of the two lies: a false refusal costs
              exactly what a false byline costs, because after one of them the
              reader stops believing the word means anything (R12, and the
              header's rule that provenance is either shown or honestly
              refused).

              KEEP THE isError ARM ABOVE THE makerSlug BRANCH. `unattributed` is
              reachable only from a read that RETURNED and named no agent. */}
          <RecordLine
            mark={
              makerSlug ? (
                <CrewMark slug={makerSlug} name={agentDisplayName(makerSlug)} />
              ) : undefined
            }
            lead={
              lineage.isLoading ? (
                "Reading who made it."
              ) : lineage.isError ? (
                "Could not read who made this one."
              ) : makerSlug ? (
                <>
                  <span className="font-medium">{agentDisplayName(makerSlug)}</span> made this.
                </>
              ) : (
                /* The honest refusal, and it must not look like a name. It was
                   the mono `Num` primitive; Meridian keeps mono for numbers,
                   durations, counts, ids and timestamps and nothing else, so it
                   moves to the system's colourless categorical chip. Colourless
                   matters: one invented byline makes every real byline
                   worthless, and a tinted refusal would read as a status. */
                <RecordTag label="unattributed" />
              )
            }
            sub={
              lineage.isLoading
                ? undefined
                : lineage.isError
                  ? "Unknown rather than absent. The read did not come back."
                  : !lineageKind
                    ? "Docs do not record a maker yet."
                    : makerSlug
                      ? cameFrom
                        ? `From ${cameFrom}`
                        : "No recorded source."
                      : "Nothing recorded who made this one."
            }
            action={
              lineage.isError ? (
                <Action variant="quiet" onClick={() => void lineage.refetch()}>
                  Try again
                </Action>
              ) : undefined
            }
          />

          {draft !== null ? (
            <>
              <div className="mt-mrd-5">
                <NameField
                  label="New name"
                  id="artifact-name"
                  value={draft}
                  autoFocus
                  onChange={setDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setDraft(null);
                    if (e.key === "Enter" && draft.trim() && !busy) {
                      rename.mutate({ a: focused, name: draft.trim() });
                    }
                  }}
                />
              </div>
              <Actions className="mt-mrd-4">
                <Action
                  variant="primary"
                  disabled={!draft.trim() || draft.trim() === focused.name || busy}
                  onClick={() => rename.mutate({ a: focused, name: draft.trim() })}
                >
                  Save the name
                </Action>
                <Action variant="quiet" onClick={() => setDraft(null)}>
                  Cancel
                </Action>
              </Actions>
            </>
          ) : (
            <Actions
              className="mt-mrd-4"
              trailing={
                <Action variant="quiet" busy={busy} onClick={() => void onDelete(focused)}>
                  Delete
                </Action>
              }
            >
              <Action variant="primary" onClick={() => window.location.assign(focused.href)}>
                Open
              </Action>
              <Action busy={busy} onClick={() => setDraft(focused.name)}>
                Rename
              </Action>
            </Actions>
          )}
        </Region>
      ) : null}

      {/* Consequence, directly under cause. This was the context rail on the
          standalone surface; Brain's Surface has no aside, and the record
          reads better as one column anyway. */}
      {focused ? (
        <Region title="What came out of it">
          {!lineageKind ? (
            <NothingYet>
              Docs are not on the lineage graph yet, so nothing can be traced from one.
            </NothingYet>
          ) : lineage.isLoading ? (
            <Reading>Reading the record.</Reading>
          ) : lineage.isError ? (
            <ReadFailedLine onRetry={() => void lineage.refetch()}>
              Could not read what came out of this one.
            </ReadFailedLine>
          ) : descendants.length === 0 ? (
            <NothingYet>Nothing has been made from this one yet.</NothingYet>
          ) : (
            /* Attributed lines rather than a grid, and the choice is the shape
               of the fact. This is at most five things, each carrying WHO made
               it, which is the system's grammar for an event; a RecordsTable is
               for a list nobody can scan by eye, and five rows is not that. */
            descendants
              .slice(0, 5)
              .map((e) => (
                <RecordLine
                  key={e.id}
                  mark={
                    e.created_by_agent ? (
                      <CrewMark
                        slug={e.created_by_agent}
                        name={agentDisplayName(e.created_by_agent)}
                      />
                    ) : undefined
                  }
                  lead={e.peer_title || "Untitled"}
                  sub={
                    e.created_by_agent
                      ? `${agentDisplayName(e.created_by_agent)} made it`
                      : "no recorded maker"
                  }
                />
              ))
          )}
        </Region>
      ) : null}

      <ChangedTrail lines={settled} />

      {KIND_ORDER.map((kind) => {
        const items = rest.filter((a) => a.kind === kind);
        if (items.length === 0) return null;
        return (
          <Region key={kind} title={KIND_MANY[kind]}>
            {/* `maxRows` is the whole reason this is a grid. The cap is stated
                at the BOTTOM, with both real numbers and the way out, instead of
                as a "Show all 14" in the heading above rows the reader has not
                reached yet. `caption` is read before the grid and says what the
                grid IS, never that it is a grid. */}
            <RecordsTable
              rows={items}
              columns={shelfColumns}
              rowKey={keyOf}
              caption={`${KIND_MANY[kind]} your crew has made`}
              maxRows={GROUP_CAP}
            />
          </Region>
        );
      })}
    </div>
  );
}
