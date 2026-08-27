/**
 * SUPPORT SIGNALS. Ported onto the primitives, 2026-07-29.
 *
 * WHAT CHANGED, AND WHY.
 *
 * KILL the cluster card. Every theme was a bordered `bento` carrying a
 * decorative dot, the theme, a tinted count pill, up to N truncated ticket
 * subjects and a button, which is a card inside a list inside a panel and three
 * levels of the cardocalypse. A theme is a thing you SCAN, decide is worth
 * opening, and open. So it is a Row: the theme, one different fact under it,
 * and it never wraps.
 *
 * KILL the inline reply drawer. It expanded between two rows, which quietly
 * removes the `.sp-row + .sp-row` divider from whatever followed it, and it put
 * the evidence (the ticket subjects) and the drafted reply in two different
 * places for the same theme. Opening a theme now replaces the list with that
 * theme in full, the same in-place detail the Crew surface uses. The browser's
 * own back is one Escape away because nothing was taken off the screen.
 *
 * KILL the four result strings held in `useState` and rendered as coloured
 * sentences. Adding tickets and running the pass are consequential writes, so
 * each leaves a Receipt carrying what it actually caused, and a failure renders
 * as Failed rather than as a red sentence that reads like a result.
 *
 * HONEST PROVENANCE, which the panel used to drop on the floor. `draftSupportReply`
 * returns `{ ai, reply, reason }` and the old code read only `reply`, so a
 * deterministic template rendered exactly like something an agent wrote. The
 * detail now says which one it is. `templateDraftProvider` is the only wired
 * backend today, so this will say "template" every time, and that is the point:
 * the surface must not promise a permission the wiring lacks.
 */
import { useState } from "react";
import { humanWriteError } from "@/lib/roles.functions";
import { Row } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Textarea } from "@/components/meridian/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  listSupportClusters,
  bulkImportSupportTickets,
  runSupportTriage,
  draftSupportReply,
  type SupportClusterRow,
} from "@/lib/support-triage.functions";
import { Receipt } from "@/components/meridian/Receipt";
import { Prose } from "@/components/meridian/Prose";

