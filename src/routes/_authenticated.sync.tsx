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
import { Gate } from "@/components/meridian/Gate";
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

export const Route = createFileRoute("/_authenticated/sync")({
  component: SyncPage,
  head: () => ({ meta: [{ title: "Sync · Supaprod" }] }),
  // Deep-link target for the honest doors to this surface: /sync?conflict=<id>
  // lands on the conflict and floats it to the top of the list.
  validateSearch: (search: Record<string, unknown>): { conflict?: string } =>
    typeof search.conflict === "string" && search.conflict.length > 0
      ? { conflict: search.conflict }
      : {},
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

/** Human name for a provider enum (google_docs -> Google Docs). */
function providerLabel(p: string): string {
  return CONNECTOR_REGISTRY[p as ProviderId]?.label ?? p.replace(/_/g, " ");
}

/** The three providers whose adapters implement a real two-way document sync.
 *  Everything else reads one way, and says so rather than drawing two buttons
 *  that would fail. */
const TWO_WAY = new Set(["google_docs", "notion", "linear"]);

function SyncPage() {
  const qc = useQueryClient();
  const { conflict: followedConflictId } = Route.useSearch();
  const { activeProductId, activeWorkspaceId, activeProduct } = useWorkspace();
  const fList = useServerFn(listSyncMappings);
  const fResolve = useServerFn(resolveSyncConflict);
  const fPull = useServerFn(pullMapping);
  const fPush = useServerFn(pushMapping);

  const q = useQuery({ queryKey: ["sync-mappings"], queryFn: () => fList() });
  const mappings = (q.data?.mappings ?? []) as Mapping[];
  const allConflicts = mappings.filter((m) => m.conflict);
  const synced = mappings.filter((m) => !m.conflict);

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

  const head = q.isError
    ? "The sync state did not load, so nothing below is the whole picture."
    : q.isLoading
      ? "Reading what is in sync."
      : conflicts.length > 0
        ? `${conflicts.length} ${conflicts.length === 1 ? "document was" : "documents were"} edited on both sides and need you to say which copy wins.`
        : synced.length > 0
          ? `Nothing is waiting on you. ${synced.length} ${synced.length === 1 ? "document agrees" : "documents agree"} with the copy in the tool that owns it.`
          : "Nothing is syncing yet. Point a source at something below and the documents start flowing.";

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
            <Gate
              key={m.id}
              question={`Which copy of ${m.external_id} wins?`}
              lines={[
                <>
                  Both sides changed since the last sync. Supaprod is on version{" "}
                  {/* `raw`: a version is an identifier, not a quantity. Grouped,
                      a four-digit version reads as a count of things. */}
                  <Num raw>{m.version_local}</Num>, {providerLabel(m.provider)} is on version{" "}
                  <Num raw>{m.version_remote}</Num>.
                </>,
              ]}
            >
              {/* Neither copy is inherently right, so neither button is primary.
                The Gate itself is the emphasis. */}
              <Action
                busy={mResolve.isPending}
                onClick={() => mResolve.mutate({ id: m.id, strategy: "keep_local" })}
              >
                Keep the Supaprod copy
              </Action>
              <Action
                busy={mResolve.isPending}
                onClick={() => mResolve.mutate({ id: m.id, strategy: "keep_remote" })}
              >
                Keep the {providerLabel(m.provider)} copy
              </Action>
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
                /* THE ONE CONTROL IN THIS GATE THAT LEAVES THE APP, so it stays
                 an `<a>` and takes only the paint. It never had an `onClick`
                 and does not get one. `data-mrd` is what carries the Meridian
                 focus ring; the shell root already grants it by descent, and
                 it is written here too because every Meridian control root
                 declares its own, so this one keeps the ring wherever it is
                 dropped. */
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
            </Gate>
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
