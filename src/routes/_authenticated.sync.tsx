/**
 * SYNC. Redesigned, not ported (SURFACE-JUSTIFICATION.md, founder-directed
 * 2026-07-29). This surface was the last one in the app still drawing the
 * retired system: its own h1 with a gradient rule under it, `bento` cards,
 * `mono-label` headings, `--hairline` borders and `--ink-subtle` text. Every
 * one of those classes and tokens was deleted from the stylesheets in the
 * rebuild, so the page was rendering as unstyled stacks. It is rebuilt on the
 * primitives here. The six questions, answered before a line was written:
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Someone who just read "not reading" or "nothing bound yet" on a source,
 *    here to point that source at the right repo, team, channel or database.
 *    Or, less often and more urgently, someone whose doc was edited on both
 *    sides and who has to say which copy wins. Two jobs, one object: the link
 *    between a source and a specific thing inside it.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE:
 *    Choosing what a connected source actually acts on. Settings answers "is
 *    Linear connected"; this answers "connected to WHICH team", which is the
 *    difference between an agent that can see an account and an agent that can
 *    do something. A two-sided edit is the same decision arriving late.
 *
 * 3. KEEP / MOVE / KILL, every element:
 *    KEEP - workspace bindings (the reason the surface exists), the per-product
 *      override (the most specific link of the credential chain), conflicts,
 *      the recently-synced evidence, and the inbound webhook, which is the one
 *      source that is not a connector.
 *    KILL - the page's own h1, the 24x2px gradient rule under it, and the
 *      paragraph explaining the page to itself. The frame already titles the
 *      surface, and a rule that carries no information is decoration.
 *    KILL - the "Settings, Connections" breadcrumb at the top left. A
 *      breadcrumb to a settings section is not navigation, it is an apology for
 *      the surface not being on the rail. One door back sits with the bindings,
 *      where a person who cannot find their source actually needs it.
 *    KILL - every `bento` card. Six bordered containers in one column, several
 *      nested. One bordered container per region, maximum, and Blocks divide
 *      with a rule instead.
 *    KILL - every animate-pulse skeleton (three of them). Motion that carries
 *      no information; Loading says it in words and reserves the height.
 *    KILL - the ember border on the conflict you followed here. A coloured
 *      border on one side of a rounded card is the most recognisable AI tell,
 *      and the emphasis it was buying is bought better by ORDER: the followed
 *      conflict is simply first.
 *    KILL - the armed two-step Rotate and Revoke buttons that turned amber and
 *      red and reset themselves after four seconds. A destructive action asks
 *      once, in a sentence, through the confirm the rest of the product uses.
 *    KILL - the icon-only external-link glyph on every synced row. The row is
 *      the door now; clicking it opens the document where it lives.
 *    MOVE - nothing off this surface. Account-level connecting already lives in
 *      Settings and this page has not tried to duplicate it since 2026-07-06.
 *    ADD, later the same night on the founder's second look - the provider mark
 *      on every synced row. That row already reserved a 34px mark slot and left
 *      it empty, and which tool owns the document is the one fact its lead
 *      does not say. Monochrome, because the row's subject is the sync state.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE:
 *    The document itself (the row opens it in the tool that owns it), the
 *    source's own page and its accounts (Settings, ?connector=), and the curl
 *    example for the webhook, which is folded until someone is actually wiring
 *    something up. Rows are one or two lines and never wrap.
 *
 * 5. DELIGHT, AND CONFUSION:
 *    The delight is that every binding line names what it is pointed at, who
 *    pointed it, and whether it is still reading, so a person can audit the
 *    crew's whole reach in one screen without opening anything. What would
 *    confuse, and is therefore not drawn: two Pull and Push buttons on a
 *    provider that only reads (it says "reads only" instead), a primary button
 *    on either side of a conflict (neither copy is inherently right, so the
 *    Gate carries the emphasis and no button claims to be the answer), and a
 *    conflict count that says zero when the read failed.
 *
 * 6. WHERE DOES THE CREW APPEAR ON THIS SURFACE, AND WHAT DOES IT PROVE?
 *    A binding is the crew's reach: it is the exact object an agent writes
 *    through when it files an issue or publishes a spec. So every binding line
 *    carries attribution, `bound by <person>`, and states plainly when the
 *    connection behind it has stopped reading, which is a capability the
 *    product has lost and must not keep implying it has. No agent mark is drawn
 *    on this page because no agent acts here; the honest answer to "where is
 *    the crew" is "downstream of every line on this screen", and inventing a
 *    running mark to satisfy the question would be the overclaim R12 bans.
 */
