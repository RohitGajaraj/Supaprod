/**
 * Brain. What the record has learned, and what it now tells the crew.
 *
 * The prototype does not draw this surface, so it is not a re-skin. It is
 * redesigned from the person standing on it, per
 * docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md. A first pass took it
 * from fifteen rendered panels to six plus two behind a click. That pass was
 * subtraction only. This one asks the harder question the founder put to it:
 * "In Brain, you need to see what and all we can change, modify, kill, and
 * consolidate."
 *
 * THE TEST EVERY PANEL HERE NOW HAS TO PASS. CLAUDE.md investor canon, binding:
 * "The brain is never storage. Banned framing: where the record lives. Canon:
 * it compounds; next time it tells you what is right, and warns before you
 * repeat what was wrong." So the question is not "is this true", it is "does
 * this make the brain look like it COMPOUNDS". A panel that lists stored rows
 * is a filing cabinet and fails no matter how accurate it is.
 *
 * 1. WHO IS HERE, AND WHAT DID THEY COME TO DO.
 *    A PM about to make a call, or about to defend one they made, who wants to
 *    know what this workspace already settled and what it cost: was this
 *    decided before, what happened the last time we tried it, what does the
 *    crew now do differently because of it. One task: recall, with the receipt
 *    attached.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Finding out what the workspace already knows before you decide again, and
 *    seeing that the knowing changed something. Without it you ask people, or
 *    you re-derive it, or you repeat a miss.
 *
 * 3. EVERY ELEMENT, KEEP / MERGE / KILL.
 *    KEPT, because the recall happens here:
 *      The Record recess       the newest call an outcome re-ranked, in the
 *                              record's own words. The one lit surface, and
 *                              the product's claim made literal.
 *      DecisionsPanel          the ledger, and the "was this decided before"
 *        + DecisionDetail      tool. The drill carries the contradiction
 *                              auditor, which is where a warning belongs: at
 *                              the point of decision, not on a browse page.
 *      CompoundingPanel        what the outcome taught, with the cause.
 *        + LearningDetail
 *      MemoryList              what the crew will recall on the next run.
 *                              /memory redirects here, so this is its only home.
 *      MemoryReviewQueue       behind a click. Its queue half duplicates
 *                              Approvals, but its composer is the ONLY way a
 *                              human writes to memory by hand.
 *      BriefPanel, DocsPanel   the standing written record.
 *      GraphPanel              how it all connects, focus drill intact.
 *      The substrate counts    behind one disclosure. Inventory, not recall.
 *
 *    ADDED, because nothing on the surface passed the compounding test on its
 *    own and the schema already held two things that do:
 *      StandingRules   the house rules the steward distilled out of validated
 *                      outcomes, that a human approved, and that go into every
 *                      agent's prompt before it acts (loop.server.ts:387-388).
 *                      This is "next time it tells you what is right", wired,
 *                      dated, and citing the outcomes it came from. It had no
 *                      reader on this surface at all.
 *      CrewCarries     one line over the memory list: how many of those
 *                      memories a run has actually read back, and how many a
 *                      human's later rating marked as having helped or as
 *                      contradicted. agent_memory.last_used_at and
 *                      memory_recall_log.outcome were both being written and
 *                      neither was ever read by a surface.
 *
 *    MERGED:
 *      The headline    was "72 calls and 49 learnings are on the record", which
 *                      is the banned framing exactly: a manifest of what is
 *                      stored. It now states what the record DID, and the
 *                      manifest moves down to the second line where a size
 *                      belongs. One head, two registers, nothing said twice.
 *      MemoryList's    the list counts what is stored; the region above it now
 *        region head   counts what was used. Two different facts, one region,
 *                      and the used one leads because it is the one that
 *                      proves anything.
 *      Tab labels      "Learnings" named a table; the panel under it says
 *                      "outcomes" in its own copy, so the door says Outcomes.
 *                      "Docs" undersold a tab that opens with the standing
 *                      strategic calls, so it says Written. Decisions and Graph
 *                      keep their names because inbound links and the panels'
 *                      own vocabulary already use them.
 *
 *    KILLED:
 *      MemoryUpgradeNudge   an ember-tinted banner built on the retired Tempo
 *                      tokens (--ember, --canvas, --ink). None of the three
 *                      resolve against this shell, so its hardcoded fallbacks
 *                      painted a cream box on a pure-dark surface, and it spent
 *                      ember, which marks the human and nothing else, on a
 *                      billing upsell. The FACT survives as one plain line
 *                      (RetentionLine), because a retention default the user
 *                      never set is our policy choice and has to be visible and
 *                      changeable.
 *
 *    MOVED, by the earlier pass and not re-litigated here: InsightsPanel to
 *      /analytics, ImpactLedgerPanel to /learn, ChangelogPanel and
 *      AnnouncementsPanel and ShipHistoryPanel to /ship, CapabilitiesPanel to
 *      /crew or Settings.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    The rest of the substrate, the memory composer and its pending queue,
 *    every decision's evidence and contradiction audit (?decision=), every
 *    learning's full record (?learning=), every graph node's history, and every
 *    standing rule past the third. Deciding a rule is not one click away, it is
 *    somewhere else entirely: the Safety room owns rule management, and a
 *    decision belongs to one place.
 *
 * 5. DELIGHT, AND CONFUSION.
 *    The moment: the record speaks first, in its own words, and then shows you
 *    the sentence it has since written into every agent's prompt because of it.
 *    Outcome, then consequence, in two elements, above the fold. The confusion
 *    this avoids: a page whose first screen counts rows, which teaches you that
 *    the brain is a database with a nice font.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE.
 *    Honestly: before this pass, barely, and the test failed. Every panel was
 *    attributed, but attribution on a list of rows is not agency. Remove every
 *    agent from the product and the old Brain lost nothing except some names in
 *    grey. It now has one element that cannot survive that removal: a standing
 *    rule exists only to be injected into an agent's prompt, so with no agents
 *    it is not a diminished feature, it is a meaningless one. The recall line
 *    is the same: last_used_at only moves when a run reaches for a memory. The
 *    parts that still would not survive the test are named in the report, and
 *    the Docs tab is the clearest of them.
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
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { getCompounding } from "@/lib/today.functions";
import type { CompoundingSummary } from "@/lib/moat-vis";
import { RetentionLine } from "@/components/brain/RetentionLine";
import { CrewCarries, StandingRules } from "@/components/brain/StandingRecord";
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

// The ids are the URL contract and never change. The labels name the QUESTION
// the door answers rather than the table behind it.
const TAB_LABEL: Record<Tab, string> = {
  decisions: "Decisions",
  learnings: "Outcomes",
  docs: "Written",
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

/**
 * The first line says what the record DID, not what it holds. "N calls are on
 * the record" is the banned framing exactly: a manifest of storage. The size of
 * the record is real and useful, so it moves to the second line, where a size
 * belongs.
 *
 * Priority is by strength of claim: an outcome that moved a ranking beats a
 * count of anything. A young workspace that has not compounded yet falls back
 * to the honest manifest rather than to a claim it has not earned.
 */
