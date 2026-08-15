/**
 * Build. Redesigned from the person's session, not re-skinned
 * (docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md). The first pass on
 * this file was mechanical: it swapped components and kept the shape. The six
 * answers below are the design, and the code obeys them.
 *
 * a. WHO IS STANDING HERE. A product lead who wants a change made and does not
 *    want to make it. They came to hand work to the crew, and to unstick the
 *    one run that stopped and is holding the rest up.
 *
 * b. THE ONE THING THIS SURFACE EXISTS FOR. To put work into the crew's hands
 *    and to see, without opening anything, how far they have got with it.
 *    Everything else here is either serving that or was cut.
 *
 * c. KEEP / MOVE / KILL, element by element. "It was already there" is not a
 *    reason to keep.
 *    KEEP  the gate for the run that stopped. It is the one human decision on
 *          this surface, so it is the biggest thing on it.
 *    KEEP  the composer, both doors. This is where work is handed over; it is
 *          the reason a person walks in.
 *    KEEP  the run list, and the completion-evidence flag on it. That flag is
 *          the one element that calls out a Done claim with nothing behind it.
 *    KEEP  where builds land (the repo) and what these runs cost, in context.
 *          The first is the precondition for every dispatch; the second is the
 *          only place spend is totalled, and there is no spend cap in the
 *          engine yet, so the number is the only ceiling a person has.
 *    KILL  the "last thing that shipped" block, and with it the Record recess.
 *          Record is the record SPEAKING, the one lit surface in the product;
 *          a shipped-status recap is not that, and the merged run was already
 *          on the list one row up wearing its Verified flag. What was worth
 *          keeping is the outbound proof link, which moved into context: it is
 *          a supporting fact about this surface, not a decision made on it.
 *    KILL  the "By agent" lens (FleetView). It is the crew's record, and the
 *          crew's record has a surface: /crew. Two homes for one truth.
 *    KILL  the "By lane" board (DelegateBoard). Five columns of cards drawn
 *          from the same runs already listed a few pixels above it. Its ONE
 *          fact the list did not carry, how many steps of the plan are done,
 *          MOVED onto the run row, which is where the work is.
 *    KILL  the per-run cost on the row. Nothing on this surface is decided by
 *          it, and the total sits in context.
 *    KILL  the "Behind this one" context block. The headline already counts
 *          what needs you; saying it twice is the redundant-writing ban.
 *    KILL  the run title field on the goal door. The crew names its own work
 *          and the whole product already strips that auto prefix.
 *    KILL  the spec dropdown menu, for a plain labelled select. A menu that
 *          hides its own loading, error and empty states inside itself was
 *          sixty lines saying what one control says.
 *    KILL  "Show archived" as a second toggle, and the three success toasts.
 *          One Manage mode reveals archived runs and their two actions; the
 *          consequence of archiving is the row moving, which the list renders.
 *    KILL  the local FIELD / HINT / STACK / ACTIONS / INLINE_ACTION style
 *          objects. The primitives cover all five now.
 *    MOVE  the by-agent record to /crew (already live, nothing to build).
 *    MOVE  step progress onto the row (done here).
 *
 * d. ONE CLICK AWAY. A row is its title plus one different second line: who is
 *    on it, what they are doing, how far through the plan. The diff, the trace,
 *    the steps and the gates are one click into the run.
 *
 * e. DELIGHT AND CONFUSION. The delight is watching a plan you did not write
 *    fill in: you type a sentence, and within seconds a row appears saying
 *    Chief of Staff has it, then step 2 of 7, then 5 of 7. The confusion this
 *    surface used to cause was three renderings of one list behind two tabs;
 *    that is gone.
 *
 * f. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove the agents and this
 *    surface loses its subject, not its decoration.
 *    - ATTRIBUTION. A dispatched run carries Engineer's mark and Engineer's
 *      name, which is not a guess: listStudioSessions selects that mission by
 *      agent_slug='builder'. The shipped record says Engineer wrote it, in the
 *      sentence, so the attribution survives being copied out of the app.
 *    - WORK IN MOTION, WHILE IT HAPPENS. A running row reads "Engineer is
 *      writing the change, step 4 of 8", off mission_steps through the pure
 *      missionProgress(). The mark carries the running state; state is never a
 *      hue and the mark owns the colour.
 *    - JUDGMENT LEAVES A TRACE. Starting a build used to fire "Build started."
 *      and throw you onto another page. A toast confirms that your click
 *      registered; the Commit renders what it caused. It now writes a receipt
 *      that names the agent who picked the work up, with a real arrow: the spec
 *      door creates a 'builder' run (studio.functions dispatch) and the goal
 *      door creates the mission with starting_agent_id = orchestrator. Both are
 *      read off the code paths, not assumed. A failed start still writes a
 *      receipt and goes honest in the same beat.
 *    - NOTHING OVERCLAIMS. Two gaps are left visibly empty rather than filled
 *      with something flattering, and both are reported: there is no
 *      lines-added/removed anywhere in the changeset tables, so no Diffstat is
 *      drawn; and a goal run's holder is a uuid with no client-side resolver,
 *      so it reads "The crew" rather than inventing a name.
 *
 * ONE SURFACE, NOT THREE. Handing over work, unsticking a run, and reading how
 * far it got are one two-minute session, not three destinations. What made this
 * feel like three surfaces was three renderings of one list, which is why the
 * two lens tabs are gone rather than the page being split.
 *
 * ==================================================================
 * THE SECOND VIEW: THE BOARD. Added 2026-07-29, founder ask, verbatim:
 * "Somewhere on the navigation plane should we have something like a status or
 * a dashboard? It should show what is working, what is done ... like a scrum
 * board or Kanban board ... It is just like the canvas where I can see what is
 * happening ... what is moving, what is working, what is parked for next
 * thing."
 *
 * The board goes HERE and not on Today, because Today is a brief and not a
 * dashboard (docs/conventions/home-and-today-ia.md guards that). The list
 * stays the default; the board is a second view of the same rows, and the
 * choice lives in the URL so a board link opens as a board.
 *
 * The six answers again, for the board specifically. They are here rather than
 * in the component because these are two views of ONE surface, and answering
 * the same six questions in two files is how two views drift apart.
 *
 * a. WHO IS STANDING HERE. The same product lead, on a different errand. Not
 *    "I want this one run", but "where is everything, and is anything piling
 *    up". Monday morning, or after a day away.
 *
 * b. THE ONE THING THIS VIEW EXISTS FOR. To see the SHAPE of the work in one
 *    look: how much is moving, how much is stuck on them, how much is settled.
 *    A list answers "what happened most recently" and cannot answer that,
 *    because a list sorted by time hides the distribution.
 *
 * c. KEEP / MOVE / KILL, relative to the list view.
 *    KEEP  the headline and the count line. They are the surface's report and
 *          they read the same in both views.
 *    KEEP  the composer. Removing it would make the board a dead end that
 *          forces a toggle back to hand over the work you just noticed was
 *          missing. It keeps the 74ch measure the board itself drops.
 *    KEEP  the receipts. A hand-over made from the board renders its
 *          consequence in the same place it does on the list.
 *    KILL  the Gate, on this view only. The Gate promotes the one oldest
 *          waiting run above a "Waiting on you" column that already holds it
 *          and every one behind it. That is the same defect as the three
 *          renderings of one list, at a smaller scale. On the board the ember
 *          column IS the gate, and it is better because it shows all of them.
 *    KILL  the context column, on this view only, and this is the honest
 *          trade. It costs 316px plus a 52px gutter, and with it the board
 *          gets 756px at a 1440 window, which is under 152px a column. Worse,
 *          the split is a container query at 1120px, so the board would be
 *          WIDER at 1100 than at 1440. Its three facts are not lost: they
 *          belong to the hand-over job, which is the list view, one toggle
 *          away. Reported as the trade it is.
 *    KILL  the row-level Manage controls. Archiving is a list job; the board
 *          hides archived runs so they never inflate a count.
 *    MOVE  nothing. Both views read the SAME two queries.
 *
 * d. ONE CLICK AWAY. A card is a title and one different second line, and the
 *    second line is different in every column: who it is queued for, how far
 *    it has got, how many calls are stacked on it, whether the Done claim is
 *    backed, where it stopped. Clicking opens the run.
 *
 * e. DELIGHT AND CONFUSION. The delight is an empty "Waiting on you": the
 *    column gives its room back to the ones that are working and its ember
 *    goes out, so the best state in the product is also the quietest thing on
 *    the screen. The confusion to avoid was a sixth column of roadmap items,
 *    which is why there is not one (see below).
 *
 * f. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Every card carries the agent
 *    holding it, as a mark whose shape is the agent and whose hue is the loop
 *    stage. Remove the agents and the board loses its subject: "Working" would
 *    be a pile of titles with nobody on them. A working card's mark carries
 *    the stage hue while it runs and stops the moment it does; the waiting
 *    ones wear ember; exactly one blinks. Nothing overclaims: a goal run's
 *    holder is a uuid with no client-side resolver, so it reads "The crew"
 *    rather than inventing a name, and a Done claim with no merged pull
 *    request says so.
 *
 * THE ROADMAP IS NOT A COLUMN, AND THAT IS DELIBERATE. The ask included "what
 * is in the roadmap". A roadmap item is an `opportunities` row carrying
 * `roadmap_bucket` / `roadmap_outcome`. It is not a run: nothing was
 * dispatched, no agent holds it, it has no steps, no cost and no gate. A sixth
 * column of them would put two different kinds of object in one row of
 * columns, and every count on the board would then mean "runs, plus some
 * things that are not runs". The board says once where the roadmap lives
 * (Plan) and holds runs only. Reasoning in full: components/runs/RunBoard.tsx.
 *
 * The layout arithmetic, the wrap point, and why an empty column shrinks are
 * recorded in that same file, next to the CSS they explain.
 * ==================================================================
 *
 * ==================================================================
 * THE LIST BECAME A GRID, 2026-08-14. What changed, and what it fixed.
 *
 * WHAT THIS SURFACE WAS. A workspace-wide list with a cap and nothing else: no
 * search, no filter, no sort, and one control reading "All 43" that never said
 * how many rows it was holding back. Past about ten runs the reader was
 * scrolling and hoping. The 2026-08-14 surface audit found the same hole on
 * three surfaces at once, and `FilterTable` and `Search` were ported for
 * exactly this class of surface.
 *
 * FOUR FACTS, NOT TWO. `FilterTable` composes `RecordsTable` and passes
 * `isFiltered` and `totalBeforeFilter` down, which is the only way a grid can
 * tell AN EMPTY WORKSPACE from A FILTER THAT HID EVERYTHING. This surface
 * could not distinguish them at all. The other two, a read that failed and a
 * cap, are answered here in the surface's own voice, above the grid, because
 * an empty workspace also needs a DOOR and a grid cannot carry one.
 *
 * THE CAP PRINTS A REAL NUMBER NOW. "All 43" became "Showing 8 of 43 rows. 35
 * not shown." with the way past it beside the count. Silent truncation is a
 * failure this product has already shipped once.
 *
 * WHAT THE ROW ACTIONS COST BEFORE. Archive and Delete were raw
 * `<button className="sp-block-more">` with the irreversible one pushed
 * sideways by an inline margin. The stated reason for skipping the Button
 * primitive was real and still is: a 38px control would roughly double a tight
 * row's height. It is answered rather than reverted in
 * components/runs/RowActions.tsx, which is 22px, draws its own rule before the
 * destructive control, gives that control the only edge in the row, and names
 * the run in every accessible name. Distance alone is the one separator a
 * narrow column or a zoomed page can quietly take away.
 *
 * THE AMBER IS GONE. The completion-evidence flag was drawn `.sp-warn`, which
 * resolves to #e8b44c. There is no warn colour in this system and no token to
 * put one in. The three states map onto meanings the product already has:
 * verified is an outcome, "needs verification" is a person having to go and
 * look, and "no evidence yet" is a structural limit that is not an alarm. The
 * run's own tone table already said exactly that.
 *
 * THE TABLISTS WERE HALF BUILT, AND HALF IS WORSE THAN NONE. Both tab rows on
 * this file carried `role="tablist"` and `role="tab"` and none of the rest:
 * no arrow keys, no roving tab stop, no `aria-controls`, no `role="tabpanel"`.
 * `role="tab"` PROMISES that keyboard. The house already answers this twice,
 * in obsidian/flashlight-tabs.tsx and knowledge/GraphPanel.tsx, and neither
 * could be called from here, so components/runs/Tabs.tsx is those two
 * generalised rather than a third hand-rolled copy.
 *
 * THE LAST SHADCN IMPORTS LEFT THE ROUTE FILES. This was the only route still
 * importing `AlertDialog` and `buttonVariants` from `components/ui/`. The
 * confirmation is unchanged in substance and now goes through `useConfirm`,
 * the one confirm 32 surfaces already share: same Radix focus trap, escape
 * key, focus return and inert background, drawn in house primitives. What it
 * carries differently is noted at the call site.
 *
 * THE ROW IS A DOOR IN MANAGE MODE TOO, and the comment that said otherwise is
 * retired. On a list row the two Manage controls could only sit INSIDE the
 * clickable region and a button inside a button is invalid markup, so Manage
 * used to take the row's link away. In a grid they have a cell of their own.
 *
 * WHAT WAS LOST, said plainly: the list's "Show fewer" is gone. The grid owns
 * its own cap so that one control states the numbers, and RecordsTable's lift
 * is one-way. Two controls for one cap that can disagree would be worse than
 * the loss.
 * ==================================================================
 *
 * VOICE: never greet, always report. "Mission" is a mechanism word and stays
 * out of every user-facing string; these are runs. Internal identifiers
 * (studio.*, mission_id, agent_slug 'builder') are unchanged, per the standing
 * rename convention.
 *
 * Preserved: listStudioSessions on its 5s poll, dispatchStudioSession,
 * startOrchestratedMission, listPrds, canDispatchToRepo, setStudioSessionArchived,
 * deleteStudioSession, the repo pre-check gate, and the ?mission= slide-over.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as React from "react";
import { z } from "zod";

import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { listPrds } from "@/lib/discovery.functions";
import {
  dispatchStudioSession,
  listStudioSessions,
  setStudioSessionArchived,
  deleteStudioSession,
  type StudioSessionListItem,
} from "@/lib/studio.functions";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { listMissions } from "@/lib/missions.functions";
import { missionProgress } from "@/lib/delegate-desk";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { stripAutoPrefix } from "@/components/plan/format";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
/*
 * `Surface` is the ONE shell primitive kept, and it is kept on purpose: it is
 * the work region's LAYOUT -- the main column, its measure, and the context
 * aside beside it -- rather than a token or a paint. The ported Approvals and
 * Brain surfaces both still mount it for the same reason. Everything else this
 * file used to import from that module was the `--sp-*` layer, which
 * meridian.css calls life support, and it has moved to run-parts.tsx.
 */
