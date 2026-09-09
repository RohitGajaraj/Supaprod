/**
 * THE RECORD SHIP KEEPS, MOUNTED ON OUTCOMES.
 *
 * ── WHY IT MOVED HERE (2026-09-09) ────────────────────────────────────────
 * These regions were the body of `/ship`, and P-14b (A-QUEUE.md) already
 * ruled the route is deleted once Outcomes carries its blocks. Learn went
 * first the same morning (53155ae45, `components/learn/LearnRecord.tsx`);
 * this is the same fold, region for region and in the order `/ship` drew
 * them, under Outcomes' artifacts tab:
 *
 *   1. where it is live, the addresses that are actually answering;
 *   2. merged, not listed yet -- the merge the changelog cannot see, with
 *      the two doors that repair it;
 *   3. live releases, each with the rollback behind the prompt it already
 *      had;
 *   4. what shipped, and the release document for the row in focus;
 *   5. announcements and the composer that writes one;
 *   6. the first-run drawing, "what a release will look like here".
 *
 * NOTHING ABOUT THE READS CHANGED. Every query key is the one `/ship` used
 * -- ["changelog", wid], ["announcements", wid], ["deployments", wid],
 * ["what-shipped-applied", wid || null] -- so this block and the artifacts
 * tab above it cannot disagree about the same workspace.
 * `_authenticated.ship.tsx` is a redirect to `/outcomes?tab=artifacts` now.
 *
 * ── WHAT A COMPONENT CANNOT CARRY, AND WHERE EACH PIECE WENT ──────────────
 * FOUR THINGS THE ROUTE OWNED ARE DROPPED, and the page above draws every
 * one of them. `useSpineStrip("ship")` lit the spine for a station that no
 * longer has a page of its own. `<Surface>` and `CrewWorking` are Outcomes':
 * one surface frame and one crew indicator per page, never two. The route's
 * `errorComponent` belonged to a route, so Outcomes owns the crash now.
 *
 * THE PAGE HEADING IS THE ONE THAT WOULD HAVE BEEN A LOSS, so it is not
 * dropped. Outcomes owns the `<h1>`; `shipHeadline`'s sentence -- the one
 * that keeps "waiting on an approver" apart from "waiting on you", which is
 * the whole reason that helper exists -- leads this block as an `mrd-meta`
 * line with the gap sentence beside it. It says nothing at all while the
 * counts are unknown, which is the null contract `shipHeadline` documents:
 * a heading that cannot know its count does not guess zero.
 *
 * THE CONTEXT COLUMN HAD NOWHERE TO GO, because Outcomes' margin is
 * Outcomes'. Both of its sentences moved into the flow beside the decision
 * each one explains, as `CtxBody` -- the shape this file already renders
 * in-flow beneath the first-run drawing. "What promote does" sits under the
 * promote's own Ask, and where a published announcement can be read sits
 * under the gate that publishes it. Not a word of either was cut.
 *
 * ── THE ROUTE'S OWN HEADER FOLLOWS, WORD FOR WORD ─────────────────────────
 * Everything below is the argument `/ship` carried, unedited: the five
 * answers, the keep/move/kill pass, the three acts the station was named
 * for, the release document, and the merge with no release notes. It is the
 * reasoning behind every region in this file, and none of it moved with the
 * route.
 */

/**
 * Ship. Redesigned, not re-skinned (docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the five answers. The
 * first port pass grew it from 147 lines to 690 by keeping every panel the
 * retired page had and swapping the components underneath. This is the pass
 * that decides what actually belongs.
 *
 * 1. WHO IS HERE, AND WHY. An owner or an admin who has a change ready for the
 *    world and wants it said out loud. Two minutes, one act, and they leave
 *    with something public.
 *
 * 2. THE ONE THING IT EXISTS FOR. Taking a change public: writing the
 *    announcement, sending it up, and publishing it at /p/<slug>. Nowhere else
 *    in the product does anything become readable by a stranger. Everything
 *    else here either feeds that act or was removed.
 *
 * 3. KEEP / MOVE / KILL, on what the port left standing. Checked against the
 *    pre-port page first: it was three lazy panels, ShipHistoryPanel +
 *    AnnouncementsPanel + ChangelogPanel, so the port invented nothing. What it
 *    did was inline all three, and two of them were never this surface's work.
 *    KEEP  the gate. An announcement written, submitted and waiting on an
 *          owner is a genuine human decision, and this is the only place it is
 *          made.
 *    KEEP  the composer, now on the Field/Input/Textarea primitives instead of
 *          a hand-rolled style object, and now REPLACING the gate rather than
 *          stacking under it.
 *    KEEP  the announcements list. It is this surface's own object, and
 *          clicking an unpublished one makes it the gate.
 *    KEEP  the release notes. Brain moved ChangelogPanel here when it was
 *          redesigned, and this list is the raw material an announcement gets
 *          written from, so a row now hands its title and body to the composer.
 *    MOVE  "Reached production", the missions half of the old ShipHistoryPanel
 *          -> RUNS. Every row already navigated to /build/$missionId, so it was
 *          a Runs list rendered on someone else's page, and Brain had already
 *          ruled completed runs are Runs' subject. Learn owns the ["outcome"]
 *          read in full; this surface was half-doing it.
 *    MOVE  "The work behind them", the runs half of the same panel: per-run
 *          duration, tokens and dollars -> ENGINE ROOM, or Runs beside the
 *          missions. Nothing on this surface depended on it, and it was the
 *          fourth stacked history list on a page with one job.
 *    MOVE  the six-week heartbeat (shipped and decided counts per week) ->
 *          LEARN, or Analytics. Nobody publishing an announcement asked for six
 *          weeks of counts, and it carried a query of its own.
 *          ChangelogHeartbeat survives as a component for its new home.
 *    KILL  "Who ships here", the release agent's presence row and the
 *          getAgentFleet query behind it. No agent publishes an announcement,
 *          so it was identity decoration, and the shell draws the live line.
 *    KILL  "Who can publish", three lines of context-column paragraph. The
 *          gate question already says a pending post waits on an owner.
 *    KILL  the production count in the headline. This surface's subject is what
 *          has been said, not what was merged.
 *    KILL  the body excerpt on release-note rows. A second line has to be a
 *          different fact, and that one was the first line continued.
 *
 * 4. ONE CLICK AWAY. Every row is one line plus a different second fact and
 *    never wraps. Only the post in focus carries its evidence, and its public
 *    address sits in the context column instead of on every row.
 *
 * 5. THE MOMENT, AND THE CONFUSION. This surface holds both halves nothing else
 *    holds at once: what shipped, and what was said about it. So it opens by
 *    naming the gap ("four releases on the record, none of them announced"),
 *    and one click on a release note carries it into the composer. What it
 *    avoids: four stacked history lists and a six-week counter in the margin,
 *    none of which was why anyone came.
 *
 * Preserved: listChangelog ["changelog", wid], listAnnouncements
 * ["announcements", wid], listWorkspaceMembers ["workspace-members", wid], and
 * all four announcement mutations with their transitions and role checks.
 *
 * 6. A PERSON COULD NOT SHIP FROM SHIP (fixed 2026-08-06).
 *
 *    The nav has always told the reader this station is "Preview to
 *    production." It was not. The three acts the station is named for --
 *    promote, watch, roll back -- existed only inside the Changes tab of one
 *    Build run (src/components/studio/ChangesPanel.tsx), which is where you are
 *    when you have just finished building ONE change. Everything on /ship was
 *    an announcement composer. So the door said one thing and the room did
 *    another, and the only way to put a change in front of customers was to
 *    remember which run had produced it and go back into that run.
 *
 *    Three surfaces answer it, all of them reusing the server functions that
 *    already shipped rather than growing a second deploy path that could
 *    disagree with the first:
 *      - "Ready to promote", a Gate over every merged release whose preview is
 *        up and which nobody has moved to production, calling the same
 *        `promoteToProduction`.
 *      - "Where it is live", the addresses actually serving right now, read
 *        from `listDeployments` and refetched every 30s because a deploy
 *        finishes while you are looking at the page.
 *      - "Live releases", every release that reached production, each with the
 *        `rollbackRelease` door behind the SAME prompt ChangesPanel uses. A
 *        rollback reachable through a lighter confirmation than the one it
 *        already has would be a regression, so the copy is asserted identical
 *        by a test rather than left to whoever edits next.
 *
 *    NOTHING WAS REMOVED FROM ChangesPanel. Two doors onto one act is correct
 *    here and is not duplication: the run is where you are standing when you
 *    finish building, the station is where you are standing when you are
 *    thinking about releases, and those are different moments in a day.
 *
 *    NO ROLE GATE ON EITHER ACT, deliberately. The announcement half of this
 *    surface gates on `selfRole` because `TRANSITION_ROLES` is a real rule the
 *    server re-checks. `promoteToProduction` and `rollbackRelease` carry no
 *    such rule -- RLS membership is the whole of it -- so inventing a client
 *    gate would hide a control from someone the server would have let through,
 *    which is a smaller surface bought with a fiction.
 *
 * 7. THE RELEASE DOCUMENT, mounted 2026-08-06 (founder ask, same day).
 *
 *    "What shipped" above is a LIST: one line per release, and by its own rule a
 *    row is a lead plus one different second fact and never wraps. That is the
 *    right shape for choosing between releases and the wrong shape for the
 *    question the founder actually asked -- documentation of what got shipped,
 *    the thing you forward to a customer or an exec. So the list keeps its job
 *    and `WhatShipped` renders the document form of whichever row is in focus,
 *    directly beneath it: the bet, the spec, the outcome contract, the design
 *    gate, the changeset, the pull request, the deploy, the settled outcome, and
 *    a closing section naming everything the product cannot say.
 *
 *    NOT ONE WORD OF IT IS TYPED. That is the whole claim, and it is why the
 *    section's own lead-in states where the sentences come from: a release note
 *    a person cannot trace is worth less than none.
 *
 *    THE PRECONDITION IS A RELEASE, not a deployment and not an announcement.
 *    A changelog entry is materialized only from a MERGED changeset, so an entry
 *    existing is exactly "something shipped". Until the changelog read has
 *    answered, this section says it is reading; when the read fails it says so
 *    and offers the retry, because "nothing has shipped yet" and "we could not
 *    find out" are different sentences and only one of them is ever true.
 *
 *    WHICH RELEASE. The newest, until the reader picks another from the list
 *    above. The pick is a NEW door in the row's action slot rather than the
 *    row's own click, which was already taken twice over: a contributor's click
 *    starts an announcement draft, and everyone else's opens the production URL.
 *    Stealing either would have traded one capability for another.
 *
 * 8. A MERGE WITH NO RELEASE NOTES HAD NO ROW, so the capture door was
 *    unreachable in the exact case it was written for (fixed 2026-08-06).
 *
 *    THE LOOP. Every list here is derived from `releaseStates`, which walks
 *    changelog entries; an entry exists only for a merged changeset with
 *    non-empty release notes; and for a repo Supaprod does not host, the only
 *    writer of those notes is ci-poll-tick, AFTER a capture succeeds. The cron
 *    stops asking 60 minutes after the merge. So a slower pipeline is never
 *    captured, never written up, never listed, and never gets the button whose
 *    own doc says it "is the only way to ask after the cron has stopped
 *    asking". This surface used to state the hole in a comment and leave it:
 *    "Reaching them from HERE would need a read this surface does not have."
 *
 *    THE READ IT NOW HAS. `listAppliedChanges` returns every merged changeset in
 *    the workspace and was ALREADY being fetched on this page by the release
 *    document, which used one row of it. Same query key, so it is still one
 *    request. `unlistedMerges` subtracts the changelog from it, and each
 *    remainder gets a row carrying two doors that were already imported here:
 *    `generateReleaseNotes`, which writes the column the changelog trigger fires
 *    on, and `captureDeployments`, which asks the provider again.
 *
 *    AND TWO SENTENCES THAT WERE ASSERTING ABSENCE FROM READS THAT ANSWERED.
 *    "No deploy is on the record yet" was drawn from `states.length === 0`,
 *    which is the CHANGELOG being empty, over deploy rows this surface was
 *    holding in `deployRows`. "Nothing has merged yet" was the same mistake one
 *    level up: a claim about changesets made from a read of changelog entries.
 *    Both now branch on the read that can actually answer them, and both keep
 *    their old wording word for word in the case where it was always true.
 */

import { useNavigate } from "@tanstack/react-router";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { shipHeadline } from "@/components/ship/ship-headline";
import { failureLine } from "@/lib/error-copy";
import { Row } from "@/components/meridian/rows";
import { releaseStanding } from "@/components/track/release-words";
import {
  handRecordedLine,
  mayAnnounce,
  releaseSummaryLines,
  whyNotAnnounceable,
  type ReleaseEvidence,
} from "@/lib/spine/what-the-merge-gate-shows";
import { releaseEvidence } from "@/lib/spine/track.functions";
import {
  Action,
  Actions,
  Door,
  NothingYet,
  Num,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { rollbackRelease } from "@/lib/studio.functions";
// THE READ THIS SURFACE USED TO SAY IT DID NOT HAVE, plus the door that repairs
// what it finds. `listAppliedChanges` is every MERGED changeset in the
// workspace, which is the only thing that can see a merge the changelog cannot,
// and `generateReleaseNotes` is what gives such a merge a release at all. On
// its own line because ship-has-an-agent.test.ts pins this exact statement
// character for character, so a name added to it breaks a rule about a
// different thing entirely.
import {
  generateReleaseNotes,
  listAppliedChanges,
  type AppliedChange,
} from "@/lib/studio.functions";
import { listDeployments, promoteToProduction } from "@/lib/deployments.functions";
// The capture door comes in on its own line for the same reason the launch kit
// does. ship-can-ship.test.ts asserts the statement above character for
// character, because `listDeployments` and `promoteToProduction` both had to be
// on this surface before the station could ship anything at all; adding a third
// name to that line breaks a rule about a different thing entirely.
import { captureDeployments } from "@/lib/deployments.functions";
import { usePrompt } from "@/hooks/use-confirm";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import {
  listChangelog,
  publishChangelogEntry,
  type ChangelogEntry,
} from "@/lib/changelog.functions";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  submitForApproval,
  approveAndPublish,
  type AnnouncementRow,
} from "@/lib/announcements.functions";
import { listWorkspaceMembers } from "@/lib/workspaces.functions";
import { TRANSITION_ROLES, type WorkspaceRole } from "@/lib/announcements";
import { Ask } from "@/components/meridian/Ask";
import { askQuestion } from "@/components/meridian/question";
import { Quiet } from "@/components/meridian/Quiet";
// `CtxHead` left with the context column: Outcomes owns the margin, and the
// two sentences that lived there are in the flow below, where a labelled
// eyebrow over one paragraph would read as a section rather than a note.
import { CtxBody } from "@/components/meridian/ContextColumn";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { Receipt } from "@/components/meridian/Receipt";
import { Prose } from "@/components/meridian/Prose";
// The release document. It renders its own top-level Regions, so it is a sibling
// of them rather than a child of one: a Region inside a Region is the second
// nested container the standard caps at one.
import { NoReleaseYet, WhatShipped } from "@/components/ship/WhatShipped";
import { stillWaiting } from "@/lib/query-state";

/** Anti-scroll: each list opens short and expands on demand. */
const VISIBLE = 6;

/**
 * THE METADATA SIZE A ROW'S OWN CONTROL IS SET AT.
 *
 * The retired `.sp-block-more` fixed this at `--sp-text-meta`, 13px, and
 * Meridian's `Door` deliberately INHERITS its size instead ("a control that
 * shrinks halfway through a sentence reads as a typo"). That is right for a
 * door inside a sentence and wrong for one sitting in a `Row`'s action slot,
 * where there is no sentence to inherit from and the row would hand it the
 * 14px lead size. Stated once here rather than at each of the six call sites.
 */
const ROW_META = "text-mrd-base";

/** `Door`'s paint, to the class, minus its hover. The two shapes below add the
 *  hover separately, because they need different prefixes for it. */
const DOOR_FACE =
  "rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors";

/* `enabled:hover:` rather than a bare `hover:`, and only on the BUTTON. A dead
   control that still lights up under the pointer promises something it will not
   do. It is the wrong prefix for an anchor: `:enabled` matches form controls
   only, so an `<a>` wearing it would lose its hover entirely -- the same trap
   `CONTROL_SHAPE` records for `active:`. */
const ROW_DOOR = `${DOOR_FACE} enabled:hover:text-mrd-ink enabled:hover:decoration-mrd-edge enabled:hover:decoration-solid disabled:cursor-default disabled:opacity-45`;

/**
 * A QUIET CONTROL INSIDE A ROW, WHICH CAN ALSO BE BUSY.
 *
 * ── WHY THIS IS NOT `Door`, AND WHY THAT IS A GAP RATHER THAN A PREFERENCE ──
 * Every one of these carries `disabled` while its mutation is in flight, and
 * that is not decoration: two presses of "Promote it" are two production
 * deploys of one commit racing each other. Meridian's `Door` has no disabled
 * state and no busy state, so it cannot express the one thing these controls
 * have to say. `Action variant="quiet"` can, and it is `h-8`: a 32px control in
 * a `min-h-11` row with `py-[9px]` grows the row to 50px, so rows carrying a
 * control would stand taller than rows that do not, in the same list.
 *
 * So the paint is `Door`'s, to the class, and the two states are added. It is
 * recorded here rather than fixed in `Door` because widening a system part
 * mid-port touches every surface at once; the honest note is that `Door` wants
 * `disabled` and `busy`, and this is the caller that proves it.
 *
 * `aria-busy` is on the ONE row actually running, never on the others the same
 * mutation disables: a control that is merely waiting its turn is not working.
 */
