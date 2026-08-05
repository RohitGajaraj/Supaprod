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
 */

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
// The launch-kit import stands alone, and merging the two lines will go red.
// ship-has-an-agent.test.ts guards the exact statement `import {
// generateLaunchKit } from "@/lib/studio.functions"` because that capability
// existed for weeks with its only caller on another surface, and the guard
// exists so nobody quietly drops it again. Adding a name to that line breaks a
// rule about a different thing entirely, so the rollback comes in on its own.
import { generateLaunchKit } from "@/lib/studio.functions";
import { rollbackRelease } from "@/lib/studio.functions";
import { listDeployments, promoteToProduction } from "@/lib/deployments.functions";
import { usePrompt } from "@/hooks/use-confirm";
import { AgentPulse } from "@/components/shell/AgentPulse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import { listChangelog, type ChangelogEntry } from "@/lib/changelog.functions";
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
import {
  Actions,
  Block,
  Button,
  CtxBody,
  CtxHead,
  Empty,
  Failed,
  Loading,
  Field,
  Gate,
  Input,
  Num,
  PageHead,
  Prose,
  Receipt,
  Row,
  Surface,
  Textarea,
} from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";
// The release document. It renders its own top-level Blocks, so it is a sibling
// of them rather than a child of one: a Block inside a Block is the second
// nested container the standard caps at one.
import { NoReleaseYet, WhatShipped } from "@/components/ship/WhatShipped";

/** Anti-scroll: each list opens short and expands on demand. */
const VISIBLE = 6;

/**
 * A quiet control or link inside a row, at the system's own weight for it
 * (`Failed` uses the same class for its retry, ChangesPanel for its per-row
 * controls). A 38px Button in a `tight` row doubles the row's height, so a
 * control that belongs to ONE row wears this instead. It is a real button or a
 * real anchor either way: quieter paint, identical capability.
 */
const QUIET = "sp-block-more";

/** An address rendered as the door it is. Sits in a Row's `action` slot and
 *  never in `sub`, because `Row` renders a clickable row as a <button> and an
 *  <a> inside a <button> is invalid markup that React refuses to hydrate. */
