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
 *    MOVE  the product filter, from a second `sp-tabs` row to `Choices`. Two
 *          identical tab rows stacked, Brain's doors and then a product
 *          filter, is two things competing to be the navigation and neither
 *          winning. A radio group reads as a control, which is what it is.
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
 *    click. Each family is capped at six rows with an explicit "show all", so
 *    the view has a bottom on day one and on day four hundred. Above twelve
 *    artifacts a find field appears, because past one screen a filter is the
 *    only thing that actually answers "too much scrolling".
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
 * Renaming and deleting each leave a Receipt that stays in the region, and a
 * failed write still writes one and goes honest immediately. NO handoff arrow
 * is drawn on either: nothing in the repo picks up a rename or a delete, so
 * the receipt says what changed instead. An arrow to nowhere is worse than no
 * arrow.
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
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Choices,
  Empty,
  Failed,
  Field,
  Input,
  Loading,
  Num,
  Receipt,
  Row,
  Who,
} from "@/components/shell/primitives";

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

/** A count riding a filter label. Spaced and quietened the way every other
 *  count in the shell is (the retired tab row used 5px and 0.7): the name is
 *  the label, the number is the evidence, and a mono digit set flush against
 *  a sans word reads as one token rather than two facts. */
function Count({ n }: { n: number }) {
  return (
    <span style={{ marginLeft: 5, opacity: 0.72 }}>
      <Num>{n}</Num>
    </span>
  );
}

type Settled = {
  id: string;
  verb: string;
  consequence: string;
  at: string;
  failed?: boolean;
};

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
  const heading = q.isLoading
    ? "Reading what your crew has made."
    : q.isError
      ? "What your crew has made did not load."
      : n === 0
        ? "Nothing made yet."
        : n === 1
          ? "One thing your crew has made."
          : `${n} things your crew has made.`;

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

  return (
    <>
      <Block title={heading} sub={liveLine}>
        {q.isError ? (
          <Failed onRetry={() => void q.refetch()}>Could not read your artifacts.</Failed>
        ) : null}

        {q.isLoading ? <Loading>Reading the shelf.</Loading> : null}

        {!q.isLoading && !q.isError && n === 0 ? (
          <Empty>
            Your crew has not made anything yet. Specs, prototypes and docs land here as they are
            written.
          </Empty>
        ) : null}

        {products.length > 0 ? (
          <div>
            <Choices
              label="Which product"
              mode="one"
              value={productFilter}
              onPick={setProductFilter}
              options={[
                {
                  id: ALL,
                  label: (
                    <>
                      All
                      <Count n={n} />
                    </>
                  ),
                },
                ...products.map((p) => ({
                  id: p.id,
                  label: (
                    <>
                      {p.name}
                      <Count n={p.count} />
                    </>
                  ),
                })),
              ]}
            />
          </div>
        ) : null}

        {n > FIND_FROM ? (
          <Field label="Find by name" htmlFor="artifact-find">
            <Input id="artifact-find" value={find} onChange={(e) => setFind(e.target.value)} />
          </Field>
        ) : null}

        {n > 0 && shown.length === 0 ? (
          <Empty>
            Nothing here matches. Clear the filter to see all <Num>{n}</Num>.
          </Empty>
        ) : null}
      </Block>

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
            <Actions
              trailing={
                <Button variant="ghost" disabled={busy} onClick={() => void onDelete(focused)}>
                  Delete
                </Button>
              }
            >
              <Button variant="primary" onClick={() => window.location.assign(focused.href)}>
                Open
              </Button>
              <Button disabled={busy} onClick={() => setDraft(focused.name)}>
                Rename
              </Button>
            </Actions>
          )}
        </Block>
      ) : null}

      {/* Consequence, directly under cause. This was the context rail on the
          standalone surface; Brain's Surface has no aside, and the record
          reads better as one column anyway. */}
      {focused ? (
        <Block title="What came out of it">
          {!lineageKind ? (
            <Empty>Docs are not on the lineage graph yet, so nothing can be traced from one.</Empty>
          ) : lineage.isLoading ? (
            <Loading>Reading the record.</Loading>
          ) : lineage.isError ? (
            <Failed onRetry={() => void lineage.refetch()}>
              Could not read what came out of this one.
            </Failed>
          ) : descendants.length === 0 ? (
            <Empty>Nothing has been made from this one yet.</Empty>
          ) : (
            descendants
              .slice(0, 5)
              .map((e) => (
                <Row
                  key={e.id}
                  tight
                  marks={
                    e.created_by_agent ? (
                      <AgentMark slug={e.created_by_agent} state="quiet" />
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
    </>
  );
}