function RowDoor({
  children,
  onClick,
  disabled = false,
  busy = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      data-mrd=""
      disabled={disabled}
      aria-busy={busy || undefined}
      onClick={onClick}
      className={`${ROW_META} ${ROW_DOOR}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/** An address rendered as the door it is. Sits in a Row's `action` slot and
 *  never in `sub`, because `Row` renders a clickable row as a <button> and an
 *  <a> inside a <button> is invalid markup that React refuses to hydrate. */
function Addr({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    /* NO textDecoration OVERRIDE. It was set to "none", which strips the dotted
       rest-state underline the door paint supplies and which hover cannot put
       back -- so the address stopped announcing itself as a link at all, and the
       only cue left was colour. This is the second time this surface has made an
       address unreachable, which is why the test asserts the absence of the
       override rather than the presence of a class.

       `Door` already opens an `href` in a new tab with `noopener noreferrer`,
       which is exactly what this wrapper used to spell out by hand. */
    <span className={ROW_META}>
      <Door href={href}>{children}</Door>
    </span>
  );
}

/**
 * AN ADDRESS INSIDE THIS PRODUCT, OPENED IN THIS TAB.
 *
 * Meridian's `Door` is the right paint and the wrong element for exactly one
 * link on this surface: `href` there always carries `target="_blank"`, because
 * the prop was written for OUTBOUND addresses. This one points at a run inside
 * the app, and a receipt that scatters the workspace across tabs is not what
 * "open the revert run" means. Same face, same hover, no new tab.
 *
 * It replaces `style={{ color: "var(--sp-ink)" }}`, which is a retired token and
 * was also the whole of the link's affordance: colour and nothing else, with no
 * underline at rest and no hover.
 */
function AppLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      data-mrd=""
      href={href}
      className={`${DOOR_FACE} hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </a>
  );
}

/**
 * THE WAY PAST A CAP, STATED UNDER THE LAST ROW RATHER THAN IN THE HEADING.
 *
 * `Region` refuses this control in its header and says why: Brain's port found
 * a shelf capped at six putting "Show all 14" in the REGION HEADING, above rows
 * the reader had not reached yet, so the way past a cap was announced before
 * the cap. Five lists on this station were doing exactly that through the
 * retired `Block`'s `more`/`onMore`.
 *
 * The shape is `RecordsTable`'s, which is where Meridian already answers this:
 * the real arithmetic under the last row with the way out beside it, where a
 * reader arrives having actually hit the limit. What is added to it is the way
 * BACK -- `RecordsTable` lifts its cap one way and these five lists have always
 * been two-way, and a port may not take a control away.
 */
function MoreRows({
  shown,
  total,
  open,
  onToggle,
}: {
  shown: number;
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  if (total <= shown && !open) return null;
  return (
    <div className="mt-mrd-3 flex items-center justify-between gap-mrd-4">
      <span className="text-mrd-small tabular-nums text-mrd-mute">
        {open
          ? `Showing all ${total}.`
          : `Showing ${shown} of ${total}. ${total - shown} not shown.`}
      </span>
      <RowDoor onClick={onToggle}>{open ? "Show fewer" : `Show all ${total}`}</RowDoor>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose: nothing here reaches into another
 * surface's folder, so a parallel port cannot break this one.
 * ------------------------------------------------------------------ */

/** Plain-words relative time. Mono is applied by the row, not here. */
type ShipReceipt = {
  verb: string;
  /**
   * A NODE, NOT A STRING, since the promote and the rollback landed.
   *
   * Publishing's consequence is an address on this product's own domain, so the
   * Receipt could compose it from `slug` alone. A promote's consequence is a
   * customer-facing URL this product did not choose, and a rollback's is a run
   * elsewhere in the app; both have to arrive as a real link or the person is
   * handed a URL to copy by hand. Widening the field is what lets each act
   * build its own sentence instead of the Receipt guessing at every shape.
   */
  consequence: React.ReactNode;
  slug?: string | null;
  failed?: boolean;
};

function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** The same clock, in prose. "just now" reads wrong with an "ago" after it,
 *  and "6 Jul ago" reads worse, so the suffix is decided here rather than at
 *  every call site. */
function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `on ${new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}

function onDate(ms: number | null): string | null {
  if (ms === null) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * The announcement composer's own prefilled body (P-133, A-QUEUE.md).
 *
 * A1 wrote the first announcement by hand, from the release notes and the
 * PR, because the composer opened empty. `generateLaunchKit` -- a real
 * model pass over the changeset -- had been drafting the customer half
 * before this packet, and that is exactly what it stopped doing here:
 * "no filler, a verifiable mechanism first" is the packet's own phrase, and
 * a model inventing what a change "means for your customers" in a document
 * with no review gate before it goes out is filler with a byline. Every
 * word this function writes traces to a column on the release entry --
 * the notes, the date, the PR, the address -- and the one part that
 * cannot be assembled from a row, what the change means for a customer,
 * is left as a bracketed prompt for the person to write, never guessed.
 */
export const CUSTOMER_MEANING_PROMPT =
  "[Write a sentence or two about what this means for the people using it.]";

export function announcementDraftBody(e: {
  body: string | null;
  released_at: string;
  pr_number: number | null;
  production_url?: string | null;
}): string {
  const notes = (e.body ?? "").trim();
  const date = onDate(Date.parse(e.released_at));
  const closing = [
    date ? `Shipped ${date}` : null,
    e.pr_number ? `PR #${e.pr_number}` : null,
    e.production_url ?? null,
  ]
    .filter((x): x is string => !!x)
    .join(" · ");
  return [
    "What changed",
    notes,
    "",
    "What it means for your customers",
    CUSTOMER_MEANING_PROMPT,
    "",
    closing,
  ].join("\n");
}

/** The first real sentence of a body, for the gate's evidence line. */
function firstLine(body: string | null | undefined, max = 150): string | null {
  const line = (body ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find((l) => l.length > 0);
  if (!line) return null;
  return line.length > max ? `${line.slice(0, max - 1)}...` : line;
}

function stateLine(a: AnnouncementRow): string {
  if (a.status === "published") return `Public at /p/${a.slug}`;
  if (a.status === "pending") return "Waiting to go out";
  return "Draft";
}

/* ------------------------------------------------------------------ *
 * The release layer: what shipped, where it is serving, what can move.
 *
 * PURE AND EXPORTED ON PURPOSE. Every decision below is one a person acts on
 * irreversibly -- "promote this to production" reaches customers and cannot be
 * taken back from inside the product -- and every one of them is derived from
 * two lists that arrive separately and can each be stale, partial or failed.
 * Deriving that inline in JSX would put the reasoning somewhere no test can
 * reach, which is exactly how a promote button appears over something that has
 * already gone live. Same shape /brain uses (recordHeadline, guidanceLines).
 * ------------------------------------------------------------------ */

/**
 * One row of the `deployments` table as this surface reads it.
 *
 * Declared here rather than imported because `listDeployments` returns the raw
 * Supabase row shape and that table is not in the generated types yet, so every
 * caller casts. ChangesPanel makes the identical cast. Declaring the shape lets
 * the functions below be exercised with plain objects instead of a database.
 */
export type ShipDeployment = {
  id: string;
  changeset_id: string | null;
  /**
   * WHICH PRODUCT THE ROW BELONGS TO, and `releaseStates` reads it for exactly
   * one question: has Supaprod's own hosting ever deployed this product.
   *
   * `listDeployments` selects it, and every writer sets it from the changeset
   * (`ci-poll-tick` and both upserts in deployments.functions.ts pass
   * `product_id: cs.product_id ?? null`). The column is NULLABLE, so a row
   * without one contributes no evidence either way rather than being read as
   * belonging to whatever release is asking.
   */
  product_id?: string | null;
  environment: string;
  status: string;
  deploy_url: string | null;
  /**
   * WHO PUBLISHED IT, which decides whether promote can act on this row at all.
   *
   * 'deno' is a deploy Supaprod's own hosting served (deployments.functions.ts
   * and the CI poll tick both stamp it); anything else is a row captured from
   * the customer's own pipeline, carrying the repo's provider. The column is
   * `NOT NULL DEFAULT 'github'` and `listDeployments` selects it, so a row that
   * arrived from the server always carries one. It is optional in the TYPE only,
   * so the pure functions below can still be exercised with plain objects.
   */
  provider?: string | null;
  deployed_at?: string | null;
  created_at?: string | null;
};

/**
 * What the deploy record says about WHO deploys this release, which is the one
 * question that decides whether "the preview lands on its own after a merge" is
 * a fact or a promise about an event that is never coming.
 *
 * "none"     -- this release has no deploy row of any kind. Nothing has been
 *               attempted on it and its own record cannot say who would attempt
 *               it.
 * "supaprod" -- this release has rows, and SOMEWHERE ON THE PAGE OF ROWS IN
 *               HAND there is one Supaprod's own hosting served (provider
 *               'deno') for it or for another release of the same product.
 *               Supaprod deploys for this repo.
 * "captured" -- this release has rows, and NOT ONE row anywhere on that page is
 *               ours for this product. Every deploy the client can see for this
 *               product came from the customer's own pipeline and Supaprod only
 *               read it from the repository's deployment record.
 *
 * WHY "supaprod" LOOKS PAST THIS RELEASE'S OWN ROWS. See `releaseStates`: read
 * from one release's rows alone, a repo that turned Supaprod hosting on after
 * some captured rows had landed left every older release "captured" for ever,
 * and the sentence built from that told a customer Supaprod would not build a
 * preview for a repo it now does host.
 *
 * "supaprod" IS HISTORICAL EVIDENCE READ IN THE PRESENT TENSE, and that is the
 * one thing the sentence above claims slightly more of than it can prove. The
 * set is built from whatever rows are on the page, and it is one-way: a product
 * admitted on any 'deno' row is never removed, so a repo that WAS Supaprod-
 * hosted and has since stopped keeps reading "supaprod" until the last of its
 * Supaprod rows falls off the page. That is the direction to be wrong in, and it
 * is deliberate rather than overlooked. Nothing here gates a control:
 * `isReadyToPromote` demands an actual successful 'deno' preview row on THIS
 * release, and `whereItIs` never reads this field, so a stale "supaprod" cannot
 * draw a promote or claim an address. Its one reader is `promoteAbsence`, where
 * it decides only which of two sentences a release lands in -- and the one it
 * lands in is the CONDITIONAL pair ("for a repo Supaprod hosts ... for a repo it
 * does not host ..."), which is true either way. So the failure is a release
 * being told both halves instead of the sharper half; withholding nothing and
 * asserting nothing false. Being wrong the other way costs the customer
 * something real: it tells a repo Supaprod DOES host to go and promote
 * elsewhere.
 *
 * IT IS THE CLIENT'S BEST AVAILABLE ANSWER, NOT THE SERVER'S. The server splits
 * the same refusal on `denoDeployConfigured()` (deployments.functions.ts), which
 * reads DENO_DEPLOY_TOKEN out of the process environment and is unreachable from
 * a browser. So "none" is genuinely unknown here -- an install with no hosting
 * configured looks exactly like a repo whose first preview has not landed yet --
 * and the sentence written for it hedges the way the server's own configured
 * branch hedges, rather than promising. "captured" is narrowed by the widening
 * above but not made certain by it: hosting turned on with no Supaprod deploy
 * row anywhere on the page yet still reads "captured".
 */
export type DeployOrigin = "none" | "supaprod" | "captured";

/** One merged release, with everywhere it is currently serving. */
export type ReleaseState = {
  changesetId: string;
  title: string;
  productName: string | null;
  releasedAt: string;
  prNumber: number | null;
  prUrl: string | null;
  /** Newest SUCCESSFUL preview deploy that recorded an address, whoever built
   *  it. This is the address a person can open, so it is the one displayed. */
  previewUrl: string | null;
  /**
   * Newest successful preview SUPAPROD ITSELF served, and the only preview
   * promote can move.
   *
   * `promoteChangesetToProductionCore` takes the preview's commit and redeploys
   * that repo's files to Deno hosting. That is the right act only for a preview
   * Deno served in the first place: promoting a preview Vercel or Netlify built
   * would push an unbuilt copy of someone's repo to a Deno app and then call it
   * production, so the server refuses it outright. Held separately from
   * `previewUrl` because a captured preview is still a real address worth
   * showing -- it is only the promote that cannot follow it.
   */
  hostedPreviewUrl: string | null;
  /**
   * The `provider` column of the newest successful preview Supaprod did NOT
   * serve, and null when there is no such preview. Read as a flag -- one of
   * those previews exists -- so the sentence explaining the missing button can
   * be shown at all, rather than leaving a person to guess why the promote they
   * can see elsewhere is absent here.
   *
   * IT IS THE REPO HOST, AND IT NEVER NAMES THE PIPELINE. `captureDeployments`
   * stamps every captured row with the literal "github"
   * (deployments.functions.ts, `provider: "github"` in the capture) because
   * `DeploymentEntry` (lib/connectors/repo-provider.ts) carries no publisher of
   * its own, so this field can only ever read "github" -- never "vercel" or
   * "netlify". Printing it told a Netlify customer their preview came from
   * github, which is exactly the falsehood the server stopped telling in the
   * same refusal it mirrors. So it is tested here and never interpolated;
   * `previewUrl` is the only thing on the row that points at whoever built it.
   */
  observedPreviewProvider: string | null;
  /**
   * Status of the newest PREVIEW deploy of any outcome, or null when none has
   * ever been attempted. The preview half of `lastProductionStatus`, and it
   * exists for the same reason.
   *
   * `previewUrl`, `hostedPreviewUrl` and `observedPreviewProvider` are all
   * success-only reads, so a release whose only preview FAILED arrived with all
   * three null and `whereItIs` reported it as "No deploy is on the record" --
   * an attempted deploy read back as an absent one, over a `deployments` row
   * that says failure.
   *
   * IT CAN DISAGREE WITH `previewUrl`, on purpose. A success at 10:00 and a
   * failed redeploy at 11:00 leaves an address that still answers AND a newest
   * status of "failure". `whereItIs` prefers the address, because a door a
   * person can open is the more useful fact; this field is what it falls back
   * to when there is no door.
   */
  previewStatus: string | null;
  /** Who deploys this release, as far as the whole page of deploy rows in hand
   *  can say -- this release's own rows first, then any row for the same
   *  product. See `DeployOrigin`: it decides whether a preview is coming on its
   *  own. */
  deployRecord: DeployOrigin;
  /** Newest SUCCESSFUL production deploy that recorded an address. */
  productionUrl: string | null;
  /** When that production deploy landed. Null until one has. */
  productionAt: string | null;
  /**
   * Status of the newest production attempt of ANY outcome, or null when none
   * has ever been attempted.
   *
   * A URL alone cannot answer "is it live", because a production deploy can
   * fail, be queued, or succeed without recording an address. Collapsing all of
   * those to "not live" would offer a second promote on top of one already
   * running, which is how you get two production deploys of the same commit
   * racing each other.
   */
  lastProductionStatus: string | null;
  /**
   * WHEN THE DEPLOY THAT IS STILL RUNNING STARTED, and null when none is.
   *
   * THE FACT THIS SURFACE HELD AND NEVER SAID. `listDeployments` refetches every
   * 30 seconds and returns `status`, so "pending" and "in_progress" arrive here
   * on every tick -- and the row rendered them in the same muted voice as "In
   * production", which is a settled outcome. A deploy that is HAPPENING and a
   * deploy that HAPPENED are the two facts this station exists to keep apart,
   * and the row was telling a person they looked the same.
   *
   * A tone alone still cannot answer the next question, which is always the
   * same one: is it stuck? So the row carries the start as well, and "A
   * production deploy is running, started 14m ago" is a sentence a person can
   * act on. `deployTone` reads the status; this reads the clock.
   *
   * `created_at` FIRST, and `deployed_at` only as the fallback. A row that has
   * not finished has no completion stamp, and where a provider does fill one in
   * early it is the wrong number to count from: the question is how long this
   * has been running, which is measured from when it started.
   *
   * OPTIONAL IN THE TYPE so the pure functions around it can still be exercised
   * with plain objects that predate it.
   */
  inFlightSince?: string | null;
};

/** A status the record has not settled. deployments.ts normalizes every provider
 *  vocabulary onto success | failure | pending | in_progress | unknown, and
 *  these are the two that mean the work is still going on. */
function isRunning(status: string | null | undefined): boolean {
  return status === "pending" || status === "in_progress";
}

/**
 * WHAT VOICE A DEPLOY STATE IS SAID IN, and the whole point is that a deploy in
 * flight is not an outcome.
 *
 * Meridian spends its five words carefully and this surface was spending none
 * of them: every state `whereItIs` returns was drawn in one mute, so "In
 * production", "The last production deploy failed" and "A production deploy is
 * running" read as three equally settled facts about a list that refetches
 * every 30 seconds precisely because one of them is not settled.
 *
 *   agent  a deploy is RUNNING. Present tense, a machine is working, and this
 *          is the one honest live state this station has.
 *   pass   it is in production. Green reports an OUTCOME, which is the only
 *          thing green is allowed to mean here, and this is the outcome.
 *   fail   the deploy fell over. Also an outcome, in the other direction.
 *   quiet  everything else, "unknown" included: a provider that would not say
 *          what happened is not a result, and painting one would invent it.
 *
 * NO `hold`, DELIBERATELY. Amber means waiting on a CONDITION -- spend to come
 * down, an eval to pass. A merged release nobody has promoted is not waiting on
 * a condition, it is waiting on a person, and `--mrd-you` is spent on the
 * control that releases it rather than on a word about it. `Value` has no `you`
 * tone for exactly that reason.
 *
 * NO `AgentPulse` EITHER, and this file's own note is why: the pulse belongs to
 * a genuinely dispatched MODEL pass (the launch-kit draft, the release notes).
 * A deploy is a provider job. Borrowing the pulse for it would turn the one mark
 * that means "the crew is working" into "something is happening", which is how
 * an indicator stops carrying information.
 *
 * THE PRODUCTION HALF OUTRANKS THE PREVIEW HALF, the same order `whereItIs`
 * reads them in: a preview that failed under a production deploy that succeeded
 * is not a failure this row should report.
 */
export function deployTone(s: ReleaseState): "quiet" | "pass" | "fail" | "agent" {
  if (isRunning(s.lastProductionStatus)) return "agent";
  if (s.productionUrl) return "pass";
  if (s.lastProductionStatus === "failure") return "fail";
  if (s.lastProductionStatus) return "quiet";
  if (isRunning(s.previewStatus)) return "agent";
  if (s.previewStatus === "failure") return "fail";
  return "quiet";
}

/** Sort key for a deploy row. `deployed_at` is the truth; `created_at` is the
 *  fallback for a row captured before it finished. */
function deployStamp(d: ShipDeployment): number {
  const t = new Date(d.deployed_at ?? d.created_at ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * Did Supaprod's own hosting publish this deploy?
 *
 * The server answers `provider === "deno"` exactly, and this is the same
 * question asked of a row that may have been built by hand. A row with NO
 * provider cannot come from `listDeployments` -- the column is NOT NULL and is
 * in the select list -- so the absent case is a constructed object, and it is
 * read as ours: withholding a promote is the one answer a person cannot undo
 * from the screen they are looking at, so it is never given on a guess.
 */
function isSupaprodHosted(d: ShipDeployment): boolean {
  return (d.provider ?? "deno") === "deno";
}

/**
 * The newest deploy for one environment. `successOnly` also demands a recorded
 * address, because a success with no `deploy_url` is not a door and rendering
 * it as one would be a link to nowhere. `keep` narrows further, for the callers
 * that care WHO deployed the row and not only that it landed.
 *
 * Ties keep the EARLIER array element. The server orders newest first, so on
 * equal timestamps that is still the newest row rather than an arbitrary one.
 */
function newestDeployment(
  rows: readonly ShipDeployment[],
  environment: string,
  successOnly: boolean,
  keep?: (d: ShipDeployment) => boolean,
): ShipDeployment | null {
  let best: ShipDeployment | null = null;
  for (const d of rows) {
    if (d.environment !== environment) continue;
    if (successOnly && (d.status !== "success" || !d.deploy_url)) continue;
    if (keep && !keep(d)) continue;
    if (!best || deployStamp(d) > deployStamp(best)) best = d;
  }
  return best;
}

/**
 * Join the changelog to the deploy record, one state per merged release.
 *
 * WHY THE CHANGELOG IS THE SPINE AND NOT THE DEPLOY LIST. `promoteToProduction`
 * refuses anything whose changeset is not `merged`, and a changelog entry is
 * materialized ONLY from a merged changeset (changelog.ts,
 * `shouldPublishChangelog`). Driving the list from deployments instead would
 * offer a promote over a preview of an unmerged branch, which the server would
 * then refuse -- a control promising an act it cannot perform. It also gives
 * every row a human title instead of a changeset uuid.
 *
 * THE PRODUCTION URL IS READ FROM BOTH SOURCES, and that is a correctness fix
 * rather than belt and braces. `listDeployments` returns a bounded page of the
 * newest rows, so an older release's production row can fall off the end of it
 * while `listChangelog` still resolves that same release's `production_url`
 * server-side. Trusting only the page would show a promote button over
 * something that has been live for a month.
 */
export function releaseStates(
  notes: readonly ChangelogEntry[],
  deployments: readonly ShipDeployment[],
): ReleaseState[] {
  const byChangeset = new Map<string, ShipDeployment[]>();
  for (const d of deployments) {
    if (!d.changeset_id) continue;
    const list = byChangeset.get(d.changeset_id);
    if (list) list.push(d);
    else byChangeset.set(d.changeset_id, [d]);
  }

  /**
   * THE PRODUCTS SUPAPROD IS SEEN TO DEPLOY FOR, read across the WHOLE page of
   * rows rather than one release's own. A product lands in here the moment any
   * row anywhere in `deployments` carries its id and `isSupaprodHosted` says
   * the row is ours, and `deployRecord` below uses it to decide whether
   * "captured" can be said at all. Rows with no `product_id` are skipped: they
   * cannot be attributed, and counting them would hand one release's hosting to
   * every other release.
   */
  const hostedProducts = new Set<string>();
  for (const d of deployments) {
    if (d.product_id && isSupaprodHosted(d)) hostedProducts.add(d.product_id);
  }

  const states: ReleaseState[] = [];
  for (const e of notes) {
    if (!e.changeset_id) continue;
    const rows = byChangeset.get(e.changeset_id) ?? [];
    const preview = newestDeployment(rows, "preview", true);
    // THE TWO PREVIEW READS ARE DIFFERENT QUESTIONS. `hosted` is the one the
    // server would actually promote, so it demands both an address and our own
    // provider. `observed` only has to EXIST to explain the missing button, so
    // it mirrors the server's own test (a successful non-'deno' preview) and
    // does not require an address the person may never have been given.
    const hosted = newestDeployment(rows, "preview", true, isSupaprodHosted);
    const observed = newestDeployment(
      rows,
      "preview",
      false,
      (d) => d.status === "success" && !isSupaprodHosted(d),
    );
    // The newest preview of ANY outcome, which is the only row that can say a
    // preview was attempted and did not land. The three reads above are all
    // success-only, so without this a failed preview is indistinguishable from
    // no preview at all.
    const previewAny = newestDeployment(rows, "preview", false);
    const prodOk = newestDeployment(rows, "production", true);
    const prodAny = newestDeployment(rows, "production", false);
    const fromChangelog = (e.production_url ?? "").trim() || null;
    const productionUrl = prodOk?.deploy_url ?? fromChangelog;
    /*
     * WHO DEPLOYS THIS ONE, AND THE RULE IS EXACTLY THIS: no rows of its own is
     * "none"; otherwise it is "supaprod" if ANY row on the page in hand is ours
     * -- this release's or another release of the same product's -- and
     * "captured" only when no such row exists anywhere on that page.
     *
     * Any environment, any outcome: a captured PRODUCTION row is as good
     * evidence that the customer's pipeline does the deploying as a captured
     * preview is, and a FAILED deploy of ours still proves we deploy here.
     * `isSupaprodHosted` reads a missing provider as ours, so a hand-built
     * object never lands on the "captured" side by accident.
     *
     * IT USED TO ASK ONLY THIS RELEASE'S OWN ROWS, and that was wrong in the one
     * direction that costs a customer something. A repo that added
     * `supaprod.json` AFTER some captured rows had landed leaves every release
     * merged before that with captured-only rows for ever, so `promoteAbsence`
     * counted them as `captured` and /ship said "Supaprod will not build a
     * preview for it; promote it where it was built" about a repo Supaprod now
     * DOES host -- a capability the customer has, reported as absent, with an
     * instruction to go and work around it.
     *
     * NOT DECIDED BY RECENCY. The newest row alone can only ever move a release
     * TOWARDS "captured": a release holding a Supaprod row plus a newer captured
     * one would flip, and Supaprod plainly deploys for it. One Supaprod row, at
     * any time, on this release or on any release of the same product, settles
     * the question and nothing later unsettles it. A release with NO rows of its
     * own is still "none" whatever the product's other rows say -- that is the
     * honest answer about its own record, and `promoteAbsence` already gives it
     * the same hedged sentence "supaprod" would.
     *
     * WHAT IT STILL DOES NOT FIX, because the browser cannot see it: hosting
     * configured with no Supaprod deploy row anywhere on the page yet. The
     * server splits that on `denoDeployConfigured()`, which reads the process
     * environment; here a newly hosted repo whose first Supaprod deploy has not
     * happened still reads "captured", and reads correctly the moment one lands.
     * A release with no `product_id` gets its own rows and nothing more.
     */
    const productHosted = !!e.product_id && hostedProducts.has(e.product_id);
    const deployRecord: DeployOrigin =
      rows.length === 0
        ? "none"
        : rows.some(isSupaprodHosted) || productHosted
          ? "supaprod"
          : "captured";
    states.push({
      changesetId: e.changeset_id,
      title: e.title,
      productName: e.product_name ?? null,
      releasedAt: e.released_at,
      prNumber: e.pr_number ?? null,
      prUrl: e.pr_url ?? null,
      previewUrl: preview?.deploy_url ?? null,
      hostedPreviewUrl: hosted?.deploy_url ?? null,
      observedPreviewProvider: observed?.provider ?? null,
      previewStatus: previewAny?.status ?? null,
      deployRecord,
      productionUrl,
      productionAt: prodOk?.deployed_at ?? prodOk?.created_at ?? null,
      // A resolved address IS a successful production deploy: listChangelog
      // derives it from environment=production AND status=success.
      lastProductionStatus: productionUrl ? "success" : (prodAny?.status ?? null),
      /*
       * WHEN THE RUNNING DEPLOY STARTED, read off the same row whose status
       * `deployTone` turns into the live voice, so the tone and the clock can
       * never disagree about which deploy they are describing.
       *
       * The production attempt is asked first and the preview only when
       * production has never been attempted, which is the order `whereItIs`
       * and `deployTone` both read them in. Null whenever nothing is running,
       * so a settled row carries no clock to be misread as one.
       */
      inFlightSince: (() => {
        const running = isRunning(prodAny?.status)
          ? prodAny
          : !prodAny && isRunning(previewAny?.status)
            ? previewAny
            : null;
        return running ? (running.created_at ?? running.deployed_at ?? null) : null;
      })(),
    });
  }
  states.sort((a, b) => {
    const at = new Date(a.releasedAt).getTime();
    const bt = new Date(b.releasedAt).getTime();
    return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
  });
  return states;
}

/**
 * MERGED, AND NOWHERE ON THIS STATION. The merges the changelog cannot see.
 *
 * WHY THEY ARE INVISIBLE, and why the invisibility is circular. Every list on
 * this surface is derived from `releaseStates`, which walks changelog entries;
 * an entry is materialized only by `trg_studio_changeset_to_changelog`, on a
 * merged changeset whose `release_notes` are non-empty. For a repo Supaprod
 * hosts, promote writes those notes. For a repo it does not host, the ONLY
 * writer is ci-poll-tick, and it writes them only after a capture succeeded
 * (`captured.captured > 0 && !(cs.release_notes ?? "").trim()`,
 * api/public/hooks/ci-poll-tick.ts). The cron stops asking 60 minutes after the
 * merge (DEPLOY_CAPTURE_WINDOW_MS), so a pipeline slower than that never gets
 * captured, never gets notes, never gets an entry, never gets a row, and never
 * gets the button that would have asked again. That is exactly the account
 * `captureDeployments` says it exists for: "with no door here Ship reads
 * 'Nothing has merged yet, so there is nothing to promote' for the life of the
 * account while every merge ships somewhere else" (deployments.functions.ts).
 *
 * WHAT THIS FUNCTION IS AND IS NOT. It is the diff and nothing more: merged
 * changesets with no changelog entry pointing at them. It is NOT evidence about
 * deploys, and it cannot be: `listAppliedChanges` returns a bounded page of the
 * newest merges (40), so a non-empty answer proves those merges are unlisted
 * and an empty one proves only that none of the newest are. Callers say so.
 *
 * BOTH LISTS MUST HAVE ANSWERED before this is worth drawing. Given an empty
 * `notes` because the changelog read failed, every merge in hand looks unlisted
 * and this would invent a repair list out of a broken read. The caller holds
 * that gate (`mergesKnown`), because only the caller can see the query state.
 */
export function unlistedMerges(
  notes: readonly ChangelogEntry[],
  applied: readonly AppliedChange[],
): AppliedChange[] {
  const listed = new Set<string>();
  for (const e of notes) if (e.changeset_id) listed.add(e.changeset_id);
  // `listAppliedChanges` already orders newest merge first, so the order the
  // rows are drawn in is the server's and not this function's invention.
  return applied.filter((c) => !listed.has(c.id));
}

/**
 * A DEPLOY WITH NO CHANGESET, ON EITHER SIDE OF ONE CIRCLE THIS STATION
 * ALREADY DRAWS (P-104, A-QUEUE.md).
 *
 * `unlistedMerges` above finds merged CHANGESETS with no changelog entry.
 * This finds the shape one step further out: a `deployments` row with no
 * changeset at all, which no amount of writing release notes could ever
 * attach to one, because there is no changeset for the notes to land on.
 *
 * TODAY'S ONLY WRITER IS `submitStationByHand`'s Ship branch
 * (spine/track.functions.ts): a person pastes a URL at the Ship station and
 * the row is written `status: 'claimed'`, `triggered_by: 'handback'`, with
 * no `changeset_id` -- deliberately, per that function's own header, so a
 * pasted address can never satisfy `release.publish`'s proof. The same
 * person's press at the BUILD station writes a `studio_changesets` row
 * instead (`status: 'pr_open'`, never `merged`), which `handRecordedLine`
 * already covers on the merge-gate card via `ReleaseEvidence.handRecorded`
 * -- a different table, a different reader, the same P-96 sentence.
 */
export function handbackDeploys(deployments: readonly ShipDeployment[]): ShipDeployment[] {
  return deployments.filter((d) => !d.changeset_id);
}

/** One row of "What shipped": a real release, or a deploy with no changeset
 *  standing in for one. See `shipListItems`. */
export type ShipListItem =
  { kind: "release"; entry: ChangelogEntry } | { kind: "handback"; deploy: ShipDeployment };

function shipListStamp(item: ShipListItem): number {
  const iso =
    item.kind === "release"
      ? item.entry.released_at
      : (item.deploy.deployed_at ?? item.deploy.created_at ?? null);
  const t = new Date(iso ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * "What shipped", widened to include the deploys `releaseStates` can never
 * reach (P-104, A-QUEUE.md's own Scope: "deployments with no changeset ... as
 * their own rows"). One list, newest first regardless of kind, rather than a
 * second block bolted underneath -- a person scanning what went out should
 * not have to check two lists to find the release from Tuesday.
 */
export function shipListItems(
  notes: readonly ChangelogEntry[],
  deployments: readonly ShipDeployment[],
): ShipListItem[] {
  const items: ShipListItem[] = [
    ...notes.map((entry): ShipListItem => ({ kind: "release", entry })),
    ...handbackDeploys(deployments).map((deploy): ShipListItem => ({ kind: "handback", deploy })),
  ];
  items.sort((a, b) => shipListStamp(b) - shipListStamp(a));
  return items;
}

/**
 * Can a person move this one to production right now?
 *
 * The four conditions are the server's own, restated so the button is only
 * drawn where the click will work: merged (guaranteed by being a changelog
 * entry at all), a successful preview to promote (`promoteChangesetToProduction`
 * throws without one), that preview being one SUPAPROD SERVED, and nothing
 * already in production.
 *
 * THE PROVIDER CONDITION IS NOT DECORATION. `previewUrl` alone was the test,
 * and it is satisfied by a preview captured from a customer's own pipeline --
 * a Vercel or Netlify URL this product only recorded. The server refuses those
 * ("published by your own pipeline ... there is nothing here to move to
 * production"), so the button was drawn over a click that could only fail after
 * the person had already decided, which is the exact defect the comment further
 * down this file says this surface exists to prevent.
 *
 * A FAILED production attempt IS promotable again -- that is the retry, and
 * withholding it would strand a release whose deploy fell over on a network
 * blip. A pending, in-progress, unknown or address-less success is NOT: one
 * production deploy of a commit is already under way or already happened, and a
 * second click would race it.
 */
export function isReadyToPromote(s: ReleaseState): boolean {
  if (!s.hostedPreviewUrl) return false;
  if (s.productionUrl) return false;
  return s.lastProductionStatus === null || s.lastProductionStatus === "failure";
}

/**
 * The promote list, minus whatever this browser just promoted (P-124,
 * A-QUEUE.md). `states` settles onto the same fact once `ship-deployments`
 * and `changelog` refetch after a promote's `invalidateQueries`, but that
 * refetch is async -- for one window, `states` still says "ready" about a
 * changeset a click just promoted. Excluding it here, client-side, closes
 * that window instead of waiting on the network to agree.
 */
export function readyToPromote(
  states: readonly ReleaseState[],
  justPromoted: ReadonlySet<string>,
): ReleaseState[] {
  return states.filter((s) => isReadyToPromote(s) && !justPromoted.has(s.changesetId));
}

/** Live means a production address a stranger can open. Nothing weaker. */
export function isLive(s: ReleaseState): boolean {
  return !!s.productionUrl;
}

/**
 * The address a release is currently answering on, and the plain-words state
 * behind it.
 *
 * EVERY `DeployStatus` HAS A SENTENCE, IN BOTH ENVIRONMENTS (deployments.ts
 * normalizes provider vocab to success | failure | pending | in_progress |
 * unknown). A status this function did not name would fall through to "no
 * deploy on the record", which reports an attempted deploy as an absent one --
 * the product claiming less than it did, which is the same defect as claiming
 * more.
 *
 * THE COMMENT ABOVE USED TO SAY THAT AND THE CODE DID NOT DO IT. Every branch
 * read `lastProductionStatus` and nothing read a preview status at all, while
 * `releaseStates` keeps a preview row only when it is `success` WITH an
 * address. So a release whose sole deploy was a FAILED preview arrived with
 * every preview field null and fell to "No deploy is on the record", over a
 * `deployments` row that said failure. `previewStatus` is carried for exactly
 * that, and the five preview branches below close it.
 *
 * THE ORDER IS ADDRESSES FIRST, THEN STATUSES. Production outranks preview
 * because production is the question this surface is asked; an address outranks
 * the status beside it because a door a person can open is worth more than a
 * word about it. The preview statuses are last, where there is no door left to
 * offer.
 */
export function whereItIs(s: ReleaseState): { address: string | null; state: string } {
  if (s.productionUrl) return { address: s.productionUrl, state: "In production" };
  const st = s.lastProductionStatus;
  if (st === "pending" || st === "in_progress") {
    return { address: s.previewUrl, state: "A production deploy is running" };
  }
  if (st === "failure")
    return { address: s.previewUrl, state: "The last production deploy failed" };
  if (st === "success") {
    return { address: s.previewUrl, state: "Production deployed, and recorded no address" };
  }
  if (st === "unknown") {
    return { address: s.previewUrl, state: "The last production deploy ended in an unknown state" };
  }
  if (s.previewUrl) {
    // WHY THE ROW SAYS THIS ONE IS NOT OURS. "Preview only, nobody has
    // promoted it" reads as an invitation, and next to it there is no Promote
    // button when the preview came from the reader's own pipeline. Saying whose
    // it is turns a control that is merely absent into an absence with a
    // reason.
    //
    // IT DOES NOT NAME THE PIPELINE, and interpolating `observedPreviewProvider`
    // here is how it did: that column is the REPO host, stamped "github" by
    // capture, so a Netlify customer read "published by github". The address
    // beside this sentence is `previewUrl`, which does point at whoever built
    // it, and that is the whole of what this row can honestly say.
    if (!s.hostedPreviewUrl) {
      return {
        address: s.previewUrl,
        state: "Preview only, published by your own pipeline rather than Supaprod",
      };
    }
    return { address: s.previewUrl, state: "Preview only, nobody has promoted it" };
  }
  // NO ADDRESS ANYWHERE, WHICH IS NOT THE SAME AS NO DEPLOY. Reached when the
  // preview left a row and no openable URL: it failed, it is still running, it
  // ended in a state the provider would not name, or it succeeded without
  // recording an address (the preview twin of the production case above).
  const pv = s.previewStatus;
  if (pv === "failure") return { address: null, state: "The preview deploy failed" };
  if (pv === "pending" || pv === "in_progress") {
    return { address: null, state: "A preview deploy is running" };
  }
  if (pv === "unknown") {
    return { address: null, state: "The preview deploy ended in an unknown state" };
  }
  if (pv === "success") {
    return { address: null, state: "Preview deployed, and recorded no address" };
  }
  return { address: null, state: "No deploy is on the record" };
}

/**
 * Why there is no promote button.
 *
 * A DISABLED BUTTON WITH NO EXPLANATION IS THE DEFECT THIS PREVENTS. "Promote
 * to production" greyed out teaches a person nothing: they cannot tell whether
 * they lack a permission, whether the read failed, or whether there is simply
 * nothing merged. Each of those wants a different next move, so each gets its
 * own answer and the control is absent rather than dead.
 */
export type PromoteAbsence =
  | { kind: "ready"; count: number }
  | { kind: "reading" }
  | { kind: "failed" }
  | { kind: "no-releases" }
  | { kind: "all-live"; count: number }
  /**
   * Merged, and nothing successful to promote. `captured` is the subset whose
   * deploy record shows the customer's own pipeline doing the deploying, and it
   * exists because ONE SENTENCE WAS COVERING TWO OPPOSITE FACTS.
   *
   * "The preview lands on its own after a merge, in about two minutes" is true
   * only where Supaprod does the deploying. Said to a customer whose repo
   * Supaprod does not host it is a promise about an event that is never coming,
   * and they read it every time they look. That is the same split
   * `promoteChangesetToProductionCore` makes in its own refusal
   * (deployments.functions.ts), and until now only the server made it.
   *
   * WHAT THE CLIENT CANNOT SEE. The server splits on `denoDeployConfigured()`,
   * which reads the process environment; the browser has no such read, so this
   * splits on the evidence the rows themselves carry (`DeployOrigin`). That
   * catches the case the server's boolean was written for -- a BYO release
   * whose captured deploy is in_progress or failure, which reaches /ship for the
   * first time now that ci-poll-tick generates release notes on any captured
   * deploy -- and it does NOT catch an install with no hosting configured and no
   * deploy rows at all. Those land in `count - captured`, whose sentence
   * therefore hedges instead of promising.
   */
  | { kind: "no-preview"; count: number; captured: number }
  /**
   * The previews exist and this product did not build them. `waiting` carries
   * the releases in the same block that are genuinely still waiting on a
   * preview, so the one sentence can answer both instead of the surface picking
   * a winner and going silent about the rest.
   *
   * `previewUrl` is the address of the one such preview when there is exactly
   * one, which is the only field on the record that points at whoever built it.
   *
   * THERE IS NO `provider` HERE ANY MORE, and that is a decision rather than a
   * tidy-up. It carried `observedPreviewProvider` off the first such release,
   * which is the REPO host and is always the literal "github" that capture
   * stamps. Once the sentence stopped interpolating it -- it had been telling a
   * Netlify customer their preview came from github -- nothing wrote to it,
   * nothing read it, and no test named it: a field whose own doc said it was
   * "carried as evidence and is NEVER put in the sentence", which is evidence
   * with no door, and the next reader to find it would have tried to print it
   * again. It has no honest reader available: the one value it can hold is the
   * one value that is wrong to show. So it folds into the boolean the code
   * actually uses -- `count`, which is exactly "how many releases satisfied
   * `!!observedPreviewProvider`". NOTHING A PERSON COULD SEE IS LOST: the
   * sentence below never named the provider, and it still does not.
   */
  | {
      kind: "published-elsewhere";
      count: number;
      previewUrl: string | null;
      waiting: number;
    };

export function promoteAbsence(args: {
  reading: boolean;
  failed: boolean;
  states: readonly ReleaseState[];
}): PromoteAbsence {
  // FAILED OUTRANKS READING. A read that threw is not a read still in flight,
  // and a spinner over a failure is the product waiting for something that is
  // never coming.
  if (args.failed) return { kind: "failed" };
  if (args.reading) return { kind: "reading" };
  const ready = args.states.filter(isReadyToPromote).length;
  if (ready > 0) return { kind: "ready", count: ready };
  if (args.states.length === 0) return { kind: "no-releases" };
  const live = args.states.filter(isLive).length;
  if (live === args.states.length) return { kind: "all-live", count: live };
  // A PREVIEW SOMEBODY ELSE PUBLISHED IS NOT A MISSING PREVIEW, and the two
  // wants opposite next moves. "The preview lands on its own after a merge"
  // would be a promise about an event that is never coming to a customer whose
  // repo Supaprod does not host, and they would read it every time they looked.
  const elsewhere = args.states.filter(
    (s) => !isLive(s) && !s.hostedPreviewUrl && !!s.observedPreviewProvider,
  );
  const notLive = args.states.length - live;
  if (elsewhere.length > 0) {
    return {
      kind: "published-elsewhere",
      count: elsewhere.length,
      // Only when there is exactly one, because quoting one address over a
      // sentence that counts several would attach it to the wrong release.
      previewUrl: elsewhere.length === 1 ? elsewhere[0].previewUrl : null,
      waiting: notLive - elsewhere.length,
    };
  }
  // THE SAME SPLIT AGAIN, ONE STEP FURTHER DOWN. The block above took every
  // release with a preview somebody ELSE published; what is left is a release
  // whose deploy record can still say who deploys for it, and one with no
  // Supaprod row anywhere on the page for its product has no preview coming
  // from us as far as anything the browser can read.
  // "captured" means no Supaprod row for this product on the page in hand, so
  // such a release can carry no `hostedPreviewUrl` either; `isLive` is the only
  // other thing to exclude.
  const captured = args.states.filter((s) => !isLive(s) && s.deployRecord === "captured").length;
  return { kind: "no-preview", count: notLive, captured };
}

/**
 * The sentence for an absence, or null where another element already says it
 * (the Gate, the Loading, the Failed). Never two things saying one thing.
 *
 * `unlisted` IS THE FACT THE CHANGELOG CANNOT HOLD, and it only ever changes
 * the `no-releases` sentence. An empty changelog was being read as "nothing has
 * merged", which is a claim about `studio_changesets` made from a read of
 * `changelog_entries`: a merge whose release notes nobody wrote leaves the
 * changelog empty and has merged all the same. Three values, three sentences:
 * a count above zero names the repair, zero keeps the old sentence word for
 * word because in that case it was always true, and null is "the merges have
 * not been read" and says so rather than guessing either way.
 */
export function absenceSentence(a: PromoteAbsence, unlisted: number | null = null): string | null {
  switch (a.kind) {
    case "ready":
    case "reading":
    case "failed":
      return null;
    case "no-releases": {
      // THE CONDITIONAL PROMISE, KEPT WORD FOR WORD. With no record at all the
      // honest form of "a preview lands on its own" is the conditional one.
      // Stated unconditionally it was the same promise the split below exists
      // to stop making, said to the reader with the least evidence of all. It
      // is shared by all three branches because it is true in all three.
      const hosting =
        "For a repo Supaprod hosts, a merged change deploys a preview on its own in about two minutes, and promoting that preview is what puts it in front of customers; for a repo it does not host, Supaprod records the previews your own pipeline publishes and you promote those where they were built.";
      if (unlisted === null) {
        return `No release is on the record, so there is nothing to promote. A release is drawn from a merged change that carries release notes, and whether any merge is waiting on notes has not been read. ${hosting}`;
      }
      if (unlisted > 0) {
        return unlisted === 1
          ? `One change has merged with no release notes, so it has no release on the record and there is nothing here to promote yet. Writing its notes is what puts it here, with its deploy record and its promote, and it has a row of its own below with that door on it. ${hosting}`
          : `${unlisted} changes have merged with no release notes, so none of them has a release on the record and there is nothing here to promote yet. Writing the notes is what puts one here, with its deploy record and its promote, and each has a row of its own below with that door on it. ${hosting}`;
      }
      return `Nothing has merged yet, so there is nothing to promote. ${hosting}`;
    }
    case "all-live":
      return a.count === 1
        ? "The one release on the record is already in production."
        : `All ${a.count} releases on the record are already in production.`;
    case "no-preview": {
      /*
       * TWO SENTENCES, BECAUSE THE TWO GROUPS WANT OPPOSITE NEXT MOVES. The
       * captured ones are waiting on a person, in another tool; the rest may
       * genuinely be waiting on a clock. Naming only the larger group and going
       * silent about the other is the failure the `published-elsewhere` block
       * above already refuses.
       *
       * THE PROMISE SURVIVES, CONDITIONED. "The preview lands on its own after
       * a merge, in about two minutes" is kept word for word where it can be
       * true and prefixed with the condition that makes it true, rather than
       * deleted -- and the second clause says what happens when the condition
       * does not hold, which is what the server's own configured-branch refusal
       * says (deployments.functions.ts).
       *
       * WHAT THIS STILL DOES NOT SPLIT, both of them older than this fix and
       * both answered by the row directly beneath this line rather than by it:
       *
       *   A release Supaprod hosts whose preview has ALREADY failed reads the
       *   conditional sentence, because at this altitude it is the same case --
       *   Supaprod does deploy for that repo. `whereItIs` says "The preview
       *   deploy failed" on its own row.
       *
       *   `count` is every release not in production, so it also counts one
       *   holding a good Supaprod preview whose PRODUCTION deploy is mid-flight
       *   (not ready, not live). "none has a successful preview yet" is wrong
       *   about that one; its row says "A production deploy is running".
       */
      const waiting = a.count - a.captured;
      const theirs =
        a.captured === 1
          ? "One release's deploys all came from your own pipeline, so Supaprod will not build a preview for it; promote it where it was built, and Supaprod records the production deploy once your provider reports it."
          : `${a.captured} releases have deploys that all came from your own pipeline, so Supaprod will not build previews for them; promote them where they were built, and Supaprod records each production deploy once your provider reports it.`;
      const ours =
        waiting === 1
          ? "One release has merged and has no successful preview yet. For a repo Supaprod hosts, the preview lands on its own after a merge, in about two minutes; for a repo it does not host, Supaprod never builds one and none will appear."
          : `${waiting} releases have merged and none has a successful preview yet. For a repo Supaprod hosts, the preview lands on its own after a merge, in about two minutes; for a repo it does not host, Supaprod never builds one and none will appear.`;
      if (a.captured <= 0) return ours;
      if (waiting <= 0) return theirs;
      return `${theirs} ${ours}`;
    }
    case "published-elsewhere": {
      // THE SAME ANSWER THE SERVER GIVES, so the two doors onto this act cannot
      // tell a person two different stories about the same release. The server
      // names NO provider and quotes the deploy URL instead
      // (deployments.functions.ts, the refusal on an observed preview), because
      // the only provider on a captured row is the repo host -- the literal
      // "github" -- and interpolating it told a Vercel customer their preview
      // came from github. This sentence follows it exactly: no provider, and
      // the address wherever one release owns it unambiguously.
      const at = a.previewUrl ? ` It is serving at ${a.previewUrl}.` : "";
      const head =
        a.count === 1
          ? `One release's preview was published by your own pipeline, not by Supaprod, so there is nothing here to move to production.${at} Promote it where it was built; Supaprod records the production deploy once your provider reports it.`
          : `${a.count} releases have previews your own pipeline published, not Supaprod, so there is nothing here to move to production. Promote them where they were built; Supaprod records each production deploy once your provider reports it.`;
      if (a.waiting <= 0) return head;
      return a.waiting === 1
        ? `${head} One other release has merged and has no successful preview yet.`
        : `${head} ${a.waiting} other releases have merged and none has a successful preview yet.`;
    }
  }
}

type Mode = { kind: "idle" } | { kind: "new" } | { kind: "edit"; id: string };

export function ShipRecord() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const wid = activeWorkspaceId ?? "";

  const fChangelog = useServerFn(listChangelog);
  const fList = useServerFn(listAnnouncements);
  const fMembers = useServerFn(listWorkspaceMembers);
  const fCreate = useServerFn(createAnnouncement);
  const fUpdate = useServerFn(updateAnnouncement);
  const fSubmit = useServerFn(submitForApproval);
  const fPublish = useServerFn(approveAndPublish);
  const fDeployments = useServerFn(listDeployments);
  const fPromote = useServerFn(promoteToProduction);
  const fRollback = useServerFn(rollbackRelease);
  const fCapture = useServerFn(captureDeployments);
  const fRepublish = useServerFn(publishChangelogEntry);
  const fApplied = useServerFn(listAppliedChanges);
  const fNotes = useServerFn(generateReleaseNotes);

  /**
   * THE WORKSPACE ID WAS DROPPED ON THE FLOOR HERE, and the read still
   * succeeded, which is what made it survive.
   *
   * This query keyed on and passed `activeWorkspace?.id` -- the full workspace
   * ROW, which arrives from the workspaces list query -- while every other read
   * on this surface uses `wid` (`activeWorkspaceId`), which is restored
   * synchronously. On first paint, and on every workspace switch until the list
   * settles, the row is undefined, so this fired with `workspaceId: undefined`.
   * `listChangelog` treats that as "not specified" and falls back to
   * `current_user_default_workspace`, so it answered confidently with SOMEONE
   * ELSE'S releases: a person who had switched workspaces read their default
   * workspace's changelog under the active workspace's name, and it cached
   * under the key ["changelog", undefined] where no invalidation could find it.
   *
   * `enabled` is the other half. Without it the fallback read fires before a
   * workspace is known at all, which is precisely the request whose answer is
   * guaranteed to be about the wrong workspace.
   */
  const changelog = useQuery({
    queryKey: ["changelog", wid],
    queryFn: () => fChangelog({ data: { workspaceId: wid } }),
    enabled: !!wid,
  });
  const posts = useQuery({
    queryKey: ["announcements", wid],
    queryFn: () => fList({ data: { workspaceId: wid } }),
    enabled: !!wid,
  });
  // selfRole gates the buttons. The server re-checks every transition, so this
  // is UX only and can never disagree with what the DB allows.
  const members = useQuery({
    queryKey: ["workspace-members", wid],
    queryFn: () => fMembers({ data: { id: wid } }),
    enabled: !!wid,
  });

  /**
   * Where every release in this workspace is currently serving.
   *
   * REFETCHED ON A TIMER, which is not decoration. A preview deploy lands about
   * two minutes after a merge and a production deploy finishes while you are
   * reading the page; without the interval, "nothing is ready to promote" stays
   * on screen after it has stopped being true, and the person's only recourse
   * is to reload a page that told them nothing was wrong. 30s is the same
   * cadence ChangesPanel uses for the identical read, so the two doors onto the
   * same act cannot disagree about how fresh they are.
   */
  const deployments = useQuery({
    queryKey: ["ship-deployments", wid],
    queryFn: () => fDeployments({ data: { workspaceId: wid, limit: 100 } }),
    enabled: !!wid,
    refetchInterval: 30_000,
  });

  /**
   * EVERY MERGE, NOT ONLY THE ONES THAT GOT WRITTEN UP.
   *
   * THE HOLE THIS CLOSES, and this surface admitted it in prose before it
   * closed it: "Reaching them from HERE would need a read this surface does not
   * have: merged changesets with no changelog entry." It has it now. See
   * `unlistedMerges` for why a merge can be invisible for ever and why the
   * capture door was unreachable in the exact case it was written for.
   *
   * THE SAME KEY AND THE SAME CALL AS `WhatShipped`, deliberately, so this costs
   * no extra request. The release document already reads `listAppliedChanges`
   * on this page (`["what-shipped-applied", workspaceId ?? null]`), and it was
   * fetching every merged changeset in the workspace and then using exactly one
   * of them. Two observers on one key is one fetch; a key or an argument that
   * differed by a character would be two reads of one table on one screen, and
   * two answers that could disagree.
   */
  const applied = useQuery({
    queryKey: ["what-shipped-applied", wid || null],
    queryFn: () => fApplied({ data: wid ? { workspaceId: wid } : {} }),
    enabled: !!wid,
  });

  const notes = changelog.data?.entries ?? [];

  /**
   * ── WHAT EACH RELEASE ACTUALLY CONTAINS (P-96) ─────────────────────────
   *
   * The same three facts the merge gate shows, for the releases those merges
   * produced. Keyed on the changeset ids in hand rather than on the workspace,
   * so it asks about exactly the rows on screen and re-asks when the page grows.
   *
   * Sorted before it becomes a key: `notes` arrives newest-first and a set built
   * from it is stable, but a key that depends on order would refetch on any
   * reordering of the same rows.
   */
  const fReleaseEvidence = useServerFn(releaseEvidence);
  const evidenceIds = [...new Set(notes.map((n) => n.changeset_id).filter((c): c is string => !!c))]
    .sort()
    .slice(0, 60);
  const evidence = useQuery({
    queryKey: ["release-evidence", wid, evidenceIds.join(",")],
    queryFn: () => fReleaseEvidence({ data: { changesetIds: evidenceIds, workspaceId: wid } }),
    enabled: !!wid && evidenceIds.length > 0,
  });
  const announcements = posts.data?.announcements ?? [];
  // The deployments table is not in the generated Supabase types yet, so the
  // read arrives untyped. Same cast ChangesPanel makes, made once.
  const deployRows = (deployments.data?.deployments ?? []) as ShipDeployment[];
  /* "What shipped", widened to the deploys that will never have a changeset
     to be listed by -- see `shipListItems`. */
  const shipItems = shipListItems(notes, deployRows);

  const role = (members.data?.selfRole ?? null) as WorkspaceRole | null;
  const canContribute = !!role && TRANSITION_ROLES["draft->pending"].includes(role);
  const canPublish = !!role && TRANSITION_ROLES["pending->published"].includes(role);

  const [mode, setMode] = React.useState<Mode>({ kind: "idle" });
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  const [picked, setPicked] = React.useState<string | null>(null);
  const [allNotes, setAllNotes] = React.useState(false);
  const [allPosts, setAllPosts] = React.useState(false);
  const [allAddresses, setAllAddresses] = React.useState(false);
  const [allReleases, setAllReleases] = React.useState(false);
  const [allUnlisted, setAllUnlisted] = React.useState(false);
  /** Which release the document below is about. Null means "the newest", so the
   *  section is never empty while something has shipped and nobody has chosen. */
  const [docId, setDocId] = React.useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["announcements", wid] });

  const create = useMutation({
    mutationFn: () =>
      fCreate({ data: { workspaceId: wid, title: draftTitle.trim(), body: draftBody } }),
    onSuccess: () => {
      toast.success("Draft saved.");
      setMode({ kind: "idle" });
      setDraftTitle("");
      setDraftBody("");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string }) =>
      fUpdate({ data: { id: vars.id, title: draftTitle.trim(), body: draftBody } }),
    onSuccess: () => {
      toast.success("Saved.");
      setMode({ kind: "idle" });
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /**
   * What the last act on this surface caused.
   *
   * anti-slop.md 5: a write with a consequence renders a Receipt, and there are
   * no success toasts. PUBLISH is the strongest case for that rule anywhere in
   * the product. This surface's own header says "nowhere else in the product
   * does anything become readable by a stranger", and that act was reporting
   * itself as a toast reading "It is live." A toast confirms the click
   * registered; a receipt renders what the click DID, and what this click did
   * was put a page on the public internet at a specific address. The address is
   * the consequence, so the address is what gets drawn, as a real link.
   *
   * `create` and `update` keep their toasts on purpose. They save a draft and
   * the list re-renders showing it, which is the rule's own narrow exception: a
   * write whose changed surface IS the receipt.
   */
  const [receipt, setReceipt] = React.useState<ShipReceipt | null>(null);

  /**
   * THE PRESS SETTLES THE CARD IN PLACE (P-124, A-QUEUE.md). `promote`'s own
   * `onSuccess` already invalidates `ship-deployments`/`changelog` and those
   * queries DO refetch immediately, not on the 30s poll -- but a refetch is
   * still a round trip, and for however long it takes, `states`/`ready`
   * below kept computing from the OLD rows: the promote card stayed up with
   * "Promote it" still on it while the settled receipt rendered underneath,
   * and once the deployment row that `deployments` reads DID land (often
   * before `changelog` did, the two queries racing independently) "Roll
   * back" appeared in Live releases at the same time -- both true at once,
   * on screen, about the same release.
   *
   * A changeset id, once its own promote has resolved, is EXCLUDED from
   * `ready` unconditionally below, so the card it belonged to is gone the
   * instant the receipt renders -- no window where both can be seen. Never
   * cleared by hand: the query invalidation this mutation already fires
   * lands `states` on the same fact within one refetch, and the set simply
   * stops mattering once `ready` itself agrees.
   */
  const [justPromoted, setJustPromoted] = React.useState<ReadonlySet<string>>(new Set());

  const submit = useMutation({
    mutationFn: (id: string) => fSubmit({ data: { id, workspaceId: wid } }),
    onSuccess: (_r, id) => {
      const a = announcements.find((x) => x.id === id);
      setReceipt({
        verb: "You sent it up",
        consequence: `${a?.title ?? "The announcement"} is waiting on an owner or an admin. It is not public yet.`,
      });
      void invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go up",
        consequence: failureLine("The announcement is still a draft.", e),
        failed: true,
      }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => fPublish({ data: { id, workspaceId: wid } }),
    onSuccess: (_r, id) => {
      const a = announcements.find((x) => x.id === id);
      setReceipt({
        verb: "You published it",
        consequence: "It is readable by anyone with the link.",
        slug: a?.slug ?? null,
      });
      setPicked(null);
      void invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not publish",
        consequence: failureLine("It is still readable only from in here.", e),
        failed: true,
      }),
  });

  /* -------------------------------------------------------------- *
   * Preview to production, which is what the nav has always promised.
   * -------------------------------------------------------------- */

  // Computed, not memoised, for the reason stated further down this file about
  // the announcement counts: both inputs are short bounded lists (100 entries
  // and 100 deploy rows at most), and a useMemo over two `?? []` fallbacks
  // re-runs on every render anyway because each fallback is a fresh array.
  const states = releaseStates(notes, deployRows);
  const ready = readyToPromote(states, justPromoted);
  const live = states.filter(isLive);

  /**
   * THE MERGES WITH NO RELEASE, AND WHETHER THAT ANSWER IS WORTH ANYTHING.
   *
   * `mergesKnown` IS BOTH READS OR NEITHER. The diff subtracts the changelog
   * from the merge list, so a changelog that has not answered (or answered by
   * failing, where react-query leaves `data` undefined) makes `notes` empty and
   * turns every merge in hand into a phantom repair. Held to `data` rather than
   * to `isSuccess` for the same reason the release blocks are: a failed refresh
   * with the last good rows still in hand is stale, not lost, and the rows stay
   * on screen with the failure said beside them.
   */
  const mergesKnown = !!changelog.data && !!applied.data;
  const appliedRows: AppliedChange[] = applied.data?.changes ?? [];
  const unlisted = mergesKnown ? unlistedMerges(notes, appliedRows) : [];

  // A release read is TWO reads, and either one failing makes the join a guess:
  // deployments alone cannot say which changeset merged, and the changelog
  // alone cannot say what is serving. So both halves gate together rather than
  // letting one render a confident half-answer.
  //
  // `stillWaiting`, NEVER `isLoading`, AND THIS FLAG IS WHY THE HELPER EXISTS.
  // Both queries are `enabled: !!wid`; react-query v5 defines `isLoading` as
  // `isPending && isFetching`, so a disabled query is pending WITHOUT fetching
  // and `isLoading` reads false for the whole of the first paint. Written as
  // `changelog.isLoading || deployments.isLoading` this flag therefore said
  // "not reading" before a workspace was known, and both blocks below fell
  // through to their `length === 0` arms: "No deploy is on the record yet."
  // and "Nothing is in production yet.", stated about a record nobody had
  // looked in. Not a race -- the ordinary path of every session.
  const releaseReading = stillWaiting(changelog, deployments);
  /**
   * A FAILED REFRESH IS NOT A LOST READ, and react-query v5 keeps `data`
   * through one. Same shape ChangesPanel uses over its own deploy query
   * (`deploymentsUnread` / `deploymentsStale`), widened to two queries; its
   * comment asks for exactly that, and two doors onto one act must not tell a
   * person two different stories about the same blip.
   *
   * `deployments` polls every 30 seconds, so one network hiccup sets `isError`
   * while every row of the last good read is still in hand. Gating on
   * `isError` alone took the addresses, the Promote buttons and the rollbacks
   * off a screen that had been showing all three a second earlier -- an
   * affordance removed rather than replaced, over rows we still had.
   *
   * BOTH HALVES, because the join is a guess without either: `releaseHeld` asks
   * whether the changelog AND the deploy page have each answered at least once.
   * With both in hand a failure is said ALONGSIDE the rows and everything
   * stays; with either missing there is nothing true to draw, so only the
   * failure and its retry are drawn -- and `promoteAbsence` is told `failed`
   * only in that second case, or its sentence would report a blip as an empty
   * record.
   */
  const releaseErrored = changelog.isError || deployments.isError;
  const releaseHeld = !!changelog.data && !!deployments.data;
  const releaseUnread = releaseErrored && !releaseHeld;
  const releaseStale = releaseErrored && releaseHeld;
  const absence = promoteAbsence({
    reading: releaseReading,
    failed: releaseUnread,
    states,
  });
  const retryRelease = () => {
    void changelog.refetch();
    void deployments.refetch();
    // THE THIRD READ RETRIES WITH THEM. The sentence under "Where it is live"
    // is now built from the merge list as well, so a retry that refreshed only
    // two of the three reads would leave the sharpest half of that sentence
    // permanently hedged behind a button the reader had already pressed.
    void applied.refetch();
  };

  const promote = useMutation({
    mutationFn: (v: { changesetId: string; title: string }) =>
      fPromote({ data: { changesetId: v.changesetId } }),
    /**
     * THE HALF-RECORDED PROMOTE HAS A DOOR HERE, and this is the only place a
     * person was ever going to find one.
     *
     * `promoteChangesetToProductionCore` ships the code first and then closes
     * the loop behind it: it stamps the spec shipped, files the stage event,
     * and arms the 30-day outcome window that is what later asks whether the
     * release worked. Any of those writes can be refused while the deploy
     * itself is perfectly live, so the server stopped swallowing them and now
     * returns `warnings` -- in the person's words, one sentence per thing that
     * did not get recorded. A receipt that read "You promoted it. Customers are
     * seeing it now." over a promote that armed no outcome window would be the
     * product claiming more than it did, and the person would find out in 30
     * days when nothing came back.
     *
     * IT IS NOT A FAILURE, and it does not wear failure's clothes. The deploy
     * reached production, so the verb still says so and the address is still
     * the first thing in the sentence; the warnings follow it, as their own
     * lines, each already carrying its own next move.
     */
    onSuccess: (res, v) => {
      const warnings = res.warnings ?? [];
      setReceipt({
        verb:
          warnings.length > 0
            ? "You promoted it, and part of the record did not follow"
            : "You promoted it",
        consequence: (
          <>
            {v.title} is live in production at{" "}
            <Door href={res.productionUrl}>
              <Num>{res.productionUrl}</Num>
            </Door>
            . Customers are seeing it now.
            {/* HOLD, NOT FAIL, and Meridian has the word for it now.
                `sp-warn` was a CLASS, and "warn" is not one of Meridian's five
                status words. The reasoning written here already named the right
                one: red reports a write that did NOT happen and this one did, so
                the line must not wear failure's colour. What is actually true of
                each of these is that a piece of the record is WAITING on a
                condition -- an outcome window that was not armed, a stage event
                that was refused -- which is exactly what amber says here.
                `Value tone="hold"` is that word, and it carries the meaning in
                `data-tone` rather than only in the paint. */}
            {warnings.map((w) => (
              <span key={w} className="mt-mrd-3 block">
                <Value tone="hold">{w}</Value>
              </span>
            ))}
          </>
        ),
      });
      // THE CARD LEAVES BEFORE THE REFETCH LANDS (P-124): excluded from
      // `ready` on this same render, so it cannot sit beside the receipt
      // above showing "Promote it" for a release that already is one.
      setJustPromoted((s) => new Set(s).add(v.changesetId));
      void qc.invalidateQueries({ queryKey: ["ship-deployments", wid] });
      void qc.invalidateQueries({ queryKey: ["changelog", wid] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not reach production",
        consequence: failureLine("Production is still running what it was.", e),
        failed: true,
      }),
  });

  /**
   * ASK THE PROVIDER AGAIN, for a release whose deploy never reached the record.
   *
   * THE CASE IT IS THE ONLY ANSWER TO. `ci-poll-tick` stops asking 60 minutes
   * after the merge (DEPLOY_CAPTURE_WINDOW_MS), a bound set by GitHub's
   * 5,000/hour installation limit rather than by any belief that an hour is
   * long enough. A pipeline slower than that -- a queued Actions job, a manual
   * approval gate, a nightly release -- publishes its deployment into a product
   * that has stopped listening, and until now nothing in the product could look
   * again: the server function existed, its own comment called it "the in-app
   * door", and no surface called it.
   *
   * A PRESS, NEVER A POLL. One press is roughly seven GitHub calls, so this is
   * not fired on mount, not on the 30s interval the list already runs, and not
   * twice: the mutation is disabled while in flight.
   *
   * `captured: 0` IS AN ANSWER AND NOT A FAILURE -- BUT ONLY WHEN THE PROVIDER
   * ANSWERED. The server no longer hedges across the two cases and this door no
   * longer pretends it has to: `captureDeployments` returns `read` beside the
   * count, `zeroCaptureMessage` has already chosen the one true sentence from
   * it, and that sentence is shown verbatim because it is the RIGHT one rather
   * than because "your pipeline has not published a deploy yet" and "the read
   * did not reach your provider" cannot be told apart. They can, from here, and
   * the Receipt says which: `not-connected` and `read-failed` wear failure's
   * verb and colour, because "You checked for deploys" printed over a sentence
   * saying Supaprod never reached the provider claims a read that never
   * happened. `answered` keeps the plain verb, which is the case this paragraph
   * is really about. Neither zero-capture case invalidates anything -- no row
   * was written, and a refetch would only spend a request redrawing the same
   * list.
   *
   * EVERY REFUSAL IS A SENTENCE. Not merged, no usable repo, GitHub not
   * connected, no provable landed commit, an upsert row-level security refused:
   * each throws its own plain-words message, and this routes them through the
   * same Receipt promote and rollback use rather than a toast, because a write
   * with a consequence renders a receipt on this surface.
   */
  const check = useMutation({
    mutationFn: (v: { changesetId: string; title: string }) =>
      fCapture({ data: { changesetId: v.changesetId } }),
    onSuccess: (res, v) => {
      // `read` IS WHAT SEPARATES THE TWO ZEROES, and it is on the response.
      // `captured: 0` with `read: "answered"` is the customer's own pipeline
      // having published nothing for this commit -- a fact about them, and not
      // a failure. With "not-connected" or "read-failed" nothing was asked, or
      // the ask never landed, and a Receipt reading "You checked for deploys"
      // over the server's own "Supaprod could not reach your repository's
      // deployment record" would be the two halves of one door disagreeing.
      // ("no-repo" cannot arrive here: the handler's parseRepo guard throws
      // before the read, and a throw lands on onError below.)
      const unread = res.captured === 0 && res.read !== "answered";
      setReceipt({
        verb: unread
          ? // The same verb as onError, deliberately: from the person's side
            // an unreachable provider and a thrown refusal are one outcome.
            "It could not check for deploys"
          : res.captured > 0
            ? "You checked, and the record moved"
            : "You checked for deploys",
        consequence: (
          <>
            {v.title}. {res.message}
          </>
        ),
        failed: unread,
      });
      if (res.captured > 0) {
        void qc.invalidateQueries({ queryKey: ["ship-deployments", wid] });
        void qc.invalidateQueries({ queryKey: ["changelog", wid] });
      }
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It could not check for deploys",
        consequence: failureLine("Nothing here moved, so what you see may be out of date.", e),
        failed: true,
      }),
  });

  /**
   * WRITE THE NOTES FOR A MERGE THAT HAS NONE, which is the act that gives it a
   * release at all.
   *
   * IT IS THE OTHER HALF OF THE CAPTURE DOOR, and neither half works alone for
   * the account this was written for. `captureDeployments` files the deploy rows
   * the cron gave up on, and files nothing into the changelog; the changelog is
   * what every list on this station is spined on. So a BYO merge that missed the
   * capture window stays invisible after a successful check, and the reader is
   * left pressing a button that reports a number they cannot see anywhere. This
   * writes `studio_changesets.release_notes`, which is one of the two columns
   * `trg_studio_changeset_to_changelog` fires on, and the entry is materialized
   * by the database rather than by this client.
   *
   * IT IS THE SAME DOOR STUDIO ALREADY CARRIES ("Write them", ChangesPanel),
   * calling the same server function, and that is two doors onto one act rather
   * than a second path: Studio is where you are standing when you have just
   * finished a change, this station is where you are standing when you are
   * asking why a merge never reached customers. `publishChangelogEntry`, which
   * this surface also holds, cannot stand in for it: it refuses with
   * 'no-release-notes' precisely here, because there are none to publish.
   *
   * NOT A SILENT AGENT. `generateReleaseNotesCore` is a real model pass over the
   * changeset's files and commits, so the block below draws AgentPulse while it
   * runs rather than only changing a label.
   *
   * THE RECEIPT PROMISES THE WRITE AND NOT THE ROW. The trigger is the database's
   * to fire, so this says the notes landed and that the release record is being
   * read again; whether the release appears is then said by the lists
   * themselves, which is where a reader can check it.
   */
  const writeNotes = useMutation({
    mutationFn: (v: { changesetId: string; title: string }) =>
      fNotes({ data: { changesetId: v.changesetId } }),
    onSuccess: (_res, v) => {
      setReceipt({
        verb: "You wrote the release notes",
        consequence: (
          <>
            {v.title} carries release notes now, and a merged change that carries them is what a
            release on this station is drawn from. The release record is being read again: once the
            release is there, the change leaves the merged-but-unlisted list and joins the lists
            that carry its deploy record and its promote.
          </>
        ),
      });
      void qc.invalidateQueries({ queryKey: ["changelog", wid] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The release notes were not written",
        consequence: failureLine("The release still has no notes.", e),
        failed: true,
      }),
  });

  /**
   * BRING A RELEASE'S ENTRY BACK IN LINE WITH THE CHANGE BEHIND IT.
   *
   * WHAT DRIFTS, AND WHY NOTHING FIXES IT ON ITS OWN.
   * `trg_studio_changeset_to_changelog` is declared `AFTER INSERT OR UPDATE OF
   * status, release_notes` (verified against this database on 2026-08-06), so a
   * write to any OTHER column of the changeset never re-fires it. The promote is
   * exactly that write: it stamps `studio_changesets.prd_id` with the spec it
   * shipped, and the entry's own `prd_id` -- which is what the release document
   * reads to name the bet, the spec and its outcome contract -- keeps the null it
   * was created with. The document then says "This release is not linked to a
   * spec" over a change that is. Title, body, pull request number and pull
   * request URL drift the same way.
   *
   * WHAT IT CANNOT DO, said plainly because the temptation is to expect it. It
   * cannot make a MISSING release appear here: this control hangs off a changelog
   * entry, so a merge with no entry has no entry to refresh. Live on 2026-08-06,
   * eight of the nine merges in the dogfood workspace are in exactly that state,
   * and all eight are missing for one reason -- nobody wrote release notes.
   *
   * THAT IS NO LONGER SOMEWHERE ELSE'S JOB. Their repair is the write that fires
   * the trigger, and this station now holds it: `applied` reads every merged
   * changeset, `unlistedMerges` subtracts the ones the changelog already knows,
   * and each remainder gets a row with `writeNotes` on it. Studio's "Write them"
   * is unchanged and calls the same server function; two doors onto one act is
   * correct here for the same reason the promote has two.
   *
   * `published: false` IS NOT A FAILURE and is not painted as one; a genuine
   * refusal throws and is.
   */
  const republish = useMutation({
    mutationFn: (v: { changesetId: string; title: string }) =>
      fRepublish({ data: { changesetId: v.changesetId } }),
    onSuccess: (res, v) => {
      setReceipt({
        verb: res.published ? "You refreshed the release" : "Nothing was refreshed",
        consequence: (
          <>
            {v.title}. {res.message}
          </>
        ),
      });
      if (res.published) void qc.invalidateQueries({ queryKey: ["changelog", wid] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The release could not be refreshed",
        consequence: failureLine("The entry still reads as it did.", e),
        failed: true,
      }),
  });

  /**
   * Rolling back from the station, behind ChangesPanel's own prompt.
   *
   * THE COPY IS COPIED DELIBERATELY, word for word. This is the second door
   * onto an act that already had one, and the failure mode of a second door is
   * that it is easier to walk through than the first: a rollback confirmed by a
   * one-word dialog here and by a typed reason there would mean the safer path
   * is the one nobody takes. A test asserts the two strings are still identical
   * rather than trusting whoever edits either file next.
   */
  const promptDialog = usePrompt();
  const rollback = useMutation({
    mutationFn: (v: { changesetId: string; title: string; reason: string }) =>
      fRollback({ data: { changesetId: v.changesetId, reason: v.reason } }),
    onSuccess: (res, v) => {
      // WHAT THIS SAYS IS WHAT HAS HAPPENED, and no more. `rollbackRelease`
      // stages the inverse changeset and starts a Build run that stops at its
      // first approval gate; it does NOT open the revert PR by itself. A
      // receipt reading "rolled back" would report a future.
      setReceipt({
        verb: "You started the revert",
        consequence: (
          <>
            A revert of {v.title} is staged and its run is open. It opens the pull request once you
            clear that run's gates in{" "}
            <AppLink href={`/studio/${res.revertMissionId}`}>
              <Num>the revert run</Num>
            </AppLink>
            , and it still passes CI and your review before it merges.
          </>
        ),
      });
      void qc.invalidateQueries({ queryKey: ["ship-deployments", wid] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The revert did not start",
        consequence: failureLine("Production is still running what it was.", e),
        failed: true,
      }),
  });

  async function askRollback(s: ReleaseState) {
    const reason = await promptDialog({
      title: "Roll back this release",
      body: "Opens a revert PR that restores the touched paths to their pre-merge state. It still passes CI and your review before it merges.",
      label: "Reason (optional)",
      placeholder: "Why are you rolling this back?",
      confirmLabel: "Open revert PR",
    });
    if (reason === null) return;
    rollback.mutate({
      changesetId: s.changesetId,
      title: s.title,
      reason: reason || "Operator-initiated rollback",
    });
  }

  const busy = create.isPending || update.isPending || submit.isPending || publish.isPending;
  const composing = mode.kind !== "idle";

  // The gate takes whichever post is genuinely waiting, unless you picked a
  // different one out of the list below. Published posts are never the gate:
  // they are already decided.
  const waiting = announcements.find((a) => a.status === "pending") ?? null;
  const stillDraft = announcements.find((a) => a.status === "draft") ?? null;
  const pickedPost = picked
    ? (announcements.find((a) => a.id === picked && a.status !== "published") ?? null)
    : null;
  const call: AnnouncementRow | null = pickedPost ?? waiting ?? stillDraft;

  // The post in focus is never drawn twice: the list below is the rest.
  const rest = announcements.filter((a) => a.id !== call?.id);
  const waitingCount = announcements.filter((a) => a.status === "pending").length;
  /* Drafts nobody has sent. They are waiting on the reader, and the headline
     says so rather than calling them nothing. See `ship-headline.ts`. */
  const draftCount = announcements.filter((a) => a.status === "draft").length;
  const loading = stillWaiting(posts, changelog);
  /**
   * THE GATE'S OWN WAIT, narrower than `loading` on purpose: the Gate asks only
   * about announcements, so holding it behind the changelog read as well would
   * park the one call to action on this station behind data it never renders.
   *
   * IT WAS `posts.isLoading`, AND THAT IS FALSE BEFORE A WORKSPACE IS KNOWN.
   * `posts` is `enabled: !!wid` and a disabled query in react-query v5 is
   * pending without fetching, so the branch fell straight past its Loading arm
   * to `call` -- null over an empty list -- and the biggest element on the
   * station opened every session asking "Write the first announcement?" of a
   * workspace whose announcements nobody had read yet. The Announcements block
   * at the foot of the page took the same fall in the same frame, which is why
   * it now waits on this flag too.
   */
  const postsReading = stillWaiting(posts);

  /**
   * THE ROLE READ HAD NO WAIT, NO ERROR BRANCH AND NO SENTENCE, so a role that
   * did not load rendered as "you are not allowed to announce".
   *
   * `members` was read at exactly one line (`members.data?.selfRole ?? null`)
   * and neither `isPending` nor `isError` appeared anywhere in this file. Every
   * announcement control hangs off `canContribute` / `canPublish`, including the
   * sole entry point, so a failed `listWorkspaceMembers` drew the biggest
   * element on the station as a Gate asking "Write the first announcement?" with
   * nothing underneath it: no button, no reason and no retry. That is the same
   * hole `promoteAbsence` was built to close on the release half of this
   * surface, left open on this half.
   *
   * THREE STATES, THREE ANSWERS, and the third is not a failure. The RPC can
   * come back fine and still carry no row for the caller
   * (`selfRole = members.find(m => m.isSelf)?.role ?? null`,
   * workspaces.functions.ts), which is a read that ANSWERED and answered
   * "unknown". Painting that as a refusal tells a person they lack a permission
   * nobody has checked, so it gets its own sentence rather than borrowing the
   * error's.
   *
   * `stillWaiting`, NOT `isLoading`, for the reason this file gives twice above:
   * `members` is `enabled: !!wid`, and a disabled query is pending WITHOUT
   * fetching.
   */
  const membersReading = stillWaiting(members);
  /** The read landed and still could not name a role. Never true while it is in
   *  flight or after it failed: those are different facts with their own arms. */
  const roleUnknown = !membersReading && !members.isError && role === null;

  /**
   * WHY DEPLOY ROWS ARE ON FILE AND NO RELEASE IS, said only in the arm where
   * that is what the record actually holds.
   *
   * Each branch is a different read state and none of them may borrow another's
   * confidence: a merge list that failed cannot say "nothing is waiting", and a
   * merge list still in flight cannot either. The zero case says what it can
   * prove and no more: `listAppliedChanges` returns a bounded page of the newest
   * merges, so it can prove that some merges are unlisted and never that none
   * is.
   */
  function whyNoneListed(): React.ReactNode {
    if (applied.isError) {
      return "Whether a merged change is waiting on those notes did not load, so this cannot say how many; the list below says so and offers the retry.";
    }
    if (!mergesKnown) return "Which merges are waiting on those notes is still being read.";
    if (unlisted.length === 0) {
      return "No merge on the newest page of merges is waiting on those notes, so what is on file was deployed for a change that has not landed.";
    }
    return (
      <>
        <Num>{unlisted.length}</Num>{" "}
        {unlisted.length === 1 ? "merged change is" : "merged changes are"} waiting on those notes,
        and each has a row of its own below with the door that writes them.
      </>
    );
  }

  // The one thing only this surface can see: what shipped against what was
  // said. Assembled from real rows, and drawn only when both reads succeeded.
  // Two passes over two short lists, so it is computed rather than memoised.
  const publishedAt = announcements
    .filter((a) => a.status === "published" && a.published_at)
    .map((a) => new Date(a.published_at as string).getTime())
    .filter((t) => Number.isFinite(t));
  const lastPublished = publishedAt.length ? Math.max(...publishedAt) : null;

  /*
   * NOTHING HAS EVER SHIPPED, which is a different fact from "nothing is
   * waiting to go out" and drives a different question below.
   *
   * Gated on `isSuccess` on purpose: an unread or failed changelog also has
   * zero entries, and treating that as "nothing shipped" would state a fact
   * about the workspace on the strength of a read that never answered. When
   * the read has not landed this stays false and the ordinary question shows,
   * which is the safe direction to be wrong in.
   */
  const nothingShipped = changelog.isSuccess && notes.length === 0;

  /**
   * THIS STATION HOLDS NOTHING AT ALL, which is not the same fact as any one of
   * its panels being empty and is the only state that earns a different screen.
   *
   * WHAT IT WAS LIKE WITHOUT THIS. Five Blocks, each correctly reporting its own
   * emptiness, and FOUR of them deriving that emptiness from the same
   * `notes.length === 0` off the same `changelog` read. A person opening Ship on
   * their first day was told nothing had shipped six times: a negated H1, the
   * announcement Gate, then "Where it is live" (heading, a paragraph of `sub`, and
   * an Empty that repeats the hosting explanation the `sub` had just given), "Live
   * releases", "What shipped", "The release document" and "Announcements". One
   * door on the whole screen, buried as the second action of the Gate.
   *
   * Every one of those panels is right on its own, which is exactly why no test
   * caught it: each asks "does this block behave correctly" and none asks "does
   * this page still say one thing once they all decline". That is the diagnosis
   * `_authenticated.learn.tsx` wrote when the same shape was fixed there, and this
   * is the same repair, not a new idea.
   *
   * EVERY READ MUST HAVE ANSWERED, and any failure keeps the panels. A read that
   * failed also has zero rows, so collapsing on emptiness alone would replace a
   * reachable `Failed` and its retry with a confident first-run screen -- the
   * product asserting a fact about the workspace from a question it never got an
   * answer to. Keeping the panels is the safe direction to be wrong in: at worst a
   * person sees the old noise, never a false story.
   *
   * DEPLOYS AND MERGES ARE CHECKED SEPARATELY FROM THE CHANGELOG on purpose. A
   * workspace can hold deploy rows or merged changes with no release notes, and in
   * that state the panels carry the only explanation of why nothing is listed. The
   * first-run screen would be false there.
   */
  const stationEmpty =
    changelog.isSuccess &&
    notes.length === 0 &&
    deployments.isSuccess &&
    deployRows.length === 0 &&
    posts.isSuccess &&
    announcements.length === 0 &&
    mergesKnown &&
    unlisted.length === 0 &&
    !releaseErrored &&
    !applied.isError &&
    !posts.isError;

  const untold = !changelog.isSuccess
    ? 0
    : notes.filter((e) => {
        const t = new Date(e.released_at).getTime();
        return Number.isFinite(t) && (lastPublished === null || t > lastPublished);
      }).length;

  /**
   * HAS THE CHANGELOG ANSWERED? One flag, because it is one read.
   *
   * Both the release list ("What shipped") and the release document below it
   * are drawn from `changelog`, and giving each its own wait flag is precisely
   * how two panels of one screen end up disagreeing about whether the workspace
   * has ever shipped. So this answers for both.
   *
   * `changelog.isLoading` IS NOT ENOUGH ON ITS OWN. Every read on this surface
   * is `enabled: !!wid`, and a disabled query is pending without fetching, so
   * `isLoading` is false before a workspace is known. Reading it alone would
   * draw "nothing has shipped yet" during the first paint of every session --
   * a confident, false sentence about an empty list nobody has looked in.
   *
   * THE FIRST TWO CLAUSES ARE REDUNDANT AND ARE ON THE RECORD RATHER THAN
   * HIDDEN. `stillWaiting(changelog)` subsumes both: a query disabled by
   * `enabled: !!wid` is pending, and `isLoading` implies pending. They stay
   * because they are what a reader of this surface actually hits and because
   * `src/routes/__tests__/ship-mounts-the-release-document.test.ts` pins them
   * by text. What `stillWaiting` adds on its own is the paused case: a query
   * paused with no network is pending WITHOUT fetching, so `isLoading` is false
   * there too and only `stillWaiting` still says wait.
   *
   * AND WHY THAT THIRD CLAUSE IS CONJOINED WITH `!changelog.isError`. This was
   * the workaround, and it is now the belt beside a fixed brace.
   *
   * `stillWaiting` USED TO BE `q.isPending || q.data === undefined`, and
   * react-query leaves `data` undefined after a read that failed with nothing
   * cached, so a cold failure satisfied it for ever. Both consumers below ("What
   * shipped" and "The release document") test `docReading` BEFORE
   * `changelog.isError`, so without this clause the two sections sat on "Reading
   * the release notes." / "Reading what has shipped." once react-query had
   * exhausted its retries, and neither the Failed sentence nor its refetch
   * button was reachable. A permanent spinner in place of a retry is worse than
   * the false empty state this flag exists to prevent: the empty state at least
   * ends.
   *
   * THIS FILE WAS THE ONLY PLACE THAT HAD WORKED AROUND IT, and that was the
   * tell. Two other call sites hit the same hole head-on and hung, which is what
   * a wrong SHAPE looks like from outside: a workaround repeated at every call
   * site is a defect that has learned to look like a convention. The helper was
   * fixed on 2026-08-11 to stand down on a failed read, so this clause is now
   * redundant. It stays because two tests pin it and because removing it would
   * make this surface's correctness depend on a helper elsewhere continuing to
   * behave a particular way, which it has now stopped doing once.
   *
   * The error branch owns the errored case, this flag owns the unanswered one,
   * and they must not both claim it.
   *
   * A picked id that has since left the list falls back to the newest rather
   * than to nothing, because a release document that vanishes on a background
   * refetch is worse than one that moves.
   */
  const docReading = !wid || changelog.isLoading || (stillWaiting(changelog) && !changelog.isError);
  const docEntry: ChangelogEntry | null =
    (docId ? notes.find((e) => e.id === docId) : undefined) ?? notes[0] ?? null;

  /**
   * One release's evidence, with the deploy standing filled in.
   *
   * The server read answers what the change contains; where it went is already
   * on `ReleaseState`, and its WORD belongs to `releaseStanding` -- the one
   * vocabulary that keeps `success` (a provider reporting a deploy) apart from
   * `claimed` (a person having typed a link). Resolved here and passed in, so
   * the summary composer never re-derives a distinction this product's central
   * claim rests on.
   *
   * Returns null while the read is out, so a row says nothing rather than
   * saying "no files", which is a claim about the change and not about the read.
   */
  function evidenceFor(e: ChangelogEntry): ReleaseEvidence | null {
    const csid = e.changeset_id;
    if (!csid) return null;
    const found = evidence.data?.[csid];
    if (!found) return null;
    const state = states.find((st) => st.changesetId === csid) ?? null;
    const status = state?.lastProductionStatus ?? null;
    const standing = status ? releaseStanding(status) : null;
    return {
      ...found,
      deployment: standing ? { word: standing.word, note: standing.note } : null,
    };
  }

  /** The focused release's evidence, resolved once for the document region. */
  const docEvidence = docEntry ? evidenceFor(docEntry) : null;

  /*
   * NULL WHERE THE ROUTE SAID "SHIP". On its own page the fallback was the
   * station's name over an empty heading slot; under Outcomes' own `<h1>` it
   * would be a second title saying nothing, and `shipHeadline` already
   * documents null as the loading contract -- "a heading that cannot know its
   * count says nothing rather than guessing zero". So the line is absent
   * while the counts are unknown and the block simply starts at its first
   * region.
   */
  const headline: string | null = posts.isError
    ? "The announcements did not load."
    : loading
      ? null
      : /*
         * A DRAFT IS NOT NOTHING, and this headline used to say it was.
         *
         * It counted only `pending` -- sent for approval and awaiting a
         * decision -- so with a draft sitting unsent it read "Nothing is
         * waiting to go out." eight lines above a gate saying "...is still a
         * draft" with a Send for approval button. Both halves correct about
         * their own fact, neither able to see the other's, and read together
         * they contradict. Photographed at 1440 on the live workspace.
         *
         * `shipHeadline` keeps the two waits apart rather than adding them up:
         * waiting on an APPROVER and waiting on YOU are different jobs, and the
         * second is the one a reader can do something about. Said ONCE, which
         * is the rule the comment here already carried.
         */
        shipHeadline({ pending: waitingCount, drafts: draftCount });

  /** The gap, stated once, under the headline. Never a number we do not have. */
  function gapLine(): React.ReactNode {
    if (loading || posts.isError || !changelog.isSuccess) return undefined;
    const word = untold === 1 ? "release" : "releases";
    if (untold > 0) {
      return lastPublished ? (
        <>
          <Num>{untold}</Num> {word} since the last one went out.
        </>
      ) : untold === 1 ? (
        /* "none of them" OVER A COUNT OF ONE. The plural pronoun was written
           for the many case and the singular branch fell through to it, so the
           demo workspace's one unannounced release read "1 release on the
           record, none of them announced." The fact is the same; only the
           agreement changes. */
        <>
          <Num>1</Num> release on the record, and it has not been announced.
        </>
      ) : (
        <>
          <Num>{untold}</Num> {word} on the record, none of them announced.
        </>
      );
    }
    const last = onDate(lastPublished);
    return last ? (
      <>
        The last one went out <Num>{last}</Num>.
      </>
    ) : undefined;
  }

  function startEdit(a: AnnouncementRow) {
    setDraftTitle(a.title);
    setDraftBody(a.body);
    setMode({ kind: "edit", id: a.id });
  }

  function startNew() {
    setDraftTitle("");
    setDraftBody("");
    setMode({ kind: "new" });
  }

  /**
   * A release note becomes the announcement's first draft (P-133, A-QUEUE.md).
   *
   * WHAT THIS SURFACE USED TO ASK OF A PERSON. *Pick one that is live to write
   * the announcement from it* opened the release document, not the composer,
   * and *Write another* opened an empty composer -- so A1 wrote the first
   * announcement by hand, from the release notes and the PR, because nothing
   * on the page did it for her.
   *
   * This used to call `generateLaunchKit`, a real model pass over the
   * changeset, to draft the customer half. That drafted prose in a document
   * with no review gate before it goes out, which is filler with a byline:
   * the packet's own words are "plain register, no filler, a verifiable
   * mechanism first". `announcementDraftBody` composes the same three parts
   * from columns already on the row instead -- the notes, the date, the PR,
   * the address -- and leaves the one part no row can answer, what the change
   * means for a customer, as a bracketed prompt for the person to write.
   */
  function startFrom(e: ChangelogEntry) {
    setDraftTitle(e.title.slice(0, 200));
    setDraftBody(
      announcementDraftBody({
        body: e.body,
        released_at: e.released_at,
        pr_number: e.pr_number,
        production_url: e.production_url,
      }),
    );
    setMode({ kind: "new" });
  }

  const gateLines = (a: AnnouncementRow): React.ReactNode[] => {
    const lines: React.ReactNode[] = [];
    const lead = firstLine(a.body);
    if (lead) lines.push(<span key="lead">{lead}</span>);
    const when = since(a.status === "pending" ? (a.submitted_at ?? a.created_at) : a.created_at);
    if (when) {
      lines.push(
        <span key="when">
          {a.status === "pending" ? "Submitted" : "Started"} <Num>{when}</Num>
        </span>,
      );
    }
    return lines;
  };

  /**
   * WHY THE CONTROLS UNDER THIS GATE ARE MISSING, when the reason is the role
   * read and not the reader's rights.
   *
   * EMPTY IN THE ORDINARY CASE, which is the whole shape of it: a role that
   * loaded and says "member" draws exactly what it drew before, and a role that
   * loaded and says nothing gets a sentence instead of a silent absence. The
   * two hedged cases are kept apart because they want different next moves: a
   * failed read has a retry sitting above the Gate, and a read that ANSWERED
   * with no membership row for the caller has no retry to offer, only a person
   * to ask.
   */
  function roleLines(): React.ReactNode[] {
    if (members.isError) {
      return [
        <span key="role">
          Your role in this workspace did not load, so the controls that depend on it are not drawn.
          Reading it again is the retry above.
        </span>,
      ];
    }
    if (roleUnknown) {
      return [
        <span key="role">
          Supaprod could not confirm your role in this workspace, so it is not drawing the controls
          that depend on one. An owner or an admin can check you are still a member.
        </span>,
      ];
    }
    return [];
  }

  /** The gap sentence, resolved once so the line below can decide on it. */
  const gap = gapLine();

  return (
    /* THE VERTICAL RHYTHM, STATED ONCE, WHICH THE RETIRED `Block` USED TO
       CARRY. `.sp-block` set `margin-top: 36px`, `padding-top: 24px` and a top
       rule on every region, so the page's spacing was a property of the
       component and a region rendered anywhere else brought it along. `Region`
       sets no outer margin at all -- the same decision `Actions` records for
       itself -- and every ported surface in this product states the gap at the
       Surface instead (Approvals, Brain, Discover all use `gap-mrd-7`). This
       one matches them, so seven stations do not each invent a different
       distance between their own sections. Stated on this column rather than
       on a `Surface` now: Outcomes owns the frame, and this block is one of
       its children. */
    <div className="flex flex-col gap-mrd-7">
      {/* THE AUTONOMOUS PATH IS THE PAGE'S TO MOUNT. `<CrewWorking
          station="ship" />` stood here and renders nothing unless an agent is
          genuinely mid-run, so it cost no space when the crew was idle and
          could not show a step that did not happen. Outcomes mounts it once,
          above every tab; a second one here would be two indicators of one
          crew. See use-live-agents.ts. */}

      {/* THE HEADLINE, KEPT AS A LINE BECAUSE THE PAGE ABOVE OWNS THE HEADING.
          `shipHeadline` is the sentence that stopped this station
          contradicting its own gate -- "Nothing is waiting to go out." eight
          lines above a draft with a Send for approval button under it -- and
          `gapLine` says the one number nothing else here says: releases on the
          record that nobody has announced. Neither survives being dropped for
          being a heading's job, so both are said once, here, in the register of
          a note rather than a title. Absent entirely while the counts are
          unknown, which is what `headline` being null means. */}
      {headline ? (
        <p className="mrd-meta">
          {headline}
          {gap ? <> {gap}</> : null}
        </p>
      ) : null}

      {/* PRODUCTION COMES BEFORE THE ANNOUNCEMENT, and the order is the
        argument. This station is called Ship and the nav calls it "Preview to
        production"; putting a change in front of customers is the act it is
        named for, and saying something about that change is what you do
        afterwards. The announcement gate below is untouched, and both are
        drawn at once when both are genuinely waiting, because they are two
        different decisions and hiding either would be the surface deciding
        for the reader which one their morning is about. */}
      {ready.length > 0 ? (
        <>
          {/* THE ADDRESS QUOTED IS THE ONE THAT MOVES. `previewUrl` is the
            newest preview of any origin, which on a repo that also runs its
            own pipeline can be a different deploy from the one this button
            promotes. A confirmation naming a URL other than the one it is
            about to ship is a confirmation of the wrong thing.
            `isReadyToPromote` is what put this row here, so the hosted
            address is guaranteed present.

            Rendered beside `Ask` rather than inside it: `Ask.risk`/`reason`
            are prose strings (its own header refuses a `children` slot), so
            a real link has nowhere to go inside the card. Keeping the actual
            clickable address is worth its own line rather than a URL a
            reader cannot open. */}
          <p className="mrd-copy">
            The preview is up at{" "}
            <Door href={ready[0].hostedPreviewUrl as string}>
              <Num>{ready[0].hostedPreviewUrl}</Num>
            </Door>
            .
          </p>
          <Ask
            question={askQuestion(`Take "${ready[0].title}" to production`)}
            reason={`Merged ${since(ready[0].releasedAt) ?? "recently"}${ready[0].productName ? ` into ${ready[0].productName}` : ""}.${ready.length > 1 ? ` ${ready.length - 1} more ${ready.length - 1 === 1 ? "is" : "are"} ready, each with its own promote under Where it is live.` : ""}`}
            risk="It moves that same commit to the production address. Customers see it immediately, and undoing it means a revert pull request."
            fallback={{ kind: "irreversible" }}
            // `Approve`, NOT the answer's default styling alone, earns its
            // meaning by being the ONE thing on this station that unblocks a
            // person's own decision (this file's own header: "Promoting is
            // always a person's call... no agent here can take that step on
            // its own"). `Ask.answer` renders through the same `Approve`
            // tone Meridian reserves for exactly that.
            answer={{
              label: "Promote it",
              busy: promote.isPending,
              onPress: () =>
                promote.mutate({ changesetId: ready[0].changesetId, title: ready[0].title }),
            }}
            decline={{ label: "Not now", onPress: () => {} }}
          />
          {/* WHAT PROMOTE DOES, which was the margin's sentence while a change
              was waiting on production and nothing was in the announcement
              gate. Outcomes owns the margin, so it stands here instead, under
              the one control it is about. `CtxBody` because that is the
              register it was written in and the shape this file already renders
              in the flow (see the drawing's legend below); a `Region` around
              three sentences would make a section out of a footnote. */}
          <CtxBody>
            It serves the commit already running on the preview from the production address. Same
            build, new audience. Taking it back means a revert pull request, which is why this is
            the one call on this station that reaches customers.
          </CtxBody>
        </>
      ) : null}

      {/* THE ROLE READ SAYING IT FAILED, above the gate whose controls it
        decides and NOT in place of it. Every announcement control on this
        station hangs off `selfRole`, and a `listWorkspaceMembers` failure
        used to render as an ordinary absence of buttons: a question with
        nothing under it, no explanation and no retry, indistinguishable from
        being told you may not act. Drawn here rather than inside the branch
        below so nothing is taken away to make room for it: the gate, the
        composer and the announcement in focus all stay exactly as they were,
        and this adds the reason and the way back. */}
      {members.isError ? (
        /* THE BOXED HALF OF THE PAIR, because there is no region around this
         one. `ReadFailedLine` is for a failure said inside a container that
         already exists; this sits at the top level of the surface between the
         page heading and the gate, where the retired `Failed` rendered it as a
         loose paragraph of red text with nothing to hold it. Every word is the
         one that was here: the heading is the sentence about the read, and the
         detail is the reassurance plus the provider's own message. */
        <ReadFailed
          onRetry={() => void members.refetch()}
          error={members.error}
          detail={
            <>Nothing here has changed. {(members.error as Error | null)?.message?.slice(0, 160)}</>
          }
        >
          Your role in this workspace did not load, so Supaprod cannot say which of these you are
          allowed to do, and it is not guessing.
        </ReadFailed>
      ) : null}

      {/* THE FIRST DAY ON THIS STATION, said once instead of six times.
        See `stationEmpty` for what this replaces and why every read has to have
        answered before it draws.

        IT SITS AHEAD OF `composing` so a person who has opened the composer
        keeps it. Writing an announcement before anything has shipped is allowed
        on this surface by deliberate decision, and the first-run screen must not
        close a door somebody already walked through.

        THE QUESTION NAMES WHAT ARRIVES, not what is absent. The old H1 was a
        negation, and every panel under it agreed; a person could read the whole
        screen and still not know what the station is for. The two lines are the
        sentences this file ALREADY had, moved rather than rewritten: what a
        release is drawn from, and the hosting condition from `absenceSentence`,
        which is the one precondition a person cannot infer.

        TWO DOORS, ONE PRIMARY, matching Learn. Build is primary because a merged
        change is what this station waits for and Build is where one comes from.
        Plan is secondary, because a change with no spec behind it can ship and
        then cannot be graded, which is the failure the station after this one
        sees most. */}
      {stationEmpty && !composing ? (
        <>
          {/* `Quiet.says` is a statement, never a question (its own header:
              "No question mark; a period") -- P-53 rewrites the old
              question-shaped headline as the fact it was actually reporting. */}
          <Quiet
            says="Nothing has come here to ship yet."
            whatWillAppear="A release lands the moment a merged change carries release notes: the preview address, the one promote that puts it in front of customers, and the announcement afterwards. For a repo Supaprod hosts, a merged change deploys a preview on its own in about two minutes, and promoting that preview is what ships it. For a repo it does not host, Supaprod records the deploys your own pipeline publishes and you promote those where they were built. Promoting is always a person's call. Customers see it immediately and undoing it means a revert, so no agent here can take that step on its own."
          />

          {/* `Action`, not `Approve`, and rendered beside `Quiet` rather than
            inside it: `Quiet` refuses an action slot on purpose (its own
            header: "there is nothing to do, and a button here is a door onto
            an empty room"), and these two are navigation, not answers to a
            question this state is not asking. Both navigate, and nothing on
            this station is held pending a click on either: the accent means
            a person is REQUIRED, and a door to Build is an offer.
            P-14 (A-QUEUE.md, R-34): /build and /plan are both deleted --
            the live block and work in flight are both Start's rows now,
            so both buttons land there. */}
          <Actions>
            <Action variant="primary" onClick={() => navigate({ to: SIGNED_IN_HOME })}>
              See what is being built
            </Action>
            <Action onClick={() => navigate({ to: SIGNED_IN_HOME })}>Open the specs</Action>
          </Actions>

          {/* WHAT THE THING BEING WAITED FOR LOOKS LIKE, drawn rather than
            described. Discover's empty desk established this and states the
            measurement: "example" is the highest-frequency term across 5.72M
            words of operator conversation, and two sentences about a release row
            teach less than one drawn row.

            IT IS NOT DATA AND IT NEVER TOUCHES THE RECORD. No id, no click, no
            tick, no read, no write. It renders only while the station genuinely
            holds nothing, and it says it is an illustration in the title, in the
            subtitle and on the row itself, which is the same three-times rule
            Discover's drawing follows. */}
          <Region
            title="What a release will look like here"
            sub="A drawing, not a release. Nothing here is in your record, and nothing here can be promoted."
          >
            <Row
              tight
              lead={<Num>app.yourproduct.com</Num>}
              sub={
                <>
                  <b>Illustration</b>
                  {" · "}Live in production · Address re-confirm at checkout · PR <Num>128</Num>
                </>
              }
              time="2h ago"
            />
            <CtxBody>
              The lead is the address that is actually answering, because that is the thing you
              copy, open and send to someone. Your own rows will carry the same facts from your own
              releases, each with the promote that put it there and the way back if it goes wrong.
            </CtxBody>
          </Region>
        </>
      ) : null}

      {composing ? (
        <Region title={mode.kind === "new" ? "A new announcement" : "Editing the announcement"}>
          {/* THE STACK'S OWN SPACING, WHICH THE RETIRED `Field` USED TO OWN.
            `.sp-field` carried `margin-top: 12px`, so two Fields and an
            Actions row spaced themselves and the composer never said so.
            Meridian's `Field` is a bare flex column with no outer margin --
            the same decision `Actions` records for itself -- so the column
            states the rhythm once here instead of three components each
            deciding the space above themselves. */}
          <div className="flex flex-col gap-mrd-5">
            {/* THE `htmlFor`/`id` PAIRS, WHICH ARE NOT OPTIONAL ON THIS `Field`.
              The retired one rendered its `<label>` AROUND the control, so
              containment bound them and no caller had to say anything.
              Meridian's renders `{children}` as a SIBLING of the label, so a
              straight swap leaves the control with no accessible name at all
              -- which its own header records happening at fifteen call sites
              in one day. Two controls here, two pairs. */}
            <Field label="What changed" htmlFor="ship-announcement-title">
              <Input
                id="ship-announcement-title"
                value={draftTitle}
                maxLength={200}
                autoFocus
                onChange={(e) => setDraftTitle(e.target.value)}
              />
            </Field>
            <Field label="What it means for your customers" htmlFor="ship-announcement-body">
              <Textarea
                id="ship-announcement-body"
                value={draftBody}
                maxLength={20000}
                rows={6}
                onChange={(e) => setDraftBody(e.target.value)}
              />
            </Field>
            <Actions>
              {/* SAVING A DRAFT UNBLOCKS NOTHING, so it is an `Action` and not
                an `Approve`. The one control on this station that releases
                held work is the promote, and the one below it that releases a
                submitted post is "Publish it". */}
              <Action
                variant="primary"
                disabled={!draftTitle.trim() || busy}
                onClick={() =>
                  mode.kind === "edit" ? update.mutate({ id: mode.id }) : create.mutate()
                }
              >
                {mode.kind === "edit" ? "Save the post" : "Save the draft"}
              </Action>
              <Action variant="quiet" busy={busy} onClick={() => setMode({ kind: "idle" })}>
                Cancel
              </Action>
            </Actions>
          </div>
        </Region>
      ) : posts.isError ? (
        <Actions>
          {/* A RETRY IS NEUTRAL, which is Meridian's rule rather than a
            preference: `ReadFailed` spells it out and three of the five
            surfaces that grew their own copy reached it independently. A
            re-read is not what this screen is asking a person to do. */}
          <Action onClick={() => void posts.refetch()}>Try again</Action>
        </Actions>
      ) : postsReading ? (
        <Reading>Reading what is ready to announce.</Reading>
      ) : membersReading ? (
        // THE SECOND READ THE GATE DEPENDS ON, and it had no wait at all. Its
        // own sentence rather than the one above, because "reading what is
        // ready to announce" is about the posts and this is about the reader.
        <Reading>Reading what you are allowed to do here.</Reading>
      ) : call ? (
        call.status === "pending" && canPublish ? (
          /* THE ONE CASE THAT IS GENUINELY A BINARY ASK. Every other branch
           below either has no real decline (draft, edit, compose are all
           next steps, not answers to a yes/no) or no controls at all, so
           only this one, "Send X to customers?", routes through `Ask`. */
          <Ask
            question={askQuestion(`Send "${call.title}" to customers`)}
            reason={[
              firstLine(call.body),
              since(call.submitted_at ?? call.created_at)
                ? `Submitted ${since(call.submitted_at ?? call.created_at)}`
                : null,
            ]
              .filter(Boolean)
              .join(" ")}
            fallback={{ kind: "irreversible" }}
            // The second `Approve` on this station, and the last. A pending
            // post is work that has STOPPED: a contributor sent it up and it
            // does not reach anybody until an owner or an admin presses this,
            // which `Ask.answer` renders through `Approve`'s own tone.
            answer={{ label: "Publish it", busy, onPress: () => publish.mutate(call.id) }}
            decline={{ label: "Not yet", onPress: () => {} }}
          />
        ) : (
          /* THE QUESTION IS THE FIRST THING READ, so it must not borrow the
           failed read's confidence either. "waiting on an owner or an admin"
           is `canPublish === false` said as a fact about the READER, and
           `canPublish` is false in all three of: you are a member who may not
           publish, your role did not load, and the read answered with no
           membership row for you. Saying it to an owner whose
           `listWorkspaceMembers` timed out tells them they lack a permission
           they hold. `roleLines()` beneath it says why the controls are gone.

           NONE OF THESE ARE A BINARY ASK, so this stays a plain heading
           rather than reaching for `Ask`, `Choice` or `Quiet`: a draft has
           one or more real next steps (send for approval, edit, write
           another) and none of them is a decline; a reader with no publish
           right sees the same question with nothing to press at all. */
          <div className="flex flex-col gap-mrd-3">
            <p className="mrd-title text-mrd-ink">
              {call.status === "pending"
                ? members.isError || roleUnknown
                  ? `"${call.title}" is waiting to be published.`
                  : `"${call.title}" is waiting on an owner or an admin.`
                : `"${call.title}" is still a draft.`}
            </p>
            {[...gateLines(call), ...roleLines()]}
            {call.status === "draft" && canContribute ? (
              <Actions>
                <Action variant="primary" busy={busy} onClick={() => submit.mutate(call.id)}>
                  Send for approval
                </Action>
              </Actions>
            ) : null}
            {canContribute ? (
              <Actions>
                <Action busy={busy} onClick={() => startEdit(call)}>
                  Edit the post
                </Action>
                <Action variant="quiet" busy={busy} onClick={startNew}>
                  Write another
                </Action>
              </Actions>
            ) : null}
          </div>
        )
      ) : (
        /*
         * THE QUESTION WITH NOTHING UNDER IT, which is what a lost role read
         * used to draw here. The Gate stays (a reader with no write rights has
         * always seen the question and should keep seeing it), and the reason
         * the button is absent is now said on the line beneath it.
         *
         * AND THE DAY ONE CASE, WHICH USED TO ASK FOR SOMETHING DISHONEST.
         * On a workspace where nothing has ever shipped, the biggest element on
         * this station asked "Write the first announcement?" with a primary
         * that opens a customer-facing composer. That is the loudest control on
         * the screen inviting a person to announce a release that does not
         * exist, and on the profile that dominates production it is the FIRST
         * thing they see here.
         *
         * The capability is not removed, because a team may legitimately
         * announce something this product never tracked. What changes is that
         * it stops being the recommended act: the question becomes a statement
         * of what is actually true, the line says what normally puts something
         * here, and the control drops from primary to ordinary. Nothing shipped
         * is not a problem to solve on this screen, it is a fact about
         * somewhere else.
         */
        <>
          {/* NOT DRAWN AT ALL WHEN THE FIRST-RUN SCREEN IS UP. `stationEmpty`
           already asks the station's one question with its own doors, and two
           gates about the same absence on one screen is the contradiction this
           surface's own notes keep warning about. Its `nothingShipped` arm still
           owns the case where something HAS shipped, or a deploy or merge exists,
           and only the announcements are empty.

           `Quiet.says` is a statement, never a question (its own header),
           so "Write the first announcement?" -- a question with no real
           decline, just an invitation -- becomes the fact it was reporting:
           nothing has been announced. */}
          <Quiet
            says={
              nothingShipped
                ? "Nothing has gone out, because nothing has shipped yet."
                : "Nothing has been announced yet."
            }
            whatWillAppear={
              nothingShipped
                ? "A release lands here once a merged change carries release notes. Until one does, there is nothing for an announcement to be about."
                : "Write one and it appears here, live at its own address, the moment it publishes."
            }
          />
          {/* Same reader-facing reason `roleLines()` already gives the
              announcement gate below, reused rather than restated: a role
              read that failed or came back empty is the same fact in both
              places, and two hand-copied sentences is how they would drift. */}
          {roleLines()}
          {/* Rendered beside `Quiet` rather than inside it: `Quiet` refuses
              an action slot on purpose (its own header). */}
          {canContribute || nothingShipped ? (
            <Actions>
              {canContribute ? (
                <Action
                  variant={nothingShipped ? "default" : "primary"}
                  busy={busy}
                  onClick={startNew}
                >
                  {nothingShipped ? "Write one anyway" : "Write an announcement"}
                </Action>
              ) : null}
              {/* THE DOOR TO THE SOMEWHERE ELSE THIS GATE NAMES.

                The comment above already had the right idea and stopped one step
                short: "Nothing shipped is not a problem to solve on this screen, it
                is a fact about somewhere else." It said where the answer lives and
                did not open it, so a person on a day-one Ship desk read an accurate
                sentence and had nowhere to press.

                This station had NO in-app door of any kind. Every link on it is an
                anchor to an external address (a production URL, a pull request) or
                one raw href to a legacy route name, so the router was never used
                from here at all. Found by the guard in
                routes/__tests__/every-station-hands-you-a-door.test.ts, which
                flagged Ship and Learn together.

                Primary when nothing has shipped, because then it IS the next act;
                absent otherwise, since a desk with releases on it does not need to
                be sent to Build. */}
              {/* P-14 (A-QUEUE.md, R-34): /build is deleted; the live block is
                Start's rows now. */}
              {nothingShipped ? (
                <Action variant="primary" onClick={() => navigate({ to: SIGNED_IN_HOME })}>
                  See what is being built
                </Action>
              ) : null}
            </Actions>
          ) : null}
        </>
      )}

      {/* WHERE IT GOES, the margin's other sentence, under the gate it is
          about rather than beside it. A person reading the gate is deciding
          whether to send this post to strangers, and the address it will be
          readable at is the fact that decision turns on; the second line is the
          role rule the server re-checks, said where the buttons it governs
          are. */}
      {call ? (
        <CtxBody>
          Once it is live, anyone can read it at <Num>/p/{call.slug}</Num>. Owners and admins
          publish.
        </CtxBody>
      ) : null}

      {/* What the last act caused. Publishing is the one thing here that reaches
      the public internet, so its consequence is a real address rather than a
      confirmation, and it stays on screen instead of sliding away. */}
      {receipt ? (
        <Receipt
          verb={receipt.verb}
          consequence={
            receipt.slug ? (
              <>
                Anyone can read it now at{" "}
                {/* OUTBOUND IN THE ONLY SENSE THAT MATTERS HERE: /p/<slug> is
                  the public page, readable by a stranger, and the person who
                  just published wants to look at it without losing the station
                  they published from. `Door` opens it in a new tab with
                  `noopener noreferrer`, which is what this anchor spelled out
                  by hand. */}
                <Door href={`/p/${receipt.slug}`}>
                  <Num>/p/{receipt.slug}</Num>
                </Door>
                .
              </>
            ) : (
              receipt.consequence
            )
          }
          failed={receipt.failed}
        />
      ) : null}

      {/* THE ADDRESSES, which is the question "where is it live" taken
        literally. One row per merged release, led by the URL that is actually
        answering, because that is the thing you copy, open and send to
        someone. The block that follows is led by the release TITLE instead:
        they are two different questions asked in two different moods, and a
        single list that tried to be both would lead with a title and bury the
        address in a sub, which is how the URL became unreachable text on this
        surface in the first place. */}
      {stationEmpty ? null : (
        <Region
          title="Where it is live"
          /* THE MERGE COUNT IS PASSED, AND `null` WHEN IT IS NOT KNOWN. Without
         it this sentence read "Nothing has merged yet" off an empty
         changelog, which is a claim about changesets made from a read of
         changelog entries. `mergesKnown` is false while the merge list is in
         flight or lost, and the sentence hedges instead of picking a side. */
          sub={absenceSentence(absence, mergesKnown ? unlisted.length : null)}
        >
          {/* THE STALE NOTE SITS ABOVE THE BRANCH, not inside one arm of it,
          because a read that failed with rows in hand is worth saying over
          whatever those rows turn out to be -- a list, or an Empty that is
          the last thing we genuinely read. `releaseUnread` and `releaseStale`
          cannot both be true, so this never stacks with the Failed below.

          WHICH IS WHY IT NAMES THE RECORD AND NOT THE ROWS. `releaseStale` is
          true whenever both reads have answered once, INCLUDING a pair that
          answered with nothing, and this sentence then sits directly above the
          Empty. "The last release rows that loaded" would be naming rows that
          do not exist. ChangesPanel says the same thing the same way. */}
          {releaseStale ? (
            /* THE BARE HALF OF THE PAIR, because this region already draws
           itself. `ReadFailed` boxes the failure for a region that is
           missing; two containers around one sentence is a frame, and the
           standard caps a region at one bordered box. */
            <ReadFailedLine onRetry={retryRelease} retryLabel="Read it again">
              This is the release record as it last loaded, which may be no releases at all; the
              refresh just now did not land, so this may have moved since.{" "}
              {((changelog.error ?? deployments.error) as Error | null)?.message?.slice(0, 160)}
            </ReadFailedLine>
          ) : null}
          {releaseUnread ? (
            <ReadFailedLine onRetry={retryRelease}>
              Where each release is serving did not load, so this list would be a guess.{" "}
              {((changelog.error ?? deployments.error) as Error | null)?.message?.slice(0, 160)}
            </ReadFailedLine>
          ) : releaseReading ? (
            <Reading>Reading where each release is serving.</Reading>
          ) : states.length === 0 ? (
            /* "NO DEPLOY IS ON THE RECORD YET" WAS PRINTED OVER DEPLOY ROWS THIS
           SURFACE WAS HOLDING, and `states.length === 0` is not the read that
           could say otherwise: it means the CHANGELOG is empty. `deployRows`
           comes from `listDeployments`, separately and independently, and it
           can hold rows for merged changesets whose notes were never written,
           because ci-poll-tick writes the preview row FIRST and only then
           attempts the notes, best effort. So the old sentence asserted the
           absence of deploys from a read that had answered, and its second
           clause told a BYO customer their own pipeline's deploys are not
           recorded while their rows sat in this very list.

           THE OLD COPY SURVIVES WORD FOR WORD in the arm where it is true:
           nothing on the deploy record at all. */
            deployRows.length > 0 ? (
              <NothingYet>
                <Num>{deployRows.length}</Num>{" "}
                {deployRows.length === 1 ? "deploy is" : "deploys are"} on the deploy record for
                this workspace, and none of them is listed here. This list is one row per RELEASE,
                and a release is drawn from a merged change that carries release notes, so a deploy
                whose change has none has nothing to sit under. {whyNoneListed()}
              </NothingYet>
            ) : (
              <NothingYet>
                No deploy is on the record yet. For a repo Supaprod hosts, a merged change deploys a
                preview on its own and one promote moves that same commit to the production address;
                for a repo it does not host, Supaprod records the deploys your own pipeline
                publishes and none appears here on its own.
              </NothingYet>
            )
          ) : (
            (allAddresses ? states : states.slice(0, VISIBLE)).map((s) => {
              const at = whereItIs(s);
              const promotable = isReadyToPromote(s);
              const promotingThis =
                promote.isPending && promote.variables?.changesetId === s.changesetId;
              /**
               * WHICH ROWS GET "Check for deploys": the ones where the deploy
               * record is the thing that is missing.
               *
               * A live release is finished, and a promotable one already has the
               * preview it needs and a primary act sitting in this same slot --
               * putting a second control beside Promote would dilute the one call
               * on this station that reaches customers. What is left is every
               * release that merged and has nothing here to open: no deploy row at
               * all, a preview the customer's own pipeline published with no
               * production row yet, a failed or in-flight deploy. Those are
               * exactly the rows the cron may have given up on.
               *
               * It is offered on rows that DO carry a deploy row too, and that is
               * intended: re-checking updates a captured row's status in place
               * (uq_deployments_capture), so a deploy that has since gone from
               * pending to success can land here.
               */
              const checkable = !promotable && !isLive(s);
              const checkingThis =
                check.isPending && check.variables?.changesetId === s.changesetId;
              return (
                <Row
                  key={s.changesetId}
                  tight
                  lead={at.address ? <Num>{at.address}</Num> : s.title}
                  /*
                   * THE DEPLOY STATE IS NOW SAID IN A VOICE, and this is the one
                   * honest live fact on the station.
                   *
                   * `listDeployments` polls every 30 seconds and returns
                   * `status`, and every one of `whereItIs`'s sentences was drawn
                   * in the same mute -- so "In production", a settled outcome, and
                   * "A production deploy is running", which is a thing happening
                   * while you read it, were typographically the same claim.
                   * `deployTone` splits them: `agent` for present tense, pass and
                   * fail for the two outcomes, quiet for a provider that would not
                   * say. It is a `Value`, so the meaning is in `data-tone` and not
                   * only in the colour.
                   *
                   * AND THE CLOCK COMES WITH IT. A tone says a deploy is running;
                   * it cannot say whether it is stuck. "started 14m ago" is the
                   * figure that makes SLOW composable, and it is drawn only while
                   * something is genuinely running, from the row that is running.
                   * The release TITLE stays where it was, after the state, so the
                   * row reads the same way it always did.
                   */
                  sub={
                    <>
                      <Value tone={deployTone(s)}>{at.state}</Value>
                      {s.inFlightSince && since(s.inFlightSince) ? (
                        <>
                          , started <Num>{since(s.inFlightSince)}</Num>
                        </>
                      ) : null}
                      {at.address ? <> · {s.title}</> : null}
                    </>
                  }
                  time={ago(s.productionAt ?? s.releasedAt)}
                  onClick={
                    at.address
                      ? () => window.open(at.address as string, "_blank", "noopener,noreferrer")
                      : undefined
                  }
                  action={
                    promotable ? (
                      // THE SECOND DOOR ONTO THE PROMOTE. The Gate above focuses
                      // one release; every other ready release needs its own way
                      // through or it is a capability with no door until the
                      // first one happens to go live.
                      <RowDoor
                        disabled={promote.isPending}
                        busy={promotingThis}
                        onClick={() =>
                          promote.mutate({ changesetId: s.changesetId, title: s.title })
                        }
                      >
                        {promotingThis ? "Promoting it" : "Promote it"}
                      </RowDoor>
                    ) : checkable ? (
                      // THE DOOR ONTO THE CAPTURE, at the same weight as the
                      // promote beside it and never at the same time: a row is
                      // either waiting on a person or waiting on a deploy record,
                      // and this answers the second.
                      <RowDoor
                        disabled={check.isPending}
                        busy={checkingThis}
                        onClick={() => check.mutate({ changesetId: s.changesetId, title: s.title })}
                      >
                        {checkingThis ? "Checking" : "Check for deploys"}
                      </RowDoor>
                    ) : null
                  }
                />
              );
            })
          )}
          {/* THE WAY PAST THE CAP, UNDER THE LAST ROW. It was in the region
          heading until this port, above rows the reader had not reached. */}
          {states.length > 0 && !releaseUnread && !releaseReading ? (
            <MoreRows
              shown={Math.min(VISIBLE, states.length)}
              total={states.length}
              open={allAddresses}
              onToggle={() => setAllAddresses((v) => !v)}
            />
          ) : null}
        </Region>
      )}

      {/* THE MERGES NO LIST ABOVE CAN REACH, which is the hole this station's
        own prose used to describe and leave open.

        THE DEFECT, IN ONE LINE: every act on this surface hangs off
        `releaseStates`, `releaseStates` walks changelog entries, and a merged
        change with no release notes has no entry. The capture door was
        therefore unreachable in exactly the case it was written for, because
        the only way onto a row is to already have the notes that the capture
        is what eventually produces. See `unlistedMerges` for the full loop.

        IT RENDERS WHEN THERE IS SOMETHING TO SAY AND NOT OTHERWISE. Rows when
        merges are waiting; the failure and its retry when the merge list did
        not load, because silence there would be read as "nothing is missing"
        off a read that never answered. A merge list that answered with
        nothing missing draws no block at all: a permanent panel reporting a
        non-event is the clutter this surface's own rebuild notes killed four
        other panels for. */}
      {applied.isError || (mergesKnown && unlisted.length > 0) ? (
        <Region
          title="Merged, not listed yet"
          sub={
            mergesKnown && unlisted.length > 0
              ? "A release is drawn from a merged change that carries release notes. These merged and never got any, so nothing above can reach them."
              : undefined
          }
        >
          {/* THE SAME TWO SENTENCES THE RELEASE BLOCKS USE, for the same
            reason: rows in hand plus a failed refresh is stale, not lost, so
            the rows stay and the failure is said beside them. With nothing in
            hand there is nothing true to draw, and the failure is all there
            is. */}
          {applied.isError ? (
            <ReadFailedLine
              onRetry={() => void applied.refetch()}
              error={applied.error}
              retryLabel="Read it again"
            >
              {mergesKnown
                ? "These are the merges as they last loaded; the refresh just now did not land, so one written up since may still be listed here."
                : "Which changes have merged did not load, so this station cannot say whether anything is missing from the lists above."}{" "}
              {(applied.error as Error | null)?.message?.slice(0, 160)}
            </ReadFailedLine>
          ) : null}
          {/* A GENUINELY DISPATCHED AGENT, so it gets the pulse.
            `generateReleaseNotesCore` is a model pass over the changeset's
            files and commits, which is the same bar the launch-kit draft in
            the composer clears; the capture beside it is a plain provider
            read and correctly has no pulse. */}
          {writeNotes.isPending ? (
            <div className="mb-mrd-4">
              <AgentPulse
                label="The crew is writing the release notes"
                seed="ship-release-notes"
                detail="Reading the files and the commits, then saying what changed"
              />
            </div>
          ) : null}
          {mergesKnown
            ? (allUnlisted ? unlisted : unlisted.slice(0, VISIBLE)).map((c) => {
                const writingThis =
                  writeNotes.isPending && writeNotes.variables?.changesetId === c.id;
                const checkingThis = check.isPending && check.variables?.changesetId === c.id;
                // SAID ONLY WHERE THERE ARE SOME. `listDeployments` returns a
                // bounded page, so a count of zero here proves nothing and "no
                // deploy on file" would be absence claimed from a read that can
                // only ever prove presence. A count above zero is a fact, and
                // it is the fact that tells a reader whether the capture door
                // beside it has already found something.
                const onFile = deployRows.filter((d) => d.changeset_id === c.id).length;
                const sub =
                  [
                    c.mission_title ? `in ${c.mission_title}` : c.repo || null,
                    onFile > 0 ? `${onFile} deploy${onFile === 1 ? "" : "s"} on file` : null,
                  ]
                    .filter((x): x is string => !!x)
                    .join(" · ") || null;
                return (
                  <Row
                    key={c.id}
                    tight
                    lead={c.title}
                    sub={sub}
                    time={ago(c.merged_at)}
                    action={
                      <>
                        {c.pr_url ? (
                          <Addr href={c.pr_url}>
                            {c.pr_number ? (
                              <>
                                PR <Num>{c.pr_number}</Num>
                              </>
                            ) : (
                              "The PR"
                            )}
                          </Addr>
                        ) : null}
                        {/* THE DOOR THAT CLOSES THE LOOP, and it leads. Writing
                          the notes is what materializes the release, so it is
                          the act that moves this row onto the station; the
                          capture beside it files deploy rows and, on its own,
                          still leaves the change invisible here. */}
                        <RowDoor
                          disabled={writeNotes.isPending}
                          busy={writingThis}
                          onClick={() => writeNotes.mutate({ changesetId: c.id, title: c.title })}
                        >
                          {writingThis ? "Writing the notes" : "Write the notes"}
                        </RowDoor>
                        {/* THE SAME CAPTURE THE ROWS ABOVE CARRY, reachable at
                          last for the merge the cron gave up on. Worth
                          pressing before the notes as well as after: it is
                          the only way to ask a provider that published its
                          deploy after DEPLOY_CAPTURE_WINDOW_MS ran out. */}
                        <RowDoor
                          disabled={check.isPending}
                          busy={checkingThis}
                          onClick={() => check.mutate({ changesetId: c.id, title: c.title })}
                        >
                          {checkingThis ? "Checking" : "Check for deploys"}
                        </RowDoor>
                      </>
                    }
                  />
                );
              })
            : null}
          {mergesKnown && unlisted.length > 0 ? (
            <MoreRows
              shown={Math.min(VISIBLE, unlisted.length)}
              total={unlisted.length}
              open={allUnlisted}
              onToggle={() => setAllUnlisted((v) => !v)}
            />
          ) : null}
        </Region>
      ) : null}

      {/* THE RELEASES THAT REACHED CUSTOMERS, each carrying the one act that
        takes it back. Rollback lived only inside the Changes tab of the run
        that produced the release, so undoing a bad ship meant first
        remembering which run it came from. Here it is a row on the station. */}
      {stationEmpty ? null : (
        <Region title="Live releases">
          {/* Same two questions as the block above, and the rollback is the
          reason they have to be asked separately here too: gating on
          `isError` alone took every "Roll back" door off the screen on a
          blip, which is the one control a person reaches for when something
          is going wrong and the read is most likely to be flaky.

          And the same wording rule as above: it names the record rather than
          the releases, because a read that landed on nothing is stale in the
          same way and this line then sits over "Nothing is in production
          yet." */}
          {releaseStale ? (
            <ReadFailedLine onRetry={retryRelease} retryLabel="Read it again">
              This is what was in production as of the last read that landed, which may be nothing
              at all; the refresh just now did not land, so this may have moved since.
            </ReadFailedLine>
          ) : null}
          {releaseUnread ? (
            <ReadFailedLine onRetry={retryRelease}>
              What is in production did not load.
            </ReadFailedLine>
          ) : releaseReading ? (
            <Reading>Reading what is in production.</Reading>
          ) : live.length === 0 ? (
            <NothingYet>
              Nothing is in production yet.{" "}
              {ready.length > 0
                ? `${ready.length === 1 ? "One change has" : `${ready.length} changes have`} a preview waiting for the promote above.`
                : "A release appears here the moment it is promoted, and each one keeps a way back."}
            </NothingYet>
          ) : (
            (allReleases ? live : live.slice(0, VISIBLE)).map((s) => {
              const reverting =
                rollback.isPending && rollback.variables?.changesetId === s.changesetId;
              return (
                <Row
                  key={s.changesetId}
                  tight
                  lead={s.title}
                  sub={
                    [
                      s.productName ?? null,
                      // `since` returns null for a timestamp it cannot read, and
                      // "live since null" is the classic template-literal leak: a
                      // string built from a value nobody checked. The bare "live"
                      // is the honest fallback, since being in production is a
                      // fact we hold even when the clock on it is not.
                      // AND THE "on" COMES OFF THE FRONT OF IT. `since` answers
                      // "5d ago" inside a week and "on Jul 9" outside one, and
                      // only the first half of that reads as a phrase after
                      // "live since": every release older than a week printed
                      // "live since on Jul 9". Stripping the preposition leaves
                      // "live since Jul 9" and "live since 5d ago", both of which
                      // are sentences.
                      s.productionAt && since(s.productionAt)
                        ? `live since ${(since(s.productionAt) as string).replace(/^on /, "")}`
                        : "live",
                      // A pull request number with no URL behind it is still a
                      // fact worth stating; it just is not a door, so it stays
                      // text here while the linked case moves to the action slot.
                      s.prNumber && !s.prUrl ? `PR #${s.prNumber}` : null,
                    ]
                      .filter((x): x is string => !!x)
                      .join(" · ") || null
                  }
                  time={ago(s.productionAt ?? s.releasedAt)}
                  onClick={() =>
                    window.open(s.productionUrl as string, "_blank", "noopener,noreferrer")
                  }
                  action={
                    <>
                      {s.prUrl ? (
                        <Addr href={s.prUrl}>
                          {s.prNumber ? (
                            <>
                              PR <Num>{s.prNumber}</Num>
                            </>
                          ) : (
                            "The PR"
                          )}
                        </Addr>
                      ) : null}
                      {/* ROLL BACK IS NOT RED, and that is a ruling rather than
                      a restraint. `rollbackRelease` is an INTENT: it stages
                      the inverse changeset and opens a run that still has to
                      clear its gates, pass CI and be reviewed. Red in this
                      system reports an OUTCOME -- what happened -- so painting
                      an intention with it would say the release had already
                      fallen over. What protects a destructive act here is
                      DISTANCE plus a confirm: the same quiet weight as every
                      other row control, at the far end of the row, behind the
                      prompt ChangesPanel asks word for word. */}
                      <RowDoor
                        disabled={rollback.isPending}
                        busy={reverting}
                        onClick={() => void askRollback(s)}
                      >
                        {reverting ? "Starting the revert" : "Roll back"}
                      </RowDoor>
                    </>
                  }
                />
              );
            })
          )}
          {live.length > 0 && !releaseUnread && !releaseReading ? (
            <MoreRows
              shown={Math.min(VISIBLE, live.length)}
              total={live.length}
              open={allReleases}
              onToggle={() => setAllReleases((v) => !v)}
            />
          ) : null}
        </Region>
      )}

      {stationEmpty ? null : (
        <Region
          title="What shipped"
          sub={
            /* Only the live ones can be picked now (P-96), so the invitation
               says which. Promising "pick one" over a list where most rows do
               nothing is the shape this packet removed from the rows. */
            canContribute && notes.length > 0
              ? live.length > 0
                ? "Pick one that is live to write the announcement from it."
                : "Nothing here is live yet, so there is nothing to announce."
              : null
          }
        >
          {/* THE SAME FLAG THE DOCUMENT USES, and it is the same read. This was
          `changelog.isLoading`, which is false while the query sits disabled
          waiting for a workspace, so this list answered "Nothing has shipped
          yet." on the first paint of every session -- to the eight
          workspaces that hold changelog entries as readily as to a new one
          (8 entries across 8 workspaces, counted on 2026-08-06). */}
          {docReading ? (
            <Reading>Reading the release notes.</Reading>
          ) : changelog.isError ? (
            <ReadFailedLine onRetry={() => void changelog.refetch()} error={changelog.error}>
              The release notes did not load.
            </ReadFailedLine>
          ) : shipItems.length === 0 ? (
            <NothingYet>
              Nothing has shipped yet. A release note is written from a merged change, so the first
              merge fills this in without anyone typing.
            </NothingYet>
          ) : (
            (allNotes ? shipItems : shipItems.slice(0, VISIBLE)).map((item) => {
              /*
               * A DEPLOY WITH NO CHANGESET, DRAWN IN ITS OWN WORDS (P-104,
               * A-QUEUE.md). It carries none of the seven facts the release
               * rows below read off a `ChangelogEntry` -- no title, no PR, no
               * bet, no spec -- so it is not a `ReleaseEvidence` short of one
               * field; it is a different fact, told in `handRecordedLine`'s own
               * sentence rather than the merge gate's four-line summary, which
               * has nothing here to summarise.
               *
               * THE ANNOUNCE CONTROL IS NEVER OFFERED (P-96's rule, restated for
               * a row that has no `mayAnnounce` to call): `claimed` is written
               * precisely so a pasted address can never stand as proof that
               * something shipped, and this row is that address with nothing
               * else behind it. The pasted address itself is still a real door,
               * because a person did tell us where to look.
               */
              if (item.kind === "handback") {
                const d = item.deploy;
                return (
                  <Row
                    key={`deploy-${d.id}`}
                    tight
                    lead={releaseStanding(d.status).word}
                    sub={handRecordedLine()}
                    time={ago(d.deployed_at ?? d.created_at ?? null)}
                    action={d.deploy_url ? <Addr href={d.deploy_url}>Open it</Addr> : null}
                    onClick={
                      d.deploy_url
                        ? () => window.open(d.deploy_url as string, "_blank", "noopener,noreferrer")
                        : undefined
                    }
                  />
                );
              }
              const e = item.entry;
              // A second line is a DIFFERENT fact, never the first one continued:
              // which product, origin opportunity, which pull request, and whether it's live in production.
              // The body belongs to the one post in focus, not to every row.
              //
              // TWO ADDRESSES USED TO BE PRINTED AS PROSE HERE. `production_url`
              // rendered as the words "live in production" and `pr_url` as "PR
              // #12", both flat text, while the URLs sat in the payload
              // unreachable: the only way to open either was to guess that
              // clicking the row might do it, which it only did for a reader who
              // could NOT contribute (a contributor's click starts a draft
              // instead). So the whole capability was hidden behind not having
              // permission to write.
              //
              // They move to the row's `action` slot rather than becoming links
              // in place, and that is forced rather than stylistic: `Row` renders
              // a clickable row as a <button>, and an <a> inside a <button> is
              // invalid markup React refuses to hydrate. The slot sits outside
              // the clickable region, so the row keeps its own click AND the
              // addresses become real doors.
              /*
               * ── WHAT IT CONTAINS LEADS THE SECOND LINE (P-96) ──────────
               *
               * The merge gate learned this the expensive way: "one file in a
               * checkout module" and "ninety lines of CSS in a stylesheet
               * nothing imports" are the same green check and different
               * decisions. The list said neither -- it named the product and
               * whether it was live, both of which are true of a release that
               * contains nothing anyone would want.
               *
               * ONE LINE, not the gate's four. This surface's own rule is that
               * a row is one line plus a different second fact and never
               * wraps, so the row takes the summary's LEAD sentence and the
               * release in focus carries the rest. Absent while the read is
               * out: a row that says nothing is honest, and one that says "no
               * files" because a query has not answered is not.
               */
              const ev = evidenceFor(e);
              const contains = ev ? releaseSummaryLines(ev)[0] : null;
              const cannotAnnounce =
                canContribute && !mayAnnounce({ productionUrl: e.production_url ?? null })
                  ? whyNotAnnounceable({ deployment: ev?.deployment ?? null })
                  : null;
              const meta = [
                contains,
                cannotAnnounce,
                e.product_name ?? null,
                e.opportunity_title ? `from ${e.opportunity_title}` : null,
                // A PR number with no URL is a fact but not a door, so it stays
                // as text; the linked case is in the action slot.
                e.pr_number && !e.pr_url ? `PR #${e.pr_number}` : null,
                e.production_url ? "live in production" : null,
              ]
                .filter((x): x is string => !!x)
                .join(" · ");
              //
              // THE THIRD DOOR ON THIS ROW, and it had to be a door of its own.
              // The row's click is already spoken for twice over -- a contributor
              // starts an announcement draft, everyone else opens the production
              // address -- so binding the document to it would have taken one
              // capability to pay for another. It sits in the action slot, which
              // is outside the clickable region, so all three survive.
              //
              // Absent on the release already in focus, because a control that
              // does nothing is worse than no control: the row is marked
              // `focused` instead, which says the same thing without promising an
              // act it cannot perform.
              const inFocus = docEntry?.id === e.id;
              const doors = (
                <>
                  {e.production_url ? <Addr href={e.production_url}>Open it</Addr> : null}
                  {e.pr_url ? (
                    <Addr href={e.pr_url}>
                      {e.pr_number ? (
                        <>
                          PR <Num>{e.pr_number}</Num>
                        </>
                      ) : (
                        "The PR"
                      )}
                    </Addr>
                  ) : null}
                  {inFocus ? null : <RowDoor onClick={() => setDocId(e.id)}>Its document</RowDoor>}
                </>
              );
              return (
                <Row
                  key={e.id}
                  tight
                  focused={inFocus}
                  lead={e.title}
                  sub={meta || null}
                  time={ago(e.released_at)}
                  action={doors}
                  onClick={
                    /*
                     * ── ONLY A LIVE RELEASE CAN BE ANNOUNCED (P-96) ────────
                     *
                     * An announcement is the one thing here a stranger reads.
                     * Every row offered the composer, including releases that
                     * merged and were never promoted -- so the act that goes
                     * out was available over changes that had not.
                     *
                     * `mayAnnounce` reads `production_url`, which
                     * `listChangelog` resolves from environment=production AND
                     * status=success. That is the provider's word, and it is
                     * the only word strong enough to say this out loud: a
                     * pasted address is recorded `claimed` precisely so it can
                     * never stand as proof that something shipped.
                     *
                     * The row keeps its other two clicks. What goes is the
                     * composer, and the reason is on the row.
                     */
                    canContribute && mayAnnounce({ productionUrl: e.production_url ?? null })
                      ? () => startFrom(e)
                      : e.production_url
                        ? () =>
                            window.open(e.production_url as string, "_blank", "noopener,noreferrer")
                        : e.pr_url
                          ? () => window.open(e.pr_url as string, "_blank", "noopener,noreferrer")
                          : undefined
                  }
                />
              );
            })
          )}
          {shipItems.length > 0 && !changelog.isError && !docReading ? (
            <MoreRows
              shown={Math.min(VISIBLE, shipItems.length)}
              total={shipItems.length}
              open={allNotes}
              onToggle={() => setAllNotes((v) => !v)}
            />
          ) : null}
        </Region>
      )}

      {/* THE RELEASE DOCUMENT. `WhatShipped` renders its own top-level regions --
        the release, why it was built, what it promised, who signed it off, the
        receipts, and what is not on the record -- so it is mounted as a
        SIBLING of this one rather than inside it.

        This region is the lead-in, and its children are the one thing the
        document itself cannot say: where its sentences come from. That is not
        decoration. The document's entire worth is that a reader can trace
        every line to a row, and a reader who does not know that reads it as
        generated prose and discounts all of it. */}
      {stationEmpty ? null : (
        <Region
          title="The release document"
          /* THE REPAIR SITS WHERE THE DRIFT IS READ. Everything below is read
         from `changelog_entries`, and that row is written by a trigger that
         only fires on the changeset's status and release notes -- so a
         promote that stamped the spec afterwards never reaches it, and the
         document goes on saying "This release is not linked to a spec" over a
         change that is. This re-reads the changeset and writes the entry
         again. It is absent while the read is in flight, over a failed read,
         and over an entry with no changeset behind it, because in each of
         those there is nothing to refresh from.

         THE THIRD GUARD RESTS ON THE COLUMN, NOT ON THE FOREIGN KEY, and an
         earlier version of this comment had that exactly backwards. It said
         the key was ON DELETE SET NULL "so shipped history outlives a deleted
         build session". Queried against this database on 2026-08-06,
         `changelog_entries_changeset_id_fkey` is `REFERENCES
         studio_changesets(id) ON DELETE CASCADE`; only `prd_id` is SET NULL.
         Deleting a build session therefore takes the changelog entry with it
         and shipped history does NOT survive one -- the reverse of what was
         written here. Two migrations disagree and the later one won:
         20260629120200_byo_p3_changelog.sql:12-16 declares SET NULL,
         20260630180128_7bc70fcc-811a-42fa-9d76-f21c7b26d043.sql:93 creates
         the table with CASCADE, and CASCADE is what is live.

         What actually justifies the guard is that `changeset_id` is NULLABLE
         (information_schema, same date), so an entry can exist with no
         changeset to re-read -- one written by anything other than
         trg_studio_changeset_to_changelog. No entry is in that state today
         (8 entries, all carrying a changeset), so this guards a shape the
         schema permits rather than one the data currently shows. The code
         was right before and is unchanged; only the reason was false.

         THE GUARD IS NO LONGER ONLY IN THE HANDLER. It said so here: "`Block`'s
         `more` renders a plain button with no `disabled` prop; the label
         carries the in-flight state", so the control stayed live while the
         mutation ran and a second press was stopped by an `if` rather than by
         the button. `Region` splits that prop three ways and this one is
         `act`: a control that DOES something to the region's subject, rather
         than revealing more of it (`toggle`) or leaving it (`goTo`). `acting`
         is the half `Block` could not express -- it disables the control and
         announces `aria-busy` while the write is out, which is the same fact
         the label was carrying alone. The handler's guard stays as the belt. */
          act={
            !docReading && !changelog.isError && docEntry?.changeset_id
              ? republish.isPending
                ? "Refreshing it"
                : "Refresh it from the change"
              : undefined
          }
          acting={republish.isPending}
          onAct={() => {
            const csid = docEntry?.changeset_id;
            if (republish.isPending || !docEntry || !csid) return;
            republish.mutate({ changesetId: csid, title: docEntry.title });
          }}
        >
          {docReading ? (
            <Reading>Reading what has shipped.</Reading>
          ) : changelog.isError ? (
            <ReadFailedLine onRetry={() => void changelog.refetch()} error={changelog.error}>
              The releases did not load, so there is no document to assemble.
            </ReadFailedLine>
          ) : !docEntry ? (
            <NoReleaseYet />
          ) : (
            <>
              {/* ── THE EVIDENCE, IN FULL, FOR THE ONE IN FOCUS (P-96) ──────
                  The same lines the merge gate composes, plus where it went.
                  Here rather than on every row because this surface's rule is
                  that only the post in focus carries its evidence, and four
                  facts on every row is the wrap it forbids. Above the prose:
                  what the release contains decides whether the document below
                  is worth reading. */}
              {(docEvidence ? releaseSummaryLines(docEvidence) : []).map((line) => (
                <Row key={line} tight lead={line} />
              ))}
              <Prose markdown>
                <p>
                  Everything below is read from rows this release already has: the bet it came from,
                  the spec and its outcome contract, the design gate, the changeset and its pull
                  request, the production deploy, and the outcome once Learn settles it. No sentence
                  here was written for this document, and whatever is missing is named rather than
                  left out.
                  {notes.length > 1
                    ? " It covers the release marked above; pick another to read that one instead."
                    : null}
                  {/* SAID BECAUSE THE CONTROL IS OTHERWISE UNEXPLAINED. "Refresh it
                from the change" is in this region's header, and a reader who
                does not know what it re-reads cannot tell it from a reload.
                The named columns are exactly the ones the entry copies from
                the changeset. */}
                  {docEntry.changeset_id
                    ? /* NO BARE DOUBLE HYPHENS IN A SENTENCE A CAMERA READS. The
                   pair that stood here rendered as two hyphens either side of
                   a clause, which looks like a markdown artefact rather than
                   punctuation; commas carry the same aside. */
                      ' If a line here is behind the change itself, most often the spec, which a promote links after this entry was written, "Refresh it from the change" re-reads the changeset and brings the title, the notes, the pull request and that link back into the entry.'
                    : null}
                </p>
              </Prose>
            </>
          )}
        </Region>
      )}
      {!docReading && !changelog.isError && docEntry ? (
        <WhatShipped entry={docEntry} workspaceId={wid || null} />
      ) : null}

      {/* THIS REGION HAD NO WAIT AT ALL, which is the same defect as the Gate's
        in its plainest form: it branched straight on `announcements.length`,
        so "Nothing has gone out yet." was the first thing every session said
        about a list nobody had read. It renders NOTHING while the read is out
        rather than a second Loading -- the Gate above already says "Reading
        what is ready to announce." over the same query, and one read said
        twice on one screen is how a surface starts contradicting itself. */}
      {postsReading || posts.isError ? null : announcements.length === 0 ? (
        <Region title="Announcements">
          <NothingYet>
            Nothing has gone out yet.{" "}
            {/* THE SECOND CLAUSE IS ABOUT THE READER, so it cannot be drawn
              from a role read that did not answer. `canContribute` is false
              for a member who may not write AND for an owner whose role
              failed to load, and "An owner or an admin writes the first one."
              said to the second one is a permission they hold, denied on
              their behalf. The failure and its retry are named once above,
              by the `ReadFailed` over the composer; this only stops asserting
              the opposite. */}
            {canContribute
              ? "Write one and it waits here until an owner publishes it."
              : members.isError || roleUnknown
                ? "Supaprod could not confirm your role here, so whether you can write one is not known."
                : "An owner or an admin writes the first one."}
          </NothingYet>
        </Region>
      ) : rest.length > 0 ? (
        <Region title="Announcements">
          {(allPosts ? rest : rest.slice(0, VISIBLE)).map((a) => (
            <Row
              key={a.id}
              tight
              lead={a.title}
              sub={stateLine(a)}
              time={ago(a.published_at ?? a.submitted_at ?? a.created_at)}
              onClick={() =>
                a.status === "published"
                  ? window.open(`/p/${a.slug}`, "_blank", "noopener,noreferrer")
                  : setPicked(a.id)
              }
            />
          ))}
          <MoreRows
            shown={Math.min(VISIBLE, rest.length)}
            total={rest.length}
            open={allPosts}
            onToggle={() => setAllPosts((v) => !v)}
          />
        </Region>
      ) : null}
    </div>
  );
}
