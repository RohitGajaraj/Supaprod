/**
 * P-36 (A-QUEUE.md). The banner mounts in the always-visible header row so
 * a pending gate stays answerable while the person is scrolled anywhere in
 * the transcript pane. It shares `TrackConsent`'s own query key and mutation
 * shape -- this test asserts that sharing, not a second read of the same
 * fact.
 */
import * as React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, test, expect, mock, afterEach } from "bun:test";
import type { TrackGate, TrackGatesResult } from "@/lib/spine/track.functions";

const startActual = await import("@tanstack/react-start");
mock.module("@tanstack/react-start", () => ({
  ...startActual,
  useServerFn: (fn: unknown) => fn,
}));

let gatesResult: TrackGatesResult = { open: [], settled: [], holdReason: null, unreadable: false };
let decideCalls: Array<{ approvalId: string; verdict: string }> = [];
const trackFunctionsActual = await import("@/lib/spine/track.functions");
mock.module("@/lib/spine/track.functions", () => ({
  ...trackFunctionsActual,
  getTrackGates: async () => gatesResult,
  decideTrackGate: async (input: { data: { approvalId: string; verdict: string } }) => {
    decideCalls.push({ approvalId: input.data.approvalId, verdict: input.data.verdict });
    return { status: "answered" };
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
      expect(decideCalls).toEqual([{ approvalId: gate().approvalId, verdict: "approve" }]),
    );
  });
});
