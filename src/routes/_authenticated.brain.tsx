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
 *      ArtifactsView   the Artifacts tab. See THE ARTIFACTS MOVE below; the
 *                      view's own six answers live in its file header.
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
 * THE ARTIFACTS MOVE (founder ruling 2026-07-30). A reachability audit found
 * /artifacts orphaned: its only inbound link was MissionShell's Artifacts door,
 * and MissionShell is the retired Mission Control chrome AppFrame replaced, so
 * nothing live reached a fully redesigned 575-line surface. The approved fix is
 * a fifth tab here rather than a sixth rail item:
 *
 *   Brain holds what we DECIDED and LEARNED. Artifacts holds what we MADE.
 *   Two halves of one record, and only one of them had a door. "Where is that
 *   spec from March" and "what did we decide in March" are the same question
 *   with different nouns; splitting them across two rail items makes a person
 *   choose before they know which half they want. The rail is five items, and
 *   a sixth costs every user forever to serve an occasional need. Agent-native
 *   cuts the same way: an agent citing its own work needs ONE addressable
 *   record, not two.
 *
 * So /artifacts is a permanent redirect to /brain?tab=artifacts (URLs never
 * die), and the tab renders <ArtifactsView />, which draws no Surface and no
 * h1 because this page owns both.
 *
 * UNCHANGED: the route contract. Every legacy tab id still resolves through
 * LEGACY_TABS, the ?decision= / ?learning= / ?focusKind= / ?focusId= drills
 * still work, and every query key is untouched, which matters because they are
 * shared caches with Today, Learn and the panels themselves.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE GUIDANCE PASS, 2026-08-05. THE SURFACE WAS PROVING STORAGE.
 *
 * The founder read the live demo workspace's own headline back to the page:
 * "49 calls and 8 learnings are on the record, and none has re-scored a call
 * yet." Every word of that is true and it is still the wrong sentence, because
 * BOTH of its clauses are about the size of a pile. The product's claim is that
 * the record learns and GUIDES. That headline concedes the opposite.
 *
 * WHAT IS ACTUALLY FIRING, AND WAS SHOWN NOWHERE. This page already pays for
 * the answer. getStandingRecord returns two halves; StandingRules reads the
 * rules half and CrewCarries reads the recall half, and CrewCarries lives on
 * the Outcomes tab, which is not the tab anybody lands on. So the surface
 * fetched the proof and then rendered it behind a door. On the demo workspace
 * the recall half reads: 694 of 846 things the record has learned have been
 * read back by a run, across 3115 recalls. That is not storage. A memory is
 * pulled at recall time, written into the system prompt, and the model acts
 * with it in front of it (recallMemoryRefs -> lines -> the prompt; touchMemory
 * stamps last_used_at; logMemoryRecall writes the row). It is the single most
 * load-bearing true sentence available to this page and it was not on it.
 *
 * SO: THE HEADLINE LADDER GAINS A RUNG. A re-scored call still wins, because an
 * outcome that moved a ranking is the strongest claim in the product. Under it
 * now sits the recall claim, and only under THAT does the page fall back to the
 * manifest. A workspace with nothing yet still gets the manifest, unchanged.
 *
 * NOTHING IS LOST TO THE MOVE, which is the ratchet. The call, learning and doc
 * counts were already the second line, as Doors. The one clause that leaves the
 * head is "and none has re-scored a call yet", and it does not evaporate: it
 * becomes a line of its own in the new region, next to the mechanism it is
 * about and next to what makes it move, which is where an admission belongs.
 *
 * ADDED: THE GUIDANCE REGION, above the tabs because it is true whichever door
 * you are behind (the same argument StandingRules already stands on). Three
 * mechanisms, each rendered in the state it is actually in, and the empty and
 * thin states ARE the design here because they are what every new workspace
 * sees:
 *
 *   READ BACK      firing. What the record learned goes into a later run's
 *                  prompt. Real counts, or, when nothing has been reached for
 *                  yet, what makes the first one happen. Never a zero.
 *   RATED          wired, thin. A rating on a run calls bump_memory_importance
 *                  on every memory that run recalled (feedback.functions.ts:39-54)
 *                  and importance is in the recall RPC's own ORDER BY
 *                  (20260802190000_agent_memory_workspace_visibility.sql:143-146,
 *                  and reflections order by importance desc). So "rating moves
 *                  what the crew reads first" is a wired claim, not a promise.
 *                  Today every row is still 'ignored', and the line says that.
 *   RE-SCORED      wired, empty. agent_memory holds no outcome rows yet, so no
 *                  outcome has moved an ICE. Stated plainly, with the act that
 *                  moves one, and a door to the outcomes.
 *
 * WHAT THIS REGION IS NOT. It is not a stat strip. The substrate disclosure at
 * the foot of this page is the inventory shape and it stays the inventory
 * shape; these are Rows, the system's grammar for who did what, because every
 * line here is an EVENT or the absence of one. And there is no "teams like
 * yours" number anywhere, invented or averaged. There is no such data and a
 * fabricated benchmark would be the exact thing this file's own test asks of
 * every panel.
 *
 * NOTHING IS SAID TWICE. The recall lines are suppressed on the Outcomes tab,
 * where CrewCarries says the same fact better because the list it describes is
 * directly underneath it. That is the identical rule the record recess above
 * already follows. The re-score line survives on every tab, because nothing
 * else on any of them states it.
 *
 * ONE READ, THREE CONSUMERS. The region uses the ["brain-standing", workspace]
 * key that StandingRules and CrewCarries already share, so surfacing this costs
 * zero additional requests.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE MAP COMES UP OFF TAB FIVE, 2026-08-05. THE PROOF WAS BURIED.
 *
 * A design audit put the two facts side by side. GraphForceCanvas (36 KB) and
 * GraphUniverseCanvas (43 KB) are a real DPR-aware physics canvas with typed
 * edges, a time scrubber that replays over actual edge timestamps, drift rings,
 * and per-edge rationale plus created_by_agent attribution: the one place in
 * this product where the crew's work is DRAWN rather than described. Everywhere
 * else, agent work is text; `<svg` appears zero times across the four core work
 * surfaces, and the entire visual vocabulary for "an agent is working" is a 6px
 * breathing dot, a 14px rotating glyph and a static chip. And that one drawn
 * thing sat behind rail row 3, then tab 5 of 5, then a view toggle. Nobody who
 * had not been told it existed ever saw it.
 *
 * Brain's job is to prove the record GUIDES. The graph is that proof, drawn. So
 * it gets a region of its own, above the tabs.
 *
 * THE THREE WAYS TO RAISE IT, AND WHY THIS ONE.
 *
 *   MAKE GRAPH THE DEFAULT TAB when the record has edges. Strongest exposure,
 *   and it takes something away: a returning PM lands on Brain to answer "was
 *   this decided before", and that answer is the decision ledger. Moving the
 *   default moves the surface's stated one task out from under the person who
 *   uses it daily, which fails the ratchet's own test. Rejected.
 *
 *   MOVE GRAPH TO TAB POSITION 1 or 2. Cheap, and it does not fix the defect.
 *   A tab is still a door you have to know to open; a first-time visitor who
 *   never clicks it still never meets the canvas. It answers "buried deep" and
 *   not "no visitor reaches it", and only the second one matters. Rejected.
 *
 *   A LIVE PREVIEW ABOVE THE TABS, which is what this is. It is strictly
 *   ADDITIVE: every tab, every label, every deep link and the whole Graph tab
 *   with its legend, scrubber, replay, Universe/Flat toggle and outline stay
 *   exactly where they were. Nothing moved, so nobody's habit broke, and the
 *   drawn record is now unavoidable rather than one more thing to find. It is
 *   also the only one of the three that lets the canvas be CONDITIONAL, which
 *   is what makes the honest-degradation rule below possible at all.
 *
 * WHERE IT SITS, AND WHY NOT HIGHER. Directly above the tab strip, under
 * StandingRules. The recess-then-rule pair above it is deliberate and stated in
 * section 5 of this header ("outcome, then consequence, in two elements, above
 * the fold"), so the map does not get to split it. The resulting order is the
 * argument the surface has always been making, and now the last rung is a
 * picture: what the record did, what it changed, the rule it wrote, THE WHOLE
 * THING DRAWN, and then the doors into it.
 *
 * IT DEGRADES HONESTLY, WHICH IS THE POINT OF THE THRESHOLD. A canvas holding
 * two dots and one line does not read as a young workspace, it reads as a
 * broken feature, and that is the state EVERY new user is in. So the canvas is
 * drawn only at PREVIEW_MIN_EDGES or more, and under it the region says what is
 * actually there in words: nothing linked yet plus the act that draws the first
 * thread, or a thin count plus the door to the full map. Nothing is hidden in
 * either state, because the Graph tab is untouched and both states link to it.
 *
 * IT COSTS NOTHING TO LOAD. The 36 KB canvas and its d3-force dependency are
 * behind `lazy` INSIDE the drawn branch, so a workspace with two edges never
 * fetches the module at all, and the read is the ["knowledge-graph", kind, id]
 * key GraphCanvasView already uses, so this is a second consumer of one request
 * rather than a second request, and opening the Graph tab is now a cache hit.
 * The read is skipped outright while a drill is open. GraphUniverseCanvas is
 * deliberately NOT the preview renderer: it pulls three.js, and the flagship
 * WebGL view belongs on the tab that can afford it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE ZERO PASS, 2026-08-10. FIVE HONEST ADMISSIONS IN A COLUMN.
 *
 * Every region above the tabs was written to degrade honestly, and each of them
 * does, and the page still failed: blank, it stacked FIVE consecutive "nothing
 * yet" regions in one scroll. The headline's second line, then the guidance
 * region, then the standing rules, then the drawn record, then the open tab's
 * own empty. Each names the act that ends it. Read as a column they do not read
 * as a product waiting for you, they read as a product that does not work.
 *
 * The stacking was the defect, not the copy. So `recordIsBlank` decides, once,
 * whether this record is genuinely empty on every read that feeds those
 * regions, and when it is, the four above the tabs collapse into ONE state that
 * names the first act, the control by the words printed on it, and carries one
 * case the whole way through. The headline drops its second line there for the
 * same reason. Nothing about the loading, failed, thin or partial states moved:
 * every one of them makes `recordIsBlank` false by construction.
 *
 * AND THE SUBSTRATE GRID STOPPED COUNTING ZEROES AT PEOPLE. Six cells reading
 * 0 chat threads, 0 signals, 0 meetings, 0 specs, 0 saved notes, 0 live
 * connections, in the shape this system reserves for things you SCAN, which
 * promises there is something to scan. That is the rule the diff shape on the
 * record recess already states ("a zero rendered as if it were a finding"),
 * broken six times at once. A zero draws no cell now, and all-zero draws one
 * sentence.
 *
 * WHY recordHeadline, guidanceLines, graphPreview AND recordIsBlank ARE
 * EXPORTED. All four decide what this page is allowed to CLAIM, and every rule
 * they hold is one a
 * future edit can break while typechecking clean and looking fine in a diff, so
 * they are pure and guarded by src/routes/__tests__/brain-guidance.test.tsx and
 * src/routes/__tests__/brain-graph-preview.test.tsx. That costs a few
 * react-refresh warnings on this file, which is the same trade CompoundingPanel
 * beside it already makes for whenOf and deltaOf, and for the same reason.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PORTED TO MERIDIAN, 2026-08-15. NOT ONE CLAIM ON THIS SURFACE MOVED.
 *
 * Every sentence, every guard, every query key, every deep link and every one of
 * the four exported pure functions is untouched. What changed is what the page
 * is DRAWN with: it was built entirely from `src/components/shell/primitives`,
 * which is the `--sp-*` layer, and meridian.css states the migration rule in its
 * own header -- that layer is life support, "no new surface may use it, every
 * migrated surface drops it, and the layer is deleted when the last one moves".
 * A surface that keeps one foot in it does not re-resolve on the paper ground
 * with the rest of the app, which is the whole reason the rule exists.
 *
 * So Block, Row, Empty, Failed, Loading, Num, Door, Diffstat, Cell, Grid,
 * PageHead and Record are replaced by the Meridian parts in
 * `@/components/brain/record-parts`, the four raw `--sp-*` inline styles on this
 * file (the tab skeleton, the canvas reservation, the disclosure's negative
 * margin, the substrate caption) are gone, and `.sp-tabs` is gone with them.
 *
 * TWO MERIDIAN COMPONENTS ARE ADOPTED OUTRIGHT, and each does something the
 * part it replaces could not:
 *
 *   NeedsSetup, on the substrate's all-zero state. That state's whole point is
 *   that the crew has nothing else to READ, and the act that changes it is
 *   connecting a source. NeedsSetup exists for exactly the fact this product
 *   kept collapsing into an empty state: a precondition is missing, so the
 *   surface cannot ask its question at all. It also carries no accent, which is
 *   correct here -- connecting a source is setup, not a decision, and dressing
 *   it in orchid sends someone hunting for a call to make.
 *
 *   RecordsTable, inside the Artifacts tab. See that file's own header.
 *
 * `Surface` stays, and it is the one shell primitive kept on purpose: it is the
 * work region's LAYOUT, the same one the ported Approvals surface still mounts,
 * and it is not a token or a paint. `CrewWorking` stays for the same reason and
 * because src/routes/__tests__/autonomous-work-is-visible.test.ts requires this
 * exact import.
 */
import { lazy, Suspense, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBrainStatus, getCompanyBrainStats } from "@/lib/brain.functions";
import { getCompounding } from "@/lib/today.functions";
import type { CompoundingSummary } from "@/lib/moat-vis";
import { getStandingRecord, type RecallRecord } from "@/lib/brain-standing.functions";
import { getKnowledgeGraph } from "@/lib/knowledge-graph-view.functions";
import type { GraphNodeKind, KnowledgeGraph } from "@/lib/knowledge-graph-view";
import { RetentionLine } from "@/components/brain/RetentionLine";
import { CrewCarries, StandingRules } from "@/components/brain/StandingRecord";
import { CrewMark, Disclosure, RecordLine, RecordSpeaks } from "@/components/brain/record-parts";
import {
  Action,
  Diffstat,
  Door,
  Figure,
  NothingYet,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { Surface } from "@/components/meridian/Surface";
import { CrewWorking } from "@/components/shell/CrewWorking";

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
const ArtifactsView = lazy(() =>
  import("@/components/brain/ArtifactsView").then((m) => ({ default: m.ArtifactsView })),
);

/**
 * THE RECORD, DRAWN. Mounted above the tabs, and ONLY from inside the branch
 * that has already counted enough edges to be worth drawing, so the 36 KB
 * renderer and its d3-force dependency are never fetched by a workspace that
 * would get two dots and a line.
 *
 * The component is defined inside the factory rather than imported so that
 * `graph-visual` rides in the SAME lazy chunk. It is a small module of pure
 * constants plus one media-query hook, and importing `usePrefersReducedMotion`
 * at the top of this route would pull the whole vocabulary into the chunk every
 * Brain visit pays for, to serve the one visit in five that draws a map.
 *
 * `reducedMotion` is read here rather than passed because the canvas answers it
 * itself: it renders a settled still instead of a running simulation, which is
 * the same contract GraphPanel already honours on the tab.
 */
const GraphRecordPreview = lazy(async () => {
  const [{ GraphForceCanvas }, { usePrefersReducedMotion }] = await Promise.all([
    import("@/components/knowledge/GraphForceCanvas"),
    import("@/components/knowledge/graph-visual"),
  ]);
  function Preview({
    graph,
    onOpenNode,
  }: {
    graph: KnowledgeGraph;
    onOpenNode: (kind: string, id: string) => void;
  }) {
    const reducedMotion = usePrefersReducedMotion();
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <GraphForceCanvas
        graph={graph}
        selectedKey={selected}
        onSelect={setSelected}
        // A double-click on the preview is the handoff: it opens the full Graph
        // tab already focused on the thing you pointed at, which is the drill
        // the ?focusKind= / ?focusId= contract has always supported.
        onOpenStory={(key) => {
          const node = graph.nodes.find((n) => n.key === key);
          if (node) onOpenNode(node.kind, node.id);
        }}
        reducedMotion={reducedMotion}
      />
    );
  }
  return { default: Preview };
});

type Tab = "decisions" | "learnings" | "artifacts" | "docs" | "graph";
const TABS: Tab[] = ["decisions", "learnings", "artifacts", "docs", "graph"];

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
  // Keeps its name for the same reason Decisions and Graph do: /artifacts was
  // a founder-named door with inbound links and a registry entry, so renaming
  // it here would break the one word people already use for the thing. The
  // region heading under it says it in plain words.
  artifacts: "Artifacts",
  docs: "Written",
  graph: "Graph",
};

