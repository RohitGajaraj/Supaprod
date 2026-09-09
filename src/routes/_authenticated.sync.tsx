/**
 * SOURCES (/sync). Rebuilt around what the person came to learn, 2026-09-08.
 *
 * ── WHAT WAS WRONG ───────────────────────────────────────────────────────
 * A teammate walked this page live as someone arriving from the rail with ONE
 * connected source, a GitHub repository. They met eleven lines each saying
 * "<X> is not connected, so there is nothing to point yet. Connect it", then a
 * region headed "Just for Prism" with eleven more saying "<X> has no connected
 * account, so there is nothing to override with". Twenty-two negations for one
 * fact. Every region iterated the registry and asked each provider to explain
 * its own absence, and the one connected thing was buried in the middle of
 * them. That is a data dump; the founder's brief is to turn data into meaning.
 *
 * ── WHAT THE PERSON IS TRYING TO LEARN, IN ORDER ─────────────────────────
 *   1. Is anything waiting on me?         the conflict Choice, first, as before.
 *   2. What is connected, and what is     "Connected": one row per connected
 *      it pointed at, and is it current?  source, with its controls.
 *   3. What could I add?                  "Connect a source": one press per
 *                                         provider that is not connected,
 *                                         saying what it brings, never what it
 *                                         is not.
 *   4. Does this product differ?          "Just for <product>": drawn only when
 *                                         there is something connected to
 *                                         override, and naming only that.
 *   5. How do I send anything else in?    the ingest endpoint, at the foot.
 *
 * The partition itself is pure and tested: `components/connections/sources-
 * model.ts`. `WorkspaceBindingsSection` and `ProductBindingsSection` are no
 * longer mounted here; every server function, query key, mutation, confirm
 * sentence and the repo-creation flow they carried is kept below unchanged.
 *
 * ONE READING LINE AND ONE FAILURE LINE for the whole page. The reads land
 * together, so a person waits once and is told once; three regions each
 * saying "reading" is three claims about one wait.
 *
 * ── THE ORIGINAL SIX QUESTIONS (2026-07-29) STILL HOLD ───────────────────
 * 1. WHO IS STANDING HERE: someone who just read "not reading" or "nothing
 *    bound yet" on a source, here to point it at the right repo, team, channel
 *    or database; or, less often and more urgently, someone whose doc was
 *    edited on both sides and who has to say which copy wins.
 * 2. THE ONE THING THIS SURFACE MAKES POSSIBLE: choosing what a connected
 *    source actually acts on. Settings answers "is Linear connected"; this
 *    answers "connected to WHICH team".
 * 3. KEEP / MOVE / KILL: bindings, the per-product override, conflicts, the
 *    synced evidence and the inbound webhook are kept. No bento cards, no
 *    skeletons, no ember border on the followed conflict (order is the
 *    emphasis), no armed two-step destructive buttons.
 * 4. ONE CLICK AWAY: the document itself (a synced row opens it where it
 *    lives), the source's own page and accounts (a connected row opens it in
 *    Settings), and the curl example.
 * 5. DELIGHT, AND CONFUSION: every connected line names what it is pointed at,
 *    who pointed it, and whether it is still reading. Not drawn: Pull and Push
 *    on a provider that only reads, a primary button on either side of a
 *    conflict, a zero that means "the read failed".
 * 6. THE CREW: a binding is the crew's reach. No agent mark is drawn here
 *    because no agent acts here; the honest answer to "where is the crew" is
 *    "downstream of every line on this screen".
 */
import { useEffect, useState } from "react";
import { Line, Row } from "@/components/meridian/rows";
import {
  ACTION_LINK_FACE,
  Action,
  Actions,
  Cell,
  Grid,
  NothingYet,
  Num,
  PageHeading,
  Picker,
  Pre,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Choice } from "@/components/meridian/Choice";
import { Surface } from "@/components/meridian/Surface";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { BindingPicker } from "@/components/connections/BindingPicker";
import { CreateRepoModal } from "@/components/connections/CreateRepoModal";
import {
  connectedSummary,
  sourceBrings,
  sourcesModel,
  type ConnectPress,
  type ConnectedSource,
} from "@/components/connections/sources-model";
import { ProviderMark, ProviderName, UnderMark } from "@/components/meridian/source-marks";
import { listSyncMappings, resolveSyncConflict } from "@/lib/integrations.functions";
import {
  addProductBinding,
  listConnections,
  listProductBindings,
  listWorkspaceBindings,
  removeBinding,
  type BindingRow,
  type ConnectionRow,
  type WorkspaceBindingRow,
} from "@/lib/connections.functions";
import { pullMapping, pushMapping } from "@/lib/sync.functions";
import { getIngestToken, rotateIngestToken, revokeIngestToken } from "@/lib/ingest.functions";
import {
  CONNECTOR_REGISTRY,
  NOT_SET_UP_HERE,
  type ProviderId,
  type ProviderSpec,
} from "@/lib/connectors/registry";
import { humanWriteError } from "@/lib/roles.functions";
import { failureLine, reasonLine } from "@/lib/error-copy";
import { useWorkspace } from "@/hooks/use-workspace";
import { latestIso, relTimeCaps } from "@/components/discover/format";

export type SyncSearch = { conflict?: string; product?: string };

