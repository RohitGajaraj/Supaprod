// W5b: dispatch repo-gate tests (pure module, resolver mocked, no I/O).

import { describe, it, expect } from "bun:test";
import {
  classifyRepoResolution,
  isRepoNotConnectedError,
  gateDispatch,
  provisionThenRetry,
} from "./repo-gate";

const NOT_CONNECTED =
  "GitHub is not connected. Connect it in Settings → Connected accounts, then bind a repo on Connectors.";

describe("classifyRepoResolution", () => {
  it("reports resolvable with the repo when the resolver resolves", async () => {
    const verdict = await classifyRepoResolution(async () => ({ repo: "acme/notes" }));
    expect(verdict).toEqual({ repoResolvable: true, repo: "acme/notes" });
  });

  it("reports not resolvable with the resolver's own message when it throws", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw new Error(NOT_CONNECTED);
    });
    expect(verdict.repoResolvable).toBe(false);
    expect(verdict.reason).toBe(NOT_CONNECTED);
    expect(verdict.repo).toBeUndefined();
  });

  it("stringifies a non-Error throw into the reason", async () => {
    const verdict = await classifyRepoResolution(async () => {
      throw "no binding";
    });
    expect(verdict).toEqual({ repoResolvable: false, reason: "no binding" });
  });
});

describe("isRepoNotConnectedError", () => {
  it("matches resolveGitHub's not-connected refusal, case-insensitively", () => {
    expect(isRepoNotConnectedError(NOT_CONNECTED)).toBe(true);
    expect(isRepoNotConnectedError("GITHUB IS NOT CONNECTED.")).toBe(true);
  });

  it("does not match unrelated dispatch errors", () => {
    expect(isRepoNotConnectedError("Spec lookup failed: not found")).toBe(false);
    expect(isRepoNotConnectedError("rate limit exceeded")).toBe(false);
  });
});

describe("gateDispatch", () => {
  it("dispatches when the pre-check says resolvable", async () => {
    const calls: string[] = [];
    await gateDispatch({
      check: async () => ({ repoResolvable: true, repo: "acme/notes" }),
      dispatch: () => calls.push("dispatch"),
      openGate: () => calls.push("gate"),
    });
    expect(calls).toEqual(["dispatch"]);
  });

  it("opens the gate with the reason when the pre-check says no", async () => {
    const calls: string[] = [];
    let gateReason: string | null = "unset";
    await gateDispatch({
      check: async () => ({ repoResolvable: false, reason: NOT_CONNECTED }),
      dispatch: () => calls.push("dispatch"),
      openGate: (reason) => {
        calls.push("gate");
        gateReason = reason;
      },
    });
    expect(calls).toEqual(["gate"]);
    expect(gateReason).toBe(NOT_CONNECTED);
  });

  it("opens the gate with a null reason when the verdict carries none", async () => {
    let gateReason: string | null = "unset";
    await gateDispatch({
      check: async () => ({ repoResolvable: false }),
      dispatch: () => {},
      openGate: (reason) => {
        gateReason = reason;
      },
    });
    expect(gateReason).toBeNull();
  });

  it("dispatches anyway when the pre-check itself fails (advisory only)", async () => {
    const calls: string[] = [];
    await gateDispatch({
      check: async () => {
        throw new Error("network down");
      },
      dispatch: () => calls.push("dispatch"),
      openGate: () => calls.push("gate"),
    });
    expect(calls).toEqual(["dispatch"]);
  });
});

describe("provisionThenRetry", () => {
  it("provisions first, retries after, and returns the provisioned repo", async () => {
    const order: string[] = [];
    const repo = { owner: "acme", repo: "notes", htmlUrl: "https://github.com/acme/notes" };
    const result = await provisionThenRetry(
      async () => {
        order.push("provision");
        return repo;
      },
      () => {
        order.push("retry");
      },
    );
    expect(order).toEqual(["provision", "retry"]);
    expect(result).toBe(repo);
  });

  it("awaits an async retry before resolving", async () => {
    const order: string[] = [];
    await provisionThenRetry(
      async () => {
        order.push("provision");
        return { ok: true };
      },
      async () => {
        await Promise.resolve();
        order.push("retry");
      },
    );
    expect(order).toEqual(["provision", "retry"]);
  });

  it("never retries when provisioning fails, and the failure propagates", async () => {
    const order: string[] = [];
    await expect(
      provisionThenRetry(
        async () => {
          throw new Error("repo name already taken");
        },
        () => {
          order.push("retry");
        },
      ),
    ).rejects.toThrow("repo name already taken");
    expect(order).toEqual([]);
  });
});