/** The Suspense fallback. Static, not a shimmer: it holds the height so the
 *  page does not jump, and motion in this system confirms rather than fills. */
function TabSkeleton() {
  const bar = (h: number, w?: string) => (
    <div
      aria-hidden="true"
      className="rounded-mrd-card bg-mrd-lift"
      style={{ width: w ?? "100%", height: h }}
    />
  );
  return (
    <div role="status" className="flex flex-col gap-mrd-3">
      <span className="sr-only">Reading the record.</span>
      {bar(56)}
      {bar(96)}
      {bar(96, "72%")}
    </div>
  );
}

/**
 * The page's one h1, and its second line.
 *
 * This replaces the shell's `PageHead`. The size is `--mrd-t-h2`, which is the
 * step the ported surfaces put a page title on, and the sub sits at the body
 * stop rather than at a metadata one: Brain's second line is a row of doors
 * into the record, and a control set two steps below the sentence around it
 * reads as a typo rather than as an affordance.
 */
function RecordHead({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <header data-mrd="">
      <h1 className="text-[25px] leading-tight font-medium text-mrd-ink">{title}</h1>
      {sub ? <p className="mt-mrd-3 text-[13px] leading-relaxed text-mrd-body">{sub}</p> : null}
    </header>
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
      <div className="flex flex-col gap-mrd-6">
        <RecordHead title="The record did not load." sub="Nothing it holds is lost." />
        <NothingYet
          action={
            <Action variant="primary" onClick={reset}>
              Try again
            </Action>
          }
        >
          {(error as Error)?.message ?? "The read failed."}
        </NothingYet>
      </div>
    </Surface>
  ),
  notFoundComponent: () => (
    <Surface wide>
      <div className="flex flex-col gap-mrd-6">
        <RecordHead
          title="That record is not here."
          sub="It was removed, or the link points at something that never existed."
        />
        <NothingYet
          action={
            <Action variant="primary" onClick={() => window.location.assign("/brain")}>
              Open the record
            </Action>
          }
        >
          Everything the record holds is behind the five doors on Brain.
        </NothingYet>
      </div>
    </Surface>
  ),
});

