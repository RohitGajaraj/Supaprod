import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ApprovalCard, type ApprovalQuestion } from "@/components/meridian/ApprovalCard";
import { Chat, type ChatTurn } from "@/components/meridian/Chat";
import { CodeBlock, type CodeToken } from "@/components/meridian/CodeBlock";
import { ContextCards, type ContextChunk } from "@/components/meridian/ContextCards";
import { DiffTable, type DiffTableRow } from "@/components/meridian/DiffTable";
import { FilterTable, type Facet } from "@/components/meridian/FilterTable";
import { FineTuneCard, type FineTuneField } from "@/components/meridian/FineTuneCard";
import { Delta, Entity, InsightCards, type Insight } from "@/components/meridian/InsightCards";
import { LoadingState } from "@/components/meridian/LoadingState";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import {
  PromptBar,
  type PromptCommand,
  type PromptModel,
  type PromptSource,
} from "@/components/meridian/PromptBar";
import { RecommendationCard, type Recommendation } from "@/components/meridian/RecommendationCard";
import { NoPromotions, PromotionCard } from "@/components/meridian/PromotionCard";
import { RunTimeline, type TimelineEvent } from "@/components/meridian/RunTimeline";
import { ToolStream, type ToolStreamRow } from "@/components/meridian/ToolStream";
import { PlanCard, type PlanStep } from "@/components/meridian/PlanCard";
import { PlanGate } from "@/components/meridian/PlanGate";
import { AgentInbox, type AgentSession } from "@/components/meridian/AgentInbox";
import {
  Action,
  Actions,
  Approve,
  BulkBar,
  Cell,
  Grid,
  Pre,
  Value,
} from "@/components/meridian/surface-parts";
import { useSelection } from "@/components/shell/use-selection";
/* The mark OF the thing being named, rather than a letter that was to hand. The
   catalog cell is the one place a brand hue is earned: you are scanning twenty
   products to find one, so the provider IS the subject. */
import { ProviderMark } from "@/components/connections/provider-marks";
import { Dialog } from "@/components/meridian/Dialog";
import { Spend } from "@/components/meridian/Spend";
import { MarkStack } from "@/components/meridian/marks";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Flowchart, flowFromSteps, type FlowEdge, type FlowNode } from "@/components/meridian/Flowchart";
import { RunMap, type RunMapStation } from "@/components/meridian/RunMap";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";
import {
  RecordStatus,
  RecordTag,
  RecordsTable,
  type RecordColumn,
  type RecordTone,
} from "@/components/meridian/RecordsTable";
import { Search } from "@/components/meridian/Search";
import { SelectionActions, type SelectionPhase } from "@/components/meridian/SelectionActions";
import { SidebarNav, type RailItem } from "@/components/meridian/SidebarNav";
import { StalledWork, type StalledItem } from "@/components/meridian/StalledWork";
import { TaskRows, type Task } from "@/components/meridian/TaskRows";
import { Thinking, type ThinkingRow } from "@/components/meridian/Thinking";
import { Field, Input, Textarea, Checkbox, Choices } from "@/components/meridian/forms";

/*
 * THE MERIDIAN GALLERY, at /meridian.
 *
 * WHY THIS ROUTE EXISTS, and it is not developer convenience. The design record
 * for this product contains two designs rejected in one evening, and the note
 * explaining why says: "Both rejected designs were reasoned from tokens and
 * neither was ever rendered." The third was screenshotted in both grounds
 * before it was offered, and that is the only reason a broken disabled state on
 * paper was caught rather than shipped.
 *
 * So every Meridian component gets looked at here, in BOTH grounds, side by
 * side, before it is wired to anything. It has earned its keep three times: it
 * caught a panel invisible on the dark ground only, it is where the accent was
 * chosen from four rendered candidates rather than from a description, and it
 * found that EVERY primary button in the system had an invisible label on
 * paper. `bg-mrd-solid` with `text-mrd-ink` measures 11.26:1 on dark and
 * 1.19:1 on paper, because both tokens invert across the grounds and therefore
 * travel together instead of apart. Twelve controls, nine files.
 *
 * ── WHY NO GATE COULD HAVE CAUGHT THAT ──────────────────────────────────
 * Keep this sentence, because it is the argument for this route and it
 * generalises past design. THE SUITE ASKED WHETHER EACH COMPONENT BEHAVED. IT
 * NEVER ASKED WHETHER ANYONE HAD LOOKED AT IT. Every test passed, tsc was
 * clean, and no fixture had ever handed a primary button an action, so the
 * broken state was never rendered by anything, in any run, on any machine.
 *
 * Lane 0 hit the same shape one layer down on the same day and named it first:
 * a green test guarding a thing nobody reaches, found four separate times, each
 * asking "does this unit behave correctly" and none asking "is this unit
 * reached". A flag no code could write. A scope no code could grant. A cap with
 * zero callers. Coverage is not reach, and reach is not a look.
 *
 * The cost of this route is one file nobody ships to a customer. The cost of
 * not having it is a design reasoned entirely from tokens, which this product
 * has already paid twice.
 *
 * BOTH GROUNDS ON ONE PAGE. `[data-theme="light"]` is an attribute selector,
 * not a document-level switch, so wrapping a panel in it re-resolves every
 * --mrd-* token inside that panel to the paper values. Nothing is written
 * twice; the same component instance renders in both columns, which is what
 * `Pair` is for.
 *
 * NOT IN THE RAIL, deliberately. This is a workbench, not a station.
 *
 * IT LIVES BEHIND AUTH, and it briefly did not. Making it public was a
 * shortcut so a headless browser without a session could screenshot it, and two
 * repo invariants caught it inside one test run, both correctly:
 *
 *   route-inventory  every PUBLIC route must be reachable by an inbound link.
 *                    A workbench nothing links to is exactly the orphan that
 *                    guard exists to find. Behind `_authenticated` it is not a
 *                    public route and the question does not arise.
 *   reserved-slugs   a root path shadows the workspace-slug namespace. This one
 *                    applies EITHER WAY and is not solved by moving the file,
 *                    so it is reserved in a migration alongside this surface,
 *                    following the `boundary` precedent. Without that row, a
 *                    workspace called "meridian" would find /meridian resolving
 *                    to this gallery instead of to their workspace: a silent,
 *                    account-specific routing collision.
 *
 * The right way to look at it is to open it in a browser that HAS a session,
 * not to remove the session requirement.
 *
 * ── THE RULE FOR THE FIXTURES BELOW ─────────────────────────────────────
 * Every empty state is drawn, and it is drawn FIRST. That is not tidiness. It
 * is what production looks like on 2026-08-14: 296 decisions carrying exactly
 * one forecast and none resolved, zero rows of agent memory of kind outcome,
 * and 39 of 43 work items standing at the first station because no source is
 * connected. The dense case on this page is hypothetical. The empty case is the
 * product. Where a component can tell a failed read apart from an empty one,
 * both are drawn side by side, because the entire reason that distinction
 * exists is that the two must not look alike.
 *
 * The content is real too. Titles are the ones the product actually carries,
 * long enough to wrap and truncate the way real ones do. Invented sample text
 * is uniformly short and uniformly polite, and it hides exactly the failures
 * this page is here to catch.
 */

export const Route = createFileRoute("/_authenticated/meridian")({
  component: MeridianGallery,
});

const NOW = Date.UTC(2026, 7, 14, 8, 30) as number;
const H = 3_600_000;
const D = 24 * H;

/*
 * Real data, not fixtures. These are actual pending gates and the actual work
 * each one holds up, measured in production on 2026-08-14. Invented sample text
 * is uniformly short and uniformly polite, and it hides exactly the wrapping
 * and truncation problems real titles cause.
 */
const STALLED: StalledItem[] = [
  {
    id: "g1",
    asking: "Grouping signals",
    since: NOW - 86 * H,
    blocking: "Homeowners cannot tell a real outage from a firmware reboot",
    allowLabel: "Let it group",
  },
  {
    id: "g2",
    asking: "Grouping signals",
    since: NOW - 83 * H,
    blocking: "Checklist steps vanish when the crew drops signal in a basement",
    allowLabel: "Let it group",
  },
  {
    id: "g3",
    asking: "Grouping signals",
    since: NOW - 52 * H,
    blocking: "SDK install is a drop-off cliff",
    allowLabel: "Let it group",
  },
  {
    id: "g4",
    asking: "Reading new signals",
    since: NOW - 9 * H,
    blocking: "Checkout and notification friction in the homeowner app",
    allowLabel: "Let it read",
  },
  {
    id: "g5",
    asking: "Finding patterns",
    since: NOW - 30 * H,
    reason: "source",
  },
];

const SHORT = STALLED.slice(0, 3);

function Ground({
  label,
  light,
  style,
  children,
}: {
  label: string;
  light?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      {...(light ? { "data-theme": "light" } : {})}
      className="rounded-mrd-card border border-mrd-line bg-mrd-bg p-6"
      style={{ boxShadow: "var(--mrd-shadow-card)", ...style }}
    >
      <p className="mb-4 font-mrd-mono text-[11px] tracking-wide text-mrd-mute uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="border-t border-mrd-line py-10">
      <header className="mb-6">
        <h2 className="text-[20px] leading-tight font-medium text-mrd-ink">{title}</h2>
        <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-mrd-prose text-mrd-body">{note}</p>
      </header>
      {children}
    </section>
  );
}

/*
 * The same children rendered into both grounds. Written once so the two columns
 * cannot drift: the whole value of this page is that any difference you see is
 * the ground doing it, never the fixture.
 */
function Pair({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Ground label="Dark">{children}</Ground>
      <Ground label="Paper" light>
        {children}
      </Ground>
    </div>
  );
}

/* One labelled case inside a ground. Several usually stack in one panel. */
function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mrd-mono text-[10.5px] tracking-wide text-mrd-faint uppercase">{label}</p>
      {children}
    </div>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8">{children}</div>;
}

/* A neutral control for the states that carry one. Never the accent: setup is
 * not a decision, and a suggestion sitting on screen is not asking for anyone. */
function Button({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-mrd-ctl bg-mrd-solid px-3 py-1.5 text-[13px] font-medium text-mrd-on-solid transition-opacity hover:opacity-90"
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {label}
    </button>
  );
}

const noop = () => {};

/* ── work items, the row shape three panels share ──────────────────────── */

type Station = "Discover" | "Decide" | "Plan" | "Design" | "Build" | "Ship" | "Learn";
type WorkState = "waiting" | "running" | "shipped" | "failed" | "starved";

type WorkItem = {
  id: string;
  title: string;
  station: Station;
  state: WorkState;
  /** Epoch ms this last moved. Compared against NOW so the page is stable. */
  since: number;
};

const STATION_ORDER: Station[] = ["Discover", "Decide", "Plan", "Design", "Build", "Ship", "Learn"];

const WORK_TONE: Record<WorkState, RecordTone> = {
  waiting: "you",
  running: "agent",
  shipped: "pass",
  failed: "fail",
  /*
   * `hold`, not `quiet`. This is the state 39 of 43 work items are actually in
   * — stopped for want of a connected source — and it rendered in the same
   * grey as a row with nothing to say. It is not your call, so it is not
   * orchid; it has not failed, so it is not red; and it is emphatically not
   * uninteresting, which is what grey claimed.
   */
  starved: "hold",
};

const WORK_LABEL: Record<WorkState, string> = {
  waiting: "Waiting on you",
  running: "Running",
  shipped: "Shipped",
  failed: "Failed",
  starved: "No source connected",
};

function heldFor(since: number): string {
  const ms = Math.max(0, NOW - since);
  if (ms < D) return `${Math.round(ms / H)}h`;
  return `${Math.floor(ms / D)}d`;
}

const WORK: WorkItem[] = [
  {
    id: "w1",
    title: "Homeowners cannot tell a real outage from a firmware reboot",
    station: "Decide",
    state: "waiting",
    since: NOW - 86 * H,
  },
  {
    id: "w2",
    title: "Checklist steps vanish when the crew drops signal in a basement",
    station: "Decide",
    state: "waiting",
    since: NOW - 83 * H,
  },
  {
    id: "w3",
    title: "SDK install is a drop-off cliff",
    station: "Decide",
    state: "waiting",
    since: NOW - 52 * H,
  },
  {
    id: "w4",
    title: "Checkout and notification friction in the homeowner app",
    station: "Discover",
    state: "running",
    since: NOW - 9 * H,
  },
  {
    id: "w5",
    title: "Installers re-enter the same serial number three times on every job",
    station: "Discover",
    state: "starved",
    since: NOW - 30 * H,
  },
  {
    id: "w6",
    title: "Two of the four onboarding emails point at a page that no longer exists",
    station: "Discover",
    state: "starved",
    since: NOW - 31 * H,
  },
  {
    id: "w7",
    title: "Outage banner in the homeowner app",
    station: "Ship",
    state: "shipped",
    since: NOW - 5 * D,
  },
  {
    id: "w8",
    title: "Rewrite of the SDK install walkthrough",
    station: "Build",
    state: "failed",
    since: NOW - 2 * D,
  },
];

const WORK_COLUMNS: RecordColumn<WorkItem>[] = [
  {
    key: "title",
    header: "Work",
    width: "34ch",
    cell: (row) => row.title,
    sortValue: (row) => row.title,
  },
  {
    key: "station",
    header: "Station",
    width: "13ch",
    cell: (row) => <RecordTag label={row.station} />,
    sortValue: (row) => STATION_ORDER.indexOf(row.station),
  },
  {
    key: "state",
    header: "State",
    width: "22ch",
    cell: (row) => <RecordStatus tone={WORK_TONE[row.state]} label={WORK_LABEL[row.state]} />,
    sortValue: (row) => WORK_LABEL[row.state],
  },
  {
    key: "since",
    header: "Held for",
    width: "11ch",
    numeric: true,
    cell: (row) => heldFor(row.since),
    /* Epoch, never the printed string: "9h" sorts ahead of "5d" alphabetically. */
    sortValue: (row) => row.since,
  },
];

const WORK_FACETS: Facet<WorkItem>[] = [
  { key: "waiting", label: "Waiting on you", match: (row) => row.state === "waiting" },
  { key: "running", label: "Running", match: (row) => row.state === "running" },
  { key: "starved", label: "No source", match: (row) => row.state === "starved" },
  {
    key: "settled",
    label: "Settled",
    match: (row) => row.state === "shipped" || row.state === "failed",
  },
];

/* ── search ────────────────────────────────────────────────────────────── */

type SpecDoc = { id: string; title: string; where: string };

const SPECS: SpecDoc[] = [
  { id: "s1", title: "Outage banner in the homeowner app", where: "specs/outage-banner" },
  {
    id: "s2",
    title: "Offline checklist that survives a basement",
    where: "specs/offline-checklist",
  },
  { id: "s3", title: "SDK install walkthrough, second attempt", where: "specs/sdk-install" },
  { id: "s4", title: "Serial number capture on the installer app", where: "specs/serial-capture" },
  { id: "s5", title: "Onboarding email repair", where: "specs/onboarding-email" },
  { id: "s6", title: "Checkout friction in the homeowner app", where: "specs/checkout-friction" },
  { id: "s7", title: "Notification quiet hours", where: "specs/quiet-hours" },
  { id: "s8", title: "Firmware reboot notice on the device", where: "specs/reboot-notice" },
];

/* ── approvals ─────────────────────────────────────────────────────────── */

const APPROVAL_QUESTIONS: ApprovalQuestion[] = [
  {
    id: "aq1",
    ask: "Group these three signals under one work item?",
    pick: "one",
    options: [
      "Group all three",
      "Keep them separate",
      "Group the two outage reports and leave the install one alone",
    ],
  },
  {
    id: "aq2",
    ask: "Which sources may this group read from here on?",
    pick: "many",
    options: ["Support inbox", "App store reviews", "Install telemetry", "Field notes"],
    allowOther: true,
  },
];

/* ── recommendations ───────────────────────────────────────────────────── */

const REC_SURE: Recommendation[] = [
  {
    key: "r-sure",
    short: "Group the three outage reports under one work item",
    body: (
      <>
        All three describe the same failure from different ends: a homeowner sees a dead app, an
        installer sees a reboot, and neither can tell which happened. Grouping them puts one spec in
        front of one person instead of three.
      </>
    ),
    confidence: 0.86,
  },
];

const REC_UNSURE: Recommendation[] = [
  {
    key: "r-unsure",
    short: "Send the install drop-off to Plan without a decision",
    body: (
      <>
        The install telemetry group is larger than the inbox group, which usually means the drop-off
        is reaching people who never write in. It could also mean the telemetry double-counts a
        retry, and there is no way to settle that from here.
      </>
    ),
    confidence: 0.41,
  },
];

const REC_NULL: Recommendation[] = [
  {
    key: "r-null",
    short: "Checkout and notification friction in the homeowner app",
    confidence: null,
  },
];

const REC_RANKED: Recommendation[] = [
  {
    key: "r1",
    short: "Group the three outage reports under one work item",
    body: (
      <>
        All three describe the same failure from different ends. Grouping them puts one spec in
        front of one person instead of three.
      </>
    ),
    confidence: 0.86,
  },
  {
    key: "r2",
    short: "Group two and leave the install report on its own",
    confidence: 0.52,
  },
  { key: "r3", short: "Leave all three separate and revisit on Monday", confidence: 0.19 },
];

/* ── tasks ─────────────────────────────────────────────────────────────── */

