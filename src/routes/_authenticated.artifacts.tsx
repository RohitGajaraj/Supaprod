/**
 * Artifacts. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the six answers.
 *
 * 1. WHO IS HERE, AND WHY. A product lead who remembers the crew made
 *    something, a spec or a prototype, and needs to get back to it. They are
 *    not browsing. They have a thing in mind, they half remember its name, and
 *    they want it open in front of them in two clicks.
 *
 * 2. THE ONE THING IT EXISTS FOR. To find the thing the crew made and open it,
 *    knowing WHO made it and WHAT IT CAME FROM. The finding alone is a file
 *    list; the provenance is the reason this is a surface in this product and
 *    not a folder. Everything else here serves that or is a candidate for
 *    removal.
 *
 * 3. KEEP / MOVE / KILL, on what was on the page before:
 *    KEEP  the list, newest first, and the product filter. The filter is the
 *          one control that turns a workspace-wide shelf into the shelf you
 *          are actually looking at, so the scoping decision is made here.
 *    KEEP  the relative timestamps. On a shelf of near-identical names, "2h
 *          ago" is how a person tells two drafts apart.
 *    KEEP  rename, but only on the item in focus. Real reason, not inertia:
 *          the crew names these things itself, and a bad auto-generated name
 *          is the single reason you fail to find one later. The moment you
 *          fail to recognise it IS the moment you fix it, so the decision is
 *          genuinely made here.
 *    KEEP  delete, on the item in focus. This is the only surface that sees
 *          all three families at once, so it is the only place you can tidy
 *          up. Deleting from inside an artifact is a different job.
 *    KILL  RoomChromeShell. It was the second app shell on this route and one
 *          of the last three keeping a duplicate shell alive. See THE SHELL
 *          DEPENDENCY below: this removal is only half the change.
 *    KILL  the hand-rolled layout (max-w-2xl, inline colours, per-row bordered
 *          cards, the nested bordered history panel, the dashed empty box).
 *          Cards inside cards is hard ban 5, and every value was ad hoc.
 *    KILL  the three hover-revealed buttons on EVERY row. Twenty rows carried
 *          sixty affordances, all opacity-0 until hover, so they were
 *          invisible to a first-time user and unreachable on a touch screen.
 *          Actions belong to the one item in focus.
 *    KILL  the bordered mono kind chip on every row. It is one word and it now
 *          rides the group heading instead, where it is said once.
 *    KILL  "Snapshot now". It asked the human to do the machine's filing, on a
 *          surface whose whole argument is that the machine does the work. It
 *          was also a write that fails outright before the versions migration,
 *          and a control that cannot act teaches people the controls are
 *          decorative.
 *    KILL  every toast. Renamed. / Deleted. / Restored. / Snapshot saved. and
 *          their error twins. See THE COMMIT below.
 *    KILL  the "N in this workspace, newest first" line. The tab counts carry
 *          the number and the head carries the ordering; this said both again
 *          in different words (hard ban 10).
 *    KILL  the rename modal. A one-field edit in a dialog is modal abuse (hard
 *          ban 11); it is now an inline field on the item in focus. The
 *          confirm dialog SURVIVES for delete, which is the one irreversible
 *          action here and the one case a modal is still right for.
 *    MOVE  version history and Restore, to each artifact's own surface: /plan
 *          for a spec, /docs for a doc, /p/$slug for a prototype. Not a tidying
 *          preference: restoring a version while looking at a name-only row is
 *          restoring blind, because you cannot see the body you are reverting
 *          to. The decision cannot be made here, so by the rule it is a move.
 *
 * 4. ONE CLICK AWAY. A row is one line, its name, plus a second line carrying
 *    DIFFERENT information, the product it belongs to. Its maker, its source,
 *    and what it led to appear when it becomes the item in focus, which is one
 *    click. Each family is capped at six rows with an explicit "show all", so
 *    the surface has a bottom on day one and on day four hundred. Above twelve
 *    artifacts a find field appears, because past one screen a filter is the
 *    only thing that actually answers "too much scrolling".
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is opening a spec you half
 *    remember and reading "Writer made this. From: the churn cluster from
 *    October." You did not know the shelf remembered that. The confusion to
 *    avoid is a name-only list that looks like Google Drive; the answer is
 *    that provenance is never absent, it is either shown or honestly refused.
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove every agent from this
 *    product and this surface loses its whole top half: the byline on the item
 *    in focus, the source it was made from, the work it led to, and the line
 *    saying the crew is making another one right now. It is not a file list.
 *
 *    ATTRIBUTION, AND THE ONE PLACE IT IS HONESTLY REFUSED. This is doctrine
 *    correction C9, live: `prds`, `prototypes` and `docs` carry NO author
 *    column, so listArtifacts cannot say who made a row and no batch read in
 *    the repo can (getLineage and getProvenance are both per item; the bulk
 *    lineage reads in brain-insights and knowledge-graph-view do not select
 *    created_by_agent and do not know the prototype kind). So the maker is
 *    read per item from the lineage EDGE, which does carry created_by_agent,
 *    and the rows do not pretend. Where no edge names an agent the surface
 *    prints the deliberately ugly `unattributed` rather than guessing, because
 *    one invented byline makes every real byline on the surface worthless
 *    (R12). Build item B1 is what turns the rows honest; the gap is reported.
 *
 *    WORK IN MOTION. getLiveActivity is read for state only, never for its
 *    action string, which is assembled from tool names and would leak
 *    mechanism words onto a user-facing surface. So the surface can say the
 *    crew is making something right now without narrating machinery.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, §9). Renaming used to fire
 * toast.success("Renamed.") and deleting fired toast.success("Deleted."). A
 * toast confirms that your click REGISTERED; a receipt renders what your click
 * CAUSED. Both now leave a receipt that stays on the surface, and a failed
 * write still writes one and goes honest immediately, never a success shape
 * over a failed write. NO handoff arrow is drawn on either: nothing in the
 * repo picks up a rename or a delete, so the receipt says what changed
 * instead. An arrow to nowhere is worse than no arrow.
 *
 * THE SHELL DEPENDENCY, and it must land in the same commit as this file.
 * `_authenticated.tsx` still lists `/artifacts` in `isReimaginedSurface`
 * (pathname === "/artifacts" || pathname.startsWith("/artifacts/")), which
 * makes AppFrame stand down on the assumption this route draws its own chrome.
 * It no longer does. Those two clauses have to come off that list, exactly as
 * they already did for /approvals, /brain and /settings, or this page ships
 * with no header, no doors back and no way to sign out. That file is outside
 * this change's scope, so it is reported rather than edited.
 */

