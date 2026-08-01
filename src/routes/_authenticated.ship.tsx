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
 */

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  Field,
  Gate,
  Input,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  Textarea,
} from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

/** Anti-scroll: each list opens short and expands on demand. */
const VISIBLE = 6;

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose: nothing here reaches into another
 * surface's folder, so a parallel port cannot break this one.
 * ------------------------------------------------------------------ */

/** Plain-words relative time. Mono is applied by the row, not here. */
type ShipReceipt = {
  verb: string;
  consequence: string;
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

type Mode = { kind: "idle" } | { kind: "new" } | { kind: "edit"; id: string };

function Ship() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("ship");
  const qc = useQueryClient();
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const wid = activeWorkspaceId ?? "";

  const fChangelog = useServerFn(listChangelog);
  const fList = useServerFn(listAnnouncements);
  const fMembers = useServerFn(listWorkspaceMembers);
  const fCreate = useServerFn(createAnnouncement);
  const fUpdate = useServerFn(updateAnnouncement);
  const fSubmit = useServerFn(submitForApproval);
  const fPublish = useServerFn(approveAndPublish);

  const changelog = useQuery({
    queryKey: ["changelog", activeWorkspace?.id],
    queryFn: () => fChangelog({ data: { workspaceId: activeWorkspace?.id } }),
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

  const notes = changelog.data?.entries ?? [];
  const announcements = posts.data?.announcements ?? [];

  const role = (members.data?.selfRole ?? null) as WorkspaceRole | null;
  const canContribute = !!role && TRANSITION_ROLES["draft->pending"].includes(role);
  const canPublish = !!role && TRANSITION_ROLES["pending->published"].includes(role);

  const [mode, setMode] = React.useState<Mode>({ kind: "idle" });
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  const [picked, setPicked] = React.useState<string | null>(null);
  const [allNotes, setAllNotes] = React.useState(false);
  const [allPosts, setAllPosts] = React.useState(false);

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

  const headline = posts.isError
    ? "The announcements did not load."
    : loading
      ? "Reading what has gone out."
      : waitingCount === 0
        ? "Nothing is waiting to go out."
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

  /** A release note becomes the announcement. The composer opens already
   *  carrying it, so the person edits rather than retypes. */
  function startFrom(e: ChangelogEntry) {
    setDraftTitle(e.title.slice(0, 200));
    setDraftBody(e.body ?? "");
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
        ) : null
      }
    >
      <PageHead title={headline} sub={gapLine()} />

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
      ) : posts.isLoading ? null : call ? (
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
        <Gate question="Nothing is waiting to go out.">
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
        {changelog.isLoading ? null : changelog.isError ? (
          <Failed onRetry={() => void changelog.refetch()}>The release notes did not load.</Failed>
        ) : notes.length === 0 ? (
          <Empty>
            Nothing has shipped yet. A release note is written from a merged change, so the first
            merge fills this in without anyone typing.
          </Empty>
        ) : (
          (allNotes ? notes : notes.slice(0, VISIBLE)).map((e) => {
            // A second line is a DIFFERENT fact, never the first one continued:
            // which product, and which pull request. The body belongs to the
            // one post in focus, not to every row.
            const meta = [e.product_name ?? null, e.pr_number ? `PR #${e.pr_number}` : null]
              .filter((x): x is string => !!x)
              .join(" · ");
            return (
              <Row
                key={e.id}
                tight
                lead={e.title}
                sub={meta || null}
                time={ago(e.released_at)}
                onClick={
                  canContribute
                    ? () => startFrom(e)
                    : e.pr_url
                      ? () => window.open(e.pr_url as string, "_blank", "noopener,noreferrer")
                      : undefined
                }
              />
            );
          })
        )}
      </Block>

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