const TASKS: Task[] = [
  {
    id: "t-run",
    label: "Reading the support inbox",
    status: "running",
    amount: "128 messages",
    step: 3,
    details: [
      { label: "Support inbox, since Friday 18:00", meta: "128" },
      { label: "App store reviews, August", meta: "46" },
    ],
  },
  {
    id: "t-done",
    label: "Grouping signals by symptom",
    status: "done",
    amount: "9 groups",
    details: [
      { label: "Homeowners cannot tell a real outage from a firmware reboot", meta: "41" },
      { label: "SDK install is a drop-off cliff", meta: "77" },
    ],
  },
  {
    id: "t-fail",
    label: "Writing the spec for the outage banner",
    status: "failed",
    details: [{ label: "The answer came back in a form this product could not read" }],
  },
  {
    id: "t-block",
    label: "Checkout and notification friction in the homeowner app",
    status: "blocked",
    amount: "86h",
    details: [{ label: "Held at Decide since 10 August, 18:31", meta: "86h" }],
  },
];

/* ── insights ──────────────────────────────────────────────────────────── */

const INSIGHTS: Insight[] = [
  {
    kind: "trend",
    key: "i-install",
    lead: (
      <>
        The call was made by <Entity name="rohit" by="you" /> on 28 July and carried out by{" "}
        <Entity name="build" by="agent" />. The forecast recorded at the gate was that install
        completion would clear 60 percent inside a fortnight. It settled at 71, which is{" "}
        <Delta tone="pass">+11pts</Delta> against the forecast.
      </>
    ),
    title: "Install completion after the walkthrough rewrite",
    verdict: "pass",
    series: [
      {
        id: "forecast",
        label: "Forecast at the gate",
        role: "forecast",
        values: [42, 46, 50, 54, 57, 59, 60],
      },
      {
        id: "actual",
        label: "What happened",
        role: "actual",
        values: [42, 44, 51, 60, 66, 69, 71],
      },
    ],
    /* The stat block reads the series through this, so a percentage arrives
       carrying its unit. Without it the headline said "71" beside a figure
       below reading "71%", which is two answers to one question. */
    format: (value: number) => `${value}%`,
    figures: [
      { label: "Forecast", value: "60%" },
      { label: "Settled at", value: "71%", tone: "pass" },
      { label: "Days to verdict", value: "14" },
    ],
    followUp: "What else did that gate change?",
  },
  {
    kind: "split",
    key: "i-standing",
    lead: (
      <>
        Where the work actually is, counted on 2026-08-14. Nothing here is a verdict on anyone: it
        is one reading of one workspace on one morning.
      </>
    ),
    title: "Where the 43 work items are standing",
    headline: "39 of 43",
    /*
     * THREE SEGMENTS, NOT TWO, and the third is here to be a test as much as a
     * fact. The reference's allocation card carries three (VAN / CHOC / MINT)
     * and its smallest is 4.7% — narrow enough that the inset ring, the sliding
     * wash and the rounded cap all have to still work in a sliver about 14px
     * wide. Ours carried two fat segments, so none of that was ever exercised
     * and the card looked finished while the hard case was untested.
     *
     * Each carries its own `amount`, so the hero figure answers the question
     * the selection asks. `tone` is doing real work here: held-for-want-of-a-
     * source is `hold`, shipped is `pass`, waiting on a person is `open` —
     * three different reasons a work item is where it is.
     */
    segments: [
      {
        id: "starved",
        label: "Held at Discover",
        percent: 88,
        amount: "39 items",
        detail:
          "Thirty-nine items have never left the first station, and the cause is the same one every time: no source is connected, so there is nothing for the crew to read. This is a setup gap, not a queue.",
      },
      {
        id: "deciding",
        label: "Waiting on a person",
        percent: 7,
        tone: "you" as const,
        amount: "3 items",
        detail:
          "Three items have reached Decide and stopped there. Each is holding one named piece of work, and the oldest has been standing since 18:31 on 10 August.",
      },
      {
        id: "shipped",
        label: "Shipped",
        percent: 5,
        tone: "pass" as const,
        amount: "1 item",
        detail:
          "One item went live, on 9 August: the outage banner in the homeowner app. It is the only thing in this workspace that has reached the end of the loop.",
      },
    ],
    followUp: "Which source would unblock the most of them?",
  },
  /*
   * The third card, which the first port left out. The reference's middle page
   * is an anomaly against a threshold; ours is the same shape on a fact this
   * product already records — a track's spend cap, and the run that went past
   * it. Two views, because the money is the symptom and the retry count is the
   * cause, and a reader who sees only the first will conclude the cap is too
   * low rather than that something was looping.
   */
  {
    kind: "threshold",
    key: "i-cap",
    lead: (
      <>
        The spend cap on the outage-group track was crossed on 2026-08-13, and the run kept going
        for eleven minutes after it. The cap held the bill; it did not stop the work.
      </>
    ),
    /* Short enough to sit beside the view toggle at this card's 344px without
       ellipsing. The card is `max-w-86`, which is the reference's own width. */
    title: "Outage-group spend",
    limit: 5,
    limitLabel: "$5.00 cap",
    views: [
      {
        id: "spend",
        label: "Spend",
        values: [0.42, 0.71, 0.95, 1.34, 2.08, 3.9, 5.62, 6.87],
        format: (v) => `$${v.toFixed(2)}`,
      },
      {
        id: "retries",
        label: "Retries",
        values: [0, 0, 1, 1, 2, 6, 11, 14],
        format: (v) => `${Math.round(v)}`,
      },
    ],
    figure: { value: "$6.87", over: "+$1.87 over", note: "on one track, 2026-08-13" },
    followUp: "What made that track retry fourteen times?",
  },
];

/* ── evidence ──────────────────────────────────────────────────────────── */

const CHUNKS: ContextChunk[] = [
  {
    id: "c1",
    title: "Homeowners cannot tell a real outage from a firmware reboot",
    body: "App went dark at about 9pm and I assumed the power was out again, so I did not call it in. Turned out the panel had rebooted itself for an update and everything was fine the whole time. There is no way to tell the two apart from the app.",
    extent: "241 characters",
    source: { label: "Support inbox, ticket 4471", kind: "MAIL", href: "#" },
    relevance: 0.91,
  },
  {
    id: "c2",
    title: "The same complaint from the installer side",
    body: "Crew logged a site visit for a dead system. Panel had rebooted after a firmware push and was healthy on arrival. Second one this month. We are driving out for nothing.",
    extent: "lines 12 to 18",
    source: { label: "Field notes, week 32", kind: "DOC", href: "#" },
    relevance: 0.78,
  },
  {
    id: "c3",
    title: "Reboot notices are written but never shown",
    body: "The firmware push already emits a reboot notice. Nothing on the homeowner surface subscribes to it, so the notice is produced and dropped.",
    extent: "lines 88 to 104",
    /* No relevance here on purpose: this one was pulled by hand, not scored. */
    source: { label: "device/firmware/push.ts", kind: "CODE", href: "#" },
  },
  {
    id: "c4",
    title: "An earlier attempt at the same problem",
    body: "A status pill was proposed in May and dropped because it needed a device heartbeat nobody was collecting yet. The heartbeat landed in July.",
    extent: "196 characters",
    source: { label: "Decision 2026-05-19", kind: "DOC" },
    relevance: 0.64,
  },
];

/* ── the proposed edit ─────────────────────────────────────────────────── */

/*
 * THE LAST THREE ROWS ARE THE OVERFLOW CASES, and they are here on purpose.
 *
 * The founder's report on 2026-08-15 was that long source names and two-line
 * text did not sit cleanly inside this container, and the reason the defect
 * survived a rendered review is that every fixture row was short enough to fit.
 * A table only proves it handles overflow if something in it overflows, so:
 *
 *   d5  a source name far past the pill's width. The pill is a fixed height, so
 *       this is the row that used to push a second line out through the bottom
 *       of the capsule.
 *   d6  a value that needs two lines in the widest column, which is the common
 *       real case rather than the pathological one.
 *   d7  an unbroken token with no spaces in it. This is the one a line clamp
 *       alone does NOT fix: with nothing to break on it runs straight out of
 *       the cell sideways, and only `break-words` stops it. Production ids and
 *       slugs look exactly like this.
 */
const DIFF_ROWS: DiffTableRow[] = [
  { id: "d1", cells: ["128", "Support inbox", "Homeowners cannot tell a real outage"] },
  { id: "d2", cells: ["46", "App store reviews", "Checkout and notification friction"] },
  {
    id: "d3",
    cells: ["31", "Field notes", "Checklist steps vanish in a basement"],
    change: "removed",
  },
  {
    id: "d4",
    cells: ["77", "Install telemetry", "SDK install is a drop-off cliff"],
    change: "added",
  },
  {
    id: "d5",
    cells: [
      "19",
      "Northfield Creamery field engineering escalations",
      "Install cannot be finished",
    ],
  },
  {
    id: "d6",
    cells: [
      "8",
      "Call recordings",
      "Installers abandon the checklist when a step needs a second person on site",
    ],
  },
  {
    id: "d7",
    cells: ["4", "Webhook replay", "signal_cluster_promotion_backfill_2026_08_outage_group"],
    change: "added",
  },
];

/* ── chat ──────────────────────────────────────────────────────────────── */

const CHAT_TURNS: ChatTurn[] = [
  {
    id: "turn-1",
    you: "Why has nothing moved past Discover this week?",
    steps: [
      {
        title: "Counted the work items",
        source: "43 items",
        duration: "0.4s",
        body: "Thirty-nine are standing at Discover. Four have moved past it, and three of those four are now held at Decide.",
      },
      {
        title: "Checked what each one is waiting for",
        source: "39 items",
        duration: "1.2s",
        body: "Every one of the thirty-nine is waiting on the same thing: no source is connected to the workspace, so there is nothing for the crew to read.",
      },
      {
        title: "Looking for the shortest way out",
        running: true,
        body: "Comparing which single source would release the most items.",
      },
    ],
  },
];

const CHAT_BUSY: ChatTurn[] = [
  { id: "turn-2", you: "Which gate should I answer first this morning?" },
];

/* ── traces ────────────────────────────────────────────────────────────── */

const STEP_ROWS: ThinkingRow[] = [
  { primary: "Read the support inbox", secondary: "128 messages" },
  { primary: "Grouped by symptom", secondary: "9 groups" },
  { primary: "Checking each group against the open work items" },
];

const REASONING_ROWS: ThinkingRow[] = [
  {
    primary:
      "Two of the nine groups describe the same failure from opposite ends. A homeowner sees a dead app and an installer sees a healthy panel, and neither can tell which of the two actually happened.",
  },
  {
    primary:
      "The install telemetry group is larger than the inbox group, which means the drop-off is reaching people who never write in at all.",
  },
  {
    primary:
      "A status pill was proposed for this in May and dropped for want of a device heartbeat. The heartbeat landed in July, so the objection no longer holds.",
  },
];

const SEARCH_ROWS: ThinkingRow[] = [
  { primary: "Homeowner app store reviews, August", secondary: "46", href: "#" },
  { primary: "Support inbox, ticket 4471", secondary: "mail", href: "#" },
  { primary: "Field notes, week 32", secondary: "doc", href: "#" },
];

const CODING_ROWS: ThinkingRow[] = [
  { primary: "Read", secondary: "src/server/discover/group.ts", mono: true },
  { primary: "Edited", secondary: "group.ts", mono: true, add: 34, del: 12 },
  { primary: "Edited", secondary: "signals.ts", mono: true, del: 9 },
  { primary: "Ran", secondary: "bun test discover", mono: true },
];

/* ── code ──────────────────────────────────────────────────────────────── */

const kw = (t: string): CodeToken => ({ t, c: "kw" });
const fn = (t: string): CodeToken => ({ t, c: "fn" });
const str = (t: string): CodeToken => ({ t, c: "str" });
const num = (t: string): CodeToken => ({ t, c: "num" });
const dim = (t: string): CodeToken => ({ t, c: "punc" });
/* The two roles the fixture was missing, which is why the block looked
   two-tone: a type and a comment are the stops that give code its structure. */
const typ = (t: string): CodeToken => ({ t, c: "type" });
const cmt = (t: string): CodeToken => ({ t, c: "comment" });
const plain = (t: string): CodeToken => ({ t });

const CODE_LINES: CodeToken[][] = [
  [
    kw("import type"),
    plain(" "),
    dim("{ "),
    typ("Signal"),
    dim(" }"),
    plain(" "),
    kw("from"),
    plain(" "),
    str('"./types"'),
    dim(";"),
  ],
  [],
  [cmt("// One cluster per symptom, and never fewer than three signals.")],
  [kw("const"), plain(" "), fn("SYMPTOM"), plain(" = "), str("/outage|reboot|offline/i"), dim(";")],
  [kw("const"), plain(" "), fn("MIN_GROUP"), plain(" = "), num("3"), dim(";")],
  [],
  [
    kw("export function"),
    plain(" "),
    fn("groupSignals"),
    dim("("),
    plain("input"),
    dim(": "),
    typ("Signal"),
    dim("[]) {"),
  ],
  [
    plain("  "),
    kw("const"),
    plain(" bySymptom = "),
    kw("new"),
    plain(" "),
    typ("Map"),
    dim("<"),
    typ("string"),
    dim(", "),
    typ("Signal"),
    dim("[]>()"),
    dim(";"),
  ],
  [
    plain("  "),
    kw("for"),
    plain(" ("),
    kw("const"),
    plain(" signal "),
    kw("of"),
    plain(" input) {"),
  ],
  [
    plain("    "),
    kw("const"),
    plain(" key = "),
    fn("SYMPTOM"),
    dim("."),
    fn("test"),
    dim("("),
    plain("signal"),
    dim("."),
    plain("text"),
    dim(")"),
    plain(" ? "),
    str('"outage"'),
    plain(" : signal"),
    dim("."),
    plain("source"),
    dim(";"),
  ],
  [
    plain("    bySymptom"),
    dim("."),
    fn("set"),
    dim("("),
    plain("key, ["),
    dim("..."),
    plain("(bySymptom"),
    dim("."),
    fn("get"),
    dim("("),
    plain("key"),
    dim(")"),
    plain(" ?? []), signal])"),
    dim(";"),
  ],
  [plain("  }")],
  [plain("  "), kw("return"), plain(" ["), dim("..."), plain("bySymptom]")],
  [
    plain("    "),
    dim("."),
    fn("filter"),
    dim("(("),
    plain("[, signals]"),
    dim(") =>"),
    plain(" signals"),
    dim("."),
    plain("length >= "),
    fn("MIN_GROUP"),
    dim(")"),
  ],
  [
    plain("    "),
    dim("."),
    fn("map"),
    dim("(("),
    plain("[key, signals]"),
    dim(") => ({"),
    plain(" key, signals "),
    dim("}));"),
  ],
  [plain("}")],
];

/* ── the composer ──────────────────────────────────────────────────────── */

const PROMPT_SOURCES: PromptSource[] = [
  { key: "inbox", name: "Support inbox", desc: "128 unread since Friday", connect: "done" },
  { key: "reviews", name: "App store reviews", desc: "homeowner app", connect: "done" },
  { key: "telemetry", name: "Install telemetry", desc: "not linked", connect: "needed" },
  { key: "notes", name: "Field notes", desc: "week 32" },
  { key: "attach", name: "Attach a file", attach: true },
];

const PROMPT_COMMANDS: PromptCommand[] = [
  { key: "spec", name: "/spec", desc: "draft the spec for a work item" },
  { key: "forecast", name: "/forecast", desc: "record what you expect to happen" },
  { key: "verdict", name: "/verdict", desc: "settle an outcome at Learn" },
];

const PROMPT_MODELS: PromptModel[] = [
  { key: "fast", name: "Fast", tag: "default" },
  { key: "deep", name: "Deep", tag: "slower" },
];

/* ── the rail ──────────────────────────────────────────────────────────── */

const RAIL: RailItem[] = [
  { key: "today", label: "Today" },
  { key: "approvals", label: "Waiting on you", waiting: 12 },
  { key: "discover", label: "Discover", section: "Loop", icon: "discover" },
  { key: "decide", label: "Decide", section: "Loop", icon: "decide", waiting: 12 },
  { key: "plan", label: "Plan", section: "Loop", icon: "plan" },
  { key: "design", label: "Design", section: "Loop", icon: "design" },
  { key: "build", label: "Build", section: "Loop", icon: "build" },
  { key: "ship", label: "Ship", section: "Loop", icon: "ship" },
  { key: "learn", label: "Learn", section: "Loop", icon: "learn" },
];

/* ── the surface being fine-tuned ──────────────────────────────────────── */

const FINE_FIELDS: FineTuneField[] = [
  { key: "w", label: "W", value: 360, min: 240, max: 720, suffix: "px" },
  { key: "h", label: "H", value: 96, min: 48, max: 240, suffix: "px" },
  { key: "pad", label: "Pad", value: 16, min: 0, max: 48, suffix: "px" },
  { key: "radius", label: "Rad", value: 12, min: 0, max: 32, suffix: "px" },
];

/*
 * SELECTION ACTIONS needs a live DOM `Range` over real prose, which is the one
 * thing a fixture array cannot be. So the passage is rendered here and the range
 * is taken off it after paint, which is exactly what a prose surface does with
 * the reader's own selection. Nothing about the component is stubbed; only the
 * gesture that would normally produce the range is.
 */
