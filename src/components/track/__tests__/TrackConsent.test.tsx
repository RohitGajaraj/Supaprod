/**
 * P-36 (A-QUEUE.md). The founder opened the tablet track's run to answer
 * PR #4's merge gate and could not find the button: `.focus({preventScroll:
 * true})` on arrival moved a keyboard reader's focus to the gate region
 * without ever bringing the sighted view to it, so a card whose own answer
 * sat below a tall consequence block could open off screen with nothing
 * saying there was a button below.
 *
 * This renders the actual component against a real DOM (jsdom), mocking only
 * `scrollIntoView`/`focus` to observe whether the fix's two cases are told
 * apart correctly: a gate already open on arrival scrolls its own answer
 * buttons into view; a gate that opens LATER, while the pane is already
 * mounted, keeps the original P-16 behaviour (focus moves, the view does
 * not) so an actively-reading person is never yanked mid-read.
 */
import * as React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import {
  getTrackGates,
  decideTrackGate,
  decideTrackGateClass,
  type TrackGate,
  type TrackGatesResult,
} from "@/lib/spine/track.functions";
import { snoozeApprovalItem } from "@/lib/approvals-queue.functions";

/*
 * `@/lib/spine/track.functions` and `@/lib/approvals-queue.functions` are
 * left UNMOCKED here (a-module-mock-is-process-wide.test.ts): both already
 * have another test file replacing them process-wide (GateBanner.test.tsx
 * and AskPane.test.tsx respectively), and Bun's mocks are process-wide, so a
 * second file replacing the same module makes the suite's greenness depend
 * on load order. Interception happens one layer up instead, at
 * `useServerFn` -- already in the guard's own frozen shared set -- by
 * identity-matching the REAL, unmocked function references against what the
 * component actually calls.
 */
let gatesResult: TrackGatesResult = { open: [], settled: [], holdReason: null, unreadable: false };
const startActual = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...startActual,
  useServerFn: (fn: unknown) => {
    if (fn === getTrackGates) return async () => gatesResult;
    // P-115: real returns always carry `problems`/`refused`/`remaining`; a
    // mock missing them would let `res.problems.length` etc. throw
    // undetected the moment a test actually exercises a successful decide.
    if (fn === decideTrackGate)
      return async () => ({ status: "pending", problems: [] as string[] });
    if (fn === decideTrackGateClass)
      return async () => ({
        status: "pending",
        decided: [] as Array<{ approvalId: string }>,
        refused: [] as Array<{ approvalId: string; reason: string }>,
        remaining: 0,
        refusedAsUnsafeClass: false,
      });
    if (fn === snoozeApprovalItem) return async () => ({ ok: true });
    return fn;
  },
}));

const { TrackConsent } = await import("../TrackConsent");

const gate = (over: Partial<TrackGate> = {}): TrackGate => ({
  approvalId: "11111111-1111-4111-8111-111111111111",
  station: "build",
  toolName: "studio.pr.open",
  agentSlug: "builder",
  rationale: null,
  status: "pending",
  askedAtMs: Date.now() - 60_000,
  expiresAtMs: null,
  expiryDefault: null,
  snoozedUntilMs: null,
  classPendingElsewhere: 0,
  ...over,
});

function mount() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(
    <QueryClientProvider client={qc}>
      <TrackConsent trackId="t-1" />
    </QueryClientProvider>,
  );
  return { ...result, qc };
}

let scrollCalls: unknown[] = [];
let focusCalls: unknown[] = [];
const realScrollIntoView = Element.prototype.scrollIntoView;
const realFocus = HTMLElement.prototype.focus;

beforeEach(() => {
  gatesResult = { open: [], settled: [], holdReason: null, unreadable: false };
  scrollCalls = [];
  focusCalls = [];
  Element.prototype.scrollIntoView = function (this: Element, ...args: unknown[]) {
    scrollCalls.push(args[0]);
  } as typeof Element.prototype.scrollIntoView;
  HTMLElement.prototype.focus = function (this: HTMLElement, ...args: unknown[]) {
    focusCalls.push(args[0]);
  } as typeof HTMLElement.prototype.focus;
});

afterEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = realScrollIntoView;
  HTMLElement.prototype.focus = realFocus;
});

describe("arriving at a page that already has an open gate", () => {
  test("the first gate's own answer buttons are scrolled into view", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    mount();
    await screen.findByRole("group", { name: "Your answer" });
    await waitFor(() => expect(scrollCalls.length).toBeGreaterThan(0));
    expect(scrollCalls[0]).toEqual({ block: "nearest" });
    // Focus still moves too -- P-16's keyboard clause is unaffected.
    expect(focusCalls.length).toBeGreaterThan(0);
  });
});

describe("a gate opening while the pane is already mounted", () => {
  test("focus moves but the view does not, so an active read is never yanked", async () => {
    const { qc } = mount();
    // Nothing open on first render -- confirm the region really does start
    // empty before the gate arrives, and that arriving at nothing scrolls
    // nowhere (there is nothing to scroll to).
    await waitFor(() => expect(screen.queryByRole("group", { name: "Your answer" })).toBeNull());
    expect(scrollCalls).toEqual([]);

    // The 10s poll would pick this up in the real app; invalidating the same
    // query key here forces the identical 0-to-something transition without
    // needing fake timers.
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    await qc.invalidateQueries({ queryKey: ["track-gates", "t-1"] });
    await screen.findByRole("group", { name: "Your answer" });

    // Focus still moves -- P-16's keyboard clause holds for a live arrival
    // too -- but the view must not jump, which is the whole reason
    // `preventScroll: true` exists on this branch.
    expect(focusCalls.length).toBeGreaterThan(0);
    expect(scrollCalls).toEqual([]);
  });
});
