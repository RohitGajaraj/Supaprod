/**
 * Discover. The depth pass, 2026-08-01.
 *
 * The 2026-07-30 pass got the SHAPE right (one call in focus, evidence in the
 * context column, no competing panels) and stopped there. What it left is a
 * station with one verb on it. This pass gives it the other three, shows the
 * five scored dimensions the database was already holding, and makes the
 * surface stop promising something the write did not keep.
 *
 * REFERENCE, NAMED BEFORE BUILDING (founder ruling 2026-08-01: lift the proven
 * pattern rather than invent one). A cluster is structurally an issue group, so
 * the model is SENTRY'S ISSUE STREAM crossed with LINEAR'S TRIAGE INBOX:
 *   - Sentry: raw events group into an issue; the row carries volume, distinct
 *     users, first seen, last seen and a state the SYSTEM can move on its own.
 *     "Users affected" is a separate number from "events" because 40 reports
 *     from one account and 40 from 40 accounts are the same volume and the
 *     opposite decision.
 *   - Linear: one item in focus with the queue still scannable beside it, and
 *     DIGIT KEYS are dispositions (1 keep, 2 merge, 3 decline), letters are
 *     properties. That split is why its triage feels fast.
 *   - Productboard: the most common real outcome is "this is more evidence for
 *     something already in flight", which had no expression here at all.
 *
 * DELIBERATELY NOT LIFTED, and the reason matters. None of those products puts
 * a numeric confidence score on an auto-generated cluster; Enterpret says so
 * outright and substitutes explainability. So `themes.confidence` stays off
 * this surface. A percentage invites an argument about the percentage. The
 * evidence and the ability to undo are what a person actually acts on.
 *
 * 1. WHO IS HERE, AND WHAT THEY CAME TO DO. A product lead who has been told
 *    the crew read something. The 2026-07-30 header said they came "to put the
 *    strongest of it into the queue as a bet", and that was optimistic: they
 *    came to TRIAGE. Most clusters are noise, a duplicate, or more weight for a
 *    bet already running. Promotion is the rare terminal case, and building the
 *    surface around the rare case is what made it shallow.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS FOR. To turn accumulated evidence into a
 *    judgment, and to leave the judgment on the record whichever way it went. A
 *    record that only holds the yeses is a highlight reel.
 *
 * 3. WHAT THIS PASS ADDED, and what was already here.
 *    FIXED the surface's own broken promise. The Gate said "this evidence
 *          travels with it" and only ONE theme -> opportunity lineage edge was
 *          written, so /decide showed a stale integer and the walk back could
 *          not reach a single quote. promoteThemeToOpportunity now writes an
 *          edge per member signal, and carries the theme's product scope, which
 *          it also dropped.
 *    ADDED the brain, on the surface that computes it. cluster.server.ts calls
 *          computeNovelty on every insert and stores the basis on the row, and
 *          none of it was ever rendered. The Record now speaks here, one
 *          station EARLIER than /decide, because killing a repeat at Discover
 *          costs nothing and killing it at Decide has already spent a critic
 *          run and a person's attention.
 *    ADDED the ranking the repo already wrote. brain/score.ts is a pure, tested
 *          severity x recency x novelty function. The surface sorted on raw
 *          `frequency`, which is the one dimension that says nothing about
 *          whether a thing is new or urgent.
 *    ADDED distinct sources as a first-class number beside volume, per Sentry.
 *    ADDED decline and merge, with digit keys, and a Receipt for each.
 *    ADDED source coverage, which closes a genuine asymmetry: an AGENT has had
 *          `sources.status` since 2026-06-30 and the human standing on the
 *          surface those signals feed had no equivalent anywhere in the product.
 *    KEPT  every 2026-07-30 decision. The SignalFeed panel stays dead, market
 *          watch stays gone, capture stays one box, and the queue deep links
 *          still redirect to /decide. Those were right.
 *
 * 4. ONE CLICK AWAY. A row is its title and one different fact, and it never
 *    wraps. Focus moves with the arrow keys and the list stays on screen, which
 *    is the whole point of triage: you judge this cluster relative to the ones
 *    around it, so a modal or a full-page detail would break the comparison.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is the record saying "you
 *    decided this in March and it missed" while the thing is still a cluster
 *    and not yet a bet. The confusion to avoid is a wall of scores: five
 *    numbers per row is not depth, it is a spreadsheet, and the founder's
 *    complaint about scatter is exactly that failure one step later.
 *
 * KNOWN NEXT STEP, recorded rather than pretended. Sentry's archive is
 * CONDITIONAL ("until it escalates / until N users are affected") and ours is
 * not, because a dismissed cluster here can never grow: clusterSignalsCore only
 * ever reads signals with a null theme_id and creates NEW themes, so nothing
 * joins an existing one and `last_signal_at` is frozen at creation. Conditional
 * decline is the right design and it is blocked on re-clustering into existing
 * themes, not on this surface.
 *
 * VOICE: never greet, always report. The first line is a count that came out of
 * the record, or an honest statement that there is nothing in it yet.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { toast } from "@/lib/notify";
import { scoreTheme } from "@/lib/brain/score";
import {
  attachThemeToOpportunity,
  clusterSignals,
  createSignal,
  generatePrd,
  getSenseCoverage,
  getThemePrecedent,
  getWorkspaceClusterSettings,
  listOpportunities,
  listSignals,
  listThemes,
  promoteThemeToOpportunity,
  setThemeStatus,
  toggleAutoCluster,
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
  CtxBody,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Gate,
  Line,
  MoreItem,
  MoreMenu,
  Num,
  PageHead,
  Receipt,
  Record,
  Row,
  Surface,
  Switch,
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

/** How many sources the coverage line names before it counts the rest. */
const SOURCES_IN_CONTEXT = 5;