function SelectionCase({ phase, error }: { phase: SelectionPhase; error?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const [range, setRange] = useState<Range | null>(null);

  useEffect(() => {
    const node = mark.current;
    if (!node) return;
    const picked = document.createRange();
    picked.selectNodeContents(node);
    setRange(picked);
  }, []);

  return (
    <div ref={host} className="relative pb-14">
      <p className="text-[13px] leading-[1.75] text-mrd-prose text-mrd-body" style={{ maxWidth: "46ch" }}>
        The banner appears when the panel reports a reboot and disappears on its own once the panel
        answers again.{" "}
        <span ref={mark}>
          A homeowner should never have to work out whether a dark app means an outage or an update,
          because the device already knows which one it is.
        </span>{" "}
        The notice is emitted today and nothing subscribes to it.
      </p>
      <SelectionActions
        range={range}
        containerRef={host}
        phase={phase}
        error={error ?? null}
        onAction={noop}
        onInstruction={noop}
        onKeep={noop}
        onDiscard={noop}
        onRetry={noop}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Forms: the vocabulary Settings, Boundary and governance had nowhere
 * to port to. Stateful so the states are real rather than described.
 * ------------------------------------------------------------------ */

function FormsDemo() {
  /* The gallery renders every panel TWICE, once per ground, so a hard-coded
     id appears twice in one document and every `htmlFor` binds to whichever
     copy parses first. That is the exact defect `Field` exists to prevent,
     so the demo may not commit it. `useId` is per instance. */
  const uid = useId();
  const [name, setName] = useState("Homeowner platform");
  const [why, setWhy] = useState(
    "Cap the weekly spend so a runaway loop stops before it costs a month.",
  );
  const [ticked, setTicked] = useState(true);
  const [some, setSome] = useState(false);
  const [lens, setLens] = useState<"now" | "next" | "later">("next");
  const [reach, setReach] = useState<Array<"email" | "slack" | "inapp">>(["slack"]);

  const flip = (id: "email" | "slack" | "inapp") =>
    setReach((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-6">
        <Case label="Field and input">
          <div className="w-[280px]">
            <Field label="Workspace name" htmlFor={`${uid}-name`}>
              <Input
                id={`${uid}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name this workspace"
              />
            </Field>
          </div>
        </Case>
        <Case label="With a hint, and disabled">
          <div className="flex w-[280px] flex-col gap-4">
            <Field
              label="Weekly ceiling"
              hint="Dollars. A run that would cross it stops and asks."
              htmlFor={`${uid}-cap`}
            >
              <Input id={`${uid}-cap`} defaultValue="250.00" inputMode="decimal" />
            </Field>
            <Field
              label="Owner"
              hint="Only the workspace owner can change this."
              htmlFor={`${uid}-owner`}
            >
              <Input id={`${uid}-owner`} defaultValue="rohit@supaprod.ai" disabled />
            </Field>
          </div>
        </Case>
        <Case label="Textarea">
          <div className="w-[300px]">
            <Field label="Why this boundary exists" htmlFor={`${uid}-why`}>
              <Textarea
                id={`${uid}-why`}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                rows={3}
              />
            </Field>
          </div>
        </Case>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <Case label="Checkbox, three states">
          <div className="flex flex-col gap-3 text-[13px] text-mrd-prose text-mrd-body">
            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                id={`${uid}-c1`}
                checked={ticked}
                onChange={setTicked}
                label="Ask before an agent merges"
              />
              <span>Ask before an agent merges</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                id={`${uid}-c2`}
                checked={some}
                onChange={setSome}
                label="Select all rows"
                indeterminate={!some}
              />
              <span>Select all rows {!some ? "(some picked)" : ""}</span>
            </label>
            <label className="flex items-center gap-2.5 opacity-60">
              <Checkbox
                checked={false}
                onChange={noop}
                label="Locked by the workspace owner"
                disabled
              />
              <span>Locked by the workspace owner</span>
            </label>
          </div>
        </Case>

        <Case label="Choices: one of">
          <Choices
            mode="one"
            label="Where this sits on the roadmap"
            options={[
              { id: "now", label: "Now" },
              { id: "next", label: "Next" },
              { id: "later", label: "Later" },
            ]}
            value={lens}
            onChange={setLens}
          />
        </Case>

        <Case label="Choices: any of">
          <Choices
            mode="any"
            label="Where an approval reaches you"
            options={[
              { id: "email", label: "Email" },
              { id: "slack", label: "Slack" },
              { id: "inapp", label: "In app", title: "The bell in the header" },
            ]}
            value={reach}
            onChange={flip}
          />
        </Case>
      </div>
    </div>
  );
}

function MeridianGallery() {
  return (
    /*
     * The page sits in the RECESS and the panels sit on the CANVAS above it.
     * Painting panels `bg-mrd-bg` on a `bg-mrd-bg` page made the dark column
     * vanish as an object while the paper column read as a card: same token,
     * same code, invisible on one ground only. Found by rendering it.
     */
    <div className="min-h-screen bg-mrd-sink">
      <div className="mx-auto max-w-[1180px] px-8 py-12">
        <header>
          <h1 className="text-[32px] leading-tight font-semibold text-mrd-ink">Meridian</h1>
          <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-mrd-prose text-mrd-body">
            Every component, in both grounds, before it is wired to anything. One accent, and it
            says exactly one thing: a person is required. Green and red are outcome, never need.
          </p>
        </header>

        {/*
         * ── THE ACCENT PICKER IS GONE, 2026-08-15 ──────────────────────────
         *
         * This page used to open with "Pick the accent": four candidate hues
         * (Aqua, Coral, Chartreuse, Ice) rendered on eight grounds. It did its
         * job — orchid was chosen against those four on 2026-08-14, and
         * `meridian.css` records the comparison and marks it closed. It has
         * been a stale artifact ever since, and a workbench that opens by
         * asking a settled question reads as unfinished.
         *
         * It was also actively harmful, in a way worth writing down. Each
         * candidate overrode `--mrd-you` and `--mrd-you-dim` on its own
         * grounds, so eight of the page's twenty-six light grounds reported a
         * teal or a lime when asked what the accent was. A contrast sweep run
         * on 2026-08-15 sampled the FIRST light ground on the page, got Aqua,
         * and concluded the orchid dim stop was failing AA on paper. It was
         * not: measured on an honest ground it reads 4.26. An instrument aimed
         * at a preview will describe the preview.
         *
         * The comparison survives where it belongs: in `meridian.css`, which
         * states what was judged and why orchid won, and in git.
         */}
        <Panel
          title="Loading state"
          note="An elapsed figure, because what shipped says what is being read and never how long, so a slow job and a hung job are the same pixels. Three variants, and the timings differ on purpose: the drive cycle is shorter than its sweep so two fronts are always in flight, and the orbit is slower because one travelling cell at the same speed reads as a glitch."
        >
          <Pair>
            <div className="flex flex-col gap-5">
              <LoadingState label="Reading the record" variant="Drive" />
              <LoadingState label="Grouping signals" variant="Dots" />
              <LoadingState label="Writing the spec" variant="Orbit" />
            </div>
          </Pair>
        </Panel>

        {/*
         * ONE MARK NOW, AND THIS PANEL USED TO SHOW TWO.
         *
         * The comparison was real and it has been settled: the founder judged
         * the brand geometry here on 2026-08-19 and ruled it out, so the option
         * is deleted from the component rather than merely un-defaulted. There
         * is nothing left to put side by side, and a panel still offering the
         * choice would be a decision the product has already taken, re-opened.
         *
         * The four cases are now the four states this indicator actually has:
         * with a noun and a clock, with neither, and each of those roomy and
         * compact. Compact differs in the GAP alone; the type stop is the same
         * 13px in both, which is also `LoadingState`'s.
         */}
        <Panel
          title="Agent at work"
          note="A rotating verb, the noun it is working on, and how long it has been going. The mark is the reference's pixel lattice, tinted azure rather than the ink LoadingState uses: that one reports a job, which has no actor, and this one reports an agent. Never green, which reports an outcome. The brand geometry was the default here until 2026-08-19 and was ruled out in the room; the option is gone from the component, not just from this panel. Compact changes the gap and not the size, because shrinking type to save a row is the answer the ratchet forbids."
        >
          <Pair>
            <div className="flex flex-col gap-5">
              <AgentPulse
                label="Scout is reading the record"
                seed="scout"
                detail="14 signals"
                startedAt={Date.now() - 47_000}
              />
              <AgentPulse
                label="Scout is reading the record"
                seed="scout"
                detail="14 signals"
                startedAt={Date.now() - 47_000}
                compact
              />
              <AgentPulse label="Critique is reading the drawing" seed="critique" />
              <AgentPulse label="Critique is reading the drawing" seed="critique" compact />
            </div>
          </Pair>
        </Panel>

        <Panel
          title="Stalled work, full"
          note="Real gates measured in production on 2026-08-14. Twelve were pending, the oldest since 18:31 on 10 August, and nothing anywhere told anyone. Age drives the emphasis through elevation and weight as well as hue, so the oldest is still obviously the oldest in greyscale. One row is stopped for a different reason and carries AMBER rather than orchid: it is waiting on a source being connected, which is a condition changing rather than a decision anyone can make. Orchid there would send the reader hunting a button that does not exist, and grey — which is what it used to be — hid the most common state in the workspace."
        >
          <Pair>
            <StalledWork items={STALLED} now={NOW} />
          </Pair>
        </Panel>

        <Panel
          title="Stalled work, empty"
          note="Nothing stopped is the state everyone wants, so it gets one sentence and silence. No illustration, no exclamation, no call to action."
        >
          <Pair>
            <StalledWork items={[]} now={NOW} />
          </Pair>
        </Panel>

        <Panel
          title="Needs setup"
          note="A surface that cannot ask its question yet, which is not the same as one with nothing to show. Thirty-nine of forty-three work items are held at the first station for exactly this reason. Check that none of the three carries the accent: joining a workspace or linking a source is a setup act, and dressing it as a decision sends someone hunting for a call that does not exist. The third one names its cost beside the control rather than inside it."
        >
          <Pair>
            <Stack>
              <Case label="No workspace">
                <NeedsSetup
                  kind="no-workspace"
                  action={<Button label="Create a workspace" />}
                  thenWhat="Today opens on the work that moved overnight and the gates that did not."
                />
              </Case>
              <Case label="No source">
                <NeedsSetup
                  kind="no-source"
                  action={<Button label="Link a source" />}
                  thenWhat="the crew reads what your customers already sent you and groups it into named problems."
                />
              </Case>
              <Case label="Switched off, and it costs money">
                <NeedsSetup
                  kind="switched-off"
                  costsMoney
                  action={<Button label="Turn on grouping" />}
                  thenWhat="every new signal is grouped against the open work items as it arrives."
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Approval card"
          note="The question an agent stops to ask, and the fact three surfaces keep dropping: a machine has stopped and will not start again until a person answers. The empty case is first because it is the normal one and it is good news. In the asked case, look at where the accent is and is not: the standing marker carries it, a ticked option does not, and the confirm control takes it only once it can actually release the run."
        >
          <Pair>
            <Stack>
              <Case label="Nothing waiting">
                <ApprovalCard questions={[]} />
              </Case>
              <Case label="Two questions, one blocked run">
                <ApprovalCard
                  questions={APPROVAL_QUESTIONS}
                  subject="Homeowners cannot tell a real outage from a firmware reboot"
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Recommendation card, and the three confidence states"
          note="Production writes an unreadable model response as confidence zero, and a zero renders exactly like a considered judgment that scored low. The three cards below are the proof that is fixed: a meter means a reading was taken, the hollow ring means none exists, and the third card says so in words and offers Review rather than Approve, because there is nothing there to approve. The meter is azure on purpose, since it is the machine reporting on its own answer and not an outcome."
        >
          <Pair>
            <Stack>
              <Case label="Nothing proposed">
                <RecommendationCard question="Group these three signals?" options={[]} />
              </Case>
              <Case label="A reading was taken, and it is high">
                <RecommendationCard
                  question="Group the three outage reports under one work item?"
                  options={REC_SURE}
                />
              </Case>
              <Case label="A reading was taken, and it is low">
                <RecommendationCard
                  question="Send the install drop-off straight to Plan?"
                  options={REC_UNSURE}
                />
              </Case>
              <Case label="No reading exists">
                <RecommendationCard
                  question="What should happen to the checkout friction report?"
                  options={REC_NULL}
                />
              </Case>
              <Case label="Ranked, with alternatives to open">
                <RecommendationCard
                  question="How should the three outage reports be filed?"
                  options={REC_RANKED}
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Task rows, all four states adjacent"
          note="Running and blocked are the pair that matters, because both read as unfinished in a list and they demand opposite responses. They are separated twice over: by hue and by motion. Only the running ring turns, and the blocked ring is a closed circle rather than an arc, because an arc is a progress reading and there is no progress to report on work that has stopped. Check that the blocked row never reads as a failed one on either ground."
        >
          <Pair>
            <Stack>
              <Case label="Nothing has run">
                <TaskRows tasks={[]} />
              </Case>
              <Case label="Running, done, failed, blocked">
                <TaskRows tasks={TASKS} onRetry={noop} />
              </Case>
              <Case label="Same four as one bounded sheet">
                <TaskRows tasks={TASKS} variant="List" onRetry={noop} />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Insight cards"
          note="Zero rows of agent memory of kind outcome exist, so the first card is the one a reviewer will meet and the two below it are hypothetical shapes. The empty card states a labelled figure rather than a bare count, and it never says the product has learnt anything. The failed read below it is a separate composition on purpose: silence that means nothing has happened and silence that means we could not find out are opposite facts. On the chart, forecast is dashed and orchid because it is what a person believed, and the actual line takes an outcome colour only once it has settled."
        >
          <Pair>
            <Stack>
              <Case label="Nothing settled yet">
                <InsightCards settledOutcomes={0} awaitingVerdict={1} />
              </Case>
              <Case label="The station could not be read">
                <InsightCards
                  loadError="Learn stopped answering after thirty seconds."
                  onRetry={noop}
                />
              </Case>
              <Case label="A settled outcome, and a split">
                <InsightCards insights={INSIGHTS} onFollowUp={noop} />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Records table, and the four things a list can be"
          note="Nothing exists, a filter excluded everything, the read fell over, and the list is capped. All four are drawn because three of them have been shipped as the same blank box before. The head and the first column stay put while the rest scrolls, so a wide row never loses the title that identifies it. Sort on Held for: it sorts on epoch, not on the printed string, which is where nine hours would otherwise land ahead of five days."
        >
          <Pair>
            <Stack>
              <Case label="Nothing exists">
                <RecordsTable
                  rows={[]}
                  columns={WORK_COLUMNS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  emptyTitle="No work items yet"
                  emptyDetail="A work item appears once the crew reads a source and finds a problem worth naming."
                />
              </Case>
              <Case label="A filter excluded every row">
                <RecordsTable
                  rows={[]}
                  columns={WORK_COLUMNS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  isFiltered
                  totalBeforeFilter={43}
                  onClearFilter={noop}
                />
              </Case>
              <Case label="The read did not come back">
                <RecordsTable
                  rows={[]}
                  columns={WORK_COLUMNS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  failure={{ message: "The work items could not be read.", onRetry: noop }}
                />
              </Case>
              <Case label="Capped, selectable, sortable">
                <RecordsTable
                  rows={WORK}
                  columns={WORK_COLUMNS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  selectable
                  onSelectionChange={noop}
                  maxRows={5}
                  footer="Counted on 2026-08-14. Thirty-nine of forty-three are held at the first station."
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Filter table"
          note="The chips carry counts and no colour. A count of the running rows is not itself a machine working, so painting it says something untrue before a word is read, and a per-status palette would have to invent the one hue this system does not have. Press a chip and watch two things: the counts do not move, because they are taken from the whole set rather than the view, and an empty result says a filter hid the rows rather than that the workspace is empty."
        >
          <Pair>
            <Stack>
              <Case label="Eight rows, five ways to narrow them">
                <FilterTable
                  rows={WORK}
                  columns={WORK_COLUMNS}
                  facets={WORK_FACETS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  emptyTitle="No work items yet"
                  emptyDetail="A work item appears once the crew reads a source and finds a problem worth naming."
                />
              </Case>
              <Case label="The read did not come back, so no chips">
                <FilterTable
                  rows={[]}
                  columns={WORK_COLUMNS}
                  facets={WORK_FACETS}
                  rowKey={(row) => row.id}
                  caption="Work items in this workspace"
                  failure={{ message: "The work items could not be read.", onRetry: noop }}
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Search"
          note="Three shipped surfaces list everything in the workspace with no way to find one thing. Search answers show me the one I already have in mind; the chips above answer show me the ones like this. Type something that matches nothing and the panel says so rather than going blank, and the cap under the list states both real numbers instead of quietly stopping at five."
        >
          <Pair>
            <Stack>
              <Case label="Nothing to search">
                <Search<SpecDoc>
                  items={[]}
                  itemKey={(item) => item.id}
                  itemText={(item) => item.title}
                  label="Search specs"
                  placeholder="Search specs"
                  emptyTitle="No specs yet"
                  emptyDetail="A spec is written at Plan, once a work item has been through a gate."
                />
              </Case>
              <Case label="Eight specs, at rest. Type to see matches and the cap at five">
                <Search<SpecDoc>
                  items={SPECS}
                  itemKey={(item) => item.id}
                  itemText={(item) => item.title}
                  label="Search specs"
                  placeholder="Search specs"
                  maxResults={5}
                  noun="spec"
                  onSelect={noop}
                />
              </Case>
              <Case label="The read did not come back">
                <Search<SpecDoc>
                  items={[]}
                  itemKey={(item) => item.id}
                  itemText={(item) => item.title}
                  label="Search specs"
                  placeholder="Search specs"
                  failure={{ message: "The specs could not be read.", onRetry: noop }}
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Context cards"
          note="The excerpts an answer leaned on, each with the document it came from as a real link. The match score is a neutral bar because it is a measurement and not a verdict: a green bar at seventy-one percent would read as this is correct when all it says is this was the closest text. One card carries no score at all, because it was pulled by hand and inventing a number for it would be the same failure the recommendation card exists to fix. The header count is what is on screen over what exists, never a fixed figure."
        >
          <Pair>
            <Stack>
              <Case label="No evidence attached">
                <ContextCards
                  chunks={[]}
                  emptyDetail="Evidence is attached when an agent reads a source on the way to an answer."
                />
              </Case>
              <Case label="A filter excluded every excerpt">
                <ContextCards chunks={[]} isFiltered totalBeforeFilter={9} onClearFilter={noop} />
              </Case>
              <Case label="The read did not come back">
                <ContextCards
                  chunks={[]}
                  failure={{ message: "The evidence could not be read.", onRetry: noop }}
                />
              </Case>
              <Case label="Four excerpts, three shown">
                <ContextCards chunks={CHUNKS} maxChunks={3} onShowAll={noop} />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Diff table"
          note="A proposed edit shown as what it moves, rather than as the after state with the before left to memory. Two colours are doing two different jobs and they must not be confused: the row tints report what the edit does to each row, and the mark in the header reports that the proposal is waiting on a person. The sweep is switched off here so both grounds are comparable in a still image; every fact it carries is in the tint and the strikethrough once it lands."
        >
          <Pair>
            <Stack>
              <Case label="Nothing proposed">
                <DiffTable
                  title="Proposed change to what Discover reads"
                  columns={["Signals", "Source", "Groups into"]}
                  widths={["21%", "31%", "48%"]}
                  rows={[]}
                  animate={false}
                />
              </Case>
              <Case label="Proposed, and waiting on you">
                <DiffTable
                  title="Proposed change to what Discover reads"
                  columns={["Signals", "Source", "Groups into"]}
                  widths={["21%", "31%", "48%"]}
                  rows={DIFF_ROWS}
                  animate={false}
                />
              </Case>
              <Case label="Applied, so the mark is gone">
                <DiffTable
                  title="Proposed change to what Discover reads"
                  columns={["Signals", "Source", "Groups into"]}
                  widths={["21%", "31%", "48%"]}
                  rows={DIFF_ROWS}
                  status="applied"
                  animate={false}
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Chat"
          note="The Ask pane opens on an empty thread every single time it is opened fresh, so that is the case composed hardest. The value over a plain transcript is that a reply is not one blob: each step names what it read and how long it took, so a person can see where an answer came from before deciding whether to believe it. One hue appears in the whole component, on the step still running, and nothing here asks for a person."
        >
          <Pair>
            <Stack>
              <Case label="Nothing asked yet">
                <div className="h-[280px] overflow-hidden rounded-mrd-card border border-mrd-line">
                  <Chat onSend={noop} onNewThread={noop} />
                </div>
              </Case>
              <Case label="Sent, nothing back yet">
                <div className="h-[280px] overflow-hidden rounded-mrd-card border border-mrd-line">
                  <Chat turns={CHAT_BUSY} onSend={noop} onNewThread={noop} />
                </div>
              </Case>
              <Case label="Three steps, the last one running">
                <div className="h-[360px] overflow-hidden rounded-mrd-card border border-mrd-line">
                  <Chat turns={CHAT_TURNS} onSend={noop} onNewThread={noop} />
                </div>
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Thinking, four variants"
          note="A trace that opens while the agent runs and shuts once it settles, which is the ordering the whole component argues for: the detail is worth watching while it happens and worth hiding the moment it is not. The settled label quotes a number only where one was measured. Only the last step of a running checklist carries the spinner, so where it has got to is one glance rather than a read."
        >
          <Pair>
            <Stack>
              <Case label="Steps, still going">
                <Thinking variant="Steps" rows={STEP_ROWS} working />
              </Case>
              <Case label="Reasoning, settled">
                <Thinking variant="Reasoning" rows={REASONING_ROWS} durationMs={7400} />
              </Case>
              <Case label="Search, settled">
                <Thinking
                  variant="Search"
                  rows={SEARCH_ROWS}
                  query="outage against firmware reboot"
                  moreCount={6}
                />
              </Case>
              <Case label="Coding, settled">
                <Thinking variant="Coding" rows={CODING_ROWS} onSelectRow={noop} />
              </Case>
              <Case label="A run that took no steps">
                <Thinking variant="Steps" rows={[]} />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Code block"
          note="It caps its own height and scrolls inside it, which is the whole reason it replaces a hand-rolled block that claimed to clip and did neither. The ladder is neutral and it ranks by how much of each line the agent decided: names and literals sit at the top, language scaffolding at the bottom, so it passes a greyscale test by being greyscale. One hue survives, on the caret, because a caret moving is the most direct statement in the product that a machine is writing right now."
        >
          <Pair>
            <Stack>
              <Case label="No code was produced">
                <CodeBlock filename="group.ts" language="TypeScript" lines={[]} />
              </Case>
              <Case label="Streaming, first line not in yet">
                <CodeBlock filename="group.ts" language="TypeScript" lines={[]} streaming />
              </Case>
              {/*
               * THE CASE THAT LEADS IS THE ONE A READER WANTS TO SEE.
               *
               * This panel used to open on "Fifteen lines against a 200px cap"
               * — a case that exists to prove a scroll constraint, not to show
               * the component. The founder read it exactly that way on
               * 2026-08-15: a 200px box with a gap in it, next to a reference
               * whose block is alive and beautiful. He was right that it was
               * the wrong thing to lead with; the cap is an engineering fact,
               * not the product.
               *
               * So the block is written out a line at a time and starts over,
               * which is what the reference does and what makes the caret and
               * the neutral ladder legible at all. The cap keeps its own case
               * below, where it belongs.
               */}
              <Case label="An agent writing it, a line at a time">
                <CodeBlock
                  filename="src/server/discover/group.ts"
                  language="TypeScript"
                  lines={CODE_LINES.slice(0, 9)}
                  revealPerLineMs={240}
                  loop
                />
              </Case>
              <Case label="A long file, capped so it scrolls in place">
                <CodeBlock
                  filename="src/server/discover/group.ts"
                  language="TypeScript"
                  lines={CODE_LINES}
                  maxHeight={200}
                />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Prompt bar"
          note="Asking about this workspace usually means naming what to look at, and pointing at a source beats describing it. Three states earn a hue and nothing else does: Connect, because linking a source is a job only a person can do; Connected, because that is an outcome; and the mic while it is live. Send stays neutral, since a saturated primary was tried twice here and rejected twice for spending the accent on chrome. Type an @ or a slash to open the menus, which cannot be forced from a prop."
        >
          <Pair>
            <Stack>
              <Case label="Rounded, nothing typed">
                <PromptBar
                  sources={PROMPT_SOURCES}
                  commands={PROMPT_COMMANDS}
                  models={PROMPT_MODELS}
                  modelKey="fast"
                  onModelChange={noop}
                  onAttach={noop}
                  onSend={noop}
                  onConnect={noop}
                  menuPlacement="below"
                />
              </Case>
              <Case label="Pill, with a file attached">
                <PromptBar
                  variant="pill"
                  sources={PROMPT_SOURCES}
                  commands={PROMPT_COMMANDS}
                  models={PROMPT_MODELS}
                  modelKey="deep"
                  attachments={["homeowner-outage-tickets-week-32.csv"]}
                  onRemoveAttachment={noop}
                  onAttach={noop}
                  onSend={noop}
                  onConnect={noop}
                  menuPlacement="below"
                />
              </Case>
              <Case label="No sources, no commands, no model picker">
                <PromptBar onSend={noop} placeholder="Ask about this workspace" />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Selection actions"
          note="Selecting a paragraph is the reference, which is why the bar attaches to the selection instead of living in a toolbar at the top of the page. The passage stays neutral while it is only selected, because selecting is not a status, and takes the agent hue once a machine has been handed it, so the words in flight are identifiable without reading the bar. A broken edit states the outcome and offers the way back rather than falling silently to the idle bar."
        >
          <Pair>
            <Stack>
              <Case label="Selected, nothing asked">
                <SelectionCase phase="idle" />
              </Case>
              <Case label="Handed to an agent">
                <SelectionCase phase="working" />
              </Case>
              <Case label="A result to keep or discard">
                <SelectionCase phase="result" />
              </Case>
              <Case label="The edit came back broken">
                <SelectionCase phase="idle" error="That edit did not come back." />
              </Case>
            </Stack>
          </Pair>
        </Panel>

        <Panel
          title="Fine-tune card"
          note="Where a person disagrees with one proposed number instead of rejecting a whole surface and asking again. The two header states carry the two hues that say who owns the value: azure while the agent's proposal stands, orchid once a person has overridden it. The edited state only exists after a drag or a keystroke, so drag a label sideways or type into a field to see the card and its field change hands."
        >
          <Pair>
            <div className="flex flex-wrap gap-6">
              <Case label="As proposed">
                <FineTuneCard
                  title="Outage banner"
                  fields={FINE_FIELDS}
                  layout="row"
                  choices={["Banner", "Panel", "Inline notice"]}
                  choiceLabel="Shape"
                  choice="Banner"
                  onChange={noop}
                  onLayoutChange={noop}
                  onChoiceChange={noop}
                />
              </Case>
              <Case label="No shape to pick">
                <FineTuneCard
                  title="Reboot notice"
                  fields={FINE_FIELDS.slice(0, 2)}
                  layout="col"
                  onChange={noop}
                />
              </Case>
            </div>
          </Pair>
        </Panel>

        <Panel
          title="Sidebar nav"
          note="The rail, collapsed to icons and expanded to one line of label. Tooltips are drawn rather than left to the browser, which waits about a second and cannot be tuned. The count is the twelve gates measured on 2026-08-14, and it is orchid because every one of them is waiting on a person; a run count would never go here, since a machine being busy is not a call for you. Collapsed, that count becomes a dot, and the accessible name carries it either way."
        >
          <Pair>
            <div className="flex flex-wrap items-start gap-6">
              <Case label="Expanded">
                <SidebarNav
                  items={RAIL}
                  workspaceName="Homeowner platform"
                  workspaceDetail="43 work items"
                  defaultActiveKey="decide"
                  onNavigate={noop}
                  onSearch={noop}
                  primaryAction={{ label: "New work item", onClick: noop }}
                />
              </Case>
              <Case label="Collapsed to icons">
                <SidebarNav
                  items={RAIL}
                  workspaceName="Homeowner platform"
                  workspaceDetail="43 work items"
                  defaultActiveKey="decide"
                  defaultCollapsed
                  onNavigate={noop}
                  onSearch={noop}
                  primaryAction={{ label: "New work item", onClick: noop }}
                />
              </Case>
            </div>
          </Pair>
        </Panel>

        <Panel
          title="Forms: field, input, textarea, checkbox, choices"
          note="The vocabulary every settings surface in the product was missing. beautifui.dev documents nineteen components and not one is a form control, so these are ported from the reference's own inputs instead: the Chat composer's sunken ground and stepping border, and Fine-tune's sunken track carrying a raised thumb. A field is a recess you fill, not a slab you press. Click into a text control and watch the border STEP UP rather than gain a ring, because a caret already answers where the keyboard is. The resting border is a measured token, not a chosen one: --mrd-edge reads 1.79:1 on dark and 1.65:1 on paper against the 3:1 a UI boundary owes, so --mrd-field was solved for at 3.05:1 both grounds and focus at 5.29. The two Choices modes differ in ARIA and keyboard, not decoration: one of is a radiogroup with a single tab stop and arrow keys, any of is independent toggles that keep Tab. Tab into each and try the arrows."
        >
          <Pair>
            <FormsDemo />
          </Pair>
        </Panel>

        <Panel
          title="Run timeline"
          note="The first component in the system with a clock on it, and the question it answers is about a moment: what happened at 03:12, and what was it waiting on until 03:40. The silences are the subject. A run that worked for 28 minutes and a run that idled for 28 minutes waiting on you produce the same list of steps everywhere else in this system, and here they do not: a stretch past three minutes gets its own row, dashed rather than solid so it survives greyscale, and its duration reads beside the phrase rather than in the clock column. That column is the correction worth knowing about, and it has been corrected twice: the first version put the duration inline in the label while every event row put its time in the clock column, and the second moved it into the clock column, where it did not fit. Measured, a six-hour silence set as 6h 11m 00s is 69px against a 40px column, so it wrapped to three lines and 52px tall against 17px for every clock beside it, and 28m 0s wrapped too, by 1.4px, on the case a green test was watching. No duration this product prints fits 40px, so the column now takes a wall clock and nothing else, and every row type is 28px tall. Every silence is phrased in the past tense as nothing or nobody plus a verb, so it can never be read as the chip beside it: a chip states the state work is in, a silence states what did not happen. A quiet machine is called quiet rather than stalled, because the record knows nothing was filed and does not know that anything stopped. Live mode ticks an elapsed count and nothing implies a percentage."
        >
          <Pair>
            <RunTimelineCases />
          </Pair>
        </Panel>

        <Panel
          title="Tool stream"
          note="Work arriving, as against work that has arrived. A component handed a finished array is the right shape for a run that has stopped and cannot be this one: its rows would all share one state, and its header would print a count that is only true once the run has stopped changing it. Nothing in this system showed a call happening, which is the largest hole in the one thing the product says it is for. Every row wears the mark of the thing it touched, derived from the tool's namespace rather than passed in: the source host for anything reaching the repo, a globe for a web read, a clipboard for our own checks. That is what replaced a bracket glyph drawn on every row regardless. The caption comes from the registry name through the product's own vocabulary, so prd.draft reads as drafting a spec, and a tool the vocabulary has never heard of shows its raw name, which is ugly on purpose because that is how a missing entry gets noticed rather than shipped. The one thing that moves is the chip that says Running, since the mark slot now carries an identity and spinning a source-host mark would say the host was turning. The stream follows the newest row and stops the instant you scroll up: scroll one of these up and the way back appears with a count on it."
        >
          <Pair>
            <ToolStreamCases />
          </Pair>
        </Panel>

        <Panel
          title="Plan card"
          note="The first forward-looking step display in the system. Everything else here reports what happened; this is what an agent commits to before it acts, which is the only place a person can set a boundary once instead of being asked fourteen times on the way down. Two of its six states exist nowhere else: a step nobody has started, and a step deliberately passed over. Both matter because the task vocabulary has neither, and its normaliser collapses anything it does not recognise to blocked, so under the old words the last step of a fresh plan would tell a reader it was already stuck. A skipped step carries its reason, and a skipped step with no reason says so out loud rather than letting an incomplete record look complete. Each step draws its station rather than naming it, because identity is shape here, and a step with no station falls back to the ring set. A chip appears only where something is running, waiting or broken: a finished step is said by its mark, since a plan of five with three done would otherwise carry four chips on five rows and the chip would stop meaning look here. The clock column is empty and held open, because a plan has no times yet and closing it would put these subjects fifty-four pixels left of the timeline's. Two controls now sit on a step, and which rows get them is the decision worth knowing about: skip is offered on anything that has not run, because it is the only way to disagree with one step without rejecting the whole plan, and approve only on a step that is itself asking, because on a merely pending step it would be a second button for the click the plan-level approve already makes. Both are quiet. The first version made the step's approve orchid, and rendered it read as the card's primary action and outshouted approving the plan, which inverts the argument the control exists inside; the row already carries the orchid chip, so the accent is said once rather than twice. A skip opens a reason field and cannot complete without one, because a skip with no recorded why is a decision that leaves no trace. Each step also carries what it will touch and whether it can be undone, in the same words the approvals queue uses. The alignment was measured rather than eyeballed: a mark sat 0.63 pixels below its subject on a row with no chip and 1.00 above it on a row with one, a 1.63 pixel swing alternating down the card, because a 22-pixel chip raises the line and the mark was pinned to the offset a chipless line needs. The line is 22 pixels on every row now and the mark is solved against that, so every row measures zero, and the five distinct row heights became three with each difference being content rather than accident."
        >
          <Pair>
            <PlanCardCases />
          </Pair>
        </Panel>

        <Panel
          title="Controls: the four faces, and the one that releases something"
          note="The first time these appear on this page, which is worth saying out loud: every surface in the product has been composing from them and nobody had looked at the four side by side in both grounds. Approve is a separate component rather than a fifth variant because it is the one control in the product that unblocks something, and orchid means exactly that. Destructive is new, and it is deliberately the quietest of the four: what protects a destructive act is distance plus a confirm, never volume, so it sits in the trailing slot with a wash rather than a slab. Its fill is eight per cent because that is what the label measures against, 4.64 at worst on a floating pane in the dark theme, where ten per cent lands exactly on the text floor and thirteen falls under it. Hover firms the border rather than deepening the wash, for the same reason. Tab through each row and watch the ring; press and hold to see the scale. The disabled row is the one that has caught real defects here, because a dead control that still shouts is promising something it will not do."
        >
          <Pair>
            <ControlCases />
          </Pair>
        </Panel>

        <Panel
          title="Dialog"
          note="The first Meridian surface that floats, and it exists because two tokens had never been spent by anything in Meridian: the scrim and the pane shadow are both live in the retired shell layer, three rules and five, and no component in this folder had a use for either, because nothing here floated. An earlier version of this note said the pane shadow had no caller at all, which was wrong, and the narrower claim is the sharper one anyway. Press a trigger and the dialog opens wearing this column's ground, which is the reason it does not portal to the body: the light theme here is an attribute on a subtree, so anything that leaves the subtree leaves the theme. Try the keyboard on it. Focus lands on the first control, Tab wraps at both ends and cannot get out, Escape closes, and focus returns to the trigger you pressed rather than to the top of the page, which is the half most dialogs drop. Clicking the dim area closes; clicking inside does not; pressing an action closes nothing by itself, because keeping the question open to say what went wrong is a real answer and only the caller knows when it applies. The confirming action is on the right in all four cases and it is the component that puts it there, not the caller: this is the one surface whose job is to make a click deliberate, and it cannot move that click from one question to the next. The last case is the one that broke the first build. Narrow the window until the panel is taller than the screen and the question stays reachable."
        >
          <Pair>
            <DialogCases />
          </Pair>
        </Panel>

        <Panel
          title="Spend"
          note="No Meridian primitive rendered spend, in a product that meters credits and enforces three separate ceilings, and the colour law names a cap nearly spent as its own example of amber. So the meaning had a token, the token had a documented example, and the example had no component. An earlier version of this note said nothing in the system rendered spend at all, which was wrong: the Spend panel in settings has done it since July, with its own idea of when to worry. That second idea is now gone and this component holds the only one, so the two surfaces cannot call the same workspace nearly spent and not nearly spent on the same numbers. This is also the one place a bar is allowed: the rule against them is that a coding agent cannot know how long it will take, and here both numbers are known exactly and the denominator does not move, so the proportion is the fact rather than a guess dressed as one. Amber arrives at eighty per cent, which is where the product already raises its approaching-cap notification, and red waits until the ceiling has actually been hit, because red reports a result. The state is said in words as well as in ink, and it is said as the amount left rather than as a percentage, since that is the figure a reader was about to work out. The last case is real: a workspace with no cap runs every station until the work finishes, and that is worth a sentence rather than an empty track."
        >
          <Pair>
            <SpendCases />
          </Pair>
        </Panel>

        <Panel
          title="Mark stack, one state per mark"
          note="The presence layer, and until now it took one state for the whole crew, so it could not say that Watch has finished while Research is still going and Challenge is waiting on you. That is not an edge case in a seven-station loop, it is the normal case, and a stack that can only say one thing about all three has to say the least true of them. The mixed stack is the new capability; the uniform one beside it is the old signature, untouched, because both live call sites still pass a shared state. The rule that matters is the one you cannot see unless it breaks: exactly one mark on a screen may blink for a person, so the stack gives the blink to the first mark that actually asks for it and dresses every later one in the same meaning without the animation. Per-mark state is a new way for a caller to ask three marks to blink at once, so the rule now runs over the resolved states rather than over the prop. Identity is still the glyph and status is still the hue, which is why the stack of four reads as four different agents rather than as four copies of a colour."
        >
          <Pair>
            <MarkStackCases />
          </Pair>
        </Panel>

        <Panel
          title="Status chips"
          note="Status stopped being coloured text on 2026-08-19 and the reason is a measurement rather than a preference. On the dark ground the five status words land between 5.81 and 10.08 against the canvas, so they separate and read plainly as colour. On paper they collapse into 5.06 to 6.00: every one clears the legibility floor, and none of them reads as colour any more. That is a salience failure and no value fixes it, because holding that contrast on white pins these hues near lightness 0.50 and the gamut has no chroma there. Solved for maximum in-gamut chroma, three of the five get worse and amber resolves to brown. So the colour occupies area instead of glyphs. The geometry is Task Rows' status pill to the pixel, because that component is the port of the reference's own live-status component and its pill is therefore the reference's status chip. What changed is only what fills it. Both grounds get a chip, since a chip on paper and bare text on dark would be two components wearing one name. Every word is inside its chip, so the whole set still reads with the colour removed."
        >
          <Pair>
            <StatusChipCases />
          </Pair>
        </Panel>

        <Panel
          title="The three views of one run, side by side"
          note="This panel exists to be checked rather than admired, and it is the only panel here whose subject is the relationship between components. Plan, timeline and stream are three views of one run and they shipped as three products: three mark sizes, three gutters, three subject sizes, two of them with no time column at all. Every one of those values was defensible alone and none was chosen against its neighbours, which is the failure this whole pass is aimed at. They share one grid now, read off Thinking, the reference's own dense trace: a forty-pixel clock column that is one spacing token wide, a fourteen-pixel mark, an eight-pixel gutter, a twenty-eight pixel row, one label scale and one place for a figure. The rail now crosses the four-pixel gap the stack opens between rows, which is why a run reads as a sequence rather than as a column of ticks, and the stream has one at all: it had none, so two views of one run were a sequence and a list. Read down the left edge of all three: the marks sit on one line, the subjects start on one pixel, and the rail is unbroken from the first mark to the last. If they ever stop doing that, one of the three has grown its own rhythm again."
        >
          <Pair>
            <OneSetCases />
          </Pair>
        </Panel>

        <Panel
          title="Flowchart, the twentieth component"
          note="The reference ships twenty components and Meridian had nineteen. This is the one that was missing, and it is the one the direction had already asked for: a Run Map, a canvas for watching rather than authoring. Its mechanics are read off the reference's own source rather than a screenshot, which matters because the interesting parts are invisible in a picture. Heights are measured, not declared, so a second line of description makes a node taller and every row below it moves down. Nodes sit at a fraction of the canvas width, so the whole thing is responsive without a breakpoint. Connectors are cubic beziers leaving downward and arriving downward, which is what makes two edges out of one branch separate immediately instead of crossing the cards, and the control distance scales with the run between a floor and a cap so a short hop still curves and a long one does not balloon. The one mechanic worth knowing about is the thirty pixel offset on a node's top anchor: the kind pill sits above the card inside the node's box, so an anchor taken from the top edge would stop in the air beside the pill. The cards drag, and that is a correction: this panel used to say they deliberately did not, on the grounds that position is derived from the graph. A graph you cannot rearrange is a picture, and sixteen connectors crossing each other is exactly the case where the derived layout is the one nobody can read, so grab a card and the connectors re-route onto its anchors and stay attached. What is still not ported is AUTHORING: nothing here creates a node, draws an edge or deletes anything, and nothing remembers where you put a card. The ground now carries a faint violet cast rather than reading as neutral grey, which is its own token because a map is not a step on the raised ladder: it is the one surface where a thing's position is information. It sits at exactly the recess lightness in both grounds and adds only chroma, so the dot pattern keeps the contrast it measured before the colour arrived. The one thing the reference does that Meridian still cannot is tint each node kind: amber already means stopped and waiting on a condition, so the kind comes through the station glyph and the pill is colourless."
        >
          <Pair>
            <FlowchartCases />
          </Pair>
        </Panel>

        <Panel
          title="The Run Map"
          note="The route a piece of work takes through the seven stations, and what came of each one. It exists to turn a policy into a control: the founder ruling that a skipped station is a decision on the record with a reason has been in force for weeks, SpineRoute.waived has carried the shape of it all along, and nothing in the product ever asked anyone for one. Here, taking a station off the route IS the gesture and the reason is the next beat, so the removal cannot complete without it, and a waiver that arrived without one says so out loud rather than looking complete. It is deliberately not a workflow builder: no palette, no conditions, no branches, no reordering, no adding. Subtraction with a reason is the only authoring gesture, because it is the only judgement the record actually needs from a person. Every node is labelled by outcome and never by tool, and that is enforced by absence rather than by a filter, since there is no field on a stop that could carry a tool name. Station identity is the glyph and there is no per-station hue anywhere in the file, which is law 4 and has been broken on this three separate times. Opening a station draws its steps through Flowchart rather than a second graph, and it opens below the spine, because a graph unfolding inside a horizontal row pushes every station after it sideways and the reader loses the route they were reading."
        >
          <Pair>
            <RunMapCases />
          </Pair>
        </Panel>

        <Panel
          title="The Plan Gate"
          note="One decision, three answers, and it replaces a queue rather than rendering one. The evidence it is built on is not ours: instrumented sessions show people make about seventy per cent of planning decisions and about twenty per cent of execution decisions, while one prompt sets off around ten agent actions, and ninety-three per cent of permission prompts get approved. A gate that gets clicked through is worse than no gate, because it manufactures the appearance of review and produces none of it. Our own record is worse than the study: six agents at a hundred per cent approval rate, and eleven tools asked a hundred and thirty times and answered zero times. So the whole decision moves to the one moment somebody actually wants it, before anything runs. The information model is ported from Claude Code's permission prompt rather than invented: numbered answers, a full sentence each, one keystroke each, and no accent on any of them. Its third answer is the one worth copying most exactly, because refusing and redirecting are the same act and it makes them one answer instead of a rejection followed by a separate instruction. Press 1, 2 or 3 anywhere on the card. Nothing here is orchid, and that is the rule rather than an omission: all three answers release the gate, so either all three wear the accent or none does, and a house favourite would be the product making the call it is asking you to make. A person is required, and that is said with a chip. Everything above the answers is editable first, because a gate you cannot redirect is a speed bump: skip a step, take a station off the route, and both ask why before they will complete. The ceiling sits directly above the answers and never below them, since deciding how much runs without you is deciding how much gets spent without you. It writes nothing at all: the answer leaves as a value and what it means is the caller's."
        >
          <Pair>
            <PlanGateCases />
          </Pair>
        </Panel>

        <Panel
          title="The Agent Inbox"
          note="Sorted by who needs you, never by who is working, and that is the whole design rather than a preference. The instinct in an agent product is to render every agent working at once because that is what looks impressive, and the evidence says it is the wrong surface: Cursor shipped eight-way parallelism with no compare-and-pick surface and per-turn review died with it, active human focus caps at three or four items, and Anthropic's own sizing guidance is that three focused teammates often outperform five scattered ones. Separately, review is now the bottleneck rather than generation: across twenty-two thousand developers over two years, throughput rose thirty-four per cent while median review time rose four hundred and forty-one per cent and changes merged with no review at all rose thirty-one per cent. So the four groups are what a session needs from a person, in that order, and an empty group is not drawn at all. The mechanics are lifted from Linear's inbox rather than invented: press j or k, or the arrows, and the selection walks the visible rows with one tab stop for the whole list, so sixty sessions are not sixty tab stops. Answering happens here and never navigates. A run that has gone quiet folds into one line past the third, and the line says how many rather than silently showing five of nine, but nothing waiting on a person and nothing that failed is ever folded away, because those are the rows worth reading. Failing is an outcome and not a fifth group: a failed run still says which of the four it needs, so it can be failed and waiting on you at the same time."
        >
          <Pair>
            <AgentInboxCases />
          </Pair>
        </Panel>

        <Panel
          title="The four parts 79 files were held on"
          note="Not a new idea, a port. 79 component files still import the retired component layer, they use 29 distinct symbols between them, and 25 of those already had a Meridian answer; these are the four that did not, and until they existed the four largest consumers in the tree could not move at all. What makes them worth looking at rather than reading is that half of each one's contract lived in the retired stylesheet and none of it is visible in the component: the grid's column measure, the cell's hover, the bar's height and the preformatted box's overflow. Two of those figures did not survive the port and both changed for a measurement. The cell's hover was computed from its own tint with one colour mix, which is elegant and lands the paper hover at 0.897 lightness, BELOW the recess at 0.932, so a hovered raised cell would have read as a recess on the ground where the whole ladder is tightest; Meridian's measured pair clears it at 0.938, so the tint and its hover now come out of one table instead of one formula and still cannot disagree. The selection bar was 38px because that was one scan row in a system whose rows were 38px, and Meridian's row floor is 44px, so the bar follows the intent rather than the number and still occupies exactly one row. The cell also takes Row's type scale outright, 14px ink over 13px mute, because a grid of cells and a list of rows are two arrangements of one information model and they shipped at two scales with no argument anywhere for either. The one value that deliberately does not follow Row is the weight on the lead: a row is read in sequence and a cell is one of twenty being scanned, and today's design is the floor. Read the clickable cells with a keyboard: they are real buttons, so they answer Space and Enter and take the ring, and the selection ring is drawn as an overlay rather than an inset shadow because the app-wide focus rule sets box-shadow to none and would erase it at the exact moment a reader arrived on it."
        >
          <Pair>
            <CatalogPartCases />
          </Pair>
        </Panel>

        <Panel
          title="The promotion card, where a lesson graduates"
          note="A lesson earned in one product, put forward to hold across the whole workspace, with a person ruling on it. This is the compounding claim drawn honestly: the card never says the product remembers anything, it says a lesson is being put forward and here is what settled it. The status grammar is the thing to check first, because the obvious answer is wrong. A proposed promotion is orchid and not green: green reports an outcome that has happened, and nothing has graduated until somebody presses. Press one of the three and the card hands over to green if it graduated, red if it was ruled out, and amber if it was only kept for now, which is the only pair of words this system has for did and did not. Press each of the three and read what comes back: the answer stops being a question and states what it caused, naming the consumers rather than confirming your click, because a judgment that vanishes teaches you it left no trace. The second card is the one a reviewer will actually meet in production, and it carries no controls at all. It asks resolveMemoryScope, the same module the retrieval path asks, and that module refuses to put a measurement forward however it was labelled: for an agency running three clients inside one workspace, one client's numbers reaching another client's ranking is a confidentiality breach rather than noise, and this card would be the one place a person could cause it. So the button is absent and the sentence explaining its absence is the one that module wrote for this exact prompt. The third card is every real row today: measured against the generated types, neither agent_memory nor learnings carries a product column, so the card says nothing records which product this was learned in rather than printing a product nobody wrote down. Never is a real third answer and not a louder no. Without it the same rejected lesson is put forward again forever, and the shipped write path has no verb for it yet, which is a gap rather than a reason to drop it. It wears the stop face and sits at the far edge, because what protects a removal here is distance and a confirm, and the confirm belongs to whoever wires the act this card deliberately cannot perform."
        >
          <Pair>
            <PromotionCardCases />
          </Pair>
        </Panel>
      </div>
    </div>
  );
}

/*
 * ── K-24, THE AGENT INBOX ───────────────────────────────────────────────
 * Every slug here is a real roster slug, checked against the catalogue rather than
 * invented: the roster guard caught `release-manager` in K-23's fixtures, where it
 * rendered as "Release Manager" through `agentDisplayName`'s title-case fallback
 * and looked entirely correct.
 *
 * The times are relative to a fixed `now` so the panel is deterministic. The idle
 * threshold is one `track-tick`, ten minutes, so anything stamped further back than
 * that is quiet by the system's own clock.
 */
function AgentInboxCases() {
  const now = 1_760_000_000_000;
  const mins = (n: number) => now - n * 60_000;

  /*
   * THE HANDLERS, AND WITHOUT THEM HALF THIS COMPONENT WAS UNREACHABLE ON THE
   * ONE SURFACE THAT DRAWS IT.
   *
   * `Row` draws its reply control only where `session.onReply` is defined and
   * treats a row as clickable only where `onOpen` is. Neither appeared anywhere
   * in this file, so measured in the running app there were **zero buttons inside
   * rows across every instance**, and "reply in place works without a route
   * change" could not be exercised at all. The unit tests passed because four of
   * them wire `onReply` themselves, which is exactly the shape this lane exists to
   * catch: the component was right and the surface never showed it.
   *
   * `onReply` goes only where a row is actually ASKING something. A reply field on
   * a finished run is a control with nothing to answer, and drawing one to make a
   * gallery look complete would be the affordance-as-promise defect.
   */
  const reachable = (list: AgentSession[]): AgentSession[] =>
    list.map((s) => ({
      ...s,
      onOpen: () => {},
      onReply: s.need === "needs-input" ? () => {} : undefined,
    }));

  const morning: AgentSession[] = [
    {
      id: "m1",
      title: "Shorten the verify step",
      need: "needs-input",
      activity: "waiting on you",
      asking: "Keep the email confirmation, or drop it and verify on first sign-in?",
      agentSlug: "critic",
      at: mins(42),
    },
    {
      id: "m2",
      title: "Zendesk backlog, last fourteen days",
      need: "ready",
      activity: "finished reading 1,284 tickets",
      agentSlug: "researcher",
      at: mins(6),
    },
    {
      id: "m3",
      title: "Open the pull request behind a flag",
      need: "working",
      activity: "writing the migration",
      agentSlug: "builder",
      at: mins(1),
    },
    {
      id: "m4",
      title: "Post the change to the release channel",
      need: "done",
      activity: "posted it, and linked the spec",
      agentSlug: "release",
      at: mins(18),
    },
  ];

  return (
    <Stack>
      <Case label="A working morning, which is all four groups at once">
        <AgentInbox sessions={reachable(morning)} now={now} />
      </Case>

      <Case label="Nothing running, which is a good state rather than an empty one">
        <AgentInbox sessions={reachable(morning.filter((s) => s.need !== "working"))} now={now} />
      </Case>

      <Case label="Everything blocked on one person, which is a policy failure to surface">
        <AgentInbox
          now={now}
          sessions={reachable(
            [1, 2, 3, 4].map((n) => ({
              id: `b${n}`,
              title: ["Shorten the verify step", "Drop the Zendesk source", "Raise the daily ceiling", "Rename the Plan station"][n - 1]!,
              need: "needs-input" as const,
              activity: "waiting on you",
              agentSlug: ["critic", "researcher", "operations", "ux-architect"][n - 1]!,
              at: mins(n * 20),
            })),
          )}
        />
      </Case>

      <Case label="One agent failed, and it is still the group it needs rather than a fifth one">
        <AgentInbox
          now={now}
          sessions={reachable([
            {
              id: "f1",
              title: "Open the pull request behind a flag",
              need: "ready",
              failed: true,
              activity: "stopped after the checks came back red twice",
              agentSlug: "builder",
              at: mins(11),
            },
            {
              id: "f2",
              title: "Grade the shorter verify step",
              need: "needs-input",
              failed: true,
              activity: "could not reach PostHog, and is asking which source to use instead",
              agentSlug: "data-analyst",
              at: mins(34),
            },
            ...morning.filter((s) => s.need === "working"),
          ])}
        />
      </Case>

      <Case label="Five have gone quiet, so they fold into one line that says how many">
        <AgentInbox
          now={now}
          sessions={reachable([
            ...[1, 2, 3, 4, 5].map((n) => ({
              id: `q${n}`,
              title: `A piece of work nobody has heard from, number ${n}`,
              need: "working" as const,
              activity: "waiting for the next tick",
              agentSlug: "builder",
              at: mins(20 + n),
            })),
            ...morning.filter((s) => s.need === "working"),
          ])}
        />
      </Case>

      {/*
       * THE TWO SIZES THE ITEM ASKS ABOUT AND THE GALLERY DID NOT HOLD.
       *
       * The acceptance line is 3, 12 and 60 sessions with every row inside its
       * container, and the largest case here was 6, so the claim had nothing on
       * this surface to stand on. `agent-inbox.test.tsx:374` is named for the
       * requirement and cannot measure it either: it asserts that every truncating
       * title also carries `min-w-0`, which is a guard on a spelling rather than on
       * a width, and happy-dom has no layout engine so it could not do more.
       *
       * These two cases are the layout claim's only real evidence, and they are
       * here rather than in a test because the thing being claimed is a rendered
       * width. 60 is also the size at which the ONE tab stop stops being a nicety:
       * without it, sixty rows are sixty stops between this list and anything
       * after it.
       */}
      <Case label="Twelve sessions, where the groups start doing the work rather than the scroll">
        <AgentInbox now={now} sessions={reachable(crowd(12, mins))} />
      </Case>

      <Case label="Sixty sessions, which is why the whole list is one tab stop">
        <AgentInbox now={now} sessions={reachable(crowd(60, mins))} />
      </Case>

      <Case label="Nothing needs you, drawn as one sentence and silence">
        <AgentInbox sessions={[]} now={now} />
      </Case>
    </Stack>
  );
}

/**
 * A CROWDED INBOX, GENERATED RATHER THAN TYPED OUT SIXTY TIMES.
 *
 * The titles are long on purpose: a short title cannot fail to fit, so a fixture
 * built from short ones would prove nothing about the truncation it exists to
 * exercise. They cycle rather than repeat, so a reader can tell one row from the
 * next and see that the order inside a group is newest first.
 *
 * The needs cycle across all four groups so every group is populated at both
 * sizes, and one row in twelve is marked failed, which is roughly what a bad
 * afternoon looks like and is enough to show the chip inside two different
 * groups.
 */
function crowd(count: number, mins: (n: number) => number): AgentSession[] {
  const needs = ["needs-input", "ready", "working", "done"] as const;
  const titles = [
    "Shorten the verify step so a new account reaches the first screen without waiting for an email",
    "Read the Zendesk backlog for the last fourteen days and cluster it by what people actually wanted",
    "Open the pull request behind a flag, with the migration written and the rollback named",
    "Post the change to the release channel and link the spec it was built against",
    "Grade the shorter verify step against what the team said would happen before it shipped",
  ];
  const slugs = ["critic", "researcher", "builder", "release", "data-analyst"] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `c${i}`,
    title: `${titles[i % titles.length]!} (${i + 1})`,
    need: needs[i % needs.length]!,
    activity: i % 4 === 0 ? "waiting on you" : "still going",
    asking:
      i % 4 === 0
        ? "Keep the email confirmation, or drop it and verify on first sign-in?"
        : undefined,
    failed: i % 12 === 7,
    agentSlug: slugs[i % slugs.length]!,
    at: mins(i + 1),
  }));
}

/*
 * ── K-23, THE PLAN GATE ─────────────────────────────────────────────────
 * The three cases the item asks for, and the numbers are the product's real
 * ones: the per-track ceiling is $5, the plan is the shape a spine track
 * actually walks, and the last case shows a route somebody has already edited so
 * the recorded reason is visible rather than described.
 *
 * IT KEEPS ITS OWN STATE HERE rather than resetting on every decision, because
 * the panel's job is to let a reader press an answer and see what came back. A
 * gate that reset itself would answer and vanish.
 */
function PlanGateCases() {
  const [last, setLast] = useState<string | null>(null);

  const plan: PlanStep[] = [
    {
      id: "g1",
      label: "Read the verify-step drop-off in Intercom and PostHog",
      state: "pending",
      agentSlug: "researcher",
      station: "discover",
    },
    {
      id: "g2",
      label: "Decide whether the shorter verify step is worth the risk",
      state: "pending",
      agentSlug: "critic",
      station: "decide",
    },
    {
      id: "g3",
      label: "Write the spec, with the two paths it must not break",
      state: "pending",
      agentSlug: "prd-writer",
      station: "plan",
    },
    {
      id: "g4",
      label: "Open the pull request behind a flag",
      state: "pending",
      agentSlug: "builder",
      station: "build",
      touches: "supaprod/verify-step-shorter",
      reversible: "partial",
    },
    {
      id: "g5",
      label: "Post the change to the release channel",
      state: "pending",
      agentSlug: "release",
      station: "ship",
      touches: "#releases",
      reversible: "irreversible",
    },
  ];

  const route: RunMapStation[] = [
    { station: "sense", state: "pending" },
    { station: "decide", state: "pending" },
    { station: "define", state: "pending" },
    { station: "design", state: "pending" },
    { station: "build", state: "pending" },
    { station: "ship", state: "pending" },
  ];

  const edited: RunMapStation[] = route.map((s) =>
    s.station === "design"
      ? {
          ...s,
          state: "skipped",
          waivedReason: "It reuses the shipped verify component, so there is nothing new to draw",
        }
      : s,
  );

  return (
    <Stack>
      <Case label="A five-step plan, which is the case this was built for">
        <PlanGate
          steps={plan}
          stops={route}
          spend={{
            label: "This work item",
            spent: 0,
            cap: 5,
            note: "Past the ceiling the work stops where it is and waits for you.",
          }}
          onDecide={(d) =>
            setLast(
              `${d.autonomy}, ${d.editedPlan.steps.filter((s) => s.state === "skipped").length} steps skipped${
                d.reason ? `, note: ${d.reason}` : ""
              }`,
            )
          }
        />
      </Case>

      <Case label="What came back, so an answer is not a dead end">
        <p className="text-mrd-data leading-relaxed text-mrd-mute">
          {last ?? "Press an answer above and what the gate handed back appears here."}
        </p>
      </Case>

      <Case label="One step, and no route yet">
        <PlanGate
          steps={[plan[0]!]}
          spend={{ label: "This work item", spent: 0.0008, cap: 5 }}
          onDecide={() => {}}
        />
      </Case>

      <Case label="A route somebody already edited, with the reason on the record">
        <PlanGate
          steps={plan.slice(0, 3)}
          stops={edited}
          spend={{
            label: "This account, today",
            spent: 41.2,
            cap: 50,
            note: "Raising the ceiling carries on from where it stopped.",
          }}
          onDecide={() => {}}
        />
      </Case>

      <Case label="A decision already in flight, so nothing can be pressed twice">
        <PlanGate
          steps={plan.slice(0, 2)}
          stops={route.slice(0, 2)}
          spend={{ label: "This work item", spent: 2.4, cap: 5 }}
          busy
          onDecide={() => {}}
        />
      </Case>
    </Stack>
  );
}

/*
 * ── THE THREE VIEWS OF A RUN, REWORKED 2026-08-19 ───────────────────────
 * `RunTimeline`, `ToolStream` and `PlanCard` are one set now: one grid, one row
 * height, one glyph size, one label scale, one place for a figure. They are drawn
 * one under the other in this panel on purpose, because that is the comparison
 * that shows whether they are a set, and reading them apart is how three
 * rhythms shipped in the first place.
 *
 * THE FIXTURES OBEY ONE FORMAT TOO. Every event that has an actor names it, and
 * no row writes a station as text: a station is the glyph. The earlier fixture
 * credited `Research · Discover` on one row and `Challenge` on the next, which
 * was two formats for one idea, and the component now makes that impossible
 * rather than leaving it to whoever writes the next fixture.
 */
function RunTimelineCases() {
  const liveStart = Date.now() - 96_000;

  const long: TimelineEvent[] = [
    { id: "l1", at: NOW - 52 * 60_000, kind: "station", station: "decide", label: "Decide opened", state: "done" },
    {
      id: "l2",
      at: NOW - 51 * 60_000,
      kind: "fetch",
      label: "Read 128 messages from the outage thread",
      agentSlug: "researcher",
      durationMs: 41_000,
      state: "done",
    },
    {
      id: "l3",
      at: NOW - 49 * 60_000,
      kind: "handoff",
      label: "Handed to Challenge to red-team the ranking",
      agentSlug: "critic",
      state: "done",
    },
    {
      id: "l4",
      at: NOW - 47 * 60_000,
      kind: "gate",
      label: "Asked whether homeowners should see the firmware notice",
      agentSlug: "critic",
      state: "gate",
    },
    /* The 28-minute wait the component exists for, and it is a real figure: the
       oldest pending approval in this workspace has been standing 627 hours. */
    {
      id: "l5",
      at: NOW - 19 * 60_000,
      kind: "gate",
      label: "You approved it, with the wording changed",
      agentSlug: null,
      state: "done",
    },
    {
      id: "l6",
      at: NOW - 18 * 60_000,
      kind: "repo",
      label: "Wrote src/components/notices/FirmwareNotice.tsx",
      agentSlug: "builder",
      durationMs: 96_000,
      state: "done",
    },
    {
      id: "l7",
      at: NOW - 2 * 60_000,
      kind: "repo",
      label: "Opened the pull request",
      agentSlug: "builder",
      state: "passed",
    },
  ];

  const failed: TimelineEvent[] = [
    { id: "f1", at: NOW - 9 * 60_000, kind: "station", station: "build", label: "Build opened", state: "done" },
    {
      id: "f2",
      at: NOW - 8 * 60_000,
      kind: "check",
      label: "Ran the checks",
      detail: "Twelve of 8,787 failed, all in meridian-ratchet.test.ts.",
      agentSlug: "builder",
      durationMs: 34_000,
      state: "failed",
    },
  ];

  const held: TimelineEvent[] = [
    {
      id: "h1",
      at: NOW - 86 * 60 * 60_000,
      kind: "station",
      station: "discover",
      label: "Discover opened",
      state: "done",
    },
    {
      id: "h2",
      at: NOW - 86 * 60 * 60_000 + 30_000,
      kind: "station",
      station: "discover",
      label: "Grouping signals stopped: no source is connected",
      detail: "Thirty-nine of 43 work items are standing here for the same reason.",
      state: "held",
    },
  ];

  const liveEvents: TimelineEvent[] = [
    { id: "v1", at: liveStart, kind: "station", station: "build", label: "Build opened", state: "done" },
    {
      id: "v2",
      at: liveStart + 60_000,
      kind: "check",
      label: "Running the test suite",
      agentSlug: "builder",
      state: "working",
    },
  ];

  /* A 90-character label and a six-hour duration: two of the sizes nobody draws,
     and both were found by reading rather than by looking. */
  const extremes: TimelineEvent[] = [
    {
      id: "x1",
      at: NOW - 6 * 60 * 60_000 - 12 * 60_000,
      kind: "repo",
      label:
        "Rewrote the firmware reboot notice so a homeowner can tell a planned restart from an outage",
      agentSlug: "builder",
      durationMs: 6 * 60 * 60_000 + 12 * 60_000 + 41_000,
      state: "done",
    },
    {
      id: "x2",
      at: NOW - 60_000,
      kind: "gate",
      label: "Waiting on you to say whether the wording is right",
      state: "gate",
    },
  ];

  return (
    <Stack>
      <Case label="Nothing has run here yet">
        <RunTimeline events={[]} />
      </Case>
      <Case label="One event">
        <RunTimeline
          events={[
            {
              id: "one",
              at: NOW - 60_000,
              kind: "station",
              station: "decide",
              label: "Decide opened",
              state: "done",
            },
          ]}
        />
      </Case>
      <Case label="A long run, with a 28 minute wait in it">
        <RunTimeline events={long} />
      </Case>
      <Case label="A run that failed">
        <RunTimeline events={failed} />
      </Case>
      <Case label="Held on a condition, and waiting on nobody">
        <RunTimeline events={held} />
      </Case>
      <Case label="A 90 character label and a six hour duration">
        <RunTimeline events={extremes} />
      </Case>
      <Case label="Live, still going">
        <RunTimeline events={liveEvents} now={Date.now()} />
      </Case>
    </Stack>
  );
}

/*
 * ── THE TOOL STREAM ─────────────────────────────────────────────────────
 * Real registry names, so every caption is one the vocabulary actually produces
 * and every mark is the one `runGlyphForTool` derives from the namespace: the
 * source host for anything touching the repo, a globe for a web read, a clipboard
 * for our own checks. `quarry.excavate` is the deliberate exception: in no
 * catalogue, so it renders raw, and that is the case worth looking at.
 *
 * The streaming case is 40 rows so the column genuinely overflows and the pin can
 * be tried: scroll up, watch rows keep arriving without the view moving, press the
 * way back.
 */
function ToolStreamCases() {
  const t0 = NOW - 40 * 9_000;
  const READS = [
    "src/lib/spine/driver.ts",
    "src/lib/ai/runtime.server.ts",
    "src/components/meridian/marks.tsx",
    "src/routes/api/chat.ts",
    "src/lib/tool-consequences.ts",
  ];

  const streaming: ToolStreamRow[] = Array.from({ length: 40 }, (_, i) => {
    const last = i === 39;
    return {
      id: `s${i}`,
      tool: i % 5 === 0 ? "repo.search" : "repo.read",
      at: t0 + i * 9_000,
      argument: i % 5 === 0 ? "resolveToolMode" : READS[i % READS.length],
      state: last ? "running" : "done",
      ...(last ? {} : { durationMs: 400 + ((i * 137) % 2600) }),
    };
  });

  return (
    <Stack>
      <Case label="Nothing called yet">
        <ToolStream rows={[]} working />
      </Case>
      <Case label="A run that called nothing at all">
        <ToolStream rows={[]} />
      </Case>
      <Case label="Streaming: 40 calls, the newest still running">
        <ToolStream rows={streaming} working />
      </Case>
      <Case label="One of each mark: repo, web, our own checks, a handoff">
        <ToolStream
          rows={[
            {
              id: "m1",
              tool: "web.search",
              at: NOW - 300_000,
              argument: "firmware reboot vs outage homeowner confusion",
              durationMs: 2_400,
              state: "done",
            },
            {
              id: "m2",
              tool: "studio.checks.run",
              at: NOW - 240_000,
              argument: "bun test",
              durationMs: 34_000,
              state: "done",
            },
            {
              id: "m3",
              tool: "github.pr.open",
              at: NOW - 180_000,
              argument: "notices/firmware-banner",
              durationMs: 1_900,
              state: "done",
            },
            {
              id: "m4",
              tool: "agent.handoff",
              at: NOW - 120_000,
              argument: "reviewer",
              durationMs: 300,
              state: "done",
            },
          ]}
        />
      </Case>
      <Case label="A call that came back broken">
        <ToolStream
          rows={[
            {
              id: "e1",
              tool: "prd.draft",
              at: NOW - 120_000,
              state: "done",
              argument: "Firmware reboot notice",
              durationMs: 4_100,
            },
            {
              id: "e2",
              tool: "studio.checks.run",
              at: NOW - 60_000,
              state: "failed",
              argument: "bun test",
              error: "Twelve of 8,787 assertions failed, all in meridian-ratchet.test.ts.",
              durationMs: 34_000,
            },
          ]}
        />
      </Case>
      <Case label="An argument far too long for the row">
        <ToolStream
          rows={[
            {
              id: "w1",
              tool: "repo.read",
              at: NOW - 90_000,
              state: "done",
              argument:
                "src/components/meridian/__tests__/agent-marks-are-distinct.test.ts?range=1-240&highlight=MARK_HUE_RESTING",
              durationMs: 900,
            },
            {
              id: "w2",
              tool: "web.search",
              at: NOW - 30_000,
              state: "running",
              argument:
                "how do shipped coding agents decide when a tool call needs a human approval, and what fraction get approved",
            },
          ]}
        />
      </Case>
      <Case label="A tool the vocabulary has never heard of">
        <ToolStream
          rows={[{ id: "u1", tool: "quarry.excavate", at: NOW - 10_000, state: "running" }]}
          working
        />
      </Case>
    </Stack>
  );
}

/*
 * ── THE PLAN CARD ───────────────────────────────────────────────────────
 * The five-step plan is a real route through the loop, including the skipped
 * Design station, because a skip is the normal case rather than the exception:
 * `STATION_NEEDS.build` does not require a design artifact, so most real routes
 * pass Design by. Drawing it with its reason attached is the point of the state
 * existing.
 *
 * Every step names its station, which is drawn rather than written, so the marks
 * down the left are the loop itself. The one-step case is not a smaller version of
 * the same thing: it is the case where the header's plural has to be right and the
 * rail must not be drawn at all.
 */
function PlanCardCases() {
  const five: PlanStep[] = [
    {
      id: "p1",
      label: "Read every signal on the firmware theme",
      state: "done",
      agentSlug: "researcher",
      station: "discover",
    },
    {
      id: "p2",
      label: "Rank it against the other four bets",
      state: "active",
      agentSlug: "strategist",
      station: "decide",
    },
    {
      id: "p3",
      label: "Draft the spec, with the precedent cited",
      state: "needs-approval",
      agentSlug: "sprint-planner",
      station: "plan",
      touches: "SPEC-2214 Firmware reboot notice",
      reversible: "reversible",
    },
    {
      id: "p4",
      label: "Put a surface in front of it",
      state: "skipped",
      agentSlug: "ux-architect",
      station: "design",
      why: "The notice reuses a shipped component, so there is nothing new to draw.",
    },
    {
      id: "p5",
      label: "Open the pull request",
      state: "pending",
      agentSlug: "builder",
      station: "build",
      touches: "supaprod/main <- fix/firmware-reboot",
      reversible: "partial",
    },
  ];

  const broken: PlanStep[] = [
    {
      id: "b1",
      label: "Write the notice component",
      state: "done",
      agentSlug: "builder",
      station: "build",
    },
    {
      id: "b2",
      label: "Run the checks",
      state: "failed",
      agentSlug: "builder",
      station: "build",
      why: "Twelve of 8,787 assertions failed, all in the Meridian ratchet.",
    },
    {
      id: "b3",
      label: "Open the pull request",
      state: "pending",
      agentSlug: "builder",
      station: "ship",
    },
  ];

  /* A step with no station wears the ring set instead, which is the other half of
     the mark rule and the case a reader meets on an ad-hoc plan. */
  const stationless: PlanStep[] = [
    { id: "n1", label: "Read the two conflicting tickets", state: "done", agentSlug: "researcher" },
    { id: "n2", label: "Decide which one is the real complaint", state: "active", agentSlug: "strategist" },
    { id: "n3", label: "Write it up", state: "pending", agentSlug: "sprint-planner" },
  ];

  return (
    <Stack>
      <Case label="No plan filed yet">
        <PlanCard steps={[]} />
      </Case>
      <Case label="Five steps, mixed, with a gate at the top">
        <PlanCard steps={five} onApprove={noop} onRevise={noop} />
      </Case>
      <Case label="The same plan, read only">
        <PlanCard steps={five} />
      </Case>
      <Case label="Steps with no station, on the ring set">
        <PlanCard steps={stationless} />
      </Case>
      <Case label="One step">
        <PlanCard steps={[five[4]]} onApprove={noop} />
      </Case>
      <Case label="A skip with nobody's reason on it">
        <PlanCard steps={[{ id: "x", label: "Put a surface in front of it", state: "skipped", station: "design" }]} />
      </Case>
      <Case label="A step that failed">
        <PlanCard steps={broken} />
      </Case>
      <Case label="A step you can act on, and one you can only pass over">
        <PlanCard
          steps={five}
          onApprove={noop}
          onRevise={noop}
          onApproveStep={noop}
          onSkipStep={noop}
        />
      </Case>
      <Case label="A decision in flight">
        <PlanCard steps={five} onApprove={noop} onRevise={noop} onSkipStep={noop} busy />
      </Case>
    </Stack>
  );
}

/*
 * ── K-02, THE CONTROLS ──────────────────────────────────────────────────
 * The labels are real ones from the product rather than "Button", because a
 * control's width and its voice are half of how it reads and "Button" has
 * neither. "Stop this run" is the label that made `--mrd-stop` necessary.
 *
 * THE DISABLED ROW EARNS ITS PLACE. Twelve primary buttons once shipped a
 * 1.19:1 label on paper and no fixture had ever handed one an action, so the
 * broken state was never rendered on any machine. A disabled destructive is the
 * same shape of trap: it inherits `disabled:opacity-45` like the other three,
 * which takes its label under the text floor, and that is a house-wide
 * behaviour rather than something this variant introduced.
 */
function ControlCases() {
  return (
    <Stack>
      <Case label="At rest">
        <Actions>
          <Action variant="primary">Hand it over</Action>
          <Action>Open the run</Action>
          <Action variant="quiet">Change it</Action>
        </Actions>
      </Case>

      <Case label="The gate, which is the only orchid control in the product">
        <Actions>
          <Approve shortcut="A">Approve the plan</Approve>
          <Action variant="quiet">Review the evidence</Action>
        </Actions>
      </Case>

      <Case label="Destructive, separated by distance rather than by volume">
        <Actions trailing={<Action variant="destructive">Stop this run</Action>}>
          <Action variant="primary">Keep going</Action>
          <Action variant="quiet">Steer it</Action>
        </Actions>
      </Case>

      <Case label="Destructive on its own, beside the other three">
        <Actions>
          <Action variant="destructive">Discard the changeset</Action>
          <Action variant="destructive">Remove the connection</Action>
        </Actions>
      </Case>

      <Case label="Dead, and no longer shouting">
        <Actions trailing={<Action variant="destructive" disabled>Stop this run</Action>}>
          <Approve disabled>Approve the plan</Approve>
          <Action variant="primary" disabled>
            Hand it over
          </Action>
          <Action disabled>Open the run</Action>
        </Actions>
      </Case>
    </Stack>
  );
}

/*
 * ── K-03, THE DIALOG ────────────────────────────────────────────────────
 * Triggers rather than a permanently-open panel, and the reason is the one thing
 * this page is for: a dialog covers the viewport, so two open at once would
 * cover each other and neither ground could be read. Opening one from inside a
 * column puts that column's ground on the whole screen, which is exactly the
 * comparison worth making.
 *
 * The destructive question is the one that made `--mrd-stop` and this component
 * necessary in the same week. Its numbers are the real ones: a build run holding
 * the repo for 41 minutes across nine files, and credits already drawn.
 */
function DialogCases() {
  const [asking, setAsking] = useState<"stop" | "plain" | "long" | "tall" | null>(null);

  return (
    <Stack>
      <Case label="A destructive question, which is what this was built for">
        <Actions>
          <Action variant="destructive" onClick={() => setAsking("stop")}>
            Stop this run
          </Action>
        </Actions>
        <Dialog
          open={asking === "stop"}
          onClose={() => setAsking(null)}
          title="Stop this run?"
          actions={
            <Actions>
              <Action variant="quiet" onClick={() => setAsking(null)}>
                Keep going
              </Action>
              <Action variant="destructive" onClick={() => setAsking(null)}>
                Stop it
              </Action>
            </Actions>
          }
        >
          Engineer has been working for 41 minutes and has touched nine files. Stopping now discards
          the changeset, and the credits already drawn are not returned.
        </Dialog>
      </Case>

      <Case label="A gate question, where the accent belongs">
        <Actions>
          <Action onClick={() => setAsking("plain")}>Approve the plan</Action>
        </Actions>
        <Dialog
          open={asking === "plain"}
          onClose={() => setAsking(null)}
          title="Let the crew run the whole plan?"
          actions={
            <Actions>
              <Action variant="quiet" onClick={() => setAsking(null)}>
                Not yet
              </Action>
              <Approve shortcut="A" onClick={() => setAsking(null)}>
                Approve it
              </Approve>
            </Actions>
          }
        >
          Five steps, four agents, and one of them opens a pull request. Approving here is the last
          time you are asked until something crosses a boundary you set.
        </Dialog>
      </Case>

      <Case label="A long question, which must not run off the pane">
        <Actions>
          <Action variant="quiet" onClick={() => setAsking("long")}>
            Remove the connection
          </Action>
        </Actions>
        <Dialog
          open={asking === "long"}
          onClose={() => setAsking(null)}
          title="Remove the Zendesk connection?"
          actions={
            <Actions>
              <Action variant="quiet" onClick={() => setAsking(null)}>
                Leave it connected
              </Action>
              <Action variant="destructive" onClick={() => setAsking(null)}>
                Remove it
              </Action>
            </Actions>
          }
        >
          Nothing already read is deleted, and the 1,284 signals that came in through it stay where
          they are. What stops is the reading: no new ticket reaches Discover, the two work items
          currently waiting on this source stay where they are standing, and the grouping that runs
          every ten minutes will have nothing new to group. Reconnecting later starts from the
          newest ticket, not from where it left off, so anything filed in between is not picked up.
        </Dialog>
      </Case>

      <Case label="A question taller than the screen, which has to stay recoverable">
        <Actions>
          <Action variant="destructive" onClick={() => setAsking("tall")}>
            Delete the workspace
          </Action>
        </Actions>
        <Dialog
          open={asking === "tall"}
          onClose={() => setAsking(null)}
          title="Delete this workspace and everything in it?"
          actions={
            <Actions>
              <Action variant="quiet" onClick={() => setAsking(null)}>
                Keep the workspace
              </Action>
              <Action variant="destructive" onClick={() => setAsking(null)}>
                Delete it
              </Action>
            </Actions>
          }
        >
          <p>
            This is the case that broke the first build of this component, kept as a case rather
            than as a note. Shrink the window until this panel is taller than the viewport and the
            title stays put, the controls stay put, and this text scrolls between them. Before the
            fix the panel overflowed both edges at once, and because a dialog locks the page behind
            it, the top half was gone for good.
          </p>
          <p className="mt-mrd-3">
            Nine missions, four of them still running, and the two changesets waiting on review are
            discarded with them. The 1,284 signals read through Zendesk and the 86 themes Discover
            grouped out of them go too, along with every decision recorded against them and the
            reasons attached to each one.
          </p>
          <p className="mt-mrd-3">
            The credits already drawn this month stay drawn, because the work was done. What you
            lose is the record of why it was done, and that is the part nothing can rebuild: the
            forecasts written at decision time were only ever written here.
          </p>
          <p className="mt-mrd-3">
            Three people share this workspace. They keep their accounts and lose their access at the
            same moment you press this, with no notice sent and nothing for them to open.
          </p>
          <p className="mt-mrd-3">
            Type nothing, and read it again instead. There is no undo behind this control, which is
            why it is the last thing on the row rather than the loudest thing on the pane.
          </p>
        </Dialog>
      </Case>
    </Stack>
  );
}

/*
 * ── K-07, SPEND ─────────────────────────────────────────────────────────
 * The three ceilings are the real ones: the per-track cap at $5, the per-mission
 * cap at $10, and an account cap with no default. The consequences are the ones
 * the product's own copy already states, quoted rather than rewritten, because
 * they differ per ceiling and that is exactly why the component refuses to write
 * them itself.
 */
function SpendCases() {
  return (
    <Stack>
      <Case label="Nothing spent yet">
        <Spend label="This work item" spent={0} cap={5} />
      </Case>
      <Case label="Under way, and nothing to say about it">
        <Spend label="This work item" spent={1.34} cap={5} />
      </Case>
      <Case label="Under a cent, which must not read as nothing">
        <Spend label="Today" spent={0.0008} cap={5} />
      </Case>
      <Case label="Nearly spent, which is what amber is for">
        <Spend
          label="This work item"
          spent={4.38}
          cap={5}
          note="Raising the cap carries on from where it stopped."
        />
      </Case>
      <Case label="The ceiling was hit, which is the only thing red may mean">
        <Spend
          label="This work item"
          spent={5}
          cap={5}
          note="The work stopped where it was and is waiting for you."
        />
      </Case>
      <Case label="Past the ceiling, because a call in flight still lands">
        <Spend label="This run" spent={11.42} cap={10} note="Over-cap calls are blocked." />
      </Case>
      <Case label="An earlier warning, for a workspace that asked for one">
        <Spend label="This account, today" spent={26.5} cap={50} alertAt={0.5} />
      </Case>
      <Case label="No cap set at all">
        <Spend label="This account" spent={412.86} cap={null} />
      </Case>

      {/*
       * THE THREE CASES NOBODY DREW, which is where all three defects were. Every
       * case above is a reasonable number, and eight reasonable numbers is how a
       * component ships breaking on the ninth.
       */}
      <Case label="A ceiling of nothing, which is not the same as no ceiling">
        <Spend
          label="This account"
          spent={5}
          cap={0}
          note="Every call is refused at this ceiling. Raise it and the work carries on."
        />
      </Case>
      <Case label="A ledger that went backwards, which the bar refuses to draw">
        <Spend
          label="This run"
          spent={-2}
          cap={5}
          note="A credit landed after the charge it reverses. The figure is what the ledger says."
        />
      </Case>
      <Case label="A threshold of nothing, which asks to hear only about the ceiling">
        <Spend label="Today" spent={2.5} cap={5} alertAt={0} />
      </Case>
    </Stack>
  );
}

/*
 * ── K-08, THE MARK STACK ────────────────────────────────────────────────
 * Real crew slugs, so every glyph on this panel is the drawing that agent
 * actually wears elsewhere in the product. The point of the panel is the pair:
 * the mixed stack and the uniform one side by side, because the uniform one is
 * what both live call sites still render and it must be identical to what it was.
 */
function MarkStackCases() {
  return (
    <Stack>
      <Case label="Mixed: one finished, one working, one waiting on you">
        <MarkStack
          agents={[
            { slug: "discovery-scout", state: "verified" },
            { slug: "researcher", state: "running" },
            { slug: "critic", state: "gate" },
          ]}
        />
      </Case>

      <Case label="Uniform, which is what both live callers pass">
        <MarkStack
          agents={[{ slug: "discovery-scout" }, { slug: "researcher" }, { slug: "critic" }]}
          state="running"
        />
      </Case>

      <Case label="Three asking at once, and only the first may blink">
        <MarkStack
          agents={[
            { slug: "discovery-scout", state: "gate" },
            { slug: "researcher", state: "gate" },
            { slug: "critic", state: "gate" },
          ]}
        />
      </Case>

      <Case label="The blink goes to whoever is asking, not to whoever is first">
        <MarkStack
          agents={[
            { slug: "discovery-scout", state: "verified" },
            { slug: "researcher", state: "gate" },
            { slug: "critic", state: "gate" },
          ]}
        />
      </Case>

      <Case label="A run that went wrong halfway">
        <MarkStack
          agents={[
            { slug: "planner", state: "verified" },
            { slug: "builder", state: "failed" },
            { slug: "reviewer", state: "quiet" },
          ]}
        />
      </Case>

      <Case label="Four, which is the cap">
        <MarkStack
          agents={[
            { slug: "discovery-scout", state: "verified" },
            { slug: "researcher", state: "verified" },
            { slug: "strategist", state: "running" },
            { slug: "critic", state: "gate" },
            { slug: "planner", state: "gate" },
          ]}
        />
      </Case>

      <Case label="One agent, which draws no stack at all">
        <MarkStack agents={[{ slug: "builder", state: "running" }]} />
      </Case>
    </Stack>
  );
}

/*
 * ── STATUS CHIPS ────────────────────────────────────────────────────────
 * All five, in both grounds, at the sizes they actually ship at. The last case is
 * the one to look at hardest: five chips in a row is what a badly built surface
 * does, and it is here so the cost of that is visible rather than argued about.
 */
function StatusChipCases() {
  return (
    <Stack>
      <Case label="The five, each saying its own word">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status="you" />
          <StatusChip status="agent" />
          <StatusChip status="hold" />
          <StatusChip status="pass" />
          <StatusChip status="fail" />
        </div>
      </Case>

      <Case label="Breathing, for the two states that are still moving">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status="agent" pulse />
          <StatusChip status="you" pulse />
        </div>
      </Case>

      <Case label="More specific about the same state, which is the only allowed override">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status="you">Needs you</StatusChip>
          <StatusChip status="hold">Cap reached</StatusChip>
          <StatusChip status="agent">Running</StatusChip>
        </div>
      </Case>

      <Case label="In a row of text, which is where they live">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-mrd-label text-mrd-ink">
          Ran the checks
          <StatusChip status="fail" />
          <span className="font-mrd-mono text-mrd-data text-mrd-faint tabular-nums">34s</span>
        </p>
      </Case>

      <Case label="Beside the categorical tag, which is a different shape on purpose">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status="pass" />
          <RecordTag label="Gelato" />
          <RecordTag label="Wholesale" />
        </div>
      </Case>
    </Stack>
  );
}

/*
 * ── THE THREE VIEWS, ONE UNDER THE OTHER ────────────────────────────────
 * One run, told three ways, with the same data behind all three so the only
 * difference on screen is the view. This is the check for the rhythm: the marks
 * should sit on one vertical line and the subjects should start on one pixel
 * across all three, and the plan's empty clock column is what makes that true
 * rather than a coincidence.
 */
function OneSetCases() {
  const t = NOW - 12 * 60_000;

  return (
    <Stack>
      <Case label="The plan it committed to">
        <PlanCard
          steps={[
            { id: "o1", label: "Read the outage thread", state: "done", agentSlug: "researcher", station: "discover" },
            { id: "o2", label: "Write the firmware notice", state: "active", agentSlug: "builder", station: "build" },
            { id: "o3", label: "Open the pull request", state: "pending", agentSlug: "builder", station: "ship" },
          ]}
        />
      </Case>

      <Case label="What actually happened">
        <RunTimeline
          events={[
            { id: "o1", at: t, kind: "station", station: "discover", label: "Read the outage thread", agentSlug: "researcher", durationMs: 41_000, state: "done" },
            { id: "o2", at: t + 60_000, kind: "repo", label: "Write the firmware notice", agentSlug: "builder", state: "working" },
          ]}
          now={t + 9 * 60_000}
        />
      </Case>

      <Case label="What it called while doing it">
        <ToolStream
          rows={[
            { id: "o1", tool: "web.search", at: t, argument: "firmware reboot homeowner confusion", durationMs: 2_400, state: "done" },
            { id: "o2", tool: "repo.read", at: t + 30_000, argument: "src/components/notices/FirmwareNotice.tsx", durationMs: 700, state: "done" },
            { id: "o3", tool: "studio.checks.run", at: t + 60_000, argument: "bun test", state: "running" },
          ]}
          working
        />
      </Case>
    </Stack>
  );
}

/*
 * ── K-80, THE FLOWCHART ─────────────────────────────────────────────────
 * The branch is a real route through the loop: a firmware complaint arrives, the
 * bet is ranked, and it either becomes a spec or gets filed against the theme.
 * Both outgoing edges are labelled, because an unlabelled branch is a fork the
 * reader has to guess the condition of.
 *
 * The 40-node case is here for the same reason the 200-row timeline case is: it is
 * a size nobody draws and it is where a layout that only works small shows itself.
 */
function FlowchartCases() {
  const [picked, setPicked] = useState<string | null>("rank");

  const branch: { nodes: FlowNode[]; edges: FlowEdge[] } = {
    nodes: [
      {
        id: "signal",
        row: 0,
        x: 0.5,
        station: "discover",
        kind: "Trigger",
        title: "A firmware complaint arrives",
        caption: "Any signal on the firmware theme starts this",
      },
      {
        id: "rank",
        row: 1,
        x: 0.5,
        station: "decide",
        kind: "If / Else",
        title: "Is it worth a bet?",
        caption: "ICE against the other four, then the Critic",
      },
      { id: "spec", row: 2, x: 0.26, station: "plan", title: "Draft the spec" },
      { id: "park", row: 2, x: 0.76, station: "learn", title: "File it against the theme" },
      { id: "build", row: 3, x: 0.26, station: "build", title: "Write the notice" },
      { id: "ship", row: 4, x: 0.26, station: "ship", kind: "Gate", title: "Open the pull request" },
    ],
    edges: [
      { from: "signal", to: "rank" },
      { from: "rank", to: "spec", label: "yes" },
      { from: "rank", to: "park", label: "no" },
      { from: "spec", to: "build" },
      { from: "build", to: "ship" },
    ],
  };

  const straight = flowFromSteps([
    { id: "s1", title: "Read the outage thread", station: "discover" },
    { id: "s2", title: "Rank it", station: "decide" },
    { id: "s3", title: "Draft the spec", station: "plan" },
  ]);

  const many = flowFromSteps(
    Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, title: `Step ${i + 1}` })),
  );

  return (
    <Stack>
      <Case label="No map yet">
        <Flowchart nodes={[]} edges={[]} />
      </Case>
      <Case label="A branch, with both outgoing edges labelled">
        <Flowchart {...branch} />
      </Case>
      <Case label="The same branch, selectable: press a node and its edges light">
        <Flowchart {...branch} selectedId={picked} onSelect={setPicked} />
      </Case>
      <Case label="A straight run, laid out for the caller">
        <Flowchart {...straight} />
      </Case>
      <Case label="One node">
        <Flowchart nodes={[{ id: "only", row: 0, x: 0.5, title: "The only step" }]} edges={[]} />
      </Case>
      <Case label="Forty nodes, which is the size nobody draws">
        <Flowchart {...many} />
      </Case>
    </Stack>
  );
}

/*
 * THE FIVE CASES ARE THE FIVE THINGS THAT CAN BE TRUE OF A ROUTE, not five
 * pretty ones: the whole loop, a route that skips most of it, the editable mode
 * where the reason prompt lives, a live route with something held, and a waiver
 * that arrived with no reason on it.
 *
 * The last one is the case that matters most and would never be composed by
 * accident: it is the founder ruling failing, drawn, so anyone can see what the
 * record looks like when nobody said why.
 */
function RunMapCases() {
  const seven: RunMapStation[] = AGENT_STATION_ORDER.map((station, i) => ({
    station,
    state: i === 0 ? "done" : i === 1 ? "active" : "pending",
    outcome:
      i === 0
        ? "Read Intercom and PostHog for verify-step drop-off"
        : i === 1
          ? "Ranking it against the other four bets"
          : undefined,
  }));

  const short: RunMapStation[] = [
    {
      station: "define",
      state: "done",
      outcome: "Wrote the firmware reboot notice spec, with the outage precedent cited",
      steps: [
        { id: "s1", label: "Read the outage thread", state: "done", station: "discover" },
        { id: "s2", label: "Draft the spec", state: "done", station: "plan" },
      ],
    },
    { station: "design", state: "skipped", waivedReason: "The notice reuses a shipped component, so there is nothing new to draw" },
    {
      station: "build",
      state: "active",
      outcome: "Writing the notice component",
      steps: [
        { id: "b1", label: "Write the notice component", state: "active", station: "build" },
        { id: "b2", label: "Run the checks", state: "pending", station: "build" },
      ],
    },
    { station: "ship", state: "pending" },
  ];

  const held: RunMapStation[] = [
    { station: "define", state: "done", outcome: "Wrote the spec" },
    { station: "build", state: "pending", hold: "out-of-credit" },
    { station: "ship", state: "pending" },
  ];

  const unexplained: RunMapStation[] = [
    { station: "define", state: "done", outcome: "Wrote the spec" },
    { station: "design", state: "skipped" },
    { station: "build", state: "failed", outcome: "The checks came back red twice" },
  ];

  return (
    <Stack>
      <Case label="No route yet">
        <RunMap stops={[]} />
      </Case>
      <Case label="The whole loop, live">
        <RunMap stops={seven} mode="live" />
      </Case>
      <Case label="A short route, with two stations that open">
        <RunMap stops={short} mode="replay" />
      </Case>
      <Case label="Editable, where taking a station off asks why">
        <RunMap stops={short} mode="editable" onWaive={noop} />
      </Case>
      <Case label="Live, and the account ran dry">
        <RunMap stops={held} mode="live" />
      </Case>
      <Case label="A skip nobody explained, and a station that failed">
        <RunMap stops={unexplained} mode="replay" />
      </Case>
    </Stack>
  );
}

/*
 * ── K-38, THE FOUR PARTS THE PORT WAS BLOCKED ON ────────────────────────
 *
 * Every fixture here is a real call site rather than a pretty one, because the
 * three defects this panel exists to catch are all invisible in a tidy fixture:
 *
 *   the connector catalog, which is what `Cell` was built for and the only place
 *       the mark, the tint, the hover, the picked state and the dead state all
 *       appear at once. The provider ids are real registry ids, so the marks are
 *       the mark OF the thing being named rather than a letter that was to hand.
 *   the sizes nobody draws: one cell, nineteen cells, a ninety-character label, a
 *       four-hundred-line log, a three-hundred-column line, and a selection of
 *       one against a selection of all.
 *   the bar with nothing selected, which is the state that must draw NOTHING and
 *       is therefore the one case a screenshot cannot show. It is drawn anyway,
 *       labelled, because the absence is the assertion.
 *
 * The bar is LIVE in both grounds: click the cells, then press Escape. That is
 * the behaviour a paint-only port drops, and it is the reason this panel is
 * interactive where most of the page is not.
 */

/* Every id here is in `provider-marks`' own registry, checked rather than
   assumed: `ProviderMark` draws NOTHING for an id it does not know instead of
   borrowing another provider's identity, so an invented id renders a cell with a
   silently missing mark and looks entirely correct. */
const CATALOG: { id: string; label: string; flow: string }[] = [
  { id: "github", label: "GitHub", flow: "Sign in with GitHub" },
  { id: "linear", label: "Linear", flow: "Sign in with Linear" },
  { id: "slack", label: "Slack", flow: "Add to a channel" },
  { id: "notion", label: "Notion", flow: "Pick the pages it may read" },
  { id: "intercom", label: "Intercom", flow: "Sign in with Intercom" },
  { id: "jira", label: "Jira", flow: "Pick the projects it may read" },
  { id: "zendesk", label: "Zendesk", flow: "Sign in with Zendesk" },
  { id: "figma", label: "Figma", flow: "Pick the files it may read" },
  { id: "stripe", label: "Stripe", flow: "Sign in with Stripe" },
];

/** Frozen, so the empty bar's hook is not handed a new array on every render. */
const NO_ROWS: string[] = [];

/* The real shape of a failure, kept long enough to hit the cap and wide enough
   to need the horizontal scroll. Both were named as pain points, and a document
   is the one place sideways scrolling is unavoidable. */
const DEPLOY_LOG = [
  "$ bun run build",
  "vite v6.0.7 building for production...",
  "transforming (1284) src/routes/_authenticated.meridian.tsx",
  "✗ Build failed in 4.21s",
  'error during build: [vite]: Rollup failed to resolve import "@/components/shell/primitives" from "src/components/plan/RoadmapColumns.tsx". This is most likely unintended because it can break your application at runtime.',
  "    at getRollupError (file:///node_modules/rollup/dist/es/shared/parseAst.js:401:41)",
  "    at error (file:///node_modules/rollup/dist/es/shared/parseAst.js:397:42)",
].join("\n");

const LONG_LOG = Array.from(
  { length: 400 },
  (_, i) => `${String(i + 1).padStart(4, " ")}  read decision 8f2c-${i} and wrote one forecast`,
).join("\n");

const SCORES: { label: string; value: number | null }[] = [
  { label: "helpfulness", value: 0.82 },
  { label: "grounding", value: 0.94 },
  { label: "tone", value: null },
  { label: "cost", value: 0.61 },
];

/** The bar wired to real selection state, so Escape actually leaves the mode. */
function LiveBulkBar({ noun = "decision" }: { noun?: string }) {
  const ids = ["d1", "d2", "d3", "d4", "d5", "d6"];
  const picked = useSelection(ids);

  return (
    <div className="flex flex-col gap-mrd-4">
      <BulkBar selection={picked} total={ids.length} noun={noun}>
        <Action>Approve</Action>
        <Action variant="quiet">Send back</Action>
      </BulkBar>
      <Grid cellMin={132}>
        {ids.map((id, i) => (
          <Cell
            key={id}
            lead={`Decision ${i + 1}`}
            sub={picked.has(id) ? "picked" : "shorten the verify step"}
            selected={picked.has(id)}
            onClick={() => picked.toggle(id)}
          />
        ))}
      </Grid>
    </div>
  );
}

function CatalogPartCases() {
  const [picked, setPicked] = useState<string | null>("linear");
  /* Held at the top rather than called inside the case below it, so the hook
     order is readable and does not depend on where a `<Case>` happens to sit. */
  const nothingPicked = useSelection(NO_ROWS);

  return (
    <Stack>
      <Case label="One cell, which is the size a grid must not make look broken">
        <Grid>
          <Cell
            mark={<ProviderMark provider="github" tone="brand" size={18} />}
            lead="GitHub"
            sub="Sign in with GitHub"
            onClick={noop}
          />
        </Grid>
      </Case>

      <Case label="Nine to scan across, which is the whole arithmetic of the part">
        <Grid>
          {CATALOG.map((a) => (
            <Cell
              key={a.id}
              mark={<ProviderMark provider={a.id} tone="brand" size={18} />}
              lead={a.label}
              sub={a.flow}
              title={`Connect ${a.label}`}
              onClick={noop}
            />
          ))}
        </Grid>
      </Case>

      <Case label="Picked, unpicked and one nobody may touch, side by side">
        <Grid>
          {CATALOG.slice(0, 3).map((a) => (
            <Cell
              key={a.id}
              mark={<ProviderMark provider={a.id} tone="brand" size={18} />}
              lead={a.label}
              sub={a.flow}
              selected={picked === a.id}
              onClick={() => setPicked(a.id)}
            />
          ))}
          {/* No `onClick` and no `selected`: an affordance is a promise, so a
              connector waiting on an admin never lights up and never claims to
              be a toggle. */}
          <Cell
            mark={<ProviderMark provider="salesforce" tone="brand" size={18} />}
            lead="Salesforce"
            sub="Waiting on an admin"
            title="An admin has to connect this one first"
            disabled
          />
        </Grid>
      </Case>

      <Case label="A ninety character label, which a real catalog will hand it">
        <Grid>
          <Cell
            mark={<ProviderMark provider="github" tone="brand" size={18} />}
            lead="GitHub Enterprise Server, self hosted behind the corporate VPN"
            sub="Sign in with the enterprise instance rather than with github.com, which needs an admin"
            onClick={noop}
          />
          <Cell lead="Short" sub="And a sub" onClick={noop} />
        </Grid>
      </Case>

      <Case label="Recessed, on ground that is already raised, and no mark at all">
        {/* What `EvalScoreChips` renders: four characters per cell, so the
            measure comes down to 132px rather than leaving half of each empty.
            The outcome is reported by a `Value` in the sub, which is where the
            five status words live. A tone is not a sixth one. */}
        <div className="rounded-mrd-card bg-mrd-lift p-mrd-5">
          <Grid cellMin={132}>
            {SCORES.map((s) => (
              <Cell
                key={s.label}
                tone="recessed"
                lead={s.value == null ? "not scored" : `${Math.round(s.value * 100)}%`}
                sub={
                  s.value == null ? (
                    <Value tone="hold">the judge did not return it</Value>
                  ) : (
                    <Value tone={s.value >= 0.8 ? "pass" : "fail"}>{s.label}</Value>
                  )
                }
              />
            ))}
          </Grid>
        </div>
      </Case>

      <Case label="A fixed number of equal columns, which the retired grid could not say">
        <Grid columns={2}>
          <Cell tone="recessed" lead="296" sub="decisions carrying a forecast" />
          <Cell tone="recessed" lead="0" sub="of them resolved" />
        </Grid>
      </Case>

      <Case label="Nothing selected, which draws nothing at all rather than an empty strip">
        <div className="flex flex-col gap-mrd-4">
          <BulkBar selection={nothingPicked} total={0} noun="decision">
            <Action>Approve</Action>
          </BulkBar>
          <p className="text-[12.5px] text-mrd-faint">
            The bar is mounted directly above this line and renders nothing. An empty selection must
            not hold a row open on every list in the product.
          </p>
        </div>
      </Case>

      <Case label="Live: pick some rows, then press Escape">
        <LiveBulkBar />
      </Case>

      <Case label="A failure printed verbatim, which is what the box is for">
        <Pre>
          <Value tone="fail">{DEPLOY_LOG}</Value>
        </Pre>
      </Case>

      <Case label="One line, which is a token you copy and never read">
        <Pre>sk_live_4f2a9c7e1b8d3056a7c2e9f14b6d8093</Pre>
      </Case>

      <Case label="Four hundred lines, which is the size that used to grow the page">
        <Pre>{LONG_LOG}</Pre>
      </Case>
    </Stack>
  );
}

/*
 * ── K-75, THE PROMOTION CARD ────────────────────────────────────────────
 * Every `kind` below is one a shipped writer actually produces, which is the
 * fixture rule that matters here rather than a nicety: the card's behaviour comes
 * from `resolveMemoryScope`, so a fixture using a kind nothing writes would be
 * testing a branch production never reaches. `reflection` is written by
 * `reflection.server.ts`, `outcome` is what settled verdicts are written as, and
 * `note` is whatever the remember tool was handed. Nothing writes `precedent`,
 * so nothing here uses it.
 *
 * THE PRODUCT NAMES ARE THE ONE INVENTION AND THEY HAVE TO BE. There is no
 * `product_id` on `agent_memory` or on `learnings`, so no real row can supply
 * one; the third case is the honest state and it is the one to look at longest.
 *
 * The cards are live rather than frozen, because the settled state is the half of
 * this component that is worth seeing and it cannot be shown without a press.
 * Each column has its own instances, so pressing in Dark leaves Paper asking.
 */
function PromotionCardCases() {
  return (
    <Stack>
      <Case label="Put forward, and every answer is available">
        <PromotionCard
          lesson="Check the send window before blaming deliverability, because a batch that lands outside it looks exactly like a reputation problem"
          learnedIn="Fieldwork"
          kind="reflection"
          evidence={[
            {
              key: "e1",
              label: "The retry window was the cause, and the sending domain was never at fault",
              onOpen: noop,
            },
            {
              key: "e2",
              label: "Two later sends recovered once the window was widened, with nothing else changed",
              onOpen: noop,
            },
          ]}
          guides={[
            "Decide reads it before it ranks the next bet, so a deliverability theme stops arriving first.",
            "Plan cites it in the spec rather than re-deriving it from the same three signals.",
          ]}
        />
      </Case>

      <Case label="A measurement, which is the commonest row and carries no controls at all">
        <PromotionCard
          lesson="Checkout retry moved completion from 6.3 to 7.0, held over three weeks"
          learnedIn="Fieldwork"
          kind="outcome"
          evidence={[
            { key: "o1", label: "Settled against the bet that asked for it", onOpen: noop },
            { key: "o2", label: "Measured on 4,181 sessions across three weeks" },
          ]}
          guides={[]}
        />
      </Case>

      <Case label="No product recorded, which is every real row today">
        <PromotionCard
          lesson="Ask the person who raised the signal what they expected to happen, before ranking it"
          learnedIn={null}
          kind="reflection"
          evidence={[
            { key: "n1", label: "A person corrected the agent on this twice in one week", onOpen: noop },
          ]}
          guides={["Discover asks for the expectation at capture instead of inferring it later."]}
        />
      </Case>

      <Case label="The evidence read fell over, and the decision is still available">
        <PromotionCard
          lesson="Two products in one workspace never share a spend ceiling, however similar they look"
          learnedIn="Loop"
          kind="reflection"
          evidence={[]}
          evidenceFailed
          onEvidenceRetry={noop}
          guides={["Plan sets a ceiling per product rather than per workspace."]}
        />
      </Case>

      <Case label="Nothing is attached, which is judgment rather than a settled result">
        <PromotionCard
          lesson="Write the forecast before the work starts, because nobody can reconstruct what they believed afterwards"
          learnedIn="Loop"
          kind="note"
          origin={{ declaredScope: "workspace" }}
          evidence={[]}
          guides={[
            "Decide asks for the forecast at the gate, so it is written while the belief is still there.",
          ]}
        />
      </Case>

      <Case label="Nothing waiting, which is the state a quiet workspace shows">
        <NoPromotions />
      </Case>
    </Stack>
  );
}