/**
 * Pulled out so it is testable without mounting the route (this repo's
 * established substitute -- see `shouldClaimComposerFocus`,
 * `measuredQueryFn`; there is no working precedent here for mounting a full
 * TanStack Router route in a test).
 *
 * `product` is the second deep-link param (P-44, A-QUEUE.md), alongside the
 * existing `conflict`: `/sync?product=<id>` is where the "Finish it on Sync"
 * door from a connected-but-unbound need now lands, carrying the run's own
 * product so the per-product region opens already pointed at it.
 */
export function parseSyncSearch(search: Record<string, unknown>): SyncSearch {
  const out: SyncSearch = {};
  if (typeof search.conflict === "string" && search.conflict.length > 0) {
    out.conflict = search.conflict;
  }
  if (typeof search.product === "string" && search.product.length > 0) {
    out.product = search.product;
  }
  return out;
}

export const Route = createFileRoute("/_authenticated/sync")({
  component: SyncPage,
  // P-61 (A-QUEUE.md): the tab title is the rail's own word for this door
  // (PRIMARY_NAV's "Sources"), not the route's internal name.
  head: () => ({ meta: [{ title: "Sources · Supaprod" }] }),
  // Deep-link target for the honest doors to this surface: /sync?conflict=<id>
  // lands on the conflict and floats it to the top of the list.
  validateSearch: parseSyncSearch,
  errorComponent: ({ error, reset }) => (
    <Surface wide>
      {/* Meridian's `PageHeading` and `Actions` both set no outer margin, on
          purpose: the column decides how far apart its own parts sit and it
          decides once, here. `gap-mrd-7` is 40px, the step every ported surface
          in this product states for exactly this. */}
      <div className="flex flex-col gap-mrd-7">
        {/* `failureLine` AND NOT THE RAW MESSAGE. `(error as Error).message` put
            whatever was thrown -- an RLS refusal, a Postgres code, a truncated
            body -- under the page title, and fell back to a decent sentence only
            when there was nothing at all to say. `failureLine` inverts that:
            this surface's own honest sentence always, and the server's only when
            the server wrote one for a person. It is `failureLine` rather than
            `reasonLine` because nothing wraps this heading -- no `ReadFailed`
            below it will name an ended session, so this line has to. */}
        <PageHeading
          title="Sources did not open."
          sub={failureLine("Nothing connected has changed.", error)}
        />
        <Actions>
          <Action variant="primary" onClick={reset}>
            Try again
          </Action>
        </Actions>
      </div>
    </Surface>
  ),
});

type Mapping = {
  id: string;
  provider: string;
  local_kind: string;
  local_id: string;
  external_id: string;
  external_url: string | null;
  version_local: number;
  version_remote: number;
  last_pulled_at: string | null;
  last_pushed_at: string | null;
  conflict: boolean;
  updated_at: string;
};

/**
 * WHETHER TO SWITCH THE ACTIVE PRODUCT ON LANDING (P-44, A-QUEUE.md), pulled
 * out pure for the same reason `parseSyncSearch` is: no route-mounting
 * precedent to test against directly.
 *
 * Three refusals, each because acting anyway would be worse than doing
 * nothing: no `?product=` named (nothing to preselect), it already matches
 * what is active (switching is a no-op that would still re-fire the effect
 * on every render without this check), or it names a product this workspace
 * does not currently list (a stale link, or one for a different workspace --
 * switching to an id the per-product region cannot resolve would trade a
 * correct "nothing to override" state for a silently wrong one).
 */
export function productToPreselect(
  wantedProductId: string | undefined,
  activeProductId: string | null,
  knownProductIds: string[],
): string | null {
  if (!wantedProductId) return null;
  if (wantedProductId === activeProductId) return null;
  if (!knownProductIds.includes(wantedProductId)) return null;
  return wantedProductId;
}

/** Human name for a provider enum (google_docs -> Google Docs). */
function providerLabel(p: string): string {
  return CONNECTOR_REGISTRY[p as ProviderId]?.label ?? p.replace(/_/g, " ");
}

/** "3D AGO" is the retired system's caps grammar. Lower case reads as a fact
 *  rather than a label, and the number sits in Num like every other number. */
function ago(iso: string): string {
  return relTimeCaps(iso).toLowerCase();
}

/** The three providers whose adapters implement a real two-way document sync.
 *  Everything else reads one way, and says so rather than drawing two buttons
 *  that would fail. */
const TWO_WAY = new Set(["google_docs", "notion", "linear"]);

/**
 * THE PAGE'S OWN HEADLINE, READ FROM THE SAME COUNT THE SECTION BELOW READS
 * (P-44 follow-up, A-QUEUE.md — A1's live walk on Helio Labs / Relay: the
 * header said "Nothing is syncing yet. Point a source at something below"
 * directly above a region reading "1 pointed, all reading" -- one screen
 * disagreeing with itself about whether anything was pointed anywhere).
 *
 * `synced`/`conflicts` count SYNC MAPPINGS -- two-way DOCUMENT sync (Notion,
 * Google Docs, Linear), which a source like a bound GitHub repo never
 * produces. So a workspace can be genuinely, correctly "0 documents in
 * sync" while also having sources already pointed -- GitHub is exactly that
 * case, and "point a source" is a lie to someone who just did. `boundCount`
 * (the same number the Connected region renders) is read here ONLY to
 * choose which zero-documents sentence is honest, never folded into the
 * document count itself.
 */