import { useEffect, useState } from "react";
import { Row, Line } from "@/components/meridian/rows";
import {
  ACTION_LINK_FACE,
  Action,
  Actions,
  NothingYet,
  Num,
  PageHeading,
  Pre,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Choice } from "@/components/meridian/Choice";
import { Surface } from "@/components/meridian/Surface";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { WorkspaceBindingsSection } from "@/components/connections/WorkspaceBindingsSection";
import { ProductBindingsSection } from "@/components/connections/ProductBindingsSection";
import { ProviderMark } from "@/components/meridian/source-marks";
import { listSyncMappings, resolveSyncConflict } from "@/lib/integrations.functions";
import { listWorkspaceBindings } from "@/lib/connections.functions";
import { pullMapping, pushMapping } from "@/lib/sync.functions";
import { getIngestToken, rotateIngestToken, revokeIngestToken } from "@/lib/ingest.functions";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import { useWorkspace } from "@/hooks/use-workspace";
import { latestIso, relTimeCaps } from "@/components/discover/format";

/**
 * THE QUIET LINK FACE lived here as a local constant, the second copy in the
 * product beside AccountConnectionsSection.tsx. Both collapsed into
 * ACTION_LINK_FACE.quiet in meridian/surface-parts.tsx (R005, 2026-08-23),
 * whose default face is byte-identical to run-parts' LINK_AS_CONTROL, so the
 * door at the foot of this page moved to it unchanged.
 */

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
 * product so `ProductBindingsSection` opens already pointed at it.
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
  head: () => ({ meta: [{ title: "Sync · Supaprod" }] }),
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
        <PageHeading
          title="Sync did not open."
          sub={(error as Error)?.message ?? "The read failed."}
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
 * switching to an id `ProductBindingsSection` cannot resolve would trade a
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
 * (the same number `WorkspaceBindingsSection` renders) is read here ONLY to
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
  const { conflict: followedConflictId, product: wantedProductId } = Route.useSearch();
  const { activeProductId, activeWorkspaceId, activeProduct, products, setActiveProductId } =
    useWorkspace();

  /*
   * THE PRODUCT A DOOR NAMED, PRESELECTED (P-44, A-QUEUE.md). Routed through
   * the same `setActiveProductId` the switcher itself calls -- not a local
   * override -- so `ProductBindingsSection` below reads it exactly as it
   * would if a person had clicked it there, and it stays selected on the way
   * back rather than reverting the instant this effect stops re-running.
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

  const q = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fList() });
  const mappings = (q.data?.mappings ?? []) as Mapping[];
  const allConflicts = mappings.filter((m) => m.conflict);
  const synced = mappings.filter((m) => !m.conflict);

  /*
   * SAME QUERY KEY AND FN `WorkspaceBindingsSection` already uses below --
   * this shares its cache entry rather than firing a second request, and
   * exists only so the page's own headline can read the count the section
   * renders instead of contradicting it. See `syncHeadline`.
   */
  const fBindings = useServerFn(listWorkspaceBindings);
  const bindingsQ = useQuery({
    queryKey: ["workspace-bindings"],
    queryFn: () => fBindings(),
  });
  const boundCount = bindingsQ.data?.bindings?.length ?? 0;

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

  // Honesty: a followed conflict that is no longer in the list was resolved
  // (here or remotely) between the click and the landing. Say so quietly.
  const followedGone =
    Boolean(followedConflictId) &&
    !q.isLoading &&
    !q.isError &&
    !allConflicts.some((m) => m.id === followedConflictId);

  const head = syncHeadline({
    failed: q.isError,
    loading: q.isLoading,
    conflictCount: conflicts.length,
    syncedCount: synced.length,
    boundCount,
  });

  return (
    <Surface wide>
      {/* THE COLUMN OWNS ITS OWN RHYTHM, WHICH IS WHAT CHANGED HERE. The retired
          `Block` baked a 36px top margin and a hairline into every region, so the
          space between sections was decided eight times over by the components
          that happened to be in them. Meridian's `Region` draws neither, so the
          surface states the gap once: `gap-mrd-7`, 40px, the step Brain, Crew,
          Decide, Design, Learn, Plan and Ship all took for the same job. */}
      <div className="flex flex-col gap-mrd-7">
        <PageHeading title="Sync" sub={head} />

        {/* The decision, first and biggest, because it is the only thing on this
          surface that is waiting on a person. */}
        {q.isError ? (
          <ReadFailedLine onRetry={() => void q.refetch()}>
            The sync state did not load. {(q.error as Error)?.message ?? "The read failed."}
          </ReadFailedLine>
        ) : null}

        {/* THE BARE HALF OF THE PAIR, and not `NothingHere`. This is one quiet
          sentence standing in the column with no region around it, and the
          bordered box is what this surface's own rebuild went out of its way to
          remove ("KILL - every bento card ... one bordered container per region,
          maximum"). The retired `Empty` drew no border either, so the bare half
          is also the faithful port. */}
        {followedGone ? (
          <NothingYet>The conflict you followed here is already resolved.</NothingYet>
        ) : null}

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
                  mResolve.mutate({ id: m.id, strategy: strategy as "keep_local" | "keep_remote" })
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
                     `<a>` and takes only the paint. It never had an `onClick`
                     and does not get one. `data-mrd` is what carries the
                     Meridian focus ring; the shell root already grants it by
                     descent, and it is written here too because every
                     Meridian control root declares its own, so this one keeps
                     the ring wherever it is dropped. */
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

        <WorkspaceBindingsSection />

        {activeProductId && activeWorkspaceId ? (
          <ProductBindingsSection
            projectId={activeProductId}
            workspaceId={activeWorkspaceId}
            projectName={activeProduct?.name}
          />
        ) : null}

        {/* One door back, and it sits where a person who cannot find their source
          actually needs it, rather than as a breadcrumb at the top left.

          A router `<Link>` renders its own anchor, so this takes the shared face
          rather than becoming a `<button>` that navigates: a middle click, a
          modifier click and the status bar all have to keep working. The default
          face, because that is what it wore, and `runs.index` points the
          mirror-image door here wearing run-parts' `LINK_AS_CONTROL`, which
          holds the same string. */}
        <Actions>
          <Link
            data-mrd=""
            to="/settings"
            search={{ section: "connections" }}
            className={ACTION_LINK_FACE.default}
          >
            Connect another source
          </Link>
        </Actions>

        <Region
          title="Documents in sync"
          sub={
            q.isError || q.isLoading
              ? undefined
              : synced.length === 0
                ? undefined
                : "Each row opens the document in the tool that owns it."
          }
        >
          {q.isError ? (
            <NothingYet>The list needs the read above. Retry it and this fills in.</NothingYet>
          ) : q.isLoading ? (
            <Reading>Reading what is in sync.</Reading>
          ) : synced.length === 0 ? (
            <NothingYet>
              Nothing synced yet. Point a Notion database or a Google Docs folder at this workspace
              above and the documents appear here.
            </NothingYet>
          ) : (
            synced.slice(0, 20).map((m) => {
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
                  // The mark slot on this list was 34px of nothing, and the one
                  // fact it should have carried is which tool owns the document.
                  // Monochrome: the subject of the row is the sync state.
                  marks={<ProviderMark provider={m.provider} />}
                  lead={m.external_id}
                  sub={
                    <>
                      {providerLabel(m.provider)}
                      {" · "}
                      {lastSync ? (
                        <>
                          {verb} <Num>{relTimeCaps(lastSync).toLowerCase()}</Num>
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
            })
          )}
        </Region>

        <WebhookIngest />
      </div>
    </Surface>
  );
}

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
       `aria-expanded` for a toggle and not for a way out. The retired `more` slot
       emitted neither, so a reader who could not see the label change was told
       nothing at all. */
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
        <ReadFailedLine onRetry={() => void q.refetch()}>
          The token did not load. {(q.error as Error)?.message ?? "The read failed."}
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
          {/* QUIET, AND NOT `destructive`, WHICH IS THE ONE THING THIS PORT
              DELIBERATELY DID NOT DECIDE. Revoke does remove something, so
              Meridian's `destructive` face is arguable — but it was `ghost` here,
              and moving a control onto `--mrd-stop` changes what the colour says
              on this surface rather than restating what the old one said. What
              protects it is unchanged and is the part that matters: it sits
              behind a confirm that names what stops. */}
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

      {/* 16px above the example, said here rather than by the box: the retired
          `.sp-pre` baked a 12px top margin in, and Meridian's `Pre` sets none so
          the composition owns the space. 12px straddles `--mrd-s4` (10px) and
          `--mrd-s5` (16px), and the ratchet forbids shrinking as a port answer,
          so it takes the larger stop. A WRAPPER rather than a class on `Pre`,
          which takes no `className` — its own header says a caller "writes
          `mt-mrd-3` where it can be seen", and there is no prop to write it on. */}
      {curlOpen ? (
        <div className="mt-mrd-5">
          <Pre>{curlExample}</Pre>
        </div>
      ) : null}
    </Region>
  );
}