/**
 * The first line says what the record DID, not what it holds. "N calls are on
 * the record" is the banned framing exactly: a manifest of storage. The size of
 * the record is real and useful, so it moves to the second line, where a size
 * belongs.
 *
 * Priority is by strength of claim: an outcome that moved a ranking beats the
 * record being read back, and being read back beats a count of anything. A
 * young workspace that has not compounded yet falls back to the honest manifest
 * rather than to a claim it has not earned.
 *
 * THE MIDDLE RUNG, ADDED 2026-08-05, AND WHY IT IS NOT A SECOND MANIFEST. It
 * counts recall EVENTS, not rows: memory_recall_log gets a row when a memory is
 * pulled into a run's system prompt, so every one of them is a moment the crew
 * read the record before it acted. That is the product's claim, stated in the
 * one place a person always reads, and until this rung existed every workspace
 * that had not yet re-scored a call landed on the manifest no matter how hard
 * its record was working.
 *
 * SCOPES ARE NEVER MIXED IN ONE SENTENCE. The recall counts are owner-scoped
 * (agent_memory RLS is auth.uid() = user_id) and the calls and learnings below
 * are workspace-scoped, which is why they live in different sentences and never
 * in one clause. brain-standing.functions.ts states the same rule at the read.
 */
export function recordHeadline(
  summary: CompoundingSummary | null,
  recall: RecallRecord | null,
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
  /**
   * `memoriesReached` comes from last_used_at and is true whether or not the
   * recall log can be read, so it is what qualifies the rung. The rung no
   * longer carries a NUMBER, and both reasons are worth keeping.
   *
   * THE NUMBER WAS WRONG, MEASURED 2026-08-11. `events` is
   * `memory_recall_log.select("id", {head, count})` -- a plain ROW count, and
   * memory_recall_log takes one row per MEMORY pulled, not one per read. On the
   * demo workspace that is 587 rows across 146 distinct `trace_id`s, roughly
   * four memories per run. So "read this record before acting 587 times"
   * overstated the thing it names by about 4x: the crew read the record 146
   * times. The comment above this rung asserted the opposite ("counts moments
   * the crew read the record BEFORE it acted, not rows it kept") and the data
   * does not support it. Counting reads instead of rows means counting distinct
   * traces, which is a change to brain-standing.functions.ts, not to a sentence
   * here -- so this stops printing a number it cannot stand behind.
   *
   * AND A COUNT MUST NEVER BE THE PROOF. The standing rule in CLAUDE.md and
   * AGENTS.md is that accumulated learning is never claimed in the present
   * tense and a count is never presented as evidence the loop has been running;
   * the honest form is that the loop is wired and proven and begins accruing on
   * first real use. "...before acting 587 times" is that banned shape exactly,
   * in the largest sentence on the surface that carries the product's central
   * claim. It also flattered itself twice over: 576 of those 587 pulls carry
   * outcome 'ignored', and only 10 'used'.
   *
   * What survives is the mechanism, which is true, checkable and the actual
   * claim: the crew reads this record before it acts. The size of the record
   * still sits in the sub beneath it, where a count is a description rather
   * than an argument.
   */
  if (recall && recall.memoriesReached > 0) {
    return "The crew has read this record before acting.";
  }
  if (calls === null && learnings === null) {
    return loading ? "Brain" : "The record did not load.";
  }
  const clauses: string[] = [];
  if (calls) clauses.push(calls === 1 ? "one call" : `${calls} calls`);
  if (learnings) clauses.push(learnings === 1 ? "one learning" : `${learnings} learnings`);
  if (clauses.length === 0) {
    // "Nothing is on the record yet" is a claim about the whole record, so it
    // needs BOTH halves read. With one of them still null the pile is not known
    // to be empty, only unmeasured, and the page admits the read instead of
    // asserting an empty workspace it never confirmed.
    if (calls === null || learnings === null) return loading ? "Brain" : "The record did not load.";
    return "Nothing is on the record yet.";
  }
  const verb = clauses.length === 1 && clauses[0].startsWith("one ") ? "is" : "are";
  /**
   * "NOTHING HAS COME BACK" AND "NOTHING HAS RE-SCORED" ARE DIFFERENT FACTS.
   *
   * Found 2026-08-03: this page read "29 calls and 8 learnings are on the record,
   * and nothing has come back yet" while Learn, one click away, read "8 outcomes
   * came back. 4 of 7 paid off." Both were rendering truthfully from their own
   * source and contradicting each other in plain English.
   *
   * The tail fires on rescoreCount, which counts outcomes that MOVED a bet's ICE,
   * not outcomes that exist. With learnings on the record, "nothing has come back"
   * is simply false, and it undersells the product's own claim: the outcomes are
   * there, they have not yet changed a ranking. Say that instead.
   *
   * AND THE SECOND HALF OF THE SAME CLAUSE, FOUND 2026-08-10. `learnings` is
   * `stats.data?.learnings ?? null`, so a getCompanyBrainStats read that FAILED
   * arrived here indistinguishable from a workspace with zero outcomes, and both
   * fell to the else: the largest sentence on the page told a workspace with 49
   * outcomes on it that nothing had come back, off one dead read. It fired on
   * every ordinary staggered load too, because the reads land one at a time and
   * `loading` is consulted only in the both-null branch above.
   *
   * So the tail is now gated on the read having RESOLVED. A KNOWN zero still
   * says "nothing has come back yet", which is the honest and useful line for a
   * young workspace. A null says nothing at all, and the sentence simply ends
   * after the size: the rule this file states at the second line ("a failed read
   * contributes no clause and never a zero") applied to the tail as well.
   */
  const tail = learnings
    ? "and none has re-scored a call yet."
    : learnings === 0
      ? "and nothing has come back yet."
      : null;
  const sentence = tail
    ? `${clauses.join(" and ")} ${verb} on the record, ${tail}`
    : `${clauses.join(" and ")} ${verb} on the record.`;
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

/**
 * One guidance mechanism, in the state it is actually in.
 *
 * `door` names a destination this page can honestly reach. It is absent, never
 * pointed at something adjacent, wherever there is nowhere to send anybody:
 * the same rule the substrate counts below already follow, and the same one
 * that keeps `meetings` unlinked down there.
 */
export type GuidanceLine = {
  key: string;
  lead: ReactNode;
  sub: ReactNode;
  door?: "outcomes";
};

/**
 * WHAT THE RECORD IS DOING TO THE WORK, and where it is not doing it yet.
 *
 * PURE, so the honesty is testable without a browser. Every branch here is a
 * different FACT, and the distinction that matters most is between "this has
 * not happened" and "we could not find out", because a zero standing in for the
 * second is the lie this whole surface exists not to tell.
 *
 * THE RULES THIS FUNCTION IS BOUND BY:
 *
 *   A number is drawn only when it was read. `logReady` false means
 *   memory_recall_log could not be read at all, in which case its counts are
 *   all 0 and none of them may be shown; the read-back line survives anyway,
 *   because last_used_at is a different column on a different table and it is
 *   still true.
 *
 *   A "not yet" line is drawn only once the thing it denies is KNOWN to be
 *   absent. `rescoreCount: null` means the compounding read is in flight or
 *   failed, and "no outcome has moved a priority" would then be a claim rather
 *   than an admission, so nothing is drawn.
 *
 *   A "not yet" line always names the act that ends it. That is the difference
 *   between a surface that reads as broken and one that reads as sharpening,
 *   and the act named is always one the product genuinely performs.
 *
 *   No line compares this workspace to anybody else's. There is no such data,
 *   and inventing an average would be the fabrication this repo fails builds
 *   over.
 */
export function guidanceLines(args: {
  recall: RecallRecord | null;
  /** null while the compounding read is unresolved. See the rules above. */
  rescoreCount: number | null;
  /** True on the Outcomes tab, where CrewCarries states the recall fact
   *  directly above the list it is about, which is the better place for it. */
  recallSaidBelow: boolean;
}): GuidanceLine[] {
  const { recall, rescoreCount, recallSaidBelow } = args;
  const out: GuidanceLine[] = [];
  const showRecall = recall !== null && !recallSaidBelow;

  /**
   * 1. READ BACK. The mechanism that is firing today. A memory is pulled at
   *    recall time and written into the system prompt, so a memory carrying
   *    `last_used_at` is one the crew reached for before it acted.
   *
   *    "THINGS THE RECORD HAS LEARNED" WAS THE BANNED SENTENCE, FIXED
   *    2026-08-11. AGENTS.md §"Never claim accumulated learning in the present
   *    tense" names this shape by example -- "the brain has learned N things"
   *    offered as evidence the loop works -- and this line was that sentence
   *    with the count rendered in `Num` on either side of it. The numbers
   *    themselves are sound (133 rows in agent_memory, 118 of them with
   *    `last_used_at` set, verified against the database on 2026-08-11); it is
   *    the verb that overclaims. Nothing here LEARNED anything: a run or a
   *    person wrote a lesson to the record and a later run read it back.
   *
   *    So the count stays and the claim goes. A number describing the size of
   *    the pile is allowed on this surface; a number offered as proof the
   *    product has been learning is not, and the difference is the verb.
   */
  if (showRecall && recall.memoriesTotal > 0) {
    out.push(
      recall.memoriesReached > 0
        ? {
            key: "read-back",
            lead: (
              <>
                <Figure>{recall.memoriesReached}</Figure> of <Figure>{recall.memoriesTotal}</Figure>{" "}
                lessons on the record have gone back into a later run.
              </>
            ),
            sub: "Each one is written into the agent's prompt before it acts, not looked up afterwards.",
          }
        : {
            key: "read-back",
            lead: "No lesson on the record has gone into a run yet.",
            sub: "The next run over the same ground reads it first. That is the whole mechanism, and it needs one more run.",
          },
    );
  }

  // 2. RATED. Wired end to end and thin on data: a rating calls
  //    bump_memory_importance on every memory that run recalled, and importance
  //    sits in the recall RPC's ORDER BY. So the sentence below describes a
  //    real consequence, not an intention.
  if (showRecall && recall.logReady && recall.events > 0) {
    const rated = recall.helped > 0 || recall.contradicted > 0;
    out.push(
      rated
        ? {
            key: "rated",
            lead: "Your ratings have moved what the crew reaches for first.",
            sub: (
              /* The only hue in this whole region, and both halves report an
                 OUTCOME: what a rating said actually happened. Green and red are
                 never a need in this system, and nothing on these rows asks for
                 a person. `sp-pass` / `sp-fail` until the Meridian port. */
              <>
                {recall.helped > 0 ? (
                  <span className="text-mrd-pass">
                    <Figure>{recall.helped}</Figure> helped
                  </span>
                ) : null}
                {recall.helped > 0 && recall.contradicted > 0 ? " · " : null}
                {recall.contradicted > 0 ? (
                  <span className="text-mrd-fail">
                    <Figure>{recall.contradicted}</Figure> contradicted by what happened
                  </span>
                ) : null}
              </>
            ),
          }
        : {
            key: "rated",
            lead: "None of that has been rated yet.",
            sub: "Rate one run and every lesson it leaned on moves up or down in what the crew reads next.",
          },
    );
  }

  // 3. RE-SCORED. Wired, and empty on every workspace today. This is the clause
  //    the headline used to carry, and it is better here: an admission belongs
  //    beside the mechanism it is about and beside the act that ends it.
  if (rescoreCount === 0) {
    out.push({
      key: "rescored",
      lead: "No outcome has moved a call's priority yet.",
      sub: "Record what a shipped bet actually did, and the ranking it came from moves with it.",
      door: "outcomes",
    });
  }

  return out;
}

/**
 * THE FEWEST LINKS THAT MAKE A SHAPE.
 *
 * Three, and the number is a judgment about what a picture SAYS rather than
 * about performance. One link is two dots and a line; two links are three dots
 * in a row. Neither reads as "this workspace is young", they read as "this
 * feature is broken", and a physics canvas holding three objects reads worst of
 * all because the motion has nothing to resolve into. Three links is the first
 * count that can branch, and a branch is the whole claim: this came from that,
 * and so did the other thing.
 */
export const PREVIEW_MIN_EDGES = 3;

/**
 * WHAT THE PREVIEW REGION IS ALLOWED TO DO, given what came back.
 *
 * PURE, for the same reason recordHeadline and guidanceLines are: every rule
 * here is one a future edit can break while typechecking clean.
 *
 *   NEVER DRAW A CANVAS THAT READS AS BROKEN. Under PREVIEW_MIN_EDGES the
 *   region says what is really there in words. This is not a smaller claim, it
 *   is the true one, and it is the state every new workspace is in.
 *
 *   "NOTHING IS LINKED" AND "WE COULD NOT READ IT" ARE DIFFERENT FACTS, and
 *   they get different states, because a person acts differently on each.
 *
 *   A STALE GRAPH STILL DRAWS. `failed` with data in hand means the refetch
 *   failed, not that the record went away, so the map we have is still true and
 *   blanking it would lose information over a network blip.
 *
 *   IT STANDS DOWN WHERE IT WOULD BE NOISE. On the Graph tab the full canvas is
 *   already on screen, and drawing a second physics simulation above it is both
 *   a duplicate and a real cost. On an open drill the reader came to read ONE
 *   record, which is the identical rule the record recess above already follows.
 */
export type GraphPreviewState =
  | { state: "hidden" }
  | { state: "loading" }
  | { state: "failed" }
  | { state: "empty" }
  | { state: "thin"; edges: number }
  | { state: "drawn"; nodes: number; edges: number };

export function graphPreview(args: {
  /** Structural on purpose: the only thing this decision needs is how much
   *  there is to draw, so a test never has to build a whole KnowledgeGraph. */
  graph: { nodes: unknown[]; edges: unknown[] } | null;
  loading: boolean;
  failed: boolean;
  onGraphTab: boolean;
  drilling: boolean;
}): GraphPreviewState {
  const { graph, loading, failed, onGraphTab, drilling } = args;
  if (onGraphTab || drilling) return { state: "hidden" };
  if (!graph) return failed && !loading ? { state: "failed" } : { state: "loading" };
  const nodes = graph.nodes.length;
  const edges = graph.edges.length;
  if (edges === 0) return { state: "empty" };
  if (edges < PREVIEW_MIN_EDGES || nodes < PREVIEW_MIN_EDGES) return { state: "thin", edges };
  return { state: "drawn", nodes, edges };
}

/**
 * IS THIS RECORD BLANK, AND DO WE KNOW IT.
 *
 * THE DEFECT, and it is a composition defect rather than a copy one. On a
 * workspace with nothing on it, this surface stacked FIVE consecutive "nothing
 * yet" regions in one scroll: the headline's second line, the guidance region,
 * the standing-rules region, the drawn-record region, and then the open tab's
 * own empty state. Every sentence in that column is true, well written, and
 * names the act that ends it. Read together they are a broken page. The reader
 * does not count five honest admissions and conclude the product is careful;
 * they conclude nothing works.
 *
 * That state is not an edge case. Every real account is in it today.
 *
 * So when the record is blank the four regions ABOVE the tabs collapse into one
 * well-made empty state, and the headline drops its second line so the head is
 * one sentence rather than the first half of the stack.
 *
 * THE FIFTH ONE STAYS, deliberately. The open tab's own empty sits one level
 * down, behind a door the reader chose, which is a different thing from a
 * column of regions they did not ask for. Suppressing the tab body would also
 * take away two live capabilities that survive a blank record: the memory
 * composer behind "Add to the record" on Outcomes, and a Strategic Brief, which
 * lives in its own table and can exist with zero documents.
 *
 * PURE, for the same reason recordHeadline, guidanceLines and graphPreview are:
 * every rule here decides what the page CLAIMS, and each is one a future edit
 * can break while typechecking clean.
 *
 *   IT NEVER GUESSES. A null anywhere means that read is unresolved or failed,
 *   and an unknown is not an emptiness. Collapsing the page on a read we could
 *   not make would hide a failure behind a tidy empty state, which is the exact
 *   trade the Failed primitive exists to refuse.
 *
 *   IT STANDS DOWN ON A DRILL, where the reader came for one record and the
 *   surface's own state is not what they are reading.
 */
export function recordIsBlank(args: {
  /** Calls, learnings and documents all loaded, and all zero. */
  emptyRecord: boolean;
  /** null while the standing read is unresolved. */
  standing: { rules: number; pendingRules: number; memoriesTotal: number } | null;
  /** null while the compounding read is unresolved. */
  rescoreCount: number | null;
  /** null while the graph read is unresolved; true when it holds no nodes. */
  graphEmpty: boolean | null;
  drilling: boolean;
}): boolean {
  const { emptyRecord, standing, rescoreCount, graphEmpty, drilling } = args;
  if (drilling) return false;
  if (!emptyRecord) return false;
  if (standing === null || rescoreCount === null || graphEmpty === null) return false;
  return (
    graphEmpty &&
    rescoreCount === 0 &&
    standing.rules === 0 &&
    standing.pendingRules === 0 &&
    standing.memoriesTotal === 0
  );
}

/**
 * The height the canvas is about to take, held while the read is in flight so
 * the tabs do not slide 500px down the page under the reader's cursor. It
 * mirrors GraphForceCanvas's own recess verbatim, including the border and the
 * sink, so the reservation is the exact shape of the thing arriving rather than
 * a grey box approximating it. If that file's height ever changes, this follows.
 *
 * The thin and empty states collapse this reservation UPWARDS, which is the
 * cheap direction: it never pushes away something the reader is already looking
 * at, and it happens once, on workspaces that have no map to wait for anyway.
 */
const PREVIEW_RESERVE =
  "flex items-center justify-center rounded-mrd-card border border-mrd-line bg-mrd-sink";
/* The height is the one value that has to stay a literal: it is copied from
 * GraphForceCanvas and there is no spacing token for "as tall as a canvas". */
const PREVIEW_RESERVE_HEIGHT = { height: "clamp(420px, 58vh, 640px)" };

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
  /* SCOPED TO THE ACTIVE WORKSPACE, 2026-08-10, and it was a live leak rather
   * than a theoretical one.
   *
   * `getCompounding` took no workspace argument at all, and this key named no
   * workspace either, so one cache entry was shared by every workspace a person
   * belongs to and the server returned whatever RLS membership permitted. RLS on
   * `learnings` is `is_workspace_member(workspace_id)` -- membership, not the
   * workspace you are standing in -- so a member of a seeded demo workspace read
   * its rows while looking at their real one.
   *
   * Measured in production before the fix: 5 users belong to more than one
   * workspace, 4 of them to a seeded demo workspace, and one REAL account saw 21
   * learnings of which 5 were demo. The headline directly above this read --
   * "Real outcomes have re-scored N calls" -- was inflated by roughly a quarter
   * with fiction, on a live account, sitting above a sub whose counts were
   * correctly scoped. Two scopes in one paragraph, with nothing marking which was
   * which.
   *
   * That is the worst failure available on this particular surface, because the
   * surface exists to argue that the record compounds. A wrong number is
   * recoverable; a believable number about somebody else's work is not
   * auditable by the person reading it. */
  const compounding = useQuery({
    queryKey: ["compounding", activeWorkspaceId],
    queryFn: () => fCompounding({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  // Whether the crew reaches for what the record learned. THE KEY IS THE ONE
  // StandingRules AND CrewCarries ALREADY USE, so this is a third reader of one
  // request rather than a third request. It has to stay character-identical to
  // the key in StandingRecord.tsx: a drifted key would silently double the read
  // and could show two different numbers on one screen.
  const fStanding = useServerFn(getStandingRecord);
  const standing = useQuery({
    queryKey: ["brain-standing", activeWorkspaceId],
    queryFn: () => fStanding({ data: { workspaceId: activeWorkspaceId } }),
  });
  // The record DRAWN. THE KEY IS CHARACTER-IDENTICAL TO GraphCanvasView's, so
  // this page and the Graph tab are two consumers of ONE request: the preview
  // costs nothing extra on any visit that opens the tab, and the tab it hands
  // off to now opens on a cache hit instead of a cold read. Skipped entirely
  // while a drill is open, because that is a state the preview never draws in.
  const drilling = Boolean(decision || learning);
  const fGraph = useServerFn(getKnowledgeGraph);
  /* Workspace-scoped for the same reason as `compounding` above. `artifact_lineage`
   * carries a `workspace_id` column that this read never used, and its RLS is
   * `auth.uid() = user_id`, so the graph was per-USER and merged across every
   * workspace a person belonged to.
   *
   * The engineering lane found the subtler half of this while fixing the server
   * side, and it is worth recording because the obvious fix would not have caught
   * it: scoping the EDGE queries alone still walks the wrong graph, because the
   * auto-focus picks the caller's most recent decision across all workspaces and
   * every edge is then walked from that anchor. The focus picker and the
   * lineage-anchored fallback are both scoped too. The fallback matters most --
   * it fires exactly when the primary focus finds no edges, which is the normal
   * state of a young workspace, so the unscoped path was the one most likely to
   * run on a new real account. */
  const graphQ = useQuery({
    queryKey: ["knowledge-graph", focusKind ?? null, focusId ?? null, activeWorkspaceId],
    queryFn: () =>
      fGraph({
        data: {
          focusKind: focusKind as GraphNodeKind | undefined,
          focusId,
          workspaceId: activeWorkspaceId ?? undefined,
        },
      }),
    enabled: !drilling,
  });

  // Fresh search object: every drill param clears on a tab switch.
  const setTab = (next: Tab) => navigate({ search: { tab: next } });

  const counts = brain.data?.counts ?? null;
  const learningCount = stats.data?.learnings ?? null;
  const summary = compounding.data?.summary ?? null;
  const recall = standing.data?.recall ?? null;
  const countsLoading = brain.isLoading || stats.isLoading;
  // A HALF-DEAD READ IS STILL A DEAD READ, AND USED TO BE SILENT (2026-08-10).
  // This was `(brain.isError || stats.isError) && !counts && learningCount ===
  // null`, which required BOTH reads to have produced nothing. So when
  // getBrainStatus succeeded and getCompanyBrainStats died, `counts` was truthy,
  // the banner never drew, and the only thing on screen about the outcomes was
  // the headline speaking confidently for a number nobody had. The whole reason
  // `Failed` exists is that "nothing here" and "we could not find out" are
  // different facts, and the reader could not tell which one they were looking
  // at. Either read failing draws it, and the sentence below names which half.
  const countsFailed = brain.isError || stats.isError;
  // `standing.isLoading` joins the loading flag so the head holds on "Brain"
  // until the recall rung is decidable. Without it the title would settle on
  // the manifest and then jump to the recall claim a moment later, which reads
  // as the page correcting itself.
  const headline = recordHeadline(
    summary,
    recall,
    counts?.decisions ?? null,
    learningCount,
    countsLoading || compounding.isLoading || standing.isLoading,
  );
  const lastAdded = day(brain.data?.latest);
  const emptyRecord =
    counts !== null &&
    learningCount !== null &&
    counts.decisions === 0 &&
    learningCount === 0 &&
    counts.docs === 0;

  /**
   * The rest of the substrate: real numbers already fetched, none of them on
   * the surface, all of them one click down.
   *
   * AND NOW A DOOR EACH, where one exists. Six counts of things the crew reads
   * before it acts, every one of them a plain span, on a page whose entire job
   * is recall: the surface told you there were 41 signals and made you go and
   * find them. `open` is absent rather than pointed at something adjacent
   * wherever the product genuinely has nowhere to send you, and the two that
   * are absent are named honestly here rather than quietly aimed at Brain
   * itself:
   *
   *   meetings     THE MEETINGS SURFACE IS GONE. /meetings and /meetings/$id
   *                301 to /brain?tab=calendar, and `calendar` resolves through
   *                LEGACY_TABS to `decisions`, which renders the decision
   *                ledger and not one meeting. So the count is real and there
   *                is nothing behind it. Linking it to Decisions would be the
   *                broken deep link this same pass is repairing on Discover.
   *   saved notes  `rag_chunks` rows with source_kind 'finding'. They are read
   *                by retrieval, not browsed: no surface in the product lists
   *                them, so there is no page to open.
   */
  const substrate: { label: string; value: number; open?: () => void }[] | null =
    counts && stats.data
      ? [
          {
            label: "chat threads",
            value: stats.data.conversations,
            open: () => navigate({ to: "/threads" }),
          },
          { label: "signals", value: counts.signals, open: () => navigate({ to: "/discover" }) },
          { label: "meetings", value: counts.meetings },
          { label: "specs", value: counts.prds, open: () => navigate({ to: "/plan" }) },
          { label: "saved notes", value: counts.findings },
          {
            label: "live connections",
            value: stats.data.connectorsLive,
            open: () => navigate({ to: "/settings", search: { section: "connections" } as never }),
          },
        ]
      : null;

  // Only the counts that found something. See the note at the render for why a
  // zero draws no cell at all: it is this surface's own diff rule ("a zero
  // rendered as if it were a finding"), and six of them at once was the whole
  // disclosure on every real account.
  const substrateShown = (substrate ?? []).filter((s) => s.value > 0);

  // The newest call an outcome re-ranked. Drawn only when it is real, and not
  // on the Outcomes tab, where the feed below already leads with it.
  const latest = summary?.latest ?? null;
  const showRecord = !decision && !learning && tab !== "learnings" && latest !== null;

  // What the record is DOING, and where it is not doing it yet. The recall half
  // stands down on the Outcomes tab for the identical reason the recess above
  // does: CrewCarries says it there, one line above the list it is about.
  const guidance = guidanceLines({
    recall,
    rescoreCount: summary ? summary.rescoreCount : null,
    recallSaidBelow: tab === "learnings" && !learning,
  });

  // Whether the record is drawn on this screen, and in what state. See the
  // header section "THE MAP COMES UP OFF TAB FIVE" for why the answer is a
  // region here rather than a reordered tab or a new default.
  const preview = graphPreview({
    graph: graphQ.data ?? null,
    loading: graphQ.isLoading,
    failed: graphQ.isError,
    onGraphTab: tab === "graph",
    drilling,
  });

  /**
   * Whether the whole surface is in its zero state, decided from the reads
   * themselves rather than from `preview`, which is deliberately `hidden` on
   * the Graph tab and would otherwise make the collapse depend on which door
   * the reader happened to be behind.
   */
  const graphEmpty: boolean | null = graphQ.data ? graphQ.data.nodes.length === 0 : null;
  const blank = recordIsBlank({
    emptyRecord,
    standing: standing.data
      ? {
          rules: standing.data.rules.length,
          pendingRules: standing.data.pendingRules,
          memoriesTotal: standing.data.recall.memoriesTotal,
        }
      : null,
    rescoreCount: summary ? summary.rescoreCount : null,
    graphEmpty,
    drilling,
  });

  // The second line is the SIZE of the record: what the headline no longer
  // says, because a manifest is not a claim. Every clause is a count that
  // loaded, so a failed read contributes no clause and never a zero.
  //
  // EVERY CLAUSE THAT HAS A TAB IS A DOOR TO IT. Calls, learnings and docs each
  // name a table that one of the five tabs directly below renders, and all
  // three were plain spans: the page counted them at you and then asked you to
  // work out which door held them. Three counts, three tabs, no new
  // destinations invented. "Last added" keeps no door, because a date is not a
  // place.
  const sizeClauses: ReactNode[] = [];
  if (counts && counts.decisions > 0) {
    sizeClauses.push(
      <Door key="calls" title="Open the decisions" onClick={() => setTab("decisions")}>
        <Figure>{counts.decisions}</Figure> {counts.decisions === 1 ? "call" : "calls"}
      </Door>,
    );
  }
  if (learningCount) {
    sizeClauses.push(
      <Door key="learnings" title="Open the outcomes" onClick={() => setTab("learnings")}>
        <Figure>{learningCount}</Figure> {learningCount === 1 ? "learning" : "learnings"}
      </Door>,
    );
  }
  if (counts && counts.docs > 0) {
    sizeClauses.push(
      <Door key="docs" title="Open what is written" onClick={() => setTab("docs")}>
        <Figure>{counts.docs}</Figure> docs
      </Door>,
    );
  }
  if (lastAdded) {
    sizeClauses.push(
      <span key="added">
        last added <Figure>{lastAdded}</Figure>
      </span>,
    );
  }
  //
  // ON A BLANK RECORD THE HEAD IS ONE SENTENCE. It used to carry "The first
  // call you settle lands here, with what it was based on", which is a good
  // line and was the FIRST of the five stacked admissions. The one empty state
  // below says the same thing with the act, the control and a case worked
  // through, so keeping it here would be the stack starting in the title.
  const sub: ReactNode = blank
    ? undefined
    : emptyRecord
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
      {/* THE PAGE'S RHYTHM, WHICH USED TO BELONG TO A COMPONENT.
          `Block` carried the gap between regions in `.sp-block`'s own margin,
          so every region on this page was spaced by the part rather than by the
          composition. Meridian's `Region` draws no outer margin on purpose: the
          page decides how far apart its own regions sit, and it decides ONCE
          here. `gap-mrd-7` is 40px, the step the space ramp reserves for the
          distance BETWEEN groups, which is always visibly larger than the
          distance within one. That growth is the whole reason the ramp is not a
          linear 4/8/12/16: uniform padding everywhere is the single most
          reliable way to make a dense product look machine-generated. */}
      <div className="flex flex-col gap-mrd-7">
        {/* THE AUTONOMOUS PATH, VISIBLE, ON THE SURFACE THAT IS ABOUT THE CREW.
          Renders nothing unless a mission row in this workspace is running, so
          it costs no space when the crew is idle and cannot show a step that
          did not happen.

          THIS PAGE HAD NO LIVE ELEMENT AT ALL, which on the record surface is
          the sharpest version of the gap: every agent mark it draws above the
          tabs is at rest -- the guidance rows here, the rules in
          `StandingRules` -- and a mark at rest is precisely what claims
          nothing is happening. Every sentence here is in the past tense, what
          the record has changed and what the crew carries, while the crew that
          wrote it could be mid-run with no sign of it anywhere on the page.

          It sits above the headline, where Decide, Build and Ship put it, so
          the line reads in the same place whichever station you walked in
          from. It does NOT claim the running mission is reading this record:
          it reports a mission mid-run and nothing more. See use-live-agents.ts. */}
        <CrewWorking />
        <RecordHead title={headline} sub={sub} />

        {/* A NAKED "Try again" IS NOT AN ERROR STATE. This rendered one ghost
          button under the headline and said nothing at all about what had
          failed, so the page read as a working page with a stray control on it:
          the headline had already fallen back to the honest manifest, the tabs
          below still worked, and nothing told the reader that the counts they
          could not see were counts we could not read. `ReadFailed` is the part
          for exactly this, and its whole reason for existing is that "nothing
          here" and "we could not find out" are different facts.

          AND IT NAMES WHICH HALF DIED. Two reads feed the head: getBrainStatus
          carries the calls and the docs, getCompanyBrainStats carries what has
          come back. Losing one of them is the common case and it used to draw
          nothing at all, which left the reader with a head that had quietly
          stopped counting one half without saying so. A banner that says "the
          size of the record did not load" while half the size is rendered two
          lines above it is its own small lie, so each half is named. */}
        {countsFailed ? (
          <ReadFailedLine
            onRetry={() => {
              void brain.refetch();
              void stats.refetch();
            }}
          >
            {brain.isError && stats.isError
              ? "The size of the record did not load. Everything it holds is still behind the five doors below."
              : brain.isError
                ? "The count of calls and docs did not load, so the line above leaves them out. Both are still behind the doors below."
                : "The count of what has come back did not load, so the line above leaves it out. Every outcome is still behind the Outcomes door below."}
          </ReadFailedLine>
        ) : null}

        <RetentionLine />

        {/* THE RECESS OPENS ITSELF NOW. This was a hand-rolled twelve-line inline
          button reset wrapped around the Record, which is the precise
          duplication the primitives were written to end: Record has carried its
          own `onClick` since the audit, it renders a real <button> with the
          reset in the stylesheet, and it keeps the div and the button pixel
          identical so nothing reflows when a record becomes openable. A button
          wrapping a button-shaped thing also meant the hover lift the recess
          defines never fired, because the outer element was the one being
          hovered.

          THE PRIORITY MOVE IS A DIFF, so it wears the diff. "priority +3" was
          rendered in flat metadata grey while the diff shape colours the
          identical signal everywhere else in the product, which taught the eye
          that a re-ranking here is a different kind of fact from a re-ranking
          anywhere else. Green for a bet the outcome pushed up, red for one it
          pushed down, and NOTHING when the outcome moved it nowhere: a "+0" is
          a zero rendered as if it were a finding, which is the rule `Delta`'s
          own guard already states.

          IT NO LONGER SITS INSIDE A REGION. The wrapper existed only to buy the
          gap above it out of `.sp-block`'s margin; the page's own flex rhythm
          gives it the same distance and this recess is not a section with a
          heading, so it should never have been one. */}
        {showRecord && latest ? (
          <RecordSpeaks
            title="Open this outcome"
            onClick={() => navigate({ search: { tab: "learnings", learning: latest.id } })}
            evidence={
              <>
                {latest.delta !== 0 ? (
                  <Diffstat
                    added={latest.delta > 0 ? latest.delta : 0}
                    removed={latest.delta < 0 ? -latest.delta : 0}
                    unit="points of priority"
                  />
                ) : (
                  "priority unchanged"
                )}
                {day(latest.created_at) ? ` · ${day(latest.created_at)}` : ""}
              </>
            }
          >
            {verdictLine(latest.verdict, latest.opportunity_title ?? "A call you shipped")}{" "}
            {latest.summary}
          </RecordSpeaks>
        ) : null}

        {/* WHERE THE RECORD IS REACHING THE WORK. Above the tabs, because it is
          true whichever door you are behind, and above StandingRules because
          this is the mechanism that has data on every workspace today while a
          standing rule is the distilled thing that comes later: the crew reads
          the record back, and THEN the steward turns the pattern into a rule
          every agent carries. Cause, then consequence, in that order.

          NOTHING HERE IS A STAT STRIP. The substrate disclosure at the foot of
          this page is the scanning grid and keeps that shape; these are
          attributed lines, which is this system's grammar for who did what,
          because every line is an event or the honest absence of one. The mark
          is on every row including the "not yet" ones: it names whose behaviour
          the line is about, and a mark at rest is precisely what claims nothing
          is happening right now.

          A row is clickable only when it has somewhere real to go, and the one
          door here is already-open on the Outcomes tab, so it stops being an
          affordance there rather than becoming one that does nothing. */}
        {blank ? (
          /* THE ZERO STATE IS THE MAJORITY VIEW, SO IT IS DESIGNED AS THE PRIMARY
           ONE. This single region stands in for the four that used to stack
           here, and it is built the way an operator reads: not a description of
           what the record does, and not an apology, but the act, the control by
           the words printed on it, and one case carried the whole way through
           so the reader can see what this page looks like when it is working.

           NO TILE READS ZERO. There is no count anywhere in here. A "0" tells
           nobody to do anything, and the space it costs is space this sentence
           needs.

           THE DOOR IS THE FIRST REAL ACT, not a settings step. Capture is where
           the record genuinely starts: every later link on this surface is
           written by the work moving, so pointing anywhere else would be
           inventing an onboarding the product does not have. */
          <Region title="How the first thing gets onto the record">
            <NothingYet
              action={
                <Action variant="primary" onClick={() => navigate({ to: "/discover" })}>
                  Capture a signal
                </Action>
              }
            >
              Nothing here is set up in advance. The record fills from the work: open Discover, type
              what you heard and where from, and press <b>Capture</b>. Everything on this page is
              written by the crew as that moves.
              <span className="mt-mrd-4 block">
                Worked through: you capture &ldquo;three trials asked for SSO this week&rdquo;. That
                becomes a bet, the bet becomes a spec, the spec ships, and on Learn you press{" "}
                <b>Record it</b> to say how it landed. From that one pass this page holds a call you
                can search, an outcome with the calls that led to it, a map with the thread drawn
                between them, and a rule the crew reads before it acts next time.
              </span>
            </NothingYet>
          </Region>
        ) : null}

        {!blank && guidance.length > 0 ? (
          <Region title="What the record has changed so far">
            {guidance.map((g) => (
              <RecordLine
                key={g.key}
                mark={<CrewMark slug={null} name="the crew" />}
                lead={g.lead}
                sub={g.sub}
                onClick={
                  g.door === "outcomes" && tab !== "learnings"
                    ? () => setTab("learnings")
                    : undefined
                }
              />
            ))}
          </Region>
        ) : null}

        {/* What changed BECAUSE of all that. The outcome speaks in the recess
          above; this is the sentence the record has since written into every
          agent's prompt. Cause, then consequence, and it stands above the tabs
          because it is true whichever door you are behind.

          Stands down on a blank record, where its own empty state ("Nothing
          standing yet...") was the third of the five stacked admissions and the
          one region above says what fills it. `blank` already requires zero
          active rules AND zero pending drafts, so nothing this region would
          have drawn is being hidden. */}
        {!blank ? <StandingRules /> : null}

        {/* THE RECORD, DRAWN, and the last thing before the doors.

          Every other region on this page states the record's work in a
          sentence. This one shows it, and it is the only element in the product
          that does: the four core work surfaces render agent work entirely as
          text, and the whole visual vocabulary for "an agent is working" is a
          breathing dot and a rotating glyph. That made an 80 KB physics canvas
          with typed edges, a real time scrubber and per-edge attribution into
          the best-kept secret in the app, three levels down.

          It sits UNDER StandingRules rather than higher because the recess and
          the rule above it are a deliberate pair, outcome then consequence, and
          the map is not allowed to split them. It sits ABOVE the tabs for the
          same reason StandingRules does: it is true whichever door you are
          behind, and here it also hands off into them.

          THE LABEL NAMES THE OUTCOME. "Graph" is the tab's name and a shape;
          what you get from it is the answer to what led to what.

          It stands down on a blank record for the same reason StandingRules
          does: `blank` requires a graph with no nodes at all, so the only state
          this region could be in there is its own "Nothing is linked yet"
          empty, which was the fourth of the five stacked admissions. Its
          loading, failed, thin and drawn states are all untouched, because each
          of them makes `blank` false. */}
        {!blank && preview.state !== "hidden" ? (
          <Region
            title="What led to what"
            sub={
              preview.state === "drawn" ? (
                <>
                  <Figure>{preview.nodes}</Figure> pieces of work and the{" "}
                  <Figure>{preview.edges}</Figure> links between them. Double click any one to open
                  it on the full map, with the reason the link was drawn and the agent that drew it.
                </>
              ) : undefined
            }
            more={preview.state === "drawn" ? "Open the full map" : undefined}
            onMore={() => setTab("graph")}
          >
            {/* A read in flight, holding the shape of what is coming. */}
            {preview.state === "loading" ? (
              <div className={PREVIEW_RESERVE} style={PREVIEW_RESERVE_HEIGHT}>
                <Reading>Drawing what the record connects.</Reading>
              </div>
            ) : null}

            {/* NOT an empty state. The map exists; this read of it failed. */}
            {preview.state === "failed" ? (
              <ReadFailedLine onRetry={() => void graphQ.refetch()}>
                The map did not load. Nothing it draws is lost, and the Graph tab still holds it.
              </ReadFailedLine>
            ) : null}

            {/* THE STATE EVERY NEW WORKSPACE IS IN. Naming the act that draws the
              first thread is the difference between a surface that reads as
              broken and one that reads as waiting for you. The act named is one
              the product genuinely performs: Discover clustering a signal onto
              a bet writes that lineage row itself. */}
            {preview.state === "empty" ? (
              <NothingYet
                action={
                  <Action variant="primary" onClick={() => navigate({ to: "/discover" })}>
                    Turn a signal into a bet
                  </Action>
                }
              >
                Nothing on the record is linked to anything else yet. The first thread is drawn the
                moment one piece of work comes from another: a signal becomes a bet, a bet becomes a
                spec, an outcome comes back on a call you shipped.
              </NothingYet>
            ) : null}

            {/* Enough to count, not enough to be a shape. Said plainly, with the
              full map still one click away, so the thin state hides nothing the
              tab used to offer. */}
            {preview.state === "thin" ? (
              <NothingYet
                action={
                  <Action variant="quiet" onClick={() => setTab("graph")}>
                    Open the map
                  </Action>
                }
              >
                {preview.edges === 1 ? "One link is" : `${preview.edges} links are`} on the record
                so far, which is a list and not yet a shape. The map draws itself as the work
                connects, and every thread on it carries why it was drawn.
              </NothingYet>
            ) : null}

            {/* The canvas itself, and the ONLY place the heavy module is
              referenced, so nothing above ever pays to load it. */}
            {preview.state === "drawn" && graphQ.data ? (
              <Suspense
                fallback={
                  <div className={PREVIEW_RESERVE} style={PREVIEW_RESERVE_HEIGHT}>
                    <Reading>Drawing what the record connects.</Reading>
                  </div>
                }
              >
                <GraphRecordPreview
                  graph={graphQ.data}
                  onOpenNode={(kind, id) =>
                    navigate({ search: { tab: "graph", focusKind: kind, focusId: id } })
                  }
                />
              </Suspense>
            ) : null}
          </Region>
        ) : null}

        {/* THE FIVE DOORS. The open one is marked with `--mrd-select`, which is
          the stop the system reserves for a thing that has been picked, and NOT
          with `--mrd-hover`. meridian.css names that substitution as a recurring
          bug in this codebase: hover is a 4.5% whisper meant to be barely
          perceptible under a pointer, and everything rendered below this strip
          is about exactly which door is open, so it has to be unmistakable on
          the dark ground. `.sp-tabs` drew it with a legacy underline and could
          not be told apart from the surface's own rules. */}
        {/* Meridian's `Tabs` since 2026-08-15, replacing Brain's own
            `RecordDoors`. That copy declared `role="tablist"` and `role="tab"`
            and carried neither a roving tab stop nor arrow keys, so it PROMISED
            a keyboard that did not exist: a reader was told "tab, 1 of 5",
            pressed an arrow, and nothing moved. These are real tabs by every
            test -- the panel below swaps wholesale, there is no "all", and the
            choice combines with nothing -- so the promise is now kept rather
            than withdrawn. */}
        <Tabs
          group="brain-record"
          tabs={TABS.map((id) => ({ id, label: TAB_LABEL[id] }))}
          active={tab}
          onSelect={setTab}
          label="What the record holds"
        />

        <TabPanel group="brain-record" active={tab}>
          <Suspense fallback={<TabSkeleton />}>
            {tab === "decisions" &&
              (decision ? <DecisionDetail id={decision} /> : <DecisionsPanel />)}

            {tab === "learnings" &&
              (learning ? (
                <LearningDetail id={learning} />
              ) : (
                <div className="flex flex-col gap-mrd-7">
                  <CompoundingPanel />
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
                </div>
              ))}

            {/* What we MADE, next to what we decided and learned. This tab draws
            its own regions and its own rhythm rather than sitting inside one,
            because its first region is the shelf's own claim plus the scoping
            control and its second is the one item in focus. */}
            {tab === "artifacts" && <ArtifactsView />}

            {tab === "docs" && (
              <div className="flex flex-col gap-mrd-7">
                <Region title="Brief">
                  <BriefPanel />
                </Region>
                <Region title="Documents">
                  <DocsPanel />
                </Region>
              </div>
            )}

            {tab === "graph" && <GraphPanel focusKind={focusKind} focusId={focusId} />}
          </Suspense>
        </TabPanel>

        {substrate ? (
          <Disclosure label="The rest of the substrate" id="brain-substrate">
            {/* THE SURFACE'S OWN RULE, APPLIED TO ITS OWN GRID. The diff on the
              record recess above refuses to draw a "+0" because "a zero
              rendered as if it were a finding" is a lie about what was found.
              This grid was breaking that rule six times at once: on a real account today
              every one of these reads 0, so the disclosure opened onto six
              cells saying nothing, in the system's SCANNING shape, which
              promises there is something here to scan.

              A count of zero is also not information. Nobody does anything
              differently for "0 meetings", so the cell costs its space and
              buys nothing, and the one sentence it is replaced by at least
              names what would fill it. So: a zero draws no cell, and when
              every one of them is zero the region is one sentence instead of a
              grid. `substrate` itself is null until both reads land, so a
              count we could not make never reaches this and never renders as a
              zero either. */}
            {substrateShown.length > 0 ? (
              <>
                <p className="mb-mrd-4 text-[12.5px] text-mrd-mute">
                  What the crew reads before it acts, beyond the five doors above.
                </p>
                {/* A GRID, which is the system's shape for things that are SCANNED
                  rather than read down: nineteen items in a column is nineteen
                  rows of scrolling and the same nineteen at four across is five.
                  Deliberately NOT a RecordsTable, which is the shape for a list
                  nobody can scan by eye; six counts is exactly the size a person
                  takes in at a glance, and a sortable grid with a sticky head
                  over six rows is machinery around a fact.

                  A cell that opens something is a real <button>, so it is
                  tabbable, it answers Space and Enter and it takes the system
                  focus ring, none of which a styled <span> with an onClick would
                  have. A cell that opens nothing stays a div and never lights up
                  under the cursor: an affordance is a promise, and `meetings`
                  and `saved notes` have nowhere to send anybody.

                  TINTED, NEVER BORDERED. Six bordered boxes in one region is six
                  bordered containers, and the standard caps a region at one. It
                  reads as a cell because the ground under it changes, and these
                  sit at `sink` because the disclosure already raised the ground
                  they are on. */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-mrd-3">
                  {substrateShown.map((s) => {
                    const body = (
                      <>
                        <span className="block text-[17px] leading-tight text-mrd-ink">
                          <Figure>{s.value}</Figure>
                        </span>
                        <span className="mt-0.5 block text-[12px] text-mrd-mute">{s.label}</span>
                      </>
                    );
                    return s.open ? (
                      <button
                        key={s.label}
                        type="button"
                        onClick={s.open}
                        className="rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4 text-left transition-colors hover:bg-mrd-lift"
                        style={{ transitionDuration: "var(--mrd-d-press)" }}
                      >
                        {body}
                      </button>
                    ) : (
                      <div key={s.label} className="rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
                        {body}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* NOT AN EMPTY STATE, AND THAT IS THE WHOLE POINT OF THE COMPONENT.
               "Nothing is here" and "this cannot have anything in it yet" send a
               person in opposite directions, and the second one has exactly one
               act that changes it. `NeedsSetup` is the Meridian part for that
               third fact, and it was written after production was found with 39
               of 43 work items standing at the first station for want of a
               connected source. It carries no accent, which is correct: orchid
               means a decision is yours to make, and plugging something in is
               setup, not judgement.

               The copy is passed rather than defaulted, because this region
               knows something the component cannot: WHICH six things are empty.
               `substrate` is null until both reads land, so a count we could not
               make never reaches here and never renders as a zero. */
              <NeedsSetup
                kind="no-source"
                title="The crew has nothing else to read yet"
                body="No threads, no signals, no meetings, no specs and nothing connected. This fills on its own as you work, and a connected source starts it filling without you."
                action={
                  <Action
                    variant="primary"
                    onClick={() =>
                      navigate({ to: "/settings", search: { section: "connections" } as never })
                    }
                  >
                    Connect a source
                  </Action>
                }
              />
            )}
          </Disclosure>
        ) : null}
      </div>
    </Surface>
  );
}