import { Surface } from "@/components/shell/primitives";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import {
  Acts,
  Button,
  LINK_AS_CONTROL,
  Commit,
  ContextNote,
  Door,
  Field,
  Figure,
  NothingYet,
  Picker,
  Reading,
  ReadFailed,
  Region,
  RunGate,
  RunHead,
  Textarea,
} from "@/components/runs/run-parts";
// The run-state vocabulary is shared with the board rather than defined here,
// so the two views cannot disagree about what a run is doing.
import { runState } from "@/components/runs/run-state";
import { RunBoard } from "@/components/runs/RunBoard";
import { RunsGrid } from "@/components/runs/RunsGrid";
import { Tabs, TabPanel } from "@/components/runs/Tabs";

/* ------------------------------------------------------------------ *
 * Formatting and mapping. Local on purpose: nothing here reaches into
 * another surface's folder, so a parallel port cannot break this one.
 * ------------------------------------------------------------------ */

function onDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function usd(n: number | null | undefined): string | null {
  const v = n ?? 0;
  if (!v || Number.isNaN(v)) return null;
  return v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

function clockTime(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** The first real sentence of a goal, for the gate's evidence line. */
function firstLine(text: string | null | undefined, max = 150): string | null {
  const line = (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find((l) => l.length > 0);
  if (!line) return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** Anti-scroll: the grid opens short and expands on demand, and it says in
 *  real numbers how many rows it is holding back while it is short. */
const VISIBLE = 8;

/** The empty gate's "describe the next build" sends the caret here. Addressed by
 *  id rather than a ref because the Textarea primitive's prop type is
 *  TextareaHTMLAttributes, which does not carry `ref` (reported as a gap). */
const PROMPT_ID = "build-prompt";

/** The two tab rows on this surface. Each id is a group of element ids, so a
 *  panel can name the tab it belongs to and two rows on one page cannot
 *  collide. */
const VIEW_TABS = "runs-view";
const DOOR_TABS = "runs-door";

/** What a click here left behind. Session-local: the durable record is the run
 *  itself, and a second copy of it would be a second source of one truth. */
type CommitReceipt = {
  id: string;
  verb: string;
  consequence: string;
  handoff: { slug: string } | null;
  at: string;
  failed?: boolean;
};

export const Route = createFileRoute("/_authenticated/runs/")({
  component: BuildPage,
  head: () => ({ meta: [{ title: "Runs · Supaprod" }] }),
  // `view` now carries exactly one meaning again: which view of Runs you are
  // looking at. "board" is the only value read; anything else, including the
  // three dead lens names, reads as the default list. The dead three stay in
  // the enum because /fleet and /delegate still construct them at type level,
  // and because a bookmarked ?view=lane must open something rather than throw.
  // Absent means list, so the default view keeps a clean URL.
  validateSearch: (search: Record<string, unknown>) =>
    z
      .object({
        // Kept, and now only a redirect input. Runs used to open a run in a
        // slide-over at /runs?mission=<id>; it opens the run's own surface now.
        // Old bookmarks and the two in-product "go and look at it" hand-offs
        // still arrive here, so the value is still parsed and then forwarded.
        mission: z.string().optional(),
        view: z.enum(["missions", "agent", "lane", "list", "board"]).optional(),
      })
      .parse(search),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <div className="flex flex-col gap-mrd-6">
        <RunHead
          title="Build did not load."
          sub={(error as Error)?.message ?? "The reason did not come back with the error."}
        />
        {/* A failed read always carries the way out. It used to be a bare
            primary inside an empty Block, which drew a rule over nothing. */}
        <Acts>
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
        </Acts>
      </div>
    </Surface>
  ),
});

/* ------------------------------------------------------------------ *
 * The composer: two doors into the same crew.
 * ------------------------------------------------------------------ */

function Composer({
  startIsPrimary,
  onCommit,
}: {
  /** One primary per screen. When a run is waiting, the gate owns it. */
  startIsPrimary: boolean;
  /** THE COMMIT. The start does not vanish into a toast and does not throw the
   *  person onto another page: it hands back what it caused, and who took it. */
  onCommit: (r: Omit<CommitReceipt, "at">) => void;
}) {
  const fDispatch = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const fStartMission = useServerFn(startOrchestratedMission);
  const fPrds = useServerFn(listPrds);

  // Two entry points into the one list below. "From a spec" dispatches the
  // code-gen loop; "From a goal" is the goal-driven multi-agent run. Outcome
  // first: the goal door is the default.
  const [mode, setMode] = React.useState<"ship" | "goal">("goal");
  const [prompt, setPrompt] = React.useState("");
  const [prdId, setPrdId] = React.useState<string | null>(null);
  const model = DEFAULT_MODEL;

  const prds = useQuery({ queryKey: ["prds"], queryFn: () => fPrds() });
  const approvedPrds = (
    (prds.data?.prds ?? []) as { id: string; title: string; status: string }[]
  ).filter((p) => p.status === "approved");

  // The dispatch repo gate. Set when a dispatch cannot resolve a repo; the
  // dialog offers /sync or (with a spec picked) a starter repo plus auto retry.
  const [repoGate, setRepoGate] = React.useState<{ reason: string | null } | null>(null);

  const dispatch = useMutation({
    mutationFn: () =>
      fDispatch({ data: { prompt: prompt.trim() || undefined, prdId: prdId ?? undefined, model } }),
    onSuccess: (r) => {
      // The arrow is real: this dispatch creates a run on agent_slug 'builder'.
      onCommit({
        id: r.missionId,
        verb: "You handed it over",
        consequence: "Engineer writes the change and opens a pull request. Nothing merges.",
        handoff: { slug: "builder" },
      });
      setPrompt("");
    },
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths; it
      // is a precondition, not a failed write, so it gets no receipt.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else
        onCommit({
          id: `err-${Date.now()}`,
          verb: "Nothing started",
          consequence: e.message,
          handoff: null,
          failed: true,
        });
    },
  });

  // The repo pre-check is a real network wait, so it shows the same pending
  // state as the dispatch itself and blocks a second click from double-firing.
  const [checking, setChecking] = React.useState(false);
  const gatedDispatch = async () => {
    setChecking(true);
    try {
      await gateDispatch({
        check: () => fCanDispatch({ data: { prdId: prdId ?? undefined } }),
        dispatch: () => dispatch.mutate(),
        openGate: (reason) => setRepoGate({ reason }),
      });
    } finally {
      setChecking(false);
    }
  };

  const startRun = useMutation({
    mutationFn: () => fStartMission({ data: { goal: prompt.trim() } }),
    onSuccess: (r) => {
      const queued = r.approvals_queued ?? 0;
      // The arrow is real: createMission sets starting_agent_id to orchestrator.
      onCommit({
        id: r.mission_id,
        verb: "You handed it over",
        consequence:
          queued === 0
            ? "Chief of Staff plans the steps and brings back anything that needs you."
            : queued === 1
              ? "Chief of Staff planned the steps. One call already waits for you."
              : `Chief of Staff planned the steps. ${queued} calls already wait for you.`,
        handoff: { slug: "orchestrator" },
      });
      setPrompt("");
    },
    onError: (e: Error) =>
      onCommit({
        id: `err-${Date.now()}`,
        verb: "Nothing started",
        consequence: e.message,
        handoff: null,
        failed: true,
      }),
  });

  const isPending = mode === "ship" ? checking || dispatch.isPending : startRun.isPending;
  const canStart =
    mode === "ship"
      ? (prompt.trim().length >= 4 || !!prdId) && !isPending
      : prompt.trim().length >= 4 && !isPending;
  const run = () => (mode === "ship" ? void gatedDispatch() : startRun.mutate());

  /**
   * Cmd/Ctrl+Enter starts the run from anywhere inside the composer.
   *
   * THE DEFECT THIS FIXES, found 2026-08-06. The chord used to be an onKeyDown
   * on the TEXTAREA while the keycap was drawn on the Start button fifty lines
   * below it, and nothing tied the two together. On the "From a spec"
   * door the common path is to pick an approved spec from the Select and press
   * go without typing a word, because `canStart` accepts a spec with an empty
   * prompt. Focus is then on the Select, the textarea never saw the keydown,
   * and the button sat there drawing a key that could not fire. The person
   * presses it, nothing happens, and the surface has told them a lie about
   * itself; the second thing they stop trusting is the keycap on every other
   * button. Nothing caught it because both halves are correct in isolation:
   * the handler works, the <kbd> renders, and only opening the file and
   * holding both in your head at once shows that a focus boundary runs between
   * them.
   *
   * WHY HOIST RATHER THAN HIDE THE KEYCAP WHILE THE TEXTAREA IS BLURRED. Both
   * make the promise true; only one of them keeps the promise worth making.
   * Hiding it would mean the fastest path through this surface, pick a spec
   * and go, is the one path with no keyboard, and the person who learned the
   * chord in the goal door would find it gone in the spec door for a reason
   * they can never see. The scope is the composer, not the window, so the
   * chord is still unavailable everywhere it would be ambiguous.
   *
   * WHY THE HOUSE BARE-KEY GUARD IS DELIBERATELY ABSENT. The pattern at
   * _authenticated.today.tsx returns early on a modifier and inside an INPUT,
   * TEXTAREA, SELECT or contenteditable, and it guards BARE keys: keys that a
   * person pressed meaning to type them. This chord is the inverse on both
   * counts. It REQUIRES the modifier, which is what makes it unambiguous, and
   * a textarea is precisely where it is supposed to fire. What the house guard
   * buys elsewhere, this one buys by scope: React bubbles keydown up the tree
   * from the composer's own children and nowhere else, so no other field on
   * the page can lose Cmd+Enter to it. The dialog stays outside this element
   * on purpose, because a portal still bubbles through the React tree and the
   * chord would otherwise fire behind an open repo gate.
   *
   * THE ARROW KEYS ON THE DOOR ROW DO NOT REACH IT EITHER, and that is the
   * same argument from the other end. The tab row moves FOCUS on an arrow and
   * selects on Enter or Space, which is a plain button's own behaviour; a row
   * that selected on focus would switch the door under someone stepping past
   * it. See components/runs/Tabs.tsx.
   */
  const onComposerChord = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;
    if (!canStart) return;
    e.preventDefault();
    run();
  };

  return (
    <>
      <div onKeyDown={onComposerChord}>
        <Tabs
          group={DOOR_TABS}
          label="How to start"
          active={mode}
          onSelect={setMode}
          tabs={[
            { id: "goal", label: "From a goal" },
            { id: "ship", label: "From a spec" },
          ]}
        />

        <TabPanel group={DOOR_TABS} active={mode}>
          <Textarea
            id={PROMPT_ID}
            aria-label={mode === "ship" ? "Describe what to ship" : "Describe the goal"}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              mode === "ship"
                ? "Describe what to ship. Engineer plans it against the connected repo."
                : "Describe the goal, for example: find the three strongest churn signals this week and draft a spec for the biggest fix."
            }
          />

          {mode === "ship" ? (
            <>
              <Field label="Spec">
                <Picker
                  value={prdId ?? ""}
                  onChange={(e) => setPrdId(e.target.value || null)}
                  disabled={approvedPrds.length === 0}
                >
                  <option value="">No spec</option>
                  {approvedPrds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Picker>
              </Field>
              {/* Loading, error and empty each speak for themselves rather than one
                of them wearing another's clothes. */}
              {prds.isError ? (
                <ReadFailed onRetry={() => void prds.refetch()}>
                  The approved specs did not load.
                </ReadFailed>
              ) : !prds.isLoading && approvedPrds.length === 0 ? (
                <NothingYet>
                  No spec is approved yet, so describe the work instead.{" "}
                  {/* The address inside the sentence, drawn as the house's quiet
                      affordance rather than as an inline `--sp-ink` colour. It
                      is a router Link, so the paint is applied here rather than
                      through run-parts' Door, which owns its own element. */}
                  <Link
                    to="/plan"
                    className="rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
                    style={{ transitionDuration: "var(--mrd-d-press)" }}
                  >
                    Approve one in Plan
                  </Link>
                  .
                </NothingYet>
              ) : null}
            </>
          ) : null}

          <Acts>
            <Button
              variant={startIsPrimary ? "primary" : "default"}
              // THE KEYCAP ARRIVES WITH THE KEY AND LEAVES WITH IT. `canStart` is
              // the whole of what the chord tests, so this <kbd> is true by
              // construction rather than by a reader remembering to keep two
              // conditions in step. Drawn unconditionally it promised a key on a
              // dim button that would do nothing at all: an empty composer offers
              // no work to start, and a person who presses the advertised chord
              // there learns that the keycaps on this product are decoration.
              // This is not the surface going quiet under the ratchet. Nothing is
              // removed: the button, its label and the title that says what
              // unlocks it all stay, and the keycap appearing the moment there is
              // something to start is a signal the surface did not have before.
              shortcut={canStart ? "⌘⏎" : undefined}
              disabled={!canStart}
              onClick={run}
              // A disabled control pairs with an explanation: a dim button on its
              // own says nothing about what would unlock it.
              title={
                canStart || isPending
                  ? undefined
                  : mode === "ship"
                    ? "Describe the work in a few words, or pick an approved spec"
                    : "Describe the goal in a few words"
              }
            >
              {isPending ? "Starting" : "Hand it over"}
            </Button>
          </Acts>
        </TabPanel>
      </div>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={prdId}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => dispatch.mutate()}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function BuildPage() {
  const fList = useServerFn(listStudioSessions);
  const fMissions = useServerFn(listMissions);
  const fArchive = useServerFn(setStudioSessionArchived);
  const fDelete = useServerFn(deleteStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  // The active product: a repo can be bound to a PRODUCT, and the dispatch
  // check is blind to that binding without it. See canDispatchToRepo.
  const { activeProductId } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/runs/" });
  const search = Route.useSearch();
  const confirm = useConfirm();

  // One mode, not two toggles. Managing reveals archived runs AND the two
  // actions on them, because they are the same job.
  const [managing, setManaging] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  // The finder is summoned rather than standing open. `Search` is a whole panel,
  // a field AND its own list of matches, so left open over the grid it would
  // render the same runs twice a few pixels apart: the defect this surface
  // already removed once when it killed two of its three renderings of one list.
  const [finding, setFinding] = React.useState(false);
  // Which run the delete is in flight for, so the control that started it is
  // the one that says so. Nothing else on the surface changes.
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [receipts, setReceipts] = React.useState<CommitReceipt[]>([]);

  /* MANAGING IS A VIEW, AND A VIEW MUST NOT COST THE SURFACE ITS DATA.
   *
   * `managing` has to stay in the key. `["studio-sessions", false]` is a shared
   * cache entry: the seven-stage strip on this very page and the board panel
   * both ride it (see use-spine-strip.ts and BoardPanel.tsx), and widening this
   * read to includeArchived: true would orphan /runs onto a second five second
   * poll of the same rows.
   *
   * But a key change lands on an empty cache entry, and every region below was
   * gated on that emptiness, so pressing Manage blanked the whole surface -
   * every row, the gate, the headline, the context column, and the Manage
   * button itself - and slammed it back a moment later. keepPreviousData holds
   * the answer already on screen until the wider one arrives, the same way the
   * top bar's pulse holds its line across a refetch. The rows it holds are
   * true, just not yet the full set; archived ones announce themselves. */
  const sessions = useQuery({
    queryKey: ["studio-sessions", managing],
    queryFn: () => fList({ data: { includeArchived: managing } }),
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  // The connection state is visible before the hand-over, so "not connected" is
  // never discovered as a dispatch failure. Same cache key the composer's gate uses.
  const repoStatus = useQuery({
    queryKey: ["repo-dispatch-check"],
    queryFn: () => fCanDispatch({ data: { productId: activeProductId ?? undefined } }),
    staleTime: 60_000,
  });

  const rows = React.useMemo(() => sessions.data?.sessions ?? [], [sessions.data]);
  /* "NOTHING TO SHOW YET" IS THE QUESTION, NOT "IS A FETCH IN FLIGHT".
   *
   * The regions below used to ask `sessions.isLoading`, which is a fetch state:
   * it goes true again on any read that starts with an empty cache entry, and
   * answering a fetch state by rendering nothing is how a surface that HAS an
   * answer ends up blank. Ask whether an answer is on hand instead.
   *
   * An error IS an answer, so it is excluded here and handled by the branch
   * that follows every use of this flag. Without that exclusion a first load
   * that failed would render nothing at all and never say why. */
  const firstLoad = !sessions.data && !sessions.isError;

  const waiting = React.useMemo(
    () =>
      rows
        .filter((s) => runState(s) === "gate")
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
    [rows],
  );
  const call = waiting[0] ?? null;
  const running = React.useMemo(() => rows.filter((s) => runState(s) === "working").length, [rows]);
  const live = React.useMemo(
    () => rows.filter((s) => ["working", "queued"].includes(runState(s))).length,
    [rows],
  );
  const merged = React.useMemo(
    () => rows.filter((s) => s.changeset?.status === "merged").length,
    [rows],
  );
  const spend = React.useMemo(() => rows.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0), [rows]);
  /** The one claim on this surface a sceptic can click out of the product and
   *  check for themselves. It is a supporting fact, not a decision made here,
   *  so it sits in context rather than taking a block of its own. */
  const shipped = React.useMemo(
    () => rows.find((s) => s.changeset?.status === "merged" && s.changeset?.pr_url) ?? null,
    [rows],
  );

  // HOW FAR THROUGH THE PLAN. The one fact the retired lane board carried that
  // the list did not, taken off the board and put on the row. missionProgress
  // is the same pure, unit-verified function the board used, so the done-status
  // vocabulary is not re-invented here. It only polls while something is live.
  const plan = useQuery({
    queryKey: ["build", "plan-progress"],
    queryFn: () => fMissions({ data: {} }),
    enabled: rows.length > 0,
    refetchInterval: live > 0 ? 5000 : false,
  });
  const progressById = React.useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const m of plan.data?.missions ?? []) map.set(m.id, missionProgress(m.steps));
    return map;
  }, [plan.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-sessions"] });
  // No success toast on either: archiving moves the row and deleting removes
  // it, and the list rendering that IS the consequence. A failure has nowhere
  // on a row to render, so it still speaks.
  const archive = useMutation({
    mutationFn: (v: { missionId: string; archived: boolean }) => fArchive({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (missionId: string) => fDelete({ data: { missionId } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setDeleting(null),
  });

  /* ---- opening a run ----
   * A row goes to the run's own surface. It used to open MissionSlideOver, a
   * component from the retired Obsidian system, over the top of this list.
   *
   * That one choice is why the founder could not find the seven-stage strip on
   * 2026-07-30: /runs/$missionId is the surface that publishes it, and nothing
   * on this board linked there, so the spine was unreachable by clicking. The
   * panel also showed less than the run's own surface does (no strip, no stage
   * panels, a truncated title) while costing a second copy of the same
   * queries, and it turned every error into a success toast, twice.
   *
   * `replace: true` on the redirect keeps Back working: without it, going back
   * from the run would land on the URL that redirects, and bounce forward. */
  const openRun = (missionId: string) =>
    navigate({ to: "/runs/$missionId", params: { missionId } });

  React.useEffect(() => {
    if (!search.mission) return;
    void navigate({
      to: "/runs/$missionId",
      params: { missionId: search.mission },
      replace: true,
    });
  }, [search.mission, navigate]);

  const focusComposer = () => {
    const el = document.getElementById(PROMPT_ID);
    if (!el) return;
    el.focus();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  /* DELETING ASKS FIRST, AND THE QUESTION IS THE HOUSE'S ONE QUESTION.
   *
   * This route used to build its own AlertDialog out of `components/ui/`, and
   * it was the last route file in the product importing from there. `useConfirm`
   * is the same Radix mechanism drawn in house primitives, mounted once above
   * the outlet, so the focus trap, the escape key, the focus return and the
   * inert background are all unchanged and none of them is re-implemented here.
   *
   * TWO THINGS IT CARRIES DIFFERENTLY, both said rather than hidden. The run's
   * name is no longer bolded inside the sentence, because the shared body takes
   * a plain string; it is still named. And the pending state moved off the
   * dialog's own button onto the row's Delete control, which is where the
   * reader's eye already is once the question has closed. */
  const askDelete = async (s: StudioSessionListItem) => {
    const title = stripAutoPrefix(s.title);
    const ok = await confirm({
      title: "Delete this run?",
      body: `This removes the working log and any staged files for ${title}. What it decided stays on the record. To just tidy the list, archive it instead.`,
      confirmLabel: "Delete the run",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(s.mission_id);
    del.mutate(s.mission_id);
  };

  const commit = (r: Omit<CommitReceipt, "at">) => {
    setReceipts((prev) => [{ ...r, at: clockTime() }, ...prev]);
    // The row is the other half of the consequence, so do not make the person
    // wait up to five seconds for the poll to prove the click did something.
    if (!r.failed) void invalidate();
  };

  // The headline is a fact assembled from real counts. It never claims a
  // The headline shows the station name instantly; data fills in from cache.
  // Never say "Reading" — that advertises latency.
  const headline = React.useMemo(() => {
    if (firstLoad) return "Build";
    if (sessions.isError) return "The runs did not load.";
    const ran =
      running === 0
        ? "Nothing is building"
        : running === 1
          ? "One run is building"
          : `${running} runs are building`;
    /* NAME THE NOUN, because two true numbers were reading as one contradiction.
     *
     * This said "41 need you." while the header 200px above said "52 calls need
     * you." Both were correct and they count different things: the header counts
     * CALLS from the approvals queue (pending decisions plus tool-call gates plus
     * memory candidates), and this counts RUNS sitting in a gate state. Several
     * calls can belong to one run, so the two can never be made equal, and
     * forcing them to match would mean one of them lying.
     *
     * A bare "41 need you" leaves the reader to work out which quantity it is,
     * and the standing bar is that a quick glance must not put that load on
     * them. So the noun is said out loud. The seven-stage strip already says
     * "runs waiting on you" for the same reason, and it agrees with this line
     * (39 at Discover plus 2 at Build), so naming it here makes all three
     * numbers reconcilable instead of just two of them. */
    const needs =
      waiting.length === 0
        ? "No run needs you."
        : waiting.length === 1
          ? "One run needs you."
          : `${waiting.length} runs need you.`;
    return `${ran}. ${needs}`;
  }, [firstLoad, sessions.isError, running, waiting.length]);

  /* ---- THE SPINE ----
   * FOUNDER RULING 2026-07-30: "if you click on the run section, why is that
   * seven section bar not showing? 01 to 07, Discover to Learn. That needs to
   * be constantly shown. That needs to be interactive, if I click something
   * should happen. That is the spine of the model."
   *
   * `null` because THIS BOARD IS NOT A STATION. It lists runs, and a run is one
   * piece of work walking all seven stages. Lighting a chip here would claim
   * otherwise, which is the same confusion that once put Build's engine at this
   * route and left the real one unbuilt. The seven chips are on screen with
   * their live counts, and clicking one opens that station's engine.
   *
   * An earlier draft of this made the chips filter this list instead. The
   * founder replaced that with the stronger reading: a chip is a door into the
   * stage, not a lens on a list. One gesture, one meaning, everywhere. */
  useSpineStrip(null);

  // WHICH VIEW. The list is the default and the absence of the key means it,
  // so the plain /runs URL stays clean and the three dead lens names still
  // land somewhere real. Switching writes the choice into the URL, so a board
  // link opens as a board.
  const board = search.view === "board";
  const setView = (next: "list" | "board") =>
    navigate({ search: (prev) => ({ ...prev, view: next === "board" ? "board" : undefined }) });

  /* NOTHING IN THE WORKSPACE IS THE SAME FACT IN BOTH VIEWS, SO IT GETS THE
   * SAME DOOR. The board's empty state carried a button and the list's carried
   * none, off one condition, so pressing Board conjured a way forward that
   * pressing List took away.
   *
   * IT IS A GHOST IN BOTH, and that is the one-primary rule rather than a
   * downgrade. With no rows there is no call waiting, so `startIsPrimary` is
   * true and the composer's "Hand it over" is the screen's primary in both
   * views. A second filled button beside it would make neither of them the
   * one thing to press. The board used to draw a primary here and this is the
   * correction. */
  const nothingYet = (
    <NothingYet
      action={
        <Button variant="ghost" onClick={focusComposer}>
          Describe the next build
        </Button>
      }
    >
      Nothing has been built here yet. Describe the work and the crew plans the steps, writes the
      change, and opens the pull request.
    </NothingYet>
  );

  return (
    <Surface
      // The board is a canvas laid out in columns of its own, so it drops the
      // 74ch prose measure. The composer keeps it, below.
      wide={board}
      // The context column costs 316px plus a 52px gutter, which is the
      // difference between a five column board and a four column one at a 1440
      // window. Its three facts belong to the hand-over job, which is the list.
      context={
        board ? undefined : (
          <>
            {repoStatus.isError ? (
              /* A CHECK THAT DID NOT COME BACK IS NOT A REPO THAT IS NOT
                 CONNECTED. This arm used to be absent: `repoStatus.data ? ...
                 : null` rendered nothing at all when the check failed, so the
                 one precondition every dispatch depends on simply vanished
                 from the surface, and a reader who had read it a minute
                 earlier had no way to notice it had stopped being said. */
              <ContextNote head="Where builds land">
                <ReadFailed onRetry={() => void repoStatus.refetch()}>
                  We could not check where builds land.
                </ReadFailed>
              </ContextNote>
            ) : repoStatus.data ? (
              /* Three states. "Not connected" and "could not tell" send a person
                 to two different places, and saying the first when the truth is
                 the second sends them to connect a repo they already have. See
                 repo-gate.ts. */
              repoStatus.data.resolution === "not_connected" ? (
                /*
                 * THE ONE PRECONDITION ON THIS SURFACE, AND IT GETS THE MERIDIAN
                 * COMPONENT BUILT FOR IT.
                 *
                 * `NeedsSetup` exists for the fact this product kept collapsing
                 * into an empty state: not "nothing is here" and not "the read
                 * failed", but "a precondition is missing, so this cannot ask
                 * its question at all". That is exactly this. A build has to
                 * land somewhere, and with no repo the spec door cannot finish
                 * what it starts -- which the reader currently discovers as a
                 * DISPATCH FAILURE, one click and one wait too late.
                 *
                 * It carries no accent, and meridian.css says why: connecting a
                 * repo is a setup act, not a decision. Dressing it in orchid
                 * sends someone hunting for a call to make, and there is no call
                 * here, only a thing to plug in.
                 *
                 * The copy is unchanged; it is the same sentence, in the slot
                 * the component keeps for it, with "Connect one" promoted from
                 * an inline link to the act it always was.
                 */
                <NeedsSetup
                  kind="upstream"
                  title="Where builds land"
                  body="No repo is connected, so a build has nowhere to open a pull request."
                  thenWhat="a build opens its pull request there and this says which repo."
                  // An anchor wearing the control's face, never a <button>
                  // inside an <a>: this act is a NAVIGATION, so a middle click
                  // and a modifier click have to keep working. See LINK_AS_CONTROL.
                  action={
                    <Link to="/sync" className={LINK_AS_CONTROL}>
                      Connect one
                    </Link>
                  }
                />
              ) : (
                <ContextNote head="Where builds land">
                  {repoStatus.data.resolution === "connected" ? (
                    (repoStatus.data.repo ?? "A connected repo.")
                  ) : (
                    <>
                      We could not read where builds land, so this is not a statement about your
                      setup. A build will still try, and will say what went wrong.
                    </>
                  )}
                </ContextNote>
              )
            ) : null}

            {shipped?.changeset ? (
              <ContextNote head="The last one that landed">
                {agentDisplayName("builder")} wrote it and it is merged into{" "}
                {shipped.changeset.repo}
                {shipped.changeset.pr_number ? (
                  <>
                    {" · "}
                    {/* The one claim here a sceptic can click out of the product
                        and check. An anchor rather than a painted span, because
                        it leaves the app and a middle click has to work. */}
                    <Door href={shipped.changeset.pr_url ?? undefined}>
                      <Figure>#{shipped.changeset.pr_number}</Figure>
                    </Door>
                  </>
                ) : null}
                {onDate(shipped.updated_at) ? (
                  <>
                    {" · "}
                    <Figure>{onDate(shipped.updated_at)}</Figure>
                  </>
                ) : null}
              </ContextNote>
            ) : null}

            {spend > 0 ? (
              <ContextNote head="What these runs cost">
                {/* THIS SENTENCE USED TO READ "Each run stops at the ceiling set
                    in Build." It was unconditional, and this surface never reads
                    the spend policy at all -- there is no `getWorkspaceSpendPolicy`
                    call anywhere in this file. `cap_usd` is nullable and defaults
                    to null (governance.functions.ts), and /build renders that
                    exact case as "No ceiling. A run continues until it finishes or
                    something else stops it."
                    So on any workspace without a cap, this asserted a boundary that
                    did not exist -- on the one number a person uses to decide
                    whether to let an agent run unattended. A safety claim that is
                    false by default is worse than no claim, because it is believed.
                    Corrected 2026-08-10 to name where the control lives rather than
                    to promise what it is doing, which is true whether or not a
                    ceiling is set. Stating the ACTUAL ceiling here would be better
                    still and needs a policy read wired into this route; that is
                    logged for the engineering lane in HANDOFF-ENGINEERING.md. */}
                <Figure>{usd(spend)}</Figure> across <Figure>{rows.length}</Figure>{" "}
                {rows.length === 1 ? "run" : "runs"}. The ceiling that stops a run is set in Build.
              </ContextNote>
            ) : null}
          </>
        )
      }
    >
      {/* THE PAGE'S RHYTHM, STATED HERE RATHER THAN INHERITED.
          The legacy primitives each carried their own margins in the stylesheet,
          so the vertical spacing of this surface was assembled from six files
          nobody could read at once. Meridian's ramp GROWS -- the gap between
          groups is always visibly larger than the gap within one -- and that is
          only true if one place decides it. `--mrd-s6` between the head and the
          views; the panel sets its own `--mrd-s5` under the tab row. */}
      <div className="flex flex-col gap-mrd-6">
        <RunHead
          title={headline}
          sub={
            rows.length > 0 ? (
              <>
                <Figure>{rows.length}</Figure> {rows.length === 1 ? "run" : "runs"} on the record
                {merged > 0 ? (
                  <>
                    {" · "}
                    <Figure>{merged}</Figure> merged
                  </>
                ) : null}
              </>
            ) : null
          }
        />

        {/* The view switch. Same furniture as the composer's two doors, in the
          same position on both views, because a toggle that moves when you use
          it does not read as one control.

          IT IS A REAL TABLIST NOW. Both rows on this file declared `role="tab"`
          and delivered none of what that role promises: a screen reader
          announced "tab, 1 of 2", a person pressed an arrow, and nothing moved.
          Every tab was also its own tab stop, so tabbing through the page
          walked a reader through the choice they had already declined. See
          components/runs/Tabs.tsx, which is the house's two existing answers
          generalised rather than a third copy. */}
        <div>
          <Tabs
            group={VIEW_TABS}
            label="How to read the runs"
            active={board ? "board" : "list"}
            onSelect={setView}
            tabs={[
              { id: "list", label: "List" },
              { id: "board", label: "Board" },
            ]}
          />

          <TabPanel group={VIEW_TABS} active={board ? "board" : "list"}>
            <div className="flex flex-col gap-mrd-6">
              {board ? (
                firstLoad ? (
                  <Reading>Reading the record.</Reading>
                ) : sessions.isError ? (
                  <ReadFailed onRetry={() => void sessions.refetch()}>
                    The runs did not load, so this board is not the whole picture.
                  </ReadFailed>
                ) : rows.length === 0 ? (
                  nothingYet
                ) : (
                  <RunBoard
                    rows={rows}
                    progressById={progressById}
                    showAll={showAll}
                    onShowAll={() => setShowAll((v) => !v)}
                    onOpen={openRun}
                  />
                )
              ) : firstLoad ? null : sessions.isError ? (
                <RunGate standing="failed" question="The runs did not load.">
                  <Button variant="primary" onClick={() => void sessions.refetch()}>
                    Try again
                  </Button>
                </RunGate>
              ) : call ? (
                <RunGate
                  // THE STANDING MARKER IS THE PORT'S ONE ADDITION HERE, and it is not
                  // decoration. Meridian keeps three stopped states apart -- yours,
                  // a condition's, and a failure's -- and this gate used to distinguish
                  // them by the wording of its question alone, so "Nothing is waiting
                  // on you" and "X is waiting on you" were one object in two moods.
                  standing="you"
                  // The stored title carries a machine "[auto]" origin prefix when the
                  // loop raised it. That is where it came from, not copy, and it never
                  // reaches the sentence a person is asked to judge.
                  question={`${stripAutoPrefix(call.title)} is waiting on you.`}
                  lines={
                    [
                      call.pending_approvals > 0 ? (
                        <span key="calls">
                          <Figure>{call.pending_approvals}</Figure>{" "}
                          {call.pending_approvals === 1 ? "call" : "calls"} to settle before it goes
                          on.
                        </span>
                      ) : (
                        <span key="calls">It stopped and cannot go on until a person answers.</span>
                      ),
                      firstLine(call.goal) ? <span key="goal">{firstLine(call.goal)}</span> : null,
                      call.changeset ? (
                        <span key="repo">
                          {call.changeset.repo}
                          {call.changeset.branch ? ` · ${call.changeset.branch}` : ""}
                        </span>
                      ) : null,
                    ].filter(Boolean) as React.ReactNode[]
                  }
                >
                  <Button variant="primary" onClick={() => openRun(call.mission_id)}>
                    Open the run
                  </Button>
                  {waiting.length > 1 ? (
                    /* NAME THE NOUN HERE TOO. `waiting.length` counts RUNS in a gate
               state, and the line three rows above it counts CALLS on the one
               run being shown. A reader just told "3 calls to settle" read a
               bare "Settle all 5" as five calls, and then landed on /approvals,
               which counts calls and shows a third number again. The headline
               above already had this collision named and fixed (see the comment
               on `headline`); the button was missed. It says "all" rather than
               "the other" on purpose: the destination queue holds every waiting
               run including the one on screen. */
                    <Button variant="ghost" onClick={() => navigate({ to: "/approvals" })}>
                      Settle all {waiting.length} runs
                    </Button>
                  ) : null}
                </RunGate>
              ) : (
                /* THE BEST STATE IN THE PRODUCT, AND IT IS THE QUIETEST THING ON THE
             SCREEN. `clear` spends no accent: nothing is asking, so nothing
             should look like it is. */
                <RunGate standing="clear" question="Nothing is waiting on you.">
                  <Button variant="ghost" onClick={focusComposer}>
                    Describe the next build
                  </Button>
                </RunGate>
              )}

              {/* A textarea is prose and keeps the measure, so the composer holds it
          back even where the board around it dropped it.

          THE NUMBER IS WRITTEN OUT, and that is a reported gap rather than a
          preference. It was `var(--sp-main-max)`, which is 74ch and is the
          measure `.sp-main` itself uses; Meridian's own `--mrd-measure` is 68ch.
          Taking the Meridian value here would make the composer NARROWER on the
          board than on the list, which is the exact inconsistency this line was
          added to remove. So the shell's measure is matched literally until the
          shell layout moves to Meridian, which is another lane's file. */}
              <div
                className="flex flex-col gap-mrd-6"
                style={board ? { maxWidth: "74ch" } : undefined}
              >
                <Region
                  title="Hand work over"
                  sub="Anything risky comes back to you before it happens."
                >
                  <Composer
                    // One primary per screen. On the list the gate owns it when a run
                    // is waiting; on the board there is no gate, so the hand-over does.
                    startIsPrimary={(board || !call) && !sessions.isError}
                    onCommit={commit}
                  />
                </Region>

                {receipts.length > 0 ? (
                  <Region title="What you set in motion">
                    {receipts.map((r, i) => (
                      <Commit
                        key={`${r.id}-${i}`}
                        verb={r.verb}
                        consequence={r.consequence}
                        handoff={r.handoff}
                        time={r.at}
                        failed={r.failed}
                      />
                    ))}
                  </Region>
                ) : null}
              </div>

              {board ? null : (
                <Region
                  title="Runs"
                  sub={
                    managing
                      ? "Archived runs are included. What a run decided stays on the record."
                      : undefined
                  }
                  /* THE REGION'S CONTROL IS IN THE REGION'S HEAD, which is where a
               reader looks for one. It used to be the cap toggle ("All 43"),
               and the cap now belongs to the grid, which states both real
               numbers instead of one. Offered only above the cap, because a
               finder over a list you can already see whole is furniture. */
                  more={
                    rows.length > VISIBLE && !firstLoad && !sessions.isError
                      ? finding
                        ? "Close the finder"
                        : "Find a run"
                      : undefined
                  }
                  onMore={() => setFinding((v) => !v)}
                >
                  {/* A COLD LOAD SAYS SO, in the list exactly as it does on the board.
              This arm used to be `null`, so on a first load the region printed
              its "Runs" heading over an empty body: a heading standing over
              nothing, which a person reads as "there is nothing here" rather
              than "we have not read it yet". The board branch above answers the
              SAME `firstLoad` flag with this same reading line, so pressing
              Board made the surface speak and pressing List made it go silent,
              off one variable. Fixed 2026-08-11. */}
                  {firstLoad ? (
                    <Reading>Reading the record.</Reading>
                  ) : sessions.isError ? (
                    // "Nothing here" and "we could not find out" are different facts and
                    // a person acts differently on each, so they never share a shape.
                    <ReadFailed onRetry={() => void sessions.refetch()}>
                      The runs did not load, so this list is not the whole picture.
                    </ReadFailed>
                  ) : rows.length === 0 ? (
                    nothingYet
                  ) : (
                    /* THE GRID ANSWERS THE OTHER TWO FACTS. A filter that hid
                 everything and a cap that is holding rows back are states this
                 surface could not express at all, and both are the grid's:
                 `FilterTable` passes `isFiltered` and `totalBeforeFilter` down
                 so an empty result can never be printed as an empty workspace.
                 The two states above stay HERE, because an empty workspace
                 needs a door and a failed read needs the surface's own voice. */
                    <RunsGrid
                      rows={rows}
                      progressById={progressById}
                      // Exactly one mark on this surface may move, and it is the one
                      // the gate above is asking about. The old list gave every
                      // waiting run the animated state, so a workspace with a dozen
                      // open calls blinked a dozen marks in unison.
                      askingId={call?.mission_id ?? null}
                      managing={managing}
                      // Guarded by the same condition that draws its control. Left
                      // ungated, a finder opened over forty runs would still be on
                      // screen after thirty-seven of them were archived away, with
                      // the control that closes it no longer drawn.
                      finding={finding && rows.length > VISIBLE}
                      onOpen={openRun}
                      onArchive={(s) =>
                        archive.mutate({ missionId: s.mission_id, archived: !s.archived })
                      }
                      onDelete={(s) => void askDelete(s)}
                      archivePending={archive.isPending}
                      deletingId={deleting}
                      maxRows={VISIBLE}
                    />
                  )}

                  {/* The control that turns Managing on has to survive turning it on.
              Gated on isLoading this button removed itself the instant it was
              pressed, so the toggle had no visible off switch for a beat. */}
                  {firstLoad || sessions.isError || rows.length === 0 ? null : (
                    <Acts>
                      <Button variant="ghost" onClick={() => setManaging((v) => !v)}>
                        {managing ? "Done" : "Manage"}
                      </Button>
                    </Acts>
                  )}
                </Region>
              )}
            </div>
          </TabPanel>
        </div>
      </div>
    </Surface>
  );
}
