/**
 * Discover. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so a port would have been an
 * assembly. The five answers, written before the code, so the next session
 * reads a decision instead of guessing at one:
 *
 * 1. WHO IS HERE, AND WHAT DID THEY COME TO DO.
 *    A product lead who has been told the crew read something. They came to
 *    find out what the reading adds up to, and to put the strongest of it into
 *    the queue as a bet. Not to browse quotes.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS FOR.
 *    To turn accumulated evidence into a bet. The cluster is the unit of
 *    decision here: promote one and it lands on Decide as a ranked bet with
 *    its evidence attached. That is the thing you would otherwise have to
 *    assemble by hand from twenty conversations.
 *
 * 3. SIGNALS AND THE QUEUE: ONE JOB OR TWO. Asked, and answered: ONE. The
 *    ranked queue itself lives on /decide since 2026-07-13, and the raw signal
 *    feed is not a second job on this surface either, it is the evidence
 *    behind the cluster in focus. So it moved into the context column, where
 *    it describes the ONE cluster being judged rather than shouting all 200.
 *
 *    KEEP  the clusters, ranked by corroboration. This is where the call is
 *          actually made, and promote / draft spec are the two writes.
 *    KEEP  capture. Sense needs a way in when no connector covers what you
 *          just heard on a call. One box, one button, at the bottom.
 *    KEEP  the cold-start gate (connect a source, or open a sample workspace)
 *          and the live Sense relay line, which is silent unless a run is on.
 *    KILL  the whole SignalFeed panel. A card shell with its own masthead
 *          ("Signals captured" / "Everything sensed, verbatim, from every
 *          source"), a three-mode composer, three verbatim signal cards, a
 *          show-more, and a footer restating the masthead. It was a second
 *          surface stacked on the first, and it is exactly the verbosity the
 *          founder named. Its one irreplaceable part, the verbatim evidence,
 *          is now the context column.
 *    KILL  the AutoClustered panel shell around the clusters: its own header,
 *          its own paragraph of explanation, its own source-filter chip row,
 *          its own show-more, its own drawer. The clusters survive; the
 *          furniture around them does not. A source filter over four rows is
 *          a facet explosion over nothing.
 *    KILL  Market watch (StrategySection). Two more panels side by side, and
 *          neither is this person's job: weekly competitor briefs and a
 *          self-seeding watch list with nothing to decide on it. Read-only by
 *          its own contract. It also half-duplicated /plan.
 *    KILL  per-signal promote / delete / detail sheet. Signal-level CRUD is an
 *          archivist's job, and a single signal promoting straight to a bet
 *          skips the corroboration this whole surface is ranked on.
 *    KILL  the bulk paste mode. One capture control now takes one line or
 *          twenty; a mode toggle for the same job was the assembly.
 *    MOVE  the weekly briefs, which already render on /plan via IntelBriefPanel.
 *    MOVE  the tracked-entity watch list to /engine-room. "What are we
 *          watching, and when was each last checked" is machinery status, and
 *          the doctrine puts machinery behind that door.
 *    MOVE  the queue deep links (?tab=queue, ?tab=opportunities) to /decide,
 *          handled in the route file. They used to land here silently on a
 *          desk with no queue on it, which is a lie to the link.
 *
 * 4. ONE CLICK AWAY. A cluster row is its title plus one different fact (how
 *    many signals, how many sources), and it never wraps. Clicking it makes it
 *    the call in front of you, and only then does its verbatim evidence
 *    appear, in the context column. Promote and the full bet opens on /decide.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is reading four sentences from
 *    four different sources that turn out to be the same complaint, which is
 *    the thing a PM normally spends a week discovering by hand. The confusion
 *    to avoid was the old one: three panels each claiming to be the subject,
 *    so nobody could tell whether the surface wanted them to read, to cluster,
 *    or to decide. There is now one call on screen at a time.
 *
 * VOICE: never greet, always report. The first line is a count that came out
 * of the record, or an honest statement that there is nothing in it yet.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { toast } from "@/lib/notify";
import {
  clusterSignals,
  createSignal,
  generatePrd,
  listSignals,
  listThemes,
  promoteThemeToOpportunity,
} from "@/lib/discovery.functions";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import {
  isSampleWorkspaceEnabled,
  triggerSampleWorkspace,
} from "@/lib/onboarding/onboarding.functions";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Failed,
  Gate,
  Num,
  PageHead,
  Row,
  Surface,
  Textarea,
  type MarkState,
} from "@/components/shell/primitives";
import { signalPreview, withTimeout } from "./format";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

/** The crew that reads for this desk, most relevant first. The fleet already
 * comes back attention-first, so the first one present is the one worth
 * naming in the context column. */