/** How much of the ranking is on screen before it asks. Six is roughly one
 *  screen beside the gate; past that the surface becomes a scroll, which is the
 *  complaint this cap exists to answer. */
const VISIBLE_CLUSTERS = 6;

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

/**
 * Novelty as a CLAIM, never as a percentage.
 *
 * `themes.novelty` is a 0..1 remap of cosine similarity against decision memory
 * and prior themes, computed at cluster time. Printing "0.34" would be printing
 * our own arithmetic at someone; the useful reading is the sentence it implies,
 * and the receipt behind it is the Record below the Gate.
 */
function noveltyClaim(novelty: number | null | undefined): string | null {
  if (typeof novelty !== "number") return null;
  if (novelty >= 0.75) return "new to this workspace";
  if (novelty >= 0.4) return "close to something on the record";
  return "the record has seen this before";
}

type ReceiptState = {
  verb: string;
  consequence: React.ReactNode;
  handoff?: { slug: string | null; name?: string | null } | null;
  failed?: boolean;
};

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
  const fCoverage = useServerFn(getSenseCoverage);
  const fPrecedent = useServerFn(getThemePrecedent);
  const fSetStatus = useServerFn(setThemeStatus);
  const fAttach = useServerFn(attachThemeToOpportunity);
  const fOpportunities = useServerFn(listOpportunities);
  const fClusterSettings = useServerFn(getWorkspaceClusterSettings);
  const fToggleAuto = useServerFn(toggleAutoCluster);

  /** Which cluster is the call in front of you. Same idea as the approvals
   *  queue: exactly one thing asks at a time, the rest are one-line rows. */
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  /** The merge picker, opened IN PLACE rather than in a pane. primitives.tsx
   *  bans the slide-over and says a lane that wanted one built its detail view
   *  in place instead, "and that is the better surface". */
  const [picking, setPicking] = React.useState(false);
  /** Whether the whole ranking is on screen, or the first six of it. */
  const [showAllClusters, setShowAllClusters] = React.useState(false);
  /** What the last judgment caused. Replaces the success toast the surface used
   *  to fire, per anti-slop.md §5: a toast confirms the click registered, a
   *  Receipt renders what the click DID. */
  const [receipt, setReceipt] = React.useState<ReceiptState | null>(null);

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
  const coverage = useQuery({
    queryKey: ["sense-coverage", activeProductId],
    queryFn: () => fCoverage({ data: { productId: activeProductId } }),
  });

  /** This station's boundary. RLS scopes the read to a workspace the caller
   *  owns, so `is_owner` false simply means the line is not theirs to set and
   *  it is not drawn. */
  const clusterSettings = useQuery({
    queryKey: ["cluster-settings", activeWorkspaceId],
    queryFn: () => fClusterSettings(),
  });

  const autoSense = useMutation({
    mutationFn: (enabled: boolean) => fToggleAuto({ data: { enabled } }),
    onSuccess: (_r, enabled) => {
      // A boundary change is a write with a consequence, so it earns a Receipt
      // like every other write on this surface. The consequence is what the
      // boundary now lets through, never "Saved".
      setReceipt({
        verb: enabled ? "You let it read on its own" : "You took the reading back",
        consequence: enabled
          ? "New signals cluster without waiting for you. Nothing is promoted without you."
          : "Nothing clusters until you press the button yourself.",
      });
      void qc.invalidateQueries({ queryKey: ["cluster-settings"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "The boundary did not move", consequence: e.message, failed: true }),
  });

  const rows = React.useMemo(() => signals.data?.signals ?? [], [signals.data]);
  type SignalRow = (typeof rows)[number];
  const loadError = (signals.error ?? themes.error) as Error | null;
  const loading = signals.isLoading || themes.isLoading;

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

  /**
   * Ranked by the brain's own score, not by raw volume.
   *
   * `scoreTheme` is severity x recency x novelty-vs-memory, pure and unit
   * tested, and it existed for a month while this surface sorted on
   * `b.frequency - a.frequency`. Volume is the one dimension that cannot tell
   * you whether a thing is urgent or whether you already answered it.
   *
   * `nowMs` is hoisted out of the comparator so every row is scored against one
   * instant; scoring inside the sort would compare rows against slightly
   * different clocks and is not a stable ordering.
   *
   * Dismissed and merged clusters leave the ranking. They are not deleted and
   * their evidence is untouched; they have simply been judged.
   */
  const ranked = React.useMemo(() => {
    const all = themes.data?.themes ?? [];
    const nowMs = Date.now();
    return all
      .filter((t) => {
        const st = (t.status ?? "new") as string;
        return st !== "dismissed" && st !== "merged";
      })
      .map((t) => {
        const members = membersByTheme.get(t.id) ?? [];
        // The newest member we actually hold beats the stored column, which
        // cluster.server.ts writes once at creation and never updates.
        const lastAt = members[0]?.created_at ?? t.last_signal_at ?? t.created_at;
        return {
          theme: t,
          members,
          lastAt,
          sources: new Set(members.map((s) => s.source)).size,
          score: scoreTheme(
            {
              severity: t.severity,
              confidence: t.confidence,
              createdAt: t.created_at,
              lastSignalAt: lastAt,
              novelty: t.novelty,
            },
            nowMs,
          ),
        };
      })
      .sort((a, b) => b.score - a.score || b.theme.frequency - a.theme.frequency);
  }, [themes.data, membersByTheme]);

  const unclustered = React.useMemo(() => {
    const known = new Set((themes.data?.themes ?? []).map((t) => t.id));
    return rows.filter((s) => !s.theme_id || !known.has(s.theme_id)).length;
  }, [rows, themes.data]);

  const signalsEmpty = !loading && !loadError && rows.length === 0;

  // The focus always points at something that exists, and defaults to the
  // top-ranked cluster, so the surface opens on the call worth making.
  React.useEffect(() => {
    if (ranked.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!ranked.some((r) => r.theme.id === focusedId)) setFocusedId(ranked[0].theme.id);
  }, [ranked, focusedId]);

  const focusedIndex = ranked.findIndex((r) => r.theme.id === focusedId);
  const focused = focusedIndex >= 0 ? ranked[focusedIndex] : null;
  const focusedMembers = focused?.members ?? [];
  const focusedSources = focused ? [...new Set(focusedMembers.map((s) => s.source))] : [];

  /**
   * What the record already knows about the cluster in focus.
   *
   * Enabled only when something is focused, and keyed on the theme, so moving
   * the focus is one cheap read rather than a refetch of the whole surface. The
   * server function is fail-safe by contract, so a quiet brain renders nothing
   * rather than erroring a surface whose main job still works.
   */
  const precedent = useQuery({
    queryKey: ["theme-precedent", focused?.theme.id],
    queryFn: () => fPrecedent({ data: { theme_id: focused!.theme.id } }),
    enabled: Boolean(focused?.theme.id),
    staleTime: 5 * 60_000,
  });

  /** The open bets, read only while the merge picker is up. */
  const opportunities = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => fOpportunities(),
    enabled: picking,
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["signals"] });
    void qc.invalidateQueries({ queryKey: ["themes"] });
    void qc.invalidateQueries({ queryKey: ["opportunities"] });
    void qc.invalidateQueries({ queryKey: ["sense-coverage"] });
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

  // ---- The three dispositions. Digits, per Linear: mutually exclusive,
  // terminal, one keystroke. Each one renders what it caused. ----

  const promote = useMutation({
    mutationFn: (themeId: string) => fPromote({ data: { theme_id: themeId } }),
    onSuccess: (res, themeId) => {
      const title = ranked.find((r) => r.theme.id === themeId)?.theme.title ?? "the cluster";
      const carried = (res as { evidence?: number } | undefined)?.evidence ?? 0;
      setReceipt({
        verb: "You kept it",
        consequence: (
          <>
            {title} is a ranked bet, carrying <Num>{carried}</Num> signal{plural(carried)} of
            evidence.
          </>
        ),
        // The Critic genuinely picks it up inside promoteThemeToOpportunity, so
        // the arrow points at something real. Never an arrow to nowhere.
        handoff: { slug: "critic", name: "Critic" },
      });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not go through", consequence: e.message, failed: true }),
  });

  const decline = useMutation({
    mutationFn: (themeId: string) =>
      fSetStatus({ data: { theme_id: themeId, status: "dismissed" } }),
    onSuccess: (_r, themeId) => {
      const title = ranked.find((r) => r.theme.id === themeId)?.theme.title ?? "the cluster";
      setReceipt({
        verb: "You said it is not a pattern",
        consequence: (
          <>{title} left the ranking. Its evidence is still on the record, and the call is too.</>
        ),
      });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not go through", consequence: e.message, failed: true }),
  });

  const attach = useMutation({
    mutationFn: (v: { themeId: string; oppId: string }) =>
      fAttach({ data: { theme_id: v.themeId, opportunity_id: v.oppId } }),
    onSuccess: (res) => {
      const r = res as { opportunity: { id: string; title: string }; evidence: number };
      setPicking(false);
      setReceipt({
        verb: "You merged it",
        consequence: (
          <>
            <Num>{r.evidence}</Num> signal{plural(r.evidence)} now back {r.opportunity.title}.
          </>
        ),
      });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not go through", consequence: e.message, failed: true }),
  });

  // The spec brief aggregates every member quote plus the cluster summary,
  // byte-identical to what the retired panel sent, so the drafted spec does
  // not change shape because the surface did.
  const draftSpec = useMutation({
    mutationFn: async (themeId: string) => {
      const entry = ranked.find((r) => r.theme.id === themeId);
      const brief = `Theme: ${entry?.theme.title ?? ""}\n${
        entry?.theme.summary ? `Summary: ${entry.theme.summary}\n` : ""
      }Evidence:\n${(entry?.members ?? []).map((m) => `- "${m.content}" (${m.source})`).join("\n")}`.slice(
        0,
        4000,
      );
      const r = await fDraftSpec({ data: { brief } });
      return { id: r.prd.id };
    },
    onSuccess: (r) => {
      navigate({ to: "/plan/spec/$id", params: { id: r.id }, search: { tab: "contract" } });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not go through", consequence: e.message, failed: true }),
  });

  const cluster = useMutation({
    mutationFn: () => fCluster({ data: { productId: activeProductId } }),
    onSuccess: (r) => {
      setReceipt({ verb: "You ran the reading", consequence: r.message });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not go through", consequence: e.message, failed: true }),
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
  const busy = promote.isPending || decline.isPending || attach.isPending;

  /**
   * The triage keyboard. Digits dispose, arrows move, Escape backs out.
   *
   * Guarded against every field on the surface, because the capture box is a
   * textarea sitting on the same screen and a person typing "1 more thing" must
   * not promote a bet. `metaKey`/`ctrlKey`/`altKey` are excluded so browser and
   * OS shortcuts keep working.
   */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape" && picking) {
        e.preventDefault();
        setPicking(false);
        return;
      }
      if (!focused || busy || picking) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = ranked[Math.min(focusedIndex + 1, ranked.length - 1)];
        if (next) setFocusedId(next.theme.id);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = ranked[Math.max(focusedIndex - 1, 0)];
        if (prev) setFocusedId(prev.theme.id);
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        promote.mutate(focused.theme.id);
      } else if (e.key === "2") {
        e.preventDefault();
        setPicking(true);
      } else if (e.key === "3") {
        e.preventDefault();
        decline.mutate(focused.theme.id);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focused, focusedIndex, ranked, busy, picking, promote, decline]);

  const headline: React.ReactNode = loading ? (
    "Discover"
  ) : loadError ? (
    "The record could not be read."
  ) : rows.length === 0 ? (
    "Nothing has been sensed yet."
  ) : ranked.length === 0 ? (
    <>
      <Num>{rows.length}</Num> signals in, nothing waiting on a call.
    </>
  ) : ranked.length === 1 ? (
    "One cluster is waiting on a call."
  ) : (
    <>
      <Num>{ranked.length}</Num> clusters are waiting on a call.
    </>
  );

  const cov = coverage.data;
  const claim = noveltyClaim(focused?.theme.novelty);
  const seenBefore = precedent.data?.precedent ?? [];
  const priorTheme = precedent.data?.priorTheme ?? null;

  return (
    <Surface
      context={
        <>
          {watcher ? (
            <>
              <CtxHead>Reading for you</CtxHead>
              <CtxRow
                mark={
                  <AgentMark
                    slug={watcher.slug}
                    name={watcher.name}
                    state={markState(watcher.state)}
                  />
                }
                name={agentDisplayName(watcher.slug, watcher.name)}
                sub={
                  since(watcher.lastActiveAt) ? (
                    <>
                      last read <Num>{since(watcher.lastActiveAt)}</Num>
                    </>
                  ) : (
                    "has not read anything yet"
                  )
                }
              />
            </>
          ) : null}

          {/* WHAT IS FEEDING THIS DESK. The agent has had `sources.status`
            since 2026-06-30 and the person reading its output had nothing.
            A ranking is only as trustworthy as the intake behind it, and a
            source that has gone quiet is invisible unless something says so. */}
          {cov && cov.sources.length > 0 ? (
            <>
              <CtxHead>What is feeding this</CtxHead>
              {cov.sources.slice(0, SOURCES_IN_CONTEXT).map((s) => (
                <CtxRow
                  key={s.source}
                  name={s.source}
                  sub={
                    s.quiet ? (
                      <>
                        quiet for <Num>7d</Num>, sent <Num>{s.prior}</Num> before that
                      </>
                    ) : (
                      <>
                        <Num>{s.recent}</Num> in <Num>7d</Num>
                        {s.lastAt ? (
                          <>
                            , last <Num>{since(s.lastAt)}</Num>
                          </>
                        ) : null}
                      </>
                    )
                  }
                />
              ))}
              {cov.sources.length > SOURCES_IN_CONTEXT ? (
                <CtxBody>
                  <Num>{cov.sources.length - SOURCES_IN_CONTEXT}</Num> more source
                  {plural(cov.sources.length - SOURCES_IN_CONTEXT)}.
                </CtxBody>
              ) : null}
              {cov.quietCount > 0 ? (
                <CtxBody>
                  <Num>{cov.quietCount}</Num> source{plural(cov.quietCount)} used to deliver and has
                  not this week.
                </CtxBody>
              ) : null}
            </>
          ) : null}

          {/* The evidence, and it belongs to the ONE cluster in focus. This
            is what the whole signal feed panel was for; here it is doing
            the job it was actually needed for, verbatim and attributed. */}
          {focused && focusedMembers.length > 0 ? (
            <>
              <CtxHead>What backs this</CtxHead>
              {focusedMembers.slice(0, QUOTES_IN_FOCUS).map((s) => (
                <CtxRow
                  key={s.id}
                  name={signalPreview(s.content, 96)}
                  sub={
                    <>
                      {s.source}, <Num>{since(s.created_at)}</Num>
                    </>
                  }
                />
              ))}
              {focusedMembers.length > QUOTES_IN_FOCUS ? (
                <CtxBody>
                  <Num>{focusedMembers.length - QUOTES_IN_FOCUS}</Num> more say the same thing.
                </CtxBody>
              ) : null}
            </>
          ) : null}
        </>
      }
    >
      <PageHead
        title={headline}
        sub={
          ranked.length > 0
            ? "Ordered by how severe, how recent, and how new to the record each one is."
            : undefined
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
      ) : picking && focused ? (
        /* THE MERGE PICKER, in place. Productboard's link-to-feature move: the
           most common real outcome is that a cluster is more weight for a bet
           already running, not a new one. Opened over the Gate rather than
           beside it, because it is the same one question in a different mode. */
        <Gate
          question="Which bet does this belong to?"
          lines={[
            <span key="what">
              Its <Num>{focused.theme.frequency}</Num> signal{plural(focused.theme.frequency)} will
              back that bet instead of starting a new one.
            </span>,
          ]}
        >
          <Button onClick={() => setPicking(false)}>Never mind</Button>
        </Gate>
      ) : focused ? (
        <Gate
          question={focused.theme.title}
          lines={
            [
              /* WHICH ONE OF THEM THIS IS. The other half of keeping the
                 selected row in the list: the row says where you are in the
                 ranking, this says the Gate is showing that row. Without it the
                 headline counts clusters and the Gate names one, and nothing
                 tells you how the two relate. Suppressed when there is only one,
                 because "1 of 1" is a fact about nothing. */
              ranked.length > 1 ? (
                <span key="rank">
                  <Num>{focusedIndex + 1}</Num> of <Num>{ranked.length}</Num> in the ranking.
                </span>
              ) : null,
              /* Volume and distinct sources are two numbers because they are two
                 facts. Sentry keeps "events" and "users affected" apart for the
                 same reason: one loud account and a broad pattern read the same
                 by volume and are opposite decisions. */
              <span key="ev">
                <Num>{focused.theme.frequency}</Num> signal{plural(focused.theme.frequency)} from{" "}
                <Num>{focusedSources.length}</Num> separate source
                {plural(focusedSources.length)}
                {focusedSources.length > 0 ? `: ${focusedSources.slice(0, 3).join(", ")}` : ""}.
              </span>,
              <span key="when">
                First heard <Num>{since(focused.theme.created_at)}</Num>, most recently{" "}
                <Num>{since(focused.lastAt)}</Num>
                {claim ? `, and it is ${claim}` : ""}.
              </span>,
              focused.theme.summary ? <span key="sum">{focused.theme.summary}</span> : null,
            ].filter(Boolean) as React.ReactNode[]
          }
        >
          <Button
            variant="primary"
            disabled={busy}
            shortcut="1"
            onClick={() => promote.mutate(focused.theme.id)}
          >
            {promote.isPending ? "Making it a bet" : "Make it a bet"}
          </Button>
          <Button disabled={busy} shortcut="2" onClick={() => setPicking(true)}>
            Add to an existing bet
          </Button>
          <MoreMenu label={`More for ${focused.theme.title}`}>
            <MoreItem onClick={() => decline.mutate(focused.theme.id)}>Not a pattern (3)</MoreItem>
            <MoreItem onClick={() => draftSpec.mutate(focused.theme.id)}>
              {draftSpec.isPending ? "Drafting the spec" : "Draft the spec"}
            </MoreItem>
          </MoreMenu>
        </Gate>
      ) : (
        <Gate
          question="Nothing is waiting on a call."
          lines={[
            <span key="have">
              <Num>{rows.length}</Num> signal{plural(rows.length)} captured
              {unclustered > 0 ? (
                <>
                  , <Num>{unclustered}</Num> of them not yet read together
                </>
              ) : null}
              .
            </span>,
            <span key="what">
              Clustering groups the ones saying the same thing, then ranks them by how severe, how
              recent, and how new to the record each one is.
            </span>,
          ]}
        >
          <Button variant="primary" disabled={cluster.isPending} onClick={() => cluster.mutate()}>
            {cluster.isPending ? "Reading them together" : "Cluster them now"}
          </Button>
        </Gate>
      )}

      {/* THE RECORD SPEAKING, and it belongs here as much as on /decide.
        cluster.server.ts already embeds every theme and scores it against
        decision memory and prior themes; until now nothing rendered the
        answer. Catching a repeat while it is still a cluster costs nothing.
        Kept directly under the Gate, the placement /decide proved: a side
        rail would demote the one differentiated moment to a statistic. */}
      {focused && !picking && seenBefore.length > 0
        ? seenBefore.slice(0, 2).map((p) => (
            <Record
              key={p.id}
              evidence={
                <>
                  {p.verdict === "validated"
                    ? "it paid off"
                    : p.verdict === "missed"
                      ? "it did not pay off"
                      : "the result was mixed"}
                </>
              }
            >
              {p.title ? (
                <>
                  You have reasoned this way before, on {p.title}, and {p.summary}
                </>
              ) : (
                p.summary
              )}
            </Record>
          ))
        : null}

      {/* The weaker claim, and only when there is no outcome to show instead.
        "You have clustered this shape before" is worth saying and is not the
        same sentence as "here is how it went". */}
      {focused && !picking && seenBefore.length === 0 && priorTheme ? (
        <Record evidence={<>clustered separately</>}>
          This closely repeats an earlier cluster, {priorTheme.title}.
        </Record>
      ) : null}

      {/* What your last judgment caused. One at a time, and it survives until
        the next one, so the surface never erases the trace of a decision. */}
      {receipt ? (
        <Receipt
          verb={receipt.verb}
          consequence={receipt.consequence}
          handoff={receipt.handoff}
          failed={receipt.failed}
        />
      ) : null}

      {/* The bets a cluster can be merged into. Rendered only in picker mode,
        so the surface still shows one question at a time. */}
      {picking && focused ? (
        <Block title="Open bets">
          {opportunities.isLoading ? (
            <Empty>Reading the queue.</Empty>
          ) : (opportunities.data?.opportunities ?? []).length === 0 ? (
            <Empty>
              There are no bets yet, so there is nothing to merge into. Keeping it makes the first
              one.
            </Empty>
          ) : (
            (opportunities.data?.opportunities ?? [])
              .filter((o) => o.status !== "shipped" && o.status !== "dropped")
              .slice(0, 12)
              .map((o) => (
                <Row
                  key={o.id}
                  tight
                  lead={o.title}
                  sub={o.status ?? "backlog"}
                  onClick={() => attach.mutate({ themeId: focused.theme.id, oppId: o.id })}
                />
              ))
          )}
        </Block>
      ) : null}

      {/* The ranking, one line each: the title, and the facts that differ
        between them. Clicking makes it the call in front of you.

        THE SELECTED ROW STAYS IN THE LIST (founder, 2026-08-01: "when I click
        on any bets the top section changes... somewhere that distinction needs
        to be there that it's getting changed and this is what it is"). An
        earlier version filtered the focused cluster OUT, so the Gate changed
        under you with nothing on screen connecting it to the row you pressed,
        and the list silently renumbered. Keeping it in place and marked is how
        Linear's split view reads, and `Row` already carries `focused`, so this
        costs one prop and no new component. The rank on the Gate is the other
        half: it says WHICH of the ranking you are looking at.

        CAPPED AND EXPANDABLE (founder, same message: "it says twenty three
        bets, and below if I see there are only five or six... should we give
        something like see more"). It was the inverse here, uncapped, so a
        workspace with thirty clusters was thirty rows of scroll, which is the
        scatter complaint one step later. Six, then ask. */}
      {!picking && ranked.length > 1 ? (
        <Block
          title="The ranking"
          more={
            ranked.length > VISIBLE_CLUSTERS
              ? showAllClusters
                ? "Show fewer"
                : `Show all ${ranked.length}`
              : undefined
          }
          onMore={() => setShowAllClusters((v) => !v)}
        >
          {(showAllClusters ? ranked : ranked.slice(0, VISIBLE_CLUSTERS)).map((entry, i) => (
            <Row
              key={entry.theme.id}
              tight
              focused={entry.theme.id === focusedId}
              marks={<Num>{i + 1}</Num>}
              lead={entry.theme.title}
              sub={`${entry.theme.frequency} signal${plural(entry.theme.frequency)} · ${entry.sources} source${plural(entry.sources)}`}
              time={since(entry.lastAt)}
              onClick={() => setFocusedId(entry.theme.id)}
            />
          ))}
          {!showAllClusters && ranked.length > VISIBLE_CLUSTERS ? (
            <CtxBody>
              <Num>{ranked.length - VISIBLE_CLUSTERS}</Num> more below the fold.
            </CtxBody>
          ) : null}
        </Block>
      ) : null}

      {/* Capture is the way in when no connector covers what you just heard.
        One box: one line captures one signal, twenty pasted lines capture
        twenty. The loose count is the only other thing worth saying here,
        and it carries its own action rather than a separate panel. */}
      {!signalsEmpty && !loadError && !loading && !picking ? (
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

      {/* THE BOUNDARY FOR THIS STATION, and it belongs on the station rather
        than three clicks away in Settings.

        GOVERNANCE-PRINCIPLE.md, the founder ruling this obeys: "policy is set
        in advance and does not block", and "the machinery already exists; it
        needs promoting from a settings page to the centre of the product."
        This is the literal case it names. `toggleAutoCluster` and
        `getWorkspaceClusterSettings` have existed since the F3 work, the
        `cluster-tick` cron reads the flag every tick, and NOTHING in src/routes
        or src/components ever called either one. Unattended sensing was built
        end to end and the human had no switch anywhere in the product.

        It is one line with a switch on the end, not a panel, because a boundary
        is a sentence you set once. It does not block anything, and the second
        line reports what the boundary has actually been doing rather than
        restating the first (hard ban 10). */}
      {clusterSettings.data?.is_owner && !picking && !loading && !loadError ? (
        <Block title="The boundary">
          {/* No `htmlFor`: Switch renders a `<button role="switch">`, and
            Line's own contract says a label pointing at a button makes the
            label a second way to fire it. The Switch carries its own
            accessible name instead. */}
          <Line
            label="Read new signals without asking"
            sub={
              clusterSettings.data.enabled ? (
                clusterSettings.data.last_run_at ? (
                  <>
                    On. Last read <Num>{since(clusterSettings.data.last_run_at)}</Num>, and it
                    clusters without waiting for you.
                  </>
                ) : (
                  "On. It has not had a batch to read yet."
                )
              ) : (
                "Off, so nothing clusters until you press the button yourself."
              )
            }
          >
            <Switch
              checked={clusterSettings.data.enabled}
              onChange={(next) => autoSense.mutate(next)}
              label="Read new signals without asking"
              disabled={autoSense.isPending}
            />
          </Line>
        </Block>
      ) : null}
    </Surface>
  );
}
