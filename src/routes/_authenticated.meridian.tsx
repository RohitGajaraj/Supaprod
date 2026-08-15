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
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import {
  PromptBar,
  type PromptCommand,
  type PromptModel,
  type PromptSource,
} from "@/components/meridian/PromptBar";
import { RecommendationCard, type Recommendation } from "@/components/meridian/RecommendationCard";
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
import {
  StreamingText,
  type AnswerPart,
  type AnswerSource,
} from "@/components/meridian/StreamingText";
import { TaskRows, type Task } from "@/components/meridian/TaskRows";
import { Thinking, type ThinkingRow } from "@/components/meridian/Thinking";
import { ToolChips, type ToolChipDiff, type ToolChipRow } from "@/components/meridian/ToolChips";
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
        <p className="mt-1 max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">{note}</p>
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

/* ── the answer ────────────────────────────────────────────────────────── */

const ANSWER_PARTS: AnswerPart[] = [
  {
    kind: "text",
    text: "Twelve gates are pending and the oldest has been stopped since 18:31 on 10 August, which is eighty-six hours. Each one holds up exactly one named piece of work, and the oldest three are the same ask:",
  },
  {
    kind: "cite",
    source: { label: "Decide queue", where: "decide/queue", href: "#", kind: "board" },
  },
  {
    kind: "text",
    text: "whether to group the outage reports under one work item. Nothing on any surface said so, which is why the rail now carries the count. The one to answer first is the outage group, because it is the only one of the three with a spec already drafted behind it.",
  },
];

/*
 * Three sources, three DIFFERENT kinds, and one name deliberately too long for
 * its row. The reference lists three websites with three brand marks; ours are
 * the things this product actually reads, so the mark is the kind. Three
 * distinct kinds is the point — a stack of three identical marks would prove
 * nothing about whether the mark is doing any work.
 *
 * The long name is not padding. Every source name in production is generated
 * from a document title, and titles do not agree to be short; a fixture full of
 * tidy two-word labels is exactly what hides a truncation bug until a customer
 * finds it.
 */
const ANSWER_SOURCES: AnswerSource[] = [
  { label: "Decide queue", where: "decide/queue", href: "#", kind: "board" },
  {
    label: "Support inbox, ticket 4471 — outage reports from three accounts on the same evening",
    where: "inbox/4471",
    href: "#",
    kind: "ticket",
  },
  { label: "Field notes, week 32", where: "notes/w32", kind: "doc" },
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

const TOOL_ROWS: ToolChipRow[] = [
  {
    id: "tc1",
    kind: "read",
    label: "Read",
    argument: "src/server/discover/group.ts",
    mono: true,
    detailMono: true,
    detail: [
      { text: "export function groupSignals(input: Signal[])" },
      { text: "  const bySymptom = new Map<string, Signal[]>()" },
    ],
  },
  { id: "tc2", kind: "think", label: "Considered", argument: "three ways to key the groups" },
  {
    id: "tc3",
    kind: "write",
    label: "Edited",
    argument: "group.ts",
    mono: true,
    detail: [
      { text: "Key on symptom rather than on source", tone: "add" },
      { text: "Keep the source on each signal so a group can be traced back", tone: "add" },
    ],
  },
  {
    id: "tc4",
    kind: "run",
    label: "Ran",
    argument: "bun test discover",
    mono: true,
    detailMono: true,
    detail: [{ text: "14 pass, 0 fail, 1.9s" }],
  },
];

const TOOL_DIFFS: ToolChipDiff[] = [
  { file: "group.ts", add: 34, del: 12 },
  { file: "group.test.ts", add: 56 },
  { file: "signals.ts", del: 9 },
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
      <p className="text-[13px] leading-[1.75] text-mrd-body" style={{ maxWidth: "46ch" }}>
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
          <div className="flex flex-col gap-3 text-[13px] text-mrd-body">
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
          <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-mrd-body">
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
          title="Streaming text"
          note="An answer with its citations sitting inside the run of the prose, so a claim can be spot-checked without leaving the pane. The reveal is per character with a beat on punctuation, which is the timing the founder asked for on 2026-08-14, and it settles within a few seconds and stays settled. The wobble is derived from position rather than drawn at random, so both columns reveal in lockstep and a screenshot after it lands is repeatable."
        >
          <Pair>
            <Stack>
              <Case label="Nothing asked">
                <StreamingText parts={[]} />
              </Case>
              <Case label="The answer could not be read">
                <StreamingText
                  error="Ask stopped answering after thirty seconds, and nothing came back."
                  onRetry={noop}
                />
              </Case>
              <Case label="An answer arriving">
                {/*
                 * `loop` is set HERE and nowhere in the product. This panel sits
                 * about thirty panels down the page, and the reveal used to
                 * start on mount — so it ran, finished and settled several
                 * minutes before anyone scrolled to it, and what you arrived at
                 * was a finished paragraph. That is the founder's report on
                 * 2026-08-15 that streaming "pastes the entire block at once":
                 * it was accurate, and the cause was that nobody was in the
                 * room for the reveal. The component now waits until it is on
                 * screen before it starts, which is the real fix; the loop is
                 * what makes a WORKBENCH able to show the behaviour more than
                 * once. The reference loops for the same reason.
                 */}
                <StreamingText
                  parts={ANSWER_PARTS}
                  sources={ANSWER_SOURCES}
                  followUps={[
                    "Which of the twelve has been stopped longest?",
                    "What unblocks the three grouping gates at once?",
                  ]}
                  onFollowUp={noop}
                  onRetry={noop}
                  onCopy={noop}
                  onRate={noop}
                  loop
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
          title="Tool chips"
          note="Every row opens directly beneath itself, into a rail that starts at the row's own left edge, and nothing else on the surface moves. That is the fix for a touched file whose detail appeared somewhere the eye had to go hunting for. The argument chip is plainly a value and not a control, because an affordance that says press me and does nothing is what this component was picked to remove. The file summary is withheld while the run is going, since a count taken from a run that has not stopped changing things is wrong by the time it is read."
        >
          <Pair>
            <Stack>
              <Case label="Nothing called">
                <ToolChips rows={[]} />
              </Case>
              <Case label="Still going, so no file summary">
                <ToolChips
                  rows={TOOL_ROWS.slice(0, 2)}
                  diffs={TOOL_DIFFS}
                  working
                  messageCount={2}
                />
              </Case>
              <Case label="Settled, four calls and three files">
                <ToolChips
                  rows={TOOL_ROWS}
                  diffs={TOOL_DIFFS}
                  messageCount={2}
                  moreCount={2}
                  onSelectFile={noop}
                  onShowMore={noop}
                />
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
      </div>
    </div>
  );
}
