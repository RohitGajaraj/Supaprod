/**
 * Changes. The interior port (2026-07-29), not a re-skin.
 *
 * WHERE IT SITS. The Build run surface already opened a Block titled "What it
 * produced" and already drew the aggregate Diffstat above the tab row, so this
 * panel owns no masthead of its own and never restates that total. Every
 * section below is a `Block`, which is a rule and a title rather than a card:
 * the seven bordered LOOM_CARDs this file used to draw were seven cards inside
 * one region, which is the cardocalypse ban and the reason the surface read as
 * assembled.
 *
 * WHAT CARRIES MEANING NOW.
 *  - Attribution. Every file, every revision and every hunk in here was written
 *    by the Build agent during this run, and each row says so with the same
 *    mark the surface above uses. The rollback rows do NOT: `studio_rollbacks`
 *    records no actor, so those rows say "unattributed" rather than wearing a
 *    mark that would be a guess.
 *  - Diffstat wherever a line delta is shown, which is now the file rows as
 *    well as the hunks. `computeHunks` returns real base/modified LINE arrays,
 *    and `getStudioSession` runs that same alignment per file, so both levels
 *    carry genuine line counts and both wear the primitive. The rows previously
 *    said "chars" in words because this type had not declared the line columns
 *    the server was already sending; that is fixed at the type, not papered over
 *    at the view.
 *  - Colour. A DIFF DELTA IS ALWAYS GREEN AND RED (founder ruling 2026-08-01:
 *    "we need to display it in red and green ... so that its evident"). This
 *    file used to say monochrome throughout, on the reasoning that colour needs
 *    a legend; a diffstat is the one place in software where it does not, since
 *    plus-green and minus-red is the most universally known convention a
 *    developer surface has. Everything else here stays monochrome, and the
 *    restraint budget is unchanged: warn still marks the one policy breach
 *    (files outside the declared touch list), and the changeset ladder is still
 *    a sentence rather than a coloured chip, because THAT one genuinely needed a
 *    legend.
 *
 * Monaco keeps its own diff colours, the standing code-diff exemption.
 *
 * Every server function, mutation, query key and prop is unchanged.
 */

import { useEffect, useMemo, useState } from "react";
import { Row, Line, Who } from "@/components/meridian/rows";
import {
  Action,
  ActionLink,
  Actions,
  Diffstat,
  Door,
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { Prose } from "@/components/meridian/Prose";
import { Tabs } from "@/components/meridian/Tabs";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import {
  applyStagedHunkSelection,
  generateReleaseNotes,
  generateLaunchKit,
  type LaunchKit,
  getChangesetDiff,
  getChangesetRevisions,
  getStudioSession,
  rejectStagedFile,
  revertToRevision,
  rollbackRelease,
  abandonChangeset,
  getRollbacks,
  generateRollbackNote,
  setChangesetConstraints,
  enforceTouchList,
  type StudioChangesetSummary,
  type StudioConstraints,
  type StudioFileSetPolicy,
} from "@/lib/studio.functions";
import { computeHunks } from "@/lib/ai/studio-hunks";
import { relativeTime } from "@/lib/memory-view";
import { useConfirm, usePrompt } from "@/hooks/use-confirm";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { AgentMark } from "@/components/meridian/marks";
import { CodeDiff, TermFrame, TERM_CONTROL } from "@/components/studio/CodeDiff";

import {
  captureDeployments,
  listDeployments,
  promoteToProduction,
} from "@/lib/deployments.functions";
import { publishChangelogEntry } from "@/lib/changelog.functions";
import { stillWaiting } from "@/lib/query-state";
import { useWorkspace } from "@/hooks/use-workspace";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

/** Everything in this panel was written by the run's Build agent. Same slug the
 *  surface above uses, so the mark means the same thing in both places. */
const BUILDER = "builder";

/**
 * THE TWO PANES, in Meridian tokens.
 *
 * Ported off `.sp-split*` in `primitives.css`, the retired sheet, on the same
 * reasoning `CodeDiff` records: a file can import nothing retired, carry no
 * `--sp-*` token and still be painted entirely by the old system, because a
 * class name is just a string in an attribute.
 *
 * WHY A LOCAL SHEET RATHER THAN UTILITIES. Three of these rules cannot be
 * written as a Tailwind class without losing what they are for:
 *
 *   · A CONTAINER QUERY, and the note it replaces is emphatic about why: this
 *     region is nested inside a work column whose width is not the viewport's,
 *     so a media query would report 1440px while the pane was 800px.
 *   · `scrollbar-width` / `scrollbar-color`, which have no utility.
 *   · `> .cd-term:first-child { margin-top: 0 }`, which is what makes the two
 *     halves start on the same line. The terminal carries a leading margin so
 *     it can stand alone elsewhere; inside the split that margin pushed its
 *     chrome bar below the first file row, and a shared baseline is most of what
 *     makes a split read as one instrument.
 *
 * Every value below is the one it already had. See `runs/RunBoard.tsx` for the
 * same pattern and the same argument.
 */
const SPLIT_CSS = `
.cp-split {
  display: grid;
  /* PROPORTIONAL BUT CAPPED, and measured rather than picked. A pure percentage
   * kept growing the list past any use for it: once the region spanned both
   * columns (1196px) a flat 34% gave the file names 407px, about a hundred more
   * than the longest path needs, and took it from the code. The 240px floor is
   * measured at a 1512px window, where 26% left the rail 215px and a filename
   * plus its stats had nothing left to give.
   *
   * The gutter is 26px and not the page-level aside gap. That gap separates the
   * work from something unrelated; these two panes are one instrument. */
  grid-template-columns: clamp(240px, 30%, 320px) minmax(0, 1fr);
  gap: 0 26px;
  container-type: inline-size;
}
/* THE LIST STICKS, NOT THE DIFF. The page scroller is the surface's own, and
 * nesting a second vertical scroller over the area a person spends all their
 * time in traps the wheel and reads as stuck. So the diff no longer scrolls
 * vertically at all and the narrow rail is the thing that stays in view, which
 * is what VS Code, Cursor and GitHub do anyway.
 *
 * \`align-self: start\` is required for sticky to have anywhere to travel in a
 * grid row, whose default stretch would make the item as tall as the row. */
.cp-list {
  min-width: 0;
  position: sticky;
  top: 0;
  align-self: start;
  /* Generous, so it only ever engages on a genuinely long change set. */
  max-height: 82vh;
  overflow-y: auto;
  /* Room between the last character of a path and the divider. Without it the
   * ellipsis sat on the line. */
  padding-right: var(--mrd-s5);
  border-right: 1px solid var(--mrd-line-soft);
  scrollbar-width: thin;
  scrollbar-color: var(--mrd-line) transparent;
}
.cp-view { min-width: 0; }
.cp-view > .cd-term:first-child { margin-top: 0; }
/* One column below this, because two panes each narrower than a readable line
 * of code is worse than stacking. */
@container (max-width: 780px) {
  .cp-split { grid-template-columns: minmax(0, 1fr); }
  .cp-list {
    max-height: 260px;
    padding-right: 0;
    border-right: 0;
    border-bottom: 1px solid var(--mrd-line-soft);
    padding-bottom: 12px;
  }
}
`;

type ChangeRow = {
  id: string;
  path: string;
  op: string;
  base_chars: number;
  new_chars: number;
  /**
   * REAL LINE COUNTS, and they were on the wire all along.
   *
   * `getStudioSession` has computed these per file since the diffstat fix
   * (studio.functions.ts, `const stat = diffStat(...)`), running the same
   * `computeHunks` alignment this panel renders its hunks from. This type simply
   * never declared them, so the Files rows fell back to `base_chars`/`new_chars`
   * and showed a CHARACTER delta -- a unit that nets to zero when a line is
   * rewritten to the same length or two lines are swapped, both of which are
   * real changes. The panel was showing the weaker number while the stronger one
   * arrived in the same payload and was dropped on the floor.
   */
  added_lines: number;
  removed_lines: number;
};

type DiffRow = {
  id: string;
  path: string;
  op: string;
  base_content: string | null;
  new_content: string | null;
  updated_at: string;
};

/** The ladder said in words. A coloured pill carried this before, which failed
 *  the greyscale test and needed a legend nobody was given. */
const STATUS_SENTENCE: Record<string, string> = {
  staged: "Staged, not committed",
  committed: "Committed to the branch",
  pr_open: "Pull request open",
  merged: "Merged",
  abandoned: "Abandoned",
};

/**
 * A path where the FILENAME is the part that survives.
 *
 * The file list now lives in a narrow left pane, and a plain truncating path
 * ellipsises from the right, which throws away the filename and keeps
 * `src/components/...` on every row. That is precisely backwards: the directory
 * is the shared prefix and the filename is the thing you are looking for.
 *
 * So the directory shrinks and the filename never does, which is what VS Code's
 * and Cursor's file lists do. The full path stays available on hover, since the
 * directory genuinely matters when two files share a name.
 */
function FileName({ path }: { path: string }) {
  const cut = path.lastIndexOf("/");
  const name = cut >= 0 ? path.slice(cut + 1) : path;
  // THE FILENAME ALONE, in the rail.
  //
  // The directory used to sit inline ahead of it and shrink first, which works
  // until the rail is genuinely narrow: at 215px `src/checkout/` collapsed to a
  // single "s" and fused with the name, rendering "suseAddressConfirm.…". A
  // one-character directory stub is strictly worse than no directory, because it
  // reads as part of the filename rather than as a path.
  //
  // So the rail shows the name, which is what you scan for, and the full path is
  // one hover away and spelled out in the terminal's chrome the moment the file is
  // selected. That is what VS Code's and Cursor's file lists do, and for the same
  // reason: a list of paths that share a prefix wastes its width repeating the
  // prefix and truncating the only part that differs.
  return (
    /* `.sp-filename` was: block, min-width 0, ellipsis, nowrap, mono at 12px,
       full ink. Every one of those is a Meridian utility and none of them
       changes value in the move. */
    <span className="font-mrd-mono block min-w-0 truncate text-mrd-small text-mrd-ink" title={path}>
      {name}
    </span>
  );
}

/** Markdown files get a rendered-document view alongside the code diff (docs read as docs, not as text). */
function isMarkdownFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ext === "md" || ext === "mdx";
}

function shortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * A quiet text control inside a row's second line, for the two cases Meridian's
 * `Door` cannot take.
 *
 * `Door` IS THE PRIMITIVE FOR THIS and it is used everywhere else in this file:
 * the deploy addresses, the commit shas, the pull request, the copy control.
 * What it has no slot for is `disabled`, and two controls here genuinely need
 * one -- writing a rollback note and reverting to a revision each fire a server
 * round trip, and both said so by swapping their label while staying live, so a
 * second press started a second call.
 *
 * So this is Door's own paint, at the 13px metadata size the retired
 * `.sp-block-more` fixed it at, plus the dead state. It is written out rather
 * than imported because a component cannot be given a prop it does not have,
 * and reported rather than worked around: `Door` should grow `disabled`, and
 * until it does these two are the honest exception.
 */
/** The ids binding the two scope fields to their labels. Meridian's `Field`
 *  binds by NAME rather than by containment, so a label with no matching id
 *  names nothing. */
const TOUCH_LIST_ID = "studio-scope-touch-list";
const FILE_CAP_ID = "studio-scope-file-cap";

const QUIET =
  "rounded-mrd-xs text-mrd-base text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid disabled:cursor-default disabled:opacity-45";

/**
 * Changes tab: what the run wrote. The file list, the commit history, the
 * declared scope, the ship links, and the per-hunk curation that lets you keep
 * part of a file. Depth is one click: a file opens its diff, a diff opens its
 * hunks.
 */