const SENSE_AGENTS = ["discovery-scout", "researcher"];

/** How much evidence the ONE cluster in focus shows before it says "and N
 * more". Four quotes is enough to see the pattern; twelve is a wall. */
const QUOTES_IN_FOCUS = 4;

/** Plain-words relative time, whole phrase, so it never reads "now ago". */
function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The fleet's own words for what an agent is doing, in the mark's words.
 *  State is never a hue; the mark owns that. */
function markState(state: string): MarkState {
  if (state === "working") return "running";
  if (state === "attention") return "gate";
  return "idle";
}

const plural = (n: number) => (n === 1 ? "" : "s");

export function DiscoverSurface() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("sense");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeProductId, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces } =
    useWorkspace();

  const fSignals = useServerFn(listSignals);
  const fThemes = useServerFn(listThemes);
  const fFleet = useServerFn(getAgentFleet);
  const fCluster = useServerFn(clusterSignals);
  const fCreate = useServerFn(createSignal);
  const fPromote = useServerFn(promoteThemeToOpportunity);
  const fDraftSpec = useServerFn(generatePrd);
  const fSampleEnabled = useServerFn(isSampleWorkspaceEnabled);
  const fTriggerSample = useServerFn(triggerSampleWorkspace);

  /** Which cluster is the call in front of you. Same idea as the approvals
   *  queue: exactly one thing asks at a time, the rest are one-line rows. */
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  // Shared cache with FleetView's "By Agent" tab (same queryKey): a cache read
  // here, not a second network call, when both are mounted on one workspace.
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const watcher = fleet.data?.fleet.agents.find((a) => SENSE_AGENTS.includes(a.slug)) ?? null;

  // The same two query keys the rest of the app reads, so react-query dedupes
  // rather than opening a second network call per surface.
  const signals = useQuery({
    queryKey: ["signals", activeProductId],
    queryFn: () => withTimeout(fSignals({ data: { productId: activeProductId } })),
  });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => withTimeout(fThemes({ data: { productId: activeProductId } })),
  });

  const rows = React.useMemo(() => signals.data?.signals ?? [], [signals.data]);
  type SignalRow = (typeof rows)[number];
  const loadError = (signals.error ?? themes.error) as Error | null;
  const loading = signals.isLoading || themes.isLoading;

  /** Ranked by corroboration, strongest first. Same comparator the retired
   *  panel used, so the order a user learned does not change under them. */
  const ranked = React.useMemo(
    () => [...(themes.data?.themes ?? [])].sort((a, b) => b.frequency - a.frequency),
    [themes.data],
  );

  /** Member signals per cluster, grouped from data already in hand. Newest
   *  first, because listSignals returns newest first. */
  const membersByTheme = React.useMemo(() => {
    const map = new Map<string, SignalRow[]>();
    for (const s of rows) {
      if (!s.theme_id) continue;
      const arr = map.get(s.theme_id) ?? [];
      arr.push(s);
      map.set(s.theme_id, arr);
    }
    return map;
  }, [rows]);

  const unclustered = React.useMemo(() => {
    const known = new Set(ranked.map((t) => t.id));
    return rows.filter((s) => !s.theme_id || !known.has(s.theme_id)).length;
  }, [rows, ranked]);

  const signalsEmpty = !loading && !loadError && rows.length === 0;

  // The focus always points at something that exists, and defaults to the
  // strongest cluster, so the surface opens on the call worth making.
  React.useEffect(() => {
    if (ranked.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!ranked.some((t) => t.id === focusedId)) setFocusedId(ranked[0].id);
  }, [ranked, focusedId]);

  const focused = ranked.find((t) => t.id === focusedId) ?? null;
  const focusedMembers: SignalRow[] = focused ? (membersByTheme.get(focused.id) ?? []) : [];
  const focusedSources = [...new Set(focusedMembers.map((s) => s.source))];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["signals"] });
    void qc.invalidateQueries({ queryKey: ["themes"] });
    void qc.invalidateQueries({ queryKey: ["opportunities"] });
  };

  // SW-6 cold start: from an empty desk a user can open a SEPARATE Explore
  // workspace to look around, instead of staring at nothing. It never fills
  // their real workspace with example data. Dormant unless the founder turns
  // SAMPLE_WORKSPACE_ENABLED on. On success we switch the user into it.
  const sampleEnabledQ = useQuery({
    queryKey: ["sample-workspace-enabled"],
    queryFn: () => fSampleEnabled(),
    enabled: signalsEmpty,
  });
  const sampleMutation = useMutation({
    mutationFn: () => fTriggerSample(),
    onSuccess: (res) => {
      refreshWorkspaces();
      const id = (res as { workspaceId?: string | null } | undefined)?.workspaceId;
      if (id) setActiveWorkspaceId(id);
      void qc.invalidateQueries({ queryKey: ["signals"] });
    },
  });
  const sampleOffered = signalsEmpty && (sampleEnabledQ.data?.enabled ?? false);

  // The surface's one write that changes the loop: a cluster becomes a ranked
  // bet, and its evidence travels with it (recordLineageSafe, server side).
  const promote = useMutation({
    mutationFn: (themeId: string) => fPromote({ data: { theme_id: themeId } }),
    onSuccess: () => {
      toast.success("Kept. It is a ranked bet now.", {
        action: { label: "Open Decide", onClick: () => navigate({ to: "/decide" }) },
      });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // The spec brief aggregates every member quote plus the cluster summary,
  // byte-identical to what the retired panel sent, so the drafted spec does
  // not change shape because the surface did.
  const draftSpec = useMutation({
    mutationFn: async (themeId: string) => {
      const theme = ranked.find((t) => t.id === themeId);
      const members = membersByTheme.get(themeId) ?? [];
      const brief = `Theme: ${theme?.title ?? ""}\n${
        theme?.summary ? `Summary: ${theme.summary}\n` : ""
      }Evidence:\n${members.map((m) => `- "${m.content}" (${m.source})`).join("\n")}`.slice(
        0,
        4000,
      );
      const r = await fDraftSpec({ data: { brief } });
      return { id: r.prd.id };
    },
    onSuccess: (r) => {
      toast.success("Spec drafted");
      navigate({ to: "/plan/spec/$id", params: { id: r.id }, search: { tab: "contract" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cluster = useMutation({
    mutationFn: () => fCluster({ data: { productId: activeProductId } }),
    onSuccess: (r) => {
      toast.success(r.message);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // One control, one or many. A single line captures one signal; paste twenty
  // lines and each becomes its own signal. The old surface asked you to pick a
  // mode first, which is a question about our storage, not about your work.
  const capture = useMutation({
    mutationFn: async (text: string) => {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length >= 2)
        .slice(0, 200);
      for (const content of lines) {
        await fCreate({ data: { content, source: "manual", project_id: activeProductId } });
      }
      return lines.length;
    },
    onSuccess: (n) => {
      toast.success(n === 1 ? "Captured." : `${n} signals captured.`);
      setDraft("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const captureReady = draft.trim().length >= 2;

  const headline: React.ReactNode = loading ? (
    "Reading the record."
  ) : loadError ? (
    "The record could not be read."
  ) : rows.length === 0 ? (
    "Nothing has been sensed yet."
  ) : ranked.length === 0 ? (
    <>
      <Num>{rows.length}</Num> signals in, nothing clustered yet.
    </>
  ) : ranked.length === 1 ? (
    "One cluster has formed."
  ) : (
    <>
      <Num>{ranked.length}</Num> clusters have formed.
    </>
  );

  return (
    <Surface
      context={
        watcher || focused ? (
          <>
            {watcher ? (
              <>
                <div className="sp-ctx-head">Reading for you</div>
                <div className="sp-ctx-row">
                  <AgentMark
                    slug={watcher.slug}
                    name={watcher.name}
                    state={markState(watcher.state)}
                  />
                  <span>
                    <span className="sp-ctx-name">
                      {agentDisplayName(watcher.slug, watcher.name)}
                    </span>
                    <span className="sp-ctx-sub">
                      {since(watcher.lastActiveAt) ? (
                        <>
                          last read <Num>{since(watcher.lastActiveAt)}</Num>
                        </>
                      ) : (
                        "has not read anything yet"
                      )}
                    </span>
                  </span>
                </div>
              </>
            ) : null}

            {/* The evidence, and it belongs to the ONE cluster in focus. This
              is what the whole signal feed panel was for; here it is doing
              the job it was actually needed for, verbatim and attributed. */}
            {focused && focusedMembers.length > 0 ? (
              <>
                <div className="sp-ctx-head">What backs this</div>
                {focusedMembers.slice(0, QUOTES_IN_FOCUS).map((s) => (
                  <div className="sp-ctx-row" key={s.id}>
                    <span>
                      <span className="sp-ctx-name">{signalPreview(s.content, 96)}</span>
                      <span className="sp-ctx-sub">
                        {s.source}, <Num>{since(s.created_at)}</Num>
                      </span>
                    </span>
                  </div>
                ))}
                {focusedMembers.length > QUOTES_IN_FOCUS ? (
                  <div className="sp-ctx-body">
                    <Num>{focusedMembers.length - QUOTES_IN_FOCUS}</Num> more say the same thing.
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={
          ranked.length > 0 ? "Ranked by how many separate sources say the same thing." : undefined
        }
      />

      {/* The live line, present only while Sense actually has a run going.
        It renders nothing when the stage is quiet. */}
      <AgentRelay variant="station" station="sense" workspaceId={activeWorkspaceId} />

      {loadError ? (
        <Failed
          onRetry={() => {
            if (signals.error) void signals.refetch();
            if (themes.error) void themes.refetch();
          }}
        >
          {loadError.message}
        </Failed>
      ) : loading ? null : signalsEmpty ? (
        <Gate
          question="Which source should it read first?"
          lines={
            [
              <span key="where">
                Opens Settings, Connections. Reading starts the moment a source is linked.
              </span>,
              sampleOffered ? (
                <span key="sample">
                  The sample opens a separate Explore workspace of labelled example data. Yours
                  stays empty.
                </span>
              ) : null,
              sampleMutation.isError ? (
                <span key="err" className="sp-fail">
                  The sample workspace did not open. Try again.
                </span>
              ) : null,
            ].filter(Boolean) as React.ReactNode[]
          }
        >
          <Button
            variant="primary"
            onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
          >
            Connect a source
          </Button>
          {sampleOffered ? (
            <Button disabled={sampleMutation.isPending} onClick={() => sampleMutation.mutate()}>
              {sampleMutation.isPending ? "Opening the sample" : "Explore a sample workspace"}
            </Button>
          ) : null}
        </Gate>
      ) : focused ? (
        <Gate
          question={focused.title}
          lines={
            [
              <span key="ev">
                <Num>{focused.frequency}</Num> signal{plural(focused.frequency)} from{" "}
                <Num>{focusedSources.length}</Num> source{plural(focusedSources.length)}
                {focusedSources.length > 0 ? `: ${focusedSources.slice(0, 3).join(", ")}` : ""}.
              </span>,
              focused.summary ? <span key="sum">{focused.summary}</span> : null,
              <span key="next">
                It opens on Decide as a ranked bet, and this evidence travels with it.
              </span>,
            ].filter(Boolean) as React.ReactNode[]
          }
        >
          <Button
            variant="primary"
            disabled={promote.isPending}
            onClick={() => promote.mutate(focused.id)}
          >
            {promote.isPending ? "Making it a bet" : "Make it a bet"}
          </Button>
          <Button disabled={draftSpec.isPending} onClick={() => draftSpec.mutate(focused.id)}>
            {draftSpec.isPending ? "Drafting" : "Draft the spec"}
          </Button>
        </Gate>
      ) : (
        <Gate
          question="Nothing has clustered yet."
          lines={[
            <span key="have">
              <Num>{rows.length}</Num> signal{plural(rows.length)} captured and waiting to be read
              together.
            </span>,
            <span key="what">
              Clustering groups the ones saying the same thing, then ranks them by how many separate
              sources agree.
            </span>,
          ]}
        >
          <Button variant="primary" disabled={cluster.isPending} onClick={() => cluster.mutate()}>
            {cluster.isPending ? "Reading them together" : "Cluster them now"}
          </Button>
        </Gate>
      )}

      {/* Everything else that clustered, one line each. The title, and one
        DIFFERENT fact: how much agrees with it. Clicking makes it the call
        in front of you, which is where its evidence appears. */}
      {ranked.length > 1 ? (
        <Block title="Also clustered">
          {ranked
            .map((t, i) => ({ theme: t, rank: i + 1 }))
            .filter(({ theme }) => theme.id !== focusedId)
            .map(({ theme, rank }) => {
              const sources = new Set((membersByTheme.get(theme.id) ?? []).map((s) => s.source))
                .size;
              return (
                <Row
                  key={theme.id}
                  tight
                  marks={<Num>{rank}</Num>}
                  lead={theme.title}
                  sub={`${theme.frequency} signal${plural(theme.frequency)} · ${sources} source${plural(sources)}`}
                  time={since(theme.created_at)}
                  onClick={() => setFocusedId(theme.id)}
                />
              );
            })}
        </Block>
      ) : null}

      {/* Capture is the way in when no connector covers what you just heard.
        One box: one line captures one signal, twenty pasted lines capture
        twenty. The loose count is the only other thing worth saying here,
        and it carries its own action rather than a separate panel. */}
      {!signalsEmpty && !loadError && !loading ? (
        <Block
          title="Capture what you heard"
          // Offered here only once clusters exist. With none, the Gate above
          // IS the cluster call, and two of them would be two subjects.
          more={
            ranked.length > 0 && unclustered > 0
              ? cluster.isPending
                ? "Reading them together"
                : `Cluster the loose ${unclustered}`
              : undefined
          }
          onMore={() => cluster.mutate()}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (captureReady && !capture.isPending) capture.mutate(draft);
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What did you hear, and where from? One per line."
              aria-label="Capture a signal"
              rows={3}
              // The shared control height is sized for one-line controls. A
              // capture box is not one, so it takes its own height and grows
              // by drag rather than scrolling inside 40px.
              style={{ height: "auto", minHeight: 76, padding: "10px 12px", resize: "vertical" }}
            />
            <Actions>
              <Button type="submit" disabled={!captureReady || capture.isPending}>
                {capture.isPending ? "Capturing" : "Capture"}
              </Button>
            </Actions>
          </form>
        </Block>
      ) : null}
    </Surface>
  );
}