import { createFileRoute } from "@tanstack/react-router";
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
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Input,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  Who,
} from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/artifacts")({
  component: ArtifactsRoute,
  head: () => ({ meta: [{ title: "Artifacts · Supaprod" }] }),
});

/** Said once, on the group heading, instead of on a chip on every row. */
const KIND_ONE: Record<ArtifactKind, string> = {
  spec: "Spec",
  prototype: "Prototype",
  doc: "Doc",
};
const KIND_MANY: Record<ArtifactKind, string> = {
  spec: "Specs",
  prototype: "Prototypes",
  doc: "Docs",
};
/** Spec first: it is the artifact a product lead comes back to most. */
const KIND_ORDER: ArtifactKind[] = ["spec", "prototype", "doc"];

/** The lineage graph knows two of the three families. `doc` is not one of
 *  ARTIFACT_KINDS, so a doc has no provenance to read and the surface says so
 *  rather than rendering an empty provenance block that looks like a bug. */
const LINEAGE_KIND: Record<ArtifactKind, "prd" | "prototype" | null> = {
  spec: "prd",
  prototype: "prototype",
  doc: null,
};

/** One screen of rows across three groups. Past this the surface only grows,
 *  which the founder named twice as the failure. */
const GROUP_CAP = 6;
const FIND_FROM = 12;

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

type Settled = {
  id: string;
  verb: string;
  consequence: string;
  at: string;
  failed?: boolean;
};