type SupersededRow = {
  id: string;
  title: string | null;
  status: string | null;
  pr_url: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * THE BUILDS THIS RUN SUPERSEDED, NEWEST FIRST (queue item 27).
 *
 * `getStudioSession` used to return only the latest non-abandoned changeset, so
 * a mission that took three goes showed one and hid two -- and "what did we try
 * before" is precisely the question somebody opens a session to answer. MAIN's
 * read now returns the history, thin on purpose (ids, titles, status, PR); this
 * renders it as doors: a pull request when one exists, a status word always.
 *
 * AN EMPTY ARRAY SAYS NOTHING. It is what a first build looks like, and an
 * empty region over it would be the briefing-dashboard move the design ruling
 * rejects.
 */
function SupersededBuilds({ missionId }: { missionId?: string }) {
  const fSession = useServerFn(getStudioSession);
  const q = useQuery({
    // The SAME cache entry the session page polls: one read serves both, and an
    // invalidation after a rollback or a new build updates this list too.
    queryKey: ["studio-session", missionId],
    queryFn: () => fSession({ data: { missionId: missionId! } }),
    enabled: !!missionId,
    staleTime: 4_000,
  });
  const superseded = (q.data?.superseded ?? []) as SupersededRow[];
  if (!missionId || superseded.length === 0) return null;

  return (
    <Region title="Earlier builds">
      {superseded.map((s) => (
        <Row
          key={s.id}
          tight
          lead={s.title ?? "Untitled change"}
          time={relativeTime(s.updated_at, Date.now())}
          action={
            <>
              <Value tone="quiet">superseded</Value>
              {s.pr_url ? <ActionLink href={s.pr_url}>Open its pull request</ActionLink> : null}
            </>
          }
        />
      ))}
    </Region>
  );
}

export function ChangesPanel({
  changeset,
  changes,
  missionId,
  fileSetPolicy = null,
  constraints = null,
}: {
  changeset: StudioChangesetSummary | null;
  changes: ChangeRow[];
  missionId?: string;
  fileSetPolicy?: StudioFileSetPolicy | null;
  constraints?: StudioConstraints;
}) {
  /** Client navigation for the rollback hand-off. See the rollback onSuccess
   *  below for why this is not a document reload. */
  const navigate = useNavigate();

  /** The file a person explicitly clicked. Null until they click one. */
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  /**
   * The file the right pane is showing, which is never nothing while there are
   * files.
   *
   * DERIVED, NEVER AN EFFECT, the same shape /design uses for its focus: the pane
   * opens on the first file and a click just overrides it. An effect would fight
   * the 4s session poll, and it would also have to guess what to do when the
   * selected file leaves the changeset (hunk curation can drop a file). This
   * self-heals: a selection that is no longer in the list falls back to the first
   * row instead of showing a detail view of something that is gone.
   *
   * A two-pane layout makes this mandatory rather than nice. Stacked, an empty
   * right half was invisible below the fold; side by side it is half the region
   * staring back at you.
   */
  const activePath =
    selectedPath && changes.some((c) => c.path === selectedPath)
      ? selectedPath
      : (changes[0]?.path ?? null);
  const [docView, setDocView] = useState<"diff" | "preview">("diff");

  // NO THEME BRIDGE ANY MORE. Monaco needed one because it carries its own
  // palette and would otherwise render vs-dark inside the light theme; `CodeDiff`
  // is built from `--sp-*` tokens, so it follows the theme for free.
  const builderName = agentDisplayName(BUILDER);
  const fDiff = useServerFn(getChangesetDiff);
  const diff = useQuery({
    queryKey: ["studio-diff", changeset?.id],
    queryFn: () => fDiff({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset && !!activePath,
    staleTime: 10_000,
  });
  const diffByPath = useMemo(() => {
    const map = new Map<string, DiffRow>();
    for (const c of (diff.data?.changes ?? []) as DiffRow[]) map.set(c.path, c);
    return map;
  }, [diff.data]);

  // I1b: the changeset's commit history (newest first).
  const fRevs = useServerFn(getChangesetRevisions);
  const revs = useQuery({
    queryKey: ["studio-revisions", changeset?.id],
    queryFn: () => fRevs({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset,
    staleTime: 10_000,
  });
  const revisions = revs.data?.revisions ?? [];

  const qc = useQueryClient();

  // K2: operator rollback. Revert the branch to a prior revision (a forward,
  // non-destructive commit). Only while the branch is live (committed / pr_open)
  // and never to the latest revision (that is a no-op). Confirm-gated.
  const confirm = useConfirm();
  const fRevert = useServerFn(revertToRevision);
  const canRevert = changeset?.status === "committed" || changeset?.status === "pr_open";
  const revertMut = useMutation({
    mutationFn: (vars: { changesetId: string; revisionId: string }) => fRevert({ data: vars }),
    onSuccess: (res) => {
      toast.success(`Reverted the branch to revision ${res.restored_from_revision_no}.`);
      qc.invalidateQueries({ queryKey: ["studio-revisions", changeset?.id] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not revert to that revision."),
  });

  // I1: operator curation (per-hunk reject + drop file), only before commit.
  const canCurate = changeset?.status === "staged";
  const [rejected, setRejected] = useState<Set<number>>(new Set());
  useEffect(() => setRejected(new Set()), [activePath]);
  useEffect(() => setDocView("diff"), [activePath]);
  const fApply = useServerFn(applyStagedHunkSelection);
  const fReject = useServerFn(rejectStagedFile);
  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["studio-session"] });
    if (changeset) qc.invalidateQueries({ queryKey: ["studio-diff", changeset.id] });
  };
  const applyMut = useMutation({
    mutationFn: (vars: { path: string; rejectedHunkIds: number[]; expectedUpdatedAt?: string }) =>
      fApply({
        data: {
          changesetId: changeset!.id,
          path: vars.path,
          rejectedHunkIds: vars.rejectedHunkIds,
          expectedUpdatedAt: vars.expectedUpdatedAt,
        },
      }),
    onSuccess: () => {
      toast.success("Rejected hunks reverted to base.");
      setRejected(new Set());
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not apply the selection."),
  });
  const rejectFileMut = useMutation({
    mutationFn: (path: string) => fReject({ data: { changesetId: changeset!.id, path } }),
    onSuccess: () => {
      toast.success("File dropped from the changeset.");
      setSelectedPath(null);
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not drop the file."),
  });

  // SEAM-2 SHIP: merge is not the end; a live URL is. A merged changeset on a
  // Supaprod-managed repo gets an automatic preview deploy (ci-poll-tick); the
  // one human promote click moves production and is recorded as an approval.
  const fDeployments = useServerFn(listDeployments);
  /**
   * THE WORKSPACE WAS DROPPED HERE AND THE READ STILL ANSWERED, WHICH IS WHY IT
   * SURVIVED.
   *
   * This passed `{ changesetId }` alone. `listDeployments`
   * (deployments.functions.ts) resolves an absent `workspaceId` through
   * `current_user_default_workspace()`, and that RPC is
   * `ensure_user_default_workspace`, which returns the caller's EARLIEST
   * `workspace_members` row -- not the workspace they are standing in. The
   * handler then filters `.eq("workspace_id", ...)` on top of the changeset
   * filter, so a run in any other workspace came back with zero deploy rows and
   * this panel reported that as an empty deploy record: "It deploys on its own
   * after a merge" for ever, "Nothing to promote until the preview is up", and
   * no Promote button, over a change that already has a successful production
   * deploy on the record.
   *
   * Verified live on 2026-08-06: two users hold deployments outside their
   * earliest membership, and for one of them that is ALL of them.
   *
   * `wid` IS THE ACTIVE WORKSPACE, NOT THE CHANGESET'S OWN, and that is the
   * limit of what this file can fix. A run opened by URL while the shell is
   * switched to a different workspace still reads empty. The durable fix is one
   * line in `listDeployments`: when `changesetId` is supplied, scope by that
   * changeset's own `workspace_id` rather than the caller's default -- RLS still
   * enforces access, and it would fix every caller at once, including
   * `_authenticated.runs.$missionId.tsx`, which makes this same call without a
   * workspace and whose Production stage marker dies with it.
   *
   * AND THAT FILE IS THIS PAGE, NOT A SIBLING SURFACE. `runs.$missionId.tsx`
   * RENDERS this panel (at its ChangesPanel mount) and separately runs the same
   * deploy read at :607-608 under the OLD key `["changeset-deployments",
   * changeset?.id]` with no workspace, feeding `productionDeployed` into the
   * stage rail directly above. Before this fix both readers shared one key, one
   * cache entry and one wrong answer; now they are two queries, so on a run
   * whose workspace is not the caller's earliest membership the rail can say
   * production is not reached while this block, inches below it, prints the
   * production URL. That is not a reason to revert: the half that is right is
   * the half a person acts on, and a contradiction on screen is how a silent
   * wrong answer finally becomes visible. It does raise the `listDeployments`
   * one-liner above from tidy-up to the thing that closes this. Two smaller
   * effects, both bounded: two requests where there was one, and the rail no
   * longer inherits this query's 30s `refetchInterval` -- though the
   * invalidations below still reach its key by prefix, so its staleness is
   * capped at the next press rather than unbounded.
   *
   * ENABLED WAITS FOR A WORKSPACE. Without that gate the first paint of every
   * session fires the read with no workspace, which is precisely the request
   * whose answer is guaranteed to be about the wrong one. /ship gates every read
   * the same way.
   *
   * THE KEY GAINS `wid` LAST, so a workspace switch cannot serve the previous
   * tenant's rows, and every existing `["changeset-deployments", id]`
   * invalidation still reaches it: react-query matches query keys by prefix.
   */
  const { activeWorkspaceId } = useWorkspace();
  const wid = activeWorkspaceId ?? "";
  const deploymentsQ = useQuery({
    queryKey: ["changeset-deployments", changeset?.id, wid],
    queryFn: () => fDeployments({ data: { changesetId: changeset!.id, workspaceId: wid } }),
    enabled: !!changeset && changeset.status === "merged" && !!wid,
    refetchInterval: 30_000,
  });
  const deploymentRows = (deploymentsQ.data?.deployments ?? []) as Array<{
    id: string;
    environment: string;
    status: string;
    deploy_url: string | null;
    /**
     * WHO WROTE THE ROW, and it decides whether promote can do anything with
     * it. `listDeployments` has always selected this column
     * (deployments.functions.ts, the select list) and it is NOT NULL in the
     * table; this cast simply never declared it, so the panel could not tell a
     * preview Supaprod served from one it merely read off the customer's repo.
     * 'deno' is our own hosting; anything else is a captured row.
     */
    provider: string | null;
  }>;
  /**
   * Did Supaprod's own hosting publish this deploy? The server asks exactly
   * this (`provider === "deno"` on the preview it promotes), so the button and
   * the act behind it cannot disagree. A row with NO provider cannot come from
   * `listDeployments`, so the absent case is a constructed object and is read
   * as ours rather than withheld on a guess.
   */
  const isHostedDep = (d: { provider: string | null }) => (d.provider ?? "deno") === "deno";
  /**
   * THE TWO PREVIEW READS ARE DIFFERENT QUESTIONS, and collapsing them is what
   * drew a Promote button over a click that could only fail.
   *
   * `previewDep` is the newest successful preview carrying an address, whoever
   * built it: a real door a person can open, so it is shown. `hostedPreviewDep`
   * is the one promote can actually move, because
   * `promoteChangesetToProductionCore` takes the preview's commit and redeploys
   * that repo's files to Deno hosting -- the right act only for a preview Deno
   * served in the first place. Promoting a captured Vercel or Netlify preview
   * would push an unbuilt copy of someone's repo to a Deno app and call it
   * production, so the server refuses it outright.
   */
  const previewDep = deploymentRows.find(
    (d) => d.environment === "preview" && d.status === "success" && d.deploy_url,
  );
  const hostedPreviewDep = deploymentRows.find(
    (d) => d.environment === "preview" && d.status === "success" && d.deploy_url && isHostedDep(d),
  );
  const productionDep = deploymentRows.find(
    (d) => d.environment === "production" && d.status === "success" && d.deploy_url,
  );
  /**
   * A FAILED REFRESH IS NOT A LOST READ, and react-query v5 keeps `data`
   * through one.
   *
   * This query polls every 30 seconds (`refetchInterval` above), so one network
   * blip sets `isError` while every row from the last good read is still in
   * hand. Gating the whole block on `isError` alone took the preview address
   * and the Promote button off a screen that had been showing both a second
   * earlier -- an affordance taken away over a blip, on rows we still had.
   *
   * So the two cases are asked separately. `deploymentsUnread` is the read that
   * never landed: there is nothing true to draw, so only the failure and its
   * retry are drawn. `deploymentsStale` still has rows, so the rows and the
   * promote stay and the failure is said ALONGSIDE them, retry included.
   */
  const deploymentsUnread = deploymentsQ.isError && !deploymentsQ.data;
  const deploymentsStale = deploymentsQ.isError && !!deploymentsQ.data;
  /**
   * A QUERY THAT HAS NOT BEEN ALLOWED TO RUN IS STILL A READ THAT HAS NOT
   * HAPPENED, and `isLoading` alone does not say so.
   *
   * The query above is now `enabled` only once a workspace is known, and a
   * disabled query in react-query v5 is pending WITHOUT fetching, so `isLoading`
   * is false for the whole first paint of a session. Read on its own it would
   * fall straight through to the rows branch with an empty array and this block
   * would answer "Nothing to promote until the preview is up." before anything
   * had been asked -- the confident wrong answer the comment further down says
   * these branches exist to prevent, reintroduced by the gate that fixed the
   * workspace.
   *
   * `stillWaiting` RATHER THAN `!wid || deploymentsQ.isLoading`, WHICH IS WHAT
   * THIS LINE USED TO SAY. The two agree on the case above -- a disabled query
   * is pending, so both call it a wait -- but `stillWaiting` also covers a
   * query that is enabled and pending WITHOUT fetching, which is what a paused
   * or offline client looks like, and it is the shared helper
   * (src/lib/query-state.ts) rather than a fourth hand-rolled copy of the same
   * rule. /ship asks the same question the same way over its own reads.
   */
  const deploymentsReading = stillWaiting(deploymentsQ);
  const retryDeployments = () => void deploymentsQ.refetch();
  const fPromote = useServerFn(promoteToProduction);
  const promoteMut = useMutation({
    mutationFn: () => fPromote({ data: { changesetId: changeset!.id } }),
    /**
     * THE HALF-RECORDED PROMOTE REACHES THIS DOOR TOO.
     *
     * `promoteChangesetToProductionCore` ships the code first and then closes
     * the loop behind it: the Trust Ledger receipt, the spec's shipped stamp,
     * the 30-day outcome window. Any of those writes can be refused while the
     * deploy itself is perfectly live, so the server returns `warnings` -- one
     * sentence per thing that did not get recorded. Dropping them here made a
     * promote that recorded nothing look byte-identical to a clean one.
     *
     * WARN, NOT ERROR. The deploy did reach production, so the success still
     * says so first and the warnings follow it, each already carrying its own
     * next move. /ship's Receipt says the same thing in the same order.
     */
    onSuccess: (res) => {
      const warnings = res.warnings ?? [];
      toast.success(`Live in production: ${res.productionUrl}`);
      warnings.forEach((w) => toast.warning(w));
      qc.invalidateQueries({ queryKey: ["changeset-deployments", changeset?.id] });
      // SHIP READS THIS WRITE TOO, and only this line tells it so. The promote
      // upserts a production `deployments` row, and that row IS what
      // `listChangelog` resolves into each entry's `production_url` on every
      // read -- the column is derived, not stored, so nothing about
      // `changelog_entries` changes and no invalidation of it happens for free.
      // Without this a `["changelog", wid]` cache from before the promote goes
      // on reporting the release as not yet in production. The capture below
      // does the same thing for the same reason; see its note for why the
      // prefix rather than `["changelog", wid]`.
      qc.invalidateQueries({ queryKey: ["changelog"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Promote failed."),
  });

  /**
   * ASK THE PROVIDER AGAIN, ON DEMAND -- the in-app half of the capture the
   * cron runs, which until now had no door anywhere in the product.
   *
   * WHY IT HAS TO EXIST HERE. ci-poll-tick stops asking 60 minutes after the
   * merge (DEPLOY_CAPTURE_WINDOW_MS), and that bound is a GitHub rate-limit
   * decision rather than a belief that an hour is enough. A pipeline slower than
   * that -- a queued Actions job, a manual approval gate, a nightly release --
   * publishes its deployment into a product that has stopped listening, and with
   * no control the block below reads "Nothing to promote until the preview is
   * up" for the life of the account while every merge ships somewhere else.
   *
   * IT IS NOT AUTO-FIRED, and that is deliberate rather than lazy. One press
   * costs roughly seven GitHub calls (the merged PR, the deployments list, up to
   * five status reads) against a 5,000/hour installation limit, which is the
   * whole reason the cron's window is bounded in the first place. So it is a
   * press, never a mount effect and never an interval.
   *
   * `captured: 0` IS A REAL ANSWER, NOT A FAILURE -- WHEN THE PROVIDER
   * ANSWERED, and the response says which it was. `captureDeployments` returns
   * `read` beside the count, and `zeroCaptureMessage` has already chosen the one
   * true sentence from it, so that sentence is shown verbatim because it is the
   * RIGHT one and not because the two cases are indistinguishable from here.
   * They are not: "your pipeline has not published one yet" goes out at info
   * weight, and a read that never reached the provider goes out as an error,
   * because info weight over a failed read is exactly how a failure gets
   * narrated to a person as an empty record. /ship's door onto this same call
   * draws the same line on its Receipt -- two doors onto one act must not tell
   * one person two different stories about it.
   *
   * Only a refusal -- not merged, no usable repo, GitHub not connected, no
   * provable landed commit, an upsert RLS refused -- throws, and every one of
   * those arrives as a plain sentence already fit to read.
   */
  const fCapture = useServerFn(captureDeployments);
  const captureMut = useMutation({
    mutationFn: () => fCapture({ data: { changesetId: changeset!.id } }),
    onSuccess: (res) => {
      if (res.captured > 0) {
        toast.success(res.message);
        qc.invalidateQueries({ queryKey: ["changeset-deployments", changeset?.id] });
        // AND SHIP, BECAUSE A CAPTURED PRODUCTION ROW IS WHAT SHIP READS AS THE
        // RELEASE'S ADDRESS. `listChangelog` does not store `production_url`; it
        // derives it per read from `deployments` (environment=production,
        // status=success) and hangs it on the entry, so a row written here
        // changes /ship's answer without touching `changelog_entries` at all. A
        // `["changelog", wid]` cache taken before this press then serves the old
        // address, or none. Same prefix, and for the same reason, as the publish
        // below: the entry belongs to the CHANGESET's workspace, which this panel
        // cannot assume is the one the shell is switched to. /ship is not mounted
        // here, so nothing refetches now -- this only stops it serving a cache
        // that predates the row.
        qc.invalidateQueries({ queryKey: ["changelog"] });
      } else if (res.read === "answered") {
        // NOTHING TO INVALIDATE. No row was written, so a refetch would only
        // spend another request to redraw the same block.
        toast.info(res.message);
      } else {
        // NOTHING WAS ASKED, OR THE ASK NEVER LANDED. The same missing row and
        // so the same missing invalidation, but this zero is not news about the
        // customer's pipeline and must not wear the weight that says it is.
        // ("no-repo" cannot reach this branch: the handler's parseRepo guard
        // throws before the read, and a throw lands on onError below.)
        toast.error(res.message);
      }
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not check for deploys."),
  });

  /**
   * PUT THIS MERGE ON SHIP -- the repair path for a release that shipped and
   * never appeared there.
   *
   * WHAT IT CAN AND CANNOT FIX, because the difference is the whole of the copy.
   * `changelogRowFor` declines any changeset that is not merged or whose release
   * notes are empty, and empty notes are the common case: live on 2026-08-06 the
   * dogfood workspace holds nine merged changesets, eight of them with no notes
   * and therefore no `changelog_entries` row and therefore invisible on /ship.
   * For those eight this call correctly returns `published: false` with
   * `reason: "no-release-notes"`, and its message names the real repair --
   * "Write them" on this very Block, after which
   * `trg_studio_changeset_to_changelog` materializes the entry by itself and
   * this control is not needed at all. So the control is offered only where the
   * notes already exist, and the Empty below says the rest in words.
   *
   * `published: false` IS NOT A FAILURE. Nothing went wrong; the data is not
   * publishable, so it is a warning and it does not invalidate. A genuine
   * refusal (row-level security, a constraint, a lost race) throws instead, and
   * those messages are plain English already.
   *
   * PRESSING IT TWICE IS SAFE AND MEANS SOMETHING: the second press refreshes
   * the existing entry against the change's current title, notes and pull
   * request rather than adding a second one.
   */
  const fPublishEntry = useServerFn(publishChangelogEntry);
  const publishEntryMut = useMutation({
    mutationFn: () => fPublishEntry({ data: { changesetId: changeset!.id } }),
    onSuccess: (res) => {
      if (res.published) {
        toast.success(res.message);
        // THE PREFIX, NOT ["changelog", wid]. The entry belongs to the
        // CHANGESET's workspace, and this panel can be open on a run whose
        // workspace is not the one the shell is switched to -- the same gap the
        // deploy read above documents. Invalidating the prefix reaches
        // whichever ["changelog", <id>] cache holds it, and /ship is not
        // mounted here anyway, so nothing is refetched now: this only stops it
        // serving a cache that predates the row.
        qc.invalidateQueries({ queryKey: ["changelog"] });
      } else {
        toast.warning(res.message);
      }
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not list it on Ship."),
  });

  // F-BUILDER-MULTIFILE: scope policy (touch list + max-files cap). The editor
  // declares it; "Apply scope" drops the out-of-policy files before the commit.
  const outOfPolicy = useMemo(
    () => new Set(fileSetPolicy?.outOfPolicy ?? []),
    [fileSetPolicy?.outOfPolicy],
  );
  const [editScope, setEditScope] = useState(false);
  const [pathsDraft, setPathsDraft] = useState("");
  const [capDraft, setCapDraft] = useState("");
  const openScopeEditor = () => {
    setPathsDraft((constraints?.allowed_paths ?? []).join("\n"));
    setCapDraft(constraints?.max_files != null ? String(constraints.max_files) : "");
    setEditScope(true);
  };
  const fSetConstraints = useServerFn(setChangesetConstraints);
  const fEnforce = useServerFn(enforceTouchList);
  const setScopeMut = useMutation({
    mutationFn: (vars: { allowedPaths: string[]; maxFiles: number | null }) =>
      fSetConstraints({ data: { missionId: missionId!, ...vars } }),
    onSuccess: () => {
      toast.success("Scope saved.");
      setEditScope(false);
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not save the scope."),
  });
  const enforceMut = useMutation({
    mutationFn: () => fEnforce({ data: { changesetId: changeset!.id } }),
    onSuccess: (res) => {
      const n = res.removed.length;
      toast.success(
        n ? `Dropped ${n} out-of-scope file${n === 1 ? "" : "s"}.` : "Already in scope.",
      );
      refetchAll();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not apply the scope."),
  });
  const saveScope = () => {
    const allowedPaths = pathsDraft
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const parsed = parseInt(capDraft.trim(), 10);
    const maxFiles =
      capDraft.trim() === "" || !Number.isFinite(parsed) || parsed < 1 ? null : parsed;
    setScopeMut.mutate({ allowedPaths, maxFiles });
  };

  // K1: release notes for the changeset (generate/regenerate; persisted server-side).
  const fGenNotes = useServerFn(generateReleaseNotes);
  const genNotesMut = useMutation({
    mutationFn: () => fGenNotes({ data: { changesetId: changeset!.id } }),
    onSuccess: () => {
      toast.success("Release notes generated.");
      qc.invalidateQueries({ queryKey: ["studio-session"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not generate release notes."),
  });

  // LCH-01: draft a launch kit from the shipped changeset (ephemeral, no send).
  const [launchKit, setLaunchKit] = useState<LaunchKit | null>(null);
  const fGenKit = useServerFn(generateLaunchKit);
  const genKitMut = useMutation({
    mutationFn: () => fGenKit({ data: { changesetId: changeset!.id } }),
    onSuccess: (kit: LaunchKit) => {
      setLaunchKit(kit);
      toast.success("Launch kit drafted. Review and copy what you need.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not draft the launch kit."),
  });

  // K2: rollback controls (roll back merged release, kill in-flight change).
  const promptDialog = usePrompt();
  const fRollback = useServerFn(rollbackRelease);
  const rollbackMut = useMutation({
    mutationFn: (reason: string) =>
      fRollback({
        data: {
          changesetId: changeset!.id,
          reason,
        },
      }),
    onSuccess: (result) => {
      /* A ROUTER NAVIGATION, NOT A DOCUMENT RELOAD, and the difference matters
       * most precisely here.
       *
       * This used to be `window.location.href = "/studio/" + id`, on the
       * ROLLBACK SUCCESS PATH -- the highest-stakes action in the product, and
       * the one moment a person most needs to feel the system is in control of
       * itself. It cost three things at once. A full document reload threw away
       * the client cache and every optimistic state the surface was holding.
       * Then `/studio/$id` redirected to `/build/$id`, which redirected again to
       * `/runs/$id`, so the reload was followed by two more round trips. The
       * user pressed "roll back" and watched the application blank and rebuild
       * itself, which reads as a crash rather than as a rollback.
       *
       * Going straight to /runs/$id is correct both now and after the
       * engineering lane collapses the redirect chain, since the intermediate
       * routes are being kept as redirects so existing links survive.
       *
       * The toast also stopped narrating the mechanism. "Navigating to revert
       * session" describes what the code is doing; the operator needs to know
       * what happened to their software. */
      toast.success("Rolling back. Opening the revert run.");
      void navigate({ to: "/runs/$missionId", params: { missionId: result.revertMissionId } });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Rollback failed."),
  });

  const fAbandon = useServerFn(abandonChangeset);
  const abandonMut = useMutation({
    mutationFn: (reason: string) =>
      fAbandon({
        data: {
          changesetId: changeset!.id,
          reason,
        },
      }),
    onSuccess: () => {
      toast.success("Change killed. PR closed and claims released.");
      qc.invalidateQueries({ queryKey: ["studio-session"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not kill the change."),
  });

  const fRollbackHistory = useServerFn(getRollbacks);
  const rollbackHistory = useQuery({
    queryKey: ["studio-rollback-history", changeset?.product_id ?? null],
    queryFn: () =>
      fRollbackHistory({
        data: { productId: changeset!.product_id! },
      }),
    enabled: !!changeset?.product_id,
    staleTime: 10_000,
  });
  const rollbacks = rollbackHistory.data?.rollbacks ?? [];

  const fGenRollbackNote = useServerFn(generateRollbackNote);
  const noteMut = useMutation({
    mutationFn: (rollbackId: string) => fGenRollbackNote({ data: { rollbackId } }),
    onSuccess: () => {
      toast.success("Rollback note generated.");
      rollbackHistory.refetch();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not generate the note."),
  });

  const triggerRollback = async () => {
    const reason = await promptDialog({
      title: "Roll back this release",
      body: "Opens a revert PR that restores the touched paths to their pre-merge state. It still passes CI and your review before it merges.",
      label: "Reason (optional)",
      placeholder: "Why are you rolling this back?",
      confirmLabel: "Open revert PR",
    });
    if (reason !== null) {
      rollbackMut.mutate(reason || "Operator-initiated rollback");
    }
  };

  const triggerAbandon = async () => {
    const ok = await confirm({
      title: "Kill this change?",
      body: "Closes the PR and releases file claims. This cannot be undone.",
      confirmLabel: "Kill change",
      destructive: true,
    });
    if (ok) abandonMut.mutate("Operator-abandoned");
  };

  if (!changeset) {
    /* `NothingHere`, the bordered half, would be right where a whole region is
       missing. This replaces the panel's ENTIRE body inside a tab that already
       draws its own frame, so the bare half is the one that does not put a box
       inside a box. */
    return (
      <NothingYet>
        Nothing is staged. {builderName} writes each file in here as it works.
      </NothingYet>
    );
  }

  /**
   * NOTES THE SERVER WOULD ACCEPT, not merely a column that is not empty.
   *
   * `shouldPublishChangelog` (src/lib/changelog.ts) is `status === "merged" &&
   * !!(release_notes && release_notes.trim())`, so a whitespace-only value is
   * not release notes as far as anything downstream is concerned:
   * `changelogRowFor` declines it and `publishChangelogEntry` answers
   * `published: false, reason: "no-release-notes"`. Read here as a plain truthy
   * value it drew a "List it on Ship" button whose only reachable outcome was
   * that refusal -- the very control the gate below says it exists to prevent
   * -- above a recessed box holding nothing but the whitespace.
   *
   * ONE TEST, THREE USES, so the header's label, the body and the button cannot
   * drift from each other or from the server. The Block's own existence check
   * stays truthy on purpose: with whitespace in the column the section must
   * still appear, and say it has no notes, rather than vanish.
   */
  const hasReleaseNotes = !!changeset.release_notes?.trim();

  const selected = activePath ? diffByPath.get(activePath) : null;
  /**
   * A FAILED REFRESH IS NOT A LOST READ, and the diff owes the reader the same
   * answer the deploy query above already gives.
   *
   * This block was gated on `diff.isError` alone, twelve lines from the query
   * that had been fixed, so the two halves of one file disagreed about what a
   * blip means. The diff does not poll, but `refetchOnMount` defaults to true
   * and the client retries once (router.tsx), so a background refetch that
   * fails while `diff.data` is still in hand replaced a perfectly readable diff
   * with the Failed state -- the file taken off the screen of someone who was
   * reading it, over a read they never asked for.
   *
   * HELD IS ASKED PER FILE, NOT PER QUERY, and that is the difference from
   * `deploymentsUnread`. The held page need not carry the path now selected
   * (curation drops a file, the builder adds one), and for that file there is
   * nothing true to draw -- so it takes the unread arm rather than showing a
   * "this is the last diff that loaded" note over a diff that never loaded.
   */
  const diffUnread = diff.isError && !selected;
  const diffStale = diff.isError && !!selected;
  // Same pure diff the server applies, so hunk ids line up between UI and server.
  const hunks = selected
    ? computeHunks(selected.base_content ?? "", selected.new_content ?? "")
    : [];

  const scopeDeclared = !!fileSetPolicy && (fileSetPolicy.hasTouchList || fileSetPolicy.hasCap);
  const scopeBreach =
    scopeDeclared && !fileSetPolicy!.clean
      ? [
          fileSetPolicy!.outOfPolicy.length
            ? `${fileSetPolicy!.outOfPolicy.length} outside the touch list`
            : "",
          !fileSetPolicy!.withinCap
            ? `${fileSetPolicy!.overBy} over the cap of ${fileSetPolicy!.maxFiles}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    /* THE PANEL'S RHYTHM, STATED HERE RATHER THAN INHERITED FROM A STYLESHEET.
       The retired `Block` carried a 36px margin, 40px of top padding and a
       hairline above every region, so the space between sections lived in
       `primitives.css`. Meridian's `Region` draws no frame and no margin at all
       on purpose: the composition owns its own rhythm, and `gap-mrd-6` is the
       step every ported surface uses between regions. */
    <div className="flex flex-col gap-mrd-6">
      <style href="mrd-changes-split" precedence="medium">
        {SPLIT_CSS}
      </style>

      {/* Identity. Repo, where it sits on the ladder, and the two ways to end it. */}
      <Line
        label={<Num>{changeset.repo}</Num>}
        sub={
          <>
            {STATUS_SENTENCE[changeset.status] ?? changeset.status}
            {changeset.branch ? (
              <>
                {" on "}
                <Num>{changeset.branch}</Num>
              </>
            ) : null}
          </>
        }
      >
        {/* ── ROLL BACK AND KILL ARE NOT RED, AND THAT IS THE COLOUR LAW
               RATHER THAN A PREFERENCE ─────────────────────────────────────
            Both of these undo or destroy, and the reflex is to paint them the
            failure colour. Under Meridian red REPORTS AN OUTCOME -- something
            went wrong, and it already has -- so spending it on an INTENT says
            the wrong tense: a roll back that has not happened yet is not a
            failure, and a control that shouts before it is pressed makes the
            row it sits on read as broken. Orchid is not available either; that
            one means a person is required, which is a gate, not a destructive
            act.
            What protects a destructive act here is DISTANCE plus a CONFIRM, and
            both are already in place: these sit at the trailing edge of the
            identity line, away from everything else on the panel, and
            `triggerRollback` and `triggerAbandon` each open a typed confirm
            before anything happens. `Actions`' own `trailing` slot records the
            same rule in the same words.
            `quiet` is the Meridian face for the retired `ghost`: muted ink, no
            border, a hover wash. */}
        {changeset.status === "merged" ? (
          <Action variant="quiet" busy={rollbackMut.isPending} onClick={triggerRollback}>
            {rollbackMut.isPending ? "Rolling back" : "Roll back"}
          </Action>
        ) : null}
        {["staged", "committed", "pr_open"].includes(changeset.status) ? (
          <Action variant="quiet" busy={abandonMut.isPending} onClick={triggerAbandon}>
            {abandonMut.isPending ? "Killing" : "Kill this change"}
          </Action>
        ) : null}
      </Line>

      {/* The builds this run superseded, newest first. Empty on a first build
          and deliberately silent about it. */}
      <SupersededBuilds missionId={missionId} />

      {/* FILES FIRST, DIRECTLY UNDER THE TAB THAT SELECTS THEM.

          This block used to render LAST, after Where it is live, Release notes,
          Launch kit, Rollbacks, Revisions and Scope. The Changes tab sits at the
          top of the panel, so pressing it moved the diff about six hundred pixels
          below the control that asked for it, and the outcome of the run was
          off screen. Founder hit this on the live app: the tab looked like it did
          nothing.

          A tab must reveal its content adjacent to itself. Everything else in this
          panel is context ABOUT the change; the change itself is the answer to
          'what did this run produce', so it goes first. */}
      <Region title="Files">
        {changes.length === 0 ? (
          <NothingYet>{builderName} has not written a file into this changeset yet.</NothingYet>
        ) : (
          /* THE LIST AND THE DIFF SIT BESIDE EACH OTHER, not one above the other.
             FOUNDER, 2026-08-01: "why don't we build this terminal next to each
             other? Say, when I click the file in the file's name, it should open
             on the right side immediately. We have the space left and right. Why
             is it opening below? ... If it is below, we need to scroll a lot."

             He is right, and the reference class is unanimous: VS Code, Cursor and
             GitHub's pull-request review all put the changed-file list beside the
             diff. The old stacked layout meant every file you clicked pushed its
             own diff below the fold, so reading four files was four scroll
             journeys down and back up, and the file you were comparing against
             had already left the screen.

             Each pane scrolls independently, which is what actually kills the
             long scroll: the list stays put while the diff moves. */
          <div className="cp-split">
            {/* POLITE, NOT SILENT: Build stages files while a person watches,
                and the 30s poll that brings them otherwise mutates this list
                without a word. Additions announce; identical polls do not. */}
            <div
              className="cp-list"
              role="tablist"
              aria-live="polite"
              aria-label="Files this run changed"
            >
              {changes.map((c) => {
                const active = c.path === activePath;
                return (
                  <Row
                    key={c.id}
                    tight
                    focused={active}
                    marks={<AgentMark slug={BUILDER} state="quiet" />}
                    lead={<FileName path={c.path} />}
                    sub={
                      <>
                        {c.op} · <Diffstat added={c.added_lines} removed={c.removed_lines} />
                        {/* `--sp-warn` WAS A SIXTH STATUS COLOUR IN A SYSTEM
                            WITH FIVE WORDS. Meridian has no "warn": what this
                            says is that the file is WAITING ON A CONDITION --
                            the operator has declared a touch list and this path
                            is not inside it, so the change cannot be considered
                            in scope until somebody moves one or the other. That
                            is exactly `--mrd-hold`. Not red, because nothing has
                            failed; not orchid, because that promises a control
                            that releases it and the control is elsewhere. */}
                        {outOfPolicy.has(c.path) ? (
                          <span className="text-mrd-hold"> · outside the list</span>
                        ) : null}
                      </>
                    }
                    // NO DESELECT. It used to toggle, which in a two-pane layout
                    // empties the right half and leaves a person looking at
                    // nothing after clicking the row they were already reading. A
                    // file browser selects; it does not un-select.
                    onClick={() => setSelectedPath(c.path)}
                  />
                );
              })}
            </div>

            <div className="cp-view">
              {/* NO HEADER ROW HERE. The path, the comparison and the file's own
                  action all moved INTO the terminal's chrome and status line,
                  because a header above a box that has its own header is two
                  headers for one thing. That duplication is a good part of what
                  read as congested, and it cost a whole row of height above the
                  code on every file you opened. */}
              {/* MERIDIAN'S OWN TAB ROW, AND IT BRINGS THE KEYBOARD WITH IT.
                  This was a hand-rolled `.sp-tabs` carrying `role="tablist"` and
                  `role="tab"` and none of the rest of the contract: every tab
                  was its own tab stop, the arrow keys did nothing, and no panel
                  named the tab it belonged to. `role="tab"` PROMISES that
                  keyboard -- a screen reader announces "tab, 1 of 2" and a
                  person presses an arrow -- so a half-built tablist is worse
                  than two plain buttons. `Tabs` is that contract, written once. */}
              {activePath && isMarkdownFile(activePath) ? (
                <Tabs
                  group="studio-doc-view"
                  label="How to read this file"
                  active={docView}
                  onSelect={setDocView}
                  tabs={[
                    { id: "diff", label: "Diff" },
                    { id: "preview", label: "Read it" },
                  ]}
                />
              ) : null}

              {/* THE FILE STAYS AND THIS SAYS WHAT IT IS: the last diff that
                  loaded, not what is on the branch right now. It sits ABOVE the
                  branch below, never inside one arm of it, and `diffStale` and
                  `diffUnread` cannot both be true, so it never stacks with the
                  Failed. */}
              {diffStale ? (
                <ReadFailedLine onRetry={() => void diff.refetch()} error={diff.error} retryLabel="Read it again">
                  This is the last diff that loaded; the refresh just now did not land, so this file
                  may have changed since. {(diff.error as Error)?.message?.slice(0, 160)}
                </ReadFailedLine>
              ) : null}

              {diffUnread ? (
                // A failed read is not an empty state. It names its cause and offers
                // the retry, because "nothing here" and "we could not find out" are
                // different facts.
                /* THE TERMINAL'S OWN BOX, borrowed from `CodeDiff` rather than
                   rebuilt, so a failed read sits in the same frame the diff
                   would have. Two boxes that disagree about their own shape is
                   how a design system stops being one. */
                <TermFrame>
                  <div style={{ padding: "var(--mrd-s5) 14px" }}>
                    <ReadFailedLine onRetry={() => void diff.refetch()} error={diff.error}>
                      The diff did not load. {(diff.error as Error)?.message?.slice(0, 160)}
                    </ReadFailedLine>
                  </div>
                </TermFrame>
              ) : diff.isLoading || !selected ? (
                // ONE LINE, NOT A 420px BOX. This was a fixed-height panel holding
                // three words, which is the largest single piece of the "unexplained
                // blank space" and it appeared on every file you opened.
                <Reading>Reading the diff.</Reading>
              ) : activePath && isMarkdownFile(activePath) && docView === "preview" ? (
                <TermFrame>
                  {/* No inner vertical scroller here either, for the same reason
                      as the diff body: a scroll container nested inside the
                      page's own scroller traps the wheel and the page reads as
                      stuck. The document is as tall as it is and the page
                      carries it. */}
                  <div style={{ padding: "var(--mrd-s5) 20px" }}>
                    <ChatMarkdown content={selected.new_content ?? ""} />
                  </div>
                </TermFrame>
              ) : (
                <CodeDiff
                  base={selected.base_content ?? ""}
                  next={selected.new_content ?? ""}
                  path={activePath ?? undefined}
                  actions={
                    canCurate && activePath ? (
                      /* THE CHROME CONTROL SIZE, not the house control size.
                         `Action` is a 32px button with its own padding, which is
                         right for something a surface is asking you to do; this
                         sits inside a 34px terminal title bar beside Inline /
                         Split / Wrap, and at the house size the bar would be
                         half as tall again as the code it labels. `CodeDiff`
                         exports the class for exactly this reason.
                         AND IT IS NOT RED. Dropping a file is destructive and it
                         is an INTENT: red reports an outcome. What guards it is
                         that it acts on the one file whose name is in the bar
                         beside it. */
                      <button
                        type="button"
                        className={TERM_CONTROL}
                        disabled={rejectFileMut.isPending}
                        onClick={() => rejectFileMut.mutate(activePath)}
                      >
                        {rejectFileMut.isPending ? "Dropping" : "Drop file"}
                      </button>
                    ) : null
                  }
                />
              )}

              {/* Per-hunk curation. These numbers ARE lines (computeHunks returns
              base and modified line arrays), so the diffstat is honest here. */}
              {canCurate && selected && hunks.length > 0 ? (
                <>
                  <Line
                    label={
                      <>
                        <Num>{hunks.length}</Num> {hunks.length === 1 ? "hunk" : "hunks"}
                      </>
                    }
                    sub="Tap one to reject it. Rejecting puts those lines back to base."
                  >
                    <Action
                      disabled={applyMut.isPending || rejected.size === 0}
                      title={
                        rejected.size === 0 ? "Tap a hunk below to reject it first" : undefined
                      }
                      onClick={() =>
                        applyMut.mutate({
                          path: activePath as string,
                          rejectedHunkIds: [...rejected],
                          expectedUpdatedAt: selected.updated_at,
                        })
                      }
                    >
                      {applyMut.isPending
                        ? "Reverting them"
                        : rejected.size === 0
                          ? "Revert the rejected"
                          : `Revert ${rejected.size}`}
                    </Action>
                  </Line>
                  {hunks.map((h) => {
                    const isRejected = rejected.has(h.id);
                    const preview = (h.modifiedLines[0] ?? h.baseLines[0] ?? "")
                      .trim()
                      .slice(0, 80);
                    return (
                      <Row
                        key={h.id}
                        tight
                        focused={isRejected}
                        marks={<AgentMark slug={BUILDER} state="quiet" />}
                        lead={<Num>{preview || "(blank line)"}</Num>}
                        sub={
                          <>
                            <Diffstat added={h.modifiedLines.length} removed={h.baseLines.length} />{" "}
                            {isRejected ? "Rejected, goes back to base" : `Hunk ${h.id + 1}`}
                          </>
                        }
                        onClick={() =>
                          setRejected((prev) => {
                            const next = new Set(prev);
                            if (next.has(h.id)) next.delete(h.id);
                            else next.add(h.id);
                            return next;
                          })
                        }
                      />
                    );
                  })}
                </>
              ) : null}
            </div>
          </div>
        )}
      </Region>

      {/* SEAM-2 SHIP: the preview, the one human promote, and the live URL. */}
      {changeset.status === "merged" ? (
        <Region
          title="Where it is live"
          /* THE DOOR ONTO THE CAPTURE, at the weight this file already uses for
             a per-section act ("Write them" below is the same slot, the same
             class, and the same in-flight label swap). It is quiet on purpose:
             the deploy record filling itself in is the normal path, and this is
             the way out of the case where it did not.

             ── `act`, NOT `goTo` AND NOT `toggle`, AND THE GUARD IS NOW THE
                COMPONENT'S RATHER THAN THE HANDLER'S ──────────────────────
             This was `Block`'s `more`/`onMore`, which `Region` splits three
             ways. It is not `goTo`: nothing is navigated, and a reader who
             takes it as a link will not expect it to spend a GitHub round
             trip. It is not `toggle`: that emits `aria-expanded`
             unconditionally, and telling a screen reader this button expands
             something is an incorrect ARIA state, which is worse than none
             because it is believed. It DOES something to this region's
             subject, so it is `act`.
             `acting` is the half `Block` could not express, and this file said
             so in its own words: the label swapped to "Checking" while the
             button stayed live, so the handler had to refuse the second press
             itself. `Region` disables the control and announces `aria-busy`,
             which is the same fact told once. */
          act={captureMut.isPending ? "Checking" : "Check for deploys"}
          acting={captureMut.isPending}
          onAct={() => captureMut.mutate()}
        >
          {/* A READ THAT DID NOT HAPPEN IS NOT AN EMPTY DEPLOY RECORD. Without
              these two branches a failed or in-flight `deploymentsQ` collapsed
              to [], and this block answered "Nothing to promote until the
              preview is up." with the Promote button hidden -- a confident
              wrong answer, and a permanent one on error, since nothing retried
              and nothing said so. The empty-state sentence is still below,
              where it is now only said when the read genuinely returned no
              deploy.

              AND A FAILED REFRESH IS NOT A READ THAT DID NOT HAPPEN. The
              Failed branch is gated on `deploymentsUnread` (error AND no data),
              never on `isError` alone, so a blip in the 30-second poll cannot
              take the address and the Promote button off the screen. With rows
              in hand the failure becomes a note above them and they stay: see
              `deploymentsStale` below. /ship answers this same question over
              its own two queries in `_authenticated.ship.tsx`; keep the two
              shapes the same. */}
          {deploymentsUnread ? (
            <ReadFailedLine onRetry={retryDeployments}>
              Where this change is serving did not load, so anything said here would be a guess.{" "}
              {(deploymentsQ.error as Error)?.message?.slice(0, 160)}
            </ReadFailedLine>
          ) : deploymentsReading ? (
            <Reading>Reading where this change is serving.</Reading>
          ) : (
            <>
              {/* THE ROWS STAY AND THIS SAYS WHAT THEY ARE: the last read that
                  landed, not what is serving right now. A stale address is
                  still a door a person can open.

                  WHAT THE SERVER GUARANTEES, AND ONLY THAT. Promote acts on the
                  server's own read of the preview row rather than on this one:
                  `promoteChangesetToProductionCore` re-selects the newest
                  successful 'deno' preview itself and throws on a captured one,
                  so the click cannot ship a preview this panel misread. It says
                  NOTHING about whether the button belongs here. Both conditions
                  that draw it (`!productionDep && hostedPreviewDep`) are read
                  off these same stale rows, and the server does not check for
                  an existing production deploy, so rows old enough can leave
                  Promote over a release someone has promoted since -- and that
                  click deploys production again rather than refusing. The note
                  below is the whole of the warning a person gets before it, and
                  it is the price of keeping the control: hiding a promote on a
                  blip is the affordance this split exists to protect.

                  IT SAYS "THE RECORD", NOT "THESE ROWS", because a read that
                  landed and returned zero deploys is stale in exactly the same
                  way and this sentence sits directly above "Nothing to promote
                  until the preview is up." Naming rows there would name rows
                  that do not exist. */}
              {deploymentsStale ? (
                <ReadFailedLine onRetry={retryDeployments} retryLabel="Read it again">
                  This is the deploy record as it last loaded, which may be no deploys at all; the
                  refresh just now did not land, so this may have moved since.{" "}
                  {(deploymentsQ.error as Error)?.message?.slice(0, 160)}
                </ReadFailedLine>
              ) : null}
              <Line
                label="Preview"
                sub={
                  previewDep ? (
                    <>
                      {/* `Door` with an `href`: an outbound address, so the
                          element follows the destination rather than the paint.
                          It carries its own `target` and `rel`, which this call
                          site was spelling by hand and getting half right
                          (`rel="noreferrer"` without `noopener`). */}
                      <Door href={previewDep.deploy_url!}>
                        <Num>{previewDep.deploy_url}</Num>
                      </Door>
                      {!hostedPreviewDep ? (
                        <span style={{ display: "block" }}>
                          Your own pipeline published this one, not Supaprod. Supaprod read it from
                          your repository&rsquo;s deployment record.
                        </span>
                      ) : null}
                    </>
                  ) : (
                    // NOT "it deploys on its own after a merge". That is true
                    // only where Supaprod does the deploying; said to a
                    // customer whose repo Supaprod does not host, it is a
                    // promise about an event that never arrives, and they read
                    // it every time they look.
                    "Supaprod deploys the preview itself for a repo it hosts, usually within about two minutes of the merge. For a repo it does not host, it records the preview your own pipeline publishes, once that pipeline reports it."
                  )
                }
              />
              <Line
                label="Production"
                sub={
                  productionDep ? (
                    <Door href={productionDep.deploy_url!}>
                      <Num>{productionDep.deploy_url}</Num>
                    </Door>
                  ) : hostedPreviewDep ? (
                    "Nobody has moved it yet. This is the one call that reaches customers."
                  ) : previewDep ? (
                    // THE SAME ANSWER THE SERVER GIVES when it refuses this
                    // promote, so the two doors onto the act cannot tell a
                    // person two different stories. It names no provider: the
                    // only provider on a captured row is the repo host, which
                    // capture stamps "github", so naming it would tell a
                    // Netlify customer their preview came from github. The
                    // address above is the thing that does point at the builder.
                    "This preview was published by your own pipeline, not by Supaprod, so there is nothing here to move to production. Promote it where it was built; Supaprod records the production deploy once your provider reports it."
                  ) : (
                    "Nothing to promote until the preview is up."
                  )
                }
              >
                {/* GATED ON THE HOSTED PREVIEW, not on any preview. Drawn over
                    a captured row, this button could only land on the server's
                    refusal -- a control promising an act it cannot perform,
                    which is the exact defect this surface exists to prevent. */}
                {!productionDep && hostedPreviewDep ? (
                  /* AN `Action`, NOT AN `Approve`, AND THE TEST IS WHAT THE
                     CLICK DOES. `Approve` is the one control that RELEASES
                     something held: a gate is open, the work has stopped, and
                     the press is what lets it carry on. Nothing is held here --
                     the preview is up and sitting there, and this starts a
                     deploy that nobody was waiting on. It is still the primary
                     act on this surface and it still reaches customers, which
                     is what `variant="primary"` is for: the one neutral stop on
                     the ladder nothing else uses. */
                  <Action
                    variant="primary"
                    busy={promoteMut.isPending}
                    onClick={() => promoteMut.mutate()}
                  >
                    {promoteMut.isPending ? "Promoting" : "Promote to production"}
                  </Action>
                ) : null}
              </Line>
            </>
          )}
        </Region>
      ) : null}

      {/* K1 release notes: the ship artifact for this changeset. */}
      {changeset.release_notes || changes.length > 0 || revisions.length > 0 ? (
        <Region
          title="Release notes"
          /* `act`: this dispatches a model run that writes the notes. Not
             `toggle` (it reveals nothing and must not claim `aria-expanded`),
             not `goTo` (nothing is navigated). `acting` replaces the handler's
             own `isPending` guard, so the control is dead and announced busy
             rather than live behind a swapped label. */
          act={
            genNotesMut.isPending ? "Writing" : hasReleaseNotes ? "Write them again" : "Write them"
          }
          acting={genNotesMut.isPending}
          onAct={() => genNotesMut.mutate()}
        >
          {/* `Prose` IS THE PRIMITIVE FOR THIS, and it is what the local RECESS
              object was hand-rolling: agent-written prose in a recess, never a
              card, so it is the one container in its region. Its stops are the
              retired ones to the pixel.
              ONE THING IT DOES NOT CARRY, reported rather than worked around:
              `overflow-wrap: anywhere`. The object it replaces set it, and
              `Prose` sets `whitespace-pre-wrap`, which invites a long unbroken
              token (a URL in a release note) to push the column sideways. */}
          {hasReleaseNotes ? (
            <Prose>{changeset.release_notes}</Prose>
          ) : (
            <NothingYet>
              {builderName} has not drafted notes for this changeset yet.
              {/* WHY A MERGED CHANGE CAN BE MISSING FROM SHIP, said where the
                  person is standing when they wonder. Ship's release layer is
                  spined on `changelog_entries`, and that row is materialized
                  only from a merged changeset carrying release notes, so a merge
                  with none is invisible there -- eight of the nine merges in the
                  dogfood workspace on 2026-08-06. The repair is the control
                  already at the top of this Block, not a new one: saving the
                  notes fires the database trigger that writes the entry. */}
              {changeset.status === "merged"
                ? ' This change has merged, and Ship lists a release only once there is something to read, so it is not on Ship until these exist. "Write them" above is the whole of the repair: the release appears on its own as soon as they are saved.'
                : ""}
            </NothingYet>
          )}
          {/* THE SECOND HALF OF THE SAME REPAIR, for the case the first half
              cannot reach: notes exist, the merge happened, and Ship still does
              not list it -- the entry the trigger should have written never
              landed, or it landed and has since drifted from the change.

              OFFERED ONLY WITH NOTES IN HAND, because without them this call
              can only decline, and a control whose one outcome is a refusal is
              the defect this whole pass is about. With no notes the Empty above
              names the real next step instead.

              AND "IN HAND" MEANS THE SERVER'S TEST, NOT A TRUTHY COLUMN: this
              read `changeset.release_notes` while `shouldPublishChangelog`
              requires `.trim()`, so whitespace alone drew the button and bought
              a guaranteed `reason: "no-release-notes"`. `hasReleaseNotes` is
              that same test, made once.

              NOT A PRIMARY BUTTON. Promote is the primary act on this surface
              and it reaches customers; this one reconciles a record. */}
          {changeset.status === "merged" && hasReleaseNotes ? (
            <Actions>
              <Action busy={publishEntryMut.isPending} onClick={() => publishEntryMut.mutate()}>
                {publishEntryMut.isPending ? "Listing it" : "List it on Ship"}
              </Action>
            </Actions>
          ) : null}
        </Region>
      ) : null}

      {/* LCH-01 launch kit: drafted from the ship, never sent. */}
      {changeset.release_notes || revisions.length > 0 ? (
        <Region
          title="Launch kit"
          sub="Drafts only. Nothing is sent, so copy what you want to use."
          /* `act` again: drafting a launch kit runs a model. Same three-way
             split, same reason. */
          act={genKitMut.isPending ? "Drafting" : launchKit ? "Draft it again" : "Draft it"}
          acting={genKitMut.isPending}
          onAct={() => genKitMut.mutate()}
        >
          {launchKit
            ? (
                [
                  ["Changelog", "changelog"],
                  ["Blog", "blog"],
                  ["Email", "email"],
                  ["Social", "social"],
                  ["Docs", "docs"],
                ] as const
              ).map(([label, key]) =>
                launchKit[key] ? (
                  <div key={key}>
                    <Line label={label}>
                      {/* No `htmlFor`: `Line`'s own note says a `<label for>`
                          pointing at a BUTTON would make the label a second way
                          to fire it, which is wrong for a control that acts
                          rather than holds a value. */}
                      <Door
                        onClick={() =>
                          navigator.clipboard
                            ?.writeText(launchKit[key])
                            .then(() => toast.success(`${label} copied`))
                            .catch(() => toast.error("Could not copy"))
                        }
                      >
                        Copy
                      </Door>
                    </Line>
                    <Prose>{launchKit[key]}</Prose>
                  </div>
                ) : null,
              )
            : null}
        </Region>
      ) : null}

      {/* K2: rollback history for this product. The record names no actor, so
          neither does the row. */}
      {rollbacks.length > 0 ? (
        <Region title="Rollbacks">
          {rollbacks.map((rb) => (
            <div key={rb.id}>
              <Row
                tight
                lead={rb.reason}
                sub={
                  <>
                    {rb.status === "reverted" ? "Reverted" : "Revert open"}
                    {/* studio_rollbacks records no actor. Saying so is honest;
                        putting a mark here would be a guess. */}
                    {" · unattributed"}
                    {rb.revert_pr_number ? (
                      <>
                        {" · "}
                        <Door
                          href={`https://github.com/${changeset.repo}/pull/${rb.revert_pr_number}`}
                        >
                          PR <Num>{rb.revert_pr_number}</Num>
                        </Door>
                      </>
                    ) : null}
                    {!rb.note ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className={QUIET}
                          disabled={noteMut.isPending}
                          onClick={() => noteMut.mutate(rb.id)}
                        >
                          {noteMut.isPending && noteMut.variables === rb.id
                            ? "Writing the note"
                            : "Write the note"}
                        </button>
                      </>
                    ) : null}
                  </>
                }
                time={shortDate(rb.created_at)}
              />
              {rb.note ? <Prose>{rb.note}</Prose> : null}
            </div>
          ))}
        </Region>
      ) : null}

      {/* I1b revision history: one row per studio.commit, newest first. */}
      {revisions.length > 0 ? (
        <Region title="Revisions">
          {revisions.map((r, i) => (
            <Row
              key={r.id}
              tight
              marks={<AgentMark slug={BUILDER} state="quiet" />}
              lead={r.message || "No message"}
              sub={
                <>
                  <Who>{builderName}</Who> committed <Num>{r.files.length}</Num>{" "}
                  {r.files.length === 1 ? "file" : "files"}
                  {" · "}
                  {r.commit_url ? (
                    <Door href={r.commit_url}>
                      <Num>{r.commit_sha.slice(0, 7)}</Num>
                    </Door>
                  ) : (
                    <Num>{r.commit_sha.slice(0, 7)}</Num>
                  )}
                  {canRevert && i > 0 ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        className={QUIET}
                        disabled={revertMut.isPending}
                        onClick={async () => {
                          const ok = await confirm({
                            title: `Revert to revision ${r.revision_no}?`,
                            body: `Creates a new commit on ${changeset.branch ?? "the branch"} that restores every file to revision ${r.revision_no} (${r.commit_sha.slice(0, 7)}). It moves history forward, so the revert is itself revertible.`,
                            confirmLabel: "Revert",
                          });
                          if (!ok) return;
                          revertMut.mutate({ changesetId: changeset.id, revisionId: r.id });
                        }}
                      >
                        Go back to here
                      </button>
                    </>
                  ) : null}
                </>
              }
              time={shortDate(r.created_at)}
            />
          ))}
        </Region>
      ) : null}

      {/* F-BUILDER-MULTIFILE: the declared touch list and cap, read live against
          the staged files, with one click to get back inside it. */}
      {missionId ? (
        <Region
          title="Scope"
          sub={
            scopeDeclared ? (
              scopeBreach ? (
                /* `--mrd-hold`, for the same reason the file rows use it: the
                   change is waiting on a condition -- the touch list or the cap
                   has to move, or the files do -- and nothing has failed. */
                <span className="text-mrd-hold">{scopeBreach}</span>
              ) : (
                <>
                  <Num>{fileSetPolicy!.fileCount}</Num>{" "}
                  {fileSetPolicy!.fileCount === 1 ? "file" : "files"}, all inside the touch list.
                </>
              )
            ) : (
              // "Anywhere in the repo" was scarier than the truth and hid the
              // floor that does exist: assertStudioPathAllowed refuses CI
              // configs, migrations, env files and lockfiles at the write seam,
              // whatever the operator has or has not declared. Naming that floor
              // is what makes the ABSENCE of a touch list readable as a choice
              // rather than as an oversight.
              `No touch list and no cap. ${builderName} may write anywhere except CI, migrations, env and lockfiles, which are always refused.`
            )
          }
          /* THE ONE `toggle` ON THIS PANEL, and the only `more` that was ever a
             disclosure. It reveals the scope editor in place: it navigates
             nowhere and dispatches nothing, so `goTo` and `act` are both wrong,
             and `toggled` is the half the retired prop could not express -- the
             label swapped between "Edit" and "Close" for anyone who could see
             it and announced nothing at all to anyone who could not. */
          toggle={editScope ? "Close" : "Edit"}
          toggled={editScope}
          onToggle={() => (editScope ? setEditScope(false) : openScopeEditor())}
        >
          {canCurate && fileSetPolicy?.hasTouchList && fileSetPolicy.outOfPolicy.length > 0 ? (
            <Actions>
              {/* NOT RED. Dropping the out-of-scope files destroys staged work,
                  and red reports an OUTCOME rather than an intention. What
                  protects it is that the sub-line directly above states exactly
                  how many files are outside the list before anyone presses. */}
              <Action busy={enforceMut.isPending} onClick={() => enforceMut.mutate()}>
                {enforceMut.isPending ? "Dropping them" : "Drop the files outside it"}
              </Action>
            </Actions>
          ) : null}
          {editScope ? (
            /* MERIDIAN'S `Field` DOES NOT WRAP ITS CONTROL. The retired one
               rendered a `<label>` around the child and bound the two by
               containment; this one binds BY NAME, so a Field with no
               `htmlFor`/`id` pair silently has no accessible name at all. Both
               pairs are written out below. */
            <div className="flex flex-col gap-mrd-5">
              <Field label="Touch list, one path per line" htmlFor={TOUCH_LIST_ID}>
                <Textarea
                  id={TOUCH_LIST_ID}
                  value={pathsDraft}
                  onChange={(e) => setPathsDraft(e.target.value)}
                  placeholder={"src/lib/\nsrc/components/studio/**"}
                  rows={4}
                  spellCheck={false}
                />
              </Field>
              <Field label="Most files it may touch" htmlFor={FILE_CAP_ID}>
                <Input
                  id={FILE_CAP_ID}
                  type="number"
                  min={1}
                  value={capDraft}
                  onChange={(e) => setCapDraft(e.target.value)}
                  placeholder="no cap"
                  style={{ maxWidth: 140 }}
                />
              </Field>
              <Actions>
                <Action busy={setScopeMut.isPending} onClick={saveScope}>
                  {setScopeMut.isPending ? "Saving" : "Save the scope"}
                </Action>
              </Actions>
            </div>
          ) : null}
        </Region>
      ) : null}

      {/* The files themselves, each with its real line delta in green and red.
          FOUNDER RULING 2026-08-01: a diff number is read at a glance or it is
          not read, and grey numerals are not read. These rows used to carry a
          monochrome character count precisely BECAUSE characters are not lines
          and the diffstat shape reads as lines -- honest, and solving the wrong
          half of the problem, since the real line counts were already in the
          payload. Now the unit and the colour agree, so the shape claims exactly
          what it is. */}
    </div>
  );
}