function Addr({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    /* NO textDecoration OVERRIDE. It was set to "none", which strips the dotted
       rest-state underline QUIET supplies and which hover cannot put back -- so
       the address stopped announcing itself as a link at all, and the only cue
       left was colour. This is the second time this surface has made an address
       unreachable, which is why the test now asserts the absence of the
       override rather than the presence of the class. */
    <a className={QUIET} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
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
  environment: string;
  status: string;
  deploy_url: string | null;
  deployed_at?: string | null;
  created_at?: string | null;
};

/** One merged release, with everywhere it is currently serving. */
export type ReleaseState = {
  changesetId: string;
  title: string;
  productName: string | null;
  releasedAt: string;
  prNumber: number | null;
  prUrl: string | null;
  /** Newest SUCCESSFUL preview deploy that recorded an address. */
  previewUrl: string | null;
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
};

/** Sort key for a deploy row. `deployed_at` is the truth; `created_at` is the
 *  fallback for a row captured before it finished. */
function deployStamp(d: ShipDeployment): number {
  const t = new Date(d.deployed_at ?? d.created_at ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
}

/**
 * The newest deploy for one environment. `successOnly` also demands a recorded
 * address, because a success with no `deploy_url` is not a door and rendering
 * it as one would be a link to nowhere.
 *
 * Ties keep the EARLIER array element. The server orders newest first, so on
 * equal timestamps that is still the newest row rather than an arbitrary one.
 */
function newestDeployment(
  rows: readonly ShipDeployment[],
  environment: string,
  successOnly: boolean,
): ShipDeployment | null {
  let best: ShipDeployment | null = null;
  for (const d of rows) {
    if (d.environment !== environment) continue;
    if (successOnly && (d.status !== "success" || !d.deploy_url)) continue;
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

  const states: ReleaseState[] = [];
  for (const e of notes) {
    if (!e.changeset_id) continue;
    const rows = byChangeset.get(e.changeset_id) ?? [];
    const preview = newestDeployment(rows, "preview", true);
    const prodOk = newestDeployment(rows, "production", true);
    const prodAny = newestDeployment(rows, "production", false);
    const fromChangelog = (e.production_url ?? "").trim() || null;
    const productionUrl = prodOk?.deploy_url ?? fromChangelog;
    states.push({
      changesetId: e.changeset_id,
      title: e.title,
      productName: e.product_name ?? null,
      releasedAt: e.released_at,
      prNumber: e.pr_number ?? null,
      prUrl: e.pr_url ?? null,
      previewUrl: preview?.deploy_url ?? null,
      productionUrl,
      productionAt: prodOk?.deployed_at ?? prodOk?.created_at ?? null,
      // A resolved address IS a successful production deploy: listChangelog
      // derives it from environment=production AND status=success.
      lastProductionStatus: productionUrl ? "success" : (prodAny?.status ?? null),
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
 * Can a person move this one to production right now?
 *
 * The three conditions are the server's own, restated so the button is only
 * drawn where the click will work: merged (guaranteed by being a changelog
 * entry at all), a successful preview to promote (`promoteChangesetToProduction`
 * throws without one), and nothing already in production.
 *
 * A FAILED production attempt IS promotable again -- that is the retry, and
 * withholding it would strand a release whose deploy fell over on a network
 * blip. A pending, in-progress, unknown or address-less success is NOT: one
 * production deploy of a commit is already under way or already happened, and a
 * second click would race it.
 */
export function isReadyToPromote(s: ReleaseState): boolean {
  if (!s.previewUrl) return false;
  if (s.productionUrl) return false;
  return s.lastProductionStatus === null || s.lastProductionStatus === "failure";
}

/** Live means a production address a stranger can open. Nothing weaker. */
export function isLive(s: ReleaseState): boolean {
  return !!s.productionUrl;
}

/**
 * The address a release is currently answering on, and the plain-words state
 * behind it.
 *
 * EVERY `DeployStatus` HAS A SENTENCE (deployments.ts normalizes provider vocab
 * to success | failure | pending | in_progress | unknown). A status this
 * function did not name would fall through to "no deploy on the record", which
 * reports an attempted deploy as an absent one -- the product claiming less
 * than it did, which is the same defect as claiming more.
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
  if (s.previewUrl) return { address: s.previewUrl, state: "Preview only, nobody has promoted it" };
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
  | { kind: "no-preview"; count: number };

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
  return { kind: "no-preview", count: args.states.length - live };
}

/** The sentence for an absence, or null where another element already says it
 *  (the Gate, the Loading, the Failed). Never two things saying one thing. */
export function absenceSentence(a: PromoteAbsence): string | null {
  switch (a.kind) {
    case "ready":
    case "reading":
    case "failed":
      return null;
    case "no-releases":
      return "Nothing has merged yet, so there is nothing to promote. A merged change deploys a preview on its own, and promoting that preview is what puts it in front of customers.";
    case "all-live":
      return a.count === 1
        ? "The one release on the record is already in production."
        : `All ${a.count} releases on the record are already in production.`;
    case "no-preview":
      return a.count === 1
        ? "One release has merged and has no successful preview yet. The preview lands on its own after a merge, in about two minutes."
        : `${a.count} releases have merged and none has a successful preview yet. The preview lands on its own after a merge, in about two minutes.`;
  }
}

type Mode = { kind: "idle" } | { kind: "new" } | { kind: "edit"; id: string };

function Ship() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("ship");
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const wid = activeWorkspaceId ?? "";

  const fChangelog = useServerFn(listChangelog);
  const fLaunchKit = useServerFn(generateLaunchKit);
  const fList = useServerFn(listAnnouncements);
  const fMembers = useServerFn(listWorkspaceMembers);
  const fCreate = useServerFn(createAnnouncement);
  const fUpdate = useServerFn(updateAnnouncement);
  const fSubmit = useServerFn(submitForApproval);
  const fPublish = useServerFn(approveAndPublish);
  const fDeployments = useServerFn(listDeployments);
  const fPromote = useServerFn(promoteToProduction);
  const fRollback = useServerFn(rollbackRelease);

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

  const notes = changelog.data?.entries ?? [];
  const announcements = posts.data?.announcements ?? [];
  // The deployments table is not in the generated Supabase types yet, so the
  // read arrives untyped. Same cast ChangesPanel makes, made once.
  const deployRows = (deployments.data?.deployments ?? []) as ShipDeployment[];

  const role = (members.data?.selfRole ?? null) as WorkspaceRole | null;
  const canContribute = !!role && TRANSITION_ROLES["draft->pending"].includes(role);
  const canPublish = !!role && TRANSITION_ROLES["pending->published"].includes(role);

  const [mode, setMode] = React.useState<Mode>({ kind: "idle" });
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  /** True while the crew is writing the customer half of an announcement. */
  const [drafting, setDrafting] = React.useState(false);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [allNotes, setAllNotes] = React.useState(false);
  const [allPosts, setAllPosts] = React.useState(false);
  const [allAddresses, setAllAddresses] = React.useState(false);
  const [allReleases, setAllReleases] = React.useState(false);
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
      setReceipt({ verb: "It did not go up", consequence: e.message, failed: true }),
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
      setReceipt({ verb: "It did not publish", consequence: e.message, failed: true }),
  });

  /* -------------------------------------------------------------- *
   * Preview to production, which is what the nav has always promised.
   * -------------------------------------------------------------- */

  // Computed, not memoised, for the reason stated further down this file about
  // the announcement counts: both inputs are short bounded lists (100 entries
  // and 100 deploy rows at most), and a useMemo over two `?? []` fallbacks
  // re-runs on every render anyway because each fallback is a fresh array.
  const states = releaseStates(notes, deployRows);
  const ready = states.filter(isReadyToPromote);
  const live = states.filter(isLive);

  // A release read is TWO reads, and either one failing makes the join a guess:
  // deployments alone cannot say which changeset merged, and the changelog
  // alone cannot say what is serving. So both halves gate together rather than
  // letting one render a confident half-answer.
  const releaseReading = changelog.isLoading || deployments.isLoading;
  const releaseFailed = changelog.isError || deployments.isError;
  const absence = promoteAbsence({
    reading: releaseReading,
    failed: releaseFailed,
    states,
  });
  const retryRelease = () => {
    void changelog.refetch();
    void deployments.refetch();
  };

  const promote = useMutation({
    mutationFn: (v: { changesetId: string; title: string }) =>
      fPromote({ data: { changesetId: v.changesetId } }),
    onSuccess: (res, v) => {
      setReceipt({
        verb: "You promoted it",
        consequence: (
          <>
            {v.title} is live in production at{" "}
            <a
              href={res.productionUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--sp-ink)" }}
            >
              <Num>{res.productionUrl}</Num>
            </a>
            . Customers are seeing it now.
          </>
        ),
      });
      void qc.invalidateQueries({ queryKey: ["ship-deployments", wid] });
      void qc.invalidateQueries({ queryKey: ["changelog", wid] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not reach production", consequence: e.message, failed: true }),
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
            <a href={`/studio/${res.revertMissionId}`} style={{ color: "var(--sp-ink)" }}>
              <Num>the revert run</Num>
            </a>
            , and it still passes CI and your review before it merges.
          </>
        ),
      });
      void qc.invalidateQueries({ queryKey: ["ship-deployments", wid] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "The revert did not start", consequence: e.message, failed: true }),
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
  const loading = posts.isLoading || changelog.isLoading;

  // The one thing only this surface can see: what shipped against what was
  // said. Assembled from real rows, and drawn only when both reads succeeded.
  // Two passes over two short lists, so it is computed rather than memoised.
  const publishedAt = announcements
    .filter((a) => a.status === "published" && a.published_at)
    .map((a) => new Date(a.published_at as string).getTime())
    .filter((t) => Number.isFinite(t));
  const lastPublished = publishedAt.length ? Math.max(...publishedAt) : null;

  const untold = !changelog.isSuccess
    ? 0
    : notes.filter((e) => {
        const t = new Date(e.released_at).getTime();
        return Number.isFinite(t) && (lastPublished === null || t > lastPublished);
      }).length;

  /**
   * The release the document is assembled for, and whether we may say anything
   * about it yet.
   *
   * `changelog.isLoading` IS NOT ENOUGH ON ITS OWN. Every read on this surface
   * is `enabled: !!wid`, and a disabled query is pending without fetching, so
   * `isLoading` is false before a workspace is known. Reading it alone would
   * draw "nothing has shipped yet" during the first paint of every session --
   * a confident, false sentence about an empty list nobody has looked in.
   *
   * A picked id that has since left the list falls back to the newest rather
   * than to nothing, because a release document that vanishes on a background
   * refetch is worse than one that moves.
   */
  const docReading = !wid || changelog.isLoading;
  const docEntry: ChangelogEntry | null =
    (docId ? (notes.find((e) => e.id === docId) ?? null) : null) ?? notes[0] ?? null;

  const headline = posts.isError
    ? "The announcements did not load."
    : loading
      ? "Ship"
      : waitingCount === 0
        ? // Said ONCE. The gate below used to repeat this exact sentence as its
          // question, so the screen printed it twice; the gate now asks what to do.
          "Nothing is waiting to go out."
        : waitingCount === 1
          ? "One announcement is waiting to go out."
          : `${waitingCount} announcements are waiting to go out.`;

  /** The gap, stated once, under the headline. Never a number we do not have. */
  function gapLine(): React.ReactNode {
    if (loading || posts.isError || !changelog.isSuccess) return undefined;
    const word = untold === 1 ? "release" : "releases";
    if (untold > 0) {
      return lastPublished ? (
        <>
          <Num>{untold}</Num> {word} since the last one went out.
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
   * A release note becomes the announcement, and the CREW writes the customer
   * half of it.
   *
   * WHAT THIS SURFACE USED TO ASK OF A PERSON. Ship was the one station with no
   * agent anywhere on it: this function copied a release note's title and body
   * into the composer verbatim, which is a clipboard rather than a draft, and
   * then a human wrote "what it means for your customers" from a blank box.
   * Meanwhile `generateLaunchKit` has existed the whole time, turns a shipped
   * changeset into exactly that copy, and was reachable only from the Build
   * panel. The capability was one surface away from the work it was written for.
   *
   * A release note and a customer announcement are DIFFERENT DOCUMENTS, which is
   * the whole reason copying one into the other read as unfinished. The note
   * says what changed, in the repository's voice. The announcement says what it
   * means for someone who does not read pull requests. So the title carries over
   * (it is the same subject) and the body is drafted.
   *
   * FALLS BACK TO TODAY'S BEHAVIOUR, ALWAYS. An entry with no changeset behind
   * it, a refused call, a model that is down: each lands the note's own body in
   * the box, which is exactly what this function did before. The person is never
   * left worse off than they were, and never left with an empty composer.
   */
  function startFrom(e: ChangelogEntry) {
    setDraftTitle(e.title.slice(0, 200));
    setDraftBody(e.body ?? "");
    setMode({ kind: "new" });

    if (!e.changeset_id) return;
    setDrafting(true);
    void fLaunchKit({ data: { changesetId: e.changeset_id } })
      .then((kit) => {
        // `email` is the customer-facing register of the kit. `changelog` is the
        // note we already have, and blog/social are other surfaces' shapes.
        const written = kit?.email?.trim();
        if (written) setDraftBody(written.slice(0, 20000));
      })
      .catch(() => {
        // The note stays in the box. A failed draft must not cost the person
        // the text they already had.
      })
      .finally(() => setDrafting(false));
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

  return (
    <Surface
      context={
        call ? (
          <>
            <CtxHead>Where it goes</CtxHead>
            <CtxBody>
              Once it is live, anyone can read it at <Num>/p/{call.slug}</Num>. Owners and admins
              publish.
            </CtxBody>
          </>
        ) : ready.length > 0 ? (
          // The column follows whatever the reader's business actually is. With
          // no announcement in focus but a change waiting on production, the
          // question they are holding is what the promote costs, so that is
          // what the margin answers instead of standing empty.
          <>
            <CtxHead>What promote does</CtxHead>
            <CtxBody>
              It serves the commit already running on the preview from the production address. Same
              build, new audience. Taking it back means a revert pull request, which is why this is
              the one call on this station that reaches customers.
            </CtxBody>
          </>
        ) : null
      }
    >
      {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
          genuinely mid-run, so it costs no space when the crew is idle and
          cannot show a step that did not happen. Every other pulse on this
          station is gated on a mutation the reader's own click started;
          this one is bound to the run. See use-live-agents.ts. */}
      <CrewWorking />
      <PageHead title={headline} sub={gapLine()} />

      {/* PRODUCTION COMES BEFORE THE ANNOUNCEMENT, and the order is the
          argument. This station is called Ship and the nav calls it "Preview to
          production"; putting a change in front of customers is the act it is
          named for, and saying something about that change is what you do
          afterwards. The announcement gate below is untouched, and both are
          drawn at once when both are genuinely waiting, because they are two
          different decisions and hiding either would be the surface deciding
          for the reader which one their morning is about. */}
      {ready.length > 0 ? (
        <Gate
          question={`Take "${ready[0].title}" to production?`}
          lines={[
            <span key="preview">
              The preview is up at{" "}
              <a
                href={ready[0].previewUrl as string}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit" }}
              >
                <Num>{ready[0].previewUrl}</Num>
              </a>
            </span>,
            ...(since(ready[0].releasedAt)
              ? [
                  <span key="when">
                    Merged <Num>{since(ready[0].releasedAt)}</Num>
                    {ready[0].productName ? ` into ${ready[0].productName}` : ""}
                  </span>,
                ]
              : []),
            <span key="cost">
              It moves that same commit to the production address. Customers see it immediately, and
              undoing it means a revert pull request.
            </span>,
            ...(ready.length > 1
              ? [
                  <span key="more">
                    <Num>{ready.length - 1}</Num> more {ready.length - 1 === 1 ? "is" : "are"}{" "}
                    ready, each with its own promote under Where it is live.
                  </span>,
                ]
              : []),
          ]}
        >
          <Button
            variant="primary"
            disabled={promote.isPending}
            onClick={() =>
              promote.mutate({ changesetId: ready[0].changesetId, title: ready[0].title })
            }
          >
            {promote.isPending ? "Promoting it" : "Promote it"}
          </Button>
        </Gate>
      ) : null}

      {composing ? (
        <Block title={mode.kind === "new" ? "A new announcement" : "Editing the announcement"}>
          <Field label="What changed">
            <Input
              value={draftTitle}
              maxLength={200}
              autoFocus
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </Field>
          <Field label="What it means for your customers">
            {/*
             * THE CREW WORKING, WHERE THE WORK IS.
             *
             * surface-discipline §7: `working` belongs only to a genuinely
             * dispatched agent, never to a plain read. This one is genuine.
             * `generateLaunchKit` is a real model pass over the changeset, and
             * it is the only agent on this station, so it is the one place here
             * that has earned the pulse.
             *
             * The box stays EDITABLE while the crew writes. A person who already
             * knows what they want to say must not be locked out waiting for a
             * draft they did not ask for, and if they type, what they typed
             * wins: the draft only lands if the field is theirs to fill.
             */}
            {drafting ? (
              <div style={{ marginBottom: "var(--sp-space-2)" }}>
                <AgentPulse
                  label="The crew is writing what this means for your customers"
                  seed="ship-launch-kit"
                  detail="Reading the change, then saying what it means"
                />
              </div>
            ) : null}
            <Textarea
              value={draftBody}
              maxLength={20000}
              rows={6}
              onChange={(e) => setDraftBody(e.target.value)}
            />
          </Field>
          <Actions>
            <Button
              variant="primary"
              disabled={!draftTitle.trim() || busy}
              onClick={() =>
                mode.kind === "edit" ? update.mutate({ id: mode.id }) : create.mutate()
              }
            >
              {mode.kind === "edit" ? "Save the post" : "Save the draft"}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setMode({ kind: "idle" })}>
              Cancel
            </Button>
          </Actions>
        </Block>
      ) : posts.isError ? (
        <Actions>
          <Button variant="primary" onClick={() => void posts.refetch()}>
            Try again
          </Button>
        </Actions>
      ) : posts.isLoading ? (
        <Loading>Reading what is ready to announce.</Loading>
      ) : call ? (
        <Gate
          question={
            call.status === "pending"
              ? canPublish
                ? `Send "${call.title}" to customers?`
                : `"${call.title}" is waiting on an owner or an admin.`
              : `"${call.title}" is still a draft.`
          }
          lines={gateLines(call)}
        >
          {call.status === "pending" && canPublish ? (
            <Button variant="primary" disabled={busy} onClick={() => publish.mutate(call.id)}>
              Publish it
            </Button>
          ) : null}
          {call.status === "draft" && canContribute ? (
            <Button variant="primary" disabled={busy} onClick={() => submit.mutate(call.id)}>
              Send for approval
            </Button>
          ) : null}
          {canContribute ? (
            <Button disabled={busy} onClick={() => startEdit(call)}>
              Edit the post
            </Button>
          ) : null}
          {canContribute ? (
            <Button variant="ghost" disabled={busy} onClick={startNew}>
              Write another
            </Button>
          ) : null}
        </Gate>
      ) : (
        <Gate question="Write the first announcement?">
          {canContribute ? (
            <Button variant="primary" disabled={busy} onClick={startNew}>
              Write an announcement
            </Button>
          ) : null}
        </Gate>
      )}

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
                <a
                  href={`/p/${receipt.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--sp-ink)" }}
                >
                  <Num>/p/{receipt.slug}</Num>
                </a>
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
      <Block
        title="Where it is live"
        sub={absenceSentence(absence)}
        more={
          states.length > VISIBLE
            ? allAddresses
              ? "Show fewer"
              : `All ${states.length}`
            : undefined
        }
        onMore={() => setAllAddresses((v) => !v)}
      >
        {releaseFailed ? (
          <Failed onRetry={retryRelease}>
            Where each release is serving did not load, so this list would be a guess.{" "}
            {((changelog.error ?? deployments.error) as Error | null)?.message?.slice(0, 160)}
          </Failed>
        ) : releaseReading ? (
          <Loading>Reading where each release is serving.</Loading>
        ) : states.length === 0 ? (
          <Empty>
            No deploy is on the record yet. A merged change deploys a preview on its own, and one
            promote moves that same commit to the production address.
          </Empty>
        ) : (
          (allAddresses ? states : states.slice(0, VISIBLE)).map((s) => {
            const at = whereItIs(s);
            const promotable = isReadyToPromote(s);
            const promotingThis =
              promote.isPending && promote.variables?.changesetId === s.changesetId;
            return (
              <Row
                key={s.changesetId}
                tight
                lead={at.address ? <Num>{at.address}</Num> : s.title}
                sub={at.address ? `${at.state} · ${s.title}` : at.state}
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
                    <button
                      type="button"
                      className={QUIET}
                      disabled={promote.isPending}
                      onClick={() => promote.mutate({ changesetId: s.changesetId, title: s.title })}
                    >
                      {promotingThis ? "Promoting it" : "Promote it"}
                    </button>
                  ) : null
                }
              />
            );
          })
        )}
      </Block>

      {/* THE RELEASES THAT REACHED CUSTOMERS, each carrying the one act that
          takes it back. Rollback lived only inside the Changes tab of the run
          that produced the release, so undoing a bad ship meant first
          remembering which run it came from. Here it is a row on the station. */}
      <Block
        title="Live releases"
        more={
          live.length > VISIBLE ? (allReleases ? "Show fewer" : `All ${live.length}`) : undefined
        }
        onMore={() => setAllReleases((v) => !v)}
      >
        {releaseFailed ? (
          <Failed onRetry={retryRelease}>What is in production did not load.</Failed>
        ) : releaseReading ? (
          <Loading>Reading what is in production.</Loading>
        ) : live.length === 0 ? (
          <Empty>
            Nothing is in production yet.{" "}
            {ready.length > 0
              ? `${ready.length === 1 ? "One change has" : `${ready.length} changes have`} a preview waiting for the promote above.`
              : "A release appears here the moment it is promoted, and each one keeps a way back."}
          </Empty>
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
                    s.productionAt && since(s.productionAt)
                      ? `live since ${since(s.productionAt)}`
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
                    <button
                      type="button"
                      className={QUIET}
                      disabled={rollback.isPending}
                      onClick={() => void askRollback(s)}
                    >
                      {reverting ? "Starting the revert" : "Roll back"}
                    </button>
                  </>
                }
              />
            );
          })
        )}
      </Block>

      <Block
        title="What shipped"
        sub={
          canContribute && notes.length > 0 ? "Pick one to write the announcement from it." : null
        }
        more={
          notes.length > VISIBLE ? (allNotes ? "Show fewer" : `All ${notes.length}`) : undefined
        }
        onMore={() => setAllNotes((v) => !v)}
      >
        {changelog.isLoading ? (
          <Loading>Reading the release notes.</Loading>
        ) : changelog.isError ? (
          <Failed onRetry={() => void changelog.refetch()}>The release notes did not load.</Failed>
        ) : notes.length === 0 ? (
          <Empty>
            Nothing has shipped yet. A release note is written from a merged change, so the first
            merge fills this in without anyone typing.
          </Empty>
        ) : (
          (allNotes ? notes : notes.slice(0, VISIBLE)).map((e) => {
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
            const meta = [
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
                {inFocus ? null : (
                  <button type="button" className={QUIET} onClick={() => setDocId(e.id)}>
                    Its document
                  </button>
                )}
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
                  canContribute
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
      </Block>

      {/* THE RELEASE DOCUMENT. `WhatShipped` renders its own top-level Blocks --
          the release, why it was built, what it promised, who signed it off, the
          receipts, and what is not on the record -- so it is mounted as a
          SIBLING of this one rather than inside it.

          This Block is the lead-in, and its children are the one thing the
          document itself cannot say: where its sentences come from. That is not
          decoration. The document's entire worth is that a reader can trace
          every line to a row, and a reader who does not know that reads it as
          generated prose and discounts all of it. */}
      <Block title="The release document">
        {docReading ? (
          <Loading>Reading what has shipped.</Loading>
        ) : changelog.isError ? (
          <Failed onRetry={() => void changelog.refetch()}>
            The releases did not load, so there is no document to assemble.
          </Failed>
        ) : !docEntry ? (
          <NoReleaseYet />
        ) : (
          <Prose markdown>
            <p>
              Everything below is read from rows this release already has: the bet it came from, the
              spec and its outcome contract, the design gate, the changeset and its pull request,
              the production deploy, and the outcome once Learn settles it. No sentence here was
              written for this document, and whatever is missing is named rather than left out.
              {notes.length > 1
                ? " It covers the release marked above; pick another to read that one instead."
                : null}
            </p>
          </Prose>
        )}
      </Block>
      {!docReading && !changelog.isError && docEntry ? (
        <WhatShipped entry={docEntry} workspaceId={wid || null} />
      ) : null}

      {posts.isError ? null : announcements.length === 0 ? (
        <Block title="Announcements">
          <Empty>
            Nothing has gone out yet.{" "}
            {canContribute
              ? "Write one and it waits here until an owner publishes it."
              : "An owner or an admin writes the first one."}
          </Empty>
        </Block>
      ) : rest.length > 0 ? (
        <Block
          title="Announcements"
          more={
            rest.length > VISIBLE ? (allPosts ? "Show fewer" : `All ${rest.length}`) : undefined
          }
          onMore={() => setAllPosts((v) => !v)}
        >
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
        </Block>
      ) : null}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/ship")({
  component: Ship,
  head: () => ({ meta: [{ title: "Ship · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Ship] route crashed:", error);
    return (
      <Surface>
        <PageHead title="Ship did not load." />
        <Empty>Reload the page. Nothing here is lost.</Empty>
      </Surface>
    );
  },
});
