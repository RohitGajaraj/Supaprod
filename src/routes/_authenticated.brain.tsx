/**
 * Brain. What the record already knows.
 *
 * The prototype does not draw this surface, so it is not a re-skin. It is
 * redesigned from the person standing on it, per
 * docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md. The five answers,
 * written before the code, so the next session reads a decision and not an
 * assembly:
 *
 * 1. WHO IS HERE, AND WHAT DID THEY COME TO DO.
 *    A PM about to make a call, or about to defend one they made, who wants to
 *    know what this workspace already settled: was this decided before, what
 *    happened the last time we tried it, where is the standing brief. One task:
 *    recall, with the receipt attached.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Finding what the workspace already knows before you decide again. Without
 *    it you ask people, or you re-derive it, or you repeat a miss. Everything
 *    else on this page either serves that or was removed.
 *
 * 3. EVERY ELEMENT, KEEP / MOVE / KILL.
 *    KEPT, because the recall happens here:
 *      DecisionsPanel + DecisionDetail  the ledger of calls, and its drill.
 *      CompoundingPanel + LearningDetail  what the outcome taught, with cause.
 *      MemoryList  what the crew will recall on the next run. /memory redirects
 *        here, so this is its only home.
 *      MemoryReviewQueue  behind a click ("Add to the record"). Its queue half
 *        duplicates Approvals, but its composer is the ONLY way a human writes
 *        to memory by hand, and this is where you would look for it.
 *      BriefPanel, DocsPanel  the standing written record.
 *      GraphPanel  how it all connects, with the focus drill intact.
 *      MemoryUpgradeNudge  free memory fades; that is a real constraint on the
 *        very thing you are reading, stated where it bites. Free tier only.
 *      The substrate counts  behind one disclosure, because they are inventory,
 *        not recall.
 *    MOVED, and NOT moved by this file (another agent owns the destination):
 *      InsightsPanel        -> /analytics. Charts over getBrainInsights. A
 *                              dashboard, not recall.
 *      ImpactLedgerPanel    -> /learn, which already renders getImpactLedger
 *                              with the same copy and download. The /impact
 *                              stub currently redirects to /brain?tab=insights
 *                              and must be re-pointed.
 *      ChangelogPanel       -> /ship. The /changelog stub redirects here and
 *                              must be re-pointed.
 *      AnnouncementsPanel   -> /ship. Authoring and publishing outbound is an
 *                              act, not a record.
 *      ShipHistoryPanel     -> /ship or Runs. Completed runs are Runs' subject.
 *      CapabilitiesPanel    -> /crew or Settings. It edits agent instructions
 *                              and toggles skills: configuration, not memory.
 *    KILLED:
 *      The PageHeader hero  sold the surface ("Your product's brain.", plus a
 *        marketing line) and put ember on a heading. Ember marks the human.
 *      BrainStatTrio  the same getImpactLedger read as ImpactLedgerPanel, in
 *        retired Geist Pixel, headed by a raw ICE number.
 *      PlaybookProposalsPanel  a pending human decision. approvals-queue
 *        already sources playbook_proposals; a decision belongs to one place.
 *      PresenceChip and AgentRelay  a live line for one agent on a surface
 *        about the past. The shell draws the live line now.
 *      The seven-count card, the pulsing dot, "Ask reads all of this when it
 *        answers you"  a boast and a duplicate. Three counts that map to the
 *        three doors stay in the head; the other six are one click down.
 *      The four tab descriptions  a third paragraph explaining four one-word
 *        labels.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    The rest of the substrate (chat threads, signals, meetings, specs, saved
 *    notes, live connections), the memory composer and its pending queue, every
 *    decision's evidence (?decision=), every learning's full record
 *    (?learning=), and every graph node's history. The surface itself is a
 *    title, one thing the record has to say, four doors, and one list.
 *
 * 5. DELIGHT, AND CONFUSION.
 *    The moment: you open Brain and the record speaks first. The newest
 *    re-scored call sits in the lit recess, in its own words, with the priority
 *    it moved and the day it moved, and one click opens the whole learning.
 *    That is the product's claim made literal, and it is drawn only when it is
 *    true. The confusion this avoided: twenty stacked panels across four tabs,
 *    where every answer looked equally important and none of them was the one
 *    you came for.
 *
 * UNCHANGED: the route contract. Four tabs, every legacy tab id still resolving
 * through LEGACY_TABS, the ?decision= / ?learning= / ?focusKind= / ?focusId=
 * drills, and every query key, which are shared caches with Today, Learn and
 * the panels themselves.
 */