/** Plain-words relative time. Mono is applied by the receipt, not here. */
function ago(iso: string): string | null {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type Landed =
  | { at: string; kind: "import"; inserted: number }
  | { at: string; kind: "pass"; themes: number; signals: number; held: number };

export function SupportSignalsPanel() {
  const { activeWorkspace } = useWorkspace();
  const wsId = activeWorkspace?.id ?? null;
  const qc = useQueryClient();

  const fList = useServerFn(listSupportClusters);
  const fImport = useServerFn(bulkImportSupportTickets);
  const fTriage = useServerFn(runSupportTriage);

  const [text, setText] = useState("");
  const [open, setOpen] = useState<SupportClusterRow | null>(null);
  const [landed, setLanded] = useState<Landed[]>([]);

  const clustersQ = useQuery({
    queryKey: ["support-clusters", wsId],
    queryFn: () => fList({ data: { workspaceId: wsId! } }),
    enabled: !!wsId,
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["support-clusters", wsId] });

  const add = useMutation({
    mutationFn: (body: string) =>
      fImport({ data: { workspaceId: wsId!, text: body, source: "paste" } }),
    onSuccess: (r) => {
      setText("");
      setLanded((l) => [
        ...l,
        { at: new Date().toISOString(), kind: "import", inserted: r.inserted },
      ]);
      refresh();
    },
  });

  const pass = useMutation({
    mutationFn: () => fTriage({ data: { workspaceId: wsId! } }),
    onSuccess: (r) => {
      setLanded((l) => [
        ...l,
        {
          at: new Date().toISOString(),
          kind: "pass",
          themes: r.clusters,
          signals: r.signalsEmitted,
          held: r.quarantined,
        },
      ]);
      refresh();
    },
  });

  // One theme open at a time, and it takes the whole panel. A detail that
  // pushes the list down leaves you reading two things at once.
  if (open) {
    return <ThemeDetail cluster={open} workspaceId={wsId} onBack={() => setOpen(null)} />;
  }

  const clusters: SupportClusterRow[] = clustersQ.data?.clusters ?? [];

  return (
    <>
      <Region
        title="Paste what support is hearing"
        sub="One ticket per line. Nothing leaves this workspace until you run the pass."
      >
        <Field label="Tickets, one per line" htmlFor="support-paste">
          <Textarea
            id="support-paste"
            rows={5}
            value={text}
            placeholder="Users cannot export to CSV after the latest update"
            onChange={(e) => setText(e.target.value)}
          />
        </Field>
        <Actions>
          <Action
            variant="primary"
            disabled={!wsId || add.isPending || !text.trim()}
            title={!text.trim() ? "Paste at least one ticket first" : undefined}
            onClick={() => add.mutate(text)}
          >
            {add.isPending ? "Adding" : "Add them"}
          </Action>
          <Action
            disabled={!wsId || pass.isPending}
            onClick={() => pass.mutate()}
            title="Groups what is open into recurring themes and sends each one to Discover"
          >
            {pass.isPending ? "Reading them" : "Find the themes"}
          </Action>
        </Actions>
        {add.isError ? (
          <ReadFailedLine error={add.error}>
            Nothing was imported. The clusters below are as they were.
          </ReadFailedLine>
        ) : null}
        {pass.isError ? (
          <ReadFailedLine error={pass.error}>
            The triage did not run. No signal was reclassified.
          </ReadFailedLine>
        ) : null}
      </Region>

      {/* What each write actually caused, on the surface, in your own voice. */}
      {landed.map((l, i) =>
        l.kind === "import" ? (
          <Receipt
            key={`${l.at}-${i}`}
            verb="You added them"
            time={ago(l.at)}
            consequence={
              <>
                <Num>{l.inserted}</Num> {l.inserted === 1 ? "ticket is" : "tickets are"} waiting.
                Nothing is grouped and nothing has reached Discover until you find the themes.
              </>
            }
          />
        ) : (
          <Receipt
            key={`${l.at}-${i}`}
            verb="You found the themes"
            time={ago(l.at)}
            consequence={
              l.themes === 0 ? (
                <>Nothing repeats yet, so nothing was sent. Add more and run it again.</>
              ) : (
                <>
                  <Num>{l.themes}</Num> {l.themes === 1 ? "theme" : "themes"} repeat, and{" "}
                  <Num>{l.signals}</Num> reached Discover
                  {l.held > 0 ? (
                    <>
                      . <Num>{l.held}</Num> {l.held === 1 ? "was" : "were"} held back, because
                      something in the text tried to give an instruction
                    </>
                  ) : null}
                  .
                </>
              )
            }
          />
        ),
      )}

      <Region
        title="Recurring themes"
        sub="Each one is a signal in Discover, running the same pipeline as any other."
      >
        {!wsId ? (
          <NothingYet>Pick a workspace and its support themes read from there.</NothingYet>
        ) : clustersQ.isLoading ? (
          <Reading>Reading what repeats.</Reading>
        ) : clustersQ.isError ? (
          <ReadFailedLine onRetry={() => void clustersQ.refetch()}>
            {humanWriteError(
              clustersQ.error,
              "The themes did not load, so an empty list here would not mean nothing repeats.",
            )}
          </ReadFailedLine>
        ) : clusters.length === 0 ? (
          <NothingYet>
            Nothing repeats yet. Paste tickets above and find the themes; anything said more than
            once becomes a signal in Discover.
          </NothingYet>
        ) : (
          clusters.map((c) => (
            <Row
              key={c.clusterKey}
              lead={c.theme}
              // The different fact, never a restatement of the theme the lead
              // already carries: how many said it, and whether it got through.
              sub={
                <>
                  <Num>{c.ticketCount}</Num> {c.ticketCount === 1 ? "ticket" : "tickets"}
                  {c.signalId ? (
                    <>
                      {" "}
                      <Value tone="pass">in Discover</Value>
                    </>
                  ) : (
                    <>
                      {" "}
                      <Value>not sent yet</Value>
                    </>
                  )}
                </>
              }
              tight
              onClick={() => setOpen(c)}
            />
          ))
        )}
      </Region>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * One theme, in place
 * ------------------------------------------------------------------ */

function ThemeDetail({
  cluster,
  workspaceId,
  onBack,
}: {
  cluster: SupportClusterRow;
  workspaceId: string | null;
  onBack: () => void;
}) {
  const fDraft = useServerFn(draftSupportReply);
  const q = useQuery({
    queryKey: ["support-reply", workspaceId, cluster.clusterKey],
    queryFn: () => fDraft({ data: { workspaceId: workspaceId!, clusterKey: cluster.clusterKey } }),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });

  const back = (
    <Action variant="quiet" onClick={onBack}>
      All the themes
    </Action>
  );

  return (
    <>
      <Region
        title={cluster.theme}
        sub={
          <>
            <Num>{cluster.ticketCount}</Num> {cluster.ticketCount === 1 ? "person" : "people"} said
            this.{" "}
            {cluster.signalId
              ? "It is a signal in Discover, and the opportunity pipeline has it."
              : "It has not reached Discover yet. Find the themes again to send it."}
          </>
        }
      >
        {cluster.subjects.length === 0 ? (
          <NothingYet>
            No subject lines came through on these tickets, so there is nothing to quote.
          </NothingYet>
        ) : (
          cluster.subjects.map((s, i) => <Row key={`${i}-${s}`} lead={s} tight />)
        )}
      </Region>

      <Region
        title="A reply you could send"
        sub={
          q.data && !q.data.ai
            ? "Assembled from a template, not written by an agent. Read it before you send it."
            : "Read it before you send it."
        }
      >
        {q.isLoading ? (
          <Reading>Assembling it.</Reading>
        ) : q.isError ? (
          <ReadFailedLine onRetry={() => void q.refetch()}>
            {humanWriteError(q.error, "The reply did not assemble.")}
          </ReadFailedLine>
        ) : q.data ? (
          <Prose>
            {q.data.reply.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </Prose>
        ) : null}
      </Region>

      <Region>{back}</Region>
    </>
  );
}
