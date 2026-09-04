/**
 * P-36 (A-QUEUE.md). The banner mounts in the always-visible header row so
 * a pending gate stays answerable while the person is scrolled anywhere in
 * the transcript pane. It shares `TrackConsent`'s own query key and mutation
 * shape -- this test asserts that sharing, not a second read of the same
 * fact.
 *
 * `@/lib/spine/track.functions` is left UNMOCKED here on purpose
 * (a-module-mock-is-process-wide.test.ts): `TrackConsent.test.tsx` already
 * mock.module's that path, and Bun's mocks are process-wide, so a second
 * file replacing it would make the suite's greenness depend on load order.
 * Interception happens one layer up instead, at `useServerFn` -- already in
 * the guard's own frozen shared set -- by identity-matching the REAL,
 * unmocked function reference against what the component actually calls.
 */
import * as React from "react";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, mock, afterEach } from "bun:test";
import {
  getTrackGates,
  decideTrackGate,
  type TrackGate,
  type TrackGatesResult,
} from "@/lib/spine/track.functions";

let gatesResult: TrackGatesResult = { open: [], settled: [], holdReason: null, unreadable: false };
let decideCalls: Array<{ approvalId: string; verdict: string; reason?: string }> = [];
/** Overridable per test: what `decideTrackGate` resolves with. Defaults to
 *  the shape the real server function always returns (P-115: a prior version
 *  of this mock omitted `problems`, which `undefined.length` would throw on
 *  once the component started reading it). */
let decideResolves: () => {
  status: string;
  problems: string[];
} = () => ({ status: "answered", problems: [] });
/** Set to make the mock reject, so `decide.error` has something to render. */
let decideRejects: Error | null = null;

const startActual = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...startActual,
  useServerFn: (fn: unknown) => {
    if (fn === getTrackGates) return async () => gatesResult;
    if (fn === decideTrackGate)
      return async (input: { data: { approvalId: string; verdict: string; reason?: string } }) => {
        decideCalls.push({
          approvalId: input.data.approvalId,
          verdict: input.data.verdict,
          reason: input.data.reason,
        });
        if (decideRejects) throw decideRejects;
        return decideResolves();
      };
    return fn;
  },
}));

const { GateBanner } = await import("../GateBanner");

const gate = (over: Partial<TrackGate> = {}): TrackGate => ({
  approvalId: "22222222-2222-4222-8222-222222222222",
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
  return render(
    <QueryClientProvider client={qc}>
      <GateBanner trackId="t-1" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  gatesResult = { open: [], settled: [], holdReason: null, unreadable: false };
  decideCalls = [];
  decideResolves = () => ({ status: "answered", problems: [] });
  decideRejects = null;
});

describe("no gate open", () => {
  test("renders nothing", async () => {
    mount();
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Waiting on you" })).toBeNull(),
    );
  });
});

describe("a gate is open", () => {
  test("shows the question and answers through the same mutation TrackConsent uses", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    mount();
    const region = await screen.findByRole("region", { name: "Waiting on you" });
    expect(region.textContent).toBeTruthy();

    screen.getByText("Let it run").click();
    await waitFor(() =>
      expect(decideCalls).toEqual([
        { approvalId: gate().approvalId, verdict: "approve", reason: undefined },
      ]),
    );
  });
});

/*
 * P-115 (A-QUEUE.md). Live 06:04-06:08 UTC 09-04: "Don't run it" sent
 * `{approvalId, verdict: "reject"}` with no reason, the server's own schema
 * refuses a reasonless reject, and the banner rendered nothing -- no message,
 * no field, the same two buttons, three presses in a row. These assert the
 * fix's own three parts: the field opens instead of deciding directly, a
 * reject can only ever leave this component WITH a reason, and a refusal
 * (thrown or a soft `problems` entry) renders where the press was made.
 */
describe("declining opens the reason field, per P-115", () => {
  test("pressing Don't run it opens the field instead of deciding", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    mount();
    await screen.findByRole("region", { name: "Waiting on you" });

    fireEvent.click(screen.getByText("Don't run it"));
    expect(screen.getByLabelText("What should it do instead?")).toBeTruthy();
    // No reject has been sent yet -- opening the field is not deciding.
    expect(decideCalls).toEqual([]);
  });

  test("a reject can only leave this component carrying a reason", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    mount();
    await screen.findByRole("region", { name: "Waiting on you" });

    fireEvent.click(screen.getByText("Don't run it"));
    fireEvent.change(screen.getByLabelText("What should it do instead?"), {
      target: { value: "Ship behind a flag first" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Don't run it, do this instead" }));

    await waitFor(() =>
      expect(decideCalls).toEqual([
        {
          approvalId: gate().approvalId,
          verdict: "reject",
          reason: "Ship behind a flag first",
        },
      ]),
    );
  });

  test("a thrown refusal renders where the press was made", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    decideRejects = new Error("Declining records why. Say what was wrong with it.");
    mount();
    await screen.findByRole("region", { name: "Waiting on you" });

    fireEvent.click(screen.getByText("Don't run it"));
    fireEvent.change(screen.getByLabelText("What should it do instead?"), {
      target: { value: "Not this run" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Don't run it, do this instead" }));

    await screen.findByText(/Your answer was not recorded, so the call still stands\./);
  });

  test("a soft `problems` entry on a settled decide renders too", async () => {
    gatesResult = { open: [gate()], settled: [], holdReason: null, unreadable: false };
    decideResolves = () => ({
      status: "rejected",
      problems: ["Your note was not passed on to the run."],
    });
    mount();
    await screen.findByRole("region", { name: "Waiting on you" });

    fireEvent.click(screen.getByText("Don't run it"));
    fireEvent.change(screen.getByLabelText("What should it do instead?"), {
      target: { value: "Not this run" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Don't run it, do this instead" }));

    await screen.findByText("Your note was not passed on to the run.");
  });
});