import { lazy, Suspense, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MemoryUpgradeNudge } from "@/components/billing/MemoryUpgradeNudge";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { getCompounding } from "@/lib/today.functions";
import {
  Block,
  Button,
  Empty,
  Num,
  PageHead,
  Record as RecordRecess,
  Surface,
} from "@/components/shell/primitives";

// Every tab panel is code-split: only the active tab's module loads.
const MemoryList = lazy(() =>
  import("@/components/memory/MemoryList").then((m) => ({ default: m.MemoryList })),
);
const MemoryReviewQueue = lazy(() =>
  import("@/components/memory/MemoryReviewQueue").then((m) => ({ default: m.MemoryReviewQueue })),
);
const CompoundingPanel = lazy(() =>
  import("@/components/knowledge/CompoundingPanel").then((m) => ({
    default: m.CompoundingPanel,
  })),
);
const LearningDetail = lazy(() =>
  import("@/components/knowledge/LearningDetail").then((m) => ({ default: m.LearningDetail })),
);
const DecisionsPanel = lazy(() =>
  import("@/components/knowledge/DecisionsPanel").then((m) => ({ default: m.DecisionsPanel })),
);
const DecisionDetail = lazy(() =>
  import("@/components/knowledge/DecisionDetail").then((m) => ({ default: m.DecisionDetail })),
);
const BriefPanel = lazy(() =>
  import("@/components/knowledge/BriefPanel").then((m) => ({ default: m.BriefPanel })),
);
const GraphPanel = lazy(() =>
  import("@/components/knowledge/GraphPanel").then((m) => ({ default: m.GraphPanel })),
);
const DocsPanel = lazy(() =>
  import("@/components/knowledge/DocsPanel").then((m) => ({ default: m.DocsPanel })),
);

type Tab = "decisions" | "learnings" | "docs" | "graph";
const TABS: Tab[] = ["decisions", "learnings", "docs", "graph"];

// Deep-link honesty: every tab id that ever existed still lands somewhere
// true. Insights, impact, judgment, recall and calendar fold into Decisions
// (calendar's meetings themselves moved to Today's PM Desk); the agent memory
// tab folds into Learnings; brief, design, changelog and capabilities fold
// into Docs.
type LegacyTab =
  | "insights"
  | "impact"
  | "judgment"
  | "recall"
  | "calendar"
  | "memory"
  | "brief"
  | "design"
  | "changelog"
  | "capabilities";
const LEGACY_TABS: Record<LegacyTab, Tab> = {
  insights: "decisions",
  impact: "decisions",
  judgment: "decisions",
  recall: "decisions",
  calendar: "decisions",
  memory: "learnings",
  brief: "docs",
  design: "docs",
  changelog: "docs",
  capabilities: "docs",
};

const TAB_LABEL: Record<Tab, string> = {
  decisions: "Decisions",
  learnings: "Learnings",
  docs: "Docs",
  graph: "Graph",
};

/** One collapsed door. Depth is a click away, never stacked on the surface. */
function Disclosure({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <Block>
      <Button
        variant="ghost"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        style={{ marginLeft: "calc(var(--sp-space-4) * -1)" }}
      >
        <Chevron
          size={15}
          strokeWidth={1.6}
          aria-hidden="true"
          style={{ marginRight: 7, flexShrink: 0 }}
        />
        {label}
      </Button>
      {open ? (
        <div id={id} style={{ marginTop: "var(--sp-space-3)" }}>
          {children}
        </div>
      ) : null}
    </Block>
  );
}

/** The Suspense fallback. Static, not a shimmer: it holds the height so the
 *  page does not jump, and motion in this system confirms rather than fills. */