function recordHeadline(
  summary: CompoundingSummary | null,
  calls: number | null,
  learnings: number | null,
  loading: boolean,
): string {
  const rescored = summary?.rescoreCount ?? 0;
  if (rescored > 0) {
    return rescored === 1
      ? "A real outcome has re-scored one call."
      : `Real outcomes have re-scored ${rescored} calls.`;
  }
  if (calls === null && learnings === null) {
    return loading ? "Reading the record." : "The record did not load.";
  }
  const clauses: string[] = [];
  if (calls) clauses.push(calls === 1 ? "one call" : `${calls} calls`);
  if (learnings) clauses.push(learnings === 1 ? "one learning" : `${learnings} learnings`);
  if (clauses.length === 0) return "Nothing is on the record yet.";
  const verb = clauses.length === 1 && clauses[0].startsWith("one ") ? "is" : "are";
  const sentence = `${clauses.join(" and ")} ${verb} on the record, and nothing has come back yet.`;
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
  const summary = compounding.data?.summary ?? null;
  const countsLoading = brain.isLoading || stats.isLoading;
  const countsFailed = (brain.isError || stats.isError) && !counts && learningCount === null;
  const headline = recordHeadline(
    summary,
    counts?.decisions ?? null,
    learningCount,
    countsLoading || compounding.isLoading,
  );
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
  // on the Outcomes tab, where the feed below already leads with it.
  const latest = summary?.latest ?? null;
  const showRecord = !decision && !learning && tab !== "learnings" && latest !== null;

  // The second line is the SIZE of the record: what the headline no longer
  // says, because a manifest is not a claim. Every clause is a count that
  // loaded, so a failed read contributes no clause and never a zero.
  const sizeClauses: ReactNode[] = [];
  if (counts && counts.decisions > 0) {
    sizeClauses.push(
      <span key="calls">
        <Num>{counts.decisions}</Num> {counts.decisions === 1 ? "call" : "calls"}
      </span>,
    );
  }
  if (learningCount) {
    sizeClauses.push(
      <span key="learnings">
        <Num>{learningCount}</Num> {learningCount === 1 ? "learning" : "learnings"}
      </span>,
    );
  }
  if (counts && counts.docs > 0) {
    sizeClauses.push(
      <span key="docs">
        <Num>{counts.docs}</Num> docs
      </span>,
    );
  }
  if (lastAdded) {
    sizeClauses.push(
      <span key="added">
        last added <Num>{lastAdded}</Num>
      </span>,
    );
  }
  const sub: ReactNode = emptyRecord
    ? "The first call you settle lands here, with what it was based on."
    : sizeClauses.length > 0
      ? sizeClauses.map((c, i) => (
          <span key={i}>
            {i > 0 ? " · " : null}
            {c}
          </span>
        ))
      : undefined;

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

      <RetentionLine />

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

      {/* What changed BECAUSE of all that. The outcome speaks in the recess
          above; this is the sentence the record has since written into every
          agent's prompt. Cause, then consequence, and it stands above the tabs
          because it is true whichever door you are behind. */}
      <StandingRules />

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
              {/* The region says what was USED; the list inside says what is
                  STORED. Two different facts, and the used one leads. */}
              <CrewCarries>
                <MemoryList />
              </CrewCarries>
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
