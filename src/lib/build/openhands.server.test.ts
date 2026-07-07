import { describe, expect, test } from "bun:test";
import {
  buildDelegateTask,
  createOpenHandsBuildDriver,
  mapDelegateStatus,
} from "./openhands.server";
import type { BuildDriverContext, BuildSpec } from "./driver";
import type { DelegateProvider, DelegateRequest, DelegateVerdict } from "@/lib/delegate/provider";
import type { DelegatePollResult, FoldInput } from "@/lib/delegate/poll.server";

const SPEC: BuildSpec = {
  goal: "Add a rate limiter to the login endpoint",
  acceptanceCriteria: ["p95 latency stays under 200ms", "lockout after 5 failures"],
  guardrails: ["no new dependencies"],
  repo: { url: "https://github.com/acme/app", baseBranch: "main" },
};

const CTX = {
  supabase: {},
  userId: "u1",
  workspaceId: "w1",
  missionId: "m1",
  runId: "r1",
} as unknown as BuildDriverContext;

function fakeProvider(opts: { available?: boolean; verdict?: Partial<DelegateVerdict> } = {}) {
  const calls: DelegateRequest[] = [];
  const provider: DelegateProvider = {
    id: "openhands",
    available: opts.available ?? true,
    async submit(req: DelegateRequest): Promise<DelegateVerdict> {
      calls.push(req);
      return {
        provider: "openhands",
        accepted: true,
        externalJobId: "conv_9",
        reason: "openhands: accepted",
        ...opts.verdict,
      };
    },
  };
  return { provider, calls };
}

describe("buildDelegateTask (pure spec → task fold)", () => {
  test("carries goal, acceptance criteria, and guardrails into the task text", () => {
    const task = buildDelegateTask(SPEC);
    expect(task).toContain(SPEC.goal);
    expect(task).toContain("Acceptance criteria (every one must hold):");
    expect(task).toContain("- p95 latency stays under 200ms");
    expect(task).toContain("Guardrails (hard constraints):");
    expect(task).toContain("- no new dependencies");
  });

  test("a bare goal stays a bare goal (no empty section headers)", () => {
    const task = buildDelegateTask({ goal: "just build it" });
    expect(task).toBe("just build it");
  });
});

describe("mapDelegateStatus (delegate → BuildStatus)", () => {
  test("maps each delegate bucket to the seam-wide status", () => {
    expect(mapDelegateStatus("queued")).toBe("queued");
    expect(mapDelegateStatus("running")).toBe("running");
    expect(mapDelegateStatus("done")).toBe("done");
    expect(mapDelegateStatus("failed")).toBe("failed");
    expect(mapDelegateStatus("disabled")).toBe("unknown");
    expect(mapDelegateStatus("unknown")).toBe("unknown");
  });
});

describe("openhands build driver, dispatch (delegates to the provider seam)", () => {
  test("submits through the resolved provider and returns the session handle", async () => {
    const { provider, calls } = fakeProvider();
    const driver = createOpenHandsBuildDriver({ resolveProvider: () => provider });

    const session = await driver.dispatch(CTX, SPEC);
    expect(calls.length).toBe(1);
    expect(calls[0].task).toContain(SPEC.goal);
    expect(calls[0].task).toContain("lockout after 5 failures");
    expect(calls[0].repoUrl).toBe("https://github.com/acme/app");
    expect(calls[0].baseBranch).toBe("main");
    expect(calls[0].cadenceRunId).toBe("r1");
    expect(session).toEqual({
      driver: "openhands",
      missionId: "m1",
      runId: "r1",
      externalJobId: "conv_9",
    });
  });

  test("a refused verdict throws with the provider's reason (no phantom session)", async () => {
    const { provider } = fakeProvider({
      verdict: { accepted: false, externalJobId: null, reason: "delegate-out is disabled" },
    });
    const driver = createOpenHandsBuildDriver({ resolveProvider: () => provider });
    await expect(driver.dispatch(CTX, SPEC)).rejects.toThrow("delegate-out is disabled");
  });

  test("requires ctx.missionId (folds onto an existing mission, never creates one)", async () => {
    const { provider, calls } = fakeProvider();
    const driver = createOpenHandsBuildDriver({ resolveProvider: () => provider });
    const ctx = { ...CTX, missionId: undefined } as unknown as BuildDriverContext;
    await expect(driver.dispatch(ctx, SPEC)).rejects.toThrow("missionId");
    expect(calls.length).toBe(0);
  });

  test("available() reflects the resolved provider's availability", () => {
    const on = createOpenHandsBuildDriver({
      resolveProvider: () => fakeProvider({ available: true }).provider,
    });
    const off = createOpenHandsBuildDriver({
      resolveProvider: () => fakeProvider({ available: false }).provider,
    });
    expect(on.available()).toBe(true);
    expect(off.available()).toBe(false);
  });
});

describe("openhands build driver, poll / result / cancel", () => {
  const session = {
    driver: "openhands",
    missionId: "m1",
    runId: "r1",
    externalJobId: "conv_9",
  } as const;

  test("poll maps the delegate poll status; no external job id polls nothing", async () => {
    let polled = 0;
    const driver = createOpenHandsBuildDriver({
      pollJob: async () => {
        polled += 1;
        return { status: "running" } satisfies DelegatePollResult;
      },
    });
    expect(await driver.poll(CTX, { ...session })).toBe("running");
    expect(polled).toBe(1);
    expect(await driver.poll(CTX, { driver: "openhands", missionId: "m1" })).toBe("unknown");
    expect(polled).toBe(1);
  });

  test("result on a terminal poll folds back through foldDelegateResult and surfaces the summary", async () => {
    const folds: FoldInput[] = [];
    const driver = createOpenHandsBuildDriver({
      pollJob: async () => ({ status: "done", result: "opened PR #7" }),
      foldResult: async (input) => {
        folds.push(input);
      },
    });
    const result = await driver.result(CTX, { ...session });
    expect(result.status).toBe("done");
    expect(result.summary).toBe("opened PR #7");
    expect(result.refs).toEqual({ missionId: "m1", externalJobId: "conv_9" });
    expect(folds.length).toBe(1);
    expect(folds[0].runId).toBe("r1");
    expect(folds[0].missionId).toBe("m1");
    expect(folds[0].provider).toBe("openhands");
    expect(folds[0].externalJobId).toBe("conv_9");
  });

  test("result on a non-terminal poll does NOT fold", async () => {
    let folded = 0;
    const driver = createOpenHandsBuildDriver({
      pollJob: async () => ({ status: "running" }),
      foldResult: async () => {
        folded += 1;
      },
    });
    const result = await driver.result(CTX, { ...session });
    expect(result.status).toBe("running");
    expect(folded).toBe(0);
  });

  test("result without a runId cannot fold (nothing to write onto) but still reports", async () => {
    let folded = 0;
    const driver = createOpenHandsBuildDriver({
      pollJob: async () => ({ status: "failed", error: "sandbox crashed" }),
      foldResult: async () => {
        folded += 1;
      },
    });
    const result = await driver.result(CTX, {
      driver: "openhands",
      missionId: "m1",
      externalJobId: "conv_9",
    });
    expect(result.status).toBe("failed");
    expect(result.summary).toBe("sandbox crashed");
    expect(folded).toBe(0);
  });

  test("cancel is honestly unsupported", async () => {
    const driver = createOpenHandsBuildDriver({});
    expect(await driver.cancel(CTX, { ...session })).toEqual({
      ok: false,
      reason: "unsupported by OpenHands adapter",
    });
  });
});