function ArtifactsRoute() {
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

  const [productFilter, setProductFilter] = useState<string | null>(null);
  const [find, setFind] = useState("");
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<ArtifactKind | null>(null);
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
        (!productFilter || a.productId === productFilter) &&
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
  const headline = q.isLoading
    ? "Reading the shelf."
    : q.isError
      ? "The shelf did not load."
      : n === 0
        ? "Nothing made yet."
        : n === 1
          ? "One thing your crew has made."
          : `${n} things your crew has made.`;

  const liveLine =
    live.data?.state === "working"
      ? "Your crew is making something right now. It lands here when it is done."
      : live.data?.state === "waiting"
        ? "Nothing is being made. A call is waiting on you."
        : live.data?.state === "idle"
          ? "Nobody is making anything right now."
          : null;

  return (
    <Surface
      context={
        focused ? (
          <>
            <div className="sp-ctx-head">What came out of it</div>
            {lineage.isLoading ? (
              <div className="sp-ctx-body">Reading the record.</div>
            ) : descendants.length === 0 ? (
              <div className="sp-ctx-body">Nothing has been made from this one yet.</div>
            ) : (
              descendants.slice(0, 5).map((e) => (
                <div className="sp-ctx-row" key={e.id}>
                  <span>
                    <span className="sp-ctx-name">{e.peer_title || "Untitled"}</span>
                    <span className="sp-ctx-sub">
                      {e.created_by_agent
                        ? `${agentDisplayName(e.created_by_agent)} made it`
                        : "no recorded maker"}
                    </span>
                  </span>
                </div>
              ))
            )}
            {liveLine ? (
              <>
                <div className="sp-ctx-head">Right now</div>
                <div className="sp-ctx-body">{liveLine}</div>
              </>
            ) : null}
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={n > 0 ? "Newest first. Open one to see who made it and what it came from." : undefined}
      />

      {q.isError ? (
        <Failed onRetry={() => void q.refetch()}>Could not read your artifacts.</Failed>
      ) : null}

      {!q.isLoading && !q.isError && n === 0 ? (
        <Empty>
          Your crew has not made anything yet. Specs, prototypes and docs land here as they are
          written.
        </Empty>
      ) : null}

      {products.length > 0 ? (
        <div className="sp-tabs" role="tablist" aria-label="Filter by product">
          <button
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={productFilter === null}
            onClick={() => setProductFilter(null)}
          >
            All
            <span className="sp-tab-count">{artifacts.length}</span>
          </button>
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={productFilter === p.id}
              onClick={() => setProductFilter(p.id)}
            >
              {p.name}
              <span className="sp-tab-count">{p.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {n > FIND_FROM ? (
        <Field label="Find by name" htmlFor="artifact-find">
          <Input id="artifact-find" value={find} onChange={(e) => setFind(e.target.value)} />
        </Field>
      ) : null}

      {focused ? (
        <Block
          title={focused.name}
          sub={`${KIND_ONE[focused.kind]} · changed ${relTime(focused.updatedAt)}${
            focused.productId ? ` · ${productName.get(focused.productId) ?? "Unassigned"}` : ""
          }`}
        >
          {/* THE BYLINE. Every artifact says who made it and what it came from,
              or honestly refuses. Never a guess. */}
          <Row
            marks={makerSlug ? <AgentMark slug={makerSlug} state="quiet" /> : undefined}
            lead={
              lineage.isLoading ? (
                "Reading who made it."
              ) : makerSlug ? (
                <>
                  <Who>{agentDisplayName(makerSlug)}</Who> made this.
                </>
              ) : (
                <Num>unattributed</Num>
              )
            }
            sub={
              lineage.isLoading
                ? undefined
                : !lineageKind
                  ? "Docs do not record a maker yet."
                  : makerSlug
                    ? cameFrom
                      ? `From ${cameFrom}`
                      : "No recorded source."
                    : "Nothing recorded who made this one."
            }
          />

          {draft !== null ? (
            <>
              <Field label="New name" htmlFor="artifact-name">
                <Input
                  id="artifact-name"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setDraft(null);
                    if (e.key === "Enter" && draft.trim() && !busy) {
                      rename.mutate({ a: focused, name: draft.trim() });
                    }
                  }}
                />
              </Field>
              <Actions>
                <Button
                  variant="primary"
                  disabled={!draft.trim() || draft.trim() === focused.name || busy}
                  onClick={() => rename.mutate({ a: focused, name: draft.trim() })}
                >
                  Save the name
                </Button>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </Actions>
            </>
          ) : (
            <Actions>
              <Button variant="primary" onClick={() => window.location.assign(focused.href)}>
                Open
              </Button>
              <Button disabled={busy} onClick={() => setDraft(focused.name)}>
                Rename
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => void onDelete(focused)}>
                Delete
              </Button>
            </Actions>
          )}
        </Block>
      ) : null}

      {settled.length > 0 ? (
        <Block title="What you changed">
          {settled.map((r, i) => (
            <Receipt
              key={`${r.id}-${i}`}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      {KIND_ORDER.map((kind) => {
        const items = rest.filter((a) => a.kind === kind);
        if (items.length === 0) return null;
        const open = openGroup === kind;
        const visible = open ? items : items.slice(0, GROUP_CAP);
        return (
          <Block
            key={kind}
            title={KIND_MANY[kind]}
            more={
              items.length > GROUP_CAP
                ? open
                  ? "Show fewer"
                  : `Show all ${items.length}`
                : undefined
            }
            onMore={() => setOpenGroup(open ? null : kind)}
          >
            {visible.map((a) => (
              <Row
                key={keyOf(a)}
                tight
                lead={a.name}
                // A DIFFERENT fact, not more of the first. The maker belongs to
                // the one item in focus, which is one click away.
                sub={a.productId ? (productName.get(a.productId) ?? "Unassigned") : "Unassigned"}
                time={relTime(a.updatedAt)}
                onClick={() => {
                  setDraft(null);
                  setFocusedKey(keyOf(a));
                }}
              />
            ))}
          </Block>
        );
      })}

      {n > 0 && shown.length === 0 ? (
        <Empty>Nothing here matches. Clear the filter to see all {n}.</Empty>
      ) : null}
    </Surface>
  );
}