export function syncHeadline(state: {
  failed: boolean;
  loading: boolean;
  conflictCount: number;
  syncedCount: number;
  boundCount: number;
}): string {
  if (state.failed) return "The sync state did not load, so nothing below is the whole picture.";
  if (state.loading) return "Reading what is in sync.";
  if (state.conflictCount > 0) {
    return `${state.conflictCount} ${state.conflictCount === 1 ? "document was" : "documents were"} edited on both sides and need you to say which copy wins.`;
  }
  if (state.syncedCount > 0) {
    return `Nothing is waiting on you. ${state.syncedCount} ${state.syncedCount === 1 ? "document agrees" : "documents agree"} with the copy in the tool that owns it.`;
  }
  if (state.boundCount > 0) {
    return "Nothing is syncing as a document yet. What is pointed below is reading, just not through a two-way document sync.";
  }
  return "Nothing is syncing yet. Point a source at something below and the documents start flowing.";
}

function SyncPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { conflict: followedConflictId, product: wantedProductId } = Route.useSearch();
  const { activeProductId, activeWorkspaceId, activeProduct, products, setActiveProductId } =
    useWorkspace();

  /*
   * THE PRODUCT A DOOR NAMED, PRESELECTED (P-44, A-QUEUE.md). Routed through
   * the same `setActiveProductId` the switcher itself calls -- not a local
   * override -- so the per-product region below reads it exactly as it would
   * if a person had clicked it there, and it stays selected on the way back
   * rather than reverting the instant this effect stops re-running.
   */
  useEffect(() => {
    const toSelect = productToPreselect(
      wantedProductId,
      activeProductId,
      products.map((p) => p.id),
    );
    if (toSelect) setActiveProductId(toSelect);
  }, [wantedProductId, activeProductId, products, setActiveProductId]);

  const fList = useServerFn(listSyncMappings);
  const fResolve = useServerFn(resolveSyncConflict);
  const fPull = useServerFn(pullMapping);
  const fPush = useServerFn(pushMapping);
  const fConnections = useServerFn(listConnections);
  const fBindings = useServerFn(listWorkspaceBindings);
  const fProductBindings = useServerFn(listProductBindings);
  const fRemove = useServerFn(removeBinding);
  const fAddOverride = useServerFn(addProductBinding);
  const fIngest = useServerFn(getIngestToken);

  const q = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fList() });
  const qConnections = useQuery({ queryKey: ["connections"], queryFn: () => fConnections() });
  const qBindings = useQuery({
    /* P-75: the key and the call both name the workspace, or one cache entry
       is shared across every workspace a person holds and Sources names another
       desk's repository as something this one may read. */
    queryKey: ["workspace-bindings", activeWorkspaceId ?? null],
    queryFn: () => fBindings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const qProduct = useQuery({
    queryKey: ["product-bindings", activeProductId],
    queryFn: () => fProductBindings({ data: { projectId: activeProductId ?? "" } }),
    enabled: Boolean(activeProductId),
  });
  /* The foot's token read, started WITH the page's reads rather than after
     them. `WebhookIngest` mounts once the page has landed and reads the same
     key, so it finds the answer already there and never draws a second
     "Reading" after the page's one has gone. */
  useQuery({ queryKey: ["ingest-token"], queryFn: () => fIngest() });

  const mappings = (q.data?.mappings ?? []) as Mapping[];
  const allConflicts = mappings.filter((m) => m.conflict);
  const synced = mappings.filter((m) => !m.conflict);
  const connections = (qConnections.data?.connections ?? []) as ConnectionRow[];
  const bindings = (qBindings.data?.bindings ?? []) as WorkspaceBindingRow[];
  const productBindings = (qProduct.data?.bindings ?? []) as BindingRow[];

  const model = sourcesModel({
    connections,
    bindings,
    mappings,
    availability: qConnections.data?.providerAvailability,
  });

  const loading =
    q.isLoading ||
    qConnections.isLoading ||
    qBindings.isLoading ||
    (Boolean(activeProductId) && qProduct.isLoading);
  const failedError = q.isError
    ? q.error
    : qConnections.isError
      ? qConnections.error
      : qBindings.isError
        ? qBindings.error
        : qProduct.isError
          ? qProduct.error
          : null;
  const failed = failedError !== null;
  const retryAll = () => {
    if (q.isError) void q.refetch();
    if (qConnections.isError) void qConnections.refetch();
    if (qBindings.isError) void qBindings.refetch();
    if (qProduct.isError) void qProduct.refetch();
  };

  // The conflict a person followed here is the one call in front of them, so it
  // is FIRST. Order is the emphasis; the retired surface bought the same thing
  // with an ember border on a card, which is the banned side-accent.
  const conflicts = [...allConflicts].sort((a, b) => {
    const fa = a.id === followedConflictId ? 0 : 1;
    const fb = b.id === followedConflictId ? 0 : 1;
    return fa - fb;
  });

  const mResolve = useMutation({
    mutationFn: (vars: { id: string; strategy: "keep_local" | "keep_remote" }) =>
      fResolve({ data: vars }),
    onSuccess: () => {
      toast.success("Conflict resolved");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
    },
    // A failed resolve must never look like it worked.
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Resolve failed"),
  });

  const mPull = useMutation({
    mutationFn: (id: string) => fPull({ data: { id } }),
    onSuccess: () => {
      toast.success("Pulled the latest remote version");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
      qc.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Pull failed"),
  });
  const mPush = useMutation({
    mutationFn: (id: string) => fPush({ data: { id } }),
    onSuccess: () => {
      toast.success("Pushed the Supaprod version to the remote tool");
      qc.invalidateQueries({ queryKey: ["sync-mappings"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Push failed"),
  });

  const isBusy = (id: string) =>
    (mPull.isPending && mPull.variables === id) || (mPush.isPending && mPush.variables === id);

  /*
   * UNBINDING A WORKSPACE SOURCE ASKS FIRST, and the per-product removal
   * below deliberately does not. A workspace binding is the bottom of the
   * credential chain (product binding > workspace binding > user connection);
   * `removeBinding` is a hard DELETE on `connection_bindings`, so there is no
   * layer underneath and nothing to inherit. The crew stops being able to
   * reach that resource, and work already in flight finds it gone. A product
   * override, by contrast, falls back to the workspace one, and its own label
   * says so, so a question there would be friction guarding nothing.
   */
  const mUnbind = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Binding removed");
      qc.invalidateQueries({ queryKey: ["workspace-bindings"] });
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Unbind failed")),
  });
  const askThenUnbind = async (id: string, what: string) => {
    const ok = await confirm({
      title: `Unbind ${what}?`,
      body: `The crew reaches this through the binding, so it stops being able to act on it the moment you confirm, including work that is running right now. Nothing is deleted where it lives and the connection itself stays. Pointing at it again means choosing the resource from scratch.`,
      confirmLabel: "Unbind it",
      destructive: true,
    });
    if (ok) mUnbind.mutate(id);
  };

  const mAddOverride = useMutation({
    mutationFn: (args: {
      connectionId: string;
      provider: string;
      resourceKind: string;
      resourceId: string;
      resourceLabel?: string;
    }) =>
      fAddOverride({
        data: {
          projectId: activeProductId ?? "",
          workspaceId: activeWorkspaceId ?? "",
          connectionId: args.connectionId,
          provider: args.provider,
          resourceKind: args.resourceKind,
          resourceId: args.resourceId,
          resourceLabel: args.resourceLabel,
        },
      }),
    onSuccess: () => {
      toast.success("Product binding saved");
      qc.invalidateQueries({ queryKey: ["product-bindings", activeProductId] });
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Bind failed")),
  });
  const mRemoveOverride = useMutation({
    mutationFn: (id: string) => fRemove({ data: { id } }),
    onSuccess: () => {
      toast.success("Override removed. This product falls back to the workspace binding.");
      qc.invalidateQueries({ queryKey: ["product-bindings", activeProductId] });
    },
    onError: (e: unknown) => toast.error(humanWriteError(e, "Unbind failed")),
  });

  /* The source's own page in Settings: its accounts, scopes, verify and
     disconnect. The same door the retired "Connect it" link opened, and the
     one every press in "Connect a source" opens. */
  const openSource = (provider: ProviderId) =>
    navigate({ to: "/settings", search: { section: "connections", connector: provider } });

  // Honesty: a followed conflict that is no longer in the list was resolved
  // (here or remotely) between the click and the landing. Say so quietly.
  const followedGone =
    Boolean(followedConflictId) &&
    !q.isLoading &&
    !q.isError &&
    !allConflicts.some((m) => m.id === followedConflictId);

  const head = syncHeadline({
    failed,
    loading,
    conflictCount: conflicts.length,
    syncedCount: synced.length,
    boundCount: bindings.length,
  });

  return (
    <Surface wide>
      {/* THE COLUMN OWNS ITS OWN RHYTHM. Meridian's `Region` draws no margin and
          no hairline of its own, so the surface states the gap once: `gap-mrd-7`,
          40px, the step Brain, Crew, Decide, Design, Learn, Plan and Ship all
          took for the same job. */}
      <div className="flex flex-col gap-mrd-7">
        <PageHeading station="sense" title="Sources" sub={head} />

        {failed ? (
          /* ONE LINE FOR THE WHOLE PAGE. Four reads land together; whichever
             failed first is named, and one retry refetches every one that
             failed. Nothing below it is drawn, because a Connected list read
             off half the answer would be a confident wrong picture. */
          <ReadFailedLine error={failedError} onRetry={retryAll}>
            {reasonLine("Your sources did not load. Nothing connected has changed.", failedError)}
          </ReadFailedLine>
        ) : loading ? (
          <Reading>Reading what is connected and what each source is pointed at.</Reading>
        ) : (
          <>
            {/* THE BARE HALF OF THE PAIR, and not `NothingHere`: one quiet
                sentence standing in the column with no region around it. */}
            {followedGone ? (
              <NothingYet>The conflict you followed here is already resolved.</NothingYet>
            ) : null}

            {/* The decision, first and biggest, because it is the only thing on
                this surface that is waiting on a person. */}
            {conflicts.map((m) => {
              const twoWay = TWO_WAY.has(m.provider);
              return (
                <div key={m.id} className="flex flex-col gap-mrd-3">
                  {/* `Choice.option.fact` is required and the same fact on every
                      row (its own header): the version each side is on. Push and
                      pull are not peer options in that sense -- they resolve by a
                      different MECHANISM, not by naming which version wins -- so
                      they render as quiet actions beside the choice rather than a
                      third and fourth row with no version fact of their own. */}
                  <Choice
                    question={`Which copy of ${m.external_id} wins?`}
                    why="Both sides changed since the last sync."
                    busyId={
                      mResolve.isPending && mResolve.variables?.id === m.id
                        ? mResolve.variables.strategy
                        : null
                    }
                    options={[
                      {
                        id: "keep_local",
                        label: "Keep the Supaprod copy",
                        fact: `version ${m.version_local}`,
                      },
                      {
                        id: "keep_remote",
                        label: `Keep the ${providerLabel(m.provider)} copy`,
                        fact: `version ${m.version_remote}`,
                      },
                    ]}
                    onPick={(strategy) =>
                      mResolve.mutate({
                        id: m.id,
                        strategy: strategy as "keep_local" | "keep_remote",
                      })
                    }
                  />
                  {twoWay || m.external_url ? (
                    <Actions>
                      {twoWay ? (
                        <>
                          <Action
                            variant="quiet"
                            disabled={isBusy(m.id)}
                            onClick={() => mPush.mutate(m.id)}
                          >
                            {mPush.isPending && mPush.variables === m.id
                              ? "Pushing"
                              : "Push ours and resolve"}
                          </Action>
                          <Action
                            variant="quiet"
                            disabled={isBusy(m.id)}
                            onClick={() => mPull.mutate(m.id)}
                          >
                            {mPull.isPending && mPull.variables === m.id
                              ? "Pulling"
                              : "Pull theirs and resolve"}
                          </Action>
                        </>
                      ) : null}
                      {m.external_url ? (
                        /* THE ONE CONTROL HERE THAT LEAVES THE APP, so it stays an
                           `<a>` and takes only the paint. `data-mrd` carries the
                           Meridian focus ring; every Meridian control root
                           declares its own, so this one keeps the ring wherever
                           it is dropped. */
                        <a
                          data-mrd=""
                          className={ACTION_LINK_FACE.quiet}
                          href={m.external_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Read both first
                        </a>
                      ) : null}
                    </Actions>
                  ) : null}
                </div>
              );
            })}

            {/* ── 3. CONNECTED ─────────────────────────────────────────── */}
            <Region title="Connected" sub={connectedSummary(model.connected)}>
              {model.connected.length === 0 ? (
                <NothingYet>
                  Nothing is connected yet. Connect a source below and Discover can read it.
                </NothingYet>
              ) : (
                model.connected.map((source) => (
                  <ConnectedRow
                    key={source.key}
                    source={source}
                    unbinding={
                      mUnbind.isPending && mUnbind.variables === (source.binding?.id ?? null)
                    }
                    onOpen={() => openSource(source.spec.id)}
                    onUnbind={() => {
                      if (!source.binding) return;
                      const what = source.kind
                        ? `${source.spec.label} ${source.kind.label.toLowerCase()}`
                        : source.spec.label;
                      void askThenUnbind(source.binding.id, what);
                    }}
                  />
                ))
              )}
            </Region>

            {/* The evidence that a two-way source is reading: only drawn when
                there is any. A Notion database with nothing synced yet is
                already said on its Connected row, so an empty region here would
                be the same fact twice. */}
            {synced.length > 0 ? (
              <Region
                title="Documents in sync"
                sub="Each row opens the document in the tool that owns it."
              >
                {synced.slice(0, 20).map((m) => {
                  const twoWay = TWO_WAY.has(m.provider);
                  const lastSync = latestIso([m.last_pulled_at, m.last_pushed_at]);
                  const verb =
                    m.last_pushed_at && (!m.last_pulled_at || m.last_pushed_at > m.last_pulled_at)
                      ? "pushed"
                      : "pulled";
                  return (
                    <Row
                      key={m.id}
                      tight
                      // Monochrome: the subject of the row is the sync state,
                      // and the provider is its context.
                      marks={<ProviderMark provider={m.provider} tone="mono" />}
                      lead={m.external_id}
                      sub={
                        <>
                          {providerLabel(m.provider)}
                          {" · "}
                          {lastSync ? (
                            <>
                              {verb} <Num>{ago(lastSync)}</Num>
                            </>
                          ) : (
                            "not synced yet"
                          )}
                          {twoWay ? null : " · reads only"}
                        </>
                      }
                      onClick={
                        m.external_url
                          ? () => window.open(m.external_url!, "_blank", "noopener,noreferrer")
                          : undefined
                      }
                      action={
                        twoWay ? (
                          <>
                            <Action
                              variant="quiet"
                              disabled={isBusy(m.id)}
                              onClick={() => mPull.mutate(m.id)}
                            >
                              {mPull.isPending && mPull.variables === m.id ? "Pulling" : "Pull"}
                            </Action>
                            <Action
                              variant="quiet"
                              disabled={isBusy(m.id)}
                              onClick={() => mPush.mutate(m.id)}
                            >
                              {mPush.isPending && mPush.variables === m.id ? "Pushing" : "Push"}
                            </Action>
                          </>
                        ) : null
                      }
                    />
                  );
                })}
              </Region>
            ) : null}

            {/* ── 4. CONNECT A SOURCE ──────────────────────────────────── */}
            <ConnectPresses presses={model.toConnect} onConnect={openSource} />

            {/* ── 5. JUST FOR <PRODUCT> ────────────────────────────────── */}
            {activeProductId && activeWorkspaceId && model.overridable.length > 0 ? (
              <JustForProduct
                productId={activeProductId}
                workspaceId={activeWorkspaceId}
                productName={activeProduct?.name}
                providers={model.overridable}
                connections={connections}
                bindings={productBindings}
                adding={mAddOverride.isPending}
                onAdd={(args) => mAddOverride.mutate(args)}
                removingId={mRemoveOverride.isPending ? (mRemoveOverride.variables ?? null) : null}
                onRemove={(id) => mRemoveOverride.mutate(id)}
                onRepoCreated={() =>
                  qc.invalidateQueries({ queryKey: ["product-bindings", activeProductId] })
                }
              />
            ) : null}
          </>
        )}

        {/* ── 6. SEND ANYTHING IN ──────────────────────────────────────── */}
        {loading ? null : <WebhookIngest />}
      </div>
    </Surface>
  );
}

/* ------------------------------------------------------------------ *
 * 3. One connected source
 * ------------------------------------------------------------------ */

/**
 * ONE ROW PER CONNECTED SOURCE: the provider, what it is pointed at, who
 * pointed it, and when it last did anything. The row is a door to the source's
 * own page in Settings (accounts, verify, disconnect); the control at its
 * trailing edge is the one decision the row itself carries.
 *
 * THE TIME IS THE MOST RECENT TRUE THING, and the verb says which: `synced`
 * when the provider has a two-way document sync, `pointed` when the binding is
 * the latest event, `verified` when all the product knows is that the account
 * answered. No time is invented for a source that has none.
 */
function ConnectedRow({
  source,
  unbinding,
  onOpen,
  onUnbind,
}: {
  source: ConnectedSource;
  unbinding: boolean;
  onOpen: () => void;
  onUnbind: () => void;
}) {
  const { spec, kind, connection, reading, binding, lastSyncIso } = source;
  const lead = kind ? `${spec.label} ${kind.label.toLowerCase()}` : spec.label;
  const account = connection.account_label ?? connection.account_email ?? null;
  const resource = binding ? (binding.resource_label ?? binding.resource_id) : null;

  const when = lastSyncIso
    ? { verb: "synced", iso: lastSyncIso }
    : binding
      ? { verb: "pointed", iso: latestIso([binding.updated_at, binding.created_at]) }
      : connection.last_verified_at
        ? { verb: "verified", iso: connection.last_verified_at }
        : null;
  const whenText = when?.iso ? `${when.verb} ${ago(when.iso)}` : null;

  /* The sentence is built twice on purpose: once as nodes, so the number wears
     `Num` and a stopped source wears `Value`, and once as plain text, so the
     truncated row still has a tooltip that reads whole (Row's own rule). */
  let sub: React.ReactNode;
  let subText: string;
  if (!reading) {
    const rest = [resource, "open it to reconnect"].filter(Boolean).join(" · ");
    subText = `stopped reading · ${rest}`;
    sub = (
      <>
        <Value tone="fail">stopped reading</Value>
        {` · ${rest}`}
      </>
    );
  } else if (binding) {
    const parts: string[] = [resource ?? ""];
    if (account) parts.push(`via ${account}`);
    if (binding.owner_display) parts.push(`bound by ${binding.owner_display}`);
    subText = [...parts, whenText].filter(Boolean).join(" · ");
    sub = (
      <>
        {parts.join(" · ")}
        {when?.iso ? (
          <>
            {" · "}
            {when.verb} <Num>{ago(when.iso)}</Num>
          </>
        ) : null}
      </>
    );
  } else if (kind) {
    subText = account
      ? `Nothing chosen yet, so the crew can see ${account} and nothing inside it.`
      : "Nothing chosen yet, so the crew can see the account and nothing inside it.";
    sub = subText;
  } else {
    const parts = [account, "reads the whole account"].filter(Boolean) as string[];
    subText = [...parts, whenText].filter(Boolean).join(" · ");
    sub = (
      <>
        {parts.join(" · ")}
        {when?.iso ? (
          <>
            {" · "}
            {when.verb} <Num>{ago(when.iso)}</Num>
          </>
        ) : null}
      </>
    );
  }

  return (
    <Row
      tight
      // Brand hue: this list's subject IS the provider, which is the one case
      // source-marks.tsx reserves colour for.
      marks={<ProviderMark provider={spec.id} size={18} />}
      lead={lead}
      sub={sub}
      subTitle={subText}
      onClick={onOpen}
      action={
        binding ? (
          /* TIER: Action, destructive face - unbinds the resource the crew acts
             through, a removal on the credential chain. Asks first; see
             `askThenUnbind`. */
          <Action variant="destructive" busy={unbinding} onClick={onUnbind}>
            Unbind
          </Action>
        ) : reading && kind ? (
          <BindingPicker
            connectionId={connection.id}
            resourceKind={kind.kind}
            kindLabel={kind.label}
          />
        ) : null
      }
    />
  );
}

/* ------------------------------------------------------------------ *
 * 4. Connect a source
 * ------------------------------------------------------------------ */

/**
 * ONE PRESS PER PROVIDER THAT IS NOT CONNECTED. Each says what the source
 * brings, and the region says once, at the top, what pressing does. What a
 * press never says is what its provider is not: that was the twenty-two-line
 * page this replaces.
 *
 * Three subs, in priority order, and two of them are the catalogue's own
 * sentences so the two surfaces cannot drift: a provider that connects but
 * sends nothing back yet says so before anything else (the FAQ, the catalogue
 * and this press all read the same registry facts); one waiting on an admin
 * to register its app is dimmed and says that; the rest say what they bring.
 */
function ConnectPresses({
  presses,
  onConnect,
}: {
  presses: ConnectPress[];
  onConnect: (provider: ProviderId) => void;
}) {
  return (
    <Region
      title="Connect a source"
      sub="Each one opens that source's own sign-in. Once it is connected it appears above, ready to be pointed at a repository, team, channel or database."
    >
      {presses.length === 0 ? (
        <NothingYet>Every source we carry is connected.</NothingYet>
      ) : (
        <Grid>
          {presses.map((p) => (
            <Cell
              key={p.spec.id}
              mark={<ProviderMark provider={p.spec.id} size={18} />}
              lead={p.spec.label}
              sub={
                !p.readsSomething
                  ? "Connects, but sends nothing back yet"
                  : p.ready
                    ? sourceBrings(p.spec.id)
                    : NOT_SET_UP_HERE
              }
              title={p.ready ? p.spec.description : (p.spec.setupHint ?? p.spec.description)}
              // A cell nobody can connect dims and never lights up: an
              // affordance is a promise.
              disabled={!p.ready}
              onClick={p.ready ? () => onConnect(p.spec.id) : undefined}
            />
          ))}
        </Grid>
      )}
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 5. Just for this product
 * ------------------------------------------------------------------ */

/**
 * PER-PRODUCT OVERRIDE. The most specific link in the credential chain:
 *   product binding > workspace binding > user connection > env fallback
 *
 * Drawn only when there is something connected to override, and naming only
 * that: a line for a provider with no connected account was the second half
 * of the twenty-two negations. Every server function, the pick-then-bind
 * flow and the repo-creation door are the ones `ProductBindingsSection`
 * carried; the override is still named on the second line, because an
 * override that does not say what it overrides is a setting nobody can audit.
 */
function JustForProduct({
  productId,
  workspaceId,
  productName,
  providers,
  connections,
  bindings,
  adding,
  onAdd,
  removingId,
  onRemove,
  onRepoCreated,
}: {
  productId: string;
  workspaceId: string;
  productName?: string;
  providers: ProviderSpec[];
  connections: ConnectionRow[];
  bindings: BindingRow[];
  adding: boolean;
  onAdd: (args: {
    connectionId: string;
    provider: string;
    resourceKind: string;
    resourceId: string;
    resourceLabel?: string;
  }) => void;
  removingId: string | null;
  onRemove: (id: string) => void;
  onRepoCreated: () => void;
}) {
  const [picking, setPicking] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const title = productName ? `Just for ${productName}` : "Just for this product";
  const hasGithub = providers.some((spec) => spec.id === "github");

  return (
    <Region
      title={title}
      sub={
        bindings.length === 0
          ? "Nothing overridden, so this product uses whatever the workspace is pointed at."
          : `${bindings.length} ${bindings.length === 1 ? "override" : "overrides"} in force. They win over the workspace binding above.`
      }
    >
      {providers.flatMap((spec) =>
        spec.resourceTypes.map((rt) => {
          const binding = bindings.find(
            (b) => b.provider === spec.id && b.resource_kind === rt.kind,
          );
          const connected = connections.filter(
            (c) => c.provider === spec.id && c.status === "connected",
          );
          const pickKey = `${spec.id}:${rt.kind}`;

          return (
            <Line
              key={pickKey}
              // Monochrome: the subject here is which binding wins, not which
              // brand it belongs to.
              label={
                <ProviderName provider={spec.id}>
                  {`${spec.label} ${rt.label.toLowerCase()}`}
                </ProviderName>
              }
              sub={
                <UnderMark>
                  {binding
                    ? `${binding.resource_label ?? binding.resource_id} · overrides the workspace default`
                    : "Follows the workspace default."}
                </UnderMark>
              }
            >
              {binding ? (
                /* TIER: Action, destructive face - unlinks the override so the
                   product falls back to the workspace default. */
                <Action
                  variant="destructive"
                  busy={removingId === binding.id}
                  onClick={() => onRemove(binding.id)}
                >
                  {removingId === binding.id ? "Removing" : "Use the workspace one"}
                </Action>
              ) : picking === pickKey ? (
                <>
                  <Picker
                    aria-label={`Pick the account for ${spec.label}`}
                    defaultValue=""
                    disabled={adding}
                    onChange={(e) => {
                      const conn = connected.find((c) => c.id === e.target.value);
                      if (!conn) return;
                      onAdd({
                        connectionId: conn.id,
                        provider: spec.id,
                        resourceKind: rt.kind,
                        resourceId: conn.account_label ?? conn.id,
                        resourceLabel: conn.account_label ?? undefined,
                      });
                      setPicking(null);
                    }}
                  >
                    <option value="" disabled>
                      Pick an account
                    </option>
                    {connected.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.account_label ?? c.id.slice(0, 8)}
                      </option>
                    ))}
                  </Picker>
                  {/* TIER: clause 3, dismisses the picker; nothing is written. */}
                  <Action variant="quiet" onClick={() => setPicking(null)}>
                    Cancel
                  </Action>
                </>
              ) : (
                /* TIER: clause 3, reveals the picker; nothing is written. */
                <Action variant="quiet" onClick={() => setPicking(pickKey)}>
                  Override it
                </Action>
              )}
            </Line>
          );
        }),
      )}

      {hasGithub ? (
        <Actions>
          {/* TIER: clause 3, opens the repo-creation modal; nothing is written here. */}
          <Action onClick={() => setShowCreateModal(true)}>Create a new GitHub repo</Action>
        </Actions>
      ) : null}

      <CreateRepoModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        productId={productId}
        workspaceId={workspaceId}
        productName={productName}
        onSuccess={onRepoCreated}
      />
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * 6. Send anything in
 * ------------------------------------------------------------------ */

type IngestToken = {
  id: string;
  token_prefix: string | null;
  token?: string; // present only in the rotate response
  label: string | null;
  created_at: string;
};

/** The one source that is not a connector: anything that can POST. */
function WebhookIngest() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fGet = useServerFn(getIngestToken);
  const fRotate = useServerFn(rotateIngestToken);
  const fRevoke = useServerFn(revokeIngestToken);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const endpoint = `${origin}/api/public/ingest-signals`;

  const [revealed, setRevealed] = useState(false);
  const [curlOpen, setCurlOpen] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const q = useQuery({ queryKey: ["ingest-token"], queryFn: () => fGet() });
  const token = (q.data?.token ?? null) as IngestToken | null;

  const mRotate = useMutation({
    mutationFn: () => fRotate(),
    onSuccess: (res) => {
      toast.success(token ? "Token rotated" : "Token generated");
      const plaintext = (res?.token as { token?: string } | null)?.token ?? null;
      setFreshToken(plaintext);
      setRevealed(Boolean(plaintext));
      qc.invalidateQueries({ queryKey: ["ingest-token"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Token update failed"),
  });
  const mRevoke = useMutation({
    mutationFn: () => fRevoke(),
    onSuccess: () => {
      toast.success("Token revoked");
      setRevealed(false);
      setFreshToken(null);
      qc.invalidateQueries({ queryKey: ["ingest-token"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Revoke failed"),
  });

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );

  const curlExample = [
    `curl -X POST ${endpoint} \\`,
    `  -H "Authorization: Bearer YOUR_TOKEN" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"signals":[{"title":"Checkout drop-off spike","content":"From support thread","source":"zapier"}]}'`,
  ].join("\n");

  async function onRotate() {
    if (token) {
      const ok = await confirm({
        title: "Rotate this token?",
        body: "Anything already posting with the old token stops working the moment this completes. The new token is shown once.",
        confirmLabel: "Rotate it",
        destructive: true,
      });
      if (!ok) return;
    }
    mRotate.mutate();
  }

  async function onRevoke() {
    const ok = await confirm({
      title: "Revoke this token?",
      body: "Every webhook posting into this workspace stops immediately. Signals already ingested stay.",
      confirmLabel: "Revoke it",
      destructive: true,
    });
    if (ok) mRevoke.mutate();
  }

  return (
    /* `toggle` rather than `goTo`, and that is not a rename. This control reveals
       the curl example in place instead of leaving the region, and `Region` emits
       `aria-expanded` for a toggle and not for a way out. */
    <Region
      title="Send anything in"
      sub="Point Zapier, a Slack outgoing webhook, a form or a script at this endpoint. Each request becomes signals in this workspace."
      toggle={curlOpen ? "Hide the example" : "Show a curl example"}
      toggled={curlOpen}
      onToggle={() => setCurlOpen((v) => !v)}
    >
      <Line label="Endpoint" sub={<Num>{endpoint || "reading"}</Num>}>
        <Action disabled={!origin} onClick={() => copy(endpoint, "Endpoint")}>
          Copy
        </Action>
      </Line>

      {q.isLoading ? (
        <Reading>Reading your token.</Reading>
      ) : q.isError ? (
        // A failed token read must not dress as "no token yet" and offer
        // Generate: that would create a second token nobody asked for.
        <ReadFailedLine onRetry={() => void q.refetch()} error={q.error}>
          {reasonLine("The token did not load. Nothing was issued or revoked.", q.error)}
        </ReadFailedLine>
      ) : token ? (
        <Line
          label="Token"
          sub={
            <Num>
              {revealed && freshToken ? freshToken : `${(token.token_prefix ?? "").slice(0, 8)}…`}
            </Num>
          }
        >
          {freshToken ? (
            <>
              <Action variant="quiet" onClick={() => setRevealed((v) => !v)}>
                {revealed ? "Hide" : "Reveal"}
              </Action>
              <Action onClick={() => copy(freshToken, "Token")}>Copy</Action>
            </>
          ) : null}
          <Action busy={mRotate.isPending} onClick={onRotate}>
            {mRotate.isPending ? "Rotating" : "Rotate"}
          </Action>
          {/* QUIET, AND NOT `destructive`: revoke was `ghost` here, and moving a
              control onto `--mrd-stop` changes what the colour says on this
              surface. What protects it is unchanged and is the part that
              matters: it sits behind a confirm that names what stops. */}
          <Action variant="quiet" busy={mRevoke.isPending} onClick={onRevoke}>
            {mRevoke.isPending ? "Revoking" : "Revoke"}
          </Action>
        </Line>
      ) : (
        <Line
          label="Token"
          sub="No token yet, so nothing can post in. The full token is shown once, when it is made."
        >
          <Action variant="primary" busy={mRotate.isPending} onClick={() => mRotate.mutate()}>
            {mRotate.isPending ? "Generating" : "Generate a token"}
          </Action>
        </Line>
      )}

      {token && !freshToken ? (
        <NothingYet>The full token is only ever shown once, at the moment it is made.</NothingYet>
      ) : null}

      {/* 16px above the example, said here rather than by the box: Meridian's
          `Pre` sets no margin so the composition owns the space, and `Pre`
          takes no `className`, so it is a wrapper. */}
      {curlOpen ? (
        <div className="mt-mrd-5">
          <Pre>{curlExample}</Pre>
        </div>
      ) : null}
    </Region>
  );
}
