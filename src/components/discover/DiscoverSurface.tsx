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
 * 6. THE MANUAL PASS, 2026-08-02. The station had exactly one way for a person
 *    to put something in: a three-line box that split on newlines. Everything
 *    else they might be holding, a document somebody sent them, a call
 *    transcript, a page of research, had no door here at all. Worse, the box was
 *    hidden behind `!signalsEmpty`, so a brand new workspace was told to connect
 *    a source and given no way to write down the thing it had just heard.
 *
 *    WHAT THIS PASS DID, and it is mostly wiring rather than building:
 *    FIXED the write path. `createSignal` and `bulkImportSignals` built raw
 *          `signals` rows and inserted them, so a hand-captured signal was the
 *          only kind in the product with no `source_kind`, no `external_id`, no
 *          `stage_events` trail and no embedding until the next sweep. Both go
 *          through `writeSignals` now, the same sink every connector uses, via a
 *          pure producer at `src/lib/sources/manual.ts`.
 *    USED  `bulkImportSignals`, which had existed since F3 and which NOTHING in
 *          src/routes or src/components had ever called. The box looped
 *          `createSignal` once per line instead, so forty pasted lines opened
 *          forty sequential requests and a failure halfway left no report of
 *          what had landed. One call now.
 *    ADDED the longer form, in place inside the same Block: a document or a
 *          transcript, named, kept whole as ONE signal, typed in or read out of
 *          a plain-text file. Not a pane, not a drawer, not a slide-over, which
 *          primitives.tsx bans outright and which this is the textbook case for.
 *    ADDED provenance in words. The context column printed `note`,
 *          `pull_connector`, `transcript_action` at a person, which are our
 *          column values. A quote a colleague typed and a quote a connector
 *          pulled at 4am are the same shape on screen and are not the same
 *          level of evidence.
 *    ADDED a Receipt where capture used to fire a toast, and it reports all
 *          three of the sink's counts: what landed, what was already on the
 *          record, and what the injection screen refused.
 *
 *    DELIBERATELY NOT BUILT: PDF and DOCX reading. Nothing in this repo parses
 *    either format, and the honest move is to say so in the composer rather than
 *    accept the file and fail after the upload. The picker offers only formats
 *    that really are text.
 *
 * 7. THE DOORS PASS, 2026-08-02. Founder verdict on the product: "certain cards
 *    are not clickable and details, whatever is required, I feel left out. I
 *    don't know where to find them." This surface was the clearest case: every
 *    fact it showed was true, attributed, and inert.
 *
 *    FIXED a deep link that had been broken for two audits while a comment on
 *          the other end claimed it was repaired. /plan/spec/$id sends
 *          `?focus=<signalId>`; this route's validator returned only `tab`, so
 *          the router discarded the id before render, and nothing here read it
 *          anyway. It resolves to the cluster now, and the quote it named leads
 *          the evidence list.
 *    FIXED the scroll order. The ranking sat under the Gate plus up to two
 *          Record recesses plus a receipt, roughly 570px, so the list this
 *          surface exists to triage against was below the fold on a 1440x900
 *          screen. It now sits directly under the Gate, which is a single
 *          column's version of the split view Linear proves. The full reasoning,
 *          and what the reversal costs, is on the Record below.
 *    ADDED a door on every source in the coverage list, and on the quiet-source
 *          line, which is the most actionable sentence on the page and led
 *          nowhere. Captured-by-hand keeps none: it is not a connector.
 *    ADDED a door on each verbatim quote, to the ticket or thread it was lifted
 *          from. `signals.url` has been on the row since the table was created
 *          and no surface had ever rendered it.
 *    ADDED a door on the precedent Record, to the prior bet's own chain in the
 *          graph, and on the weaker prior-cluster claim, which moves the focus.
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
import { scoreTheme } from "@/lib/brain/score";
import {
  MAX_BODY_CHARS,
  READABLE_EXTENSIONS,
  isReadableFileName,
  typedCandidates,
} from "@/lib/sources/manual";
import {
  attachThemeToOpportunity,
  bulkImportSignals,
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
  Choices,
  CtxBody,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Field,
  Gate,
  Input,
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
import { capturedByHand, signalPreview, sourceLabel, withTimeout } from "./format";
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

export function DiscoverSurface({
  /**
   * WHAT THE LINK NAMED. A signal id (what /plan/spec/$id sends when you click
   * a row under "Why this spec exists") or a theme id. Optional, so every
   * existing link into /discover behaves exactly as it did.
   *
   * It resolves to the CLUSTER, because a single quote is not a call and this
   * surface only ever asks about clusters. The quote itself is then lifted to
   * the top of the evidence list, so the thing the link named is the thing you
   * see rather than something merely related to it.
   */
  focus,
}: {
  focus?: string;
} = {}) {
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
  const fBulk = useServerFn(bulkImportSignals);
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
  /**
   * The longer-form capture, revealed IN PLACE inside the same Block.
   *
   * A note and a document are not two answers to a question about our storage
   * (the box above already takes one line or twenty without asking), they are two
   * different things a person is holding: a sentence they remember, versus a file
   * somebody sent them. The second one needs a name, a body that keeps its
   * paragraphs, and a way to say whether it is a document or a meeting
   * transcript, because that is what the row's provenance will say afterwards.
   *
   * Revealed, never floated: primitives.tsx bans the pane, the drawer and the
   * slide-over, and this is exactly the case its note describes, a lane that
   * wanted one and built the thing in place instead.
   */
  const [bodyOpen, setBodyOpen] = React.useState(false);
  const [bodyKind, setBodyKind] = React.useState<"document" | "transcript">("document");
  const [bodyTitle, setBodyTitle] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  /** What the file picker said, when it had something to say. Never a toast: a
   *  rejected file is a state of this composer, not a passing announcement. */
  const [fileNote, setFileNote] = React.useState<{ text: string; failed: boolean } | null>(null);
  const [fileReading, setFileReading] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement | null>(null);
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
              // HOW MANY PEOPLE SAID IT. Absent until 2026-08-03, which is why a
              // single competitor blog post from 5 days ago sat above 40
              // homeowners reporting the same support burden: frequency was only
              // a tie-break AFTER the score, and floats never tie.
              frequency: t.frequency,
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

  /**
   * WHICH CLUSTER THE LINK MEANT, resolved rather than assumed.
   *
   * Two shapes arrive at `?focus=`: a signal id (the spec page sends one per
   * row) and, for anything that later links a cluster directly, a theme id.
   * Both are resolved here and both are checked against the RANKING, never
   * against the raw table, because a cluster that has been declined or merged
   * is not in front of anybody and focusing it would put the Gate on a call
   * that is already settled.
   *
   * `null` when the id names nothing focusable, which is the honest outcome for
   * a signal that was never clustered, a cluster since judged, or a stale link.
   * The surface then opens on the top of the ranking exactly as before.
   */
  const focusTarget = React.useMemo(() => {
    if (!focus) return null;
    const inRanking = (id: string | null | undefined) =>
      Boolean(id) && ranked.some((r) => r.theme.id === id);
    if (inRanking(focus)) return focus;
    const signal = rows.find((s) => s.id === focus);
    return inRanking(signal?.theme_id) ? (signal!.theme_id as string) : null;
  }, [focus, rows, ranked]);

  /** Honoured ONCE. The deep link decides where you land; the moment you press
   *  a row, you have decided instead, and a link that kept reasserting itself
   *  on every refetch would drag the Gate back off whatever you chose. */
  const focusHonoured = React.useRef(false);

  // The focus always points at something that exists. It opens on what the link
  // named when a link named something, and otherwise on the top-ranked cluster,
  // which is the call worth making.
  React.useEffect(() => {
    if (ranked.length === 0) {
      setFocusedId(null);
      return;
    }
    if (focusTarget && !focusHonoured.current) {
      focusHonoured.current = true;
      setFocusedId(focusTarget);
      return;
    }
    if (!ranked.some((r) => r.theme.id === focusedId)) setFocusedId(ranked[0].theme.id);
  }, [ranked, focusedId, focusTarget]);

  const focusedIndex = ranked.findIndex((r) => r.theme.id === focusedId);
  const focused = focusedIndex >= 0 ? ranked[focusedIndex] : null;
  // Annotated, not inferred. `focused?.members ?? []` is `SignalRow[] | never[]`,
  // a union of two array types, and calling `.map` on a union hands the callback
  // an `unknown` element. Reading the source off a member looked type safe and
  // was not, which is why the provenance line needed the annotation to compile.
  //
  // THE QUOTE THE LINK NAMED LEADS. Only four quotes are drawn before the list
  // says "and N more", so a deep link that landed on the right cluster could
  // still leave the exact sentence somebody clicked invisible underneath the
  // fold of its own evidence list.
  const focusedMembers: SignalRow[] = React.useMemo(() => {
    const members: SignalRow[] = focused?.members ?? [];
    const at = focus ? members.findIndex((s) => s.id === focus) : -1;
    if (at <= 0) return members;
    return [members[at], ...members.slice(0, at), ...members.slice(at + 1)];
  }, [focused, focus]);
  const focusedSources: string[] = [...new Set(focusedMembers.map((s) => s.source))];

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
            {title} is now a ranked bet on Decide, carrying <Num>{carried}</Num> signal
            {plural(carried)} of evidence. The Critic scores it next.
          </>
        ),
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

  /**
   * WHAT A CAPTURE LEFT BEHIND, in the sink's own numbers.
   *
   * `writeSignals` reports three counts and every one of them is a different
   * fact a person needs: what landed, what was already on the record (the
   * external_id dedup, which is why re-uploading a file is safe), and what the
   * injection screen refused to store. Rolling those into one "Captured." was
   * the surface deciding on the user's behalf that two of the three did not
   * happen.
   */
  function captureConsequence(r: {
    inserted: number;
    skipped: number;
    quarantined: number;
  }): React.ReactNode {
    const parts: React.ReactNode[] = [];
    if (r.inserted > 0) {
      parts.push(
        <React.Fragment key="in">
          <Num>{r.inserted}</Num> signal{plural(r.inserted)} joined the record and{" "}
          {r.inserted === 1 ? "is" : "are"} waiting to be read with everything else.
        </React.Fragment>,
      );
    }
    if (r.skipped > 0) {
      parts.push(
        <React.Fragment key="skip">
          <Num>{r.skipped}</Num> {r.skipped === 1 ? "was" : "were"} already on the record, so
          nothing was duplicated.
        </React.Fragment>,
      );
    }
    if (r.quarantined > 0) {
      parts.push(
        <React.Fragment key="quar">
          <Num>{r.quarantined}</Num> {r.quarantined === 1 ? "was" : "were"} refused: the text
          carries instructions aimed at the agents rather than an observation.
        </React.Fragment>,
      );
    }
    if (parts.length === 0) return "Nothing was captured. Every line was too short to be a signal.";
    // Joined here rather than by leading spaces inside each fragment, so a
    // sentence that happens to be the only one never opens with a stray space.
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            {part}
          </React.Fragment>
        ))}
      </>
    );
  }

  // One control, one or many. A single line captures one signal; paste twenty
  // lines and each becomes its own signal. The old surface asked you to pick a
  // mode first, which is a question about our storage, not about your work.
  //
  // ONE ROUND TRIP now, and through a server function that already existed.
  // This looped `createSignal` per line, so pasting forty lines opened forty
  // sequential requests and a failure halfway left twenty captured with no
  // report of which twenty. `bulkImportSignals` has done exactly this job since
  // F3 and nothing in src/routes or src/components had ever called it.
  const capture = useMutation({
    mutationFn: (text: string) =>
      fBulk({
        data: {
          text,
          // The channel token is a fact about the material, not a mode the person
          // picked: one line is a note, many lines is a paste, and the row says so
          // afterwards without anyone having answered a question.
          source: typedCandidates(text).length > 1 ? "paste" : "note",
          project_id: activeProductId,
        },
      }),
    onSuccess: (r) => {
      setReceipt({ verb: "You captured what you heard", consequence: captureConsequence(r) });
      setDraft("");
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({ verb: "Nothing was captured", consequence: e.message, failed: true }),
  });

  /** A document or a transcript: one signal, kept whole, named. */
  const captureBody = useMutation({
    mutationFn: () =>
      fCreate({
        data: {
          content: bodyText,
          kind: bodyKind,
          source: bodyKind,
          title: bodyTitle.trim() || undefined,
          project_id: activeProductId,
        },
      }),
    onSuccess: (r) => {
      const noun = bodyKind === "transcript" ? "transcript" : "document";
      // THREE OUTCOMES, THREE SENTENCES. The sink can store it, recognise it as
      // one it already holds, or refuse it at the injection screen, and calling
      // the third one "added" would be the surface reporting a write that never
      // happened. The refusal is not a failure of the person, so it does not
      // wear the failed treatment; it is a fact about the file.
      const verb =
        r.inserted > 0
          ? `You added a ${noun}`
          : r.quarantined > 0
            ? `That ${noun} was not stored`
            : `That ${noun} was already here`;
      setReceipt({
        verb,
        consequence: (
          <>
            {captureConsequence(r)}
            {r.dropped > 0 ? (
              <>
                {" "}
                It ran <Num>{r.dropped}</Num> characters past what one signal holds, and that tail
                was not stored.
              </>
            ) : null}
          </>
        ),
      });
      // The composer only closes on a real write. A refusal or a duplicate leaves
      // the text exactly where it is, because closing it would throw away the
      // thing the person still has to decide what to do with.
      if (r.inserted > 0) {
        setBodyOpen(false);
        setBodyTitle("");
        setBodyText("");
        setFileNote(null);
      }
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: `The ${bodyKind === "transcript" ? "transcript" : "document"} was not added`,
        consequence: e.message,
        failed: true,
      }),
  });

  /**
   * Read a plain-text file into the composer rather than uploading it.
   *
   * The text becomes the body a person can still edit, which is the honest shape
   * given what this repo can actually parse: there is no PDF or DOCX reader
   * anywhere in it, so the picker offers only formats that really are text, and
   * says so when something else is chosen instead of failing after the fact.
   */
  async function readFile(file: File) {
    setFileNote(null);
    if (!isReadableFileName(file.name)) {
      setFileNote({
        text: `${file.name} is not a format this can read yet. Plain text works: ${READABLE_EXTENSIONS.join(", ")}. For a PDF or a Word file, open it and paste the text in.`,
        failed: true,
      });
      return;
    }
    setFileReading(true);
    try {
      const text = await file.text();
      if (!text.trim()) {
        setFileNote({ text: `${file.name} has no text in it.`, failed: true });
        return;
      }
      setBodyText(text.slice(0, MAX_BODY_CHARS));
      if (!bodyTitle.trim()) setBodyTitle(file.name.replace(/\.[^.]+$/, ""));
      setFileNote({
        text:
          text.length > MAX_BODY_CHARS
            ? `Read ${file.name}, and kept the first ${MAX_BODY_CHARS.toLocaleString()} characters. Edit it before you capture.`
            : `Read ${file.name}. Edit it before you capture.`,
        failed: false,
      });
    } catch (e) {
      setFileNote({
        text: `${file.name} could not be read. ${(e as Error).message || "The browser refused it."}`,
        failed: true,
      });
    } finally {
      setFileReading(false);
    }
  }

  const captureReady = draft.trim().length >= 2;
  const bodyReady = bodyText.trim().length >= 2;
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
      // The longer capture composer closes on Escape too, so a person who
      // opened it by mistake is never stuck reaching for the mouse.
      if (e.key === "Escape" && bodyOpen) {
        e.preventDefault();
        setBodyOpen(false);
        setFileNote(null);
        return;
      }
      /**
       * THE COMPOSER SUSPENDS THE TRIAGE KEYBOARD, and this is a correctness
       * guard rather than a nicety.
       *
       * The exclusion above only covers INPUT, TEXTAREA, SELECT and
       * contenteditable. The composer also holds BUTTONS: the kind picker (a
       * radio group that owns the arrow keys itself), the file chooser, the
       * submit. With focus on any of them, "3" reached this handler and
       * declined whatever cluster happened to be in front of you, and an arrow
       * key both moved the radio group and moved the ranking. A destructive
       * disposition fired from a form that has nothing to do with disposition
       * is the exact class of defect a digit-key surface has to be sure about.
       */
      if (!focused || busy || picking || bodyOpen) return;

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
  }, [focused, focusedIndex, ranked, busy, picking, bodyOpen, promote, decline]);

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
                  /* The readable name, not the column value. `getSenseCoverage`
                     groups on `source_kind || source`, so this list used to read
                     "pull_connector" and "manual" at a person, which are our
                     words for our lanes and nobody else's words for anything. */
                  name={sourceLabel(s.source)}
                  title={
                    capturedByHand(s.source)
                      ? s.source
                      : "Open this source in Settings, Connections"
                  }
                  /* THE DOOR TO THE CONNECTOR. A row here says a source has gone
                     quiet, which is the most actionable fact in the column, and
                     it led nowhere: the only way to act on it was to remember
                     that connectors live three clicks away in Settings.

                     The grouping key rides along as `?connector=`. Settings
                     already resolves that against the provider registry and
                     falls back to the list for anything it does not recognise,
                     which is exactly right here: the key is a LANE token
                     ("pull_connector") for anything the sink stamped and a
                     provider token ("github") for the older rows, so the link
                     lands on the connector when we can name it and on the
                     connector list when we cannot.

                     Captured by hand is not a connector and gets no door.
                     Its way in is the capture box on this same page, and
                     pointing it at Connections would be a promise the
                     destination cannot keep. */
                  onClick={
                    capturedByHand(s.source)
                      ? undefined
                      : () =>
                          navigate({
                            to: "/settings",
                            search: { section: "connections", connector: s.source },
                          })
                  }
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
              {/* THE MOST ACTIONABLE LINE ON THE PAGE, and it was a paragraph.
                A source that used to deliver and has stopped is the one fact
                here that says DO SOMETHING, and it said it with no way to do
                anything. It names which sources went quiet on its second line,
                because "3 sources" and "GitHub, Intercom, Zendesk" are
                different facts and only the second one tells you whether to
                care. */}
              {cov.quietCount > 0 ? (
                <CtxRow
                  name={
                    <>
                      <Num>{cov.quietCount}</Num> source{plural(cov.quietCount)} used to deliver and
                      has not this week
                    </>
                  }
                  sub={cov.sources
                    .filter((s) => s.quiet)
                    .map((s) => sourceLabel(s.source))
                    .join(", ")}
                  title="Open Connections in Settings"
                  onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
                />
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
                  /* THE QUOTE OPENS THE THING IT CAME FROM. `signals.url` has
                     held the ticket, the thread or the review this sentence was
                     lifted out of since the table was created, and no surface
                     ever rendered it, so the evidence under a call was a wall of
                     quotes you had to take on trust. A new tab rather than a
                     navigation: the address belongs to somebody else's product,
                     and leaving triage to read one comment loses the queue.

                     A signal with no url keeps no door, which is most hand
                     captured ones: there is nowhere to send you, and a row that
                     lights up and does nothing is the defect this whole pass is
                     about. */
                  title={s.url ? `Open the source: ${s.url}` : undefined}
                  onClick={
                    s.url
                      ? () => window.open(s.url as string, "_blank", "noopener,noreferrer")
                      : undefined
                  }
                  /* WHERE THIS ONE CAME FROM, in words. A quote a colleague
                     typed by hand and a quote a connector pulled at 4am are the
                     same shape on screen and are not the same level of
                     evidence, and the raw token ("note", "pull_connector") was
                     our column value rather than a sentence. */
                  sub={
                    <>
                      {sourceLabel(s.source, s.source_kind)}
                      {capturedByHand(s.source, s.source_kind) ? "" : ", sensed"},{" "}
                      <Num>{since(s.created_at)}</Num>
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
              /* The other honest answer, and it is right below this. Without
                 saying so, the empty desk reads as though a connector is the
                 only way in, which has never been true. */
              <span key="hand">
                Or capture it yourself below: a note, a pasted list, a document, a transcript.
                Nothing has to be connected first.
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
                {focusedSources.length > 0
                  ? `: ${focusedSources
                      .slice(0, 3)
                      .map((s) => sourceLabel(s))
                      .join(", ")}`
                  : ""}
                .
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
          <Button disabled={busy} shortcut="3" onClick={() => decline.mutate(focused.theme.id)}>
            Not a pattern
          </Button>
          <MoreMenu label={`More for ${focused.theme.title}`}>
            <MoreItem onClick={() => draftSpec.mutate(focused.theme.id)}>
              {draftSpec.isPending ? "Drafting the spec" : "Draft the spec directly"}
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

      {/* What your last judgment caused. One at a time, and it survives until
        the next one, so the surface never erases the trace of a decision.

        IT STAYS WELDED TO THE GATE. The reorder below moved the ranking up
        past the Record recess; the receipt did not travel with it, because a
        receipt reports what the buttons directly above it just did, and a
        receipt six rows away from the control that caused it is a receipt
        nobody reads. It costs one line of height and only after you act. */}
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

      {/* THE RECORD SPEAKING, and it belongs here as much as on /decide.
        cluster.server.ts already embeds every theme and scores it against
        decision memory and prior themes; until now nothing rendered the answer.
        Catching a repeat while it is still a cluster costs nothing.

        IT SITS UNDER THE RANKING NOW, and that is a reversal of the earlier
        note here, made deliberately and for a measured reason. The old
        placement put the Gate, then up to two recesses, then a receipt above
        the list: roughly 570px before the first cluster row, which at 1440x900
        with the top bar and the spine strip is the whole viewport. So the
        surface's PRIMARY job, comparing this call against the ones around it,
        was below the fold on every screen, which is the opposite of the triage
        pattern this file names as its reference. Linear puts the list beside
        the item; a single column's version of beside is directly under.

        What the reversal costs is that the recess is now one short scroll away
        rather than immediately visible, and that is the cheaper loss: the
        warning matters at the moment of disposition, and the disposition
        buttons are still on the Gate above it, still reached by keys 1, 2 and
        3, and the recess still moves with the focus. What the old order cost
        was a person not knowing there was a ranking at all.

        Kept as the one lit surface, and NOT moved into the context rail, which
        would demote the single differentiated moment in the product to a
        statistic. */}
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
              /* THE PRIOR BET OPENS. The strongest sentence on the surface named
                 a bet you already made and gave you no way to go and look at
                 it, which is the exact gap Record's own onClick was added for.

                 The graph, not the queue, and the difference is honest rather
                 than convenient: a bet with an outcome attached has usually
                 shipped or been dropped, so it is no longer IN the ranked queue
                 on /decide, and sending someone to a list that does not contain
                 the thing they clicked is a worse dead end than no link at all.
                 The knowledge graph focuses any lineage node by kind and id,
                 `opportunity` is one of its declared kinds, and what it draws is
                 the bet with everything that led to it and everything that came
                 out of it, which is what "go and look at that one" means here.

                 Precedent that carries no opportunity id keeps no door. */
              title={p.opportunityId ? "Open that bet and its chain" : undefined}
              onClick={
                p.opportunityId
                  ? () =>
                      navigate({
                        to: "/brain",
                        search: {
                          tab: "graph",
                          focusKind: "opportunity",
                          focusId: p.opportunityId as string,
                        },
                      })
                  : undefined
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
        same sentence as "here is how it went".

        It opens the earlier cluster the same way a row does, by moving the
        focus, and ONLY when that cluster is still in the ranking. A prior
        cluster that has since been declined or merged is not a call anybody
        can make, so naming it stays a fact and never becomes a promise. */}
      {focused && !picking && seenBefore.length === 0 && priorTheme ? (
        <Record
          evidence={<>clustered separately</>}
          title={
            ranked.some((r) => r.theme.id === priorTheme.id)
              ? "Put that earlier cluster in front of you"
              : undefined
          }
          onClick={
            ranked.some((r) => r.theme.id === priorTheme.id)
              ? () => setFocusedId(priorTheme.id)
              : undefined
          }
        >
          This closely repeats an earlier cluster, {priorTheme.title}.
        </Record>
      ) : null}

      {/* Capture is the way in when no connector covers what you just heard.
        One box: one line captures one signal, twenty pasted lines capture
        twenty. The loose count is the only other thing worth saying here,
        and it carries its own action rather than a separate panel.

        NOW OFFERED ON AN EMPTY DESK TOO. It used to be hidden behind
        `!signalsEmpty`, so the first thing a new workspace saw was a Gate
        saying "connect a source" and no way at all to write down the thing
        they had just been told on a call. A product whose whole promise is
        that evidence compounds cannot make the first piece of evidence
        unreachable, and "wait for a connector" is not an answer to "I heard
        something ten minutes ago".

        LONGER MATERIAL HAS ITS OWN DOOR, revealed in this same Block. A file
        or a transcript needs a name and a body that keeps its paragraphs, and
        it is one signal rather than one per line, which the box above cannot
        express without lying about what it is doing. */}
      {!loadError && !loading && !picking ? (
        <Block
          title="Capture what you heard"
          sub={
            signalsEmpty
              ? "Nothing is connected yet, and you do not have to wait for that. Write down what you already know."
              : undefined
          }
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
              // Held at the same ceiling the server enforces, so a very long
              // paste is trimmed while it is still editable rather than coming
              // back as a validation error after the round trip.
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY_CHARS))}
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
              {/* The door to the longer form. It is a toggle rather than a
                second panel, and it says which state it is in, so it is never
                a control that opens something you cannot close. */}
              <Button
                aria-expanded={bodyOpen}
                onClick={() => {
                  setBodyOpen((v) => !v);
                  setFileNote(null);
                }}
              >
                {bodyOpen ? "Close the longer one" : "Add a document or transcript"}
              </Button>
            </Actions>
          </form>

          {bodyOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (bodyReady && !captureBody.isPending) captureBody.mutate();
              }}
            >
              {/* WHAT IT IS, and this is not a question about our storage: a
                meeting transcript and a written document are different kinds
                of evidence, they read differently, and the row afterwards says
                which one it was. Two options, so it is the words themselves
                rather than a select.

                A Line rather than a Field, for the reason Line's own contract
                states: Field renders a real `<label>` around its children, and
                a label wrapping a radio group of buttons makes the label text a
                second way to fire the first button. Choices carries its own
                accessible name instead. */}
              <Line label="What you are adding">
                <Choices
                  label="What you are adding"
                  value={bodyKind}
                  onPick={(id) => setBodyKind(id)}
                  options={[
                    { id: "document" as const, label: "A document" },
                    { id: "transcript" as const, label: "A transcript" },
                  ]}
                />
              </Line>

              <Field label="What to call it" htmlFor="capture-body-title">
                <Input
                  id="capture-body-title"
                  value={bodyTitle}
                  onChange={(e) => setBodyTitle(e.target.value)}
                  placeholder={
                    bodyKind === "transcript"
                      ? "Churn call with Northwind, March 4"
                      : "Q3 research readout"
                  }
                  maxLength={200}
                />
              </Field>

              <Field label="The text itself" htmlFor="capture-body-text">
                <Textarea
                  id="capture-body-text"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value.slice(0, MAX_BODY_CHARS))}
                  placeholder={
                    bodyKind === "transcript"
                      ? "Paste the transcript, or choose a file below."
                      : "Write it here, paste it, or choose a file below."
                  }
                  rows={8}
                  style={{
                    height: "auto",
                    minHeight: 168,
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </Field>

              {/* The file picker. A bare file input is unstyleable and reads as
                a different product, so the button is the affordance and the
                input is the mechanism. It is still a real input, so the
                keyboard and assistive tech reach it through the button. */}
              <input
                ref={fileInput}
                type="file"
                accept={READABLE_EXTENSIONS.join(",")}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // Cleared so choosing the same file twice fires again.
                  e.target.value = "";
                  if (file) void readFile(file);
                }}
              />

              {/* The file is an alternative way to FILL the box above, not a
                second way to submit, so it sits with the field it fills rather
                than in the action row. The sub line is the one place this
                surface admits a limit: naming the formats it cannot read is
                what stops a person picking a PDF and finding out afterwards.
                A rejected file replaces that sentence in place, because a
                refusal is a state of this composer and not an announcement
                that erases itself while you are still looking for it. */}
              <Line
                label="Or read it in from a file"
                sub={
                  fileNote ? (
                    <span className={fileNote.failed ? "sp-fail" : undefined}>{fileNote.text}</span>
                  ) : (
                    <>
                      Plain text only: {READABLE_EXTENSIONS.join(", ")}. A PDF or a Word file has to
                      be opened and pasted, because nothing here can read one yet.
                    </>
                  )
                }
              >
                <Button disabled={fileReading} onClick={() => fileInput.current?.click()}>
                  {fileReading ? "Reading the file" : "Choose a file"}
                </Button>
              </Line>

              <Actions
                trailing={
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setBodyOpen(false);
                      setBodyTitle("");
                      setBodyText("");
                      setFileNote(null);
                    }}
                  >
                    Discard it
                  </Button>
                }
              >
                <Button type="submit" disabled={!bodyReady || captureBody.isPending}>
                  {captureBody.isPending
                    ? "Capturing"
                    : bodyKind === "transcript"
                      ? "Capture the transcript"
                      : "Capture the document"}
                </Button>
              </Actions>
            </form>
          ) : null}
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