function TabSkeleton() {
  const bar = (h: number, w?: string) => (
    <div
      aria-hidden="true"
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: "var(--sp-radius-card)",
        background: "var(--sp-lift)",
      }}
    />
  );
  return (
    <div
      role="status"
      style={{ display: "flex", flexDirection: "column", gap: "var(--sp-space-3)" }}
    >
      <span className="sr-only">Reading the record.</span>
      {bar(56)}
      {bar(96)}
      {bar(96, "72%")}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/brain")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    // The TYPE union keeps every legacy id so out-of-surface links and the
    // redirect stubs still compile; the RUNTIME value is always one of the
    // four tabs (or undefined, which the page reads as Decisions). `meeting`
    // stays in the type for the same reason; meetings render on Today now.
    tab?: Tab | LegacyTab;
    meeting?: string;
    decision?: string;
    learning?: string;
    focusKind?: string;
    focusId?: string;
  } => {
    const raw = typeof search.tab === "string" ? search.tab : "";
    const tab: Tab | undefined = (TABS as string[]).includes(raw)
      ? (raw as Tab)
      : LEGACY_TABS[raw as LegacyTab];
    return {
      tab,
      meeting: typeof search.meeting === "string" ? search.meeting : undefined,
      decision: typeof search.decision === "string" ? search.decision : undefined,
      learning: typeof search.learning === "string" ? search.learning : undefined,
      focusKind: typeof search.focusKind === "string" ? search.focusKind : undefined,
      focusId: typeof search.focusId === "string" ? search.focusId : undefined,
    };
  },
  component: MemoryPage,
  head: () => ({ meta: [{ title: "Brain · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface wide>
      <PageHead title="The record did not load." sub="Nothing it holds is lost." />
      <Block>
        <Empty>{(error as Error)?.message ?? "The read failed."}</Empty>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
  notFoundComponent: () => (
    <Surface wide>
      <PageHead
        title="That record is not here."
        sub="It was removed, or the link points at something that never existed."
      />
      <Block>
        <Empty>Everything the record holds is behind the four doors on Brain.</Empty>
        <Button variant="primary" onClick={() => window.location.assign("/brain")}>
          Open the record
        </Button>
      </Block>
    </Surface>
  ),
});

/** The first line is a fact, assembled from counts that are real or absent.
 *  A count that did not load contributes no clause, and never a zero. */
function recordHeadline(calls: number | null, learnings: number | null, loading: boolean): string {
  if (calls === null && learnings === null) {
    return loading ? "Reading the record." : "The record did not load.";
  }
  const clauses: string[] = [];
  if (calls) clauses.push(calls === 1 ? "one call" : `${calls} calls`);
  if (learnings) clauses.push(learnings === 1 ? "one learning" : `${learnings} learnings`);
  if (clauses.length === 0) return "Nothing is on the record yet.";
  const verb = clauses.length === 1 && clauses[0].startsWith("one ") ? "is" : "are";
  const sentence = `${clauses.join(" and ")} ${verb} on the record.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** "9 Jun 2026". Absent rather than guessed when the stamp is unreadable. */
function day(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** What the record says about the newest call an outcome re-ranked. A claim in
 *  the record's own words, never a statistic dressed as one. */
function verdictLine(verdict: "validated" | "missed" | "mixed", subject: string): string {
  if (verdict === "validated") return `${subject} paid off.`;
  if (verdict === "missed") return `${subject} did not pay off.`;
  return `${subject} came back mixed.`;
}

function MemoryPage() {
  const search = Route.useSearch();
  // validateSearch already normalized legacy ids at parse time, so the
  // runtime value here is always one of the four tabs (or absent).
  const tab: Tab = (search.tab as Tab | undefined) ?? "decisions";
  const { decision, learning, focusKind, focusId } = search;
  const navigate = useNavigate({ from: "/brain" });
  const { activeWorkspaceId } = useWorkspace();

  const fBrain = useServerFn(getBrainStatus);
  const brain = useQuery({
    // Workspace-scoped counts: the key carries the workspace so a switch
    // refetches, and the fn narrows the counts server-side.
    queryKey: ["brain-status", activeWorkspaceId],
    queryFn: () => fBrain({ data: { workspaceId: activeWorkspaceId } }),
  });
  const fStats = useServerFn(getCompanyBrainStats);
  const stats = useQuery({
    queryKey: ["company-brain-stats", activeWorkspaceId],
    queryFn: () => fStats({ data: { workspaceId: activeWorkspaceId } }),
  });
  // The record speaking. Same key as CompoundingPanel and Today, so this is a
  // cache read on any session that has touched either, not a second call.
  const fCompounding = useServerFn(getCompounding);
  const compounding = useQuery({
    queryKey: ["compounding"],
    queryFn: () => fCompounding(),
  });

  // Fresh search object: every drill param clears on a tab switch.
  const setTab = (next: Tab) => navigate({ search: { tab: next } });

  const counts = brain.data?.counts ?? null;
  const learningCount = stats.data?.learnings ?? null;
  const countsLoading = brain.isLoading || stats.isLoading;
  const countsFailed = (brain.isError || stats.isError) && !counts && learningCount === null;
  const headline = recordHeadline(counts?.decisions ?? null, learningCount, countsLoading);
  const lastAdded = day(brain.data?.latest);
  const emptyRecord =
    counts !== null &&
    learningCount !== null &&
    counts.decisions === 0 &&
    learningCount === 0 &&
    counts.docs === 0;

  // The rest of the substrate: real numbers already fetched, none of them on
  // the surface, all of them one click down.
  const substrate: { label: string; value: number }[] | null =
    counts && stats.data
      ? [
          { label: "chat threads", value: stats.data.conversations },
          { label: "signals", value: counts.signals },
          { label: "meetings", value: counts.meetings },
          { label: "specs", value: counts.prds },
          { label: "saved notes", value: counts.findings },
          { label: "live connections", value: stats.data.connectorsLive },
        ]
      : null;

  // The newest call an outcome re-ranked. Drawn only when it is real, and not
  // on the Learnings tab, where the feed below already leads with it.
  const latest = compounding.data?.summary.latest ?? null;
  const showRecord = !decision && !learning && tab !== "learnings" && latest !== null;

  // The second line carries what the title does not: how much standing writing
  // there is, and how fresh the record is. Absent entirely when neither is
  // known, so the head never draws an empty line.
  const showDocs = counts !== null && counts.docs > 0;
  const sub: ReactNode = emptyRecord ? (
    "The first call you settle lands here, with what it was based on."
  ) : showDocs || lastAdded ? (
    <>
      {showDocs && counts ? (
        <>
          <Num>{counts.docs}</Num> docs
        </>
      ) : null}
      {showDocs && lastAdded ? " · " : null}
      {lastAdded ? (
        <>
          last added <Num>{lastAdded}</Num>
        </>
      ) : null}
    </>
  ) : undefined;

  return (
    <Surface wide>
      <PageHead title={headline} sub={sub} />

      {countsFailed ? (
        <div style={{ marginTop: "var(--sp-space-3)" }}>
          <Button
            variant="ghost"
            onClick={() => {
              void brain.refetch();
              void stats.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {showRecord && latest ? (
        <button
          type="button"
          onClick={() => navigate({ search: { tab: "learnings", learning: latest.id } })}
          style={{
            display: "block",
            width: "100%",
            marginTop: "var(--sp-space-5)",
            padding: 0,
            border: 0,
            background: "none",
            font: "inherit",
            color: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <RecordRecess
            evidence={
              <>
                priority {latest.delta > 0 ? "+" : ""}
                {latest.delta}
                {day(latest.created_at) ? ` · ${day(latest.created_at)}` : ""}
              </>
            }
          >
            {verdictLine(latest.verdict, latest.opportunity_title ?? "A call you shipped")}{" "}
            {latest.summary}
          </RecordRecess>
        </button>
      ) : null}

      <MemoryUpgradeNudge />

      <div className="sp-tabs" role="tablist" aria-label="What the record holds">
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="sp-tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {TAB_LABEL[id]}
          </button>
        ))}
      </div>

      <Suspense
        fallback={
          <Block>
            <TabSkeleton />
          </Block>
        }
      >
        {tab === "decisions" && (
          <Block>{decision ? <DecisionDetail id={decision} /> : <DecisionsPanel />}</Block>
        )}

        {tab === "learnings" &&
          (learning ? (
            <Block>
              <LearningDetail id={learning} />
            </Block>
          ) : (
            <>
              <Block>
                <CompoundingPanel />
              </Block>
              <Block title="What the crew recalls">
                <MemoryList />
              </Block>
              {/* The composer that writes to memory by hand, and whatever is
                  waiting on you. Closed by default: the reading comes first. */}
              <Disclosure label="Add to the record" id="brain-memory-composer">
                <MemoryReviewQueue />
              </Disclosure>
            </>
          ))}

        {tab === "docs" && (
          <>
            <Block title="Brief">
              <BriefPanel />
            </Block>
            <Block title="Documents">
              <DocsPanel />
            </Block>
          </>
        )}

        {tab === "graph" && (
          <Block>
            <GraphPanel focusKind={focusKind} focusId={focusId} />
          </Block>
        )}
      </Suspense>

      {substrate ? (
        <Disclosure label="The rest of the substrate" id="brain-substrate">
          <p
            style={{
              fontSize: "var(--sp-text-meta)",
              color: "var(--sp-mute)",
              marginBottom: "var(--sp-space-3)",
            }}
          >
            What the crew reads before it acts, beyond the four doors above.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--sp-space-2) var(--sp-space-5)",
            }}
          >
            {substrate.map((s) => (
              <span
                key={s.label}
                style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}
              >
                <span style={{ color: "var(--sp-ink)" }}>
                  <Num>{s.value}</Num>
                </span>{" "}
                {s.label}
              </span>
            ))}
          </div>
        </Disclosure>
      ) : null}
    </Surface>
  );
}
